"use server";

import { revalidatePath } from "next/cache";
import { prisma, tenantPrisma } from "@/lib/prisma";
import { getSessionUser, requirePermission } from "@/lib/permissions";
import type { ActionState } from "@/types";
import { PaymentStatus } from "@/generated/prisma/enums";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getShopId(): Promise<number> {
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

// ─── Customer CRUD ───────────────────────────────────────────────────────────

export async function createCustomer(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const shopId = await getShopId();
    await requirePermission(shopId, "canManageCustomers");

    const name = (formData.get("name") as string | null)?.trim();
    if (!name) return { success: false, error: "Customer name is required." };

    const db = tenantPrisma(shopId);
    const customer = await db.customer.create({
      data: {
        shopId,
        name,
        phone: (formData.get("phone") as string | null)?.trim() || null,
        email: (formData.get("email") as string | null)?.trim() || null,
        address: (formData.get("address") as string | null)?.trim() || null,
      },
    });

    revalidatePath("/dashboard/customers");
    return { success: true, data: customer };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to create customer.",
    };
  }
}

export async function updateCustomer(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const shopId = await getShopId();
    await requirePermission(shopId, "canManageCustomers");

    const customerId = parseInt(formData.get("customerId") as string, 10);
    if (isNaN(customerId)) return { success: false, error: "Customer ID is required." };

    const name = (formData.get("name") as string | null)?.trim();
    if (!name) return { success: false, error: "Customer name is required." };

    const db = tenantPrisma(shopId);
    const customer = await db.customer.update({
      where: { id: customerId },
      data: {
        name,
        phone: (formData.get("phone") as string | null)?.trim() || null,
        email: (formData.get("email") as string | null)?.trim() || null,
        address: (formData.get("address") as string | null)?.trim() || null,
      },
    });

    revalidatePath("/dashboard/customers");
    revalidatePath(`/dashboard/customers/${customerId}`);
    return { success: true, data: customer };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to update customer.",
    };
  }
}

export async function deleteCustomer(customerId: number): Promise<ActionState> {
  try {
    const shopId = await getShopId();
    await requirePermission(shopId, "canManageCustomers");

    const db = tenantPrisma(shopId);
    await db.customer.delete({ where: { id: customerId } });

    revalidatePath("/dashboard/customers");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to delete customer.",
    };
  }
}

// ─── Collect Credit Payment ───────────────────────────────────────────────────

export async function recordCreditPayment(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const shopId = await getShopId();
    await requirePermission(shopId, "canCollectCreditPayments");

    const rawCreditSaleId = formData.get("creditSaleId") as string | null;
    const creditSaleId = rawCreditSaleId ? parseInt(rawCreditSaleId, 10) : NaN;
    if (isNaN(creditSaleId)) {
      return { success: false, error: "Credit sale ID is required." };
    }

    const amountRaw = formData.get("amount") as string | null;
    if (!amountRaw) return { success: false, error: "Amount is required." };

    // Form sends rupees; we store paise
    const amountRupees = parseFloat(amountRaw);
    if (isNaN(amountRupees) || amountRupees <= 0) {
      return { success: false, error: "Amount must be a positive number." };
    }
    const amountPaise = Math.round(amountRupees * 100);

    const paymentMode =
      (formData.get("paymentMode") as string | null)?.trim() || "CASH";
    const note = (formData.get("note") as string | null)?.trim() || null;

    const creditSale = await prisma.creditSale.findUnique({
      where: { id: creditSaleId, shopId },
    });
    if (!creditSale) {
      return { success: false, error: "Credit sale not found." };
    }

    const newPaidAmount = creditSale.paidAmount + amountPaise;
    const newStatus = calcPaymentStatus(creditSale.totalAmount, newPaidAmount);

    await prisma.$transaction([
      prisma.creditSale.update({
        where: { id: creditSaleId },
        data: { paidAmount: newPaidAmount, status: newStatus },
      }),
      prisma.creditPayment.create({
        data: {
          creditSaleId,
          amount: amountPaise,
          paymentMode,
          note,
        },
      }),
    ]);

    revalidatePath("/dashboard/customers");
    revalidatePath(`/dashboard/customers/${creditSale.customerId}`);
    revalidatePath("/dashboard/report");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to record credit payment.",
    };
  }
}
