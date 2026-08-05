import React, { useState, useEffect } from 'react';
import { Check, X, Ban, Truck, Package, RefreshCw, Eye, Printer, Trash2, Plus } from 'lucide-react';
import { purchaseOrderAPI } from '../../api/purchaseOrders';
import { supplierAPI } from '../../api/suppliers';
import { warehouseAPI } from '../../api/warehouses';
import { productAPI } from '../../api/products';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuthStore } from '../../store/authStore';
import { isBoss } from '../../constants/roles';

const emptyPO = { supplier: "", expected_date: "", warehouse: "", notes: "", status: "pending", items: [] };
const emptyItem = { product: "", quantity: 1, price: "" };

const STATUS_LABELS = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  in_transit: "In transit",
  received: "Received",
  cancelled: "Cancelled",
};

function unwrapList(data) {
  if (Array.isArray(data)) return { list: data, count: data.length };
  return { list: data?.results ?? [], count: data?.count ?? 0 };
}

export function PurchaseOrders() {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);

  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [form, setForm] = useState(emptyPO);

  const user = useAuthStore((s) => s.user);
  const boss = isBoss(user);

  const loadPOs = async (status = "", keyword = "", pageNum = 1) => {
    try {
      const response = await purchaseOrderAPI.getAll(status, keyword, pageNum);
      const { list, count } = unwrapList(response.data);
      setPos(list);
      setCount(count);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await supplierAPI.getAll();
      setSuppliers(unwrapList(response.data).list);
    } catch (error) { console.log(error); }
  };

  const loadWarehouses = async () => {
    try {
      const response = await warehouseAPI.getAll();
      setWarehouses(unwrapList(response.data).list);
    } catch (error) { console.log(error); }
  };

  const loadProducts = async () => {
    try {
      const response = await productAPI.getAll();
      setProducts(unwrapList(response.data).list);
    } catch (error) { console.log(error); }
  };

  useEffect(() => { loadSuppliers(); loadWarehouses(); loadProducts(); }, []);
  useEffect(() => { setPage(1); }, [filter, search]);
  useEffect(() => { loadPOs(filter, search, page); }, [filter, search, page]);

  if (loading) return <h2>Loading...</h2>;

  const poNumber = (po) => po.po_number ?? `PO-${String(po.id).padStart(4, "0")}`;
  const poTotal = (po) =>
    po.total ?? po.items.reduce((sum, i) => sum + Number(i.quantity) * Number(i.price), 0);

  const addItemRow = () => setForm({ ...form, items: [...form.items, { ...emptyItem }] });

  const updateItemRow = (index, field, value) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    if (field === "product") {
      const p = products.find(pr => String(pr.id) === String(value));
      if (p) items[index].price = p.price;
    }
    setForm({ ...form, items });
  };

  const removeItemRow = (index) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const handleCreatePO = async () => {
    if (!form.supplier) { alert("Please select a supplier."); return; }
    if (form.items.length === 0) { alert("Please add at least one product."); return; }
    if (form.items.some(item => !item.product)) {
      alert("Please select a product for every line item."); return;
    }
    try {
      await purchaseOrderAPI.create(form);
      setShowAdd(false);
      setForm(emptyPO);
      loadPOs(filter, search, page);
    } catch (error) {
      console.error(error);
      if (error.response) alert(error.response.data.detail || JSON.stringify(error.response.data));
      else alert("Something went wrong.");
    }
  };

  const changeStatus = async (po, newStatus, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    try {
      await purchaseOrderAPI.patch(po.id, { status: newStatus });
      loadPOs(filter, search, page);
      if (showDetail && showDetail.id === po.id) {
        setShowDetail({ ...showDetail, status: newStatus });
      }
    } catch (error) {
      console.error(error);
      if (error.response) alert(error.response.data.detail || JSON.stringify(error.response.data));
      else alert("Something went wrong.");
    }
  };

  const actionButtons = (po) => {
    if (!boss) return null; // supervisor can only view
    switch (po.status) {
      case "pending":
        return (
          <>
            <button className="action-btn" title="Approve"
              onClick={() => changeStatus(po, "approved")}><Check size={15} /></button>
            <button className="action-btn danger" title="Reject"
              onClick={() => changeStatus(po, "rejected", `Reject ${poNumber(po)}?`)}><X size={15} /></button>
            <button className="action-btn danger" title="Cancel"
              onClick={() => changeStatus(po, "cancelled", `Cancel ${poNumber(po)}?`)}><Ban size={15} /></button>
          </>
        );
      case "approved":
        return (
          <>
            <button className="action-btn" title="Mark in transit"
              onClick={() => changeStatus(po, "in_transit")}><Truck size={15} /></button>
            <button className="action-btn" title="Receive goods"
              onClick={() => changeStatus(po, "received",
                `Receive ${poNumber(po)}? Stock will be added.`)}><Package size={15} /></button>
            <button className="action-btn danger" title="Cancel"
              onClick={() => changeStatus(po, "cancelled", `Cancel ${poNumber(po)}?`)}><Ban size={15} /></button>
          </>
        );
      case "in_transit":
        return (
          <>
            <button className="action-btn" title="Receive goods"
              onClick={() => changeStatus(po, "received",
                `Receive ${poNumber(po)}? Stock will be added.`)}><Package size={15} /></button>
            <button className="action-btn danger" title="Cancel"
              onClick={() => changeStatus(po, "cancelled", `Cancel ${poNumber(po)}?`)}><Ban size={15} /></button>
          </>
        );
      case "rejected":
      case "cancelled":
        return (
          <button className="action-btn" title="Resubmit as pending"
            onClick={() => changeStatus(po, "pending")}><RefreshCw size={15} /></button>
        );
      default:
        return null;
    }
  };

  const printPO = (po) => {
    const rows = po.items.map(item => `
      <tr>
        <td>${item.product_name}</td>
        <td style="text-align:center">${item.quantity}</td>
        ${boss ? `
        <td style="text-align:right">$${Number(item.price).toFixed(2)}</td>
        <td style="text-align:right">$${(Number(item.quantity) * Number(item.price)).toFixed(2)}</td>
        ` : ''}
      </tr>`).join("");

    const html = `
      <html>
      <head>
        <title>${poNumber(po)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          h1 { color: #d23369; margin-bottom: 0; }
          .sub { color: #888; margin-top: 4px; }
          h2 { margin-top: 28px; }
          .meta { margin: 20px 0; line-height: 1.7; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border-bottom: 1px solid #ddd; padding: 10px 8px; text-align: left; }
          th { background: #faf0f5; }
          .totals { margin-top: 20px; text-align: right; font-size: 18px; font-weight: bold; color: #d23369; }
          .notes { margin-top: 24px; font-size: 13px; color: #666; }
        </style>
      </head>
      <body>
        <h1>listé</h1>
        <div class="sub">Inventory Management System</div>
        <h2>Purchase Order ${poNumber(po)}</h2>
        <div class="meta">
          ${boss ? `<strong>Supplier:</strong> ${po.supplier_name ?? "-"}<br/>` : ""}
          <strong>Order date:</strong> ${po.order_date ? String(po.order_date).slice(0, 10) : "-"}<br/>
          <strong>Expected delivery:</strong> ${po.expected_date ?? "-"}<br/>
          <strong>Status:</strong> ${STATUS_LABELS[po.status] ?? po.status}
        </div>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th style="text-align:center">Qty</th>
              ${boss ? `
              <th style="text-align:right">Unit price</th>
              <th style="text-align:right">Subtotal</th>
              ` : ''}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        ${boss ? `<div class="totals">Total cost: $${Number(poTotal(po)).toFixed(2)}</div>` : ""}
        ${po.notes ? `<div class="notes"><strong>Notes:</strong> ${po.notes}</div>` : ""}
      </body>
      </html>`;

    const win = window.open("", "_blank", "width=800,height=900");
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  const totalPages = Math.max(1, Math.ceil(count / 10));

  return (
    <div>
      <div className="page-intro">
        <div>
          <h1>Purchase orders</h1>
          <p>Track inbound orders from your suppliers.</p>
        </div>
        {boss && (
          <button className="btn btn-primary"
            onClick={() => { setForm(emptyPO); setShowAdd(true); }}>
            ＋ Create PO
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
        {[
          { label: "All POs", value: count },
          { label: "Pending", value: pos.filter(p => p.status === "pending").length },
          { label: "Approved", value: pos.filter(p => p.status === "approved").length },
          { label: "Received", value: pos.filter(p => p.status === "received").length },
        ].map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <input
            className="search-input"
            placeholder="Search purchase orders…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 260 }}
          />
          <div className="filter-bar">
            {["all", "pending", "approved", "rejected", "in_transit", "received", "cancelled"].map(f => (
              <button
                key={f}
                className={`filter-chip ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "All" : STATUS_LABELS[f]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>PO #</th>
                <th>Date</th>
                {boss && <th>Supplier</th>}
                <th>Items</th>
                {boss && <th>Total cost</th>}
                <th>Expected by</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pos.length === 0 && (
                <tr>
                  <td colSpan={boss ? 8 : 5} style={{ padding: 20, color: "#a87c9e" }}>
                    No purchase orders yet.
                  </td>
                </tr>
              )}
              {pos.map(po => (
                <tr key={po.id}>
                  <td style={{ fontWeight: 600 }}>{poNumber(po)}</td>
                  <td style={{ color: "#a87c9e", fontSize: 12 }}>
                    {po.order_date ? String(po.order_date).slice(0, 10) : "-"}
                  </td>
                  {boss && <td>{po.supplier_name ?? "-"}</td>}
                  <td>
                    <span className="badge badge-pink">
                      {po.items.length} items
                    </span>
                  </td>
                  {boss && (
                    <td style={{ fontWeight: 600 }}>
                      ${Number(poTotal(po)).toFixed(2)}
                    </td>
                  )}
                  <td style={{ fontSize: 12.5 }}>{po.expected_date ?? "-"}</td>
                  <td><StatusBadge status={po.status} /></td>
                  <td>
                    <div className="actions-cell">
                      {actionButtons(po)}
                      <button className="action-btn"
                        onClick={() => setShowDetail(po)} title="View"><Eye size={15} /></button>
                      <button className="action-btn"
                        onClick={() => printPO(po)} title="Print / PDF"><Printer size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`page-btn ${page === p ? "active" : ""}`}
              onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button>
        </div>
      </div>

      {/* Create PO Modal — boss only */}
      {boss && showAdd && (
        <Modal
          title="Create purchase order"
          onClose={() => setShowAdd(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreatePO}>Create PO</button>
          </>}
        >
          <div className="form-group">
            <label className="form-label">Supplier</label>
            <select className="select-field" value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}>
              <option value="">Select supplier</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Expected delivery</label>
              <input className="input-field" type="date" value={form.expected_date}
                onChange={(e) => setForm({ ...form, expected_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Warehouse</label>
              <select className="select-field" value={form.warehouse}
                onChange={(e) => setForm({ ...form, warehouse: e.target.value })}>
                <option value="">Select warehouse</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>

          <label className="form-label">Line items</label>
          {form.items.map((item, i) => (
            <div className="grid-3" key={i} style={{ alignItems: "end" }}>
              <div className="form-group">
                <select className="select-field" value={item.product}
                  onChange={(e) => updateItemRow(i, "product", e.target.value)}>
                  <option value="">Select product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <input className="input-field" type="number" min="1" value={item.quantity}
                  onChange={(e) => updateItemRow(i, "quantity", e.target.value)}
                  placeholder="Qty" />
              </div>
              <div className="form-group" style={{ display: "flex", gap: 8 }}>
                <input className="input-field" type="number" value={item.price}
                  onChange={(e) => updateItemRow(i, "price", e.target.value)}
                  placeholder="Unit price" />
                <button className="action-btn danger" onClick={() => removeItemRow(i)}
                  title="Remove"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          <button className="btn btn-secondary" onClick={addItemRow}><Plus size={14} style={{ marginRight: 4, verticalAlign: -2 }} />Add product</button>

          <div className="form-group" style={{ marginTop: 14 }}>
            <label className="form-label">Notes</label>
            <textarea className="textarea-field"
              placeholder="Optional notes for this purchase order…"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </Modal>
      )}

      {/* View Detail Modal */}
      {showDetail && (
        <Modal title={poNumber(showDetail)} onClose={() => setShowDetail(null)}>
          {boss && <p><strong>Supplier:</strong> {showDetail.supplier_name}</p>}
          <p><strong>Warehouse:</strong> {showDetail.warehouse_name ?? "-"}</p>
          <p><strong>Expected by:</strong> {showDetail.expected_date ?? "-"}</p>
          <p><strong>Status:</strong> <StatusBadge status={showDetail.status} /></p>
          {showDetail.notes && <p><strong>Notes:</strong> {showDetail.notes}</p>}
          <table style={{ width: "100%", marginTop: 16 }}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                {boss && <th>Unit price</th>}
              </tr>
            </thead>
            <tbody>
              {showDetail.items.map(item => (
                <tr key={item.id}>
                  <td>{item.product_name}</td>
                  <td>{item.quantity}</td>
                  {boss && <td>${Number(item.price).toFixed(2)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
          {boss && (
            <p style={{ textAlign: "right", marginTop: 12, fontWeight: 600 }}>
              Total: ${Number(poTotal(showDetail)).toFixed(2)}
            </p>
          )}
          <div style={{ textAlign: "right", marginTop: 12 }}>
            <button className="btn btn-secondary" onClick={() => printPO(showDetail)}>
              <Printer size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Print / PDF
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}