import { redirect } from 'next/navigation';
import { getSessionUser, getPermissions } from '@/lib/permissions';
import { tenantPrisma } from '@/lib/prisma';
import { startOfDay, endOfDay, formatCurrency } from '@/lib/utils';
import SalesTrendChart, { type SalesTrendPoint } from '@/components/charts/sales-trend';
import ExpensePieChart, { type ExpenseSlice } from '@/components/charts/expense-pie';
import ProfitLossBarChart, { type ProfitLossPoint } from '@/components/charts/profit-loss-bar';
import { AnalyticsDateFilter } from './_components/analytics-date-filter';

interface AnalyticsPageProps {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
  }>;
}

function getRangeDates(range: string, from?: string, to?: string): { start: Date; end: Date } {
  const now = new Date();
  if (range === 'custom' && from && to) {
    return {
      start: startOfDay(new Date(from)),
      end: endOfDay(new Date(to)),
    };
  }
  const days = range === '30d' ? 30 : 7;
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  return { start: startOfDay(start), end: endOfDay(now) };
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  let user;
  try {
    user = await getSessionUser();
  } catch {
    redirect('/');
  }

  const shopId = user.shopMembers[0]?.shopId;
  if (!shopId) {
    return (
      <div className="py-12 text-center text-slate-500">
        No shop associated with your account.
      </div>
    );
  }

  const ctx = await getPermissions(shopId);
  if (!ctx.isOwner && !ctx.isSuperAdmin && !ctx.permissions?.canViewAnalytics) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500 font-medium">You don&apos;t have permission to view analytics.</p>
      </div>
    );
  }

  const canViewProfitMargins = ctx.isOwner || ctx.isSuperAdmin || !!ctx.permissions?.canViewProfitMargins;

  const params = await searchParams;
  const range = params.range ?? '7d';
  const { start, end } = getRangeDates(range, params.from, params.to);

  const db = tenantPrisma(shopId);

  // Fetch raw sales in range
  const sales = await db.sale.findMany({
    where: { saleDate: { gte: start, lte: end } },
    select: { saleDate: true, netAmount: true },
    orderBy: { saleDate: 'asc' },
  });

  // Fetch raw expenses in range
  const expenses = await db.expense.findMany({
    where: { expenseDate: { gte: start, lte: end } },
    select: { expenseDate: true, category: true, amount: true },
  });

  // Build sales trend data (group by day)
  const salesByDay = new Map<string, number>();
  // Pre-fill all days in range
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = cursor.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    salesByDay.set(key, 0);
    cursor.setDate(cursor.getDate() + 1);
  }
  for (const s of sales) {
    const key = new Date(s.saleDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    salesByDay.set(key, (salesByDay.get(key) ?? 0) + s.netAmount);
  }
  const salesTrendData: SalesTrendPoint[] = Array.from(salesByDay.entries()).map(([date, amount]) => ({
    date,
    amount,
  }));

  // Build expense pie data (group by category)
  const expByCat = new Map<string, number>();
  for (const e of expenses) {
    const cat = e.category || 'Other';
    expByCat.set(cat, (expByCat.get(cat) ?? 0) + e.amount);
  }
  const expensePieData: ExpenseSlice[] = Array.from(expByCat.entries()).map(([category, amount]) => ({
    category,
    amount,
  }));

  // Build profit/loss monthly data (last 6 months regardless of filter for broader view)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const allSalesMonthly = await db.sale.findMany({
    where: { saleDate: { gte: sixMonthsAgo } },
    select: { saleDate: true, netAmount: true },
  });
  const allExpensesMonthly = await db.expense.findMany({
    where: { expenseDate: { gte: sixMonthsAgo } },
    select: { expenseDate: true, amount: true },
  });

  const plMap = new Map<string, { sales: number; expenses: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    plMap.set(key, { sales: 0, expenses: 0 });
  }
  for (const s of allSalesMonthly) {
    const key = new Date(s.saleDate).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    const entry = plMap.get(key);
    if (entry) entry.sales += s.netAmount;
  }
  for (const e of allExpensesMonthly) {
    const key = new Date(e.expenseDate).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    const entry = plMap.get(key);
    if (entry) entry.expenses += e.amount;
  }
  const profitLossData: ProfitLossPoint[] = Array.from(plMap.entries()).map(([month, v]) => ({
    month,
    sales: v.sales,
    expenses: v.expenses,
    net: v.sales - v.expenses,
  }));

  // Summary stats
  const totalSales = sales.reduce((s, r) => s + r.netAmount, 0);
  const totalExpenses = expenses.reduce((s, r) => s + r.amount, 0);
  const netPL = totalSales - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Header — sticky */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky top-0 z-30 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 pt-1 pb-3 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">
            {range === 'custom' && params.from && params.to
              ? `${new Date(params.from).toLocaleDateString('en-IN')} – ${new Date(params.to).toLocaleDateString('en-IN')}`
              : range === '30d'
              ? 'Last 30 days'
              : 'Last 7 days'}
          </p>
        </div>
        <AnalyticsDateFilter currentRange={range} from={params.from} to={params.to} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Sales</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(totalSales)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Expenses</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(totalExpenses)}</p>
        </div>
        {canViewProfitMargins && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Net P/L</p>
            <p className={`mt-2 text-2xl font-bold ${netPL >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(netPL))}
              <span className="ml-1 text-sm font-normal">{netPL >= 0 ? 'profit' : 'loss'}</span>
            </p>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Sales Trend</h2>
          <SalesTrendChart data={salesTrendData} />
        </div>

        {/* Expense Distribution */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Expense Distribution</h2>
          <ExpensePieChart data={expensePieData} />
        </div>
      </div>

      {/* Profit / Loss — full width, only if permitted */}
      {canViewProfitMargins && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Monthly Profit / Loss (Last 6 Months)</h2>
          <ProfitLossBarChart data={profitLossData} />
        </div>
      )}
    </div>
  );
}
