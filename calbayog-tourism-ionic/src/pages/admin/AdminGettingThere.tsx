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
} from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  getGettingThere,
  createGettingThere,
  updateGettingThere,
  deleteGettingThere,
  clearCache,
} from "../../services/api";
import { useDarkMode } from "../../context/DarkModeContext";

type GEntry = {
  id: string;
  category: "land" | "local";
  origin?: string;
  steps?: string[];
  total_fare?: string;
  duration?: string;
  mode?: string;
  description?: string;
  icon?: string;
};

const EMPTY_LAND = {
  category: "land" as const,
  origin: "",
  steps: [""],
  total_fare: "",
  duration: "",
};
const EMPTY_LOCAL = {
  category: "local" as const,
  mode: "",
  description: "",
  icon: "🚗",
};

const td = (darkMode: boolean) => ({
  background: darkMode ? "#1e1e2e" : "#fff",
  color: darkMode ? "#e0e0e0" : "#212529",
  borderColor: darkMode ? "#2a2a3e" : "#dee2e6",
  padding: "0.85rem 1rem",
  verticalAlign: "middle" as const,
});

const AdminGettingThere: React.FC = () => {
  const { darkMode } = useDarkMode();
  const [items, setItems] = useState<GEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<GEntry | null>(null);
  const [catTab, setCatTab] = useState<"land" | "local">("land");
  const [formLand, setFormLand] = useState(EMPTY_LAND);
  const [formLocal, setFormLocal] = useState(EMPTY_LOCAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [viewItem, setViewItem] = useState<GEntry | null>(null);

  const load = () => {
    setLoading(true);
    clearCache("/getting-there");
    getGettingThere()
      .then((r) => setItems(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormLand(EMPTY_LAND);
    setFormLocal(EMPTY_LOCAL);
    setCatTab("land");
    setError("");
    setShowModal(true);
  };

  const openEdit = (e: GEntry) => {
    setEditing(e);
    setCatTab(e.category);
    if (e.category === "land") {
      setFormLand({
        category: "land",
        origin: e.origin || "",
        steps: e.steps?.length ? e.steps : [""],
        total_fare: e.total_fare || "",
        duration: e.duration || "",
      });
    } else {
      setFormLocal({
        category: "local",
        mode: e.mode || "",
        description: e.description || "",
        icon: e.icon || "🚗",
      });
    }
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload =
        catTab === "land"
          ? { ...formLand, steps: formLand.steps.filter((s) => s.trim()) }
          : { ...formLocal };
      if (editing) await updateGettingThere(editing.id, payload);
      else await createGettingThere(payload);
      setShowModal(false);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    await deleteGettingThere(id).catch(() => {});
    load();
  };

  const land = items.filter((i) => i.category === "land");
  const local = items.filter((i) => i.category === "local");

  const cardStyle = {
    background: darkMode ? "#1e1e2e" : "#fff",
    borderRadius: 16,
    padding: "1.5rem",
    marginBottom: "2rem",
    boxShadow: darkMode
      ? "0 4px 16px rgba(0,0,0,0.3)"
      : "0 4px 16px rgba(0,0,0,0.08)",
  };
  const thStyle = {
    background: darkMode ? "#2a2a3e" : "#f8f9fa",
    color: darkMode ? "#e0e0e0" : "#495057",
    fontWeight: 600,
    padding: "0.85rem 1rem",
    borderColor: darkMode ? "#2a2a3e" : "#dee2e6",
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
          borderRadius: 16,
          padding: "2rem",
          marginBottom: "2rem",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-50%",
            right: "-10%",
            width: 300,
            height: 300,
            background: "rgba(255,255,255,0.1)",
            borderRadius: "50%",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 className="fw-bold mb-1" style={{ fontFamily: "Poppins, serif" }}>
            🚗 Getting There
          </h2>
          <p style={{ opacity: 0.9, marginBottom: 0, fontSize: "0.95rem" }}>
            Manage land routes and local transport options
          </p>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <Badge bg="success" className="me-2">
            {land.length} Land Routes
          </Badge>
          <Badge bg="warning" text="dark">
            {local.length} Local Transport
          </Badge>
        </div>
        <Button
          onClick={openCreate}
          style={{
            background: "linear-gradient(135deg, #1a5f4a, #0d3d2e)",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          + Add Entry
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="success" />
        </div>
      ) : (
        <>
          {/* Land Routes Table */}
          <div style={cardStyle}>
            <h5
              className="fw-bold mb-3"
              style={{ color: darkMode ? "#e0e0e0" : "#495057" }}
            >
              🚌 Land Routes
            </h5>
            {land.length === 0 ? (
              <p style={{ color: darkMode ? "#b0b0c0" : "#6c757d" }}>
                No land routes yet.
              </p>
            ) : (
              <Table
                responsive
                style={{ borderCollapse: "separate", borderSpacing: "0 6px" }}
              >
                <thead>
                  <tr>
                    <th style={thStyle}>Origin</th>
                    <th style={thStyle}>Duration</th>
                    <th style={thStyle}>Total Fare</th>
                    <th style={thStyle}>Steps</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {land.map((e, idx) => (
                    <tr
                      key={e.id || idx}
                      style={{ cursor: "pointer" }}
                      onClick={() => setViewItem(e)}
                    >
                      <td style={td(darkMode)}>
                        <strong>{e.origin}</strong>
                      </td>
                      <td style={td(darkMode)}>{e.duration}</td>
                      <td style={td(darkMode)}>
                        <Badge bg="success">{e.total_fare}</Badge>
                      </td>
                      <td style={td(darkMode)}>
                        <small
                          style={{ color: darkMode ? "#b0b0c0" : "#6c757d" }}
                        >
                          {e.steps?.length || 0} steps
                        </small>
                      </td>
                      <td style={td(darkMode)}>
                        <Button
                          size="sm"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            openEdit(e);
                          }}
                          style={{
                            background: "#4FC3F7",
                            border: "none",
                            borderRadius: 6,
                            marginRight: 6,
                            fontWeight: 600,
                            color: "#fff",
                          }}
                        >
                          ✏️ Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            handleDelete(e.id);
                          }}
                          style={{
                            background: "#FF7043",
                            border: "none",
                            borderRadius: 6,
                            fontWeight: 600,
                            color: "#fff",
                          }}
                        >
                          🗑️ Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>

          {/* Local Transport Table */}
          <div style={cardStyle}>
            <h5
              className="fw-bold mb-3"
              style={{ color: darkMode ? "#e0e0e0" : "#495057" }}
            >
              🛺 Local Transport
            </h5>
            {local.length === 0 ? (
              <p style={{ color: darkMode ? "#b0b0c0" : "#6c757d" }}>
                No local transport yet.
              </p>
            ) : (
              <Table
                responsive
                style={{ borderCollapse: "separate", borderSpacing: "0 6px" }}
              >
                <thead>
                  <tr>
                    <th style={thStyle}>Icon</th>
                    <th style={thStyle}>Mode</th>
                    <th style={thStyle}>Description</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {local.map((e, idx) => (
                    <tr
                      key={e.id || idx}
                      style={{ cursor: "pointer" }}
                      onClick={() => setViewItem(e)}
                    >
                      <td style={td(darkMode)}>
                        <span style={{ fontSize: "1.5rem" }}>{e.icon}</span>
                      </td>
                      <td style={td(darkMode)}>
                        <strong>{e.mode}</strong>
                      </td>
                      <td style={td(darkMode)}>
                        <small
                          style={{ color: darkMode ? "#b0b0c0" : "#6c757d" }}
                        >
                          {e.description}
                        </small>
                      </td>
                      <td style={td(darkMode)}>
                        <Button
                          size="sm"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            openEdit(e);
                          }}
                          style={{
                            background: "#4FC3F7",
                            border: "none",
                            borderRadius: 6,
                            marginRight: 6,
                            fontWeight: 600,
                            color: "#fff",
                          }}
                        >
                          ✏️ Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            handleDelete(e.id);
                          }}
                          style={{
                            background: "#FF7043",
                            border: "none",
                            borderRadius: 6,
                            fontWeight: 600,
                            color: "#fff",
                          }}
                        >
                          🗑️ Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        size="lg"
      >
        <Modal.Header
          closeButton
          style={{
            background: darkMode ? "#1e1e2e" : "#fff",
            borderColor: darkMode ? "#2a2a3e" : "#dee2e6",
          }}
        >
          <Modal.Title
            style={{
              color: darkMode ? "#e0e0e0" : "#212529",
              fontFamily: "Poppins, serif",
            }}
          >
            {editing ? "✏️ Edit Entry" : "➕ Add Entry"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? "#1e1e2e" : "#fff" }}>
          {error && (
            <Alert variant="danger" style={{ borderRadius: 8 }}>
              {error}
            </Alert>
          )}

          {/* Category tabs */}
          <div className="d-flex gap-2 mb-4">
            {(["land", "local"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => !editing && setCatTab(cat)}
                style={{
                  padding: "6px 18px",
                  borderRadius: 20,
                  border: `2px solid ${catTab === cat ? "#1a5f4a" : "#dee2e6"}`,
                  background: catTab === cat ? "#1a5f4a" : "transparent",
                  color:
                    catTab === cat ? "#fff" : darkMode ? "#e0e0e0" : "#495057",
                  fontWeight: 600,
                  cursor: editing ? "default" : "pointer",
                  fontSize: "0.9rem",
                }}
              >
                {cat === "land" ? "🚌 Land" : "🛺 Local"}
              </button>
            ))}
          </div>

          {catTab === "land" ? (
            <>
              <Form.Group className="mb-3">
                <Form.Label
                  style={{
                    color: darkMode ? "#e0e0e0" : "#495057",
                    fontWeight: 600,
                  }}
                >
                  Origin (From)
                </Form.Label>
                <Form.Control
                  value={formLand.origin}
                  onChange={(e) =>
                    setFormLand((f) => ({ ...f, origin: e.target.value }))
                  }
                  placeholder="e.g. Allen Port (Samar)"
                  style={{
                    background: darkMode ? "#2a2a3e" : "#fff",
                    color: darkMode ? "#e0e0e0" : "#212529",
                    borderColor: darkMode ? "#3a3a4e" : "#dee2e6",
                  }}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label
                  style={{
                    color: darkMode ? "#e0e0e0" : "#495057",
                    fontWeight: 600,
                  }}
                >
                  Duration
                </Form.Label>
                <Form.Control
                  value={formLand.duration}
                  onChange={(e) =>
                    setFormLand((f) => ({ ...f, duration: e.target.value }))
                  }
                  placeholder="e.g. ~3 hours"
                  style={{
                    background: darkMode ? "#2a2a3e" : "#fff",
                    color: darkMode ? "#e0e0e0" : "#212529",
                    borderColor: darkMode ? "#3a3a4e" : "#dee2e6",
                  }}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label
                  style={{
                    color: darkMode ? "#e0e0e0" : "#495057",
                    fontWeight: 600,
                  }}
                >
                  Total Fare
                </Form.Label>
                <Form.Control
                  value={formLand.total_fare}
                  onChange={(e) =>
                    setFormLand((f) => ({ ...f, total_fare: e.target.value }))
                  }
                  placeholder="e.g. ₱120–₱180"
                  style={{
                    background: darkMode ? "#2a2a3e" : "#fff",
                    color: darkMode ? "#e0e0e0" : "#212529",
                    borderColor: darkMode ? "#3a3a4e" : "#dee2e6",
                  }}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label
                  style={{
                    color: darkMode ? "#e0e0e0" : "#495057",
                    fontWeight: 600,
                  }}
                >
                  Steps
                </Form.Label>
                {formLand.steps.map((step, i) => (
                  <div key={i} className="d-flex gap-2 mb-2">
                    <Form.Control
                      value={step}
                      onChange={(e) =>
                        setFormLand((f) => ({
                          ...f,
                          steps: f.steps.map((s, si) =>
                            si === i ? e.target.value : s,
                          ),
                        }))
                      }
                      placeholder={`Step ${i + 1}`}
                      style={{
                        background: darkMode ? "#2a2a3e" : "#fff",
                        color: darkMode ? "#e0e0e0" : "#212529",
                        borderColor: darkMode ? "#3a3a4e" : "#dee2e6",
                      }}
                    />
                    {formLand.steps.length > 1 && (
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() =>
                          setFormLand((f) => ({
                            ...f,
                            steps: f.steps.filter((_, si) => si !== i),
                          }))
                        }
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline-success"
                  onClick={() =>
                    setFormLand((f) => ({ ...f, steps: [...f.steps, ""] }))
                  }
                >
                  + Add Step
                </Button>
              </Form.Group>
            </>
          ) : (
            <>
              <Form.Group className="mb-3">
                <Form.Label
                  style={{
                    color: darkMode ? "#e0e0e0" : "#495057",
                    fontWeight: 600,
                  }}
                >
                  Icon (Emoji)
                </Form.Label>
                <Form.Control
                  value={formLocal.icon}
                  onChange={(e) =>
                    setFormLocal((f) => ({ ...f, icon: e.target.value }))
                  }
                  placeholder="e.g. 🛺"
                  style={{
                    background: darkMode ? "#2a2a3e" : "#fff",
                    color: darkMode ? "#e0e0e0" : "#212529",
                    borderColor: darkMode ? "#3a3a4e" : "#dee2e6",
                  }}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label
                  style={{
                    color: darkMode ? "#e0e0e0" : "#495057",
                    fontWeight: 600,
                  }}
                >
                  Mode (Transport name)
                </Form.Label>
                <Form.Control
                  value={formLocal.mode}
                  onChange={(e) =>
                    setFormLocal((f) => ({ ...f, mode: e.target.value }))
                  }
                  placeholder="e.g. Tricycle"
                  style={{
                    background: darkMode ? "#2a2a3e" : "#fff",
                    color: darkMode ? "#e0e0e0" : "#212529",
                    borderColor: darkMode ? "#3a3a4e" : "#dee2e6",
                  }}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label
                  style={{
                    color: darkMode ? "#e0e0e0" : "#495057",
                    fontWeight: 600,
                  }}
                >
                  Description (include fare)
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={formLocal.description}
                  onChange={(e) =>
                    setFormLocal((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="e.g. City Proper & nearby barangays, ₱10–₱30 per ride"
                  style={{
                    background: darkMode ? "#2a2a3e" : "#fff",
                    color: darkMode ? "#e0e0e0" : "#212529",
                    borderColor: darkMode ? "#3a3a4e" : "#dee2e6",
                  }}
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer
          style={{
            background: darkMode ? "#1e1e2e" : "#fff",
            borderColor: darkMode ? "#2a2a3e" : "#dee2e6",
          }}
        >
          <Button
            variant="outline-secondary"
            onClick={() => setShowModal(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: "linear-gradient(135deg, #1a5f4a, #0d3d2e)",
              border: "none",
              fontWeight: 600,
            }}
          >
            {saving
              ? "Saving..."
              : editing
                ? "💾 Save Changes"
                : "➕ Add Entry"}
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
              {viewItem.category === "land"
                ? "🚌 Land Route Details"
                : "🛺 Local Transport Details"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body
            className="pt-3"
            style={{ background: darkMode ? "#1e1e2e" : "#fff" }}
          >
            {viewItem.category === "land" ? (
              <>
                <div className="mb-3">
                  <p
                    className="mb-1"
                    style={{
                      fontSize: "0.85rem",
                      color: darkMode ? "#b0b0c0" : "#6c757d",
                      fontWeight: 600,
                    }}
                  >
                    📍 Origin
                  </p>
                  <p
                    style={{
                      fontSize: "0.95rem",
                      color: darkMode ? "#e0e0e0" : "#495057",
                    }}
                  >
                    {viewItem.origin}
                  </p>
                </div>
                {viewItem.duration && (
                  <div className="mb-3">
                    <p
                      className="mb-1"
                      style={{
                        fontSize: "0.85rem",
                        color: darkMode ? "#b0b0c0" : "#6c757d",
                        fontWeight: 600,
                      }}
                    >
                      ⏱️ Duration
                    </p>
                    <p
                      style={{
                        fontSize: "0.95rem",
                        color: darkMode ? "#e0e0e0" : "#495057",
                      }}
                    >
                      {viewItem.duration}
                    </p>
                  </div>
                )}
                {viewItem.total_fare && (
                  <div className="mb-3">
                    <p
                      className="mb-1"
                      style={{
                        fontSize: "0.85rem",
                        color: darkMode ? "#b0b0c0" : "#6c757d",
                        fontWeight: 600,
                      }}
                    >
                      💵 Total Fare
                    </p>
                    <p
                      style={{
                        fontSize: "0.95rem",
                        color: darkMode ? "#e0e0e0" : "#495057",
                      }}
                    >
                      {viewItem.total_fare}
                    </p>
                  </div>
                )}
                {viewItem.steps && viewItem.steps.length > 0 && (
                  <div className="mb-3">
                    <p
                      className="mb-1"
                      style={{
                        fontSize: "0.85rem",
                        color: darkMode ? "#b0b0c0" : "#6c757d",
                        fontWeight: 600,
                      }}
                    >
                      📋 Steps
                    </p>
                    <ol
                      style={{
                        fontSize: "0.95rem",
                        color: darkMode ? "#e0e0e0" : "#495057",
                        paddingLeft: "1.5rem",
                      }}
                    >
                      {viewItem.steps.map((step, i) => (
                        <li key={i} style={{ marginBottom: "0.5rem" }}>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="mb-3 text-center">
                  <span style={{ fontSize: "4rem" }}>{viewItem.icon}</span>
                </div>
                <div className="mb-3">
                  <p
                    className="mb-1"
                    style={{
                      fontSize: "0.85rem",
                      color: darkMode ? "#b0b0c0" : "#6c757d",
                      fontWeight: 600,
                    }}
                  >
                    🚗 Mode
                  </p>
                  <p
                    style={{
                      fontSize: "0.95rem",
                      color: darkMode ? "#e0e0e0" : "#495057",
                    }}
                  >
                    {viewItem.mode}
                  </p>
                </div>
                {viewItem.description && (
                  <div className="mb-3">
                    <p
                      className="mb-1"
                      style={{
                        fontSize: "0.85rem",
                        color: darkMode ? "#b0b0c0" : "#6c757d",
                        fontWeight: 600,
                      }}
                    >
                      📝 Description
                    </p>
                    <p
                      style={{
                        fontSize: "0.95rem",
                        lineHeight: 1.7,
                        color: darkMode ? "#e0e0e0" : "#495057",
                      }}
                    >
                      {viewItem.description}
                    </p>
                  </div>
                )}
              </>
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

export default AdminGettingThere;
