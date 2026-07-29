export const PRODUCTS = [
  { id: "PRD-001", name: "Blue Heart Pillow", sku: "VBR-BHP-001", category: "Pillows", supplier: "KoreaGoods Co.", price: 24.99, cost: 12.5, stock: 148, reorderAt: 20, status: "active" },
  { id: "PRD-002", name: "Red Heart Pillow", sku: "VBR-RHP-002", category: "Pillows", supplier: "KoreaGoods Co.", price: 24.99, cost: 12.5, stock: 93, reorderAt: 20, status: "active" },
  { id: "PRD-003", name: "Huggie Bear", sku: "VBR-HGB-003", category: "Plush", supplier: "ChinaFactory Ltd.", price: 39.99, cost: 15.0, stock: 57, reorderAt: 15, status: "active" },
  { id: "PRD-004", name: "Mini Rabbit", sku: "YLA-MNR-001", category: "Plush", supplier: "KoreaGoods Co.", price: 18.99, cost: 8.0, stock: 4, reorderAt: 25, status: "low" },
  { id: "PRD-005", name: "Big Size Rabbit", sku: "YLA-BGR-002", category: "Plush", supplier: "ChinaFactory Ltd.", price: 44.99, cost: 20.0, stock: 2, reorderAt: 10, status: "critical" },
  { id: "PRD-006", name: "Clear Bow Glass", sku: "MGG-CBG-001", category: "Glassware", supplier: "ChinaFactory Ltd.", price: 14.99, cost: 5.5, stock: 78, reorderAt: 30, status: "active" },
  { id: "PRD-007", name: "Pot Mug", sku: "MGG-PTM-002", category: "Glassware", supplier: "ChinaFactory Ltd.", price: 12.99, cost: 4.0, stock: 3, reorderAt: 25, status: "critical" },
  { id: "PRD-008", name: "Bow Mug", sku: "MGG-BWM-003", category: "Glassware", supplier: "ChinaFactory Ltd.", price: 12.99, cost: 4.0, stock: 67, reorderAt: 25, status: "active" },
  { id: "PRD-009", name: "Red Vase", sku: "FLW-RDV-001", category: "Home Decor", supplier: "KoreaGoods Co.", price: 32.99, cost: 14.0, stock: 31, reorderAt: 10, status: "active" },
  { id: "PRD-010", name: "Cherry Mug", sku: "MGG-CHM-004", category: "Glassware", supplier: "ChinaFactory Ltd.", price: 13.99, cost: 5.0, stock: 4, reorderAt: 20, status: "low" },
];

export const STOCK_HISTORY = [
  { date: "01/12/25", product: "Vbear : Blue Heart Pillow", action: "stock-in", qty: 50, user: "Admin", note: "From Korea" },
  { date: "01/12/25", product: "Vbear : Red Heart Pillow", action: "stock-in", qty: 50, user: "Shop Owner", note: "From Korea" },
  { date: "01/12/25", product: "Vbear : Huggie Bear", action: "stock-in", qty: 50, user: "Admin", note: "From China" },
  { date: "02/12/25", product: "Yolaa : Mini Rabbit", action: "stock-out", qty: 12, user: "Admin", note: "From Korea" },
  { date: "02/12/25", product: "Yolaa : Big Size Rabbit", action: "stock-out", qty: 8, user: "Shop Owner", note: "From China" },
  { date: "04/12/25", product: "Miggie : Clear Bow Glass", action: "stock-in", qty: 50, user: "Shop Owner", note: "From China" },
  { date: "04/12/25", product: "Miggie : Pot Mug", action: "stock-out", qty: 22, user: "Shop Owner", note: "From China" },
  { date: "04/12/25", product: "Miggie : Bow Mug", action: "stock-in", qty: 50, user: "Admin", note: "From China" },
  { date: "05/12/25", product: "Flowwrs : Red Vase", action: "stock-out", qty: 13, user: "Admin", note: "From Korea" },
];

export const CATEGORIES = [
  { id: "CAT-001", name: "Pillows", description: "Decorative and comfort pillows", products: 2, active: true },
  { id: "CAT-002", name: "Plush", description: "Stuffed animals and plush toys", products: 3, active: true },
  { id: "CAT-003", name: "Glassware", description: "Mugs, glasses and glass products", products: 4, active: true },
  { id: "CAT-004", name: "Home Decor", description: "Decorative items for the home", products: 1, active: true },
  { id: "CAT-005", name: "Miscellaneous", description: "Uncategorized items", products: 0, active: true },
];

export const SUPPLIERS = [
  { id: "SUP-001", name: "KoreaGoods Co.", country: "South Korea", contact: "Kim Jiyeon", email: "jiyeon@koreagoods.kr", phone: "+82-2-1234-5678", products: 4, status: "active", leadDays: 14 },
  { id: "SUP-002", name: "ChinaFactory Ltd.", country: "China", contact: "Li Wei", email: "liwei@chinafactory.cn", phone: "+86-21-8765-4321", products: 6, status: "active", leadDays: 21 },
  { id: "SUP-003", name: "LocalMakers PH", country: "Philippines", contact: "Maria Santos", email: "maria@localmakers.ph", phone: "+63-917-123-4567", products: 0, status: "inactive", leadDays: 7 },
];

export const WAREHOUSES = [
  { id: "WH-001", name: "Main Warehouse", location: "Phnom Penh, Cambodia", capacity: 5000, used: 3240, manager: "Voronit", status: "active" },
  { id: "WH-002", name: "North Storage", location: "Siem Reap, Cambodia", capacity: 2000, used: 480, manager: "Sorolen", status: "active" },
];

export const ORDERS = [
  { id: "ORD-002345", date: "12/01/26", customer: "Lena Park", product: "Helmet", qty: 2, unit: 10.00, total: 20.00, status: "delivered" },
  { id: "ORD-002346", date: "12/01/26", customer: "Mira Chen", product: "Shoe", qty: 3, unit: 10.00, total: 30.00, status: "processing" },
  { id: "ORD-002347", date: "12/01/26", customer: "Jake Ramos", product: "Blanket", qty: 1, unit: 10.00, total: 10.00, status: "shipped" },
  { id: "ORD-002348", date: "12/01/26", customer: "Ana Rivera", product: "Pillow", qty: 6, unit: 10.00, total: 60.00, status: "delivered" },
  { id: "ORD-002349", date: "12/01/26", customer: "Tom Nguyen", product: "Tumbler", qty: 1, unit: 10.00, total: 10.00, status: "cancelled" },
  { id: "ORD-002350", date: "12/01/26", customer: "Sora Kim", product: "Tissue", qty: 1, unit: 10.00, total: 10.00, status: "processing" },
  { id: "ORD-002351", date: "12/01/26", customer: "Noa Lee", product: "Table", qty: 1, unit: 10.00, total: 10.00, status: "shipped" },
  { id: "ORD-002352", date: "12/01/26", customer: "Pia Santos", product: "Lamp", qty: 3, unit: 10.00, total: 30.00, status: "delivered" },
];

export const PO_LIST = [
  { id: "PO-0041", date: "05/01/26", supplier: "KoreaGoods Co.", items: 3, total: 1240.00, status: "received", eta: "15/01/26" },
  { id: "PO-0042", date: "08/01/26", supplier: "ChinaFactory Ltd.", items: 5, total: 2890.00, status: "in-transit", eta: "22/01/26" },
  { id: "PO-0043", date: "10/01/26", supplier: "KoreaGoods Co.", items: 2, total: 640.00, status: "pending", eta: "25/01/26" },
  { id: "PO-0044", date: "12/01/26", supplier: "ChinaFactory Ltd.", items: 4, total: 1760.00, status: "pending", eta: "28/01/26" },
];

export const NOTIFS = [
  { id: 1, type: "warn", icon: "⚠️", title: "Low stock alert", body: "Yolaa: Mini Rabbit is below reorder point (4 units left)", time: "2 min ago", read: false },
  { id: 2, type: "danger", icon: "🚨", title: "Critical stock", body: "Yolaa: Big Size Rabbit has only 2 units remaining", time: "8 min ago", read: false },
  { id: 3, type: "info", icon: "📦", title: "Stock received", body: "PO-0041 from KoreaGoods Co. has been fully received", time: "1h ago", read: false },
  { id: 4, type: "info", icon: "✏️", title: "User activity", body: "Voronit is editing the inventory records", time: "2h ago", read: true },
  { id: 5, type: "warn", icon: "⚠️", title: "Low stock alert", body: "Miggie: Pot Mug has only 3 units remaining", time: "3h ago", read: false },
];

export const AUDIT_LOG = [
  { id: 1, time: "12/01/26 14:32", user: "Voronit", action: "Stock In", target: "Bow Mug (50 units)", ip: "192.168.1.10" },
  { id: 2, time: "12/01/26 14:10", user: "Sorolen", action: "Order Updated", target: "ORD-002346 → shipped", ip: "192.168.1.22" },
  { id: 3, time: "12/01/26 13:55", user: "Voronit", action: "Product Edited", target: "Mini Rabbit — price changed", ip: "192.168.1.10" },
  { id: 4, time: "12/01/26 12:00", user: "Admin", action: "User Added", target: "Sorolen (Sale Supervisor)", ip: "192.168.1.1" },
  { id: 5, time: "11/01/26 16:20", user: "Sorolen", action: "Stock Out", target: "Red Vase (13 units)", ip: "192.168.1.22" },
  { id: 6, time: "11/01/26 11:45", user: "Voronit", action: "PO Created", target: "PO-0044 — ChinaFactory Ltd.", ip: "192.168.1.10" },
];

export const USERS = [
  { id: "USR-001", email: "nitnaseygamer@gmail.com", username: "Voronit", phone: "0162749824", role: "Admin", password: "Aa123456$", active: true },
  { id: "USR-002", email: "lenlenphnompenh@gmail.com", username: "Sorolen", phone: "0213457896", role: "Sale Supervisor", password: "Ba45661;", active: true },
];