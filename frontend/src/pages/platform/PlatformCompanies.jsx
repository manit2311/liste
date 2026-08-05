import React, { useState, useEffect } from 'react';
import { Circle } from 'lucide-react';
import { companyAPI } from '../../api/companies';
import { Modal } from '../../components/common/Modal';
import { FiEye, FiEyeOff, FiPlus } from 'react-icons/fi';

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
    if (!window.confirm(`Are you sure you want to ${action} ${c.name}? ${c.is_active ? "All users of this company will be blocked from logging in." : ""}`)) return;
    try {
      await companyAPI.update(c.id, { is_active: !c.is_active });
      load();
    } catch (error) {
      console.log(error);
    }
  };

  // Feature 4 — toggle privacy (boss hides data from super admin)
  const togglePrivacy = async (c) => {
    const action = c.is_private ? "share" : "hide";
    if (!window.confirm(`${action === "hide" ? "Hide" : "Share"} ${c.name}'s data from Super Admin view?`)) return;
    try {
      await companyAPI.update(c.id, { is_private: !c.is_private });
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
        <button className="btn btn-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          onClick={() => { setForm(emptyForm); setShowAdd(true); }}>
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
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                      {c.is_private && (
                        <span style={{
                          fontSize: 10, background: "#fde8e8", color: "#c0392b",
                          borderRadius: 4, padding: "1px 6px", fontWeight: 500
                        }}>
                          Hidden
                        </span>
                      )}
                    </div>
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
                    {/* Feature 4 — privacy indicator */}
                    {c.is_private ? (
                      <span style={{
                        fontSize: 12, color: "#c0392b", display: "flex",
                        alignItems: "center", gap: 4
                      }}>
                        <FiEyeOff size={13} /> Hidden from me
                      </span>
                    ) : (
                      <span style={{
                        fontSize: 12, color: "#2c8a4d", display: "flex",
                        alignItems: "center", gap: 4
                      }}>
                        <FiEye size={13} /> Shared
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="actions-cell">
                      {/* Feature 1 — activate/deactivate */}
                      <button
                        className="action-btn"
                        title={c.is_active ? "Deactivate company (blocks all users)" : "Activate company"}
                        onClick={() => toggleActive(c)}
                      >
                        {c.is_active
                          ? <Circle size={13} fill="#e84e7a" color="#e84e7a" />
                          : <Circle size={13} fill="#2c8a4d" color="#2c8a4d" />
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Blur overlay cards for private companies — Feature 4 */}
      {companies.filter(c => c.is_private).length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 14, color: "#a87c9e", marginBottom: 12 }}>
            🔒 Hidden companies — data not visible to you
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
            {companies.filter(c => c.is_private).map(c => (
              <div key={c.id} style={{
                background: "#fff", borderRadius: 12, padding: 20,
                border: "1.5px solid #f0dcea", position: "relative", overflow: "hidden"
              }}>
                {/* Blurred content */}
                <div style={{ filter: "blur(4px)", userSelect: "none" }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "#a87c9e" }}>Products: ████</div>
                  <div style={{ fontSize: 12, color: "#a87c9e" }}>Orders: ████</div>
                  <div style={{ fontSize: 12, color: "#a87c9e" }}>Revenue: $████</div>
                </div>
                {/* Overlay label */}
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  background: "rgba(255,255,255,0.7)",
                }}>
                  <FiEyeOff size={24} color="#a87c9e" />
                  <div style={{ fontWeight: 600, color: "#a82d68", marginTop: 8, fontSize: 13 }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#a87c9e", marginTop: 4, textAlign: "center" }}>
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
            <input className="input-field" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. My Shop" />
          </div>
          <div className="form-group">
            <label className="form-label">Slug (unique ID, no spaces)</label>
            <input className="input-field" value={form.slug}
              onChange={(e) => setForm({
                ...form,
                slug: e.target.value.toLowerCase().replace(/\s+/g, '-')
              })}
              placeholder="e.g. my-shop" />
            <div style={{ fontSize: 11.5, color: "#a87c9e", marginTop: 4 }}>
              Lowercase letters, numbers, and hyphens only.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}