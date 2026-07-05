import Link from "next/link";

export const metadata = { title: "About | Rokadd" };

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-blue-400 text-sm font-medium">Our Story</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
          About{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            Rokadd
          </span>
        </h1>
        <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
          We are on a mission to empower every Indian small business owner — from the kirana store
          around the corner to the bustling wholesale market — with smart, simple, and affordable
          tools to run their business with confidence.
        </p>
      </section>

      {/* Our Story */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Our Story</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Rokadd was born out of a simple observation: millions of kirana store owners,
              wholesalers, and small retailers across India were juggling inventory on paper registers,
              tracking credit in worn-out notebooks, and losing thousands of rupees every month to
              avoidable mistakes.
            </p>
            <p className="text-slate-300 leading-relaxed mb-4">
              We spoke to hundreds of shopkeepers — in Mumbai&apos;s wholesale markets, Chennai&apos;s
              small retailers, and Delhi&apos;s neighbourhood kiranas — and heard the same pain: existing
              software was either too complex, too expensive, or simply not built for the way Indian
              businesses actually work.
            </p>
            <p className="text-slate-300 leading-relaxed">
              So we built Rokadd from scratch, with Indian business workflows at its core — dual-unit
              inventory (pieces &amp; cases), khata-style customer credit, and cash flow views that match
              how a shopkeeper actually thinks about their day.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Founded", value: "2023", icon: "🏗️" },
              { label: "Active Shops", value: "10,000+", icon: "🏪" },
              { label: "Cities Covered", value: "50+", icon: "🗺️" },
              { label: "Uptime", value: "99.9%", icon: "⚡" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 text-center"
              >
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="text-2xl font-bold text-white">{item.value}</div>
                <div className="text-sm text-slate-400 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Mission */}
      <section className="bg-slate-800/30 border-y border-slate-700/30 py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Our Mission</h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-6">
            To make professional business management accessible and affordable for every Indian
            shopkeeper — not just the big players.
          </p>
          <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
            We believe that a vegetable vendor in Pune and a garment wholesaler in Surat deserve
            the same quality of business tools as a large retail chain. Rokadd is priced for
            real India, designed for real workflows, and supported in languages and formats that
            feel familiar.
          </p>
        </div>
      </section>

      {/* What We Offer */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">What We Offer</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Everything a growing Indian retail or wholesale business needs — in one place.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Inventory */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/40 transition-colors group">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-blue-400" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Dual-Unit Inventory</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Track stock in both pieces and cases simultaneously. Perfect for FMCG, grocery, and
              wholesale businesses that deal in mixed units every day.
            </p>
          </div>

          {/* Cash Flow */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/40 transition-colors group">
            <div className="w-11 h-11 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-green-400" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Daily Cash Flow</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Get a clear picture of your daily inflows and outflows. Know exactly where your money
              is coming from and going at every moment of the day.
            </p>
          </div>

          {/* Vendor Credit */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/40 transition-colors group">
            <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-orange-400" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Vendor Credit Management</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Track what you owe to each supplier. Manage payment terms, outstanding balances, and
              never miss a due date with automated reminders.
            </p>
          </div>

          {/* Customer Khata */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/40 transition-colors group">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-purple-400" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Customer Khata</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Digital khata for every customer. Record udhaar, payments, and balances — just like
              your old register but faster, safer, and accessible anywhere.
            </p>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/40 transition-colors group">
            <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 group-hover:bg-red-500/20 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-red-400" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Low-Stock Alerts</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Never run out of your best-selling products. Set reorder thresholds and get instant
              alerts before stock hits zero, so you can reorder in time.
            </p>
          </div>

          {/* Sales Analytics */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/40 transition-colors group">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-cyan-400" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Sales Analytics</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Understand what&apos;s selling, what&apos;s not, and why. Visual reports on top products, peak
              hours, and monthly trends help you make smarter buying decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gradient-to-r from-blue-600/10 via-cyan-600/10 to-blue-600/10 border-y border-blue-500/20 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-2">Trusted by Indian Businesses</h2>
            <p className="text-slate-400">Numbers that speak for themselves.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "10,000+", label: "Shops on Platform", accent: "text-blue-400" },
              { value: "2.5M+", label: "Sales Recorded", accent: "text-cyan-400" },
              { value: "50+", label: "Cities Covered", accent: "text-green-400" },
              { value: "4.8 / 5", label: "Average Rating", accent: "text-yellow-400" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 text-center"
              >
                <div className={`text-4xl font-extrabold mb-1 ${stat.accent}`}>{stat.value}</div>
                <div className="text-slate-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Our Values</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            The principles that guide every decision we make.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: "✦",
              title: "Simplicity",
              description:
                "No cluttered dashboards or confusing menus. If your 60-year-old uncle can use it on day one, we have done our job.",
              color: "text-blue-400",
              border: "hover:border-blue-500/40",
            },
            {
              icon: "₹",
              title: "Affordability",
              description:
                "Priced for Indian small businesses — not Silicon Valley startups. Every plan is designed to deliver many times its cost in value.",
              color: "text-green-400",
              border: "hover:border-green-500/40",
            },
            {
              icon: "⬡",
              title: "Reliability",
              description:
                "99.9% uptime, automatic backups, and offline-capable features so your business never stops, even when the internet does.",
              color: "text-orange-400",
              border: "hover:border-orange-500/40",
            },
            {
              icon: "🇮🇳",
              title: "Indian-First",
              description:
                "Built for GST, designed for khata, and calibrated for the way Indian shopkeepers actually operate day-to-day.",
              color: "text-cyan-400",
              border: "hover:border-cyan-500/40",
            },
          ].map((value) => (
            <div
              key={value.title}
              className={`bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 transition-colors ${value.border}`}
            >
              <div className={`text-3xl font-bold mb-3 ${value.color}`}>{value.icon}</div>
              <h3 className="text-white font-semibold text-lg mb-2">{value.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-br from-blue-600/20 via-cyan-600/10 to-slate-800/60 border border-blue-500/30 rounded-3xl p-12 text-center">
          <h2 className="text-4xl font-extrabold text-white mb-4">Ready to get started?</h2>
          <p className="text-slate-300 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            Join over 10,000 Indian businesses that have already simplified their operations with
            Rokadd. Set up in under 5 minutes — no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-base"
            >
              Start Free Trial
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-slate-700/60 hover:bg-slate-700 border border-slate-600/50 text-slate-200 font-semibold px-8 py-3.5 rounded-xl transition-colors text-base"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

    </>
  );
}
