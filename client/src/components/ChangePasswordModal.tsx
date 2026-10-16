
import React, { useEffect, useState } from "react";
import { changeUserPassword } from "../services/api";

interface ChangePasswordModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  show,
  onClose,
  onSuccess,
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!show) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      setLoading(false);
      setError("");
      setSuccess("");

      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [show, loading, onClose]);

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (loading) return;

    resetMessages();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please complete all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Your new password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Your new passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError(
        "Your new password must be different from your current password.",
      );
      return;
    }

    setLoading(true);

    try {
      const result = await changeUserPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setSuccess(
        result.message || "Your password has been changed successfully.",
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      onSuccess?.();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to change your password. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <div
        className="change-password-backdrop"
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
          className="change-password-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-password-title"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="change-password-close"
            onClick={handleClose}
            disabled={loading}
            aria-label="Close change password modal"
          >
            ×
          </button>

          <div className="change-password-content">
            <img
              src="/logo2.png"
              alt="Calbayog City Tourism"
              className="change-password-logo"
            />

            <div className="change-password-eyebrow">
              Account Security
            </div>

            <h2
              id="change-password-title"
              className="change-password-title"
            >
              Change password
            </h2>

            <p className="change-password-subtitle">
              Keep your account secure by choosing a strong, new password.
            </p>

            {error && (
              <div
                className="change-password-message change-password-error"
                role="alert"
              >
                <span aria-hidden="true">!</span>
                {error}
              </div>
            )}

            {success && (
              <div
                className="change-password-message change-password-success"
                role="status"
              >
                <span aria-hidden="true">✓</span>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="change-password-form-group">
                <label
                  htmlFor="change-current-password"
                  className="change-password-label"
                >
                  Current password
                </label>

                <div className="change-password-input-wrap">
                  <input
                    id="change-current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    className="change-password-input change-password-input-with-toggle"
                    placeholder="Enter your current password"
                    value={currentPassword}
                    onChange={(event) => {
                      setCurrentPassword(event.target.value);
                      resetMessages();
                    }}
                    autoComplete="current-password"
                    disabled={loading}
                    required
                  />

                  <button
                    type="button"
                    className="change-password-toggle"
                    onClick={() =>
                      setShowCurrentPassword((previous) => !previous)
                    }
                    disabled={loading}
                    aria-label={
                      showCurrentPassword
                        ? "Hide current password"
                        : "Show current password"
                    }
                  >
                    {showCurrentPassword ? "◉" : "○"}
                  </button>
                </div>
              </div>

              <div className="change-password-form-group">
                <label
                  htmlFor="change-new-password"
                  className="change-password-label"
                >
                  New password
                </label>

                <div className="change-password-input-wrap">
                  <input
                    id="change-new-password"
                    type={showNewPassword ? "text" : "password"}
                    className="change-password-input change-password-input-with-toggle"
                    placeholder="Create a new password"
                    value={newPassword}
                    onChange={(event) => {
                      setNewPassword(event.target.value);
                      resetMessages();
                    }}
                    autoComplete="new-password"
                    minLength={8}
                    disabled={loading}
                    required
                  />

                  <button
                    type="button"
                    className="change-password-toggle"
                    onClick={() =>
                      setShowNewPassword((previous) => !previous)
                    }
                    disabled={loading}
                    aria-label={
                      showNewPassword
                        ? "Hide new password"
                        : "Show new password"
                    }
                  >
                    {showNewPassword ? "◉" : "○"}
                  </button>
                </div>

                <p className="change-password-hint">
                  Use at least 8 characters.
                </p>
              </div>

              <div className="change-password-form-group">
                <label
                  htmlFor="change-confirm-password"
                  className="change-password-label"
                >
                  Confirm new password
                </label>

                <div className="change-password-input-wrap">
                  <input
                    id="change-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    className="change-password-input change-password-input-with-toggle"
                    placeholder="Enter your new password again"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      resetMessages();
                    }}
                    autoComplete="new-password"
                    minLength={8}
                    disabled={loading}
                    required
                  />

                  <button
                    type="button"
                    className="change-password-toggle"
                    onClick={() =>
                      setShowConfirmPassword((previous) => !previous)
                    }
                    disabled={loading}
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirmation password"
                        : "Show confirmation password"
                    }
                  >
                    {showConfirmPassword ? "◉" : "○"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="change-password-submit"
                disabled={loading}
              >
                {loading ? (
                  <span className="change-password-loading">
                    <span className="change-password-spinner" />
                    Updating password...
                  </span>
                ) : (
                  "Update password"
                )}
              </button>

              <button
                type="button"
                className="change-password-cancel"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
            </form>

            <div className="change-password-security-note">
              <span aria-hidden="true">🔒</span>
              Your password is updated securely through your authenticated
              account.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .change-password-backdrop {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(10, 16, 35, .52);
          backdrop-filter: blur(14px) saturate(130%);
          -webkit-backdrop-filter: blur(14px) saturate(130%);
          animation: changePasswordBackdropIn .22s ease-out both;
        }

        @keyframes changePasswordBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .change-password-card {
          position: relative;
          width: min(100%, 460px);
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          border: 1px solid rgba(255, 255, 255, .62);
          border-radius: 25px;
          background: rgba(255, 255, 255, .97);
          box-shadow:
            0 32px 90px rgba(10, 16, 35, .25),
            0 8px 30px rgba(45, 49, 149, .10);
          scrollbar-width: thin;
          scrollbar-color: rgba(45, 49, 149, .25) transparent;
          animation: changePasswordModalIn .27s cubic-bezier(.2, .8, .2, 1) both;
        }

        @keyframes changePasswordModalIn {
          from {
            opacity: 0;
            transform: translateY(18px) scale(.965);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .change-password-card::-webkit-scrollbar {
          width: 5px;
        }

        .change-password-card::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background: rgba(45, 49, 149, .18);
        }

        .change-password-close {
          position: absolute;
          top: 16px;
          right: 17px;
          z-index: 3;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(15, 23, 42, .07);
          border-radius: 12px;
          background: #f5f6fb;
          color: #62677b;
          font-size: 23px;
          line-height: 1;
          cursor: pointer;
          transition:
            background .18s ease,
            color .18s ease,
            transform .2s ease;
        }

        .change-password-close:hover:not(:disabled) {
          background: #eef0ff;
          color: #2D3195;
          transform: rotate(4deg) scale(1.03);
        }

        .change-password-close:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        .change-password-content {
          padding: 35px 42px 30px;
        }

        .change-password-logo {
          width: 60px;
          height: 60px;
          margin-bottom: 15px;
          object-fit: contain;
          transition: transform .25s ease;
        }

        .change-password-logo:hover {
          transform: scale(1.04) rotate(-1deg);
        }

        .change-password-eyebrow {
          margin-bottom: 7px;
          color: #2D3195;
          font-size: .72rem;
          font-weight: 800;
          letter-spacing: .13em;
          text-transform: uppercase;
        }

        .change-password-title {
          margin: 0;
          color: #142033;
          font-size: 1.8rem;
          font-weight: 800;
          letter-spacing: -.035em;
          line-height: 1.2;
        }

        .change-password-subtitle {
          margin: 8px 0 23px;
          color: #687386;
          font-size: .88rem;
          line-height: 1.55;
        }

        .change-password-form-group {
          margin-bottom: 16px;
        }

        .change-password-label {
          display: block;
          margin-bottom: 8px;
          color: #263247;
          font-size: .78rem;
          font-weight: 750;
        }

        .change-password-input-wrap {
          position: relative;
        }

        .change-password-input {
          width: 100%;
          height: 49px;
          box-sizing: border-box;
          padding: 0 15px;
          border: 1px solid #dfe2ed;
          border-radius: 14px;
          outline: none;
          background: rgba(255, 255, 255, .85);
          color: #142033;
          font-size: .86rem;
          transition:
            border-color .18s ease,
            box-shadow .18s ease,
            background .18s ease;
        }

        .change-password-input-with-toggle {
          padding-right: 55px;
        }

        .change-password-input::placeholder {
          color: #9aa4b2;
        }

        .change-password-input:focus {
          border-color: rgba(45, 49, 149, .48);
          background: #fff;
          box-shadow: 0 0 0 4px rgba(45, 49, 149, .08);
        }

        .change-password-input:disabled {
          opacity: .7;
          cursor: not-allowed;
        }

        .change-password-toggle {
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

        .change-password-toggle:hover:not(:disabled) {
          background: rgba(45, 49, 149, .08);
          color: #2D3195;
        }

        .change-password-toggle:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .change-password-hint {
          margin: 7px 0 0;
          color: #8a94a4;
          font-size: .72rem;
        }

        .change-password-submit {
          width: 100%;
          min-height: 50px;
          margin-top: 5px;
          border: 1px solid #2D3195;
          border-radius: 14px;
          background: #2D3195;
          color: #fff;
          font-size: .9rem;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 9px 24px rgba(45, 49, 149, .18);
          transition:
            background .18s ease,
            transform .2s ease,
            box-shadow .2s ease;
        }

        .change-password-submit:hover:not(:disabled) {
          background: #242875;
          border-color: #242875;
          box-shadow: 0 12px 28px rgba(45, 49, 149, .25);
          transform: translateY(-1px);
        }

        .change-password-submit:disabled {
          opacity: .64;
          cursor: not-allowed;
        }

        .change-password-cancel {
          width: 100%;
          min-height: 43px;
          margin-top: 8px;
          border: 1px solid #e5e7ef;
          border-radius: 13px;
          background: #fff;
          color: #687386;
          font-size: .84rem;
          font-weight: 750;
          cursor: pointer;
          transition:
            background .18s ease,
            border-color .18s ease,
            color .18s ease;
        }

        .change-password-cancel:hover:not(:disabled) {
          border-color: #d5d9e8;
          background: #f7f8fc;
          color: #2D3195;
        }

        .change-password-cancel:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .change-password-loading {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
        }

        .change-password-spinner {
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255, 255, 255, .35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: changePasswordSpin .65s linear infinite;
        }

        @keyframes changePasswordSpin {
          to { transform: rotate(360deg); }
        }

        .change-password-message {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin-bottom: 17px;
          padding: 12px 14px;
          border-radius: 13px;
          font-size: .8rem;
          line-height: 1.5;
          overflow-wrap: anywhere;
          animation: changePasswordMessageIn .2s ease-out both;
        }

        @keyframes changePasswordMessageIn {
          from {
            opacity: 0;
            transform: translateY(-3px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .change-password-error {
          border: 1px solid rgba(220, 53, 69, .16);
          background: rgba(220, 53, 69, .07);
          color: #c62838;
        }

        .change-password-success {
          border: 1px solid rgba(25, 135, 84, .16);
          background: rgba(25, 135, 84, .07);
          color: #157347;
        }

        .change-password-message > span {
          flex: 0 0 auto;
          font-weight: 900;
        }

        .change-password-security-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid rgba(15, 23, 42, .07);
          color: #8a94a4;
          font-size: .7rem;
          line-height: 1.5;
          text-align: center;
        }

        @media (max-width: 520px) {
          .change-password-backdrop {
            padding: 10px;
          }

          .change-password-card {
            width: 100%;
            max-height: calc(100vh - 20px);
            border-radius: 21px;
          }

          .change-password-content {
            padding: 31px 22px 25px;
          }

          .change-password-title {
            font-size: 1.6rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .change-password-backdrop,
          .change-password-card,
          .change-password-logo,
          .change-password-message,
          .change-password-spinner {
            animation: none !important;
          }

          .change-password-close,
          .change-password-input,
          .change-password-submit,
          .change-password-cancel {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default ChangePasswordModal;
