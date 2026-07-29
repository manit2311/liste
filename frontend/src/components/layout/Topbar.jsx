import React, { useState, useEffect, useRef } from 'react';
import { notificationAPI } from '../../api/notifications';
import { useAuthStore } from '../../store/authStore';
import { FiBell, FiUser, FiAlertTriangle, FiEdit2, FiPackage, FiArrowUp, FiArrowDown } from 'react-icons/fi';

const TYPE_ICONS = {
  login: <FiUser />, low_stock: <FiAlertTriangle />, edit: <FiEdit2 />,
  arrival: <FiPackage />, stock_in: <FiArrowUp />, stock_out: <FiArrowDown />, info: <FiBell />,
};

function timeAgo(iso) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export function Topbar({ page, onSearch, onNavigate }) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [unreadList, setUnreadList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const ROLE_DISPLAY = {
  super_admin: "Super Admin",
  admin: "Boss",
  staff: "Supervisor",
  };
  const displayName = user?.username || user?.email || 'User';
  const displayRole = ROLE_DISPLAY[user?.role] || user?.role || 'Staff';

  const loadUnread = async () => {
    try {
      const response = await notificationAPI.getUnread();
      const data = response.data;
      const list = Array.isArray(data) ? data : data.results ?? [];
      const count = Array.isArray(data) ? data.length : data.count ?? 0;
      setUnreadList(list.slice(0, 4)); // newest 4 only
      setUnreadCount(count);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadUnread();
    const timer = setInterval(loadUnread, 30000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const clickBellItem = async (n) => {
    try {
      await notificationAPI.markAsRead(n.id);
      loadUnread();
    } catch (error) {
      console.log(error);
    }
  };

  const pageTitle = {
    dashboard: "Dashboard",
    products: "Products",
    categories: "Categories",
    suppliers: "Suppliers",
    inventory: "Inventory",
    orders: "Orders",
    "purchase-orders": "Purchase orders",
    warehouses: "Warehouses",
    notifications: "Notifications",
    audit: "Audit log",
    users: "User management",
  };

  return (
    <header className="topbar">
  <span className="page-title">{pageTitle[page] || "listé"}</span>
      <div style={{ marginLeft: "auto" }} />
      <div className="topbar-actions">

        {/* Bell */}
        <div style={{ position: "relative" }} ref={notifRef}>
        <button
            className="icon-btn"
            onClick={() => {
              if (!showNotifs) loadUnread();
              setShowNotifs(v => !v);
            }}
          >
            <FiBell />
            {unreadCount > 0 && <div className="notif-dot" />}
          </button>
          {showNotifs && (
            <div className="notification-panel">
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0dcea", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Notifications</span>
                <span className="badge badge-red">{unreadCount} new</span>
              </div>
              {unreadList.length === 0 && (
                <div style={{ padding: 16, fontSize: 13, color: "#a87c9e", textAlign: "center" }}>
                  You're all caught up !
                </div>
              )}
              {unreadList.map(n => (
                <div key={n.id} className="notif-item" onClick={() => clickBellItem(n)} style={{ cursor: "pointer" }}>
                  <div className="notif-icon notif-icon-info">
                  {TYPE_ICONS[n.notif_type] || <FiBell />}
                  </div>
                  <div>
                    <div className="notif-text">{n.message}</div>
                    <div className="notif-time">{timeAgo(n.created_at)}</div>
                  </div>
                </div>
              ))}
              <div style={{ padding: "10px 16px", textAlign: "center" }}>
              <button
                  className="btn btn-ghost"
                  style={{ fontSize: 12, borderRadius: "var(--radius-lg)", transition: "background var(--transition-base), color var(--transition-base)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-hover)"; e.currentTarget.style.color = "var(--primary-dark)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary-alt)"; }}
                  onClick={() => { setShowNotifs(false); onNavigate && onNavigate("notifications"); }}
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div style={{ position: "relative" }} ref={profileRef}>
        <button className="icon-btn" onClick={() => setShowProfile(v => !v)}>
            <FiUser />
          </button>
          {showProfile && (
            <div
              style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                background: "#fff", borderRadius: 12,
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                minWidth: 220, zIndex: 100, overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid #f0dcea" }}>
                <div className="avatar">{displayName.charAt(0).toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#2c1a26" }}>{displayName}</div>
                  <div style={{ fontSize: 12, color: "#a87c9e", textTransform: "capitalize" }}>{displayRole}</div>
                </div>
              </div>
              <button
                onClick={() => { setShowProfile(false); logout(); }}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "11px 16px", background: "none", border: "none",
                  cursor: "pointer", color: "#d23369", fontSize: 14, fontWeight: 600,
                }}
              >
                Log out
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}