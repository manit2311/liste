import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import './styles/globals.css';
import { useAuthStore } from './store/authStore';
import { canAccess } from './constants/roles';


// Regular pages
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/dashboard/Dashboard';
import { Products } from './pages/products/Products';
import { Categories } from './pages/categories/Categories';
import { Suppliers } from './pages/suppliers/Suppliers';
import { Inventory } from './pages/inventory/Inventory';
import { Orders } from './pages/orders/Orders';
import { PurchaseOrders } from './pages/purchase-orders/PurchaseOrders';
import { Warehouses } from './pages/warehouses/Warehouses';
import { Notifications } from './pages/notifications/Notifications';
import { AuditLog } from './pages/audit/AuditLog';
import { UserManagement } from './pages/users/UserManagement';

// Platform pages (super admin only)
import { PlatformCompanies } from './pages/platform/PlatformCompanies';
import { PlatformUsers } from './pages/platform/PlatformUsers';
import { PlatformAudit } from './pages/platform/PlatformAudit';

import { Layout } from './components/layout/Layout';

const PAGE_MAP = {
  dashboard: Dashboard,
  products: Products,
  categories: Categories,
  suppliers: Suppliers,
  inventory: Inventory,
  orders: Orders,
  'purchase-orders': PurchaseOrders,
  warehouses: Warehouses,
  notifications: Notifications,
  audit: AuditLog,
  users: UserManagement,
  'platform-companies': PlatformCompanies,
  'platform-users': PlatformUsers,
  'platform-audit': PlatformAudit,
};

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, checkAuth, user } = useAuthStore();

  useEffect(() => {
    checkAuth().then(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh', background: '#f8eff6'
      }}>
        <div style={{ fontSize: '18px', color: '#a87c9e' }}>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) return <Login />;

  const allowed = canAccess(user, page);
  const PageComponent = PAGE_MAP[page] || Dashboard;

  return (
    <Layout page={page} onPageChange={setPage}>
      {allowed ? (
        <PageComponent setPage={setPage} />
      ) : (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <Lock size={40} style={{ color: "#c4a0bc" }} />
          <h2 style={{ marginTop: 12 }}>Access restricted</h2>
          <p style={{ color: "#a87c9e", marginTop: 6 }}>
            You don't have permission to view this page.
          </p>
          <button className="btn btn-primary" style={{ marginTop: 18 }}
            onClick={() => setPage("dashboard")}>
            Back to dashboard
          </button>
        </div>
      )}
    </Layout>
  );
}