import { useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Check,
  CircleNotch,
  CopySimple,
  FileArrowUp,
  FloppyDisk,
  LinkSimple,
  MagicWand,
  Plus,
  ShareNetwork,
  SlidersHorizontal,
  Sparkle,
  Trash,
  X,
} from "@phosphor-icons/react";

import type { Vibe } from "@/types";
import { generateVibe, type VibeStore } from "@/lib/vibes";

type Density = "quiet" | "balanced" | "charged";
type InspectorTab = "identity" | "references" | "output";

const PALETTES = [
  ["#11131d", "#788cff", "#edf0ff"],
  ["#f5f6fa", "#1f2430", "#ef5b54"],
  ["#111513", "#80caa2", "#eef8f1"],
  ["#151318", "#d6a56f", "#f7eee4"],
];

const QUICK_STARTS = [
  { name: "Product clarity", note: "Precise product storytelling with calm hierarchy and open compositions.", swatch: ["#121722", "#6f8fe8", "#f0f5ff"] },
  { name: "Cultural signal", note: "Bold crops, human texture, and a confident editorial rhythm.", swatch: ["#171418", "#e55f62", "#f5eceb"] },
  { name: "System logic", note: "Dark technical fields, measured diagrams, and electric blue signal.", swatch: ["#10131a", "#788cff", "#eef1ff"] },
];

const emptyDraft = () => ({
  name: "Untitled direction",
  description: "A clear visual language with one strong point of view.",
  styleGuide: "Describe the light, typography, image treatment, visual rhythm, and what this direction should avoid.",
  swatch: PALETTES[0],
  density: "balanced" as Density,
});

const ease = [0.23, 1, 0.32, 1] as const;

function readableInk(hex: string) {
  const value = hex.replace("#", "");
  if (value.length !== 6) return "#f7f8ff";
  const [r, g, b] = [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 155 ? "#171a22" : "#f7f8ff";
}

export function VibesView({ vibes, onCompose }: { vibes: VibeStore; onCompose: (vibe: Vibe) => void }) {
  const [selectedId, setSelectedId] = useState<string | "new">("new");
  const [draft, setDraft] = useState(emptyDraft);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("identity");
  const [status, setStatus] = useState("");
  const [referenceNote, setReferenceNote] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [generating, setGenerating] = useState(false);
  const referenceInput = useRef<HTMLInputElement>(null);
  const reduceMotion = useReducedMotion();
  const selected = vibes.custom.find((vibe) => vibe.id === selectedId) ?? null;

  const chooseNew = () => {
    setSelectedId("new");
    setDraft(emptyDraft());
    setInspectorTab("identity");
    setStatus("");
  };

  const chooseVibe = (vibe: Vibe) => {
    setSelectedId(vibe.id);
    setDraft({
      name: vibe.name,
      description: vibe.description,
      styleGuide: vibe.styleGuide,
      swatch: vibe.swatch?.length ? vibe.swatch : PALETTES[0],
      density: "balanced",
    });
    setInspectorTab("identity");
    setStatus("");
  };

  const updateColor = (index: number, color: string) => {
    setDraft((current) => ({
      ...current,
      swatch: current.swatch.map((value, item) => item === index ? color : value),
    }));
  };

  const applyQuickStart = (start: typeof QUICK_STARTS[number]) => {
    setSelectedId("new");
    setReferenceNote(start.note);
    setDraft({
      name: start.name,
      description: start.note,
      styleGuide: `Use ${start.name.toLowerCase()} as the visual direction. Build each slide around one focal subject, a visible grid, and quiet supporting detail. Keep the image treatment and typographic rhythm consistent across the deck.`,
      swatch: start.swatch,
      density: "balanced",
    });
    setStatus("Starting direction applied.");
  };

  const generateFromReferences = async () => {
    if (generating || (!referenceNote.trim() && !referenceUrl.trim() && !referenceFiles.length)) return;
    setGenerating(true);
    setStatus("");
    try {
      const result = await generateVibe({
        deckId: "vibe-studio",
        description: referenceNote,
        url: referenceUrl.trim() || undefined,
        files: referenceFiles,
      });
      setSelectedId("new");
      setDraft({ ...result, swatch: result.swatch?.length ? result.swatch : PALETTES[0], density: "balanced" });
      setInspectorTab("identity");
      setStatus("Direction drafted from your references.");
    } catch {
      setStatus("Those references could not be read. Try a smaller file or add a note.");
    } finally {
      setGenerating(false);
    }
  };

  const persist = () => {
    const input = {
      name: draft.name.trim() || "Untitled direction",
      description: draft.description.trim(),
      styleGuide: draft.styleGuide.trim(),
      swatch: draft.swatch,
    };
    const result = selected ? vibes.updateVibe(selected.id, input) : vibes.createVibe(input);
    if (result) {
      setSelectedId(result.id);
      setStatus("Direction saved.");
    }
    return result;
  };

  const publish = () => {
    if (!selected) return;
    vibes.setVibePublished(selected.id, !selected.published);
    setStatus(selected.published ? "Removed from Community." : "Published to Community.");
  };

  const remove = () => {
    if (!selected) return;
    vibes.deleteVibe(selected.id);
    chooseNew();
  };

  const compose = () => {
    const result = persist();
    if (result) onCompose(result);
  };

  const previewStyle = {
    "--brand-field": draft.swatch[0],
    "--brand-signal": draft.swatch[1],
    "--brand-paper": draft.swatch[2],
    "--brand-text": readableInk(draft.swatch[0]),
  } as CSSProperties;

  const panelMotion = reduceMotion
    ? { initial: false as const, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      };

  return (
    <main className="ms-brand-v6">
      <div className="ms-brand-v6-shell">
        <header className="ms-brand-v6-header">
          <div><h1>Brand studio</h1><p>Shape a visual direction and test it on a live presentation.</p></div>
          <div><small>{vibes.custom.length} personal directions</small><button type="button" onClick={chooseNew}><Plus weight="bold" /> New direction</button></div>
        </header>

        <div className="ms-brand-v6-workspace">
          <aside className="ms-brand-v6-library">
            <header><span>Directions</span><button type="button" onClick={chooseNew} aria-label="New direction"><Plus /></button></header>
            <button type="button" className={selectedId === "new" ? "ms-brand-v6-new is-active" : "ms-brand-v6-new"} onClick={chooseNew}>
              <i><Plus /></i><span><strong>Blank direction</strong><small>Start from a clear idea</small></span>
            </button>
            <div className="ms-brand-v6-library-list">
              {vibes.vibes.map((vibe) => (
                <button key={vibe.id} type="button" className={selectedId === vibe.id ? "is-active" : ""} onClick={() => chooseVibe(vibe)}>
                  <span className="ms-brand-v6-mini-swatch">{(vibe.swatch?.length ? vibe.swatch : PALETTES[0]).slice(0, 3).map((color) => <i key={color} style={{ backgroundColor: color }} />)}</span>
                  <span><strong>{vibe.name}</strong><small>{vibe.builtIn ? "Moonshot base" : vibe.published ? "Published" : "Personal"}</small></span>
                  {vibe.builtIn && <CopySimple />}
                </button>
              ))}
            </div>
          </aside>

          <section className="ms-brand-v6-stage">
            <header><div><span>Live presentation</span><small>16:9 cover</small></div><i className={`is-${draft.density}`}>{draft.density}</i></header>
            <div className={`ms-brand-v6-artboard is-${draft.density}`} style={previewStyle}>
              <div className="ms-brand-v6-artboard-grid" aria-hidden="true"><i /><i /><i /><i /><i /></div>
              <div className="ms-brand-v6-artboard-top"><span>{draft.name || "Untitled direction"}</span><small>Visual system / 01</small></div>
              <div className="ms-brand-v6-artboard-copy">
                <span>{draft.description || "A visual direction in progress."}</span>
                <h2>{draft.name || "Untitled direction"}</h2>
                <p>{draft.styleGuide || "Start with a visual thought."}</p>
              </div>
              <div className="ms-brand-v6-artboard-mark" aria-hidden="true"><i /><i /><i /></div>
              <div className="ms-brand-v6-artboard-footer">
                <span>{draft.swatch.map((color, index) => <i key={`${color}-${index}`} style={{ backgroundColor: color }} />)}</span>
                <small>Moonshot brand direction</small>
              </div>
            </div>
            <div className="ms-brand-v6-stage-note"><Sparkle /><span><strong>Live canvas</strong><small>Identity and palette changes appear here immediately.</small></span></div>
          </section>

          <aside className="ms-brand-v6-inspector">
            <nav aria-label="Brand inspector">
              {([
                ["identity", "Identity", SlidersHorizontal],
                ["references", "References", FileArrowUp],
                ["output", "Output", ShareNetwork],
              ] as const).map(([id, label, Icon]) => (
                <button key={id} type="button" className={inspectorTab === id ? "is-active" : ""} onClick={() => setInspectorTab(id)}>
                  <Icon /> <span>{label}</span>
                  {inspectorTab === id && <motion.i layoutId="brand-inspector-tab" transition={{ duration: reduceMotion ? 0 : 0.16, ease }} />}
                </button>
              ))}
            </nav>

            <div className="ms-brand-v6-inspector-body">
              <AnimatePresence initial={false} mode="sync">
                <motion.div key={inspectorTab} {...panelMotion} transition={{ duration: reduceMotion ? 0 : 0.17, ease }}>
                  {inspectorTab === "identity" && (
                    <IdentityPanel draft={draft} setDraft={setDraft} updateColor={updateColor} />
                  )}
                  {inspectorTab === "references" && (
                    <ReferencesPanel
                      note={referenceNote}
                      setNote={setReferenceNote}
                      url={referenceUrl}
                      setUrl={setReferenceUrl}
                      files={referenceFiles}
                      setFiles={setReferenceFiles}
                      inputRef={referenceInput}
                      generating={generating}
                      onGenerate={generateFromReferences}
                      onQuickStart={applyQuickStart}
                    />
                  )}
                  {inspectorTab === "output" && (
                    <OutputPanel selected={selected} onPublish={publish} onDelete={remove} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {status && <p className="ms-brand-v6-status"><Check weight="bold" /> {status}</p>}
            <footer><button type="button" onClick={persist}><FloppyDisk /> Save</button><button type="button" onClick={compose}>Use in presentation <ArrowRight weight="bold" /></button></footer>
          </aside>
        </div>
      </div>
    </main>
  );
}

function IdentityPanel({
  draft,
  setDraft,
  updateColor,
}: {
  draft: ReturnType<typeof emptyDraft>;
  setDraft: React.Dispatch<React.SetStateAction<ReturnType<typeof emptyDraft>>>;
  updateColor: (index: number, color: string) => void;
}) {
  return (
    <div className="ms-brand-v6-panel">
      <header><span>Identity</span><p>Name the direction and define its visual behavior.</p></header>
      <label><span>Name</span><input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Direction name" /></label>
      <label><span>One-line intent</span><textarea className="is-short" value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder="What should it feel like?" rows={2} /></label>
      <label><span>Visual rules</span><textarea value={draft.styleGuide} onChange={(event) => setDraft((current) => ({ ...current, styleGuide: event.target.value }))} placeholder="Light, type, imagery, rhythm, and what to avoid." rows={6} /></label>
      <section className="ms-brand-v6-palette"><div><span>Palette</span><small>Field / signal / paper</small></div><div>{draft.swatch.map((color, index) => <label key={`${color}-${index}`} style={{ backgroundColor: color }}><input type="color" value={color} onChange={(event) => updateColor(index, event.target.value)} aria-label={`Palette color ${index + 1}`} /><small>{color}</small></label>)}</div><nav aria-label="Palette presets">{PALETTES.map((palette) => <button key={palette.join()} type="button" onClick={() => setDraft((current) => ({ ...current, swatch: palette }))} aria-label={`Use ${palette.join(", ")} palette`}>{palette.map((color) => <i key={color} style={{ backgroundColor: color }} />)}</button>)}</nav></section>
      <section className="ms-brand-v6-energy"><span>Visual energy</span><div>{(["quiet", "balanced", "charged"] as const).map((density) => <button key={density} type="button" className={draft.density === density ? "is-active" : ""} onClick={() => setDraft((current) => ({ ...current, density }))}>{density}</button>)}</div></section>
    </div>
  );
}

function ReferencesPanel({
  note,
  setNote,
  url,
  setUrl,
  files,
  setFiles,
  inputRef,
  generating,
  onGenerate,
  onQuickStart,
}: {
  note: string;
  setNote: (value: string) => void;
  url: string;
  setUrl: (value: string) => void;
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  inputRef: React.RefObject<HTMLInputElement>;
  generating: boolean;
  onGenerate: () => Promise<void>;
  onQuickStart: (start: typeof QUICK_STARTS[number]) => void;
}) {
  const canGenerate = Boolean(note.trim() || url.trim() || files.length);
  return (
    <div className="ms-brand-v6-panel">
      <header><span>References</span><p>Give Moonshot material to interpret, not a template to copy.</p></header>
      <label><span>Creative note</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="What should Moonshot notice?" rows={5} /></label>
      <label><span>Reference link</span><div className="ms-brand-v6-url"><LinkSimple /><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Paste a URL" /></div></label>
      <input ref={inputRef} className="sr-only" type="file" multiple accept="image/*,.pdf,.txt,.md,.doc,.docx,.ppt,.pptx" onChange={(event) => setFiles(Array.from(event.target.files ?? []))} />
      {files.length > 0 && <div className="ms-brand-v6-files">{files.map((file) => <span key={`${file.name}-${file.lastModified}`}><i>{file.name.split(".").pop()?.toUpperCase() ?? "FILE"}</i><b>{file.name}</b><button type="button" onClick={() => setFiles((current) => current.filter((item) => item !== file))} aria-label={`Remove ${file.name}`}><X /></button></span>)}</div>}
      <div className="ms-brand-v6-reference-actions"><button type="button" onClick={() => inputRef.current?.click()}><FileArrowUp /> Add files</button><button type="button" disabled={generating || !canGenerate} onClick={() => void onGenerate()}>{generating ? <CircleNotch className="animate-spin" /> : <MagicWand />}{generating ? "Reading" : "Draft direction"}</button></div>
      <section className="ms-brand-v6-quickstarts"><div><span>Starting points</span><small>Use one, then make it yours.</small></div>{QUICK_STARTS.map((start) => <button key={start.name} type="button" onClick={() => onQuickStart(start)}><span>{start.swatch.map((color) => <i key={color} style={{ backgroundColor: color }} />)}</span><strong>{start.name}</strong><ArrowRight /></button>)}</section>
    </div>
  );
}

function OutputPanel({ selected, onPublish, onDelete }: { selected: Vibe | null; onPublish: () => void; onDelete: () => void }) {
  return (
    <div className="ms-brand-v6-panel ms-brand-v6-output">
      <header><span>Output</span><p>Choose where this direction should be available.</p></header>
      <section><Check weight="bold" /><div><strong>Presentation ready</strong><p>Palette, visual rules, and density are carried into a new deck.</p></div></section>
      <section><FloppyDisk /><div><strong>Personal library</strong><p>Save this direction to reuse it across future work.</p></div></section>
      <section><ShareNetwork /><div><strong>Community</strong><p>{selected?.published ? "This direction is currently public." : "Publish a saved personal direction for others to reuse."}</p></div></section>
      {selected ? <div className="ms-brand-v6-output-actions"><button type="button" onClick={onPublish}><ShareNetwork /> {selected.published ? "Remove from Community" : "Publish to Community"}</button><button type="button" onClick={onDelete}><Trash /> Delete direction</button></div> : <p className="ms-brand-v6-output-hint">Save this direction before publishing it.</p>}
    </div>
  );
}
