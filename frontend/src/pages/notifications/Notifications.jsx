import React, { useState, useEffect } from 'react';
import { notificationAPI } from '../../api/notifications';
import { FiUser, FiAlertTriangle, FiEdit2, FiPackage, FiArrowUp, FiArrowDown, FiBell } from 'react-icons/fi';

const TYPE_ICONS = {
  login: <FiUser />,
  low_stock: <FiAlertTriangle />,
  edit: <FiEdit2 />,
  arrival: <FiPackage />,
  stock_in: <FiArrowUp />,
  stock_out: <FiArrowDown />,
  info: <FiBell />,
};

const TYPE_STYLE = {
  low_stock: "notif-icon-danger",
  stock_out: "notif-icon-warn",
  edit: "notif-icon-warn",
  login: "notif-icon-info",
  arrival: "notif-icon-info",
  stock_in: "notif-icon-info",
  info: "notif-icon-info",
};

function timeAgo(iso) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch every page from the API and combine into one list
  const loadAll = async () => {
    try {
      let all = [];
      let pageNum = 1;
      while (true) {
        const response = await notificationAPI.getAll(pageNum);
        const data = response.data;
        if (Array.isArray(data)) {
          all = data;
          break;
        }
        all = [...all, ...(data.results ?? [])];
        if (!data.next) break; // no more pages
        pageNum += 1;
      }
      setNotifs(all);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  if (loading) return <h2>Loading...</h2>;

  const unread = notifs.filter(n => !n.is_read).length;

  const clickNotif = async (n) => {
    if (n.is_read) return;
    try {
      await notificationAPI.markAsRead(n.id);
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
    } catch (error) {
      console.log(error);
    }
  };

  const markAll = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifs(prev => prev.map(x => ({ ...x, is_read: true })));
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <div className="page-intro">
        <div>
          <h1>Notifications</h1>
          <p>{unread} unread alerts</p>
        </div>
        <button className="btn btn-secondary" onClick={markAll}>Mark all as read</button>
      </div>

      <div className="card">
        {notifs.length === 0 && (
          <p style={{ padding: 20, color: "#a87c9e" }}>No notifications yet.</p>
        )}
        {notifs.map(n => (
          <div
            key={n.id}
            onClick={() => clickNotif(n)}
            style={{
              display: "flex", gap: 14, padding: "14px 20px",
              borderBottom: "1px solid #f8eef5", cursor: "pointer",
              background: n.is_read ? "#fff" : "#fdf0f7", transition: "background 0.15s",
            }}
          >
           <div className={`notif-icon ${TYPE_STYLE[n.notif_type] || "notif-icon-info"}`}>
              {TYPE_ICONS[n.notif_type] || <FiBell />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontSize: 14, fontWeight: n.is_read ? 400 : 600, color: "#2c1a26" }}>
                  {n.title}
                </div>
                <span style={{ fontSize: 11, color: "#a87c9e", whiteSpace: "nowrap", marginLeft: 12 }}>
                  {timeAgo(n.created_at)}
                </span>
              </div>
              <div className="notif-text" style={{ marginTop: 3 }}>{n.message}</div>
            </div>
            {!n.is_read && (
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e84e7a", marginTop: 4, flexShrink: 0 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}