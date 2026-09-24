import React, { useState, useEffect, useRef } from 'react';
import { Badge, Button } from 'react-bootstrap';
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

const SEEN_KEY = 'admin_notif_seen_ids';
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

const AdminNotifications: React.FC = () => {
  const { darkMode } = useDarkMode();
  const { admin } = useAuth();
  const history = useHistory();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(getSeenIds);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [admin?.id]);

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
      const response = await getNotifications(admin?.id || '');
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
    switch (notification.type) {
      case 'trip_request': history.push('/admin/requests'); break;
      case 'destination_added': history.push('/admin/destinations'); break;
      case 'event_added': history.push('/admin/events'); break;
      case 'guide_added': history.push('/admin/guides'); break;
      case 'new_user': history.push('/admin/users'); break;
      default: break;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'trip_request': return '📝';
      case 'destination_added': return '📍';
      case 'event_added': return '🎉';
      case 'guide_added': return '🧭';
      case 'new_user': return '👤';
      case 'admin_update': return '⚙️';
      default: return '📢';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'trip_request': return 'Request';
      case 'destination_added': return 'Destination';
      case 'event_added': return 'Event';
      case 'guide_added': return 'Guide';
      case 'new_user': return 'User';
      case 'admin_update': return 'System';
      default: return 'Update';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'trip_request': return { bg: '#fef3c7', color: '#d97706' };
      case 'destination_added': return { bg: '#d1fae5', color: '#059669' };
      case 'event_added': return { bg: '#fce7f3', color: '#db2777' };
      case 'guide_added': return { bg: '#dbeafe', color: '#2563eb' };
      case 'new_user': return { bg: '#e0e7ff', color: '#4f46e5' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
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
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const bgColor = darkMode ? '#1e1e2e' : '#ffffff';
  const borderColor = darkMode ? '#3a3a5e' : '#e5e7eb';
  const textPrimary = darkMode ? '#f1f5f9' : '#111827';
  const textSecondary = darkMode ? '#94a3b8' : '#6b7280';
  const textMuted = darkMode ? '#64748b' : '#9ca3af';

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell Button - Professional Web Style */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          position: 'relative',
          background: showDropdown
            ? (darkMode ? 'rgba(26,95,74,0.2)' : 'rgba(26,95,74,0.1)')
            : 'transparent',
          border: 'none',
          borderRadius: 10,
          padding: '10px 12px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: '1.3rem' }}>🔔</span>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 6, right: 6,
            background: '#ef4444',
            color: '#fff',
            fontSize: '0.65rem',
            fontWeight: 700,
            minWidth: 18, height: 18,
            borderRadius: 9,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(239,68,68,0.4)',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel - Professional Web Style */}
      {showDropdown && (
        <div 
          className="admin-notif-dropdown"
          style={{
            position: 'fixed',
            top: 60,
            right: 8,
            left: 8,
            maxWidth: 420,
            marginLeft: 'auto',
            maxHeight: 'calc(100vh - 80px)',
            background: bgColor,
            borderRadius: 16,
            border: `1px solid ${borderColor}`,
            boxShadow: darkMode
              ? '0 20px 40px rgba(0,0,0,0.4)'
              : '0 20px 40px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            zIndex: 9999,
            animation: 'dropIn 0.2s ease-out',
          }}>
          <style>{`
            @keyframes dropIn {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @media (min-width: 992px) {
              .admin-notif-dropdown {
                position: absolute !important;
                top: calc(100% + 8px) !important;
                right: 0 !important;
                left: auto !important;
                width: 420px !important;
                max-height: 520px !important;
              }
              .admin-notif-list {
                max-height: 400px !important;
              }
            }
          `}</style>

          {/* Header */}
          <div style={{
            padding: '18px 20px',
            borderBottom: `1px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: darkMode ? '#252538' : '#f9fafb',
          }}>
            <div>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: textPrimary,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                Notifications
                {unreadCount > 0 && (
                  <span style={{
                    background: 'linear-gradient(135deg, #1a5f4a, #0d3d2e)',
                    color: '#fff',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 10,
                  }}>
                    {unreadCount} new
                  </span>
                )}
              </h3>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1a5f4a',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 6,
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = darkMode ? 'rgba(26,95,74,0.2)' : 'rgba(26,95,74,0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div 
            className="admin-notif-list"
            style={{
              maxHeight: 'calc(100vh - 200px)',
              overflowY: 'auto',
            }}>
            {notifications.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '48px 24px',
              }}>
                <div style={{
                  width: 64, height: 64,
                  borderRadius: 16,
                  background: darkMode ? '#252538' : '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  margin: '0 auto 16px',
                }}>
                  ✓
                </div>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: textPrimary,
                  marginBottom: 6,
                }}>All caught up!</h4>
                <p style={{
                  fontSize: '0.85rem',
                  color: textSecondary,
                  margin: 0,
                }}>
                  No new notifications at the moment.
                </p>
              </div>
            ) : (
              notifications.map((n, i) => {
                const badgeColors = getTypeBadgeColor(n.type);
                return (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    style={{
                      padding: '16px 20px',
                      borderBottom: i < notifications.length - 1 ? `1px solid ${borderColor}` : 'none',
                      cursor: 'pointer',
                      background: isRead(n) ? 'transparent' : (darkMode ? 'rgba(26,95,74,0.08)' : 'rgba(26,95,74,0.04)'),
                      transition: 'background 0.2s',
                      display: 'flex',
                      gap: 14,
                      alignItems: 'flex-start',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = darkMode ? '#252538' : '#f9fafb'}
                    onMouseOut={(e) => e.currentTarget.style.background = isRead(n) ? 'transparent' : (darkMode ? 'rgba(26,95,74,0.08)' : 'rgba(26,95,74,0.04)')}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 42, height: 42,
                      borderRadius: 12,
                      background: darkMode ? '#252538' : '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      flexShrink: 0,
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
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: badgeColors.bg,
                          color: badgeColors.color,
                        }}>
                          {getTypeLabel(n.type)}
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          color: textMuted,
                        }}>
                          {formatTime(n.created_at)}
                        </span>
                        {!isRead(n) && (
                          <span style={{
                            width: 8, height: 8,
                            borderRadius: '50%',
                            background: '#1a5f4a',
                            marginLeft: 'auto',
                          }} />
                        )}
                      </div>
                      <h4 style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: textPrimary,
                        margin: '0 0 4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {n.title}
                      </h4>
                      <p style={{
                        fontSize: '0.82rem',
                        color: textSecondary,
                        margin: 0,
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {n.message}
                      </p>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(n.id, !n.user_id); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: textMuted,
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                        padding: 4,
                        opacity: 0.5,
                        transition: 'opacity 0.2s, color 0.2s',
                        borderRadius: 6,
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
                      onMouseOut={(e) => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = textMuted; }}
                    >
                      ×
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding: '12px 20px',
              borderTop: `1px solid ${borderColor}`,
              background: darkMode ? '#252538' : '#f9fafb',
              textAlign: 'center',
            }}>
              <button
                onClick={() => { setShowDropdown(false); history.push('/admin/notifications'); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1a5f4a',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                View all notifications →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
