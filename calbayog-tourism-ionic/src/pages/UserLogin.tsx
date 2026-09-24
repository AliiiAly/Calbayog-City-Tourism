import React, { useState } from "react";
import { Container, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { Link, useHistory, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const UserLogin: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { userLogin } = useAuth();
  const history = useHistory();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const API_URL =
        (import.meta as any).env?.VITE_API_URL || "http://localhost:5000/api";

      if (isLogin) {
        // Login logic - call backend API
        const response = await fetch(`${API_URL}/auth/user/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Login failed");
        }

        userLogin(data.token, data.user);
        history.replace(from);
      } else {
        // Signup logic - call backend API
        const response = await fetch(`${API_URL}/auth/user/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
            name: formData.name,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Signup failed");
        }

        // After successful signup, switch to login tab
        setIsLogin(true);
        setError("");
        // Clear password for security
        setFormData({ ...formData, password: "" });
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)",
        padding: "20px",
        margin: 0,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <Container style={{ maxWidth: "450px" }}>
        <Card
          style={{
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            border: "none",
          }}
        >
          <Card.Body style={{ padding: "2.5rem" }}>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #1a5f4a, #0d3d2e)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                  margin: "0 auto 1rem",
                }}
              >
                🌿
              </div>
              <h2
                style={{
                  fontFamily: "Poppins, serif",
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                }}
              >
                {isLogin ? "Welcome Back" : "Create Account"}
              </h2>
              <p style={{ color: "#6c757d", fontSize: "0.95rem" }}>
                {isLogin
                  ? "Sign in to explore Calbayog"
                  : "Join us to discover hidden gems"}
              </p>
            </div>

            {error && (
              <Alert
                variant="danger"
                dismissible
                onClose={() => setError("")}
                style={{ borderRadius: "8px" }}
              >
                {error}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Username</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  required
                  style={{
                    borderRadius: "8px",
                    padding: "0.75rem 1rem",
                    border: "2px solid #dee2e6",
                  }}
                />
              </Form.Group>

              {!isLogin && (
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    required
                    style={{
                      borderRadius: "8px",
                      padding: "0.75rem 1rem",
                      border: "2px solid #dee2e6",
                    }}
                  />
                </Form.Group>
              )}

              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  style={{
                    borderRadius: "8px",
                    padding: "0.75rem 1rem",
                    border: "2px solid #dee2e6",
                  }}
                />
              </Form.Group>

              <Button
                type="submit"
                variant="primary"
                className="w-100"
                disabled={loading}
                style={{
                  borderRadius: "8px",
                  padding: "0.75rem",
                  fontWeight: 600,
                  background: "linear-gradient(135deg, #1a5f4a, #0d3d2e)",
                  border: "none",
                }}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    {isLogin ? "Signing in..." : "Creating account..."}
                  </>
                ) : isLogin ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </Button>
            </Form>

            <div
              style={{
                textAlign: "center",
                marginTop: "1.5rem",
                paddingTop: "1.5rem",
                borderTop: "1px solid #e9ecef",
              }}
            >
              <p style={{ color: "#6c757d", marginBottom: "0.5rem" }}>
                {isLogin
                  ? "Don't have an account?"
                  : "Already have an account?"}
              </p>
              <Button
                variant="link"
                onClick={() => setIsLogin(!isLogin)}
                style={{
                  color: "#1a5f4a",
                  fontWeight: 600,
                  textDecoration: "none",
                  padding: 0,
                }}
              >
                {isLogin ? "Create Account" : "Sign In"}
              </Button>

              <div
                style={{
                  marginTop: "1rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid #e9ecef",
                }}
              >
                <Link
                  to="/admin/login"
                  style={{
                    color: "#6c757d",
                    fontSize: "0.85rem",
                    textDecoration: "none",
                  }}
                >
                  Admin Panel →
                </Link>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default UserLogin;
