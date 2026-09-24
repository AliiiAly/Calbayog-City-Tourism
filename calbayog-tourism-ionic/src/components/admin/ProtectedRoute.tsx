import React from 'react';
import { Redirect } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from 'react-bootstrap';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token, loading } = useAuth();
  console.log('ProtectedRoute check:', { isAuthenticated, token, loading });
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#f5f7fa'
      }}>
        <Spinner animation="border" style={{ color: '#1a5f4a' }} />
      </div>
    );
  }
  
  if (!isAuthenticated) return <Redirect to="/admin/login" />;
  return <>{children}</>;
};

export default ProtectedRoute;
