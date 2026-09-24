import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Badge,
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
import { getDestinations } from "../services/api";
import { Destination, ItineraryDay } from "../types";

const STORAGE_KEY = "calbayog_itinerary";

const SortableItem: React.FC<{
  id: string;
  dest: Destination;
  onRemove: () => void;
}> = ({ id, dest, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        border: "1px solid #e9ecef",
      }}
      {...attributes}
      className="itinerary-item d-flex align-items-center gap-3 p-3 mb-2"
    >
      <span
        {...listeners}
        style={{
          cursor: "grab",
          fontSize: "1.2rem",
          padding: "4px",
          color: "#6c757d",
        }}
      >
        ☰
      </span>
      {dest.images?.[0] ? (
        <img
          src={dest.images[0]}
          alt=""
          style={{
            width: 50,
            height: 50,
            objectFit: "cover",
            borderRadius: 10,
            border: "2px solid var(--tropical-green-light)",
          }}
        />
      ) : (
        <div
          style={{
            width: 50,
            height: 50,
            background:
              "linear-gradient(135deg, var(--tropical-green-light), var(--tropical-green))",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
          }}
        >
          🌿
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          className="mb-0 fw-semibold"
          style={{
            fontSize: "0.9rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: "#212529",
          }}
        >
          {dest.name}
        </p>
        <small className="text-muted" style={{ fontSize: "0.8rem" }}>
          {dest.category}
        </small>
      </div>
      <button
        onClick={onRemove}
        style={{
          border: "none",
          background: "none",
          color: "#dc3545",
          fontSize: "1.2rem",
          cursor: "pointer",
          padding: "4px 8px",
          borderRadius: "6px",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#fee2e2")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
      >
        ✕
      </button>
    </div>
  );
};

const ItineraryPlanner: React.FC = () => {
  const [days, setDays] = useState<ItineraryDay[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    getDestinations()
      .then((r) => setDestinations(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
  }, []);

  const addDay = () => {
    const newDay: ItineraryDay = {
      id: `day-${Date.now()}`,
      day: days.length + 1,
      destinations: [],
    };
    setDays((prev) => [...prev, newDay]);
  };

  const removeDay = (dayId: string) =>
    setDays((prev) =>
      Array.isArray(prev)
        ? prev
            .filter((d) => d.id !== dayId)
            .map((d, i) => ({ ...d, day: i + 1 }))
        : [],
    );

  const openPicker = (dayId: string) => {
    setActiveDayId(dayId);
    setShowPicker(true);
  };

  const addDestToDay = (dest: Destination) => {
    if (!activeDayId) return;
    setDays((prev) =>
      prev.map((d) =>
        d.id === activeDayId && !d.destinations.find((x) => x.id === dest.id)
          ? { ...d, destinations: [...d.destinations, dest] }
          : d,
      ),
    );
    setShowPicker(false);
  };

  const removeDestFromDay = (dayId: string, destId: string) =>
    setDays((prev) =>
      Array.isArray(prev)
        ? prev.map((d) =>
            d.id === dayId
              ? {
                  ...d,
                  destinations: Array.isArray(d.destinations)
                    ? d.destinations.filter((x) => x.id !== destId)
                    : [],
                }
              : d,
          )
        : [],
    );

  const handleDragEnd = (event: DragEndEvent, dayId: string) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setDays((prev) =>
        prev.map((d) => {
          if (d.id !== dayId) return d;
          const oldIdx = d.destinations.findIndex((x) => x.id === active.id);
          const newIdx = d.destinations.findIndex((x) => x.id === over?.id);
          return {
            ...d,
            destinations: arrayMove(d.destinations, oldIdx, newIdx),
          };
        }),
      );
    }
  };

  const saveItinerary = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("My Calbayog City Itinerary", 14, 20);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

    let y = 38;
    days.forEach((day) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(`Day ${day.day}`, 14, y);
      y += 6;

      if (day.destinations.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.text("  No destinations added", 14, y);
        y += 8;
      } else {
        autoTable(doc, {
          startY: y,
          head: [["Destination", "Category", "Address"]],
          body: day.destinations.map((d) => [
            d.name,
            d.category,
            d.location_address || "",
          ]),
          theme: "striped",
          headStyles: { fillColor: [26, 122, 74] },
          margin: { left: 14 },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }
    });

    doc.save("calbayog_itinerary.pdf");
  };

  const totalDests = days.reduce((sum, d) => sum + d.destinations.length, 0);

  return (
    <div className="page-enter">
      <div
        className="hero-section py-4 px-3 text-center"
        style={{ minHeight: 140 }}
      >
        <div style={{ position: "relative", zIndex: 2 }}>
          <h1
            className="fs-3 fw-bold mb-1"
            style={{ fontFamily: "Poppins, serif" }}
          >
            📋 Itinerary Planner
          </h1>
          <p style={{ opacity: 0.85, fontSize: "0.9rem", margin: 0 }}>
            Drag & drop your perfect Calbayog adventure
          </p>
        </div>
      </div>

      <Container className="py-3" style={{ maxWidth: "1400px" }}>
        {/* Actions */}
        <div
          className="d-flex gap-2 flex-wrap mb-4 p-3 rounded-xl"
          style={{
            background: "white",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          }}
        >
          <Button
            variant="primary"
            onClick={addDay}
            style={{
              background:
                "linear-gradient(135deg, var(--tropical-green), #11998e)",
              border: "none",
              padding: "8px 20px",
              fontWeight: 600,
            }}
          >
            ➕ Add Day
          </Button>
          <Button
            variant="outline-primary"
            onClick={saveItinerary}
            disabled={days.length === 0}
            style={{
              padding: "8px 20px",
              fontWeight: 500,
            }}
          >
            {saved ? "✅ Saved!" : "💾 Save"}
          </Button>
          <Button
            variant="warning"
            onClick={exportPDF}
            disabled={totalDests === 0}
            style={{
              padding: "8px 20px",
              fontWeight: 500,
            }}
          >
            📄 Export PDF
          </Button>
          <Link
            to="/request-itinerary"
            className="btn btn-outline-success"
            style={{
              padding: "8px 20px",
              fontWeight: 500,
            }}
          >
            📅 Request Guided Tour
          </Link>
        </div>

        {days.length === 0 ? (
          <div className="text-center py-5">
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🗓️</div>
            <h4
              className="fw-bold mb-2"
              style={{ fontFamily: "Poppins, serif" }}
            >
              Start Your Adventure
            </h4>
            <p className="text-muted">
              No days added yet. Click "➕ Add Day" to start planning your
              Calbayog trip!
            </p>
          </div>
        ) : (
          <Row className="g-4">
            {days.map((day) => (
              <Col xs={12} md={6} lg={4} key={day.id}>
                <Card
                  className="itinerary-day-card h-100 border-0"
                  style={{
                    borderRadius: "16px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 24px rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 16px rgba(0,0,0,0.1)";
                  }}
                >
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5
                        className="fw-bold mb-0"
                        style={{
                          fontFamily: "Poppins, serif",
                          fontSize: "1.3rem",
                          color: "var(--tropical-green)",
                        }}
                      >
                        Day {day.day}
                      </h5>
                      <div className="d-flex gap-2 align-items-center">
                        <Badge
                          style={{
                            background:
                              "linear-gradient(135deg, var(--tropical-green), #11998e)",
                            fontSize: "0.8rem",
                            padding: "6px 12px",
                            borderRadius: "20px",
                          }}
                        >
                          {day.destinations.length} stops
                        </Badge>
                        <button
                          onClick={() => removeDay(day.id)}
                          style={{
                            border: "none",
                            background: "none",
                            color: "#dc3545",
                            fontSize: "1.2rem",
                            cursor: "pointer",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#fee2e2")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "none")
                          }
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(e) => handleDragEnd(e, day.id)}
                    >
                      <SortableContext
                        items={day.destinations.map((d) => d.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {day.destinations.map((dest) => (
                          <SortableItem
                            key={dest.id}
                            id={dest.id}
                            dest={dest}
                            onRemove={() => removeDestFromDay(day.id, dest.id)}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>

                    {day.destinations.length === 0 && (
                      <div
                        className="text-center py-4 mb-2 rounded-lg"
                        style={{
                          background: "var(--tropical-green-light)",
                          border: "2px dashed var(--tropical-green)",
                          borderRadius: "12px",
                        }}
                      >
                        <p
                          className="text-muted mb-0"
                          style={{ fontSize: "0.9rem" }}
                        >
                          📍 No destinations yet
                        </p>
                      </div>
                    )}

                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="w-100 mt-3"
                      onClick={() => openPicker(day.id)}
                      style={{
                        padding: "10px",
                        fontWeight: 600,
                        borderRadius: "10px",
                        border: "2px solid var(--tropical-green)",
                        color: "var(--tropical-green)",
                      }}
                    >
                      ➕ Add Destination
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>

      {/* Destination Picker Modal */}
      <Modal
        show={showPicker}
        onHide={() => setShowPicker(false)}
        centered
        scrollable
        size="lg"
      >
        <Modal.Header closeButton style={{ border: "none", paddingBottom: 0 }}>
          <Modal.Title
            style={{ fontFamily: "Poppins, serif", fontSize: "1.3rem" }}
          >
            🌟 Pick a Destination
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "60vh" }}>
          <div className="row g-3">
            {destinations.map((dest) => (
              <div key={dest.id} className="col-12 col-md-6">
                <div
                  className="d-flex align-items-center gap-3 p-3 rounded-xl"
                  style={{
                    cursor: "pointer",
                    border: "2px solid #e9ecef",
                    borderRadius: "12px",
                    transition: "all 0.2s ease",
                    background: "white",
                  }}
                  onClick={() => addDestToDay(dest)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--tropical-green)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(17, 153, 142, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e9ecef";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {dest.images?.[0] ? (
                    <img
                      src={dest.images[0]}
                      alt=""
                      style={{
                        width: 60,
                        height: 60,
                        objectFit: "cover",
                        borderRadius: 12,
                        border: "2px solid var(--tropical-green-light)",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        background:
                          "linear-gradient(135deg, var(--tropical-green-light), var(--tropical-green))",
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.8rem",
                      }}
                    >
                      🌿
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      className="mb-1 fw-semibold"
                      style={{ fontSize: "0.95rem", color: "#212529" }}
                    >
                      {dest.name}
                    </p>
                    <Badge
                      bg="light"
                      className="text-dark border"
                      style={{ fontSize: "0.75rem" }}
                    >
                      {dest.category}
                    </Badge>
                  </div>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      color: "var(--tropical-green)",
                    }}
                  >
                    ➕
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ItineraryPlanner;
