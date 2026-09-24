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
  Banknote,
  CalendarClock,
  CalendarDays,
  Church,
  Eye,
  FileText,
  Image as ImageIcon,
  Info,
  Landmark,
  Layers3,
  MapPin,
  Music,
  PartyPopper,
  Palette,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Tag,
  Ticket,
  Trash2,
  Trophy,
  UtensilsCrossed,
  X,
  ArrowUpDown,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";

import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  clearCache,
  uploadMultipleImages,
  createNotification,
} from "../../services/api";

import { subscribeToEvents, unsubscribeAll } from "../../services/supabase";

import { Event } from "../../types";
import { useDarkMode } from "../../context/DarkModeContext";

/* =========================================================
   EVENT CATEGORIES
========================================================= */

const CATEGORIES = [
  "Festival",
  "Cultural",
  "Sports",
  "Religious",
  "Food",
  "Music",
  "Arts",
  "Other",
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Festival: PartyPopper,
  Cultural: Landmark,
  Sports: Trophy,
  Religious: Church,
  Food: UtensilsCrossed,
  Music: Music,
  Arts: Palette,
  Other: MapPin,
};

const getCategoryIcon = (category: string): React.ElementType =>
  CATEGORY_ICONS[category] || MapPin;

const CATEGORY_GRADIENT =
  "linear-gradient(135deg, #2D3195 0%, #242879 100%)";

/* =========================================================
   QUICK FILTERS
========================================================= */

type QuickFilter = "all" | "featured" | "upcoming" | "free";

const QUICK_FILTER_LABELS: Record<QuickFilter, string> = {
  all: "All Events",
  featured: "Featured Events",
  upcoming: "Upcoming Events",
  free: "Free Events",
};

/* =========================================================
   EMPTY FORM
========================================================= */

const EMPTY = {
  title: "",
  category: "Festival",
  description: "",
  eventDate: "",
  address: "",
  images: [] as string[],
  isFree: true,
  ticketPrice: "",
  featured: false,
};

const DEFAULT_EVENT_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700">
      <defs>
        <linearGradient id="eventSky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#2D3195"/>
          <stop offset="100%" stop-color="#242879"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="700" fill="url(#eventSky)"/>
      <circle cx="930" cy="150" r="110" fill="rgba(255,255,255,0.10)"/>
      <path d="M0 520 Q300 400 600 500 T1200 480 L1200 700 L0 700 Z" fill="rgba(0,0,0,0.18)"/>
      <text x="600" y="330" text-anchor="middle" font-family="Arial, sans-serif" font-size="72" font-weight="700" fill="white">Calbayog</text>
      <text x="600" y="410" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" fill="rgba(255,255,255,0.8)">Events</text>
    </svg>
  `);

/* =========================================================
   STYLES
========================================================= */

const ADMIN_EVENTS_STYLES = `
  @font-face {
    font-family: "Barabara";
    src: url("/fonts/BARABARA-final.otf") format("opentype");
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  /* Tokens are defined on the page AND on the modal root,
     because react-bootstrap modals render in a portal outside the page. */
  .admin-events-page,
  .admin-events-modal {
    --admin-primary: #2D3195;
    --admin-primary-dark: #242879;
    --admin-yellow: #FFB71B;
    --admin-bg: #F7F8FC;
    --admin-surface: #FFFFFF;
    --admin-surface-alt: #FBFBFD;
    --admin-tile: #EEF0FF;
    --admin-border: #E8EAF1;
    --admin-input-border: #E0E3EB;
    --admin-text: #1B1D24;
    --admin-muted: #737886;
  }

  .admin-events-dark,
  .admin-events-modal.is-dark {
    --admin-bg: #121421;
    --admin-surface: #191C2B;
    --admin-surface-alt: #202436;
    --admin-tile: #262B46;
    --admin-border: #2B3042;
    --admin-input-border: #343A4F;
    --admin-text: #F1F3F8;
    --admin-muted: #A8AFBF;
  }

  .admin-events-page {
    min-height: 100vh;
    width: 100%;
    padding: 0 0 56px;
    background: transparent;
    color: var(--admin-text);
    font-family: "Nunito", "Poppins", "Segoe UI", sans-serif;
  }

  .admin-events-page *,
  .admin-events-page *::before,
  .admin-events-page *::after,
  .admin-events-modal *,
  .admin-events-modal *::before,
  .admin-events-modal *::after {
    box-sizing: border-box;
  }

  .admin-events-page > * {
    animation: adminEventsFade 0.4s ease both;
  }

  /* -------------------------------
     HEADER
  -------------------------------- */

  .admin-events-heading {
    align-items: flex-end !important;
    gap: 24px;
    margin: 0 0 26px !important;
    padding-bottom: 6px;
  }

  .admin-events-eyebrow {
    margin-bottom: 5px;
    color: var(--admin-primary);
    font-size: 0.66rem;
    font-weight: 900;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .admin-events-page .admin-events-title {
    margin: 0;
    color: var(--admin-primary);
    font-family: "Barabara", sans-serif;
    font-size: clamp(1.65rem, 2.8vw, 2.4rem);
    font-weight: 400;
    line-height: 0.95;
    letter-spacing: 0.02em;
  }

  .admin-events-dark .admin-events-title { color: #AEB4FF; }

  .admin-events-page .admin-events-subtitle {
    max-width: 780px;
    margin: 8px 0 0;
    color: var(--admin-muted);
    font-size: 0.8rem;
    font-weight: 600;
    line-height: 1.55;
  }

  .admin-events-add-button {
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
    box-shadow: 0 10px 24px rgba(45, 49, 149, 0.2);
    font-size: 0.76rem !important;
    font-weight: 900 !important;
    transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  }

  .admin-events-add-button:hover,
  .admin-events-add-button:focus {
    background: var(--admin-primary-dark) !important;
    transform: translateY(-2px);
    box-shadow: 0 14px 28px rgba(45, 49, 149, 0.24);
  }

  /* -------------------------------
     STAT CARDS
  -------------------------------- */

  .admin-events-stats { margin-bottom: 24px !important; }

  .admin-events-stats .admin-stat-card {
    position: relative;
    min-height: 132px;
    overflow: hidden;
    border: 1px solid var(--admin-border) !important;
    border-radius: 18px !important;
    background: var(--admin-surface) !important;
    color: var(--admin-text) !important;
    box-shadow: 0 7px 24px rgba(26, 30, 53, 0.055);
    cursor: pointer;
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  }

  .admin-events-stats .admin-stat-card::before {
    content: "";
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 4px;
    background: var(--admin-primary);
  }

  .admin-events-stats > *:nth-child(2) .admin-stat-card::before { background: var(--admin-yellow); }
  .admin-events-stats > *:nth-child(3) .admin-stat-card::before { background: #7076D8; }
  .admin-events-stats > *:nth-child(4) .admin-stat-card::before { background: #5A60B6; }

  .admin-events-stats .admin-stat-card:hover {
    transform: translateY(-3px);
    border-color: rgba(45, 49, 149, 0.16) !important;
    box-shadow: 0 14px 32px rgba(26, 30, 53, 0.1);
  }

  .admin-events-stats .admin-stat-card .card-body { padding: 17px 18px 16px !important; }

  .admin-stat-card-top { display: flex; align-items: center; gap: 9px; }
  .admin-stat-icon { width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; border-radius: 10px; flex: 0 0 auto; }
  .admin-stat-icon-blue { color: #2D3195; background: #eef0ff; }
  .admin-stat-icon-yellow { color: #9a6900; background: #fff5d9; }
  .admin-stat-icon-purple { color: #5f62b7; background: #f0efff; }
  .admin-stat-icon-indigo { color: #3944a1; background: #eceeff; }
  .admin-stat-label { color: var(--admin-muted); font-size: 0.66rem; font-weight: 900; letter-spacing: 0.04em; text-transform: uppercase; }
  .admin-stat-value { margin-top: 11px; color: var(--admin-text); font-family: "Poppins", sans-serif; font-size: 1.95rem; font-weight: 800; line-height: 1; }
  .admin-stat-caption { margin-top: 8px; color: var(--admin-muted); font-size: 0.62rem; font-weight: 600; }

  .admin-events-dark .admin-stat-icon-blue,
  .admin-events-dark .admin-stat-icon-purple,
  .admin-events-dark .admin-stat-icon-indigo { background: #262B46; color: #AEB4FF; }
  .admin-events-dark .admin-stat-icon-yellow { background: #3b3217; color: #ffd86b; }

  /* -------------------------------
     TOOLBAR
  -------------------------------- */

  .admin-events-toolbar {
    border: 1px solid var(--admin-border) !important;
    border-radius: 18px !important;
    background: var(--admin-surface) !important;
    box-shadow: 0 8px 26px rgba(26, 30, 53, 0.05) !important;
  }

  .admin-events-toolbar .card-body { padding: 19px !important; }

  .admin-events-toolbar-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;
    padding: 14px 16px;
    border: 1px solid rgba(45, 49, 149, 0.09);
    border-radius: 14px;
    background: linear-gradient(135deg, #f8f8ff 0%, #ffffff 70%);
  }

  .admin-events-dark .admin-events-toolbar-heading { background: var(--admin-surface-alt); border-color: var(--admin-input-border); }

  .admin-filter-heading-main { display: flex; align-items: center; gap: 11px; }
  .admin-toolbar-heading-icon { width: 38px; height: 38px; flex: 0 0 38px; display: inline-flex; align-items: center; justify-content: center; border-radius: 11px; background: var(--admin-tile); color: #2D3195; }
  .admin-events-dark .admin-toolbar-heading-icon { color: #AEB4FF; }
  .admin-events-toolbar-title { margin: 0 0 2px; color: var(--admin-text); font-family: "Poppins", sans-serif; font-size: 0.86rem; font-weight: 800; }
  .admin-events-toolbar-caption { color: var(--admin-muted); font-size: 0.66rem; font-weight: 600; }
  .admin-filter-status-pill { display: inline-flex; align-items: center; gap: 6px; padding: 7px 10px; border-radius: 999px; background: #fff5d9; color: #806000; font-size: 0.62rem; font-weight: 900; white-space: nowrap; }
  .admin-events-dark .admin-filter-status-pill { background: #3b3217; color: #ffd86b; }

  .admin-filter-group { min-height: 44px; border-radius: 12px; box-shadow: 0 4px 12px rgba(26, 30, 53, 0.035); }
  .admin-filter-group .admin-filter-icon {
    width: 42px;
    justify-content: center;
    border: 1px solid #e1e4ec !important;
    border-right: 0 !important;
    background: #f4f5fb !important;
    color: #2D3195 !important;
    border-radius: 12px 0 0 12px !important;
  }
  .admin-filter-group > .form-control,
  .admin-filter-group > .form-select {
    min-height: 44px !important;
    border: 1px solid #e1e4ec !important;
    border-radius: 0 12px 12px 0 !important;
    background-color: #fbfbfd !important;
    color: var(--admin-text) !important;
    font-size: 0.7rem !important;
    font-weight: 700 !important;
    box-shadow: none !important;
  }
  .admin-filter-group > .form-control { border-radius: 0 !important; border-left: 0 !important; }
  .admin-filter-group > .form-select { border-left: 0 !important; }
  .admin-search-group > .form-control:last-child { border-radius: 0 12px 12px 0 !important; }
  .admin-search-group > .btn {
    min-width: 43px;
    border-radius: 0 12px 12px 0 !important;
    border-color: #e1e4ec !important;
    background: #f8f8ff !important;
    color: #2D3195 !important;
  }
  .admin-filter-group > .form-control:focus,
  .admin-filter-group > .form-select:focus {
    border-color: rgba(45, 49, 149, 0.48) !important;
    box-shadow: 0 0 0 3px rgba(45, 49, 149, 0.08) !important;
    background-color: #fff !important;
  }
  .admin-filter-group:focus-within .admin-filter-icon { border-color: rgba(45, 49, 149, 0.5) !important; background: #eef0ff !important; }
  .admin-filter-group > .form-control::placeholder { color: #A0A5B0 !important; }

  .admin-events-dark .admin-filter-group .admin-filter-icon,
  .admin-events-dark .admin-search-group > .btn { background: #262B46 !important; color: #AEB4FF !important; border-color: #343A4F !important; }
  .admin-events-dark .admin-filter-group > .form-control,
  .admin-events-dark .admin-filter-group > .form-select { background-color: #202436 !important; border-color: #343A4F !important; color: #F1F3F8 !important; }

  .admin-active-filters { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; margin-top: 13px; padding-top: 12px; border-top: 1px dashed var(--admin-border); }
  .admin-active-filters-label { color: var(--admin-muted); font-size: 0.62rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; }
  .admin-filter-chip { display: inline-flex; align-items: center; gap: 5px; padding: 6px 9px; border-radius: 999px; background: #eef0ff; color: #2D3195; border: 1px solid rgba(45, 49, 149, 0.1); font-size: 0.61rem; font-weight: 800; }
  .admin-events-dark .admin-filter-chip { background: #262B46; color: #c9ccff; border-color: #343A4F; }

  .admin-events-toolbar-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--admin-border); }
  .admin-toolbar-result-count { color: var(--admin-muted); font-size: 0.66rem; font-weight: 700; }
  .admin-toolbar-result-count strong { color: var(--admin-text); }
  .admin-toolbar-links { display: inline-flex; align-items: center; gap: 16px; }
  .admin-toolbar-link { display: inline-flex !important; align-items: center; gap: 5px; padding: 0 !important; color: #2D3195 !important; font-size: 0.66rem !important; font-weight: 800 !important; text-decoration: none !important; }
  .admin-events-dark .admin-toolbar-link { color: #AEB4FF !important; }

  /* -------------------------------
     EVENT CARDS
  -------------------------------- */

  .admin-events-grid > * { display: flex; }

  .admin-event-card {
    position: relative;
    width: 100%;
    overflow: hidden;
    border: 1px solid var(--admin-border) !important;
    border-radius: 18px !important;
    background: var(--admin-surface) !important;
    box-shadow: 0 7px 24px rgba(26, 30, 53, 0.06) !important;
    cursor: pointer;
    animation: adminEventCardIn 0.55s ease both;
    transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.25s ease, border-color 0.25s ease;
  }

  .admin-event-card:hover {
    transform: translateY(-5px);
    border-color: rgba(45, 49, 149, 0.17) !important;
    box-shadow: 0 17px 38px rgba(26, 30, 53, 0.11) !important;
  }

  .admin-event-image-shell { position: relative; height: 194px; overflow: hidden; border-radius: 18px 18px 0 0; background: #EEF0FF; }
  .admin-event-card-image { width: 100%; height: 100%; display: block; object-fit: cover; transition: transform 0.65s cubic-bezier(0.2, 0.65, 0.3, 1); }
  .admin-event-card:hover .admin-event-card-image { transform: scale(1.045); }
  .admin-event-image-overlay { position: absolute; inset: auto 0 0; height: 72px; background: linear-gradient(180deg, transparent 0%, rgba(10, 12, 25, 0.38) 100%); pointer-events: none; }

  .admin-event-featured-badge,
  .admin-event-free-badge {
    position: absolute;
    z-index: 3;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 9px;
    border-radius: 999px;
    font-size: 0.61rem;
    font-weight: 900;
    box-shadow: 0 7px 18px rgba(0, 0, 0, 0.11);
  }
  .admin-event-featured-badge { top: 12px; right: 12px; background: rgba(255, 183, 27, 0.95); color: #4D3500; }
  .admin-event-free-badge { right: 11px; bottom: 10px; background: rgba(15, 17, 28, 0.56); color: #fff; backdrop-filter: blur(9px); box-shadow: none; }

  .admin-event-date-chip {
    position: absolute;
    left: 12px;
    bottom: 10px;
    z-index: 3;
    min-width: 50px;
    padding: 6px 8px 5px;
    border-radius: 11px;
    background: rgba(255, 255, 255, 0.96);
    color: #2D3195;
    text-align: center;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16);
  }
  .admin-event-date-month { font-size: 0.58rem; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; }
  .admin-event-date-day { color: #1B1D24; font-family: "Poppins", sans-serif; font-size: 1.12rem; font-weight: 800; line-height: 1.05; }

  .admin-event-card .card-body { display: flex; flex-direction: column; padding: 16px !important; min-height: 190px; }

  .admin-event-badge-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; min-height: 24px; }
  .admin-event-card .badge { display: inline-flex; align-items: center; gap: 5px; border-radius: 999px !important; padding: 5px 9px !important; font-size: 0.58rem !important; font-weight: 900 !important; }
  .admin-event-category-badge { background: #eef0ff !important; color: #2D3195 !important; }
  .admin-event-price-badge { background: #f3f4f8 !important; color: #626978 !important; }
  .admin-event-free-card-badge { background: #e6f6ee !important; color: #157347 !important; }
  .admin-events-dark .admin-event-category-badge { background: #262B46 !important; color: #c9ccff !important; }
  .admin-events-dark .admin-event-price-badge { background: #2B3042 !important; color: #A8AFBF !important; }
  .admin-events-dark .admin-event-free-card-badge { background: #16382b !important; color: #7fe0b0 !important; }

  .admin-event-name {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin: 9px 0 0 !important;
    color: var(--admin-text) !important;
    font-family: "Poppins", sans-serif !important;
    font-size: 0.91rem !important;
    font-weight: 800 !important;
    line-height: 1.3 !important;
  }

  .admin-event-description {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    min-height: 36px;
    overflow: hidden;
    margin: 6px 0 10px;
    color: var(--admin-muted);
    font-size: 0.69rem;
    font-weight: 600;
    line-height: 1.55;
  }

  .admin-event-meta { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
  .admin-event-meta-row { display: flex; align-items: flex-start; gap: 6px; color: #818694; font-size: 0.65rem; font-weight: 700; line-height: 1.45; }
  .admin-event-meta-row svg { flex: 0 0 auto; margin-top: 1px; color: #2D3195; }
  .admin-events-dark .admin-event-meta-row svg { color: #AEB4FF; }
  .admin-event-meta-row span { overflow: hidden; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; }

  .admin-event-card-actions { padding-top: 12px; border-top: 1px solid var(--admin-border); margin-top: auto; }
  .admin-event-card-actions .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 36px; border-radius: 10px !important; font-size: 0.67rem !important; font-weight: 900 !important; transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease; }
  .admin-event-card-actions .admin-edit-button { flex: 1 1 auto; min-width: 0; color: var(--admin-primary) !important; border-color: rgba(45, 49, 149, 0.25) !important; background: #F8F8FF !important; }
  .admin-event-card-actions .admin-edit-button:hover { color: #fff !important; border-color: var(--admin-primary) !important; background: var(--admin-primary) !important; transform: translateY(-1px); box-shadow: 0 7px 16px rgba(45, 49, 149, 0.16); }
  .admin-event-card-actions .admin-delete-button { width: 40px; min-width: 40px; flex: 0 0 40px; padding-left: 0 !important; padding-right: 0 !important; color: #C74350 !important; border-color: rgba(199, 67, 80, 0.2) !important; background: #FFF7F8 !important; }
  .admin-event-card-actions .admin-delete-button:hover { color: #fff !important; border-color: #C74350 !important; background: #C74350 !important; transform: translateY(-1px); }
  .admin-events-dark .admin-event-card-actions .admin-edit-button { background: #202436 !important; color: #c9ccff !important; border-color: #343A4F !important; }
  .admin-events-dark .admin-event-card-actions .admin-delete-button { background: #2b1f26 !important; }

  /* -------------------------------
     LOADING / EMPTY
  -------------------------------- */

  .admin-events-loading,
  .admin-events-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    padding: 40px 20px;
    border: 1px solid var(--admin-border);
    border-radius: 18px;
    background: var(--admin-surface);
    text-align: center;
  }
  .admin-loading-icon, .admin-empty-icon { display: inline-flex; align-items: center; justify-content: center; color: #2D3195; background: var(--admin-tile); }
  .admin-events-dark .admin-loading-icon, .admin-events-dark .admin-empty-icon { color: #AEB4FF; }
  .admin-loading-icon { width: 52px; height: 52px; border-radius: 15px; }
  .admin-empty-icon { width: 62px; height: 62px; border-radius: 18px; }
  .admin-loading-title, .admin-empty-title { margin-top: 13px; color: var(--admin-text); font-family: "Poppins", sans-serif; font-size: 0.84rem; font-weight: 800; }
  .admin-loading-subtitle, .admin-empty-text { margin: 5px 0 0; color: var(--admin-muted); font-size: 0.68rem; font-weight: 600; }
  .admin-empty-button { display: inline-flex !important; align-items: center; gap: 6px; margin-top: 16px; border-color: rgba(45, 49, 149, 0.28) !important; color: #2D3195 !important; border-radius: 10px !important; font-size: 0.68rem !important; font-weight: 800 !important; }
  .admin-events-dark .admin-empty-button { color: #AEB4FF !important; border-color: #343A4F !important; }

  /* -------------------------------
     MODALS
  -------------------------------- */

  .admin-events-modal { font-family: "Nunito", "Poppins", "Segoe UI", sans-serif; }

  .admin-events-modal .modal-content {
    overflow: hidden;
    border: 1px solid var(--admin-border) !important;
    border-radius: 20px !important;
    background: var(--admin-surface) !important;
    color: var(--admin-text) !important;
    box-shadow: 0 22px 60px rgba(26, 30, 53, 0.18) !important;
  }

  .admin-events-modal .modal-header { position: relative; overflow: hidden; min-height: 78px; padding: 16px 20px !important; background: #2D3195 !important; color: #fff !important; border-bottom: 0 !important; }
  .admin-events-modal .modal-header::after { content: ""; position: absolute; width: 170px; height: 170px; right: -55px; top: -75px; border-radius: 50%; background: rgba(255, 255, 255, 0.1); pointer-events: none; }
  .admin-events-modal .modal-header .btn-close { position: relative; z-index: 1; filter: brightness(0) invert(1); opacity: 0.85; }
  .admin-events-modal .modal-body { padding: 22px !important; background: var(--admin-surface) !important; color: var(--admin-text) !important; }
  .admin-events-modal .modal-footer { gap: 8px; padding: 12px 20px !important; border-top: 1px solid var(--admin-border) !important; background: var(--admin-surface) !important; }
  .admin-events-modal .modal-footer .btn { display: inline-flex; align-items: center; gap: 6px; min-height: 38px; border-radius: 10px !important; font-size: 0.68rem !important; font-weight: 800 !important; }
  .admin-events-modal .modal-footer .btn-primary { border: 0 !important; background: var(--admin-primary) !important; color: #fff !important; box-shadow: 0 8px 18px rgba(45, 49, 149, 0.16); }
  .admin-events-modal .modal-footer .btn-primary:hover { background: var(--admin-primary-dark) !important; transform: translateY(-1px); }
  .admin-events-modal .modal-footer .btn-secondary { border-color: var(--admin-input-border) !important; background: transparent !important; color: var(--admin-muted) !important; }
  .admin-events-modal .alert { border: 0 !important; border-radius: 13px !important; font-size: 0.72rem; font-weight: 700; }
  .admin-events-modal hr { margin: 24px 0 !important; border-color: var(--admin-border) !important; opacity: 1; }

  .admin-modal-title { display: inline-flex; align-items: center; gap: 11px; position: relative; z-index: 1; font-family: "Poppins", sans-serif !important; font-weight: 700 !important; }
  .admin-form-title-icon { width: 40px; height: 40px; display: inline-flex; align-items: center; justify-content: center; border-radius: 12px; background: rgba(255, 255, 255, 0.16); border: 1px solid rgba(255, 255, 255, 0.22); }
  .admin-form-title-kicker { display: block; color: rgba(255, 255, 255, 0.72); font-family: "Nunito", sans-serif; font-size: 0.58rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 2px; }
  .admin-form-title-text { display: block; color: #fff; font-family: "Poppins", sans-serif; font-size: 1.05rem; font-weight: 800; }

  .admin-form-intro { display: flex; align-items: center; gap: 11px; padding: 12px 14px; margin-bottom: 20px; border: 1px solid rgba(45, 49, 149, 0.11); border-radius: 13px; background: #f7f7ff; }
  .admin-events-modal.is-dark .admin-form-intro { background: var(--admin-surface-alt); border-color: var(--admin-input-border); }
  .admin-form-intro-icon { width: 34px; height: 34px; flex: 0 0 34px; display: inline-flex; align-items: center; justify-content: center; border-radius: 10px; background: var(--admin-tile); color: #2D3195; }
  .admin-events-modal.is-dark .admin-form-intro-icon,
  .admin-events-modal.is-dark .admin-form-section-icon { color: #AEB4FF; }
  .admin-form-intro strong { display: block; color: #2D3195; font-size: 0.72rem; font-weight: 900; }
  .admin-events-modal.is-dark .admin-form-intro strong { color: #c9ccff; }
  .admin-form-intro span { display: block; margin-top: 2px; color: var(--admin-muted); font-size: 0.63rem; font-weight: 600; }

  .admin-form-section { display: flex; align-items: center; gap: 8px; margin: 4px 0 14px; padding: 10px 12px; border-left: 3px solid #2D3195; border-radius: 0 10px 10px 0; background: rgba(45, 49, 149, 0.055); color: #2D3195; font-family: "Poppins", sans-serif; font-size: 0.78rem; font-weight: 800; }
  .admin-events-modal.is-dark .admin-form-section { background: #262B46; color: #c9ccff; }
  .admin-form-section-icon { width: 27px; height: 27px; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; background: var(--admin-tile); color: #2D3195; }

  .admin-events-modal .form-label { margin-bottom: 6px; color: var(--admin-text); font-size: 0.67rem; font-weight: 900 !important; }
  .admin-events-modal .form-control,
  .admin-events-modal .form-select {
    min-height: 42px;
    border: 1px solid var(--admin-input-border) !important;
    border-radius: 11px !important;
    background-color: var(--admin-surface-alt) !important;
    color: var(--admin-text) !important;
    font-size: 0.72rem !important;
    font-weight: 600 !important;
    box-shadow: none !important;
  }
  .admin-events-modal textarea.form-control { min-height: 96px; resize: vertical; }
  .admin-events-modal .form-control:disabled { opacity: 0.6; cursor: not-allowed; }
  .admin-events-modal .form-control::placeholder { color: #A4A8B2 !important; }
  .admin-events-modal .form-control:focus,
  .admin-events-modal .form-select:focus { border-color: rgba(45, 49, 149, 0.52) !important; box-shadow: 0 0 0 3px rgba(45, 49, 149, 0.08) !important; }
  .admin-events-modal.is-dark input[type="date"] { color-scheme: dark; }

  .admin-image-upload-label { display: inline-flex !important; align-items: center; gap: 6px; color: #2D3195 !important; }
  .admin-events-modal.is-dark .admin-image-upload-label { color: #AEB4FF !important; }
  .admin-form-hint { display: block; margin-top: 8px; color: var(--admin-muted); font-size: 0.65rem; font-weight: 600; }

  .admin-image-preview { position: relative; width: 100%; max-width: 240px; overflow: hidden; border: 1px solid var(--admin-border); border-radius: 12px; background: var(--admin-surface-alt); }
  .admin-image-preview img { width: 100%; height: 130px; display: block; object-fit: cover; }
  .admin-image-remove { position: absolute; top: 6px; right: 6px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border: 0; border-radius: 50%; background: rgba(220, 53, 69, 0.92); color: #fff; cursor: pointer; }
  .admin-image-tag { position: absolute; left: 6px; bottom: 6px; padding: 4px 8px; border-radius: 999px; background: rgba(45, 49, 149, 0.92); color: #fff; font-size: 0.6rem; font-weight: 800; }
  .admin-image-block-title { margin: 18px 0 8px; color: var(--admin-text); font-size: 0.68rem; font-weight: 900; }

  .admin-toggle-card { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid var(--admin-border); border-radius: 13px; background: var(--admin-surface-alt); }
  .admin-toggle-card.is-featured { background: #fff8e1; border-color: #f7e2a3; }
  .admin-events-modal.is-dark .admin-toggle-card.is-featured { background: #2f2a16; border-color: #4a3f1b; }
  .admin-toggle-card .form-check { margin: 0; }
  .admin-toggle-card .form-check-label { color: var(--admin-text); font-size: 0.72rem; font-weight: 800; }
  .admin-toggle-card small { display: block; margin-top: 2px; color: var(--admin-muted); font-size: 0.62rem; font-weight: 600; }

  /* detail view */
  .admin-detail-hero { width: 100%; height: 300px; margin-bottom: 20px; border-radius: 14px; object-fit: cover; }
  .admin-detail-badges { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
  .admin-events-modal .modal-body .badge { display: inline-flex; align-items: center; gap: 5px; border-radius: 999px !important; padding: 6px 10px !important; font-size: 0.6rem !important; font-weight: 900 !important; }
  .admin-detail-description { margin: 0 0 4px; color: var(--admin-muted); font-size: 0.75rem; font-weight: 600; line-height: 1.7; white-space: pre-line; }
  .admin-info-tile { height: 100%; padding: 13px 14px; border: 1px solid var(--admin-border); border-radius: 15px; background: var(--admin-surface); box-shadow: 0 6px 20px rgba(26, 30, 53, 0.055); }
  .admin-info-tile-label { display: inline-flex; align-items: center; gap: 6px; color: var(--admin-muted); font-size: 0.6rem; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; }
  .admin-info-tile-label svg { color: #2D3195; }
  .admin-events-modal.is-dark .admin-info-tile-label svg { color: #AEB4FF; }
  .admin-info-tile-value { margin-top: 6px; color: var(--admin-text); font-size: 0.8rem; font-weight: 800; }

  .admin-detail-thumbs { display: flex; flex-wrap: wrap; gap: 8px; margin: -8px 0 16px; }
  .admin-detail-thumbs img { width: 72px; height: 56px; border-radius: 10px; object-fit: cover; }

  /* list / category modals */
  .admin-category-tile { height: 100%; border: 0 !important; border-radius: 14px !important; background: ${CATEGORY_GRADIENT} !important; color: #fff; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; }
  .admin-category-tile:hover { transform: translateY(-2px); box-shadow: 0 12px 26px rgba(45, 49, 149, 0.22); }
  .admin-category-tile-name { margin-top: 8px; font-size: 0.74rem; font-weight: 800; }
  .admin-category-tile-count { font-family: "Poppins", sans-serif; font-size: 1.5rem; font-weight: 800; }

  .admin-list-item { height: 100%; border: 1px solid var(--admin-border) !important; border-radius: 14px !important; background: var(--admin-surface) !important; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; }
  .admin-list-item:hover { transform: translateY(-2px); box-shadow: 0 12px 26px rgba(26, 30, 53, 0.09); }
  .admin-list-thumb { width: 60px; height: 60px; flex-shrink: 0; border-radius: 10px; object-fit: cover; }
  .admin-list-name { margin: 0 0 6px; overflow: hidden; color: var(--admin-text); font-family: "Poppins", sans-serif; font-size: 0.8rem; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
  .admin-list-copy { min-width: 0; }

  /* -------------------------------
     KEYFRAMES
  -------------------------------- */

  @keyframes adminEventCardIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes adminEventsFade {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .admin-events-page > *,
    .admin-event-card,
    .admin-event-card-image { animation: none !important; transition: none !important; }
  }

  /* -------------------------------
     RESPONSIVE
  -------------------------------- */

  @media (max-width: 991.98px) {
    .admin-events-heading { align-items: flex-start !important; flex-direction: column; gap: 14px; }
    .admin-events-add-button { width: 100%; justify-content: center; }
  }

  @media (max-width: 767.98px) {
    .admin-events-page .admin-events-title { font-size: 1.9rem; }
    .admin-events-toolbar-heading { flex-direction: column; align-items: flex-start; }
    .admin-events-modal .modal-body { padding: 17px !important; }
    .admin-detail-hero { height: 220px; }
  }

  @media (max-width: 479.98px) {
    .admin-events-page .admin-events-title { font-size: 1.8rem; }
  }
`;

/* =========================================================
   DATE HELPERS (module-level, no component state needed)
========================================================= */

/** Parses "YYYY-MM-DD" as a LOCAL date so it never shifts a day. */
const parseDate = (value: string): Date | null => {
  if (!value) return null;

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const parsed = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toDateInput = (date: string) => {
  const parsed = parseDate(date);

  if (!parsed) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;

  return parsed.toISOString().split("T")[0];
};

const fmtDate = (date: string) => {
  const parsed = parseDate(date);

  if (!parsed) return "No date";

  return parsed.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/* DB columns: start_date (exact date) and venue (address). */
const getEventDate = (event: Event): string => {
  const ev = event as any;
  return ev.start_date || ev.startDate || ev.event_date || ev.eventDate || "";
};

const getEventAddress = (event: Event): string => {
  const ev = event as any;
  return ev.venue || ev.address || ev.location_address || "";
};

const getEventImages = (event: Event): string[] => {
  const ev = event as any;

  if (Array.isArray(ev.images)) return ev.images.filter(Boolean);

  if (typeof ev.images === "string" && ev.images.trim()) {
    return ev.images
      .split(",")
      .map((image: string) => image.trim())
      .filter(Boolean);
  }

  return ev.image ? [ev.image] : [];
};

const getEventIsFree = (event: Event): boolean => {
  const ev = event as any;
  return ev.isFree ?? ev.is_free ?? true;
};

const getEventTicketPrice = (event: Event): string => {
  const ev = event as any;
  return String(ev.ticketPrice ?? ev.ticket_price ?? "");
};

const formatPrice = (value: string) => {
  const amount = Number(value);

  return value !== "" && Number.isFinite(amount)
    ? `₱${amount.toLocaleString("en-PH")}`
    : value;
};

const getEventId = (event: Event, fallback = ""): string => {
  const ev = event as any;
  return ev.id || ev._id || fallback;
};

const isUpcoming = (event: Event) => {
  const start = parseDate(getEventDate(event));

  if (!start) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return start >= today;
};

const normalize = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

/* =========================================================
   COMPONENT
========================================================= */

const AdminEvents: React.FC = () => {
  const { darkMode } = useDarkMode();

  const [items, setItems] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);

  const [form, setForm] = useState(EMPTY);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");

  const [viewItem, setViewItem] = useState<Event | null>(null);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortOption, setSortOption] = useState("name-asc");

  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showActiveModal, setShowActiveModal] = useState(false);

  const modalClass = `admin-events-modal ${darkMode ? "is-dark" : ""}`;

  /* =========================================================
     FORM HELPER
  ========================================================= */

  const fc = (field: string, value: unknown) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  /* =========================================================
     LOAD EVENTS
  ========================================================= */

  const load = () => {
    setLoading(true);

    clearCache("/events");

    getEvents()
      .then((response) => {
        setItems(Array.isArray(response.data) ? response.data : []);
      })
      .catch((loadError) => {
        console.error("Failed to load events:", loadError);

        setItems([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  /* =========================================================
     INITIAL LOAD + REALTIME
  ========================================================= */

  useEffect(() => {
    load();

    subscribeToEvents(() => {
      load();
    });

    return () => {
      unsubscribeAll();
    };
  }, []);

  /* =========================================================
     NEW IMAGE PREVIEWS
  ========================================================= */

  useEffect(() => {
    const urls = imageFiles.map((file) => URL.createObjectURL(file));

    setImagePreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageFiles]);

  /* =========================================================
     SEARCH / FILTER / SORT
  ========================================================= */

  const filteredItems = useMemo(() => {
    let filtered: Event[] = Array.isArray(items) ? [...items] : [];

    const search = normalize(searchTerm);

    if (search) {
      const tokens = search.split(/\s+/).filter(Boolean);

      filtered = filtered.filter((event: any) => {
        const searchable = normalize(
          [
            event.title,
            event.category,
            event.description,
            getEventAddress(event),
            getEventTicketPrice(event),
          ]
            .filter(Boolean)
            .join(" "),
        );

        return tokens.every((token) => searchable.includes(token));
      });
    }

    if (categoryFilter !== "All") {
      filtered = filtered.filter(
        (event) => normalize(event.category) === normalize(categoryFilter),
      );
    }

    if (quickFilter === "featured") {
      filtered = filtered.filter((event) => Boolean(event.featured));
    } else if (quickFilter === "upcoming") {
      filtered = filtered.filter(isUpcoming);
    } else if (quickFilter === "free") {
      filtered = filtered.filter(getEventIsFree);
    }

    filtered.sort((a: any, b: any) => {
      const titleA = normalize(a.title);
      const titleB = normalize(b.title);
      const categoryA = normalize(a.category);
      const categoryB = normalize(b.category);
      const dateA = new Date(
        getEventDate(a) || a.created_at || a.createdAt || 0,
      ).getTime();
      const dateB = new Date(
        getEventDate(b) || b.created_at || b.createdAt || 0,
      ).getTime();

      switch (sortOption) {
        case "name-desc":
          return titleB.localeCompare(titleA, undefined, {
            numeric: true,
            sensitivity: "base",
          });

        case "category-asc":
          return (
            categoryA.localeCompare(categoryB, undefined, {
              sensitivity: "base",
            }) ||
            titleA.localeCompare(titleB, undefined, {
              numeric: true,
              sensitivity: "base",
            })
          );

        case "newest":
          return dateB - dateA || titleA.localeCompare(titleB);

        case "oldest":
          return dateA - dateB || titleA.localeCompare(titleB);

        case "name-asc":
        default:
          return titleA.localeCompare(titleB, undefined, {
            numeric: true,
            sensitivity: "base",
          });
      }
    });

    return filtered;
  }, [items, searchTerm, categoryFilter, quickFilter, sortOption]);

  const hasActiveFilters =
    Boolean(searchTerm) || categoryFilter !== "All" || quickFilter !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("All");
    setQuickFilter("all");
  };

  /* =========================================================
     COUNTS
  ========================================================= */

  const featuredCount = useMemo(
    () => items.filter((event) => Boolean(event.featured)).length,
    [items],
  );

  const upcomingCount = useMemo(() => items.filter(isUpcoming).length, [items]);

  /* =========================================================
     OPEN CREATE
  ========================================================= */

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setImageFiles([]);
    setShowModal(true);
  };

  /* =========================================================
     OPEN EDIT
  ========================================================= */

  const openEdit = (event: Event) => {
    const ev = event as any;

    setEditing(event);

    setForm({
      title: ev.title || "",
      category: ev.category || "Festival",
      description: ev.description || "",
      eventDate: toDateInput(getEventDate(event)),
      address: getEventAddress(event),
      images: getEventImages(event),
      isFree: ev.is_free ?? ev.isFree ?? true,
      ticketPrice: String(ev.ticket_price ?? ev.ticketPrice ?? ""),
      featured: ev.featured || false,
    });

    setError("");
    setImageFiles([]);
    setShowModal(true);
  };

  const closeFormModal = () => {
    setShowModal(false);
    setError("");
  };

  /* =========================================================
     SAVE
  ========================================================= */

  const handleSave = async () => {
    if (!form.title || !form.eventDate || !form.address) {
      setError("Title, event date, and address are required.");

      return;
    }

    setSaving(true);
    setError("");

    try {
      let imageUrls: string[] = [...form.images];

      if (imageFiles.length > 0) {
        setUploading(true);

        try {
          const uploadResponse = await uploadMultipleImages(imageFiles);

          const uploadedUrls = Array.isArray(uploadResponse?.data?.urls)
            ? uploadResponse.data.urls
            : [];

          /* Keep existing images and append the newly uploaded ones. */
          imageUrls = Array.from(
            new Set([...imageUrls, ...uploadedUrls].filter(Boolean)),
          );
        } catch (uploadError: any) {
          console.error("Image upload failed:", uploadError);

          setError(
            "Image upload failed. The event will be saved with its existing images.",
          );
        } finally {
          setUploading(false);
        }
      }

      /* ticket_price is numeric in Supabase: strip symbols, send null when free/empty. */
      const priceText = String(form.ticketPrice ?? "").replace(/[^0-9.]/g, "");
      const ticketPriceValue =
        !form.isFree && priceText !== "" && Number.isFinite(Number(priceText))
          ? Number(priceText)
          : null;

      const payload = {
        title: form.title,
        category: form.category,
        description: form.description,
        start_date: form.eventDate,
        venue: form.address,
        images: imageUrls,
        image: imageUrls[0] || "",
        is_free: form.isFree,
        ticket_price: ticketPriceValue,
        featured: form.featured,
      };

      if (editing) {
        await updateEvent(getEventId(editing), payload);
      } else {
        const created = await createEvent(payload);

        const newEventId = created?.data?._id || created?.data?.id;

        try {
          await createNotification({
            userId: "all",
            type: "event_added",
            title: "New Event Added!",
            message: `Don't miss the new event: ${form.title}`,
            data: {
              eventId: newEventId,
              eventTitle: form.title,
              category: form.category,
              eventDate: form.eventDate,
            },
          });
        } catch (notificationError) {
          console.error("Failed to create notification:", notificationError);
        }
      }

      clearCache("/events");

      setShowModal(false);
      setForm(EMPTY);
      setImageFiles([]);

      load();
    } catch (saveError: any) {
      setError(
        saveError?.response?.data?.message ||
          saveError?.response?.data?.details ||
          "Failed to save the event.",
      );
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Delete this event?");

    if (!confirmed) return;

    try {
      await deleteEvent(id);

      clearCache("/events");

      load();
    } catch (deleteError) {
      console.error("Failed to delete event:", deleteError);
    }
  };

  /* =========================================================
     SMALL RENDER HELPERS
  ========================================================= */

  const renderCategoryIcon = (category: string, size: number, strokeWidth = 2) => {
    const Icon = getCategoryIcon(category);

    return <Icon size={size} strokeWidth={strokeWidth} />;
  };

  const renderInfoTile = (
    icon: React.ReactNode,
    label: string,
    value: React.ReactNode,
  ) => (
    <div className="admin-info-tile">
      <div className="admin-info-tile-label">
        {icon}
        {label}
      </div>
      <div className="admin-info-tile-value">{value}</div>
    </div>
  );

  const renderSectionTitle = (icon: React.ReactNode, title: string) => (
    <div className="admin-form-section">
      <span className="admin-form-section-icon">{icon}</span>
      <span>{title}</span>
    </div>
  );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <AdminLayout>
      <div
        className={`admin-events-page ${darkMode ? "admin-events-dark" : ""}`}
      >
        <style>{ADMIN_EVENTS_STYLES}</style>

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="admin-events-heading d-flex justify-content-between">
          <div>
            <div className="admin-events-eyebrow">CONTENT MANAGEMENT</div>

            <h2 className="admin-events-title">EVENTS</h2>

            <p className="admin-events-subtitle">
              Manage Calbayog City Tourism events, schedules, images, and
              featured highlights from one place.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={openCreate}
            className="admin-events-add-button"
          >
            <Plus size={17} strokeWidth={2.2} />
            <span>Add Event</span>
          </Button>
        </div>

        {/* =====================================================
            STATS
        ===================================================== */}

        <Row className="g-3 mb-4 admin-events-stats">
          <Col xs={12} sm={6} xl={3}>
            <Card className="border-0 h-100 admin-stat-card" onClick={clearFilters}>
              <Card.Body>
                <div className="admin-stat-card-top">
                  <span className="admin-stat-icon admin-stat-icon-blue">
                    <CalendarDays size={18} strokeWidth={2} />
                  </span>
                  <span className="admin-stat-label">Total Events</span>
                </div>
                <div className="admin-stat-value">{items.length}</div>
                <div className="admin-stat-caption">All event records</div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} xl={3}>
            <Card
              className="border-0 h-100 admin-stat-card"
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("All");
                setQuickFilter("featured");
              }}
            >
              <Card.Body>
                <div className="admin-stat-card-top">
                  <span className="admin-stat-icon admin-stat-icon-yellow">
                    <Star size={18} strokeWidth={2} />
                  </span>
                  <span className="admin-stat-label">Featured Events</span>
                </div>
                <div className="admin-stat-value">{featuredCount}</div>
                <div className="admin-stat-caption">Highlighted for visitors</div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} xl={3}>
            <Card
              className="border-0 h-100 admin-stat-card"
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("All");
                setQuickFilter("upcoming");
              }}
            >
              <Card.Body>
                <div className="admin-stat-card-top">
                  <span className="admin-stat-icon admin-stat-icon-purple">
                    <CalendarClock size={18} strokeWidth={2} />
                  </span>
                  <span className="admin-stat-label">Upcoming Events</span>
                </div>
                <div className="admin-stat-value">{upcomingCount}</div>
                <div className="admin-stat-caption">Starting today or later</div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} xl={3}>
            <Card
              className="border-0 h-100 admin-stat-card"
              onClick={() => setShowActiveModal(true)}
            >
              <Card.Body>
                <div className="admin-stat-card-top">
                  <span className="admin-stat-icon admin-stat-icon-indigo">
                    <Eye size={18} strokeWidth={2} />
                  </span>
                  <span className="admin-stat-label">Currently Showing</span>
                </div>
                <div className="admin-stat-value">{filteredItems.length}</div>
                <div className="admin-stat-caption">
                  Records matching current filters
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* =====================================================
            SEARCH / FILTER / SORT
        ===================================================== */}

        <Card className="border-0 mb-4 admin-events-toolbar">
          <Card.Body>
            <div className="admin-events-toolbar-heading">
              <div className="admin-filter-heading-main">
                <span className="admin-toolbar-heading-icon">
                  <SlidersHorizontal size={18} strokeWidth={2.1} />
                </span>
                <div>
                  <div className="admin-events-toolbar-title">Find an Event</div>
                  <div className="admin-events-toolbar-caption">
                    Search, filter, and organize your event records.
                  </div>
                </div>
              </div>

              <div className="admin-filter-status-pill">
                <Search size={13} strokeWidth={2.2} />
                {filteredItems.length} result
                {filteredItems.length !== 1 ? "s" : ""}
              </div>
            </div>

            <Row className="g-3">
              <Col xs={12} lg={4}>
                <InputGroup className="admin-filter-group admin-search-group">
                  <InputGroup.Text className="admin-filter-icon">
                    <Search size={16} strokeWidth={2.1} />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search title, category, address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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

              <Col xs={12} sm={6} lg={3}>
                <InputGroup className="admin-filter-group admin-select-group">
                  <InputGroup.Text className="admin-filter-icon">
                    <Layers3 size={15} strokeWidth={2.1} />
                  </InputGroup.Text>
                  <Form.Select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="All">All Categories</option>
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Form.Select>
                </InputGroup>
              </Col>

              <Col xs={12} sm={6} lg={3}>
                <InputGroup className="admin-filter-group admin-select-group">
                  <InputGroup.Text className="admin-filter-icon">
                    <Tag size={15} strokeWidth={2.1} />
                  </InputGroup.Text>
                  <Form.Select
                    value={quickFilter}
                    onChange={(e) => setQuickFilter(e.target.value as QuickFilter)}
                  >
                    {(Object.keys(QUICK_FILTER_LABELS) as QuickFilter[]).map(
                      (key) => (
                        <option key={key} value={key}>
                          {QUICK_FILTER_LABELS[key]}
                        </option>
                      ),
                    )}
                  </Form.Select>
                </InputGroup>
              </Col>

              <Col xs={12} lg={2}>
                <InputGroup className="admin-filter-group admin-select-group">
                  <InputGroup.Text className="admin-filter-icon">
                    <ArrowUpDown size={15} strokeWidth={2.1} />
                  </InputGroup.Text>
                  <Form.Select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                  >
                    <option value="name-asc">A–Z: Name</option>
                    <option value="name-desc">Z–A: Name</option>
                    <option value="category-asc">Category A–Z</option>
                    <option value="newest">Date: Latest First</option>
                    <option value="oldest">Date: Earliest First</option>
                  </Form.Select>
                </InputGroup>
              </Col>
            </Row>

            {hasActiveFilters && (
              <div className="admin-active-filters">
                <span className="admin-active-filters-label">Active:</span>

                {searchTerm && (
                  <span className="admin-filter-chip">
                    <Search size={11} strokeWidth={2.2} />
                    “{searchTerm}”
                  </span>
                )}

                {categoryFilter !== "All" && (
                  <span className="admin-filter-chip">
                    <Layers3 size={11} strokeWidth={2.2} />
                    {categoryFilter}
                  </span>
                )}

                {quickFilter !== "all" && (
                  <span className="admin-filter-chip">
                    <Tag size={11} strokeWidth={2.2} />
                    {QUICK_FILTER_LABELS[quickFilter]}
                  </span>
                )}
              </div>
            )}

            <div className="admin-events-toolbar-footer">
              <div className="admin-toolbar-result-count">
                Showing <strong>{filteredItems.length}</strong> of {items.length}{" "}
                events
              </div>

              <div className="admin-toolbar-links">
                <Button
                  variant="link"
                  size="sm"
                  className="admin-toolbar-link"
                  onClick={() => setShowCategoriesModal(true)}
                >
                  <Layers3 size={14} strokeWidth={2.2} />
                  Browse categories
                </Button>

                {hasActiveFilters && (
                  <Button
                    variant="link"
                    size="sm"
                    className="admin-toolbar-link"
                    onClick={clearFilters}
                  >
                    <X size={14} strokeWidth={2.2} />
                    Clear filters
                  </Button>
                )}
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* =====================================================
            EVENT CARDS
        ===================================================== */}

        {loading ? (
          <div className="admin-events-loading">
            <div className="admin-loading-icon">
              <Spinner animation="border" size="sm" />
            </div>
            <div className="admin-loading-title">Loading events...</div>
            <div className="admin-loading-subtitle">
              Preparing Calbayog City Tourism records.
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="admin-events-empty">
            <div className="admin-empty-icon">
              <CalendarDays size={30} strokeWidth={1.7} />
            </div>
            <div className="admin-empty-title">No events found</div>
            <p className="admin-empty-text">
              Try adjusting your search or filters to find another event.
            </p>
            <Button
              variant="outline-primary"
              className="admin-empty-button"
              onClick={clearFilters}
            >
              <Layers3 size={15} strokeWidth={2} />
              View all events
            </Button>
          </div>
        ) : (
          <Row className="g-3 g-lg-4 admin-events-grid">
            {filteredItems.map((event: any, index: number) => {
              const eventId = getEventId(event, `event-${index}`);
              const startDate = getEventDate(event);
              const address = getEventAddress(event);
              const isFree = getEventIsFree(event);
              const ticketPrice = getEventTicketPrice(event);
              const start = parseDate(startDate);

              return (
                <Col xs={12} sm={6} lg={4} xl={3} key={eventId}>
                  <Card
                    className="h-100 border-0 admin-event-card"
                    style={{ animationDelay: `${Math.min(index * 55, 440)}ms` }}
                    onClick={() => setViewItem(event)}
                  >
                    <div className="admin-event-image-shell">
                      <img
                        src={getEventImages(event)[0] || DEFAULT_EVENT_IMAGE}
                        alt={event.title || "Tourism event"}
                        className="admin-event-card-image"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_EVENT_IMAGE;
                        }}
                      />
                      <div className="admin-event-image-overlay" />

                      {event.featured && (
                        <span className="admin-event-featured-badge">
                          <Star size={12} strokeWidth={2.2} />
                          Featured
                        </span>
                      )}

                      {start && (
                        <div className="admin-event-date-chip">
                          <div className="admin-event-date-month">
                            {start.toLocaleDateString("en-US", { month: "short" })}
                          </div>
                          <div className="admin-event-date-day">
                            {start.getDate()}
                          </div>
                        </div>
                      )}

                      {isFree && (
                        <span className="admin-event-free-badge">
                          <Ticket size={13} strokeWidth={2} />
                          Free Entry
                        </span>
                      )}
                    </div>

                    <Card.Body>
                      <div className="admin-event-badge-row">
                        <Badge className="admin-event-category-badge">
                          {renderCategoryIcon(event.category, 11, 2.2)}
                          {event.category || "Other"}
                        </Badge>

                        {!isFree && ticketPrice && (
                          <Badge className="admin-event-price-badge">
                            {formatPrice(ticketPrice)}
                          </Badge>
                        )}
                      </div>

                      <h5 className="admin-event-name">
                        {event.title || "Untitled Event"}
                      </h5>

                      {event.description && (
                        <p className="admin-event-description">
                          {event.description}
                        </p>
                      )}

                      <div className="admin-event-meta">
                        {startDate && (
                          <div className="admin-event-meta-row">
                            <CalendarDays size={14} strokeWidth={2} />
                            <span>
                              {fmtDate(startDate)}
                            </span>
                          </div>
                        )}

                        <div className="admin-event-meta-row">
                          <MapPin size={14} strokeWidth={2} />
                          <span>{address || "Address not specified"}</span>
                        </div>
                      </div>

                      <div
                        className="d-flex gap-2 mt-auto admin-event-card-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => openEdit(event)}
                          className="admin-edit-button"
                        >
                          <Pencil size={14} strokeWidth={2} />
                          Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDelete(getEventId(event))}
                          className="admin-delete-button"
                          aria-label={`Delete ${event.title || "event"}`}
                          title="Delete event"
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
            ADD / EDIT MODAL
        ===================================================== */}

        <Modal
          className={modalClass}
          show={showModal}
          onHide={closeFormModal}
          size="lg"
          centered
          scrollable
          fullscreen="sm-down"
        >
          <Modal.Header closeButton>
            <Modal.Title className="admin-modal-title">
              <span className="admin-form-title-icon">
                {renderCategoryIcon(form.category, 20)}
              </span>
              <span>
                <span className="admin-form-title-kicker">Event Management</span>
                <span className="admin-form-title-text">
                  {editing ? "Edit Event" : "Add Event"}
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
                  {editing ? "Update event details" : "Create a new event"}
                </strong>
                <span>
                  Keep the visitor-facing information clear, complete, and easy
                  to scan.
                </span>
              </div>
            </div>

            {/* BASIC INFORMATION */}
            {renderSectionTitle(
              <FileText size={16} strokeWidth={2.1} />,
              "Basic Information",
            )}

            <Row className="g-3">
              <Col xs={12} md={8}>
                <Form.Label>Event Title *</Form.Label>
                <Form.Control
                  value={form.title}
                  onChange={(e) => fc("title", e.target.value)}
                  placeholder="Enter event title"
                />
              </Col>

              <Col xs={12} md={4}>
                <Form.Label>Category</Form.Label>
                <Form.Select
                  value={form.category}
                  onChange={(e) => fc("category", e.target.value)}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col xs={12}>
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={form.description}
                  onChange={(e) => fc("description", e.target.value)}
                  placeholder="Describe the event..."
                />
              </Col>
            </Row>

            {/* DATE & LOCATION */}
            <hr />

            {renderSectionTitle(
              <CalendarDays size={16} strokeWidth={2.1} />,
              "Date & Location",
            )}

            <Row className="g-3">
              <Col xs={12} md={5}>
                <Form.Label>Event Date *</Form.Label>
                <Form.Control
                  type="date"
                  value={form.eventDate}
                  onChange={(e) => fc("eventDate", e.target.value)}
                />
              </Col>

              <Col xs={12} md={7}>
                <Form.Label>Address *</Form.Label>
                <Form.Control
                  value={form.address}
                  onChange={(e) => fc("address", e.target.value)}
                  placeholder="Enter the event address"
                />
              </Col>
            </Row>

            {/* IMAGES */}
            <hr />

            {renderSectionTitle(
              <ImageIcon size={16} strokeWidth={2.1} />,
              "Event Images",
            )}

            <Form.Label className="admin-image-upload-label">
              <ImageIcon size={14} strokeWidth={2} />
              Add Images
            </Form.Label>

            <Form.Control
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => {
                const target = e.target as HTMLInputElement;

                setImageFiles(Array.from(target.files || []));
              }}
            />

            <small className="admin-form-hint">
              You can select one or multiple images at once. The first image is
              used as the main image.
            </small>

            {form.images.length > 0 && (
              <>
                <div className="admin-image-block-title">Current Images</div>
                <Row className="g-2">
                  {form.images.map((image, index) => (
                    <Col xs={6} md={4} key={`${image}-${index}`}>
                      <div className="admin-image-preview">
                        <img
                          src={image}
                          alt={`Current event image ${index + 1}`}
                          onError={(e) => {
                            e.currentTarget.style.opacity = "0.35";
                          }}
                        />
                        <button
                          type="button"
                          className="admin-image-remove"
                          onClick={() =>
                            fc(
                              "images",
                              form.images.filter((_, i) => i !== index),
                            )
                          }
                          aria-label={`Remove image ${index + 1}`}
                        >
                          <X size={14} strokeWidth={2.4} />
                        </button>
                        {index === 0 && (
                          <span className="admin-image-tag">Main Image</span>
                        )}
                      </div>
                    </Col>
                  ))}
                </Row>
              </>
            )}

            {imageFiles.length > 0 && (
              <>
                <div className="admin-image-block-title">New Images</div>
                <Row className="g-2">
                  {imagePreviewUrls.map((preview, index) => (
                    <Col xs={6} md={4} key={`${preview}-${index}`}>
                      <div className="admin-image-preview">
                        <img src={preview} alt={`New event image ${index + 1}`} />
                        <button
                          type="button"
                          className="admin-image-remove"
                          onClick={() =>
                            setImageFiles((files) =>
                              files.filter((_, i) => i !== index),
                            )
                          }
                          aria-label={`Remove new image ${index + 1}`}
                        >
                          <X size={14} strokeWidth={2.4} />
                        </button>
                      </div>
                      <small
                        className="admin-form-hint"
                        title={imageFiles[index]?.name}
                      >
                        {imageFiles[index]?.name}
                      </small>
                    </Col>
                  ))}
                </Row>
              </>
            )}

            {/* ADMISSION */}
            <hr />

            {renderSectionTitle(
              <Ticket size={16} strokeWidth={2.1} />,
              "Admission & Visibility",
            )}

            <Row className="g-3">
              <Col xs={12} md={6}>
                <div className="admin-toggle-card h-100">
                  <Form.Check
                    type="checkbox"
                    id="event-free-entry"
                    label="Free Entry"
                    checked={Boolean(form.isFree)}
                    onChange={(e) => fc("isFree", e.target.checked)}
                  />
                </div>
              </Col>

              <Col xs={12} md={6}>
                <Form.Label>Ticket Price (₱)</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.ticketPrice}
                  onChange={(e) => fc("ticketPrice", e.target.value)}
                  disabled={form.isFree}
                  placeholder="e.g. 100"
                />
              </Col>

              <Col xs={12}>
                <div className="admin-toggle-card is-featured">
                  <Star size={18} strokeWidth={2} color="#B7791F" />
                  <div>
                    <Form.Check
                      type="checkbox"
                      id="event-featured"
                      label="Mark as Featured Event"
                      checked={Boolean(form.featured)}
                      onChange={(e) => fc("featured", e.target.checked)}
                    />
                    <small>Featured events are highlighted for visitors.</small>
                  </div>
                </div>
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={closeFormModal}>
              Cancel
            </Button>

            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving || uploading}
            >
              {uploading
                ? "Uploading Image..."
                : saving
                  ? "Saving..."
                  : editing
                    ? "Save Changes"
                    : "Save Event"}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* =====================================================
            EVENT DETAILS MODAL
        ===================================================== */}

        {viewItem && (
          <Modal
            className={modalClass}
            show={!!viewItem}
            onHide={() => setViewItem(null)}
            size="lg"
            centered
            scrollable
            fullscreen="sm-down"
          >
            <Modal.Header closeButton>
              <Modal.Title className="admin-modal-title">
                <span className="admin-form-title-icon">
                  {renderCategoryIcon(viewItem.category, 20)}
                </span>
                <span>
                  <span className="admin-form-title-kicker">Event Details</span>
                  <span className="admin-form-title-text">{viewItem.title}</span>
                </span>
              </Modal.Title>
            </Modal.Header>

            <Modal.Body>
              {getEventImages(viewItem).length > 0 && (
                <>
                  <img
                    className="admin-detail-hero"
                    src={getEventImages(viewItem)[0]}
                    alt={viewItem.title}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_EVENT_IMAGE;
                    }}
                  />

                  {getEventImages(viewItem).length > 1 && (
                    <div className="admin-detail-thumbs">
                      {getEventImages(viewItem)
                        .slice(1)
                        .map((image, index) => (
                          <img
                            key={`${image}-${index}`}
                            src={image}
                            alt={`${viewItem.title} ${index + 2}`}
                          />
                        ))}
                    </div>
                  )}
                </>
              )}

              <div className="admin-detail-badges">
                <Badge className="admin-event-category-badge">
                  {renderCategoryIcon(viewItem.category, 12, 2.2)}
                  {viewItem.category}
                </Badge>

                {viewItem.featured && (
                  <Badge style={{ background: "#FFB71B", color: "#4D3500" }}>
                    <Star size={12} strokeWidth={2.2} />
                    Featured
                  </Badge>
                )}

                {getEventIsFree(viewItem) && (
                  <Badge className="admin-event-free-card-badge">
                    <Ticket size={12} strokeWidth={2.2} />
                    Free Entry
                  </Badge>
                )}
              </div>

              {viewItem.description && (
                <p className="admin-detail-description">{viewItem.description}</p>
              )}

              <Row className="g-3 mt-1">
                <Col xs={12} md={6}>
                  {renderInfoTile(
                    <CalendarDays size={13} strokeWidth={2.2} />,
                    "Event Date",
                    fmtDate(getEventDate(viewItem)),
                  )}
                </Col>

                <Col xs={12} md={6}>
                  {renderInfoTile(
                    <MapPin size={13} strokeWidth={2.2} />,
                    "Address",
                    getEventAddress(viewItem) || "Address not specified",
                  )}
                </Col>

                {!getEventIsFree(viewItem) && getEventTicketPrice(viewItem) && (
                  <Col xs={12} md={6}>
                    {renderInfoTile(
                      <Banknote size={13} strokeWidth={2.2} />,
                      "Ticket Price",
                      formatPrice(getEventTicketPrice(viewItem)),
                    )}
                  </Col>
                )}
              </Row>
            </Modal.Body>

            <Modal.Footer>
              <Button variant="secondary" onClick={() => setViewItem(null)}>
                Close
              </Button>

              <Button
                variant="primary"
                onClick={() => {
                  const target = viewItem;

                  setViewItem(null);
                  openEdit(target);
                }}
              >
                <Pencil size={14} strokeWidth={2} />
                Edit Event
              </Button>
            </Modal.Footer>
          </Modal>
        )}

        {/* =====================================================
            CATEGORIES MODAL
        ===================================================== */}

        <Modal
          className={modalClass}
          show={showCategoriesModal}
          onHide={() => setShowCategoriesModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title className="admin-modal-title">
              <span className="admin-form-title-icon">
                <Layers3 size={20} strokeWidth={2} />
              </span>
              <span>
                <span className="admin-form-title-kicker">Browse</span>
                <span className="admin-form-title-text">Event Categories</span>
              </span>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Row className="g-3">
              {CATEGORIES.map((category) => {
                const count = items.filter(
                  (event: any) => event.category === category,
                ).length;

                return (
                  <Col xs={6} key={category}>
                    <Card
                      className="admin-category-tile"
                      onClick={() => {
                        setCategoryFilter(category);
                        setShowCategoriesModal(false);
                      }}
                    >
                      <Card.Body className="text-center">
                        {renderCategoryIcon(category, 29, 1.7)}
                        <div className="admin-category-tile-name">{category}</div>
                        <div className="admin-category-tile-count">{count}</div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowCategoriesModal(false)}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* =====================================================
            CURRENTLY SHOWING MODAL
        ===================================================== */}

        <Modal
          className={modalClass}
          show={showActiveModal}
          onHide={() => setShowActiveModal(false)}
          size="lg"
          centered
          scrollable
        >
          <Modal.Header closeButton>
            <Modal.Title className="admin-modal-title">
              <span className="admin-form-title-icon">
                <Eye size={20} strokeWidth={2} />
              </span>
              <span>
                <span className="admin-form-title-kicker">Current results</span>
                <span className="admin-form-title-text">Currently Showing</span>
              </span>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Row className="g-3">
              {filteredItems.map((event: any, index: number) => (
                <Col xs={12} sm={6} key={getEventId(event, `event-${index}`)}>
                  <Card
                    className="admin-list-item"
                    onClick={() => {
                      setViewItem(event);
                      setShowActiveModal(false);
                    }}
                  >
                    <Card.Body>
                      <div className="d-flex align-items-center gap-3">
                        <img
                          className="admin-list-thumb"
                          src={getEventImages(event)[0] || DEFAULT_EVENT_IMAGE}
                          alt={event.title || ""}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = DEFAULT_EVENT_IMAGE;
                          }}
                        />

                        <div className="admin-list-copy">
                          <h6 className="admin-list-name">{event.title}</h6>
                          <Badge className="admin-event-category-badge">
                            {renderCategoryIcon(event.category, 11, 2.2)}
                            {event.category}
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
                <div
                  className="admin-empty-icon"
                  style={{ margin: "0 auto 12px" }}
                >
                  <CalendarDays size={29} strokeWidth={1.7} />
                </div>
                <p className="admin-empty-text">No events found.</p>
              </div>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowActiveModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminEvents;
