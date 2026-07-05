"use client";

import { useActionState } from "react";
import { registerAction, type RegisterState } from "@/app/(auth)/register/actions";
import Link from "next/link";

export default function RegisterForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(
    registerAction,
    undefined
  );

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Create your account</h2>
        <p className="mt-1 text-sm text-slate-400">
          Start your 14-day free trial — no credit card required
        </p>
      </div>

      {state?.message && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <span>{state.message}</span>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="reg-name" className="block text-sm font-medium text-slate-300 mb-1.5">
            Full name
          </label>
          <input
            id="reg-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            aria-describedby={state?.errors?.name ? "name-error" : undefined}
            className={[
              "block w-full rounded-lg border bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 shadow-sm transition focus:outline-none focus:ring-2",
              state?.errors?.name
                ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30"
                : "border-slate-700 focus:border-blue-500 focus:ring-blue-500/30",
            ].join(" ")}
            placeholder="Jane Smith"
          />
          {state?.errors?.name && (
            <p id="name-error" className="mt-1.5 text-xs text-red-400">{state.errors.name[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-sm font-medium text-slate-300 mb-1.5">
            Email address
          </label>
          <input
            id="reg-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-describedby={state?.errors?.email ? "email-error" : undefined}
            className={[
              "block w-full rounded-lg border bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 shadow-sm transition focus:outline-none focus:ring-2",
              state?.errors?.email
                ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30"
                : "border-slate-700 focus:border-blue-500 focus:ring-blue-500/30",
            ].join(" ")}
            placeholder="you@example.com"
          />
          {state?.errors?.email && (
            <p id="email-error" className="mt-1.5 text-xs text-red-400">{state.errors.email[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="reg-password" className="block text-sm font-medium text-slate-300 mb-1.5">
            Password
          </label>
          <input
            id="reg-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            aria-describedby={state?.errors?.password ? "password-error" : undefined}
            className={[
              "block w-full rounded-lg border bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 shadow-sm transition focus:outline-none focus:ring-2",
              state?.errors?.password
                ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30"
                : "border-slate-700 focus:border-blue-500 focus:ring-blue-500/30",
            ].join(" ")}
            placeholder="••••••••"
          />
          {state?.errors?.password && state.errors.password.length > 0 && (
            <div id="password-error" className="mt-1.5">
              <p className="text-xs font-medium text-red-400 mb-0.5">Password must:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {state.errors.password.map((err) => (
                  <li key={err} className="text-xs text-red-400">{err}</li>
                ))}
              </ul>
            </div>
          )}
          {!state?.errors?.password && (
            <p className="mt-1.5 text-xs text-slate-500">
              Min 8 characters, include at least one letter and one number.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="reg-shopName" className="block text-sm font-medium text-slate-300 mb-1.5">
            Shop / business name
          </label>
          <input
            id="reg-shopName"
            name="shopName"
            type="text"
            autoComplete="organization"
            required
            aria-describedby={state?.errors?.shopName ? "shopName-error" : "shopName-hint"}
            className={[
              "block w-full rounded-lg border bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 shadow-sm transition focus:outline-none focus:ring-2",
              state?.errors?.shopName
                ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30"
                : "border-slate-700 focus:border-blue-500 focus:ring-blue-500/30",
            ].join(" ")}
            placeholder="My Awesome Shop"
          />
          {state?.errors?.shopName ? (
            <p id="shopName-error" className="mt-1.5 text-xs text-red-400">{state.errors.shopName[0]}</p>
          ) : (
            <p id="shopName-hint" className="mt-1.5 text-xs text-slate-500">
              You can always change this later in settings.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-2 w-full rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating account...
            </span>
          ) : (
            "Create account"
          )}
        </button>

        <p className="text-center text-xs text-slate-500 leading-relaxed">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="text-slate-400 hover:text-white transition">Terms of Service</Link> and{" "}
          <Link href="/privacy" className="text-slate-400 hover:text-white transition">Privacy Policy</Link>.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-medium text-blue-400 hover:text-blue-300 transition"
        >
          Sign in
        </button>
      </p>
    </>
  );
}
