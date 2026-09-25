
import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";

import { useHistory } from "react-router-dom";

import {
  Camera,
  Compass,
  Image as ImageIcon,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

/* =========================================================
   BRAND COLOR
========================================================= */

const CALBAYOG_BLUE = "#2D3195";

/* =========================================================
   API CONFIGURATION
========================================================= */

const API_BASE_URL =
  "https://calbayog-city-tourism.onrender.com";

/* =========================================================
   TYPES
========================================================= */

interface AttractionDetails {
  id?: string;
  name?: string;
  image?: string | null;
}

interface Memory {
  id: string;
  user_id: string;
  attraction_id: string;
  caption: string;
  image_url?: string | null;
  image_urls?: string[] | null;
  created_at: string;
  updated_at?: string;
  attraction?: AttractionDetails | null;
}

interface MemoriesResponse {
  memories?: Memory[];
  message?: string;
}

/* =========================================================
   HELPER FUNCTIONS
========================================================= */

/**
 * Returns all valid image URLs attached to a memory.
 */
const getImageUrls = (
  memory: Memory,
): string[] => {
  const imageUrls: string[] = [];

  if (Array.isArray(memory.image_urls)) {
    imageUrls.push(
      ...memory.image_urls.filter(
        (imageUrl): imageUrl is string =>
          typeof imageUrl === "string" &&
          imageUrl.trim().length > 0,
      ),
    );
  }

  if (
    typeof memory.image_url === "string" &&
    memory.image_url.trim().length > 0
  ) {
    imageUrls.push(memory.image_url);
  }

  return [...new Set(imageUrls)];
};

/**
 * Formats the memory creation date.
 */
const formatMemoryDate = (
  dateValue: string,
): string => {
  if (!dateValue) {
    return "Date unavailable";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/* =========================================================
   MEMORIES COMPONENT
========================================================= */

const Memories: React.FC = () => {
  const history = useHistory();

  const {
    user,
    userToken,
    loading: authLoading,
  } = useAuth();

  /* =======================================================
     PAGE STATE
  ======================================================= */

  const [
    memories,
    setMemories,
  ] = useState<Memory[]>([]);

  const [
    loading,
    setLoading,
  ] = useState<boolean>(true);

  const [
    error,
    setError,
  ] = useState<string>("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string>("");

  const [
    deletingMemoryId,
    setDeletingMemoryId,
  ] = useState<string | null>(null);

  const [
    selectedMemory,
    setSelectedMemory,
  ] = useState<Memory | null>(null);

  const [
    showDeleteModal,
    setShowDeleteModal,
  ] = useState<boolean>(false);

  /* =======================================================
     REQUEST HEADERS
  ======================================================= */

  const getHeaders = useCallback(
    (): HeadersInit => {
      const headers: HeadersInit = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      if (userToken) {
        headers.Authorization = `Bearer ${userToken}`;
      }

      return headers;
    },
    [userToken],
  );

  /* =======================================================
     FETCH MEMORIES
  ======================================================= */

  const fetchMemories = useCallback(
    async (): Promise<void> => {
      if (authLoading) {
        return;
      }

      if (!user || !userToken) {
        setMemories([]);
        setLoading(false);
        setError(
          "Please log in to view your memories.",
        );

        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/api/memories`,
          {
            method: "GET",
            headers: getHeaders(),
          },
        );

        let data:
          | Memory[]
          | MemoriesResponse = {};

        try {
          data = await response.json();
        } catch (jsonError) {
          console.error(
            "Failed to read memories response:",
            jsonError,
          );

          throw new Error(
            "The server returned an invalid response.",
          );
        }

        if (!response.ok) {
          const errorMessage =
            !Array.isArray(data) &&
            data.message
              ? data.message
              : response.status === 401
                ? "Your session has expired. Please log in again."
                : "Failed to load your memories.";

          throw new Error(errorMessage);
        }

        const receivedMemories: Memory[] =
          Array.isArray(data)
            ? data
            : Array.isArray(data.memories)
              ? data.memories
              : [];

        setMemories(receivedMemories);
      } catch (fetchError) {
        console.error(
          "Fetch memories error:",
          fetchError,
        );

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load your memories.",
        );
      } finally {
        setLoading(false);
      }
    },
    [
      authLoading,
      getHeaders,
      user,
      userToken,
    ],
  );

  /* =======================================================
     INITIAL FETCH
  ======================================================= */

  useEffect(() => {
    if (authLoading) {
      return;
    }

    void fetchMemories();
  }, [
    authLoading,
    fetchMemories,
  ]);

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const handleGoToAttractions = (): void => {
    history.push("/attractions");
  };

  /* =======================================================
     DELETE MODAL
  ======================================================= */

  const handleOpenDeleteModal = (
    memory: Memory,
  ): void => {
    setSelectedMemory(memory);
    setShowDeleteModal(true);
    setError("");
    setSuccessMessage("");
  };

  const handleCloseDeleteModal = (): void => {
    if (deletingMemoryId) {
      return;
    }

    setSelectedMemory(null);
    setShowDeleteModal(false);
  };

  /* =======================================================
     DELETE MEMORY
  ======================================================= */

  const handleDeleteMemory = async (): Promise<void> => {
    if (!selectedMemory?.id || !userToken) {
      setError(
        "Your session has expired. Please log in again.",
      );

      return;
    }

    try {
      setDeletingMemoryId(selectedMemory.id);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        `${API_BASE_URL}/api/memories/${encodeURIComponent(
          selectedMemory.id,
        )}`,
        {
          method: "DELETE",
          headers: getHeaders(),
        },
      );

      let data: {
        message?: string;
      } = {};

      try {
        data = await response.json();
      } catch (jsonError) {
        console.error(
          "Failed to read delete response:",
          jsonError,
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            (response.status === 401
              ? "Your session has expired. Please log in again."
              : "Failed to delete this memory."),
        );
      }

      setMemories(
        (currentMemories) =>
          currentMemories.filter(
            (memory) =>
              memory.id !== selectedMemory.id,
          ),
      );

      setSuccessMessage(
        data.message ||
          "Memory deleted successfully.",
      );

      setSelectedMemory(null);
      setShowDeleteModal(false);
    } catch (deleteError) {
      console.error(
        "Delete memory error:",
        deleteError,
      );

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete this memory.",
      );
    } finally {
      setDeletingMemoryId(null);
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      <div className="page-enter memories-page">
        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <section className="memories-header">
          <div className="memories-header-inner">
            <h1 className="memories-title">
              MY MEMORIES
            </h1>

            <p className="memories-subtitle">
              Keep your favorite moments and
              experiences from exploring
              Calbayog City.
            </p>
          </div>
        </section>

        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <Container className="memories-container">
          {/* ===============================================
              TOP ACTION ROW
          =============================================== */}

          <div className="memories-top-row">
            <div className="memories-intro">
              <div className="memories-intro-icon">
                <Camera
                  size={18}
                  strokeWidth={1.9}
                />
              </div>

              <div>
                <div className="memories-intro-label">
                  Personal collection
                </div>

                <div className="memories-intro-title">
                  Your travel moments
                </div>
              </div>
            </div>

            <Button
              className="memories-add-button"
              onClick={handleGoToAttractions}
            >
              <Plus
                size={15}
                strokeWidth={2.2}
              />

              Add Memory
            </Button>
          </div>

          {/* ===============================================
              ALERTS
          =============================================== */}

          {successMessage && (
            <Alert
              variant="success"
              dismissible
              onClose={() =>
                setSuccessMessage("")
              }
              className="memories-alert"
            >
              {successMessage}
            </Alert>
          )}

          {error && (
            <Alert
              variant="danger"
              dismissible
              onClose={() =>
                setError("")
              }
              className="memories-alert"
            >
              {error}
            </Alert>
          )}

          {/* ===============================================
              RESULTS BAR
          =============================================== */}

          {!authLoading &&
            !loading &&
            memories.length > 0 && (
              <div className="memories-results-bar">
                <div className="memories-results-left">
                  <div className="memories-results-icon">
                    <ImageIcon
                      size={17}
                      strokeWidth={1.9}
                    />
                  </div>

                  <div>
                    <div className="memories-results-label">
                      Showing
                    </div>

                    <div className="memories-results-count">
                      <strong>
                        {memories.length}
                      </strong>{" "}
                      saved moment
                      {memories.length !== 1
                        ? "s"
                        : ""}
                    </div>
                  </div>
                </div>

                <Badge className="memories-results-badge">
                  MY COLLECTION
                </Badge>
              </div>
            )}

          {/* ===============================================
              LOADING STATE
          =============================================== */}

          {authLoading || loading ? (
            <div className="memories-loading">
              <div className="loading-icon">
                <Spinner
                  animation="border"
                  size="sm"
                />
              </div>

              <div className="loading-title">
                Loading memories...
              </div>

              <p className="loading-subtitle">
                Please wait a moment.
              </p>
            </div>
          ) : memories.length === 0 ? (
            /* =============================================
               EMPTY STATE
            ============================================= */

            <div className="memories-empty-state">
              <div className="empty-icon">
                <Camera
                  size={29}
                  strokeWidth={1.6}
                />
              </div>

              <h3>
                No memories yet
              </h3>

              <p>
                Start exploring Calbayog City
                and save your favorite
                travel moments here.
              </p>

              <Button
                className="empty-button"
                onClick={handleGoToAttractions}
              >
                <Compass
                  size={15}
                  strokeWidth={1.9}
                />

                Explore attractions
              </Button>
            </div>
          ) : (
            /* =============================================
               MEMORY CARDS
            ============================================= */

            <Row className="memories-grid">
              {memories.map((memory) => {
                const imageUrls =
                  getImageUrls(memory);

                const attractionName =
                  memory.attraction?.name ||
                  "Calbayog City Attraction";

                const attractionImage =
                  memory.attraction?.image ||
                  null;

                const firstImage =
                  imageUrls[0] ||
                  attractionImage;

                return (
                  <Col
                    xs={12}
                    sm={6}
                    lg={4}
                    key={memory.id}
                    className="memory-col"
                  >
                    <Card className="memory-card h-100">
                      {/* =================================
                          CARD IMAGE
                      ================================= */}

                      {firstImage ? (
                        <div className="memory-image-wrapper">
                          <img
                            src={firstImage}
                            alt={attractionName}
                            className="memory-image"
                            onError={(event) => {
                              event.currentTarget.style.display =
                                "none";
                            }}
                          />

                          <div className="memory-image-overlay" />

                          <div className="memory-location-badge">
                            <MapPin
                              size={12}
                              strokeWidth={2}
                            />

                            <span>
                              {attractionName}
                            </span>
                          </div>

                          {imageUrls.length > 1 && (
                            <div className="memory-image-count">
                              <ImageIcon
                                size={12}
                                strokeWidth={2}
                              />

                              {imageUrls.length}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="memory-image-placeholder">
                          <Camera
                            size={30}
                            strokeWidth={1.5}
                          />

                          <span>
                            No image available
                          </span>
                        </div>
                      )}

                      {/* =================================
                          CARD CONTENT
                      ================================= */}

                      <Card.Body className="memory-card-body">
                        <div className="memory-date">
                          {formatMemoryDate(
                            memory.created_at,
                          )}
                        </div>

                        <h3 className="memory-attraction-name">
                          {attractionName}
                        </h3>

                        <p className="memory-caption">
                          {memory.caption}
                        </p>

                        <div className="memory-card-footer">
                          <div className="memory-card-type">
                            <Camera
                              size={13}
                              strokeWidth={1.8}
                            />

                            Travel memory
                          </div>

                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="memory-delete-button"
                            onClick={() =>
                              handleOpenDeleteModal(
                                memory,
                              )
                            }
                            disabled={
                              deletingMemoryId ===
                              memory.id
                            }
                          >
                            <Trash2
                              size={13}
                              strokeWidth={1.9}
                            />

                            Delete
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </Container>
      </div>

      {/* ===================================================
          DELETE CONFIRMATION MODAL
      =================================================== */}

      <Modal
        show={showDeleteModal}
        onHide={handleCloseDeleteModal}
        centered
      >
        <Modal.Header
          closeButton={!deletingMemoryId}
        >
          <Modal.Title>
            Delete Memory
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          Are you sure you want to delete this
          memory? This action cannot be undone.
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCloseDeleteModal}
            disabled={Boolean(
              deletingMemoryId,
            )}
          >
            Cancel
          </Button>

          <Button
            variant="danger"
            onClick={handleDeleteMemory}
            disabled={Boolean(
              deletingMemoryId,
            )}
          >
            {deletingMemoryId ? (
              <>
                <Spinner
                  animation="border"
                  size="sm"
                  className="me-2"
                />

                Deleting...
              </>
            ) : (
              <>
                <Trash2
                  size={14}
                  className="me-1"
                />

                Delete Memory
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===================================================
          PAGE STYLES
      =================================================== */}

      <style>{`
        @font-face {
          font-family: "Barabara";
          src: url("/fonts/BARABARA-final.otf")
            format("opentype");
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }

        /* =================================================
           PAGE
        ================================================= */

        .memories-page {
          min-height: 100vh;
          background: #ffffff;
          color: #171a18;
          padding-bottom: 60px;
        }

        /* =================================================
           HEADER
        ================================================= */

        .memories-header {
          width: 100%;
          background: #ffffff;
          padding: 30px 20px 18px;
        }

        .memories-header-inner {
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
        }

        .memories-title {
          margin: 0;
          font-family: "Barabara", sans-serif !important;
          font-size:
            clamp(
              1.65rem,
              2.8vw,
              2.4rem
            );
          font-weight: 400;
          line-height: 0.95;
          letter-spacing: 0.015em;
          color: ${CALBAYOG_BLUE};
        }

        .memories-subtitle {
          max-width: 590px;
          margin: 6px 0 0;
          font-family:
            "Nunito",
            "Poppins",
            "Segoe UI",
            sans-serif;
          font-size: 0.81rem;
          line-height: 1.55;
          font-weight: 500;
          color: #737b76;
        }

        /* =================================================
           CONTAINER
        ================================================= */

        .memories-container {
          width: 100%;
          max-width: 1240px;
          padding: 0 0 60px;
          margin: 0 auto;
        }

        /* =================================================
           TOP ACTION ROW
        ================================================= */

        .memories-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 24px;
          padding: 15px 0;
          border-top: 1px solid #f0f2f0;
          border-bottom: 1px solid #f0f2f0;
        }

        .memories-intro {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .memories-intro-icon {
          width: 35px;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          color: ${CALBAYOG_BLUE};
          background: #eef0ff;
        }

        .memories-intro-label {
          font-family: "Nunito", sans-serif;
          font-size: 0.63rem;
          line-height: 1.2;
          color: #8b938e;
        }

        .memories-intro-title {
          margin-top: 2px;
          font-family: "Poppins", sans-serif;
          font-size: 0.77rem;
          font-weight: 700;
          color: #252b27;
        }

        .memories-add-button {
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: none !important;
          border-radius: 999px !important;
          padding: 9px 16px !important;
          background: ${CALBAYOG_BLUE} !important;
          color: #ffffff !important;
          font-family: "Nunito", sans-serif;
          font-size: 0.72rem !important;
          font-weight: 800 !important;
          box-shadow: 0 5px 15px rgba(45, 49, 149, 0.13);
          transition:
            background 0.2s ease,
            box-shadow 0.2s ease;
        }

        .memories-add-button:hover,
        .memories-add-button:focus {
          background: #242778 !important;
          color: #ffffff !important;
          box-shadow: 0 7px 19px rgba(45, 49, 149, 0.2);
        }

        /* =================================================
           ALERTS
        ================================================= */

        .memories-alert {
          border-radius: 12px;
          font-family: "Nunito", sans-serif;
          font-size: 0.78rem;
        }

        /* =================================================
           RESULTS BAR
        ================================================= */

        .memories-results-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          flex-wrap: wrap;
          margin-bottom: 27px;
          padding: 11px 2px;
          border-top: 1px solid #f0f2f0;
          border-bottom: 1px solid #f0f2f0;
        }

        .memories-results-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .memories-results-icon {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          color: ${CALBAYOG_BLUE};
          background: #eef0ff;
        }

        .memories-results-label {
          font-family: "Nunito", sans-serif;
          font-size: 0.64rem;
          color: #8b938e;
          line-height: 1.2;
        }

        .memories-results-count {
          margin-top: 2px;
          font-family: "Poppins", sans-serif;
          font-size: 0.74rem;
          font-weight: 700;
          color: #252b27;
        }

        .memories-results-badge {
          padding: 7px 11px;
          border: 1px solid #e2e4fa;
          border-radius: 999px;
          background: #f1f2ff;
          color: ${CALBAYOG_BLUE};
          font-family: "Nunito", sans-serif;
          font-size: 0.6rem;
          font-weight: 800;
          letter-spacing: 0.06em;
        }

        /* =================================================
           GRID
        ================================================= */

        .memories-grid {
          row-gap: 36px !important;
          margin-left: -12px;
          margin-right: -12px;
        }

        .memory-col {
          display: flex;
          padding-left: 12px;
          padding-right: 12px;
        }

        /* =================================================
           LOADING
        ================================================= */

        .memories-loading {
          min-height: 360px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 0;
        }

        .loading-icon {
          width: 58px;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 13px;
          border-radius: 17px;
          background: #eef0ff;
        }

        .loading-icon .spinner-border {
          color: ${CALBAYOG_BLUE};
        }

        .loading-title {
          font-family: "Poppins", sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          color: #202521;
        }

        .loading-subtitle {
          margin: 4px 0 0;
          color: #89918c;
          font-family: "Nunito", sans-serif;
          font-size: 0.72rem;
        }

        /* =================================================
           EMPTY STATE
        ================================================= */

        .memories-empty-state {
          padding: 65px 20px;
          border: 1px solid #edf1ee;
          border-radius: 20px;
          background: #fafcfb;
          text-align: center;
        }

        .empty-icon {
          width: 68px;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 15px;
          border-radius: 20px;
          color: ${CALBAYOG_BLUE};
          background: #eef0ff;
        }

        .memories-empty-state h3 {
          margin: 0 0 7px;
          color: #202521;
          font-family: "Poppins", sans-serif;
          font-size: 1rem;
          font-weight: 700;
        }

        .memories-empty-state p {
          max-width: 380px;
          margin: 0 auto 18px;
          color: #7e8781;
          font-family: "Nunito", sans-serif;
          font-size: 0.77rem;
          line-height: 1.55;
        }

        .empty-button {
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: 1px solid ${CALBAYOG_BLUE} !important;
          border-radius: 999px !important;
          padding: 8px 16px !important;
          background: transparent !important;
          color: ${CALBAYOG_BLUE} !important;
          font-family: "Nunito", sans-serif;
          font-size: 0.73rem !important;
          font-weight: 800 !important;
        }

        .empty-button:hover,
        .empty-button:focus {
          background: #eef0ff !important;
          color: ${CALBAYOG_BLUE} !important;
        }

        /* =================================================
           MEMORY CARD
        ================================================= */

        .memory-card {
          width: 100%;
          overflow: hidden;
          border: 1px solid #e9edea;
          border-radius: 17px;
          background: #ffffff;
          box-shadow: 0 7px 22px rgba(30, 45, 35, 0.045);
          transition:
            transform 0.22s ease,
            box-shadow 0.22s ease;
        }

        .memory-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 13px 30px rgba(30, 45, 35, 0.09);
        }

        /* =================================================
           MEMORY IMAGE
        ================================================= */

        .memory-image-wrapper {
          position: relative;
          height: 220px;
          overflow: hidden;
          background: #eef1f4;
        }

        .memory-image {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .memory-image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(15, 20, 30, 0.58),
            rgba(15, 20, 30, 0.02) 55%
          );
          pointer-events: none;
        }

        .memory-location-badge {
          position: absolute;
          left: 13px;
          right: 13px;
          bottom: 13px;
          display: flex;
          align-items: center;
          gap: 5px;
          min-width: 0;
          color: #ffffff;
          font-family: "Nunito", sans-serif;
          font-size: 0.68rem;
          font-weight: 800;
        }

        .memory-location-badge span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .memory-image-count {
          position: absolute;
          top: 12px;
          right: 12px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 9px;
          border-radius: 999px;
          background: rgba(25, 28, 45, 0.72);
          color: #ffffff;
          font-family: "Nunito", sans-serif;
          font-size: 0.68rem;
          font-weight: 800;
        }

        .memory-image-placeholder {
          height: 220px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 9px;
          background: #f1f3ff;
          color: #9297bd;
          font-family: "Nunito", sans-serif;
          font-size: 0.73rem;
        }

        /* =================================================
           CARD BODY
        ================================================= */

        .memory-card-body {
          display: flex;
          flex-direction: column;
          padding: 18px !important;
        }

        .memory-date {
          margin-bottom: 7px;
          color: #969e99;
          font-family: "Nunito", sans-serif;
          font-size: 0.67rem;
          font-weight: 700;
        }

        .memory-attraction-name {
          display: -webkit-box;
          overflow: hidden;
          margin: 0 0 9px;
          color: #252b27;
          font-family: "Poppins", sans-serif;
          font-size: 0.98rem;
          font-weight: 700;
          line-height: 1.4;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }

        .memory-caption {
          display: -webkit-box;
          overflow: hidden;
          min-height: 67px;
          margin: 0 0 18px;
          color: #7a837d;
          font-family: "Nunito", sans-serif;
          font-size: 0.76rem;
          font-weight: 500;
          line-height: 1.65;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 4;
        }

        /* =================================================
           CARD FOOTER
        ================================================= */

        .memory-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-top: auto;
          padding-top: 13px;
          border-top: 1px solid #f0f2f0;
        }

        .memory-card-type {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #929a94;
          font-family: "Nunito", sans-serif;
          font-size: 0.65rem;
          font-weight: 700;
        }

        .memory-delete-button {
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          gap: 5px;
          border-radius: 999px !important;
          padding: 5px 10px !important;
          font-family: "Nunito", sans-serif;
          font-size: 0.65rem !important;
          font-weight: 800 !important;
        }

        /* =================================================
           MODAL
        ================================================= */

        .modal-content {
          border: none;
          border-radius: 18px;
          overflow: hidden;
        }

        .modal-title {
          font-family: "Poppins", sans-serif;
          font-size: 1rem;
          font-weight: 700;
        }

        .modal-body {
          color: #68736d;
          font-family: "Nunito", sans-serif;
          font-size: 0.85rem;
          line-height: 1.65;
        }

        .modal-footer .btn {
          border-radius: 999px;
          font-family: "Nunito", sans-serif;
          font-size: 0.75rem;
          font-weight: 800;
        }

        /* =================================================
           TABLET
        ================================================= */

        @media (max-width: 991.98px) {
          .memories-header {
            padding: 28px 20px 18px;
          }

          .memories-title {
            font-size:
              clamp(
                1.65rem,
                4.5vw,
                2.25rem
              );
          }

          .memories-grid {
            row-gap: 32px !important;
          }
        }

        /* =================================================
           MOBILE
        ================================================= */

        @media (max-width: 767.98px) {
          .memories-header {
            padding:
              25px 17px 16px;
          }

          .memories-title {
            font-size: 1.9rem;
          }

          .memories-subtitle {
            margin-top: 6px;
            font-size: 0.78rem;
          }

          .memories-container {
            padding-top: 0;
            padding-left: 17px;
            padding-right: 17px;
          }

          .memories-top-row {
            align-items: flex-start;
            flex-direction: column;
            gap: 14px;
            padding: 15px 0;
          }

          .memories-add-button {
            width: 100%;
          }

          .memories-results-bar {
            align-items: flex-start;
          }

          .memories-results-badge {
            align-self: center;
          }

          .memories-grid {
            row-gap: 28px !important;
          }

          .memory-image-wrapper,
          .memory-image-placeholder {
            height: 215px;
          }
        }

        /* =================================================
           SMALL MOBILE
        ================================================= */

        @media (max-width: 479.98px) {
          .memories-title {
            font-size: 1.8rem;
          }

          .memories-subtitle {
            font-size: 0.77rem;
          }

          .memory-card-footer {
            align-items: flex-start;
            flex-direction: column;
          }

          .memory-delete-button {
            align-self: flex-end;
          }
        }
      `}</style>
    </>
  );
};

export default Memories;
