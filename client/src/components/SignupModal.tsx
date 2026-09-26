import React, { useEffect, useRef, useState } from "react";

interface SignupModalProps {
  show: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  onSuccess?: () => void;
}

type SignupStatus = "form" | "verification-sent";

const SignupModal: React.FC<SignupModalProps> = ({
  show,
  onClose,
  onSwitchToLogin,
}) => {
  const [status, setStatus] =
    useState<SignupStatus>("form");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [resendMessage, setResendMessage] =
    useState("");

  const resendTimerRef = useRef<number | null>(null);

  /* =========================================================
     API URL
  ========================================================= */

  const API_URL =
    (import.meta as any).env?.VITE_API_URL ||
    "https://calbayog-city-tourism.onrender.com/api";

  /* =========================================================
     CLEANUP
  ========================================================= */

  useEffect(() => {
    return () => {
      if (resendTimerRef.current !== null) {
        window.clearTimeout(resendTimerRef.current);
        resendTimerRef.current = null;
      }
    };
  }, []);

  /* =========================================================
     MODAL LIFECYCLE
  ========================================================= */

  useEffect(() => {
    if (!show) {
      setStatus("form");

      setError("");
      setSuccess("");
      setResendMessage("");

      setLoading(false);
      setResendLoading(false);

      setPassword("");
      setConfirmPassword("");

      setShowPassword(false);
      setShowConfirmPassword(false);

      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        !loading &&
        !resendLoading
      ) {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    const originalOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape,
      );

      document.body.style.overflow =
        originalOverflow;
    };
  }, [
    show,
    loading,
    resendLoading,
    onClose,
  ]);

  /* =========================================================
     GMAIL VALIDATION
  ========================================================= */

  const isGmail = (value: string): boolean => {
    return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(
      value.trim(),
    );
  };

  /* =========================================================
     PASSWORD VALIDATION
  ========================================================= */

  const validatePassword = (
    value: string,
  ): boolean => {
    return value.length >= 8;
  };

  /* =========================================================
     SIGNUP
  ========================================================= */

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setSuccess("");
    setResendMessage("");

    const normalizedName = name.trim();
    const normalizedEmail =
      email.trim().toLowerCase();

    /* ---------------------------------------------------------
       NAME
    --------------------------------------------------------- */

    if (!normalizedName) {
      setError(
        "Please enter your full name.",
      );
      return;
    }

    if (normalizedName.length < 2) {
      setError(
        "Please enter your complete name.",
      );
      return;
    }

    /* ---------------------------------------------------------
       GMAIL
    --------------------------------------------------------- */

    if (!normalizedEmail) {
      setError(
        "Please enter your Gmail address.",
      );
      return;
    }

    if (!isGmail(normalizedEmail)) {
      setError(
        "Only Gmail addresses ending in @gmail.com are accepted.",
      );
      return;
    }

    /* ---------------------------------------------------------
       PASSWORD
    --------------------------------------------------------- */

    if (!password) {
      setError(
        "Please create a password.",
      );
      return;
    }

    if (!validatePassword(password)) {
      setError(
        "Password must contain at least 8 characters.",
      );
      return;
    }

    if (!confirmPassword) {
      setError(
        "Please confirm your password.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Passwords do not match.",
      );
      return;
    }

    setLoading(true);

    try {
      console.log(
        "Creating Calbayog Tourism account...",
      );

      const response = await fetch(
        `${API_URL}/auth/user/signup`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            username: normalizedEmail,
            password,
            name: normalizedName,
          }),
        },
      );

      const data = await response
        .json()
        .catch(() => ({}));

      console.log(
        "Signup response:",
        data,
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to create your account. Please try again.",
        );
      }

      /*
       * IMPORTANT:
       *
       * The backend creates the account but does
       * NOT automatically log the user in.
       *
       * It sends a Gmail verification email.
       *
       * DO NOT call onSuccess() here.
       *
       * The signup modal must remain open and switch
       * to the verification-sent screen.
       */

      setEmail(normalizedEmail);

      setPassword("");
      setConfirmPassword("");

      setShowPassword(false);
      setShowConfirmPassword(false);

      setSuccess(
        data?.message ||
          "Your account has been created. Please check your Gmail and verify your email before signing in.",
      );

      setStatus("verification-sent");
    } catch (err: any) {
      console.error(
        "Signup error:",
        err,
      );

      setError(
        err?.message ||
          "Something went wrong while creating your account.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     RESEND VERIFICATION EMAIL
  ========================================================= */

  const handleResendVerification =
    async () => {
      if (
        resendLoading ||
        loading ||
        !email
      ) {
        return;
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      if (!isGmail(normalizedEmail)) {
        setError(
          "Please enter a valid Gmail address.",
        );
        return;
      }

      setError("");
      setSuccess("");
      setResendMessage("");

      setResendLoading(true);

      try {
        const response = await fetch(
          `${API_URL}/auth/user/resend-verification`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              username:
                normalizedEmail,
            }),
          },
        );

        const data = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to resend the verification email.",
          );
        }

        setResendMessage(
          data?.message ||
            "A new verification email has been sent to your Gmail address.",
        );

        if (resendTimerRef.current !== null) {
          window.clearTimeout(
            resendTimerRef.current,
          );
          resendTimerRef.current = null;
        }

        resendTimerRef.current =
          window.setTimeout(() => {
            setResendMessage("");
            resendTimerRef.current = null;
          }, 7000);
      } catch (err: any) {
        console.error(
          "Resend verification error:",
          err,
        );

        setError(
          err?.message ||
            "Unable to resend the verification email. Please try again.",
        );
      } finally {
        setResendLoading(false);
      }
    };

  /* =========================================================
     SWITCH TO LOGIN
  ========================================================= */

  const handleSwitchToLogin = () => {
    if (
      loading ||
      resendLoading
    ) {
      return;
    }

    setError("");
    setSuccess("");
    setResendMessage("");

    onSwitchToLogin();
  };

  /* =========================================================
     CLOSE
  ========================================================= */

  const handleClose = () => {
    if (
      loading ||
      resendLoading
    ) {
      return;
    }

    onClose();
  };

  /* =========================================================
     HIDDEN
  ========================================================= */

  if (!show) {
    return null;
  }

  /* =========================================================
     EYE ICON
  ========================================================= */

  const EyeIcon = ({
    crossed = false,
  }: {
    crossed?: boolean;
  }) => {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {crossed ? (
          <>
            <path d="M3 3l18 18" />
            <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
            <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c5.05 0 8.27 4.14 9.5 6a17.8 17.8 0 0 1-3.13 3.72" />
            <path d="M6.61 6.61C4.62 7.93 3.25 9.7 2.5 11c1.23 1.86 4.45 6 9.5 6 1.61 0 3.02-.39 4.24-1.01" />
          </>
        ) : (
          <>
            <path d="M2.5 12s3.22-6 9.5-6 9.5 6 9.5 6-3.22 6-9.5 6-9.5-6-9.5-6Z" />
            <circle
              cx="12"
              cy="12"
              r="2.5"
            />
          </>
        )}
      </svg>
    );
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <>
      <style>{`
        .signup-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 24px;

          background: rgba(10, 16, 35, 0.48);

          backdrop-filter:
            blur(14px)
            saturate(125%);

          -webkit-backdrop-filter:
            blur(14px)
            saturate(125%);

          animation:
            signupBackdropIn .22s ease;
        }

        @keyframes signupBackdropIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        .signup-modal-card {
          position: relative;

          width: min(100%, 500px);

          max-height: calc(100vh - 48px);

          overflow-y: auto;

          border:
            1px solid rgba(255, 255, 255, .65);

          border-radius: 28px;

          background:
            rgba(255, 255, 255, .96);

          box-shadow:
            0 30px 90px rgba(15, 23, 42, .25);

          animation:
            signupModalIn .28s
            cubic-bezier(.2,.8,.2,1);
        }

        @keyframes signupModalIn {
          from {
            opacity: 0;

            transform:
              translateY(16px)
              scale(.97);
          }

          to {
            opacity: 1;

            transform:
              translateY(0)
              scale(1);
          }
        }

        .signup-modal-card::-webkit-scrollbar {
          width: 6px;
        }

        .signup-modal-card::-webkit-scrollbar-track {
          background: transparent;
        }

        .signup-modal-card::-webkit-scrollbar-thumb {
          background:
            rgba(45, 49, 149, .18);

          border-radius: 999px;
        }

        html.dark-mode .signup-modal-card {
          border-color:
            rgba(255, 255, 255, .10);

          background:
            rgba(16, 25, 42, .97);

          box-shadow:
            0 30px 90px rgba(0, 0, 0, .48);
        }

        .signup-modal-close {
          position: absolute;

          top: 17px;
          right: 17px;

          z-index: 2;

          width: 38px;
          height: 38px;

          display: flex;
          align-items: center;
          justify-content: center;

          border:
            1px solid rgba(15, 23, 42, .08);

          border-radius: 12px;

          background:
            rgba(255, 255, 255, .72);

          color: #687386;

          cursor: pointer;

          font-size: 20px;

          line-height: 1;

          transition:
            background .18s ease,
            color .18s ease,
            transform .18s ease,
            border-color .18s ease;
        }

        html.dark-mode .signup-modal-close {
          border-color:
            rgba(255, 255, 255, .08);

          background:
            rgba(255, 255, 255, .05);

          color: #aab5c5;
        }

        .signup-modal-close:hover:not(:disabled) {
          background:
            rgba(45, 49, 149, .09);

          border-color:
            rgba(45, 49, 149, .14);

          color:
            #2D3195;

          transform:
            translateY(-1px);
        }

        .signup-modal-close:active:not(:disabled) {
          transform: scale(.94);
        }

        .signup-modal-close:disabled {
          opacity: .5;

          cursor: not-allowed;
        }

        .signup-modal-content {
          padding: 40px 42px;
        }

        .signup-modal-logo {
          width: 60px;
          height: 60px;

          margin-bottom: 18px;

          object-fit: contain;

          display: block;
        }

        .signup-modal-eyebrow {
          margin-bottom: 7px;

          color: #2D3195;

          font-size: .72rem;

          font-weight: 800;

          letter-spacing: .13em;

          text-transform: uppercase;
        }

        .signup-modal-title {
          margin: 0;

          color: #142033;

          font-size: 1.8rem;

          font-weight: 800;

          letter-spacing: -.035em;

          line-height: 1.2;
        }

        html.dark-mode .signup-modal-title {
          color: #f5f8fc;
        }

        .signup-modal-subtitle {
          margin:
            8px 0 25px;

          color: #687386;

          font-size: .87rem;

          line-height: 1.55;
        }

        html.dark-mode .signup-modal-subtitle {
          color: #9aa8ba;
        }

        .signup-form-group {
          margin-bottom: 16px;
        }

        .signup-form-label {
          display: block;

          margin-bottom: 8px;

          color: #263247;

          font-size: .78rem;

          font-weight: 750;
        }

        html.dark-mode .signup-form-label {
          color: #dce3ed;
        }

        .signup-input-wrap {
          position: relative;
        }

        .signup-input {
          width: 100%;

          height: 49px;

          padding:
            0 15px;

          box-sizing: border-box;

          border:
            1px solid rgba(15, 23, 42, .11);

          border-radius: 14px;

          outline: none;

          background:
            rgba(255, 255, 255, .72);

          color: #142033;

          font-size: .89rem;

          transition:
            border-color .18s ease,
            box-shadow .18s ease,
            background .18s ease,
            transform .18s ease;
        }

        html.dark-mode .signup-input {
          border-color:
            rgba(255, 255, 255, .09);

          background:
            rgba(255, 255, 255, .045);

          color: #f5f8fc;
        }

        .signup-input:focus {
          border-color:
            rgba(45, 49, 149, .45);

          background:
            rgba(255, 255, 255, .95);

          box-shadow:
            0 0 0 4px
            rgba(45, 49, 149, .08);
        }

        html.dark-mode .signup-input:focus {
          background:
            rgba(255, 255, 255, .07);
        }

        .signup-input::placeholder {
          color: #9aa4b2;
        }

        .signup-input:disabled {
          opacity: .7;

          cursor: not-allowed;
        }

        .signup-password-input {
          padding-right: 54px;
        }

        .signup-password-toggle {
          position: absolute;

          top: 50%;
          right: 7px;

          width: 38px;
          height: 38px;

          transform:
            translateY(-50%);

          display: flex;
          align-items: center;
          justify-content: center;

          border: 0;

          border-radius: 10px;

          background: transparent;

          color: #687386;

          cursor: pointer;

          transition:
            background .18s ease,
            color .18s ease,
            transform .18s ease;
        }

        .signup-password-toggle:hover:not(:disabled) {
          background:
            rgba(45, 49, 149, .08);

          color:
            #2D3195;
        }

        .signup-password-toggle:active:not(:disabled) {
          transform:
            translateY(-50%)
            scale(.92);
        }

        .signup-password-toggle:disabled {
          opacity: .5;

          cursor: not-allowed;
        }

        .signup-password-hint {
          margin-top: 6px;

          color: #8a94a4;

          font-size: .69rem;
        }

        .signup-message {
          margin-bottom: 17px;

          padding: 13px 14px;

          border-radius: 13px;

          font-size: .8rem;

          line-height: 1.5;

          animation:
            signupMessageIn .2s ease;
        }

        @keyframes signupMessageIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .signup-error {
          border:
            1px solid rgba(220, 53, 69, .16);

          background:
            rgba(220, 53, 69, .07);

          color:
            #c62838;
        }

        html.dark-mode .signup-error {
          border-color:
            rgba(255, 105, 120, .18);

          background:
            rgba(255, 105, 120, .08);

          color:
            #ff9da8;
        }

        .signup-success {
          border:
            1px solid rgba(25, 135, 84, .16);

          background:
            rgba(25, 135, 84, .07);

          color:
            #157347;
        }

        html.dark-mode .signup-success {
          border-color:
            rgba(72, 211, 145, .18);

          background:
            rgba(72, 211, 145, .08);

          color:
            #7be5b3;
        }

        .signup-submit {
          width: 100%;

          height: 50px;

          margin-top: 6px;

          border:
            1px solid #2D3195;

          border-radius: 14px;

          background:
            #2D3195;

          color: #fff;

          font-size: .9rem;

          font-weight: 800;

          cursor: pointer;

          box-shadow:
            0 9px 24px
            rgba(45, 49, 149, .18);

          transition:
            background .18s ease,
            transform .18s ease,
            box-shadow .18s ease;
        }

        .signup-submit:hover:not(:disabled) {
          background:
            #242875;

          box-shadow:
            0 12px 28px
            rgba(45, 49, 149, .25);

          transform:
            translateY(-1px);
        }

        .signup-submit:active:not(:disabled) {
          transform:
            scale(.98);
        }

        .signup-submit:disabled {
          opacity: .65;

          cursor: not-allowed;
        }

        .signup-switch {
          margin-top: 21px;

          color: #687386;

          font-size: .82rem;

          text-align: center;
        }

        html.dark-mode .signup-switch {
          color: #9aa8ba;
        }

        .signup-switch button {
          padding: 0;

          border: 0;

          background: transparent;

          color: #2D3195;

          font: inherit;

          font-weight: 800;

          cursor: pointer;
        }

        .signup-switch button:hover:not(:disabled) {
          text-decoration: underline;
        }

        .signup-switch button:disabled {
          opacity: .5;

          cursor: not-allowed;
        }

        .signup-note {
          margin-top: 18px;

          padding-top: 16px;

          border-top:
            1px solid rgba(15, 23, 42, .07);

          color: #8a94a4;

          font-size: .69rem;

          line-height: 1.5;

          text-align: center;
        }

        html.dark-mode .signup-note {
          border-top-color:
            rgba(255, 255, 255, .07);

          color: #7f8da1;
        }

        /* =====================================================
           VERIFICATION SCREEN
        ===================================================== */

        .signup-verification {
          text-align: center;

          animation:
            signupVerificationIn .3s
            cubic-bezier(.2,.8,.2,1);
        }

        @keyframes signupVerificationIn {
          from {
            opacity: 0;
            transform:
              translateY(10px)
              scale(.985);
          }

          to {
            opacity: 1;
            transform:
              translateY(0)
              scale(1);
          }
        }

        .signup-verification-icon {
          width: 72px;
          height: 72px;

          margin:
            2px auto 20px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 22px;

          background:
            rgba(45, 49, 149, .09);

          color:
            #2D3195;

          box-shadow:
            inset 0 0 0 1px
            rgba(45, 49, 149, .08);
        }

        html.dark-mode
        .signup-verification-icon {
          background:
            rgba(45, 49, 149, .18);

          color:
            #aeb4ff;
        }

        .signup-verification-icon svg {
          width: 34px;
          height: 34px;
        }

        .signup-verification-title {
          margin: 0;

          color: #142033;

          font-size: 1.65rem;

          font-weight: 800;

          letter-spacing: -.035em;

          line-height: 1.2;
        }

        html.dark-mode
        .signup-verification-title {
          color: #f5f8fc;
        }

        .signup-verification-text {
          margin:
            10px auto 0;

          max-width: 390px;

          color: #687386;

          font-size: .87rem;

          line-height: 1.6;
        }

        html.dark-mode
        .signup-verification-text {
          color: #9aa8ba;
        }

        .signup-email-highlight {
          margin:
            18px 0;

          padding:
            13px 15px;

          border:
            1px solid
            rgba(45, 49, 149, .14);

          border-radius: 13px;

          background:
            rgba(45, 49, 149, .055);

          color: #2D3195;

          font-size: .84rem;

          font-weight: 750;

          word-break: break-word;
        }

        html.dark-mode
        .signup-email-highlight {
          border-color:
            rgba(174, 180, 255, .15);

          background:
            rgba(45, 49, 149, .12);

          color:
            #b8bdff;
        }

        .signup-verification-steps {
          margin:
            20px 0;

          padding:
            16px;

          border:
            1px solid
            rgba(15, 23, 42, .07);

          border-radius: 15px;

          background:
            rgba(15, 23, 42, .025);

          text-align: left;
        }

        html.dark-mode
        .signup-verification-steps {
          border-color:
            rgba(255, 255, 255, .07);

          background:
            rgba(255, 255, 255, .025);
        }

        .signup-verification-step {
          display: flex;

          align-items: flex-start;

          gap: 11px;

          color: #5f6c80;

          font-size: .77rem;

          line-height: 1.5;
        }

        .signup-verification-step +
        .signup-verification-step {
          margin-top: 12px;
        }

        html.dark-mode
        .signup-verification-step {
          color: #9aa8ba;
        }

        .signup-verification-step-number {
          flex: 0 0 auto;

          width: 22px;
          height: 22px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background:
            #2D3195;

          color: #fff;

          font-size: .66rem;

          font-weight: 800;
        }

        .signup-resend-message {
          margin-top: 14px;

          color:
            #157347;

          font-size: .76rem;

          line-height: 1.45;

          animation:
            signupMessageIn .2s ease;
        }

        html.dark-mode
        .signup-resend-message {
          color:
            #7be5b3;
        }

        .signup-resend-button {
          width: 100%;

          height: 48px;

          margin-top: 14px;

          border:
            1px solid
            rgba(45, 49, 149, .18);

          border-radius: 13px;

          background:
            rgba(45, 49, 149, .055);

          color:
            #2D3195;

          font-size: .84rem;

          font-weight: 800;

          cursor: pointer;

          transition:
            background .18s ease,
            border-color .18s ease,
            transform .18s ease;
        }

        .signup-resend-button:hover:not(:disabled) {
          background:
            rgba(45, 49, 149, .10);

          border-color:
            rgba(45, 49, 149, .28);

          transform:
            translateY(-1px);
        }

        .signup-resend-button:active:not(:disabled) {
          transform:
            scale(.98);
        }

        .signup-resend-button:disabled {
          opacity: .6;

          cursor: not-allowed;
        }

        .signup-verification-login {
          width: 100%;

          height: 50px;

          margin-top: 10px;

          border:
            1px solid #2D3195;

          border-radius: 14px;

          background:
            #2D3195;

          color: #fff;

          font-size: .88rem;

          font-weight: 800;

          cursor: pointer;

          box-shadow:
            0 9px 24px
            rgba(45, 49, 149, .18);

          transition:
            background .18s ease,
            transform .18s ease,
            box-shadow .18s ease;
        }

        .signup-verification-login:hover:not(:disabled) {
          background:
            #242875;

          box-shadow:
            0 12px 28px
            rgba(45, 49, 149, .25);

          transform:
            translateY(-1px);
        }

        .signup-verification-login:active:not(:disabled) {
          transform:
            scale(.98);
        }

        .signup-verification-login:disabled {
          opacity: .6;

          cursor: not-allowed;
        }

        @media (max-width: 520px) {
          .signup-modal-backdrop {
            padding: 14px;
          }

          .signup-modal-card {
            border-radius: 23px;
          }

          .signup-modal-content {
            padding: 32px 23px;
          }

          .signup-modal-title {
            font-size: 1.6rem;
          }

          .signup-verification-title {
            font-size: 1.5rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .signup-modal-backdrop,
          .signup-modal-card,
          .signup-message,
          .signup-verification {
            animation: none !important;
          }

          .signup-submit,
          .signup-resend-button,
          .signup-verification-login,
          .signup-modal-close,
          .signup-password-toggle,
          .signup-input {
            transition: none !important;
          }
        }
      `}</style>

      <div
        className="signup-modal-backdrop"
        role="presentation"
        onMouseDown={(event) => {
          if (
            event.target ===
              event.currentTarget &&
            !loading &&
            !resendLoading
          ) {
            handleClose();
          }
        }}
      >
        <div
          className="signup-modal-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signup-modal-title"
          onMouseDown={(event) => {
            event.stopPropagation();
          }}
        >
          {/* =================================================
              CLOSE
          ================================================= */}

          <button
            type="button"
            className="signup-modal-close"
            onClick={handleClose}
            disabled={
              loading || resendLoading
            }
            aria-label="Close sign up"
          >
            ×
          </button>

          <div className="signup-modal-content">

            {/* =================================================
                LOGO
            ================================================= */}

            <img
              src="/logo2.png"
              alt="Calbayog City Tourism"
              className="signup-modal-logo"
            />

            <div className="signup-modal-eyebrow">
              Calbayog City Tourism
            </div>

            {/* =================================================
                FORM VIEW
            ================================================= */}

            {status === "form" && (
              <>
                <h2
                  id="signup-modal-title"
                  className="signup-modal-title"
                >
                  Create your account
                </h2>

                <p className="signup-modal-subtitle">
                  Join Calbayog City Tourism
                  and make your travel planning
                  easier.
                </p>

                {error && (
                  <div
                    className="signup-message signup-error"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                {success && (
                  <div
                    className="signup-message signup-success"
                    role="status"
                  >
                    {success}
                  </div>
                )}

                <form
                  onSubmit={handleSubmit}
                  noValidate
                >
                  {/* FULL NAME */}

                  <div className="signup-form-group">
                    <label
                      htmlFor="signup-full-name"
                      className="signup-form-label"
                    >
                      Full Name
                    </label>

                    <input
                      id="signup-full-name"
                      type="text"
                      className="signup-input"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(event) => {
                        setName(
                          event.target.value,
                        );
                        setError("");
                      }}
                      autoComplete="name"
                      disabled={loading}
                      required
                    />
                  </div>

                  {/* GMAIL */}

                  <div className="signup-form-group">
                    <label
                      htmlFor="signup-email"
                      className="signup-form-label"
                    >
                      Gmail Address
                    </label>

                    <input
                      id="signup-email"
                      type="email"
                      className="signup-input"
                      placeholder="you@gmail.com"
                      value={email}
                      onChange={(event) => {
                        setEmail(
                          event.target.value,
                        );
                        setError("");
                      }}
                      autoComplete="email"
                      inputMode="email"
                      spellCheck={false}
                      disabled={loading}
                      required
                    />
                  </div>

                  {/* PASSWORD */}

                  <div className="signup-form-group">
                    <label
                      htmlFor="signup-password"
                      className="signup-form-label"
                    >
                      Password
                    </label>

                    <div className="signup-input-wrap">
                      <input
                        id="signup-password"
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        className="signup-input signup-password-input"
                        placeholder="Create a password"
                        value={password}
                        onChange={(event) => {
                          setPassword(
                            event.target.value,
                          );
                          setError("");
                        }}
                        autoComplete="new-password"
                        disabled={loading}
                        required
                      />

                      <button
                        type="button"
                        className="signup-password-toggle"
                        onClick={() => {
                          setShowPassword(
                            (previous) =>
                              !previous,
                          );
                        }}
                        disabled={loading}
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        aria-pressed={
                          showPassword
                        }
                      >
                        <EyeIcon
                          crossed={
                            !showPassword
                          }
                        />
                      </button>
                    </div>

                    <div className="signup-password-hint">
                      Use at least 8 characters.
                    </div>
                  </div>

                  {/* CONFIRM PASSWORD */}

                  <div className="signup-form-group">
                    <label
                      htmlFor="signup-confirm-password"
                      className="signup-form-label"
                    >
                      Confirm Password
                    </label>

                    <div className="signup-input-wrap">
                      <input
                        id="signup-confirm-password"
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        className="signup-input signup-password-input"
                        placeholder="Re-enter your password"
                        value={
                          confirmPassword
                        }
                        onChange={(event) => {
                          setConfirmPassword(
                            event.target
                              .value,
                          );
                          setError("");
                        }}
                        autoComplete="new-password"
                        disabled={loading}
                        required
                      />

                      <button
                        type="button"
                        className="signup-password-toggle"
                        onClick={() => {
                          setShowConfirmPassword(
                            (previous) =>
                              !previous,
                          );
                        }}
                        disabled={loading}
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        aria-pressed={
                          showConfirmPassword
                        }
                      >
                        <EyeIcon
                          crossed={
                            !showConfirmPassword
                          }
                        />
                      </button>
                    </div>
                  </div>

                  {/* SUBMIT */}

                  <button
                    type="submit"
                    className="signup-submit"
                    disabled={loading}
                  >
                    {loading
                      ? "Creating account..."
                      : "Create account"}
                  </button>
                </form>

                {/* LOGIN SWITCH */}

                <div className="signup-switch">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={
                      handleSwitchToLogin
                    }
                    disabled={loading}
                  >
                    Sign in
                  </button>
                </div>

                <div className="signup-note">
                  A verification email will be
                  sent to your Gmail address before
                  you can sign in.
                </div>
              </>
            )}

            {/* =================================================
                VERIFICATION SENT VIEW
            ================================================= */}

            {status ===
              "verification-sent" && (
              <div
                className="signup-verification"
                aria-live="polite"
              >
                <div
                  className="signup-verification-icon"
                  aria-hidden="true"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="14"
                      rx="2"
                    />

                    <path d="m3 7 9 6 9-6" />

                    <path d="m16.5 14.5 1.5 1.5 3-3" />
                  </svg>
                </div>

                <h2
                  id="signup-modal-title"
                  className="signup-verification-title"
                >
                  Check your Gmail
                </h2>

                <p className="signup-verification-text">
                  Your Calbayog City Tourism
                  account has been created.
                  Verify your email address before
                  signing in.
                </p>

                <div className="signup-email-highlight">
                  {email}
                </div>

                <div className="signup-message signup-success">
                  {success ||
                    "A verification email has been sent to your Gmail address."}
                </div>

                <div className="signup-verification-steps">
                  <div className="signup-verification-step">
                    <span className="signup-verification-step-number">
                      1
                    </span>

                    <span>
                      Open the verification email
                      sent to your Gmail address.
                    </span>
                  </div>

                  <div className="signup-verification-step">
                    <span className="signup-verification-step-number">
                      2
                    </span>

                    <span>
                      Click the{" "}
                      <strong>
                        Verify My Email
                      </strong>{" "}
                      button.
                    </span>
                  </div>

                  <div className="signup-verification-step">
                    <span className="signup-verification-step-number">
                      3
                    </span>

                    <span>
                      After verification, return here
                      and sign in to your account.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="signup-resend-button"
                  onClick={
                    handleResendVerification
                  }
                  disabled={
                    resendLoading ||
                    loading
                  }
                >
                  {resendLoading
                    ? "Sending verification email..."
                    : "Resend verification email"}
                </button>

                {resendMessage && (
                  <div
                    className="signup-resend-message"
                    role="status"
                  >
                    {resendMessage}
                  </div>
                )}

                {error && (
                  <div
                    className="signup-message signup-error"
                    role="alert"
                    style={{
                      marginTop: "14px",
                      marginBottom: 0,
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  className="signup-verification-login"
                  onClick={
                    handleSwitchToLogin
                  }
                  disabled={
                    loading ||
                    resendLoading
                  }
                >
                  Back to Sign In
                </button>

                <div className="signup-note">
                  Check your Spam, Promotions, or
                  Updates folder if the email does
                  not appear in your inbox.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SignupModal;
