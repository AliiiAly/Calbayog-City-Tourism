import React, { useState, useRef } from "react";

interface Props {
  onComplete: () => void;
  videoUrl?: string;
}

const RESPONSIVE_CSS = `
  .splash-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 99999;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    overflow: hidden;
    font-family: 'Poppins', 'Segoe UI', system-ui, sans-serif;
    cursor: pointer;
  }

  .splash-video-root {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #000;
  }

  .splash-video-root.fade-out {
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease;
  }

  .splash-video-el {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .splash-video-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      to bottom,
      rgba(0,0,0,0.3) 0%,
      transparent 30%,
      transparent 60%,
      rgba(0,0,0,0.6) 100%
    );
    z-index: 1;
  }

  .splash-video-top {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 20px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 3;
  }

  .splash-video-brand {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .splash-video-brand-icon {
    font-size: 1.4rem;
  }

  .splash-video-brand-text {
    color: #fff;
    font-size: 1rem;
    font-weight: 700;
    text-shadow: 0 2px 8px rgba(0,0,0,0.5);
  }

  .splash-video-brand-tagline {
    margin: 4px 0 0;
    font-size: 0.7rem;
    color: rgba(255,255,255,0.75);
    font-style: italic;
    text-shadow: 0 1px 6px rgba(0,0,0,0.4);
  }

  .splash-video-bottom {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 28px 20px 24px;
    z-index: 3;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .splash-title-image {
    width: 100%;
    max-width: 480px;
    height: auto;
    margin: 0 0 12px;
    filter: drop-shadow(0 4px 16px rgba(0,0,0,0.4));
  }

  .splash-video-tagline {
    font-size: clamp(0.7rem, 2vw, 0.85rem);
    letter-spacing: 3px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.75);
    margin: 0 0 16px;
    font-weight: 500;
    text-shadow: 0 1px 8px rgba(0,0,0,0.4);
  }

  .splash-video-progress {
    width: 80%;
    max-width: 200px;
    height: 3px;
    background: rgba(255,255,255,0.2);
    border-radius: 2px;
    margin: 12px auto 0;
    overflow: hidden;
  }

  .splash-video-progress-bar {
    height: 100%;
    background: #F4A226;
    border-radius: 2px;
    animation: splash-progress 6s linear forwards;
  }

  .splash-tap-hint {
    margin-top: 16px;
    color: rgba(255,255,255,0.55);
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 1px;
    text-transform: uppercase;
    animation: splash-pulse 1.8s ease-in-out infinite;
  }

  @keyframes splash-pulse {
    0%, 100% {
      opacity: 0.4;
    }

    50% {
      opacity: 0.9;
    }
  }

  @keyframes splash-progress {
    0% {
      width: 0%;
    }

    100% {
      width: 100%;
    }
  }

  @media (max-width: 380px) {
    .splash-video-brand-icon {
      font-size: 1.1rem;
    }

    .splash-video-brand-text {
      font-size: 0.85rem;
    }

    .splash-video-brand-tagline {
      font-size: 0.62rem;
    }

    .splash-video-bottom {
      padding: 20px 14px 18px;
    }

    .splash-title-image {
      max-width: 300px;
      margin-bottom: 8px;
    }

    .splash-video-tagline {
      letter-spacing: 2px;
    }

    .splash-video-progress {
      max-width: 140px;
    }

    .splash-tap-hint {
      font-size: 0.62rem;
      margin-top: 12px;
    }
  }

  @media (min-width: 769px) {
    .splash-video-brand-icon {
      font-size: 1.8rem;
    }

    .splash-video-brand-text {
      font-size: 1.2rem;
    }

    .splash-video-brand-tagline {
      font-size: 0.85rem;
    }

    .splash-video-bottom {
      padding: 48px 36px 40px;
    }

    .splash-title-image {
      max-width: 560px;
    }

    .splash-video-progress {
      max-width: 240px;
    }

    .splash-tap-hint {
      font-size: 0.8rem;
      margin-top: 20px;
    }
  }

  @media (max-height: 500px) {
    .splash-video-top {
      padding: 8px 16px;
    }

    .splash-video-brand-icon {
      font-size: 1rem;
    }

    .splash-video-brand-text {
      font-size: 0.85rem;
    }

    .splash-video-brand-tagline {
      font-size: 0.6rem;
    }

    .splash-video-bottom {
      padding: 12px 16px 10px;
    }

    .splash-title-image {
      max-width: 260px;
      margin-bottom: 6px;
    }

    .splash-video-tagline {
      font-size: 0.6rem;
      margin-bottom: 6px;
    }

    .splash-tap-hint {
      margin-top: 8px;
      font-size: 0.58rem;
    }
  }

  @supports (padding-top: env(safe-area-inset-top)) {
    .splash-video-top {
      padding-top: max(20px, env(safe-area-inset-top));
    }

    .splash-video-bottom {
      padding-bottom: max(24px, env(safe-area-inset-bottom));
    }
  }
`;

const SplashScreen: React.FC<Props> = ({ onComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [completed, setCompleted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoSrc = "/promo.mp4";

  const handleContinue = () => {
    if (completed) return;

    setCompleted(true);

    if (videoRef.current) {
      videoRef.current.pause();
    }

    /*
     * Start a very short fade.
     *
     * The old version waited 600ms before calling onComplete,
     * which caused the white screen to become visible underneath.
     *
     * This version only uses a short 250ms transition.
     */
    setFadeOut(true);

    requestAnimationFrame(() => {
      setTimeout(() => {
        onComplete();
      }, 250);
    });
  };

  return (
    <>
      <style>{RESPONSIVE_CSS}</style>

      <div
        className={`splash-screen splash-video-root${
          fadeOut ? " fade-out" : ""
        }`}
        onClick={handleContinue}
      >
        <video
          ref={videoRef}
          className="splash-video-el"
          autoPlay
          muted
          playsInline
          preload="auto"
          onEnded={handleContinue}
        >
          <source
            src={videoSrc}
            type="video/mp4"
          />
        </video>

        <div className="splash-video-overlay" />

        <div className="splash-video-bottom">
          <img
            src="/dayun-kamo-calbayog.png"
            alt="Dayun kamo sa Calbayog"
            className="splash-title-image"
          />

          <p className="splash-video-tagline">
            Western Samar, Philippines
          </p>

          <div className="splash-video-progress">
            <div className="splash-video-progress-bar" />
          </div>

          <p className="splash-tap-hint">
            Tap anywhere to continue
          </p>
        </div>
      </div>
    </>
  );
};

export default SplashScreen;