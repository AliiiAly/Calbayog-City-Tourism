import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Row,
  Col,
  Card,
  Spinner,
  Badge,
  ProgressBar,
  Button,
} from "react-bootstrap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  getDestinations,
  getEvents,
  getAccommodations,
  getGuides,
  getItineraryRequests,
} from "../../services/api";
import { useDarkMode } from "../../context/DarkModeContext";
import NotificationBanner from "../../components/NotificationBanner";

interface Counts {
  destinations: number;
  events: number;
  accommodations: number;
  guides: number;
  requests: number;
}

const StatCard: React.FC<{
  label: string;
  count: number;
  icon: string;
  to: string;
  gradient: string;
  trend?: string;
  percentage?: number;
}> = ({ label, count, icon, to, gradient, trend, percentage }) => (
  <Col xs={6} md={4} lg={2}>
    <Link to={to} style={{ textDecoration: "none" }}>
      <Card
        className="border-0 h-100 text-center"
        style={{
          borderRadius: "16px",
          background: gradient,
          color: "#fff",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          transition: "transform 0.3s, box-shadow 0.3s",
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.18)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
        }}
      >
        {trend && (
          <Badge
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              background: "rgba(255,255,255,0.25)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.3)",
              fontSize: "0.75rem",
              padding: "4px 8px",
            }}
          >
            {trend}
          </Badge>
        )}
        <Card.Body className="py-4">
          <div style={{ fontSize: "2.5rem", marginBottom: 8, opacity: 0.95 }}>
            {icon}
          </div>
          <h3
            className="fw-bold mb-1"
            style={{ fontSize: "2.2rem", color: "#fff" }}
          >
            {count}
          </h3>
          <p
            className="mb-0"
            style={{ fontSize: "0.85rem", opacity: 0.9, fontWeight: 500 }}
          >
            {label}
          </p>
          {percentage !== undefined && (
            <div style={{ fontSize: "0.75rem", opacity: 0.7, marginTop: 4 }}>
              {percentage}% of total
            </div>
          )}
        </Card.Body>
      </Card>
    </Link>
  </Col>
);

const AdminDashboard: React.FC = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [counts, setCounts] = useState<Counts>({
    destinations: 0,
    events: 0,
    accommodations: 0,
    guides: 0,
    requests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDestinations(),
      getEvents(),
      getAccommodations(),
      getGuides(),
      getItineraryRequests(),
    ])
      .then(([d, e, a, g, r]) => {
        setCounts({
          destinations: d.data.length,
          events: e.data.length,
          accommodations: a.data.length,
          guides: g.data.length,
          requests: r.data.length,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalItems =
    counts.destinations + counts.events + counts.accommodations + counts.guides;
  const pendingItems = counts.requests;
  const maxContent = Math.max(
    counts.destinations,
    counts.events,
    counts.accommodations,
    counts.guides,
    1,
  );
  const getPercentage = (val: number) =>
    totalItems > 0 ? Math.round((val / totalItems) * 100) : 0;

  const barData = [
    { name: "Destinations", value: counts.destinations, color: "#11998e" },
    { name: "Events", value: counts.events, color: "#ee0979" },
    { name: "Accommodations", value: counts.accommodations, color: "#2193b0" },
    { name: "Guides", value: counts.guides, color: "#cc2b5e" },
  ];

  const pieData = [
    { name: "Destinations", value: counts.destinations, color: "#11998e" },
    { name: "Events", value: counts.events, color: "#ee0979" },
    { name: "Accommodations", value: counts.accommodations, color: "#2193b0" },
    { name: "Guides", value: counts.guides, color: "#cc2b5e" },
  ];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2
            className="fw-bold mb-1"
            style={{
              fontFamily: "Poppins, serif",
              fontSize: "2.2rem",
              color: darkMode ? "#4ade80" : "#1a5f4a",
            }}
          >
            🌿 Dashboard
          </h2>
          <p
            style={{
              fontSize: "0.95rem",
              color: darkMode ? "#ffffff" : "#1a5f4a",
              marginBottom: 0,
            }}
          >
            Welcome to Calbayog Tourism Admin Panel
          </p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "0.85rem",
                color: darkMode ? "#b0b0c0" : "#6c757d",
                fontWeight: 500,
              }}
            >
              Current Date
            </div>
            <div
              style={{
                fontWeight: 600,
                fontSize: "1.1rem",
                color: darkMode ? "#e0e0e0" : "#212529",
              }}
            >
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
          <div className="d-flex gap-2">
            <button
              onClick={toggleDarkMode}
              style={{
                background: darkMode ? "#2a2a3e" : "#f8f9fa",
                border: "1px solid " + (darkMode ? "#3a3a4e" : "#e9ecef"),
                color: darkMode ? "#e0e0e0" : "#333",
                padding: "10px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "1.2rem",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = darkMode
                  ? "#3a3a4e"
                  : "#e9ecef")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = darkMode
                  ? "#2a2a3e"
                  : "#f8f9fa")
              }
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
            <NotificationBanner />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner
            animation="border"
            style={{ color: darkMode ? "#4ade80" : "#1a5f4a" }}
          />
          <p
            className="text-muted mt-3"
            style={{ color: darkMode ? "#b0b0c0" : "#6c757d" }}
          >
            Loading dashboard...
          </p>
        </div>
      ) : (
        <>
          {/* Welcome Banner */}
          <Card
            className="border-0 mb-4"
            style={{
              borderRadius: "16px",
              background: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
              color: "#fff",
              boxShadow: darkMode
                ? "0 8px 24px rgba(0,0,0,0.3)"
                : "0 8px 24px rgba(26, 95, 74, 0.25)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-50%",
                right: "-10%",
                width: "300px",
                height: "300px",
                background: "rgba(255,255,255,0.1)",
                borderRadius: "50%",
              }}
            />
            <Card.Body
              className="p-4"
              style={{ position: "relative", zIndex: 1 }}
            >
              <h3 className="fw-bold mb-2" style={{ fontSize: "1.5rem" }}>
                Welcome back, Admin! 👋
              </h3>
              <p style={{ fontSize: "0.95rem", opacity: 0.9, marginBottom: 0 }}>
                You have {pendingItems} pending actions and {totalItems} total
                content items. Keep up the great work managing Calbayog Tourism!
              </p>
            </Card.Body>
          </Card>

          {/* Overview Cards */}
          <Row className="g-3 mb-4">
            <Col xs={6} md={3}>
              <Link to="/admin" style={{ textDecoration: "none" }}>
                <Card
                  className="border-0 h-100"
                  style={{
                    borderRadius: "16px",
                    background:
                      "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
                    color: "#fff",
                    boxShadow: darkMode
                      ? "0 8px 24px rgba(0,0,0,0.3)"
                      : "0 8px 24px rgba(26, 95, 74, 0.25)",
                    cursor: "pointer",
                    transition: "transform 0.3s, box-shadow 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = darkMode
                      ? "0 12px 32px rgba(0,0,0,0.4)"
                      : "0 12px 32px rgba(26, 95, 74, 0.35)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = darkMode
                      ? "0 8px 24px rgba(0,0,0,0.3)"
                      : "0 8px 24px rgba(26, 95, 74, 0.25)";
                  }}
                >
                  <Card.Body className="py-4">
                    <div
                      style={{
                        fontSize: "0.85rem",
                        opacity: 0.9,
                        marginBottom: 4,
                        fontWeight: 500,
                      }}
                    >
                      Total Content
                    </div>
                    <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
                      {totalItems}
                    </div>
                    <div
                      style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: 4 }}
                    >
                      All listings across platform
                    </div>
                  </Card.Body>
                </Card>
              </Link>
            </Col>
            <Col xs={6} md={3}>
              <Link to="/admin/requests" style={{ textDecoration: "none" }}>
                <Card
                  className="border-0 h-100"
                  style={{
                    borderRadius: "16px",
                    background:
                      "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
                    color: "#fff",
                    boxShadow: darkMode
                      ? "0 8px 24px rgba(0,0,0,0.3)"
                      : "0 8px 24px rgba(231, 76, 60, 0.25)",
                    cursor: "pointer",
                    transition: "transform 0.3s, box-shadow 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = darkMode
                      ? "0 12px 32px rgba(0,0,0,0.4)"
                      : "0 12px 32px rgba(231, 76, 60, 0.35)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = darkMode
                      ? "0 8px 24px rgba(0,0,0,0.3)"
                      : "0 8px 24px rgba(231, 76, 60, 0.25)";
                  }}
                >
                  <Card.Body className="py-4">
                    <div
                      style={{
                        fontSize: "0.85rem",
                        opacity: 0.9,
                        marginBottom: 4,
                        fontWeight: 500,
                      }}
                    >
                      Pending Actions
                    </div>
                    <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
                      {pendingItems}
                    </div>
                    <div
                      style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: 4 }}
                    >
                      Requests awaiting review
                    </div>
                  </Card.Body>
                </Card>
              </Link>
            </Col>
            <Col xs={6} md={3}>
              <Link to="/admin/destinations" style={{ textDecoration: "none" }}>
                <Card
                  className="border-0 h-100"
                  style={{
                    borderRadius: "16px",
                    background:
                      "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",
                    color: "#fff",
                    boxShadow: darkMode
                      ? "0 8px 24px rgba(0,0,0,0.3)"
                      : "0 8px 24px rgba(74, 222, 128, 0.25)",
                    cursor: "pointer",
                    transition: "transform 0.3s, box-shadow 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = darkMode
                      ? "0 12px 32px rgba(0,0,0,0.4)"
                      : "0 12px 32px rgba(74, 222, 128, 0.35)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = darkMode
                      ? "0 8px 24px rgba(0,0,0,0.3)"
                      : "0 8px 24px rgba(74, 222, 128, 0.25)";
                  }}
                >
                  <Card.Body className="py-4">
                    <div
                      style={{
                        fontSize: "0.85rem",
                        opacity: 0.9,
                        marginBottom: 4,
                        fontWeight: 500,
                      }}
                    >
                      Featured
                    </div>
                    <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
                      {counts.destinations}
                    </div>
                    <div
                      style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: 4 }}
                    >
                      Highlighted destinations
                    </div>
                  </Card.Body>
                </Card>
              </Link>
            </Col>
            <Col xs={6} md={3}>
              <Link to="/admin/guides" style={{ textDecoration: "none" }}>
                <Card
                  className="border-0 h-100"
                  style={{
                    borderRadius: "16px",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "#fff",
                    boxShadow: darkMode
                      ? "0 8px 24px rgba(0,0,0,0.3)"
                      : "0 8px 24px rgba(102, 126, 234, 0.25)",
                    cursor: "pointer",
                    transition: "transform 0.3s, box-shadow 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = darkMode
                      ? "0 12px 32px rgba(0,0,0,0.4)"
                      : "0 12px 32px rgba(102, 126, 234, 0.35)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = darkMode
                      ? "0 8px 24px rgba(0,0,0,0.3)"
                      : "0 8px 24px rgba(102, 126, 234, 0.25)";
                  }}
                >
                  <Card.Body className="py-4">
                    <div
                      style={{
                        fontSize: "0.85rem",
                        opacity: 0.9,
                        marginBottom: 4,
                        fontWeight: 500,
                      }}
                    >
                      Active Guides
                    </div>
                    <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
                      {counts.guides}
                    </div>
                    <div
                      style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: 4 }}
                    >
                      Registered tour guides
                    </div>
                  </Card.Body>
                </Card>
              </Link>
            </Col>
          </Row>

          {/* Content Distribution Chart */}
          <Row className="g-3 mb-4">
            <Col md={8}>
              <Card
                className="border-0"
                style={{
                  borderRadius: "16px",
                  boxShadow: darkMode
                    ? "0 4px 16px rgba(0,0,0,0.3)"
                    : "0 4px 16px rgba(0,0,0,0.08)",
                  background: darkMode ? "#1e1e2e" : "#fff",
                }}
              >
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5
                      className="fw-bold mb-0"
                      style={{
                        fontSize: "1.1rem",
                        color: darkMode ? "#e0e0e0" : "#495057",
                      }}
                    >
                      Content Distribution
                    </h5>
                    <Badge
                      style={{
                        background: "linear-gradient(135deg, #1a5f4a, #0d3d2e)",
                        border: "none",
                      }}
                    >
                      {totalItems} Total Items
                    </Badge>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={barData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={darkMode ? "#2a2a3e" : "#e9ecef"}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{
                          fontSize: 12,
                          fill: darkMode ? "#b0b0c0" : "#6c757d",
                        }}
                        axisLine={{ stroke: darkMode ? "#2a2a3e" : "#e9ecef" }}
                        tickLine={{ stroke: darkMode ? "#2a2a3e" : "#e9ecef" }}
                      />
                      <YAxis
                        tick={{
                          fontSize: 12,
                          fill: darkMode ? "#b0b0c0" : "#6c757d",
                        }}
                        axisLine={{ stroke: darkMode ? "#2a2a3e" : "#e9ecef" }}
                        tickLine={{ stroke: darkMode ? "#2a2a3e" : "#e9ecef" }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          fontSize: "13px",
                          background: darkMode ? "#2a2a3e" : "#fff",
                          color: darkMode ? "#e0e0e0" : "#333",
                        }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {barData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card
                className="border-0 h-100"
                style={{
                  borderRadius: "16px",
                  boxShadow: darkMode
                    ? "0 4px 16px rgba(0,0,0,0.3)"
                    : "0 4px 16px rgba(0,0,0,0.08)",
                  background: darkMode ? "#1e1e2e" : "#fff",
                }}
              >
                <Card.Body className="p-4">
                  <h5
                    className="fw-bold mb-4"
                    style={{
                      fontSize: "1.1rem",
                      color: darkMode ? "#e0e0e0" : "#495057",
                    }}
                  >
                    Content Breakdown
                  </h5>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          fontSize: "13px",
                          background: darkMode ? "#2a2a3e" : "#fff",
                          color: darkMode ? "#e0e0e0" : "#333",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-3">
                    {pieData.map((item) => (
                      <div
                        key={item.name}
                        className="d-flex align-items-center justify-content-between mb-2"
                      >
                        <div className="d-flex align-items-center">
                          <div
                            style={{
                              width: "12px",
                              height: "12px",
                              borderRadius: "3px",
                              background: item.color,
                              marginRight: "8px",
                            }}
                          />
                          <span
                            style={{
                              fontSize: "0.85rem",
                              color: darkMode ? "#e0e0e0" : "#495057",
                            }}
                          >
                            {item.name}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            color: darkMode ? "#e0e0e0" : "#212529",
                          }}
                        >
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Quick Actions */}
          <h5
            className="fw-bold mb-3"
            style={{
              fontSize: "1.1rem",
              color: darkMode ? "#e0e0e0" : "#495057",
            }}
          >
            Quick Actions
          </h5>
          <Row className="g-3">
            {[
              {
                to: "/admin/destinations",
                label: "Add Destination",
                icon: "🌿",
                gradient: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
                desc: "Create new destination",
                subtitle: "Manage all tourist destinations",
              },
              {
                to: "/admin/events",
                label: "Add Event",
                icon: "🎉",
                gradient: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
                desc: "Schedule new event",
                subtitle: "",
              },
              {
                to: "/admin/accommodations",
                label: "Add Accommodation",
                icon: "🏨",
                gradient: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",
                desc: "List new hotel/resort",
                subtitle: "",
              },
              {
                to: "/admin/guides",
                label: "Add Guide",
                icon: "🧭",
                gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                desc: "Register tour guide",
                subtitle: "",
              },
            ].map((item) => (
              <Col xs={6} md={3} key={item.to}>
                <Link to={item.to} style={{ textDecoration: "none" }}>
                  <Card
                    className="border-0 h-100 text-center py-4"
                    style={{
                      borderRadius: "12px",
                      background: item.gradient,
                      color: "#fff",
                      boxShadow: darkMode
                        ? "0 4px 12px rgba(0,0,0,0.3)"
                        : "0 4px 12px rgba(0,0,0,0.1)",
                      cursor: "pointer",
                      transition: "transform 0.3s, box-shadow 0.3s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = darkMode
                        ? "0 8px 20px rgba(0,0,0,0.4)"
                        : "0 8px 20px rgba(0,0,0,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = darkMode
                        ? "0 4px 12px rgba(0,0,0,0.3)"
                        : "0 4px 12px rgba(0,0,0,0.1)";
                    }}
                  >
                    <div style={{ fontSize: "2rem", marginBottom: 8 }}>
                      {item.icon}
                    </div>
                    <p
                      className="mb-0 fw-semibold"
                      style={{ fontSize: "0.9rem", color: "#fff" }}
                    >
                      {item.label}
                    </p>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        opacity: 0.8,
                        marginTop: 4,
                        marginBottom: 0,
                      }}
                    >
                      {item.desc}
                    </p>
                    {item.subtitle && (
                      <p
                        style={{
                          fontSize: "0.7rem",
                          opacity: 0.7,
                          marginTop: 2,
                          marginBottom: 0,
                        }}
                      >
                        {item.subtitle}
                      </p>
                    )}
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
