import React, { useEffect, useRef, useState } from "react";
import { Container, Row, Col, Button, Spinner } from "react-bootstrap";
import { Hotel } from "lucide-react";

import { getAccommodations, clearCache } from "../services/api";

import {
  subscribeToAccommodations,
  unsubscribeAll,
} from "../services/supabase";

import AccommodationCard from "../components/accommodations/AccommodationCard";

/* =========================================================
   BRAND COLOR
========================================================= */

const CALBAYOG_BLUE = "#2D3195";

/* =========================================================
   ACCOMMODATION RECORD

   Matches the accommodation data managed by the admin
   accommodation system.
========================================================= */

interface AccommodationItem {
  id: string;
  name: string;
  owner: string | null;
  manager: string | null;
  address: string | null;
  contact_number: string | null;
  website: string | null;
  images: string[];
  description: string | null;
  price_range: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/* =========================================================
   HELPERS
========================================================= */

const normalizeArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeAccommodation = (
  value: any,
): AccommodationItem => ({
  id: String(value?.id ?? value?._id ?? "").trim(),
  name: String(value?.name ?? "").trim(),
  owner: value?.owner ?? null,
  manager: value?.manager ?? null,
  address: value?.address ?? null,
  contact_number: value?.contact_number ?? null,
  website: value?.website ?? null,
  images: normalizeArray(value?.images),
  description: value?.description ?? null,
  price_range: value?.price_range ?? null,
  created_at: value?.created_at ?? null,
  updated_at: value?.updated_at ?? null,
});

const getAccommodationId = (
  accommodation: AccommodationItem,
): string => {
  return String(accommodation?.id ?? "").trim();
};

/* =========================================================
   ACCOMMODATIONS COMPONENT
========================================================= */

const Accommodations: React.FC = () => {
  /* =========================================================
     PAGE STATE
  ========================================================= */

  const [
    accommodations,
    setAccommodations,
  ] = useState<AccommodationItem[]>([]);

  const [loading, setLoading] = useState(true);

  /* =========================================================
     IMAGE ROTATION

     The reusable AccommodationCard receives the current
     image index so the page can continue rotating images.
  ========================================================= */

  const [
    imageIndexes,
    setImageIndexes,
  ] = useState<Record<string, number>>({});

  /* =========================================================
     FETCH LOCK
  ========================================================= */

  const fetchLock = useRef(false);

  /* =========================================================
     FETCH ACCOMMODATIONS
  ========================================================= */

  const fetchAccommodations = async () => {
    if (fetchLock.current) {
      return;
    }

    fetchLock.current = true;
    setLoading(true);

    try {
      clearCache("accommodations");

      const response = await getAccommodations();

      const data = Array.isArray(response?.data)
        ? response.data
        : [];

      const normalized = data
        .map(normalizeAccommodation)
        .filter(
          (item: AccommodationItem) =>
            item.id && item.name,
        );

      setAccommodations(normalized);

      setImageIndexes({});
    } catch (error) {
      console.error(
        "Failed to fetch accommodations:",
        error,
      );

      setAccommodations([]);
    } finally {
      fetchLock.current = false;
      setLoading(false);
    }
  };

  /* =========================================================
     INITIAL FETCH + REALTIME
  ========================================================= */

  useEffect(() => {
    void fetchAccommodations();

    subscribeToAccommodations(() => {
      void fetchAccommodations();
    });

    return () => {
      unsubscribeAll();
    };
  }, []);

  /* =========================================================
     AUTO IMAGE ROTATION
  ========================================================= */

  useEffect(() => {
    if (accommodations.length === 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setImageIndexes((previous) => {
        const next = { ...previous };

        accommodations.forEach(
          (accommodation) => {
            const images = accommodation.images;

            const accommodationId =
              getAccommodationId(
                accommodation,
              );

            if (
              accommodationId &&
              images.length > 1
            ) {
              const currentIndex =
                previous[accommodationId] || 0;

              next[accommodationId] =
                (currentIndex + 1) %
                images.length;
            }
          },
        );

        return next;
      });
    }, 5500);

    return () => {
      window.clearInterval(interval);
    };
  }, [accommodations]);

  /* =========================================================
     RESULT COUNT
  ========================================================= */

  const resultCount =
    accommodations.length;

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="page-enter accommodations-page">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="accommodations-header">
        <div className="accommodations-header-inner">
          <h1 className="accommodations-title">
            ACCOMMODATIONS
          </h1>

          <p className="accommodations-subtitle">
            Find comfortable hotels, resorts, inns, and
            places to stay during your Calbayog City
            adventure.
          </p>
        </div>
      </section>

      {/* =====================================================
          BODY
      ===================================================== */}

      <Container className="accommodations-container">
        {/* ===================================================
            RESULTS BAR
        =================================================== */}

        {!loading && (
          <div className="results-bar">
            <div className="results-left">
              <div className="results-icon">
                <Hotel
                  size={18}
                  strokeWidth={1.9}
                />
              </div>

              <div>
                <div className="results-label">
                  Showing
                </div>

                <div className="results-count">
                  <strong>
                    {resultCount}
                  </strong>{" "}
                  accommodation
                  {resultCount !== 1
                    ? "s"
                    : ""}
                </div>
              </div>
            </div>

            <div className="results-right">
              <span className="results-category">
                All accommodations
              </span>
            </div>
          </div>
        )}

        {/* ===================================================
            LOADING
        =================================================== */}

        {loading ? (
          <div className="accommodations-loading">
            <div className="loading-icon">
              <Spinner
                animation="border"
                size="sm"
              />
            </div>

            <div className="loading-title">
              Discovering places to stay...
            </div>

            <p className="loading-subtitle">
              Please wait a moment.
            </p>
          </div>
        ) : accommodations.length ===
          0 ? (
          /* =================================================
             EMPTY STATE
          ================================================= */

          <div className="empty-state">
            <div className="empty-icon">
              <Hotel
                size={30}
                strokeWidth={1.6}
              />
            </div>

            <h3>
              No accommodations yet
            </h3>

            <p>
              There are no accommodations
              listed yet. Please check back
              soon.
            </p>

            <Button
              variant="outline-primary"
              onClick={() =>
                void fetchAccommodations()
              }
              className="empty-button"
            >
              <Hotel
                size={15}
                strokeWidth={1.8}
              />
              Refresh
            </Button>
          </div>
        ) : (
          /* =================================================
             ACCOMMODATION GRID
          ================================================= */

          <Row className="accommodations-grid">
            {accommodations.map(
              (accommodation) => {
                const accommodationId =
                  getAccommodationId(
                    accommodation,
                  );

                const currentImageIndex =
                  imageIndexes[
                    accommodationId
                  ] || 0;

                return (
                  <Col
                    xs={12}
                    sm={6}
                    lg={3}
                    key={
                      accommodationId ||
                      accommodation.name
                    }
                    className="accommodation-col"
                  >
                    <AccommodationCard
                      accommodation={
                        accommodation
                      }
                      imageIndex={
                        currentImageIndex
                      }
                    />
                  </Col>
                );
              },
            )}
          </Row>
        )}
      </Container>

      {/* =====================================================
          PAGE STYLES

          Card-specific styling now lives inside
          AccommodationCard.tsx.

          This file only keeps page-level layout,
          header, loading and empty-state styling.
      ===================================================== */}

      <style>{`
        @font-face {
          font-family: "Barabara";
          src: url("/fonts/BARABARA-final.otf")
            format("opentype");
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }

        .accommodations-page {
          min-height: 100vh;
          background: #ffffff;
          color: #171a18;
        }

        .accommodations-header {
          width: 100%;
          background: #ffffff;
          padding: 30px 20px 18px;
        }

        .accommodations-header-inner {
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
        }

        .accommodations-title {
          margin: 0;
          font-family: "Barabara", sans-serif !important;
          font-size: clamp(1.65rem, 2.8vw, 2.4rem);
          font-weight: 400;
          line-height: 0.95;
          letter-spacing: 0.015em;
          color: ${CALBAYOG_BLUE};
        }

        .accommodations-subtitle {
          max-width: 590px;
          margin: 6px 0 0;
          font-family: "Nunito", "Poppins",
            "Segoe UI", sans-serif;
          font-size: 0.81rem;
          line-height: 1.55;
          font-weight: 500;
          color: #737b76;
        }

        .accommodations-container {
          width: 100%;
          max-width: 1240px;
          padding: 20px 0 60px;
          margin: 0 auto;
        }

        /* =====================================================
           RESULTS BAR
        ===================================================== */

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
          background: #eef0ff;
          color: ${CALBAYOG_BLUE};
        }

        .results-label {
          font-family: "Nunito", sans-serif;
          font-size: 0.64rem;
          color: #8b938e;
          line-height: 1.2;
        }

        .results-count {
          margin-top: 2px;
          font-family: "Poppins", sans-serif;
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
          font-family: "Nunito", sans-serif;
          font-size: 0.69rem;
          font-weight: 700;
          color: #858d88;
        }

        /* =====================================================
           GRID
        ===================================================== */

        .accommodations-grid {
          row-gap: 46px !important;
          margin-left: -12px;
          margin-right: -12px;
        }

        .accommodation-col {
          padding-left: 12px;
          padding-right: 12px;
          display: flex;
        }

        /* =====================================================
           LOADING
        ===================================================== */

        .accommodations-loading {
          min-height: 360px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 0;
        }

        .loading-icon {
          width: 58px;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 13px;
          border-radius: 17px;
          background: #eef0ff;
        }

        .loading-icon .spinner-border {
          color: ${CALBAYOG_BLUE};
        }

        .loading-title {
          font-family: "Poppins", sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          color: #202521;
        }

        .loading-subtitle {
          margin: 4px 0 0;
          color: #89918c;
          font-family: "Nunito", sans-serif;
          font-size: 0.72rem;
        }

        /* =====================================================
           EMPTY STATE
        ===================================================== */

        .empty-state {
          text-align: center;
          padding: 65px 20px;
          border: 1px solid #edf1ee;
          border-radius: 20px;
          background: #fafcfb;
        }

        .empty-icon {
          width: 68px;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 15px;
          border-radius: 20px;
          color: ${CALBAYOG_BLUE};
          background: #eef0ff;
        }

        .empty-state h3 {
          margin: 0 0 7px;
          color: #202521;
          font-family: "Poppins", sans-serif;
          font-size: 1rem;
          font-weight: 700;
        }

        .empty-state p {
          max-width: 380px;
          margin: 0 auto 18px;
          color: #7e8781;
          font-family: "Nunito", sans-serif;
          font-size: 0.77rem;
          line-height: 1.55;
        }

        .empty-button {
          display: inline-flex !important;
          align-items: center;
          gap: 6px;
          border-radius: 999px !important;
          padding: 8px 16px !important;
          font-size: 0.73rem !important;
          font-weight: 800 !important;
        }

        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 991.98px) {
          .accommodations-header {
            padding: 28px 20px 18px;
          }

          .accommodations-title {
            font-size: clamp(
              1.65rem,
              4.5vw,
              2.25rem
            );
          }

          .accommodations-grid {
            row-gap: 40px !important;
          }
        }

        @media (max-width: 767.98px) {
          .accommodations-header {
            padding: 25px 17px 16px;
          }

          .accommodations-title {
            font-size: 1.9rem;
          }

          .accommodations-subtitle {
            margin-top: 6px;
            font-size: 0.78rem;
          }

          .accommodations-container {
            padding-top: 12px;
            padding-left: 17px;
            padding-right: 17px;
          }

          .results-bar {
            align-items: flex-start;
          }

          .results-right {
            width: 100%;
            justify-content: space-between;
          }

          .accommodations-grid {
            row-gap: 36px !important;
          }

          .accommodation-col {
            padding-left: 12px;
            padding-right: 12px;
          }
        }

        @media (max-width: 479.98px) {
          .accommodations-title {
            font-size: 1.8rem;
          }

          .accommodations-subtitle {
            font-size: 0.77rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Accommodations;
