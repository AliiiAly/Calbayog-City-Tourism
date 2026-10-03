const express = require("express");
const axios = require("axios");

const { protectAdmin } = require("../middleware/auth");

const router = express.Router();

/* =========================================================
   SUPABASE CONFIG
========================================================= */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "[Users Route] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing."
  );
}

/* =========================================================
   SUPABASE REQUEST
========================================================= */

const supabaseRequest = async ({
  method,
  url,
  data,
  params,
}) => {
  return axios({
    method,
    url: `${SUPABASE_URL}/rest/v1/${url}`,
    params,
    data,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
  });
};

/* =========================================================
   SAFE USER RESPONSE
========================================================= */

/*
 * IMPORTANT:
 *
 * Never send these fields to the browser:
 *
 * password
 * email_verification_token_hash
 * email_verification_expires_at
 * password_reset_token_hash
 * password_reset_expires_at
 *
 * AdminUsers only needs the safe account information.
 */

const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email || "",
    name: user.name,
    is_active:
      typeof user.is_active === "boolean"
        ? user.is_active
        : true,
    email_verified:
      typeof user.email_verified === "boolean"
        ? user.email_verified
        : false,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
};

/* =========================================================
   GET ALL USERS
========================================================= */

router.get("/", protectAdmin, async (req, res) => {
  try {
    const response = await supabaseRequest({
      method: "GET",
      url:
        "users" +
        "?select=id,username,email,name,is_active,email_verified,created_at,updated_at" +
        "&order=created_at.desc",
    });

    const users = Array.isArray(response.data)
      ? response.data.map(sanitizeUser)
      : [];

    return res.status(200).json(users);
  } catch (error) {
    console.error(
      "[Users Route] Failed to load users:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load users.",
    });
  }
});

/* =========================================================
   GET ONE USER
========================================================= */

router.get("/:id", protectAdmin, async (req, res) => {
  try {
    const response = await supabaseRequest({
      method: "GET",
      url:
        "users" +
        "?select=id,username,email,name,is_active,email_verified,created_at,updated_at" +
        `&id=eq.${encodeURIComponent(req.params.id)}`,
    });

    const user = response.data?.[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json(sanitizeUser(user));
  } catch (error) {
    console.error(
      "[Users Route] Failed to load user:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load user.",
    });
  }
});

/* =========================================================
   CREATE USER
========================================================= */

router.post("/", protectAdmin, async (req, res) => {
  try {
    const {
      username,
      email,
      name,
      password,
      is_active,
    } = req.body || {};

    if (!username || !String(username).trim()) {
      return res.status(400).json({
        success: false,
        message: "Username is required.",
      });
    }

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    if (!password || String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password is required and must be at least 6 characters.",
      });
    }

    const normalizedUsername =
      String(username).trim();

    const normalizedEmail =
      email && String(email).trim()
        ? String(email).trim().toLowerCase()
        : normalizedUsername.toLowerCase();

    const payload = {
      username: normalizedUsername,
      email: normalizedEmail,
      name: String(name).trim(),
      password: String(password),
      is_active:
        typeof is_active === "boolean"
          ? is_active
          : true,
      email_verified: false,
    };

    const response = await supabaseRequest({
      method: "POST",
      url: "users",
      data: payload,
    });

    const createdUser = response.data?.[0];

    return res.status(201).json({
      success: true,
      user: sanitizeUser(createdUser),
    });
  } catch (error) {
    console.error(
      "[Users Route] Failed to create user:",
      error.response?.data || error.message
    );

    const supabaseError =
      error.response?.data;

    if (
      supabaseError?.code === "23505"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "A user with that username or email already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create user.",
    });
  }
});

/* =========================================================
   UPDATE USER
========================================================= */

router.patch("/:id", protectAdmin, async (req, res) => {
  try {
    const {
      username,
      email,
      name,
      password,
      is_active,
    } = req.body || {};

    const updateData = {};

    if (
      username !== undefined &&
      String(username).trim()
    ) {
      updateData.username =
        String(username).trim();
    }

    if (email !== undefined) {
      updateData.email =
        email && String(email).trim()
          ? String(email).trim().toLowerCase()
          : null;
    }

    if (
      name !== undefined &&
      String(name).trim()
    ) {
      updateData.name =
        String(name).trim();
    }

    if (
      typeof is_active === "boolean"
    ) {
      updateData.is_active = is_active;
    }

    if (
      password !== undefined &&
      String(password).trim()
    ) {
      if (String(password).length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 6 characters.",
        });
      }

      updateData.password =
        String(password);
    }

    updateData.updated_at =
      new Date().toISOString();

    if (
      Object.keys(updateData).length === 1 &&
      updateData.updated_at
    ) {
      return res.status(400).json({
        success: false,
        message: "No user changes were provided.",
      });
    }

    const response = await supabaseRequest({
      method: "PATCH",
      url:
        "users" +
        `?id=eq.${encodeURIComponent(req.params.id)}`,
      data: updateData,
    });

    const updatedUser = response.data?.[0];

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user: sanitizeUser(updatedUser),
    });
  } catch (error) {
    console.error(
      "[Users Route] Failed to update user:",
      error.response?.data || error.message
    );

    const supabaseError =
      error.response?.data;

    if (
      supabaseError?.code === "23505"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "A user with that username or email already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update user.",
    });
  }
});

/* =========================================================
   DELETE USER
========================================================= */

router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const response = await supabaseRequest({
      method: "DELETE",
      url:
        "users" +
        `?id=eq.${encodeURIComponent(req.params.id)}`,
    });

    if (!response.data?.length) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    console.error(
      "[Users Route] Failed to delete user:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete user.",
    });
  }
});

module.exports = router;
