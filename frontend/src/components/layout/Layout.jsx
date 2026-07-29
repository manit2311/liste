import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { notificationAPI } from '../../api/notifications';

const PAGE_MAP = {
  dashboard: () => import('../../pages/dashboard/Dashboard').then(m => m.Dashboard),
  products: () => import('../../pages/products/Products').then(m => m.Products),
  categories: () => import('../../pages/categories/Categories').then(m => m.Categories),
  suppliers: () => import('../../pages/suppliers/Suppliers').then(m => m.Suppliers),
  inventory: () => import('../../pages/inventory/Inventory').then(m => m.Inventory),
  orders: () => import('../../pages/orders/Orders').then(m => m.Orders),
  "purchase-orders": () => import('../../pages/purchase-orders/PurchaseOrders').then(m => m.PurchaseOrders),
  warehouses: () => import('../../pages/warehouses/Warehouses').then(m => m.Warehouses),
  notifications: () => import('../../pages/notifications/Notifications').then(m => m.Notifications),
  audit: () => import('../../pages/audit/AuditLog').then(m => m.AuditLog),
  users: () => import('../../pages/users/UserManagement').then(m => m.UserManagement),
};

export function Layout({ children, page, onPageChange }) {
  const [searchQ, setSearchQ] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnread();
      const data = response.data;
      setUnreadCount(Array.isArray(data) ? data.length : data.count ?? 0);
    } catch (error) {
      console.log(error);
    }
    <Sidebar current={page} onSelect={onPageChange} unreadCount={unreadCount} />
  };

  useEffect(() => {
    loadUnreadCount();
    const timer = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(timer);
  }, [page]); // re-checks on page switch too (e.g. after reading notifications)

  return (
    <div className="app-shell">
      <Sidebar current={page} onSelect={onPageChange} unreadCount={unreadCount} />
      <div className="main-content">
        <Topbar page={page} onSearch={setSearchQ} onNavigate={onPageChange} />
        <div className="page-body">
          {children}
        </div>
      </div>
    </div>
  );
}