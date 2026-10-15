
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AdminUser } from "../types";

interface LoginModalProps {
  show: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
  onSuccess?: () => void;
}

type LoginView = "login" | "forgot-password" | "verification";

interface VerificationNotice {
  email?: string;
  verifiedAt: number;
}

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://calbayog-city-tourism.onrender.com/api"
).replace(/\/$/, "");

const GMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
const VERIFICATION_STORAGE_KEY = "calbayog_email_verification_success";
const VERIFICATION_NOTICE_MAX_AGE = 10 * 60 * 1000;

const LoginModal: React.FC<LoginModalProps> = ({
  show,
  onClose,
  onSwitchToSignup,
  onSuccess,
}) => {
  const history = useHistory();
  const { userLogin, login } = useAuth();

  const [view, setView] = useState<LoginView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");

  /*
   * Read a recent verification notice.
   *
   * The notice is only used to display the message.
   * The backend still decides whether login is allowed.
   */
  const applyVerificationNotice = (
    rawValue: string | null
  ) => {
    if (!rawValue) return;

    try {
      const notice = JSON.parse(rawValue) as VerificationNotice;

      if (
        !notice ||
        typeof notice.verifiedAt !== "number" ||
        Date.now() - notice.verifiedAt < 0 ||
        Date.now() - notice.verifiedAt > VERIFICATION_NOTICE_MAX_AGE
      ) {
        return;
      }

      const verifiedEmail = (notice.email || "").trim().toLowerCase();

      setError("");
      setPassword("");
      setView("login");
      setSuccess(
        "Email verified successfully! You can now sign in to your account."
      );

      if (verifiedEmail) {
        setEmail(verifiedEmail);
        setVerificationEmail(verifiedEmail);
      }
    } catch (noticeError) {
      console.warn("Unable to read email verification notice.");
    }
  };

  /*
   * Cross-tab notification.
   *
   * The verification page will write the notice to localStorage.
   * The browser fires the storage event in the OTHER open tab.
   */
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === VERIFICATION_STORAGE_KEY && event.newValue) {
        applyVerificationNotice(event.newValue);
      }
    };

    window.addEventListener("storage", handleStorage);

    // Also check when this modal opens, in case verification finished
    // while the modal was closed or this component was not visible.
    if (show) {
      try {
        applyVerificationNotice(
          window.localStorage.getItem(VERIFICATION_STORAGE_KEY)
        );
      } catch {
        // The modal remains usable if browser storage is unavailable.
      }
    }

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [show]);

  /*
   * Reset when closed and manage Escape/body scrolling.
   */
  useEffect(() => {
    if (!show) {
      setError("");
      setSuccess("");
      setLoading(false);
      setPassword("");
      setView("login");
      setShowPassword(false);
      setVerificationEmail("");
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [show, loading, onClose]);

  const isGmail = (value: string): boolean =>
    GMAIL_REGEX.test(value.trim());

  /* =====================================================
     LOGIN
  ===================================================== */

  const handleLogin = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    const normalizedLogin = email.trim();

    if (!normalizedLogin) {
      setError("Please enter your Gmail address, email, or username.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: normalizedLogin,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data?.requiresVerification === true) {
          setVerificationEmail(data?.email || normalizedLogin);
          setView("verification");
          setError(
            data?.message ||
              "Please verify your Gmail address before signing in."
          );
          return;
        }

        throw new Error(
          data?.message ||
            "Unable to log in. Please check your login information and password."
        );
      }

      if (!data?.token || !data?.user) {
        throw new Error(
          "Login succeeded but the server returned incomplete account information."
        );
      }

      const role = data.user.role === "admin" ? "admin" : "user";

      if (role === "admin") {
        const adminSource = data.admin || data.user;

        const mappedAdmin = {
          id: adminSource.id,
          username: adminSource.username || adminSource.email || "",
          name: adminSource.name || "",
          email: adminSource.email || "",
          is_active:
            typeof adminSource.is_active === "boolean"
              ? adminSource.is_active
              : true,
          role: "admin",
        } as AdminUser;

        login(data.token, mappedAdmin);

        setSuccess("Admin login successful!");

        window.setTimeout(() => {
          onClose();
          onSuccess?.();
          history.push("/admin");
        }, 500);

        return;
      }

      const mappedUser = {
        id: data.user.id,
        email: data.user.email || data.user.username || "",
        username: data.user.username || data.user.email || "",
        name: data.user.name || "",
        is_active:
          typeof data.user.is_active === "boolean"
            ? data.user.is_active
            : true,
        role: "user" as const,
        email_verified:
          typeof data.user.email_verified === "boolean"
            ? data.user.email_verified
            : undefined,
      };

      userLogin(mappedUser, data.token);

      setSuccess("Login successful!");

      window.setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 500);
    } catch (err: any) {
      console.error("Login error:", err);
      setError(
        err?.message || "Something went wrong while logging in."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     FORGOT PASSWORD
  ===================================================== */

  const handleForgotPassword = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your Gmail address.");
      return;
    }

    if (!isGmail(normalizedEmail)) {
      setError("Only Gmail addresses ending in @gmail.com are accepted.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/user/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: normalizedEmail }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data?.requiresVerification === true) {
          setVerificationEmail(data?.email || normalizedEmail);
          setView("verification");
          setError(
            data?.message || "Please verify your Gmail address first."
          );
          return;
        }

        throw new Error(
          data?.message ||
            "Unable to process your password reset request."
        );
      }

      setSuccess(
        data?.message ||
          "If an account exists with that Gmail address, a password reset email has been sent."
      );
    } catch (err: any) {
      console.error("Forgot password error:", err);
      setError(
        err?.message ||
          "Something went wrong while requesting a password reset."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     RESEND VERIFICATION
  ===================================================== */

  const handleResendVerification = async () => {
    if (loading) return;

    setError("");
    setSuccess("");

    const normalizedEmail = verificationEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your Gmail address.");
      return;
    }

    if (!isGmail(normalizedEmail)) {
      setError("Only Gmail addresses ending in @gmail.com are accepted.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/user/resend-verification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: normalizedEmail }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to resend the verification email."
        );
      }

      setSuccess(
        data?.message ||
          "A new verification email has been sent. Please check your Gmail inbox."
      );
    } catch (err: any) {
      console.error("Resend verification error:", err);
      setError(
        err?.message ||
          "Something went wrong while resending the verification email."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToSignup = () => {
    if (loading) return;

    setError("");
    setSuccess("");
    setView("login");
    onSwitchToSignup();
  };

  const handleBackToLogin = () => {
    if (loading) return;

    setError("");
    setSuccess("");
    setView("login");
  };

  const handleClose = () => {
    if (!loading) onClose();
  };

  if (!show) return null;

  return (
    <>
      <div
        className="login-modal-backdrop"
        onMouseDown={(event) => {
          if (
            event.target === event.currentTarget &&
            !loading
          ) {
            handleClose();
          }
        }}
      >
        <div
          className="login-modal-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-modal-title"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="login-modal-close"
            onClick={handleClose}
            disabled={loading}
            aria-label="Close login"
          >
            ×
          </button>

          <div className="login-modal-content">
            {view === "login" && (
              <div className="login-view" key="login">
                <img
                  src="/logo2.png"
                  alt="Calbayog City Tourism"
                  className="login-modal-logo"
                />

                <div className="login-modal-eyebrow">
                  Calbayog City Tourism
                </div>

                <h2 id="login-modal-title" className="login-modal-title">
                  Welcome back
                </h2>

                <p className="login-modal-subtitle">
                  Sign in to continue exploring Calbayog City, planning your
                  trip, and saving your memories.
                </p>

                {error && (
                  <div className="login-message login-error" role="alert">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="login-message login-success" role="status">
                    {success}
                  </div>
                )}

                <form onSubmit={handleLogin}>
                  <div className="login-form-group">
                    <label htmlFor="login-email" className="login-form-label">
                      Email or Username
                    </label>
                    <input
                      id="login-email"
                      type="text"
                      className="login-input"
                      placeholder="you@gmail.com or admin username"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setError("");
                      }}
                      autoComplete="username"
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="login-form-group">
                    <label
                      htmlFor="login-password"
                      className="login-form-label"
                    >
                      Password
                    </label>

                    <div className="login-input-wrap">
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        className="login-input login-password-input"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          setError("");
                        }}
                        autoComplete="current-password"
                        disabled={loading}
                        required
                      />

                      <button
                        type="button"
                        className="login-password-toggle"
                        onClick={() =>
                          setShowPassword((previous) => !previous)
                        }
                        disabled={loading}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? "◉" : "○"}
                      </button>
                    </div>
                  </div>

                  <div className="login-forgot">
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setSuccess("");
                        setView("forgot-password");
                      }}
                      disabled={loading}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="login-submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="login-button-loading">
                        <span className="login-spinner" />
                        Signing in...
                      </span>
                    ) : (
                      "Sign in"
                    )}
                  </button>
                </form>

                <div className="login-switch">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={handleSwitchToSignup}
                    disabled={loading}
                  >
                    Create one
                  </button>
                </div>

                <div className="login-security-note">
                  User accounts use Gmail verification and secure password
                  authentication. Admin accounts use their registered admin
                  credentials.
                </div>
              </div>
            )}

            {view === "forgot-password" && (
              <div className="login-view" key="forgot-password">
                <img
                  src="/logo2.png"
                  alt="Calbayog City Tourism"
                  className="login-modal-logo"
                />

                <div className="login-modal-eyebrow">
                  Account Recovery
                </div>

                <h2 className="login-modal-title">Forgot your password?</h2>

                <p className="login-modal-subtitle">
                  Enter your Gmail address and a secure password reset link
                  will be sent to your inbox.
                </p>

                {error && (
                  <div className="login-message login-error" role="alert">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="login-message login-success" role="status">
                    {success}
                  </div>
                )}

                <form onSubmit={handleForgotPassword}>
                  <div className="login-form-group">
                    <label htmlFor="forgot-email" className="login-form-label">
                      Gmail Address
                    </label>
                    <input
                      id="forgot-email"
                      type="email"
                      className="login-input"
                      placeholder="you@gmail.com"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setError("");
                        setSuccess("");
                      }}
                      autoComplete="email"
                      disabled={loading}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="login-submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="login-button-loading">
                        <span className="login-spinner" />
                        Sending...
                      </span>
                    ) : (
                      "Send reset link"
                    )}
                  </button>
                </form>

                <div className="login-back">
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    disabled={loading}
                  >
                    ← Back to sign in
                  </button>
                </div>
              </div>
            )}

            {view === "verification" && (
              <div className="login-verification-view" key="verification">
                <div className="login-verification-icon">✓</div>

                <h2 className="login-verification-title">
                  Verify your Gmail
                </h2>

                <p className="login-verification-text">
                  {error ||
                    "Your Gmail address needs to be verified before you can sign in."}
                </p>

                {success && (
                  <div className="login-message login-success" role="status">
                    {success}
                  </div>
                )}

                <div className="login-form-group">
                  <label
                    htmlFor="verification-email"
                    className="login-form-label"
                  >
                    Gmail Address
                  </label>
                  <input
                    id="verification-email"
                    type="email"
                    className="login-input"
                    placeholder="you@gmail.com"
                    value={verificationEmail}
                    onChange={(event) => {
                      setVerificationEmail(event.target.value);
                      setError("");
                      setSuccess("");
                    }}
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>

                <button
                  type="button"
                  className="login-submit"
                  onClick={handleResendVerification}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="login-button-loading">
                      <span className="login-spinner" />
                      Sending...
                    </span>
                  ) : (
                    "Resend verification email"
                  )}
                </button>

                <div className="login-back">
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    disabled={loading}
                  >
                    ← Back to sign in
                  </button>
                </div>

                <div className="login-security-note">
                  Check your Gmail inbox and spam folder for the verification
                  email.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .login-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 99998;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(10,16,35,.52);
          backdrop-filter: blur(14px) saturate(130%);
          -webkit-backdrop-filter: blur(14px) saturate(130%);
          animation: loginBackdropIn .22s ease-out both;
        }

        @keyframes loginBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .login-modal-card {
          position: relative;
          width: min(100%, 460px);
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          border: 1px solid rgba(255,255,255,.62);
          border-radius: 25px;
          background: rgba(255,255,255,.96);
          box-shadow: 0 32px 90px rgba(10,16,35,.25), 0 8px 30px rgba(45,49,149,.10);
          scrollbar-width: thin;
          animation: loginModalIn .27s cubic-bezier(.2,.8,.2,1) both;
        }

        @keyframes loginModalIn {
          from { opacity: 0; transform: translateY(18px) scale(.965); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .login-modal-card::-webkit-scrollbar { width: 5px; }
        .login-modal-card::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background: rgba(45,49,149,.18);
        }

        .login-modal-close {
          position: absolute;
          top: 16px;
          right: 17px;
          z-index: 3;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(15,23,42,.07);
          border-radius: 12px;
          background: #f5f6fb;
          color: #62677b;
          font-size: 23px;
          line-height: 1;
          cursor: pointer;
          transition: background .18s ease, color .18s ease, transform .2s ease;
        }

        .login-modal-close:hover:not(:disabled) {
          background: #eef0ff;
          color: #2D3195;
          transform: rotate(4deg) scale(1.03);
        }

        .login-modal-close:disabled { opacity: .45; cursor: not-allowed; }

        .login-modal-content { padding: 39px 42px; }

        .login-view, .login-verification-view {
          animation: loginContentIn .23s ease-out both;
        }

        @keyframes loginContentIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-modal-logo {
          width: 64px;
          height: 64px;
          margin-bottom: 19px;
          object-fit: contain;
          transition: transform .25s ease;
        }

        .login-modal-logo:hover { transform: scale(1.04) rotate(-1deg); }

        .login-modal-eyebrow {
          margin-bottom: 7px;
          color: #2D3195;
          font-size: .72rem;
          font-weight: 800;
          letter-spacing: .13em;
          text-transform: uppercase;
        }

        .login-modal-title {
          margin: 0;
          color: #142033;
          font-size: 1.85rem;
          font-weight: 800;
          letter-spacing: -.035em;
          line-height: 1.2;
        }

        .login-modal-subtitle {
          margin: 8px 0 27px;
          color: #687386;
          font-size: .88rem;
          line-height: 1.55;
        }

        .login-form-group { margin-bottom: 17px; }

        .login-form-label {
          display: block;
          margin-bottom: 8px;
          color: #263247;
          font-size: .78rem;
          font-weight: 750;
        }

        .login-input-wrap { position: relative; }

        .login-input {
          width: 100%;
          height: 50px;
          box-sizing: border-box;
          padding: 0 15px;
          border: 1px solid #dfe2ed;
          border-radius: 14px;
          outline: none;
          background: rgba(255,255,255,.78);
          color: #142033;
          font-size: .9rem;
          transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
        }

        .login-input::placeholder { color: #9aa4b2; }

        .login-input:focus {
          border-color: rgba(45,49,149,.48);
          background: #fff;
          box-shadow: 0 0 0 4px rgba(45,49,149,.08);
        }

        .login-input:disabled { opacity: .7; cursor: not-allowed; }
        .login-password-input { padding-right: 55px; }

        .login-password-toggle {
          position: absolute;
          top: 50%;
          right: 7px;
          width: 38px;
          height: 38px;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 10px;
          background: transparent;
          color: #687386;
          cursor: pointer;
          font-size: 16px;
        }

        .login-password-toggle:hover:not(:disabled) {
          background: rgba(45,49,149,.08);
          color: #2D3195;
        }

        .login-password-toggle:disabled { opacity: .5; cursor: not-allowed; }

        .login-forgot {
          display: flex;
          justify-content: flex-end;
          margin-top: -5px;
          margin-bottom: 17px;
        }

        .login-forgot button, .login-back button, .login-switch button {
          padding: 0;
          border: 0;
          background: transparent;
          color: #2D3195;
          font-size: .78rem;
          font-weight: 750;
          cursor: pointer;
        }

        .login-forgot button:hover:not(:disabled),
        .login-back button:hover:not(:disabled),
        .login-switch button:hover:not(:disabled) {
          text-decoration: underline;
        }

        .login-submit {
          width: 100%;
          min-height: 50px;
          border: 1px solid #2D3195;
          border-radius: 14px;
          background: #2D3195;
          color: #fff;
          font-size: .9rem;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 9px 24px rgba(45,49,149,.18);
          transition: background .18s ease, transform .2s ease, box-shadow .2s ease;
        }

        .login-submit:hover:not(:disabled) {
          background: #242875;
          border-color: #242875;
          box-shadow: 0 12px 28px rgba(45,49,149,.25);
          transform: translateY(-1px);
        }

        .login-submit:disabled { opacity: .64; cursor: not-allowed; }

        .login-button-loading {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
        }

        .login-spinner {
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255,255,255,.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: loginSpin .65s linear infinite;
        }

        @keyframes loginSpin { to { transform: rotate(360deg); } }

        .login-message {
          margin-bottom: 17px;
          padding: 13px 14px;
          border-radius: 13px;
          font-size: .8rem;
          line-height: 1.5;
          overflow-wrap: anywhere;
          animation: loginMessageIn .2s ease-out both;
        }

        @keyframes loginMessageIn {
          from { opacity: 0; transform: translateY(-3px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-error {
          border: 1px solid rgba(220,53,69,.16);
          background: rgba(220,53,69,.07);
          color: #c62838;
        }

        .login-success {
          border: 1px solid rgba(25,135,84,.16);
          background: rgba(25,135,84,.07);
          color: #157347;
        }

        .login-switch {
          margin-top: 21px;
          color: #687386;
          font-size: .82rem;
          text-align: center;
        }

        .login-switch button { font: inherit; font-weight: 800; }

        .login-back { margin-top: 18px; text-align: center; }
        .login-back button { color: #687386; font-size: .78rem; font-weight: 700; }
        .login-back button:disabled, .login-forgot button:disabled { opacity: .5; cursor: not-allowed; }

        .login-security-note {
          margin-top: 19px;
          padding-top: 17px;
          border-top: 1px solid rgba(15,23,42,.07);
          color: #8a94a4;
          font-size: .7rem;
          line-height: 1.5;
          text-align: center;
        }

        .login-verification-icon {
          width: 66px;
          height: 66px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          border-radius: 19px;
          background: rgba(255,183,27,.13);
          color: #FFB71B;
          font-size: 29px;
          font-weight: 900;
        }

        .login-verification-title {
          margin: 0 0 10px;
          color: #142033;
          font-size: 1.55rem;
          font-weight: 800;
          text-align: center;
          letter-spacing: -.03em;
        }

        .login-verification-text {
          margin: 0 0 22px;
          color: #687386;
          font-size: .85rem;
          line-height: 1.65;
          text-align: center;
        }

        @media (max-width: 520px) {
          .login-modal-backdrop { padding: 10px; }
          .login-modal-card {
            width: 100%;
            max-height: calc(100vh - 20px);
            border-radius: 21px;
          }
          .login-modal-content { padding: 32px 22px; }
          .login-modal-title { font-size: 1.6rem; }
        }

        @media (prefers-reduced-motion: reduce) {
          .login-modal-backdrop,
          .login-modal-card,
          .login-view,
          .login-verification-view,
          .login-verification-icon,
          .login-message,
          .login-spinner {
            animation: none !important;
          }

          .login-modal-close,
          .login-input,
          .login-password-toggle,
          .login-submit {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default LoginModal;
