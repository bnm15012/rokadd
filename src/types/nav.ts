import type { PermissionKey } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  requiredPermissions: PermissionKey[];
}

export const ALL_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", requiredPermissions: ["canViewDashboard"] },
  { label: "Products", href: "/dashboard/products", icon: "Package", requiredPermissions: ["canViewProducts"] },
  { label: "Inventory", href: "/dashboard/inventory", icon: "Warehouse", requiredPermissions: ["canViewInventory"] },
  { label: "Sales", href: "/dashboard/sales", icon: "ShoppingCart", requiredPermissions: ["canCreateSales", "canViewSalesHistory"] },
  { label: "Vendors", href: "/dashboard/vendors", icon: "Truck", requiredPermissions: ["canViewVendors"] },
  { label: "Expenses", href: "/dashboard/expenses", icon: "Receipt", requiredPermissions: ["canViewExpenses"] },
  { label: "Reconciliation", href: "/dashboard/reconciliation", icon: "ClipboardCheck", requiredPermissions: ["canAdjustStock"] },
  { label: "Daily Report", href: "/dashboard/report", icon: "FileText", requiredPermissions: ["canViewCashFlow"] },
  { label: "Customers", href: "/dashboard/customers", icon: "Users", requiredPermissions: ["canViewCustomers"] },
  { label: "Analytics", href: "/dashboard/analytics", icon: "BarChart3", requiredPermissions: ["canViewAnalytics"] },
  { label: "Settings", href: "/dashboard/settings", icon: "Settings", requiredPermissions: ["canViewSettings"] },
];

export function getVisibleNavItems(
  role: string,
  permissions: Record<string, boolean> | null
): NavItem[] {
  if (role === "OWNER") return ALL_NAV_ITEMS;
  if (!permissions) return ALL_NAV_ITEMS.filter((i) => i.requiredPermissions.includes("canViewDashboard"));
  return ALL_NAV_ITEMS.filter((item) =>
    item.requiredPermissions.some((p) => permissions[p])
  );
}
