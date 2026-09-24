import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { Form, Button, Alert } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import { loginAdmin } from "../../services/api";

const AdminLogin: React.FC = () => {
  const { login } = useAuth();
  const history = useHistory();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const res = await loginAdmin({
        username,
        password,
      });

      console.log("Login response:", res.data);

      login(res.data.token, res.data.admin);

      history.push("/admin");
    } catch (err: any) {
      console.error("Login error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Invalid username or password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      {/* =========================================================
          LEFT SIDE — BRANDING
      ========================================================= */}
      <section className="admin-login-brand">
        <div className="admin-login-brand-overlay" />

        <div className="admin-login-brand-content">
          {/* Logo */}
          <div className="admin-login-logo-wrap">
            <img
              src="/logo2.png"
              alt="Calbayog City Tourism"
              className="admin-login-logo"
            />
          </div>

          {/* Brand Name */}
          <h1 className="admin-login-brand-title">
            CALBAYOG CITY
            <span>TOURISM</span>
          </h1>

          <div className="admin-login-brand-line" />

          <p className="admin-login-brand-description">
            Discover, manage, and showcase the places and experiences that make
            Calbayog City worth exploring.
          </p>

          {/* Small brand statement */}
          <div className="admin-login-brand-note">
            <span className="admin-login-brand-dot" />
            <span>Calbayog City Tourism Management</span>
          </div>
        </div>
      </section>

      {/* =========================================================
          RIGHT SIDE — LOGIN
      ========================================================= */}
      <section className="admin-login-form-side">
        {/* Decorative background shapes */}
        <div className="admin-login-circle admin-login-circle-one" />
        <div className="admin-login-circle admin-login-circle-two" />

        <div className="admin-login-form-container">
          {/* Mobile Logo */}
          <div className="admin-login-mobile-logo">
            <img src="/logo2.png" alt="Calbayog City Tourism" />
          </div>

          {/* Heading */}
          <div className="admin-login-heading">
            <span className="admin-login-eyebrow">ADMINISTRATION</span>

            <h2>Welcome Back</h2>

            <p>Sign in to manage Calbayog City Tourism.</p>
          </div>

          {/* Login Card */}
          <div className="admin-login-card">
            {/* Top accent */}
            <div className="admin-login-card-accent" />

            <div className="admin-login-card-content">
              <div className="admin-login-card-header">
                <h3>Admin Portal</h3>
                <p>Enter your account details to continue.</p>
              </div>

              {/* Error */}
              {error && (
                <Alert variant="danger" className="admin-login-alert">
                  <div className="admin-login-alert-title">
                    Authentication Failed
                  </div>

                  <div className="admin-login-alert-message">{error}</div>
                </Alert>
              )}

              {/* Form */}
              <Form onSubmit={handleSubmit}>
                {/* Username */}
                <Form.Group className="admin-login-field">
                  <Form.Label>Username</Form.Label>

                  <div className="admin-login-input-wrap">
                    <Form.Control
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      required
                      autoFocus
                      className="admin-login-input"
                    />
                  </div>
                </Form.Group>

                {/* Password */}
                <Form.Group className="admin-login-field admin-login-password-field">
                  <Form.Label>Password</Form.Label>

                  <div className="admin-login-input-wrap">
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="admin-login-input admin-login-password-input"
                    />

                    <button
                      type="button"
                      className="admin-login-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </Form.Group>

                {/* Sign In */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="admin-login-submit"
                >
                  {loading ? (
                    <span className="admin-login-submit-loading">
                      <span className="admin-login-spinner" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="admin-login-submit-content">
                      Sign In
                      <span className="admin-login-arrow">→</span>
                    </span>
                  )}
                </Button>
              </Form>
            </div>
          </div>

          {/* Footer */}
          <div className="admin-login-footer">
            <span>© 2026 Calbayog City Tourism</span>
            <span className="admin-login-footer-separator">•</span>
            <span>Admin Portal</span>
          </div>
        </div>
      </section>

      {/* =========================================================
          PAGE STYLES
      ========================================================= */}
      <style>{`
        @font-face {
          font-family: "Barabara";
          src: url("/fonts/BARABARA-final.otf") format("opentype");
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }

        .admin-login-page {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100vh;
          display: flex;
          overflow: hidden;
          background: #ffffff;
          font-family: "Inter", "Segoe UI", Arial, sans-serif;
          color: #202124;
        }

        /* =====================================================
           LEFT BRANDING SIDE
        ===================================================== */

        .admin-login-brand {
          position: relative;
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;

          background-image: url('/calbayogonair.webp');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        .admin-login-brand-overlay {
          position: absolute;
          inset: 0;

          background:
            linear-gradient(
              135deg,
              rgba(45, 49, 149, 0.94) 0%,
              rgba(37, 41, 126, 0.88) 48%,
              rgba(24, 27, 93, 0.94) 100%
            );
        }

        .admin-login-brand-content {
          position: relative;
          z-index: 2;

          width: 100%;
          max-width: 500px;

          padding: 50px;

          text-align: center;
        }

        /* =====================================================
           LOGO
        ===================================================== */

        .admin-login-logo-wrap {
          width: 118px;
          height: 118px;

          margin: 0 auto 30px;

          display: flex;
          align-items: center;
          justify-content: center;

          background: rgba(255, 255, 255, 0.13);

          border: 1px solid rgba(255, 255, 255, 0.22);

          border-radius: 30px;

          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);

          box-shadow:
            0 18px 50px rgba(0, 0, 0, 0.16);

          animation: adminLogoFloat 4s ease-in-out infinite;
        }

        .admin-login-logo {
          width: 82px;
          height: 82px;

          object-fit: contain;

          display: block;
        }

        @keyframes adminLogoFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-7px);
          }
        }

        /* =====================================================
           BRAND TITLE
        ===================================================== */

        .admin-login-brand-title {
          margin: 0;

          color: #ffffff;

          font-family: "Barabara", "Arial Black", sans-serif;

          font-size: clamp(2.4rem, 4vw, 3.6rem);

          font-weight: normal;

          line-height: 0.95;

          letter-spacing: 1px;
        }

        .admin-login-brand-title span {
          display: block;

          margin-top: 8px;

          color: #ffb71b;

          font-size: 0.72em;

          letter-spacing: 4px;
        }

        .admin-login-brand-line {
          width: 68px;
          height: 4px;

          margin: 27px auto 25px;

          background: #ffb71b;

          border-radius: 99px;
        }

        .admin-login-brand-description {
          margin: 0 auto;

          max-width: 440px;

          color: rgba(255, 255, 255, 0.87);

          font-size: 0.98rem;

          line-height: 1.75;

          font-weight: 400;
        }

        .admin-login-brand-note {
          margin-top: 34px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          gap: 9px;

          padding: 9px 16px;

          color: rgba(255, 255, 255, 0.78);

          background: rgba(255, 255, 255, 0.09);

          border: 1px solid rgba(255, 255, 255, 0.14);

          border-radius: 999px;

          font-size: 0.73rem;

          letter-spacing: 0.4px;

          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .admin-login-brand-dot {
          width: 7px;
          height: 7px;

          flex-shrink: 0;

          border-radius: 50%;

          background: #ffb71b;

          box-shadow:
            0 0 0 4px rgba(255, 183, 27, 0.14);
        }

        /* =====================================================
           RIGHT SIDE
        ===================================================== */

        .admin-login-form-side {
          position: relative;

          flex: 1;

          min-width: 0;

          display: flex;

          align-items: center;

          justify-content: center;

          padding: 40px;

          overflow-y: auto;
          overflow-x: hidden;

          background:
            radial-gradient(
              circle at top right,
              rgba(45, 49, 149, 0.075),
              transparent 34%
            ),
            radial-gradient(
              circle at bottom left,
              rgba(255, 183, 27, 0.07),
              transparent 30%
            ),
            #ffffff;
        }

        /* =====================================================
           DECORATIVE CIRCLES
        ===================================================== */

        .admin-login-circle {
          position: absolute;

          border-radius: 50%;

          pointer-events: none;
        }

        .admin-login-circle-one {
          width: 280px;
          height: 280px;

          top: -145px;
          right: -120px;

          border: 1px solid rgba(45, 49, 149, 0.08);

          background: rgba(45, 49, 149, 0.025);
        }

        .admin-login-circle-two {
          width: 210px;
          height: 210px;

          bottom: -120px;
          left: -110px;

          border: 1px solid rgba(255, 183, 27, 0.1);

          background: rgba(255, 183, 27, 0.025);
        }

        /* =====================================================
           FORM CONTAINER
        ===================================================== */

        .admin-login-form-container {
          position: relative;

          z-index: 2;

          width: 100%;

          max-width: 430px;
        }

        /* =====================================================
           MOBILE LOGO
        ===================================================== */

        .admin-login-mobile-logo {
          display: none;

          width: 70px;
          height: 70px;

          margin: 0 auto 22px;

          align-items: center;
          justify-content: center;
        }

        .admin-login-mobile-logo img {
          width: 100%;
          height: 100%;

          object-fit: contain;

          display: block;
        }

        /* =====================================================
           HEADING
        ===================================================== */

        .admin-login-heading {
          margin-bottom: 27px;
        }

        .admin-login-eyebrow {
          display: block;

          margin-bottom: 9px;

          color: #2d3195;

          font-size: 0.7rem;

          font-weight: 700;

          letter-spacing: 2.4px;
        }

        .admin-login-heading h2 {
          margin: 0 0 7px;

          color: #1f2340;

          font-family: "Inter", "Segoe UI", Arial, sans-serif;

          font-size: clamp(1.8rem, 3vw, 2.15rem);

          font-weight: 750;

          letter-spacing: -0.8px;
        }

        .admin-login-heading p {
          margin: 0;

          color: #777b89;

          font-size: 0.88rem;

          line-height: 1.6;
        }

        /* =====================================================
           LOGIN CARD
        ===================================================== */

        .admin-login-card {
          position: relative;

          overflow: hidden;

          background: rgba(255, 255, 255, 0.94);

          border: 1px solid #ececf4;

          border-radius: 22px;

          box-shadow:
            0 20px 60px rgba(31, 35, 64, 0.08);
        }

        .admin-login-card-accent {
          width: 100%;
          height: 4px;

          background:
            linear-gradient(
              90deg,
              #2d3195 0%,
              #2d3195 65%,
              #ffb71b 65%,
              #ffb71b 100%
            );
        }

        .admin-login-card-content {
          padding: 31px;
        }

        .admin-login-card-header {
          margin-bottom: 25px;
        }

        .admin-login-card-header h3 {
          margin: 0 0 5px;

          color: #242844;

          font-family: "Inter", "Segoe UI", Arial, sans-serif;

          font-size: 1.18rem;

          font-weight: 700;
        }

        .admin-login-card-header p {
          margin: 0;

          color: #9295a2;

          font-size: 0.79rem;

          line-height: 1.5;
        }

        /* =====================================================
           ERROR
        ===================================================== */

        .admin-login-alert {
          margin: 0 0 21px;

          padding: 12px 14px;

          background: #fff4f4;

          border: 1px solid #ffdede;

          border-radius: 11px;

          color: #c62828;
        }

        .admin-login-alert-title {
          margin-bottom: 2px;

          font-size: 0.78rem;

          font-weight: 700;
        }

        .admin-login-alert-message {
          font-size: 0.76rem;

          line-height: 1.45;
        }

        /* =====================================================
           FORM FIELDS
        ===================================================== */

        .admin-login-field {
          margin-bottom: 20px;
        }

        .admin-login-password-field {
          margin-bottom: 25px;
        }

        .admin-login-field label {
          display: block;

          margin-bottom: 7px;

          color: #45495a;

          font-size: 0.77rem;

          font-weight: 650;
        }

        .admin-login-input-wrap {
          position: relative;
          width: 100%;
        }

        .admin-login-input {
          width: 100%;

          min-height: 48px;

          padding: 12px 14px;

          color: #292d42 !important;

          background: #fafafd !important;

          border: 1.5px solid #e3e4ed !important;

          border-radius: 11px !important;

          box-shadow: none !important;

          font-family: "Inter", "Segoe UI", Arial, sans-serif;

          font-size: 0.82rem !important;

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .admin-login-input::placeholder {
          color: #a5a7b1 !important;
        }

        .admin-login-input:hover {
          border-color: #cfd1df !important;
        }

        .admin-login-input:focus {
          background: #ffffff !important;

          border-color: #2d3195 !important;

          box-shadow:
            0 0 0 3px rgba(45, 49, 149, 0.09) !important;

          outline: none !important;
        }

        .admin-login-password-input {
          padding-right: 66px !important;
        }

        /* =====================================================
           PASSWORD TOGGLE
        ===================================================== */

        .admin-login-password-toggle {
          position: absolute;

          top: 50%;
          right: 13px;

          transform: translateY(-50%);

          padding: 5px 4px;

          color: #2d3195;

          background: transparent;

          border: none;

          font-family: "Inter", "Segoe UI", Arial, sans-serif;

          font-size: 0.7rem;

          font-weight: 700;

          cursor: pointer;

          transition: color 0.2s ease;
        }

        .admin-login-password-toggle:hover {
          color: #1f236f;
        }

        /* =====================================================
           SUBMIT BUTTON
        ===================================================== */

        .admin-login-submit {
          width: 100%;

          min-height: 49px;

          padding: 12px 18px;

          color: #ffffff !important;

          background: #2d3195 !important;

          border: none !important;

          border-radius: 11px !important;

          box-shadow:
            0 8px 20px rgba(45, 49, 149, 0.22);

          font-family: "Inter", "Segoe UI", Arial, sans-serif;

          font-size: 0.82rem !important;

          font-weight: 700 !important;

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .admin-login-submit:hover:not(:disabled) {
          color: #ffffff !important;

          background: #24287d !important;

          transform: translateY(-1px);

          box-shadow:
            0 11px 25px rgba(45, 49, 149, 0.27);
        }

        .admin-login-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .admin-login-submit:disabled {
          opacity: 0.72;

          cursor: not-allowed;
        }

        .admin-login-submit-content {
          display: flex;

          align-items: center;

          justify-content: center;

          gap: 10px;
        }

        .admin-login-arrow {
          font-size: 1rem;

          line-height: 1;
        }

        .admin-login-submit-loading {
          display: flex;

          align-items: center;

          justify-content: center;

          gap: 9px;
        }

        .admin-login-spinner {
          width: 13px;
          height: 13px;

          border: 2px solid rgba(255, 255, 255, 0.35);

          border-top-color: #ffffff;

          border-radius: 50%;

          animation: adminLoginSpin 0.75s linear infinite;
        }

        @keyframes adminLoginSpin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        /* =====================================================
           FOOTER
        ===================================================== */

        .admin-login-footer {
          display: flex;

          align-items: center;

          justify-content: center;

          flex-wrap: wrap;

          gap: 7px;

          margin-top: 22px;

          color: #a0a2ad;

          font-size: 0.68rem;

          text-align: center;
        }

        .admin-login-footer-separator {
          color: #d1d2d9;
        }

        /* =====================================================
           TABLET
        ===================================================== */

        @media (max-width: 991.98px) {
          .admin-login-brand-content {
            padding: 35px;
          }

          .admin-login-logo-wrap {
            width: 100px;
            height: 100px;

            margin-bottom: 25px;
          }

          .admin-login-logo {
            width: 70px;
            height: 70px;
          }

          .admin-login-brand-title {
            font-size: 2.55rem;
          }

          .admin-login-brand-description {
            font-size: 0.9rem;
          }

          .admin-login-form-side {
            padding: 30px;
          }
        }

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 767.98px) {
          .admin-login-page {
            position: relative;

            min-height: 100vh;
            height: auto;

            display: block;

            overflow-y: auto;
          }

          .admin-login-brand {
            min-height: 300px;

            padding: 35px 20px;
          }

          .admin-login-brand-content {
            padding: 20px;
          }

          .admin-login-logo-wrap {
            width: 76px;
            height: 76px;

            margin-bottom: 19px;

            border-radius: 21px;
          }

          .admin-login-logo {
            width: 55px;
            height: 55px;
          }

          .admin-login-brand-title {
            font-size: 2.05rem;
          }

          .admin-login-brand-title span {
            margin-top: 5px;

            font-size: 0.7em;

            letter-spacing: 3px;
          }

          .admin-login-brand-line {
            width: 52px;
            height: 3px;

            margin: 19px auto 17px;
          }

          .admin-login-brand-description {
            max-width: 390px;

            font-size: 0.8rem;

            line-height: 1.6;
          }

          .admin-login-brand-note {
            margin-top: 20px;

            padding: 7px 12px;

            font-size: 0.62rem;
          }

          .admin-login-form-side {
            min-height: calc(100vh - 300px);

            padding: 38px 20px 30px;

            display: flex;
            align-items: flex-start;
          }

          .admin-login-mobile-logo {
            display: flex;
          }

          .admin-login-heading {
            margin-bottom: 23px;

            text-align: center;
          }

          .admin-login-eyebrow {
            font-size: 0.63rem;

            letter-spacing: 2px;
          }

          .admin-login-heading h2 {
            font-size: 1.7rem;
          }

          .admin-login-heading p {
            font-size: 0.8rem;
          }

          .admin-login-card-content {
            padding: 25px 22px;
          }
        }

        /* =====================================================
           SMALL PHONES
        ===================================================== */

        @media (max-width: 420px) {
          .admin-login-brand {
            min-height: 275px;
          }

          .admin-login-brand-title {
            font-size: 1.8rem;
          }

          .admin-login-brand-description {
            font-size: 0.76rem;
          }

          .admin-login-brand-note {
            display: none;
          }

          .admin-login-form-side {
            min-height: calc(100vh - 275px);

            padding: 32px 16px 25px;
          }

          .admin-login-mobile-logo {
            width: 58px;
            height: 58px;

            margin-bottom: 18px;
          }

          .admin-login-heading h2 {
            font-size: 1.55rem;
          }

          .admin-login-card {
            border-radius: 18px;
          }

          .admin-login-card-content {
            padding: 23px 19px;
          }

          .admin-login-input {
            min-height: 46px;

            font-size: 0.78rem !important;
          }

          .admin-login-submit {
            min-height: 47px;
          }
        }

        /* =====================================================
           VERY SMALL PHONES
        ===================================================== */

        @media (max-width: 360px) {
          .admin-login-brand {
            min-height: 255px;
          }

          .admin-login-brand-content {
            padding: 15px;
          }

          .admin-login-logo-wrap {
            width: 66px;
            height: 66px;

            margin-bottom: 15px;
          }

          .admin-login-logo {
            width: 48px;
            height: 48px;
          }

          .admin-login-brand-title {
            font-size: 1.62rem;
          }

          .admin-login-brand-line {
            margin: 15px auto 13px;
          }

          .admin-login-brand-description {
            font-size: 0.7rem;
          }

          .admin-login-form-side {
            min-height: calc(100vh - 255px);

            padding: 27px 13px 22px;
          }

          .admin-login-heading {
            margin-bottom: 19px;
          }

          .admin-login-heading h2 {
            font-size: 1.4rem;
          }

          .admin-login-heading p {
            font-size: 0.74rem;
          }

          .admin-login-card-content {
            padding: 21px 17px;
          }

          .admin-login-card-header {
            margin-bottom: 21px;
          }

          .admin-login-field {
            margin-bottom: 17px;
          }

          .admin-login-password-field {
            margin-bottom: 21px;
          }

          .admin-login-footer {
            font-size: 0.61rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;
