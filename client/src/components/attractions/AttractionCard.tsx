import React, { useEffect } from "react";
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

const getAttractionId = (attraction: Destination): string =>
  String((attraction as any)?.id ?? "").trim();

const AttractionCard: React.FC<AttractionCardProps> = ({
  attraction,
  imageIndex = 0,
  showFavoriteCount = true,
  showFeatured = true,
  compact = false,
}) => {
  const {
    isFavorite,
    getFavoriteCount,
    setFavoriteCount,
    toggleFavorite,
    isFavoritePending,
  } = useFavorites();

  const item = attraction as any;
  const attractionId = getAttractionId(attraction);
  const liked = attractionId
    ? isFavorite("attraction", attractionId)
    : false;

  const pending = attractionId
    ? isFavoritePending("attraction", attractionId)
    : false;

  const serverCount = Number(
    item.favorites ?? item.favorite_count ?? item.favoriteCount ?? 0,
  );

  useEffect(() => {
    if (attractionId && Number.isFinite(serverCount)) {
      setFavoriteCount("attraction", attractionId, Math.max(0, serverCount));
    }
  }, [attractionId, serverCount, setFavoriteCount]);

  const favoriteCount = attractionId
    ? getFavoriteCount("attraction", attractionId)
    : 0;

  const images = Array.isArray(attraction.images)
    ? attraction.images.filter(Boolean)
    : [];

  const safeImageIndex =
    images.length > 0 ? Math.abs(imageIndex) % images.length : 0;

  const currentImage = images[safeImageIndex] || "";
  const description = attraction.short_description || attraction.description || "";
  const attractionType = item.attraction_type;
  const rating =
    item.rating ??
    item.average_rating ??
    item.rating_average ??
    item.review_rating ??
    null;
  const operationalHours = item.operational_hours;
  const bestTimeToVisit = item.best_time_to_visit;
  const thingsToDo = item.things_to_do;
  const website = item.website;

  const detailPath = attractionId
    ? `/attractions/${encodeURIComponent(attractionId)}`
    : "/attractions";

  const categoryBackground = (() => {
    switch (String(attraction.category || "").toLowerCase()) {
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

  const handleFavoriteClick = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (!attractionId || pending) return;

    void toggleFavorite("attraction", attractionId);
  };

  return (
    <>
      <Card
        className={`shared-attraction-card ${
          compact ? "shared-attraction-card-compact" : ""
        }`}
      >
        <div
          className={`shared-attraction-image-wrap ${
            compact ? "shared-attraction-image-wrap-compact" : ""
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

            {attraction.category && (
              <div className="shared-attraction-category-badge">
                {attraction.category}
              </div>
            )}

            {showFeatured && attraction.featured && (
              <div className="shared-attraction-featured-badge">
                <Star size={13} strokeWidth={1.8} fill="currentColor" />
                <span>Featured</span>
              </div>
            )}

            {images.length > 1 && (
              <div className="shared-attraction-image-dots">
                {images.slice(0, 6).map((_, index) => (
                  <span
                    key={index}
                    className={`shared-attraction-image-dot ${
                      index === safeImageIndex ? "active" : ""
                    }`}
                  />
                ))}
              </div>
            )}
          </Link>

          {attractionId && (
            <div
              className={`shared-attraction-favorite-control ${
                liked ? "is-liked" : ""
              }`}
            >
              <button
                type="button"
                className={`shared-attraction-favorite-button ${
                  liked ? "active" : ""
                }`}
                onClick={handleFavoriteClick}
                disabled={pending}
                aria-busy={pending}
                aria-label={
                  liked
                    ? `Remove ${attraction.name} from favorites`
                    : `Add ${attraction.name} to favorites`
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

              {showFavoriteCount && (
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

        <Card.Body className="shared-attraction-card-body">
          <Link to={detailPath} className="shared-attraction-content-link">
            <div className="shared-attraction-title-row">
              <Card.Title className="shared-attraction-name">
                {attraction.name}
              </Card.Title>

              {rating !== null && rating !== undefined && rating !== "" && (
                <div className="shared-attraction-rating">
                  <Star size={14} strokeWidth={1.7} fill="currentColor" />
                  <span>
                    {Number(rating).toFixed(2).replace(/0$/, "")}
                  </span>
                </div>
              )}
            </div>

            {attraction.location_address && (
              <div className="shared-attraction-location">
                <MapPin size={15} strokeWidth={1.8} />
                <span>{attraction.location_address}</span>
              </div>
            )}

            {description && (
              <p className="shared-attraction-description">
                {description.slice(0, 170)}
                {description.length > 170 ? "..." : ""}
              </p>
            )}

            {attractionType && (
              <div className="shared-attraction-type">{attractionType}</div>
            )}

            <div className="shared-attraction-meta">
              {operationalHours && (
                <div className="shared-attraction-meta-item">
                  <Clock3 size={14} strokeWidth={1.8} />
                  <span>{String(operationalHours)}</span>
                </div>
              )}

              {bestTimeToVisit && (
                <div className="shared-attraction-meta-item">
                  <span className="shared-attraction-sun">☀</span>
                  <span>Best time: {String(bestTimeToVisit)}</span>
                </div>
              )}
            </div>

            {thingsToDo && (
              <div className="shared-attraction-things-to-do">
                <strong>Things to do:</strong>{" "}
                {String(thingsToDo).slice(0, 120)}
                {String(thingsToDo).length > 120 ? "..." : ""}
              </div>
            )}
          </Link>

          <div className="shared-attraction-bottom-row">
            {attraction.entrance_fee && (
              <div className="shared-attraction-entrance-fee">
                <Ticket size={15} strokeWidth={1.8} />
                <span>{attraction.entrance_fee}</span>
              </div>
            )}

            <div className="shared-attraction-card-actions">
              {website && (
                <a
                  href={
                    /^https?:\/\//i.test(String(website))
                      ? String(website)
                      : `https://${String(website)}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="shared-attraction-card-action-link"
                >
                  <Globe2 size={14} strokeWidth={1.8} />
                  Website
                </a>
              )}

              <Link
                to={detailPath}
                className="shared-attraction-view-details-link"
              >
                View details
                <ArrowUpRight size={15} strokeWidth={1.9} />
              </Link>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Keep the existing <style> block from your current AttractionCard.tsx here unchanged. */}
    </>
  );
};

export default AttractionCard;
