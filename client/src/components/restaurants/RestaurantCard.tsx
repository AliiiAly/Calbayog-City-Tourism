
import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Clock,
  Globe2,
  Heart,
  MapPin,
  Utensils,
} from "lucide-react";
import { useFavorites } from "../../context/FavoritesContext";

const CALBAYOG_BLUE = "#2D3195";

export interface RestaurantCardItem {
  id: string;
  name: string;
  description?: string | null;
  short_description?: string | null;
  images?: string[] | null;
  location_address?: string | null;
  contact_phone?: string | null;
  contact_website?: string | null;
  opening_hours?: string | null;
  cuisine_type?: string | null;
  price_range?: string | null;
  featured?: boolean;
  favorites?: number;
  is_active?: boolean;
}

interface RestaurantCardProps {
  restaurant: RestaurantCardItem;
  imageIndex?: number;
  showFeatured?: boolean;
  compact?: boolean;
}

const getWebsiteHref = (website: string): string => {
  if (!website) return "";
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
};

const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  imageIndex = 0,
  showFeatured = true,
  compact = false,
}) => {
  const restaurantId = String(restaurant?.id ?? "").trim();
  const { isFavorite, getFavoriteCount, toggleFavorite } = useFavorites();

  const liked = restaurantId
    ? isFavorite("restaurant", restaurantId)
    : false;

  const favoriteCount = restaurantId
    ? getFavoriteCount("restaurant", restaurantId)
    : 0;

  const images = Array.isArray(restaurant.images)
    ? restaurant.images.filter(
        (image): image is string =>
          typeof image === "string" && image.trim().length > 0,
      )
    : [];

  const safeImageIndex =
    images.length > 0 ? Math.abs(imageIndex) % images.length : 0;

  const currentImage = images[safeImageIndex] || "";
  const description =
    restaurant.short_description || restaurant.description || "";
  const address = restaurant.location_address || "";
  const website = restaurant.contact_website || "";
  const cuisine = restaurant.cuisine_type || "";
  const priceRange = restaurant.price_range || "";
  const openingHours = restaurant.opening_hours || "";

  const detailPath = restaurantId
    ? `/restaurants/${encodeURIComponent(restaurantId)}`
    : "/restaurants";

  const handleFavoriteClick = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (restaurantId) {
      void toggleFavorite("restaurant", restaurantId);
    }
  };

  return (
    <>
      <article
        className={`shared-restaurant-card ${
          compact ? "shared-restaurant-card-compact" : ""
        }`}
      >
        <div className="shared-restaurant-image-wrap">
          <Link
            to={detailPath}
            className="shared-restaurant-image-link"
            aria-label={`View ${restaurant.name}`}
          >
            {currentImage ? (
              <img
                src={currentImage}
                alt={restaurant.name}
                className="shared-restaurant-image"
                loading="lazy"
              />
            ) : (
              <div className="shared-restaurant-image-placeholder">
                <Utensils size={44} />
                <span>No image available</span>
              </div>
            )}

            {priceRange && (
              <span className="shared-restaurant-price-badge">
                {priceRange}
              </span>
            )}

            {showFeatured && restaurant.featured && (
              <span className="shared-restaurant-featured-badge">
                Featured
              </span>
            )}

            {images.length > 1 && (
              <div className="shared-restaurant-image-dots">
                {images.slice(0, 6).map((_, index) => (
                  <span
                    key={index}
                    className={`shared-restaurant-image-dot ${
                      index === safeImageIndex ? "active" : ""
                    }`}
                  />
                ))}
              </div>
            )}
          </Link>

          {restaurantId && (
            <div className="shared-restaurant-favorite-control">
              <button
                type="button"
                className={`shared-restaurant-favorite-button ${
                  liked ? "active" : ""
                }`}
                onClick={handleFavoriteClick}
                aria-label={
                  liked
                    ? `Remove ${restaurant.name} from favorites`
                    : `Add ${restaurant.name} to favorites`
                }
                aria-pressed={liked}
              >
                <span className="favorite-heart-glow" />
                <span className="favorite-heart-ripple" />

                <Heart
                  className="favorite-heart-icon"
                  size={22}
                  strokeWidth={liked ? 2.25 : 1.9}
                  fill={liked ? "currentColor" : "none"}
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
  className="shared-restaurant-favorite-count"
  aria-label={`${favoriteCount} users favorited ${restaurant.name}`}
>
  {favoriteCount}
</span>
              )}
            </div>
          )}
        </div>

        <div className="shared-restaurant-card-body">
          <Link
            to={detailPath}
            className="shared-restaurant-content-link"
          >
            <h3 className="shared-restaurant-name">
              {restaurant.name || "Unnamed Restaurant"}
            </h3>

            {cuisine && (
              <div className="shared-restaurant-cuisine">
                <Utensils size={14} />
                <span>{cuisine}</span>
              </div>
            )}

            {address && (
              <div className="shared-restaurant-location">
                <MapPin size={15} />
                <span>{address}</span>
              </div>
            )}

            {description && (
              <p className="shared-restaurant-description">
                {description.slice(0, 170)}
                {description.length > 170 ? "..." : ""}
              </p>
            )}

            {openingHours && (
              <div className="shared-restaurant-hours">
                <Clock size={14} />
                <span>{openingHours}</span>
              </div>
            )}
          </Link>

          <div className="shared-restaurant-bottom-row">
            <div className="shared-restaurant-actions">
              {website && (
                <a
                  href={getWebsiteHref(website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shared-restaurant-action-link"
                  onClick={(event) => event.stopPropagation()}
                >
                  <Globe2 size={14} />
                  Website
                </a>
              )}
            </div>

            <Link
              to={detailPath}
              className="shared-restaurant-view-details-link"
            >
              View details
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </article>

      <style>{`
        .shared-restaurant-card {
          width: 100%;
          height: 100%;
          background: transparent;
        }

        .shared-restaurant-image-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 5;
          overflow: hidden;
          border-radius: 18px;
          background: #eef2ef;
          transition: box-shadow 0.28s ease;
        }

        .shared-restaurant-card:hover .shared-restaurant-image-wrap {
          box-shadow: 0 12px 32px rgba(20, 30, 24, 0.11);
        }

        .shared-restaurant-image-link {
          position: absolute;
          inset: 0;
          display: block;
          overflow: hidden;
          text-decoration: none;
        }

        .shared-restaurant-image {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          transition: transform 0.65s cubic-bezier(0.2, 0.65, 0.3, 1);
        }

        .shared-restaurant-card:hover .shared-restaurant-image {
          transform: scale(1.035);
        }

        .shared-restaurant-image-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #eef0ff, #f8faf9);
          color: ${CALBAYOG_BLUE};
          font-size: 0.75rem;
          font-weight: 700;
        }

        .shared-restaurant-price-badge,
        .shared-restaurant-featured-badge {
          position: absolute;
          left: 12px;
          padding: 7px 10px;
          border-radius: 999px;
          font-size: 0.65rem;
          font-weight: 800;
          z-index: 3;
        }

        .shared-restaurant-price-badge {
          top: 12px;
          max-width: calc(100% - 80px);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          background: rgba(255, 255, 255, 0.94);
          color: #242925;
        }

        .shared-restaurant-featured-badge {
          top: 48px;
          background: rgba(255, 249, 232, 0.96);
          color: #9b6400;
        }

        /* FAVORITE CONTROL — MATCHES ATTRACTION CARD */

        .shared-restaurant-favorite-control {
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

        .shared-restaurant-favorite-button {
          position: relative;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: none !important;
          outline: none !important;
          background: transparent !important;
          color: rgba(255, 255, 255, 0.98);
          cursor: pointer;
          pointer-events: auto;
          -webkit-tap-highlight-color: transparent;
          transition:
            transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1),
            color 0.2s ease,
            filter 0.2s ease;
        }

        .shared-restaurant-favorite-button:hover {
          transform: scale(1.09);
        }

        .shared-restaurant-favorite-button:active {
          transform: scale(0.87);
        }

        .shared-restaurant-favorite-button.active {
          color: #ff4f6d;
          animation: favoriteButtonPop 0.48s cubic-bezier(0.22, 1.4, 0.36, 1);
        }

        .favorite-heart-icon {
          position: relative;
          z-index: 4;
          transform-origin: center;
          filter: none;
          transition:
            transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
            color 0.22s ease;
        }

        .shared-restaurant-favorite-button.active .favorite-heart-icon {
          animation: favoriteHeartPop 0.52s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .favorite-heart-glow {
          position: absolute;
          width: 29px;
          height: 29px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(255, 79, 109, 0.48) 0%,
            rgba(255, 79, 109, 0.19) 32%,
            transparent 72%
          );
          opacity: 0;
          transform: scale(0.55);
          filter: blur(7px);
          z-index: 1;
          pointer-events: none;
        }

        .shared-restaurant-favorite-button.active .favorite-heart-glow {
          animation: favoriteGlow 0.7s ease-out;
        }

        .favorite-heart-ripple {
          position: absolute;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.48);
          opacity: 0;
          transform: scale(0.35);
          pointer-events: none;
          z-index: 0;
        }

        .shared-restaurant-favorite-button.active .favorite-heart-ripple {
          animation: favoriteRipple 0.62s ease-out;
        }

        .favorite-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #ff5b73;
          opacity: 0;
          z-index: 2;
          pointer-events: none;
        }

        .shared-restaurant-favorite-button.active .favorite-particle {
          animation: favoriteParticle 0.62s ease-out forwards;
        }

        .particle-1 {
          top: 5px;
          left: 50%;
          --particle-x: 0px;
          --particle-y: -20px;
          animation-delay: 0s !important;
        }

        .particle-2 {
          top: 12px;
          right: 4px;
          width: 3px;
          height: 3px;
          --particle-x: 13px;
          --particle-y: -13px;
          animation-delay: 0.03s !important;
        }

        .particle-3 {
          right: 8px;
          bottom: 7px;
          --particle-x: 14px;
          --particle-y: 8px;
          animation-delay: 0.06s !important;
        }

        .particle-4 {
          left: 7px;
          bottom: 7px;
          width: 3px;
          height: 3px;
          --particle-x: -14px;
          --particle-y: 8px;
          animation-delay: 0.09s !important;
        }

        .particle-5 {
          top: 11px;
          left: 4px;
          --particle-x: -13px;
          --particle-y: -13px;
          animation-delay: 0.12s !important;
        }

        .particle-6 {
          top: 3px;
          right: 11px;
          width: 3px;
          height: 3px;
          --particle-x: 8px;
          --particle-y: -18px;
          animation-delay: 0.15s !important;
        }

        .shared-restaurant-favorite-count {
          min-width: 22px;
          min-height: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 2px 5px;
          color: rgba(255, 255, 255, 0.96);
          font-size: 0.62rem;
          line-height: 1;
          font-weight: 800;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
          pointer-events: none;
          animation: favoriteCountAppear 0.24s ease-out;
        }

        @keyframes favoriteButtonPop {
          0% { transform: scale(0.78); }
          35% { transform: scale(1.16); }
          58% { transform: scale(0.96); }
          78% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }

        @keyframes favoriteHeartPop {
          0% { transform: scale(0.55) rotate(-8deg); }
          28% { transform: scale(1.28) rotate(5deg); }
          48% { transform: scale(0.90) rotate(-2deg); }
          72% { transform: scale(1.12) rotate(1deg); }
          100% { transform: scale(1) rotate(0); }
        }

        @keyframes favoriteGlow {
          0% { opacity: 0; transform: scale(0.45); }
          35% { opacity: 1; transform: scale(1.6); }
          100% { opacity: 0; transform: scale(2.25); }
        }

        @keyframes favoriteRipple {
          0% { opacity: 0.65; transform: scale(0.4); }
          100% { opacity: 0; transform: scale(2.5); }
        }

        @keyframes favoriteParticle {
          0% { opacity: 0; transform: translate(0, 0) scale(0.4); }
          25% { opacity: 1; }
          100% {
            opacity: 0;
            transform: translate(var(--particle-x), var(--particle-y)) scale(0);
          }
        }

        @keyframes favoriteCountAppear {
          from { opacity: 0; transform: translateY(-4px) scale(0.8); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .shared-restaurant-image-dots {
          position: absolute;
          bottom: 11px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.2);
          z-index: 4;
        }

        .shared-restaurant-image-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.65);
        }

        .shared-restaurant-image-dot.active {
          background: #fff;
        }

        .shared-restaurant-card-body {
          display: flex;
          flex-direction: column;
          min-height: 170px;
          padding: 13px 2px 0;
        }

        .shared-restaurant-content-link {
          display: block;
          color: inherit;
          text-decoration: none;
        }

        .shared-restaurant-name {
          margin: 0;
          color: #171b18;
          font-size: 0.91rem;
          line-height: 1.35;
          font-weight: 700;
        }

        .shared-restaurant-cuisine,
        .shared-restaurant-location,
        .shared-restaurant-hours {
          display: flex;
          align-items: flex-start;
          gap: 5px;
          margin-top: 6px;
          color: #747d77;
          font-size: 0.68rem;
          line-height: 1.45;
          font-weight: 600;
        }

        .shared-restaurant-cuisine {
          color: ${CALBAYOG_BLUE};
        }

        .shared-restaurant-cuisine svg,
        .shared-restaurant-location svg,
        .shared-restaurant-hours svg {
          flex: 0 0 auto;
          margin-top: 1px;
        }

        .shared-restaurant-description {
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

        .shared-restaurant-bottom-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-top: auto;
          padding-top: 10px;
          border-top: 1px solid #f0f2f0;
        }

        .shared-restaurant-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .shared-restaurant-action-link,
        .shared-restaurant-view-details-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.61rem;
          font-weight: 800;
          text-decoration: none;
        }

        .shared-restaurant-action-link {
          color: #727b76;
        }

        .shared-restaurant-action-link:hover,
        .shared-restaurant-view-details-link:hover {
          color: ${CALBAYOG_BLUE};
        }

        .shared-restaurant-view-details-link {
          color: #171b18;
          white-space: nowrap;
        }

        @media (max-width: 767.98px) {
          .shared-restaurant-image-wrap {
            border-radius: 17px;
          }

          .shared-restaurant-favorite-button {
            width: 40px;
            height: 40px;
          }
        }

        @media (max-width: 479.98px) {
          .shared-restaurant-favorite-control {
            top: 9px;
            right: 9px;
          }

          .shared-restaurant-favorite-button {
            width: 39px;
            height: 39px;
          }

          .shared-restaurant-favorite-count {
            font-size: 0.59rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .shared-restaurant-favorite-button,
          .favorite-heart-icon,
          .shared-restaurant-favorite-count {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </>
  );
};

export default RestaurantCard;
