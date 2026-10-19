import React, { useEffect, useRef, useState } from "react";
import { Container, Form, InputGroup } from "react-bootstrap";
import { useHistory } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import LoginModal from "../LoginModal";
import SignupModal from "../SignupModal";
import ChangePasswordModal from "../ChangePasswordModal";

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
    "aria-hidden": true as const,
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
      --header-shadow: 0 8px 30px rgba(17, 24, 39, 0.06);
    }

    html.dark-mode {
      --header-text: #f5f8fc;
      --header-muted: #9aa8ba;
      --glass-border: rgba(255, 255, 255, 0.09);
      --header-shadow: 0 10px 34px rgba(0, 0, 0, 0.22);
    }

    .sticky-search-header {
      position: sticky;
      top: 0;
      z-index: 1100;
      width: 100%;
      background: linear-gradient(180deg, rgba(255,255,255,.70), rgba(255,255,255,.48));
      backdrop-filter: blur(22px) saturate(160%);
      -webkit-backdrop-filter: blur(22px) saturate(160%);
      border-bottom: 1px solid rgba(45,49,149,.08);
      box-shadow: var(--header-shadow);
      isolation: isolate;
      animation: headerReveal .35s ease-out both;
    }

    @keyframes headerReveal {
      from { opacity: 0; transform: translateY(-5px); }
      to { opacity: 1; transform: translateY(0); }
    }

    html.dark-mode .sticky-search-header {
      background: linear-gradient(180deg, rgba(10,20,34,.74), rgba(10,20,34,.54));
      border-bottom: 1px solid rgba(255,255,255,.07);
    }

    .app-header-container { width: 100%; }
    .app-header-container.container { max-width: 1480px; }

    .app-header-inner {
      width: 100%;
      min-height: 64px;
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 0;
    }

    .header-icon-btn {
      position: relative;
      width: 42px;
      height: 42px;
      min-width: 42px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid transparent;
      border-radius: 13px;
      background: transparent;
      color: var(--header-text);
      cursor: pointer;
      flex-shrink: 0;
      transition: background .22s, color .22s, border-color .22s, transform .22s, box-shadow .22s;
    }

    .header-icon-btn svg { transition: transform .22s; }

    .header-icon-btn:hover {
      color: var(--calbayog-blue);
      background: var(--calbayog-blue-soft);
      border-color: var(--calbayog-blue-border);
      transform: translateY(-1px);
    }

    .header-icon-btn:hover svg { transform: scale(1.05); }
    .header-icon-btn:active { transform: scale(.94); }
    .header-icon-btn:focus-visible { outline: 2px solid rgba(45,49,149,.35); outline-offset: 2px; }
    .menu-btn { margin-right: 1px; }

    .header-brand {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      margin-right: 4px;
      animation: brandReveal .45s ease-out .05s both;
    }

    @keyframes brandReveal {
      from { opacity: 0; transform: translateX(-5px); }
      to { opacity: 1; transform: translateX(0); }
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
      transition: transform .28s, filter .28s;
    }

    .header-brand:hover .header-brand-mark img { transform: scale(1.045) rotate(-1deg); }

    .header-search-container {
      flex: 1 1 auto;
      min-width: 170px;
      max-width: 720px;
      margin-left: 10px;
      animation: searchReveal .4s ease-out .08s both;
    }

    @keyframes searchReveal {
      from { opacity: 0; transform: translateY(-3px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .header-search-form { width: 100%; margin: 0; }

    .search-input-wrapper {
      position: relative;
      width: 100%;
      min-height: 44px;
      display: flex;
      align-items: center;
      overflow: hidden;
      border: 1px solid rgba(15,23,42,.08) !important;
      border-radius: 14px !important;
      background: rgba(255,255,255,.34) !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.5);
      transition: background .24s, border-color .24s, box-shadow .24s, transform .24s;
    }

    html.dark-mode .search-input-wrapper {
      border-color: rgba(255,255,255,.08) !important;
      background: rgba(255,255,255,.045) !important;
    }

    .search-input-wrapper:hover { border-color: rgba(45,49,149,.18) !important; }

    .search-input-wrapper:focus-within {
      border-color: rgba(45,49,149,.38) !important;
      background: rgba(255,255,255,.66) !important;
      box-shadow: 0 0 0 3px rgba(45,49,149,.08);
      transform: translateY(-1px);
    }

    html.dark-mode .search-input-wrapper:focus-within { background: rgba(255,255,255,.075) !important; }

    .search-icon {
      width: 44px;
      padding: 0 0 0 14px !important;
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      border: 0 !important;
      background: transparent !important;
      color: var(--header-muted) !important;
      transition: color .2s, transform .2s;
    }

    .search-input-wrapper:focus-within .search-icon {
      color: var(--calbayog-blue) !important;
      transform: scale(1.04);
    }

    .search-input {
      min-height: 44px;
      height: 44px;
      padding: 0 8px !important;
      border: 0 !important;
      background: transparent !important;
      color: var(--header-text) !important;
      box-shadow: none !important;
      font-size: .9rem;
      outline: none !important;
    }

    .search-input::placeholder { color: var(--header-muted); opacity: .82; transition: opacity .2s; }
    .search-input:focus::placeholder { opacity: .58; }

    .search-submit-btn {
      width: 36px;
      height: 36px;
      margin: 3px 4px 3px 0;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 0;
      border-radius: 10px;
      background: var(--calbayog-blue);
      color: #fff;
      cursor: pointer;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(45,49,149,.16);
      transition: background .2s, transform .22s, box-shadow .2s;
    }

    .search-submit-btn:hover {
      background: var(--calbayog-blue-dark);
      box-shadow: 0 6px 16px rgba(45,49,149,.23);
      transform: translateY(-1px) scale(1.02);
    }

    .search-submit-btn:active { transform: scale(.94); }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-left: auto;
      flex-shrink: 0;
      animation: actionsReveal .42s ease-out .1s both;
    }

    @keyframes actionsReveal {
      from { opacity: 0; transform: translateX(5px); }
      to { opacity: 1; transform: translateX(0); }
    }

    .header-extra-actions { display: flex; align-items: center; gap: 4px; }

    .header-login-btn,
    .header-signup-btn {
      min-height: 42px;
      padding: 0 13px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      border-radius: 13px;
      font-size: .85rem;
      white-space: nowrap;
      cursor: pointer;
      transition: background .22s, border-color .22s, color .22s, transform .22s, box-shadow .22s;
    }

    .header-login-btn svg,
    .header-signup-btn svg { transition: transform .22s; }

    .header-login-btn {
      border: 1px solid rgba(45,49,149,.16);
      background: rgba(255,255,255,.34);
      color: var(--header-text);
      font-weight: 650;
    }

    .header-login-btn:hover {
      color: var(--calbayog-blue);
      background: var(--calbayog-blue-soft);
      border-color: rgba(45,49,149,.25);
      transform: translateY(-1px);
      box-shadow: 0 5px 15px rgba(45,49,149,.08);
    }

    .header-login-btn:hover svg { transform: translateX(1px); }

    .header-signup-btn {
      padding: 0 15px;
      border: 1px solid var(--calbayog-blue);
      background: var(--calbayog-blue);
      color: #fff;
      font-weight: 700;
      box-shadow: 0 5px 15px rgba(45,49,149,.16);
    }

    .header-signup-btn:hover {
      background: var(--calbayog-blue-dark);
      border-color: var(--calbayog-blue-dark);
      box-shadow: 0 7px 19px rgba(45,49,149,.24);
      transform: translateY(-1px);
    }

    .header-signup-btn:hover svg { transform: translateY(-1px) scale(1.03); }

    .header-login-btn:active,
    .header-signup-btn:active { transform: scale(.96); }

    .header-install-btn {
      min-height: 42px;
      padding: 0 13px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      border: 1px solid var(--calbayog-blue);
      border-radius: 13px;
      background: rgba(45,49,149,.08);
      color: var(--calbayog-blue);
      font-size: .82rem;
      font-weight: 750;
      white-space: nowrap;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(45,49,149,.08);
      transition: background .22s, border-color .22s, color .22s, transform .22s, box-shadow .22s;
    }

    .header-install-btn:hover {
      background: var(--calbayog-blue);
      border-color: var(--calbayog-blue);
      color: #fff;
      transform: translateY(-1px);
      box-shadow: 0 7px 18px rgba(45,49,149,.18);
    }

    .header-install-btn:active { transform: scale(.96); }
    .header-install-btn:focus-visible { outline: 2px solid rgba(45,49,149,.35); outline-offset: 2px; }
    .header-install-btn svg { transition: transform .22s; }
    .header-install-btn:hover svg { transform: translateY(-1px); }

    .header-profile-wrapper { position: relative; flex-shrink: 0; }

    .header-profile-btn {
      min-height: 42px;
      padding: 0 10px 0 7px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      border: 1px solid rgba(45,49,149,.14);
      border-radius: 13px;
      background: rgba(255,255,255,.34);
      color: var(--header-text);
      cursor: pointer;
      transition: background .22s, border-color .22s, transform .22s, box-shadow .22s;
    }

    .header-profile-btn:hover,
    .header-profile-btn.is-open {
      color: var(--calbayog-blue);
      background: var(--calbayog-blue-soft);
      border-color: var(--calbayog-blue-border);
      transform: translateY(-1px);
      box-shadow: 0 5px 15px rgba(45,49,149,.08);
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
      font-size: .72rem;
      font-weight: 800;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(45,49,149,.18);
    }

    .header-profile-name {
      max-width: 118px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: .78rem;
      font-weight: 750;
    }

    .header-profile-chevron { display: inline-flex; transition: transform .2s; }
    .header-profile-btn.is-open .header-profile-chevron { transform: rotate(180deg); }

    .header-profile-dropdown {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: min(260px, calc(100vw - 28px));
      padding: 7px;
      overflow: hidden;
      border: 1px solid rgba(45,49,149,.12);
      border-radius: 17px;
      background: rgba(255,255,255,.84);
      backdrop-filter: blur(25px) saturate(170%);
      -webkit-backdrop-filter: blur(25px) saturate(170%);
      box-shadow: 0 22px 55px rgba(15,23,42,.16);
      animation: profileOpen .2s cubic-bezier(.2,.8,.2,1) both;
      z-index: 1200;
    }

    html.dark-mode .header-profile-dropdown {
      background: rgba(12,22,36,.88);
      border-color: rgba(255,255,255,.09);
      box-shadow: 0 22px 55px rgba(0,0,0,.32);
    }

    @keyframes profileOpen {
      from { opacity: 0; transform: translateY(-6px) scale(.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .header-profile-summary {
      padding: 11px 12px 12px;
      border-bottom: 1px solid rgba(15,23,42,.07);
    }

    html.dark-mode .header-profile-summary { border-bottom-color: rgba(255,255,255,.07); }

    .header-profile-summary-name {
      color: var(--header-text);
      font-size: .82rem;
      font-weight: 800;
      line-height: 1.3;
    }

    .header-profile-summary-email {
      margin-top: 3px;
      color: var(--header-muted);
      font-size: .7rem;
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
      font-size: .62rem;
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
      font-size: .77rem;
      font-weight: 700;
      transition: background .18s, color .18s;
    }

    .header-profile-menu-item:hover {
      background: var(--calbayog-blue-soft);
      color: var(--calbayog-blue);
    }

    .header-profile-menu-item.logout { color: #c7473c; }
    .header-profile-menu-item.logout:hover { background: rgba(199,71,60,.07); color: #b53d33; }

    .header-profile-notice {
      margin: 4px 6px 5px;
      padding: 8px 9px;
      border-radius: 10px;
      background: var(--calbayog-yellow-soft);
      border: 1px solid var(--calbayog-yellow-border);
      color: var(--header-text);
      font-size: .66rem;
      line-height: 1.4;
    }

    .announcement-wrapper { position: relative; flex-shrink: 0; }
    .announcement-btn { color: var(--header-text); }

    .announcement-btn.is-active {
      color: var(--calbayog-blue);
      background: var(--calbayog-blue-soft);
      border-color: var(--calbayog-blue-border);
      box-shadow: 0 4px 14px rgba(45,49,149,.08);
    }

    .announcement-btn.is-active svg { animation: bellPulse .42s ease; }

    @keyframes bellPulse {
      0%,100% { transform: rotate(0); }
      35% { transform: rotate(-7deg); }
      65% { transform: rotate(7deg); }
    }

    .announcement-badge {
      position: absolute;
      top: 2px;
      right: 1px;
      min-width: 17px;
      height: 17px;
      padding: 0 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 2px solid rgba(255,255,255,.7);
      border-radius: 999px;
      background: var(--calbayog-yellow);
      color: #1f2430;
      font-size: .6rem;
      font-weight: 800;
      line-height: 1;
      box-shadow: 0 2px 7px rgba(255,183,27,.25);
      animation: badgePop .4s cubic-bezier(.2,.8,.2,1) both;
    }

    @keyframes badgePop {
      from { opacity: 0; transform: scale(.55) translateY(-2px); }
      70% { transform: scale(1.08) translateY(0); }
      to { opacity: 1; transform: scale(1); }
    }

    .announcement-dropdown {
      position: absolute;
      top: calc(100% + 11px);
      right: 0;
      width: min(390px, calc(100vw - 28px));
      overflow: hidden;
      border: 1px solid rgba(45,49,149,.12);
      border-radius: 18px;
      background: rgba(255,255,255,.78);
      backdrop-filter: blur(25px) saturate(170%);
      -webkit-backdrop-filter: blur(25px) saturate(170%);
      box-shadow: 0 22px 55px rgba(15,23,42,.16);
      transform-origin: top right;
      animation: announcementOpen .22s cubic-bezier(.2,.8,.2,1) both;
    }

    @keyframes announcementOpen {
      from { opacity: 0; transform: translateY(-7px) scale(.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    html.dark-mode .announcement-dropdown {
      background: rgba(12,22,36,.84);
      border-color: rgba(255,255,255,.09);
      box-shadow: 0 22px 55px rgba(0,0,0,.32);
    }

    .announcement-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 16px 17px;
      border-bottom: 1px solid rgba(15,23,42,.07);
    }

    html.dark-mode .announcement-header { border-bottom-color: rgba(255,255,255,.07); }
    .announcement-heading { min-width: 0; }
    .announcement-title { color: var(--header-text); font-size: .96rem; font-weight: 800; }
    .announcement-subtitle { margin-top: 3px; color: var(--header-muted); font-size: .75rem; }

    .announcement-close {
      width: 33px;
      height: 33px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      border: 1px solid rgba(15,23,42,.08);
      border-radius: 9px;
      background: transparent;
      color: var(--header-muted);
      cursor: pointer;
      transition: background .18s, color .18s, transform .18s;
    }

    .announcement-close:hover {
      background: var(--calbayog-blue-soft);
      color: var(--calbayog-blue);
      transform: rotate(3deg);
    }

    .announcement-list { max-height: 360px; overflow-y: auto; padding: 7px; }

    .announcement-item {
      display: flex;
      gap: 11px;
      padding: 12px;
      border-radius: 13px;
      transition: background .18s, transform .18s;
    }

    .announcement-item:hover {
      background: var(--calbayog-blue-soft);
      transform: translateX(2px);
    }

    .announcement-item-icon {
      width: 41px;
      height: 41px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border-radius: 12px;
      background: var(--calbayog-yellow-soft);
      border: 1px solid var(--calbayog-yellow-border);
      font-size: 1.18rem;
      transition: transform .2s;
    }

    .announcement-item:hover .announcement-item-icon { transform: scale(1.05) rotate(-2deg); }
    .announcement-item-content { min-width: 0; }
    .announcement-item-title { color: var(--header-text); font-size: .85rem; font-weight: 800; }
    .announcement-item-description { margin-top: 4px; color: var(--header-muted); font-size: .75rem; line-height: 1.48; }
    .announcement-item-date { margin-top: 6px; color: var(--calbayog-blue); font-size: .68rem; font-weight: 700; }
    .announcement-footer { padding: 11px 16px; border-top: 1px solid rgba(15,23,42,.07); color: var(--header-muted); font-size: .69rem; text-align: center; }

    @media (max-width: 1199.98px) {
      .header-search-container { max-width: none; }
      .header-login-btn span,
      .header-signup-btn span,
      .header-install-btn span,
      .header-profile-name,
      .header-profile-chevron { display: none; }

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
      .app-header-inner { flex-wrap: wrap; min-height: auto; padding: 8px 0; }
      .header-search-container { order: 3; flex-basis: 100%; margin: 3px 0 0; max-width: none; }
    }

    @media (max-width: 767.98px) {
      .sticky-search-header { padding: 4px 0; }
      .app-header-container.container { padding-left: 11px; padding-right: 11px; }
      .app-header-inner { padding: 5px 0; gap: 6px; }
      .header-brand-mark { width: 43px; height: 43px; }
      .header-icon-btn { width: 40px; height: 40px; min-width: 40px; border-radius: 12px; }

      .header-login-btn,
      .header-signup-btn {
        width: 40px;
        height: 40px;
        min-width: 40px;
        min-height: 40px;
        padding: 0;
        border-radius: 12px;
      }

      .header-install-btn {
        width: auto;
        min-width: 40px;
        height: 40px;
        min-height: 40px;
        padding: 0 10px;
        border-radius: 12px;
      }

      .header-install-btn span { display: inline; }
      .search-input-wrapper, .search-input { min-height: 43px; height: 43px; }
    }

    @media (max-width: 390px) {
      .header-install-btn { width: 40px; min-width: 40px; padding: 0; }
      .header-install-btn span { display: none; }
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

    .install-help-backdrop {
      position: fixed;
      inset: 0;
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px;
      background: rgba(9, 16, 32, .58);
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
      animation: installHelpFadeIn .18s ease-out both;
    }
    .install-help-dialog {
      width: min(100%, 420px);
      max-height: min(85vh, 620px);
      overflow-y: auto;
      padding: 22px;
      border: 1px solid rgba(45,49,149,.12);
      border-radius: 22px;
      background: #fff;
      color: #142033;
      box-shadow: 0 24px 70px rgba(0,0,0,.24);
      animation: installHelpRise .22s cubic-bezier(.2,.8,.2,1) both;
    }
    html.dark-mode .install-help-dialog {
      background: #101b2b;
      color: #f5f8fc;
      border-color: rgba(255,255,255,.1);
    }
    .install-help-top { display: flex; align-items: flex-start; gap: 13px; margin-bottom: 15px; }
    .install-help-icon {
      width: 48px; height: 48px; display: inline-flex; align-items: center;
      justify-content: center; flex-shrink: 0; border-radius: 15px;
      background: var(--calbayog-blue-soft); color: var(--calbayog-blue);
    }
    .install-help-title { margin: 1px 0 4px; font-size: 1.08rem; line-height: 1.3; font-weight: 800; }
    .install-help-subtitle { margin: 0; color: var(--header-muted); font-size: .82rem; line-height: 1.5; }
    .install-help-close {
      width: 34px; height: 34px; margin-left: auto; display: inline-flex;
      align-items: center; justify-content: center; flex-shrink: 0;
      border: 1px solid rgba(15,23,42,.1); border-radius: 10px;
      background: transparent; color: inherit; cursor: pointer;
    }
    html.dark-mode .install-help-close { border-color: rgba(255,255,255,.12); }
    .install-help-steps { margin: 16px 0; padding-left: 22px; font-size: .86rem; line-height: 1.6; }
    .install-help-steps li { padding-left: 3px; margin: 7px 0; }
    .install-help-note {
      margin-top: 14px; padding: 11px 12px; border: 1px solid var(--calbayog-yellow-border);
      border-radius: 12px; background: var(--calbayog-yellow-soft); font-size: .78rem; line-height: 1.5;
    }
    .install-help-done {
      width: 100%; min-height: 44px; margin-top: 16px; border: 0;
      border-radius: 12px; background: var(--calbayog-blue); color: #fff;
      font-weight: 750; cursor: pointer;
    }
    .install-help-done:hover { background: var(--calbayog-blue-dark); }
    @keyframes installHelpFadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes installHelpRise {
      from { opacity: 0; transform: translateY(8px) scale(.985); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @media (prefers-reduced-motion: reduce) {
      .install-help-backdrop,
      .install-help-dialog { animation: none !important; }
      .sticky-search-header,
      .header-brand,
      .header-search-container,
      .header-actions,
      .announcement-badge,
      .announcement-dropdown,
      .announcement-btn.is-active svg { animation: none !important; }

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
      .announcement-item-icon { transition: none !important; }
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

  // Kept for API compatibility; announcements are currently disabled.
  void showAnnouncements;

  const isUserAuthenticated = Boolean(
    (auth as any)?.isUserAuthenticated && (auth as any)?.user,
  );

  const currentUser = (auth as any)?.user || null;
  const userLogout = (auth as any)?.userLogout;

  const storedAdmin = (() => {
    try {
      const raw = localStorage.getItem("admin_user");

      if (!raw) return null;

      const parsed = JSON.parse(raw);

      return parsed && typeof parsed === "object" ? parsed : null;
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

  const [search, setSearch] = useState("");
  const [showAnnouncementsMenu, setShowAnnouncementsMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileNotice, setProfileNotice] = useState("");

  const profileRef = useRef<HTMLDivElement>(null);

  const [deferredInstallPrompt, setDeferredInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

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
     SEARCH
  ========================================================= */

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();

    const query = search.trim();

    if (!query) return;

    if (onSearch) {
      onSearch(query);
      return;
    }

    const targetPath = searchPath || "/destinations";
    const separator = targetPath.includes("?") ? "&" : "?";

    history.push(
      `${targetPath}${separator}search=${encodeURIComponent(query)}`,
    );
  };

 
  /* =========================================================
     PWA INSTALL
  ========================================================= */

  useEffect(() => {
    const isAppStandalone = () =>
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    const detectIOS = () =>
      /iPad|iPhone|iPod/i.test(window.navigator.userAgent) ||
      (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);

    const updateInstallState = () => {
      const installed = isAppStandalone();
      setIsStandalone(installed);
      setIsIOSDevice(detectIOS());
      if (installed) {
        setDeferredInstallPrompt(null);
        setShowInstallHelp(false);
      }
    };

    updateInstallState();

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      if (isAppStandalone()) return;
      setDeferredInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredInstallPrompt(null);
      setShowInstallHelp(false);
      setIsStandalone(true);
    };

    const displayMode = window.matchMedia("(display-mode: standalone)");
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    displayMode.addEventListener?.("change", updateInstallState);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      displayMode.removeEventListener?.("change", updateInstallState);
    };
  }, []);

  const handleInstallApp = async () => {
    if (isStandalone) return;

    if (deferredInstallPrompt) {
      const installEvent = deferredInstallPrompt;
      setDeferredInstallPrompt(null);

      try {
        await installEvent.prompt();
        const choice = await installEvent.userChoice;
        if (choice.outcome === "accepted") setShowInstallHelp(false);
      } catch (error) {
        console.error("PWA installation failed:", error);
        setShowInstallHelp(true);
      }
      return;
    }

    // iOS and some browsers do not expose the native install prompt API.
    setShowInstallHelp(true);
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

     Opens the actual password-change modal.
     Does not call the forgot-password endpoint.
  ========================================================= */

  const handleChangePassword = () => {
    setProfileNotice("");
    setShowProfileMenu(false);
    setShowChangePasswordModal(true);
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
  ========================================================= */

  useEffect(() => {
    const handleOpenLoginModal = () => {
      if (isAdmin) return;

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
            {/* MENU */}
            <button
              type="button"
              className="header-icon-btn menu-btn"
              onClick={onMenuClick}
              aria-label="Open navigation menu"
              title="Open menu"
            >
              <HeaderIcon name="menu" size={22} strokeWidth={1.9} />
            </button>

            {/* LOGO */}
            <div className="header-brand" aria-label="Calbayog City Tourism">
              <div className="header-brand-mark">
                <img src="/logo2.png" alt="Calbayog City Tourism" />
              </div>
            </div>

            {/* SEARCH */}
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

            {/* RIGHT ACTIONS */}
            <div className="header-actions">
              {extraActions && (
                <div className="header-extra-actions">{extraActions}</div>
              )}

              {/* INSTALL APP: shown until the site is running as an installed PWA */}
              {!isStandalone && (
                <button
                  type="button"
                  className="header-install-btn"
                  onClick={handleInstallApp}
                  aria-label="Install Calbayog City Tourism app"
                  title="Install Calbayog City Tourism"
                >
                  <HeaderIcon name="download" size={18} strokeWidth={1.9} />
                  <span>Install App</span>
                </button>
              )}

              {/* AUTH / PROFILE */}
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

      {/* INSTALL HELP: fallback for browsers without a native install prompt */}
      {showInstallHelp && !isStandalone && (
        <div
          className="install-help-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowInstallHelp(false);
          }}
        >
          <section
            className="install-help-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-help-title"
            aria-describedby="install-help-description"
          >
            <div className="install-help-top">
              <div className="install-help-icon">
                <HeaderIcon name="download" size={23} strokeWidth={1.9} />
              </div>
              <div>
                <h2 id="install-help-title" className="install-help-title">
                  Install Calbayog City Tourism
                </h2>
                <p id="install-help-description" className="install-help-subtitle">
                  Add the website to your Home Screen for an app-like experience.
                </p>
              </div>
              <button
                type="button"
                className="install-help-close"
                onClick={() => setShowInstallHelp(false)}
                aria-label="Close installation instructions"
              >
                <HeaderIcon name="close" size={18} />
              </button>
            </div>

            {isIOSDevice ? (
              <>
                <p style={{ fontSize: ".86rem", lineHeight: 1.55, margin: 0 }}>
                  On iPhone or iPad, Apple requires installation through Safari's
                  Share menu. A website cannot open the native install prompt directly on iOS.
                </p>
                <ol className="install-help-steps">
                  <li>Open this website in <strong>Safari</strong>, not inside another app.</li>
                  <li>Tap Safari's <strong>Share</strong> icon.</li>
                  <li>Choose <strong>Add to Home Screen</strong>. If you do not see it, scroll the options.</li>
                  <li>Tap <strong>Add</strong> to finish.</li>
                </ol>
              </>
            ) : deferredInstallPrompt ? (
              <p style={{ fontSize: ".86rem", lineHeight: 1.55, margin: 0 }}>
                Your browser can install the app. Close these instructions and tap
                <strong> Install App</strong> in the header to open the native installation prompt.
              </p>
            ) : (
              <>
                <p style={{ fontSize: ".86rem", lineHeight: 1.55, margin: 0 }}>
                  This browser has not provided a one-tap installation prompt. The
                  native install button is available only when the browser supports it
                  and the website meets its PWA requirements.
                </p>
                <ol className="install-help-steps">
                  <li>Open the deployed website in a supported browser such as <strong>Chrome</strong>.</li>
                  <li>If the browser offers <strong>Install app</strong> or <strong>Add to Home screen</strong>, choose it.</li>
                  <li>If no install option appears, the PWA manifest, service worker, or browser support may need checking.</li>
                </ol>
              </>
            )}

            <div className="install-help-note">
              The website does not need an app-store download. Installation uses the
              website's PWA configuration to add an app-like shortcut to your device.
            </div>
            <button
              type="button"
              className="install-help-done"
              onClick={() => setShowInstallHelp(false)}
            >
              Got it
            </button>
          </section>
        </div>
      )}

      {/* LOGIN MODAL */}
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
          setShowLoginModal(false);
        }}
      />

      {/* SIGNUP MODAL */}
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

      {/* CHANGE PASSWORD MODAL */}
      <ChangePasswordModal
        show={showChangePasswordModal}
        onClose={() => {
          setShowChangePasswordModal(false);
        }}
        onSuccess={() => {
          setProfileNotice("");
        }}
      />
    </>
  );
};

export default AppHeader;
