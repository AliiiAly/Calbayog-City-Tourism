const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const axios = require("axios");

const supabase = require("../config/supabase");
const { protect } = require("../middleware/auth");
const { sendEmail } = require("../utils/mailer");

const router = express.Router();

/* =========================================================
   HELPERS
========================================================= */

const supabaseHeaders = {
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
};

const supabaseJsonHeaders = {
  ...supabaseHeaders,
  "Content-Type": "application/json",
};

const getSupabaseRestUrl = (table) => {
  return `${process.env.SUPABASE_URL}/rest/v1/${table}`;
};

const normalizeEmail = (email) => {
  return String(email || "")
    .trim()
    .toLowerCase();
};

const normalizeLoginValue = (value) => {
  return String(value || "").trim();
};

const isGmailAddress = (email) => {
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email);
};

const hashToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

const createToken = () => {
  return crypto
    .randomBytes(32)
    .toString("hex");
};

const escapeHtml = (value) => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const getClientUrl = () => {
  return (
    process.env.CLIENT_URL ||
    "http://localhost:5173"
  ).replace(/\/$/, "");
};

const getJwtSecret = () => {
  return (
    process.env.JWT_SECRET ||
    "your-secret-key"
  );
};

/* =========================================================
   JWT HELPERS
========================================================= */

/**
 * Creates the unified authentication token.
 *
 * Both users and admins use the same JWT structure.
 *
 * role:
 *   "user"
 *   "admin"
 */
const createAuthToken = ({
  id,
  username,
  email,
  name,
  role,
}) => {
  return jwt.sign(
    {
      id,
      username,
      email: email || "",
      name: name || "",
      role,
    },
    getJwtSecret(),
    {
      expiresIn: "8h",
    }
  );
};

/**
 * Creates the unified account object returned
 * to the frontend.
 */
const createAuthUser = ({
  id,
  username,
  email,
  name,
  role,
  is_active,
  email_verified,
}) => {
  return {
    id,
    username: username || email || "",
    email: email || username || "",
    name: name || "",
    role,
    is_active:
      typeof is_active === "boolean"
        ? is_active
        : true,
    ...(typeof email_verified === "boolean"
      ? {
          email_verified,
        }
      : {}),
  };
};

/* =========================================================
   ADMIN ROLE PROTECTION
========================================================= */

/**
 * The existing protect middleware verifies the JWT.
 *
 * This additional middleware makes sure that routes
 * intended only for admins cannot be accessed using
 * a normal user token.
 */
const requireAdmin = (req, res, next) => {
  if (!req.auth) {
    return res.status(401).json({
      message: "Authentication required.",
    });
  }

  if (req.auth.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required.",
    });
  }

  return next();
};

/* =========================================================
   UNIFIED AUTHENTICATION
========================================================= */

/*
  POST /api/auth/login

  ONE LOGIN ENDPOINT FOR BOTH USERS AND ADMINS.

  Authentication order:

  1. Check the users table.
  2. If no matching user is found, check admins.
  3. If a valid user is found:
       role = "user"
  4. If a valid admin is found:
       role = "admin"

  The two Supabase tables remain separate.

  The frontend receives one consistent response:

  {
    token,
    user: {
      id,
      username,
      email,
      name,
      role,
      is_active
    }
  }

  For temporary compatibility with the existing
  AdminLogin/api.ts code, admins also receive
  an "admin" property.
*/
router.post("/login", async (req, res) => {
  try {
    const loginValue =
      normalizeLoginValue(
        req.body.username ||
          req.body.email
      );

    const password = String(
      req.body.password || ""
    );

    if (!loginValue || !password) {
      return res.status(400).json({
        message:
          "Username and password are required.",
      });
    }

    /* =====================================================
       STEP 1 — CHECK NORMAL USERS
    ===================================================== */

    const normalizedEmail =
      normalizeEmail(loginValue);

    let user = null;

    /*
      Normal users are created with their Gmail
      stored as both username and email.
    */

    if (isGmailAddress(normalizedEmail)) {
      try {
        const userResponse =
          await axios.get(
            `${getSupabaseRestUrl(
              "users"
            )}?username=eq.${encodeURIComponent(
              normalizedEmail
            )}&select=*`,
            {
              headers:
                supabaseHeaders,
            }
          );

        user =
          userResponse.data?.[0] ||
          null;
      } catch (userLookupError) {
        console.error(
          "User lookup during unified login failed:",
          userLookupError.response
            ?.data ||
            userLookupError.message
        );

        return res.status(500).json({
          message:
            "Login failed.",
        });
      }
    }

    /* =====================================================
       USER FOUND
    ===================================================== */

    if (user) {
      /* ---------------------------------------------------
         CHECK ACTIVE ACCOUNT
      --------------------------------------------------- */

      if (!user.is_active) {
        return res.status(403).json({
          message:
            "Account is deactivated.",
        });
      }

      /* ---------------------------------------------------
         CHECK PASSWORD
      --------------------------------------------------- */

      let validPassword = false;

      try {
        validPassword =
          await bcrypt.compare(
            password,
            user.password
          );
      } catch (passwordError) {
        console.error(
          "User password comparison failed:",
          passwordError.message
        );

        validPassword = false;
      }

      if (!validPassword) {
        return res.status(401).json({
          message:
            "Invalid credentials.",
        });
      }

      /* ---------------------------------------------------
         CHECK EMAIL VERIFICATION
      --------------------------------------------------- */

      if (
        user.email_verified !==
        true
      ) {
        return res.status(403).json({
          message:
            "Please verify your Gmail address before logging in.",
          requiresVerification:
            true,
          email:
            user.email ||
            user.username,
        });
      }

      /* ---------------------------------------------------
         CREATE USER JWT
      --------------------------------------------------- */

      const token =
        createAuthToken({
          id: user.id,
          username:
            user.username,
          email:
            user.email ||
            user.username,
          name:
            user.name,
          role: "user",
        });

      const authUser =
        createAuthUser({
          id: user.id,
          username:
            user.username,
          email:
            user.email ||
            user.username,
          name:
            user.name,
          role: "user",
          is_active:
            user.is_active,
          email_verified: true,
        });

      return res.json({
        token,
        user: authUser,
      });
    }

    /* =====================================================
       STEP 2 — CHECK ADMINS
    ===================================================== */

    let admin = null;

    try {
      /*
        Admins may log in using either:

        - username
        - email

        We first try username.
      */

      const adminByUsernameResponse =
        await axios.get(
          `${getSupabaseRestUrl(
            "admins"
          )}?username=eq.${encodeURIComponent(
            loginValue
          )}&select=*`,
          {
            headers:
              supabaseHeaders,
          }
        );

      admin =
        adminByUsernameResponse.data?.[0] ||
        null;

      /*
        If username did not find an account,
        try the admin email.
      */

      if (!admin) {
        const adminByEmailResponse =
          await axios.get(
            `${getSupabaseRestUrl(
              "admins"
            )}?email=eq.${encodeURIComponent(
              normalizedEmail
            )}&select=*`,
            {
              headers:
                supabaseHeaders,
            }
          );

        admin =
          adminByEmailResponse.data?.[0] ||
          null;
      }
    } catch (adminLookupError) {
      console.error(
        "Admin lookup during unified login failed:",
        adminLookupError.response
          ?.data ||
          adminLookupError.message
      );

      return res.status(500).json({
        message:
          "Login failed.",
      });
    }

    /* =====================================================
       NO USER OR ADMIN FOUND
    ===================================================== */

    if (!admin) {
      return res.status(401).json({
        message:
          "Invalid credentials.",
      });
    }

    /* =====================================================
       CHECK ADMIN PASSWORD
    ===================================================== */

    let validAdminPassword =
      false;

    /*
      Normal bcrypt password.
    */

    if (
      admin.password &&
      typeof admin.password === "string"
    ) {
      try {
        validAdminPassword =
          await bcrypt.compare(
            password,
            admin.password
          );
      } catch (passwordError) {
        console.warn(
          "Admin password bcrypt comparison failed:",
          passwordError.message
        );

        validAdminPassword =
          false;
      }
    }

    /*
      Existing mobile PIN compatibility.

      This allows existing admin accounts
      that still use mobile_pin to continue
      working.
    */

    if (
      !validAdminPassword &&
      admin.mobile_pin !== null &&
      admin.mobile_pin !== undefined &&
      String(
        admin.mobile_pin
      ).trim() !== ""
    ) {
      validAdminPassword =
        String(
          admin.mobile_pin
        ) ===
        String(password);
    }

    if (!validAdminPassword) {
      return res.status(401).json({
        message:
          "Invalid credentials.",
      });
    }

    /* =====================================================
       CREATE ADMIN JWT
    ===================================================== */

    const token =
      createAuthToken({
        id: admin.id,
        username:
          admin.username,
        email:
          admin.email ||
          "",
        name:
          admin.name,
        role: "admin",
      });

    const authUser =
      createAuthUser({
        id: admin.id,
        username:
          admin.username,
        email:
          admin.email ||
          "",
        name:
          admin.name,
        role: "admin",
        is_active:
          typeof admin.is_active ===
          "boolean"
            ? admin.is_active
            : true,
      });

    /*
      Return "user" as the unified account object.

      "admin" is also returned temporarily so the
      existing AdminLogin/api.ts code does not
      immediately break while we transition the
      frontend to the single LoginModal.
    */

    return res.json({
      token,

      user: authUser,

      admin: {
        id: admin.id,
        username:
          admin.username,
        name:
          admin.name,
        email:
          admin.email || "",
        role: "admin",
        is_active:
          typeof admin.is_active ===
          "boolean"
            ? admin.is_active
            : true,
      },
    });
  } catch (err) {
    console.error(
      "Unified login error:",
      err.response?.data ||
        err
    );

    return res.status(500).json({
      message:
        err.response?.data
          ?.message ||
        err.message ||
        "Login failed.",
    });
  }
});

/* =========================================================
   ADMIN REGISTRATION
========================================================= */

/*
  POST /api/auth/register

  First-time admin registration.
*/
router.post("/register", async (req, res) => {
  try {
    const response = await axios.get(
      `${getSupabaseRestUrl(
        "admins"
      )}?select=id&limit=1`,
      {
        headers: supabaseHeaders,
      }
    );

    const existingAdmins =
      response.data;

    if (
      existingAdmins &&
      existingAdmins.length > 0 &&
      req.headers["x-setup-key"] !==
        process.env.JWT_SECRET
    ) {
      return res.status(403).json({
        message:
          "Admin already registered",
      });
    }

    const {
      username,
      password,
      email,
      name,
    } = req.body;

    if (
      !username ||
      !password ||
      !email ||
      !name
    ) {
      return res.status(400).json({
        message:
          "Username, password, email, and name are required",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    const insertResponse =
      await axios.post(
        getSupabaseRestUrl("admins"),
        {
          username:
            String(username).trim(),
          password:
            hashedPassword,
          email:
            String(email)
              .trim()
              .toLowerCase(),
          name:
            String(name).trim(),
        },
        {
          headers: {
            ...supabaseJsonHeaders,
            Prefer:
              "return=representation",
          },
        }
      );

    const admin =
      insertResponse.data[0];

    return res.status(201).json({
      message: "Admin created",
      id: admin.id,
    });
  } catch (err) {
    console.error(
      "Admin registration error:",
      err.response?.data ||
        err
    );

    return res.status(400).json({
      message:
        err.response?.data
          ?.message ||
        err.message ||
        "Failed to register admin",
    });
  }
});

/* =========================================================
   AUTH ME
========================================================= */

/*
  GET /api/auth/me

  Supports BOTH user and admin tokens.

  The JWT role determines which table is queried.
*/
router.get(
  "/me",
  protect,
  async (req, res) => {
    try {
      const auth = req.auth;

      if (!auth) {
        return res.status(401).json({
          message:
            "Authentication required.",
        });
      }

      /* ===================================================
         ADMIN PROFILE
      =================================================== */

      if (auth.role === "admin") {
        const response =
          await axios.get(
            `${getSupabaseRestUrl(
              "admins"
            )}?id=eq.${encodeURIComponent(
              auth.id
            )}&select=id,username,email,name,created_at,updated_at`,
            {
              headers:
                supabaseHeaders,
            }
          );

        const admin =
          response.data?.[0];

        if (!admin) {
          return res.status(404).json({
            message:
              "Admin not found",
          });
        }

        return res.json({
          ...admin,
          role: "admin",
          is_active:
            typeof admin.is_active ===
            "boolean"
              ? admin.is_active
              : true,
        });
      }

      /* ===================================================
         USER PROFILE
      =================================================== */

      if (auth.role === "user") {
        const response =
          await axios.get(
            `${getSupabaseRestUrl(
              "users"
            )}?id=eq.${encodeURIComponent(
              auth.id
            )}&select=id,username,email,name,is_active,email_verified,created_at,updated_at`,
            {
              headers:
                supabaseHeaders,
            }
          );

        const user =
          response.data?.[0];

        if (!user) {
          return res.status(404).json({
            message:
              "User not found",
          });
        }

        return res.json({
          ...user,
          role: "user",
        });
      }

      return res.status(403).json({
        message:
          "Invalid account role.",
      });
    } catch (err) {
      console.error(
        "Get authenticated profile error:",
        err.response?.data ||
          err
      );

      return res.status(500).json({
        message:
          err.response?.data
            ?.message ||
          err.message ||
          "Failed to get profile.",
      });
    }
  }
);

/* =========================================================
   USER SIGNUP
========================================================= */

/*
  POST /api/auth/user/signup

  Flow:
  1. Validate Gmail
  2. Check duplicate account
  3. Hash password
  4. Create user
  5. Generate verification token
  6. Store token hash
  7. Send verification email
  8. Do NOT automatically log user in
*/
router.post(
  "/user/signup",
  async (req, res) => {
    try {
      const {
        username,
        password,
        name,
      } = req.body;

      const email =
        normalizeEmail(username);

      /* -----------------------------------------------------
         VALIDATION
      ----------------------------------------------------- */

      if (
        !email ||
        !password ||
        !name
      ) {
        return res.status(400).json({
          message:
            "Gmail address, password, and name are required",
        });
      }

      if (!isGmailAddress(email)) {
        return res.status(400).json({
          message:
            "Only Gmail addresses ending in @gmail.com are allowed.",
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          message:
            "Password must be at least 8 characters long.",
        });
      }

      const trimmedName =
        String(name).trim();

      if (trimmedName.length < 2) {
        return res.status(400).json({
          message:
            "Please enter a valid name.",
        });
      }

      /* -----------------------------------------------------
         CHECK DUPLICATE USERNAME
      ----------------------------------------------------- */

      const checkResponse =
        await axios.get(
          `${getSupabaseRestUrl(
            "users"
          )}?username=eq.${encodeURIComponent(
            email
          )}&select=id`,
          {
            headers: supabaseHeaders,
          }
        );

      if (
        checkResponse.data &&
        checkResponse.data.length > 0
      ) {
        return res.status(400).json({
          message:
            "An account with this Gmail address already exists.",
        });
      }

      /* -----------------------------------------------------
         CHECK DUPLICATE EMAIL
      ----------------------------------------------------- */

      try {
        const emailCheckResponse =
          await axios.get(
            `${getSupabaseRestUrl(
              "users"
            )}?email=eq.${encodeURIComponent(
              email
            )}&select=id`,
            {
              headers:
                supabaseHeaders,
            }
          );

        if (
          emailCheckResponse.data &&
          emailCheckResponse.data
            .length > 0
        ) {
          return res.status(400).json({
            message:
              "An account with this Gmail address already exists.",
          });
        }
      } catch (emailCheckError) {
        console.warn(
          "Email-column duplicate check skipped:",
          emailCheckError.message
        );
      }

      /* -----------------------------------------------------
         HASH PASSWORD
      ----------------------------------------------------- */

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      /* -----------------------------------------------------
         CREATE VERIFICATION TOKEN
      ----------------------------------------------------- */

      const verificationToken =
        createToken();

      const verificationTokenHash =
        hashToken(
          verificationToken
        );

      const verificationExpiresAt =
        new Date(
          Date.now() +
            24 * 60 * 60 * 1000
        ).toISOString();

      /* -----------------------------------------------------
         CREATE USER
      ----------------------------------------------------- */

      const insertResponse =
        await axios.post(
          getSupabaseRestUrl("users"),
          {
            username: email,
            email,
            password:
              hashedPassword,
            name: trimmedName,
            is_active: true,
            email_verified: false,
            email_verification_token_hash:
              verificationTokenHash,
            email_verification_expires_at:
              verificationExpiresAt,
          },
          {
            headers: {
              ...supabaseJsonHeaders,
              Prefer:
                "return=representation",
            },
          }
        );

      const user =
        insertResponse.data[0];

      if (!user) {
        return res.status(500).json({
          message:
            "Failed to create user account.",
        });
      }

      /* -----------------------------------------------------
         VERIFICATION URL
      ----------------------------------------------------- */

      const verificationUrl =
        `${getClientUrl()}/verify-email?token=` +
        encodeURIComponent(
          verificationToken
        );

      const safeName =
        escapeHtml(trimmedName);

      /* -----------------------------------------------------
         VERIFICATION EMAIL
      ----------------------------------------------------- */

      const verificationEmailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />
            <title>
              Verify your Calbayog City Tourism account
            </title>
          </head>

          <body style="
            margin:0;
            padding:0;
            background:#f5f6fb;
            font-family:Arial,Helvetica,sans-serif;
            color:#222;
          ">

            <div style="
              width:100%;
              padding:40px 16px;
              box-sizing:border-box;
            ">

              <div style="
                max-width:600px;
                margin:0 auto;
                background:#ffffff;
                border-radius:18px;
                overflow:hidden;
                border:1px solid #e5e7eb;
                box-shadow:
                  0 8px 30px
                  rgba(0,0,0,0.06);
              ">

                <div style="
                  background:#2D3195;
                  padding:32px 24px;
                  text-align:center;
                ">

                  <div style="
                    font-size:28px;
                    font-weight:800;
                    color:#ffffff;
                    margin-bottom:8px;
                  ">
                    CALBAYOG CITY TOURISM
                  </div>

                  <div style="
                    color:#FFB71B;
                    font-size:14px;
                    font-weight:700;
                  ">
                    Discover. Explore. Experience.
                  </div>

                </div>

                <div style="
                  padding:36px 30px;
                ">

                  <h1 style="
                    margin:0 0 16px;
                    font-size:26px;
                    color:#2D3195;
                  ">
                    Verify your email
                  </h1>

                  <p style="
                    margin:0 0 16px;
                    font-size:16px;
                    line-height:1.7;
                    color:#444;
                  ">
                    Hi ${safeName},
                  </p>

                  <p style="
                    margin:0 0 22px;
                    font-size:15px;
                    line-height:1.7;
                    color:#555;
                  ">
                    Thank you for creating an account
                    with Calbayog City Tourism.
                    Please verify your Gmail address
                    to activate your account.
                  </p>

                  <div style="
                    text-align:center;
                    margin:30px 0;
                  ">

                    <a
                      href="${verificationUrl}"
                      style="
                        display:inline-block;
                        background:#2D3195;
                        color:#ffffff;
                        text-decoration:none;
                        padding:14px 28px;
                        border-radius:10px;
                        font-size:15px;
                        font-weight:700;
                      "
                    >
                      Verify My Email
                    </a>

                  </div>

                  <p style="
                    margin:0 0 12px;
                    font-size:13px;
                    line-height:1.6;
                    color:#777;
                  ">
                    This verification link will
                    expire in 24 hours.
                  </p>

                  <p style="
                    margin:0;
                    font-size:13px;
                    line-height:1.6;
                    color:#777;
                  ">
                    If the button does not work,
                    copy and paste the verification
                    link into your browser.
                  </p>

                  <div style="
                    margin-top:20px;
                    padding:12px;
                    background:#f7f7fb;
                    border-radius:8px;
                    word-break:break-all;
                    font-size:12px;
                    color:#666;
                  ">
                    ${escapeHtml(
                      verificationUrl
                    )}
                  </div>

                </div>

                <div style="
                  background:#f7f7f7;
                  padding:20px;
                  text-align:center;
                  font-size:12px;
                  color:#777;
                ">
                  Calbayog City Tourism Office
                  <br />
                  This is an automated email.
                  Please do not reply directly.
                </div>

              </div>

            </div>

          </body>
        </html>
      `;

      /* -----------------------------------------------------
         SEND EMAIL
      ----------------------------------------------------- */

      try {
        await sendEmail({
          to: email,
          subject:
            "Verify your Calbayog City Tourism account",
          html:
            verificationEmailHtml,
        });
      } catch (emailError) {
        console.error(
          "Verification email failed:",
          emailError.message
        );

        try {
          await axios.delete(
            `${getSupabaseRestUrl(
              "users"
            )}?id=eq.${encodeURIComponent(
              user.id
            )}`,
            {
              headers:
                supabaseHeaders,
            }
          );
        } catch (cleanupError) {
          console.error(
            "Failed to clean up unverified user:",
            cleanupError.message
          );
        }

        return res.status(500).json({
          message:
            "Your account could not be completed because the verification email could not be sent. Please try again.",
        });
      }

      return res.status(201).json({
        message:
          "Account created successfully. Please check your Gmail inbox and verify your email before logging in.",
        requiresVerification: true,
        user: {
          id: user.id,
          username:
            user.username,
          email:
            user.email,
          name:
            user.name,
          email_verified: false,
          role: "user",
        },
      });
    } catch (err) {
      console.error(
        "Signup error:",
        err.response?.data ||
          err
      );

      return res.status(500).json({
        message:
          err.response?.data
            ?.message ||
          err.message ||
          "Failed to create user account.",
      });
    }
  }
);

/* =========================================================
   VERIFY EMAIL
========================================================= */

router.get(
  "/user/verify-email",
  async (req, res) => {
    try {
      const { token } =
        req.query;

      if (!token) {
        return res.status(400).json({
          message:
            "Verification token is required.",
        });
      }

      const tokenHash =
        hashToken(token);

      const response =
        await axios.get(
          `${getSupabaseRestUrl(
            "users"
          )}?email_verification_token_hash=eq.${encodeURIComponent(
            tokenHash
          )}&select=id,username,email,name,email_verified,email_verification_expires_at`,
          {
            headers:
              supabaseHeaders,
          }
        );

      const user =
        response.data[0];

      if (!user) {
        return res.status(400).json({
          message:
            "This verification link is invalid or has already been used.",
          verified: false,
        });
      }

      if (
        user.email_verified ===
        true
      ) {
        return res.json({
          message:
            "Your email is already verified.",
          verified: true,
          alreadyVerified: true,
          user: {
            id: user.id,
            username:
              user.username,
            email:
              user.email ||
              user.username,
            name:
              user.name,
            role: "user",
          },
        });
      }

      if (
        !user.email_verification_expires_at ||
        new Date(
          user.email_verification_expires_at
        ).getTime() <
          Date.now()
      ) {
        return res.status(400).json({
          message:
            "This verification link has expired. Please request a new verification email.",
          expired: true,
          verified: false,
        });
      }

      const updateResponse =
        await axios.patch(
          `${getSupabaseRestUrl(
            "users"
          )}?id=eq.${encodeURIComponent(
            user.id
          )}`,
          {
            email_verified: true,
            updated_at:
              new Date().toISOString(),
          },
          {
            headers: {
              ...supabaseJsonHeaders,
              Prefer:
                "return=representation",
            },
          }
        );

      const verifiedUser =
        updateResponse
          .data[0];

      return res.json({
        message:
          "Your email has been verified successfully.",
        verified: true,
        alreadyVerified: false,
        user: {
          id:
            verifiedUser?.id ||
            user.id,
          username:
            verifiedUser?.username ||
            user.username,
          email:
            verifiedUser?.email ||
            user.email ||
            user.username,
          name:
            verifiedUser?.name ||
            user.name,
          role: "user",
        },
      });
    } catch (err) {
      console.error(
        "Email verification error:",
        err.response?.data ||
          err
      );

      return res.status(500).json({
        message:
          err.response?.data
            ?.message ||
          err.message ||
          "Email verification failed.",
        verified: false,
      });
    }
  }
);

/* =========================================================
   RESEND VERIFICATION EMAIL
========================================================= */

router.post(
  "/user/resend-verification",
  async (req, res) => {
    try {
      const email =
        normalizeEmail(
          req.body.username ||
            req.body.email
        );

      if (!email) {
        return res.status(400).json({
          message:
            "Gmail address is required.",
        });
      }

      if (!isGmailAddress(email)) {
        return res.status(400).json({
          message:
            "Only Gmail addresses ending in @gmail.com are allowed.",
        });
      }

      const response =
        await axios.get(
          `${getSupabaseRestUrl(
            "users"
          )}?username=eq.${encodeURIComponent(
            email
          )}&select=*`,
          {
            headers:
              supabaseHeaders,
          }
        );

      const user =
        response.data[0];

      if (!user) {
        return res.status(404).json({
          message:
            "No account was found with that Gmail address.",
        });
      }

      if (
        user.email_verified ===
        true
      ) {
        return res.status(400).json({
          message:
            "This email address is already verified.",
          alreadyVerified: true,
        });
      }

      const verificationToken =
        createToken();

      const verificationTokenHash =
        hashToken(
          verificationToken
        );

      const verificationExpiresAt =
        new Date(
          Date.now() +
            24 * 60 * 60 * 1000
        ).toISOString();

      await axios.patch(
        `${getSupabaseRestUrl(
          "users"
        )}?id=eq.${encodeURIComponent(
          user.id
        )}`,
        {
          email_verification_token_hash:
            verificationTokenHash,
          email_verification_expires_at:
            verificationExpiresAt,
          updated_at:
            new Date().toISOString(),
        },
        {
          headers:
            supabaseJsonHeaders,
        }
      );

      const verificationUrl =
        `${getClientUrl()}/verify-email?token=` +
        encodeURIComponent(
          verificationToken
        );

      const safeName =
        escapeHtml(user.name);

      const html = `
        <!DOCTYPE html>
        <html>

          <head>
            <meta charset="UTF-8" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />
            <title>
              Verify your Calbayog City Tourism account
            </title>
          </head>

          <body style="
            margin:0;
            padding:0;
            background:#f5f6fb;
            font-family:Arial,Helvetica,sans-serif;
          ">

            <div style="
              padding:40px 16px;
            ">

              <div style="
                max-width:600px;
                margin:auto;
                background:#ffffff;
                border-radius:18px;
                overflow:hidden;
                border:1px solid #e5e7eb;
              ">

                <div style="
                  background:#2D3195;
                  padding:30px 20px;
                  text-align:center;
                ">

                  <div style="
                    color:#ffffff;
                    font-size:26px;
                    font-weight:800;
                  ">
                    CALBAYOG CITY TOURISM
                  </div>

                  <div style="
                    color:#FFB71B;
                    margin-top:8px;
                    font-size:13px;
                    font-weight:700;
                  ">
                    Email Verification
                  </div>

                </div>

                <div style="
                  padding:32px 28px;
                ">

                  <h2 style="
                    color:#2D3195;
                    margin-top:0;
                  ">
                    Verify your email
                  </h2>

                  <p style="
                    color:#444;
                    line-height:1.7;
                  ">
                    Hi ${safeName},
                  </p>

                  <p style="
                    color:#555;
                    line-height:1.7;
                  ">
                    Here is your new verification
                    link for your Calbayog City
                    Tourism account.
                  </p>

                  <div style="
                    text-align:center;
                    margin:30px 0;
                  ">

                    <a
                      href="${verificationUrl}"
                      style="
                        display:inline-block;
                        background:#2D3195;
                        color:#ffffff;
                        text-decoration:none;
                        padding:14px 28px;
                        border-radius:10px;
                        font-weight:700;
                      "
                    >
                      Verify My Email
                    </a>

                  </div>

                  <p style="
                    color:#777;
                    font-size:13px;
                    line-height:1.6;
                  ">
                    This link expires in 24 hours.
                  </p>

                </div>

                <div style="
                  background:#f7f7f7;
                  padding:18px;
                  text-align:center;
                  color:#777;
                  font-size:12px;
                ">
                  Calbayog City Tourism Office
                </div>

              </div>

            </div>

          </body>
        </html>
      `;

      await sendEmail({
        to: email,
        subject:
          "Verify your Calbayog City Tourism account",
        html,
      });

      return res.json({
        message:
          "A new verification email has been sent. Please check your Gmail inbox.",
        requiresVerification:
          true,
      });
    } catch (err) {
      console.error(
        "Resend verification error:",
        err.response?.data ||
          err
      );

      return res.status(500).json({
        message:
          err.response?.data
            ?.message ||
          err.message ||
          "Failed to resend verification email.",
      });
    }
  }
);

/* =========================================================
   LEGACY USER LOGIN
========================================================= */

/*
  POST /api/auth/user/login

  Kept temporarily for compatibility.

  The application should eventually use:
  
    POST /api/auth/login

  instead.

  This endpoint still creates a unified JWT with:
  
    role: "user"
*/
router.post(
  "/user/login",
  async (req, res) => {
    try {
      const email =
        normalizeEmail(
          req.body.username
        );

      const {
        password,
      } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message:
            "Gmail address and password are required.",
        });
      }

      if (!isGmailAddress(email)) {
        return res.status(400).json({
          message:
            "Only Gmail addresses ending in @gmail.com are allowed.",
        });
      }

      const response =
        await axios.get(
          `${getSupabaseRestUrl(
            "users"
          )}?username=eq.${encodeURIComponent(
            email
          )}&select=*`,
          {
            headers:
              supabaseHeaders,
          }
        );

      const user =
        response.data[0];

      if (!user) {
        return res.status(401).json({
          message:
            "Invalid credentials.",
        });
      }

      if (!user.is_active) {
        return res.status(403).json({
          message:
            "Account is deactivated.",
        });
      }

      const validPassword =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!validPassword) {
        return res.status(401).json({
          message:
            "Invalid credentials.",
        });
      }

      if (
        user.email_verified !==
        true
      ) {
        return res.status(403).json({
          message:
            "Please verify your Gmail address before logging in.",
          requiresVerification:
            true,
          email:
            user.email ||
            user.username,
        });
      }

      const token =
        createAuthToken({
          id: user.id,
          username:
            user.username,
          email:
            user.email ||
            user.username,
          name:
            user.name,
          role: "user",
        });

      return res.json({
        token,
        user: {
          id: user.id,
          username:
            user.username,
          email:
            user.email ||
            user.username,
          name:
            user.name,
          is_active:
            user.is_active !== false,
          email_verified:
            true,
          role: "user",
        },
      });
    } catch (err) {
      console.error(
        "Legacy user login error:",
        err.response?.data ||
          err
      );

      return res.status(500).json({
        message:
          err.response?.data
            ?.message ||
          err.message ||
          "Login failed.",
      });
    }
  }
);

/* =========================================================
   FORGOT PASSWORD
========================================================= */

router.post(
  "/user/forgot-password",
  async (req, res) => {
    try {
      const email =
        normalizeEmail(
          req.body.username ||
            req.body.email
        );

      if (!email) {
        return res.status(400).json({
          message:
            "Gmail address is required.",
        });
      }

      if (!isGmailAddress(email)) {
        return res.status(400).json({
          message:
            "Only Gmail addresses ending in @gmail.com are allowed.",
        });
      }

      const response =
        await axios.get(
          `${getSupabaseRestUrl(
            "users"
          )}?username=eq.${encodeURIComponent(
            email
          )}&select=*`,
          {
            headers:
              supabaseHeaders,
          }
        );

      const user =
        response.data[0];

      if (!user) {
        return res.json({
          message:
            "If an account exists with that Gmail address, a password reset email will be sent.",
        });
      }

      if (
        user.email_verified !==
        true
      ) {
        return res.status(403).json({
          message:
            "Please verify your Gmail address before requesting a password reset.",
          requiresVerification:
            true,
        });
      }

      const resetToken =
        createToken();

      const resetTokenHash =
        hashToken(resetToken);

      const resetExpiresAt =
        new Date(
          Date.now() +
            30 * 60 * 1000
        ).toISOString();

      await axios.patch(
        `${getSupabaseRestUrl(
          "users"
        )}?id=eq.${encodeURIComponent(
          user.id
        )}`,
        {
          password_reset_token_hash:
            resetTokenHash,
          password_reset_expires_at:
            resetExpiresAt,
          updated_at:
            new Date().toISOString(),
        },
        {
          headers:
            supabaseJsonHeaders,
        }
      );

      const resetUrl =
        `${getClientUrl()}/reset-password?token=` +
        encodeURIComponent(
          resetToken
        );

      const safeName =
        escapeHtml(user.name);

      const html = `
        <!DOCTYPE html>
        <html>

          <head>
            <meta charset="UTF-8" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />
            <title>
              Reset your Calbayog City Tourism password
            </title>
          </head>

          <body style="
            margin:0;
            padding:0;
            background:#f5f6fb;
            font-family:Arial,Helvetica,sans-serif;
          ">

            <div style="
              padding:40px 16px;
            ">

              <div style="
                max-width:600px;
                margin:auto;
                background:#ffffff;
                border-radius:18px;
                overflow:hidden;
                border:1px solid #e5e7eb;
              ">

                <div style="
                  background:#2D3195;
                  padding:30px 20px;
                  text-align:center;
                ">

                  <div style="
                    color:#ffffff;
                    font-size:26px;
                    font-weight:800;
                  ">
                    CALBAYOG CITY TOURISM
                  </div>

                  <div style="
                    color:#FFB71B;
                    margin-top:8px;
                    font-size:13px;
                    font-weight:700;
                  ">
                    Password Reset
                  </div>

                </div>

                <div style="
                  padding:32px 28px;
                ">

                  <h2 style="
                    color:#2D3195;
                    margin-top:0;
                  ">
                    Reset your password
                  </h2>

                  <p style="
                    color:#444;
                    line-height:1.7;
                  ">
                    Hi ${safeName},
                  </p>

                  <p style="
                    color:#555;
                    line-height:1.7;
                  ">
                    A request was made to reset
                    the password for your
                    Calbayog City Tourism account.
                  </p>

                  <div style="
                    text-align:center;
                    margin:30px 0;
                  ">

                    <a
                      href="${resetUrl}"
                      style="
                        display:inline-block;
                        background:#2D3195;
                        color:#ffffff;
                        text-decoration:none;
                        padding:14px 28px;
                        border-radius:10px;
                        font-weight:700;
                      "
                    >
                      Reset My Password
                    </a>

                  </div>

                  <p style="
                    color:#777;
                    font-size:13px;
                    line-height:1.6;
                  ">
                    This password reset link
                    expires in 30 minutes.
                  </p>

                  <p style="
                    color:#777;
                    font-size:13px;
                    line-height:1.6;
                  ">
                    If you did not request a
                    password reset, you can safely
                    ignore this email.
                  </p>

                </div>

                <div style="
                  background:#f7f7f7;
                  padding:18px;
                  text-align:center;
                  color:#777;
                  font-size:12px;
                ">
                  Calbayog City Tourism Office
                </div>

              </div>

            </div>

          </body>
        </html>
      `;

      await sendEmail({
        to: email,
        subject:
          "Reset your Calbayog City Tourism password",
        html,
      });

      return res.json({
        message:
          "If an account exists with that Gmail address, a password reset email has been sent.",
      });
    } catch (err) {
      console.error(
        "Forgot password error:",
        err.response?.data ||
          err
      );

      return res.status(500).json({
        message:
          err.response?.data
            ?.message ||
          err.message ||
          "Failed to process password reset request.",
      });
    }
  }
);

/* =========================================================
   RESET PASSWORD
========================================================= */

router.post(
  "/user/reset-password",
  async (req, res) => {
    try {
      const {
        token,
        password,
      } = req.body;

      if (!token || !password) {
        return res.status(400).json({
          message:
            "Reset token and new password are required.",
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          message:
            "Password must be at least 8 characters long.",
        });
      }

      const tokenHash =
        hashToken(token);

      const response =
        await axios.get(
          `${getSupabaseRestUrl(
            "users"
          )}?password_reset_token_hash=eq.${encodeURIComponent(
            tokenHash
          )}&select=id,username,email,name,password_reset_expires_at`,
          {
            headers:
              supabaseHeaders,
          }
        );

      const user =
        response.data[0];

      if (!user) {
        return res.status(400).json({
          message:
            "This password reset link is invalid or has already been used.",
        });
      }

      if (
        !user.password_reset_expires_at ||
        new Date(
          user.password_reset_expires_at
        ).getTime() <
          Date.now()
      ) {
        return res.status(400).json({
          message:
            "This password reset link has expired. Please request a new one.",
          expired: true,
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      await axios.patch(
        `${getSupabaseRestUrl(
          "users"
        )}?id=eq.${encodeURIComponent(
          user.id
        )}`,
        {
          password:
            hashedPassword,
          password_reset_token_hash:
            null,
          password_reset_expires_at:
            null,
          updated_at:
            new Date().toISOString(),
        },
        {
          headers:
            supabaseJsonHeaders,
        }
      );

      return res.json({
        message:
          "Your password has been changed successfully. You can now log in with your new password.",
      });
    } catch (err) {
      console.error(
        "Reset password error:",
        err.response?.data ||
          err
      );

      return res.status(500).json({
        message:
          err.response?.data
            ?.message ||
          err.message ||
          "Failed to reset password.",
      });
    }
  }
);

/* =========================================================
   ADMIN USER MANAGEMENT
========================================================= */

/*
  These routes now require BOTH:

  1. A valid JWT
  2. role === "admin"
*/

/* ---------------------------------------------------------
   GET ALL USERS
--------------------------------------------------------- */

router.get(
  "/admin/users",
  protect,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        data,
        error,
      } = await supabase
        .from("users")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (error) {
        throw error;
      }

      return res.json(
        data || []
      );
    } catch (err) {
      console.error(
        "Get users error:",
        err
      );

      return res.status(500).json({
        message:
          err.message ||
          "Failed to get users.",
      });
    }
  }
);

/* ---------------------------------------------------------
   GET SINGLE USER
--------------------------------------------------------- */

router.get(
  "/admin/users/:id",
  protect,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        data,
        error,
      } = await supabase
        .from("users")
        .select("*")
        .eq(
          "id",
          req.params.id
        )
        .single();

      if (
        error ||
        !data
      ) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      return res.json(data);
    } catch (err) {
      console.error(
        "Get single user error:",
        err
      );

      return res.status(500).json({
        message:
          err.message ||
          "Failed to get user.",
      });
    }
  }
);

/* ---------------------------------------------------------
   UPDATE USER
--------------------------------------------------------- */

router.put(
  "/admin/users/:id",
  protect,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        data,
        error,
      } = await supabase
        .from("users")
        .update(
          req.body
        )
        .eq(
          "id",
          req.params.id
        )
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      return res.json(data);
    } catch (err) {
      console.error(
        "Update user error:",
        err
      );

      return res.status(400).json({
        message:
          err.message ||
          "Failed to update user.",
      });
    }
  }
);

/* ---------------------------------------------------------
   DELETE USER
--------------------------------------------------------- */

router.delete(
  "/admin/users/:id",
  protect,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        error,
      } = await supabase
        .from("users")
        .delete()
        .eq(
          "id",
          req.params.id
        );

      if (error) {
        throw error;
      }

      return res.json({
        message:
          "User deleted",
      });
    } catch (err) {
      console.error(
        "Delete user error:",
        err
      );

      return res.status(500).json({
        message:
          err.message ||
          "Failed to delete user.",
      });
    }
  }
);

/* =========================================================
   EXPORT
========================================================= */

module.exports = router;
