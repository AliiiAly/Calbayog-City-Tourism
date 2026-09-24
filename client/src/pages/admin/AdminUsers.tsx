import React, { useState, useEffect } from "react";
import {
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
} from "react-bootstrap";
import {
  Calendar,
  CheckCircle2,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRoundX,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import { useDarkMode } from "../../context/DarkModeContext";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  createNotification,
} from "../../services/api";

interface User {
  id: string;
  username: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const EMPTY = {
  username: "",
  name: "",
  password: "",
  is_active: true,
};

/* =========================================================
   PAGE STYLES
========================================================= */

const ADMIN_USERS_STYLES = `
  @font-face {
    font-family: "Barabara";
    src: url("/fonts/BARABARA-final.otf") format("opentype");
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  .admin-users-page {
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

  .admin-users-page *, .admin-users-page *::before, .admin-users-page *::after { box-sizing: border-box; }

  .admin-users-heading { align-items: flex-end !important; gap: 22px; margin: 0 0 26px !important; }
  .admin-users-eyebrow { margin-bottom: 5px; color: var(--admin-primary); font-size: .66rem; font-weight: 900; letter-spacing: .16em; text-transform: uppercase; }
  .admin-users-title { margin: 0 !important; color: var(--admin-primary) !important; font-family: "Barabara", sans-serif !important; font-size: clamp(1.65rem, 2.8vw, 2.4rem) !important; font-weight: 400 !important; line-height: .95 !important; }
  .admin-users-subtitle { max-width: 720px; margin: 8px 0 0 !important; color: var(--admin-muted) !important; font-size: .80rem !important; font-weight: 600 !important; line-height: 1.55 !important; }

  .admin-users-add-button {
    flex: 0 0 auto; display: inline-flex !important; align-items: center; gap: 7px;
    min-height: 46px; padding: 11px 19px !important; border: 0 !important; border-radius: 13px !important;
    background: var(--admin-primary) !important; color: #fff !important;
    box-shadow: 0 10px 24px rgba(45,49,149,.20); font-size: .76rem !important; font-weight: 900 !important;
  }
  .admin-users-add-button:hover { background: var(--admin-primary-dark) !important; }

  .admin-users-stats { margin-bottom: 22px !important; }
  .admin-users-stats .admin-stat-card {
    position: relative; min-height: 122px !important; overflow: hidden; cursor: pointer;
    border: 1px solid var(--admin-border) !important; border-radius: 16px !important;
    background: var(--admin-surface) !important; color: var(--admin-text) !important;
    box-shadow: 0 7px 24px rgba(26,30,53,.055) !important;
    transition: transform .25s ease, box-shadow .25s ease;
  }
  .admin-users-stats .admin-stat-card::before { content:""; position:absolute; left:0; top:0; bottom:0; width:4px; background: var(--admin-primary); }
  .admin-users-stats > .col:nth-child(2) .admin-stat-card::before { background: #22c55e; }
  .admin-users-stats > .col:nth-child(3) .admin-stat-card::before { background: #ef4444; }
  .admin-users-stats .admin-stat-card:hover { transform: translateY(-3px); box-shadow: 0 14px 32px rgba(26,30,53,.10) !important; }
  .admin-users-stats .admin-stat-card .card-body { padding: 16px !important; }
  .admin-stat-card-top { display:flex; align-items:center; gap:9px; }
  .admin-stat-icon { width:32px; height:32px; display:inline-flex; align-items:center; justify-content:center; border-radius:10px; flex:0 0 auto; }
  .admin-stat-icon-blue { color:#2D3195; background:#eef0ff; }
  .admin-stat-icon-green { color:#15803d; background:#dcfce7; }
  .admin-stat-icon-red { color:#b91c1c; background:#fee2e2; }
  .admin-stat-label { color:var(--admin-muted); font-size:.64rem; font-weight:900; letter-spacing:.04em; text-transform:uppercase; }
  .admin-stat-value { margin-top:9px; color:var(--admin-text); font-family:"Poppins",sans-serif; font-size:1.7rem; font-weight:800; line-height:1; }
  .admin-stat-caption { margin-top:6px; color:var(--admin-muted); font-size:.62rem; font-weight:600; }

  .admin-users-panel {
    border:1px solid var(--admin-border); border-radius:18px; background:var(--admin-surface);
    box-shadow: 0 7px 24px rgba(26,30,53,.055); padding: 18px;
  }

  .admin-users-search { margin-bottom: 16px; }
  .admin-filter-group { min-height:44px; border-radius:12px; box-shadow:0 4px 12px rgba(26,30,53,.035); }
  .admin-filter-group .admin-filter-icon { width:42px; justify-content:center; border:1px solid #e1e4ec !important; border-right:0 !important; background:#f4f5fb !important; color:#2D3195 !important; border-radius:12px 0 0 12px !important; }
  .admin-filter-group > .form-control, .admin-filter-group > .btn {
    min-height:44px !important; border-color:#e1e4ec !important; background:#fbfbfd !important; color:var(--admin-text) !important;
    box-shadow:none !important; border-radius:0 12px 12px 0 !important; font-size:.72rem !important; font-weight:700 !important;
  }
  .admin-filter-group > .form-control:focus { border-color:rgba(45,49,149,.48) !important; box-shadow:0 0 0 3px rgba(45,49,149,.08) !important; background:#fff !important; }

  .admin-user-row {
    display:flex; align-items:center; gap:12px; padding: 13px 14px; margin-bottom: 9px;
    border-radius: 13px; border: 1px solid var(--admin-border); background: #FAFAFF; cursor: pointer;
    transition: transform .15s ease, box-shadow .15s ease;
  }
  .admin-user-row:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(26,30,53,.08); }
  .admin-user-avatar {
    width:42px; height:42px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center;
    background: linear-gradient(135deg, #2D3195 0%, #242879 100%); color:#fff; font-weight:800; font-size:1rem;
  }
  .admin-user-info { flex:1; min-width:0; }
  .admin-user-name { font-weight:800; font-size:.84rem; color: var(--admin-text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .admin-user-meta { font-size:.7rem; color: var(--admin-muted); font-weight:600; }
  .admin-user-status-badge { flex-shrink:0; display:inline-flex; align-items:center; gap:4px; padding:4px 9px; border-radius:999px; font-size:.62rem; font-weight:900; }
  .admin-user-status-active { background:#dcfce7; color:#15803d; }
  .admin-user-status-inactive { background:#f3f4f8; color:#6b7280; }

  .admin-user-actions { display:flex; gap:6px; flex-shrink:0; }
  .admin-user-actions .btn { min-width: 32px; height: 32px; padding:0 !important; display:inline-flex; align-items:center; justify-content:center; border-radius:9px !important; }
  .admin-user-actions .btn-outline-primary { color:#2D3195 !important; border-color:rgba(45,49,149,.25) !important; background:#F8F8FF !important; }
  .admin-user-actions .btn-outline-primary:hover { color:#fff !important; background:#2D3195 !important; border-color:#2D3195 !important; }
  .admin-user-actions .btn-outline-danger { color:#C74350 !important; border-color:rgba(199,67,80,.2) !important; background:#FFF7F8 !important; }
  .admin-user-actions .btn-outline-danger:hover { color:#fff !important; background:#C74350 !important; border-color:#C74350 !important; }

  .admin-users-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:240px; padding:36px 20px; text-align:center; }
  .admin-users-empty-icon { width:58px; height:58px; display:inline-flex; align-items:center; justify-content:center; border-radius:16px; background:#eef0ff; color:#2D3195; margin-bottom: 12px; }
  .admin-users-empty-title { font-family:"Poppins",sans-serif; font-size:.9rem; font-weight:800; }
  .admin-users-empty-text { margin-top:4px; color: var(--admin-muted); font-size:.72rem; font-weight:600; }
  .admin-users-empty-button { margin-top:14px; display:inline-flex !important; align-items:center; gap:6px; border-radius:10px !important; font-size:.7rem !important; font-weight:800 !important; }

  .admin-users-modal .modal-content { overflow:hidden; border:1px solid var(--admin-border) !important; border-radius:18px !important; box-shadow:0 22px 60px rgba(26,30,53,.18) !important; }
  .admin-users-modal .modal-header { background:#2D3195 !important; color:#fff !important; border-bottom:0 !important; padding:18px 21px !important; }
  .admin-users-modal .modal-header .btn-close { filter:brightness(0) invert(1); opacity:.85; }
  .admin-users-modal-title { display:inline-flex; align-items:center; gap:8px; color:#fff !important; font-family:"Poppins",sans-serif !important; font-size:.98rem !important; font-weight:800 !important; }
  .admin-users-modal .modal-body { padding:22px !important; background:var(--admin-surface) !important; color:var(--admin-text) !important; }
  .admin-users-modal .modal-footer { gap:8px; padding:12px 20px !important; background:var(--admin-surface) !important; border-top:1px solid #EEF0F4 !important; }
  .admin-users-modal .form-label { color:#4e5564 !important; font-size:.67rem !important; font-weight:900 !important; margin-bottom:6px; }
  .admin-users-modal .form-control {
    min-height:42px; border:1px solid #e0e3ea !important; border-radius:11px !important; font-size:.72rem !important; font-weight:600 !important;
    box-shadow:0 3px 10px rgba(26,30,53,.025) !important;
  }
  .admin-users-modal .form-control:focus { border-color:rgba(45,49,149,.52) !important; box-shadow:0 0 0 3px rgba(45,49,149,.08) !important; }
  .admin-users-modal .form-control:disabled { background:#F3F4F8 !important; }
  .admin-users-modal .modal-footer .btn { min-height:39px; border-radius:11px !important; padding:8px 15px !important; font-size:.69rem !important; font-weight:900 !important; }
  .admin-users-modal .modal-footer .btn-primary { border:0 !important; background:var(--admin-primary) !important; color:#fff !important; box-shadow:0 8px 18px rgba(45,49,149,.16); }
  .admin-users-modal .modal-footer .btn-secondary { border-color:#E0E3EB !important; background:#fff !important; color:#656A76 !important; }

  .admin-user-detail-hero { display:flex; flex-direction:column; align-items:center; text-align:center; padding:22px 16px; border-radius:14px; background:linear-gradient(135deg,#2D3195 0%,#242879 100%); color:#fff; margin-bottom:18px; }
  .admin-user-detail-avatar { width:64px; height:64px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,.16); border:1px solid rgba(255,255,255,.24); font-family:"Poppins",sans-serif; font-size:1.5rem; font-weight:800; margin-bottom:10px; }

  .admin-user-detail-box { padding:12px 14px; border-radius:12px; background:#FAFAFF; border:1px solid var(--admin-border); margin-bottom:10px; }
  .admin-user-detail-box small { display:inline-flex; align-items:center; gap:5px; color:var(--admin-muted); font-size:.63rem; font-weight:900; text-transform:uppercase; letter-spacing:.04em; }
  .admin-user-detail-box small svg { color:#2D3195; }
  .admin-user-detail-box strong { display:block; margin-top:4px; color:var(--admin-text); font-size:.85rem; font-weight:700; }

  .admin-users-dark { --admin-surface:#191C2B; --admin-border:#2B3042; --admin-text:#F1F3F8; --admin-muted:#A8AFBF; }
  .admin-users-dark .admin-users-panel, .admin-users-dark .admin-users-stats .admin-stat-card, .admin-users-dark .modal-content { background:#191C2B !important; border-color:#2B3042 !important; }
  .admin-users-dark .admin-user-row { background:#202436; border-color:#343A4F; }
  .admin-users-dark .admin-filter-group > .form-control { background:#202436 !important; border-color:#343A4F !important; color:#F1F3F8 !important; }
  .admin-users-dark .admin-filter-icon { background:#262B46 !important; border-color:#343A4F !important; color:#AEB4FF !important; }
  .admin-users-dark .admin-users-empty-icon { background:#262B46; color:#AEB4FF; }
  .admin-users-dark .admin-users-modal .modal-body, .admin-users-dark .admin-users-modal .modal-footer { background:#191C2B !important; }
  .admin-users-dark .admin-users-modal .form-control { background:#202436 !important; border-color:#343A4F !important; color:#F1F3F8 !important; }
  .admin-users-dark .admin-user-detail-box { background:#202436 !important; border-color:#343A4F !important; }

  @media (max-width: 767.98px) {
    .admin-users-heading { align-items:flex-start !important; flex-direction:column; gap:14px; }
    .admin-users-add-button { width:100%; }
  }
`;

const AdminUsers: React.FC = () => {
  const { darkMode } = useDarkMode();
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [inactiveOnly, setInactiveOnly] = useState(false);
  const [viewItem, setViewItem] = useState<User | null>(null);

  const load = () => {
    setLoading(true);
    getUsers()
      .then((r) => {
        console.log("Users loaded:", r.data);
        setItems(Array.isArray(r.data) ? r.data : []);
      })
      .catch((err) => {
        console.error("Failed to load users:", err);
        setError("Failed to load users");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({
      username: u.username,
      name: u.name,
      password: "",
      is_active: u.is_active,
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.username || !form.name) {
      setError("Username and name are required.");
      return;
    }
    if (!editing && !form.password) {
      setError("Password is required for new users.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const payload: any = {
        username: form.username,
        name: form.name,
        is_active: form.is_active,
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (editing) {
        await updateUser(editing.id, payload);
      } else {
        await createUser(payload);
        try {
          await createNotification({
            userId: "all",
            type: "new_user",
            title: "New User Registered!",
            message: `${form.name} (@${form.username}) has been added as a new user.`,
            data: { userName: form.name, username: form.username },
          });
        } catch (notifErr) {
          console.error("Notification error:", notifErr);
        }
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err.response?.data?.message || err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm("Delete this user?")) return;
    await deleteUser(user.id).catch(() => {});
    load();
  };

  const fc = (field: string, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  const activeCount = items.filter((u) => u.is_active).length;

  const filteredItems = items.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActive = activeOnly ? u.is_active : true;
    const matchesInactive = inactiveOnly ? !u.is_active : true;
    return matchesSearch && matchesActive && matchesInactive;
  });

  const getInitial = (name: string) => name?.charAt(0)?.toUpperCase() || "?";

  return (
    <AdminLayout>
      <div className={`admin-users-page ${darkMode ? "admin-users-dark" : ""}`}>
        <style>{ADMIN_USERS_STYLES}</style>

        {/* Header */}
        <div className="admin-users-heading d-flex justify-content-between">
          <div>
            <div className="admin-users-eyebrow">SYSTEM MANAGEMENT</div>
            <h2 className="admin-users-title">USERS</h2>
            <p className="admin-users-subtitle">
              Manage the registered users of the Calbayog City Tourism platform.
            </p>
          </div>

          <Button variant="primary" onClick={openCreate} className="admin-users-add-button">
            <Plus size={17} strokeWidth={2.2} />
            <span>Add User</span>
          </Button>
        </div>

        {/* Stats */}
        <Row className="g-3 admin-users-stats">
          <Col xs={12} sm={4}>
            <Card
              className="border-0 h-100 admin-stat-card"
              onClick={() => {
                setActiveOnly(false);
                setInactiveOnly(false);
              }}
            >
              <Card.Body>
                <div className="admin-stat-card-top">
                  <span className="admin-stat-icon admin-stat-icon-blue">
                    <UsersRound size={16} strokeWidth={2} />
                  </span>
                  <span className="admin-stat-label">Total Users</span>
                </div>
                <div className="admin-stat-value">{items.length}</div>
                <div className="admin-stat-caption">All registered users</div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={4}>
            <Card
              className="border-0 h-100 admin-stat-card"
              onClick={() => {
                setActiveOnly(true);
                setInactiveOnly(false);
              }}
            >
              <Card.Body>
                <div className="admin-stat-card-top">
                  <span className="admin-stat-icon admin-stat-icon-green">
                    <CheckCircle2 size={16} strokeWidth={2} />
                  </span>
                  <span className="admin-stat-label">Active</span>
                </div>
                <div className="admin-stat-value">{activeCount}</div>
                <div className="admin-stat-caption">Active users</div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={4}>
            <Card
              className="border-0 h-100 admin-stat-card"
              onClick={() => {
                setActiveOnly(false);
                setInactiveOnly(true);
              }}
            >
              <Card.Body>
                <div className="admin-stat-card-top">
                  <span className="admin-stat-icon admin-stat-icon-red">
                    <XCircle size={16} strokeWidth={2} />
                  </span>
                  <span className="admin-stat-label">Inactive</span>
                </div>
                <div className="admin-stat-value">{items.length - activeCount}</div>
                <div className="admin-stat-caption">Deactivated users</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Users list */}
        <div className="admin-users-panel">
          <div className="admin-users-search">
            <InputGroup className="admin-filter-group">
              <InputGroup.Text className="admin-filter-icon">
                <Search size={16} strokeWidth={2.1} />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search by name or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button variant="outline-secondary" onClick={() => setSearchTerm("")}>
                  <X size={16} strokeWidth={2} />
                </Button>
              )}
            </InputGroup>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: "#2D3195" }} />
            </div>
          ) : items.length === 0 ? (
            <div className="admin-users-empty">
              <div className="admin-users-empty-icon">
                <UsersRound size={26} strokeWidth={1.8} />
              </div>
              <div className="admin-users-empty-title">No Users Yet</div>
              <p className="admin-users-empty-text">Start by adding your first user.</p>
              <Button variant="outline-primary" className="admin-users-empty-button" onClick={openCreate}>
                <Plus size={14} strokeWidth={2.2} />
                Add First User
              </Button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="admin-users-empty">
              <div className="admin-users-empty-icon">
                <UserRoundX size={26} strokeWidth={1.8} />
              </div>
              <div className="admin-users-empty-title">No Results</div>
              <p className="admin-users-empty-text">Try a different search term.</p>
              <Button
                variant="outline-primary"
                className="admin-users-empty-button"
                onClick={() => {
                  setSearchTerm("");
                  setActiveOnly(false);
                  setInactiveOnly(false);
                }}
              >
                <X size={14} strokeWidth={2.2} />
                Clear Search
              </Button>
            </div>
          ) : (
            <div>
              {filteredItems.map((u) => (
                <div key={u.id} className="admin-user-row" onClick={() => setViewItem(u)}>
                  <div className="admin-user-avatar">{getInitial(u.name)}</div>

                  <div className="admin-user-info">
                    <div className="admin-user-name">{u.name}</div>
                    <div className="admin-user-meta">
                      @{u.username} · {new Date(u.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <span
                    className={`admin-user-status-badge ${
                      u.is_active ? "admin-user-status-active" : "admin-user-status-inactive"
                    }`}
                  >
                    {u.is_active ? (
                      <CheckCircle2 size={11} strokeWidth={2.2} />
                    ) : (
                      <XCircle size={11} strokeWidth={2.2} />
                    )}
                    {u.is_active ? "Active" : "Inactive"}
                  </span>

                  <div className="admin-user-actions" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="outline-primary" onClick={() => openEdit(u)}>
                      <Pencil size={13} strokeWidth={2} />
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => handleDelete(u)}>
                      <Trash2 size={13} strokeWidth={2} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add / Edit Modal */}
        <Modal className="admin-users-modal" show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title className="admin-users-modal-title">
              <UsersRound size={18} strokeWidth={2.1} />
              {editing ? "Edit User" : "Add New User"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger" className="py-2 mb-3">{error}</Alert>}

            <Row className="g-3">
              <Col xs={12} sm={6}>
                <Form.Label className="fw-semibold">Username *</Form.Label>
                <Form.Control
                  value={form.username}
                  onChange={(e) => fc("username", e.target.value)}
                  disabled={!!editing}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Form.Label className="fw-semibold">Full Name *</Form.Label>
                <Form.Control value={form.name} onChange={(e) => fc("name", e.target.value)} />
              </Col>
              <Col xs={12} sm={6}>
                <Form.Label className="fw-semibold">
                  Password {editing ? "(leave blank to keep)" : "*"}
                </Form.Label>
                <Form.Control
                  type="password"
                  value={form.password}
                  onChange={(e) => fc("password", e.target.value)}
                />
              </Col>
              <Col xs={12} sm={6} className="d-flex align-items-end">
                <Form.Check
                  type="checkbox"
                  label="Active"
                  checked={form.is_active}
                  onChange={(e) => fc("is_active", e.target.checked)}
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving} style={{ minWidth: 120 }}>
              {saving ? "Saving..." : "Save User"}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Detail View Modal */}
        {viewItem && (
          <Modal
            className="admin-users-modal"
            show={!!viewItem}
            onHide={() => setViewItem(null)}
            size="lg"
            centered
            fullscreen="sm-down"
          >
            <Modal.Header closeButton>
              <Modal.Title className="admin-users-modal-title">
                <UsersRound size={18} strokeWidth={2.1} />
                {viewItem.name}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="admin-user-detail-hero">
                <div className="admin-user-detail-avatar">{getInitial(viewItem.name)}</div>
                <span
                  className={`admin-user-status-badge ${
                    viewItem.is_active ? "admin-user-status-active" : "admin-user-status-inactive"
                  }`}
                  style={
                    viewItem.is_active
                      ? undefined
                      : { background: "rgba(255,255,255,.18)", color: "#fff" }
                  }
                >
                  {viewItem.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="admin-user-detail-box">
                <small>
                  <UsersRound size={12} strokeWidth={2.2} />
                  Username
                </small>
                <strong>@{viewItem.username}</strong>
              </div>

              <div className="admin-user-detail-box">
                <small>
                  <Calendar size={12} strokeWidth={2.2} />
                  Joined Date
                </small>
                <strong>{new Date(viewItem.created_at).toLocaleDateString()}</strong>
              </div>

              {viewItem.updated_at && (
                <div className="admin-user-detail-box">
                  <small>
                    <Calendar size={12} strokeWidth={2.2} />
                    Last Updated
                  </small>
                  <strong>{new Date(viewItem.updated_at).toLocaleDateString()}</strong>
                </div>
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

export default AdminUsers;
