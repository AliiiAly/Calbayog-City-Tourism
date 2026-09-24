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
   ADMIN AUTHENTICATION
========================================================= */

/*
  POST /api/auth/login

  Admin login
*/
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message:
          "Username and password are required",
      });
    }

    const response = await axios.get(
      `${getSupabaseRestUrl(
        "admins"
      )}?username=eq.${encodeURIComponent(
        username
      )}&select=*`,
      {
        headers: supabaseHeaders,
      }
    );

    const admin = response.data[0];

    if (!admin) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const validPassword =
      await bcrypt.compare(
        password,
        admin.password
      );

    if (!validPassword) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        name: admin.name,
      },
      getJwtSecret(),
      {
        expiresIn: "8h",
      }
    );

    return res.json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (err) {
    console.error(
      "Admin login error:",
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        "Login failed",
    });
  }
});

/*
  POST /api/auth/register

  First-time admin registration
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
          username,
          password: hashedPassword,
          email,
          name,
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
      err
    );

    return res.status(400).json({
      message:
        err.message ||
        "Failed to register admin",
    });
  }
});

/*
  GET /api/auth/me
*/
router.get("/me", protect, async (req, res) => {
  try {
    const response = await axios.get(
      `${getSupabaseRestUrl(
        "admins"
      )}?id=eq.${encodeURIComponent(
        req.admin.id
      )}&select=id,username,email,name,created_at,updated_at`,
      {
        headers: supabaseHeaders,
      }
    );

    const admin =
      response.data[0];

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    return res.json(admin);
  } catch (err) {
    console.error(
      "Get admin profile error:",
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        "Failed to get admin profile",
    });
  }
});

/* =========================================================
   USER AUTHENTICATION
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

        /* -----------------------------------------------
           CLEAN UP USER IF EMAIL FAILS
        ----------------------------------------------- */

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

      /* -----------------------------------------------------
         SUCCESS
      ----------------------------------------------------- */

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

/*
  GET /api/auth/user/verify-email?token=...

  IMPORTANT:
  The verification token is intentionally NOT deleted
  after successful verification.

  This makes verification idempotent.

  Example:

  First click:
    email_verified = true

  Second click / refresh:
    "Your email is already verified."

  This prevents React development-mode duplicate
  requests or browser refreshes from producing a
  false "invalid verification link" message.
*/
router.get(
  "/user/verify-email",
  async (req, res) => {
    try {
      const { token } =
        req.query;

      /* -----------------------------------------------------
         TOKEN REQUIRED
      ----------------------------------------------------- */

      if (!token) {
        return res.status(400).json({
          message:
            "Verification token is required.",
        });
      }

      /* -----------------------------------------------------
         HASH TOKEN
      ----------------------------------------------------- */

      const tokenHash =
        hashToken(token);

      /* -----------------------------------------------------
         FIND USER
      ----------------------------------------------------- */

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

      /* -----------------------------------------------------
         INVALID TOKEN
      ----------------------------------------------------- */

      if (!user) {
        return res.status(400).json({
          message:
            "This verification link is invalid or has already been used.",
          verified: false,
        });
      }

      /* -----------------------------------------------------
         ALREADY VERIFIED
      -----------------------------------------------------

         IMPORTANT:

         We check this BEFORE expiration.

         This means that even if the verification
         timestamp is old, an already verified account
         is still treated as successfully verified.
      ----------------------------------------------------- */

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
          },
        });
      }

      /* -----------------------------------------------------
         CHECK EXPIRATION
      ----------------------------------------------------- */

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

      /* -----------------------------------------------------
         VERIFY ACCOUNT
      -----------------------------------------------------

         IMPORTANT:

         DO NOT clear:

           email_verification_token_hash
           email_verification_expires_at

         Keeping the token hash allows the endpoint
         to recognize the same verification link later
         and return "already verified" instead of
         "invalid link".

         The original token is never stored.
         Only its SHA-256 hash is stored.
      ----------------------------------------------------- */

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

      /* -----------------------------------------------------
         SUCCESS
      ----------------------------------------------------- */

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

/*
  POST /api/auth/user/resend-verification

  Body:
  {
    username: "example@gmail.com"
  }

  or:

  {
    email: "example@gmail.com"
  }
*/
router.post(
  "/user/resend-verification",
  async (req, res) => {
    try {
      const email =
        normalizeEmail(
          req.body.username ||
            req.body.email
        );

      /* -----------------------------------------------------
         VALIDATION
      ----------------------------------------------------- */

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

      /* -----------------------------------------------------
         FIND USER
      ----------------------------------------------------- */

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

      /* -----------------------------------------------------
         ALREADY VERIFIED
      ----------------------------------------------------- */

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

      /* -----------------------------------------------------
         CREATE NEW TOKEN
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
         UPDATE TOKEN
      ----------------------------------------------------- */

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

      /* -----------------------------------------------------
         VERIFICATION URL
      ----------------------------------------------------- */

      const verificationUrl =
        `${getClientUrl()}/verify-email?token=` +
        encodeURIComponent(
          verificationToken
        );

      const safeName =
        escapeHtml(user.name);

      /* -----------------------------------------------------
         EMAIL
      ----------------------------------------------------- */

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
   USER LOGIN
========================================================= */

/*
  POST /api/auth/user/login

  User MUST verify Gmail before login.
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

      /* -----------------------------------------------------
         VALIDATION
      ----------------------------------------------------- */

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

      /* -----------------------------------------------------
         FIND USER
      ----------------------------------------------------- */

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

      /* -----------------------------------------------------
         ACTIVE CHECK
      ----------------------------------------------------- */

      if (!user.is_active) {
        return res.status(403).json({
          message:
            "Account is deactivated.",
        });
      }

      /* -----------------------------------------------------
         PASSWORD CHECK
      ----------------------------------------------------- */

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

      /* -----------------------------------------------------
         EMAIL VERIFICATION CHECK
      ----------------------------------------------------- */

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

      /* -----------------------------------------------------
         CREATE JWT
      ----------------------------------------------------- */

      const token = jwt.sign(
        {
          id: user.id,
          username:
            user.username,
          name:
            user.name,
        },
        getJwtSecret(),
        {
          expiresIn: "8h",
        }
      );

      /* -----------------------------------------------------
         SUCCESS
      ----------------------------------------------------- */

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
          email_verified:
            true,
        },
      });
    } catch (err) {
      console.error(
        "User login error:",
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

/*
  POST /api/auth/user/forgot-password

  Body:
  {
    username: "example@gmail.com"
  }
*/
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

      /*
        Don't reveal whether
        an account exists.
      */

      if (!user) {
        return res.json({
          message:
            "If an account exists with that Gmail address, a password reset email will be sent.",
        });
      }

      /* -----------------------------------------------------
         MUST BE VERIFIED
      ----------------------------------------------------- */

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

      /* -----------------------------------------------------
         CREATE RESET TOKEN
      ----------------------------------------------------- */

      const resetToken =
        createToken();

      const resetTokenHash =
        hashToken(resetToken);

      const resetExpiresAt =
        new Date(
          Date.now() +
            30 * 60 * 1000
        ).toISOString();

      /* -----------------------------------------------------
         STORE RESET TOKEN
      ----------------------------------------------------- */

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

      /* -----------------------------------------------------
         RESET URL
      ----------------------------------------------------- */

      const resetUrl =
        `${getClientUrl()}/reset-password?token=` +
        encodeURIComponent(
          resetToken
        );

      const safeName =
        escapeHtml(user.name);

      /* -----------------------------------------------------
         EMAIL
      ----------------------------------------------------- */

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

/*
  POST /api/auth/user/reset-password

  Body:
  {
    token: "...",
    password: "new password"
  }
*/
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

      /* -----------------------------------------------------
         HASH TOKEN
      ----------------------------------------------------- */

      const tokenHash =
        hashToken(token);

      /* -----------------------------------------------------
         FIND USER
      ----------------------------------------------------- */

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

      /* -----------------------------------------------------
         CHECK EXPIRATION
      ----------------------------------------------------- */

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

      /* -----------------------------------------------------
         HASH NEW PASSWORD
      ----------------------------------------------------- */

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      /* -----------------------------------------------------
         UPDATE PASSWORD
      ----------------------------------------------------- */

      await axios.patch(
        `${getSupabaseRestUrl(
          "users"
        )}?id=eq.${encodeURIComponent(
          user.id
        )}`,
        {
          password:
            hashedPassword,

          /*
            Reset tokens ARE one-time tokens.
            Unlike email verification, this token
            should be cleared after use.
          */
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
  GET /api/auth/admin/users
*/
router.get(
  "/admin/users",
  protect,
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

/*
  GET /api/auth/admin/users/:id
*/
router.get(
  "/admin/users/:id",
  protect,
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

/*
  PUT /api/auth/admin/users/:id
*/
router.put(
  "/admin/users/:id",
  protect,
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

/*
  DELETE /api/auth/admin/users/:id
*/
router.delete(
  "/admin/users/:id",
  protect,
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