'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionUser, requirePermission } from '@/lib/permissions';
import type { ActionState } from '@/types';

interface ReconItemInput {
  productId: number;
  closingStock: number;
}

export async function submitReconciliation(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await getSessionUser();
    const shopId = user.shopMembers[0]?.shopId;
    if (!shopId) return { success: false, error: 'No shop found for user' };

    await requirePermission(shopId, 'canAdjustStock');

    const itemsJson = formData.get('items') as string;
    const cashInHandStr = formData.get('cashInHand') as string;
    const note = (formData.get('note') as string) || null;

    if (!itemsJson) return { success: false, error: 'No items provided' };

    const items: ReconItemInput[] = JSON.parse(itemsJson);
    if (!items.length) return { success: false, error: 'No items to reconcile' };

    // Validate closing stock values
    for (const item of items) {
      if (item.closingStock < 0) {
        return { success: false, error: 'Closing stock cannot be negative' };
      }
    }

    const cashInHand = cashInHandStr ? Math.round(parseFloat(cashInHandStr) * 100) : null;

    // Check if today already has a reconciliation
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.dailyRecon.findUnique({
      where: { shopId_date: { shopId, date: today } },
    });
    if (existing) {
      return { success: false, error: 'Reconciliation already submitted for today. You can only submit once per day.' };
    }

    // Fetch all products to get opening stock and selling prices
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, shopId, isActive: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Build recon items and calculate totals
    let totalSalesAmount = 0;
    const reconItems: {
      productId: number;
      openingStock: number;
      closingStock: number;
      unitsSold: number;
      sellingPrice: number;
      salesAmount: number;
    }[] = [];
    const stockUpdates: { productId: number; newStock: number; diff: number }[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) continue;

      const openingStock = product.currentStockPieces;
      const closingStock = item.closingStock;
      const unitsSold = openingStock - closingStock;
      const sellingPrice = product.sellingPricePerPiece;
      const salesAmount = unitsSold > 0 ? unitsSold * sellingPrice : 0;

      totalSalesAmount += salesAmount;

      reconItems.push({
        productId: item.productId,
        openingStock,
        closingStock,
        unitsSold,
        sellingPrice,
        salesAmount,
      });

      // Only update stock if there's a difference
      if (openingStock !== closingStock) {
        stockUpdates.push({
          productId: item.productId,
          newStock: closingStock,
          diff: openingStock - closingStock,
        });
      }
    }

    const cashExpected = totalSalesAmount;
    const cashDifference = cashInHand !== null ? cashInHand - cashExpected : null;

    // Run everything in a transaction
    await prisma.$transaction(async (tx) => {
      // Create the reconciliation record
      const recon = await tx.dailyRecon.create({
        data: {
          shopId,
          date: today,
          totalSalesAmount,
          cashInHand,
          cashExpected,
          cashDifference,
          note,
          createdBy: user.id,
          items: {
            create: reconItems,
          },
        },
      });

      // Update product stock to closing values and create stock logs
      for (const update of stockUpdates) {
        await tx.product.update({
          where: { id: update.productId },
          data: { currentStockPieces: update.newStock },
        });

        await tx.stockLog.create({
          data: {
            shopId,
            productId: update.productId,
            type: 'RECONCILIATION',
            quantityPieces: Math.abs(update.diff),
            note: `Daily reconciliation: stock adjusted from ${update.newStock + update.diff} to ${update.newStock} pieces`,
            referenceId: String(recon.id),
          },
        });
      }
    });

    // Take a stock snapshot after reconciliation (best-effort, don't fail recon if this errors)
    try {
      const products = await prisma.product.findMany({
        where: { shopId, isActive: true },
        select: { id: true, currentStockPieces: true, piecesPerCarton: true },
      });
      for (const product of products) {
        await prisma.stockSnapshot.upsert({
          where: {
            shopId_productId_date: { shopId, productId: product.id, date: today },
          },
          update: { stockPieces: product.currentStockPieces, piecesPerCarton: product.piecesPerCarton },
          create: { shopId, productId: product.id, date: today, stockPieces: product.currentStockPieces, piecesPerCarton: product.piecesPerCarton },
        });
      }
    } catch {
      // Snapshot failure should not block reconciliation
    }

    revalidatePath('/dashboard/reconciliation');
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/report/stock-sheet');
    revalidatePath('/dashboard');

    return {
      success: true,
      data: {
        totalSalesAmount,
        itemCount: reconItems.length,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit reconciliation';
    return { success: false, error: message };
  }
}
