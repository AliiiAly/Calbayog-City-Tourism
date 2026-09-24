import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Badge, Spinner, Alert, Row, Col } from 'react-bootstrap';
import {
  AtSign,
  Calendar,
  Eye,
  EyeOff,
  Mail,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserCircle2,
  UsersRound,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { getAdmins, createAdmin, updateAdmin, deleteAdmin, clearCache } from '../../services/api';
import { AdminUser } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../context/DarkModeContext';

const EMPTY = {
  username: '', password: '', email: '', name: '',
};

/* =========================================================
   PAGE STYLES
========================================================= */

const ADMIN_MANAGEMENT_STYLES = `
  @font-face {
    font-family: "Barabara";
    src: url("/fonts/BARABARA-final.otf") format("opentype");
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  .admin-management-page {
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

  .admin-management-page *, .admin-management-page *::before, .admin-management-page *::after { box-sizing: border-box; }

  .admin-mgmt-heading { align-items: flex-end !important; gap: 22px; margin: 0 0 26px !important; }
  .admin-mgmt-eyebrow { margin-bottom: 5px; color: var(--admin-primary); font-size: .66rem; font-weight: 900; letter-spacing: .16em; text-transform: uppercase; }
  .admin-mgmt-title { margin: 0 !important; color: var(--admin-primary) !important; font-family: "Barabara", sans-serif !important; font-size: clamp(1.65rem, 2.8vw, 2.4rem) !important; font-weight: 400 !important; line-height: .95 !important; }
  .admin-mgmt-subtitle { max-width: 720px; margin: 8px 0 0 !important; color: var(--admin-muted) !important; font-size: .80rem !important; font-weight: 600 !important; line-height: 1.55 !important; }

  .admin-mgmt-add-button {
    flex: 0 0 auto; display: inline-flex !important; align-items: center; gap: 7px;
    min-height: 46px; padding: 11px 19px !important; border: 0 !important; border-radius: 13px !important;
    background: var(--admin-primary) !important; color: #fff !important;
    box-shadow: 0 10px 24px rgba(45,49,149,.20); font-size: .76rem !important; font-weight: 900 !important;
  }
  .admin-mgmt-add-button:hover { background: var(--admin-primary-dark) !important; }

  .admin-mgmt-panel {
    border:1px solid var(--admin-border); border-radius:18px; background:var(--admin-surface);
    box-shadow: 0 7px 24px rgba(26,30,53,.055); padding: 18px; overflow: hidden;
  }

  .admin-mgmt-table { border-collapse: separate; border-spacing: 0 8px; width: 100%; margin-bottom: 0; }
  .admin-mgmt-table thead th {
    background: #F5F6FB; color: #4e5564; font-size:.63rem; font-weight:900; letter-spacing:.05em; text-transform:uppercase;
    padding: 12px 14px; border: 0;
  }
  .admin-mgmt-table thead th:first-child { border-radius: 10px 0 0 10px; }
  .admin-mgmt-table thead th:last-child { border-radius: 0 10px 10px 0; }

  .admin-mgmt-row { cursor:pointer; transition: box-shadow .15s ease; }
  .admin-mgmt-row td {
    background: var(--admin-surface); border:1px solid var(--admin-border); border-left:0; border-right:0;
    padding: 12px 14px; font-size:.78rem; color: var(--admin-text); vertical-align: middle;
  }
  .admin-mgmt-row td:first-child { border-left:1px solid var(--admin-border); border-radius:12px 0 0 12px; }
  .admin-mgmt-row td:last-child { border-right:1px solid var(--admin-border); border-radius:0 12px 12px 0; }
  .admin-mgmt-row:hover td { box-shadow: 0 6px 18px rgba(26,30,53,.07); }

  .admin-mgmt-avatar {
    width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center;
    background: linear-gradient(135deg, #2D3195 0%, #242879 100%); color:#fff; font-weight:800; font-size:1rem; margin-right:12px; flex:0 0 auto;
  }
  .admin-mgmt-you-badge { display:inline-flex; align-items:center; gap:4px; background:#fff5d9; color:#8e6200; border-radius:999px; padding:3px 8px; font-size:.6rem; font-weight:900; margin-top:2px; }

  .admin-mgmt-row-actions { display:flex; gap:8px; }
  .admin-mgmt-row-actions .btn { display:inline-flex; align-items:center; gap:5px; border-radius:9px !important; font-size:.65rem !important; font-weight:900 !important; padding: 6px 10px !important; }
  .admin-mgmt-row-actions .btn-outline-primary { color:#2D3195 !important; border-color:rgba(45,49,149,.25) !important; background:#F8F8FF !important; }
  .admin-mgmt-row-actions .btn-outline-primary:hover { color:#fff !important; background:#2D3195 !important; border-color:#2D3195 !important; }
  .admin-mgmt-row-actions .btn-outline-danger { color:#C74350 !important; border-color:rgba(199,67,80,.2) !important; background:#FFF7F8 !important; }
  .admin-mgmt-row-actions .btn-outline-danger:hover:not(:disabled) { color:#fff !important; background:#C74350 !important; border-color:#C74350 !important; }
  .admin-mgmt-row-actions .btn:disabled { opacity: .4; }

  .admin-mgmt-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:240px; padding:36px 20px; text-align:center; }
  .admin-mgmt-empty-icon { width:58px; height:58px; display:inline-flex; align-items:center; justify-content:center; border-radius:16px; background:#eef0ff; color:#2D3195; margin-bottom: 12px; }
  .admin-mgmt-empty-title { font-family:"Poppins",sans-serif; font-size:.9rem; font-weight:800; }
  .admin-mgmt-empty-text { margin-top:4px; color: var(--admin-muted); font-size:.72rem; font-weight:600; }

  .admin-management-modal .modal-content { overflow:hidden; border:1px solid var(--admin-border) !important; border-radius:18px !important; box-shadow:0 22px 60px rgba(26,30,53,.18) !important; }
  .admin-management-modal .modal-header { background:#2D3195 !important; color:#fff !important; border-bottom:0 !important; padding:18px 21px !important; }
  .admin-management-modal .modal-header .btn-close { filter:brightness(0) invert(1); opacity:.85; }
  .admin-mgmt-modal-title { display:inline-flex; align-items:center; gap:8px; color:#fff !important; font-family:"Poppins",sans-serif !important; font-size:.98rem !important; font-weight:800 !important; }
  .admin-management-modal .modal-body { padding:22px !important; background:var(--admin-surface) !important; color:var(--admin-text) !important; }
  .admin-management-modal .modal-footer { gap:8px; padding:12px 20px !important; background:var(--admin-surface) !important; border-top:1px solid #EEF0F4 !important; }
  .admin-management-modal .form-label { color:#4e5564 !important; font-size:.67rem !important; font-weight:900 !important; margin-bottom:6px; }
  .admin-management-modal .form-control {
    min-height:42px; border:1px solid #e0e3ea !important; border-radius:11px !important; font-size:.72rem !important; font-weight:600 !important;
    box-shadow:0 3px 10px rgba(26,30,53,.025) !important;
  }
  .admin-management-modal .form-control:focus { border-color:rgba(45,49,149,.52) !important; box-shadow:0 0 0 3px rgba(45,49,149,.08) !important; }
  .admin-management-modal .form-control:disabled { background:#F3F4F8 !important; }
  .admin-management-modal .modal-footer .btn { min-height:39px; border-radius:11px !important; padding:8px 15px !important; font-size:.69rem !important; font-weight:900 !important; }
  .admin-management-modal .modal-footer .btn-primary { border:0 !important; background:var(--admin-primary) !important; color:#fff !important; box-shadow:0 8px 18px rgba(45,49,149,.16); }
  .admin-management-modal .modal-footer .btn-secondary { border-color:#E0E3EB !important; background:#fff !important; color:#656A76 !important; }

  .admin-mgmt-password-wrap { position: relative; }
  .admin-mgmt-password-toggle {
    position:absolute; right:12px; top:50%; transform:translateY(-50%);
    background:none; border:none; cursor:pointer; color: var(--admin-muted); display:flex; align-items:center;
  }

  .admin-mgmt-tip { display:flex; align-items:flex-start; gap:9px; margin-top:14px; padding:12px 14px; border-radius:12px; background:#eef0ff; color:#2D3195; font-size:.72rem; font-weight:700; }

  .admin-mgmt-detail-hero { display:flex; flex-direction:column; align-items:center; text-align:center; padding:22px 16px; border-radius:14px; background:linear-gradient(135deg,#2D3195 0%,#242879 100%); color:#fff; margin-bottom:18px; }
  .admin-mgmt-detail-avatar { width:64px; height:64px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,.16); border:1px solid rgba(255,255,255,.24); font-family:"Poppins",sans-serif; font-size:1.5rem; font-weight:800; margin-bottom:10px; }

  .admin-mgmt-detail-box { padding:12px 14px; border-radius:12px; background:#FAFAFF; border:1px solid var(--admin-border); margin-bottom:10px; }
  .admin-mgmt-detail-box small { display:inline-flex; align-items:center; gap:5px; color:var(--admin-muted); font-size:.63rem; font-weight:900; text-transform:uppercase; letter-spacing:.04em; }
  .admin-mgmt-detail-box small svg { color:#2D3195; }
  .admin-mgmt-detail-box strong { display:block; margin-top:4px; color:var(--admin-text); font-size:.85rem; font-weight:700; }

  .admin-management-dark { --admin-surface:#191C2B; --admin-border:#2B3042; --admin-text:#F1F3F8; --admin-muted:#A8AFBF; }
  .admin-management-dark .admin-mgmt-panel, .admin-management-dark .modal-content { background:#191C2B !important; border-color:#2B3042 !important; }
  .admin-management-dark .admin-mgmt-table thead th { background:#202436; color:#c9ccff; }
  .admin-management-dark .admin-mgmt-row td { background:#191C2B !important; border-color:#2B3042 !important; color:#F1F3F8; }
  .admin-management-dark .admin-mgmt-empty-icon { background:#262B46; color:#AEB4FF; }
  .admin-management-dark .admin-management-modal .modal-body, .admin-management-dark .admin-management-modal .modal-footer { background:#191C2B !important; }
  .admin-management-dark .admin-management-modal .form-control { background:#202436 !important; border-color:#343A4F !important; color:#F1F3F8 !important; }
  .admin-management-dark .admin-mgmt-detail-box { background:#202436 !important; border-color:#343A4F !important; }
  .admin-management-dark .admin-mgmt-tip { background:#262B46; color:#c9ccff; }

  @media (max-width: 767.98px) {
    .admin-mgmt-heading { align-items:flex-start !important; flex-direction:column; gap:14px; }
    .admin-mgmt-add-button { width:100%; }
  }
`;

const AdminManagement: React.FC = () => {
  const { darkMode } = useDarkMode();
  const { admin: currentAdmin } = useAuth();
  const [items, setItems] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [viewItem, setViewItem] = useState<AdminUser | null>(null);

  const load = () => {
    setLoading(true);
    // Clear cache to ensure fresh data
    clearCache('admin-management');
    getAdmins()
      .then((r) => {
        console.log('Admins loaded:', r.data);
        setItems(r.data);
      })
      .catch((err) => {
        console.error('Error loading admins:', err);
        setError('Failed to load admin accounts. Please try again.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setError(''); setShowModal(true); };

  const openEdit = (a: AdminUser) => {
    setEditing(a);
    setForm({
      username: a.username,
      password: '',
      email: a.email,
      name: a.name,
    });
    setError(''); setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.username || !form.email || !form.name) { 
      setError('Username, email, and name are required.'); 
      return; 
    }
    if (!editing && !form.password) {
      setError('Password is required for new admin accounts.');
      return;
    }
    setSaving(true); setError('');
    const payload: any = {
      username: form.username,
      email: form.email,
      name: form.name,
    };
    if (form.password) {
  payload.password = form.password;
  payload.mobile_pin = form.password;
}
    
    try {
      let response;
      if (editing) { 
        response = await updateAdmin(editing.id, payload); 
      } else { 
        response = await createAdmin(payload); 
      }
      // Clear cache to ensure fresh data
      clearCache('admin-management');
      setShowModal(false);
      load();
    } catch (err: any) { 
      setError(err.response?.data?.message || err.message || 'Failed to save.'); 
    }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (id === currentAdmin?.id) {
      setError('Cannot delete your own account.');
      return;
    }
    if (!confirm('Delete this admin account?')) return;
    try {
      await deleteAdmin(id);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete.');
    }
  };

  const fc = (field: string, value: unknown) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <AdminLayout>
      <div className={`admin-management-page ${darkMode ? 'admin-management-dark' : ''}`}>
        <style>{ADMIN_MANAGEMENT_STYLES}</style>

        {/* Header */}
        <div className="admin-mgmt-heading d-flex justify-content-between">
          <div>
            <div className="admin-mgmt-eyebrow">SYSTEM MANAGEMENT</div>
            <h2 className="admin-mgmt-title">ADMIN ACCOUNTS</h2>
            <p className="admin-mgmt-subtitle">
              Manage admin accounts and access to the Calbayog City Tourism dashboard.
            </p>
          </div>

          <Button variant="primary" onClick={openCreate} className="admin-mgmt-add-button">
            <Plus size={17} strokeWidth={2.2} />
            <span>Add New Admin</span>
          </Button>
        </div>

        {error && (
          <Alert variant="danger" className="mb-3" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" style={{ color: '#2D3195' }} />
            <p className="mt-3" style={{ color: darkMode ? '#A8AFBF' : '#737886' }}>Loading admin accounts...</p>
          </div>
        ) : (
          <div className="admin-mgmt-panel">
            {items.length === 0 ? (
              <div className="admin-mgmt-empty">
                <div className="admin-mgmt-empty-icon">
                  <UsersRound size={26} strokeWidth={1.8} />
                </div>
                <div className="admin-mgmt-empty-title">No admin accounts yet</div>
                <p className="admin-mgmt-empty-text">Click "Add New Admin" to create your first admin account.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table className="admin-mgmt-table" borderless>
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((a) => (
                      <tr key={a.id} className="admin-mgmt-row" onClick={() => setViewItem(a)}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="admin-mgmt-avatar">{a.username.charAt(0).toUpperCase()}</div>
                            <div>
                              <div className="fw-bold">{a.username}</div>
                              {a.id === currentAdmin?.id && (
                                <span className="admin-mgmt-you-badge">
                                  <ShieldCheck size={11} strokeWidth={2.2} />
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="fw-semibold">{a.name}</td>
                        <td className="fw-semibold">{a.email}</td>
                        <td>
                          {a.created_at
                            ? new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : '—'}
                        </td>
                        <td>
                          <div className="admin-mgmt-row-actions" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => openEdit(a)}
                            >
                              <Pencil size={12} strokeWidth={2.2} />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              disabled={a.id === currentAdmin?.id}
                              onClick={() => handleDelete(a.id)}
                            >
                              <Trash2 size={12} strokeWidth={2.2} />
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
        )}

        {/* Add / Edit Modal */}
        <Modal className="admin-management-modal" show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title className="admin-mgmt-modal-title">
              <UserCircle2 size={18} strokeWidth={2.1} />
              {editing ? 'Edit Admin Account' : 'Add New Admin'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger" className="py-2 mb-3">{error}</Alert>}

            <Row className="g-3">
              <Col xs={12} sm={6}>
                <Form.Label className="fw-semibold">Username *</Form.Label>
                <Form.Control
                  value={form.username}
                  onChange={(e) => fc('username', e.target.value)}
                  disabled={!!editing}
                  placeholder="Enter username"
                />
                {editing && <small style={{ color: '#8a90a0', fontSize: '.68rem' }}>Username cannot be changed</small>}
              </Col>
              <Col xs={12} sm={6}>
                <Form.Label className="fw-semibold">Full Name *</Form.Label>
                <Form.Control
                  value={form.name}
                  onChange={(e) => fc('name', e.target.value)}
                  placeholder="Enter full name"
                />
              </Col>
              <Col xs={12}>
                <Form.Label className="fw-semibold">Email Address *</Form.Label>
                <Form.Control
                  type="email"
                  value={form.email}
                  onChange={(e) => fc('email', e.target.value)}
                  placeholder="admin@example.com"
                />
              </Col>
              <Col xs={12}>
                <Form.Label className="fw-semibold">
                  {editing ? 'New Password' : 'Password'} *
                </Form.Label>
                <div className="admin-mgmt-password-wrap">
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => fc('password', e.target.value)}
                    placeholder={editing ? 'Leave blank to keep current' : 'Enter password'}
                  />
                  <button
                    type="button"
                    className="admin-mgmt-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
                  </button>
                </div>
                {editing && <small style={{ color: '#8a90a0', fontSize: '.68rem' }}>Leave blank to keep current password</small>}
              </Col>
            </Row>

            <div className="admin-mgmt-tip">
              <ShieldCheck size={15} strokeWidth={2.1} />
              <span>
                {editing
                  ? 'Update password only if needed. Leave blank to keep current credentials.'
                  : 'Choose a strong password with at least 8 characters.'}
              </span>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving} style={{ minWidth: 130 }}>
              {saving ? 'Saving...' : 'Save Admin'}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Detail View Modal */}
        {viewItem && (
          <Modal className="admin-management-modal" show={!!viewItem} onHide={() => setViewItem(null)} size="lg" centered fullscreen="sm-down">
            <Modal.Header closeButton>
              <Modal.Title className="admin-mgmt-modal-title">
                <UserCircle2 size={18} strokeWidth={2.1} />
                {viewItem.name}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="admin-mgmt-detail-hero">
                <div className="admin-mgmt-detail-avatar">{viewItem.username.charAt(0).toUpperCase()}</div>
                {viewItem.id === currentAdmin?.id && (
                  <span className="admin-mgmt-you-badge" style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}>
                    <ShieldCheck size={11} strokeWidth={2.2} />
                    You
                  </span>
                )}
              </div>

              <div className="admin-mgmt-detail-box">
                <small>
                  <AtSign size={12} strokeWidth={2.2} />
                  Username
                </small>
                <strong>{viewItem.username}</strong>
              </div>

              <div className="admin-mgmt-detail-box">
                <small>
                  <Mail size={12} strokeWidth={2.2} />
                  Email
                </small>
                <strong>{viewItem.email}</strong>
              </div>

              <div className="admin-mgmt-detail-box">
                <small>
                  <Calendar size={12} strokeWidth={2.2} />
                  Created Date
                </small>
                <strong>
                  {viewItem.created_at
                    ? new Date(viewItem.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—'}
                </strong>
              </div>
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

export default AdminManagement;
