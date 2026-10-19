import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Link, useHistory } from "react-router-dom";

import { Container, Row, Col } from "react-bootstrap";

import {
  getAccommodations,
  getAttractions,
  getFeaturedVideos,
  getRestaurants,
  getEvents,
  FeaturedVideo,
} from "../services/api";

import { Destination, Accommodation } from "../types";

import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";

import AttractionCard from "../components/attractions/AttractionCard";
import AccommodationCard, {
  AccommodationCardItem,
} from "../components/accommodations/AccommodationCard";
import RestaurantCard, {
  RestaurantCardItem,
} from "../components/restaurants/RestaurantCard";
import EventCard, { EventCardItem } from "../components/events/EventCard";

import {
  Mountain,
  Hotel,
  CalendarDays,
  Compass,
  MapPinned,
  Images,
  MapPin,
  CloudSun,
  ChevronLeft,
  ChevronRight,
  Play,
  UtensilsCrossed,
  Clock3,
  Phone,
  Tag,
  Globe2,
  X,
} from "lucide-react";

import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Navigation, Pagination, A11y } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";
import "swiper/css/pagination";

import {
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  LayersControl,
  LayerGroup,
  useMap,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* =========================================================
    BRAND COLOR
========================================================= */

const CALBAYOG_BLUE = "#2D3195";

/* =========================================================
    SMALL SHARED PIECES
========================================================= */

const BUNTING_COLORS = ["red", "orange", "yellow", "teal"];

const Bunting: React.FC<{ className: string; count: number }> = ({
  className,
  count,
}) => (
  <div className={className} aria-hidden="true">
    {Array.from({ length: count }, (_, index) => (
      <span
        key={index}
        className={`bunting-flag bunting-${BUNTING_COLORS[index % 4]}`}
      />
    ))}
  </div>
);

const SectionHeading: React.FC<{
  headingClass: string;
  titleClass: string;
  eyebrowClass: string;
  title: string;
  subtitle: string;
}> = ({ headingClass, titleClass, eyebrowClass, title, subtitle }) => (
  <div className={headingClass}>
    <Bunting className="welcome-mobile-bunting" count={12} />

    <h2 className={`${titleClass} barabara-display`}>{title}</h2>

    <div className={`welcome-section-eyebrow ${eyebrowClass}`}>
      <span className="welcome-heading-line" />
      <span>{subtitle}</span>
      <span className="welcome-heading-line" />
    </div>
  </div>
);

/* =========================================================
    QUICK ACCESS CARDS
========================================================= */

const quickCards: Array<{
  icon: React.ElementType;
  label: string;
  hint: string;
  to: string;
  from: string;
  toColor: string;
  glow: string;
}> = [
  {
    icon: Mountain,
    label: "Attractions",
    hint: "Places to see",
    to: "/attractions",
    from: "#0077B6",
    toColor: "#27B3D6",
    glow: "rgba(0, 119, 182, 0.26)",
  },
  {
    icon: Hotel,
    label: "Stays",
    hint: "Where to rest",
    to: "/accommodations",
    from: "#F4A226",
    toColor: "#F8CB63",
    glow: "rgba(244, 162, 38, 0.30)",
  },
  {
    icon: UtensilsCrossed,
    label: "Dining",
    hint: "Taste Calbayog",
    to: "/restaurants",
    from: "#E8590C",
    toColor: "#F5A05C",
    glow: "rgba(232, 89, 12, 0.27)",
  },
  {
    icon: CalendarDays,
    label: "Events",
    hint: "What's happening",
    to: "/events",
    from: "#E63946",
    toColor: "#F37580",
    glow: "rgba(230, 57, 70, 0.26)",
  },
  {
    icon: Compass,
    label: "Guides",
    hint: "Local experts",
    to: "/guides",
    from: "#2D6A4F",
    toColor: "#52A07F",
    glow: "rgba(45, 106, 79, 0.26)",
  },
  {
    icon: MapPinned,
    label: "Plan Trip",
    hint: "Build your day",
    to: "/itinerary",
    from: "#2D3195",
    toColor: "#5F65D6",
    glow: "rgba(45, 49, 149, 0.28)",
  },
  {
    icon: Images,
    label: "My Memories",
    hint: "Your keepsakes",
    to: "/memories",
    from: "#C45A8D",
    toColor: "#E68BB7",
    glow: "rgba(196, 90, 141, 0.27)",
  },
];

/* =========================================================
    HERO SLIDES
========================================================= */

const heroSlides = [
  { id: "calbayog-1", image: "/calbayog1.jpg", alt: "Calbayog City" },
  { id: "calbayog-2", image: "/calbayog2.jpeg", alt: "Calbayog City" },
  { id: "calbayog-3", image: "/calbayog3.jpg", alt: "Calbayog City" },
  { id: "calbayogonair", image: "/calbayogonair.webp", alt: "Calbayog City" },
];

/* =========================================================
    WEATHER
========================================================= */

type WeatherState = {
  temperature: number | null;
  weatherCode: number | null;
  isDay: boolean;
  loading: boolean;
  error: boolean;
};

const WEATHER_DESCRIPTIONS: Array<[number[], string]> = [
  [[0], "Clear sky"],
  [[1, 2], "Partly cloudy"],
  [[3], "Overcast"],
  [[45, 48], "Foggy"],
  [[51, 53, 55], "Drizzle"],
  [[56, 57], "Freezing drizzle"],
  [[61, 63, 65], "Rain"],
  [[66, 67], "Freezing rain"],
  [[71, 73, 75], "Snow"],
  [[77], "Snow grains"],
  [[80, 81, 82], "Rain showers"],
  [[85, 86], "Snow showers"],
  [[95], "Thunderstorm"],
  [[96, 99], "Thunderstorm with hail"],
];

const getWeatherDescription = (weatherCode: number | null): string => {
  if (weatherCode === null) return "Weather unavailable";

  const match = WEATHER_DESCRIPTIONS.find(([codes]) =>
    codes.includes(weatherCode),
  );

  return match ? match[1] : "Current weather";
};

/* =========================================================
    WELCOME PAGE MAP
    Uses the exact saved location_lat / location_lng values.
========================================================= */

const DEFAULT_CALBAYOG_CENTER: [number, number] = [12.0667, 124.6];

const SATELLITE_LABELS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";

const SATELLITE_ROADS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}";

interface WelcomeMapCoordinates {
  lat: number;
  lng: number;
}

interface WelcomeMapPlaceDetails {
  id: string;
  name: string;
  address: string;
  coordinates: WelcomeMapCoordinates;
  images: string[];
  description: string;
  phone: string;
  hours: string;
  price: string;
  website: string;
}

interface WelcomeMapAttraction extends WelcomeMapPlaceDetails {
  category: string;
  subcategory: string;
  markerType: string;
}

interface WelcomeMapAccommodation extends WelcomeMapPlaceDetails {
  type: string;
}

interface WelcomeMapRestaurant extends WelcomeMapPlaceDetails {
  cuisine: string;
}

type WelcomeMapPlaceKind = "attraction" | "accommodation" | "restaurant";

interface SelectedMapPlace extends WelcomeMapPlaceDetails {
  kind: WelcomeMapPlaceKind;
  subtitle: string;
}

const WELCOME_KIND_META: Record<
  WelcomeMapPlaceKind,
  {
    label: string;
    color: string;
    Icon: React.ElementType;
    to: string;
    cta: string;
  }
> = {
  attraction: {
    label: "Attraction",
    color: "#16845B",
    Icon: Mountain,
    to: "/attractions",
    cta: "Browse attractions",
  },
  accommodation: {
    label: "Accommodation",
    color: "#2563EB",
    Icon: Hotel,
    to: "/accommodations",
    cta: "Browse stays",
  },
  restaurant: {
    label: "Restaurant",
    color: "#C2410C",
    Icon: UtensilsCrossed,
    to: "/restaurants",
    cta: "Browse restaurants",
  },
};

const normalizeMapLabel = (value: unknown): string =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

const getWelcomeCoordinates = (item: any): WelcomeMapCoordinates | null => {
  const latitudeValue =
    item?.location_lat ??
    item?.locationLat ??
    item?.latitude ??
    item?.location?.lat ??
    item?.lat;

  const longitudeValue =
    item?.location_lng ??
    item?.locationLng ??
    item?.longitude ??
    item?.location?.lng ??
    item?.lon;

  const lat = Number(latitudeValue);
  const lng = Number(longitudeValue);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180 ||
    (lat === 0 && lng === 0)
  ) {
    return null;
  }

  return { lat, lng };
};

const getWelcomeFirstValue = (item: any, keys: string[]): string => {
  for (const key of keys) {
    const value = item?.[key];

    if (value !== null && value !== undefined && String(value).trim()) {
      return String(value).trim();
    }
  }

  return "";
};

const getWelcomeAttractionSubcategory = (item: any): string => {
  const type = getWelcomeFirstValue(item, [
    "attraction_type",
    "attractionType",
    "subcategory",
    "sub_category",
    "type",
  ]);

  if (normalizeMapLabel(type) === "other") {
    return (
      getWelcomeFirstValue(item, [
        "other_attraction_type",
        "otherAttractionType",
      ]) || "Other"
    );
  }

  return type;
};

const WELCOME_CATEGORY_MARKER_DESIGNS: Record<
  string,
  { color: string; icon: string }
> = {
  Nature: { color: "#16845B", icon: "🌿" },
  "History and Culture": { color: "#A66A3F", icon: "🏛️" },
  "Industrial Tourism": { color: "#526477", icon: "🏭" },
  Shopping: { color: "#D9468F", icon: "🛍️" },
  Other: { color: CALBAYOG_BLUE, icon: "📍" },
};

const WELCOME_SUBCATEGORY_MARKER_ICONS: Record<string, string> = {
  waterfalls: "💧",
  beaches: "🏖️",
  caves: "🪨",
  "hot springs": "♨️",
  rivers: "🌊",
  "dive sites": "🤿",
  churches: "⛪",
  museums: "🏛️",
  "historic buildings": "🏛️",
  monuments: "🗿",
  parks: "🌳",
  factories: "🏭",
  farms: "🌾",
  "production sites": "⚙️",
  markets: "🛒",
  malls: "🛍️",
  "local craft centers": "🧺",
  other: "📍",
};

const WELCOME_MARKER_KEYWORD_ICONS: Array<[string, string]> = [
  ["waterfall", "💧"],
  ["falls", "💧"],
  ["beach", "🏖️"],
  ["cave", "🪨"],
  ["spring", "♨️"],
  ["river", "🌊"],
  ["dive", "🤿"],
  ["diving", "🤿"],
  ["church", "⛪"],
  ["museum", "🏛️"],
  ["historic", "🏛️"],
  ["monument", "🗿"],
  ["park", "🌳"],
  ["factor", "🏭"],
  ["farm", "🌾"],
  ["production", "⚙️"],
  ["market", "🛒"],
  ["mall", "🛍️"],
  ["craft", "🧺"],
];

const getWelcomeCategoryDesign = (category: string) => {
  const exact = WELCOME_CATEGORY_MARKER_DESIGNS[category];

  if (exact) return exact;

  const target = normalizeMapLabel(category);
  const key = Object.keys(WELCOME_CATEGORY_MARKER_DESIGNS).find(
    (item) => normalizeMapLabel(item) === target,
  );

  return key
    ? WELCOME_CATEGORY_MARKER_DESIGNS[key]
    : WELCOME_CATEGORY_MARKER_DESIGNS.Other;
};

const getWelcomeMarkerGlyph = (markerType: string, fallback: string): string => {
  const key = normalizeMapLabel(markerType);

  if (WELCOME_SUBCATEGORY_MARKER_ICONS[key]) {
    return WELCOME_SUBCATEGORY_MARKER_ICONS[key];
  }

  const match = WELCOME_MARKER_KEYWORD_ICONS.find(([keyword]) =>
    key.includes(keyword),
  );

  return match ? match[1] : fallback;
};

const createWelcomeAttractionMarkerIcon = (
  category: string,
  markerType: string,
) => {
  const design = getWelcomeCategoryDesign(category);
  const glyph = getWelcomeMarkerGlyph(markerType, design.icon);

  return L.divIcon({
    className: "welcome-map-attraction-marker",
    html: `
      <div class="welcome-map-marker-shell">
        <div class="welcome-map-marker-pin" style="background:${design.color}"></div>
        <div class="welcome-map-marker-icon">${glyph}</div>
      </div>
    `,
    iconSize: [44, 52],
    iconAnchor: [22, 49],
    popupAnchor: [0, -47],
    tooltipAnchor: [0, -43],
  });
};

const createWelcomeAccommodationMarkerIcon = () =>
  L.divIcon({
    className: "welcome-map-accommodation-marker",
    html: `
      <div class="welcome-map-accommodation-pin">
        <div class="welcome-map-accommodation-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 21h18"/>
            <path d="M5 21V7l7-4 7 4v14"/>
            <path d="M9 21v-4h6v4"/>
            <path d="M8 9h.01M12 9h.01M16 9h.01M8 12h.01M12 12h.01M16 12h.01"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [44, 52],
    iconAnchor: [22, 49],
    popupAnchor: [0, -47],
    tooltipAnchor: [0, -43],
  });

const createWelcomeRestaurantMarkerIcon = () =>
  L.divIcon({
    className: "welcome-map-restaurant-marker",
    html: `
      <div class="welcome-map-restaurant-pin">
        <div class="welcome-map-accommodation-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C2410C" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
            <path d="M7 2v20"/>
            <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [44, 52],
    iconAnchor: [22, 49],
    popupAnchor: [0, -47],
    tooltipAnchor: [0, -43],
  });

const WelcomeMapScaleControl: React.FC = () => {
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

const WelcomeMapLocateControl: React.FC = () => {
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

        map.flyTo(next, Math.max(map.getZoom(), 15), { duration: 0.8 });
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
    <div className="leaflet-control leaflet-bar welcome-map-locate-control">
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

const WelcomeMapFitPlaces: React.FC<{
  attractions: WelcomeMapAttraction[];
  accommodations: WelcomeMapAccommodation[];
  restaurants: WelcomeMapRestaurant[];
}> = ({ attractions, accommodations, restaurants }) => {
  const map = useMap();

  useEffect(() => {
    const points = [
      ...attractions.map(
        (place) => [place.coordinates.lat, place.coordinates.lng] as [number, number],
      ),
      ...accommodations.map(
        (place) => [place.coordinates.lat, place.coordinates.lng] as [number, number],
      ),
      ...restaurants.map(
        (place) => [place.coordinates.lat, place.coordinates.lng] as [number, number],
      ),
    ];

    if (points.length === 0) {
      map.setView(DEFAULT_CALBAYOG_CENTER, 12, { animate: false });
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 14, { animate: false });
      return;
    }

    map.fitBounds(L.latLngBounds(points), {
      padding: [35, 35],
      maxZoom: 14,
      animate: false,
    });
  }, [map, attractions, accommodations, restaurants]);

  return null;
};

const WelcomeMapFocus: React.FC<{ place: SelectedMapPlace | null }> = ({
  place,
}) => {
  const map = useMap();

  useEffect(() => {
    if (!place) return;

    const zoom = Math.max(map.getZoom(), 14);
    const size = map.getSize();
    const target = L.latLng(place.coordinates.lat, place.coordinates.lng);

    let point = map.project(target, zoom);

    if (window.innerWidth < 768) {
      point = point.add([0, size.y * 0.2]);
    } else {
      point = point.subtract([170, 0]);
    }

    map.flyTo(map.unproject(point, zoom), zoom, { duration: 0.6 });
  }, [map, place]);

  return null;
};

const WelcomeMapClickAway: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  useMapEvents({
    click: onClose,
  });

  return null;
};

const WelcomeMapPlaceImages: React.FC<{
  images: string[];
  name: string;
  kind: WelcomeMapPlaceKind;
}> = ({ images, name, kind }) => {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const trackRef = useRef<HTMLDivElement | null>(null);

  const meta = WELCOME_KIND_META[kind];
  const Icon = meta.Icon;
  const visible = images.filter(Boolean);

  const handleScroll = () => {
    const track = trackRef.current;

    if (!track || !track.clientWidth) return;

    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  if (visible.length === 0) {
    return (
      <div className="welcome-map-card-media">
        <div className="welcome-map-card-placeholder">
          <Icon size={38} strokeWidth={1.6} aria-hidden="true" />
        </div>
      </div>
    );
  }

  return (
    <div className="welcome-map-card-media">
      <div className="welcome-map-card-track" ref={trackRef} onScroll={handleScroll}>
        {visible.map((src, imageIndex) => (
          <div className="welcome-map-card-slide" key={`${src}-${imageIndex}`}>
            {failed[imageIndex] ? (
              <div className="welcome-map-card-placeholder">
                <Icon size={38} strokeWidth={1.6} aria-hidden="true" />
              </div>
            ) : (
              <img
                src={src}
                alt={`${name} photo ${imageIndex + 1}`}
                draggable={false}
                onError={() =>
                  setFailed((previous) => ({ ...previous, [imageIndex]: true }))
                }
              />
            )}
          </div>
        ))}
      </div>

      {visible.length > 1 && (
        <span className="welcome-map-card-counter">
          {Math.min(index + 1, visible.length)} / {visible.length}
        </span>
      )}
    </div>
  );
};

const toWebsiteHref = (website: string): string =>
  /^https?:\/\//i.test(website) ? website : `https://${website}`;

const WelcomeMap: React.FC<{
  attractions: WelcomeMapAttraction[];
  accommodations: WelcomeMapAccommodation[];
  restaurants: WelcomeMapRestaurant[];
}> = ({ attractions, accommodations, restaurants }) => {
  const [selected, setSelected] = useState<SelectedMapPlace | null>(null);

  const attractionIcons = useMemo(
    () =>
      new Map(
        attractions.map((place) => [
          place.id,
          createWelcomeAttractionMarkerIcon(place.category, place.markerType),
        ]),
      ),
    [attractions],
  );

  const accommodationIcon = useMemo(
    () => createWelcomeAccommodationMarkerIcon(),
    [],
  );

  const restaurantIcon = useMemo(() => createWelcomeRestaurantMarkerIcon(), []);

  const closeCard = useCallback(() => setSelected(null), []);

  useEffect(() => {
    if (!selected) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  const selectedMeta = selected ? WELCOME_KIND_META[selected.kind] : null;
  const SelectedIcon = selectedMeta?.Icon;

  return (
    <div className={`welcome-map-shell ${selected ? "has-card" : ""}`}>
      <MapContainer
        center={DEFAULT_CALBAYOG_CENTER}
        zoom={12}
        scrollWheelZoom
        dragging
        touchZoom
        doubleClickZoom
        boxZoom
        keyboard
        zoomControl
        className="welcome-map"
      >
        <WelcomeMapFitPlaces
          attractions={attractions}
          accommodations={accommodations}
          restaurants={restaurants}
        />

        <WelcomeMapFocus place={selected} />
        <WelcomeMapClickAway onClose={closeCard} />

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

        <WelcomeMapLocateControl />
        <WelcomeMapScaleControl />

        {attractions.map((place) => (
          <Marker
            key={`welcome-attraction-${place.id}`}
            position={[place.coordinates.lat, place.coordinates.lng]}
            icon={attractionIcons.get(place.id)}
            zIndexOffset={100}
            eventHandlers={{
              click: () =>
                setSelected({
                  ...place,
                  kind: "attraction",
                  subtitle: place.subcategory || place.category,
                }),
            }}
          >
            <Tooltip
              permanent
              direction="top"
              offset={[0, -4]}
              opacity={1}
              className="welcome-map-label"
            >
              <span className="welcome-map-label-name">{place.name}</span>
              {place.subcategory && (
                <span className="welcome-map-label-sub">{place.subcategory}</span>
              )}
            </Tooltip>
          </Marker>
        ))}

        {accommodations.map((place) => (
          <Marker
            key={`welcome-accommodation-${place.id}`}
            position={[place.coordinates.lat, place.coordinates.lng]}
            icon={accommodationIcon}
            zIndexOffset={80}
            eventHandlers={{
              click: () =>
                setSelected({
                  ...place,
                  kind: "accommodation",
                  subtitle: place.type || "Hotels & Resorts",
                }),
            }}
          >
            <Tooltip
              permanent
              direction="top"
              offset={[0, -4]}
              opacity={1}
              className="welcome-map-label accommodation"
            >
              <span className="welcome-map-label-name">{place.name}</span>
              {place.type && (
                <span className="welcome-map-label-sub">{place.type}</span>
              )}
            </Tooltip>
          </Marker>
        ))}

        {restaurants.map((place) => (
          <Marker
            key={`welcome-restaurant-${place.id}`}
            position={[place.coordinates.lat, place.coordinates.lng]}
            icon={restaurantIcon}
            zIndexOffset={90}
            eventHandlers={{
              click: () =>
                setSelected({
                  ...place,
                  kind: "restaurant",
                  subtitle: place.cuisine || "Restaurant",
                }),
            }}
          >
            <Tooltip
              permanent
              direction="top"
              offset={[0, -4]}
              opacity={1}
              className="welcome-map-label restaurant"
            >
              <span className="welcome-map-label-name">{place.name}</span>
              {place.cuisine && (
                <span className="welcome-map-label-sub">{place.cuisine}</span>
              )}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

      {selected && selectedMeta && SelectedIcon && (
        <aside
          className="welcome-map-place-card"
          role="dialog"
          aria-label={`${selected.name} details`}
          style={{ "--kind-color": selectedMeta.color } as React.CSSProperties}
        >
          <button
            type="button"
            className="welcome-map-place-close"
            onClick={closeCard}
            aria-label="Close details"
          >
            <X size={16} strokeWidth={2.2} />
          </button>

          <WelcomeMapPlaceImages
            key={`${selected.kind}-${selected.id}`}
            images={selected.images}
            name={selected.name}
            kind={selected.kind}
          />

          <div className="welcome-map-place-body">
            <div className="welcome-map-place-badges">
              <span
                className="welcome-map-place-badge"
                style={{
                  color: selectedMeta.color,
                  background: `${selectedMeta.color}14`,
                }}
              >
                <SelectedIcon size={11} strokeWidth={2.2} aria-hidden="true" />
                {selectedMeta.label}
              </span>

              {selected.subtitle && (
                <span className="welcome-map-place-chip">{selected.subtitle}</span>
              )}
            </div>

            <h3 className="welcome-map-place-title">{selected.name}</h3>

            {selected.description && (
              <p className="welcome-map-place-desc">{selected.description}</p>
            )}

            <ul className="welcome-map-place-info">
              <li>
                <MapPin size={15} strokeWidth={2} aria-hidden="true" />
                <span>{selected.address || "Address not available"}</span>
              </li>

              {selected.hours && (
                <li>
                  <Clock3 size={15} strokeWidth={2} aria-hidden="true" />
                  <span>{selected.hours}</span>
                </li>
              )}

              {selected.phone && (
                <li>
                  <Phone size={15} strokeWidth={2} aria-hidden="true" />
                  <a href={`tel:${selected.phone.replace(/\s+/g, "")}`}>
                    {selected.phone}
                  </a>
                </li>
              )}

              {selected.price && (
                <li>
                  <Tag size={15} strokeWidth={2} aria-hidden="true" />
                  <span>{selected.price}</span>
                </li>
              )}

              {selected.website && (
                <li>
                  <Globe2 size={15} strokeWidth={2} aria-hidden="true" />
                  <a
                    href={toWebsiteHref(selected.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {selected.website}
                  </a>
                </li>
              )}
            </ul>

            <Link to={selectedMeta.to} className="welcome-map-place-cta">
              {selectedMeta.cta}
              <ChevronRight size={15} strokeWidth={2.2} aria-hidden="true" />
            </Link>
          </div>
        </aside>
      )}

      <div className="welcome-map-legend" aria-label="Map legend">
        <span>
          <span className="welcome-map-legend-dot attraction" />
          Attractions
        </span>
        <span>
          <span className="welcome-map-legend-dot accommodation" />
          Accommodations
        </span>
        <span>
          <span className="welcome-map-legend-dot restaurant" />
          Restaurants
        </span>
      </div>
    </div>
  );
};

/* =========================================================
    HELPERS FOR RESTAURANTS + EVENTS
========================================================= */

const WELCOME_CAROUSEL_LIMIT = 8;

const toImageList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter(
      (image): image is string =>
        typeof image === "string" && image.trim().length > 0,
    );
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((image) => image.trim())
      .filter(Boolean);
  }

  return [];
};

const toRestaurantCardItem = (item: any): RestaurantCardItem => ({
  ...item,
  id: String(item?.id ?? "").trim(),
  name: item?.name ?? "",
  images: toImageList(item?.images),
});

const toEventCardItem = (item: any): EventCardItem => ({
  ...item,
  id: String(item?.id ?? item?._id ?? "").trim(),
  title: item?.title ?? item?.name ?? "",
  image:
    item?.image ||
    item?.image_url ||
    toImageList(item?.images)[0] ||
    "",
  favorites: item?.favorites ?? item?.favorite_count,
});

const getWelcomePlaceDetails = (item: any) => ({
  images: toImageList(item?.images),
  description: getWelcomeFirstValue(item, ["short_description", "description"]),
  phone: getWelcomeFirstValue(item, [
    "mobile",
    "contact_phone",
    "contact_number",
    "phone",
  ]),
  hours: getWelcomeFirstValue(item, ["operational_hours", "opening_hours"]),
  price: getWelcomeFirstValue(item, ["entrance_fee", "price_range"]),
  website: getWelcomeFirstValue(item, ["website", "contact_website"]),
});

/* =========================================================
    WELCOME COMPONENT
========================================================= */

const Welcome: React.FC = () => {
  const history = useHistory();
  const { user, isUserAuthenticated } = useAuth();

  const isAdminLogout =
    new URLSearchParams(window.location.search).get("adminLogout") === "1";

  const displayUser = isAdminLogout ? null : user;

  // Plan Trip and My Memories are protected user features.
  const handleProtectedQuickCardClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    to: string
  ) => {
    if (!isUserAuthenticated) {
      event.preventDefault();
      history.push(`/login?redirect=${encodeURIComponent(to)}`);
    }
  };

  // Data States
  const [attractions, setAttractions] = useState<Destination[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantCardItem[]>([]);
  const [events, setEvents] = useState<EventCardItem[]>([]);
  const [featuredVideos, setFeaturedVideos] = useState<FeaturedVideo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Weather State
  const [weather, setWeather] = useState<WeatherState>({
    temperature: null,
    weatherCode: null,
    isDay: true,
    loading: true,
    error: false,
  });

  // Fetch Weather from Open-Meteo API
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=12.0667&longitude=124.6&current_weather=true"
        );
        const data = await res.json();
        if (data.current_weather) {
          setWeather({
            temperature: Math.round(data.current_weather.temperature),
            weatherCode: data.current_weather.weathercode,
            isDay: Boolean(data.current_weather.is_day),
            loading: false,
            error: false,
          });
        }
      } catch (err) {
        setWeather((prev) => ({ ...prev, loading: false, error: true }));
      }
    };

    fetchWeather();
  }, []);

  // Fetch Page Content
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const [
          attractionsRes,
          accommodationsRes,
          restaurantsRes,
          eventsRes,
          videosRes,
        ] = await Promise.all([
          getAttractions(),
          getAccommodations(),
          getRestaurants(),
          getEvents(),
          getFeaturedVideos(),
        ]);

        if (mounted) {
          const rawAttr = Array.isArray(attractionsRes)
            ? attractionsRes
            : (attractionsRes as any)?.data || [];
          const rawAccom = Array.isArray(accommodationsRes)
            ? accommodationsRes
            : (accommodationsRes as any)?.data || [];
          const rawRests = Array.isArray(restaurantsRes)
            ? restaurantsRes
            : (restaurantsRes as any)?.data || [];
          const rawEvents = Array.isArray(eventsRes)
            ? eventsRes
            : (eventsRes as any)?.data || [];
          const rawVideos = Array.isArray(videosRes)
            ? videosRes
            : (videosRes as any)?.data || [];

          setAttractions(rawAttr);
          setAccommodations(rawAccom);
          setRestaurants(rawRests.map(toRestaurantCardItem));
          setEvents(rawEvents.map(toEventCardItem));
          setFeaturedVideos(rawVideos);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  // Process map data with valid coordinates
  const mapAttractions = useMemo<WelcomeMapAttraction[]>(() => {
    return attractions
      .map((item: any) => {
        const coords = getWelcomeCoordinates(item);
        if (!coords) return null;
        return {
          id: String(item.id || item._id),
          name: item.title || item.name || "Attraction",
          address: item.address || item.location_name || "",
          coordinates: coords,
          category: item.category || "Nature",
          subcategory: getWelcomeAttractionSubcategory(item),
          markerType: item.attraction_type || item.category || "Nature",
          ...getWelcomePlaceDetails(item),
        };
      })
      .filter((item): item is WelcomeMapAttraction => item !== null);
  }, [attractions]);

  const mapAccommodations = useMemo<WelcomeMapAccommodation[]>(() => {
    return accommodations
      .map((item: any) => {
        const coords = getWelcomeCoordinates(item);
        if (!coords) return null;
        return {
          id: String(item.id || item._id),
          name: item.title || item.name || "Stay",
          address: item.address || "",
          coordinates: coords,
          type: item.type || item.accommodation_type || "Hotel",
          ...getWelcomePlaceDetails(item),
        };
      })
      .filter((item): item is WelcomeMapAccommodation => item !== null);
  }, [accommodations]);

  const mapRestaurants = useMemo<WelcomeMapRestaurant[]>(() => {
    return restaurants
      .map((item: any) => {
        const coords = getWelcomeCoordinates(item);
        if (!coords) return null;
        return {
          id: String(item.id || item._id),
          name: item.name || "Restaurant",
          address: item.address || "",
          coordinates: coords,
          cuisine: item.cuisine || item.cuisine_type || "Local Dining",
          ...getWelcomePlaceDetails(item),
        };
      })
      .filter((item): item is WelcomeMapRestaurant => item !== null);
  }, [restaurants]);

  return (
    <div className="welcome-page-container">
      {/* Hero Carousel Section */}
      <section className="welcome-hero-section position-relative">
        <Swiper
          modules={[Navigation, Pagination, A11y]}
          spaceBetween={0}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          loop
          className="welcome-hero-swiper"
        >
          {heroSlides.map((slide) => (
            <SwiperSlide key={slide.id}>
              <div
                className="welcome-hero-slide"
                style={{ backgroundImage: `url(${slide.image})` }}
              >
                <div className="welcome-hero-overlay" />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="welcome-hero-content-overlay">
          <Container>
            <div className="text-white text-center text-md-start">
              <span className="welcome-badge mb-2 d-inline-flex align-items-center gap-2">
                <CloudSun size={18} />
                {!weather.loading && !weather.error && weather.temperature !== null
                  ? `${weather.temperature}°C • ${getWeatherDescription(weather.weatherCode)}`
                  : "Calbayog City, Samar"}
              </span>
              <h1 className="display-4 barabara-display fw-bold mb-3">
                {displayUser
                  ? `Maupay nga Pag-abot, ${(displayUser as any).first_name || displayUser.name || "Friend"}!`
                  : "Explore the City of Waterfalls"}
              </h1>
              <p className="lead max-w-2xl">
                Discover nature, culture, rich flavors, and unforgettable experiences in Calbayog City.
              </p>
            </div>
          </Container>
        </div>
      </section>

      {/* Quick Navigation Cards */}
      <section className="welcome-quick-cards-section py-5 bg-light">
        <Container>
          <Row className="g-3 justify-content-center">
            {quickCards.map((card) => {
              const isProtected = card.to === "/itinerary" || card.to === "/memories";
              const CardIcon = card.icon;

              return (
                <Col key={card.label} xs={6} sm={4} md={3} lg={12 / 7}>
                  <Link
                    to={card.to}
                    onClick={(e) =>
                      isProtected ? handleProtectedQuickCardClick(e, card.to) : undefined
                    }
                    className="quick-card-item d-flex flex-column align-items-center text-center p-3 rounded-3 text-decoration-none"
                    style={
                      {
                        "--card-from": card.from,
                        "--card-to": card.toColor,
                        "--card-glow": card.glow,
                      } as React.CSSProperties
                    }
                  >
                    <div className="quick-card-icon-wrapper mb-2">
                      <CardIcon size={24} className="text-white" />
                    </div>
                    <span className="fw-bold text-dark quick-card-label">{card.label}</span>
                    <small className="text-muted quick-card-hint">{card.hint}</small>
                  </Link>
                </Col>
              );
            })}
          </Row>
        </Container>
      </section>

      {/* Interactive Map Section */}
      <section className="welcome-map-section py-5">
        <Container>
          <SectionHeading
            headingClass="text-center mb-4"
            titleClass="text-primary"
            eyebrowClass="justify-content-center"
            title="Explore Destination Map"
            subtitle="Find attractions, hotels, and dining around Calbayog"
          />
          <WelcomeMap
            attractions={mapAttractions}
            accommodations={mapAccommodations}
            restaurants={mapRestaurants}
          />
        </Container>
      </section>

      {/* Featured Attractions Carousel */}
      {attractions.length > 0 && (
        <section className="welcome-attractions-section py-5 bg-light">
          <Container>
            <SectionHeading
              headingClass="text-center mb-4"
              titleClass="text-primary"
              eyebrowClass="justify-content-center"
              title="Top Attractions"
              subtitle="Must-visit destinations in the City of Waterfalls"
            />
            <Row className="g-4">
              {attractions.slice(0, 6).map((attraction) => (
                <Col key={attraction.id} xs={12} sm={6} md={4}>
                  <AttractionCard attraction={attraction} />
                </Col>
              ))}
            </Row>
            <div className="text-center mt-4">
              <Link to="/attractions" className="btn btn-outline-primary rounded-pill px-4">
                View All Attractions <ChevronRight size={16} />
              </Link>
            </div>
          </Container>
        </section>
      )}

      {/* Featured Stays */}
      {accommodations.length > 0 && (
        <section className="welcome-accommodations-section py-5">
          <Container>
            <SectionHeading
              headingClass="text-center mb-4"
              titleClass="text-primary"
              eyebrowClass="justify-content-center"
              title="Where to Stay"
              subtitle="Comfortable hotels, resorts, and lodges for your stay"
            />
            <Row className="g-4">
              {accommodations.slice(0, 3).map((accommodation) => (
                <Col key={accommodation.id} xs={12} md={4}>
                  <AccommodationCard accommodation={accommodation} />
                </Col>
              ))}
            </Row>
            <div className="text-center mt-4">
              <Link to="/accommodations" className="btn btn-outline-primary rounded-pill px-4">
                Explore All Stays <ChevronRight size={16} />
              </Link>
            </div>
          </Container>
        </section>
      )}

      {/* Upcoming Events */}
      {events.length > 0 && (
        <section className="welcome-events-section py-5 bg-light">
          <Container>
            <SectionHeading
              headingClass="text-center mb-4"
              titleClass="text-primary"
              eyebrowClass="justify-content-center"
              title="Upcoming Events"
              subtitle="Festivals, celebrations, and community happenings"
            />
            <Row className="g-4">
              {events.slice(0, 3).map((event) => (
                <Col key={event.id} xs={12} md={4}>
                  <EventCard event={event} />
                </Col>
              ))}
            </Row>
          </Container>
        </section>
      )}
    </div>
  );
};

export default Welcome;
