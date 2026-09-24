import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  InputGroup,
  Button,
  Spinner,
} from "react-bootstrap";
import { getDestinations } from "../services/api";
import { Destination, DestinationCategory } from "../types";

const CATEGORIES: DestinationCategory[] = [
  "All",
  "Waterfalls",
  "Beaches",
  "Heritage",
  "Hotels",
  "Food",
  "Events",
  "Transport",
  "Nature",
  "Other",
];

const categoryIcons: Record<string, string> = {
  All: "🌐",
  Waterfalls: "🌊",
  Beaches: "🏖️",
  Heritage: "🏛️",
  Hotels: "🏨",
  Food: "🍽️",
  Events: "🎉",
  Transport: "🚌",
  Nature: "🌿",
  Other: "📍",
};

const Destinations: React.FC = () => {
  const location = useLocation();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] =
    useState<DestinationCategory>("All");
  const [search, setSearch] = useState("");

  // Parse search from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("search");
    if (q) {
      setSearch(q);
      handleSearch(q);
    }
  }, [location.search]);

  useEffect(() => {
    fetchDestinations();
  }, [activeCategory]);

  const fetchDestinations = async (searchQuery?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (activeCategory !== "All") params.category = activeCategory;
      if (searchQuery) params.search = searchQuery;
      const res = await getDestinations(params);
      setDestinations(Array.isArray(res.data) ? res.data : []);
    } catch {
      setDestinations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (q?: string) => {
    const query = q ?? search;
    setLoading(true);
    getDestinations({
      search: query,
      ...(activeCategory !== "All" ? { category: activeCategory } : {}),
    })
      .then((r) => setDestinations(Array.isArray(r.data) ? r.data : []))
      .catch(() => setDestinations([]))
      .finally(() => setLoading(false));
  };

  const handleCategoryChange = (cat: DestinationCategory) => {
    setActiveCategory(cat);
    setSearch("");
    // Clear search by navigating without query params
  };

  return (
    <div className="page-enter">
      {/* Header */}
      <div
        className="hero-section py-4 px-3 text-center"
        style={{ minHeight: 160 }}
      >
        <div style={{ position: "relative", zIndex: 2 }}>
          <h1
            className="fs-3 fw-bold mb-1"
            style={{ fontFamily: "Poppins, serif" }}
          >
            Tourist Destinations
          </h1>
          <p className="mb-3" style={{ fontSize: "0.9rem" }}>
            Discover Calbayog's hidden gems
          </p>
          <InputGroup style={{ maxWidth: 420, margin: "0 auto" }}>
            <Form.Control
              placeholder="Search destinations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              style={{ border: "none" }}
            />
            <Button variant="warning" onClick={() => handleSearch()}>
              🔍
            </Button>
          </InputGroup>
        </div>
      </div>

      <Container className="py-3">
        {/* Category Pills */}
        <div className="category-pills mb-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`category-pill ${activeCategory === cat ? "active" : ""}`}
              onClick={() => handleCategoryChange(cat)}
            >
              {categoryIcons[cat]} {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner
              animation="border"
              style={{ color: "var(--tropical-green)" }}
            />
          </div>
        ) : destinations.length === 0 ? (
          <div className="text-center py-5">
            <div style={{ fontSize: "3rem" }}>🔍</div>
            <p className="text-muted mt-2" style={{ fontWeight: 600 }}>
              No destinations found.
            </p>
            <Button
              variant="outline-primary"
              onClick={() => {
                setActiveCategory("All");
                setSearch("");
                fetchDestinations();
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            <p className="text-muted mb-3" style={{ fontSize: "0.85rem" }}>
              {destinations.length} destination
              {destinations.length !== 1 ? "s" : ""} found
            </p>
            <Row className="g-3">
              {destinations.map((dest) => (
                <Col xs={12} sm={6} md={4} key={dest.id}>
                  <Link
                    to={`/destinations/${dest.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <Card className="tourism-card h-100">
                      <div style={{ position: "relative", height: 200 }}>
                        {dest.images?.[0] ? (
                          <img
                            src={dest.images[0]}
                            alt={dest.name}
                            className="img-cover card-img-top"
                            style={{ height: "100%" }}
                          />
                        ) : (
                          <div
                            className="d-flex align-items-center justify-content-center h-100"
                            style={{
                              background: "var(--tropical-green-light)",
                              fontSize: "3rem",
                            }}
                          >
                            {categoryIcons[dest.category] || "🌿"}
                          </div>
                        )}
                        <span
                          className="badge position-absolute top-0 start-0 m-2"
                          style={{ background: "var(--tropical-green)" }}
                        >
                          {dest.category}
                        </span>
                        {dest.featured && (
                          <span
                            className="badge position-absolute top-0 end-0 m-2"
                            style={{ background: "var(--festival-amber)" }}
                          >
                            ⭐ Featured
                          </span>
                        )}
                      </div>
                      <Card.Body className="p-3">
                        <Card.Title
                          className="fs-6 fw-bold mb-1"
                          style={{ fontFamily: "Poppins, serif" }}
                        >
                          {dest.name}
                        </Card.Title>
                        {dest.location_address && (
                          <p
                            className="text-muted mb-1"
                            style={{ fontSize: "0.75rem", fontWeight: 500 }}
                          >
                            📍 {dest.location_address}
                          </p>
                        )}
                        <p
                          className="text-muted mb-0"
                          style={{ fontSize: "0.8rem", fontWeight: 500 }}
                        >
                          {(dest.short_description || dest.description).slice(
                            0,
                            90,
                          )}
                          ...
                        </p>
                        {dest.entrance_fee && (
                          <p
                            className="mb-0 mt-2"
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--tropical-green)",
                              fontWeight: 600,
                            }}
                          >
                            🎟️ {dest.entrance_fee}
                          </p>
                        )}
                      </Card.Body>
                    </Card>
                  </Link>
                </Col>
              ))}
            </Row>
          </>
        )}
      </Container>
    </div>
  );
};

export default Destinations;
