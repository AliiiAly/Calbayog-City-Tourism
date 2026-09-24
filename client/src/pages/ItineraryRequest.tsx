import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Form,
  Button,
  Alert,
  Row,
  Col,
  Badge,
} from "react-bootstrap";
import {
  submitItineraryRequest,
  createNotification,
  getAttractions,
} from "../services/api";
import { Destination } from "../types";

const GROUP_TYPES = [
  "Solo",
  "Couple",
  "Family",
  "Friends",
  "Corporate",
  "School",
  "Other",
];

const BUDGET_RANGES = [
  { label: "Select range", value: "" },
  { label: "Under ₱5,000", value: "Under ₱5,000" },
  { label: "₱5,000 – ₱10,000", value: "₱5,000 – ₱10,000" },
  { label: "₱10,000 – ₱25,000", value: "₱10,000 – ₱25,000" },
  { label: "₱25,000 – ₱50,000", value: "₱25,000 – ₱50,000" },
  { label: "Over ₱50,000", value: "Over ₱50,000" },
];

const EMPTY_FORM = {
  fullName: "",
  email: "",
  phone: "",
  travelDateStart: "",
  travelDateEnd: "",
  groupSize: 1,
  groupType: "Family",
  preferredSpots: [] as string[],
  accommodationNeeded: false,
  guideNeeded: false,
  budget: "",
  specialRequests: "",
};

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidPhone = (phone: string) =>
  !phone || /^[\d\s+\-()]{7,20}$/.test(phone);

const todayStr = () => new Date().toISOString().split("T")[0];

const ItineraryRequest: React.FC = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getAttractions()
      .then((r) => {
        setDestinations(Array.isArray(r.data) ? r.data : []);
      })
      .catch((err) => {
        console.error("Failed to load attractions:", err);
        setDestinations([]);
      });
  }, []);

  const handleChange = (field: string, value: any) =>
    setForm((f) => ({ ...f, [field]: value }));

  const toggleSpot = (name: string) =>
    setForm((f) => ({
      ...f,
      preferredSpots:
        Array.isArray(f.preferredSpots) && f.preferredSpots.includes(name)
          ? f.preferredSpots.filter((s) => s !== name)
          : [...(f.preferredSpots || []), name],
    }));

  const validate = () => {
    if (!form.fullName.trim()) return "Please enter your full name.";
    if (!form.email.trim()) return "Please enter your email address.";
    if (!isValidEmail(form.email))
      return "Please enter a valid email address.";
    if (!isValidPhone(form.phone))
      return "Please enter a valid phone number or leave it blank.";
    if (!form.travelDateStart)
      return "Please select an arrival date.";
    if (!form.travelDateEnd)
      return "Please select a departure date.";
    if (form.travelDateEnd < form.travelDateStart)
      return "Departure date must be on or after the arrival date.";
    if (!form.groupSize || form.groupSize < 1)
      return "Group size must be at least 1.";

    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      fullName: true,
      email: true,
      phone: true,
      travelDateStart: true,
      travelDateEnd: true,
      groupSize: true,
    });

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      await submitItineraryRequest(form);

      // Create notification for admin about new trip request
      try {
        await createNotification({
          userId: "all",
          type: "trip_request",
          title: "New Trip Request!",
          message: `${form.fullName} has requested an itinerary for ${form.groupSize} person(s)`,
          data: {
            requesterName: form.fullName,
            groupSize: form.groupSize,
            travelDate: form.travelDateStart,
          },
        });
      } catch (notifErr) {
        console.error(
          "Failed to create notification:",
          notifErr,
        );
      }

      setSuccess(true);
      setForm({ ...EMPTY_FORM });
      setTouched({});
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Submission failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({ ...EMPTY_FORM });
    setError("");
    setTouched({});
  };

  if (success)
    return (
      <Container
        className="py-5 text-center"
        style={{ maxWidth: 500 }}
      >
        <div style={{ fontSize: "4rem" }}>📬</div>

        <h4
          className="fw-bold mt-3 mb-2"
          style={{ fontFamily: "Poppins, serif" }}
        >
          Request Sent!
        </h4>

        <p className="text-muted mb-4">
          We've received your itinerary request. A confirmation email
          has been sent, and our team will contact you within 2–3
          business days.
        </p>

        <Button
          variant="primary"
          onClick={() => setSuccess(false)}
        >
          Submit Another
        </Button>
      </Container>
    );

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
            📅 Request Itinerary
          </h1>

          <p
            style={{
              opacity: 0.85,
              fontSize: "0.9rem",
              margin: 0,
            }}
          >
            Let our tourism team plan your perfect trip
          </p>
        </div>
      </div>

      <Container
        className="py-4"
        style={{ maxWidth: 720 }}
      >
        <Card className="border-0 shadow-tourism rounded-xl">
          <Card.Body className="p-4">
            {error && (
              <Alert
                variant="danger"
                className="py-2"
                dismissible
                onClose={() => setError("")}
              >
                {error}
              </Alert>
            )}

            <Form
              onSubmit={handleSubmit}
              noValidate
            >
              <h6 className="fw-bold mb-3 text-green">
                👤 Contact Information
              </h6>

              <Row className="g-3 mb-4">
                <Col xs={12} sm={6}>
                  <Form.Label className="fw-semibold">
                    Full Name *
                  </Form.Label>

                  <Form.Control
                    required
                    value={form.fullName}
                    onChange={(e) =>
                      handleChange(
                        "fullName",
                        e.target.value,
                      )
                    }
                    onBlur={() =>
                      setTouched((t) => ({
                        ...t,
                        fullName: true,
                      }))
                    }
                    isInvalid={
                      touched.fullName &&
                      !form.fullName.trim()
                    }
                    placeholder="Juan dela Cruz"
                  />

                  <Form.Control.Feedback type="invalid">
                    Full name is required.
                  </Form.Control.Feedback>
                </Col>

                <Col xs={12} sm={6}>
                  <Form.Label className="fw-semibold">
                    Email *
                  </Form.Label>

                  <Form.Control
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      handleChange(
                        "email",
                        e.target.value,
                      )
                    }
                    onBlur={() =>
                      setTouched((t) => ({
                        ...t,
                        email: true,
                      }))
                    }
                    isInvalid={
                      touched.email &&
                      !isValidEmail(form.email)
                    }
                    placeholder="your@email.com"
                  />

                  <Form.Control.Feedback type="invalid">
                    Please enter a valid email address.
                  </Form.Control.Feedback>
                </Col>

                <Col xs={12} sm={6}>
                  <Form.Label className="fw-semibold">
                    Phone{" "}
                    <span className="text-muted fw-normal">
                      (optional)
                    </span>
                  </Form.Label>

                  <Form.Control
                    value={form.phone}
                    onChange={(e) =>
                      handleChange(
                        "phone",
                        e.target.value,
                      )
                    }
                    onBlur={() =>
                      setTouched((t) => ({
                        ...t,
                        phone: true,
                      }))
                    }
                    isInvalid={
                      touched.phone &&
                      !isValidPhone(form.phone)
                    }
                    placeholder="+63 9XX XXX XXXX"
                  />

                  <Form.Control.Feedback type="invalid">
                    Please enter a valid phone number.
                  </Form.Control.Feedback>
                </Col>
              </Row>

              <h6 className="fw-bold mb-3 text-green">
                🗓️ Travel Details
              </h6>

              <Row className="g-3 mb-4">
                <Col xs={12} sm={6}>
                  <Form.Label className="fw-semibold">
                    Arrival Date *
                  </Form.Label>

                  <Form.Control
                    required
                    type="date"
                    min={todayStr()}
                    value={form.travelDateStart}
                    onChange={(e) =>
                      handleChange(
                        "travelDateStart",
                        e.target.value,
                      )
                    }
                    onBlur={() =>
                      setTouched((t) => ({
                        ...t,
                        travelDateStart: true,
                      }))
                    }
                    isInvalid={
                      touched.travelDateStart &&
                      !form.travelDateStart
                    }
                  />

                  <Form.Control.Feedback type="invalid">
                    Arrival date is required.
                  </Form.Control.Feedback>
                </Col>

                <Col xs={12} sm={6}>
                  <Form.Label className="fw-semibold">
                    Departure Date *
                  </Form.Label>

                  <Form.Control
                    required
                    type="date"
                    min={
                      form.travelDateStart ||
                      todayStr()
                    }
                    value={form.travelDateEnd}
                    onChange={(e) =>
                      handleChange(
                        "travelDateEnd",
                        e.target.value,
                      )
                    }
                    onBlur={() =>
                      setTouched((t) => ({
                        ...t,
                        travelDateEnd: true,
                      }))
                    }
                    isInvalid={
                      touched.travelDateEnd &&
                      (!form.travelDateEnd ||
                        form.travelDateEnd <
                          form.travelDateStart)
                    }
                  />

                  <Form.Control.Feedback type="invalid">
                    Departure date must be on or after the
                    arrival date.
                  </Form.Control.Feedback>
                </Col>

                <Col xs={12} sm={4}>
                  <Form.Label className="fw-semibold">
                    Group Size *
                  </Form.Label>

                  <Form.Control
                    required
                    type="number"
                    min={1}
                    value={form.groupSize}
                    onChange={(e) =>
                      handleChange(
                        "groupSize",
                        Math.max(
                          1,
                          parseInt(
                            e.target.value || "1",
                            10,
                          ),
                        ),
                      )
                    }
                    onBlur={() =>
                      setTouched((t) => ({
                        ...t,
                        groupSize: true,
                      }))
                    }
                    isInvalid={
                      touched.groupSize &&
                      (!form.groupSize ||
                        form.groupSize < 1)
                    }
                  />

                  <Form.Control.Feedback type="invalid">
                    Group size must be at least 1.
                  </Form.Control.Feedback>
                </Col>

                <Col xs={12} sm={4}>
                  <Form.Label className="fw-semibold">
                    Group Type
                  </Form.Label>

                  <Form.Select
                    value={form.groupType}
                    onChange={(e) =>
                      handleChange(
                        "groupType",
                        e.target.value,
                      )
                    }
                  >
                    {GROUP_TYPES.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </Form.Select>
                </Col>

                <Col xs={12} sm={4}>
                  <Form.Label className="fw-semibold">
                    Budget Range
                  </Form.Label>

                  <Form.Select
                    value={form.budget}
                    onChange={(e) =>
                      handleChange(
                        "budget",
                        e.target.value,
                      )
                    }
                  >
                    {BUDGET_RANGES.map((b) => (
                      <option
                        key={b.value}
                        value={b.value}
                      >
                        {b.label}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>

              <h6 className="fw-bold mb-3 text-green">
                📍 Preferred Attractions
              </h6>

              <p
                className="text-muted mb-2"
                style={{ fontSize: "0.85rem" }}
              >
                Select the attractions you'd like to visit:
              </p>

              <div className="d-flex flex-wrap gap-2 mb-3">
                {destinations.map((d) => {
                  const selected =
                    form.preferredSpots.includes(d.name);

                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() =>
                        toggleSpot(d.name)
                      }
                      aria-pressed={selected}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 20,
                        fontSize: "0.85rem",
                        border:
                          "2px solid var(--tropical-green)",
                        background: selected
                          ? "var(--tropical-green)"
                          : "transparent",
                        color: selected
                          ? "#fff"
                          : "var(--tropical-green)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        fontWeight: selected
                          ? 600
                          : 400,
                      }}
                    >
                      {selected ? "✓ " : ""}
                      {d.name}
                    </button>
                  );
                })}
              </div>

              {form.preferredSpots.length > 0 && (
                <div className="mb-4 d-flex flex-wrap gap-1 align-items-center">
                  <small className="text-muted me-2">
                    Selected:
                  </small>

                  {form.preferredSpots.map((s) => (
                    <Badge
                      key={s}
                      style={{
                        background:
                          "var(--tropical-green)",
                        fontSize: "0.75rem",
                      }}
                    >
                      {s}
                    </Badge>
                  ))}

                  <button
                    type="button"
                    className="btn btn-link p-0 ms-2"
                    style={{ fontSize: "0.75rem" }}
                    onClick={() =>
                      handleChange(
                        "preferredSpots",
                        [],
                      )
                    }
                  >
                    Clear all
                  </button>
                </div>
              )}

              <h6 className="fw-bold mb-3 text-green">
                🛎️ Services Needed
              </h6>

              <div className="d-flex flex-wrap gap-4 mb-4">
                <Form.Check
                  type="checkbox"
                  label="🏨 Accommodation"
                  checked={
                    form.accommodationNeeded
                  }
                  onChange={(e) =>
                    handleChange(
                      "accommodationNeeded",
                      e.target.checked,
                    )
                  }
                />

                <Form.Check
                  type="checkbox"
                  label="🧭 Tour Guide"
                  checked={form.guideNeeded}
                  onChange={(e) =>
                    handleChange(
                      "guideNeeded",
                      e.target.checked,
                    )
                  }
                />
              </div>

              <h6 className="fw-bold mb-3 text-green">
                📝 Special Requests
              </h6>

              <Form.Control
                as="textarea"
                rows={3}
                className="mb-4"
                value={form.specialRequests}
                onChange={(e) =>
                  handleChange(
                    "specialRequests",
                    e.target.value,
                  )
                }
                placeholder="Dietary restrictions, accessibility needs, special occasions..."
              />

              <div className="d-flex gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-grow-1 py-2 fw-semibold"
                  disabled={loading}
                >
                  {loading
                    ? "⏳ Submitting..."
                    : "📤 Submit Itinerary Request"}
                </Button>

                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={handleReset}
                  disabled={loading}
                >
                  Reset
                </Button>
              </div>

              <p
                className="text-muted text-center mt-2 mb-0"
                style={{ fontSize: "0.8rem" }}
              >
                A confirmation email will be sent to your
                inbox. We'll respond within 2–3 business
                days.
              </p>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default ItineraryRequest;