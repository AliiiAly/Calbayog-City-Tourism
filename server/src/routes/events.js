const express = require("express");
const axios = require("axios");
const { protect } = require("../middleware/auth");

const router = express.Router();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseHeaders = {
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
};

const supabaseJsonHeaders = {
  ...supabaseHeaders,
  "Content-Type": "application/json",
};

/*
 * IMPORTANT
 *
 * The actual public.events table contains:
 *
 * id
 * title
 * category
 * ta_category
 * description
 * start_date
 * end_date
 * venue
 * barangay
 * development_level
 * mgt
 * organizer
 * latitude
 * longitude
 * image
 * is_free
 * ticket_price
 * featured
 * created_at
 * updated_at
 * favorites
 * images
 * event_date
 * address
 *
 * There is NO is_active column.
 *
 * Only title is required by the application.
 */

// =========================================================
// HELPERS
// =========================================================

const cleanValue = (value) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    return trimmed.length > 0
      ? trimmed
      : undefined;
  }

  return value;
};

const cleanNumber = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return undefined;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : undefined;
};

const cleanBoolean = (value, fallback) => {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return fallback;
};

const cleanImages = (value) => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const images = value
    .filter(
      (item) =>
        typeof item === "string" &&
        item.trim().length > 0,
    )
    .map((item) => item.trim());

  return images;
};

const buildEventPayload = (body = {}) => {
  const images = cleanImages(body.images);

  const image =
    cleanValue(body.image) ||
    (images && images.length > 0
      ? images[0]
      : undefined);

  const startDate =
    cleanValue(body.startDate) ||
    cleanValue(body.start_date);

  const endDate =
    cleanValue(body.endDate) ||
    cleanValue(body.end_date);

  const eventDate =
    cleanValue(body.eventDate) ||
    cleanValue(body.event_date) ||
    startDate;

  const venue =
    cleanValue(body.venue);

  const address =
    cleanValue(body.address) ||
    venue;

  const payload = {
    title: cleanValue(body.title),

    category:
      cleanValue(body.category),

    ta_category:
      cleanValue(body.taCategory) ||
      cleanValue(body.ta_category),

    description:
      cleanValue(body.description),

    start_date:
      startDate,

    end_date:
      endDate,

    venue,

    barangay:
      cleanValue(body.barangay),

    development_level:
      cleanValue(body.developmentLevel) ||
      cleanValue(body.development_level),

    mgt:
      cleanValue(body.mgt),

    organizer:
      cleanValue(body.organizer),

    latitude:
      cleanNumber(
        body.latitude ??
          body.location_lat,
      ),

    longitude:
      cleanNumber(
        body.longitude ??
          body.location_lng,
      ),

    image,

    is_free:
      cleanBoolean(
        body.isFree ??
          body.is_free,
        true,
      ),

    ticket_price:
      cleanNumber(
        body.ticketPrice ??
          body.ticket_price,
      ),

    featured:
      cleanBoolean(
        body.featured,
        false,
      ),

    images,

    event_date:
      eventDate,

    address,
  };

  /*
   * Remove undefined fields.
   *
   * This is important because we only want to send
   * columns that actually exist in Supabase.
   */
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  return payload;
};

// =========================================================
// GET /api/events
// =========================================================

router.get("/", async (req, res) => {
  try {
    const {
      category,
      upcoming,
      featured,
    } = req.query;

    const queryParams = [
      "select=*",
    ];

    if (
      category &&
      category !== "All"
    ) {
      queryParams.push(
        `category=eq.${encodeURIComponent(
          category,
        )}`,
      );
    }

    if (featured === "true") {
      queryParams.push(
        "featured=eq.true",
      );
    }

    if (upcoming === "true") {
      const today =
        new Date()
          .toISOString()
          .split("T")[0];

      queryParams.push(
        `start_date=gte.${today}`,
      );
    }

    queryParams.push(
      "order=start_date.asc.nullslast",
    );

    const response =
      await axios.get(
        `${SUPABASE_URL}/rest/v1/events?${queryParams.join(
          "&",
        )}`,
        {
          headers:
            supabaseHeaders,
        },
      );

    const mapped = (
      response.data || []
    ).map((event) => ({
      _id: event.id,
      id: event.id,

      title: event.title,

      category:
        event.category,

      ta_category:
        event.ta_category,

      description:
        event.description,

      startDate:
        event.start_date ||
        event.event_date ||
        null,

      endDate:
        event.end_date ||
        event.event_date ||
        null,

      eventDate:
        event.event_date ||
        event.start_date ||
        null,

      venue:
        event.venue ||
        event.address ||
        null,

      address:
        event.address ||
        event.venue ||
        null,

      barangay:
        event.barangay,

      developmentLevel:
        event.development_level,

      mgt:
        event.mgt,

      organizer:
        event.organizer,

      latitude:
        event.latitude,

      longitude:
        event.longitude,

      image:
        event.image,

      images:
        Array.isArray(event.images)
          ? event.images
          : [],

      isFree:
        event.is_free,

      ticketPrice:
        event.ticket_price,

      featured:
        event.featured,

      favorites:
        event.favorites,

      created_at:
        event.created_at,

      updated_at:
        event.updated_at,
    }));

    res.json(mapped);
  } catch (err) {
    console.error(
      "[GET /events] error:",
      err.response?.data ||
        err.message,
    );

    res.status(500).json({
      message:
        err.response?.data?.message ||
        err.message ||
        "Failed to load events.",
    });
  }
});

// =========================================================
// GET /api/events/:id
// =========================================================

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const response =
      await axios.get(
        `${SUPABASE_URL}/rest/v1/events?id=eq.${encodeURIComponent(
          id,
        )}&select=*`,
        {
          headers:
            supabaseHeaders,
        },
      );

    const data =
      Array.isArray(response.data)
        ? response.data[0]
        : response.data;

    if (!data) {
      return res.status(404).json({
        message:
          "Event not found.",
      });
    }

    res.json({
      _id: data.id,
      id: data.id,

      title: data.title,
      category: data.category,
      ta_category:
        data.ta_category,

      description:
        data.description,

      startDate:
        data.start_date ||
        data.event_date ||
        null,

      endDate:
        data.end_date ||
        data.event_date ||
        null,

      eventDate:
        data.event_date ||
        data.start_date ||
        null,

      venue:
        data.venue ||
        data.address ||
        null,

      address:
        data.address ||
        data.venue ||
        null,

      barangay:
        data.barangay,

      developmentLevel:
        data.development_level,

      mgt:
        data.mgt,

      organizer:
        data.organizer,

      latitude:
        data.latitude,

      longitude:
        data.longitude,

      image:
        data.image,

      images:
        Array.isArray(data.images)
          ? data.images
          : [],

      isFree:
        data.is_free,

      ticketPrice:
        data.ticket_price,

      featured:
        data.featured,

      favorites:
        data.favorites,

      created_at:
        data.created_at,

      updated_at:
        data.updated_at,
    });
  } catch (err) {
    console.error(
      "[GET /events/:id] error:",
      err.response?.data ||
        err.message,
    );

    res.status(500).json({
      message:
        err.response?.data?.message ||
        err.message ||
        "Failed to load event.",
    });
  }
});

// =========================================================
// POST /api/events
// =========================================================

router.post(
  "/",
  protect,
  async (req, res) => {
    try {
      console.log(
        "[POST /events] payload:",
        JSON.stringify(
          req.body,
          null,
          2,
        ),
      );

      /*
       * Only title is required.
       */
      const title =
        cleanValue(req.body.title);

      if (!title) {
        return res.status(400).json({
          message:
            "Event name is required.",
        });
      }

      const dbPayload =
        buildEventPayload({
          ...req.body,
          title,
        });

      console.log(
        "[POST /events] database payload:",
        JSON.stringify(
          dbPayload,
          null,
          2,
        ),
      );

      const response =
        await axios.post(
          `${SUPABASE_URL}/rest/v1/events?select=*`,
          dbPayload,
          {
            headers:
              supabaseJsonHeaders,
          },
        );

      const created =
        Array.isArray(
          response.data,
        )
          ? response.data[0]
          : response.data;

      console.log(
        "[POST /events] created:",
        created,
      );

      res.status(201).json(
        created,
      );
    } catch (err) {
      console.error(
        "[POST /events] error:",
        err.response?.data ||
          err.message,
      );

      res.status(
        err.response?.status || 400,
      ).json({
        message:
          err.response?.data?.message ||
          err.message ||
          "Failed to create event.",
        details:
          err.response?.data || null,
      });
    }
  },
);

// =========================================================
// PUT /api/events/:id
// =========================================================

router.put(
  "/:id",
  protect,
  async (req, res) => {
    try {
      const id =
        req.params.id;

      if (!id) {
        return res.status(400).json({
          message:
            "Event ID is required.",
        });
      }

      const dbPayload =
        buildEventPayload(
          req.body,
        );

      /*
       * Title remains required when
       * updating an event as well.
       *
       * If the frontend sends no title,
       * retrieve the existing title.
       */
      if (!dbPayload.title) {
        const existingResponse =
          await axios.get(
            `${SUPABASE_URL}/rest/v1/events?id=eq.${encodeURIComponent(
              id,
            )}&select=title`,
            {
              headers:
                supabaseHeaders,
            },
          );

        const existing =
          Array.isArray(
            existingResponse.data,
          )
            ? existingResponse.data[0]
            : null;

        if (!existing) {
          return res.status(404).json({
            message:
              "Event not found.",
          });
        }

        dbPayload.title =
          existing.title;
      }

      console.log(
        "[PUT /events] database payload:",
        JSON.stringify(
          dbPayload,
          null,
          2,
        ),
      );

      await axios.patch(
        `${SUPABASE_URL}/rest/v1/events?id=eq.${encodeURIComponent(
          id,
        )}`,
        dbPayload,
        {
          headers: {
            ...supabaseJsonHeaders,
            Prefer:
              "return=minimal",
          },
        },
      );

      const getResponse =
        await axios.get(
          `${SUPABASE_URL}/rest/v1/events?id=eq.${encodeURIComponent(
            id,
          )}&select=*`,
          {
            headers:
              supabaseHeaders,
          },
        );

      const updated =
        Array.isArray(
          getResponse.data,
        )
          ? getResponse.data[0]
          : null;

      if (!updated) {
        return res.status(404).json({
          message:
            "Event not found after update.",
        });
      }

      res.json(updated);
    } catch (err) {
      console.error(
        "[PUT /events] error:",
        err.response?.data ||
          err.message,
      );

      res.status(
        err.response?.status || 400,
      ).json({
        message:
          err.response?.data?.message ||
          err.message ||
          "Failed to update event.",
        details:
          err.response?.data || null,
      });
    }
  },
);

// =========================================================
// DELETE /api/events/:id
// =========================================================

router.delete(
  "/:id",
  protect,
  async (req, res) => {
    try {
      const id =
        req.params.id;

      if (!id) {
        return res.status(400).json({
          message:
            "Event ID is required.",
        });
      }

      await axios.delete(
        `${SUPABASE_URL}/rest/v1/events?id=eq.${encodeURIComponent(
          id,
        )}`,
        {
          headers:
            supabaseHeaders,
        },
      );

      res.json({
        message:
          "Event deleted successfully.",
      });
    } catch (err) {
      console.error(
        "[DELETE /events] error:",
        err.response?.data ||
          err.message,
      );

      res.status(
        err.response?.status || 500,
      ).json({
        message:
          err.response?.data?.message ||
          err.message ||
          "Failed to delete event.",
      });
    }
  },
);

module.exports = router;
