import { redirect } from 'next/navigation';
import { getSessionUser, requirePermission } from '@/lib/permissions';
import { prisma, tenantPrisma } from '@/lib/prisma';
import { ReconciliationClient } from './_components/ReconciliationClient';

export const metadata = { title: 'Daily Reconciliation — Rokadd' };

export default async function ReconciliationPage() {
  let user;
  try {
    user = await getSessionUser();
  } catch {
    redirect('/');
  }

  const shopId = user.shopMembers[0]?.shopId;
  if (!shopId) redirect('/');

  try {
    await requirePermission(shopId, 'canAdjustStock');
  } catch {
    return (
      <div className="p-8">
        <p className="text-red-600 font-medium">
          You do not have permission to perform stock reconciliation.
        </p>
      </div>
    );
  }

  const db = tenantPrisma(shopId);

  // Check if today already has a reconciliation
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingRecon = await prisma.dailyRecon.findUnique({
    where: { shopId_date: { shopId, date: today } },
    include: {
      items: true,
    },
  });

  // Fetch all active products
  const products = await db.product.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
  });

  return (
    <ReconciliationClient
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        categoryName: p.category?.name ?? null,
        piecesPerCarton: p.piecesPerCarton,
        currentStockPieces: p.currentStockPieces,
        sellingPricePerPiece: p.sellingPricePerPiece,
        sellingPricePerCarton: p.sellingPricePerCarton,
      }))}
      alreadySubmitted={!!existingRecon}
      existingRecon={
        existingRecon
          ? {
              totalSalesAmount: existingRecon.totalSalesAmount,
              cashInHand: existingRecon.cashInHand,
              cashExpected: existingRecon.cashExpected,
              cashDifference: existingRecon.cashDifference,
              items: existingRecon.items.map((i) => ({
                productId: i.productId,
                openingStock: i.openingStock,
                closingStock: i.closingStock,
                unitsSold: i.unitsSold,
                salesAmount: i.salesAmount,
              })),
            }
          : null
      }
    />
  );
}
