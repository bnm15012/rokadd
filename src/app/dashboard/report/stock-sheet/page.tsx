import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Grid3X3 } from "lucide-react";
import { getSessionUser, requirePermission } from "@/lib/permissions";
import { tenantPrisma } from "@/lib/prisma";
import { TakeSnapshotButton } from "./_components/TakeSnapshotButton";
import { StockSheetActions } from "./_components/StockSheetActions";

export default async function StockSheetPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  let user;
  try {
    user = await getSessionUser();
  } catch {
    redirect("/");
  }

  const shopId = user.shopMembers[0]?.shopId;
  if (!shopId) redirect("/");

  try {
    await requirePermission(shopId, "canViewInventory");
  } catch {
    return (
      <div className="p-8">
        <p className="text-red-600 font-medium">
          You do not have permission to view stock reports.
        </p>
      </div>
    );
  }

  const params = await searchParams;

  // Determine which month to show (default: current month)
  const now = new Date();
  const monthParam = typeof params.month === "string" ? params.month : null;
  let year: number, month: number;

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    [year, month] = monthParam.split("-").map(Number);
  } else {
    year = now.getFullYear();
    month = now.getMonth() + 1; // 1-based
  }

  // Calculate date range for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // last day of month
  const daysInMonth = endDate.getDate();

  // Prev/next month for navigation
  const prevMonth = month === 1
    ? `${year - 1}-12`
    : `${year}-${String(month - 1).padStart(2, "0")}`;
  const nextMonth = month === 12
    ? `${year + 1}-01`
    : `${year}-${String(month + 1).padStart(2, "0")}`;

  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;

  const db = tenantPrisma(shopId);

  // Get all active products
  const products = await db.product.findMany({
    where: { shopId, isActive: true },
    include: { category: true },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });

  // Get snapshots for this month
  const snapshots = await db.stockSnapshot.findMany({
    where: {
      shopId,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: "asc" },
  });

  // Build lookup: productId -> { day -> stockPieces }
  const snapshotMap = new Map<number, Map<number, number>>();
  for (const snap of snapshots) {
    const d = new Date(snap.date).getDate();
    if (!snapshotMap.has(snap.productId)) {
      snapshotMap.set(snap.productId, new Map());
    }
    snapshotMap.get(snap.productId)!.set(d, snap.stockPieces);
  }

  // Which days have at least one snapshot?
  const daysWithData = new Set<number>();
  for (const snap of snapshots) {
    daysWithData.add(new Date(snap.date).getDate());
  }

  // Always show all days 1 to last day of month
  const days: number[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  const monthLabel = startDate.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  // Build serializable grid for the CSV download client component
  const gridForCSV: Record<number, Record<number, number>> = {};
  products.forEach((product, idx) => {
    const productSnaps = snapshotMap.get(product.id);
    if (productSnaps) {
      gridForCSV[idx] = Object.fromEntries(productSnaps);
    }
  });
  const productsForCSV = products.map((p) => ({
    name: p.name,
    categoryName: p.category?.name ?? "Uncategorized",
  }));

  return (
    <div className="max-w-full">
      {/* Force landscape when printing this page */}
      <style dangerouslySetInnerHTML={{ __html: '@media print { @page { size: landscape; margin: 8mm; } table { page-break-inside: auto !important; } tr { page-break-inside: avoid; } }' }} />

      {/* Header — hidden on print */}
      <div className="print:hidden flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/report"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="rounded-lg p-1.5 bg-gradient-to-br from-teal-500 to-emerald-500 shadow-sm">
            <Grid3X3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Stock Sheet</h1>
            <p className="text-sm text-gray-500">
              Daily stock levels for all products
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <TakeSnapshotButton />
          <StockSheetActions
            products={productsForCSV}
            days={days}
            grid={gridForCSV}
            monthLabel={monthLabel}
          />
        </div>
      </div>

      {/* Print header — visible only when printing */}
      <div className="hidden print:block mb-4 border-b-2 border-gray-900 pb-3">
        <h1 className="text-xl font-bold text-gray-900">Stock Sheet — {monthLabel}</h1>
        <p className="text-sm text-gray-600">Daily stock levels (in pieces)</p>
      </div>

      {/* Month navigator — hidden on print */}
      <div className="print:hidden flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/report/stock-sheet?month=${prevMonth}`}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </Link>
          <span className="text-sm font-semibold text-gray-900 min-w-[140px] text-center">
            {monthLabel}
          </span>
          {!isCurrentMonth && (
            <Link
              href={`/dashboard/report/stock-sheet?month=${nextMonth}`}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </Link>
          )}
        </div>
        <div className="text-xs text-gray-400">
          {daysWithData.size} day{daysWithData.size !== 1 ? "s" : ""} with snapshots
        </div>
      </div>

      {/* Grid table — always show full month with bordered cells */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden print:rounded-none print:shadow-none print:border print:border-gray-400">
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-xs border-collapse print:text-[8px]">
            <thead>
              <tr className="bg-gray-100 print:bg-gray-200">
                <th className="sticky left-0 z-10 bg-gray-100 print:bg-gray-200 print:static text-center px-1 py-2 print:px-0.5 print:py-1.5 text-[10px] print:text-[7px] font-bold text-gray-600 uppercase tracking-wider border border-gray-300 w-[36px] min-w-[36px] print:min-w-0">
                  #
                </th>
                <th className="sticky left-[36px] z-10 bg-gray-100 print:bg-gray-200 print:static text-left px-3 py-2 print:px-1 print:py-1.5 text-[10px] print:text-[7px] font-bold text-gray-600 uppercase tracking-wider border border-gray-300 min-w-[140px] print:min-w-0">
                  Product
                </th>
                {days.map((d) => (
                  <th
                    key={d}
                    className="px-1 py-2 print:px-0.5 print:py-1 text-center text-[10px] print:text-[7px] font-bold text-gray-600 border border-gray-300 min-w-[40px] print:min-w-0"
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan={daysInMonth + 2}
                    className="px-4 py-8 text-center text-sm text-gray-400 border border-gray-300"
                  >
                    No active products
                  </td>
                </tr>
              ) : (
                products.map((product, idx) => {
                  const productSnaps = snapshotMap.get(product.id);
                  return (
                    <tr
                      key={product.id}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/80"}
                    >
                      <td className="sticky left-0 z-10 print:static px-1 py-1.5 print:px-0.5 print:py-0.5 border border-gray-300 bg-inherit text-[10px] print:text-[8px] text-gray-400 text-center font-medium w-[36px]">
                        {idx + 1}
                      </td>
                      <td className="sticky left-[36px] z-10 print:static px-3 py-1.5 print:px-1 print:py-0.5 border border-gray-300 bg-inherit">
                        <div className="font-semibold text-gray-800 text-xs print:text-[8px] truncate max-w-[150px] print:max-w-none whitespace-nowrap">
                          {product.name}
                        </div>
                      </td>
                      {days.map((d) => {
                        const stockPieces = productSnaps?.get(d);
                        const hasValue = stockPieces !== undefined;
                        const isZero = hasValue && stockPieces === 0;
                        const isLow =
                          hasValue &&
                          product.lowStockThreshold > 0 &&
                          stockPieces! <= product.lowStockThreshold;

                        return (
                          <td
                            key={d}
                            className={`px-1 py-1.5 print:px-0.5 print:py-0.5 text-center border border-gray-300 ${
                              !hasValue
                                ? "text-gray-200"
                                : isZero
                                ? "text-red-600 bg-red-50 print:bg-transparent font-bold"
                                : isLow
                                ? "text-amber-600 bg-amber-50 print:bg-transparent font-semibold"
                                : "text-gray-800 font-medium"
                            }`}
                            title={
                              hasValue
                                ? `${product.name}: ${stockPieces} pcs on ${d}/${month}/${year}`
                                : ""
                            }
                          >
                            {hasValue ? stockPieces : ""}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[10px] text-gray-300 mt-3 text-right print:text-gray-500 print:text-left print:mt-4">
        Values shown in pieces. Red = out of stock, amber = low stock.
      </p>

      {/* Print footer */}
      <div className="hidden print:block mt-6 pt-3 border-t border-gray-300 text-center text-[9px] text-gray-400">
        Generated by Rokadd on {new Date().toLocaleDateString('en-IN')} at {new Date().toLocaleTimeString('en-IN')}
      </div>
    </div>
  );
}
