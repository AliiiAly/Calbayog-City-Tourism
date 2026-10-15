const express = require("express");
const axios = require("axios");

const { protect } = require("../middleware/auth");

const router = express.Router();

/* =========================================================
   SUPABASE CONFIGURATION
========================================================= */

const getSupabaseUrl = () => {
  const url = process.env.SUPABASE_URL;

  if (!url) {
    throw new Error("SUPABASE_URL is not configured on the server.");
  }

  return url.replace(/\/+$/, "");
};

const getHeaders = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured on the server."
    );
  }

  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
};

const TABLE_URL = () => `${getSupabaseUrl()}/rest/v1/restaurants`;

/* =========================================================
   ADMIN AUTHORIZATION
========================================================= */

const requireAdmin = (req, res, next) => {
  const auth = req.auth || req.user || req.admin;

  if (!auth) {
    return res.status(401).json({
      message: "Authentication required.",
    });
  }

  if (auth.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required.",
    });
  }

  return next();
};

/* =========================================================
   NORMALIZERS
========================================================= */

const normalizeString = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();

  return trimmed.length > 0 ? trimmed : null;
};

const normalizeImages = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (image) => typeof image === "string" && image.trim().length > 0
  );
};

const normalizeNumber = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error(`${fieldName} must be a valid number.`);
  }

  if (fieldName === "location_lat" && (number < -90 || number > 90)) {
    throw new Error("Latitude must be between -90 and 90.");
  }

  if (fieldName === "location_lng" && (number < -180 || number > 180)) {
    throw new Error("Longitude must be between -180 and 180.");
  }

  return number;
};

const firstDefined = (...values) =>
  values.find((value) => value !== undefined);

/* =========================================================
   BUILD RESTAURANT PAYLOAD
========================================================= */

const buildRestaurantPayload = (body = {}) => {
  const payload = {};

  const setString = (field, value) => {
    if (value !== undefined) {
      payload[field] = normalizeString(value);
    }
  };

  setString("name", body.name);
  setString("description", body.description);
  setString(
    "short_description",
    firstDefined(body.short_description, body.shortDescription)
  );

  setString(
    "location_address",
    firstDefined(
      body.location_address,
      body.address,
      body.location?.address
    )
  );

  setString(
    "contact_phone",
    firstDefined(
      body.contact_phone,
      body.contact_number,
      body.phone,
      body.contact?.phone
    )
  );

  setString(
    "contact_website",
    firstDefined(
      body.contact_website,
      body.website,
      body.contact?.website
    )
  );

  setString("opening_hours", body.opening_hours);
  setString("cuisine_type", body.cuisine_type);
  setString("price_range", body.price_range);

  if (body.images !== undefined) {
    payload.images = normalizeImages(body.images);
  }

  if (body.featured !== undefined) {
    payload.featured =
      body.featured === true ||
      body.featured === "true" ||
      body.featured === 1 ||
      body.featured === "1";
  }

  if (body.is_active !== undefined) {
    payload.is_active =
      body.is_active === true ||
      body.is_active === "true" ||
      body.is_active === 1 ||
      body.is_active === "1";
  }

  /*
   * The admin location picker sends location_lat/location_lng.
   * latitude/longitude are accepted too for compatibility.
   */
  const latitude = firstDefined(
    body.location_lat,
    body.latitude,
    body.location?.lat
  );

  const longitude = firstDefined(
    body.location_lng,
    body.longitude,
    body.location?.lng
  );

  if (latitude !== undefined) {
    payload.location_lat = normalizeNumber(latitude, "location_lat");
  }

  if (longitude !== undefined) {
    payload.location_lng = normalizeNumber(longitude, "location_lng");
  }

  return payload;
};

/* =========================================================
   ERROR HANDLING
========================================================= */

const sendError = (res, err, fallback) => {
  const status =
    err.response?.status >= 400 && err.response?.status < 500
      ? err.response.status
      : 500;

  const message =
    err.response?.data?.message ||
    err.response?.data?.error ||
    err.message ||
    fallback;

  console.error("[restaurants]", message);

  return res.status(status).json({
    message:
      status === 500 && process.env.NODE_ENV === "production"
        ? fallback
        : message,
    details:
      process.env.NODE_ENV !== "production"
        ? err.response?.data
        : undefined,
  });
};

/* =========================================================
   GET /api/restaurants
   Public: list restaurants
========================================================= */

router.get("/", async (req, res) => {
  try {
    const response = await axios.get(TABLE_URL(), {
      params: {
        select: "*",
        order: "created_at.desc",
      },
      headers: getHeaders(),
    });

    return res.json(
      Array.isArray(response.data) ? response.data : []
    );
  } catch (err) {
    return sendError(res, err, "Unable to load restaurants.");
  }
});

/* =========================================================
   GET /api/restaurants/:id
   Public: get one restaurant
========================================================= */

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Restaurant ID is required.",
      });
    }

    const response = await axios.get(TABLE_URL(), {
      params: {
        select: "*",
        id: `eq.${id}`,
        limit: 1,
      },
      headers: getHeaders(),
    });

    const rows = Array.isArray(response.data) ? response.data : [];

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Restaurant not found.",
      });
    }

    return res.json(rows[0]);
  } catch (err) {
    return sendError(res, err, "Unable to load restaurant.");
  }
});

/* =========================================================
   POST /api/restaurants
   Admin only: create restaurant
========================================================= */

router.post("/", protect, requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};

    if (!normalizeString(body.name)) {
      return res.status(400).json({
        message: "Restaurant name is required.",
      });
    }

    const payload = buildRestaurantPayload(body);

    const response = await axios.post(TABLE_URL(), payload, {
      headers: {
        ...getHeaders(),
        Prefer: "return=representation",
      },
    });

    const created = Array.isArray(response.data)
      ? response.data[0]
      : response.data;

    if (!created) {
      return res.status(500).json({
        message: "Restaurant was not returned after creation.",
      });
    }

    return res.status(201).json(created);
  } catch (err) {
    if (
      err.message?.includes("must be a valid number") ||
      err.message?.includes("Latitude must") ||
      err.message?.includes("Longitude must")
    ) {
      return res.status(400).json({
        message: err.message,
      });
    }

    return sendError(res, err, "Unable to create restaurant.");
  }
});

/* =========================================================
   PUT /api/restaurants/:id
   Admin only: update restaurant
========================================================= */

router.put("/:id", protect, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    if (!id) {
      return res.status(400).json({
        message: "Restaurant ID is required.",
      });
    }

    if (!normalizeString(body.name)) {
      return res.status(400).json({
        message: "Restaurant name is required.",
      });
    }

    const payload = buildRestaurantPayload(body);

    payload.updated_at = new Date().toISOString();

    const response = await axios.patch(TABLE_URL(), payload, {
      params: {
        id: `eq.${id}`,
      },
      headers: {
        ...getHeaders(),
        Prefer: "return=representation",
      },
    });

    const updated = Array.isArray(response.data)
      ? response.data[0]
      : response.data;

    if (!updated) {
      return res.status(404).json({
        message: "Restaurant not found.",
      });
    }

    return res.json(updated);
  } catch (err) {
    if (
      err.message?.includes("must be a valid number") ||
      err.message?.includes("Latitude must") ||
      err.message?.includes("Longitude must")
    ) {
      return res.status(400).json({
        message: err.message,
      });
    }

    return sendError(res, err, "Unable to update restaurant.");
  }
});

/* =========================================================
   DELETE /api/restaurants/:id
   Admin only: delete restaurant
========================================================= */

router.delete("/:id", protect, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Restaurant ID is required.",
      });
    }

    const response = await axios.delete(TABLE_URL(), {
      params: {
        id: `eq.${id}`,
      },
      headers: {
        ...getHeaders(),
        Prefer: "return=representation",
      },
    });

    const deleted = Array.isArray(response.data) ? response.data : [];

    if (deleted.length === 0) {
      return res.status(404).json({
        message: "Restaurant not found.",
      });
    }

    return res.json({
      message: "Restaurant deleted successfully.",
      data: deleted[0],
    });
  } catch (err) {
    return sendError(res, err, "Unable to delete restaurant.");
  }
});

module.exports = router;
