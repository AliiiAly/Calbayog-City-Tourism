import React, { useState, useEffect } from "react";
import {
  Container,
  Tab,
  Nav,
  Card,
  Badge,
  Row,
  Col,
  Spinner,
} from "react-bootstrap";
import { getGettingThere } from "../services/api";

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

const GettingThere: React.FC = () => {
  const [activeTab, setActiveTab] = useState("land");
  const [items, setItems] = useState<GEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGettingThere()
      .then((r) => setItems(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const landRoutes = items.filter((i) => i.category === "land");
  const localTransport = items.filter((i) => i.category === "local");

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
            ✈️ Getting to Calbayog
          </h1>
          <p style={{ opacity: 0.85, fontSize: "0.9rem", margin: 0 }}>
            Multiple ways to reach the City of Waterfalls
          </p>
        </div>
      </div>

      <Container className="py-3">
        <Tab.Container
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k || "land")}
        >
          <Nav variant="tabs" className="mb-3">
            <Nav.Item>
              <Nav.Link eventKey="land">🚌 Land</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="local">🛺 Local</Nav.Link>
            </Nav.Item>
          </Nav>

          <Tab.Content>
            {/* LAND */}
            <Tab.Pane eventKey="land">
              <div
                className="mb-3 p-3 rounded-xl"
                style={{ background: "var(--tropical-green-light)" }}
              >
                <p className="mb-0 fw-semibold" style={{ fontSize: "0.9rem" }}>
                  🛣️ Calbayog is accessible via the Pan-Philippine Highway
                  (AH26). Scenic route through Samar.
                </p>
              </div>
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="success" />
                </div>
              ) : landRoutes.length === 0 ? (
                <p className="text-muted text-center py-3">
                  No land routes available.
                </p>
              ) : (
                landRoutes.map((r, i) => (
                  <Card key={r.id || i} className="tourism-card mb-3">
                    <Card.Body className="p-3">
                      <h6 className="fw-bold mb-2">From {r.origin}</h6>
                      <ol className="ps-3 mb-2">
                        {(r.steps || []).map((s, si) => (
                          <li
                            key={si}
                            className="text-muted mb-1"
                            style={{ fontSize: "0.85rem" }}
                          >
                            {s}
                          </li>
                        ))}
                      </ol>
                      <div className="d-flex gap-3 flex-wrap">
                        <span
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--tropical-green)",
                            fontWeight: 600,
                          }}
                        >
                          💵 {r.total_fare}
                        </span>
                        <span style={{ fontSize: "0.85rem" }}>
                          ⏱️ {r.duration}
                        </span>
                      </div>
                    </Card.Body>
                  </Card>
                ))
              )}
            </Tab.Pane>

            {/* LOCAL */}
            <Tab.Pane eventKey="local">
              <div
                className="mb-3 p-3 rounded-xl"
                style={{ background: "var(--tropical-green-light)" }}
              >
                <p className="mb-0 fw-semibold" style={{ fontSize: "0.9rem" }}>
                  🗺️ Once in Calbayog, use these options to get around the city
                  and nearby attractions.
                </p>
              </div>
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="success" />
                </div>
              ) : (
                <Row className="g-3">
                  {localTransport.length === 0 ? (
                    <Col>
                      <p className="text-muted text-center py-3">
                        No local transport available.
                      </p>
                    </Col>
                  ) : (
                    localTransport.map((t, i) => (
                      <Col xs={12} sm={6} key={t.id || i}>
                        <Card className="tourism-card h-100">
                          <Card.Body className="p-3">
                            <div style={{ fontSize: "2rem", marginBottom: 8 }}>
                              {t.icon}
                            </div>
                            <h6 className="fw-bold mb-1">{t.mode}</h6>
                            <p
                              className="text-muted mb-0"
                              style={{ fontSize: "0.85rem" }}
                            >
                              {t.description}
                            </p>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))
                  )}
                </Row>
              )}
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>

        {/* Emergency Contacts */}
        <Card
          className="border-0 mt-4 p-3"
          style={{ background: "#fff3cd", borderRadius: 12 }}
        >
          <h6 className="fw-bold mb-2">📞 Calbayog City Important Numbers</h6>
          <div className="d-flex flex-column gap-1">
            <small>
              🏛️ Calbayog City Tourism Office:{" "}
              <a href="tel:+6355520943">(055) 209-XXXX</a>
            </small>
            <small>
              🏢 Calbayog City Hall:{" "}
              <a href="tel:+6355520912">(055) 209-XXXX</a>
            </small>
            <small>
              🚔 PNP Calbayog Station:{" "}
              <a href="tel:+6355520911">(055) 209-XXXX</a>
            </small>
            <small>
              🚑 Calbayog District Hospital:{" "}
              <a href="tel:+6355520915">(055) 209-XXXX</a>
            </small>
            <small>
              ✈️ Calbayog Airport: <a href="tel:+6355520920">(055) 209-XXXX</a>
            </small>
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default GettingThere;
