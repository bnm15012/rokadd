import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser, requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, ClipboardCheck, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Reconciliation History — Rokadd' };

export default async function ReconHistoryPage() {
  let user;
  try {
    user = await getSessionUser();
  } catch {
    redirect('/');
  }

  const shopId = user.shopMembers[0]?.shopId;
  if (!shopId) redirect('/');

  try {
    await requirePermission(shopId, 'canAdjustStock');
  } catch {
    return (
      <div className="p-8">
        <p className="text-red-600 font-medium">
          You do not have permission to view reconciliation history.
        </p>
      </div>
    );
  }

  const recons = await prisma.dailyRecon.findMany({
    where: { shopId },
    orderBy: { date: 'desc' },
    take: 30,
    include: {
      items: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/reconciliation"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Reconciliation
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Reconciliation History</h1>
        <p className="mt-1 text-sm text-slate-500">Past 30 days of stock reconciliations</p>
      </div>

      {recons.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <ClipboardCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No reconciliations found yet.</p>
          <Link
            href="/dashboard/reconciliation"
            className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Submit your first reconciliation
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Products</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Items Sold</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Total Sales</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Cash In Hand</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Difference</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Note</th>
                </tr>
              </thead>
              <tbody>
                {recons.map((recon, idx) => {
                  const itemsSold = recon.items.filter((i) => i.unitsSold > 0).length;
                  const totalItems = recon.items.length;

                  return (
                    <tr key={recon.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">
                          {new Date(recon.date).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </td>
                      <td className="text-center px-3 py-3 text-slate-700">{totalItems}</td>
                      <td className="text-center px-3 py-3">
                        <span className="font-medium text-slate-800">{itemsSold}</span>
                        <span className="text-slate-400"> / {totalItems}</span>
                      </td>
                      <td className="text-right px-3 py-3 font-semibold text-slate-800">
                        {formatCurrency(recon.totalSalesAmount)}
                      </td>
                      <td className="text-right px-3 py-3 text-slate-700">
                        {recon.cashInHand !== null ? formatCurrency(recon.cashInHand) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="text-right px-4 py-3">
                        {recon.cashDifference !== null ? (
                          <span className="inline-flex items-center gap-1 font-medium">
                            {recon.cashDifference > 0 ? (
                              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                            ) : recon.cashDifference < 0 ? (
                              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                            ) : (
                              <Minus className="h-3.5 w-3.5 text-slate-400" />
                            )}
                            <span
                              className={cn(
                                recon.cashDifference > 0
                                  ? 'text-green-600'
                                  : recon.cashDifference < 0
                                  ? 'text-red-600'
                                  : 'text-slate-500'
                              )}
                            >
                              {recon.cashDifference >= 0 ? '+' : ''}
                              {formatCurrency(recon.cashDifference)}
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3 max-w-[200px]">
                        {recon.note ? (
                          <p className="text-xs text-slate-500 truncate">{recon.note}</p>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
