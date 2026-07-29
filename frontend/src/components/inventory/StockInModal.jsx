import React, { useState, useEffect } from 'react';
import { productAPI } from '../../api/products';
import { categoryAPI } from '../../api/categories';
import { supplierAPI } from '../../api/suppliers';
import { inventoryAPI } from '../../api/inventory';
import { Modal } from '../common/Modal';

function unwrapList(data) {
  if (Array.isArray(data)) return { list: data, count: data.length };
  return { list: data?.results ?? [], count: data?.count ?? 0 };
}

function errorMessage(err) {
  if (err?.response?.status === 401) return "Please log in to view this data.";
  const data = err?.response?.data;
  if (data?.detail) return data.detail;
  if (data && typeof data === "object") {
    const firstKey = Object.keys(data)[0];
    if (firstKey) {
      const val = data[firstKey];
      return Array.isArray(val) ? val[0] : String(val);
    }
  }
  return err?.message || "Something went wrong.";
}

const emptyQuickProduct = { name: "", sku: "", price: "", category: "", supplier: "", reorder_point: "" };

/**
 * Self-contained "Stock in" modal: search & add multiple existing products
 * (or create a brand new one on the fly) into a running list, each with an
 * editable quantity and cost, then Save posts one real 'in' transaction per
 * row to the backend.
 *
 * Loads its own product/category/supplier data, so it can be dropped into
 * any page (Inventory, Dashboard, etc.) without prop drilling.
 *
 * Props:
 *   onClose: () => void        - called when the modal should close
 *   onSaved: () => void        - called after a successful save, so the
 *                                 parent page can refresh its own data
 */
export function StockInModal({ onClose, onSaved }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [stockInSearch, setStockInSearch] = useState("");
  const [stockInItems, setStockInItems] = useState([]);
  const [stockInSubmitting, setStockInSubmitting] = useState(false);
  const [stockInError, setStockInError] = useState(null);

  const [showQuickAddProduct, setShowQuickAddProduct] = useState(false);
  const [quickProductForm, setQuickProductForm] = useState(emptyQuickProduct);
  const [quickAddSubmitting, setQuickAddSubmitting] = useState(false);
  const [quickAddError, setQuickAddError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [productsRes, categoriesRes, suppliersRes] = await Promise.all([
          productAPI.getAll(),
          categoryAPI.getAll(),
          supplierAPI.getAll(),
        ]);
        setProducts(unwrapList(productsRes.data).list);
        setCategories(unwrapList(categoriesRes.data).list);
        setSuppliers(unwrapList(suppliersRes.data).list);
      } catch (err) {
        console.log(err);
      }
    })();
  }, []);

  const stockInResults = stockInSearch.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(stockInSearch.toLowerCase()) ||
        (p.sku || "").toLowerCase().includes(stockInSearch.toLowerCase())
      )
    : [];

  function addStockInItem(product) {
    setStockInItems(prev => {
      if (prev.some(item => item.id === product.id)) return prev;
      return [...prev, { id: product.id, name: product.name, sku: product.sku, qty: 1, cost: product.price ?? "" }];
    });
    setStockInSearch("");
  }

  function updateStockInItem(id, field, value) {
    setStockInItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  }

  function removeStockInItem(id) {
    setStockInItems(prev => prev.filter(item => item.id !== id));
  }

  const canSaveStockIn = stockInItems.length > 0 &&
    stockInItems.every(item => Number(item.qty) > 0) &&
    !stockInSubmitting;

  async function saveStockIn() {
    if (!canSaveStockIn) return;
    setStockInSubmitting(true);
    setStockInError(null);
    try {
      for (const item of stockInItems) {
        await inventoryAPI.create({
          product: item.id,
          transaction_type: "in",
          quantity: Number(item.qty),
          unit_price: item.cost === "" ? undefined : Number(item.cost),
          remarks: "",
        });
      }
      onSaved && onSaved();
      onClose();
    } catch (err) {
      setStockInError(errorMessage(err));
    } finally {
      setStockInSubmitting(false);
    }
  }

  function openQuickAddProduct() {
    setQuickProductForm(emptyQuickProduct);
    setQuickAddError(null);
    setShowQuickAddProduct(true);
  }

  async function submitQuickAddProduct() {
    if (!quickProductForm.name.trim()) {
      setQuickAddError("Product name is required.");
      return;
    }
    setQuickAddSubmitting(true);
    setQuickAddError(null);
    try {
      const payload = {
        ...quickProductForm,
        quantity: 0,
        reorder_point: quickProductForm.reorder_point === "" ? 5 : Number(quickProductForm.reorder_point),
        price: quickProductForm.price === "" ? 0 : Number(quickProductForm.price),
        category: quickProductForm.category === "" ? null : quickProductForm.category,
        supplier: quickProductForm.supplier === "" ? null : quickProductForm.supplier,
      };
      const res = await productAPI.create(payload);
      const newProduct = res.data;
      setProducts(prev => [...prev, newProduct]);
      addStockInItem(newProduct);
      setShowQuickAddProduct(false);
    } catch (err) {
      setQuickAddError(errorMessage(err));
    } finally {
      setQuickAddSubmitting(false);
    }
  }

  return (
    <Modal
      title="Stock in"
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={stockInSubmitting}>Cancel</button>
          <button className="btn btn-primary" onClick={saveStockIn} disabled={!canSaveStockIn}>
            {stockInSubmitting ? "Saving…" : "💾 Save"}
          </button>
        </>
      }
    >
      {stockInError && (
        <div style={{ color: "#e84e7a", fontSize: 13, marginBottom: 12 }}>{stockInError}</div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div className="search-wrap" style={{ maxWidth: "100%" }}>
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search products…"
            style={{ width: "100%" }}
            value={stockInSearch}
            onChange={e => setStockInSearch(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ marginTop: 8 }}
          onClick={openQuickAddProduct}
        >
          ＋ Add new product
        </button>

        {showQuickAddProduct && (
          <div className="shrink-selected-item" style={{ marginTop: 12 }}>
            {quickAddError && (
              <div style={{ color: "#e84e7a", fontSize: 13, marginBottom: 10 }}>{quickAddError}</div>
            )}
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Product name</label>
                <input className="input-field" value={quickProductForm.name}
                  onChange={e => setQuickProductForm({ ...quickProductForm, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">SKU code</label>
                <input className="input-field" value={quickProductForm.sku}
                  onChange={e => setQuickProductForm({ ...quickProductForm, sku: e.target.value })} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="select-field" value={quickProductForm.category}
                  onChange={e => setQuickProductForm({ ...quickProductForm, category: e.target.value })}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Supplier</label>
                <select className="select-field" value={quickProductForm.supplier}
                  onChange={e => setQuickProductForm({ ...quickProductForm, supplier: e.target.value })}>
                  <option value="">Select supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Sale price ($)</label>
                <input className="input-field" type="number" value={quickProductForm.price}
                  onChange={e => setQuickProductForm({ ...quickProductForm, price: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Reorder at</label>
                <input className="input-field" type="number" value={quickProductForm.reorder_point}
                  onChange={e => setQuickProductForm({ ...quickProductForm, reorder_point: e.target.value })}
                  placeholder="5" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setShowQuickAddProduct(false)} disabled={quickAddSubmitting}>Cancel</button>
              <button className="btn btn-primary" onClick={submitQuickAddProduct} disabled={quickAddSubmitting}>
                {quickAddSubmitting ? "Creating…" : "Create & add to list"}
              </button>
            </div>
          </div>
        )}

        {stockInSearch.trim() !== "" && (
          <div className="shrink-results-list" style={{ maxHeight: 220 }}>
            {stockInResults.length === 0 && (
              <div style={{ padding: "16px 8px", textAlign: "center", color: "var(--text-muted-alt)", fontSize: 13.5 }}>
                No products match your search
              </div>
            )}
            {stockInResults.map(p => (
              <button key={p.id} className="shrink-result-row" onClick={() => addStockInItem(p)}>
                <div>
                  <div className="shrink-result-name">{p.name}</div>
                  <div className="shrink-result-sku">{p.sku || "—"}</div>
                </div>
                <div className="shrink-result-stock">{p.quantity} on hand</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {stockInItems.length === 0 ? (
        <div style={{ padding: "20px 8px", textAlign: "center", color: "var(--text-muted-alt)", fontSize: 13.5 }}>
          Search above and click a product to add it here.
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Item name</th>
                <th>SKU</th>
                <th>Quantity</th>
                <th>Cost ($)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {stockInItems.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 500 }}>{item.name}</td>
                  <td style={{ fontSize: 12.5 }}><span className="tag">{item.sku || "—"}</span></td>
                  <td>
                    <input
                      type="number"
                      className="input-field"
                      min={1}
                      value={item.qty}
                      onChange={e => updateStockInItem(item.id, "qty", e.target.value)}
                      style={{ width: 80, height: 32 }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input-field"
                      step="0.01"
                      value={item.cost}
                      onChange={e => updateStockInItem(item.id, "cost", e.target.value)}
                      style={{ width: 90, height: 32 }}
                    />
                  </td>
                  <td>
                    <button className="action-btn danger" onClick={() => removeStockInItem(item.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}