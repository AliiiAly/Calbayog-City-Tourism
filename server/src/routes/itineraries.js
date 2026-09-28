const express = require("express");
const router = express.Router();
const axios = require("axios");

const { protectUser } = require("../middleware/auth");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseHeaders = {
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

// Get the authenticated user's ID
function getUserId(req) {
  return req.user?.id || req.user?.user_id || null;
}

/*
 * GET /api/itineraries
 *
 * Loads the logged-in user's saved itinerary.
 */
router.get("/", protectUser, async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "User authentication required.",
      });
    }

    const response = await axios.get(
      `${SUPABASE_URL}/rest/v1/itineraries`,
      {
        headers: supabaseHeaders,
        params: {
          user_id: `eq.${userId}`,
          select: "*",
          order: "updated_at.desc",
        },
      }
    );

    return res.json({
      success: true,
      itinerary: response.data?.[0] || null,
    });
  } catch (error) {
    console.error(
      "GET /api/itineraries error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load itinerary.",
    });
  }
});

/*
 * POST /api/itineraries
 *
 * Creates a saved itinerary for the logged-in user.
 */
router.post("/", protectUser, async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "User authentication required.",
      });
    }

    const {
      travel_date_start,
      travel_date_end,
      group_size,
      group_type,
      selected_interests,
      travel_pace,
      budget,
      special_requests,
      days,
    } = req.body;

    if (!travel_date_start || !travel_date_end) {
      return res.status(400).json({
        message: "Travel start and end dates are required.",
      });
    }

    if (
      !Number.isInteger(Number(group_size)) ||
      Number(group_size) < 1
    ) {
      return res.status(400).json({
        message: "Group size must be at least 1.",
      });
    }

    if (!Array.isArray(selected_interests)) {
      return res.status(400).json({
        message: "Selected interests must be an array.",
      });
    }

    if (!Array.isArray(days)) {
      return res.status(400).json({
        message: "Itinerary days must be an array.",
      });
    }

    const insertPayload = {
      user_id: userId,
      travel_date_start,
      travel_date_end,
      group_size: Number(group_size),
      group_type: group_type || "Solo",
      selected_interests,
      travel_pace: travel_pace || "Balanced",
      budget: budget || "Moderate",
      special_requests: special_requests || "",
      days,
    };

    const response = await axios.post(
      `${SUPABASE_URL}/rest/v1/itineraries`,
      insertPayload,
      {
        headers: {
          ...supabaseHeaders,
          Prefer: "return=representation",
        },
      }
    );

    return res.status(201).json({
      success: true,
      message: "Itinerary saved successfully.",
      itinerary: response.data?.[0] || null,
    });
  } catch (error) {
    console.error(
      "POST /api/itineraries error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to save itinerary.",
    });
  }
});

/*
 * PUT /api/itineraries/:id
 *
 * Updates only an itinerary belonging to the logged-in user.
 */
router.put("/:id", protectUser, async (req, res) => {
  try {
    const userId = getUserId(req);
    const itineraryId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        message: "User authentication required.",
      });
    }

    if (!itineraryId) {
      return res.status(400).json({
        message: "Itinerary ID is required.",
      });
    }

    const {
      travel_date_start,
      travel_date_end,
      group_size,
      group_type,
      selected_interests,
      travel_pace,
      budget,
      special_requests,
      days,
    } = req.body;

    if (!travel_date_start || !travel_date_end) {
      return res.status(400).json({
        message: "Travel start and end dates are required.",
      });
    }

    if (
      !Number.isInteger(Number(group_size)) ||
      Number(group_size) < 1
    ) {
      return res.status(400).json({
        message: "Group size must be at least 1.",
      });
    }

    if (!Array.isArray(selected_interests)) {
      return res.status(400).json({
        message: "Selected interests must be an array.",
      });
    }

    if (!Array.isArray(days)) {
      return res.status(400).json({
        message: "Itinerary days must be an array.",
      });
    }

    const updatePayload = {
      travel_date_start,
      travel_date_end,
      group_size: Number(group_size),
      group_type: group_type || "Solo",
      selected_interests,
      travel_pace: travel_pace || "Balanced",
      budget: budget || "Moderate",
      special_requests: special_requests || "",
      days,
      updated_at: new Date().toISOString(),
    };

    const response = await axios.patch(
      `${SUPABASE_URL}/rest/v1/itineraries`,
      updatePayload,
      {
        headers: {
          ...supabaseHeaders,
          Prefer: "return=representation",
        },
        params: {
          id: `eq.${itineraryId}`,
          user_id: `eq.${userId}`,
        },
      }
    );

    if (!response.data || response.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Itinerary not found.",
      });
    }

    return res.json({
      success: true,
      message: "Itinerary updated successfully.",
      itinerary: response.data[0],
    });
  } catch (error) {
    console.error(
      "PUT /api/itineraries/:id error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update itinerary.",
    });
  }
});

/*
 * DELETE /api/itineraries/:id
 *
 * Deletes only an itinerary belonging to the logged-in user.
 */
router.delete("/:id", protectUser, async (req, res) => {
  try {
    const userId = getUserId(req);
    const itineraryId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        message: "User authentication required.",
      });
    }

    if (!itineraryId) {
      return res.status(400).json({
        message: "Itinerary ID is required.",
      });
    }

    const response = await axios.delete(
      `${SUPABASE_URL}/rest/v1/itineraries`,
      {
        headers: {
          ...supabaseHeaders,
          Prefer: "return=representation",
        },
        params: {
          id: `eq.${itineraryId}`,
          user_id: `eq.${userId}`,
        },
      }
    );

    if (!response.data || response.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Itinerary not found.",
      });
    }

    return res.json({
      success: true,
      message: "Itinerary deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE /api/itineraries/:id error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete itinerary.",
    });
  }
});

module.exports = router;
