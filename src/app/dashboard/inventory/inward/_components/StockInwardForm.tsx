'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import {
  PackagePlus,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Package,
} from 'lucide-react';
import { recordStockInward } from '@/actions/inventory';
import { formatStock, toTotalPieces } from '@/lib/utils';
import type { ActionState } from '@/types';

interface ProductRow {
  id: number;
  name: string;
  sku: string | null;
  piecesPerCarton: number;
  currentStockPieces: number;
}

const initialState: ActionState = { success: false };

export function StockInwardForm({ products }: { products: ProductRow[] }) {
  const [state, formAction, isPending] = useActionState(recordStockInward, initialState);

  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [cartonsQty, setCartonsQty] = useState(0);
  const [piecesQty, setPiecesQty] = useState(0);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const totalPiecesAdding = selectedProduct
    ? toTotalPieces(cartonsQty, piecesQty, selectedProduct.piecesPerCarton)
    : 0;
  const newStockPieces = selectedProduct
    ? selectedProduct.currentStockPieces + totalPiecesAdding
    : 0;

  function handleProductChange(id: number) {
    setSelectedProductId(id);
    setCartonsQty(0);
    setPiecesQty(0);
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/inventory"
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PackagePlus className="h-6 w-6 text-indigo-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Stock Inward</h1>
          <p className="text-sm text-gray-500">Record received stock for a product</p>
        </div>
      </div>

      {/* Success */}
      {state.success && (
        <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-800">Stock updated successfully!</p>
            <p className="text-sm text-green-600">{state.data?.message}</p>
          </div>
        </div>
      )}

      {/* Error */}
      {state.error && !state.success && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{state.error}</p>
        </div>
      )}

      <form action={formAction} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        {/* Product selector */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Product <span className="text-red-500">*</span>
          </label>
          <select
            name="productId"
            required
            value={selectedProductId}
            onChange={(e) => handleProductChange(parseInt(e.target.value, 10))}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          >
            <option value="">— Select a product —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}{p.sku ? ` (${p.sku})` : ''}
              </option>
            ))}
          </select>

          {/* Current stock preview */}
          {selectedProduct && (
            <div className="mt-2 px-3 py-2 bg-blue-50 rounded-lg flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-blue-700">
                Current stock:{' '}
                <strong>
                  {formatStock(selectedProduct.currentStockPieces, selectedProduct.piecesPerCarton)}
                </strong>
                <span className="text-blue-500 ml-1">
                  ({selectedProduct.currentStockPieces} pieces)
                </span>
              </span>
              <span className="ml-auto text-xs text-blue-500">
                {selectedProduct.piecesPerCarton} pcs/carton
              </span>
            </div>
          )}
        </div>

        {/* Quantity inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Cartons Received
            </label>
            <input
              type="number"
              name="cartonsQty"
              min="0"
              value={cartonsQty}
              onChange={(e) => setCartonsQty(parseInt(e.target.value || '0', 10))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="0"
            />
            {selectedProduct && cartonsQty > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                = {cartonsQty * selectedProduct.piecesPerCarton} pieces
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Additional Pieces
            </label>
            <input
              type="number"
              name="piecesQty"
              min="0"
              value={piecesQty}
              onChange={(e) => setPiecesQty(parseInt(e.target.value || '0', 10))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="0"
            />
          </div>
        </div>

        {/* Total preview */}
        {selectedProduct && totalPiecesAdding > 0 && (
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-indigo-700">Adding:</span>
              <span className="font-semibold text-indigo-800">
                {formatStock(totalPiecesAdding, selectedProduct.piecesPerCarton)}
                {' '}({totalPiecesAdding} pieces)
              </span>
            </div>
            <div className="flex justify-between text-sm border-t border-indigo-200 pt-2">
              <span className="text-indigo-700">New total stock:</span>
              <span className="font-bold text-indigo-900">
                {formatStock(newStockPieces, selectedProduct.piecesPerCarton)}
                {' '}({newStockPieces} pieces)
              </span>
            </div>
          </div>
        )}

        {/* Note */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Note (optional)
          </label>
          <textarea
            name="note"
            rows={2}
            placeholder="e.g. Supplier invoice #INV-001, delivery date..."
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending || !selectedProductId || totalPiecesAdding === 0}
            className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Recording…
              </>
            ) : (
              <>
                <PackagePlus className="h-4 w-4" />
                Record Inward
              </>
            )}
          </button>
          <Link
            href="/dashboard/inventory"
            className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>

      {/* Adjust stock section */}
      <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-700 mb-1">Need to adjust stock?</h2>
        <p className="text-xs text-gray-500 mb-3">
          For corrections, damage write-offs, or manual adjustments.
        </p>
        <AdjustStockInlineForm products={products} />
      </div>
    </div>
  );
}

// ─── Inline Adjust Stock form ────────────────────────────────────────────────

import { adjustStock } from '@/actions/inventory';

function AdjustStockInlineForm({ products }: { products: ProductRow[] }) {
  const [state, formAction, isPending] = useActionState(adjustStock, initialState);
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [adjustType, setAdjustType] = useState<'ADD' | 'REMOVE'>('ADD');

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <>
      {state.success && (
        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <p className="text-sm text-green-700">{state.data?.message}</p>
        </div>
      )}
      {state.error && !state.success && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <p className="text-sm text-red-700">{state.error}</p>
        </div>
      )}
      <form action={formAction} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Product</label>
            <select
              name="productId"
              required
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value ? parseInt(e.target.value, 10) : '')}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              <option value="">— Select product —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Adjustment Type</label>
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              <button
                type="button"
                onClick={() => setAdjustType('ADD')}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                  adjustType === 'ADD'
                    ? 'bg-green-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                + Add
              </button>
              <button
                type="button"
                onClick={() => setAdjustType('REMOVE')}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                  adjustType === 'REMOVE'
                    ? 'bg-red-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                − Remove
              </button>
            </div>
          </div>
        </div>
        <input type="hidden" name="adjustmentType" value={adjustType} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Quantity (pieces)
              {selectedProduct && (
                <span className="ml-1 text-gray-400">
                  — current: {selectedProduct.currentStockPieces}
                </span>
              )}
            </label>
            <input
              type="number"
              name="quantityPieces"
              min="1"
              required
              placeholder="0"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Note (optional)</label>
            <input
              type="text"
              name="note"
              placeholder="Reason for adjustment…"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className={`px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors flex items-center gap-2 disabled:cursor-not-allowed ${
            adjustType === 'ADD'
              ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-300'
              : 'bg-red-600 hover:bg-red-700 disabled:bg-red-300'
          }`}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {adjustType === 'ADD' ? '+ Add to Stock' : '− Remove from Stock'}
        </button>
      </form>
    </>
  );
}
