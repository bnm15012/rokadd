'use client';

import { useActionState, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Receipt,
  PlusCircle,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  CalendarDays,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { createExpense, deleteExpense } from '@/actions/expenses';
import { formatCurrency } from '@/lib/utils';
import type { ActionState } from '@/types';

const COMMON_CATEGORIES = [
  'Rent',
  'Electricity',
  'Staff Wages',
  'Tea / Refreshments',
  'Transport',
  'Maintenance',
  'Other',
];

interface ExpenseRow {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  expenseDate: string;
}

const initialState: ActionState = { success: false };

export function ExpensesClient({
  initialExpenses,
  fromDate,
  toDate,
  today,
  canLog,
}: {
  initialExpenses: ExpenseRow[];
  fromDate: string;
  toDate: string;
  today: string;
  canLog: boolean;
}) {
  const router = useRouter();
  const [createState, createFormAction, isCreating] = useActionState(
    createExpense,
    initialState
  );

  const [category, setCategory] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPendingDelete, startDeleteTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);

  const totalAmount = initialExpenses.reduce((sum, e) => sum + e.amount, 0);
  const isRange = fromDate !== toDate;
  const isToday = fromDate === today && toDate === today;

  function handleDelete(expenseId: string) {
    setDeletingId(expenseId);
    startDeleteTransition(async () => {
      await deleteExpense(expenseId);
      setDeletingId(null);
      router.refresh();
    });
  }

  function handleFilter(formData: FormData) {
    const from = formData.get('from') as string;
    const to = formData.get('to') as string;
    if (from && to) {
      router.push(`/dashboard/expenses?from=${from}&to=${to}`);
    } else if (from) {
      router.push(`/dashboard/expenses?from=${from}`);
    }
  }

  function getFilterLabel(): string {
    if (isToday) return 'Today';
    if (isRange) {
      return `${fmtDate(fromDate)} — ${fmtDate(toDate)}`;
    }
    return fmtDate(fromDate);
  }

  function fmtDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  // Category breakdown
  const categoryTotals = Object.entries(
    initialExpenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      {/* Sticky header + filter bar */}
      <div className="sticky top-0 z-30 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 pt-1 pb-3 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)] space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Receipt className="h-6 w-6 text-indigo-600" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">Expenses</h1>
              <p className="text-sm text-slate-500">Track daily business expenses</p>
            </div>
          </div>
          {canLog && (
            <button
              onClick={() => setShowForm((p) => !p)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
            >
              {showForm ? <X className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
              {showForm ? 'Close' : 'Add Expense'}
            </button>
          )}
        </div>

        {/* Filter bar */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-3 flex flex-wrap items-center gap-3">
          <form
            action={(fd) => handleFilter(fd)}
            className="flex flex-wrap items-center gap-2"
          >
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500">From</label>
              <input
                type="date"
                name="from"
                defaultValue={fromDate}
                max={today}
                className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-36"
              />
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500">To</label>
              <input
                type="date"
                name="to"
                defaultValue={toDate}
                max={today}
                className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-36"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition"
            >
              Filter
            </button>
            {!isToday && (
              <button
                type="button"
                onClick={() => router.push('/dashboard/expenses')}
                className="px-3 py-1.5 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-medium transition"
              >
                Reset
              </button>
            )}
          </form>

          <div className="ml-auto flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <CalendarDays className="h-3.5 w-3.5" />
              {getFilterLabel()}
            </span>
            <div className="text-right border-l border-slate-100 pl-4">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Total</p>
              <p className="text-base font-bold text-slate-900">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Add Expense form */}
      {canLog && showForm && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-5">
          {/* Success */}
          {createState.success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
              <p className="text-xs text-green-700">Expense recorded!</p>
            </div>
          )}

          {/* Error */}
          {createState.error && !createState.success && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-700">{createState.error}</p>
            </div>
          )}

          <form action={createFormAction}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
              {/* Category */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {COMMON_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        category === cat
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  name="category"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Custom category…"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                />
              </div>

              {/* Description */}
              <div className="lg:col-span-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  placeholder="Brief description…"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                />
              </div>

              {/* Amount */}
              <div className="lg:col-span-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Amount (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                  <input
                    type="number"
                    name="amount"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                  />
                </div>
              </div>

              {/* Date */}
              <div className="lg:col-span-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date</label>
                <input
                  type="date"
                  name="expenseDate"
                  defaultValue={today}
                  max={today}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                />
              </div>

              {/* Submit */}
              <div className="lg:col-span-1">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PlusCircle className="h-4 w-4" />
                  )}
                  {isCreating ? 'Saving…' : 'Add'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Category breakdown chips (only when there are expenses) */}
      {categoryTotals.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categoryTotals.map(([cat, total]) => (
            <div
              key={cat}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-1.5 shadow-sm"
            >
              <span className="text-xs font-medium text-slate-600">{cat}</span>
              <span className="text-xs font-bold text-slate-800">{formatCurrency(total)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Expense table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {initialExpenses.length === 0 ? (
          <div className="py-12 text-center">
            <Receipt className="h-8 w-8 text-slate-200 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No expenses found for {getFilterLabel().toLowerCase()}</p>
            {canLog && !showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                + Add your first expense
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide w-10">
                    #
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Category
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Description
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Date
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Amount
                  </th>
                  {canLog && (
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide text-center w-16" />
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {initialExpenses.map((expense, idx) => (
                  <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2.5 text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 max-w-xs truncate">
                      {expense.description ?? (
                        <span className="text-slate-300 italic text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(expense.expenseDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      <span className="text-slate-400 ml-1">
                        {new Date(expense.expenseDate).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                      {formatCurrency(expense.amount)}
                    </td>
                    {canLog && (
                      <td className="px-4 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDelete(expense.id)}
                          disabled={isPendingDelete && deletingId === expense.id}
                          className="text-slate-300 hover:text-red-500 disabled:opacity-40 transition-colors"
                          title="Delete expense"
                        >
                          {isPendingDelete && deletingId === expense.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50">
                  <td
                    colSpan={canLog ? 4 : 3}
                    className="px-4 py-2.5 text-sm font-semibold text-slate-700"
                  >
                    Total ({initialExpenses.length} expense{initialExpenses.length !== 1 ? 's' : ''})
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm font-bold text-slate-900">
                    {formatCurrency(totalAmount)}
                  </td>
                  {canLog && <td />}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
