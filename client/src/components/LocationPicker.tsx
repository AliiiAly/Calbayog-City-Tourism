import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
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
  X,
} from "lucide-react";
import "leaflet/dist/leaflet.css";

const markerIcon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface SearchablePlace {
  id?: string;
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface LocationPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  searchablePlaces?: SearchablePlace[];
  onChange: (location: {
    latitude: number;
    longitude: number;
    address?: string;
  }) => void;
}

type MapLayer = "street" | "satellite" | "terrain";

const DEFAULT_LATITUDE = 12.0668;
const DEFAULT_LONGITUDE = 124.6041;

function MapClickHandler({
  onLocationChange,
}: {
  onLocationChange: (lat: number, lng: number) => void;
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
  zoom = 16,
}: {
  latitude: number;
  longitude: number;
  zoom?: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([latitude, longitude], Math.max(map.getZoom(), zoom), {
      duration: 0.7,
    });
  }, [map, latitude, longitude, zoom]);

  return null;
}

function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 150);

    return () => window.clearTimeout(timer);
  }, [map]);

  return null;
}

const normalize = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

export default function LocationPicker({
  latitude,
  longitude,
  address,
  searchablePlaces = [],
  onChange,
}: LocationPickerProps) {
  const initialPosition: [number, number] = [
    typeof latitude === "number" ? latitude : DEFAULT_LATITUDE,
    typeof longitude === "number" ? longitude : DEFAULT_LONGITUDE,
  ];

  const [position, setPosition] =
    useState<[number, number]>(initialPosition);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");
  const [layer, setLayer] = useState<MapLayer>("street");
  const [mapZoom, setMapZoom] = useState(16);

  useEffect(() => {
    if (
      typeof latitude === "number" &&
      typeof longitude === "number"
    ) {
      setPosition([latitude, longitude]);
      setMapZoom(17);
    }
  }, [latitude, longitude]);

  const localMatches = useMemo(() => {
    const query = normalize(searchTerm);

    if (!query) return [];

    return searchablePlaces
      .filter((place) => {
        const text = normalize(
          [place.name, place.address]
            .filter(Boolean)
            .join(" ")
        );

        return query
          .split(/\s+/)
          .filter(Boolean)
          .every((token) => text.includes(token));
      })
      .slice(0, 6)
      .map((place) => ({
        ...place,
        source: "local",
        display_name: [place.name, place.address]
          .filter(Boolean)
          .join(" — "),
      }));
  }, [searchTerm, searchablePlaces]);

  const handleLocationChange = (
    lat: number,
    lng: number,
    selectedAddress?: string
  ) => {
    setPosition([lat, lng]);
    setMapZoom(17);

    onChange({
      latitude: lat,
      longitude: lng,
      ...(selectedAddress
        ? { address: selectedAddress }
        : {}),
    });
  };

  const searchLocation = async () => {
    const query = searchTerm.trim();

    if (!query) {
      setSearchResults([]);
      setSearchMessage(
        "Type an attraction name or address to search."
      );
      return;
    }

    if (localMatches.length > 0) {
      setSearchResults(localMatches);
      setSearchMessage(
        "Existing attraction matches are shown first."
      );
    }

    setSearching(true);
    setSearchMessage("");

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&addressdetails=1&q=${encodeURIComponent(
          `${query}, Calbayog City, Samar, Philippines`
        )}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Location search failed.");
      }

      const results = await response.json();

      const externalResults = Array.isArray(results)
        ? results.map((result) => ({
            source: "search",
            name:
              String(result.display_name || result.name || "Location")
                .split(",")[0]
                .trim(),
            address: String(result.display_name || "").trim(),
            display_name: String(result.display_name || "").trim(),
            latitude: Number(result.lat),
            longitude: Number(result.lon),
          }))
        : [];

      setSearchResults((previous) => {
        const local = previous.filter(
          (item) => item.source === "local"
        );

        const merged = [...local, ...externalResults];
        const seen = new Set<string>();

        return merged.filter((item) => {
          const key = `${item.lat}|${item.lon}|${item.display_name}`;

          if (seen.has(key)) return false;

          seen.add(key);
          return true;
        });
      });

      if (
        externalResults.length === 0 &&
        localMatches.length === 0
      ) {
        setSearchMessage(
          "No exact match found. Try a nearby landmark, barangay, or full address."
        );
      }
    } catch (error) {
      console.error("Location search failed:", error);

      if (localMatches.length === 0) {
        setSearchMessage(
          "Search is temporarily unavailable. You can still click or drag the pin on the map."
        );
      }
    } finally {
      setSearching(false);
    }
  };

  const selectResult = (result: any) => {
    const lat = Number(
      result.latitude ?? result.lat
    );

    const lng = Number(
      result.longitude ?? result.lon
    );

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return;
    }

    const selectedAddress =
      typeof result.address === "string"
        ? result.address
        : typeof result.display_name === "string"
          ? result.display_name
          : typeof result.name === "string"
            ? result.name
            : "";

    handleLocationChange(
      lat,
      lng,
      selectedAddress
    );

    setSearchMessage(
      "Location selected. You can still drag the pin to fine-tune it."
    );

    setSearchResults([]);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSearchMessage(
        "Your browser does not support location access."
      );
      return;
    }

    setSearchMessage(
      "Getting your current location…"
    );

    navigator.geolocation.getCurrentPosition(
      (location) => {
        handleLocationChange(
          location.coords.latitude,
          location.coords.longitude
        );

        setSearchMessage(
          "Current location selected. Drag the pin if needed."
        );
      },
      () => {
        setSearchMessage(
          "We could not access your location. You can search, click, or drag the pin instead."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  const tileConfig = {
    street: {
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution:
        "&copy; OpenStreetMap contributors",
    },

    satellite: {
      url:
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution:
        "Tiles &copy; Esri | Map data &copy; OpenStreetMap contributors",
      labelUrl:
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Reference_Overlay/MapServer/tile/{z}/{y}/{x}",
      labelAttribution:
        "Reference &copy; Esri, DeLorme, USGS, NPS",
    },

    terrain: {
      url:
        "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      attribution:
        "Map data &copy; OpenStreetMap contributors, SRTM | Map style &copy; OpenTopoMap",
    },
  }[layer];

  return (
    <div className="location-picker">

      {/* SEARCH AREA */}
      <div
        style={{
          border: "1px solid #e1e4ec",
          borderRadius: 14,
          background: "#fff",
          padding: 12,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "stretch",
            flexWrap: "wrap",
          }}
        >

          {/* SEARCH INPUT */}
          <div
            style={{
              flex: "1 1 300px",
              position: "relative",
            }}
          >
            <Search
              size={17}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#727887",
                pointerEvents: "none",
              }}
            />

            <input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setSearchMessage("");

                if (!event.target.value.trim()) {
                  setSearchResults([]);
                }
              }}

              /*
               * IMPORTANT:
               * Prevent Enter from submitting the parent
               * Admin Attraction form.
               */
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  event.stopPropagation();
                  searchLocation();
                }
              }}

              placeholder="Search attraction name or address…"
              aria-label="Search attraction name or address"

              style={{
                width: "100%",
                minHeight: 44,
                padding: "10px 38px 10px 38px",
                border: "1px solid #dfe3eb",
                borderRadius: 11,
                outline: "none",
                fontSize: 13,
              }}
            />

            {/* CLEAR SEARCH */}
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSearchResults([]);
                  setSearchMessage("");
                }}
                aria-label="Clear location search"
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 28,
                  height: 28,
                  border: 0,
                  borderRadius: 8,
                  background: "transparent",
                  color: "#777d8a",
                  cursor: "pointer",
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* SEARCH BUTTON */}
          <button
            type="button"
            onClick={searchLocation}
            disabled={searching}
            style={{
              minHeight: 44,
              padding: "10px 15px",
              border: 0,
              borderRadius: 11,
              background: "#2D3195",
              color: "#fff",
              fontWeight: 800,
              fontSize: 12,
              cursor: searching ? "wait" : "pointer",
            }}
          >
            {searching ? "Searching…" : "Search"}
          </button>

          {/* CURRENT LOCATION */}
          <button
            type="button"
            onClick={useCurrentLocation}
            title="Use current browser location"
            style={{
              minHeight: 44,
              padding: "10px 13px",
              border: "1px solid #dfe3eb",
              borderRadius: 11,
              background: "#f8f9ff",
              color: "#2D3195",
              fontWeight: 800,
              fontSize: 12,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Crosshair size={15} />
            My Location
          </button>
        </div>

        {/* SEARCH RESULTS / MESSAGE */}
        {(searchResults.length > 0 ||
          searchMessage) && (
          <div style={{ marginTop: 10 }}>

            {searchResults.length > 0 && (
              <div
                style={{
                  border: "1px solid #e6e8ef",
                  borderRadius: 11,
                  overflow: "hidden",
                  background: "#fff",
                }}
              >
                {searchResults.map(
                  (result, index) => (
                    <button
                      key={`${result.lat || result.latitude}-${result.lon || result.longitude}-${index}`}
                      type="button"
                      onClick={() =>
                        selectResult(result)
                      }
                      style={{
                        width: "100%",
                        display: "block",
                        textAlign: "left",
                        border: 0,
                        borderBottom:
                          index ===
                          searchResults.length - 1
                            ? "0"
                            : "1px solid #eef0f4",
                        background: "#fff",
                        padding: "10px 12px",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 9,
                        }}
                      >
                        <MapPin
                          size={16}
                          style={{
                            marginTop: 2,
                            color: "#2D3195",
                            flex: "0 0 auto",
                          }}
                        />

                        <span
                          style={{
                            minWidth: 0,
                          }}
                        >
                          <span
                            style={{
                              display: "block",
                              color: "#252936",
                              fontWeight: 800,
                              fontSize: 12,
                            }}
                          >
                            {result.name ||
                              String(
                                result.display_name ||
                                  "Location"
                              ).split(",")[0]}
                          </span>

                          <span
                            style={{
                              display: "block",
                              marginTop: 2,
                              color: "#7b8190",
                              fontSize: 11,
                              lineHeight: 1.4,
                            }}
                          >
                            {String(
                              typeof result.address === "string"
                                ? result.address
                                : result.display_name || ""
                            )}
                          </span>
                        </span>
                      </div>
                    </button>
                  )
                )}
              </div>
            )}

            {searchMessage && (
              <div
                style={{
                  marginTop: searchResults.length
                    ? 8
                    : 0,
                  color: "#737987",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {searchMessage}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MAP STYLE BUTTONS */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          {(
            [
              [
                "street",
                "Street",
                <MapIcon size={13} />,
              ],
              [
                "satellite",
                "Satellite",
                <Satellite size={13} />,
              ],
              [
                "terrain",
                "Terrain",
                <MapIcon size={13} />,
              ],
            ] as const
          ).map(
            ([value, label, icon]) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setLayer(value)
                }
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  minHeight: 34,
                  padding: "7px 10px",
                  border: `1px solid ${
                    layer === value
                      ? "#2D3195"
                      : "#dfe3eb"
                  }`,
                  borderRadius: 9,
                  background:
                    layer === value
                      ? "#eef0ff"
                      : "#fff",
                  color:
                    layer === value
                      ? "#2D3195"
                      : "#606674",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {icon}
                {label}
              </button>
            )
          )}
        </div>

        <span
          style={{
            color: "#7a808e",
            fontSize: 10.5,
            fontWeight: 700,
          }}
        >
          Search first, then drag or click the pin
          to fine-tune.
        </span>
      </div>

      {/* MAP */}
      <div
        style={{
          overflow: "hidden",
          borderRadius: 14,
          border: "1px solid #dfe3eb",
          boxShadow:
            "0 6px 18px rgba(26,30,53,.06)",
        }}
      >
        <MapContainer
          center={position}
          zoom={mapZoom}
          scrollWheelZoom={true}
          style={{
            height: "360px",
            width: "100%",
          }}
        >
          <TileLayer
            attribution={tileConfig.attribution}
            url={tileConfig.url}
          />

          {layer === "satellite" && "labelUrl" in tileConfig && (
            <TileLayer
              attribution={tileConfig.labelAttribution}
              url={tileConfig.labelUrl ?? ""}
              opacity={1}
              zIndex={400}
            />
          )}

          <MapCenter
            latitude={position[0]}
            longitude={position[1]}
            zoom={mapZoom}
          />

          <MapResizeHandler />

          <MapClickHandler
            onLocationChange={(
              lat,
              lng
            ) =>
              handleLocationChange(
                lat,
                lng
              )
            }
          />

          <Marker
            position={position}
            icon={markerIcon}
            draggable={true}
            eventHandlers={{
              dragend: (event) => {
                const marker =
                  event.target;

                const location =
                  marker.getLatLng();

                handleLocationChange(
                  location.lat,
                  location.lng
                );
              },
            }}
          />
        </MapContainer>
      </div>

      {/* LOCATION INFORMATION */}
      <div
        style={{
          marginTop: 10,
          padding: "10px 12px",
          borderRadius: 11,
          background: "#f7f8fc",
          border: "1px solid #e7e9f0",
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div
          style={{
            color: "#555b68",
            fontSize: 11.5,
            fontWeight: 700,
          }}
        >
          <strong
            style={{
              color: "#2D3195",
            }}
          >
            Pinned location:
          </strong>{" "}
          {address ||
            "Search or place the pin on the map"}
        </div>

        <div
          style={{
            color: "#7a808e",
            fontSize: 10.5,
            fontWeight: 800,
          }}
        >
          {position[0].toFixed(6)},{" "}
          {position[1].toFixed(6)}
        </div>
      </div>
    </div>
  );
}
