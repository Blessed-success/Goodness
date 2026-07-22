/**
 * NotificationBell
 * Header dropdown showing the current user's in-app notifications
 * (order status updates, etc.), with an unread-count badge.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';
import { notificationsAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const POLL_INTERVAL_MS = 60000;

const NotificationBell = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = () => {
    notificationsAPI
      .getAll({ limit: 10 })
      .then((response) => {
        setNotifications(response.data.data.notifications);
        setUnreadCount(response.data.data.unread_count);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await notificationsAPI.markRead(notification.id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
        );
      } catch {
        // non-critical — leave as unread rather than block navigation
      }
    }
    if (notification.link) navigate(notification.link);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // non-critical
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="group relative" onMouseEnter={fetchNotifications}>
      <button
        className="relative flex h-11 w-11 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100"
        aria-label="Notifications"
      >
        <FiBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <div className="invisible absolute right-0 z-50 mt-2 w-80 rounded-xl border border-gray-100 bg-white py-1 opacity-0 shadow-card-hover transition-all group-hover:visible group-hover:opacity-100">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <p className="font-semibold text-gray-900">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400">No notifications yet</p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`block w-full px-4 py-3 text-left text-sm hover:bg-gray-50 ${
                    notification.is_read ? '' : 'bg-primary-50/50'
                  }`}
                >
                  <p className="font-semibold text-gray-900">{notification.title}</p>
                  {notification.message && <p className="mt-0.5 text-xs text-gray-500">{notification.message}</p>}
                </button>
              ))
            )}
          </div>
      </div>
    </div>
  );
};

export default NotificationBell;
