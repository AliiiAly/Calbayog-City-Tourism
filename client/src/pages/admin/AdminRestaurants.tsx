
import React, { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";
import {
  Pencil,
  Plus,
  Search,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import { supabase } from "../../services/supabase";
import {
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  uploadMultipleImages,
  clearCache,
  type Restaurant,
} from "../../services/api";

type RestaurantForm = {
  name: string;
  description: string;
  short_description: string;
  location_address: string;
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
  contact_phone: "",
  contact_website: "",
  opening_hours: "",
  cuisine_type: "",
  price_range: "",
  featured: false,
  is_active: true,
  images: [],
};

const AdminRestaurants: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RestaurantForm>(EMPTY_FORM);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Restaurant | null>(null);

  const loadRestaurants = async () => {
    setLoading(true);
    setError("");

    // Load all rows here so admins can also manage inactive restaurants.
    const { data, error: queryError } = await supabase
      .from("restaurants")
      .select("*")
      .order("created_at", { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setRestaurants([]);
    } else {
      setRestaurants(Array.isArray(data) ? (data as Restaurant[]) : []);
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadRestaurants();
  }, []);

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const term = search.trim().toLowerCase();

    if (!term) return true;

    return [
      restaurant.name,
      restaurant.cuisine_type,
      restaurant.location_address,
      restaurant.short_description,
    ].some((value) => value?.toLowerCase().includes(term));
  });

  const openAddModal = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, images: [] });
    setSelectedFiles([]);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (restaurant: Restaurant) => {
    setEditingId(restaurant.id);
    setForm({
      name: restaurant.name || "",
      description: restaurant.description || "",
      short_description: restaurant.short_description || "",
      location_address: restaurant.location_address || "",
      contact_phone: restaurant.contact_phone || "",
      contact_website: restaurant.contact_website || "",
      opening_hours: restaurant.opening_hours || "",
      cuisine_type: restaurant.cuisine_type || "",
      price_range: restaurant.price_range || "",
      featured: Boolean(restaurant.featured),
      is_active: restaurant.is_active !== false,
      images: Array.isArray(restaurant.images)
        ? [...restaurant.images]
        : [],
    });
    setSelectedFiles([]);
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
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (!form.name.trim()) {
        throw new Error("Restaurant name is required.");
      }

      let uploadedUrls: string[] = [];

      if (selectedFiles.length > 0) {
        const uploadResult = await uploadMultipleImages(selectedFiles);
        uploadedUrls = uploadResult.data.urls;
      }

      const payload: Partial<Restaurant> = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        short_description: form.short_description.trim() || null,
        location_address: form.location_address.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        contact_website: form.contact_website.trim() || null,
        opening_hours: form.opening_hours.trim() || null,
        cuisine_type: form.cuisine_type.trim() || null,
        price_range: form.price_range.trim() || null,
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
      setSelectedFiles([]);
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
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setSaving(true);
    setError("");

    try {
      await deleteRestaurant(deleteTarget.id);
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

  return (
    <AdminLayout>
      <div className="container-fluid py-3">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <h2 className="fw-bold mb-1">Restaurant Management</h2>
            <p className="text-muted mb-0">
              Add, edit, and manage restaurants in Calbayog City.
            </p>
          </div>

          <Button onClick={openAddModal}>
            <Plus size={17} className="me-2" />
            Add Restaurant
          </Button>
        </div>

        {error && !showModal && (
          <Alert variant="danger" dismissible onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess("")}>
            {success}
          </Alert>
        )}

        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <Row className="align-items-center g-3">
              <Col md={8}>
                <div className="position-relative">
                  <Search
                    size={18}
                    className="position-absolute text-muted"
                    style={{ left: 12, top: 11 }}
                  />
                  <Form.Control
                    aria-label="Search restaurants"
                    placeholder="Search by restaurant, cuisine, or location..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    style={{ paddingLeft: 38 }}
                  />
                </div>
              </Col>
              <Col md={4}>
                <div className="text-muted text-md-end">
                  {filteredRestaurants.length} restaurant(s)
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
            <p className="text-muted mt-2">Loading restaurants...</p>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center py-5">
              <UtensilsCrossed size={40} className="text-muted mb-3" />
              <h5>No restaurants found</h5>
              <p className="text-muted">
                Add a restaurant or try a different search.
              </p>
              <Button onClick={openAddModal}>
                <Plus size={16} className="me-2" />
                Add Restaurant
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <Row className="g-4">
            {filteredRestaurants.map((restaurant) => (
              <Col key={restaurant.id} xs={12} sm={6} xl={4}>
                <Card className="h-100 border-0 shadow-sm overflow-hidden">
                  {restaurant.images?.[0] ? (
                    <Card.Img
                      variant="top"
                      src={restaurant.images[0]}
                      alt={restaurant.name}
                      style={{ height: 190, objectFit: "cover" }}
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div
                      className="d-flex align-items-center justify-content-center bg-light text-muted"
                      style={{ height: 190 }}
                    >
                      <UtensilsCrossed size={42} />
                    </div>
                  )}

                  <Card.Body>
                    <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                      <h5 className="fw-bold mb-0">{restaurant.name}</h5>
                      <div className="d-flex flex-wrap gap-1 justify-content-end">
                        {restaurant.featured && (
                          <Badge bg="warning" text="dark">
                            Featured
                          </Badge>
                        )}
                        <Badge bg={restaurant.is_active ? "success" : "secondary"}>
                          {restaurant.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-muted small mb-2">
                      {restaurant.cuisine_type || "Cuisine not specified"}
                    </p>

                    <p className="mb-2">
                      {restaurant.short_description ||
                        restaurant.description ||
                        "No description added yet."}
                    </p>

                    {restaurant.location_address && (
                      <p className="text-muted small mb-2">
                        {restaurant.location_address}
                      </p>
                    )}

                    {restaurant.price_range && (
                      <p className="small mb-3">
                        Price range: {restaurant.price_range}
                      </p>
                    )}

                    <div className="d-flex gap-2 mt-auto">
                      <Button
                        variant="outline-primary"
                        className="flex-grow-1"
                        onClick={() => openEditModal(restaurant)}
                      >
                        <Pencil size={15} className="me-1" />
                        Edit
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

      <Modal
        show={showModal}
        onHide={() => !saving && setShowModal(false)}
        size="lg"
        centered
        scrollable
      >
        <Form onSubmit={handleSave}>
          <Modal.Header closeButton={!saving}>
            <Modal.Title>
              {editingId ? "Edit Restaurant" : "Add Restaurant"}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError("")}>
                {error}
              </Alert>
            )}

            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Restaurant Name *</Form.Label>
                  <Form.Control
                    required
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="Enter restaurant name"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Cuisine Type</Form.Label>
                  <Form.Control
                    value={form.cuisine_type}
                    onChange={(event) =>
                      updateField("cuisine_type", event.target.value)
                    }
                    placeholder="e.g. Filipino, Seafood, Café"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
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

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Short Description</Form.Label>
                  <Form.Control
                    value={form.short_description}
                    onChange={(event) =>
                      updateField("short_description", event.target.value)
                    }
                    placeholder="A brief introduction for the restaurant card"
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Full Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={form.description}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                    placeholder="Describe the restaurant and its food"
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Address / Location</Form.Label>
                  <Form.Control
                    value={form.location_address}
                    onChange={(event) =>
                      updateField("location_address", event.target.value)
                    }
                    placeholder="Enter restaurant address"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Contact Phone</Form.Label>
                  <Form.Control
                    value={form.contact_phone}
                    onChange={(event) =>
                      updateField("contact_phone", event.target.value)
                    }
                    placeholder="Phone number"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Website</Form.Label>
                  <Form.Control
                    value={form.contact_website}
                    onChange={(event) =>
                      updateField("contact_website", event.target.value)
                    }
                    placeholder="https://..."
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
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

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Restaurant Images</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => {
                      const files = Array.from(event.target.files || []);
                      setSelectedFiles(files);
                    }}
                  />
                  <Form.Text className="text-muted">
                    Existing images are kept unless removed below. Newly
                    selected images will upload when you save.
                  </Form.Text>
                </Form.Group>

                {form.images.length > 0 && (
                  <div className="d-flex flex-wrap gap-3 mt-3">
                    {form.images.map((url, index) => (
                      <div
                        key={`${url}-${index}`}
                        className="position-relative"
                        style={{ width: 100 }}
                      >
                        <img
                          src={url}
                          alt={`Restaurant image ${index + 1}`}
                          className="rounded border"
                          style={{
                            width: 100,
                            height: 75,
                            objectFit: "cover",
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          className="position-absolute top-0 end-0 p-1"
                          aria-label="Remove image"
                          onClick={() => removeExistingImage(index)}
                        >
                          <X size={12} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {selectedFiles.length > 0 && (
                  <p className="small text-muted mt-2 mb-0">
                    {selectedFiles.length} new image(s) selected.
                  </p>
                )}
              </Col>

              <Col md={6}>
                <Form.Check
                  type="switch"
                  id="restaurant-featured"
                  label="Featured restaurant"
                  checked={form.featured}
                  onChange={(event) =>
                    updateField("featured", event.target.checked)
                  }
                />
              </Col>

              <Col md={6}>
                <Form.Check
                  type="switch"
                  id="restaurant-active"
                  label="Active (visible on public page)"
                  checked={form.is_active}
                  onChange={(event) =>
                    updateField("is_active", event.target.checked)
                  }
                />
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              type="button"
              disabled={saving}
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Saving...
                </>
              ) : editingId ? (
                "Save Changes"
              ) : (
                "Add Restaurant"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

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
            variant="secondary"
            disabled={saving}
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={saving}
            onClick={handleDelete}
          >
            {saving ? "Deleting..." : "Delete"}
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
};

export default AdminRestaurants;
