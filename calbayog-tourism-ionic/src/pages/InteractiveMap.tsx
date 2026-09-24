import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  LayersControl,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import { Button, Offcanvas, Badge, Spinner } from "react-bootstrap";
import { getDestinations, clearCache } from "../services/api";
import { Destination } from "../types";

const CALBAYOG_CENTER: [number, number] = [12.0744, 124.005];
const CALBAYOG_BOUNDS: [[number, number], [number, number]] = [
  [11.95, 123.85], // Southwest corner (Calbayog City proper)
  [12.2, 124.15], // Northeast corner (Calbayog City proper)
];

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
    html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);transform:rotate(-45deg);"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
    className: "",
  });

const GpsButton: React.FC = () => {
  const map = useMap();
  const locate = () => {
    map.locate({ setView: true, maxZoom: 15 });
  };
  return (
    <button
      onClick={locate}
      style={{
        position: "absolute",
        bottom: 140,
        right: 20,
        zIndex: 1000,
        background: "#fff",
        border: "none",
        borderRadius: "50%",
        width: 60,
        height: 60,
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        fontSize: "1.6rem",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        touchAction: "manipulation",
      }}
      title="Go to my location"
    >
      🎯
    </button>
  );
};

const InteractiveMap: React.FC = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    new Set(),
  );
  const [selected, setSelected] = useState<Destination | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const categories = [
    "Waterfalls",
    "Beaches",
    "Heritage",
    "Hotels",
    "Food",
    "Events",
    "Transport",
    "Nature",
  ];

  useEffect(() => {
    clearCache("destinations");
    getDestinations()
      .then((r) => {
        const data = Array.isArray(r.data) ? r.data : [];
        setDestinations(data);
        setActiveCategories(new Set(data.map((d: Destination) => d.category)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleCategory = (cat: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const filtered = Array.isArray(destinations)
    ? destinations.filter((d) => activeCategories.has(d.category))
    : [];

  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        touchAction: "none",
      }}
    >
      {/* Filter Bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(8px)",
          padding: "10px 12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          touchAction: "none",
        }}
      >
        <div
          className="d-flex gap-2 overflow-auto"
          style={{
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-y",
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              style={{
                whiteSpace: "nowrap",
                padding: "12px 20px",
                borderRadius: 24,
                border: `2px solid ${categoryColors[cat] || "#aaa"}`,
                background: activeCategories.has(cat)
                  ? categoryColors[cat] || "#aaa"
                  : "transparent",
                color: activeCategories.has(cat)
                  ? "#fff"
                  : categoryColors[cat] || "#aaa",
                fontSize: "0.95rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
                flexShrink: 0,
                touchAction: "manipulation",
                minWidth: "max-content",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="d-flex align-items-center justify-content-center h-100">
          <Spinner
            animation="border"
            style={{ color: "var(--tropical-green)" }}
          />
        </div>
      ) : (
        <MapContainer
          center={CALBAYOG_CENTER}
          zoom={13}
          style={{
            height: "100%",
            width: "100%",
            marginTop: 0,
            touchAction: "none",
          }}
          scrollWheelZoom
          doubleClickZoom
          touchZoom
          minZoom={11}
          maxZoom={17}
        >
          <ZoomControl position="topleft" />
          <LayersControl position="topleft">
            <LayersControl.BaseLayer name="Street Map">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer checked name="Satellite">
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
          <GpsButton />
          {filtered.map((dest) => (
            <Marker
              key={dest.id}
              position={[dest.location_lat, dest.location_lng]}
              icon={makeIcon(categoryColors[dest.category] || "#555")}
              eventHandlers={{
                click: () => {
                  setSelected(dest);
                  setShowSheet(true);
                },
              }}
            >
              <Popup>
                <strong>{dest.name}</strong>
                <br />
                <span style={{ fontSize: "0.8rem", color: "#666" }}>
                  {dest.category}
                </span>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}

      {/* Bottom Sheet */}
      <Offcanvas
        show={showSheet}
        onHide={() => setShowSheet(false)}
        placement="bottom"
        style={{
          height: "auto",
          maxHeight: "70vh",
          borderRadius: "16px 16px 0 0",
        }}
      >
        {selected && (
          <>
            <Offcanvas.Header closeButton className="pb-1">
              <div>
                <Badge
                  style={{
                    background:
                      categoryColors[selected.category] ||
                      "var(--tropical-green)",
                    fontSize: "0.8rem",
                    padding: "6px 12px",
                  }}
                >
                  {selected.category}
                </Badge>
              </div>
            </Offcanvas.Header>
            <Offcanvas.Body className="pt-1">
              <div className="d-flex gap-3">
                {selected.images?.[0] && (
                  <img
                    src={selected.images[0]}
                    alt={selected.name}
                    style={{
                      width: 110,
                      height: 100,
                      objectFit: "cover",
                      borderRadius: 12,
                      flexShrink: 0,
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h5
                    className="fw-bold mb-1"
                    style={{ fontFamily: "Poppins, serif", fontSize: "1.3rem" }}
                  >
                    {selected.name}
                  </h5>
                  {selected.location_address && (
                    <p
                      className="text-muted mb-1"
                      style={{ fontSize: "0.9rem" }}
                    >
                      📍 {selected.location_address}
                    </p>
                  )}
                  <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                    {(selected.short_description || selected.description).slice(
                      0,
                      120,
                    )}
                    ...
                  </p>
                </div>
              </div>
              <div className="d-flex gap-2 mt-3 flex-wrap">
                <Link
                  to={`/destinations/${selected.id}`}
                  className="btn btn-primary flex-fill"
                  style={{
                    fontSize: "1rem",
                    padding: "12px 18px",
                    touchAction: "manipulation",
                  }}
                >
                  View Details →
                </Link>
                {selected.location_lat && selected.location_lng && (
                  <>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selected.location_lat},${selected.location_lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-success"
                      style={{
                        fontSize: "1rem",
                        padding: "12px 18px",
                        touchAction: "manipulation",
                      }}
                    >
                      🧭 Navigate
                    </a>
                    <a
                      href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selected.location_lat},${selected.location_lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-info"
                      style={{
                        fontSize: "1rem",
                        padding: "12px 18px",
                        touchAction: "manipulation",
                      }}
                    >
                      📷 Street View
                    </a>
                  </>
                )}
                {selected.contact_phone && (
                  <a
                    href={`tel:${selected.contact_phone}`}
                    className="btn btn-outline-primary"
                    style={{
                      fontSize: "1rem",
                      padding: "12px 18px",
                      touchAction: "manipulation",
                    }}
                  >
                    📞 Call
                  </a>
                )}
              </div>
            </Offcanvas.Body>
          </>
        )}
      </Offcanvas>
    </div>
  );
};

export default InteractiveMap;
