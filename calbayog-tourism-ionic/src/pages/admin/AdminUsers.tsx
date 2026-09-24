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
  InputGroup,
} from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";
import { useDarkMode } from "../../context/DarkModeContext";
import api, { createNotification } from "../../services/api";

interface User {
  id: string;
  username: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const EMPTY = {
  username: "",
  name: "",
  password: "",
  is_active: true,
};

const AdminUsers: React.FC = () => {
  const { darkMode } = useDarkMode();
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [inactiveOnly, setInactiveOnly] = useState(false);
  const [viewItem, setViewItem] = useState<User | null>(null);

  const load = () => {
    setLoading(true);
    api
      .get("/auth/admin/users")
      .then((r) => {
        console.log("Users loaded:", r.data);
        setItems(r.data);
      })
      .catch((err) => {
        console.error("Failed to load users:", err);
        setError("Failed to load users");
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

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({
      username: u.username,
      name: u.name,
      password: "",
      is_active: u.is_active,
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.username || !form.name) {
      setError("Username and name are required.");
      return;
    }
    if (!editing && !form.password) {
      setError("Password is required for new users.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const payload: any = {
        username: form.username,
        name: form.name,
        is_active: form.is_active,
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (editing) {
        await api.put(`/auth/admin/users/${editing.id}`, payload);
      } else {
        await api.post("/auth/user/signup", payload);
        try {
          await createNotification({
            userId: "all",
            type: "new_user",
            title: "New User Registered!",
            message: `${form.name} (@${form.username}) has been added as a new user.`,
            data: { userName: form.name, username: form.username },
          });
        } catch (notifErr) {
          console.error("Notification error:", notifErr);
        }
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err.response?.data?.message || err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm("Delete this user?")) return;
    await api.delete(`/auth/admin/users/${user.id}`).catch(() => {});
    load();
  };

  const fc = (field: string, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  const activeCount = items.filter((u) => u.is_active).length;

  const filteredItems = items.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActive = activeOnly ? u.is_active : true;
    const matchesInactive = inactiveOnly ? !u.is_active : true;
    return matchesSearch && matchesActive && matchesInactive;
  });

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
            alignItems: "center",
          }}
        >
          <div>
            <h2
              className="fw-bold mb-2"
              style={{
                fontFamily: "Poppins, serif",
                fontSize: "2rem",
                marginBottom: "0.5rem",
              }}
            >
              👥 Users
            </h2>
            <p style={{ fontSize: "0.95rem", opacity: 0.9, marginBottom: "0" }}>
              Manage registered users
            </p>
          </div>
          <Button
            onClick={openCreate}
            style={{
              background: "linear-gradient(135deg, #f4a226 0%, #ff9f43 100%)",
              border: "none",
              borderRadius: "8px",
              padding: "0.8rem 1.5rem",
              fontWeight: 600,
              boxShadow: "0 4px 12px rgba(244, 162, 38, 0.3)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "translateY(-2px)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "translateY(0)")
            }
          >
            + Add New User
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
              setActiveOnly(false);
              setInactiveOnly(false);
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
                Total Users
              </div>
              <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
                {items.length}
              </div>
              <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: 4 }}>
                All users
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
              setActiveOnly(true);
              setInactiveOnly(false);
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
                Active
              </div>
              <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
                {activeCount}
              </div>
              <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: 4 }}>
                Active users
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={4}>
          <Card
            className="border-0 h-100"
            style={{
              borderRadius: "16px",
              background: "linear-gradient(135deg, #f87171 0%, #ef4444 100%)",
              color: "#fff",
              boxShadow: darkMode
                ? "0 8px 24px rgba(0,0,0,0.3)"
                : "0 8px 24px rgba(248, 113, 113, 0.25)",
              cursor: "pointer",
              transition: "transform 0.3s, box-shadow 0.3s",
            }}
            onClick={() => {
              setActiveOnly(false);
              setInactiveOnly(true);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = darkMode
                ? "0 12px 32px rgba(0,0,0,0.4)"
                : "0 12px 32px rgba(248, 113, 113, 0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = darkMode
                ? "0 8px 24px rgba(0,0,0,0.3)"
                : "0 8px 24px rgba(248, 113, 113, 0.25)";
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
                Inactive
              </div>
              <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
                {items.length - activeCount}
              </div>
              <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: 4 }}>
                Deactivated users
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Users Table */}
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
        <div className="mb-4">
          <InputGroup style={{ maxWidth: "400px" }}>
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
              placeholder="Search by name or username..."
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
        </div>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" style={{ color: "#1a5f4a" }} />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-5">
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>👥</div>
            <h5
              style={{
                color: darkMode ? "#e0e0e0" : "#495057",
                marginBottom: "0.5rem",
              }}
            >
              No Users Yet
            </h5>
            <p
              style={{
                color: darkMode ? "#b0b0c0" : "#6c757d",
                marginBottom: "1.5rem",
              }}
            >
              Start by adding your first user
            </p>
            <Button
              onClick={openCreate}
              style={{
                background: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
                border: "none",
                borderRadius: "8px",
                padding: "0.6rem 1.5rem",
                fontWeight: 600,
              }}
            >
              + Add First User
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-5">
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🔍</div>
            <h5
              style={{
                color: darkMode ? "#e0e0e0" : "#495057",
                marginBottom: "0.5rem",
              }}
            >
              No Users Found
            </h5>
            <p
              style={{
                color: darkMode ? "#b0b0c0" : "#6c757d",
                marginBottom: "1.5rem",
              }}
            >
              Try a different search term
            </p>
            <Button
              onClick={() => setSearchTerm("")}
              style={{
                background: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
                border: "none",
                borderRadius: "8px",
                padding: "0.6rem 1.5rem",
                fontWeight: 600,
              }}
            >
              Clear Search
            </Button>
          </div>
        ) : (
          <Table
            hover
            className="align-middle"
            style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
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
                  User
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
                  Joined
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
              {filteredItems.map((u, index) => (
                <tr
                  key={u.id}
                  style={{
                    background: darkMode ? "#1e1e2e" : "#fff",
                    boxShadow: darkMode
                      ? "0 2px 8px rgba(0,0,0,0.2)"
                      : "0 2px 8px rgba(0,0,0,0.06)",
                    transition: "transform 0.2s",
                    cursor: "pointer",
                  }}
                  onClick={() => setViewItem(u)}
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
                    <div>
                      <div
                        className="fw-semibold"
                        style={{
                          color: darkMode ? "#e0e0e0" : "#212529",
                          fontSize: "0.95rem",
                        }}
                      >
                        {u.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: darkMode ? "#b0b0c0" : "#6c757d",
                          marginTop: "0.25rem",
                        }}
                      >
                        @{u.username}
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
                    <Badge
                      bg={u.is_active ? "success" : "secondary"}
                      style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}
                    >
                      {u.is_active ? "🟢 Active" : "🔴 Inactive"}
                    </Badge>
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
                    {new Date(u.created_at).toLocaleDateString()}
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
                          openEdit(u);
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
                          handleDelete(u);
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
        )}
      </div>

      {/* Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
        style={{ backdropFilter: "blur(4px)" }}
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
            {editing ? "✏️ Edit User" : "👤 Add New User"}
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
            <Col xs={12} sm={6}>
              <Form.Label
                className="fw-semibold"
                style={{ color: darkMode ? "#e0e0e0" : "#495057" }}
              >
                Username *
              </Form.Label>
              <Form.Control
                value={form.username}
                onChange={(e) => fc("username", e.target.value)}
                disabled={!!editing}
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
            <Col xs={12} sm={6}>
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
            <Col xs={12} sm={6}>
              <Form.Label
                className="fw-semibold"
                style={{ color: darkMode ? "#e0e0e0" : "#495057" }}
              >
                Password {editing ? "(leave blank to keep)" : "*"}
              </Form.Label>
              <Form.Control
                type="password"
                value={form.password}
                onChange={(e) => fc("password", e.target.value)}
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
            <Col xs={12} sm={6} className="d-flex align-items-end">
              <Form.Check
                type="checkbox"
                label="🟢 Active"
                checked={form.is_active}
                onChange={(e) => fc("is_active", e.target.checked)}
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
            {saving ? "Saving..." : "💾 Save User"}
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
            <div className="d-flex gap-2 flex-wrap mb-3">
              <Badge
                bg={viewItem.is_active ? "success" : "secondary"}
                style={{
                  fontSize: "0.85rem",
                  padding: "6px 12px",
                  borderRadius: "6px",
                }}
              >
                {viewItem.is_active ? "🟢 Active" : "🔴 Inactive"}
              </Badge>
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
                @{viewItem.username}
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
                📅 Joined Date
              </p>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: darkMode ? "#e0e0e0" : "#495057",
                }}
              >
                {new Date(viewItem.created_at).toLocaleDateString()}
              </p>
            </div>
            {viewItem.updated_at && (
              <div className="mb-3">
                <p
                  className="mb-1"
                  style={{
                    fontSize: "0.85rem",
                    color: darkMode ? "#b0b0c0" : "#6c757d",
                    fontWeight: 600,
                  }}
                >
                  🔄 Last Updated
                </p>
                <p
                  style={{
                    fontSize: "0.95rem",
                    color: darkMode ? "#e0e0e0" : "#495057",
                  }}
                >
                  {new Date(viewItem.updated_at).toLocaleDateString()}
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

export default AdminUsers;
