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
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin
      // (mobile apps, curl, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow localhost variants
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

/*
  Serve uploads from:
  c:\Calbayog_City_Tourism\uploads
*/

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

app.use(
  "/api/auth",
  require("./src/routes/auth")
);

app.use(
  "/api/destinations",
  require("./src/routes/destinations")
);

app.use(
  "/api/events",
  require("./src/routes/events")
);

app.use(
  "/api/accommodations",
  require("./src/routes/accommodations")
);

app.use(
  "/api/guides",
  require("./src/routes/guides")
);

app.use(
  "/api/itinerary-requests",
  require("./src/routes/itinerary")
);

app.use(
  "/api/feedback",
  require("./src/routes/feedback")
);

app.use(
  "/api/upload",
  require("./src/routes/upload")
);

app.use(
  "/api/admin-management",
  require("./src/routes/adminManagement")
);

/* =========================================================
   FEATURED VIDEOS
========================================================= */

app.use(
  "/api/featured-videos",
  require("./src/routes/featuredVideos")
);

app.use(
  "/api/getting-there",
  require("./src/routes/gettingThere")
);

app.use(
  "/api/notifications",
  require("./src/routes/notifications")
);

/* =========================================================
   USER MEMORIES
========================================================= */

app.use(
  "/api/memories",
  require("./src/routes/memories")
);

/* =========================================================
   FAVORITES
========================================================= */

app.use(
  "/api/favorites",
  require("./src/routes/favorites")
);

/* =========================================================
   USER ITINERARIES
========================================================= */

app.use(
  "/api/itineraries",
  require("./src/routes/itineraries")
);

/* =========================================================
   OPENSTREETMAP NEARBY PLACES PROXY
========================================================= */

/*
  The Vercel frontend calls this Render endpoint instead
  of requesting Overpass directly from the browser.

  This returns external map data only.
  It does NOT save anything to Supabase.
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

  const endpoints = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
  ];

  for (const endpoint of endpoints) {
    let timeout;

    try {
      const controller = new AbortController();

      timeout = setTimeout(() => {
        controller.abort();
      }, 25000);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent":
            "CalbayogCityTourism/1.0",
        },
        body: new URLSearchParams({
          data: query,
        }).toString(),
        signal: controller.signal,
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.warn(
          `Overpass returned HTTP ${response.status}: ${endpoint}`
        );

        continue;
      }

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        console.warn(
          `Overpass returned invalid JSON: ${endpoint}`
        );

        continue;
      }

      return res.json({
        success: true,
        elements: Array.isArray(data.elements)
          ? data.elements
          : [],
      });
    } catch (error) {
      console.warn(
        `Overpass request failed (${endpoint}):`,
        error.message
      );
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }

  return res.status(502).json({
    success: false,
    message:
      "Nearby places are temporarily unavailable. Please try again later.",
  });
});

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date(),
    });
  }
);

/* =========================================================
   START SERVER
========================================================= */

/*
  Skip automatic seed.
  Data is already populated through SQL.
*/

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `🚀 Server running on port ${PORT}`
    );
  }
);
