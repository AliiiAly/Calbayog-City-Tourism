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
  Activity,
  ArrowUpDown,
  Building2,
  Check,
  Clock3,
  Eye,
  Factory,
  FileText,
  Globe2,
  Home,
  Image as ImageIcon,
  Info,
  Landmark,
  Layers3,
  Leaf,
  Mail,
  MapPin,
  MapPinned,
  Navigation,
  Pencil,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Smartphone,
  Sun,
  Tag,
  Ticket,
  Trash2,
  UsersRound,
  Wifi,
  X,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";

import {
  getAttractions,
  createAttraction,
  updateAttraction,
  deleteAttraction,
  clearCache,
  uploadMultipleImages,
  createNotification,
} from "../../services/api";

import { subscribeToTable, unsubscribeAll } from "../../services/supabase";

import { Destination } from "../../types";

// Compatibility alias: the database table is now public.attractions.
type Attraction = Destination;

import { useDarkMode } from "../../context/DarkModeContext";

const CALBAYOG_BLUE = "#2D3195";
const ADMIN_YELLOW = "#FFB71B";

/* =========================================================
   MAIN DESTINATION CATEGORIES
========================================================= */

const CATEGORIES = [
  "Nature",
  "History and Culture",
  "Industrial Tourism",
  "Shopping",
  "Other",
];

/* =========================================================
   ATTRACTION TYPES

   "Other" is available under EVERY category.
========================================================= */

const ATTRACTION_TYPES: Record<string, string[]> = {
  Nature: [
    "Waterfalls",
    "Beaches",
    "Caves",
    "Hot Springs",
    "Rivers",
    "Dive Sites",
    "Other",
  ],

  "History and Culture": [
    "Churches",
    "Museums",
    "Historic Buildings",
    "Monuments",
    "Parks",
    "Other",
  ],

  "Industrial Tourism": ["Factories", "Farms", "Production Sites", "Other"],

  Shopping: ["Markets", "Malls", "Local Craft Centers", "Other"],

  Other: ["Other"],
};

/* =========================================================
   CATEGORY DESIGN
========================================================= */

const CATEGORY_DESIGNS: Record<
  string,
  {
    icon: string;
    color: string;
    gradient: string;
    bgPattern: string;
  }
> = {
  Nature: {
    icon: "🌿",
    color: "#1a5f4a",
    gradient: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
    bgPattern:
      "linear-gradient(135deg, rgba(26,95,74,0.05), rgba(13,61,46,0.02))",
  },

  "History and Culture": {
    icon: "🏛️",
    color: "#1a5f4a",
    gradient: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
    bgPattern:
      "linear-gradient(135deg, rgba(26,95,74,0.05), rgba(13,61,46,0.02))",
  },

  "Industrial Tourism": {
    icon: "🏭",
    color: "#1a5f4a",
    gradient: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
    bgPattern:
      "linear-gradient(135deg, rgba(26,95,74,0.05), rgba(13,61,46,0.02))",
  },

  Shopping: {
    icon: "🛍️",
    color: "#1a5f4a",
    gradient: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
    bgPattern:
      "linear-gradient(135deg, rgba(26,95,74,0.05), rgba(13,61,46,0.02))",
  },

  Other: {
    icon: "📍",
    color: "#1a5f4a",
    gradient: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
    bgPattern:
      "linear-gradient(135deg, rgba(26,95,74,0.05), rgba(13,61,46,0.02))",
  },
};

/* =========================================================
   LUCIDE CATEGORY ICONS
========================================================= */

const CATEGORY_ICONS = {
  Nature: Leaf,
  "History and Culture": Landmark,
  "Industrial Tourism": Factory,
  Shopping: ShoppingBag,
  Other: MapPin,
};

const getCategoryIcon = (category: string) =>
  CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || MapPin;

/* =========================================================
   DEVELOPMENT / MANAGEMENT / CONNECTIVITY OPTIONS
========================================================= */

const DEVELOPMENT_LEVELS = ["Potential", "Emerging", "Existing", "Not Stated"];

const MGT_OPTIONS = [
  "Government Operated",
  "Private Operator",
  "Public Area - No operating centralized management",
  "Non-Government Organization",
  "Not Stated",
];

const ONLINE_CONNECTIVITY_OPTIONS = [
  "No Signal",
  "3G",
  "4G",
  "5G",
  "Not Stated",
];

/* =========================================================
   EMPTY FORM
========================================================= */

const buildGoogleMapsDirectionsUrl = (
  attraction: Partial<Attraction> | null | undefined,
): string => {
  if (!attraction) return "";

  const name = String((attraction as any).name || "").trim();
  const address = String((attraction as any).location_address || "").trim();

  const destination = [name, address, "Calbayog City, Samar, Philippines"]
    .filter(Boolean)
    .join(", ");

  if (!destination) return "";

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
};

const EMPTY_FORM = {
  name: "",

  category: "Nature",

  attraction_type: "Waterfalls",

  other_attraction_type: "",

  description: "",

  short_description: "",

  /* LOCATION / BASIC DETAILS */
  location_address: "",

  /* IMAGES */
  images: "",

  /* GENERAL */
  entrance_fee: "",
  operational_hours: "",
  best_time_to_visit: "",
  website: "",
  attractions: "",
  things_to_do: "",

  tags: "",

  /* TOURISM INFORMATION */
  development_level: "",
  online_connectivity: "",
  mgt: "",

  /* CONTACT */
  mobile: "",
  contact_person: "",

  show_on_welcome: false,

  /* NATURE */
  waterfall_height: "",
  swimming_allowed: false,
  trekking_difficulty: "",
  beach_type: "",
  best_season: "",
  activities_allowed: "",

  /* HISTORY AND CULTURE */
  historical_period: "",
  significance: "",

  /* INDUSTRIAL */
  industrial_activity: "",
  production_process: "",
  visitor_access: "",

  /* SHOPPING */
  products_available: "",
  local_products: "",
};

const DEFAULT_TOURISM_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%231a5f4a'/%3E%3Cstop offset='100%25' stop-color='%230d3d2e'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='500' fill='url(%23g)'/%3E%3Ccircle cx='690' cy='95' r='110' fill='rgba(255,255,255,0.08)'/%3E%3Cpath d='M-20 360 Q180 250 390 340 T820 350 L820 500 L-20 500 Z' fill='rgba(0,0,0,0.18)'/%3E%3Ctext x='400' y='210' text-anchor='middle' font-size='62' font-family='Arial, sans-serif' font-weight='700' fill='white'%3ECalbayog%3C/text%3E%3Ctext x='400' y='278' text-anchor='middle' font-size='30' font-family='Arial, sans-serif' fill='rgba(255,255,255,0.8)'%3ETourism%3C/text%3E%3C/svg%3E";

const DESTINATION_CARD_ANIMATION = `
  @keyframes destinationCardPulse {
    0% {
      transform: translateY(0);
      box-shadow: 0 8px 24px rgba(26, 95, 74, 0.12);
    }
    50% {
      transform: translateY(-2px);
      box-shadow: 0 16px 28px rgba(26, 95, 74, 0.18);
    }
    100% {
      transform: translateY(0);
      box-shadow: 0 8px 24px rgba(26, 95, 74, 0.12);
    }
  }

  .destination-card-animate {
    animation: destinationCardPulse 0.45s ease-out;
  }
`;

const ADMIN_ATTRACTIONS_STYLES = `
  @font-face {
    font-family: "Barabara";
    src: url("/fonts/BARABARA-final.otf") format("opentype");
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  .admin-attractions-page {
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
    font-family:
      "Nunito",
      "Poppins",
      "Segoe UI",
      sans-serif;
  }

  .admin-attractions-page *,
  .admin-attractions-page *::before,
  .admin-attractions-page *::after {
    box-sizing: border-box;
  }

  .admin-attractions-heading {
    align-items: flex-end !important;
    gap: 24px;
    margin-bottom: 26px !important;
    padding-bottom: 6px;
  }

  .admin-attractions-eyebrow {
    margin-bottom: 5px;
    color: var(--admin-primary);
    font-family: "Nunito", sans-serif;
    font-size: 0.66rem;
    font-weight: 900;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .admin-attractions-title {
    margin: 0 !important;
    color: var(--admin-primary) !important;
    font-family: "Barabara", sans-serif !important;
    font-size: clamp(1.65rem, 2.8vw, 2.4rem) !important;
    font-weight: 400 !important;
    line-height: 0.95 !important;
    letter-spacing: 0.02em;
  }

  .admin-attractions-subtitle {
    margin: 8px 0 0 !important;
    color: var(--admin-muted) !important;
    font-family: "Nunito", sans-serif !important;
    font-size: 0.78rem !important;
    font-weight: 600 !important;
    line-height: 1.55 !important;
  }

  .admin-attractions-add-button {
    flex: 0 0 auto;
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
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease,
      background 0.2s ease;
  }

  .admin-attractions-add-button:hover,
  .admin-attractions-add-button:focus {
    background: var(--admin-primary-dark) !important;
    transform: translateY(-2px);
    box-shadow: 0 14px 28px rgba(45, 49, 149, 0.24);
  }

  /* -------------------------------
     STAT CARDS
  -------------------------------- */

  .admin-attractions-stats {
    margin-bottom: 24px !important;
  }

  .admin-attractions-stats .admin-stat-card {
    position: relative;
    min-height: 116px;
    overflow: hidden;
    border: 1px solid var(--admin-border) !important;
    border-radius: 18px !important;
    background: var(--admin-surface) !important;
    color: var(--admin-text) !important;
    box-shadow: 0 7px 24px rgba(26, 30, 53, 0.055);
    transition:
      transform 0.25s ease,
      box-shadow 0.25s ease,
      border-color 0.25s ease;
  }

  .admin-attractions-stats .admin-stat-card::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: var(--admin-primary);
  }

  .admin-attractions-stats > .col:nth-child(2) .admin-stat-card::before {
    background: var(--admin-yellow);
  }

  .admin-attractions-stats > .col:nth-child(3) .admin-stat-card::before {
    background: #7076D8;
  }

  .admin-attractions-stats > .col:nth-child(4) .admin-stat-card::before {
    background: #5A60B6;
  }

  .admin-attractions-stats .admin-stat-card:hover {
    transform: translateY(-3px);
    border-color: rgba(45, 49, 149, 0.16) !important;
    box-shadow: 0 14px 32px rgba(26, 30, 53, 0.10);
  }

  .admin-attractions-stats .admin-stat-card .card-body {
    padding: 18px 18px 16px !important;
  }

  .admin-attractions-stats .admin-stat-card .card-body > div:first-child {
    color: var(--admin-muted) !important;
    font-family: "Nunito", sans-serif !important;
    font-size: 0.67rem !important;
    font-weight: 900 !important;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .admin-attractions-stats .admin-stat-card .card-body > div:nth-child(2) {
    margin-top: 7px;
    color: var(--admin-text) !important;
    font-family: "Poppins", sans-serif !important;
    font-size: 1.95rem !important;
    font-weight: 800 !important;
    line-height: 1;
  }

  /* -------------------------------
     SEARCH / FILTER TOOLBAR
  -------------------------------- */

  .admin-attractions-toolbar {
    border: 1px solid var(--admin-border) !important;
    border-radius: 19px !important;
    background: rgba(255, 255, 255, 0.92) !important;
    box-shadow: 0 10px 30px rgba(26, 30, 53, 0.055) !important;
    overflow: visible !important;
  }

  .admin-attractions-toolbar .card-body {
    padding: 20px !important;
  }

  .admin-attractions-toolbar-title {
    margin-bottom: 14px !important;
    color: var(--admin-text) !important;
    font-family: "Poppins", sans-serif !important;
    font-size: 0.84rem !important;
    font-weight: 800 !important;
  }

  .admin-attractions-page .input-group,
  .admin-attractions-page .form-control,
  .admin-attractions-page .form-select {
    font-family: "Nunito", sans-serif !important;
  }

  .admin-attractions-toolbar .form-control,
  .admin-attractions-toolbar .form-select,
  .admin-attractions-toolbar .input-group-text {
    min-height: 42px !important;
    border-color: #E1E4EC !important;
    border-radius: 11px !important;
    background: #FBFBFD !important;
    color: var(--admin-text) !important;
    box-shadow: none !important;
  }

  .admin-attractions-toolbar .input-group > .input-group-text {
    border-top-right-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
  }

  .admin-attractions-toolbar .input-group > .form-control {
    border-left: 0 !important;
    border-radius: 0 !important;
  }

  .admin-attractions-toolbar .input-group > .btn {
    border-radius: 0 11px 11px 0 !important;
    border-color: #E1E4EC !important;
    background: #FBFBFD !important;
  }

  .admin-attractions-toolbar .form-control:focus,
  .admin-attractions-toolbar .form-select:focus {
    border-color: rgba(45, 49, 149, 0.55) !important;
    box-shadow: 0 0 0 3px rgba(45, 49, 149, 0.08) !important;
    background: #fff !important;
  }

  .admin-attractions-toolbar .form-control::placeholder {
    color: #A0A5B0 !important;
  }

  .admin-attractions-toolbar .text-muted,
  .admin-attractions-toolbar small {
    color: var(--admin-muted) !important;
    font-family: "Nunito", sans-serif !important;
  }

  .admin-attractions-toolbar .btn-link {
    color: var(--admin-primary) !important;
    font-weight: 800 !important;
  }

  /* -------------------------------
     ATTRACTION CARDS
  -------------------------------- */

  .admin-attraction-card {
    position: relative;
    width: 100%;
    min-height: 100%;
    overflow: hidden;
    border: 1px solid var(--admin-border) !important;
    border-radius: 19px !important;
    background: #fff !important;
    box-shadow: 0 7px 24px rgba(26, 30, 53, 0.065) !important;
    cursor: pointer;
    animation: adminAttractionCardIn 0.55s ease both;
    transition:
      transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1),
      box-shadow 0.25s ease,
      border-color 0.25s ease;
  }

  .admin-attraction-card:hover {
    transform: translateY(-5px);
    border-color: rgba(45, 49, 149, 0.18) !important;
    box-shadow: 0 18px 40px rgba(26, 30, 53, 0.12) !important;
  }

  .admin-attraction-image-shell {
    position: relative;
    height: 196px;
    overflow: hidden;
    border-radius: 19px 19px 0 0;
    background: #EEF0FF;
  }

  .admin-attraction-card-image {
    width: 100% !important;
    height: 100% !important;
    display: block;
    object-fit: cover;
    transition: transform 0.65s cubic-bezier(0.2, 0.65, 0.3, 1);
  }

  .admin-attraction-card:hover .admin-attraction-card-image {
    transform: scale(1.045);
  }

  .admin-attraction-image-overlay {
    position: absolute;
    inset: auto 0 0;
    height: 72px;
    background: linear-gradient(
      180deg,
      transparent 0%,
      rgba(10, 12, 25, 0.38) 100%
    );
    pointer-events: none;
  }

  .admin-attraction-image-count {
    position: absolute;
    right: 11px;
    bottom: 10px;
    z-index: 3;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 25px;
    padding: 5px 8px;
    border-radius: 999px;
    background: rgba(15, 17, 28, 0.56);
    color: #fff;
    backdrop-filter: blur(9px);
    font-size: 0.61rem;
    font-weight: 900;
  }

  .admin-attraction-welcome-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 4;
    padding: 6px 9px;
    border-radius: 999px;
    background: rgba(255, 183, 27, 0.95);
    color: #4D3500;
    box-shadow: 0 7px 18px rgba(0, 0, 0, 0.11);
    font-size: 0.61rem;
    font-weight: 900;
  }

  .admin-attraction-card .card-body {
    padding: 16px !important;
    min-height: 176px;
  }

  .admin-attraction-card .badge {
    border-radius: 999px !important;
    padding: 5px 9px !important;
    font-family: "Nunito", sans-serif !important;
    font-size: 0.58rem !important;
    font-weight: 900 !important;
  }

  .admin-attraction-card .badge:first-child {
    background: #EEF0FF !important;
    color: var(--admin-primary) !important;
  }

  .admin-attraction-card .badge:nth-child(2) {
    background: #F3F4F8 !important;
    color: #656A78 !important;
  }

  .admin-attraction-card .admin-attraction-description {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    min-height: 54px;
    overflow: hidden;
    margin: 6px 0 10px;
    color: var(--admin-muted);
    font-family: "Nunito", sans-serif;
    font-size: 0.69rem;
    font-weight: 600;
    line-height: 1.55;
  }

  .admin-attraction-card .admin-attraction-location {
    display: flex;
    gap: 6px;
    align-items: flex-start;
    min-height: 32px;
    margin-bottom: 14px;
    color: #818694;
    font-family: "Nunito", sans-serif;
    font-size: 0.65rem;
    font-weight: 700;
    line-height: 1.45;
  }

  .admin-attraction-card .admin-attraction-name {
    margin: 6px 0 0 !important;
    color: var(--admin-text) !important;
    font-family: "Poppins", sans-serif !important;
    font-size: 0.94rem !important;
    font-weight: 800 !important;
    line-height: 1.3 !important;
  }

  .admin-attraction-card-actions {
    padding-top: 12px;
    border-top: 1px solid #EEF0F4;
    margin-top: auto;
  }

  .admin-attraction-card-actions .btn {
    min-height: 36px;
    border-radius: 10px !important;
    font-family: "Nunito", sans-serif !important;
    font-size: 0.67rem !important;
    font-weight: 900 !important;
    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease,
      background 0.18s ease;
  }

  .admin-attraction-card-actions .btn-outline-primary {
    color: var(--admin-primary) !important;
    border-color: rgba(45, 49, 149, 0.25) !important;
    background: #F8F8FF !important;
  }

  .admin-attraction-card-actions .btn-outline-primary:hover {
    color: #fff !important;
    border-color: var(--admin-primary) !important;
    background: var(--admin-primary) !important;
    transform: translateY(-1px);
    box-shadow: 0 7px 16px rgba(45, 49, 149, 0.16);
  }

  .admin-attraction-card-actions .btn-outline-danger {
    width: 40px;
    color: #C74350 !important;
    border-color: rgba(199, 67, 80, 0.20) !important;
    background: #FFF7F8 !important;
  }

  .admin-attraction-card-actions .btn-outline-danger:hover {
    color: #fff !important;
    border-color: #C74350 !important;
    background: #C74350 !important;
    transform: translateY(-1px);
  }

  /* -------------------------------
     MODALS / FORM UI
  -------------------------------- */

  .admin-attractions-page .modal-content {
    overflow: hidden;
    border: 1px solid var(--admin-border) !important;
    border-radius: 22px !important;
    background: #fff !important;
    box-shadow: 0 24px 70px rgba(18, 20, 36, 0.17) !important;
  }

  .admin-attractions-page .modal-header {
    padding: 18px 21px !important;
    border-bottom: 1px solid #EEF0F4 !important;
    background: #fff !important;
    color: var(--admin-text) !important;
  }

  .admin-attractions-page .modal-header .modal-title {
    color: var(--admin-primary) !important;
    font-family: "Poppins", sans-serif !important;
    font-size: 0.98rem !important;
    font-weight: 800 !important;
  }

  .admin-attractions-page .modal-body {
    padding: 22px !important;
    background: #FBFBFD !important;
    color: var(--admin-text) !important;
  }

  .admin-attractions-page .modal-footer {
    gap: 8px;
    border-top: 1px solid #EEF0F4 !important;
    background: #fff !important;
    padding: 13px 21px !important;
  }

  .admin-attractions-page .modal-body hr {
    margin: 24px 0 !important;
    border-color: #E8EAF0 !important;
    opacity: 1;
  }

  .admin-attractions-page .modal-body > div.mb-3[style] {
    color: var(--admin-primary) !important;
    font-family: "Poppins", sans-serif !important;
    font-size: 0.82rem !important;
    font-weight: 800 !important;
  }

  .admin-attractions-page .modal-body > div.mb-3[style]::after {
    content: "";
    display: block;
    width: 28px;
    height: 3px;
    margin-top: 7px;
    border-radius: 999px;
    background: var(--admin-yellow);
  }

  .admin-attractions-page .modal-body .fw-semibold {
    color: #343844 !important;
    font-family: "Nunito", sans-serif !important;
    font-size: 0.69rem !important;
    font-weight: 900 !important;
  }

  .admin-attractions-page .modal-body .form-control,
  .admin-attractions-page .modal-body .form-select {
    min-height: 42px;
    border: 1px solid #E0E3EB !important;
    border-radius: 11px !important;
    background: #fff !important;
    color: var(--admin-text) !important;
    font-family: "Nunito", sans-serif !important;
    font-size: 0.72rem !important;
    font-weight: 600 !important;
    box-shadow: none !important;
  }

  .admin-attractions-page .modal-body textarea.form-control {
    min-height: 94px;
    resize: vertical;
  }

  .admin-attractions-page .modal-body .form-control:focus,
  .admin-attractions-page .modal-body .form-select:focus {
    border-color: rgba(45, 49, 149, 0.48) !important;
    box-shadow: 0 0 0 3px rgba(45, 49, 149, 0.08) !important;
  }

  .admin-attractions-page .modal-body .form-control::placeholder {
    color: #A4A8B2 !important;
  }

  .admin-attractions-page .modal-footer .btn {
    min-height: 39px;
    border-radius: 11px !important;
    padding: 8px 15px !important;
    font-family: "Nunito", sans-serif !important;
    font-size: 0.69rem !important;
    font-weight: 900 !important;
  }

  .admin-attractions-page .modal-footer .btn-primary {
    border: 0 !important;
    background: var(--admin-primary) !important;
    color: #fff !important;
    box-shadow: 0 8px 18px rgba(45, 49, 149, 0.16);
  }

  .admin-attractions-page .modal-footer .btn-primary:hover {
    background: var(--admin-primary-dark) !important;
    transform: translateY(-1px);
  }

  .admin-attractions-page .modal-footer .btn-secondary {
    border-color: #E0E3EB !important;
    background: #fff !important;
    color: #656A76 !important;
  }

  .admin-attractions-page .alert {
    border: 0 !important;
    border-radius: 13px !important;
    font-family: "Nunito", sans-serif;
    font-size: 0.72rem;
    font-weight: 700;
  }

  /* Dynamic category strip */
  .admin-attractions-page .modal-body > div.mb-3[style*="background"] {
    border-radius: 13px !important;
    padding: 12px 15px !important;
    background:
      linear-gradient(
        135deg,
        var(--admin-primary) 0%,
        var(--admin-primary-dark) 100%
      ) !important;
    color: #fff !important;
    font-family: "Poppins", sans-serif !important;
    font-size: 0.76rem !important;
    box-shadow: 0 8px 18px rgba(45, 49, 149, 0.13);
  }

  /* Existing/new image preview polish */
  .admin-attractions-page .modal-body img {
    border-radius: 13px !important;
  }

  /* -------------------------------
     MODAL DETAIL VIEW
  -------------------------------- */

  .admin-attractions-page .modal-body strong {
    color: var(--admin-text);
    font-family: "Nunito", sans-serif;
    font-weight: 900;
  }

  .admin-attractions-page .modal-body p {
    color: #666C78;
    font-family: "Nunito", sans-serif;
    font-size: 0.72rem;
    line-height: 1.6;
  }

  .admin-attractions-page .modal-body .badge {
    border-radius: 999px !important;
    padding: 6px 9px !important;
    font-family: "Nunito", sans-serif !important;
    font-size: 0.59rem !important;
    font-weight: 900 !important;
  }

  /* Category + active modal cards */
  .admin-attractions-page .modal-body .card {
    border: 1px solid var(--admin-border) !important;
    border-radius: 15px !important;
    background: #fff !important;
    box-shadow: 0 6px 20px rgba(26, 30, 53, 0.055) !important;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  .admin-attractions-page .modal-body .card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 26px rgba(26, 30, 53, 0.09) !important;
  }

  /* -------------------------------
     DARK MODE
  -------------------------------- */

  .admin-attractions-dark {
    --admin-bg: #121421;
    --admin-surface: #191C2B;
    --admin-border: #2B3042;
    --admin-text: #F1F3F8;
    --admin-muted: #A8AFBF;
    background:
      radial-gradient(
        circle at 8% 0%,
        rgba(100, 106, 212, 0.12),
        transparent 28%
      ),
      linear-gradient(
        180deg,
        #151827 0%,
        #10121C 100%
      );
  }

  .admin-attractions-dark .admin-attraction-card,
  .admin-attractions-dark .admin-attractions-toolbar,
  .admin-attractions-dark .modal-content {
    background: #191C2B !important;
    border-color: #2B3042 !important;
  }

  .admin-attractions-dark .admin-attraction-card .admin-attraction-name,
  .admin-attractions-dark .modal-body,
  .admin-attractions-dark .modal-header,
  .admin-attractions-dark .modal-footer {
    color: #F1F3F8 !important;
  }

  .admin-attractions-dark .admin-attractions-toolbar,
  .admin-attractions-dark .admin-attractions-toolbar .form-control,
  .admin-attractions-dark .admin-attractions-toolbar .form-select,
  .admin-attractions-dark .admin-attractions-toolbar .input-group-text,
  .admin-attractions-dark .admin-attractions-toolbar .input-group .btn {
    background: #202436 !important;
    border-color: #33394D !important;
    color: #F1F3F8 !important;
  }

  .admin-attractions-dark .admin-attractions-toolbar .form-control::placeholder {
    color: #858B9A !important;
  }

  .admin-attractions-dark .modal-header,
  .admin-attractions-dark .modal-footer {
    background: #191C2B !important;
    border-color: #2B3042 !important;
  }

  .admin-attractions-dark .modal-body {
    background: #151827 !important;
  }

  .admin-attractions-dark .modal-body .form-control,
  .admin-attractions-dark .modal-body .form-select {
    background: #202436 !important;
    border-color: #343A4F !important;
    color: #F1F3F8 !important;
  }

  .admin-attractions-dark .modal-body .fw-semibold {
    color: #E9EBF3 !important;
  }

  .admin-attractions-dark .modal-body p,
  .admin-attractions-dark .admin-attraction-description,
  .admin-attractions-dark .admin-attraction-location {
    color: #A8AFBF !important;
  }

  .admin-attractions-dark .modal-body .card {
    background: #191C2B !important;
    border-color: #2B3042 !important;
  }

  .admin-attractions-dark .modal-body hr,
  .admin-attractions-dark .admin-attraction-card-actions {
    border-color: #2B3042 !important;
  }

  /* =========================================================
     ENHANCED FILTER + FORM UI
  ========================================================= */

  .admin-attractions-toolbar-heading {
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:16px;
    margin-bottom:16px;
    padding:14px 16px;
    border:1px solid rgba(45,49,149,.09);
    border-radius:14px;
    background:linear-gradient(135deg, #f8f8ff 0%, #ffffff 70%);
  }

  .admin-filter-heading-main { display:flex; align-items:center; gap:11px; }
  .admin-toolbar-heading-icon {
    width:38px; height:38px; flex:0 0 38px;
    display:inline-flex; align-items:center; justify-content:center;
    border-radius:11px; background:#eef0ff; color:#2D3195;
  }
  .admin-attractions-toolbar-title { margin:0 0 2px !important; }
  .admin-attractions-toolbar-caption { color:#858B98; font-size:.66rem; font-weight:600; }
  .admin-filter-status-pill {
    display:inline-flex; align-items:center; gap:6px;
    padding:7px 10px; border-radius:999px;
    background:#fff5d9; color:#806000;
    font-size:.62rem; font-weight:900; white-space:nowrap;
  }

  .admin-filter-group {
    min-height:44px;
    border-radius:12px;
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
  .admin-filter-group .form-control,
  .admin-filter-group .form-select {
    min-height:44px !important;
    border-radius:0 12px 12px 0 !important;
  }
  .admin-search-group .form-control { padding-left:12px !important; }
  .admin-search-group .btn {
    min-width:43px; border-radius:0 12px 12px 0 !important;
    border-color:#e1e4ec !important; background:#f8f8ff !important;
    color:#2D3195 !important;
  }
  .admin-search-group:focus-within .admin-filter-icon,
  .admin-select-group:focus-within .admin-filter-icon {
    border-color:rgba(45,49,149,.5) !important;
    background:#eef0ff !important;
  }
  .admin-active-filters {
    display:flex; align-items:center; gap:7px; flex-wrap:wrap;
    margin-top:13px; padding-top:12px;
    border-top:1px dashed #e6e8ef;
  }
  .admin-active-filters-label { color:#858B98; font-size:.62rem; font-weight:900; text-transform:uppercase; letter-spacing:.05em; }
  .admin-filter-chip {
    display:inline-flex; align-items:center; gap:5px;
    padding:6px 9px; border-radius:999px;
    background:#eef0ff; color:#2D3195; border:1px solid rgba(45,49,149,.1);
    font-size:.61rem; font-weight:800;
  }

  /* Modal form */
  .admin-attraction-form-header {
    min-height:78px; padding:16px 20px !important;
    position:relative; overflow:hidden;
  }
  .admin-attraction-form-header::after {
    content:""; position:absolute; width:170px; height:170px;
    right:-55px; top:-75px; border-radius:50%;
    background:rgba(255,255,255,.10); pointer-events:none;
  }
  .admin-form-modal-title { position:relative; z-index:1; gap:11px; }
  .admin-form-title-icon {
    width:40px; height:40px; display:inline-flex; align-items:center; justify-content:center;
    border-radius:12px; background:rgba(255,255,255,.16);
    border:1px solid rgba(255,255,255,.22);
  }
  .admin-form-title-kicker { display:block; color:rgba(255,255,255,.72); font-family:"Nunito",sans-serif; font-size:.58rem; font-weight:800; letter-spacing:.08em; text-transform:uppercase; margin-bottom:2px; }
  .admin-form-title-text { display:block; color:#fff; font-family:"Poppins",sans-serif; font-size:1.05rem; font-weight:800; }

  .admin-form-intro {
    display:flex; align-items:center; gap:11px;
    padding:12px 14px; margin-bottom:20px;
    border:1px solid rgba(45,49,149,.11); border-radius:13px;
    background:#f7f7ff;
  }
  .admin-form-intro-icon {
    width:34px; height:34px; flex:0 0 34px;
    display:inline-flex; align-items:center; justify-content:center;
    border-radius:10px; background:#eef0ff; color:#2D3195;
  }
  .admin-form-intro strong { display:block; color:#2D3195; font-size:.72rem; font-weight:900; }
  .admin-form-intro span { display:block; margin-top:2px; color:#7c8290; font-size:.63rem; font-weight:600; }

  .admin-attractions-modal .modal-body { padding:22px !important; }
  .admin-attractions-modal .modal-body > .mb-3[style] {
    display:flex !important; align-items:center; gap:8px;
    padding:10px 12px !important; margin-top:4px;
    margin-bottom:14px !important;
    border-left:3px solid #2D3195; border-radius:0 10px 10px 0;
    background:rgba(45,49,149,.055) !important;
    color:#2D3195 !important;
    font-family:"Poppins",sans-serif; font-size:.78rem !important;
    letter-spacing:.01em;
  }
  .admin-form-section-icon {
    width:27px; height:27px; display:inline-flex; align-items:center; justify-content:center;
    border-radius:8px; background:#eef0ff; color:#2D3195;
  }
  .admin-dynamic-section-heading {
    display:flex; align-items:center; gap:8px;
    margin-bottom:10px; padding:10px 13px;
    border-radius:11px; color:#fff; font-weight:800;
    box-shadow:0 7px 18px rgba(26,95,74,.13);
  }
  .admin-attractions-modal .form-label {
    color:#4e5564; font-family:"Nunito",sans-serif; font-size:.67rem; font-weight:900 !important;
    margin-bottom:6px;
  }
  .admin-attractions-modal .form-control,
  .admin-attractions-modal .form-select {
    min-height:42px; border:1px solid #e0e3ea !important;
    border-radius:11px !important; background:#fff !important;
    font-family:"Nunito",sans-serif !important; font-size:.70rem !important;
    box-shadow:0 3px 10px rgba(26,30,53,.025) !important;
  }
  .admin-attractions-modal textarea.form-control { min-height:96px; resize:vertical; }
  .admin-attractions-modal .form-control:focus,
  .admin-attractions-modal .form-select:focus {
    border-color:rgba(45,49,149,.52) !important;
    box-shadow:0 0 0 3px rgba(45,49,149,.08) !important;
  }
  .admin-image-upload-label { display:inline-flex !important; align-items:center; gap:6px; color:#2D3195 !important; }
  .admin-attractions-modal .modal-footer { padding:12px 20px !important; }
  .admin-attractions-modal .modal-footer .btn { border-radius:10px !important; font-size:.68rem !important; font-weight:800 !important; min-height:38px; }

  .admin-attractions-dark .admin-attractions-toolbar-heading { background:#202436; border-color:#343A4F; }
  .admin-attractions-dark .admin-toolbar-heading-icon,
  .admin-attractions-dark .admin-filter-icon,
  .admin-attractions-dark .admin-form-intro-icon,
  .admin-attractions-dark .admin-form-section-icon { background:#262B46 !important; color:#AEB4FF !important; }
  .admin-attractions-dark .admin-filter-status-pill { background:#3b3217; color:#ffd86b; }
  .admin-attractions-dark .admin-active-filters { border-color:#343A4F; }
  .admin-attractions-dark .admin-filter-chip { background:#262B46; color:#c9ccff; border-color:#343A4F; }
  .admin-attractions-dark .admin-form-intro { background:#202436; border-color:#343A4F; }
  .admin-attractions-dark .admin-form-intro strong { color:#c9ccff; }
  .admin-attractions-dark .admin-attractions-modal .modal-body > .mb-3[style] { background:#262B46 !important; color:#c9ccff !important; }
  .admin-attractions-dark .admin-attractions-modal .form-label { color:#d9dce7; }

  /* -------------------------------
     KEYFRAMES
  -------------------------------- */

  @keyframes adminAttractionCardIn {
    from {
      opacity: 0;
      transform: translateY(12px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes adminDashboardFade {
    from {
      opacity: 0;
      transform: translateY(5px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .admin-attractions-page > * {
    animation: adminDashboardFade 0.4s ease both;
  }

  /* -------------------------------
     RESPONSIVE
  -------------------------------- */

  @media (max-width: 991.98px) {
    .admin-attractions-page {
      padding: 24px 20px 48px;
    }

    .admin-attractions-heading {
      align-items: flex-start !important;
      flex-direction: column;
      gap: 14px;
    }

    .admin-attractions-add-button {
      width: 100%;
    }
  }

  @media (max-width: 767.98px) {
    .admin-attractions-page {
      padding: 20px 15px 42px;
    }

    .admin-attractions-title {
      font-size: 2rem !important;
    }

    .admin-attractions-stats .admin-stat-card {
      min-height: 104px;
    }

    .admin-attractions-stats .admin-stat-card .card-body {
      padding: 15px !important;
    }

    .admin-attraction-image-shell {
      height: 185px;
    }

    .admin-attractions-page .modal-body {
      padding: 17px !important;
    }

    .admin-attractions-page .modal-header {
      padding: 15px 17px !important;
    }

    .admin-attractions-page .modal-footer {
      padding: 11px 17px !important;
    }
  }

  @media (max-width: 479.98px) {
    .admin-attractions-page {
      padding-left: 12px;
      padding-right: 12px;
    }

    .admin-attractions-title {
      font-size: 1.8rem !important;
    }

    .admin-attraction-image-shell {
      height: 180px;
    }
  }


  /* =========================================================
     FINAL UI REFINEMENTS
  ========================================================= */

  .admin-attractions-page {
    min-height: 100vh !important;
    width: 100% !important;
    padding: 0 0 56px !important;
    background: transparent !important;
  }

  .admin-attractions-heading {
    align-items: flex-end !important;
    margin: 0 0 26px !important;
    gap: 22px;
  }

  .admin-attractions-title {
    font-family: "Barabara", sans-serif !important;
    font-size: clamp(1.65rem, 2.8vw, 2.4rem) !important;
    line-height: 0.95 !important;
    font-weight: 400 !important;
    color: #2D3195 !important;
  }

  .admin-attractions-subtitle {
    max-width: 780px;
    font-size: 0.80rem !important;
  }

  .admin-attractions-stats .admin-stat-card {
    min-height: 132px !important;
    border-radius: 18px !important;
    border: 1px solid var(--admin-border) !important;
    background: var(--admin-surface) !important;
    color: var(--admin-text) !important;
    box-shadow: 0 7px 24px rgba(26,30,53,0.055) !important;
  }

  .admin-attractions-stats .admin-stat-card .card-body {
    padding: 17px 18px 16px !important;
  }

  .admin-stat-card-top { display:flex; align-items:center; gap:9px; }
  .admin-stat-icon { width:34px; height:34px; display:inline-flex; align-items:center; justify-content:center; border-radius:10px; flex:0 0 auto; }
  .admin-stat-icon-blue { color:#2D3195; background:#eef0ff; }
  .admin-stat-icon-yellow { color:#9a6900; background:#fff5d9; }
  .admin-stat-icon-purple { color:#5f62b7; background:#f0efff; }
  .admin-stat-icon-indigo { color:#3944a1; background:#eceeff; }
  .admin-stat-label { color:var(--admin-muted); font-size:.66rem; font-weight:900; letter-spacing:.04em; text-transform:uppercase; }
  .admin-stat-value { margin-top:11px; color:var(--admin-text); font-family:"Poppins",sans-serif; font-size:1.95rem; font-weight:800; line-height:1; }
  .admin-stat-caption { margin-top:8px; color:var(--admin-muted); font-size:.62rem; font-weight:600; }

  .admin-attractions-toolbar {
    border:1px solid var(--admin-border) !important;
    border-radius:18px !important;
    background:var(--admin-surface) !important;
    box-shadow:0 8px 26px rgba(26,30,53,.05) !important;
  }

  .admin-attractions-toolbar .card-body { padding:19px !important; }
  .admin-attractions-toolbar-heading { display:flex; align-items:center; gap:11px; margin-bottom:16px; }
  .admin-toolbar-heading-icon { width:36px; height:36px; display:inline-flex; align-items:center; justify-content:center; border-radius:10px; background:#eef0ff; color:#2D3195; }
  .admin-attractions-toolbar-title { margin:0 !important; font-size:.86rem !important; font-weight:800 !important; }
  .admin-attractions-toolbar-caption { margin-top:2px; color:var(--admin-muted); font-size:.64rem; font-weight:600; }

  .admin-filter-group > .form-control,
  .admin-filter-group > .form-select,
  .admin-filter-group > .btn {
    min-height:42px !important;
    border-color:#e1e4ec !important;
    background:#fbfbfd !important;
    color:var(--admin-text) !important;
    box-shadow:none !important;
  }
  
  .admin-filter-group > .form-control, .admin-filter-group > .form-select { font-size:.70rem !important; font-weight:700 !important; }
  .admin-filter-group > .form-control:focus, .admin-filter-group > .form-select:focus { border-color:rgba(45,49,149,.48) !important; box-shadow:0 0 0 3px rgba(45,49,149,.08) !important; background:#fff !important; }
  .admin-attractions-toolbar-footer { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-top:14px; padding-top:12px; border-top:1px solid #eef0f4; }
  .admin-toolbar-result-count { color:var(--admin-muted); font-size:.66rem; font-weight:700; }
  .admin-toolbar-result-count strong { color:var(--admin-text); }
  .admin-clear-filters { display:inline-flex !important; align-items:center; gap:5px; padding:0 !important; color:#2D3195 !important; font-size:.66rem !important; font-weight:800 !important; }

  .admin-attractions-grid > .col { display:flex; }
  .admin-attraction-card { border:1px solid var(--admin-border) !important; border-radius:18px !important; background:var(--admin-surface) !important; box-shadow:0 7px 24px rgba(26,30,53,.06) !important; }
  .admin-attraction-card:hover { border-color:rgba(45,49,149,.17) !important; box-shadow:0 17px 38px rgba(26,30,53,.11) !important; }
  .admin-attraction-image-shell { height:194px !important; border-radius:18px 18px 0 0 !important; }
  .admin-attraction-image-count, .admin-attraction-welcome-badge { display:inline-flex !important; align-items:center; gap:5px; }
  .admin-attraction-badge-row { display:flex; align-items:center; gap:6px; flex-wrap:wrap; min-height:24px; }
  .admin-attraction-category-badge, .admin-attraction-type-badge, 
  .admin-attraction-category-badge { background:#eef0ff !important; color:#2D3195 !important; }
  .admin-attraction-type-badge { background:#f3f4f8 !important; color:#626978 !important; }
  .admin-attraction-welcome-card-badge { background:#fff5d9 !important; color:#8e6200 !important; }
  .admin-attraction-name { margin:9px 0 0 !important; font-size:.91rem !important; font-weight:800 !important; }
  .admin-attraction-location { display:flex; align-items:flex-start; gap:6px; color:#818694; }
  .admin-attraction-location svg { flex:0 0 auto; margin-top:1px; color:#2D3195; }
  .admin-attraction-card-actions .btn { display:inline-flex; align-items:center; justify-content:center; gap:6px; }
  .admin-attraction-card-actions .admin-edit-button { flex:1 1 auto !important; min-width:0 !important; }
  .admin-delete-button { min-width:40px !important; width:40px !important; flex:0 0 40px !important; padding-left:0 !important; padding-right:0 !important; }

  .admin-attractions-loading { min-height:320px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px 20px; border:1px solid var(--admin-border); border-radius:18px; background:var(--admin-surface); text-align:center; }
  .admin-loading-icon, .admin-empty-icon { display:inline-flex; align-items:center; justify-content:center; color:#2D3195; background:#eef0ff; }
  .admin-loading-icon { width:52px; height:52px; border-radius:15px; }
  .admin-empty-icon { width:62px; height:62px; border-radius:18px; }
  .admin-loading-title, .admin-empty-title { margin-top:13px; color:var(--admin-text); font-family:"Poppins",sans-serif; font-size:.84rem; font-weight:800; }
  .admin-loading-subtitle, .admin-empty-text { margin:5px 0 0; color:var(--admin-muted); font-size:.68rem; font-weight:600; }
  .admin-attractions-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:300px; padding:40px 20px; border:1px solid var(--admin-border); border-radius:18px; background:var(--admin-surface); text-align:center; }
  .admin-empty-button { display:inline-flex !important; align-items:center; gap:6px; margin-top:16px; border-color:rgba(45,49,149,.28) !important; color:#2D3195 !important; border-radius:10px !important; font-size:.68rem !important; font-weight:800 !important; }

  .admin-modal-title { display:inline-flex; align-items:center; gap:8px; font-family:"Poppins",sans-serif !important; font-weight:700 !important; }
  .admin-attractions-modal .modal-content { border:1px solid var(--admin-border) !important; border-radius:18px !important; overflow:hidden; box-shadow:0 22px 60px rgba(26,30,53,.18) !important; }
  .admin-attractions-modal .modal-header { background:#2D3195 !important; color:#fff !important; border-bottom:0 !important; }
  .admin-attractions-modal .modal-header .btn-close { filter:brightness(0) invert(1); opacity:.85; }
  .admin-attractions-modal .modal-body, .admin-attractions-modal .modal-footer { background:var(--admin-surface) !important; }
  .admin-attractions-modal .modal-body > hr { border-color:var(--admin-border) !important; opacity:1; }
  .admin-checkbox-label { display:inline-flex; align-items:center; gap:6px; }
  .admin-detail-label { display:inline-flex; align-items:center; gap:5px; color:var(--admin-text); }
  .admin-detail-label svg { color:#2D3195; }

  .admin-attractions-dark .admin-attractions-page { background:transparent !important; }
  .admin-attractions-dark .admin-attractions-toolbar, .admin-attractions-dark .admin-attraction-card, .admin-attractions-dark .admin-attractions-loading, .admin-attractions-dark .admin-attractions-empty, .admin-attractions-dark .admin-attractions-stats .admin-stat-card { background:#191C2B !important; }
  .admin-attractions-dark .admin-toolbar-heading-icon, .admin-attractions-dark .admin-stat-icon-blue, .admin-attractions-dark .admin-stat-icon-purple, .admin-attractions-dark .admin-stat-icon-indigo, .admin-attractions-dark .admin-empty-icon, .admin-attractions-dark .admin-loading-icon { background:#262B46 !important; }
  .admin-attractions-dark .admin-filter-group > .form-control, .admin-attractions-dark .admin-filter-group > .form-select, .admin-attractions-dark .admin-filter-group > .btn { background:#202436 !important; border-color:#343A4F !important; color:#F1F3F8 !important; }
  .admin-attractions-dark .admin-attractions-modal .modal-body, .admin-attractions-dark .admin-attractions-modal .modal-footer { background:#191C2B !important; }

  @media (max-width: 991.98px) {
    .admin-attractions-heading { align-items:flex-start !important; flex-direction:column; gap:14px; }
    .admin-attractions-add-button { width:100%; }
    .admin-attractions-title { font-size:clamp(1.65rem, 4.5vw, 2.25rem) !important; }
  }

  @media (max-width: 767.98px) {
    .admin-attractions-title { font-size:1.9rem !important; }
  }

  @media (max-width: 479.98px) {
    .admin-attractions-title { font-size:1.8rem !important; }
  }
`;

/* =========================================================
   COMPONENT
========================================================= */

const AdminAttractions: React.FC = () => {
  const { darkMode } = useDarkMode();

  const [items, setItems] = useState<Attraction[]>([]);

  const [filteredItems, setFilteredItems] = useState<Attraction[]>([]);

  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [editing, setEditing] = useState<Attraction | null>(null);

  const [form, setForm] = useState<any>(EMPTY_FORM);

  const [saving, setSaving] = useState(false);

  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("All");

  const [attractionFilter, setAttractionFilter] = useState("All");

  const [sortOption, setSortOption] = useState("name-asc");

  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  const [viewItem, setViewItem] = useState<Attraction | null>(null);

  const [showCategoriesModal, setShowCategoriesModal] = useState(false);

  const [showActiveModal, setShowActiveModal] = useState(false);

  /* =========================================================
     LOAD DESTINATIONS
  ========================================================= */

  const load = async () => {
    setLoading(true);

    try {
      clearCache("attractions");

      const response = await getAttractions();

      const attractions = Array.isArray(response?.data) ? response.data : [];

      setItems(attractions);
      setFilteredItems(attractions);
    } catch (err) {
      console.error("Failed to load attractions:", err);

      setItems([]);
      setFilteredItems([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     INITIAL LOAD + SUPABASE
  ========================================================= */

  const subscribeToAttractions = (callback: () => void) => {
    return subscribeToTable("attractions", "*", callback);
  };

  useEffect(() => {
    load();

    subscribeToAttractions(() => {
      load();
    });

    return () => {
      unsubscribeAll();
    };
  }, []);

  /* =========================================================
     SEARCH / FILTER / SORT
  ========================================================= */

  useEffect(() => {
    let filtered = Array.isArray(items) ? [...items] : [];

    const normalize = (value: unknown) =>
      String(value ?? "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");

    const getSearchableText = (attraction: any) => {
      const tags = Array.isArray(attraction.tags)
        ? attraction.tags.join(" ")
        : attraction.tags || "";

      return normalize(
        [
          attraction.name,
          attraction.category,
          attraction.attraction_type,
          attraction.other_attraction_type,
          attraction.description,
          attraction.short_description,
          attraction.location_address,
          attraction.getting_there,
          attraction.entrance_fee,
          attraction.operational_hours,
          attraction.opening_hours,
          attraction.best_time_to_visit,
          attraction.attractions,
          attraction.things_to_do,
          attraction.website,
          attraction.mobile,
          attraction.contact_person,
          attraction.development_level,
          attraction.online_connectivity,
          attraction.mgt,
          attraction.historical_period,
          attraction.significance,
          attraction.industrial_activity,
          attraction.production_process,
          attraction.visitor_access,
          attraction.products_available,
          attraction.local_products,
          attraction.beach_type,
          attraction.best_season,
          attraction.activities_allowed,
          tags,
        ]
          .filter(Boolean)
          .join(" "),
      );
    };

    const search = normalize(searchTerm);

    if (search) {
      const tokens = search.split(/\s+/).filter(Boolean);

      filtered = filtered.filter((attraction: any) => {
        const searchable = getSearchableText(attraction);
        return tokens.every((token) => searchable.includes(token));
      });
    }

    if (categoryFilter !== "All") {
      filtered = filtered.filter(
        (attraction: any) =>
          normalize(attraction.category) === normalize(categoryFilter),
      );
    }

    if (attractionFilter !== "All") {
      filtered = filtered.filter((attraction: any) => {
        const attractionType = normalize(attraction.attraction_type);
        const otherAttractionType = normalize(attraction.other_attraction_type);
        const selected = normalize(attractionFilter);

        return attractionType === selected || otherAttractionType === selected;
      });
    }

    filtered.sort((a: any, b: any) => {
      const nameA = normalize(a.name);
      const nameB = normalize(b.name);
      const categoryA = normalize(a.category);
      const categoryB = normalize(b.category);
      const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
      const dateB = new Date(b.created_at || b.createdAt || 0).getTime();

      switch (sortOption) {
        case "name-desc":
          return nameB.localeCompare(nameA, undefined, {
            numeric: true,
            sensitivity: "base",
          });

        case "category-asc":
          return (
            categoryA.localeCompare(categoryB, undefined, {
              sensitivity: "base",
            }) ||
            nameA.localeCompare(nameB, undefined, {
              numeric: true,
              sensitivity: "base",
            })
          );

        case "newest":
          return dateB - dateA || nameA.localeCompare(nameB);

        case "oldest":
          return dateA - dateB || nameA.localeCompare(nameB);

        case "name-asc":
        default:
          return nameA.localeCompare(nameB, undefined, {
            numeric: true,
            sensitivity: "base",
          });
      }
    });

    setFilteredItems(filtered);
  }, [items, searchTerm, categoryFilter, attractionFilter, sortOption]);

  const availableAttractionTypes = useMemo(() => {
    if (categoryFilter !== "All") {
      return ATTRACTION_TYPES[categoryFilter] || [];
    }

    return Array.from(
      new Set(
        CATEGORIES.flatMap((category) => ATTRACTION_TYPES[category] || []),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [categoryFilter]);

  const getAttractionImages = (attraction: any): string[] => {
    if (Array.isArray(attraction?.images)) {
      return attraction.images.filter(Boolean);
    }

    if (typeof attraction?.images === "string") {
      return attraction.images
        .split(",")
        .map((image: string) => image.trim())
        .filter(Boolean);
    }

    return [];
  };

  const getFormImageUrls = (): string[] => {
    if (!form.images) {
      return [];
    }

    return String(form.images)
      .split(",")
      .map((image: string) => image.trim())
      .filter(Boolean);
  };

  const removeExistingImage = (indexToRemove: number) => {
    const currentImages = getFormImageUrls();

    const nextImages = currentImages.filter(
      (_, index) => index !== indexToRemove,
    );

    fc("images", nextImages.join(", "));
  };

  useEffect(() => {
    const urls = imageFiles.map((file) => URL.createObjectURL(file));

    setImagePreviewUrls(urls);

    return () => {
      urls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [imageFiles]);

  const getAttractionPlaceholder = (attraction: any) => {
    const design =
      CATEGORY_DESIGNS[attraction?.category] || CATEGORY_DESIGNS.Other;

    return (
      <div
        style={{
          height: 190,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: design.gradient,
          borderTopLeftRadius: "16px",
          borderTopRightRadius: "16px",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 130,
            height: 130,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.10)",
            top: -45,
            right: -25,
          }}
        />

        <div
          style={{
            position: "absolute",
            width: 170,
            height: 90,
            left: -25,
            bottom: -25,
            background: "rgba(0,0,0,0.13)",
            borderRadius: "50% 50% 0 0",
            transform: "rotate(-7deg)",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            textAlign: "center",
            color: "#fff",
            padding: "20px",
          }}
        >
          <div
            style={{
              fontSize: "3rem",
              lineHeight: 1,
              marginBottom: "9px",
              filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.18))",
            }}
          >
            {React.createElement(getCategoryIcon(attraction?.category), {
              size: 48,
              strokeWidth: 1.7,
            })}
          </div>

          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              opacity: 0.9,
            }}
          >
            Calbayog City Tourism
          </div>

          <div
            style={{
              fontSize: "0.68rem",
              opacity: 0.75,
              marginTop: "2px",
            }}
          >
            Image unavailable
          </div>
        </div>
      </div>
    );
  };

  /* =========================================================
     FORM HELPER
  ========================================================= */

  const fc = (field: string, value: unknown) => {
    setForm((previous: any) => ({
      ...previous,
      [field]: value,
    }));
  };

  /* =========================================================
     OPEN CREATE
  ========================================================= */

  const openCreate = () => {
    setEditing(null);

    setForm({
      ...EMPTY_FORM,

      attraction_type: ATTRACTION_TYPES.Nature[0],
    });

    setError("");

    setImageFiles([]);
    setImagePreviewUrls([]);

    setShowModal(true);
  };

  /* =========================================================
     OPEN EDIT
  ========================================================= */

  const openEdit = (attraction: Attraction) => {
    const d: any = attraction;

    const category = d.category || "Nature";

    const attractionType =
      d.attraction_type || ATTRACTION_TYPES[category]?.[0] || "";

    setEditing(attraction);

    setForm({
      ...EMPTY_FORM,

      name: d.name || "",

      category,

      attraction_type: attractionType,

      other_attraction_type: d.other_attraction_type || "",

      description: d.description || "",

      short_description: d.short_description || "",

      /* LOCATION / BASIC DETAILS */
      location_address: d.location_address || "",

      /* IMAGES */
      images: Array.isArray(d.images) ? d.images.join(", ") : d.images || "",

      /* GENERAL */
      entrance_fee: d.entrance_fee || "",
      operational_hours: d.operational_hours || d.opening_hours || "",
      best_time_to_visit: d.best_time_to_visit || d.best_season || "",
      website: d.website || "",
      attractions: Array.isArray(d.attractions)
        ? d.attractions.join(", ")
        : d.attractions || "",
      things_to_do: Array.isArray(d.things_to_do)
        ? d.things_to_do.join(", ")
        : d.things_to_do || "",

      tags: Array.isArray(d.tags) ? d.tags.join(", ") : d.tags || "",

      /* TOURISM */
      development_level: d.development_level || "",

      online_connectivity: d.online_connectivity || "",

      mgt: d.mgt || "",

      /* CONTACT */
      mobile: d.mobile || "",
      contact_person: d.contact_person || "",

      show_on_welcome: Boolean(d.show_on_welcome ?? d.showOnWelcome ?? false),

      /* NATURE */
      waterfall_height: d.waterfall_height || "",

      swimming_allowed: Boolean(d.swimming_allowed),

      trekking_difficulty: d.trekking_difficulty || "",

      beach_type: d.beach_type || "",

      best_season: d.best_season || "",

      activities_allowed: d.activities_allowed || "",

      /* HISTORY */
      historical_period: d.historical_period || "",

      significance: d.significance || "",

      /* INDUSTRIAL */
      industrial_activity: d.industrial_activity || "",

      production_process: d.production_process || "",

      visitor_access: d.visitor_access || "",

      /* SHOPPING */
      products_available: d.products_available || "",

      local_products: d.local_products || "",
    });

    setImageFiles([]);

    setError("");

    setShowModal(true);
  };

  /* =========================================================
     CATEGORY CHANGE
  ========================================================= */

  const handleCategoryChange = (category: string) => {
    const firstAttraction = ATTRACTION_TYPES[category]?.[0] || "";

    setForm((previous: any) => ({
      ...previous,

      category,

      attraction_type: firstAttraction,

      other_attraction_type: "",
    }));
  };

  /* =========================================================
     SAVE DESTINATION
  ========================================================= */

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Attraction name is required.");

      return;
    }

    if (!form.description.trim()) {
      setError("Description is required.");

      return;
    }

    /* OTHER ATTRACTION TYPE */
    if (
      form.attraction_type === "Other" &&
      !form.other_attraction_type.trim()
    ) {
      setError("Please specify the attraction type for Other.");

      return;
    }

    setSaving(true);

    setUploading(false);

    setError("");

    try {
      let imageUrls: string[] = getFormImageUrls();

      /* =====================================================
         IMAGE UPLOAD
      ===================================================== */

      if (imageFiles.length > 0) {
        setUploading(true);

        try {
          const uploadResponse = await uploadMultipleImages(imageFiles);

          const uploadedUrls = Array.isArray(uploadResponse?.data?.urls)
            ? uploadResponse.data.urls
            : [];

          /* Keep existing images and append the newly uploaded images. */
          imageUrls = Array.from(
            new Set([...imageUrls, ...uploadedUrls].filter(Boolean)),
          );
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);

          setError("Image upload failed. The existing images were kept.");
        } finally {
          setUploading(false);
        }
      }

      /* =====================================================
         MAIN PAYLOAD
      ===================================================== */

      const payload: any = {
        name: form.name.trim(),

        category: form.category,

        attraction_type:
          form.attraction_type === "Other" ? "Other" : form.attraction_type,

        other_attraction_type:
          form.attraction_type === "Other"
            ? form.other_attraction_type.trim()
            : "",

        description: form.description.trim(),

        /* LOCATION / BASIC DETAILS */
        location_address: form.location_address?.trim() || "",

        /* IMAGES */
        images: imageUrls,

        /* GENERAL */
        entrance_fee: form.entrance_fee?.trim() || "",
        operational_hours: form.operational_hours?.trim() || "",
        best_time_to_visit: form.best_time_to_visit?.trim() || "",
        website: form.website?.trim() || "",
        attractions: form.attractions?.trim() || "",
        things_to_do: form.things_to_do?.trim() || "",

        tags: (form.tags || "")
          .split(",")
          .map((tag: string) => tag.trim())
          .filter(Boolean),

        /* TOURISM */
        development_level: form.development_level || null,

        online_connectivity: form.online_connectivity || null,

        mgt: form.mgt || null,

        /* CONTACT */
        mobile: form.mobile?.trim() || "",
        contact_person: form.contact_person?.trim() || "",

        show_on_welcome: Boolean(form.show_on_welcome),
      };

      /* =====================================================
         NATURE
      ===================================================== */

      if (form.category === "Nature") {
        payload.waterfall_height = form.waterfall_height || "";

        payload.swimming_allowed = Boolean(form.swimming_allowed);

        payload.trekking_difficulty = form.trekking_difficulty || "";

        payload.beach_type = form.beach_type || "";

        payload.best_season = form.best_season || "";

        payload.activities_allowed = form.activities_allowed || "";
      }

      /* =====================================================
         HISTORY AND CULTURE
      ===================================================== */

      if (form.category === "History and Culture") {
        payload.historical_period = form.historical_period || "";

        payload.significance = form.significance || "";
      }

      /* =====================================================
         INDUSTRIAL TOURISM
      ===================================================== */

      if (form.category === "Industrial Tourism") {
        payload.industrial_activity = form.industrial_activity || "";

        payload.production_process = form.production_process || "";

        payload.visitor_access = form.visitor_access || "";
      }

      /* =====================================================
         SHOPPING
      ===================================================== */

      if (form.category === "Shopping") {
        payload.products_available = form.products_available || "";

        payload.local_products = form.local_products || "";
      }

      /* =====================================================
         CREATE / UPDATE
      ===================================================== */

      if (editing && editing.id) {
        await updateAttraction(editing.id, payload);
      } else {
        const created = await createAttraction(payload);

        const newAttractionId = created?.data?._id || created?.data?.id;

        try {
          await createNotification({
            userId: "all",

            type: "attraction_added",

            title: "New Attraction Added!",

            message: `Check out the new attraction: ${form.name}`,

            data: {
              attractionId: newAttractionId,

              attractionName: form.name,

              category: form.category,
            },
          });
        } catch (notificationError) {
          console.error("Failed to create notification:", notificationError);
        }
      }

      clearCache("attractions");

      setShowModal(false);

      setEditing(null);

      await load();
    } catch (err: any) {
      console.error("Failed to save attraction:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save attraction.",
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
    const confirmed = window.confirm("Delete this attraction?");

    if (!confirmed) return;

    try {
      await deleteAttraction(id);

      clearCache("attractions");

      await load();
    } catch (err) {
      console.error("Failed to delete attraction:", err);
    }
  };

  /* =========================================================
     CATEGORY COLOR
  ========================================================= */

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Nature: "#1A7A4A",

      "History and Culture": "#765548",

      "Industrial Tourism": "#536878",

      Shopping: "#B56A00",

      Other: "#68736D",
    };

    return colors[category] || "#90A4AE";
  };

  /* =========================================================
     COUNTS
  ========================================================= */

  const categoryCount = useMemo(
    () => new Set(items.map((attraction: any) => attraction.category)).size,
    [items],
  );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <AdminLayout>
      <div
        className={`admin-attractions-page ${
          darkMode ? "admin-attractions-dark" : ""
        }`}
      >
        <style>{DESTINATION_CARD_ANIMATION}</style>
        <style>{ADMIN_ATTRACTIONS_STYLES}</style>

        {/* =====================================================
          HEADER
      ===================================================== */}

        <div className="admin-attractions-heading d-flex justify-content-between">
          <div className="admin-attractions-heading-copy">
            <div className="admin-attractions-eyebrow">CONTENT MANAGEMENT</div>

            <h2 className="admin-attractions-title">ATTRACTIONS</h2>

            <p className="admin-attractions-subtitle">
              Manage Calbayog City Tourism attractions, images, details, and
              public visibility from one place.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={openCreate}
            className="admin-attractions-add-button"
          >
            <Plus size={17} strokeWidth={2.2} />
            <span>Add Attraction</span>
          </Button>
        </div>

        {/* =====================================================
          STATS
      ===================================================== */}

        <Row className="g-3 mb-4 admin-attractions-stats">
          <Col xs={12} sm={6} xl={3}>
            <Card
              className="border-0 h-100 admin-stat-card"
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("All");
                setAttractionFilter("All");
              }}
            >
              <Card.Body>
                <div className="admin-stat-card-top">
                  <span className="admin-stat-icon admin-stat-icon-blue">
                    <MapPinned size={18} strokeWidth={2} />
                  </span>
                  <span className="admin-stat-label">Total Attractions</span>
                </div>
                <div className="admin-stat-value">{items.length}</div>
                <div className="admin-stat-caption">All attraction records</div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} xl={3}>
            <Card className="border-0 h-100 admin-stat-card">
              <Card.Body>
                <div className="admin-stat-card-top">
                  <span className="admin-stat-icon admin-stat-icon-yellow">
                    <Home size={18} strokeWidth={2} />
                  </span>
                  <span className="admin-stat-label">Show on Welcome</span>
                </div>
                <div className="admin-stat-value">
                  {
                    items.filter((d: any) =>
                      Boolean(d.show_on_welcome ?? d.showOnWelcome),
                    ).length
                  }
                </div>
                <div className="admin-stat-caption">
                  Visible on the public welcome page
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} xl={3}>
            <Card
              className="border-0 h-100 admin-stat-card"
              onClick={() => setShowCategoriesModal(true)}
            >
              <Card.Body>
                <div className="admin-stat-card-top">
                  <span className="admin-stat-icon admin-stat-icon-purple">
                    <Layers3 size={18} strokeWidth={2} />
                  </span>
                  <span className="admin-stat-label">Categories</span>
                </div>
                <div className="admin-stat-value">{categoryCount}</div>
                <div className="admin-stat-caption">
                  Tourism categories in use
                </div>
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

        <Card className="border-0 mb-4 admin-attractions-toolbar">
          <Card.Body>
            <div className="admin-attractions-toolbar-heading">
              <div className="admin-filter-heading-main">
                <span className="admin-toolbar-heading-icon">
                  <SlidersHorizontal size={18} strokeWidth={2.1} />
                </span>
                <div>
                  <div className="admin-attractions-toolbar-title">
                    Find an Attraction
                  </div>
                  <div className="admin-attractions-toolbar-caption">
                    Search, filter, and organize your attraction records.
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
              <Col xs={12} lg={5}>
                <InputGroup className="admin-filter-group admin-search-group">
                  <InputGroup.Text className="admin-filter-icon">
                    <Search size={16} strokeWidth={2.1} />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search name, category, type, location, tags..."
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

              <Col xs={12} sm={6} lg={2.5}>
                <InputGroup className="admin-filter-group admin-select-group">
                  <InputGroup.Text className="admin-filter-icon">
                    <Layers3 size={15} strokeWidth={2.1} />
                  </InputGroup.Text>
                  <Form.Select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setAttractionFilter("All");
                    }}
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

              <Col xs={12} sm={6} lg={2.5}>
                <InputGroup className="admin-filter-group admin-select-group">
                  <InputGroup.Text className="admin-filter-icon">
                    <Tag size={15} strokeWidth={2.1} />
                  </InputGroup.Text>
                  <Form.Select
                    value={attractionFilter}
                    onChange={(e) => setAttractionFilter(e.target.value)}
                  >
                    <option value="All">All Attraction Types</option>
                    {availableAttractionTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
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
                    <option value="newest">Newest Added</option>
                    <option value="oldest">Oldest Added</option>
                  </Form.Select>
                </InputGroup>
              </Col>
            </Row>

            {(searchTerm ||
              categoryFilter !== "All" ||
              attractionFilter !== "All") && (
              <div className="admin-active-filters">
                <span className="admin-active-filters-label">Active:</span>
                {searchTerm && (
                  <span className="admin-filter-chip">
                    <Search size={11} strokeWidth={2.2} />“{searchTerm}”
                  </span>
                )}
                {categoryFilter !== "All" && (
                  <span className="admin-filter-chip">
                    <Layers3 size={11} strokeWidth={2.2} />
                    {categoryFilter}
                  </span>
                )}
                {attractionFilter !== "All" && (
                  <span className="admin-filter-chip">
                    <Tag size={11} strokeWidth={2.2} />
                    {attractionFilter}
                  </span>
                )}
              </div>
            )}

            <div className="admin-attractions-toolbar-footer">
              <div className="admin-toolbar-result-count">
                Showing <strong>{filteredItems.length}</strong> of{" "}
                {items.length} attractions
              </div>
              {(searchTerm ||
                categoryFilter !== "All" ||
                attractionFilter !== "All") && (
                <Button
                  variant="link"
                  size="sm"
                  className="admin-clear-filters"
                  onClick={() => {
                    setSearchTerm("");
                    setCategoryFilter("All");
                    setAttractionFilter("All");
                  }}
                >
                  <X size={14} strokeWidth={2.2} />
                  Clear filters
                </Button>
              )}
            </div>
          </Card.Body>
        </Card>

        {/* =====================================================
          DESTINATION CARDS
      ===================================================== */}

        {loading ? (
          <div className="admin-attractions-loading">
            <div className="admin-loading-icon">
              <Spinner animation="border" size="sm" />
            </div>
            <div className="admin-loading-title">Loading attractions...</div>
            <div className="admin-loading-subtitle">
              Preparing Calbayog City Tourism records.
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="admin-attractions-empty">
            <div className="admin-empty-icon">
              <MapPinned size={30} strokeWidth={1.7} />
            </div>
            <div className="admin-empty-title">No attractions found</div>
            <p className="admin-empty-text">
              Try adjusting your search or filters to find another attraction.
            </p>
            <Button
              variant="outline-primary"
              className="admin-empty-button"
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("All");
                setAttractionFilter("All");
              }}
            >
              <Layers3 size={15} strokeWidth={2} />
              View all attractions
            </Button>
          </div>
        ) : (
          <Row className="g-3 g-lg-4 admin-attractions-grid">
            {filteredItems.map((attraction: any, index: number) => {
              const attractionImages = getAttractionImages(attraction);
              const firstImage = attractionImages[0];
              const displayAttractionType =
                attraction.attraction_type === "Other"
                  ? attraction.other_attraction_type || "Other"
                  : attraction.attraction_type;

              return (
                <Col xs={12} sm={6} lg={4} xl={3} key={attraction.id}>
                  <Card
                    className="h-100 border-0 admin-attraction-card"
                    style={{ animationDelay: `${Math.min(index * 55, 440)}ms` }}
                    onClick={() => setViewItem(attraction)}
                  >
                    {firstImage ? (
                      <div className="admin-attraction-image-shell">
                        <img
                          src={firstImage}
                          alt={attraction.name}
                          className="admin-attraction-card-image"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = DEFAULT_TOURISM_IMAGE;
                          }}
                        />
                        <div className="admin-attraction-image-overlay" />

                        {(attraction.show_on_welcome ??
                          attraction.showOnWelcome) && (
                          <span className="admin-attraction-welcome-badge">
                            <Home size={12} strokeWidth={2.2} />
                            Welcome
                          </span>
                        )}

                        {attractionImages.length > 1 && (
                          <span className="admin-attraction-image-count">
                            <ImageIcon size={13} strokeWidth={2} />
                            {attractionImages.length}
                          </span>
                        )}
                      </div>
                    ) : (
                      getAttractionPlaceholder(attraction)
                    )}

                    <Card.Body className="p-3 d-flex flex-column">
                      <div className="admin-attraction-badge-row">
                        <Badge className="admin-attraction-category-badge">
                          {attraction.category}
                        </Badge>

                        {displayAttractionType && (
                          <Badge className="admin-attraction-type-badge">
                            {displayAttractionType}
                          </Badge>
                        )}
                      </div>

                      <h5 className="admin-attraction-name">
                        {attraction.name}
                      </h5>

                      {attraction.description && (
                        <p className="admin-attraction-description">
                          {attraction.description}
                        </p>
                      )}

                      <p className="admin-attraction-location">
                        <MapPin size={14} strokeWidth={2} />
                        <span>
                          {attraction.location_address || "Location not set"}
                        </span>
                      </p>

                      <div
                        className="d-flex gap-2 flex-wrap mt-auto admin-attraction-card-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => openEdit(attraction)}
                          className="admin-edit-button"
                        >
                          <Pencil size={14} strokeWidth={2} />
                          Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDelete(attraction.id)}
                          className="admin-delete-button"
                          aria-label={`Delete ${attraction.name}`}
                          title="Delete attraction"
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
          ADD / EDIT DESTINATION MODAL
      ===================================================== */}

        <Modal
          className="admin-attractions-modal"
          show={showModal}
          onHide={() => {
            setShowModal(false);

            setError("");
          }}
          size="lg"
          centered
          scrollable
        >
          <Modal.Header
            closeButton
            className="admin-attraction-form-header"
            style={{
              background: CATEGORY_DESIGNS[form.category]?.gradient,
              color: "#fff",
            }}
          >
            <Modal.Title className="admin-modal-title admin-form-modal-title">
              <span className="admin-form-title-icon">
                {React.createElement(getCategoryIcon(form.category), {
                  size: 20,
                  strokeWidth: 2,
                })}
              </span>
              <span>
                <span className="admin-form-title-kicker">
                  Attraction Management
                </span>
                <span className="admin-form-title-text">
                  {editing ? "Edit Attraction" : "Add Attraction"}
                </span>
              </span>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body
            style={{
              background: CATEGORY_DESIGNS[form.category]?.bgPattern,

              padding: "24px",
            }}
          >
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
                    ? "Update attraction details"
                    : "Create a new attraction"}
                </strong>
                <span>
                  Keep the visitor-facing information clear, complete, and easy
                  to scan.
                </span>
              </div>
            </div>

            {/* =================================================
              BASIC INFORMATION
          ================================================= */}

            <div
              className="mb-3"
              style={{
                fontWeight: 700,

                fontSize: "1.05rem",

                color: darkMode ? "#e0e0e0" : "#1a5f4a",
              }}
            >
              <span className="admin-form-section-icon">
                <FileText size={16} strokeWidth={2.1} />
              </span>
              <span>Basic Information</span>
            </div>

            <Row className="g-3">
              <Col xs={12} md={8}>
                <Form.Label className="fw-semibold">
                  Attraction Name *
                </Form.Label>

                <Form.Control
                  value={form.name}
                  onChange={(e) => fc("name", e.target.value)}
                  placeholder="Enter attraction name"
                />
              </Col>

              <Col xs={12} md={4}>
                <Form.Label className="fw-semibold">Category *</Form.Label>

                <Form.Select
                  value={form.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {CATEGORY_DESIGNS[category]?.icon} {category}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col xs={12} md={6}>
                <Form.Label className="fw-semibold">
                  Attraction Type *
                </Form.Label>

                <Form.Select
                  value={form.attraction_type}
                  onChange={(e) => fc("attraction_type", e.target.value)}
                >
                  {(ATTRACTION_TYPES[form.category] || []).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              {form.attraction_type === "Other" && (
                <Col xs={12} md={6}>
                  <Form.Label className="fw-semibold">
                    Other Attraction Type *
                  </Form.Label>

                  <Form.Control
                    value={form.other_attraction_type}
                    onChange={(e) =>
                      fc("other_attraction_type", e.target.value)
                    }
                    placeholder="Specify attraction type"
                  />
                </Col>
              )}

              <Col xs={12}>
                <Form.Label className="fw-semibold">
                  Full Description *
                </Form.Label>

                <Form.Control
                  as="textarea"
                  rows={5}
                  value={form.description}
                  onChange={(e) => fc("description", e.target.value)}
                  placeholder="Describe the attraction..."
                />
              </Col>
            </Row>

            {/* =================================================
              VISITOR INFORMATION
          ================================================= */}

            <hr className="my-4" />

            <div
              className="mb-3"
              style={{
                fontWeight: 700,

                fontSize: "1.05rem",

                color: darkMode ? "#e0e0e0" : "#1a5f4a",
              }}
            >
              <span className="admin-form-section-icon">
                <MapPin size={16} strokeWidth={2.1} />
              </span>
              <span>Visitor Information</span>
            </div>

            <Row className="g-3">
              <Col xs={12} md={8}>
                <Form.Label className="fw-semibold">Address</Form.Label>

                <Form.Control
                  value={form.location_address}
                  onChange={(e) => fc("location_address", e.target.value)}
                  placeholder="Enter attraction address"
                />
              </Col>

              <Col xs={12} md={4}>
                <Form.Label className="fw-semibold">Entrance Fee</Form.Label>

                <Form.Control
                  value={form.entrance_fee}
                  onChange={(e) => fc("entrance_fee", e.target.value)}
                  placeholder="₱50 / Free / Not Stated"
                />
              </Col>
            </Row>

            {/* =================================================
              TOURISM INFORMATION
          ================================================= */}

            <hr className="my-4" />

            <div
              className="mb-3"
              style={{
                fontWeight: 700,

                fontSize: "1.05rem",

                color: darkMode ? "#e0e0e0" : "#1a5f4a",
              }}
            >
              <span className="admin-form-section-icon">
                <Landmark size={16} strokeWidth={2.1} />
              </span>
              <span>Tourism Information</span>
            </div>

            <Row className="g-3">
              <Col xs={12} md={4}>
                <Form.Label className="fw-semibold">
                  Development Level
                </Form.Label>

                <Form.Select
                  value={form.development_level}
                  onChange={(e) => fc("development_level", e.target.value)}
                >
                  <option value="">Select development level</option>

                  {DEVELOPMENT_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col xs={12} md={4}>
                <Form.Label className="fw-semibold">
                  Online Connectivity
                </Form.Label>

                <Form.Select
                  value={form.online_connectivity}
                  onChange={(e) => fc("online_connectivity", e.target.value)}
                >
                  <option value="">Select connectivity</option>

                  {ONLINE_CONNECTIVITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col xs={12} md={4}>
                <Form.Label className="fw-semibold">MGT</Form.Label>

                <Form.Select
                  value={form.mgt}
                  onChange={(e) => fc("mgt", e.target.value)}
                >
                  <option value="">Select management type</option>

                  {MGT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Row>

            {/* =================================================
              CONTACT INFORMATION
          ================================================= */}

            <hr className="my-4" />

            <div
              className="mb-3"
              style={{
                fontWeight: 700,
                fontSize: "1.05rem",
                color: darkMode ? "#e0e0e0" : "#1a5f4a",
              }}
            >
              <span className="admin-form-section-icon">
                <Phone size={16} strokeWidth={2.1} />
              </span>
              <span>Contact Details</span>
            </div>

            <Row className="g-3">
              <Col xs={12} md={6}>
                <Form.Label className="fw-semibold">Mobile</Form.Label>
                <Form.Control
                  type="tel"
                  value={form.mobile}
                  onChange={(e) => fc("mobile", e.target.value)}
                  placeholder="09XX XXX XXXX"
                />
              </Col>

              <Col xs={12} md={6}>
                <Form.Label className="fw-semibold">Contact Person</Form.Label>
                <Form.Control
                  type="text"
                  value={form.contact_person}
                  onChange={(e) => fc("contact_person", e.target.value)}
                  placeholder="Enter contact person name"
                />
              </Col>
            </Row>

            {/* =================================================
              ATTRACTION DETAILS
          ================================================= */}

            <hr className="my-4" />

            <div
              className="mb-3"
              style={{
                fontWeight: 700,
                fontSize: "1.05rem",
                color: darkMode ? "#e0e0e0" : "#1a5f4a",
              }}
            >
              Attraction Information
            </div>

            <Row className="g-3">
              <Col xs={12} md={6}>
                <Form.Label className="fw-semibold">
                  Operational Hours
                </Form.Label>
                <Form.Control
                  value={form.operational_hours}
                  onChange={(e) => fc("operational_hours", e.target.value)}
                  placeholder="e.g. Monday–Sunday, 8:00 AM–5:00 PM"
                />
              </Col>

              <Col xs={12} md={6}>
                <Form.Label className="fw-semibold">
                  Best Time to Visit
                </Form.Label>
                <Form.Control
                  value={form.best_time_to_visit}
                  onChange={(e) => fc("best_time_to_visit", e.target.value)}
                  placeholder="e.g. November to May / Morning"
                />
              </Col>

              <Col xs={12}>
                <Form.Label className="fw-semibold">Attractions</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={form.attractions}
                  onChange={(e) => fc("attractions", e.target.value)}
                  placeholder="List the attractions or notable features visitors can see..."
                />
              </Col>

              <Col xs={12}>
                <Form.Label className="fw-semibold">Things to Do</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={form.things_to_do}
                  onChange={(e) => fc("things_to_do", e.target.value)}
                  placeholder="List the activities visitors can do..."
                />
              </Col>

              <Col xs={12}>
                <Form.Label className="fw-semibold">Website</Form.Label>
                <Form.Control
                  type="url"
                  value={form.website}
                  onChange={(e) => fc("website", e.target.value)}
                  placeholder="https://example.com"
                />
              </Col>
            </Row>

            {/* =================================================
              DYNAMIC ATTRACTION DETAILS
          ================================================= */}

            <hr className="my-4" />

            <div
              className="mb-3 admin-dynamic-section-heading"
              style={{
                background: CATEGORY_DESIGNS[form.category]?.gradient,

                color: "#fff",

                padding: "12px 16px",

                borderRadius: "8px",

                fontWeight: 600,
              }}
            >
              {React.createElement(getCategoryIcon(form.category), {
                size: 16,
                strokeWidth: 2.1,
              })}
              <span>{form.category} Attraction Details</span>
            </div>

            <p
              className="text-muted"
              style={{
                fontSize: "0.85rem",
              }}
            >
              Fill in only the information relevant to this attraction.
            </p>

            {/* =================================================
              NATURE
          ================================================= */}

            {form.category === "Nature" && (
              <Row className="g-3">
                {form.attraction_type === "Waterfalls" && (
                  <Col xs={12} md={6}>
                    <Form.Label className="fw-semibold">
                      Waterfall Height
                    </Form.Label>

                    <Form.Control
                      value={form.waterfall_height}
                      onChange={(e) => fc("waterfall_height", e.target.value)}
                      placeholder="e.g. 50 meters"
                    />
                  </Col>
                )}

                {form.attraction_type === "Beaches" && (
                  <Col xs={12} md={6}>
                    <Form.Label className="fw-semibold">Beach Type</Form.Label>

                    <Form.Select
                      value={form.beach_type}
                      onChange={(e) => fc("beach_type", e.target.value)}
                    >
                      <option value="">Select beach type</option>

                      <option value="White Sand">White Sand</option>

                      <option value="Black Sand">Black Sand</option>

                      <option value="Rocky">Rocky</option>

                      <option value="Mixed">Mixed</option>
                    </Form.Select>
                  </Col>
                )}

                {[
                  "Waterfalls",
                  "Beaches",
                  "Caves",
                  "Hot Springs",
                  "Rivers",
                  "Dive Sites",
                ].includes(form.attraction_type) && (
                  <>
                    <Col xs={12} md={6}>
                      <Form.Label className="fw-semibold">
                        Best Season
                      </Form.Label>

                      <Form.Control
                        value={form.best_season}
                        onChange={(e) => fc("best_season", e.target.value)}
                        placeholder="e.g. March to May"
                      />
                    </Col>

                    <Col xs={12} md={6}>
                      <Form.Label className="fw-semibold">
                        Trekking Difficulty
                      </Form.Label>

                      <Form.Select
                        value={form.trekking_difficulty}
                        onChange={(e) =>
                          fc("trekking_difficulty", e.target.value)
                        }
                      >
                        <option value="">Select difficulty</option>

                        <option value="Easy">Easy</option>

                        <option value="Moderate">Moderate</option>

                        <option value="Difficult">Difficult</option>

                        <option value="Extreme">Extreme</option>
                      </Form.Select>
                    </Col>

                    <Col xs={12}>
                      <Form.Label className="fw-semibold">
                        Activities Allowed
                      </Form.Label>

                      <Form.Control
                        value={form.activities_allowed}
                        onChange={(e) =>
                          fc("activities_allowed", e.target.value)
                        }
                        placeholder="Hiking, swimming, camping, diving..."
                      />
                    </Col>

                    <Col xs={12}>
                      <Form.Check
                        type="checkbox"
                        label="Swimming Allowed"
                        checked={Boolean(form.swimming_allowed)}
                        onChange={(e) =>
                          fc("swimming_allowed", e.target.checked)
                        }
                      />
                    </Col>
                  </>
                )}
              </Row>
            )}

            {/* =================================================
              HISTORY AND CULTURE
          ================================================= */}

            {form.category === "History and Culture" && (
              <Row className="g-3">
                <Col xs={12} md={6}>
                  <Form.Label className="fw-semibold">
                    Historical Period
                  </Form.Label>

                  <Form.Control
                    value={form.historical_period}
                    onChange={(e) => fc("historical_period", e.target.value)}
                    placeholder="e.g. Spanish Colonial Era"
                  />
                </Col>

                <Col xs={12}>
                  <Form.Label className="fw-semibold">
                    Historical / Cultural Significance
                  </Form.Label>

                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={form.significance}
                    onChange={(e) => fc("significance", e.target.value)}
                    placeholder="Explain the historical or cultural importance..."
                  />
                </Col>
              </Row>
            )}

            {/* =================================================
              INDUSTRIAL TOURISM
          ================================================= */}

            {form.category === "Industrial Tourism" && (
              <Row className="g-3">
                <Col xs={12}>
                  <Form.Label className="fw-semibold">
                    Industrial Activity
                  </Form.Label>

                  <Form.Control
                    value={form.industrial_activity}
                    onChange={(e) => fc("industrial_activity", e.target.value)}
                    placeholder="Describe the main industrial activity"
                  />
                </Col>

                <Col xs={12}>
                  <Form.Label className="fw-semibold">
                    Production Process
                  </Form.Label>

                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={form.production_process}
                    onChange={(e) => fc("production_process", e.target.value)}
                    placeholder="Describe the production process visitors can see"
                  />
                </Col>

                <Col xs={12}>
                  <Form.Label className="fw-semibold">
                    Visitor Access
                  </Form.Label>

                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={form.visitor_access}
                    onChange={(e) => fc("visitor_access", e.target.value)}
                    placeholder="Explain how visitors can access the site"
                  />
                </Col>
              </Row>
            )}

            {/* =================================================
              SHOPPING
          ================================================= */}

            {form.category === "Shopping" && (
              <Row className="g-3">
                <Col xs={12}>
                  <Form.Label className="fw-semibold">
                    Products Available
                  </Form.Label>

                  <Form.Control
                    value={form.products_available}
                    onChange={(e) => fc("products_available", e.target.value)}
                    placeholder="What can visitors buy here?"
                  />
                </Col>

                <Col xs={12}>
                  <Form.Label className="fw-semibold">
                    Local Products / Crafts
                  </Form.Label>

                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={form.local_products}
                    onChange={(e) => fc("local_products", e.target.value)}
                    placeholder="Describe local products, crafts, or souvenirs"
                  />
                </Col>
              </Row>
            )}

            {/* =================================================
              IMAGES
          ================================================= */}

            <hr className="my-4" />

            <div
              className="mb-3"
              style={{
                fontWeight: 700,

                fontSize: "1.05rem",

                color: darkMode ? "#e0e0e0" : "#1a5f4a",
              }}
            >
              <span className="admin-form-section-icon">
                <ImageIcon size={16} strokeWidth={2.1} />
              </span>
              <span>Images</span>
            </div>

            <Form.Label className="fw-semibold admin-image-upload-label">
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

            <small className="text-muted d-block mt-2">
              You can select one or multiple images at once.
            </small>

            {editing && getFormImageUrls().length > 0 && (
              <div className="mt-4">
                <div
                  className="fw-semibold mb-2"
                  style={{
                    color: darkMode ? "#e0e0e0" : "#495057",
                  }}
                >
                  Current Images
                </div>

                <Row className="g-2">
                  {getFormImageUrls().map((image, index) => (
                    <Col xs={6} md={4} lg={3} key={`${image}-${index}`}>
                      <div
                        style={{
                          position: "relative",
                          borderRadius: "10px",
                          overflow: "hidden",
                          border: darkMode
                            ? "1px solid #3a3a50"
                            : "1px solid #e5e9e6",
                          background: darkMode ? "#252538" : "#f8f9fa",
                        }}
                      >
                        <img
                          src={image}
                          alt={`Current attraction image ${index + 1}`}
                          style={{
                            width: "100%",
                            height: 120,
                            objectFit: "cover",
                            display: "block",
                          }}
                          onError={(event) => {
                            event.currentTarget.style.opacity = "0.35";
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          style={{
                            position: "absolute",
                            top: 6,
                            right: 6,
                            width: 28,
                            height: 28,
                            border: "none",
                            borderRadius: "50%",
                            background: "rgba(220,53,69,0.92)",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontWeight: 800,
                            fontSize: "0.85rem",
                            lineHeight: 1,
                          }}
                          aria-label={`Remove image ${index + 1}`}
                        >
                          ×
                        </button>

                        {index === 0 && (
                          <span
                            style={{
                              position: "absolute",
                              left: 6,
                              bottom: 6,
                              padding: "4px 7px",
                              borderRadius: "999px",
                              background: "rgba(26,95,74,0.92)",
                              color: "#fff",
                              fontSize: "0.62rem",
                              fontWeight: 700,
                            }}
                          >
                            Main Image
                          </span>
                        )}
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {imageFiles.length > 0 && (
              <div className="mt-4">
                <div
                  className="fw-semibold mb-2"
                  style={{
                    color: darkMode ? "#e0e0e0" : "#495057",
                  }}
                >
                  New Images
                </div>

                <Row className="g-2">
                  {imagePreviewUrls.map((preview, index) => (
                    <Col xs={6} md={4} lg={3} key={`${preview}-${index}`}>
                      <div
                        style={{
                          borderRadius: "10px",
                          overflow: "hidden",
                          border: darkMode
                            ? "1px solid #3a3a50"
                            : "1px solid #e5e9e6",
                          background: darkMode ? "#252538" : "#f8f9fa",
                        }}
                      >
                        <img
                          src={preview}
                          alt={`New image ${index + 1}`}
                          style={{
                            width: "100%",
                            height: 120,
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      </div>

                      <small
                        className="text-muted d-block mt-1"
                        style={{
                          fontSize: "0.65rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={imageFiles[index]?.name}
                      >
                        {imageFiles[index]?.name}
                      </small>
                    </Col>
                  ))}
                </Row>

                <small className="text-muted d-block mt-2">
                  {imageFiles.length} new image
                  {imageFiles.length !== 1 ? "s" : ""} selected.
                </small>
              </div>
            )}

            {/* =================================================
              TAGS
          ================================================= */}

            <div className="mt-3">
              <Form.Label className="fw-semibold">Tags</Form.Label>

              <Form.Control
                value={form.tags}
                onChange={(e) => fc("tags", e.target.value)}
                placeholder="nature, family-friendly, adventure"
              />
            </div>

            {/* =================================================
              SHOW ON WELCOME
          ================================================= */}

            <div
              className="mt-4 p-3"
              style={{
                background: darkMode ? "#252538" : "#f8f9fa",

                borderRadius: "10px",
              }}
            >
              <Form.Check
                type="checkbox"
                label={
                  <span className="admin-checkbox-label">
                    Show on Welcome Page
                  </span>
                }
                checked={Boolean(form.show_on_welcome)}
                onChange={(e) => fc("show_on_welcome", e.target.checked)}
                style={{
                  fontWeight: 600,
                }}
              />

              <small className="text-muted d-block mt-1">
                Enable this if this attraction should appear on the public
                welcome page.
              </small>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setShowModal(false);

                setError("");
              }}
              style={{
                borderRadius: "8px",
              }}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving || uploading}
              style={{
                background: CATEGORY_DESIGNS[form.category]?.gradient,

                border: "none",

                borderRadius: "8px",

                padding: "10px 24px",

                fontWeight: 600,
              }}
            >
              {uploading
                ? "Uploading Images..."
                : saving
                  ? "Saving..."
                  : editing
                    ? "Save Changes"
                    : "Save Attraction"}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* =====================================================
          DETAIL VIEW
      ===================================================== */}

        {viewItem && (
          <Modal
            className="admin-attractions-modal admin-attractions-detail-modal"
            show={!!viewItem}
            onHide={() => setViewItem(null)}
            size="lg"
            centered
            fullscreen="sm-down"
          >
            <Modal.Header closeButton>
              <Modal.Title className="admin-modal-title">
                {(viewItem as any).name}
              </Modal.Title>
            </Modal.Header>

            <Modal.Body>
              {(viewItem as any).images?.length > 0 && (
                <img
                  src={(viewItem as any).images[0]}
                  alt={(viewItem as any).name}
                  style={{
                    width: "100%",

                    height: 300,

                    objectFit: "cover",

                    borderRadius: "12px",

                    marginBottom: "20px",
                  }}
                />
              )}

              <div className="d-flex gap-2 flex-wrap mb-3">
                <Badge
                  style={{
                    background: getCategoryColor((viewItem as any).category),
                  }}
                >
                  {(viewItem as any).category}
                </Badge>

                {(viewItem as any).attraction_type && (
                  <Badge bg="light" text="dark">
                    {(viewItem as any).attraction_type === "Other"
                      ? (viewItem as any).other_attraction_type || "Other"
                      : (viewItem as any).attraction_type}
                  </Badge>
                )}

                {((viewItem as any).show_on_welcome ??
                  (viewItem as any).showOnWelcome) && (
                  <Badge
                    style={{
                      background: "#20c997",
                    }}
                  >
                    <Home size={12} strokeWidth={2.1} />
                    Welcome Page
                  </Badge>
                )}
              </div>

              <p>{(viewItem as any).description}</p>

              <hr />

              <p>
                <strong className="admin-detail-label">Address:</strong>{" "}
                {(viewItem as any).location_address || "Address not specified"}
              </p>

              <p>
                <strong className="admin-detail-label">Entrance Fee:</strong>{" "}
                {(viewItem as any).entrance_fee || "Not specified"}
              </p>

              <p>
                <strong className="admin-detail-label">
                  Operational Hours:
                </strong>{" "}
                {(viewItem as any).operational_hours ||
                  (viewItem as any).opening_hours ||
                  "Not specified"}
              </p>

              {(viewItem as any).best_time_to_visit && (
                <p>
                  <strong className="admin-detail-label">
                    Best Time to Visit:
                  </strong>{" "}
                  {(viewItem as any).best_time_to_visit}
                </p>
              )}

              {(viewItem as any).mobile && (
                <p>
                  <strong className="admin-detail-label">Mobile:</strong>{" "}
                  {(viewItem as any).mobile}
                </p>
              )}

              {(viewItem as any).contact_person && (
                <p>
                  <strong className="admin-detail-label">
                    Contact Person:
                  </strong>{" "}
                  {(viewItem as any).contact_person}
                </p>
              )}

              {(viewItem as any).attractions && (
                <div className="mb-3">
                  <strong className="admin-detail-label">Attractions:</strong>
                  <p className="mt-1">{(viewItem as any).attractions}</p>
                </div>
              )}

              {(viewItem as any).things_to_do && (
                <div className="mb-3">
                  <strong className="admin-detail-label">Things to Do:</strong>
                  <p className="mt-1">{(viewItem as any).things_to_do}</p>
                </div>
              )}

              {(viewItem as any).website && (
                <p>
                  <strong className="admin-detail-label">Website:</strong>{" "}
                  <a
                    href={(viewItem as any).website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {(viewItem as any).website}
                  </a>
                </p>
              )}

              {(viewItem as any).development_level && (
                <p>
                  <strong className="admin-detail-label">
                    Development Level:
                  </strong>{" "}
                  {(viewItem as any).development_level}
                </p>
              )}

              {(viewItem as any).online_connectivity && (
                <p>
                  <strong className="admin-detail-label">
                    Online Connectivity:
                  </strong>{" "}
                  {(viewItem as any).online_connectivity}
                </p>
              )}

              {(viewItem as any).mgt && (
                <p>
                  <strong className="admin-detail-label">MGT:</strong>{" "}
                  {(viewItem as any).mgt}
                </p>
              )}

              {buildGoogleMapsDirectionsUrl(viewItem) && (
                <div className="mt-4">
                  <Button
                    variant="success"
                    as="a"
                    href={buildGoogleMapsDirectionsUrl(viewItem)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: 600,
                    }}
                  >
                    <Navigation size={15} strokeWidth={2} />
                    Get Directions
                  </Button>
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

        {/* =====================================================
          CATEGORIES MODAL
      ===================================================== */}

        <Modal
          className="admin-attractions-modal"
          show={showCategoriesModal}
          onHide={() => setShowCategoriesModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title className="admin-modal-title">Categories</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Row className="g-3">
              {CATEGORIES.map((category) => {
                const count = items.filter(
                  (attraction: any) => attraction.category === category,
                ).length;

                return (
                  <Col xs={6} key={category}>
                    <Card
                      className="border-0 h-100"
                      style={{
                        borderRadius: "12px",

                        background: CATEGORY_DESIGNS[category]?.gradient,

                        color: "#fff",

                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setCategoryFilter(category);

                        setShowCategoriesModal(false);
                      }}
                    >
                      <Card.Body className="text-center">
                        <div
                          style={{
                            fontSize: "2rem",
                          }}
                        >
                          {React.createElement(getCategoryIcon(category), {
                            size: 29,
                            strokeWidth: 1.7,
                          })}
                        </div>

                        <div
                          style={{
                            fontWeight: 600,
                          }}
                        >
                          {category}
                        </div>

                        <div
                          style={{
                            fontSize: "1.5rem",

                            fontWeight: 700,
                          }}
                        >
                          {count}
                        </div>
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
          ACTIVE DESTINATIONS MODAL
      ===================================================== */}

        <Modal
          className="admin-attractions-modal"
          show={showActiveModal}
          onHide={() => setShowActiveModal(false)}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title className="admin-modal-title">Attractions</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Row className="g-3">
              {filteredItems.map((attraction: any) => (
                <Col xs={12} sm={6} key={attraction.id}>
                  <Card
                    className="border-0"
                    style={{
                      borderRadius: "12px",

                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setViewItem(attraction);

                      setShowActiveModal(false);
                    }}
                  >
                    <Card.Body>
                      <div className="d-flex align-items-center gap-3">
                        {attraction.images?.length > 0 && (
                          <img
                            src={attraction.images[0]}
                            alt={attraction.name}
                            style={{
                              width: 60,

                              height: 60,

                              borderRadius: "8px",

                              objectFit: "cover",
                            }}
                          />
                        )}

                        <div>
                          <h6 className="fw-bold mb-1">{attraction.name}</h6>

                          <Badge
                            style={{
                              background: getCategoryColor(attraction.category),
                            }}
                          >
                            {attraction.category}
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
                  style={{
                    width: 58,
                    height: 58,
                    margin: "0 auto 12px",
                    borderRadius: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#eef0ff",
                    color: CALBAYOG_BLUE,
                  }}
                >
                  <MapPinned size={29} strokeWidth={1.7} />
                </div>

                <p className="text-muted">No attractions found.</p>
              </div>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowActiveModal(false)}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminAttractions;
