import React, { useEffect, useMemo, useState } from "react";
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
  Check,
  Clock3,
  Film,
  Info,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";

import {
  FeaturedVideo,
  getFeaturedVideos,
  uploadFeaturedVideo,
  deleteFeaturedVideo,
} from "../../services/api";

import { useDarkMode } from "../../context/DarkModeContext";

/* =========================================================
   CONSTANTS
========================================================= */

const CALBAYOG_BLUE = "#2D3195";
const CALBAYOG_BLUE_DARK = "#242879";
const ADMIN_YELLOW = "#FFB71B";

/* =========================================================
   STYLES
========================================================= */

const ADMIN_FEATURED_VIDEOS_STYLES = `
  @font-face {
    font-family: "Barabara";
    src: url("/fonts/BARABARA-final.otf") format("opentype");
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  .admin-featured-videos-page {
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

  .admin-featured-videos-page *,
  .admin-featured-videos-page *::before,
  .admin-featured-videos-page *::after {
    box-sizing: border-box;
  }

  /* =======================================================
     PAGE HEADING
  ======================================================= */

  .admin-featured-videos-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 22px;
    margin: 0 0 26px;
  }

  .admin-featured-videos-eyebrow {
    margin-bottom: 5px;
    color: var(--admin-primary);
    font-family: "Nunito", sans-serif;
    font-size: 0.66rem;
    font-weight: 900;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .admin-featured-videos-title {
    margin: 0 !important;
    color: var(--admin-primary) !important;
    font-family: "Barabara", sans-serif !important;
    font-size: clamp(1.65rem, 2.8vw, 2.4rem) !important;
    font-weight: 400 !important;
    line-height: 0.95 !important;
    letter-spacing: 0.02em;
  }

  .admin-featured-videos-subtitle {
    max-width: 780px;
    margin: 8px 0 0 !important;
    color: var(--admin-muted) !important;
    font-family: "Nunito", sans-serif !important;
    font-size: 0.8rem !important;
    font-weight: 600 !important;
    line-height: 1.55 !important;
  }

  .admin-featured-videos-add-button {
    flex: 0 0 auto;
    min-height: 46px;
    padding: 11px 19px !important;
    border: 0 !important;
    border-radius: 13px !important;
    background: var(--admin-primary) !important;
    color: #fff !important;
    box-shadow: 0 10px 24px rgba(45, 49, 149, 0.2);
    font-family: "Nunito", sans-serif !important;
    font-size: 0.76rem !important;
    font-weight: 900 !important;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease,
      background 0.2s ease;
  }

  .admin-featured-videos-add-button:hover,
  .admin-featured-videos-add-button:focus {
    background: var(--admin-primary-dark) !important;
    transform: translateY(-2px);
    box-shadow: 0 14px 28px rgba(45, 49, 149, 0.24);
  }

  /* =======================================================
     STAT CARDS
  ======================================================= */

  .admin-featured-videos-stats {
    margin-bottom: 24px !important;
  }

  .admin-featured-videos-stats .admin-stat-card {
    position: relative;
    min-height: 132px;
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

  .admin-featured-videos-stats .admin-stat-card::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: var(--admin-primary);
  }

  .admin-featured-videos-stats > .col:nth-child(2) .admin-stat-card::before {
    background: var(--admin-yellow);
  }

  .admin-featured-videos-stats > .col:nth-child(3) .admin-stat-card::before {
    background: #7076D8;
  }

  .admin-featured-videos-stats .admin-stat-card:hover {
    transform: translateY(-3px);
    border-color: rgba(45, 49, 149, 0.16) !important;
    box-shadow: 0 14px 32px rgba(26, 30, 53, 0.1);
  }

  .admin-featured-videos-stats .card-body {
    padding: 17px 18px 16px !important;
  }

  .admin-stat-card-top {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .admin-stat-icon {
    width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    border-radius: 10px;
  }

  .admin-stat-icon-blue {
    color: #2D3195;
    background: #EEF0FF;
  }

  .admin-stat-icon-yellow {
    color: #9A6900;
    background: #FFF5D9;
  }

  .admin-stat-icon-purple {
    color: #5F62B7;
    background: #F0EFFF;
  }

  .admin-stat-label {
    color: var(--admin-muted);
    font-size: 0.66rem;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .admin-stat-value {
    margin-top: 11px;
    color: var(--admin-text);
    font-family: "Poppins", sans-serif;
    font-size: 1.95rem;
    font-weight: 800;
    line-height: 1;
  }

  .admin-stat-caption {
    margin-top: 8px;
    color: var(--admin-muted);
    font-size: 0.62rem;
    font-weight: 600;
  }

  /* =======================================================
     TOOLBAR
  ======================================================= */

  .admin-featured-videos-toolbar {
    margin-bottom: 22px;
    border: 1px solid var(--admin-border) !important;
    border-radius: 18px !important;
    background: var(--admin-surface) !important;
    box-shadow: 0 8px 26px rgba(26, 30, 53, 0.05) !important;
  }

  .admin-featured-videos-toolbar .card-body {
    padding: 19px !important;
  }

  .admin-featured-videos-toolbar-heading {
    display: flex;
    align-items: center;
    gap: 11px;
    margin-bottom: 15px;
  }

  .admin-toolbar-heading-icon {
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    border-radius: 10px;
    background: #EEF0FF;
    color: #2D3195;
  }

  .admin-featured-videos-toolbar-title {
    margin: 0 !important;
    color: var(--admin-text);
    font-family: "Poppins", sans-serif;
    font-size: 0.86rem !important;
    font-weight: 800 !important;
  }

  .admin-featured-videos-toolbar-caption {
    margin-top: 2px;
    color: var(--admin-muted);
    font-size: 0.64rem;
    font-weight: 600;
  }

  /* =======================================================
     VIDEO CARDS
  ======================================================= */

  .admin-featured-videos-grid > .col {
    display: flex;
  }

  .admin-featured-video-card {
    position: relative;
    width: 100%;
    min-height: 100%;
    overflow: hidden;
    border: 1px solid var(--admin-border) !important;
    border-radius: 18px !important;
    background: var(--admin-surface) !important;
    box-shadow: 0 7px 24px rgba(26, 30, 53, 0.06) !important;
    animation: adminFeaturedVideoCardIn 0.45s ease both;
    transition:
      transform 0.25s ease,
      box-shadow 0.25s ease,
      border-color 0.25s ease;
  }

  .admin-featured-video-card:hover {
    transform: translateY(-5px);
    border-color: rgba(45, 49, 149, 0.17) !important;
    box-shadow: 0 17px 38px rgba(26, 30, 53, 0.11) !important;
  }

  .admin-featured-video-preview {
    position: relative;
    height: 218px;
    overflow: hidden;
    background: #11131D;
  }

  .admin-featured-video-preview video {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    background: #11131D;
  }

  .admin-featured-video-preview-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(
        180deg,
        rgba(8, 10, 20, 0.04) 0%,
        rgba(8, 10, 20, 0.08) 50%,
        rgba(8, 10, 20, 0.48) 100%
      );
  }

  .admin-featured-video-badge {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-height: 27px;
    padding: 5px 9px;
    border-radius: 999px;
    background: rgba(45, 49, 149, 0.94);
    color: #fff;
    box-shadow: 0 7px 18px rgba(0, 0, 0, 0.14);
    font-size: 0.61rem;
    font-weight: 900;
  }

  .admin-featured-video-number {
    position: absolute;
    right: 12px;
    top: 12px;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 30px;
    height: 30px;
    padding: 0 8px;
    border-radius: 999px;
    background: rgba(15, 17, 28, 0.62);
    color: #fff;
    backdrop-filter: blur(9px);
    font-size: 0.62rem;
    font-weight: 900;
  }

  .admin-featured-video-play-icon {
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 2;
    width: 52px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translate(-50%, -50%);
    border: 1px solid rgba(255, 255, 255, 0.28);
    border-radius: 50%;
    background: rgba(45, 49, 149, 0.88);
    color: #fff;
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2);
    pointer-events: none;
  }

  .admin-featured-video-card .card-body {
    display: flex;
    flex-direction: column;
    min-height: 180px;
    padding: 17px !important;
  }

  .admin-featured-video-card .badge {
    border-radius: 999px !important;
    padding: 5px 9px !important;
    background: #EEF0FF !important;
    color: #2D3195 !important;
    font-family: "Nunito", sans-serif !important;
    font-size: 0.58rem !important;
    font-weight: 900 !important;
  }

  .admin-featured-video-title {
    margin: 10px 0 0 !important;
    color: var(--admin-text) !important;
    font-family: "Poppins", sans-serif !important;
    font-size: 0.94rem !important;
    font-weight: 800 !important;
    line-height: 1.3 !important;
  }

  .admin-featured-video-description {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    min-height: 50px;
    overflow: hidden;
    margin: 7px 0 14px;
    color: var(--admin-muted);
    font-family: "Nunito", sans-serif;
    font-size: 0.69rem;
    font-weight: 600;
    line-height: 1.55;
  }

  .admin-featured-video-date {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: auto;
    color: var(--admin-muted);
    font-family: "Nunito", sans-serif;
    font-size: 0.63rem;
    font-weight: 700;
  }

  .admin-featured-video-date svg {
    color: #2D3195;
  }

  .admin-featured-video-actions {
    display: flex;
    gap: 8px;
    padding-top: 12px;
    margin-top: 13px;
    border-top: 1px solid #EEF0F4;
  }

  .admin-featured-video-actions .btn {
    min-height: 36px;
    border-radius: 10px !important;
    font-family: "Nunito", sans-serif !important;
    font-size: 0.67rem !important;
    font-weight: 900 !important;
  }

  .admin-featured-video-preview-button {
    flex: 1;
    color: #2D3195 !important;
    border-color: rgba(45, 49, 149, 0.25) !important;
    background: #F8F8FF !important;
  }

  .admin-featured-video-preview-button:hover {
    color: #fff !important;
    border-color: #2D3195 !important;
    background: #2D3195 !important;
  }

  .admin-featured-video-delete-button {
    width: 40px;
    color: #C74350 !important;
    border-color: rgba(199, 67, 80, 0.2) !important;
    background: #FFF7F8 !important;
  }

  .admin-featured-video-delete-button:hover {
    color: #fff !important;
    border-color: #C74350 !important;
    background: #C74350 !important;
  }

  /* =======================================================
     LOADING / EMPTY
  ======================================================= */

  .admin-featured-videos-loading,
  .admin-featured-videos-empty {
    min-height: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    border: 1px solid var(--admin-border);
    border-radius: 18px;
    background: var(--admin-surface);
    text-align: center;
  }

  .admin-featured-loading-icon,
  .admin-featured-empty-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #2D3195;
    background: #EEF0FF;
  }

  .admin-featured-loading-icon {
    width: 52px;
    height: 52px;
    border-radius: 15px;
  }

  .admin-featured-empty-icon {
    width: 62px;
    height: 62px;
    border-radius: 18px;
  }

  .admin-featured-loading-title,
  .admin-featured-empty-title {
    margin-top: 13px;
    color: var(--admin-text);
    font-family: "Poppins", sans-serif;
    font-size: 0.84rem;
    font-weight: 800;
  }

  .admin-featured-loading-subtitle,
  .admin-featured-empty-text {
    max-width: 470px;
    margin: 5px 0 0;
    color: var(--admin-muted);
    font-size: 0.68rem;
    font-weight: 600;
    line-height: 1.55;
  }

  /* =======================================================
     MODAL
  ======================================================= */

  .admin-featured-videos-modal .modal-content {
    overflow: hidden;
    border: 1px solid var(--admin-border) !important;
    border-radius: 18px !important;
    background: var(--admin-surface) !important;
    box-shadow: 0 22px 60px rgba(26, 30, 53, 0.18) !important;
  }

  .admin-featured-videos-modal .modal-header {
    position: relative;
    min-height: 78px;
    overflow: hidden;
    padding: 16px 20px !important;
    border-bottom: 0 !important;
    background: #2D3195 !important;
    color: #fff !important;
  }

  .admin-featured-videos-modal .modal-header::after {
    content: "";
    position: absolute;
    width: 170px;
    height: 170px;
    right: -55px;
    top: -75px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    pointer-events: none;
  }

  .admin-featured-videos-modal .modal-header .btn-close {
    position: relative;
    z-index: 3;
    filter: brightness(0) invert(1);
    opacity: 0.85;
  }

  .admin-featured-modal-title {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .admin-featured-modal-title-icon {
    width: 40px;
    height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.16);
    border: 1px solid rgba(255, 255, 255, 0.22);
  }

  .admin-featured-modal-title-kicker {
    display: block;
    color: rgba(255, 255, 255, 0.72);
    font-family: "Nunito", sans-serif;
    font-size: 0.58rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 2px;
  }

  .admin-featured-modal-title-text {
    display: block;
    color: #fff;
    font-family: "Poppins", sans-serif;
    font-size: 1.05rem;
    font-weight: 800;
  }

  .admin-featured-videos-modal .modal-body {
    padding: 22px !important;
    background: #FBFBFD !important;
    color: var(--admin-text);
  }

  .admin-featured-form-intro {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 12px 14px;
    margin-bottom: 20px;
    border: 1px solid rgba(45, 49, 149, 0.11);
    border-radius: 13px;
    background: #F7F7FF;
  }

  .admin-featured-form-intro-icon {
    width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    border-radius: 10px;
    background: #EEF0FF;
    color: #2D3195;
  }

  .admin-featured-form-intro strong {
    display: block;
    color: #2D3195;
    font-size: 0.72rem;
    font-weight: 900;
  }

  .admin-featured-form-intro span {
    display: block;
    margin-top: 2px;
    color: #7C8290;
    font-size: 0.63rem;
    font-weight: 600;
  }

  .admin-featured-videos-modal .form-label {
    color: #4E5564;
    font-family: "Nunito", sans-serif;
    font-size: 0.67rem;
    font-weight: 900 !important;
    margin-bottom: 6px;
  }

  .admin-featured-videos-modal .form-control {
    min-height: 42px;
    border: 1px solid #E0E3EA !important;
    border-radius: 11px !important;
    background: #fff !important;
    color: #1B1D24 !important;
    font-family: "Nunito", sans-serif !important;
    font-size: 0.7rem !important;
    font-weight: 600 !important;
    box-shadow: 0 3px 10px rgba(26, 30, 53, 0.025) !important;
  }

  .admin-featured-videos-modal textarea.form-control {
    min-height: 100px;
    resize: vertical;
  }

  .admin-featured-videos-modal .form-control:focus {
    border-color: rgba(45, 49, 149, 0.52) !important;
    box-shadow: 0 0 0 3px rgba(45, 49, 149, 0.08) !important;
  }

  .admin-featured-file-box {
    position: relative;
    overflow: hidden;
    padding: 18px;
    border: 1px dashed rgba(45, 49, 149, 0.28);
    border-radius: 14px;
    background: #F8F8FF;
    transition:
      border-color 0.2s ease,
      background 0.2s ease;
  }

  .admin-featured-file-box:hover {
    border-color: rgba(45, 49, 149, 0.55);
    background: #F4F4FF;
  }

  .admin-featured-file-icon {
    width: 42px;
    height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 9px;
    border-radius: 12px;
    background: #EEF0FF;
    color: #2D3195;
  }

  .admin-featured-file-title {
    color: #2D3195;
    font-family: "Poppins", sans-serif;
    font-size: 0.76rem;
    font-weight: 800;
  }

  .admin-featured-file-description {
    margin-top: 3px;
    color: #858B98;
    font-size: 0.62rem;
    font-weight: 600;
    line-height: 1.5;
  }

  .admin-featured-file-input {
    margin-top: 12px;
  }

  .admin-featured-file-input.form-control {
    padding: 8px 10px;
    min-height: 43px;
  }

  .admin-featured-selected-file {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    padding: 8px 10px;
    border-radius: 10px;
    background: #EEF0FF;
    color: #2D3195;
    font-size: 0.64rem;
    font-weight: 800;
    overflow-wrap: anywhere;
  }

  .admin-featured-upload-preview {
    margin-top: 16px;
    overflow: hidden;
    border: 1px solid #E5E7EE;
    border-radius: 14px;
    background: #11131D;
  }

  .admin-featured-upload-preview video {
    width: 100%;
    max-height: 280px;
    display: block;
    object-fit: contain;
    background: #11131D;
  }

  .admin-featured-videos-modal .modal-footer {
    gap: 8px;
    padding: 12px 20px !important;
    border-top: 1px solid #EEF0F4 !important;
    background: #fff !important;
  }

  .admin-featured-videos-modal .modal-footer .btn {
    min-height: 39px;
    border-radius: 10px !important;
    padding: 8px 15px !important;
    font-family: "Nunito", sans-serif !important;
    font-size: 0.69rem !important;
    font-weight: 900 !important;
  }

  .admin-featured-save-button {
    border: 0 !important;
    background: #2D3195 !important;
    color: #fff !important;
    box-shadow: 0 8px 18px rgba(45, 49, 149, 0.16);
  }

  .admin-featured-save-button:hover {
    background: #242879 !important;
  }

  /* =======================================================
     VIEW MODAL
  ======================================================= */

  .admin-featured-video-view {
    overflow: hidden;
    border-radius: 15px;
    background: #11131D;
  }

  .admin-featured-video-view video {
    width: 100%;
    max-height: 480px;
    display: block;
    background: #11131D;
  }

  .admin-featured-video-view-info {
    padding: 17px 0 0;
  }

  .admin-featured-video-view-title {
    margin: 0;
    color: var(--admin-text);
    font-family: "Poppins", sans-serif;
    font-size: 1.05rem;
    font-weight: 800;
  }

  .admin-featured-video-view-description {
    margin: 8px 0 0;
    color: var(--admin-muted);
    font-family: "Nunito", sans-serif;
    font-size: 0.72rem;
    font-weight: 600;
    line-height: 1.65;
  }

  /* =======================================================
     DARK MODE
  ======================================================= */

  .admin-featured-videos-dark {
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

  .admin-featured-videos-dark .admin-featured-videos-toolbar,
  .admin-featured-videos-dark .admin-featured-video-card,
  .admin-featured-videos-dark .admin-featured-videos-loading,
  .admin-featured-videos-dark .admin-featured-videos-empty,
  .admin-featured-videos-dark .admin-stat-card {
    background: #191C2B !important;
    border-color: #2B3042 !important;
  }

  .admin-featured-videos-dark .admin-toolbar-heading-icon,
  .admin-featured-videos-dark .admin-stat-icon-blue,
  .admin-featured-videos-dark .admin-stat-icon-yellow,
  .admin-featured-videos-dark .admin-stat-icon-purple,
  .admin-featured-videos-dark .admin-featured-empty-icon,
  .admin-featured-videos-dark .admin-featured-loading-icon {
    background: #262B46 !important;
  }

  .admin-featured-videos-dark .admin-featured-videos-toolbar-title,
  .admin-featured-videos-dark .admin-featured-video-title,
  .admin-featured-videos-dark .admin-stat-value,
  .admin-featured-videos-dark .admin-featured-loading-title,
  .admin-featured-videos-dark .admin-featured-empty-title,
  .admin-featured-videos-dark .admin-featured-video-view-title {
    color: #F1F3F8 !important;
  }

  .admin-featured-videos-dark .admin-featured-video-actions {
    border-color: #2B3042;
  }

  .admin-featured-videos-dark .admin-featured-video-preview-button {
    background: #202436 !important;
    border-color: #343A4F !important;
    color: #C9CCFF !important;
  }

  .admin-featured-videos-dark .admin-featured-videos-modal .modal-content {
    background: #191C2B !important;
    border-color: #2B3042 !important;
  }

  .admin-featured-videos-dark .admin-featured-videos-modal .modal-body {
    background: #151827 !important;
  }

  .admin-featured-videos-dark .admin-featured-videos-modal .modal-footer {
    background: #191C2B !important;
    border-color: #2B3042 !important;
  }

  .admin-featured-videos-dark .admin-featured-form-intro,
  .admin-featured-videos-dark .admin-featured-file-box {
    background: #202436 !important;
    border-color: #343A4F !important;
  }

  .admin-featured-videos-dark .admin-featured-form-intro strong,
  .admin-featured-videos-dark .admin-featured-file-title {
    color: #C9CCFF !important;
  }

  .admin-featured-videos-dark .admin-featured-videos-modal .form-label {
    color: #D9DCE7 !important;
  }

  .admin-featured-videos-dark .admin-featured-videos-modal .form-control {
    background: #202436 !important;
    border-color: #343A4F !important;
    color: #F1F3F8 !important;
  }

  .admin-featured-videos-dark .admin-featured-selected-file {
    background: #262B46 !important;
    color: #C9CCFF !important;
  }

  /* =======================================================
     ANIMATION
  ======================================================= */

  @keyframes adminFeaturedVideoCardIn {
    from {
      opacity: 0;
      transform: translateY(12px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes adminFeaturedDashboardFade {
    from {
      opacity: 0;
      transform: translateY(5px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .admin-featured-videos-page > * {
    animation: adminFeaturedDashboardFade 0.4s ease both;
  }

  /* =======================================================
     RESPONSIVE
  ======================================================= */

  @media (max-width: 991.98px) {
    .admin-featured-videos-heading {
      align-items: flex-start !important;
      flex-direction: column;
      gap: 14px;
    }

    .admin-featured-videos-add-button {
      width: 100%;
    }
  }

  @media (max-width: 767.98px) {
    .admin-featured-videos-title {
      font-size: 2rem !important;
    }

    .admin-featured-video-preview {
      height: 205px;
    }

    .admin-featured-videos-modal .modal-body {
      padding: 17px !important;
    }

    .admin-featured-videos-modal .modal-header {
      padding: 15px 17px !important;
    }

    .admin-featured-videos-modal .modal-footer {
      padding: 11px 17px !important;
    }
  }

  @media (max-width: 479.98px) {
    .admin-featured-videos-title {
      font-size: 1.8rem !important;
    }

    .admin-featured-video-preview {
      height: 190px;
    }
  }
`;

/* =========================================================
   HELPERS
========================================================= */

const formatDate = (value: string | null | undefined): string => {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/* =========================================================
   COMPONENT
========================================================= */

const AdminFeaturedVideos: React.FC = () => {
  /*
   * IMPORTANT:
   * AdminAttractions uses `darkMode`, not `isDarkMode`.
   */
  const { darkMode } = useDarkMode();

  const [videos, setVideos] = useState<FeaturedVideo[]>([]);
  const [loading, setLoading] = useState(true);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [selectedVideo, setSelectedVideo] =
    useState<FeaturedVideo | null>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* =======================================================
     LOAD VIDEOS
  ======================================================= */

  const loadVideos = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getFeaturedVideos();

      const data = Array.isArray(response?.data)
        ? response.data
        : [];

      setVideos(data);
    } catch (err: any) {
      console.error("Failed to load featured videos:", err);

      setVideos([]);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load featured videos."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  /* =======================================================
     SORTED VIDEOS
  ======================================================= */

  const sortedVideos = useMemo(() => {
    return [...videos].sort((a, b) => {
      const dateA = new Date(a.created_at || "").getTime();
      const dateB = new Date(b.created_at || "").getTime();

      return dateB - dateA;
    });
  }, [videos]);

  /* =======================================================
     STATS
  ======================================================= */

  const totalVideos = videos.length;

  const latestVideo = sortedVideos[0];

  const latestVideoDate = latestVideo
    ? formatDate(latestVideo.created_at)
    : "No uploads yet";

  /* =======================================================
     FILE HANDLING
  ======================================================= */

  const handleVideoFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] || null;

    setError("");
    setSuccess("");

    if (!file) {
      setVideoFile(null);
      setVideoPreviewUrl("");
      return;
    }

    if (file.type !== "video/mp4") {
      setVideoFile(null);
      setVideoPreviewUrl("");

      setError("Please select an MP4 video file.");

      event.target.value = "";
      return;
    }

    const MAX_SIZE = 200 * 1024 * 1024;

    if (file.size > MAX_SIZE) {
      setVideoFile(null);
      setVideoPreviewUrl("");

      setError("The video file must be 200 MB or smaller.");

      event.target.value = "";
      return;
    }

    setVideoFile(file);

    const previewUrl = URL.createObjectURL(file);

    setVideoPreviewUrl(previewUrl);
  };

  /* =======================================================
     CLEAN PREVIEW URL
  ======================================================= */

  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  /* =======================================================
     OPEN UPLOAD MODAL
  ======================================================= */

  const openUploadModal = () => {
    setError("");
    setSuccess("");

    setTitle("");
    setDescription("");
    setVideoFile(null);
    setVideoPreviewUrl("");

    setShowUploadModal(true);
  };

  /* =======================================================
     CLOSE UPLOAD MODAL
  ======================================================= */

  const closeUploadModal = () => {
    if (saving) return;

    setShowUploadModal(false);

    setError("");
    setTitle("");
    setDescription("");
    setVideoFile(null);

    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }

    setVideoPreviewUrl("");
  };

  /* =======================================================
     UPLOAD
  ======================================================= */

  const handleUpload = async () => {
    setError("");
    setSuccess("");

    if (!videoFile) {
      setError("Please select an MP4 video.");
      return;
    }

    if (!title.trim()) {
      setError("Please enter a video title.");
      return;
    }

    setSaving(true);

    try {
      await uploadFeaturedVideo(
        videoFile,
        title.trim(),
        description.trim()
      );

      setSuccess("Featured video uploaded successfully.");

      setShowUploadModal(false);

      setTitle("");
      setDescription("");
      setVideoFile(null);

      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }

      setVideoPreviewUrl("");

      await loadVideos();
    } catch (err: any) {
      console.error("Failed to upload featured video:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to upload featured video."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     VIEW VIDEO
  ======================================================= */

  const openViewModal = (video: FeaturedVideo) => {
    setSelectedVideo(video);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedVideo(null);
  };

  /* =======================================================
     DELETE
  ======================================================= */

  const handleDelete = async (video: FeaturedVideo) => {
    const confirmed = window.confirm(
      `Delete "${video.title}"?\n\nThis will permanently remove the featured video.`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setDeletingId(video.id);

    try {
      await deleteFeaturedVideo(video.id);

      setSuccess("Featured video deleted successfully.");

      if (selectedVideo?.id === video.id) {
        setShowViewModal(false);
        setSelectedVideo(null);
      }

      await loadVideos();
    } catch (err: any) {
      console.error("Failed to delete featured video:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete featured video."
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <AdminLayout>
      <style>{ADMIN_FEATURED_VIDEOS_STYLES}</style>

      <div
        className={`admin-featured-videos-page ${
          darkMode ? "admin-featured-videos-dark" : ""
        }`}
      >
        {/* =================================================
            PAGE HEADING
        ================================================= */}

        <div className="admin-featured-videos-heading">
          <div>
            <div className="admin-featured-videos-eyebrow">
              Content Management
            </div>

            <h1 className="admin-featured-videos-title">
              Featured Videos
            </h1>

            <p className="admin-featured-videos-subtitle">
              Manage the cinematic videos displayed in the
              featured section of the Calbayog City Tourism
              welcome page.
            </p>
          </div>

          <Button
            className="admin-featured-videos-add-button"
            onClick={openUploadModal}
          >
            <Plus size={16} strokeWidth={2.2} />
            Add Featured Video
          </Button>
        </div>

        {/* =================================================
            ALERTS
        ================================================= */}

        {error && !showUploadModal && (
          <Alert
            variant="danger"
            className="mb-3"
            dismissible
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            variant="success"
            className="mb-3"
            dismissible
            onClose={() => setSuccess("")}
          >
            <Check size={15} className="me-2" />
            {success}
          </Alert>
        )}

        {/* =================================================
            STATS
        ================================================= */}

        <Row className="g-3 admin-featured-videos-stats">
          <Col xs={12} md={4}>
            <Card className="admin-stat-card h-100">
              <Card.Body>
                <div className="admin-stat-card-top">
                  <span className="admin-stat-icon admin-stat-icon-blue">
                    <Video size={17} strokeWidth={2} />
                  </span>

                  <span className="admin-stat-label">
                    Total Videos
                  </span>
                </div>

                <div className="admin-stat-value">
                  {totalVideos}
                </div>

                <div className="admin-stat-caption">
                  Videos currently available for the homepage
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} md={4}>
            <Card className="admin-stat-card h-100">
              <Card.Body>
                <div className="admin-stat-card-top">
                  <span className="admin-stat-icon admin-stat-icon-yellow">
                    <Film size={17} strokeWidth={2} />
                  </span>

                  <span className="admin-stat-label">
                    Format
                  </span>
                </div>

                <div className="admin-stat-value">
                  MP4
                </div>

                <div className="admin-stat-caption">
                  Maximum upload size: 200 MB
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} md={4}>
            <Card className="admin-stat-card h-100">
              <Card.Body>
                <div className="admin-stat-card-top">
                  <span className="admin-stat-icon admin-stat-icon-purple">
                    <Clock3 size={17} strokeWidth={2} />
                  </span>

                  <span className="admin-stat-label">
                    Latest Upload
                  </span>
                </div>

                <div
                  className="admin-stat-value"
                  style={{
                    fontSize: latestVideo ? "1.2rem" : undefined,
                    paddingTop: latestVideo ? 5 : 0,
                  }}
                >
                  {latestVideoDate}
                </div>

                <div className="admin-stat-caption">
                  Most recently added featured video
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <Card className="admin-featured-videos-toolbar">
          <Card.Body>
            <div className="admin-featured-videos-toolbar-heading">
              <span className="admin-toolbar-heading-icon">
                <Video size={17} strokeWidth={2} />
              </span>

              <div>
                <div className="admin-featured-videos-toolbar-title">
                  Homepage Featured Videos
                </div>

                <div className="admin-featured-videos-toolbar-caption">
                  These videos are managed here and can be used
                  by the public welcome page.
                </div>
              </div>

              <Button
                variant="link"
                className="ms-auto p-1"
                onClick={loadVideos}
                disabled={loading}
                title="Refresh videos"
                aria-label="Refresh videos"
                style={{
                  color: CALBAYOG_BLUE,
                }}
              >
                <RefreshCw
                  size={17}
                  strokeWidth={2}
                  className={loading ? "spin" : ""}
                />
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* =================================================
            CONTENT
        ================================================= */}

        {loading ? (
          <div className="admin-featured-videos-loading">
            <div className="admin-featured-loading-icon">
              <Spinner
                animation="border"
                size="sm"
                style={{
                  color: CALBAYOG_BLUE,
                }}
              />
            </div>

            <div className="admin-featured-loading-title">
              Loading featured videos...
            </div>

            <p className="admin-featured-loading-subtitle">
              Please wait while the latest homepage videos
              are loaded.
            </p>
          </div>
        ) : sortedVideos.length === 0 ? (
          <div className="admin-featured-videos-empty">
            <div className="admin-featured-empty-icon">
              <Film size={27} strokeWidth={1.8} />
            </div>

            <div className="admin-featured-empty-title">
              No Featured Videos Yet
            </div>

            <p className="admin-featured-empty-text">
              Upload your first MP4 video to start building the
              featured video section of the Calbayog City
              Tourism welcome page.
            </p>

            <Button
              variant="outline-primary"
              className="mt-3"
              onClick={openUploadModal}
              style={{
                borderRadius: 10,
                fontSize: "0.68rem",
                fontWeight: 800,
                color: CALBAYOG_BLUE,
                borderColor: "rgba(45,49,149,.28)",
              }}
            >
              <Plus size={14} className="me-1" />
              Add First Video
            </Button>
          </div>
        ) : (
          <Row className="g-3 g-md-4 admin-featured-videos-grid">
            {sortedVideos.map((video, index) => (
              <Col
                xs={12}
                md={6}
                lg={4}
                key={video.id}
              >
                <Card className="admin-featured-video-card">
                  {/* VIDEO PREVIEW */}

                  <div className="admin-featured-video-preview">
                    <video
                      src={video.video_url}
                      muted
                      playsInline
                      preload="metadata"
                    />

                    <div className="admin-featured-video-preview-overlay" />

                    <span className="admin-featured-video-badge">
                      <Video
                        size={12}
                        strokeWidth={2.2}
                      />
                      Featured
                    </span>

                    <span className="admin-featured-video-number">
                      #{index + 1}
                    </span>

                    <span className="admin-featured-video-play-icon">
                      <Play
                        size={22}
                        fill="currentColor"
                        strokeWidth={1.7}
                      />
                    </span>
                  </div>

                  {/* CARD BODY */}

                  <Card.Body>
                    <div>
                      <Badge>
                        Homepage Video
                      </Badge>
                    </div>

                    <h5 className="admin-featured-video-title">
                      {video.title}
                    </h5>

                    <p className="admin-featured-video-description">
                      {video.description ||
                        "No description provided for this featured video."}
                    </p>

                    <div className="admin-featured-video-date">
                      <Clock3
                        size={13}
                        strokeWidth={2}
                      />

                      <span>
                        Added{" "}
                        {formatDate(video.created_at)}
                      </span>
                    </div>

                    <div
                      className="admin-featured-video-actions"
                      onClick={(event) =>
                        event.stopPropagation()
                      }
                    >
                      <Button
                        variant="outline-primary"
                        className="admin-featured-video-preview-button"
                        onClick={() =>
                          openViewModal(video)
                        }
                      >
                        <Play
                          size={13}
                          strokeWidth={2}
                        />
                        Preview
                      </Button>

                      <Button
                        variant="outline-danger"
                        className="admin-featured-video-delete-button"
                        onClick={() =>
                          handleDelete(video)
                        }
                        disabled={
                          deletingId === video.id
                        }
                        aria-label={`Delete ${video.title}`}
                        title="Delete featured video"
                      >
                        {deletingId === video.id ? (
                          <Spinner
                            animation="border"
                            size="sm"
                          />
                        ) : (
                          <Trash2
                            size={14}
                            strokeWidth={2}
                          />
                        )}

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

        {/* =================================================
            UPLOAD MODAL
        ================================================= */}

        <Modal
          className="admin-featured-videos-modal"
          show={showUploadModal}
          onHide={closeUploadModal}
          centered
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title className="admin-featured-modal-title">
              <span className="admin-featured-modal-title-icon">
                <Upload
                  size={20}
                  strokeWidth={2}
                />
              </span>

              <span>
                <span className="admin-featured-modal-title-kicker">
                  Featured Video Management
                </span>

                <span className="admin-featured-modal-title-text">
                  Add Featured Video
                </span>
              </span>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {error && (
              <Alert
                variant="danger"
                className="mb-3"
                dismissible
                onClose={() => setError("")}
              >
                {error}
              </Alert>
            )}

            <div className="admin-featured-form-intro">
              <div className="admin-featured-form-intro-icon">
                <Info
                  size={17}
                  strokeWidth={2.1}
                />
              </div>

              <div>
                <strong>
                  Add a homepage featured video
                </strong>

                <span>
                  Use an MP4 video and provide a clear title
                  and optional description for visitors.
                </span>
              </div>
            </div>

            {/* TITLE */}

            <Form.Group className="mb-3">
              <Form.Label>
                Video Title
              </Form.Label>

              <Form.Control
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="e.g. Discover Calbayog City"
                disabled={saving}
              />
            </Form.Group>

            {/* DESCRIPTION */}

            <Form.Group className="mb-3">
              <Form.Label>
                Description
              </Form.Label>

              <Form.Control
                as="textarea"
                rows={4}
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Briefly describe what visitors will see in this video..."
                disabled={saving}
              />
            </Form.Group>

            {/* VIDEO FILE */}

            <Form.Group>
              <Form.Label>
                Featured Video
              </Form.Label>

              <div className="admin-featured-file-box">
                <div className="admin-featured-file-icon">
                  <Video
                    size={20}
                    strokeWidth={2}
                  />
                </div>

                <div className="admin-featured-file-title">
                  Upload MP4 Video
                </div>

                <div className="admin-featured-file-description">
                  MP4 format only. Maximum file size is
                  200 MB.
                </div>

                <Form.Control
                  className="admin-featured-file-input"
                  type="file"
                  accept="video/mp4,.mp4"
                  onChange={handleVideoFileChange}
                  disabled={saving}
                />

                {videoFile && (
                  <div className="admin-featured-selected-file">
                    <Check
                      size={14}
                      strokeWidth={2.4}
                    />

                    <span>
                      {videoFile.name}
                    </span>
                  </div>
                )}
              </div>
            </Form.Group>

            {/* VIDEO PREVIEW */}

            {videoPreviewUrl && (
              <div className="admin-featured-upload-preview">
                <video
                  src={videoPreviewUrl}
                  controls
                  playsInline
                />
              </div>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={closeUploadModal}
              disabled={saving}
            >
              <X
                size={14}
                className="me-1"
              />
              Cancel
            </Button>

            <Button
              className="admin-featured-save-button"
              onClick={handleUpload}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Spinner
                    animation="border"
                    size="sm"
                    className="me-2"
                  />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload
                    size={14}
                    className="me-1"
                  />
                  Upload Video
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* =================================================
            VIEW VIDEO MODAL
        ================================================= */}

        <Modal
          className="admin-featured-videos-modal"
          show={showViewModal}
          onHide={closeViewModal}
          centered
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title className="admin-featured-modal-title">
              <span className="admin-featured-modal-title-icon">
                <Play
                  size={19}
                  strokeWidth={2}
                />
              </span>

              <span>
                <span className="admin-featured-modal-title-kicker">
                  Video Preview
                </span>

                <span className="admin-featured-modal-title-text">
                  Featured Video
                </span>
              </span>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {selectedVideo && (
              <>
                <div className="admin-featured-video-view">
                  <video
                    src={selectedVideo.video_url}
                    controls
                    autoPlay
                    playsInline
                  />
                </div>

                <div className="admin-featured-video-view-info">
                  <h3 className="admin-featured-video-view-title">
                    {selectedVideo.title}
                  </h3>

                  <p className="admin-featured-video-view-description">
                    {selectedVideo.description ||
                      "No description provided."}
                  </p>

                  <div className="admin-featured-video-date mt-3">
                    <Clock3
                      size={13}
                      strokeWidth={2}
                    />

                    <span>
                      Added{" "}
                      {formatDate(
                        selectedVideo.created_at
                      )}
                    </span>
                  </div>
                </div>
              </>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={closeViewModal}
            >
              Close
            </Button>

            {selectedVideo && (
              <Button
                variant="outline-danger"
                onClick={() =>
                  handleDelete(selectedVideo)
                }
                disabled={
                  deletingId === selectedVideo.id
                }
              >
                {deletingId === selectedVideo.id ? (
                  <Spinner
                    animation="border"
                    size="sm"
                    className="me-1"
                  />
                ) : (
                  <Trash2
                    size={14}
                    className="me-1"
                  />
                )}
                Delete Video
              </Button>
            )}
          </Modal.Footer>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminFeaturedVideos;
