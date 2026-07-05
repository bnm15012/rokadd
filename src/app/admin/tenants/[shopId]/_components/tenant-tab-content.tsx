'use client';

import type { Role } from '@/generated/prisma/enums';
import { formatCurrency, formatStock } from '@/lib/utils';

// Types matching what the server sends
interface DashboardData {
  totalProducts: number;
  sales30d: number;
  expenses30d: number;
  recentSales: { invoiceNo: string; netAmount: number; saleDate: Date | string; saleType: string }[];
}

interface ProductRow {
  id: string; name: string; sku: string | null;
  costPricePerCarton: number;
  sellingPricePerCarton: number;
  sellingPricePerPiece: number;
  currentStockPieces: number;
  piecesPerCarton: number;
  isActive: boolean;
}

interface SaleRow {
  id: string; invoiceNo: string; saleDate: Date | string;
  netAmount: number; saleType: string;
  customer: { name: string } | null;
}

interface VendorRow {
  id: string; name: string; phone: string | null;
  _count: { purchases: number };
}

interface CashFlowData {
  sales: { invoiceNo: string; netAmount: number; saleDate: Date | string; saleType: string }[];
  expenses: { category: string; amount: number; expenseDate: Date | string; description: string | null }[];
}

interface StaffRow {
  id: string; role: Role; isActive: boolean;
  user: { name: string; email: string };
}

interface TenantTabContentProps {
  tab: string;
  tabData: unknown;
  shopId: string;
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function TenantTabContent({
  tab,
  tabData,
}: TenantTabContentProps) {
  if (tab === 'dashboard') {
    const data = tabData as DashboardData;
    const net = data.sales30d - data.expenses30d;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Active Products" value={data.totalProducts.toString()} color="text-indigo-600 bg-indigo-50" />
          <StatCard label="Sales (30d)" value={formatCurrency(data.sales30d)} color="text-emerald-600 bg-emerald-50" />
          <StatCard
            label="Net P/L (30d)"
            value={formatCurrency(Math.abs(net))}
            sub={net >= 0 ? 'profit' : 'loss'}
            color={net >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}
          />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">Recent Sales</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <Th>Invoice</Th><Th>Date</Th><Th>Type</Th><Th align="right">Amount</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.recentSales.map((s, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <Td><span className="font-mono text-xs">{s.invoiceNo}</span></Td>
                  <Td>{fmtDate(s.saleDate)}</Td>
                  <Td><TypeBadge type={s.saleType} /></Td>
                  <Td align="right" className="font-medium text-slate-800">{formatCurrency(s.netAmount)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (tab === 'products') {
    const products = tabData as ProductRow[];
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <Th>Name</Th><Th>SKU</Th>
              <Th align="right">Cost</Th>
              <Th align="right">Sell/Ctn</Th>
              <Th align="right">Sell/Pc</Th>
              <Th align="right">Stock</Th>
              <Th>Active</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/50">
                <Td className="font-medium text-slate-800">{p.name}</Td>
                <Td><span className="font-mono text-xs text-slate-400">{p.sku ?? '—'}</span></Td>
                <Td align="right" className="text-rose-700 font-medium">{formatCurrency(p.costPricePerCarton)}</Td>
                <Td align="right">{formatCurrency(p.sellingPricePerCarton)}</Td>
                <Td align="right">{formatCurrency(p.sellingPricePerPiece)}</Td>
                <Td align="right">{formatStock(p.currentStockPieces, p.piecesPerCarton)}</Td>
                <Td>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {p.isActive ? 'Yes' : 'No'}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (tab === 'sales') {
    const sales = tabData as SaleRow[];
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <Th>Invoice</Th><Th>Date</Th><Th>Customer</Th><Th>Type</Th><Th align="right">Amount</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sales.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/50">
                <Td><span className="font-mono text-xs">{s.invoiceNo}</span></Td>
                <Td>{fmtDate(s.saleDate)}</Td>
                <Td className="text-slate-500">{s.customer?.name ?? 'Walk-in'}</Td>
                <Td><TypeBadge type={s.saleType} /></Td>
                <Td align="right" className="font-medium">{formatCurrency(s.netAmount)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (tab === 'vendors') {
    const vendors = tabData as VendorRow[];
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <Th>Name</Th><Th>Phone</Th><Th align="right">Purchases</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {vendors.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50/50">
                <Td className="font-medium text-slate-800">{v.name}</Td>
                <Td className="text-slate-500">{v.phone ?? '—'}</Td>
                <Td align="right">{v._count.purchases}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (tab === 'cashflow') {
    const { sales, expenses } = tabData as CashFlowData;
    const totalSales = sales.reduce((s, r) => s + r.netAmount, 0);
    const totalExpenses = expenses.reduce((s, r) => s + r.amount, 0);
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Sales (30d)" value={formatCurrency(totalSales)} color="text-emerald-600 bg-emerald-50" />
          <StatCard label="Expenses (30d)" value={formatCurrency(totalExpenses)} color="text-red-600 bg-red-50" />
          <StatCard
            label="Net"
            value={formatCurrency(Math.abs(totalSales - totalExpenses))}
            sub={totalSales >= totalExpenses ? 'profit' : 'loss'}
            color={totalSales >= totalExpenses ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">Sales</div>
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-100"><Th>Invoice</Th><Th>Date</Th><Th align="right">Amount</Th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {sales.slice(0, 20).map((s, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <Td><span className="font-mono text-xs">{s.invoiceNo}</span></Td>
                    <Td>{fmtDate(s.saleDate)}</Td>
                    <Td align="right" className="font-medium text-emerald-700">{formatCurrency(s.netAmount)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">Expenses</div>
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-100"><Th>Category</Th><Th>Date</Th><Th align="right">Amount</Th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {expenses.slice(0, 20).map((e, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <Td>{e.category}</Td>
                    <Td>{fmtDate(e.expenseDate)}</Td>
                    <Td align="right" className="font-medium text-red-600">{formatCurrency(e.amount)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (tab === 'staff') {
    const staff = tabData as StaffRow[];
    const roleColors: Record<string, string> = {
      OWNER: 'bg-indigo-100 text-indigo-700',
      MANAGER: 'bg-amber-100 text-amber-700',
      STAFF: 'bg-slate-100 text-slate-600',
    };
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>Status</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {staff.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50/50">
                <Td className="font-medium text-slate-800">{m.user.name}</Td>
                <Td className="text-slate-500">{m.user.email}</Td>
                <Td>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[m.role]}`}>
                    {m.role}
                  </span>
                </Td>
                <Td>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${m.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${m.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {m.isActive ? 'Active' : 'Inactive'}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return <div className="text-slate-400 text-sm py-8 text-center">No content for this tab.</div>;
}

// Small helper components
function Th({ children, align = 'left' }: { children?: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th className={`px-5 py-3 text-${align} text-xs font-semibold text-slate-500 uppercase tracking-wide`}>
      {children}
    </th>
  );
}

function Td({
  children,
  align = 'left',
  className = '',
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) {
  return (
    <td className={`px-5 py-3.5 text-${align} text-slate-600 ${className}`}>
      {children}
    </td>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
      type === 'CASH' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
    }`}>
      {type}
    </span>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-1.5 text-xl font-bold ${color.split(' ')[0]}`}>
        {value}
        {sub && <span className="ml-1 text-sm font-normal text-slate-400">{sub}</span>}
      </p>
    </div>
  );
}
