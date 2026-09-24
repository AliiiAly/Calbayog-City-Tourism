import React, { useState, useEffect } from "react";
import {
  Table,
  Badge,
  Spinner,
  Button,
  Modal,
  Form,
  Alert,
  Row,
  Col,
  InputGroup,
} from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  getItineraryRequests,
  updateItineraryRequest,
  clearCache,
} from "../../services/api";
import { ItineraryRequest } from "../../types";
import { useDarkMode } from "../../context/DarkModeContext";

const STATUS_COLORS: Record<string, string> = {
  pending: "warning",
  "in-progress": "info",
  completed: "success",
  cancelled: "danger",
};

const STATUS_LABELS: Record<string, string> = {
  all: "All",
  pending: "Pending",
  "in-progress": "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const ALL_STATUSES = [
  "all",
  "pending",
  "in-progress",
  "completed",
  "cancelled",
];

const AdminRequests: React.FC = () => {
  const { darkMode } = useDarkMode();
  const [items, setItems] = useState<ItineraryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<ItineraryRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    clearCache("itinerary-requests");
    const params: any = {};
    if (statusFilter !== "all") params.status = statusFilter;
    getItineraryRequests(params)
      .then((r) => setItems(r.data))
      .catch((err) => {
        console.error("Error loading itinerary requests:", err);
        setError("Failed to load itinerary requests. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    setSaving(true);
    setError("");
    try {
      await updateItineraryRequest(id, { status });
      clearCache("itinerary-requests");
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update status.");
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    if (!selected?._id) return;
    setSaving(true);
    setError("");
    try {
      await updateItineraryRequest(selected._id, { adminNotes: notes });
      clearCache("itinerary-requests");
      setSelected(null);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save notes.");
    } finally {
      setSaving(false);
    }
  };

  const openRequest = (req: ItineraryRequest) => {
    setSelected(req);
    setNotes(req.adminNotes || "");
  };

  const formatDate = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString("en-PH", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—";

  const formatDateTime = (d?: string) =>
    d
      ? new Date(d).toLocaleString("en-PH", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const createdAt = (req: ItineraryRequest) =>
    (req as any).created_at || req.createdAt;

  const filteredItems = items.filter((req) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      req.fullName.toLowerCase().includes(term) ||
      req.email.toLowerCase().includes(term) ||
      (req.phone || "").toLowerCase().includes(term)
    );
  });

  const countByStatus = (status: string) =>
    status === "all"
      ? items.length
      : items.filter((i) => (i.status || "pending") === status).length;

  return (
    <AdminLayout>
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
            style={{ fontFamily: "Poppins, serif", fontSize: "2rem" }}
          >
            📅 Itinerary Requests
          </h2>
          <p style={{ fontSize: "0.95rem", opacity: 0.9, marginBottom: 0 }}>
            Review, manage, and respond to traveler itinerary requests
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
            Loading itinerary requests...
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
          <Row className="g-3 mb-4 align-items-center">
            <Col xs={12} md={7}>
              <div className="d-flex flex-wrap gap-2">
                {ALL_STATUSES.map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    style={{
                      borderRadius: "20px",
                      padding: "0.4rem 0.9rem",
                      fontWeight: 700,
                      border: "1px solid",
                      borderColor:
                        statusFilter === status
                          ? "transparent"
                          : darkMode
                            ? "#4ade80"
                            : "#1a5f4a",
                      background:
                        statusFilter === status
                          ? darkMode
                            ? "#4ade80"
                            : "#1a5f4a"
                          : "transparent",
                      color:
                        statusFilter === status
                          ? "#fff"
                          : darkMode
                            ? "#b0b0c0"
                            : "#495057",
                    }}
                  >
                    {STATUS_LABELS[status]} ({countByStatus(status)})
                  </Button>
                ))}
              </div>
            </Col>
            <Col xs={12} md={5}>
              <InputGroup>
                <InputGroup.Text>🔍</InputGroup.Text>
                <Form.Control
                  type="search"
                  placeholder="Search by name, email, or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    borderRadius: "0 8px 8px 0",
                    background: darkMode ? "#1e1e2e" : "#fff",
                    color: darkMode ? "#e0e0e0" : "#212529",
                  }}
                />
              </InputGroup>
            </Col>
          </Row>

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
                    Dates
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
                    Group
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
                {filteredItems.map((req) => (
                  <tr
                    key={req._id}
                    style={{
                      borderBottom: `1px solid ${darkMode ? "#3a3a4e" : "#e9ecef"}`,
                      background:
                        (req.status || "pending") === "pending"
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
                        className="fw-bold"
                        style={{ color: darkMode ? "#e0e0e0" : "#212529" }}
                      >
                        {req.fullName}
                        {(req.status || "pending") === "pending" && (
                          <Badge
                            bg="success"
                            className="ms-2"
                            style={{ fontSize: "0.7rem" }}
                          >
                            New
                          </Badge>
                        )}
                      </div>
                      <div
                        className="fw-semibold"
                        style={{
                          fontSize: "0.75rem",
                          color: darkMode ? "#b0b0c0" : "#6c757d",
                        }}
                      >
                        {formatDateTime(createdAt(req))}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        fontSize: "0.9rem",
                        background: darkMode ? "#1e1e2e" : "transparent",
                      }}
                    >
                      <a href={`mailto:${req.email}`} className="fw-semibold">
                        {req.email}
                      </a>
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        fontSize: "0.82rem",
                        color: darkMode ? "#e0e0e0" : "#495057",
                        fontWeight: 600,
                        background: darkMode ? "#1e1e2e" : "transparent",
                      }}
                    >
                      {formatDate(req.travelDateStart)} →{" "}
                      {formatDate(req.travelDateEnd)}
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
                      {req.groupSize}{" "}
                      <span
                        style={{
                          color: darkMode ? "#b0b0c0" : "#6c757d",
                          fontWeight: 400,
                        }}
                      >
                        ({req.groupType})
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        background: darkMode ? "#1e1e2e" : "transparent",
                      }}
                    >
                      <Badge
                        bg={
                          STATUS_COLORS[req.status || "pending"] || "secondary"
                        }
                      >
                        {STATUS_LABELS[req.status || "pending"]}
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
                        onClick={() => openRequest(req)}
                      >
                        👁️ View
                      </Button>
                      {(req.status || "pending") === "pending" && (
                        <Button
                          size="sm"
                          style={{
                            borderRadius: "6px",
                            padding: "0.4rem 0.8rem",
                            border: "1px solid #4ade80",
                            color: "#4ade80",
                            background: "transparent",
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
                          onClick={() =>
                            req._id && updateStatus(req._id, "in-progress")
                          }
                          disabled={saving}
                        >
                          ▶ Start
                        </Button>
                      )}
                      {(req.status || "pending") === "in-progress" && (
                        <Button
                          size="sm"
                          style={{
                            borderRadius: "6px",
                            padding: "0.4rem 0.8rem",
                            border: "1px solid #198754",
                            color: "#198754",
                            background: "transparent",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#198754";
                            e.currentTarget.style.color = "#fff";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "#198754";
                          }}
                          onClick={() =>
                            req._id && updateStatus(req._id, "completed")
                          }
                          disabled={saving}
                        >
                          ✅ Done
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {filteredItems.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "3rem",
                  color: darkMode ? "#b0b0c0" : "#6c757d",
                }}
              >
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📅</div>
                <p style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                  {search.trim() ? "No matching requests" : "No requests yet"}
                </p>
                <p style={{ fontSize: "0.9rem" }}>
                  {search.trim()
                    ? "Try adjusting your search or status filter"
                    : "Itinerary requests will appear here when submitted"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal
        show={!!selected}
        onHide={() => setSelected(null)}
        size="lg"
        centered
      >
        {selected && (
          <>
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
                📅 Request — {selected.fullName}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body
              style={{
                background: darkMode ? "#1e1e2e" : "#f8f9fa",
                padding: "2rem",
              }}
            >
              <Row className="g-3 mb-3">
                <Col xs={12} sm={6}>
                  <strong style={{ color: darkMode ? "#4ade80" : "#1a5f4a" }}>
                    Email:
                  </strong>
                  <div className="fw-semibold">
                    <a href={`mailto:${selected.email}`}>{selected.email}</a>
                  </div>
                </Col>
                {selected.phone && (
                  <Col xs={12} sm={6}>
                    <strong style={{ color: darkMode ? "#4ade80" : "#1a5f4a" }}>
                      Phone:
                    </strong>
                    <div className="fw-semibold">
                      <a href={`tel:${selected.phone}`}>{selected.phone}</a>
                    </div>
                  </Col>
                )}
              </Row>
              <Row className="g-3 mb-3">
                <Col xs={12} sm={6}>
                  <strong style={{ color: darkMode ? "#4ade80" : "#1a5f4a" }}>
                    Travel Dates:
                  </strong>
                  <div
                    className="fw-semibold"
                    style={{ color: darkMode ? "#e0e0e0" : "#212529" }}
                  >
                    {formatDate(selected.travelDateStart)} –{" "}
                    {formatDate(selected.travelDateEnd)}
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <strong style={{ color: darkMode ? "#4ade80" : "#1a5f4a" }}>
                    Group:
                  </strong>
                  <div
                    className="fw-semibold"
                    style={{ color: darkMode ? "#e0e0e0" : "#212529" }}
                  >
                    {selected.groupSize} person(s) · {selected.groupType}
                  </div>
                </Col>
              </Row>
              {selected.budget && (
                <div className="mb-3">
                  <strong style={{ color: darkMode ? "#4ade80" : "#1a5f4a" }}>
                    Budget:
                  </strong>
                  <div
                    className="fw-semibold"
                    style={{ color: darkMode ? "#e0e0e0" : "#212529" }}
                  >
                    {selected.budget}
                  </div>
                </div>
              )}
              {selected.preferredSpots &&
                selected.preferredSpots.length > 0 && (
                  <div className="mb-3">
                    <strong style={{ color: darkMode ? "#4ade80" : "#1a5f4a" }}>
                      Preferred Spots:
                    </strong>
                    <div className="d-flex flex-wrap gap-1 mt-1">
                      {selected.preferredSpots.map((s) => (
                        <Badge
                          key={s}
                          style={{
                            background: "var(--tropical-green)",
                            fontSize: "0.75rem",
                          }}
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              <Row className="g-3 mb-3">
                <Col xs={12} sm={6}>
                  <strong style={{ color: darkMode ? "#4ade80" : "#1a5f4a" }}>
                    Accommodation:
                  </strong>
                  <div
                    className="fw-semibold"
                    style={{ color: darkMode ? "#e0e0e0" : "#212529" }}
                  >
                    {selected.accommodationNeeded ? "Yes" : "No"}
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <strong style={{ color: darkMode ? "#4ade80" : "#1a5f4a" }}>
                    Tour Guide:
                  </strong>
                  <div
                    className="fw-semibold"
                    style={{ color: darkMode ? "#e0e0e0" : "#212529" }}
                  >
                    {selected.guideNeeded ? "Yes" : "No"}
                  </div>
                </Col>
              </Row>
              {selected.specialRequests && (
                <div className="mb-3">
                  <strong style={{ color: darkMode ? "#4ade80" : "#1a5f4a" }}>
                    Special Requests:
                  </strong>
                  <div
                    className="fw-semibold"
                    style={{
                      color: darkMode ? "#e0e0e0" : "#212529",
                      lineHeight: 1.6,
                    }}
                  >
                    {selected.specialRequests}
                  </div>
                </div>
              )}
              <div className="mb-3">
                <strong style={{ color: darkMode ? "#4ade80" : "#1a5f4a" }}>
                  Submitted:
                </strong>
                <div
                  className="fw-semibold"
                  style={{ color: darkMode ? "#b0b0c0" : "#6c757d" }}
                >
                  {formatDateTime(createdAt(selected))}
                </div>
              </div>

              <hr style={{ borderColor: darkMode ? "#3a3a4e" : "#e9ecef" }} />

              <h6
                className="fw-bold mb-3"
                style={{ color: darkMode ? "#4ade80" : "#1a5f4a" }}
              >
                ⚙️ Manage Request
              </h6>
              <Row className="g-3">
                <Col xs={12} sm={6}>
                  <Form.Label
                    className="fw-semibold"
                    style={{ color: darkMode ? "#e0e0e0" : "#495057" }}
                  >
                    Status
                  </Form.Label>
                  <Form.Select
                    value={selected.status || "pending"}
                    onChange={(e) =>
                      selected._id && updateStatus(selected._id, e.target.value)
                    }
                    disabled={saving}
                    style={{
                      background: darkMode ? "#1e1e2e" : "#fff",
                      color: darkMode ? "#e0e0e0" : "#212529",
                    }}
                  >
                    {ALL_STATUSES.filter((s) => s !== "all").map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>

              <Form.Group className="mt-3">
                <Form.Label
                  className="fw-semibold"
                  style={{ color: darkMode ? "#e0e0e0" : "#495057" }}
                >
                  Admin Notes
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Internal notes about this request..."
                  disabled={saving}
                  style={{
                    background: darkMode ? "#1e1e2e" : "#fff",
                    color: darkMode ? "#e0e0e0" : "#212529",
                  }}
                />
              </Form.Group>
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
                onClick={() => setSelected(null)}
                style={{
                  borderRadius: "8px",
                  padding: "0.6rem 1.5rem",
                  fontWeight: 500,
                }}
              >
                ✕ Close
              </Button>
              <a
                href={`mailto:${selected.email}?subject=Re: Your Calbayog Itinerary Request`}
                className="btn btn-primary"
                style={{
                  borderRadius: "8px",
                  padding: "0.6rem 1.5rem",
                  fontWeight: 500,
                }}
              >
                ✉️ Reply by Email
              </a>
              <Button
                variant="primary"
                onClick={saveNotes}
                disabled={saving}
                style={{
                  borderRadius: "8px",
                  padding: "0.6rem 1.5rem",
                  fontWeight: 500,
                  background:
                    "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
                  border: "none",
                }}
              >
                {saving ? "⏳ Saving..." : "💾 Save Notes"}
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </AdminLayout>
  );
};

export default AdminRequests;
