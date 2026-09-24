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
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  clearCache,
} from "../../services/api";
import { AdminUser } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useDarkMode } from "../../context/DarkModeContext";

const EMPTY = {
  username: "",
  password: "",
  email: "",
  name: "",
};

const AdminManagement: React.FC = () => {
  const { darkMode } = useDarkMode();
  const { admin: currentAdmin } = useAuth();
  const [items, setItems] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [viewItem, setViewItem] = useState<AdminUser | null>(null);

  const load = () => {
    setLoading(true);
    // Clear cache to ensure fresh data
    clearCache("admin-management");
    getAdmins()
      .then((r) => {
        console.log("Admins loaded:", r.data);
        setItems(r.data);
      })
      .catch((err) => {
        console.error("Error loading admins:", err);
        setError("Failed to load admin accounts. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setShowModal(true);
  };

  const openEdit = (a: AdminUser) => {
    setEditing(a);
    setForm({
      username: a.username,
      password: "",
      email: a.email,
      name: a.name,
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.username || !form.email || !form.name) {
      setError("Username, email, and name are required.");
      return;
    }
    if (!editing && !form.password) {
      setError("Password is required for new admin accounts.");
      return;
    }
    setSaving(true);
    setError("");
    const payload: any = {
      username: form.username,
      email: form.email,
      name: form.name,
    };
    if (form.password) payload.password = form.password;

    try {
      let response;
      if (editing) {
        response = await updateAdmin(editing.id, payload);
      } else {
        response = await createAdmin(payload);
      }
      // Clear cache to ensure fresh data
      clearCache("admin-management");
      setShowModal(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (id === currentAdmin?.id) {
      setError("Cannot delete your own account.");
      return;
    }
    if (!confirm("Delete this admin account?")) return;
    try {
      await deleteAdmin(id);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete.");
    }
  };

  const fc = (field: string, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

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
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2
            className="fw-bold mb-2"
            style={{
              fontFamily: "Poppins, serif",
              fontSize: "2rem",
              marginBottom: "0.5rem",
            }}
          >
            👥 Admin Management
          </h2>
          <p style={{ fontSize: "0.95rem", marginBottom: "1.5rem" }}>
            Manage admin accounts and permissions
          </p>
          <Button
            onClick={openCreate}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff",
              borderRadius: "8px",
              padding: "0.6rem 1.5rem",
              fontWeight: 600,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.3)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
            }
          >
            ➕ Add New Admin
          </Button>
        </div>
      </div>

      {error && (
        <Alert
          variant="danger"
          className="mb-3"
          dismissible
          onClose={() => setError("")}
          style={{ borderRadius: "12px", border: "none" }}
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner
            animation="border"
            style={{
              color: darkMode ? "#4ade80" : "#1a5f4a",
              width: "3rem",
              height: "3rem",
            }}
          />
          <p
            className="text-muted mt-3"
            style={{ color: darkMode ? "#e0e0e0" : "#495057" }}
          >
            Loading admin accounts...
          </p>
        </div>
      ) : (
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
          <div
            className="table-responsive"
            style={{ background: darkMode ? "#1e1e2e" : "#fff" }}
          >
            <Table
              className="align-middle"
              style={{
                marginBottom: 0,
                background: darkMode ? "#1e1e2e" : "#fff",
                color: darkMode ? "#e0e0e0" : "#212529",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: `2px solid ${darkMode ? "#3a3a4e" : "#e9ecef"}`,
                  }}
                >
                  <th
                    style={{
                      padding: "1rem",
                      color: darkMode ? "#4ade80" : "#1a5f4a",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      background: darkMode ? "#2a2a3e" : "#f8f9fa",
                    }}
                  >
                    Username
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      color: darkMode ? "#4ade80" : "#1a5f4a",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      background: darkMode ? "#2a2a3e" : "#f8f9fa",
                    }}
                  >
                    Name
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      color: darkMode ? "#4ade80" : "#1a5f4a",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      background: darkMode ? "#2a2a3e" : "#f8f9fa",
                    }}
                  >
                    Email
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      color: darkMode ? "#4ade80" : "#1a5f4a",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      background: darkMode ? "#2a2a3e" : "#f8f9fa",
                    }}
                  >
                    Created
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      color: darkMode ? "#4ade80" : "#1a5f4a",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      background: darkMode ? "#2a2a3e" : "#f8f9fa",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr
                    key={a.id}
                    style={{
                      borderBottom: `1px solid ${darkMode ? "#3a3a4e" : "#e9ecef"}`,
                      transition: "background 0.2s",
                      cursor: "pointer",
                    }}
                    onClick={() => setViewItem(a)}
                  >
                    <td
                      style={{
                        padding: "1rem",
                        background: darkMode ? "#1e1e2e" : "transparent",
                      }}
                    >
                      <div className="d-flex align-items-center">
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg, #1a5f4a, #0d3d2e)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: "1.2rem",
                            marginRight: "12px",
                            fontWeight: 600,
                          }}
                        >
                          {a.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div
                            className="fw-bold"
                            style={{ color: darkMode ? "#e0e0e0" : "#212529" }}
                          >
                            {a.username}
                          </div>
                          {a.id === currentAdmin?.id && (
                            <Badge
                              style={{
                                background:
                                  "linear-gradient(135deg, #1a5f4a, #0d3d2e)",
                                border: "none",
                                fontSize: "0.7rem",
                                padding: "0.25rem 0.5rem",
                              }}
                            >
                              You
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        color: darkMode ? "#e0e0e0" : "#212529",
                        fontWeight: 600,
                        background: darkMode ? "#1e1e2e" : "transparent",
                      }}
                    >
                      {a.name}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        color: darkMode ? "#e0e0e0" : "#212529",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        background: darkMode ? "#1e1e2e" : "transparent",
                      }}
                    >
                      {a.email}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        fontSize: "0.85rem",
                        color: darkMode ? "#e0e0e0" : "#495057",
                        fontWeight: 600,
                        background: darkMode ? "#1e1e2e" : "transparent",
                      }}
                    >
                      {a.created_at
                        ? new Date(a.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        background: darkMode ? "#1e1e2e" : "transparent",
                      }}
                    >
                      <Button
                        size="sm"
                        variant="outline-primary"
                        style={{
                          borderRadius: "6px",
                          fontWeight: 500,
                          padding: "6px 12px",
                          borderColor: "#4FC3F7",
                          color: "#4FC3F7",
                          background: "transparent",
                          marginRight: "8px",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#4FC3F7";
                          e.currentTarget.style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#4FC3F7";
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(a);
                        }}
                      >
                        ✏️ Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        style={{
                          borderRadius: "6px",
                          fontWeight: 500,
                          padding: "6px 12px",
                          borderColor: "#FF7043",
                          color: "#FF7043",
                          background: "transparent",
                          transition: "all 0.2s",
                        }}
                        disabled={a.id === currentAdmin?.id}
                        onMouseEnter={(e) => {
                          if (a.id !== currentAdmin?.id) {
                            e.currentTarget.style.background = "#FF7043";
                            e.currentTarget.style.color = "#fff";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#FF7043";
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(a.id);
                        }}
                      >
                        🗑️ Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {items.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "3rem",
                  color: darkMode ? "#e0e0e0" : "#495057",
                }}
              >
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👥</div>
                <p
                  style={{
                    fontSize: "1.1rem",
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                  }}
                >
                  No admin accounts yet
                </p>
                <p style={{ fontSize: "0.9rem" }}>
                  Click "Add New Admin" to create your first admin account
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
      >
        <Modal.Header
          closeButton
          style={{
            background: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
            color: "#fff",
            border: "none",
          }}
        >
          <Modal.Title
            style={{ fontFamily: "Poppins, serif", fontSize: "1.3rem" }}
          >
            {editing ? "✏️ Edit Admin Account" : "➕ Add New Admin"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            background: darkMode ? "#1e1e2e" : "#f8f9fa",
            padding: "2rem",
          }}
        >
          {error && (
            <Alert
              variant="danger"
              className="py-2 mb-3"
              style={{ borderRadius: "8px" }}
            >
              {error}
            </Alert>
          )}

          <div
            style={{
              background: darkMode ? "#2a2a3e" : "#fff",
              borderRadius: "16px",
              padding: "1.5rem",
              boxShadow: darkMode
                ? "0 4px 16px rgba(0,0,0,0.3)"
                : "0 4px 16px rgba(0,0,0,0.08)",
            }}
          >
            <Row className="g-4">
              <Col xs={12} sm={6}>
                <Form.Label
                  className="fw-semibold"
                  style={{
                    color: darkMode ? "#e0e0e0" : "#495057",
                    marginBottom: "0.5rem",
                  }}
                >
                  👤 Username *
                </Form.Label>
                <Form.Control
                  value={form.username}
                  onChange={(e) => fc("username", e.target.value)}
                  disabled={!!editing}
                  style={{
                    borderRadius: "8px",
                    padding: "0.75rem 1rem",
                    border: editing ? "2px solid #e9ecef" : "2px solid #dee2e6",
                    background: darkMode ? "#1e1e2e" : "#fff",
                    color: darkMode ? "#e0e0e0" : "#212529",
                  }}
                  placeholder="Enter username"
                />
                {editing && (
                  <small style={{ color: "#6c757d", fontSize: "0.75rem" }}>
                    Username cannot be changed
                  </small>
                )}
              </Col>
              <Col xs={12} sm={6}>
                <Form.Label
                  className="fw-semibold"
                  style={{
                    color: darkMode ? "#e0e0e0" : "#495057",
                    marginBottom: "0.5rem",
                  }}
                >
                  📛 Full Name *
                </Form.Label>
                <Form.Control
                  value={form.name}
                  onChange={(e) => fc("name", e.target.value)}
                  style={{
                    borderRadius: "8px",
                    padding: "0.75rem 1rem",
                    border: "2px solid #dee2e6",
                    background: darkMode ? "#1e1e2e" : "#fff",
                    color: darkMode ? "#e0e0e0" : "#212529",
                  }}
                  placeholder="Enter full name"
                />
              </Col>
              <Col xs={12}>
                <Form.Label
                  className="fw-semibold"
                  style={{
                    color: darkMode ? "#e0e0e0" : "#495057",
                    marginBottom: "0.5rem",
                  }}
                >
                  📧 Email Address *
                </Form.Label>
                <Form.Control
                  type="email"
                  value={form.email}
                  onChange={(e) => fc("email", e.target.value)}
                  style={{
                    borderRadius: "8px",
                    padding: "0.75rem 1rem",
                    border: "2px solid #dee2e6",
                    background: darkMode ? "#1e1e2e" : "#fff",
                    color: darkMode ? "#e0e0e0" : "#212529",
                  }}
                  placeholder="admin@example.com"
                />
              </Col>
              <Col xs={12}>
                <Form.Label
                  className="fw-semibold"
                  style={{
                    color: darkMode ? "#e0e0e0" : "#495057",
                    marginBottom: "0.5rem",
                  }}
                >
                  🔑 {editing ? "New Password" : "Password"} *
                </Form.Label>
                <div style={{ position: "relative" }}>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => fc("password", e.target.value)}
                    style={{
                      borderRadius: "8px",
                      padding: "0.75rem 3rem 0.75rem 1rem",
                      border: "2px solid #dee2e6",
                      background: darkMode ? "#1e1e2e" : "#fff",
                      color: darkMode ? "#e0e0e0" : "#212529",
                    }}
                    placeholder={
                      editing ? "Leave blank to keep current" : "Enter password"
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1.2rem",
                      color: darkMode ? "#b0b0c0" : "#6c757d",
                      padding: "0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = darkMode
                        ? "#4ade80"
                        : "#1a5f4a")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = darkMode
                        ? "#b0b0c0"
                        : "#6c757d")
                    }
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                {editing && (
                  <small style={{ color: "#6c757d", fontSize: "0.75rem" }}>
                    Leave blank to keep current password
                  </small>
                )}
              </Col>
            </Row>
          </div>

          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              background: darkMode
                ? "rgba(74, 222, 128, 0.1)"
                : "rgba(26, 95, 74, 0.1)",
              borderRadius: "8px",
              border: `1px solid ${darkMode ? "rgba(74, 222, 128, 0.3)" : "rgba(26, 95, 74, 0.3)"}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.85rem",
                color: darkMode ? "#4ade80" : "#1a5f4a",
              }}
            >
              <span>💡</span>
              <span>
                <strong>Tip:</strong>{" "}
                {editing
                  ? "Update password only if needed. Leave blank to keep current credentials."
                  : "Choose a strong password with at least 8 characters."}
              </span>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer
          style={{
            background: darkMode ? "#1e1e2e" : "#f8f9fa",
            borderTop: `1px solid ${darkMode ? "#3a3a4e" : "#e9ecef"}`,
            padding: "1.5rem 2rem",
          }}
        >
          <Button
            variant="outline-secondary"
            onClick={() => setShowModal(false)}
            style={{
              borderRadius: "8px",
              padding: "0.6rem 1.5rem",
              fontWeight: 500,
            }}
          >
            ✕ Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving}
            style={{
              borderRadius: "8px",
              padding: "0.6rem 1.5rem",
              fontWeight: 500,
              background: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
              border: "none",
            }}
          >
            {saving ? "⏳ Saving..." : "💾 Save Admin"}
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
              👤 {viewItem.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body
            className="pt-3"
            style={{ background: darkMode ? "#1e1e2e" : "#fff" }}
          >
            <div className="text-center mb-3">
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #1a5f4a, #0d3d2e)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "2rem",
                  fontWeight: 600,
                  margin: "0 auto",
                }}
              >
                {viewItem.username.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="d-flex gap-2 flex-wrap mb-3 justify-content-center">
              {viewItem.id === currentAdmin?.id && (
                <Badge
                  style={{
                    background: "linear-gradient(135deg, #1a5f4a, #0d3d2e)",
                    border: "none",
                    fontSize: "0.85rem",
                    padding: "6px 12px",
                    borderRadius: "6px",
                  }}
                >
                  You
                </Badge>
              )}
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
                👤 Username
              </p>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: darkMode ? "#e0e0e0" : "#495057",
                }}
              >
                {viewItem.username}
              </p>
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
                📧 Email
              </p>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: darkMode ? "#e0e0e0" : "#495057",
                }}
              >
                {viewItem.email}
              </p>
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
                📅 Created Date
              </p>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: darkMode ? "#e0e0e0" : "#495057",
                }}
              >
                {viewItem.created_at
                  ? new Date(viewItem.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"}
              </p>
            </div>
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

export default AdminManagement;
