import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, userLogout, isUserAuthenticated } = useAuth();

  const handleLogout = () => {
    userLogout();
    onClose();
  };

  return (
    <>
      {/* Sidebar Overlay */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}

      {/* Sidebar Drawer */}
      <div className={`sidebar-drawer ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3 className="sidebar-title">Menu</h3>
          <button className="sidebar-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="sidebar-content">
          <div className="sidebar-section">
            <div className="sidebar-section-label">Explore</div>
            <Link to="/" className="sidebar-item" onClick={onClose}>
              <span className="sidebar-icon">🏠</span>
              <span>Home</span>
            </Link>
            <Link to="/destinations" className="sidebar-item" onClick={onClose}>
              <span className="sidebar-icon">🌊</span>
              <span>Destinations</span>
            </Link>
            <Link to="/map" className="sidebar-item" onClick={onClose}>
              <span className="sidebar-icon">📍</span>
              <span>Interactive Map</span>
            </Link>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-label">Travel Essentials</div>
            <Link to="/getting-there" className="sidebar-item" onClick={onClose}>
              <span className="sidebar-icon">🚗</span>
              <span>Getting There</span>
            </Link>
            <Link to="/accommodations" className="sidebar-item" onClick={onClose}>
              <span className="sidebar-icon">🏨</span>
              <span>Accommodations</span>
            </Link>
            <Link to="/guides" className="sidebar-item" onClick={onClose}>
              <span className="sidebar-icon">🧭</span>
              <span>Tour Guides</span>
            </Link>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-label">Plan & Enjoy</div>
            <Link to="/events" className="sidebar-item" onClick={onClose}>
              <span className="sidebar-icon">🎉</span>
              <span>Events</span>
            </Link>
            <Link to="/itinerary" className="sidebar-item" onClick={onClose}>
              <span className="sidebar-icon">📋</span>
              <span>Plan Trip</span>
            </Link>
          </div>

          {isUserAuthenticated && (
            <div className="sidebar-section">
              <div className="sidebar-section-label">Account</div>
              <div style={{ padding: '12px 20px', fontSize: '0.85rem', color: '#6c757d' }}>
                Signed in as <strong>{user?.name || user?.username}</strong>
              </div>
              <button 
                className="sidebar-item" 
                onClick={handleLogout}
                style={{ 
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 20px',
                  fontSize: '0.9rem',
                  color: '#e74c3c'
                }}
              >
                <span className="sidebar-icon">🚪</span>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
