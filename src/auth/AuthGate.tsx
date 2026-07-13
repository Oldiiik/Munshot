import { useMemo, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Lock, Mail } from "lucide-react";
import { Button } from "../components/ui/button";
import { Logo } from "../landing/Logo";
import { useTheme, ThemeToggle } from "../lib/theme";
import { useAuth } from "./AuthContext";
import { register } from "../lib/api";
import { navigate } from "../lib/router";

type Tab = "signin" | "register";

interface Props {
  initialTab?: Tab;
  onBack?: () => void;
}

/** A dedicated, full-bleed auth page: a majestic cosmic stage with the auth
 *  block floating to the right, vertically centered. Demo build — any
 *  email/password signs in instantly. */
export function AuthGate({ initialTab = "signin", onBack }: Props = {}) {
  const { signIn } = useAuth();
  const { theme } = useTheme();
  const light = theme === "light";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register_ = tab === "register";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (register_) {
        await register({ email: email.trim(), password });
        await signIn(email.trim(), password);
      } else {
        await signIn(email.trim(), password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function switchTab(t: Tab) {
    setTab(t);
    setError(null);
    navigate(t === "register" ? "/register" : "/signin", { replace: true });
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 text-white sm:px-8 lg:justify-end lg:px-[7vw]"
      style={{ background: light ? "#f7f5f2" : "#06060a" }}
    >
      <CosmicBackdrop light={light} />
      <BrandCopy />

      {/* theme toggle */}
      <div className="absolute right-5 top-5 z-30 sm:right-8 sm:top-6">
        <ThemeToggle />
      </div>

      {/* ---------- Auth block — right-centered ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 w-full max-w-md"
      >
        {/* majestic halo behind the block */}
        <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[40px] bg-white/[0.06] blur-3xl" />

        <div className="ms-glass-strong rounded-[30px] p-8 sm:p-10">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mb-7 inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white"
            >
              <ArrowLeft className="size-3.5" /> Back to site
            </button>
          )}

          <div className="mb-7 flex items-center gap-2">
            <Logo className="size-6 text-white" />
            <span className="text-[15px] font-semibold tracking-tight">Moonshot</span>
          </div>

          <h1 className="font-display text-[1.9rem] leading-tight tracking-tight">
            {register_ ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-white/50">
            {register_
              ? "Start turning briefs into finished, on-brand decks."
              : "Sign in to pick up where your decks left off."}
          </p>

          {/* tab switcher */}
          <div className="mt-7 grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1 text-sm">
            {(["signin", "register"] as Tab[]).map((t) => {
              const active = tab === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => switchTab(t)}
                  className="relative rounded-full py-2 font-medium"
                >
                  {active && (
                    <motion.span
                      layoutId="auth-tab"
                      className="absolute inset-0 rounded-full bg-white"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className={`relative ${active ? "text-black" : "text-white/55"}`}>
                    {t === "signin" ? "Sign in" : "Sign up"}
                  </span>
                </button>
              );
            })}
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Field
              id="email"
              type="email"
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              icon={<Mail className="size-4" />}
            />
            <Field
              id="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
              minLength={8}
              icon={<Lock className="size-4" />}
            />

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={busy}
              className="ms-btn group h-11 w-full rounded-full text-[15px]"
            >
              {busy ? (
                "Please wait…"
              ) : (
                <>
                  {register_ ? "Create account" : "Sign in"}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-white/35">
            Demo mode — any email and password works. Nothing leaves your browser.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

/** A labelled input with a leading icon and a focus ring that lights up. */
function Field({
  id,
  label,
  type,
  placeholder,
  value,
  onChange,
  icon,
  minLength,
}: {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
  minLength?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-white/60">
        {label}
      </label>
      <div className="group relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35 transition-colors group-focus-within:text-white/70">
          {icon}
        </span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          minLength={minLength}
          className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-3 text-[15px] text-white outline-none transition-all placeholder:text-white/30 focus:border-white/25 focus:bg-white/[0.05] focus:ring-4 focus:ring-white/[0.06]"
        />
      </div>
    </div>
  );
}

/** Brand copy pinned to the left of the stage — the majestic headline. lg+ only. */
function BrandCopy() {
  const points = [
    "Reads your brand from a logo and a brief",
    "Every slide rendered — never a template",
    "Export to PDF, PNG or live Canva",
  ];
  return (
    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-[46%] flex-col justify-center pl-[7vw] pr-10 lg:flex">
      <h2 className="font-display font-display-tight text-[clamp(2.8rem,4.4vw,4.4rem)] leading-[1]">
        The deck your <span className="ms-accent">brand deserves.</span>
      </h2>
      <ul className="mt-9 space-y-3.5">
        {points.map((p) => (
          <li key={p} className="flex items-center gap-3 text-[15px] text-white/70">
            <span className="grid size-5 shrink-0 place-items-center rounded-full border border-white/15 bg-white/[0.05]">
              <Check className="size-3" />
            </span>
            {p}
          </li>
        ))}
      </ul>
      <p className="mt-12 max-w-sm text-sm leading-relaxed text-white/40">
        “A sentence in, a whole deck out — and it actually looked like us.”
        <span className="mt-1 block text-white/30">Early access user</span>
      </p>
    </div>
  );
}

const DAWN_MOTES = ["255,255,255", "255,224,178", "227,201,246", "247,201,216", "199,226,241"];

/** Full-bleed stage: deep-space nebula by night, luminous dawn by day. */
function CosmicBackdrop({ light }: { light: boolean }) {
  const stars = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 1.6 + 0.5,
        delay: Math.random() * 4,
        dur: Math.random() * 3 + 2.4,
        tint: DAWN_MOTES[i % DAWN_MOTES.length],
      })),
    []
  );
  return (
    <div className="ms-grain pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {light ? (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#f3f2f6_0%,#f6f0ea_52%,#f1e6db_100%)]" />
          <div className="absolute left-[2%] -top-[8%] size-[42vw] rounded-full bg-[radial-gradient(circle,rgba(255,231,193,0.85),rgba(255,225,205,0.25)_45%,transparent_70%)] blur-[40px]" />
          <div className="absolute -left-[8%] top-[6%] size-[40vw] rounded-full bg-[rgb(197,190,244)] opacity-[0.5] blur-[100px]" />
          <div className="absolute -right-[6%] bottom-0 size-[38vw] rounded-full bg-[rgb(249,196,210)] opacity-[0.5] blur-[100px]" />
        </>
      ) : (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center opacity-70"
            style={{
              backgroundImage: "url(/hero-bg.webp)",
              WebkitMaskImage: "radial-gradient(130% 110% at 35% 25%, #000 45%, transparent 88%)",
              maskImage: "radial-gradient(130% 110% at 35% 25%, #000 45%, transparent 88%)",
            }}
          />
          <div className="absolute -left-[8%] top-[4%] size-[34rem] rounded-full bg-[rgb(80,80,120)] opacity-20 blur-[110px]" />
          <div className="absolute -right-[6%] bottom-0 size-[32rem] rounded-full bg-[rgb(120,90,130)] opacity-20 blur-[110px]" />
        </>
      )}

      {/* the grand moon — warm halo + grounded disc by day, night glow by night */}
      <div className="absolute left-[8%] top-[10%]" style={{ animation: "ms-float 10s ease-in-out infinite" }}>
        {light && (
          <div className="absolute left-1/2 top-1/2 size-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,238,214,0.6),transparent_62%)] blur-[10px]" />
        )}
        <img
          src="/moon-orb.webp"
          alt=""
          className={`ms-moon relative w-64 xl:w-80 ${
            light ? "" : "opacity-80 drop-shadow-[0_0_80px_rgba(150,170,255,0.28)]"
          }`}
        />
      </div>

      <div className="absolute inset-0">
        {stars.map((s) => (
          <span
            key={s.id}
            className="absolute rounded-full"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: s.size * (light ? 1.8 : 1),
              height: s.size * (light ? 1.8 : 1),
              backgroundColor: light ? `rgb(${s.tint})` : "#ffffff",
              opacity: light ? 0.55 : 0.9,
              boxShadow: light ? `0 0 7px 2px rgba(${s.tint},0.7)` : undefined,
              animation: `ms-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
