import { redirect } from 'next/navigation';
import { getSessionUser, requirePermission } from '@/lib/permissions';
import { prisma, tenantPrisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from '@/lib/utils';
import { MonthlyReportClient } from './_components/MonthlyReportClient';
import type { DaySummary } from './_components/MonthlyReportClient';

export const metadata = { title: 'Monthly Summary — Rokadd' };

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default async function MonthlyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;

  let user;
  try {
    user = await getSessionUser();
  } catch {
    redirect('/');
  }

  const shopId = user.shopMembers[0]?.shopId;
  if (!shopId) redirect('/');

  try {
    await requirePermission(shopId, 'canViewCashFlow');
  } catch {
    return (
      <div className="p-8">
        <p className="text-red-600 font-medium">You do not have permission to view reports.</p>
      </div>
    );
  }

  const today = new Date();
  const todayStr = localDateStr(today);

  // Parse month param (format: YYYY-MM) or default to current month
  let year = today.getFullYear();
  let month = today.getMonth(); // 0-indexed
  if (params.month && /^\d{4}-\d{2}$/.test(params.month)) {
    const [y, m] = params.month.split('-').map(Number);
    if (y >= 2020 && y <= 2100 && m >= 1 && m <= 12) {
      year = y;
      month = m - 1;
    }
  }

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Month boundaries
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0); // last day of month

  // Clamp end to today if viewing current month (don't show future days)
  const effectiveEnd = monthEnd > today ? today : monthEnd;

  const rangeStart = startOfDay(monthStart);
  const rangeEnd = endOfDay(effectiveEnd);

  const db = tenantPrisma(shopId);

  // Fetch all data for the month in parallel — only aggregation-level fields needed
  const [allSales, allExpenses, allVendorPayments, allCreditPayments, shop] =
    await Promise.all([
      db.sale.findMany({
        where: { shopId, saleDate: { gte: rangeStart, lte: rangeEnd } },
        select: { saleDate: true, netAmount: true, saleType: true },
      }),

      db.expense.findMany({
        where: { shopId, expenseDate: { gte: rangeStart, lte: rangeEnd } },
        select: { expenseDate: true, amount: true },
      }),

      prisma.vendorPayment.findMany({
        where: { shopId, paidAt: { gte: rangeStart, lte: rangeEnd } },
        select: { paidAt: true, amount: true },
      }),

      prisma.creditPayment.findMany({
        where: {
          paidAt: { gte: rangeStart, lte: rangeEnd },
          creditSale: { shopId },
        },
        select: { paidAt: true, amount: true },
      }),

      db.shop.findUnique({ where: { id: shopId }, select: { name: true } }),
    ]);

  // Generate day list for the month
  const dateList: string[] = [];
  const cursor = new Date(monthStart);
  while (cursor <= effectiveEnd) {
    dateList.push(localDateStr(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  // Helper to get local date key
  function dateKey(dt: Date): string {
    return localDateStr(new Date(dt));
  }

  // Build per-day summaries
  const daySummaries: DaySummary[] = dateList.map((day) => {
    const dayS = startOfDay(new Date(day + 'T00:00:00'));
    const dayE = endOfDay(new Date(day + 'T00:00:00'));

    const daySales = allSales.filter(
      (s) => s.saleDate >= dayS && s.saleDate <= dayE,
    );
    const dayExpenses = allExpenses.filter(
      (e) => e.expenseDate >= dayS && e.expenseDate <= dayE,
    );
    const dayVendorPay = allVendorPayments.filter(
      (v) => v.paidAt >= dayS && v.paidAt <= dayE,
    );
    const dayCreditPay = allCreditPayments.filter(
      (c) => c.paidAt >= dayS && c.paidAt <= dayE,
    );

    const totalCashSales = daySales
      .filter((s) => s.saleType === 'CASH')
      .reduce((sum, s) => sum + s.netAmount, 0);
    const totalCreditSales = daySales
      .filter((s) => s.saleType === 'CREDIT')
      .reduce((sum, s) => sum + s.netAmount, 0);
    const totalSales = totalCashSales + totalCreditSales;
    const totalExpenses = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalVendorPayments = dayVendorPay.reduce(
      (sum, v) => sum + v.amount,
      0,
    );
    const totalCreditCollected = dayCreditPay.reduce(
      (sum, c) => sum + c.amount,
      0,
    );
    const netCash =
      totalCashSales + totalCreditCollected - totalVendorPayments - totalExpenses;

    return {
      date: day,
      totalSales,
      totalCashSales,
      totalCreditSales,
      totalExpenses,
      totalVendorPayments,
      totalCreditCollected,
      netCash,
    };
  });

  return (
    <MonthlyReportClient
      shopName={shop?.name ?? 'Shop'}
      month={monthStr}
      today={todayStr}
      daySummaries={daySummaries}
    />
  );
}
