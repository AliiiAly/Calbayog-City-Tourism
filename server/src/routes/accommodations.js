const express = require("express");
const axios = require("axios");

const { protect } = require("../middleware/auth");

const router = express.Router();

// =========================================================
// SUPABASE SERVICE-ROLE HEADERS
// =========================================================
//
// IMPORTANT:
// The service-role key MUST remain on Render.
// Never put SUPABASE_SERVICE_ROLE_KEY in the Vercel
// frontend environment variables.
//
// Service-role access bypasses Supabase RLS, so every
// write route below is protected by:
//   1. protect
//   2. requireAdmin
//

const getHeaders = () => ({
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
  Accept: "application/json",
});

// =========================================================
// ADMIN AUTHORIZATION
// =========================================================

const requireAdmin = (req, res, next) => {
  if (!req.auth) {
    return res.status(401).json({
      message: "Authentication required.",
    });
  }

  if (req.auth.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required.",
    });
  }

  return next();
};

// =========================================================
// SUPABASE URL
// =========================================================

const getSupabaseUrl = () => {
  const url = process.env.SUPABASE_URL;

  if (!url) {
    throw new Error(
      "SUPABASE_URL is not configured on the server."
    );
  }

  return url.replace(/\/+$/, "");
};

// =========================================================
// NORMALIZE IMAGE ARRAY
// =========================================================

const normalizeImages = (images) => {
  if (!Array.isArray(images)) {
    return [];
  }

  return images.filter(
    (image) =>
      typeof image === "string" &&
      image.trim().length > 0
  );
};

// =========================================================
// NORMALIZE NUMBER
// =========================================================

const normalizeNumber = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};

// =========================================================
// NORMALIZE STRING
// =========================================================

const normalizeString = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    typeof value !== "string"
  ) {
    return String(value);
  }

  const trimmed = value.trim();

  return trimmed.length > 0
    ? trimmed
    : null;
};

// =========================================================
// BUILD ACCOMMODATION PAYLOAD
// =========================================================
//
// Actual Supabase accommodations columns:
//
// id
// name
// owner
// manager
// address
// contact_number
// website
// images
// created_at
// updated_at
// short_description
// description
// getting_there
// latitude
// longitude
// favorites
//
// We intentionally DO NOT send unsupported fields such as:
//
// type
// dot_accredited
// featured
// show_on_welcome
// is_active
// location_lat
// location_lng
// location_address
// contact_phone
// contact_email
// contact_website
// price_min
// price_max
// amenities
// room_types
//
// The old frontend format is still partially supported through
// aliases so existing AdminAccommodations code can continue
// working while we transition to the actual database schema.
//

const buildAccommodationPayload = (
  body = {},
  options = {}
) => {
  const {
    includeName = true,
  } = options;

  // -------------------------------------------------------
  // NAME
  // -------------------------------------------------------

  const name = normalizeString(
    body.name
  );

  // -------------------------------------------------------
  // ADDRESS
  // -------------------------------------------------------

  const address =
    normalizeString(
      body.address
    ) ??
    normalizeString(
      body.location_address
    ) ??
    normalizeString(
      body.location?.address
    );

  // -------------------------------------------------------
  // LATITUDE
  // -------------------------------------------------------

  const latitude =
    normalizeNumber(
      body.latitude
    ) ??
    normalizeNumber(
      body.location_lat
    ) ??
    normalizeNumber(
      body.location?.lat
    );

  // -------------------------------------------------------
  // LONGITUDE
  // -------------------------------------------------------

  const longitude =
    normalizeNumber(
      body.longitude
    ) ??
    normalizeNumber(
      body.location_lng
    ) ??
    normalizeNumber(
      body.location?.lng
    );

  // -------------------------------------------------------
  // CONTACT NUMBER
  // -------------------------------------------------------

  const contactNumber =
    normalizeString(
      body.contact_number
    ) ??
    normalizeString(
      body.contact_phone
    ) ??
    normalizeString(
      body.contact?.phone
    );

  // -------------------------------------------------------
  // WEBSITE
  // -------------------------------------------------------

  const website =
    normalizeString(
      body.website
    ) ??
    normalizeString(
      body.contact_website
    ) ??
    normalizeString(
      body.contact?.website
    );

  // -------------------------------------------------------
  // OWNER
  // -------------------------------------------------------

  const owner =
    normalizeString(
      body.owner
    );

  // -------------------------------------------------------
  // MANAGER
  // -------------------------------------------------------

  const manager =
    normalizeString(
      body.manager
    );

  // -------------------------------------------------------
  // SHORT DESCRIPTION
  // -------------------------------------------------------

  const shortDescription =
    normalizeString(
      body.short_description
    ) ??
    normalizeString(
      body.shortDescription
    );

  // -------------------------------------------------------
  // DESCRIPTION
  // -------------------------------------------------------

  const description =
    normalizeString(
      body.description
    );

  // -------------------------------------------------------
  // GETTING THERE
  // -------------------------------------------------------

  const gettingThere =
    normalizeString(
      body.getting_there
    ) ??
    normalizeString(
      body.gettingThere
    );

  // -------------------------------------------------------
  // IMAGES
  // -------------------------------------------------------

  const images =
    normalizeImages(
      body.images
    );

  // -------------------------------------------------------
  // FINAL PAYLOAD
  // -------------------------------------------------------

  const payload = {};

  if (includeName) {
    payload.name = name;
  }

  payload.owner = owner;
  payload.manager = manager;
  payload.address = address;
  payload.contact_number =
    contactNumber;
  payload.website = website;
  payload.images = images;
  payload.short_description =
    shortDescription;
  payload.description =
    description;
  payload.getting_there =
    gettingThere;
  payload.latitude = latitude;
  payload.longitude = longitude;

  return payload;
};

// =========================================================
// GET /api/accommodations
// =========================================================
//
// Public read.
//
// No admin authentication is required here because
// accommodations are public tourism information.
//

router.get(
  "/",
  async (req, res) => {
    try {
      const response =
        await axios.get(
          `${getSupabaseUrl()}/rest/v1/accommodations`,
          {
            params: {
              select: "*",
              order:
                "created_at.desc",
            },
            headers:
              getHeaders(),
          }
        );

      return res.json(
        Array.isArray(
          response.data
        )
          ? response.data
          : []
      );
    } catch (err) {
      console.error(
        "GET accommodations error:",
        err.response?.data ||
          err.message
      );

      return res.status(500).json({
        message:
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Unable to load accommodations.",
      });
    }
  }
);

// =========================================================
// GET /api/accommodations/:id
// =========================================================
//
// Public read of one accommodation.
//

router.get(
  "/:id",
  async (req, res) => {
    try {
      const id =
        req.params.id;

      if (!id) {
        return res.status(400).json({
          message:
            "Accommodation ID is required.",
        });
      }

      const response =
        await axios.get(
          `${getSupabaseUrl()}/rest/v1/accommodations`,
          {
            params: {
              select: "*",
              id: `eq.${id}`,
              limit: 1,
            },
            headers:
              getHeaders(),
          }
        );

      const rows =
        Array.isArray(
          response.data
        )
          ? response.data
          : [];

      if (rows.length === 0) {
        return res.status(404).json({
          message:
            "Accommodation not found.",
        });
      }

      return res.json(
        rows[0]
      );
    } catch (err) {
      console.error(
        "GET accommodation error:",
        err.response?.data ||
          err.message
      );

      return res.status(500).json({
        message:
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Unable to load accommodation.",
      });
    }
  }
);

// =========================================================
// POST /api/accommodations
// =========================================================
//
// ADMIN ONLY
//
// Creates a new accommodation.
//

router.post(
  "/",
  protect,
  requireAdmin,
  async (req, res) => {
    try {
      const body =
        req.body || {};

      const name =
        normalizeString(
          body.name
        );

      if (!name) {
        return res.status(400).json({
          message:
            "Establishment name is required.",
        });
      }

      const payload =
        buildAccommodationPayload(
          body,
          {
            includeName: true,
          }
        );

      console.log(
        "POST accommodation payload:",
        JSON.stringify(
          payload,
          null,
          2
        )
      );

      const response =
        await axios.post(
          `${getSupabaseUrl()}/rest/v1/accommodations`,
          payload,
          {
            headers: {
              ...getHeaders(),
              Prefer:
                "return=representation",
            },
          }
        );

      const created =
        Array.isArray(
          response.data
        )
          ? response.data[0]
          : response.data;

      if (!created) {
        return res.status(500).json({
          message:
            "Accommodation was not returned after creation.",
        });
      }

      return res.status(201).json(
        created
      );
    } catch (err) {
      console.error(
        "POST accommodation error:",
        err.response?.data ||
          err.message
      );

      return res.status(
        err.response?.status >= 400 &&
          err.response?.status < 500
          ? err.response.status
          : 500
      ).json({
        message:
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Unable to create accommodation.",
        details:
          process.env.NODE_ENV !==
          "production"
            ? err.response?.data
            : undefined,
      });
    }
  }
);

// =========================================================
// PUT /api/accommodations/:id
// =========================================================
//
// ADMIN ONLY
//
// Updates an existing accommodation.
//

router.put(
  "/:id",
  protect,
  requireAdmin,
  async (req, res) => {
    try {
      const id =
        req.params.id;

      if (!id) {
        return res.status(400).json({
          message:
            "Accommodation ID is required.",
        });
      }

      const body =
        req.body || {};

      const name =
        normalizeString(
          body.name
        );

      if (!name) {
        return res.status(400).json({
          message:
            "Establishment name is required.",
        });
      }

      const payload =
        buildAccommodationPayload(
          body,
          {
            includeName: true,
          }
        );

      /*
       * Keep the database's updated_at current.
       */
      payload.updated_at =
        new Date().toISOString();

      console.log(
        "PUT accommodation payload:",
        JSON.stringify(
          {
            id,
            ...payload,
          },
          null,
          2
        )
      );

      const response =
        await axios.patch(
          `${getSupabaseUrl()}/rest/v1/accommodations`,
          payload,
          {
            params: {
              id: `eq.${id}`,
            },
            headers: {
              ...getHeaders(),
              Prefer:
                "return=representation",
            },
          }
        );

      const updated =
        Array.isArray(
          response.data
        )
          ? response.data[0]
          : response.data;

      if (!updated) {
        return res.status(404).json({
          message:
            "Accommodation not found.",
        });
      }

      return res.json(
        updated
      );
    } catch (err) {
      console.error(
        "PUT accommodation error:",
        err.response?.data ||
          err.message
      );

      return res.status(
        err.response?.status >= 400 &&
          err.response?.status < 500
          ? err.response.status
          : 500
      ).json({
        message:
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Unable to update accommodation.",
        details:
          process.env.NODE_ENV !==
          "production"
            ? err.response?.data
            : undefined,
      });
    }
  }
);

// =========================================================
// DELETE /api/accommodations/:id
// =========================================================
//
// ADMIN ONLY
//

router.delete(
  "/:id",
  protect,
  requireAdmin,
  async (req, res) => {
    try {
      const id =
        req.params.id;

      if (!id) {
        return res.status(400).json({
          message:
            "Accommodation ID is required.",
        });
      }

      const response =
        await axios.delete(
          `${getSupabaseUrl()}/rest/v1/accommodations`,
          {
            params: {
              id: `eq.${id}`,
            },
            headers: {
              ...getHeaders(),
              Prefer:
                "return=representation",
            },
          }
        );

      const deleted =
        Array.isArray(
          response.data
        )
          ? response.data
          : [];

      if (
        deleted.length === 0
      ) {
        return res.status(404).json({
          message:
            "Accommodation not found.",
        });
      }

      return res.json({
        message:
          "Accommodation deleted successfully.",
        data:
          deleted[0],
      });
    } catch (err) {
      console.error(
        "DELETE accommodation error:",
        err.response?.data ||
          err.message
      );

      return res.status(
        err.response?.status >= 400 &&
          err.response?.status < 500
          ? err.response.status
          : 500
      ).json({
        message:
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Unable to delete accommodation.",
      });
    }
  }
);

// =========================================================
// EXPORT
// =========================================================

module.exports = router;
