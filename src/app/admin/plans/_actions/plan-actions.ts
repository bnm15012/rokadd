'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/permissions';
import { generateSlug } from '@/lib/utils';
import type { ActionState } from '@/types';

export async function createPlan(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await getSessionUser();
    if (!user.isSuperAdmin) return { success: false, error: 'Unauthorized' };

    const name = (formData.get('name') as string)?.trim();
    const description = (formData.get('description') as string)?.trim() || null;
    const priceMonthly = Math.round(parseFloat(formData.get('priceMonthly') as string) * 100);
    const priceYearly = Math.round(parseFloat(formData.get('priceYearly') as string) * 100);
    const maxProducts = parseInt(formData.get('maxProducts') as string, 10) || 0;
    const maxStaff = parseInt(formData.get('maxStaff') as string, 10) || 0;
    const maxShops = parseInt(formData.get('maxShops') as string, 10) || 1;
    const isActive = formData.get('isActive') === 'on';
    const razorpayPlanId = (formData.get('razorpayPlanId') as string)?.trim() || null;

    if (!name) return { success: false, error: 'Name is required' };

    const slug = generateSlug(name);

    await prisma.subscriptionPlan.create({
      data: { name, slug, description, priceMonthly, priceYearly, maxProducts, maxStaff, maxShops, isActive, razorpayPlanId, features: [] },
    });

    revalidatePath('/admin/plans');
    return { success: true, data: { message: 'Plan created successfully' } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create plan';
    return { success: false, error: message };
  }
}

export async function updatePlan(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await getSessionUser();
    if (!user.isSuperAdmin) return { success: false, error: 'Unauthorized' };

    const id = parseInt(formData.get('planId') as string, 10);
    const name = (formData.get('name') as string)?.trim();
    const description = (formData.get('description') as string)?.trim() || null;
    const priceMonthly = Math.round(parseFloat(formData.get('priceMonthly') as string) * 100);
    const priceYearly = Math.round(parseFloat(formData.get('priceYearly') as string) * 100);
    const maxProducts = parseInt(formData.get('maxProducts') as string, 10) || 0;
    const maxStaff = parseInt(formData.get('maxStaff') as string, 10) || 0;
    const maxShops = parseInt(formData.get('maxShops') as string, 10) || 1;
    const isActive = formData.get('isActive') === 'on';
    const razorpayPlanId = (formData.get('razorpayPlanId') as string)?.trim() || null;

    if (!id || isNaN(id) || !name) return { success: false, error: 'Plan ID and name are required' };

    await prisma.subscriptionPlan.update({
      where: { id },
      data: { name, description, priceMonthly, priceYearly, maxProducts, maxStaff, maxShops, isActive, razorpayPlanId },
    });

    revalidatePath('/admin/plans');
    return { success: true, data: { message: 'Plan updated successfully' } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update plan';
    return { success: false, error: message };
  }
}

export async function deletePlan(planId: number): Promise<ActionState> {
  try {
    const user = await getSessionUser();
    if (!user.isSuperAdmin) return { success: false, error: 'Unauthorized' };

    const subs = await prisma.subscription.count({ where: { planId } });
    if (subs > 0) return { success: false, error: 'Cannot delete a plan with active subscriptions' };

    await prisma.subscriptionPlan.delete({ where: { id: planId } });

    revalidatePath('/admin/plans');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete plan';
    return { success: false, error: message };
  }
}
