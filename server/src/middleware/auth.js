const jwt = require("jsonwebtoken");

/* =========================================================
   JWT SECRET
========================================================= */

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (secret && secret.trim()) {
    return secret.trim();
  }

  /*
    Fallback for local development.

    IMPORTANT:
    The login route that creates the JWT must use
    the same JWT_SECRET value.
  */

  return "your-secret-key";
};

/* =========================================================
   GET TOKEN FROM REQUEST
========================================================= */

const getTokenFromRequest = (req) => {
  if (!req || !req.headers) {
    return null;
  }

  console.log("[AUTH DEBUG]", {
    method: req.method,
    path: req.originalUrl,
    hasAuthorization: Boolean(
      req.headers.authorization ||
        req.headers.Authorization ||
        (typeof req.get === "function" &&
          req.get("authorization"))
    ),
    authorizationKeys: Object.keys(req.headers).filter((key) =>
      key.toLowerCase().includes("authorization")
    ),
  });

  /*
    Express normally stores the Authorization header
    as req.headers.authorization.

    req.get("authorization") provides an additional
    reliable way to retrieve the header.
  */

  const authHeader =
    (typeof req.get === "function"
      ? req.get("authorization")
      : null) ||
    req.headers.authorization ||
    req.headers.Authorization;

  if (!authHeader) {
    return null;
  }

  if (typeof authHeader !== "string") {
    return null;
  }

  const trimmedHeader = authHeader.trim();

  if (!/^Bearer\s+/i.test(trimmedHeader)) {
    return null;
  }

  const token = trimmedHeader
    .replace(/^Bearer\s+/i, "")
    .trim();

  if (!token) {
    return null;
  }

  return token;
};

/* =========================================================
   GET USER ID FROM JWT PAYLOAD
========================================================= */

const getUserIdFromToken = (decoded) => {
  if (!decoded || typeof decoded !== "object") {
    return null;
  }

  /*
    Support common JWT user ID formats:

    {
      id: 1
    }

    {
      user_id: 1
    }

    {
      userId: 1
    }

    {
      userid: 1
    }

    {
      sub: 1
    }
  */

  const possibleUserIds = [
    decoded.id,
    decoded.user_id,
    decoded.userId,
    decoded.userid,
    decoded.sub,
  ];

  const userId = possibleUserIds.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
  );

  return userId !== undefined ? userId : null;
};

/* =========================================================
   CREATE USER OBJECT
========================================================= */

const createUserObject = (decoded) => {
  const userId = getUserIdFromToken(decoded);

  if (userId === null) {
    return null;
  }

  return {
    id: userId,
    user_id: userId,
    username:
      decoded.username ||
      decoded.user_name ||
      decoded.userName ||
      null,
    name:
      decoded.name ||
      decoded.full_name ||
      decoded.fullName ||
      null,
    email: decoded.email || null,
    role: decoded.role || null,
  };
};

/* =========================================================
   VERIFY JWT
========================================================= */

const verifyToken = (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized - no token provided.",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      getJwtSecret()
    );

    req.auth = decoded;

    next();
  } catch (error) {
    console.error(
      "JWT verification error:",
      error.name,
      error.message
    );

    return res.status(401).json({
      success: false,
      message:
        "Unauthorized - invalid or expired token.",
    });
  }
};

/* =========================================================
   GENERAL AUTHENTICATION PROTECTION
========================================================= */

/*
  This middleware verifies that the request contains
  a valid JWT.

  IMPORTANT:
  This middleware intentionally does NOT require
  role === "admin".

  It can therefore be used by routes that allow any
  authenticated account.
*/

const protect = (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message:
        "Unauthorized - no token provided.",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      getJwtSecret()
    );

    req.admin = decoded;
    req.auth = decoded;

    next();
  } catch (error) {
    console.error(
      "JWT verification error:",
      error.name,
      error.message
    );

    return res.status(401).json({
      success: false,
      message:
        "Unauthorized - invalid or expired token.",
    });
  }
};

/* =========================================================
   ADMIN PROTECTION
========================================================= */

/*
  This middleware requires:

  1. A valid JWT
  2. role === "admin"

  Use this for routes that must only be accessible
  by administrators.
*/

const protectAdmin = (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message:
        "Unauthorized - no token provided.",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      getJwtSecret()
    );

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Forbidden - administrator access required.",
      });
    }

    req.admin = decoded;
    req.auth = decoded;

    next();
  } catch (error) {
    console.error(
      "Admin JWT verification error:",
      error.name,
      error.message
    );

    return res.status(401).json({
      success: false,
      message:
        "Unauthorized - invalid or expired token.",
    });
  }
};

/* =========================================================
   USER PROTECTION
========================================================= */

const protectUser = (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message:
        "Unauthorized - no user token provided.",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      getJwtSecret()
    );

    /*
      Explicitly require a user JWT.

      This prevents an administrator JWT from being
      accepted by user-only routes.
    */

    if (decoded.role !== "user") {
      return res.status(403).json({
        success: false,
        message:
          "Forbidden - user access required.",
      });
    }

    const user = createUserObject(decoded);

    if (
      !user ||
      user.id === null ||
      user.id === undefined
    ) {
      console.error(
        "User JWT error: user ID is missing from token payload.",
        {
          decodedKeys: Object.keys(decoded || {}),
        }
      );

      return res.status(401).json({
        success: false,
        message:
          "Unauthorized - user ID is missing.",
      });
    }

    /*
      Store authenticated user information.

      Memory routes can use:

      req.user.id
      req.user.user_id
      req.user.username
      req.user.name
      req.user.email
    */

    req.user = user;

    /*
      Keep the original decoded JWT payload available.
    */

    req.auth = decoded;

    next();
  } catch (error) {
    console.error(
      "User JWT verification error:",
      error.name,
      error.message
    );

    return res.status(401).json({
      success: false,
      message:
        "Unauthorized - invalid or expired user token.",
    });
  }
};

/* =========================================================
   OPTIONAL USER AUTHENTICATION
========================================================= */

/*
  This middleware allows both authenticated and
  unauthenticated requests.

  If a valid USER token exists:
    req.user is populated.

  If no token exists:
    req.user is set to null.

  If the token is invalid or expired:
    the request continues as unauthenticated.
*/

const optionalUser = (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    req.user = null;
    req.auth = null;

    return next();
  }

  try {
    const decoded = jwt.verify(
      token,
      getJwtSecret()
    );

    /*
      Only treat a role === "user" token as a user
      for optional user authentication.

      Admin tokens should not populate req.user.
    */

    if (decoded.role !== "user") {
      req.user = null;
      req.auth = decoded;

      return next();
    }

    const user = createUserObject(decoded);

    req.user = user;
    req.auth = decoded;

    next();
  } catch (error) {
    console.warn(
      "Optional user JWT verification failed:",
      error.message
    );

    /*
      Do not block public routes when an optional token
      is invalid or expired.
    */

    req.user = null;
    req.auth = null;

    next();
  }
};

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  protect,
  protectAdmin,
  protectUser,
  optionalUser,
  verifyToken,
};
