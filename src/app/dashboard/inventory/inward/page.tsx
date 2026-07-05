import { redirect } from 'next/navigation';
import { getSessionUser, requirePermission } from '@/lib/permissions';
import { tenantPrisma } from '@/lib/prisma';
import { StockInwardForm } from './_components/StockInwardForm';

export default async function StockInwardPage() {
  let user;
  try {
    user = await getSessionUser();
  } catch {
    redirect('/');
  }

  const shopId = user.shopMembers[0]?.shopId;
  if (!shopId) redirect('/');

  try {
    await requirePermission(shopId, 'canLogStockInward');
  } catch {
    return (
      <div className="p-8">
        <p className="text-red-600 font-medium">
          You do not have permission to log stock inward.
        </p>
      </div>
    );
  }

  const db = tenantPrisma(shopId);

  const products = await db.product.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  return (
    <StockInwardForm
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        piecesPerCarton: p.piecesPerCarton,
        currentStockPieces: p.currentStockPieces,
      }))}
    />
  );
}
