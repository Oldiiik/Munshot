import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "motion/react";
import { LogoMark } from "./logo-mark";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

const sIcon = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const Icon = {
  X:     ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><path d="M6 6l12 12M18 6L6 18" /></svg>),
  Mail:  ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 7 9-7" /></svg>),
  Arrow: ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><path d="M4 12h15M13 6l6 6-6 6" /></svg>),
  Check: ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><path d="M4 12l5 5L20 6" /></svg>),
  Spark: ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></svg>),
};

type Tier = "free" | "founder";
type Status = "idle" | "loading" | "ok" | "error";

/* ---------- Pseudo-3D Moon ---------- */
function Moon({ rotateX, rotateY }: { rotateX: any; rotateY: any }) {
  const craters = useMemo(
    () => [
      { cx: 36, cy: 38, r: 6, a: 0.22 },
      { cx: 58, cy: 30, r: 3.4, a: 0.18 },
      { cx: 62, cy: 60, r: 8, a: 0.26 },
      { cx: 40, cy: 64, r: 4.2, a: 0.20 },
      { cx: 30, cy: 54, r: 2.6, a: 0.16 },
      { cx: 70, cy: 46, r: 2.2, a: 0.14 },
      { cx: 48, cy: 50, r: 1.6, a: 0.12 },
    ],
    [],
  );
  return (
    <motion.div
      style={{ rotateX, rotateY, transformPerspective: 1200, transformStyle: "preserve-3d" }}
      className="relative h-[clamp(280px,46vmin,560px)] w-[clamp(280px,46vmin,560px)]"
    >
      {/* Outer glow halos */}
      <motion.div
        aria-hidden
        animate={{ scale: [1, 1.06, 1], opacity: [0.5, 0.75, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-[-22%] rounded-full blur-[60px] bg-white/40 dark:bg-white/15"
      />
      <motion.div
        aria-hidden
        animate={{ scale: [1, 1.12, 1], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute inset-[-40%] rounded-full blur-[100px] bg-neutral-300/50 dark:bg-white/10"
      />

      {/* Sphere */}
      <div className="absolute inset-0 rounded-full overflow-hidden bg-gradient-to-br from-neutral-100 via-neutral-300 to-neutral-600 dark:from-neutral-200 dark:via-neutral-500 dark:to-neutral-900 shadow-[inset_-30px_-40px_70px_rgba(0,0,0,0.55),inset_30px_30px_70px_rgba(255,255,255,0.6),0_40px_120px_-20px_rgba(0,0,0,0.6)]">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
          {craters.map((c, i) => (
            <g key={i}>
              <circle cx={c.cx} cy={c.cy} r={c.r} fill="rgba(0,0,0,0.18)" />
              <circle cx={c.cx - c.r * 0.25} cy={c.cy - c.r * 0.25} r={c.r * 0.85} fill="rgba(255,255,255,0.18)" opacity={c.a} />
            </g>
          ))}
          {/* Specular highlight */}
          <defs>
            <radialGradient id="spec" cx="35%" cy="30%" r="40%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            <radialGradient id="shadow" cx="80%" cy="80%" r="55%">
              <stop offset="0%" stopColor="rgba(0,0,0,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="50" fill="url(#spec)" />
          <circle cx="50" cy="50" r="50" fill="url(#shadow)" />
        </svg>
      </div>

      {/* Slow orbit ring */}
      <motion.div
        aria-hidden
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-14%] rounded-full border border-black/10 dark:border-white/10"
      />
      <motion.div
        aria-hidden
        animate={{ rotate: -360 }}
        transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-28%] rounded-full border border-dashed border-black/[0.06] dark:border-white/[0.08]"
      />
    </motion.div>
  );
}

/* ---------- Tier card ---------- */
function TierCard({
  active, onClick, label, price, pitch, perks, tag,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  price: string;
  pitch: string;
  perks: string[];
  tag?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      className={`relative text-left rounded-3xl p-5 sm:p-6 transition glass-subtle border ${active ? "border-black dark:border-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)]" : "border-transparent hover:border-black/15 dark:hover:border-white/15"}`}
      data-cursor-label={active ? "Selected" : "Select"}
    >
      {tag && (
        <span className="absolute -top-2 right-5 rounded-full bg-black px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.25em] text-white dark:bg-white dark:text-black">
          {tag}
        </span>
      )}
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-500">{label}</span>
        <span className="font-semibold tracking-tight">{price}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{pitch}</p>
      <ul className="mt-3 space-y-1.5">
        {perks.map((p, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] text-neutral-600 dark:text-neutral-300">
            <Icon.Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-black dark:text-white" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <div
        aria-hidden
        className={`absolute inset-0 rounded-3xl pointer-events-none transition ${active ? "ring-2 ring-black/20 dark:ring-white/20" : ""}`}
      />
    </motion.button>
  );
}

export function Waitlist({ onClose }: { onClose: () => void }) {
  const [tier, setTier] = useState<Tier>("free");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [position, setPosition] = useState<number | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Load live count
  useEffect(() => {
    let cancelled = false;
    fetch(`https://${projectId}.supabase.co/functions/v1/make-server-84204692/waitlist/count`, {
      headers: { Authorization: `Bearer ${publicAnonKey}` },
    })
      .then((r) => r.json())
      .then((d) => { if (!cancelled && typeof d?.count === "number") setCount(d.count); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Cursor-driven moon tilt
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 220, damping: 28, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 220, damping: 28, mass: 0.4 });
  const rotateY = useTransform(sx, (v) => v * 14);
  const rotateX = useTransform(sy, (v) => v * -10);
  const onMove = (e: React.MouseEvent) => {
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = emailValid && status !== "loading";

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canSubmit) return;
    setStatus("loading");
    setError("");
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-84204692/waitlist`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
          body: JSON.stringify({ email, tier, referrer: typeof document !== "undefined" ? document.referrer : "" }),
        },
      );
      const data = await res.json();
      if (!res.ok || data?.error) {
        setStatus("error");
        setError(data?.error === "invalid_email" ? "That email looks off." : "Something didn't connect. Try again.");
        return;
      }
      setStatus("ok");
      setPosition(data.position ?? null);
    } catch (err: any) {
      setStatus("error");
      setError(err?.message || "Network error.");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      className="fixed inset-0 z-[90] overflow-y-auto bg-[#f5f3ef] dark:bg-[#05050a] text-black dark:text-white"
    >
      {/* Header */}
      <header className="relative z-20 flex items-center justify-between h-14 px-5 sm:px-8 lg:px-12">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-70 transition"
          data-cursor-label="Back"
        >
          <Icon.X className="h-4 w-4" /> Back
        </button>
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-4 w-4" title="" />
          <span className="text-sm font-semibold tracking-tight">Moonshot</span>
        </div>
        <span className="hidden sm:inline-flex rounded-full border border-neutral-300 dark:border-neutral-700 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.25em] text-neutral-500">
          Waitlist
        </span>
      </header>

      <main className="relative z-10 grid lg:grid-cols-[1.05fr_1fr] min-h-[calc(100vh-3.5rem)]">
        {/* LEFT — moon stage */}
        <section
          ref={stageRef}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          className="relative flex flex-col items-center justify-center px-6 sm:px-10 lg:px-16 pt-6 pb-10 lg:py-16 overflow-hidden"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex items-center justify-center"
          >
            <Moon rotateX={rotateX} rotateY={rotateY} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 mt-8 lg:mt-12 text-center max-w-xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full glass-subtle px-3 py-1 text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-500">
              <Icon.Spark className="h-3 w-3" /> Limited early access
            </div>
            <h1 className="mt-5 text-[clamp(2.2rem,5vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.04em]">
              The deck composes <span className="italic font-light text-neutral-400">itself.</span>
            </h1>
            <p className="mt-4 text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
              We're letting in a small first group. Drop your email — or claim a Founder seat and skip the line with lifetime perks.
            </p>
            {count !== null && (
              <div className="mt-6 inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.3em] text-neutral-500">
                <span className="font-mono text-black dark:text-white">{count.toString().padStart(4, "0")}</span>
                <span className="h-px w-8 bg-neutral-300 dark:bg-neutral-700" />
                <span>already waiting</span>
              </div>
            )}
          </motion.div>
        </section>

        {/* RIGHT — form panel */}
        <section className="relative flex items-center justify-center px-5 sm:px-8 lg:px-12 pb-16 lg:py-16">
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[480px] rounded-[28px] glass-strong overflow-hidden"
          >
            <div className="px-7 pt-8 pb-7 sm:px-9 sm:pt-9 sm:pb-8">
              <div className="flex items-center gap-2.5">
                <LogoMark className="h-5 w-5" title="" />
                <span className="text-sm font-semibold tracking-tight">Moonshot</span>
                <span className="ml-auto text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-500">v1 · soon</span>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {status === "ok" ? (
                  <motion.div
                    key="ok"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-6"
                  >
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-black text-white dark:bg-white dark:text-black">
                      <Icon.Check className="h-5 w-5" />
                    </div>
                    <h2 className="mt-5 text-[1.7rem] leading-tight tracking-[-0.03em] font-semibold">
                      You're <span className="italic font-light text-neutral-400">in.</span>
                    </h2>
                    <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      We'll email <span className="font-medium text-black dark:text-white">{email}</span> the moment your seat opens.
                      {tier === "founder" && " Founder perks are reserved against your address."}
                    </p>
                    {position !== null && (
                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl glass-subtle p-4">
                          <div className="text-[9px] font-medium uppercase tracking-[0.3em] text-neutral-500">Position</div>
                          <div className="mt-1 text-2xl font-semibold tracking-tight">#{position}</div>
                        </div>
                        <div className="rounded-2xl glass-subtle p-4">
                          <div className="text-[9px] font-medium uppercase tracking-[0.3em] text-neutral-500">Tier</div>
                          <div className="mt-1 text-2xl font-semibold tracking-tight capitalize">{tier}</div>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={onClose}
                      className="mt-7 inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4 hover:opacity-70"
                    >
                      Back to the site <Icon.Arrow className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <h2 className="mt-5 text-[1.9rem] sm:text-[2.05rem] leading-[1.05] tracking-[-0.035em] font-semibold">
                      Skip the <span className="italic font-light text-neutral-400">line.</span>
                    </h2>
                    <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      Pick how you want in. Founder seats unlock everything we ship for life.
                    </p>

                    <div className="mt-5 grid sm:grid-cols-2 gap-3">
                      <TierCard
                        active={tier === "free"}
                        onClick={() => setTier("free")}
                        label="Waitlist"
                        price="Free"
                        pitch="We'll email you when seats open."
                        perks={["Notified before public launch", "Standard generation limits", "Cancel by ignoring us"]}
                      />
                      <TierCard
                        active={tier === "founder"}
                        onClick={() => setTier("founder")}
                        label="Founder"
                        price="$49"
                        pitch="Skip the queue, lifetime perks."
                        perks={["Front of the line, day one", "Lifetime Pro generations", "Founder credit in product", "Direct line to the team"]}
                        tag="Best"
                      />
                    </div>

                    <form onSubmit={submit} className="mt-5 space-y-3">
                      <label className="flex items-center gap-3 rounded-2xl glass-subtle px-4 py-3 transition focus-within:ring-2 focus-within:ring-black/30 dark:focus-within:ring-white/30">
                        <Icon.Mail className="h-4 w-4 text-neutral-400" />
                        <input
                          type="email"
                          autoFocus
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@company.com"
                          className="flex-1 bg-transparent outline-none text-sm placeholder:text-neutral-400"
                          autoComplete="email"
                        />
                        {emailValid && <Icon.Check className="h-3.5 w-3.5 text-emerald-500" />}
                      </label>

                      <AnimatePresence>
                        {status === "error" && error && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-xs text-rose-500 px-1"
                          >
                            {error}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <motion.button
                        type="submit"
                        disabled={!canSubmit}
                        whileHover={canSubmit ? { y: -1 } : {}}
                        whileTap={canSubmit ? { scale: 0.98 } : {}}
                        className="relative mt-1 w-full overflow-hidden rounded-full bg-black text-white dark:bg-white dark:text-black px-6 py-3.5 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition"
                        data-cursor-label={tier === "founder" ? "Claim seat" : "Join"}
                      >
                        <AnimatePresence mode="wait">
                          {status === "loading" ? (
                            <motion.span key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-2">
                              <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white dark:border-black/30 dark:border-t-black" />
                              Reserving your seat…
                            </motion.span>
                          ) : (
                            <motion.span key={`cta-${tier}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.22 }} className="inline-flex items-center gap-2">
                              {tier === "founder" ? "Claim a Founder seat" : "Join the waitlist"} <Icon.Arrow className="h-3.5 w-3.5" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>

                      <p className="text-[11px] text-neutral-500 px-1">
                        {tier === "founder"
                          ? "You'll be redirected to checkout once we open billing. We'll never charge without confirmation."
                          : "No spam. One email when your seat opens, that's it."}
                      </p>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative border-t border-white/40 dark:border-white/10 px-7 py-3 sm:px-9 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-400">
              <span>Encrypted by default</span>
              <span className="font-mono">v1.0 · seats limited</span>
            </div>
          </motion.div>
        </section>
      </main>
    </motion.div>
  );
}
