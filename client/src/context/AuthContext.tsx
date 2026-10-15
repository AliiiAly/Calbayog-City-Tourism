import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
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
   AUTH TRANSITION TYPE
========================================================= */

export type AuthTransition =
  | "user-login"
  | "user-logout"
  | "admin-login"
  | "admin-logout"
  | null;

/* =========================================================
   AUTH CONTEXT TYPE
========================================================= */

interface AuthContextType {
  /* ADMIN AUTH */

  admin: AuthenticatedAdmin | null;
  token: string | null;

  login: (
    token: string,
    admin: AdminUser | AuthenticatedAdmin
  ) => void;

  logout: () => void;

  isAuthenticated: boolean;

  /* USER AUTH */

  user: User | null;
  userToken: string | null;

  userLogin: (
    userData: User | Omit<User, "role">,
    accessToken: string
  ) => void;

  userLogout: () => Promise<void>;

  isUserAuthenticated: boolean;

  /* GLOBAL AUTH STATE */

  loading: boolean;

  /* LOGIN / LOGOUT ANIMATION */

  authTransition: AuthTransition;
  isAuthTransitioning: boolean;
}

/* =========================================================
   STORAGE KEYS
========================================================= */

const ADMIN_TOKEN_KEY = "admin_token";
const ADMIN_USER_KEY = "admin_user";

const USER_DATA_KEY = "user_data";

const USER_TOKEN_KEYS = [
  "user_token",
  "userToken",
  "user_access_token",
  "userAccessToken",
];

/* =========================================================
   TRANSITION SETTINGS
========================================================= */

const TRANSITION_DURATION = 750;

/* =========================================================
   CONTEXT
========================================================= */

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

/* =========================================================
   TOKEN HELPERS
========================================================= */

const normalizeToken = (
  accessToken: string
): string => {
  if (
    !accessToken ||
    typeof accessToken !== "string"
  ) {
    return "";
  }

  return accessToken
    .trim()
    .replace(/^Bearer\s+/i, "")
    .trim();
};

const isValidJwtFormat = (
  accessToken: string
): boolean => {
  if (!accessToken) {
    return false;
  }

  return accessToken.split(".").length === 3;
};

/* =========================================================
   ADMIN STORAGE HELPERS
========================================================= */

const clearAdminStorage = (): void => {
  ADMIN_TOKEN_KEY &&
    localStorage.removeItem(ADMIN_TOKEN_KEY);

  localStorage.removeItem(ADMIN_USER_KEY);

  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_USER_KEY);
};

const saveAdminSession = (
  accessToken: string,
  adminUser: AuthenticatedAdmin
): void => {
  const normalizedToken = normalizeToken(accessToken);

  if (!normalizedToken) {
    return;
  }

  const serializedAdmin = JSON.stringify(adminUser);

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

const clearUserStorage = (): void => {
  USER_TOKEN_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });

  localStorage.removeItem(USER_DATA_KEY);
  sessionStorage.removeItem(USER_DATA_KEY);
};

const saveUserToken = (
  accessToken: string
): void => {
  const normalizedToken = normalizeToken(accessToken);

  if (!normalizedToken) {
    return;
  }

  USER_TOKEN_KEYS.forEach((key) => {
    localStorage.setItem(key, normalizedToken);
    sessionStorage.setItem(key, normalizedToken);
  });
};

const saveUserData = (userData: User): void => {
  const serializedUser = JSON.stringify(userData);

  localStorage.setItem(USER_DATA_KEY, serializedUser);
  sessionStorage.setItem(USER_DATA_KEY, serializedUser);
};

const getStoredUserToken = (): string | null => {
  for (const key of USER_TOKEN_KEYS) {
    const localToken = localStorage.getItem(key);

    if (localToken?.trim()) {
      return normalizeToken(localToken);
    }

    const sessionToken = sessionStorage.getItem(key);

    if (sessionToken?.trim()) {
      return normalizeToken(sessionToken);
    }
  }

  return null;
};

const getStoredUserData = (): string | null => {
  return (
    localStorage.getItem(USER_DATA_KEY) ||
    sessionStorage.getItem(USER_DATA_KEY)
  );
};

/* =========================================================
   NORMALIZATION HELPERS
========================================================= */

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

  return {
    id: String(userData.id),

    email: String(userData.email || ""),

    username: String(
      userData.username || userData.email || ""
    ),

    name: String(userData.name || ""),

    is_active: userData.is_active !== false,

    role: "user",

    email_verified:
      "email_verified" in userData &&
      typeof userData.email_verified === "boolean"
        ? userData.email_verified
        : undefined,
  };
};

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
   AUTH TRANSITION OVERLAY
========================================================= */

const AuthTransitionOverlay = ({
  transition,
}: {
  transition: AuthTransition;
}) => {
  if (!transition) {
    return null;
  }

  const isLogin =
    transition === "user-login" ||
    transition === "admin-login";

  const isAdmin =
    transition === "admin-login" ||
    transition === "admin-logout";

  const title = isLogin
    ? "Welcome"
    : "See you soon!";

  const message = isLogin
    ? "Signing you in..."
    : "Signing you out...";

  const detail = isLogin
    ? "Preparing your Calbayog City Tourism experience."
    : "Securely ending your session.";

  return (
    <>
      <style>
        {`
          @keyframes authOverlayFadeIn {
            from {
              opacity: 0;
              backdrop-filter: blur(0);
            }
            to {
              opacity: 1;
              backdrop-filter: blur(7px);
            }
          }

          @keyframes authCardEnter {
            from {
              opacity: 0;
              transform: translateY(16px) scale(0.97);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes authSpinner {
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes authDotPulse {
            0%, 80%, 100% {
              opacity: 0.35;
              transform: scale(0.8);
            }
            40% {
              opacity: 1;
              transform: scale(1);
            }
          }

          .auth-transition-overlay {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: rgba(13, 20, 45, 0.58);
            backdrop-filter: blur(7px);
            -webkit-backdrop-filter: blur(7px);
            animation: authOverlayFadeIn 220ms ease-out both;
          }

          .auth-transition-card {
            width: 100%;
            max-width: 365px;
            padding: 38px 28px 32px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.72);
            border-radius: 25px;
            background: rgba(255, 255, 255, 0.97);
            box-shadow: 0 24px 80px rgba(10, 20, 65, 0.24);
            animation: authCardEnter 320ms ease-out both;
          }

          .auth-transition-logo {
            width: 70px;
            height: 70px;
            margin: 0 auto 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 22px;
            background: linear-gradient(145deg, #383da9, #242879);
            color: #fff;
            font-size: 25px;
            font-weight: 800;
            letter-spacing: -1.5px;
            box-shadow: 0 8px 25px rgba(45, 49, 149, 0.24);
          }

          .auth-transition-spinner {
            width: 30px;
            height: 30px;
            margin: 0 auto 17px;
            border: 3px solid #e3e5f8;
            border-top-color: #2d3195;
            border-right-color: #555bd0;
            border-radius: 50%;
            animation: authSpinner 750ms linear infinite;
          }

          .auth-transition-title {
            margin: 0 0 9px;
            color: #202453;
            font-size: 23px;
            font-weight: 750;
            letter-spacing: -0.5px;
          }

          .auth-transition-message {
            margin: 0 0 8px;
            color: #343991;
            font-size: 15px;
            font-weight: 700;
          }

          .auth-transition-detail {
            max-width: 270px;
            margin: 0 auto;
            color: #73768a;
            font-size: 12px;
            line-height: 1.7;
          }

          .auth-transition-dots {
            display: flex;
            justify-content: center;
            gap: 6px;
            margin-top: 22px;
          }

          .auth-transition-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #4549b5;
            animation: authDotPulse 1.1s infinite ease-in-out;
          }

          .auth-transition-dot:nth-child(2) {
            animation-delay: 0.15s;
          }

          .auth-transition-dot:nth-child(3) {
            animation-delay: 0.3s;
          }

          @media (prefers-reduced-motion: reduce) {
            .auth-transition-overlay,
            .auth-transition-card,
            .auth-transition-spinner,
            .auth-transition-dot {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
            }
          }
        `}
      </style>

      <div
        className="auth-transition-overlay"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="auth-transition-card">
          <div
            className="auth-transition-logo"
            aria-label="Calbayog City Tourism"
          >
            {isAdmin ? "ADM" : "CCT"}
          </div>

          <div
            className="auth-transition-spinner"
            aria-hidden="true"
          />

          <h2 className="auth-transition-title">
            {title}
          </h2>

          <p className="auth-transition-message">
            {message}
          </p>

          <p className="auth-transition-detail">
            {detail}
          </p>

          <div
            className="auth-transition-dots"
            aria-hidden="true"
          >
            <span className="auth-transition-dot" />
            <span className="auth-transition-dot" />
            <span className="auth-transition-dot" />
          </div>
        </div>
      </div>
    </>
  );
};

/* =========================================================
   AUTH PROVIDER
========================================================= */

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  /* ADMIN STATE */

  const [admin, setAdmin] =
    useState<AuthenticatedAdmin | null>(null);

  const [token, setToken] =
    useState<string | null>(null);

  /* USER STATE */

  const [user, setUser] =
    useState<User | null>(null);

  const [userToken, setUserToken] =
    useState<string | null>(null);

  /* INITIALIZATION STATE */

  const [loading, setLoading] = useState(true);

  /* LOGIN / LOGOUT TRANSITION STATE */

  const [authTransition, setAuthTransition] =
    useState<AuthTransition>(null);

  const transitionTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimerRef.current !== null) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
  }, []);

  const showTemporaryTransition = useCallback(
    (transition: AuthTransition) => {
      clearTransitionTimer();

      setAuthTransition(transition);

      transitionTimerRef.current = setTimeout(() => {
        setAuthTransition(null);
        transitionTimerRef.current = null;
      }, TRANSITION_DURATION);
    },
    [clearTransitionTimer]
  );

  useEffect(() => {
    return () => {
      clearTransitionTimer();
    };
  }, [clearTransitionTimer]);

  /* =======================================================
     INITIALIZE AUTHENTICATION
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const initializeAuth = (): void => {
      try {
        /* RESTORE ADMIN SESSION */

        const storedAdminToken =
          localStorage.getItem(ADMIN_TOKEN_KEY);

        const storedAdmin =
          localStorage.getItem(ADMIN_USER_KEY);

        if (
          storedAdminToken &&
          storedAdmin &&
          storedAdmin !== "undefined" &&
          storedAdmin !== "null"
        ) {
          if (isValidJwtFormat(storedAdminToken)) {
            try {
              const parsedAdmin = JSON.parse(storedAdmin);

              const normalizedAdmin =
                normalizeAdminData(parsedAdmin);

              if (normalizedAdmin && mounted) {
                const normalizedAdminToken =
                  normalizeToken(storedAdminToken);

                saveAdminSession(
                  normalizedAdminToken,
                  normalizedAdmin
                );

                setToken(normalizedAdminToken);
                setAdmin(normalizedAdmin);
              }
            } catch (error) {
              console.error(
                "Failed to parse stored admin user:",
                error
              );

              clearAdminStorage();
            }
          } else {
            clearAdminStorage();
          }
        }

        /* RESTORE USER SESSION */

        const storedUserToken = getStoredUserToken();
        const storedUserData = getStoredUserData();

        if (!storedUserToken || !storedUserData) {
          return;
        }

        if (
          storedUserData === "undefined" ||
          storedUserData === "null"
        ) {
          clearUserStorage();
          return;
        }

        if (!isValidJwtFormat(storedUserToken)) {
          clearUserStorage();
          return;
        }

        try {
          const parsedUserData = JSON.parse(storedUserData);

          const normalizedUser =
            normalizeUserData(parsedUserData);

          if (!normalizedUser || !normalizedUser.is_active) {
            clearUserStorage();
            return;
          }

          if (mounted) {
            saveUserToken(storedUserToken);
            saveUserData(normalizedUser);

            setUser(normalizedUser);
            setUserToken(storedUserToken);
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
    adminUser: AdminUser | AuthenticatedAdmin
  ): void => {
    const normalizedToken = normalizeToken(newToken);

    if (
      !normalizedToken ||
      !isValidJwtFormat(normalizedToken)
    ) {
      console.error(
        "Admin login failed: Invalid access token."
      );

      return;
    }

    const normalizedAdmin =
      normalizeAdminData(adminUser);

    if (!normalizedAdmin) {
      console.error(
        "Admin login failed: Invalid admin information."
      );

      return;
    }

    clearAdminStorage();

    setToken(normalizedToken);
    setAdmin(normalizedAdmin);

    saveAdminSession(
      normalizedToken,
      normalizedAdmin
    );

    showTemporaryTransition("admin-login");

    console.log("Admin login successful.", {
      adminId: normalizedAdmin.id,
      role: normalizedAdmin.role,
    });
  };

  /* =======================================================
     ADMIN LOGOUT
  ======================================================= */

  const logout = (): void => {
    /*
     * Show the transition before redirecting.
     * The overlay remains visible until the page changes.
     */

    clearTransitionTimer();
    setAuthTransition("admin-logout");

    setToken(null);
    setAdmin(null);

    clearAdminStorage();

    /*
     * Preserve the existing public-page redirect.
     */

    window.setTimeout(() => {
      window.location.replace("/?adminLogout=1");
    }, TRANSITION_DURATION);
  };

  /* =======================================================
     USER LOGIN
  ======================================================= */

  const userLogin = (
    userData: User | Omit<User, "role">,
    accessToken: string
  ): void => {
    const normalizedToken = normalizeToken(accessToken);

    if (
      !normalizedToken ||
      !isValidJwtFormat(normalizedToken)
    ) {
      console.error(
        "User login failed: Invalid access token."
      );

      return;
    }

    const normalizedUser = normalizeUserData(userData);

    if (!normalizedUser) {
      console.error(
        "User login failed: Invalid user information."
      );

      return;
    }

    if (!normalizedUser.is_active) {
      console.error(
        "User login failed: The account is inactive."
      );

      clearUserStorage();

      setUser(null);
      setUserToken(null);

      return;
    }

    clearUserStorage();

    setUser(normalizedUser);
    setUserToken(normalizedToken);

    saveUserToken(normalizedToken);
    saveUserData(normalizedUser);

    showTemporaryTransition("user-login");

    console.log("User login successful.", {
      userId: normalizedUser.id,
      role: normalizedUser.role,
    });
  };

  /* =======================================================
     USER LOGOUT
  ======================================================= */

  const userLogout = async (): Promise<void> => {
    clearTransitionTimer();

    setAuthTransition("user-logout");

    /*
     * Immediately clear user authentication state
     * and remove all supported user storage keys.
     */

    setUser(null);
    setUserToken(null);

    clearUserStorage();

    /*
     * Keep the transition visible briefly before
     * resolving, so callers that navigate after
     * awaiting userLogout do not hide it immediately.
     */

    await new Promise<void>((resolve) => {
      transitionTimerRef.current = setTimeout(() => {
        transitionTimerRef.current = null;
        setAuthTransition(null);
        resolve();
      }, TRANSITION_DURATION);
    });
  };

  /* =======================================================
     CONTEXT VALUE
  ======================================================= */

  const contextValue: AuthContextType = {
    /* ADMIN */

    admin,
    token,

    login,
    logout,

    isAuthenticated: Boolean(token && admin),

    /* USER */

    user,
    userToken,

    userLogin,
    userLogout,

    isUserAuthenticated: Boolean(userToken && user),

    /* GLOBAL */

    loading,

    /* TRANSITION */

    authTransition,

    isAuthTransitioning: authTransition !== null,
  };

  /* =======================================================
     PROVIDER
  ======================================================= */

  return (
    <AuthContext.Provider value={contextValue}>
      {children}

      <AuthTransitionOverlay
        transition={authTransition}
      />
    </AuthContext.Provider>
  );
};

/* =========================================================
   USE AUTH HOOK
========================================================= */

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return context;
};
