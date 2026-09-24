import React, { useState, useEffect } from "react";
import { NavLink, useHistory } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useDarkMode } from "../../context/DarkModeContext";

const navGroups = [
  {
    title: "Overview",
    items: [{ to: "/admin", label: "Dashboard", icon: "📊", end: true }],
  },
  {
    title: "Content Management",
    items: [
      { to: "/admin/destinations", label: "Destinations", icon: "🌿" },
      { to: "/admin/map", label: "Map View", icon: "🗺️" },
      { to: "/admin/events", label: "Events", icon: "🎉" },
      { to: "/admin/accommodations", label: "Accommodations", icon: "🏨" },
      { to: "/admin/guides", label: "Guides", icon: "🧭" },
      { to: "/admin/getting-there", label: "Getting There", icon: "🚗" },
    ],
  },
  {
    title: "User Interactions",
    items: [
      { to: "/admin/requests", label: "Itinerary Requests", icon: "📅" },
      { to: "/admin/feedback", label: "Feedback", icon: "💬" },
    ],
  },
  {
    title: "Settings",
    items: [
      { to: "/admin/users", label: "User Management", icon: "👤" },
      { to: "/admin/management", label: "Admin Management", icon: "👥" },
    ],
  },
];

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { admin, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const history = useHistory();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Remove default margins from body/html to prevent white bar
  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.paddingBottom = "0 !important";
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";
    document.documentElement.style.height = "100%";
    document.body.style.height = "100%";
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    // Override theme.css padding-bottom
    const style = document.createElement("style");
    style.textContent = "body { padding-bottom: 0 !important; }";
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleLogout = () => {
    logout();
    history.push("/admin/login");
  };

  const NavItem = ({
    item,
    onClick,
  }: {
    item: { to: string; label: string; icon: string; end?: boolean };
    onClick?: () => void;
  }) => (
    <NavLink
      to={item.to}
      exact={item.end}
      onClick={onClick}
      style={({ isActive }: any) => ({
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 20px",
        textDecoration: "none",
        background: isActive ? "rgba(255,255,255,0.2)" : "transparent",
        color: "#fff",
        fontSize: "0.9rem",
        fontWeight: isActive ? 600 : 400,
        borderLeft: isActive
          ? "4px solid var(--festival-amber)"
          : "4px solid transparent",
        transition: "all 0.2s ease",
        margin: "2px 0",
        borderRadius: "0 8px 8px 0",
      })}
      onMouseEnter={(e) => {
        if (
          !e.currentTarget.style.background.includes("rgba(255,255,255,0.2)")
        ) {
          e.currentTarget.style.background = "rgba(255,255,255,0.1)";
        }
      }}
      onMouseLeave={(e) => {
        if (
          !e.currentTarget.style.background.includes("rgba(255,255,255,0.2)")
        ) {
          e.currentTarget.style.background = "transparent";
        }
      }}
    >
      <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
      <span>{item.label}</span>
    </NavLink>
  );

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: darkMode ? "#1a1a2e" : "#f5f7fa",
        overflow: "hidden",
        margin: 0,
        padding: 0,
      }}
    >
      {/* Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 40,
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        style={{
          width: 260,
          background: "linear-gradient(180deg, #1a5f4a 0%, #0d3d2e 100%)",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: sidebarOpen ? 0 : -260,
          height: "100%",
          zIndex: 50,
          transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "4px 0 24px rgba(0,0,0,0.3)",
        }}
        className="d-lg-flex"
      >
        {/* Logo Section */}
        <div
          style={{
            padding: "24px 20px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background:
                  "linear-gradient(135deg, var(--festival-amber), #ff9f43)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                boxShadow: "0 4px 12px rgba(255, 159, 67, 0.3)",
              }}
            >
              🌿
            </div>
            <div>
              <p
                className="fw-bold mb-0"
                style={{
                  fontSize: "1rem",
                  fontFamily: "Poppins, serif",
                  lineHeight: 1.2,
                }}
              >
                Calbayog
              </p>
              <p
                style={{
                  fontSize: "0.75rem",
                  opacity: 0.8,
                  margin: 0,
                  letterSpacing: 1,
                }}
              >
                TOURISM
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "16px 0", overflowY: "auto" }}>
          {navGroups.map((group) => (
            <div key={group.title}>
              <div
                style={{
                  padding: "16px 12px 8px",
                  fontSize: "0.75rem",
                  opacity: 0.6,
                  fontWeight: 600,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                {group.title}
              </div>
              {group.items.map((item) => (
                <NavItem
                  key={item.to}
                  item={item}
                  onClick={() => setSidebarOpen(false)}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* User Section */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1rem",
              }}
            >
              👤
            </div>
            <div>
              <p style={{ fontSize: "0.85rem", fontWeight: 600, margin: 0 }}>
                {admin?.username || "Admin"}
              </p>
              <p style={{ fontSize: "0.7rem", opacity: 0.7, margin: 0 }}>
                Administrator
              </p>
            </div>
          </div>
          <a
            href="/"
            style={{
              color: "#fff",
              opacity: 0.8,
              fontSize: "0.85rem",
              display: "block",
              marginBottom: 8,
              textDecoration: "none",
              padding: "8px 12px",
              borderRadius: "6px",
              background: "rgba(255,255,255,0.1)",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
            }
          >
            ← Visit Public Site
          </a>
          <button
            onClick={handleLogout}
            style={{
              background: "linear-gradient(135deg, #e74c3c, #c0392b)",
              border: "none",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              width: "100%",
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: "0 4px 12px rgba(231, 76, 60, 0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 6px 16px rgba(231, 76, 60, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(231, 76, 60, 0.3)";
            }}
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Desktop sidebar spacer */}
      <div
        className="d-none d-lg-block"
        style={{ width: 260, flexShrink: 0 }}
      />

      {/* Desktop Sidebar */}
      <aside
        className="d-none d-lg-flex"
        style={{
          width: 260,
          background: "linear-gradient(180deg, #1a5f4a 0%, #0d3d2e 100%)",
          color: "#fff",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100%",
          zIndex: 50,
          boxShadow: "4px 0 24px rgba(0,0,0,0.3)",
        }}
      >
        {/* Logo Section */}
        <div
          style={{
            padding: "24px 20px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background:
                  "linear-gradient(135deg, var(--festival-amber), #ff9f43)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                boxShadow: "0 4px 12px rgba(255, 159, 67, 0.3)",
              }}
            >
              🌿
            </div>
            <div>
              <p
                className="fw-bold mb-0"
                style={{
                  fontSize: "1rem",
                  fontFamily: "Poppins, serif",
                  lineHeight: 1.2,
                }}
              >
                Calbayog
              </p>
              <p
                style={{
                  fontSize: "0.75rem",
                  opacity: 0.8,
                  margin: 0,
                  letterSpacing: 1,
                }}
              >
                TOURISM
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "16px 0", overflowY: "auto" }}>
          {navGroups.map((group) => (
            <div key={group.title}>
              <div
                style={{
                  padding: "16px 12px 8px",
                  fontSize: "0.75rem",
                  opacity: 0.6,
                  fontWeight: 600,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                {group.title}
              </div>
              {group.items.map((item) => (
                <NavItem key={item.to} item={item} />
              ))}
            </div>
          ))}
        </nav>

        {/* User Section */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1rem",
              }}
            >
              👤
            </div>
            <div>
              <p style={{ fontSize: "0.85rem", fontWeight: 600, margin: 0 }}>
                {admin?.username || "Admin"}
              </p>
              <p style={{ fontSize: "0.7rem", opacity: 0.7, margin: 0 }}>
                Administrator
              </p>
            </div>
          </div>
          <a
            href="/"
            style={{
              color: "#fff",
              opacity: 0.8,
              fontSize: "0.85rem",
              display: "block",
              marginBottom: 8,
              textDecoration: "none",
              padding: "8px 12px",
              borderRadius: "6px",
              background: "rgba(255,255,255,0.1)",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
            }
          >
            ← Visit Public Site
          </a>
          <button
            onClick={handleLogout}
            style={{
              background: "linear-gradient(135deg, #e74c3c, #c0392b)",
              border: "none",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              width: "100%",
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: "0 4px 12px rgba(231, 76, 60, 0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 6px 16px rgba(231, 76, 60, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(231, 76, 60, 0.3)";
            }}
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {/* Mobile topbar */}
        <header
          className="d-lg-none"
          style={{
            background: "linear-gradient(135deg, #1a5f4a, #0d3d2e)",
            color: "#fff",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            position: "sticky",
            top: 0,
            zIndex: 30,
            boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              border: "none",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              fontSize: "1.4rem",
              cursor: "pointer",
              padding: "8px 12px",
              borderRadius: "8px",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
            }
          >
            ☰
          </button>
          <span
            className="fw-bold"
            style={{ fontFamily: "Poppins, serif", fontSize: "1.1rem" }}
          >
            Calbayog Tourism
          </span>
        </header>

        <main
          style={{
            flex: 1,
            padding: "24px",
            overflowY: "auto",
            overflowX: "hidden",
            background: darkMode ? "#1a1a2e" : "#f5f7fa",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
