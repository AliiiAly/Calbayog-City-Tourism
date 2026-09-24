import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminUser } from '../types';

interface User {
  id: string;
  username: string;
  name: string;
}

interface AuthContextType {
  admin: AdminUser | null;
  token: string | null;
  user: User | null;
  userToken: string | null;
  login: (token: string, admin: AdminUser) => void;
  userLogin: (token: string, user: User) => void;
  logout: () => void;
  userLogout: () => void;
  isAuthenticated: boolean;
  isUserAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    const storedAdmin = localStorage.getItem('admin_user');
    if (storedToken && storedAdmin && storedAdmin !== 'undefined') {
      setToken(storedToken);
      setAdmin(JSON.parse(storedAdmin));
    }

    const storedUserToken = localStorage.getItem('user_token');
    const storedUser = localStorage.getItem('user_data');
    if (storedUserToken && storedUser && storedUser !== 'undefined') {
      setUserToken(storedUserToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, adminUser: AdminUser) => {
    console.log('AuthContext.login called with:', { newToken, adminUser });
    setToken(newToken);
    setAdmin(adminUser);
    localStorage.setItem('admin_token', newToken);
    localStorage.setItem('admin_user', JSON.stringify(adminUser));
    console.log('Token stored in localStorage:', localStorage.getItem('admin_token'));
  };

  const userLogin = (newToken: string, userData: User) => {
    setUserToken(newToken);
    setUser(userData);
    localStorage.setItem('user_token', newToken);
    localStorage.setItem('user_data', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  };

  const userLogout = () => {
    setUserToken(null);
    setUser(null);
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_data');
  };

  return (
    <AuthContext.Provider value={{ 
      admin, 
      token, 
      user, 
      userToken, 
      login, 
      userLogin, 
      logout, 
      userLogout, 
      isAuthenticated: !!token,
      isUserAuthenticated: !!userToken,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
