export const metadata = { title: "Terms of Service | Rokadd" };

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 text-slate-300">
      {/* Header */}
      <div className="mb-12">
        <p className="text-sm text-slate-500 mb-3">Legal</p>
        <h1 className="text-4xl font-bold text-white mb-4">
          Terms of Service
        </h1>
        <p className="text-slate-500 text-sm">
          Last updated:{" "}
          <span className="text-slate-400">June 15, 2025</span>
        </p>
        <div className="mt-6 p-4 rounded-xl border border-slate-700 bg-slate-800/50">
          <p className="text-slate-300 text-sm leading-relaxed">
            Please read these Terms of Service carefully before using
            Rokadd. By accessing or using our platform, you agree to be
            bound by these terms. If you do not agree, please do not use the
            service.
          </p>
        </div>
      </div>

      <div className="space-y-12">
        {/* 1. Acceptance of Terms */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
            <span className="text-blue-400 font-mono text-sm">01.</span>
            Acceptance of Terms
          </h2>
          <div className="space-y-3 text-slate-300 leading-relaxed">
            <p>
              By registering for, accessing, or using the Rokadd platform
              (the &ldquo;Service&rdquo;), operated by Rokadd Technologies
              Private Limited (&ldquo;Company&rdquo;, &ldquo;we&rdquo;,
              &ldquo;us&rdquo;, or &ldquo;our&rdquo;), you (&ldquo;User&rdquo;,
              &ldquo;you&rdquo;, or &ldquo;your&rdquo;) agree to be bound by
              these Terms of Service (&ldquo;Terms&rdquo;) and our Privacy
              Policy.
            </p>
            <p>
              If you are accepting these Terms on behalf of a company or other
              legal entity, you represent that you have the authority to bind
              that entity to these Terms. These Terms constitute a legally
              binding agreement between you and the Company.
            </p>
            <p>
              Users must be at least 18 years of age and capable of forming a
              binding contract under the Indian Contract Act, 1872, to use
              this Service.
            </p>
          </div>
        </section>

        {/* 2. Description of Service */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
            <span className="text-blue-400 font-mono text-sm">02.</span>
            Description of Service
          </h2>
          <div className="space-y-3 text-slate-300 leading-relaxed">
            <p>
              Rokadd is a multi-tenant Software-as-a-Service (SaaS)
              platform designed for Indian retail and wholesale businesses.
              The Service provides the following core features:
            </p>
            <ul className="space-y-2 ml-4">
              {[
                "Inventory management with dual-unit tracking (cartons & pieces)",
                "Daily cash flow tracking and reporting",
                "Vendor credit ledger management",
                "Customer khata (account book) management",
                "Low-stock alerts and notifications",
                "Sales analytics and business intelligence dashboards",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1 shrink-0">▸</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <p>
              We reserve the right to modify, suspend, or discontinue any
              feature of the Service at any time, with or without notice, and
              without liability to you.
            </p>
          </div>
        </section>

        {/* 3. User Accounts */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
            <span className="text-blue-400 font-mono text-sm">03.</span>
            User Accounts
          </h2>
          <div className="space-y-3 text-slate-300 leading-relaxed">
            <p>
              To access the Service, you must create an account by providing
              accurate and complete information, including your business name,
              GSTIN (if applicable), and a valid email address. You are
              responsible for maintaining the confidentiality of your
              credentials and for all activities that occur under your
              account.
            </p>
            <p>
              Each tenant (business) is allocated an isolated workspace.
              You must not share account credentials across multiple
              businesses or individuals who are not authorised members of your
              organisation. You agree to notify us immediately at{" "}
              <a
                href="mailto:support@rokadd.in"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                support@rokadd.in
              </a>{" "}
              if you suspect any unauthorised use of your account.
            </p>
            <p>
              We reserve the right to suspend or terminate accounts that
              contain false, misleading, or incomplete information, or that
              violate these Terms.
            </p>
          </div>
        </section>

        {/* 4. Subscription & Billing */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
            <span className="text-blue-400 font-mono text-sm">04.</span>
            Subscription &amp; Billing
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>
              Rokadd offers the following subscription plans. All prices
              are in Indian Rupees (INR) and are exclusive of applicable
              taxes (GST):
            </p>
            <div className="grid gap-3">
              {[
                {
                  plan: "Starter",
                  price: "Free",
                  note: "Limited to 1 user, up to 500 SKUs, and 3 months of data retention.",
                },
                {
                  plan: "Pro",
                  price: "₹499 / month",
                  note: "Up to 10 users, unlimited SKUs, 1 year data retention, priority support.",
                },
                {
                  plan: "Enterprise",
                  price: "₹1,499 / month",
                  note: "Unlimited users, custom integrations, dedicated account manager, 5-year data retention.",
                },
              ].map(({ plan, price, note }) => (
                <div
                  key={plan}
                  className="p-4 rounded-lg border border-slate-700 bg-slate-800/50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white">{plan}</span>
                    <span className="text-blue-400 font-mono text-sm font-semibold">
                      {price}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm">{note}</p>
                </div>
              ))}
            </div>
            <p>
              Paid subscriptions are billed monthly in advance. Payments are
              processed securely via Razorpay or other authorised payment
              gateways. By providing payment information, you authorise us to
              charge your selected payment method on each billing cycle.
            </p>
            <p>
              Subscriptions automatically renew unless cancelled at least 48
              hours before the renewal date. Refunds are not provided for
              partial billing periods. Downgrading your plan may result in
              loss of access to features and data beyond your new plan limits.
            </p>
            <p>
              We reserve the right to change subscription pricing with at
              least 30 days&apos; notice. Continued use of the Service after a
              price change constitutes acceptance of the new pricing.
            </p>
          </div>
        </section>

        {/* 5. Acceptable Use */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
            <span className="text-blue-400 font-mono text-sm">05.</span>
            Acceptable Use
          </h2>
          <div className="space-y-3 text-slate-300 leading-relaxed">
            <p>You agree not to use the Service to:</p>
            <ul className="space-y-2 ml-4">
              {[
                "Violate any applicable law or regulation, including the Information Technology Act, 2000 and rules thereunder",
                "Upload or transmit any malware, viruses, or other malicious code",
                "Attempt to gain unauthorised access to any part of the Service or other users' data",
                "Reverse-engineer, decompile, or disassemble any part of the platform",
                "Use the Service to process or store data in violation of third-party rights",
                "Engage in any activity that disproportionately burdens our infrastructure (e.g. automated scraping or DDoS)",
                "Misrepresent your identity, business, or affiliation",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-red-400 mt-1 shrink-0">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p>
              Violation of this Acceptable Use Policy may result in immediate
              suspension or termination of your account without refund.
            </p>
          </div>
        </section>

        {/* 6. Intellectual Property */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
            <span className="text-blue-400 font-mono text-sm">06.</span>
            Intellectual Property
          </h2>
          <div className="space-y-3 text-slate-300 leading-relaxed">
            <p>
              The Service and all its original content, features,
              functionality, software, and branding — including but not
              limited to the Rokadd name, logo, user interface designs,
              and underlying code — are and will remain the exclusive property
              of Rokadd Technologies Private Limited and are protected
              under applicable Indian and international intellectual property
              laws.
            </p>
            <p>
              You are granted a limited, non-exclusive, non-transferable,
              revocable licence to access and use the Service solely for your
              internal business purposes in accordance with these Terms. This
              licence does not include any right to sublicense, sell, resell,
              or commercially exploit the Service.
            </p>
            <p>
              Any feedback, suggestions, or ideas you provide about the
              Service may be used by us without any obligation of
              confidentiality or compensation to you.
            </p>
          </div>
        </section>

        {/* 7. Data Ownership */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
            <span className="text-blue-400 font-mono text-sm">07.</span>
            Data Ownership
          </h2>
          <div className="space-y-3 text-slate-300 leading-relaxed">
            <p>
              You retain full ownership of all business data you input into
              the Service, including inventory records, transaction logs,
              customer accounts, and vendor information
              (&ldquo;Your Data&rdquo;). We do not claim any ownership rights
              over Your Data.
            </p>
            <p>
              By using the Service, you grant us a limited licence to host,
              process, and transmit Your Data solely to provide and improve
              the Service. We will not sell Your Data to third parties or use
              it for any purpose other than operating the Service, as further
              described in our Privacy Policy.
            </p>
            <p>
              You may export Your Data at any time from within the platform.
              Upon account termination, we will retain Your Data for 30 days
              before permanent deletion, during which you may request an
              export. After that period, Your Data may be irrecoverably
              deleted.
            </p>
            <p>
              You are solely responsible for ensuring that Your Data complies
              with all applicable laws and does not infringe any third-party
              rights.
            </p>
          </div>
        </section>

        {/* 8. Limitation of Liability */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
            <span className="text-blue-400 font-mono text-sm">08.</span>
            Limitation of Liability
          </h2>
          <div className="space-y-3 text-slate-300 leading-relaxed">
            <p>
              To the maximum extent permitted by applicable law, the Service
              is provided on an &ldquo;as is&rdquo; and &ldquo;as
              available&rdquo; basis without warranties of any kind, either
              express or implied, including but not limited to implied
              warranties of merchantability, fitness for a particular purpose,
              or non-infringement.
            </p>
            <p>
              In no event shall Rokadd Technologies Private Limited, its
              directors, employees, partners, agents, suppliers, or affiliates
              be liable for any indirect, incidental, special, consequential,
              or punitive damages, including without limitation loss of
              profits, data, goodwill, or business interruption, arising out
              of your use of or inability to use the Service.
            </p>
            <p>
              Our total aggregate liability to you for any claims arising
              under or related to these Terms or the Service shall not exceed
              the greater of (a) the amount paid by you to us in the 3 months
              immediately preceding the claim, or (b) ₹1,000 (One Thousand
              Indian Rupees).
            </p>
          </div>
        </section>

        {/* 9. Termination */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
            <span className="text-blue-400 font-mono text-sm">09.</span>
            Termination
          </h2>
          <div className="space-y-3 text-slate-300 leading-relaxed">
            <p>
              You may terminate your account at any time by navigating to
              Account Settings and selecting &ldquo;Delete Account&rdquo;, or
              by contacting us at{" "}
              <a
                href="mailto:support@rokadd.in"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                support@rokadd.in
              </a>
              . Termination does not entitle you to a refund for any
              prepaid subscription fees.
            </p>
            <p>
              We may suspend or terminate your access to the Service
              immediately, without prior notice or liability, if you breach
              any provision of these Terms, or if we are required to do so by
              law.
            </p>
            <p>
              Upon termination, your right to use the Service will immediately
              cease. Provisions of these Terms that by their nature should
              survive termination — including Intellectual Property, Data
              Ownership, Limitation of Liability, and Governing Law — shall
              survive.
            </p>
          </div>
        </section>

        {/* 10. Governing Law */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
            <span className="text-blue-400 font-mono text-sm">10.</span>
            Governing Law &amp; Dispute Resolution
          </h2>
          <div className="space-y-3 text-slate-300 leading-relaxed">
            <p>
              These Terms shall be governed by and construed in accordance
              with the laws of India, without regard to its conflict of law
              provisions. You agree to submit to the exclusive jurisdiction of
              the courts located in{" "}
              <span className="text-slate-200">Bengaluru, Karnataka</span>{" "}
              for resolution of any disputes arising out of or relating to
              these Terms or the Service.
            </p>
            <p>
              Before initiating formal legal proceedings, both parties agree
              to attempt to resolve any dispute through good-faith
              negotiations for a period of at least 30 days. If the dispute
              cannot be resolved through negotiation, either party may pursue
              arbitration under the Arbitration and Conciliation Act, 1996,
              with the seat of arbitration in Bengaluru, India.
            </p>
          </div>
        </section>

        {/* 11. Changes to Terms */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
            <span className="text-blue-400 font-mono text-sm">11.</span>
            Changes to Terms
          </h2>
          <div className="space-y-3 text-slate-300 leading-relaxed">
            <p>
              We reserve the right to modify these Terms at any time. When we
              make material changes, we will notify you via email (to the
              address associated with your account) and/or by displaying a
              prominent notice within the Service at least 14 days before the
              changes take effect.
            </p>
            <p>
              Your continued use of the Service after the effective date of
              the revised Terms constitutes your acceptance of the updated
              Terms. If you do not agree with the revised Terms, you must
              stop using the Service and terminate your account before the
              effective date.
            </p>
          </div>
        </section>

        {/* 12. Contact */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
            <span className="text-blue-400 font-mono text-sm">12.</span>
            Contact Us
          </h2>
          <div className="space-y-3 text-slate-300 leading-relaxed">
            <p>
              If you have any questions, concerns, or feedback regarding these
              Terms of Service, please reach out to us:
            </p>
            <div className="p-5 rounded-xl border border-slate-700 bg-slate-800/50 space-y-2">
              <p className="font-semibold text-white">
                Rokadd Technologies Private Limited
              </p>
              <p className="text-slate-400 text-sm">
                Email:{" "}
                <a
                  href="mailto:legal@rokadd.in"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  legal@rokadd.in
                </a>
              </p>
              <p className="text-slate-400 text-sm">
                Support:{" "}
                <a
                  href="mailto:support@rokadd.in"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  support@rokadd.in
                </a>
              </p>
              <p className="text-slate-400 text-sm">
                Address: 4th Floor, Brigade Tech Park, Whitefield,
                Bengaluru — 560 066, Karnataka, India
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-800 mt-16 pt-8">
        <p className="text-slate-500 text-sm text-center">
          By using Rokadd you acknowledge that you have read, understood,
          and agree to these Terms of Service.
        </p>
      </div>
    </div>
  );
}
