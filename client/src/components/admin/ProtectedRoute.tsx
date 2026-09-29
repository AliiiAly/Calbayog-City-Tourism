import React from "react";
import { Redirect } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Spinner } from "react-bootstrap";

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const {
    admin,
    token,
    isAuthenticated,
    loading,
  } = useAuth();

  console.log(
    "ProtectedRoute check:",
    {
      isAuthenticated,
      hasAdmin: Boolean(admin),
      hasToken: Boolean(token),
      role: admin?.role,
      loading,
    }
  );

  /* =====================================================
     AUTHENTICATION IS STILL INITIALIZING
  ===================================================== */

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#f5f7fa",
        }}
      >
        <Spinner
          animation="border"
          style={{
            color: "#1a5f4a",
          }}
        />
      </div>
    );
  }

  /* =====================================================
     ADMIN ACCESS CHECK
     
     An account must:
       1. Have a valid authenticated session
       2. Have an admin object
       3. Have role === "admin"
       4. Have an admin token
  ===================================================== */

  const isAdmin =
    isAuthenticated &&
    Boolean(admin) &&
    admin?.role === "admin" &&
    Boolean(token);

  /* =====================================================
     NOT AN ADMIN
  ===================================================== */

  if (!isAdmin) {
    return (
      <Redirect to="/admin/login" />
    );
  }

  /* =====================================================
     AUTHORIZED ADMIN
  ===================================================== */

  return <>{children}</>;
};

export default ProtectedRoute;
