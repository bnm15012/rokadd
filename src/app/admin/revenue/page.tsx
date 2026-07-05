import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import { RevenueChart } from './_components/revenue-chart';

export default async function AdminRevenuePage() {
  // Get all subscription payments
  const payments = await prisma.subscriptionPayment.findMany({
    orderBy: { paidAt: 'desc' },
    include: {
      subscription: {
        include: {
          shop: { select: { name: true } },
          plan: { select: { name: true } },
        },
      },
    },
  });

  // MRR = sum of captured payments this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const mrrPayments = payments.filter(
    (p) => p.status === 'captured' && p.paidAt && new Date(p.paidAt) >= monthStart
  );
  const mrr = mrrPayments.reduce((s, p) => s + p.amount, 0);

  // Total revenue (all time)
  const totalRevenue = payments
    .filter((p) => p.status === 'captured')
    .reduce((s, p) => s + p.amount, 0);

  // Build monthly chart data (last 12 months)
  const monthlyData: { month: string; revenue: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    const revenue = payments
      .filter(
        (p) =>
          p.status === 'captured' &&
          p.paidAt &&
          new Date(p.paidAt) >= d &&
          new Date(p.paidAt) <= monthEnd
      )
      .reduce((s, p) => s + p.amount, 0);
    monthlyData.push({ month: label, revenue });
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'captured': return 'bg-emerald-100 text-emerald-700';
      case 'failed': return 'bg-red-100 text-red-600';
      case 'refunded': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Revenue</h1>
        <p className="mt-1 text-sm text-slate-500">Subscription payments and platform revenue.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Revenue</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">MRR (This Month)</p>
          <p className="mt-2 text-2xl font-bold text-indigo-600">{formatCurrency(mrr)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Transactions</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{payments.length}</p>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Monthly Revenue (Last 12 Months)</h2>
        <RevenueChart data={monthlyData} />
      </div>

      {/* Payment history table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Payment History</h2>
        </div>
        {payments.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">No payments yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Shop</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Plan</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Razorpay ID</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-800">
                    {p.subscription?.shop?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {p.subscription?.plan?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs text-slate-400">
                      {p.razorpayPaymentId ?? '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(p.status ?? '')}`}>
                      {p.status ?? '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">
                    {p.paidAt
                      ? new Date(p.paidAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium text-slate-800">
                    {formatCurrency(p.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
