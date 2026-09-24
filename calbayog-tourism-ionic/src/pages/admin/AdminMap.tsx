import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import { Spinner, Card, Badge } from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";
import { useDarkMode } from "../../context/DarkModeContext";
import { getDestinations } from "../../services/api";
import { Destination } from "../../types";

const CALBAYOG_CENTER: [number, number] = [12.0744, 124.005];

const categoryColors: Record<string, string> = {
  Waterfalls: "#0077B6",
  Beaches: "#48CAE4",
  Heritage: "#F4A226",
  Hotels: "#1A7A4A",
  Food: "#e63946",
  Events: "#7b2d8b",
  Transport: "#6d4c41",
  Nature: "#2d6a4f",
  Other: "#555",
};

const makeIcon = (color: string) =>
  L.divIcon({
    html: `<div style="width:32px;height:32px;border-radius:50% 50% 50% 0;background:${color};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);transform:rotate(-45deg);"></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    className: "",
  });

const AdminMap: React.FC = () => {
  const { darkMode } = useDarkMode();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Destination | null>(null);

  useEffect(() => {
    getDestinations()
      .then((r) => {
        const data = Array.isArray(r.data) ? r.data : [];
        setDestinations(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = destinations.filter((d) => d.location_lat && d.location_lng);

  return (
    <AdminLayout>
      {/* Header Section */}
      <div
        style={{
          background: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
          borderRadius: "16px",
          padding: "2rem",
          marginBottom: "2rem",
          color: "#fff",
          boxShadow: darkMode
            ? "0 8px 24px rgba(0,0,0,0.3)"
            : "0 8px 24px rgba(26, 95, 74, 0.25)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-50%",
            right: "-10%",
            width: "300px",
            height: "300px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2
              className="fw-bold mb-2"
              style={{
                fontFamily: "Poppins, serif",
                fontSize: "2rem",
                marginBottom: "0.5rem",
              }}
            >
              🗺️ Destinations Map
            </h2>
            <p style={{ fontSize: "0.95rem", opacity: 0.9, marginBottom: "0" }}>
              View all destinations on the map (Tarangban Falls, Bangon Falls,
              etc.)
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "2rem", fontWeight: 700 }}>
              {filtered.length}
            </div>
            <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>Locations</div>
          </div>
        </div>
      </div>

      {/* Map Card */}
      <div
        style={{
          background: darkMode ? "#1e1e2e" : "#fff",
          borderRadius: "16px",
          padding: "1.5rem",
          boxShadow: darkMode
            ? "0 4px 16px rgba(0,0,0,0.3)"
            : "0 4px 16px rgba(0,0,0,0.08)",
        }}
      >
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" style={{ color: "#1a5f4a" }} />
            <p
              className="mt-3"
              style={{ color: darkMode ? "#e0e0e0" : "#495057" }}
            >
              Loading map...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5">
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🗺️</div>
            <h5
              style={{
                color: darkMode ? "#e0e0e0" : "#495057",
                marginBottom: "0.5rem",
              }}
            >
              No Destinations on Map
            </h5>
            <p style={{ color: darkMode ? "#b0b0c0" : "#6c757d" }}>
              Add destinations with location coordinates to see them on the map
            </p>
          </div>
        ) : (
          <div
            style={{
              height: "65vh",
              borderRadius: "12px",
              overflow: "hidden",
              minHeight: "400px",
            }}
          >
            <MapContainer
              center={CALBAYOG_CENTER}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom
              doubleClickZoom
            >
              <ZoomControl position="topleft" />
              <LayersControl position="topleft">
                <LayersControl.BaseLayer checked name="Street Map">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Satellite">
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                  />
                  <TileLayer
                    url="https://stamen-tiles-{s}.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://stamen.com">Stamen</a>'
                    opacity={0.7}
                  />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Terrain">
                  <TileLayer
                    url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
                  />
                </LayersControl.BaseLayer>
              </LayersControl>
              {filtered.map((dest) => (
                <Marker
                  key={dest.id}
                  position={[dest.location_lat, dest.location_lng]}
                  icon={makeIcon(categoryColors[dest.category] || "#555")}
                  eventHandlers={{
                    click: () => setSelected(dest),
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: "200px" }}>
                      <strong style={{ fontSize: "1rem" }}>{dest.name}</strong>
                      <br />
                      <Badge
                        style={{
                          background: categoryColors[dest.category] || "#555",
                          fontSize: "0.75rem",
                          padding: "4px 8px",
                          marginTop: "4px",
                        }}
                      >
                        {dest.category}
                      </Badge>
                      {dest.location_address && (
                        <p style={{ fontSize: "0.85rem", margin: "8px 0 0 0" }}>
                          📍 {dest.location_address}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}

        {/* Selected Destination Info */}
        {selected && (
          <Card
            className="mt-3 border-0"
            style={{
              background: darkMode ? "#2a2a3e" : "#f8f9fa",
              borderRadius: "12px",
              padding: "1.5rem",
            }}
          >
            <div className="d-flex gap-3">
              {selected.images?.[0] && (
                <img
                  src={selected.images[0]}
                  alt={selected.name}
                  style={{
                    width: 120,
                    height: 100,
                    objectFit: "cover",
                    borderRadius: 8,
                    flexShrink: 0,
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div className="d-flex justify-content-between align-items-start">
                  <h5
                    className="fw-bold mb-1"
                    style={{ color: darkMode ? "#e0e0e0" : "#212529" }}
                  >
                    {selected.name}
                  </h5>
                  <Badge
                    style={{
                      background: categoryColors[selected.category] || "#555",
                      fontSize: "0.75rem",
                      padding: "4px 8px",
                    }}
                  >
                    {selected.category}
                  </Badge>
                </div>
                {selected.location_address && (
                  <p className="text-muted mb-1" style={{ fontSize: "0.9rem" }}>
                    📍 {selected.location_address}
                  </p>
                )}
                <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
                  {(selected.short_description || selected.description).slice(
                    0,
                    150,
                  )}
                  ...
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminMap;
