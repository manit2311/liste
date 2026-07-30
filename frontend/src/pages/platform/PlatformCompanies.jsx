import React, { useState, useEffect } from 'react';
import { companyAPI } from '../../api/companies';
import { Modal } from '../../components/common/Modal';

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
        <button className="btn btn-primary"
          onClick={() => { setForm(emptyForm); setShowAdd(true); }}>
          ＋ Add company
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 20, color: "#a87c9e" }}>
                    No companies yet.
                  </td>
                </tr>
              )}
              {companies.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td style={{ fontSize: 12.5, color: "#a87c9e" }}>{c.slug}</td>
                  <td>
                    <span className="badge badge-pink">{c.user_count} users</span>
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
                    <div className="actions-cell">
                      <button
                        className="action-btn"
                        title={c.is_active ? "Deactivate" : "Activate"}
                        onClick={() => toggleActive(c)}
                      >
                        {c.is_active ? "🔴" : "🟢"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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