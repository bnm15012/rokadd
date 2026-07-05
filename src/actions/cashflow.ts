"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUser, requirePermission } from "@/lib/permissions";
import { startOfDay, endOfDay } from "@/lib/utils";
import type { ActionState } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DailyCashFlowSummary {
  date: Date;
  totalSalesAmount: number;
  totalCashSales: number;
  totalCreditSales: number;
  vendorPaymentsMade: number;
  otherExpenses: number;
  creditCollected: number;
  netCashBalance: number;
  isFinalized: boolean;
  summaryId: number | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getShopId(): Promise<number> {
  const user = await getSessionUser();
  const shopId = user.shopMembers[0]?.shopId;
  if (!shopId) throw new Error("No shop found for this user");
  return shopId;
}

// ─── Get Daily Cash Flow ──────────────────────────────────────────────────────

export async function getDailyCashFlow(
  shopId: number,
  date: Date
): Promise<DailyCashFlowSummary> {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  // Check for existing finalized summary first
  const existing = await prisma.dailySummary.findUnique({
    where: { shopId_date: { shopId, date: dayStart } },
  });

  if (existing?.isFinalized) {
    return {
      date,
      totalSalesAmount: existing.totalSalesAmount,
      totalCashSales: existing.totalCashSales,
      totalCreditSales: existing.totalCreditSales,
      vendorPaymentsMade: existing.vendorPaymentsMade,
      otherExpenses: existing.otherExpenses,
      creditCollected: existing.creditCollected,
      netCashBalance: existing.netCashBalance,
      isFinalized: true,
      summaryId: existing.id,
    };
  }

  // Calculate live from transactions
  const [salesAgg, vendorPayAgg, expenseAgg, creditPayAgg] = await Promise.all(
    [
      // Total sales with cash/credit breakdown
      prisma.sale.aggregate({
        where: {
          shopId,
          saleDate: { gte: dayStart, lte: dayEnd },
        },
        _sum: { netAmount: true },
      }),

      // Vendor payments made today
      prisma.vendorPayment.aggregate({
        where: {
          shopId,
          paidAt: { gte: dayStart, lte: dayEnd },
        },
        _sum: { amount: true },
      }),

      // Other expenses today
      prisma.expense.aggregate({
        where: {
          shopId,
          expenseDate: { gte: dayStart, lte: dayEnd },
        },
        _sum: { amount: true },
      }),

      // Credit collected today
      prisma.creditPayment.findMany({
        where: {
          paidAt: { gte: dayStart, lte: dayEnd },
          creditSale: { shopId },
        },
        select: { amount: true },
      }),
    ]
  );

  // Cash vs credit sales breakdown
  const [cashSalesAgg, creditSalesAgg] = await Promise.all([
    prisma.sale.aggregate({
      where: {
        shopId,
        saleType: "CASH",
        saleDate: { gte: dayStart, lte: dayEnd },
      },
      _sum: { netAmount: true },
    }),
    prisma.sale.aggregate({
      where: {
        shopId,
        saleType: "CREDIT",
        saleDate: { gte: dayStart, lte: dayEnd },
      },
      _sum: { netAmount: true },
    }),
  ]);

  const totalSalesAmount = salesAgg._sum.netAmount ?? 0;
  const totalCashSales = cashSalesAgg._sum.netAmount ?? 0;
  const totalCreditSales = creditSalesAgg._sum.netAmount ?? 0;
  const vendorPaymentsMade = vendorPayAgg._sum.amount ?? 0;
  const otherExpenses = expenseAgg._sum.amount ?? 0;
  const creditCollected = creditPayAgg.reduce((sum, p) => sum + p.amount, 0);

  // Net Cash = Cash Sales + Credit Collected - Vendor Payments - Expenses
  const netCashBalance =
    totalCashSales + creditCollected - vendorPaymentsMade - otherExpenses;

  return {
    date,
    totalSalesAmount,
    totalCashSales,
    totalCreditSales,
    vendorPaymentsMade,
    otherExpenses,
    creditCollected,
    netCashBalance,
    isFinalized: false,
    summaryId: existing?.id ?? null,
  };
}

// ─── Finalize Daily Summary ───────────────────────────────────────────────────

export async function finalizeDailySummary(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const shopId = await getShopId();
    await requirePermission(shopId, "canFinalizeCashFlow");

    const dateStr = formData.get("date") as string | null;
    if (!dateStr) return { success: false, error: "Date is required." };

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return { success: false, error: "Invalid date." };
    }

    const summary = await getDailyCashFlow(shopId, date);

    if (summary.isFinalized) {
      return { success: false, error: "This day has already been finalized." };
    }

    const dayStart = startOfDay(date);

    await prisma.dailySummary.upsert({
      where: { shopId_date: { shopId, date: dayStart } },
      create: {
        shopId,
        date: dayStart,
        totalSalesAmount: summary.totalSalesAmount,
        totalCashSales: summary.totalCashSales,
        totalCreditSales: summary.totalCreditSales,
        vendorPaymentsMade: summary.vendorPaymentsMade,
        otherExpenses: summary.otherExpenses,
        creditCollected: summary.creditCollected,
        netCashBalance: summary.netCashBalance,
        isFinalized: true,
      },
      update: {
        totalSalesAmount: summary.totalSalesAmount,
        totalCashSales: summary.totalCashSales,
        totalCreditSales: summary.totalCreditSales,
        vendorPaymentsMade: summary.vendorPaymentsMade,
        otherExpenses: summary.otherExpenses,
        creditCollected: summary.creditCollected,
        netCashBalance: summary.netCashBalance,
        isFinalized: true,
      },
    });

    revalidatePath("/dashboard/report");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to finalize daily summary.",
    };
  }
}
