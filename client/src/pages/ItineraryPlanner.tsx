import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Badge,
  Form,
  Alert,
} from "react-bootstrap";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { arrayMove } from "@dnd-kit/sortable";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getAttractions } from "../services/api";
import { Destination, ItineraryDay } from "../types";

const STORAGE_KEY = "calbayog_itinerary";

const categoryColors: Record<string, string> = {
  Waterfalls: "#0077B6",
  Nature: "#1A7A4A",
  Beach: "#00A8CC",
  Cultural: "#8B5E34",
  Historical: "#6D4C41",
  Religious: "#F4A226",
  Adventure: "#E63946",
  Food: "#7B2D8B",
  Other: "#6C757D",
};

const SortableItem: React.FC<{
  id: string;
  dest: Destination;
  index: number;
  onRemove: () => void;
}> = ({ id, dest, index, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: "#fff",
        borderRadius: "14px",
        border: isDragging
          ? "2px solid var(--tropical-green)"
          : "1px solid #e9ecef",
        boxShadow: isDragging
          ? "0 10px 30px rgba(0,0,0,0.15)"
          : "0 2px 8px rgba(0,0,0,0.06)",
        opacity: isDragging ? 0.9 : 1,
        position: "relative",
        zIndex: isDragging ? 10 : 1,
      }}
      className="d-flex align-items-center gap-2 gap-md-3 p-2 p-md-3 mb-2"
      {...attributes}
    >
      {/* Drag handle */}
      <button
        {...listeners}
        aria-label={`Reorder ${dest.name}`}
        title="Drag to reorder"
        style={{
          cursor: "grab",
          border: "none",
          background: "transparent",
          color: "#9aa0a6",
          fontSize: "1.15rem",
          padding: "4px",
          flexShrink: 0,
          touchAction: "none",
        }}
      >
        ⋮⋮
      </button>

      {/* Stop number */}
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: "var(--tropical-green-light)",
          color: "var(--tropical-green)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: "0.75rem",
          flexShrink: 0,
        }}
      >
        {index + 1}
      </div>

      {/* Image */}
      {dest.images?.[0] ? (
        <img
          src={dest.images[0]}
          alt={dest.name}
          style={{
            width: 52,
            height: 52,
            objectFit: "cover",
            borderRadius: 10,
            border: "2px solid var(--tropical-green-light)",
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 52,
            height: 52,
            background:
              "linear-gradient(135deg, var(--tropical-green-light), var(--tropical-green))",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.35rem",
            flexShrink: 0,
          }}
        >
          🌿
        </div>
      )}

      {/* Information */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          className="mb-1 fw-semibold"
          style={{
            fontSize: "0.88rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: "#212529",
          }}
        >
          {dest.name}
        </p>

        <div className="d-flex gap-1 flex-wrap align-items-center">
          <Badge
            style={{
              background:
                categoryColors[dest.category] || "var(--tropical-green)",
              fontSize: "0.6rem",
              padding: "3px 6px",
            }}
          >
            {dest.category}
          </Badge>

          {dest.location_address && (
            <small
              className="text-muted d-none d-md-inline"
              style={{
                fontSize: "0.68rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              📍 {dest.location_address}
            </small>
          )}
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        aria-label={`Remove ${dest.name}`}
        title="Remove attraction"
        style={{
          border: "none",
          background: "transparent",
          color: "#dc3545",
          fontSize: "1rem",
          cursor: "pointer",
          padding: "6px 8px",
          borderRadius: "8px",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#fee2e2";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        ✕
      </button>
    </div>
  );
};

const ItineraryPlanner: React.FC = () => {
  const [days, setDays] = useState<ItineraryDay[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];

      return Array.isArray(parsed)
        ? parsed.map((day: ItineraryDay, index: number) => ({
            ...day,
            day: index + 1,
            destinations: Array.isArray(day.destinations)
              ? day.destinations
              : [],
          }))
        : [];
    } catch {
      return [];
    }
  });

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    getAttractions()
      .then((r) => {
        setDestinations(Array.isArray(r.data) ? r.data : []);
      })
      .catch((err) => {
        console.error("Failed to load attractions:", err);
        setDestinations([]);
      });
  }, []);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(destinations.map((d) => d.category).filter(Boolean)),
    );

    return ["All", ...unique];
  }, [destinations]);

  const filteredDestinations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return destinations.filter((dest) => {
      const matchesSearch =
        !query ||
        dest.name?.toLowerCase().includes(query) ||
        dest.category?.toLowerCase().includes(query) ||
        dest.location_address?.toLowerCase().includes(query);

      const matchesCategory =
        category === "All" || dest.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [destinations, search, category]);

  const totalDests = days.reduce(
    (sum, d) =>
      sum +
      (Array.isArray(d.destinations) ? d.destinations.length : 0),
    0,
  );

  const totalDays = days.length;

  const usedDestinationIds = useMemo(() => {
    return new Set(
      days.flatMap((day) =>
        Array.isArray(day.destinations)
          ? day.destinations.map((dest) => dest.id)
          : [],
      ),
    );
  }, [days]);

  const addDay = () => {
    const newDay: ItineraryDay = {
      id: `day-${Date.now()}`,
      day: days.length + 1,
      destinations: [],
    };

    setDays((prev) => [...prev, newDay]);
  };

  const removeDay = (dayId: string) => {
    setDays((prev) =>
      prev
        .filter((d) => d.id !== dayId)
        .map((d, i) => ({
          ...d,
          day: i + 1,
        })),
    );
  };

  const openPicker = (dayId: string) => {
    setActiveDayId(dayId);
    setSearch("");
    setCategory("All");
    setShowPicker(true);
  };

  const addDestToDay = (dest: Destination) => {
    if (!activeDayId) return;

    setDays((prev) =>
      prev.map((d) =>
        d.id === activeDayId &&
        !d.destinations.some((x) => x.id === dest.id)
          ? {
              ...d,
              destinations: [...d.destinations, dest],
            }
          : d,
      ),
    );
  };

  const removeDestFromDay = (dayId: string, destId: string) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? {
              ...d,
              destinations: Array.isArray(d.destinations)
                ? d.destinations.filter((x) => x.id !== destId)
                : [],
            }
          : d,
      ),
    );
  };

  const handleDragEnd = (event: DragEndEvent, dayId: string) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d;

        const oldIdx = d.destinations.findIndex(
          (x) => x.id === active.id,
        );

        const newIdx = d.destinations.findIndex(
          (x) => x.id === over.id,
        );

        if (oldIdx < 0 || newIdx < 0) return d;

        return {
          ...d,
          destinations: arrayMove(
            d.destinations,
            oldIdx,
            newIdx,
          ),
        };
      }),
    );
  };

  const saveItinerary = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (err) {
      console.error("Unable to save itinerary:", err);
    }
  };

  const clearItinerary = () => {
    localStorage.removeItem(STORAGE_KEY);
    setDays([]);
    setShowClearModal(false);
  };

  const exportPDF = () => {
    if (totalDests === 0) return;

    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("My Calbayog City Itinerary", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      `Generated: ${new Date().toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`,
      14,
      28,
    );

    doc.text(
      `${totalDays} day${totalDays !== 1 ? "s" : ""} • ${totalDests} attraction${totalDests !== 1 ? "s" : ""}`,
      14,
      34,
    );

    let y = 44;

    days.forEach((day) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(`Day ${day.day}`, 14, y);

      y += 6;

      if (!day.destinations || day.destinations.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.text("No attractions added", 14, y);
        y += 10;
      } else {
        autoTable(doc, {
          startY: y,
          head: [["#", "Attraction", "Category", "Address"]],
          body: day.destinations.map((d, index) => [
            String(index + 1),
            d.name,
            d.category,
            d.location_address || "",
          ]),
          theme: "striped",
          headStyles: {
            fillColor: [26, 122, 74],
          },
          margin: {
            left: 14,
            right: 14,
          },
        });

        y = ((doc as any).lastAutoTable?.finalY || y) + 12;
      }
    });

    doc.save("calbayog_itinerary.pdf");
  };

  return (
    <div className="page-enter">
      {/* HERO */}
      <div
        className="hero-section py-4 py-md-5 px-3 text-center"
        style={{ minHeight: 150 }}
      >
        <div style={{ position: "relative", zIndex: 2 }}>
          <div
            style={{
              fontSize: "2rem",
              marginBottom: "0.25rem",
            }}
          >
            🗺️
          </div>

          <h1
            className="fs-3 fs-md-2 fw-bold mb-1"
            style={{ fontFamily: "Poppins, serif" }}
          >
            Itinerary Planner
          </h1>

          <p
            style={{
              opacity: 0.88,
              fontSize: "0.9rem",
              margin: 0,
            }}
          >
            Build your perfect Calbayog adventure
          </p>
        </div>
      </div>

      <Container
        className="py-3 py-md-4"
        style={{ maxWidth: "1400px" }}
      >
        {/* SUMMARY */}
        <Row className="g-2 g-md-3 mb-3">
          <Col xs={4}>
            <Card
              className="border-0 h-100"
              style={{
                borderRadius: 14,
                boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
              }}
            >
              <Card.Body className="p-2 p-md-3 text-center">
                <div
                  style={{
                    fontSize: "1.35rem",
                    color: "var(--tropical-green)",
                  }}
                >
                  📅
                </div>
                <div className="fw-bold">{totalDays}</div>
                <small className="text-muted">
                  Day{totalDays !== 1 ? "s" : ""}
                </small>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={4}>
            <Card
              className="border-0 h-100"
              style={{
                borderRadius: 14,
                boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
              }}
            >
              <Card.Body className="p-2 p-md-3 text-center">
                <div
                  style={{
                    fontSize: "1.35rem",
                    color: "var(--tropical-green)",
                  }}
                >
                  📍
                </div>
                <div className="fw-bold">{totalDests}</div>
                <small className="text-muted">
                  Stop{totalDests !== 1 ? "s" : ""}
                </small>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={4}>
            <Card
              className="border-0 h-100"
              style={{
                borderRadius: 14,
                boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
              }}
            >
              <Card.Body className="p-2 p-md-3 text-center">
                <div style={{ fontSize: "1.35rem" }}>🌴</div>
                <div className="fw-bold">{destinations.length}</div>
                <small className="text-muted">Places</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* ACTION BAR */}
        <Card
          className="border-0 mb-4"
          style={{
            borderRadius: 16,
            boxShadow: "0 3px 14px rgba(0,0,0,0.08)",
          }}
        >
          <Card.Body className="p-3">
            <div className="d-flex flex-wrap gap-2">
              <Button
                onClick={addDay}
                style={{
                  background:
                    "linear-gradient(135deg, var(--tropical-green), #11998e)",
                  border: "none",
                  padding: "8px 18px",
                  fontWeight: 600,
                  borderRadius: 10,
                }}
              >
                ➕ Add Day
              </Button>

              <Button
                variant="outline-success"
                onClick={saveItinerary}
                disabled={days.length === 0}
                style={{
                  padding: "8px 18px",
                  fontWeight: 600,
                  borderRadius: 10,
                }}
              >
                {saved ? "✅ Saved!" : "💾 Save"}
              </Button>

              <Button
                variant="outline-warning"
                onClick={exportPDF}
                disabled={totalDests === 0}
                style={{
                  padding: "8px 18px",
                  fontWeight: 600,
                  borderRadius: 10,
                }}
              >
                📄 Export PDF
              </Button>

              {days.length > 0 && (
                <Button
                  variant="outline-danger"
                  onClick={() => setShowClearModal(true)}
                  style={{
                    padding: "8px 18px",
                    fontWeight: 600,
                    borderRadius: 10,
                  }}
                >
                  🗑️ Clear
                </Button>
              )}

              <Link
                to="/request-itinerary"
                className="btn btn-outline-primary"
                style={{
                  padding: "8px 18px",
                  fontWeight: 600,
                  borderRadius: 10,
                }}
              >
                🧭 Request Guided Tour
              </Link>
            </div>
          </Card.Body>
        </Card>

        {/* EMPTY STATE */}
        {days.length === 0 ? (
          <Card
            className="border-0 text-center"
            style={{
              borderRadius: 20,
              background:
                "linear-gradient(135deg, var(--tropical-green-light), #ffffff)",
              boxShadow: "0 4px 18px rgba(0,0,0,0.07)",
            }}
          >
            <Card.Body className="py-5 px-3">
              <div
                style={{
                  fontSize: "4rem",
                  marginBottom: "0.75rem",
                }}
              >
                🗓️
              </div>

              <h4
                className="fw-bold mb-2"
                style={{ fontFamily: "Poppins, serif" }}
              >
                Start Your Adventure
              </h4>

              <p
                className="text-muted mx-auto mb-4"
                style={{
                  maxWidth: 520,
                  fontSize: "0.9rem",
                }}
              >
                Create your first day and start adding the places you want
                to visit in Calbayog.
              </p>

              <Button
                onClick={addDay}
                style={{
                  background:
                    "linear-gradient(135deg, var(--tropical-green), #11998e)",
                  border: "none",
                  borderRadius: 12,
                  padding: "10px 24px",
                  fontWeight: 600,
                }}
              >
                ✨ Create Day 1
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <Row className="g-3 g-md-4">
            {days.map((day) => (
              <Col xs={12} md={6} lg={4} key={day.id}>
                <Card
                  className="h-100 border-0"
                  style={{
                    borderRadius: 18,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                    overflow: "hidden",
                    transition:
                      "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(-3px)";
                    e.currentTarget.style.boxShadow =
                      "0 9px 26px rgba(0,0,0,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 16px rgba(0,0,0,0.08)";
                  }}
                >
                  {/* Day header */}
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, var(--tropical-green), #11998e)",
                      color: "#fff",
                      padding: "14px 16px",
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <small
                          style={{
                            opacity: 0.8,
                            fontSize: "0.7rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                          }}
                        >
                          Your itinerary
                        </small>

                        <h5
                          className="fw-bold mb-0"
                          style={{
                            fontFamily: "Poppins, serif",
                          }}
                        >
                          Day {day.day}
                        </h5>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        <Badge
                          bg="light"
                          className="text-dark"
                          style={{
                            borderRadius: 20,
                            padding: "6px 10px",
                            fontSize: "0.7rem",
                          }}
                        >
                          {day.destinations.length} stop
                          {day.destinations.length !== 1 ? "s" : ""}
                        </Badge>

                        <button
                          onClick={() => removeDay(day.id)}
                          title="Remove this day"
                          style={{
                            border: "none",
                            background: "rgba(255,255,255,0.15)",
                            color: "#fff",
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            cursor: "pointer",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>

                  <Card.Body className="p-3">
                    {day.destinations.length > 0 ? (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(e) =>
                          handleDragEnd(e, day.id)
                        }
                      >
                        <SortableContext
                          items={day.destinations.map((d) => d.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {day.destinations.map((dest, index) => (
                            <SortableItem
                              key={dest.id}
                              id={dest.id}
                              dest={dest}
                              index={index}
                              onRemove={() =>
                                removeDestFromDay(
                                  day.id,
                                  dest.id,
                                )
                              }
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    ) : (
                      <div
                        className="text-center py-4 mb-3"
                        style={{
                          background:
                            "var(--tropical-green-light)",
                          border: "2px dashed var(--tropical-green)",
                          borderRadius: 14,
                        }}
                      >
                        <div style={{ fontSize: "2rem" }}>📍</div>
                        <p
                          className="mb-1 fw-semibold"
                          style={{
                            color: "var(--tropical-green)",
                            fontSize: "0.85rem",
                          }}
                        >
                          No attractions yet
                        </p>
                        <small className="text-muted">
                          Add places you want to visit
                        </small>
                      </div>
                    )}

                    <Button
                      variant="outline-success"
                      className="w-100"
                      onClick={() => openPicker(day.id)}
                      style={{
                        padding: "10px",
                        fontWeight: 600,
                        borderRadius: 11,
                        borderWidth: 2,
                      }}
                    >
                      ➕ Add Attraction
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* Helpful tip */}
        {days.length > 0 && (
          <Alert
            className="mt-4 border-0"
            style={{
              background: "#f8f9fa",
              borderRadius: 14,
              fontSize: "0.82rem",
            }}
          >
            💡 <strong>Planning tip:</strong> Drag the ⋮⋮ handle to change
            the order of your stops. Your itinerary is stored locally in
            your browser.
          </Alert>
        )}
      </Container>

      {/* ATTRACTION PICKER */}
      <Modal
        show={showPicker}
        onHide={() => setShowPicker(false)}
        centered
        scrollable
        size="lg"
      >
        <Modal.Header
          closeButton
          style={{
            border: "none",
            paddingBottom: "8px",
          }}
        >
          <div>
            <Modal.Title
              style={{
                fontFamily: "Poppins, serif",
                fontSize: "1.25rem",
              }}
            >
              🌟 Pick an Attraction
            </Modal.Title>

            <small className="text-muted">
              Choose a place to add to your itinerary
            </small>
          </div>
        </Modal.Header>

        <Modal.Body
          style={{
            maxHeight: "65vh",
            background: "#fafafa",
          }}
        >
          {/* Search */}
          <div
            className="p-3 mb-3"
            style={{
              background: "#fff",
              borderRadius: 14,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <Form.Control
              type="search"
              placeholder="🔎 Search attractions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                borderRadius: 10,
                padding: "10px 12px",
              }}
            />

            <div
              className="d-flex gap-2 mt-2"
              style={{
                overflowX: "auto",
                whiteSpace: "nowrap",
                paddingBottom: 2,
              }}
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    border:
                      category === cat
                        ? "2px solid var(--tropical-green)"
                        : "1px solid #dee2e6",
                    background:
                      category === cat
                        ? "var(--tropical-green)"
                        : "#fff",
                    color:
                      category === cat
                        ? "#fff"
                        : "#495057",
                    borderRadius: 20,
                    padding: "5px 11px",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-2">
            <small className="text-muted">
              {filteredDestinations.length} attraction
              {filteredDestinations.length !== 1 ? "s" : ""} found
            </small>
          </div>

          {filteredDestinations.length === 0 ? (
            <div className="text-center py-5">
              <div style={{ fontSize: "3rem" }}>🔎</div>
              <p className="text-muted mt-2 mb-0">
                No attractions match your search.
              </p>
            </div>
          ) : (
            <Row className="g-3">
              {filteredDestinations.map((dest) => {
                const alreadyUsed = usedDestinationIds.has(dest.id);

                return (
                  <Col xs={12} md={6} key={dest.id}>
                    <div
                      onClick={() => {
                        if (!alreadyUsed) {
                          addDestToDay(dest);
                        }
                      }}
                      style={{
                        border: alreadyUsed
                          ? "1px solid #e9ecef"
                          : "2px solid #e9ecef",
                        borderRadius: 14,
                        background: alreadyUsed
                          ? "#f5f5f5"
                          : "#fff",
                        padding: 12,
                        cursor: alreadyUsed
                          ? "default"
                          : "pointer",
                        opacity: alreadyUsed ? 0.65 : 1,
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!alreadyUsed) {
                          e.currentTarget.style.borderColor =
                            "var(--tropical-green)";
                          e.currentTarget.style.transform =
                            "translateY(-2px)";
                          e.currentTarget.style.boxShadow =
                            "0 5px 15px rgba(0,0,0,0.08)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!alreadyUsed) {
                          e.currentTarget.style.borderColor =
                            "#e9ecef";
                          e.currentTarget.style.transform =
                            "translateY(0)";
                          e.currentTarget.style.boxShadow =
                            "none";
                        }
                      }}
                    >
                      <div className="d-flex gap-3 align-items-center">
                        {dest.images?.[0] ? (
                          <img
                            src={dest.images[0]}
                            alt={dest.name}
                            style={{
                              width: 65,
                              height: 65,
                              objectFit: "cover",
                              borderRadius: 12,
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 65,
                              height: 65,
                              background:
                                "linear-gradient(135deg, var(--tropical-green-light), var(--tropical-green))",
                              borderRadius: 12,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "1.7rem",
                              flexShrink: 0,
                            }}
                          >
                            🌿
                          </div>
                        )}

                        <div
                          style={{
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <p
                            className="mb-1 fw-bold"
                            style={{
                              fontSize: "0.9rem",
                              color: "#212529",
                            }}
                          >
                            {dest.name}
                          </p>

                          <Badge
                            style={{
                              background:
                                categoryColors[dest.category] ||
                                "var(--tropical-green)",
                              fontSize: "0.62rem",
                            }}
                          >
                            {dest.category}
                          </Badge>

                          {dest.location_address && (
                            <small
                              className="text-muted d-block mt-1"
                              style={{
                                fontSize: "0.68rem",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              📍 {dest.location_address}
                            </small>
                          )}
                        </div>

                        <div
                          style={{
                            fontSize: "1.3rem",
                            color: alreadyUsed
                              ? "#adb5bd"
                              : "var(--tropical-green)",
                          }}
                        >
                          {alreadyUsed ? "✓" : "＋"}
                        </div>
                      </div>

                      {alreadyUsed && (
                        <small
                          className="text-muted d-block mt-2"
                          style={{
                            fontSize: "0.65rem",
                            textAlign: "right",
                          }}
                        >
                          Already in itinerary
                        </small>
                      )}
                    </div>
                  </Col>
                );
              })}
            </Row>
          )}
        </Modal.Body>
      </Modal>

      {/* CLEAR CONFIRMATION */}
      <Modal
        show={showClearModal}
        onHide={() => setShowClearModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title
            style={{
              fontFamily: "Poppins, serif",
              fontSize: "1.1rem",
            }}
          >
            🗑️ Clear Itinerary?
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p className="mb-2">
            Are you sure you want to remove your entire itinerary?
          </p>

          <small className="text-muted">
            This will remove {totalDays} day
            {totalDays !== 1 ? "s" : ""} and {totalDests} attraction
            {totalDests !== 1 ? "s" : ""}.
          </small>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowClearModal(false)}
          >
            Cancel
          </Button>

          <Button variant="danger" onClick={clearItinerary}>
            Yes, Clear Itinerary
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ItineraryPlanner;