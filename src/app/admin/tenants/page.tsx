import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Search, Eye } from 'lucide-react';

interface TenantsPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminTenantsPage({ searchParams }: TenantsPageProps) {
  const { q } = await searchParams;

  const allShops = await prisma.shop.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      members: {
        where: { role: 'OWNER' },
        take: 1,
        include: { user: { select: { email: true, name: true } } },
      },
      subscription: {
        include: { plan: { select: { name: true } } },
      },
    },
  });

  // Filter in JS to avoid Prisma mode:'insensitive' type issues
  const shops = q
    ? allShops.filter((s) => {
        const qLower = q.toLowerCase();
        const nameMatch = s.name.toLowerCase().includes(qLower);
        const ownerEmail = s.members[0]?.user?.email?.toLowerCase() ?? '';
        return nameMatch || ownerEmail.includes(qLower);
      })
    : allShops;

  const statusColor = (status?: string | null) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-700';
      case 'TRIALING': return 'bg-blue-100 text-blue-700';
      case 'PAST_DUE': return 'bg-amber-100 text-amber-700';
      case 'CANCELLED':
      case 'EXPIRED': return 'bg-red-100 text-red-600';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenants</h1>
          <p className="mt-1 text-sm text-slate-500">
            {shops.length} shop{shops.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <form method="GET" className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by shop name or email…"
              className="rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 w-72 bg-white shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition shadow-sm"
          >
            Search
          </button>
          {q && (
            <a
              href="/admin/tenants"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 transition"
            >
              Clear
            </a>
          )}
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {shops.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            {q ? `No tenants found for "${q}"` : 'No tenants yet.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Shop</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Owner</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Plan</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Expiry</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Created</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {shops.map((shop) => {
                const owner = shop.members[0]?.user;
                const sub = shop.subscription;
                return (
                  <tr key={shop.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <Link
                          href={`/admin/tenants/${shop.id}`}
                          className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline transition"
                        >
                          {shop.name}
                        </Link>
                        <p className="text-xs text-slate-400 font-mono">{shop.slug}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {owner ? (
                        <div>
                          <p className="text-slate-700">{owner.name}</p>
                          <p className="text-xs text-slate-400">{owner.email}</p>
                        </div>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {sub?.plan?.name ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(sub?.status)}`}>
                        {sub?.status ?? 'No sub'}
                      </span>
                      {!shop.isActive && (
                        <span className="ml-1.5 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">
                      {sub?.currentPeriodEnd
                        ? new Date(sub.currentPeriodEnd).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">
                      {new Date(shop.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/tenants/${shop.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition shadow-sm"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View Store
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
