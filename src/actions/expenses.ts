'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionUser, requirePermission } from '@/lib/permissions';
import type { ActionState } from '@/types';

export async function createExpense(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await getSessionUser();
    const shopId = user.shopMembers[0]?.shopId;
    if (!shopId) return { success: false, error: 'No shop found for user' };

    await requirePermission(shopId, 'canLogExpenses');

    const category = (formData.get('category') as string)?.trim();
    const description = (formData.get('description') as string)?.trim() || null;
    const amountRaw = formData.get('amount') as string;
    const expenseDateRaw = formData.get('expenseDate') as string;

    if (!category) return { success: false, error: 'Category is required' };
    if (!amountRaw) return { success: false, error: 'Amount is required' };

    const amountFloat = parseFloat(amountRaw);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      return { success: false, error: 'Amount must be a positive number' };
    }
    // Amount is in rupees; store in paise
    const amountInPaise = Math.round(amountFloat * 100);

    const expenseDate = expenseDateRaw ? new Date(expenseDateRaw) : new Date();

    await prisma.expense.create({
      data: {
        shopId,
        category,
        description,
        amount: amountInPaise,
        expenseDate,
      },
    });

    revalidatePath('/dashboard/expenses');

    return { success: true, data: { message: 'Expense recorded successfully' } };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create expense';
    return { success: false, error: message };
  }
}

export async function deleteExpense(expenseId: string): Promise<ActionState> {
  try {
    const user = await getSessionUser();
    const shopId = user.shopMembers[0]?.shopId;
    if (!shopId) return { success: false, error: 'No shop found for user' };

    await requirePermission(shopId, 'canLogExpenses');

    // Verify expense belongs to this shop before deleting
    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, shopId },
    });
    if (!expense) return { success: false, error: 'Expense not found' };

    await prisma.expense.delete({ where: { id: expenseId } });

    revalidatePath('/dashboard/expenses');

    return { success: true, data: { message: 'Expense deleted' } };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete expense';
    return { success: false, error: message };
  }
}
