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
  getGuides,
  createGuide,
  updateGuide,
  deleteGuide,
  clearCache,
  createNotification,
} from "../../services/api";
import { Guide } from "../../types";
import { useDarkMode } from "../../context/DarkModeContext";

const EMPTY = {
  name: "",
  bio: "",
  phone: "",
  email: "",
  messenger: "",
  facebook: "",
  languages: "",
  specializations: "",
  assignedLocations: "",
  location_address: "",
  ratePerDay: "",
  photo: "",
  photoFile: null as File | null,
  dotAccredited: false,
  isAvailable: true,
  featured: false,
};

const AdminGuides: React.FC = () => {
  const { darkMode } = useDarkMode();
  const [items, setItems] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Guide | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tableError, setTableError] = useState("");
  const [filteredItems, setFilteredItems] = useState<Guide[]>([]);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [dotOnly, setDotOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [viewItem, setViewItem] = useState<Guide | null>(null);

  const load = () => {
    setLoading(true);
    clearCache("/guides");
    getGuides()
      .then((r) => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let filtered = Array.isArray(items) ? items : [];
    if (availableOnly) {
      filtered = filtered.filter((g) => g.is_active);
    }
    if (dotOnly) {
      filtered = filtered.filter((g) => g.dotAccredited);
    }
    if (featuredOnly) {
      filtered = filtered.filter((g) => g.featured);
    }
    setFilteredItems(filtered);
  }, [items, availableOnly, dotOnly, featuredOnly]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setShowModal(true);
  };

  const openEdit = (g: Guide) => {
    console.log("Opening edit for guide:", g);
    console.log("Guide ID fields:", { _id: (g as any)._id, id: (g as any).id });
    setEditing(g);
    setForm({
      name: g.name,
      bio: g.description || "",
      phone: g.contact_phone || "",
      email: g.contact_email || "",
      messenger: "",
      facebook: g.contact_facebook || "",
      languages: g.languages?.join(", ") || "",
      specializations: g.specialties?.join(", ") || "",
      assignedLocations: "",
      location_address: g.location_address || "",
      ratePerDay: g.rate || "",
      photo: g.image || "",
      photoFile: null,
      dotAccredited: false,
      isAvailable: g.is_active !== false,
      featured: g.featured || false,
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      let imageUrl = form.photo;

      // Upload photo if a new file was selected
      if (form.photoFile) {
        const formData = new FormData();
        formData.append("image", form.photoFile);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.message || "Failed to upload image");
        }

        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.url;
      }

      const payload: any = {
        name: form.name,
        description: form.bio,
        image: imageUrl,
        contact_phone: form.phone,
        contact_email: form.email,
        contact_facebook: form.facebook,
        languages: (form.languages || "")
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean),
        specialties: (form.specializations || "")
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean),
        rate: form.ratePerDay,
        is_active: form.isAvailable,
        featured: form.featured,
        location_address: form.location_address,
        location_lat: editing ? (editing as any).location_lat : 0,
        location_lng: editing ? (editing as any).location_lng : 0,
      };

      console.log("Saving guide payload:", payload);

      if (editing) {
        const guideId = (editing as any)._id || (editing as any).id;
        if (!guideId) {
          setError("Guide ID is missing.");
          setSaving(false);
          return;
        }
        await updateGuide(guideId, payload);
      } else {
        await createGuide(payload);
        try {
          await createNotification({
            userId: "all",
            type: "guide_added",
            title: "New Tour Guide Added!",
            message: `${form.name} is now available as a tour guide.`,
            data: { guideName: form.name },
          });
        } catch (notifErr) {
          console.error("Notification error:", notifErr);
        }
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (guide: Guide) => {
    if (!confirm(`Delete "${guide.name}"? This cannot be undone.`)) return;
    const guideId = (guide as any)._id || (guide as any).id;
    if (!guideId) {
      setTableError("Guide ID is missing.");
      return;
    }
    try {
      setTableError("");
      await deleteGuide(guideId);
      load();
    } catch {
      setTableError(`Failed to delete "${guide.name}". Please try again.`);
    }
  };

  const fc = (field: string, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  const availableCount = items.filter((g) => g.is_active).length;
  const dotCount = 0;

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
              🧭 Tour Guides
            </h2>
            <p style={{ fontSize: "0.9rem", opacity: 0.9, marginBottom: "0" }}>
              Manage tour guides and their specializations
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
            + Add New Guide
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={4}>
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
              setAvailableOnly(false);
              setDotOnly(false);
              setFeaturedOnly(false);
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
                Total Guides
              </div>
              <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
                {items.length}
              </div>
              <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: 4 }}>
                All guides
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={4}>
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
              setAvailableOnly(true);
              setDotOnly(false);
              setFeaturedOnly(false);
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
                Available
              </div>
              <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
                {availableCount}
              </div>
              <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: 4 }}>
                Ready to guide
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={4}>
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
              setAvailableOnly(false);
              setDotOnly(true);
              setFeaturedOnly(false);
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
                DOT Accredited
              </div>
              <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
                {dotCount}
              </div>
              <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: 4 }}>
                Certified guides
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Guides Table */}
      {tableError && (
        <Alert
          variant="danger"
          className="mb-3"
          style={{ borderRadius: "8px" }}
          onClose={() => setTableError("")}
          dismissible
        >
          {tableError}
        </Alert>
      )}
      <div
        style={{
          background: darkMode ? "#1e1e2e" : "#fff",
          borderRadius: "16px",
          padding: "1.5rem",
          boxShadow: darkMode
            ? "0 4px 16px rgba(0,0,0,0.3)"
            : "0 4px 16px rgba(0,0,0,0.08)",
        }}
      >
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" style={{ color: "#1a5f4a" }} />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-5">
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🧭</div>
            <h5
              style={{
                color: darkMode ? "#e0e0e0" : "#495057",
                marginBottom: "0.5rem",
              }}
            >
              No Guides Found
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
                setAvailableOnly(false);
                setDotOnly(false);
                setFeaturedOnly(false);
              }}
              style={{
                background: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
                border: "none",
                borderRadius: "8px",
                padding: "0.6rem 1.5rem",
                fontWeight: 600,
              }}
            >
              Show All Guides
            </Button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <Table
              className="align-middle"
              style={{
                borderCollapse: "separate",
                borderSpacing: "0 8px",
                background: darkMode ? "#1e1e2e" : "#fff",
                color: darkMode ? "#e0e0e0" : "#212529",
                minWidth: "600px",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      background: darkMode ? "#2a2a3e" : "#f8f9fa",
                      color: darkMode ? "#e0e0e0" : "#495057",
                      fontWeight: 600,
                      padding: "1rem",
                      borderBottom: "none",
                      borderRadius: "8px 8px 0 0",
                    }}
                  >
                    Guide
                  </th>
                  <th
                    style={{
                      background: darkMode ? "#2a2a3e" : "#f8f9fa",
                      color: darkMode ? "#e0e0e0" : "#495057",
                      fontWeight: 600,
                      padding: "1rem",
                      borderBottom: "none",
                      borderRadius: "8px 8px 0 0",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      background: darkMode ? "#2a2a3e" : "#f8f9fa",
                      color: darkMode ? "#e0e0e0" : "#495057",
                      fontWeight: 600,
                      padding: "1rem",
                      borderBottom: "none",
                      borderRadius: "8px 8px 0 0",
                    }}
                  >
                    Rate/Day
                  </th>
                  <th
                    style={{
                      background: darkMode ? "#2a2a3e" : "#f8f9fa",
                      color: darkMode ? "#e0e0e0" : "#495057",
                      fontWeight: 600,
                      padding: "1rem",
                      borderBottom: "none",
                      borderRadius: "8px 8px 0 0",
                    }}
                  >
                    Languages
                  </th>
                  <th
                    style={{
                      background: darkMode ? "#2a2a3e" : "#f8f9fa",
                      color: darkMode ? "#e0e0e0" : "#495057",
                      fontWeight: 600,
                      padding: "1rem",
                      borderBottom: "none",
                      borderRadius: "8px 8px 0 0",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((g, index) => (
                  <tr
                    key={(g as any)._id || (g as any).id || index}
                    style={{
                      background: darkMode ? "#1e1e2e" : "#fff",
                      boxShadow: darkMode
                        ? "0 2px 8px rgba(0,0,0,0.2)"
                        : "0 2px 8px rgba(0,0,0,0.06)",
                      transition: "transform 0.2s",
                      cursor: "pointer",
                    }}
                    onClick={() => setViewItem(g)}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "translateY(-2px)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "translateY(0)")
                    }
                  >
                    <td
                      style={{
                        padding: "1rem",
                        verticalAlign: "middle",
                        background: darkMode ? "#1e1e2e" : "#fff",
                      }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        {g.image && (
                          <img
                            src={g.image}
                            alt=""
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                        )}
                        <div>
                          <div
                            className="fw-semibold"
                            style={{
                              color: darkMode ? "#e0e0e0" : "#212529",
                              fontSize: "0.95rem",
                            }}
                          >
                            {g.name}
                          </div>
                          {g.description && (
                            <div
                              style={{
                                fontSize: "0.8rem",
                                color: darkMode ? "#b0b0c0" : "#6c757d",
                                marginTop: "0.25rem",
                              }}
                            >
                              {g.description.substring(0, 40)}...
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        verticalAlign: "middle",
                        background: darkMode ? "#1e1e2e" : "#fff",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          alignItems: "center",
                        }}
                      >
                        <Badge
                          bg={g.is_active ? "success" : "secondary"}
                          style={{
                            fontSize: "0.7rem",
                            padding: "0.25rem 0.5rem",
                          }}
                        >
                          {g.is_active ? "🟢 Available" : "🔴 Busy"}
                        </Badge>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        verticalAlign: "middle",
                        fontSize: "0.85rem",
                        color: darkMode ? "#e0e0e0" : "#495057",
                        background: darkMode ? "#1e1e2e" : "#fff",
                      }}
                    >
                      {g.rate ? `₱${g.rate}` : "—"}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        verticalAlign: "middle",
                        fontSize: "0.8rem",
                        color: darkMode ? "#e0e0e0" : "#495057",
                        background: darkMode ? "#1e1e2e" : "#fff",
                      }}
                    >
                      {g.languages?.slice(0, 2).join(", ")}
                      {g.languages && g.languages.length > 2
                        ? ` +${g.languages.length - 2}`
                        : ""}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        verticalAlign: "middle",
                        background: darkMode ? "#1e1e2e" : "#fff",
                      }}
                    >
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(g);
                          }}
                          style={{
                            borderRadius: "6px",
                            fontWeight: 500,
                            padding: "6px 12px",
                            borderColor: "#4FC3F7",
                            color: "#4FC3F7",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#4FC3F7";
                            e.currentTarget.style.color = "#fff";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "#4FC3F7";
                          }}
                        >
                          ✏️ Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(g);
                          }}
                          style={{
                            borderRadius: "6px",
                            fontWeight: 500,
                            padding: "6px 12px",
                            borderColor: "#FF7043",
                            color: "#FF7043",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#FF7043";
                            e.currentTarget.style.color = "#fff";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "#FF7043";
                          }}
                        >
                          🗑️ Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </div>

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
            {editing ? "✏️ Edit Guide" : "🧭 Add New Guide"}
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
                Full Name *
              </Form.Label>
              <Form.Control
                value={form.name}
                onChange={(e) => fc("name", e.target.value)}
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
                Photo
              </Form.Label>
              <div
                onClick={() =>
                  document.getElementById("guidePhotoInput")?.click()
                }
                style={{
                  border: "2px dashed #dee2e6",
                  borderRadius: "8px",
                  padding: "1.5rem",
                  textAlign: "center",
                  cursor: "pointer",
                  background: darkMode ? "#2a2a3e" : "#fff",
                  transition: "all 0.2s",
                  minHeight: "150px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "#1a5f4a")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "#dee2e6")
                }
              >
                <input
                  id="guidePhotoInput"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0] || null;
                    fc("photoFile", file);
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        fc("photo", reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {form.photo ? (
                  <>
                    <img
                      src={form.photo}
                      alt="Preview"
                      style={{
                        width: "100%",
                        maxWidth: "120px",
                        height: "120px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        marginBottom: "0.5rem",
                      }}
                    />
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: darkMode ? "#4ade80" : "#1a5f4a",
                        marginBottom: "0.35rem",
                      }}
                    >
                      Click to change photo
                    </div>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        fc("photo", "");
                        fc("photoFile", null);
                      }}
                      style={{ borderRadius: "6px", fontSize: "0.75rem" }}
                    >
                      Remove
                    </Button>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                      📷
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: darkMode ? "#b0b0c0" : "#6c757d",
                      }}
                    >
                      Click to upload
                    </div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: darkMode ? "#808090" : "#adb5bd",
                      }}
                    >
                      JPG, PNG, GIF, WebP
                    </div>
                  </>
                )}
              </div>
            </Col>
            <Col xs={12}>
              <Form.Label
                className="fw-semibold"
                style={{ color: darkMode ? "#e0e0e0" : "#495057" }}
              >
                Bio
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={form.bio}
                onChange={(e) => fc("bio", e.target.value)}
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
            <Col xs={12} sm={3}>
              <Form.Label
                className="fw-semibold"
                style={{ color: darkMode ? "#e0e0e0" : "#495057" }}
              >
                Phone
              </Form.Label>
              <Form.Control
                value={form.phone}
                onChange={(e) => fc("phone", e.target.value)}
                style={{
                  borderRadius: "8px",
                  border: "2px solid #dee2e6",
                  background: darkMode ? "#2a2a3e" : "#fff",
                  color: darkMode ? "#e0e0e0" : "#212529",
                }}
              />
            </Col>
            <Col xs={12} sm={3}>
              <Form.Label
                className="fw-semibold"
                style={{ color: darkMode ? "#e0e0e0" : "#495057" }}
              >
                Email
              </Form.Label>
              <Form.Control
                type="email"
                value={form.email}
                onChange={(e) => fc("email", e.target.value)}
                style={{
                  borderRadius: "8px",
                  border: "2px solid #dee2e6",
                  background: darkMode ? "#2a2a3e" : "#fff",
                  color: darkMode ? "#e0e0e0" : "#212529",
                }}
              />
            </Col>
            <Col xs={12} sm={3}>
              <Form.Label
                className="fw-semibold"
                style={{ color: darkMode ? "#e0e0e0" : "#495057" }}
              >
                Messenger URL
              </Form.Label>
              <Form.Control
                value={form.messenger}
                onChange={(e) => fc("messenger", e.target.value)}
                style={{
                  borderRadius: "8px",
                  border: "2px solid #dee2e6",
                  background: darkMode ? "#2a2a3e" : "#fff",
                  color: darkMode ? "#e0e0e0" : "#212529",
                }}
              />
            </Col>
            <Col xs={12} sm={3}>
              <Form.Label
                className="fw-semibold"
                style={{ color: darkMode ? "#e0e0e0" : "#495057" }}
              >
                Facebook URL
              </Form.Label>
              <Form.Control
                value={form.facebook}
                onChange={(e) => fc("facebook", e.target.value)}
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
                Languages (comma-separated)
              </Form.Label>
              <Form.Control
                value={form.languages}
                onChange={(e) => fc("languages", e.target.value)}
                placeholder="Filipino, English, Waray"
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
                Specializations (comma-separated)
              </Form.Label>
              <Form.Control
                value={form.specializations}
                onChange={(e) => fc("specializations", e.target.value)}
                placeholder="Hiking, Cultural, Eco-tour"
                style={{
                  borderRadius: "8px",
                  border: "2px solid #dee2e6",
                  background: darkMode ? "#2a2a3e" : "#fff",
                  color: darkMode ? "#e0e0e0" : "#212529",
                }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Form.Label
                className="fw-semibold"
                style={{ color: darkMode ? "#e0e0e0" : "#495057" }}
              >
                Assigned Locations (comma-separated)
              </Form.Label>
              <Form.Control
                value={form.assignedLocations}
                onChange={(e) => fc("assignedLocations", e.target.value)}
                style={{
                  borderRadius: "8px",
                  border: "2px solid #dee2e6",
                  background: darkMode ? "#2a2a3e" : "#fff",
                  color: darkMode ? "#e0e0e0" : "#212529",
                }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Form.Label
                className="fw-semibold"
                style={{ color: darkMode ? "#e0e0e0" : "#495057" }}
              >
                Location / Area
              </Form.Label>
              <Form.Control
                value={form.location_address}
                onChange={(e) => fc("location_address", e.target.value)}
                placeholder="e.g. Calbayog City, Samar"
                style={{
                  borderRadius: "8px",
                  border: "2px solid #dee2e6",
                  background: darkMode ? "#2a2a3e" : "#fff",
                  color: darkMode ? "#e0e0e0" : "#212529",
                }}
              />
            </Col>
            <Col xs={12} sm={4}>
              <Form.Label
                className="fw-semibold"
                style={{ color: darkMode ? "#e0e0e0" : "#495057" }}
              >
                Rate Per Day (₱)
              </Form.Label>
              <Form.Control
                type="number"
                value={form.ratePerDay}
                onChange={(e) => fc("ratePerDay", e.target.value)}
                style={{
                  borderRadius: "8px",
                  border: "2px solid #dee2e6",
                  background: darkMode ? "#2a2a3e" : "#fff",
                  color: darkMode ? "#e0e0e0" : "#212529",
                }}
              />
            </Col>
            <Col xs={12} sm={3} className="d-flex align-items-end">
              <Form.Check
                type="checkbox"
                label="✅ DOT Accredited"
                checked={form.dotAccredited}
                onChange={(e) => fc("dotAccredited", e.target.checked)}
                style={{ color: darkMode ? "#e0e0e0" : "#495057" }}
              />
            </Col>
            <Col xs={12} sm={3} className="d-flex align-items-end">
              <Form.Check
                type="checkbox"
                label="🟢 Available Now"
                checked={form.isAvailable}
                onChange={(e) => fc("isAvailable", e.target.checked)}
                style={{ color: darkMode ? "#e0e0e0" : "#495057" }}
              />
            </Col>
            <Col xs={12} sm={3} className="d-flex align-items-end">
              <Form.Check
                type="checkbox"
                label="⭐ Featured"
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
            disabled={saving}
            style={{
              background: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
              border: "none",
              borderRadius: "8px",
              padding: "0.6rem 1.5rem",
              fontWeight: 600,
            }}
          >
            {saving ? "Saving..." : "💾 Save Guide"}
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
              🧭 {viewItem.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body
            className="pt-3"
            style={{ background: darkMode ? "#1e1e2e" : "#fff" }}
          >
            {viewItem.image && (
              <div className="mb-3 text-center">
                <img
                  src={viewItem.image}
                  alt={viewItem.name}
                  style={{
                    width: 150,
                    height: 150,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              </div>
            )}
            <div className="d-flex gap-2 flex-wrap mb-3">
              <Badge
                bg={viewItem.is_active ? "success" : "secondary"}
                style={{
                  fontSize: "0.85rem",
                  padding: "6px 12px",
                  borderRadius: "6px",
                }}
              >
                {viewItem.is_active ? "🟢 Available" : "🔴 Busy"}
              </Badge>
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
                📞 Contact
              </p>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: darkMode ? "#e0e0e0" : "#495057",
                }}
              >
                {viewItem.contact_phone && (
                  <div>Phone: {viewItem.contact_phone}</div>
                )}
                {viewItem.contact_email && (
                  <div>Email: {viewItem.contact_email}</div>
                )}
                {viewItem.contact_facebook && (
                  <div>Facebook: {viewItem.contact_facebook}</div>
                )}
              </p>
            </div>
            {viewItem.rate && (
              <div className="mb-3">
                <p
                  className="mb-1"
                  style={{
                    fontSize: "0.85rem",
                    color: darkMode ? "#b0b0c0" : "#6c757d",
                    fontWeight: 600,
                  }}
                >
                  💵 Rate per Day
                </p>
                <p
                  style={{
                    fontSize: "0.95rem",
                    color: darkMode ? "#e0e0e0" : "#495057",
                  }}
                >
                  ₱{viewItem.rate}
                </p>
              </div>
            )}
            {viewItem.languages && viewItem.languages.length > 0 && (
              <div className="mb-3">
                <p
                  className="mb-1"
                  style={{
                    fontSize: "0.85rem",
                    color: darkMode ? "#b0b0c0" : "#6c757d",
                    fontWeight: 600,
                  }}
                >
                  🌍 Languages
                </p>
                <div className="d-flex gap-2 flex-wrap">
                  {viewItem.languages.map((lang) => (
                    <Badge
                      key={lang}
                      bg="light"
                      style={{
                        color: "#495057",
                        fontSize: "0.8rem",
                        padding: "4px 10px",
                        borderRadius: "6px",
                      }}
                    >
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {viewItem.specialties && viewItem.specialties.length > 0 && (
              <div className="mb-3">
                <p
                  className="mb-1"
                  style={{
                    fontSize: "0.85rem",
                    color: darkMode ? "#b0b0c0" : "#6c757d",
                    fontWeight: 600,
                  }}
                >
                  🎯 Specializations
                </p>
                <div className="d-flex gap-2 flex-wrap">
                  {viewItem.specialties.map((spec) => (
                    <Badge
                      key={spec}
                      bg="light"
                      style={{
                        color: "#495057",
                        fontSize: "0.8rem",
                        padding: "4px 10px",
                        borderRadius: "6px",
                      }}
                    >
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {viewItem.location_address && (
              <div className="mb-3">
                <p
                  className="mb-1"
                  style={{
                    fontSize: "0.85rem",
                    color: darkMode ? "#b0b0c0" : "#6c757d",
                    fontWeight: 600,
                  }}
                >
                  📍 Location
                </p>
                <p
                  style={{
                    fontSize: "0.95rem",
                    color: darkMode ? "#e0e0e0" : "#495057",
                  }}
                >
                  {viewItem.location_address}
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

export default AdminGuides;
