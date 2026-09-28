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
   ICONS
========================================================= */

type HeaderIconName =
  | "menu"
  | "search"
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
   PWA INSTALL EVENT
========================================================= */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

/*
 * Chrome controls when this event becomes available.
 *
 * We keep the event outside the component so it is not lost
 * if Chrome fires it before AppHeader finishes mounting.
 */
let pendingPwaInstallPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event: Event) => {
    event.preventDefault();

    pendingPwaInstallPrompt = event as BeforeInstallPromptEvent;

    window.dispatchEvent(
      new Event("calbayog-pwa-install-ready"),
    );
  });

  window.addEventListener("appinstalled", () => {
    pendingPwaInstallPrompt = null;
  });
}

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
       INSTALL FALLBACK NOTICE
    ===================================================== */

    .install-fallback-notice {
      position: fixed;

      left: 50%;
      bottom: 18px;

      z-index: 2000;

      width: min(390px, calc(100vw - 28px));

      transform:
        translateX(-50%);

      padding:
        14px 16px;

      border:
        1px solid rgba(45, 49, 149, 0.16);

      border-radius: 16px;

      background:
        rgba(255, 255, 255, 0.92);

      backdrop-filter:
        blur(20px)
        saturate(160%);

      -webkit-backdrop-filter:
        blur(20px)
        saturate(160%);

      color:
        var(--header-text);

      box-shadow:
        0 18px 45px rgba(15, 23, 42, 0.18);

      font-size: 0.76rem;

      line-height: 1.5;

      animation:
        installNoticeIn
        0.25s
        cubic-bezier(.2,.8,.2,1)
        both;
    }

    .install-fallback-notice strong {
      display: block;

      margin-bottom: 3px;

      color:
        var(--calbayog-blue);

      font-size: 0.82rem;
    }

    .install-fallback-close {
      position: absolute;

      top: 7px;
      right: 8px;

      width: 26px;
      height: 26px;

      display: inline-flex;

      align-items: center;
      justify-content: center;

      padding: 0;

      border: 0;

      border-radius: 8px;

      background:
        transparent;

      color:
        var(--header-muted);

      cursor: pointer;
    }

    .install-fallback-close:hover {
      background:
        var(--calbayog-blue-soft);

      color:
        var(--calbayog-blue);
    }

    @keyframes installNoticeIn {
      from {
        opacity: 0;
        transform:
          translateX(-50%)
          translateY(8px);
      }

      to {
        opacity: 1;
        transform:
          translateX(-50%)
          translateY(0);
      }
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

      padding:
        0 10px 0 7px;

      display: inline-flex;

      align-items: center;
      justify-content: center;

      gap: 7px;

      border:
        1px solid rgba(45, 49, 149, 0.14);

      border-radius: 13px;

      background:
        rgba(255, 255, 255, 0.34);

      color:
        var(--header-text);

      cursor: pointer;

      transition:
        background 0.22s ease,
        border-color 0.22s ease,
        transform 0.22s ease,
        box-shadow 0.22s ease;
    }

    .header-profile-btn:hover,
    .header-profile-btn.is-open {
      color:
        var(--calbayog-blue);

      background:
        var(--calbayog-blue-soft);

      border-color:
        var(--calbayog-blue-border);

      transform:
        translateY(-1px);

      box-shadow:
        0 5px 15px rgba(45, 49, 149, 0.08);
    }

    .header-profile-avatar {
      width: 31px;
      height: 31px;

      border-radius: 10px;

      display: inline-flex;

      align-items: center;
      justify-content: center;

      background:
        linear-gradient(
          145deg,
          var(--calbayog-blue),
          var(--calbayog-blue-dark)
        );

      color: #fff;

      font-size: 0.72rem;

      font-weight: 800;

      flex-shrink: 0;

      box-shadow:
        0 4px 12px rgba(45, 49, 149, 0.18);
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

      transition:
        transform 0.2s ease;
    }

    .header-profile-btn.is-open
    .header-profile-chevron {
      transform:
        rotate(180deg);
    }

    .header-profile-dropdown {
      position: absolute;

      top:
        calc(100% + 10px);

      right: 0;

      width:
        min(260px, calc(100vw - 28px));

      padding: 7px;

      overflow: hidden;

      border:
        1px solid rgba(45, 49, 149, 0.12);

      border-radius: 17px;

      background:
        rgba(255, 255, 255, 0.90);

      backdrop-filter:
        blur(25px)
        saturate(170%);

      -webkit-backdrop-filter:
        blur(25px)
        saturate(170%);

      box-shadow:
        0 22px 55px rgba(15, 23, 42, 0.16);

      animation:
        profileOpen
        0.2s
        cubic-bezier(.2,.8,.2,1)
        both;

      z-index: 1200;
    }

    @keyframes profileOpen {
      from {
        opacity: 0;
        transform:
          translateY(-6px)
          scale(0.98);
      }

      to {
        opacity: 1;
        transform:
          translateY(0)
          scale(1);
      }
    }

    .header-profile-summary {
      padding:
        11px 12px 12px;

      border-bottom:
        1px solid rgba(15, 23, 42, 0.07);
    }

    .header-profile-summary-name {
      color:
        var(--header-text);

      font-size: 0.82rem;

      font-weight: 800;

      line-height: 1.3;
    }

    .header-profile-summary-email {
      margin-top: 3px;

      color:
        var(--header-muted);

      font-size: 0.7rem;

      line-height: 1.35;

      word-break: break-word;
    }

    .header-profile-role {
      display: inline-flex;

      margin-top: 7px;

      padding:
        4px 8px;

      border-radius: 999px;

      background:
        var(--calbayog-blue-soft);

      color:
        var(--calbayog-blue);

      font-size: 0.62rem;

      font-weight: 800;
    }

    .header-profile-menu-item {
      width: 100%;

      min-height: 42px;

      padding:
        0 11px;

      display: flex;

      align-items: center;

      gap: 9px;

      border: 0;

      border-radius: 11px;

      background: transparent;

      color:
        var(--header-text);

      text-align: left;

      cursor: pointer;

      font-size: 0.77rem;

      font-weight: 700;

      transition:
        background 0.18s ease,
        color 0.18s ease;
    }

    .header-profile-menu-item:hover {
      background:
        var(--calbayog-blue-soft);

      color:
        var(--calbayog-blue);
    }

    .header-profile-menu-item.logout {
      color:
        #c7473c;
    }

    .header-profile-menu-item.logout:hover {
      background:
        rgba(199, 71, 60, 0.07);

      color:
        #b53d33;
    }

    .header-profile-notice {
      margin:
        4px 6px 5px;

      padding:
        8px 9px;

      border-radius:
        10px;

      background:
        var(--calbayog-yellow-soft);

      border:
        1px solid var(--calbayog-yellow-border);

      color:
        var(--header-text);

      font-size:
        0.66rem;

      line-height:
        1.4;
    }

    /* =====================================================
       TABLET
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

    /* =====================================================
       SMALL TABLET
    ===================================================== */

    @media (max-width: 991.98px) {
      .app-header-inner {
        min-height: 60px;
      }

      .header-brand-mark {
        width: 45px;
        height: 45px;
      }

      .header-search-container {
        margin-left: 6px;
      }

      .search-input-wrapper,
      .search-input {
        min-height: 42px;
        height: 42px;
      }
    }

    /* =====================================================
       MOBILE
    ===================================================== */

    @media (max-width: 767.98px) {
      .sticky-search-header {
        padding:
          4px 0;
      }

      .app-header-container.container {
        padding-left:
          10px;

        padding-right:
          10px;
      }

      .app-header-inner {
        width: 100%;

        min-height: 50px;

        display: flex;

        flex-wrap: nowrap;

        align-items: center;

        gap: 6px;

        padding:
          5px 0;
      }

      /* -----------------------------------------------------
         MOBILE MENU
      ----------------------------------------------------- */

      .menu-btn {
        width: 40px;
        height: 40px;

        min-width: 40px;

        flex-shrink: 0;
      }

      /* -----------------------------------------------------
         MOBILE LOGO
         
         Hidden exactly as requested.
      ----------------------------------------------------- */

      .header-brand {
        display: none;
      }

      /* -----------------------------------------------------
         MOBILE SEARCH
         
         Search takes the space where the logo used to be.
      ----------------------------------------------------- */

      .header-search-container {
        order: 1;

        flex:
          1 1 auto;

        min-width: 0;

        max-width: none;

        margin:
          0;

        animation:
          none;
      }

      .header-search-form {
        width: 100%;
      }

      .search-input-wrapper {
        width: 100%;

        min-height: 40px;
        height: 40px;

        border-radius:
          12px !important;
      }

      .search-input {
        min-height: 40px;
        height: 40px;

        padding:
          0 5px !important;

        font-size:
          0.78rem;
      }

      .search-input::placeholder {
        font-size:
          0.72rem;
      }

      .search-icon {
        width: 34px;

        padding:
          0 !important;
      }

      .search-submit-btn {
        width: 32px;
        height: 32px;

        margin:
          3px 3px 3px 0;

        border-radius:
          9px;
      }

      /* -----------------------------------------------------
         MOBILE ACTIONS
         
         Search = left
         Install + Sign In = right
      ----------------------------------------------------- */

      .header-actions {
        order: 2;

        margin-left:
          0;

        gap:
          5px;

        flex-shrink:
          0;

        animation:
          none;
      }

      .header-extra-actions {
        display:
          none;
      }

      /* -----------------------------------------------------
         MOBILE INSTALL
      ----------------------------------------------------- */

      .header-install-btn {
        width:
          auto;

        min-width:
          40px;

        height:
          40px;

        min-height:
          40px;

        padding:
          0 10px;

        border-radius:
          12px;

        gap:
          5px;

        font-size:
          0.73rem;
      }

      .header-install-btn span {
        display:
          inline;
      }

      /* -----------------------------------------------------
         MOBILE SIGN IN
      ----------------------------------------------------- */

      .header-login-btn {
        width:
          auto;

        min-width:
          40px;

        height:
          40px;

        min-height:
          40px;

        padding:
          0 10px;

        border-radius:
          12px;

        gap:
          5px;

        font-size:
          0.73rem;
      }

      .header-login-btn span {
        display:
          inline;
      }

      /* -----------------------------------------------------
         SIGNUP HIDDEN ON MOBILE
         
         The SignupModal itself is NOT removed.
         Users can still access signup through LoginModal.
      ----------------------------------------------------- */

      .header-signup-btn {
        display:
          none;
      }

      /* -----------------------------------------------------
         PROFILE
      ----------------------------------------------------- */

      .header-profile-btn {
        width:
          40px;

        min-width:
          40px;

        height:
          40px;

        min-height:
          40px;

        padding:
          0;

        border-radius:
          12px;
      }

      .header-profile-name,
      .header-profile-chevron {
        display:
          none;
      }

      .header-profile-avatar {
        width:
          29px;

        height:
          29px;

        border-radius:
          9px;
      }
    }

    /* =====================================================
       VERY SMALL PHONES
    ===================================================== */

    @media (max-width: 390px) {
      .app-header-container.container {
        padding-left:
          7px;

        padding-right:
          7px;
      }

      .app-header-inner {
        gap:
          4px;
      }

      .menu-btn {
        width:
          38px;

        min-width:
          38px;
      }

      .header-actions {
        gap:
          3px;
      }

      .header-install-btn,
      .header-login-btn {
        width:
          38px;

        min-width:
          38px;

        padding:
          0;
      }

      .header-install-btn span,
      .header-login-btn span {
        display:
          none;
      }

      .search-input {
        font-size:
          0.74rem;
      }

      .search-input::placeholder {
        font-size:
          0.68rem;
      }

      .search-icon {
        width:
          31px;
      }

      .search-submit-btn {
        width:
          29px;

        height:
          29px;
      }
    }

    /* =====================================================
       ACCESSIBILITY / REDUCED MOTION
    ===================================================== */

    @media (prefers-reduced-motion: reduce) {
      .sticky-search-header,
      .header-brand,
      .header-search-container,
      .header-actions,
      .install-fallback-notice {
        animation:
          none !important;
      }

      .header-icon-btn,
      .header-icon-btn svg,
      .header-brand-mark img,
      .search-input-wrapper,
      .search-submit-btn,
      .header-login-btn,
      .header-signup-btn,
      .header-install-btn,
      .header-profile-btn,
      .header-profile-menu-item {
        transition:
          none !important;
      }
    }
  `}</style>
);

/* =========================================================
   APP HEADER
========================================================= */

const AppHeader: React.FC<AppHeaderProps> = ({
  onMenuClick,
  onSearch,
  showSearch = true,
  searchPath = "/destinations",
  searchPlaceholder = "Search destinations, events, guides...",
  extraActions,
  isAdmin = false,
}) => {
  const history = useHistory();
  const auth = useAuth();

  /* =========================================================
     USER AUTH
  ========================================================= */

  const isUserAuthenticated = Boolean(
    (auth as any)?.isUserAuthenticated &&
      (auth as any)?.user,
  );

  const currentUser =
    (auth as any)?.user || null;

  const userLogout =
    (auth as any)?.userLogout;

  /* =========================================================
     ADMIN AUTH
  ========================================================= */

  const storedAdmin = (() => {
    try {
      const raw =
        localStorage.getItem("admin_user");

      if (!raw) {
        return null;
      }

      const parsed =
        JSON.parse(raw);

      return parsed &&
        typeof parsed === "object"
        ? parsed
        : null;
    } catch {
      return null;
    }
  })();

  const currentAdmin =
    (auth as any)?.adminUser ||
    (auth as any)?.admin ||
    storedAdmin ||
    null;

  const adminLogout =
    (auth as any)?.adminLogout ||
    (auth as any)?.logout ||
    (auth as any)?.adminLogoutUser;

  /* =========================================================
     STATE
  ========================================================= */

  const [search, setSearch] =
    useState("");

  const [showLoginModal, setShowLoginModal] =
    useState(false);

  const [showSignupModal, setShowSignupModal] =
    useState(false);

  const [showProfileMenu, setShowProfileMenu] =
    useState(false);

  const [profileNotice, setProfileNotice] =
    useState("");

  const profileRef =
    useRef<HTMLDivElement>(null);

  const [
    deferredInstallPrompt,
    setDeferredInstallPrompt,
  ] =
    useState<BeforeInstallPromptEvent | null>(
      null,
    );

  const [
    canInstallApp,
    setCanInstallApp,
  ] = useState(false);

  const [
    isMobileInstallDevice,
    setIsMobileInstallDevice,
  ] = useState(false);

  const [
    isStandalone,
    setIsStandalone,
  ] = useState(false);

  const [
    showInstallFallback,
    setShowInstallFallback,
  ] = useState(false);

  const isLoggedInHeader =
    isAdmin
      ? true
      : isUserAuthenticated;

  /* =========================================================
     PROFILE INFORMATION
  ========================================================= */

  const profileDisplayName =
    isAdmin
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

  const profileEmail =
    isAdmin
      ? String(
          currentAdmin?.email ||
            currentAdmin?.username ||
            "Administrator",
        )
      : String(
          currentUser?.email ||
            currentUser?.username ||
            "",
        );

  const profileInitials =
    profileDisplayName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part: string) =>
          part.charAt(0).toUpperCase(),
      )
      .join("") ||
    (isAdmin ? "A" : "U");

  /* =========================================================
     SEARCH
  ========================================================= */

  const handleSearch = (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    const query =
      search.trim();

    if (!query) {
      return;
    }

    if (onSearch) {
      onSearch(query);
    }

    const separator =
      searchPath.includes("?")
        ? "&"
        : "?";

    history.replace(
      `${searchPath}${separator}search=${encodeURIComponent(
        query,
      )}`,
    );

    setSearch("");
  };

  /* =========================================================
     PWA INSTALL
  ========================================================= */

  useEffect(() => {
    const updateInstallState = () => {
      const standalone =
        window.matchMedia?.(
          "(display-mode: standalone)",
        ).matches ||
        (window.navigator as Navigator & {
          standalone?: boolean;
        }).standalone === true;

      const mobileDevice =
        /Android|iPhone|iPad|iPod/i.test(
          window.navigator.userAgent,
        ) ||
        window.navigator.maxTouchPoints > 1;

      setIsStandalone(
        standalone,
      );

      setIsMobileInstallDevice(
        mobileDevice,
      );

      /*
       * If the site is currently running as
       * an installed PWA, the install button
       * should disappear.
       */
      if (standalone) {
        setDeferredInstallPrompt(null);
        setCanInstallApp(false);
        setShowInstallFallback(false);

        return;
      }

      /*
       * If Chrome already provided the event
       * before this component mounted, use it.
       */
      if (pendingPwaInstallPrompt) {
        setDeferredInstallPrompt(
          pendingPwaInstallPrompt,
        );

        setCanInstallApp(true);
      } else if (mobileDevice) {
        /*
         * Keep the install action available
         * on mobile even if Chrome has not yet
         * supplied the native prompt.
         *
         * Clicking it will show a fallback
         * instruction instead of failing silently.
         */
        setCanInstallApp(true);
      }
    };

    updateInstallState();

    const handleBeforeInstallPrompt = (
      event: Event,
    ) => {
      event.preventDefault();

      const installEvent =
        event as BeforeInstallPromptEvent;

      pendingPwaInstallPrompt =
        installEvent;

      setDeferredInstallPrompt(
        installEvent,
      );

      setCanInstallApp(true);

      setShowInstallFallback(false);
    };

    const handleInstallReady = () => {
      if (
        pendingPwaInstallPrompt
      ) {
        setDeferredInstallPrompt(
          pendingPwaInstallPrompt,
        );

        setCanInstallApp(true);

        setShowInstallFallback(false);
      }
    };

    const handleAppInstalled = () => {
      pendingPwaInstallPrompt =
        null;

      setDeferredInstallPrompt(
        null,
      );

      setCanInstallApp(false);

      setIsStandalone(true);

      setShowInstallFallback(false);
    };

    const handleVisibilityChange =
      () => {
        /*
         * Re-check after returning to the
         * browser. This is useful after a user
         * installs/uninstalls or returns from
         * Chrome's install UI.
         */
        if (
          document.visibilityState ===
          "visible"
        ) {
          updateInstallState();
        }
      };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt,
    );

    window.addEventListener(
      "calbayog-pwa-install-ready",
      handleInstallReady,
    );

    window.addEventListener(
      "appinstalled",
      handleAppInstalled,
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );

      window.removeEventListener(
        "calbayog-pwa-install-ready",
        handleInstallReady,
      );

      window.removeEventListener(
        "appinstalled",
        handleAppInstalled,
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, []);

  /* =========================================================
     INSTALL BUTTON
  ========================================================= */

  const handleInstallApp =
    async () => {
      const installPrompt =
        deferredInstallPrompt ||
        pendingPwaInstallPrompt;

      /*
       * If Chrome has provided the native
       * install event, use it.
       */
      if (installPrompt) {
        try {
          await installPrompt.prompt();

          const choice =
            await installPrompt.userChoice;

          /*
           * The event is one-use.
           */
          pendingPwaInstallPrompt =
            null;

          setDeferredInstallPrompt(
            null,
          );

          if (
            choice.outcome ===
            "accepted"
          ) {
            setCanInstallApp(false);
            setShowInstallFallback(false);
          } else {
            /*
             * Chrome may provide a fresh event
             * later. We keep the button visible
             * on mobile.
             */
            setCanInstallApp(
              !isStandalone &&
                isMobileInstallDevice,
            );
          }
        } catch (error) {
          console.error(
            "PWA install prompt failed:",
            error,
          );

          pendingPwaInstallPrompt =
            null;

          setDeferredInstallPrompt(
            null,
          );

          setCanInstallApp(
            !isStandalone &&
              isMobileInstallDevice,
          );

          setShowInstallFallback(
            true,
          );
        }

        return;
      }

      /*
       * IMPORTANT:
       *
       * There is no JavaScript API that lets us
       * manufacture a new beforeinstallprompt
       * event when Chrome has not supplied one.
       *
       * Instead of silently doing nothing,
       * show a useful fallback.
       */
      if (
        !isStandalone &&
        isMobileInstallDevice
      ) {
        setShowInstallFallback(true);
      }
    };

  /* =========================================================
     INSTALL FALLBACK AUTO-CLOSE
  ========================================================= */

  useEffect(() => {
    if (!showInstallFallback) {
      return;
    }

    const timeout =
      window.setTimeout(() => {
        setShowInstallFallback(false);
      }, 7000);

    return () => {
      window.clearTimeout(
        timeout,
      );
    };
  }, [showInstallFallback]);

  /* =========================================================
     PROFILE OUTSIDE CLICK
  ========================================================= */

  useEffect(() => {
    const handleClickOutside =
      (event: MouseEvent) => {
        if (
          profileRef.current &&
          !profileRef.current.contains(
            event.target as Node,
          )
        ) {
          setShowProfileMenu(
            false,
          );
        }
      };

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, []);

  /* =========================================================
     PROFILE ESCAPE
  ========================================================= */

  useEffect(() => {
    if (!showProfileMenu) {
      return;
    }

    const handleEscape =
      (event: KeyboardEvent) => {
        if (
          event.key ===
          "Escape"
        ) {
          setShowProfileMenu(
            false,
          );
        }
      };

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [showProfileMenu]);

  /* =========================================================
     CHANGE PASSWORD
  ========================================================= */

  const handleChangePassword =
    async () => {
      const email = String(
        currentUser?.email ||
          currentUser?.username ||
          "",
      ).trim();

      setProfileNotice("");

      if (!email) {
        setProfileNotice(
          "Your account email could not be found.",
        );

        return;
      }

      try {
        const apiUrl = (
          (import.meta as any).env
            ?.VITE_API_URL ||
          "http://localhost:5000/api"
        ).replace(/\/$/, "");

        const response =
          await fetch(
            `${apiUrl}/auth/user/forgot-password`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Accept:
                  "application/json",
              },
              body: JSON.stringify({
                username: email,
              }),
            },
          );

        const data =
          await response
            .json()
            .catch(
              () => ({}),
            );

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to send the password reset email.",
          );
        }

        setProfileNotice(
          `A password reset link was sent to ${email}.`,
        );
      } catch (error: any) {
        console.error(
          "Change password request failed:",
          error,
        );

        setProfileNotice(
          error?.message ||
            "Unable to start the password change process.",
        );
      }
    };

  /* =========================================================
     PROFILE LOGOUT
  ========================================================= */

  const handleProfileLogout =
    () => {
      setShowProfileMenu(
        false,
      );

      setProfileNotice("");

      try {
        if (isAdmin) {
          if (
            typeof adminLogout ===
            "function"
          ) {
            adminLogout();
          } else {
            localStorage.removeItem(
              "token",
            );

            localStorage.removeItem(
              "admin_token",
            );

            localStorage.removeItem(
              "admin_user",
            );
          }
        } else if (
          typeof userLogout ===
          "function"
        ) {
          userLogout();
        }
      } catch (error) {
        console.error(
          "Logout failed:",
          error,
        );
      }
    };

  /* =========================================================
     AUTH MODAL HANDLERS
  ========================================================= */

  const openLogin = () => {
    setShowSignupModal(
      false,
    );

    requestAnimationFrame(
      () => {
        setShowLoginModal(
          true,
        );
      },
    );
  };

  const openSignup = () => {
    setShowLoginModal(
      false,
    );

    requestAnimationFrame(
      () => {
        setShowSignupModal(
          true,
        );
      },
    );
  };

  /* =========================================================
     VERIFY EMAIL → LOGIN MODAL
  ========================================================= */

  useEffect(() => {
    const handleOpenLoginModal =
      () => {
        if (isAdmin) {
          return;
        }

        setShowSignupModal(
          false,
        );

        requestAnimationFrame(
          () => {
            setShowLoginModal(
              true,
            );
          },
        );
      };

    window.addEventListener(
      "open-login-modal",
      handleOpenLoginModal,
    );

    return () => {
      window.removeEventListener(
        "open-login-modal",
        handleOpenLoginModal,
      );
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
              <HeaderIcon
                name="menu"
                size={22}
                strokeWidth={1.9}
              />
            </button>

            {/* =================================================
               LOGO

               Hidden automatically on mobile.
            ================================================= */}

            <div
              className="header-brand"
              aria-label="Calbayog City Tourism"
            >
              <div className="header-brand-mark">
                <img
                  src="/logo2.png"
                  alt="Calbayog City Tourism"
                />
              </div>
            </div>

            {/* =================================================
               SEARCH
            ================================================= */}

            {showSearch && (
              <div className="header-search-container">
                <Form
                  onSubmit={
                    handleSearch
                  }
                  role="search"
                  className="header-search-form"
                >
                  <InputGroup className="search-input-wrapper">
                    <InputGroup.Text className="search-icon">
                      <HeaderIcon
                        name="search"
                        size={18}
                        strokeWidth={1.8}
                      />
                    </InputGroup.Text>

                    <Form.Control
                      type="search"
                      placeholder={
                        searchPlaceholder
                      }
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target
                            .value,
                        )
                      }
                      className="search-input"
                      aria-label="Search tourism information"
                    />

                    <button
                      type="submit"
                      className="search-submit-btn"
                      aria-label="Submit search"
                      title="Search"
                    >
                      <HeaderIcon
                        name="search"
                        size={17}
                        strokeWidth={1.9}
                      />
                    </button>
                  </InputGroup>
                </Form>
              </div>
            )}

            {/* =================================================
               RIGHT ACTIONS
            ================================================= */}

            <div className="header-actions">

              {/* =================================================
                 EXTRA ACTIONS
              ================================================= */}

              {extraActions && (
                <div className="header-extra-actions">
                  {extraActions}
                </div>
              )}

              {/* =================================================
                 INSTALL APP

                 Mobile:
                 right side beside Sign In.

                 Desktop/tablet:
                 normal header action.
              ================================================= */}

              {canInstallApp && (
                <button
                  type="button"
                  className="header-install-btn"
                  onClick={
                    handleInstallApp
                  }
                  aria-label="Install Calbayog City Tourism app"
                  title="Install Calbayog City Tourism"
                >
                  <HeaderIcon
                    name="download"
                    size={18}
                    strokeWidth={1.9}
                  />

                  <span>
                    Install App
                  </span>
                </button>
              )}

              {/* =================================================
                 AUTH
              ================================================= */}

              {!isLoggedInHeader ? (
                <>
                  {/* -------------------------------------------------
                     SIGN IN
                  ------------------------------------------------- */}

                  <button
                    type="button"
                    className="header-login-btn"
                    onClick={
                      openLogin
                    }
                    aria-label="Sign in"
                    title="Sign in"
                  >
                    <HeaderIcon
                      name="login"
                      size={18}
                      strokeWidth={1.9}
                    />

                    <span>
                      Sign in
                    </span>
                  </button>

                  {/* -------------------------------------------------
                     SIGN UP

                     Hidden by CSS on mobile.

                     IMPORTANT:
                     SignupModal still exists below and can still
                     be opened from LoginModal's signup action.
                  ------------------------------------------------- */}

                  <button
                    type="button"
                    className="header-signup-btn"
                    onClick={
                      openSignup
                    }
                    aria-label="Sign up"
                    title="Sign up"
                  >
                    <HeaderIcon
                      name="signup"
                      size={18}
                      strokeWidth={1.9}
                    />

                    <span>
                      Sign up
                    </span>
                  </button>
                </>
              ) : (
                /* =================================================
                   PROFILE
                ================================================= */

                <div
                  className="header-profile-wrapper"
                  ref={profileRef}
                >
                  <button
                    type="button"
                    className={`header-profile-btn ${
                      showProfileMenu
                        ? "is-open"
                        : ""
                    }`}
                    onClick={() => {
                      setProfileNotice("");

                      setShowProfileMenu(
                        (previous) =>
                          !previous,
                      );
                    }}
                    aria-label="Open profile menu"
                    title={
                      profileDisplayName
                    }
                    aria-expanded={
                      showProfileMenu
                    }
                    aria-haspopup="menu"
                  >
                    <span className="header-profile-avatar">
                      {profileInitials}
                    </span>

                    <span className="header-profile-name">
                      {
                        profileDisplayName
                      }
                    </span>

                    <span className="header-profile-chevron">
                      <HeaderIcon
                        name="chevron"
                        size={15}
                        strokeWidth={1.9}
                      />
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
                          {
                            profileDisplayName
                          }
                        </div>

                        <div className="header-profile-summary-email">
                          {
                            profileEmail
                          }
                        </div>

                        <span className="header-profile-role">
                          {isAdmin
                            ? "Administrator"
                            : "Traveler"}
                        </span>
                      </div>

                      {!isAdmin && (
                        <button
                          type="button"
                          className="header-profile-menu-item"
                          onClick={
                            handleChangePassword
                          }
                          role="menuitem"
                        >
                          <HeaderIcon
                            name="lock"
                            size={17}
                            strokeWidth={1.8}
                          />

                          <span>
                            Change Password
                          </span>
                        </button>
                      )}

                      {profileNotice && (
                        <div className="header-profile-notice">
                          {
                            profileNotice
                          }
                        </div>
                      )}

                      <button
                        type="button"
                        className="header-profile-menu-item logout"
                        onClick={
                          handleProfileLogout
                        }
                        role="menuitem"
                      >
                        <HeaderIcon
                          name="logout"
                          size={17}
                          strokeWidth={1.8}
                        />

                        <span>
                          Log Out
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Container>
      </header>

      {/* =========================================================
          INSTALL FALLBACK
          
          Only appears when the user taps Install but Chrome has
          not provided a native beforeinstallprompt event.
      ========================================================= */}

      {showInstallFallback &&
        !isStandalone && (
          <div
            className="install-fallback-notice"
            role="status"
            aria-live="polite"
          >
            <button
              type="button"
              className="install-fallback-close"
              onClick={() =>
                setShowInstallFallback(
                  false,
                )
              }
              aria-label="Close install instructions"
            >
              ×
            </button>

            <strong>
              Install Calbayog City Tourism
            </strong>

            Chrome has not provided the
            automatic install prompt yet.
            Open Chrome's{" "}
            <strong
              style={{
                display: "inline",
                margin: 0,
                color: "inherit",
              }}
            >
              ⋮ menu
            </strong>{" "}
            and choose{" "}
            <strong
              style={{
                display: "inline",
                margin: 0,
                color: "inherit",
              }}
            >
              Add to Home screen
            </strong>{" "}
            or{" "}
            <strong
              style={{
                display: "inline",
                margin: 0,
                color: "inherit",
              }}
            >
              Install app
            </strong>
            .
          </div>
        )}

      {/* =========================================================
          LOGIN MODAL
          
          IMPORTANT:
          LoginModal remains unchanged.

          Its existing "Sign up / Create account" action
          can still open SignupModal.
      ========================================================= */}

      <LoginModal
        show={
          showLoginModal
        }
        onClose={() => {
          setShowLoginModal(
            false,
          );
        }}
        onSwitchToSignup={() => {
          setShowLoginModal(
            false,
          );

          requestAnimationFrame(
            () => {
              setShowSignupModal(
                true,
              );
            },
          );
        }}
        onSuccess={() => {
          setShowLoginModal(
            false,
          );
        }}
      />

      {/* =========================================================
          SIGNUP MODAL

          NOT REMOVED.

          Mobile users can still reach this through LoginModal.
      ========================================================= */}

      <SignupModal
        show={
          showSignupModal
        }
        onClose={() => {
          setShowSignupModal(
            false,
          );
        }}
        onSwitchToLogin={() => {
          setShowSignupModal(
            false,
          );

          requestAnimationFrame(
            () => {
              setShowLoginModal(
                true,
              );
            },
          );
        }}
      />
    </>
  );
};

export default AppHeader;
