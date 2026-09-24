import React from 'react';

interface UserProtectedRouteProps {
  children: React.ReactNode;
}

const UserProtectedRoute: React.FC<UserProtectedRouteProps> = ({ children }) => {
  return <>{children}</>;
};

export default UserProtectedRoute;