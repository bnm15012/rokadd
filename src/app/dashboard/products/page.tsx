import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser, getPermissions } from '@/lib/permissions'
import { tenantPrisma } from '@/lib/prisma'
import { formatCurrency, formatStock } from '@/lib/utils'
import { ProductsTable } from './_components/ProductsTable'
import { Package } from 'lucide-react'

export const metadata = { title: 'Products — Rokadd' }

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Resolve async searchParams (Next.js 16 convention)
  const { q = '' } = await searchParams
  const query = Array.isArray(q) ? q[0] : q

  let user
  try {
    user = await getSessionUser()
  } catch {
    redirect('/')
  }

  const shopId = user.shopMembers[0]?.shopId
  if (!shopId) redirect('/')

  // Check permissions
  const ctx = await getPermissions(shopId)
  const canManage = ctx.isOwner || ctx.isSuperAdmin || !!ctx.permissions?.canManageProducts
  const canViewCostPrices =
    ctx.isOwner || ctx.isSuperAdmin || !!ctx.permissions?.canViewCostPrices

  if (!ctx.isOwner && !ctx.isSuperAdmin && !ctx.permissions?.canViewProducts) {
    redirect('/dashboard')
  }

  const db = tenantPrisma(shopId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const products: any[] = await (db.product.findMany as any)({
    where: {
      isActive: true,
      ...(query
        ? { name: { contains: query, mode: 'insensitive' } }
        : {}),
    },
    include: { category: true },
    orderBy: { name: 'asc' },
  })

  const serialised = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    categoryName: p.category?.name ?? null,
    stock: formatStock(p.currentStockPieces, p.piecesPerCarton),
    isLowStock:
      p.lowStockThreshold > 0 &&
      p.currentStockPieces <= p.lowStockThreshold,
    costPricePerCarton: formatCurrency(p.costPricePerCarton),
    sellingPricePerCarton: formatCurrency(p.sellingPricePerCarton),
    sellingPricePerPiece: formatCurrency(p.sellingPricePerPiece),
  }))

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="rounded-lg p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 shadow-sm">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your product catalogue, pricing, and stock settings.
            </p>
          </div>
        </div>
        {canManage && (
          <Link
            href="/dashboard/products/new"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            Add Product
          </Link>
        )}
      </div>

      {/* Client table with search + delete */}
      <ProductsTable
        products={serialised}
        initialQuery={query}
        canManage={canManage}
        canViewCostPrices={canViewCostPrices}
      />
    </div>
  )
}
