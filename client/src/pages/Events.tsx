
import React, { useEffect, useRef, useState } from "react";
import {
  Container,
  Row,
  Col,
  Badge,
  Spinner,
  Button,
  Modal,
} from "react-bootstrap";
import { useLocation } from "react-router-dom";

import {
  CalendarDays,
  MapPin,
  Star,
} from "lucide-react";

import { getEvents } from "../services/api";
import {
  subscribeToEvents,
  unsubscribeAll,
} from "../services/supabase";

import { Event } from "../types";
import EventCard, {
  EventCardItem,
} from "../components/events/EventCard";

/* =========================================================
   PAGE STYLES
   Inspired by AdminAttractions.
   EventCard styling remains in EventCard.tsx.
========================================================= */

const styles = `
@font-face {
  font-family: "Barabara";
  src: url("/fonts/BARABARA-final.otf") format("opentype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

.events-page {
  --admin-primary: #2D3195;
  --admin-primary-dark: #242879;
  --admin-yellow: #FFB71B;
  --admin-bg: #F7F8FC;
  --admin-border: #E8EAF1;
  --admin-text: #1B1D24;
  --admin-muted: #737886;

  width: 100%;
  min-height: 100vh;
  padding: 0 0 56px;
  background: #ffffff;
  color: var(--admin-text);
  font-family: "Nunito", "Poppins", "Segoe UI", sans-serif;
  box-sizing: border-box;
}

.events-page *,
.events-page *::before,
.events-page *::after {
  box-sizing: border-box;
}

/* PAGE HEADER */

.events-header {
  width: 100%;
  padding: 30px 20px 18px;
  background: transparent;
}

.events-header-inner {
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
}

.events-title {
  margin: 0 !important;
  color: #2D3195 !important;
  font-family: "Barabara", sans-serif !important;
  font-size: clamp(1.65rem, 2.8vw, 2.4rem) !important;
  font-weight: 400 !important;
  line-height: 0.95 !important;
  letter-spacing: 0.02em;
}

.events-subtitle {
  max-width: 620px;
  margin: 8px 0 0 !important;
  color: #737886 !important;
  font-family: "Nunito", sans-serif !important;
  font-size: 0.78rem !important;
  font-weight: 600 !important;
  line-height: 1.55 !important;
}

/* MAIN CONTENT */

.events-container {
  width: 100%;
  max-width: 1240px;
  padding: 0 20px 60px;
  margin: 0 auto;
}

/* RESULTS BAR */

.events-results-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  flex-wrap: wrap;
  margin-bottom: 27px;
  padding: 11px 2px;
  border-top: 1px solid #F0F2F5;
  border-bottom: 1px solid #F0F2F5;
}

.events-results-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.events-results-icon {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border-radius: 10px;
  background: #EEF0FF;
  color: #2D3195;
}

.events-results-label {
  font-family: "Nunito", sans-serif;
  font-size: 0.64rem;
  font-weight: 800;
  color: #737886;
  line-height: 1.2;
}

.events-results-count {
  margin-top: 2px;
  font-family: "Poppins", sans-serif;
  font-size: 0.74rem;
  font-weight: 700;
  color: #1B1D24;
}

.events-results-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.events-results-category {
  font-family: "Nunito", sans-serif;
  font-size: 0.69rem;
  font-weight: 700;
  color: #737886;
}

/* EVENT GRID
   The cards themselves are not restyled here.
*/

.events-grid {
  row-gap: 46px !important;
  margin-left: -12px;
  margin-right: -12px;
}

.event-col {
  display: flex;
  padding-left: 12px;
  padding-right: 12px;
}

/* LOADING STATE */

.events-loading {
  min-height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.events-loading-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.events-loading-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  border-radius: 15px;
  background: #EEF0FF;
  color: #2D3195;
}

.events-loading-title {
  font-family: "Poppins", sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  color: #1B1D24;
}

.events-loading-text {
  margin: 4px 0 0;
  font-family: "Nunito", sans-serif;
  font-size: 0.68rem;
  color: #737886;
}

/* EMPTY STATE */

.events-empty {
  padding: 65px 20px;
  text-align: center;
  border: 1px solid #E8EAF1;
  border-radius: 20px;
  background: #F7F8FC;
}

.events-empty-icon {
  width: 68px;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
  border-radius: 20px;
  background: #EEF0FF;
  color: #2D3195;
}

.events-empty-title {
  margin: 0;
  font-family: "Poppins", sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: #1B1D24;
}

.events-empty-text {
  max-width: 390px;
  margin: 7px auto 18px;
  font-family: "Nunito", sans-serif;
  font-size: 0.76rem;
  line-height: 1.5;
  color: #737886;
}

/* EVENT DETAIL MODAL */

.events-modal-image {
  display: block;
  width: 100%;
  height: clamp(190px, 35vw, 320px);
  object-fit: cover;
  border-radius: 15px;
  margin-bottom: 18px;
}

.events-modal-title {
  font-family: "Poppins", "Nunito", sans-serif;
  font-size: 1.2rem;
  font-weight: 700;
  color: #2D3195;
}

.events-modal-details {
  padding: 14px 16px;
  margin-bottom: 18px;
  border: 1px solid #E8EAF1;
  border-radius: 14px;
  background: #F7F8FC;
}

.events-modal-detail {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 9px;
  font-family: "Nunito", sans-serif;
  font-size: 0.78rem;
  line-height: 1.45;
  color: #5F6471;
}

.events-modal-detail:last-child {
  margin-bottom: 0;
}

.events-modal-section-title {
  margin-bottom: 7px;
  font-family: "Poppins", sans-serif;
  font-size: 0.84rem;
  font-weight: 700;
  color: #2D3195;
}

.events-modal-description {
  font-family: "Nunito", sans-serif;
  font-size: 0.83rem;
  line-height: 1.65;
  color: #666C78;
}

/* MODAL SHELL */

.events-page .modal-content {
  overflow: hidden;
  border: 1px solid #E8EAF1 !important;
  border-radius: 22px !important;
  background: #FFFFFF !important;
  box-shadow: 0 24px 70px rgba(18, 20, 36, 0.17) !important;
}

.events-page .modal-header {
  padding: 18px 21px !important;
  border-bottom: 1px solid #EEF0F4 !important;
  background: #FFFFFF !important;
}

.events-page .modal-header .modal-title {
  color: #2D3195 !important;
}

.events-page .modal-body {
  padding: 22px !important;
  background: #FBFBFD !important;
}

.events-page .modal-footer {
  gap: 8px;
  padding: 13px 21px !important;
  border-top: 1px solid #EEF0F4 !important;
  background: #FFFFFF !important;
}

.events-page .modal-footer .btn {
  min-height: 39px;
  border-radius: 11px !important;
  padding: 8px 15px !important;
  font-family: "Nunito", sans-serif !important;
  font-size: 0.69rem !important;
  font-weight: 900 !important;
}

.events-page .modal-footer .btn-primary {
  border-color: #2D3195 !important;
  background: #2D3195 !important;
}

/* RESPONSIVE LAYOUT */

@media (max-width: 991.98px) {
  .events-header {
    padding: 28px 20px 18px;
  }

  .events-title {
    font-size: clamp(1.65rem, 4.5vw, 2.25rem) !important;
  }

  .events-grid {
    row-gap: 40px !important;
  }
}

@media (max-width: 767.98px) {
  .events-header {
    padding: 25px 17px 16px;
  }

  .events-title {
    font-size: 1.9rem !important;
  }

  .events-subtitle {
    margin-top: 8px !important;
    font-size: 0.78rem !important;
  }

  .events-container {
    padding: 0 17px 45px;
  }

  .events-results-bar {
    align-items: flex-start;
  }

  .events-results-right {
    width: 100%;
    justify-content: space-between;
  }

  .events-grid {
    row-gap: 36px !important;
  }
}

@media (max-width: 479.98px) {
  .events-title {
    font-size: 1.8rem !important;
  }

  .events-subtitle {
    font-size: 0.77rem !important;
  }

  .events-page .modal-body {
    padding: 17px !important;
  }

  .events-page .modal-header {
    padding: 15px 17px !important;
  }

  .events-page .modal-footer {
    padding: 12px 17px !important;
  }
}
`;

/* =========================================================
   CATEGORY COLORS
========================================================= */

const categoryColors: Record<string, string> = {
  Festival: "#e63946",
  Cultural: "#1A7A4A",
  Sports: "#0077B6",
  Religious: "#F4A226",
  Food: "#6d4c41",
  Music: "#7b2d8b",
  Arts: "#e76f51",
  Other: "#6c757d",
};

/* =========================================================
   CATEGORY ICONS
========================================================= */

const categoryIcons: Record<string, string> = {
  All: "🌐",
  Festival: "🎉",
  Cultural: "🏛️",
  Sports: "🏃",
  Religious: "⛪",
  Food: "🍴",
  Music: "🎵",
  Arts: "🎨",
  Other: "📍",
};

/* =========================================================
   COMPONENT
========================================================= */

const Events: React.FC = () => {
  const location = useLocation();

  const highlightId =
    (location.state as any)?.highlightId;

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Event | null>(null);

  const didAutoOpen = useRef(false);

  /* FETCH EVENTS */

  const fetchEvents = async () => {
    setLoading(true);

    try {
      const response = await getEvents({});

      const fetched: Event[] = Array.isArray(response?.data)
        ? response.data
        : [];

      setEvents(fetched);

      /* AUTO OPEN HIGHLIGHTED EVENT */

      if (highlightId && !didAutoOpen.current) {
        const match = fetched.find(
          (event) => event._id === highlightId,
        );

        if (match) {
          setSelected(match);
          didAutoOpen.current = true;
        }
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  /* INITIAL LOAD */

  useEffect(() => {
    void fetchEvents();

    // Fetch once when the Events page mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* REALTIME UPDATES */

  useEffect(() => {
    subscribeToEvents(() => {
      void fetchEvents();
    });

    return () => {
      unsubscribeAll();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* DATE HELPERS */

  const formatDate = (date: string) => {
    if (!date) {
      return "Date TBA";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Date TBA";
    }

    return parsed.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateRange = (
    startDate: string,
    endDate: string,
  ) => {
    if (!startDate) {
      return "Date TBA";
    }

    if (
      !endDate ||
      new Date(startDate).toDateString() ===
        new Date(endDate).toDateString()
    ) {
      return formatDate(startDate);
    }

    return `${formatDate(startDate)} – ${formatDate(endDate)}`;
  };

  /* CATEGORY HELPERS */

  const getCategoryColor = (category: string) =>
    categoryColors[category] || "#2D3195";

  const getCategoryIcon = (category: string) =>
    categoryIcons[category] || "📍";

  const selectedColor = selected
    ? getCategoryColor(selected.category)
    : "#2D3195";

  /* CONVERT EVENT FOR THE EXISTING EVENT CARD */

  const toEventCardItem = (
    event: Event,
  ): EventCardItem => ({
    _id: event._id,
    title: event.title,
    image: event.image,
    category: event.category,
    featured: event.featured,
    startDate: event.startDate,
    endDate: event.endDate,
    venue: event.venue,
    description: event.description,
    organizer: event.organizer,
    isFree: event.isFree,
    ticketPrice: event.ticketPrice,
    facebook: event.contact?.facebook,
  });

  /* RENDER */

  return (
    <>
      <style>{styles}</style>

      <div className="page-enter events-page">
        {/* PAGE HEADER */}

        <section className="events-header">
          <div className="events-header-inner">
            <h1 className="events-title">
              EVENTS &amp; FESTIVALS
            </h1>

            <p className="events-subtitle">
              Experience Calbayog's vibrant celebrations,
              cultural traditions, community gatherings,
              and memorable events.
            </p>
          </div>
        </section>

        {/* MAIN CONTENT */}

        <Container className="events-container">
          {/* RESULTS BAR */}

          {!loading && (
            <div className="events-results-bar">
              <div className="events-results-left">
                <div className="events-results-icon">
                  <CalendarDays
                    size={16}
                    strokeWidth={2.2}
                  />
                </div>

                <div>
                  <div className="events-results-label">
                    SHOWING
                  </div>

                  <div className="events-results-count">
                    {events.length} event
                    {events.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              <div className="events-results-right">
                <span className="events-results-category">
                  All events
                </span>
              </div>
            </div>
          )}

          {/* LOADING STATE */}

          {loading ? (
            <div className="events-loading">
              <div className="events-loading-inner">
                <div className="events-loading-icon">
                  <Spinner
                    animation="border"
                    size="sm"
                  />
                </div>

                <div className="events-loading-title">
                  Discovering events...
                </div>

                <p className="events-loading-text">
                  Please wait a moment.
                </p>
              </div>
            </div>
          ) : events.length === 0 ? (
            /* EMPTY STATE */

            <div className="events-empty">
              <div className="events-empty-icon">
                <CalendarDays
                  size={27}
                  strokeWidth={1.8}
                />
              </div>

              <h3 className="events-empty-title">
                No events found
              </h3>

              <p className="events-empty-text">
                There are currently no events to display.
                Please check back later.
              </p>
            </div>
          ) : (
            /* EVENT GRID — EXISTING EVENT CARDS */

            <Row className="events-grid">
              {events.map((event, index) => {
                const eventId =
                  event._id || `event-${index}`;

                return (
                  <Col
                    xs={12}
                    sm={6}
                    lg={4}
                    key={eventId}
                    className="event-col"
                  >
                    <EventCard
                      event={toEventCardItem(event)}
                      showFeatured={true}
                      onClick={() => setSelected(event)}
                    />
                  </Col>
                );
              })}
            </Row>
          )}
        </Container>

        {/* EVENT DETAIL MODAL */}

        <Modal
          show={!!selected}
          onHide={() => setSelected(null)}
          centered
          size="lg"
        >
          {selected && (
            <>
              <Modal.Header
                closeButton
                style={{
                  borderBottom: "1px solid #E8EAF1",
                }}
              >
                <Modal.Title className="events-modal-title">
                  {selected.title}
                </Modal.Title>
              </Modal.Header>

              <Modal.Body>
                {/* EVENT IMAGE */}

                {selected.image ? (
                  <img
                    src={selected.image}
                    alt={selected.title}
                    className="events-modal-image"
                  />
                ) : (
                  <div
                    className="events-modal-image d-flex align-items-center justify-content-center"
                    style={{
                      background: "#EEF0FF",
                      color: selectedColor,
                      fontSize: "3rem",
                    }}
                  >
                    {getCategoryIcon(selected.category)}
                  </div>
                )}

                {/* EVENT BADGES */}

                <div className="d-flex flex-wrap gap-2 mb-3">
                  <Badge
                    style={{
                      background: selectedColor,
                      fontFamily: "Nunito, sans-serif",
                      fontSize: "0.67rem",
                      fontWeight: 800,
                      padding: "6px 9px",
                      borderRadius: 999,
                    }}
                  >
                    {getCategoryIcon(selected.category)}{" "}
                    {selected.category || "Event"}
                  </Badge>

                  <Badge
                    style={{
                      background: selected.isFree
                        ? "#EEF0FF"
                        : "#FFF7E7",
                      color: selected.isFree
                        ? "#2D3195"
                        : "#A86400",
                      fontFamily: "Nunito, sans-serif",
                      fontSize: "0.67rem",
                      fontWeight: 800,
                      padding: "6px 9px",
                      borderRadius: 999,
                    }}
                  >
                    {selected.isFree
                      ? "Free"
                      : `Ticketed · ${
                          selected.ticketPrice || "See details"
                        }`}
                  </Badge>

                  {selected.featured && (
                    <Badge
                      style={{
                        background: "#FFF7E7",
                        color: "#A86400",
                        fontFamily: "Nunito, sans-serif",
                        fontSize: "0.67rem",
                        fontWeight: 800,
                        padding: "6px 9px",
                        borderRadius: 999,
                      }}
                    >
                      <Star
                        size={10}
                        fill="currentColor"
                        strokeWidth={2}
                      />{" "}
                      Featured
                    </Badge>
                  )}
                </div>

                {/* EVENT DETAILS */}

                <div className="events-modal-details">
                  <div className="events-modal-detail">
                    <CalendarDays
                      size={15}
                      strokeWidth={2}
                      style={{
                        color: selectedColor,
                        marginTop: 1,
                        flex: "0 0 auto",
                      }}
                    />

                    <span>
                      <strong>Date:</strong>{" "}
                      {formatDateRange(
                        selected.startDate,
                        selected.endDate,
                      )}
                    </span>
                  </div>

                  <div className="events-modal-detail">
                    <MapPin
                      size={15}
                      strokeWidth={2}
                      style={{
                        color: selectedColor,
                        marginTop: 1,
                        flex: "0 0 auto",
                      }}
                    />

                    <span>
                      <strong>Venue:</strong>{" "}
                      {selected.venue || "Calbayog City"}
                    </span>
                  </div>

                  {selected.organizer && (
                    <div className="events-modal-detail">
                      <Star
                        size={15}
                        strokeWidth={2}
                        style={{
                          color: selectedColor,
                          marginTop: 1,
                          flex: "0 0 auto",
                        }}
                      />

                      <span>
                        <strong>Organizer:</strong>{" "}
                        {selected.organizer}
                      </span>
                    </div>
                  )}
                </div>

                {/* DESCRIPTION */}

                <h6 className="events-modal-section-title">
                  About this event
                </h6>

                <p className="events-modal-description">
                  {selected.description ||
                    "Discover this event and experience the vibrant culture and community of Calbayog City."}
                </p>

                {/* FACEBOOK LINK */}

                {selected.contact?.facebook && (
                  <a
                    href={selected.contact.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline-primary btn-sm"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      borderRadius: 11,
                      fontFamily: "Nunito, sans-serif",
                      fontSize: "0.7rem",
                      fontWeight: 800,
                    }}
                  >
                    Facebook Page
                  </a>
                )}
              </Modal.Body>

              <Modal.Footer>
                <Button
                  variant="outline-secondary"
                  onClick={() => setSelected(null)}
                  style={{
                    borderRadius: 11,
                    padding: "6px 14px",
                    fontFamily: "Nunito, sans-serif",
                    fontSize: "0.7rem",
                    fontWeight: 800,
                  }}
                >
                  Close
                </Button>
              </Modal.Footer>
            </>
          )}
        </Modal>
      </div>
    </>
  );
};

export default Events;
