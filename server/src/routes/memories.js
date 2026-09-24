
const express = require("express");
const axios = require("axios");

const { protectUser } = require("../middleware/auth");

const router = express.Router();

// =====================================================
// SUPABASE CONFIGURATION
// =====================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "Warning: Supabase credentials are missing for memories routes.",
  );
}

// =====================================================
// SUPABASE HEADERS
// =====================================================

const supabaseHeaders = {
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
};

const supabaseJsonHeaders = {
  ...supabaseHeaders,
  "Content-Type": "application/json",
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

const getSupabaseRestUrl = (tableName) => {
  return `${SUPABASE_URL}/rest/v1/${tableName}`;
};

/**
 * Validate UUID values.
 */
const isValidUuid = (value) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || ""),
  );
};

/**
 * Validate image URLs.
 */
const isValidImageUrl = (value) => {
  if (typeof value !== "string") {
    return false;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return false;
  }

  try {
    const parsedUrl = new URL(trimmedValue);

    return (
      parsedUrl.protocol === "http:" ||
      parsedUrl.protocol === "https:"
    );
  } catch {
    return false;
  }
};

/**
 * Get the authenticated user's ID.
 */
const getUserId = (req) => {
  return req.user?.id || req.user?.user_id;
};

/**
 * Normalize image URLs.
 *
 * Supports:
 *
 * image_urls: ["url1", "url2"]
 *
 * and:
 *
 * image_url: "url1"
 */
const normalizeImageUrls = (body = {}) => {
  let incomingImages = [];

  if (Array.isArray(body.image_urls)) {
    incomingImages = body.image_urls;
  } else if (body.image_url) {
    incomingImages = [body.image_url];
  }

  const cleanedImages = incomingImages
    .map((imageUrl) => String(imageUrl || "").trim())
    .filter(Boolean);

  return [...new Set(cleanedImages)];
};

/**
 * Return a consistent Supabase error message.
 */
const getSupabaseErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error_description ||
    error?.response?.data?.details ||
    error?.response?.data?.hint ||
    error?.message ||
    "An unexpected error occurred."
  );
};

/**
 * Get an attraction image.
 *
 * Supports multiple possible image field formats
 * used in the attractions table.
 */
const getAttractionImage = (attraction) => {
  if (!attraction || typeof attraction !== "object") {
    return null;
  }

  if (
    typeof attraction.image === "string" &&
    attraction.image.trim()
  ) {
    return attraction.image;
  }

  if (
    typeof attraction.image_url === "string" &&
    attraction.image_url.trim()
  ) {
    return attraction.image_url;
  }

  if (
    Array.isArray(attraction.images) &&
    typeof attraction.images[0] === "string"
  ) {
    return attraction.images[0];
  }

  if (
    Array.isArray(attraction.image_urls) &&
    typeof attraction.image_urls[0] === "string"
  ) {
    return attraction.image_urls[0];
  }

  return null;
};

/**
 * Attach attraction information to memory records.
 *
 * A memory stores attraction_id.
 * This helper retrieves the related attraction and adds:
 *
 * attraction: {
 *   id,
 *   name,
 *   image
 * }
 */
const attachAttractionDetails = async (memories = []) => {
  if (!Array.isArray(memories) || memories.length === 0) {
    return [];
  }

  const attractionIds = [
    ...new Set(
      memories
        .map((memory) => String(memory.attraction_id || "").trim())
        .filter(Boolean),
    ),
  ];

  if (attractionIds.length === 0) {
    return memories;
  }

  try {
    // Fetch attractions from Supabase.
    // The response is filtered locally so this works
    // with different attraction ID formats.
    const attractionsUrl =
      `${getSupabaseRestUrl("attractions")}` +
      `?select=*`;

    const attractionsResponse = await axios.get(attractionsUrl, {
      headers: supabaseHeaders,
    });

    const attractions = Array.isArray(attractionsResponse.data)
      ? attractionsResponse.data
      : [];

    const attractionsMap = new Map(
      attractions
        .filter((attraction) => attraction?.id !== undefined)
        .map((attraction) => [
          String(attraction.id),
          attraction,
        ]),
    );

    return memories.map((memory) => {
      const attraction = attractionsMap.get(
        String(memory.attraction_id),
      );

      return {
        ...memory,
        attraction: attraction
          ? {
              id: attraction.id,
              name:
                attraction.name ||
                attraction.title ||
                "Unnamed attraction",
              image: getAttractionImage(attraction),
            }
          : null,
      };
    });
  } catch (error) {
    console.error(
      "Attach attraction details error:",
      error.response?.data || error.message,
    );

    // Return memories even if attraction details
    // cannot be retrieved.
    return memories.map((memory) => ({
      ...memory,
      attraction: null,
    }));
  }
};

// =====================================================
// GET ALL MEMORIES OF THE CURRENT USER
//
// GET /api/memories
// =====================================================

router.get("/", protectUser, async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Authenticated user ID is missing.",
      });
    }

    const memoriesUrl =
      `${getSupabaseRestUrl("memories")}` +
      `?user_id=eq.${encodeURIComponent(userId)}` +
      `&select=*` +
      `&order=created_at.desc`;

    const response = await axios.get(memoriesUrl, {
      headers: supabaseHeaders,
    });

    const memoryRecords = Array.isArray(response.data)
      ? response.data
      : [];

    const memories = await attachAttractionDetails(memoryRecords);

    return res.status(200).json({
      memories,
    });
  } catch (error) {
    console.error(
      "Get user memories error:",
      error.response?.data || error.message,
    );

    return res.status(500).json({
      message: "Failed to load your memories.",
    });
  }
});

// =====================================================
// GET MEMORIES FOR ONE ATTRACTION
//
// ONLY THE CURRENT USER'S MEMORIES ARE RETURNED.
//
// GET /api/memories/attraction/:attractionId
// =====================================================

router.get(
  "/attraction/:attractionId",
  protectUser,
  async (req, res) => {
    try {
      const userId = getUserId(req);
      const { attractionId } = req.params;

      if (!userId) {
        return res.status(401).json({
          message: "Authenticated user ID is missing.",
        });
      }

      if (!isValidUuid(attractionId)) {
        return res.status(400).json({
          message: "Invalid attraction ID.",
        });
      }

      const memoriesUrl =
        `${getSupabaseRestUrl("memories")}` +
        `?user_id=eq.${encodeURIComponent(userId)}` +
        `&attraction_id=eq.${encodeURIComponent(attractionId)}` +
        `&select=*` +
        `&order=created_at.desc`;

      const response = await axios.get(memoriesUrl, {
        headers: supabaseHeaders,
      });

      const memoryRecords = Array.isArray(response.data)
        ? response.data
        : [];

      const memories = await attachAttractionDetails(memoryRecords);

      return res.status(200).json({
        memories,
      });
    } catch (error) {
      console.error(
        "Get attraction memories error:",
        error.response?.data || error.message,
      );

      return res.status(500).json({
        message: "Failed to load memories for this attraction.",
      });
    }
  },
);

// =====================================================
// CREATE A MEMORY
//
// POST /api/memories
//
// Expected request body:
//
// {
//   "attraction_id": "uuid",
//   "caption": "Beautiful experience!",
//   "image_urls": [
//     "https://example.com/image1.jpg",
//     "https://example.com/image2.jpg"
//   ]
// }
// =====================================================

router.post("/", protectUser, async (req, res) => {
  try {
    const userId = getUserId(req);

    const {
      attraction_id: attractionId,
      caption,
    } = req.body;

    const imageUrls = normalizeImageUrls(req.body);

    // -------------------------------------------------
    // VALIDATE USER
    // -------------------------------------------------

    if (!userId) {
      return res.status(401).json({
        message: "Authenticated user ID is missing.",
      });
    }

    // -------------------------------------------------
    // VALIDATE ATTRACTION ID
    // -------------------------------------------------

    if (!attractionId) {
      return res.status(400).json({
        message: "Attraction ID is required.",
      });
    }

    if (!isValidUuid(attractionId)) {
      return res.status(400).json({
        message: "Invalid attraction ID.",
      });
    }

    // -------------------------------------------------
    // VALIDATE CAPTION
    // -------------------------------------------------

    const trimmedCaption = String(caption || "").trim();

    if (!trimmedCaption) {
      return res.status(400).json({
        message: "Memory caption is required.",
      });
    }

    if (trimmedCaption.length > 500) {
      return res.status(400).json({
        message:
          "Memory caption must not exceed 500 characters.",
      });
    }

    // -------------------------------------------------
    // VALIDATE IMAGES
    // -------------------------------------------------

    if (imageUrls.length === 0) {
      return res.status(400).json({
        message: "At least one image URL is required.",
      });
    }

    if (imageUrls.length > 10) {
      return res.status(400).json({
        message:
          "You can upload a maximum of 10 pictures per memory.",
      });
    }

    const invalidImageUrl = imageUrls.find(
      (imageUrl) => !isValidImageUrl(imageUrl),
    );

    if (invalidImageUrl) {
      return res.status(400).json({
        message: "One or more image URLs are invalid.",
      });
    }

    // -------------------------------------------------
    // CHECK IF ATTRACTION EXISTS
    // -------------------------------------------------

    const attractionUrl =
      `${getSupabaseRestUrl("attractions")}` +
      `?id=eq.${encodeURIComponent(attractionId)}` +
      `&select=id`;

    const attractionResponse = await axios.get(
      attractionUrl,
      {
        headers: supabaseHeaders,
      },
    );

    if (
      !Array.isArray(attractionResponse.data) ||
      attractionResponse.data.length === 0
    ) {
      return res.status(404).json({
        message: "Attraction not found.",
      });
    }

    // -------------------------------------------------
    // INSERT MEMORY
    // -------------------------------------------------

    const insertPayload = {
      user_id: userId,
      attraction_id: attractionId,
      caption: trimmedCaption,
      image_urls: imageUrls,
    };

    const insertResponse = await axios.post(
      getSupabaseRestUrl("memories"),
      insertPayload,
      {
        headers: {
          ...supabaseJsonHeaders,
          Prefer: "return=representation",
        },
      },
    );

    const createdMemory = insertResponse.data?.[0];

    if (!createdMemory) {
      return res.status(500).json({
        message: "Memory could not be created.",
      });
    }

    // Attach attraction information to the newly
    // created memory before returning it.
    const [memoryWithAttraction] =
      await attachAttractionDetails([createdMemory]);

    return res.status(201).json({
      message: "Memory added successfully.",
      memory: memoryWithAttraction || createdMemory,
    });
  } catch (error) {
    console.error(
      "Create memory error:",
      error.response?.data || error.message,
    );

    return res.status(500).json({
      message:
        getSupabaseErrorMessage(error) ||
        "Failed to create memory.",
      details:
        process.env.NODE_ENV === "development"
          ? error.response?.data
          : undefined,
    });
  }
});

// =====================================================
// DELETE A MEMORY
//
// ONLY THE OWNER CAN DELETE THEIR MEMORY.
//
// DELETE /api/memories/:memoryId
// =====================================================

router.delete(
  "/:memoryId",
  protectUser,
  async (req, res) => {
    try {
      const userId = getUserId(req);
      const { memoryId } = req.params;

      if (!userId) {
        return res.status(401).json({
          message: "Authenticated user ID is missing.",
        });
      }

      if (!isValidUuid(memoryId)) {
        return res.status(400).json({
          message: "Invalid memory ID.",
        });
      }

      const deleteUrl =
        `${getSupabaseRestUrl("memories")}` +
        `?id=eq.${encodeURIComponent(memoryId)}` +
        `&user_id=eq.${encodeURIComponent(userId)}`;

      const deleteResponse = await axios.delete(
        deleteUrl,
        {
          headers: {
            ...supabaseHeaders,
            Prefer: "return=representation",
          },
        },
      );

      if (
        !Array.isArray(deleteResponse.data) ||
        deleteResponse.data.length === 0
      ) {
        return res.status(404).json({
          message:
            "Memory not found or you do not have permission to delete it.",
        });
      }

      return res.status(200).json({
        message: "Memory deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete memory error:",
        error.response?.data || error.message,
      );

      return res.status(500).json({
        message: "Failed to delete memory.",
      });
    }
  },
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;