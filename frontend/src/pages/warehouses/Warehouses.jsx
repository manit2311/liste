import React, { useState, useEffect } from 'react';
import { warehouseAPI } from '../../api/warehouses';
import { userAPI } from '../../api/users';
import { productAPI } from '../../api/products';
import { Modal } from '../../components/common/Modal';
import { saveAs } from "file-saver";
import { FiUpload, FiPlus, FiPackage, FiEdit2, FiTrash2, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';

const emptyForm = { name: "", location: "", capacity: "", manager: "" };

// Accepts either a plain array or a paginated {results, count} response body.
function unwrapList(data) {
  if (Array.isArray(data)) return data;
  return data?.results ?? [];
}

export function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [showStock, setShowStock] = useState(null);
  const [stockWarehouse, setStockWarehouse] = useState(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [transfer, setTransfer] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [stockTotals, setStockTotals] = useState({}); // { [warehouseId]: totalUnits }

  const loadWarehouses = async () => {
    try {
      const response = await warehouseAPI.getAll();
      setWarehouses(unwrapList(response.data));
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userAPI.getAll();
      setUsers(unwrapList(response.data));
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => { loadWarehouses(); loadUsers(); }, []);

  // Fetch each warehouse's current stock total in the background once the
  // list is loaded, so the card can show it without waiting on user action.
  useEffect(() => {
    if (warehouses.length === 0) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        warehouses.map(async (w) => {
          try {
            const response = await warehouseAPI.getStock(w.id);
            return [w.id, response.data.total_units ?? 0];
          } catch (error) {
            return [w.id, null];
          }
        })
      );
      if (!cancelled) setStockTotals(Object.fromEntries(entries));
    })();
    return () => { cancelled = true; };
  }, [warehouses]);

  if (loading) return <h2>Loading...</h2>;

  const handleAdd = async () => {
    if (!form.name.trim()) {
      alert("Please enter a warehouse name.");
      return;
    }
    try {
      await warehouseAPI.create({
        ...form,
        capacity: form.capacity === "" ? null : form.capacity,
        manager: form.manager === "" ? null : form.manager,
      });
      setShowAdd(false);
      setForm(emptyForm);
      loadWarehouses();
    } catch (error) {
      console.error(error);
      if (error.response) {
        alert(error.response.data.detail || JSON.stringify(error.response.data));
      } else {
        alert("Something went wrong.");
      }
    }
  };

  const handleEdit = async () => {
    try {
      await warehouseAPI.update(showEdit.id, {
        ...form,
        capacity: form.capacity === "" ? null : form.capacity,
        manager: form.manager === "" ? null : form.manager,
      });
      setShowEdit(null);
      loadWarehouses();
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
      await warehouseAPI.delete(showDelete.id);
      setShowDelete(null);
      loadWarehouses();
    } catch (error) {
      console.error(error);
      if (error.response) {
        alert(error.response.data.detail || JSON.stringify(error.response.data));
      } else {
        alert("Something went wrong.");
      }
    }
  };

  const openStock = async (w) => {
    setStockWarehouse(w);
    setStockLoading(true);
    setShowStock({ warehouse: w.name, products: [] });
    try {
      const response = await warehouseAPI.getStock(w.id);
      setShowStock(response.data);
    } catch (error) {
      console.log(error);
      alert("Couldn't load stock for this warehouse.");
      setShowStock(null);
    } finally {
      setStockLoading(false);
    }
  };

  const handleTransfer = async () => {
    const qty = Number(transfer.quantity);
    const onHand = transfer.product.quantity; // allocated in THIS warehouse

    if (!transfer.warehouse) {
      alert("Please choose a destination warehouse.");
      return;
    }
    if (!qty || qty <= 0) {
      alert("Please enter a quantity greater than 0.");
      return;
    }
    if (qty > onHand) {
      alert(`⚠️ Only ${onHand} in this warehouse — you can't transfer ${qty}.`);
      return;
    }
    try {
      await productAPI.transferStock(transfer.product.product_id, {
        from_warehouse: stockWarehouse.id,
        to_warehouse: transfer.warehouse,
        quantity: qty,
      });
      setTransfer(null);
      if (stockWarehouse) openStock(stockWarehouse);
    } catch (error) {
      console.error(error);
      if (error.response) {
        alert(error.response.data.detail || JSON.stringify(error.response.data));
      } else {
        alert("Something went wrong.");
      }
    }
  };

  const exportWarehouseCSV = (stockData) => {
    let csv = `Warehouse,Product,SKU,Quantity,Reorder point\n`;
    stockData.products.forEach(p => {
      csv += `${stockData.warehouse},${p.name},${p.sku || ""},${p.quantity},${p.reorder_point}\n`;
    });
    csv += `,,Total units,${stockData.total_units ?? 0},\n`;
    const today = new Date().toISOString().slice(0, 10);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `stock-${stockData.warehouse}-${today}.csv`);
  };

  const exportAllWarehousesCSV = async () => {
    try {
      let csv = `Warehouse,Product,SKU,Quantity,Reorder point\n`;
      for (const w of warehouses) {
        const response = await warehouseAPI.getStock(w.id);
        const stockData = response.data;
        stockData.products.forEach(p => {
          csv += `${stockData.warehouse},${p.name},${p.sku || ""},${p.quantity},${p.reorder_point}\n`;
        });
        csv += `${stockData.warehouse},,Total units,${stockData.total_units ?? 0},\n`;
      }
      const today = new Date().toISOString().slice(0, 10);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, `stock-all-warehouses-${today}.csv`);
    } catch (error) {
      console.error(error);
      alert("Couldn't export — is the backend running?");
    }
  };

  return (
    <div>
      <div className="page-intro">
        <div>
          <h1>Warehouses</h1>
          <p>Manage storage locations and capacity.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }} onClick={exportAllWarehousesCSV}>
            <FiUpload /> Export all stock
          </button>
          <button className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => { setForm(emptyForm); setShowAdd(true); }}>
            <FiPlus /> Add warehouse
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16, marginBottom: 22 }}>
        {warehouses.length === 0 && (
          <p style={{ color: "#a87c9e" }}>No warehouses yet — add your first one.</p>
        )}
        {warehouses.map(w => (
          <div className="card" key={w.id}>
            <div className="card-header">
              <div>
                <div className="card-title">{w.name}</div>
                <div style={{ fontSize: 12.5, color: "#a87c9e", marginTop: 2 }}>{w.location || "No location set"}</div>
              </div>
              <div className="actions-cell">
              <button className="action-btn" title="View stock" onClick={() => openStock(w)}><FiPackage /></button>
                <button
                  className="action-btn"
                  title="Edit"
                  onClick={() => {
                    setForm({
                      name: w.name,
                      location: w.location || "",
                      capacity: w.capacity ?? "",
                      manager: w.manager ?? "",
                    });
                    setShowEdit(w);
                  }}
                ><FiEdit2 /></button>
                <button className="action-btn danger" title="Delete" onClick={() => setShowDelete(w)}><FiTrash2 /></button>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: "flex", gap: 20 }}>
                <div>
                  <div className="stat-label">Manager</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{w.manager_name || "Unassigned"}</div>
                </div>
                <div>
                  <div className="stat-label">Current stock</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {stockTotals[w.id] != null ? `${Number(stockTotals[w.id]).toLocaleString()} units` : "…"}
                  </div>
                </div>
                <div>
                  <div className="stat-label">Max. capacity</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {w.capacity ? `${Number(w.capacity).toLocaleString()} units` : "Not set"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <Modal
          title="Add warehouse"
          onClose={() => setShowAdd(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd}>Save warehouse</button>
          </>}
        >
          <div className="form-group">
            <label className="form-label">Warehouse name</label>
            <input className="input-field" placeholder="e.g. North Storage"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input className="input-field" placeholder="City, Country"
              value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Total capacity (units)</label>
              <input className="input-field" type="number" placeholder="5000"
                value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Manager</label>
              <select className="select-field" value={form.manager}
                onChange={(e) => setForm({ ...form, manager: e.target.value })}>
                <option value="">Unassigned</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}

      {showEdit && (
        <Modal
          title="Edit warehouse"
          onClose={() => setShowEdit(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setShowEdit(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEdit}>Save changes</button>
          </>}
        >
          <div className="form-group">
            <label className="form-label">Warehouse name</label>
            <input className="input-field"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input className="input-field"
              value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Total capacity (units)</label>
              <input className="input-field" type="number"
                value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Manager</label>
              <select className="select-field" value={form.manager}
                onChange={(e) => setForm({ ...form, manager: e.target.value })}>
                <option value="">Unassigned</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}

      {showDelete && (
        <Modal
          title="Delete warehouse"
          onClose={() => setShowDelete(null)}
          size="sm"
          footer={<>
            <button className="btn btn-secondary" onClick={() => setShowDelete(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </>}
        >
          <p>Are you sure you want to delete <strong>{showDelete.name}</strong>? This action cannot be undone.</p>
        </Modal>
      )}

      {showStock && (
        <Modal title={`Stock in ${showStock.warehouse}`} onClose={() => setShowStock(null)}>
          {stockLoading ? (
            <p>Loading…</p>
          ) : (
            <>
              <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
                <div>
                  <div className="stat-label">Total units stored</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>
                    {Number(showStock.total_units ?? 0).toLocaleString()}
                    {showStock.capacity ? (
                      <span style={{ fontSize: 13, fontWeight: 400, color: "#a87c9e" }}>
                        {" "}/ {Number(showStock.capacity).toLocaleString()} capacity
                      </span>
                    ) : null}
                  </div>
                </div>
                <div>
                  <div className="stat-label">Products</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{showStock.products.length}</div>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ marginLeft: "auto", alignSelf: "center", display: "inline-flex", alignItems: "center", gap: 6 }}
                  onClick={() => exportWarehouseCSV(showStock)}
                >
                  <FiUpload /> Export CSV
                </button>
              </div>

              {showStock.products.length === 0 ? (
                <p style={{ color: "#a87c9e" }}>
                  No products assigned to this warehouse yet. Use the transfer button on the Products page to assign stock here.
                </p>
              ) : (
                <table style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th style={{ textAlign: "right" }}>Quantity</th>
                      <th style={{ width: 50 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {showStock.products.map(p => (
                      <tr key={p.product_id}>
                        <td>{p.name}</td>
                        <td style={{ fontSize: 12.5, color: "#a87c9e" }}>{p.sku || "-"}</td>
                        <td style={{ textAlign: "right", fontWeight: 600, color: p.total <= p.reorder_point ? "#d23369" : undefined }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                            {p.quantity}
                            {p.total <= p.reorder_point && <FiAlertTriangle size={13} />}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="action-btn"
                            title="Transfer to another warehouse"
                            onClick={() => setTransfer({ product: p, warehouse: "", quantity: "" })}
                          ><FiRefreshCw /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </Modal>
      )}

      {transfer && (
        <Modal
          title={`Transfer ${transfer.product.name}`}
          onClose={() => setTransfer(null)}
          size="sm"
          footer={<>
            <button className="btn btn-secondary" onClick={() => setTransfer(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleTransfer}>Transfer</button>
          </>}
        >
          <p style={{ fontSize: 13, color: "#a87c9e", marginBottom: 14 }}>
            In {stockWarehouse?.name}: <strong>{transfer.product.quantity}</strong>
          </p>
          <div className="form-group">
            <label className="form-label">Destination warehouse</label>
            <select className="select-field" value={transfer.warehouse}
              onChange={(e) => setTransfer({ ...transfer, warehouse: e.target.value })}>
              <option value="">Select warehouse</option>
              {warehouses
                .filter(w => w.id !== stockWarehouse?.id)
                .map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Quantity to transfer</label>
            <input
              className="input-field"
              type="number"
              min="1"
              max={transfer.product.quantity}
              value={transfer.quantity}
              onChange={(e) => setTransfer({ ...transfer, quantity: e.target.value })}
              placeholder={`Max ${transfer.product.quantity}`}
            />
            {Number(transfer.quantity) > transfer.product.quantity && (
              <div style={{ color: "#d23369", fontSize: 12.5, marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <FiAlertTriangle size={13} /> Only {transfer.product.quantity} in this warehouse — reduce the amount.
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}