import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Alert,
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
  Eye,
  Globe2,
  Image as ImageIcon,
  ImagePlus,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
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

const CALBAYOG_BLUE = "#2D3195";
const MEMORY_BUCKET = "memory-images";
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const UPLOAD_BATCH_SIZE = 3;

type MemoryFilter = "all" | MemoryItemType;

interface NewPhoto {
  id: string;
  key: string;
  file: File;
  url: string;
}

interface PlaceOption {
  id: string;
  name: string;
  subtitle: string;
  image: string;
}

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

const FILTER_ORDER: MemoryFilter[] = ["all", ...ITEM_TYPE_ORDER];

/* =========================================================
   HELPERS
========================================================= */

const asString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

/** Finds a usable image URL no matter how the backend names it. */
const pickImage = (source: any): string => {
  if (!source || typeof source !== "object") return "";

  const direct = [
    source.image,
    source.image_url,
    source.imageUrl,
    source.thumbnail,
    source.cover_image,
    source.cover,
    source.photo,
    source.poster,
  ];

  for (const candidate of direct) {
    const value = asString(candidate);
    if (value) return value;
  }

  const lists = [source.images, source.image_urls, source.photos];

  for (const list of lists) {
    if (Array.isArray(list)) {
      for (const entry of list) {
        const value =
          typeof entry === "string"
            ? asString(entry)
            : asString(entry?.url || entry?.image_url || entry?.src);
        if (value) return value;
      }
    }
  }

  return "";
};

const getItemName = (item: any, type: MemoryItemType): string =>
  asString(item?.name) ||
  asString(item?.title) ||
  asString(item?.event_name) ||
  asString(item?.event_title) ||
  ITEM_TYPE_META[type].fallbackName;

const normalizePlaces = (raw: any): PlaceOption[] => {
  const list: any[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.data?.data)
        ? raw.data.data
        : Array.isArray(raw?.places)
          ? raw.places
          : [];

  const seen = new Set<string>();
  const result: PlaceOption[] = [];

  list.forEach((place: any) => {
    const id = String(place?.id ?? place?._id ?? place?.event_id ?? "").trim();
    const name =
      asString(place?.name) ||
      asString(place?.title) ||
      asString(place?.event_name) ||
      asString(place?.event_title);

    if (!id || !name || seen.has(id)) return;

    seen.add(id);

    result.push({
      id,
      name,
      subtitle:
        asString(place?.subtitle) ||
        asString(place?.location) ||
        asString(place?.venue) ||
        asString(place?.address) ||
        asString(place?.category) ||
        asString(place?.date) ||
        "",
      image: pickImage(place),
    });
  });

  return result;
};

const getImageUrls = (memory: UserMemory): string[] => {
  const urls: string[] = [];
  const anyMemory = memory as any;

  if (Array.isArray(anyMemory.image_urls)) {
    urls.push(
      ...anyMemory.image_urls.filter(
        (url: unknown): url is string =>
          typeof url === "string" && url.trim().length > 0,
      ),
    );
  }

  if (
    typeof anyMemory.image_url === "string" &&
    anyMemory.image_url.trim().length > 0
  ) {
    urls.push(anyMemory.image_url);
  }

  return [...new Set(urls)];
};

const getMemoryItem = (memory: UserMemory): any =>
  (memory as any).item || (memory as any).attraction || null;

const getMemoryType = (memory: UserMemory): MemoryItemType => {
  const type = (memory as any).item_type as MemoryItemType | undefined;
  return type && ITEM_TYPE_META[type] ? type : "attraction";
};

const formatMemoryDate = (value?: string): string => {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const wasEdited = (memory: UserMemory): boolean => {
  if (!memory.created_at || !memory.updated_at) return false;

  const created = new Date(memory.created_at).getTime();
  const updated = new Date(memory.updated_at).getTime();

  if (Number.isNaN(created) || Number.isNaN(updated)) return false;

  return updated - created > 60 * 1000;
};

const getErrorMessage = (error: any, fallback: string): string =>
  error?.response?.data?.message || error?.message || fallback;

/* =========================================================
   IMAGE WITH FALLBACK (consistent for every type)
========================================================= */

const SafeImage: React.FC<{
  src?: string;
  alt: string;
  className?: string;
  fallback: React.ReactNode;
  loading?: "lazy" | "eager";
}> = ({ src, alt, className, fallback, loading }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) return <>{fallback}</>;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => setFailed(true)}
    />
  );
};

/* =========================================================
   COMPONENT
========================================================= */

const Memories: React.FC = () => {
  const history = useHistory();

  const { user, userToken, loading: authLoading } = useAuth();

  const [memories, setMemories] = useState<UserMemory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  /* Filter */
  const [activeFilter, setActiveFilter] = useState<MemoryFilter>("all");

  /* View */
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [viewingMemory, setViewingMemory] = useState<UserMemory | null>(null);

  /* Delete */
  const [deletingMemoryId, setDeletingMemoryId] = useState<string | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<UserMemory | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  /* Add / Edit */
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingMemory, setEditingMemory] = useState<UserMemory | null>(null);
  const [formItemType, setFormItemType] =
    useState<MemoryItemType>("attraction");
  const [formItemId, setFormItemId] = useState<string>("");
  const [formItemName, setFormItemName] = useState<string>("");
  const [placeSearch, setPlaceSearch] = useState<string>("");

  const [placesByType, setPlacesByType] = useState<
    Partial<Record<MemoryItemType, PlaceOption[]>>
  >({});
  const placesRef = useRef<Partial<Record<MemoryItemType, PlaceOption[]>>>({});

  const [loadingPlaces, setLoadingPlaces] = useState<boolean>(false);
  const [placesError, setPlacesError] = useState<string>("");
  const [formCaption, setFormCaption] = useState<string>("");
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([]);
  const [savingMemory, setSavingMemory] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [formError, setFormError] = useState<string>("");

  const newPhotosRef = useRef<NewPhoto[]>([]);

  useEffect(() => {
    newPhotosRef.current = newPhotos;
  }, [newPhotos]);

  const revokePreviews = useCallback((photos: NewPhoto[]) => {
    photos.forEach((photo) => URL.revokeObjectURL(photo.url));
  }, []);

  const clearNewPhotos = useCallback(() => {
    revokePreviews(newPhotosRef.current);
    newPhotosRef.current = [];
    setNewPhotos([]);
  }, [revokePreviews]);

  useEffect(() => {
    return () => revokePreviews(newPhotosRef.current);
  }, [revokePreviews]);

  /* Fetch memories */
  const fetchMemories = useCallback(async (): Promise<void> => {
    if (authLoading) return;

    if (!user || !userToken) {
      setMemories([]);
      setLoading(false);
      setError("Please log in to view your memories.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result: any = await getMyMemories();
      const list = Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result)
          ? result
          : [];

      setMemories(list);
    } catch (fetchError: any) {
      console.error("Fetch memories error:", fetchError);

      setError(
        fetchError?.response?.status === 401
          ? "Your session has expired. Please log in again."
          : getErrorMessage(fetchError, "Failed to load your memories."),
      );
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, userToken]);

  useEffect(() => {
    if (!authLoading) void fetchMemories();
  }, [authLoading, fetchMemories]);

  const handleGoToAttractions = (): void => {
    history.push("/attractions");
  };

  /* Filtering */
  const typeCounts = useMemo(() => {
    const counts: Record<MemoryFilter, number> = {
      all: memories.length,
      attraction: 0,
      accommodation: 0,
      restaurant: 0,
      event: 0,
    };

    memories.forEach((memory) => {
      counts[getMemoryType(memory)] += 1;
    });

    return counts;
  }, [memories]);

  const filteredMemories = useMemo(
    () =>
      activeFilter === "all"
        ? memories
        : memories.filter((memory) => getMemoryType(memory) === activeFilter),
    [memories, activeFilter],
  );

  /* View handlers */
  const openViewMemoryModal = (memory: UserMemory): void => {
    setViewingMemory(memory);
    setShowViewModal(true);
  };

  const closeViewMemoryModal = (): void => {
    setShowViewModal(false);
    setViewingMemory(null);
  };

  /* Place loading */
  const loadPlaces = useCallback(
    async (type: MemoryItemType, force = false): Promise<void> => {
      const cached = placesRef.current[type];

      if (!force && cached && cached.length > 0) return;

      try {
        setLoadingPlaces(true);
        setPlacesError("");

        const raw = await getMemoryPlaces(type);
        const places = normalizePlaces(raw);

        placesRef.current[type] = places;

        setPlacesByType((previous) => ({
          ...previous,
          [type]: places,
        }));
      } catch (loadError: any) {
        console.error(`Failed to load ${type} places:`, loadError);

        setPlacesError(
          getErrorMessage(
            loadError,
            `Could not load ${ITEM_TYPE_META[type].label.toLowerCase()}.`,
          ),
        );
      } finally {
        setLoadingPlaces(false);
      }
    },
    [],
  );

  const visiblePlaces = useMemo(() => {
    const list = placesByType[formItemType] || [];
    const query = placeSearch.trim().toLowerCase();

    if (!query) return list;

    return list.filter(
      (place) =>
        place.name.toLowerCase().includes(query) ||
        place.subtitle.toLowerCase().includes(query),
    );
  }, [placesByType, formItemType, placeSearch]);

  /* Add / Edit handlers */
  const resetFormState = (): void => {
    clearNewPhotos();
    setFormCaption("");
    setExistingImages([]);
    setFormItemId("");
    setFormItemName("");
    setPlaceSearch("");
    setFormError("");
    setPlacesError("");
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

    const startType: MemoryItemType =
      activeFilter === "all" ? "attraction" : activeFilter;

    setFormMode("add");
    setFormItemType(startType);
    setShowFormModal(true);

    void loadPlaces(startType);
  };

  const openEditMemoryModal = (memory: UserMemory): void => {
    setError("");
    setSuccessMessage("");
    resetFormState();

    const itemType = getMemoryType(memory);

    setFormMode("edit");
    setEditingMemory(memory);
    setFormItemType(itemType);
    setFormItemId(String((memory as any).item_id || ""));
    setFormItemName(getItemName(getMemoryItem(memory), itemType));
    setFormCaption(memory.caption || "");
    setExistingImages(getImageUrls(memory));
    setShowFormModal(true);
  };

  const handleEditFromViewer = (): void => {
    if (!viewingMemory) return;

    const memoryToEdit = viewingMemory;

    closeViewMemoryModal();
    openEditMemoryModal(memoryToEdit);
  };

  const closeFormModal = (): void => {
    if (savingMemory) return;

    resetFormState();
    setShowFormModal(false);
  };

  const handleChangeItemType = (type: MemoryItemType): void => {
    if (type === formItemType) return;

    setFormItemType(type);
    setFormItemId("");
    setFormItemName("");
    setPlaceSearch("");
    setFormError("");
    setPlacesError("");

    void loadPlaces(type);
  };

  const handleSelectPlace = (place: PlaceOption): void => {
    setFormItemId(place.id);
    setFormItemName(place.name);
    setFormError("");
  };

  /* Photos */
  const handlePhotosChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";

    if (selectedFiles.length === 0) return;

    setFormError("");

    const existingKeys = new Set(
      newPhotosRef.current.map((photo) => photo.key),
    );

    const accepted: NewPhoto[] = [];
    let wrongType = 0;
    let tooLarge = 0;

    selectedFiles.forEach((file) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        wrongType++;
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        tooLarge++;
        return;
      }

      const key = `${file.name}-${file.size}-${file.lastModified}`;

      if (existingKeys.has(key)) return;

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

    if (problems.length > 0) setFormError(problems.join(" "));
  };

  const handleRemoveNewPhoto = (photoId: string): void => {
    setFormError("");

    setNewPhotos((previous) => {
      const removed = previous.find((photo) => photo.id === photoId);

      if (removed) URL.revokeObjectURL(removed.url);

      return previous.filter((photo) => photo.id !== photoId);
    });
  };

  const handleRemoveExistingPhoto = (url: string): void => {
    setFormError("");
    setExistingImages((previous) =>
      previous.filter((imageUrl) => imageUrl !== url),
    );
  };

  /* Save */
  const handleSaveMemory = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (savingMemory) return;

    setFormError("");
    setError("");
    setSuccessMessage("");

    if (!user || !userToken) {
      setFormError("Your session has expired. Please log in again.");
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
      setFormError("Your caption must be 500 characters or less.");
      return;
    }

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
          photo.file.name.split(".").pop()?.toLowerCase() || "jpg";

        const fileName = `${Date.now()}-${index}-${Math.random()
          .toString(36)
          .slice(2)}.${extension}`;

        const safeItemId = formItemId.replace(/[^a-zA-Z0-9_-]/g, "_");
        const filePath = `${userId}/${formItemType}/${safeItemId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(MEMORY_BUCKET)
          .upload(filePath, photo.file, {
            cacheControl: "3600",
            upsert: false,
            contentType: photo.file.type,
          });

        if (uploadError) throw uploadError;

        uploadedPaths.push(filePath);

        const { data: publicUrlData } = supabase.storage
          .from(MEMORY_BUCKET)
          .getPublicUrl(filePath);

        const imageUrl = publicUrlData?.publicUrl || "";

        if (!imageUrl) {
          throw new Error("The uploaded image URL could not be created.");
        }

        newUrls[index] = imageUrl;
        setUploadProgress((previous) => previous + 1);
      };

      for (
        let start = 0;
        start < photosToUpload.length;
        start += UPLOAD_BATCH_SIZE
      ) {
        const batch = photosToUpload.slice(start, start + UPLOAD_BATCH_SIZE);

        await Promise.all(
          batch.map((photo, offset) => uploadOne(photo, start + offset)),
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

      if (uploadedPaths.length > 0) {
        try {
          await supabase.storage.from(MEMORY_BUCKET).remove(uploadedPaths);
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

  /* Delete */
  const handleOpenDeleteModal = (memory: UserMemory): void => {
    setSelectedMemory(memory);
    setShowDeleteModal(true);
    setError("");
    setSuccessMessage("");
  };

  const handleCloseDeleteModal = (): void => {
    if (deletingMemoryId) return;

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

      const result: any = await deleteMyMemory(selectedMemory.id);

      setMemories((current) =>
        current.filter((memory) => memory.id !== selectedMemory.id),
      );

      setSuccessMessage(result?.message || "Memory deleted successfully.");

      setSelectedMemory(null);
      setShowDeleteModal(false);
    } catch (deleteError: any) {
      console.error("Delete memory error:", deleteError);

      setError(getErrorMessage(deleteError, "Failed to delete this memory."));
    } finally {
      setDeletingMemoryId(null);
    }
  };

  const totalPhotos = existingImages.length + newPhotos.length;

  const saveButtonLabel = savingMemory
    ? newPhotos.length > 1
      ? `Saving ${Math.min(uploadProgress, newPhotos.length)}/${newPhotos.length}...`
      : "Saving Memory..."
    : formMode === "edit"
      ? "Save Changes"
      : "Save Memory";

  const FormTypeIcon = ITEM_TYPE_META[formItemType].icon;

  const filterLabel =
    activeFilter === "all" ? "All memories" : ITEM_TYPE_META[activeFilter].label;

  return (
    <>
      <div className="page-enter memories-page">
        <section className="memories-header">
          <div className="memories-header-inner">
            <h1 className="memories-title">MY MEMORIES</h1>
            <p className="memories-subtitle">
              Keep your favorite moments and experiences from exploring
              Calbayog City.
            </p>
          </div>
        </section>

        <Container className="memories-container">
          <div className="memories-top-row">
            <div className="memories-intro">
              <div className="memories-intro-icon">
                <Camera size={18} strokeWidth={1.9} />
              </div>
              <div>
                <div className="memories-intro-label">Personal collection</div>
                <div className="memories-intro-title">Your travel moments</div>
              </div>
            </div>

            <Button className="memories-add-button" onClick={openAddMemoryModal}>
              <Plus size={15} strokeWidth={2.2} />
              Add Memory
            </Button>
          </div>

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

          {/* CATEGORY FILTER */}
          {!authLoading && !loading && memories.length > 0 && (
            <div className="category-pills">
              {FILTER_ORDER.map((filter) => {
                const isActive = activeFilter === filter;
                const Icon =
                  filter === "all" ? Globe2 : ITEM_TYPE_META[filter].icon;
                const label =
                  filter === "all" ? "All" : ITEM_TYPE_META[filter].label;

                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`category-pill ${
                      isActive ? "category-pill-active" : ""
                    }`}
                  >
                    <Icon size={16} strokeWidth={1.9} />
                    <span>{label}</span>
                    <span className="category-pill-count">
                      {typeCounts[filter]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {!authLoading && !loading && memories.length > 0 && (
            <div className="memories-results-bar">
              <div className="memories-results-left">
                <div className="memories-results-icon">
                  <ImageIcon size={17} strokeWidth={1.9} />
                </div>
                <div>
                  <div className="memories-results-label">Showing</div>
                  <div className="memories-results-count">
                    <strong>{filteredMemories.length}</strong> saved moment
                    {filteredMemories.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              <div className="memories-results-right">
                <span className="memories-results-category">{filterLabel}</span>

                {activeFilter !== "all" && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setActiveFilter("all")}
                    className="memories-clear-button"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          )}

          {authLoading || loading ? (
            <div className="memories-loading">
              <div className="loading-icon">
                <Spinner animation="border" size="sm" />
              </div>
              <div className="loading-title">Loading memories...</div>
              <p className="loading-subtitle">Please wait a moment.</p>
            </div>
          ) : memories.length === 0 ? (
            <div className="memories-empty-state">
              <div className="empty-icon">
                <Camera size={29} strokeWidth={1.6} />
              </div>
              <h3>No memories yet</h3>
              <p>
                Start exploring Calbayog City and save your favorite travel
                moments here.
              </p>
              <Button className="empty-button" onClick={handleGoToAttractions}>
                <Compass size={15} strokeWidth={1.9} />
                Explore attractions
              </Button>
            </div>
          ) : filteredMemories.length === 0 ? (
            <div className="memories-empty-state">
              <div className="empty-icon">
                <Camera size={29} strokeWidth={1.6} />
              </div>
              <h3>No {filterLabel.toLowerCase()} memories</h3>
              <p>You have not saved any memories in this category yet.</p>
              <Button
                className="empty-button"
                onClick={() => setActiveFilter("all")}
              >
                <Globe2 size={15} strokeWidth={1.9} />
                View all memories
              </Button>
            </div>
          ) : (
            <Row className="memories-grid">
              {filteredMemories.map((memory) => {
                const imageUrls = getImageUrls(memory);
                const itemType = getMemoryType(memory);
                const typeMeta = ITEM_TYPE_META[itemType];
                const TypeIcon = typeMeta.icon;
                const item = getMemoryItem(memory);
                const placeName = getItemName(item, itemType);
                const firstImage = imageUrls[0] || pickImage(item) || "";
                const busy = deletingMemoryId === memory.id;

                return (
                  <Col
                    xs={12}
                    sm={6}
                    lg={4}
                    key={memory.id}
                    className="memory-col"
                  >
                    <Card
                      className="memory-card h-100"
                      role="button"
                      tabIndex={busy ? -1 : 0}
                      aria-label={`View memory for ${placeName}`}
                      aria-haspopup="dialog"
                      onClick={() => {
                        if (!busy) openViewMemoryModal(memory);
                      }}
                      onKeyDown={(event) => {
                        if (
                          !busy &&
                          (event.key === "Enter" || event.key === " ") &&
                          event.target === event.currentTarget
                        ) {
                          event.preventDefault();
                          openViewMemoryModal(memory);
                        }
                      }}
                    >
                      <div className="memory-image-wrapper">
                        <SafeImage
                          src={firstImage}
                          alt={placeName}
                          className="memory-image"
                          fallback={
                            <div className="memory-image-placeholder">
                              <TypeIcon size={30} strokeWidth={1.5} />
                              <span>No image available</span>
                            </div>
                          }
                        />

                        {firstImage && (
                          <div className="memory-image-overlay" />
                        )}

                        <div className="memory-type-badge">
                          <TypeIcon size={12} strokeWidth={2} />
                          {typeMeta.singular}
                        </div>

                        {imageUrls.length > 1 && (
                          <div className="memory-image-count">
                            <ImageIcon size={12} strokeWidth={2} />
                            {imageUrls.length}
                          </div>
                        )}

                        {firstImage && (
                          <div className="memory-location-badge">
                            <span>{placeName}</span>
                          </div>
                        )}
                      </div>

                      <Card.Body className="memory-card-body">
                        <div className="memory-date">
                          {formatMemoryDate(memory.created_at)}
                          {wasEdited(memory) && (
                            <span className="memory-edited-tag">Edited</span>
                          )}
                        </div>

                        <h3 className="memory-attraction-name">{placeName}</h3>

                        <p className="memory-caption">{memory.caption}</p>

                        <div className="memory-card-footer">
                          <div className="memory-card-type">
                            <TypeIcon size={13} strokeWidth={1.8} />
                            {typeMeta.singular} memory
                          </div>

                          <div className="memory-card-actions">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="memory-view-button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openViewMemoryModal(memory);
                              }}
                              disabled={busy}
                            >
                              <Eye size={13} strokeWidth={1.9} />
                              View
                            </Button>

                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="memory-edit-button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openEditMemoryModal(memory);
                              }}
                              disabled={busy}
                            >
                              <Pencil size={13} strokeWidth={1.9} />
                              Edit
                            </Button>

                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="memory-delete-button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleOpenDeleteModal(memory);
                              }}
                              disabled={busy}
                            >
                              <Trash2 size={13} strokeWidth={1.9} />
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

      {/* VIEW MEMORY MODAL */}
      <Modal
        show={showViewModal}
        onHide={closeViewMemoryModal}
        centered
        size="lg"
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>Travel Memory</Modal.Title>
        </Modal.Header>

        <Modal.Body className="memory-view-body">
          {viewingMemory &&
            (() => {
              const imageUrls = getImageUrls(viewingMemory);
              const itemType = getMemoryType(viewingMemory);
              const typeMeta = ITEM_TYPE_META[itemType];
              const placeName = getItemName(
                getMemoryItem(viewingMemory),
                itemType,
              );

              return (
                <>
                  <div className="memory-view-heading">
                    <div className="memory-view-place-type">
                      {typeMeta.singular} memory
                    </div>
                    <h3>{placeName}</h3>
                    <p>
                      {formatMemoryDate(viewingMemory.created_at)}
                      {wasEdited(viewingMemory) && (
                        <span className="memory-view-edited">Edited</span>
                      )}
                    </p>
                  </div>

                  {imageUrls.length > 0 ? (
                    <>
                      <div className="memory-view-gallery-heading">
                        <span>Memory photos</span>
                        <span>
                          {imageUrls.length} photo
                          {imageUrls.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="memory-view-gallery">
                        {imageUrls.map((url, index) => (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            key={`${url}-${index}`}
                            className="memory-view-photo"
                            aria-label={`Open photo ${index + 1} in a new tab`}
                          >
                            <img
                              src={url}
                              alt={`${placeName} memory photo ${index + 1}`}
                              loading="lazy"
                            />
                            <span className="memory-view-photo-number">
                              {index + 1} / {imageUrls.length}
                            </span>
                          </a>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="memory-view-no-photos">
                      <Camera size={28} />
                      <p>No photos are available for this memory.</p>
                    </div>
                  )}

                  <section className="memory-view-note">
                    <div className="memory-view-note-heading">
                      <div className="memory-view-note-icon">
                        <Pencil size={15} />
                      </div>
                      <div>
                        <h4>Your Note</h4>
                        <p>Your saved memory and experience</p>
                      </div>
                    </div>

                    <p className="memory-view-note-text">
                      {viewingMemory.caption?.trim() ||
                        "No note was added to this memory."}
                    </p>
                  </section>

                  <div className="memory-view-footer">
                    <span>
                      {imageUrls.length} photo
                      {imageUrls.length !== 1 ? "s" : ""}
                    </span>

                    <Button
                      onClick={handleEditFromViewer}
                      style={{
                        backgroundColor: CALBAYOG_BLUE,
                        borderColor: CALBAYOG_BLUE,
                      }}
                    >
                      <Pencil size={14} className="me-1" />
                      Edit Memory
                    </Button>
                  </div>
                </>
              );
            })()}
        </Modal.Body>
      </Modal>

      {/* ADD / EDIT MEMORY MODAL
          The <form> lives INSIDE Modal.Body so Bootstrap's scrollable
          layout works. The Save button submits it via form="memory-form". */}
      <Modal
        show={showFormModal}
        onHide={closeFormModal}
        centered
        size="lg"
        scrollable
        backdrop={savingMemory ? "static" : true}
        keyboard={!savingMemory}
      >
        <Modal.Header closeButton={!savingMemory}>
          <Modal.Title>
            {formMode === "edit" ? "Edit Your Memory" : "Share a Travel Memory"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form id="memory-form" onSubmit={handleSaveMemory} noValidate>
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
                          onClick={() => handleChangeItemType(type)}
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
                      onChange={(event) => setPlaceSearch(event.target.value)}
                      placeholder={ITEM_TYPE_META[formItemType].searchHint}
                      disabled={savingMemory}
                    />
                  </div>

                  <div className="memory-place-list">
                    {loadingPlaces && visiblePlaces.length === 0 ? (
                      <div className="memory-place-empty">
                        <Spinner
                          animation="border"
                          size="sm"
                          className="me-2"
                        />
                        Loading...
                      </div>
                    ) : placesError && visiblePlaces.length === 0 ? (
                      <div className="memory-place-empty memory-place-error">
                        <div>{placesError}</div>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="mt-2"
                          onClick={() => void loadPlaces(formItemType, true)}
                        >
                          <RefreshCw size={13} className="me-1" />
                          Try again
                        </Button>
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
                        const selected = formItemId === place.id;

                        return (
                          <button
                            type="button"
                            key={place.id}
                            className={`memory-place-item ${
                              selected ? "memory-place-item-active" : ""
                            }`}
                            onClick={() => handleSelectPlace(place)}
                            disabled={savingMemory}
                          >
                            <SafeImage
                              src={place.image}
                              alt=""
                              loading="lazy"
                              fallback={
                                <span className="memory-place-item-thumb">
                                  <FormTypeIcon size={16} strokeWidth={1.7} />
                                </span>
                              }
                            />

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

            <div className="memory-form-section">
              <div className="memory-form-label">Photos</div>

              <div className="memory-photo-grid">
                {existingImages.map((url, index) => (
                  <div className="memory-photo-tile" key={url}>
                    <img src={url} alt={`Saved photo ${index + 1}`} />
                    <button
                      type="button"
                      className="memory-photo-remove"
                      onClick={() => handleRemoveExistingPhoto(url)}
                      disabled={savingMemory}
                      aria-label={`Remove saved photo ${index + 1}`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {newPhotos.map((photo, index) => (
                  <div className="memory-photo-tile" key={photo.id}>
                    <img src={photo.url} alt={`New photo ${index + 1}`} />
                    <button
                      type="button"
                      className="memory-photo-remove"
                      onClick={() => handleRemoveNewPhoto(photo.id)}
                      disabled={savingMemory}
                      aria-label={`Remove new photo ${index + 1}`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {!savingMemory && (
                  <label className="memory-photo-add">
                    <ImagePlus size={20} strokeWidth={1.8} />
                    {totalPhotos === 0 ? "Add photos" : "Add more"}
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

            <div className="memory-form-section">
              <Form.Group>
                <div className="memory-form-label">Caption</div>
                <Form.Control
                  as="textarea"
                  rows={4}
                  maxLength={500}
                  placeholder="Tell us about this moment..."
                  value={formCaption}
                  onChange={(event) => setFormCaption(event.target.value)}
                  disabled={savingMemory}
                />
                <Form.Text muted>{formCaption.length}/500 characters</Form.Text>
              </Form.Group>
            </div>
          </Form>
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
            form="memory-form"
            disabled={savingMemory}
            style={{
              backgroundColor: CALBAYOG_BLUE,
              borderColor: CALBAYOG_BLUE,
            }}
          >
            {savingMemory && (
              <Spinner animation="border" size="sm" className="me-2" />
            )}
            {saveButtonLabel}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} centered>
        <Modal.Header closeButton={!deletingMemoryId}>
          <Modal.Title>Delete Memory</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          Are you sure you want to delete this memory? This action cannot be
          undone.
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
                <Spinner animation="border" size="sm" className="me-2" />
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

      <style>{`
        @font-face {
          font-family: "Barabara";
          src: url("/fonts/BARABARA-final.otf") format("opentype");
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }

        .memories-page {
          min-height: 100vh;
          background: #fff;
          color: #171a18;
          padding-bottom: 60px;
        }

        .memories-header {
          width: 100%;
          background: #fff;
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
          line-height: .95;
          letter-spacing: .015em;
          color: ${CALBAYOG_BLUE};
        }

        .memories-subtitle {
          max-width: 590px;
          margin: 6px 0 0;
          font-family: "Nunito", "Poppins", "Segoe UI", sans-serif;
          font-size: .81rem;
          line-height: 1.55;
          font-weight: 500;
          color: #737b76;
        }

        .memories-container {
          width: 100%;
          max-width: 1240px;
          padding: 0 0 60px;
          margin: 0 auto;
        }

        .memories-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 18px;
          padding: 15px 0;
          border-top: 1px solid #f0f2f0;
          border-bottom: 1px solid #f0f2f0;
        }

        .memories-intro {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .memories-intro-icon,
        .memories-results-icon {
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
          font-size: .63rem;
          line-height: 1.2;
          color: #8b938e;
        }

        .memories-intro-title {
          margin-top: 2px;
          font-family: "Poppins", sans-serif;
          font-size: .77rem;
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
          color: #fff !important;
          font-family: "Nunito", sans-serif;
          font-size: .72rem !important;
          font-weight: 800 !important;
          box-shadow: 0 5px 15px rgba(45,49,149,.13);
          transition: background .2s ease, box-shadow .2s ease;
        }

        .memories-add-button:hover,
        .memories-add-button:focus {
          background: #242778 !important;
          color: #fff !important;
          box-shadow: 0 7px 19px rgba(45,49,149,.2);
        }

        .memories-alert {
          border-radius: 12px;
          font-family: "Nunito", sans-serif;
          font-size: .78rem;
        }

        /* CATEGORY FILTER PILLS */
        .category-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          overflow-y: hidden;
          margin: 0 0 5px;
          padding: 6px 0 14px;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }

        .category-pills::-webkit-scrollbar {
          display: none;
        }

        .category-pill {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 39px;
          padding: 8px 15px;
          border: 1px solid #e3e7e4;
          border-radius: 999px;
          background: #fff;
          color: #68716c;
          font-family: "Nunito", "Segoe UI", sans-serif;
          font-size: .74rem;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
          transition: color .2s ease, background .2s ease, border-color .2s ease, box-shadow .2s ease;
          -webkit-tap-highlight-color: transparent;
        }

        .category-pill:hover,
        .category-pill-active {
          color: ${CALBAYOG_BLUE};
          border-color: ${CALBAYOG_BLUE};
          background: #eef0ff;
        }

        .category-pill-active {
          box-shadow: 0 5px 16px rgba(20,30,24,.07);
        }

        .category-pill-count {
          min-width: 20px;
          padding: 1px 6px;
          border-radius: 999px;
          background: rgba(45,49,149,.1);
          color: ${CALBAYOG_BLUE};
          font-size: .62rem;
          font-weight: 800;
          text-align: center;
        }

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

        .memories-results-left,
        .memories-results-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .memories-results-label {
          font-family: "Nunito", sans-serif;
          font-size: .64rem;
          color: #8b938e;
          line-height: 1.2;
        }

        .memories-results-count {
          margin-top: 2px;
          font-family: "Poppins", sans-serif;
          font-size: .74rem;
          font-weight: 700;
          color: #252b27;
        }

        .memories-results-category {
          font-family: "Nunito", sans-serif;
          font-size: .69rem;
          font-weight: 700;
          color: #858d88;
        }

        .memories-clear-button {
          border-radius: 999px !important;
          padding: 5px 11px !important;
          font-family: "Nunito", sans-serif;
          font-size: .66rem !important;
          font-weight: 800 !important;
        }

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
          font-size: .82rem;
          font-weight: 700;
          color: #202521;
        }

        .loading-subtitle {
          margin: 4px 0 0;
          color: #89918c;
          font-family: "Nunito", sans-serif;
          font-size: .72rem;
        }

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
          font-size: .77rem;
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
          font-size: .73rem !important;
          font-weight: 800 !important;
        }

        .empty-button:hover,
        .empty-button:focus {
          background: #eef0ff !important;
          color: ${CALBAYOG_BLUE} !important;
        }

        /* CARD - identical for all four types */
        .memory-card {
          width: 100%;
          overflow: hidden;
          border: 1px solid #e5e7f5;
          border-radius: 20px;
          background: #fff;
          box-shadow: 0 8px 24px rgba(31, 36, 93, .07);
          cursor: pointer;
          outline: none;
          transition: transform .24s ease, box-shadow .24s ease, border-color .24s ease;
        }

        .memory-card:hover {
          transform: translateY(-5px);
          border-color: #c9ccef;
          box-shadow: 0 18px 38px rgba(31, 36, 93, .14);
        }

        .memory-card:focus-visible {
          border-color: ${CALBAYOG_BLUE};
          box-shadow: 0 0 0 3px rgba(45, 49, 149, .2), 0 12px 28px rgba(31, 36, 93, .1);
        }

        .memory-card:active {
          transform: translateY(-1px);
        }

        .memory-image-wrapper {
          position: relative;
          flex: 0 0 auto;
          height: 238px;
          overflow: hidden;
          background: linear-gradient(135deg, #eef0ff, #f7f8fb);
        }

        .memory-image {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          transition: transform .45s ease;
        }

        .memory-card:hover .memory-image {
          transform: scale(1.045);
        }

        .memory-image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(15,20,30,.58), rgba(15,20,30,.02) 55%);
          pointer-events: none;
        }

        .memory-type-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,.94);
          color: ${CALBAYOG_BLUE};
          font-family: "Nunito", sans-serif;
          font-size: .66rem;
          font-weight: 800;
          box-shadow: 0 2px 8px rgba(20,23,35,.12);
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
          color: #fff;
          font-family: "Nunito", sans-serif;
          font-size: .68rem;
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
          background: rgba(25,28,45,.72);
          color: #fff;
          font-family: "Nunito", sans-serif;
          font-size: .68rem;
          font-weight: 800;
        }

        .memory-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 9px;
          background: #f1f3ff;
          color: #9297bd;
          font-family: "Nunito", sans-serif;
          font-size: .73rem;
        }

        .memory-card-body {
          display: flex;
          flex: 1 1 auto;
          flex-direction: column;
          padding: 20px !important;
        }

        .memory-date {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 7px;
          color: #969e99;
          font-family: "Nunito", sans-serif;
          font-size: .67rem;
          font-weight: 700;
        }

        .memory-edited-tag {
          padding: 2px 7px;
          border-radius: 999px;
          background: #eef0ff;
          color: ${CALBAYOG_BLUE};
          font-size: .58rem;
          font-weight: 800;
        }

        .memory-attraction-name {
          display: -webkit-box;
          overflow: hidden;
          min-height: 2.8em;
          margin: 0 0 9px;
          color: #252b27;
          font-family: "Poppins", sans-serif;
          font-size: .98rem;
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
          color: #69736e;
          font-family: "Nunito", sans-serif;
          font-size: .79rem;
          font-weight: 500;
          line-height: 1.65;
          overflow-wrap: anywhere;
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
          font-size: .65rem;
          font-weight: 700;
        }

        .memory-card-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 6px;
        }

        .memory-view-button,
        .memory-edit-button,
        .memory-delete-button {
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          gap: 5px;
          border-radius: 999px !important;
          padding: 5px 10px !important;
          font-family: "Nunito", sans-serif;
          font-size: .65rem !important;
          font-weight: 800 !important;
        }

        .memory-view-button,
        .memory-edit-button {
          border-color: #cfd2f1 !important;
          color: ${CALBAYOG_BLUE} !important;
        }

        .memory-view-button:hover:not(:disabled),
        .memory-edit-button:hover:not(:disabled) {
          background: #eef0ff !important;
          border-color: ${CALBAYOG_BLUE} !important;
        }

        /* VIEW MODAL */
        .memory-view-body {
          padding: 22px !important;
        }

        .memory-view-heading {
          margin-bottom: 20px;
        }

        .memory-view-place-type {
          margin-bottom: 5px;
          color: ${CALBAYOG_BLUE};
          font-family: "Nunito", sans-serif;
          font-size: .68rem;
          font-weight: 800;
          letter-spacing: .06em;
          text-transform: uppercase;
        }

        .memory-view-heading h3 {
          margin: 0 0 6px;
          color: #252b27;
          font-family: "Poppins", sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .memory-view-heading p {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
          margin: 0;
          color: #8b938e;
          font-size: .75rem;
        }

        .memory-view-edited {
          padding: 3px 8px;
          border-radius: 999px;
          background: #eef0ff;
          color: ${CALBAYOG_BLUE};
          font-size: .65rem;
          font-weight: 800;
        }

        .memory-view-gallery-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 11px;
          color: #303631;
          font-family: "Poppins", sans-serif;
          font-size: .78rem;
          font-weight: 700;
        }

        .memory-view-gallery-heading span:last-child {
          color: #8b938e;
          font-family: "Nunito", sans-serif;
          font-size: .7rem;
          font-weight: 700;
        }

        .memory-view-gallery {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        .memory-view-photo {
          position: relative;
          display: block;
          min-width: 0;
          overflow: hidden;
          border: 1px solid #e7e9f1;
          border-radius: 12px;
          background: #f1f3f5;
        }

        .memory-view-photo img {
          display: block;
          width: 100%;
          height: 250px;
          object-fit: contain;
          background: #f1f3f5;
          transition: transform .2s ease;
        }

        .memory-view-photo:hover img {
          transform: scale(1.025);
        }

        .memory-view-photo-number {
          position: absolute;
          right: 8px;
          bottom: 8px;
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(20,23,35,.72);
          color: #fff;
          font-family: "Nunito", sans-serif;
          font-size: .65rem;
          font-weight: 800;
        }

        .memory-view-no-photos {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 30px 15px;
          margin-bottom: 22px;
          border: 1px dashed #dfe3ed;
          border-radius: 12px;
          color: #9297bd;
          background: #fafaff;
          text-align: center;
        }

        .memory-view-no-photos p {
          margin: 0;
          font-family: "Nunito", sans-serif;
          font-size: .78rem;
        }

        .memory-view-note {
          padding: 17px;
          border: 1px solid #e5e7f4;
          border-radius: 13px;
          background: #fafaff;
        }

        .memory-view-note-heading {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 13px;
        }

        .memory-view-note-icon {
          width: 34px;
          height: 34px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: #eef0ff;
          color: ${CALBAYOG_BLUE};
        }

        .memory-view-note-heading h4 {
          margin: 0 0 2px;
          color: #252b27;
          font-family: "Poppins", sans-serif;
          font-size: .85rem;
          font-weight: 700;
        }

        .memory-view-note-heading p {
          margin: 0;
          color: #8b938e;
          font-family: "Nunito", sans-serif;
          font-size: .68rem;
        }

        .memory-view-note-text {
          margin: 0;
          color: #59635d;
          font-family: "Nunito", sans-serif;
          font-size: .86rem;
          line-height: 1.85;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .memory-view-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 18px;
          color: #858d88;
          font-family: "Nunito", sans-serif;
          font-size: .75rem;
        }

        /* ADD / EDIT FORM */
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
          font-size: .78rem;
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
          font-size: .62rem;
          font-weight: 800;
          letter-spacing: .06em;
          text-transform: uppercase;
        }

        .memory-place-fixed-name {
          color: #252b27;
          font-size: .82rem;
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
          background: #fff;
          color: #68716c;
          font-family: "Nunito", sans-serif;
          font-size: .68rem;
          font-weight: 800;
          cursor: pointer;
          transition: color .2s ease, border-color .2s ease, background .2s ease;
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
          background: #fff;
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
          font-size: .75rem;
        }

        .memory-place-list {
          max-height: 240px;
          overflow-y: auto;
          border: 1px solid #e4e7ed;
          border-radius: 12px;
          background: #fff;
        }

        .memory-place-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 26px 14px;
          color: #8b938e;
          font-family: "Nunito", sans-serif;
          font-size: .73rem;
          text-align: center;
        }

        .memory-place-error {
          color: #b4344d;
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
          background: #fff;
          text-align: left;
          cursor: pointer;
          transition: background .15s ease;
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
          font-size: .76rem;
          font-weight: 800;
        }

        .memory-place-item-text small {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #8b938e;
          font-family: "Nunito", sans-serif;
          font-size: .64rem;
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
          color: #fff;
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
          background: rgba(17,21,40,.72);
          color: #fff;
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
          background: #fff;
          color: ${CALBAYOG_BLUE};
          font-family: "Nunito", sans-serif;
          font-size: .66rem;
          font-weight: 800;
          text-align: center;
          cursor: pointer;
          transition: background .2s ease, border-color .2s ease;
        }

        .memory-photo-add:hover {
          border-color: ${CALBAYOG_BLUE};
          background: #eef0ff;
        }

        .memory-photo-add input {
          display: none;
        }

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
          font-size: .85rem;
          line-height: 1.65;
          overscroll-behavior: contain;
        }

        .modal-footer .btn {
          border-radius: 999px;
          font-family: "Nunito", sans-serif;
          font-size: .75rem;
          font-weight: 800;
        }

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

        @media (max-width: 767.98px) {
          .memories-header {
            padding: 25px 17px 16px;
          }

          .memories-title {
            font-size: 1.9rem;
          }

          .memories-subtitle {
            margin-top: 6px;
            font-size: .78rem;
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

          .memories-results-right {
            width: 100%;
            justify-content: space-between;
          }

          .memories-grid {
            row-gap: 28px !important;
          }

          .memory-image-wrapper {
            height: clamp(205px, 54vw, 270px);
          }

          .memory-card-body {
            padding: 17px !important;
          }

          .memory-card:hover {
            transform: none;
          }

          .memory-photo-grid {
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          }

          .memory-view-body {
            padding: 17px !important;
          }

          .memory-view-gallery {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }

          .memory-view-photo img {
            height: 190px;
          }
        }

        @media (max-width: 479.98px) {
          .memories-title {
            font-size: 1.8rem;
          }

          .memories-subtitle {
            font-size: .77rem;
          }

          .memory-card-footer {
            align-items: flex-start;
            flex-direction: column;
          }

          .memory-card-actions {
            align-self: stretch;
            width: 100%;
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .memory-card-actions .btn {
            min-width: 0;
            padding: 7px 5px !important;
            font-size: .68rem !important;
          }

          .memory-card-type {
            font-size: .7rem;
          }

          .memory-view-gallery {
            grid-template-columns: 1fr;
          }

          .memory-view-photo img {
            height: 250px;
          }

          .memory-view-footer {
            align-items: stretch;
            flex-direction: column;
          }

          .memory-view-footer .btn {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
};

export default Memories;
