import React, { useState, useEffect } from 'react';
import { categoryAPI } from "../../api/categories";
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';
import { isBoss } from '../../constants/roles';

export function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });

  const user = useAuthStore((s) => s.user);
  const boss = isBoss(user);

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      const data = response.data;
      setCategories(Array.isArray(data) ? data : data.results ?? []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddCategory = async () => {
    try {
      await categoryAPI.create(form);
      setShowAdd(false);
      setForm({ name: "", description: "" });
      loadCategories();
    } catch (error) {
      console.log(error);
    }
  };

  const handleEdit = async () => {
    try {
      await categoryAPI.update(showEdit.id, form);
      setShowEdit(null);
      loadCategories();
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async () => {
    try {
      await categoryAPI.delete(showDelete.id);
      setShowDelete(null);
      loadCategories();
    } catch (error) {
      console.log(error);
    }
  };

  if (loading) return <h2>Loading...</h2>;

  return (
    <div>
      <div className="page-intro">
        <div>
          <h1>Categories</h1>
          <p>Organize products into groups for easier management.</p>
        </div>
        {/* Only boss sees the Add button */}
        {boss && (
          <button className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={() => { setForm({ name: "", description: "" }); setShowAdd(true); }}>
            <FiPlus /> Add category
          </button>
        )}
      </div>

      <div className="card">
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f8eef5" }}>
          <div className="search-wrap" style={{ maxWidth: 260 }}>
            <span className="search-icon"><FiSearch /></span>
            <input
              className="search-input"
              placeholder="Search category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Products</th>
                <th>Status</th>
                {boss && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={boss ? 6 : 5} style={{ padding: 20, color: "#a87c9e" }}>
                    No categories found.
                  </td>
                </tr>
              )}
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <span style={{
                      background: "#f8eef5", color: "#a87c9e",
                      borderRadius: 20, padding: "2px 10px", fontSize: 13
                    }}>{c.id}</span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td style={{ color: "#a87c9e", fontSize: 13 }}>{c.description || "-"}</td>
                  <td>
                    <span style={{
                      background: "#f0d6eb", color: "#a82d68",
                      borderRadius: 20, padding: "2px 10px", fontSize: 13, fontWeight: 600
                    }}>
                      {c.product_count ?? c.products?.length ?? 0}
                    </span>
                  </td>
                  <td><StatusBadge status="active" /></td>
                  {boss && (
                    <td>
                      <div className="actions-cell">
                        <button className="action-btn" title="Edit"
                          onClick={() => {
                            setForm({ name: c.name, description: c.description || "" });
                            setShowEdit(c);
                          }}>
                          <FiEdit2 />
                        </button>
                        <button className="action-btn danger" title="Delete"
                          onClick={() => setShowDelete(c)}>
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {boss && showAdd && (
        <Modal
          title="Add category"
          onClose={() => setShowAdd(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddCategory}>Save</button>
          </>}
        >
          <div className="form-group">
            <label className="form-label">Category name</label>
            <input className="input-field" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Skincare" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="textarea-field" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description" />
          </div>
        </Modal>
      )}

      {boss && showEdit && (
        <Modal
          title="Edit category"
          onClose={() => setShowEdit(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setShowEdit(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEdit}>Save changes</button>
          </>}
        >
          <div className="form-group">
            <label className="form-label">Category name</label>
            <input className="input-field" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="textarea-field" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </Modal>
      )}

      {boss && showDelete && (
        <Modal
          title="Delete category"
          onClose={() => setShowDelete(null)}
          size="sm"
          footer={<>
            <button className="btn btn-secondary" onClick={() => setShowDelete(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </>}
        >
          <p style={{ fontSize: 14, color: "#4a2e42", lineHeight: 1.6 }}>
            Delete <strong>{showDelete.name}</strong>? Products in this category won't be deleted.
          </p>
        </Modal>
      )}
    </div>
  );
}