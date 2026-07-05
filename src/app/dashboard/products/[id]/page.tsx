import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getSessionUser, requirePermission } from '@/lib/permissions'
import { tenantPrisma } from '@/lib/prisma'
import { ProductForm } from '../_components/ProductForm'

export const metadata = { title: 'Edit Product — Rokadd' }

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // params is a Promise in Next.js 16 — must await
  const { id } = await params
  const productId = parseInt(id, 10)

  let user
  try {
    user = await getSessionUser()
  } catch {
    redirect('/')
  }

  const shopId = user.shopMembers[0]?.shopId
  if (!shopId) redirect('/')

  try {
    await requirePermission(shopId, 'canManageProducts')
  } catch {
    redirect('/dashboard/products')
  }

  const db = tenantPrisma(shopId)

  const [product, categories] = await Promise.all([
    db.product.findFirst({
      where: { id: productId, isActive: true },
    }),
    db.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  if (!product) notFound()

  const defaults = {
    id: product.id,
    name: product.name,
    sku: product.sku ?? undefined,
    categoryId: product.categoryId ?? undefined,
    piecesPerCarton: product.piecesPerCarton,
    costPricePerCarton: product.costPricePerCarton,
    sellingPricePerCarton: product.sellingPricePerCarton,
    sellingPricePerPiece: product.sellingPricePerPiece,
    lowStockThreshold: product.lowStockThreshold,
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link
          href="/dashboard/products"
          className="hover:text-indigo-600 transition-colors"
        >
          Products
        </Link>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4 text-gray-400"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
        <span className="font-medium text-gray-900 truncate max-w-xs">
          {product.name}
        </span>
      </nav>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Edit product</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update details for <strong>{product.name}</strong>. Stock adjustments are made from Inventory.
        </p>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <ProductForm categories={categories} defaults={defaults} mode="edit" />
      </div>
    </div>
  )
}
