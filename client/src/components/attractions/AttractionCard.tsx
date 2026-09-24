import React from "react";
import { Link } from "react-router-dom";

import { Card } from "react-bootstrap";

import {
  ArrowUpRight,
  Clock3,
  Globe2,
  Heart,
  MapPin,
  Star,
  Ticket,
} from "lucide-react";

import { Destination } from "../../types";

import { useFavorites } from "../../context/FavoritesContext";

const CALBAYOG_BLUE = "#2D3195";

interface AttractionCardProps {
  attraction: Destination;
  imageIndex?: number;
  showFavoriteCount?: boolean;
  showFeatured?: boolean;
  compact?: boolean;
}

/* =========================================================
   HELPERS
========================================================= */

const getAttractionId = (
  attraction: Destination,
): string => {
  return String(
    (attraction as any)?.id ?? "",
  ).trim();
};

/* =========================================================
   COMPONENT
========================================================= */

const AttractionCard: React.FC<
  AttractionCardProps
> = ({
  attraction,
  imageIndex = 0,
  showFavoriteCount = true,
  showFeatured = true,
  compact = false,
}) => {
  const {
    isFavorite,
    getFavoriteCount,
    toggleFavorite,
  } = useFavorites();

  /* =========================================================
     BASIC DATA
  ========================================================= */

  const attractionId =
    getAttractionId(attraction);

  const liked = attractionId
    ? isFavorite(
        "attraction",
        attractionId,
      )
    : false;

  const favoriteCount =
    attractionId
      ? getFavoriteCount(
          "attraction",
          attractionId,
        )
      : 0;

  const item = attraction as any;

  /* =========================================================
     IMAGES
  ========================================================= */

  const images =
    Array.isArray(
      attraction.images,
    )
      ? attraction.images.filter(
          Boolean,
        )
      : [];

  const safeImageIndex =
    images.length > 0
      ? imageIndex % images.length
      : 0;

  const currentImage =
    images.length > 0
      ? images[safeImageIndex]
      : "";

  /* =========================================================
     CONTENT
  ========================================================= */

  const description =
    attraction.short_description ||
    attraction.description ||
    "";

  const attractionType =
    item.attraction_type;

  const rating =
    item.rating ??
    item.average_rating ??
    item.rating_average ??
    item.review_rating ??
    null;

  const operationalHours =
    item.operational_hours;

  const bestTimeToVisit =
    item.best_time_to_visit;

  const thingsToDo =
    item.things_to_do;

  const website =
    item.website;

  /* =========================================================
     DETAIL URL
  ========================================================= */

  const detailPath =
    attractionId
      ? `/attractions/${encodeURIComponent(
          attractionId,
        )}`
      : "/attractions";

  /* =========================================================
     CATEGORY BACKGROUND
  ========================================================= */

  const categoryBackground =
    (() => {
      switch (
        String(
          attraction.category ||
            "",
        ).toLowerCase()
      ) {
        case "nature":
          return "#e8f5ee";

        case "history and culture":
          return "#f3ece8";

        case "industrial tourism":
          return "#edf1f4";

        case "shopping":
          return "#fff5df";

        default:
          return "#eef1ef";
      }
    })();

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      <Card
        className={`shared-attraction-card ${
          compact
            ? "shared-attraction-card-compact"
            : ""
        }`}
      >
        {/* =====================================================
            IMAGE
        ===================================================== */}

        <div
          className={`shared-attraction-image-wrap ${
            compact
              ? "shared-attraction-image-wrap-compact"
              : ""
          }`}
        >
          <Link
            to={detailPath}
            className="shared-attraction-image-link"
            aria-label={`View ${attraction.name}`}
          >
            {currentImage ? (
              <img
                src={currentImage}
                alt={attraction.name}
                className="shared-attraction-image"
                loading="lazy"
              />
            ) : (
              <div
                className="shared-attraction-image-placeholder"
                style={{
                  background: `linear-gradient(135deg, ${categoryBackground}, #f8faf9)`,
                }}
              >
                <img
                  src="/panda.png"
                  alt="Cute dinosaur sticker"
                  className="shared-attraction-no-image-sticker"
                />

                <span className="shared-attraction-placeholder-text">
                  No image
                </span>
              </div>
            )}

            {/* CATEGORY */}

            {attraction.category && (
              <div className="shared-attraction-category-badge">
                {attraction.category}
              </div>
            )}

            {/* FEATURED */}

            {showFeatured &&
              attraction.featured && (
                <div className="shared-attraction-featured-badge">
                  <Star
                    size={13}
                    strokeWidth={1.8}
                    fill="currentColor"
                  />

                  <span>
                    Featured
                  </span>
                </div>
              )}

            {/* IMAGE DOTS */}

            {images.length > 1 && (
              <div className="shared-attraction-image-dots">
                {images
                  .slice(0, 6)
                  .map(
                    (_, index) => (
                      <span
                        key={index}
                        className={`shared-attraction-image-dot ${
                          index ===
                          safeImageIndex
                            ? "active"
                            : ""
                        }`}
                      />
                    ),
                  )}
              </div>
            )}
          </Link>

          {/* ===================================================
              MODERN FAVORITE
          =================================================== */}

          {attractionId && (
            <div
              className={`shared-attraction-favorite-control ${
                liked
                  ? "is-liked"
                  : ""
              }`}
            >
              <button
                type="button"
                className={`shared-attraction-favorite-button ${
                  liked
                    ? "active"
                    : ""
                }`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();

                  void toggleFavorite(
                    "attraction",
                    attractionId,
                  );
                }}
                aria-label={
                  liked
                    ? `Remove ${attraction.name} from favorites`
                    : `Add ${attraction.name} to favorites`
                }
                aria-pressed={liked}
              >
                {/* HEART GLOW */}

                <span className="favorite-heart-glow" />

                {/* RIPPLE */}

                <span className="favorite-heart-ripple" />

                {/* HEART */}

                <Heart
                  className="favorite-heart-icon"
                  size={22}
                  strokeWidth={
                    liked ? 2.25 : 1.9
                  }
                  fill={
                    liked
                      ? "currentColor"
                      : "none"
                  }
                />

                {/* PARTICLES */}

                {liked && (
                  <>
                    <span className="favorite-particle particle-1" />
                    <span className="favorite-particle particle-2" />
                    <span className="favorite-particle particle-3" />
                    <span className="favorite-particle particle-4" />
                    <span className="favorite-particle particle-5" />
                    <span className="favorite-particle particle-6" />
                  </>
                )}
              </button>

              {/* FAVORITE COUNT */}

              {showFavoriteCount &&
                favoriteCount > 0 && (
                  <span
                    className="shared-attraction-favorite-count"
                    aria-label={`${favoriteCount} users favorited ${attraction.name}`}
                  >
                    {favoriteCount}
                  </span>
                )}
            </div>
          )}
        </div>

        {/* =====================================================
            CARD BODY
        ===================================================== */}

        <Card.Body className="shared-attraction-card-body">
          <Link
            to={detailPath}
            className="shared-attraction-content-link"
          >
            {/* TITLE + RATING */}

            <div className="shared-attraction-title-row">
              <Card.Title className="shared-attraction-name">
                {attraction.name}
              </Card.Title>

              {rating !== null &&
                rating !==
                  undefined &&
                rating !== "" && (
                  <div className="shared-attraction-rating">
                    <Star
                      size={14}
                      strokeWidth={1.7}
                      fill="currentColor"
                    />

                    <span>
                      {Number(
                        rating,
                      )
                        .toFixed(2)
                        .replace(
                          /0$/,
                          "",
                        )}
                    </span>
                  </div>
                )}
            </div>

            {/* LOCATION */}

            {attraction.location_address && (
              <div className="shared-attraction-location">
                <MapPin
                  size={15}
                  strokeWidth={1.8}
                />

                <span>
                  {
                    attraction.location_address
                  }
                </span>
              </div>
            )}

            {/* DESCRIPTION */}

            {description && (
              <p className="shared-attraction-description">
                {description.slice(
                  0,
                  170,
                )}

                {description.length >
                170
                  ? "..."
                  : ""}
              </p>
            )}

            {/* TYPE */}

            {attractionType && (
              <div className="shared-attraction-type">
                {attractionType}
              </div>
            )}

            {/* META */}

            <div className="shared-attraction-meta">
              {operationalHours && (
                <div className="shared-attraction-meta-item">
                  <Clock3
                    size={14}
                    strokeWidth={1.8}
                  />

                  <span>
                    {String(
                      operationalHours,
                    )}
                  </span>
                </div>
              )}

              {bestTimeToVisit && (
                <div className="shared-attraction-meta-item">
                  <span className="shared-attraction-sun">
                    ☀
                  </span>

                  <span>
                    Best time:{" "}
                    {String(
                      bestTimeToVisit,
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* THINGS TO DO */}

            {thingsToDo && (
              <div className="shared-attraction-things-to-do">
                <strong>
                  Things to do:
                </strong>{" "}
                {String(
                  thingsToDo,
                ).slice(
                  0,
                  120,
                )}

                {String(
                  thingsToDo,
                ).length > 120
                  ? "..."
                  : ""}
              </div>
            )}
          </Link>

          {/* =================================================
              BOTTOM ROW
          ================================================= */}

          <div className="shared-attraction-bottom-row">
            {/* ENTRANCE FEE */}

            {attraction.entrance_fee && (
              <div className="shared-attraction-entrance-fee">
                <Ticket
                  size={15}
                  strokeWidth={1.8}
                />

                <span>
                  {
                    attraction.entrance_fee
                  }
                </span>
              </div>
            )}

            {/* ACTIONS */}

            <div className="shared-attraction-card-actions">
              {website && (
                <a
                  href={
                    String(
                      website,
                    ).startsWith(
                      "http",
                    )
                      ? String(
                          website,
                        )
                      : `https://${String(
                          website,
                        )}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                  className="shared-attraction-card-action-link"
                >
                  <Globe2
                    size={14}
                    strokeWidth={1.8}
                  />

                  Website
                </a>
              )}

              <Link
                to={detailPath}
                className="shared-attraction-view-details-link"
              >
                View details

                <ArrowUpRight
                  size={15}
                  strokeWidth={1.9}
                />
              </Link>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* =======================================================
          STYLES
      ======================================================= */}

      <style>{`
        /* =====================================================
           CARD
        ===================================================== */

        .shared-attraction-card {
          width: 100%;
          height: 100%;
          border: none !important;
          border-radius: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          overflow: visible;
        }

        /* =====================================================
           IMAGE
        ===================================================== */

        .shared-attraction-image-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 5;
          min-height: 0;
          overflow: hidden;
          border-radius: 18px;
          background: #eef2ef;

          transition:
            box-shadow 0.28s ease;
        }

        .shared-attraction-image-wrap-compact {
          border-radius: 18px;
        }

        .shared-attraction-card:hover
          .shared-attraction-image-wrap {
          box-shadow:
            0 12px 32px
            rgba(
              20,
              30,
              24,
              0.11
            );
        }

        .shared-attraction-image-link {
          position: absolute;
          inset: 0;

          display: block;

          overflow: hidden;

          text-decoration: none;

          cursor: pointer;
        }

        .shared-attraction-image {
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

        .shared-attraction-card:hover
          .shared-attraction-image {
          transform:
            scale(
              1.035
            );
        }

        /* =====================================================
           IMAGE PLACEHOLDER
        ===================================================== */

        .shared-attraction-image-placeholder {
          width: 100%;
          height: 100%;

          display: flex;

          flex-direction: column;

          align-items: center;
          justify-content: center;

          gap: 6px;

          overflow: hidden;
        }

        .shared-attraction-no-image-sticker {
          width: 72%;
          max-width: 180px;

          height: auto;

          max-height: 150px;

          object-fit: contain;

          display: block;

          filter:
            drop-shadow(
              0 8px 14px
              rgba(
                20,
                30,
                24,
                0.12
              )
            );

          transition:
            transform 0.3s ease,
            filter 0.3s ease;
        }

        .shared-attraction-placeholder-text {
          color: #64706a;

          font-size: 0.68rem;

          line-height: 1.2;

          font-weight: 800;

          letter-spacing: 0.02em;
        }

        .shared-attraction-card:hover
          .shared-attraction-no-image-sticker {
          transform:
            translateY(-2px)
            scale(
              1.035
            );

          filter:
            drop-shadow(
              0 10px 17px
              rgba(
                20,
                30,
                24,
                0.15
              )
            );
        }

        /* =====================================================
           CATEGORY BADGE
        ===================================================== */

        .shared-attraction-category-badge {
          position: absolute;

          top: 12px;
          left: 12px;

          max-width:
            calc(
              100% - 82px
            );

          padding:
            7px 10px;

          border-radius: 999px;

          background:
            rgba(
              255,
              255,
              255,
              0.93
            );

          color: #242925;

          box-shadow:
            0 3px 12px
            rgba(
              0,
              0,
              0,
              0.09
            );

          backdrop-filter:
            blur(
              10px
            );

          font-size: 0.61rem;

          font-weight: 800;

          white-space: nowrap;

          overflow: hidden;

          text-overflow: ellipsis;

          z-index: 3;
        }

        /* =====================================================
           FEATURED
        ===================================================== */

        .shared-attraction-featured-badge {
          position: absolute;

          top: 12px;
          left: 12px;

          transform:
            translateY(
              43px
            );

          display: inline-flex;

          align-items: center;

          gap: 5px;

          padding:
            6px 9px;

          border-radius: 999px;

          background:
            rgba(
              255,
              249,
              232,
              0.95
            );

          color: #9b6400;

          box-shadow:
            0 3px 12px
            rgba(
              0,
              0,
              0,
              0.08
            );

          backdrop-filter:
            blur(
              10px
            );

          font-size: 0.6rem;

          font-weight: 800;

          z-index: 3;
        }

        /* =====================================================
           MODERN FAVORITE CONTAINER
        ===================================================== */

        .shared-attraction-favorite-control {
          position: absolute;

          top: 11px;
          right: 11px;

          z-index: 8;

          display: flex;

          flex-direction: column;

          align-items: center;

          gap: 3px;

          pointer-events: none;
        }

        /* =====================================================
           HEART BUTTON
           
           No white circle.
        ===================================================== */

        .shared-attraction-favorite-button {
          position: relative;

          width: 44px;
          height: 44px;

          display: flex;

          align-items: center;
          justify-content: center;

          padding: 0;

          border: none !important;
          outline: none !important;

          background:
            transparent !important;

          color:
            rgba(
              255,
              255,
              255,
              0.98
            );

          cursor: pointer;

          pointer-events: auto;

          -webkit-tap-highlight-color:
            transparent;

          transition:
            transform 0.18s
              cubic-bezier(
                0.2,
                0.8,
                0.2,
                1
              ),
            color 0.2s ease,
            filter 0.2s ease;
        }

        /* Dark shadow/glass glow behind heart */

        

        /* =====================================================
           HEART ICON
        ===================================================== */

        .favorite-heart-icon {
  position: relative;

  z-index: 4;

  transform-origin: center;

  filter: none;

  transition:
    transform 0.22s
      cubic-bezier(
        0.34,
        1.56,
        0.64,
        1
      ),
    color 0.22s ease;
}

        /* =====================================================
           HOVER
        ===================================================== */

        .shared-attraction-favorite-button:hover {
          transform:
            scale(
              1.09
            );
        }

       .shared-attraction-favorite-button:hover
  .favorite-heart-icon {
  filter: none;
}
        /* =====================================================
           ACTIVE
        ===================================================== */

        .shared-attraction-favorite-button.active {
          color:
            #ff4f6d;

          animation:
            favoriteButtonPop
            0.48s
            cubic-bezier(
              0.22,
              1.4,
              0.36,
              1
            );
        }

        .shared-attraction-favorite-button.active
  .favorite-heart-icon {
  animation:
    favoriteHeartPop
    0.52s
    cubic-bezier(
      0.34,
      1.56,
      0.64,
      1
    );

  filter: none;
}

        /* =====================================================
           HEART GLOW
        ===================================================== */

        .favorite-heart-glow {
          position: absolute;

          width: 29px;
          height: 29px;

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(
                255,
                79,
                109,
                0.48
              ) 0%,
              rgba(
                255,
                79,
                109,
                0.19
              ) 32%,
              transparent 72%
            );

          opacity: 0;

          transform:
            scale(
              0.55
            );

          filter:
            blur(
              7px
            );

          z-index: 1;

          pointer-events:
            none;
        }

        .shared-attraction-favorite-button.active
          .favorite-heart-glow {
          animation:
            favoriteGlow
            0.7s
            ease-out;
        }

        /* =====================================================
           RIPPLE
        ===================================================== */

        .favorite-heart-ripple {
          position: absolute;

          width: 20px;
          height: 20px;

          border-radius:
            50%;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.48
            );

          opacity: 0;

          transform:
            scale(
              0.35
            );

          pointer-events:
            none;

          z-index: 0;
        }

        .shared-attraction-favorite-button.active
          .favorite-heart-ripple {
          animation:
            favoriteRipple
            0.62s
            ease-out;
        }

        /* =====================================================
           PARTICLES
        ===================================================== */

        .favorite-particle {
          position: absolute;

          width: 4px;
          height: 4px;

          border-radius: 50%;

          background:
            #ff5b73;

          opacity: 0;

          z-index: 2;

          pointer-events:
            none;
        }

        .shared-attraction-favorite-button.active
          .favorite-particle {
          animation:
            favoriteParticle
            0.62s
            ease-out
            forwards;
        }

        .particle-1 {
          top: 5px;
          left: 50%;

          --particle-x:
            0px;

          --particle-y:
            -20px;

          animation-delay:
            0s !important;
        }

        .particle-2 {
          top: 12px;
          right: 4px;

          width: 3px;
          height: 3px;

          --particle-x:
            13px;

          --particle-y:
            -13px;

          animation-delay:
            0.03s !important;
        }

        .particle-3 {
          right: 8px;
          bottom: 7px;

          width: 4px;
          height: 4px;

          --particle-x:
            14px;

          --particle-y:
            8px;

          animation-delay:
            0.06s !important;
        }

        .particle-4 {
          left: 7px;
          bottom: 7px;

          width: 3px;
          height: 3px;

          --particle-x:
            -14px;

          --particle-y:
            8px;

          animation-delay:
            0.09s !important;
        }

        .particle-5 {
          top: 11px;
          left: 4px;

          width: 4px;
          height: 4px;

          --particle-x:
            -13px;

          --particle-y:
            -13px;

          animation-delay:
            0.12s !important;
        }

        .particle-6 {
          top: 3px;
          right: 11px;

          width: 3px;
          height: 3px;

          --particle-x:
            8px;

          --particle-y:
            -18px;

          animation-delay:
            0.15s !important;
        }

        /* =====================================================
           BUTTON PRESS
        ===================================================== */

        .shared-attraction-favorite-button:active {
          transform:
            scale(
              0.87
            );
        }

        /* =====================================================
           ANIMATIONS
        ===================================================== */

        @keyframes favoriteButtonPop {
          0% {
            transform:
              scale(
                0.78
              );
          }

          35% {
            transform:
              scale(
                1.16
              );
          }

          58% {
            transform:
              scale(
                0.96
              );
          }

          78% {
            transform:
              scale(
                1.08
              );
          }

          100% {
            transform:
              scale(
                1
              );
          }
        }

        @keyframes favoriteHeartPop {
          0% {
            transform:
              scale(
                0.55
              )
              rotate(
                -8deg
              );
          }

          28% {
            transform:
              scale(
                1.28
              )
              rotate(
                5deg
              );
          }

          48% {
            transform:
              scale(
                0.90
              )
              rotate(
                -2deg
              );
          }

          72% {
            transform:
              scale(
                1.12
              )
              rotate(
                1deg
              );
          }

          100% {
            transform:
              scale(
                1
              )
              rotate(
                0
              );
          }
        }

        @keyframes favoriteGlow {
          0% {
            opacity: 0;

            transform:
              scale(
                0.45
              );
          }

          35% {
            opacity: 1;

            transform:
              scale(
                1.6
              );
          }

          100% {
            opacity: 0;

            transform:
              scale(
                2.25
              );
          }
        }

        @keyframes favoriteRipple {
          0% {
            opacity: 0.65;

            transform:
              scale(
                0.4
              );
          }

          100% {
            opacity: 0;

            transform:
              scale(
                2.5
              );
          }
        }

        @keyframes favoriteParticle {
          0% {
            opacity: 0;

            transform:
              translate(
                0,
                0
              )
              scale(
                0.4
              );
          }

          25% {
            opacity: 1;
          }

          100% {
            opacity: 0;

            transform:
              translate(
                var(
                  --particle-x
                ),
                var(
                  --particle-y
                )
              )
              scale(
                0
              );
          }
        }

        /* =====================================================
           COUNT
        ===================================================== */

        .shared-attraction-favorite-count {
          min-width: 22px;
          min-height: 18px;

          display: inline-flex;

          align-items: center;
          justify-content: center;

          padding:
            2px 5px;

          color:
            rgba(
              255,
              255,
              255,
              0.96
            );

          font-size:
            0.62rem;

          line-height:
            1;

          font-weight:
            800;

          text-shadow:
            0 1px 4px
            rgba(
              0,
              0,
              0,
              0.45
            );

          pointer-events:
            none;

          animation:
            favoriteCountAppear
            0.24s
            ease-out;
        }

        @keyframes favoriteCountAppear {
          from {
            opacity:
              0;

            transform:
              translateY(
                -4px
              )
              scale(
                0.8
              );
          }

          to {
            opacity:
              1;

            transform:
              translateY(
                0
              )
              scale(
                1
              );
          }
        }

        /* =====================================================
           IMAGE DOTS
        ===================================================== */

        .shared-attraction-image-dots {
          position:
            absolute;

          left:
            50%;

          bottom:
            11px;

          transform:
            translateX(
              -50%
            );

          display:
            flex;

          align-items:
            center;

          gap:
            5px;

          z-index:
            4;

          padding:
            5px 8px;

          border-radius:
            999px;

          background:
            rgba(
              0,
              0,
              0,
              0.13
            );

          backdrop-filter:
            blur(
              7px
            );
        }

        .shared-attraction-image-dot {
          width:
            6px;

          height:
            6px;

          border-radius:
            50%;

          background:
            rgba(
              255,
              255,
              255,
              0.62
            );
        }

        .shared-attraction-image-dot.active {
          width:
            7px;

          background:
            #ffffff;
        }

        /* =====================================================
           CARD BODY
        ===================================================== */

        .shared-attraction-card-body {
          padding:
            13px 2px 0 !important;
        }

        .shared-attraction-content-link {
          display:
            block;

          color:
            inherit;

          text-decoration:
            none;

          cursor:
            pointer;
        }

        .shared-attraction-title-row {
          display:
            flex;

          align-items:
            flex-start;

          justify-content:
            space-between;

          gap:
            8px;
        }

        .shared-attraction-name {
          margin:
            0 !important;

          color:
            #171b18 !important;

          font-size:
            0.91rem !important;

          line-height:
            1.3 !important;

          font-weight:
            700 !important;
        }

        .shared-attraction-rating {
          flex:
            0 0 auto;

          display:
            inline-flex;

          align-items:
            center;

          gap:
            4px;

          padding-top:
            2px;

          color:
            #1f2421;

          font-size:
            0.7rem;

          font-weight:
            800;

          white-space:
            nowrap;
        }

        .shared-attraction-location {
          display:
            flex;

          align-items:
            flex-start;

          gap:
            5px;

          margin-top:
            5px;

          color:
            #747d77;

          font-size:
            0.68rem;

          line-height:
            1.4;

          font-weight:
            600;
        }

        .shared-attraction-location svg {
          flex:
            0 0 auto;

          margin-top:
            1px;
        }

        .shared-attraction-description {
          margin:
            7px 0 0;

          color:
            #707973;

          font-size:
            0.7rem;

          line-height:
            1.5;

          font-weight:
            500;

          display:
            -webkit-box;

          -webkit-line-clamp:
            2;

          -webkit-box-orient:
            vertical;

          overflow:
            hidden;
        }

        .shared-attraction-type {
          display:
            block;

          margin-top:
            8px;

          color:
            ${CALBAYOG_BLUE};

          font-size:
            0.63rem;

          font-weight:
            800;

          letter-spacing:
            0.045em;

          text-transform:
            uppercase;
        }

        .shared-attraction-meta {
          display:
            flex;

          align-items:
            center;

          flex-wrap:
            wrap;

          gap:
            7px 11px;

          margin-top:
            7px;
        }

        .shared-attraction-meta-item {
          display:
            inline-flex;

          align-items:
            center;

          gap:
            5px;

          color:
            #858d88;

          font-size:
            0.62rem;

          line-height:
            1.4;

          font-weight:
            600;
        }

        .shared-attraction-sun {
          font-size:
            0.73rem;
        }

        .shared-attraction-things-to-do {
          margin-top:
            7px;

          color:
            #858d88;

          font-size:
            0.62rem;

          line-height:
            1.45;

          font-weight:
            600;
        }

        .shared-attraction-things-to-do strong {
          color:
            ${CALBAYOG_BLUE};
        }

        .shared-attraction-bottom-row {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            8px;

          margin-top:
            10px;

          padding-top:
            10px;

          border-top:
            1px solid #f0f2f0;
        }

        .shared-attraction-entrance-fee {
          display:
            inline-flex;

          align-items:
            center;

          gap:
            5px;

          color:
            ${CALBAYOG_BLUE};

          font-size:
            0.62rem;

          font-weight:
            800;

          min-width:
            0;
        }

        .shared-attraction-card-actions {
          display:
            flex;

          align-items:
            center;

          justify-content:
            flex-end;

          flex-wrap:
            wrap;

          gap:
            8px;

          margin-left:
            auto;
        }

        .shared-attraction-card-action-link,
        .shared-attraction-view-details-link {
          display:
            inline-flex;

          align-items:
            center;

          gap:
            4px;

          text-decoration:
            none;

          font-size:
            0.61rem;

          font-weight:
            800;
        }

        .shared-attraction-card-action-link {
          color:
            #727b76;
        }

        .shared-attraction-view-details-link {
          color:
            #171b18;

          gap:
            3px;
        }

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 767.98px) {
          .shared-attraction-image-wrap {
            aspect-ratio:
              4 / 5;

            border-radius:
              17px;
          }

          .shared-attraction-favorite-button {
            width:
              40px;

            height:
              40px;
          }
        }

        @media (max-width: 479.98px) {
          .shared-attraction-favorite-control {
            top:
              9px;

            right:
              9px;
          }

          .shared-attraction-favorite-button {
            width:
              39px;

            height:
              39px;
          }

          .shared-attraction-favorite-count {
            font-size:
              0.59rem;
          }
        }
      `}</style>
    </>
  );
};

export default AttractionCard;