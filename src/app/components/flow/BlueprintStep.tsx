import { motion } from "motion/react";
import { useStore } from "../../lib/store";
import { C, MONO, TXT, hair, stroke } from "../../lib/tokens";
import type { Blueprint, DeckType, ReferenceMode } from "../../lib/types";
import { StageHeader } from "./FlowShell";
import { ThinkingPanel } from "./ThinkingPanel";

const DECK_TYPES: DeckType[] = [
  "pitch",
  "sales",
  "educational",
  "report",
  "product",
  "portfolio",
  "proposal",
  "strategy",
  "internal_update",
];

const STRICTNESS: ReferenceMode[] = ["none", "loose", "balanced", "strict"];

function FieldLabel({ children }: { children: string }) {
  return (
    <div style={{ ...MONO, color: C.clay }}>{children}</div>
  );
}

function TextField({
  value,
  onChange,
  placeholder,
  multiline,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const Cmp = multiline ? "textarea" : "input";
  return (
    <Cmp
      value={value}
      onChange={(e: any) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={multiline ? 2 : undefined}
      className="w-full mt-2 p-3 outline-none resize-none"
      style={{ background: C.bg, border: hair, borderRadius: 8, ...TXT, fontSize: 15 }}
    />
  );
}

function ListField({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  return (
    <div className="mt-2 space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={it}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
            className="flex-1 p-3 outline-none"
            style={{ background: C.bg, border: hair, borderRadius: 8, ...TXT, fontSize: 14 }}
          />
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="px-3 py-2"
            style={{ ...MONO, color: C.clay, border: hair, borderRadius: 8 }}
          >
            ×
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, ""])}
        className="px-3 py-2"
        style={{ ...MONO, color: C.rose, border: hair, borderRadius: 999 }}
      >
        + ADD {placeholder.toUpperCase()}
      </button>
    </div>
  );
}

function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className="px-3 py-1.5"
            style={{
              background: active ? C.ink : "transparent",
              color: active ? C.cream : C.ink,
              border: active ? "none" : hair,
              borderRadius: 999,
              ...MONO,
              fontSize: 10,
            }}
          >
            {opt.replace("_", " ").toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

export function BlueprintStep() {
  const { state, patchBlueprint, confirmBlueprint } = useStore();
  const { project, stage } = state;
  const bp = project.blueprint;
  const launching = stage === "narrative" || stage === "planning";

  if (!bp) {
    return (
      <div>
        <StageHeader num="03" kicker="BLUEPRINT" title="deriving the blueprint…" />
        <ThinkingPanel phases={["plan"]} active />
      </div>
    );
  }

  const set = <K extends keyof Blueprint>(k: K, v: Blueprint[K]) => patchBlueprint({ [k]: v } as Partial<Blueprint>);

  return (
    <div>
      <StageHeader
        num="03"
        kicker="BLUEPRINT"
        title="confirm the launch checklist."
        body="edit anything that's off. mun shot won't generate slides until this looks right — fixing intent here is 100× cheaper than fixing slides later."
      />

      <div className="grid md:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5"
          style={{ background: C.paper, border: stroke, borderRadius: 14 }}
        >
          <FieldLabel>PRESENTATION TYPE</FieldLabel>
          <Chips options={DECK_TYPES} value={bp.presentationType} onChange={(v) => set("presentationType", v)} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="p-5"
          style={{ background: C.paper, border: stroke, borderRadius: 14 }}
        >
          <FieldLabel>SLIDE COUNT</FieldLabel>
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={() => set("slideCount", Math.max(4, bp.slideCount - 1))}
              className="w-10 h-10"
              style={{ border: hair, borderRadius: 999, ...MONO }}
            >
              −
            </button>
            <div style={{ ...TXT, fontSize: 28, fontWeight: 300, minWidth: 48, textAlign: "center" }}>
              {bp.slideCount}
            </div>
            <button
              onClick={() => set("slideCount", Math.min(20, bp.slideCount + 1))}
              className="w-10 h-10"
              style={{ border: hair, borderRadius: 999, ...MONO }}
            >
              +
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="p-5 md:col-span-2"
          style={{ background: C.paper, border: stroke, borderRadius: 14 }}
        >
          <FieldLabel>AUDIENCE</FieldLabel>
          <TextField value={bp.audience} onChange={(v) => set("audience", v)} placeholder="who is this for?" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="p-5"
          style={{ background: C.paper, border: stroke, borderRadius: 14 }}
        >
          <FieldLabel>GOAL</FieldLabel>
          <TextField value={bp.goal} onChange={(v) => set("goal", v)} multiline />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="p-5"
          style={{ background: C.paper, border: stroke, borderRadius: 14 }}
        >
          <FieldLabel>TONE</FieldLabel>
          <TextField value={bp.tone} onChange={(v) => set("tone", v)} placeholder="e.g. sharp, calm, confident" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 md:col-span-2"
          style={{ background: C.paper, border: stroke, borderRadius: 14 }}
        >
          <FieldLabel>NARRATIVE ARC</FieldLabel>
          <TextField value={bp.narrativeArcSummary} onChange={(v) => set("narrativeArcSummary", v)} multiline />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="p-5"
          style={{ background: C.paper, border: stroke, borderRadius: 14 }}
        >
          <FieldLabel>STYLE DIRECTION</FieldLabel>
          <TextField value={bp.styleDirection} onChange={(v) => set("styleDirection", v)} />
          <div className="mt-4">
            <FieldLabel>REFERENCE STRICTNESS</FieldLabel>
            <Chips options={STRICTNESS} value={bp.referenceStrictness} onChange={(v) => set("referenceStrictness", v)} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="p-5"
          style={{ background: C.paper, border: stroke, borderRadius: 14 }}
        >
          <FieldLabel>KEY CLAIMS</FieldLabel>
          <ListField items={bp.keyClaims} onChange={(v) => set("keyClaims", v)} placeholder="claim" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="p-5"
          style={{ background: C.paper, border: stroke, borderRadius: 14 }}
        >
          <FieldLabel>MUST INCLUDE</FieldLabel>
          <ListField items={bp.mustInclude} onChange={(v) => set("mustInclude", v)} placeholder="item" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36 }}
          className="p-5"
          style={{ background: C.paper, border: stroke, borderRadius: 14 }}
        >
          <FieldLabel>MUST AVOID</FieldLabel>
          <ListField items={bp.mustAvoid} onChange={(v) => set("mustAvoid", v)} placeholder="item" />
        </motion.div>
      </div>

      {launching && (
        <div className="mt-8">
          <ThinkingPanel phases={["plan"]} active />
        </div>
      )}

      <div className="mt-10 flex items-center justify-between">
        <span style={{ ...MONO, color: C.clay }}>
          {launching
            ? stage === "narrative"
              ? "BUILDING NARRATIVE…"
              : "MAPPING SLIDES…"
            : "SCAN · EDIT · LAUNCH"}
        </span>
        <motion.button
          whileHover={{ scale: launching ? 1 : 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={launching}
          onClick={confirmBlueprint}
          className="px-6 py-3"
          style={{
            background: launching ? C.border : C.ink,
            color: C.cream,
            ...MONO,
            borderRadius: 999,
            cursor: launching ? "not-allowed" : "pointer",
          }}
        >
          {launching ? "LAUNCHING…" : "LAUNCH NARRATIVE →"}
        </motion.button>
      </div>
    </div>
  );
}
