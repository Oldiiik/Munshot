import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "motion/react";
import { LogoMark } from "./logo-mark";
import { projectId } from "../../../utils/supabase/info";
import { supabase } from "../../../utils/supabase/client";

const sIcon = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const Icon = {
  Mail:  ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 7 9-7" /></svg>),
  Lock:  ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><rect x="5" y="11" width="14" height="9" rx="1.5" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>),
  User:  ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></svg>),
  Eye:   ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>),
  EyeOff:({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><path d="M3 3l18 18" /><path d="M10.6 6.1A10 10 0 0112 6c6.5 0 10 6 10 6a17 17 0 01-3.3 4M6.6 6.6A17 17 0 002 12s3.5 7 10 7a10 10 0 004.5-1.1" /><path d="M9.9 9.9a3 3 0 004.2 4.2" /></svg>),
  Arrow: ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><path d="M4 12h15M13 6l6 6-6 6" /></svg>),
  X:     ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><path d="M6 6l12 12M18 6L6 18" /></svg>),
  Check: ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><path d="M4 12l5 5L20 6" /></svg>),
  Spark: ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></svg>),
};

type Mode = "signin" | "signup";
type Status = "idle" | "loading" | "error" | "success";

export function AuthModal({ reason, onClose, onAuthed }: { reason: string; onClose: () => void; onAuthed: (user: { id: string; email: string; name: string; accessToken: string }) => void }) {
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  // 3D card tilt with cursor
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 18 });
  const sy = useSpring(my, { stiffness: 120, damping: 18 });
  const rotateX = useTransform(sy, (v) => v * -4);
  const rotateY = useTransform(sx, (v) => v * 4);
  const glareX = useTransform(sx, (v) => 50 + v * 40);
  const glareY = useTransform(sy, (v) => 50 + v * 40);
  const onMove = (e: React.MouseEvent) => {
    const r = cardRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Password strength meter (signup only)
  const strength = useMemo(() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return Math.min(4, s);
  }, [password]);
  const strengthLabel = ["", "Weak", "Fair", "Strong", "Excellent"][strength];

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit =
    emailValid &&
    password.length >= 6 &&
    (mode === "signin" || name.trim().length >= 1) &&
    status !== "loading";

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canSubmit) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      if (mode === "signup") {
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-84204692/auth/signup`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
            body: JSON.stringify({ email, password, name: name.trim() }),
          },
        );
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setErrorMsg(data?.error || "Could not create account.");
          return;
        }
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data?.user) {
        setStatus("error");
        setErrorMsg(error?.message || "Invalid credentials.");
        return;
      }
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        console.error("signInWithPassword returned no session:", data);
        setStatus("error");
        setErrorMsg("Signed in but session is missing. Try again.");
        return;
      }
      setStatus("success");
      const meta = (data.user.user_metadata || {}) as { name?: string };
      setTimeout(() => {
        onAuthed({
          id: data.user.id,
          email: data.user.email || email,
          name: meta.name || name || email.split("@")[0],
          accessToken,
        });
      }, 750);
    } catch (err: any) {
      console.error("Auth threw:", err);
      setStatus("error");
      setErrorMsg(err?.message || "Something went wrong.");
    }
  }

  const glareBg = useTransform([glareX, glareY], ([gx, gy]) =>
    `radial-gradient(700px circle at ${gx}% ${gy}%, rgba(255,255,255,0.18), transparent 45%)`
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[90] bg-[#f5f3ef] dark:bg-[#07070a] text-black dark:text-white overflow-y-auto"
    >
      {/* Drifting moon glyph */}
      <motion.div
        aria-hidden
        initial={{ scale: 0.9, rotate: -8, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none fixed -left-[18vw] -bottom-[18vw] z-0 opacity-[0.08] dark:opacity-[0.12]"
      >
        <LogoMark className="h-[90vh] w-[90vh]" title="" />
      </motion.div>


      {/* Header bar */}
      <header className="relative z-20 flex items-center justify-between h-14 px-6 lg:px-10">
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
        <span className="hidden sm:inline-flex rounded-full border border-neutral-300 dark:border-neutral-700 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.25em] text-neutral-500 overflow-hidden relative h-[18px] min-w-[110px] justify-center items-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={mode}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="absolute"
            >
              {mode === "signup" ? "Create account" : "Sign in"}
            </motion.span>
          </AnimatePresence>
        </span>
      </header>

      {/* Two-column page */}
      <main className="relative z-10 grid lg:grid-cols-[1.05fr_1fr] min-h-[calc(100vh-3.5rem)]">
        {/* LEFT — editorial brand panel */}
        <section className="relative px-8 lg:px-16 pt-10 lg:pt-24 pb-16 flex flex-col justify-between overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                style={{ willChange: "transform, opacity" }}
              >
                <div className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.4em] text-neutral-500">
                  <span className="font-mono text-black dark:text-white">{mode === "signup" ? "01" : "—"}</span>
                  <span className="h-px w-8 bg-neutral-300 dark:bg-neutral-700" />
                  <span>{mode === "signup" ? "Make it yours" : "Welcome back"}</span>
                </div>

                <h1 className="mt-8 text-[clamp(2.6rem,6vw,5.2rem)] font-semibold leading-[0.95] tracking-[-0.045em] max-w-[14ch]">
                  {mode === "signup" ? (
                    <>The deck<br /><span className="italic font-light text-neutral-400">composes itself.</span></>
                  ) : (
                    <>Pick up<br /><span className="italic font-light text-neutral-400">where you left off.</span></>
                  )}
                </h1>
              </motion.div>
            </AnimatePresence>
            <p className="mt-6 text-base text-neutral-500 dark:text-neutral-400 max-w-md leading-relaxed">
              One account holds every brief, every draft, every export. Sign in once — Moonshot remembers the rest.
            </p>

            <div className="mt-10 inline-flex items-center gap-2 rounded-full glass-subtle px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-600 dark:text-neutral-300">
              <Icon.Spark className="h-3 w-3" /> {reason}
            </div>
          </motion.div>

          {/* Floating mini deck preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-16 hidden lg:block max-w-md"
            aria-hidden
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative aspect-[16/10] rounded-2xl glass-strong p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)]"
              style={{ rotate: -2 }}
            >
              <div className="text-[8px] font-medium uppercase tracking-[0.3em] text-neutral-400">Moonshot Inc. · 02 / 03</div>
              <div className="mt-3 text-lg font-semibold leading-tight tracking-tight">The shift the room hasn't priced in yet.</div>
              <div className="mt-3 flex items-end gap-1 h-10">
                {[40, 55, 62, 70, 78, 88, 95].map((h, i) => (
                  <div key={i} className={`flex-1 ${i >= 5 ? "bg-black dark:bg-white" : "bg-neutral-300 dark:bg-neutral-700"}`} style={{ height: `${h}%` }} />
                ))}
              </div>
            </motion.div>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -right-6 -bottom-6 w-44 aspect-[16/10] rounded-xl glass p-3"
              style={{ rotate: 4 }}
            >
              <div className="text-[7px] font-medium uppercase tracking-[0.25em] text-neutral-400">03 / 03</div>
              <div className="mt-1.5 text-[11px] font-semibold leading-tight">What we propose →</div>
            </motion.div>
          </motion.div>

          <div className="hidden lg:flex items-center gap-4 mt-12 text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-400">
            <span>End-to-end encrypted</span>
            <span className="h-px w-8 bg-neutral-300 dark:bg-neutral-700" />
            <span>SOC 2 in progress</span>
            <span className="h-px w-8 bg-neutral-300 dark:bg-neutral-700" />
            <span>Made for the room</span>
          </div>
        </section>

        {/* RIGHT — form panel */}
        <section className="relative flex items-center justify-center px-6 lg:px-12 pb-24 lg:py-16">
          <motion.div
            ref={cardRef}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            style={{ rotateX, rotateY, transformPerspective: 1400 }}
            className="relative w-full max-w-[460px]"
          >
            <div className="absolute -inset-px rounded-[28px] bg-gradient-to-br from-white/50 via-white/0 to-white/30 dark:from-white/15 dark:to-white/5 pointer-events-none" />
            <div className="relative rounded-[28px] glass-strong overflow-hidden">
              {/* Specular glare follows cursor */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-70"
                style={{ background: glareBg }}
              />

          <div className="relative px-8 pt-9 pb-8">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <motion.div
                animate={{ rotate: status === "loading" ? 360 : 0 }}
                transition={status === "loading" ? { duration: 4, repeat: Infinity, ease: "linear" } : { duration: 0.4 }}
              >
                <LogoMark className="h-5 w-5" title="" />
              </motion.div>
              <span className="text-sm font-semibold tracking-tight">Moonshot</span>
              <span className="ml-auto text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-500 relative h-[12px] min-w-[60px]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={mode}
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -8, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0"
                  >
                    {mode === "signup" ? "Create" : "Welcome"}
                  </motion.span>
                </AnimatePresence>
              </span>
            </div>

            {/* Reason chip */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="mt-5 inline-flex items-center gap-2 rounded-full glass-subtle px-3 py-1 text-[10px] font-medium uppercase tracking-[0.25em] text-neutral-600 dark:text-neutral-300"
            >
              <Icon.Spark className="h-3 w-3" />
              {reason}
            </motion.div>

            <div className="mt-5 relative">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  style={{ willChange: "transform, opacity" }}
                >
                  <h2 className="text-[2rem] leading-[1.05] tracking-[-0.035em] font-semibold">
                    {mode === "signup" ? (
                      <>Make it <span className="italic font-light text-neutral-400">yours.</span></>
                    ) : (
                      <>Welcome <span className="italic font-light text-neutral-400">back.</span></>
                    )}
                  </h2>
                  <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {mode === "signup"
                      ? "One account. Every deck you've made, every deck you'll make."
                      : "Pick up exactly where you left off."}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Mode tabs */}
            <div className="mt-6 relative grid grid-cols-2 rounded-full glass-subtle p-1 text-xs font-medium">
              {(["signup", "signin"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setStatus("idle"); setErrorMsg(""); }}
                  className={`relative z-10 py-2 rounded-full transition ${mode === m ? "text-white dark:text-black" : "text-neutral-500 hover:text-black dark:hover:text-white"}`}
                  data-cursor-label={m === "signup" ? "Create" : "Sign in"}
                >
                  {m === "signup" ? "Create account" : "Sign in"}
                </button>
              ))}
              <motion.div
                aria-hidden
                animate={{ x: mode === "signup" ? 0 : "100%" }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-black dark:bg-white"
              />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              <AnimatePresence mode="popLayout">
                {mode === "signup" && (
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, height: 0, y: -8 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -8 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Field
                      icon={<Icon.User className="h-4 w-4" />}
                      autoFocus
                      placeholder="Your name"
                      value={name}
                      onChange={setName}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <Field
                icon={<Icon.Mail className="h-4 w-4" />}
                type="email"
                autoFocus={mode === "signin"}
                placeholder="you@company.com"
                value={email}
                onChange={setEmail}
                trailing={emailValid ? <Icon.Check className="h-3.5 w-3.5 text-emerald-500" /> : null}
              />

              <Field
                icon={<Icon.Lock className="h-4 w-4" />}
                type={showPw ? "text" : "password"}
                placeholder={mode === "signup" ? "Create a password" : "Password"}
                value={password}
                onChange={setPassword}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="text-neutral-400 hover:text-black dark:hover:text-white transition"
                    tabIndex={-1}
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <Icon.EyeOff className="h-4 w-4" /> : <Icon.Eye className="h-4 w-4" />}
                  </button>
                }
              />

              {/* Strength meter */}
              <AnimatePresence>
                {mode === "signup" && password.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 px-1"
                  >
                    <div className="flex-1 flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <motion.span
                          key={i}
                          animate={{
                            backgroundColor:
                              i < strength
                                ? strength <= 1 ? "#ef4444" : strength === 2 ? "#f59e0b" : strength === 3 ? "#10b981" : "#000000"
                                : "rgba(0,0,0,0.08)",
                          }}
                          transition={{ duration: 0.3 }}
                          className="h-1 flex-1 rounded-full dark:!opacity-100"
                          style={{ outline: i >= strength ? "1px solid rgba(255,255,255,0.06)" : "none" }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400 w-16 text-right">{strengthLabel}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              <AnimatePresence>
                {status === "error" && errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-rose-500 px-1"
                  >
                    {errorMsg}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={!canSubmit}
                whileHover={canSubmit ? { y: -1 } : {}}
                whileTap={canSubmit ? { y: 0, scale: 0.98 } : {}}
                className="relative mt-2 w-full overflow-hidden rounded-full bg-black text-white dark:bg-white dark:text-black px-6 py-3.5 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition"
                data-cursor-label={mode === "signup" ? "Create" : "Sign in"}
              >
                <AnimatePresence mode="wait">
                  {status === "loading" ? (
                    <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-2">
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white dark:border-black/30 dark:border-t-black" />
                      Composing your account…
                    </motion.span>
                  ) : status === "success" ? (
                    <motion.span key="success" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2">
                      <Icon.Check className="h-4 w-4" /> You're in
                    </motion.span>
                  ) : (
                    <motion.span key={`cta-${mode}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.22 }} className="inline-flex items-center gap-2">
                      {mode === "signup" ? "Create account" : "Sign in"} <Icon.Arrow className="h-3.5 w-3.5" />
                    </motion.span>
                  )}
                </AnimatePresence>
                {/* Sweep on hover */}
                <motion.span
                  aria-hidden
                  className="absolute inset-0 pointer-events-none"
                  initial={{ x: "-120%" }}
                  whileHover={canSubmit ? { x: "120%" } : {}}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)" }}
                />
              </motion.button>
            </form>

            <div className="mt-5 flex items-center justify-between gap-3 text-[11px] text-neutral-500">
              <span className="relative flex-1 h-[16px] overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={mode}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 truncate"
                  >
                    {mode === "signup" ? "By continuing, you agree to our terms." : "Forgot your password? Email support."}
                  </motion.span>
                </AnimatePresence>
              </span>
              <button
                onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setStatus("idle"); setErrorMsg(""); }}
                className="font-medium text-black dark:text-white hover:opacity-70 underline underline-offset-4 transition shrink-0"
              >
                {mode === "signup" ? "Sign in" : "Create"}
              </button>
            </div>
          </div>

              {/* Footer strip */}
              <div className="relative border-t border-white/40 dark:border-white/10 px-8 py-3 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-400">
                <span>Encrypted by default</span>
                <span className="font-mono">v1.0</span>
              </div>
            </div>
          </motion.div>
        </section>
      </main>
    </motion.div>
  );
}

function Field({
  icon, type = "text", placeholder, value, onChange, trailing, autoFocus,
}: {
  icon: React.ReactNode;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  trailing?: React.ReactNode;
  autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <label
      className={`flex items-center gap-3 rounded-2xl glass-subtle px-4 py-3 transition ${focused ? "ring-2 ring-black/40 dark:ring-white/40" : "hover:ring-1 hover:ring-black/20 dark:hover:ring-white/15"}`}
    >
      <span className="text-neutral-400">{icon}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="flex-1 bg-transparent outline-none text-sm placeholder:text-neutral-400"
        autoComplete={type === "password" ? "current-password" : type === "email" ? "email" : "off"}
      />
      {trailing}
    </label>
  );
}
