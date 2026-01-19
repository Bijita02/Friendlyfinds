import { createContext, useContext, useEffect, useState } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) setNotifications(data.notifications);
    } catch (err) {
      console.error('Notification fetch error:', err);
    }
  };

  // 🔥 INITIAL LOAD + AUTO REFRESH
  useEffect(() => {
    fetchNotifications(); // first load

    const interval = setInterval(() => {
      fetchNotifications(); // auto refresh every 5s
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, fetchNotifications }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
