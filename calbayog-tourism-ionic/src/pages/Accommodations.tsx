import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Spinner,
  Form,
} from "react-bootstrap";
import { useHistory } from "react-router-dom";
import { getAccommodations, clearCache } from "../services/api";
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

const TYPES = [
  "All",
  "Hotel",
  "Resort",
  "Inn",
  "Pension House",
  "Homestay",
  "Other",
];

const Accommodations: React.FC = () => {
  const history = useHistory();
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState("All");
  const [dotOnly, setDotOnly] = useState(false);

  useEffect(() => {
    fetchAccommodations();
  }, [activeType, dotOnly]);

  const fetchAccommodations = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (activeType !== "All") params.type = activeType;
      if (dotOnly) params.dotAccredited = "true";

      // Clear cache to ensure fresh data
      clearCache("accommodations");

      const res = await getAccommodations(params);
      console.log("Accommodations API response:", res);
      setAccommodations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Accommodations API error:", err);
      setAccommodations([]);
    } finally {
      setLoading(false);
    }
  };

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
            🏨 Accommodations
          </h1>
          <p style={{ opacity: 0.85, fontSize: "0.9rem", margin: 0 }}>
            Hotels, resorts & more in Calbayog
          </p>
        </div>
      </div>

      <Container className="py-3" style={{ maxWidth: "1400px" }}>
        {/* Filters */}
        <div className="mb-3">
          {/* Category Pills - Horizontal Scroll on Mobile */}
          <div
            className="d-flex gap-2 mb-3 pb-2"
            style={{
              overflowX: "auto",
              overflowY: "hidden",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {TYPES.map((t) => (
              <button
                key={t}
                className={`px-3 py-2 rounded-pill border-0 ${activeType === t ? "text-white" : "text-dark"}`}
                style={{
                  background:
                    activeType === t ? "var(--tropical-green)" : "#f8f9fa",
                  fontSize: "0.85rem",
                  fontWeight: activeType === t ? 600 : 400,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "all 0.2s ease",
                }}
                onClick={() => setActiveType(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {/* DOT Accredited Toggle */}
          <div className="d-flex align-items-center justify-content-between">
            <Form.Check
              type="switch"
              id="dot-switch"
              label="DOT Accredited only"
              checked={dotOnly}
              onChange={(e) => setDotOnly(e.target.checked)}
              style={{ fontSize: "0.9rem", fontWeight: 500 }}
            />
            <span className="text-muted" style={{ fontSize: "0.8rem" }}>
              {accommodations.length}{" "}
              {accommodations.length === 1 ? "result" : "results"}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner
              animation="border"
              style={{ color: "var(--tropical-green)" }}
            />
            <p className="text-muted mt-3">Loading accommodations...</p>
          </div>
        ) : accommodations.length === 0 ? (
          <div className="text-center py-5">
            <div style={{ fontSize: "3rem" }}>🏨</div>
            <p className="text-muted mt-2">No accommodations found.</p>
          </div>
        ) : (
          <Row className="g-3 g-md-4">
            {accommodations.map((acc) => (
              <Col xs={12} sm={6} lg={4} xl={3} key={acc.id}>
                <Card
                  className="tourism-card h-100 border-0"
                  style={{
                    cursor: "pointer",
                    borderRadius: "16px",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onClick={() => history.push(`/accommodations/${acc.id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 24px rgba(0,0,0,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 12px rgba(0,0,0,0.08)";
                  }}
                >
                  {acc.images?.[0] ? (
                    <img
                      src={acc.images[0]}
                      alt={acc.name}
                      className="card-img-top"
                      style={{
                        height:
                          { xs: 160, sm: 180, md: 200 }[
                            window.innerWidth < 576
                              ? "xs"
                              : window.innerWidth < 992
                                ? "sm"
                                : "md"
                          ] || 180,
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
                          "linear-gradient(135deg, var(--tropical-green-light), var(--tropical-green))",
                        borderTopLeftRadius: "16px",
                        borderTopRightRadius: "16px",
                        fontSize: "3rem",
                      }}
                    >
                      🏨
                    </div>
                  )}
                  <Card.Body className="p-3 p-md-4">
                    {/* Badges */}
                    <div className="d-flex gap-1 flex-wrap mb-2">
                      <Badge
                        style={{
                          background: "var(--ocean-blue)",
                          fontSize: "0.7rem",
                          padding: "4px 8px",
                        }}
                      >
                        {acc.type}
                      </Badge>
                      {acc.dotAccredited && (
                        <Badge
                          style={{
                            background: "var(--festival-amber)",
                            fontSize: "0.7rem",
                            padding: "4px 8px",
                          }}
                        >
                          ✅ DOT
                        </Badge>
                      )}
                      {acc.starRating && (
                        <Badge
                          bg="light"
                          className="text-warning border"
                          style={{ fontSize: "0.7rem", padding: "4px 8px" }}
                        >
                          {"⭐".repeat(acc.starRating)}
                        </Badge>
                      )}
                    </div>

                    {/* Name */}
                    <h5
                      className="fw-bold mb-1"
                      style={{
                        fontFamily: "Poppins, serif",
                        fontSize: "1.1rem",
                        lineHeight: 1.3,
                      }}
                    >
                      {acc.name}
                    </h5>

                    {/* Location */}
                    <p
                      className="text-muted mb-2"
                      style={{ fontSize: "0.8rem", lineHeight: 1.4 }}
                    >
                      📍{" "}
                      {acc.location?.address ||
                        acc.locationAddress ||
                        "Calbayog City"}
                    </p>

                    {/* Description */}
                    <p
                      className="text-muted mb-2"
                      style={{
                        fontSize: "0.82rem",
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {acc.description}
                    </p>

                    {/* Price Range */}
                    {acc.priceRange?.min && (
                      <p
                        className="mb-2"
                        style={{
                          fontSize: "0.9rem",
                          color: "var(--tropical-green)",
                          fontWeight: 700,
                        }}
                      >
                        💵 ₱{acc.priceRange.min.toLocaleString()}
                        {acc.priceRange.max
                          ? ` – ₱${acc.priceRange.max.toLocaleString()}`
                          : "+"}
                        <span
                          className="text-muted fw-normal"
                          style={{ fontSize: "0.8rem" }}
                        >
                          {" "}
                          /night
                        </span>
                      </p>
                    )}

                    {/* Amenities */}
                    {acc.amenities && acc.amenities.length > 0 && (
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        {acc.amenities.slice(0, 4).map((a) => (
                          <span
                            key={a}
                            title={a}
                            style={{ fontSize: "1.2rem", cursor: "default" }}
                          >
                            {amenityIcons[a] || "✔️"}
                          </span>
                        ))}
                        {acc.amenities.length > 4 && (
                          <span
                            className="text-muted"
                            style={{ fontSize: "0.75rem", alignSelf: "center" }}
                          >
                            +{acc.amenities.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Contact Actions */}
                    <div className="d-flex gap-2 flex-wrap">
                      {acc.contact?.phone && (
                        <a
                          href={`tel:${acc.contact.phone}`}
                          className="btn btn-primary btn-sm flex-grow-1"
                          style={{ minWidth: "80px" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          📞 Call
                        </a>
                      )}
                      {acc.contact?.email && (
                        <a
                          href={`mailto:${acc.contact.email}`}
                          className="btn btn-outline-primary btn-sm flex-grow-1"
                          style={{ minWidth: "80px" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          ✉️ Email
                        </a>
                      )}
                      {acc.contact?.messenger && (
                        <a
                          href={acc.contact.messenger}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-outline-primary btn-sm flex-grow-1"
                          style={{ minWidth: "80px" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          💬
                        </a>
                      )}
                      {acc.contact?.facebook && (
                        <a
                          href={acc.contact.facebook}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-outline-primary btn-sm flex-grow-1"
                          style={{ minWidth: "80px" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          📘
                        </a>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default Accommodations;
