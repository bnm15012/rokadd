import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Warehouse, AlertTriangle, CheckCircle, PackagePlus, SlidersHorizontal } from 'lucide-react';
import { getSessionUser, requirePermission } from '@/lib/permissions';
import { tenantPrisma } from '@/lib/prisma';
import { formatCurrency, formatStock } from '@/lib/utils';

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  let user;
  try {
    user = await getSessionUser();
  } catch {
    redirect('/');
  }

  const shopId = user.shopMembers[0]?.shopId;
  if (!shopId) redirect('/');

  try {
    await requirePermission(shopId, 'canViewInventory');
  } catch {
    return (
      <div className="p-8">
        <p className="text-red-600 font-medium">
          You do not have permission to view inventory.
        </p>
      </div>
    );
  }

  const params = await searchParams;
  const filterRaw = typeof params.filter === 'string' ? params.filter : 'all';
  const filter = ['all', 'low', 'ok'].includes(filterRaw) ? filterRaw : 'all';

  const db = tenantPrisma(shopId);

  const products = await db.product.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: [{ currentStockPieces: 'asc' }, { name: 'asc' }],
  });

  const lowStockProducts = products.filter(
    (p) => p.lowStockThreshold > 0 && p.currentStockPieces <= p.lowStockThreshold
  );
  const outOfStock = products.filter((p) => p.currentStockPieces === 0);

  const displayProducts =
    filter === 'low'
      ? lowStockProducts
      : filter === 'ok'
      ? products.filter(
          (p) =>
            p.currentStockPieces > 0 &&
            !(p.lowStockThreshold > 0 && p.currentStockPieces <= p.lowStockThreshold)
        )
      : products;

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-shrink-0">
        <div className="rounded-lg p-1.5 bg-gradient-to-br from-amber-500 to-orange-500 shadow-sm">
          <Warehouse className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500">{products.length} active products</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/dashboard/inventory/inward"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            <PackagePlus className="h-4 w-4" />
            Stock Inward
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-5 flex-shrink-0">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Total Products</p>
          <p className="text-2xl font-bold text-gray-900">{products.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-4">
          <p className="text-xs text-amber-600 uppercase tracking-wide font-medium mb-1">Low Stock</p>
          <p className="text-2xl font-bold text-amber-600">{lowStockProducts.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-red-100 shadow-sm p-4">
          <p className="text-xs text-red-500 uppercase tracking-wide font-medium mb-1">Out of Stock</p>
          <p className="text-2xl font-bold text-red-500">{outOfStock.length}</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 mb-5 flex items-center gap-2 flex-shrink-0">
        <SlidersHorizontal className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500 mr-1">Filter:</span>
        {([['all', 'All Products'], ['low', 'Low / Out of Stock'], ['ok', 'In Stock']] as const).map(
          ([value, label]) => (
            <Link
              key={value}
              href={`/dashboard/inventory?filter=${value}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === value
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label}
            </Link>
          )
        )}
        <span className="ml-auto text-xs text-gray-400">
          {displayProducts.length} shown
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        {displayProducts.length === 0 ? (
          <div className="py-16 text-center">
            <Warehouse className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No products to show</p>
          </div>
        ) : (
          <div className="overflow-auto flex-1 min-h-0">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Product
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Category
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    SKU
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Current Stock
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Low Stock Threshold
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Selling Price
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayProducts.map((product) => {
                  const isOutOfStock = product.currentStockPieces === 0;
                  const isLowStock =
                    !isOutOfStock &&
                    product.lowStockThreshold > 0 &&
                    product.currentStockPieces <= product.lowStockThreshold;
                  const isOk = !isOutOfStock && !isLowStock;

                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {product.name}
                        <span className="text-xs text-gray-400 font-normal ml-1">
                          ({product.piecesPerCarton} pc/ctn)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {product.category?.name ?? (
                          <span className="text-gray-300 italic text-xs">Uncategorized</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">
                        {product.sku ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">
                        {formatStock(product.currentStockPieces, product.piecesPerCarton)}
                        <span className="text-xs text-gray-400 ml-1">
                          ({product.currentStockPieces} pcs)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {product.lowStockThreshold > 0
                          ? formatStock(product.lowStockThreshold, product.piecesPerCarton)
                          : <span className="text-gray-300 italic text-xs">Not set</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        <div>{formatCurrency(product.sellingPricePerCarton)}<span className="text-xs text-gray-400">/ctn</span></div>
                        <div className="text-xs text-gray-400">{formatCurrency(product.sellingPricePerPiece)}/pc</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                            <AlertTriangle className="h-3 w-3" />
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                            <AlertTriangle className="h-3 w-3" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            <CheckCircle className="h-3 w-3" />
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
