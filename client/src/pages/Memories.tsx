import React, {
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
  Container,
  Form,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";

import { useHistory } from "react-router-dom";

import {
  BedDouble,
  CalendarDays,
  Camera,
  Check,
  Compass,
  Image as ImageIcon,
  ImagePlus,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import {
  createMyMemory,
  deleteMyMemory,
  getMemoryPlaces,
  getMyMemories,
  updateMyMemory,
  MemoryItemType,
  MemoryPlace,
  UserMemory,
} from "../services/api";

import { supabase } from "../services/supabase";

/* =========================================================
   BRAND COLOR
========================================================= */

const CALBAYOG_BLUE = "#2D3195";

/* =========================================================
   MEMORY PHOTO SETTINGS
========================================================= */

const MEMORY_BUCKET = "memory-images";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

/* How many photos are uploaded at the same time */
const UPLOAD_BATCH_SIZE = 3;

interface NewPhoto {
  id: string;
  key: string;
  file: File;
  url: string;
}

/* =========================================================
   MEMORY TYPES (attraction, accommodation, restaurant, event)
========================================================= */

const ITEM_TYPE_META: Record<
  MemoryItemType,
  {
    label: string;
    singular: string;
    icon: React.ElementType;
    fallbackName: string;
    searchHint: string;
  }
> = {
  attraction: {
    label: "Attractions",
    singular: "Attraction",
    icon: MapPin,
    fallbackName: "Calbayog City Attraction",
    searchHint: "Search attractions...",
  },
  accommodation: {
    label: "Accommodations",
    singular: "Accommodation",
    icon: BedDouble,
    fallbackName: "Calbayog City Accommodation",
    searchHint: "Search accommodations...",
  },
  restaurant: {
    label: "Restaurants",
    singular: "Restaurant",
    icon: UtensilsCrossed,
    fallbackName: "Calbayog City Restaurant",
    searchHint: "Search restaurants...",
  },
  event: {
    label: "Events",
    singular: "Event",
    icon: CalendarDays,
    fallbackName: "Calbayog City Event",
    searchHint: "Search events...",
  },
};

const ITEM_TYPE_ORDER: MemoryItemType[] = [
  "attraction",
  "accommodation",
  "restaurant",
  "event",
];

/* =========================================================
   HELPER FUNCTIONS
========================================================= */

/**
 * Returns all valid image URLs attached to a memory.
 */
const getImageUrls = (memory: UserMemory): string[] => {
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

const formatMemoryDate = (dateValue?: string): string => {
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

/* A memory counts as edited if it changed more than a minute after creation */
const wasEdited = (memory: UserMemory): boolean => {
  if (!memory.created_at || !memory.updated_at) {
    return false;
  }

  const created = new Date(memory.created_at).getTime();
  const updated = new Date(memory.updated_at).getTime();

  if (Number.isNaN(created) || Number.isNaN(updated)) {
    return false;
  }

  return updated - created > 60 * 1000;
};

const getErrorMessage = (error: any, fallback: string): string =>
  error?.response?.data?.message ||
  error?.message ||
  fallback;

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

  const [memories, setMemories] = useState<UserMemory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] =
    useState<string>("");

  /* =======================================================
     DELETE STATE
  ======================================================= */

  const [deletingMemoryId, setDeletingMemoryId] =
    useState<string | null>(null);

  const [selectedMemory, setSelectedMemory] =
    useState<UserMemory | null>(null);

  const [showDeleteModal, setShowDeleteModal] =
    useState<boolean>(false);

  /* =======================================================
     ADD / EDIT FORM STATE
  ======================================================= */

  const [showFormModal, setShowFormModal] =
    useState<boolean>(false);

  const [formMode, setFormMode] = useState<"add" | "edit">(
    "add",
  );

  const [editingMemory, setEditingMemory] =
    useState<UserMemory | null>(null);

  const [formItemType, setFormItemType] =
    useState<MemoryItemType>("attraction");

  const [formItemId, setFormItemId] = useState<string>("");
  const [formItemName, setFormItemName] = useState<string>("");

  const [placeSearch, setPlaceSearch] = useState<string>("");

  const [placesByType, setPlacesByType] = useState<
    Partial<Record<MemoryItemType, MemoryPlace[]>>
  >({});

  const [loadingPlaces, setLoadingPlaces] =
    useState<boolean>(false);

  const [formCaption, setFormCaption] = useState<string>("");

  /* Photos already saved on the memory (edit mode) */
  const [existingImages, setExistingImages] = useState<
    string[]
  >([]);

  /* Photos picked in this session */
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([]);

  const [savingMemory, setSavingMemory] =
    useState<boolean>(false);

  const [uploadProgress, setUploadProgress] =
    useState<number>(0);

  const [formError, setFormError] = useState<string>("");

  /* Always holds the latest new photos so previews can be released */
  const newPhotosRef = useRef<NewPhoto[]>([]);

  useEffect(() => {
    newPhotosRef.current = newPhotos;
  }, [newPhotos]);

  const revokePreviews = useCallback((photos: NewPhoto[]) => {
    photos.forEach((photo) => {
      URL.revokeObjectURL(photo.url);
    });
  }, []);

  const clearNewPhotos = useCallback(() => {
    revokePreviews(newPhotosRef.current);
    newPhotosRef.current = [];
    setNewPhotos([]);
  }, [revokePreviews]);

  /* Release preview URLs when leaving the page */
  useEffect(() => {
    return () => {
      revokePreviews(newPhotosRef.current);
    };
  }, [revokePreviews]);

  /* =======================================================
     FETCH MEMORIES
  ======================================================= */

  const fetchMemories = useCallback(async (): Promise<void> => {
    if (authLoading) {
      return;
    }

    if (!user || !userToken) {
      setMemories([]);
      setLoading(false);
      setError("Please log in to view your memories.");

      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await getMyMemories();

      setMemories(result.data);
    } catch (fetchError: any) {
      console.error("Fetch memories error:", fetchError);

      setError(
        fetchError?.response?.status === 401
          ? "Your session has expired. Please log in again."
          : getErrorMessage(
              fetchError,
              "Failed to load your memories.",
            ),
      );
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, userToken]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    void fetchMemories();
  }, [authLoading, fetchMemories]);

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const handleGoToAttractions = (): void => {
    history.push("/attractions");
  };

  /* =======================================================
     PLACES (for the picker in "Add Memory")
  ======================================================= */

  const loadPlaces = useCallback(
    async (type: MemoryItemType): Promise<void> => {
      if (placesByType[type]) {
        return;
      }

      try {
        setLoadingPlaces(true);

        const places = await getMemoryPlaces(type);

        setPlacesByType((previous) => ({
          ...previous,
          [type]: places,
        }));
      } catch (loadError) {
        console.error(
          `Failed to load ${type} places:`,
          loadError,
        );

        setFormError(
          `Could not load ${ITEM_TYPE_META[type].label.toLowerCase()}. Please try again.`,
        );
      } finally {
        setLoadingPlaces(false);
      }
    },
    [placesByType],
  );

  const visiblePlaces = useMemo(() => {
    const list = placesByType[formItemType] || [];
    const query = placeSearch.trim().toLowerCase();

    if (!query) {
      return list;
    }

    return list.filter(
      (place) =>
        place.name.toLowerCase().includes(query) ||
        place.subtitle.toLowerCase().includes(query),
    );
  }, [placesByType, formItemType, placeSearch]);

  /* =======================================================
     OPEN / CLOSE FORM
  ======================================================= */

  const resetFormState = (): void => {
    clearNewPhotos();
    setFormCaption("");
    setExistingImages([]);
    setFormItemId("");
    setFormItemName("");
    setPlaceSearch("");
    setFormError("");
    setUploadProgress(0);
    setEditingMemory(null);
  };

  const openAddMemoryModal = (): void => {
    if (!user || !userToken) {
      setError("Please log in before adding a memory.");
      return;
    }

    setError("");
    setSuccessMessage("");

    resetFormState();

    setFormMode("add");
    setFormItemType("attraction");
    setShowFormModal(true);

    void loadPlaces("attraction");
  };

  const openEditMemoryModal = (memory: UserMemory): void => {
    setError("");
    setSuccessMessage("");

    resetFormState();

    const itemType = memory.item_type || "attraction";

    setFormMode("edit");
    setEditingMemory(memory);
    setFormItemType(itemType);
    setFormItemId(memory.item_id || "");
    setFormItemName(
      memory.item?.name ||
        memory.attraction?.name ||
        ITEM_TYPE_META[itemType].fallbackName,
    );
    setFormCaption(memory.caption || "");
    setExistingImages(getImageUrls(memory));
    setShowFormModal(true);
  };

  const closeFormModal = (): void => {
    if (savingMemory) {
      return;
    }

    resetFormState();
    setShowFormModal(false);
  };

  const handleChangeItemType = (type: MemoryItemType): void => {
    if (type === formItemType) {
      return;
    }

    setFormItemType(type);
    setFormItemId("");
    setFormItemName("");
    setPlaceSearch("");
    setFormError("");

    void loadPlaces(type);
  };

  const handleSelectPlace = (place: MemoryPlace): void => {
    setFormItemId(place.id);
    setFormItemName(place.name);
    setFormError("");
  };

  /* =======================================================
     PHOTOS
  ======================================================= */

  const handlePhotosChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const selectedFiles = Array.from(event.target.files || []);

    // Reset so the same file can be picked again later.
    event.target.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    setFormError("");

    const existingKeys = new Set(
      newPhotosRef.current.map((photo) => photo.key),
    );

    const accepted: NewPhoto[] = [];

    let wrongType = 0;
    let tooLarge = 0;

    selectedFiles.forEach((file) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        wrongType += 1;
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        tooLarge += 1;
        return;
      }

      const key = `${file.name}-${file.size}-${file.lastModified}`;

      // Ignore the exact same photo picked twice.
      if (existingKeys.has(key)) {
        return;
      }

      existingKeys.add(key);

      accepted.push({
        id: `${key}-${Math.random().toString(36).slice(2, 8)}`,
        key,
        file,
        url: URL.createObjectURL(file),
      });
    });

    if (accepted.length > 0) {
      setNewPhotos((previous) => [...previous, ...accepted]);
    }

    const problems: string[] = [];

    if (wrongType > 0) {
      problems.push(
        `${wrongType} ${
          wrongType === 1 ? "file was" : "files were"
        } skipped because only JPG, PNG, or WEBP images are allowed.`,
      );
    }

    if (tooLarge > 0) {
      problems.push(
        `${tooLarge} ${
          tooLarge === 1 ? "photo was" : "photos were"
        } skipped because each photo must be smaller than 5 MB.`,
      );
    }

    if (problems.length > 0) {
      setFormError(problems.join(" "));
    }
  };

  const handleRemoveNewPhoto = (photoId: string): void => {
    setFormError("");

    setNewPhotos((previous) => {
      const removed = previous.find(
        (photo) => photo.id === photoId,
      );

      if (removed) {
        URL.revokeObjectURL(removed.url);
      }

      return previous.filter((photo) => photo.id !== photoId);
    });
  };

  const handleRemoveExistingPhoto = (url: string): void => {
    setFormError("");

    setExistingImages((previous) =>
      previous.filter((imageUrl) => imageUrl !== url),
    );
  };

  /* =======================================================
     SAVE (ADD OR EDIT)
  ======================================================= */

  const handleSaveMemory = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (savingMemory) {
      return;
    }

    setFormError("");
    setError("");
    setSuccessMessage("");

    if (!user || !userToken) {
      setFormError(
        "Your session has expired. Please log in again.",
      );
      return;
    }

    const userId = String((user as any)?.id || "").trim();

    if (!userId) {
      setFormError(
        "Your user session could not be verified. Please log in again.",
      );
      return;
    }

    if (formMode === "add" && !formItemId) {
      setFormError("Please choose a place for your memory.");
      return;
    }

    if (existingImages.length + newPhotos.length === 0) {
      setFormError("Please add at least one photo.");
      return;
    }

    const caption = formCaption.trim();

    if (!caption) {
      setFormError("Please write a caption for your memory.");
      return;
    }

    if (caption.length > 500) {
      setFormError(
        "Your caption must be 500 characters or less.",
      );
      return;
    }

    // Paths uploaded so far, so they can be cleaned up on failure.
    const uploadedPaths: string[] = [];

    try {
      setSavingMemory(true);
      setUploadProgress(0);

      const photosToUpload = [...newPhotos];
      const newUrls: string[] = new Array(photosToUpload.length);

      const uploadOne = async (
        photo: NewPhoto,
        index: number,
      ): Promise<void> => {
        const extension =
          photo.file.name.split(".").pop()?.toLowerCase() ||
          "jpg";

        const fileName = `${Date.now()}-${index}-${Math.random()
          .toString(36)
          .slice(2)}.${extension}`;

        const filePath = `${userId}/${formItemType}/${formItemId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(MEMORY_BUCKET)
          .upload(filePath, photo.file, {
            cacheControl: "3600",
            upsert: false,
            contentType: photo.file.type,
          });

        if (uploadError) {
          throw uploadError;
        }

        uploadedPaths.push(filePath);

        const { data: publicUrlData } = supabase.storage
          .from(MEMORY_BUCKET)
          .getPublicUrl(filePath);

        const imageUrl = publicUrlData?.publicUrl || "";

        if (!imageUrl) {
          throw new Error(
            "The uploaded image URL could not be created.",
          );
        }

        newUrls[index] = imageUrl;

        setUploadProgress((previous) => previous + 1);
      };

      // Upload in small batches so many photos do not
      // overwhelm the connection.
      for (
        let start = 0;
        start < photosToUpload.length;
        start += UPLOAD_BATCH_SIZE
      ) {
        const batch = photosToUpload.slice(
          start,
          start + UPLOAD_BATCH_SIZE,
        );

        await Promise.all(
          batch.map((photo, offset) =>
            uploadOne(photo, start + offset),
          ),
        );
      }

      const finalImageUrls = [...existingImages, ...newUrls];

      if (formMode === "edit" && editingMemory) {
        await updateMyMemory(editingMemory.id, {
          caption,
          image_urls: finalImageUrls,
        });
      } else {
        await createMyMemory({
          item_type: formItemType,
          item_id: formItemId,
          caption,
          image_urls: finalImageUrls,
        });
      }

      const wasEditing = formMode === "edit";

      // Close the form (saving is finished at this point).
      resetFormState();
      setShowFormModal(false);

      await fetchMemories();

      setSuccessMessage(
        wasEditing
          ? "Your memory has been updated successfully!"
          : "Your memory has been added successfully!",
      );
    } catch (saveError: any) {
      console.error("Save memory error:", saveError);

      // Remove photos that were already uploaded so a failed
      // save does not leave unused files in storage.
      if (uploadedPaths.length > 0) {
        try {
          await supabase.storage
            .from(MEMORY_BUCKET)
            .remove(uploadedPaths);
        } catch (cleanupError) {
          console.error(
            "Failed to clean up uploaded memory images:",
            cleanupError,
          );
        }
      }

      setFormError(
        getErrorMessage(
          saveError,
          "Something went wrong while saving your memory.",
        ),
      );
    } finally {
      setSavingMemory(false);
      setUploadProgress(0);
    }
  };

  /* =======================================================
     DELETE
  ======================================================= */

  const handleOpenDeleteModal = (memory: UserMemory): void => {
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

  const handleDeleteMemory = async (): Promise<void> => {
    if (!selectedMemory?.id || !userToken) {
      setError("Your session has expired. Please log in again.");

      return;
    }

    try {
      setDeletingMemoryId(selectedMemory.id);
      setError("");
      setSuccessMessage("");

      const result = await deleteMyMemory(selectedMemory.id);

      setMemories((currentMemories) =>
        currentMemories.filter(
          (memory) => memory.id !== selectedMemory.id,
        ),
      );

      setSuccessMessage(
        result.message || "Memory deleted successfully.",
      );

      setSelectedMemory(null);
      setShowDeleteModal(false);
    } catch (deleteError: any) {
      console.error("Delete memory error:", deleteError);

      setError(
        getErrorMessage(
          deleteError,
          "Failed to delete this memory.",
        ),
      );
    } finally {
      setDeletingMemoryId(null);
    }
  };

  /* =======================================================
     DERIVED VALUES FOR THE FORM
  ======================================================= */

  const totalPhotos = existingImages.length + newPhotos.length;

  const saveButtonLabel = savingMemory
    ? newPhotos.length > 1
      ? `Saving ${Math.min(
          uploadProgress,
          newPhotos.length,
        )}/${newPhotos.length}...`
      : "Saving Memory..."
    : formMode === "edit"
      ? "Save Changes"
      : "Save Memory";

  const FormTypeIcon = ITEM_TYPE_META[formItemType].icon;

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
            <h1 className="memories-title">MY MEMORIES</h1>

            <p className="memories-subtitle">
              Keep your favorite moments and experiences from
              exploring Calbayog City.
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
                <Camera size={18} strokeWidth={1.9} />
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
              onClick={openAddMemoryModal}
            >
              <Plus size={15} strokeWidth={2.2} />
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
              onClose={() => setSuccessMessage("")}
              className="memories-alert"
            >
              {successMessage}
            </Alert>
          )}

          {error && (
            <Alert
              variant="danger"
              dismissible
              onClose={() => setError("")}
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
                    <ImageIcon size={17} strokeWidth={1.9} />
                  </div>

                  <div>
                    <div className="memories-results-label">
                      Showing
                    </div>

                    <div className="memories-results-count">
                      <strong>{memories.length}</strong> saved
                      moment
                      {memories.length !== 1 ? "s" : ""}
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
                <Spinner animation="border" size="sm" />
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
                <Camera size={29} strokeWidth={1.6} />
              </div>

              <h3>No memories yet</h3>

              <p>
                Start exploring Calbayog City and save your
                favorite travel moments here.
              </p>

              <Button
                className="empty-button"
                onClick={handleGoToAttractions}
              >
                <Compass size={15} strokeWidth={1.9} />
                Explore attractions
              </Button>
            </div>
          ) : (
            /* =============================================
               MEMORY CARDS
            ============================================= */

            <Row className="memories-grid">
              {memories.map((memory) => {
                const imageUrls = getImageUrls(memory);

                const itemType: MemoryItemType =
                  memory.item_type || "attraction";

                const typeMeta = ITEM_TYPE_META[itemType];

                const TypeIcon = typeMeta.icon;

                const item = memory.item || memory.attraction;

                const placeName =
                  item?.name || typeMeta.fallbackName;

                const placeImage = item?.image || null;

                const firstImage = imageUrls[0] || placeImage;

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
                            alt={placeName}
                            className="memory-image"
                            onError={(event) => {
                              event.currentTarget.style.display =
                                "none";
                            }}
                          />

                          <div className="memory-image-overlay" />

                          <div className="memory-location-badge">
                            <TypeIcon
                              size={12}
                              strokeWidth={2}
                            />

                            <span>{placeName}</span>
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
                          <Camera size={30} strokeWidth={1.5} />

                          <span>No image available</span>
                        </div>
                      )}

                      {/* =================================
                          CARD CONTENT
                      ================================= */}

                      <Card.Body className="memory-card-body">
                        <div className="memory-date">
                          {formatMemoryDate(memory.created_at)}
                          {wasEdited(memory) && (
                            <span className="memory-edited-tag">
                              Edited
                            </span>
                          )}
                        </div>

                        <h3 className="memory-attraction-name">
                          {placeName}
                        </h3>

                        <p className="memory-caption">
                          {memory.caption}
                        </p>

                        <div className="memory-card-footer">
                          <div className="memory-card-type">
                            <TypeIcon
                              size={13}
                              strokeWidth={1.8}
                            />

                            {typeMeta.singular} memory
                          </div>

                          <div className="memory-card-actions">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="memory-edit-button"
                              onClick={() =>
                                openEditMemoryModal(memory)
                              }
                              disabled={
                                deletingMemoryId === memory.id
                              }
                            >
                              <Pencil
                                size={13}
                                strokeWidth={1.9}
                              />
                              Edit
                            </Button>

                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="memory-delete-button"
                              onClick={() =>
                                handleOpenDeleteModal(memory)
                              }
                              disabled={
                                deletingMemoryId === memory.id
                              }
                            >
                              <Trash2
                                size={13}
                                strokeWidth={1.9}
                              />
                              Delete
                            </Button>
                          </div>
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
          ADD / EDIT MEMORY MODAL
      =================================================== */}

      <Modal
        show={showFormModal}
        onHide={closeFormModal}
        centered
        size="lg"
        scrollable
        backdrop={savingMemory ? "static" : true}
        keyboard={!savingMemory}
      >
        <Form onSubmit={handleSaveMemory}>
          <Modal.Header closeButton={!savingMemory}>
            <Modal.Title>
              {formMode === "edit"
                ? "Edit Your Memory"
                : "Share a Travel Memory"}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {formError && (
              <Alert
                variant="danger"
                dismissible
                onClose={() => setFormError("")}
                className="memories-alert"
              >
                {formError}
              </Alert>
            )}

            {/* ---------------------------------------------
                PLACE
            --------------------------------------------- */}

            <div className="memory-form-section">
              <div className="memory-form-label">Place</div>

              {formMode === "edit" ? (
                <div className="memory-place-fixed">
                  <div className="memory-place-fixed-icon">
                    <FormTypeIcon size={16} strokeWidth={1.9} />
                  </div>

                  <div>
                    <div className="memory-place-fixed-type">
                      {ITEM_TYPE_META[formItemType].singular}
                    </div>

                    <div className="memory-place-fixed-name">
                      {formItemName}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="memory-type-tabs">
                    {ITEM_TYPE_ORDER.map((type) => {
                      const meta = ITEM_TYPE_META[type];
                      const TabIcon = meta.icon;

                      return (
                        <button
                          type="button"
                          key={type}
                          className={`memory-type-tab ${
                            formItemType === type
                              ? "memory-type-tab-active"
                              : ""
                          }`}
                          onClick={() =>
                            handleChangeItemType(type)
                          }
                          disabled={savingMemory}
                        >
                          <TabIcon size={14} strokeWidth={1.9} />
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="memory-place-search">
                    <Search size={15} strokeWidth={1.9} />

                    <input
                      type="search"
                      value={placeSearch}
                      onChange={(event) =>
                        setPlaceSearch(event.target.value)
                      }
                      placeholder={
                        ITEM_TYPE_META[formItemType].searchHint
                      }
                      disabled={savingMemory}
                    />
                  </div>

                  <div className="memory-place-list">
                    {loadingPlaces &&
                    !placesByType[formItemType] ? (
                      <div className="memory-place-empty">
                        <Spinner
                          animation="border"
                          size="sm"
                          className="me-2"
                        />
                        Loading...
                      </div>
                    ) : visiblePlaces.length === 0 ? (
                      <div className="memory-place-empty">
                        {placeSearch.trim()
                          ? "No matches found."
                          : `No ${ITEM_TYPE_META[
                              formItemType
                            ].label.toLowerCase()} available right now.`}
                      </div>
                    ) : (
                      visiblePlaces.map((place) => {
                        const selected =
                          formItemId === place.id;

                        return (
                          <button
                            type="button"
                            key={place.id}
                            className={`memory-place-item ${
                              selected
                                ? "memory-place-item-active"
                                : ""
                            }`}
                            onClick={() =>
                              handleSelectPlace(place)
                            }
                            disabled={savingMemory}
                          >
                            {place.image ? (
                              <img
                                src={place.image}
                                alt=""
                                loading="lazy"
                              />
                            ) : (
                              <span className="memory-place-item-thumb">
                                <FormTypeIcon
                                  size={16}
                                  strokeWidth={1.7}
                                />
                              </span>
                            )}

                            <span className="memory-place-item-text">
                              <strong>{place.name}</strong>

                              {place.subtitle && (
                                <small>{place.subtitle}</small>
                              )}
                            </span>

                            {selected && (
                              <span className="memory-place-item-check">
                                <Check size={13} />
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>

            {/* ---------------------------------------------
                PHOTOS
            --------------------------------------------- */}

            <div className="memory-form-section">
              <div className="memory-form-label">Photos</div>

              <div className="memory-photo-grid">
                {existingImages.map((url, index) => (
                  <div
                    className="memory-photo-tile"
                    key={url}
                  >
                    <img
                      src={url}
                      alt={`Saved photo ${index + 1}`}
                    />

                    <button
                      type="button"
                      className="memory-photo-remove"
                      onClick={() =>
                        handleRemoveExistingPhoto(url)
                      }
                      disabled={savingMemory}
                      aria-label={`Remove saved photo ${
                        index + 1
                      }`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {newPhotos.map((photo, index) => (
                  <div
                    className="memory-photo-tile"
                    key={photo.id}
                  >
                    <img
                      src={photo.url}
                      alt={`New photo ${index + 1}`}
                    />

                    <button
                      type="button"
                      className="memory-photo-remove"
                      onClick={() =>
                        handleRemoveNewPhoto(photo.id)
                      }
                      disabled={savingMemory}
                      aria-label={`Remove new photo ${
                        index + 1
                      }`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {!savingMemory && (
                  <label className="memory-photo-add">
                    <ImagePlus size={20} strokeWidth={1.8} />
                    {totalPhotos === 0
                      ? "Add photos"
                      : "Add more"}

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handlePhotosChange}
                    />
                  </label>
                )}
              </div>

              <Form.Text muted>
                JPG, PNG, or WEBP. Maximum 5 MB per photo.
              </Form.Text>
            </div>

            {/* ---------------------------------------------
                CAPTION
            --------------------------------------------- */}

            <div className="memory-form-section">
              <Form.Group>
                <div className="memory-form-label">Caption</div>

                <Form.Control
                  as="textarea"
                  rows={4}
                  maxLength={500}
                  placeholder="Tell us about this moment..."
                  value={formCaption}
                  onChange={(event) =>
                    setFormCaption(event.target.value)
                  }
                  disabled={savingMemory}
                />

                <Form.Text muted>
                  {formCaption.length}/500 characters
                </Form.Text>
              </Form.Group>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="outline-secondary"
              type="button"
              onClick={closeFormModal}
              disabled={savingMemory}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={savingMemory}
              style={{
                backgroundColor: CALBAYOG_BLUE,
                borderColor: CALBAYOG_BLUE,
              }}
            >
              {savingMemory && (
                <Spinner
                  animation="border"
                  size="sm"
                  className="me-2"
                />
              )}
              {saveButtonLabel}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ===================================================
          DELETE CONFIRMATION MODAL
      =================================================== */}

      <Modal
        show={showDeleteModal}
        onHide={handleCloseDeleteModal}
        centered
      >
        <Modal.Header closeButton={!deletingMemoryId}>
          <Modal.Title>Delete Memory</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          Are you sure you want to delete this memory? This
          action cannot be undone.
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCloseDeleteModal}
            disabled={Boolean(deletingMemoryId)}
          >
            Cancel
          </Button>

          <Button
            variant="danger"
            onClick={handleDeleteMemory}
            disabled={Boolean(deletingMemoryId)}
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
                <Trash2 size={14} className="me-1" />
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
          font-size: clamp(1.65rem, 2.8vw, 2.4rem);
          font-weight: 400;
          line-height: 0.95;
          letter-spacing: 0.015em;
          color: ${CALBAYOG_BLUE};
        }

        .memories-subtitle {
          max-width: 590px;
          margin: 6px 0 0;
          font-family: "Nunito", "Poppins", "Segoe UI", sans-serif;
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

        .memory-card-body {
          display: flex;
          flex-direction: column;
          padding: 18px !important;
        }

        .memory-date {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 7px;
          color: #969e99;
          font-family: "Nunito", sans-serif;
          font-size: 0.67rem;
          font-weight: 700;
        }

        .memory-edited-tag {
          padding: 2px 7px;
          border-radius: 999px;
          background: #eef0ff;
          color: ${CALBAYOG_BLUE};
          font-size: 0.58rem;
          font-weight: 800;
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

        .memory-card-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .memory-edit-button,
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

        .memory-edit-button {
          border-color: #cfd2f1 !important;
          color: ${CALBAYOG_BLUE} !important;
        }

        .memory-edit-button:hover:not(:disabled) {
          background: #eef0ff !important;
          border-color: ${CALBAYOG_BLUE} !important;
        }

        /* =================================================
           ADD / EDIT FORM
        ================================================= */

        .memory-form-section {
          margin-bottom: 18px;
        }

        .memory-form-section:last-child {
          margin-bottom: 0;
        }

        .memory-form-label {
          margin-bottom: 8px;
          color: #2a302c;
          font-family: "Poppins", sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .memory-place-fixed {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 12px;
          border: 1px solid #e4e7ed;
          border-radius: 12px;
          background: #fafbfc;
        }

        .memory-place-fixed-icon {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: #eef0ff;
          color: ${CALBAYOG_BLUE};
        }

        .memory-place-fixed-type {
          color: #8b938e;
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .memory-place-fixed-name {
          color: #252b27;
          font-size: 0.82rem;
          font-weight: 800;
        }

        .memory-type-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 10px;
        }

        .memory-type-tab {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 34px;
          padding: 6px 12px;
          border: 1px solid #e0e5e2;
          border-radius: 999px;
          background: #ffffff;
          color: #68716c;
          font-family: "Nunito", sans-serif;
          font-size: 0.68rem;
          font-weight: 800;
          cursor: pointer;
          transition:
            color 0.2s ease,
            border-color 0.2s ease,
            background 0.2s ease;
        }

        .memory-type-tab:hover:not(:disabled) {
          border-color: #c9cecb;
        }

        .memory-type-tab-active {
          border-color: ${CALBAYOG_BLUE};
          background: #eef0ff;
          color: ${CALBAYOG_BLUE};
        }

        .memory-place-search {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 11px;
          margin-bottom: 8px;
          border: 1px solid #dfe3ed;
          border-radius: 10px;
          background: #ffffff;
          color: #8c948f;
        }

        .memory-place-search input {
          flex: 1;
          min-width: 0;
          min-height: 38px;
          border: 0;
          outline: 0;
          background: transparent;
          color: #333a35;
          font-family: "Nunito", sans-serif;
          font-size: 0.75rem;
        }

        .memory-place-list {
          max-height: 240px;
          overflow-y: auto;
          border: 1px solid #e4e7ed;
          border-radius: 12px;
          background: #ffffff;
        }

        .memory-place-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 26px 14px;
          color: #8b938e;
          font-family: "Nunito", sans-serif;
          font-size: 0.73rem;
          text-align: center;
        }

        .memory-place-item {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border: 0;
          border-bottom: 1px solid #f0f2f0;
          background: #ffffff;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .memory-place-item:last-child {
          border-bottom: 0;
        }

        .memory-place-item:hover:not(:disabled) {
          background: #f7f8ff;
        }

        .memory-place-item-active {
          background: #eef0ff !important;
        }

        .memory-place-item img,
        .memory-place-item-thumb {
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          border-radius: 9px;
          object-fit: cover;
        }

        .memory-place-item-thumb {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eef0ff;
          color: ${CALBAYOG_BLUE};
        }

        .memory-place-item-text {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .memory-place-item-text strong {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #2a302c;
          font-family: "Nunito", sans-serif;
          font-size: 0.76rem;
          font-weight: 800;
        }

        .memory-place-item-text small {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #8b938e;
          font-family: "Nunito", sans-serif;
          font-size: 0.64rem;
        }

        .memory-place-item-check {
          width: 22px;
          height: 22px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: ${CALBAYOG_BLUE};
          color: #ffffff;
        }

        .memory-photo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
          gap: 8px;
          margin-bottom: 6px;
        }

        .memory-photo-tile {
          position: relative;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          border: 1px solid #e4e7ed;
          border-radius: 10px;
          background: #eef1f5;
        }

        .memory-photo-tile img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .memory-photo-remove {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: 0;
          border-radius: 50%;
          background: rgba(17, 21, 40, 0.72);
          color: #ffffff;
          cursor: pointer;
        }

        .memory-photo-remove:hover:not(:disabled) {
          background: #e33f5f;
        }

        .memory-photo-add {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          aspect-ratio: 1 / 1;
          margin: 0;
          border: 1px dashed #c9cfdc;
          border-radius: 10px;
          background: #ffffff;
          color: ${CALBAYOG_BLUE};
          font-family: "Nunito", sans-serif;
          font-size: 0.66rem;
          font-weight: 800;
          text-align: center;
          cursor: pointer;
          transition:
            background 0.2s ease,
            border-color 0.2s ease;
        }

        .memory-photo-add:hover {
          border-color: ${CALBAYOG_BLUE};
          background: #eef0ff;
        }

        .memory-photo-add input {
          display: none;
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
            font-size: clamp(1.65rem, 4.5vw, 2.25rem);
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
            padding: 25px 17px 16px;
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

          .memory-photo-grid {
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
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

          .memory-card-actions {
            align-self: flex-end;
          }
        }
      `}</style>
    </>
  );
};

export default Memories;
