'use server';

import { prisma } from '@/lib/prisma';
import { getRazorpay, verifyPaymentSignature } from '@/lib/razorpay';
import { getSessionUser, getPermissions } from '@/lib/permissions';

// Create a Razorpay order for plan upgrade/change
export async function createPlanOrder(planId: string) {
  const user = await getSessionUser();
  const shopId = user.shopMembers[0]?.shopId;
  if (!shopId) return { success: false, error: 'No shop found' };

  const ctx = await getPermissions(shopId);
  if (!ctx.isOwner && !ctx.isSuperAdmin) {
    return { success: false, error: 'Only owners can change plans' };
  }

  // Get the target plan
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) {
    return { success: false, error: 'Plan not found or inactive' };
  }

  // Don't allow "upgrading" to same plan
  const currentSub = await prisma.subscription.findUnique({ where: { shopId } });
  if (currentSub?.planId === planId && currentSub.status === 'ACTIVE') {
    return { success: false, error: 'You are already on this plan' };
  }

  // Free plan — just switch directly, no payment
  if (plan.priceMonthly === 0) {
    await prisma.subscription.upsert({
      where: { shopId },
      create: {
        shopId,
        planId: plan.id,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      update: {
        planId: plan.id,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelledAt: null,
      },
    });
    return { success: true, free: true };
  }

  // Create Razorpay order
  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount: plan.priceMonthly, // already in paise
    currency: 'INR',
    receipt: `sub_${shopId}_${Date.now()}`,
    notes: {
      shopId,
      planId: plan.id,
      planName: plan.name,
      userEmail: user.email,
    },
  });

  return {
    success: true,
    free: false,
    order: {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    },
    plan: {
      id: plan.id,
      name: plan.name,
    },
    key: process.env.RAZORPAY_KEY_ID,
    shopName: (await prisma.shop.findUnique({ where: { id: shopId }, select: { name: true } }))?.name ?? 'Shop',
    userEmail: user.email,
    userName: user.name,
  };
}

// Verify payment and activate subscription
export async function verifyPlanPayment(params: {
  planId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const user = await getSessionUser();
  const shopId = user.shopMembers[0]?.shopId;
  if (!shopId) return { success: false, error: 'No shop found' };

  const ctx = await getPermissions(shopId);
  if (!ctx.isOwner && !ctx.isSuperAdmin) {
    return { success: false, error: 'Only owners can change plans' };
  }

  // Verify signature
  const isValid = verifyPaymentSignature({
    orderId: params.razorpayOrderId,
    paymentId: params.razorpayPaymentId,
    signature: params.razorpaySignature,
  });

  if (!isValid) {
    return { success: false, error: 'Payment verification failed. Invalid signature.' };
  }

  // Get the plan
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: params.planId } });
  if (!plan) return { success: false, error: 'Plan not found' };

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Update subscription + record payment in a transaction
  await prisma.$transaction(async (tx) => {
    const sub = await tx.subscription.upsert({
      where: { shopId },
      create: {
        shopId,
        planId: plan.id,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      update: {
        planId: plan.id,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        trialEndsAt: null,
        cancelledAt: null,
      },
    });

    await tx.subscriptionPayment.create({
      data: {
        subscriptionId: sub.id,
        amount: plan.priceMonthly,
        currency: 'INR',
        razorpayPaymentId: params.razorpayPaymentId,
        status: 'captured',
        paidAt: now,
      },
    });
  });

  return { success: true, planName: plan.name };
}
