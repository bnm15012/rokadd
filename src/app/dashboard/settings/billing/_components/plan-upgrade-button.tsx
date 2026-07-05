'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowUpRight, ArrowDownRight, CheckCircle } from 'lucide-react';
import { createPlanOrder, verifyPlanPayment } from '../actions';

// Declare Razorpay on window
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: Record<string, string>) => void) => void;
    };
  }
}

interface Props {
  planId: number;
  planName: string;
  planPrice: number;
  isCurrent: boolean;
  isUpgrade: boolean;
  currentPlanPrice: number;
}

export function PlanUpgradeButton({ planId, planName, planPrice, isCurrent, isUpgrade, currentPlanPrice }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (isCurrent) {
    return (
      <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
        Current Plan
      </span>
    );
  }

  async function handleUpgrade() {
    setLoading(true);
    setError(null);

    try {
      const result = await createPlanOrder(planId);

      if (!result.success) {
        setError(result.error ?? 'Failed to create order');
        setLoading(false);
        return;
      }

      // Free plan — already switched
      if (result.free) {
        setSuccess(true);
        setLoading(false);
        router.refresh();
        return;
      }

      // Load Razorpay script if not loaded
      if (!window.Razorpay) {
        await loadRazorpayScript();
      }

      const order = result.order!;

      const rzp = new window.Razorpay({
        key: result.key,
        amount: order.amount,
        currency: order.currency,
        name: 'Rokadd',
        description: `${result.plan!.name} Plan — Monthly`,
        order_id: order.id,
        prefill: {
          email: result.userEmail,
          name: result.userName,
        },
        theme: {
          color: '#4f46e5',
        },
        handler: async (response: Record<string, string>) => {
          // Verify payment on server
          const verifyResult = await verifyPlanPayment({
            planId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });

          if (verifyResult.success) {
            setSuccess(true);
            router.refresh();
          } else {
            setError(verifyResult.error ?? 'Payment verification failed');
          }
          setLoading(false);
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      });

      rzp.open();
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  if (success) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
        <CheckCircle className="h-3.5 w-3.5" />
        Activated
      </span>
    );
  }

  const isFree = planPrice === 0;
  const label = isFree
    ? 'Switch to Free'
    : isUpgrade
    ? 'Upgrade'
    : 'Switch';

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
          isUpgrade
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isUpgrade ? (
          <ArrowUpRight className="h-3.5 w-3.5" />
        ) : (
          <ArrowDownRight className="h-3.5 w-3.5" />
        )}
        {loading ? 'Processing…' : label}
      </button>
      {error && <p className="text-[10px] text-red-500 max-w-[140px] text-center">{error}</p>}
    </div>
  );
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById('razorpay-script')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay'));
    document.head.appendChild(script);
  });
}
