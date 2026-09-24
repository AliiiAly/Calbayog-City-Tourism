
import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  role?: "user" | "admin";
}

type IconName =
  | "home"
  | "destination"
  | "map"
  | "car"
  | "hotel"
  | "guide"
  | "event"
  | "calendar"
  | "memories"
  | "logout"
  | "close"
  | "chevron"
  | "leaf"
  | "dashboard"
  | "feedback"
  | "users"
  | "management";

interface SidebarIconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}

const SidebarIcon: React.FC<SidebarIconProps> = ({
  name,
  size = 20,
  strokeWidth = 1.8,
}) => {
  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "home":
      return (
        <svg {...commonProps}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5.5 9.5V21h13V9.5" />
          <path d="M9.5 21v-6h5v6" />
        </svg>
      );

    case "destination":
      return (
        <svg {...commonProps}>
          <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );

    case "map":
      return (
        <svg {...commonProps}>
          <path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z" />
          <path d="M9 3v15" />
          <path d="M15 6v15" />
        </svg>
      );

    case "car":
      return (
        <svg {...commonProps}>
          <path d="M5 17h14" />
          <path d="M6 17v2h2v-2" />
          <path d="M16 17v2h2v-2" />
          <path d="m5 17 1.5-6h11l1.5 6" />
          <path d="m8 11 1.5-4h5L16 11" />
          <circle cx="7.5" cy="14.5" r=".8" />
          <circle cx="16.5" cy="14.5" r=".8" />
        </svg>
      );

    case "hotel":
      return (
        <svg {...commonProps}>
          <path d="M4 20V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v15" />
          <path d="M4 12h16" />
          <path d="M7 8h3" />
          <path d="M14 8h3" />
          <path d="M7 16h3" />
          <path d="M14 16h3" />
        </svg>
      );

    case "guide":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M9 15l1.5-4.5L15 9l-1.5 4.5L9 15Z" />
        </svg>
      );

    case "event":
      return (
        <svg {...commonProps}>
          <rect x="3.5" y="5" width="17" height="16" rx="2" />
          <path d="M7 3v4" />
          <path d="M17 3v4" />
          <path d="M3.5 9h17" />
          <path d="M8 13h.01" />
          <path d="M12 13h.01" />
          <path d="M16 13h.01" />
          <path d="M8 17h.01" />
          <path d="M12 17h.01" />
        </svg>
      );

    case "calendar":
      return (
        <svg {...commonProps}>
          <rect x="3.5" y="5" width="17" height="16" rx="2" />
          <path d="M7 3v4" />
          <path d="M17 3v4" />
          <path d="M3.5 9h17" />
          <path d="M8 13h8" />
          <path d="M8 17h5" />
        </svg>
      );

    case "memories":
      return (
        <svg {...commonProps}>
          <path d="M20.8 8.8c0 5.5-8.8 11-8.8 11S3.2 14.3 3.2 8.8A5.1 5.1 0 0 1 12 5.5a5.1 5.1 0 0 1 8.8 3.3Z" />
          <path d="M8.5 11.5h.01" />
          <path d="M15.5 11.5h.01" />
        </svg>
      );

    case "logout":
      return (
        <svg {...commonProps}>
          <path d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10" />
          <path d="m14 8 4 4-4 4" />
          <path d="M18 12H8" />
        </svg>
      );

    case "close":
      return (
        <svg {...commonProps}>
          <path d="m6 6 12 12" />
          <path d="m18 6-12 12" />
        </svg>
      );

    case "chevron":
      return (
        <svg {...commonProps}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );

    case "leaf":
      return (
        <svg {...commonProps}>
          <path d="M20.5 3.5C12 3.5 5 7.5 5 14.5c0 3.3 2.7 6 6 6 7 0 9.5-7 9.5-17Z" />
          <path d="M4 21c3.5-5 7.5-8 13-10" />
        </svg>
      );

    case "dashboard":
      return (
        <svg {...commonProps}>
          <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
        </svg>
      );

    case "feedback":
      return (
        <svg {...commonProps}>
          <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v8A2.5 2.5 0 0 1 16.5 16H11l-4.5 4v-4.5A2.5 2.5 0 0 1 5 13V5.5Z" />
          <path d="M8.5 8h7" />
          <path d="M8.5 11h5" />
        </svg>
      );

    case "users":
      return (
        <svg {...commonProps}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 20c.5-3.5 2.3-5.5 5.5-5.5s5 2 5.5 5.5" />
          <path d="M16 5.5a3 3 0 0 1 0 5.8" />
          <path d="M16 14.5c2.4.3 4 2 4.5 5.5" />
        </svg>
      );

    case "management":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V22h-2.5v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H5.5v-2.5h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.5v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v2.5h-.1a1.7 1.7 0 0 0-1.6 1Z" />
        </svg>
      );

    default:
      return null;
  }
};

/* =========================================================
   TYPES
========================================================= */

interface SidebarItem {
  to: string;
  icon: IconName;
  label: string;
  description: string;
  exact?: boolean;

  /**
   * When true, the item requires a logged-in user.
   * The item remains visible, but clicking it while
   * logged out opens the Login modal instead of navigating.
   */
  requiresAuth?: boolean;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

/* =========================================================
   USER NAVIGATION
========================================================= */

const userSections: SidebarSection[] = [
  {
    title: "Explore",
    items: [
      {
        to: "/",
        icon: "home",
        label: "Home",
        description: "Start exploring",
        exact: true,
      },
      {
        to: "/attractions",
        icon: "destination",
        label: "Attractions",
        description: "Places worth discovering",
      },
    ],
  },

  {
    title: "Travel Essentials",
    items: [
      {
        to: "/getting-there",
        icon: "car",
        label: "Getting There",
        description: "Routes & transportation",
      },
      {
        to: "/accommodations",
        icon: "hotel",
        label: "Accommodations",
        description: "Stay comfortably",
      },
      {
        to: "/guides",
        icon: "guide",
        label: "Tour Guides",
        description: "Local knowledge",
      },
    ],
  },

  {
    title: "Plan Your Experience",
    items: [
      {
        to: "/events",
        icon: "event",
        label: "Events & Festivals",
        description: "What's happening",
      },
      {
        to: "/itinerary",
        icon: "calendar",
        label: "Plan Your Trip",
        description: "Build your itinerary",
        requiresAuth: true,
      },
      {
        to: "/memories",
        icon: "memories",
        label: "My Memories",
        description: "Save your travel moments",
        requiresAuth: true,
      },
    ],
  },
];

/* =========================================================
   ADMIN NAVIGATION
========================================================= */

const adminSections: SidebarSection[] = [
  {
    title: "Overview",
    items: [
      {
        to: "/admin",
        icon: "dashboard",
        label: "Dashboard",
        description: "View tourism overview",
        exact: true,
      },
    ],
  },

  {
    title: "Content Management",
    items: [
      {
        to: "/admin/attractions",
        icon: "destination",
        label: "Attractions",
        description: "Manage tourist attractions",
      },
      {
        to: "/admin/events",
        icon: "event",
        label: "Events",
        description: "Manage events & festivals",
      },
      {
        to: "/admin/accommodations",
        icon: "hotel",
        label: "Accommodations",
        description: "Manage places to stay",
      },
      {
        to: "/admin/guides",
        icon: "guide",
        label: "Guides",
        description: "Manage tour guides",
      },
      {
        to: "/admin/getting-there",
        icon: "car",
        label: "Getting There",
        description: "Manage transport information",
      },
    ],
  },

  {
    title: "Settings",
    items: [
      {
        to: "/admin/users",
        icon: "users",
        label: "User Management",
        description: "Manage user accounts",
      },
      {
        to: "/admin/management",
        icon: "management",
        label: "Admin Management",
        description: "Manage administrators",
      },
    ],
  },
];

/* =========================================================
   SIDEBAR
========================================================= */

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  role = "user",
}) => {
  const {
    user,
    userLogout,
    isUserAuthenticated,
    admin,
    logout,
  } = useAuth();

  const location = useLocation();

  const isAdmin = role === "admin";

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    if (isAdmin) {
      logout();
    } else {
      userLogout();
    }

    onClose();
  };

  /* =========================================================
     ACTIVE ROUTE
  ========================================================= */

  const isActive = (
    path: string,
    exact = false
  ) =>
    exact
      ? location.pathname === path
      : location.pathname === path ||
        location.pathname.startsWith(`${path}/`);

  /* =========================================================
     USER-ONLY SIDEBAR ACTION
  ========================================================= */

  const handleNavigationClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    item: SidebarItem
  ) => {
    if (
      item.requiresAuth &&
      !isUserAuthenticated &&
      !isAdmin
    ) {
      event.preventDefault();

      onClose();

      window.dispatchEvent(
        new Event("open-login-modal")
      );

      return;
    }

    onClose();
  };

  /* =========================================================
     LOCK BACKGROUND SCROLL
  ========================================================= */

  useEffect(() => {
    const preventScroll = (e: TouchEvent) => {
      const target = e.target as HTMLElement;

      if (!target.closest(".sidebar-drawer")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const setIonScroll = (enabled: boolean) => {
      const ionContents =
        document.querySelectorAll("ion-content");

      ionContents.forEach((el: any) => {
        if (typeof el.scrollY !== "undefined") {
          el.scrollY = enabled;
        }

        el.style.setProperty(
          "--overflow",
          enabled ? "auto" : "hidden"
        );

        el.style.overflow = enabled ? "" : "hidden";
      });

      const scrollables = document.querySelectorAll(
        ".ion-page, ion-router-outlet"
      );

      scrollables.forEach((el: any) => {
        el.style.overflow = enabled ? "" : "hidden";
      });
    };

    if (isOpen) {
      document.body.classList.add("sidebar-open");

      document.addEventListener(
        "touchmove",
        preventScroll,
        {
          passive: false,
        }
      );

      setIonScroll(false);
    } else {
      document.body.classList.remove("sidebar-open");

      document.removeEventListener(
        "touchmove",
        preventScroll
      );

      setIonScroll(true);
    }

    return () => {
      document.body.classList.remove("sidebar-open");

      document.removeEventListener(
        "touchmove",
        preventScroll
      );

      setIonScroll(true);
    };
  }, [isOpen]);

  /* =========================================================
     ESCAPE KEY
  ========================================================= */

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [isOpen, onClose]);

  /* =========================================================
     SECTIONS
  ========================================================= */

  const sections = isAdmin
    ? adminSections
    : userSections;

  /* =========================================================
     AUTHENTICATION STATE
  ========================================================= */

  const authenticated = isAdmin
    ? !!admin
    : isUserAuthenticated;

  /* =========================================================
     CONTENT
  ========================================================= */

  const content = (
    <>
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar-drawer ${
          isOpen ? "open" : ""
        }`}
        aria-label={
          isAdmin
            ? "Calbayog Tourism admin navigation"
            : "Calbayog Tourism navigation"
        }
        aria-hidden={!isOpen}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="sidebar-top">
          <div className="sidebar-brand">
            <img
              src="/logo2.png"
              alt="Calbayog City Tourism"
              className="sidebar-brand-logo"
            />

            <div className="sidebar-brand-copy">
              <span className="sidebar-brand-name">
                CALBAYOG CITY TOURISM
              </span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <SidebarIcon
              name="close"
              size={18}
              strokeWidth={1.8}
            />
          </button>
        </div>

        {/* =================================================
            INTRO
        ================================================= */}

        <div className="sidebar-intro">
          <div className="sidebar-intro-mark">
            <span>
              {isAdmin ? "Admin" : "Explore"}
            </span>
          </div>

          <div className="sidebar-intro-copy">
            <strong>
              {isAdmin
                ? "Manage Calbayog"
                : "Discover Calbayog"}
            </strong>

            <span>
              {isAdmin
                ? "Tourism content & operations"
                : "Places, experiences & local stories"}
            </span>
          </div>
        </div>

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <div className="sidebar-content">
          {sections.map((section) => (
            <div
              className="sidebar-section"
              key={section.title}
            >
              <div className="sidebar-section-label">
                {section.title}
              </div>

              {section.items.map((item) => {
                const requiresLogin =
                  item.requiresAuth &&
                  !isUserAuthenticated &&
                  !isAdmin;

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`sidebar-item ${
                      isActive(
                        item.to,
                        item.exact
                      ) && !requiresLogin
                        ? "active"
                        : ""
                    }`}
                    onClick={(event) =>
                      handleNavigationClick(
                        event,
                        item
                      )
                    }
                    tabIndex={isOpen ? 0 : -1}
                    aria-disabled={
                      requiresLogin
                        ? true
                        : undefined
                    }
                  >
                    <span className="sidebar-item-icon">
                      <SidebarIcon
                        name={item.icon}
                        size={19}
                      />
                    </span>

                    <span className="sidebar-item-content">
                      <span className="sidebar-item-label">
                        {item.label}
                      </span>

                      <span className="sidebar-item-description">
                        {item.description}
                      </span>
                    </span>

                    <span className="sidebar-item-arrow">
                      <SidebarIcon
                        name="chevron"
                        size={15}
                      />
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}

          {/* =================================================
              ACCOUNT
          ================================================= */}

          {authenticated && (
            <div className="sidebar-section sidebar-account-section">
              <div className="sidebar-section-label">
                Account
              </div>

              {isAdmin && (
                <Link
                  to="/"
                  className="sidebar-item"
                  onClick={onClose}
                  tabIndex={isOpen ? 0 : -1}
                >
                  <span className="sidebar-item-icon">
                    <SidebarIcon
                      name="home"
                      size={19}
                    />
                  </span>

                  <span className="sidebar-item-content">
                    <span className="sidebar-item-label">
                      Visit Public Site
                    </span>

                    <span className="sidebar-item-description">
                      View the visitor experience
                    </span>
                  </span>

                  <span className="sidebar-item-arrow">
                    <SidebarIcon
                      name="chevron"
                      size={15}
                    />
                  </span>
                </Link>
              )}

              <button
                type="button"
                className="sidebar-item sidebar-logout"
                onClick={handleLogout}
                tabIndex={isOpen ? 0 : -1}
              >
                <span className="sidebar-item-icon">
                  <SidebarIcon
                    name="logout"
                    size={19}
                  />
                </span>

                <span className="sidebar-item-content">
                  <span className="sidebar-item-label">
                    Sign Out
                  </span>

                  <span className="sidebar-item-description">
                    {isAdmin
                      ? "Leave administrator account"
                      : "Leave your account"}
                  </span>
                </span>
              </button>
            </div>
          )}
        </div>

        {/* =================================================
            USER / ADMIN FOOTER
        ================================================= */}

        {isAdmin && admin ? (
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              {(admin.username || "A")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="sidebar-user-details">
              <span className="sidebar-user-name">
                {admin.username || "Admin"}
              </span>

              <span className="sidebar-user-role">
                Administrator
              </span>
            </div>

            <span className="sidebar-user-status" />
          </div>
        ) : !isAdmin &&
          isUserAuthenticated &&
          user ? (
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              {(user.name ||
                user.username ||
                "?")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="sidebar-user-details">
              <span className="sidebar-user-name">
                {user.name || user.username}
              </span>

              <span className="sidebar-user-role">
                Traveler
              </span>
            </div>

            <span className="sidebar-user-status" />
          </div>
        ) : (
          <div className="sidebar-footer">
            <div className="sidebar-footer-line">
              Calbayog City Tourism Office
            </div>

            <div className="sidebar-footer-location">
              Western Samar, Philippines
            </div>
          </div>
        )}
      </aside>
    </>
  );

  return ReactDOM.createPortal(
    content,
    document.body
  );
};

export default Sidebar;