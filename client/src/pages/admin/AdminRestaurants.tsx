
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  InputGroup,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";
import {
  Building2,
  Check,
  Clock3,
  MapPin,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";
import LocationPicker from "../../components/LocationPicker";
import { supabase } from "../../services/supabase";
import {
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  uploadMultipleImages,
  clearCache,
  type Restaurant,
} from "../../services/api";
import { useDarkMode } from "../../context/DarkModeContext";

const PRIMARY = "#2D3195";
const YELLOW = "#FFB71B";

type RestaurantForm = {
  name: string;
  description: string;
  short_description: string;
  location_address: string;
  location_lat: number | null;
  location_lng: number | null;
  contact_phone: string;
  contact_website: string;
  opening_hours: string;
  cuisine_type: string;
  price_range: string;
  featured: boolean;
  is_active: boolean;
  images: string[];
};

const EMPTY_FORM: RestaurantForm = {
  name: "",
  description: "",
  short_description: "",
  location_address: "",
  location_lat: null,
  location_lng: null,
  contact_phone: "",
  contact_website: "",
  opening_hours: "",
  cuisine_type: "",
  price_range: "",
  featured: false,
  is_active: true,
  images: [],
};

const PAGE_STYLES = `
.admin-restaurants-page {
  --restaurant-primary: #2D3195;
  --restaurant-primary-dark: #242879;
  --restaurant-yellow: #FFB71B;
  --restaurant-border: #E8EAF1;
  --restaurant-muted: #737886;
  color: #1B1D24;
  font-family: "Nunito", "Poppins", "Segoe UI", sans-serif;
  padding-bottom: 48px;
}

.admin-restaurants-page * {
  box-sizing: border-box;
}

.admin-restaurants-page .restaurant-eyebrow {
  color: var(--restaurant-primary);
  font-size: .66rem;
  font-weight: 900;
  letter-spacing: .16em;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.admin-restaurants-page .restaurant-page-title {
  margin: 0;
  color: var(--restaurant-primary);
  font-family: "Barabara", "Poppins", sans-serif;
  font-size: clamp(1.65rem, 2.8vw, 2.4rem);
  line-height: 1.1;
  font-weight: 800;
}

.admin-restaurants-page .restaurant-subtitle {
  margin-top: 8px;
  color: var(--restaurant-muted);
  font-size: .78rem;
  line-height: 1.6;
}

.admin-restaurants-page .restaurant-add-button {
  min-height: 45px;
  border: 0;
  border-radius: 13px;
  padding: 10px 18px;
  background: var(--restaurant-primary);
  color: white;
  font-weight: 900;
  font-size: .75rem;
  box-shadow: 0 10px 24px rgba(45,49,149,.19);
}

.admin-restaurants-page .restaurant-add-button:hover {
  background: var(--restaurant-primary-dark);
  color: white;
  transform: translateY(-1px);
}

.admin-restaurants-page .restaurant-stat-card,
.admin-restaurants-page .restaurant-toolbar,
.admin-restaurants-page .restaurant-card {
  border: 1px solid var(--restaurant-border);
  border-radius: 18px;
  background: white;
  box-shadow: 0 7px 24px rgba(26,30,53,.055);
}

.admin-restaurants-page .restaurant-stat-card {
  height: 100%;
  min-height: 115px;
  padding: 18px;
  position: relative;
  overflow: hidden;
}

.admin-restaurants-page .restaurant-stat-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: var(--restaurant-primary);
}

.admin-restaurants-page .restaurant-stat-label {
  color: var(--restaurant-muted);
  font-size: .65rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .04em;
}

.admin-restaurants-page .restaurant-stat-number {
  margin-top: 10px;
  font-family: "Poppins", sans-serif;
  font-size: 1.9rem;
  line-height: 1;
  font-weight: 800;
}

.admin-restaurants-page .restaurant-stat-caption {
  margin-top: 7px;
  color: var(--restaurant-muted);
  font-size: .63rem;
}

.admin-restaurants-page .restaurant-toolbar {
  overflow: visible;
}

.admin-restaurants-page .restaurant-toolbar .card-body {
  padding: 19px;
}

.admin-restaurants-page .restaurant-section-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  font-size: .85rem;
  font-weight: 900;
}

.admin-restaurants-page .restaurant-section-icon {
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: #EEF0FF;
  color: var(--restaurant-primary);
}

.admin-restaurants-page .form-control,
.admin-restaurants-page .form-select {
  border-color: #E1E4EC;
  border-radius: 11px;
  font-size: .73rem;
  min-height: 42px;
  box-shadow: none;
}

.admin-restaurants-page .form-control:focus,
.admin-restaurants-page .form-select:focus {
  border-color: rgba(45,49,149,.55);
  box-shadow: 0 0 0 3px rgba(45,49,149,.08);
}

.admin-restaurants-page .restaurant-search-group .input-group-text {
  border-color: #E1E4EC;
  border-radius: 11px 0 0 11px;
  background: #F4F5FB;
  color: var(--restaurant-primary);
}

.admin-restaurants-page .restaurant-search-group .form-control {
  border-radius: 0 11px 11px 0;
}

.admin-restaurants-page .restaurant-card {
  height: 100%;
  overflow: hidden;
  transition: transform .23s ease, box-shadow .23s ease;
}

.admin-restaurants-page .restaurant-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 17px 38px rgba(26,30,53,.12);
}

.admin-restaurants-page .restaurant-image-shell {
  height: 195px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #EEF0FF;
}

.admin-restaurants-page .restaurant-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .5s ease;
}

.admin-restaurants-page .restaurant-card:hover .restaurant-image {
  transform: scale(1.04);
}

.admin-restaurants-page .restaurant-card .card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.admin-restaurants-page .restaurant-card-name {
  font-family: "Poppins", sans-serif;
  font-size: .92rem;
  font-weight: 800;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.admin-restaurants-page .restaurant-card-description {
  color: var(--restaurant-muted);
  font-size: .7rem;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 52px;
}

.admin-restaurants-page .restaurant-card-location {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  color: var(--restaurant-muted);
  font-size: .67rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.admin-restaurants-page .restaurant-card-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  margin-top: auto;
  border-top: 1px solid #EEF0F4;
}

.admin-restaurants-page .restaurant-card-actions .btn {
  min-height: 36px;
  border-radius: 10px;
  font-size: .68rem;
  font-weight: 900;
}

.admin-restaurants-page .restaurant-card-actions .btn-outline-primary {
  color: var(--restaurant-primary);
  border-color: rgba(45,49,149,.25);
  background: #F8F8FF;
}

.admin-restaurants-page .restaurant-card-actions .btn-outline-primary:hover {
  color: white;
  background: var(--restaurant-primary);
}

.admin-restaurants-page .restaurant-pill {
  border-radius: 999px;
  padding: 5px 9px;
  font-size: .58rem;
  font-weight: 900;
}

/* =====================================================
   ADD / EDIT MODAL
   The dialog stays within the viewport.
   The body scrolls; header and footer remain visible.
===================================================== */

.admin-restaurants-page .modal-dialog {
  width: auto;
  max-width: min(1140px, calc(100vw - 32px));
}

.admin-restaurants-page .modal-dialog.modal-dialog-scrollable {
  height: calc(100% - 2rem);
  max-height: calc(100% - 2rem);
}

.admin-restaurants-page .modal-dialog-scrollable .modal-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--restaurant-border);
  border-radius: 21px;
  box-shadow: 0 24px 70px rgba(18,20,36,.17);
}

.admin-restaurants-page .restaurant-modal-form {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.admin-restaurants-page .restaurant-modal-header {
  flex: 0 0 auto;
  background: linear-gradient(135deg, #2D3195 0%, #242879 100%);
  color: white;
  padding: 18px 21px;
}

.admin-restaurants-page .restaurant-modal-header .modal-title {
  color: white;
  font-family: "Poppins", sans-serif;
  font-size: 1rem;
  font-weight: 800;
}

.admin-restaurants-page .restaurant-modal-header .btn-close {
  filter: invert(1);
}

.admin-restaurants-page .restaurant-modal-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  background: #FBFBFD;
  padding: 22px;
}

.admin-restaurants-page .restaurant-modal-body .form-label {
  color: #4E5564;
  font-size: .68rem;
  font-weight: 900;
  margin-bottom: 6px;
}

.admin-restaurants-page .restaurant-modal-body .form-control,
.admin-restaurants-page .restaurant-modal-body .form-select {
  min-height: 42px;
  border: 1px solid #E0E3EB;
  border-radius: 11px;
  background: white;
  font-size: .72rem;
}

.admin-restaurants-page .restaurant-modal-body textarea.form-control {
  min-height: 95px;
  resize: vertical;
}

.admin-restaurants-page .restaurant-form-section {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 8px 0 14px;
  padding: 11px 13px;
  border-radius: 11px;
  background: #EEF0FF;
  color: var(--restaurant-primary);
  font-size: .78rem;
  font-weight: 900;
}

.admin-restaurants-page .restaurant-modal-footer {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  position: relative;
  z-index: 2;
  border-top: 1px solid #EEF0F4;
  padding: 13px 21px;
  background: white;
}

.admin-restaurants-page .restaurant-modal-footer .btn {
  min-height: 39px;
  border-radius: 10px;
  font-size: .7rem;
  font-weight: 900;
}

.admin-restaurants-page .restaurant-save-button {
  border: 0;
  background: var(--restaurant-primary);
  color: white;
}

.admin-restaurants-page .restaurant-save-button:hover {
  background: var(--restaurant-primary-dark);
  color: white;
}

.admin-restaurants-page .restaurant-save-button:disabled {
  background: #7378B5;
  color: white;
  opacity: .8;
}

.admin-restaurants-page .restaurant-existing-image {
  width: 108px;
  height: 78px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #E1E4EC;
}

.admin-restaurants-page .restaurant-map-heading {
  padding: 11px 13px;
  margin-bottom: 10px;
  border: 1px solid rgba(45,49,149,.1);
  border-radius: 12px;
  background: #F7F8FF;
}

.admin-restaurants-page .restaurant-map-help {
  margin-top: 4px;
  color: #7A808E;
  font-size: .63rem;
  line-height: 1.5;
}

/* Dark mode */
.admin-restaurants-dark {
  color: #F1F3F8;
}

.admin-restaurants-dark .restaurant-stat-card,
.admin-restaurants-dark .restaurant-toolbar,
.admin-restaurants-dark .restaurant-card {
  color: #F1F3F8;
  background: #191C2B;
  border-color: #2B3042;
}

.admin-restaurants-dark .restaurant-card-description,
.admin-restaurants-dark .restaurant-card-location,
.admin-restaurants-dark .restaurant-stat-label,
.admin-restaurants-dark .restaurant-stat-caption {
  color: #A8AFBF;
}

.admin-restaurants-dark .restaurant-card-actions {
  border-color: #2B3042;
}

.admin-restaurants-dark .restaurant-modal-body {
  background: #151827;
  color: #F1F3F8;
}

.admin-restaurants-dark .restaurant-modal-body .form-label {
  color: #D9DCE7;
}

.admin-restaurants-dark .restaurant-modal-body .form-control,
.admin-restaurants-dark .restaurant-modal-body .form-select {
  background: #202436;
  border-color: #343A4F;
  color: #F1F3F8;
}

.admin-restaurants-dark .restaurant-modal-footer {
  background: #191C2B;
  border-color: #2B3042;
}

.admin-restaurants-dark .restaurant-map-heading {
  background: #202436;
  border-color: #343A4F;
}

.admin-restaurants-dark .restaurant-map-help {
  color: #A8AFBF;
}

@media (max-width: 767.98px) {
  .admin-restaurants-page .modal-dialog {
    max-width: calc(100vw - 16px);
    margin: 8px auto;
  }

  .admin-restaurants-page .modal-dialog.modal-dialog-scrollable {
    height: calc(100% - 16px);
    max-height: calc(100% - 16px);
  }

  .admin-restaurants-page .restaurant-page-title {
    font-size: 1.9rem;
  }

  .admin-restaurants-page .restaurant-add-button {
    width: 100%;
  }

  .admin-restaurants-page .restaurant-modal-header {
    padding: 15px 16px;
  }

  .admin-restaurants-page .restaurant-modal-body {
    padding: 16px;
  }

  .admin-restaurants-page .restaurant-modal-footer {
    padding: 12px 16px;
  }

  .admin-restaurants-page .restaurant-modal-footer .btn {
    flex: 1 1 auto;
  }
}
`;

const AdminRestaurants: React.FC = () => {
  const { darkMode } = useDarkMode();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [cuisineFilter, setCuisineFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RestaurantForm>(EMPTY_FORM);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Restaurant | null>(null);

  const loadRestaurants = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error: queryError } = await supabase
        .from("restaurants")
        .select("*")
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;

      setRestaurants(Array.isArray(data) ? (data as Restaurant[]) : []);
    } catch (loadError: any) {
      setError(
        loadError?.message || "Unable to load restaurants. Please try again.",
      );
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRestaurants();
  }, [loadRestaurants]);

  const cuisines = useMemo(
    () =>
      Array.from(
        new Set(
          restaurants
            .map((restaurant) => restaurant.cuisine_type?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [restaurants],
  );

  const filteredRestaurants = useMemo(() => {
    const term = search.trim().toLowerCase();

    return restaurants.filter((restaurant) => {
      const matchesSearch =
        !term ||
        [
          restaurant.name,
          restaurant.cuisine_type,
          restaurant.location_address,
          restaurant.short_description,
          restaurant.description,
        ].some((value) => value?.toLowerCase().includes(term));

      const matchesActive =
        activeFilter === "All" ||
        (activeFilter === "Active" && restaurant.is_active !== false) ||
        (activeFilter === "Inactive" && restaurant.is_active === false) ||
        (activeFilter === "Featured" && Boolean(restaurant.featured));

      const matchesCuisine =
        cuisineFilter === "All" || restaurant.cuisine_type === cuisineFilter;

      return matchesSearch && matchesActive && matchesCuisine;
    });
  }, [restaurants, search, activeFilter, cuisineFilter]);

  const activeCount = restaurants.filter(
    (restaurant) => restaurant.is_active !== false,
  ).length;

  const featuredCount = restaurants.filter(
    (restaurant) => Boolean(restaurant.featured),
  ).length;

  const resetForm = () => {
    setForm({ ...EMPTY_FORM, images: [] });
    setSelectedFiles([]);
    setFileInputKey((key) => key + 1);
  };

  const openAddModal = () => {
    setEditingId(null);
    resetForm();
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (restaurant: Restaurant) => {
    const item = restaurant as Restaurant & {
      location_lat?: number | null;
      location_lng?: number | null;
      latitude?: number | null;
      longitude?: number | null;
    };

    setEditingId(String(restaurant.id));

    setForm({
      name: restaurant.name || "",
      description: restaurant.description || "",
      short_description: restaurant.short_description || "",
      location_address: restaurant.location_address || "",
      location_lat: item.location_lat ?? item.latitude ?? null,
      location_lng: item.location_lng ?? item.longitude ?? null,
      contact_phone: restaurant.contact_phone || "",
      contact_website: restaurant.contact_website || "",
      opening_hours: restaurant.opening_hours || "",
      cuisine_type: restaurant.cuisine_type || "",
      price_range: restaurant.price_range || "",
      featured: Boolean(restaurant.featured),
      is_active: restaurant.is_active !== false,
      images: Array.isArray(restaurant.images) ? [...restaurant.images] : [],
    });

    setSelectedFiles([]);
    setFileInputKey((key) => key + 1);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const updateField = <K extends keyof RestaurantForm>(
    key: K,
    value: RestaurantForm[K],
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const removeExistingImage = (index: number) => {
    updateField(
      "images",
      form.images.filter((_, imageIndex) => imageIndex !== index),
    );
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Restaurant name is required.");
      return;
    }

    setSaving(true);
    setUploading(false);
    setError("");
    setSuccess("");

    try {
      let uploadedUrls: string[] = [];

      if (selectedFiles.length > 0) {
        setUploading(true);

        try {
          const uploadResult = await uploadMultipleImages(selectedFiles);

          uploadedUrls = Array.isArray(uploadResult?.data?.urls)
            ? uploadResult.data.urls
            : [];
        } finally {
          setUploading(false);
        }
      }

      const payload: any = {
        name: form.name.trim(),
        description: form.description.trim() || "",
        short_description: form.short_description.trim() || "",
        location_address: form.location_address.trim() || "",
        location_lat: form.location_lat,
        location_lng: form.location_lng,
        contact_phone: form.contact_phone.trim() || "",
        contact_website: form.contact_website.trim() || "",
        opening_hours: form.opening_hours.trim() || "",
        cuisine_type: form.cuisine_type.trim() || "",
        price_range: form.price_range.trim() || "",
        featured: form.featured,
        is_active: form.is_active,
        images: [...form.images, ...uploadedUrls],
      };

      if (editingId) {
        await updateRestaurant(editingId, payload);
        setSuccess("Restaurant updated successfully.");
      } else {
        await createRestaurant(payload);
        setSuccess("Restaurant added successfully.");
      }

      clearCache();
      setShowModal(false);
      resetForm();
      await loadRestaurants();
    } catch (saveError: any) {
      setError(
        saveError?.response?.data?.message ||
          saveError?.response?.data?.error ||
          saveError?.message ||
          "Could not save the restaurant.",
      );
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setSaving(true);
    setError("");

    try {
      await deleteRestaurant(String(deleteTarget.id));
      setDeleteTarget(null);
      setSuccess("Restaurant deleted successfully.");
      clearCache();
      await loadRestaurants();
    } catch (deleteError: any) {
      setError(
        deleteError?.response?.data?.message ||
          deleteError?.response?.data?.error ||
          deleteError?.message ||
          "Could not delete the restaurant.",
      );
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  };

  const closeForm = () => {
    if (saving) return;
    setShowModal(false);
    setError("");
  };

  return (
    <AdminLayout>
      <style>{PAGE_STYLES}</style>

      <div
        className={`admin-restaurants-page ${
          darkMode ? "admin-restaurants-dark" : ""
        }`}
      >
        {/* PAGE TITLE AND ADD BUTTON */}
        <Row className="align-items-end justify-content-between g-3 mb-4">
          <Col>
            <div className="restaurant-eyebrow">Tourism Management</div>
            <h1 className="restaurant-page-title">Restaurant Management</h1>
            <p className="restaurant-subtitle mb-0">
              Manage restaurant information, location, images, and visibility
              across Calbayog City Tourism.
            </p>
          </Col>

          <Col xs={12} md="auto">
            <Button className="restaurant-add-button" onClick={openAddModal}>
              <Plus size={17} className="me-2" />
              Add Restaurant
            </Button>
          </Col>
        </Row>

        {error && !showModal && (
          <Alert
            variant="danger"
            dismissible
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            variant="success"
            dismissible
            onClose={() => setSuccess("")}
          >
            {success}
          </Alert>
        )}

        {/* SUMMARY CARDS */}
        <Row className="g-3 mb-4">
          <Col xs={6} xl={3}>
            <Card className="restaurant-stat-card">
              <div className="restaurant-stat-label">Total Restaurants</div>
              <div className="restaurant-stat-number">{restaurants.length}</div>
              <div className="restaurant-stat-caption">
                All restaurant records
              </div>
            </Card>
          </Col>

          <Col xs={6} xl={3}>
            <Card className="restaurant-stat-card">
              <div className="restaurant-stat-label">Active</div>
              <div className="restaurant-stat-number">{activeCount}</div>
              <div className="restaurant-stat-caption">
                Visible on the public page
              </div>
            </Card>
          </Col>

          <Col xs={6} xl={3}>
            <Card className="restaurant-stat-card">
              <div className="restaurant-stat-label">Featured</div>
              <div className="restaurant-stat-number">{featuredCount}</div>
              <div className="restaurant-stat-caption">
                Highlighted restaurants
              </div>
            </Card>
          </Col>

          <Col xs={6} xl={3}>
            <Card className="restaurant-stat-card">
              <div className="restaurant-stat-label">Search Results</div>
              <div className="restaurant-stat-number">
                {filteredRestaurants.length}
              </div>
              <div className="restaurant-stat-caption">
                Matching current filters
              </div>
            </Card>
          </Col>
        </Row>

        {/* SEARCH AND FILTERS */}
        <Card className="restaurant-toolbar mb-4">
          <Card.Body>
            <div className="restaurant-section-heading">
              <span className="restaurant-section-icon">
                <SlidersHorizontal size={17} />
              </span>
              <div>
                <div>Find Restaurants</div>
                <div className="text-muted small fw-normal">
                  Search and filter your restaurant records.
                </div>
              </div>
            </div>

            <Row className="g-3">
              <Col xs={12} lg={5}>
                <InputGroup className="restaurant-search-group">
                  <InputGroup.Text>
                    <Search size={16} />
                  </InputGroup.Text>

                  <Form.Control
                    aria-label="Search restaurants"
                    placeholder="Search name, cuisine, or address..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />

                  {search && (
                    <Button
                      type="button"
                      variant="outline-secondary"
                      aria-label="Clear search"
                      onClick={() => setSearch("")}
                    >
                      <X size={15} />
                    </Button>
                  )}
                </InputGroup>
              </Col>

              <Col xs={12} sm={6} lg={3}>
                <Form.Select
                  aria-label="Filter by status"
                  value={activeFilter}
                  onChange={(event) => setActiveFilter(event.target.value)}
                >
                  <option value="All">All statuses</option>
                  <option value="Active">Active only</option>
                  <option value="Inactive">Inactive only</option>
                  <option value="Featured">Featured only</option>
                </Form.Select>
              </Col>

              <Col xs={12} sm={6} lg={4}>
                <Form.Select
                  aria-label="Filter by cuisine"
                  value={cuisineFilter}
                  onChange={(event) => setCuisineFilter(event.target.value)}
                >
                  <option value="All">All cuisine types</option>
                  {cuisines.map((cuisine) => (
                    <option key={cuisine} value={cuisine}>
                      {cuisine}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* RESTAURANT CARDS */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" style={{ color: PRIMARY }} />
            <p className="text-muted mt-3 mb-0">Loading restaurants...</p>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <Card className="restaurant-toolbar">
            <Card.Body className="text-center py-5">
              <UtensilsCrossed
                size={43}
                className="mb-3"
                color={PRIMARY}
              />
              <h5 className="fw-bold">No restaurants found</h5>
              <p className="text-muted small">
                Try adjusting your filters or add a restaurant to get started.
              </p>
              <Button className="restaurant-add-button" onClick={openAddModal}>
                <Plus size={16} className="me-2" />
                Add Restaurant
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <Row className="g-4">
            {filteredRestaurants.map((restaurant) => (
              <Col key={restaurant.id} xs={12} sm={6} xl={4}>
                <Card className="restaurant-card">
                  <div className="restaurant-image-shell">
                    {restaurant.images?.[0] ? (
                      <img
                        src={restaurant.images[0]}
                        alt={restaurant.name}
                        className="restaurant-image"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <UtensilsCrossed
                        size={43}
                        color={PRIMARY}
                        aria-label="No restaurant image"
                      />
                    )}

                    <div
                      style={{
                        position: "absolute",
                        top: 11,
                        right: 11,
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                        justifyContent: "flex-end",
                      }}
                    >
                      {restaurant.featured && (
                        <Badge
                          className="restaurant-pill"
                          style={{ background: YELLOW, color: "#4D3500" }}
                        >
                          Featured
                        </Badge>
                      )}

                      <Badge
                        className="restaurant-pill"
                        bg={
                          restaurant.is_active !== false
                            ? "success"
                            : "secondary"
                        }
                      >
                        {restaurant.is_active !== false
                          ? "Active"
                          : "Inactive"}
                      </Badge>
                    </div>
                  </div>

                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                      <div className="restaurant-card-name">
                        {restaurant.name}
                      </div>
                    </div>

                    <div className="d-flex flex-wrap gap-2 mb-3">
                      <Badge
                        className="restaurant-pill"
                        style={{ background: "#EEF0FF", color: PRIMARY }}
                      >
                        {restaurant.cuisine_type || "Cuisine not specified"}
                      </Badge>

                      {restaurant.price_range && (
                        <Badge
                          className="restaurant-pill"
                          style={{ background: "#FFF5D9", color: "#806000" }}
                        >
                          {restaurant.price_range}
                        </Badge>
                      )}
                    </div>

                    <p className="restaurant-card-description mb-3">
                      {restaurant.short_description ||
                        restaurant.description ||
                        "No description added yet."}
                    </p>

                    {restaurant.location_address && (
                      <div className="restaurant-card-location mb-2">
                        <MapPin size={14} style={{ flexShrink: 0 }} />
                        <span>{restaurant.location_address}</span>
                      </div>
                    )}

                    {restaurant.opening_hours && (
                      <div className="restaurant-card-location mb-3">
                        <Clock3 size={14} style={{ flexShrink: 0 }} />
                        <span>{restaurant.opening_hours}</span>
                      </div>
                    )}

                    <div className="restaurant-card-actions">
                      <Button
                        variant="outline-primary"
                        className="flex-grow-1"
                        onClick={() => openEditModal(restaurant)}
                      >
                        <Pencil size={14} className="me-1" />
                        Edit Restaurant
                      </Button>

                      <Button
                        variant="outline-danger"
                        aria-label={`Delete ${restaurant.name}`}
                        onClick={() => setDeleteTarget(restaurant)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>

      {/* ADD / EDIT RESTAURANT MODAL */}
      <Modal
        show={showModal}
        onHide={closeForm}
        size="xl"
        centered
        scrollable
        className={`admin-restaurants-page ${
          darkMode ? "admin-restaurants-dark" : ""
        }`}
        backdrop={saving ? "static" : true}
        keyboard={!saving}
      >
        <Form
          className="restaurant-modal-form"
          onSubmit={handleSave}
        >
          <Modal.Header
            closeButton={!saving}
            className="restaurant-modal-header"
          >
            <div className="d-flex align-items-center gap-3">
              <span
                className="d-inline-flex align-items-center justify-content-center"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: "rgba(255,255,255,.16)",
                  border: "1px solid rgba(255,255,255,.22)",
                }}
              >
                {editingId ? <Pencil size={20} /> : <Plus size={22} />}
              </span>

              <div>
                <div
                  style={{
                    fontSize: ".58rem",
                    letterSpacing: ".1em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,.75)",
                    fontWeight: 800,
                  }}
                >
                  Restaurant Management
                </div>

                <Modal.Title>
                  {editingId ? "Edit Restaurant" : "Add Restaurant"}
                </Modal.Title>
              </div>
            </div>
          </Modal.Header>

          <Modal.Body className="restaurant-modal-body">
            {error && (
              <Alert
                variant="danger"
                dismissible
                onClose={() => setError("")}
              >
                {error}
              </Alert>
            )}

            <div className="restaurant-form-section">
              <Building2 size={17} />
              Restaurant Information
            </div>

            <Row className="g-3">
              <Col xs={12}>
                <Form.Group controlId="restaurant-name">
                  <Form.Label>Restaurant Name *</Form.Label>
                  <Form.Control
                    required
                    autoFocus
                    maxLength={150}
                    value={form.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    placeholder="Enter the restaurant name"
                  />
                </Form.Group>
              </Col>

              <Col xs={12} md={6}>
                <Form.Group controlId="restaurant-cuisine">
                  <Form.Label>Cuisine Type</Form.Label>
                  <Form.Control
                    value={form.cuisine_type}
                    onChange={(event) =>
                      updateField("cuisine_type", event.target.value)
                    }
                    placeholder="e.g. Filipino, Seafood, Café"
                    list="restaurant-cuisine-suggestions"
                  />
                  <datalist id="restaurant-cuisine-suggestions">
                    <option value="Filipino" />
                    <option value="Seafood" />
                    <option value="Grill" />
                    <option value="Fast Food" />
                    <option value="Café" />
                    <option value="Bakery" />
                    <option value="Local Cuisine" />
                  </datalist>
                </Form.Group>
              </Col>

              <Col xs={12} md={6}>
                <Form.Group controlId="restaurant-price-range">
                  <Form.Label>Price Range</Form.Label>
                  <Form.Control
                    value={form.price_range}
                    onChange={(event) =>
                      updateField("price_range", event.target.value)
                    }
                    placeholder="e.g. ₱100–₱300"
                  />
                </Form.Group>
              </Col>

              <Col xs={12}>
                <Form.Group controlId="restaurant-short-description">
                  <Form.Label>Short Description</Form.Label>
                  <Form.Control
                    value={form.short_description}
                    onChange={(event) =>
                      updateField("short_description", event.target.value)
                    }
                    placeholder="A short introduction for the restaurant card"
                  />
                  <Form.Text className="text-muted">
                    This description is suitable for restaurant preview cards.
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col xs={12}>
                <Form.Group controlId="restaurant-description">
                  <Form.Label>Full Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={form.description}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                    placeholder="Describe the restaurant, food, and dining experience..."
                  />
                </Form.Group>
              </Col>
            </Row>

            <hr className="my-4" />

            <div className="restaurant-form-section">
              <MapPin size={17} />
              Restaurant Location
            </div>

            <div className="restaurant-map-heading">
              <Form.Label className="fw-bold mb-0">
                Set Restaurant Location
              </Form.Label>

              <div className="restaurant-map-help">
                Search for the restaurant or its address, select a result, and
                adjust the marker on the map. The selected coordinates are
                included in the form when saved.
              </div>

              {typeof form.location_lat === "number" &&
                typeof form.location_lng === "number" && (
                  <Badge bg="success" className="mt-2">
                    <Check size={12} className="me-1" />
                    Coordinates selected
                  </Badge>
                )}
            </div>

            <LocationPicker
              name={form.name}
              latitude={form.location_lat}
              longitude={form.location_lng}
              address={form.location_address}
              category="Other"
              attractionType="Restaurants"
              searchablePlaces={restaurants.map((restaurant) => ({
                id: restaurant.id,
                name: restaurant.name,
                address: restaurant.location_address,
              }))}
              onChange={({ latitude, longitude, address }) => {
                updateField("location_lat", latitude);
                updateField("location_lng", longitude);

                if (address) {
                  updateField("location_address", address);
                }
              }}
            />

            <Row className="g-3 mt-2">
              <Col xs={12}>
                <Form.Group controlId="restaurant-address">
                  <Form.Label>Address / Location</Form.Label>
                  <Form.Control
                    value={form.location_address}
                    onChange={(event) =>
                      updateField("location_address", event.target.value)
                    }
                    placeholder="Enter or confirm the restaurant address"
                  />
                </Form.Group>
              </Col>

              <Col xs={12} md={6}>
                <Form.Group controlId="restaurant-latitude">
                  <Form.Label>Latitude</Form.Label>
                  <Form.Control
                    type="number"
                    step="any"
                    value={form.location_lat ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      updateField(
                        "location_lat",
                        value === "" ? null : Number(value),
                      );
                    }}
                    placeholder="Select a point on the map"
                  />
                </Form.Group>
              </Col>

              <Col xs={12} md={6}>
                <Form.Group controlId="restaurant-longitude">
                  <Form.Label>Longitude</Form.Label>
                  <Form.Control
                    type="number"
                    step="any"
                    value={form.location_lng ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      updateField(
                        "location_lng",
                        value === "" ? null : Number(value),
                      );
                    }}
                    placeholder="Select a point on the map"
                  />
                </Form.Group>
              </Col>
            </Row>

            <hr className="my-4" />

            <div className="restaurant-form-section">
              <Clock3 size={17} />
              Contact and Opening Hours
            </div>

            <Row className="g-3">
              <Col xs={12} md={6}>
                <Form.Group controlId="restaurant-phone">
                  <Form.Label>Contact Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    value={form.contact_phone}
                    onChange={(event) =>
                      updateField("contact_phone", event.target.value)
                    }
                    placeholder="Enter contact number"
                  />
                </Form.Group>
              </Col>

              <Col xs={12} md={6}>
                <Form.Group controlId="restaurant-website">
                  <Form.Label>Website / Social Link</Form.Label>
                  <Form.Control
                    type="url"
                    value={form.contact_website}
                    onChange={(event) =>
                      updateField("contact_website", event.target.value)
                    }
                    placeholder="https://..."
                  />
                </Form.Group>
              </Col>

              <Col xs={12}>
                <Form.Group controlId="restaurant-opening-hours">
                  <Form.Label>Opening Hours</Form.Label>
                  <Form.Control
                    value={form.opening_hours}
                    onChange={(event) =>
                      updateField("opening_hours", event.target.value)
                    }
                    placeholder="e.g. Daily, 8:00 AM – 9:00 PM"
                  />
                </Form.Group>
              </Col>
            </Row>

            <hr className="my-4" />

            <div className="restaurant-form-section">
              <UtensilsCrossed size={17} />
              Restaurant Images
            </div>

            <Form.Group controlId="restaurant-images">
              <Form.Label>Upload Images</Form.Label>
              <Form.Control
                key={fileInputKey}
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => {
                  const files = (event.target as HTMLInputElement).files;
                  setSelectedFiles(files ? Array.from(files) : []);
                }}
              />
              <Form.Text className="text-muted">
                Existing images are retained unless you remove them below.
                Newly selected images upload when you save the form.
              </Form.Text>
            </Form.Group>

            {form.images.length > 0 && (
              <div className="mt-3">
                <div className="small fw-bold mb-2">Existing Images</div>
                <div className="d-flex flex-wrap gap-3">
                  {form.images.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className="position-relative"
                    >
                      <img
                        src={url}
                        alt={`Restaurant image ${index + 1}`}
                        className="restaurant-existing-image"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        aria-label={`Remove image ${index + 1}`}
                        className="position-absolute top-0 end-0 p-1"
                        style={{ transform: "translate(25%, -25%)" }}
                        onClick={() => removeExistingImage(index)}
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedFiles.length > 0 && (
              <Alert variant="info" className="mt-3 mb-0">
                {selectedFiles.length} new image(s) selected for upload.
              </Alert>
            )}

            <hr className="my-4" />

            <div className="restaurant-form-section">
              <Check size={17} />
              Publication Settings
            </div>

            <Row className="g-3">
              <Col xs={12} md={6}>
                <Card className="h-100 border">
                  <Card.Body>
                    <Form.Check
                      type="switch"
                      id="restaurant-featured"
                      label="Featured restaurant"
                      checked={form.featured}
                      onChange={(event) =>
                        updateField("featured", event.target.checked)
                      }
                    />
                    <Form.Text className="text-muted">
                      Highlight this restaurant in featured sections.
                    </Form.Text>
                  </Card.Body>
                </Card>
              </Col>

              <Col xs={12} md={6}>
                <Card className="h-100 border">
                  <Card.Body>
                    <Form.Check
                      type="switch"
                      id="restaurant-active"
                      label="Active restaurant"
                      checked={form.is_active}
                      onChange={(event) =>
                        updateField("is_active", event.target.checked)
                      }
                    />
                    <Form.Text className="text-muted">
                      Active restaurants can appear on the public page.
                    </Form.Text>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer className="restaurant-modal-footer">
            <Button
              type="button"
              variant="outline-secondary"
              disabled={saving}
              onClick={closeForm}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="restaurant-save-button"
              disabled={saving || uploading}
            >
              {saving || uploading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  {uploading ? "Uploading images..." : "Saving..."}
                </>
              ) : editingId ? (
                <>
                  <Check size={15} className="me-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Plus size={16} className="me-2" />
                  Add Restaurant
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* DELETE CONFIRMATION */}
      <Modal
        show={Boolean(deleteTarget)}
        onHide={() => !saving && setDeleteTarget(null)}
        centered
      >
        <Modal.Header closeButton={!saving}>
          <Modal.Title>Delete Restaurant</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          Are you sure you want to delete{" "}
          <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
        </Modal.Body>

        <Modal.Footer>
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="danger"
            disabled={saving}
            onClick={() => void handleDelete()}
          >
            {saving ? (
              <>
                <Spinner size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={15} className="me-2" />
                Delete Restaurant
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
};

export default AdminRestaurants;
