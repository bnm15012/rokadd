import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { Building2, Users, TrendingUp, CreditCard, ArrowRight, Eye } from 'lucide-react';

export default async function AdminDashboardPage() {
  // Platform stats
  const [
    totalShops,
    totalUsers,
    activeSubscriptions,
    recentShops,
    subscriptionPayments,
  ] = await Promise.all([
    prisma.shop.count(),
    prisma.user.count(),
    prisma.subscription.count({
      where: { status: { in: ['ACTIVE', 'TRIALING'] } },
    }),
    prisma.shop.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        members: {
          where: { role: 'OWNER' },
          take: 1,
          include: { user: { select: { email: true, name: true } } },
        },
        subscription: {
          include: { plan: true },
        },
      },
    }),
    // MRR: sum of payments from this month
    prisma.subscriptionPayment.aggregate({
      _sum: { amount: true },
      where: {
        paidAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
        status: 'captured',
      },
    }),
  ]);

  const mrr = subscriptionPayments._sum.amount ?? 0;

  const statCards = [
    {
      label: 'Total Shops',
      value: totalShops.toString(),
      icon: Building2,
      iconColor: 'text-indigo-600 bg-indigo-100',
      bg: 'bg-gradient-to-br from-indigo-50 to-violet-50',
      border: 'border-l-indigo-500',
      valueColor: 'text-indigo-700',
    },
    {
      label: 'Active Subscriptions',
      value: activeSubscriptions.toString(),
      icon: CreditCard,
      iconColor: 'text-emerald-600 bg-emerald-100',
      bg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
      border: 'border-l-emerald-500',
      valueColor: 'text-emerald-700',
    },
    {
      label: 'Total Users',
      value: totalUsers.toString(),
      icon: Users,
      iconColor: 'text-blue-600 bg-blue-100',
      bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
      border: 'border-l-blue-500',
      valueColor: 'text-blue-700',
    },
    {
      label: 'MRR (This Month)',
      value: formatCurrency(mrr),
      icon: TrendingUp,
      iconColor: 'text-violet-600 bg-violet-100',
      bg: 'bg-gradient-to-br from-violet-50 to-purple-50',
      border: 'border-l-violet-500',
      valueColor: 'text-violet-700',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Platform-wide overview and metrics.</p>
        <div className="mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, iconColor, bg, border, valueColor }) => (
          <div
            key={label}
            className={`${bg} rounded-xl border border-white/80 border-l-4 ${border} p-5 hover:shadow-lg hover:scale-[1.02] transition-all duration-200`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`inline-flex rounded-lg p-2.5 ${iconColor}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${valueColor}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Recent sign-ups */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 to-transparent">
          <h2 className="font-semibold text-slate-900">Recent Shop Sign-ups</h2>
          <Link
            href="/admin/tenants"
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {recentShops.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm">No shops yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Shop
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Owner
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Plan
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Created
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentShops.map((shop) => {
                const owner = shop.members[0]?.user;
                const sub = shop.subscription;
                return (
                  <tr key={shop.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/tenants/${shop.id}`}
                        className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline transition"
                      >
                        {shop.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {owner ? (
                        <div>
                          <p className="text-slate-700">{owner.name}</p>
                          <p className="text-xs text-slate-400">{owner.email}</p>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {sub?.plan?.name ?? <span className="text-slate-300">No plan</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {sub ? (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            sub.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-700'
                              : sub.status === 'TRIALING'
                              ? 'bg-blue-100 text-blue-700'
                              : sub.status === 'EXPIRED' || sub.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {sub.status}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">
                      {new Date(shop.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/tenants/${shop.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition shadow-sm"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View Store
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
