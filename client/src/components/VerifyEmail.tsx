import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

const API_URL = (
  (import.meta as any).env?.VITE_API_URL ||
  "https://calbayog-city-tourism.onrender.com/api"
).replace(/\/+$/, "");

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

  const token = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return (params.get("token") || "").trim();
  }, [location.search]);

  useEffect(() => {
    let isActive = true;
    let timedOut = false;

    const controller = new AbortController();

    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 20000);

    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage(
          "This verification link is missing its token. Please request a new verification email."
        );
        return;
      }

      setStatus("verifying");
      setMessage("Verifying your email address...");
      setUser(null);

      try {
        const response = await fetch(
          `${API_URL}/auth/user/verify-email?token=${encodeURIComponent(token)}`,
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

        const data: VerificationResponse =
          await response.json().catch(() => ({}));

        if (!isActive) return;

        const responseMessage = data.message || "";

        const alreadyVerified =
          data.alreadyVerified === true ||
          /already verified/i.test(responseMessage);

        const verifiedSuccessfully =
          data.verified === true ||
          /email (address )?verified successfully|successfully verified/i.test(
            responseMessage
          );

        if (
          response.ok &&
          (verifiedSuccessfully || alreadyVerified)
        ) {
          setUser(data.user || null);

          if (alreadyVerified) {
            setStatus("already-verified");
            setMessage(
              responseMessage ||
                "Your email address has already been verified."
            );
          } else {
            setStatus("success");
            setMessage(
              responseMessage ||
                "Your email address has been verified successfully."
            );
          }

          return;
        }

        if (
          data.expired === true ||
          /token.*expired|verification.*expired|expired.*token/i.test(
            responseMessage
          )
        ) {
          setStatus("expired");
          setMessage(
            responseMessage ||
              "This verification link has expired. Please request a new verification email."
          );
          return;
        }

        setStatus("error");
        setMessage(
          responseMessage ||
            "We could not verify your email address. The link may be invalid or expired."
        );
      } catch (error) {
        if (!isActive) return;

        if (timedOut) {
          setStatus("error");
          setMessage(
            "The verification request took too long. Please try again."
          );
          return;
        }

        if (controller.signal.aborted) return;

        console.error("Email verification error:", error);

        setStatus("error");
        setMessage(
          "Unable to connect to the verification server. Please check your internet connection and try again."
        );
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    void verifyEmail();

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [token]);

  const goToSignIn = () => {
    window.location.assign("/login");
  };

  const retryVerification = () => {
    window.location.reload();
  };

  const isSuccess =
    status === "success" || status === "already-verified";

  return (
    <main className="verify-page">
      <style>{`
        .verify-page {
          box-sizing: border-box;
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          background:
            radial-gradient(circle at top left, rgba(45,49,149,.09), transparent 38%),
            radial-gradient(circle at bottom right, rgba(255,183,27,.12), transparent 36%),
            #f8faff;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: #17213c;
        }

        .verify-page *,
        .verify-page *::before,
        .verify-page *::after {
          box-sizing: border-box;
        }

        .verify-card {
          width: 100%;
          max-width: 560px;
          padding: 42px 34px 32px;
          text-align: center;
          background: rgba(255,255,255,.96);
          border: 1px solid rgba(45,49,149,.12);
          border-radius: 26px;
          box-shadow: 0 24px 65px rgba(27,38,75,.10);
          overflow-wrap: anywhere;
        }

        .verify-logo {
          display: block;
          width: 76px;
          height: 76px;
          object-fit: contain;
          margin: 0 auto 24px;
        }

        .verify-spinner {
          width: 66px;
          height: 66px;
          margin: 0 auto 26px;
          border: 5px solid rgba(45,49,149,.12);
          border-top-color: #2D3195;
          border-radius: 50%;
          animation: verify-spin .85s linear infinite;
        }

        @keyframes verify-spin {
          to { transform: rotate(360deg); }
        }

        .verify-icon {
          width: 78px;
          height: 78px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          border-radius: 50%;
        }

        .verify-icon svg {
          width: 40px;
          height: 40px;
        }

        .verify-icon.success {
          background: rgba(45,49,149,.10);
          color: #2D3195;
        }

        .verify-icon.warning {
          background: rgba(255,183,27,.17);
          color: #a66d00;
        }

        .verify-icon.error {
          background: rgba(220,53,69,.10);
          color: #dc3545;
        }

        .verify-title {
          margin: 0;
          color: #16213d;
          font-size: clamp(1.8rem, 5vw, 2.5rem);
          line-height: 1.15;
          font-weight: 800;
          letter-spacing: -.035em;
        }

        .verify-message {
          max-width: 440px;
          margin: 16px auto 0;
          color: #68758e;
          font-size: 1rem;
          line-height: 1.7;
        }

        .verify-user {
          margin-top: 20px;
          padding: 13px 16px;
          border-radius: 12px;
          background: rgba(45,49,149,.06);
          color: #2D3195;
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .verify-notice {
          margin-top: 24px;
          padding: 15px;
          border-radius: 12px;
          background: #f3f5ff;
          color: #3d4770;
          font-size: .93rem;
          line-height: 1.65;
        }

        .verify-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px;
          margin-top: 26px;
        }

        .verify-button {
          display: inline-flex;
          min-height: 48px;
          align-items: center;
          justify-content: center;
          padding: 13px 22px;
          border: 0;
          border-radius: 12px;
          font: inherit;
          font-size: .96rem;
          font-weight: 750;
          text-decoration: none;
          cursor: pointer;
          transition: transform .18s ease, box-shadow .18s ease;
        }

        .verify-button:hover {
          transform: translateY(-1px);
        }

        .verify-button:focus-visible {
          outline: 3px solid rgba(45,49,149,.35);
          outline-offset: 3px;
        }

        .verify-button.primary {
          color: #fff;
          background: #2D3195;
          box-shadow: 0 7px 20px rgba(45,49,149,.20);
        }

        .verify-button.secondary {
          color: #2D3195;
          background: rgba(45,49,149,.08);
        }

        .verify-brand {
          margin-top: 32px;
        }

        .verify-brand-name {
          margin: 0;
          color: #2D3195;
          font-weight: 800;
        }

        .verify-brand-tagline {
          margin: 5px 0 0;
          color: #78839a;
          font-size: .9rem;
          font-weight: 600;
        }

        @media (max-width: 576px) {
          .verify-page {
            padding: 16px;
          }

          .verify-card {
            padding: 32px 20px 26px;
            border-radius: 20px;
          }

          .verify-logo {
            width: 66px;
            height: 66px;
            margin-bottom: 20px;
          }

          .verify-title {
            font-size: 1.85rem;
          }

          .verify-message {
            font-size: .96rem;
          }

          .verify-actions {
            flex-direction: column;
          }

          .verify-button {
            width: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .verify-spinner {
            animation: none;
          }

          .verify-button {
            transition: none;
          }
        }
      `}</style>

      <section className="verify-card" aria-live="polite">
        <img
          src="/logo2.svg"
          alt="Calbayog City Tourism"
          className="verify-logo"
        />

        {status === "verifying" && (
          <>
            <div
              className="verify-spinner"
              role="status"
              aria-label="Verifying email"
            />

            <h1 className="verify-title">
              Verifying your email
            </h1>

            <p className="verify-message">
              Please wait while we confirm your email address.
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
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
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
              <div className="verify-user">{user.email}</div>
            )}

            <div className="verify-notice">
              You can sign in on this device or return to the device
              where you registered. Email verification is complete;
              signing in is the next step.
            </div>

            <div className="verify-actions">
              <button
                type="button"
                className="verify-button primary"
                onClick={goToSignIn}
              >
                Continue to Sign In
              </button>
            </div>
          </>
        )}

        {status === "expired" && (
          <>
            <div className="verify-icon warning" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            </div>

            <h1 className="verify-title">
              Verification Link Expired
            </h1>

            <p className="verify-message">{message}</p>

            <div className="verify-actions">
              <button
                type="button"
                className="verify-button primary"
                onClick={goToSignIn}
              >
                Go to Sign In
              </button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="verify-icon error" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M15 9l-6 6" />
                <path d="m9 9 6 6" />
              </svg>
            </div>

            <h1 className="verify-title">
              Verification Unsuccessful
            </h1>

            <p className="verify-message">{message}</p>

            <div className="verify-actions">
              <button
                type="button"
                className="verify-button primary"
                onClick={retryVerification}
              >
                Try Again
              </button>

              <button
                type="button"
                className="verify-button secondary"
                onClick={goToSignIn}
              >
                Go to Sign In
              </button>
            </div>
          </>
        )}

        <footer className="verify-brand">
          <p className="verify-brand-name">
            Calbayog City Tourism
          </p>
          <p className="verify-brand-tagline">
            Discover. Explore. Experience.
          </p>
        </footer>
      </section>
    </main>
  );
};

export default VerifyEmail;
