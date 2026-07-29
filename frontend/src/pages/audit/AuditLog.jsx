import React, { useState, useEffect } from 'react';
import { auditAPI } from '../../api/audit';
import { FiSearch, FiHelpCircle, FiSmartphone, FiMonitor } from 'react-icons/fi';

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function deviceIcon(device) {
  if (!device) return <FiHelpCircle />;
  if (device.includes("iPhone") || device.includes("Android")) return <FiSmartphone />;
  if (device.includes("iPad")) return <FiSmartphone />;
  return <FiMonitor />;
}

export function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async (pageNum = 1, keyword = "") => {
    try {
      const response = await auditAPI.getAll(pageNum, keyword);
      const data = response.data;
      setLogs(Array.isArray(data) ? data : data.results ?? []);
      setCount(Array.isArray(data) ? data.length : data.count ?? 0);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { load(page, search); }, [page, search]);

  if (loading) return <h2>Loading...</h2>;

  const totalPages = Math.max(1, Math.ceil(count / 10));

  return (
    <div>
      <div className="page-intro">
        <div>
          <h1>Audit log</h1>
          <p>A permanent record of user actions across the system.</p>
        </div>
      </div>

      <div className="card">
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f8eef5" }}>
          <div className="search-wrap" style={{ maxWidth: 300 }}>
          <span className="search-icon"><FiSearch /></span>            <input
              className="search-input"
              placeholder="Search actions or users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Device</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr><td colSpan={4} style={{ padding: 20, color: "#a87c9e" }}>No activity recorded yet.</td></tr>
              )}
              {logs.map(l => (
                <tr key={l.id}>
                  <td style={{ color: "#a87c9e", fontSize: 12, whiteSpace: "nowrap" }}>
                    {formatTime(l.timestamp)}
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="avatar">
                        {(l.username || "?")[0].toUpperCase()}
                      </div>
                      <div style={{ fontWeight: 500, fontSize: 13.5 }}>
                        {l.username || "Unknown user"}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, whiteSpace: "nowrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      {deviceIcon(l.device)} {l.device || "-"}
                    </span>
                  </td>
                  <td style={{ fontSize: 13.5 }}>{l.action}</td>
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
    </div>
  );
}