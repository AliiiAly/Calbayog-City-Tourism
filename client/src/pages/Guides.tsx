
import React, { useCallback, useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Alert,
} from "react-bootstrap";

import {
  Compass,
  Phone,
  MapPin,
  Users,
  RefreshCw,
} from "lucide-react";

import {
  supabase,
  subscribeToGuides,
  unsubscribeAll,
} from "../services/supabase";

/* =======================================================
   TYPES
======================================================= */

interface Guide {
  id: string;
  name: string;
  phone: string;
  created_at?: string;
  updated_at?: string;
}

/* =======================================================
   CONSTANTS
======================================================= */

const CALBAYOG_BLUE = "#2D3195";

/* =======================================================
   COMPONENT
======================================================= */

const Guides: React.FC = () => {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  /* =======================================================
     FETCH GUIDES DIRECTLY FROM SUPABASE
  ======================================================= */

  const fetchGuides = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error: supabaseError } = await supabase
        .from("guides")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("========== GUIDES SUPABASE DEBUG ==========");
      console.log("Guides data:", data);
      console.log("Supabase error:", supabaseError);
      console.log("============================================");

      if (supabaseError) {
        throw supabaseError;
      }

      const fetchedGuides: Guide[] = Array.isArray(data)
        ? data
        : [];

      setGuides(fetchedGuides);
    } catch (error: any) {
      console.error("========== GUIDES SUPABASE ERROR ==========");
      console.error("Error object:", error);
      console.error("Error message:", error?.message);
      console.error("Error details:", error?.details);
      console.error("Error hint:", error?.hint);
      console.error("Error code:", error?.code);
      console.error("===========================================");

      const serverMessage =
        error?.message ||
        "Unable to retrieve guides from Supabase.";

      setGuides([]);

      setError(
        `Unable to load tour guides: ${serverMessage}`,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* =======================================================
     INITIAL LOAD AND REALTIME SUBSCRIPTION
  ======================================================= */

  useEffect(() => {
    let isMounted = true;

    const loadGuides = async () => {
      if (!isMounted) return;

      await fetchGuides();
    };

    loadGuides();

    const guideSubscription = subscribeToGuides(() => {
      if (isMounted) {
        fetchGuides();
      }
    });

    return () => {
      isMounted = false;

      if (guideSubscription) {
        supabase.removeChannel(guideSubscription);
      }

      unsubscribeAll();
    };
  }, [fetchGuides]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="page-enter guides-page">
      {/* =================================================
          HEADER
      ================================================= */}

      <section className="guides-header">
        <div className="guides-header-inner">
          <h1 className="guides-title">
            TOUR GUIDES
          </h1>

          <p className="guides-subtitle">
            Connect with local guides who can help you
            discover the beauty, culture, and experiences
            of Calbayog City.
          </p>
        </div>
      </section>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <Container className="guides-container">
        {/* =================================================
            ERROR ALERT
        ================================================= */}

        {error && (
          <Alert
            variant="danger"
            className="guides-alert"
          >
            <div className="guides-alert-content">
              <span>{error}</span>

              <button
                type="button"
                className="guides-retry-button"
                onClick={fetchGuides}
              >
                <RefreshCw
                  size={13}
                  strokeWidth={2.2}
                />

                Try Again
              </button>
            </div>
          </Alert>
        )}

        {/* =================================================
            RESULTS BAR
        ================================================= */}

        {!loading &&
          !error &&
          guides.length > 0 && (
            <div className="results-bar">
              <div className="results-left">
                <div className="results-icon">
                  <Users
                    size={16}
                    strokeWidth={2}
                  />
                </div>

                <div>
                  <div className="results-label">
                    Showing
                  </div>

                  <div className="results-count">
                    {guides.length} local guide
                    {guides.length !== 1
                      ? "s"
                      : ""}
                  </div>
                </div>
              </div>

              <div className="results-right">
                <span className="results-category">
                  Calbayog City
                </span>
              </div>
            </div>
          )}

        {/* =================================================
            LOADING STATE
        ================================================= */}

        {loading ? (
          <div className="guides-loading">
            <div className="guides-loading-icon">
              <Spinner
                animation="border"
                size="sm"
              />
            </div>

            <div className="guides-loading-title">
              Loading local guides...
            </div>

            <p className="guides-loading-text">
              Fetching guide information.
            </p>
          </div>
        ) : error ? (
          /* =================================================
             ERROR STATE
          ================================================= */

          <div className="guides-empty">
            <div className="guides-empty-icon">
              <Compass
                size={28}
                strokeWidth={1.8}
              />
            </div>

            <h3>
              Unable to load guides
            </h3>

            <p>
              Please try refreshing the guide list.
            </p>

            <button
              type="button"
              className="guides-empty-button"
              onClick={fetchGuides}
            >
              <RefreshCw
                size={14}
                strokeWidth={2.2}
              />

              Refresh Guides
            </button>
          </div>
        ) : guides.length === 0 ? (
          /* =================================================
             EMPTY STATE
          ================================================= */

          <div className="guides-empty">
            <div className="guides-empty-icon">
              <Compass
                size={28}
                strokeWidth={1.8}
              />
            </div>

            <h3>
              No guides found
            </h3>

            <p>
              There are currently no local tour guides
              available. Please check again later.
            </p>

            <button
              type="button"
              className="guides-empty-button"
              onClick={fetchGuides}
            >
              <RefreshCw
                size={14}
                strokeWidth={2.2}
              />

              Refresh
            </button>
          </div>
        ) : (
          /* =================================================
             GUIDE GRID
          ================================================= */

          <Row className="guides-grid">
            {guides.map((guide, guideIndex) => {
              const guideName =
                guide.name?.trim() ||
                "Local Tour Guide";

              const phone = String(
                guide.phone || "",
              ).trim();

              return (
                <Col
                  xs={12}
                  sm={6}
                  lg={3}
                  className="guide-col"
                  key={
                    guide.id ||
                    `guide-${guideIndex}`
                  }
                >
                  <Card className="guide-card">
                    {/* =====================================
                        CARD TOP
                    ===================================== */}

                    <div className="guide-card-top">
                      <div className="guide-icon-circle">
                        <Compass
                          size={23}
                          strokeWidth={1.8}
                        />
                      </div>

                      <div className="guide-top-info">
                        <span className="guide-label">
                          LOCAL GUIDE
                        </span>

                        <span className="guide-location-label">
                          <MapPin
                            size={11}
                            strokeWidth={2}
                          />

                          Calbayog City
                        </span>
                      </div>
                    </div>

                    {/* =====================================
                        CARD BODY
                    ===================================== */}

                    <Card.Body className="guide-card-body">
                      <h2 className="guide-name">
                        {guideName}
                      </h2>

                      {/* =================================
                          PHONE INFORMATION
                      ================================= */}

                      {phone ? (
                        <div className="guide-phone">
                          <div className="guide-phone-icon">
                            <Phone
                              size={16}
                              strokeWidth={2.2}
                            />
                          </div>

                          <div className="guide-phone-content">
                            <span className="guide-phone-label">
                              PHONE NUMBER
                            </span>

                            <span className="guide-phone-number">
                              {phone}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="guide-phone guide-phone-empty">
                          <div className="guide-phone-icon">
                            <Phone
                              size={15}
                              strokeWidth={2}
                            />
                          </div>

                          <div className="guide-phone-content">
                            <span className="guide-phone-label">
                              PHONE NUMBER
                            </span>

                            <span className="guide-no-phone">
                              No phone number available
                            </span>
                          </div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Container>

      {/* =================================================
          STYLES
      ================================================= */}

      <style>{`
        @font-face {
          font-family: "Barabara";
          src: url("/fonts/BARABARA-final.otf")
            format("opentype");
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }

        /* ================================================
           PAGE
        ================================================ */

        .guides-page {
          min-height: 100vh;
          background: #ffffff;
          color: #171a18;
        }

        /* ================================================
           HEADER
        ================================================ */

        .guides-header {
          width: 100%;
          background: #ffffff;
          padding: 30px 0 18px;
        }

        .guides-header-inner {
          width: 100%;
          max-width: 1280px;
          padding: 0 20px;
          margin: 0 auto;
        }

        .guides-title {
          margin: 0;
          font-family: "Barabara", sans-serif !important;
          font-size: clamp(1.65rem, 2.8vw, 2.4rem);
          font-weight: 400;
          line-height: 0.95;
          letter-spacing: 0.015em;
          color: ${CALBAYOG_BLUE};
        }

        .guides-subtitle {
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

        /* ================================================
           CONTAINER
        ================================================ */

        .guides-container {
          width: 100%;
          max-width: 1280px !important;
          padding: 0 20px 60px !important;
          margin: 0 auto;
        }

        /* ================================================
           ALERT
        ================================================ */

        .guides-alert {
          margin: 0 0 22px;
          border: 1px solid #f0d2d2;
          border-radius: 12px;
          font-family: "Nunito", sans-serif;
          font-size: 0.76rem;
        }

        .guides-alert-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .guides-retry-button {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 10px;
          border: 1px solid #d7a7a7;
          border-radius: 8px;
          background: #ffffff;
          color: #9a3d3d;
          font-family: "Nunito", sans-serif;
          font-size: 0.68rem;
          font-weight: 800;
          cursor: pointer;
        }

        /* ================================================
           RESULTS BAR
        ================================================ */

        .results-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          flex-wrap: wrap;
          margin-bottom: 27px;
          padding: 11px 2px;
          border-top: 1px solid #f0f1f5;
          border-bottom: 1px solid #f0f1f5;
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
          background: #eef0ff;
          color: ${CALBAYOG_BLUE};
        }

        .results-label {
          font-family: "Nunito", sans-serif;
          font-size: 0.64rem;
          color: #8b8f9e;
          line-height: 1.2;
        }

        .results-count {
          margin-top: 2px;
          font-family: "Poppins", sans-serif;
          font-size: 0.74rem;
          font-weight: 700;
          color: #252738;
        }

        .results-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .results-category {
          font-family: "Nunito", sans-serif;
          font-size: 0.69rem;
          font-weight: 700;
          color: #85899a;
        }

        /* ================================================
           GRID
        ================================================ */

        .guides-grid {
          row-gap: 25px !important;
          margin-left: -12px;
          margin-right: -12px;
        }

        .guide-col {
          padding-left: 12px;
          padding-right: 12px;
          display: flex;
        }

        /* ================================================
           CARD
        ================================================ */

        .guide-card {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 100%;
          overflow: hidden;
          border: 1px solid #e5e6f2 !important;
          border-radius: 18px !important;
          background: #ffffff !important;
          box-shadow:
            0 5px 20px rgba(30, 32, 80, 0.055) !important;
          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease,
            border-color 0.25s ease;
        }

        .guide-card::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 3px;
          background: ${CALBAYOG_BLUE};
          opacity: 0;
          transition: opacity 0.25s ease;
        }

        .guide-card:hover {
          transform: translateY(-4px);
          border-color: #d1d4f1 !important;
          box-shadow:
            0 14px 32px rgba(30, 32, 80, 0.11) !important;
        }

        .guide-card:hover::after {
          opacity: 1;
        }

        /* ================================================
           CARD TOP
        ================================================ */

        .guide-card-top {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 17px 17px 15px;
          background:
            linear-gradient(
              135deg,
              #eef0ff 0%,
              #f8f8ff 100%
            );
          border-bottom: 1px solid #e4e5f5;
        }

        .guide-icon-circle {
          width: 46px;
          height: 46px;
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: #ffffff;
          color: ${CALBAYOG_BLUE};
          border: 1px solid #dfe1f5;
          box-shadow:
            0 4px 12px rgba(45, 49, 149, 0.08);
        }

        .guide-top-info {
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 5px;
        }

        .guide-label {
          color: ${CALBAYOG_BLUE};
          font-family: "Nunito", sans-serif;
          font-size: 0.58rem;
          font-weight: 900;
          letter-spacing: 0.09em;
        }

        .guide-location-label {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #81859d;
          font-family: "Nunito", sans-serif;
          font-size: 0.61rem;
          font-weight: 700;
        }

        /* ================================================
           CARD BODY
        ================================================ */

        .guide-card-body {
          display: flex;
          flex-direction: column;
          padding: 17px !important;
        }

        .guide-name {
          margin: 0 !important;
          color: #171b2d !important;
          font-family:
            "Poppins",
            "Nunito",
            sans-serif !important;
          font-size: 1rem !important;
          line-height: 1.3 !important;
          font-weight: 700 !important;
          letter-spacing: -0.012em;
          overflow-wrap: anywhere;
        }

        /* ================================================
           PHONE INFORMATION
        ================================================ */

        .guide-phone {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 12px;
          padding: 10px 11px;
          border-radius: 12px;
          background: #f2f3ff;
          border: 1px solid #e0e2f8;
        }

        .guide-phone-icon {
          width: 33px;
          height: 33px;
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: ${CALBAYOG_BLUE};
          color: #ffffff;
        }

        .guide-phone-content {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .guide-phone-label {
          font-family: "Nunito", sans-serif;
          font-size: 0.54rem;
          line-height: 1.2;
          font-weight: 900;
          letter-spacing: 0.07em;
          color: #8b8fa8;
        }

        .guide-phone-number {
          color: ${CALBAYOG_BLUE};
          font-family: "Poppins", sans-serif;
          font-size: 0.77rem;
          line-height: 1.35;
          font-weight: 700;
          word-break: break-word;
        }

        .guide-phone-empty {
          background: #f7f7fb;
          border-color: #e8e8f0;
        }

        .guide-phone-empty .guide-phone-icon {
          background: #dfe1eb;
          color: #687087;
        }

        .guide-no-phone {
          color: #8b8f9e;
          font-family: "Nunito", sans-serif;
          font-size: 0.67rem;
          font-weight: 600;
        }

        /* ================================================
           LOADING
        ================================================ */

        .guides-loading {
          min-height: 360px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .guides-loading-icon {
          width: 58px;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
          border-radius: 17px;
          background: #eef0ff;
          color: ${CALBAYOG_BLUE};
        }

        .guides-loading-title {
          font-family: "Poppins", sans-serif;
          font-size: 0.84rem;
          font-weight: 700;
          color: #252738;
        }

        .guides-loading-text {
          margin: 4px 0 0;
          font-family: "Nunito", sans-serif;
          font-size: 0.72rem;
          color: #85899a;
        }

        /* ================================================
           EMPTY STATE
        ================================================ */

        .guides-empty {
          padding: 65px 20px;
          text-align: center;
          border: 1px solid #e9eaf4;
          border-radius: 20px;
          background: #fafaff;
        }

        .guides-empty-icon {
          width: 70px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 15px;
          border-radius: 21px;
          background: #eef0ff;
          color: ${CALBAYOG_BLUE};
        }

        .guides-empty h3 {
          margin: 0 0 6px;
          font-family: "Poppins", sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #252738;
        }

        .guides-empty p {
          max-width: 370px;
          margin: 0 auto;
          font-family: "Nunito", sans-serif;
          font-size: 0.78rem;
          line-height: 1.5;
          color: #85899a;
        }

        .guides-empty-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          margin-top: 18px;
          padding: 9px 13px;
          border: 1px solid #d9dcf5;
          border-radius: 10px;
          background: #ffffff;
          color: ${CALBAYOG_BLUE};
          font-family: "Nunito", sans-serif;
          font-size: 0.7rem;
          font-weight: 800;
          cursor: pointer;
          transition:
            background 0.2s ease,
            border-color 0.2s ease,
            transform 0.2s ease;
        }

        .guides-empty-button:hover {
          background: #eef0ff;
          border-color: #cbd0f2;
          transform: translateY(-1px);
        }

        /* ================================================
           RESPONSIVE
        ================================================ */

        @media (max-width: 991.98px) {
          .guides-header {
            padding: 28px 20px 18px;
          }

          .guides-title {
            font-size: clamp(1.65rem, 4.5vw, 2.25rem);
          }

          .guides-grid {
            row-gap: 30px !important;
          }
        }

        @media (max-width: 767.98px) {
          .guides-header {
            padding: 25px 17px 16px;
          }

          .guides-title {
            font-size: 1.9rem;
          }

          .guides-subtitle {
            margin-top: 6px;
            font-size: 0.78rem;
          }

          .guides-container {
            padding-top: 0 !important;
            padding-left: 17px !important;
            padding-right: 17px !important;
          }

          .results-bar {
            align-items: flex-start;
          }

          .results-right {
            width: 100%;
            justify-content: space-between;
          }

          .guides-grid {
            row-gap: 24px !important;
          }
        }

        @media (max-width: 479.98px) {
          .guides-title {
            font-size: 1.8rem;
          }

          .guides-subtitle {
            font-size: 0.77rem;
          }

          .guide-card-body {
            padding: 16px !important;
          }

          .guide-name {
            font-size: 0.96rem !important;
          }

          .guide-card-top {
            padding: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default Guides;