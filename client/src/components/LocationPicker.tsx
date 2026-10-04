import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import {
  CheckCircle2,
  Crosshair,
  LoaderCircle,
  Map as MapIcon,
  MapPin,
  Navigation,
  Satellite,
  Search,
  X,
} from "lucide-react";
import "leaflet/dist/leaflet.css";

const BRAND_BLUE = "#2D3195";
const DEFAULT_LATITUDE = 12.0668;
const DEFAULT_LONGITUDE = 124.6041;

/*
 * Nearby places are requested through the application backend.
 * The backend communicates with OpenStreetMap's Overpass services.
 * This avoids browser-side Overpass CORS errors.
 */
const MAP_PLACES_API_URL =
  "https://calbayog-city-tourism.onrender.com/api/map/places";

type MapLayer = "street" | "satellite" | "terrain";

interface SearchablePlace {
  id?: string;
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface LocationPickerProps {
  name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  category?: string | null;
  attractionType?: string | null;
  searchablePlaces?: SearchablePlace[];
  onChange: (location: {
    latitude: number;
    longitude: number;
    address?: string;
  }) => void;
}

interface SearchResult {
  id?: string;
  name?: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  lat?: string | number;
  lon?: string | number;
  display_name?: string;
  source?: "local" | "search";
  [key: string]: unknown;
}

interface OpenStreetMapPlace {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  address: string;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
}

interface MapPlacesResponse {
  success?: boolean;
  elements?: OverpassElement[];
  message?: string;
  code?: string;
}

const CATEGORY_MARKER_DESIGNS: Record<
  string,
  { color: string; icon: string }
> = {
  Nature: { color: "#16845B", icon: "🌿" },
  "History and Culture": { color: "#A66A3F", icon: "🏛️" },
  "Industrial Tourism": { color: "#526477", icon: "🏭" },
  Shopping: { color: "#D9468F", icon: "🛍️" },
  Other: { color: BRAND_BLUE, icon: "📍" },
};

const SUBCATEGORY_MARKER_ICONS: Record<string, string> = {
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

const normalize = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

const createAttractionMarkerIcon = (
  markerCategory?: string | null,
  markerType?: string | null,
) => {
  const design =
    CATEGORY_MARKER_DESIGNS[String(markerCategory ?? "").trim()] ||
    CATEGORY_MARKER_DESIGNS.Other;

  const glyph =
    SUBCATEGORY_MARKER_ICONS[normalize(markerType)] || design.icon;

  return L.divIcon({
    className: "calbayog-location-marker",
    html: `
      <div class="calbayog-marker-shell">
        <div class="calbayog-marker-pin" style="background:${design.color}"></div>
        <div class="calbayog-marker-icon">${glyph}</div>
      </div>
    `,
    iconSize: [44, 52],
    iconAnchor: [22, 49],
    popupAnchor: [0, -47],
    tooltipAnchor: [0, -43],
  });
};

const createAccommodationMarkerIcon = () =>
  L.divIcon({
    className: "calbayog-accommodation-marker",
    html: `
      <div
        aria-label="Hotels and Resorts"
        style="
          position:relative;
          width:44px;
          height:52px;
          display:flex;
          align-items:flex-start;
          justify-content:center;
          filter:drop-shadow(0 3px 4px rgba(15,23,42,.30));
        "
      >
        <div
          style="
            position:absolute;
            top:0;
            left:3px;
            width:38px;
            height:38px;
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            background:#2563EB;
            border:3px solid #fff;
            box-shadow:0 1px 2px rgba(15,23,42,.18);
          "
        ></div>
        <div
          style="
            position:absolute;
            top:7px;
            left:10px;
            width:24px;
            height:24px;
            border-radius:50%;
            background:#fff;
            display:flex;
            align-items:center;
            justify-content:center;
            z-index:2;
          "
        >
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

const mappedPlaceIcon = L.divIcon({
  className: "calbayog-osm-place-marker",
  html: `<div class="calbayog-osm-place-marker-inner">✦</div>`,
  iconSize: [29, 29],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

const tileLayers: Record<
  MapLayer,
  { url: string; attribution: string }
> = {
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
  terrain: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style &copy; OpenTopoMap',
  },
};

const SATELLITE_LABELS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";

const SATELLITE_ROADS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}";

function getMappedPlaceCategory(tags: Record<string, string>) {
  if (tags.tourism) return `Tourism · ${tags.tourism.replace(/_/g, " ")}`;
  if (tags.historic) return `Historic · ${tags.historic.replace(/_/g, " ")}`;
  if (tags.natural) return `Natural feature · ${tags.natural.replace(/_/g, " ")}`;
  if (tags.leisure) return `Leisure · ${tags.leisure.replace(/_/g, " ")}`;
  if (tags.amenity) return `Amenity · ${tags.amenity.replace(/_/g, " ")}`;
  if (tags.shop) return `Shop · ${tags.shop.replace(/_/g, " ")}`;
  if (tags.place) return `Place · ${tags.place.replace(/_/g, " ")}`;
  return "Mapped place";
}

/*
 * Fetch nearby OpenStreetMap places through the Render backend.
 *
 * The backend handles communication with the Overpass providers.
 * This function does not call public Overpass endpoints from the browser.
 */
async function fetchOverpassPlaces(
  query: string,
  signal: AbortSignal,
): Promise<OverpassElement[]> {
  if (signal.aborted) {
    throw new DOMException("Request cancelled.", "AbortError");
  }

  const response = await fetch(MAP_PLACES_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query }),
    signal,
  });

  let data: MapPlacesResponse;

  try {
    data = (await response.json()) as MapPlacesResponse;
  } catch {
    throw new Error(
      "The map service returned an invalid response. Please try again.",
    );
  }

  if (!response.ok || data.success !== true) {
    if (
      response.status === 502 ||
      data.code === "OVERPASS_UNAVAILABLE"
    ) {
      throw new Error(
        "Nearby places are temporarily unavailable. You can still search for a location or place the pin manually.",
      );
    }

    if (response.status === 429) {
      throw new Error(
        "Too many map requests. Please wait a moment and try again.",
      );
    }

    if (response.status === 404) {
      throw new Error(
        "The nearby-places API endpoint was not found. Check the Render backend route.",
      );
    }

    if (response.status >= 500) {
      throw new Error(
        data.message ||
          "The map server is temporarily unavailable. Please try again later.",
      );
    }

    throw new Error(
      data.message ||
        `The map service returned HTTP ${response.status}.`,
    );
  }

  if (!Array.isArray(data.elements)) {
    throw new Error(
      "The map service returned an unexpected data format.",
    );
  }

  return data.elements;
}

function MapClickHandler({
  onLocationChange,
}: {
  onLocationChange: (latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click(event) {
      onLocationChange(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function MapCenter({
  latitude,
  longitude,
  zoom,
}: {
  latitude: number;
  longitude: number;
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([latitude, longitude], zoom, { duration: 0.65 });
  }, [map, latitude, longitude, zoom]);

  return null;
}

function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const first = window.setTimeout(() => map.invalidateSize(), 100);
    const second = window.setTimeout(() => map.invalidateSize(), 350);

    return () => {
      window.clearTimeout(first);
      window.clearTimeout(second);
    };
  }, [map]);

  return null;
}

async function geocodeLocation(query: string): Promise<SearchResult[]> {
  const cleanedQuery = query.trim();
  if (!cleanedQuery) return [];

  const url =
    "https://nominatim.openstreetmap.org/search" +
    `?format=jsonv2&limit=6&addressdetails=1&q=${encodeURIComponent(
      `${cleanedQuery}, Calbayog City, Samar, Philippines`,
    )}`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("The location service could not complete the search.");
  }

  const results: SearchResult[] = await response.json();

  return Array.isArray(results)
    ? results.map((result) => ({
        ...result,
        source: "search" as const,
      }))
    : [];
}

function OpenStreetMapPlaces({
  enabled,
  onSelect,
}: {
  enabled: boolean;
  onSelect: (place: OpenStreetMapPlace) => void;
}) {
  const map = useMap();
  const [places, setPlaces] = useState<OpenStreetMapPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadMessage, setLoadMessage] = useState("");

  const lastBoundsKey = useRef("");
  const lastRequestAt = useRef(0);
  const requestTimer = useRef<number | null>(null);
  const activeController = useRef<AbortController | null>(null);

  const loadPlaces = useCallback(async () => {
    if (!enabled) return;

    if (map.getZoom() < 12) {
      setPlaces([]);
      setLoadMessage("Zoom in to see nearby mapped places.");
      return;
    }

    const bounds = map.getBounds();
    const south = Math.max(-90, bounds.getSouth());
    const west = Math.max(-180, bounds.getWest());
    const north = Math.min(90, bounds.getNorth());
    const east = Math.min(180, bounds.getEast());

    if (north - south > 0.45 || east - west > 0.45) {
      setLoadMessage("Zoom in a little more to load nearby mapped places.");
      return;
    }

    const round = (value: number) => value.toFixed(4);
    const boundsKey = [south, west, north, east].map(round).join(",");

    if (boundsKey === lastBoundsKey.current) return;

    const elapsed = Date.now() - lastRequestAt.current;

    if (elapsed < 8000) {
      if (requestTimer.current !== null) {
        window.clearTimeout(requestTimer.current);
      }

      requestTimer.current = window.setTimeout(() => {
        requestTimer.current = null;
        void loadPlaces();
      }, 8000 - elapsed);

      return;
    }

    activeController.current?.abort();

    const controller = new AbortController();
    activeController.current = controller;
    lastRequestAt.current = Date.now();

    setLoading(true);
    setLoadMessage("Loading nearby mapped places…");

    const bbox =
      `${round(south)},${round(west)},` +
      `${round(north)},${round(east)}`;

    const query = `
      [out:json][timeout:20];
      (
        node["name"]["tourism"](${bbox});
        way["name"]["tourism"](${bbox});

        node["name"]["historic"](${bbox});
        way["name"]["historic"](${bbox});

        node["name"]["natural"](${bbox});
        way["name"]["natural"](${bbox});

        node["name"]["leisure"](${bbox});
        way["name"]["leisure"](${bbox});

        node["name"]["amenity"](${bbox});
        way["name"]["amenity"](${bbox});

        node["name"]["shop"](${bbox});
        way["name"]["shop"](${bbox});

        node["name"]["place"](${bbox});
        way["name"]["place"](${bbox});
      );
      out center tags;
    `;

    try {
      const elements = await fetchOverpassPlaces(
        query,
        controller.signal,
      );

      const mappedPlaces = elements
        .map((element): OpenStreetMapPlace | null => {
          const latitude = Number(element.lat ?? element.center?.lat);
          const longitude = Number(element.lon ?? element.center?.lon);
          const tags = element.tags || {};

          const placeName = String(
            tags.name || tags["name:en"] || "",
          ).trim();

          if (
            !placeName ||
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            Math.abs(latitude) > 90 ||
            Math.abs(longitude) > 180
          ) {
            return null;
          }

          const address = [
            tags["addr:street"],
            tags["addr:suburb"],
            tags["addr:city"],
            tags["addr:province"],
          ]
            .filter(Boolean)
            .join(", ");

          return {
            id: `${element.type}-${element.id}`,
            name: placeName,
            latitude,
            longitude,
            category: getMappedPlaceCategory(tags),
            address,
          };
        })
        .filter(
          (place): place is OpenStreetMapPlace => place !== null,
        );

      const unique = new Map<string, OpenStreetMapPlace>();

      for (const place of mappedPlaces) {
        const key =
          `${normalize(place.name)}|` +
          `${place.latitude.toFixed(5)}|${place.longitude.toFixed(5)}`;

        if (!unique.has(key)) unique.set(key, place);
      }

      const results = Array.from(unique.values()).slice(0, 100);

      if (controller.signal.aborted) return;

      setPlaces(results);
      lastBoundsKey.current = boundsKey;

      setLoadMessage(
        results.length > 0
          ? `${results.length} nearby mapped places loaded.`
          : "No named places were found in this area. Try moving the map or searching for a place.",
      );
    } catch (error) {
      if (controller.signal.aborted) return;

      console.error("Could not load nearby mapped places:", error);

      setLoadMessage(
        error instanceof Error
          ? `Nearby places could not be loaded: ${error.message}`
          : "Nearby places could not be loaded. You can still search or place the attraction pin manually.",
      );
    } finally {
      if (activeController.current === controller) {
        activeController.current = null;
        setLoading(false);
      }
    }
  }, [enabled, map]);

  useEffect(() => {
    if (!enabled) {
      setPlaces([]);
      setLoadMessage("");
      activeController.current?.abort();
      lastBoundsKey.current = "";

      if (requestTimer.current !== null) {
        window.clearTimeout(requestTimer.current);
        requestTimer.current = null;
      }

      setLoading(false);
      return;
    }

    const initialTimer = window.setTimeout(() => {
      void loadPlaces();
    }, 500);

    const onMapChange = () => {
      if (requestTimer.current !== null) {
        window.clearTimeout(requestTimer.current);
      }

      requestTimer.current = window.setTimeout(() => {
        requestTimer.current = null;
        void loadPlaces();
      }, 800);
    };

    map.on("moveend zoomend", onMapChange);

    return () => {
      window.clearTimeout(initialTimer);

      if (requestTimer.current !== null) {
        window.clearTimeout(requestTimer.current);
        requestTimer.current = null;
      }

      map.off("moveend zoomend", onMapChange);
      activeController.current?.abort();
    };
  }, [enabled, loadPlaces, map]);

  if (!enabled) return null;

  return (
    <>
      {places.map((place) => (
        <Marker
          key={place.id}
          position={[place.latitude, place.longitude]}
          icon={mappedPlaceIcon}
          zIndexOffset={-100}
        >
          <Popup>
            <div className="calbayog-location-popup">
              <strong>{place.name}</strong>
              <span>{place.category}</span>
              {place.address && <span>{place.address}</span>}
              <span className="calbayog-osm-credit">
                Place data from OpenStreetMap
              </span>
              <button
                type="button"
                className="calbayog-use-place-button"
                onClick={() => onSelect(place)}
              >
                Use this location
              </button>
            </div>
          </Popup>
        </Marker>
      ))}

      {loading && (
        <div className="calbayog-map-status">
          <LoaderCircle size={14} className="calbayog-spin" />
          Loading nearby places…
        </div>
      )}

      {!loading && loadMessage && (
        <div className="calbayog-map-status" role="status">
          {loadMessage}
        </div>
      )}
    </>
  );
}

export default function LocationPicker({
  name,
  latitude,
  longitude,
  address,
  category,
  attractionType,
  searchablePlaces = [],
  onChange,
}: LocationPickerProps) {
  const validInitialCoordinates =
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180 &&
    !(latitude === 0 && longitude === 0);

  const [position, setPosition] = useState<[number, number]>(
    validInitialCoordinates
      ? [latitude as number, longitude as number]
      : [DEFAULT_LATITUDE, DEFAULT_LONGITUDE],
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");
  const [layer, setLayer] = useState<MapLayer>("street");
  const [showMappedPlaces, setShowMappedPlaces] = useState(true);
  const [mapZoom, setMapZoom] = useState(
    validInitialCoordinates ? 17 : 13,
  );
  const [selectedPlaceName, setSelectedPlaceName] = useState(name || "");
  const [selectedPlaceAddress, setSelectedPlaceAddress] = useState(
    address || "",
  );

  useEffect(() => {
    if (
      typeof latitude === "number" &&
      typeof longitude === "number" &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      Math.abs(latitude) <= 90 &&
      Math.abs(longitude) <= 180 &&
      !(latitude === 0 && longitude === 0)
    ) {
      setPosition([latitude, longitude]);
      setMapZoom(17);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    setSelectedPlaceAddress(address || "");
  }, [address]);

  useEffect(() => {
    if (name?.trim()) setSelectedPlaceName(name.trim());
  }, [name]);

  const localMatches = useMemo(() => {
    const query = normalize(searchTerm);
    if (!query) return [];

    const tokens = query.split(/\s+/).filter(Boolean);

    return searchablePlaces
      .filter((place) => {
        const searchableText = normalize(
          [place.name, place.address].filter(Boolean).join(" "),
        );

        return tokens.every((token) => searchableText.includes(token));
      })
      .slice(0, 8)
      .map((place) => ({
        // IMPORTANT: local saved attractions are used only as a name/address
        // fallback. Their saved latitude/longitude are intentionally NOT
        // returned as search-result coordinates. This prevents an old or
        // inaccurate database pin from competing with the real map result.
        id: place.id,
        name: place.name,
        address: place.address,
        source: "local" as const,
        display_name: [place.name, place.address]
          .filter(Boolean)
          .join(" — "),
      }));
  }, [searchTerm, searchablePlaces]);

  const handleLocationChange = useCallback(
    (
      lat: number,
      lng: number,
      selectedAddress?: string,
      selectedName?: string,
    ) => {
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        Math.abs(lat) > 90 ||
        Math.abs(lng) > 180 ||
        (lat === 0 && lng === 0)
      ) {
        setSearchMessage(
          "This result does not have valid map coordinates. Try another result or adjust the pin manually.",
        );
        return;
      }

      setPosition([lat, lng]);
      setMapZoom(17);

      if (selectedAddress) setSelectedPlaceAddress(selectedAddress);
      if (selectedName) setSelectedPlaceName(selectedName);

      onChange({
        latitude: lat,
        longitude: lng,
        ...(selectedAddress ? { address: selectedAddress } : {}),
      });
    },
    [onChange],
  );

  const searchLocation = async () => {
    const query = searchTerm.trim();

    if (!query) {
      setSearchResults([]);
      setSearchMessage("Enter an attraction name or address to search.");
      return;
    }

    setSearching(true);
    setSearchMessage("");

    const localResults: SearchResult[] = localMatches.map((place) => ({
      ...place,
      // Never allow saved DB coordinates to become search-result coordinates.
      latitude: undefined,
      longitude: undefined,
      lat: undefined,
      lon: undefined,
    }));

    const validCoordinateResult = (result: SearchResult) => {
      const lat = Number(result.latitude ?? result.lat);
      const lng = Number(result.longitude ?? result.lon);

      return (
        (result.latitude != null || result.lat != null) &&
        (result.longitude != null || result.lon != null) &&
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        Math.abs(lat) <= 90 &&
        Math.abs(lng) <= 180 &&
        !(lat === 0 && lng === 0)
      );
    };

    const scoreMapResult = (result: SearchResult, requestedName: string) => {
      const queryText = normalize(requestedName);
      const resultName = normalize(result.name);
      const displayText = normalize(result.display_name);
      const addressText = normalize(result.address);
      const attractionName = normalize(name);

      let score = 0;

      if (resultName && queryText && resultName === queryText) score += 100;
      if (resultName && attractionName && resultName === attractionName) score += 100;
      if (attractionName && displayText.includes(attractionName)) score += 55;
      if (queryText && displayText.includes(queryText)) score += 45;
      if (attractionName && addressText.includes(attractionName)) score += 25;
      if (resultName && queryText && queryText.includes(resultName)) score += 20;

      return score;
    };

    try {
      // 1. Always ask the actual map provider first.
      let externalResults = await geocodeLocation(query);
      let usableExternalResults = externalResults.filter(validCoordinateResult);

      // 2. If searching by attraction name does not produce a strong place
      // match, use the saved ADDRESS as the fallback query. This keeps the
      // address useful without trusting the saved DB coordinates.
      const ranked = usableExternalResults
        .map((result) => ({
          result,
          score: scoreMapResult(result, query),
        }))
        .sort((a, b) => b.score - a.score);

      const strongMatch = ranked.length > 0 && ranked[0].score >= 45;

      if (!strongMatch && localResults.length > 0) {
        const addressFallback = localResults.find((place) =>
          Boolean(String(place.address || "").trim()),
        );

        if (addressFallback?.address) {
          const addressResults = await geocodeLocation(
            String(addressFallback.address),
          );

          if (addressResults.length > 0) {
            externalResults = addressResults;
            usableExternalResults = addressResults.filter(validCoordinateResult);
          }
        }
      }

      // 3. Show only map-provider results. Saved DB attractions are never
      // shown as competing coordinate pins.
      const seen = new Set<string>();
      const uniqueResults = usableExternalResults.filter((result) => {
        const lat = Number(result.latitude ?? result.lat);
        const lng = Number(result.longitude ?? result.lon);
        const key = `${lat.toFixed(6)}|${lng.toFixed(6)}|${normalize(
          result.display_name || result.name,
        )}`;

        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setSearchResults(uniqueResults.slice(0, 12));

      if (uniqueResults.length === 0) {
        if (localResults.length > 0) {
          setSearchMessage(
            "No exact map place was found for this attraction. Its saved address was also checked, but no usable map coordinates were returned. The old saved pin was not used. Place the pin manually on the map.",
          );
        } else {
          setSearchMessage(
            "No map location was found. Try the attraction name with its barangay or address, or place the pin manually.",
          );
        }
      } else if (!strongMatch && localResults.length > 0) {
        setSearchMessage(
          "No exact attraction pin was found by name, so the saved address was used to find a map location. Confirm the pin before saving.",
        );
      } else {
        setSearchMessage(
          "Map locations found. Choose the correct place, then confirm the pin before saving.",
        );
      }
    } catch (error) {
      console.error("Location search failed:", error);

      // IMPORTANT: even if the online provider fails, do NOT fall back to
      // saved database coordinates. The admin can place the pin manually.
      setSearchResults([]);
      setSearchMessage(
        "Online map search is temporarily unavailable. The saved database pin was not used as a search result. You can place the pin manually on the map.",
      );
    } finally {
      setSearching(false);
    }
  };

  const selectResult = async (result: SearchResult) => {
    const resultName =
      String(result.name || "").trim() ||
      String(result.display_name || "Selected location")
        .split(",")[0]
        .trim();

    const lat = Number(result.latitude ?? result.lat);
    const lng = Number(result.longitude ?? result.lon);

    // A local result is only a name/address fallback. Never trust its
    // coordinates, even if a caller accidentally includes them.
    const hasCoordinates =
      result.source !== "local" &&
      (result.latitude != null || result.lat != null) &&
      (result.longitude != null || result.lon != null) &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lng) <= 180 &&
      !(lat === 0 && lng === 0);

    const resultAddress = String(
      result.address || result.display_name || result.name || "",
    ).trim();

    if (hasCoordinates) {
      handleLocationChange(lat, lng, resultAddress, resultName);
      setSearchResults([]);
      setSearchTerm(resultName);
      setSearchMessage(
        "Location selected. Drag the pin or click the map to fine-tune its position.",
      );
      return;
    }

    const query = [
      resultName,
      typeof result.address === "string" ? result.address : "",
    ]
      .filter(Boolean)
      .join(", ");

    setSearching(true);
    setSearchMessage(`Finding map coordinates for ${resultName}…`);

    try {
      const fallbackResults = await geocodeLocation(query);

      const match = fallbackResults.find((item) => {
        const fallbackLat = Number(item.lat);
        const fallbackLng = Number(item.lon);

        return (
          Number.isFinite(fallbackLat) &&
          Number.isFinite(fallbackLng) &&
          Math.abs(fallbackLat) <= 90 &&
          Math.abs(fallbackLng) <= 180 &&
          !(fallbackLat === 0 && fallbackLng === 0)
        );
      });

      if (!match) {
        setSearchMessage(
          `“${resultName}” is in your saved attraction list, but no usable coordinates were found. Try searching with its barangay or place the pin manually.`,
        );
        return;
      }

      handleLocationChange(
        Number(match.lat),
        Number(match.lon),
        String(match.display_name || resultAddress || ""),
        resultName,
      );

      setSearchResults([]);
      setSearchTerm(resultName);
      setSearchMessage(
        "Location found. Confirm the pin is on the attraction, then save the attraction.",
      );
    } catch (error) {
      console.error("Could not resolve attraction coordinates:", error);

      setSearchMessage(
        `The coordinates for “${resultName}” could not be retrieved right now. Try again or place the pin manually.`,
      );
    } finally {
      setSearching(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSearchMessage(
        "Your browser does not support location access. You can still search or place the pin manually.",
      );
      return;
    }

    setSearchMessage("Getting your current location…");

    navigator.geolocation.getCurrentPosition(
      (location) => {
        handleLocationChange(
          location.coords.latitude,
          location.coords.longitude,
          selectedPlaceAddress || undefined,
          selectedPlaceName || name || undefined,
        );

        setSearchMessage(
          "Current location selected. Drag the pin if you need to fine-tune it.",
        );
      },
      () => {
        setSearchMessage(
          "Location access was unavailable. Allow location permission or search for the place instead.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      },
    );
  };

  const markerLabel =
    selectedPlaceName || name?.trim() || "Selected location";

  const activeTiles = tileLayers[layer];

  return (
    <div className="calbayog-location-picker">
      <style>{`
        .calbayog-location-picker {
          color: #20263a;
          font-family: Inter, "Segoe UI", Arial, sans-serif;
          width: 100%;
        }
        .calbayog-location-picker * { box-sizing: border-box; }
        .calbayog-map-toolbar {
          background: #fff;
          border: 1px solid #e3e7f0;
          border-radius: 18px;
          padding: 16px;
          margin-bottom: 14px;
          box-shadow: 0 5px 20px rgba(28,38,75,.045);
        }
        .calbayog-map-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }
        .calbayog-map-title-icon {
          width: 40px;
          height: 40px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${BRAND_BLUE};
          background: #eef0ff;
          flex: 0 0 auto;
        }
        .calbayog-map-title h3 {
          font-size: 15px;
          font-weight: 850;
          margin: 0;
          letter-spacing: -.25px;
          color: #20263a;
        }
        .calbayog-map-title p {
          font-size: 11.5px;
          color: #7b8395;
          margin: 3px 0 0;
          line-height: 1.5;
        }
        .calbayog-search-row {
          display: flex;
          gap: 9px;
          align-items: stretch;
          flex-wrap: wrap;
        }
        .calbayog-search-input-wrap {
          position: relative;
          flex: 1 1 260px;
          min-width: 0;
        }
        .calbayog-search-icon {
          position: absolute;
          top: 50%;
          left: 13px;
          transform: translateY(-50%);
          color: #8a91a3;
          pointer-events: none;
        }
        .calbayog-search-input {
          display: block;
          width: 100%;
          min-height: 46px;
          padding: 11px 40px;
          border: 1px solid #dfe4ef;
          border-radius: 12px;
          background: #fbfcff;
          color: #252b3c;
          outline: none;
          font-size: 13px;
        }
        .calbayog-search-input:focus {
          background: #fff;
          border-color: ${BRAND_BLUE};
          box-shadow: 0 0 0 3px rgba(45,49,149,.10);
        }
        .calbayog-search-input::placeholder { color: #9ba2b1; }
        .calbayog-control-button {
          min-height: 46px;
          padding: 10px 14px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }
        .calbayog-control-button:disabled { opacity: .7; cursor: wait; }
        .calbayog-primary-button {
          border: 1px solid ${BRAND_BLUE};
          background: ${BRAND_BLUE};
          color: #fff;
        }
        .calbayog-primary-button:hover:not(:disabled) { background: #23277c; }
        .calbayog-secondary-button {
          border: 1px solid #e0e5ef;
          background: #fff;
          color: #4b5265;
        }
        .calbayog-secondary-button:hover:not(:disabled) { background: #f7f8ff; }
        .calbayog-clear-button {
          position: absolute;
          top: 50%;
          right: 8px;
          transform: translateY(-50%);
          border: 0;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: transparent;
          color: #858c9d;
          cursor: pointer;
        }
        .calbayog-clear-button:hover { background: #eef0f7; color: #30364a; }
        .calbayog-search-results {
          margin-top: 10px;
          border: 1px solid #e5e8f0;
          border-radius: 13px;
          overflow: auto;
          background: #fff;
          box-shadow: 0 10px 28px rgba(24,31,60,.07);
          max-height: 300px;
        }
        .calbayog-search-result {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          width: 100%;
          padding: 12px;
          border: 0;
          border-bottom: 1px solid #f0f2f7;
          background: #fff;
          text-align: left;
          cursor: pointer;
        }
        .calbayog-search-result:last-child { border-bottom: 0; }
        .calbayog-search-result:hover,
        .calbayog-search-result:focus-visible {
          background: #f5f6ff;
          outline: none;
        }
        .calbayog-result-pin {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          flex: 0 0 32px;
          border-radius: 10px;
          background: #eef0ff;
          color: ${BRAND_BLUE};
        }
        .calbayog-result-name {
          display: block;
          font-size: 12.5px;
          font-weight: 800;
          line-height: 1.45;
          color: #262c3f;
          overflow-wrap: anywhere;
        }
        .calbayog-result-address {
          display: block;
          font-size: 11px;
          color: #858c9c;
          margin-top: 3px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }
        .calbayog-result-source {
          display: inline-flex;
          margin-top: 5px;
          padding: 3px 6px;
          border-radius: 5px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .3px;
          color: #525c72;
          background: #f0f2f7;
          text-transform: uppercase;
        }
        .calbayog-search-message {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          margin-top: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          background: #f6f7fb;
          color: #687085;
          border: 1px solid #e9ecf3;
          font-size: 11.5px;
          line-height: 1.55;
        }
        .calbayog-map-tools {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }
        .calbayog-layer-group { display: flex; gap: 6px; flex-wrap: wrap; }
        .calbayog-layer-button {
          min-height: 35px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 7px 10px;
          border: 1px solid #e1e5ee;
          border-radius: 10px;
          background: #fff;
          color: #6b7284;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }
        .calbayog-layer-button:hover {
          border-color: #c5cae4;
          background: #f8f8ff;
        }
        .calbayog-layer-button.active {
          border-color: #cbd0f6;
          background: #eef0ff;
          color: ${BRAND_BLUE};
        }
        .calbayog-map-hint {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #858c9c;
          font-size: 10.5px;
          font-weight: 650;
        }
        .calbayog-map-frame {
          position: relative;
          overflow: hidden;
          border: 1px solid #dce1ec;
          border-radius: 17px;
          background: #e9edf4;
          box-shadow: 0 8px 24px rgba(27,36,70,.08);
          isolation: isolate;
        }
        .calbayog-map-frame .leaflet-container {
          width: 100%;
          height: 390px;
          font-family: Inter, "Segoe UI", Arial, sans-serif;
          background: #e9edf4;
          z-index: 1;
        }
        .calbayog-map-status {
          position: absolute;
          z-index: 1000;
          left: 10px;
          bottom: 10px;
          max-width: min(390px, calc(100% - 20px));
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 7px 10px;
          border: 1px solid rgba(220,225,236,.95);
          border-radius: 9px;
          background: rgba(255,255,255,.94);
          color: #535c70;
          box-shadow: 0 2px 8px rgba(20,30,50,.12);
          font-size: 10px;
          line-height: 1.4;
          pointer-events: none;
        }
        .calbayog-location-summary {
          margin-top: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          border: 1px solid #e5e8f0;
          border-radius: 13px;
          padding: 12px 14px;
          background: #fafbfe;
        }
        .calbayog-location-summary-main {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          min-width: 0;
        }
        .calbayog-location-summary-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 32px;
          border-radius: 10px;
          background: #e9f7ef;
          color: #198754;
        }
        .calbayog-location-summary-label {
          display: block;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .45px;
          color: #858c9c;
          margin-bottom: 3px;
        }
        .calbayog-location-summary-value {
          display: block;
          color: #30364a;
          font-size: 12px;
          line-height: 1.55;
          font-weight: 750;
          overflow-wrap: anywhere;
        }
        .calbayog-coordinate-chip {
          border: 1px solid #e4e7ef;
          border-radius: 9px;
          padding: 7px 9px;
          color: #70788b;
          background: #fff;
          font-size: 10px;
          font-weight: 750;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }
        .calbayog-marker-shell {
          position: relative;
          width: 44px;
          height: 52px;
          filter: drop-shadow(0 3px 4px rgba(16,24,40,.25));
        }
        .calbayog-marker-pin {
          position: absolute;
          top: 1px;
          left: 5px;
          width: 34px;
          height: 34px;
          border: 3px solid #fff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 1px 3px rgba(0,0,0,.12);
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
          background: #fff;
          font-size: 13px;
          line-height: 1;
        }
        .calbayog-location-tooltip {
          border: 0 !important;
          border-radius: 8px !important;
          padding: 6px 10px !important;
          background: #20263a !important;
          color: #fff !important;
          box-shadow: 0 4px 14px rgba(17,24,39,.25) !important;
          font-size: 11px !important;
          font-weight: 850 !important;
          white-space: nowrap;
          max-width: 240px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .calbayog-location-tooltip::before {
          border-top-color: #20263a !important;
        }
        .calbayog-location-popup { min-width: 170px; max-width: 260px; }
        .calbayog-location-popup strong {
          display: block;
          color: #252b3c;
          font-size: 13px;
          line-height: 1.45;
          margin-bottom: 4px;
        }
        .calbayog-location-popup span {
          display: block;
          color: #71798b;
          font-size: 11px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }
        .calbayog-osm-place-marker { background: transparent; border: 0; }
        .calbayog-osm-place-marker-inner {
          width: 29px;
          height: 29px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #fff;
          border-radius: 50%;
          background: #f59e0b;
          color: #fff;
          font-size: 15px;
          line-height: 1;
          box-shadow: 0 2px 7px rgba(0,0,0,.35);
        }
        .calbayog-osm-credit {
          margin-top: 5px;
          font-size: 10px !important;
          color: #8a91a3 !important;
        }
        .calbayog-use-place-button {
          margin-top: 10px;
          padding: 8px 10px;
          border: 0;
          border-radius: 8px;
          background: ${BRAND_BLUE};
          color: #fff;
          font-weight: 700;
          cursor: pointer;
        }
        .calbayog-use-place-button:hover { background: #23277c; }
        .calbayog-spin { animation: calbayog-spin 1s linear infinite; }
        @keyframes calbayog-spin { to { transform: rotate(360deg); } }
        @media (max-width: 600px) {
          .calbayog-map-toolbar { padding: 12px; border-radius: 14px; }
          .calbayog-search-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }
          .calbayog-search-input-wrap {
            grid-column: 1 / -1;
            width: 100%;
          }
          .calbayog-search-row .calbayog-control-button {
            width: 100%;
            padding: 9px;
          }
          .calbayog-map-frame .leaflet-container { height: 330px; }
          .calbayog-map-hint { width: 100%; }
          .calbayog-coordinate-chip { white-space: normal; }
        }
        @media (prefers-reduced-motion: reduce) {
          .calbayog-location-picker *,
          .calbayog-location-picker *::before,
          .calbayog-location-picker *::after {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>

      <section className="calbayog-map-toolbar">
        <div className="calbayog-map-title">
          <div className="calbayog-map-title-icon">
            <MapPin size={20} />
          </div>
          <div>
            <h3>Set Attraction Location</h3>
            <p>
              Search for a destination, select a result, and confirm the pin
              on the map.
            </p>
          </div>
        </div>

        <div className="calbayog-search-row">
          <div className="calbayog-search-input-wrap">
            <Search className="calbayog-search-icon" size={17} />
            <input
              className="calbayog-search-input"
              type="search"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setSearchMessage("");
                setSearchResults([]);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  event.stopPropagation();
                  void searchLocation();
                }
              }}
              placeholder="Search Malajog Beach, Island View..."
              aria-label="Search attraction name or address"
              autoComplete="off"
            />
            {searchTerm && (
              <button
                className="calbayog-clear-button"
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSearchResults([]);
                  setSearchMessage("");
                }}
                aria-label="Clear location search"
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <button
            className="calbayog-control-button calbayog-primary-button"
            type="button"
            onClick={() => void searchLocation()}
            disabled={searching}
          >
            {searching ? (
              <LoaderCircle size={16} className="calbayog-spin" />
            ) : (
              <Search size={16} />
            )}
            {searching ? "Searching..." : "Search"}
          </button>

          <button
            className="calbayog-control-button calbayog-secondary-button"
            type="button"
            onClick={useCurrentLocation}
            title="Use your browser's current location"
          >
            <Crosshair size={16} />
            My Location
          </button>
        </div>

        {searchResults.length > 0 && (
          <div
            className="calbayog-search-results"
            role="listbox"
            aria-label="Location search results"
          >
            {searchResults.map((result, index) => {
              const resultTitle =
                String(result.name || "").trim() ||
                String(result.display_name || "Location")
                  .split(",")[0]
                  .trim();

              const resultSubtitle = String(
                result.address || result.display_name || "",
              );

              return (
                <button
                  key={
                    result.id
                      ? `${result.source}-${result.id}`
                      : `${resultTitle}-${result.lat ?? result.latitude}-${result.lon ?? result.longitude}-${index}`
                  }
                  type="button"
                  className="calbayog-search-result"
                  role="option"
                  aria-selected={false}
                  onClick={() => void selectResult(result)}
                >
                  <span className="calbayog-result-pin">
                    <MapPin size={17} />
                  </span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span className="calbayog-result-name">
                      {resultTitle}
                    </span>
                    {resultSubtitle && (
                      <span className="calbayog-result-address">
                        {resultSubtitle}
                      </span>
                    )}
                    <span className="calbayog-result-source">
                      {result.source === "local"
                        ? "Saved address fallback"
                        : "Map search result"}
                    </span>
                  </span>
                  <Navigation
                    size={15}
                    style={{
                      color: BRAND_BLUE,
                      flex: "0 0 auto",
                      marginTop: 5,
                    }}
                  />
                </button>
              );
            })}
          </div>
        )}

        {searchMessage && (
          <div
            className="calbayog-search-message"
            role="status"
            aria-live="polite"
          >
            <MapPin
              size={15}
              style={{ flex: "0 0 auto", marginTop: 1 }}
            />
            <span>{searchMessage}</span>
          </div>
        )}
      </section>

      <div className="calbayog-map-tools">
        <div className="calbayog-layer-group" aria-label="Map style">
          {(
            [
              ["street", "Street", <MapIcon size={14} />],
              ["satellite", "Satellite", <Satellite size={14} />],
              ["terrain", "Terrain", <MapIcon size={14} />],
            ] as const
          ).map(([value, label, icon]) => (
            <button
              key={value}
              type="button"
              className={`calbayog-layer-button ${
                layer === value ? "active" : ""
              }`}
              onClick={() => setLayer(value)}
              aria-pressed={layer === value}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className={`calbayog-layer-button ${
              showMappedPlaces ? "active" : ""
            }`}
            onClick={() => setShowMappedPlaces((current) => !current)}
            aria-pressed={showMappedPlaces}
            title="Show or hide places mapped in OpenStreetMap"
          >
            <MapPin size={14} />
            {showMappedPlaces ? "Nearby Places On" : "Nearby Places Off"}
          </button>

          <div className="calbayog-map-hint">
            <Navigation size={13} />
            Drag the pin or click the map to fine-tune.
          </div>
        </div>
      </div>

      <div className="calbayog-map-frame">
        <MapContainer
          center={position}
          zoom={mapZoom}
          scrollWheelZoom
          zoomControl
          style={{ width: "100%", height: "390px" }}
        >
          <TileLayer
            key={layer}
            attribution={activeTiles.attribution}
            url={activeTiles.url}
            zIndex={1}
          />

          {layer === "satellite" && (
            <>
              <TileLayer
                key="satellite-place-labels"
                attribution="Place and boundary labels &copy; Esri"
                url={SATELLITE_LABELS_URL}
                zIndex={2}
                opacity={1}
              />
              <TileLayer
                key="satellite-road-labels"
                attribution="Transportation labels &copy; Esri"
                url={SATELLITE_ROADS_URL}
                zIndex={3}
                opacity={1}
              />
            </>
          )}

          <MapCenter
            latitude={position[0]}
            longitude={position[1]}
            zoom={mapZoom}
          />

          <MapResizeHandler />

          <OpenStreetMapPlaces
            enabled={showMappedPlaces}
            onSelect={(place) => {
              handleLocationChange(
                place.latitude,
                place.longitude,
                place.address || place.name,
                place.name,
              );
              setSearchTerm(place.name);
              setSearchResults([]);
              setSearchMessage(
                "Mapped place selected. Confirm the pin location before saving the attraction.",
              );
            }}
          />

          <MapClickHandler
            onLocationChange={(lat, lng) =>
              handleLocationChange(
                lat,
                lng,
                selectedPlaceAddress || undefined,
                selectedPlaceName || name || undefined,
              )
            }
          />

          <Marker
            position={position}
            icon={
              category || attractionType
                ? createAttractionMarkerIcon(category, attractionType)
                : createAccommodationMarkerIcon()
            }
            draggable
            zIndexOffset={1000}
            eventHandlers={{
              dragend: (event) => {
                const location = event.target.getLatLng();
                handleLocationChange(
                  location.lat,
                  location.lng,
                  selectedPlaceAddress || undefined,
                  selectedPlaceName || name || undefined,
                );
              },
            }}
          >
            <Tooltip
              permanent
              direction="top"
              offset={[0, -38]}
              opacity={1}
              className="calbayog-location-tooltip"
            >
              {markerLabel}
            </Tooltip>

            <Popup>
              <div className="calbayog-location-popup">
                <strong>{markerLabel}</strong>
                <span>
                  {selectedPlaceAddress ||
                    address ||
                    "Selected attraction location"}
                </span>
                <span style={{ marginTop: 5 }}>
                  {position[0].toFixed(6)}, {position[1].toFixed(6)}
                </span>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <div className="calbayog-location-summary">
        <div className="calbayog-location-summary-main">
          <div className="calbayog-location-summary-icon">
            <CheckCircle2 size={17} />
          </div>
          <div style={{ minWidth: 0 }}>
            <span className="calbayog-location-summary-label">
              Selected attraction
            </span>
            <span className="calbayog-location-summary-value">
              {markerLabel}
            </span>
            <span
              className="calbayog-result-address"
              style={{ marginTop: 4 }}
            >
              {selectedPlaceAddress ||
                address ||
                "Search for a place or click the map to set its location."}
            </span>
          </div>
        </div>

        <div className="calbayog-coordinate-chip">
          {position[0].toFixed(6)}, {position[1].toFixed(6)}
        </div>
      </div>
    </div>
  );
}
