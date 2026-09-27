import React, {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";

import {
  Check,
  Clock3,
  Eye,
  Film,
  FileVideo,
  Info,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";

import {
  getFeaturedVideos,
  uploadFeaturedVideo,
  deleteFeaturedVideo,
} from "../../services/api";

import { useDarkMode } from "../../context/DarkModeContext";

import type { FeaturedVideo } from "../../services/api";

/* =========================================================
   CONSTANTS
========================================================= */

const CALBAYOG_BLUE = "#2D3195";
const ADMIN_YELLOW = "#FFB71B";
const MAX_VIDEO_SIZE = 200 * 1024 * 1024;
const ACCEPTED_VIDEO_TYPE = "video/mp4";

/* =========================================================
   HELPERS
========================================================= */

const formatFileSize = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 MB";
  }

  const megabytes = bytes / (1024 * 1024);

  if (megabytes < 1) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)} MB`;
};

const formatDate = (dateValue?: string | null): string => {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateTime = (dateValue?: string | null): string => {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

/* =========================================================
   PAGE
========================================================= */

const AdminFeaturedVideos: React.FC = () => {
  const { isDarkMode } = useDarkMode();

  /* =========================================================
     DATA STATE
  ========================================================= */

  const [videos, setVideos] = useState<FeaturedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* =========================================================
     MODAL STATE
  ========================================================= */

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedVideo, setSelectedVideo] =
    useState<FeaturedVideo | null>(null);

  /* =========================================================
     UPLOAD STATE
  ========================================================= */

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");

  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* =========================================================
     MESSAGE STATE
  ========================================================= */

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* =========================================================
     FETCH FEATURED VIDEOS
  ========================================================= */

  const fetchVideos = useCallback(
    async (showRefreshSpinner = false) => {
      try {
        if (showRefreshSpinner) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMessage("");

        const response = await getFeaturedVideos();

        const data = Array.isArray(response?.data)
          ? response.data
          : [];

        setVideos(data);
      } catch (error: any) {
        console.error(
          "Failed to fetch featured videos:",
          error,
        );

        setVideos([]);

        setErrorMessage(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to load featured videos.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    void fetchVideos();
  }, [fetchVideos]);

  /* =========================================================
     SORT VIDEOS
  ========================================================= */

  const sortedVideos = useMemo(() => {
    return [...videos].sort((a, b) => {
      const dateA = new Date(
        a.created_at || "",
      ).getTime();

      const dateB = new Date(
        b.created_at || "",
      ).getTime();

      return dateB - dateA;
    });
  }, [videos]);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const latestVideo = sortedVideos[0] || null;

  const videoCount = sortedVideos.length;

  const latestUploadDate = latestVideo
    ? formatDate(latestVideo.created_at)
    : "—";

  /* =========================================================
     OPEN UPLOAD MODAL
  ========================================================= */

  const openUploadModal = () => {
    setErrorMessage("");
    setSuccessMessage("");

    setVideoFile(null);
    setVideoTitle("");
    setVideoDescription("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setShowUploadModal(true);
  };

  /* =========================================================
     CLOSE UPLOAD MODAL
  ========================================================= */

  const closeUploadModal = () => {
    if (uploading) {
      return;
    }

    setShowUploadModal(false);
  };

  /* =========================================================
     FILE SELECTION
  ========================================================= */

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    setErrorMessage("");

    const file =
      event.target.files?.[0] || null;

    if (!file) {
      setVideoFile(null);
      return;
    }

    if (
      file.type !== ACCEPTED_VIDEO_TYPE &&
      !file.name.toLowerCase().endsWith(".mp4")
    ) {
      setVideoFile(null);

      event.target.value = "";

      setErrorMessage(
        "Only MP4 video files are allowed.",
      );

      return;
    }

    if (file.size > MAX_VIDEO_SIZE) {
      setVideoFile(null);

      event.target.value = "";

      setErrorMessage(
        "The video file must be 200 MB or smaller.",
      );

      return;
    }

    setVideoFile(file);

    if (!videoTitle.trim()) {
      const filenameWithoutExtension =
        file.name.replace(/\.mp4$/i, "");

      setVideoTitle(filenameWithoutExtension);
    }
  };

  /* =========================================================
     UPLOAD
  ========================================================= */

  const handleUpload = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!videoFile) {
      setErrorMessage(
        "Please select an MP4 video file.",
      );
      return;
    }

    if (!videoTitle.trim()) {
      setErrorMessage(
        "Please enter a title for the featured video.",
      );
      return;
    }

    if (videoFile.size > MAX_VIDEO_SIZE) {
      setErrorMessage(
        "The video file must be 200 MB or smaller.",
      );
      return;
    }

    setUploading(true);

    try {
      await uploadFeaturedVideo(
        videoFile,
        videoTitle.trim(),
        videoDescription.trim(),
      );

      setShowUploadModal(false);

      setVideoFile(null);
      setVideoTitle("");
      setVideoDescription("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setSuccessMessage(
        "Featured video uploaded successfully.",
      );

      await fetchVideos(true);
    } catch (error: any) {
      console.error(
        "Failed to upload featured video:",
        error,
      );

      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to upload featured video.",
      );
    } finally {
      setUploading(false);
    }
  };

  /* =========================================================
     OPEN PREVIEW
  ========================================================= */

  const openPreview = (
    video: FeaturedVideo,
  ) => {
    setSelectedVideo(video);
    setShowPreviewModal(true);
  };

  /* =========================================================
     OPEN DELETE
  ========================================================= */

  const openDeleteModal = (
    video: FeaturedVideo,
  ) => {
    setErrorMessage("");
    setSuccessMessage("");

    setSelectedVideo(video);
    setShowDeleteModal(true);
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = async () => {
    if (!selectedVideo?.id) {
      return;
    }

    setDeleting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await deleteFeaturedVideo(
        selectedVideo.id,
      );

      setShowDeleteModal(false);
      setShowPreviewModal(false);

      setSuccessMessage(
        "Featured video deleted successfully.",
      );

      setSelectedVideo(null);

      await fetchVideos(true);
    } catch (error: any) {
      console.error(
        "Failed to delete featured video:",
        error,
      );

      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to delete featured video.",
      );
    } finally {
      setDeleting(false);
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <AdminLayout>
      <div
        className={`admin-featured-videos-page ${
          isDarkMode
            ? "admin-featured-videos-dark"
            : ""
        }`}
      >
        <style>
          {ADMIN_FEATURED_VIDEOS_STYLES}
        </style>

        {/* ===================================================
            PAGE HEADER
        =================================================== */}

        <div className="admin-featured-videos-heading">
          <div>
            <div className="admin-featured-videos-eyebrow">
              CONTENT MANAGEMENT
            </div>

            <h1 className="admin-featured-videos-title">
              Featured Videos
            </h1>

            <p className="admin-featured-videos-subtitle">
              Manage the videos displayed in the
              Featured Videos section of the
              Calbayog City Tourism homepage.
            </p>
          </div>

          <Button
            className="admin-featured-videos-add-button"
            onClick={openUploadModal}
          >
            <Plus
              size={17}
              strokeWidth={2.4}
            />

            Upload Featured Video
          </Button>
        </div>

        {/* ===================================================
            GLOBAL SUCCESS / ERROR
        =================================================== */}

        {successMessage && (
          <Alert
            variant="success"
            className="admin-featured-videos-alert"
            dismissible
            onClose={() =>
              setSuccessMessage("")
            }
          >
            <Check
              size={16}
              strokeWidth={2.4}
            />

            <span>{successMessage}</span>
          </Alert>
        )}

        {errorMessage &&
          !showUploadModal &&
          !showDeleteModal && (
            <Alert
              variant="danger"
              className="admin-featured-videos-alert"
              dismissible
              onClose={() =>
                setErrorMessage("")
              }
            >
              <Info
                size={16}
                strokeWidth={2.2}
              />

              <span>{errorMessage}</span>
            </Alert>
          )}

        {/* ===================================================
            STAT CARDS
        =================================================== */}

        <Row className="admin-featured-videos-stats g-3">
          <Col
            xs={12}
            sm={6}
            lg={4}
          >
            <Card className="admin-video-stat-card">
              <Card.Body>
                <div className="admin-video-stat-top">
                  <span className="admin-video-stat-icon admin-video-stat-icon-blue">
                    <Film
                      size={17}
                      strokeWidth={2.1}
                    />
                  </span>

                  <span className="admin-video-stat-label">
                    Total Videos
                  </span>
                </div>

                <div className="admin-video-stat-value">
                  {videoCount}
                </div>

                <div className="admin-video-stat-caption">
                  Featured video records
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col
            xs={12}
            sm={6}
            lg={4}
          >
            <Card className="admin-video-stat-card">
              <Card.Body>
                <div className="admin-video-stat-top">
                  <span className="admin-video-stat-icon admin-video-stat-icon-yellow">
                    <Video
                      size={17}
                      strokeWidth={2.1}
                    />
                  </span>

                  <span className="admin-video-stat-label">
                    Homepage Ready
                  </span>
                </div>

                <div className="admin-video-stat-value">
                  {videoCount}
                </div>

                <div className="admin-video-stat-caption">
                  Videos available for the homepage
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col
            xs={12}
            lg={4}
          >
            <Card className="admin-video-stat-card">
              <Card.Body>
                <div className="admin-video-stat-top">
                  <span className="admin-video-stat-icon admin-video-stat-icon-purple">
                    <Clock3
                      size={17}
                      strokeWidth={2.1}
                    />
                  </span>

                  <span className="admin-video-stat-label">
                    Latest Upload
                  </span>
                </div>

                <div className="admin-video-stat-value admin-video-stat-value-date">
                  {latestUploadDate}
                </div>

                <div className="admin-video-stat-caption">
                  Most recently added video
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* ===================================================
            TOOLBAR
        =================================================== */}

        <Card className="admin-featured-videos-toolbar">
          <Card.Body>
            <div className="admin-featured-videos-toolbar-heading">
              <span className="admin-video-toolbar-icon">
                <SlidersIcon />
              </span>

              <div>
                <div className="admin-featured-videos-toolbar-title">
                  Featured Video Library
                </div>

                <div className="admin-featured-videos-toolbar-caption">
                  Upload and manage homepage video content
                </div>
              </div>

              <div className="admin-video-toolbar-actions">
                <span className="admin-video-count-pill">
                  {videoCount}{" "}
                  {videoCount === 1
                    ? "video"
                    : "videos"}
                </span>

                <Button
                  variant="link"
                  className="admin-video-refresh-button"
                  onClick={() =>
                    void fetchVideos(true)
                  }
                  disabled={refreshing}
                  title="Refresh videos"
                >
                  <RefreshCw
                    size={15}
                    className={
                      refreshing
                        ? "admin-video-spin"
                        : ""
                    }
                  />

                  Refresh
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* ===================================================
            LOADING
        =================================================== */}

        {loading ? (
          <div className="admin-featured-videos-loading">
            <div className="admin-video-loading-icon">
              <Spinner
                animation="border"
                size="sm"
              />
            </div>

            <div className="admin-video-loading-title">
              Loading featured videos...
            </div>

            <p className="admin-video-loading-subtitle">
              Please wait a moment.
            </p>
          </div>
        ) : sortedVideos.length === 0 ? (
          /* =================================================
             EMPTY STATE
          ================================================= */

          <div className="admin-featured-videos-empty">
            <div className="admin-video-empty-icon">
              <Film
                size={30}
                strokeWidth={1.6}
              />
            </div>

            <h3 className="admin-video-empty-title">
              No featured videos yet
            </h3>

            <p className="admin-video-empty-text">
              Upload a video to start building
              the Featured Videos section of
              the homepage.
            </p>

            <Button
              variant="outline-primary"
              className="admin-video-empty-button"
              onClick={openUploadModal}
            >
              <Plus
                size={15}
                strokeWidth={2}
              />

              Upload your first video
            </Button>
          </div>
        ) : (
          /* =================================================
             VIDEO GRID
          ================================================= */

          <Row className="admin-featured-videos-grid g-4">
            {sortedVideos.map((video) => (
              <Col
                xs={12}
                sm={6}
                lg={4}
                key={video.id}
                className="admin-featured-video-col"
              >
                <Card className="admin-featured-video-card">
                  {/* VIDEO PREVIEW */}

                  <div className="admin-featured-video-preview">
                    <video
                      className="admin-featured-video-player"
                      src={video.video_url}
                      muted
                      playsInline
                      preload="metadata"
                      controls
                    />

                    <div className="admin-featured-video-overlay">
                      <span className="admin-featured-video-badge">
                        <Film
                          size={12}
                          strokeWidth={2}
                        />

                        Featured
                      </span>
                    </div>
                  </div>

                  {/* CARD BODY */}

                  <Card.Body>
                    <div className="admin-featured-video-badge-row">
                      <Badge className="admin-featured-video-type-badge">
                        MP4
                      </Badge>

                      <Badge className="admin-featured-video-status-badge">
                        Active
                      </Badge>
                    </div>

                    <h3 className="admin-featured-video-name">
                      {video.title}
                    </h3>

                    <p className="admin-featured-video-description">
                      {video.description?.trim()
                        ? video.description
                        : "No description provided for this featured video."}
                    </p>

                    <div className="admin-featured-video-meta">
                      <div>
                        <Clock3
                          size={13}
                          strokeWidth={2}
                        />

                        <span>
                          Added{" "}
                          {formatDate(
                            video.created_at,
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="admin-featured-video-actions">
                      <Button
                        variant="outline-primary"
                        className="admin-video-view-button"
                        onClick={() =>
                          openPreview(video)
                        }
                      >
                        <Eye
                          size={14}
                          strokeWidth={2}
                        />

                        Preview
                      </Button>

                      <Button
                        variant="outline-danger"
                        className="admin-video-delete-button"
                        onClick={() =>
                          openDeleteModal(video)
                        }
                        title="Delete video"
                      >
                        <Trash2
                          size={15}
                          strokeWidth={2}
                        />
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* ===================================================
            UPLOAD MODAL
        =================================================== */}

        <Modal
          show={showUploadModal}
          onHide={closeUploadModal}
          centered
          size="lg"
          className="admin-featured-videos-modal"
          backdrop="static"
        >
          <Form onSubmit={handleUpload}>
            <Modal.Header closeButton>
              <Modal.Title className="admin-modal-title">
                <span className="admin-modal-title-icon">
                  <Upload
                    size={17}
                    strokeWidth={2.2}
                  />
                </span>

                Upload Featured Video
              </Modal.Title>
            </Modal.Header>

            <Modal.Body>
              {errorMessage && (
                <Alert
                  variant="danger"
                  className="admin-featured-videos-alert"
                  dismissible
                  onClose={() =>
                    setErrorMessage("")
                  }
                >
                  <Info
                    size={16}
                    strokeWidth={2.2}
                  />

                  <span>
                    {errorMessage}
                  </span>
                </Alert>
              )}

              {/* INTRO */}

              <div className="admin-video-form-intro">
                <span className="admin-video-form-intro-icon">
                  <FileVideo
                    size={17}
                    strokeWidth={2}
                  />
                </span>

                <div>
                  <strong>
                    Add a homepage featured video
                  </strong>

                  <span>
                    Upload an MP4 video up to
                    200 MB.
                  </span>
                </div>
              </div>

              {/* VIDEO FILE */}

              <Form.Group className="mb-3">
                <Form.Label>
                  Video File
                </Form.Label>

                <Form.Control
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,.mp4"
                  onChange={handleFileChange}
                  disabled={uploading}
                />

                <Form.Text>
                  MP4 only · Maximum file size:
                  200 MB
                </Form.Text>
              </Form.Group>

              {/* SELECTED FILE */}

              {videoFile && (
                <div className="admin-selected-video-file">
                  <div className="admin-selected-video-file-icon">
                    <FileVideo
                      size={17}
                      strokeWidth={2}
                    />
                  </div>

                  <div className="admin-selected-video-file-info">
                    <strong>
                      {videoFile.name}
                    </strong>

                    <span>
                      {formatFileSize(
                        videoFile.size,
                      )}
                    </span>
                  </div>

                  <Check
                    size={17}
                    strokeWidth={2.3}
                    className="admin-selected-video-check"
                  />
                </div>
              )}

              {/* TITLE */}

              <Form.Group className="mb-3">
                <Form.Label>
                  Video Title
                </Form.Label>

                <Form.Control
                  type="text"
                  value={videoTitle}
                  onChange={(event) =>
                    setVideoTitle(
                      event.target.value,
                    )
                  }
                  placeholder="e.g. Discover Calbayog City"
                  disabled={uploading}
                  maxLength={150}
                />
              </Form.Group>

              {/* DESCRIPTION */}

              <Form.Group className="mb-2">
                <Form.Label>
                  Description
                  <span className="admin-form-optional">
                    Optional
                  </span>
                </Form.Label>

                <Form.Control
                  as="textarea"
                  rows={4}
                  value={videoDescription}
                  onChange={(event) =>
                    setVideoDescription(
                      event.target.value,
                    )
                  }
                  placeholder="Add a short description for this featured video..."
                  disabled={uploading}
                  maxLength={500}
                />
              </Form.Group>

              <div className="admin-video-form-note">
                <Info
                  size={13}
                  strokeWidth={2}
                />

                <span>
                  This video will be available
                  to the homepage Featured Videos
                  section after upload.
                </span>
              </div>
            </Modal.Body>

            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={closeUploadModal}
                disabled={uploading}
              >
                Cancel
              </Button>

              <Button
                variant="primary"
                type="submit"
                disabled={
                  uploading ||
                  !videoFile ||
                  !videoTitle.trim()
                }
              >
                {uploading ? (
                  <>
                    <Spinner
                      animation="border"
                      size="sm"
                    />

                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload
                      size={15}
                      strokeWidth={2.2}
                    />

                    Upload Video
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* ===================================================
            PREVIEW MODAL
        =================================================== */}

        <Modal
          show={showPreviewModal}
          onHide={() =>
            setShowPreviewModal(false)
          }
          centered
          size="xl"
          className="admin-featured-videos-modal"
        >
          <Modal.Header closeButton>
            <Modal.Title className="admin-modal-title">
              <span className="admin-modal-title-icon">
                <Eye
                  size={17}
                  strokeWidth={2.2}
                />
              </span>

              Featured Video Preview
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {selectedVideo && (
              <>
                <div className="admin-featured-preview-player-shell">
                  <video
                    className="admin-featured-preview-player"
                    src={
                      selectedVideo.video_url
                    }
                    controls
                    autoPlay
                    playsInline
                  />
                </div>

                <div className="admin-featured-preview-information">
                  <div className="admin-featured-preview-heading">
                    <div>
                      <div className="admin-featured-preview-kicker">
                        FEATURED VIDEO
                      </div>

                      <h3>
                        {selectedVideo.title}
                      </h3>
                    </div>

                    <Badge className="admin-featured-preview-badge">
                      Active
                    </Badge>
                  </div>

                  <div className="admin-featured-preview-description">
                    {selectedVideo.description?.trim()
                      ? selectedVideo.description
                      : "No description provided for this featured video."}
                  </div>

                  <div className="admin-featured-preview-details">
                    <div className="admin-featured-preview-detail">
                      <Clock3
                        size={15}
                        strokeWidth={2}
                      />

                      <div>
                        <span>
                          Uploaded
                        </span>

                        <strong>
                          {formatDateTime(
                            selectedVideo.created_at,
                          )}
                        </strong>
                      </div>
                    </div>

                    <div className="admin-featured-preview-detail">
                      <FileVideo
                        size={15}
                        strokeWidth={2}
                      />

                      <div>
                        <span>
                          Format
                        </span>

                        <strong>
                          MP4 Video
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() =>
                setShowPreviewModal(false)
              }
            >
              Close
            </Button>

            {selectedVideo && (
              <Button
                variant="outline-danger"
                className="admin-preview-delete-button"
                onClick={() =>
                  openDeleteModal(
                    selectedVideo,
                  )
                }
              >
                <Trash2
                  size={15}
                  strokeWidth={2}
                />

                Delete Video
              </Button>
            )}
          </Modal.Footer>
        </Modal>

        {/* ===================================================
            DELETE MODAL
        =================================================== */}

        <Modal
          show={showDeleteModal}
          onHide={() => {
            if (!deleting) {
              setShowDeleteModal(false);
            }
          }}
          centered
          className="admin-featured-videos-modal"
        >
          <Modal.Header closeButton>
            <Modal.Title className="admin-modal-title">
              <span className="admin-modal-title-icon admin-modal-title-icon-danger">
                <Trash2
                  size={17}
                  strokeWidth={2.2}
                />
              </span>

              Delete Featured Video
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {errorMessage && (
              <Alert
                variant="danger"
                className="admin-featured-videos-alert"
                dismissible
                onClose={() =>
                  setErrorMessage("")
                }
              >
                <Info
                  size={16}
                  strokeWidth={2.2}
                />

                <span>
                  {errorMessage}
                </span>
              </Alert>
            )}

            <div className="admin-delete-confirmation">
              <div className="admin-delete-confirmation-icon">
                <Trash2
                  size={23}
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <h4>
                  Delete this video?
                </h4>

                <p>
                  This will permanently remove
                  the featured video from the
                  library and its stored video
                  file.
                </p>

                {selectedVideo && (
                  <div className="admin-delete-video-name">
                    “{selectedVideo.title}”
                  </div>
                )}
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() =>
                setShowDeleteModal(false)
              }
              disabled={deleting}
            >
              Cancel
            </Button>

            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleting}
              className="admin-confirm-delete-button"
            >
              {deleting ? (
                <>
                  <Spinner
                    animation="border"
                    size="sm"
                  />

                  Deleting...
                </>
              ) : (
                <>
                  <Trash2
                    size={15}
                    strokeWidth={2}
                  />

                  Delete Video
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </AdminLayout>
  );
};

/* =========================================================
   SMALL INLINE ICON
========================================================= */

const SlidersIcon: React.FC = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line
      x1="4"
      y1="21"
      x2="4"
      y2="14"
    />
    <line
      x1="4"
      y1="10"
      x2="4"
      y2="3"
    />
    <line
      x1="12"
      y1="21"
      x2="12"
      y2="12"
    />
    <line
      x1="12"
      y1="8"
      x2="12"
      y2="3"
    />
    <line
      x1="20"
      y1="21"
      x2="20"
      y2="16"
    />
    <line
      x1="20"
      y1="12"
      x2="20"
      y2="3"
    />
    <line
      x1="1"
      y1="14"
      x2="7"
      y2="14"
    />
    <line
      x1="9"
      y1="8"
      x2="15"
      y2="8"
    />
    <line
      x1="17"
      y1="16"
      x2="23"
      y2="16"
    />
  </svg>
);

/* =========================================================
   STYLES
========================================================= */

const ADMIN_FEATURED_VIDEOS_STYLES = `
  @font-face {
    font-family: "Barabara";
    src: url("/fonts/BARABARA-final.otf") format("opentype");
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  .admin-featured-videos-page {
    --admin-primary: #2D3195;
    --admin-primary-dark: #242879;
    --admin-yellow: #FFB71B;
    --admin-surface: #FFFFFF;
    --admin-border: #E8EAF1;
    --admin-text: #1B1D24;
    --admin-muted: #737886;

    min-height: 100vh;
    width: 100%;
    padding: 0 0 56px;
    background: transparent;
    color: var(--admin-text);
    font-family:
      "Nunito",
      "Poppins",
      "Segoe UI",
      sans-serif;
  }

  .admin-featured-videos-page *,
  .admin-featured-videos-page *::before,
  .admin-featured-videos-page *::after {
    box-sizing: border-box;
  }

  /* =====================================================
     HEADER
  ===================================================== */

  .admin-featured-videos-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 22px;
    margin: 0 0 26px;
    padding-bottom: 6px;
  }

  .admin-featured-videos-eyebrow {
    margin-bottom: 5px;
    color: var(--admin-primary);
    font-family: "Nunito", sans-serif;
    font-size: 0.66rem;
    font-weight: 900;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .admin-featured-videos-title {
    margin: 0 !important;
    color: var(--admin-primary) !important;
    font-family: "Barabara", sans-serif !important;
    font-size: clamp(1.65rem, 2.8vw, 2.4rem) !important;
    font-weight: 400 !important;
    line-height: 0.95 !important;
    letter-spacing: 0.02em;
  }

  .admin-featured-videos-subtitle {
    max-width: 780px;
    margin: 8px 0 0 !important;
    color: var(--admin-muted) !important;
    font-family: "Nunito", sans-serif !important;
    font-size: 0.80rem !important;
    font-weight: 600 !important;
    line-height: 1.55 !important;
  }

  .admin-featured-videos-add-button {
    flex: 0 0 auto;
    min-height: 46px;
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 11px 19px !important;
    border: 0 !important;
    border-radius: 13px !important;
    background: var(--admin-primary) !important;
    color: #fff !important;
    box-shadow: 0 10px 24px rgba(45, 49, 149, 0.20);
    font-family: "Nunito", sans-serif !important;
    font-size: 0.76rem !important;
    font-weight: 900 !important;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease,
      background 0.2s ease;
  }

  .admin-featured-videos-add-button:hover,
  .admin-featured-videos-add-button:focus {
    background: var(--admin-primary-dark) !important;
    transform: translateY(-2px);
    box-shadow: 0 14px 28px rgba(45, 49, 149, 0.24);
  }

  /* =====================================================
     ALERT
  ===================================================== */

  .admin-featured-videos-alert {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 0 !important;
    border-radius: 13px !important;
    margin-bottom: 18px;
    font-family: "Nunito", sans-serif;
    font-size: 0.72rem;
    font-weight: 700;
  }

  /* =====================================================
     STAT CARDS
  ===================================================== */

  .admin-featured-videos-stats {
    margin-bottom: 24px !important;
  }

  .admin-video-stat-card {
    position: relative;
    min-height: 132px;
    overflow: hidden;
    border: 1px solid var(--admin-border) !important;
    border-radius: 18px !important;
    background: var(--admin-surface) !important;
    color: var(--admin-text) !important;
    box-shadow: 0 7px 24px rgba(26, 30, 53, 0.055);
    transition:
      transform 0.25s ease,
      box-shadow 0.25s ease,
      border-color 0.25s ease;
  }

  .admin-video-stat-card::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: var(--admin-primary);
  }

  .admin-video-stat-card:nth-child(2)::before {
    background: var(--admin-yellow);
  }

  .admin-video-stat-card:hover {
    transform: translateY(-3px);
    border-color: rgba(45, 49, 149, 0.16) !important;
    box-shadow: 0 14px 32px rgba(26, 30, 53, 0.10);
  }

  .admin-video-stat-card .card-body {
    padding: 17px 18px 16px !important;
  }

  .admin-video-stat-top {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .admin-video-stat-icon {
    width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    flex: 0 0 auto;
  }

  .admin-video-stat-icon-blue {
    color: #2D3195;
    background: #eef0ff;
  }

  .admin-video-stat-icon-yellow {
    color: #9a6900;
    background: #fff5d9;
  }

  .admin-video-stat-icon-purple {
    color: #5f62b7;
    background: #f0efff;
  }

  .admin-video-stat-label {
    color: var(--admin-muted);
    font-size: 0.66rem;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .admin-video-stat-value {
    margin-top: 11px;
    color: var(--admin-text);
    font-family: "Poppins", sans-serif;
    font-size: 1.95rem;
    font-weight: 800;
    line-height: 1;
  }

  .admin-video-stat-value-date {
    font-size: 1.45rem;
  }

  .admin-video-stat-caption {
    margin-top: 8px;
    color: var(--admin-muted);
    font-size: 0.62rem;
    font-weight: 600;
  }

  /* =====================================================
     TOOLBAR
  ===================================================== */

  .admin-featured-videos-toolbar {
    margin-bottom: 24px;
    border: 1px solid var(--admin-border) !important;
    border-radius: 18px !important;
    background: var(--admin-surface) !important;
    box-shadow: 0 8px 26px rgba(26, 30, 53, 0.05) !important;
  }

  .admin-featured-videos-toolbar .card-body {
    padding: 19px !important;
  }

  .admin-featured-videos-toolbar-heading {
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .admin-video-toolbar-icon {
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    border-radius: 10px;
    background: #eef0ff;
    color: #2D3195;
  }

  .admin-featured-videos-toolbar-title {
    color: var(--admin-text);
    font-family: "Poppins", sans-serif;
    font-size: 0.86rem;
    font-weight: 800;
  }

  .admin-featured-videos-toolbar-caption {
    margin-top: 2px;
    color: var(--admin-muted);
    font-size: 0.64rem;
    font-weight: 600;
  }

  .admin-video-toolbar-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: auto;
  }

  .admin-video-count-pill {
    display: inline-flex;
    align-items: center;
    min-height: 29px;
    padding: 6px 10px;
    border-radius: 999px;
    background: #eef0ff;
    color: #2D3195;
    font-size: 0.62rem;
    font-weight: 900;
  }

  .admin-video-refresh-button {
    display: inline-flex !important;
    align-items: center;
    gap: 5px;
    padding: 0 !important;
    color: #2D3195 !important;
    font-family: "Nunito", sans-serif !important;
    font-size: 0.66rem !important;
    font-weight: 800 !important;
    text-decoration: none !important;
  }

  .admin-video-refresh-button:hover {
    color: #242879 !important;
  }

  .admin-video-spin {
    animation: adminVideoSpin 0.8s linear infinite;
  }

  @keyframes adminVideoSpin {
    to {
      transform: rotate(360deg);
    }
  }

  /* =====================================================
     VIDEO GRID
  ===================================================== */

  .admin-featured-videos-grid > .admin-featured-video-col {
    display: flex;
  }

  .admin-featured-video-card {
    position: relative;
    width: 100%;
    min-height: 100%;
    overflow: hidden;
    border: 1px solid var(--admin-border) !important;
    border-radius: 18px !important;
    background: var(--admin-surface) !important;
    box-shadow: 0 7px 24px rgba(26, 30, 53, 0.06) !important;
    animation: adminFeaturedVideoCardIn 0.55s ease both;
    transition:
      transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1),
      box-shadow 0.25s ease,
      border-color 0.25s ease;
  }

  .admin-featured-video-card:hover {
    transform: translateY(-5px);
    border-color: rgba(45, 49, 149, 0.17) !important;
    box-shadow: 0 17px 38px rgba(26, 30, 53, 0.11) !important;
  }

  @keyframes adminFeaturedVideoCardIn {
    from {
      opacity: 0;
      transform: translateY(12px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .admin-featured-video-preview {
    position: relative;
    height: 218px;
    overflow: hidden;
    border-radius: 18px 18px 0 0;
    background: #111421;
  }

  .admin-featured-video-player {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    background: #111421;
  }

  .admin-featured-video-overlay {
    position: absolute;
    top: 12px;
    left: 12px;
    right: 12px;
    display: flex;
    justify-content: flex-start;
    pointer-events: none;
  }

  .admin-featured-video-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 9px;
    border-radius: 999px;
    background: rgba(45, 49, 149, 0.92);
    color: #fff;
    box-shadow: 0 7px 18px rgba(0, 0, 0, 0.14);
    backdrop-filter: blur(9px);
    font-size: 0.60rem;
    font-weight: 900;
  }

  .admin-featured-video-card .card-body {
    display: flex;
    flex-direction: column;
    min-height: 235px;
    padding: 16px !important;
  }

  .admin-featured-video-badge-row {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    min-height: 24px;
  }

  .admin-featured-video-card .badge {
    border-radius: 999px !important;
    padding: 5px 9px !important;
    font-family: "Nunito", sans-serif !important;
    font-size: 0.58rem !important;
    font-weight: 900 !important;
  }

  .admin-featured-video-type-badge {
    background: #eef0ff !important;
    color: #2D3195 !important;
  }

  .admin-featured-video-status-badge {
    background: #fff5d9 !important;
    color: #8e6200 !important;
  }

  .admin-featured-video-name {
    margin: 9px 0 0 !important;
    color: var(--admin-text) !important;
    font-family: "Poppins", sans-serif !important;
    font-size: 0.94rem !important;
    font-weight: 800 !important;
    line-height: 1.3 !important;
  }

  .admin-featured-video-description {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    min-height: 50px;
    overflow: hidden;
    margin: 7px 0 11px;
    color: var(--admin-muted);
    font-family: "Nunito", sans-serif;
    font-size: 0.69rem;
    font-weight: 600;
    line-height: 1.55;
  }

  .admin-featured-video-meta {
    min-height: 28px;
    margin-bottom: 12px;
  }

  .admin-featured-video-meta > div {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--admin-muted);
    font-family: "Nunito", sans-serif;
    font-size: 0.64rem;
    font-weight: 700;
  }

  .admin-featured-video-meta svg {
    flex: 0 0 auto;
    color: #2D3195;
  }

  .admin-featured-video-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 12px;
    margin-top: auto;
    border-top: 1px solid #EEF0F4;
  }

  .admin-featured-video-actions .btn {
    min-height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-radius: 10px !important;
    font-family: "Nunito", sans-serif !important;
    font-size: 0.67rem !important;
    font-weight: 900 !important;
    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease,
      background 0.18s ease;
  }

  .admin-video-view-button {
    flex: 1 1 auto;
    color: var(--admin-primary) !important;
    border-color: rgba(45, 49, 149, 0.25) !important;
    background: #F8F8FF !important;
  }

  .admin-video-view-button:hover {
    color: #fff !important;
    border-color: var(--admin-primary) !important;
    background: var(--admin-primary) !important;
    transform: translateY(-1px);
    box-shadow: 0 7px 16px rgba(45, 49, 149, 0.16);
  }

  .admin-video-delete-button {
    width: 40px;
    min-width: 40px !important;
    color: #C74350 !important;
    border-color: rgba(199, 67, 80, 0.20) !important;
    background: #FFF7F8 !important;
  }

  .admin-video-delete-button:hover {
    color: #fff !important;
    border-color: #C74350 !important;
    background: #C74350 !important;
    transform: translateY(-1px);
  }

  /* =====================================================
     LOADING
  ===================================================== */

  .admin-featured-videos-loading {
    min-height: 320px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    border: 1px solid var(--admin-border);
    border-radius: 18px;
    background: var(--admin-surface);
    text-align: center;
  }

  .admin-video-loading-icon,
  .admin-video-empty-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #2D3195;
    background: #eef0ff;
  }

  .admin-video-loading-icon {
    width: 52px;
    height: 52px;
    border-radius: 15px;
  }

  .admin-video-empty-icon {
    width: 62px;
    height: 62px;
    border-radius: 18px;
  }

  .admin-video-loading-title,
  .admin-video-empty-title {
    margin-top: 13px;
    color: var(--admin-text);
    font-family: "Poppins", sans-serif;
    font-size: 0.84rem;
    font-weight: 800;
  }

  .admin-video-loading-subtitle,
  .admin-video-empty-text {
    margin: 5px 0 0;
    color: var(--admin-muted);
    font-size: 0.68rem;
    font-weight: 600;
  }

  /* =====================================================
     EMPTY STATE
  ===================================================== */

  .admin-featured-videos-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    padding: 40px 20px;
    border: 1px solid var(--admin-border);
    border-radius: 18px;
    background: var(--admin-surface);
    text-align: center;
  }

  .admin-video-empty-button {
    display: inline-flex !important;
    align-items: center;
    gap: 6px;
    margin-top: 16px;
    border-color: rgba(45, 49, 149, 0.28) !important;
    color: #2D3195 !important;
    border-radius: 10px !important;
    font-size: 0.68rem !important;
    font-weight: 800 !important;
  }

  /* =====================================================
     MODALS
  ===================================================== */

  .admin-featured-videos-modal .modal-content {
    overflow: hidden;
    border: 1px solid var(--admin-border) !important;
    border-radius: 18px !important;
    background: var(--admin-surface) !important;
    box-shadow: 0 22px 60px rgba(26, 30, 53, 0.18) !important;
  }

  .admin-featured-videos-modal .modal-header {
    padding: 17px 20px !important;
    border-bottom: 0 !important;
    background: #2D3195 !important;
    color: #fff !important;
  }

  .admin-featured-videos-modal .modal-header .btn-close {
    filter: brightness(0) invert(1);
    opacity: 0.85;
  }

  .admin-modal-title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #fff !important;
    font-family: "Poppins", sans-serif !important;
    font-size: 0.96rem !important;
    font-weight: 700 !important;
  }

  .admin-modal-title-icon {
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 9px;
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.18);
  }

  .admin-modal-title-icon-danger {
    background: rgba(255,255,255,0.13);
  }

  .admin-featured-videos-modal .modal-body {
    padding: 22px !important;
    background: var(--admin-surface) !important;
    color: var(--admin-text) !important;
  }

  .admin-featured-videos-modal .modal-footer {
    gap: 8px;
    padding: 12px 20px !important;
    border-top: 1px solid #EEF0F4 !important;
    background: var(--admin-surface) !important;
  }

  .admin-featured-videos-modal .modal-footer .btn {
    min-height: 38px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-radius: 10px !important;
    padding: 8px 15px !important;
    font-family: "Nunito", sans-serif !important;
    font-size: 0.68rem !important;
    font-weight: 800 !important;
  }

  .admin-featured-videos-modal .modal-footer .btn-primary {
    border: 0 !important;
    background: var(--admin-primary) !important;
    color: #fff !important;
    box-shadow: 0 8px 18px rgba(45, 49, 149, 0.16);
  }

  .admin-featured-videos-modal .modal-footer .btn-primary:hover {
    background: var(--admin-primary-dark) !important;
    transform: translateY(-1px);
  }

  .admin-featured-videos-modal .modal-footer .btn-secondary {
    border-color: #E0E3EB !important;
    background: #fff !important;
    color: #656A76 !important;
  }

  .admin-featured-videos-modal .modal-body .form-label {
    color: #4e5564 !important;
    font-family: "Nunito", sans-serif !important;
    font-size: 0.67rem !important;
    font-weight: 900 !important;
    margin-bottom: 6px;
  }

  .admin-featured-videos-modal .modal-body .form-control {
    min-height: 42px;
    border: 1px solid #E0E3EB !important;
    border-radius: 11px !important;
    background: #fff !important;
    color: var(--admin-text) !important;
    font-family: "Nunito", sans-serif !important;
    font-size: 0.70rem !important;
    font-weight: 600 !important;
    box-shadow: 0 3px 10px rgba(26, 30, 53, 0.025) !important;
  }

  .admin-featured-videos-modal .modal-body textarea.form-control {
    min-height: 96px;
    resize: vertical;
  }

  .admin-featured-videos-modal .modal-body .form-control:focus {
    border-color: rgba(45, 49, 149, 0.52) !important;
    box-shadow: 0 0 0 3px rgba(45, 49, 149, 0.08) !important;
  }

  .admin-featured-videos-modal .modal-body .form-text {
    color: var(--admin-muted);
    font-size: 0.62rem;
    font-weight: 600;
  }

  .admin-form-optional {
    margin-left: 5px;
    color: #9297A3;
    font-size: 0.58rem;
    font-weight: 700;
  }

  /* =====================================================
     FORM INTRO
  ===================================================== */

  .admin-video-form-intro {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 12px 14px;
    margin-bottom: 20px;
    border: 1px solid rgba(45, 49, 149, 0.11);
    border-radius: 13px;
    background: #f7f7ff;
  }

  .admin-video-form-intro-icon {
    width: 34px;
    height: 34px;
    flex: 0 0 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: #eef0ff;
    color: #2D3195;
  }

  .admin-video-form-intro strong {
    display: block;
    color: #2D3195;
    font-size: 0.72rem;
    font-weight: 900;
  }

  .admin-video-form-intro span {
    display: block;
    margin-top: 2px;
    color: #7c8290;
    font-size: 0.63rem;
    font-weight: 600;
  }

  .admin-video-form-note {
    display: flex;
    align-items: flex-start;
    gap: 7px;
    margin-top: 10px;
    padding: 9px 11px;
    border-radius: 10px;
    background: #f7f8fc;
    color: var(--admin-muted);
    font-size: 0.62rem;
    font-weight: 600;
    line-height: 1.5;
  }

  .admin-video-form-note svg {
    flex: 0 0 auto;
    margin-top: 1px;
    color: #2D3195;
  }

  /* =====================================================
     SELECTED FILE
  ===================================================== */

  .admin-selected-video-file {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    margin: -4px 0 17px;
    border: 1px solid rgba(45, 49, 149, 0.12);
    border-radius: 12px;
    background: #f8f8ff;
  }

  .admin-selected-video-file-icon {
    width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 34px;
    border-radius: 9px;
    background: #eef0ff;
    color: #2D3195;
  }

  .admin-selected-video-file-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }

  .admin-selected-video-file-info strong {
    overflow: hidden;
    color: var(--admin-text);
    font-size: 0.66rem;
    font-weight: 800;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-selected-video-file-info span {
    margin-top: 2px;
    color: var(--admin-muted);
    font-size: 0.59rem;
    font-weight: 600;
  }

  .admin-selected-video-check {
    flex: 0 0 auto;
    color: #2f8a63;
  }

  /* =====================================================
     PREVIEW
  ===================================================== */

  .admin-featured-preview-player-shell {
    width: 100%;
    overflow: hidden;
    border-radius: 15px;
    background: #10121c;
    box-shadow: 0 10px 28px rgba(26, 30, 53, 0.12);
  }

  .admin-featured-preview-player {
    width: 100%;
    max-height: 520px;
    display: block;
    background: #10121c;
  }

  .admin-featured-preview-information {
    padding-top: 20px;
  }

  .admin-featured-preview-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 15px;
  }

  .admin-featured-preview-kicker {
    margin-bottom: 5px;
    color: #2D3195;
    font-size: 0.59rem;
    font-weight: 900;
    letter-spacing: 0.12em;
  }

  .admin-featured-preview-heading h3 {
    margin: 0;
    color: var(--admin-text);
    font-family: "Poppins", sans-serif;
    font-size: 1.12rem;
    font-weight: 800;
  }

  .admin-featured-preview-badge {
    flex: 0 0 auto;
    border-radius: 999px !important;
    padding: 6px 10px !important;
    background: #fff5d9 !important;
    color: #8e6200 !important;
    font-size: 0.59rem !important;
    font-weight: 900 !important;
  }

  .admin-featured-preview-description {
    margin-top: 11px;
    color: var(--admin-muted);
    font-family: "Nunito", sans-serif;
    font-size: 0.72rem;
    font-weight: 600;
    line-height: 1.65;
  }

  .admin-featured-preview-details {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-top: 18px;
  }

  .admin-featured-preview-detail {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 11px 12px;
    border: 1px solid var(--admin-border);
    border-radius: 12px;
    background: #f8f8fc;
  }

  .admin-featured-preview-detail > svg {
    flex: 0 0 auto;
    color: #2D3195;
  }

  .admin-featured-preview-detail div {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .admin-featured-preview-detail span {
    color: var(--admin-muted);
    font-size: 0.57rem;
    font-weight: 700;
  }

  .admin-featured-preview-detail strong {
    margin-top: 2px;
    color: var(--admin-text);
    font-size: 0.64rem;
    font-weight: 800;
  }

  .admin-preview-delete-button {
    color: #C74350 !important;
    border-color: rgba(199, 67, 80, 0.22) !important;
    background: #FFF7F8 !important;
  }

  .admin-preview-delete-button:hover {
    color: #fff !important;
    border-color: #C74350 !important;
    background: #C74350 !important;
  }

  /* =====================================================
     DELETE CONFIRMATION
  ===================================================== */

  .admin-delete-confirmation {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 15px;
    border: 1px solid rgba(199, 67, 80, 0.13);
    border-radius: 14px;
    background: #fff8f8;
  }

  .admin-delete-confirmation-icon {
    width: 44px;
    height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 44px;
    border-radius: 12px;
    background: #fdebed;
    color: #C74350;
  }

  .admin-delete-confirmation h4 {
    margin: 2px 0 5px;
    color: var(--admin-text);
    font-family: "Poppins", sans-serif;
    font-size: 0.84rem;
    font-weight: 800;
  }

  .admin-delete-confirmation p {
    margin: 0;
    color: var(--admin-muted);
    font-size: 0.67rem;
    font-weight: 600;
    line-height: 1.55;
  }

  .admin-delete-video-name {
    margin-top: 9px;
    padding: 8px 10px;
    border-radius: 9px;
    background: #fff;
    color: #C74350;
    font-size: 0.65rem;
    font-weight: 800;
  }

  .admin-confirm-delete-button {
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border: 0 !important;
    border-radius: 10px !important;
    background: #C74350 !important;
    font-size: 0.68rem !important;
    font-weight: 800 !important;
  }

  /* =====================================================
     DARK MODE
  ===================================================== */

  .admin-featured-videos-dark {
    --admin-surface: #191C2B;
    --admin-border: #2B3042;
    --admin-text: #F1F3F8;
    --admin-muted: #A8AFBF;

    background:
      radial-gradient(
        circle at 8% 0%,
        rgba(100, 106, 212, 0.12),
        transparent 28%
      ),
      linear-gradient(
        180deg,
        #151827 0%,
        #10121C 100%
      );
  }

  .admin-featured-videos-dark
    .admin-video-stat-card,
  .admin-featured-videos-dark
    .admin-featured-videos-toolbar,
  .admin-featured-videos-dark
    .admin-featured-video-card,
  .admin-featured-videos-dark
    .admin-featured-videos-loading,
  .admin-featured-videos-dark
    .admin-featured-videos-empty,
  .admin-featured-videos-dark
    .modal-content {
    background: #191C2B !important;
    border-color: #2B3042 !important;
  }

  .admin-featured-videos-dark
    .admin-featured-videos-toolbar-caption,
  .admin-featured-videos-dark
    .admin-featured-video-description,
  .admin-featured-videos-dark
    .admin-featured-video-meta,
  .admin-featured-videos-dark
    .admin-video-stat-caption,
  .admin-featured-videos-dark
    .admin-video-stat-label,
  .admin-featured-videos-dark
    .admin-featured-videos-subtitle {
    color: #A8AFBF !important;
  }

  .admin-featured-videos-dark
    .admin-featured-video-name,
  .admin-featured-videos-dark
    .admin-video-stat-value,
  .admin-featured-videos-dark
    .admin-featured-videos-toolbar-title,
  .admin-featured-videos-dark
    .admin-video-loading-title,
  .admin-featured-videos-dark
    .admin-video-empty-title,
  .admin-featured-videos-dark
    .admin-featured-preview-heading h3,
  .admin-featured-videos-dark
    .admin-featured-preview-detail strong {
    color: #F1F3F8 !important;
  }

  .admin-featured-videos-dark
    .admin-video-toolbar-icon {
    background: #262B46 !important;
    color: #AEB4FF !important;
  }

  .admin-featured-videos-dark
    .admin-video-count-pill {
    background: #262B46 !important;
    color: #c9ccff !important;
  }

  .admin-featured-videos-dark
    .admin-featured-video-actions {
    border-color: #2B3042 !important;
  }

  .admin-featured-videos-dark
    .admin-video-view-button {
    background: #202436 !important;
    border-color: #343A4F !important;
    color: #AEB4FF !important;
  }

  .admin-featured-videos-dark
    .admin-featured-videos-modal .modal-body,
  .admin-featured-videos-dark
    .admin-featured-videos-modal .modal-footer {
    background: #191C2B !important;
    border-color: #2B3042 !important;
  }

  .admin-featured-videos-dark
    .admin-featured-videos-modal .form-control {
    background: #202436 !important;
    border-color: #343A4F !important;
    color: #F1F3F8 !important;
  }

  .admin-featured-videos-dark
    .admin-featured-videos-modal .form-text {
    color: #858B9A !important;
  }

  .admin-featured-videos-dark
    .admin-video-form-intro {
    background: #202436 !important;
    border-color: #343A4F !important;
  }

  .admin-featured-videos-dark
    .admin-video-form-intro strong {
    color: #c9ccff !important;
  }

  .admin-featured-videos-dark
    .admin-video-form-intro span {
    color: #A8AFBF !important;
  }

  .admin-featured-videos-dark
    .admin-video-form-note {
    background: #202436 !important;
    color: #A8AFBF !important;
  }

  .admin-featured-videos-dark
    .admin-selected-video-file {
    background: #202436 !important;
    border-color: #343A4F !important;
  }

  .admin-featured-videos-dark
    .admin-selected-video-file-info strong {
    color: #F1F3F8 !important;
  }

  .admin-featured-videos-dark
    .admin-featured-preview-detail {
    background: #202436 !important;
    border-color: #343A4F !important;
  }

  .admin-featured-videos-dark
    .admin-delete-confirmation {
    background: #291d22 !important;
    border-color: #513038 !important;
  }

  .admin-featured-videos-dark
    .admin-delete-video-name {
    background: #202436 !important;
  }

  /* =====================================================
     RESPONSIVE
  ===================================================== */

  @media (max-width: 991.98px) {
    .admin-featured-videos-heading {
      align-items: flex-start;
      flex-direction: column;
      gap: 14px;
    }

    .admin-featured-videos-add-button {
      width: 100%;
    }

    .admin-video-toolbar-actions {
      margin-left: auto;
    }
  }

  @media (max-width: 767.98px) {
    .admin-featured-videos-title {
      font-size: 2rem !important;
    }

    .admin-featured-videos-toolbar-heading {
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .admin-video-toolbar-actions {
      width: 100%;
      justify-content: space-between;
      margin-left: 47px;
    }

    .admin-featured-video-preview {
      height: 205px;
    }

    .admin-featured-videos-modal .modal-body {
      padding: 17px !important;
    }

    .admin-featured-videos-modal .modal-header {
      padding: 15px 17px !important;
    }

    .admin-featured-videos-modal .modal-footer {
      padding: 11px 17px !important;
    }

    .admin-featured-preview-details {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 479.98px) {
    .admin-featured-videos-page {
      padding-left: 0;
      padding-right: 0;
    }

    .admin-featured-videos-title {
      font-size: 1.8rem !important;
    }

    .admin-featured-video-preview {
      height: 190px;
    }

    .admin-video-toolbar-actions {
      margin-left: 0;
    }

    .admin-featured-preview-heading {
      flex-direction: column;
      align-items: flex-start;
    }

    .admin-delete-confirmation {
      flex-direction: column;
    }
  }
`;

export default AdminFeaturedVideos;
