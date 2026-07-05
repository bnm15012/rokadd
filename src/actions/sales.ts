'use server';

import { revalidatePath } from 'next/cache';
import { prisma, tenantPrisma } from '@/lib/prisma';
import { getSessionUser, requirePermission } from '@/lib/permissions';
import {
  calculateLineTotal,
  generateInvoiceNo,
  toTotalPieces,
} from '@/lib/utils';
import type { ActionState, SaleItemInput } from '@/types';

export async function createSale(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await getSessionUser();
    const shopId = user.shopMembers[0]?.shopId;
    if (!shopId) return { success: false, error: 'No shop found for user' };

    await requirePermission(shopId, 'canCreateSales');

    const itemsRaw = formData.get('items') as string;
    const rawCustomerId = formData.get('customerId') as string | null;
    const customerId = rawCustomerId ? parseInt(rawCustomerId, 10) : null;
    const saleType = (formData.get('saleType') as string) || 'CASH';
    const discountRaw = formData.get('discount') as string;
    const discount = discountRaw ? Math.round(parseFloat(discountRaw) * 100) : 0;
    const note = (formData.get('note') as string) || null;

    if (!itemsRaw) return { success: false, error: 'No items provided' };

    let items: SaleItemInput[];
    try {
      items = JSON.parse(itemsRaw);
    } catch {
      return { success: false, error: 'Invalid items data' };
    }

    if (!items.length) return { success: false, error: 'Cart is empty' };

    const invoiceNo = generateInvoiceNo();

    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const saleItemsData: {
        productId: number;
        cartonsQty: number;
        piecesQty: number;
        totalPieces: number;
        unitPriceCarton: number;
        unitPricePiece: number;
        lineTotal: number;
      }[] = [];

      for (const item of items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, shopId, isActive: true },
        });
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        const totalPiecesNeeded = toTotalPieces(
          item.cartonsQty,
          item.piecesQty,
          product.piecesPerCarton
        );

        if (product.currentStockPieces < totalPiecesNeeded) {
          throw new Error(
            `Insufficient stock for "${product.name}". Available: ${product.currentStockPieces} pieces, needed: ${totalPiecesNeeded} pieces`
          );
        }

        const lineTotal = calculateLineTotal(
          item.cartonsQty,
          item.piecesQty,
          product.sellingPricePerCarton,
          product.sellingPricePerPiece
        );

        totalAmount += lineTotal;

        saleItemsData.push({
          productId: item.productId,
          cartonsQty: item.cartonsQty,
          piecesQty: item.piecesQty,
          totalPieces: totalPiecesNeeded,
          unitPriceCarton: product.sellingPricePerCarton,
          unitPricePiece: product.sellingPricePerPiece,
          lineTotal,
        });
      }

      const netAmount = Math.max(0, totalAmount - discount);

      const sale = await tx.sale.create({
        data: {
          shopId,
          invoiceNo,
          customerId: customerId || undefined,
          saleType: saleType as 'CASH' | 'CREDIT',
          totalAmount,
          discount,
          netAmount,
          note,
          items: {
            create: saleItemsData,
          },
        },
      });

      // Deduct stock and create StockLogs for each item
      for (const item of saleItemsData) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStockPieces: { decrement: item.totalPieces },
          },
        });

        await tx.stockLog.create({
          data: {
            shopId,
            productId: item.productId,
            type: 'SALE_OUTWARD',
            quantityPieces: item.totalPieces,
            note: `Sale invoice: ${invoiceNo}`,
            referenceId: String(sale.id),
          },
        });
      }

      // If CREDIT sale with a customer, create CreditSale entry
      if (saleType === 'CREDIT' && customerId) {
        await tx.creditSale.create({
          data: {
            shopId,
            customerId,
            saleId: sale.id,
            totalAmount: netAmount,
            paidAmount: 0,
            status: 'UNPAID',
          },
        });
      }

      return sale;
    });

    revalidatePath('/dashboard/sales');
    revalidatePath('/dashboard/inventory');

    return { success: true, data: { invoiceNo: result.invoiceNo } };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create sale';
    return { success: false, error: message };
  }
}
