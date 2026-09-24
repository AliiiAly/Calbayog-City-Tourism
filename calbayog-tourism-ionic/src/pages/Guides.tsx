import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Spinner,
  Form,
} from "react-bootstrap";
import { getGuides, clearCache } from "../services/api";
import { Guide } from "../types";

const Guides: React.FC = () => {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Clear cache to ensure fresh data
    clearCache("guides");

    getGuides({})
      .then((r) => {
        console.log("Guides API response:", r);
        setGuides(Array.isArray(r.data) ? r.data : []);
      })
      .catch((err) => {
        console.error("Guides API error:", err);
        setGuides([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-enter">
      <div
        className="hero-section py-3 py-md-4 px-3 text-center"
        style={{ minHeight: "100px" }}
      >
        <div style={{ position: "relative", zIndex: 2 }}>
          <h1
            className="fs-3 fs-md-4 fw-bold mb-1"
            style={{ fontFamily: "Poppins, serif" }}
          >
            🧭 Tour Guides
          </h1>
          <p style={{ opacity: 0.85, fontSize: "0.85rem", margin: 0 }}>
            Local guides for your Calbayog adventure
          </p>
        </div>
      </div>

      <Container className="py-3" style={{ maxWidth: "1400px" }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
            {guides.length} guide{guides.length !== 1 ? "s" : ""} available
          </p>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner
              animation="border"
              style={{ color: "var(--tropical-green)" }}
            />
            <p className="text-muted mt-3">Loading guides...</p>
          </div>
        ) : guides.length === 0 ? (
          <div className="text-center py-5">
            <div style={{ fontSize: "3rem" }}>🧭</div>
            <p className="text-muted mt-2">No guides found.</p>
          </div>
        ) : (
          <Row className="g-3 g-md-4">
            {guides.map((guide, guideIdx) => (
              <Col
                xs={12}
                sm={6}
                lg={4}
                xl={3}
                key={guide._id || `guide-${guideIdx}`}
              >
                <Card
                  className="tourism-card h-100 border-0"
                  style={{
                    borderRadius: "16px",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
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
                  <Card.Body className="p-3 p-md-4">
                    <div className="d-flex gap-2 gap-md-3 mb-3 align-items-start">
                      {guide.image ? (
                        <img
                          src={guide.image}
                          alt={guide.name}
                          style={{
                            width: "50px",
                            height: "50px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            flexShrink: 0,
                            border: "2px solid var(--tropical-green-light)",
                          }}
                          className="d-sm-none"
                        />
                      ) : (
                        <div
                          style={{
                            width: "50px",
                            height: "50px",
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg, var(--tropical-green-light), var(--tropical-green))",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.5rem",
                            flexShrink: 0,
                          }}
                          className="d-sm-none"
                        >
                          👤
                        </div>
                      )}
                      {guide.image ? (
                        <img
                          src={guide.image}
                          alt={guide.name}
                          style={{
                            width: "60px",
                            height: "60px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            flexShrink: 0,
                            border: "2px solid var(--tropical-green-light)",
                          }}
                          className="d-none d-sm-block"
                        />
                      ) : (
                        <div
                          style={{
                            width: "60px",
                            height: "60px",
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg, var(--tropical-green-light), var(--tropical-green))",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "2rem",
                            flexShrink: 0,
                          }}
                          className="d-none d-sm-block"
                        >
                          👤
                        </div>
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h5
                          className="fw-bold mb-1"
                          style={{
                            fontFamily: "Poppins, serif",
                            fontSize: "1rem",
                            lineHeight: 1.3,
                          }}
                        >
                          {guide.name}
                        </h5>
                        <div className="d-flex gap-1 flex-wrap">
                          {guide.featured && (
                            <Badge
                              key={`featured-${guideIdx}`}
                              style={{
                                background: "var(--festival-amber)",
                                fontSize: "0.65rem",
                                padding: "3px 6px",
                              }}
                            >
                              ⭐ Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {guide.short_description && (
                      <p
                        className="text-muted mb-2"
                        style={{
                          fontSize: "0.8rem",
                          lineHeight: 1.4,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {guide.short_description}
                      </p>
                    )}

                    {guide.specialties && guide.specialties.length > 0 && (
                      <div className="mb-2">
                        <small
                          className="text-muted fw-semibold"
                          style={{ fontSize: "0.75rem" }}
                        >
                          Specializes in:
                        </small>
                        <div className="d-flex flex-wrap gap-1 mt-1">
                          {guide.specialties.slice(0, 3).map((s, idx) => (
                            <Badge
                              key={`${guideIdx}-specialty-${idx}`}
                              bg="light"
                              className="text-dark border"
                              style={{
                                fontSize: "0.65rem",
                                padding: "3px 6px",
                              }}
                            >
                              {s}
                            </Badge>
                          ))}
                          {guide.specialties.length > 3 && (
                            <Badge
                              bg="light"
                              className="text-dark border"
                              style={{
                                fontSize: "0.65rem",
                                padding: "3px 6px",
                              }}
                            >
                              +{guide.specialties.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {guide.location_address && (
                      <p
                        className="text-muted mb-2"
                        style={{ fontSize: "0.75rem", lineHeight: 1.3 }}
                      >
                        📍 {guide.location_address}
                      </p>
                    )}

                    {guide.languages && guide.languages.length > 0 && (
                      <p
                        className="text-muted mb-2"
                        style={{ fontSize: "0.75rem" }}
                      >
                        🗣️ {guide.languages.slice(0, 2).join(", ")}
                        {guide.languages.length > 2
                          ? ` +${guide.languages.length - 2}`
                          : ""}
                      </p>
                    )}

                    {guide.rate && (
                      <p
                        className="mb-3"
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--tropical-green)",
                          fontWeight: 700,
                        }}
                      >
                        💵 {guide.rate}
                      </p>
                    )}

                    <div className="d-flex gap-2 flex-wrap">
                      {guide.contact_phone && (
                        <a
                          key={`phone-${guideIdx}`}
                          href={`tel:${guide.contact_phone}`}
                          className="btn btn-primary btn-sm flex-grow-1"
                          style={{ minWidth: "70px", fontSize: "0.8rem" }}
                        >
                          📞 Call
                        </a>
                      )}
                      {guide.contact_facebook && (
                        <a
                          key={`facebook-${guideIdx}`}
                          href={guide.contact_facebook}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-outline-primary btn-sm flex-grow-1"
                          style={{ minWidth: "70px", fontSize: "0.8rem" }}
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

export default Guides;
