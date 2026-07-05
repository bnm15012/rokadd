# Micro-ERP & Daily Cash Flow Analyzer — Architecture Document

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Database Schema Design](#4-database-schema-design)
5. [Multi-Tenancy & Row-Level Security](#5-multi-tenancy--row-level-security)
6. [Authentication & RBAC](#6-authentication--rbac)
7. [API Design](#7-api-design)
8. [Core Business Logic](#8-core-business-logic)
9. [Subscription & Billing](#9-subscription--billing)
10. [Frontend Architecture](#10-frontend-architecture)
11. [Deployment Strategy](#11-deployment-strategy)
12. [Security Considerations](#12-security-considerations)

---

## 1. System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        VERCEL EDGE NETWORK                       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Next.js 14 (App Router)                   │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │ │
│  │  │  React SSR    │  │  API Routes  │  │  Server Actions  │  │ │
│  │  │  (Dashboard)  │  │  /api/*      │  │  (Mutations)     │  │ │
│  │  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │ │
│  │         │                  │                    │             │ │
│  │         └──────────────────┼────────────────────┘             │ │
│  │                            │                                  │ │
│  │                   ┌────────▼────────┐                        │ │
│  │                   │   Prisma ORM    │                        │ │
│  │                   │   (Type-Safe)   │                        │ │
│  │                   └────────┬────────┘                        │ │
│  └────────────────────────────┼─────────────────────────────────┘ │
└───────────────────────────────┼──────────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │  MySQL (Self-Hosted)   │
                    │   - Row-Level Isolation│
                    │   - Your own server    │
                    └───────────────────────┘

External Services:
  ├── Razorpay (Subscription Payments)
  ├── NextAuth.js (Authentication)
  ├── Resend / Nodemailer (Email Reports)
  └── Recharts (Analytics Visualization)
```

### Key Design Principles
- **Vercel-Native:** Entire app is a single Next.js 14 project using App Router, deployed on Vercel free tier.
- **Serverless-First:** No persistent servers. All backend logic runs as Vercel Serverless Functions or Edge Functions.
- **Type-Safe End-to-End:** TypeScript throughout, Prisma for DB types, Zod for runtime validation.
- **Row-Level Tenant Isolation:** All tenant data shares one MySQL schema with `shopId` foreign keys and Prisma middleware enforcing isolation.

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js 14 (App Router) | Full-stack, SSR/SSG, API routes, deploys free on Vercel |
| **Language** | TypeScript | Type safety across frontend & backend |
| **Database** | MySQL (Self-Hosted) | Full control, no limits, your own server/VPS |
| **ORM** | Prisma | Type-safe queries, migrations, middleware for RLS |
| **Auth** | NextAuth.js v5 (Auth.js) | Credentials + OAuth, session management, role support |
| **UI Framework** | Tailwind CSS + shadcn/ui | Modern, accessible, themeable components |
| **Charts** | Recharts | React-native charting, lightweight |
| **Payments** | Razorpay | Indian market focus, subscription API |
| **Validation** | Zod | Runtime schema validation, form validation |
| **State Mgmt** | React Server Components + TanStack Query | Minimal client state, server-first approach |
| **PDF Export** | @react-pdf/renderer or jspdf | Client-side PDF generation (no server cost) |
| **Excel Export** | SheetJS (xlsx) | Client-side Excel generation |
| **Email** | Resend (free tier: 100/day) | Transactional emails, daily reports |
| **Cron Jobs** | Vercel Cron (free: 1/day) or QStash | Scheduled tasks (daily reports, subscription checks) |

---

## 3. Project Structure

```
micro-erp/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Migration files
│   └── seed.ts                # Seed data for development
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Auth pages (login, register, forgot-password)
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/       # Authenticated dashboard pages
│   │   │   ├── layout.tsx     # Dashboard shell (sidebar, header, tenant guard)
│   │   │   ├── page.tsx       # Dashboard home / overview
│   │   │   ├── products/
│   │   │   │   ├── page.tsx           # Product list
│   │   │   │   ├── new/page.tsx       # Add product
│   │   │   │   └── [id]/page.tsx      # Edit product
│   │   │   ├── inventory/
│   │   │   │   ├── page.tsx           # Current stock view
│   │   │   │   └── inward/page.tsx    # Stock inward entry
│   │   │   ├── sales/
│   │   │   │   ├── page.tsx           # Sales log / POS
│   │   │   │   └── history/page.tsx   # Sales history
│   │   │   ├── vendors/
│   │   │   │   ├── page.tsx           # Vendor list
│   │   │   │   ├── [id]/page.tsx      # Vendor ledger
│   │   │   │   └── purchases/page.tsx # Purchase entries
│   │   │   ├── expenses/
│   │   │   │   └── page.tsx           # Daily expenses
│   │   │   ├── cashflow/
│   │   │   │   └── page.tsx           # EOD Cash Flow Calculator
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx           # Customer list (Khata)
│   │   │   │   └── [id]/page.tsx      # Customer ledger
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx           # Charts & reports
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx           # Shop settings
│   │   │   │   ├── staff/page.tsx     # Staff & Manager management
│   │   │   │   ├── staff/[id]/permissions/page.tsx  # Per-user permission editor
│   │   │   │   └── billing/page.tsx   # Subscription & billing
│   │   │   └── alerts/
│   │   │       └── page.tsx           # Low stock alerts
│   │   │
│   │   ├── admin/             # Super Admin portal (god-mode)
│   │   │   ├── layout.tsx             # Super Admin auth guard
│   │   │   ├── page.tsx               # Admin dashboard (platform stats)
│   │   │   ├── tenants/page.tsx       # All shops list with status
│   │   │   ├── tenants/[shopId]/page.tsx  # Impersonate: view any shop's dashboard
│   │   │   ├── tenants/[shopId]/products/page.tsx  # View shop's products
│   │   │   ├── tenants/[shopId]/sales/page.tsx     # View shop's sales
│   │   │   ├── tenants/[shopId]/vendors/page.tsx   # View shop's vendors
│   │   │   ├── tenants/[shopId]/cashflow/page.tsx  # View shop's cash flow
│   │   │   ├── tenants/[shopId]/staff/page.tsx     # View shop's staff & permissions
│   │   │   ├── plans/page.tsx         # Subscription plans CRUD
│   │   │   └── revenue/page.tsx       # Platform revenue analytics
│   │   │
│   │   ├── api/               # API Routes
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── webhooks/
│   │   │   │   └── razorpay/route.ts  # Razorpay webhook handler
│   │   │   └── cron/
│   │   │       ├── daily-report/route.ts
│   │   │       └── subscription-check/route.ts
│   │   │
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Landing page
│   │   └── globals.css
│   │
│   ├── components/            # Reusable UI components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── dashboard/         # Dashboard-specific components
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── stat-card.tsx
│   │   ├── forms/             # Form components
│   │   │   ├── product-form.tsx
│   │   │   ├── sale-form.tsx
│   │   │   ├── purchase-form.tsx
│   │   │   └── expense-form.tsx
│   │   └── charts/            # Chart components
│   │       ├── sales-trend.tsx
│   │       ├── expense-pie.tsx
│   │       └── profit-loss-bar.tsx
│   │
│   ├── lib/                   # Shared utilities
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── razorpay.ts        # Razorpay client
│   │   ├── validators/        # Zod schemas
│   │   │   ├── product.ts
│   │   │   ├── sale.ts
│   │   │   ├── purchase.ts
│   │   │   └── expense.ts
│   │   ├── permissions.ts     # Permission checking & filtering helpers
│   │   ├── data-filter.ts     # Sensitive data redaction based on permissions
│   │   ├── env.ts             # Zod-validated environment variables
│   │   ├── audit.ts           # Super Admin audit logging
│   │   ├── utils.ts           # General utilities
│   │   ├── inventory.ts       # Inventory calculation helpers
│   │   └── cashflow.ts        # Cash flow calculation helpers
│   │
│   ├── actions/               # Server Actions
│   │   ├── products.ts
│   │   ├── sales.ts
│   │   ├── purchases.ts
│   │   ├── expenses.ts
│   │   ├── vendors.ts
│   │   ├── customers.ts
│   │   ├── inventory.ts
│   │   ├── staff.ts           # Add/remove/update members & permissions
│   │   └── subscription.ts
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── use-shop.ts        # Current shop context
│   │   └── use-permissions.ts # RBAC hook
│   │
│   └── types/                 # TypeScript type definitions
│       ├── index.ts
│       └── enums.ts
│
├── config/
│   ├── env.local.example      # Documented local dev env reference
│   └── env.prod.example       # Documented production env reference
│
├── public/                    # Static assets
├── .env.local                 # LOCAL environment (gitignored)
├── .env.production            # PROD reference (gitignored)
├── .env.example               # Template with placeholders (committed)
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── vercel.json                # Vercel deployment config
```

---

## 4. Database Schema Design

### Entity Relationship Diagram (Conceptual)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│    User       │────▶│   Shop       │◀────│  Subscription    │
│  (Auth/RBAC)  │     │  (Tenant)    │     │  (Razorpay)      │
└──────┬───────┘     └──────┬───────┘     └──────────────────┘
       │                     │
       │              ┌──────┼──────────────┬───────────────┐
       │              │      │              │               │
       │        ┌─────▼──┐ ┌─▼──────┐ ┌────▼───┐  ┌───────▼────┐
       │        │Product │ │Vendor  │ │Customer│  │  Category  │
       │        └───┬────┘ └───┬────┘ └───┬────┘  └────────────┘
       │            │          │           │
       │     ┌──────┼──────┐   │           │
       │     │      │      │   │           │
       │  ┌──▼──┐ ┌─▼───┐ │ ┌─▼────────┐ ┌▼──────────┐
       │  │Stock│ │Sale  │ │ │Purchase  │ │CreditSale │
       │  │Log  │ │Item  │ │ │Entry     │ │(Khata)    │
       │  └─────┘ └──┬───┘ │ └─┬────────┘ └───────────┘
       │             │      │   │
       │          ┌──▼──┐   │ ┌─▼──────────┐
       │          │Sale │   │ │VendorPayment│
       │          └─────┘   │ └─────────────┘
       │                    │
       │              ┌─────▼──────┐
       └──────────────▶  Expense   │
                      └────────────┘
```

### Complete Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ============================================================
// PLATFORM-LEVEL MODELS (Not tenant-scoped)
// ============================================================

model SuperAdmin {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hashed
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("super_admins")
}

model AdminAuditLog {
  id         String   @id @default(cuid())
  adminId    String   // Super Admin who accessed
  shopId     String   // Shop that was viewed
  action     String   // "viewed_dashboard", "viewed_sales", "extended_subscription"
  metadata   Json?    // Optional extra info (e.g., subscription days extended)
  accessedAt DateTime @default(now())

  @@index([adminId, accessedAt])
  @@index([shopId, accessedAt])
  @@map("admin_audit_logs")
}

model SubscriptionPlan {
  id              String   @id @default(cuid())
  name            String   // "Starter", "Pro", "Enterprise"
  slug            String   @unique
  description     String?  @db.Text
  priceMonthly    Int      // Price in smallest currency unit (paise)
  priceYearly     Int      // Yearly price in paise
  maxProducts     Int      @default(100)
  maxStaff        Int      @default(3)
  maxShops        Int      @default(1)
  features        Json     // Feature flags: { "analytics": true, "export": true, ... }
  isActive        Boolean  @default(true)
  razorpayPlanId  String?  // Linked Razorpay Plan ID
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  subscriptions Subscription[]

  @@map("subscription_plans")
}

// ============================================================
// USER & TENANT MODELS
// ============================================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String    // bcrypt hashed
  name          String
  phone         String?
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // A user can belong to multiple shops with different roles
  shopMembers ShopMember[]

  @@map("users")
}

model Shop {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique // URL-friendly identifier
  address     String?  @db.Text
  phone       String?
  gstin       String?  // GST Identification Number (India)
  currency    String   @default("INR")
  timezone    String   @default("Asia/Kolkata")
  logoUrl     String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  members        ShopMember[]
  subscription   Subscription?
  categories     Category[]
  products       Product[]
  vendors        Vendor[]
  customers      Customer[]
  sales          Sale[]
  purchases      Purchase[]
  expenses       Expense[]
  stockLogs      StockLog[]
  creditSales    CreditSale[]
  dailySummaries DailySummary[]

  @@map("shops")
}

// ============================================================
// RBAC: 3 Roles + Per-User Custom Permissions
// ============================================================
//
// OWNER   — Full access to everything. Created on shop registration.
//           Can add/remove Managers & Staff. Can control permissions for all.
//
// MANAGER — Access controlled by Owner via per-user permission toggles.
//           Can add/remove Staff under them. Can control Staff permissions
//           (but only grant permissions they themselves have).
//
// STAFF   — Access controlled by Owner or their assigned Manager.
//           Cannot manage anyone.
//
// Permission system: Each ShopMember has a linked MemberPermission record
// with boolean toggles for every screen and data-visibility flag.
// The Owner's UI shows a checklist when adding/editing a Manager or Staff.

model ShopMember {
  id          String   @id @default(cuid())
  role        Role     @default(STAFF)
  userId      String
  shopId      String
  managerId   String?  // If STAFF, the Manager who added them (null if added by Owner)
  isActive    Boolean  @default(true) // Owner/Manager can deactivate without deleting
  joinedAt    DateTime @default(now())

  user        User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  shop        Shop              @relation(fields: [shopId], references: [id], onDelete: Cascade)
  permissions MemberPermission?

  @@unique([userId, shopId])
  @@index([shopId, role])
  @@index([managerId])
  @@map("shop_members")
}

enum Role {
  OWNER    // Full access, manages everyone
  MANAGER  // Customizable access, manages Staff under them
  STAFF    // Customizable access, manages nobody
}

// Per-user permission toggles — controlled by Owner (for Managers/Staff)
// or by Manager (for Staff under them)
model MemberPermission {
  id            String @id @default(cuid())
  shopMemberId  String @unique

  // ── Screen Access (can the user see this page?) ──
  canViewDashboard     Boolean @default(true)
  canViewProducts      Boolean @default(false)
  canManageProducts    Boolean @default(false) // add/edit/delete products
  canViewInventory     Boolean @default(false)
  canLogStockInward    Boolean @default(false)
  canAdjustStock       Boolean @default(false) // manual stock corrections
  canCreateSales       Boolean @default(false)
  canViewSalesHistory  Boolean @default(false)
  canViewVendors       Boolean @default(false)
  canManageVendors     Boolean @default(false) // add/edit vendors
  canLogPurchases      Boolean @default(false)
  canMakeVendorPayments Boolean @default(false)
  canViewExpenses      Boolean @default(false)
  canLogExpenses       Boolean @default(false)
  canViewCashFlow      Boolean @default(false)
  canFinalizeCashFlow  Boolean @default(false)
  canViewCustomers     Boolean @default(false) // Khata
  canManageCustomers   Boolean @default(false) // add customers, log credit
  canCollectCreditPayments Boolean @default(false)
  canViewAnalytics     Boolean @default(false)
  canExportReports     Boolean @default(false)
  canManageStaff       Boolean @default(false) // only relevant for MANAGER role
  canViewSettings      Boolean @default(false)

  // ── Data Visibility (what sensitive data can they see?) ──
  canViewCostPrices      Boolean @default(false) // vendor cost prices
  canViewProfitMargins   Boolean @default(false) // profit/loss figures
  canViewVendorPayAmounts Boolean @default(false) // vendor payment amounts
  canViewNetCashBalance  Boolean @default(false) // daily net cash

  shopMember ShopMember @relation(fields: [shopMemberId], references: [id], onDelete: Cascade)

  @@map("member_permissions")
}

// ============================================================
// SUBSCRIPTION & BILLING
// ============================================================

model Subscription {
  id                   String             @id @default(cuid())
  shopId               String             @unique
  planId               String
  status               SubscriptionStatus @default(TRIALING)
  razorpaySubscriptionId String?          @unique
  razorpayCustomerId   String?
  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?
  trialEndsAt          DateTime?
  cancelledAt          DateTime?
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt

  shop    Shop             @relation(fields: [shopId], references: [id], onDelete: Cascade)
  plan    SubscriptionPlan @relation(fields: [planId], references: [id])
  payments SubscriptionPayment[]

  @@map("subscriptions")
}

enum SubscriptionStatus {
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELLED
  EXPIRED
}

model SubscriptionPayment {
  id                 String   @id @default(cuid())
  subscriptionId     String
  amount             Int      // in paise
  currency           String   @default("INR")
  razorpayPaymentId  String?  @unique
  status             String   // "captured", "failed", "refunded"
  paidAt             DateTime?
  createdAt          DateTime @default(now())

  subscription Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  @@map("subscription_payments")
}

// ============================================================
// PRODUCT & INVENTORY MODELS
// ============================================================

model Category {
  id     String @id @default(cuid())
  name   String
  shopId String

  shop     Shop      @relation(fields: [shopId], references: [id], onDelete: Cascade)
  products Product[]

  @@unique([shopId, name])
  @@map("categories")
}

model Product {
  id                 String  @id @default(cuid())
  name               String
  sku                String? // SKU or Barcode
  shopId             String
  categoryId         String?

  // Carton Configuration
  piecesPerCarton    Int     @default(1) // Conversion factor: 1 carton = X pieces

  // Pricing (stored in smallest currency unit - paise)
  costPricePerCarton    Int  // What we pay the vendor per carton
  sellingPricePerCarton Int  // What we charge wholesale customers per carton
  sellingPricePerPiece  Int  // What we charge retail customers per piece

  // Current Stock (always stored in PIECES — the lowest unit)
  currentStockPieces    Int  @default(0)

  // Low-stock alert threshold (in pieces)
  lowStockThreshold  Int     @default(0) // 0 = alerts disabled

  isActive           Boolean @default(true)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  shop       Shop       @relation(fields: [shopId], references: [id], onDelete: Cascade)
  category   Category?  @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  saleItems  SaleItem[]
  purchaseItems PurchaseItem[]
  stockLogs  StockLog[]

  @@unique([shopId, sku])
  @@index([shopId, isActive])
  @@index([shopId, currentStockPieces]) // For low-stock queries
  @@map("products")
}

model StockLog {
  id          String        @id @default(cuid())
  shopId      String
  productId   String
  type        StockLogType
  quantityPieces Int        // Positive for inward, negative for outward
  note        String?
  referenceId String?       // Links to Sale or Purchase ID
  createdAt   DateTime      @default(now())

  shop    Shop    @relation(fields: [shopId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([shopId, productId, createdAt])
  @@map("stock_logs")
}

enum StockLogType {
  PURCHASE_INWARD    // Stock received from vendor
  SALE_OUTWARD       // Stock sold to customer
  ADJUSTMENT_ADD     // Manual stock correction (+)
  ADJUSTMENT_REMOVE  // Manual stock correction (-)
  RETURN_INWARD      // Customer return
}

// ============================================================
// SALES MODELS
// ============================================================

model Sale {
  id          String      @id @default(cuid())
  shopId      String
  invoiceNo   String?     // Auto-generated invoice number
  customerId  String?     // Null for walk-in customers
  saleType    SaleType    @default(CASH)
  totalAmount Int         // Total in paise
  discount    Int         @default(0) // Discount in paise
  netAmount   Int         // totalAmount - discount
  note        String?
  saleDate    DateTime    @default(now())
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  shop     Shop       @relation(fields: [shopId], references: [id], onDelete: Cascade)
  customer Customer?  @relation(fields: [customerId], references: [id], onDelete: SetNull)
  items    SaleItem[]

  @@index([shopId, saleDate])
  @@map("sales")
}

enum SaleType {
  CASH
  CREDIT  // Goes to Customer Khata
}

model SaleItem {
  id          String @id @default(cuid())
  saleId      String
  productId   String

  // Quantities sold (both can be non-zero for mixed sales)
  cartonsQty  Int    @default(0)  // Number of full cartons sold
  piecesQty   Int    @default(0)  // Additional loose pieces sold
  totalPieces Int    // Computed: (cartonsQty * piecesPerCarton) + piecesQty

  // Prices at time of sale (snapshot — not affected by future price changes)
  unitPriceCarton Int // Price per carton at time of sale
  unitPricePiece  Int // Price per piece at time of sale

  // Line total = (cartonsQty * unitPriceCarton) + (piecesQty * unitPricePiece)
  lineTotal   Int

  sale    Sale    @relation(fields: [saleId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Restrict)

  @@map("sale_items")
}

// ============================================================
// VENDOR & PURCHASE MODELS
// ============================================================

model Vendor {
  id       String  @id @default(cuid())
  name     String
  phone    String?
  email    String?
  address  String?
  gstin    String?
  shopId   String

  shop      Shop       @relation(fields: [shopId], references: [id], onDelete: Cascade)
  purchases Purchase[]

  @@index([shopId])
  @@map("vendors")
}

model Purchase {
  id              String        @id @default(cuid())
  shopId          String
  vendorId        String
  billNumber      String?       // Vendor bill reference
  totalAmount     Int           // Total bill amount in paise
  paidAmount      Int           @default(0) // How much has been paid so far
  paymentStatus   PaymentStatus @default(UNPAID)
  purchaseDate    DateTime      @default(now())
  note            String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  shop     Shop           @relation(fields: [shopId], references: [id], onDelete: Cascade)
  vendor   Vendor         @relation(fields: [vendorId], references: [id], onDelete: Restrict)
  items    PurchaseItem[]
  payments VendorPayment[]

  @@index([shopId, purchaseDate])
  @@index([shopId, paymentStatus])
  @@map("purchases")
}

enum PaymentStatus {
  PAID
  PARTIALLY_PAID
  UNPAID
}

model PurchaseItem {
  id          String @id @default(cuid())
  purchaseId  String
  productId   String
  cartonsQty  Int    @default(0)
  piecesQty   Int    @default(0)
  totalPieces Int    // (cartonsQty * piecesPerCarton) + piecesQty
  costPerCarton Int  // Cost price snapshot
  lineTotal   Int    // Total cost for this line

  purchase Purchase @relation(fields: [purchaseId], references: [id], onDelete: Cascade)
  product  Product  @relation(fields: [productId], references: [id], onDelete: Restrict)

  @@map("purchase_items")
}

model VendorPayment {
  id          String   @id @default(cuid())
  purchaseId  String
  shopId      String
  amount      Int      // Payment amount in paise
  paymentMode String   @default("CASH") // CASH, BANK_TRANSFER, UPI, CHEQUE
  note        String?
  paidAt      DateTime @default(now())
  createdAt   DateTime @default(now())

  purchase Purchase @relation(fields: [purchaseId], references: [id], onDelete: Cascade)

  @@index([shopId, paidAt])
  @@map("vendor_payments")
}

// ============================================================
// CUSTOMER CREDIT (KHATA) MODELS
// ============================================================

model Customer {
  id       String  @id @default(cuid())
  name     String
  phone    String?
  email    String?
  address  String?
  shopId   String

  shop        Shop          @relation(fields: [shopId], references: [id], onDelete: Cascade)
  sales       Sale[]
  creditSales CreditSale[]

  @@index([shopId])
  @@map("customers")
}

model CreditSale {
  id           String   @id @default(cuid())
  shopId       String
  customerId   String
  saleId       String?  // Optional link to the sale record
  totalAmount  Int      // Total credit amount
  paidAmount   Int      @default(0)
  status       PaymentStatus @default(UNPAID)
  dueDate      DateTime?
  note         String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  shop     Shop     @relation(fields: [shopId], references: [id], onDelete: Cascade)
  customer Customer @relation(fields: [customerId], references: [id], onDelete: Restrict)
  payments CreditPayment[]

  @@index([shopId, status])
  @@map("credit_sales")
}

model CreditPayment {
  id           String   @id @default(cuid())
  creditSaleId String
  amount       Int
  paymentMode  String   @default("CASH")
  note         String?
  paidAt       DateTime @default(now())
  createdAt    DateTime @default(now())

  creditSale CreditSale @relation(fields: [creditSaleId], references: [id], onDelete: Cascade)

  @@map("credit_payments")
}

// ============================================================
// EXPENSE MODELS
// ============================================================

model Expense {
  id          String   @id @default(cuid())
  shopId      String
  category    String   // "Rent", "Electricity", "Staff Wages", "Tea", "Transport", etc.
  description String?
  amount      Int      // in paise
  expenseDate DateTime @default(now())
  createdAt   DateTime @default(now())

  shop Shop @relation(fields: [shopId], references: [id], onDelete: Cascade)

  @@index([shopId, expenseDate])
  @@map("expenses")
}

// ============================================================
// DAILY SUMMARY (Pre-computed EOD snapshot)
// ============================================================

model DailySummary {
  id                 String   @id @default(cuid())
  shopId             String
  date               DateTime @db.Date // The business date (MySQL DATE type)
  totalSalesAmount   Int      @default(0) // Total revenue
  totalCashSales     Int      @default(0)
  totalCreditSales   Int      @default(0)
  vendorPaymentsMade Int      @default(0) // Cash out to vendors
  otherExpenses      Int      @default(0) // Operational expenses
  netCashBalance     Int      @default(0) // Sales - VendorPayments - Expenses
  creditCollected    Int      @default(0) // Credit payments received from customers
  isFinalized        Boolean  @default(false) // Locked after EOD
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  shop Shop @relation(fields: [shopId], references: [id], onDelete: Cascade)

  @@unique([shopId, date])
  @@map("daily_summaries")
}
```

---

## 5. Multi-Tenancy & Row-Level Security

### Strategy: Application-Level RLS via Prisma Middleware

MySQL does not have native Row-Level Security like PostgreSQL. We implement tenant isolation at the **application layer** using Prisma client extensions, which works perfectly with any database.

```typescript
// src/lib/prisma.ts

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Tenant-scoped query helper
export function tenantPrisma(shopId: string) {
  return prisma.$extends({
    query: {
      $allOperations({ model, operation, args, query }) {
        // Models that are tenant-scoped (have shopId field)
        const tenantModels = [
          'Product', 'Category', 'Vendor', 'Customer', 'Sale',
          'Purchase', 'Expense', 'StockLog', 'CreditSale', 'DailySummary'
        ]

        if (model && tenantModels.includes(model)) {
          // Inject shopId filter on reads
          if (['findMany', 'findFirst', 'findUnique', 'count', 'aggregate'].includes(operation)) {
            args.where = { ...args.where, shopId }
          }
          // Inject shopId on creates
          if (['create', 'createMany'].includes(operation)) {
            if (Array.isArray(args.data)) {
              args.data = args.data.map(d => ({ ...d, shopId }))
            } else {
              args.data = { ...args.data, shopId }
            }
          }
          // Scope updates and deletes
          if (['update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
            args.where = { ...args.where, shopId }
          }
        }

        return query(args)
      }
    }
  })
}
```

### Usage in Server Actions / API Routes

```typescript
// src/actions/products.ts
import { tenantPrisma } from '@/lib/prisma'
import { getCurrentShopId } from '@/lib/auth'

export async function getProducts() {
  const shopId = await getCurrentShopId()
  const db = tenantPrisma(shopId)

  return db.product.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: { name: 'asc' }
  })
}
```

---

## 6. Authentication & RBAC

### Authentication Flow

```
┌───────────────┐    ┌──────────────┐    ┌───────────────┐
│  Signup/Login │───▶│  NextAuth.js │───▶│  Credentials  │
│  Page         │    │  /api/auth   │    │  Provider     │
└───────────────┘    └──────┬───────┘    └───────┬───────┘
                            │                     │
                            │              ┌──────▼───────┐
                            │              │ Verify bcrypt │
                            │              │ against DB    │
                            │              └──────┬───────┘
                            │                     │
                            ▼                     ▼
                     ┌──────────────┐    ┌────────────────┐
                     │ JWT Session  │    │ Return User +  │
                     │ (Edge-ready) │◀───│ Shop + Role +  │
                     └──────────────┘    │ Permissions    │
                                         └────────────────┘
```

### Signup Flow

1. **New user registers** → Creates `User` + `Shop` + `ShopMember(role=OWNER)` in one transaction
2. Owner gets **all permissions by default** (no `MemberPermission` row needed — Owner bypasses checks)
3. Owner invites Manager/Staff from Settings → Staff Management page

### Invite Flow (Owner adds Manager/Staff)

```
Owner clicks "Add Staff" → Enters email + name + role (MANAGER/STAFF)
  ├── If email exists in Users table → Link existing user to this shop
  └── If new email → Create User with temporary password, send invite email

Then Owner sees the Permission Checklist UI:
┌─────────────────────────────────────────────────┐
│  Edit Permissions: Rahul (Manager)               │
│                                                   │
│  SCREEN ACCESS                                    │
│  ☑ Dashboard                                     │
│  ☑ Products (View)                               │
│  ☑ Products (Add/Edit/Delete)                    │
│  ☑ Inventory (View Stock)                        │
│  ☑ Inventory (Log Stock Inward)                  │
│  ☐ Inventory (Adjust Stock)                      │
│  ☑ Sales (Create Sales)                          │
│  ☑ Sales (View History)                          │
│  ☐ Vendors (View)                                │
│  ☐ Vendors (Add Purchases)                       │
│  ☐ Vendors (Make Payments)                       │
│  ☐ Expenses (View / Log)                         │
│  ☐ Cash Flow (View / Finalize)                   │
│  ☑ Customers / Khata (View)                      │
│  ☑ Customers / Khata (Manage)                    │
│  ☐ Analytics                                     │
│  ☐ Export Reports                                │
│  ☑ Manage Staff (add/remove Staff under them)    │
│                                                   │
│  DATA VISIBILITY                                  │
│  ☐ View cost prices (vendor costs)               │
│  ☐ View profit margins                           │
│  ☐ View vendor payment amounts                   │
│  ☐ View daily net cash balance                   │
│                                                   │
│  [ Save Permissions ]                             │
└─────────────────────────────────────────────────┘
```

### Manager → Staff Hierarchy

```
                    ┌─────────┐
                    │  OWNER  │  (Full access, manages everyone)
                    └────┬────┘
                         │
              ┌──────────┼──────────┐
              │                     │
        ┌─────▼─────┐        ┌─────▼─────┐
        │ MANAGER A │        │ MANAGER B │  (Custom access per Owner config)
        └─────┬─────┘        └─────┬─────┘
              │                     │
        ┌─────┼─────┐         ┌────┼────┐
        │     │     │         │         │
     ┌──▼─┐┌─▼──┐┌─▼──┐  ┌──▼─┐    ┌──▼─┐
     │Staff││Staff││Staff│  │Staff│    │Staff│
     └────┘└────┘└────┘  └────┘    └────┘

Rules:
  • Owner can see/manage ALL Managers and Staff
  • Manager A can ONLY see/manage Staff linked to them (managerId = Manager A's ID)
  • Manager A CANNOT see Manager B or Manager B's Staff
  • Manager can only grant permissions they themselves have
  • Staff cannot manage anyone
```

### NextAuth Configuration

```typescript
// src/lib/auth.ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            shopMembers: {
              where: { isActive: true },
              include: {
                shop: true,
                permissions: true
              }
            }
          }
        })

        if (!user) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          shopMembers: user.shopMembers
        }
      }
    })
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.shopMembers = user.shopMembers
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.userId
      session.user.shopMembers = token.shopMembers
      return session
    }
  }
})
```

### Permission Checking System

```typescript
// src/lib/permissions.ts
import { auth } from './auth'
import { prisma } from './prisma'
import type { MemberPermission } from '@prisma/client'

type PermissionKey = keyof Omit<MemberPermission, 'id' | 'shopMemberId'>

/**
 * Get the current user's membership and permissions for a shop.
 * Owners bypass all permission checks.
 */
export async function getPermissions(shopId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const member = await prisma.shopMember.findUnique({
    where: { userId_shopId: { userId: session.user.id, shopId } },
    include: { permissions: true }
  })

  if (!member || !member.isActive) throw new Error('Not a member of this shop')

  return {
    userId: session.user.id,
    shopId,
    role: member.role,
    memberId: member.id,
    managerId: member.managerId,
    // Owner has ALL permissions implicitly
    isOwner: member.role === 'OWNER',
    permissions: member.permissions
  }
}

/**
 * Guard: require a specific permission before executing an action.
 * Owners always pass. Managers/Staff checked against their MemberPermission.
 */
export async function requirePermission(shopId: string, permission: PermissionKey) {
  const ctx = await getPermissions(shopId)

  // Owners bypass all checks
  if (ctx.isOwner) return ctx

  // For Manager/Staff, check the specific boolean toggle
  if (!ctx.permissions || !ctx.permissions[permission]) {
    throw new Error(`Permission denied: ${permission}`)
  }

  return ctx
}

/**
 * Check if a Manager can grant a specific permission to a Staff member.
 * Rule: Managers can only grant permissions they themselves have.
 */
export function canGrantPermission(
  managerPermissions: MemberPermission,
  permissionKey: PermissionKey
): boolean {
  return managerPermissions[permissionKey] === true
}

/**
 * Get filtered sidebar navigation based on user permissions.
 * Used by the Dashboard layout to show/hide menu items.
 */
export function getVisibleNavItems(role: string, permissions: MemberPermission | null) {
  if (role === 'OWNER') return ALL_NAV_ITEMS

  return ALL_NAV_ITEMS.filter(item => {
    if (!permissions) return false
    return item.requiredPermissions.some(p => permissions[p as PermissionKey])
  })
}

const ALL_NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', requiredPermissions: ['canViewDashboard'] },
  { label: 'Products', href: '/products', requiredPermissions: ['canViewProducts'] },
  { label: 'Inventory', href: '/inventory', requiredPermissions: ['canViewInventory'] },
  { label: 'Sales', href: '/sales', requiredPermissions: ['canCreateSales', 'canViewSalesHistory'] },
  { label: 'Vendors', href: '/vendors', requiredPermissions: ['canViewVendors'] },
  { label: 'Expenses', href: '/expenses', requiredPermissions: ['canViewExpenses'] },
  { label: 'Cash Flow', href: '/cashflow', requiredPermissions: ['canViewCashFlow'] },
  { label: 'Customers', href: '/customers', requiredPermissions: ['canViewCustomers'] },
  { label: 'Analytics', href: '/analytics', requiredPermissions: ['canViewAnalytics'] },
  { label: 'Settings', href: '/settings', requiredPermissions: ['canViewSettings'] },
]
```

### Usage in Server Actions

```typescript
// src/actions/products.ts
import { requirePermission } from '@/lib/permissions'
import { tenantPrisma } from '@/lib/prisma'

export async function createProduct(shopId: string, data: ProductInput) {
  // Only users with 'canManageProducts' permission (or Owner) can do this
  await requirePermission(shopId, 'canManageProducts')
  const db = tenantPrisma(shopId)

  return db.product.create({ data: { ...data, shopId } })
}

export async function getProducts(shopId: string) {
  const ctx = await requirePermission(shopId, 'canViewProducts')
  const db = tenantPrisma(shopId)

  const products = await db.product.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: { name: 'asc' }
  })

  // If user cannot see cost prices, strip them from the response
  if (!ctx.isOwner && !ctx.permissions?.canViewCostPrices) {
    return products.map(p => ({ ...p, costPricePerCarton: undefined }))
  }

  return products
}
```

### Data Visibility Filtering

```typescript
// src/lib/data-filter.ts

/**
 * Strip sensitive financial data from responses based on user permissions.
 * This runs server-side before data reaches the client.
 */
export function filterSensitiveData<T extends Record<string, any>>(
  data: T,
  permissions: MemberPermission | null,
  isOwner: boolean
): T {
  if (isOwner) return data // Owner sees everything

  const filtered = { ...data }

  if (!permissions?.canViewCostPrices) {
    delete filtered.costPricePerCarton
    delete filtered.costPerCarton
  }

  if (!permissions?.canViewProfitMargins) {
    delete filtered.profitMargin
    delete filtered.grossProfit
  }

  if (!permissions?.canViewVendorPayAmounts) {
    delete filtered.vendorPaymentsMade
    delete filtered.paidAmount
  }

  if (!permissions?.canViewNetCashBalance) {
    delete filtered.netCashBalance
  }

  return filtered
}
```

---

## 7. API Design

### Server Actions (Primary — for mutations and form submissions)

| Action | File | Required Permission | Description |
|--------|------|---------------------|-------------|
| `createProduct` | `actions/products.ts` | `canManageProducts` | Add new product with dual-unit config |
| `updateProduct` | `actions/products.ts` | `canManageProducts` | Edit product details/pricing |
| `toggleProduct` | `actions/products.ts` | `canManageProducts` | Activate/deactivate product |
| `createSale` | `actions/sales.ts` | `canCreateSales` | Log a sale with mixed carton/piece quantities |
| `createPurchase` | `actions/purchases.ts` | `canLogPurchases` | Log vendor purchase entry |
| `makeVendorPayment` | `actions/purchases.ts` | `canMakeVendorPayments` | Record payment against a purchase bill |
| `logExpense` | `actions/expenses.ts` | `canLogExpenses` | Log daily operational expense |
| `recordStockInward` | `actions/inventory.ts` | `canLogStockInward` | Log received inventory |
| `adjustStock` | `actions/inventory.ts` | `canAdjustStock` | Manual stock correction |
| `createCustomer` | `actions/customers.ts` | `canManageCustomers` | Add customer for Khata |
| `recordCreditPayment` | `actions/customers.ts` | `canCollectCreditPayments` | Record payment from credit customer |
| `finalizeDailySummary` | `actions/cashflow.ts` | `canFinalizeCashFlow` | Lock EOD summary |
| `addShopMember` | `actions/staff.ts` | `canManageStaff` (or OWNER) | Invite new Manager/Staff |
| `updateMemberPermissions` | `actions/staff.ts` | OWNER (or Manager for their Staff) | Update permission toggles |
| `deactivateMember` | `actions/staff.ts` | `canManageStaff` (or OWNER) | Deactivate a staff member |

### API Routes (For webhooks, cron, external integrations)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/[...nextauth]` | ALL | NextAuth.js handler |
| `/api/webhooks/razorpay` | POST | Razorpay payment/subscription webhooks |
| `/api/cron/daily-report` | GET | Generate and email daily EOD report |
| `/api/cron/subscription-check` | GET | Check & restrict expired subscriptions |

### Data Fetching (Server Components — for reads)

All read operations happen directly in React Server Components using Prisma queries, avoiding unnecessary API layers:

```typescript
// src/app/(dashboard)/products/page.tsx
import { tenantPrisma } from '@/lib/prisma'
import { getCurrentShopId } from '@/lib/auth'

export default async function ProductsPage() {
  const shopId = await getCurrentShopId()
  const db = tenantPrisma(shopId)

  const products = await db.product.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: { name: 'asc' }
  })

  return <ProductList products={products} />
}
```

---

## 8. Core Business Logic

### 8.1 Inventory Calculation (Dual-Unit System)

```typescript
// src/lib/inventory.ts

/**
 * Convert pieces to human-readable carton + piece display
 */
export function formatStock(totalPieces: number, piecesPerCarton: number): string {
  if (piecesPerCarton <= 1) return `${totalPieces} Pieces`

  const cartons = Math.floor(totalPieces / piecesPerCarton)
  const remainingPieces = totalPieces % piecesPerCarton

  const parts: string[] = []
  if (cartons > 0) parts.push(`${cartons} Carton${cartons !== 1 ? 's' : ''}`)
  if (remainingPieces > 0) parts.push(`${remainingPieces} Piece${remainingPieces !== 1 ? 's' : ''}`)

  return parts.join(', ') || '0 Pieces'
}

/**
 * Convert carton + piece input to total pieces
 */
export function toTotalPieces(
  cartons: number,
  pieces: number,
  piecesPerCarton: number
): number {
  return (cartons * piecesPerCarton) + pieces
}

/**
 * Calculate sale line total with mixed units
 */
export function calculateLineTotal(
  cartonsQty: number,
  piecesQty: number,
  pricePerCarton: number,
  pricePerPiece: number
): number {
  return (cartonsQty * pricePerCarton) + (piecesQty * pricePerPiece)
}
```

### 8.2 Sale Processing

```typescript
// src/actions/sales.ts (simplified)
export async function createSale(shopId: string, data: SaleInput) {
  await requirePermission(shopId, 'canCreateSales') // Owner/Manager/Staff with this permission
  const db = tenantPrisma(shopId)

  return prisma.$transaction(async (tx) => {
    // 1. Calculate totals and validate stock
    let totalAmount = 0
    const processedItems = []

    for (const item of data.items) {
      const product = await tx.product.findUniqueOrThrow({
        where: { id: item.productId, shopId }
      })

      const totalPieces = toTotalPieces(
        item.cartonsQty,
        item.piecesQty,
        product.piecesPerCarton
      )

      if (product.currentStockPieces < totalPieces) {
        throw new Error(`Insufficient stock for ${product.name}`)
      }

      const lineTotal = calculateLineTotal(
        item.cartonsQty,
        item.piecesQty,
        product.sellingPricePerCarton,
        product.sellingPricePerPiece
      )

      totalAmount += lineTotal

      processedItems.push({
        productId: item.productId,
        cartonsQty: item.cartonsQty,
        piecesQty: item.piecesQty,
        totalPieces,
        unitPriceCarton: product.sellingPricePerCarton,
        unitPricePiece: product.sellingPricePerPiece,
        lineTotal
      })
    }

    // 2. Create sale record
    const sale = await tx.sale.create({
      data: {
        shopId,
        customerId: data.customerId || null,
        saleType: data.saleType || 'CASH',
        totalAmount,
        discount: data.discount || 0,
        netAmount: totalAmount - (data.discount || 0),
        items: { create: processedItems }
      }
    })

    // 3. Deduct stock and create stock logs
    for (const item of processedItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { currentStockPieces: { decrement: item.totalPieces } }
      })

      await tx.stockLog.create({
        data: {
          shopId,
          productId: item.productId,
          type: 'SALE_OUTWARD',
          quantityPieces: -item.totalPieces,
          referenceId: sale.id
        }
      })
    }

    // 4. If credit sale, create Khata entry
    if (data.saleType === 'CREDIT' && data.customerId) {
      await tx.creditSale.create({
        data: {
          shopId,
          customerId: data.customerId,
          saleId: sale.id,
          totalAmount: sale.netAmount,
          status: 'UNPAID'
        }
      })
    }

    return sale
  })
}
```

### 8.3 EOD Cash Flow Calculation

```typescript
// src/lib/cashflow.ts
export async function calculateDailyCashFlow(shopId: string, date: Date) {
  const db = tenantPrisma(shopId)

  const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999)

  const dateFilter = { gte: startOfDay, lte: endOfDay }

  // 1. Total Sales
  const salesAgg = await db.sale.aggregate({
    where: { shopId, saleDate: dateFilter },
    _sum: { netAmount: true }
  })
  const totalSales = salesAgg._sum.netAmount || 0

  // Cash vs Credit breakdown
  const cashSales = await db.sale.aggregate({
    where: { shopId, saleDate: dateFilter, saleType: 'CASH' },
    _sum: { netAmount: true }
  })
  const creditSales = await db.sale.aggregate({
    where: { shopId, saleDate: dateFilter, saleType: 'CREDIT' },
    _sum: { netAmount: true }
  })

  // 2. Vendor Payments Made Today
  const vendorPayments = await db.vendorPayment.aggregate({
    where: { shopId, paidAt: dateFilter },
    _sum: { amount: true }
  })
  const totalVendorPayments = vendorPayments._sum.amount || 0

  // 3. Other Expenses Today
  const expenses = await db.expense.aggregate({
    where: { shopId, expenseDate: dateFilter },
    _sum: { amount: true }
  })
  const totalExpenses = expenses._sum.amount || 0

  // 4. Credit Payments Collected Today
  const creditCollected = await db.creditPayment.aggregate({
    where: {
      creditSale: { shopId },
      paidAt: dateFilter
    },
    _sum: { amount: true }
  })
  const totalCreditCollected = creditCollected._sum.amount || 0

  // 5. Net Cash Balance
  const netCash = (cashSales._sum.netAmount || 0)
                + totalCreditCollected
                - totalVendorPayments
                - totalExpenses

  return {
    date,
    totalSalesAmount: totalSales,
    totalCashSales: cashSales._sum.netAmount || 0,
    totalCreditSales: creditSales._sum.netAmount || 0,
    vendorPaymentsMade: totalVendorPayments,
    otherExpenses: totalExpenses,
    creditCollected: totalCreditCollected,
    netCashBalance: netCash
  }
}
```

---

## 9. Subscription & Billing

### Razorpay Integration Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Billing │────▶│  Razorpay    │────▶│  Payment     │
│  Page    │     │  Checkout    │     │  Captured    │
└──────────┘     └──────────────┘     └──────┬───────┘
                                              │
                                     ┌────────▼────────┐
                                     │  Webhook fires  │
                                     │  POST /api/     │
                                     │  webhooks/      │
                                     │  razorpay       │
                                     └────────┬────────┘
                                              │
                              ┌───────────────▼────────────────┐
                              │  Update Subscription record    │
                              │  - status → ACTIVE             │
                              │  - currentPeriodEnd updated    │
                              │  - SubscriptionPayment created │
                              └────────────────────────────────┘
```

### Subscription Enforcement Middleware

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from './lib/auth'

export async function middleware(request: NextRequest) {
  // Skip public routes
  if (request.nextUrl.pathname.startsWith('/api/webhooks')) {
    return NextResponse.next()
  }

  const session = await auth()

  // Redirect unauthenticated users
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Check subscription status for dashboard routes
  if (session && request.nextUrl.pathname.startsWith('/dashboard')) {
    const shopId = getActiveShopId(session)

    // This check uses a lightweight cached query
    const isActive = await checkSubscriptionActive(shopId)

    if (!isActive) {
      return NextResponse.redirect(new URL('/billing/expired', request.url))
    }
  }

  return NextResponse.next()
}
```

### Super Admin — Dynamic Pricing

When the Super Admin updates subscription plans, the changes are written to the `subscription_plans` table and immediately reflected on the billing portal since the frontend reads plans from the DB at request time (no caching issue).

---

## 10. Frontend Architecture

### Component Hierarchy

```
RootLayout
├── (auth)/
│   ├── LoginPage
│   ├── RegisterPage (creates User + Shop + OWNER membership)
│   └── ForgotPasswordPage
│
├── (dashboard)/
│   └── DashboardLayout
│       ├── Sidebar (permission-aware — only shows pages user can access)
│       ├── Header (shop switcher, user menu, role badge, notifications)
│       │
│       ├── DashboardHome [canViewDashboard]
│       │   ├── StatCards (Today's Sales, Net Cash*, Pending Payables*, Low Stock)
│       │   │   (* hidden if canViewNetCashBalance / canViewProfitMargins = false)
│       │   ├── SalesTrendMiniChart
│       │   └── LowStockAlertList
│       │
│       ├── ProductsPage [canViewProducts]
│       │   ├── ProductTable (search, filter by category)
│       │   │   └── Cost Price column hidden if canViewCostPrices = false
│       │   ├── ProductForm [canManageProducts] (carton config, dual pricing)
│       │   └── StockBadge (displays "X Cartons, Y Pieces")
│       │
│       ├── SalesPage [canCreateSales]
│       │   ├── ProductSearch
│       │   ├── CartBuilder (mixed carton/piece qty)
│       │   ├── BillPreview (live total calculation)
│       │   └── PaymentCapture (cash/credit toggle)
│       │
│       ├── SalesHistoryPage [canViewSalesHistory]
│       │
│       ├── VendorsPage [canViewVendors]
│       │   ├── VendorList
│       │   ├── PurchaseEntryForm [canLogPurchases]
│       │   ├── VendorLedger (bills, status badges)
│       │   │   └── Payment amounts hidden if canViewVendorPayAmounts = false
│       │   └── PaymentRecordForm [canMakeVendorPayments]
│       │
│       ├── CashFlowPage [canViewCashFlow]
│       │   ├── CashFlowBreakdown
│       │   ├── NetBalanceHighlight (hidden if canViewNetCashBalance = false)
│       │   └── FinalizeButton [canFinalizeCashFlow]
│       │
│       ├── AnalyticsPage [canViewAnalytics]
│       │   ├── SalesTrendChart (Recharts Line)
│       │   ├── ExpenseDistributionChart (Recharts Pie)
│       │   ├── ProfitLossChart (hidden if canViewProfitMargins = false)
│       │   ├── DateRangePicker
│       │   └── ExportButtons [canExportReports]
│       │
│       └── SettingsPage [canViewSettings / OWNER only]
│           ├── ShopProfileForm [OWNER]
│           ├── StaffManagement [OWNER / MANAGER with canManageStaff]
│           │   ├── MemberList (Owner sees all; Manager sees own Staff)
│           │   ├── InviteMemberForm (email, name, role picker)
│           │   └── PermissionEditor (checkbox grid — the checklist UI)
│           └── BillingPortal [OWNER]
│
└── admin/ (Super Admin — separate auth, god-mode access)
    ├── AdminDashboard
    │   ├── PlatformStatCards (total shops, active subscriptions, MRR, total users)
    │   ├── SignupTrendChart
    │   └── RecentActivityFeed
    │
    ├── TenantsPage
    │   ├── ShopTable (name, owner, plan, status, subscription expiry, last active)
    │   ├── SearchBar (search by shop name, owner email, phone)
    │   └── ShopRow → click to enter "Impersonate View"
    │
    ├── TenantDetailPage (/admin/tenants/[shopId])  ← GOD MODE
    │   ├── ShopInfoCard (name, owner, address, GSTIN, subscription)
    │   ├── ImpersonationBanner ("Viewing as: ABC Store — read-only mode")
    │   ├── Tabs:
    │   │   ├── Dashboard (same as shop's dashboard, all data visible)
    │   │   ├── Products (full product list with cost prices, stock)
    │   │   ├── Sales (all sales history, invoices)
    │   │   ├── Vendors (vendor list, purchase bills, payment ledger)
    │   │   ├── Cash Flow (daily summaries, net cash)
    │   │   ├── Customers / Khata (credit ledger)
    │   │   ├── Staff (all members, their roles, their permissions)
    │   │   └── Subscription (plan, payments, can extend/cancel)
    │   └── ActionButtons:
    │       ├── Extend Subscription (add X days manually)
    │       ├── Suspend Shop (temporary block)
    │       └── Send Notification (email/in-app message to owner)
    │
    ├── PlansPage
    │   ├── PlanCards (CRUD — add/edit/delete plans)
    │   └── Changes reflect instantly on billing portal
    │
    └── RevenuePage
        ├── MRR Chart (Monthly Recurring Revenue)
        ├── SubscriptionBreakdown (per plan)
        └── PaymentHistoryTable
```

### Key UI Patterns

1. **Optimistic Updates:** Use TanStack Query + Server Actions for instant UI feedback
2. **Permission-Based Navigation:** Sidebar items filtered by `getVisibleNavItems(role, permissions)`
3. **Data Redaction:** Sensitive columns/cards hidden based on data visibility toggles
4. **Responsive Design:** Mobile-first with Tailwind; sidebar collapses to bottom nav on mobile
5. **Money Display:** All amounts stored in paise; displayed as `formatCurrency(amount / 100)`
6. **Role Badge:** Header shows "Owner", "Manager", or "Staff" badge next to user name
7. **Super Admin Banner:** When viewing a tenant's data, a red banner shows "Viewing: Shop Name — Super Admin Mode"

---

## 11. Super Admin — God-Mode & Impersonation System

### Why This Exists

As the platform owner (Super Admin), you need to:
- **Investigate issues** reported by shop owners without asking for their password
- **See exactly what they see** — their products, sales, vendors, cash flow, staff
- **Take admin actions** — extend subscriptions, suspend shops, send notifications
- **Never log in as them** — you access their data from YOUR Super Admin panel securely

### How It Works

The Super Admin does NOT impersonate the user's session. Instead, the admin panel uses the `tenantPrisma(shopId)` helper to directly query any shop's data using the admin's own authenticated session. This is safer and fully auditable.

```
┌──────────────────────────────────────────────────────────────────┐
│                    SUPER ADMIN PORTAL                             │
│                                                                   │
│  /admin/tenants                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Shop Name      │ Owner        │ Plan    │ Status │ Action │  │
│  │─────────────────┼──────────────┼─────────┼────────┼────────│  │
│  │  Rahul Store    │ rahul@x.com  │ Pro     │ Active │ [View] │  │
│  │  Kumar Traders  │ kumar@x.com  │ Starter │ Expired│ [View] │  │
│  │  Priya Mart     │ priya@x.com  │ Pro     │ Active │ [View] │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Clicking [View] → /admin/tenants/[shopId]                       │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ ⚠ SUPER ADMIN MODE — Viewing: Rahul Store (read-only)     │  │
│  │────────────────────────────────────────────────────────────│  │
│  │                                                            │  │
│  │  [Dashboard] [Products] [Sales] [Vendors] [Cash Flow]     │  │
│  │  [Customers] [Staff] [Subscription]                        │  │
│  │                                                            │  │
│  │  You see EVERYTHING this shop owner sees:                  │  │
│  │  - All products with cost prices & margins                 │  │
│  │  - All sales history with invoices                         │  │
│  │  - Vendor ledger with payment history                      │  │
│  │  - Daily cash flow summaries                               │  │
│  │  - All staff members & their permission configurations     │  │
│  │  - Subscription payment history                            │  │
│  │                                                            │  │
│  │  Admin Actions:                                            │  │
│  │  [Extend Subscription +30 days]  [Suspend Shop]            │  │
│  │  [Send Message to Owner]         [Export Shop Data]        │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Super Admin Authentication (Separate from Shop Users)

Super Admin uses the **same NextAuth system** but with a separate `isSuperAdmin` flag in the JWT. Super Admin credentials live in the `super_admins` table (not the `users` table).

```typescript
// src/lib/auth.ts — Super Admin authorize flow (within Credentials provider)

authorize: async (credentials) => {
  const { email, password } = credentials

  // 1. First check if it's a Super Admin login
  const superAdmin = await prisma.superAdmin.findUnique({ where: { email } })
  if (superAdmin) {
    const isValid = await bcrypt.compare(password, superAdmin.password)
    if (!isValid) return null
    return {
      id: superAdmin.id,
      email: superAdmin.email,
      name: superAdmin.name,
      isSuperAdmin: true,    // ← Flag stored in JWT
      shopMembers: []
    }
  }

  // 2. Otherwise, normal shop user login
  const user = await prisma.user.findUnique({
    where: { email },
    include: { shopMembers: { where: { isActive: true }, include: { shop: true, permissions: true } } }
  })
  if (!user) return null
  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) return null
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isSuperAdmin: false,
    shopMembers: user.shopMembers
  }
}
```

### Super Admin Guard Middleware

```typescript
// src/app/admin/layout.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }) {
  const session = await auth()

  if (!session?.user?.isSuperAdmin) {
    redirect('/login') // Non-admins can never access /admin/*
  }

  return (
    <div>
      <AdminSidebar />
      <div className="flex-1">
        <AdminHeader user={session.user} />
        {children}
      </div>
    </div>
  )
}
```

### Querying Any Shop's Data (Admin God-Mode)

```typescript
// src/app/admin/tenants/[shopId]/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { tenantPrisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function AdminTenantView({ params }: { params: { shopId: string } }) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) redirect('/login')

  const { shopId } = params

  // Super Admin can query ANY shop's data — no permission check needed
  const db = tenantPrisma(shopId)

  const [shop, products, recentSales, staffMembers, subscription] = await Promise.all([
    prisma.shop.findUniqueOrThrow({ where: { id: shopId } }),
    db.product.findMany({ include: { category: true } }),
    db.sale.findMany({ orderBy: { saleDate: 'desc' }, take: 50, include: { items: true } }),
    prisma.shopMember.findMany({ where: { shopId }, include: { user: true, permissions: true } }),
    prisma.subscription.findUnique({ where: { shopId }, include: { plan: true } }),
  ])

  // Super Admin sees ALL data — cost prices, margins, everything
  return <AdminTenantDashboard shop={shop} products={products} sales={recentSales} staff={staffMembers} subscription={subscription} />
}
```

### Audit Logging (Track Super Admin Access)

Every time a Super Admin views a shop's data, it's logged:

```typescript
// src/lib/audit.ts
export async function logAdminAccess(adminId: string, shopId: string, action: string) {
  await prisma.adminAuditLog.create({
    data: { adminId, shopId, action, accessedAt: new Date() }
  })
}

// Prisma schema addition:
// model AdminAuditLog {
//   id         String   @id @default(cuid())
//   adminId    String
//   shopId     String
//   action     String   // "viewed_dashboard", "viewed_sales", "extended_subscription", etc.
//   accessedAt DateTime @default(now())
//   @@index([adminId, accessedAt])
//   @@index([shopId, accessedAt])
//   @@map("admin_audit_logs")
// }
```

---

## 12. JWT Authentication — Security Hardening

### Overview

The app is **100% Next.js** — there is no separate backend server. Authentication uses **NextAuth.js v5** with **JWT strategy** (not database sessions), which is ideal for Vercel's serverless model.

### JWT Configuration

```typescript
// src/lib/auth.ts — JWT-specific config

export const { handlers, signIn, signOut, auth } = NextAuth({
  // ...providers (shown above)

  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,      // JWT expires in 8 hours (one work day)
    updateAge: 30 * 60,        // Refresh the JWT every 30 minutes on active use
  },

  jwt: {
    maxAge: 8 * 60 * 60,      // Same as session maxAge
  },

  callbacks: {
    jwt({ token, user, trigger }) {
      // On initial sign-in, populate the token
      if (user) {
        token.userId = user.id
        token.email = user.email
        token.name = user.name
        token.isSuperAdmin = user.isSuperAdmin || false
        token.shopMembers = user.shopMembers || []
      }

      // On every subsequent request, token is re-validated automatically
      // NextAuth signs the JWT with NEXTAUTH_SECRET using HS256
      return token
    },

    session({ session, token }) {
      session.user.id = token.userId as string
      session.user.email = token.email as string
      session.user.name = token.name as string
      session.user.isSuperAdmin = token.isSuperAdmin as boolean
      session.user.shopMembers = token.shopMembers as any[]
      return session
    },
  },

  pages: {
    signIn: '/login',       // Custom login page
    error: '/login',        // Redirect auth errors to login
    newUser: '/onboarding', // After first signup
  },
})
```

### How JWT Security Works in This App

```
1. User submits email + password on /login
2. NextAuth Credentials provider → bcrypt.compare() against DB
3. If valid → JWT created, signed with NEXTAUTH_SECRET (HS256)
4. JWT stored in httpOnly, secure, sameSite=lax cookie
5. Every request → middleware reads JWT from cookie, verifies signature
6. JWT contains: userId, email, isSuperAdmin, shopMembers (with roles)
7. After 8 hours → JWT expires → user must re-login
8. Every 30 min of activity → JWT is silently refreshed with a new expiry

Security properties:
  ✅ JWT is httpOnly — JavaScript cannot read it (XSS-safe)
  ✅ JWT is secure — only sent over HTTPS
  ✅ JWT is sameSite=lax — prevents CSRF on state-changing requests
  ✅ JWT is signed with NEXTAUTH_SECRET — cannot be tampered
  ✅ Password never stored in JWT — only user ID and role info
  ✅ No session table in DB — stateless, scales infinitely on Vercel
```

### Middleware — Route Protection

```typescript
// src/middleware.ts
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth  // JWT decoded automatically by NextAuth

  // Public routes — no auth needed
  const publicPaths = ['/', '/login', '/register', '/api/webhooks']
  if (publicPaths.some(p => pathname.startsWith(p))) return NextResponse.next()

  // No session → redirect to login
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // /admin/* routes → require Super Admin
  if (pathname.startsWith('/admin') && !session.user.isSuperAdmin) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Dashboard routes → require active subscription
  if (pathname.startsWith('/dashboard')) {
    // Subscription check is done in the layout (DB query),
    // not in middleware (to avoid DB calls in Edge runtime)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)']
}
```

---

## 13. Application Architecture — 100% Next.js

### Confirmation: Single Next.js Application

This entire platform is a **single Next.js 14 App Router project**. There is:
- **NO separate backend** (no Express, no NestJS, no FastAPI)
- **NO separate API server** — API routes live inside `/src/app/api/`
- **NO microservices** — everything is one deployable unit
- **NO separate frontend build** — React SSR + Client Components in one project

```
┌─────────────────────────────────────────────────┐
│                  Next.js 14                       │
│                                                   │
│   FRONTEND (React)          BACKEND (Node.js)     │
│   ─────────────────         ─────────────────     │
│   • Server Components       • Server Actions      │
│   • Client Components       • API Routes (/api/*) │
│   • Tailwind CSS            • Prisma ORM          │
│   • shadcn/ui               • NextAuth.js         │
│   • Recharts                • Zod validation      │
│                                                   │
│   Everything deploys as ONE project on Vercel     │
└─────────────────────────────────────────────────┘
```

### How Backend Logic Runs

| Pattern | When to Use | Example |
|---------|-------------|---------|
| **Server Components** | Reading data (queries) | Product list page, Dashboard stats |
| **Server Actions** | Writing data (mutations) | Create sale, Add product, Log expense |
| **API Routes** | External webhooks, cron jobs | Razorpay webhook, Daily report cron |
| **Middleware** | Auth checks, redirects | Route protection, subscription guard |

---

## 14. Environment Configuration — Local vs Production

### File Structure

```
micro-erp/
├── .env.local              # LOCAL dev — gitignored, your machine only
├── .env.production         # PROD values reference — gitignored
├── .env.example            # Template with placeholder values — committed to git
├── config/
│   ├── env.local.example   # Documented local config with comments
│   └── env.prod.example    # Documented prod config with comments
└── src/
    └── lib/
        └── env.ts          # Runtime env validation with Zod
```

### .env.local (Your local development machine)

```env
# ================================================================
# LOCAL DEVELOPMENT CONFIGURATION
# ================================================================
# Copy this to .env.local and fill in your values
# This file is gitignored — never committed

# ── Database (Local MySQL) ──
DATABASE_URL="mysql://root:password@localhost:3306/micro_erp_dev"

# ── Auth ──
NEXTAUTH_SECRET="local-dev-secret-change-in-prod"
NEXTAUTH_URL="http://localhost:3000"

# ── Razorpay (Test Mode) ──
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="test_secret_xxxxxxxxxxxxx"
RAZORPAY_WEBHOOK_SECRET="test_webhook_secret"

# ── Email (Resend — use test key or skip) ──
RESEND_API_KEY="re_test_xxxxxxxxxxxxx"
FROM_EMAIL="onboarding@resend.dev"

# ── Super Admin ──
SUPER_ADMIN_EMAIL="admin@localhost.dev"
SUPER_ADMIN_PASSWORD="admin123"

# ── App ──
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_ENV="development"
CRON_SECRET="local-cron-secret"

# ── Local overrides ──
LOG_LEVEL="debug"
SKIP_EMAIL_SENDING="true"
```

### .env.production (Vercel production — set in Vercel Dashboard)

```env
# ================================================================
# PRODUCTION CONFIGURATION (Vercel)
# ================================================================
# These values are set in Vercel Dashboard → Settings → Environment Variables
# This file is just a REFERENCE — do NOT commit actual secrets

# ── Database (Your self-hosted MySQL) ──
DATABASE_URL="mysql://erp_user:STRONG_PASSWORD@your-server-ip:3306/micro_erp_prod"

# ── Auth ──
NEXTAUTH_SECRET="<generate: openssl rand -base64 32>"
NEXTAUTH_URL="https://your-app.vercel.app"

# ── Razorpay (Live Mode) ──
RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="live_secret_xxxxxxxxxxxxx"
RAZORPAY_WEBHOOK_SECRET="live_webhook_secret"

# ── Email (Resend — production key) ──
RESEND_API_KEY="re_live_xxxxxxxxxxxxx"
FROM_EMAIL="reports@yourdomain.com"

# ── Super Admin ──
SUPER_ADMIN_EMAIL="your-real-email@domain.com"
SUPER_ADMIN_PASSWORD="<strong-password-change-after-first-login>"

# ── App ──
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
NEXT_PUBLIC_APP_ENV="production"
CRON_SECRET="<generate: openssl rand -base64 32>"

# ── Production settings ──
LOG_LEVEL="error"
SKIP_EMAIL_SENDING="false"
```

### .env.example (Committed to Git — template for other developers)

```env
# ================================================================
# ENVIRONMENT TEMPLATE — Copy to .env.local and fill in values
# ================================================================

DATABASE_URL="mysql://user:password@localhost:3306/micro_erp_dev"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
RAZORPAY_WEBHOOK_SECRET=""
RESEND_API_KEY=""
FROM_EMAIL=""
SUPER_ADMIN_EMAIL=""
SUPER_ADMIN_PASSWORD=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_ENV="development"
CRON_SECRET=""
```

### Runtime Environment Validation (Fail Fast)

```typescript
// src/lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().startsWith('mysql://'),

  // Auth
  NEXTAUTH_SECRET: z.string().min(16),
  NEXTAUTH_URL: z.string().url(),

  // Razorpay
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1),

  // Email
  RESEND_API_KEY: z.string().min(1),
  FROM_EMAIL: z.string().email(),

  // Super Admin
  SUPER_ADMIN_EMAIL: z.string().email(),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'production', 'test']),
  CRON_SECRET: z.string().min(8),

  // Optional
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  SKIP_EMAIL_SENDING: z.string().default('false'),
})

// Validate at startup — app crashes immediately if env is misconfigured
export const env = envSchema.parse(process.env)
```

### Vercel Environment Setup

```
Vercel Dashboard → your-project → Settings → Environment Variables

┌──────────────────────┬────────────────────────┬──────────┐
│ Key                   │ Value                  │ Env      │
│──────────────────────┼────────────────────────┼──────────│
│ DATABASE_URL          │ mysql://erp_user:...   │ Prod     │
│ NEXTAUTH_SECRET       │ a8f3k2...             │ Prod     │
│ RAZORPAY_KEY_ID       │ rzp_live_...          │ Prod     │
│ RAZORPAY_KEY_SECRET   │ live_secret_...       │ Prod     │
│ ...                   │ ...                    │ Prod     │
│                       │                        │          │
│ DATABASE_URL          │ mysql://root:...       │ Preview  │
│ RAZORPAY_KEY_ID       │ rzp_test_...          │ Preview  │
│ ...                   │ (test values)          │ Preview  │
└──────────────────────┴────────────────────────┴──────────┘

Vercel supports 3 environments:
  • Production — your live app
  • Preview — pull request / branch deploys (use test DB + test Razorpay)
  • Development — local dev (uses .env.local)
```

### .gitignore — What Gets Committed

```gitignore
# Environment files — NEVER commit secrets
.env
.env.local
.env.production
.env.*.local

# These ARE committed (templates only, no real values)
# .env.example
# config/env.local.example
# config/env.prod.example
```

---

## 15. Deployment Strategy

### Vercel Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/daily-report",
      "schedule": "30 18 * * *"
    },
    {
      "path": "/api/cron/subscription-check",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Free Tier Limits (What You Get)

| Service | Free Tier | Sufficient For |
|---------|-----------|----------------|
| **Vercel** | 100GB bandwidth, 100hrs serverless | ~10-20 active shops |
| **MySQL (Self-Hosted)** | Unlimited (your server) | No limits — you control storage & compute |
| **Resend** | 100 emails/day | Daily reports for ~100 shops |
| **Razorpay** | No platform fee (2% TDR on transactions) | Unlimited subscriptions |

### Local Development Workflow

```bash
# 1. Clone and install
git clone <repo-url> && cd micro-erp
npm install

# 2. Set up local config
cp .env.example .env.local
# Edit .env.local with your LOCAL MySQL credentials, test Razorpay keys, etc.

# 3. Set up local MySQL database
mysql -u root -p -e "CREATE DATABASE micro_erp_dev;"

# 4. Run Prisma migrations
npx prisma migrate dev

# 5. Seed the database (creates Super Admin + sample data)
npx prisma db seed

# 6. Start dev server
npm run dev
# → http://localhost:3000

# 7. When ready to deploy
git push origin main
# → Vercel auto-deploys from main branch
# → Vercel uses its own env variables (set in Dashboard)
```

---

## 16. Security Considerations

### Data Protection
- All passwords hashed with **bcrypt** (12 rounds)
- JWT sessions with **8-hour expiry** + **30-minute silent refresh**
- JWT stored in **httpOnly, secure, sameSite=lax** cookie — immune to XSS
- JWT signed with **HS256** using `NEXTAUTH_SECRET`
- CSRF protection via NextAuth.js built-in mechanisms
- Input sanitization via **Zod** schemas on all Server Actions
- Environment validated at startup — app crashes if misconfigured

### Tenant Isolation
- Every DB query passes through `tenantPrisma(shopId)` — no raw queries without shopId filter
- ShopId derived from authenticated session, never from client input
- Staff can only access data for shops they belong to
- Super Admin access is read-only by default, with explicit action buttons for writes

### Super Admin Security
- Super Admin uses **separate credentials table** (`super_admins`)
- Super Admin sessions have `isSuperAdmin: true` in JWT
- `/admin/*` routes protected in middleware — non-admins always redirected
- All Super Admin data access is **audit-logged** (who accessed what shop, when)
- Super Admin cannot modify shop data directly (read-only view) — only platform actions (extend subscription, suspend shop)

### API Security
- Razorpay webhooks verified with **HMAC SHA256** signature
- Cron endpoints protected with `CRON_SECRET` header
- Rate limiting via Vercel's built-in edge rate limiter
- No API keys or secrets exposed to the browser (`NEXT_PUBLIC_` prefix only for non-sensitive values)

### Financial Integrity
- All monetary amounts stored as **integers (paise)** — never floating point
- Sale and purchase items snapshot prices at transaction time
- EOD summaries can be "finalized" (locked) to prevent retroactive edits
- Stock operations wrapped in **database transactions** to prevent race conditions

---

## Next Steps

1. **Initialize the Next.js project** with the tech stack above
2. **Set up local environment** (`.env.local`, local MySQL)
3. **Set up Prisma** with the complete schema and run initial migration
4. **Implement JWT authentication** with NextAuth.js
5. **Build the dashboard shell** (layout, sidebar, header, permission-based nav)
6. **Implement product management** with dual-unit configuration
7. **Build the POS/Sales interface**
8. **Implement vendor management & purchase tracking**
9. **Build the EOD Cash Flow calculator**
10. **Add analytics charts**
11. **Integrate Razorpay** for subscription billing
12. **Build the Super Admin portal** with god-mode tenant viewing
13. **Add value-added features** (Khata, alerts, PDF reports)
14. **Deploy to Vercel** and configure production environment

---

*This architecture document serves as the blueprint for building the Micro-ERP platform. Each section provides enough detail to begin implementation immediately.*
