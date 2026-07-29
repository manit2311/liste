import React, { useState, useEffect } from 'react';
import { userAPI } from '../../api/users';
import { StatusBadge } from '../../components/common/StatusBadge';

const ROLE_LABELS = {
  super_admin: "Super Admin",
  admin: "Boss",
  staff: "Supervisor",
};

export function PlatformUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const response = await userAPI.getAll();
      const data = response.data;
      setUsers(Array.isArray(data) ? data : data.results ?? []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <h2>Loading...</h2>;

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-intro">
        <div>
          <h1>Platform Users</h1>
          <p>{users.length} total users across the system.</p>
        </div>
      </div>

      <div className="card">
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f8eef5" }}>
          <div className="search-wrap" style={{ maxWidth: 260 }}>
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Company</th>
                <th>Created</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 20, color: "#a87c9e" }}>
                    No users found.
                  </td>
                </tr>
              )}
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="avatar">{u.username[0].toUpperCase()}</div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{u.username}</div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{u.phone || "-"}</td>
                  <td>
                    <span className={`badge ${
                      u.role === "super_admin" ? "badge-purple" :
                      u.role === "admin" ? "badge-pink" : "badge-blue"
                    }`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td style={{ fontSize: 13 }}>{u.company_name || "-"}</td>
                  <td style={{ fontSize: 13 }}>
                    {u.created_at ? String(u.created_at).slice(0, 10) : "-"}
                  </td>
                  <td><StatusBadge status={u.is_active ? "active" : "inactive"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}