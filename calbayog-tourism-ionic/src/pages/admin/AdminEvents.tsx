import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Badge,
  Spinner,
  Alert,
  Row,
  Col,
  Card,
} from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  clearCache,
  uploadMultipleImages,
  createNotification,
} from "../../services/api";
import { Event } from "../../types";
import { useDarkMode } from "../../context/DarkModeContext";

const CATEGORIES = [
  "Festival",
  "Cultural",
  "Sports",
  "Religious",
  "Food",
  "Music",
  "Arts",
  "Other",
];

const CATEGORY_COLORS: Record<
  string,
  { bg: string; text: string; gradient: string }
> = {
  Festival: {
    bg: "#f4a226",
    text: "#fff",
    gradient: "linear-gradient(135deg, #f4a226, #ff9f43)",
  },
  Cultural: {
    bg: "#667eea",
    text: "#fff",
    gradient: "linear-gradient(135deg, #667eea, #764ba2)",
  },
  Sports: {
    bg: "#4ade80",
    text: "#fff",
    gradient: "linear-gradient(135deg, #4ade80, #22c55e)",
  },
  Religious: {
    bg: "#e74c3c",
    text: "#fff",
    gradient: "linear-gradient(135deg, #e74c3c, #c0392b)",
  },
  Food: {
    bg: "#f97316",
    text: "#fff",
    gradient: "linear-gradient(135deg, #f97316, #ea580c)",
  },
  Music: {
    bg: "#8b5cf6",
    text: "#fff",
    gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  },
  Arts: {
    bg: "#ec4899",
    text: "#fff",
    gradient: "linear-gradient(135deg, #ec4899, #db2777)",
  },
  Other: {
    bg: "#6b7280",
    text: "#fff",
    gradient: "linear-gradient(135deg, #6b7280, #4b5563)",
  },
};

const EMPTY = {
  title: "",
  category: "Festival",
  description: "",
  startDate: "",
  endDate: "",
  venue: "",
  organizer: "",
  image: "",
  isFree: true,
  ticketPrice: "",
  featured: false,
};

const AdminEvents: React.FC = () => {
  const { darkMode } = useDarkMode();
  const [items, setItems] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [viewItem, setViewItem] = useState<Event | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [filteredItems, setFilteredItems] = useState<Event[]>([]);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);

  const toDateInput = (d: string) =>
    d ? new Date(d).toISOString().split("T")[0] : "";

  const load = () => {
    setLoading(true);
    clearCache("/events");
    getEvents()
      .then((r) => setItems(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let filtered = Array.isArray(items) ? items : [];
    if (featuredOnly) {
      filtered = filtered.filter((e) => e.featured);
    }
    if (upcomingOnly) {
      filtered = filtered.filter((e) => new Date(e.startDate) >= new Date());
    }
    if (freeOnly) {
      filtered = filtered.filter((e) => e.isFree);
    }
    setFilteredItems(filtered);
  }, [items, featuredOnly, upcomingOnly, freeOnly]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setImageFiles([]);
    setShowModal(true);
  };

  const openEdit = (e: Event) => {
    setEditing(e);
    setForm({
      title: e.title,
      category: e.category,
      description: e.description,
      startDate: toDateInput(e.startDate),
      endDate: toDateInput(e.endDate),
      venue: e.venue,
      organizer: e.organizer || "",
      image: e.image || "",
      isFree: e.isFree || false,
      ticketPrice: e.ticketPrice || "",
      featured: e.featured || false,
    });
    setError("");
    setImageFiles([]);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.startDate || !form.venue) {
      setError("Title, start date, and venue are required.");
      return;
    }
    setSaving(true);
    setError("");
    setUploading(true);
    try {
      // Upload images if any
      let imageUrl = form.image;
      if (imageFiles.length > 0) {
        try {
          const uploadResponse = await uploadMultipleImages(imageFiles);
          imageUrl = uploadResponse.data.urls?.[0] || "";
        } catch (uploadErr: any) {
          console.error("Image upload failed:", uploadErr);
          setError("Image upload failed. Saving event without image.");
        }
      }

      const payload = { ...form, image: imageUrl };
      if (editing) {
        await updateEvent(editing._id || (editing as any).id, payload);
      } else {
        const created = await createEvent(payload);
        const newEventId = created?.data?._id || created?.data?.id;
        // Create notification for new event
        try {
          await createNotification({
            userId: "all",
            type: "event_added",
            title: "New Event Added!",
            message: `Don't miss the new event: ${form.title}`,
            data: {
              eventId: newEventId,
              eventTitle: form.title,
              category: form.category,
              startDate: form.startDate,
            },
          });
        } catch (notifErr) {
          console.error("Failed to create notification:", notifErr);
        }
      }
      clearCache("/events");
      setShowModal(false);
      load();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.details ||
          "Failed to save.",
      );
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    await deleteEvent(id).catch(() => {});
    clearCache("/events");
    load();
  };

  const fc = (field: string, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const getCategoryBadge = (category: string) => {
    const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS["Other"];
    return (
      <Badge
        style={{
          background: colors.gradient,
          color: colors.text,
          border: "none",
          padding: "0.4rem 0.8rem",
          fontSize: "0.75rem",
          fontWeight: 600,
          borderRadius: "20px",
        }}
      >
        {category}
      </Badge>
    );
  };

  const featuredCount = items.filter((e) => e.featured).length;
  const upcomingCount = items.filter(
    (e) => new Date(e.startDate) >= new Date(),
  ).length;
  const freeCount = items.filter((e) => e.isFree).length;

  return (
    <AdminLayout>
      {/* Header Section */}
      <div
        style={{
          background: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
          borderRadius: "16px",
          padding: "2rem",
          marginBottom: "2rem",
          color: "#fff",
          boxShadow: darkMode
            ? "0 8px 24px rgba(0,0,0,0.3)"
            : "0 8px 24px rgba(26, 95, 74, 0.25)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-50%",
            right: "-10%",
            width: "300px",
            height: "300px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <h2
              className="fw-bold mb-1"
              style={{
                fontFamily: "Poppins, serif",
                fontSize: "clamp(1.4rem, 4vw, 2rem)",
              }}
            >
              🎉 Events
            </h2>
            <p style={{ fontSize: "0.9rem", opacity: 0.9, marginBottom: "0" }}>
              Manage festivals, cultural events, and activities
            </p>
          </div>
          <Button
            onClick={openCreate}
            style={{
              background: "linear-gradient(135deg, #f4a226 0%, #ff9f43 100%)",
              border: "none",
              borderRadius: "8px",
              padding: "0.6rem 1.2rem",
              fontWeight: 600,
              fontSize: "0.9rem",
              boxShadow: "0 4px 12px rgba(244, 162, 38, 0.3)",
              whiteSpace: "nowrap",
            }}
          >
            + Add New Event
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <Card
            className="border-0 h-100"
            style={{
              borderRadius: "16px",
              background: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
              color: "#fff",
              boxShadow: darkMode
                ? "0 8px 24px rgba(0,0,0,0.3)"
                : "0 8px 24px rgba(26, 95, 74, 0.25)",
              cursor: "pointer",
              transition: "transform 0.3s, box-shadow 0.3s",
            }}
            onClick={() => {
              setFeaturedOnly(false);
              setUpcomingOnly(false);
              setFreeOnly(false);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = darkMode
                ? "0 12px 32px rgba(0,0,0,0.4)"
                : "0 12px 32px rgba(26, 95, 74, 0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = darkMode
                ? "0 8px 24px rgba(0,0,0,0.3)"
                : "0 8px 24px rgba(26, 95, 74, 0.25)";
            }}
          >
            <Card.Body className="py-4">
              <div
                style={{
                  fontSize: "0.85rem",
                  opacity: 0.9,
                  marginBottom: 4,
                  fontWeight: 500,
                }}
              >
                Total Events
              </div>
              <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
                {items.length}
              </div>
              <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: 4 }}>
                All events
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card
            className="border-0 h-100"
            style={{
              borderRadius: "16px",
              background: "linear-gradient(135deg, #f4a226 0%, #ff9f43 100%)",
              color: "#fff",
              boxShadow: darkMode
                ? "0 8px 24px rgba(0,0,0,0.3)"
                : "0 8px 24px rgba(244, 162, 38, 0.25)",
              cursor: "pointer",
              transition: "transform 0.3s, box-shadow 0.3s",
            }}
            onClick={() => {
              setFeaturedOnly(true);
              setUpcomingOnly(false);
              setFreeOnly(false);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = darkMode
                ? "0 12px 32px rgba(0,0,0,0.4)"
                : "0 12px 32px rgba(244, 162, 38, 0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = darkMode
                ? "0 8px 24px rgba(0,0,0,0.3)"
                : "0 8px 24px rgba(244, 162, 38, 0.25)";
            }}
          >
            <Card.Body className="py-4">
              <div
                style={{
                  fontSize: "0.85rem",
                  opacity: 0.9,
                  marginBottom: 4,
                  fontWeight: 500,
                }}
              >
                Featured
              </div>
              <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
                {featuredCount}
              </div>
              <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: 4 }}>
                Highlighted events
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card
            className="border-0 h-100"
            style={{
              borderRadius: "16px",
              background: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",
              color: "#fff",
              boxShadow: darkMode
                ? "0 8px 24px rgba(0,0,0,0.3)"
                : "0 8px 24px rgba(74, 222, 128, 0.25)",
              cursor: "pointer",
              transition: "transform 0.3s, box-shadow 0.3s",
            }}
            onClick={() => {
              setFeaturedOnly(false);
              setUpcomingOnly(true);
              setFreeOnly(false);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = darkMode
                ? "0 12px 32px rgba(0,0,0,0.4)"
                : "0 12px 32px rgba(74, 222, 128, 0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = darkMode
                ? "0 8px 24px rgba(0,0,0,0.3)"
                : "0 8px 24px rgba(74, 222, 128, 0.25)";
            }}
          >
            <Card.Body className="py-4">
              <div
                style={{
                  fontSize: "0.85rem",
                  opacity: 0.9,
                  marginBottom: 4,
                  fontWeight: 500,
                }}
              >
                Upcoming
              </div>
              <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
                {upcomingCount}
              </div>
              <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: 4 }}>
                Future events
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card
            className="border-0 h-100"
            style={{
              borderRadius: "16px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              boxShadow: darkMode
                ? "0 8px 24px rgba(0,0,0,0.3)"
                : "0 8px 24px rgba(102, 126, 234, 0.25)",
              cursor: "pointer",
              transition: "transform 0.3s, box-shadow 0.3s",
            }}
            onClick={() => {
              setFeaturedOnly(false);
              setUpcomingOnly(false);
              setFreeOnly(true);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = darkMode
                ? "0 12px 32px rgba(0,0,0,0.4)"
                : "0 12px 32px rgba(102, 126, 234, 0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = darkMode
                ? "0 8px 24px rgba(0,0,0,0.3)"
                : "0 8px 24px rgba(102, 126, 234, 0.25)";
            }}
          >
            <Card.Body className="py-4">
              <div
                style={{
                  fontSize: "0.85rem",
                  opacity: 0.9,
                  marginBottom: 4,
                  fontWeight: 500,
                }}
              >
                Free Events
              </div>
              <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
                {freeCount}
              </div>
              <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: 4 }}>
                No admission fee
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Events Cards */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" style={{ color: "#1a5f4a" }} />
        </div>
      ) : filteredItems.length === 0 ? (
        <div
          className="text-center py-5"
          style={{
            background: darkMode ? "#1e1e2e" : "#fff",
            borderRadius: "16px",
          }}
        >
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎉</div>
          <h5
            style={{
              color: darkMode ? "#e0e0e0" : "#495057",
              marginBottom: "0.5rem",
            }}
          >
            No Events Found
          </h5>
          <p
            style={{
              color: darkMode ? "#b0b0c0" : "#6c757d",
              marginBottom: "1.5rem",
            }}
          >
            Try adjusting your filters
          </p>
          <Button
            onClick={() => {
              setFeaturedOnly(false);
              setUpcomingOnly(false);
              setFreeOnly(false);
            }}
            style={{
              background: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
              border: "none",
              borderRadius: "8px",
              padding: "0.6rem 1.5rem",
              fontWeight: 600,
            }}
          >
            Show All Events
          </Button>
        </div>
      ) : (
        <Row className="g-3 g-md-4">
          {filteredItems.map((ev, idx) => (
            <Col
              xs={12}
              sm={6}
              lg={4}
              xl={3}
              key={ev._id || ev.id || `event-${idx}`}
            >
              <Card
                className="h-100 border-0"
                style={{
                  borderRadius: "16px",
                  boxShadow: darkMode
                    ? "0 4px 16px rgba(0,0,0,0.3)"
                    : "0 4px 16px rgba(0,0,0,0.08)",
                  background: darkMode ? "#1e1e2e" : "#fff",
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onClick={() => setViewItem(ev)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = darkMode
                    ? "0 8px 24px rgba(0,0,0,0.4)"
                    : "0 8px 24px rgba(0,0,0,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = darkMode
                    ? "0 4px 16px rgba(0,0,0,0.3)"
                    : "0 4px 16px rgba(0,0,0,0.08)";
                }}
              >
                {ev.image ? (
                  <img
                    src={ev.image}
                    alt={ev.title}
                    style={{
                      height: 180,
                      width: "100%",
                      objectFit: "cover",
                      borderTopLeftRadius: "16px",
                      borderTopRightRadius: "16px",
                    }}
                  />
                ) : (
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      height: 180,
                      background:
                        CATEGORY_COLORS[ev.category]?.gradient ||
                        "linear-gradient(135deg, #f4a226 0%, #ff9f43 100%)",
                      borderTopLeftRadius: "16px",
                      borderTopRightRadius: "16px",
                      fontSize: "3rem",
                    }}
                  >
                    🎉
                  </div>
                )}
                <Card.Body className="p-3">
                  <div className="d-flex gap-1 flex-wrap mb-2">
                    {getCategoryBadge(ev.category)}
                    {ev.featured && (
                      <Badge
                        style={{
                          background: "#FFD700",
                          color: "#000",
                          fontSize: "0.7rem",
                          padding: "4px 8px",
                          borderRadius: "6px",
                        }}
                      >
                        ⭐ Featured
                      </Badge>
                    )}
                    {ev.isFree && (
                      <Badge
                        bg="success"
                        style={{
                          fontSize: "0.7rem",
                          padding: "4px 8px",
                          borderRadius: "6px",
                        }}
                      >
                        Free
                      </Badge>
                    )}
                  </div>
                  <h5
                    className="fw-bold mb-1"
                    style={{
                      fontFamily: "Poppins, serif",
                      fontSize: "1rem",
                      lineHeight: 1.3,
                      color: darkMode ? "#e0e0e0" : "#212529",
                    }}
                  >
                    {ev.title}
                  </h5>
                  {ev.description && (
                    <p
                      className="mb-2"
                      style={{
                        fontSize: "0.8rem",
                        lineHeight: 1.4,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        color: darkMode ? "#b0b0c0" : "#6c757d",
                      }}
                    >
                      {ev.description}
                    </p>
                  )}
                  <p
                    className="mb-2"
                    style={{
                      fontSize: "0.75rem",
                      color: darkMode ? "#b0b0c0" : "#6c757d",
                    }}
                  >
                    📅 {fmtDate(ev.startDate)}
                  </p>
                  <p
                    className="mb-2"
                    style={{
                      fontSize: "0.75rem",
                      color: darkMode ? "#b0b0c0" : "#6c757d",
                    }}
                  >
                    📍 {ev.venue}
                  </p>
                  <div className="d-flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(ev);
                      }}
                      style={{
                        borderRadius: "6px",
                        fontWeight: 500,
                        padding: "6px 12px",
                        borderColor: darkMode ? "#4ade80" : "#1a5f4a",
                        color: darkMode ? "#4ade80" : "#1a5f4a",
                        flex: 1,
                      }}
                    >
                      ✏️ Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(ev._id);
                      }}
                      style={{
                        borderRadius: "6px",
                        fontWeight: 500,
                        padding: "6px 12px",
                        borderColor: "#FF7043",
                        color: "#FF7043",
                        flex: 1,
                      }}
                    >
                      🗑️ Delete
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Enhanced Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
        fullscreen="sm-down"
      >
        <Modal.Header
          closeButton
          style={{
            background: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
            color: "#fff",
            border: "none",
            borderRadius: "16px 16px 0 0",
          }}
        >
          <Modal.Title
            style={{ fontFamily: "Poppins, serif", fontSize: "1.5rem" }}
          >
            {editing ? "✏️ Edit Event" : "🎉 Add New Event"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{ background: darkMode ? "#1e1e2e" : "#fff", padding: "2rem" }}
        >
          {error && (
            <Alert
              variant="danger"
              className="py-2"
              style={{ borderRadius: "8px", border: "none" }}
            >
              {error}
            </Alert>
          )}
          <Row className="g-3">
            <Col xs={12} sm={8}>
              <Form.Label
                className="fw-semibold"
                style={{ color: darkMode ? "#e0e0e0" : "#495057" }}
              >
                Title *
              </Form.Label>
              <Form.Control
                value={form.title}
                onChange={(e) => fc("title", e.target.value)}
                style={{
                  borderRadius: "8px",
                  border: "2px solid #dee2e6",
                  background: darkMode ? "#2a2a3e" : "#fff",
                  color: darkMode ? "#e0e0e0" : "#212529",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#1a5f4a")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#dee2e6")}
              />
            </Col>
            <Col xs={12} sm={4}>
              <Form.Label
                className="fw-semibold"
                style={{ color: darkMode ? "#e0e0e0" : "#495057" }}
              >
                Category
              </Form.Label>
              <Form.Select
                value={form.category}
                onChange={(e) => fc("category", e.target.value)}
                style={{
                  borderRadius: "8px",
                  border: "2px solid #dee2e6",
                  background: darkMode ? "#2a2a3e" : "#fff",
                  color: darkMode ? "#e0e0e0" : "#212529",
                }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={12}>
              <Form.Label
                className="fw-semibold"
                style={{ color: darkMode ? "#e0e0e0" : "#495057" }}
              >
                Description
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={form.description}
                onChange={(e) => fc("description", e.target.value)}
                style={{
                  borderRadius: "8px",
                  border: "2px solid #dee2e6",
                  background: darkMode ? "#2a2a3e" : "#fff",
                  color: darkMode ? "#e0e0e0" : "#212529",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#1a5f4a")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#dee2e6")}
              />
            </Col>
            <Col xs={6}>
              <Form.Label
                className="fw-semibold"
                style={{ color: darkMode ? "#e0e0e0" : "#495057" }}
              >
                Start Date *
              </Form.Label>
              <Form.Control
                type="date"
                value={form.startDate}
                onChange={(e) => fc("startDate", e.target.value)}
                style={{
                  borderRadius: "8px",
                  border: "2px solid #dee2e6",
                  background: darkMode ? "#2a2a3e" : "#fff",
                  color: darkMode ? "#e0e0e0" : "#212529",
                }}
              />
            </Col>
            <Col xs={6}>
              <Form.Label
                className="fw-semibold"
                style={{ color: darkMode ? "#e0e0e0" : "#495057" }}
              >
                End Date
              </Form.Label>
              <Form.Control
                type="date"
                value={form.endDate}
                onChange={(e) => fc("endDate", e.target.value)}
                style={{
                  borderRadius: "8px",
                  border: "2px solid #dee2e6",
                  background: darkMode ? "#2a2a3e" : "#fff",
                  color: darkMode ? "#e0e0e0" : "#212529",
                }}
              />
            </Col>
            <Col xs={12}>
              <Form.Label
                className="fw-semibold"
                style={{ color: darkMode ? "#e0e0e0" : "#495057" }}
              >
                Venue *
              </Form.Label>
              <Form.Control
                value={form.venue}
                onChange={(e) => fc("venue", e.target.value)}
                style={{
                  borderRadius: "8px",
                  border: "2px solid #dee2e6",
                  background: darkMode ? "#2a2a3e" : "#fff",
                  color: darkMode ? "#e0e0e0" : "#212529",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#1a5f4a")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#dee2e6")}
              />
            </Col>
            <Col xs={6}>
              <Form.Label
                className="fw-semibold"
                style={{ color: darkMode ? "#e0e0e0" : "#495057" }}
              >
                Organizer
              </Form.Label>
              <Form.Control
                value={form.organizer}
                onChange={(e) => fc("organizer", e.target.value)}
                style={{
                  borderRadius: "8px",
                  border: "2px solid #dee2e6",
                  background: darkMode ? "#2a2a3e" : "#fff",
                  color: darkMode ? "#e0e0e0" : "#212529",
                }}
              />
            </Col>
            <Col xs={12}>
              <Form.Label
                className="fw-semibold"
                style={{ color: darkMode ? "#e0e0e0" : "#495057" }}
              >
                Image
              </Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const target = e.target as HTMLInputElement;
                  setImageFiles(Array.from(target.files || []));
                }}
                style={{
                  borderRadius: "8px",
                  border: "2px solid #dee2e6",
                  background: darkMode ? "#2a2a3e" : "#fff",
                  color: darkMode ? "#e0e0e0" : "#212529",
                }}
              />
              {imageFiles.length > 0 && (
                <div
                  className="mt-2"
                  style={{
                    fontSize: "0.85rem",
                    color: darkMode ? "#b0b0c0" : "#6c757d",
                  }}
                >
                  {imageFiles.length} file(s) selected
                </div>
              )}
              {editing && form.image && imageFiles.length === 0 && (
                <div
                  className="mt-2"
                  style={{
                    fontSize: "0.85rem",
                    color: darkMode ? "#b0b0c0" : "#6c757d",
                  }}
                >
                  Current image:{" "}
                  <a
                    href={form.image}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#1a5f4a" }}
                  >
                    View
                  </a>
                </div>
              )}
            </Col>
            <Col xs={6}>
              <Form.Check
                type="checkbox"
                label="🆓 Free Entry"
                checked={form.isFree}
                onChange={(e) => fc("isFree", e.target.checked)}
                style={{
                  color: darkMode ? "#e0e0e0" : "#495057",
                  marginTop: "2rem",
                }}
              />
            </Col>
            <Col xs={6}>
              <Form.Label
                className="fw-semibold"
                style={{ color: darkMode ? "#e0e0e0" : "#495057" }}
              >
                Ticket Price
              </Form.Label>
              <Form.Control
                value={form.ticketPrice}
                onChange={(e) => fc("ticketPrice", e.target.value)}
                disabled={form.isFree}
                placeholder="e.g. ₱100"
                style={{
                  borderRadius: "8px",
                  border: "2px solid #dee2e6",
                  background: darkMode ? "#2a2a3e" : "#fff",
                  color: darkMode ? "#e0e0e0" : "#212529",
                }}
              />
            </Col>
            <Col xs={12}>
              <Form.Check
                type="checkbox"
                label="⭐ Featured event"
                checked={form.featured}
                onChange={(e) => fc("featured", e.target.checked)}
                style={{ color: darkMode ? "#e0e0e0" : "#495057" }}
              />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer
          style={{
            background: darkMode ? "#1e1e2e" : "#fff",
            border: "none",
            borderRadius: "0 0 16px 16px",
          }}
        >
          <Button
            variant="secondary"
            onClick={() => setShowModal(false)}
            style={{ borderRadius: "8px", padding: "0.6rem 1.5rem" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || uploading}
            style={{
              background: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
              border: "none",
              borderRadius: "8px",
              padding: "0.6rem 1.5rem",
              fontWeight: 600,
            }}
          >
            {uploading
              ? "Uploading image..."
              : saving
                ? "Saving..."
                : "💾 Save Event"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Detail View Modal */}
      {viewItem && (
        <Modal
          show={!!viewItem}
          onHide={() => setViewItem(null)}
          size="lg"
          centered
          fullscreen="sm-down"
        >
          <Modal.Header
            closeButton
            style={{
              border: "none",
              paddingBottom: 0,
              background: darkMode ? "#2a2a3e" : "#fff",
              color: darkMode ? "#e0e0e0" : "#212529",
            }}
          >
            <Modal.Title
              style={{
                fontFamily: "Poppins, serif",
                color: darkMode ? "#e0e0e0" : "#212529",
              }}
            >
              🎉 {viewItem.title}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body
            className="pt-3"
            style={{ background: darkMode ? "#1e1e2e" : "#fff" }}
          >
            {viewItem.image && (
              <div className="mb-3">
                <img
                  src={viewItem.image}
                  alt={viewItem.title}
                  style={{
                    width: "100%",
                    height: 300,
                    objectFit: "cover",
                    borderRadius: "12px",
                  }}
                />
              </div>
            )}
            <div className="d-flex gap-2 flex-wrap mb-3">
              {getCategoryBadge(viewItem.category)}
              {viewItem.featured && (
                <Badge
                  style={{
                    background: "#FFD700",
                    color: "#000",
                    fontSize: "0.85rem",
                    padding: "6px 12px",
                    borderRadius: "6px",
                  }}
                >
                  ⭐ Featured
                </Badge>
              )}
              {viewItem.isFree && (
                <Badge
                  bg="success"
                  style={{
                    fontSize: "0.85rem",
                    padding: "6px 12px",
                    borderRadius: "6px",
                  }}
                >
                  Free
                </Badge>
              )}
            </div>
            {viewItem.description && (
              <p
                className="mb-3"
                style={{
                  fontSize: "0.95rem",
                  lineHeight: 1.7,
                  color: darkMode ? "#e0e0e0" : "#495057",
                }}
              >
                {viewItem.description}
              </p>
            )}
            <div className="mb-3">
              <p
                className="mb-1"
                style={{
                  fontSize: "0.85rem",
                  color: darkMode ? "#b0b0c0" : "#6c757d",
                  fontWeight: 600,
                }}
              >
                📅 Start Date
              </p>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: darkMode ? "#e0e0e0" : "#495057",
                }}
              >
                {fmtDate(viewItem.startDate)}
              </p>
            </div>
            {viewItem.endDate && (
              <div className="mb-3">
                <p
                  className="mb-1"
                  style={{
                    fontSize: "0.85rem",
                    color: darkMode ? "#b0b0c0" : "#6c757d",
                    fontWeight: 600,
                  }}
                >
                  📅 End Date
                </p>
                <p
                  style={{
                    fontSize: "0.95rem",
                    color: darkMode ? "#e0e0e0" : "#495057",
                  }}
                >
                  {fmtDate(viewItem.endDate)}
                </p>
              </div>
            )}
            <div className="mb-3">
              <p
                className="mb-1"
                style={{
                  fontSize: "0.85rem",
                  color: darkMode ? "#b0b0c0" : "#6c757d",
                  fontWeight: 600,
                }}
              >
                📍 Venue
              </p>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: darkMode ? "#e0e0e0" : "#495057",
                }}
              >
                {viewItem.venue}
              </p>
            </div>
            {viewItem.organizer && (
              <div className="mb-3">
                <p
                  className="mb-1"
                  style={{
                    fontSize: "0.85rem",
                    color: darkMode ? "#b0b0c0" : "#6c757d",
                    fontWeight: 600,
                  }}
                >
                  👤 Organizer
                </p>
                <p
                  style={{
                    fontSize: "0.95rem",
                    color: darkMode ? "#e0e0e0" : "#495057",
                  }}
                >
                  {viewItem.organizer}
                </p>
              </div>
            )}
            {!viewItem.isFree && viewItem.ticketPrice && (
              <div className="mb-3">
                <p
                  className="mb-1"
                  style={{
                    fontSize: "0.85rem",
                    color: darkMode ? "#b0b0c0" : "#6c757d",
                    fontWeight: 600,
                  }}
                >
                  💵 Ticket Price
                </p>
                <p
                  style={{
                    fontSize: "0.95rem",
                    color: darkMode ? "#e0e0e0" : "#495057",
                  }}
                >
                  {viewItem.ticketPrice}
                </p>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer
            style={{
              border: "none",
              background: darkMode ? "#1e1e2e" : "#fff",
            }}
          >
            <Button
              variant="secondary"
              onClick={() => setViewItem(null)}
              style={{ borderRadius: "8px" }}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </AdminLayout>
  );
};

export default AdminEvents;
