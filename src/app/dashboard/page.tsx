import { auth } from "@/lib/auth";
import { prisma, tenantPrisma } from "@/lib/prisma";
import { formatCurrency, startOfDay, endOfDay } from "@/lib/utils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { QuickLinks } from "./_components/QuickLinks";

export default async function DashboardHome() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const user = session.user as any;
  const shopId = user.shopMembers?.[0]?.shopId;
  if (!shopId) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-500">No shop found. Please contact support.</p>
      </div>
    );
  }

  const db = tenantPrisma(shopId);
  const today = new Date();
  const dayStart = startOfDay(today);
  const dayEnd = endOfDay(today);
  const dateFilter = { gte: dayStart, lte: dayEnd };

  const [todaySales, todayExpenses, lowStockProducts, totalProducts, totalCustomers, pendingPayables] =
    await Promise.all([
      db.sale.aggregate({
        where: { shopId, saleDate: dateFilter },
        _sum: { netAmount: true },
        _count: true,
      }),
      db.expense.aggregate({
        where: { shopId, expenseDate: dateFilter },
        _sum: { amount: true },
      }),
      db.product.count({
        where: {
          shopId,
          isActive: true,
          lowStockThreshold: { gt: 0 },
          currentStockPieces: { lte: prisma.product.fields.lowStockThreshold as any },
        },
      }).catch(() => 0),
      db.product.count({ where: { shopId, isActive: true } }),
      db.customer.count({ where: { shopId } }),
      db.purchase.aggregate({
        where: { shopId, paymentStatus: { in: ["UNPAID", "PARTIALLY_PAID"] } },
        _sum: { totalAmount: true },
      }),
    ]);

  // For low stock, do a manual query since Prisma can't compare two fields easily
  const lowStockCount = await prisma.$queryRawUnsafe<[{ cnt: bigint }]>(
    `SELECT COUNT(*) as cnt FROM products WHERE shopId = ? AND isActive = 1 AND lowStockThreshold > 0 AND currentStockPieces <= lowStockThreshold`,
    shopId
  ).then((r) => Number(r[0]?.cnt || 0)).catch(() => 0);

  const stats = [
    {
      title: "Today's Sales",
      value: formatCurrency(todaySales._sum.netAmount || 0),
      sub: `${todaySales._count} transactions`,
      valueColor: "text-emerald-700",
      bg: "bg-gradient-to-br from-emerald-50 to-teal-50",
      border: "border-l-emerald-500",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      href: "/dashboard/sales/history",
    },
    {
      title: "Today's Expenses",
      value: formatCurrency(todayExpenses._sum.amount || 0),
      sub: "operational costs",
      valueColor: "text-rose-700",
      bg: "bg-gradient-to-br from-rose-50 to-pink-50",
      border: "border-l-rose-500",
      iconBg: "bg-rose-100",
      iconColor: "text-rose-600",
      href: "/dashboard/expenses",
    },
    {
      title: "Pending Payables",
      value: formatCurrency(pendingPayables._sum.totalAmount || 0),
      sub: "vendor dues",
      valueColor: "text-amber-700",
      bg: "bg-gradient-to-br from-amber-50 to-orange-50",
      border: "border-l-amber-500",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      href: "/dashboard/vendors",
    },
    {
      title: "Low Stock Alerts",
      value: lowStockCount.toString(),
      sub: `of ${totalProducts} products`,
      valueColor: lowStockCount > 0 ? "text-red-700" : "text-emerald-700",
      bg: lowStockCount > 0 ? "bg-gradient-to-br from-red-50 to-rose-50" : "bg-gradient-to-br from-emerald-50 to-green-50",
      border: lowStockCount > 0 ? "border-l-red-500" : "border-l-emerald-500",
      iconBg: lowStockCount > 0 ? "bg-red-100" : "bg-emerald-100",
      iconColor: lowStockCount > 0 ? "text-red-600" : "text-emerald-600",
      href: "/dashboard/alerts",
    },
  ];

  // Net cash balance for today
  const netCash = (todaySales._sum.netAmount || 0) - (todayExpenses._sum.amount || 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Welcome back. Here is your business overview for today.</p>
        <div className="mt-3 h-1 w-20 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link
            key={s.title}
            href={s.href}
            className={`${s.bg} rounded-xl border border-white/80 border-l-4 ${s.border} p-5 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">{s.title}</p>
              <div className={`${s.iconBg} rounded-lg p-1.5`}>
                <div className={`h-4 w-4 rounded ${s.iconColor}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold mt-2 ${s.valueColor}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.sub}</p>
          </Link>
        ))}
      </div>

      {/* Today's Net Cash */}
      <div className={`rounded-xl border p-6 ${netCash >= 0 ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200" : "bg-gradient-to-r from-red-50 to-rose-50 border-red-200"}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Today&apos;s Net Cash (Sales − Expenses)</p>
            <p className={`text-3xl font-bold mt-1 ${netCash >= 0 ? "text-emerald-700" : "text-red-700"}`}>
              {formatCurrency(netCash)}
            </p>
          </div>
          <Link
            href="/dashboard/report"
            className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition"
          >
            View details &rarr;
          </Link>
        </div>
      </div>

      {/* Quick Links */}
      <QuickLinks />
    </div>
  );
}
