'use client';

import { useState, useActionState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { addStaffMember } from '@/actions/staff';
import type { ActionState } from '@/types';

const SCREEN_ACCESS_PERMISSIONS = [
  { key: 'canViewDashboard', label: 'View Dashboard' },
  { key: 'canViewProducts', label: 'View Products' },
  { key: 'canManageProducts', label: 'Manage Products' },
  { key: 'canViewInventory', label: 'View Inventory' },
  { key: 'canLogStockInward', label: 'Log Stock Inward' },
  { key: 'canAdjustStock', label: 'Adjust Stock' },
  { key: 'canCreateSales', label: 'Create Sales' },
  { key: 'canViewSalesHistory', label: 'View Sales History' },
  { key: 'canViewVendors', label: 'View Vendors' },
  { key: 'canManageVendors', label: 'Manage Vendors' },
  { key: 'canLogPurchases', label: 'Log Purchases' },
  { key: 'canMakeVendorPayments', label: 'Make Vendor Payments' },
  { key: 'canViewExpenses', label: 'View Expenses' },
  { key: 'canLogExpenses', label: 'Log Expenses' },
  { key: 'canViewCashFlow', label: 'View Cash Flow' },
  { key: 'canFinalizeCashFlow', label: 'Finalize Cash Flow' },
  { key: 'canViewCustomers', label: 'View Customers' },
  { key: 'canManageCustomers', label: 'Manage Customers' },
  { key: 'canCollectCreditPayments', label: 'Collect Credit Payments' },
  { key: 'canViewAnalytics', label: 'View Analytics' },
  { key: 'canExportReports', label: 'Export Reports' },
  { key: 'canManageStaff', label: 'Manage Staff' },
  { key: 'canViewSettings', label: 'View Settings' },
];

const DATA_VISIBILITY_PERMISSIONS = [
  { key: 'canViewCostPrices', label: 'View Cost Prices' },
  { key: 'canViewProfitMargins', label: 'View Profit Margins' },
  { key: 'canViewVendorPayAmounts', label: 'View Vendor Pay Amounts' },
  { key: 'canViewNetCashBalance', label: 'View Net Cash Balance' },
];

interface AddStaffDialogProps {
  editorIsOwner: boolean;
}

export function AddStaffDialog({ editorIsOwner }: AddStaffDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addStaffMember,
    { success: false }
  );

  function handleSuccess() {
    if (state.success) setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition shadow-sm"
      >
        <UserPlus className="h-4 w-4" />
        Add Staff
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 m-4">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Add Staff Member</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={formAction} onSubmit={handleSuccess} className="p-6 space-y-5">
              {state.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {state.error}
                </div>
              )}
              {state.success && state.data?.message && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {state.data.message}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    required
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    placeholder="jane@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  required
                  className="block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                >
                  {editorIsOwner && <option value="MANAGER">Manager</option>}
                  <option value="STAFF">Staff</option>
                </select>
                <p className="mt-1 text-xs text-slate-400">
                  A temporary password &quot;Welcome@123&quot; will be set for new users.
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Screen Access</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SCREEN_ACCESS_PERMISSIONS.map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name={key}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-600">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Data Visibility</p>
                <div className="grid grid-cols-2 gap-2">
                  {DATA_VISIBILITY_PERMISSIONS.map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name={key}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-600">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition"
                >
                  {pending ? 'Adding…' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
