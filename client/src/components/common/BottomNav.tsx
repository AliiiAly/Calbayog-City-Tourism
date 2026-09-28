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
             FULL RESPONSIVE LAYOUT
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
             MAIN FOOTER CONTENT
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

            row-gap: 36px;
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
             CONTACT INFORMATION
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

          .calbayog-footer-facebook-link:hover
            .calbayog-footer-facebook-name {
            color: #000000;
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

            gap: 24px;
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
             DESKTOP / LAPTOP
          ========================================================== */

          @media (max-width: 1199px) {
            .calbayog-footer-main {
              width: calc(100% - 60px);

              column-gap: 45px;
            }

            .calbayog-footer-bottom-wrapper {
              width: calc(100% - 60px);
            }
          }

          /* ==========================================================
             TABLET / SMALL LAPTOP
          ========================================================== */

          @media (max-width: 900px) {
            .calbayog-footer-main {
              width: calc(100% - 48px);

              grid-template-columns:
                minmax(0, 1fr)
                minmax(0, 1fr)
                minmax(0, 1fr);

              column-gap: 30px;

              row-gap: 32px;

              padding: 40px 0 36px;
            }

            .calbayog-footer-description {
              max-width: 100%;
            }

            .calbayog-footer-bottom-wrapper {
              width: calc(100% - 48px);
            }

            .calbayog-footer-bottom {
              gap: 18px;
            }

            .calbayog-footer-contact {
              font-size: 0.72rem;
            }

            .calbayog-footer-facebook-name {
              font-size: 0.71rem;
            }
          }

          /* ==========================================================
             TABLET PORTRAIT / LARGE PHONE
          ========================================================== */

          @media (max-width: 760px) {
            .calbayog-footer-main {
              width: calc(100% - 36px);

              display: grid;

              grid-template-columns:
                minmax(0, 1fr)
                minmax(0, 1fr);

              column-gap: 28px;

              row-gap: 30px;

              padding: 38px 0 34px;
            }

            .calbayog-footer-brand {
              grid-column: 1 / -1;
            }

            .calbayog-footer-description {
              max-width: 620px;
            }

            .calbayog-footer-bottom-wrapper {
              width: calc(100% - 36px);
            }
          }

          /* ==========================================================
             MOBILE
          ========================================================== */

          @media (max-width: 600px) {
            .calbayog-footer {
              overflow-x: hidden;
            }

            .calbayog-footer-main {
              width: calc(100% - 30px);

              display: flex;

              flex-direction: column;

              gap: 28px;

              padding: 36px 0 32px;
            }

            .calbayog-footer-brand,
            .calbayog-footer-main > div {
              width: 100%;

              min-width: 0;
            }

            .calbayog-footer-logo {
              width: 31px;
              height: 31px;

              max-width: 31px;

              flex: 0 0 31px;
            }

            .calbayog-footer-brand-name {
              font-size: 0.82rem;
            }

            .calbayog-footer-description {
              width: 100%;

              max-width: none;

              margin-top: 11px;

              font-size: 0.72rem;

              line-height: 1.65;
            }

            .calbayog-footer-heading {
              margin-bottom: 13px;

              font-size: 0.76rem;
            }

            .calbayog-footer-contact-list {
              gap: 11px;
            }

            .calbayog-footer-contact {
              font-size: 0.72rem;

              line-height: 1.55;
            }

            .calbayog-footer-contact-icon {
              width: 18px;
              height: 18px;

              flex-basis: 18px;
            }

            .calbayog-footer-facebook-link {
              gap: 9px;
            }

            .calbayog-footer-facebook-icon {
              width: 29px;
              height: 29px;

              flex-basis: 29px;
            }

            .calbayog-footer-facebook-name {
              font-size: 0.72rem;

              line-height: 1.45;
            }

            .calbayog-footer-facebook-label {
              font-size: 0.64rem;

              line-height: 1.45;
            }

            .calbayog-footer-bottom-wrapper {
              width: calc(100% - 30px);
            }

            .calbayog-footer-bottom {
              min-height: auto;

              padding: 16px 0 18px;

              flex-direction: column;

              align-items: flex-start;

              justify-content: center;

              gap: 7px;
            }

            .calbayog-footer-copyright {
              width: 100%;

              font-size: 0.62rem;

              line-height: 1.55;
            }

            .calbayog-footer-location {
              font-size: 0.62rem;

              white-space: normal;
            }
          }

          /* ==========================================================
             SMALL PHONES
          ========================================================== */

          @media (max-width: 420px) {
            .calbayog-footer-main {
              width: calc(100% - 24px);

              gap: 26px;

              padding-top: 32px;

              padding-bottom: 30px;
            }

            .calbayog-footer-bottom-wrapper {
              width: calc(100% - 24px);
            }

            .calbayog-footer-logo {
              width: 29px;
              height: 29px;

              max-width: 29px;

              flex-basis: 29px;
            }

            .calbayog-footer-brand-link {
              gap: 8px;
            }

            .calbayog-footer-brand-name {
              font-size: 0.78rem;

              line-height: 1.3;
            }

            .calbayog-footer-description {
              font-size: 0.69rem;

              line-height: 1.65;
            }

            .calbayog-footer-heading {
              font-size: 0.74rem;
            }

            .calbayog-footer-contact {
              font-size: 0.69rem;

              gap: 8px;
            }

            .calbayog-footer-contact-icon {
              width: 17px;
              height: 17px;

              flex-basis: 17px;
            }

            .calbayog-footer-facebook-icon {
              width: 28px;
              height: 28px;

              flex-basis: 28px;
            }

            .calbayog-footer-facebook-name {
              font-size: 0.69rem;
            }

            .calbayog-footer-facebook-label {
              font-size: 0.61rem;
            }

            .calbayog-footer-copyright {
              font-size: 0.60rem;
            }

            .calbayog-footer-location {
              font-size: 0.60rem;
            }
          }

          /* ==========================================================
             VERY SMALL PHONES
             320px - 360px
          ========================================================== */

          @media (max-width: 360px) {
            .calbayog-footer-main {
              width: calc(100% - 20px);

              gap: 24px;

              padding-top: 28px;

              padding-bottom: 28px;
            }

            .calbayog-footer-bottom-wrapper {
              width: calc(100% - 20px);
            }

            .calbayog-footer-logo {
              width: 27px;
              height: 27px;

              max-width: 27px;

              flex-basis: 27px;
            }

            .calbayog-footer-brand-name {
              font-size: 0.74rem;
            }

            .calbayog-footer-description {
              font-size: 0.66rem;

              line-height: 1.6;
            }

            .calbayog-footer-heading {
              margin-bottom: 11px;

              font-size: 0.72rem;
            }

            .calbayog-footer-contact-list {
              gap: 10px;
            }

            .calbayog-footer-contact {
              font-size: 0.66rem;

              gap: 7px;
            }

            .calbayog-footer-contact-icon {
              width: 16px;
              height: 16px;

              flex-basis: 16px;
            }

            .calbayog-footer-facebook-link {
              gap: 8px;
            }

            .calbayog-footer-facebook-icon {
              width: 26px;
              height: 26px;

              flex-basis: 26px;

              border-radius: 7px;
            }

            .calbayog-footer-facebook-name {
              font-size: 0.66rem;
            }

            .calbayog-footer-facebook-label {
              font-size: 0.58rem;
            }

            .calbayog-footer-bottom {
              padding: 14px 0 16px;

              gap: 6px;
            }

            .calbayog-footer-copyright {
              font-size: 0.57rem;
            }

            .calbayog-footer-location {
              font-size: 0.57rem;
            }
          }

          /* ==========================================================
             EXTREMELY NARROW DEVICES
             Prevents horizontal overflow on unusual screens.
          ========================================================== */

          @media (max-width: 320px) {
            .calbayog-footer-main {
              width: calc(100% - 16px);

              padding-top: 25px;

              padding-bottom: 25px;
            }

            .calbayog-footer-bottom-wrapper {
              width: calc(100% - 16px);
            }

            .calbayog-footer-brand-link {
              gap: 7px;
            }

            .calbayog-footer-brand-name {
              font-size: 0.70rem;
            }

            .calbayog-footer-description {
              font-size: 0.63rem;
            }

            .calbayog-footer-contact {
              font-size: 0.63rem;
            }

            .calbayog-footer-facebook-name {
              font-size: 0.63rem;
            }

            .calbayog-footer-facebook-label {
              font-size: 0.56rem;
            }

            .calbayog-footer-copyright,
            .calbayog-footer-location {
              font-size: 0.55rem;
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

            <a
              href="tel:09602146409"
              className="calbayog-footer-contact"
              aria-label="Call Calbayog City Tourism"
            >
              <span className="calbayog-footer-contact-icon">
                <FooterIcon
                  name="phone"
                  size={16}
                />
              </span>

              <span className="calbayog-footer-contact-text">
                0960 2146 409
              </span>
            </a>

            <a
              href="mailto:calbayogtourism@gmail.com"
              className="calbayog-footer-contact"
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

            <div className="calbayog-footer-contact">
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
            </div>

          </div>
        </div>

        {/* ==========================================================
            FACEBOOK
        ========================================================== */}

        <div>
          <h3 className="calbayog-footer-heading">
            Follow Us
          </h3>

          <a
            href="#"
            className="calbayog-footer-facebook-link"
            aria-label="Calbayog City Tourism Office Facebook"
            onClick={(e) => e.preventDefault()}
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
          </a>
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
