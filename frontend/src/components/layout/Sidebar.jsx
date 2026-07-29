import React, { useState, useRef, useEffect } from 'react';
import { NAV, PLATFORM_NAV } from '../../constants/navigation';
import { useAuthStore } from '../../store/authStore';
import { canAccess, isSuperAdmin } from '../../constants/roles';

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
  const superAdmin = isSuperAdmin(user);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-text">listé</div>
        <div className="logo-sub">
          {superAdmin ? "Platform Admin" : "Inventory system"}
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
          <div className="avatar" style={{
            background: superAdmin ? '#a82d68' : undefined
          }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <div className="user-name">{displayName}</div>
            <div className="user-role" style={{
              color: superAdmin ? '#a82d68' : undefined, fontWeight: superAdmin ? 600 : 400
            }}>
              {displayRole}
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
              padding: 6, minWidth: 150, zIndex: 100,
            }}>
              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '9px 12px', background: 'none', border: 'none',
                  borderRadius: 6, cursor: 'pointer', color: '#d23369',
                  fontSize: 14, fontWeight: 600,
                }}
              >
                Log out
              </button>
              <button
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '9px 12px', background: 'none', border: 'none',
                  borderRadius: 6, cursor: 'pointer', color: '#6b5b66', fontSize: 14,
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}