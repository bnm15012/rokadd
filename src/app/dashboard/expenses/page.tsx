import { redirect } from 'next/navigation';
import { getSessionUser, requirePermission } from '@/lib/permissions';
import { tenantPrisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from '@/lib/utils';
import { ExpensesClient } from './_components/ExpensesClient';

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  let user;
  try {
    user = await getSessionUser();
  } catch {
    redirect('/');
  }

  const shopId = user.shopMembers[0]?.shopId;
  if (!shopId) redirect('/');

  try {
    await requirePermission(shopId, 'canViewExpenses');
  } catch {
    return (
      <div className="p-8">
        <p className="text-red-600 font-medium">
          You do not have permission to view expenses.
        </p>
      </div>
    );
  }

  // Check if user can also log (create/delete) expenses
  let canLog = false;
  try {
    await requirePermission(shopId, 'canLogExpenses');
    canLog = true;
  } catch {
    canLog = false;
  }

  const params = await searchParams;
  const today = new Date().toISOString().split('T')[0];

  // Parse filter params: ?from=...&to=... for range, or defaults to today
  const fromStr = typeof params.from === 'string' ? params.from : null;
  const toStr = typeof params.to === 'string' ? params.to : null;

  let fromDate: string;
  let toDate: string;

  if (fromStr && toStr) {
    // Date range mode
    fromDate = fromStr;
    toDate = toStr;
  } else if (fromStr) {
    // Single date via 'from' param
    fromDate = fromStr;
    toDate = fromStr;
  } else {
    // Default: today
    fromDate = today;
    toDate = today;
  }

  const db = tenantPrisma(shopId);

  const expenses = await db.expense.findMany({
    where: {
      expenseDate: {
        gte: startOfDay(new Date(fromDate)),
        lte: endOfDay(new Date(toDate)),
      },
    },
    orderBy: { expenseDate: 'desc' },
  });

  return (
    <ExpensesClient
      initialExpenses={expenses.map((e) => ({
        id: e.id,
        category: e.category,
        description: e.description,
        amount: e.amount,
        expenseDate: e.expenseDate.toISOString(),
      }))}
      fromDate={fromDate}
      toDate={toDate}
      today={today}
      canLog={canLog}
    />
  );
}
