'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Printer, FileText, ArrowRight, Lock, CheckCircle, Loader2, Calendar, Grid3X3 } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { finalizeDailySummary } from '@/actions/cashflow';
import type { ActionState } from '@/types';

// ── Types ──────────────────────────────────────────────────

export interface DayReport {
  date: string;
  saleItems: { productName: string; totalPieces: number; lineTotal: number; saleType: string }[];
  totalCashSales: number;
  totalSales: number;
  totalDiscount: number;
  expenses: { category: string; description: string | null; amount: number }[];
  totalExpenses: number;
  vendorPayments: { vendorName: string; amount: number; paymentMode: string; billNumber: string | null }[];
  totalVendorPayments: number;
  creditPayments: { customerName: string; amount: number; paymentMode: string }[];
  totalCreditCollected: number;
  netCashBalance: number;
  reconItems: { productName: string; openingStock: number; closingStock: number; unitsSold: number; salesAmount: number }[];
  reconTotalSales: number | null;
  reconCashInHand: number | null;
  reconCashDifference: number | null;
}

interface Props {
  shopName: string;
  fromDate: string;
  toDate: string;
  today: string;
  dayReports: DayReport[];
  canFinalize: boolean;
  isFinalized: boolean;
}

// ── Helpers ────────────────────────────────────────────────

function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function fmtDateLong(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Single Day Report Section ──────────────────────────────

function DaySection({ day, shopName, showPageBreak }: { day: DayReport; shopName: string; showPageBreak: boolean }) {
  const dateLabel = fmtDateLong(day.date);

  // Aggregate sale items by product
  const productSalesMap = new Map<string, { qty: number; amount: number }>();
  for (const item of day.saleItems) {
    const existing = productSalesMap.get(item.productName);
    if (existing) {
      existing.qty += item.totalPieces;
      existing.amount += item.lineTotal;
    } else {
      productSalesMap.set(item.productName, { qty: item.totalPieces, amount: item.lineTotal });
    }
  }
  const aggregatedSales = Array.from(productSalesMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className={showPageBreak ? 'print:break-before-page' : ''}>
      {/* Day header */}
      <div className="rounded-xl bg-slate-800 px-5 py-3 mb-4 print:rounded-none print:bg-slate-200 print:border-b-2 print:border-slate-900 print:mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white print:text-slate-900">{shopName}</h2>
            <p className="text-sm text-slate-300 print:text-slate-600">Daily Report — {dateLabel}</p>
          </div>
          <p className="text-xs text-slate-400 print:text-slate-500">{day.date}</p>
        </div>
      </div>

      {/* Sales */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-3 print:rounded-none print:shadow-none print:border print:border-slate-400 print:mb-4">
        <div className="bg-indigo-50 px-4 py-2 border-b border-slate-200 print:bg-slate-100">
          <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wider print:text-slate-900">Sales</h3>
        </div>
        {aggregatedSales.length > 0 || day.reconItems.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-3 py-1.5 font-semibold text-slate-600 text-xs">#</th>
                <th className="text-left px-3 py-1.5 font-semibold text-slate-600 text-xs">Product</th>
                <th className="text-right px-3 py-1.5 font-semibold text-slate-600 text-xs">Qty</th>
                <th className="text-right px-3 py-1.5 font-semibold text-slate-600 text-xs">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(day.reconItems.length > 0 ? day.reconItems : aggregatedSales).map((item, i) => (
                <tr key={'productName' in item ? item.productName : (item as { name: string }).name} className="border-b border-slate-100">
                  <td className="px-3 py-1.5 text-slate-400 text-xs">{i + 1}</td>
                  <td className="px-3 py-1.5 text-slate-800 font-medium text-xs">
                    {'productName' in item ? item.productName : (item as { name: string }).name}
                  </td>
                  <td className="px-3 py-1.5 text-right text-slate-700 text-xs">
                    {'unitsSold' in item ? item.unitsSold : (item as { qty: number }).qty}
                  </td>
                  <td className="px-3 py-1.5 text-right text-slate-800 font-medium text-xs">
                    {formatCurrency('salesAmount' in item ? item.salesAmount : (item as { amount: number }).amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {day.totalDiscount > 0 && (
                <tr className="border-t border-slate-200">
                  <td colSpan={3} className="px-3 py-1.5 text-right text-xs text-red-600">Discount</td>
                  <td className="px-3 py-1.5 text-right text-xs text-red-600">-{formatCurrency(day.totalDiscount)}</td>
                </tr>
              )}
              <tr className="bg-slate-50 border-t border-slate-300">
                <td colSpan={3} className="px-3 py-1.5 text-right font-bold text-slate-900 text-xs">Total Sales</td>
                <td className="px-3 py-1.5 text-right font-bold text-slate-900 text-xs">
                  {formatCurrency(day.reconItems.length > 0 ? (day.reconTotalSales ?? 0) : day.totalSales)}
                </td>
              </tr>

            </tfoot>
          </table>
        ) : (
          <div className="px-4 py-4 text-center text-xs text-slate-400">No sales</div>
        )}
      </div>

      {/* Expenses */}
      {day.expenses.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-3 print:rounded-none print:shadow-none print:border print:border-slate-400 print:mb-4">
          <div className="bg-red-50 px-4 py-2 border-b border-slate-200 print:bg-slate-100">
            <h3 className="text-xs font-bold text-red-800 uppercase tracking-wider print:text-slate-900">Expenses</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-3 py-1.5 font-semibold text-slate-600 text-xs">#</th>
                <th className="text-left px-3 py-1.5 font-semibold text-slate-600 text-xs">Category</th>
                <th className="text-left px-3 py-1.5 font-semibold text-slate-600 text-xs">Description</th>
                <th className="text-right px-3 py-1.5 font-semibold text-slate-600 text-xs">Amount</th>
              </tr>
            </thead>
            <tbody>
              {day.expenses.map((exp, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="px-3 py-1.5 text-slate-400 text-xs">{i + 1}</td>
                  <td className="px-3 py-1.5 text-slate-800 font-medium text-xs">{exp.category}</td>
                  <td className="px-3 py-1.5 text-slate-600 text-xs">{exp.description || '—'}</td>
                  <td className="px-3 py-1.5 text-right text-slate-800 font-medium text-xs">{formatCurrency(exp.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t border-slate-300">
                <td colSpan={3} className="px-3 py-1.5 text-right font-bold text-slate-900 text-xs">Total Expenses</td>
                <td className="px-3 py-1.5 text-right font-bold text-red-700 text-xs">{formatCurrency(day.totalExpenses)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Vendor Payments */}
      {day.vendorPayments.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-3 print:rounded-none print:shadow-none print:border print:border-slate-400 print:mb-4">
          <div className="bg-amber-50 px-4 py-2 border-b border-slate-200 print:bg-slate-100">
            <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider print:text-slate-900">Vendor Payments</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-3 py-1.5 font-semibold text-slate-600 text-xs">#</th>
                <th className="text-left px-3 py-1.5 font-semibold text-slate-600 text-xs">Vendor</th>
                <th className="text-left px-3 py-1.5 font-semibold text-slate-600 text-xs">Mode</th>
                <th className="text-right px-3 py-1.5 font-semibold text-slate-600 text-xs">Amount</th>
              </tr>
            </thead>
            <tbody>
              {day.vendorPayments.map((vp, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="px-3 py-1.5 text-slate-400 text-xs">{i + 1}</td>
                  <td className="px-3 py-1.5 text-slate-800 font-medium text-xs">{vp.vendorName}</td>
                  <td className="px-3 py-1.5 text-slate-600 text-xs">{vp.paymentMode}</td>
                  <td className="px-3 py-1.5 text-right text-slate-800 font-medium text-xs">{formatCurrency(vp.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t border-slate-300">
                <td colSpan={3} className="px-3 py-1.5 text-right font-bold text-slate-900 text-xs">Total</td>
                <td className="px-3 py-1.5 text-right font-bold text-amber-700 text-xs">{formatCurrency(day.totalVendorPayments)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Credit Collected */}
      {day.creditPayments.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-3 print:rounded-none print:shadow-none print:border print:border-slate-400 print:mb-4">
          <div className="bg-green-50 px-4 py-2 border-b border-slate-200 print:bg-slate-100">
            <h3 className="text-xs font-bold text-green-800 uppercase tracking-wider print:text-slate-900">Credit Collected</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-3 py-1.5 font-semibold text-slate-600 text-xs">#</th>
                <th className="text-left px-3 py-1.5 font-semibold text-slate-600 text-xs">Customer</th>
                <th className="text-left px-3 py-1.5 font-semibold text-slate-600 text-xs">Mode</th>
                <th className="text-right px-3 py-1.5 font-semibold text-slate-600 text-xs">Amount</th>
              </tr>
            </thead>
            <tbody>
              {day.creditPayments.map((cp, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="px-3 py-1.5 text-slate-400 text-xs">{i + 1}</td>
                  <td className="px-3 py-1.5 text-slate-800 font-medium text-xs">{cp.customerName}</td>
                  <td className="px-3 py-1.5 text-slate-600 text-xs">{cp.paymentMode}</td>
                  <td className="px-3 py-1.5 text-right text-slate-800 font-medium text-xs">{formatCurrency(cp.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t border-slate-300">
                <td colSpan={3} className="px-3 py-1.5 text-right font-bold text-slate-900 text-xs">Total Collected</td>
                <td className="px-3 py-1.5 text-right font-bold text-green-700 text-xs">{formatCurrency(day.totalCreditCollected)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Net Summary */}
      <div className="rounded-xl border-2 border-slate-300 bg-white shadow-sm overflow-hidden print:rounded-none print:shadow-none print:border-2 print:border-slate-900 mb-3">
        <div className="bg-slate-800 px-4 py-2 print:bg-slate-200">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider print:text-slate-900">Net Summary</h3>
        </div>
        <div className="px-4 py-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-600">Cash Sales</span>
            <span className="font-medium text-slate-800">+ {formatCurrency(day.totalCashSales)}</span>
          </div>
          {day.reconTotalSales !== null && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Reconciliation Sales</span>
              <span className="font-medium text-slate-800">+ {formatCurrency(day.reconTotalSales)}</span>
            </div>
          )}
          {day.totalCreditCollected > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Credit Collected</span>
              <span className="font-medium text-green-700">+ {formatCurrency(day.totalCreditCollected)}</span>
            </div>
          )}
          {day.totalVendorPayments > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Vendor Payments</span>
              <span className="font-medium text-red-600">- {formatCurrency(day.totalVendorPayments)}</span>
            </div>
          )}
          {day.totalExpenses > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Expenses</span>
              <span className="font-medium text-red-600">- {formatCurrency(day.totalExpenses)}</span>
            </div>
          )}
          <div className="border-t-2 border-slate-300 pt-2 mt-2">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-slate-900">Net Cash</span>
              <span className={day.netCashBalance >= 0 ? 'text-green-700' : 'text-red-700'}>
                {formatCurrency(day.netCashBalance)}
              </span>
            </div>
          </div>
          {day.reconCashInHand !== null && (
            <div className="border-t border-slate-200 pt-2 mt-1 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Cash In Hand</span>
                <span className="font-medium text-slate-800">{formatCurrency(day.reconCashInHand)}</span>
              </div>
              {day.reconCashDifference !== null && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Cash Difference</span>
                  <span className={cn('font-medium', day.reconCashDifference >= 0 ? 'text-green-600' : 'text-red-600')}>
                    {day.reconCashDifference >= 0 ? '+' : ''}{formatCurrency(day.reconCashDifference)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────

const initialState: ActionState = { success: false };

export function DailyReportClient({ shopName, fromDate, toDate, today, dayReports, canFinalize, isFinalized }: Props) {
  const router = useRouter();
  const [finalizeState, finalizeAction, finalizing] = useActionState<ActionState, FormData>(
    finalizeDailySummary,
    initialState,
  );
  const isRange = fromDate !== toDate;
  const isToday = fromDate === today && toDate === today;

  const dateLabel = isRange
    ? `${fmtDate(fromDate)} — ${fmtDate(toDate)}`
    : fmtDateLong(fromDate);

  function nav(from: string, to: string) {
    router.push(`/dashboard/report?from=${from}&to=${to}`);
  }

  function handleFilter(formData: FormData) {
    const from = formData.get('from') as string;
    const to = formData.get('to') as string;
    if (from && to) nav(from, to);
    else if (from) nav(from, from);
  }

  // Range totals
  const grandTotalSales = dayReports.reduce((s, d) => s + d.totalSales, 0);
  const grandTotalExpenses = dayReports.reduce((s, d) => s + d.totalExpenses, 0);
  const grandTotalVendorPay = dayReports.reduce((s, d) => s + d.totalVendorPayments, 0);
  const grandTotalCreditCollected = dayReports.reduce((s, d) => s + d.totalCreditCollected, 0);
  const grandNetCash = dayReports.reduce((s, d) => s + d.netCashBalance, 0);

  const presets = [
    {
      label: 'Today',
      active: isToday,
      onClick: () => nav(today, today),
    },
    {
      label: 'Yesterday',
      active: (() => { const y = new Date(); y.setDate(y.getDate() - 1); const ys = toISODate(y); return fromDate === ys && toDate === ys; })(),
      onClick: () => { const y = new Date(); y.setDate(y.getDate() - 1); nav(toISODate(y), toISODate(y)); },
    },
    {
      label: 'Last 7 Days',
      active: (() => { const d = new Date(); d.setDate(d.getDate() - 6); return fromDate === toISODate(d) && toDate === today; })(),
      onClick: () => { const d = new Date(); d.setDate(d.getDate() - 6); nav(toISODate(d), today); },
    },
    {
      label: 'This Month',
      active: (() => { const m = new Date(); m.setDate(1); return fromDate === toISODate(m) && toDate === today; })(),
      onClick: () => { const m = new Date(); m.setDate(1); nav(toISODate(m), today); },
    },
    {
      label: 'Last 30 Days',
      active: (() => { const d = new Date(); d.setDate(d.getDate() - 29); return fromDate === toISODate(d) && toDate === today; })(),
      onClick: () => { const d = new Date(); d.setDate(d.getDate() - 29); nav(toISODate(d), today); },
    },
  ];

  return (
    <div>
      {/* Screen controls — hidden on print, sticky on scroll */}
      <div className="print:hidden space-y-3 mb-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-1.5 bg-gradient-to-br from-blue-500 to-cyan-500 shadow-sm">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {isRange ? 'Report' : 'Daily Report'}
              </h1>
              <p className="text-sm text-slate-500">{dateLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/report/monthly"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              <Calendar className="h-4 w-4" />
              Monthly
            </Link>
            <Link
              href="/dashboard/report/stock-sheet"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              <Grid3X3 className="h-4 w-4" />
              Stock Sheet
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* Quick presets + custom range */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-3 flex flex-wrap items-center gap-2">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={p.onClick}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                p.active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <form action={(fd) => handleFilter(fd)} className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-slate-500">From</label>
              <input type="date" name="from" defaultValue={fromDate} max={today}
                className="text-sm border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-36" />
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-slate-500">To</label>
              <input type="date" name="to" defaultValue={toDate} max={today}
                className="text-sm border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-36" />
            </div>
            <button type="submit" className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition">
              Go
            </button>
          </form>
        </div>

        {/* Range summary cards (only for multi-day) */}
        {isRange && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <SummaryCard label="Total Sales" value={grandTotalSales} color="text-slate-900" />
            <SummaryCard label="Expenses" value={grandTotalExpenses} color="text-red-600" />
            <SummaryCard label="Vendor Payments" value={grandTotalVendorPay} color="text-amber-600" />
            <SummaryCard label="Credit Collected" value={grandTotalCreditCollected} color="text-green-600" />
            <SummaryCard label="Net Cash" value={grandNetCash} color={grandNetCash >= 0 ? 'text-green-700' : 'text-red-700'} />
          </div>
        )}
      </div>

      {/* Report content */}
      <div className="print:p-0" id="daily-report">
        {/* Range summary print header */}
        {isRange && (
          <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4">
            <h1 className="text-2xl font-bold text-slate-900">{shopName}</h1>
            <h2 className="text-lg font-semibold text-slate-700 mt-1">Report — {dateLabel}</h2>
            <div className="mt-3 grid grid-cols-5 gap-4 text-sm">
              <div><p className="text-xs text-slate-500">Sales</p><p className="font-bold">{formatCurrency(grandTotalSales)}</p></div>
              <div><p className="text-xs text-slate-500">Expenses</p><p className="font-bold text-red-600">{formatCurrency(grandTotalExpenses)}</p></div>
              <div><p className="text-xs text-slate-500">Vendor Pay</p><p className="font-bold text-amber-600">{formatCurrency(grandTotalVendorPay)}</p></div>
              <div><p className="text-xs text-slate-500">Credit Collected</p><p className="font-bold text-green-600">{formatCurrency(grandTotalCreditCollected)}</p></div>
              <div><p className="text-xs text-slate-500">Net Cash</p><p className={cn('font-bold', grandNetCash >= 0 ? 'text-green-700' : 'text-red-700')}>{formatCurrency(grandNetCash)}</p></div>
            </div>
          </div>
        )}

        {/* Per-day sections */}
        {dayReports.map((day, idx) => (
          <DaySection
            key={day.date}
            day={day}
            shopName={shopName}
            showPageBreak={isRange && idx > 0}
          />
        ))}

        {/* Finalize Day — single-day only */}
        {!isRange && (
          <div className="print:hidden mt-4">
            {(isFinalized || finalizeState.success) ? (
              <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                <span className="text-sm font-semibold text-green-700">
                  This day has been finalized. No further changes can be made.
                </span>
              </div>
            ) : canFinalize ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Finalize This Day</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Lock the summary for{' '}
                      <span className="font-medium">{fmtDateLong(fromDate)}</span>.
                      This cannot be undone.
                    </p>
                  </div>
                  <form action={finalizeAction}>
                    <input type="hidden" name="date" value={fromDate} />
                    <button
                      type="submit"
                      disabled={finalizing}
                      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {finalizing ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Finalizing...</>
                      ) : (
                        <><Lock className="h-4 w-4" /> Finalize Day</>
                      )}
                    </button>
                  </form>
                </div>
                {finalizeState.error && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                    {finalizeState.error}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Print footer */}
        <div className="hidden print:block mt-8 pt-4 border-t border-slate-300 text-center text-xs text-slate-500">
          <p suppressHydrationWarning>Generated by Rokadd on {new Date().toLocaleDateString('en-IN')} at {new Date().toLocaleTimeString('en-IN')}</p>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm px-4 py-3">
      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{label}</p>
      <p className={cn('text-lg font-bold mt-0.5', color)}>{formatCurrency(value)}</p>
    </div>
  );
}
