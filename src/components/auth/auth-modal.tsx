"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import LoginForm from "./login-form";
import RegisterForm from "./register-form";
import ForgotPasswordForm from "./forgot-password-form";
import ResetPasswordForm from "./reset-password-form";

type AuthView = "login" | "register" | "forgot-password" | "reset-password";

export default function AuthModal({
  isOpen,
  onClose,
  initialTab = "login",
}: {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "login" | "register";
}) {
  const [view, setView] = useState<AuthView>(initialTab);

  // Reset view when modal opens with a different initialTab
  useEffect(() => {
    if (isOpen) setView(initialTab);
  }, [isOpen, initialTab]);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const showTabs = view === "login" || view === "register";

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl border border-slate-700/50 bg-slate-900 shadow-2xl shadow-black/40">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>

        {/* Tab switcher — only shown for login/register */}
        {showTabs && (
          <div className="flex border-b border-slate-700/50">
            <button
              type="button"
              onClick={() => setView("login")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition ${
                view === "login"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setView("register")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition ${
                view === "register"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Form content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {view === "login" && (
            <LoginForm
              onSwitchToRegister={() => setView("register")}
              onSwitchToForgot={() => setView("forgot-password")}
            />
          )}
          {view === "register" && (
            <RegisterForm onSwitchToLogin={() => setView("login")} />
          )}
          {view === "forgot-password" && (
            <ForgotPasswordForm
              onSwitchToLogin={() => setView("login")}
              onSwitchToReset={() => setView("reset-password")}
            />
          )}
          {view === "reset-password" && (
            <ResetPasswordForm
              onSwitchToLogin={() => setView("login")}
              onSwitchToForgot={() => setView("forgot-password")}
            />
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
