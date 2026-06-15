import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useStore } from "../../lib/store";
import { C, MONO, TXT, hair, stroke } from "../../lib/tokens";
import { StageHeader } from "./FlowShell";
import { ThinkingPanel } from "./ThinkingPanel";
import { ai } from "../../lib/ai";

export function DeckStep() {
  const { state, reset, dispatch } = useStore();
  const { project, renderProgress } = state;
  const [active, setActive] = useState(0);
  const [regenerating, setRegenerating] = useState(false);
  const generating = state.stage === "generating";

  useEffect(() => {
    // jump to the slide currently being rendered
    if (generating) setActive(Math.max(0, renderProgress.done - 1));
  }, [generating, renderProgress.done]);

  if (!project.style) return null;
  const total = project.slides.length;
  const slide = project.slides[active];
  const content = slide ? project.generatedContent[slide.id] : undefined;

  const handleRecreate = async () => {
    if (!slide || !project.style || !content || regenerating) return;
    setRegenerating(true);
    try {
      const imageUrl = await ai.generateSlideImage(slide, content, project.style, {
        onThought: (text, phase) => {
          dispatch({ type: "ADD_THOUGHT", thought: { text, phase, id: Date.now().toString() } });
        },
      });
      dispatch({ type: "SET_CONTENT", content: { ...content, slideId: slide.id, imageUrl } });
    } catch (err) {
      dispatch({ type: "ERROR", message: `Recreate failed: ${err}` });
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div>
      <StageHeader
        num="05"
        kicker="GENERATED DECK"
        title={generating ? "rendering each slide as an image…" : "your deck is ready."}
        body={
          generating
            ? "gemini 3.1 flash lite writes the slide. imagen 4 renders the entire slide as one image — typography, layout and visual baked into a single frame."
            : "every slide is a single imagen 4 render. swap style or rebuild architecture any time."
        }
      />

      {generating && (
        <div className="mb-8 grid md:grid-cols-12 gap-6">
          <div className="md:col-span-7">
            <RenderProgress total={total} done={renderProgress.done} />
          </div>
          <div className="md:col-span-5">
            <ThinkingPanel phases={["write", "render"]} active />
          </div>
        </div>
      )}

      {slide && (
        <SlideStage
          imageUrl={content?.imageUrl}
          headline={content?.headline ?? slide.title}
          slideTitle={slide.title}
          index={slide.index}
          total={total}
          styleName={project.style.name}
          bg={project.style.bg}
          fg={project.style.fg}
          onRecreate={handleRecreate}
          regenerating={regenerating}
          showRecreate={!generating && content !== undefined}
        />
      )}

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setActive((i) => Math.max(0, i - 1))}
          disabled={active === 0}
          className="px-5 py-2.5"
          style={{ background: C.cream, border: hair, ...MONO, borderRadius: 999, opacity: active === 0 ? 0.4 : 1 }}
        >
          ← PREV
        </button>
        <div style={{ ...MONO, color: C.clay }}>
          SLIDE {String(active + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          {slide ? ` · ${slide.title.toUpperCase()}` : ""}
        </div>
        <button
          onClick={() => setActive((i) => Math.min(total - 1, i + 1))}
          disabled={active === total - 1}
          className="px-5 py-2.5"
          style={{ background: C.ink, color: C.cream, ...MONO, borderRadius: 999, opacity: active === total - 1 ? 0.4 : 1 }}
        >
          NEXT →
        </button>
      </div>

      <div className="mt-12">
        <div style={{ ...MONO, color: C.clay, marginBottom: 12 }}>FILMSTRIP · ALL SLIDES</div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {project.slides.map((s, i) => {
            const c = project.generatedContent[s.id];
            return (
              <button
                key={s.id}
                onClick={() => setActive(i)}
                className="shrink-0 overflow-hidden relative"
                style={{
                  width: 200,
                  aspectRatio: "16 / 10",
                  background: project.style!.bg,
                  border: i === active ? `2.5px solid ${C.ink}` : hair,
                  borderRadius: 8,
                }}
              >
                {c?.imageUrl ? (
                  <img src={c.imageUrl} alt={s.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ ...MONO, color: project.style!.fg, opacity: 0.5 }}>
                    PENDING
                  </div>
                )}
                <div
                  className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-1.5"
                  style={{ background: "rgba(23,17,18,0.72)", color: C.cream, ...MONO, fontSize: 9 }}
                >
                  <span>{String(s.index).padStart(2, "0")}</span>
                  <span>{s.title.toUpperCase()}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-12 flex items-center justify-between">
        <button onClick={reset} style={{ ...MONO, color: C.clay }}>
          ← START OVER
        </button>
        <div className="flex gap-3">
          <button className="px-5 py-2.5" style={{ background: C.cream, border: hair, ...MONO, borderRadius: 999 }}>
            EXPORT PDF
          </button>
          <button className="px-5 py-2.5" style={{ background: C.ink, color: C.cream, ...MONO, borderRadius: 999 }}>
            DOWNLOAD ALL IMAGES →
          </button>
        </div>
      </div>
    </div>
  );
}

function RenderProgress({ total, done }: { total: number; done: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="p-6" style={{ background: C.ink, color: C.cream, borderRadius: 14, height: "100%" }}>
      <div className="flex items-center justify-between" style={{ ...MONO, color: C.pink }}>
        <span>RENDERING DECK</span>
        <span>{done} / {total} · {pct}%</span>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.12)" }}>
        <motion.div
          className="h-full"
          style={{ background: C.rose }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
      <div className="mt-3" style={{ ...TXT, fontSize: 13, opacity: 0.75 }}>
        each slide is composed end-to-end by imagen 4 from the approved logic and the {`${total}`}-step narrative — no template, no editable layer.
      </div>
    </div>
  );
}

function SlideStage({
  imageUrl,
  headline,
  slideTitle,
  index,
  total,
  styleName,
  bg,
  fg,
  onRecreate,
  regenerating,
  showRecreate,
}: {
  imageUrl?: string;
  headline: string;
  slideTitle: string;
  index: number;
  total: number;
  styleName: string;
  bg: string;
  fg: string;
  onRecreate?: () => void;
  regenerating?: boolean;
  showRecreate?: boolean;
}) {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ aspectRatio: "16 / 10", background: bg, color: fg, border: stroke, borderRadius: 18 }}
    >
      <AnimatePresence mode="wait">
        {imageUrl ? (
          <motion.img
            key={imageUrl}
            src={imageUrl}
            alt={headline}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <motion.div
            key="pending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4"
          >
            <ScanLines />
            <div style={{ ...MONO, color: fg, opacity: 0.7 }}>IMAGEN 4 · COMPOSING…</div>
            <div style={{ ...TXT, fontSize: 14, opacity: 0.5, maxWidth: 360, textAlign: "center" }}>
              {headline}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-4 left-4 flex items-center gap-3" style={{ ...MONO, fontSize: 10, color: C.cream, background: "rgba(23,17,18,0.55)", padding: "6px 10px", borderRadius: 999 }}>
        <span>SLIDE {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
        <span style={{ opacity: 0.6 }}>·</span>
        <span>{styleName.toUpperCase()}</span>
      </div>
      <div className="absolute bottom-4 right-4" style={{ ...MONO, fontSize: 10, color: C.cream, background: "rgba(23,17,18,0.55)", padding: "6px 10px", borderRadius: 999 }}>
        {slideTitle.toUpperCase()}
      </div>
      {showRecreate && (
        <motion.button
          onClick={onRecreate}
          disabled={regenerating}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="absolute bottom-4 left-4 px-4 py-2"
          style={{
            ...MONO,
            fontSize: 10,
            background: regenerating ? "rgba(185,133,143,0.85)" : C.rose,
            color: C.cream,
            border: `1.5px solid ${C.ink}`,
            borderRadius: 999,
            opacity: regenerating ? 0.7 : 1,
          }}
        >
          {regenerating ? "RECREATING…" : "↻ RECREATE"}
        </motion.button>
      )}
    </div>
  );
}

function ScanLines() {
  return (
    <motion.div
      className="absolute inset-0"
      style={{
        backgroundImage:
          "repeating-linear-gradient(180deg, rgba(0,0,0,0.04) 0 2px, transparent 2px 6px)",
      }}
      animate={{ opacity: [0.5, 0.9, 0.5] }}
      transition={{ duration: 1.6, repeat: Infinity }}
    />
  );
}
