"use client";

import { useState } from "react";
import AuthModal from "@/components/auth/auth-modal";

const IconArrowRight = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
  </svg>
);

export function HeroButtons() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"login" | "register">("register");

  return (
    <>
      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <button
          type="button"
          onClick={() => { setModalTab("register"); setModalOpen(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400 hover:shadow-blue-400/40 active:bg-blue-600"
        >
          Start Free Trial
          <IconArrowRight className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => { setModalTab("login"); setModalOpen(true); }}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800/50 px-8 py-3.5 text-base font-semibold text-slate-200 shadow-sm transition hover:bg-slate-700/50 hover:border-slate-500"
        >
          Sign In
        </button>
      </div>
      <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} initialTab={modalTab} />
    </>
  );
}

export function FeatureHighlightCta() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="mt-10">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-500/25 transition hover:bg-blue-400"
        >
          Try it free
          <IconArrowRight className="h-4 w-4" />
        </button>
      </div>
      <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} initialTab="register" />
    </>
  );
}

export function FinalCtaButtons() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"login" | "register">("register");

  return (
    <>
      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <button
          type="button"
          onClick={() => { setModalTab("register"); setModalOpen(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-400 active:bg-blue-600"
        >
          Get Started Free
          <IconArrowRight className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => { setModalTab("login"); setModalOpen(true); }}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800/50 px-8 py-3.5 text-base font-semibold text-slate-200 transition hover:bg-slate-700/50 hover:border-slate-500"
        >
          Sign In
        </button>
      </div>
      <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} initialTab={modalTab} />
    </>
  );
}

export function PricingCtaButton({ cta, highlighted }: { cta: string; highlighted: boolean }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="mt-8">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold transition-all duration-200 ${
            highlighted
              ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:from-blue-600 hover:to-indigo-600"
              : "border border-slate-600 bg-slate-700/50 text-slate-200 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
          }`}
        >
          {cta}
          <IconArrowRight className="h-4 w-4" />
        </button>
      </div>
      <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} initialTab="register" />
    </>
  );
}
