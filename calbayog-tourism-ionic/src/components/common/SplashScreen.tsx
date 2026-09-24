import React, { useState, useEffect, useRef } from "react";

interface Props {
  onComplete: () => void;
  videoUrl?: string;
}

type Phase = "video" | "brand" | "done";

const SplashScreen: React.FC<Props> = ({ onComplete, videoUrl }) => {
  const [phase, setPhase] = useState<Phase>("video");
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [brandVisible, setBrandVisible] = useState(false);
  const [brandOut, setBrandOut] = useState(false);
  const [videoOut, setVideoOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const AUTO_VIDEO_TIMEOUT = 6000;

  /* ── Phase 1: Video ── */
  useEffect(() => {
    if (phase !== "video") return;
    const timer = setTimeout(advanceToSearch, AUTO_VIDEO_TIMEOUT);
    return () => clearTimeout(timer);
  }, [phase]);

  const advanceToSearch = () => {
    setVideoOut(true);
    setTimeout(() => {
      setPhase("brand");
      setBrandVisible(true);
    }, 600);
  };

  /* ── Phase 2: Brand ── */
  const handleExplore = () => {
    setBrandOut(true);
    setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 600);
  };

  /* ── Shared style helpers ── */
  const fullscreen: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  };

  /* ══════════════════════════════════════════
     PHASE 1 — Video Splash
  ══════════════════════════════════════════ */
  if (phase === "video") {
    return (
      <div
        style={{
          ...fullscreen,
          background: "#000",
          opacity: videoOut ? 0 : 1,
          transition: "opacity 0.6s ease",
        }}
      >
        {/* Video */}
        {videoUrl ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            onLoadedData={() => setVideoLoaded(true)}
            onEnded={advanceToSearch}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              position: "absolute",
              inset: 0,
            }}
            src={videoUrl}
          />
        ) : (
          /* Fallback animated poster when no video URL is set */
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(160deg, #0d3d24 0%, #1A7A4A 40%, #0077B6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <div style={{ fontSize: "5rem", animation: "pulse 2s infinite" }}>
              🌿
            </div>
            <div
              style={{
                marginTop: 24,
                width: 60,
                height: 4,
                borderRadius: 4,
                background: "rgba(255,255,255,0.3)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: 4,
                  background: "#F4A226",
                  animation: `fillBar ${AUTO_VIDEO_TIMEOUT}ms linear forwards`,
                }}
              />
            </div>
          </div>
        )}

        {/* Overlay gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.4) 100%)",
          }}
        />

        {/* City badge */}
        <div
          style={{
            position: "absolute",
            top: 48,
            left: 0,
            right: 0,
            textAlign: "center",
            color: "#fff",
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              letterSpacing: 4,
              opacity: 0.7,
              margin: 0,
              fontWeight: 500,
            }}
          >
            WESTERN SAMAR, PHILIPPINES
          </p>
          <h1
            style={{
              fontFamily: "Poppins, serif",
              fontSize: "clamp(1.8rem,6vw,3rem)",
              fontWeight: 700,
              color: "#fff",
              margin: "8px 0 0",
              textShadow: "0 2px 20px rgba(0,0,0,0.5)",
            }}
          >
            Calbayog City
          </h1>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 48,
            left: 0,
            right: 0,
            textAlign: "center",
          }}
        >
          <p
            style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: "0.8rem",
              marginBottom: 16,
            }}
          >
            City of Waterfalls · Pristine Beaches · Vibrant Festivals
          </p>
          <button
            onClick={advanceToSearch}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.4)",
              color: "#fff",
              padding: "8px 24px",
              borderRadius: 100,
              cursor: "pointer",
              fontSize: "0.82rem",
              backdropFilter: "blur(8px)",
              transition: "all 0.2s",
            }}
          >
            Skip ›
          </button>
        </div>

        <style>{`
          @keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.15);opacity:0.85} }
          @keyframes fillBar { from{width:0} to{width:100%} }
        `}</style>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     PHASE 2 — Brand / Welcome Splash
  ══════════════════════════════════════════ */
  if (phase === "brand") {
    return (
      <div
        style={{
          ...fullscreen,
          background:
            "linear-gradient(160deg, #0d3d24 0%, #1A7A4A 45%, #0077B6 100%)",
          padding: "32px 24px",
          opacity: brandOut ? 0 : brandVisible ? 1 : 0,
          transform: brandOut
            ? "scale(1.03)"
            : brandVisible
              ? "scale(1)"
              : "scale(0.97)",
          transition: "opacity 0.55s ease, transform 0.55s ease",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 260,
            height: 260,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -60,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "30%",
            left: -40,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(244,162,38,0.1)",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: 420,
            width: "100%",
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2.5rem",
              margin: "0 auto 20px",
              border: "2px solid rgba(255,255,255,0.25)",
            }}
          >
            🌿
          </div>

          {/* Location */}
          <p
            style={{
              fontSize: "0.72rem",
              letterSpacing: 4,
              color: "rgba(255,255,255,0.7)",
              margin: "0 0 8px",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            WESTERN SAMAR, PHILIPPINES
          </p>

          {/* Headline */}
          <h1
            style={{
              fontFamily: "Poppins, serif",
              fontSize: "clamp(1.6rem, 6vw, 2.4rem)",
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.25,
              margin: "0 0 16px",
              textShadow: "0 2px 16px rgba(0,0,0,0.3)",
            }}
          >
            Mabuhay! Dayun kamo
            <br />
            sa Calbayog! 🌿
          </h1>

          {/* Tagline */}
          <p
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: "0.95rem",
              lineHeight: 1.6,
              margin: "0 0 36px",
            }}
          >
            Discover the city of waterfalls, pristine beaches, and vibrant
            festivals in the heart of Samar Island.
          </p>

          {/* Feature pills */}
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: 40,
            }}
          >
            {["🌊 Waterfalls", "🏖️ Beaches", "🎉 Festivals", "🌿 Nature"].map(
              (tag) => (
                <span
                  key={tag}
                  style={{
                    background: "rgba(255,255,255,0.13)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    color: "#fff",
                    padding: "5px 14px",
                    borderRadius: 100,
                    fontSize: "0.78rem",
                    fontWeight: 500,
                    backdropFilter: "blur(4px)",
                  }}
                >
                  {tag}
                </span>
              ),
            )}
          </div>

          {/* CTA */}
          <button
            onClick={handleExplore}
            style={{
              background: "#F4A226",
              border: "none",
              color: "#fff",
              padding: "14px 40px",
              borderRadius: 100,
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: 700,
              boxShadow: "0 4px 20px rgba(244,162,38,0.5)",
              transition: "all 0.2s",
              letterSpacing: 0.5,
              width: "100%",
              maxWidth: 280,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "translateY(-2px)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "translateY(0)")
            }
          >
            Explore Calbayog →
          </button>

          <p
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "0.72rem",
              marginTop: 16,
            }}
          >
            Tap to continue
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default SplashScreen;
