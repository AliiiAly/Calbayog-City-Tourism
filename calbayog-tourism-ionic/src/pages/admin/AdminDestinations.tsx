import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Table,
  Button,
  Modal,
  Form,
  Badge,
  Spinner,
  Alert,
  Row,
  Col,
  Card,
  InputGroup,
  Dropdown,
} from "react-bootstrap";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  LayersControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  getDestinations,
  createDestination,
  updateDestination,
  deleteDestination,
  clearCache,
  uploadMultipleImages,
  createNotification,
} from "../../services/api";
import { Destination } from "../../types";
import { useDarkMode } from "../../context/DarkModeContext";

const CATEGORIES = [
  "Waterfalls",
  "Beaches",
  "Heritage",
  "Hotels",
  "Food",
  "Events",
  "Transport",
  "Nature",
  "Other",
];

// Category-specific designs
const CATEGORY_DESIGNS: Record<
  string,
  { icon: string; color: string; gradient: string; bgPattern: string }
> = {
  Waterfalls: {
    icon: "💧",
    color: "#1a5f4a",
    gradient: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
    bgPattern:
      "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231a5f4a' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
  },
  Beaches: {
    icon: "🏖️",
    color: "#1a5f4a",
    gradient: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
    bgPattern:
      "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231a5f4a' fill-opacity='0.05'%3E%3Cpath d='M30 30l-5-5h10l-5 5zm0 5l-5 5h10l-5-5zm5-10l5-5v10l-5-5zm-10 0l-5-5v10l5-5z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
  },
  Heritage: {
    icon: "🏛️",
    color: "#1a5f4a",
    gradient: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
    bgPattern:
      "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231a5f4a' fill-opacity='0.05'%3E%3Cpath d='M30 30l10-10-20 20 10 10zm0 0l-10 10 20 20-10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
  },
  Hotels: {
    icon: "🏨",
    color: "#1a5f4a",
    gradient: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
    bgPattern:
      "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231a5f4a' fill-opacity='0.05'%3E%3Crect x='0' y='0' width='30' height='30'/%3E%3Crect x='30' y='30' width='30' height='30'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
  },
  Food: {
    icon: "🍽️",
    color: "#1a5f4a",
    gradient: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
    bgPattern:
      "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231a5f4a' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='15'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
  },
  Events: {
    icon: "🎉",
    color: "#1a5f4a",
    gradient: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
    bgPattern:
      "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231a5f4a' fill-opacity='0.05'%3E%3Cpath d='M30 0l5 5-5 5-5-5 5-5zm0 30l5 5-5 5-5-5 5-5zm30-30l-5 5-5-5 5-5 5 5 5zM0 30l5-5 5 5-5 5-5-5z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
  },
  Transport: {
    icon: "🚌",
    color: "#1a5f4a",
    gradient: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
    bgPattern:
      "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231a5f4a' fill-opacity='0.05'%3E%3Cpath d='M0 30h60v2H0zM30 0v60h2V0z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
  },
  Nature: {
    icon: "🌿",
    color: "#1a5f4a",
    gradient: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
    bgPattern:
      "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231a5f4a' fill-opacity='0.05'%3E%3Cpath d='M30 0l30 30-30 30L0 30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
  },
  Other: {
    icon: "📍",
    color: "#1a5f4a",
    gradient: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
    bgPattern:
      "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231a5f4a' fill-opacity='0.05'%3E%3Crect x='0' y='0' width='60' height='60' rx='5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
  },
};
const EMPTY = {
  name: "",
  category: "Waterfalls",
  description: "",
  short_description: "",
  location_address: "",
  location_lat: 0,
  location_lng: 0,
  images: "",
  entrance_fee: "",
  opening_hours: "",
  getting_there: "",
  featured: false,
  tags: "",
  // Waterfalls specific
  waterfall_height: "",
  swimming_allowed: false,
  trekking_difficulty: "",
  // Beaches specific
  beach_type: "",
  best_season: "",
  // Heritage specific
  historical_period: "",
  significance: "",
  tour_guide_available: false,
  // Hotels specific
  room_types: "",
  amenities: "",
  price_range: "",
  contact_phone: "",
  contact_email: "",
  // Food specific
  cuisine_type: "",
  specialties: "",
  seating_capacity: "",
  // Events specific
  event_date: "",
  event_time: "",
  organizer: "",
  ticket_price: "",
  // Transport specific
  vehicle_type: "",
  schedule: "",
  fare: "",
  // Nature specific
  activities_allowed: "",
  best_season_nature: "",
  guide_required: false,
};

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker icons for different categories
const createCategoryIcon = (category: string) => {
  const colors: Record<string, string> = {
    Waterfalls: "#1a5f4a",
    Beaches: "#0077be",
    Heritage: "#8B4513",
    Hotels: "#9c27b0",
    Food: "#ff5722",
    Events: "#e91e63",
    Transport: "#607d8b",
    Nature: "#4caf50",
    Other: "#795548",
  };
  const color = colors[category] || "#1a5f4a";
  const icons: Record<string, string> = {
    Waterfalls: "💧",
    Beaches: "🏖️",
    Heritage: "🏛️",
    Hotels: "🏨",
    Food: "🍽️",
    Events: "🎉",
    Transport: "🚌",
    Nature: "🌿",
    Other: "📍",
  };
  const icon = icons[category] || "📍";

  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background: ${color};
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    ">${icon}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

// Selected location marker (red)
const selectedMarkerIcon = L.divIcon({
  className: "selected-marker",
  html: `<div style="
    background: #dc3545;
    color: white;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    border: 3px solid white;
    box-shadow: 0 2px 10px rgba(220,53,69,0.5);
    animation: pulse 1.5s infinite;
  ">📍</div>
  <style>
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
  </style>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

// Calbayog City center
const CALBAYOG_CENTER: [number, number] = [12.0686, 124.5972];

// Calbayog City bounds - limits the map to Calbayog area only
const CALBAYOG_BOUNDS: [[number, number], [number, number]] = [
  [11.85, 124.25], // Southwest corner (bottom-left)
  [12.35, 124.85], // Northeast corner (top-right)
];

// Map click handler component
const MapClickHandler: React.FC<{
  onMapClick: (lat: number, lng: number) => void;
}> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const AdminDestinations: React.FC = () => {
  const { darkMode } = useDarkMode();
  const [items, setItems] = useState<Destination[]>([]);
  const [filteredItems, setFilteredItems] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [editing, setEditing] = useState<Destination | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<
    [number, number] | null
  >(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [viewItem, setViewItem] = useState<Destination | null>(null);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showActiveModal, setShowActiveModal] = useState(false);

  const load = () => {
    setLoading(true);
    clearCache("destinations");
    getDestinations()
      .then((r) => {
        setItems(r.data);
        setFilteredItems(r.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let filtered = Array.isArray(items) ? items : [];
    if (searchTerm) {
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    if (categoryFilter !== "All") {
      filtered = filtered.filter((d) => d.category === categoryFilter);
    }
    if (featuredOnly) {
      filtered = filtered.filter((d) => d.featured);
    }
    setFilteredItems(filtered);
  }, [searchTerm, categoryFilter, featuredOnly, items]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setSelectedLocation(null);
    setImageFiles([]);
    setShowMapModal(true);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLocation([lat, lng]);
    setForm({ ...form, location_lat: lat, location_lng: lng });
    setShowMapModal(false);
    setShowModal(true);
  };

  const handleLocationInputClick = () => {
    setShowModal(false);
    setShowMapModal(true);
  };

  const openEdit = (d: Destination) => {
    setEditing(d);
    setForm({
      name: d.name,
      category: d.category,
      description: d.description,
      short_description: d.short_description || "",
      location_address: d.location_address || "",
      location_lat: d.location_lat || 0,
      location_lng: d.location_lng || 0,
      images: d.images?.join(", ") || "",
      entrance_fee: d.entrance_fee || "",
      opening_hours: d.opening_hours || "",
      getting_there: d.getting_there || "",
      featured: d.featured || false,
      tags: d.tags?.join(", ") || "",
      // Category-specific fields with defaults
      waterfall_height: (d as any).waterfall_height || "",
      swimming_allowed: (d as any).swimming_allowed || false,
      trekking_difficulty: (d as any).trekking_difficulty || "",
      beach_type: (d as any).beach_type || "",
      best_season: (d as any).best_season || "",
      historical_period: (d as any).historical_period || "",
      significance: (d as any).significance || "",
      tour_guide_available: (d as any).tour_guide_available || false,
      room_types: (d as any).room_types || "",
      amenities: (d as any).amenities || "",
      price_range: (d as any).price_range || "",
      contact_phone: (d as any).contact_phone || "",
      contact_email: (d as any).contact_email || "",
      cuisine_type: (d as any).cuisine_type || "",
      specialties: (d as any).specialties || "",
      seating_capacity: (d as any).seating_capacity || "",
      event_date: (d as any).event_date || "",
      event_time: (d as any).event_time || "",
      organizer: (d as any).organizer || "",
      ticket_price: (d as any).ticket_price || "",
      vehicle_type: (d as any).vehicle_type || "",
      schedule: (d as any).schedule || "",
      fare: (d as any).fare || "",
      activities_allowed: (d as any).activities_allowed || "",
      best_season_nature: (d as any).best_season_nature || "",
      guide_required: (d as any).guide_required || false,
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.description) {
      setError("Name and description are required.");
      return;
    }
    setSaving(true);
    setError("");
    setUploading(true);

    try {
      // Upload images if any
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        try {
          const uploadResponse = await uploadMultipleImages(imageFiles);
          imageUrls = uploadResponse.data.urls || [];
        } catch (uploadErr: any) {
          console.error("Image upload failed:", uploadErr);
          // Continue without images if upload fails
          setError("Image upload failed. Saving destination without images.");
        }
      } else if (form.images) {
        // Keep existing images if editing and no new files
        imageUrls = (form.images || "")
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
      }

      const payload: any = {
        name: form.name,
        category: form.category,
        description: form.description,
        short_description: form.short_description,
        location_address: form.location_address,
        location_lat: form.location_lat,
        location_lng: form.location_lng,
        images: imageUrls,
        entrance_fee: form.entrance_fee,
        opening_hours: form.opening_hours,
        getting_there: form.getting_there,
        featured: form.featured,
        tags: (form.tags || "")
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean),
      };

      // Add category-specific fields
      if (form.category === "Waterfalls") {
        payload.waterfall_height = form.waterfall_height;
        payload.swimming_allowed = form.swimming_allowed;
        payload.trekking_difficulty = form.trekking_difficulty;
      }
      if (form.category === "Beaches") {
        payload.beach_type = form.beach_type;
        payload.best_season = form.best_season;
      }
      if (form.category === "Heritage") {
        payload.historical_period = form.historical_period;
        payload.significance = form.significance;
        payload.tour_guide_available = form.tour_guide_available;
      }
      if (form.category === "Hotels") {
        payload.room_types = form.room_types;
        payload.amenities = form.amenities;
        payload.price_range = form.price_range;
        payload.contact_phone = form.contact_phone;
        payload.contact_email = form.contact_email;
      }
      if (form.category === "Food") {
        payload.cuisine_type = form.cuisine_type;
        payload.specialties = form.specialties;
        payload.seating_capacity = form.seating_capacity;
      }
      if (form.category === "Events") {
        payload.event_date = form.event_date;
        payload.event_time = form.event_time;
        payload.organizer = form.organizer;
        payload.ticket_price = form.ticket_price;
      }
      if (form.category === "Transport") {
        payload.vehicle_type = form.vehicle_type;
        payload.schedule = form.schedule;
        payload.fare = form.fare;
      }
      if (form.category === "Nature") {
        payload.activities_allowed = form.activities_allowed;
        payload.best_season_nature = form.best_season_nature;
        payload.guide_required = form.guide_required;
      }

      if (editing) {
        await updateDestination(editing.id, payload);
      } else {
        const created = await createDestination(payload);
        const newDestId = created?.data?._id || created?.data?.id;
        // Create notification for new destination
        try {
          await createNotification({
            userId: "all",
            type: "destination_added",
            title: "New Destination Added!",
            message: `Check out the new destination: ${form.name}`,
            data: {
              destinationId: newDestId,
              destinationName: form.name,
              category: form.category,
            },
          });
        } catch (notifErr) {
          console.error("Failed to create notification:", notifErr);
        }
      }
      clearCache("destinations");
      setShowModal(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to save.");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this destination?")) return;
    await deleteDestination(id).catch(() => {});
    clearCache("destinations");
    load();
  };

  const fc = (field: string, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Waterfalls: "#4FC3F7",
      Beaches: "#29B6F6",
      Heritage: "#FF7043",
      Hotels: "#66BB6A",
      Food: "#FFA726",
      Events: "#AB47BC",
      Transport: "#78909C",
      Nature: "#66BB6A",
      Other: "#90A4AE",
    };
    return colors[category] || "#90A4AE";
  };

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2
            className="fw-bold mb-1"
            style={{
              fontFamily: "Poppins, serif",
              color: darkMode ? "#4ade80" : "#1a5f4a",
            }}
          >
            🌿 Destinations
          </h2>
          <p
            style={{
              fontSize: "0.9rem",
              color: darkMode ? "#e0e0e0" : "#1a5f4a",
              marginBottom: 0,
              fontWeight: 500,
            }}
          >
            Manage all tourist destinations
          </p>
        </div>
        <Button
          variant="primary"
          onClick={openCreate}
          style={{
            background: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
            border: "none",
            padding: "10px 24px",
            fontWeight: 600,
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(26, 122, 74, 0.3)",
          }}
        >
          + Add Destination
        </Button>
      </div>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <Card
            className="border-0 h-100"
            style={{
              borderRadius: "12px",
              background: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
              color: "#fff",
              cursor: "pointer",
              transition: "transform 0.3s, box-shadow 0.3s",
            }}
            onClick={() => {
              setSearchTerm("");
              setCategoryFilter("All");
              setFeaturedOnly(false);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Card.Body className="py-3">
              <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>Total</div>
              <div style={{ fontSize: "2rem", fontWeight: 700 }}>
                {items.length}
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card
            className="border-0 h-100"
            style={{
              borderRadius: "12px",
              background: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",
              color: "#fff",
              cursor: "pointer",
              transition: "transform 0.3s, box-shadow 0.3s",
            }}
            onClick={() => {
              setSearchTerm("");
              setCategoryFilter("All");
              setFeaturedOnly(true);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Card.Body className="py-3">
              <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                Featured
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700 }}>
                {items.filter((d) => d.featured).length}
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card
            className="border-0 h-100"
            style={{
              borderRadius: "12px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              cursor: "pointer",
              transition: "transform 0.3s, box-shadow 0.3s",
            }}
            onClick={() => setShowCategoriesModal(true)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Card.Body className="py-3">
              <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                Categories
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700 }}>
                {new Set(items.map((d) => d.category)).size}
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card
            className="border-0 h-100"
            style={{
              borderRadius: "12px",
              background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
              color: "#fff",
              cursor: "pointer",
              transition: "transform 0.3s, box-shadow 0.3s",
            }}
            onClick={() => setShowActiveModal(true)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Card.Body className="py-3">
              <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>Active</div>
              <div style={{ fontSize: "2rem", fontWeight: 700 }}>
                {filteredItems.length}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search and Filter */}
      <Card
        className="border-0 mb-4"
        style={{
          borderRadius: "12px",
          boxShadow: darkMode
            ? "0 2px 8px rgba(0,0,0,0.3)"
            : "0 2px 8px rgba(0,0,0,0.06)",
          background: darkMode ? "#1e1e2e" : "#fff",
        }}
      >
        <Card.Body className="p-3">
          <Row className="g-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text
                  style={{
                    background: darkMode ? "#2a2a3e" : "#f8f9fa",
                    border: "none",
                    borderRadius: "8px 0 0 8px",
                    color: darkMode ? "#e0e0e0" : "#495057",
                  }}
                >
                  🔍
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search destinations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    border: "none",
                    borderRadius: "0 8px 8px 0",
                    background: darkMode ? "#2a2a3e" : "#f8f9fa",
                    color: darkMode ? "#e0e0e0" : "#212529",
                  }}
                />
              </InputGroup>
            </Col>
            <Col md={6}>
              <Dropdown>
                <Dropdown.Toggle
                  variant="outline-secondary"
                  style={{
                    borderRadius: "8px",
                    width: "100%",
                    border: `1px solid ${darkMode ? "#3a3a5e" : "#e0e0e0"}`,
                    background: darkMode ? "#2a2a3e" : "#fff",
                    color: darkMode ? "#e0e0e0" : "#212529",
                  }}
                >
                  {categoryFilter === "All" ? "All Categories" : categoryFilter}
                </Dropdown.Toggle>
                <Dropdown.Menu
                  style={{
                    width: "100%",
                    background: darkMode ? "#1e1e2e" : "#fff",
                    border: `1px solid ${darkMode ? "#3a3a5e" : "#e0e0e0"}`,
                  }}
                >
                  <Dropdown.Item
                    onClick={() => setCategoryFilter("All")}
                    style={{ color: darkMode ? "#e0e0e0" : "#212529" }}
                  >
                    All Categories
                  </Dropdown.Item>
                  {CATEGORIES.map((cat) => (
                    <Dropdown.Item
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      style={{ color: darkMode ? "#e0e0e0" : "#212529" }}
                    >
                      {cat}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="text-center py-5">
          <Spinner
            animation="border"
            style={{ color: darkMode ? "#4ade80" : "#1a5f4a" }}
          />
          <p
            className="text-muted mt-3"
            style={{ color: darkMode ? "#e0e0e0" : "#495057" }}
          >
            Loading destinations...
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div
          className="text-center py-5"
          style={{
            background: darkMode ? "#1e1e2e" : "#fff",
            borderRadius: "12px",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🌿</div>
          <p
            className="text-muted mb-0"
            style={{ color: darkMode ? "#e0e0e0" : "#495057", fontWeight: 600 }}
          >
            No destinations found
          </p>
        </div>
      ) : (
        <Row className="g-3 g-md-4">
          {filteredItems.map((d) => (
            <Col xs={12} sm={6} lg={4} xl={3} key={d.id}>
              <Card
                className="h-100 border-0"
                style={{
                  borderRadius: "16px",
                  boxShadow: darkMode
                    ? "0 4px 16px rgba(0,0,0,0.3)"
                    : "0 4px 16px rgba(0,0,0,0.08)",
                  background: darkMode ? "#1e1e2e" : "#fff",
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onClick={() => setViewItem(d)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = darkMode
                    ? "0 8px 24px rgba(0,0,0,0.4)"
                    : "0 8px 24px rgba(0,0,0,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = darkMode
                    ? "0 4px 16px rgba(0,0,0,0.3)"
                    : "0 4px 16px rgba(0,0,0,0.08)";
                }}
              >
                {d.images && d.images.length > 0 ? (
                  <img
                    src={d.images[0]}
                    alt={d.name}
                    style={{
                      height: 180,
                      width: "100%",
                      objectFit: "cover",
                      borderTopLeftRadius: "16px",
                      borderTopRightRadius: "16px",
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      height: 180,
                      background:
                        CATEGORY_DESIGNS[d.category]?.gradient ||
                        "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
                      borderTopLeftRadius: "16px",
                      borderTopRightRadius: "16px",
                      fontSize: "3rem",
                    }}
                  >
                    {CATEGORY_DESIGNS[d.category]?.icon || "📍"}
                  </div>
                )}
                <Card.Body className="p-3">
                  <div className="d-flex gap-1 flex-wrap mb-2">
                    <Badge
                      style={{
                        background: getCategoryColor(d.category),
                        fontSize: "0.7rem",
                        padding: "4px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      {d.category}
                    </Badge>
                    {d.featured && (
                      <Badge
                        style={{
                          background: "#FFD700",
                          color: "#000",
                          fontSize: "0.7rem",
                          padding: "4px 8px",
                          borderRadius: "6px",
                        }}
                      >
                        ⭐ Featured
                      </Badge>
                    )}
                  </div>
                  <h5
                    className="fw-bold mb-1"
                    style={{
                      fontFamily: "Poppins, serif",
                      fontSize: "1rem",
                      lineHeight: 1.3,
                      color: darkMode ? "#e0e0e0" : "#212529",
                    }}
                  >
                    {d.name}
                  </h5>
                  {d.short_description && (
                    <p
                      className="mb-2"
                      style={{
                        fontSize: "0.8rem",
                        lineHeight: 1.4,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        color: darkMode ? "#b0b0c0" : "#6c757d",
                      }}
                    >
                      {d.short_description}
                    </p>
                  )}
                  <p
                    className="mb-2"
                    style={{
                      fontSize: "0.75rem",
                      color: darkMode ? "#b0b0c0" : "#6c757d",
                    }}
                  >
                    📍 {d.location_address || "Calbayog City"}
                  </p>
                  <div className="d-flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(d);
                      }}
                      style={{
                        borderRadius: "6px",
                        fontWeight: 500,
                        padding: "6px 12px",
                        borderColor: "#4FC3F7",
                        color: "#4FC3F7",
                        flex: 1,
                      }}
                    >
                      ✏️ Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(d.id);
                      }}
                      style={{
                        borderRadius: "6px",
                        fontWeight: 500,
                        padding: "6px 12px",
                        borderColor: "#FF7043",
                        color: "#FF7043",
                        flex: 1,
                      }}
                    >
                      🗑️ Delete
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Map Modal for selecting location */}
      <Modal
        show={showMapModal}
        onHide={() => setShowMapModal(false)}
        size="xl"
        centered
      >
        <Modal.Header
          closeButton
          style={{ borderBottom: "2px solid #e9ecef", padding: "20px 24px" }}
        >
          <Modal.Title
            style={{ fontFamily: "Poppins, serif", fontWeight: 600 }}
          >
            📍 Select Location on Map
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{ padding: "0", height: "600px", position: "relative" }}
        >
          {/* Map View */}
          <MapContainer
            center={CALBAYOG_CENTER}
            zoom={12}
            minZoom={10}
            maxBounds={CALBAYOG_BOUNDS}
            maxBoundsViscosity={1.0}
            style={{ height: "100%", width: "100%" }}
          >
            <LayersControl position="topright">
              {/* Satellite with Labels - Google Hybrid (DEFAULT - shows barangay, streets, establishments) */}
              <LayersControl.BaseLayer checked name="�️ Satellite + Labels">
                <TileLayer
                  attribution="&copy; Google Maps"
                  url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                  maxZoom={21}
                />
              </LayersControl.BaseLayer>

              {/* Satellite View Only - Google */}
              <LayersControl.BaseLayer name="🛰️ Satellite Only">
                <TileLayer
                  attribution="&copy; Google Maps"
                  url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                  maxZoom={21}
                />
              </LayersControl.BaseLayer>

              {/* Street Map with all labels */}
              <LayersControl.BaseLayer name="🗺️ Street Map">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={19}
                />
              </LayersControl.BaseLayer>

              {/* Google Roads with Labels */}
              <LayersControl.BaseLayer name="�️ Roads + Labels">
                <TileLayer
                  attribution="&copy; Google Maps"
                  url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                  maxZoom={21}
                />
              </LayersControl.BaseLayer>

              {/* Terrain View */}
              <LayersControl.BaseLayer name="⛰️ Terrain">
                <TileLayer
                  attribution="&copy; Google Maps"
                  url="https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}"
                  maxZoom={21}
                />
              </LayersControl.BaseLayer>
            </LayersControl>

            <MapClickHandler onMapClick={handleMapClick} />

            {/* Show all existing destinations */}
            {items.map(
              (dest) =>
                dest.location_lat &&
                dest.location_lng && (
                  <Marker
                    key={dest.id}
                    position={[dest.location_lat, dest.location_lng]}
                    icon={createCategoryIcon(dest.category)}
                  />
                ),
            )}

            {/* Selected location marker (for new destination) */}
            {selectedLocation && (
              <Marker position={selectedLocation} icon={selectedMarkerIcon}>
                <Popup>
                  <div style={{ textAlign: "center" }}>
                    <strong style={{ color: "#dc3545" }}>
                      📍 New Location
                    </strong>
                    <p
                      style={{
                        margin: "4px 0 0 0",
                        fontSize: "0.8rem",
                        color: "#666",
                      }}
                    >
                      Lat: {selectedLocation[0].toFixed(6)}
                      <br />
                      Lng: {selectedLocation[1].toFixed(6)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Map Legend */}
          <div
            style={{
              position: "absolute",
              bottom: "20px",
              left: "10px",
              background: "white",
              padding: "10px 14px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              zIndex: 1000,
              fontSize: "0.8rem",
            }}
          >
            <div
              style={{ fontWeight: 600, marginBottom: "6px", color: "#333" }}
            >
              Legend
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                maxWidth: "300px",
              }}
            >
              {CATEGORIES.map((cat) => (
                <span
                  key={cat}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "2px 6px",
                    background: "#f8f9fa",
                    borderRadius: "4px",
                  }}
                >
                  {CATEGORY_DESIGNS[cat]?.icon} {cat}
                </span>
              ))}
            </div>
            <div
              style={{ marginTop: "6px", color: "#dc3545", fontWeight: 500 }}
            >
              📍 = Selected/New Location
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer
          style={{ borderTop: "2px solid #e9ecef", padding: "20px 24px" }}
        >
          <div className="d-flex justify-content-between align-items-center w-100">
            <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
              Click anywhere on the map to select the destination location
            </p>
            {selectedLocation && (
              <Button
                variant="outline-success"
                href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selectedLocation[0]},${selectedLocation[1]}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  borderRadius: "6px",
                  fontWeight: 500,
                  padding: "8px 16px",
                }}
              >
                � Open in Google Maps
              </Button>
            )}
          </div>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setShowMapModal(true);
        }}
        size="lg"
        centered
      >
        <Modal.Header
          closeButton
          style={{
            borderBottom: "2px solid #e9ecef",
            padding: "20px 24px",
            background:
              CATEGORY_DESIGNS[form.category]?.gradient ||
              "linear-gradient(135deg, var(--tropical-green), #2E7D32)",
            color: "#fff",
          }}
        >
          <Modal.Title
            style={{
              fontFamily: "Poppins, serif",
              fontWeight: 600,
              color: "#fff",
            }}
          >
            {CATEGORY_DESIGNS[form.category]?.icon || "📍"}{" "}
            {editing ? "Edit Destination" : "Add Destination"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            padding: "24px",
            background: CATEGORY_DESIGNS[form.category]?.bgPattern || "#fff",
          }}
        >
          {error && (
            <Alert
              variant="danger"
              className="py-3"
              style={{ borderRadius: "8px" }}
            >
              {error}
            </Alert>
          )}
          <Row className="g-3">
            <Col xs={12} sm={8}>
              <Form.Label
                className="fw-semibold"
                style={{ fontSize: "0.9rem", color: "#495057" }}
              >
                Name *
              </Form.Label>
              <Form.Control
                value={form.name}
                onChange={(e) => fc("name", e.target.value)}
                style={{ borderRadius: "8px", padding: "10px 14px" }}
              />
            </Col>
            <Col xs={12} sm={4}>
              <Form.Label
                className="fw-semibold"
                style={{ fontSize: "0.9rem", color: "#495057" }}
              >
                Category
              </Form.Label>
              <Form.Select
                value={form.category}
                onChange={(e) => fc("category", e.target.value)}
                style={{
                  borderRadius: "8px",
                  padding: "10px 14px",
                  borderColor:
                    CATEGORY_DESIGNS[form.category]?.color || "#ced4da",
                }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>
                    {CATEGORY_DESIGNS[c]?.icon} {c}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={12}>
              <Form.Label
                className="fw-semibold"
                style={{ fontSize: "0.9rem", color: "#495057" }}
              >
                Short Description
              </Form.Label>
              <Form.Control
                value={form.short_description}
                onChange={(e) => fc("short_description", e.target.value)}
                style={{ borderRadius: "8px", padding: "10px 14px" }}
                placeholder="Brief summary for cards..."
              />
            </Col>
            <Col xs={12}>
              <Form.Label
                className="fw-semibold"
                style={{ fontSize: "0.9rem", color: "#495057" }}
              >
                Description *
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={form.description}
                onChange={(e) => fc("description", e.target.value)}
                style={{ borderRadius: "8px", padding: "10px 14px" }}
              />
            </Col>
            <Col xs={12}>
              <Form.Label
                className="fw-semibold"
                style={{ fontSize: "0.9rem", color: "#495057" }}
              >
                Address
              </Form.Label>
              <Form.Control
                value={form.location_address}
                onChange={(e) => fc("location_address", e.target.value)}
                style={{ borderRadius: "8px", padding: "10px 14px" }}
              />
            </Col>
            <Col xs={5}>
              <Form.Label
                className="fw-semibold"
                style={{ fontSize: "0.9rem", color: "#495057" }}
              >
                Latitude (from map)
              </Form.Label>
              <Form.Control
                type="number"
                value={form.location_lat}
                readOnly
                style={{
                  borderRadius: "8px",
                  padding: "10px 14px",
                  backgroundColor: "#f8f9fa",
                }}
              />
            </Col>
            <Col xs={5}>
              <Form.Label
                className="fw-semibold"
                style={{ fontSize: "0.9rem", color: "#495057" }}
              >
                Longitude (from map)
              </Form.Label>
              <Form.Control
                type="number"
                value={form.location_lng}
                readOnly
                style={{
                  borderRadius: "8px",
                  padding: "10px 14px",
                  backgroundColor: "#f8f9fa",
                }}
              />
            </Col>
            <Col xs={2} className="d-flex align-items-end">
              <Button
                variant="outline-primary"
                onClick={handleLocationInputClick}
                style={{
                  borderRadius: "8px",
                  width: "100%",
                  padding: "10px",
                  fontWeight: 500,
                }}
              >
                🗺️ Back to Map
              </Button>
            </Col>
            <Col xs={6}>
              <Form.Label
                className="fw-semibold"
                style={{ fontSize: "0.9rem", color: "#495057" }}
              >
                Entrance Fee
              </Form.Label>
              <Form.Control
                value={form.entrance_fee}
                onChange={(e) => fc("entrance_fee", e.target.value)}
                placeholder="e.g. ₱50 / Free"
                style={{ borderRadius: "8px", padding: "10px 14px" }}
              />
            </Col>
            <Col xs={6}>
              <Form.Label
                className="fw-semibold"
                style={{ fontSize: "0.9rem", color: "#495057" }}
              >
                Opening Hours
              </Form.Label>
              <Form.Control
                value={form.opening_hours}
                onChange={(e) => fc("opening_hours", e.target.value)}
                placeholder="e.g. 8AM–5PM"
                style={{ borderRadius: "8px", padding: "10px 14px" }}
              />
            </Col>
            <Col xs={12}>
              <Form.Label
                className="fw-semibold"
                style={{ fontSize: "0.9rem", color: "#495057" }}
              >
                Getting There
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={form.getting_there}
                onChange={(e) => fc("getting_there", e.target.value)}
                placeholder="Directions on how to reach this destination..."
                style={{ borderRadius: "8px", padding: "10px 14px" }}
              />
            </Col>

            {/* Category-specific fields */}
            {form.category === "Waterfalls" && (
              <>
                <Col xs={12}>
                  <div
                    style={{
                      background: CATEGORY_DESIGNS["Waterfalls"].gradient,
                      color: "#fff",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {CATEGORY_DESIGNS["Waterfalls"].icon} Waterfall Details
                  </div>
                </Col>
                <Col xs={6}>
                  <Form.Label
                    className="fw-semibold"
                    style={{ fontSize: "0.9rem", color: "#495057" }}
                  >
                    Waterfall Height
                  </Form.Label>
                  <Form.Control
                    value={form.waterfall_height}
                    onChange={(e) => fc("waterfall_height", e.target.value)}
                    placeholder="e.g. 50 meters"
                    style={{ borderRadius: "8px", padding: "10px 14px" }}
                  />
                </Col>
                <Col xs={6}>
                  <Form.Label
                    className="fw-semibold"
                    style={{ fontSize: "0.9rem", color: "#495057" }}
                  >
                    Trekking Difficulty
                  </Form.Label>
                  <Form.Select
                    value={form.trekking_difficulty}
                    onChange={(e) => fc("trekking_difficulty", e.target.value)}
                    style={{ borderRadius: "8px", padding: "10px 14px" }}
                  >
                    <option value="">Select difficulty</option>
                    <option value="Easy">Easy</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Difficult">Difficult</option>
                    <option value="Extreme">Extreme</option>
                  </Form.Select>
                </Col>
                <Col xs={12}>
                  <Form.Check
                    type="checkbox"
                    label="Swimming Allowed"
                    checked={form.swimming_allowed}
                    onChange={(e) => fc("swimming_allowed", e.target.checked)}
                    style={{ fontSize: "0.95rem", fontWeight: 500 }}
                  />
                </Col>
              </>
            )}

            {form.category === "Beaches" && (
              <>
                <Col xs={12}>
                  <div
                    style={{
                      background: CATEGORY_DESIGNS["Beaches"].gradient,
                      color: "#fff",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {CATEGORY_DESIGNS["Beaches"].icon} Beach Details
                  </div>
                </Col>
                <Col xs={6}>
                  <Form.Label
                    className="fw-semibold"
                    style={{ fontSize: "0.9rem", color: "#495057" }}
                  >
                    Beach Type
                  </Form.Label>
                  <Form.Select
                    value={form.beach_type}
                    onChange={(e) => fc("beach_type", e.target.value)}
                    style={{ borderRadius: "8px", padding: "10px 14px" }}
                  >
                    <option value="">Select type</option>
                    <option value="White Sand">White Sand</option>
                    <option value="Black Sand">Black Sand</option>
                    <option value="Rocky">Rocky</option>
                    <option value="Mixed">Mixed</option>
                  </Form.Select>
                </Col>
                <Col xs={6}>
                  <Form.Label
                    className="fw-semibold"
                    style={{ fontSize: "0.9rem", color: "#495057" }}
                  >
                    Best Season
                  </Form.Label>
                  <Form.Control
                    value={form.best_season}
                    onChange={(e) => fc("best_season", e.target.value)}
                    placeholder="e.g. March to May"
                    style={{ borderRadius: "8px", padding: "10px 14px" }}
                  />
                </Col>
              </>
            )}

            {form.category === "Heritage" && (
              <>
                <Col xs={12}>
                  <div
                    style={{
                      background: CATEGORY_DESIGNS["Heritage"].gradient,
                      color: "#fff",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {CATEGORY_DESIGNS["Heritage"].icon} Heritage Details
                  </div>
                </Col>
                <Col xs={6}>
                  <Form.Label
                    className="fw-semibold"
                    style={{ fontSize: "0.9rem", color: "#495057" }}
                  >
                    Historical Period
                  </Form.Label>
                  <Form.Control
                    value={form.historical_period}
                    onChange={(e) => fc("historical_period", e.target.value)}
                    placeholder="e.g. Spanish Colonial Era"
                    style={{ borderRadius: "8px", padding: "10px 14px" }}
                  />
                </Col>
                <Col xs={12}>
                  <Form.Label
                    className="fw-semibold"
                    style={{ fontSize: "0.9rem", color: "#495057" }}
                  >
                    Significance
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={form.significance}
                    onChange={(e) => fc("significance", e.target.value)}
                    placeholder="Historical significance..."
                    style={{ borderRadius: "8px", padding: "10px 14px" }}
                  />
                </Col>
                <Col xs={12}>
                  <Form.Check
                    type="checkbox"
                    label="Tour Guide Available"
                    checked={form.tour_guide_available}
                    onChange={(e) =>
                      fc("tour_guide_available", e.target.checked)
                    }
                    style={{ fontSize: "0.95rem", fontWeight: 500 }}
                  />
                </Col>
              </>
            )}

            {form.category === "Hotels" && (
              <>
                <Col xs={12}>
                  <div
                    style={{
                      background: CATEGORY_DESIGNS["Hotels"].gradient,
                      color: "#fff",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {CATEGORY_DESIGNS["Hotels"].icon} Hotel Details
                  </div>
                </Col>
                <Col xs={12}>
                  <Form.Label
                    className="fw-semibold"
                    style={{ fontSize: "0.9rem", color: "#495057" }}
                  >
                    Room Types
                  </Form.Label>
                  <Form.Control
                    value={form.room_types}
                    onChange={(e) => fc("room_types", e.target.value)}
                    placeholder="e.g. Standard, Deluxe, Suite"
                    style={{ borderRadius: "8px", padding: "10px 14px" }}
                  />
                </Col>
                <Col xs={12}>
                  <Form.Label
                    className="fw-semibold"
                    style={{ fontSize: "0.9rem", color: "#495057" }}
                  >
                    Amenities
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={form.amenities}
                    onChange={(e) => fc("amenities", e.target.value)}
                    placeholder="e.g. WiFi, Pool, Restaurant, AC"
                    style={{ borderRadius: "8px", padding: "10px 14px" }}
                  />
                </Col>
                <Col xs={6}>
                  <Form.Label
                    className="fw-semibold"
                    style={{ fontSize: "0.9rem", color: "#495057" }}
                  >
                    Price Range
                  </Form.Label>
                  <Form.Control
                    value={form.price_range}
                    onChange={(e) => fc("price_range", e.target.value)}
                    placeholder="e.g. ₱1,500 - ₱3,000/night"
                    style={{ borderRadius: "8px", padding: "10px 14px" }}
                  />
                </Col>
                <Col xs={6}>
                  <Form.Label
                    className="fw-semibold"
                    style={{ fontSize: "0.9rem", color: "#495057" }}
                  >
                    Contact Phone
                  </Form.Label>
                  <Form.Control
                    value={form.contact_phone}
                    onChange={(e) => fc("contact_phone", e.target.value)}
                    placeholder="e.g. 09123456789"
                    style={{ borderRadius: "8px", padding: "10px 14px" }}
                  />
                </Col>
                <Col xs={12}>
                  <Form.Label
                    className="fw-semibold"
                    style={{ fontSize: "0.9rem", color: "#495057" }}
                  >
                    Contact Email
                  </Form.Label>
                  <Form.Control
                    type="email"
                    value={form.contact_email}
                    onChange={(e) => fc("contact_email", e.target.value)}
                    placeholder="e.g. hotel@example.com"
                    style={{ borderRadius: "8px", padding: "10px 14px" }}
                  />
                </Col>
              </>
            )}

            {form.category === "Food" && (
              <>
                <Col xs={12}>
                  <div
                    style={{
                      background: CATEGORY_DESIGNS["Food"].gradient,
                      color: "#fff",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {CATEGORY_DESIGNS["Food"].icon} Food Details
                  </div>
                </Col>
                <Col xs={6}>
                  <Form.Label
                    className="fw-semibold"
                    style={{ fontSize: "0.9rem", color: "#495057" }}
                  >
                    Cuisine Type
                  </Form.Label>
                  <Form.Control
                    value={form.cuisine_type}
                    onChange={(e) => fc("cuisine_type", e.target.value)}
                    placeholder="e.g. Filipino, Seafood, International"
                    style={{ borderRadius: "8px", padding: "10px 14px" }}
                  />
                </Col>
                <Col xs={12}>
                  <Form.Label
                    className="fw-semibold"
                    style={{ fontSize: "0.9rem", color: "#495057" }}
                  >
                    Specialties
                  </Form.Label>
                  <Form.Control
                    value={form.specialties}
                    onChange={(e) => fc("specialties", e.target.value)}
                    placeholder="e.g. Kinilaw, Sinugba, Lechon"
                    style={{ borderRadius: "8px", padding: "10px 14px" }}
                  />
                </Col>
                <Col xs={6}>
                  <Form.Label
                    className="fw-semibold"
                    style={{ fontSize: "0.9rem", color: "#495057" }}
                  >
                    Seating Capacity
                  </Form.Label>
                  <Form.Control
                    value={form.seating_capacity}
                    onChange={(e) => fc("seating_capacity", e.target.value)}
                    placeholder="e.g. 50 persons"
                    style={{ borderRadius: "8px", padding: "10px 14px" }}
                  />
                </Col>
              </>
            )}

            {form.category === "Events" && (
              <>
                <Col xs={12}>
                  <div
                    style={{
                      background: CATEGORY_DESIGNS["Events"].gradient,
                      color: "#fff",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {CATEGORY_DESIGNS["Events"].icon} Event Details
                  </div>
                </Col>
                <Col xs={6}>
                  <Form.Label
                    className="fw-semibold"
                    style={{ fontSize: "0.9rem", color: "#495057" }}
                  >
                    Event Date
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={form.event_date}
                    onChange={(e) => fc("event_date", e.target.value)}
                    style={{ borderRadius: "8px", padding: "10px 14px" }}
                  />
                </Col>
                <Col xs={6}>
                  <Form.Label
                    className="fw-semibold"
                    style={{ fontSize: "0.9rem", color: "#495057" }}
                  >
                    Event Time
                  </Form.Label>
                  <Form.Control
                    type="time"
                    value={form.event_time}
                    onChange={(e) => fc("event_time", e.target.value)}
                    style={{ borderRadius: "8px", padding: "10px 14px" }}
                  />
                </Col>
                <Col xs={6}>
                  <Form.Label
                    className="fw-semibold"
                    style={{ fontSize: "0.9rem", color: "#495057" }}
                  >
                    Organizer
                  </Form.Label>
                  <Form.Control
                    value={form.organizer}
                    onChange={(e) => fc("organizer", e.target.value)}
                    placeholder="Event organizer name"
                    style={{ borderRadius: "8px", padding: "10px 14px" }}
                  />
                </Col>
                <Col xs={6}>
                  <Form.Label
                    className="fw-semibold"
                    style={{ fontSize: "0.9rem", color: "#495057" }}
                  >
                    Ticket Price
                  </Form.Label>
                  <Form.Control
                    value={form.ticket_price}
                    onChange={(e) => fc("ticket_price", e.target.value)}
                    placeholder="e.g. ₱100"
                    style={{ borderRadius: "8px", padding: "10px 14px" }}
                  />
                </Col>
              </>
            )}

            {form.category === "Transport" && (
              <>
                <Col xs={12}>
                  <div
                    style={{
                      background: CATEGORY_DESIGNS["Transport"].gradient,
                      color: "#fff",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {CATEGORY_DESIGNS["Transport"].icon} Transport Details
                  </div>
                </Col>
                <Col xs={6}>
                  <Form.Label
                    className="fw-semibold"
                    style={{ fontSize: "0.9rem", color: "#495057" }}
                  >
                    Vehicle Type
                  </Form.Label>
                  <Form.Select
                    value={form.vehicle_type}
                    onChange={(e) => fc("vehicle_type", e.target.value)}
                    style={{ borderRadius: "8px", padding: "10px 14px" }}
                  >
                    <option value="">Select type</option>
                    <option value="Van">Van</option>
                    <option value="Bus">Bus</option>
                    <option value="Motorcycle">Motorcycle (Habal-habal)</option>
                    <option value="Tricycle">Tricycle</option>
                    <option value="Boat">Boat</option>
                  </Form.Select>
                </Col>
                <Col xs={6}>
                  <Form.Label
                    className="fw-semibold"
                    style={{ fontSize: "0.9rem", color: "#495057" }}
                  >
                    Schedule
                  </Form.Label>
                  <Form.Control
                    value={form.schedule}
                    onChange={(e) => fc("schedule", e.target.value)}
                    placeholder="e.g. 6AM - 6PM daily"
                    style={{ borderRadius: "8px", padding: "10px 14px" }}
                  />
                </Col>
                <Col xs={6}>
                  <Form.Label
                    className="fw-semibold"
                    style={{ fontSize: "0.9rem", color: "#495057" }}
                  >
                    Fare
                  </Form.Label>
                  <Form.Control
                    value={form.fare}
                    onChange={(e) => fc("fare", e.target.value)}
                    placeholder="e.g. ₱50 per person"
                    style={{ borderRadius: "8px", padding: "10px 14px" }}
                  />
                </Col>
              </>
            )}

            {form.category === "Nature" && (
              <>
                <Col xs={12}>
                  <div
                    style={{
                      background: CATEGORY_DESIGNS["Nature"].gradient,
                      color: "#fff",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {CATEGORY_DESIGNS["Nature"].icon} Nature Details
                  </div>
                </Col>
                <Col xs={12}>
                  <Form.Label
                    className="fw-semibold"
                    style={{ fontSize: "0.9rem", color: "#495057" }}
                  >
                    Activities Allowed
                  </Form.Label>
                  <Form.Control
                    value={form.activities_allowed}
                    onChange={(e) => fc("activities_allowed", e.target.value)}
                    placeholder="e.g. Hiking, Camping, Bird Watching"
                    style={{ borderRadius: "8px", padding: "10px 14px" }}
                  />
                </Col>
                <Col xs={6}>
                  <Form.Label
                    className="fw-semibold"
                    style={{ fontSize: "0.9rem", color: "#495057" }}
                  >
                    Best Season
                  </Form.Label>
                  <Form.Control
                    value={form.best_season_nature}
                    onChange={(e) => fc("best_season_nature", e.target.value)}
                    placeholder="e.g. November to February"
                    style={{ borderRadius: "8px", padding: "10px 14px" }}
                  />
                </Col>
                <Col xs={12}>
                  <Form.Check
                    type="checkbox"
                    label="Guide Required"
                    checked={form.guide_required}
                    onChange={(e) => fc("guide_required", e.target.checked)}
                    style={{ fontSize: "0.95rem", fontWeight: 500 }}
                  />
                </Col>
              </>
            )}

            <Col xs={12}>
              <Form.Label
                className="fw-semibold"
                style={{ fontSize: "0.9rem", color: "#495057" }}
              >
                Images
              </Form.Label>
              <Form.Control
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const target = e.target as HTMLInputElement;
                  setImageFiles(Array.from(target.files || []));
                }}
                style={{ borderRadius: "8px", padding: "10px 14px" }}
              />
              {imageFiles.length > 0 && (
                <div
                  className="mt-2"
                  style={{ fontSize: "0.85rem", color: "#6c757d" }}
                >
                  {imageFiles.length} file(s) selected
                </div>
              )}
              {editing && form.images && imageFiles.length === 0 && (
                <div
                  className="mt-2"
                  style={{ fontSize: "0.85rem", color: "#6c757d" }}
                >
                  Current images: {form.images.split(",").length} image(s)
                </div>
              )}
            </Col>
            <Col xs={12}>
              <Form.Label
                className="fw-semibold"
                style={{ fontSize: "0.9rem", color: "#495057" }}
              >
                Tags (comma-separated)
              </Form.Label>
              <Form.Control
                value={form.tags}
                onChange={(e) => fc("tags", e.target.value)}
                placeholder="nature, adventure, family-friendly"
                style={{ borderRadius: "8px", padding: "10px 14px" }}
              />
            </Col>
            <Col xs={12}>
              <Form.Check
                type="checkbox"
                label="⭐ Featured destination"
                checked={form.featured}
                onChange={(e) => fc("featured", e.target.checked)}
                style={{ fontSize: "0.95rem", fontWeight: 500 }}
              />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer
          style={{ borderTop: "2px solid #e9ecef", padding: "20px 24px" }}
        >
          <Button
            variant="secondary"
            onClick={() => setShowModal(false)}
            style={{
              borderRadius: "8px",
              padding: "10px 24px",
              fontWeight: 500,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving || uploading}
            style={{
              background:
                CATEGORY_DESIGNS[form.category]?.gradient ||
                "linear-gradient(135deg, var(--tropical-green), #2E7D32)",
              border: "none",
              padding: "10px 24px",
              fontWeight: 600,
              borderRadius: "8px",
            }}
          >
            {uploading
              ? "Uploading images..."
              : saving
                ? "Saving..."
                : "Save Destination"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Detail View Modal */}
      {viewItem && (
        <Modal
          show={!!viewItem}
          onHide={() => setViewItem(null)}
          size="lg"
          centered
          fullscreen="sm-down"
        >
          <Modal.Header
            closeButton
            style={{
              border: "none",
              paddingBottom: 0,
              background: darkMode ? "#2a2a3e" : "#fff",
              color: darkMode ? "#e0e0e0" : "#212529",
            }}
          >
            <Modal.Title
              style={{
                fontFamily: "Poppins, serif",
                color: darkMode ? "#e0e0e0" : "#212529",
              }}
            >
              {CATEGORY_DESIGNS[viewItem.category]?.icon || "📍"}{" "}
              {viewItem.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body
            className="pt-3"
            style={{ background: darkMode ? "#1e1e2e" : "#fff" }}
          >
            {viewItem.images && viewItem.images.length > 0 && (
              <div className="mb-3" style={{ position: "relative" }}>
                <img
                  src={viewItem.images[0]}
                  alt={viewItem.name}
                  style={{
                    width: "100%",
                    height: 300,
                    objectFit: "cover",
                    borderRadius: "12px",
                  }}
                />
                {viewItem.images.length > 1 && (
                  <div
                    className="d-flex gap-2 mt-2"
                    style={{ overflowX: "auto" }}
                  >
                    {viewItem.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        style={{
                          width: 60,
                          height: 60,
                          objectFit: "cover",
                          borderRadius: "8px",
                          cursor: "pointer",
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="d-flex gap-2 flex-wrap mb-3">
              <Badge
                style={{
                  background: getCategoryColor(viewItem.category),
                  fontSize: "0.85rem",
                  padding: "6px 12px",
                  borderRadius: "6px",
                }}
              >
                {viewItem.category}
              </Badge>
              {viewItem.featured && (
                <Badge
                  style={{
                    background: "#FFD700",
                    color: "#000",
                    fontSize: "0.85rem",
                    padding: "6px 12px",
                    borderRadius: "6px",
                  }}
                >
                  ⭐ Featured
                </Badge>
              )}
            </div>
            {viewItem.short_description && (
              <p
                className="mb-3"
                style={{
                  fontSize: "1rem",
                  lineHeight: 1.6,
                  color: darkMode ? "#e0e0e0" : "#495057",
                  fontWeight: 500,
                }}
              >
                {viewItem.short_description}
              </p>
            )}
            {viewItem.description && (
              <p
                className="mb-3"
                style={{
                  fontSize: "0.95rem",
                  lineHeight: 1.7,
                  color: darkMode ? "#b0b0c0" : "#6c757d",
                }}
              >
                {viewItem.description}
              </p>
            )}
            <div className="mb-3">
              <p
                className="mb-1"
                style={{
                  fontSize: "0.85rem",
                  color: darkMode ? "#b0b0c0" : "#6c757d",
                  fontWeight: 600,
                }}
              >
                📍 Location
              </p>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: darkMode ? "#e0e0e0" : "#495057",
                }}
              >
                {viewItem.location_address || "Calbayog City"}
              </p>
            </div>
            {viewItem.entrance_fee && (
              <div className="mb-3">
                <p
                  className="mb-1"
                  style={{
                    fontSize: "0.85rem",
                    color: darkMode ? "#b0b0c0" : "#6c757d",
                    fontWeight: 600,
                  }}
                >
                  💵 Entrance Fee
                </p>
                <p
                  style={{
                    fontSize: "0.95rem",
                    color: darkMode ? "#e0e0e0" : "#495057",
                  }}
                >
                  {viewItem.entrance_fee}
                </p>
              </div>
            )}
            {viewItem.opening_hours && (
              <div className="mb-3">
                <p
                  className="mb-1"
                  style={{
                    fontSize: "0.85rem",
                    color: darkMode ? "#b0b0c0" : "#6c757d",
                    fontWeight: 600,
                  }}
                >
                  🕐 Opening Hours
                </p>
                <p
                  style={{
                    fontSize: "0.95rem",
                    color: darkMode ? "#e0e0e0" : "#495057",
                  }}
                >
                  {viewItem.opening_hours}
                </p>
              </div>
            )}
            {viewItem.getting_there && (
              <div className="mb-3">
                <p
                  className="mb-1"
                  style={{
                    fontSize: "0.85rem",
                    color: darkMode ? "#b0b0c0" : "#6c757d",
                    fontWeight: 600,
                  }}
                >
                  🚗 Getting There
                </p>
                <p
                  style={{
                    fontSize: "0.95rem",
                    color: darkMode ? "#e0e0e0" : "#495057",
                  }}
                >
                  {viewItem.getting_there}
                </p>
              </div>
            )}
            {viewItem.tags && viewItem.tags.length > 0 && (
              <div className="mb-3">
                <p
                  className="mb-1"
                  style={{
                    fontSize: "0.85rem",
                    color: darkMode ? "#b0b0c0" : "#6c757d",
                    fontWeight: 600,
                  }}
                >
                  🏷️ Tags
                </p>
                <div className="d-flex gap-2 flex-wrap">
                  {viewItem.tags.map((tag) => (
                    <Badge
                      key={tag}
                      bg="light"
                      style={{
                        color: "#495057",
                        fontSize: "0.8rem",
                        padding: "4px 10px",
                        borderRadius: "6px",
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer
            style={{
              border: "none",
              background: darkMode ? "#1e1e2e" : "#fff",
            }}
          >
            <Button
              variant="secondary"
              onClick={() => setViewItem(null)}
              style={{ borderRadius: "8px" }}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Categories Modal */}
      <Modal
        show={showCategoriesModal}
        onHide={() => setShowCategoriesModal(false)}
        centered
        fullscreen="sm-down"
      >
        <Modal.Header
          closeButton
          style={{
            border: "none",
            paddingBottom: 0,
            background: darkMode ? "#2a2a3e" : "#fff",
            color: darkMode ? "#e0e0e0" : "#212529",
          }}
        >
          <Modal.Title
            style={{
              fontFamily: "Poppins, serif",
              color: darkMode ? "#e0e0e0" : "#212529",
            }}
          >
            📊 Categories Overview
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          className="pt-3"
          style={{ background: darkMode ? "#1e1e2e" : "#fff" }}
        >
          <Row className="g-3">
            {CATEGORIES.map((cat) => {
              const count = items.filter((d) => d.category === cat).length;
              return (
                <Col xs={6} md={4} key={cat}>
                  <Card
                    className="border-0 h-100"
                    style={{
                      borderRadius: "12px",
                      background:
                        CATEGORY_DESIGNS[cat]?.gradient ||
                        "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
                      color: "#fff",
                      cursor: "pointer",
                      transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                    onClick={() => {
                      setCategoryFilter(cat);
                      setShowCategoriesModal(false);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow =
                        "0 8px 20px rgba(0,0,0,0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <Card.Body className="py-4 text-center">
                      <div style={{ fontSize: "2rem", marginBottom: "8px" }}>
                        {CATEGORY_DESIGNS[cat]?.icon || "📍"}
                      </div>
                      <div
                        style={{
                          fontSize: "1.1rem",
                          fontWeight: 600,
                          marginBottom: "4px",
                        }}
                      >
                        {cat}
                      </div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                        {count}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Modal.Body>
        <Modal.Footer
          style={{ border: "none", background: darkMode ? "#1e1e2e" : "#fff" }}
        >
          <Button
            variant="secondary"
            onClick={() => setShowCategoriesModal(false)}
            style={{ borderRadius: "8px" }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Active Items Modal */}
      <Modal
        show={showActiveModal}
        onHide={() => setShowActiveModal(false)}
        size="lg"
        centered
        fullscreen="sm-down"
      >
        <Modal.Header
          closeButton
          style={{
            border: "none",
            paddingBottom: 0,
            background: darkMode ? "#2a2a3e" : "#fff",
            color: darkMode ? "#e0e0e0" : "#212529",
          }}
        >
          <Modal.Title
            style={{
              fontFamily: "Poppins, serif",
              color: darkMode ? "#e0e0e0" : "#212529",
            }}
          >
            📋 Currently Active ({filteredItems.length})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          className="pt-3"
          style={{ background: darkMode ? "#1e1e2e" : "#fff" }}
        >
          <Row className="g-3">
            {filteredItems.map((d) => (
              <Col xs={12} sm={6} key={d.id}>
                <Card
                  className="border-0"
                  style={{
                    borderRadius: "12px",
                    boxShadow: darkMode
                      ? "0 2px 8px rgba(0,0,0,0.3)"
                      : "0 2px 8px rgba(0,0,0,0.08)",
                    background: darkMode ? "#1e1e2e" : "#fff",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setViewItem(d);
                    setShowActiveModal(false);
                  }}
                >
                  <Card.Body className="p-3">
                    <div className="d-flex align-items-center gap-3">
                      {d.images && d.images.length > 0 && (
                        <img
                          src={d.images[0]}
                          alt={d.name}
                          style={{
                            width: 60,
                            height: 60,
                            borderRadius: "8px",
                            objectFit: "cover",
                          }}
                        />
                      )}
                      <div>
                        <h6
                          className="fw-bold mb-1"
                          style={{ color: darkMode ? "#e0e0e0" : "#212529" }}
                        >
                          {d.name}
                        </h6>
                        <Badge
                          style={{
                            background: getCategoryColor(d.category),
                            fontSize: "0.75rem",
                            padding: "4px 8px",
                            borderRadius: "6px",
                          }}
                        >
                          {d.category}
                        </Badge>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          {filteredItems.length === 0 && (
            <div className="text-center py-5">
              <div style={{ fontSize: "3rem" }}>📭</div>
              <p
                className="text-muted mt-2"
                style={{ color: darkMode ? "#b0b0c0" : "#6c757d" }}
              >
                No active destinations
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer
          style={{ border: "none", background: darkMode ? "#1e1e2e" : "#fff" }}
        >
          <Button
            variant="secondary"
            onClick={() => setShowActiveModal(false)}
            style={{ borderRadius: "8px" }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
};

export default AdminDestinations;
