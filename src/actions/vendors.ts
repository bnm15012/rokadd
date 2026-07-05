"use server";

import { revalidatePath } from "next/cache";
import { prisma, tenantPrisma } from "@/lib/prisma";
import { getSessionUser, requirePermission } from "@/lib/permissions";
import type { ActionState, PurchaseItemInput } from "@/types";
import { PaymentStatus } from "@/generated/prisma/enums";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getShopId(): Promise<string> {
  const user = await getSessionUser();
  const shopId = user.shopMembers[0]?.shopId;
  if (!shopId) throw new Error("No shop found for this user");
  return shopId;
}

function calcPaymentStatus(
  totalAmount: number,
  paidAmount: number
): PaymentStatus {
  if (paidAmount <= 0) return PaymentStatus.UNPAID;
  if (paidAmount >= totalAmount) return PaymentStatus.PAID;
  return PaymentStatus.PARTIALLY_PAID;
}

// ─── Vendor CRUD ─────────────────────────────────────────────────────────────

export async function createVendor(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const shopId = await getShopId();
    await requirePermission(shopId, "canManageVendors");

    const name = (formData.get("name") as string | null)?.trim();
    if (!name) return { success: false, error: "Vendor name is required." };

    const db = tenantPrisma(shopId);
    const vendor = await db.vendor.create({
      data: {
        shopId,
        name,
        phone: (formData.get("phone") as string | null)?.trim() || null,
        email: (formData.get("email") as string | null)?.trim() || null,
        address: (formData.get("address") as string | null)?.trim() || null,
        gstin: (formData.get("gstin") as string | null)?.trim() || null,
      },
    });

    revalidatePath("/dashboard/vendors");
    return { success: true, data: vendor };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create vendor.",
    };
  }
}

export async function updateVendor(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const shopId = await getShopId();
    await requirePermission(shopId, "canManageVendors");

    const vendorId = formData.get("vendorId") as string | null;
    if (!vendorId) return { success: false, error: "Vendor ID is required." };

    const name = (formData.get("name") as string | null)?.trim();
    if (!name) return { success: false, error: "Vendor name is required." };

    const db = tenantPrisma(shopId);
    const vendor = await db.vendor.update({
      where: { id: vendorId },
      data: {
        name,
        phone: (formData.get("phone") as string | null)?.trim() || null,
        email: (formData.get("email") as string | null)?.trim() || null,
        address: (formData.get("address") as string | null)?.trim() || null,
        gstin: (formData.get("gstin") as string | null)?.trim() || null,
      },
    });

    revalidatePath("/dashboard/vendors");
    revalidatePath(`/dashboard/vendors/${vendorId}`);
    return { success: true, data: vendor };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update vendor.",
    };
  }
}

export async function deleteVendor(vendorId: string): Promise<ActionState> {
  try {
    const shopId = await getShopId();
    await requirePermission(shopId, "canManageVendors");

    const db = tenantPrisma(shopId);
    await db.vendor.delete({ where: { id: vendorId } });

    revalidatePath("/dashboard/vendors");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete vendor.",
    };
  }
}

// ─── Create Purchase ──────────────────────────────────────────────────────────

export async function createPurchase(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const shopId = await getShopId();
    await requirePermission(shopId, "canLogPurchases");

    const vendorId = formData.get("vendorId") as string | null;
    if (!vendorId) return { success: false, error: "Vendor is required." };

    const billNumber =
      (formData.get("billNumber") as string | null)?.trim() || null;
    const note = (formData.get("note") as string | null)?.trim() || null;
    const itemsRaw = formData.get("items") as string | null;

    if (!itemsRaw) return { success: false, error: "No items provided." };

    let items: PurchaseItemInput[];
    try {
      items = JSON.parse(itemsRaw) as PurchaseItemInput[];
    } catch {
      return { success: false, error: "Invalid items format." };
    }

    if (!items.length) {
      return { success: false, error: "At least one item is required." };
    }

    // Fetch products so we know cost prices and piecesPerCarton
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, shopId },
    });

    if (products.length !== productIds.length) {
      return {
        success: false,
        error: "One or more products not found or do not belong to this shop.",
      };
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalAmount = 0;
    const purchaseItemsData = items.map((item) => {
      const product = productMap.get(item.productId)!;
      const totalPieces =
        item.cartonsQty * product.piecesPerCarton + item.piecesQty;
      // Cost per carton is stored in Product
      const lineTotal =
        item.cartonsQty * product.costPricePerCarton +
        Math.round(
          (item.piecesQty * product.costPricePerCarton) /
            product.piecesPerCarton
        );
      totalAmount += lineTotal;
      return {
        productId: item.productId,
        cartonsQty: item.cartonsQty,
        piecesQty: item.piecesQty,
        totalPieces,
        costPerCarton: product.costPricePerCarton,
        lineTotal,
      };
    });

    const purchase = await prisma.$transaction(async (tx) => {
      // 1. Create the purchase
      const newPurchase = await tx.purchase.create({
        data: {
          shopId,
          vendorId,
          billNumber,
          totalAmount,
          paidAmount: 0,
          paymentStatus: PaymentStatus.UNPAID,
          note,
          items: {
            create: purchaseItemsData,
          },
        },
        include: { items: true },
      });

      // 2. Increment stock + create stock logs for each item
      for (const item of newPurchase.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStockPieces: { increment: item.totalPieces },
          },
        });

        await tx.stockLog.create({
          data: {
            shopId,
            productId: item.productId,
            type: "PURCHASE_INWARD",
            quantityPieces: item.totalPieces,
            note: billNumber ? `Bill #${billNumber}` : "Purchase inward",
            referenceId: newPurchase.id,
          },
        });
      }

      return newPurchase;
    });

    revalidatePath("/dashboard/vendors");
    revalidatePath(`/dashboard/vendors/${vendorId}`);
    revalidatePath("/dashboard/vendors/purchases");
    return { success: true, data: purchase };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create purchase.",
    };
  }
}

// ─── Vendor Payment ───────────────────────────────────────────────────────────

export async function makeVendorPayment(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const shopId = await getShopId();
    await requirePermission(shopId, "canMakeVendorPayments");

    const purchaseId = formData.get("purchaseId") as string | null;
    if (!purchaseId) return { success: false, error: "Purchase ID is required." };

    const amountRaw = formData.get("amount") as string | null;
    if (!amountRaw) return { success: false, error: "Amount is required." };

    // The form sends rupees; we store paise
    const amountRupees = parseFloat(amountRaw);
    if (isNaN(amountRupees) || amountRupees <= 0) {
      return { success: false, error: "Amount must be a positive number." };
    }
    const amountPaise = Math.round(amountRupees * 100);

    const paymentMode =
      (formData.get("paymentMode") as string | null)?.trim() || "CASH";
    const note = (formData.get("note") as string | null)?.trim() || null;

    // Load the purchase
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId, shopId },
    });
    if (!purchase) {
      return { success: false, error: "Purchase not found." };
    }

    const newPaidAmount = purchase.paidAmount + amountPaise;
    const newStatus = calcPaymentStatus(purchase.totalAmount, newPaidAmount);

    await prisma.$transaction([
      prisma.purchase.update({
        where: { id: purchaseId },
        data: { paidAmount: newPaidAmount, paymentStatus: newStatus },
      }),
      prisma.vendorPayment.create({
        data: {
          purchaseId,
          shopId,
          amount: amountPaise,
          paymentMode,
          note,
        },
      }),
    ]);

    revalidatePath("/dashboard/vendors");
    revalidatePath(`/dashboard/vendors/${purchase.vendorId}`);
    revalidatePath("/dashboard/report");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to record vendor payment.",
    };
  }
}
