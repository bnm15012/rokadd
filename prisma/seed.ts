import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Wiping all data...");

  // Delete in dependency order
  await prisma.dailyReconItem.deleteMany();
  await prisma.dailyRecon.deleteMany();
  await prisma.dailySummary.deleteMany();
  await prisma.creditPayment.deleteMany();
  await prisma.creditSale.deleteMany();
  await prisma.vendorPayment.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.stockLog.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.memberPermission.deleteMany();
  await prisma.shopMember.deleteMany();
  await prisma.subscriptionPayment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.adminAuditLog.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.user.deleteMany();
  await prisma.superAdmin.deleteMany();

  console.log("All data deleted.\n");

  // ─── 1. Super Admin ─────────────────────────────────────
  const pwd = await bcrypt.hash("admin123", 12);
  await prisma.superAdmin.create({
    data: { email: "admin@gmail.com", password: pwd, name: "Admin" },
  });
  console.log("Super Admin: admin@gmail.com / admin123");

  // ─── 2. Subscription Plans ──────────────────────────────
  const plans = [
    {
      name: "Starter",
      slug: "starter",
      description: "Perfect for small shops just getting started",
      priceMonthly: 59900,
      priceYearly: 499900,
      maxProducts: 10,
      maxStaff: 2,
      maxShops: 1,
      features: [],
    },
    {
      name: "Pro",
      slug: "pro",
      description: "For growing businesses with multiple staff",
      priceMonthly: 99900,
      priceYearly: 999900,
      maxProducts: 50,
      maxStaff: 10,
      maxShops: 3,
      features: [],
    },
    {
      name: "Enterprise",
      slug: "enterprise",
      description: "Unlimited everything for large operations",
      priceMonthly: 199900,
      priceYearly: 1999900,
      maxProducts: 9999,
      maxStaff: 50,
      maxShops: 10,
      features: [],
    },
  ];

  for (const p of plans) {
    await prisma.subscriptionPlan.create({ data: p });
  }
  console.log("Subscription plans created.");

  // ─── 3. Owner, Shop, Manager, Staff ─────────────────────
  const userPwd = await bcrypt.hash("password123", 12);

  const owner = await prisma.user.create({
    data: {
      email: "guptastore@gmail.com",
      password: userPwd,
      name: "Rajesh Gupta",
      phone: "+91-9876543210",
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: "ramesh@gmail.com",
      password: userPwd,
      name: "Ramesh Kumar",
      phone: "+91-9876543211",
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: "mohit@gmail.com",
      password: userPwd,
      name: "Mohit Singh",
      phone: "+91-9876543212",
    },
  });

  const shop = await prisma.shop.create({
    data: {
      name: "Gupta Store",
      slug: "gupta-store",
      address: "Shop No. 12, Main Market, Sector 5, Noida",
      phone: "+91-9876543210",
    },
  });

  // Owner membership
  await prisma.shopMember.create({
    data: { userId: owner.id, shopId: shop.id, role: "OWNER" },
  });

  // Manager membership with permissions
  const managerMember = await prisma.shopMember.create({
    data: { userId: manager.id, shopId: shop.id, role: "MANAGER" },
  });
  await prisma.memberPermission.create({
    data: {
      shopMemberId: managerMember.id,
      canViewDashboard: true,
      canViewProducts: true,
      canManageProducts: true,
      canViewInventory: true,
      canLogStockInward: true,
      canAdjustStock: true,
      canCreateSales: true,
      canViewSalesHistory: true,
      canViewVendors: true,
      canManageVendors: true,
      canLogPurchases: true,
      canMakeVendorPayments: true,
      canViewExpenses: true,
      canLogExpenses: true,
      canViewCashFlow: true,
      canFinalizeCashFlow: true,
      canViewCustomers: true,
      canManageCustomers: true,
      canCollectCreditPayments: true,
      canViewAnalytics: true,
      canExportReports: true,
      canManageStaff: false,
      canViewSettings: true,
      canViewCostPrices: true,
      canViewProfitMargins: true,
      canViewVendorPayAmounts: true,
      canViewNetCashBalance: true,
    },
  });

  // Staff membership with limited permissions
  const staffMember = await prisma.shopMember.create({
    data: { userId: staff.id, shopId: shop.id, role: "STAFF" },
  });
  await prisma.memberPermission.create({
    data: {
      shopMemberId: staffMember.id,
      canViewDashboard: true,
      canViewProducts: true,
      canManageProducts: false,
      canViewInventory: true,
      canLogStockInward: false,
      canAdjustStock: false,
      canCreateSales: true,
      canViewSalesHistory: true,
      canViewVendors: false,
      canManageVendors: false,
      canLogPurchases: false,
      canMakeVendorPayments: false,
      canViewExpenses: false,
      canLogExpenses: false,
      canViewCashFlow: false,
      canFinalizeCashFlow: false,
      canViewCustomers: true,
      canManageCustomers: false,
      canCollectCreditPayments: false,
      canViewAnalytics: false,
      canExportReports: false,
      canManageStaff: false,
      canViewSettings: false,
      canViewCostPrices: false,
      canViewProfitMargins: false,
      canViewVendorPayAmounts: false,
      canViewNetCashBalance: false,
    },
  });

  // Subscription (Pro plan, active)
  const proPlan = await prisma.subscriptionPlan.findUnique({ where: { slug: "pro" } });
  await prisma.subscription.create({
    data: {
      shopId: shop.id,
      planId: proPlan!.id,
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("Owner:   guptastore@gmail.com / password123");
  console.log("Manager: ramesh@gmail.com / password123");
  console.log("Staff:   mohit@gmail.com / password123");
  console.log(`Shop:    ${shop.name} (${shop.slug})\n`);

  // ─── 4. Categories ──────────────────────────────────────
  const catBev = await prisma.category.create({ data: { name: "Beverages", shopId: shop.id } });
  const catSnacks = await prisma.category.create({ data: { name: "Snacks", shopId: shop.id } });
  const catBaby = await prisma.category.create({ data: { name: "Baby Care", shopId: shop.id } });
  const catHealth = await prisma.category.create({ data: { name: "Health & OTC", shopId: shop.id } });

  // ─── 5. Products (10 products) ──────────────────────────
  // All prices in paise. Stock reflects what's left AFTER the sales on July 3 & 4.
  // We'll set initial stock higher, then create sales that deduct.

  const productsData = [
    {
      name: "Coca Cola 250ml",
      sku: "CC-250",
      categoryId: catBev.id,
      piecesPerCarton: 24,
      costPricePerCarton: 28800,    // 288/ctn
      sellingPricePerCarton: 36000, // 360/ctn
      sellingPricePerPiece: 1500,   // 15/pc
      currentStockPieces: 200,
      lowStockThreshold: 24,
    },
    {
      name: "Pepsi 500ml",
      sku: "PP-500",
      categoryId: catBev.id,
      piecesPerCarton: 12,
      costPricePerCarton: 24000,    // 240/ctn
      sellingPricePerCarton: 30000, // 300/ctn
      sellingPricePerPiece: 2500,   // 25/pc
      currentStockPieces: 120,
      lowStockThreshold: 12,
    },
    {
      name: "Frooti 200ml",
      sku: "FR-200",
      categoryId: catBev.id,
      piecesPerCarton: 36,
      costPricePerCarton: 18000,    // 180/ctn
      sellingPricePerCarton: 25200, // 252/ctn
      sellingPricePerPiece: 700,    // 7/pc (but let's do 10)
      currentStockPieces: 180,
      lowStockThreshold: 36,
    },
    {
      name: "Thums Up 750ml",
      sku: "TU-750",
      categoryId: catBev.id,
      piecesPerCarton: 12,
      costPricePerCarton: 30000,    // 300/ctn
      sellingPricePerCarton: 42000, // 420/ctn
      sellingPricePerPiece: 3500,   // 35/pc
      currentStockPieces: 48,
      lowStockThreshold: 12,
    },
    {
      name: "Lays Classic Salted",
      sku: "LY-CS",
      categoryId: catSnacks.id,
      piecesPerCarton: 48,
      costPricePerCarton: 38400,    // 384/ctn
      sellingPricePerCarton: 48000, // 480/ctn
      sellingPricePerPiece: 1000,   // 10/pc
      currentStockPieces: 96,
      lowStockThreshold: 48,
    },
    {
      name: "Kurkure Masala Munch",
      sku: "KR-MM",
      categoryId: catSnacks.id,
      piecesPerCarton: 48,
      costPricePerCarton: 38400,    // 384/ctn
      sellingPricePerCarton: 48000, // 480/ctn
      sellingPricePerPiece: 1000,   // 10/pc
      currentStockPieces: 40,
      lowStockThreshold: 48,
    },
    {
      name: "Parle-G Biscuit",
      sku: "PG-100",
      categoryId: catSnacks.id,
      piecesPerCarton: 96,
      costPricePerCarton: 48000,    // 480/ctn
      sellingPricePerCarton: 57600, // 576/ctn
      sellingPricePerPiece: 600,    // 6/pc (but let's do 10)
      currentStockPieces: 200,
      lowStockThreshold: 96,
    },
    {
      name: "Huggies Diapers (Small)",
      sku: "HG-S",
      categoryId: catBaby.id,
      piecesPerCarton: 1,
      costPricePerCarton: 75000,    // 750/pack
      sellingPricePerCarton: 89900, // 899/pack
      sellingPricePerPiece: 89900,  // 899/pc
      currentStockPieces: 15,
      lowStockThreshold: 5,
    },
    {
      name: "ORS Electral Powder",
      sku: "ORS-EL",
      categoryId: catHealth.id,
      piecesPerCarton: 30,
      costPricePerCarton: 45000,    // 450/box
      sellingPricePerCarton: 60000, // 600/box
      sellingPricePerPiece: 2000,   // 20/sachet
      currentStockPieces: 60,
      lowStockThreshold: 10,
    },
    {
      name: "Dettol Soap 75g",
      sku: "DT-75",
      categoryId: catHealth.id,
      piecesPerCarton: 48,
      costPricePerCarton: 144000,   // 1440/ctn
      sellingPricePerCarton: 192000,// 1920/ctn
      sellingPricePerPiece: 4000,   // 40/pc
      currentStockPieces: 48,
      lowStockThreshold: 12,
    },
  ];

  const products: Record<string, any> = {};
  for (const p of productsData) {
    const created = await prisma.product.create({
      data: { ...p, shopId: shop.id },
    });
    products[p.sku] = created;
  }
  console.log("10 products created with stock.\n");

  // ─── 6. Vendors ─────────────────────────────────────────
  const vendor1 = await prisma.vendor.create({
    data: {
      name: "Sharma Distributors",
      phone: "+91-9811000001",
      email: "sharma.dist@gmail.com",
      shopId: shop.id,
    },
  });
  const vendor2 = await prisma.vendor.create({
    data: {
      name: "Metro Wholesale",
      phone: "+91-9811000002",
      shopId: shop.id,
    },
  });
  console.log("2 vendors created.");

  // ─── 7. Customers ───────────────────────────────────────
  const cust1 = await prisma.customer.create({
    data: { name: "Suresh Agarwal", phone: "+91-9999000001", shopId: shop.id },
  });
  const cust2 = await prisma.customer.create({
    data: { name: "Priya Verma", phone: "+91-9999000002", shopId: shop.id },
  });
  console.log("2 customers created.\n");

  // ─── 8. Sales on July 3rd ──────────────────────────────
  // Use current year so dates match the system clock
  const year = new Date().getFullYear();
  const july3 = new Date(`${year}-07-03T14:00:00+05:30`);
  const july3b = new Date(`${year}-07-03T16:30:00+05:30`);
  const july4 = new Date(`${year}-07-04T11:00:00+05:30`);
  const july4b = new Date(`${year}-07-04T15:00:00+05:30`);
  const july4c = new Date(`${year}-07-04T18:00:00+05:30`);

  // Helper to create a sale with items and stock logs
  async function createSale(opts: {
    date: Date;
    saleType: "CASH" | "CREDIT";
    customerId?: string;
    invoiceNo: string;
    items: { sku: string; cartonsQty: number; piecesQty: number }[];
    discount?: number;
  }) {
    let totalAmount = 0;
    const saleItems: any[] = [];

    for (const item of opts.items) {
      const product = products[item.sku];
      const totalPieces =
        item.cartonsQty * product.piecesPerCarton + item.piecesQty;
      const lineTotal =
        item.cartonsQty * product.sellingPricePerCarton +
        item.piecesQty * product.sellingPricePerPiece;
      totalAmount += lineTotal;

      saleItems.push({
        productId: product.id,
        cartonsQty: item.cartonsQty,
        piecesQty: item.piecesQty,
        totalPieces,
        unitPriceCarton: product.sellingPricePerCarton,
        unitPricePiece: product.sellingPricePerPiece,
        lineTotal,
      });
    }

    const discount = opts.discount || 0;
    const netAmount = totalAmount - discount;

    const sale = await prisma.sale.create({
      data: {
        shopId: shop.id,
        invoiceNo: opts.invoiceNo,
        customerId: opts.customerId || null,
        saleType: opts.saleType,
        totalAmount,
        discount,
        netAmount,
        saleDate: opts.date,
        items: { create: saleItems },
      },
    });

    // Deduct stock and create stock logs
    for (const item of opts.items) {
      const product = products[item.sku];
      const totalPieces =
        item.cartonsQty * product.piecesPerCarton + item.piecesQty;

      await prisma.product.update({
        where: { id: product.id },
        data: { currentStockPieces: { decrement: totalPieces } },
      });

      await prisma.stockLog.create({
        data: {
          shopId: shop.id,
          productId: product.id,
          type: "SALE_OUTWARD",
          quantityPieces: -totalPieces,
          referenceId: sale.id,
          createdAt: opts.date,
        },
      });
    }

    // If credit sale, create CreditSale entry
    if (opts.saleType === "CREDIT" && opts.customerId) {
      await prisma.creditSale.create({
        data: {
          shopId: shop.id,
          customerId: opts.customerId,
          saleId: sale.id,
          totalAmount: netAmount,
          paidAmount: 0,
          status: "UNPAID",
        },
      });
    }

    return sale;
  }

  // ── July 3rd Sales ──

  // Sale 1: Walk-in cash sale — 2 ctn Coca Cola + 10 pcs Lays
  await createSale({
    date: july3,
    saleType: "CASH",
    invoiceNo: "INV-0001",
    items: [
      { sku: "CC-250", cartonsQty: 2, piecesQty: 0 },  // 48 pcs, 720
      { sku: "LY-CS", cartonsQty: 0, piecesQty: 10 },  // 10 pcs, 100
    ],
  });

  // Sale 2: Walk-in cash sale — 5 pcs Frooti + 3 pcs ORS + 2 pcs Dettol
  await createSale({
    date: july3b,
    saleType: "CASH",
    invoiceNo: "INV-0002",
    items: [
      { sku: "FR-200", cartonsQty: 0, piecesQty: 5 },   // 35
      { sku: "ORS-EL", cartonsQty: 0, piecesQty: 3 },   // 60
      { sku: "DT-75", cartonsQty: 0, piecesQty: 2 },    // 80
    ],
  });

  // Sale 3: Credit sale to Suresh — 1 ctn Pepsi + 1 pk Huggies
  await createSale({
    date: july3b,
    saleType: "CREDIT",
    customerId: cust1.id,
    invoiceNo: "INV-0003",
    items: [
      { sku: "PP-500", cartonsQty: 1, piecesQty: 0 },   // 12 pcs, 300
      { sku: "HG-S", cartonsQty: 0, piecesQty: 1 },     // 1 pc, 899
    ],
  });

  console.log("3 sales recorded for July 3rd.");

  // ── July 4th Sales ──

  // Sale 4: Walk-in cash — 1 ctn Coca Cola + 6 pcs Pepsi + 12 pcs Kurkure
  await createSale({
    date: july4,
    saleType: "CASH",
    invoiceNo: "INV-0004",
    items: [
      { sku: "CC-250", cartonsQty: 1, piecesQty: 0 },   // 24 pcs, 360
      { sku: "PP-500", cartonsQty: 0, piecesQty: 6 },   // 6 pcs, 150
      { sku: "KR-MM", cartonsQty: 0, piecesQty: 12 },   // 12 pcs, 120
    ],
  });

  // Sale 5: Cash sale — 10 pcs Parle-G + 4 pcs Thums Up + 2 pcs ORS
  await createSale({
    date: july4b,
    saleType: "CASH",
    invoiceNo: "INV-0005",
    items: [
      { sku: "PG-100", cartonsQty: 0, piecesQty: 10 },  // 60
      { sku: "TU-750", cartonsQty: 0, piecesQty: 4 },   // 140
      { sku: "ORS-EL", cartonsQty: 0, piecesQty: 2 },   // 40
    ],
  });

  // Sale 6: Credit sale to Priya — 2 ctn Lays + 5 pcs Frooti, 50 discount
  await createSale({
    date: july4c,
    saleType: "CREDIT",
    customerId: cust2.id,
    invoiceNo: "INV-0006",
    discount: 5000, // 50 rupees discount
    items: [
      { sku: "LY-CS", cartonsQty: 2, piecesQty: 0 },   // 96 pcs, 960
      { sku: "FR-200", cartonsQty: 0, piecesQty: 5 },   // 35
    ],
  });

  console.log("3 sales recorded for July 4th.");

  // ─── 9. Expenses on July 3 & 4 ─────────────────────────
  await prisma.expense.create({
    data: {
      shopId: shop.id,
      category: "Electricity",
      description: "July electricity bill advance",
      amount: 250000, // 2500
      expenseDate: july3,
    },
  });
  await prisma.expense.create({
    data: {
      shopId: shop.id,
      category: "Transport",
      description: "Auto for stock pickup",
      amount: 30000, // 300
      expenseDate: july4,
    },
  });
  await prisma.expense.create({
    data: {
      shopId: shop.id,
      category: "Miscellaneous",
      description: "Packaging bags",
      amount: 15000, // 150
      expenseDate: july4b,
    },
  });
  console.log("3 expenses recorded.\n");

  // ─── Summary ────────────────────────────────────────────
  console.log("========================================");
  console.log("  SEED COMPLETE");
  console.log("========================================");
  console.log("");
  console.log("  Super Admin:  admin@gmail.com / admin123");
  console.log("  Owner:        guptastore@gmail.com / password123");
  console.log("  Manager:      ramesh@gmail.com / password123");
  console.log("  Staff:        mohit@gmail.com / password123");
  console.log("");
  console.log("  Shop:         Gupta Store");
  console.log("  Products:     10 (across 4 categories)");
  console.log("  Sales:        6 (3 on July 3, 3 on July 4)");
  console.log("  Expenses:     3 (July 3 & 4)");
  console.log("  Vendors:      2");
  console.log("  Customers:    2");
  console.log("========================================");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
