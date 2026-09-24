import React, { useState, useEffect } from 'react';
import { Alert, Button, Badge, Dropdown } from 'react-bootstrap';
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

const SEEN_KEY = 'notif_seen_ids';

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

const NotificationBanner: React.FC = () => {
  const { darkMode } = useDarkMode();
  const { user, admin } = useAuth();
  const history = useHistory();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [visibleBanner, setVisibleBanner] = useState<Notification | null>(null);
  const [seenIds, setSeenIds] = useState<Set<string>>(getSeenIds);

  // Use admin ID if available (admin pages), otherwise use user ID
  const currentUserId = admin?.id || user?.id;

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [currentUserId]);

  const loadNotifications = async () => {
    try {
      const response = await getNotifications(currentUserId || '');
      const data: Notification[] = response.data || [];
      setNotifications(data);
      // Unread = notifications not yet seen locally
      const seen = getSeenIds();
      const unread = data.filter(n => !seen.has(n.id)).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleMarkAsRead = (id: string) => {
    addSeenId(id);
    const updated = new Set(getSeenIds());
    setSeenIds(updated);
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = () => {
    addAllSeenIds(notifications.map(n => n.id));
    setSeenIds(new Set(getSeenIds()));
    setUnreadCount(0);
  };

  // Only delete user-specific notifications (not global ones)
  const handleDelete = async (id: string, isGlobal: boolean) => {
    if (isGlobal) {
      // For global notifications, just mark as seen locally
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

  const handleNotificationClick = (notification: Notification) => {
    if (!isRead(notification)) {
      handleMarkAsRead(notification.id);
    }
    setShowDropdown(false);
    setVisibleBanner(notification);

    // Navigate based on notification type
    const data = notification.data || {};
    if (admin) {
      // Admin navigation — goes to admin management pages
      switch (notification.type) {
        case 'trip_request': history.push('/admin/requests'); break;
        case 'destination_added': history.push('/admin/destinations'); break;
        case 'event_added': history.push('/admin/events'); break;
        case 'guide_added': history.push('/admin/guides'); break;
        case 'new_user': history.push('/admin/users'); break;
        default: break;
      }
    } else {
      // User navigation — goes to user-facing pages with item highlighted
      switch (notification.type) {
        case 'destination_added':
          history.push('/destinations', { state: { highlightId: data.destinationId } });
          break;
        case 'event_added':
          history.push('/events', { state: { highlightId: data.eventId } });
          break;
        case 'guide_added':
          history.push('/guides', { state: { highlightId: data.guideId } });
          break;
        default:
          break;
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'admin_update': return '🔔';
      case 'trip_request': return '📝';
      case 'trip_planned': return '✈️';
      case 'destination_added': return '📍';
      case 'event_added': return '🎉';
      case 'guide_added': return '🧭';
      case 'new_user': return '👤';
      default: return '📢';
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
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Always render the bell so global notifications are visible even without login

  return (
    <>
      {/* Notification Bell Icon */}
      <div className="position-relative">
        <Dropdown show={showDropdown} onToggle={setShowDropdown} align="end">
          <Dropdown.Toggle
            variant="link"
            className="p-0 border-0"
            style={{ color: darkMode ? '#e0e0e0' : '#212529', textDecoration: 'none' }}
          >
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <span style={{ fontSize: '1.5rem' }}>🔔</span>
              {unreadCount > 0 && (
                <Badge
                  pill
                  bg="danger"
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    minWidth: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </div>
          </Dropdown.Toggle>

          <Dropdown.Menu
            style={{
              minWidth: '350px',
              maxHeight: '500px',
              overflowY: 'auto',
              background: darkMode ? '#1e1e2e' : '#fff',
              border: darkMode ? '1px solid #3a3a4e' : '1px solid #dee2e6',
              borderRadius: '12px',
              padding: '12px'
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0 fw-bold" style={{ color: darkMode ? '#e0e0e0' : '#212529' }}>
                Notifications
              </h6>
              {unreadCount > 0 && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  style={{ color: '#1a5f4a', textDecoration: 'none', padding: 0 }}
                >
                  Mark all read
                </Button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-4">
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔔</div>
                <p className="mb-0" style={{ color: darkMode ? '#b0b0c0' : '#6c757d', fontSize: '0.9rem' }}>
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <Dropdown.Item
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    padding: '12px',
                    marginBottom: '8px',
                    borderRadius: '8px',
                    background: isRead(notification)
                      ? 'transparent'
                      : darkMode
                      ? 'rgba(26, 95, 74, 0.15)'
                      : 'rgba(26, 95, 74, 0.08)',
                    border: isRead(notification) ? 'none' : '1px solid #1a5f4a',
                    cursor: 'pointer',
                    display: 'block',
                    whiteSpace: 'normal'
                  }}
                >
                  <div className="d-flex gap-2">
                    <span style={{ fontSize: '1.2rem' }}>{getNotificationIcon(notification.type)}</span>
                    <div style={{ flex: 1 }}>
                      <div
                        className="fw-semibold"
                        style={{
                          fontSize: '0.9rem',
                          color: isRead(notification) ? (darkMode ? '#8a8a9a' : '#6c757d') : (darkMode ? '#e0e0e0' : '#212529'),
                          marginBottom: '2px'
                        }}
                      >
                        {!isRead(notification) && <span style={{ color: '#1a5f4a', marginRight: '4px' }}>●</span>}
                        {notification.title}
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: darkMode ? '#b0b0c0' : '#6c757d',
                          marginBottom: '4px'
                        }}
                      >
                        {notification.message}
                      </div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: darkMode ? '#6c757d' : '#adb5bd'
                        }}
                      >
                        {formatTime(notification.created_at)}
                      </div>
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id, !notification.user_id);
                      }}
                      style={{ color: '#dc3545', padding: 0, fontSize: '0.8rem' }}
                      title={!notification.user_id ? 'Dismiss' : 'Delete'}
                    >
                      ✕
                    </Button>
                  </div>
                </Dropdown.Item>
              ))
            )}
          </Dropdown.Menu>
        </Dropdown>
      </div>

      {/* Visible Banner for clicked notification */}
      {visibleBanner && (
        <Alert
          variant="info"
          dismissible
          onClose={() => setVisibleBanner(null)}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            minWidth: '300px',
            maxWidth: '400px',
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            background: darkMode ? '#2a2a3e' : '#fff',
            color: darkMode ? '#e0e0e0' : '#212529',
            border: `1px solid ${darkMode ? '#3a3a4e' : '#dee2e6'}`
          }}
        >
          <div className="d-flex gap-2">
            <span style={{ fontSize: '1.5rem' }}>{getNotificationIcon(visibleBanner.type)}</span>
            <div style={{ flex: 1 }}>
              <div className="fw-bold mb-1">{visibleBanner.title}</div>
              <div style={{ fontSize: '0.9rem' }}>{visibleBanner.message}</div>
            </div>
          </div>
        </Alert>
      )}
    </>
  );
};

export default NotificationBanner;
