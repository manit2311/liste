import React, { useState, useEffect } from 'react';
import './styles/globals.css';
import { useAuthStore } from './store/authStore';
import { useCompanyStore } from './store/companyStore';
import { canAccess, isSuperAdmin } from './constants/roles';
import { FiEyeOff } from 'react-icons/fi';

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

// These pages are never blurred even when company is private
const PLATFORM_PAGES = [
  'platform-companies',
  'platform-users',
  'platform-audit',
  'notifications',
  'users',
];

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [companyKey, setCompanyKey] = useState(0);
  const { isAuthenticated, checkAuth, user } = useAuthStore();
  const { companies, selectedCompanyId } = useCompanyStore();

  useEffect(() => {
    checkAuth().then(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handler = () => setCompanyKey(k => k + 1);
    window.addEventListener('company-changed', handler);
    return () => window.removeEventListener('company-changed', handler);
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
  const superAdmin = isSuperAdmin(user);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  const isPrivatePage = superAdmin &&
    selectedCompany?.is_private &&
    !PLATFORM_PAGES.includes(page);

  return (
    <Layout key={companyKey} page={page} onPageChange={setPage}>
      {!allowed ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <FiEyeOff size={40} color="#c4a0bc" />
          <h2 style={{ marginTop: 12 }}>Access restricted</h2>
          <p style={{ color: "#a87c9e", marginTop: 6 }}>
            You don't have permission to view this page.
          </p>
          <button className="btn btn-primary" style={{ marginTop: 18 }}
            onClick={() => setPage("dashboard")}>
            Back to dashboard
          </button>
        </div>
      ) : isPrivatePage ? (
        <div style={{ position: "relative", minHeight: "80vh" }}>
          <div style={{
            filter: "blur(8px)",
            pointerEvents: "none",
            userSelect: "none",
            opacity: 0.4,
          }}>
            <PageComponent setPage={setPage} />
          </div>
          <div style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            paddingTop: "80px",
            background: "rgba(248,239,246,0.6)",
            backdropFilter: "blur(2px)",
            zIndex: 5,
          }}>
            <div style={{
              background: "#fff", borderRadius: 16, padding: "40px 48px",
              boxShadow: "0 8px 40px rgba(180,100,150,0.18)",
              border: "1.5px solid #f0dcea",
              display: "flex", flexDirection: "column",
              alignItems: "center", textAlign: "center",
              maxWidth: 400,
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "#fdf0f7", border: "2px solid #f0dcea",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 16,
              }}>
                <FiEyeOff size={28} color="#c9407f" />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#2c1a26", marginBottom: 8 }}>
                Access Restricted
              </h2>
              <p style={{ fontSize: 13, color: "#a87c9e", lineHeight: 1.7, marginBottom: 6 }}>
                <strong style={{ color: "#a82d68" }}>{selectedCompany?.name}</strong> has chosen
                to hide their data from the Super Admin.
              </p>
              <p style={{ fontSize: 12, color: "#c4a0bc", lineHeight: 1.6 }}>
                The company boss can share access by clicking the privacy
                toggle button in their topbar.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <PageComponent setPage={setPage} />
      )}
    </Layout>
  );
}