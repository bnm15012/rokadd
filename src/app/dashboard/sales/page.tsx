import { redirect } from 'next/navigation';
import { getSessionUser, requirePermission } from '@/lib/permissions';
import { tenantPrisma } from '@/lib/prisma';
import { POSClient } from './_components/POSClient';

export default async function SalesPage() {
  let user;
  try {
    user = await getSessionUser();
  } catch {
    redirect('/');
  }

  const shopId = user.shopMembers[0]?.shopId;
  if (!shopId) redirect('/');

  try {
    await requirePermission(shopId, 'canCreateSales');
  } catch {
    return (
      <div className="p-8">
        <p className="text-red-600 font-medium">
          You do not have permission to create sales.
        </p>
      </div>
    );
  }

  const db = tenantPrisma(shopId);

  const [products, customers] = await Promise.all([
    db.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { name: 'asc' },
    }),
    db.customer.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <POSClient
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        categoryName: p.category?.name ?? null,
        piecesPerCarton: p.piecesPerCarton,
        sellingPricePerCarton: p.sellingPricePerCarton,
        sellingPricePerPiece: p.sellingPricePerPiece,
        currentStockPieces: p.currentStockPieces,
      }))}
      customers={customers.map((c) => ({ id: c.id, name: c.name, phone: c.phone }))}
    />
  );
}
