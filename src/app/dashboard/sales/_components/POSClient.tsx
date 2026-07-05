'use client';

import { useActionState, useState, useCallback } from 'react';
import Link from 'next/link';
import { ShoppingCart, Search, Trash2, Plus, Minus, CheckCircle, AlertCircle, Loader2, History } from 'lucide-react';
import { createSale } from '@/actions/sales';
import { calculateLineTotal, formatCurrency, formatStock, toTotalPieces } from '@/lib/utils';
import type { ActionState, SaleItemInput } from '@/types';
import { cn } from '@/lib/utils';

interface ProductRow {
  id: string;
  name: string;
  sku: string | null;
  categoryName: string | null;
  piecesPerCarton: number;
  sellingPricePerCarton: number;
  sellingPricePerPiece: number;
  currentStockPieces: number;
}

interface CustomerRow {
  id: string;
  name: string;
  phone: string | null;
}

interface CartItem {
  product: ProductRow;
  cartonsQty: number;
  piecesQty: number;
}

const initialState: ActionState = { success: false };

export function POSClient({
  products,
  customers,
}: {
  products: ProductRow[];
  customers: CustomerRow[];
}) {
  const [state, formAction, isPending] = useActionState(createSale, initialState);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [discount, setDiscount] = useState('');
  const [saleType, setSaleType] = useState<'CASH' | 'CREDIT'>('CASH');
  const [customerId, setCustomerId] = useState('');
  const [lastInvoice, setLastInvoice] = useState<string | null>(null);

  // When action succeeds, capture invoice and reset cart
  const wrappedAction = useCallback(
    async (prevState: ActionState, formData: FormData): Promise<ActionState> => {
      const result = await createSale(prevState, formData);
      if (result.success) {
        setLastInvoice(result.data?.invoiceNo ?? null);
        setCart([]);
        setDiscount('');
        setSaleType('CASH');
        setCustomerId('');
      }
      return result;
    },
    []
  );

  const [actionState, dispatchAction, pending] = useActionState(wrappedAction, initialState);

  const filteredProducts = products.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku?.toLowerCase().includes(q) ?? false) ||
      (p.categoryName?.toLowerCase().includes(q) ?? false)
    );
  });

  function addToCart(product: ProductRow) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        // Increment cartons by 1
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, cartonsQty: i.cartonsQty + 1 }
            : i
        );
      }
      return [...prev, { product, cartonsQty: 1, piecesQty: 0 }];
    });
  }

  function updateCartItem(productId: string, field: 'cartonsQty' | 'piecesQty', value: number) {
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, [field]: Math.max(0, value) } : i
      )
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }

  const grandTotal = cart.reduce((sum, item) => {
    return (
      sum +
      calculateLineTotal(
        item.cartonsQty,
        item.piecesQty,
        item.product.sellingPricePerCarton,
        item.product.sellingPricePerPiece
      )
    );
  }, 0);

  const discountAmount = discount ? Math.round(parseFloat(discount) * 100) : 0;
  const netAmount = Math.max(0, grandTotal - discountAmount);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const items: SaleItemInput[] = cart.map((i) => ({
      productId: i.product.id,
      cartonsQty: i.cartonsQty,
      piecesQty: i.piecesQty,
    }));
    fd.set('items', JSON.stringify(items));
    fd.set('saleType', saleType);
    if (customerId) fd.set('customerId', customerId);

    dispatchAction(fd);
  }

  return (
    <div className="flex" style={{ height: 'calc(100vh - 5rem)' }}>
      {/* LEFT: Product search + grid */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200 bg-white rounded-xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <ShoppingCart className="h-5 w-5 text-indigo-600" />
          <h1 className="text-lg font-bold text-gray-900">Point of Sale</h1>
          <Link
            href="/dashboard/sales/history"
            className="ml-auto inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 font-medium transition-colors"
          >
            <History className="h-3.5 w-3.5" />
            History
          </Link>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, SKU or category…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 xl:grid-cols-3 gap-3 content-start">
          {filteredProducts.length === 0 && (
            <p className="col-span-3 text-center text-sm text-gray-400 py-10">
              No products found
            </p>
          )}
          {filteredProducts.map((product) => {
            const inCart = cart.some((i) => i.product.id === product.id);
            const stockOk = product.currentStockPieces > 0;
            return (
              <button
                key={product.id}
                type="button"
                disabled={!stockOk}
                onClick={() => addToCart(product)}
                className={cn(
                  'text-left p-3 rounded-lg border transition-all',
                  stockOk
                    ? inCart
                      ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-300'
                      : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
                    : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                )}
              >
                <p className="text-sm font-semibold text-gray-800 leading-tight truncate">
                  {product.name}
                </p>
                {product.sku && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{product.sku}</p>
                )}
                {product.categoryName && (
                  <span className="inline-block text-xs bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 mt-1">
                    {product.categoryName}
                  </span>
                )}
                <div className="mt-2 flex items-end justify-between">
                  <div>
                    <p className="text-xs text-gray-500">
                      ₹{(product.sellingPricePerCarton / 100).toFixed(0)}/ctn
                    </p>
                    <p className="text-xs text-gray-400">
                      ₹{(product.sellingPricePerPiece / 100).toFixed(0)}/pc
                    </p>
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      stockOk ? 'text-green-600' : 'text-red-500'
                    )}
                  >
                    {stockOk
                      ? formatStock(product.currentStockPieces, product.piecesPerCarton)
                      : 'Out of stock'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Cart + Billing */}
      <div className="w-96 flex-shrink-0 flex flex-col bg-gray-50">
        {/* Success banner */}
        {lastInvoice && actionState.success && (
          <div className="mx-4 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">Sale created!</p>
              <p className="text-xs text-green-600 font-mono">{lastInvoice}</p>
            </div>
            <button
              type="button"
              onClick={() => setLastInvoice(null)}
              className="ml-auto text-green-400 hover:text-green-600 text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* Error banner */}
        {actionState.error && !actionState.success && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{actionState.error}</p>
          </div>
        )}

        {/* Cart header */}
        <div className="px-5 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Cart ({cart.length} items)
            </h2>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {cart.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Add products to cart</p>
            </div>
          )}

          {cart.map((item) => {
            const lineTotal = calculateLineTotal(
              item.cartonsQty,
              item.piecesQty,
              item.product.sellingPricePerCarton,
              item.product.sellingPricePerPiece
            );
            const totalPieces = toTotalPieces(
              item.cartonsQty,
              item.piecesQty,
              item.product.piecesPerCarton
            );
            const isOverStock = totalPieces > item.product.currentStockPieces;

            return (
              <div
                key={item.product.id}
                className={cn(
                  'bg-white rounded-lg p-3 border',
                  isOverStock ? 'border-red-200' : 'border-gray-100'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold text-gray-800 leading-tight">
                    {item.product.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-gray-300 hover:text-red-500 flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {isOverStock && (
                  <p className="text-xs text-red-500 mb-1.5">
                    Exceeds stock ({item.product.currentStockPieces} pieces available)
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 mb-2">
                  {/* Cartons */}
                  <div>
                    <label className="text-xs text-slate-600 font-medium block mb-1">Cartons</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          updateCartItem(item.product.id, 'cartonsQty', item.cartonsQty - 1)
                        }
                        className="w-7 h-7 rounded border border-slate-300 bg-slate-50 flex items-center justify-center hover:bg-slate-100 text-slate-700"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={item.cartonsQty}
                        onChange={(e) =>
                          updateCartItem(
                            item.product.id,
                            'cartonsQty',
                            parseInt(e.target.value || '0', 10)
                          )
                        }
                        className="w-12 text-center text-sm text-slate-900 border border-slate-300 rounded py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateCartItem(item.product.id, 'cartonsQty', item.cartonsQty + 1)
                        }
                        className="w-7 h-7 rounded border border-slate-300 bg-slate-50 flex items-center justify-center hover:bg-slate-100 text-slate-700"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Pieces */}
                  <div>
                    <label className="text-xs text-slate-600 font-medium block mb-1">
                      Pieces{item.product.piecesPerCarton > 1 ? ` (×${item.product.piecesPerCarton})` : ''}
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          updateCartItem(item.product.id, 'piecesQty', item.piecesQty - 1)
                        }
                        className="w-7 h-7 rounded border border-slate-300 bg-slate-50 flex items-center justify-center hover:bg-slate-100 text-slate-700"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={item.piecesQty}
                        onChange={(e) =>
                          updateCartItem(
                            item.product.id,
                            'piecesQty',
                            parseInt(e.target.value || '0', 10)
                          )
                        }
                        className="w-12 text-center text-sm text-slate-900 border border-slate-300 rounded py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateCartItem(item.product.id, 'piecesQty', item.piecesQty + 1)
                        }
                        className="w-7 h-7 rounded border border-slate-300 bg-slate-50 flex items-center justify-center hover:bg-slate-100 text-slate-700"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{totalPieces} pieces total</span>
                  <span className="font-semibold text-gray-800">
                    {formatCurrency(lineTotal)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Billing footer */}
        {cart.length > 0 && (
          <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white px-5 py-4 space-y-3">
            {/* Payment type */}
            <div className="flex rounded-lg overflow-hidden border border-slate-300">
              <button
                type="button"
                onClick={() => setSaleType('CASH')}
                className={cn(
                  'flex-1 py-2 text-sm font-semibold transition-colors',
                  saleType === 'CASH'
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                )}
              >
                CASH
              </button>
              <button
                type="button"
                onClick={() => setSaleType('CREDIT')}
                className={cn(
                  'flex-1 py-2 text-sm font-semibold transition-colors',
                  saleType === 'CREDIT'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                )}
              >
                CREDIT
              </button>
            </div>

            {/* Customer selector (required for credit) */}
            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1">
                Customer {saleType === 'CREDIT' && <span className="text-red-500">*</span>}
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required={saleType === 'CREDIT'}
                className="w-full text-sm text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              >
                <option value="">— Select customer (optional) —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.phone ? ` · ${c.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Discount */}
            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1">Discount (₹)</label>
              <input
                type="number"
                name="discount"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full text-sm text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              />
            </div>

            {/* Totals */}
            <div className="space-y-1.5 pt-1 border-t border-slate-200">
              <div className="flex justify-between text-sm text-slate-700">
                <span>Subtotal</span>
                <span className="font-medium">{formatCurrency(grandTotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount</span>
                  <span>− {formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>Net Total</span>
                <span>{formatCurrency(netAmount)}</span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={pending || cart.some((i) => toTotalPieces(i.cartonsQty, i.piecesQty, i.product.piecesPerCarton) > i.product.currentStockPieces)}
              className={cn(
                'w-full py-3 rounded-lg font-bold text-white text-sm transition-colors flex items-center justify-center gap-2',
                saleType === 'CASH'
                  ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-300'
                  : 'bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300',
                'disabled:cursor-not-allowed'
              )}
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  {saleType === 'CASH' ? '✓ Complete Cash Sale' : '⚠ Create Credit Sale'}
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
