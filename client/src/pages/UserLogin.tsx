import React, { useState } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Capacitor } from '@capacitor/core';
import bcrypt from 'bcryptjs';

const SUPABASE_URL = 'https://wemjefizjcbjvtplllxa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlbWplZml6amNianZ0cGxsbHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDA1MDUsImV4cCI6MjA5NzI3NjUwNX0.jYyiWGUgJ61ztwqDWoUjR5GAHZJ0TwPHkcA_lXhAWuM';

const UserLogin: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { userLogin } = useAuth();
  const history = useHistory();
  const location = useLocation();
  const isNative = Capacitor.isNativePlatform();

  const from = (location.state as any)?.from?.pathname || '/';

  const supabaseFetch = (path: string, options?: RequestInit) =>
    fetch(`${SUPABASE_URL}/rest/v1${path}`, {
      ...options,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...(options?.headers || {}),
      },
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate confirm password for signup
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      if (isNative) {
        if (isLogin) {
          const res = await supabaseFetch(`/users?username=eq.${encodeURIComponent(formData.username)}&select=*`);
          const users = await res.json();
          const user = Array.isArray(users) ? users[0] : null;
          if (!user) throw new Error('User not found. Check your username.');
          if (!user.is_active) throw new Error('Account is inactive. Contact support.');
          const valid = await bcrypt.compare(formData.password, user.password);
          if (!valid) throw new Error('Incorrect password.');
          const token = btoa(JSON.stringify({ id: user.id, username: user.username, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
          userLogin(
            {
              id: user.id,
              email: user.email || '',
              username: user.username,
              name: user.name,
              is_active: user.is_active ?? true,
            },
            { access_token: token } as any,
          );
          history.replace(from);
        } else {
          const checkRes = await supabaseFetch(`/users?username=eq.${encodeURIComponent(formData.username)}&select=id`);
          const existing = await checkRes.json();
          if (Array.isArray(existing) && existing.length > 0) throw new Error('Username already taken.');
          const salt = await bcrypt.genSalt(10);
          const hashed = await bcrypt.hash(formData.password, salt);
          const insertRes = await supabaseFetch('/users', {
            method: 'POST',
            body: JSON.stringify({ username: formData.username, password: hashed, name: formData.name, is_active: true }),
          });
          if (!insertRes.ok) {
            const err = await insertRes.json().catch(() => ({}));
            throw new Error((err as any).message || 'Signup failed');
          }
          setSuccess('Account created successfully! Please login.');
          setIsLogin(true);
          setFormData({ username: formData.username, password: '', confirmPassword: '', name: '' });
        }
      } else {
        const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';
        if (isLogin) {
          const response = await fetch(`${API_URL}/auth/user/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: formData.username, password: formData.password }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || 'Login failed');
          userLogin(data.token, data.user);
          history.replace(from);
        } else {
          const response = await fetch(`${API_URL}/auth/user/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: formData.username, password: formData.password, name: formData.name }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || 'Signup failed');
          setSuccess('Account created successfully! Please login.');
          setIsLogin(true);
          setFormData({ username: formData.username, password: '', confirmPassword: '', name: '' });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setFormData({ username: '', password: '', confirmPassword: '', name: '' });
  };

  return (
    <div style={{ 
      minHeight: '100dvh',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      overflow: 'auto',
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .login-input {
          width: 100%;
          padding: 16px 20px;
          border: 1.5px solid #e5e7eb;
          border-radius: 30px;
          font-size: 16px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          background: #fff;
        }
        .login-input:focus {
          border-color: #1a5f4a;
          box-shadow: 0 0 0 3px rgba(26,95,74,0.1);
        }
        .login-input::placeholder {
          color: #9ca3af;
        }
        .password-wrapper {
          position: relative;
        }
        .password-toggle {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          font-size: 1.2rem;
          padding: 4px;
        }
        .login-btn {
          width: 100%;
          padding: 16px;
          border: none;
          border-radius: 30px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .login-btn:active {
          transform: scale(0.98);
        }
        .login-btn-primary {
          background: linear-gradient(135deg, #1a5f4a, #0d3d2e);
          color: #fff;
          box-shadow: 0 4px 14px rgba(26,95,74,0.35);
        }
        .login-btn-primary:hover {
          box-shadow: 0 6px 20px rgba(26,95,74,0.45);
        }
        .tab-btn {
          flex: 1;
          padding: 14px 24px;
          border: none;
          border-radius: 30px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        .tab-btn-active {
          background: linear-gradient(135deg, #1a5f4a, #0d3d2e);
          color: #fff;
          box-shadow: 0 4px 12px rgba(26,95,74,0.3);
        }
        .tab-btn-inactive {
          background: transparent;
          color: #6b7280;
        }
        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
        }
        @media (min-width: 480px) {
          .login-container {
            max-width: 420px;
            margin: 0 auto;
          }
        }
      `}</style>

      <div className="login-container" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '40px 24px',
        animation: 'fadeIn 0.4s ease-out',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#111827',
            marginBottom: 8,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: 1.3,
          }}>
            {isLogin ? 'Get Started With your' : 'Create an account'}
          </h1>
          {isLogin && (
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#111827',
              marginBottom: 8,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontStyle: 'italic',
            }}>
              Tourism Journey
            </h1>
          )}
          <p style={{ color: '#6b7280', fontSize: '0.95rem', margin: 0 }}>
            {isLogin ? 'Sign in to your Account' : (
              <>Already have an account? <span onClick={switchMode} style={{ color: '#1a5f4a', cursor: 'pointer', fontWeight: 500 }}>Log in</span></>
            )}
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          gap: 8,
          padding: 6,
          background: '#f3f4f6',
          borderRadius: 30,
          marginBottom: 28,
        }}>
          <button
            type="button"
            className={`tab-btn ${isLogin ? 'tab-btn-active' : 'tab-btn-inactive'}`}
            onClick={() => !isLogin && switchMode()}
          >
            Login
          </button>
          <button
            type="button"
            className={`tab-btn ${!isLogin ? 'tab-btn-active' : 'tab-btn-inactive'}`}
            onClick={() => isLogin && switchMode()}
          >
            Register
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: 12,
            marginBottom: 20,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span>⚠️</span> {error}
          </div>
        )}
        {success && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#16a34a',
            padding: '12px 16px',
            borderRadius: 12,
            marginBottom: 20,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span>✓</span> {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1 }}>
            {/* Full Name - Register only */}
            {!isLogin && (
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required={!isLogin}
                  className="login-input"
                />
              </div>
            )}

            {/* Username */}
            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                required
                className="login-input"
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: isLogin ? 12 : 20 }}>
              <label className="form-label">Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••"
                  required
                  className="login-input"
                  style={{ paddingRight: 50 }}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Confirm Password - Register only */}
            {!isLogin && (
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Confirm Password</label>
                <div className="password-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••••"
                    required={!isLogin}
                    className="login-input"
                    style={{ paddingRight: 50 }}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
            )}

            {/* Forgot Password - Login only */}
            {isLogin && (
              <div style={{ textAlign: 'right', marginBottom: 24 }}>
                <span style={{ color: '#1a5f4a', fontSize: '0.9rem', cursor: 'pointer' }}>
                  Forgot Password?
                </span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="login-btn login-btn-primary"
            disabled={loading}
            style={{ marginTop: 'auto', marginBottom: 24 }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={{
                  width: 18, height: 18,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              isLogin ? 'Login' : 'Create account'
            )}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </form>

        {/* Admin Link */}
        <div style={{ textAlign: 'center', paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
          <Link 
            to="/admin/login" 
            style={{ 
              color: '#6b7280', 
              fontSize: '0.85rem',
              textDecoration: 'none',
            }}
          >
            Admin Panel →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
