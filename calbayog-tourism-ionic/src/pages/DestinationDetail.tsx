import React, { useState, useEffect } from "react";
import { useParams, useHistory, Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Badge,
  Button,
  Spinner,
  Card,
} from "react-bootstrap";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { getDestination } from "../services/api";
import { Destination } from "../types";

const DestinationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [dest, setDest] = useState<Destination | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    if (!id) return;
    getDestination(id)
      .then((r) => setDest(r.data || null))
      .catch(() => history.push("/destinations"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <Spinner
          animation="border"
          style={{ color: "var(--tropical-green)" }}
        />
      </div>
    );
  if (!dest) return null;

  const images = dest.images?.length ? dest.images : [];

  return (
    <div className="page-enter pb-5">
      {/* Back */}
      <div className="px-3 pt-3">
        <Button
          variant="link"
          className="p-0 text-green fw-semibold"
          onClick={() => history.goBack()}
        >
          ← Back
        </Button>
      </div>

      {/* Image Gallery */}
      {images.length > 0 ? (
        <div style={{ position: "relative" }}>
          <img
            src={images[activeImg]}
            alt={dest.name}
            className="img-cover w-100"
            style={{ height: 280, objectFit: "cover" }}
          />
          {images.length > 1 && (
            <div
              className="d-flex gap-2 px-3 mt-2 overflow-auto"
              style={{ scrollbarWidth: "none" }}
            >
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt=""
                  onClick={() => setActiveImg(i)}
                  style={{
                    width: 60,
                    height: 60,
                    objectFit: "cover",
                    borderRadius: 8,
                    cursor: "pointer",
                    border:
                      i === activeImg
                        ? "2px solid var(--tropical-green)"
                        : "2px solid transparent",
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div
          className="d-flex align-items-center justify-content-center"
          style={{
            height: 200,
            background: "var(--tropical-green-light)",
            fontSize: "4rem",
          }}
        >
          🌿
        </div>
      )}

      <Container className="py-3">
        <Row>
          <Col lg={8}>
            {/* Title & Category */}
            <div className="d-flex align-items-start gap-2 mb-2 flex-wrap">
              <Badge
                style={{
                  background: "var(--tropical-green)",
                  fontSize: "0.8rem",
                }}
              >
                {dest.category}
              </Badge>
              {dest.featured && (
                <Badge style={{ background: "var(--festival-amber)" }}>
                  ⭐ Featured
                </Badge>
              )}
            </div>
            <h1
              className="fs-3 fw-bold mb-1"
              style={{ fontFamily: "Poppins, serif" }}
            >
              {dest.name}
            </h1>
            {dest.location_address && (
              <p className="text-muted mb-3" style={{ fontSize: "0.9rem" }}>
                📍 {dest.location_address}
              </p>
            )}

            {/* Quick Info */}
            <div className="d-flex gap-3 flex-wrap mb-3">
              {dest.opening_hours && (
                <span style={{ fontSize: "0.85rem" }}>
                  🕐 {dest.opening_hours}
                </span>
              )}
              {dest.entrance_fee && (
                <span
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--tropical-green)",
                    fontWeight: 600,
                  }}
                >
                  🎟️ {dest.entrance_fee}
                </span>
              )}
            </div>

            {/* Description */}
            <h5 className="fw-bold mb-2">About</h5>
            <p
              className="text-muted"
              style={{ lineHeight: 1.7, fontSize: "0.95rem" }}
            >
              {dest.description}
            </p>

            {/* Getting There */}
            {dest.getting_there && (
              <Card
                className="border-0 mb-3"
                style={{ background: "#e3f2fd", borderRadius: 12 }}
              >
                <Card.Body className="p-3">
                  <h6 className="fw-bold mb-2" style={{ color: "#1976d2" }}>
                    🚗 Getting There
                  </h6>
                  <p
                    className="text-muted mb-0"
                    style={{ lineHeight: 1.6, fontSize: "0.9rem" }}
                  >
                    {dest.getting_there}
                  </p>
                </Card.Body>
              </Card>
            )}

            {/* Tips */}
            {dest.tips && dest.tips.length > 0 && (
              <Card
                className="border-0 mb-3"
                style={{
                  background: "var(--tropical-green-light)",
                  borderRadius: 12,
                }}
              >
                <Card.Body className="p-3">
                  <h6 className="fw-bold mb-2 text-green">💡 Visitor Tips</h6>
                  <ul className="mb-0 ps-3">
                    {dest.tips.map((tip, i) => (
                      <li
                        key={i}
                        className="text-muted"
                        style={{ fontSize: "0.9rem", marginBottom: 4 }}
                      >
                        {tip}
                      </li>
                    ))}
                  </ul>
                </Card.Body>
              </Card>
            )}

            {/* Tags */}
            {dest.tags && dest.tags.length > 0 && (
              <div className="d-flex flex-wrap gap-2 mb-3">
                {dest.tags.map((tag) => (
                  <Badge
                    key={tag}
                    bg="light"
                    className="text-muted border"
                    style={{ fontWeight: 400, fontSize: "0.8rem" }}
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </Col>

          <Col lg={4}>
            {/* Contact Card */}
            {(dest.contact_phone ||
              dest.contact_email ||
              dest.contact_facebook ||
              dest.contact_website) && (
              <Card className="border-0 shadow-tourism rounded-xl mb-3">
                <Card.Body className="p-3">
                  <h6 className="fw-bold mb-3">📞 Contact & Links</h6>
                  <div className="d-flex flex-column gap-2">
                    {dest.contact_phone && (
                      <a
                        href={`tel:${dest.contact_phone}`}
                        className="btn btn-primary btn-sm"
                      >
                        📞 Call Now
                      </a>
                    )}
                    {dest.contact_email && (
                      <a
                        href={`mailto:${dest.contact_email}`}
                        className="btn btn-outline-primary btn-sm"
                      >
                        ✉️ Email
                      </a>
                    )}
                    {dest.contact_facebook && (
                      <a
                        href={dest.contact_facebook}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline-primary btn-sm"
                      >
                        📘 Facebook
                      </a>
                    )}
                    {dest.contact_website && (
                      <a
                        href={dest.contact_website}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline-primary btn-sm"
                      >
                        🌐 Website
                      </a>
                    )}
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Map */}
            {dest.location_lat && dest.location_lng && (
              <Card className="border-0 shadow-tourism rounded-xl overflow-hidden">
                <MapContainer
                  center={[dest.location_lat, dest.location_lng]}
                  zoom={14}
                  style={{ height: 220 }}
                  scrollWheelZoom={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[dest.location_lat, dest.location_lng]}>
                    <Popup>{dest.name}</Popup>
                  </Marker>
                </MapContainer>
                <Card.Body className="p-2 text-center">
                  <Link
                    to="/map"
                    className="text-green fw-semibold"
                    style={{ fontSize: "0.8rem" }}
                  >
                    View on full map →
                  </Link>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>

        {/* Action Row */}
        <div className="d-flex gap-2 mt-3 flex-wrap">
          <Link to="/itinerary" className="btn btn-primary">
            📋 Add to Itinerary
          </Link>
          <Link to="/request-itinerary" className="btn btn-outline-primary">
            📅 Request Guided Tour
          </Link>
        </div>
      </Container>
    </div>
  );
};

export default DestinationDetail;
