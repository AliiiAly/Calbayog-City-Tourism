import React, { useEffect, useMemo, useState } from "react";
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
  ArrowUpDown,
  Briefcase,
  Building2,
  DollarSign,
  Eye,
  ExternalLink,
  FileText,
  Globe2,
  Image as ImageIcon,
  Info,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";

import {
  getAccommodations,
  createAccommodation,
  updateAccommodation,
  deleteAccommodation,
  clearCache,
  uploadImageToSupabase,
} from "../../services/api";

import {
  subscribeToAccommodations,
  unsubscribeAll,
} from "../../services/supabase";

import { useDarkMode } from "../../context/DarkModeContext";

/* =========================================================
   ACCOMMODATIONS DATABASE

   Fields used by this page:

   - name
   - owner
   - manager
   - address
   - contact_number
   - website
   - images
   - description
   - price_range

   id / created_at / updated_at are database-generated fields.
   Location is no longer stored/edited via an in-app map — the
   address is used to open Google Maps externally instead.
========================================================= */

interface AccommodationRecord {
  id: string;
  name: string;
  owner: string | null;
  manager: string | null;
  address: string | null;
  contact_number: string | null;
  website: string | null;
  images: string[] | string | null;
  description: string | null;
  price_range: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface AccommodationForm {
  name: string;
  owner: string;
  manager: string;
  address: string;
  contactNumber: string;
  website: string;
  description: string;
  priceRange: string;
  images: string;
  imageFiles: File[];
}

const EMPTY_FORM: AccommodationForm = {
  name: "",
  owner: "",
  manager: "",
  address: "",
  contactNumber: "",
  website: "",
  description: "",
  priceRange: "",
  images: "",
  imageFiles: [],
};

const CALBAYOG_BLUE = "#2D3195";

const MAIN_GRADIENT = "linear-gradient(135deg, #2D3195 0%, #242879 100%)";

const DEFAULT_ACCOMMODATION_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%232D3195'/%3E%3Cstop offset='100%25' stop-color='%23242879'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='500' fill='url(%23g)'/%3E%3Ccircle cx='690' cy='95' r='110' fill='rgba(255,255,255,0.08)'/%3E%3Cpath d='M-20 360 Q180 250 390 340 T820 350 L820 500 L-20 500 Z' fill='rgba(0,0,0,0.18)'/%3E%3Ctext x='400' y='210' text-anchor='middle' font-size='62' font-family='Arial, sans-serif' font-weight='700' fill='white'%3ECalbayog%3C/text%3E%3Ctext x='400' y='278' text-anchor='middle' font-size='30' font-family='Arial, sans-serif' fill='rgba(255,255,255,0.8)'%3ETourism%3C/text%3E%3C/svg%3E";

/* =========================================================
   PAGE STYLES — MIRRORS ADMINATTRACTIONS
========================================================= */

const ADMIN_ACCOMMODATIONS_STYLES = `
  @font-face {
    font-family: "Barabara";
    src: url("/fonts/BARABARA-final.otf") format("opentype");
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  .admin-accommodations-page {
    --admin-primary: #2D3195;
    --admin-primary-dark: #242879;
    --admin-yellow: #FFB71B;
    --admin-bg: #F7F8FC;
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

  .admin-accommodations-page *,
  .admin-accommodations-page *::before,
  .admin-accommodations-page *::after {
    box-sizing: border-box;
  }

  /* -------------------------------
     HEADER
  -------------------------------- */

  .admin-accommodations-heading {
    align-items: flex-end !important;
    gap: 22px;
    margin: 0 0 26px !important;
    padding-bottom: 6px;
  }

  .admin-accommodations-eyebrow {
    margin-bottom: 5px;
    color: var(--admin-primary);
    font-family: "Nunito", sans-serif;
    font-size: 0.66rem;
    font-weight: 900;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .admin-accommodations-title {
    margin: 0 !important;
    color: var(--admin-primary) !important;
    font-family: "Barabara", sans-serif !important;
    font-size: clamp(1.65rem, 2.8vw, 2.4rem) !important;
    font-weight: 400 !important;
    line-height: 0.95 !important;
    letter-spacing: 0.02em;
  }

  .admin-accommodations-subtitle {
    max-width: 780px;
    margin: 8px 0 0 !important;
    color: var(--admin-muted) !important;
    font-family: "Nunito", sans-serif !important;
    font-size: 0.80rem !important;
    font-weight: 600 !important;
    line-height: 1.55 !important;
  }

  .admin-accommodations-add-button {
    flex: 0 0 auto;
    display: inline-flex !important;
    align-items: center;
    gap: 7px;
    min-height: 46px;
    padding: 11px 19px !important;
    border: 0 !important;
    border-radius: 13px !important;
    background: var(--admin-primary) !important;
    color: #fff !important;
    box-shadow: 0 10px 24px rgba(45, 49, 149, 0.20);
    font-family: "Nunito", sans-serif !important;
    font-size: 0.76rem !important;
    font-weight: 900 !important;
    transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
  }

  .admin-accommodations-add-button:hover,
  .admin-accommodations-add-button:focus {
    background: var(--admin-primary-dark) !important;
    transform: translateY(-2px);
    box-shadow: 0 14px 28px rgba(45, 49, 149, 0.24);
  }

  /* -------------------------------
     STAT CARDS
  -------------------------------- */

  .admin-accommodations-stats { margin-bottom: 24px !important; }

  .admin-accommodations-stats .admin-stat-card {
    position: relative;
    min-height: 132px !important;
    overflow: hidden;
    border: 1px solid var(--admin-border) !important;
    border-radius: 18px !important;
    background: var(--admin-surface) !important;
    color: var(--admin-text) !important;
    box-shadow: 0 7px 24px rgba(26, 30, 53, 0.055) !important;
    transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
  }

  .admin-accommodations-stats .admin-stat-card::before {
    content: "";
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 4px;
    background: var(--admin-primary);
  }

  .admin-accommodations-stats > .col:nth-child(2) .admin-stat-card::before { background: var(--admin-yellow); }
  .admin-accommodations-stats > .col:nth-child(3) .admin-stat-card::before { background: #7076D8; }
  .admin-accommodations-stats > .col:nth-child(4) .admin-stat-card::before { background: #5A60B6; }

  .admin-accommodations-stats .admin-stat-card:hover {
    transform: translateY(-3px);
    border-color: rgba(45, 49, 149, 0.16) !important;
    box-shadow: 0 14px 32px rgba(26, 30, 53, 0.10) !important;
  }

  .admin-accommodations-stats .admin-stat-card .card-body { padding: 17px 18px 16px !important; }

  .admin-stat-card-top { display:flex; align-items:center; gap:9px; }
  .admin-stat-icon { width:34px; height:34px; display:inline-flex; align-items:center; justify-content:center; border-radius:10px; flex:0 0 auto; }
  .admin-stat-icon-blue { color:#2D3195; background:#eef0ff; }
  .admin-stat-icon-yellow { color:#9a6900; background:#fff5d9; }
  .admin-stat-icon-purple { color:#5f62b7; background:#f0efff; }
  .admin-stat-icon-indigo { color:#3944a1; background:#eceeff; }
  .admin-stat-label { color:var(--admin-muted); font-size:.66rem; font-weight:900; letter-spacing:.04em; text-transform:uppercase; }
  .admin-stat-value { margin-top:11px; color:var(--admin-text); font-family:"Poppins",sans-serif; font-size:1.95rem; font-weight:800; line-height:1; }
  .admin-stat-caption { margin-top:8px; color:var(--admin-muted); font-size:.62rem; font-weight:600; }

  /* -------------------------------
     TOOLBAR
  -------------------------------- */

  .admin-accommodations-toolbar {
    border: 1px solid var(--admin-border) !important;
    border-radius: 18px !important;
    background: var(--admin-surface) !important;
    box-shadow: 0 8px 26px rgba(26, 30, 53, .05) !important;
    overflow: visible !important;
  }

  .admin-accommodations-toolbar .card-body { padding: 19px !important; }

  .admin-accommodations-toolbar-heading {
    display:flex; align-items:center; justify-content:space-between;
    gap:16px; margin-bottom:16px; padding:14px 16px;
    border:1px solid rgba(45,49,149,.09); border-radius:14px;
    background:linear-gradient(135deg, #f8f8ff 0%, #ffffff 70%);
  }

  .admin-filter-heading-main { display:flex; align-items:center; gap:11px; }

  .admin-toolbar-heading-icon {
    width:38px; height:38px; flex:0 0 38px;
    display:inline-flex; align-items:center; justify-content:center;
    border-radius:11px; background:#eef0ff; color:#2D3195;
  }

  .admin-accommodations-toolbar-title { margin:0 0 2px !important; color:var(--admin-text) !important; font-family:"Poppins",sans-serif !important; font-size:.86rem !important; font-weight:800 !important; }
  .admin-accommodations-toolbar-caption { color:var(--admin-muted); font-size:.66rem; font-weight:600; }

  .admin-filter-status-pill {
    display:inline-flex; align-items:center; gap:6px;
    padding:7px 10px; border-radius:999px;
    background:#fff5d9; color:#806000;
    font-size:.62rem; font-weight:900; white-space:nowrap;
  }

  .admin-filter-group {
    min-height:44px; border-radius:12px;
    box-shadow:0 4px 12px rgba(26,30,53,.035);
  }

  .admin-filter-group .admin-filter-icon {
    width:42px; justify-content:center;
    border:1px solid #e1e4ec !important;
    border-right:0 !important;
    background:#f4f5fb !important;
    color:#2D3195 !important;
    border-radius:12px 0 0 12px !important;
  }

  .admin-filter-group > .form-control,
  .admin-filter-group > .form-select,
  .admin-filter-group > .btn {
    min-height:44px !important;
    border-color:#e1e4ec !important;
    background:#fbfbfd !important;
    color:var(--admin-text) !important;
    box-shadow:none !important;
    border-radius:0 12px 12px 0 !important;
    font-family:"Nunito",sans-serif !important;
    font-size:.70rem !important;
    font-weight:700 !important;
  }

  .admin-search-group .form-control { padding-left:12px !important; }
  .admin-search-group .btn { min-width:43px; background:#f8f8ff !important; color:#2D3195 !important; }

  .admin-filter-group > .form-control:focus,
  .admin-filter-group > .form-select:focus {
    border-color:rgba(45,49,149,.48) !important;
    box-shadow:0 0 0 3px rgba(45,49,149,.08) !important;
    background:#fff !important;
  }

  .admin-filter-group > .form-control::placeholder { color:#A0A5B0 !important; }

  .admin-search-group:focus-within .admin-filter-icon,
  .admin-select-group:focus-within .admin-filter-icon {
    border-color:rgba(45,49,149,.5) !important;
    background:#eef0ff !important;
  }

  .admin-active-filters {
    display:flex; align-items:center; gap:7px; flex-wrap:wrap;
    margin-top:13px; padding-top:12px; border-top:1px dashed #e6e8ef;
  }
  .admin-active-filters-label { color:#858B98; font-size:.62rem; font-weight:900; text-transform:uppercase; letter-spacing:.05em; }
  .admin-filter-chip {
    display:inline-flex; align-items:center; gap:5px;
    padding:6px 9px; border-radius:999px;
    background:#eef0ff; color:#2D3195; border:1px solid rgba(45,49,149,.1);
    font-size:.61rem; font-weight:800;
  }

  .admin-accommodations-toolbar-footer {
    display:flex; align-items:center; justify-content:space-between;
    gap:12px; flex-wrap:wrap; margin-top:14px; padding-top:12px;
    border-top:1px solid #eef0f4;
  }
  .admin-toolbar-result-count { color:var(--admin-muted); font-size:.66rem; font-weight:700; }
  .admin-toolbar-result-count strong { color:var(--admin-text); }
  .admin-clear-filters { display:inline-flex !important; align-items:center; gap:5px; padding:0 !important; color:#2D3195 !important; font-size:.66rem !important; font-weight:800 !important; text-decoration:none !important; }

  /* -------------------------------
     CARDS
  -------------------------------- */

  .admin-accommodations-grid > .col { display:flex; }

  .admin-accommodation-card {
    position: relative;
    width: 100%;
    min-height: 100%;
    overflow: hidden;
    border: 1px solid var(--admin-border) !important;
    border-radius: 18px !important;
    background: var(--admin-surface) !important;
    box-shadow: 0 7px 24px rgba(26, 30, 53, .06) !important;
    animation: adminAccommodationCardIn .55s ease both;
    transition: transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s ease, border-color .25s ease;
  }

  .admin-accommodation-card:hover {
    transform: translateY(-5px);
    border-color: rgba(45, 49, 149, .17) !important;
    box-shadow: 0 17px 38px rgba(26, 30, 53, .11) !important;
  }

  .admin-accommodation-image-shell {
    position: relative;
    height: 194px;
    overflow: hidden;
    border-radius: 18px 18px 0 0;
    background: #EEF0FF;
  }

  .admin-accommodation-card-image {
    width: 100% !important;
    height: 100% !important;
    display: block;
    object-fit: cover;
    transition: transform .65s cubic-bezier(.2,.65,.3,1);
  }

  .admin-accommodation-card:hover .admin-accommodation-card-image { transform: scale(1.045); }

  .admin-accommodation-image-overlay {
    position: absolute; inset: auto 0 0; height: 72px;
    background: linear-gradient(180deg, transparent 0%, rgba(10,12,25,.38) 100%);
    pointer-events: none;
  }

  .admin-accommodation-image-count {
    position:absolute; right:11px; bottom:10px; z-index:3;
    display:inline-flex; align-items:center; gap:4px;
    min-height:25px; padding:5px 8px; border-radius:999px;
    background:rgba(15,17,28,.56); color:#fff; backdrop-filter:blur(9px);
    font-size:.61rem; font-weight:900;
  }

  .admin-accommodation-website-badge {
    position:absolute; top:12px; right:12px; z-index:4;
    display:inline-flex; align-items:center; gap:4px;
    padding:6px 9px; border-radius:999px;
    background:rgba(255,183,27,.95); color:#4D3500;
    box-shadow:0 7px 18px rgba(0,0,0,.11);
    font-size:.61rem; font-weight:900;
  }

  .admin-accommodation-card .card-body { padding:16px !important; min-height:176px; }

  .admin-accommodation-badge-row { display:flex; align-items:center; gap:6px; flex-wrap:wrap; min-height:24px; }

  .admin-accommodation-card .badge {
    display:inline-flex; align-items:center; gap:4px;
    border-radius:999px !important; padding:5px 9px !important;
    font-family:"Nunito",sans-serif !important; font-size:.58rem !important; font-weight:900 !important;
  }

  .admin-accommodation-primary-badge { background:#eef0ff !important; color:#2D3195 !important; }
  .admin-accommodation-soft-badge { background:#f3f4f8 !important; color:#626978 !important; }
  .admin-accommodation-price-badge { background:#e7f8ee !important; color:#177a45 !important; }

  .admin-accommodation-name {
    margin:9px 0 0 !important;
    color:var(--admin-text) !important;
    font-family:"Poppins",sans-serif !important;
    font-size:.91rem !important; font-weight:800 !important; line-height:1.3 !important;
  }

  .admin-accommodation-description {
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;
    min-height:36px; overflow:hidden; margin:6px 0 8px;
    color:var(--admin-muted); font-family:"Nunito",sans-serif;
    font-size:.69rem; font-weight:600; line-height:1.55;
  }

  .admin-accommodation-location {
    display:flex; gap:6px; align-items:flex-start;
    min-height:32px; margin-bottom:8px;
    color:#818694; font-family:"Nunito",sans-serif;
    font-size:.65rem; font-weight:700; line-height:1.45;
  }
  .admin-accommodation-location svg { flex:0 0 auto; margin-top:1px; color:#2D3195; }

  .admin-accommodation-meta {
    display:flex; align-items:center; gap:6px;
    margin-bottom:5px; color:var(--admin-muted);
    font-family:"Nunito",sans-serif; font-size:.64rem; font-weight:700;
  }
  .admin-accommodation-meta svg { flex:0 0 auto; color:#8a90a0; }
  .admin-accommodation-meta span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

  .admin-accommodation-website-link {
    display:inline-flex; align-items:center; gap:5px;
    margin-bottom:12px; color:#2D3195; text-decoration:none;
    font-size:.64rem; font-weight:800;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
  }

  .admin-accommodation-card-actions {
    display:flex; gap:8px; flex-wrap:wrap;
    padding-top:12px; margin-top:auto;
    border-top:1px solid #EEF0F4;
  }

  .admin-accommodation-card-actions .btn {
    display:inline-flex; align-items:center; justify-content:center; gap:6px;
    min-height:36px; border-radius:10px !important;
    font-family:"Nunito",sans-serif !important;
    font-size:.67rem !important; font-weight:900 !important;
    transition:transform .18s ease, box-shadow .18s ease, background .18s ease;
  }

  .admin-accommodation-card-actions .admin-edit-button,
  .admin-accommodation-card-actions .admin-map-link-button { flex:1 1 auto !important; min-width:0 !important; }

  .admin-accommodation-card-actions .btn-outline-primary {
    color:#2D3195 !important; border-color:rgba(45,49,149,.25) !important; background:#F8F8FF !important;
  }
  .admin-accommodation-card-actions .btn-outline-primary:hover {
    color:#fff !important; border-color:#2D3195 !important; background:#2D3195 !important;
    transform:translateY(-1px); box-shadow:0 7px 16px rgba(45,49,149,.16);
  }

  .admin-accommodation-card-actions .btn-outline-warning {
    color:#8e6200 !important; border-color:rgba(255,183,27,.45) !important; background:#FFFBF0 !important;
  }
  .admin-accommodation-card-actions .btn-outline-warning:hover {
    color:#4D3500 !important; border-color:#FFB71B !important; background:#FFB71B !important;
    transform:translateY(-1px);
  }

  .admin-accommodation-card-actions .btn-outline-danger {
    width:40px; min-width:40px; flex:0 0 40px;
    padding-left:0 !important; padding-right:0 !important;
    color:#C74350 !important; border-color:rgba(199,67,80,.20) !important; background:#FFF7F8 !important;
  }
  .admin-accommodation-card-actions .btn-outline-danger:hover {
    color:#fff !important; border-color:#C74350 !important; background:#C74350 !important;
    transform:translateY(-1px);
  }

  /* -------------------------------
     LOADING / EMPTY
  -------------------------------- */

  .admin-accommodations-loading,
  .admin-accommodations-empty {
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    min-height:310px; padding:40px 20px; text-align:center;
    border:1px solid var(--admin-border); border-radius:18px;
    background:var(--admin-surface);
  }
  .admin-loading-icon, .admin-empty-icon {
    display:inline-flex; align-items:center; justify-content:center;
    color:#2D3195; background:#eef0ff;
  }
  .admin-loading-icon { width:52px; height:52px; border-radius:15px; }
  .admin-empty-icon { width:62px; height:62px; border-radius:18px; }
  .admin-loading-title, .admin-empty-title {
    margin-top:13px; color:var(--admin-text);
    font-family:"Poppins",sans-serif; font-size:.84rem; font-weight:800;
  }
  .admin-loading-subtitle, .admin-empty-text { margin:5px 0 0; color:var(--admin-muted); font-size:.68rem; font-weight:600; }
  .admin-empty-button {
    display:inline-flex !important; align-items:center; gap:6px; margin-top:16px;
    border-color:rgba(45,49,149,.28) !important; color:#2D3195 !important;
    border-radius:10px !important; font-size:.68rem !important; font-weight:800 !important;
  }

  /* -------------------------------
     MODALS
  -------------------------------- */

  .admin-accommodations-modal .modal-content {
    overflow:hidden;
    border:1px solid var(--admin-border) !important;
    border-radius:18px !important;
    background:#fff !important;
    box-shadow:0 22px 60px rgba(26,30,53,.18) !important;
  }

  .admin-accommodations-modal .modal-header {
    background:#2D3195 !important; color:#fff !important;
    border-bottom:0 !important; padding:18px 21px !important;
  }
  .admin-accommodations-modal .modal-header .btn-close { filter:brightness(0) invert(1); opacity:.85; }

  .admin-modal-title {
    display:inline-flex; align-items:center; gap:8px;
    color:#fff !important;
    font-family:"Poppins",sans-serif !important;
    font-size:.98rem !important; font-weight:800 !important;
  }

  .admin-accommodation-form-header { min-height:78px; padding:16px 20px !important; position:relative; overflow:hidden; }
  .admin-accommodation-form-header::after {
    content:""; position:absolute; width:170px; height:170px;
    right:-55px; top:-75px; border-radius:50%;
    background:rgba(255,255,255,.10); pointer-events:none;
  }
  .admin-form-modal-title { position:relative; z-index:1; gap:11px; }
  .admin-form-title-icon {
    width:40px; height:40px; display:inline-flex; align-items:center; justify-content:center;
    border-radius:12px; background:rgba(255,255,255,.16); border:1px solid rgba(255,255,255,.22);
  }
  .admin-form-title-kicker { display:block; color:rgba(255,255,255,.72); font-family:"Nunito",sans-serif; font-size:.58rem; font-weight:800; letter-spacing:.08em; text-transform:uppercase; margin-bottom:2px; }
  .admin-form-title-text { display:block; color:#fff; font-family:"Poppins",sans-serif; font-size:1.05rem; font-weight:800; }

  .admin-accommodations-modal .modal-body { padding:22px !important; background:var(--admin-surface) !important; color:var(--admin-text) !important; }
  .admin-accommodations-modal .modal-footer { gap:8px; padding:12px 20px !important; background:var(--admin-surface) !important; border-top:1px solid #EEF0F4 !important; }
  .admin-accommodations-modal .modal-body > hr { margin:24px 0 !important; border-color:var(--admin-border) !important; opacity:1; }

  .admin-form-intro {
    display:flex; align-items:center; gap:11px;
    padding:12px 14px; margin-bottom:20px;
    border:1px solid rgba(45,49,149,.11); border-radius:13px; background:#f7f7ff;
  }
  .admin-form-intro-icon {
    width:34px; height:34px; flex:0 0 34px;
    display:inline-flex; align-items:center; justify-content:center;
    border-radius:10px; background:#eef0ff; color:#2D3195;
  }
  .admin-form-intro strong { display:block; color:#2D3195; font-size:.72rem; font-weight:900; }
  .admin-form-intro span { display:block; margin-top:2px; color:#7c8290; font-size:.63rem; font-weight:600; }

  .admin-form-section {
    display:flex !important; align-items:center; gap:8px;
    padding:10px 12px; margin:4px 0 14px;
    border-left:3px solid #2D3195; border-radius:0 10px 10px 0;
    background:rgba(45,49,149,.055);
    color:#2D3195;
    font-family:"Poppins",sans-serif; font-size:.78rem; font-weight:800;
  }
  .admin-form-section-icon {
    width:27px; height:27px; display:inline-flex; align-items:center; justify-content:center;
    border-radius:8px; background:#eef0ff; color:#2D3195;
  }

  .admin-accommodations-modal .form-label,
  .admin-accommodations-modal .fw-semibold {
    color:#4e5564 !important; font-family:"Nunito",sans-serif !important;
    font-size:.67rem !important; font-weight:900 !important; margin-bottom:6px;
  }

  .admin-accommodations-modal .form-control,
  .admin-accommodations-modal .form-select {
    min-height:42px; border:1px solid #e0e3ea !important;
    border-radius:11px !important; background:#fff !important;
    color:var(--admin-text) !important;
    font-family:"Nunito",sans-serif !important; font-size:.70rem !important; font-weight:600 !important;
    box-shadow:0 3px 10px rgba(26,30,53,.025) !important;
  }
  .admin-accommodations-modal textarea.form-control { min-height:96px; resize:vertical; }
  .admin-accommodations-modal .form-control:focus,
  .admin-accommodations-modal .form-select:focus {
    border-color:rgba(45,49,149,.52) !important;
    box-shadow:0 0 0 3px rgba(45,49,149,.08) !important;
  }
  .admin-accommodations-modal .form-control::placeholder { color:#A4A8B2 !important; }

  .admin-accommodations-modal .alert {
    border:0 !important; border-radius:13px !important;
    font-family:"Nunito",sans-serif; font-size:.72rem; font-weight:700;
  }

  .admin-accommodations-modal .modal-footer .btn {
    min-height:39px; border-radius:11px !important; padding:8px 15px !important;
    font-family:"Nunito",sans-serif !important; font-size:.69rem !important; font-weight:900 !important;
  }
  .admin-accommodations-modal .modal-footer .btn-primary {
    border:0 !important; background:var(--admin-primary) !important; color:#fff !important;
    box-shadow:0 8px 18px rgba(45,49,149,.16);
  }
  .admin-accommodations-modal .modal-footer .btn-primary:hover { background:var(--admin-primary-dark) !important; transform:translateY(-1px); }
  .admin-accommodations-modal .modal-footer .btn-secondary {
    border-color:#E0E3EB !important; background:#fff !important; color:#656A76 !important;
  }

  /* Address / map link panel */
  .admin-location-panel {
    padding:14px 16px; border-radius:13px;
    border:1px solid var(--admin-border); background:#FAFAFF;
  }
  .admin-location-panel-title {
    display:inline-flex; align-items:center; gap:6px;
    color:#2D3195; font-family:"Poppins",sans-serif; font-size:.74rem; font-weight:800;
  }
  .admin-location-panel small { color:var(--admin-muted); font-size:.63rem; font-weight:600; }
  .admin-location-button-inline {
    display:inline-flex !important; align-items:center; gap:6px;
    border-radius:10px !important; border-color:rgba(45,49,149,.28) !important;
    color:#2D3195 !important; background:#fff !important;
    font-size:.66rem !important; font-weight:900 !important;
  }

  .admin-image-dropzone {
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    min-height:126px; padding:22px;
    border:2px dashed #DDE0EA; border-radius:14px;
    background:#FAFAFF; text-align:center; cursor:pointer;
    transition:border-color .2s ease, background .2s ease;
  }
  .admin-image-dropzone:hover { border-color:rgba(45,49,149,.45); background:#F5F5FF; }
  .admin-image-dropzone-icon {
    width:42px; height:42px; display:inline-flex; align-items:center; justify-content:center;
    border-radius:12px; background:#eef0ff; color:#2D3195; margin-bottom:9px;
  }
  .admin-image-dropzone-title { color:var(--admin-text); font-size:.72rem; font-weight:900; }
  .admin-image-dropzone-hint { margin-top:3px; color:var(--admin-muted); font-size:.62rem; font-weight:600; }

  .admin-accommodations-modal .modal-body img { border-radius:12px; }

  /* Detail boxes */
  .admin-accommodation-detail-box {
    display:flex; flex-direction:column; gap:4px;
    padding:12px 14px; border-radius:12px;
    background:#FAFAFF; border:1px solid var(--admin-border);
  }
  .admin-accommodation-detail-box small {
    display:inline-flex; align-items:center; gap:5px;
    color:var(--admin-muted); font-family:"Nunito",sans-serif;
    font-size:.63rem; font-weight:900; text-transform:uppercase; letter-spacing:.04em;
  }
  .admin-accommodation-detail-box small svg { color:#2D3195; }
  .admin-accommodation-detail-box strong {
    color:var(--admin-text); font-family:"Nunito",sans-serif;
    font-size:.74rem; font-weight:700; line-height:1.5; overflow-wrap:anywhere;
  }

  /* -------------------------------
     DARK MODE
  -------------------------------- */

  .admin-accommodations-dark {
    --admin-bg:#121421;
    --admin-surface:#191C2B;
    --admin-border:#2B3042;
    --admin-text:#F1F3F8;
    --admin-muted:#A8AFBF;
    background:
      radial-gradient(circle at 8% 0%, rgba(100,106,212,.12), transparent 28%),
      linear-gradient(180deg, #151827 0%, #10121C 100%);
  }

  .admin-accommodations-dark .admin-accommodations-toolbar,
  .admin-accommodations-dark .admin-accommodation-card,
  .admin-accommodations-dark .admin-accommodations-loading,
  .admin-accommodations-dark .admin-accommodations-empty,
  .admin-accommodations-dark .admin-accommodations-stats .admin-stat-card,
  .admin-accommodations-dark .modal-content { background:#191C2B !important; border-color:#2B3042 !important; }

  .admin-accommodations-dark .admin-accommodations-toolbar-heading { background:#202436; border-color:#343A4F; }
  .admin-accommodations-dark .admin-toolbar-heading-icon,
  .admin-accommodations-dark .admin-filter-icon,
  .admin-accommodations-dark .admin-form-intro-icon,
  .admin-accommodations-dark .admin-form-section-icon,
  .admin-accommodations-dark .admin-image-dropzone-icon,
  .admin-accommodations-dark .admin-stat-icon-blue,
  .admin-accommodations-dark .admin-stat-icon-purple,
  .admin-accommodations-dark .admin-stat-icon-indigo,
  .admin-accommodations-dark .admin-empty-icon,
  .admin-accommodations-dark .admin-loading-icon { background:#262B46 !important; color:#AEB4FF !important; }

  .admin-accommodations-dark .admin-filter-status-pill { background:#3b3217; color:#ffd86b; }
  .admin-accommodations-dark .admin-active-filters { border-color:#343A4F; }
  .admin-accommodations-dark .admin-filter-chip { background:#262B46; color:#c9ccff; border-color:#343A4F; }

  .admin-accommodations-dark .admin-filter-group > .form-control,
  .admin-accommodations-dark .admin-filter-group > .form-select,
  .admin-accommodations-dark .admin-filter-group > .btn {
    background:#202436 !important; border-color:#343A4F !important; color:#F1F3F8 !important;
  }
  .admin-accommodations-dark .admin-filter-group > .form-control::placeholder { color:#858B9A !important; }

  .admin-accommodations-dark .admin-accommodations-modal .modal-body,
  .admin-accommodations-dark .admin-accommodations-modal .modal-footer { background:#191C2B !important; }
  .admin-accommodations-dark .admin-accommodations-modal .form-control,
  .admin-accommodations-dark .admin-accommodations-modal .form-select {
    background:#202436 !important; border-color:#343A4F !important; color:#F1F3F8 !important;
  }
  .admin-accommodations-dark .admin-accommodations-modal .form-label,
  .admin-accommodations-dark .admin-accommodations-modal .fw-semibold { color:#d9dce7 !important; }
  .admin-accommodations-dark .admin-form-intro,
  .admin-accommodations-dark .admin-location-panel,
  .admin-accommodations-dark .admin-image-dropzone,
  .admin-accommodations-dark .admin-accommodation-detail-box { background:#202436 !important; border-color:#343A4F !important; }
  .admin-accommodations-dark .admin-form-intro strong,
  .admin-accommodations-dark .admin-location-panel-title { color:#c9ccff !important; }
  .admin-accommodations-dark .admin-form-section { background:#262B46 !important; color:#c9ccff !important; }
  .admin-accommodations-dark .admin-accommodation-card-actions { border-color:#2B3042; }

  /* -------------------------------
     KEYFRAMES / RESPONSIVE
  -------------------------------- */

  @keyframes adminAccommodationCardIn {
    from { opacity:0; transform:translateY(12px); }
    to { opacity:1; transform:translateY(0); }
  }

  @keyframes adminDashboardFade {
    from { opacity:0; transform:translateY(5px); }
    to { opacity:1; transform:translateY(0); }
  }

  .admin-accommodations-page > * { animation: adminDashboardFade .4s ease both; }

  @media (max-width: 991.98px) {
    .admin-accommodations-heading { align-items:flex-start !important; flex-direction:column; gap:14px; }
    .admin-accommodations-add-button { width:100%; }
    .admin-accommodations-title { font-size:clamp(1.65rem, 4.5vw, 2.25rem) !important; }
  }

  @media (max-width: 767.98px) {
    .admin-accommodations-title { font-size:1.9rem !important; }
    .admin-accommodations-stats .admin-stat-card { min-height:112px !important; }
    .admin-accommodation-image-shell { height:185px; }
    .admin-accommodations-modal .modal-body { padding:17px !important; }
  }

  @media (max-width: 575.98px) {
    .admin-accommodation-card-actions { flex-wrap:nowrap !important; }
    .admin-accommodation-card-actions .btn { font-size:.62rem !important; padding-left:8px !important; padding-right:8px !important; }
  }

  @media (max-width: 479.98px) {
    .admin-accommodations-title { font-size:1.8rem !important; }
    .admin-accommodation-image-shell { height:180px; }
  }
`;

/* =========================================================
   HELPERS
========================================================= */

const normalizeArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeAccommodation = (value: any): AccommodationRecord => ({
  id: String(value?.id ?? value?._id ?? ""),
  name: String(value?.name ?? "").trim(),
  owner: value?.owner ?? null,
  manager: value?.manager ?? null,
  address: value?.address ?? null,
  contact_number: value?.contact_number ?? null,
  website: value?.website ?? null,
  images: normalizeArray(value?.images),
  description: value?.description ?? null,
  price_range: value?.price_range ?? null,
  created_at: value?.created_at ?? null,
  updated_at: value?.updated_at ?? null,
});

const getImages = (accommodation: AccommodationRecord): string[] =>
  normalizeArray(accommodation.images);

const getWebsite = (accommodation: AccommodationRecord): string =>
  String(accommodation.website ?? "").trim();

const getPhone = (accommodation: AccommodationRecord): string =>
  String(accommodation.contact_number ?? "").trim();

const getAddress = (accommodation: AccommodationRecord): string =>
  String(accommodation.address ?? "").trim();

const getOwner = (accommodation: AccommodationRecord): string =>
  String(accommodation.owner ?? "").trim();

const getManager = (accommodation: AccommodationRecord): string =>
  String(accommodation.manager ?? "").trim();

const getPriceRange = (accommodation: AccommodationRecord): string =>
  String(accommodation.price_range ?? "").trim();

const getWebsiteHref = (website: string): string => {
  if (!website) return "";
  if (/^https?:\/\//i.test(website)) return website;
  return `https://${website}`;
};

/* Builds an external Google Maps search link from the establishment's
   name and address, so location lives in Google Maps instead of an
   in-app interactive map. */
const buildGoogleMapsUrl = (accommodation: AccommodationRecord): string => {
  const address = getAddress(accommodation);
  const query = [accommodation.name, address].filter(Boolean).join(", ");

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query || accommodation.name
  )}`;
};

/* =========================================================
   COMPONENT
========================================================= */

const AdminAccommodations: React.FC = () => {
  const { darkMode } = useDarkMode();

  const [items, setItems] = useState<AccommodationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("name-asc");

  const [showModal, setShowModal] = useState(false);
  const [viewItem, setViewItem] = useState<AccommodationRecord | null>(null);
  const [editing, setEditing] = useState<AccommodationRecord | null>(null);

  const [form, setForm] = useState<AccommodationForm>({
    ...EMPTY_FORM,
    imageFiles: [],
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pageError, setPageError] = useState("");

  /* =========================================================
     LOAD
  ========================================================= */

  const load = async () => {
    setLoading(true);
    setPageError("");

    try {
      clearCache("accommodations");

      const response = await getAccommodations();
      const data = Array.isArray(response?.data)
        ? response.data
        : [];

      const normalized = data
        .map(normalizeAccommodation)
        .filter((item) => item.id && item.name);

      setItems(normalized);
    } catch (err: any) {
      console.error("[Hotels & Resorts] Failed to load:", err);
      setItems([]);
      setPageError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load accommodations."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     INITIAL LOAD + REALTIME
  ========================================================= */

  useEffect(() => {
    void load();

    subscribeToAccommodations(() => {
      void load();
    });

    return () => {
      unsubscribeAll();
    };
  }, []);

  /* =========================================================
     SEARCH + SORT
  ========================================================= */

  const filteredItems = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    let filtered = items.filter((item) => {
      if (!search) return true;

      const searchableText = [
        item.name,
        getOwner(item),
        getManager(item),
        getAddress(item),
        getPhone(item),
        getWebsite(item),
        getPriceRange(item),
        item.description || "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });

    filtered = [...filtered].sort((a, b) => {
      if (sortOption === "name-desc") {
        return b.name.localeCompare(a.name);
      }

      if (sortOption === "newest") {
        return (
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
        );
      }

      if (sortOption === "oldest") {
        return (
          new Date(a.created_at || 0).getTime() -
          new Date(b.created_at || 0).getTime()
        );
      }

      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [items, searchTerm, sortOption]);

  /* =========================================================
     FORM HELPER
  ========================================================= */

  const updateForm = (
    field: keyof AccommodationForm,
    value: string | File[]
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  /* =========================================================
     CREATE
  ========================================================= */

  const openCreate = () => {
    setEditing(null);
    setViewItem(null);
    setError("");

    setForm({
      ...EMPTY_FORM,
      imageFiles: [],
    });

    setShowModal(true);
  };

  /* =========================================================
     EDIT
  ========================================================= */

  const openEdit = (accommodation: AccommodationRecord) => {
    setViewItem(null);
    setEditing(accommodation);
    setError("");

    setForm({
      name: accommodation.name || "",
      owner: getOwner(accommodation),
      manager: getManager(accommodation),
      address: getAddress(accommodation),
      contactNumber: getPhone(accommodation),
      website: getWebsite(accommodation),
      description: accommodation.description || "",
      priceRange: getPriceRange(accommodation),
      images: getImages(accommodation).join(", "),
      imageFiles: [],
    });

    setShowModal(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowModal(false);
    setEditing(null);
    setError("");
    setForm({
      ...EMPTY_FORM,
      imageFiles: [],
    });
  };

  /* =========================================================
     SAVE

     IMPORTANT:
     This payload contains ONLY the columns this page manages.
  ========================================================= */

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Name of establishment is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      /* Existing image URLs */
      const imageUrls = form.images
        .split(",")
        .map((image) => image.trim())
        .filter(Boolean);

      /* Upload newly selected images */
      for (const file of form.imageFiles) {
        try {
          const uploadedUrl = await uploadImageToSupabase(file);

          if (uploadedUrl) {
            imageUrls.push(uploadedUrl);
          }
        } catch (uploadError) {
          console.error(
            "[Hotels & Resorts] Image upload failed:",
            uploadError
          );

          throw new Error(
            "Image upload failed. Please try again."
          );
        }
      }

      /* =====================================================
         DATABASE PAYLOAD
      ===================================================== */

      const payload = {
        name: form.name.trim(),
        owner: form.owner.trim(),
        manager: form.manager.trim(),
        address: form.address.trim(),
        contact_number: form.contactNumber.trim(),
        website: form.website.trim(),
        description: form.description.trim(),
        price_range: form.priceRange.trim(),
        images: imageUrls,
      };

      if (editing?.id) {
        await updateAccommodation(editing.id, payload);
      } else {
        await createAccommodation(payload);
      }

      clearCache("accommodations");

      setShowModal(false);
      setEditing(null);
      setForm({
        ...EMPTY_FORM,
        imageFiles: [],
      });

      await load();
    } catch (err: any) {
      console.error("[Hotels & Resorts] Save failed:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.details ||
          err?.response?.data?.hint ||
          err?.message ||
          "Failed to save establishment."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = async (accommodation: AccommodationRecord) => {
    const confirmed = window.confirm(
      `Delete "${accommodation.name}"?\n\nThis cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setPageError("");

      await deleteAccommodation(accommodation.id);

      clearCache("accommodations");

      if (viewItem?.id === accommodation.id) {
        setViewItem(null);
      }

      await load();
    } catch (err: any) {
      console.error("[Hotels & Resorts] Delete failed:", err);

      setPageError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete establishment."
      );
    }
  };

  /* =========================================================
     STATS
  ========================================================= */

  const totalEstablishments = items.length;

  const withPhone = items.filter((item) => Boolean(getPhone(item))).length;

  const withWebsite = items.filter((item) => Boolean(getWebsite(item))).length;

  const currentlyShowing = filteredItems.length;

  const imagePreviewUrls = form.imageFiles.map((file) =>
    URL.createObjectURL(file)
  );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <AdminLayout>
      <div
        className={`admin-accommodations-page ${
          darkMode ? "admin-accommodations-dark" : ""
        }`}
      >
        <style>{ADMIN_ACCOMMODATIONS_STYLES}</style>

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="admin-accommodations-heading d-flex justify-content-between">
          <div className="admin-accommodations-heading-copy">
            <div className="admin-accommodations-eyebrow">CONTENT MANAGEMENT</div>

            <h2 className="admin-accommodations-title">HOTELS &amp; RESORTS</h2>

            <p className="admin-accommodations-subtitle">
              Manage Calbayog City accommodation establishments, contact details, images, and pricing from one place.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={openCreate}
            className="admin-accommodations-add-button"
          >
            <Plus size={17} strokeWidth={2.2} />
            <span>Add Establishment</span>
          </Button>
        </div>

        {/* =====================================================
            STATS
        ===================================================== */}

        <Row className="g-3 mb-4 admin-accommodations-stats">
          <Col xs={12} sm={6} xl={3}>
            <Card
              className="border-0 h-100 admin-stat-card"
              onClick={() => setSearchTerm("")}
            >
              <Card.Body>
                <div className="admin-stat-card-top">
                  <span className="admin-stat-icon admin-stat-icon-blue">
                    <Building2 size={18} strokeWidth={2} />
                  </span>
                  <span className="admin-stat-label">Total Establishments</span>
                </div>
                <div className="admin-stat-value">{totalEstablishments}</div>
                <div className="admin-stat-caption">All accommodation records</div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} xl={3}>
            <Card className="border-0 h-100 admin-stat-card">
              <Card.Body>
                <div className="admin-stat-card-top">
                  <span className="admin-stat-icon admin-stat-icon-yellow">
                    <Phone size={18} strokeWidth={2} />
                  </span>
                  <span className="admin-stat-label">With Contact Number</span>
                </div>
                <div className="admin-stat-value">{withPhone}</div>
                <div className="admin-stat-caption">Reachable by phone</div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} xl={3}>
            <Card className="border-0 h-100 admin-stat-card">
              <Card.Body>
                <div className="admin-stat-card-top">
                  <span className="admin-stat-icon admin-stat-icon-purple">
                    <Globe2 size={18} strokeWidth={2} />
                  </span>
                  <span className="admin-stat-label">With Website</span>
                </div>
                <div className="admin-stat-value">{withWebsite}</div>
                <div className="admin-stat-caption">Has an online page</div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} xl={3}>
            <Card
              className="border-0 h-100 admin-stat-card"
              onClick={() => setSearchTerm("")}
            >
              <Card.Body>
                <div className="admin-stat-card-top">
                  <span className="admin-stat-icon admin-stat-icon-indigo">
                    <Eye size={18} strokeWidth={2} />
                  </span>
                  <span className="admin-stat-label">Currently Showing</span>
                </div>
                <div className="admin-stat-value">{currentlyShowing}</div>
                <div className="admin-stat-caption">Records matching current filters</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* =====================================================
            SEARCH / SORT TOOLBAR
        ===================================================== */}

        <Card className="border-0 mb-4 admin-accommodations-toolbar">
          <Card.Body>
            <div className="admin-accommodations-toolbar-heading">
              <div className="admin-filter-heading-main">
                <span className="admin-toolbar-heading-icon">
                  <SlidersHorizontal size={18} strokeWidth={2.1} />
                </span>
                <div>
                  <div className="admin-accommodations-toolbar-title">Find an Accommodation</div>
                  <div className="admin-accommodations-toolbar-caption">
                    Search, sort, and organize your establishment records.
                  </div>
                </div>
              </div>

              <div className="admin-filter-status-pill">
                <Search size={13} strokeWidth={2.2} />
                {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""}
              </div>
            </div>

            <Row className="g-3">
              <Col xs={12} lg={5}>
                <InputGroup className="admin-filter-group admin-search-group">
                  <InputGroup.Text className="admin-filter-icon">
                    <Search size={16} strokeWidth={2.1} />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search name, owner, manager, address, contact..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                  {searchTerm && (
                    <Button
                      variant="outline-secondary"
                      onClick={() => setSearchTerm("")}
                      aria-label="Clear search"
                    >
                      <X size={16} strokeWidth={2} />
                    </Button>
                  )}
                </InputGroup>
              </Col>

              <Col xs={12} sm={6} lg={4}>
                <InputGroup className="admin-filter-group admin-select-group">
                  <InputGroup.Text className="admin-filter-icon">
                    <Building2 size={15} strokeWidth={2.1} />
                  </InputGroup.Text>
                  <Form.Select value="all" disabled>
                    <option value="all">All Accommodations</option>
                  </Form.Select>
                </InputGroup>
              </Col>

              <Col xs={12} sm={6} lg={3}>
                <InputGroup className="admin-filter-group admin-select-group">
                  <InputGroup.Text className="admin-filter-icon">
                    <ArrowUpDown size={15} strokeWidth={2.1} />
                  </InputGroup.Text>
                  <Form.Select
                    value={sortOption}
                    onChange={(event) => setSortOption(event.target.value)}
                  >
                    <option value="name-asc">A–Z: Name</option>
                    <option value="name-desc">Z–A: Name</option>
                    <option value="newest">Newest Added</option>
                    <option value="oldest">Oldest Added</option>
                  </Form.Select>
                </InputGroup>
              </Col>
            </Row>

            {searchTerm && (
              <div className="admin-active-filters">
                <span className="admin-active-filters-label">Active:</span>
                <span className="admin-filter-chip">
                  <Search size={11} strokeWidth={2.2} />
                  “{searchTerm}”
                </span>
              </div>
            )}

            <div className="admin-accommodations-toolbar-footer">
              <div className="admin-toolbar-result-count">
                Showing <strong>{filteredItems.length}</strong> of {items.length} establishments
              </div>

              {searchTerm && (
                <Button
                  variant="link"
                  size="sm"
                  className="admin-clear-filters"
                  onClick={() => setSearchTerm("")}
                >
                  <X size={14} strokeWidth={2.2} />
                  Clear search
                </Button>
              )}
            </div>
          </Card.Body>
        </Card>

        {pageError && (
          <Alert
            variant="danger"
            className="mb-4"
            dismissible
            onClose={() => setPageError("")}
          >
            {pageError}
          </Alert>
        )}

        {/* =====================================================
            CARDS
        ===================================================== */}

        {loading ? (
          <div className="admin-accommodations-loading">
            <div className="admin-loading-icon">
              <Spinner animation="border" size="sm" />
            </div>
            <div className="admin-loading-title">Loading accommodations...</div>
            <div className="admin-loading-subtitle">
              Preparing Calbayog City Tourism records.
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="admin-accommodations-empty">
            <div className="admin-empty-icon">
              <Building2 size={30} strokeWidth={1.7} />
            </div>
            <div className="admin-empty-title">
              {items.length === 0
                ? "No accommodations yet"
                : "No accommodations found"}
            </div>
            <p className="admin-empty-text">
              {items.length === 0
                ? "Add the first establishment to start building the directory."
                : "Try adjusting your search to find another establishment."}
            </p>

            {items.length === 0 ? (
              <Button
                variant="outline-primary"
                className="admin-empty-button"
                onClick={openCreate}
              >
                <Plus size={15} strokeWidth={2} />
                Add Establishment
              </Button>
            ) : (
              <Button
                variant="outline-primary"
                className="admin-empty-button"
                onClick={() => setSearchTerm("")}
              >
                <Building2 size={15} strokeWidth={2} />
                View all establishments
              </Button>
            )}
          </div>
        ) : (
          <Row className="g-3 g-lg-4 admin-accommodations-grid">
            {filteredItems.map((accommodation, index) => {
              const images = getImages(accommodation);
              const image = images[0];
              const website = getWebsite(accommodation);
              const phone = getPhone(accommodation);
              const owner = getOwner(accommodation);
              const manager = getManager(accommodation);
              const address = getAddress(accommodation);
              const priceRange = getPriceRange(accommodation);

              return (
                <Col xs={12} sm={6} lg={4} xl={3} key={accommodation.id}>
                  <Card
                    className="h-100 border-0 admin-accommodation-card"
                    style={{ animationDelay: `${Math.min(index * 55, 440)}ms` }}
                    onClick={() => setViewItem(accommodation)}
                  >
                    <div className="admin-accommodation-image-shell">
                      <img
                        src={image || DEFAULT_ACCOMMODATION_IMAGE}
                        alt={accommodation.name}
                        className="admin-accommodation-card-image"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = DEFAULT_ACCOMMODATION_IMAGE;
                        }}
                      />

                      <div className="admin-accommodation-image-overlay" />

                      {website && (
                        <span className="admin-accommodation-website-badge">
                          <Globe2 size={12} strokeWidth={2.2} />
                          Website
                        </span>
                      )}

                      {images.length > 1 && (
                        <span className="admin-accommodation-image-count">
                          <ImageIcon size={13} strokeWidth={2} />
                          {images.length}
                        </span>
                      )}
                    </div>

                    <Card.Body className="p-3 d-flex flex-column">
                      <div className="admin-accommodation-badge-row">
                        <Badge className="admin-accommodation-primary-badge">
                          <Building2 size={11} strokeWidth={2.2} />
                          Hotels &amp; Resorts
                        </Badge>

                        {priceRange && (
                          <Badge className="admin-accommodation-price-badge">
                            <DollarSign size={11} strokeWidth={2.2} />
                            {priceRange}
                          </Badge>
                        )}

                        {phone && (
                          <Badge className="admin-accommodation-soft-badge">
                            <Phone size={11} strokeWidth={2.2} />
                            Contact
                          </Badge>
                        )}
                      </div>

                      <h5 className="admin-accommodation-name">{accommodation.name}</h5>

                      {accommodation.description && (
                        <p className="admin-accommodation-description">
                          {accommodation.description}
                        </p>
                      )}

                      <p
                        className="admin-accommodation-location"
                        title={address || "Address not available"}
                      >
                        <MapPin size={14} strokeWidth={2} />
                        <span>{address || "Address not available"}</span>
                      </p>

                      {owner && (
                        <div className="admin-accommodation-meta">
                          <UsersRound size={13} strokeWidth={2} />
                          <span>Owner: {owner}</span>
                        </div>
                      )}

                      {manager && (
                        <div className="admin-accommodation-meta">
                          <Briefcase size={13} strokeWidth={2} />
                          <span>Manager: {manager}</span>
                        </div>
                      )}

                      {phone && (
                        <div className="admin-accommodation-meta">
                          <Phone size={13} strokeWidth={2} />
                          <span>{phone}</span>
                        </div>
                      )}

                      {website && (
                        <a
                          href={getWebsiteHref(website)}
                          target="_blank"
                          rel="noreferrer"
                          className="admin-accommodation-website-link"
                          onClick={(event) => event.stopPropagation()}
                          title={website}
                        >
                          <Globe2 size={13} strokeWidth={2} />
                          {website}
                        </a>
                      )}

                      <div
                        className="admin-accommodation-card-actions"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => openEdit(accommodation)}
                          className="admin-edit-button"
                        >
                          <Pencil size={14} strokeWidth={2} />
                          Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="outline-warning"
                          className="admin-map-link-button"
                          disabled={!address}
                          onClick={() =>
                            window.open(
                              buildGoogleMapsUrl(accommodation),
                              "_blank",
                              "noopener,noreferrer"
                            )
                          }
                          title={
                            address
                              ? "Open in Google Maps"
                              : "Add an address to enable this"
                          }
                        >
                          <ExternalLink size={14} strokeWidth={2} />
                          Google Maps
                        </Button>

                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => void handleDelete(accommodation)}
                          aria-label={`Delete ${accommodation.name}`}
                          title="Delete establishment"
                        >
                          <Trash2 size={14} strokeWidth={2} />
                          <span className="visually-hidden">Delete</span>
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}

        {/* =====================================================
            DETAIL VIEW
        ===================================================== */}

        <Modal
          className="admin-accommodations-modal admin-accommodations-detail-modal"
          show={Boolean(viewItem)}
          onHide={() => setViewItem(null)}
          centered
          size="lg"
          scrollable
          fullscreen="sm-down"
        >
          {viewItem && (
            <>
              <Modal.Header closeButton>
                <Modal.Title className="admin-modal-title">
                  <Building2 size={18} strokeWidth={2.1} />
                  {viewItem.name}
                </Modal.Title>
              </Modal.Header>

              <Modal.Body>
                {getImages(viewItem)[0] && (
                  <img
                    src={getImages(viewItem)[0]}
                    alt={viewItem.name}
                    style={{
                      width: "100%",
                      height: 280,
                      objectFit: "cover",
                      borderRadius: 14,
                      marginBottom: 20,
                    }}
                  />
                )}

                <Row className="g-3">
                  <Col xs={12}>
                    <div className="admin-accommodation-detail-box">
                      <small>
                        <Building2 size={12} strokeWidth={2.2} />
                        Name of Establishment
                      </small>
                      <strong>{viewItem.name}</strong>
                    </div>
                  </Col>

                  <Col xs={12} md={6}>
                    <div className="admin-accommodation-detail-box">
                      <small>
                        <UsersRound size={12} strokeWidth={2.2} />
                        Owner
                      </small>
                      <strong>{getOwner(viewItem) || "—"}</strong>
                    </div>
                  </Col>

                  <Col xs={12} md={6}>
                    <div className="admin-accommodation-detail-box">
                      <small>
                        <Briefcase size={12} strokeWidth={2.2} />
                        Manager
                      </small>
                      <strong>{getManager(viewItem) || "—"}</strong>
                    </div>
                  </Col>

                  <Col xs={12}>
                    <div className="admin-accommodation-detail-box">
                      <small>
                        <MapPin size={12} strokeWidth={2.2} />
                        Address
                      </small>
                      <strong>{getAddress(viewItem) || "—"}</strong>
                    </div>
                  </Col>

                  <Col xs={12} md={6}>
                    <div className="admin-accommodation-detail-box">
                      <small>
                        <Phone size={12} strokeWidth={2.2} />
                        Contact Number
                      </small>
                      <strong>{getPhone(viewItem) || "—"}</strong>
                    </div>
                  </Col>

                  <Col xs={12} md={6}>
                    <div className="admin-accommodation-detail-box">
                      <small>
                        <Globe2 size={12} strokeWidth={2.2} />
                        Website
                      </small>
                      {getWebsite(viewItem) ? (
                        <a
                          href={getWebsiteHref(getWebsite(viewItem))}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: CALBAYOG_BLUE,
                            fontWeight: 800,
                            fontSize: "0.74rem",
                            overflowWrap: "anywhere",
                            textDecoration: "none",
                          }}
                        >
                          {getWebsite(viewItem)}
                        </a>
                      ) : (
                        <strong>—</strong>
                      )}
                    </div>
                  </Col>

                  <Col xs={12} md={6}>
                    <div className="admin-accommodation-detail-box">
                      <small>
                        <DollarSign size={12} strokeWidth={2.2} />
                        Price Range
                      </small>
                      <strong>{getPriceRange(viewItem) || "—"}</strong>
                    </div>
                  </Col>

                  <Col xs={12} md={6}>
                    <div className="admin-accommodation-detail-box">
                      <small>
                        <ExternalLink size={12} strokeWidth={2.2} />
                        Map Location
                      </small>
                      {getAddress(viewItem) ? (
                        <a
                          href={buildGoogleMapsUrl(viewItem)}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: CALBAYOG_BLUE,
                            fontWeight: 800,
                            fontSize: "0.74rem",
                            textDecoration: "none",
                          }}
                        >
                          Open in Google Maps
                        </a>
                      ) : (
                        <strong>Add an address to enable this</strong>
                      )}
                    </div>
                  </Col>

                  <Col xs={12}>
                    <div className="admin-accommodation-detail-box">
                      <small>
                        <FileText size={12} strokeWidth={2.2} />
                        Full Description
                      </small>
                      <strong style={{ whiteSpace: "pre-line" }}>
                        {viewItem.description || "—"}
                      </strong>
                    </div>
                  </Col>

                  <Col xs={12}>
                    <div className="admin-accommodation-detail-box">
                      <small>
                        <ImageIcon size={12} strokeWidth={2.2} />
                        Images
                      </small>

                      {getImages(viewItem).length > 0 ? (
                        <div className="d-flex gap-2 flex-wrap mt-1">
                          {getImages(viewItem).map((imageUrl, imageIndex) => (
                            <img
                              key={`${imageUrl}-${imageIndex}`}
                              src={imageUrl}
                              alt=""
                              style={{
                                width: 92,
                                height: 72,
                                objectFit: "cover",
                                borderRadius: 10,
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <strong>No images uploaded</strong>
                      )}
                    </div>
                  </Col>
                </Row>
              </Modal.Body>

              <Modal.Footer>
                <Button variant="secondary" onClick={() => setViewItem(null)}>
                  Close
                </Button>

                <Button
                  variant="primary"
                  onClick={() => {
                    const accommodation = viewItem;
                    setViewItem(null);
                    openEdit(accommodation);
                  }}
                >
                  <Pencil size={14} strokeWidth={2} className="me-1" />
                  Edit
                </Button>
              </Modal.Footer>
            </>
          )}
        </Modal>

        {/* =====================================================
            ADD / EDIT MODAL
        ===================================================== */}

        <Modal
          className="admin-accommodations-modal"
          show={showModal}
          onHide={closeForm}
          size="lg"
          centered
          fullscreen="sm-down"
          scrollable
        >
          <Modal.Header
            closeButton={!saving}
            className="admin-accommodation-form-header"
            style={{ background: MAIN_GRADIENT, color: "#fff" }}
          >
            <Modal.Title className="admin-modal-title admin-form-modal-title">
              <span className="admin-form-title-icon">
                <Building2 size={20} strokeWidth={2} />
              </span>
              <span>
                <span className="admin-form-title-kicker">Accommodation Management</span>
                <span className="admin-form-title-text">
                  {editing ? "Edit Establishment" : "Add Establishment"}
                </span>
              </span>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
              </Alert>
            )}

            <div className="admin-form-intro">
              <div className="admin-form-intro-icon">
                <Info size={17} strokeWidth={2.1} />
              </div>
              <div>
                <strong>
                  {editing
                    ? "Update establishment details"
                    : "Create a new establishment"}
                </strong>
                <span>
                  Keep the visitor-facing information clear, complete, and easy to scan.
                </span>
              </div>
            </div>

            {/* =============================================
                BASIC INFORMATION
            ============================================= */}

            <div className="admin-form-section">
              <span className="admin-form-section-icon">
                <FileText size={16} strokeWidth={2.1} />
              </span>
              <span>Basic Information</span>
            </div>

            <Row className="g-3">
              <Col xs={12}>
                <Form.Label className="fw-semibold">Name of Establishment *</Form.Label>
                <Form.Control
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  placeholder="Enter establishment name"
                  disabled={saving}
                />
              </Col>

              <Col xs={12} md={6}>
                <Form.Label className="fw-semibold">Owner</Form.Label>
                <Form.Control
                  value={form.owner}
                  onChange={(event) => updateForm("owner", event.target.value)}
                  placeholder="Owner name"
                  disabled={saving}
                />
              </Col>

              <Col xs={12} md={6}>
                <Form.Label className="fw-semibold">Manager</Form.Label>
                <Form.Control
                  value={form.manager}
                  onChange={(event) => updateForm("manager", event.target.value)}
                  placeholder="Manager name"
                  disabled={saving}
                />
              </Col>

              <Col xs={12}>
                <Form.Label className="fw-semibold">Full Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  value={form.description}
                  onChange={(event) => updateForm("description", event.target.value)}
                  placeholder="Write the complete description of the establishment"
                  disabled={saving}
                />
              </Col>
            </Row>

            {/* =============================================
                VISITOR INFORMATION
            ============================================= */}

            <hr className="my-4" />

            <div className="admin-form-section">
              <span className="admin-form-section-icon">
                <MapPin size={16} strokeWidth={2.1} />
              </span>
              <span>Visitor Information</span>
            </div>

            <Row className="g-3">
              <Col xs={12}>
                <Form.Label className="fw-semibold">Address</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={form.address}
                  onChange={(event) => updateForm("address", event.target.value)}
                  placeholder="Complete address"
                  disabled={saving}
                />
              </Col>
            </Row>

            <div className="admin-location-panel mt-3">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <div className="admin-location-panel-title">
                    <MapPin size={15} strokeWidth={2.1} />
                    Map Location
                  </div>
                  <small>
                    The address above is used to open this establishment in Google Maps — no separate pin needed.
                  </small>
                </div>

                <Button
                  size="sm"
                  variant="outline-primary"
                  className="admin-location-button-inline"
                  disabled={!form.address.trim()}
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        [form.name, form.address].filter(Boolean).join(", ")
                      )}`,
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                >
                  <ExternalLink size={14} strokeWidth={2.1} />
                  Preview on Google Maps
                </Button>
              </div>
            </div>

            {/* =============================================
                CONTACT & PRICING
            ============================================= */}

            <hr className="my-4" />

            <div className="admin-form-section">
              <span className="admin-form-section-icon">
                <Phone size={16} strokeWidth={2.1} />
              </span>
              <span>Contact &amp; Pricing</span>
            </div>

            <Row className="g-3">
              <Col xs={12} md={6}>
                <Form.Label className="fw-semibold">Contact Number</Form.Label>
                <Form.Control
                  value={form.contactNumber}
                  onChange={(event) => updateForm("contactNumber", event.target.value)}
                  placeholder="09XX XXX XXXX"
                  disabled={saving}
                />
              </Col>

              <Col xs={12} md={6}>
                <Form.Label className="fw-semibold">Website</Form.Label>
                <Form.Control
                  value={form.website}
                  onChange={(event) => updateForm("website", event.target.value)}
                  placeholder="https://example.com"
                  disabled={saving}
                />
              </Col>

              <Col xs={12} md={6}>
                <Form.Label className="fw-semibold">Price Range</Form.Label>
                <Form.Control
                  value={form.priceRange}
                  onChange={(event) => updateForm("priceRange", event.target.value)}
                  placeholder="e.g. ₱1,500 – ₱3,000 per night"
                  disabled={saving}
                />
              </Col>
            </Row>

            {/* =============================================
                IMAGES
            ============================================= */}

            <hr className="my-4" />

            <div className="admin-form-section">
              <span className="admin-form-section-icon">
                <ImageIcon size={16} strokeWidth={2.1} />
              </span>
              <span>Images</span>
            </div>

            <div
              className="admin-image-dropzone"
              onClick={() =>
                document.getElementById("accommodationImageInput")?.click()
              }
              style={{
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.65 : 1,
              }}
            >
              <input
                id="accommodationImageInput"
                type="file"
                accept="image/*"
                multiple
                hidden
                disabled={saving}
                onChange={(event) => {
                  const files = Array.from(event.target.files || []) as File[];
                  updateForm("imageFiles", files);
                }}
              />

              <div className="admin-image-dropzone-icon">
                <ImageIcon size={20} strokeWidth={2} />
              </div>

              <div className="admin-image-dropzone-title">Click to upload images</div>
              <div className="admin-image-dropzone-hint">JPG, PNG, GIF, WebP</div>
            </div>

            {imagePreviewUrls.length > 0 && (
              <div className="mt-3">
                <div className="fw-semibold mb-2">New Images</div>

                <Row className="g-2">
                  {imagePreviewUrls.map((url, index) => (
                    <Col xs={6} md={4} lg={3} key={`${url}-${index}`}>
                      <img
                        src={url}
                        alt={`New image ${index + 1}`}
                        style={{
                          width: "100%",
                          height: 110,
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                      <small
                        className="d-block mt-1"
                        style={{
                          fontSize: "0.62rem",
                          color: darkMode ? "#A8AFBF" : "#737886",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={form.imageFiles[index]?.name}
                      >
                        {form.imageFiles[index]?.name}
                      </small>
                    </Col>
                  ))}
                </Row>

                <small
                  className="d-block mt-2"
                  style={{ fontSize: "0.64rem", color: darkMode ? "#A8AFBF" : "#737886" }}
                >
                  {imagePreviewUrls.length} new image
                  {imagePreviewUrls.length !== 1 ? "s" : ""} selected.
                </small>
              </div>
            )}

            <div className="mt-3">
              <Form.Label className="fw-semibold">Existing Image URLs</Form.Label>
              <Form.Control
                value={form.images}
                onChange={(event) => updateForm("images", event.target.value)}
                placeholder="Existing image URLs, separated by commas"
                disabled={saving}
              />
              <small
                className="d-block mt-2"
                style={{ fontSize: "0.64rem", color: darkMode ? "#A8AFBF" : "#737886" }}
              >
                Keep existing image URLs here when editing. New uploaded images will be added to them.
              </small>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={closeForm} disabled={saving}>
              Cancel
            </Button>

            <Button
              variant="primary"
              onClick={() => void handleSave()}
              disabled={saving}
              style={{ minWidth: 150 }}
            >
              {saving ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Saving...
                </>
              ) : editing ? (
                "Update Establishment"
              ) : (
                "Save Establishment"
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminAccommodations;
