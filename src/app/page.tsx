import Link from "next/link";
import Navbar from "@/components/navbar";
import { HeroButtons, FeatureHighlightCta, FinalCtaButtons, PricingCtaButton } from "@/components/auth-cta-buttons";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  SVG Icon helpers (inline to avoid extra dependencies)             */
/* ------------------------------------------------------------------ */

function IconPackage({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m16.5 9.4-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function IconTrendingUp({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function IconUsers({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconShieldCheck({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconBarChart({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

function IconCreditCard({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function IconBell({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconWallet({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
    </svg>
  );
}

function IconCheck({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconArrowRight({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function IconStar({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Data                                                              */
/* ------------------------------------------------------------------ */

const features = [
  {
    icon: IconPackage,
    title: "Dual-Unit Inventory",
    desc: "Track stock in cartons and pieces simultaneously. Sell 2 cartons + 5 pieces in one go — stock updates automatically.",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
    accent: "text-blue-400",
    border: "border-t-blue-500",
  },
  {
    icon: IconWallet,
    title: "Daily Cash Flow",
    desc: "See exactly where your money went today. Cash sales minus vendor payments minus expenses equals net cash. One-click finalize.",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
    accent: "text-emerald-400",
    border: "border-t-emerald-500",
  },
  {
    icon: IconCreditCard,
    title: "Vendor Credit Ledger",
    desc: "Log purchases on credit, track unpaid bills across vendors, and record partial or full payments against specific invoices.",
    iconBg: "bg-violet-500/20",
    iconColor: "text-violet-400",
    accent: "text-violet-400",
    border: "border-t-violet-500",
  },
  {
    icon: IconUsers,
    title: "Customer Khata",
    desc: "Maintain per-customer credit accounts. See outstanding balances at a glance and collect payments with a clean ledger trail.",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
    accent: "text-amber-400",
    border: "border-t-amber-500",
  },
  {
    icon: IconBell,
    title: "Smart Low-Stock Alerts",
    desc: "Set minimum thresholds per product. Get notified the moment stock drops below the level you define.",
    iconBg: "bg-rose-500/20",
    iconColor: "text-rose-400",
    accent: "text-rose-400",
    border: "border-t-rose-500",
  },
  {
    icon: IconBarChart,
    title: "Sales Analytics",
    desc: "Visual charts for daily/weekly/monthly sales trends, top-selling products, expense breakdowns, and profit margins.",
    iconBg: "bg-cyan-500/20",
    iconColor: "text-cyan-400",
    accent: "text-cyan-400",
    border: "border-t-cyan-500",
  },
];

const steps = [
  {
    step: "01",
    title: "Create your shop",
    desc: "Sign up in 30 seconds. Enter your shop name, and you're ready to go. No credit card needed.",
  },
  {
    step: "02",
    title: "Add your products",
    desc: "Add products with carton/piece pricing, set categories, define low-stock thresholds. Import or enter manually.",
  },
  {
    step: "03",
    title: "Start selling",
    desc: "Record cash and credit sales, log purchases, track expenses, and check your daily cash flow summary every evening.",
  },
];

const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "Grocery Store Owner, Delhi",
    text: "Before Rokadd, I used notebooks to track udhar. Now my entire khata is digital. I know exactly how much each customer owes me.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "Wholesale Distributor, Mumbai",
    text: "The dual-unit tracking is a game-changer. I sell in cartons to retailers and pieces to walk-ins — Rokadd handles both perfectly.",
    rating: 5,
  },
  {
    name: "Mohammed Iqbal",
    role: "FMCG Retailer, Hyderabad",
    text: "End-of-day cash flow in one click. I finally know if my shop made money today without spending an hour on calculations.",
    rating: 5,
  },
];

// Plans are fetched from the database at render time

const stats = [
  { value: "10,000+", label: "Active shops" },
  { value: "2.5M+", label: "Sales recorded" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.8/5", label: "User rating" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default async function HomePage() {
  // Fetch active plans from database
  const dbPlans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { priceMonthly: "asc" },
    select: {
      name: true,
      slug: true,
      description: true,
      priceMonthly: true,
      priceYearly: true,
      maxProducts: true,
      maxStaff: true,
      features: true,
    },
  });

  // Transform DB plans for the pricing UI
  const plans = dbPlans.map((plan, idx) => {
    const featuresArr = Array.isArray(plan.features) ? (plan.features as string[]) : [];
    const builtFeatures = [
      `Up to ${plan.maxProducts >= 9999 ? "Unlimited" : plan.maxProducts} products`,
      `Up to ${plan.maxStaff >= 50 ? "Unlimited" : plan.maxStaff} staff members`,
      ...featuresArr,
    ];

    return {
      name: plan.name,
      price: formatCurrency(plan.priceMonthly).replace("₹", "").trim(),
      priceYearly: formatCurrency(plan.priceYearly).replace("₹", "").trim(),
      period: "/month",
      desc: plan.description || "",
      features: builtFeatures,
      cta: idx === 0 ? "Get Started" : "Start 14-Day Trial",
      highlighted: idx === 1,
    };
  });

  return (
    <div className="min-h-screen">
      {/* ── Navbar ──────────────────────────────────────────────── */}
      <Navbar />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute -bottom-20 right-0 h-[400px] w-[500px] rounded-full bg-violet-600/15 blur-3xl" />
          <div className="absolute top-1/3 left-0 h-[300px] w-[300px] rounded-full bg-cyan-500/10 blur-3xl" />
        </div>
        {/* Dot grid overlay */}
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.03]" aria-hidden="true" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        <div className="mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 sm:pb-32 sm:pt-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400" />
              </span>
              Trusted by 10,000+ Indian retailers
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Smart Inventory &{" "}
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                Cash Flow Management
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl">
              Track inventory at carton & piece levels. Manage vendor credits, customer khata,
              and daily cash flow — all from one simple dashboard built for Indian retail & wholesale businesses.
            </p>

            <HeroButtons />

            <p className="mt-5 text-sm text-slate-500">
              Start with a 14-day free trial. No credit card required.
            </p>
          </div>

          {/* Dashboard preview */}
          <div className="relative mx-auto mt-16 max-w-5xl">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-950 p-2 shadow-2xl shadow-blue-900/20 ring-1 ring-white/5">
              <div className="rounded-xl bg-slate-900 p-6 sm:p-8">
                {/* Mock dashboard header */}
                <div className="flex items-center justify-between border-b border-slate-700/50 pb-4">
                  <div>
                    <div className="text-sm text-slate-400">Today&apos;s Cash Flow</div>
                    <div className="mt-1 text-2xl font-bold text-white">+ 12,450.00</div>
                  </div>
                  <div className="flex gap-3">
                    <div className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-400">
                      Sales: 18,200
                    </div>
                    <div className="rounded-lg bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400">
                      Expenses: 5,750
                    </div>
                  </div>
                </div>
                {/* Mock chart bars */}
                <div className="mt-6 flex items-end justify-between gap-2">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                    <div key={i} className="flex-1">
                      <div
                        className="rounded-t-sm bg-gradient-to-t from-blue-600 to-blue-400 transition-all"
                        style={{ height: `${h}px` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-between text-xs text-slate-500">
                  <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span>
                  <span>May</span><span>Jun</span><span>Jul</span><span>Aug</span>
                  <span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
                </div>
              </div>
            </div>
            {/* Floating glow */}
            <div className="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-r from-blue-500/20 via-violet-500/15 to-blue-500/20 blur-2xl" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* ── Social proof stats ──────────────────────────────────── */}
      <section className="bg-slate-800 border-y border-slate-700/50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-extrabold text-white">{s.value}</div>
              <div className="mt-1 text-sm font-medium text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section id="features" className="relative scroll-mt-20 bg-gradient-to-b from-slate-800 to-slate-900 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
              Everything you need
            </p>
            <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
              Built for how Indian shops actually work
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              From kirana stores to wholesale distributors — features designed for real-world
              retail operations, not generic ERP complexity.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className={`group relative rounded-2xl border border-t-2 border-slate-700/50 ${f.border} bg-slate-800/60 p-8 transition hover:bg-slate-800 hover:border-slate-600 hover:-translate-y-1`}
              >
                <div className={`inline-flex rounded-xl p-3 ${f.iconBg} ${f.iconColor}`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────── */}
      <section id="how-it-works" className="relative scroll-mt-20 bg-gradient-to-b from-blue-950 to-slate-900 py-20 sm:py-28">
        {/* Dot grid overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" aria-hidden="true" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
              Simple setup
            </p>
            <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
              Up and running in 3 minutes
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              No training needed. If you can use WhatsApp, you can use Rokadd.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-3">
            {steps.map((s, idx) => (
              <div key={s.step} className="relative text-center">
                {/* Connector line */}
                {idx < steps.length - 1 && (
                  <div className="pointer-events-none absolute left-[calc(50%+40px)] top-8 hidden h-px w-[calc(100%-80px)] bg-gradient-to-r from-blue-500/50 to-blue-500/10 md:block" aria-hidden="true" />
                )}
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/15 border border-blue-500/30 text-xl font-bold text-blue-400 shadow-lg shadow-blue-500/10">
                  {s.step}
                </div>
                <h3 className="text-lg font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature highlight ───────────────────────────────────── */}
      <section className="relative py-20 sm:py-28 bg-gradient-to-b from-slate-800 to-slate-900 overflow-hidden">
        {/* Subtle background accent */}
        <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-3xl" aria-hidden="true" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Left: Text */}
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
                Complete visibility
              </p>
              <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
                Know exactly where every rupee goes
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-400">
                Rokadd gives you a clear picture of your business health.
                No accounting degree required.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Real-time stock levels across all products",
                  "Pending vendor payments at a glance",
                  "Customer-wise credit outstanding",
                  "Day-end P&L without spreadsheets",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                      <IconCheck className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-base text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
              <FeatureHighlightCta />
            </div>

            {/* Right: Mock UI cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-700/50 bg-slate-800/80 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <IconTrendingUp className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-medium text-slate-400">Today&apos;s Sales</div>
                </div>
                <div className="mt-3 text-2xl font-bold text-white">18,240</div>
                <div className="mt-1 text-sm text-emerald-400">+12.5% vs yesterday</div>
              </div>

              <div className="rounded-2xl border border-slate-700/50 bg-slate-800/80 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                    <IconPackage className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-medium text-slate-400">Low Stock</div>
                </div>
                <div className="mt-3 text-2xl font-bold text-white">3 items</div>
                <div className="mt-1 text-sm text-amber-400">Need reorder</div>
              </div>

              <div className="rounded-2xl border border-slate-700/50 bg-slate-800/80 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                    <IconUsers className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-medium text-slate-400">Credit Outstanding</div>
                </div>
                <div className="mt-3 text-2xl font-bold text-white">42,800</div>
                <div className="mt-1 text-sm text-slate-500">Across 8 customers</div>
              </div>

              <div className="rounded-2xl border border-slate-700/50 bg-slate-800/80 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                    <IconShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-medium text-slate-400">Vendor Dues</div>
                </div>
                <div className="mt-3 text-2xl font-bold text-white">1,25,600</div>
                <div className="mt-1 text-sm text-red-400">2 overdue</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────── */}
      <section id="pricing" className="relative scroll-mt-20 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 py-24 sm:py-32 overflow-hidden">
        {/* Decorative blurs */}
        <div className="pointer-events-none absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-40 bottom-20 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" aria-hidden="true" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-sm font-semibold text-blue-400 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              Pricing
            </div>
            <h2 className="text-3xl font-extrabold text-white sm:text-5xl tracking-tight">
              Plans that grow with you
            </h2>
            <p className="mt-5 text-lg text-slate-400 leading-relaxed">
              Start free, upgrade when you need more. No hidden fees, cancel anytime.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-3 items-stretch">
            {plans.map((plan, planIdx) => (
              <div
                key={plan.name}
                className={`group relative flex flex-col rounded-3xl transition-all duration-300 ${
                  plan.highlighted
                    ? "bg-gradient-to-b from-blue-600 to-indigo-700 p-[1px] shadow-2xl shadow-blue-500/20 lg:scale-105 lg:-my-4 z-10"
                    : "bg-gradient-to-b from-slate-600/50 to-slate-700/50 p-[1px] hover:from-slate-500/50 hover:to-slate-600/50 hover:shadow-xl hover:shadow-slate-500/5"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-1.5 text-xs font-bold text-white uppercase tracking-wider shadow-lg shadow-blue-500/30">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      Most Popular
                    </div>
                  </div>
                )}

                <div className={`flex flex-col rounded-[calc(1.5rem-1px)] p-8 h-full ${
                  plan.highlighted
                    ? "bg-gradient-to-b from-slate-800 to-slate-900"
                    : "bg-slate-800/80 group-hover:bg-slate-800"
                }`}>
                  {/* Plan name & description */}
                  <div>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        planIdx === 0
                          ? "bg-emerald-500/15 text-emerald-400"
                          : plan.highlighted
                          ? "bg-blue-500/15 text-blue-400"
                          : "bg-violet-500/15 text-violet-400"
                      }`}>
                        {planIdx === 0 ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12 3v18M8 7l4-4 4 4" /></svg>
                        ) : plan.highlighted ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="m3 11 18-5v12L3 13v-2z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-400 leading-relaxed">{plan.desc}</p>
                  </div>

                  {/* Pricing */}
                  <div className={`mt-6 rounded-2xl p-5 ${
                    plan.highlighted
                      ? "bg-blue-500/10 border border-blue-500/20"
                      : "bg-slate-700/30 border border-slate-700/50"
                  }`}>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl text-slate-400 font-medium">&#8377;</span>
                      <span className="text-5xl font-extrabold tracking-tight text-white">{plan.price}</span>
                      <span className="text-sm text-slate-400 ml-1">{plan.period}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-slate-500">or &#8377;{plan.priceYearly} / year</span>
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">Save 17%</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="mt-8 flex-1 space-y-4">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-3">
                        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          plan.highlighted
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-slate-600/50 text-slate-400"
                        }`}>
                          <IconCheck className="h-3 w-3" />
                        </span>
                        <span className="text-sm text-slate-300">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <PricingCtaButton cta={plan.cta} highlighted={plan.highlighted} />
                </div>
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div className="mx-auto mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              Secure payments via Razorpay
            </div>
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-blue-400"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              14-day free trial
            </div>
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-amber-400"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
              No hidden charges
            </div>
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-rose-400"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
              Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────── */}
      <section id="testimonials" className="relative scroll-mt-20 bg-gradient-to-b from-slate-800 to-slate-900 py-20 sm:py-28 overflow-hidden">
        <div className="pointer-events-none absolute left-0 top-1/4 h-[400px] w-[400px] rounded-full bg-violet-600/10 blur-3xl" aria-hidden="true" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
              Testimonials
            </p>
            <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
              Loved by shop owners across India
            </h2>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="relative flex flex-col rounded-2xl border border-slate-700/50 bg-slate-800/60 p-8 transition hover:bg-slate-800 hover:border-slate-600"
              >
                <div className="flex gap-0.5 text-amber-400">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <IconStar key={i} className="h-4 w-4" />
                  ))}
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-400">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-sm font-bold text-blue-400">
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-gradient-to-b from-blue-950 to-slate-900 py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/15 blur-3xl" />
        </div>
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.03]" aria-hidden="true" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Ready to take control of your business?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
            Join thousands of Indian retailers who use Rokadd to track inventory,
            manage cash flow, and grow their business.
          </p>
          <FinalCtaButtons />
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-white" aria-hidden="true">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-white">Rokadd</span>
              </Link>
              <p className="mt-3 text-sm text-slate-400">
                Smart inventory and cash flow management built for Indian retail & wholesale businesses.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Product</h4>
              <ul className="mt-4 space-y-2.5">
                <li><a href="#features" className="text-sm text-slate-400 transition hover:text-white">Features</a></li>
                <li><a href="#pricing" className="text-sm text-slate-400 transition hover:text-white">Pricing</a></li>
                <li><a href="#testimonials" className="text-sm text-slate-400 transition hover:text-white">Testimonials</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Company</h4>
              <ul className="mt-4 space-y-2.5">
                <li><Link href="/about" className="text-sm text-slate-400 transition hover:text-white">About</Link></li>
                <li><Link href="/contact" className="text-sm text-slate-400 transition hover:text-white">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Legal</h4>
              <ul className="mt-4 space-y-2.5">
                <li><Link href="/privacy" className="text-sm text-slate-400 transition hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-sm text-slate-400 transition hover:text-white">Terms of Service</Link></li>
                <li><Link href="/refund-policy" className="text-sm text-slate-400 transition hover:text-white">Refund Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 md:flex-row">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} Rokadd. All rights reserved.
            </p>
            <p className="text-sm text-slate-600">
              Made with care for Indian businesses
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
