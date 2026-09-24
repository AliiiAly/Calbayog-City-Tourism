import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Row,
  Col,
  Card,
  Spinner,
  Badge,
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

import {
  ArrowRight,
  Calendar,
  Compass,
  FileText,
  Hotel,
  LayoutGrid,
  Leaf,
  MessageSquare,
  UsersRound,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";

import {
  getAttractions,
  getEvents,
  getAccommodations,
  getGuides,
  getItineraryRequests,
} from "../../services/api";

import { useDarkMode } from "../../context/DarkModeContext";

/* =========================================================
   TYPES
========================================================= */

interface Counts {
  attractions: number;
  events: number;
  accommodations: number;
  guides: number;
  requests: number;
}

/* =========================================================
   PAGE STYLES
========================================================= */

const CALBAYOG_BLUE = "#2D3195";
const ADMIN_YELLOW = "#FFB71B";

const ADMIN_DASHBOARD_STYLES = `
  @font-face {
    font-family: "Barabara";
    src: url("/fonts/BARABARA-final.otf") format("opentype");
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  .admin-dashboard-page {
    --admin-primary: #2D3195;
    --admin-primary-dark: #242879;
    --admin-yellow: #FFB71B;
    --admin-surface: #FFFFFF;
    --admin-border: #E8EAF1;
    --admin-text: #1B1D24;
    --admin-muted: #737886;

    min-height: 100vh;
    width: 100%;
    max-width: 1440px;
    margin: 0 auto;
    padding: 0 0 56px;
    background: transparent;
    color: var(--admin-text);
    font-family: "Nunito", "Poppins", "Segoe UI", sans-serif;
  }

  .admin-dashboard-page *, .admin-dashboard-page *::before, .admin-dashboard-page *::after { box-sizing: border-box; }

  .admin-dash-heading { align-items: flex-end !important; gap: 12px; margin: 0 0 22px !important; }
  .admin-dash-eyebrow-row { display:flex; align-items:center; gap:9px; margin-bottom:5px; }
  .admin-dash-eyebrow-icon { width:34px; height:34px; border-radius:9px; background:#eef0ff; color:#2D3195; display:flex; align-items:center; justify-content:center; }
  .admin-dash-title { margin:0 !important; color: var(--admin-primary) !important; font-family:"Barabara",sans-serif !important; font-size: clamp(1.5rem, 2.4vw, 1.9rem) !important; font-weight:400 !important; letter-spacing: .01em; }
  .admin-dash-subtitle { margin: 4px 0 0 43px !important; color: var(--admin-muted) !important; font-size: .8rem !important; font-weight: 600 !important; }
  .admin-dash-date { display:flex; align-items:center; gap:7px; color: var(--admin-muted); font-size:.76rem; font-weight:700; }

  .admin-dash-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:360px; }
  .admin-dash-loading-icon { width:52px; height:52px; border-radius:50%; background:#eef0ff; display:flex; align-items:center; justify-content:center; margin-bottom:14px; }
  .admin-dash-loading-title { font-size:.84rem; font-weight:700; color: var(--admin-text); }
  .admin-dash-loading-sub { font-size:.72rem; margin-top:4px; color: var(--admin-muted); }

  .admin-dash-welcome {
    border:0; border-radius:16px; overflow:hidden; position:relative; margin-bottom:22px;
    background: linear-gradient(135deg, #2D3195 0%, #242879 100%); color:#fff;
    box-shadow: 0 10px 28px rgba(45,49,149,.20);
  }
  .admin-dash-welcome::before { content:""; position:absolute; width:180px; height:180px; border-radius:50%; right:-60px; top:-85px; border:1px solid rgba(255,255,255,.12); }
  .admin-dash-welcome::after { content:""; position:absolute; width:120px; height:120px; border-radius:50%; right:75px; bottom:-80px; border:1px solid rgba(255,255,255,.09); }
  .admin-dash-welcome-kicker { font-size:.66rem; text-transform:uppercase; letter-spacing:.14em; opacity:.75; font-weight:800; margin-bottom:6px; }
  .admin-dash-welcome-title { font-family:"Poppins",sans-serif; font-size:1.25rem; font-weight:800; margin-bottom:8px; }
  .admin-dash-welcome-text { font-size:.8rem; line-height:1.6; opacity:.9; max-width:700px; margin:0; }
  .admin-dash-welcome-chip { display:flex; align-items:center; gap:8px; padding:9px 13px; border-radius:11px; background:rgba(255,255,255,.14); border:1px solid rgba(255,255,255,.16); width:fit-content; font-size:.7rem; font-weight:800; }

  .admin-dash-stats .admin-stat-card {
    position:relative; min-height:118px; overflow:hidden; border:1px solid var(--admin-border) !important; border-radius:15px !important;
    background: var(--admin-surface) !important; box-shadow: 0 7px 24px rgba(26,30,53,.055) !important;
    transition: transform .25s ease, box-shadow .25s ease;
  }
  .admin-dash-stats .admin-stat-card::before { content:""; position:absolute; left:0; top:0; bottom:0; width:4px; background: var(--admin-primary); }
  .admin-dash-stats > .col:nth-child(2) .admin-stat-card::before { background: var(--admin-yellow); }
  .admin-dash-stats > .col:nth-child(3) .admin-stat-card::before { background: #0077b6; }
  .admin-dash-stats > .col:nth-child(4) .admin-stat-card::before { background: #5b8c6a; }
  .admin-dash-stats .admin-stat-card:hover { transform: translateY(-3px); box-shadow: 0 14px 30px rgba(26,30,53,.10) !important; }
  .admin-dash-stat-top { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
  .admin-dash-stat-label { font-size:.66rem; font-weight:900; letter-spacing:.05em; text-transform:uppercase; color: var(--admin-muted); margin-bottom:6px; }
  .admin-dash-stat-value { font-family:"Poppins",sans-serif; font-size:1.7rem; font-weight:800; line-height:1; color: var(--admin-text); }
  .admin-dash-stat-icon { width:38px; height:38px; min-width:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; }
  .admin-dash-stat-footer { display:flex; align-items:center; justify-content:space-between; margin-top:15px; padding-top:11px; border-top:1px solid #EEF0F4; }
  .admin-dash-stat-desc { font-size:.66rem; color: var(--admin-muted); font-weight:600; }
  .admin-dash-stat-arrow { display:flex; transition: transform .2s ease; }
  .admin-dash-stat-card:hover .admin-dash-stat-arrow { transform: translateX(3px); }

  .admin-dash-alert {
    border-radius:13px; padding:13px 15px; margin-bottom:18px;
    background:#fff8e9; border:1px solid #f7e4b8; color:#795b19;
    transition: transform .2s ease, box-shadow .2s ease;
  }
  .admin-dash-alert:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,.06); }
  .admin-dash-alert-icon { width:34px; height:34px; min-width:34px; border-radius:9px; background:#fff0c7; color:#8e6200; display:flex; align-items:center; justify-content:center; }
  .admin-dash-alert-title { font-size:.78rem; font-weight:800; margin-bottom:2px; }
  .admin-dash-alert-sub { font-size:.7rem; opacity:.8; }

  .admin-dash-panel { border:1px solid var(--admin-border) !important; border-radius:15px !important; background: var(--admin-surface) !important; box-shadow: 0 7px 24px rgba(26,30,53,.055) !important; }
  .admin-dash-panel-title { font-family:"Poppins",sans-serif; font-size:.94rem; font-weight:800; color: var(--admin-text); margin-bottom:2px; }
  .admin-dash-panel-sub { font-size:.7rem; color: var(--admin-muted); font-weight:600; }
  .admin-dash-total-pill { background:#eef0ff; color:#2D3195; border-radius:8px; padding:6px 10px; font-size:.62rem; font-weight:900; }

  .admin-dash-legend-row { display:flex; align-items:center; justify-content:space-between; padding:7px 0; border-bottom:1px solid #F1F3F1; font-size:.7rem; }
  .admin-dash-legend-dot { width:8px; height:8px; border-radius:3px; }
  .admin-dash-legend-label { color: var(--admin-muted); font-weight:600; }
  .admin-dash-legend-pct { color: var(--admin-muted); font-size:.66rem; margin-right:8px; }
  .admin-dash-legend-value { font-weight:800; color: var(--admin-text); }

  .admin-dash-progress-track { height:6px; border-radius:10px; background: #EDF1EE; overflow:hidden; }
  .admin-dash-progress-fill { height:100%; border-radius:10px; transition: width .7s ease; }
  .admin-dash-progress-caption { font-size:.62rem; color: var(--admin-muted); margin-top:5px; }
  .admin-dash-progress-label { font-size:.72rem; font-weight:700; color: var(--admin-muted); }
  .admin-dash-progress-value { font-size:.72rem; font-weight:800; color: var(--admin-text); }

  .admin-dash-actions-heading { font-family:"Poppins",sans-serif; font-size:.94rem; font-weight:800; margin-bottom:2px; color: var(--admin-text); }
  .admin-dash-actions-sub { font-size:.7rem; color: var(--admin-muted); font-weight:600; }

  .admin-dash-quick-card { border:1px solid var(--admin-border) !important; border-radius:14px !important; background: var(--admin-surface) !important; box-shadow: 0 4px 14px rgba(26,30,53,.05) !important; transition: transform .25s ease, box-shadow .25s ease; }
  .admin-dash-quick-card:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(26,30,53,.09) !important; }
  .admin-dash-quick-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; margin-bottom:13px; }
  .admin-dash-quick-title { font-size:.88rem; font-weight:800; margin-bottom:4px; color: var(--admin-text); }
  .admin-dash-quick-desc { font-size:.72rem; color: var(--admin-muted); line-height:1.45; }
  .admin-dash-quick-manage { display:flex; align-items:center; gap:5px; margin-top:14px; font-size:.68rem; font-weight:800; }

  .admin-dash-summary-card { border:1px solid var(--admin-border) !important; border-radius:13px !important; background: var(--admin-surface) !important; box-shadow: 0 4px 14px rgba(26,30,53,.05) !important; transition: transform .2s ease; }
  .admin-dash-summary-card:hover { transform: translateY(-2px); }
  .admin-dash-summary-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; }
  .admin-dash-summary-title { font-size:.78rem; font-weight:800; color: var(--admin-text); }
  .admin-dash-summary-sub { font-size:.68rem; color: var(--admin-muted); margin-top:3px; }

  .admin-dashboard-dark { --admin-surface:#191C2B; --admin-border:#2B3042; --admin-text:#F1F3F8; --admin-muted:#A8AFBF; }
  .admin-dashboard-dark .admin-dash-stats .admin-stat-card,
  .admin-dashboard-dark .admin-dash-panel,
  .admin-dashboard-dark .admin-dash-quick-card,
  .admin-dashboard-dark .admin-dash-summary-card { background:#191C2B !important; border-color:#2B3042 !important; }
  .admin-dashboard-dark .admin-dash-eyebrow-icon { background:#262B46; color:#AEB4FF; }
  .admin-dashboard-dark .admin-dash-alert { background:#302817; border-color:#4d3d20; color:#e9d9ad; }
  .admin-dashboard-dark .admin-dash-alert-icon { background:#4d3d20; }
  .admin-dashboard-dark .admin-dash-total-pill { background:#262B46; color:#AEB4FF; }
  .admin-dashboard-dark .admin-dash-legend-row { border-color: rgba(255,255,255,.06); }
  .admin-dashboard-dark .admin-dash-progress-track { background:#2b3042; }
`;

/* =========================================================
   STAT CARD
========================================================= */

const StatCard: React.FC<{
  label: string;
  count: number;
  icon: React.ReactNode;
  to: string;
  description: string;
  accent: string;
}> = ({ label, count, icon, to, description, accent }) => (
  <Link to={to} style={{ textDecoration: "none", display: "block", height: "100%" }}>
    <Card className="border-0 h-100 admin-stat-card">
      <Card.Body className="p-3 p-md-4">
        <div className="admin-dash-stat-top">
          <div>
            <div className="admin-dash-stat-label">{label}</div>
            <div className="admin-dash-stat-value">{count}</div>
          </div>

          <div
            className="admin-dash-stat-icon"
            style={{ background: `${accent}14`, color: accent }}
          >
            {icon}
          </div>
        </div>

        <div className="admin-dash-stat-footer">
          <span className="admin-dash-stat-desc">{description}</span>
          <span className="admin-dash-stat-arrow" style={{ color: accent }}>
            <ArrowRight size={16} strokeWidth={2.2} />
          </span>
        </div>
      </Card.Body>
    </Card>
  </Link>
);

/* =========================================================
   QUICK ACTION CARD
========================================================= */

const QuickActionCard: React.FC<{
  to: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
}> = ({ to, label, description, icon, accent }) => (
  <Link to={to} style={{ textDecoration: "none", display: "block", height: "100%" }}>
    <Card className="border-0 h-100 admin-dash-quick-card">
      <Card.Body className="p-3 p-md-4">
        <div
          className="admin-dash-quick-icon"
          style={{ background: `${accent}14`, color: accent }}
        >
          {icon}
        </div>

        <div className="admin-dash-quick-title">{label}</div>
        <div className="admin-dash-quick-desc">{description}</div>

        <div className="admin-dash-quick-manage" style={{ color: accent }}>
          Manage
          <ArrowRight size={14} strokeWidth={2.2} />
        </div>
      </Card.Body>
    </Card>
  </Link>
);

/* =========================================================
   DASHBOARD
========================================================= */

const AdminDashboard: React.FC = () => {
  const { darkMode } = useDarkMode();

  const [counts, setCounts] = useState<Counts>({
    attractions: 0,
    events: 0,
    accommodations: 0,
    guides: 0,
    requests: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAttractions(),
      getEvents(),
      getAccommodations(),
      getGuides(),
      getItineraryRequests(),
    ])
      .then(([a, e, ac, g, r]) => {
        setCounts({
          attractions: a.data.length,
          events: e.data.length,
          accommodations: ac.data.length,
          guides: g.data.length,
          requests: r.data.length,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalItems =
    counts.attractions +
    counts.events +
    counts.accommodations +
    counts.guides;

  const pendingItems = counts.requests;

  const getPercentage = (value: number) =>
    totalItems > 0 ? Math.round((value / totalItems) * 100) : 0;

  const barData = [
    { name: "Attractions", value: counts.attractions, color: CALBAYOG_BLUE },
    { name: "Events", value: counts.events, color: ADMIN_YELLOW },
    { name: "Accommodations", value: counts.accommodations, color: "#0077b6" },
    { name: "Guides", value: counts.guides, color: "#5b8c6a" },
  ];

  const pieData = barData;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const tooltipStyle = {
    borderRadius: "9px",
    border: darkMode ? "1px solid #344139" : "1px solid #e7ece8",
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
    fontSize: "12px",
    background: darkMode ? "#202a24" : "#ffffff",
    color: darkMode ? "#eef2ef" : "#303831",
  };

  return (
    <AdminLayout>
      <div className={`admin-dashboard-page ${darkMode ? "admin-dashboard-dark" : ""}`}>
        <style>{ADMIN_DASHBOARD_STYLES}</style>

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="admin-dash-heading d-flex flex-column flex-md-row justify-content-between align-items-md-end">
          <div>
            <div className="admin-dash-eyebrow-row">
              <div className="admin-dash-eyebrow-icon">
                <Leaf size={18} strokeWidth={2} />
              </div>
              <h2 className="admin-dash-title">Dashboard Overview</h2>
            </div>

            <p className="admin-dash-subtitle">
              Monitor and manage Calbayog City tourism content.
            </p>
          </div>

          <div className="admin-dash-date">
            <Calendar size={15} strokeWidth={2.1} />
            {today}
          </div>
        </div>

        {/* =====================================================
            LOADING
        ===================================================== */}

        {loading ? (
          <div className="admin-dash-loading">
            <div className="admin-dash-loading-icon">
              <Spinner animation="border" size="sm" style={{ color: CALBAYOG_BLUE }} />
            </div>
            <div className="admin-dash-loading-title">Loading dashboard...</div>
            <div className="admin-dash-loading-sub">Gathering tourism data</div>
          </div>
        ) : (
          <>
            {/* =================================================
                WELCOME / SUMMARY
            ================================================= */}

            <Card className="admin-dash-welcome">
              <Card.Body className="p-3 p-md-4" style={{ position: "relative", zIndex: 1 }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center" style={{ gap: "18px" }}>
                  <div>
                    <div className="admin-dash-welcome-kicker">Calbayog City Tourism</div>
                    <h3 className="admin-dash-welcome-title">Welcome back, Admin</h3>
                    <p className="admin-dash-welcome-text">
                      You currently have <strong>{totalItems}</strong> tourism content items
                      and <strong>{pendingItems}</strong> itinerary{" "}
                      {pendingItems === 1 ? "" : "s"} waiting for review.
                    </p>
                  </div>

                  <div className="admin-dash-welcome-chip">
                    <Leaf size={16} strokeWidth={2.1} />
                    Tourism Management
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* =================================================
                STAT CARDS
            ================================================= */}

            <Row className="g-3 mb-4 admin-dash-stats">
              <Col xs={6} lg={3}>
                <StatCard
                  label="Total Content"
                  count={totalItems}
                  icon={<LayoutGrid size={19} strokeWidth={2} />}
                  to="/admin"
                  description="All tourism listings"
                  accent={CALBAYOG_BLUE}
                />
              </Col>

              <Col xs={6} lg={3}>
                <StatCard
                  label="Pending Requests"
                  count={pendingItems}
                  icon={<FileText size={19} strokeWidth={2} />}
                  to="/admin/requests"
                  description="Awaiting review"
                  accent={ADMIN_YELLOW}
                />
              </Col>

              <Col xs={6} lg={3}>
                <StatCard
                  label="Attractions"
                  count={counts.attractions}
                  icon={<Compass size={19} strokeWidth={2} />}
                  to="/admin/attractions"
                  description="Tourist attractions"
                  accent="#0077b6"
                />
              </Col>

              <Col xs={6} lg={3}>
                <StatCard
                  label="Tour Guides"
                  count={counts.guides}
                  icon={<UsersRound size={19} strokeWidth={2} />}
                  to="/admin/guides"
                  description="Registered guides"
                  accent="#5b8c6a"
                />
              </Col>
            </Row>

            {/* =================================================
                REQUEST ALERT
            ================================================= */}

            {pendingItems > 0 && (
              <Link to="/admin/requests" style={{ textDecoration: "none", display: "block" }}>
                <div className="admin-dash-alert d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center" style={{ gap: "11px" }}>
                    <div className="admin-dash-alert-icon">
                      <FileText size={17} strokeWidth={2} />
                    </div>

                    <div>
                      <div className="admin-dash-alert-title">
                        {pendingItems} itinerary {pendingItems === 1 ? "request" : "requests"} need your attention
                      </div>
                      <div className="admin-dash-alert-sub">Review submitted requests from travelers.</div>
                    </div>
                  </div>

                  <ArrowRight size={17} strokeWidth={2.1} />
                </div>
              </Link>
            )}

            {/* =================================================
                CHARTS
            ================================================= */}

            <Row className="g-3 mb-4">
              <Col lg={8}>
                <Card className="border-0 h-100 admin-dash-panel">
                  <Card.Body className="p-3 p-md-4">
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-3" style={{ gap: "10px" }}>
                      <div>
                        <h5 className="admin-dash-panel-title">Content Distribution</h5>
                        <p className="admin-dash-panel-sub mb-0">Current tourism listings by category</p>
                      </div>

                      <span className="admin-dash-total-pill">{totalItems} TOTAL</span>
                    </div>

                    <ResponsiveContainer width="100%" height={270}>
                      <BarChart data={barData} margin={{ top: 5, right: 5, left: -18, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#2c3831" : "#edf0ed"} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: darkMode ? "#9aa59e" : "#78827c" }}
                          axisLine={{ stroke: darkMode ? "#2c3831" : "#edf0ed" }}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 11, fill: darkMode ? "#9aa59e" : "#78827c" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: darkMode ? "rgba(255,255,255,0.03)" : "rgba(45,49,149,0.03)" }}
                          contentStyle={tooltipStyle}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={42}>
                          {barData.map((entry, index) => (
                            <Cell key={`bar-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={4}>
                <Card className="border-0 h-100 admin-dash-panel">
                  <Card.Body className="p-3 p-md-4">
                    <h5 className="admin-dash-panel-title">Content Breakdown</h5>
                    <p className="admin-dash-panel-sub mb-2">Share of current content</p>

                    <div style={{ position: "relative", height: "185px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={73}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`pie-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>

                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          textAlign: "center",
                          pointerEvents: "none",
                        }}
                      >
                        <div style={{ fontSize: "1.35rem", fontWeight: 700, lineHeight: 1, color: darkMode ? "#eef2ef" : "#1d2520" }}>
                          {totalItems}
                        </div>
                        <div style={{ fontSize: "0.58rem", color: darkMode ? "#7e8982" : "#89928c", marginTop: "4px" }}>
                          ITEMS
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: "3px" }}>
                      {pieData.map((item) => (
                        <div key={item.name} className="admin-dash-legend-row">
                          <div className="d-flex align-items-center" style={{ gap: "8px" }}>
                            <div className="admin-dash-legend-dot" style={{ background: item.color }} />
                            <span className="admin-dash-legend-label">{item.name}</span>
                          </div>

                          <div className="d-flex align-items-center">
                            <span className="admin-dash-legend-pct">{getPercentage(item.value)}%</span>
                            <span className="admin-dash-legend-value">{item.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* =================================================
                CONTENT OVERVIEW
            ================================================= */}

            <Card className="border-0 mb-4 admin-dash-panel">
              <Card.Body className="p-3 p-md-4">
                <div className="mb-3">
                  <h5 className="admin-dash-panel-title">Content Overview</h5>
                  <p className="admin-dash-panel-sub mb-0">A quick look at your tourism content coverage.</p>
                </div>

                <Row className="g-3">
                  {barData.map((item) => (
                    <Col xs={12} sm={6} lg={3} key={item.name}>
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="admin-dash-progress-label">{item.name}</span>
                          <span className="admin-dash-progress-value">{item.value}</span>
                        </div>

                        <div className="admin-dash-progress-track">
                          <div
                            className="admin-dash-progress-fill"
                            style={{ width: `${getPercentage(item.value)}%`, background: item.color }}
                          />
                        </div>

                        <div className="admin-dash-progress-caption">
                          {getPercentage(item.value)}% of total content
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>

            {/* =================================================
                QUICK ACTIONS
            ================================================= */}

            <div className="mb-3">
              <div className="admin-dash-actions-heading">Quick Actions</div>
              <div className="admin-dash-actions-sub">Manage your tourism content.</div>
            </div>

            <Row className="g-3 mb-4">
              <Col xs={6} md={3}>
                <QuickActionCard
                  to="/admin/attractions"
                  label="Attractions"
                  description="Add and manage tourist attractions."
                  icon={<Compass size={19} strokeWidth={2} />}
                  accent={CALBAYOG_BLUE}
                />
              </Col>

              <Col xs={6} md={3}>
                <QuickActionCard
                  to="/admin/events"
                  label="Events"
                  description="Create and manage local events."
                  icon={<Calendar size={19} strokeWidth={2} />}
                  accent={ADMIN_YELLOW}
                />
              </Col>

              <Col xs={6} md={3}>
                <QuickActionCard
                  to="/admin/accommodations"
                  label="Accommodations"
                  description="Manage hotels, resorts and stays."
                  icon={<Hotel size={19} strokeWidth={2} />}
                  accent="#0077b6"
                />
              </Col>

              <Col xs={6} md={3}>
                <QuickActionCard
                  to="/admin/guides"
                  label="Tour Guides"
                  description="Manage registered tour guides."
                  icon={<UsersRound size={19} strokeWidth={2} />}
                  accent="#5b8c6a"
                />
              </Col>
            </Row>

            {/* =================================================
                BOTTOM SUMMARY
            ================================================= */}

            <Row className="g-3">
              <Col md={6}>
                <Link to="/admin/requests" style={{ textDecoration: "none", display: "block" }}>
                  <Card className="border-0 h-100 admin-dash-summary-card">
                    <Card.Body className="p-3 p-md-4 d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center" style={{ gap: "12px" }}>
                        <div className="admin-dash-summary-icon" style={{ background: "#fff5d9", color: "#8e6200" }}>
                          <FileText size={19} strokeWidth={2} />
                        </div>

                        <div>
                          <div className="admin-dash-summary-title">Itinerary Requests</div>
                          <div className="admin-dash-summary-sub">
                            {pendingItems > 0 ? `${pendingItems} waiting for review` : "No pending requests"}
                          </div>
                        </div>
                      </div>

                      <span style={{ color: "#8e6200", display: "flex" }}>
                        <ArrowRight size={17} strokeWidth={2.1} />
                      </span>
                    </Card.Body>
                  </Card>
                </Link>
              </Col>

              <Col md={6}>
                <Link to="/admin/feedback" style={{ textDecoration: "none", display: "block" }}>
                  <Card className="border-0 h-100 admin-dash-summary-card">
                    <Card.Body className="p-3 p-md-4 d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center" style={{ gap: "12px" }}>
                        <div className="admin-dash-summary-icon" style={{ background: "#eef0ff", color: "#2D3195" }}>
                          <MessageSquare size={19} strokeWidth={2} />
                        </div>

                        <div>
                          <div className="admin-dash-summary-title">Traveler Feedback</div>
                          <div className="admin-dash-summary-sub">Review traveler feedback and comments</div>
                        </div>
                      </div>

                      <span style={{ color: "#2D3195", display: "flex" }}>
                        <ArrowRight size={17} strokeWidth={2.1} />
                      </span>
                    </Card.Body>
                  </Card>
                </Link>
              </Col>
            </Row>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
