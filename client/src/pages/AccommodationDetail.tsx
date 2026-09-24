import React, {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useHistory,
} from "react-router-dom";

import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";

import {
  getAccommodation,
} from "../services/api";

import { Accommodation } from "../types";

const amenityIcons: Record<
  string,
  string
> = {
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

const AccommodationDetail: React.FC =
  () => {
    const { id } =
      useParams<{
        id: string;
      }>();

    const history =
      useHistory();

    const [
      accommodation,
      setAccommodation,
    ] =
      useState<Accommodation | null>(
        null
      );

    const [loading, setLoading] =
      useState(true);

    const [error, setError] =
      useState<string | null>(
        null
      );

    const [
      selectedImage,
      setSelectedImage,
    ] =
      useState<string | null>(
        null
      );

    /* =====================================================
       LOAD ACCOMMODATION
    ===================================================== */

    useEffect(() => {
      fetchAccommodation();
    }, [id]);

    const fetchAccommodation =
      async () => {
        setLoading(true);
        setError(null);

        try {
          const res =
            await getAccommodation(id);

          const found =
            (res.data as Accommodation);

          if (found) {
            setAccommodation(
              found
            );

            setSelectedImage(
              (found as any)
                .images?.[0] ||
                null
            );
          } else {
            setError(
              "Accommodation not found"
            );
          }
        } catch (err) {
          console.error(
            "Accommodation detail error:",
            err
          );

          setError(
            "Failed to load accommodation details"
          );
        } finally {
          setLoading(false);
        }
      };

    /* =====================================================
       HELPERS
    ===================================================== */

    const acc: any =
      accommodation;

    const getAddress = () =>
      acc?.address ||
      "Calbayog City";

    const getPhone = () =>
      acc?.contact_number ||
      "";

    const getEmail = () =>
      acc?.email ||
      "";

    const getWebsite = () =>
      acc?.website ||
      "";

    const getPriceMin = () =>
      acc?.price_min;

    const getPriceMax = () =>
      acc?.price_max;

    const hasMinPrice =
      getPriceMin() !== null &&
      getPriceMin() !==
        undefined &&
      getPriceMin() !== "";

    const hasMaxPrice =
      getPriceMax() !== null &&
      getPriceMax() !==
        undefined &&
      getPriceMax() !== "";

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
      return (
        <div className="page-enter">
          <div className="text-center py-5">
            <Spinner
              animation="border"
              style={{
                color:
                  "var(--tropical-green)",
              }}
            />

            <p className="text-muted mt-3">
              Loading accommodation details...
            </p>
          </div>
        </div>
      );
    }

    /* =====================================================
       ERROR
    ===================================================== */

    if (
      error ||
      !accommodation
    ) {
      return (
        <div className="page-enter">
          <Container className="py-5">
            <Alert variant="danger">
              {error ||
                "Accommodation not found"}
            </Alert>

            <Button
              onClick={() =>
                history.push(
                  "/accommodations"
                )
              }
            >
              ← Back to Accommodations
            </Button>
          </Container>
        </div>
      );
    }

    /* =====================================================
       RENDER
    ===================================================== */

    return (
      <div className="page-enter">
        <Container className="py-4">
          {/* BACK BUTTON */}

          <Button
            variant="outline-primary"
            className="mb-3"
            onClick={() =>
              history.push(
                "/accommodations"
              )
            }
            style={{
              borderRadius:
                "8px",
            }}
          >
            ← Back to Accommodations
          </Button>

          <Row>
            {/* LEFT SIDE */}

            <Col lg={8}>
              {/* IMAGE GALLERY */}

              <Card
                className="mb-4 border-0"
                style={{
                  borderRadius:
                    "16px",
                  overflow:
                    "hidden",
                  boxShadow:
                    "0 4px 16px rgba(0,0,0,0.08)",
                }}
              >
                {selectedImage ? (
                  <img
                    src={
                      selectedImage
                    }
                    alt={
                      acc.name
                    }
                    style={{
                      width:
                        "100%",
                      height: 400,
                      objectFit:
                        "cover",
                    }}
                  />
                ) : (
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      height: 400,
                      background:
                        "var(--tropical-green-light)",
                      fontSize:
                        "5rem",
                    }}
                  >
                    🏨
                  </div>
                )}

                {/* THUMBNAILS */}

                {Array.isArray(
                  acc.images
                ) &&
                  acc.images.length >
                    1 && (
                    <div
                      className="p-3"
                      style={{
                        display:
                          "flex",
                        gap:
                          "0.5rem",
                        overflowX:
                          "auto",
                      }}
                    >
                      {acc.images.map(
                        (
                          img: string,
                          idx: number
                        ) => (
                          <img
                            key={
                              idx
                            }
                            src={
                              img
                            }
                            alt={`Thumbnail ${
                              idx +
                              1
                            }`}
                            onClick={() =>
                              setSelectedImage(
                                img
                              )
                            }
                            style={{
                              width: 60,
                              height: 60,
                              objectFit:
                                "cover",
                              borderRadius:
                                "8px",
                              cursor:
                                "pointer",
                              border:
                                selectedImage ===
                                img
                                  ? "3px solid var(--tropical-green)"
                                  : "2px solid #dee2e6",
                              opacity:
                                selectedImage ===
                                img
                                  ? 1
                                  : 0.7,
                            }}
                          />
                        )
                      )}
                    </div>
                  )}
              </Card>

              {/* AMENITIES */}

              {Array.isArray(
                acc.amenities
              ) &&
                acc.amenities.length >
                  0 && (
                  <Card
                    className="mb-4 border-0"
                    style={{
                      borderRadius:
                        "16px",
                      boxShadow:
                        "0 4px 16px rgba(0,0,0,0.08)",
                    }}
                  >
                    <Card.Body className="p-4">
                      <h3
                        className="fw-bold mb-3"
                        style={{
                          fontFamily:
                            "Poppins, serif",
                        }}
                      >
                        Amenities
                      </h3>

                      <div className="d-flex flex-wrap gap-3">
                        {acc.amenities.map(
                          (
                            amenity: string
                          ) => (
                            <div
                              key={
                                amenity
                              }
                              className="d-flex align-items-center gap-2 px-3 py-2"
                              style={{
                                background:
                                  "#f8f9fa",
                                borderRadius:
                                  "8px",
                                fontSize:
                                  "0.9rem",
                              }}
                            >
                              <span
                                style={{
                                  fontSize:
                                    "1.3rem",
                                }}
                              >
                                {amenityIcons[
                                  amenity
                                ] ||
                                  "✔️"}
                              </span>

                              <span>
                                {
                                  amenity
                                }
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                )}
            </Col>

            {/* RIGHT SIDE */}

            <Col lg={4}>
              <Card
                className="mb-4 border-0"
                style={{
                  borderRadius:
                    "16px",
                  boxShadow:
                    "0 4px 16px rgba(0,0,0,0.08)",
                }}
              >
                <Card.Body className="p-4">
                  {/* NAME */}

                  <h2
                    className="fw-bold mb-4"
                    style={{
                      fontFamily:
                        "Poppins, serif",
                      fontSize:
                        "1.5rem",
                    }}
                  >
                    {
                      acc.name
                    }
                  </h2>

                  {/* LOCATION */}

                  <div className="mb-3">
                    <p
                      className="text-muted mb-1"
                      style={{
                        fontSize:
                          "0.85rem",
                      }}
                    >
                      📍 Location
                    </p>

                    <p
                      style={{
                        fontSize:
                          "0.95rem",
                        color:
                          "#495057",
                      }}
                    >
                      {getAddress()}
                    </p>
                  </div>

                  {/* PRICE */}

                  {(hasMinPrice ||
                    hasMaxPrice) && (
                    <div
                      className="mb-3 p-3"
                      style={{
                        background:
                          "linear-gradient(135deg, #11998e, #38ef7d)",
                        borderRadius:
                          "12px",
                        color:
                          "#fff",
                      }}
                    >
                      <p
                        className="mb-1"
                        style={{
                          fontSize:
                            "0.85rem",
                          opacity:
                            0.9,
                        }}
                      >
                        Price Range
                      </p>

                      <p
                        className="fw-bold mb-0"
                        style={{
                          fontSize:
                            "1.5rem",
                        }}
                      >
                        {hasMinPrice &&
                          `₱${Number(
                            getPriceMin()
                          ).toLocaleString()}`}

                        {hasMinPrice &&
                        hasMaxPrice
                          ? ` – ₱${Number(
                              getPriceMax()
                            ).toLocaleString()}`
                          : !hasMinPrice &&
                              hasMaxPrice
                            ? `Up to ₱${Number(
                                getPriceMax()
                              ).toLocaleString()}`
                            : "+"}

                        <span
                          style={{
                            fontSize:
                              "0.9rem",
                            fontWeight:
                              400,
                            opacity:
                              0.9,
                          }}
                        >
                          {" "}
                          /night
                        </span>
                      </p>
                    </div>
                  )}

                  {/* OWNER */}

                  {acc.owner && (
                    <div className="mb-3">
                      <p
                        className="text-muted mb-1"
                        style={{
                          fontSize:
                            "0.85rem",
                        }}
                      >
                        👤 Owner
                      </p>

                      <p
                        style={{
                          fontSize:
                            "0.95rem",
                          color:
                            "#495057",
                        }}
                      >
                        {
                          acc.owner
                        }
                      </p>
                    </div>
                  )}

                  {/* MANAGER */}

                  {acc.manager && (
                    <div className="mb-3">
                      <p
                        className="text-muted mb-1"
                        style={{
                          fontSize:
                            "0.85rem",
                        }}
                      >
                        👔 Manager
                      </p>

                      <p
                        style={{
                          fontSize:
                            "0.95rem",
                          color:
                            "#495057",
                        }}
                      >
                        {
                          acc.manager
                        }
                      </p>
                    </div>
                  )}

                  {/* CONTACT */}

                  <div className="d-flex flex-column gap-2 mt-4">
                    {getPhone() && (
                      <a
                        href={`tel:${getPhone()}`}
                        className="btn btn-primary"
                        style={{
                          borderRadius:
                            "8px",
                          padding:
                            "12px",
                        }}
                      >
                        📞 Call{" "}
                        {getPhone()}
                      </a>
                    )}

                    {getEmail() && (
                      <a
                        href={`mailto:${getEmail()}`}
                        className="btn btn-outline-primary"
                        style={{
                          borderRadius:
                            "8px",
                          padding:
                            "12px",
                        }}
                      >
                        ✉️ Email
                      </a>
                    )}

                    {getWebsite() && (
                      <a
                        href={getWebsite()}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline-primary"
                        style={{
                          borderRadius:
                            "8px",
                          padding:
                            "12px",
                        }}
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