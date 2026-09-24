import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Spinner,
} from "react-bootstrap";

import {
  Bus,
  Car,
  Clock3,
  Globe2,
  Lightbulb,
  Map,
  MapPin,
  Navigation,
  Phone,
  Route,
  Train,
  Plane,
  Ship,
  Truck,
  ExternalLink,
  CircleHelp,
} from "lucide-react";

import { getGettingThere, clearCache } from "../services/api";

import {
  subscribeToGettingThere,
  unsubscribeAll,
} from "../services/supabase";

/* =========================================================
   TYPES
========================================================= */

type GEntry = {
  id: string;
  category: "land" | "local";

  /* LAND */
  origin?: string;
  steps?: string[];
  total_fare?: string;
  duration?: string;

  /* LOCAL */
  mode?: string;
  description?: string;
  icon?: string;

  /* OPTIONAL */
  contact_number?: string;
  website?: string;
  image?: string;
  images?: string[];
};

/* =========================================================
   HELPERS
========================================================= */

const normalizeText = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
};

/* =========================================================
   ICON HELPERS
========================================================= */

const getTransportIcon = (mode?: string) => {
  const value = normalizeText(mode);

  if (
    value.includes("bus") ||
    value.includes("coach")
  ) {
    return Bus;
  }

  if (
    value.includes("van") ||
    value.includes("car") ||
    value.includes("taxi") ||
    value.includes("tricycle") ||
    value.includes("motorcycle")
  ) {
    return Car;
  }

  if (
    value.includes("train")
  ) {
    return Train;
  }

  if (
    value.includes("plane") ||
    value.includes("airport") ||
    value.includes("air")
  ) {
    return Plane;
  }

  if (
    value.includes("boat") ||
    value.includes("ship") ||
    value.includes("ferry")
  ) {
    return Ship;
  }

  if (
    value.includes("truck")
  ) {
    return Truck;
  }

  if (
    value.includes("route") ||
    value.includes("road")
  ) {
    return Route;
  }

  return Navigation;
};

/* =========================================================
   COMPONENT
========================================================= */

const GettingThere: React.FC = () => {
  const [activeTab, setActiveTab] =
    useState<"land" | "local">("land");

  const [items, setItems] =
    useState<GEntry[]>([]);

  const [loading, setLoading] =
    useState(true);

  /* =======================================================
     FETCH DATA
  ======================================================= */

  const fetchGettingThere = async () => {
    setLoading(true);

    try {
      clearCache("getting-there");

      const res = await getGettingThere();

      console.log(
        "Getting There API response:",
        res
      );

      const data = Array.isArray(res?.data)
        ? res.data
        : [];

      setItems(data);
    } catch (error) {
      console.error(
        "Failed to fetch getting there:",
        error
      );

      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     INITIAL LOAD + REALTIME
  ======================================================= */

  useEffect(() => {
    fetchGettingThere();

    subscribeToGettingThere(() => {
      fetchGettingThere();
    });

    return () => {
      unsubscribeAll();
    };
  }, []);

  /* =======================================================
     FILTER DATA
  ======================================================= */

  const landRoutes = useMemo(
    () =>
      items.filter(
        (item) =>
          item.category === "land"
      ),
    [items]
  );

  const localTransport = useMemo(
    () =>
      items.filter(
        (item) =>
          item.category === "local"
      ),
    [items]
  );

  /* =======================================================
     HELPERS
  ======================================================= */

  const getSteps = (
    route: GEntry
  ): string[] => {
    if (Array.isArray(route.steps)) {
      return route.steps.filter(Boolean);
    }

    return [];
  };

  const getImage = (
    item: GEntry
  ): string | null => {
    if (
      Array.isArray(item.images) &&
      item.images.length > 0
    ) {
      return item.images[0];
    }

    if (item.image) {
      return item.image;
    }

    return null;
  };

  const getPhone = (
    item: GEntry
  ): string => {
    return item.contact_number || "";
  };

  const getWebsite = (
    item: GEntry
  ): string => {
    return item.website || "";
  };

  /* =======================================================
     ACTIVE DATA
  ======================================================= */

  const activeItems =
    activeTab === "land"
      ? landRoutes
      : localTransport;

  const activeCount =
    activeItems.length;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="page-enter getting-there-page">

      {/* ===================================================
          HEADER
      =================================================== */}

      <section className="getting-header">
        <div className="getting-header-inner">

          <h1 className="getting-title">
            GETTING THERE
          </h1>

          <p className="getting-subtitle">
            Plan your journey to Calbayog City
            and discover convenient ways to
            travel around once you arrive.
          </p>

        </div>
      </section>

      {/* ===================================================
          MAIN
      =================================================== */}

      <Container className="getting-container">

        {/* =================================================
            CATEGORY / MODE PILLS
        ================================================= */}

        <div className="category-pills">

          <button
            type="button"
            className={`category-pill ${
              activeTab === "land"
                ? "category-pill-active"
                : ""
            }`}
            style={
              {
                "--pill-color":
                  "#1A7A4A",
                "--pill-background":
                  "#e8f5ee",
              } as React.CSSProperties
            }
            onClick={() =>
              setActiveTab("land")
            }
          >
            <Bus size={15} strokeWidth={2.2} />
            How to Get Here
          </button>

          <button
            type="button"
            className={`category-pill ${
              activeTab === "local"
                ? "category-pill-active"
                : ""
            }`}
            style={
              {
                "--pill-color":
                  "#0077B6",
                "--pill-background":
                  "#e7f4fb",
              } as React.CSSProperties
            }
            onClick={() =>
              setActiveTab("local")
            }
          >
            <Navigation
              size={15}
              strokeWidth={2.2}
            />
            Getting Around
          </button>

        </div>

        {/* =================================================
            INTRO SECTION
        ================================================= */}

        <section className="getting-intro">

          <div className="getting-intro-icon">
            {activeTab === "land" ? (
              <Route
                size={19}
                strokeWidth={2}
              />
            ) : (
              <Map
                size={19}
                strokeWidth={2}
              />
            )}
          </div>

          <div>
            <div className="getting-intro-title">
              {activeTab === "land"
                ? "Travel to Calbayog"
                : "Getting around Calbayog"}
            </div>

            <p className="getting-intro-text">
              {activeTab === "land"
                ? "Calbayog is accessible through the Pan-Philippine Highway (AH26), offering a scenic route through Samar."
                : "Once you're in the city, choose from these local transportation options to explore Calbayog and nearby attractions."}
            </p>
          </div>

        </section>

        {/* =================================================
            RESULTS BAR
        ================================================= */}

        <div className="results-bar">

          <div className="results-left">

            <div
              className="results-icon"
              style={{
                background:
                  activeTab === "land"
                    ? "#e8f5ee"
                    : "#e7f4fb",
                color:
                  activeTab === "land"
                    ? "#1A7A4A"
                    : "#0077B6",
              }}
            >
              {activeTab === "land" ? (
                <Bus
                  size={17}
                  strokeWidth={2}
                />
              ) : (
                <Navigation
                  size={17}
                  strokeWidth={2}
                />
              )}
            </div>

            <div>

              <div className="results-label">
                Showing
              </div>

              <div className="results-count">
                {activeCount}{" "}
                {activeTab === "land"
                  ? `travel route${
                      activeCount !== 1
                        ? "s"
                        : ""
                    }`
                  : `local option${
                      activeCount !== 1
                        ? "s"
                        : ""
                    }`}
              </div>

            </div>

          </div>

          <div className="results-right">

            <span className="results-category">
              {activeTab === "land"
                ? "Routes to Calbayog"
                : "Explore Calbayog"}
            </span>

          </div>

        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <div className="getting-loading">

            <div className="getting-loading-icon">
              <Spinner
                animation="border"
                size="sm"
              />
            </div>

            <div className="getting-loading-title">
              {activeTab === "land"
                ? "Finding travel routes..."
                : "Finding local transport..."}
            </div>

            <p className="getting-loading-text">
              Please wait a moment.
            </p>

          </div>

        ) : activeCount === 0 ? (

          /* =================================================
             EMPTY STATE
          ================================================= */

          <div className="getting-empty">

            <div className="getting-empty-icon">
              {activeTab === "land" ? (
                <Bus
                  size={30}
                  strokeWidth={1.8}
                />
              ) : (
                <Navigation
                  size={30}
                  strokeWidth={1.8}
                />
              )}
            </div>

            <h3>
              {activeTab === "land"
                ? "No land routes found"
                : "No local transport found"}
            </h3>

            <p>
              {activeTab === "land"
                ? "Travel information is currently unavailable. Please check again later."
                : "Local transportation information is currently unavailable."}
            </p>

          </div>

        ) : activeTab === "land" ? (

          /* =================================================
             LAND ROUTES
          ================================================= */

          <Row className="getting-grid">

            {landRoutes.map(
              (route, index) => {

                const steps =
                  getSteps(route);

                const RouteIcon =
                  getTransportIcon(
                    route.origin
                  );

                return (
                  <Col
                    xs={12}
                    sm={6}
                    lg={4}
                    className="getting-col"
                    key={
                      route.id ||
                      index
                    }
                  >

                    <Card className="getting-card">

                      {/* HEADER */}

                      <div className="route-card-header">

                        <div className="route-icon">
                          <RouteIcon
                            size={22}
                            strokeWidth={2}
                          />
                        </div>

                        <div className="route-heading">

                          <div className="route-eyebrow">
                            TRAVEL FROM
                          </div>

                          <h3>
                            {route.origin ||
                              "Your location"}
                          </h3>

                        </div>

                      </div>

                      {/* BODY */}

                      <Card.Body className="getting-card-body">

                        {steps.length > 0 && (

                          <div className="route-guide">

                            <div className="section-label">
                              <Navigation
                                size={13}
                                strokeWidth={2.3}
                              />
                              Route guide
                            </div>

                            <div className="steps-list">

                              {steps.map(
                                (
                                  step,
                                  stepIndex
                                ) => (

                                  <div
                                    className="step-item"
                                    key={
                                      stepIndex
                                    }
                                  >

                                    <div className="step-number">
                                      {stepIndex + 1}
                                    </div>

                                    <div className="step-text">
                                      {step}
                                    </div>

                                  </div>

                                )
                              )}

                            </div>

                          </div>

                        )}

                        {(route.total_fare ||
                          route.duration) && (

                          <div className="route-info">

                            {route.total_fare && (

                              <div className="route-info-item route-fare">

                                <div className="route-info-label">
                                  ESTIMATED FARE
                                </div>

                                <div className="route-info-value">
                                  💵{" "}
                                  {
                                    route.total_fare
                                  }
                                </div>

                              </div>

                            )}

                            {route.duration && (

                              <div className="route-info-item route-duration">

                                <div className="route-info-label">
                                  TRAVEL TIME
                                </div>

                                <div className="route-info-value">
                                  <Clock3
                                    size={13}
                                    strokeWidth={2.3}
                                  />
                                  {
                                    route.duration
                                  }
                                </div>

                              </div>

                            )}

                          </div>

                        )}

                      </Card.Body>

                    </Card>

                  </Col>
                );
              }
            )}

          </Row>

        ) : (

          /* =================================================
             LOCAL TRANSPORT
          ================================================= */

          <Row className="getting-grid">

            {localTransport.map(
              (transport, index) => {

                const image =
                  getImage(
                    transport
                  );

                const TransportIcon =
                  getTransportIcon(
                    transport.mode
                  );

                return (
                  <Col
                    xs={12}
                    sm={6}
                    lg={3}
                    className="getting-col"
                    key={
                      transport.id ||
                      index
                    }
                  >

                    <Card className="transport-card">

                      {/* IMAGE */}

                      <div className="transport-image-wrap">

                        {image ? (

                          <img
                            src={image}
                            alt={
                              transport.mode ||
                              "Local transportation"
                            }
                            className="transport-image"
                            onError={(
                              e
                            ) => {
                              e.currentTarget.style.display =
                                "none";
                            }}
                          />

                        ) : (

                          <div className="transport-image-placeholder">

                            {transport.icon ? (
                              <span className="transport-emoji">
                                {
                                  transport.icon
                                }
                              </span>
                            ) : (
                              <TransportIcon
                                size={58}
                                strokeWidth={1.3}
                              />
                            )}

                          </div>

                        )}

                        <div className="transport-image-overlay" />

                        <span className="transport-badge">
                          <MapPin
                            size={11}
                            strokeWidth={2.2}
                          />
                          Local
                        </span>

                      </div>

                      {/* BODY */}

                      <Card.Body className="transport-card-body">

                        <div className="transport-heading">

                          <div className="transport-icon-box">

                            {transport.icon ? (
                              <span>
                                {
                                  transport.icon
                                }
                              </span>
                            ) : (
                              <TransportIcon
                                size={17}
                                strokeWidth={2}
                              />
                            )}

                          </div>

                          <h3>
                            {transport.mode ||
                              "Local Transport"}
                          </h3>

                        </div>

                        <p className="transport-description">
                          {transport.description ||
                            "Transportation option available in Calbayog City."}
                        </p>

                        {(getPhone(
                          transport
                        ) ||
                          getWebsite(
                            transport
                          )) && (

                          <div className="transport-actions">

                            {getPhone(
                              transport
                            ) && (

                              <a
                                href={`tel:${getPhone(
                                  transport
                                )}`}
                                className="transport-action"
                              >
                                <Phone
                                  size={12}
                                  strokeWidth={2.2}
                                />
                                Call
                              </a>

                            )}

                            {getWebsite(
                              transport
                            ) && (

                              <a
                                href={getWebsite(
                                  transport
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="transport-action"
                              >
                                <Globe2
                                  size={12}
                                  strokeWidth={2.2}
                                />
                                Website
                              </a>

                            )}

                          </div>

                        )}

                      </Card.Body>

                    </Card>

                  </Col>
                );
              }
            )}

          </Row>

        )}

        {/* =================================================
            TRAVEL TIPS
        ================================================= */}

        <Card className="travel-tip-card">

          <Card.Body>

            <div className="bottom-info-layout">

              <div className="bottom-info-icon">
                <Lightbulb
                  size={19}
                  strokeWidth={2}
                />
              </div>

              <div>

                <h3>
                  Travel Tip
                </h3>

                <p>
                  Keep some small bills and
                  coins with you when using
                  local transportation. Travel
                  times and fares may vary
                  depending on traffic, weather,
                  and your destination.
                </p>

              </div>

            </div>

          </Card.Body>

        </Card>

        {/* =================================================
            IMPORTANT NUMBERS
        ================================================= */}

        <Card className="important-numbers-card">

          <Card.Body>

            <h3>
              <Phone
                size={15}
                strokeWidth={2.2}
              />
              Calbayog City Important Numbers
            </h3>

            <Row className="g-2">

              <Col
                xs={12}
                sm={6}
                lg={4}
              >
                <div className="important-number">
                  <strong>
                    🏛️ Tourism Office
                  </strong>

                  <a href="tel:+6355520943">
                    (055) 209-XXXX
                  </a>
                </div>
              </Col>

              <Col
                xs={12}
                sm={6}
                lg={4}
              >
                <div className="important-number">
                  <strong>
                    🏢 City Hall
                  </strong>

                  <a href="tel:+6355520912">
                    (055) 209-XXXX
                  </a>
                </div>
              </Col>

              <Col
                xs={12}
                sm={6}
                lg={4}
              >
                <div className="important-number">
                  <strong>
                    🚔 PNP Calbayog
                  </strong>

                  <a href="tel:+6355520911">
                    (055) 209-XXXX
                  </a>
                </div>
              </Col>

              <Col
                xs={12}
                sm={6}
                lg={4}
              >
                <div className="important-number">
                  <strong>
                    🚑 District Hospital
                  </strong>

                  <a href="tel:+6355520915">
                    (055) 209-XXXX
                  </a>
                </div>
              </Col>

              <Col
                xs={12}
                sm={6}
                lg={4}
              >
                <div className="important-number">
                  <strong>
                    ✈️ Calbayog Airport
                  </strong>

                  <a href="tel:+6355520920">
                    (055) 209-XXXX
                  </a>
                </div>
              </Col>

            </Row>

          </Card.Body>

        </Card>

      </Container>

      {/* ===================================================
          STYLES
      =================================================== */}

      <style>{`

        @font-face {
          font-family: "Barabara";
          src: url("/fonts/BARABARA-final.otf")
            format("opentype");
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }

        /* =================================================
           PAGE
        ================================================= */

        .getting-there-page {
          min-height: 100vh;
          background: #ffffff;
          color: #171a18;
        }

        /* =================================================
           HEADER
        ================================================= */

        .getting-header {
          width: 100%;
          background: #ffffff;
          padding: 30px 20px 18px;
        }

        .getting-header-inner {
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
        }

        .getting-title {
          margin: 0;
          font-family: "Barabara", sans-serif !important;
          font-size: clamp(
            1.65rem,
            2.8vw,
            2.4rem
          );
          font-weight: 400;
          line-height: 0.95;
          letter-spacing: 0.015em;
          color: #1A7A4A;
        }

        .getting-subtitle {
          max-width: 590px;
          margin: 6px 0 0;
          font-family:
            "Nunito",
            "Poppins",
            "Segoe UI",
            sans-serif;
          font-size: 0.81rem;
          line-height: 1.55;
          font-weight: 500;
          color: #737b76;
        }

        /* =================================================
           CONTAINER
        ================================================= */

        .getting-container {
          width: 100%;
          max-width: 1240px;
          padding: 0 20px 60px;
          margin: 0 auto;
        }

        /* =================================================
           CATEGORY PILLS
        ================================================= */

        .category-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          margin: 0 0 5px;
          padding: 0 0 14px;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }

        .category-pills::-webkit-scrollbar {
          display: none;
        }

        .category-pill {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 39px;
          padding: 8px 15px;
          border: 1px solid #e3e7e4;
          border-radius: 999px;
          background: #ffffff;
          color: #68716c;
          font-family:
            "Nunito",
            "Segoe UI",
            sans-serif;
          font-size: 0.74rem;
          font-weight: 800;
          cursor: pointer;
          transition:
            color 0.2s ease,
            border-color 0.2s ease,
            background 0.2s ease,
            transform 0.2s ease,
            box-shadow 0.2s ease;
          white-space: nowrap;
        }

        .category-pill:hover {
          color: var(--pill-color);
          border-color: var(--pill-color);
          background: var(--pill-background);
          transform: translateY(-1px);
        }

        .category-pill-active {
          color: var(--pill-color);
          border-color: var(--pill-color);
          background: var(--pill-background);
          box-shadow:
            0 5px 16px rgba(
              20,
              30,
              24,
              0.07
            );
        }

        /* =================================================
           INTRO
        ================================================= */

        .getting-intro {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          margin: 3px 0 22px;
          padding: 14px 16px;
          border: 1px solid
            rgba(26, 122, 74, 0.08);
          border-radius: 16px;
          background:
            linear-gradient(
              135deg,
              #e8f5ee,
              #f1faf7
            );
        }

        .getting-intro-icon {
          width: 38px;
          height: 38px;
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          background: #ffffff;
          color: #1A7A4A;
        }

        .getting-intro-title {
          margin-top: 1px;
          margin-bottom: 3px;
          font-family:
            "Poppins",
            sans-serif;
          font-size: 0.84rem;
          line-height: 1.25;
          font-weight: 700;
          color: #252b27;
        }

        .getting-intro-text {
          margin: 0;
          font-family:
            "Nunito",
            sans-serif;
          font-size: 0.72rem;
          line-height: 1.5;
          font-weight: 500;
          color: #737b76;
        }

        /* =================================================
           RESULTS BAR
        ================================================= */

        .results-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          flex-wrap: wrap;
          margin-bottom: 27px;
          padding: 11px 2px;
          border-top: 1px solid #f0f2f0;
          border-bottom: 1px solid #f0f2f0;
        }

        .results-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .results-icon {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
        }

        .results-label {
          font-family:
            "Nunito",
            sans-serif;
          font-size: 0.64rem;
          color: #8b938e;
          line-height: 1.2;
        }

        .results-count {
          margin-top: 2px;
          font-family:
            "Poppins",
            sans-serif;
          font-size: 0.74rem;
          font-weight: 700;
          color: #252b27;
        }

        .results-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .results-category {
          font-family:
            "Nunito",
            sans-serif;
          font-size: 0.69rem;
          font-weight: 700;
          color: #858d88;
        }

        /* =================================================
           LOADING
        ================================================= */

        .getting-loading {
          min-height: 360px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .getting-loading-icon {
          width: 58px;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
          border-radius: 17px;
          background: #e8f5ee;
          color: #1A7A4A;
        }

        .getting-loading-title {
          font-family:
            "Poppins",
            sans-serif;
          font-size: 0.84rem;
          font-weight: 700;
          color: #252b27;
        }

        .getting-loading-text {
          margin: 4px 0 0;
          font-family:
            "Nunito",
            sans-serif;
          font-size: 0.72rem;
          color: #737b76;
        }

        /* =================================================
           EMPTY
        ================================================= */

        .getting-empty {
          padding: 65px 20px;
          text-align: center;
          border: 1px solid #edf1ee;
          border-radius: 20px;
          background:
            linear-gradient(
              145deg,
              #fafcfb,
              #f5f8f6
            );
        }

        .getting-empty-icon {
          width: 70px;
          height: 70px;
          margin: 0 auto 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 21px;
          background: #e8f5ee;
          color: #1A7A4A;
        }

        .getting-empty h3 {
          margin: 0 0 6px;
          font-family:
            "Poppins",
            sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #252b27;
        }

        .getting-empty p {
          max-width: 370px;
          margin: 0 auto;
          font-family:
            "Nunito",
            sans-serif;
          font-size: 0.78rem;
          line-height: 1.5;
          color: #737b76;
        }

        /* =================================================
           GRID
        ================================================= */

        .getting-grid {
          row-gap: 46px !important;
          margin-left: -12px;
          margin-right: -12px;
        }

        .getting-col {
          padding-left: 12px;
          padding-right: 12px;
          display: flex;
        }

        /* =================================================
           LAND ROUTE CARD
        ================================================= */

        .getting-card {
          width: 100%;
          height: 100%;
          overflow: hidden;
          border: 1px solid #edf0ed !important;
          border-radius: 18px !important;
          background: #ffffff !important;
          box-shadow:
            0 3px 14px
              rgba(
                20,
                30,
                24,
                0.055
              ) !important;
          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease;
        }

        .getting-card:hover {
          transform: translateY(-4px);
          box-shadow:
            0 12px 30px
              rgba(
                20,
                30,
                24,
                0.10
              ) !important;
        }

        .route-card-header {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 16px 16px 13px;
          background:
            linear-gradient(
              135deg,
              #f1faf5,
              #f8fbfa
            );
          border-bottom: 1px solid #edf0ed;
        }

        .route-icon {
          width: 46px;
          height: 46px;
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: #e8f5ee;
          color: #1A7A4A;
        }

        .route-heading {
          min-width: 0;
        }

        .route-eyebrow {
          font-family:
            "Nunito",
            sans-serif;
          font-size: 0.64rem;
          font-weight: 800;
          color: #1A7A4A;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .route-heading h3 {
          margin: 2px 0 0;
          font-family:
            "Poppins",
            sans-serif;
          font-size: 1rem;
          line-height: 1.3;
          font-weight: 700;
          color: #252b27;
          overflow-wrap: anywhere;
        }

        .getting-card-body {
          padding: 16px !important;
        }

        /* =================================================
           ROUTE GUIDE
        ================================================= */

        .route-guide {
          margin-bottom: 17px;
        }

        .section-label {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 10px;
          font-family:
            "Poppins",
            sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          color: #252b27;
        }

        .steps-list {
          display: flex;
          flex-direction: column;
        }

        .step-item {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin-bottom: 10px;
        }

        .step-item:last-child {
          margin-bottom: 0;
        }

        .step-number {
          width: 24px;
          height: 24px;
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #e8f5ee;
          color: #1A7A4A;
          font-family:
            "Nunito",
            sans-serif;
          font-size: 0.65rem;
          font-weight: 800;
        }

        .step-text {
          padding-top: 3px;
          font-family:
            "Nunito",
            sans-serif;
          font-size: 0.74rem;
          line-height: 1.45;
          color: #737b76;
        }

        /* =================================================
           ROUTE INFO
        ================================================= */

        .route-info {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          padding-top: 13px;
          border-top: 1px solid #f0f2f0;
        }

        .route-info-item {
          flex: 1 1 120px;
          min-width: 0;
          padding: 10px;
          border-radius: 10px;
        }

        .route-fare {
          background: #f5faf7;
        }

        .route-duration {
          background: #f7f9fa;
        }

        .route-info-label {
          margin-bottom: 2px;
          font-family:
            "Nunito",
            sans-serif;
          font-size: 0.61rem;
          color: #87918b;
        }

        .route-info-value {
          display: flex;
          align-items: center;
          gap: 5px;
          font-family:
            "Poppins",
            sans-serif;
          font-size: 0.76rem;
          line-height: 1.35;
          font-weight: 800;
          color: #252b27;
          overflow-wrap: anywhere;
        }

        .route-fare
          .route-info-value {
          color: #1A7A4A;
        }

        /* =================================================
           TRANSPORT CARDS
        ================================================= */

        .transport-card {
          width: 100%;
          height: 100%;
          overflow: hidden;
          border: none !important;
          border-radius: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
        }

        .transport-image-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 5;
          min-height: 0;
          overflow: hidden;
          border-radius: 18px;
          background: #eef2ef;
        }

        .transport-image {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          object-position: center;
          transition:
            transform 0.65s
              cubic-bezier(
                0.2,
                0.65,
                0.3,
                1
              ),
            filter 0.35s ease;
        }

        .transport-card:hover
          .transport-image {
          transform: scale(1.035);
        }

        .transport-card:hover
          .transport-image-wrap {
          box-shadow:
            0 12px 32px
              rgba(
                20,
                30,
                24,
                0.11
              );
        }

        .transport-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background:
            linear-gradient(
              135deg,
              #e8f5ee,
              #ffffff
            );
          color: #1A7A4A;
        }

        .transport-emoji {
          font-size: 4rem;
          line-height: 1;
        }

        .transport-image-overlay {
          position: absolute;
          inset: auto 0 0;
          height: 85px;
          pointer-events: none;
          background:
            linear-gradient(
              to top,
              rgba(0,0,0,0.30),
              transparent
            );
        }

        .transport-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 7px 10px;
          border-radius: 999px;
          background:
            rgba(
              255,
              255,
              255,
              0.93
            );
          color: #1A7A4A;
          font-family:
            "Nunito",
            sans-serif;
          font-size: 0.62rem;
          font-weight: 800;
          box-shadow:
            0 3px 10px
              rgba(
                0,
                0,
                0,
                0.08
              );
          backdrop-filter: blur(10px);
        }

        .transport-card-body {
          padding: 13px 2px 0 !important;
        }

        .transport-heading {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .transport-icon-box {
          width: 32px;
          height: 32px;
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: #e8f5ee;
          color: #1A7A4A;
          font-size: 1rem;
        }

        .transport-heading h3 {
          margin: 0;
          color: #171b18;
          font-family:
            "Poppins",
            "Nunito",
            sans-serif;
          font-size: 0.91rem;
          line-height: 1.3;
          font-weight: 700;
          letter-spacing: -0.012em;
        }

        .transport-description {
          margin: 7px 0 0;
          color: #707973;
          font-family:
            "Nunito",
            sans-serif;
          font-size: 0.7rem;
          line-height: 1.5;
          font-weight: 500;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .transport-actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #f0f2f0;
        }

        .transport-action {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #727b76;
          font-family:
            "Nunito",
            sans-serif;
          font-size: 0.61rem;
          font-weight: 800;
          text-decoration: none;
          transition:
            color 0.2s ease,
            transform 0.2s ease;
        }

        .transport-action:hover {
          color: #1A7A4A;
          transform: translateY(-1px);
        }

        /* =================================================
           BOTTOM INFO
        ================================================= */

        .travel-tip-card,
        .important-numbers-card {
          border: none !important;
          box-shadow: none !important;
        }

        .travel-tip-card {
          margin-top: 46px;
          border-radius: 18px !important;
          background:
            linear-gradient(
              135deg,
              #fff8e7,
              #fffdf6
            ) !important;
          border:
            1px solid #f5e8c7 !important;
        }

        .travel-tip-card
          .card-body {
          padding: 17px !important;
        }

        .bottom-info-layout {
          display: flex;
          align-items: flex-start;
          gap: 11px;
        }

        .bottom-info-icon {
          width: 40px;
          height: 40px;
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #fff1c9;
          color: #9a741d;
        }

        .bottom-info-layout h3 {
          margin: 2px 0 5px;
          font-family:
            "Poppins",
            sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          color: #252b27;
        }

        .bottom-info-layout p {
          margin: 0;
          font-family:
            "Nunito",
            sans-serif;
          font-size: 0.72rem;
          line-height: 1.55;
          color: #737b76;
        }

        /* =================================================
           IMPORTANT NUMBERS
        ================================================= */

        .important-numbers-card {
          margin-top: 12px;
          border-radius: 18px !important;
          background: #f8faf9 !important;
          border:
            1px solid #edf0ed !important;
        }

        .important-numbers-card
          .card-body {
          padding: 17px !important;
        }

        .important-numbers-card h3 {
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 0 0 12px;
          font-family:
            "Poppins",
            sans-serif;
          font-size: 0.82rem;
          line-height: 1.3;
          font-weight: 700;
          color: #252b27;
        }

        .important-number {
          padding: 10px 12px;
          border-radius: 10px;
          background: #ffffff;
          border: 1px solid #edf0ed;
          font-family:
            "Nunito",
            sans-serif;
          font-size: 0.7rem;
        }

        .important-number strong {
          display: block;
          margin-bottom: 2px;
          color: #252b27;
        }

        .important-number a {
          color: #1A7A4A;
          text-decoration: none;
          font-weight: 700;
        }

        .important-number a:hover {
          text-decoration: underline;
        }

        /* =================================================
           RESPONSIVE
        ================================================= */

        @media (max-width: 991.98px) {

          .getting-header {
            padding: 28px 20px 18px;
          }

          .getting-title {
            font-size:
              clamp(
                1.65rem,
                4.5vw,
                2.25rem
              );
          }

          .transport-image-wrap {
            aspect-ratio: 4 / 5;
          }

          .getting-grid {
            row-gap: 40px !important;
          }

        }

        @media (max-width: 767.98px) {

          .getting-header {
            padding: 25px 17px 16px;
          }

          .getting-title {
            font-size: 1.9rem;
          }

          .getting-subtitle {
            margin-top: 6px;
            font-size: 0.78rem;
          }

          .getting-container {
            padding-top: 0;
            padding-left: 17px;
            padding-right: 17px;
          }

          .category-pills {
            padding-top: 1px;
          }

          .getting-intro {
            margin-bottom: 20px;
          }

          .results-bar {
            align-items: flex-start;
          }

          .results-right {
            width: 100%;
            justify-content: space-between;
          }

          .transport-image-wrap {
            aspect-ratio: 4 / 5;
            border-radius: 17px;
          }

          .getting-grid {
            row-gap: 36px !important;
          }

        }

        @media (max-width: 479.98px) {

          .getting-title {
            font-size: 1.8rem;
          }

          .getting-subtitle {
            font-size: 0.77rem;
          }

          .transport-image-wrap {
            aspect-ratio: 4 / 5;
          }

          .transport-heading h3 {
            font-size: 0.94rem;
          }

          .transport-description {
            font-size: 0.7rem;
          }

          .route-heading h3 {
            font-size: 0.94rem;
          }

        }

      `}</style>

    </div>
  );
};

export default GettingThere;