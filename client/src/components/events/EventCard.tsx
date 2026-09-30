import React from "react";
import { Card } from "react-bootstrap";
import {
  ArrowUpRight,
  CalendarDays,
  Heart,
  MapPin,
  Ticket,
} from "lucide-react";

const CALBAYOG_BLUE = "#2D3195";

export interface EventCardItem {
  id?: string;
  _id?: string;
  title?: string;
  image?: string;
  category?: string;
  featured?: boolean;
  startDate?: string;
  endDate?: string;
  start_date?: string;
  end_date?: string;
  venue?: string;
  description?: string;
  organizer?: string;
  isFree?: boolean;
  is_free?: boolean;
  ticketPrice?: number | string;
  ticket_price?: number | string;
  facebook?: string;
}

interface EventCardProps {
  event: EventCardItem;
  compact?: boolean;
  showFeatured?: boolean;
  onClick?: (event: EventCardItem) => void;
}

const getEventId = (
  event: EventCardItem,
): string => {
  return String(
    event?.id ??
      event?._id ??
      "",
  ).trim();
};

const getStartDate = (
  event: EventCardItem,
): string => {
  return (
    event.startDate ||
    event.start_date ||
    ""
  );
};

const getEndDate = (
  event: EventCardItem,
): string => {
  return (
    event.endDate ||
    event.end_date ||
    ""
  );
};

const formatDate = (
  value: string,
): string => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );
};

const formatDateRange = (
  event: EventCardItem,
): string => {
  const start = formatDate(
    getStartDate(event),
  );

  const end = formatDate(
    getEndDate(event),
  );

  if (!start) {
    return "";
  }

  if (!end || end === start) {
    return start;
  }

  return `${start} – ${end}`;
};

const getCategoryBackground = (
  category?: string,
): string => {
  switch (
    String(category || "")
      .toLowerCase()
      .trim()
  ) {
    case "festival":
      return "#fff5df";

    case "cultural":
      return "#f3ece8";

    case "sports":
      return "#e8f5ee";

    case "religious":
      return "#eef0ff";

    case "food":
      return "#fff1e8";

    case "music":
      return "#f1ebff";

    case "arts":
      return "#f8edf5";

    default:
      return "#eef1ef";
  }
};

const EventCard: React.FC<
  EventCardProps
> = ({
  event,
  compact = false,
  showFeatured = true,
  onClick,
}) => {
  const eventId = getEventId(event);

  const [liked, setLiked] =
    React.useState(false);

  const category =
    event.category || "Event";

  const image =
    event.image || "";

  const description =
    event.description || "";

  const venue =
    event.venue || "";

  const dateRange =
    formatDateRange(event);

  const isFree =
    event.isFree ??
    event.is_free ??
    false;

  const ticketPrice =
    event.ticketPrice ??
    event.ticket_price ??
    "";

  const detailAction = () => {
    if (onClick) {
      onClick(event);
    }
  };

  return (
    <>
      <Card
        className={`shared-event-card ${
          compact
            ? "shared-event-card-compact"
            : ""
        }`}
      >
        {/* =====================================================
            IMAGE
        ===================================================== */}

        <div className="shared-event-image-wrap">
          <button
            type="button"
            className="shared-event-image-button"
            onClick={detailAction}
            aria-label={`View ${event.title || "event"}`}
          >
            {image ? (
              <img
                src={image}
                alt={event.title || "Event"}
                className="shared-event-image"
                loading="lazy"
              />
            ) : (
              <div
                className="shared-event-image-placeholder"
                style={{
                  background: `linear-gradient(135deg, ${getCategoryBackground(
                    category,
                  )}, #f8faf9)`,
                }}
              >
                <img
                  src="/panda.png"
                  alt=""
                  className="shared-event-no-image-sticker"
                />

                <span className="shared-event-placeholder-text">
                  No image
                </span>
              </div>
            )}

            {/* CATEGORY */}

            {category && (
              <div className="shared-event-category-badge">
                {category}
              </div>
            )}

            {/* FEATURED */}

            {showFeatured &&
              event.featured && (
                <div className="shared-event-featured-badge">
                  <span>Featured</span>
                </div>
              )}
          </button>

          {/* FAVORITE */}

          {eventId && (
            <div className="shared-event-favorite-control">
              <button
                type="button"
                className={`shared-event-favorite-button ${
                  liked ? "active" : ""
                }`}
                onClick={(clickEvent) => {
                  clickEvent.preventDefault();
                  clickEvent.stopPropagation();

                  setLiked(
                    (previous) =>
                      !previous,
                  );
                }}
                aria-label={
                  liked
                    ? `Remove ${
                        event.title ||
                        "event"
                      } from favorites`
                    : `Add ${
                        event.title ||
                        "event"
                      } to favorites`
                }
                aria-pressed={liked}
              >
                <span className="event-heart-glow" />
                <span className="event-heart-ripple" />

                <Heart
                  className="event-heart-icon"
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

                {liked && (
                  <>
                    <span className="event-particle particle-1" />
                    <span className="event-particle particle-2" />
                    <span className="event-particle particle-3" />
                    <span className="event-particle particle-4" />
                    <span className="event-particle particle-5" />
                    <span className="event-particle particle-6" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* =====================================================
            CARD BODY
        ===================================================== */}

        <Card.Body className="shared-event-card-body">
          <button
            type="button"
            className="shared-event-content-button"
            onClick={detailAction}
          >
            {/* TITLE */}

            <div className="shared-event-title-row">
              <Card.Title className="shared-event-name">
                {event.title ||
                  "Untitled Event"}
              </Card.Title>
            </div>

            {/* DATE */}

            {dateRange && (
              <div className="shared-event-meta-item">
                <CalendarDays
                  size={15}
                  strokeWidth={1.8}
                />

                <span>{dateRange}</span>
              </div>
            )}

            {/* VENUE */}

            {venue && (
              <div className="shared-event-meta-item">
                <MapPin
                  size={15}
                  strokeWidth={1.8}
                />

                <span>{venue}</span>
              </div>
            )}

            {/* DESCRIPTION */}

            {description && (
              <p className="shared-event-description">
                {description.slice(
                  0,
                  170,
                )}

                {description.length > 170
                  ? "..."
                  : ""}
              </p>
            )}

            {/* ORGANIZER */}

            {event.organizer && (
              <div className="shared-event-organizer">
                Organized by{" "}
                {event.organizer}
              </div>
            )}
          </button>

          {/* =================================================
              BOTTOM ROW
          ================================================= */}

          <div className="shared-event-bottom-row">
            <div className="shared-event-ticket">
              <Ticket
                size={15}
                strokeWidth={1.8}
              />

              <span>
                {isFree
                  ? "Free"
                  : ticketPrice
                    ? `₱${ticketPrice}`
                    : "Ticketed"}
              </span>
            </div>

            <button
              type="button"
              className="shared-event-view-details-link"
              onClick={detailAction}
            >
              View details

              <ArrowUpRight
                size={15}
                strokeWidth={1.9}
              />
            </button>
          </div>
        </Card.Body>
      </Card>

      <style>{`
        .shared-event-card {
          width: 100%;
          height: 100%;
          border: none !important;
          border-radius: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          overflow: visible;
        }

        .shared-event-image-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 5;
          overflow: hidden;
          border-radius: 18px;
          background: #eef2ef;
          transition:
            box-shadow 0.28s ease;
        }

        .shared-event-card:hover
          .shared-event-image-wrap {
          box-shadow:
            0 12px 32px
            rgba(20, 30, 24, 0.11);
        }

        .shared-event-image-button {
          position: absolute;
          inset: 0;
          display: block;
          width: 100%;
          height: 100%;
          padding: 0;
          border: none;
          background: transparent;
          overflow: hidden;
          cursor: pointer;
          text-align: left;
        }

        .shared-event-image {
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

        .shared-event-card:hover
          .shared-event-image {
          transform: scale(1.035);
        }

        .shared-event-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          overflow: hidden;
        }

        .shared-event-no-image-sticker {
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

        .shared-event-placeholder-text {
          color: #64706a;
          font-size: 0.68rem;
          font-weight: 800;
        }

        .shared-event-category-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          max-width: calc(100% - 82px);
          padding: 7px 10px;
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
            rgba(0, 0, 0, 0.09);
          backdrop-filter: blur(10px);
          font-size: 0.61rem;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          z-index: 3;
        }

        .shared-event-featured-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          transform: translateY(43px);
          display: inline-flex;
          align-items: center;
          padding: 6px 9px;
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
            rgba(0, 0, 0, 0.08);
          backdrop-filter: blur(10px);
          font-size: 0.6rem;
          font-weight: 800;
          z-index: 3;
        }

        .shared-event-favorite-control {
          position: absolute;
          top: 11px;
          right: 11px;
          z-index: 8;
          display: flex;
          pointer-events: none;
        }

        .shared-event-favorite-button {
          position: relative;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: none;
          background: transparent;
          color:
            rgba(
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

        .shared-event-favorite-button:hover {
          transform: scale(1.09);
        }

        .shared-event-favorite-button:active {
          transform: scale(0.87);
        }

        .shared-event-favorite-button.active {
          color: #ff4f6d;
          animation:
            eventButtonPop
            0.48s
            cubic-bezier(
              0.22,
              1.4,
              0.36,
              1
            );
        }

        .event-heart-icon {
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

        .shared-event-favorite-button.active
          .event-heart-icon {
          animation:
            eventHeartPop
            0.52s
            cubic-bezier(
              0.34,
              1.56,
              0.64,
              1
            );
        }

        .event-heart-glow {
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
        }

        .shared-event-favorite-button.active
          .event-heart-glow {
          animation:
            eventGlow
            0.7s
            ease-out;
        }

        .event-heart-ripple {
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
        }

        .shared-event-favorite-button.active
          .event-heart-ripple {
          animation:
            eventRipple
            0.62s
            ease-out;
        }

        .event-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #ff5b73;
          opacity: 0;
          z-index: 2;
        }

        .shared-event-favorite-button.active
          .event-particle {
          animation:
            eventParticle
            0.62s
            ease-out
            forwards;
        }

        @keyframes eventButtonPop {
          0% { transform: scale(0.78); }
          35% { transform: scale(1.16); }
          58% { transform: scale(0.96); }
          78% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }

        @keyframes eventHeartPop {
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

        @keyframes eventGlow {
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

        @keyframes eventRipple {
          0% {
            opacity: 0.65;
            transform: scale(0.4);
          }
          100% {
            opacity: 0;
            transform: scale(2.5);
          }
        }

        @keyframes eventParticle {
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

        .shared-event-card-body {
          padding:
            13px 2px 0 !important;
        }

        .shared-event-content-button {
          display: block;
          width: 100%;
          padding: 0;
          border: none;
          background: transparent;
          color: inherit;
          text-align: left;
          cursor: pointer;
        }

        .shared-event-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }

        .shared-event-name {
          margin: 0 !important;
          color: #171b18 !important;
          font-size: 0.91rem !important;
          line-height: 1.3 !important;
          font-weight: 700 !important;
        }

        .shared-event-meta-item {
          display: flex;
          align-items: flex-start;
          gap: 5px;
          margin-top: 6px;
          color: #747d77;
          font-size: 0.68rem;
          line-height: 1.4;
          font-weight: 600;
        }

        .shared-event-meta-item svg {
          flex: 0 0 auto;
          margin-top: 1px;
        }

        .shared-event-description {
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

        .shared-event-organizer {
          margin-top: 7px;
          color: ${CALBAYOG_BLUE};
          font-size: 0.62rem;
          line-height: 1.45;
          font-weight: 800;
        }

        .shared-event-bottom-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #f0f2f0;
        }

        .shared-event-ticket {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: ${CALBAYOG_BLUE};
          font-size: 0.62rem;
          font-weight: 800;
        }

        .shared-event-view-details-link {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 0;
          border: none;
          background: transparent;
          color: #171b18;
          font-size: 0.61rem;
          font-weight: 800;
          cursor: pointer;
        }

        .shared-event-view-details-link:hover {
          color: ${CALBAYOG_BLUE};
        }

        @media (max-width: 767.98px) {
          .shared-event-image-wrap {
            border-radius: 17px;
          }

          .shared-event-favorite-button {
            width: 40px;
            height: 40px;
          }
        }

        @media (max-width: 479.98px) {
          .shared-event-favorite-button {
            width: 39px;
            height: 39px;
          }
        }
      `}</style>
    </>
  );
};

export default EventCard;
