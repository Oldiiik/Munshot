import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { flushSync } from "react-dom";
import { motion, useMotionValue, useSpring, useScroll, useTransform, AnimatePresence } from "motion/react";
import { LogoMark } from "./components/logo-mark";
import { TrialComposer } from "./components/trial-composer";
import { AuthModal } from "./components/auth-modal";
import { Workspace } from "./components/workspace";
import { Waitlist } from "./components/waitlist";
import { supabase } from "../../utils/supabase/client";

/* ---------- Hand-rolled icons ---------- */
type IconProps = { className?: string };
const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const I = {
  Arrow: ({ className }: IconProps) => (<svg viewBox="0 0 24 24" className={className} {...s}><path d="M4 12h15M13 6l6 6-6 6" /></svg>),
  Check: ({ className }: IconProps) => (<svg viewBox="0 0 24 24" className={className} {...s}><path d="M4 12l5 5L20 6" /></svg>),
  Drag:  ({ className }: IconProps) => (<svg viewBox="0 0 24 24" className={className} {...s}><circle cx="9" cy="6" r="0.8" fill="currentColor"/><circle cx="9" cy="12" r="0.8" fill="currentColor"/><circle cx="9" cy="18" r="0.8" fill="currentColor"/><circle cx="15" cy="6" r="0.8" fill="currentColor"/><circle cx="15" cy="12" r="0.8" fill="currentColor"/><circle cx="15" cy="18" r="0.8" fill="currentColor"/></svg>),
  Upload:({ className }: IconProps) => (<svg viewBox="0 0 24 24" className={className} {...s}><path d="M12 16V4M7 9l5-5 5 5M4 18v2h16v-2"/></svg>),
  Spark: ({ className }: IconProps) => (<svg viewBox="0 0 24 24" className={className} {...s}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>),
};

/* ---------- Slide structure ---------- */
const slides = ["cover", "compare", "how", "reference", "control", "demo", "pricing", "ask"] as const;

/* ---------- Shared shell (full-bleed, no gutter) ---------- */
function SlideShell({ index, children, className = "" }: { index: number; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 50, damping: 18 });
  const sy = useSpring(my, { stiffness: 50, damping: 18 });
  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  };
  const numeralX = useTransform(sx, (v) => v * 18);
  const numeralY = useTransform(sy, (v) => v * 12);
  const moonX = useTransform(sx, (v) => v * -22);
  const moonY = useTransform(sy, (v) => v * -16);
  const numeral = (index + 1).toString().padStart(2, "0");

  return (
    <section
      ref={ref}
      onMouseMove={onMove}
      data-slide-index={index}
      className={`relative w-full min-h-screen flex items-center overflow-hidden ${className}`}
    >
      {/* Atmospheric numeral — mirrors hero wordmark treatment */}
      <motion.div
        style={{ x: numeralX, y: numeralY }}
        className="pointer-events-none absolute top-[4vh] right-[3vw] z-[1] select-none"
        aria-hidden
      >
        <span className="block text-[clamp(7rem,26vw,28rem)] font-semibold tracking-[-0.07em] leading-[0.82] text-neutral-900/[0.07] dark:text-white/[0.08]">
          {numeral}
        </span>
      </motion.div>

      {/* Drifting moon glyph */}
      <motion.div
        style={{ x: moonX, y: moonY }}
        className="pointer-events-none absolute left-[3vw] bottom-[4vh] z-[1] opacity-[0.06] dark:opacity-[0.10]"
        aria-hidden
      >
        <LogoMark className="h-[24vh] w-[24vh] sm:h-[30vh] sm:w-[30vh] lg:h-[36vh] lg:w-[36vh]" title="" />
      </motion.div>

      <div className="relative z-[2] w-full px-5 sm:px-8 lg:px-20 py-20 sm:py-24 lg:py-32">
        {children}
      </div>
    </section>
  );
}

/* ---------- Magnetic button ---------- */
function Magnetic({ children, className = "", strength = 0.25, ...rest }: { children: React.ReactNode; className?: string; strength?: number } & React.HTMLAttributes<HTMLButtonElement>) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <motion.button
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        setPos({ x: (e.clientX - r.left - r.width / 2) * strength, y: (e.clientY - r.top - r.height / 2) * strength });
      }}
      onMouseLeave={() => setPos({ x: 0, y: 0 })}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className={className}
      {...(rest as any)}
    >
      {children}
    </motion.button>
  );
}

/* ---------- 1. COVER — interactive prompt → live preview ---------- */
const PROMPT_PRESETS = [
  {
    label: "Series B raise",
    prompt: "Series B fundraising deck for a B2B SaaS at $4M ARR — focus on retention story",
    title: "Retention is the new growth ceiling.",
    subtitle: "Why our cohort math compounds the next round",
    metric: { k: "NRR", v: "138%", d: "+12 YoY" },
  },
  {
    label: "Board update",
    prompt: "Q3 board update — revenue beat, mid-market churn, plan for Q4",
    title: "We beat plan. One thing we're watching.",
    subtitle: "Q3 close — mixed signal beneath the headline",
    metric: { k: "Q3 Rev", v: "$8.4M", d: "+18%" },
  },
  {
    label: "Sales pitch",
    prompt: "30-min sales pitch to a Fortune 500 ops leader — ROI in 60 days",
    title: "Your team. 60 days. 22% reclaimed.",
    subtitle: "What changes in your ops when ramp-time collapses",
    metric: { k: "Time saved", v: "22%", d: "60-day pilot" },
  },
];

function CoverDeckPeek({ sx, sy }: { sx: any; sy: any }) {
  const peekX = useTransform(sx, (v: number) => v * -18);
  const peekY = useTransform(sy, (v: number) => v * -10);
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotate: -6 }}
      animate={{ opacity: 1, y: 0, rotate: -6 }}
      transition={{ duration: 1.4, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ x: peekX, y: peekY }}
      className="pointer-events-none absolute right-[6vw] top-[18vh] z-[3] hidden lg:block"
    >
      {/* Stack of 3 tilted glass slides */}
      <div className="relative w-[420px] h-[260px]">
        <div className="absolute inset-0 glass rounded-2xl p-6 rotate-[3deg] translate-x-3 translate-y-3" />
        <div className="absolute inset-0 glass rounded-2xl p-6 -rotate-[2deg] translate-x-1.5 translate-y-1.5" />
      </div>
    </motion.div>
  );
}

function WordmarkLetter({ ch, index, sx, sy }: { ch: string; index: number; sx: any; sy: any }) {
  const phase = (index - 3.5) / 3.5;
  const ampX = 18 + Math.abs(phase) * 14;
  const ampY = 8 + Math.abs(phase) * 10;
  const x = useTransform(sx, (v: number) => v * ampX + phase * v * 6);
  const y = useTransform(sy, (v: number) => v * ampY);
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.9, delay: 0.05 * index, ease: [0.22, 1, 0.36, 1] }}
      style={{ x, y, willChange: "transform" }}
      className="inline-block"
    >
      {ch}
    </motion.span>
  );
}

function CoverSlide({ index }: { index: number }) {
  const sectionRef = useRef<HTMLElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 280, damping: 30, mass: 0.4, restDelta: 0.001 });
  const sy = useSpring(my, { stiffness: 280, damping: 30, mass: 0.4, restDelta: 0.001 });

  const onMove = (e: React.MouseEvent) => {
    const r = sectionRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  const moonX = useTransform(sx, (v) => v * 30);
  const moonY = useTransform(sy, (v) => v * 30);

  return (
    <section
      ref={sectionRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      data-slide-index={index}
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Centered ghost moon — parallax */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ x: moonX, y: moonY }}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0"
      >
        <LogoMark className="h-[110vh] w-[110vh] opacity-[0.06] dark:opacity-[0.10]" title="" />
      </motion.div>


      {/* Atmospheric wordmark — letters drift independently */}
      <h1
        aria-label="Moonshot"
        className="pointer-events-none absolute inset-x-0 top-[8vh] z-[2] select-none text-center text-[clamp(4rem,16vw,16rem)] font-semibold tracking-[-0.07em] leading-[0.82] text-neutral-900/[0.10] dark:text-white/[0.10]"
      >
        <span className="sr-only">Moonshot</span>
        <span aria-hidden className="inline-flex">
          {"MOONSHOT".split("").map((ch, i) => (
            <WordmarkLetter key={i} ch={ch} index={i} sx={sx} sy={sy} />
          ))}
        </span>
      </h1>

      {/* Center stage: glass prompt console */}
      <div className="relative z-10 w-full max-w-[860px] mx-auto px-6 mt-[18vh] flex flex-col items-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl text-center text-[clamp(1.25rem,2.2vw,1.6rem)] leading-[1.2] tracking-tight text-neutral-700 dark:text-neutral-300"
        >
          Describe a deck. We design the <span className="italic font-medium text-black dark:text-white">whole slide</span> — type, grid, charts, rhythm.
        </motion.p>

        {/* Glass prompt bar */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
          className="glass-strong relative mt-10 w-full rounded-[28px] p-3 pl-6 flex items-center gap-3"
        >
          <I.Spark className="h-4 w-4 text-neutral-500 flex-shrink-0" />
          <div className="flex-1 text-left text-[15px] text-neutral-500 dark:text-neutral-400 truncate">
            Series B deck — retention story, $4M ARR, 12 slides.
          </div>
          <Magnetic
            onClick={() => window.dispatchEvent(new Event("moonshot:open-waitlist"))}
            className="group inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-[13px] font-medium text-white dark:bg-white dark:text-black hover:opacity-90 transition flex-shrink-0"
            data-cursor-label="Generate"
          >
            Generate
            <I.Arrow className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </Magnetic>
        </motion.div>

        {/* Preset glass chips */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.2 }}
          className="mt-5 flex flex-wrap justify-center gap-2"
        >
          {PROMPT_PRESETS.map((p, i) => (
            <motion.button
              key={p.label}
              onClick={() => window.dispatchEvent(new Event("moonshot:open-waitlist"))}
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 24 }}
              className="glass-subtle rounded-full px-4 py-2 text-[12px] font-medium text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition"
              data-cursor-label="Try"
            >
              {p.label}
            </motion.button>
          ))}
        </motion.div>

      </div>
    </section>
  );
}

/* ---------- 2. COMPARE: them vs. us ---------- */
function CompareSlide({ index }: { index: number }) {
  return (
    <SlideShell index={index}>
      <div className="max-w-[1400px]">
        <div className="text-xs font-medium uppercase tracking-[0.4em] text-neutral-500 mb-10">01 — Why Moonshot</div>
        <h2 className="text-[clamp(2.5rem,7vw,7rem)] font-semibold leading-[0.92] tracking-[-0.04em] max-w-5xl">
          Other tools give you<br />
          <span className="italic font-light text-neutral-400 dark:text-neutral-500">a paragraph and a stock photo.</span><br />
          We design the whole slide.
        </h2>

        <div className="relative mt-24 grid lg:grid-cols-2 gap-6">
          {/* Them */}
          <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 200, damping: 22 }} className="glass rounded-2xl p-10 lg:p-14">
            <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-neutral-400">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" /> Other AI tools
            </div>
            <p className="mt-6 text-2xl font-semibold tracking-tight text-neutral-400 dark:text-neutral-600">Headline goes here</p>
            <ThemMockup />
            <ul className="mt-8 space-y-2 text-sm text-neutral-500 dark:text-neutral-500">
              <li className="line-through decoration-[1.5px]">Generic 3-bullet template</li>
              <li className="line-through decoration-[1.5px]">AI-generated stock photo on the right</li>
              <li className="line-through decoration-[1.5px]">Same layout, every slide</li>
              <li className="line-through decoration-[1.5px]">No real visual hierarchy</li>
            </ul>
          </motion.div>

          {/* Us */}
          <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 200, damping: 22 }} className="glass-strong rounded-2xl p-10 lg:p-14">
            <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-black dark:text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-black dark:bg-white" /> Moonshot
            </div>
            <p className="mt-6 text-2xl font-semibold tracking-tight">Composed end-to-end</p>
            <UsMockup />
            <ul className="mt-8 space-y-2 text-sm">
              <li className="flex items-center gap-2"><I.Check className="h-4 w-4" /> Slide built as one unit — type, grid, color, charts</li>
              <li className="flex items-center gap-2"><I.Check className="h-4 w-4" /> Every layout earns its place from the content</li>
              <li className="flex items-center gap-2"><I.Check className="h-4 w-4" /> Charts cite real numbers, not decoration</li>
              <li className="flex items-center gap-2"><I.Check className="h-4 w-4" /> Native PPTX & Keynote on export</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </SlideShell>
  );
}

function ThemMockup() {
  return (
    <div className="mt-8 aspect-[16/9] w-full rounded-md glass-subtle p-5 flex gap-4">
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-3 w-3/4 rounded bg-neutral-300 dark:bg-neutral-700" />
        <div className="h-2 w-full rounded bg-neutral-200 dark:bg-neutral-800 mt-2" />
        <div className="h-2 w-5/6 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-2 w-4/6 rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
      <div className="w-1/2 rounded-sm bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-700 flex items-center justify-center">
        <span className="text-[8px] font-medium uppercase tracking-widest text-neutral-400">stock image</span>
      </div>
    </div>
  );
}

function UsMockup() {
  const cohorts = [42, 58, 71, 64, 80, 73, 90, 82, 95, 88];
  return (
    <div className="mt-8 aspect-[16/9] w-full rounded-md glass p-5 flex flex-col">
      <div className="flex items-center justify-between text-[8px] font-medium uppercase tracking-[0.25em] text-neutral-400">
        <span>Moonshot Inc.</span><span>03 — Market shift</span>
      </div>
      <div className="mt-3 grid grid-cols-[1.1fr_1fr] gap-4 flex-1">
        <div className="flex flex-col">
          <h4 className="text-[14px] font-semibold leading-[1.05] tracking-tight">Retention is the new growth ceiling.</h4>
          <div className="mt-2 border-l-2 border-black dark:border-white pl-2">
            <p className="text-[8px] leading-relaxed text-neutral-500">NRR diluted by <span className="font-semibold text-black dark:text-white">4.2 pts</span> YoY.</p>
          </div>
          <div className="mt-auto grid grid-cols-3 gap-2">
            {[["NRR","108%"],["Churn","6.1%"],["Exp.","$3.4M"]].map(([k,v]) => (
              <div key={k}><div className="text-[6px] uppercase tracking-widest text-neutral-400">{k}</div><div className="text-[10px] font-semibold">{v}</div></div>
            ))}
          </div>
        </div>
        <div className="flex flex-col">
          <div className="text-[7px] uppercase tracking-widest text-neutral-400 mb-1">NRR by cohort</div>
          <div className="flex-1 flex items-end gap-0.5">
            {cohorts.map((h, i) => (
              <div key={i} className={`flex-1 ${i >= 7 ? "bg-black dark:bg-white" : "bg-neutral-300 dark:bg-neutral-700"}`} style={{ height: `${h}%`, minHeight: 2 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 3. HOW — From thought to finished deck (animated 3-stage product reel) ---------- */
const HOW_PROMPT = "Series B raise — B2B SaaS at $4M ARR, retention story";

function HowPromptStage({ active }: { active: boolean }) {
  const [typed, setTyped] = useState("");
  useEffect(() => {
    if (!active) { setTyped(""); return; }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(HOW_PROMPT.slice(0, i));
      if (i >= HOW_PROMPT.length) clearInterval(id);
    }, 32);
    return () => clearInterval(id);
  }, [active]);
  return (
    <div className="h-full w-full flex flex-col p-6">
      <div className="flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.3em] text-neutral-500">
        <LogoMark className="h-3 w-3" title="" />
        <span>Brief</span>
        <span className="ml-auto font-mono text-neutral-400">stage 01</span>
      </div>
      <div className="mt-6 flex-1 flex flex-col">
        <div className="text-[9px] font-medium uppercase tracking-[0.3em] text-neutral-400">prompt</div>
        <div className="mt-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-black/30 p-3 min-h-[80px]">
          <p className="text-[12px] leading-relaxed text-neutral-800 dark:text-neutral-200">
            {typed}
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.9, repeat: Infinity }}
              className="ml-0.5 inline-block h-[1em] w-[2px] -mb-[3px] bg-black dark:bg-white align-middle"
            />
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["12 slides", "Investor tone", "Charts: bars", "Confident"].map((chip, i) => (
            <motion.span
              key={chip}
              initial={{ opacity: 0, y: 6 }}
              animate={active ? { opacity: 1, y: 0 } : { opacity: 0 }}
              transition={{ delay: 1.0 + i * 0.1, duration: 0.4 }}
              className="rounded-full border border-neutral-200 dark:border-neutral-800 px-2 py-0.5 text-[9px] font-medium text-neutral-600 dark:text-neutral-400"
            >
              {chip}
            </motion.span>
          ))}
        </div>
        <div className="mt-auto pt-3 flex items-center justify-between">
          <div className="text-[8px] uppercase tracking-[0.3em] text-neutral-400">parsing intent…</div>
          <motion.div
            animate={active ? { width: 90 } : { width: 0 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="h-px bg-black dark:bg-white"
          />
        </div>
      </div>
    </div>
  );
}

const HOW_OUTLINE = [
  { n: "01", t: "Cover" },
  { n: "02", t: "Why now" },
  { n: "03", t: "Retention math" },
  { n: "04", t: "Cohort proof" },
  { n: "05", t: "The plan" },
  { n: "06", t: "The ask" },
];

function HowStructureStage({ active }: { active: boolean }) {
  return (
    <div className="h-full w-full flex flex-col p-6">
      <div className="flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.3em] text-neutral-500">
        <LogoMark className="h-3 w-3" title="" />
        <span>Structure</span>
        <span className="ml-auto font-mono text-neutral-400">stage 02</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-1.5 flex-1">
        {HOW_OUTLINE.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, x: -8 }}
            animate={active ? { opacity: 1, x: 0 } : { opacity: 0 }}
            transition={{ delay: 0.15 + i * 0.18, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/30 px-2 py-1.5"
          >
            <div className="aspect-[16/10] w-7 rounded-sm bg-neutral-100 dark:bg-neutral-900 relative overflow-hidden flex-shrink-0">
              <motion.div
                initial={{ width: 0 }}
                animate={active ? { width: "70%" } : { width: 0 }}
                transition={{ delay: 0.45 + i * 0.18, duration: 0.5 }}
                className="absolute left-1 top-1 h-0.5 bg-neutral-400 dark:bg-neutral-600"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={active ? { width: "55%" } : { width: 0 }}
                transition={{ delay: 0.55 + i * 0.18, duration: 0.5 }}
                className="absolute left-1 top-2 h-0.5 bg-neutral-300 dark:bg-neutral-700"
              />
            </div>
            <span className="font-mono text-[8px] font-semibold tracking-widest text-neutral-400">{s.n}</span>
            <span className="flex-1 text-[10px] font-medium tracking-tight truncate">{s.t}</span>
            <motion.span
              initial={{ scale: 0 }}
              animate={active ? { scale: 1 } : { scale: 0 }}
              transition={{ delay: 0.7 + i * 0.18, type: "spring", stiffness: 400, damping: 22 }}
              className="h-1 w-1 rounded-full bg-black dark:bg-white"
            />
          </motion.div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 text-[8px] uppercase tracking-[0.3em] text-neutral-400">
        <span>argument map locked</span>
        <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        <span className="font-mono">6 / 6</span>
      </div>
    </div>
  );
}

function HowPolishedStage({ active }: { active: boolean }) {
  const bars = [42, 58, 71, 64, 80, 73, 90, 82, 95, 88];
  return (
    <div className="h-full w-full flex flex-col p-6">
      <div className="flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.3em] text-neutral-500">
        <LogoMark className="h-3 w-3" title="" />
        <span>Polished deck</span>
        <span className="ml-auto font-mono text-neutral-400">stage 03</span>
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mt-4 flex-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-black/40 p-4 flex flex-col"
      >
        <div className="flex items-center justify-between text-[7px] font-medium uppercase tracking-[0.3em] text-neutral-400">
          <span>Moonshot Inc.</span><span>03 — Retention math</span>
        </div>
        <div className="mt-2 grid grid-cols-[1.1fr_1fr] gap-3 flex-1">
          <div className="flex flex-col">
            <motion.h4
              initial={{ opacity: 0, y: 8 }}
              animate={active ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-[13px] font-semibold leading-[1.05] tracking-tight"
            >
              Building the house of <span className="italic font-light text-neutral-500">compounding</span>.
            </motion.h4>
            <motion.div
              initial={{ scaleY: 0 }}
              animate={active ? { scaleY: 1 } : { scaleY: 0 }}
              transition={{ delay: 0.55, duration: 0.4 }}
              style={{ transformOrigin: "top" }}
              className="mt-2 border-l-2 border-black dark:border-white pl-2"
            >
              <p className="text-[8px] leading-relaxed text-neutral-500">
                NRR climbed <span className="font-semibold text-black dark:text-white">+12 pts</span> across the last four cohorts.
              </p>
            </motion.div>
            <div className="mt-auto grid grid-cols-3 gap-2">
              {[["NRR","138%"],["Churn","2.1%"],["Exp.","$8.4M"]].map(([k,v], i) => (
                <motion.div
                  key={k}
                  initial={{ opacity: 0, y: 4 }}
                  animate={active ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.7 + i * 0.08, duration: 0.4 }}
                >
                  <div className="text-[6px] uppercase tracking-widest text-neutral-400">{k}</div>
                  <div className="text-[9px] font-semibold">{v}</div>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            <div className="text-[6px] uppercase tracking-widest text-neutral-400 mb-1">NRR by cohort</div>
            <div className="flex-1 flex items-end gap-0.5">
              {bars.map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={active ? { height: `${h}%` } : { height: 0 }}
                  transition={{ delay: 0.5 + i * 0.04, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex-1 ${i >= 7 ? "bg-black dark:bg-white" : "bg-neutral-300 dark:bg-neutral-700"}`}
                  style={{ minHeight: 2 }}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
      <div className="mt-2 flex items-center gap-2 text-[8px] uppercase tracking-[0.3em] text-neutral-400">
        <motion.span
          initial={{ opacity: 0 }}
          animate={active ? { opacity: 1 } : {}}
          transition={{ delay: 1.4, duration: 0.5 }}
          className="flex items-center gap-1.5 text-black dark:text-white"
        >
          <I.Check className="h-2.5 w-2.5" /> ready · pptx · keynote
        </motion.span>
        <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        <span className="font-mono">14 slides</span>
      </div>
    </div>
  );
}

function HowSlide({ index }: { index: number }) {
  const stages = [
    { k: "Prompt", caption: "Drop a brief. We parse intent, audience, and tone." },
    { k: "Structure", caption: "Outline, argument map, and slide order — locked in." },
    { k: "Polished deck", caption: "Type, charts, and hierarchy composed end-to-end." },
  ];
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [progress, setProgress] = useState(0);
  const STAGE_MS = 5200;

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || paused) return;
    setProgress(0);
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / STAGE_MS);
      setProgress(p);
      if (p >= 1) setActive((a) => (a + 1) % 3);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, inView, paused]);

  return (
    <SlideShell index={index}>
      <div ref={ref} className="max-w-[1280px] mx-auto w-full">
        <div className="text-xs font-medium uppercase tracking-[0.4em] text-neutral-500 mb-6 text-center">The Moonshot Process</div>
        <h2 className="text-center text-[clamp(2.5rem,6vw,6rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
          From thought to <span className="italic font-light">finished deck.</span>
        </h2>
        <p className="mt-6 text-center max-w-xl mx-auto text-base leading-relaxed text-neutral-500 dark:text-neutral-400">
          Moonshot turns your ideas into structured, beautiful presentations in minutes — not hours.
        </p>

        {/* Cinematic frame */}
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="relative mt-16 rounded-[28px] glass-strong overflow-hidden"
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-1.5 px-5 py-3 border-b border-neutral-200/70 dark:border-neutral-800/70">
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800" />
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800" />
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800" />
            <span className="ml-3 text-[10px] font-medium uppercase tracking-[0.25em] text-neutral-400">moonshot.app / compose</span>
            <span className="ml-auto flex items-center gap-1.5 text-[9px] font-mono text-neutral-400">
              <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              live
            </span>
          </div>

          {/* Stage tabs + progress */}
          <div className="grid grid-cols-3 border-b border-neutral-200/70 dark:border-neutral-800/70">
            {stages.map((st, i) => {
              const isActive = active === i;
              const isDone = i < active;
              return (
                <button
                  key={st.k}
                  onClick={() => setActive(i)}
                  className="relative text-left px-6 py-5 group"
                  data-cursor-label={st.k}
                >
                  <div className="flex items-center gap-3">
                    <motion.span
                      animate={{ scale: isActive ? 1 : 0.85 }}
                      transition={{ type: "spring", stiffness: 300, damping: 24 }}
                      className={`h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center font-mono text-[10px] font-semibold tracking-widest border transition-colors ${isActive || isDone ? "border-transparent text-white dark:text-black bg-black dark:bg-white" : "border-neutral-300 dark:border-neutral-700 text-neutral-500"}`}
                    >
                      {isDone ? <I.Check className="h-3.5 w-3.5" /> : (i + 1).toString().padStart(2, "0")}
                    </motion.span>
                    <div className="min-w-0">
                      <div className={`text-[10px] font-medium uppercase tracking-[0.3em] transition ${isActive ? "text-black dark:text-white" : "text-neutral-400"}`}>
                        {st.k}
                      </div>
                      <div className="mt-1 text-[12px] text-neutral-500 dark:text-neutral-400 leading-snug truncate">
                        {st.caption}
                      </div>
                    </div>
                  </div>
                  {/* Per-stage progress underline */}
                  <div className="absolute left-0 right-0 bottom-0 h-[2px] bg-transparent overflow-hidden">
                    <motion.div
                      animate={{ width: isActive ? `${progress * 100}%` : isDone ? "100%" : "0%" }}
                      transition={{ duration: 0.1, ease: "linear" }}
                      className="h-full bg-black dark:bg-white"
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Big cinematic preview */}
          <div className="relative aspect-[16/8] w-full bg-[#f7f5f1] dark:bg-[#08080b] overflow-hidden">
            {/* Atmospheric numeral */}
            <div className="pointer-events-none absolute right-6 top-4 text-[clamp(6rem,14vw,12rem)] font-semibold tracking-[-0.07em] leading-[0.82] text-neutral-900/[0.05] dark:text-white/[0.06] select-none">
              {(active + 1).toString().padStart(2, "0")}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.005 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 px-10 py-10 lg:px-16 lg:py-14"
              >
                {active === 0 && <HowPromptBig active />}
                {active === 1 && <HowStructureBig active />}
                {active === 2 && <HowPolishedBig active />}
              </motion.div>
            </AnimatePresence>

            {/* Floor vignette */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/[0.04] dark:from-white/[0.04] to-transparent" />
          </div>
        </div>

        {/* Pager dots */}
        <div className="mt-8 flex justify-center items-center gap-2">
          {stages.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Stage ${i + 1}`}
              className="group p-2"
            >
              <motion.span
                animate={{ width: active === i ? 28 : 6 }}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
                className={`block h-1.5 rounded-full ${active === i ? "bg-black dark:bg-white" : "bg-neutral-300 dark:bg-neutral-700"}`}
              />
            </button>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}

/* Big stage components — full-frame versions of the product surfaces */

function HowPromptBig({ active }: { active: boolean }) {
  const [typed, setTyped] = useState("");
  useEffect(() => {
    if (!active) { setTyped(""); return; }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(HOW_PROMPT.slice(0, i));
      if (i >= HOW_PROMPT.length) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [active]);

  return (
    <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 h-full items-center">
      <div>
        <div className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-400">Brief</div>
        <div className="mt-4 rounded-2xl glass p-6">
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-500 mb-4">
            <I.Spark className="h-3 w-3" /> Prompt
          </div>
          <p className="text-[clamp(1rem,1.6vw,1.35rem)] leading-relaxed font-medium tracking-tight">
            {typed}
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.9, repeat: Infinity }}
              className="ml-1 inline-block h-[1em] w-[3px] -mb-[3px] bg-black dark:bg-white align-middle"
            />
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {["12 slides", "Investor tone", "Charts: bars", "Confident, visionary", "Light theme"].map((chip, i) => (
            <motion.span
              key={chip}
              initial={{ opacity: 0, y: 6 }}
              animate={active ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1.0 + i * 0.08, duration: 0.4 }}
              className="rounded-full glass-subtle px-3 py-1.5 text-[11px] font-medium text-neutral-700 dark:text-neutral-300"
            >
              {chip}
            </motion.span>
          ))}
        </div>
      </div>
      <div className="hidden lg:flex flex-col gap-3">
        <div className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-400">Parsing intent</div>
        {[
          { k: "Audience", v: "Series B investors" },
          { k: "Argument", v: "Retention compounds" },
          { k: "Tone", v: "Confident, data-led" },
          { k: "Length", v: "12 slides · 14 min" },
        ].map((r, i) => (
          <motion.div
            key={r.k}
            initial={{ opacity: 0, x: 10 }}
            animate={active ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 1.1 + i * 0.18, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-between rounded-xl glass-subtle px-4 py-3"
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-400">{r.k}</span>
            <span className="text-sm font-medium tracking-tight">{r.v}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function HowStructureBig({ active }: { active: boolean }) {
  return (
    <div className="grid lg:grid-cols-[1fr_1.4fr] gap-10 h-full items-center">
      <div>
        <div className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-400">Argument map</div>
        <h3 className="mt-3 text-[clamp(1.5rem,2.4vw,2.1rem)] font-semibold leading-[1.05] tracking-tight">
          Six slides.<br />
          <span className="italic font-light text-neutral-500">One coherent argument.</span>
        </h3>
        <div className="mt-6 space-y-2 max-w-sm">
          {[
            ["Hook", "Why retention beats growth"],
            ["Proof", "Cohort math + chart"],
            ["Plan", "Where the next $ goes"],
          ].map((r, i) => (
            <motion.div
              key={r[0]}
              initial={{ opacity: 0, x: -8 }}
              animate={active ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.3 + i * 0.18, duration: 0.45 }}
              className="flex items-center gap-3 text-sm"
            >
              <span className="font-mono text-[10px] tracking-widest text-neutral-400 w-12">{r[0].toUpperCase()}</span>
              <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
              <span className="text-neutral-700 dark:text-neutral-300 font-medium">{r[1]}</span>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {HOW_OUTLINE.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={active ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ delay: 0.15 + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-xl glass aspect-[4/3] p-3 flex flex-col"
          >
            <div className="flex items-center justify-between text-[8px] font-medium uppercase tracking-[0.3em] text-neutral-400">
              <span className="font-mono">{s.n}</span>
              <motion.span
                initial={{ scale: 0 }}
                animate={active ? { scale: 1 } : {}}
                transition={{ delay: 0.6 + i * 0.12, type: "spring", stiffness: 400, damping: 22 }}
                className="h-1 w-1 rounded-full bg-black dark:bg-white"
              />
            </div>
            <div className="mt-2 flex flex-col gap-1.5 flex-1">
              <motion.div
                initial={{ width: 0 }}
                animate={active ? { width: "70%" } : {}}
                transition={{ delay: 0.4 + i * 0.12, duration: 0.5 }}
                className="h-1 rounded bg-neutral-300 dark:bg-neutral-700"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={active ? { width: "50%" } : {}}
                transition={{ delay: 0.5 + i * 0.12, duration: 0.5 }}
                className="h-1 rounded bg-neutral-200 dark:bg-neutral-800"
              />
              <div className="mt-auto text-[10px] font-semibold tracking-tight truncate">{s.t}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function HowPolishedBig({ active }: { active: boolean }) {
  const bars = [42, 58, 71, 64, 80, 73, 90, 82, 95, 88];
  return (
    <div className="grid lg:grid-cols-[1.5fr_1fr] gap-10 h-full items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={active ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl glass p-7 aspect-[16/9] flex flex-col"
      >
        <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-400">
          <span>Moonshot Inc.</span><span>03 — Retention math</span>
        </div>
        <div className="mt-5 grid grid-cols-[1.1fr_1fr] gap-6 flex-1">
          <div className="flex flex-col">
            <motion.h4
              initial={{ opacity: 0, y: 10 }}
              animate={active ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.55 }}
              className="text-[clamp(1.1rem,2vw,1.7rem)] font-semibold leading-[1.05] tracking-tight"
            >
              Building the house of <span className="italic font-light text-neutral-500">compounding</span>.
            </motion.h4>
            <motion.div
              initial={{ scaleY: 0 }}
              animate={active ? { scaleY: 1 } : {}}
              transition={{ delay: 0.55, duration: 0.4 }}
              style={{ transformOrigin: "top" }}
              className="mt-3 border-l-2 border-black dark:border-white pl-3"
            >
              <p className="text-[12px] leading-relaxed text-neutral-500">
                NRR climbed <span className="font-semibold text-black dark:text-white">+12 pts</span> across the last four cohorts.
              </p>
            </motion.div>
            <div className="mt-auto grid grid-cols-3 gap-3">
              {[["NRR","138%"],["Churn","2.1%"],["Exp.","$8.4M"]].map(([k,v], i) => (
                <motion.div
                  key={k}
                  initial={{ opacity: 0, y: 6 }}
                  animate={active ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.7 + i * 0.08, duration: 0.4 }}
                >
                  <div className="text-[8px] uppercase tracking-widest text-neutral-400">{k}</div>
                  <div className="text-[clamp(0.9rem,1.4vw,1.15rem)] font-semibold tracking-tight">{v}</div>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            <div className="text-[8px] uppercase tracking-widest text-neutral-400 mb-2">NRR by cohort</div>
            <div className="flex-1 flex items-end gap-1">
              {bars.map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={active ? { height: `${h}%` } : { height: 0 }}
                  transition={{ delay: 0.5 + i * 0.04, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex-1 rounded-sm ${i >= 7 ? "bg-black dark:bg-white" : "bg-neutral-300 dark:bg-neutral-700"}`}
                  style={{ minHeight: 3 }}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
      <div className="hidden lg:flex flex-col gap-3">
        <div className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-400">Export</div>
        {[
          { k: "PowerPoint", v: ".pptx · native shapes" },
          { k: "Keynote", v: ".key · editable" },
          { k: "PDF", v: "Print-ready" },
          { k: "Web", v: "Live link" },
        ].map((r, i) => (
          <motion.div
            key={r.k}
            initial={{ opacity: 0, x: 10 }}
            animate={active ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 1.0 + i * 0.12, duration: 0.4 }}
            className="flex items-center justify-between rounded-xl glass-subtle px-4 py-3"
          >
            <div>
              <div className="text-sm font-semibold tracking-tight">{r.k}</div>
              <div className="text-[10px] text-neutral-400">{r.v}</div>
            </div>
            <I.Check className="h-4 w-4 text-black dark:text-white" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 4. REFERENCE upload ---------- */
function ReferenceSlide({ index }: { index: number }) {
  return (
    <SlideShell index={index}>
      <div className="max-w-[1400px]">
        <div className="text-xs font-medium uppercase tracking-[0.4em] text-neutral-500 mb-10">03 — Match a style</div>
        <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-16 items-center">
          <div>
            <h2 className="text-[clamp(2.5rem,6vw,6rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
              Have a deck<br />
              you love?<br />
              <span className="italic font-light text-neutral-400">We'll match it.</span>
            </h2>
            <p className="mt-10 max-w-md text-lg leading-relaxed text-neutral-500 dark:text-neutral-400">
              Upload a PDF, a Keynote, a screenshot — even one slide. Moonshot reads its visual DNA: type pairings, color rhythm, grid, density. Your new deck inherits all of it.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              {["Type system", "Palette", "Grid + spacing", "Chart styling", "Photo treatment"].map((tag) => (
                <span key={tag} className="rounded-full border border-neutral-200 dark:border-neutral-800 px-3.5 py-1.5 text-xs font-medium tracking-tight">{tag}</span>
              ))}
            </div>
          </div>

          <ReferenceDropzone />
        </div>
      </div>
    </SlideShell>
  );
}

function ReferenceDropzone() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % 4), 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative rounded-xl glass-strong p-8 overflow-hidden">
      <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-500 mb-6">
        <span className="flex items-center gap-2"><LogoMark className="h-3 w-3" title="" /> Reference</span>
        <span>{step === 0 ? "Drop a file" : step === 1 ? "Reading…" : step === 2 ? "Extracting style" : "Ready"}</span>
      </div>

      {/* Drop area */}
      <div className="relative aspect-[16/10] rounded-lg border-2 border-dashed border-neutral-200 dark:border-neutral-800 flex items-center justify-center overflow-hidden">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          {step === 0 && (
            <div className="flex flex-col items-center gap-3 text-neutral-500">
              <I.Upload className="h-8 w-8" />
              <div className="text-sm font-medium">Drop your deck or screenshot</div>
              <div className="text-xs text-neutral-400">PDF · PPTX · Keynote · PNG</div>
            </div>
          )}
          {step === 1 && (
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-16 rounded bg-neutral-200 dark:bg-neutral-800 ring-1 ring-neutral-300 dark:ring-neutral-700" />
              <div className="text-xs font-medium">brand-deck-v3.pdf</div>
              <div className="h-1 w-32 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 2 }} className="h-full bg-black dark:bg-white" />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="grid grid-cols-3 gap-2">
              {["#0F0F0F", "#D8D8D8", "#FFFFFF"].map((c) => (
                <div key={c} className="h-10 w-10 rounded ring-1 ring-neutral-300 dark:ring-neutral-700" style={{ backgroundColor: c }} />
              ))}
              <div className="col-span-3 text-[10px] font-medium uppercase tracking-widest text-neutral-500 mt-2">Palette · Type · Grid</div>
            </div>
          )}
          {step === 3 && (
            <div className="flex flex-col items-center gap-2">
              <I.Spark className="h-7 w-7" />
              <div className="text-sm font-semibold">Style locked</div>
              <div className="text-xs text-neutral-500">Applying to 14 slides</div>
            </div>
          )}
        </motion.div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-1">
        {[0,1,2,3].map((i) => (
          <div key={i} className={`h-0.5 rounded-full transition ${i <= step ? "bg-black dark:bg-white" : "bg-neutral-200 dark:bg-neutral-800"}`} />
        ))}
      </div>
    </div>
  );
}

/* ---------- 5. CONTROL: editor — reorder + edit ---------- */
function ControlSlide({ index }: { index: number }) {
  const initial = [
    { n: "01", t: "Cover" },
    { n: "02", t: "Why now" },
    { n: "03", t: "Market shift" },
    { n: "04", t: "Retention math" },
    { n: "05", t: "The plan" },
    { n: "06", t: "The ask" },
  ];
  const [order, setOrder] = useState(initial);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length || to === from) return;
    const next = [...order];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    setOrder(next);
  };

  return (
    <SlideShell index={index}>
      <div className="max-w-[1400px]">
        <div className="text-xs font-medium uppercase tracking-[0.4em] text-neutral-500 mb-10">04 — Stay in control</div>
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-16 items-center">
          <div>
            <h2 className="text-[clamp(2.5rem,6vw,6rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
              Drag to reorder.<br />
              <span className="italic font-light text-neutral-400">Click to rewrite.</span>
            </h2>
            <p className="mt-10 max-w-md text-lg leading-relaxed text-neutral-500 dark:text-neutral-400">
              Moonshot composes the first version. You decide what stays, what moves, and what gets sharper. Every block of text, every chart, every layout — yours to shape.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-3 max-w-md text-sm">
              {[
                "Reorder by drag",
                "Inline copy edit",
                "Swap any layout",
                "Replace charts live",
                "Lock brand controls",
                "Track all versions",
              ].map((f) => (
                <div key={f} className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                  <span className="h-1 w-1 rounded-full bg-black dark:bg-white" /> {f}
                </div>
              ))}
            </div>
          </div>

          {/* Live reorder demo */}
          <div className="rounded-xl glass-strong p-6">
            <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-500 mb-5">
              <span className="flex items-center gap-2"><LogoMark className="h-3 w-3" title="" /> Slide order</span>
              <span>Drag the handle</span>
            </div>
            <div className="space-y-2">
              {order.map((sl, i) => (
                <motion.div
                  key={sl.n}
                  layout
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className={`group flex items-center gap-4 rounded-lg glass-subtle p-3 ${draggingIdx === i ? "ring-1 ring-black dark:ring-white shadow-lg" : ""}`}
                  draggable
                  onDragStart={() => setDraggingIdx(i)}
                  onDragOver={(e) => { e.preventDefault(); if (draggingIdx !== null && draggingIdx !== i) move(draggingIdx, i); setDraggingIdx(i); }}
                  onDragEnd={() => setDraggingIdx(null)}
                >
                  <I.Drag className="h-4 w-4 text-neutral-400 cursor-grab" />
                  <div className="aspect-[16/10] w-16 rounded-sm glass-subtle relative overflow-hidden flex-shrink-0">
                    <div className="absolute left-1.5 top-1.5 h-0.5 w-5 bg-neutral-400 dark:bg-neutral-600" />
                    <div className="absolute left-1.5 top-3 h-0.5 w-7 bg-neutral-300 dark:bg-neutral-700" />
                  </div>
                  <span className="font-mono text-[10px] font-semibold tracking-widest text-neutral-400">{sl.n}</span>
                  <span className="flex-1 text-sm font-medium tracking-tight">{sl.t}</span>
                  <button onClick={() => move(i, i - 1)} className="text-xs text-neutral-400 hover:text-black dark:hover:text-white transition px-1">↑</button>
                  <button onClick={() => move(i, i + 1)} className="text-xs text-neutral-400 hover:text-black dark:hover:text-white transition px-1">↓</button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SlideShell>
  );
}

/* ---------- 6. DEMO ---------- */
function DemoSlide({ index }: { index: number }) {
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setT((x) => (x + 1) % 100), 80);
    return () => clearInterval(id);
  }, [playing]);

  const chapters = [
    { at: 0, label: "Brief" },
    { at: 25, label: "Style picker" },
    { at: 50, label: "Compose" },
    { at: 75, label: "Edit + export" },
  ];
  const activeChapter = [...chapters].reverse().find((c) => t >= c.at) ?? chapters[0];

  return (
    <SlideShell index={index}>
      <div className="max-w-[1400px]">
        <div className="text-xs font-medium uppercase tracking-[0.4em] text-neutral-500 mb-10">05 — See it move</div>
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-16 items-center">
          <div>
            <h2 className="text-[clamp(2.5rem,6vw,6rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
              90 seconds.<br />
              <span className="italic font-light text-neutral-400">One full deck.</span>
            </h2>
            <p className="mt-10 max-w-md text-lg leading-relaxed text-neutral-500 dark:text-neutral-400">
              Watch a real brief turn into 14 finished slides — brief, style pick, compose, edit, export. No cuts.
            </p>
            <ul className="mt-10 space-y-3 text-sm">
              {chapters.map((c, i) => (
                <li key={c.label} className={`flex items-center gap-3 transition ${activeChapter.label === c.label && playing ? "text-black dark:text-white" : "text-neutral-400"}`}>
                  <span className="font-mono text-xs w-6">/{(i + 1).toString().padStart(2, "0")}</span>
                  <span className="h-px flex-1 bg-current opacity-30" />
                  <span className="font-medium">{c.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative rounded-2xl glass-strong p-3">
            <div className="flex items-center gap-1.5 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800" />
              <span className="h-2.5 w-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800" />
              <span className="h-2.5 w-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800" />
              <span className="ml-3 text-[10px] font-medium uppercase tracking-[0.25em] text-neutral-400">moonshot.app/demo</span>
            </div>
            <div className="relative aspect-[16/10] w-full rounded-lg glass-subtle overflow-hidden">
              {/* Composing waveform */}
              <div className="absolute inset-0 flex items-end justify-center gap-1 p-12">
                {Array.from({ length: 28 }).map((_, i) => {
                  const h = 20 + Math.abs(Math.sin((t + i * 8) / 12)) * 80;
                  return <div key={i} className="w-1.5 rounded-full bg-black/70 dark:bg-white/70" style={{ height: `${h}%`, opacity: playing ? 1 : 0.2 }} />;
                })}
              </div>
              <div className="absolute left-6 top-6 text-[9px] font-medium uppercase tracking-[0.3em] text-neutral-400">{activeChapter.label}</div>
              <div className="absolute right-6 top-6 text-[9px] font-mono text-neutral-400">00:{(t * 0.9).toFixed(0).padStart(2, "0")}</div>
              {!playing && (
                <button
                  onClick={() => setPlaying(true)}
                  className="absolute inset-0 flex items-center justify-center group"
                  aria-label="Play demo"
                >
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black shadow-2xl transition group-hover:scale-110">
                    <svg viewBox="0 0 24 24" className="h-7 w-7 ml-1" fill="currentColor"><path d="M6 4l14 8-14 8V4z" /></svg>
                  </span>
                </button>
              )}
            </div>
            <div className="mt-3 flex items-center gap-3 px-3 pb-2">
              <div className="h-1 flex-1 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                <div className="h-full bg-black dark:bg-white transition-[width] duration-75" style={{ width: `${t}%` }} />
              </div>
              <span className="font-mono text-[10px] text-neutral-400">90s</span>
            </div>
          </div>
        </div>
      </div>
    </SlideShell>
  );
}

/* ---------- 7. PRICING ---------- */
function PricingSlide({ index }: { index: number }) {
  const tiers = [
    {
      name: "Starter",
      price: "0",
      tag: "Try the product",
      cta: "Start free",
      featured: false,
      features: ["3 decks per month", "Up to 12 slides / deck", "PPTX & PDF export", "Watermark on export"],
    },
    {
      name: "Pro",
      price: "24",
      tag: "For people who pitch",
      cta: "Go Pro",
      featured: true,
      features: ["Unlimited decks", "Reference style upload", "Native Keynote export", "Brand kit lock", "Priority compose"],
    },
    {
      name: "Team",
      price: "72",
      tag: "Per editor / month",
      cta: "Talk to us",
      featured: false,
      features: ["Everything in Pro", "Shared brand library", "Version history", "SSO + audit log", "Dedicated reviewer"],
    },
  ];

  return (
    <SlideShell index={index}>
      <div className="max-w-[1400px]">
        <div className="flex items-end justify-between flex-wrap gap-6 mb-16">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.4em] text-neutral-500 mb-6">06 — Pricing</div>
            <h2 className="text-[clamp(2.5rem,6vw,6rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
              Pay for the deck.<br />
              <span className="italic font-light text-neutral-400">Not the seat.</span>
            </h2>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-neutral-200 dark:border-neutral-800 p-1 text-xs font-medium">
            <span className="rounded-full bg-black px-4 py-1.5 text-white dark:bg-white dark:text-black">Monthly</span>
            <span className="px-4 py-1.5 text-neutral-500">Yearly · save 20%</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-neutral-200 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className={`relative rounded-xl p-10 lg:p-12 ${tier.featured ? "bg-black text-white dark:bg-white dark:text-black" : "glass"}`}
            >
              {tier.featured && (
                <span className="absolute right-6 top-6 rounded-full bg-white/15 dark:bg-black/15 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.25em]">
                  Most picked
                </span>
              )}
              <div className="text-xs font-medium uppercase tracking-[0.3em] opacity-60">{tier.name}</div>
              <div className="mt-2 text-sm opacity-70">{tier.tag}</div>
              <div className="mt-10 flex items-baseline gap-2">
                <span className="text-7xl font-semibold tracking-[-0.04em]">${tier.price}</span>
                <span className="text-sm opacity-60">/mo</span>
              </div>
              <button
                className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium transition ${
                  tier.featured
                    ? "bg-white text-black hover:bg-neutral-200 dark:bg-black dark:text-white dark:hover:bg-neutral-800"
                    : "bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                }`}
              >
                {tier.cta} <I.Arrow className="h-4 w-4" />
              </button>
              <ul className="mt-10 space-y-3 text-sm">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <I.Check className="h-4 w-4 mt-0.5 flex-shrink-0 opacity-80" />
                    <span className="opacity-90">{f}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-6 text-xs text-neutral-500">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="flex items-center gap-1.5"><I.Check className="h-3 w-3" /> 14-day refund</span>
            <span className="flex items-center gap-1.5"><I.Check className="h-3 w-3" /> Cancel anytime</span>
            <span className="flex items-center gap-1.5"><I.Check className="h-3 w-3" /> SOC 2 Type II</span>
          </div>
          <span>Need 50+ seats? <a className="underline underline-offset-4 hover:text-black dark:hover:text-white" href="#">Enterprise →</a></span>
        </div>
      </div>
    </SlideShell>
  );
}

/* ---------- 8. ASK / CTA ---------- */
function AskSlide({ index }: { index: number }) {
  return (
    <SlideShell index={index} className="overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 1.05 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute -left-[15vw] top-1/2 -translate-y-1/2 z-0"
      >
        <LogoMark className="h-[120vh] w-[120vh] opacity-[0.18] dark:opacity-[0.22]" title="" />
      </motion.div>

      <div className="relative z-10 ml-auto max-w-[60%]">
        <div className="text-xs font-medium uppercase tracking-[0.4em] text-neutral-500">Start now</div>
        <h2 className="mt-8 text-[clamp(3rem,9vw,10rem)] font-semibold leading-[0.86] tracking-[-0.045em]">
          Stop<br />
          generating <span className="italic font-light text-neutral-400">slop.</span><br />
          Make decks<br />
          that <span className="underline decoration-[3px] underline-offset-[14px]">land.</span>
        </h2>
        <div className="mt-14 flex flex-col sm:flex-row gap-4">
          <Magnetic className="group inline-flex items-center gap-3 rounded-full bg-black px-8 py-4 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition">
            Make a deck — free
            <I.Arrow className="h-4 w-4 transition group-hover:translate-x-1" />
          </Magnetic>
          <button className="inline-flex items-center gap-2 rounded-full border border-neutral-300 dark:border-neutral-700 px-8 py-4 text-sm font-medium hover:border-black dark:hover:border-white transition">
            Talk to the team
          </button>
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-6 text-xs font-medium uppercase tracking-[0.25em] text-neutral-400">
          <span className="flex items-center gap-2"><I.Check className="h-3 w-3" /> No card</span>
          <span className="flex items-center gap-2"><I.Check className="h-3 w-3" /> 3 free decks / mo</span>
          <span className="flex items-center gap-2"><I.Check className="h-3 w-3" /> Cancel anytime</span>
        </div>
      </div>
    </SlideShell>
  );
}

const slideComponents: React.FC<{ index: number }>[] = [
  CoverSlide, CompareSlide, HowSlide, ReferenceSlide, ControlSlide, DemoSlide, PricingSlide, AskSlide,
];

/* ---------- Cursor follower ---------- */
function CursorGlow() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  if (!enabled) return null;
  return <CursorGlowInner />;
}

function CursorGlowInner() {
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const lagX = useSpring(x, { stiffness: 500, damping: 32, mass: 0.3 });
  const lagY = useSpring(y, { stiffness: 500, damping: 32, mass: 0.3 });
  const innerCx = useTransform(x, (v) => v - 10);
  const innerCy = useTransform(y, (v) => v - 10);
  const ghostCx = useTransform(lagX, (v) => v - 18);
  const ghostCy = useTransform(lagY, (v) => v - 18);
  const innerScale = useSpring(1, { stiffness: 300, damping: 22 });
  const innerRotate = useSpring(0, { stiffness: 300, damping: 22 });
  const ghostScale = useSpring(1, { stiffness: 220, damping: 22 });
  const [mode, setMode] = useState<"idle" | "hot" | "drag">("idle");
  const [label, setLabel] = useState<string>("");

  useEffect(() => {
    let lastMode: "idle" | "hot" | "drag" = "idle";
    let lastLabel = "";
    const apply = (m: "idle" | "hot" | "drag", l: string) => {
      if (m !== lastMode) { lastMode = m; setMode(m); }
      if (l !== lastLabel) { lastLabel = l; setLabel(l); }
    };
    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const t = e.target as HTMLElement;
      const hot = t?.closest?.("button, a, [role='button'], [data-cursor-hot], [draggable='true'], input, textarea, select, summary, label") as HTMLElement | null;
      if (lastMode === "drag") return;
      if (hot) apply("hot", hot.getAttribute("data-cursor-label") || "");
      else apply("idle", "");
    };
    const onLeaveWindow = () => { x.set(-200); y.set(-200); apply("idle", ""); };
    const onDragStart = () => apply("drag", "Drag");
    const onDragEnd = () => apply("idle", "");
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", (e: MouseEvent) => { if (!e.relatedTarget) onLeaveWindow(); });
    window.addEventListener("dragstart", onDragStart);
    window.addEventListener("dragend", onDragEnd);
    window.addEventListener("drop", onDragEnd);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("dragstart", onDragStart);
      window.removeEventListener("dragend", onDragEnd);
      window.removeEventListener("drop", onDragEnd);
    };
  }, [x, y]);

  // Drive springs from mode — keeps every transform on ONE element each frame.
  useEffect(() => {
    if (mode === "drag") { innerScale.set(0.6); ghostScale.set(1.6); innerRotate.set(45); }
    else if (mode === "hot") { innerScale.set(1.4); ghostScale.set(1.4); innerRotate.set(0); }
    else { innerScale.set(1); ghostScale.set(1); innerRotate.set(0); }
  }, [mode, innerScale, ghostScale, innerRotate]);

  return (
    <>
      {/* Trailing ghost star — translate AND scale on the same element, no nested transforms */}
      <motion.div
        style={{ x: ghostCx, y: ghostCy, scale: ghostScale, transformOrigin: "18px 18px" }}
        className="pointer-events-none fixed left-0 top-0 z-[100] hidden md:block will-change-transform"
        aria-hidden
      >
        <motion.svg
          viewBox="0 0 80 80"
          animate={{ rotate: 360 }}
          transition={{ rotate: { duration: 14, repeat: Infinity, ease: "linear" } }}
          className="h-9 w-9 opacity-30"
        >
          <path
            d="M40 6 L46 34 L74 40 L46 46 L40 74 L34 46 L6 40 L34 34 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
            className="text-black dark:text-white"
          />
        </motion.svg>
      </motion.div>

      {/* Inner snappy star — every transform on this single element */}
      <motion.div
        style={{ x: innerCx, y: innerCy, scale: innerScale, rotate: innerRotate, transformOrigin: "10px 10px" }}
        className="pointer-events-none fixed left-0 top-0 z-[101] hidden md:block will-change-transform"
        aria-hidden
      >
        <svg viewBox="0 0 80 80" className="h-5 w-5 block">
          <path
            d="M40 6 L46 34 L74 40 L46 46 L40 74 L34 46 L6 40 L34 34 Z"
            className="fill-black stroke-white dark:fill-white dark:stroke-black"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>

      {/* Label pill */}
      <AnimatePresence>
        {label && (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            style={{ x, y }}
            className="pointer-events-none fixed left-0 top-0 z-[102] hidden md:block"
          ><div className="translate-x-4 translate-y-4">
            <span className="rounded-full bg-black px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.25em] text-white dark:bg-white dark:text-black">
              {label}
            </span>
          </div></motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------- Side section rail ---------- */
function SectionRail() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-slide-index]"));
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.slideIndex);
            setActive(i);
          }
        });
      },
      { threshold: 0.5 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const labels = ["Cover", "Why", "How", "Style", "Control", "Demo", "Pricing", "Start"];
  return (
    <div className="pointer-events-none fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-3">
      {labels.map((label, i) => (
        <button
          key={label}
          onClick={() => document.querySelectorAll<HTMLElement>("[data-slide-index]")[i]?.scrollIntoView({ behavior: "smooth" })}
          className="pointer-events-auto group flex items-center gap-3 justify-end"
          aria-label={`Go to ${label}`}
        >
          <span className={`text-[10px] font-medium uppercase tracking-[0.3em] transition ${active === i ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"} ${active === i ? "text-black dark:text-white" : ""}`}>
            {label}
          </span>
          <motion.span
            animate={{ scale: active === i ? 1.6 : 1, opacity: active === i ? 1 : 0.4 }}
            transition={{ duration: 0.3 }}
            className="h-1 w-1 rounded-full bg-black dark:bg-white"
          />
        </button>
      ))}
    </div>
  );
}

/* ---------- Page-load curtain ---------- */
function LoadCurtain() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setDone(true), 1100);
    return () => clearTimeout(id);
  }, []);
  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.9, ease: [0.83, 0, 0.17, 1] }}
          className="fixed inset-0 z-[80] bg-black flex items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="text-white"
          >
            <LogoMark className="h-16 w-16" monochrome title="" />
          </motion.div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.9, ease: [0.83, 0, 0.17, 1] }}
            className="absolute bottom-0 left-0 h-px bg-white"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- App ---------- */
export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const themeButtonRef = useRef<HTMLButtonElement | null>(null);
  const switchingRef = useRef(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });
  const [trialOpen, setTrialOpen] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [authReason, setAuthReason] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email: string; name: string; accessToken: string } | null>(null);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  useEffect(() => {
    const onWaitlist = () => setWaitlistOpen(true);
    window.addEventListener("moonshot:open-waitlist", onWaitlist);
    return () => window.removeEventListener("moonshot:open-waitlist", onWaitlist);
  }, []);

  const overlayOpen = trialOpen || workspaceOpen || waitlistOpen || !!authReason;
  useEffect(() => {
    document.body.style.overflow = overlayOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [overlayOpen]);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session?.user && session.access_token) {
        const u = session.user;
        setUser({
          id: u.id,
          email: u.email ?? "",
          name: (u.user_metadata?.name as string) || (u.email?.split("@")[0] ?? "you"),
          accessToken: session.access_token,
        });
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { setUser(null); return; }
      const u = session.user;
      setUser({
        id: u.id,
        email: u.email ?? "",
        name: (u.user_metadata?.name as string) || (u.email?.split("@")[0] ?? "you"),
        accessToken: session.access_token,
      });
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  const applyTheme = useCallback((next: "light" | "dark") => {
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.style.backgroundColor = next === "dark" ? "#000000" : "#ffffff";
    document.body.style.backgroundColor = next === "dark" ? "#000000" : "#ffffff";
    setTheme(next);
  }, []);

  const toggleTheme = (e?: React.MouseEvent) => {
    if (switchingRef.current) return;
    switchingRef.current = true;
    const next: "light" | "dark" = theme === "light" ? "dark" : "light";

    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    if (e) { x = e.clientX; y = e.clientY; }
    else if (themeButtonRef.current) {
      const r = themeButtonRef.current.getBoundingClientRect();
      x = r.left + r.width / 2; y = r.top + r.height / 2;
    }

    const doc = document as Document & { startViewTransition?: (cb: () => void | Promise<void>) => { ready: Promise<void>; finished: Promise<void> } };
    if (!doc.startViewTransition) {
      applyTheme(next);
      switchingRef.current = false;
      return;
    }

    const transition = doc.startViewTransition(() => {
      flushSync(() => applyTheme(next));
    });

    transition.ready.then(() => {
      const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 520,
          easing: "cubic-bezier(0.83, 0, 0.17, 1)",
          pseudoElement: "::view-transition-new(root)",
          fill: "forwards",
        }
      );
    });

    transition.finished.finally(() => {
      switchingRef.current = false;
    });
  };

  useEffect(() => {
    document.documentElement.style.backgroundColor = theme === "dark" ? "#000000" : "#ffffff";
    document.body.style.backgroundColor = theme === "dark" ? "#000000" : "#ffffff";
  }, [theme]);

  /* keyboard navigation */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const els = Array.from(document.querySelectorAll<HTMLElement>("[data-slide-index]"));
      const cur = els.findIndex((el) => {
        const r = el.getBoundingClientRect();
        return r.top >= -10 && r.top < window.innerHeight / 2;
      });
      const idx = Math.max(0, cur);
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        els[Math.min(els.length - 1, idx + 1)]?.scrollIntoView({ behavior: "smooth" });
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        els[Math.max(0, idx - 1)]?.scrollIntoView({ behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={`${theme === "dark" ? "dark" : ""} font-sans selection:bg-neutral-200 dark:selection:bg-neutral-800`}>
      <div className={`relative min-h-screen text-black dark:text-white ${overlayOpen ? "" : "md:cursor-none"}`} style={{ backgroundColor: "transparent" }}>

        <LoadCurtain />
        {!overlayOpen && <CursorGlow />}
        {!overlayOpen && <SectionRail />}

        {/* Top scroll progress */}
        <motion.div
          style={{ scaleX, transformOrigin: "0%" }}
          className="fixed top-0 left-0 right-0 z-[55] h-[2px] bg-black dark:bg-white"
        />

        {/* Disable view-transition default cross-fade so the radial wipe owns it */}
        <style>{`
          ::view-transition-old(root),
          ::view-transition-new(root) {
            animation: none;
            mix-blend-mode: normal;
          }
          ::view-transition-old(root) { z-index: 1; }
          ::view-transition-new(root) { z-index: 2; }
          html, body { background-color: #f5f3ef; }
          html.dark, html.dark body { background-color: #07070a; }
        `}</style>

        {/* Minimal header */}
        <header className="fixed inset-x-0 top-0 z-50 glass-subtle">
          <div className="flex h-14 items-center justify-between px-5 sm:px-8 lg:px-12">
            <a href="#" className="flex items-center gap-2.5">
              <LogoMark className="h-5 w-5" title="Moonshot" />
              <span className="text-sm font-semibold tracking-tight">Moonshot</span>
            </a>

            <div className="flex items-center gap-2">
              <button
                ref={themeButtonRef}
                onClick={(e) => toggleTheme(e)}
                className="group relative flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-white transition"
                aria-label="Toggle theme"
              >
                <motion.div
                  animate={{ rotate: theme === "light" ? 0 : 180 }}
                  transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
                >
                  <svg viewBox="0 0 16 16" className="h-4 w-4 text-black dark:text-white">
                    <defs><clipPath id="moon-phase-clip"><circle cx="8" cy="8" r="6" /></clipPath></defs>
                    <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    <g clipPath="url(#moon-phase-clip)"><circle cx="11.5" cy="8" r="6" fill="currentColor" /></g>
                  </svg>
                </motion.div>
              </button>
              {user ? (
                <button
                  onClick={() => setWorkspaceOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-black text-white dark:bg-white dark:text-black px-3 sm:px-4 py-2 text-xs font-medium hover:opacity-90 transition"
                  data-cursor-label="Workspace"
                >
                  <span className="h-5 w-5 rounded-full bg-white/20 dark:bg-black/20 flex items-center justify-center text-[9px] font-semibold">
                    {user.name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}
                  </span>
                  <span className="hidden sm:inline">Open workspace</span>
                  <span className="sm:hidden">Workspace</span>
                  <I.Arrow className="h-3 w-3" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setAuthReason("Sign in")}
                    className="hidden sm:inline-flex items-center rounded-full px-3 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white transition"
                    data-cursor-label="Sign in"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => setWaitlistOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-black text-white dark:bg-white dark:text-black px-3 sm:px-4 py-2 text-xs font-medium hover:opacity-90 transition whitespace-nowrap"
                    data-cursor-label="Join"
                  >
                    Get early access <I.Arrow className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Slide deck — full-bleed, natural smooth scroll */}
        <main
          className="relative"
          aria-hidden={overlayOpen}
          style={overlayOpen ? { visibility: "hidden", contentVisibility: "hidden" } as React.CSSProperties : undefined}
        >
          {slideComponents.map((Slide, i) => (
            <Slide key={i} index={i} />
          ))}
        </main>

        {/* Trial composer */}
        <AnimatePresence>
          {trialOpen && (
            <motion.div
              key="trial"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              transformTemplate={({ scale }, generated) => (scale === 1 || scale === "1" ? "none" : generated)}
              className="fixed inset-0 z-[70]"
            >
              <TrialComposer
                onClose={() => setTrialOpen(false)}
                onAuthGate={(reason) => setAuthReason(reason)}
                authedUser={user}
                onSavedDeck={() => { setTrialOpen(false); setWorkspaceOpen(true); }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Waitlist */}
        <AnimatePresence>
          {waitlistOpen && (
            <Waitlist key="waitlist" onClose={() => setWaitlistOpen(false)} />
          )}
        </AnimatePresence>

        {/* Auth gate */}
        <AnimatePresence>
          {authReason && (
            <AuthModal
              reason={authReason}
              onClose={() => setAuthReason(null)}
              onAuthed={(u) => { setUser(u); setAuthReason(null); setWorkspaceOpen(true); }}
            />
          )}
          {workspaceOpen && user && (
            <Workspace
              user={user}
              onClose={() => setWorkspaceOpen(false)}
              onSignOut={async () => { await supabase.auth.signOut(); setUser(null); setWorkspaceOpen(false); }}
              onNewDeck={() => { setWorkspaceOpen(false); setTrialOpen(true); }}
              onOpenDeck={(_deck) => { setWorkspaceOpen(false); setTrialOpen(true); }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
