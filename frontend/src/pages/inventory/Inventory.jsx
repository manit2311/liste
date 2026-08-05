import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { inventoryAPI } from '../../api/inventory';
import { productAPI } from '../../api/products';
import { categoryAPI } from '../../api/categories';
import { supplierAPI } from '../../api/suppliers';
import { StockInModal } from '../../components/inventory/StockInModal';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DateRangeDropdown } from '../../components/common/DateRangeDropdown';
import { useAuthStore } from '../../store/authStore';
import { isBoss } from '../../constants/roles';
import { FiSearch, FiTrash2, FiPlus, FiFilter, FiX, FiSave, FiArrowLeft } from 'react-icons/fi';

function toApiDate(d) {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function unwrapList(data) {
  if (Array.isArray(data)) return { list: data, count: data.length };
  return { list: data?.results ?? [], count: data?.count ?? 0 };
}

const typeLabel = {
  in: "Stock in",
  out: "Stock out",
  adjustment: "Adjustment",
  return: "Return",
}; 

const SHRINK_REASONS = ["Damaged", "Expired / Spoiled", "Sample / Testing use", "Freebies", "Other"];

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

function deriveStatus(quantity, reorderPoint) {
  if (quantity <= 0) return "critical";
  if (quantity <= reorderPoint) return "low";
  return "active";
}
 
export function Inventory({ params, onConsumeParams }) {
  const [tab, setTab] = useState("history");
  const [transactions, setTransactions] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState([]);
  /*const [showAdd, setShowAdd] = useState(false);*/
  /* const [form, setForm] = useState(emptyForm);*/

  const user = useAuthStore((s) => s.user);
  const boss = isBoss(user);

  const [dateRange, setDateRange] = useState(null);
  const [appliedDateRange, setAppliedDateRange] = useState(null);

  const [sortBy, setSortBy] = useState(null); // null | 'alpha'
  const [filterActions, setFilterActions] = useState([]); // subset of ['in','out','adjustment','return']
  const [filterUsers, setFilterUsers] = useState([]);
  const [qtyMin, setQtyMin] = useState("");
  const [qtyMax, setQtyMax] = useState("");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef(null);

  const [allUsers, setAllUsers] = useState([]);

  function toggleInArray(arr, setArr, value) {
    setArr(arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]);
  }

  const hasActiveFilters =
    sortBy || filterActions.length || filterUsers.length || qtyMin !== "" || qtyMax !== "" || appliedDateRange;

  function clearAllFilters() {
    setSortBy(null);
    setFilterActions([]);
    setFilterUsers([]);
    setQtyMin("");
    setQtyMax("");
    setDateRange(null);
    setAppliedDateRange(null);
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadTransactions = async (pageNum = 1) => {
    setLoading(true);
    try {
      const response = await inventoryAPI.getAll({
        types: filterActions,
        usernames: filterUsers,
        search,
        qtyMin,
        qtyMax,
        dateFrom: toApiDate(appliedDateRange?.start),
        dateTo: toApiDate(appliedDateRange?.end),
        ordering: sortBy === "alpha" ? "product__name" : "-transaction_date",
        page: pageNum,
      });
      const { list, count } = unwrapList(response.data);
      setTransactions(list);
      setCount(count);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productAPI.getAll();
      setProducts(unwrapList(response.data).list);
    } catch (error) {
      console.log(error);
    }
  };

  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const loadCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(unwrapList(response.data).list);
    } catch (error) {
      console.log(error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await supplierAPI.getAll();
      setSuppliers(unwrapList(response.data).list);
    } catch (error) {
      console.log(error);
    }
  };

  const loadUsernames = async () => {
    try {
      const response = await inventoryAPI.getUsernames();
      setAllUsers(response.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => { loadProducts(); loadUsernames(); loadCategories(); loadSuppliers(); }, []);
  useEffect(() => { setPage(1); }, [search, sortBy, filterActions, filterUsers, qtyMin, qtyMax, appliedDateRange]);
  useEffect(() => {
    loadTransactions(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sortBy, filterActions, filterUsers, qtyMin, qtyMax, appliedDateRange, page]);

// ------------------------------------------------------------------
  // Shrink item modal
  // ------------------------------------------------------------------
  const [showShrink, setShowShrink] = useState(false);
  const [shrinkStep, setShrinkStep] = useState("search");
  const [shrinkSearch, setShrinkSearch] = useState("");
  const [shrinkSelected, setShrinkSelected] = useState(null);
  const [shrinkQty, setShrinkQty] = useState(1);
  const [shrinkReason, setShrinkReason] = useState("");
  const [shrinkReasonOther, setShrinkReasonOther] = useState("");
  const [shrinkNote, setShrinkNote] = useState("");
  const [shrinkSubmitting, setShrinkSubmitting] = useState(false);
  const [shrinkSubmitError, setShrinkSubmitError] = useState(null);
  const [shrunkSession, setShrunkSession] = useState([]);

  const shrinkResults = shrinkSearch.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(shrinkSearch.toLowerCase()) ||
        (p.sku || "").toLowerCase().includes(shrinkSearch.toLowerCase())
      )
    : [];

  function openShrinkModal() {
    setShowShrink(true);
    setShrunkSession([]);
    resetShrinkToSearch();
  }

  function resetShrinkToSearch() {
    setShrinkStep("search");
    setShrinkSearch("");
    setShrinkSelected(null);
    setShrinkQty(1);
    setShrinkReason("");
    setShrinkReasonOther("");
    setShrinkNote("");
    setShrinkSubmitError(null);
  }

  function selectShrinkItem(product) {
    setShrinkSelected(product);
    setShrinkQty(1);
    setShrinkReason("");
    setShrinkReasonOther("");
    setShrinkNote("");
    setShrinkSubmitError(null);
    setShrinkStep("form");
  }

  async function confirmShrink() {
    if (!shrinkSelected) return;
    const qty = Number(shrinkQty) || 0;
    if (qty <= 0) return;

    const reasonValue = shrinkReason === "Other" ? shrinkReasonOther : shrinkReason;
    const remarks = shrinkNote.trim() ? `${reasonValue} - ${shrinkNote.trim()}` : reasonValue;

    setShrinkSubmitting(true);
    setShrinkSubmitError(null);
    try {
      await inventoryAPI.create({
        product: shrinkSelected.id,
        transaction_type: "out",
        quantity: qty,
        remarks,
      });

      loadProducts();
      loadTransactions(page);
      loadUsernames();

      setShrunkSession(prev => {
        const existing = prev.find(item => item.id === shrinkSelected.id);
        if (existing) {
          return prev.map(item =>
            item.id === shrinkSelected.id ? { ...item, qty: item.qty + qty } : item
          );
        }
        return [...prev, { id: shrinkSelected.id, name: shrinkSelected.name, qty }];
      });

      resetShrinkToSearch();
    } catch (err) {
      setShrinkSubmitError(errorMessage(err));
    } finally {
      setShrinkSubmitting(false);
    }
  }

  const shrinkReasonValue = shrinkReason === "Other" ? shrinkReasonOther : shrinkReason;
  const canConfirmShrink = shrinkSelected && Number(shrinkQty) > 0 && shrinkReasonValue.trim() !== "" && !shrinkSubmitting;

  const [showStockIn, setShowStockIn] = useState(false);

  function openStockInModal() {
    setShowStockIn(true);
  }

  const totalPages = Math.max(1, Math.ceil(count / 20));

  // Current stock tab: its own search/sort/filter
  const [currentSearch, setCurrentSearch] = useState("");
  const [currentSortBy, setCurrentSortBy] = useState(null); // null | 'alpha' | 'stock-asc' | 'stock-desc'
  const [currentCategoryFilter, setCurrentCategoryFilter] = useState([]); // empty = all categories
  const [currentStatusFilter, setCurrentStatusFilter] = useState([]); // subset of ['active','low','critical']

  // If we arrived here via a "See details" link with a pre-set filter
  // (e.g. from the Dashboard's Low stock alerts card), apply it once and
  // switch straight to the Current stock tab.
  useEffect(() => {
    if (params?.filterStatus) {
      setTab("current");
      setCurrentStatusFilter(params.filterStatus);
      onConsumeParams && onConsumeParams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);  const [showCurrentSortMenu, setShowCurrentSortMenu] = useState(false);
  const currentSortMenuRef = useRef(null);

  const allCategories = [...new Set(products.map(p => p.category_name).filter(Boolean))];

  const hasActiveCurrentFilters = Boolean(currentSortBy) || currentCategoryFilter.length > 0 || currentStatusFilter.length > 0;

  function clearCurrentFilters() {
    setCurrentSortBy(null);
    setCurrentCategoryFilter([]);
    setCurrentStatusFilter([]);
  }

  useEffect(() => {
    function handleClickOutsideCurrent(e) {
      if (currentSortMenuRef.current && !currentSortMenuRef.current.contains(e.target)) {
        setShowCurrentSortMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutsideCurrent);
    return () => document.removeEventListener("mousedown", handleClickOutsideCurrent);
  }, []);

  let currentFiltered = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(currentSearch.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(currentSearch.toLowerCase());
    if (!matchesSearch) return false;
    if (currentCategoryFilter.length > 0 && !currentCategoryFilter.includes(p.category_name)) return false;
    if (currentStatusFilter.length > 0 && !currentStatusFilter.includes(deriveStatus(p.quantity, p.reorder_point))) return false;
    return true;
  });

  if (currentSortBy === "alpha") {
    currentFiltered = [...currentFiltered].sort((a, b) => a.name.localeCompare(b.name));
  } else if (currentSortBy === "stock-desc") {
    currentFiltered = [...currentFiltered].sort((a, b) => b.quantity - a.quantity);
  } else if (currentSortBy === "stock-asc") {
    currentFiltered = [...currentFiltered].sort((a, b) => a.quantity - b.quantity);
  }

  return (
    <div>
      <div className="page-intro">
        <div>
          <h1>Inventory</h1>
          <p>Track stock movements, adjustments, and current levels.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-secondary" onClick={openShrinkModal} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><FiTrash2 /> Shrink item</button>
        <button className="btn btn-primary" onClick={openStockInModal} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><FiPlus /> Stock in</button>
        </div>
      </div>

      <div className="tab-bar">
        {["history", "current"].map(t => (
          <button
            key={t}
            className={`tab ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "history" ? "Stock history" : "Current stock"}
          </button>
        ))}
      </div>

      {tab === "history" && (
        <div className="card">
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #f8eef5", display: "flex", gap: 12, alignItems: "center" }}>
          <div className="search-wrap" style={{ maxWidth: 260 }}>
              <span className="search-icon"><FiSearch /></span>
              <input
                className="search-input"
                placeholder="Search transactions…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
     <DateRangeDropdown value={dateRange} onApply={(v) => { setDateRange(v); setAppliedDateRange(v); }} />

            <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
              <div className="filter-menu-wrap" ref={sortMenuRef}>
              <button className="btn btn-secondary" onClick={() => setShowSortMenu(o => !o)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><FiFilter /> Filter</button>
                {showSortMenu && (
                  <div className="filter-menu-panel filter-menu-panel-wide">
                    <button className="filter-menu-close" onClick={() => setShowSortMenu(false)} aria-label="Close filter menu"><FiX /></button>
                    <button
                      className={`filter-menu-item${sortBy === "alpha" ? " active" : ""}`}
                      onClick={() => setSortBy(sortBy === "alpha" ? null : "alpha")}
                    >
                      Sort A–Z
                    </button>

                    <div className="filter-menu-divider" />
                    <div className="filter-menu-label">Action</div>
                    {["in", "out", "adjustment", "return"].map(t => (
                      <label className="filter-menu-checkbox" key={t}>
                        <input
                          type="checkbox"
                          checked={filterActions.includes(t)}
                          onChange={() => toggleInArray(filterActions, setFilterActions, t)}
                        />
                        {typeLabel[t]}
                      </label>
                    ))}

                    <div className="filter-menu-divider" />
                    <div className="filter-menu-label">User</div>
                    {allUsers.map(u => (
                      <label className="filter-menu-checkbox" key={u}>
                        <input
                          type="checkbox"
                          checked={filterUsers.includes(u)}
                          onChange={() => toggleInArray(filterUsers, setFilterUsers, u)}
                        />
                        {u}
                      </label>
                    ))}

                    <div className="filter-menu-divider" />
                    <div className="filter-menu-label">Quantity</div>
                    <div className="filter-menu-qty-row">
                      <input
                        type="number"
                        className="input-field filter-menu-qty-input"
                        placeholder="Min"
                        value={qtyMin}
                        onChange={e => setQtyMin(e.target.value)}
                      />
                      <span>–</span>
                      <input
                        type="number"
                        className="input-field filter-menu-qty-input"
                        placeholder="Max"
                        value={qtyMax}
                        onChange={e => setQtyMax(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
              {hasActiveFilters && (
                <button className="btn btn-ghost" onClick={clearAllFilters} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><FiX /> Clear filter</button>
              )}
            </div>
          </div>
          <div className="table-wrap" style={{ opacity: loading ? 0.4 : 1, transition: "opacity 0.2s ease", minHeight: 640 }}>            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Action</th>
                  <th>Quantity</th>
                  {boss && <th>Total cost</th>}
                  <th>User</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 && !loading && (
                  <tr><td colSpan={boss ? 7 : 6} style={{ color: "#a87c9e", padding: 16 }}>No stock movements yet.</td></tr>
                )}
                {transactions.map((r) => (
                  <tr key={r.id}>
                    <td style={{ color: "#a87c9e", fontSize: 12, whiteSpace: "nowrap" }}>
                      {r.transaction_date ? new Date(r.transaction_date).toLocaleString(undefined, { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-"}
                    </td>
                    <td style={{ fontWeight: 500 }}>{r.product_name}</td>
                    <td>
                      <span className={`badge ${r.transaction_type === "out" ? "stock-out" : "stock-in"}`}>
                        {typeLabel[r.transaction_type] || r.transaction_type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{r.quantity}</td>
                    {boss && (
                      <td style={{ fontWeight: 600, color: r.transaction_type === "out" ? "#e84e7a" : "#2c8a4d" }}>
                        {r.total != null ? `$${Number(r.total).toFixed(2)}` : "-"}
                      </td>
                    )}
                    <td><span className="tag">{r.username || "System"}</span></td>
                    <td style={{ color: "#a87c9e", fontSize: 12.5 }}>{r.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-btn ${page === p ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button>
          </div>
        </div>
      )}

{tab === "current" && (
        <div className="card">
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #f8eef5", display: "flex", gap: 12, alignItems: "center" }}>
            <div className="search-wrap" style={{ maxWidth: 260 }}>
              <span className="search-icon"><Search size={15} /></span>
              <input
                className="search-input"
                placeholder="Search products…"
                value={currentSearch}
                onChange={e => setCurrentSearch(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
              <div className="filter-menu-wrap" ref={currentSortMenuRef}>
              <button className="btn btn-secondary" onClick={() => setShowCurrentSortMenu(o => !o)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><FiFilter /> Filter</button>                {showCurrentSortMenu && (
                  <div className="filter-menu-panel filter-menu-panel-wide">
                    <button
                      className={`filter-menu-item${currentSortBy === "alpha" ? " active" : ""}`}
                      onClick={() => { setCurrentSortBy(currentSortBy === "alpha" ? null : "alpha"); setShowCurrentSortMenu(false); }}
                    >
                      Sort A–Z
                    </button>
                    <button
                      className={`filter-menu-item${currentSortBy === "stock-desc" ? " active" : ""}`}
                      onClick={() => { setCurrentSortBy(currentSortBy === "stock-desc" ? null : "stock-desc"); setShowCurrentSortMenu(false); }}
                    >
                      Quantity on hand: High to low
                    </button>
                    <button
                      className={`filter-menu-item${currentSortBy === "stock-asc" ? " active" : ""}`}
                      onClick={() => { setCurrentSortBy(currentSortBy === "stock-asc" ? null : "stock-asc"); setShowCurrentSortMenu(false); }}
                    >
                      Quantity on hand: Low to high
                    </button>

                    <div className="filter-menu-divider" />
                    <div className="filter-menu-label">Category</div>
                    {allCategories.map(c => (
                      <label className="filter-menu-checkbox" key={c}>
                        <input
                          type="checkbox"
                          checked={currentCategoryFilter.includes(c)}
                          onChange={() => { toggleInArray(currentCategoryFilter, setCurrentCategoryFilter, c); setShowCurrentSortMenu(false); }}
                        />
                        {c}
                      </label>
                    ))}

                    <div className="filter-menu-divider" />
                    <div className="filter-menu-label">Status</div>
                    {[
                      { key: "active", label: "Available" },
                      { key: "low", label: "Low stock" },
                      { key: "critical", label: "Out of stock" },
                    ].map(({ key, label }) => (
                      <label className="filter-menu-checkbox" key={key}>
                        <input
                          type="checkbox"
                          checked={currentStatusFilter.includes(key)}
                          onChange={() => { toggleInArray(currentStatusFilter, setCurrentStatusFilter, key); setShowCurrentSortMenu(false); }}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {hasActiveCurrentFilters && (
                <button className="btn btn-ghost" onClick={clearCurrentFilters} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><FiX /> Clear filter</button>
              )}
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Warehouse</th>
                  <th>On hand</th>
                  <th>Reorder at</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {currentFiltered.length === 0 && (
                  <tr><td colSpan={7} style={{ color: "#a87c9e", padding: 16 }}>No products found.</td></tr>
                )}
                {currentFiltered.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td><span className="tag">{p.sku}</span></td>
                    <td>{p.category_name}</td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {(p.warehouse_stocks ?? []).map(ws => (
                          <span key={ws.id} className="tag">{ws.warehouse_name}: {ws.quantity}</span>
                        ))}
                        {(p.unassigned ?? 0) > 0 && (
                          <span className="tag" style={{ opacity: 0.65 }}>Free: {p.unassigned}</span>
                        )}
                        {(p.warehouse_stocks ?? []).length === 0 && (p.unassigned ?? 0) === 0 && (
                          <span style={{ fontSize: 12, color: "#a87c9e" }}>—</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: p.quantity <= p.reorder_point ? "#e84e7a" : "#2c1a26" }}>
                        {p.quantity}
                      </span>
                    </td>
                    <td style={{ color: "#a87c9e" }}>{p.reorder_point}</td>
                    <td><StatusBadge status={deriveStatus(p.quantity, p.reorder_point)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

{showShrink && shrinkStep === "search" && (
        <Modal
          title="Shrink item"
          onClose={() => setShowShrink(false)}
          size="lg"
          footer={
            <button className="btn btn-primary" onClick={() => setShowShrink(false)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><FiSave /> Save</button>
          }
        >
          {shrunkSession.length > 0 && (
            <div className="shrink-success-banner">
              <div style={{ marginBottom: 6 }}>✓ Shrunk this session:</div>
              <ul className="shrink-session-list">
                {shrunkSession.map(item => (
                  <li key={item.id}>{item.qty} × {item.name}</li>
                ))}
              </ul>
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <div className="search-wrap" style={{ maxWidth: "100%" }}>
              <span className="search-icon"><FiSearch /></span>
              <input
                className="search-input"
                placeholder="Search products…"
                style={{ width: "100%" }}
                value={shrinkSearch}
                onChange={e => setShrinkSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="shrink-results-list">
            {shrinkSearch.trim() !== "" && shrinkResults.length === 0 && (
              <div style={{ padding: "20px 8px", textAlign: "center", color: "var(--text-muted-alt)", fontSize: 13.5 }}>
                No products match your search
              </div>
            )}
            {shrinkResults.map(p => (
              <button key={p.id} className="shrink-result-row" onClick={() => selectShrinkItem(p)}>
                <div>
                  <div className="shrink-result-name">{p.name}</div>
                  <div className="shrink-result-sku">{p.sku || "—"}</div>
                </div>
                <div className="shrink-result-stock">{p.quantity} on hand</div>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {showShrink && shrinkStep === "form" && shrinkSelected && (
        <Modal
          title="Shrink item"
          onClose={() => setShowShrink(false)}
          footer={
            <>
<button className="btn btn-secondary" onClick={() => setShrinkStep("search")} disabled={shrinkSubmitting} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><FiArrowLeft /> Back</button>              <button className="btn btn-primary" onClick={confirmShrink} disabled={!canConfirmShrink}>
                {shrinkSubmitting ? "Saving…" : "Done"}
              </button>
            </>
          }
        >
          <div className="shrink-selected-item">
            <div className="shrink-result-name">{shrinkSelected.name}</div>
            <div className="shrink-result-sku">{shrinkSelected.sku || "—"} · {shrinkSelected.quantity} on hand</div>
          </div>

          {shrinkSubmitError && (
            <div style={{ color: "#e84e7a", fontSize: 13, marginBottom: 12 }}>{shrinkSubmitError}</div>
          )}

          <div className="form-field">
            <label className="form-label">Quantity</label>
            <input
              type="number"
              className="input-field"
              min={1}
              max={shrinkSelected.quantity}
              value={shrinkQty}
              onChange={e => setShrinkQty(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Reason</label>
            <select
              className="select-field"
              style={{ width: "100%" }}
              value={shrinkReason}
              onChange={e => setShrinkReason(e.target.value)}
            >
              <option value="">Select a reason…</option>
              {SHRINK_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {shrinkReason === "Other" && (
            <div className="form-field">
              <label className="form-label">Specify reason</label>
              <input
                className="input-field"
                style={{ width: "100%" }}
                placeholder="Type the reason…"
                value={shrinkReasonOther}
                onChange={e => setShrinkReasonOther(e.target.value)}
              />
            </div>
          )}

          <div className="form-field">
            <label className="form-label">Note (optional)</label>
            <textarea
              className="textarea-field"
              style={{ width: "100%" }}
              rows={3}
              placeholder="Add any additional details…"
              value={shrinkNote}
              onChange={e => setShrinkNote(e.target.value)}
            />
          </div>
        </Modal>
      )}

{showStockIn && (
        <StockInModal
          onClose={() => setShowStockIn(false)}
          onSaved={() => { loadProducts(); loadTransactions(page); loadUsernames(); }}
        />
      )}
    </div>
  );
}