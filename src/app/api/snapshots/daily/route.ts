import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/snapshots/daily
 *
 * Takes a snapshot of current stock levels for ALL active products
 * across ALL active shops. Called nightly by Vercel Cron.
 *
 * Auth: Vercel sends `Authorization: Bearer <CRON_SECRET>`.
 * Also accepts `x-api-key` header for manual/external cron calls.
 */
export async function GET(request: Request) {
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const apiKey = request.headers.get("x-api-key");
  const snapshotKey = process.env.SNAPSHOT_API_KEY;

  const isVercelCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isApiKey = snapshotKey && apiKey === snapshotKey;

  if (!isVercelCron && !isApiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runSnapshot();
}

// Also support POST for manual calls
export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.SNAPSHOT_API_KEY;

  if (!expectedKey || apiKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runSnapshot();
}

async function runSnapshot() {
  // Use IST (Asia/Kolkata) date to get the correct local date, then make a UTC midnight date
  const istNow = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // "YYYY-MM-DD"
  const today = new Date(istNow + "T00:00:00.000Z");

  const shops = await prisma.shop.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  let totalCreated = 0;

  for (const shop of shops) {
    const products = await prisma.product.findMany({
      where: { shopId: shop.id, isActive: true },
      select: { id: true, currentStockPieces: true, piecesPerCarton: true },
    });

    if (products.length === 0) continue;

    for (const product of products) {
      await prisma.stockSnapshot.upsert({
        where: {
          shopId_productId_date: {
            shopId: shop.id,
            productId: product.id,
            date: today,
          },
        },
        update: {
          stockPieces: product.currentStockPieces,
          piecesPerCarton: product.piecesPerCarton,
        },
        create: {
          shopId: shop.id,
          productId: product.id,
          date: today,
          stockPieces: product.currentStockPieces,
          piecesPerCarton: product.piecesPerCarton,
        },
      });
      totalCreated++;
    }
  }

  return NextResponse.json({
    success: true,
    date: today.toISOString().split("T")[0],
    shopsProcessed: shops.length,
    snapshotsUpserted: totalCreated,
  });
}
