
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
  ArrowUpDown,
  Calendar,
  Compass,
  Eye,
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
  subscribeToGuides,
  unsubscribeAll,
  supabase,
} from "../../services/supabase";
import { useDarkMode } from "../../context/DarkModeContext";

/* =========================================================
   TYPES — MATCHES THE GUIDES DATABASE TABLE
========================================================= */

interface Guide {
  id: string;
  name: string;
  phone: string;
  created_at?: string;
  updated_at?: string;
}

interface GuideForm {
  name: string;
  phone: string;
}

const EMPTY_FORM: GuideForm = {
  name: "",
  phone: "",
};

/* =========================================================
   HELPERS
========================================================= */

const normalizeGuide = (raw: any): Guide => ({
  id: String(raw?.id ?? raw?._id ?? ""),
  name: String(raw?.name ?? "").trim(),
  phone: String(raw?.phone ?? "").trim(),
  created_at: raw?.created_at ?? undefined,
  updated_at: raw?.updated_at ?? undefined,
});

const formatDate = (value?: string): string => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getInitials = (name: string): string => {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "?";
};

/* =========================================================
   PAGE STYLES — KEPT INSIDE THIS FILE
========================================================= */

const ADMIN_GUIDES_STYLES = `
  @font-face {
    font-family: "Barabara";
    src: url("/fonts/BARABARA-final.otf") format("opentype");
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  .admin-guides-page {
    --admin-primary: #2D3195;
    --admin-primary-dark: #242879;
    --admin-yellow: #FFB71B;
    --admin-surface: #FFFFFF;
    --admin-border: #E8EAF1;
    --admin-text: #1B1D24;
    --admin-muted: #737886;

    width: 100%;
    min-height: 100vh;
    padding-bottom: 56px;
    color: var(--admin-text);
    font-family: "Nunito", "Poppins", "Segoe UI", sans-serif;
  }

  .admin-guides-page *,
  .admin-guides-page *::before,
  .admin-guides-page *::after {
    box-sizing: border-box;
  }

  .admin-guides-heading {
    align-items: flex-end !important;
    gap: 22px;
    margin-bottom: 26px !important;
  }

  .admin-guides-eyebrow {
    margin-bottom: 5px;
    color: var(--admin-primary);
    font-size: .66rem;
    font-weight: 900;
    letter-spacing: .16em;
    text-transform: uppercase;
  }

  .admin-guides-title {
    margin: 0 !important;
    color: var(--admin-primary) !important;
    font-family: "Barabara", sans-serif !important;
    font-size: clamp(1.65rem, 2.8vw, 2.4rem) !important;
    font-weight: 400 !important;
    line-height: .95 !important;
  }

  .admin-guides-subtitle {
    max-width: 720px;
    margin: 8px 0 0 !important;
    color: var(--admin-muted) !important;
    font-size: .8rem !important;
    font-weight: 600 !important;
    line-height: 1.55 !important;
  }

  .admin-guides-add-button {
    display: inline-flex !important;
    align-items: center;
    gap: 7px;
    min-height: 46px;
    padding: 11px 19px !important;
    border: 0 !important;
    border-radius: 13px !important;
    background: var(--admin-primary) !important;
    color: #fff !important;
    box-shadow: 0 10px 24px rgba(45,49,149,.2);
    font-size: .76rem !important;
    font-weight: 900 !important;
    transition: .2s ease;
  }

  .admin-guides-add-button:hover {
    background: var(--admin-primary-dark) !important;
    transform: translateY(-2px);
  }

  .admin-guides-stats {
    margin-bottom: 24px !important;
  }

  .admin-stat-card {
    position: relative;
    min-height: 130px !important;
    overflow: hidden;
    border: 1px solid var(--admin-border) !important;
    border-radius: 18px !important;
    background: var(--admin-surface) !important;
    color: var(--admin-text) !important;
    box-shadow: 0 7px 24px rgba(26,30,53,.055) !important;
    transition: .25s ease;
  }

  .admin-stat-card::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 4px;
    background: var(--admin-primary);
  }

  .admin-guides-stats > .col:nth-child(2) .admin-stat-card::before {
    background: var(--admin-yellow);
  }

  .admin-guides-stats > .col:nth-child(3) .admin-stat-card::before {
    background: #7076D8;
  }

  .admin-guides-stats > .col:nth-child(4) .admin-stat-card::before {
    background: #5A60B6;
  }

  .admin-stat-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 32px rgba(26,30,53,.1) !important;
  }

  .admin-stat-card .card-body {
    padding: 17px 18px 16px !important;
  }

  .admin-stat-card-top {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .admin-stat-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 10px;
  }

  .admin-stat-icon-blue {
    color: #2D3195;
    background: #eef0ff;
  }

  .admin-stat-icon-yellow {
    color: #9a6900;
    background: #fff5d9;
  }

  .admin-stat-icon-purple {
    color: #5f62b7;
    background: #f0efff;
  }

  .admin-stat-icon-indigo {
    color: #3944a1;
    background: #eceeff;
  }

  .admin-stat-label {
    color: var(--admin-muted);
    font-size: .66rem;
    font-weight: 900;
    letter-spacing: .04em;
    text-transform: uppercase;
  }

  .admin-stat-value {
    margin-top: 11px;
    color: var(--admin-text);
    font-size: 1.95rem;
    font-weight: 800;
    line-height: 1;
  }

  .admin-stat-caption {
    margin-top: 8px;
    color: var(--admin-muted);
    font-size: .62rem;
    font-weight: 600;
  }

  .admin-guides-toolbar,
  .admin-guide-card,
  .admin-guides-loading,
  .admin-guides-empty {
    border: 1px solid var(--admin-border) !important;
    border-radius: 18px !important;
    background: var(--admin-surface) !important;
    box-shadow: 0 8px 26px rgba(26,30,53,.05) !important;
  }

  .admin-guides-toolbar .card-body {
    padding: 19px !important;
  }

  .admin-guides-toolbar-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;
    padding: 14px 16px;
    border: 1px solid rgba(45,49,149,.09);
    border-radius: 14px;
    background: linear-gradient(135deg,#f8f8ff,#fff);
  }

  .admin-filter-heading-main {
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .admin-toolbar-heading-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 11px;
    background: #eef0ff;
    color: #2D3195;
  }

  .admin-guides-toolbar-title {
    margin-bottom: 2px;
    font-size: .86rem;
    font-weight: 800;
  }

  .admin-guides-toolbar-caption {
    color: var(--admin-muted);
    font-size: .66rem;
    font-weight: 600;
  }

  .admin-filter-status-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    border-radius: 999px;
    background: #fff5d9;
    color: #806000;
    font-size: .62rem;
    font-weight: 900;
    white-space: nowrap;
  }

  .admin-filter-group {
    min-height: 44px;
    border-radius: 12px;
  }

  .admin-filter-icon {
    width: 42px;
    justify-content: center;
    border: 1px solid #e1e4ec !important;
    border-right: 0 !important;
    border-radius: 12px 0 0 12px !important;
    background: #f4f5fb !important;
    color: #2D3195 !important;
  }

  .admin-filter-group .form-control,
  .admin-filter-group .form-select {
    min-height: 44px !important;
    border-color: #e1e4ec !important;
    background: #fbfbfd !important;
    color: var(--admin-text) !important;
    box-shadow: none !important;
    border-radius: 0 12px 12px 0 !important;
    font-size: .7rem !important;
    font-weight: 700 !important;
  }

  .admin-filter-group .form-control:focus,
  .admin-filter-group .form-select:focus {
    border-color: rgba(45,49,149,.48) !important;
    box-shadow: 0 0 0 3px rgba(45,49,149,.08) !important;
    background: #fff !important;
  }

  .admin-filter-group .form-control::placeholder {
    color: #A0A5B0 !important;
  }

  .admin-guides-toolbar-footer,
  .admin-guide-card-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .admin-guides-toolbar-footer {
    flex-wrap: wrap;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid #eef0f4;
  }

  .admin-toolbar-result-count {
    color: var(--admin-muted);
    font-size: .66rem;
    font-weight: 700;
  }

  .admin-toolbar-result-count strong {
    color: var(--admin-text);
  }

  .admin-clear-filters {
    display: inline-flex !important;
    align-items: center;
    gap: 5px;
    padding: 0 !important;
    color: #2D3195 !important;
    font-size: .66rem !important;
    font-weight: 800 !important;
  }

  .admin-active-filters {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
    margin-top: 13px;
    padding-top: 12px;
    border-top: 1px dashed #e6e8ef;
  }

  .admin-active-filters-label {
    color: #858B98;
    font-size: .62rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  .admin-filter-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 9px;
    border: 1px solid rgba(45,49,149,.1);
    border-radius: 999px;
    background: #eef0ff;
    color: #2D3195;
    font-size: .61rem;
    font-weight: 800;
  }

  .admin-guides-grid > .col {
    display: flex;
  }

  /* =========================================================
     GUIDE CARDS — LIGHT, WARM, LESS THEME-HEAVY
  ========================================================= */

  .admin-guide-card {
    --guide-accent: #2D3195;
    --guide-soft: #EEF0FF;
    --guide-accent-2: #FFB71B;
    position: relative;
    width: 100%;
    min-height: 100%;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid #E8E9EE !important;
    border-radius: 20px !important;
    background: #FFFFFF !important;
    box-shadow: 0 8px 25px rgba(25, 29, 45, .055) !important;
    animation: adminGuideCardIn .55s ease both;
    transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
  }

  .admin-guide-card::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 3px;
    background: var(--guide-accent-2);
    opacity: .8;
  }

  .admin-guide-card:hover {
    border-color: color-mix(in srgb, var(--guide-accent) 18%, #E8E9EE) !important;
    box-shadow: 0 17px 38px rgba(25, 29, 45, .11) !important;
    transform: translateY(-5px);
  }

  .admin-guide-image-shell {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 142px;
    overflow: hidden;
    border-radius: 20px 20px 0 0;
    background: linear-gradient(135deg, #F7F5EF 0%, #F1F2F5 100%);
  }

  .admin-guide-image-shell::before {
    content: "";
    position: absolute;
    width: 150px;
    height: 150px;
    right: -66px;
    top: -82px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--guide-accent) 8%, transparent);
  }

  .admin-guide-image-shell::after {
    content: "";
    position: absolute;
    width: 105px;
    height: 105px;
    left: -55px;
    bottom: -72px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--guide-accent-2) 12%, transparent);
  }

  .admin-guide-avatar,
  .admin-guide-detail-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-weight: 900;
  }

  .admin-guide-avatar {
    position: relative;
    z-index: 2;
    width: 68px;
    height: 68px;
    border: 5px solid rgba(255,255,255,.92);
    background: var(--guide-soft);
    color: var(--guide-accent);
    box-shadow: 0 7px 18px rgba(25,29,45,.10);
    font-size: 1.22rem;
    letter-spacing: .02em;
  }

  .admin-guide-badge {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 3;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 10px;
    border: 1px solid rgba(255,255,255,.75);
    border-radius: 999px;
    background: rgba(255,255,255,.78);
    color: #515766;
    box-shadow: 0 4px 12px rgba(25,29,45,.05);
    font-size: .61rem;
    font-weight: 900;
    backdrop-filter: blur(8px);
  }

  .admin-guide-badge svg {
    color: var(--guide-accent);
  }

  .admin-guide-card .card-body {
    padding: 17px 17px 18px !important;
  }

  .admin-guide-badge-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }

  .admin-guide-card .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 9px !important;
    border-radius: 999px !important;
    font-size: .58rem !important;
    font-weight: 900 !important;
  }

  .admin-guide-card .admin-guide-primary-badge,
  .admin-guide-card .badge.admin-guide-primary-badge {
    background: #F5EFE4 !important;
    background-color: #F5EFE4 !important;
    color: #6D5B3D !important;
    border: 1px solid #E9DDC9 !important;
  }

  .admin-guide-primary-badge svg {
    color: #A47B35 !important;
  }

  .admin-guide-soft-badge {
    background: #F6F6F4 !important;
    color: #777D89 !important;
    border: 1px solid #ECEDE9;
  }

  .admin-guide-name {
    min-height: 44px;
    margin: 11px 0 7px !important;
    color: var(--admin-text) !important;
    font-size: .96rem !important;
    font-weight: 850 !important;
    line-height: 1.25 !important;
  }

  .admin-guide-phone {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 15px;
    color: #767C89;
    font-size: .72rem;
    font-weight: 750;
  }

  .admin-guide-phone svg {
    flex: 0 0 auto;
    padding: 5px;
    width: 25px;
    height: 25px;
    border-radius: 8px;
    background: #F4F5F2;
    color: #5D6572;
  }

  .admin-guide-card-actions {
    justify-content: stretch;
    margin-top: auto;
    padding-top: 13px;
    border-top: 1px solid #EEF0F2;
  }

  .admin-guide-card-actions .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 36px;
    border-radius: 10px !important;
    font-size: .67rem !important;
    font-weight: 900 !important;
  }

  .admin-edit-button {
    flex: 1 1 auto !important;
  }

  .admin-guide-card-actions .btn-outline-primary {
    border-color: #E2E4E9 !important;
    background: #FAFAF8 !important;
    color: #4E5562 !important;
  }

  .admin-guide-card-actions .btn-outline-primary:hover {
    border-color: color-mix(in srgb, var(--guide-accent) 30%, #E2E4E9) !important;
    background: var(--guide-soft) !important;
    color: var(--guide-accent) !important;
  }

  .admin-guide-card-actions .btn-outline-danger {
    width: 40px;
    min-width: 40px;
    color: #C25B64 !important;
    border-color: #F0D7DA !important;
    background: #FFF9F9 !important;
  }

  .admin-guide-card-actions .btn-outline-danger:hover {
    background: #FFF0F1 !important;
    border-color: #E7B8BD !important;
  }

  .admin-guides-loading,
  .admin-guides-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    padding: 40px 20px;
    text-align: center;
  }

  .admin-loading-icon,
  .admin-empty-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #2D3195;
    background: #eef0ff;
  }

  .admin-loading-icon {
    width: 52px;
    height: 52px;
    border-radius: 15px;
  }

  .admin-empty-icon {
    width: 62px;
    height: 62px;
    border-radius: 18px;
  }

  .admin-loading-title,
  .admin-empty-title {
    margin-top: 13px;
    font-size: .84rem;
    font-weight: 800;
  }

  .admin-loading-subtitle,
  .admin-empty-text {
    margin: 5px 0 0;
    color: var(--admin-muted);
    font-size: .68rem;
    font-weight: 600;
  }

  .admin-guides-modal .modal-content {
    overflow: hidden;
    border: 1px solid var(--admin-border) !important;
    border-radius: 18px !important;
    box-shadow: 0 22px 60px rgba(26,30,53,.18) !important;
  }

  .admin-guides-modal .modal-header {
    padding: 18px 21px !important;
    border-bottom: 0 !important;
    background: #2D3195 !important;
    color: #fff !important;
  }

  .admin-guides-modal .modal-header .btn-close {
    filter: brightness(0) invert(1);
  }

  .admin-modal-title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #fff !important;
    font-size: .98rem !important;
    font-weight: 800 !important;
  }

  .admin-guides-modal .modal-body {
    padding: 22px !important;
    background: var(--admin-surface) !important;
    color: var(--admin-text) !important;
  }

  .admin-guides-modal .modal-footer {
    gap: 8px;
    padding: 12px 20px !important;
    border-top: 1px solid #EEF0F4 !important;
    background: var(--admin-surface) !important;
  }

  .admin-guides-modal .form-label {
    margin-bottom: 6px;
    color: #4e5564 !important;
    font-size: .67rem !important;
    font-weight: 900 !important;
  }

  .admin-guides-modal .form-control {
    min-height: 42px;
    border: 1px solid #e0e3ea !important;
    border-radius: 11px !important;
    font-size: .7rem !important;
    font-weight: 600 !important;
  }

  .admin-guides-modal .form-control:focus {
    border-color: rgba(45,49,149,.52) !important;
    box-shadow: 0 0 0 3px rgba(45,49,149,.08) !important;
  }

  .admin-guides-modal .modal-footer .btn {
    min-height: 39px;
    padding: 8px 15px !important;
    border-radius: 11px !important;
    font-size: .69rem !important;
    font-weight: 900 !important;
  }

  .admin-guides-modal .modal-footer .btn-primary {
    border: 0 !important;
    background: var(--admin-primary) !important;
  }

  .admin-guide-info-box {
    margin-bottom: 10px;
    padding: 12px 14px;
    border: 1px solid var(--admin-border);
    border-radius: 12px;
    background: #FAFAFF;
  }

  .admin-guide-info-box small {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--admin-muted);
    font-size: .63rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  .admin-guide-info-box small svg {
    color: #2D3195;
  }

  .admin-guide-info-box strong {
    display: block;
    margin-top: 4px;
    color: var(--admin-text);
    font-size: .85rem;
    font-weight: 700;
  }

  .admin-guide-detail-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 22px 16px;
    margin-bottom: 18px;
    border-radius: 14px;
    background: linear-gradient(135deg,#2D3195,#242879);
    color: #fff;
    text-align: center;
  }

  .admin-guide-detail-avatar {
    width: 64px;
    height: 64px;
    margin-bottom: 10px;
    font-size: 1.5rem;
  }

  .admin-guide-detail-name {
    font-size: 1rem;
    font-weight: 800;
  }

  .admin-guides-dark {
    --admin-surface: #191C2B;
    --admin-border: #2B3042;
    --admin-text: #F1F3F8;
    --admin-muted: #A8AFBF;
  }

  .admin-guides-dark .admin-stat-card,
  .admin-guides-dark .admin-guides-toolbar,
  .admin-guides-dark .admin-guide-card,
  .admin-guides-dark .admin-guides-loading,
  .admin-guides-dark .admin-guides-empty,
  .admin-guides-dark .modal-content {
    background: #191C2B !important;
    border-color: #2B3042 !important;
  }

  .admin-guides-dark .admin-guides-toolbar-heading {
    background: #202436;
    border-color: #343A4F;
  }

  .admin-guides-dark .admin-filter-group .form-control,
  .admin-guides-dark .admin-filter-group .form-select,
  .admin-guides-dark .admin-guides-modal .form-control {
    background: #202436 !important;
    border-color: #343A4F !important;
    color: #F1F3F8 !important;
  }

  .admin-guides-dark .admin-guides-modal .modal-body,
  .admin-guides-dark .admin-guides-modal .modal-footer {
    background: #191C2B !important;
  }

  .admin-guides-dark .admin-guide-info-box {
    background: #202436 !important;
    border-color: #343A4F !important;
  }

  .admin-guides-dark .admin-guide-card {
    background: #1C1F2A !important;
    border-color: #303544 !important;
  }

  .admin-guides-dark .admin-guide-image-shell {
    background: linear-gradient(135deg, #252936 0%, #20232D 100%);
  }

  .admin-guides-dark .admin-guide-card-actions {
    border-top-color: #303544;
  }

  .admin-guides-dark .admin-guide-phone {
    color: #A8AFBF;
  }

  .admin-guides-dark .admin-guide-phone svg {
    background: #282C38;
    color: #C3C8D2;
  }

  .admin-guides-dark .admin-guide-card-actions .btn-outline-primary {
    background: #242833 !important;
    border-color: #3A4050 !important;
    color: #D2D6DF !important;
  }

  .admin-guides-dark .admin-guide-soft-badge {
    background: #282B35 !important;
    border-color: #363B49 !important;
    color: #AEB4C0 !important;
  }

  @keyframes adminGuideCardIn {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 991.98px) {
    .admin-guides-heading {
      align-items: flex-start !important;
      flex-direction: column;
      gap: 14px;
    }

    .admin-guides-add-button {
      width: 100%;
      justify-content: center;
    }
  }

  @media (max-width: 575.98px) {
    .admin-guides-toolbar-heading {
      align-items: flex-start;
      flex-direction: column;
    }
  }
`;

/* =========================================================
   COMPONENT
========================================================= */

const AdminGuides: React.FC = () => {
  const { darkMode } = useDarkMode();

  const [items, setItems] = useState<Guide[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortOption, setSortOption] = useState<string>("name-asc");

  const [showModal, setShowModal] = useState<boolean>(false);
  const [viewItem, setViewItem] = useState<Guide | null>(null);
  const [editing, setEditing] = useState<Guide | null>(null);

  const [form, setForm] = useState<GuideForm>(EMPTY_FORM);
  const [error, setError] = useState<string>("");
  const [tableError, setTableError] = useState<string>("");

  /* =========================================================
     LOAD GUIDES
  ========================================================= */

  const load = useCallback(async () => {
    setLoading(true);
    setTableError("");

    try {
      const { data, error: supabaseError } = await supabase
        .from("guides")
        .select("id, name, phone, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      const guides = (Array.isArray(data) ? data : [])
        .map(normalizeGuide)
        .filter((guide: Guide) => guide.id && guide.name);

      setItems(guides);
    } catch (err: any) {
      console.error("Failed to load guides:", err);

      setTableError(
        err?.message ||
          "Unable to load tour guides."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();

    subscribeToGuides(() => {
      void load();
    });

    return () => {
      unsubscribeAll();
    };
  }, [load]);

  /* =========================================================
     FILTER AND SORT
  ========================================================= */

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const filtered = items.filter((guide) => {
      if (!query) return true;

      return (
        guide.name.toLowerCase().includes(query) ||
        guide.phone.toLowerCase().includes(query)
      );
    });

    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "name-desc":
          return b.name.localeCompare(a.name);

        case "newest":
          return (
            new Date(b.created_at || b.updated_at || 0).getTime() -
            new Date(a.created_at || a.updated_at || 0).getTime()
          );

        case "oldest":
          return (
            new Date(a.created_at || a.updated_at || 0).getTime() -
            new Date(b.created_at || b.updated_at || 0).getTime()
          );

        case "name-asc":
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [items, searchTerm, sortOption]);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const totalGuides = items.length;

  const guidesWithPhone = items.filter(
    (guide) => guide.phone.trim().length > 0
  ).length;

  const recentlyAdded = items.filter((guide) => {
    const value = guide.created_at || guide.updated_at;

    if (!value) return false;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return false;

    const age = Date.now() - date.getTime();

    return age >= 0 && age <= 30 * 24 * 60 * 60 * 1000;
  }).length;

  /* =========================================================
     MODAL HANDLERS
  ========================================================= */

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setError("");
  };

  const openCreate = () => {
    setViewItem(null);
    resetForm();
    setShowModal(true);
  };

  const openEdit = (guide: Guide) => {
    setViewItem(null);
    setEditing(guide);
    setForm({
      name: guide.name,
      phone: guide.phone,
    });
    setError("");
    setShowModal(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowModal(false);
    resetForm();
  };

  const handleFormChange = (
    field: keyof GuideForm,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  /* =========================================================
     CREATE / UPDATE
  ========================================================= */

  const handleSave = async () => {
    const name = form.name.trim();
    const phone = form.phone.trim();

    if (!name) {
      setError("Tour guide name is required.");
      return;
    }

    if (!phone) {
      setError("Phone number is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload: GuideForm = {
        name,
        phone,
      };

      if (editing) {
        const { error: supabaseError } = await supabase
          .from("guides")
          .update(payload)
          .eq("id", editing.id);

        if (supabaseError) {
          throw new Error(supabaseError.message);
        }
      } else {
        const { error: supabaseError } = await supabase
          .from("guides")
          .insert(payload);

        if (supabaseError) {
          throw new Error(supabaseError.message);
        }
      }

      /*
       * Close and reset the modal directly.
       * This avoids the saving-state issue in closeForm().
       */
      setShowModal(false);
      resetForm();

      await load();
    } catch (err: any) {
      console.error("Failed to save guide:", err);

      setError(
        err?.message ||
          "Failed to save the tour guide."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = async (guide: Guide) => {
    const confirmed = window.confirm(
      `Delete "${guide.name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setTableError("");

      const { error: supabaseError } = await supabase
        .from("guides")
        .delete()
        .eq("id", guide.id);

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      if (viewItem?.id === guide.id) {
        setViewItem(null);
      }

      await load();
    } catch (err: any) {
      console.error("Failed to delete guide:", err);

      setTableError(
        err?.message ||
          `Failed to delete "${guide.name}".`
      );
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <AdminLayout>
      <div
        className={`admin-guides-page ${
          darkMode ? "admin-guides-dark" : ""
        }`}
      >
        <style>{ADMIN_GUIDES_STYLES}</style>

        {/* PAGE HEADER */}

        <div className="admin-guides-heading d-flex justify-content-between">
          <div>
            <div className="admin-guides-eyebrow">
              CONTENT MANAGEMENT
            </div>

            <h2 className="admin-guides-title">TOUR GUIDES</h2>

            <p className="admin-guides-subtitle">
              Manage the registered tour guides available in the
              Calbayog City Tourism directory.
            </p>
          </div>

          <Button
            variant="primary"
            className="admin-guides-add-button"
            onClick={openCreate}
          >
            <Plus size={17} strokeWidth={2.2} />
            <span>Add Guide</span>
          </Button>
        </div>

        {/* STATISTICS */}

        <Row className="g-3 admin-guides-stats">
          <Col xs={12} sm={6} xl={3}>
            <Card
              className="admin-stat-card h-100"
              onClick={() => {
                setSearchTerm("");
                setSortOption("name-asc");
              }}
            >
              <Card.Body>
                <div className="admin-stat-card-top">
                  <span className="admin-stat-icon admin-stat-icon-blue">
                    <Compass size={18} />
                  </span>
                  <span className="admin-stat-label">
                    Total Guides
                  </span>
                </div>

                <div className="admin-stat-value">
                  {totalGuides}
                </div>

                <div className="admin-stat-caption">
                  All registered guides
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} xl={3}>
            <Card className="admin-stat-card h-100">
              <Card.Body>
                <div className="admin-stat-card-top">
                  <span className="admin-stat-icon admin-stat-icon-yellow">
                    <Phone size={18} />
                  </span>
                  <span className="admin-stat-label">
                    With Phone Number
                  </span>
                </div>

                <div className="admin-stat-value">
                  {guidesWithPhone}
                </div>

                <div className="admin-stat-caption">
                  Reachable by phone
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} xl={3}>
            <Card className="admin-stat-card h-100">
              <Card.Body>
                <div className="admin-stat-card-top">
                  <span className="admin-stat-icon admin-stat-icon-purple">
                    <Calendar size={18} />
                  </span>
                  <span className="admin-stat-label">
                    Recently Added
                  </span>
                </div>

                <div className="admin-stat-value">
                  {recentlyAdded}
                </div>

                <div className="admin-stat-caption">
                  Added in the last 30 days
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} xl={3}>
            <Card
              className="admin-stat-card h-100"
              onClick={() => setSearchTerm("")}
            >
              <Card.Body>
                <div className="admin-stat-card-top">
                  <span className="admin-stat-icon admin-stat-icon-indigo">
                    <Eye size={18} />
                  </span>
                  <span className="admin-stat-label">
                    Currently Showing
                  </span>
                </div>

                <div className="admin-stat-value">
                  {filteredItems.length}
                </div>

                <div className="admin-stat-caption">
                  Records matching current filters
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* SEARCH AND SORT */}

        <Card className="admin-guides-toolbar border-0 mb-4">
          <Card.Body>
            <div className="admin-guides-toolbar-heading">
              <div className="admin-filter-heading-main">
                <span className="admin-toolbar-heading-icon">
                  <SlidersHorizontal size={18} />
                </span>

                <div>
                  <div className="admin-guides-toolbar-title">
                    Find a Tour Guide
                  </div>

                  <div className="admin-guides-toolbar-caption">
                    Search and sort your guide records.
                  </div>
                </div>
              </div>

              <div className="admin-filter-status-pill">
                <Search size={13} />
                {filteredItems.length} result
                {filteredItems.length !== 1 ? "s" : ""}
              </div>
            </div>

            <Row className="g-3">
              <Col xs={12} lg={7}>
                <InputGroup className="admin-filter-group">
                  <InputGroup.Text className="admin-filter-icon">
                    <Search size={16} />
                  </InputGroup.Text>

                  <Form.Control
                    value={searchTerm}
                    placeholder="Search name or phone number..."
                    onChange={(event) =>
                      setSearchTerm(event.target.value)
                    }
                  />

                  {searchTerm && (
                    <Button
                      variant="outline-secondary"
                      onClick={() => setSearchTerm("")}
                      aria-label="Clear search"
                    >
                      <X size={16} />
                    </Button>
                  )}
                </InputGroup>
              </Col>

              <Col xs={12} lg={5}>
                <InputGroup className="admin-filter-group">
                  <InputGroup.Text className="admin-filter-icon">
                    <ArrowUpDown size={15} />
                  </InputGroup.Text>

                  <Form.Select
                    value={sortOption}
                    onChange={(event) =>
                      setSortOption(event.target.value)
                    }
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
                <span className="admin-active-filters-label">
                  Active:
                </span>

                <span className="admin-filter-chip">
                  <Search size={11} />
                  “{searchTerm}”
                </span>
              </div>
            )}

            <div className="admin-guides-toolbar-footer">
              <div className="admin-toolbar-result-count">
                Showing <strong>{filteredItems.length}</strong> of{" "}
                {items.length} tour guides
              </div>

              {searchTerm && (
                <Button
                  variant="link"
                  size="sm"
                  className="admin-clear-filters"
                  onClick={() => setSearchTerm("")}
                >
                  <X size={14} />
                  Clear search
                </Button>
              )}
            </div>
          </Card.Body>
        </Card>

        {/* ERROR */}

        {tableError && (
          <Alert
            variant="danger"
            className="mb-4"
            dismissible
            onClose={() => setTableError("")}
          >
            {tableError}
          </Alert>
        )}

        {/* GUIDE LIST */}

        {loading ? (
          <div className="admin-guides-loading">
            <div className="admin-loading-icon">
              <Spinner animation="border" size="sm" />
            </div>

            <div className="admin-loading-title">
              Loading tour guides...
            </div>

            <div className="admin-loading-subtitle">
              Preparing Calbayog City Tourism records.
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="admin-guides-empty">
            <div className="admin-empty-icon">
              <Compass size={30} />
            </div>

            <div className="admin-loading-title">
              {items.length === 0
                ? "No tour guides yet"
                : "No tour guides found"}
            </div>

            <p className="admin-empty-text">
              {items.length === 0
                ? "Add the first tour guide to start building the directory."
                : "Try adjusting your search to find another guide."}
            </p>
          </div>
        ) : (
          <Row className="g-3 g-lg-4 admin-guides-grid">
            {filteredItems.map((guide, index) => (
              <Col xs={12} sm={6} lg={4} xl={3} key={guide.id}>
                <Card
                  className="admin-guide-card h-100 border-0"
                  style={{
                    animationDelay: `${Math.min(index * 55, 440)}ms`,
                    ["--guide-accent" as any]: [
                      "#2D3195",
                      "#0F766E",
                      "#B56A00",
                      "#B85C73",
                    ][index % 4],
                    ["--guide-soft" as any]: [
                      "#EEF0FF",
                      "#E8F6F3",
                      "#FFF4D9",
                      "#FBECEF",
                    ][index % 4],
                    ["--guide-accent-2" as any]: [
                      "#FFB71B",
                      "#67B7A9",
                      "#E6A72A",
                      "#D98A9A",
                    ][index % 4],
                  }}
                  onClick={() => setViewItem(guide)}
                >
                  <div className="admin-guide-image-shell">
                    <div className="admin-guide-avatar">
                      {getInitials(guide.name)}
                    </div>

                    <span className="admin-guide-badge">
                      <Compass size={12} />
                      Guide
                    </span>
                  </div>

                  <Card.Body className="d-flex flex-column">
                    <div className="admin-guide-badge-row">
                      <Badge
                        className="admin-guide-primary-badge"
                        style={{
                          backgroundColor: "#F5EFE4",
                          color: "#6D5B3D",
                          border: "1px solid #E9DDC9",
                        }}
                      >
                        <Compass size={11} color="#A47B35" />
                        Tour Guide
                      </Badge>

                      <span className="admin-guide-soft-badge badge">
                        <Phone size={11} />
                        {guide.phone ? "Phone available" : "No phone"}
                      </span>
                    </div>

                    <h5 className="admin-guide-name">
                      {guide.name}
                    </h5>

                    <div className="admin-guide-phone">
                      <Phone size={13} />
                      <span>{guide.phone}</span>
                    </div>

                    <div
                      className="admin-guide-card-actions"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Button
                        size="sm"
                        variant="outline-primary"
                        className="admin-edit-button"
                        onClick={() => openEdit(guide)}
                      >
                        <Pencil size={14} />
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => void handleDelete(guide)}
                        aria-label={`Delete ${guide.name}`}
                        title="Delete guide"
                      >
                        <Trash2 size={14} />
                        <span className="visually-hidden">
                          Delete
                        </span>
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* VIEW GUIDE MODAL */}

        <Modal
          className="admin-guides-modal"
          show={Boolean(viewItem)}
          onHide={() => setViewItem(null)}
          centered
          size="sm"
        >
          {viewItem && (
            <>
              <Modal.Header closeButton>
                <Modal.Title className="admin-modal-title">
                  <UsersRound size={18} />
                  Tour Guide
                </Modal.Title>
              </Modal.Header>

              <Modal.Body>
                <div className="admin-guide-detail-hero">
                  <div className="admin-guide-detail-avatar">
                    {getInitials(viewItem.name)}
                  </div>

                  <div className="admin-guide-detail-name">
                    {viewItem.name}
                  </div>
                </div>

                <div className="admin-guide-info-box">
                  <small>
                    <Phone size={12} />
                    Phone Number
                  </small>

                  <strong>{viewItem.phone}</strong>
                </div>

                <div className="admin-guide-info-box">
                  <small>
                    <Calendar size={12} />
                    Added
                  </small>

                  <strong>
                    {formatDate(viewItem.created_at)}
                  </strong>
                </div>
              </Modal.Body>

              <Modal.Footer>
                <Button
                  variant="secondary"
                  onClick={() => setViewItem(null)}
                >
                  Close
                </Button>

                <Button
                  variant="primary"
                  onClick={() => {
                    const selectedGuide = viewItem;
                    setViewItem(null);
                    openEdit(selectedGuide);
                  }}
                >
                  <Pencil size={14} className="me-1" />
                  Edit
                </Button>
              </Modal.Footer>
            </>
          )}
        </Modal>

        {/* ADD / EDIT MODAL */}

        <Modal
          className="admin-guides-modal"
          show={showModal}
          onHide={closeForm}
          size="lg"
          centered
          scrollable
        >
          <Modal.Header closeButton={!saving}>
            <Modal.Title className="admin-modal-title">
              <Compass size={18} />
              {editing ? "Edit Tour Guide" : "Add Tour Guide"}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
              </Alert>
            )}

            <Row className="g-3">
              <Col xs={12} md={7}>
                <Form.Label className="fw-semibold">
                  Tour Guide Name *
                </Form.Label>

                <Form.Control
                  value={form.name}
                  placeholder="Enter full name"
                  disabled={saving}
                  autoFocus
                  onChange={(event) =>
                    handleFormChange("name", event.target.value)
                  }
                />
              </Col>

              <Col xs={12} md={5}>
                <Form.Label className="fw-semibold">
                  Phone Number *
                </Form.Label>

                <Form.Control
                  type="tel"
                  value={form.phone}
                  placeholder="e.g. 09554525645"
                  disabled={saving}
                  onChange={(event) =>
                    handleFormChange("phone", event.target.value)
                  }
                />
              </Col>
            </Row>

            <div className="admin-guide-info-box mt-3">
              <small>
                <UsersRound size={12} />
                Tour Guide Directory
              </small>

              <strong style={{ fontWeight: 600, fontSize: ".74rem" }}>
                Only the guide's name and phone number are stored
                in the guides database.
              </strong>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={closeForm}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              onClick={() => void handleSave()}
              disabled={saving}
              style={{ minWidth: 130 }}
            >
              {saving ? (
                <>
                  <Spinner
                    animation="border"
                    size="sm"
                    className="me-2"
                  />
                  Saving...
                </>
              ) : editing ? (
                "Save Changes"
              ) : (
                "Add Guide"
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminGuides;