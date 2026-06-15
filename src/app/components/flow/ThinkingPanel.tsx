import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { useStore } from "../../lib/store";
import { C, MONO, TXT, hair } from "../../lib/tokens";
import type { ThoughtPhase } from "../../lib/types";

const LABEL: Record<ThoughtPhase, string> = {
  analyze: "GEMINI 3.1 · ANALYZING BRIEF",
  clarify: "GEMINI 3.1 · DRAFTING CLARIFICATIONS",
  plan: "GEMINI 3.1 · PLANNING SLIDE LOGIC",
  refine: "GEMINI 3.1 · REFINING SLIDE",
  rebuild: "GEMINI 3.1 · REBUILDING ARCHITECTURE",
  write: "GEMINI 3.1 · WRITING SLIDE COPY",
  render: "IMAGEN 4 · RENDERING SLIDE",
  style: "GEMINI 3.1 · CURATING STYLES",
};

export function ThinkingPanel({
  phases,
  active,
  title,
}: {
  phases: ThoughtPhase[];
  active?: boolean;
  title?: string;
}) {
  const { state } = useStore();
  const ref = useRef<HTMLDivElement>(null);
  const thoughts = state.thoughts.filter((t) => phases.includes(t.phase));

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [thoughts.length]);

  if (thoughts.length === 0 && !active) return null;
  const lastPhase = thoughts[thoughts.length - 1]?.phase ?? phases[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5"
      style={{ background: C.ink, color: C.cream, borderRadius: 14 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3" style={{ ...MONO, color: C.pink }}>
          {active && (
            <motion.span
              className="w-2 h-2 rounded-full"
              style={{ background: C.rose }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          )}
          {title ?? LABEL[lastPhase]}
        </div>
        <span style={{ ...MONO, color: "rgba(255,255,255,0.4)" }}>
          {thoughts.length} STEPS
        </span>
      </div>
      <div
        ref={ref}
        className="mt-4 space-y-1.5 overflow-y-auto"
        style={{ maxHeight: 220, paddingRight: 6, borderTop: `1px solid rgba(255,255,255,0.1)`, paddingTop: 12 }}
      >
        <AnimatePresence initial={false}>
          {thoughts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-start gap-3"
              style={{ ...TXT, fontSize: 13, color: "rgba(255,241,232,0.9)" }}
            >
              <span style={{ ...MONO, color: C.clay, minWidth: 50, opacity: 0.7 }}>
                {t.phase.toUpperCase()}
              </span>
              <span>{t.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {active && thoughts.length === 0 && (
          <div className="flex items-center gap-2" style={{ ...TXT, fontSize: 13, opacity: 0.6 }}>
            <span>thinking</span>
            <Dots />
          </div>
        )}
      </div>
      <div className="mt-3" style={{ ...MONO, color: "rgba(255,255,255,0.35)", borderTop: `1px solid rgba(255,255,255,0.08)`, paddingTop: 10 }}>
        ↳ live reasoning trace · token-stream view
      </div>
    </motion.div>
  );
}

function Dots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1 h-1 rounded-full inline-block"
          style={{ background: C.pink }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}

// re-export for convenience
export { hair };
