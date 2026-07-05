import { redirect } from 'next/navigation';
import { getSessionUser, requirePermission } from '@/lib/permissions';
import { prisma, tenantPrisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from '@/lib/utils';
import { DailyReportClient } from './_components/DailyReportClient';
import type { DayReport } from './_components/DailyReportClient';

export const metadata = { title: 'Daily Report — Rokadd' };

export default async function DailyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; from?: string; to?: string }>;
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
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Parse date range
  let fromStr: string;
  let toStr: string;

  if (params.from) {
    fromStr = params.from;
    toStr = params.to ?? params.from;
  } else if (params.date) {
    fromStr = params.date;
    toStr = params.date;
  } else {
    fromStr = todayStr;
    toStr = todayStr;
  }

  const fromDate = new Date(fromStr);
  const toDate = new Date(toStr);
  if (isNaN(fromDate.getTime())) fromStr = todayStr;
  if (isNaN(toDate.getTime())) toStr = todayStr;

  const isSingleDay = fromStr === toStr;

  // Check finalize permission (don't block page if denied)
  let canFinalize = false;
  try {
    await requirePermission(shopId, 'canFinalizeCashFlow');
    canFinalize = true;
  } catch { /* no permission */ }

  // Append T00:00:00 to force local time parsing (bare date strings are parsed as UTC)
  const rangeStart = startOfDay(new Date(fromStr + 'T00:00:00'));
  const rangeEnd = endOfDay(new Date(toStr + 'T00:00:00'));

  const db = tenantPrisma(shopId);

  // Fetch all data for the entire range in parallel
  const [
    allSales,
    allExpenses,
    allVendorPayments,
    allCreditPayments,
    allRecons,
    shop,
    dailySummary,
  ] = await Promise.all([
    db.sale.findMany({
      where: { shopId, saleDate: { gte: rangeStart, lte: rangeEnd } },
      include: {
        items: {
          include: { product: { select: { name: true, piecesPerCarton: true } } },
        },
        customer: { select: { name: true } },
      },
      orderBy: { saleDate: 'asc' },
    }),

    db.expense.findMany({
      where: { shopId, expenseDate: { gte: rangeStart, lte: rangeEnd } },
      orderBy: { expenseDate: 'asc' },
    }),

    prisma.vendorPayment.findMany({
      where: { shopId, paidAt: { gte: rangeStart, lte: rangeEnd } },
      include: {
        purchase: {
          include: { vendor: { select: { name: true } } },
        },
      },
      orderBy: { paidAt: 'asc' },
    }),

    prisma.creditPayment.findMany({
      where: {
        paidAt: { gte: rangeStart, lte: rangeEnd },
        creditSale: { shopId },
      },
      include: {
        creditSale: {
          include: { customer: { select: { name: true } } },
        },
      },
      orderBy: { paidAt: 'asc' },
    }),

    prisma.dailyRecon.findMany({
      where: { shopId, date: { gte: rangeStart, lte: rangeEnd } },
      include: { items: true },
      orderBy: { date: 'asc' },
    }),

    db.shop.findUnique({ where: { id: shopId }, select: { name: true } }),

    // Finalize status for single-day view
    isSingleDay
      ? prisma.dailySummary.findUnique({
          where: { shopId_date: { shopId, date: startOfDay(new Date(fromStr + 'T00:00:00')) } },
          select: { isFinalized: true },
        })
      : Promise.resolve(null),
  ]);

  // Get product names for recon items
  const allReconProductIds = allRecons.flatMap((r) => r.items.map((i) => i.productId));
  const reconProducts = allReconProductIds.length > 0
    ? await db.product.findMany({
        where: { id: { in: [...new Set(allReconProductIds)] } },
        select: { id: true, name: true },
      })
    : [];
  const productNameMap = new Map(reconProducts.map((p) => [p.id, p.name]));

  // Generate list of dates in range
  const dateList: string[] = [];
  const cursor = new Date(fromStr + 'T00:00:00');
  const endDate = new Date(toStr + 'T00:00:00');
  while (cursor <= endDate) {
    // Use local date parts to avoid UTC shift
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, '0');
    const d = String(cursor.getDate()).padStart(2, '0');
    dateList.push(`${y}-${m}-${d}`);
    cursor.setDate(cursor.getDate() + 1);
  }

  // Helper to get local date key from a Date object
  function dateKey(dt: Date): string {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Build per-day reports
  const dayReports: DayReport[] = dateList.map((day) => {
    const dayS = startOfDay(new Date(day + 'T00:00:00'));
    const dayE = endOfDay(new Date(day + 'T00:00:00'));

    // Filter data for this day
    const daySales = allSales.filter((s) => s.saleDate >= dayS && s.saleDate <= dayE);
    const dayExpenses = allExpenses.filter((e) => e.expenseDate >= dayS && e.expenseDate <= dayE);
    const dayVendorPay = allVendorPayments.filter((v) => v.paidAt >= dayS && v.paidAt <= dayE);
    const dayCreditPay = allCreditPayments.filter((c) => c.paidAt >= dayS && c.paidAt <= dayE);
    const dayRecon = allRecons.find((r) => dateKey(r.date) === day);

    // Sale items
    const saleItems = daySales.flatMap((sale) =>
      sale.items.map((item) => ({
        productName: item.product.name,
        totalPieces: item.totalPieces,
        lineTotal: item.lineTotal,
        saleType: sale.saleType,
      }))
    );

    const totalCashSales = daySales
      .filter((s) => s.saleType === 'CASH')
      .reduce((sum, s) => sum + s.netAmount, 0);
    const totalCreditSales = daySales
      .filter((s) => s.saleType === 'CREDIT')
      .reduce((sum, s) => sum + s.netAmount, 0);
    const totalSales = totalCashSales + totalCreditSales;
    const totalDiscount = daySales.reduce((sum, s) => sum + s.discount, 0);

    const expenses = dayExpenses.map((e) => ({
      category: e.category,
      description: e.description,
      amount: e.amount,
    }));
    const totalExpenses = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

    const vendorPayments = dayVendorPay.map((vp) => ({
      vendorName: vp.purchase.vendor.name,
      amount: vp.amount,
      paymentMode: vp.paymentMode,
      billNumber: vp.purchase.billNumber,
    }));
    const totalVendorPayments = dayVendorPay.reduce((sum, vp) => sum + vp.amount, 0);

    const creditPayments = dayCreditPay.map((cp) => ({
      customerName: cp.creditSale.customer?.name ?? 'Unknown',
      amount: cp.amount,
      paymentMode: cp.paymentMode,
    }));
    const totalCreditCollected = dayCreditPay.reduce((sum, cp) => sum + cp.amount, 0);

    const netCashBalance = totalCashSales + totalCreditCollected - totalVendorPayments - totalExpenses;

    // Recon items for this day
    let reconItems: DayReport['reconItems'] = [];
    if (dayRecon) {
      reconItems = dayRecon.items
        .filter((i) => i.unitsSold > 0)
        .map((i) => ({
          productName: productNameMap.get(i.productId) ?? 'Unknown',
          openingStock: i.openingStock,
          closingStock: i.closingStock,
          unitsSold: i.unitsSold,
          salesAmount: i.salesAmount,
        }))
        .sort((a, b) => a.productName.localeCompare(b.productName));
    }

    return {
      date: day,
      saleItems,
      totalCashSales,
      totalCreditSales,
      totalSales,
      totalDiscount,
      expenses,
      totalExpenses,
      vendorPayments,
      totalVendorPayments,
      creditPayments,
      totalCreditCollected,
      netCashBalance,
      reconItems,
      reconTotalSales: dayRecon?.totalSalesAmount ?? null,
      reconCashInHand: dayRecon?.cashInHand ?? null,
      reconCashDifference: dayRecon?.cashDifference ?? null,
    };
  });

  return (
    <DailyReportClient
      shopName={shop?.name ?? 'Shop'}
      fromDate={fromStr}
      toDate={toStr}
      today={todayStr}
      dayReports={dayReports}
      canFinalize={canFinalize}
      isFinalized={dailySummary?.isFinalized ?? false}
    />
  );
}
