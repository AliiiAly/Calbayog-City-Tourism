const jwt = require("jsonwebtoken");
const axios = require("axios");

/* =========================================================
   HELPERS
========================================================= */

const getJwtSecret = () => {
  return (
    process.env.JWT_SECRET ||
    "your-secret-key"
  );
};

const getSupabaseRestUrl = (table) => {
  return `${process.env.SUPABASE_URL}/rest/v1/${table}`;
};

const supabaseHeaders = {
  apikey:
    process.env.SUPABASE_SERVICE_ROLE_KEY,

  Authorization:
    `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
};

/* =========================================================
   USER AUTHENTICATION MIDDLEWARE
========================================================= */

/*
  This middleware is ONLY for logged-in tourism users.

  It:
  1. Checks the Bearer token
  2. Verifies the JWT
  3. Finds the corresponding user in public.users
  4. Checks that the account is active
  5. Checks that the Gmail account is verified
  6. Stores the user in req.user

  Admin authentication continues to use the existing
  middleware/auth.js -> protect()
*/

const userProtect = async (
  req,
  res,
  next
) => {
  try {
    /* -----------------------------------------------------
       AUTHORIZATION HEADER
    ----------------------------------------------------- */

    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith(
        "Bearer "
      )
    ) {
      return res.status(401).json({
        message:
          "Unauthorized - no user token provided.",
      });
    }

    /* -----------------------------------------------------
       TOKEN
    ----------------------------------------------------- */

    const token =
      authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message:
          "Unauthorized - invalid user token.",
      });
    }

    /* -----------------------------------------------------
       VERIFY JWT
    ----------------------------------------------------- */

    let decoded;

    try {
      decoded = jwt.verify(
        token,
        getJwtSecret()
      );
    } catch (error) {
      return res.status(401).json({
        message:
          "Unauthorized - invalid or expired user token.",
      });
    }

    /* -----------------------------------------------------
       USER ID REQUIRED
    ----------------------------------------------------- */

    if (!decoded?.id) {
      return res.status(401).json({
        message:
          "Unauthorized - invalid user identity.",
      });
    }

    /* -----------------------------------------------------
       LOAD USER FROM DATABASE
    ----------------------------------------------------- */

    const response =
      await axios.get(
        `${getSupabaseRestUrl(
          "users"
        )}?id=eq.${encodeURIComponent(
          decoded.id
        )}&select=id,username,email,name,is_active,email_verified,created_at,updated_at`,
        {
          headers:
            supabaseHeaders,
        }
      );

    const user =
      response.data?.[0];

    /* -----------------------------------------------------
       USER NOT FOUND
    ----------------------------------------------------- */

    if (!user) {
      return res.status(401).json({
        message:
          "Unauthorized - user account not found.",
      });
    }

    /* -----------------------------------------------------
       ACTIVE ACCOUNT CHECK
    ----------------------------------------------------- */

    if (
      user.is_active !== true
    ) {
      return res.status(403).json({
        message:
          "Your account has been deactivated.",
      });
    }

    /* -----------------------------------------------------
       EMAIL VERIFICATION CHECK
    ----------------------------------------------------- */

    if (
      user.email_verified !== true
    ) {
      return res.status(403).json({
        message:
          "Please verify your Gmail address before using this feature.",
        requiresVerification: true,
      });
    }

    /* -----------------------------------------------------
       SET AUTHENTICATED USER
    ----------------------------------------------------- */

    req.user = {
      id: user.id,
      username: user.username,
      email:
        user.email ||
        user.username,
      name: user.name,
      is_active:
        user.is_active,
      email_verified:
        user.email_verified,
    };

    next();
  } catch (error) {
    console.error(
      "User authentication middleware error:",
      error.response?.data ||
        error
    );

    return res.status(500).json({
      message:
        "Failed to authenticate user.",
    });
  }
};

module.exports = {
  userProtect,
};