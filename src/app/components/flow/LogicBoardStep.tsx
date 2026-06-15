import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useStore } from "../../lib/store";
import { C, MONO, TXT, hair, stroke } from "../../lib/tokens";
import type { SlideLogic } from "../../lib/types";
import { StageHeader } from "./FlowShell";
import { ThinkingPanel } from "./ThinkingPanel";

export function LogicBoardStep() {
  const { state, selectSlide, removeSlide, refineSlide, rebuildArchitecture } = useStore();
  const { project, selectedSlideId } = state;
  const selected = project.slides.find((s) => s.id === selectedSlideId) ?? null;

  const [archFeedback, setArchFeedback] = useState("");
  const [archBusy, setArchBusy] = useState(false);

  const onRebuild = async () => {
    if (!archFeedback.trim()) return;
    setArchBusy(true);
    await rebuildArchitecture(archFeedback.trim());
    setArchFeedback("");
    setArchBusy(false);
  };

  return (
    <div>
      <StageHeader
        num="03"
        kicker="SLIDE LOGIC BOARD"
        title="approve the story before any pixel is drawn."
        body="click any card to see what the slide will contain. give natural-language feedback to refine a single slide — or rebuild the whole architecture if the strategy changes."
      />

      <div className="grid md:grid-cols-12 gap-6">
        <div className="md:col-span-5">
          <div className="flex items-center justify-between mb-3">
            <div style={{ ...MONO, color: C.clay }}>BOARD · {project.slides.length} SLIDES</div>
            <div style={{ ...MONO, color: C.clay }}>
              {project.analysis?.presentationType.toUpperCase()} DECK
            </div>
          </div>
          <div className="space-y-2">
            {project.slides.map((slide, i) => (
              <SlideRow
                key={slide.id}
                slide={slide}
                active={slide.id === selectedSlideId}
                index={i}
                onSelect={() => selectSlide(slide.id)}
                onRemove={() => removeSlide(slide.id)}
              />
            ))}
          </div>

          <div
            className="mt-8 p-5"
            style={{ background: C.ink, color: C.cream, borderRadius: 14 }}
          >
            <div style={{ ...MONO, color: C.pink }}>ARCHITECTURE REBUILD</div>
            <div className="mt-3" style={{ ...TXT, fontSize: 14, opacity: 0.85 }}>
              change the audience, goal, or strategy and mun shot will rebuild
              the whole deck — not just patch a slide.
            </div>
            <textarea
              value={archFeedback}
              onChange={(e) => setArchFeedback(e.target.value)}
              placeholder='e.g. "make this deck for schools, not investors."'
              rows={2}
              className="w-full mt-4 p-3 outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.07)", borderRadius: 8, color: C.cream, ...TXT, fontSize: 14 }}
            />
            <button
              onClick={onRebuild}
              disabled={!archFeedback.trim() || archBusy}
              className="mt-3 px-4 py-2"
              style={{
                background: archFeedback.trim() ? C.rose : "rgba(255,255,255,0.1)",
                color: C.cream,
                ...MONO,
                borderRadius: 999,
              }}
            >
              {archBusy ? "REBUILDING…" : "REBUILD ARCHITECTURE →"}
            </button>
          </div>
        </div>

        <div className="md:col-span-7">
          <AnimatePresence mode="wait">
            {selected ? (
              <SlideDetail
                key={selected.id}
                slide={selected}
                onClose={() => selectSlide(null)}
                onRefine={(fb) => refineSlide(selected.id, fb)}
              />
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex items-center justify-center p-12 text-center"
                style={{ background: C.cream, border: stroke, borderRadius: 14, minHeight: 400 }}
              >
                <div>
                  <div style={{ ...MONO, color: C.clay }}>SELECT A SLIDE TO INSPECT</div>
                  <div className="mt-3" style={{ ...TXT, fontSize: 18, opacity: 0.7, maxWidth: 360 }}>
                    every slide carries its purpose, message, visual idea, layout
                    and role in the story — before any of it is drawn.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {(state.busy || state.thoughts.some((t) => ["refine", "rebuild"].includes(t.phase))) && (
        <div className="mt-10">
          <ThinkingPanel phases={["refine", "rebuild"]} active={state.busy} />
        </div>
      )}

      <div className="mt-12 flex items-center justify-between">
        <span style={{ ...MONO, color: C.clay }}>WHEN THE STORY FEELS RIGHT →</span>
        <ApproveButton />
      </div>
    </div>
  );
}

function ApproveButton() {
  const { state, approveLogic } = useStore();
  const ready = state.project.slides.length > 0;
  return (
    <motion.button
      whileHover={{ scale: ready ? 1.02 : 1 }}
      whileTap={{ scale: 0.98 }}
      disabled={!ready}
      onClick={approveLogic}
      className="px-6 py-3"
      style={{
        background: ready ? C.ink : C.border,
        color: C.cream,
        ...MONO,
        borderRadius: 999,
        cursor: ready ? "pointer" : "not-allowed",
      }}
    >
      APPROVE STORY · CHOOSE STYLE →
    </motion.button>
  );
}

function SlideRow({
  slide,
  active,
  index,
  onSelect,
  onRemove,
}: {
  slide: SlideLogic;
  active: boolean;
  index: number;
  onSelect: () => void;
  onRemove: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.03, duration: 0.4 }}
      whileHover={{ x: 4 }}
      className="px-4 py-3 flex items-center justify-between cursor-pointer group"
      onClick={onSelect}
      style={{
        background: active ? C.ink : C.paper,
        color: active ? C.cream : C.ink,
        border: active ? "none" : hair,
        borderRadius: 10,
        ...TXT,
      }}
    >
      <div className="flex items-center gap-3 flex-1">
        <span style={{ ...MONO, opacity: active ? 0.8 : 0.5 }}>
          {String(slide.index).padStart(2, "0")}
        </span>
        <span style={{ fontSize: 15 }}>{slide.title}</span>
      </div>
      <div className="flex items-center gap-3">
        <span style={{ ...MONO, opacity: 0.5 }}>{active ? "●" : "○"}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="opacity-0 group-hover:opacity-100"
          style={{ ...MONO, fontSize: 10, color: active ? C.pink : C.clay }}
        >
          REMOVE
        </button>
      </div>
    </motion.div>
  );
}

function SlideDetail({
  slide,
  onClose,
  onRefine,
}: {
  slide: SlideLogic;
  onClose: () => void;
  onRefine: (feedback: string) => Promise<void>;
}) {
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  const fields: [string, string][] = [
    ["purpose", slide.purpose],
    ["main message", slide.mainMessage],
    ["suggested content", slide.suggestedContent],
    ["visual idea", slide.visualIdea],
    ["layout", slide.layoutDirection],
    ["tone", slide.tone],
    ["role in story", slide.roleInStory],
  ];

  const submit = async () => {
    if (!feedback.trim()) return;
    setBusy(true);
    await onRefine(feedback.trim());
    setFeedback("");
    setBusy(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="p-7"
      style={{ background: C.paper, border: stroke, borderRadius: 14 }}
    >
      <div className="flex items-end justify-between mb-6">
        <div>
          <div style={{ ...MONO, color: C.clay }}>
            SLIDE {String(slide.index).padStart(2, "0")} · EDITING
          </div>
          <div
            className="mt-2"
            style={{ fontWeight: 300, letterSpacing: "-0.04em", fontSize: 56, lineHeight: 0.9 }}
          >
            {slide.title}.
          </div>
        </div>
        <button onClick={onClose} style={{ ...MONO, color: C.clay }}>
          CLOSE ×
        </button>
      </div>

      <div className="grid md:grid-cols-2" style={{ borderTop: hair, borderLeft: hair }}>
        {fields.map(([k, v]) => (
          <div key={k} className="p-4" style={{ borderRight: hair, borderBottom: hair }}>
            <div style={{ ...MONO, color: C.clay }}>{k.toUpperCase()}</div>
            <div className="mt-2" style={{ ...TXT, fontSize: 14 }}>{v}</div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <div style={{ ...MONO, color: C.clay }}>REFINE THIS SLIDE</div>
        <div className="mt-2 flex gap-2">
          <input
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder='e.g. "focus more on personalization."'
            className="flex-1 px-4 py-3 outline-none"
            style={{ background: C.bg, border: hair, borderRadius: 8, ...TXT, fontSize: 15 }}
          />
          <button
            onClick={submit}
            disabled={!feedback.trim() || busy}
            className="px-5"
            style={{
              background: feedback.trim() ? C.rose : C.border,
              color: C.cream,
              ...MONO,
              borderRadius: 8,
            }}
          >
            {busy ? "REFINING…" : "REFINE →"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
