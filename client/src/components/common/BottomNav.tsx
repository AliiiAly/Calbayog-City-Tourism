import React from "react";

interface BottomNavProps {
  role?: "user" | "admin";
}

type FooterIconName =
  | "phone"
  | "email"
  | "location"
  | "facebook";

interface FooterIconProps {
  name: FooterIconName;
  size?: number;
  strokeWidth?: number;
}

const FooterIcon: React.FC<FooterIconProps> = ({
  name,
  size = 18,
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
    case "phone":
      return (
        <svg {...commonProps}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" />
        </svg>
      );

    case "email":
      return (
        <svg {...commonProps}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      );

    case "location":
      return (
        <svg {...commonProps}>
          <path d="M20 10c0 5.5-8 11-8 11S4 15.5 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );

    case "facebook":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M14 8h3V4h-3c-3.31 0-5 1.69-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9c0-.66.34-1 1-1Z" />
        </svg>
      );

    default:
      return null;
  }
};

const BottomNav: React.FC<BottomNavProps> = () => {
  return (
    <footer className="calbayog-footer">
      <style>
        {`
          /* ==========================================================
             CALBAYOG CITY TOURISM FOOTER
             SAME 3-COLUMN ARRANGEMENT ON ALL SCREENS
          ========================================================== */

          .calbayog-footer {
            position: relative;
            width: 100%;
            max-width: 100%;
            margin: 0;
            padding: 0;

            background: #fafcfb;

            border-top: 1px solid #edf1ef;

            color: #000000;

            font-family:
              "Poppins",
              "Inter",
              sans-serif;

            box-sizing: border-box;

            overflow: hidden;
          }

          .calbayog-footer *,
          .calbayog-footer *::before,
          .calbayog-footer *::after {
            box-sizing: border-box;
          }

          .calbayog-footer a {
            -webkit-tap-highlight-color: transparent;
          }

          /* ==========================================================
             MAIN FOOTER
          ========================================================== */

          .calbayog-footer-main {
            width: min(1180px, calc(100% - 48px));

            margin: 0 auto;

            padding: 46px 0 40px;

            display: grid;

            grid-template-columns:
              minmax(0, 1.35fr)
              minmax(0, 1fr)
              minmax(0, 1fr);

            column-gap: 70px;

            row-gap: 0;
          }

          /* ==========================================================
             BRAND
          ========================================================== */

          .calbayog-footer-brand {
            min-width: 0;
            width: 100%;
          }

          .calbayog-footer-brand-link {
            display: inline-flex;

            align-items: center;

            max-width: 100%;

            gap: 9px;

            color: #2D3195;

            text-decoration: none;
          }

          .calbayog-footer-logo {
            width: 34px;
            height: 34px;

            max-width: 34px;

            object-fit: contain;

            flex: 0 0 34px;

            display: block;
          }

          .calbayog-footer-brand-name {
            margin: 0;

            min-width: 0;

            color: #2D3195;

            font-family:
              "Barabara",
              "Poppins",
              "Inter",
              sans-serif;

            font-size: 0.86rem;

            line-height: 1.25;

            font-weight: 700;

            letter-spacing: 0.01em;

            overflow-wrap: anywhere;
          }

          .calbayog-footer-description {
            width: 100%;

            max-width: 390px;

            margin: 13px 0 0;

            color: #000000;

            font-size: 0.76rem;

            line-height: 1.7;

            overflow-wrap: anywhere;
          }

          /* ==========================================================
             SECTION HEADINGS
          ========================================================== */

          .calbayog-footer-heading {
            margin: 0 0 15px;

            color: #000000;

            font-size: 0.78rem;

            line-height: 1.4;

            font-weight: 700;
          }

          /* ==========================================================
             CONTACT
          ========================================================== */

          .calbayog-footer-contact-list {
            display: flex;

            flex-direction: column;

            gap: 12px;

            width: 100%;
          }

          .calbayog-footer-contact {
            display: flex;

            align-items: flex-start;

            gap: 9px;

            width: 100%;

            min-width: 0;

            color: #000000;

            font-size: 0.73rem;

            line-height: 1.5;

            text-decoration: none;
          }

          .calbayog-footer-contact:hover {
            color: #000000;
          }

          .calbayog-footer-contact-icon {
            width: 18px;
            height: 18px;

            flex: 0 0 18px;

            display: flex;

            align-items: center;

            justify-content: center;

            color: #000000;
          }

          .calbayog-footer-contact-text {
            min-width: 0;

            flex: 1 1 auto;

            color: #000000;

            overflow-wrap: anywhere;

            word-break: break-word;
          }

          /* ==========================================================
             PHONE RESPONSIVE BEHAVIOR
             
             Mobile:
             - Clickable tel link

             Desktop:
             - Plain text only
             - Does not attempt to open a phone application
          ========================================================== */

          .calbayog-footer-phone-mobile {
            display: none;
          }

          .calbayog-footer-phone-desktop {
            display: block;
          }

          /* ==========================================================
             EMAIL
          ========================================================== */

          .calbayog-footer-email-link {
            display: flex;

            align-items: flex-start;

            gap: 9px;

            width: 100%;

            min-width: 0;

            color: #000000;

            text-decoration: none;
          }

          .calbayog-footer-email-link:hover {
            color: #000000;
          }

          /* ==========================================================
             ADDRESS
          ========================================================== */

          .calbayog-footer-address-link {
            display: flex;

            align-items: flex-start;

            gap: 9px;

            width: 100%;

            min-width: 0;

            color: #000000;

            text-decoration: none;

            cursor: pointer;
          }

          .calbayog-footer-address-link:hover {
            color: #000000;
          }

          /* ==========================================================
             FACEBOOK
          ========================================================== */

          .calbayog-footer-facebook-link {
            display: flex;

            align-items: flex-start;

            width: 100%;

            max-width: 100%;

            gap: 10px;

            color: #000000;

            text-decoration: none;

            cursor: default;
          }

          .calbayog-footer-facebook-icon {
            width: 30px;
            height: 30px;

            flex: 0 0 30px;

            display: flex;

            align-items: center;

            justify-content: center;

            border-radius: 8px;

            background: #f1f3f2;

            color: #000000;
          }

          .calbayog-footer-facebook-info {
            min-width: 0;

            flex: 1 1 auto;

            padding-top: 0;
          }

          .calbayog-footer-facebook-name {
            display: block;

            color: #000000;

            font-size: 0.74rem;

            line-height: 1.5;

            font-weight: 600;

            overflow-wrap: anywhere;

            word-break: break-word;
          }

          .calbayog-footer-facebook-label {
            display: block;

            margin-top: 1px;

            color: #000000;

            font-size: 0.66rem;

            line-height: 1.5;

            overflow-wrap: anywhere;
          }

          /* ==========================================================
             COPYRIGHT AREA
          ========================================================== */

          .calbayog-footer-bottom-wrapper {
            width: min(1180px, calc(100% - 48px));

            margin: 0 auto;

            border-top: 1px solid #e3e8e5;
          }

          .calbayog-footer-bottom {
            width: 100%;

            min-height: 64px;

            margin: 0;

            padding: 0;

            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 20px;
          }

          .calbayog-footer-copyright {
            min-width: 0;

            margin: 0;

            color: #000000;

            font-size: 0.66rem;

            line-height: 1.5;

            overflow-wrap: anywhere;
          }

          .calbayog-footer-location {
            display: inline-flex;

            align-items: center;

            gap: 5px;

            min-width: 0;

            color: #000000;

            font-size: 0.66rem;

            line-height: 1.5;

            font-weight: 600;

            white-space: nowrap;

            flex: 0 0 auto;
          }

          .calbayog-footer-location-icon {
            display: flex;

            align-items: center;

            justify-content: center;

            color: #000000;

            flex: 0 0 auto;
          }

          /* ==========================================================
             LARGE DESKTOP
          ========================================================== */

          @media (min-width: 1400px) {
            .calbayog-footer-main {
              width: min(1240px, calc(100% - 80px));

              column-gap: 90px;

              padding-top: 52px;

              padding-bottom: 44px;
            }

            .calbayog-footer-bottom-wrapper {
              width: min(1240px, calc(100% - 80px));
            }
          }

          /* ==========================================================
             LAPTOP
          ========================================================== */

          @media (max-width: 1199px) {
            .calbayog-footer-main {
              width: calc(100% - 60px);

              column-gap: 45px;
            }

            .calbayog-footer-bottom-wrapper {
              width: calc(100% - 60px);
            }

            .calbayog-footer-brand-name {
              font-size: 0.82rem;
            }

            .calbayog-footer-description {
              font-size: 0.72rem;
            }

            .calbayog-footer-heading {
              font-size: 0.75rem;
            }

            .calbayog-footer-contact,
            .calbayog-footer-email-link,
            .calbayog-footer-address-link {
              font-size: 0.69rem;
            }

            .calbayog-footer-facebook-name {
              font-size: 0.70rem;
            }

            .calbayog-footer-facebook-label {
              font-size: 0.63rem;
            }
          }

          /* ==========================================================
             TABLET
             IMPORTANT:
             STILL 3 COLUMNS
          ========================================================== */

          @media (max-width: 900px) {
            .calbayog-footer-main {
              width: calc(100% - 40px);

              grid-template-columns:
                minmax(0, 1.35fr)
                minmax(0, 1fr)
                minmax(0, 1fr);

              column-gap: 24px;

              padding: 34px 0 30px;
            }

            .calbayog-footer-logo {
              width: 30px;
              height: 30px;

              max-width: 30px;

              flex-basis: 30px;
            }

            .calbayog-footer-brand-link {
              gap: 7px;
            }

            .calbayog-footer-brand-name {
              font-size: 0.73rem;
            }

            .calbayog-footer-description {
              max-width: 100%;

              margin-top: 10px;

              font-size: 0.64rem;

              line-height: 1.6;
            }

            .calbayog-footer-heading {
              margin-bottom: 11px;

              font-size: 0.68rem;
            }

            .calbayog-footer-contact-list {
              gap: 9px;
            }

            .calbayog-footer-contact,
            .calbayog-footer-email-link,
            .calbayog-footer-address-link {
              gap: 6px;

              font-size: 0.62rem;

              line-height: 1.45;
            }

            .calbayog-footer-contact-icon {
              width: 15px;
              height: 15px;

              flex-basis: 15px;
            }

            .calbayog-footer-facebook-link {
              gap: 7px;
            }

            .calbayog-footer-facebook-icon {
              width: 25px;
              height: 25px;

              flex-basis: 25px;

              border-radius: 7px;
            }

            .calbayog-footer-facebook-name {
              font-size: 0.62rem;

              line-height: 1.4;
            }

            .calbayog-footer-facebook-label {
              font-size: 0.56rem;

              line-height: 1.4;
            }

            .calbayog-footer-bottom-wrapper {
              width: calc(100% - 40px);
            }

            .calbayog-footer-bottom {
              min-height: 52px;

              gap: 12px;
            }

            .calbayog-footer-copyright {
              font-size: 0.58rem;
            }

            .calbayog-footer-location {
              font-size: 0.58rem;
            }

            .calbayog-footer-location-icon svg {
              width: 11px;
              height: 11px;
            }
          }

          /* ==========================================================
             MOBILE
             STILL 3 COLUMNS
          ========================================================== */

          @media (max-width: 600px) {
            .calbayog-footer-main {
              width: calc(100% - 24px);

              grid-template-columns:
                minmax(0, 1.35fr)
                minmax(0, 1fr)
                minmax(0, 1fr);

              column-gap: 12px;

              padding: 28px 0 25px;
            }

            .calbayog-footer-logo {
              width: 24px;
              height: 24px;

              max-width: 24px;

              flex-basis: 24px;
            }

            .calbayog-footer-brand-link {
              gap: 5px;
            }

            .calbayog-footer-brand-name {
              font-size: 0.59rem;

              line-height: 1.25;
            }

            .calbayog-footer-description {
              margin-top: 8px;

              font-size: 0.53rem;

              line-height: 1.55;
            }

            .calbayog-footer-heading {
              margin-bottom: 8px;

              font-size: 0.59rem;

              line-height: 1.3;
            }

            .calbayog-footer-contact-list {
              gap: 7px;
            }

            .calbayog-footer-contact,
            .calbayog-footer-email-link,
            .calbayog-footer-address-link {
              gap: 4px;

              font-size: 0.51rem;

              line-height: 1.4;
            }

            .calbayog-footer-contact-icon {
              width: 12px;
              height: 12px;

              flex-basis: 12px;
            }

            .calbayog-footer-contact-icon svg {
              width: 12px;
              height: 12px;
            }

            .calbayog-footer-facebook-link {
              gap: 5px;
            }

            .calbayog-footer-facebook-icon {
              width: 21px;
              height: 21px;

              flex-basis: 21px;

              border-radius: 6px;
            }

            .calbayog-footer-facebook-icon svg {
              width: 12px;
              height: 12px;
            }

            .calbayog-footer-facebook-name {
              font-size: 0.51rem;

              line-height: 1.35;
            }

            .calbayog-footer-facebook-label {
              margin-top: 1px;

              font-size: 0.45rem;

              line-height: 1.35;
            }

            .calbayog-footer-bottom-wrapper {
              width: calc(100% - 24px);
            }

            .calbayog-footer-bottom {
              min-height: 45px;

              gap: 8px;
            }

            .calbayog-footer-copyright {
              font-size: 0.48rem;

              line-height: 1.35;
            }

            .calbayog-footer-location {
              gap: 3px;

              font-size: 0.48rem;

              line-height: 1.35;
            }

            .calbayog-footer-location-icon svg {
              width: 9px;
              height: 9px;
            }

            /* MOBILE PHONE = CLICKABLE */
            .calbayog-footer-phone-mobile {
              display: block;
            }

            .calbayog-footer-phone-desktop {
              display: none;
            }
          }

          /* ==========================================================
             SMALL PHONES
             STILL 3 COLUMNS
          ========================================================== */

          @media (max-width: 420px) {
            .calbayog-footer-main {
              width: calc(100% - 18px);

              column-gap: 8px;

              padding: 24px 0 22px;
            }

            .calbayog-footer-logo {
              width: 21px;
              height: 21px;

              max-width: 21px;

              flex-basis: 21px;
            }

            .calbayog-footer-brand-link {
              gap: 4px;
            }

            .calbayog-footer-brand-name {
              font-size: 0.52rem;
            }

            .calbayog-footer-description {
              margin-top: 7px;

              font-size: 0.47rem;

              line-height: 1.5;
            }

            .calbayog-footer-heading {
              margin-bottom: 7px;

              font-size: 0.53rem;
            }

            .calbayog-footer-contact-list {
              gap: 6px;
            }

            .calbayog-footer-contact,
            .calbayog-footer-email-link,
            .calbayog-footer-address-link {
              gap: 3px;

              font-size: 0.46rem;
            }

            .calbayog-footer-contact-icon {
              width: 11px;
              height: 11px;

              flex-basis: 11px;
            }

            .calbayog-footer-contact-icon svg {
              width: 11px;
              height: 11px;
            }

            .calbayog-footer-facebook-link {
              gap: 4px;
            }

            .calbayog-footer-facebook-icon {
              width: 19px;
              height: 19px;

              flex-basis: 19px;
            }

            .calbayog-footer-facebook-icon svg {
              width: 11px;
              height: 11px;
            }

            .calbayog-footer-facebook-name {
              font-size: 0.46rem;
            }

            .calbayog-footer-facebook-label {
              font-size: 0.41rem;
            }

            .calbayog-footer-bottom-wrapper {
              width: calc(100% - 18px);
            }

            .calbayog-footer-bottom {
              min-height: 40px;

              gap: 6px;
            }

            .calbayog-footer-copyright {
              font-size: 0.43rem;
            }

            .calbayog-footer-location {
              font-size: 0.43rem;

              gap: 2px;
            }

            .calbayog-footer-location-icon svg {
              width: 8px;
              height: 8px;
            }
          }

          /* ==========================================================
             VERY SMALL PHONES
             STILL 3 COLUMNS
          ========================================================== */

          @media (max-width: 360px) {
            .calbayog-footer-main {
              width: calc(100% - 14px);

              column-gap: 6px;

              padding: 21px 0 20px;
            }

            .calbayog-footer-logo {
              width: 19px;
              height: 19px;

              max-width: 19px;

              flex-basis: 19px;
            }

            .calbayog-footer-brand-name {
              font-size: 0.48rem;
            }

            .calbayog-footer-description {
              font-size: 0.43rem;
            }

            .calbayog-footer-heading {
              font-size: 0.49rem;
            }

            .calbayog-footer-contact,
            .calbayog-footer-email-link,
            .calbayog-footer-address-link {
              font-size: 0.42rem;
            }

            .calbayog-footer-contact-icon {
              width: 10px;
              height: 10px;

              flex-basis: 10px;
            }

            .calbayog-footer-contact-icon svg {
              width: 10px;
              height: 10px;
            }

            .calbayog-footer-facebook-icon {
              width: 17px;
              height: 17px;

              flex-basis: 17px;
            }

            .calbayog-footer-facebook-icon svg {
              width: 10px;
              height: 10px;
            }

            .calbayog-footer-facebook-name {
              font-size: 0.42rem;
            }

            .calbayog-footer-facebook-label {
              font-size: 0.38rem;
            }

            .calbayog-footer-bottom-wrapper {
              width: calc(100% - 14px);
            }

            .calbayog-footer-bottom {
              min-height: 36px;

              gap: 5px;
            }

            .calbayog-footer-copyright {
              font-size: 0.39rem;
            }

            .calbayog-footer-location {
              font-size: 0.39rem;
            }
          }

          /* ==========================================================
             EXTREMELY SMALL SCREENS
          ========================================================== */

          @media (max-width: 320px) {
            .calbayog-footer-main {
              width: calc(100% - 10px);

              column-gap: 5px;

              padding-top: 19px;

              padding-bottom: 18px;
            }

            .calbayog-footer-logo {
              width: 17px;
              height: 17px;

              max-width: 17px;

              flex-basis: 17px;
            }

            .calbayog-footer-brand-name {
              font-size: 0.44rem;
            }

            .calbayog-footer-description {
              font-size: 0.40rem;
            }

            .calbayog-footer-heading {
              font-size: 0.45rem;
            }

            .calbayog-footer-contact,
            .calbayog-footer-email-link,
            .calbayog-footer-address-link {
              font-size: 0.39rem;
            }

            .calbayog-footer-facebook-name {
              font-size: 0.39rem;
            }

            .calbayog-footer-facebook-label {
              font-size: 0.35rem;
            }

            .calbayog-footer-bottom-wrapper {
              width: calc(100% - 10px);
            }

            .calbayog-footer-copyright,
            .calbayog-footer-location {
              font-size: 0.36rem;
            }
          }

          /* ==========================================================
             REDUCED MOTION
          ========================================================== */

          @media (prefers-reduced-motion: reduce) {
            .calbayog-footer a {
              transition: none !important;
            }
          }
        `}
      </style>

      {/* ============================================================
          MAIN FOOTER
      ============================================================ */}

      <div className="calbayog-footer-main">

        {/* ==========================================================
            BRAND
        ========================================================== */}

        <div className="calbayog-footer-brand">
          <a
            href="/"
            className="calbayog-footer-brand-link"
            aria-label="Calbayog City Tourism"
          >
            <img
              src="/logo2.png"
              alt="Calbayog City Tourism"
              className="calbayog-footer-logo"
            />

            <span className="calbayog-footer-brand-name">
              CALBAYOG CITY TOURISM
            </span>
          </a>

          <p className="calbayog-footer-description">
            Discover the attractions, culture, events, and
            experiences that make Calbayog City a wonderful
            destination in Samar.
          </p>
        </div>

        {/* ==========================================================
            CONTACT
        ========================================================== */}

        <div>
          <h3 className="calbayog-footer-heading">
            Contact
          </h3>

          <div className="calbayog-footer-contact-list">

            {/* ======================================================
                PHONE

                MOBILE:
                Clickable tel link

                DESKTOP:
                Plain text
            ====================================================== */}

            <div className="calbayog-footer-contact">

              <span className="calbayog-footer-contact-icon">
                <FooterIcon
                  name="phone"
                  size={16}
                />
              </span>

              <span className="calbayog-footer-contact-text">

                {/* MOBILE */}
                <a
                  href="tel:09602146409"
                  className="calbayog-footer-phone-mobile"
                  aria-label="Call Calbayog City Tourism"
                >
                  0960 2146 409
                </a>

                {/* DESKTOP */}
                <span className="calbayog-footer-phone-desktop">
                  0960 2146 409
                </span>

              </span>
            </div>

            {/* ======================================================
                EMAIL
            ====================================================== */}

            <a
              href="mailto:calbayogtourism@gmail.com"
              className="calbayog-footer-email-link"
              aria-label="Email Calbayog City Tourism"
            >
              <span className="calbayog-footer-contact-icon">
                <FooterIcon
                  name="email"
                  size={16}
                />
              </span>

              <span className="calbayog-footer-contact-text">
                calbayogtourism@gmail.com
              </span>
            </a>

            {/* ======================================================
                ADDRESS

                Opens Google Maps.
                Works on both desktop and mobile.
            ====================================================== */}

            <a
              href="https://www.google.com/maps/search/?api=1&query=Gelera+St,+Nijaga+Park,+Calbayog+City,+Samar+6710"
              target="_blank"
              rel="noopener noreferrer"
              className="calbayog-footer-address-link"
              aria-label="Open Calbayog City Tourism Office location in Google Maps"
            >
              <span className="calbayog-footer-contact-icon">
                <FooterIcon
                  name="location"
                  size={16}
                />
              </span>

              <span className="calbayog-footer-contact-text">
                Gelera St., Nijaga Park,
                <br />
                Calbayog City, Samar 6710
              </span>
            </a>

          </div>
        </div>

        {/* ==========================================================
            FACEBOOK
        ========================================================== */}

        <div>
          <h3 className="calbayog-footer-heading">
            Follow Us
          </h3>

          {/*
            The original file did not contain the official Facebook URL.
            Therefore this remains informational and is NOT made into
            a fake clickable link.
          */}

          <div
            className="calbayog-footer-facebook-link"
            aria-label="Calbayog City Tourism Office Facebook"
          >
            <span className="calbayog-footer-facebook-icon">
              <FooterIcon
                name="facebook"
                size={16}
              />
            </span>

            <span className="calbayog-footer-facebook-info">
              <span className="calbayog-footer-facebook-name">
                Calbayog City Tourism Office
              </span>

              <span className="calbayog-footer-facebook-label">
                Follow us on Facebook
              </span>
            </span>
          </div>
        </div>

      </div>

      {/* ============================================================
          COPYRIGHT
      ============================================================ */}

      <div className="calbayog-footer-bottom-wrapper">
        <div className="calbayog-footer-bottom">

          <p className="calbayog-footer-copyright">
            © {new Date().getFullYear()} Calbayog City Tourism.
            All rights reserved.
          </p>

          <span className="calbayog-footer-location">
            <span className="calbayog-footer-location-icon">
              <FooterIcon
                name="location"
                size={12}
              />
            </span>

            Calbayog City, Samar
          </span>

        </div>
      </div>
    </footer>
  );
};

export default BottomNav;
