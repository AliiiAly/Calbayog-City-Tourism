import React, { 
  useCallback,
  useEffect, 
  useMemo,
  useRef, 
  useState, 
} from "react"; 
 
import { Link } from "react-router-dom"; 
 
import { 
  Container, 
  Row, 
  Col, 
  Card, 
} from "react-bootstrap"; 
 
import { 
  getAccommodations, 
  getAttractions, 
  getFeaturedVideos, 
  FeaturedVideo, 
} from "../services/api"; 
 
import { 
  Destination, 
  Accommodation, 
} from "../types"; 
 
import { useAuth } from "../context/AuthContext"; 
 
import { useFavorites } from "../context/FavoritesContext"; 
 
import AttractionCard from "../components/attractions/AttractionCard"; 

import AccommodationCard, {
  AccommodationCardItem,
} from "../components/accommodations/AccommodationCard";
 
import { 
  Mountain,
  Hotel,
  CalendarDays,
  Compass,
  NotebookPen,
  Images,
  MapPin, 
  CloudSun, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
} from "lucide-react"; 
 
import { 
  Swiper, 
  SwiperSlide, 
} from "swiper/react"; 
 
import { 
  EffectCoverflow, 
  Navigation, 
  Pagination, 
  A11y, 
} from "swiper/modules"; 
 
import type { 
  Swiper as SwiperInstance, 
} from "swiper"; 
 
import "swiper/css"; 
import "swiper/css/effect-coverflow"; 
import "swiper/css/navigation"; 
import "swiper/css/pagination";

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  LayersControl,
  LayerGroup,
  useMap,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";
 
/* ========================================================= 
   BRAND COLOR 
========================================================= */ 
 
const CALBAYOG_BLUE = "#2D3195"; 
 
/* ========================================================= 
   QUICK ACCESS CARDS 
========================================================= */ 
 
const quickCards: Array<{ 
  icon: React.ReactNode; 
  label: string; 
  to: string; 
  color: string; 
  bg: string; 
}> = [ 
  { 
    icon: ( 
      <Mountain 
        size={23} 
        strokeWidth={2.15} 
        aria-hidden="true" 
      /> 
    ), 
    label: "Attractions", 
    to: "/attractions", 
    color: "#0077B6", 
    bg: "#e0f2ff", 
  }, 
 
  { 
    icon: ( 
      <Hotel 
        size={23} 
        strokeWidth={2.15} 
        aria-hidden="true" 
      /> 
    ), 
    label: "Stays", 
    to: "/accommodations", 
    color: "#F4A226", 
    bg: "#fff8e6", 
  }, 
 
  { 
    icon: ( 
      <CalendarDays 
        size={23} 
        strokeWidth={2.15} 
        aria-hidden="true" 
      /> 
    ), 
    label: "Events", 
    to: "/events", 
    color: "#e63946", 
    bg: "#ffe8ea", 
  }, 
 
  { 
    icon: ( 
      <Compass 
        size={22} 
        strokeWidth={2.2} 
        aria-hidden="true" 
      /> 
    ), 
    label: "Guides", 
    to: "/guides", 
    color: "#2d6a4f", 
    bg: "#e8f5ee", 
  }, 
 
  { 
    icon: ( 
      <NotebookPen 
        size={22} 
        strokeWidth={2.2} 
        aria-hidden="true" 
      /> 
    ), 
    label: "Plan Trip", 
    to: "/itinerary", 
    color: "#6d4c41", 
    bg: "#f0ebe6", 
  }, 
 
  { 
    icon: ( 
      <Images
        size={23}
        strokeWidth={2.15}
        aria-hidden="true"
      /> 
    ), 
    label: "My Memories",
    to: "/memories",
    color: "#C45A8D",
    bg: "#fcecf4", 
  }, 
]; 
 
/* ========================================================= 
   HERO SLIDES 
========================================================= */ 
 
const heroSlides = [ 
  { 
    id: "calbayog-1", 
    image: "/calbayog1.jpg", 
    alt: "Calbayog City", 
  }, 
 
  { 
    id: "calbayog-2", 
    image: "/calbayog2.jpeg", 
    alt: "Calbayog City", 
  }, 
 
  { 
    id: "calbayog-3", 
    image: "/calbayog3.jpg", 
    alt: "Calbayog City", 
  }, 
 
  { 
    id: "calbayogonair", 
    image: "/calbayogonair.webp", 
    alt: "Calbayog City", 
  }, 
]; 
 
/* ========================================================= 
   WEATHER TYPES 
========================================================= */ 
 
type WeatherState = { 
  temperature: number | null; 
  weatherCode: number | null; 
  isDay: boolean; 
  loading: boolean; 
  error: boolean; 
}; 
 
/* ========================================================= 
   WEATHER DESCRIPTION 
========================================================= */ 
 
const getWeatherDescription = ( 
  weatherCode: number | null, 
): string => { 
  if (weatherCode === null) { 
    return "Weather unavailable"; 
  } 
 
  if (weatherCode === 0) { 
    return "Clear sky"; 
  } 
 
  if ( 
    weatherCode === 1 || 
    weatherCode === 2 
  ) { 
    return "Partly cloudy"; 
  } 
 
  if (weatherCode === 3) { 
    return "Overcast"; 
  } 
 
  if ( 
    weatherCode === 45 || 
    weatherCode === 48 
  ) { 
    return "Foggy"; 
  } 
 
  if ( 
    weatherCode === 51 || 
    weatherCode === 53 || 
    weatherCode === 55 
  ) { 
    return "Drizzle"; 
  } 
 
  if ( 
    weatherCode === 56 || 
    weatherCode === 57 
  ) { 
    return "Freezing drizzle"; 
  } 
 
  if ( 
    weatherCode === 61 || 
    weatherCode === 63 || 
    weatherCode === 65 
  ) { 
    return "Rain"; 
  } 
 
  if ( 
    weatherCode === 66 || 
    weatherCode === 67 
  ) { 
    return "Freezing rain"; 
  } 
 
  if ( 
    weatherCode === 71 || 
    weatherCode === 73 || 
    weatherCode === 75 
  ) { 
    return "Snow"; 
  } 
 
  if (weatherCode === 77) { 
    return "Snow grains"; 
  } 
 
  if ( 
    weatherCode === 80 || 
    weatherCode === 81 || 
    weatherCode === 82 
  ) { 
    return "Rain showers"; 
  } 
 
  if ( 
    weatherCode === 85 || 
    weatherCode === 86 
  ) { 
    return "Snow showers"; 
  } 
 
  if (weatherCode === 95) { 
    return "Thunderstorm"; 
  } 
 
  if ( 
    weatherCode === 96 || 
    weatherCode === 99 
  ) { 
    return "Thunderstorm with hail"; 
  } 
 
  return "Current weather"; 
}; 
 
/* =========================================================
   WELCOME PAGE MAP

   The map uses the exact saved location_lat / location_lng
   coordinates from attractions and accommodations. It does not
   geocode addresses or guess locations.
========================================================= */

const DEFAULT_CALBAYOG_CENTER: [number, number] = [
  12.0667,
  124.6,
];

const SATELLITE_LABELS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";

const SATELLITE_ROADS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}";

interface WelcomeMapCoordinates {
  lat: number;
  lng: number;
}

interface WelcomeMapAttraction {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  markerType: string;
  address: string;
  coordinates: WelcomeMapCoordinates;
}

interface WelcomeMapAccommodation {
  id: string;
  name: string;
  type: string;
  address: string;
  coordinates: WelcomeMapCoordinates;
}

const normalizeMapLabel = (value: unknown): string =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

const getWelcomeCoordinates = (
  item: any,
): WelcomeMapCoordinates | null => {
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

const getWelcomeFirstValue = (
  item: any,
  keys: string[],
): string => {
  for (const key of keys) {
    const value = item?.[key];
    if (
      value !== null &&
      value !== undefined &&
      String(value).trim()
    ) {
      return String(value).trim();
    }
  }

  return "";
};

const getWelcomeAttractionSubcategory = (
  item: any,
): string => {
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
  "History and Culture": {
    color: "#A66A3F",
    icon: "🏛️",
  },
  "Industrial Tourism": {
    color: "#526477",
    icon: "🏭",
  },
  Shopping: { color: "#D9468F", icon: "🛍️" },
  Other: { color: CALBAYOG_BLUE, icon: "📍" },
};

const WELCOME_SUBCATEGORY_MARKER_ICONS: Record<
  string,
  string
> = {
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

const WELCOME_MARKER_KEYWORD_ICONS: Array<
  [string, string]
> = [
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

const getWelcomeCategoryDesign = (
  category: string,
) => {
  const exact =
    WELCOME_CATEGORY_MARKER_DESIGNS[category];

  if (exact) return exact;

  const target = normalizeMapLabel(category);
  const key = Object.keys(
    WELCOME_CATEGORY_MARKER_DESIGNS,
  ).find(
    (item) =>
      normalizeMapLabel(item) === target,
  );

  return key
    ? WELCOME_CATEGORY_MARKER_DESIGNS[key]
    : WELCOME_CATEGORY_MARKER_DESIGNS.Other;
};

const getWelcomeMarkerGlyph = (
  markerType: string,
  fallback: string,
): string => {
  const key = normalizeMapLabel(markerType);

  if (
    WELCOME_SUBCATEGORY_MARKER_ICONS[key]
  ) {
    return WELCOME_SUBCATEGORY_MARKER_ICONS[key];
  }

  const match =
    WELCOME_MARKER_KEYWORD_ICONS.find(
      ([keyword]) => key.includes(keyword),
    );

  return match ? match[1] : fallback;
};

const createWelcomeAttractionMarkerIcon = (
  category: string,
  markerType: string,
) => {
  const design =
    getWelcomeCategoryDesign(category);
  const glyph = getWelcomeMarkerGlyph(
    markerType,
    design.icon,
  );

  return L.divIcon({
    className:
      "welcome-map-attraction-marker",
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
    className:
      "welcome-map-accommodation-marker",
    html: `
      <div class="welcome-map-accommodation-pin">
        <div class="welcome-map-accommodation-icon">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2563EB"
            stroke-width="2.1"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
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
  const [locating, setLocating] =
    useState(false);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      window.alert(
        "Location services are not available in this browser.",
      );
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];

        map.flyTo(
          next,
          Math.max(map.getZoom(), 15),
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
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
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
}> = ({ attractions, accommodations }) => {
  const map = useMap();

  useEffect(() => {
    const points = [
      ...attractions.map((place) => [
        place.coordinates.lat,
        place.coordinates.lng,
      ] as [number, number]),
      ...accommodations.map((place) => [
        place.coordinates.lat,
        place.coordinates.lng,
      ] as [number, number]),
    ];

    if (points.length === 0) {
      map.setView(
        DEFAULT_CALBAYOG_CENTER,
        12,
        { animate: false },
      );
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 14, {
        animate: false,
      });
      return;
    }

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, {
      padding: [35, 35],
      maxZoom: 14,
      animate: false,
    });
  }, [map, attractions, accommodations]);

  return null;
};

const WelcomeMap: React.FC<{
  attractions: WelcomeMapAttraction[];
  accommodations: WelcomeMapAccommodation[];
}> = ({ attractions, accommodations }) => {
  const attractionIcons = useMemo(
    () =>
      new Map(
        attractions.map((place) => [
          place.id,
          createWelcomeAttractionMarkerIcon(
            place.category,
            place.markerType,
          ),
        ]),
      ),
    [attractions],
  );

  const accommodationIcon = useMemo(
    () => createWelcomeAccommodationMarkerIcon(),
    [],
  );

  return (
    <div className="welcome-map-shell">
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
        />

        <LayersControl position="topright">
          <LayersControl.BaseLayer
            checked
            name="Street"
          >
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
            position={[
              place.coordinates.lat,
              place.coordinates.lng,
            ]}
            icon={attractionIcons.get(place.id)}
            zIndexOffset={100}
          >
            <Tooltip
              permanent
              direction="top"
              offset={[0, -4]}
              opacity={1}
              className="welcome-map-label"
            >
              <span className="welcome-map-label-name">
                {place.name}
              </span>
              {place.subcategory && (
                <span className="welcome-map-label-sub">
                  {place.subcategory}
                </span>
              )}
            </Tooltip>

            <Popup>
              <div className="welcome-map-popup">
                <div className="welcome-map-popup-badge">
                  <MapPin size={10} />
                  Attraction
                </div>
                <h3 className="welcome-map-popup-title">
                  {place.name}
                </h3>
                {(place.category ||
                  place.subcategory) && (
                  <p className="welcome-map-popup-category">
                    {[
                      place.category,
                      place.subcategory,
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                )}
                {place.address && (
                  <p className="welcome-map-popup-address">
                    {place.address}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {accommodations.map((place) => (
          <Marker
            key={`welcome-accommodation-${place.id}`}
            position={[
              place.coordinates.lat,
              place.coordinates.lng,
            ]}
            icon={accommodationIcon}
            zIndexOffset={80}
          >
            <Tooltip
              permanent
              direction="top"
              offset={[0, -4]}
              opacity={1}
              className="welcome-map-label accommodation"
            >
              <span className="welcome-map-label-name">
                {place.name}
              </span>
              {place.type && (
                <span className="welcome-map-label-sub">
                  {place.type}
                </span>
              )}
            </Tooltip>

            <Popup>
              <div className="welcome-map-popup">
                <div className="welcome-map-popup-badge accommodation">
                  <Hotel size={10} />
                  Accommodation
                </div>
                <h3 className="welcome-map-popup-title">
                  {place.name}
                </h3>
                {place.type && (
                  <p className="welcome-map-popup-category">
                    {place.type}
                  </p>
                )}
                {place.address && (
                  <p className="welcome-map-popup-address">
                    {place.address}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="welcome-map-legend" aria-label="Map legend">
        <span>
          <span className="welcome-map-legend-dot attraction" />
          Attractions
        </span>
        <span>
          <span className="welcome-map-legend-dot accommodation" />
          Accommodations
        </span>
      </div>
    </div>
  );
};

/* ========================================================= 
   WELCOME COMPONENT 
========================================================= */ 
 
const Welcome: React.FC = () => { 
  const { user, isUserAuthenticated } = useAuth();

  // Plan Trip and My Memories are protected user features.
  // If a visitor is not logged in, open the app-wide login form
  // instead of navigating to the protected route.
  const handleProtectedQuickCardClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    destination: string,
  ) => {
    const requiresLogin =
      destination === "/itinerary" ||
      destination === "/memories";

    if (!requiresLogin || user) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    window.dispatchEvent(new Event("open-login-modal"));
  };
 
  const { 
    setFavoriteCount, 
  } = useFavorites(); 
 
  /* ========================================================= 
     WELCOME DATA 
  ========================================================= */ 
 
  const [ 
    welcomeDestinations, 
    setWelcomeDestinations, 
  ] = useState<Destination[]>([]); 
 
  const [ 
    welcomeAccommodations, 
    setWelcomeAccommodations, 
  ] = useState<Accommodation[]>([]); 
 
  const [ 
    loadingDestinations, 
    setLoadingDestinations, 
  ] = useState(true); 
 
  const [ 
    loadingAccommodations, 
    setLoadingAccommodations, 
  ] = useState(true); 

  const [
    mapAttractions,
    setMapAttractions,
  ] = useState<WelcomeMapAttraction[]>([]);

  const [
    mapAccommodations,
    setMapAccommodations,
  ] = useState<WelcomeMapAccommodation[]>([]);

  const [
    loadingMap,
    setLoadingMap,
  ] = useState(true);
 
  /* ========================================================= 
     IMAGE ROTATION 
  ========================================================= */ 
 
  const [ 
    imageIndexes, 
    setImageIndexes, 
  ] = useState<Record<string, number>>({}); 
 
  /* ========================================================= 
     HERO SLIDER STATE 
  ========================================================= */ 
 
  const [ 
    activeSlide, 
    setActiveSlide, 
  ] = useState(0); 
 
  /* ========================================================= 
     HERO TOUCH / SWIPE 
  ========================================================= */ 
 
  const touchStartX = 
    useRef<number | null>(null); 
 
  const touchEndX = 
    useRef<number | null>(null); 
 
  /* ========================================================= 
     HERO MOUSE DRAG 
  ========================================================= */ 
 
  const mouseStartX = 
    useRef<number | null>(null); 
 
  const isDragging = 
    useRef(false); 
 
  /* ========================================================= 
     FEATURED VIDEO CAROUSEL 
  ========================================================= */ 
 
  const [ 
    featuredVideos, 
    setFeaturedVideos, 
  ] = useState<FeaturedVideo[]>([]); 
 
  const [ 
    loadingFeaturedVideos, 
    setLoadingFeaturedVideos, 
  ] = useState(true); 
 
  const [ 
    featuredVideosError, 
    setFeaturedVideosError, 
  ] = useState(false); 
 
  const [ 
    activeVideo, 
    setActiveVideo, 
  ] = useState(0); 
 
  const [ 
    videoSwiper, 
    setVideoSwiper, 
  ] = useState<SwiperInstance | null>(null);

  const videoRefs =
    useRef<Record<string, HTMLVideoElement | null>>({}); 
 
  /* ========================================================= 
     DATE 
  ========================================================= */ 
 
  const [ 
    currentDate, 
    setCurrentDate, 
  ] = useState(""); 
 
  /* ========================================================= 
     WEATHER 
  ========================================================= */ 
 
  const [ 
    weather, 
    setWeather, 
  ] = useState<WeatherState>({ 
    temperature: null, 
    weatherCode: null, 
    isDay: true, 
    loading: true, 
    error: false, 
  }); 
 
  /* ========================================================= 
     USER GREETING 
  ========================================================= */ 
 
  const firstName = user?.name 
    ? user.name 
        .trim() 
        .split(/\s+/)[0] 
    : ""; 
 
  const welcomeGreeting = 
    firstName 
      ? `MABUHAY, ${firstName.toUpperCase()}!` 
      : "MABUHAY!"; 
 
  /* ========================================================= 
     LOAD CURRENT DATE 
  ========================================================= */ 
 
  useEffect(() => { 
    const updateDate = () => { 
      const now = new Date(); 
 
      const formattedDate = 
        new Intl.DateTimeFormat( 
          "en-PH", 
          { 
            month: "long", 
            day: "numeric", 
            year: "numeric", 
            timeZone: 
              "Asia/Manila", 
          }, 
        ).format(now); 
 
      setCurrentDate( 
        formattedDate, 
      ); 
    }; 
 
    updateDate(); 
 
    const interval = 
      window.setInterval( 
        updateDate, 
        60 * 1000, 
      ); 
 
    return () => { 
      window.clearInterval( 
        interval, 
      ); 
    }; 
  }, []); 
 
  /* ========================================================= 
     LOAD CURRENT CALBAYOG WEATHER 
  ========================================================= */ 
 
  useEffect(() => { 
    const controller = 
      new AbortController(); 
 
    const loadWeather = 
      async () => { 
        try { 
          setWeather( 
            (previous) => ({ 
              ...previous, 
              loading: true, 
              error: false, 
            }), 
          ); 
 
          const geocodingResponse = 
            await fetch( 
              "https://geocoding-api.open-meteo.com/v1/search?name=Calbayog&count=10&language=en&format=json",
              {
                signal:
                  controller.signal,
              },
            );

          if (
            !geocodingResponse.ok
          ) {
            throw new Error(
              "Unable to find Calbayog location.",
            );
          }

          const geocodingData =
            await geocodingResponse.json();

          const results =
            Array.isArray(
              geocodingData?.results,
            )
              ? geocodingData.results
              : [];

          const calbayogLocation =
            results.find(
              (location: any) =>
                location?.country_code ===
                  "PH" &&
                String(
                  location?.name ||
                    "",
                ).toLowerCase() ===
                  "calbayog",
            ) ||
            results.find(
              (location: any) =>
                location?.country_code ===
                "PH",
            );

          if (
            !calbayogLocation?.latitude ||
            !calbayogLocation?.longitude
          ) {
            throw new Error(
              "Calbayog location was not found.",
            );
          }

          const weatherResponse =
            await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(
                calbayogLocation.latitude,
              )}&longitude=${encodeURIComponent(
                calbayogLocation.longitude,
              )}&current=temperature_2m,weather_code,is_day&timezone=Asia%2FManila`,
              {
                signal:
                  controller.signal,
              },
            );

          if (
            !weatherResponse.ok
          ) {
            throw new Error(
              "Unable to load current weather.",
            );
          }

          const weatherData =
            await weatherResponse.json();

          const current =
            weatherData?.current;

          if (!current) {
            throw new Error(
              "Current weather data is unavailable.",
            );
          }

          setWeather({
            temperature:
              typeof current.temperature_2m ===
              "number"
                ? current.temperature_2m
                : null,

            weatherCode:
              typeof current.weather_code ===
              "number"
                ? current.weather_code
                : null,

            isDay:
              Number(
                current.is_day,
              ) === 1,

            loading: false,
            error: false,
          });
        } catch (error: any) {
          if (
            error?.name ===
            "AbortError"
          ) {
            return;
          }

          console.error(
            "Failed to load Calbayog weather:",
            error,
          );

          setWeather({
            temperature: null,
            weatherCode: null,
            isDay: true,
            loading: false,
            error: true,
          });
        }
      };

    void loadWeather();

    const weatherInterval =
      window.setInterval(
        loadWeather,
        15 * 60 * 1000,
      );

    return () => {
      controller.abort();

      window.clearInterval(
        weatherInterval,
      );
    };
  }, []);

  /* =========================================================
     PRELOAD HERO IMAGES
  ========================================================= */

  useEffect(() => {
    heroSlides.forEach(
      (slide) => {
        const image =
          new Image();

        image.src =
          slide.image;
      },
    );
  }, []);

  /* =========================================================
     HERO NEXT
  ========================================================= */

  const nextSlide = () => {
    setActiveSlide(
      (current) =>
        (current + 1) %
        heroSlides.length,
    );
  };

  /* =========================================================
     HERO PREVIOUS
  ========================================================= */

  const previousSlide = () => {
    setActiveSlide(
      (current) =>
        current === 0
          ? heroSlides.length - 1
          : current - 1,
    );
  };

  /* =========================================================
     HERO AUTOMATIC SLIDESHOW
  ========================================================= */

  useEffect(() => {
    const interval =
      window.setInterval(
        () => {
          setActiveSlide(
            (current) =>
              (current + 1) %
              heroSlides.length,
          );
        },
        6000,
      );

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, []);

  /* =========================================================
     HERO TOUCH START
  ========================================================= */

  const handleTouchStart = (
    e: React.TouchEvent<HTMLDivElement>,
  ) => {
    touchStartX.current =
      e.touches[0].clientX;

    touchEndX.current =
      null;
  };

  /* =========================================================
     HERO TOUCH MOVE
  ========================================================= */

  const handleTouchMove = (
    e: React.TouchEvent<HTMLDivElement>,
  ) => {
    touchEndX.current =
      e.touches[0].clientX;
  };

  /* =========================================================
     HERO TOUCH END
  ========================================================= */

  const handleTouchEnd = () => {
    if (
      touchStartX.current ===
        null ||
      touchEndX.current ===
        null
    ) {
      return;
    }

    const distance =
      touchStartX.current -
      touchEndX.current;

    const minimumSwipeDistance = 50;

    if (
      Math.abs(distance) <
      minimumSwipeDistance
    ) {
      touchStartX.current =
        null;

      touchEndX.current =
        null;

      return;
    }

    if (distance > 0) {
      nextSlide();
    } else {
      previousSlide();
    }

    touchStartX.current =
      null;

    touchEndX.current =
      null;
  };

  /* =========================================================
     HERO MOUSE DOWN
  ========================================================= */

  const handleMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
  ) => {
    mouseStartX.current =
      e.clientX;

    isDragging.current =
      true;
  };

  /* =========================================================
     HERO MOUSE UP
  ========================================================= */

  const handleMouseUp = (
    e: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (
      mouseStartX.current ===
        null ||
      !isDragging.current
    ) {
      return;
    }

    const distance =
      mouseStartX.current -
      e.clientX;

    const minimumDragDistance = 50;

    if (
      Math.abs(distance) >=
      minimumDragDistance
    ) {
      if (distance > 0) {
        nextSlide();
      } else {
        previousSlide();
      }
    }

    mouseStartX.current =
      null;

    isDragging.current =
      false;
  };

  /* =========================================================
     HERO MOUSE LEAVE
  ========================================================= */

  const handleMouseLeave =
    () => {
      mouseStartX.current =
        null;

      isDragging.current =
        false;
    };

  /* =========================================================
     PAUSE ALL FEATURED VIDEOS
  ========================================================= */

  const pauseAllFeaturedVideos = () => {
    Object.values(
      videoRefs.current,
    ).forEach((video) => {
      if (video) {
        video.pause();
      }
    });
  };

  /* =========================================================
     LOAD FEATURED VIDEOS
  ========================================================= */

  const loadFeaturedVideos =
    async () => {
      setLoadingFeaturedVideos(
        true,
      );

      setFeaturedVideosError(
        false,
      );

      try {
        const response =
          await getFeaturedVideos();

        const data =
          Array.isArray(
            response?.data,
          )
            ? response.data.filter(
                (video) =>
                  Boolean(
                    video?.id &&
                    video?.video_url,
                  ),
              )
            : [];

        setFeaturedVideos(
          data,
        );

        setActiveVideo(0);
      } catch (error) {
        console.error(
          "Failed to load Featured Videos:",
          error,
        );

        setFeaturedVideos(
          [],
        );

        setFeaturedVideosError(
          true,
        );
      } finally {
        setLoadingFeaturedVideos(
          false,
        );
      }
    };

  /* =========================================================
     LOAD SELECTED ATTRACTIONS
  ========================================================= */

  const loadWelcomeDestinations =
    async () => {
      setLoadingDestinations(
        true,
      );

      try {
        const response =
          await getAttractions({
            show_on_welcome: true,
          });

        const data =
          Array.isArray(
            response?.data,
          )
            ? response.data
            : [];

        const selected =
          data.slice(0, 4);

        setWelcomeDestinations(
          selected,
        );

        selected.forEach(
          (
            attraction: Destination,
          ) => {
            const attractionId =
              String(
                (attraction as any)
                  ?.id ?? "",
              ).trim();

            if (
              !attractionId
            ) {
              return;
            }

            const count =
              Math.max(
                0,
                Number(
                  (
                    attraction as any
                  )?.favorites ??
                    0,
                ) || 0,
              );

            setFavoriteCount(
              "attraction",
              attractionId,
              count,
            );
          },
        );

        setImageIndexes({});
      } catch (error) {
        console.error(
          "Failed to load Welcome Page attractions:",
          error,
        );

        setWelcomeDestinations(
          [],
        );
      } finally {
        setLoadingDestinations(
          false,
        );
      }
    };

  /* =========================================================
     LOAD SELECTED ACCOMMODATIONS
  ========================================================= */

  const loadWelcomeAccommodations =
    async () => {
      setLoadingAccommodations(
        true,
      );

      try {
        const response =
          await getAccommodations({
            show_on_welcome: true,
          });

        const data =
          Array.isArray(
            response?.data,
          )
            ? response.data
            : [];

        setWelcomeAccommodations(
          data.slice(0, 4),
        );
      } catch (error) {
        console.error(
          "Failed to load Welcome Page accommodations:",
          error,
        );

        setWelcomeAccommodations(
          [],
        );
      } finally {
        setLoadingAccommodations(
          false,
        );
      }
    };

  /* =========================================================
     LOAD ALL MAP PINS
  ========================================================= */

  const loadWelcomeMapPlaces =
    async () => {
      setLoadingMap(true);

      try {
        const [
          attractionsResponse,
          accommodationsResponse,
        ] = await Promise.all([
          getAttractions(),
          getAccommodations(),
        ]);

        const attractionData =
          Array.isArray(
            attractionsResponse?.data,
          )
            ? attractionsResponse.data
            : [];

        const accommodationData =
          Array.isArray(
            accommodationsResponse?.data,
          )
            ? accommodationsResponse.data
            : [];

        const nextAttractions =
          attractionData
            .map((item: any) => {
              const coordinates =
                getWelcomeCoordinates(item);

              if (!coordinates) {
                return null;
              }

              const id = String(
                item?.id ?? "",
              ).trim();

              if (!id) {
                return null;
              }

              return {
                id,
                name:
                  String(
                    item?.name ??
                      "Unnamed attraction",
                  ).trim(),
                category:
                  getWelcomeFirstValue(
                    item,
                    [
                      "category",
                      "destination_category",
                    ],
                  ) || "Other",
                subcategory:
                  getWelcomeAttractionSubcategory(
                    item,
                  ),
                markerType:
                  getWelcomeAttractionSubcategory(
                    item,
                  ),
                address:
                  getWelcomeFirstValue(
                    item,
                    [
                      "location_address",
                      "address",
                    ],
                  ),
                coordinates,
              };
            })
            .filter(
              Boolean,
            ) as WelcomeMapAttraction[];

        const nextAccommodations =
          accommodationData
            .map((item: any) => {
              const coordinates =
                getWelcomeCoordinates(item);

              if (!coordinates) {
                return null;
              }

              const id = String(
                item?.id ?? "",
              ).trim();

              if (!id) {
                return null;
              }

              return {
                id,
                name:
                  String(
                    item?.name ??
                      "Unnamed accommodation",
                  ).trim(),
                type:
                  getWelcomeFirstValue(
                    item,
                    [
                      "type",
                      "accommodation_type",
                      "category",
                    ],
                  ),
                address:
                  getWelcomeFirstValue(
                    item,
                    [
                      "address",
                      "location_address",
                    ],
                  ),
                coordinates,
              };
            })
            .filter(
              Boolean,
            ) as WelcomeMapAccommodation[];

        setMapAttractions(
          nextAttractions,
        );
        setMapAccommodations(
          nextAccommodations,
        );
      } catch (error) {
        console.error(
          "Failed to load Welcome Page map pins:",
          error,
        );

        setMapAttractions([]);
        setMapAccommodations([]);
      } finally {
        setLoadingMap(false);
      }
    };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    void loadWelcomeDestinations();

    void loadWelcomeAccommodations();

    void loadWelcomeMapPlaces();

    void loadFeaturedVideos();
  }, []);

  /* =========================================================
     AUTO ROTATE ATTRACTION IMAGES
  ========================================================= */

  useEffect(() => {
    if (
      welcomeDestinations.length ===
      0
    ) {
      return;
    }

    const interval =
      window.setInterval(
        () => {
          setImageIndexes(
            (previous) => {
              const next = {
                ...previous,
              };

              welcomeDestinations.forEach(
                (destination) => {
                  const images =
                    Array.isArray(
                      destination.images,
                    )
                      ? destination.images.filter(
                          Boolean,
                        )
                      : [];

                  const id =
                    String(
                      (
                        destination as any
                      )?.id ?? "",
                    ).trim();

                  if (
                    id &&
                    images.length >
                      1
                  ) {
                    const currentIndex =
                      previous[
                        id
                      ] || 0;

                    next[id] =
                      (currentIndex +
                        1) %
                      images.length;
                  }
                },
              );

              return next;
            },
          );
        },
        5500,
      );

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [
    welcomeDestinations,
  ]);

  /* =========================================================
     FEATURED VIDEO ACTIVE INDEX
  ========================================================= */

  useEffect(() => {
    if (
      featuredVideos.length ===
      0
    ) {
      setActiveVideo(0);
      return;
    }

    if (
      activeVideo >=
      featuredVideos.length
    ) {
      setActiveVideo(0);
    }
  }, [
    featuredVideos.length,
    activeVideo,
  ]);

  /* =========================================================
     STOP PREVIOUS VIDEO WHEN CAROUSEL CHANGES
  ========================================================= */

  useEffect(() => {
    Object.values(videoRefs.current).forEach(
      (videoElement) => {
        if (videoElement) {
          videoElement.pause();
        }
      },
    );
  }, [activeVideo]);

  /* =========================================================
     CURRENT HERO
  ========================================================= */

  const currentHero =
    heroSlides[activeSlide];

  /* =========================================================
     WEATHER DISPLAY
  ========================================================= */

  const weatherDescription =
    getWeatherDescription(
      weather.weatherCode,
    );

  const weatherText =
    weather.loading
      ? "Loading weather..."
      : weather.error
        ? "Weather unavailable"
        : weather.temperature !==
            null
          ? `${weather.temperature.toFixed(
              1,
            )}°C`
          : weatherDescription;

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="page-enter welcome-page">
      <Container className="welcome-container py-4 py-md-5">

        {/* =====================================================
            SWIPEABLE WELCOME HERO
        ===================================================== */}

        <section className="welcome-hero-section mb-5">
          <div
            className="welcome-hero-slider"
            onTouchStart={
              handleTouchStart
            }
            onTouchMove={
              handleTouchMove
            }
            onTouchEnd={
              handleTouchEnd
            }
            onMouseDown={
              handleMouseDown
            }
            onMouseUp={
              handleMouseUp
            }
            onMouseLeave={
              handleMouseLeave
            }
          >
            <img
              key={
                currentHero.id
              }
              src={
                currentHero.image
              }
              alt={
                currentHero.alt
              }
              className="welcome-hero-image"
              draggable={false}
            />

            <div className="welcome-hero-overlay" />

            <div className="welcome-hero-content">
              <h1 className="welcome-hero-title barabara-display">
                {welcomeGreeting}
              </h1>

              <div className="welcome-hero-detail">
                <span className="welcome-hero-detail-icon">
                  <MapPin
                    size={23}
                    strokeWidth={
                      2.1
                    }
                    aria-hidden="true"
                  />
                </span>

                <span>
                  Calbayog City, Philippines
                </span>
              </div>

              <div className="welcome-hero-detail">
                <span className="welcome-hero-detail-icon">
                  <CalendarDays
                    size={23}
                    strokeWidth={
                      2.1
                    }
                    aria-hidden="true"
                  />
                </span>

                <span>
                  {currentDate ||
                    "Loading date..."}
                </span>
              </div>

              <div
                className="welcome-hero-detail"
                aria-live="polite"
              >
                <span className="welcome-hero-detail-icon">
                  <CloudSun
                    size={25}
                    strokeWidth={
                      2.1
                    }
                    aria-hidden="true"
                  />
                </span>

                <span>
                  {weatherText}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="welcome-hero-arrow welcome-hero-arrow-left"
              onClick={(e) => {
                e.stopPropagation();
                previousSlide();
              }}
              aria-label="Previous hero image"
            >
              ‹
            </button>

            <button
              type="button"
              className="welcome-hero-arrow welcome-hero-arrow-right"
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              aria-label="Next hero image"
            >
              ›
            </button>

            <div className="welcome-hero-dots">
              {heroSlides.map(
                (
                  slide,
                  index,
                ) => (
                  <button
                    type="button"
                    key={
                      slide.id
                    }
                    className={`welcome-hero-dot ${
                      activeSlide ===
                      index
                        ? "active"
                        : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();

                      setActiveSlide(
                        index,
                      );
                    }}
                    aria-label={`Show hero image ${
                      index + 1
                    }`}
                    aria-current={
                      activeSlide ===
                      index
                        ? "true"
                        : undefined
                    }
                  />
                ),
              )}
            </div>
          </div>
        </section>

        {/* =====================================================
            EXPLORE CALBAYOG
        ===================================================== */}

        <section className="welcome-explore-section mb-5">
          <div className="welcome-explore-top">
            <div className="welcome-section-heading">
            <div className="welcome-intro">
              <div className="welcome-intro-eyebrow">
                WELCOME TO CALBAYOG
              </div>

              <p className="welcome-intro-text">
                Explore breathtaking
                waterfalls, peaceful
                coastlines, rich heritage,
                and local experiences
                waiting to be discovered.
              </p>
            </div>

            <div
              className="welcome-bunting"
              aria-hidden="true"
            >
              <span className="bunting-flag bunting-red" />
              <span className="bunting-flag bunting-orange" />
              <span className="bunting-flag bunting-yellow" />
              <span className="bunting-flag bunting-teal" />

              <span className="bunting-flag bunting-red" />
              <span className="bunting-flag bunting-orange" />
              <span className="bunting-flag bunting-yellow" />
              <span className="bunting-flag bunting-teal" />

              <span className="bunting-flag bunting-red" />
              <span className="bunting-flag bunting-orange" />
              <span className="bunting-flag bunting-yellow" />
              <span className="bunting-flag bunting-teal" />

              <span className="bunting-flag bunting-red" />
              <span className="bunting-flag bunting-orange" />
              <span className="bunting-flag bunting-yellow" />
              <span className="bunting-flag bunting-teal" />

              <span className="bunting-flag bunting-red" />
              <span className="bunting-flag bunting-orange" />
              <span className="bunting-flag bunting-yellow" />
              <span className="bunting-flag bunting-teal" />
            </div>

            <div
              className="welcome-mobile-bunting welcome-explore-mobile-bunting"
              aria-hidden="true"
            >
              <span className="bunting-flag bunting-red" />
              <span className="bunting-flag bunting-orange" />
              <span className="bunting-flag bunting-yellow" />
              <span className="bunting-flag bunting-teal" />
              <span className="bunting-flag bunting-red" />
              <span className="bunting-flag bunting-orange" />
              <span className="bunting-flag bunting-yellow" />
              <span className="bunting-flag bunting-teal" />
              <span className="bunting-flag bunting-red" />
              <span className="bunting-flag bunting-orange" />
              <span className="bunting-flag bunting-yellow" />
              <span className="bunting-flag bunting-teal" />
            </div>

            <div className="section-header welcome-main-heading">
              <div>
                <h2 className="section-title welcome-display-title barabara-display">
                  EXPLORE CALBAYOG
                </h2>
              </div>
            </div>

            <div className="welcome-section-eyebrow welcome-explore-eyebrow">
              <span className="welcome-heading-line" />

              <span>
                Find a place worth slowing down for
              </span>

              <span className="welcome-heading-line" />
            </div>
            </div>

            <div className="welcome-explore-map-column">
              {loadingMap ? (
                <div className="welcome-map-loading" aria-live="polite">
                  <div className="welcome-map-loading-spinner" />
                  <span>Loading Calbayog map...</span>
                </div>
              ) : (
                <WelcomeMap
                  attractions={mapAttractions}
                  accommodations={mapAccommodations}
                />
              )}
            </div>
          </div>

          <Row className="g-3 g-md-4 welcome-quick-grid">
            {quickCards
  .filter(
    (card) =>
      card.to !== "/memories" || isUserAuthenticated,
  )
  .map(
              (card) => (
                <Col
                  xs={4}
                  sm={4}
                  md={3}
                  lg={3}
                  key={card.to}
                >
                  <Link
                    to={card.to}
                    className="welcome-quick-link"
                    onClick={(event) =>
                      handleProtectedQuickCardClick(event, card.to)
                    }
                  >
                    <Card className="quick-card welcome-quick-card text-center border-0 h-100">
                      <Card.Body className="quick-card-body">
                        <div
                          className="quick-card-icon-wrap"
                          style={{
                            background:
                              card.bg,
                          }}
                        >
                          <span className="quick-card-icon">
                            {card.icon}
                          </span>
                        </div>

                        <div
                          className="quick-card-label"
                          style={{
                            color:
                              card.color,
                          }}
                        >
                          {card.label}
                        </div>
                      </Card.Body>
                    </Card>
                  </Link>
                </Col>
              ),
            )}
          </Row>
        </section>

        {/* =====================================================
            ATTRACTIONS
        ===================================================== */}

        {!loadingDestinations &&
          welcomeDestinations.length >
            0 && (
            <section className="welcome-discover-section mb-5">
              <div className="welcome-attractions-heading">
                <div className="welcome-mobile-bunting" aria-hidden="true">
                  <span className="bunting-flag bunting-red" />
                  <span className="bunting-flag bunting-orange" />
                  <span className="bunting-flag bunting-yellow" />
                  <span className="bunting-flag bunting-teal" />
                  <span className="bunting-flag bunting-red" />
                  <span className="bunting-flag bunting-orange" />
                  <span className="bunting-flag bunting-yellow" />
                  <span className="bunting-flag bunting-teal" />
                  <span className="bunting-flag bunting-red" />
                  <span className="bunting-flag bunting-orange" />
                  <span className="bunting-flag bunting-yellow" />
                  <span className="bunting-flag bunting-teal" />
                </div>

                <h2 className="welcome-attractions-title barabara-display">
                  ATTRACTIONS
                </h2>

                <div className="welcome-section-eyebrow welcome-attractions-eyebrow">
                  <span className="welcome-heading-line" />

                  <span>
                    Places worth discovering in Calbayog
                  </span>

                  <span className="welcome-heading-line" />
                </div>
              </div>

              <div className="welcome-attractions-toolbar">
                <Link
                  to="/attractions"
                  className="welcome-view-more-button"
                >
                  View more attractions
                  <ChevronRight
                    size={17}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </Link>
              </div>

              <div className="welcome-attractions-carousel">
                <Swiper
                  modules={[A11y]}
                  slidesPerView={1.12}
                  spaceBetween={16}
                  centeredSlides={false}
                  grabCursor
                  watchOverflow
                  resistanceRatio={0.85}
                  touchRatio={1}
                  breakpoints={{
                    576: {
                      slidesPerView: 2.1,
                      spaceBetween: 18,
                    },
                    768: {
                      slidesPerView: 2.35,
                      spaceBetween: 20,
                    },
                    992: {
                      slidesPerView: 3.1,
                      spaceBetween: 22,
                    },
                    1200: {
                      slidesPerView: 4,
                      spaceBetween: 24,
                    },
                  }}
                  className="welcome-attractions-swiper"
                >
                  {welcomeDestinations.map(
                    (attraction) => {
                      const attractionId =
                        String(
                          (attraction as any)
                            ?.id ?? "",
                        ).trim();

                      return (
                        <SwiperSlide
                          key={
                            attractionId ||
                            attraction.name
                          }
                          className="welcome-attraction-slide"
                        >
                          <div className="welcome-attraction-card-shell">
                            <AttractionCard
                              attraction={
                                attraction
                              }
                              imageIndex={
                                attractionId
                                  ? imageIndexes[
                                      attractionId
                                    ] || 0
                                  : 0
                              }
                              showFavoriteCount={
                                true
                              }
                              showFeatured={
                                true
                              }
                            />
                          </div>
                        </SwiperSlide>
                      );
                    },
                  )}
                </Swiper>
              </div>
            </section>
          )}

        {/* =====================================================
            ACCOMMODATIONS
        ===================================================== */}

        {!loadingAccommodations &&
          welcomeAccommodations.length >
            0 && (
            <section className="welcome-accommodations-section mb-5">
              <div className="welcome-accommodations-heading">
                <div className="welcome-mobile-bunting" aria-hidden="true">
                  <span className="bunting-flag bunting-red" />
                  <span className="bunting-flag bunting-orange" />
                  <span className="bunting-flag bunting-yellow" />
                  <span className="bunting-flag bunting-teal" />
                  <span className="bunting-flag bunting-red" />
                  <span className="bunting-flag bunting-orange" />
                  <span className="bunting-flag bunting-yellow" />
                  <span className="bunting-flag bunting-teal" />
                  <span className="bunting-flag bunting-red" />
                  <span className="bunting-flag bunting-orange" />
                  <span className="bunting-flag bunting-yellow" />
                  <span className="bunting-flag bunting-teal" />
                </div>

                <h2 className="welcome-accommodations-title barabara-display">
                  ACCOMMODATIONS
                </h2>

                <div className="welcome-section-eyebrow welcome-accommodations-eyebrow">
                  <span className="welcome-heading-line" />

                  <span>
                    Places to stay in Calbayog
                  </span>

                  <span className="welcome-heading-line" />
                </div>
              </div>

              <div className="welcome-accommodations-toolbar">
                <Link
                  to="/accommodations"
                  className="welcome-view-more-link"
                >
                  View more accommodations
                  <ChevronRight
                    size={17}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </Link>
              </div>

              <Row className="g-3 g-md-4">
                {welcomeAccommodations.map(
                  (
                    accommodation,
                  ) => {
                    const accommodationData =
                      accommodation as any;

                    const images: string[] =
                      Array.isArray(
                        accommodationData.images,
                      )
                        ? accommodationData.images
                        : typeof accommodationData.images ===
                              "string" &&
                            accommodationData.images.trim()
                          ? accommodationData.images
                              .split(",")
                              .map(
                                (
                                  image: string,
                                ) =>
                                  image.trim(),
                              )
                              .filter(
                                Boolean,
                              )
                          : [];

                    const priceMin =
                      accommodationData.price_min;

                    const priceMax =
                      accommodationData.price_max;

                    const hasPriceMin =
                      priceMin !== null &&
                      priceMin !==
                        undefined &&
                      priceMin !== "";

                    const hasPriceMax =
                      priceMax !== null &&
                      priceMax !==
                        undefined &&
                      priceMax !== "";

                    let priceText =
                      "";

                    if (
                      hasPriceMin &&
                      hasPriceMax
                    ) {
                      priceText = `₱${Number(
                        priceMin,
                      ).toLocaleString()} – ₱${Number(
                        priceMax,
                      ).toLocaleString()}`;
                    } else if (
                      hasPriceMin
                    ) {
                      priceText = `From ₱${Number(
                        priceMin,
                      ).toLocaleString()}`;
                    } else if (
                      hasPriceMax
                    ) {
                      priceText = `Up to ₱${Number(
                        priceMax,
                      ).toLocaleString()}`;
                    }

                    const cardItem: AccommodationCardItem =
                      {
                        id: String(
                          accommodationData.id ??
                            "",
                        ),
                        name:
                          accommodationData.name,
                        owner:
                          accommodationData.owner ??
                          null,
                        manager:
                          accommodationData.manager ??
                          null,
                        address:
                          accommodationData.address ||
                          accommodationData.location_address ||
                          null,
                        contact_number:
                          accommodationData.contact_number ??
                          null,
                        website:
                          accommodationData.website ??
                          null,
                        images,
                        description:
                          accommodationData.description ??
                          null,
                        price_range:
                          accommodationData.price_range ||
                          priceText ||
                          null,
                        featured: Boolean(
                          accommodationData.featured,
                        ),
                      };

                    return (
                      <Col
                        xs={12}
                        sm={6}
                        lg={3}
                        key={
                          accommodation.id
                        }
                      >
                        <AccommodationCard
                          accommodation={
                            cardItem
                          }
                        />
                      </Col>
                    );
                  },
                )}
              </Row>
            </section>
          )}

        {/* =====================================================
            FEATURED VIDEOS
            UI INITIATIVE / SWIPER 3D CAROUSEL
        ===================================================== */}

        <section className="welcome-videos-section mb-5">
          <div className="welcome-videos-heading">
            <div className="welcome-mobile-bunting" aria-hidden="true">
                  <span className="bunting-flag bunting-red" />
                  <span className="bunting-flag bunting-orange" />
                  <span className="bunting-flag bunting-yellow" />
                  <span className="bunting-flag bunting-teal" />
                  <span className="bunting-flag bunting-red" />
                  <span className="bunting-flag bunting-orange" />
                  <span className="bunting-flag bunting-yellow" />
                  <span className="bunting-flag bunting-teal" />
                  <span className="bunting-flag bunting-red" />
                  <span className="bunting-flag bunting-orange" />
                  <span className="bunting-flag bunting-yellow" />
                  <span className="bunting-flag bunting-teal" />
                </div>

                <h2 className="welcome-videos-title barabara-display">
              FEATURED VIDEOS
            </h2>

            <div className="welcome-section-eyebrow welcome-videos-eyebrow">
              <span className="welcome-heading-line" />

              <span>
                Experience Calbayog through video
              </span>

              <span className="welcome-heading-line" />
            </div>
          </div>

          {loadingFeaturedVideos ? (
            <div
              className="welcome-video-loading"
              aria-live="polite"
            >
              <div className="welcome-video-loading-spinner" />

              <span>
                Loading featured videos...
              </span>
            </div>
          ) : featuredVideos.length ===
            0 ? (
            <div
              className="welcome-video-empty"
              aria-live="polite"
            >
              <div className="welcome-video-empty-icon">
                <Play
                  size={25}
                  strokeWidth={1.8}
                />
              </div>

              <h3>
                No featured videos yet
              </h3>

              <p>
                Featured videos uploaded from the
                admin dashboard will appear here.
              </p>

              {featuredVideosError && (
                <small>
                  Unable to load featured videos
                  right now.
                </small>
              )}
            </div>
          ) : (
            <div className="welcome-video-carousel">
              <Swiper
                modules={[
                  EffectCoverflow,
                  Navigation,
                  Pagination,
                  A11y,
                ]}
                effect="coverflow"
                centeredSlides
                grabCursor
                loop={
                  featuredVideos.length > 2
                }
                slidesPerView="auto"
                speed={700}
                watchSlidesProgress
                observer
                observeParents
                onSwiper={(
                  swiper,
                ) => {
                  setVideoSwiper(
                    swiper,
                  );

                  setActiveVideo(
                    swiper.realIndex,
                  );
                }}
                onSlideChange={(
                  swiper,
                ) => {
                  pauseAllFeaturedVideos();

                  setActiveVideo(
                    swiper.realIndex,
                  );
                }}
                coverflowEffect={{
                  rotate: 0,
                  stretch: 0,
                  depth: 260,
                  modifier: 1.25,
                  scale: 0.84,
                  slideShadows: false,
                }}
                navigation={{
                  prevEl:
                    ".welcome-video-prev",
                  nextEl:
                    ".welcome-video-next",
                }}
                pagination={{
                  el:
                    ".welcome-video-pagination",
                  clickable: true,
                  dynamicBullets: true,
                }}
                className="welcome-featured-swiper"
              >
                {featuredVideos.map(
                  (
                    video,
                    index,
                  ) => (
                    <SwiperSlide
                      key={
                        video.id
                      }
                      className="welcome-featured-swiper-slide"
                    >
                      <div className="welcome-video-cinematic-card">
                        <div className="welcome-video-media">
                          <video
                            ref={(element) => {
                              videoRefs.current[String(video.id)] =
                                element;
                            }}
                            className="welcome-video-player"
                            controls={
                              activeVideo ===
                              index
                            }
                            playsInline
                            preload={
                              activeVideo ===
                              index
                                ? "metadata"
                                : "none"
                            }
                            onPlay={(event) => {
                              Object.entries(videoRefs.current).forEach(
                                ([videoId, videoElement]) => {
                                  if (
                                    videoElement &&
                                    videoElement !== event.currentTarget &&
                                    videoId !== String(video.id)
                                  ) {
                                    videoElement.pause();
                                  }
                                },
                              );
                            }}
                            onEnded={() => {
                              if (
                                videoSwiper &&
                                featuredVideos.length >
                                  1
                              ) {
                                videoSwiper.slideNext();
                              }
                            }}
                          >
                            <source
                              src={
                                video.video_url
                              }
                              type="video/mp4"
                            />

                            Your browser does not
                            support the video element.
                          </video>

                          <div className="welcome-video-gradient" />

                          <div className="welcome-video-play-badge">
                            <Play
                              size={20}
                              fill="currentColor"
                              strokeWidth={
                                2
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  ),
                )}
              </Swiper>

              {featuredVideos.length >
                1 && (
                <>
                  <button
                    type="button"
                    className="welcome-video-arrow welcome-video-prev"
                    aria-label="Previous featured video"
                  >
                    <ChevronLeft
                      size={25}
                      strokeWidth={2}
                    />
                  </button>

                  <button
                    type="button"
                    className="welcome-video-arrow welcome-video-next"
                    aria-label="Next featured video"
                  >
                    <ChevronRight
                      size={25}
                      strokeWidth={2}
                    />
                  </button>

                  <div className="welcome-video-pagination" />
                </>
              )}
            </div>
          )}
        </section>
      </Container>

      {/* =======================================================
          WELCOME PAGE STYLES
      ======================================================= */}

      <style>{`
        @import url(
          'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
        );

        @font-face {
          font-family: "Barabara";
          src: url("/fonts/BARABARA-final.otf")
            format("opentype");
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }

        .welcome-page,
        .welcome-page * {
          font-family:
            "Inter",
            sans-serif;
        }

        .welcome-container {
          width: 100%;
          max-width: 1240px;
        }

        .barabara-display {
          font-family:
            "Barabara",
            "Arial Black",
            Arial,
            sans-serif !important;
          font-style: normal;
          font-weight: 400;
        }

        .welcome-display-title {
          color:
            #2D3195 !important;
          font-size:
            1.70rem;
        }

        .welcome-explore-section {
          margin-bottom: 96px !important;
        }

        .welcome-discover-section {
          margin-bottom: 96px !important;
        }

        .welcome-accommodations-section {
          margin-bottom: 96px !important;
        }

        .welcome-videos-section {
          margin-bottom: 70px !important;
        }

        .welcome-explore-top {
          width: 100%;
          display: grid;
          grid-template-columns: minmax(280px, 0.78fr) minmax(0, 1.22fr);
          gap: 34px;
          align-items: center;
          margin-bottom: 2.6rem;
        }

        .welcome-explore-top .welcome-section-heading {
          margin-bottom: 0;
          padding-top: 0;
        }

        .welcome-explore-top .welcome-intro {
          max-width: 680px;
          margin-bottom: 30px;
        }

        .welcome-explore-map-column {
          width: 100%;
          min-width: 0;
        }

        .welcome-map-shell {
          position: relative;
          width: 100%;
          height: 430px;
          overflow: hidden;
          border: 1px solid rgba(45, 49, 149, 0.12);
          border-radius: 24px;
          background: #eef2f7;
          box-shadow: 0 18px 45px rgba(27, 35, 74, 0.12);
        }

        .welcome-map {
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        .welcome-map-loading {
          width: 100%;
          height: 430px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          border: 1px solid rgba(45, 49, 149, 0.12);
          border-radius: 24px;
          background: linear-gradient(135deg, #f4f6fb, #edf0f8);
          color: #555;
          font-size: 0.78rem;
          font-weight: 600;
        }

        .welcome-map-loading-spinner {
          width: 30px;
          height: 30px;
          border: 3px solid rgba(45, 49, 149, 0.16);
          border-top-color: #2D3195;
          border-radius: 50%;
          animation: welcome-map-spin 0.85s linear infinite;
        }

        @keyframes welcome-map-spin {
          to { transform: rotate(360deg); }
        }

        .welcome-map-shell .leaflet-control-layers {
          border: 0;
          border-radius: 12px;
          box-shadow: 0 7px 22px rgba(15, 23, 42, 0.18);
          overflow: hidden;
          font-family: Inter, sans-serif;
          font-size: 0.72rem;
        }

        .welcome-map-shell .leaflet-control-layers-toggle {
          width: 38px;
          height: 38px;
        }

        .welcome-map-shell .leaflet-control-zoom {
          border: 0;
          border-radius: 11px;
          overflow: hidden;
          box-shadow: 0 7px 22px rgba(15, 23, 42, 0.18);
        }

        .welcome-map-shell .leaflet-control-zoom a {
          width: 34px;
          height: 34px;
          line-height: 34px;
          border: 0;
          color: #2D3195;
          background: rgba(255, 255, 255, 0.96);
        }

        .welcome-map-shell .leaflet-control-zoom a:hover {
          background: #fff;
        }

        .welcome-map-shell .leaflet-control-scale-line {
          border: 2px solid rgba(45, 49, 149, 0.72);
          border-top: 0;
          background: rgba(255, 255, 255, 0.82);
          color: #303030;
          font-size: 0.62rem;
        }

        .welcome-map-locate-control {
          margin-top: 10px !important;
          border: 0 !important;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 7px 22px rgba(15, 23, 42, 0.18);
        }

        .welcome-map-locate-control button {
          width: 34px;
          height: 34px;
          border: 0;
          background: rgba(255, 255, 255, 0.96);
          color: #2D3195;
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
        }

        .welcome-map-locate-control button:hover {
          background: #fff;
        }

        .welcome-map-attraction-marker,
        .welcome-map-accommodation-marker {
          background: transparent !important;
          border: 0 !important;
        }

        .welcome-map-marker-shell {
          position: relative;
          width: 44px;
          height: 52px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          filter: drop-shadow(0 3px 4px rgba(15, 23, 42, 0.30));
        }

        .welcome-map-marker-pin {
          position: absolute;
          top: 0;
          left: 3px;
          width: 38px;
          height: 38px;
          border: 3px solid #fff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.18);
        }

        .welcome-map-marker-icon {
          position: absolute;
          top: 7px;
          left: 10px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #fff;
          z-index: 2;
          font-size: 14px;
          line-height: 1;
        }

        .welcome-map-accommodation-pin {
          position: relative;
          width: 44px;
          height: 52px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          filter: drop-shadow(0 3px 4px rgba(15, 23, 42, 0.30));
        }

        .welcome-map-accommodation-pin::before {
          content: "";
          position: absolute;
          top: 0;
          left: 3px;
          width: 38px;
          height: 38px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          background: #2563EB;
          border: 3px solid #fff;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.18);
        }

        .welcome-map-accommodation-icon {
          position: absolute;
          top: 7px;
          left: 10px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #fff;
          z-index: 2;
        }

        .welcome-map-label {
          padding: 5px 8px !important;
          border: 0 !important;
          border-radius: 8px !important;
          background: rgba(255, 255, 255, 0.96) !important;
          color: #202020 !important;
          box-shadow: 0 3px 12px rgba(15, 23, 42, 0.18) !important;
          font-family: Inter, sans-serif !important;
          font-size: 0.60rem !important;
          line-height: 1.2 !important;
          text-align: center;
        }

        .welcome-map-label::before {
          border-top-color: rgba(255, 255, 255, 0.96) !important;
        }

        .welcome-map-label-name,
        .welcome-map-label-sub {
          display: block;
          white-space: nowrap;
        }

        .welcome-map-label-name {
          font-weight: 800;
          color: #222;
        }

        .welcome-map-label-sub {
          margin-top: 2px;
          color: #666;
          font-size: 0.54rem;
          font-weight: 600;
        }

        .welcome-map-label.accommodation .welcome-map-label-name {
          color: #2563EB;
        }

        .welcome-map-popup {
          min-width: 170px;
          font-family: Inter, sans-serif;
        }

        .welcome-map-popup-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 7px;
          border-radius: 999px;
          background: rgba(45, 49, 149, 0.10);
          color: #2D3195;
          font-size: 0.58rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .welcome-map-popup-badge.accommodation {
          background: rgba(37, 99, 235, 0.10);
          color: #2563EB;
        }

        .welcome-map-popup-title {
          margin: 8px 0 3px;
          color: #222;
          font-size: 0.88rem;
          font-weight: 800;
        }

        .welcome-map-popup-category,
        .welcome-map-popup-address {
          margin: 0;
          color: #666;
          font-size: 0.68rem;
          line-height: 1.45;
        }

        .welcome-map-popup-address {
          margin-top: 5px;
        }

        .welcome-map-legend {
          position: absolute;
          left: 12px;
          bottom: 12px;
          z-index: 500;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 7px 9px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.93);
          box-shadow: 0 5px 18px rgba(15, 23, 42, 0.14);
          font-size: 0.62rem;
          font-weight: 700;
          color: #4b4b4b;
        }

        .welcome-map-legend span {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .welcome-map-legend-dot {
          width: 8px;
          height: 8px;
          display: inline-block;
          border-radius: 50%;
        }

        .welcome-map-legend-dot.attraction {
          background: #16845B;
        }

        .welcome-map-legend-dot.accommodation {
          background: #2563EB;
        }

        .welcome-intro {
          width:
            100%;
          max-width:
            680px;
          margin:
            0 auto 30px;
          padding:
            0 12px;
          text-align:
            center;
        }

        .welcome-intro-eyebrow {
          margin:
            0;
          color:
            #2D3195;
          font-size:
            0.62rem;
          font-weight:
            700;
          letter-spacing:
            0.18em;
          line-height:
            1.2;
          text-transform:
            uppercase;
        }

        .welcome-intro-text {
          margin:
            10px auto 0;
          max-width:
            630px;
          color:
            #666666;
          font-size:
            0.79rem;
          font-weight:
            400;
          line-height:
            1.7;
        }

        .welcome-section-heading {
          width:
            100%;
          display:
            flex;
          flex-direction:
            column;
          align-items:
            center;
          padding-top:
            18px;
          margin-bottom:
            2.6rem;
        }

        .welcome-main-heading {
          width:
            100%;
          display:
            flex;
          justify-content:
            center;
          align-items:
            center;
          margin-top:
            0;
          margin-bottom:
            7px;
        }

        .welcome-main-heading > div {
          width:
            100%;
          text-align:
            center;
        }

        .welcome-explore-eyebrow {
          margin-top:
            0;
          margin-bottom:
            0;
        }

        .welcome-bunting {
          width:
            min(100%, 940px);
          height:
            32px;
          display:
            flex;
          align-items:
            flex-start;
          justify-content:
            center;
          overflow:
            hidden;
          margin:
            0 auto 26px;
          padding:
            0 8px;
          line-height:
            0;
        }

        .bunting-flag {
          position:
            relative;
          display:
            block;
          width:
            46px;
          height:
            32px;
          flex:
            0 0 46px;
          clip-path:
            polygon(
              0 0,
              100% 0,
              50% 100%
            );
          margin-left:
            -1px;
        }

        .bunting-red {
          background:
            #ED1C24;
        }

        .bunting-orange {
          background:
            #F36C21;
        }

        .bunting-yellow {
          background:
            #F2B705;
        }

        .bunting-teal {
          background:
            #14A6A0;
        }

        .bunting-flag:not(:first-child) {
          border-left:
            2px solid #ffffff;
        }

        .welcome-section-eyebrow {
          display:
            flex;
          align-items:
            center;
          justify-content:
            center;
          width:
            100%;
          gap:
            12px;
          color:
            #555555;
          font-size:
            0.68rem;
          font-weight:
            600;
          letter-spacing:
            0.14em;
          text-transform:
            uppercase;
          line-height:
            1.2;
          text-align:
            center;
        }

        .welcome-heading-line {
          width:
            38px;
          height:
            1px;
          background:
            rgba(
              45,
              49,
              149,
              0.24
            );
          flex-shrink:
            0;
        }

        .welcome-mobile-bunting {
          display: none;
        }

        .welcome-display-title {
          margin:
            0;
          padding:
            0;
          color:
            #2D3195 !important;
          font-size:
            1.70rem;
          line-height:
            1;
          letter-spacing:
            0.015em;
          text-align:
            center;
        }

        .welcome-quick-grid {
          margin-top:
            0;
          row-gap:
            42px;
        }

        .welcome-quick-link {
          color:
            inherit;
          text-decoration:
            none;
        }

        .welcome-quick-link:hover {
          color:
            inherit;
          text-decoration:
            none;
        }

        .welcome-quick-card,
        .quick-card-body,
        .quick-card-label {
          font-family:
            "Inter",
            sans-serif;
        }

        .quick-card-label {
          font-weight:
            600;
        }

        .welcome-quick-card {
          background: transparent !important;
          transition: transform 0.22s ease;
        }

        .welcome-quick-card:hover {
          transform: translateY(-3px);
        }

        .welcome-quick-card .quick-card-body {
          padding: 0.2rem 0.15rem;
        }

        .welcome-quick-card .quick-card-icon-wrap {
          width: 54px;
          height: 54px;
          margin: 0 auto 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 17px;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }

        .welcome-quick-card:hover .quick-card-icon-wrap {
          transform: translateY(-2px);
          box-shadow: 0 9px 20px rgba(0, 0, 0, 0.09);
        }

        .welcome-quick-card .quick-card-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .welcome-quick-card .quick-card-label {
          font-size: 0.74rem;
          line-height: 1.25;
        }

        .welcome-view-more-wrap {
          display: flex;
          justify-content: center;
          margin-top: 2rem;
        }

        .welcome-attractions-toolbar {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          width: 100%;
          margin:
            -0.25rem 0 1.05rem;
        }

        .welcome-view-more-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          min-height: 42px;
          padding: 0.65rem 1rem;
          border: 1px solid rgba(45, 49, 149, 0.22);
          border-radius: 999px;
          background: #ffffff;
          color: #2D3195;
          font-size: 0.78rem;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 5px 16px rgba(0, 0, 0, 0.06);
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .welcome-view-more-button:hover {
          color: #2D3195;
          background: #f8f8ff;
          text-decoration: none;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.09);
        }

        /* =====================================================
           ATTRACTIONS
        ===================================================== */

        .welcome-attractions-heading {
          width:
            100%;
          display:
            flex;
          flex-direction:
            column;
          align-items:
            center;
          justify-content:
            center;
          margin-bottom:
            2.35rem;
        }

        .welcome-attractions-title {
          margin:
            0 0 7px;
          padding:
            0;
          color:
            #2D3195 !important;
          font-size:
            1.70rem;
          line-height:
            1;
          letter-spacing:
            0.015em;
          text-align:
            center;
        }

        .welcome-attractions-eyebrow {
          color:
            #555555;
        }

        .welcome-attractions-carousel {
          width: 100%;
          overflow: hidden;
        }

        .welcome-attractions-swiper {
          width: 100%;
          overflow: visible;
          padding:
            0 0 6px;
        }

        .welcome-attraction-slide {
          height: auto;
          display: flex;
          align-items: stretch;
        }

        .welcome-attraction-card-shell {
          width: 100%;
          min-width: 0;
          display: flex;
        }

        .welcome-attraction-card-shell > * {
          width: 100%;
        }

        /* =====================================================
           ACCOMMODATIONS
        ===================================================== */

        .welcome-accommodations-section {
          width:
            100%;
          margin-top:
            85px;
        }

        .welcome-accommodations-heading {
          width:
            100%;
          display:
            flex;
          flex-direction:
            column;
          align-items:
            center;
          justify-content:
            center;
          margin-bottom:
            2.35rem;
        }

        .welcome-accommodations-title {
          margin:
            0 0 7px;
          padding:
            0;
          color:
            #2D3195 !important;
          font-size:
            1.70rem;
          line-height:
            1;
          letter-spacing:
            0.015em;
          text-align:
            center;
        }

        .welcome-accommodations-eyebrow {
          color:
            #555555;
        }

        .welcome-accommodations-toolbar {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          width: 100%;
          margin:
            -0.25rem 0 1.05rem;
        }

        .welcome-view-more-link {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 0;
          border: 0;
          background: transparent;
          color: #2D3195;
          font-size: 0.78rem;
          font-weight: 700;
          text-decoration: none;
          -webkit-tap-highlight-color: transparent;
          transition:
            opacity 0.15s ease,
            transform 0.15s ease;
        }

        .welcome-view-more-link svg {
          transition: transform 0.2s ease;
        }

        .welcome-view-more-link:hover {
          color: #2D3195;
          text-decoration: none;
        }

        .welcome-view-more-link:hover svg {
          transform: translateX(3px);
        }

        .welcome-view-more-link:active {
          opacity: 0.55;
          transform: scale(0.95);
        }

        .welcome-view-more-link:active svg {
          transform: translateX(5px);
        }

        /* =====================================================
           FEATURED VIDEOS
           UI INITIATIVE / SWIPER 3D CAROUSEL
        ===================================================== */

        .welcome-videos-section {
          width:
            100%;
          margin-top:
            90px;
        }

        .welcome-videos-heading {
          width:
            100%;
          display:
            flex;
          flex-direction:
            column;
          align-items:
            center;
          justify-content:
            center;
          margin-bottom:
            2.5rem;
        }

        .welcome-videos-title {
          margin:
            0 0 7px;
          padding:
            0;
          color:
            #2D3195 !important;
          font-size:
            1.70rem;
          line-height:
            1;
          letter-spacing:
            0.015em;
          text-align:
            center;
        }

        .welcome-videos-eyebrow {
          color:
            #555555;
        }

        .welcome-video-carousel {
          position:
            relative;
          width:
            100%;
          min-height:
            545px;
          padding:
            10px 0 65px;
          overflow:
            hidden;
        }

        .welcome-featured-swiper {
          width:
            100%;
          height:
            475px;
          padding:
            28px 0 35px;
          overflow:
            visible !important;
        }

        .welcome-featured-swiper
          .swiper-wrapper {
          align-items:
            center;
        }

        .welcome-featured-swiper-slide {
          width:
            min(
              74%,
              820px
            ) !important;
          height:
            auto;
          display:
            flex;
          align-items:
            center;
          justify-content:
            center;
          transition:
            opacity 0.45s ease,
            filter 0.45s ease;
        }

        .welcome-featured-swiper-slide:not(
            .swiper-slide-active
          ) {
          opacity:
            0.72;
          filter:
            saturate(0.72)
            brightness(0.72);
        }

        .welcome-featured-swiper-slide.swiper-slide-active {
          opacity:
            1;
          filter:
            none;
        }

        .welcome-video-cinematic-card {
          position:
            relative;
          width:
            100%;
          overflow:
            hidden;
          border-radius:
            24px;
          background:
            #10131c;
          box-shadow:
            0 25px 65px
            rgba(
              0,
              0,
              0,
              0.22
            );
          transform:
            translateZ(0);
        }

        .welcome-featured-swiper-slide.swiper-slide-active
          .welcome-video-cinematic-card {
          box-shadow:
            0 32px 80px
            rgba(
              0,
              0,
              0,
              0.30
            );
        }

        .welcome-video-media {
          position:
            relative;
          width:
            100%;
          aspect-ratio:
            16 / 9;
          overflow:
            hidden;
          background:
            #10131c;
        }

        .welcome-video-player {
          width:
            100%;
          height:
            100%;
          display:
            block;
          object-fit:
            cover;
          background:
            #10131c;
        }

        .welcome-video-gradient {
          position:
            absolute;
          inset:
            0;
          pointer-events:
            none;
          background:
            linear-gradient(
              180deg,
              rgba(
                0,
                0,
                0,
                0.04
              ) 20%,
              rgba(
                0,
                0,
                0,
                0.12
              ) 45%,
              rgba(
                0,
                0,
                0,
                0.28
              ) 100%
            );
        }

        .welcome-video-play-badge {
          position:
            absolute;
          top:
            22px;
          left:
            22px;
          width:
            48px;
          height:
            48px;
          display:
            flex;
          align-items:
            center;
          justify-content:
            center;
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.35
            );
          border-radius:
            50%;
          background:
            rgba(
              255,
              255,
              255,
              0.14
            );
          color:
            #ffffff;
          backdrop-filter:
            blur(12px);
          -webkit-backdrop-filter:
            blur(12px);
          box-shadow:
            0 8px 22px
            rgba(
              0,
              0,
              0,
              0.20
            );
          pointer-events:
            none;
        }





        .welcome-video-arrow {
          position:
            absolute;
          z-index:
            30;
          top:
            50%;
          width:
            48px;
          height:
            48px;
          display:
            flex;
          align-items:
            center;
          justify-content:
            center;
          padding:
            0;
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.28
            );
          border-radius:
            50%;
          background:
            rgba(
              255,
              255,
              255,
              0.16
            );
          color:
            #ffffff;
          backdrop-filter:
            blur(12px);
          -webkit-backdrop-filter:
            blur(12px);
          box-shadow:
            0 8px 24px
            rgba(
              0,
              0,
              0,
              0.16
            );
          cursor:
            pointer;
          transform:
            translateY(-50%);
          transition:
            background 0.22s ease,
            color 0.22s ease,
            transform 0.22s ease,
            border-color 0.22s ease;
        }

        .welcome-video-arrow:hover {
          background:
            #ffffff;
          color:
            ${CALBAYOG_BLUE};
          border-color:
            #ffffff;
          transform:
            translateY(-50%)
            scale(
              1.07
            );
        }

        .welcome-video-arrow.swiper-button-disabled {
          opacity:
            0.45;
          cursor:
            default;
        }

        .welcome-video-prev {
          left:
            3%;
        }

        .welcome-video-next {
          right:
            3%;
        }

        .welcome-video-pagination {
          position:
            absolute;
          z-index:
            30;
          left:
            50%;
          bottom:
            13px;
          width:
            auto !important;
          min-height:
            20px;
          transform:
            translateX(-50%);
          display:
            flex;
          align-items:
            center;
          justify-content:
            center;
        }

        .welcome-video-pagination
          .swiper-pagination-bullet {
          width:
            8px;
          height:
            8px;
          margin:
            0 4px !important;
          opacity:
            1;
          border-radius:
            999px;
          background:
            rgba(
              45,
              49,
              149,
              0.22
            );
          transition:
            width 0.3s ease,
            background 0.3s ease,
            transform 0.3s ease;
        }

        .welcome-video-pagination
          .swiper-pagination-bullet-active {
          width:
            27px;
          background:
            ${CALBAYOG_BLUE};
        }

        .welcome-video-loading {
          width:
            100%;
          min-height:
            440px;
          display:
            flex;
          flex-direction:
            column;
          align-items:
            center;
          justify-content:
            center;
          gap:
            16px;
          color:
            #6c757d;
          font-size:
            0.82rem;
        }

        .welcome-video-loading-spinner {
          width:
            42px;
          height:
            42px;
          border:
            3px solid
            rgba(
              45,
              49,
              149,
              0.16
            );
          border-top-color:
            ${CALBAYOG_BLUE};
          border-radius:
            50%;
          animation:
            welcomeVideoSpin
            0.8s linear
            infinite;
        }

        @keyframes welcomeVideoSpin {
          to {
            transform:
              rotate(
                360deg
              );
          }
        }

        .welcome-video-empty {
          width:
            100%;
          min-height:
            360px;
          display:
            flex;
          flex-direction:
            column;
          align-items:
            center;
          justify-content:
            center;
          padding:
            40px 20px;
          border:
            1px dashed
            rgba(
              45,
              49,
              149,
              0.22
            );
          border-radius:
            22px;
          background:
            linear-gradient(
              180deg,
              rgba(
                45,
                49,
                149,
                0.025
              ),
              rgba(
                45,
                49,
                149,
                0.055
              )
            );
          text-align:
            center;
        }

        .welcome-video-empty-icon {
          width:
            58px;
          height:
            58px;
          display:
            flex;
          align-items:
            center;
          justify-content:
            center;
          margin-bottom:
            16px;
          border-radius:
            50%;
          background:
            rgba(
              45,
              49,
              149,
              0.08
            );
          color:
            ${CALBAYOG_BLUE};
        }

        .welcome-video-empty h3 {
          margin:
            0 0 7px;
          color:
            #2D3195;
          font-family:
            "Barabara",
            "Arial Black",
            Arial,
            sans-serif;
          font-size:
            1.4rem;
          font-weight:
            400;
        }

        .welcome-video-empty p {
          max-width:
            430px;
          margin:
            0;
          color:
            #6c757d;
          font-size:
            0.76rem;
          line-height:
            1.6;
        }

        .welcome-video-empty small {
          margin-top:
            10px;
          color:
            #a05a5a;
          font-size:
            0.68rem;
        }

        /* =====================================================
           HERO
        ===================================================== */

        .welcome-hero-section {
          width:
            100%;
        }

        .welcome-hero-slider {
          position:
            relative;
          width:
            100%;
          height:
            390px;
          overflow:
            hidden;
          border-radius:
            24px;
          background:
            #102a23;
          box-shadow:
            0 12px 35px
            rgba(
              0,
              0,
              0,
              0.10
            );
          cursor:
            grab;
          user-select:
            none;
          touch-action:
            pan-y;
        }

        .welcome-hero-slider:active {
          cursor:
            grabbing;
        }

        .welcome-hero-image {
          position:
            absolute;
          inset:
            0;
          width:
            100%;
          height:
            100%;
          object-fit:
            cover;
          object-position:
            center;
          display:
            block;
          pointer-events:
            none;
          animation:
            welcomeHeroImageFade
            0.65s
            ease;
        }

        @keyframes welcomeHeroImageFade {
          from {
            opacity:
              0.45;
            transform:
              scale(
                1.035
              );
          }

          to {
            opacity:
              1;
            transform:
              scale(
                1
              );
          }
        }

        .welcome-hero-overlay {
          position:
            absolute;
          inset:
            0;
          pointer-events:
            none;
          background:
            linear-gradient(
              90deg,
              rgba(
                0,
                0,
                0,
                0.68
              ) 0%,
              rgba(
                0,
                0,
                0,
                0.52
              ) 25%,
              rgba(
                0,
                0,
                0,
                0.25
              ) 52%,
              rgba(
                0,
                0,
                0,
                0.06
              ) 100%
            ),
            linear-gradient(
              180deg,
              rgba(
                0,
                0,
                0,
                0.22
              ) 0%,
              rgba(
                0,
                0,
                0,
                0.02
              ) 50%,
              rgba(
                0,
                0,
                0,
                0.24
              ) 100%
            );
        }

        .welcome-hero-content {
          position:
            absolute;
          z-index:
            5;
          left:
            7%;
          top:
            50%;
          transform:
            translateY(-50%);
          display:
            flex;
          flex-direction:
            column;
          align-items:
            flex-start;
          color:
            #ffffff;
          max-width:
            620px;
        }

        .welcome-hero-title {
          margin:
            0 0 20px;
          padding:
            0;
          color:
            #ffffff;
          font-size:
            clamp(
              2.6rem,
              4.5vw,
              4rem
            );
          line-height:
            0.9;
          letter-spacing:
            0;
          text-shadow:
            0 3px 12px
            rgba(
              0,
              0,
              0,
              0.24
            );
          white-space:
            nowrap;
        }

        .welcome-hero-detail {
          display:
            flex;
          align-items:
            center;
          gap:
            12px;
          margin-bottom:
            10px;
          color:
            #ffffff;
          font-size:
            clamp(
              0.92rem,
              1.65vw,
              1.25rem
            );
          font-weight:
            400;
          line-height:
            1.4;
          text-shadow:
            0 2px 8px
            rgba(
              0,
              0,
              0,
              0.40
            );
        }

        .welcome-hero-detail:last-child {
          margin-bottom:
            0;
        }

        .welcome-hero-detail-icon {
          width:
            27px;
          min-width:
            27px;
          height:
            27px;
          display:
            inline-flex;
          align-items:
            center;
          justify-content:
            center;
          color:
            #ffffff;
          flex-shrink:
            0;
          line-height:
            1;
          filter:
            drop-shadow(
              0 2px 5px
              rgba(
                0,
                0,
                0,
                0.30
              )
            );
        }

        .welcome-hero-detail-icon svg {
          display:
            block;
          color:
            #ffffff;
        }

        .welcome-hero-arrow {
          position:
            absolute;
          z-index:
            10;
          top:
            50%;
          transform:
            translateY(-50%);
          width:
            44px;
          height:
            44px;
          display:
            flex;
          align-items:
            center;
          justify-content:
            center;
          padding:
            0;
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.22
            );
          border-radius:
            50%;
          background:
            rgba(
              255,
              255,
              255,
              0.16
            );
          color:
            #ffffff;
          font-size:
            32px;
          font-family:
            Arial,
            sans-serif;
          font-weight:
            300;
          line-height:
            1;
          backdrop-filter:
            blur(10px);
          -webkit-backdrop-filter:
            blur(10px);
          box-shadow:
            0 5px 15px
            rgba(
              0,
              0,
              0,
              0.12
            );
          cursor:
            pointer;
          transition:
            background 0.2s ease,
            color 0.2s ease,
            transform 0.2s ease,
            border-color 0.2s ease;
        }

        .welcome-hero-arrow:hover {
          background:
            rgba(
              255,
              255,
              255,
              0.90
            );
          color:
            #2D3195;
          border-color:
            rgba(
              255,
              255,
              255,
              0.95
            );
          transform:
            translateY(-50%)
            scale(
              1.06
            );
        }

        .welcome-hero-arrow-left {
          left:
            16px;
        }

        .welcome-hero-arrow-right {
          right:
            16px;
        }

        .welcome-hero-dots {
          position:
            absolute;
          z-index:
            10;
          left:
            50%;
          bottom:
            17px;
          transform:
            translateX(-50%);
          display:
            flex;
          align-items:
            center;
          gap:
            8px;
        }

        .welcome-hero-dot {
          width:
            8px;
          height:
            8px;
          padding:
            0;
          border:
            0;
          border-radius:
            50%;
          background:
            rgba(
              255,
              255,
              255,
              0.68
            );
          cursor:
            pointer;
          transition:
            width 0.25s ease,
            background 0.25s ease,
            transform 0.25s ease;
        }

        .welcome-hero-dot:hover {
          transform:
            scale(
              1.15
            );
        }

        .welcome-hero-dot.active {
          width:
            24px;
          border-radius:
            999px;
          background:
            #2D3195;
          box-shadow:
            0 0 8px
            rgba(
              45,
              49,
              149,
              0.45
            );
        }

        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 767px) {
          .welcome-explore-top {
            grid-template-columns: 1fr;
            gap: 26px;
          }

          .welcome-map-shell,
          .welcome-map-loading {
            height: 360px;
          }
        }

        @media (max-width: 991.98px) {
          .welcome-container {
            padding-left: 18px;
            padding-right: 18px;
          }
          .welcome-hero-slider {
            height:
              370px;
            border-radius:
              22px;
          }

          .welcome-hero-content {
            left:
              6%;
          }

          .welcome-hero-title {
            font-size:
              clamp(
                2.5rem,
                5.5vw,
                3.6rem
              );
            margin-bottom:
              18px;
          }

          .welcome-hero-detail {
            font-size:
              1rem;
            gap:
              10px;
            margin-bottom:
              9px;
          }

          .welcome-hero-arrow {
            width:
              42px;
            height:
              42px;
          }

          .welcome-intro {
            margin-bottom:
              28px;
          }

          .welcome-intro-text {
            font-size:
              0.76rem;
          }

          .welcome-bunting {
            height:
              29px;
            margin-bottom:
              23px;
          }

          .bunting-flag {
            width:
              40px;
            height:
              29px;
            flex-basis:
              40px;
          }

          .welcome-section-heading {
            margin-bottom:
              2.4rem;
          }

          .welcome-main-heading {
            margin-bottom:
              6px;
          }

          .welcome-explore-mobile-bunting {
            margin-bottom: 14px;
          }

          .welcome-quick-grid {
            row-gap:
              38px;
          }

          .welcome-accommodations-section {
            margin-top:
              75px;
          }

          .welcome-videos-section {
            margin-top:
              75px;
          }

          .welcome-video-carousel {
            min-height:
              475px;
          }

          .welcome-featured-swiper {
            height:
              410px;
          }

          .welcome-featured-swiper-slide {
            width:
              84% !important;
          }
        }

        @media (max-width: 767.98px) {
          .welcome-container {
            padding-left: 15px;
            padding-right: 15px;
          }
          .welcome-hero-slider {
            height:
              250px;
            border-radius:
              20px;
          }

          .welcome-hero-image {
            object-position:
              center center;
          }

          .welcome-hero-overlay {
            background:
              linear-gradient(
                180deg,
                rgba(
                  0,
                  0,
                  0,
                  0.32
                ) 0%,
                rgba(
                  0,
                  0,
                  0,
                  0.14
                ) 28%,
                rgba(
                  0,
                  0,
                  0,
                  0.68
                ) 100%
              );
          }

          .welcome-hero-content {
            left:
              24px;
            right:
              24px;
            top:
              auto;
            bottom:
              38px;
            transform:
              none;
            max-width:
              none;
          }

          .welcome-hero-title {
            font-size:
              2.15rem;
            margin-bottom:
              13px;
          }

          .welcome-hero-detail {
            font-size:
              0.82rem;
            gap:
              8px;
            margin-bottom:
              6px;
          }

          .welcome-hero-detail-icon {
            width:
              24px;
            min-width:
              24px;
            height:
              24px;
          }

          .welcome-hero-detail-icon svg {
            width:
              21px;
            height:
              21px;
          }

          .welcome-hero-arrow {
            width:
              38px;
            height:
              38px;
            font-size:
              28px;
          }

          .welcome-hero-arrow-left {
            left:
              10px;
          }

          .welcome-hero-arrow-right {
            right:
              10px;
          }

          .welcome-hero-dots {
            bottom:
              16px;
          }

          .welcome-intro {
            max-width:
              560px;
            margin-bottom:
              27px;
            padding:
              0 8px;
          }

          .welcome-intro-eyebrow {
            font-size:
              0.56rem;
            letter-spacing:
              0.16em;
          }

          .welcome-intro-text {
            max-width:
              470px;
            font-size:
              0.68rem;
            line-height:
              1.65;
            margin-top:
              9px;
          }

          .welcome-section-heading {
            margin-bottom:
              2rem;
          }

          .welcome-bunting {
            display: none;
          }

          .welcome-explore-mobile-bunting,
          .welcome-mobile-bunting {
            width: min(88%, 300px);
            height: 16px;
            margin: 0 auto 14px;
            padding: 0;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            overflow: hidden;
          }

          .bunting-flag {
            width:
              auto;
            height:
              16px;
            flex:
              1 1 0;
            min-width:
              0;
          }

          .welcome-mobile-bunting {
            width: min(88%, 300px);
            height: 16px;
            margin: 0 auto 14px;
            padding: 0;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            overflow: hidden;
          }

          .welcome-explore-mobile-bunting .bunting-flag,
          .welcome-mobile-bunting .bunting-flag {
            width: auto;
            height: 16px;
            flex: 1 1 0;
            min-width: 0;
          }

          .welcome-section-eyebrow {
            gap:
              9px;
            font-size:
              0.58rem;
            letter-spacing:
              0.11em;
          }

          .welcome-heading-line {
            width:
              24px;
          }

          .welcome-display-title,
          .welcome-attractions-title,
          .welcome-accommodations-title,
          .welcome-videos-title {
            font-size:
              1.45rem;
          }

          .welcome-main-heading {
            margin-bottom:
              6px;
          }

          .welcome-quick-grid {
            row-gap:
              32px;
          }

          .welcome-quick-card .quick-card-icon-wrap {
            width: 48px;
            height: 48px;
            margin-bottom: 8px;
            border-radius: 15px;
          }

          .welcome-quick-card .quick-card-label {
            font-size: 0.67rem;
          }

          .welcome-view-more-wrap {
            margin-top: 1.6rem;
          }

          .welcome-view-more-button {
            min-height: 40px;
            padding: 0.58rem 0.9rem;
            font-size: 0.72rem;
          }

          .welcome-view-more-link {
            font-size: 0.72rem;
          }

          .welcome-explore-section,
          .welcome-discover-section,
          .welcome-accommodations-section {
            margin-bottom:
              86px !important;
          }

          .welcome-attractions-heading {
            margin-bottom:
              1.8rem;
          }

          .welcome-attractions-carousel {
            margin-top:
              0;
          }

          .welcome-attractions-swiper {
            padding-bottom:
              4px;
            touch-action:
              pan-y;
          }

          .welcome-attraction-slide {
            min-width:
              0;
          }

          .welcome-attractions-toolbar,
          .welcome-accommodations-toolbar {
            margin:
              -0.15rem 0 0.9rem;
          }

          .welcome-accommodations-section {
            margin-top:
              65px;
          }

          .welcome-videos-title {
            font-size:
              1.70rem;
          }

          .welcome-accommodations-heading,
          .welcome-videos-heading {
            margin-bottom:
              1.8rem;
          }

          .welcome-videos-section {
            margin-top:
              65px;
          }

          /* VIDEO CAROUSEL MOBILE */

          .welcome-video-carousel {
            min-height:
              365px;
            padding:
              5px 0 55px;
          }

          .welcome-featured-swiper {
            height:
              320px;
            padding:
              20px 0 25px;
          }

          .welcome-featured-swiper-slide {
            width:
              88% !important;
          }

          .welcome-video-cinematic-card {
            border-radius:
              19px;
          }

          .welcome-video-play-badge {
            top:
              15px;
            left:
              15px;
            width:
              40px;
            height:
              40px;
          }

          .welcome-video-arrow {
            width:
              38px;
            height:
              38px;
          }

          .welcome-video-prev {
            left:
              7px;
          }

          .welcome-video-next {
            right:
              7px;
          }

          .welcome-video-pagination {
            bottom:
              10px;
          }
        }

        @media (max-width: 480px) {
          .welcome-container {
            padding-left: 12px;
            padding-right: 12px;
          }
          .welcome-hero-slider {
            height:
              220px;
            border-radius:
              18px;
          }

          .welcome-hero-content {
            left:
              18px;
            right:
              18px;
            bottom:
              31px;
          }

          .welcome-hero-title {
            font-size:
              1.60rem;
            margin-bottom:
              9px;
          }

          .welcome-hero-detail {
            font-size:
              0.68rem;
            gap:
              7px;
            margin-bottom:
              5px;
          }

          .welcome-hero-detail-icon {
            width:
              21px;
            min-width:
              21px;
            height:
              21px;
          }

          .welcome-hero-detail-icon svg {
            width:
              19px;
            height:
              19px;
          }

          .welcome-hero-arrow {
            width:
              34px;
            height:
              34px;
            font-size:
              24px;
          }

          .welcome-hero-arrow-left {
            left:
              8px;
          }

          .welcome-hero-arrow-right {
            right:
              8px;
          }

          .welcome-intro {
            margin-bottom:
              24px;
            padding:
              0 5px;
          }

          .welcome-intro-eyebrow {
            font-size:
              0.51rem;
            letter-spacing:
              0.14em;
          }

          .welcome-intro-text {
            font-size:
              0.62rem;
            line-height:
              1.6;
            margin-top:
              8px;
          }

          .welcome-bunting {
            display: none;
          }

          .bunting-flag {
            width:
              auto;
            height:
              16px;
            flex:
              1 1 0;
            min-width:
              0;
          }

          .welcome-explore-mobile-bunting,
          .welcome-mobile-bunting {
            width: min(88%, 300px);
            height: 16px;
            margin: 0 auto 14px;
          }

          .welcome-explore-mobile-bunting .bunting-flag,
          .welcome-mobile-bunting .bunting-flag {
            height: 16px;
          }

          .welcome-section-eyebrow {
            gap:
              7px;
            font-size:
              0.52rem;
            letter-spacing:
              0.09em;
          }

          .welcome-heading-line {
            width:
              18px;
          }

          .welcome-display-title,
          .welcome-attractions-title,
          .welcome-accommodations-title,
          .welcome-videos-title {
            font-size:
              1.45rem;
          }

          .welcome-main-heading {
            margin-bottom:
              5px;
          }

          .welcome-explore-mobile-bunting {
            margin-bottom: 12px;
          }

          .welcome-quick-grid {
            row-gap:
              38px;
          }

          .welcome-explore-section,
          .welcome-discover-section,
          .welcome-accommodations-section {
            margin-bottom:
              78px !important;
          }

          .welcome-attractions-heading {
            margin-bottom:
              1.65rem;
          }

          .welcome-accommodations-section {
            margin-top:
              55px;
          }

          .welcome-videos-title {
            font-size:
              1.70rem;
          }

          .welcome-accommodations-heading,
          .welcome-videos-heading {
            margin-bottom:
              1.55rem;
          }

          .welcome-videos-section {
            margin-top:
              55px;
          }

          .welcome-video-carousel {
            min-height:
              325px;
          }

          .welcome-featured-swiper {
            height:
              285px;
            padding:
              12px 0 18px;
          }

          .welcome-featured-swiper-slide {
            width:
              91% !important;
          }

          .welcome-video-cinematic-card {
            border-radius:
              17px;
          }

          .welcome-video-arrow {
            width:
              34px;
            height:
              34px;
          }

          .welcome-video-play-badge {
            width:
              36px;
            height:
              36px;
          }
        }

        @media (max-width: 380px) {
          .welcome-intro-eyebrow {
            font-size:
              0.48rem;
          }

          .welcome-quick-card .quick-card-icon-wrap {
            width: 44px;
            height: 44px;
            border-radius: 14px;
          }

          .welcome-quick-card .quick-card-label {
            font-size: 0.62rem;
          }

          .welcome-intro-text {
            font-size:
              0.59rem;
          }

          .welcome-bunting {
            display: none;
          }

          .bunting-flag {
            width:
              auto;
            height:
              15px;
            flex:
              1 1 0;
            min-width:
              0;
          }

          .welcome-display-title,
          .welcome-attractions-title,
          .welcome-videos-title {
            font-size:
              1.45rem;
          }

          .welcome-explore-mobile-bunting,
          .welcome-mobile-bunting {
            width: min(90%, 280px);
            height: 15px;
            margin: 0 auto 12px;
          }

          .welcome-explore-mobile-bunting .bunting-flag,
          .welcome-mobile-bunting .bunting-flag {
            height: 15px;
          }

          .welcome-section-eyebrow {
            font-size:
              0.49rem;
            gap:
              6px;
          }

          .welcome-attractions-toolbar,
          .welcome-accommodations-toolbar {
            margin-bottom:
              0.8rem;
          }

          .welcome-heading-line {
            width:
              15px;
          }

          .welcome-display-title,
          .welcome-attractions-title,
          .welcome-accommodations-title,
          .welcome-videos-title {
            font-size:
              1.30rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Welcome;
