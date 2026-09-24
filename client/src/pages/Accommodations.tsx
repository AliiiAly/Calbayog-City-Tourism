import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Button, Spinner } from "react-bootstrap";

import {
  ArrowUpRight,
  Building2,
  Globe2,
  Hotel,
  MapPin,
  Phone,
} from "lucide-react";

import { getAccommodations, clearCache } from "../services/api";

import {
  subscribeToAccommodations,
  unsubscribeAll,
} from "../services/supabase";

/* =========================================================
   BRAND COLOR

   Matches Attractions.tsx so the two pages read as one
   consistent dashboard.
========================================================= */

const CALBAYOG_BLUE = "#2D3195";

/* =========================================================
   ACCOMMODATION RECORD

   Mirrors exactly what AdminAccommodations.tsx manages —
   no fields are shown here that the admin panel doesn't
   actually let staff edit (no category/type, no amenities,
   no rating, no operating hours, no email, no separate
   price_min/price_max).
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

const normalizeText = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).toLowerCase().trim().replace(/\s+/g, " ");
};

const normalizeArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeAccommodation = (value: any): AccommodationItem => ({
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

const getAccommodationId = (accommodation: AccommodationItem): string => {
  return String(accommodation?.id ?? "").trim();
};

const getWebsiteHref = (website: string): string => {
  if (!website) return "";

  if (/^https?:\/\//i.test(website)) {
    return website;
  }

  return `https://${website}`;
};

const buildDirectionsUrl = (accommodation: AccommodationItem): string => {
  const query = [
    accommodation.name,
    accommodation.address,
    "Calbayog City, Samar, Philippines",
  ]
    .filter(Boolean)
    .join(", ");

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    query,
  )}`;
};

/* =========================================================
   ACCOMMODATIONS COMPONENT
========================================================= */

const Accommodations: React.FC = () => {
  /* =========================================================
     PAGE STATE
  ========================================================= */

  const [accommodations, setAccommodations] = useState<AccommodationItem[]>(
    [],
  );

  const [loading, setLoading] = useState(true);

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  /* =========================================================
     IMAGE ROTATION
  ========================================================= */

  const [imageIndexes, setImageIndexes] = useState<Record<string, number>>(
    {},
  );

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

      const data = Array.isArray(response?.data) ? response.data : [];

      const normalized = data
        .map(normalizeAccommodation)
        .filter((item: AccommodationItem) => item.id && item.name);

      setAccommodations(normalized);
      setImageIndexes({});
    } catch (error) {
      console.error("Failed to fetch accommodations:", error);

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

        accommodations.forEach((accommodation) => {
          const images = accommodation.images;

          const accommodationId = getAccommodationId(accommodation);

          if (accommodationId && images.length > 1) {
            const currentIndex = previous[accommodationId] || 0;

            next[accommodationId] = (currentIndex + 1) % images.length;
          }
        });

        return next;
      });
    }, 5500);

    return () => {
      window.clearInterval(interval);
    };
  }, [accommodations]);

  /* =========================================================
     FAVORITE TOGGLE

     Local, UI-only — there is no favorites field on the
     accommodations record (AdminAccommodations doesn't
     manage one), so this simply lets a visitor mark cards
     for their own session.
  ========================================================= */

  const toggleFavorite = (
    event: React.MouseEvent<HTMLButtonElement>,
    accommodationId: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setFavoriteIds((previous) => {
      const next = new Set(previous);

      if (next.has(accommodationId)) {
        next.delete(accommodationId);
      } else {
        next.add(accommodationId);
      }

      return next;
    });
  };

  /* =========================================================
     RESULT LABEL
  ========================================================= */

  const resultCount = accommodations.length;

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
          <h1 className="accommodations-title">ACCOMMODATIONS</h1>

          <p className="accommodations-subtitle">
            Find comfortable hotels, resorts, inns, and places to stay
            during your Calbayog City adventure.
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
                <Hotel size={18} strokeWidth={1.9} />
              </div>

              <div>
                <div className="results-label">Showing</div>

                <div className="results-count">
                  <strong>{resultCount}</strong> accommodation
                  {resultCount !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            <div className="results-right">
              <span className="results-category">All accommodations</span>
            </div>
          </div>
        )}

        {/* ===================================================
            LOADING
        =================================================== */}

        {loading ? (
          <div className="accommodations-loading">
            <div className="loading-icon">
              <Spinner animation="border" size="sm" />
            </div>

            <div className="loading-title">Discovering places to stay...</div>

            <p className="loading-subtitle">Please wait a moment.</p>
          </div>
        ) : accommodations.length === 0 ? (
          /* =================================================
             EMPTY STATE
          ================================================= */

          <div className="empty-state">
            <div className="empty-icon">
              <Hotel size={30} strokeWidth={1.6} />
            </div>

            <h3>No accommodations yet</h3>

            <p>
              There are no accommodations listed yet. Please check back
              soon.
            </p>

            <Button
              variant="outline-primary"
              onClick={() => void fetchAccommodations()}
              className="empty-button"
            >
              <Hotel size={15} strokeWidth={1.8} />
              Refresh
            </Button>
          </div>
        ) : (
          /* =================================================
             ACCOMMODATION GRID
          ================================================= */

          <Row className="accommodations-grid">
            {accommodations.map((accommodation) => {
              const accommodationId = getAccommodationId(accommodation);

              const images = accommodation.images;

              const currentImageIndex = imageIndexes[accommodationId] || 0;

              const currentImage =
                images.length > 0
                  ? images[currentImageIndex % images.length]
                  : "";

              const isFavorite = favoriteIds.has(accommodationId);

              const description = accommodation.description || "";

              const address = accommodation.address || "";

              const priceRange = accommodation.price_range || "";

              const website = accommodation.website || "";

              const phone = accommodation.contact_number || "";

              return (
                <Col
                  xs={12}
                  sm={6}
                  lg={3}
                  key={accommodationId || accommodation.name}
                  className="accommodation-col"
                >
                  <div className="accommodation-card">
                    {/* =====================================
                         IMAGE
                      ===================================== */}

                    <div className="accommodation-image-wrap">
                      <Link
                        to={`/accommodations/${accommodationId}`}
                        className="accommodation-image-link"
                      >
                        {currentImage ? (
                          <img
                            src={currentImage}
                            alt={accommodation.name || "Accommodation"}
                            className="accommodation-image"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="accommodation-image-placeholder">
                            <Hotel size={34} strokeWidth={1.5} />

                            <span className="accommodation-image-placeholder-text">
                              No image
                            </span>
                          </div>
                        )}

                        {priceRange && (
                          <div className="accommodation-image-price-badge">
                            {priceRange}
                          </div>
                        )}

                        {images.length > 1 && (
                          <div className="accommodation-image-dots">
                            {images
                              .slice(0, 6)
                              .map((_: string, index: number) => (
                                <span
                                  key={index}
                                  className={`accommodation-image-dot ${
                                    index === currentImageIndex % images.length
                                      ? "accommodation-image-dot-active"
                                      : ""
                                  }`}
                                />
                              ))}
                          </div>
                        )}
                      </Link>

                      {/* FAVORITE */}

                      <button
                        type="button"
                        className={`accommodation-favorite-button ${
                          isFavorite ? "accommodation-favorite-active" : ""
                        }`}
                        onClick={(event) =>
                          toggleFavorite(event, accommodationId)
                        }
                        aria-label={
                          isFavorite
                            ? `Remove ${
                                accommodation.name || "accommodation"
                              } from favorites`
                            : `Add ${
                                accommodation.name || "accommodation"
                              } to favorites`
                        }
                      >
                        <svg
                          width="19"
                          height="19"
                          viewBox="0 0 24 24"
                          fill={isFavorite ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                    </div>

                    {/* =====================================
                         CARD BODY
                      ===================================== */}

                    <div className="accommodation-card-body">
                      <Link
                        to={`/accommodations/${accommodationId}`}
                        className="accommodation-content-link"
                      >
                        <div className="accommodation-name">
                          {accommodation.name || "Unnamed Accommodation"}
                        </div>

                        {address && (
                          <div className="accommodation-location">
                            <MapPin size={15} strokeWidth={1.8} />

                            <span>{address}</span>
                          </div>
                        )}

                        {description && (
                          <p className="accommodation-description">
                            {description.slice(0, 150)}

                            {description.length > 150 ? "..." : ""}
                          </p>
                        )}
                      </Link>

                      {/* =================================
                           BOTTOM ROW
                        ================================= */}

                      <div className="accommodation-bottom-row">
                        <div className="accommodation-contact-summary">
                          {phone && (
                            <a
                              href={`tel:${phone}`}
                              className="accommodation-action-link"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <Phone size={13} strokeWidth={1.8} />
                              Call
                            </a>
                          )}

                          {website && (
                            <a
                              href={getWebsiteHref(website)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(event) => event.stopPropagation()}
                              className="accommodation-action-link"
                            >
                              <Globe2 size={13} strokeWidth={1.8} />
                              Website
                            </a>
                          )}

                          {address && (
                            <a
                              href={buildDirectionsUrl(accommodation)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(event) => event.stopPropagation()}
                              className="accommodation-action-link"
                            >
                              <MapPin size={13} strokeWidth={1.8} />
                              Directions
                            </a>
                          )}
                        </div>

                        <Link
                          to={`/accommodations/${accommodationId}`}
                          className="accommodation-view-details-link"
                        >
                          View details
                          <ArrowUpRight size={15} strokeWidth={1.9} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        )}
      </Container>

      {/* =====================================================
          PAGE STYLES

          Class names and layout intentionally mirror
          Attractions.tsx so the two pages feel like one
          consistent dashboard.
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
          font-family: "Nunito", "Poppins", "Segoe UI", sans-serif;
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
           CARD
        ===================================================== */

        .accommodation-card {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .accommodation-image-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 5;
          overflow: hidden;
          border-radius: 18px;
          background: #eef2ef;
        }

        .accommodation-image-link {
          position: absolute;
          inset: 0;
          display: block;
          overflow: hidden;
          text-decoration: none;
        }

        .accommodation-image {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          object-position: center;
          transition:
            transform 0.65s cubic-bezier(0.2, 0.65, 0.3, 1),
            filter 0.35s ease;
        }

        .accommodation-card:hover .accommodation-image {
          transform: scale(1.035);
        }

        .accommodation-card:hover .accommodation-image-wrap {
          box-shadow: 0 12px 32px rgba(20, 30, 24, 0.11);
        }

        .accommodation-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: ${CALBAYOG_BLUE};
          background: linear-gradient(135deg, #eef0ff, #f8faf9);
        }

        .accommodation-image-placeholder-text {
          color: #64706a;
          font-family: "Nunito", sans-serif;
          font-size: 0.68rem;
          line-height: 1.2;
          font-weight: 800;
          letter-spacing: 0.02em;
        }

        .accommodation-image-price-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          max-width: calc(100% - 66px);
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.93);
          color: #242925;
          box-shadow: 0 3px 12px rgba(0, 0, 0, 0.09);
          backdrop-filter: blur(10px);
          font-family: "Nunito", sans-serif;
          font-size: 0.61rem;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          z-index: 3;
        }

        .accommodation-favorite-button {
          position: absolute;
          top: 11px;
          right: 11px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.94);
          color: #222724;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.11);
          backdrop-filter: blur(10px);
          cursor: pointer;
          z-index: 5;
          transition:
            transform 0.2s ease,
            background 0.2s ease,
            color 0.2s ease;
        }

        .accommodation-favorite-button:hover {
          transform: scale(1.08);
          background: #ffffff;
        }

        .accommodation-favorite-button:active {
          transform: scale(0.92);
        }

        .accommodation-favorite-active {
          color: #e94b58;
          animation: accommodationFavoritePop 0.3s ease;
        }

        @keyframes accommodationFavoritePop {
          0% {
            transform: scale(0.85);
          }
          55% {
            transform: scale(1.18);
          }
          100% {
            transform: scale(1);
          }
        }

        .accommodation-image-dots {
          position: absolute;
          left: 50%;
          bottom: 11px;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 5px;
          z-index: 4;
          padding: 5px 8px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.13);
          backdrop-filter: blur(7px);
        }

        .accommodation-image-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.62);
          transition:
            width 0.25s ease,
            background 0.25s ease;
        }

        .accommodation-image-dot-active {
          width: 7px;
          background: #ffffff;
        }

        /* =====================================================
           CARD BODY
        ===================================================== */

        .accommodation-card-body {
          padding: 13px 2px 0;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .accommodation-content-link {
          display: block;
          color: inherit;
          text-decoration: none;
        }

        .accommodation-name {
          margin: 0;
          color: #171b18;
          font-family: "Poppins", "Nunito", sans-serif;
          font-size: 0.91rem;
          line-height: 1.3;
          font-weight: 700;
          letter-spacing: -0.012em;
        }

        .accommodation-location {
          display: flex;
          align-items: flex-start;
          gap: 5px;
          margin-top: 5px;
          color: #747d77;
          font-family: "Nunito", sans-serif;
          font-size: 0.68rem;
          line-height: 1.4;
          font-weight: 600;
        }

        .accommodation-location svg {
          flex: 0 0 auto;
          margin-top: 1px;
        }

        .accommodation-description {
          margin: 7px 0 0;
          color: #707973;
          font-family: "Nunito", sans-serif;
          font-size: 0.7rem;
          line-height: 1.5;
          font-weight: 500;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* =====================================================
           BOTTOM ROW
        ===================================================== */

        .accommodation-bottom-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: auto;
          padding-top: 10px;
          margin-top: 10px;
          border-top: 1px solid #f0f2f0;
        }

        .accommodation-contact-summary {
          display: flex;
          align-items: center;
          gap: 11px;
          flex-wrap: wrap;
          min-width: 0;
        }

        .accommodation-action-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #727b76;
          font-family: "Nunito", sans-serif;
          font-size: 0.61rem;
          font-weight: 800;
          text-decoration: none;
          transition:
            color 0.2s ease,
            transform 0.2s ease;
        }

        .accommodation-action-link:hover {
          color: ${CALBAYOG_BLUE};
          transform: translateY(-1px);
        }

        .accommodation-view-details-link {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          color: #171b18;
          font-family: "Nunito", sans-serif;
          font-size: 0.62rem;
          font-weight: 800;
          text-decoration: none;
          transition:
            color 0.2s ease,
            transform 0.2s ease;
        }

        .accommodation-view-details-link:hover {
          color: ${CALBAYOG_BLUE};
          transform: translateX(2px);
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

        @media (max-width: 991.98px) {
          .accommodations-header {
            padding: 28px 20px 18px;
          }

          .accommodations-title {
            font-size: clamp(1.65rem, 4.5vw, 2.25rem);
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

          .accommodation-name {
            font-size: 0.94rem;
          }

          .accommodation-favorite-button {
            width: 39px;
            height: 39px;
          }
        }
      `}</style>
    </div>
  );
};

export default Accommodations;
