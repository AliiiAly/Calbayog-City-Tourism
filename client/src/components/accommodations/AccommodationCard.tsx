import React, { useEffect } from "react";
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
  contact_number?: string | null;
  website?: string | null;
  images?: string[];
  description?: string | null;
  price_range?: string | null;
  featured?: boolean;
  favorites?: number;
  favorite_count?: number;
}

interface AccommodationCardProps {
  accommodation: AccommodationCardItem;
  imageIndex?: number;
  showFeatured?: boolean;
  compact?: boolean;
}

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
  const accommodationId = String(accommodation?.id ?? "").trim();

  const {
    isFavorite,
    getFavoriteCount,
    setFavoriteCount,
    toggleFavorite,
    isFavoritePending,
  } = useFavorites();

  const liked = accommodationId
    ? isFavorite("accommodation", accommodationId)
    : false;

  const pending = accommodationId
    ? isFavoritePending("accommodation", accommodationId)
    : false;

  const serverCount = Number(
    accommodation.favorites ?? accommodation.favorite_count ?? 0,
  );

  useEffect(() => {
    if (accommodationId && Number.isFinite(serverCount)) {
      setFavoriteCount(
        "accommodation",
        accommodationId,
        Math.max(0, serverCount),
      );
    }
  }, [accommodationId, serverCount, setFavoriteCount]);

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

    if (!accommodationId || pending) return;

    void toggleFavorite("accommodation", accommodationId);
  };

  return (
    <>
      <div
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
              <div className="shared-accommodation-image-dots">
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
                disabled={pending}
                aria-busy={pending}
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

              <span
                className="shared-accommodation-favorite-count"
                aria-label={`${favoriteCount} users favorited ${accommodation.name}`}
              >
                {favoriteCount}
              </span>
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
                <MapPin size={15} strokeWidth={1.8} />
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
                ) : (
                  <span>Manager: {accommodation.manager}</span>
                )}
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
                  <Globe2 size={14} strokeWidth={1.8} />
                  Website
                </a>
              )}
            </div>

            <Link
              to={detailPath}
              className="shared-accommodation-view-details-link"
            >
              View details
              <ArrowUpRight size={15} strokeWidth={1.9} />
            </Link>
          </div>
        </div>
      </div>

      {/* Keep the existing <style> block from your current AccommodationCard.tsx here unchanged. */}
    </>
  );
};

export default AccommodationCard;
