'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTransition, useState, useCallback } from 'react'
import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import { deleteProduct } from '@/actions/products'

interface ProductRow {
  id: string
  name: string
  sku: string | null
  categoryName: string | null
  stock: string
  isLowStock: boolean
  costPricePerCarton: string
  sellingPricePerCarton: string
  sellingPricePerPiece: string
}

interface Props {
  products: ProductRow[]
  initialQuery: string
  canManage: boolean
  canViewCostPrices: boolean
}

export function ProductsTable({
  products,
  initialQuery,
  canManage,
  canViewCostPrices,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState(initialQuery)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  // Live client-side filter (mirrors the server-side filter, avoids full navigation
  // for fast UX while also updating the URL for shareable links).
  const filtered = query.trim()
    ? products.filter((p) =>
        p.name.toLowerCase().includes(query.trim().toLowerCase())
      )
    : products

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value)
      const params = new URLSearchParams()
      if (value.trim()) params.set('q', value.trim())
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [pathname, router]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      setDeletingId(id)
      setConfirmId(null)
      const result = await deleteProduct(id)
      setDeletingId(null)
      if (!result.success) {
        alert(result.error ?? 'Failed to delete product')
      }
    },
    []
  )

  return (
    <>
      {/* Search bar */}
      <div className="mb-4">
        <div className="relative max-w-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="search"
            placeholder="Search products…"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-right">Stock</th>
                {canViewCostPrices && (
                  <th className="px-4 py-3 text-right">Cost / Ctn</th>
                )}
                <th className="px-4 py-3 text-right">Sell / Ctn</th>
                <th className="px-4 py-3 text-right">Sell / Pc</th>
                {canManage && (
                  <th className="px-4 py-3 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManage ? (canViewCostPrices ? 8 : 7) : (canViewCostPrices ? 7 : 6)}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    {query ? 'No products match your search.' : 'No products yet. Add your first product above.'}
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                      <span className="flex items-center gap-2">
                        {product.name}
                        {product.isLowStock && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                            Low stock
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap font-mono text-xs">
                      {product.sku ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {product.categoryName ? (
                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                          {product.categoryName}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                      {product.stock}
                    </td>
                    {canViewCostPrices && (
                      <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap text-gray-500">
                        {product.costPricePerCarton}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                      {product.sellingPricePerCarton}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                      {product.sellingPricePerPiece}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {confirmId === product.id ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="text-xs text-gray-600">Delete?</span>
                            <button
                              onClick={() => handleDelete(product.id)}
                              disabled={deletingId === product.id}
                              className="rounded px-2 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                              {deletingId === product.id ? 'Deleting…' : 'Yes'}
                            </button>
                            <button
                              onClick={() => setConfirmId(null)}
                              className="rounded px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Link
                              href={`/dashboard/products/${product.id}`}
                              className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Edit product"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => setConfirmId(product.id)}
                              className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete product"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer row count */}
        {filtered.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 text-xs text-gray-500">
            Showing {filtered.length} of {products.length} product
            {products.length !== 1 ? 's' : ''}
            {isPending && (
              <span className="ml-2 text-indigo-500">Updating…</span>
            )}
          </div>
        )}
      </div>
    </>
  )
}
