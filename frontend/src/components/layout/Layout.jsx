import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { notificationAPI } from '../../api/notifications';

export function Layout({ children, page, onPageChange }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnread();
      const data = response.data;
      setUnreadCount(Array.isArray(data) ? data.length : data.count ?? 0);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadUnreadCount();
    const timer = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(timer);
  }, [page]);

  return (
    <div className="app-shell">
      <Sidebar current={page} onSelect={onPageChange} unreadCount={unreadCount} />
      <div className="main-content">
        <Topbar page={page} onNavigate={onPageChange} />
        <div className="page-body">
          {children}
        </div>
      </div>
    </div>
  );
}