import { ArrowLeft } from "lucide-react";
import { Logo } from "./Logo";

export type LegalDoc = "terms" | "privacy" | "refunds";

const UPDATED = "June 20, 2026";
const CONTACT = "support@moonshot.app"; // TODO: replace with your real support email

interface Section {
  h: string;
  /** Each entry is a paragraph; arrays render as bullet lists. */
  body: (string | string[])[];
}

const DOCS: Record<LegalDoc, { title: string; intro: string; sections: Section[] }> = {
  terms: {
    title: "Terms of Service",
    intro:
      "These Terms of Service (\u201cTerms\u201d) govern your access to and use of Moonshot (the \u201cService\u201d). By creating an account, subscribing to a paid plan, or otherwise using the Service, you agree to these Terms.",
    sections: [
      {
        h: "1. The service",
        body: [
          "Moonshot turns a written brief and your brand assets into an AI-generated slide deck. The Service drafts an editable outline and renders each slide as an image. AI output may contain errors or inaccuracies; you are responsible for reviewing every deck before relying on or distributing it.",
        ],
      },
      {
        h: "2. Eligibility & accounts",
        body: [
          "You must be at least 13 years old (or the age of digital consent in your country) to use the Service. You are responsible for safeguarding your account credentials and for all activity under your account. Access may be invite-gated; you may not share, sell, or transfer invite codes except as permitted.",
        ],
      },
      {
        h: "3. Plans, billing & limits",
        body: [
          "The Service is offered in tiers: Free (1 deck per day), Pro ($20/month, 3 decks per day plus web search and Pro reasoning mode), and Ultra ($60/month, unlimited decks with highest-priority rendering). Daily limits reset every 24 hours.",
          "Paid plans are billed in advance on a recurring monthly basis through our third-party payment processor until cancelled. By subscribing you authorize us to charge your payment method for each renewal. Prices are in U.S. dollars and exclude any applicable taxes. We may change pricing or plan features with reasonable prior notice; changes apply to the next billing cycle.",
        ],
      },
      {
        h: "4. Acceptable use",
        body: [
          "You agree not to:",
          [
            "Upload content you do not have the rights to use, or that infringes others\u2019 intellectual property.",
            "Generate unlawful, deceptive, hateful, or harmful content.",
            "Attempt to circumvent usage limits, rate limits, or access controls.",
            "Reverse engineer, resell, or abuse the Service or its underlying generation engine.",
          ],
        ],
      },
      {
        h: "5. Your content & ownership",
        body: [
          "You retain ownership of the briefs and brand assets you upload (\u201cInput\u201d) and, to the extent permitted by law, the decks you generate (\u201cOutput\u201d). You grant us a limited license to process your Input and Output solely to operate and improve the Service. You are responsible for ensuring your Input and Output comply with applicable law and third-party rights.",
        ],
      },
      {
        h: "6. Termination",
        body: [
          "You may stop using the Service and cancel your subscription at any time. We may suspend or terminate access if you breach these Terms or use the Service in a way that risks harm to us, other users, or third parties. Sections that by their nature should survive termination (ownership, disclaimers, liability) will survive.",
        ],
      },
      {
        h: "7. Disclaimers & liability",
        body: [
          "The Service is provided \u201cas is\u201d without warranties of any kind. To the maximum extent permitted by law, Moonshot is not liable for any indirect, incidental, or consequential damages, and our total liability is limited to the amount you paid us in the 12 months preceding the claim.",
        ],
      },
      {
        h: "8. Changes & contact",
        body: [
          `We may update these Terms from time to time; material changes will be communicated through the Service. Questions about these Terms can be sent to ${CONTACT}.`,
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro:
      "This Privacy Policy explains what we collect, how we use it, and the choices you have. It applies to your use of Moonshot.",
    sections: [
      {
        h: "1. What we collect",
        body: [
          "Account data: your email and authentication details.",
          "Content: the briefs you write and the brand assets (logos, references, documents) you upload, plus the decks and slides you generate.",
          "Usage data: generation events, token usage, timestamps, and basic device/log information used to operate and secure the Service.",
        ],
      },
      {
        h: "2. How we use it",
        body: [
          "We use your data to authenticate you, generate and store your decks, enforce plan limits, process payments, provide support, and maintain the security and reliability of the Service.",
        ],
      },
      {
        h: "3. Service providers",
        body: [
          "We rely on third parties to run the Service, including a cloud database/authentication/storage provider (Supabase), an AI generation provider used to plan and render decks, and a payment processor for subscriptions. These providers process data on our behalf under their own terms and security commitments.",
        ],
      },
      {
        h: "4. Storage, security & retention",
        body: [
          "Uploaded assets and rendered slides are stored in private buckets and served via short-lived signed URLs. We retain your content while your account is active and delete or anonymize it within a reasonable period after account closure, except where retention is required by law.",
        ],
      },
      {
        h: "5. Your rights",
        body: [
          `Depending on your location, you may have the right to access, correct, export, or delete your personal data. To exercise these rights, contact us at ${CONTACT}.`,
        ],
      },
      {
        h: "6. Cookies & children",
        body: [
          "We use only the cookies/local storage necessary to keep you signed in and remember preferences (such as language). The Service is not directed to children under 13.",
        ],
      },
      {
        h: "7. Changes & contact",
        body: [
          `We may update this policy; material changes will be communicated through the Service. For privacy questions, contact ${CONTACT}.`,
        ],
      },
    ],
  },
  refunds: {
    title: "Refund & Cancellation Policy",
    intro:
      "This policy explains how subscriptions are billed, cancelled, and refunded.",
    sections: [
      {
        h: "1. Billing",
        body: [
          "Pro and Ultra plans are billed monthly in advance and renew automatically until cancelled. Charges are processed by our third-party payment provider.",
        ],
      },
      {
        h: "2. Cancellation",
        body: [
          "You can cancel at any time from your account settings. Cancellation stops future renewals; you keep access to your paid features until the end of the current billing period.",
        ],
      },
      {
        h: "3. Refunds",
        body: [
          "Payments are generally non-refundable, and we do not provide prorated refunds for partial billing periods. If you believe you were charged in error or experienced a significant Service failure, contact us within 14 days of the charge and we will review your request in good faith.",
        ],
      },
      {
        h: "4. Contact",
        body: [`For billing questions or refund requests, email ${CONTACT}.`],
      },
    ],
  },
};

function Para({ block }: { block: string | string[] }) {
  if (Array.isArray(block)) {
    return (
      <ul className="ml-1 list-disc space-y-2 pl-5 text-white/65">
        {block.map((li, i) => (
          <li key={i}>{li}</li>
        ))}
      </ul>
    );
  }
  return <p className="text-white/65">{block}</p>;
}

export function Legal({ doc }: { doc: LegalDoc }) {
  const d = DOCS[doc];
  return (
    <div className="landing-scroll bg-[#08080a] text-white">
      <div className="relative z-10">
        <header className="sticky top-0 z-50 px-4 pt-4">
          <nav className="mx-auto flex max-w-3xl items-center justify-between rounded-full border border-white/10 bg-black/40 py-2 pl-5 pr-3 backdrop-blur-xl">
            <a href="/" className="flex items-center gap-2">
              <Logo className="size-6 text-white" />
              <span className="text-[15px] font-semibold tracking-tight">Moonshot</span>
            </a>
            <a
              href="/"
              className="flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
            >
              <ArrowLeft className="size-3.5" /> Back to home
            </a>
          </nav>
        </header>

        <main className="mx-auto max-w-3xl px-5 py-16">
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">{d.title}</h1>
          <p className="mt-2 text-sm text-white/40">Last updated: {UPDATED}</p>
          <p className="mt-6 leading-relaxed text-white/70">{d.intro}</p>

          <div className="mt-10 space-y-9">
            {d.sections.map((s) => (
              <section key={s.h}>
                <h2 className="mb-3 text-lg font-semibold text-white">{s.h}</h2>
                <div className="space-y-3 leading-relaxed">
                  {s.body.map((b, i) => (
                    <Para key={i} block={b} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-14 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-8 text-sm text-white/50">
            <a href="/terms" className="transition-colors hover:text-white">Terms of Service</a>
            <a href="/privacy" className="transition-colors hover:text-white">Privacy Policy</a>
            <a href="/refunds" className="transition-colors hover:text-white">Refunds</a>
          </div>
        </main>
      </div>
    </div>
  );
}
