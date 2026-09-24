import React, { useEffect, useRef, useState } from "react";
import { Container, Form, InputGroup } from "react-bootstrap";
import { useHistory } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import LoginModal from "../LoginModal";
import SignupModal from "../SignupModal";

interface AppHeaderProps {
  onMenuClick: () => void;
  onSearch?: (query: string) => void;

  showSearch?: boolean;

  searchPath?: string;

  searchPlaceholder?: string;

  showAnnouncements?: boolean;

  extraActions?: React.ReactNode;

  isAdmin?: boolean;
}

/* =========================================================
   ANNOUNCEMENT
========================================================= */

interface Announcement {
  id: number;
  title: string;
  description: string;
  date: string;
  icon: string;
}

/* =========================================================
   ICONS
========================================================= */

type HeaderIconName =
  | "menu"
  | "search"
  | "bell"
  | "sun"
  | "moon"
  | "close"
  | "login"
  | "signup"
  | "user"
  | "chevron"
  | "lock"
  | "logout"
  | "download";

interface HeaderIconProps {
  name: HeaderIconName;
  size?: number;
  strokeWidth?: number;
}

const HeaderIcon: React.FC<HeaderIconProps> = ({
  name,
  size = 20,
  strokeWidth = 1.8,
}) => {
  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "menu":
      return (
        <svg {...commonProps}>
          <path d="M4 6H20" />
          <path d="M4 12H15" />
          <path d="M4 18H10" />
        </svg>
      );

    case "search":
      return (
        <svg {...commonProps}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4.5 4.5" />
        </svg>
      );

    case "bell":
      return (
        <svg {...commonProps}>
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
      );

    case "sun":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="4" />

          <path d="M12 2v2" />
          <path d="M12 20v2" />

          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />

          <path d="M2 12h2" />
          <path d="M20 12h2" />

          <path d="m4.93 19.07 1.41-1.41" />
          <path d="m17.66 6.34 1.41-1.41" />
        </svg>
      );

    case "moon":
      return (
        <svg {...commonProps}>
          <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z" />
        </svg>
      );

    case "close":
      return (
        <svg {...commonProps}>
          <path d="m6 6 12 12" />
          <path d="m18 6-12 12" />
        </svg>
      );

    case "login":
      return (
        <svg {...commonProps}>
          <path d="M10 17l5-5-5-5" />
          <path d="M15 12H3" />
          <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
        </svg>
      );

    case "signup":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c.8-3.2 3.1-5 7-5s6.2 1.8 7 5" />
          <path d="M19 8v5" />
          <path d="M16.5 10.5h5" />
        </svg>
      );

    case "user":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c.8-3.2 3.1-5 7-5s6.2 1.8 7 5" />
        </svg>
      );

    case "chevron":
      return (
        <svg {...commonProps}>
          <path d="m7 10 5 5 5-5" />
        </svg>
      );

    case "lock":
      return (
        <svg {...commonProps}>
          <rect x="5" y="10" width="14" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      );

    case "logout":
      return (
        <svg {...commonProps}>
          <path d="M10 17l5-5-5-5" />
          <path d="M15 12H3" />
          <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
        </svg>
      );

    case "download":
      return (
        <svg {...commonProps}>
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
      );

    default:
      return null;
  }
};

/* =========================================================
   STYLES
========================================================= */

const AppHeaderStyles: React.FC = () => (
  <style>{`
    :root {
      --calbayog-blue: #2D3195;
      --calbayog-blue-dark: #242875;
      --calbayog-blue-soft: rgba(45, 49, 149, 0.09);
      --calbayog-blue-border: rgba(45, 49, 149, 0.18);

      --calbayog-yellow: #FFB71B;
      --calbayog-yellow-soft: rgba(255, 183, 27, 0.12);
      --calbayog-yellow-border: rgba(255, 183, 27, 0.28);

      --header-text: #142033;
      --header-muted: #687386;

      --glass-border: rgba(255, 255, 255, 0.42);

      --header-shadow:
        0 8px 30px rgba(17, 24, 39, 0.06);
    }

    html.dark-mode {
      --header-text: #f5f8fc;
      --header-muted: #9aa8ba;

      --glass-border:
        rgba(255, 255, 255, 0.09);

      --header-shadow:
        0 10px 34px rgba(0, 0, 0, 0.22);
    }

    /* =====================================================
       HEADER
    ===================================================== */

    .sticky-search-header {
      position: sticky;
      top: 0;
      z-index: 1100;
      width: 100%;

      background:
        linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.70) 0%,
          rgba(255, 255, 255, 0.48) 100%
        );

      backdrop-filter:
        blur(22px)
        saturate(160%);

      -webkit-backdrop-filter:
        blur(22px)
        saturate(160%);

      border-bottom:
        1px solid rgba(45, 49, 149, 0.08);

      box-shadow:
        var(--header-shadow);

      isolation: isolate;

      animation:
        headerReveal 0.35s ease-out both;
    }

    @keyframes headerReveal {
      from {
        opacity: 0;
        transform: translateY(-5px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    html.dark-mode .sticky-search-header {
      background:
        linear-gradient(
          180deg,
          rgba(10, 20, 34, 0.74) 0%,
          rgba(10, 20, 34, 0.54) 100%
        );

      border-bottom:
        1px solid rgba(255, 255, 255, 0.07);
    }

    .app-header-container {
      width: 100%;
    }

    .app-header-container.container {
      max-width: 1480px;
    }

    .app-header-inner {
      width: 100%;
      min-height: 64px;

      display: flex;
      align-items: center;

      gap: 9px;
      padding: 0;
    }

    /* =====================================================
       GENERAL HEADER BUTTON
    ===================================================== */

    .header-icon-btn {
      position: relative;

      width: 42px;
      height: 42px;
      min-width: 42px;

      padding: 0;

      display: inline-flex;
      align-items: center;
      justify-content: center;

      border:
        1px solid transparent;

      border-radius: 13px;

      background: transparent;

      color: var(--header-text);

      cursor: pointer;

      flex-shrink: 0;

      transition:
        background 0.22s cubic-bezier(.2,.8,.2,1),
        color 0.22s cubic-bezier(.2,.8,.2,1),
        border-color 0.22s cubic-bezier(.2,.8,.2,1),
        transform 0.22s cubic-bezier(.2,.8,.2,1),
        box-shadow 0.22s ease;
    }

    .header-icon-btn svg {
      transition:
        transform 0.22s cubic-bezier(.2,.8,.2,1);
    }

    .header-icon-btn:hover {
      color: var(--calbayog-blue);

      background:
        var(--calbayog-blue-soft);

      border-color:
        var(--calbayog-blue-border);

      transform:
        translateY(-1px);
    }

    .header-icon-btn:hover svg {
      transform: scale(1.05);
    }

    .header-icon-btn:active {
      transform: scale(0.94);
    }

    .header-icon-btn:focus-visible {
      outline:
        2px solid rgba(45, 49, 149, 0.35);

      outline-offset: 2px;
    }

    .menu-btn {
      margin-right: 1px;
    }

    /* =====================================================
       BRAND
    ===================================================== */

    .header-brand {
      display: flex;
      align-items: center;

      flex-shrink: 0;

      margin-right: 4px;

      animation:
        brandReveal 0.45s ease-out 0.05s both;
    }

    @keyframes brandReveal {
      from {
        opacity: 0;
        transform: translateX(-5px);
      }

      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .header-brand-mark {
      width: 48px;
      height: 48px;

      display: flex;
      align-items: center;
      justify-content: center;

      flex-shrink: 0;
    }

    .header-brand-mark img {
      width: 100%;
      height: 100%;

      display: block;

      object-fit: contain;

      transition:
        transform 0.28s cubic-bezier(.2,.8,.2,1),
        filter 0.28s ease;
    }

    .header-brand:hover .header-brand-mark img {
      transform:
        scale(1.045)
        rotate(-1deg);
    }

    /* =====================================================
       SEARCH
    ===================================================== */

    .header-search-container {
      flex: 1 1 auto;

      min-width: 170px;
      max-width: 720px;

      margin-left: 10px;

      animation:
        searchReveal 0.4s ease-out 0.08s both;
    }

    @keyframes searchReveal {
      from {
        opacity: 0;
        transform: translateY(-3px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .header-search-form {
      width: 100%;
      margin: 0;
    }

    .search-input-wrapper {
      position: relative;

      width: 100%;
      min-height: 44px;

      display: flex;
      align-items: center;

      overflow: hidden;

      border:
        1px solid rgba(15, 23, 42, 0.08) !important;

      border-radius: 14px !important;

      background:
        rgba(255, 255, 255, 0.34) !important;

      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.5);

      transition:
        background 0.24s ease,
        border-color 0.24s ease,
        box-shadow 0.24s ease,
        transform 0.24s cubic-bezier(.2,.8,.2,1);
    }

    html.dark-mode .search-input-wrapper {
      border-color:
        rgba(255, 255, 255, 0.08) !important;

      background:
        rgba(255, 255, 255, 0.045) !important;
    }

    .search-input-wrapper:hover {
      border-color:
        rgba(45, 49, 149, 0.18) !important;
    }

    .search-input-wrapper:focus-within {
      border-color:
        rgba(45, 49, 149, 0.38) !important;

      background:
        rgba(255, 255, 255, 0.66) !important;

      box-shadow:
        0 0 0 3px rgba(45, 49, 149, 0.08);

      transform:
        translateY(-1px);
    }

    html.dark-mode .search-input-wrapper:focus-within {
      background:
        rgba(255, 255, 255, 0.075) !important;
    }

    .search-icon {
      width: 44px;

      padding:
        0 0 0 14px !important;

      display: inline-flex !important;

      align-items: center;
      justify-content: center;

      border: 0 !important;

      background: transparent !important;

      color:
        var(--header-muted) !important;

      transition:
        color 0.2s ease,
        transform 0.2s ease;
    }

    .search-input-wrapper:focus-within .search-icon {
      color:
        var(--calbayog-blue) !important;

      transform:
        scale(1.04);
    }

    .search-input {
      min-height: 44px;
      height: 44px;

      padding:
        0 8px !important;

      border: 0 !important;

      background: transparent !important;

      color:
        var(--header-text) !important;

      box-shadow: none !important;

      font-size: 0.9rem;

      outline: none !important;
    }

    .search-input::placeholder {
      color:
        var(--header-muted);

      opacity: 0.82;

      transition:
        opacity 0.2s ease;
    }

    .search-input:focus::placeholder {
      opacity: 0.58;
    }

    .search-submit-btn {
      width: 36px;
      height: 36px;

      margin:
        3px 4px 3px 0;

      padding: 0;

      display: inline-flex;

      align-items: center;
      justify-content: center;

      border: 0;

      border-radius: 10px;

      background:
        var(--calbayog-blue);

      color: #fff;

      cursor: pointer;

      flex-shrink: 0;

      box-shadow:
        0 4px 12px rgba(45, 49, 149, 0.16);

      transition:
        background 0.2s ease,
        transform 0.22s cubic-bezier(.2,.8,.2,1),
        box-shadow 0.2s ease;
    }

    .search-submit-btn:hover {
      background:
        var(--calbayog-blue-dark);

      box-shadow:
        0 6px 16px rgba(45, 49, 149, 0.23);

      transform:
        translateY(-1px)
        scale(1.02);
    }

    .search-submit-btn:active {
      transform:
        scale(0.94);
    }

    /* =====================================================
       RIGHT ACTIONS
    ===================================================== */

    .header-actions {
      display: flex;
      align-items: center;

      gap: 4px;

      margin-left: auto;

      flex-shrink: 0;

      animation:
        actionsReveal 0.42s ease-out 0.1s both;
    }

    @keyframes actionsReveal {
      from {
        opacity: 0;
        transform: translateX(5px);
      }

      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .header-extra-actions {
      display: flex;
      align-items: center;

      gap: 4px;
    }

    /* =====================================================
       LOGIN / SIGNUP
    ===================================================== */

    .header-login-btn,
    .header-signup-btn {
      min-height: 42px;

      padding:
        0 13px;

      display: inline-flex;

      align-items: center;
      justify-content: center;

      gap: 7px;

      border-radius: 13px;

      font-size: 0.85rem;

      white-space: nowrap;

      cursor: pointer;

      transition:
        background 0.22s cubic-bezier(.2,.8,.2,1),
        border-color 0.22s ease,
        color 0.22s ease,
        transform 0.22s cubic-bezier(.2,.8,.2,1),
        box-shadow 0.22s ease;
    }

    .header-login-btn svg,
    .header-signup-btn svg {
      transition:
        transform 0.22s cubic-bezier(.2,.8,.2,1);
    }

    .header-login-btn {
      border:
        1px solid rgba(45, 49, 149, 0.16);

      background:
        rgba(255, 255, 255, 0.34);

      color:
        var(--header-text);

      font-weight: 650;
    }

    .header-login-btn:hover {
      color:
        var(--calbayog-blue);

      background:
        var(--calbayog-blue-soft);

      border-color:
        rgba(45, 49, 149, 0.25);

      transform:
        translateY(-1px);

      box-shadow:
        0 5px 15px rgba(45, 49, 149, 0.08);
    }

    .header-login-btn:hover svg {
      transform:
        translateX(1px);
    }

    .header-signup-btn {
      padding:
        0 15px;

      border:
        1px solid var(--calbayog-blue);

      background:
        var(--calbayog-blue);

      color: #fff;

      font-weight: 700;

      box-shadow:
        0 5px 15px rgba(45, 49, 149, 0.16);
    }

    .header-signup-btn:hover {
      background:
        var(--calbayog-blue-dark);

      border-color:
        var(--calbayog-blue-dark);

      box-shadow:
        0 7px 19px rgba(45, 49, 149, 0.24);

      transform:
        translateY(-1px);
    }

    .header-signup-btn:hover svg {
      transform:
        translateY(-1px)
        scale(1.03);
    }

    .header-login-btn:active,
    .header-signup-btn:active {
      transform:
        scale(0.96);
    }

    /* =====================================================
       INSTALL APP
    ===================================================== */

    .header-install-btn {
      min-height: 42px;

      padding:
        0 13px;

      display: inline-flex;

      align-items: center;
      justify-content: center;

      gap: 7px;

      border:
        1px solid var(--calbayog-blue);

      border-radius: 13px;

      background:
        rgba(45, 49, 149, 0.08);

      color:
        var(--calbayog-blue);

      font-size: 0.82rem;

      font-weight: 750;

      white-space: nowrap;

      cursor: pointer;

      box-shadow:
        0 4px 12px rgba(45, 49, 149, 0.08);

      transition:
        background 0.22s cubic-bezier(.2,.8,.2,1),
        border-color 0.22s ease,
        color 0.22s ease,
        transform 0.22s cubic-bezier(.2,.8,.2,1),
        box-shadow 0.22s ease;
    }

    .header-install-btn:hover {
      background:
        var(--calbayog-blue);

      border-color:
        var(--calbayog-blue);

      color:
        #fff;

      transform:
        translateY(-1px);

      box-shadow:
        0 7px 18px rgba(45, 49, 149, 0.18);
    }

    .header-install-btn:active {
      transform:
        scale(0.96);
    }

    .header-install-btn:focus-visible {
      outline:
        2px solid rgba(45, 49, 149, 0.35);

      outline-offset:
        2px;
    }

    .header-install-btn svg {
      transition:
        transform 0.22s cubic-bezier(.2,.8,.2,1);
    }

    .header-install-btn:hover svg {
      transform:
        translateY(-1px);
    }

    /* =====================================================
       PROFILE
    ===================================================== */

    .header-profile-wrapper {
      position: relative;
      flex-shrink: 0;
    }

    .header-profile-btn {
      min-height: 42px;
      padding: 0 10px 0 7px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      border: 1px solid rgba(45, 49, 149, 0.14);
      border-radius: 13px;
      background: rgba(255, 255, 255, 0.34);
      color: var(--header-text);
      cursor: pointer;
      transition: background 0.22s ease, border-color 0.22s ease, transform 0.22s ease, box-shadow 0.22s ease;
    }

    .header-profile-btn:hover,
    .header-profile-btn.is-open {
      color: var(--calbayog-blue);
      background: var(--calbayog-blue-soft);
      border-color: var(--calbayog-blue-border);
      transform: translateY(-1px);
      box-shadow: 0 5px 15px rgba(45, 49, 149, 0.08);
    }

    .header-profile-avatar {
      width: 31px;
      height: 31px;
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(145deg, var(--calbayog-blue), var(--calbayog-blue-dark));
      color: #fff;
      font-size: 0.72rem;
      font-weight: 800;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(45, 49, 149, 0.18);
    }

    .header-profile-name {
      max-width: 118px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 0.78rem;
      font-weight: 750;
    }

    .header-profile-chevron {
      display: inline-flex;
      transition: transform 0.2s ease;
    }

    .header-profile-btn.is-open .header-profile-chevron {
      transform: rotate(180deg);
    }

    .header-profile-dropdown {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: min(260px, calc(100vw - 28px));
      padding: 7px;
      overflow: hidden;
      border: 1px solid rgba(45, 49, 149, 0.12);
      border-radius: 17px;
      background: rgba(255, 255, 255, 0.84);
      backdrop-filter: blur(25px) saturate(170%);
      -webkit-backdrop-filter: blur(25px) saturate(170%);
      box-shadow: 0 22px 55px rgba(15, 23, 42, 0.16);
      animation: profileOpen 0.2s cubic-bezier(.2,.8,.2,1) both;
      z-index: 1200;
    }

    html.dark-mode .header-profile-dropdown {
      background: rgba(12, 22, 36, 0.88);
      border-color: rgba(255, 255, 255, 0.09);
      box-shadow: 0 22px 55px rgba(0, 0, 0, 0.32);
    }

    @keyframes profileOpen {
      from { opacity: 0; transform: translateY(-6px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .header-profile-summary {
      padding: 11px 12px 12px;
      border-bottom: 1px solid rgba(15, 23, 42, 0.07);
    }

    html.dark-mode .header-profile-summary {
      border-bottom-color: rgba(255, 255, 255, 0.07);
    }

    .header-profile-summary-name {
      color: var(--header-text);
      font-size: 0.82rem;
      font-weight: 800;
      line-height: 1.3;
    }

    .header-profile-summary-email {
      margin-top: 3px;
      color: var(--header-muted);
      font-size: 0.7rem;
      line-height: 1.35;
      word-break: break-word;
    }

    .header-profile-role {
      display: inline-flex;
      margin-top: 7px;
      padding: 4px 8px;
      border-radius: 999px;
      background: var(--calbayog-blue-soft);
      color: var(--calbayog-blue);
      font-size: 0.62rem;
      font-weight: 800;
    }

    .header-profile-menu-item {
      width: 100%;
      min-height: 42px;
      padding: 0 11px;
      display: flex;
      align-items: center;
      gap: 9px;
      border: 0;
      border-radius: 11px;
      background: transparent;
      color: var(--header-text);
      text-align: left;
      cursor: pointer;
      font-size: 0.77rem;
      font-weight: 700;
      transition: background 0.18s ease, color 0.18s ease;
    }

    .header-profile-menu-item:hover {
      background: var(--calbayog-blue-soft);
      color: var(--calbayog-blue);
    }

    .header-profile-menu-item.logout {
      color: #c7473c;
    }

    .header-profile-menu-item.logout:hover {
      background: rgba(199, 71, 60, 0.07);
      color: #b53d33;
    }

    .header-profile-notice {
      margin: 4px 6px 5px;
      padding: 8px 9px;
      border-radius: 10px;
      background: var(--calbayog-yellow-soft);
      border: 1px solid var(--calbayog-yellow-border);
      color: var(--header-text);
      font-size: 0.66rem;
      line-height: 1.4;
    }

    /* =====================================================
       ANNOUNCEMENTS
    ===================================================== */

    .announcement-wrapper {
      position: relative;
      flex-shrink: 0;
    }

    .announcement-btn {
      color:
        var(--header-text);
    }

    .announcement-btn.is-active {
      color:
        var(--calbayog-blue);

      background:
        var(--calbayog-blue-soft);

      border-color:
        var(--calbayog-blue-border);

      box-shadow:
        0 4px 14px rgba(45, 49, 149, 0.08);
    }

    .announcement-btn.is-active svg {
      animation:
        bellPulse 0.42s ease;
    }

    @keyframes bellPulse {
      0% {
        transform: rotate(0deg);
      }

      35% {
        transform: rotate(-7deg);
      }

      65% {
        transform: rotate(7deg);
      }

      100% {
        transform: rotate(0deg);
      }
    }

    .announcement-badge {
      position: absolute;

      top: 2px;
      right: 1px;

      min-width: 17px;
      height: 17px;

      padding:
        0 4px;

      display: inline-flex;

      align-items: center;
      justify-content: center;

      border:
        2px solid rgba(255, 255, 255, 0.7);

      border-radius: 999px;

      background:
        var(--calbayog-yellow);

      color:
        #1f2430;

      font-size: 0.6rem;

      font-weight: 800;

      line-height: 1;

      box-shadow:
        0 2px 7px rgba(255, 183, 27, 0.25);

      animation:
        badgePop 0.4s cubic-bezier(.2,.8,.2,1) both;
    }

    @keyframes badgePop {
      from {
        opacity: 0;
        transform:
          scale(0.55)
          translateY(-2px);
      }

      70% {
        transform:
          scale(1.08)
          translateY(0);
      }

      to {
        opacity: 1;
        transform:
          scale(1);
      }
    }

    /* =====================================================
       ANNOUNCEMENT DROPDOWN
    ===================================================== */

    .announcement-dropdown {
      position: absolute;

      top:
        calc(100% + 11px);

      right: 0;

      width:
        min(390px, calc(100vw - 28px));

      overflow: hidden;

      border:
        1px solid rgba(45, 49, 149, 0.12);

      border-radius: 18px;

      background:
        rgba(255, 255, 255, 0.78);

      backdrop-filter:
        blur(25px)
        saturate(170%);

      -webkit-backdrop-filter:
        blur(25px)
        saturate(170%);

      box-shadow:
        0 22px 55px rgba(15, 23, 42, 0.16);

      transform-origin:
        top right;

      animation:
        announcementOpen
        0.22s
        cubic-bezier(.2,.8,.2,1)
        both;
    }

    @keyframes announcementOpen {
      from {
        opacity: 0;
        transform:
          translateY(-7px)
          scale(0.97);
      }

      to {
        opacity: 1;
        transform:
          translateY(0)
          scale(1);
      }
    }

    html.dark-mode .announcement-dropdown {
      background:
        rgba(12, 22, 36, 0.84);

      border-color:
        rgba(255, 255, 255, 0.09);

      box-shadow:
        0 22px 55px rgba(0, 0, 0, 0.32);
    }

    .announcement-header {
      display: flex;

      align-items: center;
      justify-content: space-between;

      gap: 12px;

      padding:
        16px 17px;

      border-bottom:
        1px solid rgba(15, 23, 42, 0.07);
    }

    html.dark-mode .announcement-header {
      border-bottom-color:
        rgba(255, 255, 255, 0.07);
    }

    .announcement-heading {
      min-width: 0;
    }

    .announcement-title {
      color:
        var(--header-text);

      font-size: 0.96rem;

      font-weight: 800;
    }

    .announcement-subtitle {
      margin-top: 3px;

      color:
        var(--header-muted);

      font-size: 0.75rem;
    }

    .announcement-close {
      width: 33px;
      height: 33px;

      display: inline-flex;

      align-items: center;
      justify-content: center;

      padding: 0;

      border:
        1px solid rgba(15, 23, 42, 0.08);

      border-radius: 9px;

      background: transparent;

      color:
        var(--header-muted);

      cursor: pointer;

      transition:
        background 0.18s ease,
        color 0.18s ease,
        transform 0.18s ease;
    }

    .announcement-close:hover {
      background:
        var(--calbayog-blue-soft);

      color:
        var(--calbayog-blue);

      transform:
        rotate(3deg);
    }

    .announcement-list {
      max-height: 360px;

      overflow-y: auto;

      padding: 7px;
    }

    .announcement-item {
      display: flex;

      gap: 11px;

      padding: 12px;

      border-radius: 13px;

      transition:
        background 0.18s ease,
        transform 0.18s cubic-bezier(.2,.8,.2,1);
    }

    .announcement-item:hover {
      background:
        var(--calbayog-blue-soft);

      transform:
        translateX(2px);
    }

    .announcement-item-icon {
      width: 41px;
      height: 41px;

      display: flex;

      align-items: center;
      justify-content: center;

      flex-shrink: 0;

      border-radius: 12px;

      background:
        var(--calbayog-yellow-soft);

      border:
        1px solid var(--calbayog-yellow-border);

      font-size: 1.18rem;

      transition:
        transform 0.2s cubic-bezier(.2,.8,.2,1);
    }

    .announcement-item:hover
    .announcement-item-icon {
      transform:
        scale(1.05)
        rotate(-2deg);
    }

    .announcement-item-content {
      min-width: 0;
    }

    .announcement-item-title {
      color:
        var(--header-text);

      font-size: 0.85rem;

      font-weight: 800;
    }

    .announcement-item-description {
      margin-top: 4px;

      color:
        var(--header-muted);

      font-size: 0.75rem;

      line-height: 1.48;
    }

    .announcement-item-date {
      margin-top: 6px;

      color:
        var(--calbayog-blue);

      font-size: 0.68rem;

      font-weight: 700;
    }

    .announcement-footer {
      padding:
        11px 16px;

      border-top:
        1px solid rgba(15, 23, 42, 0.07);

      color:
        var(--header-muted);

      font-size: 0.69rem;

      text-align: center;
    }

    /* =====================================================
       RESPONSIVE
    ===================================================== */

    @media (max-width: 1199.98px) {
      .header-search-container {
        max-width: none;
      }

      .header-login-btn span,
      .header-signup-btn span,
      .header-install-btn span,
      .header-profile-name,
      .header-profile-chevron {
        display: none;
      }

      .header-login-btn,
      .header-signup-btn,
      .header-install-btn,
      .header-profile-btn {
        width: 42px;

        min-width: 42px;

        padding: 0;
      }
    }

    @media (max-width: 991.98px) {
      .app-header-inner {
        flex-wrap: wrap;

        min-height: auto;

        padding:
          8px 0;
      }

      .header-search-container {
        order: 3;

        flex-basis: 100%;

        margin:
          3px 0 0;

        max-width: none;
      }
    }

    @media (max-width: 767.98px) {
      .sticky-search-header {
        padding:
          4px 0;
      }

      .app-header-container.container {
        padding-left: 11px;
        padding-right: 11px;
      }

      .app-header-inner {
        padding:
          5px 0;

        gap: 6px;
      }

      .header-brand-mark {
        width: 43px;
        height: 43px;
      }

      .header-icon-btn {
        width: 40px;
        height: 40px;

        min-width: 40px;

        border-radius: 12px;
      }

      .header-login-btn,
      .header-signup-btn {
        width: 40px;
        height: 40px;

        min-width: 40px;
        min-height: 40px;

        padding: 0;

        border-radius: 12px;
      }

      .search-input-wrapper,
      .search-input {
        min-height: 43px;
        height: 43px;
      }
    }

    @media (max-width: 480px) {
      .announcement-dropdown {
        position: fixed;

        top: 70px;

        left: 12px;
        right: 12px;

        width: auto;
      }
    }

    /* =====================================================
       REDUCED MOTION
    ===================================================== */

    @media (prefers-reduced-motion: reduce) {
      .sticky-search-header,
      .header-brand,
      .header-search-container,
      .header-actions,
      .announcement-badge,
      .announcement-dropdown,
      .announcement-btn.is-active svg {
        animation: none !important;
      }

      .header-icon-btn,
      .header-icon-btn svg,
      .header-brand-mark img,
      .search-input-wrapper,
      .search-submit-btn,
      .header-login-btn,
      .header-signup-btn,
      .header-install-btn,
      .announcement-close,
      .announcement-item,
      .announcement-item-icon {
        transition: none !important;
      }
    }
  `}</style>
);

/* =========================================================
   APP HEADER
========================================================= */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  onMenuClick,
  onSearch,
  showSearch = true,
  searchPath = "/destinations",
  searchPlaceholder = "Search destinations, events, guides...",
  showAnnouncements = true,
  extraActions,
  isAdmin = false,
}) => {
  const history = useHistory();
  const auth = useAuth();

  const isUserAuthenticated = Boolean(
    (auth as any)?.isUserAuthenticated && (auth as any)?.user,
  );
  const currentUser = (auth as any)?.user || null;
  const userLogout = (auth as any)?.userLogout;
  const storedAdmin = (() => {
    try {
      const raw = localStorage.getItem("admin_user");

      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);

      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  })();

  const currentAdmin =
    (auth as any)?.adminUser || (auth as any)?.admin || storedAdmin || null;
  const adminLogout =
    (auth as any)?.adminLogout ||
    (auth as any)?.logout ||
    (auth as any)?.adminLogoutUser;

  const [search, setSearch] = useState("");

  const [showAnnouncementsMenu, setShowAnnouncementsMenu] = useState(false);

  const [showLoginModal, setShowLoginModal] = useState(false);

  const [showSignupModal, setShowSignupModal] = useState(false);

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [profileNotice, setProfileNotice] = useState("");

  const profileRef = useRef<HTMLDivElement>(null);

  const announcementRef = useRef<HTMLDivElement>(null);

  const [deferredInstallPrompt, setDeferredInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [canInstallApp, setCanInstallApp] = useState(false);

  const isLoggedInHeader = isAdmin ? true : isUserAuthenticated;

  const profileDisplayName = isAdmin
    ? String(
        currentAdmin?.name ||
          currentAdmin?.username ||
          currentAdmin?.email ||
          "Administrator",
      )
    : String(
        currentUser?.name ||
          currentUser?.username ||
          currentUser?.email ||
          "User",
      );

  const profileEmail = isAdmin
    ? String(currentAdmin?.email || currentAdmin?.username || "Administrator")
    : String(currentUser?.email || currentUser?.username || "");

  const profileInitials =
    profileDisplayName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part.charAt(0).toUpperCase())
      .join("") || (isAdmin ? "A" : "U");

  /* =========================================================
     ANNOUNCEMENTS
  ========================================================= */

  const announcements: Announcement[] = [
    {
      id: 1,
      title: "Welcome to Calbayog City Tourism",
      description:
        "Discover destinations, events, accommodations, and travel information around Calbayog City.",
      date: "Latest",
      icon: "🌴",
    },
    {
      id: 2,
      title: "Explore Calbayog",
      description:
        "Discover beautiful natural attractions and cultural destinations around the city.",
      date: "Tourism Update",
      icon: "🌿",
    },
  ];

  /* =========================================================
     DARK MODE
  ========================================================= */

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem("calbayog-theme");

    if (savedTheme === "dark") {
      return true;
    }

    if (savedTheme === "light") {
      return false;
    }

    return window.matchMedia?.("(prefers-color-scheme: dark)").matches || false;
  });

  useEffect(() => {
    const root = document.documentElement;

    if (darkMode) {
      root.setAttribute("data-theme", "dark");

      root.classList.add("dark-mode");

      localStorage.setItem("calbayog-theme", "dark");
    } else {
      root.setAttribute("data-theme", "light");

      root.classList.remove("dark-mode");

      localStorage.setItem("calbayog-theme", "light");
    }
  }, [darkMode]);

  /* =========================================================
     SEARCH
  ========================================================= */

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();

    const query = search.trim();

    if (!query) {
      return;
    }

    if (onSearch) {
      onSearch(query);
    }

    const separator = searchPath.includes("?") ? "&" : "?";

    history.replace(
      `${searchPath}${separator}search=${encodeURIComponent(query)}`,
    );

    setSearch("");
  };

  /* =========================================================
     ANNOUNCEMENT OUTSIDE CLICK
  ========================================================= */

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        announcementRef.current &&
        !announcementRef.current.contains(event.target as Node)
      ) {
        setShowAnnouncementsMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* =========================================================
     ANNOUNCEMENT ESCAPE
  ========================================================= */

  useEffect(() => {
    if (!showAnnouncementsMenu) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowAnnouncementsMenu(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showAnnouncementsMenu]);

  /* =========================================================
     PWA INSTALL
  ========================================================= */

  useEffect(() => {
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setCanInstallApp(false);
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();

      setDeferredInstallPrompt(event as BeforeInstallPromptEvent);
      setCanInstallApp(true);
    };

    const handleAppInstalled = () => {
      setDeferredInstallPrompt(null);
      setCanInstallApp(false);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt,
    );

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );

      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredInstallPrompt) {
      return;
    }

    try {
      await deferredInstallPrompt.prompt();

      await deferredInstallPrompt.userChoice;
    } catch (error) {
      console.error("PWA install prompt failed:", error);
    } finally {
      setDeferredInstallPrompt(null);
      setCanInstallApp(false);
    }
  };

  /* =========================================================
     PROFILE OUTSIDE CLICK
  ========================================================= */

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* =========================================================
     PROFILE ESCAPE
  ========================================================= */

  useEffect(() => {
    if (!showProfileMenu) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showProfileMenu]);

  /* =========================================================
     CHANGE PASSWORD

     Uses the existing secure Gmail password-reset flow.
     No new password endpoint is invented here.
  ========================================================= */

  const handleChangePassword = async () => {
    const email = String(
      currentUser?.email || currentUser?.username || "",
    ).trim();

    setProfileNotice("");

    if (!email) {
      setProfileNotice("Your account email could not be found.");
      return;
    }

    try {
      const apiUrl = (
        (import.meta as any).env?.VITE_API_URL || "http://localhost:5000/api"
      ).replace(/\/$/, "");

      const response = await fetch(`${apiUrl}/auth/user/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ username: email }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to send the password reset email.",
        );
      }

      setProfileNotice(`A password reset link was sent to ${email}.`);
    } catch (error: any) {
      console.error("Change password request failed:", error);
      setProfileNotice(
        error?.message || "Unable to start the password change process.",
      );
    }
  };

  const handleProfileLogout = () => {
    setShowProfileMenu(false);
    setProfileNotice("");

    try {
      if (isAdmin) {
        if (typeof adminLogout === "function") {
          adminLogout();
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
        }
      } else if (typeof userLogout === "function") {
        userLogout();
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  /* =========================================================
     AUTH MODAL HANDLERS
  ========================================================= */

  const openLogin = () => {
    setShowSignupModal(false);

    requestAnimationFrame(() => {
      setShowLoginModal(true);
    });
  };

  const openSignup = () => {
    setShowLoginModal(false);

    requestAnimationFrame(() => {
      setShowSignupModal(true);
    });
  };

  const closeAuthModals = () => {
    setShowLoginModal(false);
    setShowSignupModal(false);
  };

  /* =========================================================
     VERIFY EMAIL → LOGIN MODAL BRIDGE

     VerifyEmail.tsx dispatches:

       new Event("open-login-modal")

     This listener opens the same LoginModal used by
     the header.

     IMPORTANT:
     This listener does NOT run in admin mode.
  ========================================================= */

  useEffect(() => {
    const handleOpenLoginModal = () => {
      if (isAdmin) {
        return;
      }

      setShowSignupModal(false);

      requestAnimationFrame(() => {
        setShowLoginModal(true);
      });
    };

    window.addEventListener("open-login-modal", handleOpenLoginModal);

    return () => {
      window.removeEventListener("open-login-modal", handleOpenLoginModal);
    };
  }, [isAdmin]);

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      <AppHeaderStyles />

      <header className="sticky-search-header">
        <Container className="app-header-container">
          <div className="app-header-inner">
            {/* =================================================
               MENU
            ================================================= */}

            <button
              type="button"
              className="header-icon-btn menu-btn"
              onClick={onMenuClick}
              aria-label="Open navigation menu"
              title="Open menu"
            >
              <HeaderIcon name="menu" size={22} strokeWidth={1.9} />
            </button>

            {/* =================================================
               LOGO
            ================================================= */}

            <div className="header-brand" aria-label="Calbayog City Tourism">
              <div className="header-brand-mark">
                <img src="/logo2.png" alt="Calbayog City Tourism" />
              </div>
            </div>

            {/* =================================================
               SEARCH
            ================================================= */}

            {showSearch && (
              <div className="header-search-container">
                <Form
                  onSubmit={handleSearch}
                  role="search"
                  className="header-search-form"
                >
                  <InputGroup className="search-input-wrapper">
                    <InputGroup.Text className="search-icon">
                      <HeaderIcon name="search" size={18} strokeWidth={1.8} />
                    </InputGroup.Text>

                    <Form.Control
                      type="search"
                      placeholder={searchPlaceholder}
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="search-input"
                      aria-label="Search tourism information"
                    />

                    <button
                      type="submit"
                      className="search-submit-btn"
                      aria-label="Submit search"
                      title="Search"
                    >
                      <HeaderIcon name="search" size={17} strokeWidth={1.9} />
                    </button>
                  </InputGroup>
                </Form>
              </div>
            )}

            {/* =================================================
               RIGHT ACTIONS
            ================================================= */}

            <div className="header-actions">
              {/* EXTRA ACTIONS */}

              {extraActions && (
                <div className="header-extra-actions">{extraActions}</div>
              )}

              {/* =================================================
                 ANNOUNCEMENTS / NOTIFICATIONS
              ================================================= */}

              {showAnnouncements && !isAdmin && (
                <div className="announcement-wrapper" ref={announcementRef}>
                  <button
                    type="button"
                    className={`header-icon-btn announcement-btn ${
                      showAnnouncementsMenu ? "is-active" : ""
                    }`}
                    onClick={() =>
                      setShowAnnouncementsMenu((previous) => !previous)
                    }
                    aria-label="View announcements"
                    title="Announcements"
                    aria-expanded={showAnnouncementsMenu}
                    aria-haspopup="dialog"
                  >
                    <HeaderIcon name="bell" size={20} strokeWidth={1.8} />

                    {announcements.length > 0 && (
                      <span
                        className="announcement-badge"
                        aria-label={`${announcements.length} announcements`}
                      >
                        {announcements.length}
                      </span>
                    )}
                  </button>

                  {showAnnouncementsMenu && (
                    <div
                      className="announcement-dropdown"
                      role="dialog"
                      aria-label="Announcements"
                    >
                      <div className="announcement-header">
                        <div className="announcement-heading">
                          <div className="announcement-title">
                            Announcements
                          </div>

                          <div className="announcement-subtitle">
                            Latest tourism updates
                          </div>
                        </div>

                        <button
                          type="button"
                          className="announcement-close"
                          onClick={() => setShowAnnouncementsMenu(false)}
                          aria-label="Close announcements"
                        >
                          <HeaderIcon name="close" size={16} />
                        </button>
                      </div>

                      <div className="announcement-list">
                        {announcements.map((announcement) => (
                          <div
                            key={announcement.id}
                            className="announcement-item"
                          >
                            <div className="announcement-item-icon">
                              {announcement.icon}
                            </div>

                            <div className="announcement-item-content">
                              <div className="announcement-item-title">
                                {announcement.title}
                              </div>

                              <div className="announcement-item-description">
                                {announcement.description}
                              </div>

                              <div className="announcement-item-date">
                                {announcement.date}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="announcement-footer">
                        Calbayog City Tourism Office
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* =================================================
                 INSTALL APP
              ================================================= */}

              {canInstallApp && (
                <button
                  type="button"
                  className="header-install-btn"
                  onClick={handleInstallApp}
                  aria-label="Install Calbayog City Tourism app"
                  title="Install Calbayog City Tourism"
                >
                  <HeaderIcon
                    name="download"
                    size={18}
                    strokeWidth={1.9}
                  />
                  <span>Install App</span>
                </button>
              )}

              {/* =================================================
                 DARK MODE
              ================================================= */}

              <button
                type="button"
                className="header-icon-btn"
                onClick={() => setDarkMode((previous) => !previous)}
                aria-label={
                  darkMode ? "Switch to light mode" : "Switch to dark mode"
                }
                title={darkMode ? "Light mode" : "Dark mode"}
              >
                <HeaderIcon
                  name={darkMode ? "sun" : "moon"}
                  size={19}
                  strokeWidth={1.8}
                />
              </button>

              {/* =================================================
                 AUTH / PROFILE
              ================================================= */}

              {!isLoggedInHeader ? (
                <>
                  <button
                    type="button"
                    className="header-login-btn"
                    onClick={openLogin}
                    aria-label="Log in"
                    title="Log in"
                  >
                    <HeaderIcon name="login" size={18} strokeWidth={1.9} />

                    <span>Log in</span>
                  </button>

                  <button
                    type="button"
                    className="header-signup-btn"
                    onClick={openSignup}
                    aria-label="Sign up"
                    title="Sign up"
                  >
                    <HeaderIcon name="signup" size={18} strokeWidth={1.9} />

                    <span>Sign up</span>
                  </button>
                </>
              ) : (
                <div className="header-profile-wrapper" ref={profileRef}>
                  <button
                    type="button"
                    className={`header-profile-btn ${
                      showProfileMenu ? "is-open" : ""
                    }`}
                    onClick={() => {
                      setProfileNotice("");
                      setShowProfileMenu((previous) => !previous);
                    }}
                    aria-label="Open profile menu"
                    title={profileDisplayName}
                    aria-expanded={showProfileMenu}
                    aria-haspopup="menu"
                  >
                    <span className="header-profile-avatar">
                      {profileInitials}
                    </span>

                    <span className="header-profile-name">
                      {profileDisplayName}
                    </span>

                    <span className="header-profile-chevron">
                      <HeaderIcon name="chevron" size={15} strokeWidth={1.9} />
                    </span>
                  </button>

                  {showProfileMenu && (
                    <div
                      className="header-profile-dropdown"
                      role="menu"
                      aria-label="Profile menu"
                    >
                      <div className="header-profile-summary">
                        <div className="header-profile-summary-name">
                          {profileDisplayName}
                        </div>

                        <div className="header-profile-summary-email">
                          {profileEmail}
                        </div>

                        <span className="header-profile-role">
                          {isAdmin ? "Administrator" : "Traveler"}
                        </span>
                      </div>
                      {!isAdmin && (
                        <button
                          type="button"
                          className="header-profile-menu-item"
                          onClick={handleChangePassword}
                          role="menuitem"
                        >
                          <HeaderIcon name="lock" size={17} strokeWidth={1.8} />
                          <span>Change Password</span>
                        </button>
                      )}

                      {profileNotice && (
                        <div className="header-profile-notice">
                          {profileNotice}
                        </div>
                      )}

                      <button
                        type="button"
                        className="header-profile-menu-item logout"
                        onClick={handleProfileLogout}
                        role="menuitem"
                      >
                        <HeaderIcon name="logout" size={17} strokeWidth={1.8} />
                        <span>Log Out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Container>
      </header>

      {/* =======================================================
          LOGIN MODAL
          
          Login CAN close after successful login.
      ======================================================= */}

      <LoginModal
        show={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
        }}
        onSwitchToSignup={() => {
          setShowLoginModal(false);

          requestAnimationFrame(() => {
            setShowSignupModal(true);
          });
        }}
        onSuccess={() => {
          /*
           * Successful login:
           * close the login modal and return to the page.
           */
          setShowLoginModal(false);
        }}
      />

      {/* =======================================================
          SIGNUP MODAL

          IMPORTANT:
          DO NOT PASS onSuccess THAT CLOSES THE MODAL.

          SignupModal itself handles the successful signup
          state and displays the "Verify your email" message
          inside this same modal.
      ======================================================= */}

      <SignupModal
        show={showSignupModal}
        onClose={() => {
          setShowSignupModal(false);
        }}
        onSwitchToLogin={() => {
          setShowSignupModal(false);

          requestAnimationFrame(() => {
            setShowLoginModal(true);
          });
        }}
      />
    </>
  );
};

export default AppHeader;
