const express = require("express");
const multer = require("multer");
const path = require("path");
const axios = require("axios");
const { protect } = require("../middleware/auth");

const router = express.Router();

// =========================================================
// SUPABASE
// =========================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const STORAGE_BUCKET = "featured-videos";

// =========================================================
// MULTER
// =========================================================

// Featured Videos are currently limited to MP4 files.
// Memory storage is used because the file will be uploaded
// directly to Supabase Storage by the server.

const storage = multer.memoryStorage();

const videoFilter = (req, file, cb) => {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  const allowedExtensions = [".mp4"];

  if (
    allowedExtensions.includes(extension) &&
    file.mimetype === "video/mp4"
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only MP4 video files are allowed."
      )
    );
  }
};

const upload = multer({
  storage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 200 * 1024 * 1024,
  },
});

// =========================================================
// SUPABASE HEADERS
// =========================================================

const supabaseHeaders = {
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
};

// =========================================================
// GET FEATURED VIDEOS
// =========================================================

// GET /api/featured-videos
//
// Public endpoint.
// The Welcome page uses this to display Featured Videos.

router.get("/", async (req, res) => {
  try {
    const response = await axios.get(
      `${SUPABASE_URL}/rest/v1/featured_videos`,
      {
        params: {
          select: "*",
          order: "created_at.desc",
        },
        headers: supabaseHeaders,
      }
    );

    res.json({
      data: Array.isArray(response.data)
        ? response.data
        : [],
    });
  } catch (error) {
    console.error(
      "Get featured videos error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      message:
        error.response?.data?.message ||
        "Failed to get featured videos.",
    });
  }
});

// =========================================================
// POST FEATURED VIDEO
// =========================================================

// POST /api/featured-videos
//
// Admin only.
//
// FormData fields:
// - title
// - description
// - video

router.post(
  "/",
  protect,
  upload.single("video"),
  async (req, res) => {
    let storagePath = null;

    try {
      if (!req.file) {
        return res.status(400).json({
          message: "No video file uploaded.",
        });
      }

      const title =
        typeof req.body.title === "string"
          ? req.body.title.trim()
          : "";

      const description =
        typeof req.body.description === "string"
          ? req.body.description.trim()
          : "";

      if (!title) {
        return res.status(400).json({
          message: "Video title is required.",
        });
      }

      if (!SUPABASE_URL) {
        return res.status(500).json({
          message: "Supabase URL is not configured.",
        });
      }

      if (!SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({
          message:
            "Supabase service role key is not configured.",
        });
      }

      // =====================================================
      // CREATE STORAGE PATH
      // =====================================================

      const uniqueName = `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}.mp4`;

      storagePath = uniqueName;

      // =====================================================
      // UPLOAD VIDEO TO SUPABASE STORAGE
      // =====================================================

      await axios.post(
        `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${encodeURIComponent(
          storagePath
        )}`,
        req.file.buffer,
        {
          headers: {
            ...supabaseHeaders,
            "Content-Type": "video/mp4",
            "x-upsert": "false",
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      // =====================================================
      // PUBLIC VIDEO URL
      // =====================================================

      const videoUrl =
        `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${encodeURIComponent(
          storagePath
        )}`;

      // =====================================================
      // CREATE DATABASE RECORD
      // =====================================================

      const insertResponse = await axios.post(
        `${SUPABASE_URL}/rest/v1/featured_videos`,
        {
          title,
          description:
            description || null,
          video_url: videoUrl,
          storage_path: storagePath,
        },
        {
          headers: {
            ...supabaseHeaders,
            "Content-Type":
              "application/json",
            Prefer:
              "return=representation",
          },
        }
      );

      const video =
        Array.isArray(insertResponse.data)
          ? insertResponse.data[0]
          : null;

      if (!video) {
        throw new Error(
          "Featured video was uploaded, but the database record could not be created."
        );
      }

      return res.status(201).json({
        message:
          "Featured video uploaded successfully.",
        data: video,
      });
    } catch (error) {
      console.error(
        "Create featured video error:",
        error.response?.data ||
          error.message
      );

      // =====================================================
      // CLEAN UP STORAGE IF DATABASE INSERT FAILED
      // =====================================================

      if (storagePath) {
        try {
          await axios.post(
            `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/remove`,
            {
              prefixes: [storagePath],
            },
            {
              headers: {
                ...supabaseHeaders,
                "Content-Type":
                  "application/json",
              },
            }
          );
        } catch (cleanupError) {
          console.error(
            "Featured video storage cleanup error:",
            cleanupError.response?.data ||
              cleanupError.message
          );
        }
      }

      const status =
        error.response?.status >= 400 &&
        error.response?.status < 600
          ? error.response.status
          : 500;

      return res.status(status).json({
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to upload featured video.",
      });
    }
  }
);

// =========================================================
// DELETE FEATURED VIDEO
// =========================================================

// DELETE /api/featured-videos/:id
//
// Admin only.
//
// Deletes:
// 1. Database record
// 2. Supabase Storage file

router.delete(
  "/:id",
  protect,
  async (req, res) => {
    try {
      const videoId = req.params.id;

      if (!videoId) {
        return res.status(400).json({
          message:
            "Featured video ID is required.",
        });
      }

      // =====================================================
      // GET EXISTING VIDEO
      // =====================================================

      const existingResponse =
        await axios.get(
          `${SUPABASE_URL}/rest/v1/featured_videos`,
          {
            params: {
              id: `eq.${videoId}`,
              select: "*",
            },
            headers: supabaseHeaders,
          }
        );

      const existingVideos =
        Array.isArray(
          existingResponse.data
        )
          ? existingResponse.data
          : [];

      if (existingVideos.length === 0) {
        return res.status(404).json({
          message:
            "Featured video not found.",
        });
      }

      const video =
        existingVideos[0];

      // =====================================================
      // DELETE DATABASE RECORD
      // =====================================================

      await axios.delete(
        `${SUPABASE_URL}/rest/v1/featured_videos`,
        {
          params: {
            id: `eq.${videoId}`,
          },
          headers: supabaseHeaders,
        }
      );

      // =====================================================
      // DELETE STORAGE FILE
      // =====================================================

      if (video.storage_path) {
        try {
          await axios.post(
            `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/remove`,
            {
              prefixes: [
                video.storage_path,
              ],
            },
            {
              headers: {
                ...supabaseHeaders,
                "Content-Type":
                  "application/json",
              },
            }
          );
        } catch (storageError) {
          console.error(
            "Featured video storage deletion error:",
            storageError.response?.data ||
              storageError.message
          );

          // The database record has already
          // been removed, so report the storage
          // issue without pretending the whole
          // operation failed.
        }
      }

      return res.json({
        message:
          "Featured video deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete featured video error:",
        error.response?.data ||
          error.message
      );

      return res.status(500).json({
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete featured video.",
      });
    }
  }
);

// =========================================================
// MULTER ERROR HANDLER
// =========================================================

router.use(
  (error, req, res, next) => {
    if (
      error instanceof
      multer.MulterError
    ) {
      console.error(
        "Featured video multer error:",
        error
      );

      return res.status(400).json({
        message:
          `Video upload error: ${error.message}`,
      });
    }

    if (error) {
      console.error(
        "Featured video upload error:",
        error
      );

      return res.status(400).json({
        message:
          error.message ||
          "Featured video upload failed.",
      });
    }

    next();
  }
);

module.exports = router;
