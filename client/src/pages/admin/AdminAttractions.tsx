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
  ArrowDownUp,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock3,
  Compass,
  Edit3,
  Factory,
  FileText,
  Globe2,
  House,
  Image as ImageIcon,
  Info,
  Landmark,
  Leaf,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  SearchX,
  ShoppingBag,
  Sparkles,
  Ticket,
  Trash2,
  X,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";
import LocationPicker from "../../components/admin/LocationPicker";
import LocationPicker from "../../components/admin/LocationPicker";

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
   CATEGORY ICONS — MATCHES PUBLIC ATTRACTIONS UI
========================================================= */

const categoryIcons = {
  Nature: Leaf,
  "History and Culture": Landmark,
  "Industrial Tourism": Factory,
  Shopping: ShoppingBag,
  Other: MapPin,
};

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
    icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
    color: string;
    gradient: string;
    bgPattern: string;
  }
> = {
  Nature: {
    icon: Leaf,
    color: "#2D3195",
    gradient: "linear-gradient(135deg, #2D3195 0%, #545AC2 100%)",
    bgPattern:
      "linear-gradient(135deg, rgba(45,49,149,0.06), rgba(84,90,194,0.025))",
  },

  "History and Culture": {
    icon: Landmark,
    color: "#5256A8",
    gradient: "linear-gradient(135deg, #40458F 0%, #777CC9 100%)",
    bgPattern:
      "linear-gradient(135deg, rgba(64,69,143,0.06), rgba(119,124,201,0.025))",
  },

  "Industrial Tourism": {
    icon: Factory,
    color: "#486181",
    gradient: "linear-gradient(135deg, #344D78 0%, #6985A9 100%)",
    bgPattern:
      "linear-gradient(135deg, rgba(52,77,120,0.06), rgba(105,133,169,0.025))",
  },

  Shopping: {
    icon: ShoppingBag,
    color: "#6B5AA8",
    gradient: "linear-gradient(135deg, #51448F 0%, #8B7BCC 100%)",
    bgPattern:
      "linear-gradient(135deg, rgba(81,68,143,0.06), rgba(139,123,204,0.025))",
  },

  Other: {
    icon: MapPin,
    color: "#5E658E",
    gradient: "linear-gradient(135deg, #47506F 0%, #7D86A6 100%)",
    bgPattern:
      "linear-gradient(135deg, rgba(71,80,111,0.06), rgba(125,134,166,0.025))",
  },
};

/* =========================================================
   DEVELOPMENT / MANAGEMENT / CONNECTIVITY OPTIONS
========================================================= */

const DEVELOPMENT_LEVELS = ["Potential", "Emerging", "Existing", "Not Stated"];

const MGT_OPTIONS = [
  "Government Operated",
  "Private Operator",
  "Public Area - No Operating Centralized Management",
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

  /* LOCATION / BASIC DETAILS */
  location_address: "",
  location_lat: null as number | null,
  location_lng: null as number | null,

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
  email: "",

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
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%231a5f4a'/%3E%3Cstop offset='100%25' stop-color='%230d3d2e'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='500' fill='url(%23g)'/%3E%3Ccircle cx='690' cy='95' r='110' fill='rgba(255,255,255,0.08)'/%3E%3Cpath d='M-20 360 Q180 250 390 340 T820 350 L820 500 L-20 500 Z' fill='rgba(0,0,0,0.18)'/%3E%3Ctext x='400' y='210' text-anchor='middle' font-size='62' font-family='Arial, sans-serif' font-weight='700' fill='white'%3ECalbayog City Tourism%3C/text%3E%3C/svg%3E";

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
    --admin-bg: transparent;
    --admin-surface: #FFFFFF;
    --admin-border: #E8EAF1;
    --admin-text: #1B1D24;
    --admin-muted: #737886;

    min-height: 100vh;
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
    margin-bottom: 24px !important;
    padding: 0 0 4px;
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
    letter-spacing: 0.015em;
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
    min-height: 142px;
    overflow: hidden;
    border: 1px solid var(--admin-border) !important;
    border-radius: 18px !important;
    background: var(--admin-surface) !important;
    color: var(--admin-text) !important;
    box-shadow: 0 7px 24px rgba(26, 30, 53, 0.055);
    cursor: pointer;
    transition:
      transform 0.25s ease,
      box-shadow 0.25s ease,
      border-color 0.25s ease;
  }

  .admin-attractions-stats .admin-stat-card:hover {
    transform: translateY(-3px);
    border-color: rgba(45, 49, 149, 0.16) !important;
    box-shadow: 0 14px 32px rgba(26, 30, 53, 0.10);
  }

  .admin-attractions-stats .admin-stat-card .card-body {
    position: relative;
    padding: 17px 18px 16px !important;
  }

  .admin-stat-icon {
    width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
    border-radius: 10px;
  }

  .admin-stat-icon-primary {
    background: #EEF0FF;
    color: var(--admin-primary);
  }

  .admin-stat-icon-yellow {
    background: #FFF6DD;
    color: #B27600;
  }

  .admin-stat-icon-indigo {
    background: #F1F0FF;
    color: #625FB3;
  }

  .admin-stat-icon-purple {
    background: #F4F0FF;
    color: #7857B8;
  }

  .admin-stat-label {
    color: var(--admin-muted) !important;
    font-family: "Nunito", sans-serif !important;
    font-size: 0.64rem !important;
    font-weight: 900 !important;
    letter-spacing: 0.045em;
    text-transform: uppercase;
  }

  .admin-stat-value {
    margin-top: 4px;
    color: var(--admin-text) !important;
    font-family: "Poppins", sans-serif !important;
    font-size: 1.85rem !important;
    font-weight: 800 !important;
    line-height: 1;
  }

  .admin-stat-note {
    margin-top: 7px;
    color: #9AA0AC;
    font-family: "Nunito", sans-serif;
    font-size: 0.58rem;
    font-weight: 700;
    line-height: 1.35;
  }

  /* -------------------------------
     SEARCH / FILTER TOOLBAR
  -------------------------------- */

  .admin-attractions-toolbar {
    border: 1px solid var(--admin-border) !important;
    border-radius: 19px !important;
    background: #FFFFFF !important;
    box-shadow: 0 10px 30px rgba(26, 30, 53, 0.055) !important;
    overflow: visible !important;
  }

  .admin-attractions-toolbar .card-body {
    padding: 19px 20px 16px !important;
  }

  .admin-toolbar-heading {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
  }

  .admin-toolbar-heading-icon {
    width: 33px;
    height: 33px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    border-radius: 10px;
    background: #EEF0FF;
    color: var(--admin-primary);
  }

  .admin-attractions-toolbar-title {
    margin: 0 !important;
    color: var(--admin-text) !important;
    font-family: "Poppins", sans-serif !important;
    font-size: 0.82rem !important;
    font-weight: 800 !important;
  }

  .admin-toolbar-subtitle {
    margin-top: 2px;
    color: #9AA0AC;
    font-family: "Nunito", sans-serif;
    font-size: 0.60rem;
    font-weight: 700;
  }

  .admin-attractions-page .input-group,
  .admin-attractions-page .form-control,
  .admin-attractions-page .form-select {
    font-family: "Nunito", sans-serif !important;
  }

  .admin-search-group .input-group-text,
  .admin-search-group .form-control,
  .admin-search-group .btn {
    min-height: 42px !important;
    border-color: #E1E4EC !important;
    background: #FBFBFD !important;
    color: var(--admin-text) !important;
    box-shadow: none !important;
  }

  .admin-search-group .input-group-text {
    width: 43px;
    justify-content: center;
    border-radius: 11px 0 0 11px !important;
    color: var(--admin-primary) !important;
  }

  .admin-search-group .form-control {
    border-left: 0 !important;
    border-radius: 0 !important;
  }

  .admin-search-group .btn {
    border-left: 0 !important;
    border-radius: 0 11px 11px 0 !important;
    color: #8A909C !important;
  }

  .admin-search-group .form-control:focus {
    border-color: rgba(45, 49, 149, 0.50) !important;
    box-shadow: 0 0 0 3px rgba(45, 49, 149, 0.08) !important;
    background: #fff !important;
  }

  .admin-search-group .form-control::placeholder {
    color: #A0A5B0 !important;
  }

  .admin-filter-wrap {
    position: relative;
  }

  .admin-filter-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    display: inline-flex;
    color: #808695;
    pointer-events: none;
  }

  .admin-filter-wrap .form-select {
    width: 100%;
    min-height: 42px !important;
    padding-left: 34px !important;
    border: 1px solid #E1E4EC !important;
    border-radius: 11px !important;
    background: #FBFBFD !important;
    color: var(--admin-text) !important;
    box-shadow: none !important;
    font-size: 0.69rem !important;
    font-weight: 700 !important;
  }

  .admin-filter-wrap .form-select:focus {
    border-color: rgba(45, 49, 149, 0.50) !important;
    box-shadow: 0 0 0 3px rgba(45, 49, 149, 0.08) !important;
    background: #fff !important;
  }

  .admin-toolbar-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 13px;
    padding-top: 12px;
    border-top: 1px solid #EFF1F5;
  }

  .admin-toolbar-result {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #8D93A0;
    font-family: "Nunito", sans-serif;
    font-size: 0.61rem;
    font-weight: 700;
  }

  .admin-toolbar-result svg {
    color: #7080C6;
  }

  .admin-toolbar-result strong {
    color: var(--admin-text);
    font-weight: 900;
  }

  .admin-clear-filters {
    margin: 0;
    padding: 0 !important;
    color: var(--admin-primary) !important;
    font-family: "Nunito", sans-serif !important;
    font-size: 0.62rem !important;
    font-weight: 900 !important;
    text-decoration: none !important;
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

  .admin-attractions-page .admin-attraction-card .badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .admin-attraction-welcome-inline-badge {
    background: #FFF6DD !important;
    color: #9A6B00 !important;
  }

  .admin-attraction-card-actions .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .admin-empty-icon {
    width: 64px;
    height: 64px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
    border-radius: 18px;
    background: #EEF0FF;
    color: var(--admin-primary);
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
    display: inline-flex;
    align-items: center;
    gap: 8px;
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
    display: flex;
    align-items: center;
    gap: 7px;
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
    --admin-bg: transparent;
    --admin-surface: #191C2B;
    --admin-border: #2B3042;
    --admin-text: #F1F3F8;
    --admin-muted: #A8AFBF;
    background: transparent;
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
      padding: 0 0 48px;
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
      padding: 0 0 42px;
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
      padding-left: 0;
      padding-right: 0;
    }

    .admin-attraction-image-shell {
      height: 180px;
    }
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
          attraction.email,
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
    const urls = imageFiles.map((file) =>
      URL.createObjectURL(file),
    );

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
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "10px",
            }}
          >
            {React.createElement(design.icon, {
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
     AUTO-FILL SAVED ADDRESS WHEN THE ATTRACTION NAME ALREADY EXISTS
  ========================================================= */

  useEffect(() => {
    const typedName = String(form.name || "").trim();
    const currentAddress = String(form.location_address || "").trim();

    if (!typedName || currentAddress) return;

    const normalizedName = typedName.toLowerCase().replace(/\s+/g, " ");
    const existing = items.find((item: any) => {
      return String(item.name || "").trim().toLowerCase().replace(/\s+/g, " ") === normalizedName;
    }) as any;

    const existingAddress = String(existing?.location_address || "").trim();

    if (existingAddress) {
      setForm((previous: any) => {
        if (String(previous.location_address || "").trim()) return previous;
        return { ...previous, location_address: existingAddress };
      });
    }
  }, [form.name, form.location_address, items]);

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

      /* LOCATION / BASIC DETAILS */
      location_address: d.location_address || "",
      location_lat: typeof d.location_lat === "number" ? d.location_lat : Number.isFinite(Number(d.location_lat)) ? Number(d.location_lat) : null,
      location_lng: typeof d.location_lng === "number" ? d.location_lng : Number.isFinite(Number(d.location_lng)) ? Number(d.location_lng) : null,

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
      email: d.email || "",

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
            new Set(
              [...imageUrls, ...uploadedUrls].filter(Boolean),
            ),
          );
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);

          setError(
            "Image upload failed. The existing images were kept.",
          );
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
        location_lat: typeof form.location_lat === "number" ? form.location_lat : null,
        location_lng: typeof form.location_lng === "number" ? form.location_lng : null,

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
        email: form.email?.trim() || "",

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
      Nature: "#2D3195",
      "History and Culture": "#575CAA",
      "Industrial Tourism": "#536E90",
      Shopping: "#6F5AA8",
      Other: "#687294",
    };

    return colors[category] || CALBAYOG_BLUE;
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

      <div className="admin-attractions-heading d-flex justify-content-between align-items-center">
        <div>
          <div className="admin-attractions-eyebrow">
            CONTENT MANAGEMENT
          </div>

          <h2
            className="admin-attractions-title"
          >
            ATTRACTIONS
          </h2>

          <p className="admin-attractions-subtitle">
            Manage Calbayog City tourism attractions, images, details,
            and public visibility from one place.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={openCreate}
          className="admin-attractions-add-button"
        >
          <Plus size={16} strokeWidth={2.2} />
          Add Attraction
        </Button>
      </div>

      {/* =====================================================
          STATS
      ===================================================== */}

      <Row className="g-3 mb-4 admin-attractions-stats">
        <Col xs={6} md={3}>
          <Card
            className="border-0 h-100 admin-stat-card"
            onClick={() => {
              setSearchTerm("");
              setCategoryFilter("All");
              setAttractionFilter("All");
            }}
          >
            <Card.Body>
              <div className="admin-stat-icon admin-stat-icon-primary">
                <MapPin size={17} strokeWidth={1.9} />
              </div>
              <div className="admin-stat-label">Total Attractions</div>
              <div className="admin-stat-value">{items.length}</div>
              <div className="admin-stat-note">Published in the tourism directory</div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={6} md={3}>
          <Card className="border-0 h-100 admin-stat-card">
            <Card.Body>
              <div className="admin-stat-icon admin-stat-icon-yellow">
                <House size={17} strokeWidth={1.9} />
              </div>
              <div className="admin-stat-label">Show on Welcome</div>
              <div className="admin-stat-value">
                {items.filter((d: any) =>
                  Boolean(d.show_on_welcome ?? d.showOnWelcome),
                ).length}
              </div>
              <div className="admin-stat-note">Featured on the welcome page</div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={6} md={3}>
          <Card
            className="border-0 h-100 admin-stat-card"
            onClick={() => setShowCategoriesModal(true)}
          >
            <Card.Body>
              <div className="admin-stat-icon admin-stat-icon-indigo">
                <Landmark size={17} strokeWidth={1.9} />
              </div>
              <div className="admin-stat-label">Categories</div>
              <div className="admin-stat-value">{categoryCount}</div>
              <div className="admin-stat-note">Tourism categories in use</div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={6} md={3}>
          <Card
            className="border-0 h-100 admin-stat-card"
            onClick={() => setShowActiveModal(true)}
          >
            <Card.Body>
              <div className="admin-stat-icon admin-stat-icon-purple">
                <BarChart3 size={17} strokeWidth={1.9} />
              </div>
              <div className="admin-stat-label">Currently Showing</div>
              <div className="admin-stat-value">{filteredItems.length}</div>
              <div className="admin-stat-note">Matches current filters</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* =====================================================
          SEARCH / FILTER / SORT
      ===================================================== */}

      <Card className="border-0 mb-4 admin-attractions-toolbar">
        <Card.Body>
          <div className="admin-toolbar-heading">
            <div className="admin-toolbar-heading-icon">
              <Search size={16} strokeWidth={2} />
            </div>
            <div>
              <div className="admin-attractions-toolbar-title">Find an Attraction</div>
              <div className="admin-toolbar-subtitle">Search, filter, and organize attraction records.</div>
            </div>
          </div>

          <Row className="g-3">
            <Col xs={12} lg={5}>
              <InputGroup className="admin-search-group">
                <InputGroup.Text>
                  <Search size={16} strokeWidth={1.9} />
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
                    <X size={15} strokeWidth={2} />
                  </Button>
                )}
              </InputGroup>
            </Col>

            <Col xs={12} sm={6} lg={2.5}>
              <div className="admin-filter-wrap">
                <div className="admin-filter-icon">
                  <Globe2 size={14} strokeWidth={1.9} />
                </div>
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
              </div>
            </Col>

            <Col xs={12} sm={6} lg={2.5}>
              <div className="admin-filter-wrap">
                <div className="admin-filter-icon">
                  <Sparkles size={14} strokeWidth={1.9} />
                </div>
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
              </div>
            </Col>

            <Col xs={12} lg={2}>
              <div className="admin-filter-wrap">
                <div className="admin-filter-icon">
                  <ArrowDownUp size={14} strokeWidth={1.9} />
                </div>
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
              </div>
            </Col>
          </Row>

          <div className="admin-toolbar-footer">
            <div className="admin-toolbar-result">
              <CheckCircle2 size={14} strokeWidth={1.9} />
              <span>Showing <strong>{filteredItems.length}</strong> of {items.length} attractions</span>
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
        <div className="text-center py-5">
          <Spinner
            animation="border"
            style={{
              color: darkMode ? "#4ade80" : "#1a5f4a",
            }}
          />

          <p className="mt-3">Loading attractions...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div
          className="text-center py-5"
          style={{
            background: darkMode ? "#1e1e2e" : "#fff",

            borderRadius: "12px",
          }}
        >
          <div
            style={{
              fontSize: "3rem",
            }}
          >
            <SearchX size={34} strokeWidth={1.6} />
          </div>

          <p
            className="mb-0"
            style={{
              color: darkMode ? "#e0e0e0" : "#495057",

              fontWeight: 600,
            }}
          >
            No attractions found
          </p>
        </div>
      ) : (
        <Row className="g-3 g-md-4">
          {filteredItems.map((attraction: any, index: number) => {
            const attractionImages = getAttractionImages(attraction);
            const firstImage = attractionImages[0];

            return (
              <Col xs={12} sm={6} lg={4} xl={3} key={attraction.id}>
                <Card
                  className="h-100 border-0 admin-attraction-card"
                  style={{
                    animationDelay: `${Math.min(index * 55, 440)}ms`,
                  }}
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
                        style={{
                          height: "100%",
                          width: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />

                      <div className="admin-attraction-image-overlay" />

                      {(attraction.show_on_welcome ??
                        attraction.showOnWelcome) && (
                        <span className="admin-attraction-welcome-badge">
                          Welcome
                        </span>
                      )}

                      {attractionImages.length > 1 && (
                        <span className="admin-attraction-image-count">
                          <ImageIcon size={13} strokeWidth={1.9} />
                          {attractionImages.length}
                        </span>
                      )}
                    </div>
                  ) : (
                    getAttractionPlaceholder(attraction)
                  )}

                  <Card.Body className="p-3 d-flex flex-column">
                    <div className="d-flex gap-1 flex-wrap mb-2">
                      <Badge
                        style={{
                          background: "#EEF0FF",
                          color: CALBAYOG_BLUE,
                        }}
                      >
                        {(() => {
                          const CategoryIcon =
                            categoryIcons[attraction.category as keyof typeof categoryIcons] || MapPin;
                          return <CategoryIcon size={12} strokeWidth={1.9} />;
                        })()}
                        {attraction.category}
                      </Badge>

                      {attraction.attraction_type && (
                        <Badge
                          bg="light"
                          text="dark"
                          style={{
                            borderRadius: "999px",
                            padding: "5px 9px",
                            fontWeight: 500,
                          }}
                        >
                          {attraction.attraction_type}
                        </Badge>
                      )}

                      {(attraction.show_on_welcome ??
                        attraction.showOnWelcome) && (
                        <Badge className="admin-attraction-welcome-inline-badge">
                          <House size={11} strokeWidth={1.9} />
                          Welcome
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
                      <MapPin size={14} strokeWidth={1.9} />
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
                        style={{
                          borderRadius: "7px",
                          flex: 1,
                          fontWeight: 600,
                          fontSize: "0.76rem",
                        }}
                      >
                        <Edit3 size={14} strokeWidth={1.9} />
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDelete(attraction.id)}
                        style={{
                          borderRadius: "7px",
                          fontWeight: 600,
                          minWidth: "42px",
                        }}
                      >
                        <Trash2 size={14} strokeWidth={1.9} />
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
        <Modal.Header closeButton>
          <Modal.Title
            style={{
              fontFamily: "Poppins, serif",

              fontWeight: 600,
            }}
          >
            {React.createElement(
              CATEGORY_DESIGNS[form.category]?.icon || MapPin,
              { size: 18, strokeWidth: 1.9 },
            )}
            {editing ? "Edit Attraction" : "Add Attraction"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}

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
            <><FileText size={16} strokeWidth={1.9} /> Basic Information</>
          </div>

          <Row className="g-3">
            <Col xs={12} md={8}>
              <Form.Label className="fw-semibold">Attraction Name *</Form.Label>

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
                    {category}
                  </option>
                ))}
              </Form.Select>
            </Col>

            <Col xs={12} md={6}>
              <Form.Label className="fw-semibold">Attraction Type *</Form.Label>

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
                  onChange={(e) => fc("other_attraction_type", e.target.value)}
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
            <><Compass size={16} strokeWidth={1.9} /> Visitor Information</>
          </div>

          <Row className="g-3">
            <Col xs={12}>
              <Form.Label className="fw-semibold">Address</Form.Label>

              <Form.Control
                value={form.location_address}
                onChange={(e) => fc("location_address", e.target.value)}
                placeholder="Enter attraction address"
              />
              <Form.Text className="text-muted">
                If this attraction already exists in the system, its saved address can be filled automatically when the attraction name matches.
              </Form.Text>
            </Col>

            <Col xs={12}>
              <LocationPicker
                name={form.name}
                latitude={form.location_lat}
                longitude={form.location_lng}
                address={form.location_address}
                category={form.category}
                attractionType={form.attraction_type}
                searchablePlaces={items.map((item: any) => ({
                  id: item.id,
                  name: item.name,
                  address: item.location_address,
                }))}
                onChange={({ latitude, longitude, address }) => {
                  fc("location_lat", latitude);
                  fc("location_lng", longitude);
                  if (address) fc("location_address", address);
                }}
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
            <><Globe2 size={16} strokeWidth={1.9} /> Tourism Information</>
          </div>

          <Row className="g-3">
            <Col xs={12} md={4}>
              <Form.Label className="fw-semibold">Development Level</Form.Label>

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
            <><Phone size={16} strokeWidth={1.9} /> Contact Details</>
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
              <Form.Label className="fw-semibold">Email</Form.Label>
              <Form.Control
                type="email"
                value={form.email}
                onChange={(e) => fc("email", e.target.value)}
                placeholder="example@email.com"
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
            <><Info size={16} strokeWidth={1.9} /> Attraction Information</>
          </div>

          <Row className="g-3">
            <Col xs={12} md={6}>
              <Form.Label className="fw-semibold">Operational Hours</Form.Label>
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
            className="mb-3"
            style={{
              background: CATEGORY_DESIGNS[form.category]?.gradient,

              color: "#fff",

              padding: "12px 16px",

              borderRadius: "8px",

              fontWeight: 600,
            }}
          >
            {CATEGORY_DESIGNS[form.category]?.icon} {form.category}
            Attraction Details
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
                    <Form.Label className="fw-semibold">Best Season</Form.Label>

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
                      onChange={(e) => fc("activities_allowed", e.target.value)}
                      placeholder="Hiking, swimming, camping, diving..."
                    />
                  </Col>

                  <Col xs={12}>
                    <Form.Check
                      type="checkbox"
                      label="Swimming Allowed"
                      checked={Boolean(form.swimming_allowed)}
                      onChange={(e) => fc("swimming_allowed", e.target.checked)}
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
                <Form.Label className="fw-semibold">Visitor Access</Form.Label>

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
            <><ImageIcon size={16} strokeWidth={1.9} /> Images</>
          </div>

          <Form.Label className="fw-semibold">
            Add Images
          </Form.Label>

          <Form.Control
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => {
              const target = e.target as HTMLInputElement;

              setImageFiles(
                Array.from(target.files || []),
              );
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
                  <Col
                    xs={6}
                    md={4}
                    lg={3}
                    key={`${image}-${index}`}
                  >
                    <div
                      style={{
                        position: "relative",
                        borderRadius: "10px",
                        overflow: "hidden",
                        border: darkMode
                          ? "1px solid #3a3a50"
                          : "1px solid #e5e9e6",
                        background: darkMode
                          ? "#252538"
                          : "#f8f9fa",
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
                  <Col
                    xs={6}
                    md={4}
                    lg={3}
                    key={`${preview}-${index}`}
                  >
                    <div
                      style={{
                        borderRadius: "10px",
                        overflow: "hidden",
                        border: darkMode
                          ? "1px solid #3a3a50"
                          : "1px solid #e5e9e6",
                        background: darkMode
                          ? "#252538"
                          : "#f8f9fa",
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
                <>
                  <House size={14} strokeWidth={1.9} /> Show on Welcome Page
                </>
              }
              checked={Boolean(form.show_on_welcome)}
              onChange={(e) => fc("show_on_welcome", e.target.checked)}
              style={{
                fontWeight: 600,
              }}
            />

            <small className="text-muted d-block mt-1">
              Enable this if this attraction should appear on the public welcome
              page.
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
            <Modal.Title>
              {CATEGORY_DESIGNS[(viewItem as any).category]?.icon}{" "}
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
                  <><House size={12} strokeWidth={1.9} /> Welcome Page</>
                </Badge>
              )}
            </div>

            <p>{(viewItem as any).description}</p>

            <hr />

            <p>
              <strong><MapPin size={13} strokeWidth={1.9} /> Address:</strong>{" "}
              {(viewItem as any).location_address || "Address not specified"}
            </p>

            <p>
              <strong><Ticket size={13} strokeWidth={1.9} /> Entrance Fee:</strong>{" "}
              {(viewItem as any).entrance_fee || "Not specified"}
            </p>

            <p>
              <strong><Clock3 size={13} strokeWidth={1.9} /> Operational Hours:</strong>{" "}
              {(viewItem as any).operational_hours ||
                (viewItem as any).opening_hours ||
                "Not specified"}
            </p>

            {(viewItem as any).best_time_to_visit && (
              <p>
                <strong><Leaf size={13} strokeWidth={1.9} /> Best Time to Visit:</strong>{" "}
                {(viewItem as any).best_time_to_visit}
              </p>
            )}

            {(viewItem as any).mobile && (
              <p>
                <strong><Phone size={13} strokeWidth={1.9} /> Mobile:</strong> {(viewItem as any).mobile}
              </p>
            )}

            {(viewItem as any).email && (
              <p>
                <strong><Mail size={13} strokeWidth={1.9} /> Email:</strong> {(viewItem as any).email}
              </p>
            )}

            {(viewItem as any).attractions && (
              <div className="mb-3">
                <strong><Landmark size={13} strokeWidth={1.9} /> Attractions:</strong>
                <p className="mt-1">{(viewItem as any).attractions}</p>
              </div>
            )}

            {(viewItem as any).things_to_do && (
              <div className="mb-3">
                <strong><Compass size={13} strokeWidth={1.9} /> Things to Do:</strong>
                <p className="mt-1">{(viewItem as any).things_to_do}</p>
              </div>
            )}

            {(viewItem as any).website && (
              <p>
                <strong><Globe2 size={13} strokeWidth={1.9} /> Website:</strong>{" "}
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
                <strong><BarChart3 size={13} strokeWidth={1.9} /> Development Level:</strong>{" "}
                {(viewItem as any).development_level}
              </p>
            )}

            {(viewItem as any).online_connectivity && (
              <p>
                <strong><Globe2 size={13} strokeWidth={1.9} /> Online Connectivity:</strong>{" "}
                {(viewItem as any).online_connectivity}
              </p>
            )}

            {(viewItem as any).mgt && (
              <p>
                <strong><Building2 size={13} strokeWidth={1.9} /> MGT:</strong> {(viewItem as any).mgt}
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
                  <><Compass size={14} strokeWidth={1.9} /> Get Directions</>
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
          <Modal.Title><Landmark size={18} strokeWidth={1.9} /> Categories</Modal.Title>
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
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: "7px",
                        }}
                      >
                        {React.createElement(
                          CATEGORY_DESIGNS[category]?.icon || MapPin,
                          { size: 30, strokeWidth: 1.7 },
                        )}
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
          <Modal.Title><MapPin size={18} strokeWidth={1.9} /> Attractions</Modal.Title>
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
              <div className="admin-empty-icon">
                <SearchX size={30} strokeWidth={1.7} />
              </div>

              <p className="text-muted">No attractions found.</p>
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

export default AdminAttractions;
