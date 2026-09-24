import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useHistory } from 'react-router-dom';
import { getNotifications, deleteNotification } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';

interface Notification {
  id: string;
  user_id: string | null;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

const SEEN_KEY = 'user_notif_seen_ids';
const getSeenIds = (): Set<string> => {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); }
  catch { return new Set(); }
};
const addSeenId = (id: string) => {
  const seen = getSeenIds();
  seen.add(id);
  localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
};
const addAllSeenIds = (ids: string[]) => {
  const seen = getSeenIds();
  ids.forEach(id => seen.add(id));
  localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
};

const UserNotifications: React.FC = () => {
  const { darkMode } = useDarkMode();
  const { user } = useAuth();
  const history = useHistory();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(getSeenIds);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await getNotifications(user?.id || '');
      const data: Notification[] = Array.isArray(response.data) ? response.data : [];
      setNotifications(data);
      const seen = getSeenIds();
      setUnreadCount(data.filter(n => !seen.has(n.id)).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleMarkAsRead = (id: string) => {
    addSeenId(id);
    setSeenIds(new Set(getSeenIds()));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = () => {
    addAllSeenIds(notifications.map(n => n.id));
    setSeenIds(new Set(getSeenIds()));
    setUnreadCount(0);
  };

  const handleDelete = async (id: string, isGlobal: boolean) => {
    if (isGlobal) {
      handleMarkAsRead(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      return;
    }
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const isRead = (n: Notification) => seenIds.has(n.id);

  const handleClick = (notification: Notification) => {
    if (!isRead(notification)) handleMarkAsRead(notification.id);
    setShowDropdown(false);
    setShowFullScreen(false);
    const data = notification.data || {};
    switch (notification.type) {
      case 'destination_added': history.push('/destinations'); break;
      case 'event_added': history.push('/events'); break;
      case 'guide_added': history.push('/guides'); break;
      default: break;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'destination_added': return '📍';
      case 'event_added': return '🎉';
      case 'guide_added': return '🧭';
      case 'trip_planned': return '✈️';
      default: return '📢';
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'destination_added': return 'linear-gradient(135deg, #10b981, #059669)';
      case 'event_added': return 'linear-gradient(135deg, #f59e0b, #d97706)';
      case 'guide_added': return 'linear-gradient(135deg, #3b82f6, #2563eb)';
      case 'trip_planned': return 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
      default: return 'linear-gradient(135deg, #6b7280, #4b5563)';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const previewNotifications = notifications.slice(0, 3);

  return (
    <>
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        {/* Bell Button */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            position: 'relative',
            background: 'none',
            border: 'none',
            padding: '8px',
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: 42, height: 42,
            borderRadius: '50%',
            background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(26,95,74,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.3rem',
            transition: 'transform 0.2s',
          }}>
            🔔
          </div>
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: 4, right: 4,
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 700,
              minWidth: 18, height: 18,
              borderRadius: 9,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(239,68,68,0.4)',
              border: '2px solid #fff',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Preview */}
        {showDropdown && (
          <div 
            className="user-notif-dropdown"
            style={{
              position: 'fixed',
              top: 70,
              right: 12,
              left: 12,
              maxWidth: 380,
              marginLeft: 'auto',
              background: darkMode ? '#1e293b' : '#fff',
              borderRadius: 16,
              boxShadow: darkMode ? '0 10px 40px rgba(0,0,0,0.5)' : '0 10px 40px rgba(0,0,0,0.15)',
              border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
              overflow: 'hidden',
              zIndex: 9999,
              animation: 'dropIn 0.2s ease-out',
            }}>
            <style>{`
              @keyframes dropIn {
                from { opacity: 0; transform: translateY(-10px) scale(0.95); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
              @media (min-width: 768px) {
                .user-notif-dropdown {
                  position: absolute !important;
                  top: calc(100% + 8px) !important;
                  right: 0 !important;
                  left: auto !important;
                  width: 380px !important;
                }
              }
            `}</style>

            {/* Dropdown Header */}
            <div style={{
              padding: '14px 16px',
              borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.1rem' }}>🔔</span>
                <span style={{ fontWeight: 700, color: darkMode ? '#f1f5f9' : '#0f172a', fontSize: '0.95rem' }}>
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span style={{
                    background: '#10b981',
                    color: '#fff',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 10,
                  }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
            </div>

            {/* Preview List */}
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {previewNotifications.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>✓</div>
                  <p style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '0.85rem', margin: 0 }}>
                    No notifications
                  </p>
                </div>
              ) : (
                previewNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: `1px solid ${darkMode ? '#334155' : '#f1f5f9'}`,
                      cursor: 'pointer',
                      background: isRead(n) ? 'transparent' : (darkMode ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.05)'),
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div style={{
                      width: 40, height: 40,
                      borderRadius: 12,
                      background: getIconBg(n.type),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem',
                      flexShrink: 0,
                    }}>
                      {getIcon(n.type)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        color: darkMode ? '#f1f5f9' : '#0f172a',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}>
                        {!isRead(n) && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />}
                        {n.title}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: darkMode ? '#94a3b8' : '#64748b',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {n.message}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: darkMode ? '#64748b' : '#94a3b8', flexShrink: 0 }}>
                      {formatTime(n.created_at)}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* View All Button */}
            {notifications.length > 0 && (
              <div style={{
                padding: '12px 16px',
                borderTop: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                background: darkMode ? '#0f172a' : '#f8fafc',
              }}>
                <button
                  onClick={() => { setShowDropdown(false); setShowFullScreen(true); }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'linear-gradient(135deg, #1a5f4a, #0d3d2e)',
                    border: 'none',
                    borderRadius: 10,
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  View All Notifications →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full Screen Panel (rendered via portal) */}
      {showFullScreen && ReactDOM.createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: darkMode ? '#0f172a' : '#f8fafc',
          zIndex: 2147483647,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.3s ease-out',
        }}>
          <style>{`
            @keyframes slideUp {
              from { transform: translateY(100%); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: darkMode ? '#1e293b' : '#fff',
            borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => setShowFullScreen(false)}
                style={{
                  background: 'none', border: 'none',
                  fontSize: '1.5rem', cursor: 'pointer',
                  color: darkMode ? '#e2e8f0' : '#1e293b',
                  padding: 4,
                }}
              >
                ←
              </button>
              <div>
                <h1 style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  margin: 0,
                  color: darkMode ? '#f1f5f9' : '#0f172a',
                }}>Notifications</h1>
                <p style={{
                  fontSize: '0.8rem',
                  color: darkMode ? '#94a3b8' : '#64748b',
                  margin: 0,
                }}>
                  {unreadCount > 0 ? `${unreadCount} new` : 'All caught up!'}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 16px',
          }}>
            {notifications.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
              }}>
                <div style={{
                  width: 80, height: 80,
                  borderRadius: '50%',
                  background: darkMode ? '#1e293b' : '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  margin: '0 auto 16px',
                }}>
                  🔔
                </div>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: darkMode ? '#e2e8f0' : '#1e293b',
                  marginBottom: 8,
                }}>No notifications yet</h3>
                <p style={{
                  fontSize: '0.9rem',
                  color: darkMode ? '#94a3b8' : '#64748b',
                }}>
                  We'll notify you when something new happens!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {notifications.map((n, i) => (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    style={{
                      background: darkMode ? '#1e293b' : '#fff',
                      borderRadius: 16,
                      padding: '14px 16px',
                      display: 'flex',
                      gap: 14,
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                      border: isRead(n) ? 'none' : `2px solid ${darkMode ? '#10b981' : '#059669'}`,
                      boxShadow: isRead(n)
                        ? (darkMode ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.08)')
                        : '0 4px 12px rgba(16,185,129,0.2)',
                      animation: `fadeIn 0.3s ease-out ${i * 0.05}s both`,
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 48, height: 48,
                      borderRadius: 14,
                      background: getIconBg(n.type),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem',
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}>
                      {getIcon(n.type)}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 4,
                      }}>
                        {!isRead(n) && (
                          <span style={{
                            width: 8, height: 8,
                            borderRadius: '50%',
                            background: '#10b981',
                            flexShrink: 0,
                          }} />
                        )}
                        <span style={{
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          color: darkMode ? '#f1f5f9' : '#0f172a',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {n.title}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '0.85rem',
                        color: darkMode ? '#94a3b8' : '#64748b',
                        margin: '0 0 6px',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {n.message}
                      </p>
                      <span style={{
                        fontSize: '0.75rem',
                        color: darkMode ? '#64748b' : '#94a3b8',
                        fontWeight: 500,
                      }}>
                        {formatTime(n.created_at)}
                      </span>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(n.id, !n.user_id); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: darkMode ? '#64748b' : '#94a3b8',
                        fontSize: '1.2rem',
                        cursor: 'pointer',
                        padding: 4,
                        opacity: 0.6,
                        transition: 'opacity 0.2s',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default UserNotifications;
