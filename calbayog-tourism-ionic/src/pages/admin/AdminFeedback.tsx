import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Badge,
  Spinner,
  Alert,
  Row,
  Col,
  Card,
} from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  getFeedback,
  updateFeedback,
  deleteFeedback,
  clearCache,
} from "../../services/api";
import { Feedback } from "../../types";
import { useDarkMode } from "../../context/DarkModeContext";

const AdminFeedback: React.FC = () => {
  const { darkMode } = useDarkMode();
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null,
  );
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    clearCache("feedback");
    getFeedback()
      .then((r) => {
        console.log("Feedback loaded:", r.data);
        setItems(r.data);
      })
      .catch((err) => {
        console.error("Error loading feedback:", err);
        setError("Failed to load feedback. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openView = (f: Feedback) => {
    setSelectedFeedback(f);
    setShowModal(true);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await updateFeedback(id, { is_read: true });
      clearCache("feedback");
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update feedback.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this feedback?")) return;
    try {
      await deleteFeedback(id);
      clearCache("feedback");
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete feedback.");
    }
  };

  const renderStars = (rating?: number) => {
    if (!rating) return "—";
    return "⭐".repeat(rating) + "☆".repeat(5 - rating);
  };

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
            💬 User Feedback
          </h2>
          <p style={{ fontSize: "0.95rem", opacity: 0.9, marginBottom: "0" }}>
            View and manage user feedback and reviews
          </p>
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
            style={{ color: darkMode ? "#b0b0c0" : "#6c757d" }}
          >
            Loading feedback...
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
                    Rating
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
                    Date
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
                    Status
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
                {items.map((f) => (
                  <tr
                    key={f.id}
                    style={{
                      borderBottom: `1px solid ${darkMode ? "#3a3a4e" : "#e9ecef"}`,
                      transition: "background 0.2s",
                      background: !f.is_read
                        ? darkMode
                          ? "rgba(74, 222, 128, 0.05)"
                          : "rgba(26, 95, 74, 0.03)"
                        : "transparent",
                    }}
                  >
                    <td
                      style={{
                        padding: "1rem",
                        background: darkMode ? "#1e1e2e" : "transparent",
                      }}
                    >
                      <div
                        className="fw-semibold"
                        style={{ color: darkMode ? "#e0e0e0" : "#212529" }}
                      >
                        {f.name}
                        {!f.is_read && (
                          <Badge
                            bg="success"
                            className="ms-2"
                            style={{ fontSize: "0.7rem" }}
                          >
                            New
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        color: darkMode ? "#b0b0c0" : "#6c757d",
                        fontSize: "0.9rem",
                        background: darkMode ? "#1e1e2e" : "transparent",
                      }}
                    >
                      {f.email}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        fontSize: "1.2rem",
                        background: darkMode ? "#1e1e2e" : "transparent",
                      }}
                    >
                      {renderStars(f.rating)}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        fontSize: "0.85rem",
                        color: darkMode ? "#b0b0c0" : "#6c757d",
                        background: darkMode ? "#1e1e2e" : "transparent",
                      }}
                    >
                      {f.created_at
                        ? new Date(f.created_at).toLocaleDateString("en-US", {
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
                      <Badge bg={f.is_read ? "secondary" : "success"}>
                        {f.is_read ? "Read" : "Unread"}
                      </Badge>
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        background: darkMode ? "#1e1e2e" : "transparent",
                      }}
                    >
                      <Button
                        size="sm"
                        style={{
                          borderRadius: "6px",
                          padding: "0.4rem 0.8rem",
                          border: "1px solid #1a5f4a",
                          color: "#1a5f4a",
                          background: "transparent",
                          marginRight: "8px",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#1a5f4a";
                          e.currentTarget.style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#1a5f4a";
                        }}
                        onClick={() => openView(f)}
                      >
                        👁️ View
                      </Button>
                      {!f.is_read && (
                        <Button
                          size="sm"
                          style={{
                            borderRadius: "6px",
                            padding: "0.4rem 0.8rem",
                            border: "1px solid #4ade80",
                            color: "#4ade80",
                            background: "transparent",
                            marginRight: "8px",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#4ade80";
                            e.currentTarget.style.color = "#fff";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "#4ade80";
                          }}
                          onClick={() => handleMarkAsRead(f.id)}
                        >
                          ✓ Mark Read
                        </Button>
                      )}
                      <Button
                        size="sm"
                        style={{
                          borderRadius: "6px",
                          padding: "0.4rem 0.8rem",
                          border: "1px solid #e74c3c",
                          color: "#e74c3c",
                          background: "transparent",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#e74c3c";
                          e.currentTarget.style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#e74c3c";
                        }}
                        onClick={() => handleDelete(f.id)}
                      >
                        🗑️
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
                  color: darkMode ? "#b0b0c0" : "#6c757d",
                }}
              >
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💬</div>
                <p style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                  No feedback yet
                </p>
                <p style={{ fontSize: "0.9rem" }}>
                  User feedback will appear here when submitted
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
            💬 Feedback Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            background: darkMode ? "#1e1e2e" : "#f8f9fa",
            padding: "2rem",
          }}
        >
          {selectedFeedback && (
            <div>
              <Row className="mb-3">
                <Col xs={12} sm={6}>
                  <strong style={{ color: darkMode ? "#4ade80" : "#1a5f4a" }}>
                    Name:
                  </strong>
                  <div style={{ color: darkMode ? "#e0e0e0" : "#212529" }}>
                    {selectedFeedback.name}
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <strong style={{ color: darkMode ? "#4ade80" : "#1a5f4a" }}>
                    Email:
                  </strong>
                  <div style={{ color: darkMode ? "#b0b0c0" : "#6c757d" }}>
                    {selectedFeedback.email}
                  </div>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col xs={12} sm={6}>
                  <strong style={{ color: darkMode ? "#4ade80" : "#1a5f4a" }}>
                    Rating:
                  </strong>
                  <div style={{ fontSize: "1.5rem" }}>
                    {renderStars(selectedFeedback.rating)}
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <strong style={{ color: darkMode ? "#4ade80" : "#1a5f4a" }}>
                    Date:
                  </strong>
                  <div style={{ color: darkMode ? "#b0b0c0" : "#6c757d" }}>
                    {selectedFeedback.created_at
                      ? new Date(selectedFeedback.created_at).toLocaleString()
                      : "—"}
                  </div>
                </Col>
              </Row>
              <div className="mb-3">
                <strong style={{ color: darkMode ? "#4ade80" : "#1a5f4a" }}>
                  Message:
                </strong>
                <Card
                  style={{
                    marginTop: "0.5rem",
                    background: darkMode ? "#2a2a3e" : "#fff",
                    border: `1px solid ${darkMode ? "#3a3a4e" : "#e9ecef"}`,
                    borderRadius: "8px",
                    padding: "1rem",
                  }}
                >
                  <p
                    style={{
                      marginBottom: 0,
                      color: darkMode ? "#e0e0e0" : "#212529",
                      lineHeight: "1.6",
                    }}
                  >
                    {selectedFeedback.message}
                  </p>
                </Card>
              </div>
            </div>
          )}
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
            ✕ Close
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
};

export default AdminFeedback;
