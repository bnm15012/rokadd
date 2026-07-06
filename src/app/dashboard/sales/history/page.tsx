import { redirect } from 'next/navigation';
import Link from 'next/link';
import { History, ShoppingCart, ArrowLeft } from 'lucide-react';
import { getSessionUser, requirePermission } from '@/lib/permissions';
import { tenantPrisma } from '@/lib/prisma';
import { formatCurrency, startOfDay, endOfDay } from '@/lib/utils';

export default async function SalesHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  let user;
  try {
    user = await getSessionUser();
  } catch {
    redirect('/');
  }

  const shopId = user.shopMembers[0]?.shopId;
  if (!shopId) redirect('/');

  try {
    await requirePermission(shopId, 'canViewSalesHistory');
  } catch {
    return (
      <div className="p-8">
        <p className="text-red-600 font-medium">
          You do not have permission to view sales history.
        </p>
      </div>
    );
  }

  const params = await searchParams;
  const dateFilter = typeof params.date === 'string' ? params.date : null;

  const db = tenantPrisma(shopId);

  const whereDate = dateFilter
    ? { saleDate: { gte: startOfDay(new Date(dateFilter)), lte: endOfDay(new Date(dateFilter)) } }
    : {};

  const sales = await db.sale.findMany({
    where: whereDate,
    include: {
      customer: true,
      items: true,
    },
    orderBy: { saleDate: 'desc' },
    take: 100,
  });

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Sticky header + filter */}
      <div className="space-y-3 mb-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/sales"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="rounded-lg p-1.5 bg-gradient-to-br from-emerald-500 to-teal-500 shadow-sm">
            <History className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sales History</h1>
            <p className="text-sm text-gray-500">
              {dateFilter ? `Showing sales for ${dateFilter}` : 'Last 100 sales'}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/dashboard/sales"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              New Sale
            </Link>
          </div>
        </div>

        {/* Date filter */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <label className="text-sm text-gray-600 font-medium whitespace-nowrap">
            Filter by date:
          </label>
          <form className="flex items-center gap-2">
            <input
              type="date"
              name="date"
              defaultValue={dateFilter ?? today}
              max={today}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium transition-colors"
            >
              Filter
            </button>
            {dateFilter && (
              <Link
                href="/dashboard/sales/history"
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </Link>
            )}
          </form>
          <span className="ml-auto text-sm text-gray-500">
            {sales.length} sale{sales.length !== 1 ? 's' : ''} found
          </span>
        </div>
      </div>

      {/* Summary cards */}
      {sales.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-5 mt-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Total Sales</p>
            <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Cash Sales</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(
                sales.filter((s) => s.saleType === 'CASH').reduce((sum, s) => sum + s.netAmount, 0)
              )}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Credit Sales</p>
            <p className="text-2xl font-bold text-amber-600">
              {formatCurrency(
                sales.filter((s) => s.saleType === 'CREDIT').reduce((sum, s) => sum + s.netAmount, 0)
              )}
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {sales.length === 0 ? (
          <div className="py-16 text-center">
            <History className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No sales found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Invoice
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Date & Time
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Customer
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Type
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Items
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Total
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Discount
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Net Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-indigo-700 font-semibold">
                      {sale.invoiceNo ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(sale.saleDate).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {sale.customer?.name ?? (
                        <span className="text-gray-400 text-xs italic">Walk-in</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          sale.saleType === 'CASH'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {sale.saleType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {sale.items.length}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {formatCurrency(sale.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right text-red-600">
                      {sale.discount > 0 ? `− ${formatCurrency(sale.discount)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {formatCurrency(sale.netAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-gray-700">
                    Total ({sales.length} sales)
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    {formatCurrency(sales.reduce((sum, s) => sum + s.totalAmount, 0))}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-red-600">
                    {sales.some((s) => s.discount > 0)
                      ? `− ${formatCurrency(sales.reduce((sum, s) => sum + s.discount, 0))}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                    {formatCurrency(sales.reduce((sum, s) => sum + s.netAmount, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
