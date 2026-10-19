
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
    "Warning: Supabase credentials are missing for memories routes."
  );
}

const supabaseHeaders = {
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
};

const supabaseJsonHeaders = {
  ...supabaseHeaders,
  "Content-Type": "application/json",
};

// =====================================================
// HELPERS
// =====================================================

const getSupabaseRestUrl = (tableName) =>
  `${SUPABASE_URL}/rest/v1/${tableName}`;

const isValidUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "")
  );

const isValidImageUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  try {
    const parsedUrl = new URL(value.trim());
    return (
      parsedUrl.protocol === "http:" ||
      parsedUrl.protocol === "https:"
    );
  } catch {
    return false;
  }
};

const getUserId = (req) =>
  req.user?.id || req.user?.user_id;

const normalizeImageUrls = (body = {}) => {
  let incomingImages = [];

  if (Array.isArray(body.image_urls)) {
    incomingImages = body.image_urls;
  } else if (Array.isArray(body.imageUrls)) {
    incomingImages = body.imageUrls;
  } else if (body.image_url) {
    incomingImages = [body.image_url];
  } else if (body.imageUrl) {
    incomingImages = [body.imageUrl];
  }

  return [
    ...new Set(
      incomingImages
        .map((url) => String(url || "").trim())
        .filter(Boolean)
    ),
  ];
};

const getSupabaseErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error_description ||
  error?.response?.data?.details ||
  error?.response?.data?.hint ||
  error?.message ||
  "An unexpected error occurred.";

// Allowed item types and their Supabase tables.
const ITEM_TABLES = {
  attraction: "attractions",
  accommodation: "accommodations",
  restaurant: "restaurants",
};

const getItemType = (value) => {
  const normalized = String(
    value || "attraction"
  ).trim().toLowerCase();

  return Object.prototype.hasOwnProperty.call(
    ITEM_TABLES,
    normalized
  )
    ? normalized
    : null;
};

const getItemName = (item, itemType) =>
  item?.name ||
  item?.title ||
  item?.restaurant_name ||
  item?.accommodation_name ||
  `Unnamed ${itemType}`;

const getItemImage = (item) => {
  if (!item || typeof item !== "object") {
    return null;
  }

  for (const field of [
    "image",
    "image_url",
    "cover_image",
    "thumbnail",
  ]) {
    if (
      typeof item[field] === "string" &&
      item[field].trim()
    ) {
      return item[field].trim();
    }
  }

  for (const field of [
    "images",
    "image_urls",
    "photos",
  ]) {
    const value = item[field];

    if (
      Array.isArray(value) &&
      typeof value[0] === "string" &&
      value[0].trim()
    ) {
      return value[0].trim();
    }

    if (typeof value === "string" && value.trim()) {
      try {
        const parsed = JSON.parse(value);

        if (
          Array.isArray(parsed) &&
          typeof parsed[0] === "string"
        ) {
          return parsed[0];
        }
      } catch {
        // Ignore values that are not JSON arrays.
      }
    }
  }

  return null;
};

const fetchItemById = async (itemType, itemId) => {
  const tableName = ITEM_TABLES[itemType];

  const url =
    `${getSupabaseRestUrl(tableName)}` +
    `?id=eq.${encodeURIComponent(String(itemId))}` +
    `&select=*`;

  const response = await axios.get(url, {
    headers: supabaseHeaders,
  });

  return Array.isArray(response.data)
    ? response.data[0] || null
    : null;
};

// Attach details for attractions, accommodations,
// and restaurants to each memory.
const attachItemDetails = async (memories = []) => {
  if (!Array.isArray(memories) || memories.length === 0) {
    return [];
  }

  const cache = new Map();

  await Promise.all(
    memories.map(async (memory) => {
      // Old memories may only have attraction_id.
      const itemType = getItemType(
        memory.item_type ||
          (memory.attraction_id ? "attraction" : "")
      );

      const itemId =
        memory.item_id || memory.attraction_id;

      if (!itemType || !itemId) {
        return;
      }

      const key = `${itemType}:${String(itemId)}`;

      if (cache.has(key)) {
        return;
      }

      try {
        const item = await fetchItemById(
          itemType,
          itemId
        );

        cache.set(key, item);
      } catch (error) {
        console.error(
          `Attach ${itemType} details error:`,
          error.response?.data || error.message
        );

        cache.set(key, null);
      }
    })
  );

  return memories.map((memory) => {
    const itemType = getItemType(
      memory.item_type ||
        (memory.attraction_id ? "attraction" : "")
    );

    const itemId =
      memory.item_id || memory.attraction_id;

    const relatedItem =
      itemType && itemId
        ? cache.get(
            `${itemType}:${String(itemId)}`
          ) || null
        : null;

    const details = relatedItem
      ? {
          id: relatedItem.id,
          name: getItemName(
            relatedItem,
            itemType
          ),
          image: getItemImage(relatedItem),
        }
      : null;

    return {
      ...memory,
      item: details
        ? { ...details, type: itemType }
        : null,

      // Keep the old attraction property working.
      attraction:
        itemType === "attraction"
          ? details
          : null,

      accommodation:
        itemType === "accommodation"
          ? details
          : null,

      restaurant:
        itemType === "restaurant"
          ? details
          : null,
    };
  });
};

const getMemoryRecordsForUser = async (
  userId,
  extraQuery = ""
) => {
  const url =
    `${getSupabaseRestUrl("memories")}` +
    `?user_id=eq.${encodeURIComponent(userId)}` +
    `${extraQuery}` +
    `&select=*&order=created_at.desc`;

  const response = await axios.get(url, {
    headers: supabaseHeaders,
  });

  return Array.isArray(response.data)
    ? response.data
    : [];
};

// =====================================================
// GET ALL MEMORIES FOR THE CURRENT USER
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

    const records =
      await getMemoryRecordsForUser(userId);

    const memories =
      await attachItemDetails(records);

    return res.status(200).json({ memories });
  } catch (error) {
    console.error(
      "Get user memories error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      message: "Failed to load your memories.",
    });
  }
});

// =====================================================
// GET MEMORIES FOR ONE ATTRACTION
// Legacy endpoint
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
          message:
            "Authenticated user ID is missing.",
        });
      }

      if (!isValidUuid(attractionId)) {
        return res.status(400).json({
          message: "Invalid attraction ID.",
        });
      }

      const records =
        await getMemoryRecordsForUser(
          userId,
          `&or=(attraction_id.eq.${encodeURIComponent(
            attractionId
          )},and(item_type.eq.attraction,item_id.eq.${encodeURIComponent(
            attractionId
          )}))`
        );

      const memories =
        await attachItemDetails(records);

      return res.status(200).json({ memories });
    } catch (error) {
      console.error(
        "Get attraction memories error:",
        error.response?.data || error.message
      );

      return res.status(500).json({
        message:
          "Failed to load memories for this attraction.",
      });
    }
  }
);

// =====================================================
// GET MEMORIES FOR A SPECIFIC ITEM
// GET /api/memories/item/:itemType/:itemId
// =====================================================

router.get(
  "/item/:itemType/:itemId",
  protectUser,
  async (req, res) => {
    try {
      const userId = getUserId(req);
      const itemType = getItemType(
        req.params.itemType
      );
      const itemId = String(
        req.params.itemId || ""
      ).trim();

      if (!userId) {
        return res.status(401).json({
          message:
            "Authenticated user ID is missing.",
        });
      }

      if (!itemType || !itemId) {
        return res.status(400).json({
          message:
            "A valid item type and item ID are required.",
        });
      }

      const records =
        await getMemoryRecordsForUser(
          userId,
          `&item_type=eq.${encodeURIComponent(
            itemType
          )}&item_id=eq.${encodeURIComponent(
            itemId
          )}`
        );

      const memories =
        await attachItemDetails(records);

      return res.status(200).json({ memories });
    } catch (error) {
      console.error(
        "Get item memories error:",
        error.response?.data || error.message
      );

      return res.status(500).json({
        message:
          "Failed to load memories for this item.",
      });
    }
  }
);

// =====================================================
// CREATE A MEMORY
// POST /api/memories
//
// Body:
// {
//   item_type: "attraction" | "accommodation" | "restaurant",
//   item_id: "selected item ID",
//   caption: "My memory",
//   image_urls: ["url1", "url2"]
// }
//
// Legacy attraction requests using attraction_id
// are also supported.
// =====================================================

router.post("/", protectUser, async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message:
          "Authenticated user ID is missing.",
      });
    }

    const body = req.body || {};

    const rawType =
      body.item_type ||
      body.itemType ||
      (body.attraction_id ? "attraction" : "");

    const itemType = getItemType(rawType);

    const itemId = String(
      body.item_id ||
        body.itemId ||
        body.attraction_id ||
        ""
    ).trim();

    const caption = String(
      body.caption || ""
    ).trim();

    const imageUrls = normalizeImageUrls(body);

    if (!itemType) {
      return res.status(400).json({
        message:
          "A valid item_type is required: attraction, accommodation, or restaurant.",
      });
    }

    if (!itemId) {
      return res.status(400).json({
        message: "Item ID is required.",
      });
    }

    if (
      itemType === "attraction" &&
      !isValidUuid(itemId)
    ) {
      return res.status(400).json({
        message: "Invalid attraction ID.",
      });
    }

    if (!caption) {
      return res.status(400).json({
        message: "Memory caption is required.",
      });
    }

    if (caption.length > 500) {
      return res.status(400).json({
        message:
          "Memory caption must not exceed 500 characters.",
      });
    }

    if (imageUrls.length === 0) {
      return res.status(400).json({
        message:
          "At least one image URL is required.",
      });
    }

    if (
      imageUrls.some(
        (url) => !isValidImageUrl(url)
      )
    ) {
      return res.status(400).json({
        message:
          "One or more image URLs are invalid.",
      });
    }

    // Check that the selected item exists
    // in the correct Supabase table.
    let relatedItem;

    try {
      relatedItem = await fetchItemById(
        itemType,
        itemId
      );
    } catch (error) {
      console.error(
        `Validate ${itemType} error:`,
        error.response?.data || error.message
      );

      return res.status(500).json({
        message:
          `Could not validate the selected ${itemType}.`,
      });
    }

    if (!relatedItem) {
      return res.status(404).json({
        message:
          `${itemType[0].toUpperCase()}${itemType.slice(
            1
          )} not found.`,
      });
    }

    const insertPayload = {
      user_id: userId,
      item_type: itemType,
      item_id: itemId,

      // Preserve compatibility with old attraction memories.
      attraction_id:
        itemType === "attraction"
          ? itemId
          : null,

      caption,
      image_url: imageUrls[0] || null,
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
      }
    );

    const createdMemory =
      insertResponse.data?.[0];

    if (!createdMemory) {
      return res.status(500).json({
        message: "Memory could not be created.",
      });
    }

    const [memoryWithDetails] =
      await attachItemDetails([createdMemory]);

    return res.status(201).json({
      message: "Memory added successfully.",
      memory:
        memoryWithDetails || createdMemory,
    });
  } catch (error) {
    console.error(
      "Create memory error:",
      error.response?.data || error.message
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
// UPDATE A MEMORY
// PUT /api/memories/:memoryId
// Only the owner can update their memory.
// =====================================================

router.put(
  "/:memoryId",
  protectUser,
  async (req, res) => {
    try {
      const userId = getUserId(req);
      const { memoryId } = req.params;
      const body = req.body || {};

      const caption = String(
        body.caption || ""
      ).trim();

      const imageUrls =
        normalizeImageUrls(body);

      if (!userId) {
        return res.status(401).json({
          message:
            "Authenticated user ID is missing.",
        });
      }

      if (!isValidUuid(memoryId)) {
        return res.status(400).json({
          message: "Invalid memory ID.",
        });
      }

      if (!caption) {
        return res.status(400).json({
          message: "Memory caption is required.",
        });
      }

      if (caption.length > 500) {
        return res.status(400).json({
          message:
            "Memory caption must not exceed 500 characters.",
        });
      }

      if (imageUrls.length === 0) {
        return res.status(400).json({
          message:
            "At least one image URL is required.",
        });
      }

      if (
        imageUrls.some(
          (url) => !isValidImageUrl(url)
        )
      ) {
        return res.status(400).json({
          message:
            "One or more image URLs are invalid.",
        });
      }

      const updateUrl =
        `${getSupabaseRestUrl("memories")}` +
        `?id=eq.${encodeURIComponent(memoryId)}` +
        `&user_id=eq.${encodeURIComponent(userId)}` +
        `&select=*`;

      const response = await axios.patch(
        updateUrl,
        {
          caption,
          image_url: imageUrls[0] || null,
          image_urls: imageUrls,
        },
        {
          headers: {
            ...supabaseJsonHeaders,
            Prefer: "return=representation",
          },
        }
      );

      const updatedMemory =
        response.data?.[0];

      if (!updatedMemory) {
        return res.status(404).json({
          message:
            "Memory not found or you do not have permission to update it.",
        });
      }

      const [memoryWithDetails] =
        await attachItemDetails([updatedMemory]);

      return res.status(200).json({
        message: "Memory updated successfully.",
        memory:
          memoryWithDetails || updatedMemory,
      });
    } catch (error) {
      console.error(
        "Update memory error:",
        error.response?.data || error.message
      );

      return res.status(500).json({
        message:
          getSupabaseErrorMessage(error) ||
          "Failed to update memory.",
      });
    }
  }
);

// =====================================================
// DELETE A MEMORY
// DELETE /api/memories/:memoryId
// Only the owner can delete their memory.
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
          message:
            "Authenticated user ID is missing.",
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

      const response = await axios.delete(
        deleteUrl,
        {
          headers: {
            ...supabaseHeaders,
            Prefer: "return=representation",
          },
        }
      );

      if (
        !Array.isArray(response.data) ||
        response.data.length === 0
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
        error.response?.data || error.message
      );

      return res.status(500).json({
        message: "Failed to delete memory.",
      });
    }
  }
);

module.exports = router;
