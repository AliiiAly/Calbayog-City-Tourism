import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/', icon: '🏠', label: 'Home', exact: true },
  { to: '/destinations', icon: '🗺️', label: 'Explore' },
  { to: '/map', icon: '📍', label: 'Map' },
  { to: '/events', icon: '🎉', label: 'Events' },
  { to: '/itinerary', icon: '📋', label: 'Plan' },
];

const BottomNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = item.exact
          ? location.pathname === item.to
          : location.pathname.startsWith(item.to);
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomNav;
