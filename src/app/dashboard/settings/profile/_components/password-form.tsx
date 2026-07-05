"use client";

import { useState, useRef, useTransition } from "react";
import {
  requestOtpAction,
  verifyOtpAndChangePasswordAction,
  type PasswordState,
} from "../actions";

export default function PasswordForm() {
  const [step, setStep] = useState<"password" | "otp">("password");
  const [state, setState] = useState<PasswordState>(undefined);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const passwordRef = useRef<string>("");

  // Step 1: Validate passwords and request OTP
  function handleRequestOtp(formData: FormData) {
    passwordRef.current = formData.get("newPassword") as string;
    startTransition(async () => {
      const result = await requestOtpAction(undefined, formData);
      setState(result);
      if (result?.otpSent) {
        setStep("otp");
      }
    });
  }

  // Step 2: Verify OTP and change password
  function handleVerifyOtp(formData: FormData) {
    formData.set("newPassword", passwordRef.current);
    startTransition(async () => {
      const result = await verifyOtpAndChangePasswordAction(undefined, formData);
      setState(result);
      if (result?.success) {
        setStep("password");
        passwordRef.current = "";
      }
    });
  }

  // Go back to step 1
  function handleBack() {
    setStep("password");
    setState(undefined);
  }

  const inputBase =
    "block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:outline-none focus:ring-2";
  const inputNormal =
    "border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/30";
  const inputError =
    "border-red-400 focus:border-red-400 focus:ring-red-400/30";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
      <p className="mt-1 text-sm text-slate-500">
        {step === "password"
          ? "Enter your new password. An OTP will be sent to your email for verification."
          : "Enter the 6-digit OTP sent to your registered email."}
      </p>

      {/* Steps indicator */}
      <div className="mt-4 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              step === "password"
                ? "bg-indigo-600 text-white"
                : state?.success
                ? "bg-green-500 text-white"
                : "bg-indigo-100 text-indigo-600"
            }`}
          >
            {step === "otp" && !state?.success ? (
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
            ) : (
              "1"
            )}
          </div>
          <span className="text-xs font-medium text-slate-600">New Password</span>
        </div>
        <div className="h-px flex-1 bg-slate-200" />
        <div className="flex items-center gap-2">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              step === "otp"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            {state?.success ? (
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
            ) : (
              "2"
            )}
          </div>
          <span className="text-xs font-medium text-slate-600">Verify OTP</span>
        </div>
      </div>

      {state?.success && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {state.success}
        </div>
      )}
      {state?.error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Step 1: New password form */}
      {step === "password" && !state?.success && (
        <form ref={formRef} action={handleRequestOtp} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              New password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              className={`${inputBase} ${
                state?.errors?.newPassword ? inputError : inputNormal
              }`}
              placeholder="Enter new password"
            />
            {state?.errors?.newPassword && state.errors.newPassword.length > 0 && (
              <div className="mt-1.5">
                <ul className="list-disc list-inside space-y-0.5">
                  {state.errors.newPassword.map((err) => (
                    <li key={err} className="text-xs text-red-600">
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!state?.errors?.newPassword && (
              <p className="mt-1.5 text-xs text-slate-400">
                Min 8 characters, at least one letter and one number.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className={`${inputBase} ${
                state?.errors?.confirmPassword ? inputError : inputNormal
              }`}
              placeholder="Re-enter new password"
            />
            {state?.errors?.confirmPassword && (
              <p className="mt-1.5 text-xs text-red-600">
                {state.errors.confirmPassword[0]}
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" className="opacity-75" /></svg>
                  Sending OTP...
                </>
              ) : (
                <>
                  Send OTP to Email
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Step 2: OTP verification form */}
      {step === "otp" && !state?.success && (
        <form action={handleVerifyOtp} className="mt-5 space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-sm text-blue-700">
              A 6-digit OTP has been sent to your registered email. It is valid for <strong>5 minutes</strong>.
            </p>
          </div>

          <div>
            <label
              htmlFor="otp"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Enter OTP
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoFocus
              className={`${inputBase} text-center text-lg tracking-[0.4em] font-mono font-bold ${
                state?.errors?.otp ? inputError : inputNormal
              }`}
              placeholder="------"
            />
            {state?.errors?.otp && (
              <p className="mt-1.5 text-xs text-red-600">
                {state.errors.otp[0]}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleBack}
              disabled={isPending}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" className="opacity-75" /></svg>
                  Verifying...
                </>
              ) : (
                "Verify & Change Password"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Success state — show reset button */}
      {state?.success && (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => {
              setState(undefined);
              setStep("password");
            }}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition"
          >
            Change password again
          </button>
        </div>
      )}
    </div>
  );
}
