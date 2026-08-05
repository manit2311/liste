import {
  FiGrid, FiPackage, FiTag, FiTruck, FiArchive,
  FiShoppingCart, FiFileText, FiHome, FiBell,
  FiClipboard, FiUsers, FiGlobe
} from 'react-icons/fi';

export const NAV = [
  { id: "dashboard",         label: "Dashboard",         icon: FiGrid },
  { id: "products",          label: "Products",           icon: FiPackage },
  { id: "categories",        label: "Categories",         icon: FiTag },
  { id: "suppliers",         label: "Suppliers",          icon: FiTruck },
  { id: "inventory",         label: "Inventory",          icon: FiArchive },
  { id: "orders",            label: "Orders",             icon: FiShoppingCart },
  { id: "purchase-orders",   label: "Purchase Orders",    icon: FiFileText },
  { id: "warehouses",        label: "Warehouses",         icon: FiHome },
  { id: "notifications",     label: "Notifications",      icon: FiBell },
  { id: "audit",             label: "Audit Log",          icon: FiClipboard },
  { id: "users",             label: "User Management",    icon: FiUsers },
];

export const PLATFORM_NAV = [
  { id: "platform-companies", label: "Companies",      icon: FiGlobe },
  { id: "platform-users",     label: "Platform Users", icon: FiUsers },
  { id: "platform-audit",     label: "Platform Audit", icon: FiClipboard },
  { id: "notifications",      label: "Notifications",  icon: FiBell },
];