import React, { useState, useEffect } from 'react';
import { orderAPI } from "../../api/orders";
import { productAPI } from "../../api/products";
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FiPlus, FiEye, FiEdit2, FiPrinter, FiTrash2, FiSearch } from 'react-icons/fi';

const emptyOrder = {
  invoice_number: "", customer_name: "", status: "pending",
  payment_method: "cash", discount_type: "percent", discount_value: 0,
  shipping_address: "", notes: "", items: [],
};
const emptyItem = { product: "", quantity: 1, unit_price: "" };

const STATUS_LABELS = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const PAYMENT_LABELS = {
  cash: "Cash",
  card: "Card",
  bank_transfer: "Bank Transfer",
  qr: "QR / ABA",
};

// Mirrors ALLOWED_TRANSITIONS in apps/orders/serializers.py — keep both in sync.
const ALLOWED_TRANSITIONS = {
  pending: ["pending", "processing", "cancelled"],
  processing: ["processing", "shipped", "cancelled"],
  shipped: ["shipped", "delivered", "cancelled"],
  delivered: ["delivered"],
  cancelled: ["cancelled", "pending"],
};

export function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  const [products, setProducts] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingStatus, setEditingStatus] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [form, setForm] = useState(emptyOrder);

  const loadOrders = async (status = "", keyword = "", pageNum = 1) => {
    try {
      const response = await orderAPI.getAll(status, keyword, pageNum);
      setOrders(response.data.results);
      setCount(response.data.count);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productAPI.getAll();
      const data = response.data;
      setProducts(Array.isArray(data) ? data : data.results ?? []);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => { loadProducts(); }, []);
  useEffect(() => { setPage(1); }, [filter, search]);
  useEffect(() => { loadOrders(filter, search, page); }, [filter, search, page]);

  if (loading) return <h2>Loading...</h2>;

  const addItemRow = () => setForm({ ...form, items: [...form.items, { ...emptyItem }] });

  const updateItemRow = (index, field, value) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    if (field === "product") {
      const p = products.find(pr => String(pr.id) === String(value));
      if (p) items[index].unit_price = p.price;
    }
    setForm({ ...form, items });
  };

  const removeItemRow = (index) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  // Live totals shown inside the Add/Edit form
  const formSubtotal = form.items.reduce(
    (sum, i) => sum + Number(i.quantity || 0) * Number(i.unit_price || 0), 0
  );
  const formDiscount = form.discount_type === "percent"
    ? formSubtotal * (Number(form.discount_value || 0) / 100)
    : Number(form.discount_value || 0);
  const formTotal = Math.max(formSubtotal - formDiscount, 0);

  const openAdd = () => {
    setForm(emptyOrder);
    setEditingId(null);
    setEditingStatus(null);
    setShowAdd(true);
  };

  const openEdit = (order) => {
    setForm({
      invoice_number: order.invoice_number,
      customer_name: order.customer_name,
      status: order.status,
      payment_method: order.payment_method,
      discount_type: order.discount_type,
      discount_value: order.discount_value,
      shipping_address: order.shipping_address || "",
      notes: order.notes || "",
      items: order.items.map(i => ({
        product: i.product, quantity: i.quantity, unit_price: i.unit_price,
      })),
    });
    setEditingId(order.id);
    setEditingStatus(order.status);
    setShowAdd(true);
  };

  const handleSaveOrder = async () => {
    if (form.items.length === 0) {
      alert("Please add at least one product.");
      return;
    }
    if (form.items.some(item => !item.product)) {
      alert("Please select a product for every line item.");
      return;
    }
    try {
      if (editingId) {
        await orderAPI.update(editingId, form);
      } else {
        await orderAPI.create(form);
      }
      setShowAdd(false);
      setForm(emptyOrder);
      setEditingId(null);
      setEditingStatus(null);
      loadOrders(filter, search, page);
    } catch (error) {
      console.error(error);
      if (error.response) {
        alert(error.response.data.detail || JSON.stringify(error.response.data));
      } else {
        alert("Something went wrong.");
      }
    }
  };

  const handleDelete = async () => {
    try {
      await orderAPI.delete(showDelete.id);
      setShowDelete(null);
      loadOrders(filter, search, page);
    } catch (error) {
      console.error(error);
      if (error.response) {
        alert(error.response.data.detail || JSON.stringify(error.response.data));
      } else {
        alert("Something went wrong.");
      }
    }
  };

  const handleStatusChange = async (order, newStatus) => {
    try {
      await orderAPI.patch(order.id, { status: newStatus });
      loadOrders(filter, search, page);
    } catch (error) {
      console.error(error);
      if (error.response) {
        alert(error.response.data.detail || JSON.stringify(error.response.data));
      } else {
        alert("Something went wrong.");
      }
    }
  };

  // Print Invoice / Download PDF — opens a printable window.
  // In the print dialog, choose a printer to print OR "Save as PDF" to download.
  const printInvoice = (order) => {
    const discountLabel = order.discount_type === "percent"
      ? `${Number(order.discount_value)}%`
      : `$${Number(order.discount_value).toFixed(2)}`;

    const rows = order.items.map(item => `
      <tr>
        <td>${item.product_name}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">$${Number(item.unit_price).toFixed(2)}</td>
        <td style="text-align:right">$${Number(item.subtotal).toFixed(2)}</td>
      </tr>`).join("");

    const html = `
      <html>
      <head>
        <title>Invoice ${order.invoice_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          h1 { color: #d23369; margin-bottom: 0; }
          .sub { color: #888; margin-top: 4px; }
          .meta { margin: 24px 0; line-height: 1.7; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border-bottom: 1px solid #ddd; padding: 10px 8px; text-align: left; }
          th { background: #faf0f5; }
          .totals { margin-top: 20px; text-align: right; line-height: 1.9; }
          .grand { font-size: 18px; font-weight: bold; color: #d23369; }
          .notes { margin-top: 24px; font-size: 13px; color: #666; }
        </style>
      </head>
      <body>
        <h1>listé</h1>
        <div class="sub">Inventory Management System</div>
        <div class="meta">
          <strong>Invoice:</strong> ${order.invoice_number}<br/>
          <strong>Date:</strong> ${order.date}<br/>
          <strong>Customer:</strong> ${order.customer_name}<br/>
          ${order.shipping_address ? `<strong>Shipping address:</strong> ${order.shipping_address}<br/>` : ""}
          <strong>Payment:</strong> ${PAYMENT_LABELS[order.payment_method] || order.payment_method}<br/>
          <strong>Status:</strong> ${STATUS_LABELS[order.status] || order.status}
        </div>
        <table>
          <thead>
            <tr><th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit price</th><th style="text-align:right">Subtotal</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="totals">
          Subtotal: $${Number(order.subtotal).toFixed(2)}<br/>
          Discount: ${discountLabel}<br/>
          <span class="grand">Total: $${Number(order.total).toFixed(2)}</span>
        </div>
        ${order.notes ? `<div class="notes"><strong>Notes:</strong> ${order.notes}</div>` : ""}
      </body>
      </html>`;

    const win = window.open("", "_blank", "width=800,height=900");
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  const totalPages = Math.ceil(count / 20);

  return (
    <div>
      <div className="page-intro">
        <div>
          <h1>Orders</h1>
          <p>{count} orders — tracking sales and fulfillment.</p>
        </div>
        <button className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }} onClick={openAdd}>
          <FiPlus /> Add order
        </button>
      </div>

      <div className="toolbar">
      <div className="toolbar-left">
          <div className="search-wrap" style={{ maxWidth: 260 }}>
            <span className="search-icon"><FiSearch /></span>
            <input
              className="search-input"
              placeholder="Search orders…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-bar">
            {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map(f => (
              <button
                key={f}
                className={`filter-chip ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
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
                <th>Invoice #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 500 }}>{o.invoice_number}</td>
                  <td>{o.date}</td>
                  <td>{o.customer_name}</td>
                  <td>{o.items.length} item{o.items.length !== 1 ? "s" : ""}</td>
                  <td style={{ fontWeight: 500 }}>${Number(o.total).toFixed(2)}</td>
                  <td>{PAYMENT_LABELS[o.payment_method] || o.payment_method}</td>
                  <td>
                    <select
                      className="select-field"
                      style={{ padding: "4px 8px", fontSize: 12.5 }}
                      value={o.status}
                      disabled={ALLOWED_TRANSITIONS[o.status]?.length <= 1}
                      onChange={(e) => handleStatusChange(o, e.target.value)}
                    >
                      {(ALLOWED_TRANSITIONS[o.status] || [o.status]).map(s => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div className="actions-cell">
                    <button className="action-btn" onClick={() => setShowDetail(o)} title="View"><FiEye /></button>
                      <button className="action-btn" onClick={() => openEdit(o)} title="Edit"><FiEdit2 /></button>
                      <button className="action-btn" onClick={() => printInvoice(o)} title="Print / Download PDF"><FiPrinter /></button>
                      <button className="action-btn danger" onClick={() => setShowDelete(o)} title="Delete"><FiTrash2 /></button>
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
            <button key={p} className={`page-btn ${page === p ? "active" : ""}`} onClick={() => setPage(p)}>
              {p}
            </button>
          ))}
          <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button>
        </div>
      </div>

      {showAdd && (
        <Modal
          title={editingId ? `Edit order ${form.invoice_number}` : "Add new order"}
          onClose={() => setShowAdd(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveOrder}>
              {editingId ? "Save changes" : "Save order"}
            </button>
          </>}
        >
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Invoice number</label>
              <input className="input-field" value={form.invoice_number}
                onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                placeholder="Auto-generated if left blank"
                disabled={!!editingId} />
            </div>
            <div className="form-group">
              <label className="form-label">Customer name</label>
              <input className="input-field" value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="select-field" value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {(editingId ? ALLOWED_TRANSITIONS[editingStatus] : Object.keys(STATUS_LABELS)).map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Payment method</label>
              <select className="select-field" value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Discount type</label>
              <select className="select-field" value={form.discount_type}
                onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
                <option value="percent">Percent (%)</option>
                <option value="amount">Amount ($)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">
                Discount {form.discount_type === "percent" ? "(%)" : "($)"}
              </label>
              <input className="input-field" type="number" min="0"
                max={form.discount_type === "percent" ? 100 : undefined}
                value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Shipping address</label>
            <input className="input-field" value={form.shipping_address}
              onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
              placeholder="Street, city…" />
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <input className="input-field" value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional notes…" />
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
                  onChange={(e) => updateItemRow(i, "quantity", e.target.value)} placeholder="Qty" />
              </div>
              <div className="form-group" style={{ display: "flex", gap: 8 }}>
                <input className="input-field" type="number" value={item.unit_price}
                  onChange={(e) => updateItemRow(i, "unit_price", e.target.value)} placeholder="Unit price" />
                <button className="action-btn danger" onClick={() => removeItemRow(i)} title="Remove"><FiTrash2 /></button>
              </div>
            </div>
          ))}
          <button className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }} onClick={addItemRow}><FiPlus /> Add product</button>

          <div style={{ textAlign: "right", marginTop: 16, lineHeight: 1.8 }}>
            <div>Subtotal: <strong>${formSubtotal.toFixed(2)}</strong></div>
            <div>Discount: <strong>−${formDiscount.toFixed(2)}</strong></div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Total: ${formTotal.toFixed(2)}</div>
          </div>
        </Modal>
      )}

      {showDetail && (
        <Modal title={`Order ${showDetail.invoice_number}`} onClose={() => setShowDetail(null)}>
          <p><strong>Customer:</strong> {showDetail.customer_name}</p>
          <p><strong>Date:</strong> {showDetail.date}</p>
          <p><strong>Status:</strong> <StatusBadge status={showDetail.status} /></p>
          <p><strong>Payment:</strong> {PAYMENT_LABELS[showDetail.payment_method] || showDetail.payment_method}</p>
          {showDetail.shipping_address && <p><strong>Shipping address:</strong> {showDetail.shipping_address}</p>}
          {showDetail.notes && <p><strong>Notes:</strong> {showDetail.notes}</p>}
          <table style={{ width: "100%", marginTop: 16 }}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {showDetail.items.map(item => (
                <tr key={item.id}>
                  <td>{item.product_name}</td>
                  <td>{item.quantity}</td>
                  <td>${Number(item.unit_price).toFixed(2)}</td>
                  <td>${Number(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ textAlign: "right", marginTop: 12, lineHeight: 1.8 }}>
            <div>Subtotal: ${Number(showDetail.subtotal).toFixed(2)}</div>
            <div>
              Discount: {showDetail.discount_type === "percent"
                ? `${Number(showDetail.discount_value)}%`
                : `$${Number(showDetail.discount_value).toFixed(2)}`}
            </div>
            <div style={{ fontWeight: 700 }}>Total: ${Number(showDetail.total).toFixed(2)}</div>
          </div>
          <div style={{ textAlign: "right", marginTop: 12 }}>
          <button className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => printInvoice(showDetail)}>
              <FiPrinter /> Print / Download PDF
            </button>
          </div>
        </Modal>
      )}

      {showDelete && (
        <Modal title="Delete order" onClose={() => setShowDelete(null)} size="sm"
          footer={<>
            <button className="btn btn-secondary" onClick={() => setShowDelete(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </>}
        >
          <p>Are you sure you want to delete <strong>{showDelete.invoice_number}</strong>? This action cannot be undone.</p>
        </Modal>
      )}
    </div>
  );
}