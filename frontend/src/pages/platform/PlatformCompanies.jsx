import React, { useState, useEffect } from 'react';
import { companyAPI } from '../../api/companies';
import { Modal } from '../../components/common/Modal';
import {
  FiBell, FiUser, FiAlertTriangle, FiEdit2, FiPackage,
  FiArrowUp, FiArrowDown, FiEye, FiEyeOff, FiChevronDown, FiGlobe, FiLock
} from 'react-icons/fi';

const emptyForm = { name: "", slug: "", is_active: true };

export function PlatformCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      const response = await companyAPI.getAll();
      const data = response.data;
      setCompanies(Array.isArray(data) ? data : data.results ?? []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      alert("Name and slug are required.");
      return;
    }
    try {
      await companyAPI.create(form);
      setShowAdd(false);
      setForm(emptyForm);
      load();
    } catch (error) {
      if (error.response) alert(JSON.stringify(error.response.data));
    }
  };

  const toggleActive = async (c) => {
    const action = c.is_active ? "deactivate" : "activate";
    if (!window.confirm(
      `${c.is_active ? "Deactivate" : "Activate"} ${c.name}?` +
      (c.is_active ? " All users of this company will be blocked from logging in." : "")
    )) return;
    try {
      await companyAPI.update(c.id, { is_active: !c.is_active });
      load();
    } catch (error) {
      console.log(error);
    }
  };

  if (loading) return <h2>Loading...</h2>;

  return (
    <div>
      <div className="page-intro">
        <div>
          <h1>Companies</h1>
          <p>{companies.length} companies on the platform.</p>
        </div>
        <button
          className="btn btn-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          onClick={() => { setForm(emptyForm); setShowAdd(true); }}
        >
          <FiPlus /> Add company
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Slug</th>
                <th>Users</th>
                <th>Created</th>
                <th>Status</th>
                <th>Privacy</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 20, color: "#a87c9e" }}>
                    No companies yet.
                  </td>
                </tr>
              )}
              {companies.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>
                    {c.name}
                    {c.is_private && (
                      <span style={{
                        marginLeft: 8, fontSize: 10,
                        background: "#fde8e8", color: "#c0392b",
                        borderRadius: 4, padding: "1px 6px", fontWeight: 500
                      }}>
                        Hidden
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: 12.5, color: "#a87c9e" }}>{c.slug}</td>
                  <td>
                    <span className="badge badge-pink">{c.user_count ?? 0} users</span>
                  </td>
                  <td style={{ fontSize: 12.5 }}>
                    {String(c.created_at).slice(0, 10)}
                  </td>
                  <td>
                    <span className={`badge ${c.is_active ? "badge-pink" : "badge-blue"}`}>
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    {c.is_private ? (
                      <span style={{
                        fontSize: 12, color: "#c0392b",
                        display: "flex", alignItems: "center", gap: 4
                      }}>
                        <FiEyeOff size={13} /> Hidden from you
                      </span>
                    ) : (
                      <span style={{
                        fontSize: 12, color: "#2c8a4d",
                        display: "flex", alignItems: "center", gap: 4
                      }}>
                        <FiEye size={13} /> Shared
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="action-btn"
                        title={c.is_active ? "Deactivate company" : "Activate company"}
                        onClick={() => toggleActive(c)}
                        style={{
                          background: c.is_active ? '#fde8e8' : '#e8f8ee',
                          color: c.is_active ? '#c0392b' : '#2c8a4d',
                          border: `1px solid ${c.is_active ? '#fca5a5' : '#86efac'}`,
                          borderRadius: 6, padding: "4px 10px",
                          fontSize: 12, fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        {c.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Blur cards for private companies */}
      {companies.filter(c => c.is_private).length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 14, color: "#a87c9e", marginBottom: 12 }}>
          {c.is_private && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, marginLeft: 4 }}><FiLock size={10} /> Hidden</span>}
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 14
          }}>
            {companies.filter(c => c.is_private).map(c => (
              <div key={c.id} style={{
                background: "#fff", borderRadius: 12, padding: 20,
                border: "1.5px solid #f0dcea",
                position: "relative", overflow: "hidden"
              }}>
                <div style={{ filter: "blur(4px)", userSelect: "none" }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "#a87c9e" }}>Products: ████</div>
                  <div style={{ fontSize: 12, color: "#a87c9e" }}>Orders: ████</div>
                  <div style={{ fontSize: 12, color: "#a87c9e" }}>Revenue: $████</div>
                </div>
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  background: "rgba(255,255,255,0.75)",
                }}>
                  <FiEyeOff size={24} color="#a87c9e" />
                  <div style={{ fontWeight: 600, color: "#a82d68", marginTop: 8, fontSize: 13 }}>
                    {c.name}
                  </div>
                  <div style={{
                    fontSize: 11, color: "#a87c9e",
                    marginTop: 4, textAlign: "center", lineHeight: 1.5
                  }}>
                    This company has hidden<br />their data from Super Admin
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAdd && (
        <Modal
          title="Add company"
          onClose={() => setShowAdd(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd}>Create company</button>
          </>}
        >
          <div className="form-group">
            <label className="form-label">Company name</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. My Shop"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Slug (unique ID, no spaces)</label>
            <input
              className="input-field"
              value={form.slug}
              onChange={(e) => setForm({
                ...form,
                slug: e.target.value.toLowerCase().replace(/\s+/g, '-')
              })}
              placeholder="e.g. my-shop"
            />
            <div style={{ fontSize: 11.5, color: "#a87c9e", marginTop: 4 }}>
              Lowercase letters, numbers, and hyphens only.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}