require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const seedAll = require("./src/utils/seed");
const supabase = require("./src/config/supabase");

const app = express();
const PORT = process.env.PORT || 5000;

/* =========================================================
   CORS
========================================================= */

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost",
  "http://localhost:80",
  "capacitor://localhost",
  "ionic://localhost",
  "http://192.168.254.113:5173",
  "https://calbayog-city-tourism.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (
        origin.startsWith("http://localhost") ||
        origin.startsWith("capacitor://") ||
        origin.startsWith("ionic://")
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

/* =========================================================
   BODY PARSING
========================================================= */

app.use(express.json({ limit: "50mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "50mb",
  })
);

app.use(
  express.raw({
    type: "application/octet-stream",
    limit: "50mb",
  })
);

/* =========================================================
   STATIC FILES
========================================================= */

app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "uploads"))
);

app.use(
  "/promo.mp4",
  express.static(
    path.join(__dirname, "..", "uploads", "promo.mp4")
  )
);

/* =========================================================
   API ROUTES
========================================================= */

app.use("/api/auth", require("./src/routes/auth"));
app.use("/api/destinations", require("./src/routes/destinations"));
app.use("/api/events", require("./src/routes/events"));
app.use("/api/accommodations", require("./src/routes/accommodations"));
app.use("/api/guides", require("./src/routes/guides"));
app.use("/api/itinerary-requests", require("./src/routes/itinerary"));
app.use("/api/feedback", require("./src/routes/feedback"));
app.use("/api/upload", require("./src/routes/upload"));
app.use("/api/admin-management", require("./src/routes/adminManagement"));
app.use("/api/users", require("./src/routes/users"));

/* =========================================================
   FEATURED VIDEOS AND OTHER ROUTES
========================================================= */

app.use("/api/featured-videos", require("./src/routes/featuredVideos"));
app.use("/api/getting-there", require("./src/routes/gettingThere"));
app.use("/api/notifications", require("./src/routes/notifications"));

/* =========================================================
   USER MEMORIES
========================================================= */

app.use("/api/memories", require("./src/routes/memories"));

/* =========================================================
   FAVORITES
========================================================= */

app.use("/api/favorites", require("./src/routes/favorites"));

/* =========================================================
   USER ITINERARIES
========================================================= */

app.use("/api/itineraries", require("./src/routes/itineraries"));

/* =========================================================
   OPENSTREETMAP OVERPASS CONFIGURATION
========================================================= */

// Give each provider enough time to process the map query.
const OVERPASS_TIMEOUT_MS = 27000;

const OVERPASS_CACHE_TTL_MS = 45000;
const MAX_MAP_QUERY_LENGTH = 20000;
const MAX_MAP_RESULTS = 100;

// Cache successful responses briefly to reduce repeated requests.
const mapPlacesCache = new Map();

// Reuse an active request when multiple clients submit the same query.
const mapPlacesInFlight = new Map();

/*
 * Provider failover:
 * If one Overpass instance fails, the next provider is tried.
 */
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.nchc.org.tw/api/interpreter",
];

/* =========================================================
   REQUEST ONE OVERPASS PROVIDER
========================================================= */

/*
 * Use Node's built-in fetch instead of manually managing an
 * HTTPS request. This makes response handling and timeouts
 * easier to control.
 *
 * Requires a Node.js version with built-in fetch (Node 18+).
 */
async function requestOverpass(
  endpoint,
  query,
  timeoutMs = OVERPASS_TIMEOUT_MS
) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded; charset=UTF-8",
        Accept: "application/json",
        "User-Agent": "CalbayogCityTourism/1.0",
      },
      body: new URLSearchParams({
        data: query,
      }).toString(),
      signal: controller.signal,
    });

    const responseBody = await response.text();

    return {
      statusCode: response.status,
      body: responseBody,
    };
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(
        `Request timed out after ${timeoutMs} ms`
      );
    }

    throw new Error(
      error instanceof Error
        ? error.message
        : "Network request to the Overpass provider failed."
    );
  } finally {
    clearTimeout(timeout);
  }
}

/* =========================================================
   OVERPASS PROVIDER FAILOVER
========================================================= */

async function fetchNearbyMapData(query) {
  const providerErrors = [];

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      console.log(`[Map Places] Requesting ${endpoint}`);

      const result = await requestOverpass(
        endpoint,
        query,
        OVERPASS_TIMEOUT_MS
      );

      if (result.statusCode < 200 || result.statusCode >= 300) {
        const errorMessage =
          `${endpoint} returned HTTP ${result.statusCode}`;

        console.warn(
          `[Map Places] ${errorMessage}:`,
          result.body.slice(0, 300)
        );

        providerErrors.push(errorMessage);
        continue;
      }

      let data;

      try {
        data = JSON.parse(result.body);
      } catch {
        const errorMessage =
          `${endpoint} returned invalid JSON`;

        console.warn(`[Map Places] ${errorMessage}`);
        providerErrors.push(errorMessage);
        continue;
      }

      if (!data || !Array.isArray(data.elements)) {
        const errorMessage =
          `${endpoint} returned no elements array`;

        console.warn(
          `[Map Places] ${errorMessage}:`,
          data?.remark || "Unexpected response format"
        );

        providerErrors.push(errorMessage);
        continue;
      }

      /*
       * Overpass may return a remark when a query exceeds its
       * execution limits. Do not treat an incomplete response
       * as a successful nearby-places result.
       */
      if (data.remark) {
        const errorMessage =
          `${endpoint} reported: ${data.remark}`;

        console.warn(`[Map Places] ${errorMessage}`);

        providerErrors.push(errorMessage);
        continue;
      }

      console.log(
        `[Map Places] Success: ${data.elements.length} elements from ${endpoint}`
      );

      return {
        success: true,
        elements: data.elements,
        provider: endpoint,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown provider error";

      console.warn(
        `[Map Places] Provider failed: ${endpoint}: ${errorMessage}`
      );

      providerErrors.push(
        `${endpoint}: ${errorMessage}`
      );
    }
  }

  const error = new Error(
    "All Overpass providers failed."
  );

  error.providerErrors = providerErrors;

  throw error;
}

/* =========================================================
   OPENSTREETMAP NEARBY PLACES API
========================================================= */

/*
 * This endpoint is intentionally defined in this server file.
 * Do NOT create a separate map.js file for this implementation.
 *
 * Frontend request:
 * POST /api/map/places
 * Body: { "query": "<Overpass QL query>" }
 */
app.post("/api/map/places", async (req, res) => {
  const query = req.body?.query;

  if (typeof query !== "string" || !query.trim()) {
    return res.status(400).json({
      success: false,
      message: "A valid Overpass query is required.",
    });
  }

  const normalizedQuery = query.trim();

  if (normalizedQuery.length > MAX_MAP_QUERY_LENGTH) {
    return res.status(413).json({
      success: false,
      message: "The map query is too large.",
    });
  }

  // Accept only Overpass QL queries requesting JSON.
  if (!/^\s*\[out:json(?:[,\]])/i.test(normalizedQuery)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Overpass query format.",
    });
  }

  /*
   * Limit the output size to avoid unnecessarily large responses.
   * This changes the final output statement only; the query's
   * filters and selected geographic area remain unchanged.
   */
  const optimizedQuery = normalizedQuery.replace(
    /\bout\s+center\s+tags\s*;/i,
    `out center tags ${MAX_MAP_RESULTS};`
  );

  const cacheKey = optimizedQuery;

  const cached = mapPlacesCache.get(cacheKey);

  if (
    cached &&
    Date.now() - cached.timestamp < OVERPASS_CACHE_TTL_MS
  ) {
    console.log("[Map Places] Returning cached response.");

    return res.status(200).json({
      success: true,
      elements: cached.elements,
      cached: true,
    });
  }

  // Remove expired cache entries.
  if (cached) {
    mapPlacesCache.delete(cacheKey);
  }

  try {
    let activeRequest = mapPlacesInFlight.get(cacheKey);

    if (!activeRequest) {
      activeRequest = fetchNearbyMapData(optimizedQuery);

      mapPlacesInFlight.set(cacheKey, activeRequest);
    } else {
      console.log(
        "[Map Places] Reusing an in-progress request."
      );
    }

    const result = await activeRequest;

    // Cache successful responses only.
    mapPlacesCache.set(cacheKey, {
      elements: result.elements,
      timestamp: Date.now(),
    });

    // Prevent unbounded cache growth.
    if (mapPlacesCache.size > 100) {
      const oldestKey = mapPlacesCache.keys().next().value;

      if (oldestKey !== undefined) {
        mapPlacesCache.delete(oldestKey);
      }
    }

    return res.status(200).json({
      success: true,
      elements: result.elements,
      cached: false,
    });
  } catch (error) {
    console.error(
      "[Map Places] All Overpass providers failed."
    );

    if (Array.isArray(error.providerErrors)) {
      for (const providerError of error.providerErrors) {
        console.error(
          `[Map Places] ${providerError}`
        );
      }
    } else {
      console.error(
        "[Map Places] Unexpected error:",
        error instanceof Error
          ? error.message
          : error
      );
    }

    return res.status(502).json({
      success: false,
      code: "OVERPASS_UNAVAILABLE",
      message:
        "Nearby places are temporarily unavailable. You can still search for a location or place the pin manually.",
    });
  } finally {
    mapPlacesInFlight.delete(cacheKey);
  }
});

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date(),
  });
});

/* =========================================================
   START SERVER
========================================================= */

/*
 * Skip automatic seed.
 * Existing data is populated through SQL.
 */

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
