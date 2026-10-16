import React, { useEffect } from "react";
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
  favorite_count?: number;
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

  const {
    isFavorite,
    getFavoriteCount,
    setFavoriteCount,
    toggleFavorite,
    isFavoritePending,
  } = useFavorites();

  const liked = restaurantId
    ? isFavorite("restaurant", restaurantId)
    : false;

  const pending = restaurantId
    ? isFavoritePending("restaurant", restaurantId)
    : false;

  const serverCount = Number(
    restaurant.favorites ?? restaurant.favorite_count ?? 0,
  );

  useEffect(() => {
    if (restaurantId && Number.isFinite(serverCount)) {
      setFavoriteCount(
        "restaurant",
        restaurantId,
        Math.max(0, serverCount),
      );
    }
  }, [restaurantId, serverCount, setFavoriteCount]);

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

    if (!restaurantId || pending) return;

    void toggleFavorite("restaurant", restaurantId);
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
                disabled={pending}
                aria-busy={pending}
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

              <span
                className="shared-restaurant-favorite-count"
                aria-label={`${favoriteCount} users favorited ${restaurant.name}`}
              >
                {favoriteCount}
              </span>
            </div>
          )}
        </div>

        <div className="shared-restaurant-card-body">
          <Link to={detailPath} className="shared-restaurant-content-link">
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

      {/* Keep the existing <style> block from your current RestaurantCard.tsx here unchanged. */}
    </>
  );
};

export default RestaurantCard;
