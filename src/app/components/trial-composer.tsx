import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "motion/react";
import { LogoMark } from "./logo-mark";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

const sIcon = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const Icon = {
  Back:  ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>),
  Spark: ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></svg>),
  Lock:  ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><rect x="5" y="11" width="14" height="9" rx="1.5" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>),
  Check: ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><path d="M4 12l5 5L20 6" /></svg>),
  Arrow: ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><path d="M4 12h15M13 6l6 6-6 6" /></svg>),
  Image: ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5" fill="currentColor"/><path d="M21 16l-5-5-9 9"/></svg>),
  X:     ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><path d="M6 6l12 12M18 6L6 18"/></svg>),
  Plus:  ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><path d="M12 5v14M5 12h14"/></svg>),
};

const STYLES = [
  { id: "editorial", name: "Editorial", note: "Serif · airy",        swatches: ["#0F0F0F", "#FFFFFF", "#D8D8D8"], sample: "A measured argument." },
  { id: "modern",    name: "Modern",    note: "Sans · high contrast", swatches: ["#000000", "#F5F5F5", "#E54B4B"], sample: "Bold. Fast. Clear." },
  { id: "muted",     name: "Muted",     note: "Neutral · low key",    swatches: ["#1A1A1A", "#E8E4DC", "#7B6F5C"], sample: "Quietly confident." },
];

type Slide = { title: string; body: string; metric?: { k: string; v: string } | null; chart: number[] };

const FALLBACK_DECK: Slide[] = [
  { title: "Your idea",        body: "Cover — the one-line argument the room walks away with.",                                                  metric: null,                          chart: [40, 55, 62, 70, 78, 88, 95] },
  { title: "The shift",        body: "What changed in the market that makes this moment different — written from the audience's seat.",          metric: { k: "Market", v: "+38%" },    chart: [62, 58, 71, 80, 75, 92, 88] },
  { title: "What we propose",  body: "The three moves we're making — and the one number that proves they work.",                                  metric: { k: "Pilot ROI", v: "60d" },  chart: [30, 42, 50, 64, 79, 91, 102] },
];

async function composeFromAPI(brief: string, referenceImage: string | null): Promise<Slide[]> {
  try {
    const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-84204692/ai/trial-compose`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
      body: JSON.stringify({ brief, referenceImage }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("trial-compose request failed:", res.status, err);
      return FALLBACK_DECK;
    }
    const data = await res.json();
    const slides = data?.result?.slides;
    if (!Array.isArray(slides) || slides.length === 0) {
      console.error("trial-compose returned no slides:", data);
      return FALLBACK_DECK;
    }
    return slides.map((s: any) => ({
      title: typeof s.title === "string" ? s.title : "Untitled",
      body: typeof s.body === "string" ? s.body : "",
      metric: s.metric && typeof s.metric === "object" ? { k: String(s.metric.k ?? ""), v: String(s.metric.v ?? "") } : null,
      chart: Array.isArray(s.chart) && s.chart.length >= 5 ? s.chart.slice(0, 7).map((n: any) => Number(n) || 0) : [40, 55, 62, 70, 78, 88, 95],
    }));
  } catch (e) {
    console.error("trial-compose threw:", e);
    return FALLBACK_DECK;
  }
}

type Step = "setup" | "compose" | "edit";

const COMPOSE_PHASES = [
  { at: 0,  label: "Reading the brief" },
  { at: 28, label: "Choosing the layout" },
  { at: 55, label: "Drawing the charts" },
  { at: 80, label: "Setting the type" },
];

const EXAMPLES = [
  "Series B raise — B2B SaaS at $4M ARR, retention story",
  "Q3 board update — beat plan, mid-market churn signal",
  "Sales pitch — F500 ops leader, ROI in 60 days",
];

export function TrialComposer({
  onClose,
  onAuthGate,
  authedUser,
  onSavedDeck,
}: {
  onClose: () => void;
  onAuthGate: (reason: string) => void;
  authedUser?: { accessToken: string } | null;
  onSavedDeck?: () => void;
}) {
  const [step, setStep] = useState<Step>("setup");
  const [prompt, setPrompt] = useState("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [styleId, setStyleId] = useState(STYLES[1].id); // default Modern — most universal
  const [slides, setSlides] = useState<Slide[]>([]);
  const [active, setActive] = useState(0);
  const [composeT, setComposeT] = useState(0);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setReferenceImage(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => console.error("reference image read failed");
    reader.readAsDataURL(file);
  };

  useEffect(() => { if (step === "setup") promptRef.current?.focus(); }, [step]);

  // Cmd/Ctrl + Enter from anywhere in setup → compose
  useEffect(() => {
    if (step !== "setup") return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && prompt.trim().length >= 8) {
        e.preventDefault();
        setStep("compose");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, prompt]);

  // Compose: smooth progress + real API call
  useEffect(() => {
    if (step !== "compose") return;
    setComposeT(0);
    let cancelled = false;
    let apiResult: Slide[] | null = null;

    composeFromAPI(prompt, referenceImage).then((result) => {
      if (!cancelled) apiResult = result;
    });

    const id = setInterval(() => {
      setComposeT((t) => {
        const ceiling = apiResult ? 100 : 88;
        const rate = t < 60 ? 1.3 : t < 85 ? 0.7 : 2.2;
        const next = Math.min(ceiling, t + rate);
        if (next >= 100 && apiResult) {
          clearInterval(id);
          setSlides(apiResult);
          setTimeout(() => { if (!cancelled) setStep("edit"); }, 350);
          return 100;
        }
        return next;
      });
    }, 32);
    return () => { cancelled = true; clearInterval(id); };
  }, [step, prompt, referenceImage]);

  const updateSlide = (i: number, patch: Partial<Slide>) =>
    setSlides((s) => s.map((sl, idx) => (idx === i ? { ...sl, ...patch } : sl)));

  const styleObj = STYLES.find((s) => s.id === styleId)!;
  const phase = [...COMPOSE_PHASES].reverse().find((p) => composeT >= p.at) ?? COMPOSE_PHASES[0];
  const canCompose = prompt.trim().length >= 8;

  return (
    <div className="fixed inset-0 z-[70] text-black dark:text-white overflow-y-auto bg-[#f5f3ef] dark:bg-[#07070a] moonshot-page">
      <AmbientBackdrop />

      {/* Header */}
      <header className="sticky top-3 mx-3 z-20 rounded-2xl glass-subtle">
        <div className="flex items-center justify-between h-14 px-4 sm:px-6 lg:px-10 max-w-[1400px] mx-auto gap-3">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white transition"
            data-cursor-label="Back"
          >
            <Icon.Back className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-4 w-4" title="" />
            <span className="text-sm font-semibold tracking-tight">Moonshot</span>
          </div>
          <ProgressBeads step={step} />
        </div>
      </header>

      {/* Body */}
      <main className="relative z-10 px-4 sm:px-6 lg:px-10 pt-12 sm:pt-16 pb-24 sm:pb-32 max-w-[1100px] mx-auto">
        <AnimatePresence mode="wait">
          {step === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              transformTemplate={({ y }, generated) => (y === "0px" || y === 0 ? "none" : generated)}
            >
              <div className="text-[10px] font-medium uppercase tracking-[0.4em] text-neutral-500 mb-6">New deck</div>
              <h1 className="text-[clamp(2.2rem,5vw,4rem)] font-semibold leading-[1] tracking-[-0.04em]">
                What do you want to make?
              </h1>
              <p className="mt-5 text-base text-neutral-500 dark:text-neutral-400 max-w-xl leading-relaxed">
                One sentence is enough. We'll read who you're proving it to and the tone the room expects.
              </p>

              {/* Composer card */}
              <div className="mt-10 rounded-2xl glass-strong focus-within:ring-2 focus-within:ring-black/40 dark:focus-within:ring-white/30 transition">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ""; }}
                />

                <textarea
                  ref={promptRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value.slice(0, 600))}
                  placeholder="Series B raise for a B2B SaaS · retention story · 12-min slot"
                  rows={3}
                  className="w-full resize-none bg-transparent outline-none px-6 pt-6 pb-3 text-lg leading-relaxed placeholder:text-neutral-400"
                />

                {/* Inline reference image preview */}
                {referenceImage && (
                  <div className="px-6 pb-3">
                    <div className="inline-flex items-center gap-3 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] ring-1 ring-black/10 dark:ring-white/10 p-2 pr-3">
                      <img src={referenceImage} alt="reference" className="h-10 w-10 rounded-md object-cover" />
                      <div className="text-[11px]">
                        <div className="font-medium">Reference attached</div>
                        <div className="text-neutral-500">Drives the visual mood</div>
                      </div>
                      <button
                        onClick={() => setReferenceImage(null)}
                        className="ml-1 h-6 w-6 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center"
                        aria-label="Remove reference"
                      >
                        <Icon.X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3 px-4 pb-4">
                  {!referenceImage && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5 transition"
                      data-cursor-label="Reference"
                    >
                      <Icon.Image className="h-3.5 w-3.5" /> Reference
                    </button>
                  )}

                  {/* Style chips */}
                  <div className="flex items-center gap-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] p-1">
                    {STYLES.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setStyleId(st.id)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                          styleId === st.id
                            ? "bg-white dark:bg-neutral-800 text-black dark:text-white shadow-sm"
                            : "text-neutral-500 hover:text-black dark:hover:text-white"
                        }`}
                        data-cursor-label={st.name}
                      >
                        {st.name}
                      </button>
                    ))}
                  </div>

                  <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-neutral-400 ml-auto hidden sm:inline">
                    {prompt.length}/600 · ⌘ Enter
                  </span>

                  <button
                    onClick={() => canCompose && setStep("compose")}
                    disabled={!canCompose}
                    className="group inline-flex items-center gap-2 rounded-full bg-black text-white dark:bg-white dark:text-black px-5 py-2.5 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition"
                    data-cursor-label="Compose"
                  >
                    Compose <Icon.Spark className="h-3.5 w-3.5 transition group-hover:rotate-90" />
                  </button>
                </div>
              </div>

              {/* Examples */}
              <div className="mt-10">
                <div className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-400 mb-3">Try one</div>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLES.map((ex, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ y: -1 }}
                      onClick={() => { setPrompt(ex); promptRef.current?.focus(); }}
                      className="rounded-full glass px-3.5 py-2 text-xs hover:ring-black/40 dark:hover:ring-white/30 transition text-left"
                    >
                      {ex}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Trial fineprint */}
              <div className="mt-10 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-neutral-400">
                <span className="flex items-center gap-1.5"><Icon.Check className="h-3 w-3" /> 3 slides free</span>
                <span className="flex items-center gap-1.5"><Icon.Check className="h-3 w-3" /> No credit card</span>
                <span className="flex items-center gap-1.5"><Icon.Check className="h-3 w-3" /> Edit anything</span>
              </div>
            </motion.div>
          )}

          {step === "compose" && (
            <motion.div
              key="compose"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="min-h-[70vh] flex flex-col items-center pt-6"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={phase.label}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35 }}
                  className="text-[10px] font-medium uppercase tracking-[0.45em] text-neutral-500"
                >
                  · {phase.label} ·
                </motion.div>
              </AnimatePresence>

              <h2 className="mt-3 text-[clamp(1.5rem,3vw,2.4rem)] font-semibold tracking-[-0.03em] max-w-2xl leading-[1.05] text-center">
                Composing your deck.
              </h2>
              <p className="mt-4 max-w-md text-sm italic text-neutral-500 dark:text-neutral-400 leading-relaxed text-center">
                "{prompt}"
              </p>

              {/* Cinematic stage — hero slide with neighbors at depth */}
              <ComposeStage composeT={composeT} styleId={styleId} />

              {/* Progress + orbital */}
              <div className="mt-12 flex items-center gap-5 w-full max-w-md">
                <ComposeOrbital t={composeT} />
                <div className="flex-1">
                  <div className="h-[2px] rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <motion.div
                      style={{ width: `${composeT}%` }}
                      transition={{ duration: 0.05 }}
                      className="h-full bg-black dark:bg-white"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-neutral-400 uppercase tracking-[0.25em]">
                    <span>{Math.round(composeT).toString().padStart(2, "0")}%</span>
                    <span>{styleObj.name}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === "edit" && slides.length > 0 && (
            <EditReel
              slides={slides}
              active={active}
              setActive={setActive}
              updateSlide={updateSlide}
              styleId={styleId}
              styleName={styleObj.name}
              prompt={prompt}
              authedUser={authedUser}
              onAuthGate={onAuthGate}
              onClose={onClose}
              onSavedDeck={onSavedDeck}
              onEditBrief={() => setStep("setup")}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ---------- helpers ---------- */

function ProgressBeads({ step }: { step: Step }) {
  const order: Step[] = ["setup", "compose", "edit"];
  const idx = order.indexOf(step);
  const labels: Record<Step, string> = { setup: "Brief", compose: "Compose", edit: "Edit" };
  return (
    <div className="hidden md:flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-500">
      {order.map((s, i) => {
        const done = i < idx;
        const cur = i === idx;
        return (
          <span key={s} className="flex items-center gap-2">
            {i > 0 && <span className="h-px w-5 bg-neutral-300 dark:bg-neutral-700" />}
            <span className={`flex items-center gap-1.5 ${cur ? "text-black dark:text-white" : ""}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${cur || done ? "bg-black dark:bg-white" : "bg-neutral-300 dark:bg-neutral-700"}`} />
              {labels[s]}
            </span>
          </span>
        );
      })}
    </div>
  );
}

function ComposeOrbital({ t }: { t: number }) {
  const x = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 60, damping: 20 });
  useEffect(() => { x.set(t); }, [t, x]);
  const ringScale = useTransform(sx, [0, 100], [0.8, 1]);

  return (
    <motion.div style={{ scale: ringScale }} className="relative h-32 w-32">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0"
      >
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={`${Math.max(2, t * 2.76)} 999`}
            transform="rotate(-90 50 50)"
          />
        </svg>
      </motion.div>
      <div className="absolute inset-0 flex items-center justify-center">
        <LogoMark className="h-10 w-10" title="" />
      </div>
    </motion.div>
  );
}

function SlideCanvas({
  slide, index, total, onUpdate, styleId,
}: {
  slide: Slide; index: number; total: number; onUpdate: (p: Partial<Slide>) => void; styleId: string;
}) {
  const isEditorial = styleId === "editorial";
  const isMuted = styleId === "muted";
  const max = useMemo(() => Math.max(...slide.chart, 1), [slide.chart]);
  const numeral = (index + 1).toString().padStart(2, "0");

  // Cursor-tracked glare (no 3D tilt — keeps text pixel-crisp)
  const stageRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const tx = useSpring(mx, { stiffness: 80, damping: 20 });
  const ty = useSpring(my, { stiffness: 80, damping: 20 });
  const glareX = useTransform(tx, (v) => 50 + v * 40);
  const glareY = useTransform(ty, (v) => 50 + v * 40);

  const onMove = (e: React.MouseEvent) => {
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  // Build a smooth area-chart polygon
  const points = slide.chart.map((v, i) => {
    const x = (i / (slide.chart.length - 1)) * 100;
    const y = 100 - (v / max) * 100;
    return `${x},${y}`;
  });
  const areaPath = `M0,100 L${points.join(" L")} L100,100 Z`;
  const linePath = `M${points.join(" L")}`;

  return (
    <div
      ref={stageRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative py-10"
    >

      <motion.div
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={`relative z-[1] aspect-[16/10] w-full rounded-2xl ring-1 ring-black/10 dark:ring-white/10 shadow-[0_60px_140px_-40px_rgba(0,0,0,0.45)] overflow-hidden ${
          isMuted
            ? "bg-[#E8E4DC] dark:bg-[#1a1815] text-[#1A1A1A] dark:text-[#E8E4DC]"
            : "bg-white dark:bg-neutral-950"
        }`}
      >
        {/* Specular cursor glare */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[3] opacity-25 mix-blend-soft-light"
          style={{
            background: useTransform([glareX, glareY], ([gx, gy]: number[]) =>
              `radial-gradient(360px circle at ${gx}% ${gy}%, rgba(255,255,255,0.5), transparent 55%)`
            ),
          }}
        />
        {/* Atmospheric numeral — page-design touch */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-4 -top-12 select-none font-semibold leading-[0.8] tracking-[-0.08em] text-black/[0.05] dark:text-white/[0.07]"
          style={{ fontSize: "clamp(10rem, 22vw, 22rem)" }}
        >
          {numeral}
        </div>

        {/* Chrome */}
        <div className="absolute top-6 left-8 right-8 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.35em] text-neutral-500 dark:text-neutral-400">
          <span className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-black dark:bg-white" />
            Moonshot
          </span>
          <span className="font-mono">{numeral} / {total.toString().padStart(2, "0")}</span>
        </div>

        {/* Two-column editorial grid */}
        <div className="absolute inset-0 grid grid-cols-[1.35fr_1fr] gap-8 px-8 lg:px-14 pt-20 pb-12">
          {/* Left: type column */}
          <div className="flex flex-col">
            <div className="text-[10px] font-medium uppercase tracking-[0.4em] text-neutral-400">
              {index === 0 ? "Cover" : `Section ${numeral}`}
            </div>
            <input
              value={slide.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              spellCheck={false}
              className={`mt-3 w-full bg-transparent outline-none focus:bg-black/[0.03] dark:focus:bg-white/[0.04] rounded-md px-1 -mx-1 transition leading-[0.95] tracking-[-0.04em] ${
                isEditorial
                  ? "font-serif italic font-medium text-[clamp(1.6rem,3.6vw,2.8rem)]"
                  : "font-semibold text-[clamp(1.6rem,3.4vw,2.6rem)]"
              }`}
            />

            <div className="mt-5 flex items-start gap-3 max-w-md">
              <span className="mt-1 h-px w-6 bg-black dark:bg-white shrink-0" />
              <textarea
                value={slide.body}
                onChange={(e) => onUpdate({ body: e.target.value })}
                rows={3}
                spellCheck={false}
                className="flex-1 resize-none bg-transparent outline-none text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300 focus:bg-black/[0.03] dark:focus:bg-white/[0.04] rounded-md px-1 -mx-1 transition"
              />
            </div>

            <div className="mt-auto">
              {slide.metric && (
                <div>
                  <div className="text-[9px] font-medium uppercase tracking-[0.4em] text-neutral-400">
                    {slide.metric.k}
                  </div>
                  <div className="mt-1 text-[clamp(2.2rem,5vw,4rem)] font-semibold tracking-[-0.04em] leading-none">
                    {slide.metric.v}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: data panel */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between text-[9px] font-medium uppercase tracking-[0.3em] text-neutral-400">
              <span>Cohort series</span>
              <span className="font-mono">N={slide.chart.length}</span>
            </div>

            <div className="mt-3 relative flex-1 rounded-lg ring-1 ring-black/5 dark:ring-white/5 bg-black/[0.02] dark:bg-white/[0.03] p-3 overflow-hidden">
              {/* Gridlines */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-3 h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)]">
                {[25, 50, 75].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    x2="100"
                    y1={y}
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity="0.08"
                    strokeWidth="0.4"
                    strokeDasharray="1,1.5"
                  />
                ))}
                <defs>
                  <linearGradient id={`area-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <motion.path
                  d={areaPath}
                  fill={`url(#area-${index})`}
                  className="text-black dark:text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.6 }}
                />
                <motion.path
                  d={linePath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-black dark:text-white"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.15, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  vectorEffect="non-scaling-stroke"
                />
                {points.map((p, i) => {
                  const [x, y] = p.split(",").map(Number);
                  const isPeak = i === slide.chart.length - 1;
                  return (
                    <motion.circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={isPeak ? 1.6 : 0.9}
                      className="fill-black dark:fill-white"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + i * 0.04, duration: 0.3 }}
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
              </svg>

              {/* X-axis labels */}
              <div className="absolute bottom-1 left-3 right-3 flex justify-between text-[7px] font-mono text-neutral-400 uppercase tracking-widest">
                <span>q1</span><span>q2</span><span>q3</span><span>q4</span>
              </div>
            </div>

            {/* Caption row */}
            <div className="mt-3 grid grid-cols-3 gap-2 text-[9px]">
              <div>
                <div className="text-neutral-400 uppercase tracking-widest">Peak</div>
                <div className="font-semibold mt-0.5">{Math.max(...slide.chart)}</div>
              </div>
              <div>
                <div className="text-neutral-400 uppercase tracking-widest">Mean</div>
                <div className="font-semibold mt-0.5">{Math.round(slide.chart.reduce((a, b) => a + b, 0) / slide.chart.length)}</div>
              </div>
              <div>
                <div className="text-neutral-400 uppercase tracking-widest">Δ</div>
                <div className="font-semibold mt-0.5">+{Math.max(0, slide.chart[slide.chart.length - 1] - slide.chart[0])}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom rule */}
        <div className="absolute bottom-6 left-8 right-8 flex items-center justify-between text-[9px] font-medium uppercase tracking-[0.35em] text-neutral-400">
          <span>{isEditorial ? "Editorial" : isMuted ? "Muted" : "Modern"}</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: total }).map((_, i) => (
              <span key={i} className={`h-px transition-all ${i === index ? "w-6 bg-black dark:bg-white" : "w-3 bg-black/20 dark:bg-white/20"}`} />
            ))}
          </div>
          <span className="font-mono">moonshot.app</span>
        </div>
      </motion.div>
    </div>
  );
}

function DustField() {
  // 14 slow-drifting motes — gives the stage atmospheric depth
  const motes = useMemo(
    () => Array.from({ length: 14 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      d: 8 + Math.random() * 14,
      s: 0.3 + Math.random() * 0.6,
      delay: Math.random() * 4,
    })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {motes.map((m, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, m.s, 0],
            y: [0, -40, -80],
            x: [0, 6, -4],
          }}
          transition={{
            duration: m.d,
            repeat: Infinity,
            delay: m.delay,
            ease: "easeInOut",
          }}
          className="absolute h-1 w-1 rounded-full bg-black/30 dark:bg-white/40 blur-[1px]"
          style={{ left: `${m.x}%`, top: `${m.y}%` }}
        />
      ))}
    </div>
  );
}

function AmbientBackdrop() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <motion.div
          animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10vh] -left-[10vw] h-[55vh] w-[55vh] rounded-full opacity-[0.35] dark:opacity-[0.45] blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(0,0,0,0.08), transparent 60%)" }}
        />
        <motion.div
          animate={{ x: [0, -30, 30, 0], y: [0, 20, -25, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[40vh] -right-[8vw] h-[60vh] w-[60vh] rounded-full opacity-[0.30] dark:opacity-[0.40] blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(0,0,0,0.06), transparent 60%)" }}
        />
      </div>
    </>
  );
}

function ComposeStage({ composeT, styleId }: { composeT: number; styleId: string }) {
  // Drive a "hero index" through 0→1→2 over the timeline so the deck visibly composes slide-by-slide.
  const hero = composeT < 38 ? 0 : composeT < 72 ? 1 : 2;

  return (
    <div className="mt-12 w-full relative">
      {/* Soft floor shadow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[20%] -bottom-2 h-8 rounded-[100%] opacity-25"
        style={{ background: "rgba(0,0,0,0.25)", filter: "blur(20px)" }}
      />
      <div className="relative h-[44vh] min-h-[320px] max-h-[480px] flex items-center justify-center">
        {[0, 1, 2].map((i) => {
          const offset = i - hero;
          const isHero = offset === 0;
          const x = offset * 42;
          return (
            <motion.div
              key={i}
              animate={{
                x: `${x}%`,
                opacity: Math.abs(offset) > 1 ? 0 : isHero ? 1 : 0.45,
                scale: isHero ? 1 : 0.82,
              }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="absolute w-[min(80%,720px)] aspect-[16/10]"
              style={{ zIndex: isHero ? 2 : 1 }}
            >
              <GhostSlide index={i} composeT={composeT} styleId={styleId} hero={isHero} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function GhostSlide({ index, composeT, styleId, hero = false }: { index: number; composeT: number; styleId: string; hero?: boolean }) {
  const start = 15 + index * 22;
  const local = Math.max(0, Math.min(100, ((composeT - start) / (100 - start)) * 100));
  const titleOn  = local > 12;
  const bodyOn   = local > 32;
  const metricOn = local > 55;
  const chartOn  = local > 22;
  const isEditorial = styleId === "editorial";
  const isMuted = styleId === "muted";

  const labels = ["Retention is the new ceiling.", "What changed in the market.", "Three moves we're making."];
  const bodies = [
    "Cover — the one-line argument the room walks away with.",
    "Why the math compounds the next round, written from the audience's seat.",
    "The plan, with the one number that proves it works.",
  ];
  const numeral = (index + 1).toString().padStart(2, "0");
  const chart = [42, 58, 71, 64, 80, 73, 90];
  const max = Math.max(...chart);
  const points = chart.map((v, i) => `${(i / (chart.length - 1)) * 100},${100 - (v / max) * 100}`);
  const areaPath = `M0,100 L${points.join(" L")} L100,100 Z`;
  const linePath = `M${points.join(" L")}`;

  return (
    <motion.div
      className={`relative h-full w-full rounded-2xl ring-1 ring-black/10 dark:ring-white/10 overflow-hidden ${
        hero ? "shadow-[0_50px_120px_-30px_rgba(0,0,0,0.45)]" : "shadow-[0_25px_60px_-20px_rgba(0,0,0,0.35)]"
      } ${isMuted ? "bg-[#E8E4DC] dark:bg-[#1a1815] text-[#1A1A1A] dark:text-[#E8E4DC]" : "glass"}`}
    >
      {/* Sweep shimmer (only on the hero) */}
      {hero && (
        <motion.div
          animate={{ x: ["-120%", "220%"] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/2 bg-gradient-to-r from-transparent via-black/[0.05] dark:via-white/[0.07] to-transparent"
        />
      )}

      {/* Atmospheric numeral */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-2 -top-8 select-none font-semibold leading-[0.8] tracking-[-0.08em] text-black/[0.05] dark:text-white/[0.07]"
        style={{ fontSize: "clamp(7rem, 18vw, 16rem)" }}
      >
        {numeral}
      </div>

      {/* Chrome */}
      <div className="absolute top-4 left-5 right-5 flex items-center justify-between text-[8px] font-medium uppercase tracking-[0.35em] text-neutral-500 dark:text-neutral-400">
        <span className="flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-black dark:bg-white" /> Moonshot
        </span>
        <span className="font-mono">{numeral} / 03</span>
      </div>

      <div className="absolute inset-0 grid grid-cols-[1.35fr_1fr] gap-4 px-5 pt-12 pb-8">
        {/* Left column */}
        <div className="flex flex-col">
          <div className="text-[8px] font-medium uppercase tracking-[0.35em] text-neutral-400">
            {index === 0 ? "Cover" : `Section ${numeral}`}
          </div>
          <div className="mt-2 min-h-[36px]">
            {titleOn ? (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className={`leading-[1] tracking-[-0.03em] ${
                  isEditorial ? "font-serif italic font-medium text-[clamp(0.95rem,2.4vw,1.6rem)]" : "font-semibold text-[clamp(0.9rem,2.2vw,1.5rem)]"
                }`}
              >
                {labels[index]}
              </motion.div>
            ) : (
              <>
                <div className="h-3 w-4/5 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                <div className="mt-1.5 h-3 w-3/5 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
              </>
            )}
          </div>

          <div className="mt-3 flex items-start gap-2">
            <span className="mt-1 h-px w-4 bg-black dark:bg-white shrink-0 opacity-60" />
            <div className="flex-1 min-h-[28px]">
              {bodyOn ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400 line-clamp-3">
                  {bodies[index]}
                </motion.div>
              ) : (
                <>
                  <div className="h-1 w-full rounded bg-black/[0.06] dark:bg-white/[0.06]" />
                  <div className="mt-1 h-1 w-5/6 rounded bg-black/[0.06] dark:bg-white/[0.06]" />
                </>
              )}
            </div>
          </div>

          <div className="mt-auto min-h-[28px]">
            {metricOn ? (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="text-[7px] uppercase tracking-[0.4em] text-neutral-400">NRR</div>
                <div className="text-[clamp(1.2rem,3vw,2.4rem)] font-semibold tracking-[-0.04em] leading-none">138%</div>
              </motion.div>
            ) : (
              <>
                <div className="h-1 w-6 rounded bg-black/10 dark:bg-white/10" />
                <div className="mt-1 h-3 w-12 rounded bg-black/10 dark:bg-white/10" />
              </>
            )}
          </div>
        </div>

        {/* Right column — chart panel */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between text-[7px] font-medium uppercase tracking-[0.3em] text-neutral-400">
            <span>Cohort</span><span className="font-mono">N=7</span>
          </div>
          <div className="mt-2 relative flex-1 rounded-md ring-1 ring-black/5 dark:ring-white/5 bg-black/[0.02] dark:bg-white/[0.03] p-2 overflow-hidden">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-2 h-[calc(100%-1rem)] w-[calc(100%-1rem)]">
              {[25, 50, 75].map((y) => (
                <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.4" strokeDasharray="1,1.5" />
              ))}
              <defs>
                <linearGradient id={`gh-area-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
              <motion.path
                d={areaPath}
                fill={`url(#gh-area-${index})`}
                className="text-black dark:text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: chartOn ? 1 : 0 }}
                transition={{ duration: 0.5 }}
              />
              <motion.path
                d={linePath}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-black dark:text-white"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: chartOn ? 1 : 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom rule */}
      <div className="absolute bottom-3 left-5 right-5 flex items-center justify-between text-[7px] font-medium uppercase tracking-[0.35em] text-neutral-400">
        <span>{isEditorial ? "Editorial" : isMuted ? "Muted" : "Modern"}</span>
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`h-px transition-all ${i === index ? "w-4 bg-black dark:bg-white" : "w-2 bg-black/20 dark:bg-white/20"}`} />
          ))}
        </div>
        <span className="font-mono">moonshot.app</span>
      </div>
    </motion.div>
  );
}

function EditReel({
  slides, active, setActive, updateSlide, styleId, styleName, prompt, authedUser, onAuthGate, onClose, onSavedDeck, onEditBrief,
}: {
  slides: Slide[];
  active: number;
  setActive: (i: number) => void;
  updateSlide: (i: number, p: Partial<Slide>) => void;
  styleId: string;
  styleName: string;
  prompt: string;
  authedUser?: { accessToken: string } | null;
  onAuthGate: (reason: string) => void;
  onClose: () => void;
  onSavedDeck?: () => void;
  onEditBrief: () => void;
}) {
  const reelRef = useRef<HTMLDivElement>(null);

  // Track which slide is most visible — drives the rail highlight.
  useEffect(() => {
    const root = reelRef.current;
    if (!root) return;
    const slideEls = root.querySelectorAll<HTMLElement>("[data-slide-card]");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio > 0.55) {
            setActive(Number((e.target as HTMLElement).dataset.slideCard));
          }
        });
      },
      { root, threshold: [0.55, 0.8] },
    );
    slideEls.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [slides.length, setActive]);

  const jump = (i: number) => {
    const root = reelRef.current;
    if (!root) return;
    const el = root.querySelector<HTMLElement>(`[data-slide-card="${i}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <motion.div
      key="edit"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-10"
    >
      {/* Outline rail with progress thread */}
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <div className="flex items-baseline justify-between mb-6">
            <div className="text-[10px] font-medium uppercase tracking-[0.4em] text-neutral-500">Outline</div>
            <div className="font-mono text-[10px] tracking-widest text-neutral-400 tabular-nums">
              <span className="text-black dark:text-white">{(active + 1).toString().padStart(2, "0")}</span>
              <span className="opacity-50"> / {slides.length.toString().padStart(2, "0")}</span>
            </div>
          </div>

          <div className="relative pl-5">
            <div className="absolute left-[7px] top-2 bottom-8 w-px bg-black/10 dark:bg-white/10" />
            <motion.div
              className="absolute left-[7px] top-2 w-px bg-black dark:bg-white origin-top"
              animate={{ scaleY: slides.length > 0 ? (active + 1) / (slides.length + 1) : 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 32 }}
              style={{ height: "calc(100% - 40px)" }}
            />

            <ol className="space-y-1.5">
              {slides.map((sl, i) => (
                <li key={i} className="relative">
                  <span
                    className={`absolute -left-[18px] top-[10px] h-1.5 w-1.5 rounded-full transition-all ${
                      active === i
                        ? "bg-black dark:bg-white scale-150 shadow-[0_0_0_3px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_3px_rgba(255,255,255,0.08)]"
                        : i < active
                        ? "bg-black/40 dark:bg-white/40"
                        : "bg-black/15 dark:bg-white/15"
                    }`}
                  />
                  <button
                    onClick={() => jump(i)}
                    className={`group flex w-full items-start gap-2.5 rounded-md px-2 py-1.5 text-left transition ${
                      active === i ? "bg-black/[0.04] dark:bg-white/[0.05]" : "hover:bg-black/[0.025] dark:hover:bg-white/[0.03]"
                    }`}
                  >
                    <span className={`mt-0.5 font-mono text-[10px] tracking-widest tabular-nums ${active === i ? "text-black dark:text-white" : "text-neutral-400"}`}>
                      {(i + 1).toString().padStart(2, "0")}
                    </span>
                    <span className={`text-[12px] leading-snug line-clamp-2 transition ${active === i ? "text-black dark:text-white font-medium" : "text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300"}`}>
                      {sl.title || "Untitled"}
                    </span>
                  </button>
                </li>
              ))}
              <li className="relative">
                <span className="absolute -left-[18px] top-[10px] h-1.5 w-1.5 rounded-full border border-black/20 dark:border-white/20" />
                <button
                  onClick={() => onAuthGate("Add more slides")}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] text-neutral-400 hover:text-black dark:hover:text-white transition"
                >
                  <Icon.Plus className="h-3 w-3" /> Add slide
                </button>
              </li>
            </ol>
          </div>

          <div className="mt-10 pt-6 border-t border-black/10 dark:border-white/10 space-y-3">
            <div className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-400">Brief</div>
            <p className="text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400 line-clamp-4">{prompt}</p>
            <button onClick={onEditBrief} className="text-[11px] font-medium text-neutral-500 hover:text-black dark:hover:text-white underline underline-offset-4 transition">
              Edit brief
            </button>
          </div>
        </div>
      </aside>

      {/* Reel */}
      <div>
        {/* Cinematic header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          transformTemplate={({ y }, generated) => (y === "0px" || y === 0 ? "none" : generated)}
          className="relative mb-6"
        >
          <div className="flex items-end justify-between gap-6 pb-5 border-b border-black/10 dark:border-white/10">
            <div className="min-w-0">
              <div className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.4em] text-neutral-500">
                <span className="font-mono tabular-nums text-black dark:text-white">{(active + 1).toString().padStart(2, "0")}</span>
                <span className="h-px w-6 bg-neutral-300 dark:bg-neutral-700" />
                <span>{styleName}</span>
                <span className="h-px w-6 bg-neutral-300 dark:bg-neutral-700" />
                <span>{slides.length} slides · {Math.max(1, Math.round(slides.reduce((acc, s) => acc + (s.title || "").split(/\s+/).length + (s.body || "").split(/\s+/).length, 0) / 140))} min</span>
              </div>
              <h2 className="mt-3 text-[clamp(1.5rem,2.6vw,2.25rem)] font-semibold tracking-[-0.03em] leading-[1.1] truncate">
                {slides[active]?.title || slides[0]?.title || "Untitled"}
              </h2>
            </div>
            <div className="shrink-0">
              <SaveDeckButton
                authedUser={authedUser}
                onAuthGate={() => onAuthGate("Save this deck to your workspace")}
                onSaved={() => { onSavedDeck?.(); onClose(); }}
                payload={{ title: slides[0]?.title || prompt.slice(0, 60) || "Untitled deck", brief: prompt, slides, tone: styleId }}
              />
            </div>
          </div>
        </motion.div>

        <div
          ref={reelRef}
          className="relative max-h-[78vh] overflow-y-auto snap-y snap-mandatory scroll-smooth rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-[#f5f3ef] dark:bg-[#07070a]"
          style={{ scrollPaddingTop: 32, scrollPaddingBottom: 32 }}
        >
          {/* Ceiling vignette */}
          <div
            aria-hidden
            className="pointer-events-none sticky top-0 h-12 -mb-12 z-[2]"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.10), transparent)" }}
          />

          <div className="relative space-y-16 px-6 lg:px-12 py-12">
            {/* Ambient blooms — matches landing */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              <div
                className="absolute -top-[10vh] -left-[10vw] h-[55vh] w-[55vh] rounded-full opacity-[0.30] dark:opacity-[0.40] blur-3xl"
                style={{ background: "radial-gradient(circle, rgba(0,0,0,0.07), transparent 60%)" }}
              />
              <div
                className="absolute top-[40vh] -right-[8vw] h-[60vh] w-[60vh] rounded-full opacity-[0.25] dark:opacity-[0.35] blur-3xl"
                style={{ background: "radial-gradient(circle, rgba(0,0,0,0.05), transparent 60%)" }}
              />
            </div>

            {slides.map((sl, i) => (
              <motion.div
                key={i}
                data-slide-card={i}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: Math.min(i * 0.06, 0.36) }}
                transformTemplate={({ y }, generated) => (y === "0px" || y === 0 ? "none" : generated)}
                className="relative snap-center"
              >
                {/* Atmospheric numeral — editorial cue */}
                <div
                  aria-hidden
                  className={`pointer-events-none absolute -top-8 -right-2 lg:-right-6 z-[1] select-none font-semibold leading-none tracking-[-0.07em] transition-opacity duration-500 ${
                    active === i ? "opacity-100" : "opacity-50"
                  }`}
                  style={{ fontSize: "clamp(6rem, 12vw, 11rem)" }}
                >
                  <span className="block text-neutral-900/[0.06] dark:text-white/[0.07]">
                    {(i + 1).toString().padStart(2, "0")}
                  </span>
                </div>

                <div className="relative z-[2]">
                  <SlideCanvas
                    slide={sl}
                    index={i}
                    total={slides.length}
                    onUpdate={(p) => updateSlide(i, p)}
                    styleId={styleId}
                  />
                </div>

                {/* Spine label — only on the active slide */}
                <div
                  aria-hidden
                  className={`mt-3 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.4em] text-neutral-500 transition-opacity duration-300 ${
                    active === i ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <span className="font-mono tabular-nums">{(i + 1).toString().padStart(2, "0")}</span>
                  <span className="h-px flex-1 bg-neutral-300 dark:bg-neutral-700 max-w-[100px]" />
                  <span>{i === 0 ? "Cover" : i === slides.length - 1 ? "Closing" : "Argument"}</span>
                </div>
              </motion.div>
            ))}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              onClick={() => onAuthGate("Add more slides")}
              className="relative block w-full aspect-[16/10] rounded-2xl border border-dashed border-black/15 dark:border-white/15 flex-col items-center justify-center gap-3 text-neutral-500 hover:text-black dark:hover:text-white hover:border-black/40 dark:hover:border-white/40 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition flex group"
              data-cursor-label="Sign up"
            >
              <div className="h-10 w-10 rounded-full border border-current flex items-center justify-center group-hover:rotate-90 transition-transform duration-500">
                <Icon.Plus className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-[0.4em]">Sign up to add slides</span>
              <span className="text-[10px] text-neutral-400 normal-case tracking-normal">Unlimited slides · live collaboration · export to PDF</span>
            </motion.button>
          </div>

          {/* Floor vignette */}
          <div
            aria-hidden
            className="pointer-events-none sticky bottom-0 h-12 -mt-12 z-[2]"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.10), transparent)" }}
          />
        </div>

        {/* Pager */}
        <div className="mt-5 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.4em] text-neutral-400">
          <button
            onClick={() => jump(Math.max(0, active - 1))}
            disabled={active === 0}
            className="inline-flex items-center gap-2 hover:text-black dark:hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 transition"
          >
            <Icon.Back className="h-3 w-3" /> Prev
          </button>
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => jump(i)}
                className={`h-1 rounded-full transition-all ${active === i ? "w-8 bg-black dark:bg-white" : "w-1.5 bg-black/20 dark:bg-white/20 hover:bg-black/40 dark:hover:bg-white/40"}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
          <button
            onClick={() => jump(Math.min(slides.length - 1, active + 1))}
            disabled={active === slides.length - 1}
            className="inline-flex items-center gap-2 hover:text-black dark:hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 transition"
          >
            Next <Icon.Arrow className="h-3 w-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function SaveDeckButton({
  authedUser,
  onAuthGate,
  onSaved,
  payload,
}: {
  authedUser?: { accessToken: string } | null;
  onAuthGate: () => void;
  onSaved: () => void;
  payload: { title: string; brief: string; slides: Slide[]; tone: string };
}) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!authedUser?.accessToken) {
    return (
      <button
        onClick={onAuthGate}
        className="inline-flex items-center gap-2 rounded-full bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-xs font-medium hover:opacity-90 transition"
        data-cursor-label="Sign up"
      >
        <Icon.Lock className="h-3 w-3" /> Save deck
      </button>
    );
  }

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-84204692/decks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${authedUser.accessToken}` },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Save failed");
      onSaved();
    } catch (e: any) {
      console.error("Deck save threw:", e);
      setErr(e?.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={save}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-full bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-xs font-medium hover:opacity-90 disabled:opacity-50 transition"
        data-cursor-label="Save"
      >
        {saving ? "Saving…" : <>Save deck <Icon.Arrow className="h-3 w-3" /></>}
      </button>
      {err && <div className="text-[10px] text-rose-500">{err}</div>}
    </div>
  );
}
