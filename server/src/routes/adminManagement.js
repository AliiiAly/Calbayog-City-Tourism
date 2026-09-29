const express = require("express");
const bcrypt = require("bcrypt");
const { protectAdmin } = require("../middleware/auth");

const router = express.Router();

/* =========================================================
   SUPABASE ADMIN HEADERS
========================================================= */

const getSupabaseHeaders = () => ({
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
});

/* =========================================================
   GET /api/admin-management
   Get all admins
========================================================= */

router.get("/", protectAdmin, async (req, res) => {
  try {
    const axios = require("axios");

    const response = await axios.get(
      `${process.env.SUPABASE_URL}/rest/v1/admins?select=id,username,email,name,created_at,updated_at&order=created_at.desc`,
      {
        headers: getSupabaseHeaders(),
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error("Get admins error:", err);

    res.status(500).json({
      message: err.message || "Failed to get admins.",
    });
  }
});

/* =========================================================
   GET /api/admin-management/:id
   Get single admin
========================================================= */

router.get("/:id", protectAdmin, async (req, res) => {
  try {
    const axios = require("axios");

    const response = await axios.get(
      `${process.env.SUPABASE_URL}/rest/v1/admins?id=eq.${encodeURIComponent(
        req.params.id
      )}&select=id,username,email,name,created_at,updated_at`,
      {
        headers: getSupabaseHeaders(),
      }
    );

    if (!response.data || response.data.length === 0) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    res.json(response.data[0]);
  } catch (err) {
    console.error("Get admin error:", err);

    res.status(500).json({
      message: err.message || "Failed to get admin.",
    });
  }
});

/* =========================================================
   POST /api/admin-management
   Create new admin
========================================================= */

router.post("/", protectAdmin, async (req, res) => {
  try {
    const {
      username,
      password,
      email,
      name,
    } = req.body;

    if (!username || !password || !email || !name) {
      return res.status(400).json({
        message:
          "Username, password, email, and name are required",
      });
    }

    const axios = require("axios");

    const normalizedUsername = String(username).trim();
    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();
    const normalizedName = String(name).trim();
    const normalizedPassword = String(password);

    /* -------------------------------------------------------
       Check username
    ------------------------------------------------------- */

    const existingUsername = await axios.get(
      `${process.env.SUPABASE_URL}/rest/v1/admins?username=eq.${encodeURIComponent(
        normalizedUsername
      )}&select=id`,
      {
        headers: getSupabaseHeaders(),
      }
    );

    if (
      existingUsername.data &&
      existingUsername.data.length > 0
    ) {
      return res.status(400).json({
        message: "Username already exists",
      });
    }

    /* -------------------------------------------------------
       Check email
    ------------------------------------------------------- */

    const existingEmail = await axios.get(
      `${process.env.SUPABASE_URL}/rest/v1/admins?email=eq.${encodeURIComponent(
        normalizedEmail
      )}&select=id`,
      {
        headers: getSupabaseHeaders(),
      }
    );

    if (
      existingEmail.data &&
      existingEmail.data.length > 0
    ) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    /* -------------------------------------------------------
       Hash password
    ------------------------------------------------------- */

    const hashedPassword = await bcrypt.hash(
      normalizedPassword,
      10
    );

    /* -------------------------------------------------------
       Insert admin
       
       IMPORTANT:
       - Password is stored only as a bcrypt hash.
       - mobile_pin is intentionally not populated.
    ------------------------------------------------------- */

    const insertResponse = await axios.post(
      `${process.env.SUPABASE_URL}/rest/v1/admins`,
      {
        username: normalizedUsername,
        password: hashedPassword,
        email: normalizedEmail,
        name: normalizedName,
        mobile_pin: null,
      },
      {
        headers: {
          ...getSupabaseHeaders(),
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
      }
    );

    if (
      !insertResponse.data ||
      insertResponse.data.length === 0
    ) {
      return res.status(500).json({
        message: "Admin was not created.",
      });
    }

    const admin = insertResponse.data[0];

    /*
      Never return password or mobile_pin.
    */

    const {
      password: _password,
      mobile_pin: _mobilePin,
      ...adminData
    } = admin;

    res.status(201).json(adminData);
  } catch (err) {
    console.error("Create admin error:", err);

    if (err.response?.data) {
      console.error(
        "Supabase create admin response:",
        err.response.data
      );
    }

    res.status(500).json({
      message:
        err.response?.data?.message ||
        err.message ||
        "Failed to create admin.",
    });
  }
});

/* =========================================================
   PUT /api/admin-management/:id
   Update admin
========================================================= */

router.put("/:id", protectAdmin, async (req, res) => {
  try {
    const {
      username,
      password,
      email,
      name,
    } = req.body;

    const axios = require("axios");

    /* -------------------------------------------------------
       Check if admin exists
    ------------------------------------------------------- */

    const existingAdmin = await axios.get(
      `${process.env.SUPABASE_URL}/rest/v1/admins?id=eq.${encodeURIComponent(
        req.params.id
      )}&select=id,username,email,name`,
      {
        headers: getSupabaseHeaders(),
      }
    );

    if (
      !existingAdmin.data ||
      existingAdmin.data.length === 0
    ) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    /* -------------------------------------------------------
       Build update data
    ------------------------------------------------------- */

    const updateData = {};

    if (
      username !== undefined &&
      String(username).trim() !== ""
    ) {
      updateData.username = String(username).trim();
    }

    if (
      email !== undefined &&
      String(email).trim() !== ""
    ) {
      updateData.email = String(email)
        .trim()
        .toLowerCase();
    }

    if (
      name !== undefined &&
      String(name).trim() !== ""
    ) {
      updateData.name = String(name).trim();
    }

    /* -------------------------------------------------------
       Password update
       
       IMPORTANT:
       Every new password is ALWAYS bcrypt-hashed.
       
       When a password is changed:
       - replace password with bcrypt hash
       - clear any legacy mobile_pin
    ------------------------------------------------------- */

    if (
      password !== undefined &&
      String(password).trim() !== ""
    ) {
      updateData.password = await bcrypt.hash(
        String(password),
        10
      );

      /*
        Remove the old mobile_pin value so the account
        no longer depends on a second password-like field.
      */
      updateData.mobile_pin = null;
    }

    /* -------------------------------------------------------
       Nothing to update
    ------------------------------------------------------- */

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "No changes were provided.",
      });
    }

    /* -------------------------------------------------------
       Update admin
    ------------------------------------------------------- */

    const updateResponse = await axios.patch(
      `${process.env.SUPABASE_URL}/rest/v1/admins?id=eq.${encodeURIComponent(
        req.params.id
      )}`,
      updateData,
      {
        headers: {
          ...getSupabaseHeaders(),
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
      }
    );

    if (
      !updateResponse.data ||
      updateResponse.data.length === 0
    ) {
      return res.status(500).json({
        message: "Admin was not updated.",
      });
    }

    const admin = updateResponse.data[0];

    /*
      Never return password or mobile_pin.
    */

    const {
      password: _password,
      mobile_pin: _mobilePin,
      ...adminData
    } = admin;

    res.json(adminData);
  } catch (err) {
    console.error("Update admin error:", err);

    if (err.response?.data) {
      console.error(
        "Supabase update admin response:",
        err.response.data
      );
    }

    res.status(500).json({
      message:
        err.response?.data?.message ||
        err.message ||
        "Failed to update admin.",
    });
  }
});

/* =========================================================
   DELETE /api/admin-management/:id
   Delete admin
========================================================= */

router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    /*
      Prevent deleting yourself.
    */

    if (String(req.params.id) === String(req.admin.id)) {
      return res.status(400).json({
        message: "Cannot delete your own account",
      });
    }

    const axios = require("axios");

    /* -------------------------------------------------------
       Check if admin exists
    ------------------------------------------------------- */

    const existingAdmin = await axios.get(
      `${process.env.SUPABASE_URL}/rest/v1/admins?id=eq.${encodeURIComponent(
        req.params.id
      )}&select=id`,
      {
        headers: getSupabaseHeaders(),
      }
    );

    if (
      !existingAdmin.data ||
      existingAdmin.data.length === 0
    ) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    /* -------------------------------------------------------
       Delete admin
    ------------------------------------------------------- */

    await axios.delete(
      `${process.env.SUPABASE_URL}/rest/v1/admins?id=eq.${encodeURIComponent(
        req.params.id
      )}`,
      {
        headers: getSupabaseHeaders(),
      }
    );

    res.json({
      message: "Admin deleted successfully",
    });
  } catch (err) {
    console.error("Delete admin error:", err);

    res.status(500).json({
      message:
        err.response?.data?.message ||
        err.message ||
        "Failed to delete admin.",
    });
  }
});

module.exports = router;
