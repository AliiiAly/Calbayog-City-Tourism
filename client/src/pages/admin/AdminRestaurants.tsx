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
  Check,
  Clock3,
  Eye,
  Image as ImageIcon,
  Layers3,
  MapPin,
  MapPinned,
  Pencil,
  Phone,
  Plus,
  Search,
  SlidersHorizontal,
  Tag,
  Trash2,
  UtensilsCrossed,
  X,
  Globe,
  DollarSign,
  Star,
  Store,
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

/* =========================================================
   CONSTANTS
========================================================= */

const CALBAYOG_BLUE = "#2D3195";
const ADMIN_YELLOW = "#FFB71B";

const DEFAULT_RESTAURANT_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%232D3195'/%3E%3Cstop offset='100%25' stop-color='%23171955'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='500' fill='url(%23g)'/%3E%3Ccircle cx='690' cy='95' r='110' fill='rgba(255,255,255,0.08)'/%3E%3Cpath d='M-20 360 Q180 250 390 340 T820 350 L820 500 L-20 500 Z' fill='rgba(0,0,0,0.18)'/%3E%3Ctext x='400' y='210' text-anchor='middle' font-size='62' font-family='Arial,sans-serif' font-weight='700' fill='white'%3ECalbayog%3C/text%3E%3Ctext x='400' y='278' text-anchor='middle' font-size='30' font-family='Arial,sans-serif' fill='rgba(255,255,255,0.8)'%3EDining%3C/text%3E%3C/svg%3E";

const CUISINE_OPTIONS = [
  "Filipino",
  "Seafood",
  "Asian",
  "Chinese",
  "Japanese",
  "Korean",
  "Italian",
  "American",
  "Fast Food",
  "Cafe",
  "Bakery",
  "Desserts",
  "Barbecue",
  "Vegetarian",
  "Other",
];

const SORT_OPTIONS = [
  { value: "name-asc", label: "A–Z: Name" },
  { value: "name-desc", label: "Z–A: Name" },
  { value: "newest", label: "Newest Added" },
  { value: "oldest", label: "Oldest Added" },
];

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

/* =========================================================
   STYLES
   Matches the Admin Attractions design system.
========================================================= */

const ADMIN_RESTAURANTS_STYLES = `
@font-face {
  font-family: "Barabara";
  src: url("/fonts/BARABARA-final.otf") format("opentype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

.admin-restaurants-page {
  --admin-primary: #2D3195;
  --admin-primary-dark: #242879;
  --admin-yellow: #FFB71B;
  --admin-surface: #FFFFFF;
  --admin-border: #E8EAF1;
  --admin-text: #1B1D24;
  --admin-muted: #737886;

  width: 100%;
  min-height: 100vh;
  padding: 0 0 56px;
  color: var(--admin-text);
  font-family: "Nunito", "Poppins", "Segoe UI", sans-serif;
}

.admin-restaurants-page *,
.admin-restaurants-page *::before,
.admin-restaurants-page *::after {
  box-sizing: border-box;
}

.admin-restaurants-page .admin-restaurants-heading {
  align-items: flex-end !important;
  gap: 22px;
  margin: 0 0 26px !important;
  padding-bottom: 6px;
}

.admin-restaurants-page .admin-restaurants-eyebrow {
  margin-bottom: 5px;
  color: var(--admin-primary);
  font-family: "Nunito", sans-serif;
  font-size: .66rem;
  font-weight: 900;
  letter-spacing: .16em;
  text-transform: uppercase;
}

.admin-restaurants-page .admin-restaurants-title {
  margin: 0 !important;
  color: var(--admin-primary) !important;
  font-family: "Barabara", sans-serif !important;
  font-size: clamp(1.65rem, 2.8vw, 2.4rem) !important;
  font-weight: 400 !important;
  line-height: .95 !important;
  letter-spacing: .02em;
}

.admin-restaurants-page .admin-restaurants-subtitle {
  max-width: 780px;
  margin: 8px 0 0 !important;
  color: var(--admin-muted) !important;
  font-family: "Nunito", sans-serif !important;
  font-size: .80rem !important;
  font-weight: 600 !important;
  line-height: 1.55 !important;
}

.admin-restaurants-page .admin-restaurants-add-button {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 46px;
  padding: 11px 19px !important;
  border: 0 !important;
  border-radius: 13px !important;
  background: var(--admin-primary) !important;
  color: #fff !important;
  box-shadow: 0 10px 24px rgba(45,49,149,.20);
  font-family: "Nunito", sans-serif !important;
  font-size: .76rem !important;
  font-weight: 900 !important;
  transition: transform .2s ease, box-shadow .2s ease;
}

.admin-restaurants-page .admin-restaurants-add-button:hover {
  background: var(--admin-primary-dark) !important;
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(45,49,149,.24);
}

.admin-restaurants-page .admin-restaurants-stats {
  margin-bottom: 24px !important;
}

.admin-restaurants-page .admin-stat-card {
  position: relative;
  min-height: 132px !important;
  overflow: hidden;
  border: 1px solid var(--admin-border) !important;
  border-radius: 18px !important;
  background: var(--admin-surface) !important;
  color: var(--admin-text) !important;
  box-shadow: 0 7px 24px rgba(26,30,53,.055) !important;
  transition: transform .25s ease, box-shadow .25s ease;
}

.admin-restaurants-page .admin-stat-card::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 4px;
  background: var(--admin-primary);
  content: "";
}

.admin-restaurants-page .admin-restaurants-stats > .col:nth-child(2) .admin-stat-card::before {
  background: var(--admin-yellow);
}

.admin-restaurants-page .admin-restaurants-stats > .col:nth-child(3) .admin-stat-card::before {
  background: #43A77A;
}

.admin-restaurants-page .admin-restaurants-stats > .col:nth-child(4) .admin-stat-card::before {
  background: #7076D8;
}

.admin-restaurants-page .admin-stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 32px rgba(26,30,53,.10) !important;
}

.admin-restaurants-page .admin-stat-card .card-body {
  padding: 17px 18px 16px !important;
}

.admin-restaurants-page .admin-stat-card-top {
  display: flex;
  align-items: center;
  gap: 9px;
}

.admin-restaurants-page .admin-stat-icon {
  display: inline-flex;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}

.admin-restaurants-page .admin-stat-icon-blue {
  background: #EEF0FF;
  color: #2D3195;
}

.admin-restaurants-page .admin-stat-icon-yellow {
  background: #FFF5D9;
  color: #8A6500;
}

.admin-restaurants-page .admin-stat-icon-green {
  background: #E9F8F0;
  color: #167447;
}

.admin-restaurants-page .admin-stat-icon-purple {
  background: #F0EDFF;
  color: #6C51B8;
}

.admin-restaurants-page .admin-stat-label {
  color: var(--admin-muted);
  font-size: .67rem;
  font-weight: 900;
  letter-spacing: .035em;
  text-transform: uppercase;
}

.admin-restaurants-page .admin-stat-value {
  margin-top: 12px;
  color: var(--admin-text);
  font-family: "Poppins", sans-serif;
  font-size: 1.95rem;
  font-weight: 800;
  line-height: 1;
}

.admin-restaurants-page .admin-stat-caption {
  margin-top: 7px;
  color: var(--admin-muted);
  font-size: .63rem;
  font-weight: 600;
}

.admin-restaurants-page .admin-restaurants-toolbar {
  overflow: visible !important;
  border: 1px solid var(--admin-border) !important;
  border-radius: 19px !important;
  background: rgba(255,255,255,.92) !important;
  box-shadow: 0 10px 30px rgba(26,30,53,.055) !important;
}

.admin-restaurants-page .admin-restaurants-toolbar .card-body {
  padding: 20px !important;
}

.admin-restaurants-page .admin-toolbar-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  padding: 14px 16px;
  border: 1px solid rgba(45,49,149,.09);
  border-radius: 14px;
  background: linear-gradient(135deg,#f8f8ff 0%,#fff 70%);
}

.admin-restaurants-page .admin-filter-heading-main {
  display: flex;
  align-items: center;
  gap: 11px;
}

.admin-restaurants-page .admin-toolbar-heading-icon {
  display: inline-flex;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: #EEF0FF;
  color: #2D3195;
}

.admin-restaurants-page .admin-toolbar-title {
  margin: 0 0 2px;
  color: var(--admin-text);
  font-family: "Poppins", sans-serif;
  font-size: .84rem;
  font-weight: 800;
}

.admin-restaurants-page .admin-toolbar-caption {
  color: #858B98;
  font-size: .66rem;
  font-weight: 600;
}

.admin-restaurants-page .admin-filter-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border-radius: 999px;
  background: #FFF5D9;
  color: #806000;
  font-size: .62rem;
  font-weight: 900;
  white-space: nowrap;
}

.admin-restaurants-page .admin-filter-group {
  min-height: 44px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(26,30,53,.035);
}

.admin-restaurants-page .admin-filter-group .admin-filter-icon {
  display: flex;
  width: 42px;
  justify-content: center;
  border: 1px solid #E1E4EC !important;
  border-right: 0 !important;
  border-radius: 12px 0 0 12px !important;
  background: #F4F5FB !important;
  color: #2D3195 !important;
}

.admin-restaurants-page .admin-filter-group .form-control,
.admin-restaurants-page .admin-filter-group .form-select {
  min-height: 44px !important;
  border-color: #E1E4EC !important;
  border-radius: 0 12px 12px 0 !important;
  background-color: #FBFBFD !important;
  color: var(--admin-text) !important;
  font-family: "Nunito", sans-serif !important;
  font-size: .70rem !important;
  box-shadow: none !important;
}

.admin-restaurants-page .admin-search-group .form-control {
  padding-left: 12px !important;
}

.admin-restaurants-page .admin-search-group .btn {
  min-width: 43px;
  border-radius: 0 12px 12px 0 !important;
  border-color: #E1E4EC !important;
  background: #F8F8FF !important;
  color: #2D3195 !important;
}

.admin-restaurants-page .admin-filter-group:focus-within .admin-filter-icon {
  border-color: rgba(45,49,149,.5) !important;
  background: #EEF0FF !important;
}

.admin-restaurants-page .admin-active-filters {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
  margin-top: 13px;
  padding-top: 12px;
  border-top: 1px dashed #E6E8EF;
}

.admin-restaurants-page .admin-active-filters-label {
  color: #858B98;
  font-size: .62rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .05em;
}

.admin-restaurants-page .admin-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 9px;
  border: 1px solid rgba(45,49,149,.1);
  border-radius: 999px;
  background: #EEF0FF;
  color: #2D3195;
  font-size: .61rem;
  font-weight: 800;
}

.admin-restaurants-page .admin-toolbar-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 15px;
  padding-top: 13px;
  border-top: 1px solid #EEF0F4;
}

.admin-restaurants-page .admin-toolbar-result-count {
  color: var(--admin-muted);
  font-size: .66rem;
  font-weight: 600;
}

.admin-restaurants-page .admin-toolbar-result-count strong {
  color: var(--admin-primary);
  font-weight: 900;
}

.admin-restaurants-page .admin-clear-filters {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 !important;
  color: var(--admin-primary) !important;
  font-size: .68rem !important;
  font-weight: 900 !important;
  text-decoration: none !important;
}

.admin-restaurants-page .admin-restaurant-card {
  position: relative;
  width: 100%;
  min-height: 100%;
  overflow: hidden;
  border: 1px solid var(--admin-border) !important;
  border-radius: 19px !important;
  background: #fff !important;
  box-shadow: 0 7px 24px rgba(26,30,53,.065) !important;
  cursor: pointer;
  animation: adminRestaurantCardIn .45s ease both;
  transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
}

.admin-restaurants-page .admin-restaurant-card:hover {
  transform: translateY(-5px);
  border-color: rgba(45,49,149,.18) !important;
  box-shadow: 0 18px 40px rgba(26,30,53,.12) !important;
}

.admin-restaurants-page .admin-restaurant-image-shell {
  position: relative;
  height: 196px;
  overflow: hidden;
  border-radius: 19px 19px 0 0;
  background: #EEF0FF;
}

.admin-restaurants-page .admin-restaurant-card-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .65s cubic-bezier(.2,.65,.3,1);
}

.admin-restaurants-page .admin-restaurant-card:hover .admin-restaurant-card-image {
  transform: scale(1.045);
}

.admin-restaurants-page .admin-restaurant-image-overlay {
  position: absolute;
  inset: auto 0 0;
  height: 72px;
  background: linear-gradient(180deg,transparent 0%,rgba(10,12,25,.38) 100%);
  pointer-events: none;
}

.admin-restaurants-page .admin-restaurant-image-count {
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
  background: rgba(15,17,28,.56);
  color: #fff;
  backdrop-filter: blur(9px);
  font-size: .61rem;
  font-weight: 900;
}

.admin-restaurants-page .admin-restaurant-featured-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 4;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 9px;
  border-radius: 999px;
  background: rgba(255,183,27,.96);
  color: #4D3500;
  box-shadow: 0 7px 18px rgba(0,0,0,.11);
  font-size: .61rem;
  font-weight: 900;
}

.admin-restaurants-page .admin-restaurant-placeholder {
  display: flex;
  height: 196px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 9px;
  background: linear-gradient(135deg,#EEF0FF,#F9F9FF);
  color: #555AAE;
}

.admin-restaurants-page .admin-restaurant-placeholder span {
  font-size: .65rem;
  font-weight: 800;
}

.admin-restaurants-page .admin-restaurant-card .card-body {
  display: flex;
  min-height: 205px;
  flex-direction: column;
  padding: 16px !important;
}

.admin-restaurants-page .admin-restaurant-badge-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 7px;
}

.admin-restaurants-page .admin-restaurant-card .badge {
  padding: 5px 9px !important;
  border: 0;
  border-radius: 999px !important;
  font-family: "Nunito", sans-serif !important;
  font-size: .58rem !important;
  font-weight: 900 !important;
}

.admin-restaurants-page .admin-restaurant-cuisine-badge {
  background: #EEF0FF !important;
  color: var(--admin-primary) !important;
}

.admin-restaurants-page .admin-restaurant-status-badge {
  background: #E9F8F0 !important;
  color: #167447 !important;
}

.admin-restaurants-page .admin-restaurant-status-badge.inactive {
  background: #F1F2F5 !important;
  color: #656A78 !important;
}

.admin-restaurants-page .admin-restaurant-name {
  margin: 4px 0 7px !important;
  color: var(--admin-text) !important;
  font-family: "Poppins", sans-serif !important;
  font-size: .94rem !important;
  font-weight: 800 !important;
  line-height: 1.3 !important;
  overflow-wrap: anywhere;
}

.admin-restaurants-page .admin-restaurant-description {
  display: -webkit-box;
  min-height: 48px;
  overflow: hidden;
  margin: 0 0 10px;
  color: var(--admin-muted);
  font-family: "Nunito", sans-serif;
  font-size: .69rem;
  font-weight: 600;
  line-height: 1.55;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.admin-restaurants-page .admin-restaurant-meta {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin-bottom: 9px;
  color: #818694;
  font-family: "Nunito", sans-serif;
  font-size: .65rem;
  font-weight: 700;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.admin-restaurants-page .admin-restaurant-meta svg {
  flex: 0 0 auto;
  margin-top: 1px;
  color: #666DBB;
}

.admin-restaurants-page .admin-restaurant-card-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #EEF0F4;
}

.admin-restaurants-page .admin-restaurant-card-actions .btn {
  min-height: 36px;
  border-radius: 10px !important;
  font-family: "Nunito", sans-serif !important;
  font-size: .67rem !important;
  font-weight: 900 !important;
  transition: transform .18s ease, box-shadow .18s ease;
}

.admin-restaurants-page .admin-restaurant-card-actions .btn-outline-primary {
  border-color: rgba(45,49,149,.25) !important;
  background: #F8F8FF !important;
  color: var(--admin-primary) !important;
}

.admin-restaurants-page .admin-restaurant-card-actions .btn-outline-primary:hover {
  transform: translateY(-1px);
  border-color: var(--admin-primary) !important;
  background: var(--admin-primary) !important;
  color: #fff !important;
}

.admin-restaurants-page .admin-restaurant-card-actions .btn-outline-danger {
  width: 40px;
  border-color: rgba(199,67,80,.20) !important;
  background: #FFF7F8 !important;
  color: #C74350 !important;
}

.admin-restaurants-page .admin-restaurant-card-actions .btn-outline-danger:hover {
  transform: translateY(-1px);
  border-color: #C74350 !important;
  background: #C74350 !important;
  color: #fff !important;
}

.admin-restaurants-page .admin-restaurant-loading,
.admin-restaurants-page .admin-restaurant-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 55px 20px;
  border: 1px dashed #DDE0EC;
  border-radius: 20px;
  background: rgba(255,255,255,.75);
  text-align: center;
}

.admin-restaurants-page .admin-loading-icon,
.admin-restaurants-page .admin-empty-icon {
  display: flex;
  width: 62px;
  height: 62px;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  border-radius: 19px;
  background: #EEF0FF;
  color: var(--admin-primary);
}

.admin-restaurants-page .admin-loading-title,
.admin-restaurants-page .admin-empty-title {
  color: var(--admin-text);
  font-family: "Poppins", sans-serif;
  font-size: .94rem;
  font-weight: 800;
}

.admin-restaurants-page .admin-loading-subtitle,
.admin-restaurants-page .admin-empty-text {
  max-width: 390px;
  margin-top: 7px;
  color: var(--admin-muted);
  font-size: .72rem;
  line-height: 1.6;
}

.admin-restaurants-page .admin-empty-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 8px;
  border-radius: 10px !important;
  font-size: .69rem !important;
  font-weight: 900 !important;
}

.admin-restaurants-page .modal-content {
  overflow: hidden;
  border: 1px solid var(--admin-border) !important;
  border-radius: 22px !important;
  background: #fff !important;
  box-shadow: 0 24px 70px rgba(18,20,36,.17) !important;
}

.admin-restaurants-page .admin-restaurant-form-header {
  position: relative;
  min-height: 78px;
  overflow: hidden;
  padding: 16px 20px !important;
  border: 0 !important;
  background: linear-gradient(135deg,#2D3195 0%,#242879 100%);
  color: #fff !important;
}

.admin-restaurants-page .admin-restaurant-form-header::after {
  position: absolute;
  top: -75px;
  right: -55px;
  width: 170px;
  height: 170px;
  border-radius: 50%;
  background: rgba(255,255,255,.10);
  content: "";
  pointer-events: none;
}

.admin-restaurants-page .admin-form-modal-title {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 11px;
  color: #fff !important;
}

.admin-restaurants-page .admin-form-title-icon {
  display: inline-flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255,255,255,.22);
  border-radius: 12px;
  background: rgba(255,255,255,.16);
}

.admin-restaurants-page .admin-form-title-kicker {
  display: block;
  margin-bottom: 2px;
  color: rgba(255,255,255,.72);
  font-size: .58rem;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.admin-restaurants-page .admin-form-title-text {
  display: block;
  color: #fff;
  font-family: "Poppins", sans-serif;
  font-size: 1.05rem;
  font-weight: 800;
}

.admin-restaurants-page .admin-restaurant-modal .modal-body {
  padding: 22px !important;
  background: #FBFBFD !important;
}

.admin-restaurants-page .admin-form-intro {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-bottom: 20px;
  padding: 12px 14px;
  border: 1px solid rgba(45,49,149,.11);
  border-radius: 13px;
  background: #F7F7FF;
}

.admin-restaurants-page .admin-form-intro-icon {
  display: inline-flex;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #EEF0FF;
  color: var(--admin-primary);
}

.admin-restaurants-page .admin-form-intro strong {
  display: block;
  color: var(--admin-primary);
  font-size: .72rem;
  font-weight: 900;
}

.admin-restaurants-page .admin-form-intro span {
  display: block;
  margin-top: 2px;
  color: #7C8290;
  font-size: .63rem;
  font-weight: 600;
}

.admin-restaurants-page .admin-form-section-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 20px 0 13px;
  padding: 10px 13px;
  border-left: 3px solid var(--admin-primary);
  border-radius: 0 10px 10px 0;
  background: rgba(45,49,149,.055);
  color: var(--admin-primary);
  font-family: "Poppins", sans-serif;
  font-size: .78rem;
  font-weight: 800;
}

.admin-restaurants-page .admin-restaurant-modal .form-label {
  margin-bottom: 6px;
  color: #4E5564;
  font-family: "Nunito", sans-serif;
  font-size: .67rem;
  font-weight: 900 !important;
}

.admin-restaurants-page .admin-restaurant-modal .form-control,
.admin-restaurants-page .admin-restaurant-modal .form-select {
  min-height: 42px;
  border: 1px solid #E0E3EA !important;
  border-radius: 11px !important;
  background: #fff !important;
  color: var(--admin-text) !important;
  font-family: "Nunito", sans-serif !important;
  font-size: .70rem !important;
  box-shadow: 0 3px 10px rgba(26,30,53,.025) !important;
}

.admin-restaurants-page .admin-restaurant-modal textarea.form-control {
  min-height: 96px;
  resize: vertical;
}

.admin-restaurants-page .admin-restaurant-modal .form-control:focus,
.admin-restaurants-page .admin-restaurant-modal .form-select:focus {
  border-color: rgba(45,49,149,.52) !important;
  box-shadow: 0 0 0 3px rgba(45,49,149,.08) !important;
}

.admin-restaurants-page .admin-location-picker-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 9px;
  padding: 11px 13px;
  border: 1px solid rgba(45,49,149,.10);
  border-radius: 12px;
  background: #F7F8FF;
}

.admin-restaurants-page .admin-location-helper {
  color: #7A808E;
  font-size: .62rem;
  font-weight: 600;
  line-height: 1.45;
}

.admin-restaurants-page .admin-location-ready-badge {
  border: 1px solid #CBEAD9 !important;
  background: #EAF8F1 !important;
  color: #167447 !important;
  white-space: nowrap;
}

.admin-restaurants-page .admin-restaurant-modal .modal-footer {
  gap: 8px;
  padding: 12px 20px !important;
  border-top: 1px solid #EEF0F4 !important;
  background: #fff !important;
}

.admin-restaurants-page .modal-footer .btn {
  min-height: 39px;
  padding: 8px 15px !important;
  border-radius: 11px !important;
  font-family: "Nunito", sans-serif !important;
  font-size: .69rem !important;
  font-weight: 900 !important;
}

.admin-restaurants-page .modal-footer .btn-primary {
  border: 0 !important;
  background: var(--admin-primary) !important;
  color: #fff !important;
  box-shadow: 0 8px 18px rgba(45,49,149,.16);
}

.admin-restaurants-page .admin-image-preview {
  position: relative;
  width: 104px;
  height: 82px;
  overflow: hidden;
  border: 1px solid #E0E3EA;
  border-radius: 12px;
  background: #F4F5FB;
}

.admin-restaurants-page .admin-image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.admin-restaurants-page .admin-image-preview .btn {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  width: 23px;
  height: 23px;
  align-items: center;
  justify-content: center;
  padding: 0 !important;
  border-radius: 7px !important;
}

.admin-restaurants-page .admin-detail-image {
  width: 100%;
  max-height: 310px;
  margin-bottom: 18px;
  border-radius: 15px;
  object-fit: cover;
}

.admin-restaurants-page .admin-detail-label {
  color: #7B8190;
  font-size: .62rem;
  font-weight: 900;
  letter-spacing: .06em;
  text-transform: uppercase;
}

.admin-restaurants-page .admin-detail-value {
  margin-top: 4px;
  color: var(--admin-text);
  font-size: .75rem;
  font-weight: 700;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.admin-restaurants-page .admin-detail-section {
  height: 100%;
  padding: 14px;
  border: 1px solid var(--admin-border);
  border-radius: 13px;
  background: #fff;
}

.admin-restaurants-dark {
  --admin-surface: #191C2B;
  --admin-border: #2B3042;
  --admin-text: #F1F3F8;
  --admin-muted: #A8AFBF;
}

.admin-restaurants-dark .admin-stat-card,
.admin-restaurants-dark .admin-restaurants-toolbar,
.admin-restaurants-dark .admin-restaurant-card,
.admin-restaurants-dark .modal-content {
  border-color: #2B3042 !important;
  background: #191C2B !important;
  color: #F1F3F8 !important;
}

.admin-restaurants-dark .admin-toolbar-heading,
.admin-restaurants-dark .admin-location-picker-heading {
  border-color: #343A4F;
  background: #202436;
}

.admin-restaurants-dark .admin-toolbar-heading-icon,
.admin-restaurants-dark .admin-filter-icon,
.admin-restaurants-dark .admin-form-intro-icon {
  background: #262B46 !important;
  color: #AEB4FF !important;
}

.admin-restaurants-dark .admin-filter-status-pill {
  background: #3B3217;
  color: #FFD86B;
}

.admin-restaurants-dark .admin-filter-chip {
  border-color: #343A4F;
  background: #262B46;
  color: #C9CCFF;
}

.admin-restaurants-dark .admin-restaurants-toolbar .form-control,
.admin-restaurants-dark .admin-restaurants-toolbar .form-select,
.admin-restaurants-dark .admin-restaurants-toolbar .input-group-text,
.admin-restaurants-dark .admin-restaurants-toolbar .input-group .btn {
  border-color: #343A4F !important;
  background: #202436 !important;
  color: #F1F3F8 !important;
}

.admin-restaurants-dark .admin-restaurant-name,
.admin-restaurants-dark .admin-stat-value,
.admin-restaurants-dark .admin-toolbar-title,
.admin-restaurants-dark .admin-detail-value {
  color: #F1F3F8 !important;
}

.admin-restaurants-dark .admin-restaurant-description,
.admin-restaurants-dark .admin-restaurant-meta {
  color: #A8AFBF !important;
}

.admin-restaurants-dark .admin-restaurant-card-actions,
.admin-restaurants-dark .admin-toolbar-footer,
.admin-restaurants-dark .admin-active-filters {
  border-color: #2B3042;
}

.admin-restaurants-dark .admin-restaurant-modal .modal-body {
  background: #151827 !important;
}

.admin-restaurants-dark .admin-restaurant-modal .form-control,
.admin-restaurants-dark .admin-restaurant-modal .form-select {
  border-color: #343A4F !important;
  background: #202436 !important;
  color: #F1F3F8 !important;
}

.admin-restaurants-dark .admin-restaurant-modal .form-label {
  color: #D9DCE7;
}

.admin-restaurants-dark .admin-form-intro {
  border-color: #343A4F;
  background: #202436;
}

.admin-restaurants-dark .admin-form-intro strong {
  color: #C9CCFF;
}

.admin-restaurants-dark .admin-form-section-heading {
  background: #262B46;
  color: #C9CCFF;
}

.admin-restaurants-dark .admin-detail-section {
  border-color: #2B3042;
  background: #191C2B;
}

.admin-restaurants-dark .admin-restaurant-form-header,
.admin-restaurants-dark .admin-restaurant-modal .modal-footer {
  background-color: #191C2B !important;
}

.admin-restaurants-dark .admin-restaurant-modal .modal-footer {
  border-color: #2B3042 !important;
}

.admin-restaurants-dark .admin-restaurant-empty,
.admin-restaurants-dark .admin-restaurant-loading {
  border-color: #343A4F;
  background: #191C2B;
}

@keyframes adminRestaurantCardIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes adminRestaurantPageFade {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.admin-restaurants-page > * {
  animation: adminRestaurantPageFade .4s ease both;
}

@media (max-width: 991.98px) {
  .admin-restaurants-page .admin-restaurants-heading {
    align-items: flex-start !important;
    flex-direction: column;
    gap: 14px;
  }

  .admin-restaurants-page .admin-restaurants-add-button {
    width: 100%;
  }
}

@media (max-width: 767.98px) {
  .admin-restaurants-page .admin-restaurants-stats .admin-stat-card {
    min-height: 108px !important;
  }

  .admin-restaurants-page .admin-restaurant-image-shell,
  .admin-restaurants-page .admin-restaurant-placeholder {
    height: 185px;
  }

  .admin-restaurants-page .admin-restaurant-modal .modal-body {
    padding: 17px !important;
  }

  .admin-restaurants-page .admin-restaurant-form-header {
    padding: 15px 17px !important;
  }

  .admin-restaurants-page .admin-restaurant-modal .modal-footer {
    padding: 11px 17px !important;
  }
}

@media (max-width: 479.98px) {
  .admin-restaurants-page .admin-restaurants-title {
    font-size: 1.8rem !important;
  }

  .admin-restaurants-page .admin-restaurant-image-shell,
  .admin-restaurants-page .admin-restaurant-placeholder {
    height: 180px;
  }

  .admin-restaurants-page .admin-toolbar-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .admin-restaurants-page *,
  .admin-restaurants-page *::before,
  .admin-restaurants-page *::after {
    animation-duration: .01ms !important;
    transition-duration: .01ms !important;
  }
}
`;

/* =========================================================
   COMPONENT
========================================================= */

const AdminRestaurants: React.FC = () => {
  const { darkMode } = useDarkMode();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOption, setSortOption] = useState("name-asc");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RestaurantForm>(EMPTY_FORM);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Restaurant | null>(null);
  const [viewItem, setViewItem] = useState<Restaurant | null>(null);

  /* -------------------------------------------------------
     LOAD RESTAURANTS
  ------------------------------------------------------- */

  const loadRestaurants = useCallback(async () => {
    setLoading(true);

    try {
      clearCache("restaurants");

      // Load inactive records too, so admins can manage them.
      const { data, error: queryError } = await supabase
        .from("restaurants")
        .select("*")
        .order("created_at", { ascending: false });

      if (queryError) {
        throw queryError;
      }

      setRestaurants(Array.isArray(data) ? (data as Restaurant[]) : []);
      setError("");
    } catch (loadError: any) {
      console.error("Failed to load restaurants:", loadError);

      setRestaurants([]);
      setError(
        loadError?.message || "Could not load restaurant records.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRestaurants();
  }, [loadRestaurants]);

  /* -------------------------------------------------------
     FILTERS / SORTING
  ------------------------------------------------------- */

  const filteredRestaurants = useMemo(() => {
    const normalize = (value: unknown) =>
      String(value ?? "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");

    const search = normalize(searchTerm);

    const filtered = restaurants.filter((restaurant) => {
      const cuisine = normalize(restaurant.cuisine_type);
      const isActive = restaurant.is_active !== false;

      const searchableText = normalize(
        [
          restaurant.name,
          restaurant.cuisine_type,
          restaurant.location_address,
          restaurant.short_description,
          restaurant.description,
          restaurant.contact_phone,
          restaurant.contact_website,
          restaurant.opening_hours,
          restaurant.price_range,
        ]
          .filter(Boolean)
          .join(" "),
      );

      const matchesSearch =
        !search ||
        search.split(/\s+/).every((token) => searchableText.includes(token));

      const matchesCuisine =
        cuisineFilter === "All" ||
        cuisine === normalize(cuisineFilter);

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && isActive) ||
        (statusFilter === "Inactive" && !isActive) ||
        (statusFilter === "Featured" && Boolean(restaurant.featured));

      return matchesSearch && matchesCuisine && matchesStatus;
    });

    filtered.sort((a, b) => {
      const nameA = String(a.name || "").toLowerCase();
      const nameB = String(b.name || "").toLowerCase();

      const dateA = new Date(
        (a as any).created_at || (a as any).createdAt || 0,
      ).getTime();

      const dateB = new Date(
        (b as any).created_at || (b as any).createdAt || 0,
      ).getTime();

      switch (sortOption) {
        case "name-desc":
          return nameB.localeCompare(nameA);

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

    return filtered;
  }, [restaurants, searchTerm, cuisineFilter, statusFilter, sortOption]);

  const featuredCount = useMemo(
    () => restaurants.filter((restaurant) => Boolean(restaurant.featured)).length,
    [restaurants],
  );

  const activeCount = useMemo(
    () => restaurants.filter((restaurant) => restaurant.is_active !== false).length,
    [restaurants],
  );

  const cuisineOptions = useMemo(() => {
    const cuisines = restaurants
      .map((restaurant) => String(restaurant.cuisine_type || "").trim())
      .filter(Boolean);

    return Array.from(new Set([...CUISINE_OPTIONS, ...cuisines])).sort(
      (a, b) => a.localeCompare(b),
    );
  }, [restaurants]);

  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    cuisineFilter !== "All" ||
    statusFilter !== "All";

  const clearFilters = () => {
    setSearchTerm("");
    setCuisineFilter("All");
    setStatusFilter("All");
  };

  /* -------------------------------------------------------
     FORM HELPERS
  ------------------------------------------------------- */

  const updateField = <K extends keyof RestaurantForm>(
    key: K,
    value: RestaurantForm[K],
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, images: [] });
    setSelectedFiles([]);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (restaurant: Restaurant) => {
    const record = restaurant as any;

    setEditingId(restaurant.id);

    setForm({
      name: restaurant.name || "",
      description: restaurant.description || "",
      short_description: restaurant.short_description || "",
      location_address: restaurant.location_address || "",
      location_lat: record.location_lat != null
        ? Number(record.location_lat)
        : record.latitude != null
          ? Number(record.latitude)
          : null,
      location_lng: record.location_lng != null
        ? Number(record.location_lng)
        : record.longitude != null
          ? Number(record.longitude)
          : null,
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

  const removeExistingImage = (index: number) => {
    updateField(
      "images",
      form.images.filter((_, imageIndex) => imageIndex !== index),
    );
  };

  const handleFileSelection = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;

    if (files) {
      setSelectedFiles(Array.from(files));
    }
  };

  /* -------------------------------------------------------
     SAVE RESTAURANT
  ------------------------------------------------------- */

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Restaurant name is required.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      let uploadedUrls: string[] = [];

      if (selectedFiles.length > 0) {
        const uploadResult = await uploadMultipleImages(selectedFiles);
        uploadedUrls = uploadResult.data.urls;
      }

      const payload: Record<string, any> = {
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

      /*
       * Coordinates are included because the location picker returns them.
       * If your restaurants table uses location_lat/location_lng, these
       * fields preserve the exact pin. The columns must exist in Supabase.
       */
      if (
        typeof form.location_lat === "number" &&
        typeof form.location_lng === "number"
      ) {
        payload.location_lat = form.location_lat;
        payload.location_lng = form.location_lng;
      }

      if (editingId) {
        await updateRestaurant(editingId, payload as Partial<Restaurant>);
      } else {
        await createRestaurant(payload as Partial<Restaurant>);
      }

      clearCache("restaurants");

      setShowModal(false);
      setSelectedFiles([]);

      setSuccess(
        editingId
          ? "Restaurant updated successfully."
          : "Restaurant added successfully.",
      );

      await loadRestaurants();
    } catch (saveError: any) {
      console.error("Failed to save restaurant:", saveError);

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

  /* -------------------------------------------------------
     DELETE RESTAURANT
  ------------------------------------------------------- */

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setSaving(true);
    setError("");

    try {
      await deleteRestaurant(deleteTarget.id);

      setDeleteTarget(null);
      setViewItem(null);

      clearCache("restaurants");

      setSuccess("Restaurant deleted successfully.");

      await loadRestaurants();
    } catch (deleteError: any) {
      console.error("Failed to delete restaurant:", deleteError);

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

  const getRestaurantImages = (restaurant: Restaurant): string[] =>
    Array.isArray(restaurant.images)
      ? restaurant.images.filter(
          (image): image is string =>
            typeof image === "string" && Boolean(image.trim()),
        )
      : [];

  const getRestaurantDescription = (restaurant: Restaurant) =>
    restaurant.short_description ||
    restaurant.description ||
    "No description added yet.";

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <AdminLayout>
      <div
        className={`admin-restaurants-page ${
          darkMode ? "admin-restaurants-dark" : ""
        }`}
      >
        <style>{ADMIN_RESTAURANTS_STYLES}</style>

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="admin-restaurants-heading d-flex justify-content-between">
          <div>
            <div className="admin-restaurants-eyebrow">
              CONTENT MANAGEMENT
            </div>

            <h2 className="admin-restaurants-title">
              RESTAURANTS
            </h2>

            <p className="admin-restaurants-subtitle">
              Manage Calbayog City restaurants, food establishments,
              images, location details, and public visibility from one place.
            </p>
          </div>

          <Button
            variant="primary"
            className="admin-restaurants-add-button"
            onClick={openAddModal}
          >
            <Plus size={17} strokeWidth={2.2} />
            <span>Add Restaurant</span>
          </Button>
        </div>

        {/* =====================================================
            ALERTS
        ===================================================== */}

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

        {/* =====================================================
            STATISTICS
        ===================================================== */}

        <Row className="g-3 mb-4 admin-restaurants-stats">
          <Col xs={12} sm={6} xl={3}>
            <Card
              className="border-0 h-100 admin-stat-card"
              role="button"
              onClick={clearFilters}
            >
              <Card.Body>
                <div className="admin-stat-card-top">
                  <span className="admin-stat-icon admin-stat-icon-blue">
                    <Store size={18} />
                  </span>
                  <span className="admin-stat-label">
                    Total Restaurants
                  </span>
                </div>

                <div className="admin-stat-value">
                  {restaurants.length}
                </div>

                <div className="admin-stat-caption">
                  All restaurant records
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} xl={3}>
            <Card className="border-0 h-100 admin-stat-card">
              <Card.Body>
                <div className="admin-stat-card-top">
                  <span className="admin-stat-icon admin-stat-icon-yellow">
                    <Star size={18} />
                  </span>
                  <span className="admin-stat-label">
                    Featured Restaurants
                  </span>
                </div>

                <div className="admin-stat-value">
                  {featuredCount}
                </div>

                <div className="admin-stat-caption">
                  Marked as featured
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} xl={3}>
            <Card
              className="border-0 h-100 admin-stat-card"
              role="button"
              onClick={() => {
                setSearchTerm("");
                setCuisineFilter("All");
                setStatusFilter("Active");
              }}
            >
              <Card.Body>
                <div className="admin-stat-card-top">
                  <span className="admin-stat-icon admin-stat-icon-green">
                    <Check size={18} />
                  </span>
                  <span className="admin-stat-label">
                    Active Restaurants
                  </span>
                </div>

                <div className="admin-stat-value">
                  {activeCount}
                </div>

                <div className="admin-stat-caption">
                  Visible on the public page
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} xl={3}>
            <Card className="border-0 h-100 admin-stat-card">
              <Card.Body>
                <div className="admin-stat-card-top">
                  <span className="admin-stat-icon admin-stat-icon-purple">
                    <Eye size={18} />
                  </span>
                  <span className="admin-stat-label">
                    Currently Showing
                  </span>
                </div>

                <div className="admin-stat-value">
                  {filteredRestaurants.length}
                </div>

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

        <Card className="border-0 mb-4 admin-restaurants-toolbar">
          <Card.Body>
            <div className="admin-toolbar-heading">
              <div className="admin-filter-heading-main">
                <span className="admin-toolbar-heading-icon">
                  <SlidersHorizontal size={18} strokeWidth={2.1} />
                </span>

                <div>
                  <div className="admin-toolbar-title">
                    Find a Restaurant
                  </div>

                  <div className="admin-toolbar-caption">
                    Search, filter, and organize your restaurant records.
                  </div>
                </div>
              </div>

              <div className="admin-filter-status-pill">
                <Search size={13} />
                {filteredRestaurants.length} result
                {filteredRestaurants.length !== 1 ? "s" : ""}
              </div>
            </div>

            <Row className="g-3">
              <Col xs={12} lg={5}>
                <InputGroup className="admin-filter-group admin-search-group">
                  <InputGroup.Text className="admin-filter-icon">
                    <Search size={16} />
                  </InputGroup.Text>

                  <Form.Control
                    aria-label="Search restaurants"
                    placeholder="Search name, cuisine, location, contact..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />

                  {searchTerm && (
                    <Button
                      variant="outline-secondary"
                      aria-label="Clear search"
                      onClick={() => setSearchTerm("")}
                    >
                      <X size={16} />
                    </Button>
                  )}
                </InputGroup>
              </Col>

              <Col xs={12} sm={6} lg={2}>
                <InputGroup className="admin-filter-group">
                  <InputGroup.Text className="admin-filter-icon">
                    <UtensilsCrossed size={15} />
                  </InputGroup.Text>

                  <Form.Select
                    aria-label="Filter by cuisine"
                    value={cuisineFilter}
                    onChange={(event) => setCuisineFilter(event.target.value)}
                  >
                    <option value="All">All Cuisines</option>

                    {cuisineOptions.map((cuisine) => (
                      <option key={cuisine} value={cuisine}>
                        {cuisine}
                      </option>
                    ))}
                  </Form.Select>
                </InputGroup>
              </Col>

              <Col xs={12} sm={6} lg={2}>
                <InputGroup className="admin-filter-group">
                  <InputGroup.Text className="admin-filter-icon">
                    <Layers3 size={15} />
                  </InputGroup.Text>

                  <Form.Select
                    aria-label="Filter by status"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Featured">Featured</option>
                  </Form.Select>
                </InputGroup>
              </Col>

              <Col xs={12} lg={3}>
                <InputGroup className="admin-filter-group">
                  <InputGroup.Text className="admin-filter-icon">
                    <ArrowUpDown size={15} />
                  </InputGroup.Text>

                  <Form.Select
                    aria-label="Sort restaurants"
                    value={sortOption}
                    onChange={(event) => setSortOption(event.target.value)}
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </InputGroup>
              </Col>
            </Row>

            {hasActiveFilters && (
              <div className="admin-active-filters">
                <span className="admin-active-filters-label">
                  Active:
                </span>

                {searchTerm && (
                  <span className="admin-filter-chip">
                    <Search size={11} />
                    “{searchTerm}”
                  </span>
                )}

                {cuisineFilter !== "All" && (
                  <span className="admin-filter-chip">
                    <UtensilsCrossed size={11} />
                    {cuisineFilter}
                  </span>
                )}

                {statusFilter !== "All" && (
                  <span className="admin-filter-chip">
                    <Tag size={11} />
                    {statusFilter}
                  </span>
                )}
              </div>
            )}

            <div className="admin-toolbar-footer">
              <div className="admin-toolbar-result-count">
                Showing{" "}
                <strong>{filteredRestaurants.length}</strong> of{" "}
                {restaurants.length} restaurants
              </div>

              {hasActiveFilters && (
                <Button
                  variant="link"
                  size="sm"
                  className="admin-clear-filters"
                  onClick={clearFilters}
                >
                  <X size={14} />
                  Clear filters
                </Button>
              )}
            </div>
          </Card.Body>
        </Card>

        {/* =====================================================
            RESTAURANT CARDS
        ===================================================== */}

        {loading ? (
          <div className="admin-restaurant-loading">
            <div className="admin-loading-icon">
              <Spinner animation="border" size="sm" />
            </div>

            <div className="admin-loading-title">
              Loading restaurants...
            </div>

            <div className="admin-loading-subtitle">
              Preparing Calbayog City Tourism restaurant records.
            </div>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="admin-restaurant-empty">
            <div className="admin-empty-icon">
              <UtensilsCrossed size={30} strokeWidth={1.7} />
            </div>

            <div className="admin-empty-title">
              No restaurants found
            </div>

            <p className="admin-empty-text">
              Try adjusting your search or filters to find another restaurant.
            </p>

            {hasActiveFilters ? (
              <Button
                variant="outline-primary"
                className="admin-empty-button"
                onClick={clearFilters}
              >
                <Layers3 size={15} />
                Clear filters
              </Button>
            ) : (
              <Button
                variant="outline-primary"
                className="admin-empty-button"
                onClick={openAddModal}
              >
                <Plus size={15} />
                Add your first restaurant
              </Button>
            )}
          </div>
        ) : (
          <Row className="g-3 g-lg-4">
            {filteredRestaurants.map((restaurant, index) => {
              const images = getRestaurantImages(restaurant);
              const firstImage = images[0];

              return (
                <Col
                  xs={12}
                  sm={6}
                  lg={4}
                  xl={3}
                  key={restaurant.id}
                >
                  <Card
                    className="h-100 border-0 admin-restaurant-card"
                    style={{
                      animationDelay: `${Math.min(index * 55, 440)}ms`,
                    }}
                    onClick={() => setViewItem(restaurant)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setViewItem(restaurant);
                      }
                    }}
                  >
                    {firstImage ? (
                      <div className="admin-restaurant-image-shell">
                        <img
                          src={firstImage}
                          alt={restaurant.name}
                          className="admin-restaurant-card-image"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = DEFAULT_RESTAURANT_IMAGE;
                          }}
                        />

                        <div className="admin-restaurant-image-overlay" />

                        {restaurant.featured && (
                          <span className="admin-restaurant-featured-badge">
                            <Star size={12} />
                            Featured
                          </span>
                        )}

                        {images.length > 1 && (
                          <span className="admin-restaurant-image-count">
                            <ImageIcon size={13} />
                            {images.length}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="admin-restaurant-placeholder">
                        <UtensilsCrossed size={40} strokeWidth={1.6} />
                        <span>No restaurant image</span>
                      </div>
                    )}

                    <Card.Body>
                      <div className="admin-restaurant-badge-row">
                        <Badge className="admin-restaurant-cuisine-badge">
                          {restaurant.cuisine_type || "Cuisine not specified"}
                        </Badge>

                        <Badge
                          className={`admin-restaurant-status-badge ${
                            restaurant.is_active === false ? "inactive" : ""
                          }`}
                        >
                          {restaurant.is_active === false ? "Inactive" : "Active"}
                        </Badge>
                      </div>

                      <h5 className="admin-restaurant-name">
                        {restaurant.name}
                      </h5>

                      <p className="admin-restaurant-description">
                        {getRestaurantDescription(restaurant)}
                      </p>

                      <div className="admin-restaurant-meta">
                        <MapPin size={14} />
                        <span>
                          {restaurant.location_address || "Location not set"}
                        </span>
                      </div>

                      {restaurant.price_range && (
                        <div className="admin-restaurant-meta">
                          <DollarSign size={14} />
                          <span>{restaurant.price_range}</span>
                        </div>
                      )}

                      <div
                        className="admin-restaurant-card-actions"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          variant="outline-primary"
                          className="flex-grow-1 d-inline-flex align-items-center justify-content-center gap-2"
                          onClick={() => openEditModal(restaurant)}
                        >
                          <Pencil size={14} />
                          Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="outline-danger"
                          aria-label={`Delete ${restaurant.name}`}
                          title="Delete restaurant"
                          onClick={() => setDeleteTarget(restaurant)}
                        >
                          <Trash2 size={14} />
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
            ADD / EDIT RESTAURANT MODAL
        ===================================================== */}

        <Modal
          className="admin-restaurant-modal"
          show={showModal}
          onHide={() => {
            if (!saving) {
              setShowModal(false);
              setError("");
            }
          }}
          size="lg"
          centered
          scrollable
        >
          <Form onSubmit={handleSave}>
            <Modal.Header
              closeButton={!saving}
              className="admin-restaurant-form-header"
            >
              <Modal.Title className="admin-form-modal-title">
                <span className="admin-form-title-icon">
                  <UtensilsCrossed size={20} />
                </span>

                <span>
                  <span className="admin-form-title-kicker">
                    RESTAURANT MANAGEMENT
                  </span>

                  <span className="admin-form-title-text">
                    {editingId ? "Edit Restaurant" : "Add Restaurant"}
                  </span>
                </span>
              </Modal.Title>
            </Modal.Header>

            <Modal.Body>
              {error && (
                <Alert
                  variant="danger"
                  dismissible
                  onClose={() => setError("")}
                >
                  {error}
                </Alert>
              )}

              <div className="admin-form-intro">
                <span className="admin-form-intro-icon">
                  <Store size={18} />
                </span>

                <div>
                  <strong>
                    {editingId ? "Update restaurant information" : "Restaurant details"}
                  </strong>

                  <span>
                    Add accurate restaurant information for visitors to Calbayog City.
                    Fields marked with * are required.
                  </span>
                </div>
              </div>

              {/* BASIC INFORMATION */}

              <div className="admin-form-section-heading">
                <UtensilsCrossed size={16} />
                Basic Information
              </div>

              <Row className="g-3">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Restaurant Name *</Form.Label>
                    <Form.Control
                      required
                      autoFocus
                      value={form.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      placeholder="Enter restaurant name"
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Cuisine Type</Form.Label>
                    <Form.Select
                      value={
                        CUISINE_OPTIONS.includes(form.cuisine_type)
                          ? form.cuisine_type
                          : form.cuisine_type
                            ? "Other"
                            : ""
                      }
                      onChange={(event) => {
                        const value = event.target.value;
                        updateField(
                          "cuisine_type",
                          value === "Other" ? "" : value,
                        );
                      }}
                    >
                      <option value="">Select cuisine type</option>

                      {CUISINE_OPTIONS.map((cuisine) => (
                        <option key={cuisine} value={cuisine}>
                          {cuisine}
                        </option>
                      ))}
                    </Form.Select>

                    {(form.cuisine_type === "" ||
                      !CUISINE_OPTIONS.includes(form.cuisine_type)) && (
                      <Form.Control
                        className="mt-2"
                        value={
                          CUISINE_OPTIONS.includes(form.cuisine_type)
                            ? ""
                            : form.cuisine_type
                        }
                        onChange={(event) =>
                          updateField("cuisine_type", event.target.value)
                        }
                        placeholder="Enter cuisine type"
                      />
                    )}
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
                      placeholder="A brief introduction shown on the restaurant card"
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
                      placeholder="Describe the restaurant, food, and dining experience"
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* LOCATION */}

              <div className="admin-form-section-heading">
                <MapPinned size={16} />
                Restaurant Location
              </div>

              <div className="admin-location-picker-heading">
                <div>
                  <strong className="d-block" style={{ fontSize: ".72rem" }}>
                    Select the exact map location
                  </strong>

                  <div className="admin-location-helper">
                    Search for a place, select a map point, or adjust the marker.
                    Confirm the address before saving.
                  </div>
                </div>

                {typeof form.location_lat === "number" &&
                  typeof form.location_lng === "number" && (
                    <Badge className="admin-location-ready-badge">
                      <Check size={11} className="me-1" />
                      Location set
                    </Badge>
                  )}
              </div>

              <LocationPicker
                name={form.name}
                latitude={form.location_lat}
                longitude={form.location_lng}
                address={form.location_address}
                category="Other"
                attractionType="Restaurant"
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

              <Row className="g-3 mt-1">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Address / Location</Form.Label>
                    <Form.Control
                      value={form.location_address}
                      onChange={(event) =>
                        updateField("location_address", event.target.value)
                      }
                      placeholder="Enter the restaurant's street, barangay, or area"
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
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
                      placeholder="Latitude"
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
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
                      placeholder="Longitude"
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* CONTACT AND HOURS */}

              <div className="admin-form-section-heading">
                <Phone size={16} />
                Contact Information & Opening Hours
              </div>

              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Contact Phone</Form.Label>
                    <Form.Control
                      type="tel"
                      value={form.contact_phone}
                      onChange={(event) =>
                        updateField("contact_phone", event.target.value)
                      }
                      placeholder="Restaurant phone number"
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
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

                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Opening Hours</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <Clock3 size={15} />
                      </InputGroup.Text>
                      <Form.Control
                        value={form.opening_hours}
                        onChange={(event) =>
                          updateField("opening_hours", event.target.value)
                        }
                        placeholder="e.g. Daily, 8:00 AM – 9:00 PM"
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>

              {/* IMAGES */}

              <div className="admin-form-section-heading">
                <ImageIcon size={16} />
                Restaurant Images
              </div>

              <Form.Group>
                <Form.Label>Upload Images</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelection}
                />

                <Form.Text className="text-muted">
                  Existing images are preserved unless removed below.
                  Newly selected images upload when you save.
                </Form.Text>
              </Form.Group>

              {form.images.length > 0 && (
                <div className="d-flex flex-wrap gap-2 mt-3">
                  {form.images.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className="admin-image-preview"
                    >
                      <img
                        src={url}
                        alt={`Restaurant image ${index + 1}`}
                        onError={(event) => {
                          event.currentTarget.style.opacity = "0.25";
                        }}
                      />

                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        aria-label={`Remove restaurant image ${index + 1}`}
                        onClick={() => removeExistingImage(index)}
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {selectedFiles.length > 0 && (
                <div className="mt-3">
                  <div className="small fw-bold mb-2">
                    {selectedFiles.length} new image(s) selected
                  </div>

                  <div className="d-flex flex-wrap gap-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="d-flex align-items-center gap-2 rounded border bg-white px-2 py-2"
                        style={{ maxWidth: 240, fontSize: ".68rem" }}
                      >
                        <ImageIcon size={14} className="text-primary flex-shrink-0" />
                        <span
                          className="text-truncate"
                          title={file.name}
                        >
                          {file.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="px-0 mt-1"
                    onClick={() => setSelectedFiles([])}
                  >
                    <X size={13} className="me-1" />
                    Remove selected files
                  </Button>
                </div>
              )}

              {/* VISIBILITY */}

              <div className="admin-form-section-heading">
                <Eye size={16} />
                Visibility & Featured Settings
              </div>

              <Row className="g-3">
                <Col md={6}>
                  <Card className="h-100">
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

                      <div className="text-muted mt-2" style={{ fontSize: ".65rem" }}>
                        Mark this restaurant as featured where supported by the
                        public website.
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6}>
                  <Card className="h-100">
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

                      <div className="text-muted mt-2" style={{ fontSize: ".65rem" }}>
                        Inactive restaurants remain manageable here but should
                        be hidden from the public listing.
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Modal.Body>

            <Modal.Footer>
              <Button
                variant="secondary"
                type="button"
                disabled={saving}
                onClick={() => {
                  setShowModal(false);
                  setError("");
                }}
              >
                Cancel
              </Button>

              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Saving...
                  </>
                ) : editingId ? (
                  <>
                    <Check size={15} className="me-2" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Plus size={15} className="me-2" />
                    Add Restaurant
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* =====================================================
            RESTAURANT DETAIL MODAL
        ===================================================== */}

        <Modal
          show={Boolean(viewItem)}
          onHide={() => setViewItem(null)}
          size="lg"
          centered
          scrollable
          fullscreen="sm-down"
          className="admin-restaurant-modal"
        >
          {viewItem && (
            <>
              <Modal.Header closeButton>
                <Modal.Title
                  style={{
                    color: CALBAYOG_BLUE,
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 800,
                    fontSize: ".98rem",
                  }}
                >
                  {viewItem.name}
                </Modal.Title>
              </Modal.Header>

              <Modal.Body>
                {getRestaurantImages(viewItem).length > 0 ? (
                  <img
                    className="admin-detail-image"
                    src={getRestaurantImages(viewItem)[0]}
                    alt={viewItem.name}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = DEFAULT_RESTAURANT_IMAGE;
                    }}
                  />
                ) : (
                  <div className="admin-restaurant-placeholder rounded mb-3">
                    <UtensilsCrossed size={40} />
                    <span>No restaurant image available</span>
                  </div>
                )}

                <div className="d-flex gap-2 flex-wrap mb-3">
                  <Badge className="admin-restaurant-cuisine-badge">
                    {viewItem.cuisine_type || "Cuisine not specified"}
                  </Badge>

                  <Badge
                    className={`admin-restaurant-status-badge ${
                      viewItem.is_active === false ? "inactive" : ""
                    }`}
                  >
                    {viewItem.is_active === false ? "Inactive" : "Active"}
                  </Badge>

                  {viewItem.featured && (
                    <Badge bg="warning" text="dark">
                      <Star size={11} className="me-1" />
                      Featured
                    </Badge>
                  )}
                </div>

                <Row className="g-3">
                  <Col md={12}>
                    <div className="admin-detail-section">
                      <div className="admin-detail-label">
                        Description
                      </div>
                      <div className="admin-detail-value">
                        {viewItem.description ||
                          viewItem.short_description ||
                          "No description available."}
                      </div>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="admin-detail-section">
                      <div className="admin-detail-label">
                        Address / Location
                      </div>
                      <div className="admin-detail-value">
                        <MapPin size={14} className="me-1" />
                        {viewItem.location_address || "Location not set"}
                      </div>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="admin-detail-section">
                      <div className="admin-detail-label">
                        Price Range
                      </div>
                      <div className="admin-detail-value">
                        {viewItem.price_range || "Not specified"}
                      </div>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="admin-detail-section">
                      <div className="admin-detail-label">
                        Contact Phone
                      </div>
                      <div className="admin-detail-value">
                        {viewItem.contact_phone || "Not provided"}
                      </div>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="admin-detail-section">
                      <div className="admin-detail-label">
                        Opening Hours
                      </div>
                      <div className="admin-detail-value">
                        {viewItem.opening_hours || "Not specified"}
                      </div>
                    </div>
                  </Col>

                  <Col md={12}>
                    <div className="admin-detail-section">
                      <div className="admin-detail-label">
                        Website / Social Link
                      </div>
                      <div className="admin-detail-value">
                        {viewItem.contact_website ? (
                          <a
                            href={viewItem.contact_website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Globe size={14} className="me-1" />
                            {viewItem.contact_website}
                          </a>
                        ) : (
                          "Not provided"
                        )}
                      </div>
                    </div>
                  </Col>

                  {getRestaurantImages(viewItem).length > 1 && (
                    <Col md={12}>
                      <div className="admin-detail-section">
                        <div className="admin-detail-label mb-2">
                          All Restaurant Images
                        </div>

                        <div className="d-flex flex-wrap gap-2">
                          {getRestaurantImages(viewItem).map((image, index) => (
                            <div
                              key={`${image}-${index}`}
                              className="admin-image-preview"
                            >
                              <img
                                src={image}
                                alt={`${viewItem.name} ${index + 1}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </Col>
                  )}
                </Row>
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
                    const selected = viewItem;
                    setViewItem(null);
                    openEditModal(selected);
                  }}
                >
                  <Pencil size={14} className="me-2" />
                  Edit Restaurant
                </Button>
              </Modal.Footer>
            </>
          )}
        </Modal>

        {/* =====================================================
            DELETE CONFIRMATION MODAL
        ===================================================== */}

        <Modal
          show={Boolean(deleteTarget)}
          onHide={() => !saving && setDeleteTarget(null)}
          centered
          className="admin-restaurant-modal"
        >
          <Modal.Header closeButton={!saving}>
            <Modal.Title
              style={{
                color: CALBAYOG_BLUE,
                fontFamily: "Poppins, sans-serif",
                fontWeight: 800,
                fontSize: ".98rem",
              }}
            >
              Delete Restaurant
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div className="d-flex align-items-start gap-3">
              <span
                className="d-flex align-items-center justify-content-center flex-shrink-0 rounded-3"
                style={{
                  width: 42,
                  height: 42,
                  background: "#FFF0F1",
                  color: "#C74350",
                }}
              >
                <Trash2 size={20} />
              </span>

              <div>
                <div className="fw-bold mb-1">
                  Are you sure you want to delete this restaurant?
                </div>

                <div className="text-muted small">
                  <strong>{deleteTarget?.name}</strong> will be removed.
                  This action cannot be undone.
                </div>
              </div>
            </div>
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
              {saving ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={14} className="me-2" />
                  Delete Restaurant
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminRestaurants;

