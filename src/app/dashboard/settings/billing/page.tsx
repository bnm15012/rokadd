import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser, getPermissions } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Package,
  Users,
  CalendarDays,
  Crown,
} from 'lucide-react';
import { PlanUpgradeButton } from './_components/plan-upgrade-button';

export default async function BillingPage() {
  let user;
  try {
    user = await getSessionUser();
  } catch {
    redirect('/');
  }

  const shopId = user.shopMembers[0]?.shopId;
  if (!shopId) {
    return (
      <div className="py-12 text-center text-slate-500">No shop found for your account.</div>
    );
  }

  const ctx = await getPermissions(shopId);
  if (!ctx.isOwner && !ctx.isSuperAdmin) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500 font-medium">Only shop owners can view billing information.</p>
      </div>
    );
  }

  const subscription = await prisma.subscription.findUnique({
    where: { shopId },
    include: {
      plan: true,
      payments: {
        orderBy: { paidAt: 'desc' },
        take: 20,
      },
    },
  });

  const allPlans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { priceMonthly: 'asc' },
  });

  const statusInfo = (status?: string | null) => {
    switch (status) {
      case 'ACTIVE': return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'Active' };
      case 'TRIALING': return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: 'Trial' };
      case 'PAST_DUE': return { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Past Due' };
      case 'CANCELLED': return { icon: XCircle, color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200', label: 'Cancelled' };
      case 'EXPIRED': return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'Expired' };
      default: return { icon: AlertCircle, color: 'text-slate-400', bg: 'bg-slate-50 border-slate-200', label: 'No Subscription' };
    }
  };

  const si = statusInfo(subscription?.status);
  const StatusIcon = si.icon;

  return (
    <div className="space-y-5">
      {/* Breadcrumb + Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
          <Link href="/dashboard/settings" className="hover:text-indigo-600 transition">Settings</Link>
          <span>/</span>
          <span>Billing</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Billing & Subscription</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your plan and view payment history.</p>
      </div>

      {/* Current plan — compact row */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="p-4 flex flex-wrap items-center gap-4 sm:gap-6">
          {/* Plan name + status */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={`rounded-lg p-2 ${si.bg} border`}>
              <CreditCard className={`h-5 w-5 ${si.color}`} />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-800 truncate">
                {subscription?.plan?.name ?? 'No active plan'}
              </h2>
              <div className={`inline-flex items-center gap-1 text-xs font-medium ${si.color}`}>
                <StatusIcon className="h-3.5 w-3.5" />
                {si.label}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          {subscription && (
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
              {subscription.plan && (
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-900">{formatCurrency(subscription.plan.priceMonthly)}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">per month</p>
                </div>
              )}
              {subscription.currentPeriodEnd && (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs">
                    Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
              {subscription.trialEndsAt && (
                <div className="flex items-center gap-1.5 text-blue-600">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="text-xs">
                    Trial ends {new Date(subscription.trialEndsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
              {subscription.plan && (
                <>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Package className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs">{subscription.plan.maxProducts === 0 ? 'Unlimited' : subscription.plan.maxProducts} products</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs">{subscription.plan.maxStaff === 0 ? 'Unlimited' : subscription.plan.maxStaff} staff</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Available plans — horizontal table-like layout */}
      {allPlans.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <h2 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Available Plans</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Plan</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Monthly</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Yearly</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Products</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Staff</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allPlans.map((plan) => {
                  const isCurrent = subscription?.planId === plan.id;
                  const currentPrice = subscription?.plan?.priceMonthly ?? 0;
                  const isUpgrade = plan.priceMonthly > currentPrice;
                  return (
                    <tr key={plan.id} className={`transition-colors ${isCurrent ? 'bg-indigo-50/40' : 'hover:bg-slate-50/50'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isCurrent && <Crown className="h-3.5 w-3.5 text-indigo-500" />}
                          <span className="font-medium text-slate-800">{plan.name}</span>
                        </div>
                        {plan.description && (
                          <p className="text-xs text-slate-400 mt-0.5">{plan.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">
                        {formatCurrency(plan.priceMonthly)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {plan.priceYearly ? formatCurrency(plan.priceYearly) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        {plan.maxProducts === 0 ? 'Unlimited' : plan.maxProducts}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        {plan.maxStaff === 0 ? 'Unlimited' : plan.maxStaff}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <PlanUpgradeButton
                          planId={plan.id}
                          planName={plan.name}
                          planPrice={plan.priceMonthly}
                          isCurrent={isCurrent}
                          isUpgrade={isUpgrade}
                          currentPlanPrice={currentPrice}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment history */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Payment History</h2>
        </div>
        {subscription?.payments && subscription.payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Reference</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {subscription.payments.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2.5 text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {p.paidAt
                        ? new Date(p.paidAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs text-slate-400">
                        {p.razorpayPaymentId ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.status === 'captured'
                            ? 'bg-emerald-100 text-emerald-700'
                            : p.status === 'failed'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {p.status ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-800">
                      {formatCurrency(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-slate-400">No payment history yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
