export const metadata = { title: "Refund Policy | Rokadd" };

export default function RefundPolicyPage() {
  return (
    <div className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
          {/* Header */}
          <h1 className="text-4xl font-bold text-white mb-2">Refund Policy</h1>
          <p className="text-slate-500 text-sm mb-10">Last updated: June 15, 2025</p>

          {/* Section helper styles are applied inline via className */}

          {/* 1. Overview */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-3">1. Overview</h2>
            <p className="text-slate-300 leading-relaxed">
              At Rokadd, we are committed to delivering a reliable and high-quality SaaS platform for Indian retail
              and wholesale businesses. We understand that circumstances change, and we have designed this refund policy
              to be fair and transparent. Please read this policy carefully before subscribing to any of our paid plans.
              By completing a purchase, you agree to the terms described below.
            </p>
          </section>

          {/* 2. Free Plan */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-3">2. Free (Starter) Plan</h2>
            <p className="text-slate-300 leading-relaxed">
              The <span className="text-blue-400 font-medium">Starter plan</span> is provided at no cost and does not
              involve any monetary transactions. As no payment is collected, no refunds are applicable to free-tier
              accounts. You may downgrade or delete your Starter account at any time without charge.
            </p>
          </section>

          {/* 3. Paid Subscriptions */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-3">3. Paid Subscriptions</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Rokadd offers the following paid subscription plans, billed monthly:
            </p>
            <div className="rounded-lg border border-slate-700 overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 text-slate-400 uppercase text-xs tracking-wider">
                    <th className="text-left px-5 py-3">Plan</th>
                    <th className="text-left px-5 py-3">Price</th>
                    <th className="text-left px-5 py-3">Billing Cycle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  <tr className="text-slate-300">
                    <td className="px-5 py-3 font-medium">Pro</td>
                    <td className="px-5 py-3">&#8377;499 / month</td>
                    <td className="px-5 py-3">Monthly</td>
                  </tr>
                  <tr className="text-slate-300">
                    <td className="px-5 py-3 font-medium">Enterprise</td>
                    <td className="px-5 py-3">&#8377;1,499 / month</td>
                    <td className="px-5 py-3">Monthly</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-slate-300 leading-relaxed">
              All payments are processed securely via{" "}
              <span className="text-blue-400 font-medium">Razorpay</span>. Subscription charges are debited at the
              beginning of each billing cycle and grant access to the plan features for that period.
            </p>
          </section>

          {/* 4. Refund Eligibility */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-3">4. Refund Eligibility</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              We offer refunds in the following situations:
            </p>
            <ul className="space-y-3 text-slate-300">
              <li className="flex gap-3">
                <span className="text-blue-400 mt-1 flex-shrink-0">&#10003;</span>
                <span>
                  <strong className="text-white">7-day money-back guarantee:</strong> If you subscribed to a paid plan
                  for the first time and are not satisfied, you may request a full refund within 7 days of the initial
                  charge. This applies only to the first subscription payment on a given account.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400 mt-1 flex-shrink-0">&#10003;</span>
                <span>
                  <strong className="text-white">Duplicate charges:</strong> If your account was charged more than once
                  for the same billing period due to a technical error, the duplicate amount will be refunded in full.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400 mt-1 flex-shrink-0">&#10003;</span>
                <span>
                  <strong className="text-white">Service unavailability:</strong> If Rokadd experiences verified
                  downtime exceeding 72 consecutive hours within a paid billing cycle and we are unable to provide a
                  service credit, a pro-rated refund for the affected period may be issued at our discretion.
                </span>
              </li>
            </ul>
          </section>

          {/* 5. How to Request a Refund */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-3">5. How to Request a Refund</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              To submit a refund request, please follow these steps:
            </p>
            <ol className="space-y-3 text-slate-300 list-none">
              {[
                "Log in to your Rokadd account and navigate to Settings → Billing.",
                'Click "Request Refund" or contact our support team directly at bookandmanage@gmail.com.',
                "Provide your registered email address, the Razorpay Payment ID (found in your invoice), the reason for the refund request, and any relevant screenshots or context.",
                "Our team will acknowledge your request within 1 business day.",
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-blue-400 font-semibold flex-shrink-0">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* 6. Processing Time */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-3">6. Processing Time</h2>
            <p className="text-slate-300 leading-relaxed">
              Once a refund is approved, it will be initiated within{" "}
              <span className="text-blue-400 font-medium">3&ndash;5 business days</span>. The time for the funds to
              appear in your account depends on your bank or card issuer and typically takes an additional 5&ndash;10
              business days. Razorpay will send a confirmation email once the refund is processed on our end.
            </p>
          </section>

          {/* 7. Payment Method */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-3">7. Refund Payment Method</h2>
            <p className="text-slate-300 leading-relaxed">
              Refunds are always issued to the original payment method used at the time of purchase (credit card, debit
              card, UPI, net banking, or wallet via Razorpay). We are unable to process refunds to a different payment
              instrument. If the original payment method is no longer valid or active, please contact our support team
              so we can assist you.
            </p>
          </section>

          {/* 8. Cancellation Policy */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-3">8. Cancellation Policy</h2>
            <p className="text-slate-300 leading-relaxed mb-3">
              You may cancel your subscription at any time from Settings → Billing. Upon cancellation:
            </p>
            <ul className="space-y-2 text-slate-300">
              <li className="flex gap-3">
                <span className="text-slate-500 flex-shrink-0">&bull;</span>
                Your plan remains active until the end of the current billing period.
              </li>
              <li className="flex gap-3">
                <span className="text-slate-500 flex-shrink-0">&bull;</span>
                You will not be charged for subsequent billing cycles.
              </li>
              <li className="flex gap-3">
                <span className="text-slate-500 flex-shrink-0">&bull;</span>
                No partial or pro-rated refunds are issued for the unused portion of a cancelled billing period, unless
                you qualify under Section 4 above.
              </li>
              <li className="flex gap-3">
                <span className="text-slate-500 flex-shrink-0">&bull;</span>
                After the billing period ends, your account will revert to the Starter (Free) plan with limited access.
              </li>
            </ul>
          </section>

          {/* 9. Exceptions */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-3">9. Exceptions &amp; Non-Refundable Situations</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Refunds will <strong className="text-white">not</strong> be issued in the following cases:
            </p>
            <ul className="space-y-2 text-slate-300">
              {[
                "Renewal charges for subscriptions that were not cancelled before the renewal date.",
                "Requests made after the 7-day eligibility window for first-time subscribers.",
                "Accounts found to be in violation of our Terms of Service or Acceptable Use Policy.",
                "Charges resulting from plan upgrades (e.g., Pro to Enterprise) during an active billing period.",
                "Add-on purchases or one-time fees, unless caused by a technical error on our part.",
                "Refund requests based on dissatisfaction with feature scope that was accurately described on our pricing page at the time of purchase.",
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-slate-500 flex-shrink-0">&bull;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 10. Contact */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-3">10. Contact Us</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              If you have questions about this refund policy or need help with a billing issue, our team is here to
              help:
            </p>
            <div className="rounded-lg bg-slate-800 border border-slate-700 p-5 space-y-2 text-slate-300 text-sm">
              <p>
                <span className="text-slate-500">Email:</span>{" "}
                <a href="mailto:bookandmanage@gmail.com" className="text-blue-400 hover:underline">
                  bookandmanage@gmail.com
                </a>
              </p>
              <p>
                <span className="text-slate-500">Business hours:</span> Monday &ndash; Friday, 9 AM &ndash; 6 PM IST
              </p>
              <p>
                <span className="text-slate-500">Response time:</span> Within 1 business day
              </p>
            </div>
          </section>
      </div>
    </div>
  );
}
