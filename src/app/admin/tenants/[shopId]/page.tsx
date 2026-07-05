import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma, tenantPrisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/permissions';
import { TenantAdminActions } from './_components/tenant-admin-actions';
import { TenantTabContent } from './_components/tenant-tab-content';

interface TenantDetailPageProps {
  params: Promise<{ shopId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function TenantDetailPage({
  params,
  searchParams,
}: TenantDetailPageProps) {
  const { shopId } = await params;
  const shopIdNum = parseInt(shopId, 10);
  const { tab = 'dashboard' } = await searchParams;

  let user;
  try {
    user = await getSessionUser();
  } catch {
    redirect('/');
  }
  if (!user.isSuperAdmin) redirect('/');

  const shop = await prisma.shop.findUnique({
    where: { id: shopIdNum },
    include: {
      members: {
        where: { role: 'OWNER' },
        take: 1,
        include: { user: { select: { name: true, email: true } } },
      },
      subscription: {
        include: { plan: true },
      },
    },
  });

  if (!shop) notFound();

  // Log admin access
  await prisma.adminAuditLog.create({
    data: {
      adminId: user.id,
      shopId: shopIdNum,
      action: `Viewed tenant: ${shop.name} (tab: ${tab})`,
    },
  });

  const db = tenantPrisma(shopIdNum);

  const TABS = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'products', label: 'Products' },
    { key: 'sales', label: 'Sales' },
    { key: 'vendors', label: 'Vendors' },
    { key: 'cashflow', label: 'Cash Flow' },
    { key: 'staff', label: 'Staff' },
  ];

  // Fetch data for the active tab
  let tabData: unknown = null;

  if (tab === 'dashboard') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalProducts, totalSales, totalExpenses, recentSales] = await Promise.all([
      db.product.count({ where: { isActive: true } }),
      db.sale.aggregate({ _sum: { netAmount: true }, where: { saleDate: { gte: thirtyDaysAgo } } }),
      db.expense.aggregate({ _sum: { amount: true }, where: { expenseDate: { gte: thirtyDaysAgo } } }),
      db.sale.findMany({
        orderBy: { saleDate: 'desc' },
        take: 5,
        select: { invoiceNo: true, netAmount: true, saleDate: true, saleType: true },
      }),
    ]);

    tabData = {
      totalProducts,
      sales30d: totalSales._sum.netAmount ?? 0,
      expenses30d: totalExpenses._sum.amount ?? 0,
      recentSales,
    };
  } else if (tab === 'products') {
    tabData = await db.product.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, sku: true,
        costPricePerCarton: true,
        sellingPricePerCarton: true,
        sellingPricePerPiece: true,
        currentStockPieces: true,
        piecesPerCarton: true,
        isActive: true,
      },
    });
  } else if (tab === 'sales') {
    tabData = await db.sale.findMany({
      orderBy: { saleDate: 'desc' },
      take: 50,
      select: {
        id: true, invoiceNo: true, saleDate: true,
        netAmount: true, saleType: true,
        customer: { select: { name: true } },
      },
    });
  } else if (tab === 'vendors') {
    tabData = await prisma.vendor.findMany({
      where: { shopId: shopIdNum },
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, phone: true,
        _count: { select: { purchases: true } },
      },
    });
  } else if (tab === 'cashflow') {
    const last30 = new Date();
    last30.setDate(last30.getDate() - 30);
    const [sales, expenses] = await Promise.all([
      db.sale.findMany({
        where: { saleDate: { gte: last30 } },
        orderBy: { saleDate: 'desc' },
        select: { invoiceNo: true, netAmount: true, saleDate: true, saleType: true },
      }),
      db.expense.findMany({
        where: { expenseDate: { gte: last30 } },
        orderBy: { expenseDate: 'desc' },
        select: { category: true, amount: true, expenseDate: true, description: true },
      }),
    ]);
    tabData = { sales, expenses };
  } else if (tab === 'staff') {
    tabData = await prisma.shopMember.findMany({
      where: { shopId: shopIdNum },
      include: {
        user: { select: { name: true, email: true } },
        permissions: true,
      },
      orderBy: { role: 'asc' },
    });
  }

  const owner = shop.members[0]?.user;
  const sub = shop.subscription;

  return (
    <div className="space-y-4">
      {/* Shop header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{shop.name}</h1>
          <p className="text-sm text-slate-500">{shop.slug}</p>
          {owner && (
            <p className="mt-1 text-sm text-slate-600">
              Owner: <span className="font-medium">{owner.name}</span>{' '}
              <span className="text-slate-400">({owner.email})</span>
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          {sub && (
            <div className="text-sm text-slate-500">
              Plan:{' '}
              <span className="font-medium text-slate-700">{sub.plan?.name ?? '—'}</span>
              {' · '}
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  sub.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                  sub.status === 'TRIALING' ? 'bg-blue-100 text-blue-700' :
                  'bg-amber-100 text-amber-700'
                }`}
              >
                {sub.status}
              </span>
            </div>
          )}
          <TenantAdminActions
            shopId={shopIdNum}
            isActive={shop.isActive}
            subscriptionId={sub?.id}
            currentPeriodEnd={sub?.currentPeriodEnd?.toISOString() ?? null}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {TABS.map(({ key, label }) => (
          <Link
            key={key}
            href={`/admin/tenants/${shopId}?tab=${key}`}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Tab content */}
      <TenantTabContent
        tab={tab}
        tabData={tabData}
        shopId={shopIdNum}
      />
    </div>
  );
}
