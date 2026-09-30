import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Globe2,
  Heart,
  MapPin,
  Phone,
  Ticket,
} from "lucide-react";

const CALBAYOG_BLUE = "#2D3195";

export interface AccommodationCardItem {
  id: string;
  name: string;
  owner?: string | null;
  manager?: string | null;
  address?: string | null;
  contact_number?: string | null;
  website?: string | null;
  images?: string[];
  description?: string | null;
  price_range?: string | null;
  featured?: boolean;
}

interface AccommodationCardProps {
  accommodation: AccommodationCardItem;
  imageIndex?: number;
  showFeatured?: boolean;
  compact?: boolean;
}

const getAccommodationId = (
  accommodation: AccommodationCardItem,
): string => {
  return String(accommodation?.id ?? "").trim();
};

const getWebsiteHref = (website: string): string => {
  if (!website) {
    return "";
  }

  if (/^https?:\/\//i.test(website)) {
    return website;
  }

  return `https://${website}`;
};

const buildDirectionsUrl = (
  accommodation: AccommodationCardItem,
): string => {
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

const AccommodationCard: React.FC<
  AccommodationCardProps
> = ({
  accommodation,
  imageIndex = 0,
  showFeatured = true,
  compact = false,
}) => {
  const accommodationId =
    getAccommodationId(accommodation);

  const [liked, setLiked] =
    React.useState(false);

  const images = Array.isArray(
    accommodation.images,
  )
    ? accommodation.images.filter(Boolean)
    : [];

  const safeImageIndex =
    images.length > 0
      ? imageIndex % images.length
      : 0;

  const currentImage =
    images.length > 0
      ? images[safeImageIndex]
      : "";

  const description =
    accommodation.description || "";

  const address =
    accommodation.address || "";

  const priceRange =
    accommodation.price_range || "";

  const website =
    accommodation.website || "";

  const phone =
    accommodation.contact_number || "";

  const detailPath =
    accommodationId
      ? `/accommodations/${encodeURIComponent(
          accommodationId,
        )}`
      : "/accommodations";

  return (
    <>
      <div
        className={`shared-accommodation-card ${
          compact
            ? "shared-accommodation-card-compact"
            : ""
        }`}
      >
        {/* =====================================================
            IMAGE
        ===================================================== */}

        <div
          className={`shared-accommodation-image-wrap ${
            compact
              ? "shared-accommodation-image-wrap-compact"
              : ""
          }`}
        >
          <Link
            to={detailPath}
            className="shared-accommodation-image-link"
            aria-label={`View ${accommodation.name}`}
          >
            {currentImage ? (
              <img
                src={currentImage}
                alt={accommodation.name}
                className="shared-accommodation-image"
                loading="lazy"
              />
            ) : (
              <div className="shared-accommodation-image-placeholder">
                <img
                  src="/panda.png"
                  alt=""
                  className="shared-accommodation-no-image-sticker"
                />

                <span className="shared-accommodation-placeholder-text">
                  No image
                </span>
              </div>
            )}

            {/* PRICE */}

            {priceRange && (
              <div className="shared-accommodation-price-badge">
                {priceRange}
              </div>
            )}

            {/* FEATURED */}

            {showFeatured &&
              accommodation.featured && (
                <div className="shared-accommodation-featured-badge">
                  <span>Featured</span>
                </div>
              )}

            {/* IMAGE DOTS */}

            {images.length > 1 && (
              <div className="shared-accommodation-image-dots">
                {images
                  .slice(0, 6)
                  .map((_, index) => (
                    <span
                      key={index}
                      className={`shared-accommodation-image-dot ${
                        index === safeImageIndex
                          ? "active"
                          : ""
                      }`}
                    />
                  ))}
              </div>
            )}
          </Link>

          {/* FAVORITE */}

          {accommodationId && (
            <div
              className={`shared-accommodation-favorite-control ${
                liked ? "is-liked" : ""
              }`}
            >
              <button
                type="button"
                className={`shared-accommodation-favorite-button ${
                  liked ? "active" : ""
                }`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();

                  setLiked((previous) => !previous);
                }}
                aria-label={
                  liked
                    ? `Remove ${accommodation.name} from favorites`
                    : `Add ${accommodation.name} to favorites`
                }
                aria-pressed={liked}
              >
                <span className="accommodation-heart-glow" />
                <span className="accommodation-heart-ripple" />

                <Heart
                  size={22}
                  strokeWidth={
                    liked ? 2.25 : 1.9
                  }
                  fill={
                    liked
                      ? "currentColor"
                      : "none"
                  }
                  className="accommodation-heart-icon"
                />

                {liked && (
                  <>
                    <span className="accommodation-particle particle-1" />
                    <span className="accommodation-particle particle-2" />
                    <span className="accommodation-particle particle-3" />
                    <span className="accommodation-particle particle-4" />
                    <span className="accommodation-particle particle-5" />
                    <span className="accommodation-particle particle-6" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* =====================================================
            CARD BODY
        ===================================================== */}

        <div className="shared-accommodation-card-body">
          <Link
            to={detailPath}
            className="shared-accommodation-content-link"
          >
            {/* TITLE */}

            <div className="shared-accommodation-title-row">
              <div className="shared-accommodation-name">
                {accommodation.name ||
                  "Unnamed Accommodation"}
              </div>
            </div>

            {/* LOCATION */}

            {address && (
              <div className="shared-accommodation-location">
                <MapPin
                  size={15}
                  strokeWidth={1.8}
                />

                <span>{address}</span>
              </div>
            )}

            {/* DESCRIPTION */}

            {description && (
              <p className="shared-accommodation-description">
                {description.slice(0, 170)}

                {description.length > 170
                  ? "..."
                  : ""}
              </p>
            )}

            {/* OWNER / MANAGER */}

            {(accommodation.owner ||
              accommodation.manager) && (
              <div className="shared-accommodation-contact-info">
                {accommodation.owner && (
                  <span>
                    Owner:{" "}
                    {accommodation.owner}
                  </span>
                )}

                {!accommodation.owner &&
                  accommodation.manager && (
                    <span>
                      Manager:{" "}
                      {accommodation.manager}
                    </span>
                  )}
              </div>
            )}
          </Link>

          {/* =================================================
              BOTTOM ROW
          ================================================= */}

          <div className="shared-accommodation-bottom-row">
            <div className="shared-accommodation-card-actions">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="shared-accommodation-action-link"
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                >
                  <Phone
                    size={14}
                    strokeWidth={1.8}
                  />

                  Call
                </a>
              )}

              {website && (
                <a
                  href={getWebsiteHref(
                    website,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shared-accommodation-action-link"
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                >
                  <Globe2
                    size={14}
                    strokeWidth={1.8}
                  />

                  Website
                </a>
              )}

              {address && (
                <a
                  href={buildDirectionsUrl(
                    accommodation,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shared-accommodation-action-link"
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                >
                  <MapPin
                    size={14}
                    strokeWidth={1.8}
                  />

                  Directions
                </a>
              )}
            </div>

            <Link
              to={detailPath}
              className="shared-accommodation-view-details-link"
            >
              View details

              <ArrowUpRight
                size={15}
                strokeWidth={1.9}
              />
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .shared-accommodation-card {
          width: 100%;
          height: 100%;
          border: none;
          background: transparent;
        }

        .shared-accommodation-image-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 5;
          overflow: hidden;
          border-radius: 18px;
          background: #eef2ef;
          transition: box-shadow 0.28s ease;
        }

        .shared-accommodation-card:hover
          .shared-accommodation-image-wrap {
          box-shadow:
            0 12px 32px
            rgba(20, 30, 24, 0.11);
        }

        .shared-accommodation-image-link {
          position: absolute;
          inset: 0;
          display: block;
          overflow: hidden;
          text-decoration: none;
        }

        .shared-accommodation-image {
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
              );
        }

        .shared-accommodation-card:hover
          .shared-accommodation-image {
          transform: scale(1.035);
        }

        .shared-accommodation-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: linear-gradient(
            135deg,
            #eef0ff,
            #f8faf9
          );
        }

        .shared-accommodation-no-image-sticker {
          width: 72%;
          max-width: 180px;
          max-height: 150px;
          object-fit: contain;
          filter:
            drop-shadow(
              0 8px 14px
              rgba(20, 30, 24, 0.12)
            );
        }

        .shared-accommodation-placeholder-text {
          color: #64706a;
          font-size: 0.68rem;
          font-weight: 800;
        }

        .shared-accommodation-price-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          max-width: calc(100% - 82px);
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(
            255,
            255,
            255,
            0.93
          );
          color: #242925;
          box-shadow:
            0 3px 12px
            rgba(0, 0, 0, 0.09);
          backdrop-filter: blur(10px);
          font-size: 0.61rem;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          z-index: 3;
        }

        .shared-accommodation-featured-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          transform: translateY(43px);
          display: inline-flex;
          align-items: center;
          padding: 6px 9px;
          border-radius: 999px;
          background: rgba(
            255,
            249,
            232,
            0.95
          );
          color: #9b6400;
          box-shadow:
            0 3px 12px
            rgba(0, 0, 0, 0.08);
          backdrop-filter: blur(10px);
          font-size: 0.6rem;
          font-weight: 800;
          z-index: 3;
        }

        .shared-accommodation-favorite-control {
          position: absolute;
          top: 11px;
          right: 11px;
          z-index: 8;
          display: flex;
          pointer-events: none;
        }

        .shared-accommodation-favorite-button {
          position: relative;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: none;
          outline: none;
          background: transparent;
          color: rgba(
            255,
            255,
            255,
            0.98
          );
          cursor: pointer;
          pointer-events: auto;
          transition:
            transform 0.18s
              cubic-bezier(
                0.2,
                0.8,
                0.2,
                1
              );
        }

        .shared-accommodation-favorite-button:hover {
          transform: scale(1.09);
        }

        .shared-accommodation-favorite-button:active {
          transform: scale(0.87);
        }

        .shared-accommodation-favorite-button.active {
          color: #ff4f6d;
          animation:
            accommodationButtonPop
            0.48s
            cubic-bezier(
              0.22,
              1.4,
              0.36,
              1
            );
        }

        .accommodation-heart-icon {
          position: relative;
          z-index: 4;
          transition:
            transform 0.22s
              cubic-bezier(
                0.34,
                1.56,
                0.64,
                1
              );
        }

        .shared-accommodation-favorite-button.active
          .accommodation-heart-icon {
          animation:
            accommodationHeartPop
            0.52s
            cubic-bezier(
              0.34,
              1.56,
              0.64,
              1
            );
        }

        .accommodation-heart-glow {
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
          transform: scale(0.55);
          filter: blur(7px);
          z-index: 1;
          pointer-events: none;
        }

        .shared-accommodation-favorite-button.active
          .accommodation-heart-glow {
          animation:
            accommodationGlow
            0.7s
            ease-out;
        }

        .accommodation-heart-ripple {
          position: absolute;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.48
            );
          opacity: 0;
          transform: scale(0.35);
          z-index: 0;
        }

        .shared-accommodation-favorite-button.active
          .accommodation-heart-ripple {
          animation:
            accommodationRipple
            0.62s
            ease-out;
        }

        .accommodation-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #ff5b73;
          opacity: 0;
          z-index: 2;
        }

        .shared-accommodation-favorite-button.active
          .accommodation-particle {
          animation:
            accommodationParticle
            0.62s
            ease-out
            forwards;
        }

        .particle-1 {
          top: 5px;
          left: 50%;
          --particle-x: 0px;
          --particle-y: -20px;
        }

        .particle-2 {
          top: 12px;
          right: 4px;
          --particle-x: 13px;
          --particle-y: -13px;
        }

        .particle-3 {
          right: 8px;
          bottom: 7px;
          --particle-x: 14px;
          --particle-y: 8px;
        }

        .particle-4 {
          left: 7px;
          bottom: 7px;
          --particle-x: -14px;
          --particle-y: 8px;
        }

        .particle-5 {
          top: 11px;
          left: 4px;
          --particle-x: -13px;
          --particle-y: -13px;
        }

        .particle-6 {
          top: 3px;
          right: 11px;
          --particle-x: 8px;
          --particle-y: -18px;
        }

        @keyframes accommodationButtonPop {
          0% { transform: scale(0.78); }
          35% { transform: scale(1.16); }
          58% { transform: scale(0.96); }
          78% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }

        @keyframes accommodationHeartPop {
          0% {
            transform:
              scale(0.55)
              rotate(-8deg);
          }
          28% {
            transform:
              scale(1.28)
              rotate(5deg);
          }
          48% {
            transform:
              scale(0.90)
              rotate(-2deg);
          }
          72% {
            transform:
              scale(1.12)
              rotate(1deg);
          }
          100% {
            transform:
              scale(1)
              rotate(0);
          }
        }

        @keyframes accommodationGlow {
          0% {
            opacity: 0;
            transform: scale(0.45);
          }
          35% {
            opacity: 1;
            transform: scale(1.6);
          }
          100% {
            opacity: 0;
            transform: scale(2.25);
          }
        }

        @keyframes accommodationRipple {
          0% {
            opacity: 0.65;
            transform: scale(0.4);
          }
          100% {
            opacity: 0;
            transform: scale(2.5);
          }
        }

        @keyframes accommodationParticle {
          0% {
            opacity: 0;
            transform:
              translate(0, 0)
              scale(0.4);
          }
          25% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform:
              translate(
                var(--particle-x),
                var(--particle-y)
              )
              scale(0);
          }
        }

        .shared-accommodation-image-dots {
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

        .shared-accommodation-image-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(
            255,
            255,
            255,
            0.62
          );
        }

        .shared-accommodation-image-dot.active {
          width: 7px;
          background: #ffffff;
        }

        .shared-accommodation-card-body {
          padding: 13px 2px 0;
          display: flex;
          flex-direction: column;
          min-height: 150px;
        }

        .shared-accommodation-content-link {
          display: block;
          color: inherit;
          text-decoration: none;
        }

        .shared-accommodation-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }

        .shared-accommodation-name {
          margin: 0;
          color: #171b18;
          font-size: 0.91rem;
          line-height: 1.3;
          font-weight: 700;
        }

        .shared-accommodation-location {
          display: flex;
          align-items: flex-start;
          gap: 5px;
          margin-top: 5px;
          color: #747d77;
          font-size: 0.68rem;
          line-height: 1.4;
          font-weight: 600;
        }

        .shared-accommodation-location svg {
          flex: 0 0 auto;
          margin-top: 1px;
        }

        .shared-accommodation-description {
          margin: 7px 0 0;
          color: #707973;
          font-size: 0.7rem;
          line-height: 1.5;
          font-weight: 500;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .shared-accommodation-contact-info {
          margin-top: 8px;
          color: ${CALBAYOG_BLUE};
          font-size: 0.62rem;
          line-height: 1.4;
          font-weight: 800;
        }

        .shared-accommodation-bottom-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-top: auto;
          padding-top: 10px;
          border-top: 1px solid #f0f2f0;
        }

        .shared-accommodation-card-actions {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          flex-wrap: wrap;
          gap: 8px;
          min-width: 0;
        }

        .shared-accommodation-action-link,
        .shared-accommodation-view-details-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          text-decoration: none;
          font-size: 0.61rem;
          font-weight: 800;
        }

        .shared-accommodation-action-link {
          color: #727b76;
        }

        .shared-accommodation-action-link:hover {
          color: ${CALBAYOG_BLUE};
        }

        .shared-accommodation-view-details-link {
          color: #171b18;
          gap: 3px;
          white-space: nowrap;
        }

        .shared-accommodation-view-details-link:hover {
          color: ${CALBAYOG_BLUE};
        }

        @media (max-width: 767.98px) {
          .shared-accommodation-image-wrap {
            border-radius: 17px;
          }

          .shared-accommodation-favorite-button {
            width: 40px;
            height: 40px;
          }
        }

        @media (max-width: 479.98px) {
          .shared-accommodation-favorite-button {
            width: 39px;
            height: 39px;
          }
        }
      `}</style>
    </>
  );
};

export default AccommodationCard;
