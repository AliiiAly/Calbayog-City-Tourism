import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import {
  Container,
  Card,
  Form,
  Button,
  Alert,
  Row,
  Col,
} from "react-bootstrap";
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
      const res = await loginAdmin({ username, password });
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
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        overflow: "hidden",
      }}
    >
      {/* Left Side - Branded Content with Falls Background */}
      <div
        className="d-none d-md-flex"
        style={{
          flex: "1",
          background: `url('https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80') center/cover no-repeat`,
          position: "relative",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "60px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(135deg, rgba(26, 95, 74, 0.9) 0%, rgba(13, 61, 46, 0.95) 100%)",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            maxWidth: "450px",
          }}
        >
          <div
            style={{
              width: "90px",
              height: "90px",
              borderRadius: "24px",
              background: "linear-gradient(135deg, #ff9f43 0%, #ff6b6b 100%)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2.8rem",
              marginBottom: "28px",
              boxShadow: "0 12px 40px rgba(255, 159, 67, 0.4)",
              animation: "float 3s ease-in-out infinite",
            }}
          >
            🌿
          </div>
          <h1
            style={{
              color: "#fff",
              fontFamily: "Poppins, serif",
              fontSize: "2.8rem",
              fontWeight: 700,
              marginBottom: "12px",
              lineHeight: 1.2,
            }}
          >
            Calbayog City
          </h1>
          <h2
            style={{
              color: "rgba(255, 255, 255, 0.9)",
              fontFamily: "Inter, sans-serif",
              fontSize: "1.3rem",
              fontWeight: 300,
              marginBottom: "20px",
              letterSpacing: "6px",
              textTransform: "uppercase",
            }}
          >
            Tourism
          </h2>
          <div
            style={{
              width: "60px",
              height: "3px",
              background: "linear-gradient(90deg, #ff9f43, #ff6b6b)",
              margin: "0 auto 24px",
              borderRadius: "2px",
            }}
          />
          <p
            style={{
              color: "rgba(255, 255, 255, 0.85)",
              fontSize: "1.1rem",
              lineHeight: 1.8,
              fontWeight: 400,
              marginBottom: "32px",
            }}
          >
            Discover the natural wonders of the
            <br />
            <strong style={{ color: "#ff9f43" }}>
              Waterfall Capital of the Philippines
            </strong>
          </p>
          <div
            style={{
              display: "flex",
              gap: "32px",
              justifyContent: "center",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "2rem",
                  marginBottom: "8px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  padding: "12px",
                  display: "inline-block",
                }}
              >
                🌊
              </div>
              <p
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                }}
              >
                Waterfalls
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "2rem",
                  marginBottom: "8px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  padding: "12px",
                  display: "inline-block",
                }}
              >
                🏖️
              </div>
              <p
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                }}
              >
                Beaches
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "2rem",
                  marginBottom: "8px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  padding: "12px",
                  display: "inline-block",
                }}
              >
                🏛️
              </div>
              <p
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                }}
              >
                Heritage
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Professional Login Form */}
      <div
        style={{
          flex: "1",
          background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          position: "relative",
          overflow: "auto",
        }}
      >
        {/* Decorative Circles */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "250px",
            height: "250px",
            borderRadius: "50%",
            background:
              "linear-gradient(135deg, rgba(26, 95, 74, 0.08) 0%, transparent 100%)",
            animation: "float 8s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            left: "-60px",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background:
              "linear-gradient(135deg, rgba(255, 159, 67, 0.08) 0%, transparent 100%)",
            animation: "float 10s ease-in-out infinite reverse",
          }}
        />

        <div
          style={{
            width: "100%",
            maxWidth: "380px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Header Section - Compact */}
          <div className="text-center mb-4">
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #ff9f43 0%, #ff6b6b 100%)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.6rem",
                marginBottom: "16px",
                boxShadow: "0 12px 30px rgba(255, 159, 67, 0.35)",
              }}
            >
              🌿
            </div>
            <h3
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#1e293b",
                marginBottom: "6px",
              }}
            >
              Admin Portal
            </h3>
            <p
              style={{
                color: "#64748b",
                fontSize: "0.9rem",
                marginBottom: "2px",
              }}
            >
              Calbayog City Tourism Management
            </p>
            <p style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
              Secure access to your dashboard
            </p>
          </div>

          {/* Login Card */}
          <div
            style={{
              background: "#fff",
              borderRadius: "20px",
              padding: "28px",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
              border: "1px solid #f1f5f9",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Top Gradient Line */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: "linear-gradient(90deg, #1a5f4a, #ff9f43)",
                borderRadius: "20px 20px 0 0",
              }}
            />

            <div className="mb-4">
              <h4
                className="fw-bold mb-1"
                style={{
                  color: "#1e293b",
                  fontSize: "1.2rem",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Welcome Back
              </h4>
              <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0 }}>
                Sign in to access your dashboard
              </p>
            </div>

            {error && (
              <Alert
                variant="danger"
                className="mb-3"
                style={{
                  fontSize: "0.8rem",
                  borderRadius: "10px",
                  border: "none",
                  padding: "10px 14px",
                  background: "#fef2f2",
                  color: "#dc2626",
                }}
              >
                <span style={{ fontWeight: 600 }}>
                  ⚠️ Authentication Failed
                </span>
                <br />
                {error}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label
                  className="fw-semibold mb-1"
                  style={{
                    fontSize: "0.85rem",
                    color: "#475569",
                  }}
                >
                  Username
                </Form.Label>
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "1rem",
                      color: "#94a3b8",
                      pointerEvents: "none",
                    }}
                  >
                    👤
                  </div>
                  <Form.Control
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    autoFocus
                    style={{
                      borderRadius: "10px",
                      padding: "12px 16px 12px 42px",
                      border: "2px solid #e2e8f0",
                      fontSize: "0.9rem",
                      transition: "all 0.2s ease",
                      background: "#f8fafc",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#1a5f4a";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 3px rgba(26, 95, 74, 0.1)";
                      e.currentTarget.style.background = "#fff";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.background = "#f8fafc";
                    }}
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label
                  className="fw-semibold mb-1"
                  style={{
                    fontSize: "0.85rem",
                    color: "#475569",
                  }}
                >
                  Password
                </Form.Label>
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "1rem",
                      color: "#94a3b8",
                      pointerEvents: "none",
                    }}
                  >
                    🔒
                  </div>
                  <Form.Control
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    style={{
                      borderRadius: "10px",
                      padding: "12px 48px 12px 42px",
                      border: "2px solid #e2e8f0",
                      fontSize: "0.9rem",
                      transition: "all 0.2s ease",
                      background: "#f8fafc",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#1a5f4a";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 3px rgba(26, 95, 74, 0.1)";
                      e.currentTarget.style.background = "#fff";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.background = "#f8fafc";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      padding: "6px",
                      color: "#94a3b8",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1rem",
                      transition: "all 0.2s",
                      borderRadius: "6px",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.color = "#1a5f4a";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.color = "#94a3b8";
                    }}
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </Form.Group>

              <Button
                type="submit"
                variant="primary"
                className="w-100 fw-semibold"
                disabled={loading}
                style={{
                  background:
                    "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "0.9rem",
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 14px rgba(26, 95, 74, 0.3)",
                  fontWeight: 600,
                  padding: "12px",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 20px rgba(26, 95, 74, 0.4)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 14px rgba(26, 95, 74, 0.3)";
                }}
              >
                {loading ? (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <span style={{ animation: "spin 1s linear infinite" }}>
                      ⏳
                    </span>
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </Form>

            <div className="text-center mt-4">
              <a
                href="/"
                style={{
                  color: "#64748b",
                  textDecoration: "none",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  transition: "color 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = "#1a5f4a";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = "#64748b";
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              >
                ← Return to public website
              </a>
            </div>
          </div>

          {/* Footer */}
          <p
            className="text-center mt-4 mb-0"
            style={{
              color: "#94a3b8",
              fontSize: "0.75rem",
            }}
          >
            © 2024 Calbayog City Tourism
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;
