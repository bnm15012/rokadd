import Link from "next/link";
import Navbar from "@/components/navbar";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      {/* ── Navbar ──────────────────────────────────────────────── */}
      <Navbar showHome />

      {/* ── Page content ──────────────────────────────────────── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer (matches homepage) ─────────────────────────── */}
      <footer className="border-t border-slate-800 bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
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

            <div>
              <h4 className="text-sm font-semibold text-slate-200">Product</h4>
              <ul className="mt-4 space-y-2.5">
                <li><Link href="/#features" className="text-sm text-slate-400 transition hover:text-white">Features</Link></li>
                <li><Link href="/#pricing" className="text-sm text-slate-400 transition hover:text-white">Pricing</Link></li>
                <li><Link href="/#testimonials" className="text-sm text-slate-400 transition hover:text-white">Testimonials</Link></li>
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
