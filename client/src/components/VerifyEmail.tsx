import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

const API_URL = (
  (import.meta as any).env?.VITE_API_URL ||
  "https://calbayog-city-tourism.onrender.com/api"
).replace(/\/$/, "");

type VerificationStatus =
  | "verifying"
  | "success"
  | "already-verified"
  | "expired"
  | "error";

interface VerifiedUser {
  id?: string;
  username?: string;
  email?: string;
  name?: string;
}

interface VerificationResponse {
  message?: string;
  verified?: boolean;
  alreadyVerified?: boolean;
  expired?: boolean;
  user?: VerifiedUser;
}

const VerifyEmail: React.FC = () => {
  const location = useLocation();

  const [status, setStatus] =
    useState<VerificationStatus>("verifying");

  const [message, setMessage] = useState(
    "Verifying your email address..."
  );

  const [user, setUser] = useState<VerifiedUser | null>(null);

  // Prevent duplicate handling of the same token during development
  // and React 18 StrictMode.
  const handledTokensRef = useRef<Set<string>>(new Set());

  const token = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return (params.get("token") || "").trim();
  }, [location.search]);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage(
        "This verification link is missing a valid verification token."
      );
      return;
    }

    // We intentionally allow the backend to respond with
    // "already verified", but avoid repeatedly processing
    // the exact same token in this component instance.
    if (handledTokensRef.current.has(token)) {
      return;
    }

    handledTokensRef.current.add(token);

    const controller = new AbortController();

    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, 12000);

    const verifyEmail = async () => {
      try {
        setStatus("verifying");
        setMessage("Verifying your email address...");

        const response = await fetch(
          `${API_URL}/auth/user/verify-email?token=${encodeURIComponent(
            token
          )}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Cache-Control": "no-cache",
            },
            cache: "no-store",
            signal: controller.signal,
          }
        );

        let data: VerificationResponse = {};

        try {
          data = await response.json();
        } catch {
          data = {};
        }

        if (controller.signal.aborted) {
          return;
        }

        if (response.ok && data.verified === true) {
          setUser(data.user || null);

          const isAlreadyVerified =
            data.alreadyVerified === true ||
            /already verified/i.test(data.message || "");

          if (isAlreadyVerified) {
            setStatus("already-verified");
            setMessage(
              data.message ||
                "Your email address is already verified."
            );
          } else {
            setStatus("success");
            setMessage(
              data.message ||
                "Your email address has been verified successfully."
            );
          }

          return;
        }

        if (response.status === 400 && data.expired) {
          setStatus("expired");
          setMessage(
            data.message ||
              "This verification link has expired. Please request a new verification email."
          );
          return;
        }

        setStatus("error");
        setMessage(
          data.message ||
            "We could not complete your email verification."
        );
      } catch (error: any) {
        if (controller.signal.aborted) {
          setStatus("error");
          setMessage(
            "The verification request took too long. Please try again."
          );
          return;
        }

        console.error("Email verification error:", error);

        setStatus("error");
        setMessage(
          "Unable to connect to the verification server. Please try again."
        );
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    verifyEmail();

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [token]);

  // Opens the existing login modal in the current website tab.
  const handleOpenLogin = () => {
    window.dispatchEvent(new Event("open-login-modal"));
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  const handleTryAgain = () => {
    window.location.reload();
  };

  const isSuccess =
    status === "success" || status === "already-verified";

  return (
    <div className="verify-page">
      <style>{`
        .verify-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
          background:
            radial-gradient(
              circle at top left,
              rgba(45, 49, 149, 0.08),
              transparent 38%
            ),
            radial-gradient(
              circle at bottom right,
              rgba(255, 183, 27, 0.09),
              transparent 36%
            ),
            #f8faff;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          color: #17213c;
        }

        .verify-card {
          width: min(100%, 650px);
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(45, 49, 149, 0.12);
          border-radius: 28px;
          padding: 48px 34px 42px;
          text-align: center;
          box-shadow:
            0 25px 70px rgba(27, 38, 75, 0.10),
            0 8px 24px rgba(27, 38, 75, 0.05);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .verify-logo {
          width: 78px;
          height: 78px;
          object-fit: contain;
          margin-bottom: 24px;
        }

        .verify-icon {
          width: 86px;
          height: 86px;
          margin: 0 auto 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .verify-icon.success {
          background: rgba(45, 49, 149, 0.10);
          color: #2D3195;
        }

        .verify-icon.warning {
          background: rgba(255, 183, 27, 0.14);
          color: #d68e00;
        }

        .verify-icon.error {
          background: rgba(220, 53, 69, 0.10);
          color: #dc3545;
        }

        .verify-icon svg {
          width: 42px;
          height: 42px;
        }

        .spinner {
          width: 72px;
          height: 72px;
          margin: 0 auto 30px;
          border-radius: 50%;
          border: 4px solid rgba(45, 49, 149, 0.12);
          border-top-color: #2D3195;
          animation: spin 0.9s linear infinite;
          position: relative;
        }

        .spinner::after {
          content: "";
          position: absolute;
          width: 9px;
          height: 9px;
          background: #FFB71B;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .verify-title {
          margin: 0;
          font-size: clamp(2rem, 5vw, 3rem);
          line-height: 1.08;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: #16213d;
        }

        .verify-message {
          margin: 14px auto 0;
          max-width: 500px;
          color: #6c7892;
          font-size: 1.05rem;
          line-height: 1.7;
        }

        .verify-user {
          margin-top: 22px;
          padding: 14px 18px;
          border-radius: 14px;
          background: rgba(45, 49, 149, 0.06);
          color: #2D3195;
          font-weight: 700;
        }

        .verify-actions {
          margin-top: 30px;
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .verify-button {
          border: 0;
          border-radius: 12px;
          padding: 13px 20px;
          font-size: 0.96rem;
          font-weight: 700;
          cursor: pointer;
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            opacity 0.18s ease;
        }

        .verify-button:hover {
          transform: translateY(-1px);
        }

        .verify-button.primary {
          color: #fff;
          background: #2D3195;
          box-shadow: 0 8px 22px rgba(45, 49, 149, 0.22);
        }

        .verify-button.primary:hover {
          box-shadow: 0 12px 28px rgba(45, 49, 149, 0.28);
        }

        .verify-button.secondary {
          color: #2D3195;
          background: rgba(45, 49, 149, 0.08);
        }

        .verify-button.warning-button {
          color: #6b4700;
          background: rgba(255, 183, 27, 0.16);
        }

        .verify-brand {
          margin-top: 34px;
        }

        .verify-brand-name {
          margin: 0;
          font-weight: 800;
          color: #2D3195;
        }

        .verify-brand-tagline {
          margin: 4px 0 0;
          color: #6f7a91;
          font-weight: 600;
          font-size: 0.92rem;
        }

        @media (max-width: 576px) {
          .verify-page {
            padding: 18px;
          }

          .verify-card {
            padding: 38px 22px 32px;
            border-radius: 22px;
          }

          .verify-title {
            font-size: 2rem;
          }
        }
      `}</style>

      <div className="verify-card">
        <img
          src="/logo2.svg"
          alt="Calbayog City Tourism"
          className="verify-logo"
        />

        {status === "verifying" && (
          <>
            <div className="spinner" aria-hidden="true" />

            <h1 className="verify-title">
              Verifying your email
            </h1>

            <p className="verify-message">
              {message}
            </p>

            <p className="verify-message">
              Please wait while the verification request is being
              processed.
            </p>
          </>
        )}

        {isSuccess && (
          <>
            <div
              className={`verify-icon ${
                status === "already-verified"
                  ? "warning"
                  : "success"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {status === "already-verified" ? (
                  <>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v4" />
                    <path d="M12 16h.01" />
                  </>
                ) : (
                  <>
                    <circle cx="12" cy="12" r="9" />
                    <path d="m8 12 2.5 2.5L16 9" />
                  </>
                )}
              </svg>
            </div>

            <h1 className="verify-title">
              {status === "already-verified"
                ? "Email Already Verified"
                : "Email Verified Successfully!"}
            </h1>

            <p className="verify-message">
              {status === "already-verified"
                ? message
                : "Your email address has been verified successfully. You can now sign in to your account."}
            </p>

            {user?.email && (
              <div className="verify-user">
                {user.email}
              </div>
            )}

            <div className="verify-actions">
              <button
                type="button"
                className="verify-button primary"
                onClick={handleOpenLogin}
              >
                Sign in to your account
              </button>

              <button
                type="button"
                className="verify-button secondary"
                onClick={handleGoHome}
              >
                Go to Home
              </button>
            </div>
          </>
        )}

        {status === "expired" && (
          <>
            <div className="verify-icon warning">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            </div>

            <h1 className="verify-title">
              Verification Link Expired
            </h1>

            <p className="verify-message">
              {message}
            </p>

            <div className="verify-actions">
              <button
                type="button"
                className="verify-button primary"
                onClick={handleOpenLogin}
              >
                Return to Login
              </button>

              <button
                type="button"
                className="verify-button secondary"
                onClick={handleGoHome}
              >
                Go to Home
              </button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="verify-icon error">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M15 9l-6 6" />
                <path d="m9 9 6 6" />
              </svg>
            </div>

            <h1 className="verify-title">
              Verification Unsuccessful
            </h1>

            <p className="verify-message">
              {message}
            </p>

            <div className="verify-actions">
              <button
                type="button"
                className="verify-button primary"
                onClick={handleTryAgain}
              >
                Try Again
              </button>

              <button
                type="button"
                className="verify-button secondary"
                onClick={handleGoHome}
              >
                Go to Home
              </button>
            </div>
          </>
        )}

        <div className="verify-brand">
          <p className="verify-brand-name">
            Calbayog City Tourism
          </p>

          <p className="verify-brand-tagline">
            Discover. Explore. Experience.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
