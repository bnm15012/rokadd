import ContactForm from "./contact-form";

export const metadata = { title: "Contact Us | Rokadd" };

const contactCards = [
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
      >
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    label: "Email",
    sublabel: "Support",
    value: "bookandmanage@gmail.com",
    href: "mailto:bookandmanage@gmail.com",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
      >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.56 2 2 0 0 1 3.62 1.4h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.08 6.08l.96-.96a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
    label: "Phone",
    sublabel: "Call us directly",
    value: "+91 73260 27500",
    href: "tel:+917326027500",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
      >
        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    label: "Office Address",
    sublabel: "Headquarters",
    value: "Mumbai, Maharashtra, India",
    href: null,
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    label: "Business Hours",
    sublabel: "We\u2019re available",
    value: "Mon\u2013Sat\u00a0|\u00a09:00\u202fAM\u2013\u202f6:00\u202fPM IST",
    href: null,
  },
];

export default function ContactPage() {
  return (
    <div className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Contact Us</h1>
          <p className="text-slate-300 text-lg max-w-xl mx-auto">
            Have a question or need help? We&apos;d love to hear from you.
            Reach out and our team will get back to you as soon as possible.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Left: Contact info cards */}
          <div className="flex flex-col gap-5">
            {contactCards.map((card) => (
              <div
                key={card.label}
                className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400">
                    {card.icon}
                  </div>
                  <h2 className="text-white font-semibold text-base">
                    {card.label}
                  </h2>
                </div>
                <p className="text-slate-400 text-sm mb-1">{card.sublabel}</p>
                {card.href ? (
                  <a
                    href={card.href}
                    className="text-slate-300 hover:text-blue-400 transition-colors text-sm"
                  >
                    {card.value}
                  </a>
                ) : (
                  <p className="text-slate-300 text-sm">{card.value}</p>
                )}
              </div>
            ))}
          </div>

          {/* Right: Contact form (Client Component) */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-8">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
