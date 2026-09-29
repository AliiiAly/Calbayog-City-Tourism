import React from "react";
import { Redirect } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";

interface UserProtectedRouteProps {
  children: React.ReactNode;
}

const UserProtectedRoute: React.FC<UserProtectedRouteProps> = ({
  children,
}) => {
  const {
    user,
    userToken,
    isUserAuthenticated,
    loading,
  } = useAuth();

  console.log("UserProtectedRoute check:", {
    isUserAuthenticated,
    hasUser: Boolean(user),
    hasToken: Boolean(userToken),
    role: user?.role,
    loading,
  });

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
            color: "#263A9F",
          }}
        />
      </div>
    );
  }

  /* =====================================================
     USER ACCESS CHECK

     The account must:
       1. Have a valid user session
       2. Have a user object
       3. Have role === "user"
       4. Have a user token
  ===================================================== */

  const isUser =
    isUserAuthenticated &&
    Boolean(user) &&
    user?.role === "user" &&
    Boolean(userToken);

  /* =====================================================
     NOT LOGGED IN AS A USER

     Send the visitor to the main page instead of the
     old separate user/admin login routes.

     The unified login modal can then be opened from
     the public interface.
  ===================================================== */

  if (!isUser) {
    return <Redirect to="/" />;
  }

  /* =====================================================
     AUTHORIZED USER
  ===================================================== */

  return <>{children}</>;
};

export default UserProtectedRoute;
