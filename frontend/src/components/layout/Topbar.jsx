import React, { useState, useEffect, useRef } from 'react';
import { notificationAPI } from '../../api/notifications';
import { companyAPI } from '../../api/companies';
import { useAuthStore } from '../../store/authStore';
import { useCompanyStore } from '../../store/companyStore';
import { isBoss, isSuperAdmin } from '../../constants/roles';
import {
  FiBell, FiUser, FiAlertTriangle, FiEdit2, FiPackage,
  FiArrowUp, FiArrowDown, FiEye, FiEyeOff, FiChevronDown, FiGlobe
} from 'react-icons/fi';

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
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showCompanySwitcher, setShowCompanySwitcher] = useState(false);
  const [unreadList, setUnreadList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [myCompany, setMyCompany] = useState(null);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const privacyRef = useRef(null);
  const switcherRef = useRef(null);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const boss = isBoss(user);
  const superAdmin = isSuperAdmin(user);

  const { companies, selectedCompanyId, setCompanies, setSelectedCompany } = useCompanyStore();

  const ROLE_DISPLAY = {
    super_admin: "Super Admin",
    admin: "Boss",
    staff: "Supervisor",
  };
  const displayName = user?.username || 'User';
  const displayRole = ROLE_DISPLAY[user?.role] || user?.role || 'Staff';

  const loadUnread = async () => {
    try {
      const response = await notificationAPI.getUnread();
      const data = response.data;
      const list = Array.isArray(data) ? data : data.results ?? [];
      const count = Array.isArray(data) ? data.length : data.count ?? 0;
      setUnreadList(list.slice(0, 4));
      setUnreadCount(count);
    } catch (error) {
      console.log(error);
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await companyAPI.getAll();
      const data = response.data;
      const list = Array.isArray(data) ? data : data.results ?? [];
      setCompanies(list);

      if (superAdmin) {
        // Super admin defaults to first company
        if (!selectedCompanyId && list.length > 0) {
          setSelectedCompany(list[0].id);
        }
      } else if (boss && !superAdmin) {
        // Boss — find their own company
        const mine = list.find(c =>
          c.name === user?.company_name ||
          (user?.company_name && c.name === user.company_name)
        );
        setMyCompany(mine || list[0] || null);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadUnread();
    const timer = setInterval(loadUnread, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user) loadCompanies();
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (privacyRef.current && !privacyRef.current.contains(e.target)) setShowPrivacy(false);
      if (switcherRef.current && !switcherRef.current.contains(e.target)) setShowCompanySwitcher(false);
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

  const togglePrivacy = async () => {
    if (!myCompany) return;
    setSavingPrivacy(true);
    try {
      await companyAPI.update(myCompany.id, { is_private: !myCompany.is_private });
      setMyCompany({ ...myCompany, is_private: !myCompany.is_private });
      // Refresh companies list
      loadCompanies();
    } catch (error) {
      console.log(error);
      alert("Failed to update privacy setting.");
    } finally {
      setSavingPrivacy(false);
    }
  };

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  const pageTitle = {
    dashboard: "Dashboard", products: "Products", categories: "Categories",
    suppliers: "Suppliers", inventory: "Inventory", orders: "Orders",
    "purchase-orders": "Purchase orders", warehouses: "Warehouses",
    notifications: "Notifications", audit: "Audit log", users: "User management",
    "platform-companies": "Companies", "platform-users": "Platform Users",
    "platform-audit": "Platform Audit",
  };

  return (
    <header className="topbar">
      <span className="page-title">{pageTitle[page] || "listé"}</span>
      <div style={{ marginLeft: "auto" }} />
      <div className="topbar-actions">

        {/* ── BOSS: Privacy toggle button ── */}
        {boss && !superAdmin && myCompany && (
          <div style={{ position: "relative" }} ref={privacyRef}>
            <button
              onClick={() => setShowPrivacy(v => !v)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 12px", borderRadius: 20,
                border: `1.5px solid ${myCompany.is_private ? '#fde8e8' : '#f0dcea'}`,
                background: myCompany.is_private ? '#fff8f8' : '#fdf8fc',
                color: myCompany.is_private ? '#c0392b' : '#a82d68',
                fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {myCompany.is_private ? <FiEyeOff size={13} /> : <FiEye size={13} />}
              {myCompany.name}
              <FiChevronDown size={11} style={{
                transform: showPrivacy ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.15s'
              }} />
            </button>

            {showPrivacy && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                background: "#fff", borderRadius: 12,
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                minWidth: 260, zIndex: 100, overflow: "hidden",
                border: "1px solid #f0dcea",
              }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid #f8eef5" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#2c1a26" }}>{myCompany.name}</div>
                  <div style={{ fontSize: 11, color: "#a87c9e", marginTop: 2 }}>Super Admin data access</div>
                </div>

                <div style={{ padding: "12px 16px", borderBottom: "1px solid #f8eef5" }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 12px", borderRadius: 8,
                    background: myCompany.is_private ? '#fff8f8' : '#f0fdf4',
                    border: `1px solid ${myCompany.is_private ? '#fde8e8' : '#bbf7d0'}`,
                  }}>
                    {myCompany.is_private
                      ? <FiEyeOff size={14} color="#c0392b" />
                      : <FiEye size={14} color="#2c8a4d" />
                    }
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: myCompany.is_private ? '#c0392b' : '#2c8a4d' }}>
                        {myCompany.is_private ? "Hidden from Super Admin" : "Visible to Super Admin"}
                      </div>
                      <div style={{ fontSize: 11, color: "#a87c9e", marginTop: 1 }}>
                        {myCompany.is_private
                          ? "Super Admin sees a blurred placeholder"
                          : "Super Admin can view your data"
                        }
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: "12px 16px" }}>
                  <button
                    onClick={() => { togglePrivacy(); setShowPrivacy(false); }}
                    disabled={savingPrivacy}
                    style={{
                      width: "100%", padding: "9px 14px", borderRadius: 8,
                      border: "none", cursor: savingPrivacy ? "not-allowed" : "pointer",
                      background: myCompany.is_private ? '#e8f8ee' : '#fde8e8',
                      color: myCompany.is_private ? '#1e7a45' : '#c0392b',
                      fontSize: 13, fontWeight: 600,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    {myCompany.is_private
                      ? <><FiEye size={13} /> Share with Super Admin</>
                      : <><FiEyeOff size={13} /> Hide from Super Admin</>
                    }
                  </button>
                  <div style={{ fontSize: 11, color: "#a87c9e", marginTop: 8, lineHeight: 1.5, textAlign: "center" }}>
                    Only affects Super Admin's platform view.<br />Your team is not affected.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SUPER ADMIN: Company switcher ── */}
        {superAdmin && companies.length > 0 && (
          <div style={{ position: "relative" }} ref={switcherRef}>
            <button
              onClick={() => setShowCompanySwitcher(v => !v)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 12px", borderRadius: 20,
                border: "1.5px solid #f0dcea",
                background: "#fdf8fc",
                color: "#a82d68",
                fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <FiGlobe size={13} />
              {selectedCompany ? selectedCompany.name : "All Companies"}
              <FiChevronDown size={11} style={{
                transform: showCompanySwitcher ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.15s'
              }} />
            </button>

            {showCompanySwitcher && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                background: "#fff", borderRadius: 12,
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                minWidth: 220, zIndex: 100, overflow: "hidden",
                border: "1px solid #f0dcea",
              }}>
                <div style={{ padding: "10px 14px", borderBottom: "1px solid #f8eef5" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#a87c9e", letterSpacing: "0.05em" }}>
                    VIEW COMPANY DATA
                  </div>
                </div>

                {companies.map((c, i) => (
                  <div
                    key={c.id}
                    onClick={() => { setSelectedCompany(c.id); setShowCompanySwitcher(false); }}
                    style={{
                      padding: "10px 16px", cursor: "pointer",
                      background: selectedCompanyId === c.id ? '#fdf0f7' : '#fff',
                      borderLeft: selectedCompanyId === c.id ? '3px solid #c9407f' : '3px solid transparent',
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={e => { if (selectedCompanyId !== c.id) e.currentTarget.style.background = '#fdf8fc'; }}
                    onMouseLeave={e => { if (selectedCompanyId !== c.id) e.currentTarget.style.background = '#fff'; }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: selectedCompanyId === c.id ? 600 : 400, color: selectedCompanyId === c.id ? '#c9407f' : '#2c1a26' }}>
                        {c.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#a87c9e", marginTop: 1 }}>
                        {c.user_count ?? 0} users · {c.is_active ? "Active" : "Inactive"}
                        {c.is_private && " · 🔒 Private"}
                      </div>
                    </div>
                    {selectedCompanyId === c.id && (
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#c9407f" }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bell */}
        <div style={{ position: "relative" }} ref={notifRef}>
          <button
            className="icon-btn"
            onClick={() => { if (!showNotifs) loadUnread(); setShowNotifs(v => !v); }}
          >
            <FiBell />
            {unreadCount > 0 && <div className="notif-dot" />}
          </button>
          {showNotifs && (
            <div className="notification-panel">
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0dcea", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Notifications</span>
                {unreadCount > 0 && <span className="badge badge-red">{unreadCount} new</span>}
              </div>
              {unreadList.length === 0 && (
                <div style={{ padding: 16, fontSize: 13, color: "#a87c9e", textAlign: "center" }}>
                  You're all caught up!
                </div>
              )}
              {unreadList.map(n => (
                <div key={n.id} className="notif-item" onClick={() => clickBellItem(n)} style={{ cursor: "pointer" }}>
                  <div className="notif-icon notif-icon-info">{TYPE_ICONS[n.notif_type] || <FiBell />}</div>
                  <div>
                    <div className="notif-text">{n.message}</div>
                    <div className="notif-time">{timeAgo(n.created_at)}</div>
                  </div>
                </div>
              ))}
              <div style={{ padding: "10px 16px", textAlign: "center" }}>
                <button className="btn btn-ghost" style={{ fontSize: 12 }}
                  onClick={() => { setShowNotifs(false); onNavigate && onNavigate("notifications"); }}>
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
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              background: "#fff", borderRadius: 12,
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              minWidth: 220, zIndex: 100, overflow: "hidden",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid #f0dcea" }}>
                <div className="avatar">{displayName.charAt(0).toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#2c1a26" }}>{displayName}</div>
                  <div style={{ fontSize: 12, color: "#a87c9e" }}>{displayRole}</div>
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