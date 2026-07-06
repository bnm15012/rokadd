export const metadata = { title: "Privacy Policy | Rokadd" };

export default function PrivacyPage() {
  return (
    <div className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
          {/* Header */}
          <p className="text-slate-500 text-sm mb-2">Last updated: June 15, 2025</p>
          <h1 className="text-white text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-slate-300 text-lg mb-12">
            At Rokadd, your privacy is important to us. This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you use our multi-tenant
            SaaS platform built for Indian retail and wholesale businesses. Please read this policy
            carefully.
          </p>

          {/* Section 1 */}
          <section className="mb-10">
            <h2 className="text-white text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="text-slate-300 mb-4">
              We collect information that you provide directly to us and information generated
              automatically through your use of the platform.
            </p>
            <h3 className="text-blue-400 font-medium mb-2">Account & Business Information</h3>
            <ul className="text-slate-300 list-disc list-inside space-y-2 mb-4">
              <li>Business name, GST number, PAN, and registered address</li>
              <li>Owner name, email address, and mobile number</li>
              <li>Bank account details used for reconciliation (read-only metadata only)</li>
              <li>Employee and staff information added by the account administrator</li>
            </ul>
            <h3 className="text-blue-400 font-medium mb-2">Transactional Data</h3>
            <ul className="text-slate-300 list-disc list-inside space-y-2 mb-4">
              <li>Inventory records, stock movements, and purchase orders</li>
              <li>Sales invoices, customer ledger (khata) entries, and payment receipts</li>
              <li>Vendor credit notes, outstanding dues, and supplier details</li>
              <li>Cash flow entries, expense records, and journal entries</li>
            </ul>
            <h3 className="text-blue-400 font-medium mb-2">Usage & Technical Data</h3>
            <ul className="text-slate-300 list-disc list-inside space-y-2">
              <li>IP address, browser type, device identifiers, and operating system</li>
              <li>Pages visited, features used, and session duration</li>
              <li>Error logs and crash reports to improve platform stability</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="mb-10">
            <h2 className="text-white text-2xl font-semibold mb-4">
              2. How We Use Your Information
            </h2>
            <p className="text-slate-300 mb-4">
              We use the information we collect for the following purposes:
            </p>
            <ul className="text-slate-300 list-disc list-inside space-y-2">
              <li>To create and manage your tenant account and business workspace</li>
              <li>
                To operate core features including inventory management, cash flow tracking, vendor
                credit management, and customer khata
              </li>
              <li>
                To generate reports, analytics, and business insights specific to your organisation
              </li>
              <li>To send transactional notifications such as payment reminders and low-stock alerts</li>
              <li>To provide customer support and respond to your queries</li>
              <li>To detect, prevent, and investigate fraud, abuse, or security incidents</li>
              <li>To comply with applicable Indian laws and regulatory requirements</li>
              <li>
                To improve the platform through anonymised, aggregated usage analytics — no
                personally identifiable business data is used for this purpose
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="mb-10">
            <h2 className="text-white text-2xl font-semibold mb-4">
              3. Data Storage &amp; Security
            </h2>
            <p className="text-slate-300 mb-4">
              Your data is stored on servers located within India or in data centres that comply
              with equivalent data-protection standards. We implement the following technical and
              organisational measures to protect your information:
            </p>
            <ul className="text-slate-300 list-disc list-inside space-y-2 mb-4">
              <li>AES-256 encryption at rest for all tenant databases</li>
              <li>TLS 1.2+ encryption in transit for all data exchanged between your device and our servers</li>
              <li>Role-based access control (RBAC) ensuring staff can only access data relevant to their role</li>
              <li>Multi-tenant data isolation: each business's data is logically separated and inaccessible to other tenants</li>
              <li>Automated daily backups with point-in-time recovery capability</li>
              <li>Periodic third-party security audits and vulnerability assessments</li>
            </ul>
            <p className="text-slate-300">
              While we take reasonable steps to protect your data, no system is completely immune
              to breaches. In the event of a security incident affecting your data, we will notify
              you within 72 hours as required by applicable regulations.
            </p>
          </section>

          {/* Section 4 */}
          <section className="mb-10">
            <h2 className="text-white text-2xl font-semibold mb-4">4. Third-Party Services</h2>
            <p className="text-slate-300 mb-4">
              We integrate with selected third-party services to deliver certain features. These
              providers are contractually required to handle your data securely and only for the
              purposes we specify:
            </p>
            <ul className="text-slate-300 list-disc list-inside space-y-2 mb-4">
              <li>
                <span className="text-blue-400">Payment gateways</span> — Razorpay or equivalent,
                for processing subscription payments (we never store raw card details)
              </li>
              <li>
                <span className="text-blue-400">SMS &amp; WhatsApp notifications</span> — for
                payment reminders and khata statements sent to your customers
              </li>
              <li>
                <span className="text-blue-400">Cloud infrastructure</span> — AWS or equivalent
                cloud provider for hosting, storage, and compute
              </li>
              <li>
                <span className="text-blue-400">Analytics</span> — anonymised, aggregated
                event-level analytics to improve the product
              </li>
            </ul>
            <p className="text-slate-300">
              We do not sell, rent, or trade your business data or customer information to any
              third party for marketing or advertising purposes.
            </p>
          </section>

          {/* Section 5 */}
          <section className="mb-10">
            <h2 className="text-white text-2xl font-semibold mb-4">5. Cookies</h2>
            <p className="text-slate-300 mb-4">
              Rokadd uses cookies and similar tracking technologies to keep you signed in,
              remember your preferences, and understand how the platform is used.
            </p>
            <ul className="text-slate-300 list-disc list-inside space-y-2">
              <li>
                <span className="text-blue-400">Essential cookies</span> — required for
                authentication and core platform functionality; cannot be disabled
              </li>
              <li>
                <span className="text-blue-400">Preference cookies</span> — remember your language,
                currency, and display settings
              </li>
              <li>
                <span className="text-blue-400">Analytics cookies</span> — collect anonymised usage
                data to help us improve the product; you may opt out via account settings
              </li>
            </ul>
            <p className="text-slate-300 mt-4">
              You can configure cookie behaviour through your browser settings. Disabling essential
              cookies will prevent you from using the platform.
            </p>
          </section>

          {/* Section 6 */}
          <section className="mb-10">
            <h2 className="text-white text-2xl font-semibold mb-4">6. Your Rights</h2>
            <p className="text-slate-300 mb-4">
              As a user of Rokadd, you have the following rights regarding your personal and
              business data, subject to applicable Indian law including the Digital Personal Data
              Protection Act, 2023:
            </p>
            <ul className="text-slate-300 list-disc list-inside space-y-2">
              <li>
                <span className="text-blue-400">Right to access</span> — request a copy of the
                personal data we hold about you
              </li>
              <li>
                <span className="text-blue-400">Right to correction</span> — request correction of
                inaccurate or incomplete data
              </li>
              <li>
                <span className="text-blue-400">Right to erasure</span> — request deletion of your
                account and associated personal data (subject to legal retention obligations)
              </li>
              <li>
                <span className="text-blue-400">Right to data portability</span> — export your
                business data in standard formats (CSV, PDF) at any time from account settings
              </li>
              <li>
                <span className="text-blue-400">Right to withdraw consent</span> — for
                non-essential processing such as marketing communications
              </li>
              <li>
                <span className="text-blue-400">Right to grievance redressal</span> — raise a
                complaint with our Data Protection Officer or the relevant regulatory authority
              </li>
            </ul>
            <p className="text-slate-300 mt-4">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:bookandmanage@gmail.com" className="text-blue-400 hover:underline">
                bookandmanage@gmail.com
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          {/* Section 7 */}
          <section className="mb-10">
            <h2 className="text-white text-2xl font-semibold mb-4">7. Data Retention</h2>
            <p className="text-slate-300 mb-4">
              We retain your data for as long as your account is active or as necessary to provide
              services, comply with legal obligations, resolve disputes, and enforce our agreements.
            </p>
            <ul className="text-slate-300 list-disc list-inside space-y-2">
              <li>
                Account and profile data is retained for the duration of your subscription and for
                up to 90 days after account closure, after which it is permanently deleted
              </li>
              <li>
                Financial and transactional records (invoices, ledger entries, GST data) are
                retained for a minimum of 7 years as required under Indian tax and accounting laws
              </li>
              <li>
                Anonymised usage logs may be retained indefinitely for product improvement
              </li>
            </ul>
            <p className="text-slate-300 mt-4">
              You may request early deletion of personal data by contacting our support team,
              subject to our legal retention obligations.
            </p>
          </section>

          {/* Section 8 */}
          <section className="mb-10">
            <h2 className="text-white text-2xl font-semibold mb-4">
              8. Changes to This Policy
            </h2>
            <p className="text-slate-300 mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our
              practices, technology, legal requirements, or other factors. When we make material
              changes, we will:
            </p>
            <ul className="text-slate-300 list-disc list-inside space-y-2">
              <li>Update the "Last updated" date at the top of this page</li>
              <li>Send an in-app notification and email to all account administrators</li>
              <li>
                Provide at least 14 days' notice before material changes take effect, where
                reasonably practicable
              </li>
            </ul>
            <p className="text-slate-300 mt-4">
              Your continued use of Rokadd after the effective date of any changes constitutes
              your acceptance of the revised policy.
            </p>
          </section>

          {/* Section 9 */}
          <section className="mb-10">
            <h2 className="text-white text-2xl font-semibold mb-4">9. Contact Us</h2>
            <p className="text-slate-300 mb-4">
              If you have questions, concerns, or complaints about this Privacy Policy or our data
              practices, please reach out to our Data Protection Officer:
            </p>
            <div className="bg-slate-800 rounded-xl p-6 text-slate-300 space-y-2">
              <p>
                <span className="text-white font-medium">Rokadd Technologies Pvt. Ltd.</span>
              </p>
              <p>Attn: Data Protection Officer</p>
              <p>
                Email:{" "}
                <a href="mailto:bookandmanage@gmail.com" className="text-blue-400 hover:underline">
                  bookandmanage@gmail.com
                </a>
              </p>
              <p>
                Support:{" "}
                <a href="mailto:bookandmanage@gmail.com" className="text-blue-400 hover:underline">
                  bookandmanage@gmail.com
                </a>
              </p>
              <p className="text-slate-500 text-sm pt-2">
                We aim to respond to all privacy-related enquiries within 30 business days.
              </p>
            </div>
          </section>
      </div>
    </div>
  );
}
