'use client'

import { useActionState, useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createProduct, updateProduct, createCategory } from '@/actions/products'
import type { ActionState } from '@/types'

interface Category {
  id: number
  name: string
}

interface ProductDefaults {
  id?: number
  name?: string
  sku?: string
  categoryId?: number
  piecesPerCarton?: number
  /** already in paise — displayed converted to rupees */
  costPricePerCarton?: number
  sellingPricePerCarton?: number
  sellingPricePerPiece?: number
  lowStockThreshold?: number
}

interface Props {
  categories: Category[]
  defaults?: ProductDefaults
  mode: 'create' | 'edit'
}

const INITIAL_STATE: ActionState = { success: false }

/** Convert paise → rupee string for display in inputs */
function paiseToRupees(paise: number | undefined): string {
  if (paise === undefined || paise === null) return ''
  return (paise / 100).toFixed(2)
}

export function ProductForm({ categories: initialCategories, defaults, mode }: Props) {
  const router = useRouter()
  const action = mode === 'create' ? createProduct : updateProduct

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    INITIAL_STATE
  )

  // Redirect on success
  if (state.success && mode === 'create') {
    router.push('/dashboard/products')
  }
  if (state.success && mode === 'edit') {
    router.push('/dashboard/products')
  }

  // ── Category inline dialog ────────────────────────────────────────────────
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [showCatDialog, setShowCatDialog] = useState(false)
  const [catName, setCatName] = useState('')
  const [catPending, startCatTransition] = useTransition()
  const [catError, setCatError] = useState<string | null>(null)
  const catInputRef = useRef<HTMLInputElement>(null)

  function openCatDialog() {
    setCatName('')
    setCatError(null)
    setShowCatDialog(true)
    // Focus on next tick after dialog renders
    setTimeout(() => catInputRef.current?.focus(), 50)
  }

  async function handleAddCategory() {
    if (!catName.trim()) {
      setCatError('Category name is required')
      return
    }
    setCatError(null)
    const fd = new FormData()
    fd.set('name', catName.trim())
    startCatTransition(async () => {
      const result = await createCategory(INITIAL_STATE, fd)
      if (result.success && result.data) {
        setCategories((prev) => [...prev, result.data as Category])
        setShowCatDialog(false)
      } else {
        setCatError(result.error ?? 'Failed to create category')
      }
    })
  }

  return (
    <>
      <form action={formAction} className="space-y-8">
        {/* Hidden product id for edit mode */}
        {defaults?.id && (
          <input type="hidden" name="productId" value={defaults.id} />
        )}

        {/* Error banner */}
        {state.error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {state.error}
          </div>
        )}

        {/* ── Basic Info ──────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Name */}
            <div className="sm:col-span-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Product name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={defaults?.name}
                placeholder="e.g. Basmati Rice 25kg"
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* SKU */}
            <div>
              <label
                htmlFor="sku"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                SKU
                <span className="ml-1 text-xs text-gray-400">(optional)</span>
              </label>
              <input
                id="sku"
                name="sku"
                type="text"
                defaultValue={defaults?.sku ?? ''}
                placeholder="e.g. RICE-25KG"
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-mono text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="categoryId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category
                <span className="ml-1 text-xs text-gray-400">(optional)</span>
              </label>
              <div className="flex gap-2">
                <select
                  id="categoryId"
                  name="categoryId"
                  defaultValue={defaults?.categoryId ?? ''}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">— None —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={openCatDialog}
                  className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  title="Add new category"
                >
                  + New
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Packaging ───────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-1">Packaging</h2>
          <p className="text-sm text-gray-500 mb-4">
            Define how many pieces (units) make one carton.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="piecesPerCarton"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Pieces per carton <span className="text-red-500">*</span>
              </label>
              <input
                id="piecesPerCarton"
                name="piecesPerCarton"
                type="number"
                required
                min={1}
                step={1}
                defaultValue={defaults?.piecesPerCarton ?? 1}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm tabular-nums text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="lowStockThreshold"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Low-stock alert (pieces)
                <span className="ml-1 text-xs text-gray-400">(0 = disabled)</span>
              </label>
              <input
                id="lowStockThreshold"
                name="lowStockThreshold"
                type="number"
                min={0}
                step={1}
                defaultValue={defaults?.lowStockThreshold ?? 0}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm tabular-nums text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </section>

        {/* ── Pricing ─────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-1">Pricing</h2>
          <p className="text-sm text-gray-500 mb-4">
            Enter prices in <strong>rupees</strong> (e.g. 1250.00). Values are stored in paise internally.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="costPricePerCarton"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Cost price / carton (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">
                  ₹
                </span>
                <input
                  id="costPricePerCarton"
                  name="costPricePerCarton"
                  type="number"
                  required
                  min={0}
                  step={0.01}
                  defaultValue={paiseToRupees(defaults?.costPricePerCarton)}
                  placeholder="0.00"
                  className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-7 pr-3 text-sm tabular-nums text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="sellingPricePerCarton"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Selling price / carton (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">
                  ₹
                </span>
                <input
                  id="sellingPricePerCarton"
                  name="sellingPricePerCarton"
                  type="number"
                  required
                  min={0}
                  step={0.01}
                  defaultValue={paiseToRupees(defaults?.sellingPricePerCarton)}
                  placeholder="0.00"
                  className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-7 pr-3 text-sm tabular-nums text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="sellingPricePerPiece"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Selling price / piece (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">
                  ₹
                </span>
                <input
                  id="sellingPricePerPiece"
                  name="sellingPricePerPiece"
                  type="number"
                  required
                  min={0}
                  step={0.01}
                  defaultValue={paiseToRupees(defaults?.sellingPricePerPiece)}
                  placeholder="0.00"
                  className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-7 pr-3 text-sm tabular-nums text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Form actions ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={() => router.push('/dashboard/products')}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {pending && (
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            {pending
              ? mode === 'create'
                ? 'Creating…'
                : 'Saving…'
              : mode === 'create'
              ? 'Create product'
              : 'Save changes'}
          </button>
        </div>
      </form>

      {/* ── Add Category dialog ────────────────────────────────────────────── */}
      {showCatDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cat-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowCatDialog(false)}
          />
          {/* Panel */}
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3
              id="cat-dialog-title"
              className="text-base font-semibold text-gray-900 mb-4"
            >
              Add new category
            </h3>

            {catError && (
              <p className="mb-3 text-sm text-red-600">{catError}</p>
            )}

            <label
              htmlFor="cat-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Category name <span className="text-red-500">*</span>
            </label>
            <input
              id="cat-name"
              ref={catInputRef}
              type="text"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddCategory()
                }
                if (e.key === 'Escape') setShowCatDialog(false)
              }}
              placeholder="e.g. Grains & Pulses"
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCatDialog(false)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCategory}
                disabled={catPending}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                {catPending ? 'Adding…' : 'Add category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
