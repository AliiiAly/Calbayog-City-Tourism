import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createPortal } from "react-dom";

import {
  useParams,
  useHistory,
} from "react-router-dom";

import {
  Container,
  Row,
  Col,
  Spinner,
} from "react-bootstrap";

import {
  ArrowLeft,
  Briefcase,
  Building2,
  Camera,
  Globe2,
  ListChecks,
  Mail,
  MapPin,
  MapPinned,
  Maximize2,
  Phone,
  Share2,
  Tag,
  UserRound,
  X,
} from "lucide-react";

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  LayersControl,
  LayerGroup,
  useMap,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

import {
  getAccommodation,
  getAccommodations,
} from "../services/api";

import {
  subscribeToAccommodations,
  unsubscribeAll,
} from "../services/supabase";

import { Accommodation } from "../types";

const CALBAYOG_BLUE = "#2D3195";
const CALBAYOG_BLUE_SOFT = "#EEF0FF";

const TEXT = "#20232A";
const MUTED = "#727985";
const BORDER = "#E8EAF0";

const DEFAULT_LATITUDE = 12.0668;
const DEFAULT_LONGITUDE = 124.6041;

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

/* =========================================================
   TYPES
========================================================= */

interface MapCoordinates {
  lat: number;
  lng: number;
}

interface AccommodationMapPlace {
  id: string;
  name: string;
  address: string;
  priceRange: string;
  coordinates: MapCoordinates;
  isCurrent: boolean;
}

/* =========================================================
   HELPERS
========================================================= */

const cleanString = (
  value: unknown,
): string => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
};

const normalizeId = (
  value: unknown,
): string =>
  String(value ?? "")
    .trim()
    .toLowerCase();

/*
 * AdminAccommodations saves the exact selected map pin in the
 * latitude / longitude columns, so those are read first.
 */
const getCoordinates = (
  item: any,
): MapCoordinates | null => {
  const latitudeValue =
    item?.latitude ??
    item?.location_lat ??
    item?.location?.lat ??
    item?.lat;

  const longitudeValue =
    item?.longitude ??
    item?.location_lng ??
    item?.location?.lng ??
    item?.lng ??
    item?.lon;

  if (
    latitudeValue === null ||
    latitudeValue === undefined ||
    latitudeValue === "" ||
    longitudeValue === null ||
    longitudeValue === undefined ||
    longitudeValue === ""
  ) {
    return null;
  }

  const lat = Number(latitudeValue);
  const lng = Number(longitudeValue);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return null;
  }

  if (
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return {
    lat,
    lng,
  };
};

const normalizeWebsiteUrl = (
  website: string,
): string => {
  const value =
    website.trim();

  if (!value) {
    return "";
  }

  return /^https?:\/\//i.test(
    value,
  )
    ? value
    : `https://${value}`;
};

/* =========================================================
   PIN DESIGN

   Accommodation pin: blue pin with a hotel symbol.
   Change ACCOMMODATION_PIN_COLOR / ACCOMMODATION_PIN_ICON
   below if the admin map uses a different look.
========================================================= */

const ACCOMMODATION_PIN_COLOR = CALBAYOG_BLUE;
const ACCOMMODATION_PIN_ICON = "🏨";

const createAccommodationMarkerIcon = (
  isCurrent: boolean,
) =>
  L.divIcon({
    className: "calbayog-location-marker",

    html: `
      <div class="calbayog-marker-shell ${
        isCurrent ? "is-current" : ""
      }">
        <div class="calbayog-marker-pin" style="background:${ACCOMMODATION_PIN_COLOR}"></div>
        <div class="calbayog-marker-icon">${ACCOMMODATION_PIN_ICON}</div>
      </div>
    `,

    iconSize: [44, 52],
    iconAnchor: [22, 49],
    popupAnchor: [0, -47],
    tooltipAnchor: [0, -43],
  });

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

const InfoItem: React.FC<
  InfoItemProps
> = ({
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
      target={
        external
          ? "_blank"
          : undefined
      }
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

const SATELLITE_LABELS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";

const SATELLITE_ROADS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}";

const MapRecenter: React.FC<{
  center: [number, number];
}> = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, 17, {
      animate: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, center[0], center[1]]);

  return null;
};

const MapZoomWatcher: React.FC<{
  onZoom: (zoom: number) => void;
}> = ({ onZoom }) => {
  const map = useMapEvents({
    zoomend: () => onZoom(map.getZoom()),
  });

  useEffect(() => {
    onZoom(map.getZoom());
  }, [map, onZoom]);

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
        const next: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];

        map.flyTo(next, Math.max(map.getZoom(), 16), {
          duration: 0.8,
        });
        setLocating(false);
      },
      () => {
        window.alert(
          "Unable to get your location. Please allow location access and try again.",
        );
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
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

interface AccommodationMapProps {
  center: [number, number];
  places: AccommodationMapPlace[];
  interactive: boolean;
}

const AccommodationMap: React.FC<AccommodationMapProps> = ({
  center,
  places,
  interactive,
}) => {
  const [zoom, setZoom] = useState(15);

  const handleZoom = useCallback(
    (value: number) => setZoom(value),
    [],
  );

  const icons = useMemo(
    () =>
      new Map(
        places.map((place) => [
          place.id,
          createAccommodationMarkerIcon(
            place.isCurrent,
          ),
        ]),
      ),
    [places],
  );

  return (
    <div
      className="detail-map-canvas"
      data-zoom={zoom}
    >
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom={interactive}
        dragging={interactive}
        touchZoom={interactive}
        doubleClickZoom={interactive}
        boxZoom={interactive}
        keyboard={interactive}
        zoomControl={interactive}
        className="detail-map"
      >
        <MapRecenter center={center} />
        <MapZoomWatcher onZoom={handleZoom} />
        <MapScaleControl />

        {interactive ? (
          <>
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Street">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              </LayersControl.BaseLayer>

              <LayersControl.BaseLayer name="Satellite">
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
          </>
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}

        {places.map((place) => (
          <Marker
            key={`accommodation-${place.id}-${place.isCurrent}-${place.name}`}
            position={[place.coordinates.lat, place.coordinates.lng]}
            icon={icons.get(place.id)}
            interactive={interactive}
            zIndexOffset={place.isCurrent ? 1000 : 0}
          >
            <Tooltip
              permanent
              direction="top"
              offset={[0, -4]}
              opacity={1}
              className={`calbayog-map-label ${
                place.isCurrent ? "current" : ""
              }`}
            >
              <span className="calbayog-map-label-name">
                {place.name}
              </span>
              <span className="calbayog-map-label-sub">
                Hotels &amp; Resorts
              </span>
            </Tooltip>

            {interactive && (
              <Popup>
                <div className="detail-map-popup">
                  <div
                    className={`detail-map-popup-badge ${
                      place.isCurrent ? "current" : ""
                    }`}
                  >
                    <MapPin size={10} />
                    {place.isCurrent
                      ? "Current accommodation"
                      : "Accommodation"}
                  </div>
                  <h3 className="detail-map-popup-title">
                    {place.name}
                  </h3>
                  <p className="detail-map-popup-category">
                    Hotels &amp; Resorts
                    {place.priceRange
                      ? ` • ${place.priceRange}`
                      : ""}
                  </p>
                  {place.address && (
                    <p className="detail-map-popup-address">
                      {place.address}
                    </p>
                  )}
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

const openStreetLevelView = (
  coordinates: MapCoordinates | null,
): void => {
  if (!coordinates) {
    return;
  }

  const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${coordinates.lat},${coordinates.lng}`;

  const opened = window.open(
    url,
    "_blank",
    "noopener,noreferrer",
  );

  if (!opened) {
    window.location.href = url;
  }
};

/* =========================================================
   COMPONENT
========================================================= */

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

    const [mapOpen, setMapOpen] =
      useState(false);

    const [
      shareNotice,
      setShareNotice,
    ] = useState("");

    const [
      allAccommodationsForMap,
      setAllAccommodationsForMap,
    ] = useState<any[]>([]);

    /* =====================================================
       LOAD ACCOMMODATION
    ===================================================== */

    useEffect(() => {
      fetchAccommodation();
      setShareNotice("");
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
       LOAD ALL ACCOMMODATIONS FOR THE MAP
    ===================================================== */

    useEffect(() => {
      let mounted = true;

      const fetchAllMapAccommodations =
        async () => {
          try {
            const response =
              await getAccommodations();

            const data =
              Array.isArray(
                response?.data,
              )
                ? response.data
                : [];

            if (mounted) {
              setAllAccommodationsForMap(
                data,
              );
            }
          } catch (mapError) {
            console.error(
              "Failed to load accommodation map places:",
              mapError,
            );

            if (mounted) {
              setAllAccommodationsForMap(
                [],
              );
            }
          }
        };

      void fetchAllMapAccommodations();

      subscribeToAccommodations(
        () => {
          void fetchAllMapAccommodations();
        },
      );

      return () => {
        mounted = false;
        unsubscribeAll();
      };
    }, []);

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

    const priceRangeText =
      cleanString(acc?.price_range);

    const priceText = priceRangeText
      ? priceRangeText
      : hasMinPrice || hasMaxPrice
        ? `${
            hasMinPrice
              ? `₱${Number(
                  getPriceMin()
                ).toLocaleString()}`
              : ""
          }${
            hasMinPrice && hasMaxPrice
              ? ` – ₱${Number(
                  getPriceMax()
                ).toLocaleString()}`
              : !hasMinPrice &&
                  hasMaxPrice
                ? `Up to ₱${Number(
                    getPriceMax()
                  ).toLocaleString()}`
                : "+"
          } / night`
        : "";

    const images: string[] =
      Array.isArray(acc?.images)
        ? acc.images
            .map(cleanString)
            .filter(Boolean)
        : [];

    const activeImage =
      selectedImage || "";

    const activeIndex =
      activeImage
        ? Math.max(
            0,
            images.indexOf(
              activeImage
            )
          )
        : 0;

    const amenities: string[] =
      Array.isArray(acc?.amenities)
        ? acc.amenities
        : [];

    /* =====================================================
       SHARE
    ===================================================== */

    const handleShare =
      async () => {
        const shareData = {
          title:
            acc?.name ||
            "Calbayog accommodation",

          text: `Check out ${
            acc?.name ||
            "this accommodation"
          } in Calbayog City.`,

          url: window.location.href,
        };

        try {
          if (navigator.share) {
            await navigator.share(
              shareData,
            );
          } else if (
            navigator.clipboard
          ) {
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
        } catch (shareError: any) {
          if (
            shareError?.name !==
            "AbortError"
          ) {
            setShareNotice(
              "Unable to share this accommodation right now.",
            );
          }
        }
      };

    /* =====================================================
       MAP PLACES
    ===================================================== */

    const mapPlaces =
      useMemo<
        AccommodationMapPlace[]
      >(() => {
        const sourceById =
          new Map<string, any>();

        allAccommodationsForMap.forEach(
          (item) => {
            const itemId =
              normalizeId(
                item?.id ?? item?._id,
              );

            if (itemId) {
              sourceById.set(
                itemId,
                item,
              );
            }
          },
        );

        const currentId =
          normalizeId(
            (accommodation as any)
              ?.id ??
              (accommodation as any)
                ?._id,
          );

        if (
          currentId &&
          accommodation
        ) {
          sourceById.set(
            currentId,
            accommodation,
          );
        }

        return Array.from(
          sourceById.values(),
        )
          .map((item: any) => {
            const coordinates =
              getCoordinates(item);

            if (!coordinates) {
              return null;
            }

            const itemId =
              cleanString(
                item?.id ??
                  item?._id,
              );

            if (!itemId) {
              return null;
            }

            return {
              id: itemId,

              name:
                cleanString(
                  item?.name,
                ) ||
                "Accommodation",

              address:
                cleanString(
                  item?.address,
                ),

              priceRange:
                cleanString(
                  item?.price_range,
                ),

              coordinates,

              isCurrent:
                normalizeId(itemId) ===
                currentId,
            };
          })
          .filter(
            (
              place,
            ): place is AccommodationMapPlace =>
              Boolean(place),
          );
      }, [
        allAccommodationsForMap,
        accommodation,
      ]);

    const currentMapCoordinates =
      accommodation
        ? getCoordinates(
            accommodation,
          )
        : null;

    const mapCenter: [
      number,
      number,
    ] =
      currentMapCoordinates
        ? [
            currentMapCoordinates.lat,
            currentMapCoordinates.lng,
          ]
        : [
            DEFAULT_LATITUDE,
            DEFAULT_LONGITUDE,
          ];

    const hasMapPlaces =
      mapPlaces.length > 0;

    /* =====================================================
       ENLARGED MAP (close with Esc, lock page scroll)
    ===================================================== */

    useEffect(() => {
      if (!mapOpen) {
        return;
      }

      const handleKeyDown = (
        event: KeyboardEvent,
      ) => {
        if (
          event.key === "Escape"
        ) {
          setMapOpen(false);
        }
      };

      const previousOverflow =
        document.body.style
          .overflow;

      document.body.style.overflow =
        "hidden";

      window.addEventListener(
        "keydown",
        handleKeyDown,
      );

      return () => {
        document.body.style.overflow =
          previousOverflow;

        window.removeEventListener(
          "keydown",
          handleKeyDown,
        );
      };
    }, [mapOpen]);

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
      return (
        <div className="detail-state-page page-enter">
          <style>{`
            .detail-state-page {
              min-height: 72vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 50px 20px;
              background: #ffffff;
              font-family: "Nunito", "Poppins", "Segoe UI", sans-serif;
            }

            .detail-loading-card {
              width: 100%;
              max-width: 480px;
              text-align: center;
            }

            .detail-loading-icon {
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

            .detail-loading-icon .spinner-border {
              color: ${CALBAYOG_BLUE};
            }

            .detail-loading-card h2 {
              margin: 0 0 6px;
              color: ${TEXT};
              font-size: 1rem;
              font-weight: 900;
            }

            .detail-loading-card p {
              margin: 0 auto 18px;
              max-width: 400px;
              color: ${MUTED};
              font-size: 0.71rem;
              line-height: 1.6;
              font-weight: 700;
            }
          `}</style>

          <div className="detail-loading-card">
            <div className="detail-loading-icon">
              <Spinner animation="border" />
            </div>

            <h2>
              Loading accommodation
            </h2>

            <p>
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
        <div className="detail-state-page page-enter">
          <style>{`
            .detail-state-page {
              min-height: 72vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 50px 20px;
              background: #ffffff;
              font-family: "Nunito", "Poppins", "Segoe UI", sans-serif;
            }

            .detail-empty-card {
              width: 100%;
              max-width: 480px;
              text-align: center;
            }

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

            .detail-empty-card h1 {
              margin: 0 0 6px;
              color: ${TEXT};
              font-size: 1rem;
              font-weight: 900;
            }

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
          `}</style>

          <div className="detail-empty-card">
            <div className="detail-empty-icon">
              <Building2
                size={34}
                strokeWidth={1.8}
              />
            </div>

            <h1>
              Accommodation not found
            </h1>

            <p>
              {error ||
                "Accommodation not found"}
            </p>

            <button
              type="button"
              className="detail-primary-button"
              onClick={() =>
                history.push(
                  "/accommodations"
                )
              }
            >
              <ArrowLeft
                size={16}
              />
              Back to accommodations
            </button>
          </div>
        </div>
      );
    }

    /* =====================================================
       RENDER
    ===================================================== */

    return (
      <div className="attraction-detail-page page-enter">
        <style>{`
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
            transition:
              color 0.2s ease,
              transform 0.2s ease;
          }

          .detail-back-button:hover {
            color: ${CALBAYOG_BLUE};
            transform: translateX(-2px);
          }

          /* HERO */

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
            box-shadow: 0 10px 30px rgba(20, 29, 57, 0.08);
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
            transition: transform 0.45s cubic-bezier(0.2, 0.65, 0.3, 1);
          }

          .detail-gallery:hover .detail-main-image {
            transform: scale(1.008);
          }

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
            background: rgba(0, 0, 0, 0.42);
            color: #ffffff;
            font-size: 0.61rem;
            font-weight: 900;
            backdrop-filter: blur(10px);
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

          /* SHARE */

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
            transition:
              color 0.2s ease,
              transform 0.2s ease;
          }

          .detail-media-action:hover,
          .detail-media-action:focus-visible {
            transform: translateY(-1px);
            color: ${CALBAYOG_BLUE};
            background: transparent;
          }

          .detail-share-action:active {
            transform: scale(0.96);
          }

          .detail-share-notice {
            margin: 7px 0 0;
            text-align: right;
            color: ${CALBAYOG_BLUE};
            font-size: 0.6rem;
            font-weight: 800;
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

          .detail-map-stat {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            min-height: 28px;
            padding: 5px 9px;
            border-radius: 999px;
            background: #f7f8fa;
            color: #666e79;
            font-size: 0.59rem;
            font-weight: 900;
          }

          .detail-map {
            width: 100%;
            height: 100%;
          }

          /* LOCATION CARD MAP (compact preview) */

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

          .detail-location-map-action:disabled {
            opacity: 0.55;
            cursor: not-allowed;
          }

          .detail-map-header-actions {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .detail-map-street-button {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            min-height: 36px;
            padding: 7px 11px;
            border: 1px solid ${BORDER};
            border-radius: 999px;
            background: #ffffff;
            color: ${CALBAYOG_BLUE};
            font-size: 0.6rem;
            font-weight: 900;
            cursor: pointer;
          }

          .detail-map-street-button:hover {
            border-color: ${CALBAYOG_BLUE};
            background: ${CALBAYOG_BLUE_SOFT};
          }

          .detail-map-street-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
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

          .detail-map-canvas {
            width: 100%;
            height: 100%;
          }

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
            font-family:
              "Nunito",
              "Poppins",
              "Segoe UI",
              sans-serif;
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
            transition:
              background 0.2s ease,
              color 0.2s ease;
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
            from {
              opacity: 0;
            }

            to {
              opacity: 1;
            }
          }

          .calbayog-map-custom-control {
            margin-top: 10px;
          }

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

          .calbayog-map-custom-control button:hover {
            background: #f4f5f7;
            color: ${CALBAYOG_BLUE};
          }

          .calbayog-map-custom-control button:disabled {
            cursor: wait;
            opacity: 0.65;
          }

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

          /* MAP NAME LABELS */

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
            font-family:
              "Nunito",
              "Poppins",
              "Segoe UI",
              sans-serif;
            font-size: 0.64rem;
            font-weight: 850;
            pointer-events: none;
          }

          .leaflet-tooltip-top.calbayog-map-label::before {
            border-top-color: #20263a;
          }

          .leaflet-tooltip.calbayog-map-label.current {
            background: #e33f5f;
          }

          .leaflet-tooltip-top.calbayog-map-label.current::before {
            border-top-color: #e33f5f;
          }

          .calbayog-map-label-name {
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .calbayog-map-label-sub {
            display: block;
            margin-top: 1px;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 0.85em;
            font-weight: 700;
            opacity: 0.8;
          }

          .detail-location-map-wrap
            .leaflet-tooltip.calbayog-map-label {
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

          .calbayog-marker-shell.is-current
            .calbayog-marker-pin {
            box-shadow: 0 0 0 3px rgba(227, 63, 95, 0.6);
          }

          /* MAP POPUP */

          .detail-map-popup {
            min-width: 190px;
            max-width: 260px;
          }

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

          .detail-map-popup-badge.current {
            background: #fff0f3;
            color: #d73554;
          }

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

          /* SECTION */

          .detail-section {
            padding: 22px 0;
            border-bottom: 1px solid ${BORDER};
          }

          .detail-section:last-child {
            border-bottom: 0;
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

          /* AMENITIES */

          .detail-things-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(185px, 1fr));
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

          .detail-thing-emoji {
            font-size: 1rem;
            line-height: 1.2;
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

          /* RESPONSIVE */

          @media (max-width: 991.98px) {
            .detail-location-card {
              margin-top: 18px;
              min-height: auto;
            }

            .detail-info-card {
              position: static;
            }

            .detail-map-header {
              flex-direction: column;
            }

            .detail-map-stats {
              justify-content: flex-start;
            }

            .detail-map-header-actions {
              width: 100%;
              justify-content: flex-end;
            }
          }

          @media (max-width: 767.98px) {
            .attraction-detail-container {
              padding: 18px 16px 55px;
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

            .detail-map-modal {
              padding: 10px;
            }

            .detail-map-modal-card {
              max-height: calc(100vh - 20px);
              padding: 13px;
              border-radius: 16px;
            }

            .detail-map-modal-body {
              height: calc(100vh - 270px);
              min-height: 300px;
            }

            .detail-map-legend {
              gap: 8px;
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
              min-height: 0;
              min-width: 0;
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

            .detail-map-title {
              font-size: 0.9rem;
            }

            .detail-map-subtitle {
              font-size: 0.6rem;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .detail-back-button,
            .detail-main-image,
            .detail-thumbnail,
            .detail-media-action {
              transition: none !important;
            }
          }
        `}</style>

        <Container className="attraction-detail-container">
          {/* BACK */}

          <button
            type="button"
            className="detail-back-button"
            onClick={() =>
              history.push(
                "/accommodations"
              )
            }
          >
            <ArrowLeft
              size={15}
            />
            Back to accommodations
          </button>

          {/* IMAGE + LOCATION */}

          <Row className="detail-hero-row g-4">
            <Col
              lg={8}
              className="detail-gallery-column"
            >
              {images.length ===
              0 ? (
                <div className="detail-gallery">
                  <div className="detail-gallery-fallback">
                    <div className="detail-gallery-fallback-content">
                      <Camera
                        size={34}
                      />

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
                        acc.name ||
                        "accommodation"
                      } photo ${
                        activeIndex + 1
                      }`}
                    >
                      <img
                        src={
                          activeImage
                        }
                        alt={`${
                          acc.name ||
                          "Accommodation"
                        } photo ${
                          activeIndex + 1
                        }`}
                        className="detail-main-image"
                        loading="eager"
                        decoding="async"
                        onError={(
                          event,
                        ) => {
                          event.currentTarget.style.opacity =
                            "0";
                        }}
                      />
                    </button>

                    {images.length >
                      1 && (
                      <div className="detail-photo-count">
                        <Camera
                          size={13}
                        />

                        {activeIndex +
                          1}{" "}
                        /{" "}
                        {
                          images.length
                        }
                      </div>
                    )}
                  </div>

                  {images.length >
                    1 && (
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
                              image ===
                              activeImage
                                ? "active"
                                : ""
                            }`}
                            onClick={() =>
                              setSelectedImage(
                                image,
                              )
                            }
                            aria-label={`View photo ${
                              index + 1
                            }`}
                          >
                            <img
                              src={
                                image
                              }
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

              {/* SHARE */}

              <div className="detail-media-actions">
                <button
                  type="button"
                  className="detail-media-action detail-share-action"
                  onClick={
                    handleShare
                  }
                  aria-label="Share accommodation"
                >
                  <Share2
                    size={18}
                    strokeWidth={
                      2
                    }
                  />
                </button>
              </div>

              {shareNotice && (
                <div className="detail-share-notice">
                  {
                    shareNotice
                  }
                </div>
              )}
            </Col>

            <Col lg={4}>
              <div className="detail-location-card">
                <div className="detail-location-card-header">
                  <div className="detail-location-icon">
                    <MapPin
                      size={18}
                      strokeWidth={
                        1.9
                      }
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
                  {getAddress()}
                </p>

                <div className="detail-location-divider" />

                {hasMapPlaces ? (
                  <div className="detail-location-map-wrap">
                    <AccommodationMap
                      center={mapCenter}
                      places={
                        mapPlaces
                      }
                      interactive
                    />

                    <div className="detail-location-map-actions">
                      <button
                        type="button"
                        className="detail-location-map-action street-level"
                        onClick={() =>
                          openStreetLevelView(
                            currentMapCoordinates,
                          )
                        }
                        disabled={!currentMapCoordinates}
                        aria-label="Open street-level view"
                      >
                        <MapPinned size={13} />
                        Street View
                      </button>

                      <button
                        type="button"
                        className="detail-location-map-action"
                        onClick={() =>
                          setMapOpen(true)
                        }
                        aria-label="View larger map"
                      >
                        <Maximize2 size={13} />
                        Larger map
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="detail-location-map-empty">
                    The map location for this
                    accommodation has not been set
                    yet.
                  </div>
                )}
              </div>
            </Col>
          </Row>

          {/* MAIN CONTENT */}

          <Row className="detail-main-row g-4">
            <Col lg={8}>
              {/* HEADING */}

              <div className="detail-heading-block">
                <div className="detail-category-row">
                  <span
                    className="detail-category-chip"
                    style={{
                      color:
                        CALBAYOG_BLUE,

                      background:
                        CALBAYOG_BLUE_SOFT,
                    }}
                  >
                    <span
                      className="detail-category-icon"
                      style={{
                        color:
                          CALBAYOG_BLUE,
                      }}
                    >
                      <Building2
                        size={13}
                        strokeWidth={
                          2
                        }
                      />
                    </span>

                    <span>
                      Hotels &amp; Resorts
                    </span>
                  </span>
                </div>

                <h1 className="detail-title">
                  {acc.name ||
                    "Unnamed Accommodation"}
                </h1>
              </div>

              {/* DESCRIPTION */}

              {acc.description && (
                <section className="detail-section">
                  <h2 className="detail-section-heading">
                    <Globe2
                      size={18}
                    />

                    About this accommodation
                  </h2>

                  <p className="detail-description">
                    {
                      acc.description
                    }
                  </p>
                </section>
              )}

              {/* AMENITIES */}

              {amenities.length >
                0 && (
                <section className="detail-section">
                  <h2 className="detail-section-heading">
                    <ListChecks
                      size={19}
                    />

                    Amenities
                  </h2>

                  <div className="detail-things-grid">
                    {amenities.map(
                      (
                        amenity: string
                      ) => (
                        <div
                          className="detail-thing"
                          key={
                            amenity
                          }
                        >
                          <span className="detail-thing-emoji">
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
                      ),
                    )}
                  </div>
                </section>
              )}
            </Col>

            {/* RIGHT INFORMATION */}

            <Col lg={4}>
              <div className="detail-info-card">
                {priceText && (
                  <>
                    <InfoItem
                      icon={
                        <Tag
                          size={18}
                        />
                      }
                      label="Price Range"
                    >
                      {priceText}
                    </InfoItem>

                    <div className="detail-info-divider" />
                  </>
                )}

                {acc.owner && (
                  <>
                    <InfoItem
                      icon={
                        <UserRound
                          size={18}
                        />
                      }
                      label="Owner"
                    >
                      {acc.owner}
                    </InfoItem>

                    <div className="detail-info-divider" />
                  </>
                )}

                {acc.manager && (
                  <>
                    <InfoItem
                      icon={
                        <Briefcase
                          size={18}
                        />
                      }
                      label="Manager"
                    >
                      {acc.manager}
                    </InfoItem>

                    <div className="detail-info-divider" />
                  </>
                )}

                {getPhone() && (
                  <>
                    {/* View only: intentionally NOT a tel: link */}
                    <InfoItem
                      icon={
                        <Phone
                          size={18}
                        />
                      }
                      label="Contact Number"
                    >
                      {getPhone()}
                    </InfoItem>

                    <div className="detail-info-divider" />
                  </>
                )}

                {getEmail() && (
                  <>
                    <InfoItem
                      icon={
                        <Mail
                          size={18}
                        />
                      }
                      label="Email"
                      href={`mailto:${getEmail()}`}
                    >
                      {getEmail()}
                    </InfoItem>

                    <div className="detail-info-divider" />
                  </>
                )}

                {getWebsite() && (
                  <InfoItem
                    icon={
                      <Globe2
                        size={18}
                      />
                    }
                    label="Website"
                    href={normalizeWebsiteUrl(
                      getWebsite(),
                    )}
                    external
                  >
                    Visit official
                    website
                  </InfoItem>
                )}

                {!priceText &&
                  !acc.owner &&
                  !acc.manager &&
                  !getPhone() &&
                  !getEmail() &&
                  !getWebsite() && (
                    <div className="detail-info-item">
                      <div className="detail-info-icon">
                        <Building2
                          size={18}
                        />
                      </div>

                      <div className="detail-info-copy">
                        <div className="detail-info-label">
                          Information
                        </div>

                        <div className="detail-info-value">
                          More
                          accommodation
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

        {/* ENLARGED MAP */}

        {mapOpen &&
          createPortal(
            <div
              className="detail-map-modal"
              role="dialog"
              aria-modal="true"
              aria-label={`Map of ${acc.name}`}
              onClick={() =>
                setMapOpen(false)
              }
            >
              <div
                className="detail-map-modal-card"
                onClick={(event) =>
                  event.stopPropagation()
                }
              >
                <div className="detail-map-header">
                  <div className="detail-map-header-left">
                    <div className="detail-map-icon">
                      <MapPinned
                        size={19}
                      />
                    </div>

                    <div>
                      <p className="detail-map-kicker">
                        Explore Calbayog
                      </p>

                      <h2 className="detail-map-title">
                        Calbayog Hotels &amp; Resorts
                      </h2>

                      <p className="detail-map-subtitle">
                        Drag the map, switch map styles, use your location, or open street-level imagery.
                      </p>
                    </div>
                  </div>

                  <div className="detail-map-stats">
                    <span className="detail-map-stat">
                      <MapPin size={12} />
                      {mapPlaces.length}{" "}
                      accommodations
                    </span>

                    <div className="detail-map-header-actions">
                      <button
                        type="button"
                        className="detail-map-street-button"
                        onClick={() =>
                          openStreetLevelView(
                            currentMapCoordinates,
                          )
                        }
                        disabled={!currentMapCoordinates}
                      >
                        <MapPinned size={14} />
                        Street View
                      </button>

                      <button
                        type="button"
                        className="detail-map-modal-close"
                        onClick={() =>
                          setMapOpen(false)
                        }
                        aria-label="Close map"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="detail-map-modal-body">
                  <AccommodationMap
                    center={mapCenter}
                    places={
                      mapPlaces
                    }
                    interactive
                  />
                </div>

                <div className="detail-map-legend">
                  <span className="detail-map-legend-item">
                    <span
                      className="detail-map-legend-dot"
                      style={{
                        background:
                          ACCOMMODATION_PIN_COLOR,
                      }}
                    />
                    Hotels &amp; Resorts
                  </span>

                  <span className="detail-map-legend-item">
                    <span
                      className="detail-map-legend-dot"
                      style={{
                        background:
                          "#e33f5f",
                      }}
                    />
                    Current accommodation (red label)
                  </span>
                </div>
              </div>
            </div>,
            document.body,
          )}
      </div>
    );
  };

export default AccommodationDetail;
