'use client';

import { useState, useActionState, useEffect } from 'react';
import { Plus, Pencil, X } from 'lucide-react';
import { createPlan, updatePlan } from '../_actions/plan-actions';
import type { ActionState } from '@/types';

interface PlanData {
  id: number;
  name: string;
  slug: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  maxProducts: number;
  maxStaff: number;
  maxShops: number;
  isActive: boolean;
  razorpayPlanId: string;
}

interface PlanFormDialogProps {
  mode: 'create' | 'edit';
  plan?: PlanData;
}

export function PlanFormDialog({ mode, plan }: PlanFormDialogProps) {
  const [open, setOpen] = useState(false);

  const action = mode === 'create' ? createPlan : updatePlan;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    { success: false }
  );

  useEffect(() => {
    if (state.success) {
      const t = setTimeout(() => setOpen(false), 800);
      return () => clearTimeout(t);
    }
  }, [state]);

  return (
    <>
      {mode === 'create' ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition shadow-sm"
        >
          <Plus className="h-4 w-4" />
          New Plan
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition flex-1 justify-center"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 m-4">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">
                {mode === 'create' ? 'Create New Plan' : `Edit: ${plan?.name}`}
              </h2>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form action={formAction} className="p-5 space-y-4">
              {mode === 'edit' && <input type="hidden" name="planId" value={plan?.id} />}

              {state.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  {state.error}
                </div>
              )}
              {state.success && state.data?.message && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
                  {state.data.message}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Plan Name</label>
                <input
                  name="name"
                  defaultValue={plan?.name}
                  required
                  className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  placeholder="Starter, Pro, Enterprise…"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  name="description"
                  defaultValue={plan?.description}
                  rows={2}
                  className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 resize-none"
                  placeholder="Short plan description…"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Price (₹)</label>
                  <input
                    name="priceMonthly"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={plan ? plan.priceMonthly / 100 : ''}
                    required
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    placeholder="999.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Yearly Price (₹)</label>
                  <input
                    name="priceYearly"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={plan ? plan.priceYearly / 100 : ''}
                    required
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    placeholder="9999.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Products</label>
                  <input name="maxProducts" type="number" min="0" defaultValue={plan?.maxProducts ?? 100}
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  />
                  <p className="text-xs text-slate-400 mt-0.5">0 = unlimited</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Staff</label>
                  <input name="maxStaff" type="number" min="0" defaultValue={plan?.maxStaff ?? 5}
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  />
                  <p className="text-xs text-slate-400 mt-0.5">0 = unlimited</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Shops</label>
                  <input name="maxShops" type="number" min="1" defaultValue={plan?.maxShops ?? 1}
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Razorpay Plan ID</label>
                <input
                  name="razorpayPlanId"
                  defaultValue={plan?.razorpayPlanId}
                  className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  placeholder="plan_xxxxxxxxxxxxx"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={plan?.isActive ?? true}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                />
                <span className="text-sm text-slate-700">Plan is active (visible to customers)</span>
              </label>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button type="submit" disabled={pending}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition"
                >
                  {pending ? 'Saving…' : mode === 'create' ? 'Create Plan' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
