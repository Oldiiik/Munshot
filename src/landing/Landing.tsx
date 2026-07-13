import { useMemo, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import {
  ArrowRight,
  ChevronDown,
  ExternalLink,
  Fingerprint,
  ImageIcon,
  Layers,
  ListTree,
  PenLine,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme, ThemeToggle } from "@/lib/theme";
import { Logo } from "./Logo";
import { HeroPrompt } from "./HeroPrompt";
import { FeatureScene } from "./FeatureScene";
import { DeckShowcase } from "./DeckShowcase";
import { ExportShowcase } from "./ExportShowcase";
import { ScrollAtmosphere } from "./ScrollAtmosphere";
import { ScrollContainerContext } from "./scroll";
import { Pricing } from "./Pricing";
import { Faq } from "./Faq";
import { I18nProvider, useI18n, type Lang } from "./i18n";

type AuthTab = "signin" | "register";

interface Props {
  onAuth: (tab: AuthTab, brief?: string) => void;
}

function Starfield({ count = 50 }: { count?: number }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 1.6 + 0.5,
        delay: Math.random() * 4,
        dur: Math.random() * 3 + 2,
      })),
    [count]
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            animation: `ms-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function LangToggle() {
  const { lang, setLang } = useI18n();
  const langs: Lang[] = ["en", "ru"];
  return (
    <div className="relative flex items-center rounded-full border border-white/10 bg-white/[0.03] p-0.5 text-xs">
      {langs.map((l) => {
        const active = lang === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            className="relative rounded-full px-2.5 py-1 font-medium uppercase tracking-wide"
          >
            {active && (
              <motion.span
                layoutId="lang-pill"
                className="absolute inset-0 rounded-full bg-white/15"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className={`relative ${active ? "text-white" : "text-white/45"}`}>
              {l}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Center nav links with a soft highlight that glides between them on hover. */
function NavLinks() {
  const { t } = useI18n();
  const [hovered, setHovered] = useState<string | null>(null);
  const links = [
    { href: "#generate", label: "Generate" },
    { href: "#edit", label: "Edit" },
    { href: "#output", label: "Examples" },
    { href: "#export", label: "Export" },
    { href: "#pricing", label: t.nav.pricing },
  ];
  return (
    <div
      onMouseLeave={() => setHovered(null)}
      className="relative hidden items-center md:flex"
    >
      {links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          onMouseEnter={() => setHovered(l.href)}
          className="relative rounded-full px-3.5 py-1.5 text-sm text-white/60 transition-colors duration-300 hover:text-white"
        >
          {hovered === l.href && (
            <motion.span
              layoutId="nav-highlight"
              className="absolute inset-0 -z-0 rounded-full bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
              transition={{ type: "spring", stiffness: 480, damping: 40 }}
            />
          )}
          <span className="relative z-10">{l.label}</span>
        </a>
      ))}
    </div>
  );
}

function LandingInner({ onAuth }: Props) {
  const { t } = useI18n();
  const { theme } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);

  // condense the nav once the page leaves the very top
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll({ container: scrollRef });
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 16));

  return (
    <ScrollContainerContext.Provider value={scrollRef}>
    <div
      ref={scrollRef}
      className="landing-scroll text-white"
    >
      {/* scroll-reactive parallax backdrop */}
      <ScrollAtmosphere theme={theme} />

      <div className="relative z-10">
        {/* ---------- Nav ---------- */}
        <header className="sticky top-0 z-50 px-4 pt-4">
          <div
            className={`ms-force-dark relative mx-auto text-white transition-[max-width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              scrolled ? "max-w-4xl" : "max-w-6xl"
            }`}
          >
            {/* soft aura that deepens as you scroll — the magical lift */}
            <div
              className={`pointer-events-none absolute -inset-x-6 -bottom-6 -top-2 -z-10 rounded-full bg-white/10 blur-2xl transition-opacity duration-500 ${
                scrolled ? "opacity-100" : "opacity-0"
              }`}
            />
            <nav
              className={`ms-glass flex items-center justify-between rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                scrolled
                  ? "py-1.5 pl-5 pr-1.5 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.7)]"
                  : "py-2 pl-5 pr-2"
              }`}
            >
              {/* bright specular top edge — the luxury hairline (stays light in both themes) */}
              <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.45)] to-transparent" />

              <a href="#top" className="group flex items-center gap-2">
                <span className="relative">
                  <Logo className="size-6 text-white transition-transform duration-500 group-hover:rotate-[8deg]" />
                  <span className="absolute inset-0 -z-10 rounded-full bg-[rgba(255,255,255,0.5)] opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-60" />
                </span>
                <span className="text-[15px] font-semibold tracking-tight">Moonshot</span>
              </a>

              <NavLinks />

              <div className="flex items-center gap-1.5">
                <ThemeToggle />
                <LangToggle />
                <span className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAuth("signin")}
                  className="hidden min-w-[76px] justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white sm:inline-flex"
                >
                  {t.nav.signIn}
                </Button>
                <Button
                  size="sm"
                  onClick={() => onAuth("register")}
                  className="ms-btn min-w-[120px] justify-center rounded-full sm:min-w-[132px]"
                >
                  {t.nav.getStarted} <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </nav>
          </div>
        </header>

        {/* ---------- Hero ---------- */}
        <section
          id="top"
          className="ms-grain relative overflow-hidden px-4 pb-24 pt-24 sm:pt-32"
        >
          {/* background layers — the hero photo dissolves on an organic mask
              into the shared fixed <ScrollAtmosphere/> behind it, so the hero's
              lower half shows the exact same live nebula as the sections below
              (no flat-black band, no hard seam) */}
          <div className="pointer-events-none absolute inset-0">
            <div
              className="ms-photo absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: "url(/hero-bg.webp)",
                WebkitMaskImage:
                  "radial-gradient(150% 96% at 50% -2%, #000 38%, rgba(0,0,0,0.5) 64%, transparent 82%)",
                maskImage:
                  "radial-gradient(150% 96% at 50% -2%, #000 38%, rgba(0,0,0,0.5) 64%, transparent 82%)",
              }}
            />
            <div className="ms-darkveil absolute inset-0 bg-[radial-gradient(900px_520px_at_50%_38%,rgba(6,6,10,0.72),transparent_70%)]" />
            <div className="ms-darkveil absolute inset-0 bg-gradient-to-b from-[#06060a]/30 via-transparent to-transparent" />
            <Starfield count={22} />
            {/* the drifting moon lives once, in <ScrollAtmosphere/>, so the hero
                shows a single moon in every theme (no day-time double) */}
          </div>

          <div className="relative mx-auto max-w-3xl text-center">
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="font-display font-display-tight text-[clamp(3rem,8vw,5.5rem)] leading-[0.95] text-white"
            >
              {t.hero.title1}
              <br />
              <span className="ms-accent">{t.hero.title2}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mx-auto mt-5 max-w-xl text-pretty text-base text-white/60 sm:text-lg"
            >
              {t.hero.subtitle}
            </motion.p>

            <div className="mt-10">
              <HeroPrompt onSubmit={(brief) => onAuth("register", brief)} />
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="mt-16 flex justify-center"
            >
              <ChevronDown className="size-5 animate-bounce text-white/30" />
            </motion.div>
          </div>
        </section>

        {/* ---------- Generate ---------- */}
        <FeatureScene
          id="generate"
          kicker="Generate"
          glow="from-white/12 via-white/5"
          title={
            <>
              A sentence in.
              <br />A whole deck out.
            </>
          }
          points={[
            { icon: Fingerprint, label: "Reads your brand", body: "Logo, refs and docs go in; the look comes back inferred, not templated." },
            { icon: ListTree, label: "Editable outline", body: "Reorder, rewrite and trim the plan before a single slide renders." },
            { icon: ImageIcon, label: "Rendered, not faked", body: "Each slide is a real image, one consistent visual system across the deck." },
          ]}
          video="/demo/generate.mp4"
        />

        {/* ---------- Edit ---------- */}
        <FeatureScene
          id="edit"
          kicker="Edit"
          flip
          glow="from-white/12 via-white/5"
          title={
            <>
              Then keep
              <br />editing in Canva.
            </>
          }
          points={[
            { icon: Layers, label: "Per-slide or all of it", body: "Send a single slide or batch the entire deck in one action." },
            { icon: PenLine, label: "Truly editable", body: "Live elements you can move and restyle, never a flattened export." },
            { icon: ExternalLink, label: "Straight to your account", body: "Opens in your own Canva workspace, ready to keep working." },
          ]}
          video="/demo/edit.mp4"
        />

        {/* ---------- Real output · deck showcase ---------- */}
        <DeckShowcase />

        {/* ---------- 03 · Export ---------- */}
        <section id="export" className="relative px-4 py-24 sm:py-28">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="font-display font-display-tight text-[clamp(2.4rem,5.5vw,4.5rem)] leading-[1] text-white"
            >
              One deck. Three lives.
            </motion.h2>
            <p className="mx-auto mt-4 max-w-md text-white/55">
              The same flow pitches a round, teaches a class, and ships in whatever format
              the room needs.
            </p>
          </div>
          <ExportShowcase />
        </section>

        {/* ---------- Pricing ---------- */}
        <Section
          id="pricing"
          eyebrow={t.pricing.eyebrow}
          title={t.pricing.title}
          subtitle={t.pricing.subtitle}
        >
          <Pricing onAuth={onAuth} />
          <p className="mx-auto mt-8 max-w-xl text-center text-xs leading-relaxed text-white/40">
            {t.pricing.note}{" "}
            <a href="/terms" className="underline underline-offset-2 hover:text-white/70">
              {t.footer.terms}
            </a>{" "}
            ·{" "}
            <a href="/privacy" className="underline underline-offset-2 hover:text-white/70">
              {t.footer.privacy}
            </a>
          </p>
        </Section>

        {/* ---------- FAQ ---------- */}
        <Section eyebrow={t.faq.eyebrow} title={t.faq.title}>
          <Faq />
        </Section>

        {/* ---------- CTA ---------- */}
        <section className="ms-grain relative overflow-hidden px-4 py-36">
          <div className="pointer-events-none absolute inset-0">
            <div
              className="ms-photo absolute inset-0 bg-cover bg-center opacity-70"
              style={{ backgroundImage: "url(/cta-bg.webp)" }}
            />
            <div className="ms-darkveil absolute inset-0 bg-gradient-to-b from-[#08080a] via-[#08080a]/50 to-[#08080a]" />
            <Starfield count={16} />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative mx-auto max-w-2xl text-center"
          >
            <img
              src="/moon-orb.webp"
              alt=""
              className="ms-moon mx-auto mb-2 w-36 drop-shadow-[0_0_40px_rgba(150,170,255,0.35)] sm:w-44"
              style={{ animation: "ms-float 7s ease-in-out infinite" }}
            />
            <h2 className="font-display font-display-tight text-[clamp(2.4rem,6vw,4.5rem)] leading-[1] text-white">
              {t.cta.title} <span className="ms-accent">{t.cta.accent}</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-white/60">{t.cta.subtitle}</p>
            <Button
              size="lg"
              onClick={() => onAuth("register")}
              className="ms-btn mt-8 min-w-[160px] justify-center rounded-full"
            >
              {t.cta.button} <ArrowRight className="size-4" />
            </Button>
          </motion.div>
        </section>

        {/* ---------- Footer ---------- */}
        <footer className="border-t border-white/10 px-4 py-10">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 text-sm text-white/40">
            <div className="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-2">
                <Logo className="size-5 text-white/70" />
                <span className="font-medium text-white/70">Moonshot</span>
              </div>
              <p>{t.footer.tagline}</p>
              <p>© {new Date().getFullYear()} Moonshot</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <a href="/terms" className="transition-colors hover:text-white">{t.footer.terms}</a>
              <a href="/privacy" className="transition-colors hover:text-white">{t.footer.privacy}</a>
              <a href="/refunds" className="transition-colors hover:text-white">{t.footer.refunds}</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
    </ScrollContainerContext.Provider>
  );
}

export function Landing({ onAuth }: Props) {
  return (
    <I18nProvider>
      <LandingInner onAuth={onAuth} />
    </I18nProvider>
  );
}

function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id?: string;
  /** kept for API compatibility; no longer rendered as an eyebrow */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="relative px-4 py-28">
      <div className="mx-auto mb-14 max-w-3xl text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-display-tight text-[clamp(2.6rem,6vw,4.8rem)] leading-[1.02] tracking-tight text-white"
        >
          {title}
        </motion.h2>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto mt-5 max-w-lg text-[17px] leading-relaxed text-white/55"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
      {children}
    </section>
  );
}

