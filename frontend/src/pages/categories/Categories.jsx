import React, { useState, useEffect } from 'react';
import { categoryAPI } from "../../api/categories";
import { productAPI } from "../../api/products";
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiEye, FiDownload } from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';
import { isBoss } from '../../constants/roles';
import { saveAs } from 'file-saver';

export function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [showProducts, setShowProducts] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
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

  const loadCategoryProducts = async (category) => {
    setShowProducts(category);
    setLoadingProducts(true);
    setCategoryProducts([]);
    try {
      // Get all products and filter by category
      const response = await productAPI.getAll("", "", 1);
      const data = response.data;
      const allProducts = Array.isArray(data) ? data : data.results ?? [];
      // Filter products that belong to this category
      const filtered = allProducts.filter(p =>
        p.category_names && p.category_names.includes(category.name)
      );
      setCategoryProducts(filtered);
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const exportCSV = (category, products) => {
    let csv = `Category: ${category.name}\n`;
    csv += `Description: ${category.description || '-'}\n`;
    csv += `Total products: ${products.length}\n\n`;
    csv += "Product Name,SKU,Price,Total Stock,Reorder Point,Supplier,Status\n";
    products.forEach(p => {
      const status = !p.is_active ? "Archived" : p.quantity <= 0 ? "Out of stock" : p.quantity <= p.reorder_point ? "Low stock" : "In stock";
      csv += `${p.name},${p.sku || '-'},$${p.price},${p.quantity},${p.reorder_point},${p.supplier_name || '-'},${status}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${category.name.replace(/\s+/g, '_')}_products.csv`);
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 20, color: "#a87c9e" }}>
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
                  <td>
                    <div className="actions-cell">
                      {/* View products button — everyone can see */}
                      <button className="action-btn" title="View products in this category"
                        onClick={() => loadCategoryProducts(c)}>
                        <FiEye />
                      </button>
                      {boss && (
                        <>
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
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View products in category modal */}
      {showProducts && (
        <Modal
          title={`Products in "${showProducts.name}"`}
          onClose={() => { setShowProducts(null); setCategoryProducts([]); }}
          footer={
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
              <button
                className="btn btn-secondary"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                onClick={() => exportCSV(showProducts, categoryProducts)}
                disabled={loadingProducts || categoryProducts.length === 0}
              >
                <FiDownload size={14} /> Export CSV
              </button>
              <button className="btn btn-primary"
                onClick={() => { setShowProducts(null); setCategoryProducts([]); }}>
                Close
              </button>
            </div>
          }
        >
          {loadingProducts ? (
            <div style={{ textAlign: "center", padding: "20px", color: "#a87c9e" }}>
              Loading products...
            </div>
          ) : categoryProducts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px", color: "#a87c9e" }}>
              No products in this category yet.
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 12, fontSize: 13, color: "#a87c9e" }}>
                {categoryProducts.length} product{categoryProducts.length !== 1 ? "s" : ""} in <strong style={{ color: "#a82d68" }}>{showProducts.name}</strong>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryProducts.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 500 }}>{p.name}</td>
                        <td>
                          <span className="tag">{p.sku || "-"}</span>
                        </td>
                        <td style={{ fontWeight: 500 }}>${p.price}</td>
                        <td>
                          <span style={{
                            fontWeight: 600,
                            color: p.quantity <= 0 ? "#e84e7a" :
                              p.quantity <= p.reorder_point ? "#f59e0b" : "#2c1a26"
                          }}>
                            {p.quantity}
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={
                            !p.is_active ? "archived" :
                            p.quantity <= 0 ? "out" :
                            p.quantity <= p.reorder_point ? "low" : "active"
                          } />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Modal>
      )}

      {boss && showAdd && (
        <Modal title="Add category" onClose={() => setShowAdd(false)}
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
        <Modal title="Edit category" onClose={() => setShowEdit(null)}
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
        <Modal title="Delete category" onClose={() => setShowDelete(null)} size="sm"
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