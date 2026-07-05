"use client";

import { useActionState } from "react";
import { forgotPasswordAction } from "@/app/(auth)/forgot-password/actions";
import type { ForgotPasswordState } from "@/app/(auth)/forgot-password/actions";

export default function ForgotPasswordForm({
  onSwitchToLogin,
  onSwitchToReset,
}: {
  onSwitchToLogin: () => void;
  onSwitchToReset: () => void;
}) {
  const [state, formAction, pending] = useActionState<
    ForgotPasswordState,
    FormData
  >(forgotPasswordAction, undefined);

  // After OTP sent, show success message
  if (state?.success) {
    return (
      <>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white">Check your email</h2>
          <p className="mt-2 text-sm text-slate-400">
            If an account exists with that email, we&apos;ve sent a 6-digit OTP.
            The code is valid for 5 minutes.
          </p>
        </div>

        <button
          type="button"
          onClick={onSwitchToReset}
          className="block w-full rounded-lg bg-blue-500 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-blue-400"
        >
          Enter OTP &amp; Reset Password
        </button>

        <p className="mt-4 text-center text-sm text-slate-500">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-medium text-blue-400 hover:text-blue-300 transition"
          >
            &larr; Back to sign in
          </button>
        </p>
      </>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Forgot password?</h2>
        <p className="mt-1 text-sm text-slate-400">
          Enter your email address and we&apos;ll send you an OTP to reset your
          password.
        </p>
      </div>

      {state?.error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="mt-0.5 h-4 w-4 shrink-0 text-red-400"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clipRule="evenodd"
            />
          </svg>
          <span>{state.error}</span>
        </div>
      )}

      <form action={formAction} className="space-y-5">
        <div>
          <label
            htmlFor="forgot-email"
            className="block text-sm font-medium text-slate-300 mb-1.5"
          >
            Email address
          </label>
          <input
            id="forgot-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="block w-full rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            placeholder="you@example.com"
          />
          {state?.errors?.email && (
            <p className="mt-1.5 text-sm text-red-400">{state.errors.email[0]}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sending OTP...
            </span>
          ) : (
            "Send OTP"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Remember your password?{" "}
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
