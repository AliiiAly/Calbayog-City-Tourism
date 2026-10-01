
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

app.use(
  express.json({
    limit: "50mb",
  })
);

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
  express.static(
    path.join(__dirname, "..", "uploads")
  )
);

/* =========================================================
   PROMO VIDEO
========================================================= */

app.use(
  "/promo.mp4",
  express.static(
    path.join(
      __dirname,
      "..",
      "uploads",
      "promo.mp4"
    )
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

/*
  Uses Node's built-in HTTPS module instead of global fetch.

  This avoids relying on Node's global fetch being available.
  It does not guarantee that an Overpass provider will respond;
  the route below tries multiple providers and logs failures.
*/

function requestOverpass(endpoint, query, timeoutMs = 22000) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);

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

        response.setEncoding("utf8");

        response.on("data", (chunk) => {
          responseBody += chunk;
        });

        response.on("end", () => {
          resolve({
            statusCode: response.statusCode || 0,
            body: responseBody,
          });
        });

        response.on("error", reject);
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
   OPENSTREETMAP NEARBY PLACES PROXY
========================================================= */

/*
  The frontend calls this Render endpoint.

  Nearby OSM data is returned to the frontend only.
  This endpoint does NOT insert or update Supabase records.
*/

app.post("/api/map/places", async (req, res) => {
  const query = req.body?.query;

  if (
    typeof query !== "string" ||
    !query.trim()
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid Overpass query is required.",
    });
  }

  if (query.length > 20000) {
    return res.status(413).json({
      success: false,
      message: "The map query is too large.",
    });
  }

  // Accept only Overpass QL queries requesting JSON.
  if (
    !/^\s*\[out:json(?:[,\]])/i.test(query)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid Overpass query format.",
    });
  }

  // Try different public Overpass providers.
  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`[Map Places] Requesting ${endpoint}`);

      const result = await requestOverpass(
        endpoint,
        query,
        22000
      );

      if (
        result.statusCode < 200 ||
        result.statusCode >= 300
      ) {
        console.warn(
          `[Map Places] ${endpoint} returned HTTP ${result.statusCode}.`,
          result.body.slice(0, 500)
        );

        continue;
      }

      let data;

      try {
        data = JSON.parse(result.body);
      } catch (error) {
        console.warn(
          `[Map Places] Invalid JSON from ${endpoint}:`,
          result.body.slice(0, 300)
        );

        continue;
      }

      if (!Array.isArray(data.elements)) {
        console.warn(
          `[Map Places] Missing elements array from ${endpoint}.`,
          data.remark || "No provider details"
        );

        continue;
      }

      if (data.remark) {
        console.warn(
          `[Map Places] Provider remark from ${endpoint}:`,
          data.remark
        );
      }

      console.log(
        `[Map Places] Success: ${data.elements.length} map elements received from ${endpoint}.`
      );

      return res.status(200).json({
        success: true,
        elements: data.elements,
      });
    } catch (error) {
      console.error(
        `[Map Places] Provider failed: ${endpoint}`,
        error.message
      );
    }
  }

  console.error(
    "[Map Places] All Overpass providers failed. Check the preceding provider logs."
  );

  return res.status(502).json({
    success: false,
    code: "OVERPASS_UNAVAILABLE",
    message:
      "Nearby places are temporarily unavailable. Please try again later.",
  });
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
