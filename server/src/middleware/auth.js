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

  const authHeader =
    req.headers.authorization || req.headers.Authorization;

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
    const decoded = jwt.verify(token, getJwtSecret());

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
      message: "Unauthorized - invalid or expired token.",
    });
  }
};

/* =========================================================
   ADMIN PROTECTION
========================================================= */

const protect = (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized - no admin token provided.",
    });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());

    /*
      Store the decoded token information.

      Existing admin routes can use:

      req.admin
      req.auth
    */

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
      message: "Unauthorized - invalid or expired admin token.",
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
      message: "Unauthorized - no user token provided.",
    });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());

    const user = createUserObject(decoded);

    if (!user || user.id === null || user.id === undefined) {
      console.error(
        "User JWT error: user ID is missing from token payload.",
        {
          decodedKeys: Object.keys(decoded || {}),
        }
      );

      return res.status(401).json({
        success: false,
        message: "Unauthorized - user ID is missing.",
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
      message: "Unauthorized - invalid or expired user token.",
    });
  }
};

/* =========================================================
   OPTIONAL USER AUTHENTICATION
========================================================= */

/*
  This middleware allows both authenticated and
  unauthenticated requests.

  If a valid token exists:
    req.user is populated.

  If no token exists:
    req.user is set to null.

  If the token is invalid or expired:
    the request continues as unauthenticated.

  This is useful for public routes that may display
  additional information for logged-in users.
*/

const optionalUser = (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    req.user = null;
    req.auth = null;

    return next();
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());

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
  protectUser,
  optionalUser,
  verifyToken,
};