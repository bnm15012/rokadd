'use client';

import { Fragment, useActionState, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ClipboardCheck,
  Search,
  CheckCircle,
  AlertCircle,
  Loader2,
  History,
  ArrowDownCircle,
  ArrowUpCircle,
  IndianRupee,
} from 'lucide-react';
import { submitReconciliation } from '@/actions/reconciliation';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { ActionState } from '@/types';

interface ProductRow {
  id: string;
  name: string;
  sku: string | null;
  categoryName: string | null;
  piecesPerCarton: number;
  currentStockPieces: number;
  sellingPricePerPiece: number;
  sellingPricePerCarton: number;
}

interface ExistingReconItem {
  productId: string;
  openingStock: number;
  closingStock: number;
  unitsSold: number;
  salesAmount: number;
}

interface ExistingRecon {
  totalSalesAmount: number;
  cashInHand: number | null;
  cashExpected: number | null;
  cashDifference: number | null;
  items: ExistingReconItem[];
}

interface Props {
  products: ProductRow[];
  alreadySubmitted: boolean;
  existingRecon: ExistingRecon | null;
}

const initialState: ActionState = { success: false };

export function ReconciliationClient({ products, alreadySubmitted, existingRecon }: Props) {
  const [actionState, dispatchAction, pending] = useActionState(submitReconciliation, initialState);
  const [searchQuery, setSearchQuery] = useState('');
  const [closingStocks, setClosingStocks] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const p of products) {
      init[p.id] = String(p.currentStockPieces);
    }
    return init;
  });
  const [cashInHand, setCashInHand] = useState('');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(alreadySubmitted);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku?.toLowerCase().includes(q) ?? false) ||
        (p.categoryName?.toLowerCase().includes(q) ?? false)
    );
  }, [products, searchQuery]);

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, ProductRow[]>();
    for (const p of filteredProducts) {
      const cat = p.categoryName || 'Uncategorized';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredProducts]);

  // Calculate summary
  const summary = useMemo(() => {
    let totalSalesAmount = 0;
    let itemsWithSales = 0;
    let itemsWithExcess = 0;

    for (const p of products) {
      const closing = parseInt(closingStocks[p.id] || '0', 10);
      const opening = p.currentStockPieces;
      const diff = opening - closing;
      if (diff > 0) {
        totalSalesAmount += diff * p.sellingPricePerPiece;
        itemsWithSales++;
      } else if (diff < 0) {
        itemsWithExcess++;
      }
    }

    const cashInHandPaise = cashInHand ? Math.round(parseFloat(cashInHand) * 100) : null;
    const cashDiff = cashInHandPaise !== null ? cashInHandPaise - totalSalesAmount : null;

    return { totalSalesAmount, itemsWithSales, itemsWithExcess, cashInHandPaise, cashDiff };
  }, [products, closingStocks, cashInHand]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const items = products.map((p) => ({
      productId: p.id,
      closingStock: parseInt(closingStocks[p.id] || '0', 10),
    }));

    const fd = new FormData();
    fd.set('items', JSON.stringify(items));
    if (cashInHand) fd.set('cashInHand', cashInHand);
    if (note) fd.set('note', note);

    dispatchAction(fd);
    setSubmitted(true);
  }

  // Build a product lookup for the submitted view
  const productMap = useMemo(() => {
    const map = new Map<string, ProductRow>();
    for (const p of products) map.set(p.id, p);
    return map;
  }, [products]);

  // ── Already submitted — read-only tabular view ─────────────────────
  if (submitted && (alreadySubmitted || actionState.success)) {
    const recon = existingRecon;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between sticky top-0 z-30 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 pt-1 pb-3 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-6 w-6 text-green-600" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">Daily Reconciliation</h1>
              <p className="text-sm text-slate-500">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/reconciliation/history"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 font-medium transition"
          >
            <History className="h-4 w-4" />
            View History
          </Link>
        </div>

        {/* Success banner */}
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <p className="font-semibold text-green-800">Reconciliation Complete</p>
            <p className="text-sm text-green-700">Today&apos;s stock reconciliation has been submitted.</p>
          </div>
        </div>

        {/* Summary row */}
        {recon && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Sales</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(recon.totalSalesAmount)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Items Sold</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{recon.items.filter((i) => i.unitsSold > 0).length}</p>
            </div>
            {recon.cashInHand !== null && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cash In Hand</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(recon.cashInHand)}</p>
              </div>
            )}
            {recon.cashDifference !== null && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cash Difference</p>
                <p className={cn('text-xl font-bold mt-1', recon.cashDifference >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {recon.cashDifference >= 0 ? '+' : ''}{formatCurrency(recon.cashDifference)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Per-product detail table */}
        {recon && recon.items.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Product</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Opening</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Closing</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Sold</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Sales Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {recon.items.map((item, idx) => {
                    const product = productMap.get(item.productId);
                    return (
                      <tr key={item.productId} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{product?.name ?? 'Unknown'}</p>
                          {product?.sku && <p className="text-xs text-slate-400">{product.sku}</p>}
                        </td>
                        <td className="text-center px-3 py-3 text-slate-700">{item.openingStock}</td>
                        <td className="text-center px-3 py-3 text-slate-700">{item.closingStock}</td>
                        <td className="text-center px-3 py-3">
                          {item.unitsSold > 0 ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-green-600">
                              <ArrowDownCircle className="h-3.5 w-3.5" />
                              {item.unitsSold}
                            </span>
                          ) : item.unitsSold < 0 ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                              <ArrowUpCircle className="h-3.5 w-3.5" />
                              {Math.abs(item.unitsSold)}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="text-right px-4 py-3">
                          {item.salesAmount > 0 ? (
                            <span className="font-semibold text-slate-800">{formatCurrency(item.salesAmount)}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t border-slate-200">
                    <td colSpan={4} />
                    <td className="text-center px-3 py-3 text-xs font-bold text-slate-700 uppercase">Total</td>
                    <td className="text-right px-4 py-3 font-bold text-indigo-600">{formatCurrency(recon.totalSalesAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Input form ─────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header — sticky */}
      <div className="flex items-center justify-between sticky top-0 z-30 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 pt-1 pb-3 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="h-6 w-6 text-indigo-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Daily Reconciliation</h1>
            <p className="text-sm text-slate-500">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/reconciliation/history"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 font-medium transition"
        >
          <History className="h-4 w-4" />
          History
        </Link>
      </div>

      {/* Error banner */}
      {actionState.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{actionState.error}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>How it works:</strong> Enter the physical closing stock count for each product.
          The system will calculate units sold and total sales by comparing with opening stock.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by product name, SKU or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
        />
      </div>

      {/* Products table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Product</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Opening Stock</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider w-36">Closing Stock</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Sold</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Sales Amt</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                let rowNum = 0;
                return grouped.map(([category, categoryProducts]) => (
                  <Fragment key={category}>
                    <tr>
                      <td colSpan={6} className="bg-slate-50/50 px-4 py-2 border-b border-slate-100">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{category}</span>
                      </td>
                    </tr>
                    {categoryProducts.map((product) => {
                      rowNum++;
                      const closing = parseInt(closingStocks[product.id] || '0', 10);
                      const opening = product.currentStockPieces;
                      const diff = opening - closing;
                      const salesAmt = diff > 0 ? diff * product.sellingPricePerPiece : 0;

                      return (
                        <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-slate-400">{rowNum}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800">{product.name}</p>
                            {product.sku && <p className="text-xs text-slate-400">{product.sku}</p>}
                            <p className="text-xs text-slate-400 mt-0.5">
                              ₹{(product.sellingPricePerPiece / 100).toFixed(0)}/pc
                              {product.piecesPerCarton > 1 && ` · ${product.piecesPerCarton} pcs/ctn`}
                            </p>
                          </td>
                          <td className="text-center px-3 py-3">
                            <span className="font-medium text-slate-700">{opening}</span>
                            <p className="text-xs text-slate-400">pcs</p>
                          </td>
                          <td className="text-center px-3 py-3">
                            <input
                              type="number"
                              min="0"
                              value={closingStocks[product.id] ?? ''}
                              onChange={(e) =>
                                setClosingStocks((prev) => ({ ...prev, [product.id]: e.target.value }))
                              }
                              className="w-24 text-center text-sm text-slate-900 bg-white border border-slate-300 rounded-lg py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent mx-auto block"
                            />
                            <p className="text-xs text-slate-400 mt-1">pieces</p>
                          </td>
                          <td className="text-center px-3 py-3">
                            {diff > 0 ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-green-600">
                                <ArrowDownCircle className="h-3.5 w-3.5" />
                                {diff}
                              </span>
                            ) : diff < 0 ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                                <ArrowUpCircle className="h-3.5 w-3.5" />
                                {Math.abs(diff)}
                                <span className="text-xs font-normal">(excess)</span>
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="text-right px-4 py-3">
                            {salesAmt > 0 ? (
                              <span className="font-semibold text-slate-800">{formatCurrency(salesAmt)}</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ));
              })()}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t border-slate-200">
                <td colSpan={4} />
                <td className="text-center px-3 py-3 text-xs font-bold text-slate-700 uppercase">Total</td>
                <td className="text-right px-4 py-3 font-bold text-indigo-600">{formatCurrency(summary.totalSalesAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Summary + Cash + Submit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales summary */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Sales Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Products with sales</span>
              <span className="font-medium text-slate-800">{summary.itemsWithSales}</span>
            </div>
            {summary.itemsWithExcess > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-amber-600">Products with excess</span>
                <span className="font-medium text-amber-600">{summary.itemsWithExcess}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-100">
              <span className="text-slate-900">Total Sales</span>
              <span className="text-indigo-600">{formatCurrency(summary.totalSalesAmount)}</span>
            </div>
          </div>
        </div>

        {/* Cash reconciliation */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
            <IndianRupee className="h-4 w-4 inline mr-1" />
            Cash Reconciliation
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Cash in hand (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Count your cash..."
                value={cashInHand}
                onChange={(e) => setCashInHand(e.target.value)}
                className="w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Expected (from sales)</span>
              <span className="font-medium">{formatCurrency(summary.totalSalesAmount)}</span>
            </div>
            {summary.cashDiff !== null && (
              <div className="flex justify-between text-sm font-semibold pt-2 border-t border-slate-100">
                <span>Difference</span>
                <span className={cn(summary.cashDiff >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {summary.cashDiff >= 0 ? '+' : ''}{formatCurrency(summary.cashDiff)}
                  <span className="text-xs font-normal ml-1">
                    ({summary.cashDiff >= 0 ? 'excess' : 'shortage'})
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Notes + Submit */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Notes</h3>
            <textarea
              placeholder="Any notes for today (optional)..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="mt-4 w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition flex items-center justify-center gap-2 disabled:bg-indigo-300 disabled:cursor-not-allowed"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <ClipboardCheck className="h-4 w-4" />
                Submit Reconciliation
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
