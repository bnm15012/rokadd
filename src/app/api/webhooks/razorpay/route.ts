import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('x-razorpay-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  try {
    const isValid = verifyWebhookSignature(body, signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const event = JSON.parse(body);
  const eventType = event.event as string;

  switch (eventType) {
    case 'payment.captured': {
      const payment = event.payload?.payment?.entity;
      if (!payment) break;

      const orderId = payment.order_id;
      const paymentId = payment.id;
      const notes = payment.notes ?? {};
      const shopId = notes.shopId;
      const planId = notes.planId;

      if (!shopId || !planId) break;

      // Check if already processed
      const existing = await prisma.subscriptionPayment.findUnique({
        where: { razorpayPaymentId: paymentId },
      });
      if (existing) break;

      const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
      if (!plan) break;

      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

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
            amount: payment.amount,
            currency: payment.currency?.toUpperCase() ?? 'INR',
            razorpayPaymentId: paymentId,
            status: 'captured',
            paidAt: now,
          },
        });
      });

      break;
    }

    case 'payment.failed': {
      const payment = event.payload?.payment?.entity;
      if (!payment) break;

      const notes = payment.notes ?? {};
      const shopId = notes.shopId;
      if (!shopId) break;

      const sub = await prisma.subscription.findUnique({ where: { shopId } });
      if (sub) {
        await prisma.subscriptionPayment.create({
          data: {
            subscriptionId: sub.id,
            amount: payment.amount ?? 0,
            currency: 'INR',
            razorpayPaymentId: payment.id,
            status: 'failed',
          },
        });
      }
      break;
    }
  }

  return NextResponse.json({ status: 'ok' });
}
