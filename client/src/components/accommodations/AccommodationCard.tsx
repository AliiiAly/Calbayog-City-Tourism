import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Globe2, Heart, MapPin } from "lucide-react";
import { useFavorites } from "../../context/FavoritesContext";

const CALBAYOG_BLUE = "#2D3195";

export interface AccommodationCardItem {
  id: string;
  name: string;
  owner?: string | null;
  manager?: string | null;
  address?: string | null;
  // Kept for compatibility with API data, but never displayed on this card.
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

const getAccommodationId = (accommodation: AccommodationCardItem): string =>
  String(accommodation?.id ?? "").trim();

const getWebsiteHref = (website: string): string => {
  if (!website) return "";
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
};

const AccommodationCard: React.FC<AccommodationCardProps> = ({
  accommodation,
  imageIndex = 0,
  showFeatured = true,
  compact = false,
}) => {
  const accommodationId = getAccommodationId(accommodation);
  const { isFavorite, getFavoriteCount, toggleFavorite } = useFavorites();

  const liked = accommodationId
    ? isFavorite("accommodation", accommodationId)
    : false;
  const favoriteCount = accommodationId
    ? getFavoriteCount("accommodation", accommodationId)
    : 0;

  const images = Array.isArray(accommodation.images)
    ? accommodation.images.filter(
        (image): image is string =>
          typeof image === "string" && image.trim().length > 0,
      )
    : [];

  const safeImageIndex =
    images.length > 0 ? Math.abs(imageIndex) % images.length : 0;
  const currentImage = images[safeImageIndex] || "";
  const description = accommodation.description || "";
  const address = accommodation.address || "";
  const priceRange = accommodation.price_range || "";
  const website = accommodation.website || "";

  const detailPath = accommodationId
    ? `/accommodations/${encodeURIComponent(accommodationId)}`
    : "/accommodations";

  const handleFavoriteClick = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (accommodationId) {
      void toggleFavorite("accommodation", accommodationId);
    }
  };

  return (
    <>
      <article
        className={`shared-accommodation-card ${
          compact ? "shared-accommodation-card-compact" : ""
        }`}
      >
        <div
          className={`shared-accommodation-image-wrap ${
            compact ? "shared-accommodation-image-wrap-compact" : ""
          }`}
        >
          <Link
            to={detailPath}
            className="shared-accommodation-image-link"
            aria-label={`View ${accommodation.name || "accommodation"}`}
          >
            {currentImage ? (
              <img
                src={currentImage}
                alt={accommodation.name || "Accommodation"}
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

            {priceRange && (
              <div className="shared-accommodation-price-badge">
                {priceRange}
              </div>
            )}

            {showFeatured && accommodation.featured && (
              <div className="shared-accommodation-featured-badge">
                <span>Featured</span>
              </div>
            )}

            {images.length > 1 && (
              <div
                className="shared-accommodation-image-dots"
                aria-label={`Image ${safeImageIndex + 1} of ${images.length}`}
              >
                {images.slice(0, 6).map((_, index) => (
                  <span
                    key={index}
                    className={`shared-accommodation-image-dot ${
                      index === safeImageIndex ? "active" : ""
                    }`}
                  />
                ))}
              </div>
            )}
          </Link>

          {accommodationId && (
            <div className="shared-accommodation-favorite-control">
              <button
                type="button"
                className={`shared-accommodation-favorite-button ${
                  liked ? "active" : ""
                }`}
                onClick={handleFavoriteClick}
                aria-label={
                  liked
                    ? `Remove ${accommodation.name} from favorites`
                    : `Add ${accommodation.name} to favorites`
                }
                aria-pressed={liked}
              >
                <span className="favorite-heart-glow" />
                <span className="favorite-heart-ripple" />
                <Heart
                  size={22}
                  strokeWidth={liked ? 2.25 : 1.9}
                  fill={liked ? "currentColor" : "none"}
                  className="favorite-heart-icon"
                />
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
              {favoriteCount > 0 && (
                <span
                  className="shared-accommodation-favorite-count"
                  aria-label={`${favoriteCount} users favorited ${accommodation.name}`}
                >
                  {favoriteCount}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="shared-accommodation-card-body">
          <Link to={detailPath} className="shared-accommodation-content-link">
            <div className="shared-accommodation-title-row">
              <div className="shared-accommodation-name">
                {accommodation.name || "Unnamed Accommodation"}
              </div>
            </div>

            {address && (
              <div className="shared-accommodation-location">
                <MapPin size={15} strokeWidth={1.8} aria-hidden="true" />
                <span>{address}</span>
              </div>
            )}

            {description && (
              <p className="shared-accommodation-description">
                {description.slice(0, 170)}
                {description.length > 170 ? "..." : ""}
              </p>
            )}

            {(accommodation.owner || accommodation.manager) && (
              <div className="shared-accommodation-contact-info">
                {accommodation.owner ? (
                  <span>Owner: {accommodation.owner}</span>
                ) : accommodation.manager ? (
                  <span>Manager: {accommodation.manager}</span>
                ) : null}
              </div>
            )}
          </Link>

          <div className="shared-accommodation-bottom-row">
            <div className="shared-accommodation-card-actions">
              {website && (
                <a
                  href={getWebsiteHref(website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shared-accommodation-action-link"
                  onClick={(event) => event.stopPropagation()}
                >
                  <Globe2 size={14} strokeWidth={1.8} aria-hidden="true" />
                  <span>Website</span>
                </a>
              )}
            </div>

            <Link
              to={detailPath}
              className="shared-accommodation-view-details-link"
            >
              <span>View details</span>
              <ArrowUpRight size={15} strokeWidth={1.9} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </article>

      <style>{`
        .shared-accommodation-card {
          --accommodation-blue: ${CALBAYOG_BLUE};
          width: 100%;
          min-width: 0;
          height: 100%;
          display: flex;
          flex-direction: column;
          border: 0;
          background: transparent;
          color: #171b18;
        }

        .shared-accommodation-image-wrap {
          position: relative;
          isolation: isolate;
          width: 100%;
          aspect-ratio: 4 / 5;
          min-height: 180px;
          overflow: hidden;
          border-radius: 18px;
          background: #eef2ef;
          transition: box-shadow .28s ease, border-radius .28s ease;
        }

        .shared-accommodation-image-wrap-compact {
          aspect-ratio: 5 / 4;
        }

        .shared-accommodation-card:hover .shared-accommodation-image-wrap {
          box-shadow: 0 12px 32px rgba(20, 30, 24, .11);
        }

        .shared-accommodation-image-link {
          position: absolute;
          inset: 0;
          display: block;
          overflow: hidden;
          color: inherit;
          text-decoration: none;
        }

        .shared-accommodation-image {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          transition: transform .65s cubic-bezier(.2, .65, .3, 1);
        }

        @media (hover: hover) and (pointer: fine) {
          .shared-accommodation-card:hover .shared-accommodation-image {
            transform: scale(1.035);
          }
        }

        .shared-accommodation-image-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #eef0ff, #f8faf9);
        }

        .shared-accommodation-no-image-sticker {
          width: 72%;
          max-width: 180px;
          max-height: 150px;
          object-fit: contain;
          filter: drop-shadow(0 8px 14px rgba(20, 30, 24, .12));
        }

        .shared-accommodation-placeholder-text {
          color: #64706a;
          font-size: .68rem;
          font-weight: 800;
        }

        .shared-accommodation-price-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 3;
          max-width: calc(100% - 82px);
          padding: 7px 10px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255, 255, 255, .93);
          color: #242925;
          box-shadow: 0 3px 12px rgba(0, 0, 0, .09);
          backdrop-filter: blur(10px);
          font-size: .61rem;
          font-weight: 800;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .shared-accommodation-featured-badge {
          position: absolute;
          top: 55px;
          left: 12px;
          z-index: 3;
          display: inline-flex;
          align-items: center;
          max-width: calc(100% - 24px);
          padding: 6px 9px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255, 249, 232, .95);
          color: #9b6400;
          box-shadow: 0 3px 12px rgba(0, 0, 0, .08);
          backdrop-filter: blur(10px);
          font-size: .6rem;
          font-weight: 800;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .shared-accommodation-favorite-control {
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

        .shared-accommodation-favorite-button {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          padding: 0;
          border: 0 !important;
          outline: none !important;
          background: transparent !important;
          color: rgba(255, 255, 255, .98);
          cursor: pointer;
          pointer-events: auto;
          -webkit-tap-highlight-color: transparent;
          transition: transform .18s cubic-bezier(.2, .8, .2, 1), color .2s ease;
        }

        .shared-accommodation-favorite-button:hover { transform: scale(1.09); }
        .shared-accommodation-favorite-button:active { transform: scale(.87); }

        .shared-accommodation-favorite-button:focus-visible {
          border-radius: 50%;
          outline: 2px solid #fff !important;
          outline-offset: 2px;
        }

        .shared-accommodation-favorite-button.active {
          color: #ff4f6d;
          animation: favoriteButtonPop .48s cubic-bezier(.22, 1.4, .36, 1);
        }

        .favorite-heart-icon {
          position: relative;
          z-index: 4;
          transform-origin: center;
          transition: transform .22s cubic-bezier(.34, 1.56, .64, 1), color .22s ease;
        }

        .shared-accommodation-favorite-button.active .favorite-heart-icon {
          animation: favoriteHeartPop .52s cubic-bezier(.34, 1.56, .64, 1);
        }

        .favorite-heart-glow {
          position: absolute;
          z-index: 1;
          width: 29px;
          height: 29px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 79, 109, .48) 0%, rgba(255, 79, 109, .19) 32%, transparent 72%);
          opacity: 0;
          transform: scale(.55);
          filter: blur(7px);
          pointer-events: none;
        }

        .shared-accommodation-favorite-button.active .favorite-heart-glow {
          animation: favoriteGlow .7s ease-out;
        }

        .favorite-heart-ripple {
          position: absolute;
          z-index: 0;
          width: 20px;
          height: 20px;
          border: 1px solid rgba(255, 255, 255, .48);
          border-radius: 50%;
          opacity: 0;
          transform: scale(.35);
          pointer-events: none;
        }

        .shared-accommodation-favorite-button.active .favorite-heart-ripple {
          animation: favoriteRipple .62s ease-out;
        }

        .favorite-particle {
          position: absolute;
          z-index: 2;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #ff5b73;
          opacity: 0;
          pointer-events: none;
        }

        .shared-accommodation-favorite-button.active .favorite-particle {
          animation: favoriteParticle .62s ease-out forwards;
        }

        .particle-1 { top: 5px; left: 50%; --particle-x: 0px; --particle-y: -20px; }
        .particle-2 { top: 12px; right: 4px; --particle-x: 13px; --particle-y: -13px; }
        .particle-3 { right: 8px; bottom: 7px; --particle-x: 14px; --particle-y: 8px; }
        .particle-4 { left: 7px; bottom: 7px; --particle-x: -14px; --particle-y: 8px; }
        .particle-5 { top: 11px; left: 4px; --particle-x: -13px; --particle-y: -13px; }
        .particle-6 { top: 3px; right: 11px; --particle-x: 8px; --particle-y: -18px; }

        .shared-accommodation-favorite-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 22px;
          min-height: 18px;
          padding: 2px 5px;
          color: rgba(255, 255, 255, .96);
          font-size: .62rem;
          line-height: 1;
          font-weight: 800;
          text-shadow: 0 1px 4px rgba(0, 0, 0, .45);
          pointer-events: none;
          animation: favoriteCountAppear .24s ease-out;
        }

        @keyframes favoriteButtonPop {
          0% { transform: scale(.78); }
          35% { transform: scale(1.16); }
          58% { transform: scale(.96); }
          78% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        @keyframes favoriteHeartPop {
          0% { transform: scale(.55) rotate(-8deg); }
          28% { transform: scale(1.28) rotate(5deg); }
          48% { transform: scale(.90) rotate(-2deg); }
          72% { transform: scale(1.12) rotate(1deg); }
          100% { transform: scale(1) rotate(0); }
        }
        @keyframes favoriteGlow {
          0% { opacity: 0; transform: scale(.45); }
          35% { opacity: 1; transform: scale(1.6); }
          100% { opacity: 0; transform: scale(2.25); }
        }
        @keyframes favoriteRipple {
          0% { opacity: .65; transform: scale(.4); }
          100% { opacity: 0; transform: scale(2.5); }
        }
        @keyframes favoriteParticle {
          0% { opacity: 0; transform: translate(0, 0) scale(.4); }
          25% { opacity: 1; }
          100% { opacity: 0; transform: translate(var(--particle-x), var(--particle-y)) scale(0); }
        }
        @keyframes favoriteCountAppear {
          from { opacity: 0; transform: translateY(-4px) scale(.8); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .shared-accommodation-image-dots {
          position: absolute;
          bottom: 11px;
          left: 50%;
          z-index: 4;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          border-radius: 999px;
          background: rgba(0, 0, 0, .13);
          backdrop-filter: blur(7px);
          transform: translateX(-50%);
        }

        .shared-accommodation-image-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, .62);
        }
        .shared-accommodation-image-dot.active {
          width: 7px;
          background: #fff;
        }

        .shared-accommodation-card-body {
          display: flex;
          flex: 1 1 auto;
          flex-direction: column;
          min-width: 0;
          min-height: 150px;
          padding: 13px 2px 0;
        }

        .shared-accommodation-content-link {
          display: block;
          min-width: 0;
          color: inherit;
          text-decoration: none;
        }

        .shared-accommodation-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          min-width: 0;
        }

        .shared-accommodation-name {
          margin: 0;
          overflow-wrap: anywhere;
          color: #171b18;
          font-size: .91rem;
          line-height: 1.3;
          font-weight: 700;
        }

        .shared-accommodation-location {
          display: flex;
          align-items: flex-start;
          gap: 5px;
          min-width: 0;
          margin-top: 5px;
          color: #747d77;
          font-size: .68rem;
          line-height: 1.4;
          font-weight: 600;
          overflow-wrap: anywhere;
        }

        .shared-accommodation-location svg {
          flex: 0 0 auto;
          margin-top: 1px;
        }

        .shared-accommodation-description {
          display: -webkit-box;
          margin: 7px 0 0;
          overflow: hidden;
          color: #707973;
          font-size: .7rem;
          line-height: 1.5;
          font-weight: 500;
          overflow-wrap: anywhere;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        /* Owner/manager may be shown; phone/contact_number is never rendered. */
        .shared-accommodation-contact-info {
          margin-top: 8px;
          color: var(--accommodation-blue);
          font-size: .62rem;
          line-height: 1.4;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .shared-accommodation-bottom-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          min-width: 0;
          margin-top: auto;
          padding-top: 10px;
          border-top: 1px solid #f0f2f0;
        }

        .shared-accommodation-card-actions {
          display: flex;
          flex: 1 1 auto;
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
          max-width: 100%;
          text-decoration: none;
          font-size: .61rem;
          font-weight: 800;
        }

        .shared-accommodation-action-link {
          color: #727b76;
          overflow-wrap: anywhere;
        }
        .shared-accommodation-action-link:hover {
          color: var(--accommodation-blue);
        }

        .shared-accommodation-view-details-link {
          flex: 0 0 auto;
          gap: 3px;
          color: #171b18;
          white-space: nowrap;
        }
        .shared-accommodation-view-details-link:hover {
          color: var(--accommodation-blue);
        }
        .shared-accommodation-view-details-link:focus-visible,
        .shared-accommodation-action-link:focus-visible,
        .shared-accommodation-content-link:focus-visible,
        .shared-accommodation-image-link:focus-visible {
          outline: 2px solid var(--accommodation-blue);
          outline-offset: 3px;
          border-radius: 4px;
        }

        /* Large desktop and wide screens */
        @media (min-width: 1400px) {
          .shared-accommodation-image-wrap { border-radius: 20px; }
          .shared-accommodation-card-body { padding-top: 15px; }
          .shared-accommodation-name { font-size: .96rem; }
          .shared-accommodation-description { font-size: .73rem; }
        }

        /* Standard laptops / tablets in landscape */
        @media (min-width: 768px) and (max-width: 1199.98px) {
          .shared-accommodation-image-wrap { border-radius: 16px; }
          .shared-accommodation-card-body { padding-top: 11px; }
          .shared-accommodation-bottom-row { gap: 6px; }
          .shared-accommodation-action-link,
          .shared-accommodation-view-details-link { font-size: .6rem; }
        }

        /* Tablets and phones */
        @media (max-width: 767.98px) {
          .shared-accommodation-image-wrap { border-radius: 17px; }
          .shared-accommodation-favorite-button { width: 40px; height: 40px; }
          .shared-accommodation-card-body { min-height: 140px; }
          .shared-accommodation-name { font-size: .9rem; }
          .shared-accommodation-bottom-row { gap: 6px; }
        }

        @media (max-width: 575.98px) {
          .shared-accommodation-image-wrap { aspect-ratio: 4 / 4.6; }
          .shared-accommodation-card-body { padding-top: 10px; }
          .shared-accommodation-name { font-size: .88rem; }
          .shared-accommodation-location { font-size: .67rem; }
          .shared-accommodation-description { font-size: .69rem; }
          .shared-accommodation-bottom-row {
            align-items: flex-start;
            flex-wrap: wrap;
          }
          .shared-accommodation-card-actions { flex-basis: auto; }
          .shared-accommodation-view-details-link { margin-left: auto; }
        }

        @media (max-width: 479.98px) {
          .shared-accommodation-image-wrap { border-radius: 15px; }
          .shared-accommodation-favorite-control { top: 9px; right: 9px; }
          .shared-accommodation-favorite-button { width: 39px; height: 39px; }
          .shared-accommodation-favorite-count { font-size: .59rem; }
          .shared-accommodation-price-badge { top: 9px; left: 9px; padding: 6px 8px; }
          .shared-accommodation-featured-badge { top: 47px; left: 9px; }
          .shared-accommodation-bottom-row { padding-top: 8px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .shared-accommodation-card *,
          .shared-accommodation-card *::before,
          .shared-accommodation-card *::after {
            scroll-behavior: auto !important;
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>
    </>
  );
};

export default AccommodationCard;
