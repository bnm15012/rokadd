import type { Role } from "@/generated/prisma/enums";

export interface MemberPermission {
  id: number;
  shopMemberId: number;
  canViewDashboard: boolean;
  canViewProducts: boolean;
  canManageProducts: boolean;
  canViewInventory: boolean;
  canLogStockInward: boolean;
  canAdjustStock: boolean;
  canCreateSales: boolean;
  canViewSalesHistory: boolean;
  canViewVendors: boolean;
  canManageVendors: boolean;
  canLogPurchases: boolean;
  canMakeVendorPayments: boolean;
  canViewExpenses: boolean;
  canLogExpenses: boolean;
  canViewCashFlow: boolean;
  canFinalizeCashFlow: boolean;
  canViewCustomers: boolean;
  canManageCustomers: boolean;
  canCollectCreditPayments: boolean;
  canViewAnalytics: boolean;
  canExportReports: boolean;
  canManageStaff: boolean;
  canViewSettings: boolean;
  canViewCostPrices: boolean;
  canViewProfitMargins: boolean;
  canViewVendorPayAmounts: boolean;
  canViewNetCashBalance: boolean;
}

export type PermissionKey = keyof Omit<MemberPermission, "id" | "shopMemberId">;

export interface ShopMemberInfo {
  id: number;
  shopId: number;
  shopName: string;
  shopSlug: string;
  role: Role;
  managerId: number | null;
  permissions: MemberPermission | null;
}

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  isSuperAdmin: boolean;
  shopMembers: ShopMemberInfo[];
}

export interface ActionState {
  success: boolean;
  error?: string;
  data?: any;
}

export interface SaleItemInput {
  productId: number;
  cartonsQty: number;
  piecesQty: number;
}

export interface PurchaseItemInput {
  productId: number;
  cartonsQty: number;
  piecesQty: number;
}
