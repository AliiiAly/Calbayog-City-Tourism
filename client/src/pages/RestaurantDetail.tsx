import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useHistory, useLocation, useParams } from "react-router-dom";
import { Col, Container, Row, Spinner } from "react-bootstrap";
import {
  ArrowLeft,
  Camera,
  Clock3,
  Globe2,
  Heart,
  MapPin,
  MapPinned,
  Maximize2,
  Phone,
  Share2,
  Tag,
  Utensils,
  X,
} from "lucide-react";
import {
  LayerGroup,
  LayersControl,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getRestaurant, createMyMemory, type Restaurant } from "../services/api";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";

const CALBAYOG_BLUE = "#2D3195";
const CALBAYOG_BLUE_SOFT = "#EEF0FF";
const TEXT = "#20232A";
const MUTED = "#727985";
const BORDER = "#E8EAF0";

const DEFAULT_LATITUDE = 12.0668;
const DEFAULT_LONGITUDE = 124.6041;

/* Restaurant pin design (same pin shape as the attraction map) */
const RESTAURANT_PIN_COLOR = "#E8590C";
const RESTAURANT_PIN_GLYPH = "🍽️";

/* =========================================================
   HELPERS
========================================================= */

const cleanString = (value: unknown): string =>
  value == null ? "" : String(value).trim();

const normalizeImages = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((v): v is string => typeof v === "string")
      .map((v) => v.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return [];
};

const websiteHref = (value: string): string =>
  !value ? "" : /^https?:\/\//i.test(value) ? value : `https://${value}`;

interface MapCoordinates {
  lat: number;
  lng: number;
}

interface RestaurantMapPlace {
  id: string;
  name: string;
  cuisine: string;
  address: string;
  coordinates: MapCoordinates;
  isCurrent: boolean;
}

/*
 * Uses the saved map pin (location_lat / location_lng) first,
 * then falls back to other common coordinate field names.
 */
const getCoordinates = (item: any): MapCoordinates | null => {
  const lat = Number(
    item?.location_lat ??
      item?.locationLat ??
      item?.latitude ??
      item?.location?.lat ??
      item?.lat,
  );

  const lng = Number(
    item?.location_lng ??
      item?.locationLng ??
      item?.longitude ??
      item?.location?.lng ??
      item?.lng ??
      item?.lon,
  );

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng };
};

/* =========================================================
   MAP
========================================================= */

const SATELLITE_LABELS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";

const SATELLITE_ROADS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}";

const createRestaurantMarkerIcon = (isCurrent: boolean) =>
  L.divIcon({
    className: "calbayog-location-marker",
    html: `
      <div class="calbayog-marker-shell ${isCurrent ? "is-current" : ""}">
        <div class="calbayog-marker-pin" style="background:${RESTAURANT_PIN_COLOR}"></div>
        <div class="calbayog-marker-icon">${RESTAURANT_PIN_GLYPH}</div>
      </div>
    `,
    iconSize: [44, 52],
    iconAnchor: [22, 49],
    popupAnchor: [0, -47],
    tooltipAnchor: [0, -43],
  });

const MapRecenter: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, 17, { animate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, center[0], center[1]]);

  return null;
};

const MapScaleControl: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    const control = L.control.scale({
      imperial: false,
      metric: true,
      position: "bottomleft",
      maxWidth: 120,
    });

    control.addTo(map);

    return () => {
      control.remove();
    };
  }, [map]);

  return null;
};

const MapLocateControl: React.FC = () => {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      window.alert("Location services are not available in this browser.");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        map.flyTo(
          [position.coords.latitude, position.coords.longitude],
          Math.max(map.getZoom(), 16),
          { duration: 0.8 },
        );
        setLocating(false);
      },
      () => {
        window.alert(
          "Unable to get your location. Please allow location access and try again.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, [map]);

  return (
    <div className="leaflet-control leaflet-bar calbayog-map-custom-control">
      <button
        type="button"
        onClick={locate}
        title="My location"
        aria-label="Show my location"
        disabled={locating}
      >
        {locating ? "…" : "⌾"}
      </button>
    </div>
  );
};

interface TourismMapProps {
  center: [number, number];
  places: RestaurantMapPlace[];
}

const TourismMap: React.FC<TourismMapProps> = ({ center, places }) => {
  const icons = useMemo(
    () =>
      new Map(
        places.map((place) => [
          place.id,
          createRestaurantMarkerIcon(place.isCurrent),
        ]),
      ),
    [places],
  );

  return (
    <div className="detail-map-canvas">
      <MapContainer center={center} zoom={15} scrollWheelZoom className="detail-map">
        <MapRecenter center={center} />
        <MapScaleControl />

        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Satellite">
            <LayerGroup>
              <TileLayer
                attribution="Tiles &copy; Esri"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                zIndex={1}
              />
              <TileLayer
                attribution="Place and boundary labels &copy; Esri"
                url={SATELLITE_LABELS_URL}
                zIndex={2}
              />
              <TileLayer
                attribution="Transportation labels &copy; Esri"
                url={SATELLITE_ROADS_URL}
                zIndex={3}
              />
            </LayerGroup>
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Terrain">
            <TileLayer
              attribution='Map data &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors, <a href="https://opentopomap.org" target="_blank" rel="noopener noreferrer">OpenTopoMap</a>'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <MapLocateControl />

        {places.map((place) => (
          <Marker
            key={`restaurant-${place.id}-${place.name}`}
            position={[place.coordinates.lat, place.coordinates.lng]}
            icon={icons.get(place.id)}
            zIndexOffset={place.isCurrent ? 1000 : 0}
          >
            <Tooltip
              permanent
              direction="top"
              offset={[0, -4]}
              opacity={1}
              className={`calbayog-map-label ${place.isCurrent ? "current" : ""}`}
            >
              <span className="calbayog-map-label-name">{place.name}</span>
              {place.cuisine && (
                <span className="calbayog-map-label-sub">{place.cuisine}</span>
              )}
            </Tooltip>

            <Popup>
              <div className="detail-map-popup">
                <div
                  className={`detail-map-popup-badge ${place.isCurrent ? "current" : ""}`}
                >
                  <MapPin size={10} />
                  {place.isCurrent ? "Current restaurant" : "Restaurant"}
                </div>
                <h3 className="detail-map-popup-title">{place.name}</h3>
                {place.cuisine && (
                  <p className="detail-map-popup-category">{place.cuisine}</p>
                )}
                {place.address && (
                  <p className="detail-map-popup-address">{place.address}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

/* =========================================================
   INFO ITEM
========================================================= */

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  href?: string;
  external?: boolean;
}

const InfoItem: React.FC<InfoItemProps> = ({
  icon,
  label,
  children,
  href,
  external = false,
}) => {
  const content = (
    <div className="detail-info-item">
      <div className="detail-info-icon">{icon}</div>

      <div className="detail-info-copy">
        <div className="detail-info-label">{label}</div>
        <div className="detail-info-value">{children}</div>
      </div>
    </div>
  );

  if (!href) return content;

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="detail-info-link"
    >
      {content}
    </a>
  );
};


const MEMORY_UPLOAD_BATCH_SIZE = 3;
const MEMORY_MAX_PHOTOS = 8;
const MEMORY_MAX_FILE_BYTES = 15 * 1024 * 1024;

const optimizeMemoryImage = async (file: File): Promise<File> => {
  if (file.size <= 1.5 * 1024 * 1024 || !file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) { bitmap.close(); return file; }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob: Blob = await new Promise((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Image compression failed.")), "image/jpeg", 0.84));
    if (blob.size >= file.size) return file;
    const safeName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], safeName, { type: "image/jpeg", lastModified: Date.now() });
  } catch { return file; }
};

interface MemoryPhoto { id: string; file: File; url: string; }

/* =========================================================
   COMPONENT
========================================================= */

const RestaurantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const location = useLocation<{ from?: string }>();

  const handleSmartBack = useCallback(() => {
    const from = location.state?.from;

    // Prefer the exact in-app page that opened this detail page.
    if (
      typeof from === "string" &&
      from.startsWith("/") &&
      !from.startsWith("/restaurants/") &&
      !from.startsWith("/restaurant/")
    ) {
      history.push(from);
      return;
    }

    // If no source was passed, return to the previous browser-history entry.
    if (window.history.length > 1) {
      history.goBack();
      return;
    }

    // Safe fallback for a direct visit with no usable history.
    history.push("/restaurants");
  }, [history, location.state]);

  const auth = useAuth();
  const isUserAuthenticated = Boolean((auth as any)?.isUserAuthenticated && (auth as any)?.user);
  const [memoryNotice, setMemoryNotice] = useState("");
  const [showMemoryForm, setShowMemoryForm] = useState(false);
  const [memoryCaption, setMemoryCaption] = useState("");
  const [memoryPhotos, setMemoryPhotos] = useState<MemoryPhoto[]>([]);
  const [memorySubmitting, setMemorySubmitting] = useState(false);
  const [memoryProgress, setMemoryProgress] = useState(0);
  const [memoryError, setMemoryError] = useState("");
  const clearMemoryPhotos = () => { setMemoryPhotos((previous) => { previous.forEach((photo) => URL.revokeObjectURL(photo.url)); return []; }); };
  const handleAddMemories = () => { setMemoryNotice(""); setMemoryError(""); if (!isUserAuthenticated) { window.dispatchEvent(new Event("open-login-modal")); return; } setShowMemoryForm(true); };
  const handleMemoryPhotosChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []); event.target.value = ""; setMemoryError(""); if (!files.length) return;
    if (memoryPhotos.length + files.length > MEMORY_MAX_PHOTOS) { setMemoryError(`You can upload up to ${MEMORY_MAX_PHOTOS} photos per memory.`); return; }
    for (const file of files) { if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setMemoryError("Please choose JPG, PNG, or WEBP images only."); return; } if (file.size > MEMORY_MAX_FILE_BYTES) { setMemoryError("Each photo must be 15 MB or smaller."); return; } }
    setMemoryPhotos((previous) => [...previous, ...files.map((file) => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, file, url: URL.createObjectURL(file) }))]);
  };
  const handleRemoveMemoryPhoto = (photoId: string) => setMemoryPhotos((previous) => { const removed = previous.find((photo) => photo.id === photoId); if (removed) URL.revokeObjectURL(removed.url); return previous.filter((photo) => photo.id !== photoId); });
  const closeMemoryForm = () => { if (memorySubmitting) return; setShowMemoryForm(false); setMemoryCaption(""); clearMemoryPhotos(); setMemoryError(""); };
  const handleSubmitMemory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (memorySubmitting) return; setMemoryError(""); setMemoryNotice("");
    const userId = String((auth as any)?.user?.id || "").trim(); const restaurantId = cleanString(restaurant?.id ?? id); const caption = memoryCaption.trim(); const photos = [...memoryPhotos];
    if (!userId) { setMemoryError("Please log in before submitting a memory."); return; }
    if (!restaurantId || !photos.length) { setMemoryError("Please select at least one photo."); return; }
    if (!caption || caption.length > 500) { setMemoryError("Please enter a caption of 1–500 characters."); return; }
    const uploadedPaths: string[] = [];
    try {
      setMemorySubmitting(true); setMemoryProgress(0); const uploadedUrls: string[] = new Array(photos.length);
      const uploadOne = async (photo: MemoryPhoto, index: number) => {
        const uploadFile = await optimizeMemoryImage(photo.file); const extension = uploadFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const filePath = `${userId}/${restaurantId}/${Date.now()}-${index}-${Math.random().toString(36).slice(2)}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("memory-images").upload(filePath, uploadFile, { cacheControl: "3600", upsert: false, contentType: uploadFile.type }); if (uploadError) throw uploadError;
        uploadedPaths.push(filePath); const { data } = supabase.storage.from("memory-images").getPublicUrl(filePath); if (!data?.publicUrl) throw new Error("Could not create a public image URL."); uploadedUrls[index] = data.publicUrl; setMemoryProgress((previous) => previous + 1);
      };
      for (let start = 0; start < photos.length; start += MEMORY_UPLOAD_BATCH_SIZE) await Promise.all(photos.slice(start, start + MEMORY_UPLOAD_BATCH_SIZE).map((photo, offset) => uploadOne(photo, start + offset)));
      await createMyMemory({ attraction_id: restaurantId, item_type: "restaurant", item_id: restaurantId, caption, image_urls: uploadedUrls } as any);
      setShowMemoryForm(false); setMemoryCaption(""); clearMemoryPhotos(); setMemoryNotice("Your memory has been added successfully!");
    } catch (submitError: any) {
      console.error("Restaurant memory submission error:", submitError); if (uploadedPaths.length) { try { await supabase.storage.from("memory-images").remove(uploadedPaths); } catch { /* best-effort cleanup */ } }
      setMemoryError(submitError?.response?.data?.message || submitError?.message || "Unable to add your memory. Please try again.");
    } finally { setMemorySubmitting(false); }
  };

  const { isFavorite, getFavoriteCount, setFavoriteCount, toggleFavorite } =
    useFavorites();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeImg, setActiveImg] = useState(0);
  const [shareNotice, setShareNotice] = useState("");
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const routeId = cleanString(id);

    const load = async () => {
      setLoading(true);
      setErrorMessage("");

      if (!routeId) {
        setRestaurant(null);
        setErrorMessage("No restaurant ID was provided.");
        setLoading(false);
        return;
      }

      try {
        const response = await getRestaurant(routeId);
        const result = response?.data ?? null;

        if (!mounted) return;

        if (!result || !result.id) {
          setRestaurant(null);
          setErrorMessage(
            "The restaurant could not be found or is no longer available.",
          );
          return;
        }

        setRestaurant(result as Restaurant);
        setFavoriteCount(
          "restaurant",
          cleanString(result.id),
          Math.max(0, Number((result as any).favorites) || 0),
        );
      } catch (error) {
        console.error("Failed to load restaurant details:", error);

        if (mounted) {
          setRestaurant(null);
          setErrorMessage(
            "Unable to load this restaurant right now. Please try again.",
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [id, setFavoriteCount]);

  useEffect(() => {
    setActiveImg(0);
    setShareNotice("");
    setMapOpen(false);
  }, [id]);

  /* =====================================================
     DERIVED DATA
  ===================================================== */

  const images = useMemo(() => normalizeImages(restaurant?.images), [restaurant]);
  const safeActiveImg =
    activeImg >= 0 && activeImg < images.length ? activeImg : 0;
  const activeImage = images[safeActiveImg] || "";

  const restaurantId = cleanString(restaurant?.id);
  const favoriteActive = restaurantId
    ? isFavorite("restaurant", restaurantId)
    : false;
  const favoriteCount = restaurantId
    ? getFavoriteCount("restaurant", restaurantId)
    : 0;

  const address = cleanString(restaurant?.location_address);
  const phone = cleanString(restaurant?.contact_phone);
  const website = cleanString(restaurant?.contact_website);
  const hours = cleanString(restaurant?.opening_hours);
  const cuisine = cleanString(restaurant?.cuisine_type);
  const priceRange = cleanString(restaurant?.price_range);
  const description =
    cleanString(restaurant?.description) ||
    cleanString(restaurant?.short_description);

  /* =====================================================
     MAP
  ===================================================== */

  const currentCoordinates = restaurant ? getCoordinates(restaurant) : null;

  const mapPlaces = useMemo<RestaurantMapPlace[]>(() => {
    if (!restaurant || !currentCoordinates) return [];

    return [
      {
        id: cleanString(restaurant.id),
        name: cleanString(restaurant.name) || "Restaurant",
        cuisine,
        address,
        coordinates: currentCoordinates,
        isCurrent: true,
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant, cuisine, address, currentCoordinates?.lat, currentCoordinates?.lng]);

  const mapCenter: [number, number] = currentCoordinates
    ? [currentCoordinates.lat, currentCoordinates.lng]
    : [DEFAULT_LATITUDE, DEFAULT_LONGITUDE];

  const hasMapPlaces = mapPlaces.length > 0;

  /* Enlarged map: close with Esc and lock page scroll */
  useEffect(() => {
    if (!mapOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMapOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mapOpen]);

  /* =====================================================
     ACTIONS
  ===================================================== */

  const handleFavorite = async () => {
    if (restaurantId) await toggleFavorite("restaurant", restaurantId);
  };

  const handleShare = async () => {
    const data = {
      title: restaurant?.name || "Calbayog restaurant",
      text: `Check out ${restaurant?.name || "this restaurant"} in Calbayog City.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(data);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        setShareNotice("Link copied to clipboard.");
      } else {
        setShareNotice("Copy this page link to share it.");
      }
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        setShareNotice("Unable to share this restaurant right now.");
      }
    }
  };

  /* =====================================================
     STATES
  ===================================================== */

  if (loading) {
    return (
      <div className="detail-state-page">
        <style>{styles}</style>

        <div className="detail-loading-card">
          <div className="detail-loading-icon">
            <Spinner animation="border" />
          </div>
          <h2>Loading restaurant</h2>
          <p>Preparing the restaurant details...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="detail-state-page page-enter">
        <style>{styles}</style>

        <div className="detail-empty-card">
          <div className="detail-empty-icon">
            <Utensils size={34} strokeWidth={1.8} />
          </div>
          <h1>Restaurant not found</h1>
          <p>{errorMessage || "This restaurant is not available."}</p>
          <button
            type="button"
            className="detail-primary-button"
            onClick={handleSmartBack}
          >
            <ArrowLeft size={16} />
            Back to restaurants
          </button>
        </div>
      </div>
    );
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="restaurant-detail-page page-enter">
      <style>{`${styles}
.detail-memory-section { margin: 18px 0; padding: 16px; border: 1px solid rgba(45,49,149,.14); border-radius: 16px; background: linear-gradient(135deg,#fafaff 0%,#f4f5ff 100%); }
.detail-memory-content { display:flex; align-items:center; justify-content:space-between; gap:14px; }
.detail-memory-copy { display:flex; align-items:flex-start; gap:10px; min-width:0; }
.detail-memory-icon { width:36px; height:36px; flex:0 0 36px; display:flex; align-items:center; justify-content:center; border-radius:11px; background:${CALBAYOG_BLUE}; color:#fff; }
.detail-memory-title { margin:0 0 3px; font-size:.78rem; font-weight:900; color:${TEXT}; }
.detail-memory-subtitle { margin:0; color:${MUTED}; font-size:.68rem; line-height:1.5; }
.detail-memory-button,.detail-memory-submit { display:inline-flex; align-items:center; justify-content:center; gap:7px; min-height:38px; padding:9px 13px; border:0; border-radius:10px; background:${CALBAYOG_BLUE}; color:#fff; font-size:.7rem; font-weight:900; cursor:pointer; }
.detail-memory-form { margin-top:15px; padding:15px; border:1px solid ${BORDER}; border-radius:12px; background:#fff; }
.detail-memory-form-header,.detail-memory-form-actions { display:flex; align-items:center; justify-content:space-between; gap:10px; }
.detail-memory-form-header h3 { margin:0; font-size:.9rem; font-weight:900; }
.detail-memory-close { width:32px; height:32px; border:0; border-radius:50%; background:#f0f1f5; font-size:1.2rem; cursor:pointer; }
.detail-memory-form label { display:block; margin:13px 0 6px; font-size:.72rem; font-weight:900; }
.detail-memory-form input[type=file],.detail-memory-form textarea { display:block; width:100%; padding:10px; border:1px solid ${BORDER}; border-radius:9px; background:#fff; color:${TEXT}; font:inherit; font-size:.75rem; }
.detail-memory-form small { display:block; margin-top:6px; color:${MUTED}; font-size:.65rem; }
.detail-memory-previews { display:grid; grid-template-columns:repeat(auto-fill,minmax(88px,1fr)); gap:9px; margin-top:12px; }
.detail-memory-preview-item { position:relative; min-width:0; align-self:start; }
.detail-memory-preview-item img { display:block; width:100%; height:auto; max-height:280px; object-fit:contain; object-position:center; background:#f7f8fb; border:1px solid ${BORDER}; border-radius:10px; }
.detail-memory-preview-remove { position:absolute; top:4px; right:4px; width:24px; height:24px; border:0; border-radius:50%; background:#20232acc; color:#fff; cursor:pointer; }
.detail-memory-add-more { display:flex!important; align-items:center; justify-content:center; flex-direction:column; gap:5px; min-height:88px; border:1px dashed ${BORDER}; border-radius:10px; cursor:pointer; }
.detail-memory-add-more input { display:none!important; }
.detail-memory-progress { margin-top:12px; color:${MUTED}; font-size:.72rem; }
.detail-memory-progress div { height:5px; margin-top:6px; border-radius:9px; background:#eceef4; overflow:hidden; }
.detail-memory-progress span { display:block; height:100%; background:${CALBAYOG_BLUE}; transition:width .2s ease; }
.detail-memory-error { margin:10px 0; color:#b42318; font-size:.72rem; font-weight:700; }
.detail-memory-notice { margin-top:10px; color:#16794b; font-size:.72rem; font-weight:800; }
.detail-memory-cancel { min-height:38px; padding:8px 12px; border:1px solid ${BORDER}; border-radius:10px; background:#fff; color:${TEXT}; font-size:.7rem; font-weight:800; cursor:pointer; }
@media(max-width:575px) { .detail-memory-content { align-items:stretch; flex-direction:column; } .detail-memory-button { width:100%; } .detail-memory-form { padding:12px; } }

`} </style>

      <Container className="restaurant-detail-container">
        <button
          type="button"
          className="detail-back-button"
          onClick={handleSmartBack}
        >
          <ArrowLeft size={16} />
          Go back
        </button>

        {/* IMAGE + LOCATION */}

        <Row className="detail-hero-row g-4">
          <Col lg={8} className="detail-gallery-column">
            <div className="detail-gallery">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={`${restaurant.name || "Restaurant"} photo ${safeActiveImg + 1}`}
                  className="detail-main-image"
                  loading="eager"
                  decoding="async"
                  onError={(event) => {
                    event.currentTarget.style.opacity = "0";
                  }}
                />
              ) : (
                <div className="detail-gallery-fallback">
                  <div className="detail-gallery-fallback-content">
                    <Camera size={34} />
                    <span>No images available</span>
                  </div>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="detail-thumbnails">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    className={`detail-thumbnail ${
                      index === safeActiveImg ? "active" : ""
                    }`}
                    onClick={() => setActiveImg(index)}
                    aria-label={`View photo ${index + 1}`}
                    aria-pressed={index === safeActiveImg}
                  >
                    <img src={image} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            {/* SHARE + FAVORITE */}

            <div className="detail-media-actions">
              <button
                type="button"
                className="detail-media-action detail-share-action"
                onClick={() => void handleShare()}
                aria-label="Share restaurant"
              >
                <Share2 size={18} strokeWidth={2} />
              </button>

              <button
                type="button"
                className={`detail-media-action detail-favorite-action ${
                  favoriteActive ? "active" : ""
                }`}
                onClick={() => void handleFavorite()}
                aria-label={
                  favoriteActive
                    ? `Remove ${restaurant.name} from favorites`
                    : `Add ${restaurant.name} to favorites`
                }
                aria-pressed={favoriteActive}
              >
                <Heart
                  className="detail-favorite-icon"
                  size={19}
                  strokeWidth={favoriteActive ? 2.25 : 1.9}
                  fill={favoriteActive ? "currentColor" : "none"}
                />

                {favoriteCount > 0 && (
                  <span className="detail-favorite-count">{favoriteCount}</span>
                )}
              </button>
            </div>

            {shareNotice && (
              <div className="detail-share-notice" role="status">
                {shareNotice}
              </div>
            )}
          </Col>

          <Col lg={4}>
            <div className="detail-location-card">
              <div className="detail-location-card-header">
                <div className="detail-location-icon">
                  <MapPin size={18} strokeWidth={1.9} />
                </div>

                <div>
                  <p className="detail-location-kicker">Location</p>
                  <p className="detail-location-label">Where to find it</p>
                </div>
              </div>

              <p className="detail-location-address">
                {address || "Address not available yet."}
              </p>

              <div className="detail-location-divider" />

              {hasMapPlaces ? (
                <div className="detail-location-map-wrap">
                  <TourismMap center={mapCenter} places={mapPlaces} />

                  <div className="detail-location-map-actions">
                    <button
                      type="button"
                      className="detail-location-map-action"
                      onClick={() => setMapOpen(true)}
                      aria-label="View larger map"
                    >
                      <Maximize2 size={13} />
                      Larger map
                    </button>
                  </div>
                </div>
              ) : (
                <div className="detail-location-map-empty">
                  The map location for this restaurant has not been set yet.
                </div>
              )}
            </div>
          </Col>
        </Row>

        {/* MAIN CONTENT */}

        <Row className="detail-main-row g-4">
          <Col lg={8}>
            <div className="detail-heading-block">
              <div className="detail-category-row">
                {cuisine && (
                  <span
                    className="detail-category-chip"
                    style={{
                      color: CALBAYOG_BLUE,
                      background: CALBAYOG_BLUE_SOFT,
                    }}
                  >
                    <span
                      className="detail-category-icon"
                      style={{ color: CALBAYOG_BLUE }}
                    >
                      <Utensils size={13} strokeWidth={2} />
                    </span>
                    <span>{cuisine}</span>
                  </span>
                )}

                {cuisine && priceRange && (
                  <span className="detail-category-dot">•</span>
                )}

                {priceRange && <span className="detail-type">{priceRange}</span>}
              </div>

              <h1 className="detail-title">
                {restaurant.name || "Unnamed Restaurant"}
              </h1>
            </div>

            <section className="detail-section">
              <h2 className="detail-section-heading">
                <Globe2 size={18} />
                About this restaurant
              </h2>

              <p className="detail-description">
                {description ||
                  "More information about this restaurant will be added soon."}
              </p>
            </section>


          </Col>

          <Col lg={4}>
            <div className="detail-info-card">
              {website && (
                <>
                  <InfoItem
                    icon={<Globe2 size={18} />}
                    label="Website"
                    href={websiteHref(website)}
                    external
                  >
                    Visit official website
                  </InfoItem>
                  <div className="detail-info-divider" />
                </>
              )}

              {phone && (
                <>
                  <InfoItem
                    icon={<Phone size={18} />}
                    label="Contact Number"
                    href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                  >
                    {phone}
                  </InfoItem>
                  <div className="detail-info-divider" />
                </>
              )}

              {hours && (
                <>
                  <InfoItem icon={<Clock3 size={18} />} label="Opening Hours">
                    {hours}
                  </InfoItem>
                  <div className="detail-info-divider" />
                </>
              )}

              {priceRange && (
                <InfoItem icon={<Tag size={18} />} label="Price Range">
                  {priceRange}
                </InfoItem>
              )}

              {!website && !phone && !hours && !priceRange && (
                <div className="detail-info-item">
                  <div className="detail-info-icon">
                    <MapPin size={18} />
                  </div>

                  <div className="detail-info-copy">
                    <div className="detail-info-label">Information</div>
                    <div className="detail-info-value">
                      More restaurant information will appear here when
                      available.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Col>
        </Row>

        <section className="detail-memory-section" aria-label="Add restaurant memory">
              <div className="detail-memory-content"><div className="detail-memory-copy"><div className="detail-memory-icon"><Camera size={18} /></div><div><p className="detail-memory-title">Add Memories</p><p className="detail-memory-subtitle">Share your photos and memorable moments from this restaurant.</p></div></div><button type="button" className="detail-memory-button" onClick={handleAddMemories}><Camera size={14} /> Add Memory</button></div>
              {showMemoryForm && <form className="detail-memory-form" onSubmit={handleSubmitMemory}><div className="detail-memory-form-header"><h3>Share Your Memory</h3><button type="button" className="detail-memory-close" onClick={closeMemoryForm} disabled={memorySubmitting} aria-label="Close memory form">×</button></div>
                <label htmlFor="restaurant-memory-photo">Upload photos</label><input id="restaurant-memory-photo" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleMemoryPhotosChange} disabled={memorySubmitting || memoryPhotos.length >= MEMORY_MAX_PHOTOS} /><small>JPG, PNG, or WEBP. Up to 8 photos, 15 MB each. Large photos are optimized before upload.</small>
                {memoryPhotos.length > 0 && <div className="detail-memory-previews">{memoryPhotos.map((photo, index) => <div className="detail-memory-preview-item" key={photo.id}><img src={photo.url} alt={`Selected photo ${index + 1}`} /><button type="button" className="detail-memory-preview-remove" onClick={() => handleRemoveMemoryPhoto(photo.id)} disabled={memorySubmitting} aria-label={`Remove photo ${index + 1}`}>×</button></div>)}{!memorySubmitting && memoryPhotos.length < MEMORY_MAX_PHOTOS && <label className="detail-memory-add-more">＋ Add more<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleMemoryPhotosChange} /></label>}</div>}
                {memorySubmitting && <div className="detail-memory-progress" role="status">Uploading {memoryProgress}/{memoryPhotos.length} photos…<div><span style={{ width: `${memoryPhotos.length ? (memoryProgress / memoryPhotos.length) * 100 : 0}%` }} /></div></div>}
                <label htmlFor="restaurant-memory-caption">Caption</label><textarea id="restaurant-memory-caption" rows={3} maxLength={500} value={memoryCaption} onChange={(event) => setMemoryCaption(event.target.value)} placeholder="Share a little about your experience..." disabled={memorySubmitting} /><small>{memoryCaption.length}/500 characters</small>
                {memoryError && <p className="detail-memory-error" role="alert">{memoryError}</p>}<div className="detail-memory-form-actions"><button type="button" className="detail-memory-cancel" onClick={closeMemoryForm} disabled={memorySubmitting}>Cancel</button><button type="submit" className="detail-memory-submit" disabled={memorySubmitting}>{memorySubmitting ? `Uploading ${memoryProgress}/${memoryPhotos.length}…` : "Submit Memory"}</button></div>
              </form>}{memoryNotice && <p className="detail-memory-notice" role="status">{memoryNotice}</p>}
        </section>
      </Container>

      {/* ENLARGED MAP */}

      {mapOpen &&
        createPortal(
          <div
            className="detail-map-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Map of ${restaurant.name}`}
            onClick={() => setMapOpen(false)}
          >
            <div
              className="detail-map-modal-card"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="detail-map-header">
                <div className="detail-map-header-left">
                  <div className="detail-map-icon">
                    <MapPinned size={19} />
                  </div>

                  <div>
                    <p className="detail-map-kicker">Explore Calbayog</p>
                    <h2 className="detail-map-title">Calbayog Restaurants</h2>
                    <p className="detail-map-subtitle">
                      Drag the map, switch map styles, or use your current
                      location.
                    </p>
                  </div>
                </div>

                <div className="detail-map-stats">
                  <div className="detail-map-header-actions">
                    <button
                      type="button"
                      className="detail-map-modal-close"
                      onClick={() => setMapOpen(false)}
                      aria-label="Close map"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="detail-map-modal-body">
                <TourismMap center={mapCenter} places={mapPlaces} />
              </div>

              <div className="detail-map-legend">
                <span className="detail-map-legend-item">
                  <span
                    className="detail-map-legend-dot"
                    style={{ background: RESTAURANT_PIN_COLOR }}
                  />
                  Restaurant
                </span>

                <span className="detail-map-legend-item">
                  <span
                    className="detail-map-legend-dot"
                    style={{ background: "#e33f5f" }}
                  />
                  Current restaurant (red label)
                </span>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

/* =========================================================
   STYLES (same design as AttractionDetail)
========================================================= */

const styles = `
@font-face {
  font-family: "Barabara";
  src: url("/fonts/BARABARA-final.otf") format("opentype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

.restaurant-detail-page {
  min-height: 100vh;
  background: #ffffff;
  color: ${TEXT};
  font-family: "Nunito", "Poppins", "Segoe UI", sans-serif;
  padding-bottom: 76px;
}

.restaurant-detail-container {
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 24px 20px 72px;
  background: transparent;
}

/* BACK */

.detail-back-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin: 0 0 16px;
  padding: 5px 0;
  border: 0;
  background: transparent;
  color: #737984;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
  transition: color 0.2s ease, transform 0.2s ease;
}

.detail-back-button:hover {
  color: ${CALBAYOG_BLUE};
  transform: translateX(-2px);
}

/* HERO */

.detail-hero-row { align-items: stretch; }
.detail-gallery-column { min-width: 0; }

.detail-gallery {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 20px;
  background: #eef1f5;
  box-shadow: 0 10px 30px rgba(20, 29, 57, 0.08);
}

.detail-main-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center;
  transition: transform 0.45s cubic-bezier(0.2, 0.65, 0.3, 1);
}

.detail-gallery:hover .detail-main-image { transform: scale(1.008); }

.detail-gallery-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${CALBAYOG_BLUE};
  background: linear-gradient(135deg, #eef0ff 0%, #f7f8fb 100%);
}

.detail-gallery-fallback-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: ${CALBAYOG_BLUE};
}

.detail-gallery-fallback-content span {
  color: #8b919c;
  font-size: 0.65rem;
  font-weight: 800;
}

/* THUMBNAILS */

.detail-thumbnails {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  padding: 10px 0 2px;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.detail-thumbnails::-webkit-scrollbar { display: none; }

.detail-thumbnail {
  flex: 0 0 auto;
  width: 70px;
  height: 50px;
  padding: 0;
  overflow: hidden;
  border: 2px solid transparent;
  border-radius: 9px;
  background: #ffffff;
  cursor: pointer;
  opacity: 0.72;
  transition: border-color 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
}

.detail-thumbnail:hover { opacity: 1; transform: translateY(-1px); }
.detail-thumbnail.active { border-color: ${CALBAYOG_BLUE}; opacity: 1; }
.detail-thumbnail img { width: 100%; height: 100%; display: block; object-fit: cover; }

/* SHARE + FAVORITE */

.detail-media-actions {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.detail-media-action {
  min-height: 0;
  min-width: 0;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 3px;
  border: 0;
  border-radius: 0;
  outline: none;
  background: transparent;
  color: #626a75;
  font-size: 0.66rem;
  font-weight: 900;
  cursor: pointer;
  transition: color 0.2s ease, transform 0.2s ease;
}

.detail-media-action:hover,
.detail-media-action:focus-visible {
  transform: translateY(-1px);
  color: ${CALBAYOG_BLUE};
  background: transparent;
}

.detail-favorite-action.active { color: #ed4f6b; }
.detail-favorite-action:active,
.detail-share-action:active { transform: scale(0.96); }

.detail-favorite-icon {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.detail-favorite-action.active .detail-favorite-icon {
  animation: detailFavoritePop 0.42s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.detail-favorite-count {
  min-width: 15px;
  color: inherit;
  font-size: 0.62rem;
  line-height: 1;
  font-weight: 900;
  text-align: center;
}

.detail-share-notice {
  margin: 7px 0 0;
  text-align: right;
  color: ${CALBAYOG_BLUE};
  font-size: 0.6rem;
  font-weight: 800;
}

@keyframes detailFavoritePop {
  0% { transform: scale(0.72); }
  45% { transform: scale(1.22); }
  70% { transform: scale(0.94); }
  100% { transform: scale(1); }
}

/* LOCATION CARD */

.detail-location-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  padding: 18px;
  border: 1px solid ${BORDER};
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(20, 29, 57, 0.055);
}

.detail-location-card-header {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 12px;
}

.detail-location-icon {
  width: 38px;
  height: 38px;
  min-width: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: ${CALBAYOG_BLUE_SOFT};
  color: ${CALBAYOG_BLUE};
}

.detail-location-kicker {
  margin: 0 0 2px;
  color: #949aa4;
  font-size: 0.57rem;
  line-height: 1.1;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.detail-location-label {
  margin: 0;
  color: ${TEXT};
  font-size: 0.77rem;
  font-weight: 900;
}

.detail-location-address {
  margin: 0;
  color: #5f6772;
  font-size: 0.71rem;
  line-height: 1.65;
  font-weight: 700;
}

.detail-location-divider {
  height: 1px;
  margin: 16px 0;
  background: #eff1f4;
}

/* MAP */

.detail-map-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 14px;
}

.detail-map-header-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.detail-map-icon {
  width: 40px;
  height: 40px;
  min-width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: ${CALBAYOG_BLUE_SOFT};
  color: ${CALBAYOG_BLUE};
}

.detail-map-kicker {
  margin: 0 0 3px;
  color: #949aa4;
  font-size: 0.57rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.detail-map-title {
  margin: 0;
  color: ${TEXT};
  font-size: 1rem;
  font-weight: 900;
}

.detail-map-subtitle {
  margin: 4px 0 0;
  color: #7a818d;
  font-size: 0.65rem;
  line-height: 1.5;
  font-weight: 700;
}

.detail-map-stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.detail-map { width: 100%; height: 100%; }

.detail-location-map-wrap {
  position: relative;
  isolation: isolate;
  flex: 1;
  min-height: 250px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
  border-radius: 14px;
  background: #eef1f5;
}

.detail-location-map-wrap .detail-map-canvas {
  position: absolute;
  inset: 0;
}

.detail-location-map-actions {
  position: absolute;
  right: 10px;
  bottom: 10px;
  z-index: 1200;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 7px;
  pointer-events: none;
}

.detail-location-map-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 31px;
  padding: 6px 10px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.96);
  color: ${CALBAYOG_BLUE};
  box-shadow: 0 4px 14px rgba(20, 29, 57, 0.2);
  font-size: 0.6rem;
  font-weight: 900;
  cursor: pointer;
  pointer-events: auto;
}

.detail-location-map-action:hover {
  background: ${CALBAYOG_BLUE};
  color: #ffffff;
}

.detail-map-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-location-map-empty {
  flex: 1;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
  border: 1px dashed #dfe3ea;
  border-radius: 14px;
  background: #fafbfc;
  color: #777f8a;
  font-size: 0.66rem;
  line-height: 1.6;
  font-weight: 700;
}

.detail-map-canvas { width: 100%; height: 100%; }

/* ENLARGED MAP MODAL */

.detail-map-modal {
  position: fixed;
  inset: 0;
  z-index: 2100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(17, 21, 40, 0.62);
  backdrop-filter: blur(3px);
  animation: detailMapModalFade 0.18s ease;
}

.detail-map-modal-card {
  width: 100%;
  max-width: 1180px;
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 24px 60px rgba(10, 14, 35, 0.35);
  font-family: "Nunito", "Poppins", "Segoe UI", sans-serif;
}

.detail-map-modal-close {
  width: 36px;
  height: 36px;
  min-width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${BORDER};
  border-radius: 50%;
  background: #ffffff;
  color: #5f6772;
  transition: background 0.2s ease, color 0.2s ease;
}

.detail-map-modal-close:hover {
  background: ${CALBAYOG_BLUE};
  border-color: ${CALBAYOG_BLUE};
  color: #ffffff;
}

.detail-map-modal-body {
  position: relative;
  height: calc(100vh - 250px);
  min-height: 340px;
  max-height: 680px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
  border-radius: 15px;
  background: #eef1f5;
}

@keyframes detailMapModalFade {
  from { opacity: 0; }
  to { opacity: 1; }
}

.calbayog-map-custom-control { margin-top: 10px; }

.calbayog-map-custom-control button {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: #ffffff;
  color: #3f4652;
  font-size: 18px;
  font-weight: 900;
  cursor: pointer;
}

.calbayog-map-custom-control button:hover { background: #f4f5f7; color: ${CALBAYOG_BLUE}; }
.calbayog-map-custom-control button:disabled { cursor: wait; opacity: 0.65; }

.detail-map .leaflet-control-layers {
  border: 0;
  border-radius: 10px;
  box-shadow: 0 3px 14px rgba(20, 29, 57, 0.18);
}

.detail-map .leaflet-control-zoom,
.detail-map .leaflet-control-scale {
  box-shadow: 0 3px 14px rgba(20, 29, 57, 0.18);
}

.detail-map .leaflet-control-zoom a,
.detail-map .leaflet-control-layers-toggle {
  width: 32px;
  height: 32px;
  line-height: 32px;
}

/* MAP LABELS */

.leaflet-tooltip.calbayog-map-label {
  max-width: 190px;
  padding: 5px 9px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border: 0;
  border-radius: 8px;
  background: #20263a;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(17, 24, 39, 0.25);
  font-family: "Nunito", "Poppins", "Segoe UI", sans-serif;
  font-size: 0.64rem;
  font-weight: 850;
  pointer-events: none;
}

.leaflet-tooltip-top.calbayog-map-label::before { border-top-color: #20263a; }
.leaflet-tooltip.calbayog-map-label.current { background: #e33f5f; }
.leaflet-tooltip-top.calbayog-map-label.current::before { border-top-color: #e33f5f; }

.calbayog-map-label-name { display: block; overflow: hidden; text-overflow: ellipsis; }

.calbayog-map-label-sub {
  display: block;
  margin-top: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.85em;
  font-weight: 700;
  opacity: 0.8;
}

.detail-location-map-wrap .leaflet-tooltip.calbayog-map-label {
  max-width: 130px;
  padding: 3px 7px;
  font-size: 0.56rem;
}

/* MAP MARKERS */

.calbayog-location-marker {
  background: transparent !important;
  border: 0 !important;
}

.calbayog-marker-shell {
  position: relative;
  width: 44px;
  height: 52px;
  filter: drop-shadow(0 3px 4px rgba(16, 24, 40, 0.25));
}

.calbayog-marker-pin {
  position: absolute;
  top: 1px;
  left: 5px;
  width: 34px;
  height: 34px;
  border: 3px solid #ffffff;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.calbayog-marker-icon {
  position: absolute;
  top: 6px;
  left: 10px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #ffffff;
  font-size: 13px;
  line-height: 1;
}

.calbayog-marker-shell.is-current {
  transform: scale(1.16);
  transform-origin: 50% 94%;
}

.calbayog-marker-shell.is-current .calbayog-marker-pin {
  box-shadow: 0 0 0 3px rgba(227, 63, 95, 0.6);
}

/* MAP POPUP */

.detail-map-popup { min-width: 190px; max-width: 260px; }

.detail-map-popup-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
  padding: 4px 7px;
  border-radius: 999px;
  background: ${CALBAYOG_BLUE_SOFT};
  color: ${CALBAYOG_BLUE};
  font-size: 0.55rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.detail-map-popup-badge.current { background: #fff0f3; color: #d73554; }

.detail-map-popup-title {
  margin: 0;
  color: ${TEXT};
  font-size: 0.78rem;
  line-height: 1.3;
  font-weight: 900;
}

.detail-map-popup-category {
  margin: 4px 0 0;
  color: #747c87;
  font-size: 0.6rem;
  font-weight: 800;
}

.detail-map-popup-address {
  margin: 7px 0 0;
  color: #686f79;
  font-size: 0.61rem;
  line-height: 1.5;
  font-weight: 700;
}

/* LEGEND */

.detail-map-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.detail-map-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #737a85;
  font-size: 0.6rem;
  font-weight: 800;
}

.detail-map-legend-dot {
  width: 11px;
  height: 11px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}

/* MAIN CONTENT */

.detail-main-row { margin-top: 30px; }

.detail-heading-block {
  padding-bottom: 18px;
  border-bottom: 1px solid ${BORDER};
}

.detail-category-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  margin-bottom: 7px;
}

.detail-category-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding: 5px 9px 5px 7px;
  border-radius: 999px;
  font-size: 0.61rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.detail-category-icon {
  width: 22px;
  height: 22px;
  min-width: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  background: #ffffff;
}

.detail-category-dot { color: #c5c9d0; font-size: 0.67rem; }
.detail-type { color: #7c838e; font-size: 0.64rem; font-weight: 800; }

.detail-title {
  margin: 0;
  color: ${CALBAYOG_BLUE};
  font-family: "Barabara" !important;
  font-size: clamp(1.65rem, 2.8vw, 2.4rem);
  font-weight: 400;
  line-height: 0.95;
  letter-spacing: 0.015em;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.detail-section {
  padding: 22px 0;
  border-bottom: 1px solid ${BORDER};
}

.detail-section:last-child { border-bottom: 0; }

.detail-section-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 11px;
  color: ${TEXT};
  font-size: 0.94rem;
  font-weight: 900;
}

.detail-section-heading svg { color: ${CALBAYOG_BLUE}; }

.detail-description {
  margin: 0;
  color: #565e69;
  font-size: 0.79rem;
  line-height: 1.85;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

/* INFO CARD */

.detail-info-card {
  position: sticky;
  top: 18px;
  border: 1px solid ${BORDER};
  border-radius: 18px;
  background: #ffffff;
  padding: 5px 17px 15px;
  box-shadow: 0 10px 28px rgba(20, 29, 57, 0.06);
}

.detail-info-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 0;
}

.detail-info-icon {
  width: 37px;
  height: 37px;
  min-width: 37px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: ${CALBAYOG_BLUE_SOFT};
  color: ${CALBAYOG_BLUE};
}

.detail-info-copy { flex: 1; min-width: 0; }

.detail-info-label {
  margin-bottom: 2px;
  color: #8b919c;
  font-size: 0.59rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.detail-info-value {
  color: ${TEXT};
  font-size: 0.72rem;
  line-height: 1.55;
  font-weight: 800;
  word-break: break-word;
  white-space: pre-line;
}

.detail-info-link { display: block; color: inherit; text-decoration: none; }
.detail-info-link:hover .detail-info-value { color: ${CALBAYOG_BLUE}; }
.detail-info-divider { height: 1px; background: #eff1f4; }

/* STATES */

.detail-state-page {
  min-height: 72vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
  background: #ffffff;
  font-family: "Nunito", "Poppins", "Segoe UI", sans-serif;
}

.detail-loading-card,
.detail-empty-card {
  width: 100%;
  max-width: 480px;
  text-align: center;
}

.detail-loading-icon,
.detail-empty-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: ${CALBAYOG_BLUE_SOFT};
  color: ${CALBAYOG_BLUE};
}

.detail-loading-icon .spinner-border { color: ${CALBAYOG_BLUE}; }

.detail-loading-card h2,
.detail-empty-card h1 {
  margin: 0 0 6px;
  color: ${TEXT};
  font-size: 1rem;
  font-weight: 900;
}

.detail-loading-card p,
.detail-empty-card p {
  margin: 0 auto 18px;
  max-width: 400px;
  color: ${MUTED};
  font-size: 0.71rem;
  line-height: 1.6;
  font-weight: 700;
}

.detail-primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 39px;
  padding: 8px 14px;
  border: 0;
  border-radius: 999px;
  background: ${CALBAYOG_BLUE};
  color: #ffffff;
  font-size: 0.65rem;
  font-weight: 900;
  cursor: pointer;
}

/* RESPONSIVE */

@media (max-width: 991.98px) {
  .detail-location-card { margin-top: 18px; min-height: auto; }
  .detail-info-card { position: static; }
  .detail-map-header { flex-direction: column; }
  .detail-map-stats { justify-content: flex-start; }
  .detail-map-header-actions { width: 100%; justify-content: flex-end; }
}

@media (max-width: 767.98px) {
  .restaurant-detail-container { padding: 18px 16px 55px; }
  .detail-gallery { aspect-ratio: 4 / 3; border-radius: 16px; }
  .detail-title { font-size: 1.9rem; }
  .detail-main-row { margin-top: 22px; }
  .detail-media-actions { justify-content: flex-end; }
  .detail-map-modal { padding: 10px; }
  .detail-map-modal-card { max-height: calc(100vh - 20px); padding: 13px; border-radius: 16px; }
  .detail-map-modal-body { height: calc(100vh - 270px); min-height: 300px; }
  .detail-map-legend { gap: 8px; }
}

@media (max-width: 575.98px) {
  .restaurant-detail-container { padding-left: 13px; padding-right: 13px; }
  .detail-gallery { aspect-ratio: 4 / 3; border-radius: 14px; }
  .detail-title { font-size: 1.8rem; }
  .detail-thumbnail { width: 62px; height: 45px; }
  .detail-media-action { min-height: 0; min-width: 0; padding: 3px; font-size: 0.62rem; }
  .detail-map-title { font-size: 0.9rem; }
  .detail-map-subtitle { font-size: 0.6rem; }
}

@media (prefers-reduced-motion: reduce) {
  .detail-back-button,
  .detail-main-image,
  .detail-thumbnail,
  .detail-media-action,
  .detail-location-map-action {
    transition: none !important;
  }

  .detail-favorite-action.active .detail-favorite-icon {
    animation: none !important;
  }
}
`;

export default RestaurantDetail;
