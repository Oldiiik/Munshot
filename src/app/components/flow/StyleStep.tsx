import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { useStore } from "../../lib/store";
import { C, MONO, TXT, hair, stroke } from "../../lib/tokens";
import type { StyleVariant } from "../../lib/types";
import { StageHeader } from "./FlowShell";
import { ThinkingPanel } from "./ThinkingPanel";

export function StyleStep() {
  const { pickStyle, designCustomStyle, state } = useStore();
  const [picked, setPicked] = useState<StyleVariant | null>(null);
  const [customDesc, setCustomDesc] = useState("");
  const generating = state.stage === "generating";
  const { recommendedStyles, stylesLoading, customStyleLoading } = state;

  const submitCustom = async () => {
    const desc = customDesc.trim();
    if (!desc || customStyleLoading) return;
    await designCustomStyle(desc);
    setCustomDesc("");
  };

  return (
    <div>
      <StageHeader
        num="04"
        kicker="STYLE VARIANT"
        title="three styles, hand-picked for this deck."
        body="gemini reads your audience and tone and proposes three palettes. don't like them? write your own — gemini will design it."
      />

      {(stylesLoading || (recommendedStyles.length === 0 && !generating)) && (
        <div className="mb-8">
          <ThinkingPanel phases={["style"]} active />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AnimatePresence>
          {recommendedStyles.map((s, i) => {
            const active = picked?.id === s.id;
            return (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                whileHover={{ y: -8, rotate: i % 2 ? 1.2 : -1.2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setPicked(s)}
                className="aspect-[3/4] p-5 flex flex-col justify-between text-left relative"
                style={{
                  background: s.bg,
                  color: s.fg,
                  border: active ? `3px solid ${C.ink}` : stroke,
                  borderRadius: 14,
                  cursor: "pointer",
                }}
              >
                <div className="flex items-center justify-between">
                  <span style={{ ...MONO, opacity: 0.7 }}>
                    {s.origin === "custom" ? "CUSTOM / YOURS" : `0${i + 1} / RECOMMENDED`}
                  </span>
                  {active && <span style={{ ...MONO, color: s.fg }}>● PICKED</span>}
                </div>
                <div>
                  <div style={{ height: 2, background: s.fg, opacity: 0.85, width: "65%" }} />
                  <div style={{ height: 2, background: s.fg, opacity: 0.4, width: "40%", marginTop: 8 }} />
                  <div className="mt-6" style={{ fontWeight: 300, letterSpacing: "-0.04em", fontSize: 26, lineHeight: 1 }}>
                    {s.name}.
                  </div>
                  <div className="mt-2" style={{ ...TXT, fontSize: 12, opacity: 0.78 }}>
                    {s.description}
                  </div>
                  {s.reason && (
                    <div
                      className="mt-3 pt-3"
                      style={{ ...TXT, fontSize: 11, opacity: 0.65, borderTop: `1px solid ${s.fg}22` }}
                    >
                      ↳ {s.reason}
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
        {stylesLoading && recommendedStyles.length === 0 &&
          [0, 1, 2].map((i) => (
            <div
              key={i}
              className="aspect-[3/4]"
              style={{ background: C.cream, border: hair, borderRadius: 14, opacity: 0.5 }}
            />
          ))}
      </div>

      <div
        className="mt-8 p-5"
        style={{ background: C.paper, border: hair, borderRadius: 14 }}
      >
        <div style={{ ...MONO, color: C.clay }}>OR · DESIGN YOUR OWN</div>
        <div className="mt-1" style={{ ...TXT, fontSize: 14, color: C.ink, opacity: 0.7 }}>
          describe a mood, a reference, a memory — gemini will translate it into a palette.
        </div>
        <div className="mt-4 flex gap-3">
          <input
            value={customDesc}
            onChange={(e) => setCustomDesc(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitCustom()}
            placeholder="e.g. a quiet japanese teahouse at dusk, off-white and charcoal"
            className="flex-1 px-4 py-3 outline-none"
            style={{ background: C.bg, border: hair, borderRadius: 999, ...TXT, fontSize: 14 }}
            disabled={customStyleLoading}
          />
          <motion.button
            whileHover={{ scale: customDesc.trim() && !customStyleLoading ? 1.02 : 1 }}
            whileTap={{ scale: 0.98 }}
            onClick={submitCustom}
            disabled={!customDesc.trim() || customStyleLoading}
            className="px-5 py-3"
            style={{
              background: customDesc.trim() && !customStyleLoading ? C.ink : C.border,
              color: C.cream,
              ...MONO,
              borderRadius: 999,
              cursor: customDesc.trim() && !customStyleLoading ? "pointer" : "not-allowed",
            }}
          >
            {customStyleLoading ? "DESIGNING…" : "DESIGN MY STYLE →"}
          </motion.button>
        </div>
      </div>

      {generating && (
        <div className="mt-10">
          <ThinkingPanel phases={["write", "render"]} active />
        </div>
      )}

      <div
        className="mt-12 p-5 flex items-center justify-between"
        style={{ background: C.cream, border: hair, borderRadius: 14 }}
      >
        <div>
          <div style={{ ...MONO, color: C.clay }}>NEXT</div>
          <div className="mt-1" style={{ ...TXT, fontSize: 17 }}>
            {picked
              ? `mun shot will write copy with gemini 3.1 flash lite and render visuals with imagen 4 in the ${picked.name} style.`
              : "pick a recommended style or design your own to begin generation."}
          </div>
        </div>
        <motion.button
          whileHover={{ scale: picked && !generating ? 1.02 : 1 }}
          whileTap={{ scale: 0.98 }}
          disabled={!picked || generating}
          onClick={() => picked && pickStyle(picked)}
          className="px-6 py-3"
          style={{
            background: picked && !generating ? C.ink : C.border,
            color: C.cream,
            ...MONO,
            borderRadius: 999,
            cursor: picked && !generating ? "pointer" : "not-allowed",
          }}
        >
          {generating ? "GENERATING…" : "GENERATE DECK →"}
        </motion.button>
      </div>
    </div>
  );
}
