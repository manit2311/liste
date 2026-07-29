import React, { useState, useEffect } from 'react';
import { productAPI } from '../../api/products';
import { orderAPI } from '../../api/orders';
import { inventoryAPI } from '../../api/inventory';
import { StockInModal } from '../../components/inventory/StockInModal';
import { useAuthStore } from '../../store/authStore';// Repeatedly pages through a paginated (or plain-array) endpoint and returns the full list.
async function fetchAll(fetchPage) {
  let page = 1;
  let all = [];
  while (page < 50) {
    const response = await fetchPage(page);
    const data = response.data;
    const list = Array.isArray(data) ? data : data?.results ?? [];
    all = all.concat(list);
    const hasNext = !Array.isArray(data) && Boolean(data?.next);
    if (!hasNext || list.length === 0) break;
    page += 1;
  }
  return all;
}

const LOW_STOCK_THRESHOLD = 5;

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
const SALES_RANGE_OPTIONS = [
  { value: 7, label: "Last 7 days" },
  { value: 14, label: "Last 14 days" },
  { value: 30, label: "Last 30 days" },
];

export function Dashboard({ setPage }) {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [showStockIn, setShowStockIn] = useState(false);
  const [salesRangeDays, setSalesRangeDays] = useState(7);

  const loadDashboardData = async () => {
    try {
      const [allProducts, allOrders, activityRes] = await Promise.all([
        fetchAll((page) => productAPI.getAll("", "", page)),
        fetchAll((page) => orderAPI.getAll("", "", page)),
        inventoryAPI.getAll({ page: 1 }),
      ]);
      setProducts(allProducts);
      setOrders(allOrders);
      const activityData = activityRes.data;
      const activityList = Array.isArray(activityData) ? activityData : activityData?.results ?? [];
      setRecentActivity(activityList.slice(0, 5));
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboardData(); }, []);

  if (loading) return <h2>Loading...</h2>;

  const totalInventoryUnits = products.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
  const lowStock = products
    .filter(p => Number(p.quantity) <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => Number(a.quantity) - Number(b.quantity));

  const todayKey = new Date().toISOString().slice(0, 10);
  const invoicesToday = orders.filter(o => o.date && String(o.date).slice(0, 10) === todayKey).length;

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const orderTotal = (o) =>
    o.total ?? o.items?.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0) ?? 0;

  const revenue30d = orders
    .filter(o => o.date && new Date(o.date) >= thirtyDaysAgo)
    .reduce((sum, o) => sum + Number(orderTotal(o)), 0);

  // Last 7 days revenue, bucketed by day, oldest to newest
  const dayBuckets = Array.from({ length: salesRangeDays }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (salesRangeDays - 1 - i));
    const label = salesRangeDays <= 7 ? "SMTWTFS"[d.getDay()] : String(d.getDate());
    return { key: d.toISOString().slice(0, 10), label, total: 0 };
  });
  orders.forEach(o => {
    if (!o.date) return;
    const key = String(o.date).slice(0, 10);
    const bucket = dayBuckets.find(b => b.key === key);
    if (bucket) bucket.total += Number(orderTotal(o));
  });
  const maxBucket = Math.max(1, ...dayBuckets.map(b => b.total));

  // Inventory by category, based on real product categories
  const categoryTotals = {};
  products.forEach(p => {
    const cat = p.category_name || "Uncategorized";
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(p.quantity || 0);
  });
  const categoryList = Object.entries(categoryTotals)
    .map(([label, units]) => ({ label, units }))
    .sort((a, b) => b.units - a.units)
    .slice(0, 5);
  const categoryMax = Math.max(1, ...categoryList.map(c => c.units));

  const typeLabel = { in: "Stock in", out: "Stock out", adjustment: "Adjustment", return: "Return" };
  return (
    <div>
      <div className="page-intro">
        <div>
        <h1>{getGreeting()}, {user?.username || user?.email}!</h1>
          <p>Here's what's happening in your store today.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowStockIn(true)}>
          ＋ Quick stock in
        </button>
      </div>

      <div className="stat-grid">
        {[
          { label: "Total products", value: products.length },
          { label: "Total inventory", value: `${totalInventoryUnits.toLocaleString()} units` },
          { label: "Invoices today", value: invoicesToday },
          { label: "Revenue (30d)", value: `$${revenue30d.toFixed(2)}` },
        ].map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            {s.warn !== undefined && (
              <div className={`stat-change ${s.warn ? "change-down" : "change-up"}`}>
                {s.warn ? "↓ Needs attention" : "↑ All good"}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div className="card-header">
          <span className="card-title">Sales overview</span>
            <select
              className="select-field"
              style={{ width: 140, height: 30, fontSize: 12, marginLeft: "auto" }}
              value={salesRangeDays}
              onChange={e => setSalesRangeDays(Number(e.target.value))}
            >
              {SALES_RANGE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="card-body">
          <div style={{ overflowX: salesRangeDays > 14 ? "auto" : "visible" }}>
              <div
                key={salesRangeDays}
                className="chart-bar-wrap chart-range-transition"
                style={{ minWidth: salesRangeDays > 14 ? `${salesRangeDays * 28}px` : "100%" }}
              >
                {dayBuckets.map((b, i) => (
                  <div className="chart-bar-col" key={i}>
                    <div className="chart-bar" style={{ height: `${(b.total / maxBucket) * 100}%` }} />
                    <span className="chart-bar-label">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 24, marginTop: 16, paddingTop: 14, borderTop: "1px solid #f8eef5" }}>
            <div>
                <div className="stat-label">Orders ({salesRangeDays}d)</div>
                <div style={{ fontSize: 20, fontWeight: 500, color: "#2c1a26" }}>
                  {orders.filter(o => o.date && String(o.date).slice(0, 10) >= dayBuckets[0].key).length}
                </div>
              </div>
              <div>
                <div className="stat-label">Total ({salesRangeDays}d)</div>
                <div style={{ fontSize: 20, fontWeight: 500, color: "#2c1a26" }}>
                  ${dayBuckets.reduce((s, b) => s + b.total, 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Low stock alerts</span>
            <span className="badge badge-red">{lowStock.length} critical</span>
          </div>
          <div className="card-body">
            {lowStock.length === 0 && <p style={{ color: "#a87c9e", fontSize: 13 }}>Nothing low on stock right now.</p>}
            {lowStock.map(p => (
              <div className="stock-alert-row" key={p.id}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: "#2c1a26" }}>{p.name}</div>
                  <div className="mini-progress">
                    <div className="mini-fill" style={{ width: `${Math.min(100, (p.quantity / LOW_STOCK_THRESHOLD) * 100)}%` }} />
                  </div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#e84e7a", whiteSpace: "nowrap", marginLeft: 12 }}>
                  {p.quantity} units
                </span>
              </div>
           ))}
        
          <div style={{ textAlign: "right", marginTop: 12 }}>
             <a
             onClick={() => setPage("inventory", { filterStatus: ["low", "critical"] })}
               style={{ fontSize: 12, color: "#a87c9e", cursor: "pointer", textDecoration: "none" }}
               onMouseEnter={e => e.target.style.textDecoration = "underline"}
               onMouseLeave={e => e.target.style.textDecoration = "none"}
             >
             See more
</a>
           </div>
         </div>
      </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent stock activity</span>
            <button className="btn btn-ghost" style={{ marginLeft: "auto", fontSize: 12 }} onClick={() => setPage("inventory")}>
              View all
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Action</th>
                  <th>Qty</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.length === 0 && (
                  <tr><td colSpan={4} style={{ color: "#a87c9e", padding: 12 }}>No stock activity yet.</td></tr>
                )}
                {recentActivity.map((r) => (
                  <tr key={r.id}>
                <td style={{ color: "#a87c9e", fontSize: 12, whiteSpace: "nowrap" }}>
                {r.transaction_date ? new Date(r.transaction_date).toLocaleString(undefined, { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-"}
                    </td>
                    <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.product_name}
                    </td>
                    <td>
                      <span className={`badge ${r.transaction_type === "out" ? "stock-out" : "stock-in"}`}>
                        {typeLabel[r.transaction_type] || r.transaction_type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{r.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Inventory by category</span>
          </div>
          <div className="card-body">
            {categoryList.length === 0 && <p style={{ color: "#a87c9e", fontSize: 13 }}>No products yet.</p>}
            {categoryList.map((c, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13 }}>{c.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#a87c9e" }}>{c.units} units</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(c.units / categoryMax) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>

{showStockIn && (
  <StockInModal
    onClose={() => setShowStockIn(false)}
    onSaved={loadDashboardData}
  />
)}
</div>
);
}
