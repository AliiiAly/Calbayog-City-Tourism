// src/components/DayRouteMap.tsx
// One itinerary day on the same Leaflet setup used by LocationPicker
// (Street / Satellite / Terrain layers). Numbered pins + a dashed route line.

import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { Destination } from "../types";
import { getCoords } from "../utils/itineraryUtils";

const BRAND_BLUE = "#2D3195";
const DEFAULT_CENTER: [number, number] = [12.0668, 124.6041];

type MapLayer = "street" | "satellite" | "terrain";

const tileLayers: Record<MapLayer, { url: string; attribution: string }> = {
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

const SATELLITE_LABELS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
const SATELLITE_ROADS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}";

const numberIcon = (n: number) =>
  L.divIcon({
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -14],
    html: `<div style="width:30px;height:30px;border-radius:50%;background:${BRAND_BLUE};color:#fff;display:flex;align-items:center;justify-content:center;font:800 13px Nunito,sans-serif;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);">${n}</div>`,
  });

const FitToStops: React.FC<{ points: [number, number][] }> = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    const t = window.setTimeout(() => {
      map.invalidateSize();
      if (points.length === 0) return;
      if (points.length === 1) {
        map.setView(points[0], 15);
        return;
      }
      map.fitBounds(L.latLngBounds(points), { padding: [34, 34] });
    }, 120);
    return () => window.clearTimeout(t);
  }, [map, points]);

  return null;
};

interface Props {
  destinations: Destination[];
  height?: number;
}

const DayRouteMap: React.FC<Props> = ({ destinations, height = 260 }) => {
  const [layer, setLayer] = useState<MapLayer>("street");

  const stops = destinations
    .map((dest, index) => ({ dest, index, coords: getCoords(dest) }))
    .filter((s) => s.coords);

  const points = stops.map(
    (s) => [s.coords!.lat, s.coords!.lng] as [number, number],
  );
  const tiles = tileLayers[layer];

  return (
    <div className="planner-map-wrap">
      <div className="planner-map-layers">
        {(["street", "satellite", "terrain"] as MapLayer[]).map((value) => (
          <button
            key={value}
            type="button"
            className={layer === value ? "active" : ""}
            onClick={() => setLayer(value)}
          >
            {value[0].toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ height, borderRadius: 14, overflow: "hidden" }}>
        <MapContainer
          center={points[0] || DEFAULT_CENTER}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            key={layer}
            url={tiles.url}
            attribution={tiles.attribution}
          />
          {layer === "satellite" && (
            <>
              <TileLayer key="sat-places" url={SATELLITE_LABELS_URL} zIndex={2} />
              <TileLayer key="sat-roads" url={SATELLITE_ROADS_URL} zIndex={3} />
            </>
          )}

          <FitToStops points={points} />

          {points.length > 1 && (
            <Polyline
              positions={points}
              pathOptions={{
                color: layer === "street" ? BRAND_BLUE : "#FFB71B",
                weight: 4,
                opacity: 0.85,
                dashArray: "8 8",
              }}
            />
          )}

          {stops.map(({ dest, index, coords }) => (
            <Marker
              key={dest.id}
              position={[coords!.lat, coords!.lng]}
              icon={numberIcon(index + 1)}
            >
              <Popup>
                <strong>{dest.name}</strong>
                <br />
                {(dest as any).attraction_type || dest.category}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {stops.length < destinations.length && (
        <div className="planner-map-note">
          {destinations.length - stops.length} stop(s) have no saved map
          location and are not shown.
        </div>
      )}
    </div>
  );
};

export default DayRouteMap;
