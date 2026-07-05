'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionUser, requirePermission } from '@/lib/permissions';
import { toTotalPieces } from '@/lib/utils';
import type { ActionState } from '@/types';

export async function recordStockInward(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await getSessionUser();
    const shopId = user.shopMembers[0]?.shopId;
    if (!shopId) return { success: false, error: 'No shop found for user' };

    await requirePermission(shopId, 'canLogStockInward');

    const productId = formData.get('productId') as string;
    const cartonsQty = parseInt((formData.get('cartonsQty') as string) || '0', 10);
    const piecesQty = parseInt((formData.get('piecesQty') as string) || '0', 10);
    const note = (formData.get('note') as string) || null;

    if (!productId) return { success: false, error: 'Product is required' };
    if (cartonsQty < 0 || piecesQty < 0) {
      return { success: false, error: 'Quantities cannot be negative' };
    }
    if (cartonsQty === 0 && piecesQty === 0) {
      return { success: false, error: 'At least one quantity must be greater than 0' };
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, shopId, isActive: true },
    });
    if (!product) return { success: false, error: 'Product not found' };

    const totalPieces = toTotalPieces(cartonsQty, piecesQty, product.piecesPerCarton);

    await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: { currentStockPieces: { increment: totalPieces } },
      }),
      prisma.stockLog.create({
        data: {
          shopId,
          productId,
          type: 'PURCHASE_INWARD',
          quantityPieces: totalPieces,
          note: note || `Stock inward: ${cartonsQty} cartons, ${piecesQty} pieces`,
        },
      }),
    ]);

    revalidatePath('/dashboard/inventory');

    return {
      success: true,
      data: { message: `Added ${totalPieces} pieces to ${product.name}` },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to record stock inward';
    return { success: false, error: message };
  }
}

export async function adjustStock(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await getSessionUser();
    const shopId = user.shopMembers[0]?.shopId;
    if (!shopId) return { success: false, error: 'No shop found for user' };

    await requirePermission(shopId, 'canAdjustStock');

    const productId = formData.get('productId') as string;
    const adjustmentType = formData.get('adjustmentType') as string;
    const quantityPieces = parseInt(
      (formData.get('quantityPieces') as string) || '0',
      10
    );
    const note = (formData.get('note') as string) || null;

    if (!productId) return { success: false, error: 'Product is required' };
    if (!['ADD', 'REMOVE'].includes(adjustmentType)) {
      return { success: false, error: 'Invalid adjustment type' };
    }
    if (quantityPieces <= 0) {
      return { success: false, error: 'Quantity must be greater than 0' };
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, shopId, isActive: true },
    });
    if (!product) return { success: false, error: 'Product not found' };

    if (adjustmentType === 'REMOVE' && product.currentStockPieces < quantityPieces) {
      return {
        success: false,
        error: `Cannot remove ${quantityPieces} pieces. Current stock: ${product.currentStockPieces} pieces`,
      };
    }

    const stockLogType =
      adjustmentType === 'ADD' ? 'ADJUSTMENT_ADD' : 'ADJUSTMENT_REMOVE';

    await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: {
          currentStockPieces:
            adjustmentType === 'ADD'
              ? { increment: quantityPieces }
              : { decrement: quantityPieces },
        },
      }),
      prisma.stockLog.create({
        data: {
          shopId,
          productId,
          type: stockLogType,
          quantityPieces,
          note: note || `Manual adjustment: ${adjustmentType.toLowerCase()} ${quantityPieces} pieces`,
        },
      }),
    ]);

    revalidatePath('/dashboard/inventory');

    return {
      success: true,
      data: {
        message: `Stock ${adjustmentType === 'ADD' ? 'increased' : 'decreased'} by ${quantityPieces} pieces for ${product.name}`,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to adjust stock';
    return { success: false, error: message };
  }
}
