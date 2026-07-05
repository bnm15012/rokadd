import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser, getPermissions } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import type { PermissionKey } from '@/types';
import { PermissionsForm } from './_components/permissions-form';

interface PermissionsPageProps {
  params: Promise<{ id: string }>;
}

const SCREEN_ACCESS_PERMISSIONS: { key: PermissionKey; label: string; group: string }[] = [
  { key: 'canViewDashboard', label: 'View Dashboard', group: 'Dashboard' },
  { key: 'canViewProducts', label: 'View Products', group: 'Products' },
  { key: 'canManageProducts', label: 'Manage Products', group: 'Products' },
  { key: 'canViewInventory', label: 'View Inventory', group: 'Inventory' },
  { key: 'canLogStockInward', label: 'Log Stock Inward', group: 'Inventory' },
  { key: 'canAdjustStock', label: 'Adjust Stock', group: 'Inventory' },
  { key: 'canCreateSales', label: 'Create Sales', group: 'Sales' },
  { key: 'canViewSalesHistory', label: 'View Sales History', group: 'Sales' },
  { key: 'canViewVendors', label: 'View Vendors', group: 'Vendors' },
  { key: 'canManageVendors', label: 'Manage Vendors', group: 'Vendors' },
  { key: 'canLogPurchases', label: 'Log Purchases', group: 'Vendors' },
  { key: 'canMakeVendorPayments', label: 'Make Vendor Payments', group: 'Vendors' },
  { key: 'canViewExpenses', label: 'View Expenses', group: 'Expenses' },
  { key: 'canLogExpenses', label: 'Log Expenses', group: 'Expenses' },
  { key: 'canViewCashFlow', label: 'View Cash Flow', group: 'Cash Flow' },
  { key: 'canFinalizeCashFlow', label: 'Finalize Cash Flow', group: 'Cash Flow' },
  { key: 'canViewCustomers', label: 'View Customers', group: 'Customers' },
  { key: 'canManageCustomers', label: 'Manage Customers', group: 'Customers' },
  { key: 'canCollectCreditPayments', label: 'Collect Credit Payments', group: 'Customers' },
  { key: 'canViewAnalytics', label: 'View Analytics', group: 'Analytics' },
  { key: 'canExportReports', label: 'Export Reports', group: 'Analytics' },
  { key: 'canManageStaff', label: 'Manage Staff', group: 'Admin' },
  { key: 'canViewSettings', label: 'View Settings', group: 'Admin' },
];

const DATA_VISIBILITY_PERMISSIONS: { key: PermissionKey; label: string }[] = [
  { key: 'canViewCostPrices', label: 'View Cost Prices' },
  { key: 'canViewProfitMargins', label: 'View Profit Margins' },
  { key: 'canViewVendorPayAmounts', label: 'View Vendor Pay Amounts' },
  { key: 'canViewNetCashBalance', label: 'View Net Cash Balance' },
];

export default async function PermissionsPage({ params }: PermissionsPageProps) {
  const { id: memberId } = await params;
  const memberIdNum = parseInt(memberId, 10);

  let user;
  try {
    user = await getSessionUser();
  } catch {
    redirect('/');
  }

  const shopId = user.shopMembers[0]?.shopId;
  if (!shopId) redirect('/');

  const ctx = await getPermissions(shopId);
  if (!ctx.isOwner && !ctx.isSuperAdmin && !ctx.permissions?.canManageStaff) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500">You don&apos;t have permission to edit staff permissions.</p>
      </div>
    );
  }

  const targetMember = await prisma.shopMember.findUnique({
    where: { id: memberIdNum },
    include: {
      user: { select: { name: true, email: true } },
      permissions: true,
    },
  });

  if (!targetMember || targetMember.shopId !== shopId) {
    notFound();
  }

  // MANAGER can only edit their own staff
  if (!ctx.isOwner && !ctx.isSuperAdmin && targetMember.managerId !== ctx.memberId) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500">You can only manage your own staff members.</p>
      </div>
    );
  }

  // Determine which keys the editor is allowed to grant
  const allowedKeys: PermissionKey[] =
    ctx.isOwner || ctx.isSuperAdmin
      ? [...SCREEN_ACCESS_PERMISSIONS.map((p) => p.key), ...DATA_VISIBILITY_PERMISSIONS.map((p) => p.key)]
      : [...SCREEN_ACCESS_PERMISSIONS.map((p) => p.key), ...DATA_VISIBILITY_PERMISSIONS.map((p) => p.key)].filter(
          (k) => !!ctx.permissions?.[k]
        );

  // Current values for the target member
  const currentPerms = targetMember.permissions;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Breadcrumb & header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
          <Link href="/dashboard/settings" className="hover:text-indigo-600 transition">Settings</Link>
          <span>/</span>
          <Link href="/dashboard/settings/staff" className="hover:text-indigo-600 transition">Staff</Link>
          <span>/</span>
          <span>{targetMember.user.name}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Edit Permissions</h1>
        <p className="mt-1 text-sm text-slate-500">
          {targetMember.user.name} &middot; {targetMember.user.email} &middot;{' '}
          <span className="font-medium">{targetMember.role}</span>
        </p>
      </div>

      <PermissionsForm
        memberId={memberIdNum}
        screenPermissions={SCREEN_ACCESS_PERMISSIONS}
        dataPermissions={DATA_VISIBILITY_PERMISSIONS}
        allowedKeys={allowedKeys}
        currentPerms={currentPerms}
      />
    </div>
  );
}
