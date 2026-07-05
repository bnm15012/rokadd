import { redirect } from 'next/navigation';
import { getSessionUser, getPermissions } from '@/lib/permissions';
import { tenantPrisma } from '@/lib/prisma';
import { formatStock } from '@/lib/utils';
import { AlertTriangle, PackageX } from 'lucide-react';

export default async function AlertsPage() {
  let user;
  try {
    user = await getSessionUser();
  } catch {
    redirect('/');
  }

  const shopId = user.shopMembers[0]?.shopId;
  if (!shopId) {
    return (
      <div className="py-12 text-center text-slate-500">No shop found for your account.</div>
    );
  }

  const ctx = await getPermissions(shopId);
  // Require at least view-inventory or view-products permission
  const canView =
    ctx.isOwner ||
    ctx.isSuperAdmin ||
    ctx.permissions?.canViewInventory ||
    ctx.permissions?.canViewProducts;

  if (!canView) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500 font-medium">
          You don&apos;t have permission to view alerts.
        </p>
      </div>
    );
  }

  const db = tenantPrisma(shopId);

  // Fetch all active products with a non-zero threshold and filter in JS
  // (Prisma doesn't support column-to-column comparison in WHERE without raw SQL)
  const allProducts = await db.product.findMany({
    where: {
      isActive: true,
      lowStockThreshold: { gt: 0 },
    },
    orderBy: [{ currentStockPieces: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      sku: true,
      currentStockPieces: true,
      lowStockThreshold: true,
      piecesPerCarton: true,
    },
  });

  const lowStockProducts = allProducts.filter(
    (p) => p.currentStockPieces <= p.lowStockThreshold
  );

  const criticalCount = lowStockProducts.filter((p) => p.currentStockPieces === 0).length;
  const lowCount = lowStockProducts.filter((p) => p.currentStockPieces > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Alerts</h1>
          <p className="mt-1 text-sm text-slate-500">
            Products that need restocking
          </p>
        </div>
        {lowStockProducts.length > 0 && (
          <div className="flex items-center gap-3">
            {criticalCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                <PackageX className="h-3.5 w-3.5" />
                {criticalCount} out of stock
              </span>
            )}
            {lowCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                {lowCount} low stock
              </span>
            )}
          </div>
        )}
      </div>

      {lowStockProducts.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <PackageX className="h-6 w-6 text-emerald-500" />
          </div>
          <p className="font-medium text-slate-700">All good! No stock alerts.</p>
          <p className="mt-1 text-sm text-slate-400">
            All products are above their low-stock thresholds.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Product
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  SKU
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Current Stock
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Threshold
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {lowStockProducts.map((product) => {
                const isOutOfStock = product.currentStockPieces === 0;
                return (
                  <tr
                    key={product.id}
                    className={`transition-colors ${
                      isOutOfStock ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-amber-50/30'
                    }`}
                  >
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {product.name}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">
                      {product.sku ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className={`font-semibold ${
                          isOutOfStock ? 'text-red-600' : 'text-amber-600'
                        }`}
                      >
                        {formatStock(product.currentStockPieces, product.piecesPerCarton)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-500">
                      {formatStock(product.lowStockThreshold, product.piecesPerCarton)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          Out of Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Low Stock
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
  );
}
