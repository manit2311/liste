import React from 'react';

export function StatusBadge({ status }) {
  const map = {
    active: { cls: "badge-green", dot: "dot-green", label: "Available" },
    inactive: { cls: "badge-gray", dot: "dot-amber", label: "Inactive" },
    low: { cls: "badge-amber", dot: "dot-amber", label: "Low stock" },
    critical: { cls: "badge-red", dot: "dot-red", label: "Out of Stock" },
    delivered: { cls: "badge-green", label: "Delivered" },
    processing: { cls: "badge-amber", label: "Processing" },
    shipped: { cls: "badge-blue", label: "Shipped" },
    cancelled: { cls: "badge-red", label: "Cancelled" },
    received: { cls: "badge-green", label: "Received" },
    "in-transit": { cls: "badge-blue", label: "In transit" },
    pending: { cls: "badge-amber", label: "Pending" },
  };
  const s = map[status] || { cls: "badge-gray", label: status };
  return (
    <span className={`badge ${s.cls}`}>
      {s.dot && <span className={`dot ${s.dot}`} />}
      {s.label}
    </span>
  );
}