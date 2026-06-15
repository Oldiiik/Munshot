import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useStore } from "../../lib/store";
import { C, MONO, TXT, hair, stroke } from "../../lib/tokens";
import type { FlowStage } from "../../lib/types";

const STEPS: { id: FlowStage; label: string }[] = [
  { id: "brief",     label: "brief" },
  { id: "questions", label: "questions" },
  { id: "blueprint", label: "blueprint" },
  { id: "logic",     label: "logic" },
  { id: "style",     label: "style" },
  { id: "deck",      label: "deck" },
];

const ALIASES: Record<string, FlowStage> = {
  analyzing: "questions",
  narrative: "blueprint",
  planning: "logic",
  validating: "deck",
  generating: "deck",
  qa: "deck",
  repairing: "deck",
};

export function FlowShell({ children }: { children: ReactNode }) {
  const { state, reset } = useStore();
  const active = (ALIASES[state.stage] ?? state.stage) as FlowStage;
  const activeIdx = STEPS.findIndex((s) => s.id === active);

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: C.bg, color: C.ink, ...TXT, fontSize: 16 }}
    >
      <header
        className="sticky top-0 z-40 px-6 md:px-10 py-4 flex items-center justify-between"
        style={{ borderBottom: stroke, background: C.bg }}
      >
        <button onClick={reset} className="flex items-center gap-3" style={{ ...MONO }}>
          ← MUN SHOT
        </button>
        <div className="hidden md:flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className="px-3 py-1.5"
                style={{
                  background: i === activeIdx ? C.ink : i < activeIdx ? C.rose : "transparent",
                  color: i <= activeIdx ? C.cream : C.clay,
                  border: i === activeIdx ? "none" : hair,
                  borderRadius: 999,
                  ...MONO,
                  fontSize: 10,
                }}
              >
                {String(i + 1).padStart(2, "0")} {s.label.toUpperCase()}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 18, height: 1.5, background: i < activeIdx ? C.rose : C.border }} />
              )}
            </div>
          ))}
        </div>
        <span style={{ ...MONO, color: C.clay }}>V.01</span>
      </header>

      <motion.main
        key={state.stage}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="px-6 md:px-10 py-12 md:py-16"
      >
        {children}
      </motion.main>
    </div>
  );
}

export function StageHeader({ num, kicker, title, body }: { num: string; kicker: string; title: string; body?: string }) {
  return (
    <div className="grid md:grid-cols-12 gap-6 mb-12">
      <div className="md:col-span-4 flex items-start gap-3">
        <div style={{ ...MONO, color: C.clay }}>{num}</div>
        <div style={{ ...MONO, color: C.clay }}>— {kicker}</div>
      </div>
      <div className="md:col-span-8">
        <h2 style={{ fontWeight: 300, letterSpacing: "-0.04em", lineHeight: 0.95, fontSize: "clamp(36px, 5.5vw, 80px)" }}>
          {title}
        </h2>
        {body && <p className="mt-6 max-w-2xl" style={{ ...TXT, fontSize: 17, opacity: 0.7 }}>{body}</p>}
      </div>
    </div>
  );
}
