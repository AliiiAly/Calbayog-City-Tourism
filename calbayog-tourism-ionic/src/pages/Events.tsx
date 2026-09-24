import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Spinner,
  Button,
  Modal,
} from "react-bootstrap";
import { useLocation } from "react-router-dom";
import { getEvents } from "../services/api";
import { Event } from "../types";

// Simple Calendar Component
const Calendar: React.FC<{
  events: Event[];
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
  darkMode?: boolean;
}> = ({ events, selectedDate, onSelectDate, darkMode = false }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const countEventsOnDate = (day: number) => {
    return events.filter((e) => {
      if (!e.startDate) return false;
      const start = new Date(e.startDate);
      return (
        !isNaN(start.getTime()) &&
        start.getDate() === day &&
        start.getMonth() === currentMonth.getMonth() &&
        start.getFullYear() === currentMonth.getFullYear()
      );
    }).length;
  };

  const isSelectedDate = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.toDateString() ===
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day,
      ).toDateString()
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const prevMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  const nextMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );

  return (
    <div
      style={{
        background: darkMode ? "#1e1e2e" : "#fff",
        borderRadius: "12px",
        padding: "1rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Button
          variant="link"
          onClick={prevMonth}
          style={{
            color: darkMode ? "#e0e0e0" : "#212529",
            padding: "0.25rem 0.5rem",
          }}
        >
          ◀
        </Button>
        <strong style={{ color: darkMode ? "#e0e0e0" : "#212529" }}>
          {currentMonth.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </strong>
        <Button
          variant="link"
          onClick={nextMonth}
          style={{
            color: darkMode ? "#e0e0e0" : "#212529",
            padding: "0.25rem 0.5rem",
          }}
        >
          ▶
        </Button>
      </div>
      <div className="d-flex mb-2">
        {days.map((d) => (
          <div
            key={d}
            className="text-center"
            style={{
              flex: 1,
              fontSize: "0.75rem",
              color: darkMode ? "#b0b0c0" : "#6c757d",
              fontWeight: 600,
            }}
          >
            {d}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "4px",
        }}
      >
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const eventCount = countEventsOnDate(day);
          const selected = isSelectedDate(day);
          const today = isToday(day);
          const dotCount = Math.min(eventCount, 3);
          return (
            <button
              key={day}
              onClick={() => {
                const newDate = new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth(),
                  day,
                );
                onSelectDate(
                  selectedDate &&
                    selectedDate.toDateString() === newDate.toDateString()
                    ? null
                    : newDate,
                );
              }}
              style={{
                aspectRatio: "1",
                borderRadius: "8px",
                border: "none",
                background: selected
                  ? "var(--tropical-green)"
                  : today
                    ? "var(--tropical-green-light)"
                    : darkMode
                      ? "#2a2a3e"
                      : "#f8f9fa",
                color: selected ? "#fff" : darkMode ? "#e0e0e0" : "#212529",
                fontSize: "0.85rem",
                cursor: "pointer",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                paddingBottom: dotCount > 0 ? "6px" : "0",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                !selected &&
                (e.currentTarget.style.background = darkMode
                  ? "#3a3a5e"
                  : "#e9ecef")
              }
              onMouseLeave={(e) =>
                !selected &&
                (e.currentTarget.style.background = today
                  ? "var(--tropical-green-light)"
                  : darkMode
                    ? "#2a2a3e"
                    : "#f8f9fa")
              }
            >
              {day}
              {dotCount > 0 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "3px",
                    display: "flex",
                    gap: "2px",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {Array.from({ length: dotCount }).map((_, di) => (
                    <div
                      key={di}
                      style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        background: selected ? "#fff" : "var(--festival-amber)",
                      }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const CATEGORIES = [
  "All",
  "Festival",
  "Cultural",
  "Sports",
  "Religious",
  "Food",
  "Music",
  "Arts",
  "Other",
];

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

const generateICS = (event: Event) => {
  if (!event.startDate || !event.endDate) {
    alert("Event dates are missing. Cannot add to calendar.");
    return;
  }
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    alert("Invalid event dates. Cannot add to calendar.");
    return;
  }
  const start =
    startDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const end = endDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Calbayog Tourism//EN",
    "BEGIN:VEVENT",
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, "\\n").slice(0, 200)}`,
    `LOCATION:${event.venue}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/\s+/g, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
};

const Events: React.FC = () => {
  const location = useLocation();
  const highlightId = (location.state as any)?.highlightId;
  const [events, setEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selected, setSelected] = useState<Event | null>(null);
  const didAutoOpen = useRef(false);

  useEffect(() => {
    fetchEvents();
  }, [activeCategory, upcomingOnly, selectedDate]);

  // Fetch ALL events for calendar dots regardless of category/date filter
  useEffect(() => {
    getEvents({})
      .then((res) => {
        setCalendarEvents(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {});
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (activeCategory !== "All") params.category = activeCategory;
      if (upcomingOnly) params.upcoming = "true";
      const res = await getEvents(params);
      const fetched = Array.isArray(res.data) ? res.data : [];
      setAllEvents(fetched);

      // Filter by selected date if set — match exact startDate only
      if (selectedDate) {
        setEvents(
          fetched.filter((e) => {
            if (!e.startDate) return false;
            const start = new Date(e.startDate);
            return (
              !isNaN(start.getTime()) &&
              start.getDate() === selectedDate.getDate() &&
              start.getMonth() === selectedDate.getMonth() &&
              start.getFullYear() === selectedDate.getFullYear()
            );
          }),
        );
      } else {
        setEvents(fetched);
      }

      // Auto-open event from notification highlight
      if (highlightId && !didAutoOpen.current) {
        const match = fetched.find((e) => (e._id || e.id) === highlightId);
        if (match) {
          setSelected(match);
          didAutoOpen.current = true;
        }
      }
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="page-enter">
      <div
        className="hero-section py-3 py-md-4 px-3 text-center"
        style={{ minHeight: "100px" }}
      >
        <div style={{ position: "relative", zIndex: 2 }}>
          <h1
            className="fs-3 fs-md-4 fw-bold mb-1"
            style={{ fontFamily: "Poppins, serif" }}
          >
            🎉 Events & Festivals
          </h1>
          <p style={{ opacity: 0.85, fontSize: "0.85rem", margin: 0 }}>
            Celebrate Calbayog's vibrant culture
          </p>
        </div>
      </div>

      <Container className="py-3">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div
            className="category-pills"
            style={{
              flex: 1,
              overflowX: "auto",
              whiteSpace: "nowrap",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`category-pill ${activeCategory === cat ? "active" : ""}`}
                onClick={() => setActiveCategory(cat)}
                style={{ display: "inline-block" }}
              >
                {cat}
              </button>
            ))}
          </div>
          <button
            onClick={() => setUpcomingOnly(!upcomingOnly)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              border: "2px solid var(--festival-amber)",
              background: upcomingOnly
                ? "var(--festival-amber)"
                : "transparent",
              color: upcomingOnly ? "#fff" : "var(--festival-amber)",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            🗓️ Upcoming
          </button>
        </div>

        {upcomingOnly && (
          <div className="mb-3" key="events-calendar">
            <Calendar
              events={calendarEvents}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <Spinner
              animation="border"
              style={{ color: "var(--tropical-green)" }}
            />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-5">
            <div style={{ fontSize: "3rem" }}>{selectedDate ? "📅" : "🎉"}</div>
            <p className="text-muted mt-2">
              {selectedDate ? "No events on this date." : "No events found."}
            </p>
          </div>
        ) : (
          <Row className="g-3">
            {events.map((event, idx) => (
              <Col xs={12} sm={6} lg={4} key={event._id || `event-${idx}`}>
                <Card
                  className="tourism-card h-100"
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelected(event)}
                >
                  {event.image ? (
                    <img
                      src={event.image}
                      alt={event.title}
                      className="card-img-top"
                      style={{
                        height: "140px",
                        minHeight: "120px",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        height: "120px",
                        minHeight: "100px",
                        background: `${categoryColors[event.category] || "#6c757d"}22`,
                        fontSize: "2.5rem",
                      }}
                    >
                      🎉
                    </div>
                  )}
                  <Card.Body className="p-3">
                    <Badge
                      style={{
                        background:
                          categoryColors[event.category] ||
                          "var(--tropical-green)",
                        fontSize: "0.65rem",
                      }}
                      className="mb-2"
                    >
                      {event.category}
                    </Badge>
                    <h5
                      className="fw-bold mb-1"
                      style={{
                        fontFamily: "Poppins, serif",
                        fontSize: "0.95rem",
                      }}
                    >
                      {event.title}
                    </h5>
                    <p
                      className="text-muted mb-1"
                      style={{ fontSize: "0.75rem" }}
                    >
                      📅 {formatDate(event.startDate)} –{" "}
                      {formatDate(event.endDate)}
                    </p>
                    <p
                      className="text-muted mb-2"
                      style={{ fontSize: "0.75rem" }}
                    >
                      📍 {event.venue}
                    </p>
                    <p
                      className="text-muted mb-2"
                      style={{ fontSize: "0.78rem" }}
                    >
                      {event.description.slice(0, 80)}...
                    </p>
                    <div className="d-flex gap-2">
                      <Badge
                        bg={event.isFree ? "success" : "warning"}
                        style={{ fontSize: "0.65rem" }}
                      >
                        {event.isFree
                          ? "🆓 Free"
                          : `🎟️ ${event.ticketPrice || "Ticketed"}`}
                      </Badge>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>

      {/* Event Detail Modal */}
      <Modal
        show={!!selected}
        onHide={() => setSelected(null)}
        centered
        size="lg"
      >
        {selected && (
          <>
            <Modal.Header closeButton>
              <Modal.Title
                style={{ fontFamily: "Poppins, serif", fontSize: "1.1rem" }}
              >
                {selected.title}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selected.image && (
                <img
                  src={selected.image}
                  alt={selected.title}
                  className="w-100 rounded mb-3"
                  style={{
                    height: "180px",
                    minHeight: "150px",
                    objectFit: "cover",
                  }}
                />
              )}
              <div className="d-flex flex-wrap gap-2 mb-3">
                <Badge
                  style={{
                    background:
                      categoryColors[selected.category] ||
                      "var(--tropical-green)",
                    fontSize: "0.75rem",
                  }}
                >
                  {selected.category}
                </Badge>
                <Badge
                  bg={selected.isFree ? "success" : "warning"}
                  style={{ fontSize: "0.75rem" }}
                >
                  {selected.isFree ? "🆓 Free" : `🎟️ ${selected.ticketPrice}`}
                </Badge>
                {selected.featured && (
                  <Badge
                    style={{
                      background: "var(--festival-amber)",
                      fontSize: "0.75rem",
                    }}
                  >
                    ⭐ Featured
                  </Badge>
                )}
              </div>
              <p style={{ fontSize: "0.9rem" }}>
                <strong>📅 Date:</strong> {formatDate(selected.startDate)} –{" "}
                {formatDate(selected.endDate)}
              </p>
              <p style={{ fontSize: "0.9rem" }}>
                <strong>📍 Venue:</strong> {selected.venue}
              </p>
              {selected.organizer && (
                <p style={{ fontSize: "0.9rem" }}>
                  <strong>👤 Organizer:</strong> {selected.organizer}
                </p>
              )}
              <p className="text-muted" style={{ fontSize: "0.9rem" }}>
                {selected.description}
              </p>
              {selected.contact?.facebook && (
                <a
                  href={selected.contact.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline-primary btn-sm me-2"
                >
                  📘 Facebook Page
                </a>
              )}
            </Modal.Body>
            <Modal.Footer className="flex-wrap gap-2">
              <Button
                variant="outline-secondary"
                onClick={() => setSelected(null)}
                style={{ fontSize: "0.85rem" }}
              >
                Close
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </div>
  );
};

export default Events;
