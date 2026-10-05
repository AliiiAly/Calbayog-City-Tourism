const express = require("express");
const axios = require("axios");

const { protect } = require("../middleware/auth");

const router = express.Router();

// =========================================================
// SUPABASE SERVICE-ROLE HEADERS
// =========================================================
// The service-role key MUST stay on Render. Service-role access
// bypasses RLS, so every write route is protected by:
//   1. protect
//   2. requireAdmin

const getHeaders = () => ({
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
  Accept: "application/json",
});

const getSupabaseUrl = () => {
  const url = process.env.SUPABASE_URL;

  if (!url) {
    throw new Error("SUPABASE_URL is not configured on the server.");
  }

  return url.replace(/\/+$/, "");
};

const TABLE_URL = () => `${getSupabaseUrl()}/rest/v1/accommodations`;

// =========================================================
// ADMIN AUTHORIZATION
// =========================================================
// Different versions of `protect` attach the decoded token to
// different properties (req.auth / req.user / req.admin), so all
// three are checked. If none is present, the log below shows what
// the middleware actually attached.

const requireAdmin = (req, res, next) => {
  const auth = req.auth || req.user || req.admin;

  if (!auth) {
    console.warn(
      "[accommodations] requireAdmin: no auth object on request. Keys:",
      Object.keys(req).filter((key) =>
        ["auth", "user", "admin", "token", "decoded"].includes(key)
      )
    );

    return res.status(401).json({ message: "Authentication required." });
  }

  if (auth.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }

  return next();
};

// =========================================================
// NORMALIZERS
// =========================================================

const normalizeImages = (images) => {
  if (!Array.isArray(images)) return [];

  return images.filter(
    (image) => typeof image === "string" && image.trim().length > 0
  );
};

const normalizeNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
};

const normalizeString = (value) => {
  if (value === null || value === undefined) return null;

  const text = typeof value === "string" ? value : String(value);
  const trimmed = text.trim();

  return trimmed.length > 0 ? trimmed : null;
};

const firstDefined = (...values) => values.find((value) => value !== undefined);

// =========================================================
// BUILD ACCOMMODATION PAYLOAD
// =========================================================
// Only fields that were actually SENT are written. Previously every
// update set short_description and getting_there to null (the admin
// form never sends them), which silently erased that data.
//
// Supabase columns: id, name, owner, manager, address,
// contact_number, website, images, created_at, updated_at,
// short_description, description, getting_there, latitude,
// longitude, favorites, price_range (run the SQL below once).
//
//   alter table public.accommodations
//     add column if not exists price_range text;

const buildAccommodationPayload = (body = {}) => {
  const payload = {};

  const set = (field, raw, normalize) => {
    if (raw !== undefined) payload[field] = normalize(raw);
  };

  set("name", body.name, normalizeString);
  set("owner", body.owner, normalizeString);
  set("manager", body.manager, normalizeString);

  set(
    "address",
    firstDefined(body.address, body.location_address, body.location?.address),
    normalizeString
  );

  set(
    "contact_number",
    firstDefined(
      body.contact_number,
      body.contact_phone,
      body.contact?.phone
    ),
    normalizeString
  );

  set(
    "website",
    firstDefined(body.website, body.contact_website, body.contact?.website),
    normalizeString
  );

  set("images", body.images, normalizeImages);

  set(
    "short_description",
    firstDefined(body.short_description, body.shortDescription),
    normalizeString
  );

  set("description", body.description, normalizeString);

  set(
    "getting_there",
    firstDefined(body.getting_there, body.gettingThere),
    normalizeString
  );

  set("price_range", body.price_range, normalizeString);

  set(
    "latitude",
    firstDefined(body.latitude, body.location_lat, body.location?.lat),
    normalizeNumber
  );

  set(
    "longitude",
    firstDefined(body.longitude, body.location_lng, body.location?.lng),
    normalizeNumber
  );

  return payload;
};

// =========================================================
// ERROR HELPERS
// =========================================================

const errorStatus = (err) =>
  err.response?.status >= 400 && err.response?.status < 500
    ? err.response.status
    : 500;

const errorMessage = (err, fallback) =>
  err.response?.data?.message ||
  err.response?.data?.error ||
  err.message ||
  fallback;

const sendError = (res, err, fallback) =>
  res.status(errorStatus(err)).json({
    message: errorMessage(err, fallback),
    details:
      process.env.NODE_ENV !== "production" ? err.response?.data : undefined,
  });

// =========================================================
// GET /api/accommodations  (public)
// =========================================================

router.get("/", async (req, res) => {
  try {
    const response = await axios.get(TABLE_URL(), {
      params: { select: "*", order: "created_at.desc" },
      headers: getHeaders(),
    });

    return res.json(Array.isArray(response.data) ? response.data : []);
  } catch (err) {
    console.error(
      "GET accommodations error:",
      err.response?.data || err.message
    );

    return sendError(res, err, "Unable to load accommodations.");
  }
});

// =========================================================
// GET /api/accommodations/:id  (public)
// =========================================================

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Accommodation ID is required." });
    }

    const response = await axios.get(TABLE_URL(), {
      params: { select: "*", id: `eq.${id}`, limit: 1 },
      headers: getHeaders(),
    });

    const rows = Array.isArray(response.data) ? response.data : [];

    if (rows.length === 0) {
      return res.status(404).json({ message: "Accommodation not found." });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error(
      "GET accommodation error:",
      err.response?.data || err.message
    );

    return sendError(res, err, "Unable to load accommodation.");
  }
});

// =========================================================
// POST /api/accommodations  (admin only)
// =========================================================

router.post("/", protect, requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};

    if (!normalizeString(body.name)) {
      return res
        .status(400)
        .json({ message: "Establishment name is required." });
    }

    const payload = buildAccommodationPayload(body);

    console.log("POST accommodation payload:", JSON.stringify(payload));

    const response = await axios.post(TABLE_URL(), payload, {
      headers: { ...getHeaders(), Prefer: "return=representation" },
    });

    const created = Array.isArray(response.data)
      ? response.data[0]
      : response.data;

    if (!created) {
      return res.status(500).json({
        message: "Accommodation was not returned after creation.",
      });
    }

    return res.status(201).json(created);
  } catch (err) {
    console.error(
      "POST accommodation error:",
      err.response?.data || err.message
    );

    return sendError(res, err, "Unable to create accommodation.");
  }
});

// =========================================================
// PUT /api/accommodations/:id  (admin only)
// =========================================================

router.put("/:id", protect, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Accommodation ID is required." });
    }

    const body = req.body || {};

    if (!normalizeString(body.name)) {
      return res
        .status(400)
        .json({ message: "Establishment name is required." });
    }

    const payload = buildAccommodationPayload(body);

    payload.updated_at = new Date().toISOString();

    console.log("PUT accommodation payload:", JSON.stringify({ id, ...payload }));

    const response = await axios.patch(TABLE_URL(), payload, {
      params: { id: `eq.${id}` },
      headers: { ...getHeaders(), Prefer: "return=representation" },
    });

    const updated = Array.isArray(response.data)
      ? response.data[0]
      : response.data;

    if (!updated) {
      return res.status(404).json({ message: "Accommodation not found." });
    }

    return res.json(updated);
  } catch (err) {
    console.error(
      "PUT accommodation error:",
      err.response?.data || err.message
    );

    return sendError(res, err, "Unable to update accommodation.");
  }
});

// =========================================================
// DELETE /api/accommodations/:id  (admin only)
// =========================================================

router.delete("/:id", protect, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Accommodation ID is required." });
    }

    const response = await axios.delete(TABLE_URL(), {
      params: { id: `eq.${id}` },
      headers: { ...getHeaders(), Prefer: "return=representation" },
    });

    const deleted = Array.isArray(response.data) ? response.data : [];

    if (deleted.length === 0) {
      return res.status(404).json({ message: "Accommodation not found." });
    }

    return res.json({
      message: "Accommodation deleted successfully.",
      data: deleted[0],
    });
  } catch (err) {
    console.error(
      "DELETE accommodation error:",
      err.response?.data || err.message
    );

    return sendError(res, err, "Unable to delete accommodation.");
  }
});

module.exports = router;
