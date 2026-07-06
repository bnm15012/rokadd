'use server';

import { revalidatePath } from 'next/cache';
import { tenantPrisma } from '@/lib/prisma';
import { getSessionUser, requirePermission } from '@/lib/permissions';
import type { ActionState } from '@/types';

export async function takeStockSnapshot(
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  try {
    const user = await getSessionUser();
    const shopId = user.shopMembers[0]?.shopId;
    if (!shopId) return { success: false, error: 'No shop found' };

    await requirePermission(shopId, 'canViewInventory');

    const db = tenantPrisma(shopId);
    const istDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const today = new Date(istDate + 'T00:00:00.000Z');

    const products = await db.product.findMany({
      where: { shopId, isActive: true },
      select: { id: true, currentStockPieces: true, piecesPerCarton: true },
    });

    let count = 0;
    for (const product of products) {
      await db.stockSnapshot.upsert({
        where: {
          shopId_productId_date: {
            shopId,
            productId: product.id,
            date: today,
          },
        },
        update: {
          stockPieces: product.currentStockPieces,
          piecesPerCarton: product.piecesPerCarton,
        },
        create: {
          shopId,
          productId: product.id,
          date: today,
          stockPieces: product.currentStockPieces,
          piecesPerCarton: product.piecesPerCarton,
        },
      });
      count++;
    }

    revalidatePath('/dashboard/report/stock-sheet');
    return { success: true, data: { count } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to take snapshot' };
  }
}
