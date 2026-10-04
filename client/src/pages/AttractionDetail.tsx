import React, { useEffect, useMemo, useState } from "react";

import { useHistory, useParams } from "react-router-dom";

import { Container, Row, Col, Spinner } from "react-bootstrap";

import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Globe2,
  ListChecks,
  MapPin,
  Navigation,
  Phone,
  Share2,
  Sun,
  UserRound,
  Heart,
  Factory,
  Landmark,
  Leaf,
  ShoppingBag,
  Hotel,
  LocateFixed,
} from "lucide-react";

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

import {
  createMyMemory,
  getAttractions,
  getAccommodations,
} from "../services/api";

import {
  subscribeToTable,
  unsubscribeAll,
  supabase,
} from "../services/supabase";

import { Destination, Accommodation } from "../types";

import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";

/* =========================================================
   COLORS
========================================================= */

const CALBAYOG_BLUE = "#2D3195";
const CALBAYOG_BLUE_SOFT = "#EEF0FF";
const TEXT = "#20232A";
const MUTED = "#727985";
const BORDER = "#E8EAF0";

/* =========================================================
   CATEGORY ICONS
========================================================= */

const CATEGORY_ICONS = {
  Nature: Leaf,
  "History and Culture": Landmark,
  "Industrial Tourism": Factory,
  Shopping: ShoppingBag,
  Other: MapPin,
};

const CATEGORY_TINTS: Record<
  string,
  {
    color: string;
    background: string;
  }
> = {
  Nature: {
    color: "#1A7A4A",
    background: "#E8F5EE",
  },

  "History and Culture": {
    color: "#765548",
    background: "#F3ECE8",
  },

  "Industrial Tourism": {
    color: "#536878",
    background: "#EDF1F4",
  },

  Shopping: {
    color: "#B56A00",
    background: "#FFF5DF",
  },

  Other: {
    color: "#68736D",
    background: "#EEF1EF",
  },
};

/* =========================================================
   TYPES
========================================================= */

type Attraction = Destination & {
  id?: number | string;
  name?: string;

  location_lat?: number | string | null;
  location_lng?: number | string | null;
  location_address?: string;

  latitude?: number | string | null;
  longitude?: number | string | null;
  lat?: number | string | null;
  lng?: number | string | null;
  lon?: number | string | null;

  address?: string;
  location?: string;

  description?: string;
  images?: string[] | null;

  category?: string;
  attraction_type?: string;
  other_attraction_type?: string;

  website?: string;
  contact_website?: string;

  contact_person?: string;
  contact_number?: string;
  contact_phone?: string;
  phone?: string;

  opening_hours?: string;
  operating_hours?: string;
  operational_hours?: string;

  best_time_to_visit?: string;

  things_to_do?: string[] | string;

  featured?: boolean;
  favorites?: number;
};

type MapCoordinate = {
  lat: number;
  lng: number;
};

type MapPlace = {
  id: string;
  name: string;
  type: "current-attraction" | "attraction" | "accommodation";
  lat: number;
  lng: number;
  address?: string;
  category?: string;
  attractionType?: string;
};

/* =========================================================
   HELPERS
========================================================= */

const cleanString = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

const normalizeId = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .toLowerCase();

/* =========================================================
   COORDINATE HELPER
========================================================= */

/**
 * IMPORTANT:
 *
 * AdminAttractions saves coordinates as:
 *
 * location_lat
 * location_lng
 *
 * Those are the PRIMARY values used here.
 *
 * The other names are only fallbacks in case the API
 * returns a legacy shape.
 */
const getCoordinates = (
  item: any,
): MapCoordinate | null => {
  const rawLat =
    item?.location_lat ??
    item?.latitude ??
    item?.lat ??
    item?.location?.lat;

  const rawLng =
    item?.location_lng ??
    item?.longitude ??
    item?.lng ??
    item?.lon ??
    item?.location?.lng;

  const lat = Number(rawLat);
  const lng = Number(rawLng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  if (lat < -90 || lat > 90) {
    return null;
  }

  if (lng < -180 || lng > 180) {
    return null;
  }

  return {
    lat,
    lng,
  };
};

/* =========================================================
   MARKER ICONS
========================================================= */

const createMarkerIcon = (
  type:
    | "current-attraction"
    | "attraction"
    | "accommodation",
) => {
  let background = CALBAYOG_BLUE;
  let border = "#ffffff";
  let size = 38;

  if (type === "attraction") {
    background = "#5367D9";
    size = 32;
  }

  if (type === "accommodation") {
    background = "#D88928";
    size = 34;
  }

  if (type === "current-attraction") {
    background = CALBAYOG_BLUE;
    size = 46;
  }

  return L.divIcon({
    className: "calbayog-map-marker-wrapper",

    html: `
      <div
        class="calbayog-map-marker calbayog-map-marker-${type}"
        style="
          width:${size}px;
          height:${size}px;
          background:${background};
          border:3px solid ${border};
        "
      >
        <div class="calbayog-map-marker-inner">
          ${
            type === "accommodation"
              ? `<span class="calbayog-marker-symbol">H</span>`
              : `<span class="calbayog-marker-symbol">●</span>`
          }
        </div>
      </div>
    `,

    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 4],
  });
};

/* =========================================================
   GENERIC VALUE HELPER
========================================================= */

const getFirstValue = (
  attraction: Attraction,
  keys: string[],
): string => {
  for (const key of keys) {
    const value = cleanString(
      (attraction as any)?.[key],
    );

    if (value) {
      return value;
    }
  }

  return "";
};

/* =========================================================
   WEBSITE
========================================================= */

const normalizeWebsiteUrl = (
  website: string,
): string => {
  const value = website.trim();

  if (!value) {
    return "";
  }

  return /^https?:\/\//i.test(value)
    ? value
    : `https://${value}`;
};

/* =========================================================
   DIRECTIONS
========================================================= */

const getDirectionsUrl = (
  attraction: Attraction,
): string => {
  const coordinates = getCoordinates(attraction);

  if (coordinates) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      `${coordinates.lat},${coordinates.lng}`,
    )}`;
  }

  const name = getFirstValue(attraction, [
    "name",
  ]);

  const address = getFirstValue(attraction, [
    "location_address",
    "address",
    "location",
  ]);

  const destination = [
    name,
    address,
    "Calbayog City",
    "Samar",
    "Philippines",
  ]
    .filter(Boolean)
    .join(", ");

  return destination
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        destination,
      )}`
    : "https://www.google.com/maps";
};

/* =========================================================
   THINGS TO DO
========================================================= */

const getThingsToDo = (
  attraction: Attraction,
): string[] => {
  const raw = (attraction as any)?.things_to_do;

  if (Array.isArray(raw)) {
    return raw
      .map(cleanString)
      .filter(Boolean);
  }

  if (typeof raw === "string") {
    return raw
      .split(/\r?\n|•|;|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const alternative = getFirstValue(
    attraction,
    ["activities", "thingsToDo"],
  );

  if (!alternative) {
    return [];
  }

  return alternative
    .split(/\r?\n|•|;|,/)
    .map((item) => item.trim())
    .filter(Boolean);
};

/* =========================================================
   IMAGES
========================================================= */

const getImageArray = (
  attraction: Attraction,
): string[] => {
  const raw = (attraction as any)?.images;

  if (Array.isArray(raw)) {
    return raw
      .map(cleanString)
      .filter(Boolean);
  }

  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((image) => image.trim())
      .filter(Boolean);
  }

  return [];
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
      <div className="detail-info-icon">
        {icon}
      </div>

      <div className="detail-info-copy">
        <div className="detail-info-label">
          {label}
        </div>

        <div className="detail-info-value">
          {children}
        </div>
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={
        external
          ? "noopener noreferrer"
          : undefined
      }
      className="detail-info-link"
    >
      {content}
    </a>
  );
};

/* =========================================================
   MAP
========================================================= */

interface AttractionMapProps {
  currentAttraction: Attraction;
  attractions: Attraction[];
  accommodations: Accommodation[];
  onOpenAttraction?: (
    attractionId: string,
  ) => void;
}

const AttractionMap: React.FC<
  AttractionMapProps
> = ({
  currentAttraction,
  attractions,
  accommodations,
  onOpenAttraction,
}) => {
  const currentCoordinates =
    getCoordinates(currentAttraction);

  const [mapPlaces, setMapPlaces] =
    useState<MapPlace[]>([]);

  /**
   * Build the map data from the SAME coordinates
   * that were saved by the admin.
   *
   * There is NO independent map-location database.
   */
  useEffect(() => {
    const places: MapPlace[] = [];

    const currentId = normalizeId(
      currentAttraction.id,
    );

    /* -----------------------------------------------
       ATTRACTIONS
    ------------------------------------------------ */

    attractions.forEach((item) => {
      const coordinates =
        getCoordinates(item);

      if (!coordinates) {
        return;
      }

      const itemId = cleanString(item.id);

      if (!itemId) {
        return;
      }

      const isCurrent =
        normalizeId(itemId) === currentId;

      places.push({
        id: itemId,
        name:
          cleanString(item.name) ||
          "Unnamed attraction",
        type: isCurrent
          ? "current-attraction"
          : "attraction",
        lat: coordinates.lat,
        lng: coordinates.lng,
        address:
          getFirstValue(item, [
            "location_address",
            "address",
            "location",
          ]) || undefined,
        category:
          cleanString(item.category) ||
          undefined,
        attractionType:
          getFirstValue(item, [
            "attraction_type",
            "type",
          ]) || undefined,
      });
    });

    /* -----------------------------------------------
       ACCOMMODATIONS
    ------------------------------------------------ */

    accommodations.forEach((item) => {
      const coordinates =
        getCoordinates(item);

      if (!coordinates) {
        return;
      }

      const itemId = cleanString(item.id);

      if (!itemId) {
        return;
      }

      places.push({
        id: `accommodation-${itemId}`,
        name:
          cleanString(item.name) ||
          "Unnamed accommodation",
        type: "accommodation",
        lat: coordinates.lat,
        lng: coordinates.lng,
        address:
          cleanString(
            item.locationAddress,
          ) ||
          cleanString(
            item.location?.address,
          ) ||
          undefined,
      });
    });

    setMapPlaces(places);
  }, [
    currentAttraction,
    attractions,
    accommodations,
  ]);

  /**
   * IMPORTANT:
   *
   * MapContainer gets its INITIAL center only.
   *
   * There is intentionally NO useMap()
   * + flyTo()
   * + setView()
   *
   * here.
   *
   * Therefore:
   *
   * User drags map -> map stays there.
   * User zooms map -> map stays there.
   */
  if (!currentCoordinates) {
    return (
      <div className="detail-map-unavailable">
        <MapPin size={26} />

        <strong>
          Map location not available
        </strong>

        <span>
          The administrator has not saved
          coordinates for this attraction yet.
        </span>
      </div>
    );
  }

  return (
    <div className="detail-map-wrapper">
      <MapContainer
        center={[
          currentCoordinates.lat,
          currentCoordinates.lng,
        ]}
        zoom={15}
        scrollWheelZoom={true}
        className="detail-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {mapPlaces.map((place) => {
          const icon =
            createMarkerIcon(place.type);

          const isCurrent =
            place.type ===
            "current-attraction";

          return (
            <Marker
              key={`${place.type}-${place.id}`}
              position={[
                place.lat,
                place.lng,
              ]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  if (
                    place.type ===
                      "attraction" &&
                    onOpenAttraction
                  ) {
                    onOpenAttraction(
                      place.id,
                    );
                  }
                },
              }}
            >
              <Tooltip
                direction="top"
                offset={[0, -8]}
                opacity={0.95}
              >
                <strong>
                  {place.name}
                </strong>
              </Tooltip>

              <Popup>
                <div className="detail-map-popup">
                  <div
                    className={`detail-map-popup-icon ${
                      place.type ===
                      "accommodation"
                        ? "accommodation"
                        : "attraction"
                    }`}
                  >
                    {place.type ===
                    "accommodation" ? (
                      <Hotel size={17} />
                    ) : (
                      <MapPin size={17} />
                    )}
                  </div>

                  <div className="detail-map-popup-content">
                    <div className="detail-map-popup-type">
                      {isCurrent
                        ? "CURRENT ATTRACTION"
                        : place.type ===
                            "accommodation"
                          ? "ACCOMMODATION"
                          : "ATTRACTION"}
                    </div>

                    <div className="detail-map-popup-title">
                      {place.name}
                    </div>

                    {place.category && (
                      <div className="detail-map-popup-category">
                        {place.category}
                      </div>
                    )}

                    {place.address && (
                      <div className="detail-map-popup-address">
                        <MapPin size={12} />
                        <span>
                          {place.address}
                        </span>
                      </div>
                    )}

                    {isCurrent && (
                      <div className="detail-map-current">
                        <LocateFixed size={12} />
                        You are viewing this
                        attraction
                      </div>
                    )}

                    {place.type ===
                      "attraction" &&
                      onOpenAttraction && (
                        <button
                          type="button"
                          className="detail-map-popup-button"
                          onClick={() =>
                            onOpenAttraction(
                              place.id,
                            )
                          }
                        >
                          View attraction
                        </button>
                      )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="detail-map-legend">
        <div className="detail-map-legend-item">
          <span className="detail-map-legend-marker current" />
          <span>
            Current attraction
          </span>
        </div>

        <div className="detail-map-legend-item">
          <span className="detail-map-legend-marker attraction" />
          <span>Other attractions</span>
        </div>

        <div className="detail-map-legend-item">
          <span className="detail-map-legend-marker accommodation">
            H
          </span>
          <span>Accommodations</span>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   COMPONENT
========================================================= */

const AttractionDetail: React.FC = () => {
  const { id } =
    useParams<{ id: string }>();

  const history = useHistory();

  const auth = useAuth();

  const {
    isFavorite,
    getFavoriteCount,
    setFavoriteCount,
    toggleFavorite,
  } = useFavorites();

  const isUserAuthenticated =
    Boolean(
      (auth as any)
        ?.isUserAuthenticated &&
        (auth as any)?.user,
    );

  /* =======================================================
     STATES
  ======================================================= */

  const [attraction, setAttraction] =
    useState<Attraction | null>(null);

  const [allAttractions, setAllAttractions] =
    useState<Attraction[]>([]);

  const [
    accommodations,
    setAccommodations,
  ] = useState<Accommodation[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [notFound, setNotFound] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [activeImg, setActiveImg] =
    useState(0);

  const [memoryNotice, setMemoryNotice] =
    useState("");

  const [showMemoryForm, setShowMemoryForm] =
    useState(false);

  const [memoryCaption, setMemoryCaption] =
    useState("");

  const [memoryPhoto, setMemoryPhoto] =
    useState<File | null>(null);

  const [
    memoryPhotoPreview,
    setMemoryPhotoPreview,
  ] = useState("");

  const [
    memorySubmitting,
    setMemorySubmitting,
  ] = useState(false);

  const [memoryError, setMemoryError] =
    useState("");

  const [shareNotice, setShareNotice] =
    useState("");

  /* =======================================================
     LOAD ATTRACTION + MAP DATA
  ======================================================= */

  useEffect(() => {
    const routeId = normalizeId(id);

    if (!routeId) {
      setLoading(false);
      setNotFound(true);
      setErrorMessage(
        "No attraction ID was provided.",
      );
      return;
    }

    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setNotFound(false);
        setErrorMessage("");

        /* -----------------------------------------------
           LOAD ATTRACTIONS
        ------------------------------------------------ */

        const response =
          await getAttractions();

        const attractionData =
          Array.isArray(response?.data)
            ? response.data
            : [];

        if (!mounted) {
          return;
        }

        setAllAttractions(
          attractionData as Attraction[],
        );

        const result =
          attractionData.find(
            (item: Destination) =>
              normalizeId(
                (item as any)?.id,
              ) === routeId,
          ) || null;

        if (!result) {
          setAttraction(null);
          setNotFound(true);
          setErrorMessage(
            "The attraction could not be found.",
          );
        } else {
          setAttraction(
            result as Attraction,
          );

          const resultId =
            cleanString(
              (result as any)?.id,
            );

          if (resultId) {
            const resultFavoriteCount =
              Math.max(
                0,
                Number(
                  (result as any)
                    ?.favorites ?? 0,
                ) || 0,
              );

            setFavoriteCount(
              "attraction",
              resultId,
              resultFavoriteCount,
            );
          }

          setNotFound(false);
          setErrorMessage("");
        }

        /* -----------------------------------------------
           LOAD ACCOMMODATIONS
        ------------------------------------------------ */

        try {
          const accommodationResponse =
            await getAccommodations();

          const accommodationData =
            Array.isArray(
              accommodationResponse?.data,
            )
              ? accommodationResponse.data
              : [];

          if (mounted) {
            setAccommodations(
              accommodationData as Accommodation[],
            );
          }
        } catch (accommodationError) {
          console.error(
            "Failed to load accommodations:",
            accommodationError,
          );

          if (mounted) {
            setAccommodations([]);
          }
        }
      } catch (error) {
        console.error(
          "Failed to load attraction:",
          error,
        );

        if (!mounted) {
          return;
        }

        setAttraction(null);
        setAllAttractions([]);
        setAccommodations([]);

        setNotFound(true);

        setErrorMessage(
          "Unable to load this attraction right now. Please try again.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void fetchData();

    subscribeToTable(
      "attractions",
      "*",
      () => {
        void fetchData();
      },
    );

    return () => {
      mounted = false;
      unsubscribeAll();
    };
  }, [id, setFavoriteCount]);

  /* =======================================================
     RESET IMAGE + NOTICE
  ======================================================= */

  useEffect(() => {
    setActiveImg(0);
    setMemoryNotice("");
    setShareNotice("");
  }, [id]);

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const images = useMemo(
    () =>
      attraction
        ? getImageArray(
            attraction,
          ).slice(0, 4)
        : [],
    [attraction],
  );

  const thingsToDo = useMemo(
    () =>
      attraction
        ? getThingsToDo(attraction)
        : [],
    [attraction],
  );

  const address = attraction
    ? getFirstValue(attraction, [
        "location_address",
        "address",
        "location",
      ])
    : "";

  const attractionType = attraction
    ? getFirstValue(attraction, [
        "attraction_type",
        "subcategory",
        "sub_category",
        "type",
      ])
    : "";

  const displayAttractionType =
    attractionType === "Other"
      ? getFirstValue(
          attraction!,
          ["other_attraction_type"],
        ) || "Other"
      : attractionType;

  const website = attraction
    ? getFirstValue(attraction, [
        "website",
        "contact_website",
      ])
    : "";

  const contactPerson = attraction
    ? getFirstValue(attraction, [
        "contact_person",
        "contactPerson",
      ])
    : "";

  const contactNumber = attraction
    ? getFirstValue(attraction, [
        "contact_number",
        "contact_phone",
        "phone",
      ])
    : "";

  const operatingHours = attraction
    ? getFirstValue(attraction, [
        "operating_hours",
        "opening_hours",
        "operational_hours",
      ])
    : "";

  const bestTime = attraction
    ? getFirstValue(attraction, [
        "best_time_to_visit",
        "best_time",
        "best_season",
      ])
    : "";

  const directionsUrl = attraction
    ? getDirectionsUrl(attraction)
    : "https://www.google.com/maps";

  const safeActiveImg =
    images.length > 0 &&
    activeImg >= 0 &&
    activeImg < images.length
      ? activeImg
      : 0;

  const activeImage =
    images[safeActiveImg] || "";

  const favoriteId = cleanString(
    attraction?.id,
  );

  const favoriteActive = favoriteId
    ? isFavorite(
        "attraction",
        favoriteId,
      )
    : false;

  const favoriteCount = favoriteId
    ? getFavoriteCount(
        "attraction",
        favoriteId,
      )
    : 0;

  /* =======================================================
     FAVORITE
  ======================================================= */

  const handleFavorite = async () => {
    if (!favoriteId) {
      return;
    }

    await toggleFavorite(
      "attraction",
      favoriteId,
    );
  };

  /* =======================================================
     SHARE
  ======================================================= */

  const handleShare = async () => {
    const shareData = {
      title:
        attraction?.name ||
        "Calbayog attraction",

      text: `Check out ${
        attraction?.name ||
        "this attraction"
      } in Calbayog City.`,

      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(
          shareData,
        );
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(
          window.location.href,
        );

        setShareNotice(
          "Link copied to clipboard.",
        );
      } else {
        setShareNotice(
          "Copy this page link to share it.",
        );
      }
    } catch (error: any) {
      if (
        error?.name !== "AbortError"
      ) {
        setShareNotice(
          "Unable to share this attraction right now.",
        );
      }
    }
  };

  /* =======================================================
     MAP ATTRACTION CLICK
  ======================================================= */

  const handleMapAttractionClick = (
    attractionId: string,
  ) => {
    if (!attractionId) {
      return;
    }

    history.push(
      `/attractions/${attractionId}`,
    );
  };

  /* =======================================================
     ADD MEMORIES
  ======================================================= */

  const handleAddMemories = () => {
    setMemoryNotice("");
    setMemoryError("");

    if (!isUserAuthenticated) {
      window.dispatchEvent(
        new Event("open-login-modal"),
      );

      return;
    }

    setShowMemoryForm(true);
  };

  /* =======================================================
     MEMORY PHOTO
  ======================================================= */

  const handleMemoryPhotoChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setMemoryError("");
    setMemoryNotice("");

    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(file.type)
    ) {
      setMemoryError(
        "Please upload a JPG, PNG, or WEBP image.",
      );

      event.target.value = "";

      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMemoryError(
        "The image must be smaller than 5 MB.",
      );

      event.target.value = "";

      return;
    }

    if (memoryPhotoPreview) {
      URL.revokeObjectURL(
        memoryPhotoPreview,
      );
    }

    setMemoryPhoto(file);

    setMemoryPhotoPreview(
      URL.createObjectURL(file),
    );
  };

  /* =======================================================
     SUBMIT MEMORY
  ======================================================= */

  const handleSubmitMemory = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setMemoryError("");
    setMemoryNotice("");

    const userId = String(
      (auth as any)?.user?.id || "",
    ).trim();

    const attractionId = cleanString(
      (attraction as any)?.id,
    );

    const caption =
      memoryCaption.trim();

    if (!userId) {
      setMemoryError(
        "Please log in before submitting a memory.",
      );

      return;
    }

    if (!attractionId || !memoryPhoto) {
      setMemoryError(
        "Please select a photo first.",
      );

      return;
    }

    if (!caption) {
      setMemoryError(
        "Please add a caption for your memory.",
      );

      return;
    }

    if (caption.length > 500) {
      setMemoryError(
        "Your caption must be 500 characters or less.",
      );

      return;
    }

    try {
      setMemorySubmitting(true);

      const extension =
        memoryPhoto.name
          .split(".")
          .pop()
          ?.toLowerCase() || "jpg";

      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${extension}`;

      const filePath = `${userId}/${attractionId}/${fileName}`;

      const {
        error: uploadError,
      } = await supabase.storage
        .from("memory-images")
        .upload(
          filePath,
          memoryPhoto,
          {
            cacheControl: "3600",
            upsert: false,
            contentType:
              memoryPhoto.type,
          },
        );

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("memory-images")
        .getPublicUrl(
          filePath,
        );

      const imageUrl =
        publicUrlData?.publicUrl ||
        "";

      if (!imageUrl) {
        throw new Error(
          "The uploaded image URL could not be created.",
        );
      }

      await createMyMemory({
        attraction_id: attractionId,
        caption,
        image_urls: [imageUrl],
      });

      setMemoryCaption("");
      setMemoryPhoto(null);

      if (memoryPhotoPreview) {
        URL.revokeObjectURL(
          memoryPhotoPreview,
        );
      }

      setMemoryPhotoPreview("");
      setShowMemoryForm(false);

      setMemoryNotice(
        "Your memory has been added successfully!",
      );
    } catch (error: any) {
      console.error(
        "Memory submission error:",
        error,
      );

      setMemoryError(
        error?.response?.data
          ?.message ||
          error?.message ||
          "Something went wrong while uploading your memory.",
      );
    } finally {
      setMemorySubmitting(false);
    }
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="detail-state-page">
        <div className="detail-loading-card">
          <div className="detail-loading-icon">
            <Spinner animation="border" />
          </div>

          <h2>
            Loading attraction
          </h2>

          <p>
            Preparing the attraction
            details...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     NOT FOUND
  ======================================================= */

  if (notFound || !attraction) {
    return (
      <div className="detail-state-page page-enter">
        <div className="detail-empty-card">
          <div className="detail-empty-icon">
            <MapPin
              size={34}
              strokeWidth={1.8}
            />
          </div>

          <h1>
            Attraction not found
          </h1>

          <p>
            {errorMessage ||
              "The requested attraction could not be found."}
          </p>

          <button
            type="button"
            className="detail-primary-button"
            onClick={() =>
              history.push(
                "/attractions",
              )
            }
          >
            <ArrowLeft size={16} />
            Back to attractions
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="attraction-detail-page page-enter">
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

        .attraction-detail-page {
          min-height: 100vh;
          background: #ffffff;
          color: ${TEXT};
          font-family:
            "Nunito",
            "Poppins",
            "Segoe UI",
            sans-serif;
          padding-bottom: 76px;
        }

        .attraction-detail-container {
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
          padding: 24px 20px 72px;
          background: transparent;
        }

        /* =================================================
           BACK
        ================================================= */

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
          transition:
            color 0.2s ease,
            transform 0.2s ease;
        }

        .detail-back-button:hover {
          color: ${CALBAYOG_BLUE};
          transform: translateX(-2px);
        }

        /* =================================================
           HERO
        ================================================= */

        .detail-hero-row {
          align-items: stretch;
        }

        .detail-gallery-column {
          min-width: 0;
        }

        .detail-gallery {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          border-radius: 20px;
          background: #eef1f5;
          box-shadow:
            0 10px 30px
            rgba(
              20,
              29,
              57,
              0.08
            );
        }

        .detail-main-image-button {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          padding: 0;
          border: 0;
          background: transparent;
          cursor: default;
        }

        .detail-main-image {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          object-position: center;
          transition:
            transform 0.45s
            cubic-bezier(
              0.2,
              0.65,
              0.3,
              1
            );
        }

        .detail-gallery:hover
          .detail-main-image {
          transform: scale(1.008);
        }

        .detail-gallery-fallback {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${CALBAYOG_BLUE};
          background:
            linear-gradient(
              135deg,
              #eef0ff 0%,
              #f7f8fb 100%
            );
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

        .detail-photo-count {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 4;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          min-height: 30px;
          padding: 6px 9px;
          border-radius: 999px;
          background: rgba(
            0,
            0,
            0,
            0.42
          );
          color: #ffffff;
          font-size: 0.61rem;
          font-weight: 900;
          backdrop-filter: blur(10px);
        }

        /* =================================================
           THUMBNAILS
        ================================================= */

        .detail-thumbnails {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          padding: 10px 0 2px;
          scrollbar-width: none;
        }

        .detail-thumbnails::-webkit-scrollbar {
          display: none;
        }

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
          transition:
            border-color 0.2s ease,
            transform 0.2s ease,
            opacity 0.2s ease;
        }

        .detail-thumbnail:hover {
          opacity: 1;
          transform: translateY(-1px);
        }

        .detail-thumbnail.active {
          border-color: ${CALBAYOG_BLUE};
          opacity: 1;
        }

        .detail-thumbnail img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        /* =================================================
           SHARE
        ================================================= */

        .detail-media-actions {
          display: flex;
          align-items: flex-start;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }

        .detail-media-action {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 3px;
          border: 0;
          background: transparent;
          color: #626a75;
          font-size: 0.66rem;
          font-weight: 900;
          cursor: pointer;
          transition:
            color 0.2s ease,
            transform 0.2s ease;
        }

        .detail-media-action:hover {
          transform: translateY(-1px);
          color: ${CALBAYOG_BLUE};
        }

        .detail-favorite-action.active {
          color: #ed4f6b;
        }

        .detail-favorite-icon {
          transition:
            transform 0.25s
            cubic-bezier(
              0.34,
              1.56,
              0.64,
              1
            );
        }

        .detail-favorite-action.active
          .detail-favorite-icon {
          animation:
            detailFavoritePop
            0.42s
            cubic-bezier(
              0.34,
              1.56,
              0.64,
              1
            );
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
          0% {
            transform: scale(0.72);
          }

          45% {
            transform: scale(1.22);
          }

          70% {
            transform: scale(0.94);
          }

          100% {
            transform: scale(1);
          }
        }

        /* =================================================
           LOCATION CARD
        ================================================= */

        .detail-location-card {
          height: 100%;
          min-height: 100%;
          padding: 18px;
          border: 1px solid ${BORDER};
          border-radius: 18px;
          background: #ffffff;
          box-shadow:
            0 8px 24px
            rgba(
              20,
              29,
              57,
              0.055
            );
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

        .detail-location-directions {
          width: 100%;
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border-radius: 10px;
          background: ${CALBAYOG_BLUE};
          color: #ffffff;
          text-decoration: none;
          font-size: 0.66rem;
          font-weight: 900;
          transition:
            background 0.2s ease,
            transform 0.2s ease;
        }

        .detail-location-directions:hover {
          color: #ffffff;
          background: #252982;
          transform: translateY(-1px);
        }

        .detail-location-directions-note {
          margin-top: 7px;
          text-align: center;
          color: #989ea8;
          font-size: 0.57rem;
          line-height: 1.4;
          font-weight: 700;
        }

        /* =================================================
           MAP SECTION
        ================================================= */

        .detail-map-section {
          margin-top: 30px;
          padding: 22px 0;
          border-top: 1px solid ${BORDER};
          border-bottom: 1px solid ${BORDER};
        }

        .detail-map-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 13px;
        }

        .detail-map-heading-copy {
          min-width: 0;
        }

        .detail-map-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 4px;
          color: ${TEXT};
          font-size: 0.94rem;
          font-weight: 900;
        }

        .detail-map-title svg {
          color: ${CALBAYOG_BLUE};
        }

        .detail-map-subtitle {
          margin: 0;
          color: #7d8490;
          font-size: 0.65rem;
          line-height: 1.5;
          font-weight: 700;
        }

        .detail-map-wrapper {
          position: relative;
          width: 100%;
          height: 470px;
          overflow: hidden;
          border: 1px solid ${BORDER};
          border-radius: 18px;
          background: #eef1f5;
          box-shadow:
            0 10px 28px
            rgba(
              20,
              29,
              57,
              0.06
            );
        }

        .detail-map {
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        .detail-map-unavailable {
          width: 100%;
          min-height: 250px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 1px solid ${BORDER};
          border-radius: 18px;
          background: #fafbfc;
          color: ${CALBAYOG_BLUE};
          text-align: center;
        }

        .detail-map-unavailable strong {
          color: ${TEXT};
          font-size: 0.78rem;
        }

        .detail-map-unavailable span {
          max-width: 350px;
          color: #858c97;
          font-size: 0.64rem;
          line-height: 1.5;
          font-weight: 700;
        }

        /* =================================================
           MAP MARKERS
        ================================================= */

        .calbayog-map-marker-wrapper {
          background: transparent !important;
          border: 0 !important;
        }

        .calbayog-map-marker {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow:
            0 4px 12px
            rgba(
              20,
              29,
              57,
              0.28
            );
        }

        .calbayog-map-marker-inner {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(45deg);
          color: #ffffff;
        }

        .calbayog-marker-symbol {
          font-size: 9px;
          font-weight: 900;
        }

        .calbayog-map-marker-current-attraction
          .calbayog-marker-symbol {
          font-size: 13px;
        }

        .calbayog-map-marker-accommodation
          .calbayog-marker-symbol {
          font-size: 13px;
        }

        /* =================================================
           MAP POPUP
        ================================================= */

        .detail-map-popup {
          min-width: 220px;
          max-width: 285px;
          display: flex;
          align-items: flex-start;
          gap: 9px;
        }

        .detail-map-popup-icon {
          width: 34px;
          height: 34px;
          min-width: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: ${CALBAYOG_BLUE_SOFT};
          color: ${CALBAYOG_BLUE};
        }

        .detail-map-popup-icon.accommodation {
          background: #FFF2DF;
          color: #D17A13;
        }

        .detail-map-popup-content {
          min-width: 0;
        }

        .detail-map-popup-type {
          margin-bottom: 2px;
          color: #999fa8;
          font-size: 0.49rem;
          line-height: 1.2;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .detail-map-popup-title {
          color: ${TEXT};
          font-size: 0.74rem;
          line-height: 1.25;
          font-weight: 900;
        }

        .detail-map-popup-category {
          margin-top: 2px;
          color: ${CALBAYOG_BLUE};
          font-size: 0.58rem;
          font-weight: 800;
        }

        .detail-map-popup-address {
          display: flex;
          align-items: flex-start;
          gap: 4px;
          margin-top: 6px;
          color: #707783;
          font-size: 0.57rem;
          line-height: 1.45;
          font-weight: 700;
        }

        .detail-map-popup-address svg {
          flex: 0 0 auto;
          margin-top: 2px;
        }

        .detail-map-current {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 7px;
          color: ${CALBAYOG_BLUE};
          font-size: 0.57rem;
          font-weight: 900;
        }

        .detail-map-popup-button {
          margin-top: 8px;
          padding: 6px 9px;
          border: 0;
          border-radius: 7px;
          background: ${CALBAYOG_BLUE};
          color: #ffffff;
          font-size: 0.57rem;
          font-weight: 900;
          cursor: pointer;
        }

        .detail-map-popup-button:hover {
          background: #252982;
        }

        /* =================================================
           MAP LEGEND
        ================================================= */

        .detail-map-legend {
          position: absolute;
          z-index: 500;
          left: 12px;
          bottom: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          max-width: calc(100% - 24px);
          padding: 8px 10px;
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.85
            );
          border-radius: 10px;
          background: rgba(
            255,
            255,
            255,
            0.93
          );
          box-shadow:
            0 5px 18px
            rgba(
              20,
              29,
              57,
              0.14
            );
          backdrop-filter: blur(8px);
        }

        .detail-map-legend-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #5d6570;
          font-size: 0.55rem;
          font-weight: 800;
        }

        .detail-map-legend-marker {
          width: 11px;
          height: 11px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #ffffff;
          border-radius: 50%;
          background: #5367D9;
          color: #ffffff;
          font-size: 0.42rem;
          font-weight: 900;
          box-shadow:
            0 1px 4px
            rgba(
              0,
              0,
              0,
              0.2
            );
        }

        .detail-map-legend-marker.current {
          background: ${CALBAYOG_BLUE};
          width: 13px;
          height: 13px;
        }

        .detail-map-legend-marker.attraction {
          background: #5367D9;
        }

        .detail-map-legend-marker.accommodation {
          background: #D88928;
        }

        /* =================================================
           MAIN CONTENT
        ================================================= */

        .detail-main-row {
          margin-top: 30px;
        }

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

        .detail-category-dot {
          color: #c5c9d0;
          font-size: 0.67rem;
        }

        .detail-type {
          color: #7c838e;
          font-size: 0.64rem;
          font-weight: 800;
        }

        .detail-title {
          margin: 0;
          color: ${CALBAYOG_BLUE};
          font-family: "Barabara" !important;
          font-size: clamp(
            1.65rem,
            2.8vw,
            2.4rem
          );
          font-weight: 400;
          line-height: 0.95;
          letter-spacing: 0.015em;
          text-transform: uppercase;
        }

        /* =================================================
           SECTIONS
        ================================================= */

        .detail-section {
          padding: 22px 0;
          border-bottom: 1px solid ${BORDER};
        }

        .detail-section-heading {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 11px;
          color: ${TEXT};
          font-size: 0.94rem;
          font-weight: 900;
        }

        .detail-section-heading svg {
          color: ${CALBAYOG_BLUE};
        }

        .detail-description {
          margin: 0;
          color: #565e69;
          font-size: 0.79rem;
          line-height: 1.85;
          white-space: pre-line;
        }

        /* =================================================
           THINGS TO DO
        ================================================= */

        .detail-things-grid {
          display: grid;
          grid-template-columns:
            repeat(
              auto-fit,
              minmax(
                185px,
                1fr
              )
            );
          gap: 8px;
        }

        .detail-thing {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 11px 12px;
          border: 1px solid #edf0f4;
          border-radius: 11px;
          background: #fafbfc;
          color: #565e68;
          font-size: 0.71rem;
          line-height: 1.5;
          font-weight: 700;
        }

        .detail-thing-bullet {
          width: 6px;
          height: 6px;
          min-width: 6px;
          margin-top: 5px;
          border-radius: 50%;
          background: ${CALBAYOG_BLUE};
        }

        /* =================================================
           INFO CARD
        ================================================= */

        .detail-info-card {
          position: sticky;
          top: 18px;
          border: 1px solid ${BORDER};
          border-radius: 18px;
          background: #ffffff;
          padding: 5px 17px 15px;
          box-shadow:
            0 10px 28px
            rgba(
              20,
              29,
              57,
              0.06
            );
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

        .detail-info-copy {
          flex: 1;
          min-width: 0;
        }

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
        }

        .detail-info-link {
          display: block;
          color: inherit;
          text-decoration: none;
        }

        .detail-info-link:hover
          .detail-info-value {
          color: ${CALBAYOG_BLUE};
        }

        .detail-info-divider {
          height: 1px;
          background: #eff1f4;
        }

        /* =================================================
           MEMORY
        ================================================= */

        .detail-memory-section {
          margin-top: 21px;
          padding: 15px;
          border: 1px solid
            rgba(
              45,
              49,
              149,
              0.12
            );
          border-radius: 16px;
          background:
            linear-gradient(
              135deg,
              #fafaff 0%,
              #f4f5ff 100%
            );
        }

        .detail-memory-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 13px;
        }

        .detail-memory-copy {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          min-width: 0;
        }

        .detail-memory-icon {
          width: 36px;
          height: 36px;
          min-width: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          background: ${CALBAYOG_BLUE};
          color: #ffffff;
        }

        .detail-memory-title {
          margin: 0 0 2px;
          color: ${TEXT};
          font-size: 0.73rem;
          font-weight: 900;
        }

        .detail-memory-subtitle {
          margin: 0;
          color: #7f8691;
          font-size: 0.6rem;
          line-height: 1.45;
          font-weight: 700;
        }

        .detail-memory-button {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          min-height: 36px;
          padding: 7px 11px;
          border: 0;
          border-radius: 10px;
          background: ${CALBAYOG_BLUE};
          color: #ffffff;
          font-size: 0.62rem;
          font-weight: 900;
          cursor: pointer;
        }

        .detail-memory-button:hover {
          background: #252982;
        }

        .detail-memory-notice {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          margin: 9px 0 0 45px;
          color: ${CALBAYOG_BLUE};
          font-size: 0.59rem;
          line-height: 1.45;
          font-weight: 800;
        }

        /* =================================================
           MEMORY FORM
        ================================================= */

        .detail-memory-form {
          margin-top: 16px;
          padding: 18px;
          border: 1px solid #e8eaf0;
          border-radius: 14px;
          background: #fafbff;
        }

        .detail-memory-form-header,
        .detail-memory-form-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .detail-memory-form-header h3 {
          margin: 0 0 14px;
          font-size: 0.9rem;
          font-weight: 900;
          color: #20232a;
        }

        .detail-memory-close {
          border: 0;
          background: transparent;
          font-size: 1.3rem;
          cursor: pointer;
        }

        .detail-memory-form label {
          display: block;
          margin: 10px 0 6px;
          font-size: 0.7rem;
          font-weight: 900;
          color: #20232a;
        }

        .detail-memory-form input,
        .detail-memory-form textarea {
          width: 100%;
          border: 1px solid #dfe3ed;
          border-radius: 9px;
          padding: 10px;
          background: #fff;
          font-size: 0.75rem;
        }

        .detail-memory-form small {
          display: block;
          margin-top: 5px;
          color: #7d8491;
          font-size: 0.62rem;
        }

        .detail-memory-preview {
          margin-top: 12px;
        }

        .detail-memory-preview img {
          display: block;
          width: 100%;
          max-height: 260px;
          object-fit: cover;
          border-radius: 10px;
        }

        .detail-memory-error {
          margin-top: 10px;
          padding: 10px;
          border-radius: 8px;
          background: #fff0f0;
          color: #b42318;
          font-size: 0.68rem;
          font-weight: 800;
        }

        .detail-memory-form-actions {
          justify-content: flex-end;
          margin-top: 14px;
        }

        .detail-memory-cancel,
        .detail-memory-submit {
          border: 0;
          border-radius: 9px;
          padding: 10px 14px;
          font-size: 0.68rem;
          font-weight: 900;
          cursor: pointer;
        }

        .detail-memory-cancel {
          background: #eef0f4;
          color: #555d69;
        }

        .detail-memory-submit {
          background: #2d3195;
          color: #fff;
        }

        .detail-memory-cancel:disabled,
        .detail-memory-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* =================================================
           STATES
        ================================================= */

        .detail-state-page {
          min-height: 72vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 50px 20px;
          background: #ffffff;
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

        .detail-loading-icon
          .spinner-border {
          color: ${CALBAYOG_BLUE};
        }

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

        /* =================================================
           RESPONSIVE
        ================================================= */

        @media (max-width: 991.98px) {

          .detail-location-card {
            margin-top: 18px;
            min-height: auto;
          }

          .detail-info-card {
            position: static;
          }

          .detail-map-wrapper {
            height: 420px;
          }
        }

        @media (max-width: 767.98px) {

          .attraction-detail-container {
            padding:
              18px 16px 55px;
          }

          .detail-gallery {
            aspect-ratio: 4 / 3;
            border-radius: 16px;
          }

          .detail-title {
            font-size: 1.9rem;
          }

          .detail-main-row {
            margin-top: 22px;
          }

          .detail-media-actions {
            justify-content: flex-end;
          }

          .detail-memory-content {
            align-items: stretch;
            flex-direction: column;
          }

          .detail-memory-button {
            width: 100%;
          }

          .detail-map-wrapper {
            height: 390px;
            border-radius: 14px;
          }

          .detail-map-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .detail-map-legend {
            left: 8px;
            bottom: 8px;
          }
        }

        @media (max-width: 575.98px) {

          .attraction-detail-container {
            padding-left: 13px;
            padding-right: 13px;
          }

          .detail-gallery {
            aspect-ratio: 4 / 3;
            border-radius: 14px;
          }

          .detail-title {
            font-size: 1.8rem;
          }

          .detail-thumbnail {
            width: 62px;
            height: 45px;
          }

          .detail-media-action {
            padding: 3px;
            font-size: 0.62rem;
          }

          .detail-photo-count {
            top: 8px;
            right: 8px;
            min-height: 27px;
            padding: 5px 8px;
            font-size: 0.56rem;
          }

          .detail-map-wrapper {
            height: 340px;
          }

          .detail-map-legend {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {

          .detail-back-button,
          .detail-main-image,
          .detail-thumbnail,
          .detail-media-action,
          .detail-location-directions,
          .detail-memory-button {
            transition: none !important;
          }

          .detail-favorite-action.active
            .detail-favorite-icon {
            animation: none !important;
          }
        }

      `}</style>

      <Container className="attraction-detail-container">

        {/* =================================================
             BACK
        ================================================= */}

        <button
          type="button"
          className="detail-back-button"
          onClick={() =>
            history.goBack()
          }
        >
          <ArrowLeft size={15} />
          Back to attractions
        </button>

        {/* =================================================
             IMAGE + LOCATION
        ================================================= */}

        <Row className="detail-hero-row g-4">

          <Col
            lg={8}
            className="detail-gallery-column"
          >

            {images.length === 0 ? (
              <div className="detail-gallery">

                <div className="detail-gallery-fallback">

                  <div className="detail-gallery-fallback-content">

                    <Camera size={34} />

                    <span>
                      No images available
                    </span>

                  </div>

                </div>

              </div>
            ) : (
              <>

                <div className="detail-gallery">

                  <button
                    type="button"
                    className="detail-main-image-button"
                    aria-label={`View ${
                      attraction.name ||
                      "attraction"
                    } photo ${
                      safeActiveImg + 1
                    }`}
                  >

                    <img
                      src={activeImage}
                      alt={`${
                        attraction.name ||
                        "Attraction"
                      } photo ${
                        safeActiveImg + 1
                      }`}
                      className="detail-main-image"
                      loading="eager"
                      decoding="async"
                      onError={(event) => {
                        event.currentTarget.style.opacity =
                          "0";
                      }}
                    />

                  </button>

                  {images.length > 1 && (
                    <div className="detail-photo-count">

                      <Camera size={13} />

                      {safeActiveImg + 1} /{" "}
                      {images.length}

                    </div>
                  )}

                </div>

                {images.length > 1 && (
                  <div className="detail-thumbnails">

                    {images.map(
                      (
                        image,
                        index,
                      ) => (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          className={`detail-thumbnail ${
                            index ===
                            safeActiveImg
                              ? "active"
                              : ""
                          }`}
                          onClick={() =>
                            setActiveImg(
                              index,
                            )
                          }
                          aria-label={`View photo ${
                            index + 1
                          }`}
                        >

                          <img
                            src={image}
                            alt=""
                            loading="lazy"
                          />

                        </button>
                      ),
                    )}

                  </div>
                )}

              </>
            )}

            {/* SHARE + HEART */}

            <div className="detail-media-actions">

              <button
                type="button"
                className="detail-media-action detail-share-action"
                onClick={
                  handleShare
                }
                aria-label="Share attraction"
              >
                <Share2
                  size={18}
                  strokeWidth={2}
                />
              </button>

              <button
                type="button"
                className={`detail-media-action detail-favorite-action ${
                  favoriteActive
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  void handleFavorite()
                }
                aria-label={
                  favoriteActive
                    ? `Remove ${attraction.name} from favorites`
                    : `Add ${attraction.name} to favorites`
                }
                aria-pressed={
                  favoriteActive
                }
              >

                <Heart
                  className="detail-favorite-icon"
                  size={19}
                  strokeWidth={
                    favoriteActive
                      ? 2.25
                      : 1.9
                  }
                  fill={
                    favoriteActive
                      ? "currentColor"
                      : "none"
                  }
                />

                <span className="detail-favorite-count">
                  {favoriteCount}
                </span>

              </button>

            </div>

            {shareNotice && (
              <div className="detail-share-notice">
                {shareNotice}
              </div>
            )}

          </Col>

          <Col lg={4}>

            <div className="detail-location-card">

              <div className="detail-location-card-header">

                <div className="detail-location-icon">
                  <MapPin
                    size={18}
                    strokeWidth={1.9}
                  />
                </div>

                <div>

                  <p className="detail-location-kicker">
                    Location
                  </p>

                  <p className="detail-location-label">
                    Where to find it
                  </p>

                </div>

              </div>

              <p className="detail-location-address">
                {address ||
                  "Address not available yet."}
              </p>

              <div className="detail-location-divider" />

              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="detail-location-directions"
              >

                <Navigation size={17} />

                Get Directions

                <ExternalLink size={13} />

              </a>

              <div className="detail-location-directions-note">
                Opens the destination in
                Google Maps
              </div>

            </div>

          </Col>

        </Row>

        {/* =================================================
             PUBLIC TOURISM MAP
        ================================================= */}

        <section className="detail-map-section">

          <div className="detail-map-heading">

            <div className="detail-map-heading-copy">

              <h2 className="detail-map-title">

                <MapPin size={18} />

                Explore on the map

              </h2>

              <p className="detail-map-subtitle">
                View this attraction,
                other attractions, and
                accommodations using the
                locations saved by the
                administrator.
              </p>

            </div>

          </div>

          <AttractionMap
            currentAttraction={
              attraction
            }
            attractions={
              allAttractions
            }
            accommodations={
              accommodations
            }
            onOpenAttraction={
              handleMapAttractionClick
            }
          />

        </section>

        {/* =================================================
             MAIN CONTENT
        ================================================= */}

        <Row className="detail-main-row g-4">

          <Col lg={8}>

            {/* HEADING */}

            <div className="detail-heading-block">

              <div className="detail-category-row">

                {attraction.category &&
                  (() => {

                    const CategoryIcon =
                      CATEGORY_ICONS[
                        attraction.category as keyof typeof CATEGORY_ICONS
                      ] ||
                      MapPin;

                    const tint =
                      CATEGORY_TINTS[
                        attraction.category
                      ] || {
                        color:
                          CALBAYOG_BLUE,
                        background:
                          CALBAYOG_BLUE_SOFT,
                      };

                    return (
                      <span
                        className="detail-category-chip"
                        style={{
                          color:
                            tint.color,
                          background:
                            tint.background,
                        }}
                      >

                        <span
                          className="detail-category-icon"
                          style={{
                            color:
                              tint.color,
                          }}
                        >
                          <CategoryIcon
                            size={13}
                            strokeWidth={2}
                          />
                        </span>

                        <span>
                          {
                            attraction.category
                          }
                        </span>

                      </span>
                    );

                  })()}

                {attraction.category &&
                  displayAttractionType && (
                    <span className="detail-category-dot">
                      •
                    </span>
                  )}

                {displayAttractionType && (
                  <span className="detail-type">
                    {
                      displayAttractionType
                    }
                  </span>
                )}

              </div>

              <h1 className="detail-title">
                {attraction.name ||
                  "Unnamed Attraction"}
              </h1>

            </div>

            {/* DESCRIPTION */}

            <section className="detail-section">

              <h2 className="detail-section-heading">

                <Globe2 size={18} />

                About this attraction

              </h2>

              <p className="detail-description">

                {attraction.description ||
                  "No description is available for this attraction yet."}

              </p>

            </section>

            {/* THINGS TO DO */}

            {thingsToDo.length > 0 && (
              <section className="detail-section">

                <h2 className="detail-section-heading">

                  <ListChecks size={19} />

                  Things to do

                </h2>

                <div className="detail-things-grid">

                  {thingsToDo.map(
                    (
                      thing,
                      index,
                    ) => (
                      <div
                        className="detail-thing"
                        key={`${thing}-${index}`}
                      >

                        <span className="detail-thing-bullet" />

                        <span>
                          {thing}
                        </span>

                      </div>
                    ),
                  )}

                </div>

              </section>
            )}

            {/* ADD MEMORIES */}

            <div className="detail-memory-section">

              <div className="detail-memory-content">

                <div className="detail-memory-copy">

                  <div className="detail-memory-icon">
                    <Camera size={18} />
                  </div>

                  <div>

                    <p className="detail-memory-title">
                      Add Memories
                    </p>

                    <p className="detail-memory-subtitle">
                      Share your experience
                      and memorable moments
                      from this attraction.
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  className="detail-memory-button"
                  onClick={
                    handleAddMemories
                  }
                >

                  <Camera size={14} />

                  Add Memories

                </button>

              </div>

              {showMemoryForm && (
                <form
                  className="detail-memory-form"
                  onSubmit={
                    handleSubmitMemory
                  }
                >

                  <div className="detail-memory-form-header">

                    <h3>
                      Share Your Memory
                    </h3>

                    <button
                      type="button"
                      className="detail-memory-close"
                      onClick={() => {

                        if (
                          memorySubmitting
                        ) {
                          return;
                        }

                        setShowMemoryForm(
                          false,
                        );

                        setMemoryError(
                          "",
                        );

                      }}
                      disabled={
                        memorySubmitting
                      }
                    >
                      ×
                    </button>

                  </div>

                  <label htmlFor="memory-photo">
                    Upload Photo
                  </label>

                  <input
                    id="memory-photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={
                      handleMemoryPhotoChange
                    }
                    disabled={
                      memorySubmitting
                    }
                  />

                  <small>
                    JPG, PNG, or WEBP.
                    Maximum size: 5 MB.
                  </small>

                  {memoryPhotoPreview && (
                    <div className="detail-memory-preview">

                      <img
                        src={
                          memoryPhotoPreview
                        }
                        alt="Selected memory preview"
                      />

                    </div>
                  )}

                  <label htmlFor="memory-caption">
                    Caption
                  </label>

                  <textarea
                    id="memory-caption"
                    value={
                      memoryCaption
                    }
                    onChange={(event) =>
                      setMemoryCaption(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Tell us about your experience..."
                    maxLength={500}
                    rows={4}
                    disabled={
                      memorySubmitting
                    }
                  />

                  {memoryError && (
                    <div
                      className="detail-memory-error"
                      role="alert"
                    >
                      {memoryError}
                    </div>
                  )}

                  <div className="detail-memory-form-actions">

                    <button
                      type="button"
                      className="detail-memory-cancel"
                      onClick={() =>
                        setShowMemoryForm(
                          false,
                        )
                      }
                      disabled={
                        memorySubmitting
                      }
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="detail-memory-submit"
                      disabled={
                        memorySubmitting
                      }
                    >
                      {memorySubmitting
                        ? "Uploading..."
                        : "Submit Memory"}
                    </button>

                  </div>

                </form>
              )}

              {memoryNotice && (
                <div className="detail-memory-notice">

                  <CheckCircle2 size={14} />

                  <span>
                    {memoryNotice}
                  </span>

                </div>
              )}

            </div>

          </Col>

          {/* =================================================
               RIGHT INFORMATION
          ================================================= */}

          <Col lg={4}>

            <div className="detail-info-card">

              {website && (
                <>
                  <InfoItem
                    icon={
                      <Globe2 size={18} />
                    }
                    label="Website"
                    href={normalizeWebsiteUrl(
                      website,
                    )}
                    external
                  >
                    Visit official website
                  </InfoItem>

                  <div className="detail-info-divider" />
                </>
              )}

              {contactPerson && (
                <>
                  <InfoItem
                    icon={
                      <UserRound size={18} />
                    }
                    label="Contact Person"
                  >
                    {contactPerson}
                  </InfoItem>

                  <div className="detail-info-divider" />
                </>
              )}

              {contactNumber && (
                <>
                  <InfoItem
                    icon={
                      <Phone size={18} />
                    }
                    label="Contact Number"
                    href={`tel:${contactNumber}`}
                  >
                    {contactNumber}
                  </InfoItem>

                  <div className="detail-info-divider" />
                </>
              )}

              {operatingHours && (
                <>
                  <InfoItem
                    icon={
                      <Clock3 size={18} />
                    }
                    label="Operating Hours"
                  >
                    {operatingHours}
                  </InfoItem>

                  <div className="detail-info-divider" />
                </>
              )}

              {bestTime && (
                <InfoItem
                  icon={
                    <Sun size={18} />
                  }
                  label="Best Time to Visit"
                >
                  {bestTime}
                </InfoItem>
              )}

              {!website &&
                !contactPerson &&
                !contactNumber &&
                !operatingHours &&
                !bestTime && (
                  <div className="detail-info-item">

                    <div className="detail-info-icon">
                      <MapPin size={18} />
                    </div>

                    <div className="detail-info-copy">

                      <div className="detail-info-label">
                        Information
                      </div>

                      <div className="detail-info-value">
                        More attraction
                        information will
                        appear here when
                        available.
                      </div>

                    </div>

                  </div>
                )}

            </div>

          </Col>

        </Row>

      </Container>

    </div>
  );
};

export default AttractionDetail;
