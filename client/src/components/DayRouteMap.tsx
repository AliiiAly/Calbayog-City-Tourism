import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayerGroup,
  LayersControl,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { Destination } from "../types";
import { getStopKind } from "../utils/itineraryUtils";
import { RoadLeg, getStopPoint } from "../utils/roadRouting";

const CALBAYOG_BLUE = "#2D3195";

const DEFAULT_CENTER: [number, number] = [12.0667, 124.6];

const SATELLITE_LABELS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";

const SATELLITE_ROADS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}";

/* =========================================================
   PIN DESIGN (same as the Welcome page map)
   - attractions: color by category, symbol by attraction type
   - restaurants: orange pin with a fork + knife
   - stays: blue pin with a building
========================================================= */

const CATEGORY_DESIGNS: Record<string, { color: string; icon: string }> = {
  Nature: { color: "#16845B", icon: "🌿" },
  "History and Culture": { color: "#A66A3F", icon: "🏛️" },
  "Industrial Tourism": { color: "#526477", icon: "🏭" },
  Shopping: { color: "#D9468F", icon: "🛍️" },
  Other: { color: CALBAYOG_BLUE, icon: "📍" },
};

const SUBCATEGORY_ICONS: Record<string, string> = {
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

const KEYWORD_ICONS: Array<[string, string]> = [
  ["waterfall", "💧"],
  ["falls", "💧"],
  ["beach", "🏖️"],
  ["cave", "🪨"],
  ["spring", "♨️"],
  ["river", "🌊"],
  ["dive", "🤿"],
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

const normalizeLabel = (value: unknown): string =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

const getCategoryDesign = (category: string) => {
  if (CATEGORY_DESIGNS[category]) return CATEGORY_DESIGNS[category];

  const target = normalizeLabel(category);
  const key = Object.keys(CATEGORY_DESIGNS).find(
    (item) => normalizeLabel(item) === target,
  );

  return key ? CATEGORY_DESIGNS[key] : CATEGORY_DESIGNS.Other;
};

const getGlyph = (type: string, fallback: string): string => {
  const key = normalizeLabel(type);

  if (!key) return fallback;
  if (SUBCATEGORY_ICONS[key]) return SUBCATEGORY_ICONS[key];

  const match = KEYWORD_ICONS.find(([keyword]) => key.includes(keyword));

  return match ? match[1] : fallback;
};

const getSubtype = (dest: Destination): string => {
  const d: any = dest;
  const type = String(d?.attraction_type ?? "").trim();

  if (normalizeLabel(type) === "other") {
    return String(d?.other_attraction_type ?? "").trim() || "Other";
  }

  return type;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const BUILDING_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-4h6v4"/><path d="M8 9h.01M12 9h.01M16 9h.01M8 12h.01M12 12h.01M16 12h.01"/></svg>`;

const UTENSILS_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C2410C" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>`;

const createStopIcon = (dest: Destination, order: number) => {
  const kind = getStopKind(dest);
  const d: any = dest;

  let color = CALBAYOG_BLUE;
  let inner = "";

  if (kind === "stay") {
    color = "#2563EB";
    inner = BUILDING_SVG;
  } else if (kind === "food") {
    color = "#C2410C";
    inner = UTENSILS_SVG;
  } else {
    const design = getCategoryDesign(String(d?.category ?? "Other"));
    color = design.color;
    inner = escapeHtml(getGlyph(getSubtype(dest), design.icon));
  }

  return L.divIcon({
    className: "prm-marker",
    html: `
      <div class="prm-shell">
        <div class="prm-pin" style="background:${color}"></div>
        <div class="prm-icon">${inner}</div>
        <div class="prm-badge">${order}</div>
      </div>
    `,
    iconSize: [44, 52],
    iconAnchor: [22, 49],
    popupAnchor: [0, -47],
    tooltipAnchor: [0, -43],
  });
};

const createLegIcon = (label: string, estimated: boolean) =>
  L.divIcon({
    className: "prm-leg-wrap",
    html: `<div class="prm-leg${estimated ? " est" : ""}">${escapeHtml(label)}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });

/* =========================================================
   MAP HELPERS
========================================================= */

const FitRoute: React.FC<{ points: Array<[number, number]>; signature: string }> = ({
  points,
  signature,
}) => {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) {
      map.setView(DEFAULT_CENTER, 12, { animate: false });
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 15, { animate: false });
      return;
    }

    map.fitBounds(L.latLngBounds(points), {
      padding: [46, 46],
      maxZoom: 16,
      animate: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, signature]);

  return null;
};

/* Keeps Leaflet sized correctly (fixes a "half" map inside modals / cards) */
const MapResizeFix: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();

    const refresh = () => map.invalidateSize({ animate: false });

    const timer = window.setTimeout(refresh, 60);

    let observer: ResizeObserver | null = null;

    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(refresh);
      observer.observe(container);
    }

    window.addEventListener("resize", refresh);
    window.addEventListener("orientationchange", refresh);

    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
      window.removeEventListener("resize", refresh);
      window.removeEventListener("orientationchange", refresh);
    };
  }, [map]);

  return null;
};

/* Pinch / ctrl+wheel on the map zooms ONLY the map, never the whole page */
const MapGestureGuard: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    const element = map.getContainer();

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) event.preventDefault();
    };

    const stop = (event: Event) => event.preventDefault();

    element.addEventListener("wheel", onWheel, { passive: false });

    const gestures = ["gesturestart", "gesturechange", "gestureend"];
    gestures.forEach((name) => element.addEventListener(name, stop));

    return () => {
      element.removeEventListener("wheel", onWheel);
      gestures.forEach((name) => element.removeEventListener(name, stop));
    };
  }, [map]);

  return null;
};

const MapScaleControl: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    const control = L.control.scale({
      imperial: false,
      metric: true,
      position: "bottomleft",
      maxWidth: 110,
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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, [map]);

  return (
    <div className="leaflet-control leaflet-bar prm-locate">
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

/* =========================================================
   COMPONENT
========================================================= */

interface DayRouteMapProps {
  destinations: Destination[];
  /** road legs between consecutive stops (index i = stop i to stop i+1) */
  legs?: Array<RoadLeg | null>;
  /** fill the parent instead of using a fixed height */
  large?: boolean;
}

interface MapStop {
  dest: Destination;
  order: number;
  lat: number;
  lng: number;
}

const formatKm = (km: number) => `${(Math.round(km * 10) / 10).toFixed(1)} km`;

const DayRouteMap: React.FC<DayRouteMapProps> = ({
  destinations,
  legs,
  large = false,
}) => {
  const stops = useMemo<MapStop[]>(
    () =>
      destinations
        .map((dest, index) => {
          const point = getStopPoint(dest);
          return point ? { dest, order: index + 1, lat: point.lat, lng: point.lng } : null;
        })
        .filter(Boolean) as MapStop[],
    [destinations],
  );

  const icons = useMemo(
    () => new Map(stops.map((stop) => [`${stop.dest.id}-${stop.order}`, createStopIcon(stop.dest, stop.order)])),
    [stops],
  );

  /* A line for every pair of stops: the real road when known */
  const segments = useMemo(() => {
    const list: Array<{
      key: string;
      positions: Array<[number, number]>;
      leg: RoadLeg | null;
      mid: [number, number];
    }> = [];

    for (let index = 0; index < stops.length - 1; index += 1) {
      const a = stops[index];
      const b = stops[index + 1];

      // The leg list is aligned with the day's stops, so find it by position.
      const leg = b.order === a.order + 1 ? (legs?.[a.order - 1] ?? null) : null;

      const positions: Array<[number, number]> =
        leg && leg.geometry.length > 1
          ? leg.geometry
          : [
              [a.lat, a.lng],
              [b.lat, b.lng],
            ];

      const mid = positions[Math.floor(positions.length / 2)];

      list.push({ key: `${a.dest.id}-${b.dest.id}-${index}`, positions, leg, mid });
    }

    return list;
  }, [stops, legs]);

  const totalKm = segments.reduce((sum, segment) => sum + (segment.leg?.km ?? 0), 0);
  const hasEstimate = segments.some((segment) => !segment.leg || segment.leg.estimated);

  const fitPoints = useMemo(() => {
    const points: Array<[number, number]> = [];

    stops.forEach((stop) => points.push([stop.lat, stop.lng]));

    segments.forEach((segment) => {
      segment.positions.forEach((position) => points.push(position));
    });

    return points;
  }, [stops, segments]);

  const signature = useMemo(
    () => `${stops.map((stop) => `${stop.dest.id}:${stop.lat}:${stop.lng}`).join("|")}#${segments.length}#${segments.filter((s) => s.leg && !s.leg.estimated).length}`,
    [stops, segments],
  );

  if (stops.length === 0) {
    return (
      <div className="prm-empty">
        <style>{styles}</style>
        None of the stops on this day have a saved map location yet.
      </div>
    );
  }

  return (
    <div className={`prm-outer ${large ? "prm-large" : ""}`}>
      <style>{styles}</style>

      <div className="prm-wrap">
        <MapContainer
          center={[stops[0].lat, stops[0].lng]}
          zoom={14}
          scrollWheelZoom
          dragging
          touchZoom
          doubleClickZoom
          boxZoom
          keyboard
          zoomControl
          className="prm-map"
        >
          <FitRoute points={fitPoints} signature={signature} />
          <MapResizeFix />
          <MapGestureGuard />
          <MapScaleControl />

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

          {/* ROUTE LINES (white casing + colored road line) */}

          {segments.map((segment) => (
            <React.Fragment key={segment.key}>
              <Polyline
                positions={segment.positions}
                pathOptions={{
                  color: "#ffffff",
                  weight: 9,
                  opacity: 0.95,
                  lineCap: "round",
                  lineJoin: "round",
                }}
                interactive={false}
              />
              <Polyline
                positions={segment.positions}
                pathOptions={{
                  color: CALBAYOG_BLUE,
                  weight: 5,
                  opacity: segment.leg && !segment.leg.estimated ? 0.9 : 0.6,
                  dashArray: segment.leg && !segment.leg.estimated ? undefined : "8 8",
                  lineCap: "round",
                  lineJoin: "round",
                }}
                interactive={false}
              />
            </React.Fragment>
          ))}

          {/* DISTANCE ON EACH LEG */}

          {segments.map((segment) =>
            segment.leg ? (
              <Marker
                key={`leg-${segment.key}`}
                position={segment.mid}
                icon={createLegIcon(
                  `${segment.leg.estimated ? "~" : ""}${formatKm(segment.leg.km)}`,
                  segment.leg.estimated,
                )}
                interactive={false}
                keyboard={false}
                zIndexOffset={-200}
              />
            ) : null,
          )}

          {/* PINS (numbered, named, categorized) */}

          {stops.map((stop) => {
            const d: any = stop.dest;
            const kind = getStopKind(stop.dest);
            const subtype = getSubtype(stop.dest);
            const kindLabel =
              kind === "food" ? "Restaurant" : kind === "stay" ? "Accommodation" : "Attraction";

            return (
              <Marker
                key={`${stop.dest.id}-${stop.order}`}
                position={[stop.lat, stop.lng]}
                icon={icons.get(`${stop.dest.id}-${stop.order}`)}
                zIndexOffset={100 + stop.order}
              >
                <Tooltip
                  permanent
                  direction="top"
                  offset={[0, -4]}
                  opacity={1}
                  className="prm-label"
                >
                  <span className="prm-label-name">{stop.dest.name}</span>
                  {subtype && <span className="prm-label-sub">{subtype}</span>}
                </Tooltip>

                <Popup>
                  <div className="prm-popup">
                    <div className="prm-popup-badge">
                      Stop {stop.order} · {kindLabel}
                    </div>
                    <h3>{stop.dest.name}</h3>
                    {(d?.category || subtype) && (
                      <p className="prm-popup-cat">
                        {[kind === "attraction" ? d?.category : "", subtype]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    )}
                    {stop.dest.location_address && (
                      <p className="prm-popup-addr">{stop.dest.location_address}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {!large && (
        <div className="prm-note">
          {totalKm > 0
            ? `${hasEstimate ? "About " : ""}${formatKm(totalKm)} by road for this day. `
            : "Calculating road distances... "}
          Distances follow actual roads, not straight lines.
        </div>
      )}
    </div>
  );
};

/* =========================================================
   STYLES
========================================================= */

const styles = `
.prm-outer { width: 100%; }
.prm-outer.prm-large { height: 100%; }

.prm-wrap {
  position: relative;
  isolation: isolate;
  width: 100%;
  height: 320px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
  border-radius: 14px;
  background: #eef1f5;
}

.prm-large .prm-wrap {
  height: 100%;
  border: 0;
  border-radius: 0;
}

.prm-map {
  width: 100%;
  height: 100%;
  z-index: 1;
  touch-action: none;
  overscroll-behavior: contain;
}

.prm-empty {
  padding: 22px 16px;
  border: 1px dashed #dfe3ea;
  border-radius: 14px;
  background: #fafbfc;
  color: #777f8a;
  font-family: "Nunito", sans-serif;
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.6;
  text-align: center;
}

.prm-note {
  padding: 7px 10px;
  background: #fafbfb;
  border-radius: 0 0 12px 12px;
  color: #77807a;
  font-family: "Nunito", sans-serif;
  font-size: 0.6rem;
  font-weight: 700;
  line-height: 1.45;
}

.prm-marker,
.prm-leg-wrap {
  background: transparent !important;
  border: 0 !important;
}

.prm-shell {
  position: relative;
  width: 44px;
  height: 52px;
  filter: drop-shadow(0 3px 4px rgba(15, 23, 42, 0.30));
}

.prm-pin {
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

.prm-icon {
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
  font-size: 14px;
  line-height: 1;
}

.prm-badge {
  position: absolute;
  top: -3px;
  right: -1px;
  min-width: 19px;
  height: 19px;
  padding: 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
  border-radius: 999px;
  background: #20263a;
  color: #fff;
  font-family: "Nunito", "Poppins", sans-serif;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
}

.leaflet-tooltip.prm-label {
  max-width: 190px;
  padding: 5px 8px;
  border: 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  color: #202020;
  box-shadow: 0 3px 12px rgba(15, 23, 42, 0.2);
  font-family: "Nunito", "Poppins", "Segoe UI", sans-serif;
  font-size: 0.6rem;
  line-height: 1.2;
  text-align: center;
  pointer-events: none;
}

.leaflet-tooltip-top.prm-label::before {
  border-top-color: rgba(255, 255, 255, 0.96);
}

.prm-label-name,
.prm-label-sub {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prm-label-name { font-weight: 800; color: #222; }

.prm-label-sub {
  margin-top: 2px;
  color: #666;
  font-size: 0.54rem;
  font-weight: 600;
}

.prm-wrap .leaflet-tooltip.prm-label {
  max-width: 140px;
}

.prm-leg {
  position: absolute;
  transform: translate(-50%, -50%);
  padding: 3px 8px;
  border: 2px solid #fff;
  border-radius: 999px;
  background: ${CALBAYOG_BLUE};
  color: #fff;
  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.28);
  font-family: "Nunito", "Poppins", sans-serif;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.2;
  white-space: nowrap;
  pointer-events: none;
}

.prm-leg.est { background: #6b7185; }

.prm-locate { margin-top: 10px !important; border: 0 !important; overflow: hidden; border-radius: 10px; box-shadow: 0 3px 14px rgba(20, 29, 57, 0.18); }

.prm-locate button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: #fff;
  color: ${CALBAYOG_BLUE};
  font-size: 18px;
  font-weight: 900;
  line-height: 1;
  cursor: pointer;
}

.prm-locate button:hover { background: #f4f5f7; }
.prm-locate button:disabled { cursor: wait; opacity: 0.65; }

.prm-wrap .leaflet-control-layers {
  border: 0;
  border-radius: 10px;
  box-shadow: 0 3px 14px rgba(20, 29, 57, 0.18);
}

.prm-wrap .leaflet-control-zoom,
.prm-wrap .leaflet-control-scale-line {
  box-shadow: 0 3px 14px rgba(20, 29, 57, 0.18);
}

.prm-wrap .leaflet-control-zoom a,
.prm-wrap .leaflet-control-layers-toggle {
  width: 32px;
  height: 32px;
  line-height: 32px;
}

.prm-popup { min-width: 180px; max-width: 250px; font-family: "Nunito", "Poppins", sans-serif; }

.prm-popup-badge {
  display: inline-block;
  margin-bottom: 6px;
  padding: 4px 8px;
  border-radius: 999px;
  background: #eef0ff;
  color: ${CALBAYOG_BLUE};
  font-size: 0.55rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.prm-popup h3 { margin: 0; color: #20232a; font-size: 0.78rem; font-weight: 900; line-height: 1.3; }
.prm-popup-cat { margin: 4px 0 0; color: #747c87; font-size: 0.6rem; font-weight: 800; }
.prm-popup-addr { margin: 7px 0 0; color: #686f79; font-size: 0.61rem; font-weight: 700; line-height: 1.5; }

@media (max-width: 767.98px) {
  .prm-wrap { height: 300px; border-radius: 12px; }
  .prm-large .prm-wrap { height: 100%; border-radius: 0; }
}

@media (max-width: 479.98px) {
  .prm-wrap { height: 280px; }
  .leaflet-tooltip.prm-label { max-width: 120px; padding: 3px 6px; font-size: 0.56rem; }
  .prm-badge { min-width: 17px; height: 17px; font-size: 9px; }
}
`;

export default DayRouteMap;
