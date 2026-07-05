"use client";

import { useState } from "react";
import Link from "next/link";
import AuthModal from "@/components/auth/auth-modal";

type NavLink = { href: string; label: string };

export default function Navbar({
  links,
  showHome = false,
}: {
  links?: NavLink[];
  showHome?: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"login" | "register">("login");

  const openLogin = () => {
    setModalTab("login");
    setModalOpen(true);
  };
  const openRegister = () => {
    setModalTab("register");
    setModalOpen(true);
  };

  const defaultLinks: NavLink[] = showHome
    ? [
        { href: "/", label: "Home" },
        { href: "/#features", label: "Features" },
        { href: "/#pricing", label: "Pricing" },
        { href: "/about", label: "About" },
        { href: "/contact", label: "Contact" },
      ]
    : [
        { href: "/", label: "Home" },
        { href: "#features", label: "Features" },
        { href: "#how-it-works", label: "How it works" },
        { href: "#pricing", label: "Pricing" },
        { href: "#testimonials", label: "Testimonials" },
      ];

  const navLinks = links ?? defaultLinks;

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-white"
                aria-hidden="true"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Rokadd
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-300 transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openLogin}
              className="hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition hover:text-white sm:inline-flex"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={openRegister}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-500/25 transition hover:bg-blue-400 active:bg-blue-600"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      <AuthModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTab={modalTab}
      />
    </>
  );
}
