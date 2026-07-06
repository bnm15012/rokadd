'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, ChevronLeft, ChevronRight, FileText, Printer } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────

export interface DaySummary {
  date: string; // YYYY-MM-DD
  totalSales: number;
  totalCashSales: number;
  totalCreditSales: number;
  totalExpenses: number;
  totalVendorPayments: number;
  totalCreditCollected: number;
  netCash: number;
}

interface Props {
  shopName: string;
  month: string; // YYYY-MM
  today: string;
  daySummaries: DaySummary[];
}

// ── Helpers ────────────────────────────────────────────────

function monthLabel(monthStr: string): string {
  const [y, m] = monthStr.split('-').map(Number);
  return new Date(y, m - 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
}

function prevMonth(monthStr: string): string {
  const [y, m] = monthStr.split('-').map(Number);
  const d = new Date(y, m - 2, 1); // m is 1-indexed, Date month is 0-indexed
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function nextMonth(monthStr: string): string {
  const [y, m] = monthStr.split('-').map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function isCurrentOrFutureMonth(monthStr: string, today: string): boolean {
  const currentMonth = today.slice(0, 7);
  return monthStr >= currentMonth;
}

// ── Component ──────────────────────────────────────────────

export function MonthlyReportClient({ shopName, month, today, daySummaries }: Props) {
  const router = useRouter();

  // Month totals
  const totals = daySummaries.reduce(
    (acc, d) => ({
      totalSales: acc.totalSales + d.totalSales,
      totalCashSales: acc.totalCashSales + d.totalCashSales,
      totalCreditSales: acc.totalCreditSales + d.totalCreditSales,
      totalExpenses: acc.totalExpenses + d.totalExpenses,
      totalVendorPayments: acc.totalVendorPayments + d.totalVendorPayments,
      totalCreditCollected: acc.totalCreditCollected + d.totalCreditCollected,
      netCash: acc.netCash + d.netCash,
    }),
    {
      totalSales: 0,
      totalCashSales: 0,
      totalCreditSales: 0,
      totalExpenses: 0,
      totalVendorPayments: 0,
      totalCreditCollected: 0,
      netCash: 0,
    },
  );

  const daysWithActivity = daySummaries.filter(
    (d) => d.totalSales > 0 || d.totalExpenses > 0 || d.totalVendorPayments > 0 || d.totalCreditCollected > 0,
  ).length;

  return (
    <div className="space-y-5">
      {/* Header — sticky */}
      <div className="print:hidden mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-1.5 bg-gradient-to-br from-emerald-500 to-teal-500 shadow-sm">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Monthly Summary</h1>
              <p className="text-sm text-slate-500">{shopName}</p>
            </div>
          </div>

          {/* Month navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/dashboard/report/monthly?month=${prevMonth(month)}`)}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
            >
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </button>

            <div className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-800 min-w-[160px] text-center">
              {monthLabel(month)}
            </div>

            <button
              onClick={() => router.push(`/dashboard/report/monthly?month=${nextMonth(month)}`)}
              disabled={isCurrentOrFutureMonth(month, today)}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </button>

            <Link
              href="/dashboard/report"
              className="inline-flex items-center gap-1.5 ml-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              <FileText className="h-4 w-4" />
              Daily Report
            </Link>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block mb-4 border-b-2 border-slate-900 pb-3">
        <h1 className="text-2xl font-bold text-slate-900">{shopName}</h1>
        <h2 className="text-lg font-semibold text-slate-700 mt-1">Monthly Summary — {monthLabel(month)}</h2>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <SummaryCard label="Total Sales" value={totals.totalSales} color="text-slate-900" />
        <SummaryCard label="Cash Sales" value={totals.totalCashSales} color="text-blue-700" />
        <SummaryCard label="Credit Sales" value={totals.totalCreditSales} color="text-amber-700" />
        <SummaryCard label="Expenses" value={totals.totalExpenses} color="text-red-600" />
        <SummaryCard label="Vendor Pay" value={totals.totalVendorPayments} color="text-orange-600" />
        <SummaryCard label="Credit Collected" value={totals.totalCreditCollected} color="text-green-600" />
        <SummaryCard
          label="Net Cash"
          value={totals.netCash}
          color={totals.netCash >= 0 ? 'text-emerald-700' : 'text-red-700'}
        />
      </div>

      {/* Active days */}
      <p className="text-xs text-slate-500">
        {daysWithActivity} of {daySummaries.length} days with activity
      </p>

      {/* Day-by-day table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Date</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Total Sales</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600 whitespace-nowrap hidden sm:table-cell">Cash Sales</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600 whitespace-nowrap hidden sm:table-cell">Credit Sales</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Expenses</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Vendor Pay</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600 whitespace-nowrap hidden md:table-cell">Credit Collected</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Net Cash</th>
            </tr>
          </thead>
          <tbody>
            {daySummaries.map((day) => {
              const hasActivity =
                day.totalSales > 0 ||
                day.totalExpenses > 0 ||
                day.totalVendorPayments > 0 ||
                day.totalCreditCollected > 0;

              return (
                <tr
                  key={day.date}
                  className={cn(
                    'border-b border-slate-100 hover:bg-slate-50 transition-colors',
                    !hasActivity && 'text-slate-300',
                  )}
                >
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <Link
                      href={`/dashboard/report?from=${day.date}&to=${day.date}`}
                      className={cn(
                        'hover:text-indigo-600 transition-colors',
                        hasActivity ? 'font-medium text-slate-800' : 'text-slate-400',
                      )}
                    >
                      {dayLabel(day.date)}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium whitespace-nowrap">
                    {day.totalSales > 0 ? formatCurrency(day.totalSales) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap hidden sm:table-cell text-blue-700">
                    {day.totalCashSales > 0 ? formatCurrency(day.totalCashSales) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap hidden sm:table-cell text-amber-700">
                    {day.totalCreditSales > 0 ? formatCurrency(day.totalCreditSales) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap text-red-600">
                    {day.totalExpenses > 0 ? formatCurrency(day.totalExpenses) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap text-orange-600">
                    {day.totalVendorPayments > 0 ? formatCurrency(day.totalVendorPayments) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap hidden md:table-cell text-green-600">
                    {day.totalCreditCollected > 0 ? formatCurrency(day.totalCreditCollected) : '—'}
                  </td>
                  <td
                    className={cn(
                      'px-4 py-2.5 text-right font-semibold whitespace-nowrap',
                      !hasActivity
                        ? 'text-slate-300'
                        : day.netCash >= 0
                          ? 'text-emerald-700'
                          : 'text-red-700',
                    )}
                  >
                    {hasActivity ? formatCurrency(day.netCash) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Totals row */}
          <tfoot>
            <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold">
              <td className="px-4 py-3 text-slate-900">Total</td>
              <td className="px-4 py-3 text-right text-slate-900">{formatCurrency(totals.totalSales)}</td>
              <td className="px-4 py-3 text-right text-blue-700 hidden sm:table-cell">{formatCurrency(totals.totalCashSales)}</td>
              <td className="px-4 py-3 text-right text-amber-700 hidden sm:table-cell">{formatCurrency(totals.totalCreditSales)}</td>
              <td className="px-4 py-3 text-right text-red-600">{formatCurrency(totals.totalExpenses)}</td>
              <td className="px-4 py-3 text-right text-orange-600">{formatCurrency(totals.totalVendorPayments)}</td>
              <td className="px-4 py-3 text-right text-green-600 hidden md:table-cell">{formatCurrency(totals.totalCreditCollected)}</td>
              <td
                className={cn(
                  'px-4 py-3 text-right',
                  totals.netCash >= 0 ? 'text-emerald-700' : 'text-red-700',
                )}
              >
                {formatCurrency(totals.netCash)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Net Cash formula */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
        <p className="text-xs text-slate-500 font-mono">
          Net Cash = Cash Sales + Credit Collected − Vendor Payments − Expenses
        </p>
      </div>

      {/* Print footer */}
      <div className="hidden print:block mt-6 pt-3 border-t border-slate-300 text-center text-xs text-slate-500">
        <p>Generated by Rokadd on {new Date().toLocaleDateString('en-IN')} at {new Date().toLocaleTimeString('en-IN')}</p>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm px-3 py-2.5">
      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{label}</p>
      <p className={cn('text-base font-bold mt-0.5', color)}>{formatCurrency(value)}</p>
    </div>
  );
}
