import React, { useState, useRef, useEffect } from 'react';
import { NAV, PLATFORM_NAV } from '../../constants/navigation';
import { useAuthStore } from '../../store/authStore';
import { canAccess, isSuperAdmin } from '../../constants/roles';
import { FiLogOut, FiX } from 'react-icons/fi';

export function Sidebar({ current, onSelect, unreadCount = 0 }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const ROLE_DISPLAY = {
    super_admin: "Super Admin",
    admin: "Boss",
    staff: "Supervisor",
  };

  const displayName = user?.username || 'User';
  const displayRole = ROLE_DISPLAY[user?.role] || user?.role || 'Staff';
  const companyName = user?.company_name || null;
  const superAdmin = isSuperAdmin(user);

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src="/logo.PNG"
            alt="listé logo"
            style={{
              width: 44, height: 44, borderRadius: 10,
              objectFit: "cover", flexShrink: 0,
              boxShadow: "0 2px 8px rgba(180,100,150,0.2)"
            }}
          />
          <div>
            <div className="logo-text">listé</div>
            <div className="logo-sub">
              {superAdmin ? "Platform Admin" : "Inventory system"}
            </div>
          </div>
        </div>
      </div>

      {/* Regular nav */}
      <div className="sidebar-section">
        <div className="sidebar-section-label">Menu</div>
        {NAV.filter(item => canAccess(user, item.id)).map(item => (
          <button
            key={item.id}
            className={`nav-item ${current === item.id ? "active" : ""}`}
            onClick={() => onSelect(item.id)}
          >
            <span className="nav-icon">{item.icon && <item.icon />}</span>
            {item.label}
            {item.id === "notifications" && unreadCount > 0 && (
              <span className="nav-badge">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Platform section — super admin only */}
      {superAdmin && (
        <div className="sidebar-section">
          <div className="sidebar-section-label">Platform</div>
          {PLATFORM_NAV.map(item => (
            <button
              key={item.id}
              className={`nav-item ${current === item.id ? "active" : ""}`}
              onClick={() => onSelect(item.id)}
            >
              <span className="nav-icon">{item.icon && <item.icon />}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* User card */}
      <div className="sidebar-footer">
        <div className="user-card" style={{ position: 'relative' }} ref={menuRef}>
          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div className="avatar" style={{
              background: superAdmin ? '#a82d68' : user?.role === 'admin' ? '#c9407f' : '#a87c9e'
            }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
            {/* Small company badge on avatar */}
            {companyName && (
              <div style={{
                position: "absolute", bottom: -2, right: -2,
                width: 14, height: 14, borderRadius: "50%",
                background: "#fff", border: "1.5px solid #f0dcea",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 8, fontWeight: 700, color: "#a82d68",
              }}>
                {companyName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="user-info">
            <div className="user-name">{displayName}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <div className="user-role" style={{
                color: superAdmin ? '#a82d68' : user?.role === 'admin' ? '#c9407f' : '#a87c9e',
                fontWeight: superAdmin || user?.role === 'admin' ? 600 : 400,
                fontSize: 11,
              }}>
                {displayRole}
              </div>
              {companyName && (
                <div style={{ fontSize: 10, color: "#c4a0bc", fontStyle: "italic" }}>
                  {companyName}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              marginLeft: 'auto', color: '#c4a0bc', fontSize: 16,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px 8px', borderRadius: 6,
            }}
            aria-label="User menu"
          >
            ⋯
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', bottom: 'calc(100% + 8px)', right: 0,
              background: '#fff', borderRadius: 10,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              padding: 6, minWidth: 180, zIndex: 100,
            }}>
              <div style={{
                padding: "8px 12px 10px",
                borderBottom: "1px solid #f8eef5",
                marginBottom: 4,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#2c1a26" }}>
                  {displayName}
                </div>
                <div style={{ fontSize: 11, color: "#a87c9e" }}>
                  {displayRole}{companyName ? ` · ${companyName}` : ""}
                </div>
              </div>

              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', textAlign: 'left',
                  padding: '9px 12px', background: 'none', border: 'none',
                  borderRadius: 6, cursor: 'pointer', color: '#d23369',
                  fontSize: 14, fontWeight: 600,
                }}
              >
                <FiLogOut size={14} /> Log out
              </button>
              <button
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', textAlign: 'left',
                  padding: '9px 12px', background: 'none', border: 'none',
                  borderRadius: 6, cursor: 'pointer', color: '#6b5b66', fontSize: 14,
                }}
              >
                <FiX size={14} /> Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}