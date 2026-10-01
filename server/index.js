
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const https = require("https");

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

/* =========================================================
   FEATURED VIDEOS
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
   OPENSTREETMAP OVERPASS REQUEST HELPER
========================================================= */

const OVERPASS_TIMEOUT_MS = 12000;
const OVERPASS_CACHE_TTL_MS = 45000;
const MAX_MAP_QUERY_LENGTH = 20000;

// Cache successful responses briefly to reduce repeated requests.
const mapPlacesCache = new Map();

// Reuse an active request when multiple clients submit the same query.
const mapPlacesInFlight = new Map();

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

function requestOverpass(endpoint, query, timeoutMs = OVERPASS_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    let url;

    try {
      url = new URL(endpoint);
    } catch {
      reject(new Error("Invalid Overpass provider URL."));
      return;
    }

    const body = new URLSearchParams({
      data: query,
    }).toString();

    const request = https.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded; charset=UTF-8",
          "Content-Length": Buffer.byteLength(body),
          Accept: "application/json",
          "User-Agent": "CalbayogCityTourism/1.0",
        },
      },
      (response) => {
        let responseBody = "";
        let settled = false;

        const finish = (callback, value) => {
          if (settled) return;
          settled = true;
          callback(value);
        };

        response.setEncoding("utf8");

        response.on("data", (chunk) => {
          responseBody += chunk;

          // Avoid retaining an unexpectedly large response in memory.
          if (responseBody.length > 12 * 1024 * 1024) {
            response.destroy(
              new Error("Overpass response exceeded the size limit.")
            );
          }
        });

        response.on("end", () => {
          finish(resolve, {
            statusCode: response.statusCode || 0,
            body: responseBody,
          });
        });

        response.on("error", (error) => {
          finish(reject, error);
        });
      }
    );

    request.setTimeout(timeoutMs, () => {
      request.destroy(
        new Error(`Request timed out after ${timeoutMs} ms`)
      );
    });

    request.on("error", reject);
    request.end(body);
  });
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
        const errorMessage = `${endpoint} returned invalid JSON`;

        console.warn(`[Map Places] ${errorMessage}`);
        providerErrors.push(errorMessage);
        continue;
      }

      if (!data || !Array.isArray(data.elements)) {
        const errorMessage = `${endpoint} returned no elements array`;

        console.warn(
          `[Map Places] ${errorMessage}:`,
          data?.remark || "Unexpected response format"
        );

        providerErrors.push(errorMessage);
        continue;
      }

      if (data.remark) {
        console.warn(
          `[Map Places] Provider remark from ${endpoint}:`,
          data.remark
        );
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
      const errorMessage = error?.message || "Unknown provider error";

      console.warn(
        `[Map Places] Provider failed: ${endpoint}: ${errorMessage}`
      );

      providerErrors.push(`${endpoint}: ${errorMessage}`);
    }
  }

  const error = new Error("All Overpass providers failed.");
  error.providerErrors = providerErrors;
  throw error;
}

/* =========================================================
   OPENSTREETMAP NEARBY PLACES PROXY
========================================================= */

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

  const cacheKey = normalizedQuery;
  const cached = mapPlacesCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < OVERPASS_CACHE_TTL_MS) {
    console.log("[Map Places] Returning cached response.");

    return res.status(200).json({
      success: true,
      elements: cached.elements,
      cached: true,
    });
  }

  // Remove expired cache entry.
  if (cached) {
    mapPlacesCache.delete(cacheKey);
  }

  try {
    let activeRequest = mapPlacesInFlight.get(cacheKey);

    if (!activeRequest) {
      activeRequest = fetchNearbyMapData(normalizedQuery);
      mapPlacesInFlight.set(cacheKey, activeRequest);
    } else {
      console.log("[Map Places] Reusing an in-progress request.");
    }

    const result = await activeRequest;

    // Cache only successful results.
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
    console.error("[Map Places] All providers failed.");

    if (Array.isArray(error.providerErrors)) {
      for (const providerError of error.providerErrors) {
        console.error(`[Map Places] ${providerError}`);
      }
    }

    return res.status(502).json({
      success: false,
      code: "OVERPASS_UNAVAILABLE",
      message:
        "Nearby places are temporarily unavailable. Please try again later.",
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
  Skip automatic seed.
  Existing data is populated through SQL.
*/

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
