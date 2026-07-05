'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/permissions';
import type { ActionState } from '@/types';

export async function extendSubscription(
  subscriptionId: number,
  days: number
): Promise<ActionState> {
  try {
    const user = await getSessionUser();
    if (!user.isSuperAdmin) return { success: false, error: 'Unauthorized' };

    const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!sub) return { success: false, error: 'Subscription not found' };

    const base = sub.currentPeriodEnd ?? new Date();
    const newEnd = new Date(base);
    newEnd.setDate(newEnd.getDate() + days);

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        currentPeriodEnd: newEnd,
        status: 'ACTIVE',
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: user.id,
        shopId: sub.shopId,
        action: `Extended subscription by ${days} days (new end: ${newEnd.toISOString()})`,
      },
    });

    revalidatePath(`/admin/tenants/${sub.shopId}`);
    return { success: true, data: { newEnd: newEnd.toISOString() } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to extend subscription';
    return { success: false, error: message };
  }
}

export async function toggleShopSuspension(
  shopId: number,
  suspend: boolean
): Promise<ActionState> {
  try {
    const user = await getSessionUser();
    if (!user.isSuperAdmin) return { success: false, error: 'Unauthorized' };

    await prisma.shop.update({
      where: { id: shopId },
      data: { isActive: !suspend },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: user.id,
        shopId,
        action: suspend ? 'Suspended shop' : 'Unsuspended shop',
      },
    });

    revalidatePath(`/admin/tenants/${shopId}`);
    revalidatePath('/admin/tenants');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to toggle suspension';
    return { success: false, error: message };
  }
}
