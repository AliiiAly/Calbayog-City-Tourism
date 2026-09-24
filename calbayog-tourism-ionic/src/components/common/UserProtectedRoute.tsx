import React, { useState, useEffect } from "react";
import { Redirect, useLocation } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";

interface UserProtectedRouteProps {
  children: React.ReactNode;
}

const UserProtectedRoute: React.FC<UserProtectedRouteProps> = ({
  children,
}) => {
  const { isUserAuthenticated } = useAuth();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    if (!isUserAuthenticated) {
      setShowModal(true);
    }
  }, [isUserAuthenticated]);

  const handleLogin = () => {
    setRedirect(true);
  };

  if (redirect) {
    return <Redirect to={{ pathname: "/login", state: { from: location } }} />;
  }

  if (!isUserAuthenticated) {
    return (
      <>
        {children}
        <Modal show={showModal} centered backdrop="static">
          <Modal.Body
            style={{
              padding: "2rem",
              textAlign: "center",
              borderRadius: "16px",
            }}
          >
            <div
              style={{
                fontSize: "3rem",
                marginBottom: "1rem",
              }}
            >
              🔐
            </div>
            <h4
              style={{
                fontFamily: "Poppins, serif",
                fontWeight: 600,
                marginBottom: "0.5rem",
              }}
            >
              Login Required
            </h4>
            <p
              style={{
                color: "#6c757d",
                marginBottom: "1.5rem",
                fontSize: "0.95rem",
              }}
            >
              You need to sign in to access this feature. Create an account to
              explore all that Calbayog has to offer.
            </p>
            <Button
              onClick={handleLogin}
              style={{
                background: "linear-gradient(135deg, #1a5f4a, #0d3d2e)",
                border: "none",
                padding: "0.75rem 2rem",
                borderRadius: "8px",
                fontWeight: 600,
              }}
            >
              Sign In / Sign Up
            </Button>
          </Modal.Body>
        </Modal>
      </>
    );
  }

  return <>{children}</>;
};

export default UserProtectedRoute;
