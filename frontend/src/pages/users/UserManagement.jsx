import React, { useState, useEffect } from 'react';
import { userAPI } from '../../api/users';
import { useAuthStore } from '../../store/authStore';
import { useCompanyStore } from '../../store/companyStore';
import { isSuperAdmin } from '../../constants/roles';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FiPlus, FiSearch, FiEdit2, FiTrash2 } from 'react-icons/fi';

const ROLE_LABELS = {
  super_admin: "Super Admin",
  admin: "Boss",
  staff: "Supervisor",
};

const emptyUser = { username: "", phone: "", role: "staff", password: "", is_active: true };

export function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [form, setForm] = useState(emptyUser);

  const me = useAuthStore((s) => s.user);
  const superAdmin = isSuperAdmin(me);
  const { companies, selectedCompanyId } = useCompanyStore();
  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  const loadUsers = async () => {
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

  useEffect(() => { loadUsers(); }, [selectedCompanyId]);

  if (loading) return <h2>Loading...</h2>;

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.phone || "").includes(search)
  );

  const openAdd = () => {
    setForm(emptyUser);
    setEditingId(null);
    setShowAdd(true);
  };

  const openEdit = (u) => {
    setForm({
      username: u.username,
      phone: u.phone || "",
      role: u.role,
      password: "",
      is_active: u.is_active,
    });
    setEditingId(u.id);
    setShowAdd(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await userAPI.update(editingId, form);
      } else {
        await userAPI.create(form);
      }
      setShowAdd(false);
      setForm(emptyUser);
      setEditingId(null);
      loadUsers();
    } catch (error) {
      console.error(error);
      if (error.response) {
        alert(JSON.stringify(error.response.data));
      } else {
        alert("Something went wrong.");
      }
    }
  };

  const handleDelete = async () => {
    try {
      await userAPI.delete(showDelete.id);
      setShowDelete(null);
      loadUsers();
    } catch (error) {
      console.error(error);
      if (error.response) {
        alert(error.response.data.detail || JSON.stringify(error.response.data));
      } else {
        alert("Something went wrong.");
      }
    }
  };

  return (
    <div>
      <div className="page-intro">
        <div>
          <h1>User management</h1>
          <p>
            {superAdmin && selectedCompany
              ? `Showing users of ${selectedCompany.name}`
              : "Control who has access to the system and at what level."
            }
          </p>
        </div>
        {/* Hide Add user button for super admin — they manage via Platform Users */}
        {!superAdmin && (
          <button
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={openAdd}>
            <FiPlus /> Add user
          </button>
        )}
      </div>

      <div className="card">
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f8eef5", display: "flex", gap: 12, alignItems: "center" }}>
          <div className="search-wrap" style={{ maxWidth: 260 }}>
            <span className="search-icon"><FiSearch /></span>
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
                <th>Created</th>
                <th>Status</th>
                {!superAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={superAdmin ? 5 : 6} style={{ padding: 20, color: "#a87c9e" }}>
                    No users found.
                  </td>
                </tr>
              )}
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="avatar" style={{
                        background: u.role === 'super_admin' ? '#a82d68' :
                          u.role === 'admin' ? '#c9407f' : '#a87c9e'
                      }}>
                        {u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>
                          {u.username}
                          {me && u.id === me.id && (
                            <span style={{ fontSize: 11, color: "#a87c9e" }}> (you)</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "#a87c9e" }}>ID: {u.id}</div>
                      </div>
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
                  <td style={{ fontSize: 13 }}>
                    {u.created_at ? String(u.created_at).slice(0, 10) : "-"}
                  </td>
                  <td><StatusBadge status={u.is_active ? "active" : "inactive"} /></td>
                  {!superAdmin && (
                    <td>
                      <div className="actions-cell">
                        <button className="action-btn" onClick={() => openEdit(u)} title="Edit">
                          <FiEdit2 />
                        </button>
                        {(!me || u.id !== me.id) && (
                          <button className="action-btn danger" onClick={() => setShowDelete(u)} title="Delete">
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && !superAdmin && (
        <Modal
          title={editingId ? "Edit user" : "Add user"}
          onClose={() => setShowAdd(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>
              {editingId ? "Save changes" : "Create user"}
            </button>
          </>}
        >
          <div className="form-group">
            <label className="form-label">Username</label>
            <input className="input-field" value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Username for login" />
          </div>
          <div className="form-group">
            <label className="form-label">Phone number</label>
            <input className="input-field" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="0123456789" />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="select-field" value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="admin">Boss</option>
                <option value="staff">Supervisor</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="select-field"
                value={form.is_active ? "active" : "inactive"}
                onChange={(e) => setForm({ ...form, is_active: e.target.value === "active" })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive (can't log in)</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">
              {editingId ? "New password" : "Password"}
            </label>
            <input className="input-field" type="password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={editingId ? "Leave blank to keep current" : "Min. 8 chars, A-Z, a-z"} />
            {!editingId && (
              <div style={{ fontSize: 12, color: "#a87c9e", marginTop: 4 }}>
                Must have at least 1 uppercase, 1 lowercase, and 8+ characters.
              </div>
            )}
          </div>
        </Modal>
      )}

      {showDelete && !superAdmin && (
        <Modal
          title="Remove user"
          onClose={() => setShowDelete(null)}
          size="sm"
          footer={<>
            <button className="btn btn-secondary" onClick={() => setShowDelete(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Remove</button>
          </>}
        >
          <p style={{ fontSize: 14, color: "#4a2e42", lineHeight: 1.6 }}>
            Remove <strong>{showDelete.username}</strong> from the system?
            They'll lose all access immediately.
          </p>
        </Modal>
      )}
    </div>
  );
}