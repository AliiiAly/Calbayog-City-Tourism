import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { AdminUser } from "../types";

/* =========================================================
   USER TYPE
========================================================= */

interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  is_active: boolean;
  role: "user";
  email_verified?: boolean;
}

/* =========================================================
   ADMIN TYPE
========================================================= */

type AuthenticatedAdmin = AdminUser & {
  role: "admin";
};

/* =========================================================
   AUTH CONTEXT TYPE
========================================================= */

interface AuthContextType {
  /* -------------------------
     ADMIN AUTH
  ------------------------- */

  admin: AuthenticatedAdmin | null;
  token: string | null;

  login: (
    token: string,
    admin: AdminUser | AuthenticatedAdmin
  ) => void;

  logout: () => void;

  isAuthenticated: boolean;

  /* -------------------------
     USER AUTH
  ------------------------- */

  user: User | null;
  userToken: string | null;

  userLogin: (
    userData: User | Omit<User, "role">,
    accessToken: string
  ) => void;

  userLogout: () => Promise<void>;

  isUserAuthenticated: boolean;

  /* -------------------------
     GLOBAL AUTH STATE
  ------------------------- */

  loading: boolean;
}

/* =========================================================
   STORAGE KEYS
========================================================= */

/* Admin storage keys */
const ADMIN_TOKEN_KEY = "admin_token";
const ADMIN_USER_KEY = "admin_user";

/* User storage keys */
const USER_DATA_KEY = "user_data";

const USER_TOKEN_KEYS = [
  "user_token",
  "userToken",
  "user_access_token",
  "userAccessToken",
];

/* =========================================================
   CONTEXT
========================================================= */

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

/* =========================================================
   TOKEN HELPERS
========================================================= */

/**
 * Removes unnecessary spaces and a possible
 * "Bearer " prefix from a token.
 *
 * The API interceptor adds "Bearer " itself.
 */
const normalizeToken = (
  accessToken: string
): string => {
  if (
    !accessToken ||
    typeof accessToken !== "string"
  ) {
    return "";
  }

  let normalizedToken =
    accessToken.trim();

  normalizedToken =
    normalizedToken.replace(
      /^Bearer\s+/i,
      ""
    );

  return normalizedToken.trim();
};

/**
 * Checks whether a value has the basic structure
 * of a JWT.
 *
 * A JWT normally contains three sections:
 *
 * header.payload.signature
 */
const isValidJwtFormat = (
  accessToken: string
): boolean => {
  if (!accessToken) {
    return false;
  }

  const tokenParts =
    accessToken.split(".");

  return tokenParts.length === 3;
};

/* =========================================================
   ADMIN STORAGE HELPERS
========================================================= */

/**
 * Removes all admin authentication information.
 */
const clearAdminStorage = (): void => {
  localStorage.removeItem(
    ADMIN_TOKEN_KEY
  );

  localStorage.removeItem(
    ADMIN_USER_KEY
  );

  sessionStorage.removeItem(
    ADMIN_TOKEN_KEY
  );

  sessionStorage.removeItem(
    ADMIN_USER_KEY
  );
};

/**
 * Saves admin authentication information.
 */
const saveAdminSession = (
  accessToken: string,
  adminUser: AuthenticatedAdmin
): void => {
  const normalizedToken =
    normalizeToken(accessToken);

  if (!normalizedToken) {
    return;
  }

  const serializedAdmin =
    JSON.stringify(adminUser);

  localStorage.setItem(
    ADMIN_TOKEN_KEY,
    normalizedToken
  );

  localStorage.setItem(
    ADMIN_USER_KEY,
    serializedAdmin
  );

  sessionStorage.setItem(
    ADMIN_TOKEN_KEY,
    normalizedToken
  );

  sessionStorage.setItem(
    ADMIN_USER_KEY,
    serializedAdmin
  );
};

/* =========================================================
   USER STORAGE HELPERS
========================================================= */

/**
 * Removes all user authentication information.
 */
const clearUserStorage = (): void => {
  USER_TOKEN_KEYS.forEach(
    (key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  );

  localStorage.removeItem(
    USER_DATA_KEY
  );

  sessionStorage.removeItem(
    USER_DATA_KEY
  );
};

/**
 * Saves the user token to all supported
 * storage keys.
 */
const saveUserToken = (
  accessToken: string
): void => {
  const normalizedToken =
    normalizeToken(accessToken);

  if (!normalizedToken) {
    return;
  }

  USER_TOKEN_KEYS.forEach(
    (key) => {
      localStorage.setItem(
        key,
        normalizedToken
      );

      sessionStorage.setItem(
        key,
        normalizedToken
      );
    }
  );
};

/**
 * Saves user information to localStorage
 * and sessionStorage.
 */
const saveUserData = (
  userData: User
): void => {
  const serializedUser =
    JSON.stringify(userData);

  localStorage.setItem(
    USER_DATA_KEY,
    serializedUser
  );

  sessionStorage.setItem(
    USER_DATA_KEY,
    serializedUser
  );
};

/**
 * Retrieves the first available user token.
 */
const getStoredUserToken = (): string | null => {
  for (const key of USER_TOKEN_KEYS) {
    const localToken =
      localStorage.getItem(key);

    if (
      localToken &&
      localToken.trim()
    ) {
      return normalizeToken(
        localToken
      );
    }

    const sessionToken =
      sessionStorage.getItem(key);

    if (
      sessionToken &&
      sessionToken.trim()
    ) {
      return normalizeToken(
        sessionToken
      );
    }
  }

  return null;
};

/**
 * Retrieves stored user data.
 */
const getStoredUserData = (): string | null => {
  const localUserData =
    localStorage.getItem(
      USER_DATA_KEY
    );

  if (localUserData) {
    return localUserData;
  }

  const sessionUserData =
    sessionStorage.getItem(
      USER_DATA_KEY
    );

  if (sessionUserData) {
    return sessionUserData;
  }

  return null;
};

/* =========================================================
   NORMALIZATION HELPERS
========================================================= */

/**
 * Converts incoming user data into a
 * consistent format.
 */
const normalizeUserData = (
  userData:
    | User
    | Omit<User, "role">
    | null
    | undefined
): User | null => {
  if (!userData) {
    return null;
  }

  if (
    userData.id === undefined ||
    userData.id === null ||
    String(userData.id).trim() === ""
  ) {
    return null;
  }

  const normalizedUser: User = {
    id: String(userData.id),

    email: String(
      userData.email || ""
    ),

    username: String(
      userData.username ||
        userData.email ||
        ""
    ),

    name: String(
      userData.name || ""
    ),

    is_active:
      userData.is_active !== false,

    role: "user",

    email_verified:
      "email_verified" in userData &&
      typeof userData.email_verified ===
        "boolean"
        ? userData.email_verified
        : undefined,
  };

  return normalizedUser;
};

/**
 * Converts incoming admin data into
 * a consistent authenticated format.
 */
const normalizeAdminData = (
  adminUser:
    | AdminUser
    | AuthenticatedAdmin
    | null
    | undefined
): AuthenticatedAdmin | null => {
  if (!adminUser) {
    return null;
  }

  if (
    adminUser.id === undefined ||
    adminUser.id === null ||
    String(adminUser.id).trim() === ""
  ) {
    return null;
  }

  return {
    ...adminUser,
    role: "admin",
  };
};

/* =========================================================
   AUTH PROVIDER
========================================================= */

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  /* =======================================================
     ADMIN STATE
  ======================================================= */

  const [
    admin,
    setAdmin,
  ] = useState<AuthenticatedAdmin | null>(
    null
  );

  const [
    token,
    setToken,
  ] = useState<string | null>(
    null
  );

  /* =======================================================
     USER STATE
  ======================================================= */

  const [
    user,
    setUser,
  ] = useState<User | null>(
    null
  );

  const [
    userToken,
    setUserToken,
  ] = useState<string | null>(
    null
  );

  /* =======================================================
     GLOBAL LOADING STATE
  ======================================================= */

  const [
    loading,
    setLoading,
  ] = useState(true);

  /* =======================================================
     INITIALIZE AUTHENTICATION
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const initializeAuth =
      (): void => {
        try {
          /* =================================================
             RESTORE ADMIN SESSION
          ================================================= */

          const storedAdminToken =
            localStorage.getItem(
              ADMIN_TOKEN_KEY
            );

          const storedAdmin =
            localStorage.getItem(
              ADMIN_USER_KEY
            );

          if (
            storedAdminToken &&
            storedAdmin &&
            storedAdmin !==
              "undefined" &&
            storedAdmin !== "null"
          ) {
            if (
              isValidJwtFormat(
                storedAdminToken
              )
            ) {
              try {
                const parsedAdmin =
                  JSON.parse(
                    storedAdmin
                  );

                const normalizedAdmin =
                  normalizeAdminData(
                    parsedAdmin
                  );

                if (
                  normalizedAdmin &&
                  mounted
                ) {
                  const normalizedAdminToken =
                    normalizeToken(
                      storedAdminToken
                    );

                  saveAdminSession(
                    normalizedAdminToken,
                    normalizedAdmin
                  );

                  setToken(
                    normalizedAdminToken
                  );

                  setAdmin(
                    normalizedAdmin
                  );
                }
              } catch (error) {
                console.error(
                  "Failed to parse stored admin user:",
                  error
                );

                clearAdminStorage();
              }
            } else {
              console.warn(
                "Stored admin token has an invalid JWT format."
              );

              clearAdminStorage();
            }
          }

          /* =================================================
             RESTORE USER SESSION
          ================================================= */

          const storedUserToken =
            getStoredUserToken();

          const storedUserData =
            getStoredUserData();

          /*
            It is completely valid to have
            no user session.
          */

          if (
            !storedUserToken ||
            !storedUserData
          ) {
            return;
          }

          if (
            storedUserData ===
              "undefined" ||
            storedUserData === "null"
          ) {
            clearUserStorage();
            return;
          }

          if (
            !isValidJwtFormat(
              storedUserToken
            )
          ) {
            console.warn(
              "Stored user token has an invalid JWT format."
            );

            clearUserStorage();
            return;
          }

          try {
            const parsedUserData =
              JSON.parse(
                storedUserData
              );

            const normalizedUser =
              normalizeUserData(
                parsedUserData
              );

            if (
              !normalizedUser
            ) {
              clearUserStorage();
              return;
            }

            if (
              !normalizedUser.is_active
            ) {
              clearUserStorage();
              return;
            }

            if (mounted) {
              saveUserToken(
                storedUserToken
              );

              saveUserData(
                normalizedUser
              );

              setUser(
                normalizedUser
              );

              setUserToken(
                storedUserToken
              );
            }
          } catch (error) {
            console.error(
              "Failed to parse stored user data:",
              error
            );

            clearUserStorage();
          }
        } catch (error) {
          console.error(
            "Authentication initialization error:",
            error
          );
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     ADMIN LOGIN
  ======================================================= */

  const login = (
    newToken: string,
    adminUser:
      | AdminUser
      | AuthenticatedAdmin
  ): void => {
    const normalizedToken =
      normalizeToken(newToken);

    if (!normalizedToken) {
      console.error(
        "Admin login failed: Invalid token."
      );

      return;
    }

    if (
      !isValidJwtFormat(
        normalizedToken
      )
    ) {
      console.error(
        "Admin login failed: The access token does not have a valid JWT format."
      );

      return;
    }

    const normalizedAdmin =
      normalizeAdminData(
        adminUser
      );

    if (!normalizedAdmin) {
      console.error(
        "Admin login failed: Invalid admin information."
      );

      return;
    }

    /*
      Clear any old admin session first.
    */

    clearAdminStorage();

    /*
      Update React state.
    */

    setToken(
      normalizedToken
    );

    setAdmin(
      normalizedAdmin
    );

    /*
      Save current admin session.
    */

    saveAdminSession(
      normalizedToken,
      normalizedAdmin
    );

    console.log(
      "Admin login successful:",
      {
        adminId:
          normalizedAdmin.id,
        role:
          normalizedAdmin.role,
        hasToken:
          Boolean(
            normalizedToken
          ),
        tokenLength:
          normalizedToken.length,
      }
    );
  };

  /* =======================================================
     ADMIN LOGOUT
  ======================================================= */

  const logout = (): void => {
    setToken(null);
    setAdmin(null);

    clearAdminStorage();
  };

  /* =======================================================
     USER LOGIN
  ======================================================= */

  const userLogin = (
    userData:
      | User
      | Omit<User, "role">,
    accessToken: string
  ): void => {
    const normalizedToken =
      normalizeToken(
        accessToken
      );

    /* ---------------------------------------------
       Validate access token
    --------------------------------------------- */

    if (!normalizedToken) {
      console.error(
        "User login failed: No access token was provided."
      );

      return;
    }

    if (
      !isValidJwtFormat(
        normalizedToken
      )
    ) {
      console.error(
        "User login failed: The access token does not have a valid JWT format."
      );

      return;
    }

    /* ---------------------------------------------
       Validate user information
    --------------------------------------------- */

    const normalizedUser =
      normalizeUserData(
        userData
      );

    if (!normalizedUser) {
      console.error(
        "User login failed: Invalid user information."
      );

      return;
    }

    /* ---------------------------------------------
       Prevent inactive account login
    --------------------------------------------- */

    if (
      !normalizedUser.is_active
    ) {
      console.error(
        "User login failed: The account is inactive."
      );

      clearUserStorage();

      setUser(null);
      setUserToken(null);

      return;
    }

    /*
      Clear any old user session
      before saving the new session.
    */

    clearUserStorage();

    /* ---------------------------------------------
       Update React state
    --------------------------------------------- */

    setUser(
      normalizedUser
    );

    setUserToken(
      normalizedToken
    );

    /* ---------------------------------------------
       Save current session
    --------------------------------------------- */

    saveUserToken(
      normalizedToken
    );

    saveUserData(
      normalizedUser
    );

    console.log(
      "User login successful:",
      {
        userId:
          normalizedUser.id,
        role:
          normalizedUser.role,
        hasToken:
          Boolean(
            normalizedToken
          ),
        tokenLength:
          normalizedToken.length,
        tokenPartCount:
          normalizedToken
            .split(".")
            .length,
      }
    );
  };

  /* =======================================================
     USER LOGOUT
  ======================================================= */

  const userLogout =
    async (): Promise<void> => {
      try {
        setUser(null);
        setUserToken(null);

        clearUserStorage();
      } catch (error) {
        console.error(
          "User logout error:",
          error
        );
      }
    };

  /* =======================================================
     CONTEXT VALUE
  ======================================================= */

  const contextValue: AuthContextType = {
    /* -------------------------
       ADMIN
    ------------------------- */

    admin,
    token,

    login,
    logout,

    isAuthenticated:
      Boolean(token) &&
      Boolean(admin),

    /* -------------------------
       USER
    ------------------------- */

    user,
    userToken,

    userLogin,
    userLogout,

    isUserAuthenticated:
      Boolean(userToken) &&
      Boolean(user),

    /* -------------------------
       GLOBAL
    ------------------------- */

    loading,
  };

  /* =======================================================
     PROVIDER
  ======================================================= */

  return (
    <AuthContext.Provider
      value={contextValue}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* =========================================================
   USE AUTH HOOK
========================================================= */

export const useAuth =
  (): AuthContextType => {
    const context =
      useContext(
        AuthContext
      );

    if (!context) {
      throw new Error(
        "useAuth must be used within AuthProvider"
      );
    }

    return context;
  };
