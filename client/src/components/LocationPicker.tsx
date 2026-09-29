import { useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default marker icon when using React/Vite
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

interface LocationPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (location: {
    latitude: number;
    longitude: number;
  }) => void;
}

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
}: {
  latitude: number;
  longitude: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView([latitude, longitude]);
  }, [map, latitude, longitude]);

  return null;
}

export default function LocationPicker({
  latitude,
  longitude,
  onChange,
}: LocationPickerProps) {
  const defaultLatitude = 12.0668;
  const defaultLongitude = 124.6041;

  const [position, setPosition] = useState<[number, number]>([
    latitude ?? defaultLatitude,
    longitude ?? defaultLongitude,
  ]);

  useEffect(() => {
    if (
      typeof latitude === "number" &&
      typeof longitude === "number"
    ) {
      setPosition([latitude, longitude]);
    }
  }, [latitude, longitude]);

  const handleLocationChange = (lat: number, lng: number) => {
    setPosition([lat, lng]);

    onChange({
      latitude: lat,
      longitude: lng,
    });
  };

  return (
    <div>
      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom={true}
        style={{
          height: "350px",
          width: "100%",
          borderRadius: "10px",
        }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapCenter
          latitude={position[0]}
          longitude={position[1]}
        />

        <MapClickHandler
          onLocationChange={handleLocationChange}
        />

        <Marker
          position={position}
          icon={markerIcon}
          draggable={true}
          eventHandlers={{
            dragend: (event) => {
              const marker = event.target;
              const location = marker.getLatLng();

              handleLocationChange(
                location.lat,
                location.lng
              );
            },
          }}
        />
      </MapContainer>

      <div className="mt-2 small text-muted">
        <strong>Latitude:</strong> {position[0].toFixed(6)}
        {" | "}
        <strong>Longitude:</strong> {position[1].toFixed(6)}
      </div>
    </div>
  );
}
