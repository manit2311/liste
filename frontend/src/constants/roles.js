export const STAFF_PAGES = ["dashboard", "products", "categories", "inventory", "orders", "warehouses", "purchase-orders"];

export const BOSS_EXTRA_PAGES = ["suppliers", "purchase-orders", "notifications", "audit", "users"];

export const SUPER_ADMIN_PAGES = ["platform-companies", "platform-users", "platform-audit"];

export function isSuperAdmin(user) {
  return !!user && (user.role === "super_admin" || (user.is_superuser && user.role === "super_admin"));
}

export function isBoss(user) {
  return !!user && (user.is_superuser || ["admin", "super_admin"].includes(user.role));
}

export function canAccess(user, pageId) {
  if (isSuperAdmin(user)) return true;
  if (isBoss(user)) return !SUPER_ADMIN_PAGES.includes(pageId);
  return STAFF_PAGES.includes(pageId);
}