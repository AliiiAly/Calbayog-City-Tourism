const express = require("express");
const axios = require("axios");
const supabase = require("../config/supabase");

const router = express.Router();

const getHeaders = () => ({
  apikey: process.env.SUPABASE_ANON_KEY,
  Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
});

// =========================================================
// GET /api/accommodations
// =========================================================

router.get("/", async (req, res) => {
  try {
    const {
      type,
      dotAccredited,
      show_on_welcome,
    } = req.query;

    const queryParams = [
      "select=*",
      "is_active=eq.true",
    ];

    if (
      type &&
      type !== "All"
    ) {
      queryParams.push(
        `type=eq.${encodeURIComponent(
          type
        )}`
      );
    }

    if (
      dotAccredited === "true"
    ) {
      queryParams.push(
        "dot_accredited=eq.true"
      );
    }

    if (
      show_on_welcome === "true"
    ) {
      queryParams.push(
        "show_on_welcome=eq.true"
      );
    }

    queryParams.push(
      "order=featured.desc,name.asc"
    );

    const response =
      await axios.get(
        `${process.env.SUPABASE_URL}/rest/v1/accommodations?${queryParams.join(
          "&"
        )}`,
        {
          headers: getHeaders(),
        }
      );

    res.json(
      Array.isArray(response.data)
        ? response.data
        : []
    );
  } catch (err) {
    console.error(
      "GET accommodations error:",
      err.response?.data ||
        err.message
    );

    res.status(500).json({
      message:
        err.response?.data?.message ||
        err.message,
    });
  }
});

// =========================================================
// GET /api/accommodations/:id
// =========================================================

router.get(
  "/:id",
  async (req, res) => {
    try {
      const {
        data,
        error,
      } = await supabase
        .from("accommodations")
        .select("*")
        .eq("id", req.params.id)
        .single();

      if (error || !data) {
        return res.status(404).json({
          message:
            "Accommodation not found",
        });
      }

      res.json(data);
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

// =========================================================
// POST /api/accommodations
// =========================================================

router.post(
  "/",
  async (req, res) => {
    try {
      const payload = {
        name: req.body.name,
        type: req.body.type,
        description:
          req.body.description,
        short_description:
          req.body.short_description ??
          req.body.shortDescription ??
          null,

        images: req.body.images,

        location_lat:
          req.body.location?.lat ??
          req.body.location_lat ??
          0,

        location_lng:
          req.body.location?.lng ??
          req.body.location_lng ??
          0,

        location_address:
          req.body.location?.address ??
          req.body.location_address ??
          null,

        contact_phone:
          req.body.contact?.phone ??
          req.body.contact_phone ??
          null,

        contact_email:
          req.body.contact?.email ??
          req.body.contact_email ??
          null,

        contact_website:
          req.body.contact?.website ??
          req.body.contact_website ??
          null,

        amenities:
          req.body.amenities,

        room_types:
          req.body.room_types,

        price_min:
          req.body.priceRange?.min ??
          req.body.price_min ??
          0,

        price_max:
          req.body.priceRange?.max ??
          req.body.price_max ??
          0,

        dot_accredited:
          req.body.dotAccredited ??
          req.body.dot_accredited ??
          false,

        featured:
          req.body.featured ??
          false,

        show_on_welcome:
          req.body.showOnWelcome ??
          req.body.show_on_welcome ??
          false,

        is_active:
          req.body.isActive !==
          false,
      };

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
          `${process.env.SUPABASE_URL}/rest/v1/accommodations`,
          payload,
          {
            headers: {
              ...getHeaders(),
              Prefer:
                "return=representation",
            },
          }
        );

      res.status(201).json(
        Array.isArray(response.data)
          ? response.data[0]
          : response.data
      );
    } catch (err) {
      console.error(
        "POST accommodation error:",
        err.response?.data ||
          err.message
      );

      res.status(400).json({
        message:
          err.response?.data?.message ||
          err.message,
      });
    }
  }
);

// =========================================================
// PUT /api/accommodations/:id
// =========================================================

router.put(
  "/:id",
  async (req, res) => {
    try {
      const payload = {
        name: req.body.name,
        type: req.body.type,
        description:
          req.body.description,
        short_description:
          req.body.short_description ??
          req.body.shortDescription ??
          null,

        images: req.body.images,

        location_lat:
          req.body.location?.lat ??
          req.body.location_lat ??
          0,

        location_lng:
          req.body.location?.lng ??
          req.body.location_lng ??
          0,

        location_address:
          req.body.location?.address ??
          req.body.location_address ??
          null,

        contact_phone:
          req.body.contact?.phone ??
          req.body.contact_phone ??
          null,

        contact_email:
          req.body.contact?.email ??
          req.body.contact_email ??
          null,

        contact_website:
          req.body.contact?.website ??
          req.body.contact_website ??
          null,

        amenities:
          req.body.amenities,

        room_types:
          req.body.room_types,

        price_min:
          req.body.priceRange?.min ??
          req.body.price_min ??
          0,

        price_max:
          req.body.priceRange?.max ??
          req.body.price_max ??
          0,

        dot_accredited:
          req.body.dotAccredited ??
          req.body.dot_accredited ??
          false,

        featured:
          req.body.featured ??
          false,

        show_on_welcome:
          req.body.showOnWelcome ??
          req.body.show_on_welcome ??
          false,

        is_active:
          req.body.isActive !==
          false,
      };

      await axios.patch(
        `${process.env.SUPABASE_URL}/rest/v1/accommodations?id=eq.${encodeURIComponent(
          req.params.id
        )}`,
        payload,
        {
          headers: {
            ...getHeaders(),
            Prefer:
              "return=minimal",
          },
        }
      );

      const updatedResponse =
        await axios.get(
          `${process.env.SUPABASE_URL}/rest/v1/accommodations?id=eq.${encodeURIComponent(
            req.params.id
          )}&select=*`,
          {
            headers: getHeaders(),
          }
        );

      const updated =
        Array.isArray(
          updatedResponse.data
        )
          ? updatedResponse.data[0]
          : null;

      if (!updated) {
        return res.status(404).json({
          message:
            "Accommodation not found after update",
        });
      }

      res.json(updated);
    } catch (err) {
      console.error(
        "PUT accommodation error:",
        err.response?.data ||
          err.message
      );

      res.status(400).json({
        message:
          err.response?.data?.message ||
          err.message,
      });
    }
  }
);

// =========================================================
// DELETE
// =========================================================

router.delete(
  "/:id",
  async (req, res) => {
    try {
      await axios.delete(
        `${process.env.SUPABASE_URL}/rest/v1/accommodations?id=eq.${encodeURIComponent(
          req.params.id
        )}`,
        {
          headers: getHeaders(),
        }
      );

      res.json({
        message:
          "Accommodation deleted",
      });
    } catch (err) {
      console.error(
        "DELETE accommodation error:",
        err.response?.data ||
          err.message
      );

      res.status(500).json({
        message:
          err.response?.data?.message ||
          err.message,
      });
    }
  }
);

module.exports = router;