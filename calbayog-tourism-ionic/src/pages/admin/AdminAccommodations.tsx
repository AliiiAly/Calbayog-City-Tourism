import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  InputGroup,
  Dropdown,
} from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  getAccommodations,
  createAccommodation,
  updateAccommodation,
  deleteAccommodation,
  clearCache,
} from "../../services/api";
import { Accommodation } from "../../types";
import { useDarkMode } from "../../context/DarkModeContext";

const TYPES = [
  "All",
  "Hotel",
  "Resort",
  "Inn",
  "Pension House",
  "Hostel",
  "Guesthouse",
  "Homestay",
  "Other",
];
const EMPTY = {
  name: "",
  type: "Hotel",
  description: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  priceMin: "",
  priceMax: "",
  amenities: "",
  images: "",
  imageFiles: [] as File[],
  dotAccredited: false,
  featured: false,
};

const AdminAccommodations: React.FC = () => {
  const { darkMode } = useDarkMode();
  const [items, setItems] = useState<Accommodation[]>([]);
  const [filteredItems, setFilteredItems] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Accommodation | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [dotOnly, setDotOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [showTypesModal, setShowTypesModal] = useState(false);

  const load = () => {
    setLoading(true);
    getAccommodations()
      .then((r) => {
        const data = Array.isArray(r.data) ? r.data : [];
        setItems(data);
        setFilteredItems(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let filtered = Array.isArray(items) ? items : [];
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.location?.address
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );
    }
    if (typeFilter !== "All") {
      filtered = filtered.filter((item) => item.type === typeFilter);
    }
    if (dotOnly) {
      filtered = filtered.filter((item) => item.dotAccredited);
    }
    if (featuredOnly) {
      filtered = filtered.filter((item) => item.featured);
    }
    setFilteredItems(filtered);
  }, [searchTerm, typeFilter, dotOnly, featuredOnly, items]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setShowModal(true);
  };

  const openEdit = (a: Accommodation) => {
    setEditing(a);
    setForm({
      name: a.name,
      type: a.type,
      description: a.description || "",
      address: a.location?.address || "",
      phone: a.contact?.phone || "",
      email: a.contact?.email || "",
      website: a.contact?.website || "",
      priceMin: a.priceRange?.min?.toString() || "",
      priceMax: a.priceRange?.max?.toString() || "",
      amenities: a.amenities?.join(", ") || "",
      images: a.images?.join(", ") || "",
      imageFiles: [],
      dotAccredited: a.dotAccredited || false,
      featured: a.featured || false,
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
      let imageUrls = (form.images || "")
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);

      // Upload new image files
      if (form.imageFiles && form.imageFiles.length > 0) {
        for (const file of form.imageFiles) {
          const formData = new FormData();
          formData.append("image", file);
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
            },
            body: formData,
          });
          if (!uploadRes.ok) throw new Error("Failed to upload image");
          const uploadData = await uploadRes.json();
          imageUrls.push(uploadData.url);
        }
      }

      const payload = {
        name: form.name,
        type: form.type,
        description: form.description,
        location: { lat: 0, lng: 0, address: form.address },
        contact: {
          phone: form.phone,
          email: form.email,
          website: form.website,
        },
        priceRange: {
          min: Number(form.priceMin) || 0,
          max: Number(form.priceMax) || 0,
        },
        amenities: (form.amenities || "")
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean),
        images: imageUrls,
        dotAccredited: form.dotAccredited,
        featured: form.featured,
      };

      if (editing) {
        await updateAccommodation(editing.id, payload);
      } else {
        await createAccommodation(payload);
      }
      clearCache("accommodations");
      setShowModal(false);
      load();
    } catch (err: any) {
      setError(err?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this accommodation?")) return;
    await deleteAccommodation(id).catch(() => {});
    clearCache("accommodations");
    load();
  };

  const fc = (field: string, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      Hotel: "#2193b0",
      Resort: "#4facfe",
      Inn: "#43e97b",
      "Pension House": "#667eea",
      Hostel: "#f093fb",
      Guesthouse: "#ff9f43",
      Homestay: "#f857a6",
      Other: "#90A4AE",
    };
    return colors[type] || "#90A4AE";
  };

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2
            className="fw-bold mb-1"
            style={{
              fontFamily: "Poppins, serif",
              color: darkMode ? "#4ade80" : "#1a5f4a",
            }}
          >
            🏨 Accommodations
          </h2>
          <p
            style={{
              fontSize: "0.9rem",
              color: darkMode ? "#ffffff" : "#1a5f4a",
              marginBottom: 0,
            }}
          >
            Manage hotels, resorts & other accommodations
          </p>
        </div>
        <Button
          onClick={openCreate}
          style={{
            background: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            fontWeight: 600,
          }}
        >
          + Add New
        </Button>
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
              setSearchTerm("");
              setTypeFilter("All");
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
                Total
              </div>
              <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
                {items.length}
              </div>
              <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: 4 }}>
                All accommodations
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
              setSearchTerm("");
              setTypeFilter("All");
              setDotOnly(true);
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
                DOT Accredited
              </div>
              <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
                {Array.isArray(items)
                  ? items.filter((i) => i.dotAccredited).length
                  : 0}
              </div>
              <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: 4 }}>
                Certified hotels
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
              setSearchTerm("");
              setTypeFilter("All");
              setDotOnly(false);
              setFeaturedOnly(true);
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
                Featured
              </div>
              <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
                {Array.isArray(items)
                  ? items.filter((i) => i.featured).length
                  : 0}
              </div>
              <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: 4 }}>
                Highlighted
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card
            className="border-0 h-100"
            style={{
              borderRadius: "16px",
              background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
              color: "#fff",
              boxShadow: darkMode
                ? "0 8px 24px rgba(0,0,0,0.3)"
                : "0 8px 24px rgba(231, 76, 60, 0.25)",
              cursor: "pointer",
              transition: "transform 0.3s, box-shadow 0.3s",
            }}
            onClick={() => setShowTypesModal(true)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = darkMode
                ? "0 12px 32px rgba(0,0,0,0.4)"
                : "0 12px 32px rgba(231, 76, 60, 0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = darkMode
                ? "0 8px 24px rgba(0,0,0,0.3)"
                : "0 8px 24px rgba(231, 76, 60, 0.25)";
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
                Types
              </div>
              <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
                {new Set(items.map((i) => i.type)).size}
              </div>
              <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: 4 }}>
                Categories
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search and Filter */}
      <Row className="g-3 mb-4">
        <Col md={8}>
          <InputGroup>
            <InputGroup.Text
              style={{
                background: darkMode ? "#2a2a3e" : "#fff",
                borderTop: `1px solid ${darkMode ? "#3a3a5e" : "#ced4da"}`,
                borderBottom: `1px solid ${darkMode ? "#3a3a5e" : "#ced4da"}`,
                borderLeft: `1px solid ${darkMode ? "#3a3a5e" : "#ced4da"}`,
                borderRight: "none",
                borderRadius: "8px 0 0 8px",
                color: darkMode ? "#e0e0e0" : "#495057",
              }}
            >
              🔍
            </InputGroup.Text>
            <Form.Control
              placeholder="Search by name or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                borderTop: `1px solid ${darkMode ? "#3a3a5e" : "#ced4da"}`,
                borderBottom: `1px solid ${darkMode ? "#3a3a5e" : "#ced4da"}`,
                borderRight: `1px solid ${darkMode ? "#3a3a5e" : "#ced4da"}`,
                borderLeft: "none",
                borderRadius: "0 8px 8px 0",
                background: darkMode ? "#2a2a3e" : "#fff",
                color: darkMode ? "#e0e0e0" : "#212529",
              }}
            />
          </InputGroup>
        </Col>
        <Col md={4}>
          <Dropdown>
            <Dropdown.Toggle
              variant="outline-secondary"
              style={{
                width: "100%",
                borderRadius: "8px",
                background: darkMode ? "#2a2a3e" : "#fff",
                color: darkMode ? "#e0e0e0" : "#212529",
                borderColor: darkMode ? "#3a3a5e" : "#ced4da",
              }}
            >
              {typeFilter === "All" ? "All Types" : typeFilter}
            </Dropdown.Toggle>
            <Dropdown.Menu
              style={{
                width: "100%",
                background: darkMode ? "#1e1e2e" : "#fff",
                border: `1px solid ${darkMode ? "#3a3a5e" : "#dee2e6"}`,
              }}
            >
              {TYPES.map((t) => (
                <Dropdown.Item
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  active={typeFilter === t}
                  style={{ color: darkMode ? "#e0e0e0" : "#212529" }}
                >
                  {t}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5">
          <Spinner
            animation="border"
            style={{ color: "var(--tropical-green)" }}
          />
          <p className="text-muted mt-3">Loading accommodations...</p>
        </div>
      ) : (
        <div
          className="table-responsive"
          style={{
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: darkMode
              ? "0 4px 16px rgba(0,0,0,0.3)"
              : "0 4px 16px rgba(0,0,0,0.08)",
            background: darkMode ? "#1e1e2e" : "#fff",
          }}
        >
          <Table
            className="align-middle mb-0"
            style={{
              margin: 0,
              background: darkMode ? "#1e1e2e" : "#fff",
              color: darkMode ? "#e0e0e0" : "#212529",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    border: "none",
                    padding: "16px",
                    fontWeight: 700,
                    background: darkMode
                      ? "#2a2a3e"
                      : "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)",
                    color: darkMode ? "#4ade80" : "#fff",
                  }}
                >
                  Name
                </th>
                <th
                  style={{
                    border: "none",
                    padding: "16px",
                    fontWeight: 700,
                    background: darkMode
                      ? "#2a2a3e"
                      : "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)",
                    color: darkMode ? "#4ade80" : "#fff",
                  }}
                >
                  Type
                </th>
                <th
                  style={{
                    border: "none",
                    padding: "16px",
                    fontWeight: 700,
                    background: darkMode
                      ? "#2a2a3e"
                      : "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)",
                    color: darkMode ? "#4ade80" : "#fff",
                  }}
                >
                  Price Range
                </th>
                <th
                  style={{
                    border: "none",
                    padding: "16px",
                    fontWeight: 700,
                    background: darkMode
                      ? "#2a2a3e"
                      : "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)",
                    color: darkMode ? "#4ade80" : "#fff",
                  }}
                >
                  DOT
                </th>
                <th
                  style={{
                    border: "none",
                    padding: "16px",
                    fontWeight: 700,
                    background: darkMode
                      ? "#2a2a3e"
                      : "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)",
                    color: darkMode ? "#4ade80" : "#fff",
                  }}
                >
                  Featured
                </th>
                <th
                  style={{
                    border: "none",
                    padding: "16px",
                    fontWeight: 700,
                    background: darkMode
                      ? "#2a2a3e"
                      : "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)",
                    color: darkMode ? "#4ade80" : "#fff",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((a) => (
                <tr
                  key={a.id}
                  style={{
                    cursor: "pointer",
                    background: darkMode ? "#1e1e2e" : "#fff",
                  }}
                  onClick={() => openEdit(a)}
                >
                  <td
                    className="fw-semibold"
                    style={{
                      padding: "16px",
                      background: darkMode ? "#1e1e2e" : "#fff",
                    }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      {a.images?.[0] && (
                        <img
                          src={a.images[0]}
                          alt=""
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "8px",
                            objectFit: "cover",
                          }}
                        />
                      )}
                      <div>
                        <div
                          style={{ color: darkMode ? "#e0e0e0" : "#212529" }}
                        >
                          {a.name}
                        </div>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: darkMode ? "#b0b0c0" : "#6c757d",
                          }}
                        >
                          {a.location?.address}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "16px",
                      background: darkMode ? "#1e1e2e" : "#fff",
                    }}
                  >
                    <Badge
                      style={{
                        background: getTypeColor(a.type),
                        fontSize: "0.75rem",
                        padding: "6px 12px",
                      }}
                    >
                      {a.type}
                    </Badge>
                  </td>
                  <td
                    style={{
                      fontSize: "0.85rem",
                      padding: "16px",
                      background: darkMode ? "#1e1e2e" : "#fff",
                      color: darkMode ? "#e0e0e0" : "#495057",
                    }}
                  >
                    {a.priceRange?.min && a.priceRange?.max
                      ? `₱${a.priceRange.min.toLocaleString()} – ₱${a.priceRange.max.toLocaleString()}`
                      : a.priceRange?.min
                        ? `₱${a.priceRange.min.toLocaleString()}+`
                        : "—"}
                  </td>
                  <td
                    style={{
                      padding: "16px",
                      background: darkMode ? "#1e1e2e" : "#fff",
                    }}
                  >
                    {a.dotAccredited ? (
                      <Badge bg="success" style={{ padding: "6px 12px" }}>
                        ✅ DOT
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td
                    style={{
                      padding: "16px",
                      background: darkMode ? "#1e1e2e" : "#fff",
                    }}
                  >
                    {a.featured ? (
                      <Badge bg="warning" style={{ padding: "6px 12px" }}>
                        ⭐ Featured
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td
                    style={{
                      padding: "16px",
                      background: darkMode ? "#1e1e2e" : "#fff",
                    }}
                  >
                    <Button
                      size="sm"
                      variant="outline-primary"
                      className="me-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(a);
                      }}
                      style={{
                        borderRadius: "6px",
                        fontWeight: 500,
                        padding: "6px 12px",
                        borderColor: "#4FC3F7",
                        color: "#4FC3F7",
                      }}
                    >
                      ✏️ Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(a.id);
                      }}
                      style={{
                        borderRadius: "6px",
                        fontWeight: 500,
                        padding: "6px 12px",
                        borderColor: "#FF7043",
                        color: "#FF7043",
                      }}
                    >
                      🗑️ Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {filteredItems.length === 0 && (
            <div
              className="text-center py-5"
              style={{ background: darkMode ? "#1e1e2e" : "#fff" }}
            >
              <div style={{ fontSize: "3rem" }}>🏨</div>
              <p
                className="mt-2"
                style={{ color: darkMode ? "#b0b0c0" : "#6c757d" }}
              >
                No accommodations found.
              </p>
            </div>
          )}
        </div>
      )}

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
            {editing ? "✏️ Edit Accommodation" : "➕ Add Accommodation"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          className="pt-3"
          style={{ background: darkMode ? "#1e1e2e" : "#fff" }}
        >
          {error && (
            <Alert variant="danger" className="py-2">
              {error}
            </Alert>
          )}
          <Row className="g-3">
            <Col xs={12} sm={8}>
              <Form.Label
                className="fw-semibold"
                style={{
                  fontSize: "0.9rem",
                  color: darkMode ? "#e0e0e0" : "#495057",
                }}
              >
                Name *
              </Form.Label>
              <Form.Control
                value={form.name}
                onChange={(e) => fc("name", e.target.value)}
                placeholder="Hotel/Resort name"
                style={{
                  borderRadius: "8px",
                  background: darkMode ? "#2a2a3e" : "#fff",
                  color: darkMode ? "#e0e0e0" : "#212529",
                }}
              />
            </Col>
            <Col xs={12} sm={4}>
              <Form.Label
                className="fw-semibold"
                style={{
                  fontSize: "0.9rem",
                  color: darkMode ? "#e0e0e0" : "#495057",
                }}
              >
                Type
              </Form.Label>
              <Form.Select
                value={form.type}
                onChange={(e) => fc("type", e.target.value)}
                style={{
                  borderRadius: "8px",
                  background: darkMode ? "#2a2a3e" : "#fff",
                  color: darkMode ? "#e0e0e0" : "#212529",
                }}
              >
                {Array.isArray(TYPES)
                  ? TYPES.filter((t) => t !== "All").map((t) => (
                      <option key={t}>{t}</option>
                    ))
                  : []}
              </Form.Select>
            </Col>
            <Col xs={12}>
              <Form.Label
                className="fw-semibold"
                style={{
                  fontSize: "0.9rem",
                  color: darkMode ? "#e0e0e0" : "#495057",
                }}
              >
                Description
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={form.description}
                onChange={(e) => fc("description", e.target.value)}
                placeholder="Describe the accommodation..."
                style={{
                  borderRadius: "8px",
                  background: darkMode ? "#2a2a3e" : "#fff",
                  color: darkMode ? "#e0e0e0" : "#212529",
                }}
              />
            </Col>
            <Col xs={12}>
              <Form.Label
                className="fw-semibold"
                style={{
                  fontSize: "0.9rem",
                  color: darkMode ? "#e0e0e0" : "#495057",
                }}
              >
                Address
              </Form.Label>
              <Form.Control
                value={form.address}
                onChange={(e) => fc("address", e.target.value)}
                placeholder="Full address"
                style={{
                  borderRadius: "8px",
                  background: darkMode ? "#2a2a3e" : "#fff",
                  color: darkMode ? "#e0e0e0" : "#212529",
                }}
              />
            </Col>
            <Col xs={12} sm={4}>
              <Form.Label
                className="fw-semibold"
                style={{
                  fontSize: "0.9rem",
                  color: darkMode ? "#e0e0e0" : "#495057",
                }}
              >
                Phone
              </Form.Label>
              <Form.Control
                value={form.phone}
                onChange={(e) => fc("phone", e.target.value)}
                placeholder="Contact number"
                style={{
                  borderRadius: "8px",
                  background: darkMode ? "#2a2a3e" : "#fff",
                  color: darkMode ? "#e0e0e0" : "#212529",
                }}
              />
            </Col>
            <Col xs={12} sm={4}>
              <Form.Label
                className="fw-semibold"
                style={{
                  fontSize: "0.9rem",
                  color: darkMode ? "#e0e0e0" : "#495057",
                }}
              >
                Email
              </Form.Label>
              <Form.Control
                type="email"
                value={form.email}
                onChange={(e) => fc("email", e.target.value)}
                placeholder="Email address"
                style={{
                  borderRadius: "8px",
                  background: darkMode ? "#2a2a3e" : "#fff",
                  color: darkMode ? "#e0e0e0" : "#212529",
                }}
              />
            </Col>
            <Col xs={12} sm={4}>
              <Form.Label
                className="fw-semibold"
                style={{
                  fontSize: "0.9rem",
                  color: darkMode ? "#e0e0e0" : "#495057",
                }}
              >
                Website
              </Form.Label>
              <Form.Control
                value={form.website}
                onChange={(e) => fc("website", e.target.value)}
                placeholder="https://..."
                style={{
                  borderRadius: "8px",
                  background: darkMode ? "#2a2a3e" : "#fff",
                  color: darkMode ? "#e0e0e0" : "#212529",
                }}
              />
            </Col>
            <Col xs={6}>
              <Form.Label
                className="fw-semibold"
                style={{
                  fontSize: "0.9rem",
                  color: darkMode ? "#e0e0e0" : "#495057",
                }}
              >
                Min Price (₱)
              </Form.Label>
              <Form.Control
                type="number"
                value={form.priceMin}
                onChange={(e) => fc("priceMin", e.target.value)}
                placeholder="0"
                style={{
                  borderRadius: "8px",
                  background: darkMode ? "#2a2a3e" : "#fff",
                  color: darkMode ? "#e0e0e0" : "#212529",
                }}
              />
            </Col>
            <Col xs={6}>
              <Form.Label
                className="fw-semibold"
                style={{
                  fontSize: "0.9rem",
                  color: darkMode ? "#e0e0e0" : "#495057",
                }}
              >
                Max Price (₱)
              </Form.Label>
              <Form.Control
                type="number"
                value={form.priceMax}
                onChange={(e) => fc("priceMax", e.target.value)}
                placeholder="0"
                style={{
                  borderRadius: "8px",
                  background: darkMode ? "#2a2a3e" : "#fff",
                  color: darkMode ? "#e0e0e0" : "#212529",
                }}
              />
            </Col>
            <Col xs={12}>
              <Form.Label
                className="fw-semibold"
                style={{
                  fontSize: "0.9rem",
                  color: darkMode ? "#e0e0e0" : "#495057",
                }}
              >
                Amenities (comma-separated)
              </Form.Label>
              <Form.Control
                value={form.amenities}
                onChange={(e) => fc("amenities", e.target.value)}
                placeholder="WiFi, Pool, AC, Parking, Restaurant, Gym..."
                style={{
                  borderRadius: "8px",
                  background: darkMode ? "#2a2a3e" : "#fff",
                  color: darkMode ? "#e0e0e0" : "#212529",
                }}
              />
            </Col>
            <Col xs={12}>
              <Form.Label
                className="fw-semibold"
                style={{
                  fontSize: "0.9rem",
                  color: darkMode ? "#e0e0e0" : "#495057",
                }}
              >
                Images
              </Form.Label>
              <div
                onClick={() =>
                  document.getElementById("accommodationImageInput")?.click()
                }
                style={{
                  border: "2px dashed #dee2e6",
                  borderRadius: "8px",
                  padding: "1.5rem",
                  textAlign: "center",
                  cursor: "pointer",
                  background: darkMode ? "#2a2a3e" : "#fff",
                  transition: "all 0.2s",
                  minHeight: "120px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "#1a5f4a")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "#dee2e6")
                }
              >
                <input
                  id="accommodationImageInput"
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const files = Array.from(e.target.files || []);
                    fc("imageFiles", files);
                  }}
                />
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                  📷
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: darkMode ? "#b0b0c0" : "#6c757d",
                  }}
                >
                  Click to upload images
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: darkMode ? "#808090" : "#adb5bd",
                  }}
                >
                  JPG, PNG, GIF, WebP (multiple allowed)
                </div>
              </div>
              {/* Show selected files and existing images */}
              {form.imageFiles && form.imageFiles.length > 0 && (
                <div
                  className="mt-2"
                  style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
                >
                  {form.imageFiles.map((file, i) => (
                    <div
                      key={i}
                      style={{
                        position: "relative",
                        width: "60px",
                        height: "60px",
                      }}
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "6px",
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
              {form.images && (
                <div
                  className="mt-2"
                  style={{
                    fontSize: "0.8rem",
                    color: darkMode ? "#b0b0c0" : "#6c757d",
                  }}
                >
                  Existing images: {form.images.split(",").length} URLs
                </div>
              )}
            </Col>
            <Col xs={6}>
              <Form.Check
                type="checkbox"
                label="✅ DOT Accredited"
                checked={form.dotAccredited}
                onChange={(e) => fc("dotAccredited", e.target.checked)}
                style={{
                  fontSize: "0.9rem",
                  color: darkMode ? "#e0e0e0" : "#495057",
                }}
              />
            </Col>
            <Col xs={6}>
              <Form.Check
                type="checkbox"
                label="⭐ Featured"
                checked={form.featured}
                onChange={(e) => fc("featured", e.target.checked)}
                style={{
                  fontSize: "0.9rem",
                  color: darkMode ? "#e0e0e0" : "#495057",
                }}
              />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer
          style={{ border: "none", background: darkMode ? "#1e1e2e" : "#fff" }}
        >
          <Button
            variant="secondary"
            onClick={() => setShowModal(false)}
            style={{ borderRadius: "8px" }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving}
            style={{
              background: "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)",
              border: "none",
              borderRadius: "8px",
              padding: "10px 24px",
            }}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Types Modal */}
      <Modal
        show={showTypesModal}
        onHide={() => setShowTypesModal(false)}
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
            🏨 Accommodation Types
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          className="pt-3"
          style={{ background: darkMode ? "#1e1e2e" : "#fff" }}
        >
          <Row className="g-3">
            {TYPES.filter((t) => t !== "All").map((type) => {
              const count = items.filter((i) => i.type === type).length;
              return (
                <Col xs={6} md={4} key={type}>
                  <Card
                    className="border-0 h-100"
                    style={{
                      borderRadius: "12px",
                      background:
                        "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
                      color: "#fff",
                      cursor: "pointer",
                      transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                    onClick={() => {
                      setTypeFilter(type);
                      setShowTypesModal(false);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow =
                        "0 8px 20px rgba(0,0,0,0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <Card.Body className="py-4 text-center">
                      <div style={{ fontSize: "2rem", marginBottom: "8px" }}>
                        🏨
                      </div>
                      <div
                        style={{
                          fontSize: "1rem",
                          fontWeight: 600,
                          marginBottom: "4px",
                        }}
                      >
                        {type}
                      </div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                        {count}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Modal.Body>
        <Modal.Footer
          style={{ border: "none", background: darkMode ? "#1e1e2e" : "#fff" }}
        >
          <Button
            variant="secondary"
            onClick={() => setShowTypesModal(false)}
            style={{ borderRadius: "8px" }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
};

export default AdminAccommodations;
