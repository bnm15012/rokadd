/**
 * End-to-end integration test for Micro-ERP
 * Tests all modules by calling Prisma operations directly and
 * verifying that entries are correctly stored in MySQL.
 */
import "dotenv/config";
import { PrismaClient } from "./src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failed++;
  }
}

async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  MICRO-ERP END-TO-END INTEGRATION TEST SUITE    ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  // Get existing shop context
  const shop = await prisma.shop.findUnique({ where: { slug: "demo-store" } });
  if (!shop) throw new Error("Demo shop not found — run seed first");
  const shopId = shop.id;

  // Pre-clean any leftover test data from previous runs
  console.log("Cleaning leftover test data...");
  await prisma.adminAuditLog.deleteMany({ where: { shopId } });
  await prisma.dailySummary.deleteMany({ where: { shopId } });
  await prisma.subscriptionPayment.deleteMany({ where: { razorpayPaymentId: { startsWith: "pay_E2E" } } });
  // Clean e2e sales and related data
  const e2eSales = await prisma.sale.findMany({ where: { shopId, invoiceNo: { startsWith: "E2E" } } });
  for (const s of e2eSales) {
    await prisma.creditPayment.deleteMany({ where: { creditSale: { saleId: s.id } } });
    await prisma.creditSale.deleteMany({ where: { saleId: s.id } });
    await prisma.saleItem.deleteMany({ where: { saleId: s.id } });
  }
  await prisma.sale.deleteMany({ where: { shopId, invoiceNo: { startsWith: "E2E" } } });
  // Clean e2e purchases
  const e2ePurchases = await prisma.purchase.findMany({ where: { shopId, billNumber: { startsWith: "E2E" } } });
  for (const pur of e2ePurchases) {
    await prisma.vendorPayment.deleteMany({ where: { purchaseId: pur.id } });
    await prisma.purchaseItem.deleteMany({ where: { purchaseId: pur.id } });
  }
  await prisma.purchase.deleteMany({ where: { shopId, billNumber: { startsWith: "E2E" } } });
  // Clean test products, categories, etc.
  const testProducts = await prisma.product.findMany({ where: { shopId, sku: { startsWith: "SPR" } } });
  for (const tp of testProducts) {
    await prisma.stockLog.deleteMany({ where: { productId: tp.id } });
  }
  await prisma.product.deleteMany({ where: { shopId, sku: { startsWith: "SPR" } } });
  await prisma.category.deleteMany({ where: { shopId, name: "Beverages" } });
  await prisma.vendor.deleteMany({ where: { shopId, name: "Coca-Cola Distributor" } });
  await prisma.customer.deleteMany({ where: { shopId, name: "Ramesh Gupta" } });
  await prisma.expense.deleteMany({ where: { shopId, category: { in: ["Rent", "Electricity", "Transport"] } } });
  // Clean test users/shops
  const testEmails = ["testuser@e2e.local", "manager@e2e.local", "staff@e2e.local"];
  for (const email of testEmails) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) {
      const members = await prisma.shopMember.findMany({ where: { userId: u.id } });
      for (const m of members) {
        await prisma.memberPermission.deleteMany({ where: { shopMemberId: m.id } });
      }
      await prisma.shopMember.deleteMany({ where: { userId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
    }
  }
  const e2eShop = await prisma.shop.findUnique({ where: { slug: "e2e-shop" } });
  if (e2eShop) {
    await prisma.shopMember.deleteMany({ where: { shopId: e2eShop.id } });
    await prisma.shop.delete({ where: { id: e2eShop.id } });
  }
  console.log("Pre-clean done.\n");

  // ═══════════════════════════════════════════════════════════════
  // 1. AUTHENTICATION
  // ═══════════════════════════════════════════════════════════════
  console.log("━━━ 1. AUTHENTICATION ━━━");

  // 1a. Login — verify demo user exists and password matches
  const demoUser = await prisma.user.findUnique({ where: { email: "demo@example.com" } });
  assert(!!demoUser, "Demo user exists in DB");
  const pwMatch = await bcrypt.compare("demo123", demoUser!.password);
  assert(pwMatch, "Demo user password matches");

  // 1b. Register — create a new user + shop
  const newPwd = await bcrypt.hash("NewUser@123", 12);
  const newUser = await prisma.user.create({
    data: { email: "testuser@e2e.local", password: newPwd, name: "E2E Test User" },
  });
  const newShop = await prisma.shop.create({
    data: { name: "E2E Shop", slug: "e2e-shop" },
  });
  const newMember = await prisma.shopMember.create({
    data: { userId: newUser.id, shopId: newShop.id, role: "OWNER" },
  });
  assert(!!newUser.id, "New user registered");
  assert(!!newShop.id, "New shop created for user");
  assert(newMember.role === "OWNER", "User is OWNER of their shop");

  // 1c. SuperAdmin — verify super admin exists
  const admin = await prisma.superAdmin.findFirst();
  assert(!!admin, "Super admin account exists");
  assert(admin!.email === "admin@localhost.dev", "Super admin email is correct");

  // 1d. Session structure — verify shopMembers
  const memberWithPerms = await prisma.shopMember.findFirst({
    where: { userId: demoUser!.id },
    include: { permissions: true, shop: true },
  });
  assert(!!memberWithPerms, "Demo user has shop membership");
  assert(memberWithPerms!.shop.name === "Demo Store", "Shop name is Demo Store");

  // ═══════════════════════════════════════════════════════════════
  // 2. PRODUCTS CRUD
  // ═══════════════════════════════════════════════════════════════
  console.log("\n━━━ 2. PRODUCTS CRUD ━━━");

  // 2a. Create category
  const cat = await prisma.category.create({ data: { name: "Beverages", shopId } });
  assert(!!cat.id, "Category created: Beverages");

  // 2b. Create product
  const product = await prisma.product.create({
    data: {
      name: "Sprite 500ml", sku: "SPR-500", shopId,
      categoryId: cat.id,
      piecesPerCarton: 24,
      costPricePerCarton: 24000, // ₹240
      sellingPricePerCarton: 36000, // ₹360
      sellingPricePerPiece: 1700, // ₹17
      currentStockPieces: 0,
      lowStockThreshold: 24,
    },
  });
  assert(product.name === "Sprite 500ml", "Product created with correct name");
  assert(product.piecesPerCarton === 24, "Pieces per carton = 24");
  assert(product.costPricePerCarton === 24000, "Cost price stored in paise");

  // 2c. Read products
  const allProducts = await prisma.product.findMany({ where: { shopId, isActive: true } });
  assert(allProducts.length >= 3, `Active products count: ${allProducts.length}`);

  // 2d. Update product
  await prisma.product.update({
    where: { id: product.id },
    data: { sellingPricePerPiece: 1800, name: "Sprite 500ml (Updated)" },
  });
  const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
  assert(updatedProduct!.sellingPricePerPiece === 1800, "Product price updated to ₹18/pc");
  assert(updatedProduct!.name === "Sprite 500ml (Updated)", "Product name updated");

  // 2e. Soft delete (deactivate)
  await prisma.product.update({ where: { id: product.id }, data: { isActive: false } });
  const deactivated = await prisma.product.findUnique({ where: { id: product.id } });
  assert(!deactivated!.isActive, "Product deactivated (soft delete)");

  // Reactivate for further tests
  await prisma.product.update({ where: { id: product.id }, data: { isActive: true } });

  // ═══════════════════════════════════════════════════════════════
  // 3. INVENTORY (Stock Inward, Adjustments)
  // ═══════════════════════════════════════════════════════════════
  console.log("\n━━━ 3. INVENTORY ━━━");

  // 3a. Stock inward — 10 cartons (240 pieces)
  const inwardQty = 10 * product.piecesPerCarton; // 240
  await prisma.product.update({
    where: { id: product.id },
    data: { currentStockPieces: { increment: inwardQty } },
  });
  await prisma.stockLog.create({
    data: {
      shopId, productId: product.id,
      type: "PURCHASE_INWARD", quantityPieces: inwardQty,
      note: "Inward: 10 cartons of Sprite",
    },
  });
  let p = await prisma.product.findUnique({ where: { id: product.id } });
  assert(p!.currentStockPieces === 240, `Stock after inward: ${p!.currentStockPieces} = 240`);

  // 3b. Manual adjustment (damage — remove 5 pieces)
  await prisma.product.update({
    where: { id: product.id },
    data: { currentStockPieces: { decrement: 5 } },
  });
  await prisma.stockLog.create({
    data: {
      shopId, productId: product.id,
      type: "ADJUSTMENT_REMOVE", quantityPieces: -5,
      note: "Damaged stock removed",
    },
  });
  p = await prisma.product.findUnique({ where: { id: product.id } });
  assert(p!.currentStockPieces === 235, `Stock after adjustment: ${p!.currentStockPieces} = 235`);

  // 3c. Low stock check
  assert(p!.currentStockPieces > p!.lowStockThreshold, "Stock is above low threshold");

  // ═══════════════════════════════════════════════════════════════
  // 4. SALES / POS
  // ═══════════════════════════════════════════════════════════════
  console.log("\n━━━ 4. SALES / POS ━━━");

  // 4a. Cash sale — 2 cartons + 6 pieces
  const sale1 = await prisma.$transaction(async (tx) => {
    const prod = await tx.product.findUniqueOrThrow({ where: { id: product.id } });
    const cartonsQty = 2;
    const piecesQty = 6;
    const totalPieces = cartonsQty * prod.piecesPerCarton + piecesQty; // 54
    const lineTotal = cartonsQty * prod.sellingPricePerCarton + piecesQty * prod.sellingPricePerPiece;
    // 2*36000 + 6*1800 = 72000+10800 = 82800

    const s = await tx.sale.create({
      data: {
        shopId, invoiceNo: "E2E-CASH-001", saleType: "CASH",
        totalAmount: lineTotal, discount: 0, netAmount: lineTotal,
        items: {
          create: {
            productId: prod.id, cartonsQty, piecesQty, totalPieces,
            unitPriceCarton: prod.sellingPricePerCarton,
            unitPricePiece: prod.sellingPricePerPiece,
            lineTotal,
          },
        },
      },
      include: { items: true },
    });

    await tx.product.update({
      where: { id: prod.id },
      data: { currentStockPieces: { decrement: totalPieces } },
    });
    await tx.stockLog.create({
      data: {
        shopId, productId: prod.id,
        type: "SALE_OUTWARD", quantityPieces: totalPieces,
        referenceId: s.id,
      },
    });
    return s;
  });

  assert(sale1.invoiceNo === "E2E-CASH-001", "Cash sale created");
  assert(sale1.netAmount === 82800, `Sale amount: ${sale1.netAmount} = 82800 paise (₹828)`);
  assert(sale1.items.length === 1, "Sale has 1 line item");
  assert(sale1.items[0].totalPieces === 54, "Sold 54 pieces (2 ctn + 6 pc)");

  p = await prisma.product.findUnique({ where: { id: product.id } });
  assert(p!.currentStockPieces === 181, `Stock after sale: ${p!.currentStockPieces} = 181`);

  // 4b. Sales history query
  const salesHistory = await prisma.sale.findMany({
    where: { shopId },
    orderBy: { saleDate: "desc" },
    include: { items: true },
  });
  assert(salesHistory.length >= 1, `Sales history count: ${salesHistory.length}`);

  // ═══════════════════════════════════════════════════════════════
  // 5. CUSTOMERS (KHATA) + CREDIT SALES
  // ═══════════════════════════════════════════════════════════════
  console.log("\n━━━ 5. CUSTOMER KHATA ━━━");

  // 5a. Create customer
  const customer = await prisma.customer.create({
    data: { name: "Ramesh Gupta", phone: "+91-9876543210", shopId, address: "Main Market" },
  });
  assert(!!customer.id, "Customer created: Ramesh Gupta");

  // 5b. Credit sale
  const creditSale = await prisma.$transaction(async (tx) => {
    const prod = await tx.product.findUniqueOrThrow({ where: { id: product.id } });
    const cartonsQty = 3;
    const totalPieces = cartonsQty * prod.piecesPerCarton; // 72
    const lineTotal = cartonsQty * prod.sellingPricePerCarton; // 108000

    const s = await tx.sale.create({
      data: {
        shopId, invoiceNo: "E2E-CREDIT-001", saleType: "CREDIT",
        customerId: customer.id,
        totalAmount: lineTotal, discount: 0, netAmount: lineTotal,
        items: {
          create: {
            productId: prod.id, cartonsQty, piecesQty: 0, totalPieces,
            unitPriceCarton: prod.sellingPricePerCarton,
            unitPricePiece: prod.sellingPricePerPiece,
            lineTotal,
          },
        },
      },
    });

    await tx.product.update({
      where: { id: prod.id },
      data: { currentStockPieces: { decrement: totalPieces } },
    });

    await tx.creditSale.create({
      data: {
        shopId, customerId: customer.id, saleId: s.id,
        totalAmount: lineTotal, paidAmount: 0, status: "UNPAID",
      },
    });
    return s;
  });

  assert(creditSale.saleType === "CREDIT", "Credit sale created");
  assert(creditSale.netAmount === 108000, `Credit amount: ₹1080`);
  p = await prisma.product.findUnique({ where: { id: product.id } });
  assert(p!.currentStockPieces === 109, `Stock after credit sale: ${p!.currentStockPieces} = 109`);

  // 5c. Partial credit payment
  const cs = await prisma.creditSale.findFirst({ where: { saleId: creditSale.id } });
  assert(!!cs, "Credit sale record exists");
  assert(cs!.status === "UNPAID", "Initial status: UNPAID");

  await prisma.creditPayment.create({
    data: { creditSaleId: cs!.id, amount: 50000, paymentMode: "CASH", note: "Part 1" },
  });
  await prisma.creditSale.update({
    where: { id: cs!.id },
    data: { paidAmount: 50000, status: "PARTIALLY_PAID" },
  });
  let updatedCs = await prisma.creditSale.findUnique({ where: { id: cs!.id } });
  assert(updatedCs!.status === "PARTIALLY_PAID", "Credit status: PARTIALLY_PAID");
  assert(updatedCs!.paidAmount === 50000, "Paid amount: ₹500");

  // 5d. Full payment
  await prisma.creditPayment.create({
    data: { creditSaleId: cs!.id, amount: 58000, paymentMode: "UPI", note: "Part 2 (final)" },
  });
  await prisma.creditSale.update({
    where: { id: cs!.id },
    data: { paidAmount: 108000, status: "PAID" },
  });
  updatedCs = await prisma.creditSale.findUnique({ where: { id: cs!.id } });
  assert(updatedCs!.status === "PAID", "Credit status: PAID (fully settled)");

  // 5e. Customer credit summary
  const customerCredits = await prisma.creditSale.findMany({
    where: { customerId: customer.id },
  });
  const totalOwed = customerCredits.reduce((s, c) => s + c.totalAmount - c.paidAmount, 0);
  assert(totalOwed === 0, "Customer outstanding balance: ₹0 (all paid)");

  // ═══════════════════════════════════════════════════════════════
  // 6. VENDORS + PURCHASES + PAYMENTS
  // ═══════════════════════════════════════════════════════════════
  console.log("\n━━━ 6. VENDORS + PURCHASES ━━━");

  // 6a. Create vendor
  const vendor = await prisma.vendor.create({
    data: { name: "Coca-Cola Distributor", phone: "+91-8888888888", shopId, gstin: "22AAAAA0000A1Z5" },
  });
  assert(!!vendor.id, "Vendor created");

  // 6b. Log purchase — 20 cartons at cost
  const purchase = await prisma.$transaction(async (tx) => {
    const prod = await tx.product.findUniqueOrThrow({ where: { id: product.id } });
    const cartonsQty = 20;
    const totalPieces = cartonsQty * prod.piecesPerCarton; // 480
    const lineTotal = cartonsQty * prod.costPricePerCarton; // 480000

    const pur = await tx.purchase.create({
      data: {
        shopId, vendorId: vendor.id, billNumber: "E2E-BILL-001",
        totalAmount: lineTotal, paidAmount: 0, paymentStatus: "UNPAID",
        items: {
          create: {
            productId: prod.id, cartonsQty, piecesQty: 0, totalPieces,
            costPerCarton: prod.costPricePerCarton, lineTotal,
          },
        },
      },
    });

    await tx.product.update({
      where: { id: prod.id },
      data: { currentStockPieces: { increment: totalPieces } },
    });
    await tx.stockLog.create({
      data: {
        shopId, productId: prod.id,
        type: "PURCHASE_INWARD", quantityPieces: totalPieces,
        referenceId: pur.id,
      },
    });
    return pur;
  });

  assert(purchase.totalAmount === 480000, "Purchase amount: ₹4,800");
  assert(purchase.paymentStatus === "UNPAID", "Purchase: UNPAID initially");
  p = await prisma.product.findUnique({ where: { id: product.id } });
  assert(p!.currentStockPieces === 589, `Stock after purchase: ${p!.currentStockPieces} = 589`);

  // 6c. Vendor payment — partial
  await prisma.vendorPayment.create({
    data: { purchaseId: purchase.id, shopId, amount: 200000, paymentMode: "CASH" },
  });
  await prisma.purchase.update({
    where: { id: purchase.id },
    data: { paidAmount: 200000, paymentStatus: "PARTIALLY_PAID" },
  });
  let updatedPurchase = await prisma.purchase.findUnique({ where: { id: purchase.id } });
  assert(updatedPurchase!.paymentStatus === "PARTIALLY_PAID", "Purchase: PARTIALLY_PAID");

  // 6d. Vendor payment — settle remaining
  await prisma.vendorPayment.create({
    data: { purchaseId: purchase.id, shopId, amount: 280000, paymentMode: "BANK_TRANSFER", note: "Final settlement" },
  });
  await prisma.purchase.update({
    where: { id: purchase.id },
    data: { paidAmount: 480000, paymentStatus: "PAID" },
  });
  updatedPurchase = await prisma.purchase.findUnique({ where: { id: purchase.id } });
  assert(updatedPurchase!.paymentStatus === "PAID", "Purchase: PAID (fully settled)");

  // ═══════════════════════════════════════════════════════════════
  // 7. EXPENSES
  // ═══════════════════════════════════════════════════════════════
  console.log("\n━━━ 7. EXPENSES ━━━");

  const expense1 = await prisma.expense.create({
    data: { shopId, category: "Rent", description: "Shop rent Dec", amount: 2500000 },
  });
  const expense2 = await prisma.expense.create({
    data: { shopId, category: "Electricity", description: "Bill #E123", amount: 450000 },
  });
  const expense3 = await prisma.expense.create({
    data: { shopId, category: "Transport", description: "Delivery charges", amount: 150000 },
  });
  assert(!!expense1.id, "Expense: Rent ₹25,000");
  assert(!!expense2.id, "Expense: Electricity ₹4,500");
  assert(!!expense3.id, "Expense: Transport ₹1,500");

  const expenseAgg = await prisma.expense.aggregate({
    where: { shopId, id: { in: [expense1.id, expense2.id, expense3.id] } },
    _sum: { amount: true },
    _count: true,
  });
  assert(expenseAgg._count === 3, "3 expenses recorded");
  assert(expenseAgg._sum.amount === 3100000, `Total expenses: ₹31,000`);

  // Category breakdown
  const byCategory = await prisma.expense.groupBy({
    by: ["category"],
    where: { shopId, id: { in: [expense1.id, expense2.id, expense3.id] } },
    _sum: { amount: true },
  });
  assert(byCategory.length === 3, "3 expense categories");

  // ═══════════════════════════════════════════════════════════════
  // 8. DAILY CASH FLOW + EOD SUMMARY
  // ═══════════════════════════════════════════════════════════════
  console.log("\n━━━ 8. DAILY CASH FLOW ━━━");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const cashSales = await prisma.sale.aggregate({
    where: { shopId, saleType: "CASH", saleDate: { gte: today, lt: tomorrow } },
    _sum: { netAmount: true },
  });
  const creditSalesTotal = await prisma.sale.aggregate({
    where: { shopId, saleType: "CREDIT", saleDate: { gte: today, lt: tomorrow } },
    _sum: { netAmount: true },
  });
  const vendorPayments = await prisma.vendorPayment.aggregate({
    where: { shopId, paidAt: { gte: today, lt: tomorrow } },
    _sum: { amount: true },
  });
  const expenses = await prisma.expense.aggregate({
    where: { shopId, expenseDate: { gte: today, lt: tomorrow } },
    _sum: { amount: true },
  });
  const creditCollected = await prisma.creditPayment.aggregate({
    where: { creditSale: { shopId }, paidAt: { gte: today, lt: tomorrow } },
    _sum: { amount: true },
  });

  const cashIn = (cashSales._sum.netAmount || 0) + (creditCollected._sum.amount || 0);
  const cashOut = (vendorPayments._sum.amount || 0) + (expenses._sum.amount || 0);
  const netCash = cashIn - cashOut;

  console.log(`  Cash In:  ₹${cashIn / 100} (sales: ₹${(cashSales._sum.netAmount || 0) / 100}, credit collected: ₹${(creditCollected._sum.amount || 0) / 100})`);
  console.log(`  Cash Out: ₹${cashOut / 100} (vendor: ₹${(vendorPayments._sum.amount || 0) / 100}, expenses: ₹${(expenses._sum.amount || 0) / 100})`);
  console.log(`  Net Cash: ₹${netCash / 100}`);

  assert(cashSales._sum.netAmount! > 0, "Cash sales recorded today");
  assert(creditSalesTotal._sum.netAmount! > 0, "Credit sales recorded today");

  // Finalize EOD summary
  const summary = await prisma.dailySummary.upsert({
    where: { shopId_date: { shopId, date: today } },
    update: {
      totalSalesAmount: (cashSales._sum.netAmount || 0) + (creditSalesTotal._sum.netAmount || 0),
      totalCashSales: cashSales._sum.netAmount || 0,
      totalCreditSales: creditSalesTotal._sum.netAmount || 0,
      vendorPaymentsMade: vendorPayments._sum.amount || 0,
      otherExpenses: expenses._sum.amount || 0,
      creditCollected: creditCollected._sum.amount || 0,
      netCashBalance: netCash,
      isFinalized: true,
    },
    create: {
      shopId, date: today,
      totalSalesAmount: (cashSales._sum.netAmount || 0) + (creditSalesTotal._sum.netAmount || 0),
      totalCashSales: cashSales._sum.netAmount || 0,
      totalCreditSales: creditSalesTotal._sum.netAmount || 0,
      vendorPaymentsMade: vendorPayments._sum.amount || 0,
      otherExpenses: expenses._sum.amount || 0,
      creditCollected: creditCollected._sum.amount || 0,
      netCashBalance: netCash,
      isFinalized: true,
    },
  });
  assert(summary.isFinalized, "EOD summary finalized");
  assert(summary.totalSalesAmount > 0, `Total sales in summary: ₹${summary.totalSalesAmount / 100}`);

  // ═══════════════════════════════════════════════════════════════
  // 9. STAFF MANAGEMENT + PERMISSIONS
  // ═══════════════════════════════════════════════════════════════
  console.log("\n━━━ 9. STAFF MANAGEMENT ━━━");

  // 9a. Add manager
  const mgrUser = await prisma.user.create({
    data: { email: "manager@e2e.local", password: await bcrypt.hash("Mgr@123", 12), name: "E2E Manager" },
  });
  const mgrMember = await prisma.shopMember.create({
    data: { userId: mgrUser.id, shopId, role: "MANAGER" },
  });
  const mgrPerms = await prisma.memberPermission.create({
    data: {
      shopMemberId: mgrMember.id,
      canViewDashboard: true, canViewProducts: true, canManageProducts: true,
      canViewInventory: true, canLogStockInward: true,
      canCreateSales: true, canViewSalesHistory: true,
      canViewVendors: true, canManageVendors: true,
      canViewExpenses: true, canLogExpenses: true,
      canViewCashFlow: true, canFinalizeCashFlow: false,
      canViewCustomers: true, canManageCustomers: true,
      canViewAnalytics: true, canManageStaff: true,
      canViewSettings: true,
      canViewCostPrices: true, canViewProfitMargins: true,
    },
  });
  assert(mgrMember.role === "MANAGER", "Manager created");
  assert(mgrPerms.canManageProducts, "Manager can manage products");
  assert(!mgrPerms.canFinalizeCashFlow, "Manager CANNOT finalize cash flow");

  // 9b. Add staff under manager
  const staffUser = await prisma.user.create({
    data: { email: "staff@e2e.local", password: await bcrypt.hash("Staff@123", 12), name: "E2E Staff" },
  });
  const staffMember = await prisma.shopMember.create({
    data: { userId: staffUser.id, shopId, role: "STAFF", managerId: mgrMember.id },
  });
  const staffPerms = await prisma.memberPermission.create({
    data: {
      shopMemberId: staffMember.id,
      canViewDashboard: true,
      canCreateSales: true, canViewSalesHistory: true,
      canViewProducts: true, canManageProducts: false,
      canViewCostPrices: false, canViewProfitMargins: false,
      canViewVendors: false, canManageStaff: false,
    },
  });
  assert(staffMember.managerId === mgrMember.id, "Staff is under manager");
  assert(staffPerms.canCreateSales, "Staff can create sales");
  assert(!staffPerms.canManageProducts, "Staff CANNOT manage products");
  assert(!staffPerms.canViewCostPrices, "Staff CANNOT view cost prices");

  // 9c. Toggle permission
  await prisma.memberPermission.update({
    where: { id: staffPerms.id },
    data: { canViewExpenses: true },
  });
  const updatedStaffPerms = await prisma.memberPermission.findUnique({ where: { id: staffPerms.id } });
  assert(updatedStaffPerms!.canViewExpenses, "Staff permission toggled: canViewExpenses = true");

  // 9d. Deactivate staff
  await prisma.shopMember.update({
    where: { id: staffMember.id },
    data: { isActive: false },
  });
  const deactivatedStaff = await prisma.shopMember.findUnique({ where: { id: staffMember.id } });
  assert(!deactivatedStaff!.isActive, "Staff deactivated");

  // ═══════════════════════════════════════════════════════════════
  // 10. SUPER ADMIN PORTAL
  // ═══════════════════════════════════════════════════════════════
  console.log("\n━━━ 10. SUPER ADMIN PORTAL ━━━");

  // 10a. List all tenants
  const allShops = await prisma.shop.findMany({
    include: { _count: { select: { members: true } }, subscription: { include: { plan: true } } },
  });
  assert(allShops.length >= 2, `Total shops (tenants): ${allShops.length}`);

  // 10b. Audit log
  await prisma.adminAuditLog.create({
    data: { adminId: admin!.id, shopId, action: "E2E: Viewed tenant data" },
  });
  const auditCount = await prisma.adminAuditLog.count({ where: { shopId } });
  assert(auditCount >= 1, `Audit logs for shop: ${auditCount}`);

  // 10c. Suspend/reactivate shop
  await prisma.shop.update({ where: { id: shopId }, data: { isActive: false } });
  let suspendedShop = await prisma.shop.findUnique({ where: { id: shopId } });
  assert(!suspendedShop!.isActive, "Shop suspended by admin");

  await prisma.shop.update({ where: { id: shopId }, data: { isActive: true } });
  suspendedShop = await prisma.shop.findUnique({ where: { id: shopId } });
  assert(suspendedShop!.isActive, "Shop reactivated by admin");

  // 10d. Platform stats
  const totalUsers = await prisma.user.count();
  const totalSalesAll = await prisma.sale.count();
  assert(totalUsers >= 3, `Platform users: ${totalUsers}`);
  assert(totalSalesAll >= 2, `Platform sales: ${totalSalesAll}`);

  // ═══════════════════════════════════════════════════════════════
  // 11. SUBSCRIPTION / BILLING
  // ═══════════════════════════════════════════════════════════════
  console.log("\n━━━ 11. SUBSCRIPTION / BILLING ━━━");

  // 11a. Verify plans exist
  const plans = await prisma.subscriptionPlan.findMany({ orderBy: { priceMonthly: "asc" } });
  assert(plans.length === 3, `Subscription plans: ${plans.length}`);
  assert(plans[0].name === "Starter", `Plan 1: ${plans[0].name}`);
  assert(plans[1].name === "Pro", `Plan 2: ${plans[1].name}`);
  assert(plans[2].name === "Enterprise", `Plan 3: ${plans[2].name}`);

  // 11b. Current subscription
  const sub = await prisma.subscription.findUnique({
    where: { shopId },
    include: { plan: true },
  });
  assert(!!sub, "Shop has active subscription");
  assert(sub!.status === "ACTIVE", `Subscription status: ${sub!.status}`);
  assert(sub!.plan.name === "Starter", `Current plan: ${sub!.plan.name}`);

  // 11c. Record payment
  await prisma.subscriptionPayment.create({
    data: {
      subscriptionId: sub!.id,
      amount: plans[0].priceMonthly,
      currency: "INR",
      razorpayPaymentId: "pay_E2E_test_001",
      status: "CAPTURED",
    },
  });
  const payments = await prisma.subscriptionPayment.findMany({ where: { subscriptionId: sub!.id } });
  assert(payments.length >= 1, `Subscription payments: ${payments.length}`);

  // 11d. Upgrade plan — extend subscription
  const proPlan = plans.find((p) => p.name === "Pro")!;
  const futureEnd = new Date();
  futureEnd.setDate(futureEnd.getDate() + 30);
  await prisma.subscription.update({
    where: { id: sub!.id },
    data: { planId: proPlan.id, currentPeriodEnd: futureEnd },
  });
  const upgradedSub = await prisma.subscription.findUnique({
    where: { id: sub!.id },
    include: { plan: true },
  });
  assert(upgradedSub!.plan.name === "Pro", "Plan upgraded to Pro");

  // Revert to Starter
  await prisma.subscription.update({
    where: { id: sub!.id },
    data: { planId: plans[0].id },
  });

  // ═══════════════════════════════════════════════════════════════
  // 12. STOCK AUDIT TRAIL
  // ═══════════════════════════════════════════════════════════════
  console.log("\n━━━ 12. STOCK AUDIT TRAIL ━━━");

  const stockLogs = await prisma.stockLog.findMany({
    where: { productId: product.id },
    orderBy: { createdAt: "asc" },
  });
  assert(stockLogs.length >= 4, `Stock log entries: ${stockLogs.length}`);
  const logTypes = stockLogs.map((l) => l.type);
  assert(logTypes.includes("PURCHASE_INWARD"), "Logs contain PURCHASE_INWARD");
  assert(logTypes.includes("SALE_OUTWARD"), "Logs contain SALE_OUTWARD");
  assert(logTypes.includes("ADJUSTMENT_REMOVE"), "Logs contain ADJUSTMENT_REMOVE");

  // Verify final stock is consistent
  const finalProduct = await prisma.product.findUnique({ where: { id: product.id } });
  // 0 + 240 (inward) - 5 (adjust) - 54 (sale1) - 72 (credit sale) + 480 (purchase) = 589
  assert(finalProduct!.currentStockPieces === 589, `Final stock: ${finalProduct!.currentStockPieces} = 589`);

  // ═══════════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════════
  console.log("\n━━━ CLEANUP ━━━");

  // Delete in reverse dependency order
  await prisma.subscriptionPayment.deleteMany({ where: { razorpayPaymentId: { startsWith: "pay_E2E" } } });
  await prisma.adminAuditLog.deleteMany({ where: { shopId } });
  await prisma.dailySummary.deleteMany({ where: { shopId } });
  await prisma.stockLog.deleteMany({ where: { productId: product.id } });
  await prisma.creditPayment.deleteMany({ where: { creditSale: { saleId: creditSale.id } } });
  await prisma.creditSale.deleteMany({ where: { saleId: creditSale.id } });
  await prisma.saleItem.deleteMany({ where: { sale: { shopId, invoiceNo: { startsWith: "E2E" } } } });
  await prisma.sale.deleteMany({ where: { shopId, invoiceNo: { startsWith: "E2E" } } });
  await prisma.vendorPayment.deleteMany({ where: { purchaseId: purchase.id } });
  await prisma.purchaseItem.deleteMany({ where: { purchaseId: purchase.id } });
  await prisma.purchase.deleteMany({ where: { id: purchase.id } });
  await prisma.vendor.deleteMany({ where: { id: vendor.id } });
  await prisma.expense.deleteMany({ where: { id: { in: [expense1.id, expense2.id, expense3.id] } } });
  await prisma.customer.deleteMany({ where: { id: customer.id } });
  await prisma.memberPermission.deleteMany({ where: { shopMemberId: { in: [mgrMember.id, staffMember.id] } } });
  await prisma.shopMember.deleteMany({ where: { id: { in: [mgrMember.id, staffMember.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [mgrUser.id, staffUser.id] } } });
  await prisma.product.deleteMany({ where: { id: product.id } });
  await prisma.category.deleteMany({ where: { id: cat.id } });
  // Cleanup new shop/user from registration test
  await prisma.shopMember.deleteMany({ where: { shopId: newShop.id } });
  await prisma.shop.deleteMany({ where: { id: newShop.id } });
  await prisma.user.deleteMany({ where: { id: newUser.id } });
  console.log("  All test data cleaned up");

  // ═══════════════════════════════════════════════════════════════
  // RESULTS
  // ═══════════════════════════════════════════════════════════════
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log(`║  RESULTS: ${passed} passed, ${failed} failed              ${failed === 0 ? "  ✓ ALL PASS" : "  ✗ FAILURES"}  ║`);
  console.log("╚══════════════════════════════════════════════════╝");

  if (failed > 0) process.exit(1);
}

main()
  .catch((e) => {
    console.error("\nFATAL ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
