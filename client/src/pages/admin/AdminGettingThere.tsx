import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Badge, Spinner, Alert } from "react-bootstrap";
import {
  Bus,
  Car,
  Clock3,
  DollarSign,
  ListOrdered,
  MapPin,
  Plus,
  Route,
  X,
} from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  getGettingThere,
  createGettingThere,
  updateGettingThere,
  deleteGettingThere,
  clearCache,
} from "../../services/api";
import { useDarkMode } from "../../context/DarkModeContext";

type GEntry = {
  id: string;
  category: "land" | "local";
  origin?: string;
  steps?: string[];
  total_fare?: string;
  duration?: string;
  mode?: string;
  description?: string;
  icon?: string;
};

const EMPTY_LAND = {
  category: "land" as const,
  origin: "",
  steps: [""],
  total_fare: "",
  duration: "",
};
const EMPTY_LOCAL = {
  category: "local" as const,
  mode: "",
  description: "",
  icon: "🚗",
};

/* =========================================================
   PAGE STYLES
========================================================= */

const ADMIN_GETTING_THERE_STYLES = `
  @font-face {
    font-family: "Barabara";
    src: url("/fonts/BARABARA-final.otf") format("opentype");
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  .admin-getting-there-page {
    --admin-primary: #2D3195;
    --admin-primary-dark: #242879;
    --admin-yellow: #FFB71B;
    --admin-surface: #FFFFFF;
    --admin-border: #E8EAF1;
    --admin-text: #1B1D24;
    --admin-muted: #737886;

    min-height: 100vh;
    width: 100%;
    padding: 0 0 56px;
    background: transparent;
    color: var(--admin-text);
    font-family: "Nunito", "Poppins", "Segoe UI", sans-serif;
  }

  .admin-getting-there-page *, .admin-getting-there-page *::before, .admin-getting-there-page *::after { box-sizing: border-box; }

  .admin-gt-heading { align-items: flex-end !important; gap: 22px; margin: 0 0 26px !important; }
  .admin-gt-eyebrow { margin-bottom: 5px; color: var(--admin-primary); font-size: .66rem; font-weight: 900; letter-spacing: .16em; text-transform: uppercase; }
  .admin-gt-title { margin: 0 !important; color: var(--admin-primary) !important; font-family: "Barabara", sans-serif !important; font-size: clamp(1.65rem, 2.8vw, 2.4rem) !important; font-weight: 400 !important; line-height: .95 !important; }
  .admin-gt-subtitle { max-width: 720px; margin: 8px 0 0 !important; color: var(--admin-muted) !important; font-size: .80rem !important; font-weight: 600 !important; line-height: 1.55 !important; }

  .admin-gt-add-button {
    flex: 0 0 auto; display: inline-flex !important; align-items: center; gap: 7px;
    min-height: 46px; padding: 11px 19px !important; border: 0 !important; border-radius: 13px !important;
    background: var(--admin-primary) !important; color: #fff !important;
    box-shadow: 0 10px 24px rgba(45,49,149,.20); font-size: .76rem !important; font-weight: 900 !important;
  }
  .admin-gt-add-button:hover { background: var(--admin-primary-dark) !important; }

  .admin-gt-badge-row { display:flex; gap:8px; flex-wrap:wrap; margin-bottom: 18px; }
  .admin-gt-pill { display:inline-flex; align-items:center; gap:6px; padding:8px 13px; border-radius:999px; font-size:.68rem; font-weight:900; }
  .admin-gt-pill-primary { background:#eef0ff; color:#2D3195; }
  .admin-gt-pill-yellow { background:#fff5d9; color:#8e6200; }

  .admin-gt-section {
    border:1px solid var(--admin-border); border-radius:18px; background:var(--admin-surface);
    box-shadow: 0 7px 24px rgba(26,30,53,.055); padding: 20px; margin-bottom: 22px;
  }
  .admin-gt-section-title { display:flex; align-items:center; gap:9px; margin-bottom:16px; font-family:"Poppins",sans-serif; font-size:.92rem; font-weight:800; color: var(--admin-text); }
  .admin-gt-section-icon { width:32px; height:32px; display:inline-flex; align-items:center; justify-content:center; border-radius:10px; background:#eef0ff; color:#2D3195; }

  .admin-gt-empty { padding: 26px 10px; text-align:center; color: var(--admin-muted); font-size:.78rem; font-weight:600; }

  .admin-gt-table { border-collapse: separate; border-spacing: 0 8px; width: 100%; }
  .admin-gt-table thead th {
    background: #F5F6FB; color: #4e5564; font-size:.63rem; font-weight:900; letter-spacing:.05em; text-transform:uppercase;
    padding: 10px 14px; border: 0;
  }
  .admin-gt-table thead th:first-child { border-radius: 10px 0 0 10px; }
  .admin-gt-table thead th:last-child { border-radius: 0 10px 10px 0; }

  .admin-gt-row { cursor:pointer; transition: transform .15s ease, box-shadow .15s ease; }
  .admin-gt-row td {
    background: var(--admin-surface); border:1px solid var(--admin-border); border-left:0; border-right:0;
    padding: 12px 14px; font-size:.76rem; color: var(--admin-text); vertical-align: middle;
  }
  .admin-gt-row td:first-child { border-left:1px solid var(--admin-border); border-radius:12px 0 0 12px; }
  .admin-gt-row td:last-child { border-right:1px solid var(--admin-border); border-radius:0 12px 12px 0; }
  .admin-gt-row:hover td { box-shadow: 0 6px 18px rgba(26,30,53,.07); }

  .admin-gt-fare-badge { display:inline-flex; align-items:center; gap:4px; background:#eef0ff; color:#2D3195; border-radius:999px; padding:5px 10px; font-size:.68rem; font-weight:900; }
  .admin-gt-steps-count { color: var(--admin-muted); font-size:.7rem; font-weight:700; }

  .admin-gt-icon-cell { font-size: 1.4rem; }

  .admin-gt-row-actions { display:flex; gap:8px; }
  .admin-gt-row-actions .btn { display:inline-flex; align-items:center; gap:5px; border-radius:9px !important; font-size:.65rem !important; font-weight:900 !important; padding: 6px 10px !important; }
  .admin-gt-row-actions .btn-outline-primary { color:#2D3195 !important; border-color:rgba(45,49,149,.25) !important; background:#F8F8FF !important; }
  .admin-gt-row-actions .btn-outline-primary:hover { color:#fff !important; background:#2D3195 !important; border-color:#2D3195 !important; }
  .admin-gt-row-actions .btn-outline-danger { color:#C74350 !important; border-color:rgba(199,67,80,.2) !important; background:#FFF7F8 !important; }
  .admin-gt-row-actions .btn-outline-danger:hover { color:#fff !important; background:#C74350 !important; border-color:#C74350 !important; }

  .admin-gt-tabs { display:flex; gap:8px; margin-bottom: 18px; }
  .admin-gt-tab {
    padding: 8px 18px; border-radius: 999px; border: 2px solid var(--admin-border); background: transparent;
    color: var(--admin-text); font-weight: 800; font-size: .74rem; cursor: pointer; display:inline-flex; align-items:center; gap:6px;
    transition: all .15s ease;
  }
  .admin-gt-tab-active { border-color:#2D3195; background:#2D3195; color:#fff; }
  .admin-gt-tab[disabled] { cursor: default; }

  .admin-getting-there-modal .modal-content { overflow:hidden; border:1px solid var(--admin-border) !important; border-radius:18px !important; box-shadow:0 22px 60px rgba(26,30,53,.18) !important; }
  .admin-getting-there-modal .modal-header { background:#2D3195 !important; color:#fff !important; border-bottom:0 !important; padding:18px 21px !important; }
  .admin-getting-there-modal .modal-header .btn-close { filter:brightness(0) invert(1); opacity:.85; }
  .admin-gt-modal-title { display:inline-flex; align-items:center; gap:8px; color:#fff !important; font-family:"Poppins",sans-serif !important; font-size:.98rem !important; font-weight:800 !important; }
  .admin-getting-there-modal .modal-body { padding:22px !important; background:var(--admin-surface) !important; color:var(--admin-text) !important; }
  .admin-getting-there-modal .modal-footer { gap:8px; padding:12px 20px !important; background:var(--admin-surface) !important; border-top:1px solid #EEF0F4 !important; }
  .admin-getting-there-modal .form-label { color:#4e5564 !important; font-size:.67rem !important; font-weight:900 !important; margin-bottom:6px; }
  .admin-getting-there-modal .form-control, .admin-getting-there-modal .form-select {
    min-height:42px; border:1px solid #e0e3ea !important; border-radius:11px !important; font-size:.70rem !important; font-weight:600 !important;
    box-shadow:0 3px 10px rgba(26,30,53,.025) !important;
  }
  .admin-getting-there-modal .form-control:focus { border-color:rgba(45,49,149,.52) !important; box-shadow:0 0 0 3px rgba(45,49,149,.08) !important; }
  .admin-getting-there-modal .modal-footer .btn { min-height:39px; border-radius:11px !important; padding:8px 15px !important; font-size:.69rem !important; font-weight:900 !important; }
  .admin-getting-there-modal .modal-footer .btn-primary { border:0 !important; background:var(--admin-primary) !important; color:#fff !important; box-shadow:0 8px 18px rgba(45,49,149,.16); }
  .admin-getting-there-modal .modal-footer .btn-secondary { border-color:#E0E3EB !important; background:#fff !important; color:#656A76 !important; }

  .admin-gt-detail-box { padding:12px 14px; border-radius:12px; background:#FAFAFF; border:1px solid var(--admin-border); margin-bottom:10px; }
  .admin-gt-detail-box small { display:inline-flex; align-items:center; gap:5px; color:var(--admin-muted); font-size:.63rem; font-weight:900; text-transform:uppercase; letter-spacing:.04em; }
  .admin-gt-detail-box small svg { color:#2D3195; }
  .admin-gt-detail-box strong, .admin-gt-detail-box p { display:block; margin-top:4px; color:var(--admin-text); font-size:.85rem; font-weight:700; }
  .admin-gt-detail-box ol { margin: 6px 0 0; padding-left: 1.2rem; font-size: .82rem; font-weight: 600; color: var(--admin-text); }
  .admin-gt-detail-box ol li { margin-bottom: 6px; }

  .admin-getting-there-dark { --admin-surface:#191C2B; --admin-border:#2B3042; --admin-text:#F1F3F8; --admin-muted:#A8AFBF; }
  .admin-getting-there-dark .admin-gt-section, .admin-getting-there-dark .modal-content { background:#191C2B !important; border-color:#2B3042 !important; }
  .admin-getting-there-dark .admin-gt-table thead th { background:#202436; color:#c9ccff; }
  .admin-getting-there-dark .admin-gt-row td { background:#191C2B !important; border-color:#2B3042 !important; color:#F1F3F8; }
  .admin-getting-there-dark .admin-gt-section-icon { background:#262B46; color:#AEB4FF; }
  .admin-getting-there-dark .admin-getting-there-modal .modal-body, .admin-getting-there-dark .admin-getting-there-modal .modal-footer { background:#191C2B !important; }
  .admin-getting-there-dark .admin-getting-there-modal .form-control { background:#202436 !important; border-color:#343A4F !important; color:#F1F3F8 !important; }
  .admin-getting-there-dark .admin-gt-detail-box { background:#202436 !important; border-color:#343A4F !important; }
  .admin-getting-there-dark .admin-gt-tab { border-color:#343A4F; color:#F1F3F8; }
`;

const AdminGettingThere: React.FC = () => {
  const { darkMode } = useDarkMode();
  const [items, setItems] = useState<GEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<GEntry | null>(null);
  const [catTab, setCatTab] = useState<"land" | "local">("land");
  const [formLand, setFormLand] = useState(EMPTY_LAND);
  const [formLocal, setFormLocal] = useState(EMPTY_LOCAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [viewItem, setViewItem] = useState<GEntry | null>(null);

  const load = () => {
    setLoading(true);
    clearCache("/getting-there");
    getGettingThere()
      .then((r) => setItems(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormLand(EMPTY_LAND);
    setFormLocal(EMPTY_LOCAL);
    setCatTab("land");
    setError("");
    setShowModal(true);
  };

  const openEdit = (e: GEntry) => {
    setEditing(e);
    setCatTab(e.category);
    if (e.category === "land") {
      setFormLand({
        category: "land",
        origin: e.origin || "",
        steps: e.steps?.length ? e.steps : [""],
        total_fare: e.total_fare || "",
        duration: e.duration || "",
      });
    } else {
      setFormLocal({
        category: "local",
        mode: e.mode || "",
        description: e.description || "",
        icon: e.icon || "🚗",
      });
    }
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload =
        catTab === "land"
          ? { ...formLand, steps: formLand.steps.filter((s) => s.trim()) }
          : { ...formLocal };
      if (editing) await updateGettingThere(editing.id, payload);
      else await createGettingThere(payload);
      setShowModal(false);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    await deleteGettingThere(id).catch(() => {});
    load();
  };

  const land = items.filter((i) => i.category === "land");
  const local = items.filter((i) => i.category === "local");

  return (
    <AdminLayout>
      <div className={`admin-getting-there-page ${darkMode ? "admin-getting-there-dark" : ""}`}>
        <style>{ADMIN_GETTING_THERE_STYLES}</style>

        {/* Header */}
        <div className="admin-gt-heading d-flex justify-content-between">
          <div>
            <div className="admin-gt-eyebrow">CONTENT MANAGEMENT</div>
            <h2 className="admin-gt-title">GETTING THERE</h2>
            <p className="admin-gt-subtitle">
              Manage land routes into Calbayog City and local transport options available once visitors arrive.
            </p>
          </div>

          <Button variant="primary" onClick={openCreate} className="admin-gt-add-button">
            <Plus size={17} strokeWidth={2.2} />
            <span>Add Entry</span>
          </Button>
        </div>

        <div className="admin-gt-badge-row">
          <span className="admin-gt-pill admin-gt-pill-primary">
            <Bus size={14} strokeWidth={2.2} />
            {land.length} Land Routes
          </span>
          <span className="admin-gt-pill admin-gt-pill-yellow">
            <Car size={14} strokeWidth={2.2} />
            {local.length} Local Transport
          </span>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" style={{ color: "#2D3195" }} />
          </div>
        ) : (
          <>
            {/* Land Routes */}
            <div className="admin-gt-section">
              <div className="admin-gt-section-title">
                <span className="admin-gt-section-icon">
                  <Bus size={16} strokeWidth={2.1} />
                </span>
                Land Routes
              </div>

              {land.length === 0 ? (
                <div className="admin-gt-empty">No land routes yet.</div>
              ) : (
                <div className="table-responsive">
                  <Table className="admin-gt-table" borderless>
                    <thead>
                      <tr>
                        <th>Origin</th>
                        <th>Duration</th>
                        <th>Total Fare</th>
                        <th>Steps</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {land.map((e, idx) => (
                        <tr key={e.id || idx} className="admin-gt-row" onClick={() => setViewItem(e)}>
                          <td><strong>{e.origin}</strong></td>
                          <td>{e.duration}</td>
                          <td>
                            <span className="admin-gt-fare-badge">
                              <DollarSign size={12} strokeWidth={2.2} />
                              {e.total_fare}
                            </span>
                          </td>
                          <td>
                            <span className="admin-gt-steps-count">{e.steps?.length || 0} steps</span>
                          </td>
                          <td>
                            <div className="admin-gt-row-actions" onClick={(ev) => ev.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() => openEdit(e)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => handleDelete(e.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>

            {/* Local Transport */}
            <div className="admin-gt-section">
              <div className="admin-gt-section-title">
                <span className="admin-gt-section-icon">
                  <Car size={16} strokeWidth={2.1} />
                </span>
                Local Transport
              </div>

              {local.length === 0 ? (
                <div className="admin-gt-empty">No local transport yet.</div>
              ) : (
                <div className="table-responsive">
                  <Table className="admin-gt-table" borderless>
                    <thead>
                      <tr>
                        <th>Icon</th>
                        <th>Mode</th>
                        <th>Description</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {local.map((e, idx) => (
                        <tr key={e.id || idx} className="admin-gt-row" onClick={() => setViewItem(e)}>
                          <td className="admin-gt-icon-cell">{e.icon}</td>
                          <td><strong>{e.mode}</strong></td>
                          <td>
                            <span className="admin-gt-steps-count">{e.description}</span>
                          </td>
                          <td>
                            <div className="admin-gt-row-actions" onClick={(ev) => ev.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() => openEdit(e)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => handleDelete(e.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Add/Edit Modal */}
        <Modal
          className="admin-getting-there-modal"
          show={showModal}
          onHide={() => setShowModal(false)}
          centered
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title className="admin-gt-modal-title">
              <Route size={18} strokeWidth={2.1} />
              {editing ? "Edit Entry" : "Add Entry"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}

            <div className="admin-gt-tabs">
              {(["land", "local"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  disabled={!!editing}
                  onClick={() => !editing && setCatTab(cat)}
                  className={`admin-gt-tab ${catTab === cat ? "admin-gt-tab-active" : ""}`}
                >
                  {cat === "land" ? <Bus size={14} strokeWidth={2.2} /> : <Car size={14} strokeWidth={2.2} />}
                  {cat === "land" ? "Land" : "Local"}
                </button>
              ))}
            </div>

            {catTab === "land" ? (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Origin (From)</Form.Label>
                  <Form.Control
                    value={formLand.origin}
                    onChange={(e) => setFormLand((f) => ({ ...f, origin: e.target.value }))}
                    placeholder="e.g. Allen Port (Samar)"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Duration</Form.Label>
                  <Form.Control
                    value={formLand.duration}
                    onChange={(e) => setFormLand((f) => ({ ...f, duration: e.target.value }))}
                    placeholder="e.g. ~3 hours"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Total Fare</Form.Label>
                  <Form.Control
                    value={formLand.total_fare}
                    onChange={(e) => setFormLand((f) => ({ ...f, total_fare: e.target.value }))}
                    placeholder="e.g. ₱120–₱180"
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Steps</Form.Label>
                  {formLand.steps.map((step, i) => (
                    <div key={i} className="d-flex gap-2 mb-2">
                      <Form.Control
                        value={step}
                        onChange={(e) =>
                          setFormLand((f) => ({
                            ...f,
                            steps: f.steps.map((s, si) => (si === i ? e.target.value : s)),
                          }))
                        }
                        placeholder={`Step ${i + 1}`}
                      />
                      {formLand.steps.length > 1 && (
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() =>
                            setFormLand((f) => ({
                              ...f,
                              steps: f.steps.filter((_, si) => si !== i),
                            }))
                          }
                        >
                          <X size={14} strokeWidth={2.2} />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => setFormLand((f) => ({ ...f, steps: [...f.steps, ""] }))}
                  >
                    <Plus size={13} strokeWidth={2.2} className="me-1" />
                    Add Step
                  </Button>
                </Form.Group>
              </>
            ) : (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Icon (Emoji)</Form.Label>
                  <Form.Control
                    value={formLocal.icon}
                    onChange={(e) => setFormLocal((f) => ({ ...f, icon: e.target.value }))}
                    placeholder="e.g. 🛺"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Mode (Transport name)</Form.Label>
                  <Form.Control
                    value={formLocal.mode}
                    onChange={(e) => setFormLocal((f) => ({ ...f, mode: e.target.value }))}
                    placeholder="e.g. Tricycle"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Description (include fare)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={formLocal.description}
                    onChange={(e) => setFormLocal((f) => ({ ...f, description: e.target.value }))}
                    placeholder="e.g. City Proper & nearby barangays, ₱10–₱30 per ride"
                  />
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Add Entry"}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Detail View Modal */}
        {viewItem && (
          <Modal
            className="admin-getting-there-modal"
            show={!!viewItem}
            onHide={() => setViewItem(null)}
            size="lg"
            centered
            fullscreen="sm-down"
          >
            <Modal.Header closeButton>
              <Modal.Title className="admin-gt-modal-title">
                {viewItem.category === "land" ? (
                  <>
                    <Bus size={18} strokeWidth={2.1} />
                    Land Route Details
                  </>
                ) : (
                  <>
                    <Car size={18} strokeWidth={2.1} />
                    Local Transport Details
                  </>
                )}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {viewItem.category === "land" ? (
                <>
                  <div className="admin-gt-detail-box">
                    <small>
                      <MapPin size={12} strokeWidth={2.2} />
                      Origin
                    </small>
                    <strong>{viewItem.origin}</strong>
                  </div>

                  {viewItem.duration && (
                    <div className="admin-gt-detail-box">
                      <small>
                        <Clock3 size={12} strokeWidth={2.2} />
                        Duration
                      </small>
                      <strong>{viewItem.duration}</strong>
                    </div>
                  )}

                  {viewItem.total_fare && (
                    <div className="admin-gt-detail-box">
                      <small>
                        <DollarSign size={12} strokeWidth={2.2} />
                        Total Fare
                      </small>
                      <strong>{viewItem.total_fare}</strong>
                    </div>
                  )}

                  {viewItem.steps && viewItem.steps.length > 0 && (
                    <div className="admin-gt-detail-box">
                      <small>
                        <ListOrdered size={12} strokeWidth={2.2} />
                        Steps
                      </small>
                      <ol>
                        {viewItem.steps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-center mb-3">
                    <span style={{ fontSize: "3.5rem" }}>{viewItem.icon}</span>
                  </div>

                  <div className="admin-gt-detail-box">
                    <small>
                      <Car size={12} strokeWidth={2.2} />
                      Mode
                    </small>
                    <strong>{viewItem.mode}</strong>
                  </div>

                  {viewItem.description && (
                    <div className="admin-gt-detail-box">
                      <small>
                        <Route size={12} strokeWidth={2.2} />
                        Description
                      </small>
                      <p>{viewItem.description}</p>
                    </div>
                  )}
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setViewItem(null)}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminGettingThere;
