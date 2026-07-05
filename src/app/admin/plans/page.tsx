import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import { Plus, Package } from 'lucide-react';
import { PlanFormDialog } from './_components/plan-form-dialog';
import { DeletePlanButton } from './_components/delete-plan-button';

export default async function AdminPlansPage() {
  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { priceMonthly: 'asc' },
    include: { _count: { select: { subscriptions: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subscription Plans</h1>
          <p className="mt-1 text-sm text-slate-500">
            {plans.length} plan{plans.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <PlanFormDialog mode="create" />
      </div>

      {plans.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-16 text-center">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
            <Package className="h-6 w-6 text-indigo-500" />
          </div>
          <p className="font-medium text-slate-700">No plans yet</p>
          <p className="mt-1 text-sm text-slate-400">Create your first subscription plan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-xl border bg-white p-5 shadow-sm flex flex-col ${
                plan.isActive ? 'border-slate-200' : 'border-slate-100 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="font-semibold text-slate-800">{plan.name}</h2>
                  <p className="text-xs text-slate-500 font-mono">{plan.slug}</p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    plan.isActive
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {plan.description && (
                <p className="text-sm text-slate-500 mb-4 flex-1">{plan.description}</p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-900">
                    {formatCurrency(plan.priceMonthly)}
                  </span>
                  <span className="text-sm text-slate-400">/ month</span>
                </div>
                {plan.priceYearly > 0 && (
                  <div className="text-sm text-slate-500">
                    {formatCurrency(plan.priceYearly)} / year
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="rounded-lg bg-slate-50 py-2">
                  <p className="text-sm font-semibold text-slate-800">
                    {plan.maxProducts === 0 ? '∞' : plan.maxProducts}
                  </p>
                  <p className="text-xs text-slate-400">Products</p>
                </div>
                <div className="rounded-lg bg-slate-50 py-2">
                  <p className="text-sm font-semibold text-slate-800">
                    {plan.maxStaff === 0 ? '∞' : plan.maxStaff}
                  </p>
                  <p className="text-xs text-slate-400">Staff</p>
                </div>
                <div className="rounded-lg bg-slate-50 py-2">
                  <p className="text-sm font-semibold text-slate-800">
                    {plan.maxShops === 0 ? '∞' : plan.maxShops}
                  </p>
                  <p className="text-xs text-slate-400">Shops</p>
                </div>
              </div>

              <p className="text-xs text-slate-400 mb-4">
                {plan._count.subscriptions} active subscription{plan._count.subscriptions !== 1 ? 's' : ''}
              </p>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <PlanFormDialog
                  mode="edit"
                  plan={{
                    id: plan.id,
                    name: plan.name,
                    slug: plan.slug,
                    description: plan.description ?? '',
                    priceMonthly: plan.priceMonthly,
                    priceYearly: plan.priceYearly,
                    maxProducts: plan.maxProducts,
                    maxStaff: plan.maxStaff,
                    maxShops: plan.maxShops,
                    isActive: plan.isActive,
                    razorpayPlanId: plan.razorpayPlanId ?? '',
                  }}
                />
                {plan._count.subscriptions === 0 && (
                  <DeletePlanButton planId={plan.id} planName={plan.name} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
