```tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Row, Col, Card, Spinner } from "react-bootstrap";

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
  Hotel,
  LayoutGrid,
  Leaf,
  Utensils,
  UsersRound,
  Video,
  UserCog,
  ShieldCheck,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";

import {
  getAttractions,
  getRestaurants,
  getEvents,
  getAccommodations,
  getGuides,
  getFeaturedVideos,
} from "../../services/api";

import { useDarkMode } from "../../context/DarkModeContext";

/* =========================================================
   TYPES
========================================================= */

interface Counts {
  attractions: number;
  restaurants: number;
  events: number;
  accommodations: number;
  guides: number;
  featuredVideos: number;
}

type ContentKey = keyof Counts;

interface ContentItem {
  name: string;
  value: number;
  color: string;
  key: ContentKey;
  route: string;
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

  .admin-dashboard-page *,
  .admin-dashboard-page *::before,
  .admin-dashboard-page *::after {
    box-sizing: border-box;
  }

  .admin-dash-heading {
    align-items: flex-end !important;
    gap: 12px;
    margin: 0 0 22px !important;
  }

  .admin-dash-eyebrow-row {
    display: flex;
    align-items: center;
    margin-bottom: 5px;
  }

  .admin-dash-title {
    margin: 0 !important;
    color: var(--admin-primary) !important;
    font-family: "Barabara", sans-serif !important;
    font-size: clamp(1.5rem, 2.4vw, 1.9rem) !important;
    font-weight: 400 !important;
    letter-spacing: .01em;
  }

  .admin-dash-subtitle {
    margin: 4px 0 0 !important;
    color: var(--admin-muted) !important;
    font-size: .8rem !important;
    font-weight: 600 !important;
  }

  .admin-dash-date {
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--admin-muted);
    font-size: .76rem;
    font-weight: 700;
  }

  .admin-dash-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 360px;
  }

  .admin-dash-loading-icon {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: #eef0ff;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 14px;
  }

  .admin-dash-loading-title {
    font-size: .84rem;
    font-weight: 700;
    color: var(--admin-text);
  }

  .admin-dash-loading-sub {
    font-size: .72rem;
    margin-top: 4px;
    color: var(--admin-muted);
  }

  .admin-dash-welcome {
    border: 0;
    border-radius: 16px;
    overflow: hidden;
    position: relative;
    margin-bottom: 22px;
    background: linear-gradient(135deg, #2D3195 0%, #242879 100%);
    color: #fff;
    box-shadow: 0 10px 28px rgba(45,49,149,.20);
  }

  .admin-dash-welcome::before {
    content: "";
    position: absolute;
    width: 180px;
    height: 180px;
    border-radius: 50%;
    right: -60px;
    top: -85px;
    border: 1px solid rgba(255,255,255,.12);
  }

  .admin-dash-welcome::after {
    content: "";
    position: absolute;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    right: 75px;
    bottom: -80px;
    border: 1px solid rgba(255,255,255,.09);
  }

  .admin-dash-welcome-kicker {
    font-size: .66rem;
    text-transform: uppercase;
    letter-spacing: .14em;
    opacity: .75;
    font-weight: 800;
    margin-bottom: 6px;
  }

  .admin-dash-welcome-title {
    font-family: "Poppins", sans-serif;
    font-size: 1.25rem;
    font-weight: 800;
    margin-bottom: 8px;
  }

  .admin-dash-welcome-text {
    font-size: .8rem;
    line-height: 1.6;
    opacity: .9;
    max-width: 700px;
    margin: 0;
  }

  .admin-dash-welcome-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 13px;
    border-radius: 11px;
    background: rgba(255,255,255,.14);
    border: 1px solid rgba(255,255,255,.16);
    width: fit-content;
    font-size: .7rem;
    font-weight: 800;
  }

  .admin-dash-stats .admin-stat-card {
    position: relative;
    min-height: 118px;
    overflow: hidden;
    border: 1px solid var(--admin-border) !important;
    border-radius: 15px !important;
    background: var(--admin-surface) !important;
    box-shadow: 0 7px 24px rgba(26,30,53,.055) !important;
    transition: transform .25s ease, box-shadow .25s ease;
  }

  .admin-dash-stats .admin-stat-card::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: var(--admin-primary);
  }

  .admin-dash-stats > .col:nth-child(2) .admin-stat-card::before {
    background: var(--admin-yellow);
  }

  .admin-dash-stats > .col:nth-child(3) .admin-stat-card::before {
    background: #0077b6;
  }

  .admin-dash-stats > .col:nth-child(4) .admin-stat-card::before {
    background: #5b8c6a;
  }

  .admin-dash-stats .admin-stat-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 30px rgba(26,30,53,.10) !important;
  }

  .admin-dash-stat-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
  }

  .admin-dash-stat-label {
    font-size: .66rem;
    font-weight: 900;
    letter-spacing: .05em;
    text-transform: uppercase;
    color: var(--admin-muted);
    margin-bottom: 6px;
  }

  .admin-dash-stat-value {
    font-family: "Poppins", sans-serif;
    font-size: 1.7rem;
    font-weight: 800;
    line-height: 1;
    color: var(--admin-text);
  }

  .admin-dash-stat-icon {
    width: 38px;
    height: 38px;
    min-width: 38px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .admin-dash-stat-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 15px;
    padding-top: 11px;
    border-top: 1px solid #EEF0F4;
  }

  .admin-dash-stat-desc {
    font-size: .66rem;
    color: var(--admin-muted);
    font-weight: 600;
  }

  .admin-dash-stat-arrow {
    display: flex;
    transition: transform .2s ease;
  }

  .admin-stat-card:hover .admin-dash-stat-arrow {
    transform: translateX(3px);
  }

  .admin-dash-panel {
    border: 1px solid var(--admin-border) !important;
    border-radius: 15px !important;
    background: var(--admin-surface) !important;
    box-shadow: 0 7px 24px rgba(26,30,53,.055) !important;
  }

  .admin-dash-panel-title {
    font-family: "Poppins", sans-serif;
    font-size: .94rem;
    font-weight: 800;
    color: var(--admin-text);
    margin-bottom: 2px;
  }

  .admin-dash-panel-sub {
    font-size: .7rem;
    color: var(--admin-muted);
    font-weight: 600;
  }

  .admin-dash-total-pill {
    background: #eef0ff;
    color: #2D3195;
    border-radius: 8px;
    padding: 6px 10px;
    font-size: .62rem;
    font-weight: 900;
    white-space: nowrap;
  }

  .admin-dash-legend-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 7px 0;
    border-bottom: 1px solid #F1F3F1;
    font-size: .7rem;
  }

  .admin-dash-legend-row:last-child {
    border-bottom: 0;
  }

  .admin-dash-legend-dot {
    width: 8px;
    height: 8px;
    min-width: 8px;
    border-radius: 3px;
  }

  .admin-dash-legend-label {
    color: var(--admin-muted);
    font-weight: 600;
  }

  .admin-dash-legend-pct {
    color: var(--admin-muted);
    font-size: .66rem;
    margin-right: 8px;
  }

  .admin-dash-legend-value {
    font-weight: 800;
    color: var(--admin-text);
  }

  .admin-dash-progress-track {
    height: 6px;
    border-radius: 10px;
    background: #EDF1EE;
    overflow: hidden;
  }

  .admin-dash-progress-fill {
    height: 100%;
    border-radius: 10px;
    transition: width .7s ease;
  }

  .admin-dash-progress-caption {
    font-size: .62rem;
    color: var(--admin-muted);
    margin-top: 5px;
  }

  .admin-dash-progress-label {
    font-size: .72rem;
    font-weight: 700;
    color: var(--admin-muted);
  }

  .admin-dash-progress-value {
    font-size: .72rem;
    font-weight: 800;
    color: var(--admin-text);
  }

  .admin-dash-actions-heading {
    font-family: "Poppins", sans-serif;
    font-size: .94rem;
    font-weight: 800;
    margin-bottom: 2px;
    color: var(--admin-text);
  }

  .admin-dash-actions-sub {
    font-size: .7rem;
    color: var(--admin-muted);
    font-weight: 600;
  }

  .admin-dash-quick-card {
    border: 1px solid var(--admin-border) !important;
    border-radius: 14px !important;
    background: var(--admin-surface) !important;
    box-shadow: 0 4px 14px rgba(26,30,53,.05) !important;
    transition: transform .25s ease, box-shadow .25s ease;
  }

  .admin-dash-quick-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 24px rgba(26,30,53,.09) !important;
  }

  .admin-dash-quick-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 13px;
  }

  .admin-dash-quick-title {
    font-size: .88rem;
    font-weight: 800;
    margin-bottom: 4px;
    color: var(--admin-text);
  }

  .admin-dash-quick-desc {
    font-size: .72rem;
    color: var(--admin-muted);
    line-height: 1.45;
  }

  .admin-dash-quick-manage {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 14px;
    font-size: .68rem;
    font-weight: 800;
  }

  .admin-dash-load-warning {
    border: 1px solid #f0d58a;
    background: #fff8e9;
    color: #795b19;
    border-radius: 10px;
    padding: 12px 14px;
    font-size: .76rem;
    margin-bottom: 18px;
  }

  .admin-dashboard-dark {
    --admin-surface: #191C2B;
    --admin-border: #2B3042;
    --admin-text: #F1F3F8;
    --admin-muted: #A8AFBF;
  }

  .admin-dashboard-dark .admin-dash-stats .admin-stat-card,
  .admin-dashboard-dark .admin-dash-panel,
  .admin-dashboard-dark .admin-dash-quick-card {
    background: #191C2B !important;
    border-color: #2B3042 !important;
  }

  .admin-dashboard-dark .admin-dash-total-pill {
    background: #262B46;
    color: #AEB4FF;
  }

  .admin-dashboard-dark .admin-dash-legend-row {
    border-color: rgba(255,255,255,.06);
  }

  .admin-dashboard-dark .admin-dash-progress-track {
    background: #2b3042;
  }

  .admin-dashboard-dark .admin-dash-load-warning {
    background: #302817;
    border-color: #4d3d20;
    color: #e9d9ad;
  }
`;

/* =========================================================
   API RESPONSE NORMALIZER

   The API service returns a mixture of:
   - { data: [] }
   - Axios responses containing { data: [] }
   - { data: { data: [] } }

   Normalize these formats before counting records.
========================================================= */

const getRecords = (response: any): any[] => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  return [];
};

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
  <Link
    to={to}
    style={{
      textDecoration: "none",
      display: "block",
      height: "100%",
    }}
  >
    <Card className="border-0 h-100 admin-stat-card">
      <Card.Body className="p-3 p-md-4">
        <div className="admin-dash-stat-top">
          <div>
            <div className="admin-dash-stat-label">{label}</div>
            <div className="admin-dash-stat-value">{count}</div>
          </div>

          <div
            className="admin-dash-stat-icon"
            style={{
              background: `${accent}14`,
              color: accent,
            }}
          >
            {icon}
          </div>
        </div>

        <div className="admin-dash-stat-footer">
          <span className="admin-dash-stat-desc">{description}</span>

          <span
            className="admin-dash-stat-arrow"
            style={{ color: accent }}
          >
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
  <Link
    to={to}
    style={{
      textDecoration: "none",
      display: "block",
      height: "100%",
    }}
  >
    <Card className="border-0 h-100 admin-dash-quick-card">
      <Card.Body className="p-3 p-md-4">
        <div
          className="admin-dash-quick-icon"
          style={{
            background: `${accent}14`,
            color: accent,
          }}
        >
          {icon}
        </div>

        <div className="admin-dash-quick-title">{label}</div>
        <div className="admin-dash-quick-desc">{description}</div>

        <div
          className="admin-dash-quick-manage"
          style={{ color: accent }}
        >
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
    restaurants: 0,
    events: 0,
    accommodations: 0,
    guides: 0,
    featuredVideos: 0,
  });

  const [loading, setLoading] = useState(true);
  const [loadWarning, setLoadWarning] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setLoadWarning("");

      const results = await Promise.allSettled([
        getAttractions(),
        getRestaurants(),
        getEvents(),
        getAccommodations(),
        getGuides(),
        getFeaturedVideos(),
      ]);

      if (!isMounted) return;

      const nextCounts: Counts = {
        attractions: 0,
        restaurants: 0,
        events: 0,
        accommodations: 0,
        guides: 0,
        featuredVideos: 0,
      };

      const categories: {
        key: ContentKey;
        label: string;
      }[] = [
        { key: "attractions", label: "Attractions" },
        { key: "restaurants", label: "Restaurants" },
        { key: "events", label: "Events" },
        { key: "accommodations", label: "Accommodations" },
        { key: "guides", label: "Tour Guides" },
        { key: "featuredVideos", label: "Featured Videos" },
      ];

      const failedCategories: string[] = [];

      results.forEach((result, index) => {
        const category = categories[index];

        if (result.status === "fulfilled") {
          nextCounts[category.key] = getRecords(result.value).length;
        } else {
          failedCategories.push(category.label);

          console.error(
            `Failed to load ${category.label} dashboard count:`,
            result.reason,
          );
        }
      });

      setCounts(nextCounts);

      if (failedCategories.length > 0) {
        setLoadWarning(
          `Some dashboard counts could not be loaded: ${failedCategories.join(
            ", ",
          )}. Their displayed counts may be incomplete. Please refresh or check the relevant API.`,
        );
      }

      setLoading(false);
    };

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  // Total tourism content includes the six actual content modules.
  // User and admin accounts are management records, not tourism content.
  const totalItems =
    counts.attractions +
    counts.restaurants +
    counts.events +
    counts.accommodations +
    counts.guides +
    counts.featuredVideos;

  const getPercentage = (value: number) =>
    totalItems > 0 ? Math.round((value / totalItems) * 100) : 0;

  const barData: ContentItem[] = [
    {
      name: "Attractions",
      value: counts.attractions,
      color: CALBAYOG_BLUE,
      key: "attractions",
      route: "/admin/attractions",
    },
    {
      name: "Restaurants",
      value: counts.restaurants,
      color: "#D97706",
      key: "restaurants",
      route: "/admin/restaurants",
    },
    {
      name: "Events",
      value: counts.events,
      color: ADMIN_YELLOW,
      key: "events",
      route: "/admin/events",
    },
    {
      name: "Accommodations",
      value: counts.accommodations,
      color: "#0077b6",
      key: "accommodations",
      route: "/admin/accommodations",
    },
    {
      name: "Tour Guides",
      value: counts.guides,
      color: "#5b8c6a",
      key: "guides",
      route: "/admin/guides",
    },
    {
      name: "Featured Videos",
      value: counts.featuredVideos,
      color: "#8B5CF6",
      key: "featuredVideos",
      route: "/admin/featured-videos",
    },
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
      <div
        className={`admin-dashboard-page ${
          darkMode ? "admin-dashboard-dark" : ""
        }`}
      >
        <style>{ADMIN_DASHBOARD_STYLES}</style>

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="admin-dash-heading d-flex flex-column flex-md-row justify-content-between align-items-md-end">
          <div>
            <div className="admin-dash-eyebrow-row">
              <h2 className="admin-dash-title">
                Dashboard Overview
              </h2>
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
              <Spinner
                animation="border"
                size="sm"
                style={{ color: CALBAYOG_BLUE }}
              />
            </div>

            <div className="admin-dash-loading-title">
              Loading dashboard...
            </div>

            <div className="admin-dash-loading-sub">
              Gathering tourism data
            </div>
          </div>
        ) : (
          <>
            {/* =================================================
                WELCOME / SUMMARY
            ================================================= */}

            <Card className="admin-dash-welcome">
              <Card.Body
                className="p-3 p-md-4"
                style={{ position: "relative", zIndex: 1 }}
              >
                <div
                  className="d-flex flex-column flex-md-row justify-content-between align-items-md-center"
                  style={{ gap: "18px" }}
                >
                  <div>
                    <div className="admin-dash-welcome-kicker">
                      Calbayog City Tourism
                    </div>

                    <h3 className="admin-dash-welcome-title">
                      Welcome back, Admin
                    </h3>

                    <p className="admin-dash-welcome-text">
                      Your dashboard currently tracks{" "}
                      <strong>{totalItems}</strong> tourism content
                      records across attractions, restaurants, events,
                      accommodations, tour guides, and featured videos.
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
                DATA LOAD WARNING
            ================================================= */}

            {loadWarning && (
              <div
                className="admin-dash-load-warning"
                role="status"
              >
                {loadWarning}
              </div>
            )}

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
                  description="Six tourism content types"
                  accent={CALBAYOG_BLUE}
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
                  label="Restaurants"
                  count={counts.restaurants}
                  icon={<Utensils size={19} strokeWidth={2} />}
                  to="/admin/restaurants"
                  description="Restaurant listings"
                  accent="#D97706"
                />
              </Col>

              <Col xs={6} lg={3}>
                <StatCard
                  label="Tour Guides"
                  count={counts.guides}
                  icon={<UsersRound size={19} strokeWidth={2} />}
                  to="/admin/guides"
                  description="Guide listings"
                  accent="#5b8c6a"
                />
              </Col>
            </Row>

            {/* =================================================
                CHARTS
            ================================================= */}

            <Row className="g-3 mb-4">
              <Col lg={8}>
                <Card className="border-0 h-100 admin-dash-panel">
                  <Card.Body className="p-3 p-md-4">
                    <div
                      className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-3"
                      style={{ gap: "10px" }}
                    >
                      <div>
                        <h5 className="admin-dash-panel-title">
                          Content Distribution
                        </h5>

                        <p className="admin-dash-panel-sub mb-0">
                          Records across all six tourism content modules
                        </p>
                      </div>

                      <span className="admin-dash-total-pill">
                        {totalItems} TOTAL
                      </span>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={barData}
                        margin={{
                          top: 5,
                          right: 5,
                          left: -18,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke={
                            darkMode ? "#2c3831" : "#edf0ed"
                          }
                        />

                        <XAxis
                          dataKey="name"
                          interval={0}
                          angle={-18}
                          textAnchor="end"
                          height={65}
                          tick={{
                            fontSize: 10,
                            fill: darkMode ? "#9aa59e" : "#78827c",
                          }}
                          axisLine={{
                            stroke: darkMode ? "#2c3831" : "#edf0ed",
                          }}
                          tickLine={false}
                        />

                        <YAxis
                          allowDecimals={false}
                          tick={{
                            fontSize: 11,
                            fill: darkMode ? "#9aa59e" : "#78827c",
                          }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <Tooltip
                          cursor={{
                            fill: darkMode
                              ? "rgba(255,255,255,0.03)"
                              : "rgba(45,49,149,0.03)",
                          }}
                          contentStyle={tooltipStyle}
                        />

                        <Bar
                          dataKey="value"
                          name="Records"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={42}
                        >
                          {barData.map((entry) => (
                            <Cell
                              key={`bar-${entry.key}`}
                              fill={entry.color}
                            />
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
                    <h5 className="admin-dash-panel-title">
                      Content Breakdown
                    </h5>

                    <p className="admin-dash-panel-sub mb-2">
                      Share of current tourism content
                    </p>

                    <div
                      style={{
                        position: "relative",
                        height: "185px",
                      }}
                    >
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
                            nameKey="name"
                            stroke="none"
                          >
                            {pieData.map((entry) => (
                              <Cell
                                key={`pie-${entry.key}`}
                                fill={entry.color}
                              />
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
                        <div
                          style={{
                            fontSize: "1.35rem",
                            fontWeight: 700,
                            lineHeight: 1,
                            color: darkMode ? "#eef2ef" : "#1d2520",
                          }}
                        >
                          {totalItems}
                        </div>

                        <div
                          style={{
                            fontSize: "0.58rem",
                            color: darkMode ? "#7e8982" : "#89928c",
                            marginTop: "4px",
                          }}
                        >
                          ITEMS
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: "3px" }}>
                      {pieData.map((item) => (
                        <div
                          key={item.key}
                          className="admin-dash-legend-row"
                        >
                          <div
                            className="d-flex align-items-center"
                            style={{ gap: "8px", minWidth: 0 }}
                          >
                            <div
                              className="admin-dash-legend-dot"
                              style={{ background: item.color }}
                            />

                            <span className="admin-dash-legend-label">
                              {item.name}
                            </span>
                          </div>

                          <div className="d-flex align-items-center">
                            <span className="admin-dash-legend-pct">
                              {getPercentage(item.value)}%
                            </span>

                            <span className="admin-dash-legend-value">
                              {item.value}
                            </span>
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
                  <h5 className="admin-dash-panel-title">
                    Content Overview
                  </h5>

                  <p className="admin-dash-panel-sub mb-0">
                    A quick look at your six tourism content modules.
                  </p>
                </div>

                <Row className="g-3">
                  {barData.map((item) => (
                    <Col xs={12} sm={6} lg={4} key={item.key}>
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="admin-dash-progress-label">
                            {item.name}
                          </span>

                          <span className="admin-dash-progress-value">
                            {item.value}
                          </span>
                        </div>

                        <div className="admin-dash-progress-track">
                          <div
                            className="admin-dash-progress-fill"
                            style={{
                              width: `${getPercentage(item.value)}%`,
                              background: item.color,
                            }}
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
              <div className="admin-dash-actions-heading">
                Quick Actions
              </div>

              <div className="admin-dash-actions-sub">
                Manage tourism content, users, and administrator accounts.
              </div>
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
                  to="/admin/restaurants"
                  label="Restaurants"
                  description="Manage local restaurant listings."
                  icon={<Utensils size={19} strokeWidth={2} />}
                  accent="#D97706"
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
                  description="Manage hotels, resorts, and stays."
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

              <Col xs={6} md={3}>
                <QuickActionCard
                  to="/admin/featured-videos"
                  label="Featured Videos"
                  description="Upload and manage tourism videos."
                  icon={<Video size={19} strokeWidth={2} />}
                  accent="#8B5CF6"
                />
              </Col>

              <Col xs={6} md={3}>
                <QuickActionCard
                  to="/admin/users"
                  label="User Management"
                  description="Manage registered user accounts."
                  icon={<UserCog size={19} strokeWidth={2} />}
                  accent="#0891b2"
                />
              </Col>

              <Col xs={6} md={3}>
                <QuickActionCard
                  to="/admin/admin-management"
                  label="Admin Management"
                  description="Manage administrator accounts."
                  icon={<ShieldCheck size={19} strokeWidth={2} />}
                  accent="#C2415D"
                />
              </Col>
            </Row>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
```
