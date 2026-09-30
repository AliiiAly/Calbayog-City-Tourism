
import { useCallback, useEffect, useMemo, useState } from "react";
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
  Crosshair,
  Map as MapIcon,
  MapPin,
  Search,
  Satellite,
  Mountain,
  X,
  CheckCircle2,
  Navigation,
  LoaderCircle,
  LocateFixed,
  ClipboardPaste,
} from "lucide-react";
import "leaflet/dist/leaflet.css";

const BRAND_BLUE = "#2D3195";
const DEFAULT_LATITUDE = 12.0668;
const DEFAULT_LONGITUDE = 124.6041;

type MapLayer = "street" | "satellite" | "terrain";

interface SearchablePlace {
  id?: string;
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
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

const MARKER_COLORS: Record<string, string> = {
  Nature: "#16845B",
  "History and Culture": "#A66A3F",
  "Industrial Tourism": "#526477",
  Shopping: "#D9468F",
  Other: BRAND_BLUE,
};

const MARKER_EMOJIS: Record<string, string> = {
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

const isValidCoordinatePair = (lat: number, lng: number) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= -90 &&
  lat <= 90 &&
  lng >= -180 &&
  lng <= 180 &&
  !(lat === 0 && lng === 0);

const createMarkerIcon = (
  category?: string | null,
  attractionType?: string | null,
) => {
  const color = MARKER_COLORS[category || "Other"] || BRAND_BLUE;
  const emoji =
    MARKER_EMOJIS[normalize(attractionType)] ||
    MARKER_EMOJIS.other;

  return L.divIcon({
    className: "calbayog-location-marker",
    html: `
      <div class="calbayog-marker-shell">
        <div class="calbayog-marker-pin" style="background:${color}"></div>
        <div class="calbayog-marker-icon">${emoji}</div>
      </div>
    `,
    iconSize: [44, 52],
    iconAnchor: [22, 49],
    popupAnchor: [0, -47],
    tooltipAnchor: [0, -43],
  });
};

const TILE_LAYERS: Record<
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
      'Map data &copy; OpenStreetMap contributors, SRTM | Map style &copy; OpenTopoMap',
  },
};

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
    map.flyTo([latitude, longitude], zoom, { duration: 0.5 });
  }, [map, latitude, longitude, zoom]);

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
  const initialCoordinates =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    isValidCoordinatePair(latitude, longitude);

  const [position, setPosition] = useState<[number, number]>(
    initialCoordinates
      ? [latitude as number, longitude as number]
      : [DEFAULT_LATITUDE, DEFAULT_LONGITUDE],
  );

  const [latitudeInput, setLatitudeInput] = useState(
    initialCoordinates ? String(latitude) : "",
  );
  const [longitudeInput, setLongitudeInput] = useState(
    initialCoordinates ? String(longitude) : "",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");
  const [layer, setLayer] = useState<MapLayer>("street");
  const [zoom, setZoom] = useState(initialCoordinates ? 18 : 13);
  const [selectedName, setSelectedName] = useState(name?.trim() || "");
  const [selectedAddress, setSelectedAddress] = useState(address || "");

  useEffect(() => {
    setSelectedName(name?.trim() || "");
  }, [name]);

  useEffect(() => {
    setSelectedAddress(address || "");
  }, [address]);

  useEffect(() => {
    if (
      typeof latitude === "number" &&
      typeof longitude === "number" &&
      isValidCoordinatePair(latitude, longitude)
    ) {
      setPosition([latitude, longitude]);
      setLatitudeInput(String(latitude));
      setLongitudeInput(String(longitude));
      setZoom(18);
    }
  }, [latitude, longitude]);

  const localMatches = useMemo(() => {
    const query = normalize(searchTerm);
    if (!query) return [];

    const terms = query.split(/\s+/).filter(Boolean);

    return searchablePlaces
      .filter((place) => {
        const text = normalize(
          [place.name, place.address].filter(Boolean).join(" "),
        );
        return terms.every((term) => text.includes(term));
      })
      .slice(0, 8)
      .map((place) => ({
        ...place,
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
      placeName?: string,
    ) => {
      if (!isValidCoordinatePair(lat, lng)) {
        setMessage(
          "Please use valid coordinates. Latitude must be between -90 and 90, and longitude between -180 and 180.",
        );
        return;
      }

      setPosition([lat, lng]);
      setLatitudeInput(String(Number(lat.toFixed(7))));
      setLongitudeInput(String(Number(lng.toFixed(7))));
      setZoom(18);

      if (selectedAddress) setSelectedAddress(selectedAddress);
      if (placeName) setSelectedName(placeName);

      onChange({
        latitude: lat,
        longitude: lng,
        ...(selectedAddress ? { address: selectedAddress } : {}),
      });
    },
    [onChange],
  );

  const applyCoordinates = () => {
    const lat = Number(latitudeInput.trim());
    const lng = Number(longitudeInput.trim());

    if (
      !latitudeInput.trim() ||
      !longitudeInput.trim() ||
      !isValidCoordinatePair(lat, lng)
    ) {
      setMessage(
        "Enter valid coordinates. Latitude must be -90 to 90 and longitude must be -180 to 180. Make sure latitude comes first.",
      );
      return;
    }

    handleLocationChange(lat, lng, selectedAddress || undefined, name || undefined);
    setSearchResults([]);
    setMessage(
      "Coordinates applied. Check that the pin is on the exact attraction before saving.",
    );
  };

  const searchMap = async () => {
    const query = searchTerm.trim();

    if (!query) {
      setMessage("Enter an attraction name, address, or barangay.");
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setMessage("");

    const localResults: SearchResult[] = localMatches;

    try {
      const url =
        "https://nominatim.openstreetmap.org/search" +
        `?format=jsonv2&limit=6&addressdetails=1&q=${encodeURIComponent(
          `${query}, Calbayog City, Samar, Philippines`,
        )}`;

      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error("Search service unavailable");

      const externalResults: SearchResult[] = await response.json();
      const mapped = externalResults.map((item) => ({
        ...item,
        name: item.name || item.display_name?.split(",")[0] || "Map result",
        source: "search" as const,
      }));

      const merged = [...localResults, ...mapped];
      const seen = new Set<string>();

      const unique = merged.filter((item) => {
        const lat = item.latitude ?? item.lat ?? "";
        const lng = item.longitude ?? item.lon ?? "";
        const key = item.id
          ? `${item.source}-${item.id}`
          : `${normalize(item.name)}-${lat}-${lng}`;

        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setSearchResults(unique.slice(0, 12));

      if (!unique.length) {
        setMessage(
          "No results found. Try the barangay or a nearby landmark, or enter Google Maps coordinates manually.",
        );
      } else {
        setMessage(
          "Choose a result, then confirm the pin is on the actual attraction.",
        );
      }
    } catch (error) {
      console.error("Location search failed:", error);
      setSearchResults(localResults);
      setMessage(
        localResults.length
          ? "Online search is unavailable. Showing matching saved attractions."
          : "Online search is unavailable. You can still enter coordinates manually or click the map.",
      );
    } finally {
      setSearching(false);
    }
  };

  const selectResult = (result: SearchResult) => {
    const lat = Number(result.latitude ?? result.lat);
    const lng = Number(result.longitude ?? result.lon);
    const placeName =
      String(result.name || result.display_name || "Selected location")
        .split(",")[0]
        .trim();
    const placeAddress = String(
      result.address || result.display_name || "",
    ).trim();

    if (!isValidCoordinatePair(lat, lng)) {
      setMessage(
        "This result has no usable coordinates. Search for an address or enter the exact coordinates manually.",
      );
      return;
    }

    handleLocationChange(lat, lng, placeAddress, placeName);
    setSearchTerm(placeName);
    setSearchResults([]);
    setMessage(
      "Location selected. Verify the marker position before saving.",
    );
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Your browser does not support location access.");
      return;
    }

    setMessage("Getting your current location…");

    navigator.geolocation.getCurrentPosition(
      (result) => {
        handleLocationChange(
          result.coords.latitude,
          result.coords.longitude,
          selectedAddress || undefined,
          name || selectedName || undefined,
        );
        setMessage("Current location selected.");
      },
      () => {
        setMessage(
          "Location access was unavailable. Allow browser permission or enter coordinates manually.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  };

  const markerLabel = name?.trim() || selectedName || "Selected attraction";
  const tiles = TILE_LAYERS[layer];

  return (
    <div className="calbayog-location-picker">
      <style>{`
        .calbayog-location-picker{width:100%;font-family:Inter,"Segoe UI",Arial,sans-serif;color:#20263a}
        .calbayog-location-picker *{box-sizing:border-box}
        .calbayog-map-panel{background:#fff;border:1px solid #e3e7f0;border-radius:16px;padding:15px;margin-bottom:12px}
        .calbayog-map-heading{display:flex;gap:10px;align-items:center;margin-bottom:14px}
        .calbayog-map-heading-icon{width:40px;height:40px;display:grid;place-items:center;border-radius:12px;background:#eef0ff;color:${BRAND_BLUE}}
        .calbayog-map-heading h3{font-size:15px;font-weight:850;margin:0;color:#20263a}
        .calbayog-map-heading p{font-size:11.5px;color:#7b8395;margin:4px 0 0;line-height:1.5}
        .calbayog-location-picker input{width:100%;min-width:0;min-height:42px;padding:10px 12px;border:1px solid #dfe4ef;border-radius:10px;background:#fbfcff;color:#252b3c;font:inherit;font-size:12px}
        .calbayog-location-picker input:focus{outline:none;border-color:${BRAND_BLUE};box-shadow:0 0 0 3px rgba(45,49,149,.1);background:#fff}
        .calbayog-location-picker label{display:block;margin-bottom:5px;color:#535b70;font-size:11px;font-weight:800}
        .calbayog-map-row{display:flex;gap:8px;flex-wrap:wrap}
        .calbayog-map-search{display:flex;gap:8px;margin-bottom:12px}
        .calbayog-map-search input{flex:1}
        .calbayog-map-btn{min-height:40px;padding:9px 12px;display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1px solid #dfe4ef;border-radius:10px;background:#fff;color:#50586d;font-size:11px;font-weight:800;cursor:pointer}
        .calbayog-map-btn.primary{background:${BRAND_BLUE};border-color:${BRAND_BLUE};color:#fff}
        .calbayog-map-btn:disabled{opacity:.6;cursor:wait}
        .calbayog-coordinate-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .calbayog-coordinate-help{font-size:10.5px;color:#7b8395;line-height:1.5;margin-top:7px}
        .calbayog-search-results{margin-top:10px;border:1px solid #e5e8f0;border-radius:10px;overflow:hidden;max-height:250px;overflow-y:auto}
        .calbayog-search-result{display:block;width:100%;padding:11px;border:0;border-bottom:1px solid #edf0f6;background:#fff;text-align:left;cursor:pointer}
        .calbayog-search-result:hover{background:#f5f6ff}
        .calbayog-search-result strong{display:block;font-size:12px;color:#262c3f}
        .calbayog-search-result span{display:block;font-size:10.5px;color:#7b8395;margin-top:3px}
        .calbayog-map-message{margin-top:10px;padding:10px 12px;border-radius:9px;background:#f5f6fb;color:#5d667c;font-size:11px;line-height:1.5}
        .calbayog-map-tools{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}
        .calbayog-layer-btn{padding:8px 10px;border:1px solid #e1e5ee;border-radius:9px;background:#fff;color:#646c80;font-size:10.5px;font-weight:800;cursor:pointer;display:inline-flex;gap:5px;align-items:center}
        .calbayog-layer-btn.active{border-color:#cbd0f6;background:#eef0ff;color:${BRAND_BLUE}}
        .calbayog-map-frame{overflow:hidden;border:1px solid #dce1ec;border-radius:14px;background:#e9edf4}
        .calbayog-map-frame .leaflet-container{height:390px;width:100%;font-family:Inter,"Segoe UI",Arial,sans-serif;background:#e9edf4}
        .calbayog-marker-shell{position:relative;width:44px;height:52px}
        .calbayog-marker-pin{position:absolute;left:7px;top:3px;width:30px;height:30px;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 10px #0003}
        .calbayog-marker-icon{position:absolute;top:6px;left:10px;width:24px;height:24px;display:grid;place-items:center;font-size:14px}
        .calbayog-location-tooltip{border:0!important;border-radius:7px!important;padding:5px 8px!important;background:#fff!important;color:#222!important;font-size:11px!important;font-weight:800!important;box-shadow:0 2px 9px #0003!important;white-space:normal!important}
        .calbayog-location-tooltip:before{display:none}
        .calbayog-location-summary{display:flex;gap:10px;justify-content:space-between;align-items:center;flex-wrap:wrap;margin-top:10px;padding:12px;border:1px solid #e5e8f0;border-radius:11px;background:#fafbfe}
        .calbayog-location-summary strong{display:block;font-size:12px;color:#30364a}
        .calbayog-location-summary small{display:block;margin-top:4px;font-size:10.5px;color:#7b8395;overflow-wrap:anywhere}
        .calbayog-coordinate-chip{font-size:10.5px;font-weight:800;color:${BRAND_BLUE};font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
        @media(max-width:600px){.calbayog-map-search{flex-wrap:wrap}.calbayog-map-search input{flex-basis:100%}.calbayog-map-frame .leaflet-container{height:330px}.calbayog-coordinate-grid{grid-template-columns:1fr}.calbayog-map-btn{flex:1}}
      `}</style>

      <section className="calbayog-map-panel">
        <div className="calbayog-map-heading">
          <div className="calbayog-map-heading-icon">
            <MapPin size={20} />
          </div>
          <div>
            <h3>Set Attraction Location</h3>
            <p>
              Search for a place or enter exact Google Maps coordinates.
              Confirm the marker before saving.
            </p>
          </div>
        </div>

        <div className="calbayog-map-search">
          <input
            type="search"
            value={searchTerm}
            placeholder="Search attraction name, address, or barangay"
            aria-label="Search attraction name or address"
            autoComplete="off"
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setSearchResults([]);
              setMessage("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.stopPropagation();
                void searchMap();
              }
            }}
          />
          {searchTerm && (
            <button
              type="button"
              className="calbayog-map-btn"
              aria-label="Clear search"
              onClick={() => {
                setSearchTerm("");
                setSearchResults([]);
                setMessage("");
              }}
            >
              <X size={15} />
            </button>
          )}
          <button
            type="button"
            className="calbayog-map-btn primary"
            onClick={() => void searchMap()}
            disabled={searching}
          >
            {searching ? (
              <LoaderCircle size={15} />
            ) : (
              <Search size={15} />
            )}
            Search
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="calbayog-search-results" role="listbox">
            {searchResults.map((result, index) => (
              <button
                type="button"
                role="option"
                aria-selected={false}
                className="calbayog-search-result"
                key={`${result.id || result.name || "place"}-${index}`}
                onClick={() => selectResult(result)}
              >
                <strong>
                  {result.name || result.display_name || "Map result"}
                </strong>
                <span>
                  {result.address || result.display_name || "Select location"}
                  {result.source === "local" ? " · Saved attraction" : ""}
                </span>
              </button>
            ))}
          </div>
        )}

        {message && (
          <div className="calbayog-map-message" role="status">
            {message}
          </div>
        )}

        <hr />

        <div style={{ marginBottom: 10 }}>
          <strong style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
            Enter exact coordinates
          </strong>
          <div className="calbayog-coordinate-help">
            In Google Maps, right-click the exact spot and copy the coordinates.
            Paste latitude into the first field and longitude into the second.
          </div>
        </div>

        <div className="calbayog-coordinate-grid">
          <div>
            <label htmlFor="location-picker-latitude">Latitude</label>
            <input
              id="location-picker-latitude"
              type="number"
              step="any"
              inputMode="decimal"
              value={latitudeInput}
              placeholder="e.g. 12.123456"
              onChange={(event) => setLatitudeInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  event.stopPropagation();
                  applyCoordinates();
                }
              }}
            />
          </div>
          <div>
            <label htmlFor="location-picker-longitude">Longitude</label>
            <input
              id="location-picker-longitude"
              type="number"
              step="any"
              inputMode="decimal"
              value={longitudeInput}
              placeholder="e.g. 124.567890"
              onChange={(event) => setLongitudeInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  event.stopPropagation();
                  applyCoordinates();
                }
              }}
            />
          </div>
        </div>

        <div className="calbayog-map-row" style={{ marginTop: 10 }}>
          <button
            type="button"
            className="calbayog-map-btn primary"
            onClick={applyCoordinates}
          >
            <LocateFixed size={15} />
            Apply Coordinates
          </button>
          <button
            type="button"
            className="calbayog-map-btn"
            onClick={useCurrentLocation}
          >
            <Crosshair size={15} />
            My Location
          </button>
          <button
            type="button"
            className="calbayog-map-btn"
            onClick={() => {
              setLatitudeInput(position[0].toFixed(7));
              setLongitudeInput(position[1].toFixed(7));
              setMessage("Current map coordinates copied into the fields.");
            }}
          >
            <ClipboardPaste size={15} />
            Use Pin Coordinates
          </button>
        </div>
      </section>

      <div className="calbayog-map-tools" aria-label="Map style">
        <button
          type="button"
          className={`calbayog-layer-btn ${layer === "street" ? "active" : ""}`}
          onClick={() => setLayer("street")}
          aria-pressed={layer === "street"}
        >
          <MapIcon size={14} /> Street
        </button>
        <button
          type="button"
          className={`calbayog-layer-btn ${layer === "satellite" ? "active" : ""}`}
          onClick={() => setLayer("satellite")}
          aria-pressed={layer === "satellite"}
        >
          <Satellite size={14} /> Satellite
        </button>
        <button
          type="button"
          className={`calbayog-layer-btn ${layer === "terrain" ? "active" : ""}`}
          onClick={() => setLayer("terrain")}
          aria-pressed={layer === "terrain"}
        >
          <Mountain size={14} /> Terrain
        </button>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10.5,
            color: "#858c9c",
            alignSelf: "center",
          }}
        >
          Drag the pin or click the map to fine-tune
        </span>
      </div>

      <div className="calbayog-map-frame">
        <MapContainer
          center={position}
          zoom={zoom}
          scrollWheelZoom
          zoomControl
          style={{ width: "100%", height: 390 }}
        >
          <TileLayer
            key={layer}
            attribution={tiles.attribution}
            url={tiles.url}
          />

          <MapCenter
            latitude={position[0]}
            longitude={position[1]}
            zoom={zoom}
          />

          <MapClickHandler
            onLocationChange={(lat, lng) =>
              handleLocationChange(
                lat,
                lng,
                selectedAddress || undefined,
                name || selectedName || undefined,
              )
            }
          />

          <Marker
            position={position}
            icon={createMarkerIcon(category, attractionType)}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const point = event.target.getLatLng();
                handleLocationChange(
                  point.lat,
                  point.lng,
                  selectedAddress || undefined,
                  name || selectedName || undefined,
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
              <div>
                <strong>{markerLabel}</strong>
                <br />
                {selectedAddress || address || "Selected attraction location"}
                <br />
                {position[0].toFixed(6)}, {position[1].toFixed(6)}
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <div className="calbayog-location-summary">
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <CheckCircle2 size={18} color="#198754" />
          <div>
            <strong>{markerLabel}</strong>
            <small>
              {selectedAddress ||
                address ||
                "Click the map or enter coordinates to set the location."}
            </small>
          </div>
        </div>
        <div className="calbayog-coordinate-chip">
          {position[0].toFixed(6)}, {position[1].toFixed(6)}
        </div>
      </div>
    </div>
  );
}
