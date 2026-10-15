
import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Clock, Globe2, Heart, MapPin, Utensils } from "lucide-react";

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

const getWebsiteHref = (website: string) => {
  if (!website) return "";
  return /^https?:\/\//i.test(website)
    ? website
    : `https://${website}`;
};



const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  imageIndex = 0,
  showFeatured = true,
  compact = false,
}) => {
  const restaurantId = String(restaurant?.id ?? "").trim();
  const { isFavorite, toggleFavorite } = useFavorites();

  const liked = restaurantId
    ? isFavorite("restaurant", restaurantId)
    : false;

  const images = Array.isArray(restaurant.images)
    ? restaurant.images.filter(
        (image): image is string =>
          typeof image === "string" && image.trim().length > 0,
      )
    : [];

  const safeImageIndex =
    images.length > 0 ? imageIndex % images.length : 0;

  const currentImage = images[safeImageIndex] || "";
  const description =
    restaurant.short_description ||
    restaurant.description ||
    "";

  const address = restaurant.location_address || "";
  const website = restaurant.contact_website || "";
  const cuisine = restaurant.cuisine_type || "";
  const priceRange = restaurant.price_range || "";
  const openingHours = restaurant.opening_hours || "";

  const detailPath = restaurantId
    ? `/restaurants/${encodeURIComponent(restaurantId)}`
    : "/restaurants";

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
            <button
              type="button"
              className={`shared-restaurant-favorite-button ${
                liked ? "active" : ""
              }`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void toggleFavorite("restaurant", restaurantId);
              }}
              aria-label={
                liked
                  ? `Remove ${restaurant.name} from favorites`
                  : `Add ${restaurant.name} to favorites`
              }
              aria-pressed={liked}
            >
              <Heart
                size={22}
                strokeWidth={liked ? 2.25 : 1.9}
                fill={liked ? "currentColor" : "none"}
              />
            </button>
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

        .shared-restaurant-favorite-button {
          position: absolute;
          top: 11px;
          right: 11px;
          z-index: 8;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 50%;
          background: rgba(25, 25, 25, 0.32);
          color: #fff;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease;
        }

        .shared-restaurant-favorite-button:hover {
          transform: scale(1.08);
        }

        .shared-restaurant-favorite-button.active {
          color: #ff4f6d;
          background: #fff;
        }

        .shared-restaurant-image-dots {
          position: absolute;
          bottom: 11px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 5px;
          padding: 5px 8px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.2);
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
      `}</style>
    </>
  );
};

export default RestaurantCard;
