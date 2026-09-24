import React, { useEffect, useState } from "react";
import { useParams, useHistory, Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import { getAccommodations } from "../services/api";
import { Accommodation } from "../types";

const amenityIcons: Record<string, string> = {
  WiFi: "📶",
  Pool: "🏊",
  Restaurant: "🍽️",
  Parking: "🅿️",
  AC: "❄️",
  TV: "📺",
  Gym: "💪",
  Bar: "🍹",
  Spa: "💆",
  "Conference Room": "🏢",
  "Beach Access": "🏖️",
  "Room Service": "🛎️",
};

const AccommodationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [accommodation, setAccommodation] = useState<Accommodation | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchAccommodation();
  }, [id]);

  const fetchAccommodation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAccommodations();
      const data = Array.isArray(res.data) ? res.data : [];
      const found = data.find((a: Accommodation) => a.id === id);
      if (found) {
        setAccommodation(found);
        setSelectedImage(found.images?.[0] || null);
      } else {
        setError("Accommodation not found");
      }
    } catch (err) {
      setError("Failed to load accommodation details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-enter">
        <div className="text-center py-5">
          <Spinner
            animation="border"
            style={{ color: "var(--tropical-green)" }}
          />
          <p className="text-muted mt-3">Loading accommodation details...</p>
        </div>
      </div>
    );
  }

  if (error || !accommodation) {
    return (
      <div className="page-enter">
        <Container className="py-5">
          <Alert variant="danger">{error || "Accommodation not found"}</Alert>
          <Button onClick={() => history.push("/accommodations")}>
            ← Back to Accommodations
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <Container className="py-4">
        {/* Back Button */}
        <Button
          variant="outline-primary"
          className="mb-3"
          onClick={() => history.push("/accommodations")}
          style={{ borderRadius: "8px" }}
        >
          ← Back to Accommodations
        </Button>

        <Row>
          <Col lg={8}>
            {/* Image Gallery */}
            <Card
              className="mb-4 border-0"
              style={{
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              }}
            >
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={accommodation.name}
                  style={{ width: "100%", height: 400, objectFit: "cover" }}
                />
              ) : (
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    height: 400,
                    background: "var(--tropical-green-light)",
                    fontSize: "5rem",
                  }}
                >
                  🏨
                </div>
              )}
              {/* Thumbnails */}
              {accommodation.images && accommodation.images.length > 1 && (
                <div
                  className="p-3"
                  style={{ display: "flex", gap: "0.5rem", overflowX: "auto" }}
                >
                  {accommodation.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      onClick={() => setSelectedImage(img)}
                      style={{
                        width: 60,
                        height: 60,
                        objectFit: "cover",
                        borderRadius: "8px",
                        cursor: "pointer",
                        border:
                          selectedImage === img
                            ? "3px solid var(--tropical-green)"
                            : "2px solid #dee2e6",
                        opacity: selectedImage === img ? 1 : 0.7,
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.opacity = "1")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.opacity =
                          selectedImage === img ? 1 : 0.7)
                      }
                    />
                  ))}
                </div>
              )}
            </Card>

            {/* Description */}
            <Card
              className="mb-4 border-0"
              style={{
                borderRadius: "16px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              }}
            >
              <Card.Body className="p-4">
                <h3
                  className="fw-bold mb-3"
                  style={{ fontFamily: "Poppins, serif" }}
                >
                  About
                </h3>
                <p style={{ lineHeight: 1.8, color: "#495057" }}>
                  {accommodation.description}
                </p>
              </Card.Body>
            </Card>

            {/* Amenities */}
            {accommodation.amenities && accommodation.amenities.length > 0 && (
              <Card
                className="mb-4 border-0"
                style={{
                  borderRadius: "16px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                }}
              >
                <Card.Body className="p-4">
                  <h3
                    className="fw-bold mb-3"
                    style={{ fontFamily: "Poppins, serif" }}
                  >
                    Amenities
                  </h3>
                  <div className="d-flex flex-wrap gap-3">
                    {accommodation.amenities.map((a) => (
                      <div
                        key={a}
                        className="d-flex align-items-center gap-2 px-3 py-2"
                        style={{
                          background: "#f8f9fa",
                          borderRadius: "8px",
                          fontSize: "0.9rem",
                        }}
                      >
                        <span style={{ fontSize: "1.3rem" }}>
                          {amenityIcons[a] || "✔️"}
                        </span>
                        <span>{a}</span>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            )}
          </Col>

          <Col lg={4}>
            {/* Info Card */}
            <Card
              className="mb-4 border-0"
              style={{
                borderRadius: "16px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              }}
            >
              <Card.Body className="p-4">
                <div className="d-flex gap-2 flex-wrap mb-3">
                  <Badge
                    style={{
                      background: "var(--ocean-blue)",
                      fontSize: "0.85rem",
                      padding: "6px 12px",
                    }}
                  >
                    {accommodation.type}
                  </Badge>
                  {accommodation.dotAccredited && (
                    <Badge
                      style={{
                        background: "var(--festival-amber)",
                        fontSize: "0.85rem",
                        padding: "6px 12px",
                      }}
                    >
                      ✅ DOT Accredited
                    </Badge>
                  )}
                  {accommodation.starRating && (
                    <Badge
                      bg="light"
                      className="text-warning border"
                      style={{ fontSize: "0.85rem", padding: "6px 12px" }}
                    >
                      {"⭐".repeat(accommodation.starRating)}
                    </Badge>
                  )}
                </div>

                <h2
                  className="fw-bold mb-3"
                  style={{ fontFamily: "Poppins, serif", fontSize: "1.5rem" }}
                >
                  {accommodation.name}
                </h2>

                <div className="mb-3">
                  <p
                    className="text-muted mb-1"
                    style={{ fontSize: "0.85rem" }}
                  >
                    📍 Location
                  </p>
                  <p style={{ fontSize: "0.95rem", color: "#495057" }}>
                    {accommodation.location?.address ||
                      accommodation.locationAddress ||
                      "Calbayog City"}
                  </p>
                </div>

                {accommodation.priceRange?.min && (
                  <div
                    className="mb-3 p-3"
                    style={{
                      background: "linear-gradient(135deg, #11998e, #38ef7d)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  >
                    <p
                      className="mb-1"
                      style={{ fontSize: "0.85rem", opacity: 0.9 }}
                    >
                      Price Range
                    </p>
                    <p className="fw-bold mb-0" style={{ fontSize: "1.5rem" }}>
                      ₱{accommodation.priceRange.min.toLocaleString()}
                      {accommodation.priceRange.max
                        ? ` – ₱${accommodation.priceRange.max.toLocaleString()}`
                        : "+"}
                      <span
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 400,
                          opacity: 0.9,
                        }}
                      >
                        {" "}
                        /night
                      </span>
                    </p>
                  </div>
                )}

                {accommodation.checkIn && (
                  <div className="mb-3">
                    <p
                      className="text-muted mb-1"
                      style={{ fontSize: "0.85rem" }}
                    >
                      🕐 Check-in
                    </p>
                    <p style={{ fontSize: "0.95rem", color: "#495057" }}>
                      {accommodation.checkIn}
                    </p>
                  </div>
                )}

                {accommodation.checkOut && (
                  <div className="mb-3">
                    <p
                      className="text-muted mb-1"
                      style={{ fontSize: "0.85rem" }}
                    >
                      🕐 Check-out
                    </p>
                    <p style={{ fontSize: "0.95rem", color: "#495057" }}>
                      {accommodation.checkOut}
                    </p>
                  </div>
                )}

                {/* Contact Actions */}
                <div className="d-flex flex-column gap-2 mt-4">
                  {accommodation.contact?.phone && (
                    <a
                      href={`tel:${accommodation.contact.phone}`}
                      className="btn btn-primary"
                      style={{ borderRadius: "8px", padding: "12px" }}
                    >
                      📞 Call {accommodation.contact.phone}
                    </a>
                  )}
                  {accommodation.contact?.email && (
                    <a
                      href={`mailto:${accommodation.contact.email}`}
                      className="btn btn-outline-primary"
                      style={{ borderRadius: "8px", padding: "12px" }}
                    >
                      ✉️ Email
                    </a>
                  )}
                  {accommodation.contact?.messenger && (
                    <a
                      href={accommodation.contact.messenger}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline-primary"
                      style={{ borderRadius: "8px", padding: "12px" }}
                    >
                      💬 Messenger
                    </a>
                  )}
                  {accommodation.contact?.facebook && (
                    <a
                      href={accommodation.contact.facebook}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline-primary"
                      style={{ borderRadius: "8px", padding: "12px" }}
                    >
                      📘 Facebook
                    </a>
                  )}
                  {accommodation.contact?.website && (
                    <a
                      href={accommodation.contact.website}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline-primary"
                      style={{ borderRadius: "8px", padding: "12px" }}
                    >
                      🌐 Website
                    </a>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AccommodationDetail;
