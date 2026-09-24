const express = require("express");
const axios = require("axios");
const { protect } = require("../middleware/auth");

const router = express.Router();

// =========================================================
// SUPABASE CONFIG
// =========================================================

const SUPABASE_URL =
  process.env.SUPABASE_URL;

const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const SUPABASE_REST_URL =
  `${SUPABASE_URL}/rest/v1/destinations`;

// =========================================================
// HEADERS
// =========================================================

// Public/read operations can use the anon key.
const publicHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization:
    `Bearer ${SUPABASE_ANON_KEY}`,
};

// Admin/database-management operations
// must use the service-role key on the server.
const adminHeaders = {
  apikey:
    SUPABASE_SERVICE_ROLE_KEY ||
    SUPABASE_ANON_KEY,

  Authorization:
    `Bearer ${
      SUPABASE_SERVICE_ROLE_KEY ||
      SUPABASE_ANON_KEY
    }`,
};

const adminJsonHeaders = {
  ...adminHeaders,
  "Content-Type":
    "application/json",
  Prefer:
    "return=representation",
};

// =========================================================
// HELPERS
// =========================================================

const normalizeId = (value) => {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value).trim();
};

const getDestinationById = async (
  id
) => {
  const response =
    await axios.get(
      `${SUPABASE_REST_URL}?id=eq.${encodeURIComponent(
        id
      )}&select=*`,
      {
        headers:
          publicHeaders,
      }
    );

  return Array.isArray(
    response.data
  )
    ? response.data[0]
    : null;
};

// =========================================================
// GET /api/destinations
// PUBLIC
// =========================================================

router.get("/", async (req, res) => {
  try {
    const {
      category,
      search,
      featured,
      show_on_welcome,
      attraction_type,
    } = req.query;

    const params =
      new URLSearchParams();

    params.set(
      "select",
      "*"
    );

    // Only active destinations
    params.set(
      "is_active",
      "eq.true"
    );

    // Category
    if (
      category &&
      String(category) !== "All"
    ) {
      params.set(
        "category",
        `eq.${String(
          category
        )}`
      );
    }

    // Attraction type
    if (
      attraction_type &&
      String(attraction_type) !== "All"
    ) {
      params.set(
        "attraction_type",
        `eq.${String(
          attraction_type
        )}`
      );
    }

    // Featured
    if (
      featured === "true"
    ) {
      params.set(
        "featured",
        "eq.true"
      );
    }

    // Show on welcome
    if (
      show_on_welcome !==
      undefined
    ) {
      params.set(
        "show_on_welcome",
        `eq.${String(
          show_on_welcome
        )}`
      );
    }

    // Search
    if (
      search !==
        undefined &&
      String(search).trim()
    ) {
      const searchText =
        String(search).trim();

      params.set(
        "or",
        `(name.ilike.*${searchText}*,description.ilike.*${searchText}*,short_description.ilike.*${searchText}*,location_address.ilike.*${searchText}*)`
      );
    }

    params.set(
      "order",
      "created_at.desc"
    );

    const response =
      await axios.get(
        `${SUPABASE_REST_URL}?${params.toString()}`,
        {
          headers:
            publicHeaders,
        }
      );

    return res.json(
      Array.isArray(
        response.data
      )
        ? response.data
        : []
    );
  } catch (error) {
    console.error(
      "GET /api/destinations error:",
      error.response?.data ||
        error.message ||
        error
    );

    return res.status(500).json({
      message:
        "Failed to fetch destinations.",
      error:
        error.response?.data ||
        error.message,
    });
  }
});

// =========================================================
// GET /api/destinations/:id
// PUBLIC
// =========================================================

router.get(
  "/:id",
  async (req, res) => {
    try {
      const id =
        normalizeId(
          req.params.id
        );

      if (!id) {
        return res.status(400).json({
          message:
            "Destination ID is required.",
        });
      }

      const destination =
        await getDestinationById(
          id
        );

      if (!destination) {
        return res.status(404).json({
          message:
            "Destination not found.",
        });
      }

      return res.json(
        destination
      );
    } catch (error) {
      console.error(
        "GET /api/destinations/:id error:",
        error.response?.data ||
          error.message ||
          error
      );

      return res.status(500).json({
        message:
          "Failed to fetch destination.",
        error:
          error.response?.data ||
          error.message,
      });
    }
  }
);

// =========================================================
// POST /api/destinations
// ADMIN ONLY
// =========================================================

router.post(
  "/",
  protect,
  async (req, res) => {
    try {
      const payload = {
        ...req.body,
      };

      // Never allow client/admin form
      // to manually create these values.
      delete payload.id;
      delete payload._id;
      delete payload.created_at;
      delete payload.updated_at;

      if (
        !payload.name ||
        !String(
          payload.name
        ).trim()
      ) {
        return res.status(400).json({
          message:
            "Destination name is required.",
        });
      }

      if (
        !payload.category ||
        !String(
          payload.category
        ).trim()
      ) {
        return res.status(400).json({
          message:
            "Destination category is required.",
        });
      }

      console.log(
        "POST /api/destinations"
      );

      const response =
        await axios.post(
          SUPABASE_REST_URL,
          payload,
          {
            headers:
              adminJsonHeaders,
          }
        );

      const destination =
        Array.isArray(
          response.data
        )
          ? response.data[0]
          : response.data;

      console.log(
        "Destination created:",
        destination?.id
      );

      return res.status(201).json(
        destination
      );
    } catch (error) {
      console.error(
        "POST /api/destinations error:",
        error.response?.data ||
          error.message ||
          error
      );

      return res.status(
        error.response?.status >=
          400 &&
        error.response?.status < 600
          ? error.response.status
          : 500
      ).json({
        message:
          error.response?.data?.message ||
          "Failed to create destination.",
        error:
          error.response?.data ||
          error.message,
      });
    }
  }
);

// =========================================================
// PUT /api/destinations/:id
// ADMIN ONLY
// =========================================================

router.put(
  "/:id",
  protect,
  async (req, res) => {
    try {
      const id =
        normalizeId(
          req.params.id
        );

      if (!id) {
        return res.status(400).json({
          message:
            "Destination ID is required.",
        });
      }

      const payload = {
        ...req.body,
      };

      delete payload.id;
      delete payload._id;
      delete payload.created_at;

      /*
       * Favorites are managed by the
       * favorites system.
       *
       * Do not allow ordinary admin
       * destination editing to overwrite
       * the total heart count.
       */
      delete payload.favorites;

      payload.updated_at =
        new Date().toISOString();

      const response =
        await axios.patch(
          `${SUPABASE_REST_URL}?id=eq.${encodeURIComponent(
            id
          )}`,
          payload,
          {
            headers:
              adminJsonHeaders,
          }
        );

      const destination =
        Array.isArray(
          response.data
        )
          ? response.data[0]
          : response.data;

      if (!destination) {
        return res.status(404).json({
          message:
            "Destination not found.",
        });
      }

      return res.json(
        destination
      );
    } catch (error) {
      console.error(
        "PUT /api/destinations/:id error:",
        error.response?.data ||
          error.message ||
          error
      );

      return res.status(
        error.response?.status >=
          400 &&
        error.response?.status < 600
          ? error.response.status
          : 500
      ).json({
        message:
          error.response?.data?.message ||
          "Failed to update destination.",
        error:
          error.response?.data ||
          error.message,
      });
    }
  }
);

// =========================================================
// PATCH /api/destinations/:id
// ADMIN ONLY
//
// Supports clients that use PATCH.
// =========================================================

router.patch(
  "/:id",
  protect,
  async (req, res) => {
    try {
      const id =
        normalizeId(
          req.params.id
        );

      if (!id) {
        return res.status(400).json({
          message:
            "Destination ID is required.",
        });
      }

      const payload = {
        ...req.body,
      };

      delete payload.id;
      delete payload._id;
      delete payload.created_at;

      delete payload.favorites;

      payload.updated_at =
        new Date().toISOString();

      const response =
        await axios.patch(
          `${SUPABASE_REST_URL}?id=eq.${encodeURIComponent(
            id
          )}`,
          payload,
          {
            headers:
              adminJsonHeaders,
          }
        );

      const destination =
        Array.isArray(
          response.data
        )
          ? response.data[0]
          : response.data;

      if (!destination) {
        return res.status(404).json({
          message:
            "Destination not found.",
        });
      }

      return res.json(
        destination
      );
    } catch (error) {
      console.error(
        "PATCH /api/destinations/:id error:",
        error.response?.data ||
          error.message ||
          error
      );

      return res.status(
        error.response?.status >=
          400 &&
        error.response?.status < 600
          ? error.response.status
          : 500
      ).json({
        message:
          error.response?.data?.message ||
          "Failed to update destination.",
        error:
          error.response?.data ||
          error.message,
      });
    }
  }
);

// =========================================================
// DELETE /api/destinations/:id
// ADMIN ONLY
// =========================================================

router.delete(
  "/:id",
  protect,
  async (req, res) => {
    try {
      const id =
        normalizeId(
          req.params.id
        );

      if (!id) {
        return res.status(400).json({
          message:
            "Destination ID is required.",
        });
      }

      const response =
        await axios.delete(
          `${SUPABASE_REST_URL}?id=eq.${encodeURIComponent(
            id
          )}`,
          {
            headers:
              adminJsonHeaders,
          }
        );

      return res.json({
        message:
          "Destination deleted successfully.",
        deleted:
          Array.isArray(
            response.data
          )
            ? response.data[0] ||
              null
            : null,
      });
    } catch (error) {
      console.error(
        "DELETE /api/destinations/:id error:",
        error.response?.data ||
          error.message ||
          error
      );

      return res.status(
        error.response?.status >=
          400 &&
        error.response?.status < 600
          ? error.response.status
          : 500
      ).json({
        message:
          error.response?.data?.message ||
          "Failed to delete destination.",
        error:
          error.response?.data ||
          error.message,
      });
    }
  }
);

// =========================================================
// POST /api/destinations/fix-coordinates
// ADMIN ONLY
// =========================================================

router.post(
  "/fix-coordinates",
  protect,
  async (req, res) => {
    try {
      /*
       * These are the coordinate records
       * already present in the project.
       *
       * No Capacitor/client code is used here.
       */
      const coordinateUpdates = [
        // Hotels
        {
          name: "Hotel Calbayog",
          lat: 12.0680,
          lng: 124.5965,
        },
        {
          name: "Samar Paradise Resort",
          lat: 12.0550,
          lng: 124.6100,
        },
        {
          name: "Waterfalls Inn",
          lat: 12.1050,
          lng: 124.5450,
        },
        {
          name: "City View Hotel",
          lat: 12.0695,
          lng: 124.5980,
        },

        // Beaches
        {
          name: "Bangon Beach",
          lat: 12.0320,
          lng: 124.6250,
        },
        {
          name: "Mawacat Beach",
          lat: 12.0480,
          lng: 124.6150,
        },
        {
          name: "Jubasan Beach",
          lat: 12.0400,
          lng: 124.6200,
        },
        {
          name: "Binalay Beach",
          lat: 12.0250,
          lng: 124.6300,
        },

        // Waterfalls
        {
          name: "Bangon-Bugtong Falls",
          lat: 12.1100,
          lng: 124.5400,
        },
        {
          name: "Tinago-an Falls",
          lat: 12.1200,
          lng: 124.5350,
        },
        {
          name: "Lulugayan Falls",
          lat: 12.1150,
          lng: 124.5420,
        },

        // Food
        {
          name: "Calbayog Seafood Grill",
          lat: 12.0670,
          lng: 124.5955,
        },
        {
          name: "Samar Delicacies",
          lat: 12.0700,
          lng: 124.5990,
        },

        // Nature
        {
          name: "Calbayog Eco Park",
          lat: 12.0750,
          lng: 124.5850,
        },
        {
          name: "Samar Rainforest Reserve",
          lat: 12.0900,
          lng: 124.5600,
        },

        // Transport
        {
          name: "Calbayog City Port",
          lat: 12.0727,
          lng: 124.5447,
        },
        {
          name: "Van Terminal",
          lat: 12.0660,
          lng: 124.5950,
        },
      ];

      let updated = 0;

      const failed = [];

      for (
        const update of coordinateUpdates
      ) {
        try {
          const response =
            await axios.patch(
              `${SUPABASE_REST_URL}?name=eq.${encodeURIComponent(
                update.name
              )}`,
              {
                location_lat:
                  update.lat,
                location_lng:
                  update.lng,
                updated_at:
                  new Date().toISOString(),
              },
              {
                headers:
                  adminJsonHeaders,
              }
            );

          if (
            Array.isArray(
              response.data
            ) &&
            response.data.length >
              0
          ) {
            updated += 1;
          } else {
            failed.push(
              update.name
            );
          }
        } catch (error) {
          console.error(
            `Could not update coordinates for ${update.name}:`,
            error.response?.data ||
              error.message ||
              error
          );

          failed.push(
            update.name
          );
        }
      }

      return res.json({
        message:
          `Updated ${updated} destinations with coordinate data.`,
        updated,
        failed,
      });
    } catch (error) {
      console.error(
        "POST /api/destinations/fix-coordinates error:",
        error.response?.data ||
          error.message ||
          error
      );

      return res.status(500).json({
        message:
          "Failed to update destination coordinates.",
        error:
          error.response?.data ||
          error.message,
      });
    }
  }
);

// =========================================================
// EXPORT
// =========================================================

module.exports = router;