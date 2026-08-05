import React, { useState, useEffect } from 'react';
import { Search, ArrowUp, RefreshCw, Pencil, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { categoryAPI } from "../../api/categories";
import { supplierAPI } from "../../api/suppliers";
import { warehouseAPI } from "../../api/warehouses";
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { productAPI } from "../../api/products";
import { saveAs } from "file-saver";

const emptyForm = {
  name: "",
  sku: "",
  price: "",
  quantity: "",
  reorder_point: "",
  description: "",
  categories: [],
  supplier: "",
};

export function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [showEdit, setShowEdit] = useState(null);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [assign, setAssign] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      const data = response.data;
      setCategories(Array.isArray(data) ? data : data.results ?? []);
    } catch (error) { console.log(error); }
  };

  const loadSuppliers = async () => {
    try {
      const response = await supplierAPI.getAll();
      const data = response.data;
      setSuppliers(Array.isArray(data) ? data : data.results ?? []);
    } catch (error) { console.log(error); }
  };

  const loadWarehouses = async () => {
    try {
      const response = await warehouseAPI.getAll();
      const data = response.data;
      setWarehouses(Array.isArray(data) ? data : data.results ?? []);
    } catch (error) { console.log(error); }
  };

  const loadProducts = async (status = "", keyword = "", pageNum = 1) => {
    try {
      const response = await productAPI.getAll(status, keyword, pageNum);
      const data = response.data;
      if (Array.isArray(data)) {
        setProducts(data);
        setCount(data.length);
      } else {
        setProducts(data.results ?? []);
        setCount(data.count ?? 0);
      }
    } catch (error) { console.log(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadCategories(); loadSuppliers(); loadWarehouses(); }, []);
  useEffect(() => { loadProducts(filter, search, page); }, [filter, search, page]);
  useEffect(() => { setPage(1); }, [filter, search]);

  if (loading) return <h2>Loading...</h2>;

  const cleanPayload = () => ({
    ...form,
    categories: form.categories,
    supplier: form.supplier === "" ? null : form.supplier,
  });

  const toggleCategory = (id) => {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.includes(id)
        ? prev.categories.filter(c => c !== id)
        : [...prev.categories, id]
    }));
  };

  const handleAddProduct = async () => {
    try {
      await productAPI.create(cleanPayload());
      setShowAdd(false);
      loadProducts();
    } catch (error) {
      console.log(error);
      if (error.response) alert(JSON.stringify(error.response.data));
    }
  };

  const handleEdit = async () => {
    try {
      await productAPI.update(showEdit.id, cleanPayload());
      loadProducts();
      setShowEdit(null);
    } catch (error) {
      console.log(error);
      if (error.response) alert(JSON.stringify(error.response.data));
    }
  };

  const handleDelete = async () => {
    try {
      await productAPI.delete(showDelete.id);
      loadProducts();
      setShowDelete(null);
    } catch (error) { console.log(error); }
  };

  const handleAssign = async () => {
    const qty = Number(assign.quantity);
    const free = assign.product.unassigned ?? 0;
    if (!assign.warehouse) { alert("Please choose a warehouse."); return; }
    if (!qty || qty <= 0) { alert("Please enter a quantity greater than 0."); return; }
    if (qty > free) { alert(`Only ${free} unassigned units — you can't assign ${qty}.`); return; }
    try {
      await productAPI.assign(assign.product.id, { warehouse: assign.warehouse, quantity: qty });
      setAssign(null);
      loadProducts();
    } catch (error) {
      console.error(error);
      if (error.response) alert(error.response.data.detail || JSON.stringify(error.response.data));
      else alert("Something went wrong.");
    }
  };

  const displayedProducts = products.filter((p) => {
    if (filter === "active") return p.quantity > 0;
    if (filter === "low") return p.quantity <= 10;
    if (filter === "archived") return true;
    return true;
  });

  const exportCSV = () => {
    let csv = "Name,SKU,Price,Total stock,Categories,Unassigned\n";
    products.forEach((p) => {
      const cats = (p.category_names ?? []).join(" | ");
      csv += `${p.name},${p.sku},${p.price},${p.quantity},"${cats}",${p.unassigned}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "products.csv");
  };

  const CategoryCheckboxes = () => (
    <div style={{
      border: "1px solid #f0dcea", borderRadius: 10,
      padding: "8px 12px", background: "#fdf8fc",
      maxHeight: 150, overflowY: "auto"
    }}>
      {categories.length === 0 && (
        <div style={{ fontSize: 13, color: "#a87c9e" }}>No categories yet.</div>
      )}
      {categories.map(c => (
        <label key={c.id} style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "4px 0", cursor: "pointer", fontSize: 14, color: "#2c1a26"
        }}>
          <input
            type="checkbox"
            checked={form.categories.includes(c.id)}
            onChange={() => toggleCategory(c.id)}
          />
          {c.name}
        </label>
      ))}
    </div>
  );

  return (
    <div>
      <div className="page-intro">
        <div>
          <h1>Products</h1>
          <p>{products.length} total products across {categories.length} categories</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setShowAdd(true); }}>
          ＋ Add product
        </button>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="inline-search" style={{ maxWidth: 300 }}>
            <span className="search-icon" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#c4a0bc" }}><Search size={15} /></span>
            <input
              className="search-input"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
          <div className="filter-bar">
            {["all", "active", "low", "archived"].map(f => (
              <button
                key={f}
                className={`filter-chip ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "All" : f === "active" ? "In stock" : f === "low" ? "Low stock" : "Archived"}
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-secondary" onClick={exportCSV}><ArrowUp size={14} style={{ marginRight: 4, verticalAlign: -2 }} />Export CSV</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Categories</th>
                <th>Supplier</th>
                <th>Price</th>
                <th>Total stock</th>
                <th>Warehouses</th>
                <th>Reorder at</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedProducts.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td><span className="tag">{p.sku}</span></td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {(p.category_names ?? []).map((name, i) => (
                        <span key={i} className="tag">{name}</span>
                      ))}
                      {(!p.category_names || p.category_names.length === 0) && (
                        <span style={{ color: "#a87c9e", fontSize: 12 }}>-</span>
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: 12.5, color: "#a87c9e" }}>{p.supplier_name}</td>
                  <td style={{ fontWeight: 500 }}>${p.price}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: p.quantity <= 5 ? "#e84e7a" : "#2c1a26" }}>
                      {p.quantity}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {(p.warehouse_stocks ?? []).map(ws => (
                        <span key={ws.id} className="tag">{ws.warehouse_name}: {ws.quantity}</span>
                      ))}
                      {(p.unassigned ?? 0) > 0 && (
                        <span className="tag" style={{ opacity: 0.65 }}>Free: {p.unassigned}</span>
                      )}
                      {(p.warehouse_stocks ?? []).length === 0 && (p.unassigned ?? 0) === 0 && (
                        <span style={{ fontSize: 12, color: "#a87c9e" }}>-</span>
                      )}
                    </div>
                  </td>
                  <td style={{ color: p.quantity <= p.reorder_point ? "#e84e7a" : "#a87c9e", fontWeight: p.quantity <= p.reorder_point ? 600 : 400 }}>
                    {p.reorder_point}
                  </td>
                  <td>
                    <StatusBadge status={
                      p.quantity <= 0 ? "out" :
                      p.quantity <= p.reorder_point ? "low" : "active"
                    } />
                  </td>
                  <td>
                    <div className="actions-cell">
                      {filter !== "archived" && (
                        <button className="action-btn" title="Assign stock to a warehouse"
                          onClick={() => setAssign({ product: p, warehouse: "", quantity: "" })}>
                          <RefreshCw size={14} />
                        </button>
                      )}
                      {filter !== "archived" ? (
                        <>
                          <button className="action-btn" title="Edit"
                            onClick={() => {
                              setForm({
                                name: p.name,
                                sku: p.sku,
                                price: p.price,
                                quantity: p.quantity,
                                reorder_point: p.reorder_point,
                                description: p.description,
                                categories: p.categories ?? [],
                                supplier: p.supplier ?? "",
                              });
                              setShowEdit(p);
                            }}><Pencil size={14} /></button>
                          <button className="action-btn danger" title="Archive"
                            onClick={() => setShowDelete(p)}><Trash2 size={14} /></button>
                        </>
                      ) : (
                        <button className="action-btn" title="Restore"
                          onClick={async () => {
                            await productAPI.restore(p.id);
                            loadProducts(filter, search, page);
                          }}><RotateCcw size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
          {Array.from({ length: Math.ceil(count / 10) }, (_, i) => i + 1).map(p => (
            <button key={p} className={`page-btn ${page === p ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="page-btn" disabled={page >= Math.ceil(count / 10)} onClick={() => setPage(page + 1)}>›</button>
        </div>
      </div>

      {showAdd && (
        <Modal title="Add new product" onClose={() => setShowAdd(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddProduct}>Save Product</button>
          </>}
        >
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Product name</label>
              <input className="input-field" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">SKU code</label>
              <input className="input-field" value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Categories (tick all that apply)</label>
              <CategoryCheckboxes />
            </div>
            <div className="form-group">
              <label className="form-label">Supplier</label>
              <select className="select-field" value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}>
                <option value="">Select supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Sale price ($)</label>
              <input className="input-field" type="number" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Total quantity</label>
              <input className="input-field" type="number" value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Reorder at</label>
              <input className="input-field" type="number" value={form.reorder_point}
                onChange={(e) => setForm({ ...form, reorder_point: e.target.value })}
                placeholder="5" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="input-field" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </Modal>
      )}

      {showEdit && (
        <Modal title="Edit product" onClose={() => setShowEdit(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setShowEdit(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEdit}>Save changes</button>
          </>}
        >
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Product name</label>
              <input className="input-field" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">SKU code</label>
              <input className="input-field" value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Categories (tick all that apply)</label>
              <CategoryCheckboxes />
            </div>
            <div className="form-group">
              <label className="form-label">Supplier</label>
              <select className="select-field" value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}>
                <option value="">Select supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Sale price ($)</label>
              <input className="input-field" type="number" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Total quantity</label>
              <input className="input-field" type="number" value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Reorder at</label>
              <input className="input-field" type="number" value={form.reorder_point}
                onChange={(e) => setForm({ ...form, reorder_point: e.target.value })}
                placeholder="5" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="input-field" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </Modal>
      )}

      {showDelete && (
        <Modal title="Archive product" onClose={() => setShowDelete(null)} size="sm"
          footer={<>
            <button className="btn btn-secondary" onClick={() => setShowDelete(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Archive</button>
          </>}
        >
          <p style={{ fontSize: 14, color: "#4a2e42", lineHeight: 1.6 }}>
            Archive <strong>{showDelete.name}</strong>? It disappears from daily lists but all history
            is kept. You can restore it anytime from the Archived filter.
          </p>
        </Modal>
      )}

      {assign && (
        <Modal title={`Assign ${assign.product.name} to a warehouse`}
          onClose={() => setAssign(null)} size="sm"
          footer={<>
            <button className="btn btn-secondary" onClick={() => setAssign(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAssign}>Assign</button>
          </>}
        >
          <p style={{ fontSize: 13, color: "#a87c9e", marginBottom: 14 }}>
            Total: <strong>{assign.product.quantity}</strong> · Unassigned:{" "}
            <strong>{assign.product.unassigned ?? 0}</strong>
            {(assign.product.warehouse_stocks ?? []).length > 0 && (
              <><br />{(assign.product.warehouse_stocks ?? []).map(ws => `${ws.warehouse_name}: ${ws.quantity}`).join(" · ")}</>
            )}
          </p>
          <div className="form-group">
            <label className="form-label">Warehouse</label>
            <select className="select-field" value={assign.warehouse}
              onChange={(e) => setAssign({ ...assign, warehouse: e.target.value })}>
              <option value="">Select warehouse</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Quantity to assign</label>
            <input className="input-field" type="number" min="1"
              max={assign.product.unassigned ?? 0}
              value={assign.quantity}
              onChange={(e) => setAssign({ ...assign, quantity: e.target.value })}
              placeholder={`Max ${assign.product.unassigned ?? 0}`}
            />
            {Number(assign.quantity) > (assign.product.unassigned ?? 0) && (
              <div style={{ color: "#d23369", fontSize: 12.5, marginTop: 6 }}>
                <AlertTriangle size={13} style={{ marginRight: 4, verticalAlign: -2 }} />Only {assign.product.unassigned ?? 0} unassigned — reduce the amount.
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}