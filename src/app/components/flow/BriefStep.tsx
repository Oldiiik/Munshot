import { motion } from "motion/react";
import { useState } from "react";
import { useStore } from "../../lib/store";
import { C, MONO, TXT, hair, stroke } from "../../lib/tokens";
import { StageHeader } from "./FlowShell";
import { ThinkingPanel } from "./ThinkingPanel";

const PRESETS = [
  "an adaptive learning platform for k-12 schools that personalizes lessons.",
  "a seed-stage startup raising $2m for an ai-powered legal research tool.",
  "a product launch for a pocket-sized espresso maker for travelers.",
];

export function BriefStep() {
  const { state, submitBrief } = useStore();
  const [text, setText] = useState(state.project.brief);
  const [referenceImage, setReferenceImage] = useState<string | null>(state.project.referenceImage ?? null);
  const isAnalyzing = state.stage === "analyzing";

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setReferenceImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <StageHeader
        num="01"
        kicker="THE BRIEF"
        title="tell mun shot what this is about."
        body="a paragraph is enough. include the project, the audience you want to reach, and what you want to happen after the deck is shown."
      />

      <div className="grid md:grid-cols-12 gap-6">
        <div className="md:col-span-8">
          <div style={{ background: C.paper, border: stroke, borderRadius: 14, padding: 4 }}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isAnalyzing}
              rows={9}
              placeholder="paste a description, a few sentences, or even a messy outline…"
              className="w-full p-5 outline-none resize-none"
              style={{ background: "transparent", ...TXT, fontSize: 17, color: C.ink, borderRadius: 10 }}
            />
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: hair }}>
              <span style={{ ...MONO, color: C.clay }}>
                {text.length} CHARS · GEMINI 3.1 FLASH LITE WILL ANALYZE
              </span>
              <motion.button
                whileHover={{ scale: text.trim().length > 12 && !isAnalyzing ? 1.02 : 1 }}
                whileTap={{ scale: 0.98 }}
                disabled={text.trim().length < 12 || isAnalyzing}
                onClick={() => submitBrief(text.trim(), referenceImage)}
                className="px-5 py-2.5"
                style={{
                  background: text.trim().length > 12 && !isAnalyzing ? C.ink : C.border,
                  color: C.cream,
                  ...MONO,
                  borderRadius: 999,
                  cursor: text.trim().length > 12 && !isAnalyzing ? "pointer" : "not-allowed",
                }}
              >
                {isAnalyzing ? "ANALYZING…" : "ANALYZE BRIEF →"}
              </motion.button>
            </div>
          </div>

          <div className="mt-6 p-5" style={{ background: C.cream, border: hair, borderRadius: 14 }}>
            <div style={{ ...MONO, color: C.clay, marginBottom: 12 }}>REFERENCE IMAGE (OPTIONAL)</div>
            <div style={{ ...TXT, fontSize: 14, opacity: 0.7, marginBottom: 16 }}>
              upload a reference for visual style. gemini will analyze colors, typography, and mood.
            </div>
            {referenceImage ? (
              <div className="relative">
                <img
                  src={referenceImage}
                  alt="Reference"
                  className="w-full rounded-lg"
                  style={{ maxHeight: 240, objectFit: "cover", border: hair }}
                />
                <button
                  onClick={() => setReferenceImage(null)}
                  className="absolute top-2 right-2 px-3 py-1.5"
                  style={{ background: C.rose, color: C.cream, ...MONO, fontSize: 10, borderRadius: 999 }}
                >
                  × REMOVE
                </button>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isAnalyzing}
                  className="hidden"
                />
                <div
                  className="p-8 text-center"
                  style={{ background: C.paper, border: `2px dashed ${C.border}`, borderRadius: 10 }}
                >
                  <div style={{ ...MONO, color: C.clay }}>↑ CLICK TO UPLOAD</div>
                  <div className="mt-2" style={{ ...TXT, fontSize: 13, opacity: 0.6 }}>
                    jpg, png, webp
                  </div>
                </div>
              </label>
            )}
          </div>

          {(isAnalyzing || state.thoughts.some((t) => t.phase === "analyze")) && (
            <div className="mt-6">
              <ThinkingPanel phases={["analyze", "clarify"]} active={isAnalyzing} />
            </div>
          )}
        </div>

        <div className="md:col-span-4">
          <div style={{ ...MONO, color: C.clay, marginBottom: 12 }}>OR TRY ONE</div>
          <div className="space-y-2">
            {PRESETS.map((p) => (
              <motion.button
                key={p}
                whileHover={{ x: 4 }}
                onClick={() => setText(p)}
                disabled={isAnalyzing}
                className="w-full text-left p-4"
                style={{ background: C.cream, border: hair, borderRadius: 10, ...TXT, fontSize: 14 }}
              >
                {p}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
