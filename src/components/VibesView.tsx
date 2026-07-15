import { useRef, useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Check,
  CircleNotch,
  CopySimple,
  FileArrowUp,
  FloppyDisk,
  LinkSimple,
  MagicWand,
  Palette,
  Plus,
  ShareNetwork,
  Trash,
  X,
} from "@phosphor-icons/react";

import type { Vibe } from "@/types";
import { generateVibe, type VibeStore } from "@/lib/vibes";

type Density = "quiet" | "balanced" | "charged";

const PALETTES = [
  ["#11131d", "#8c7cff", "#ece9ff"],
  ["#f5f5f2", "#1f2025", "#ef4b37"],
  ["#101112", "#c79b61", "#f4eadc"],
  ["#102220", "#71d3bd", "#e4fff7"],
];

const QUICK_STARTS = [
  { name: "Product clarity", note: "Calm product storytelling, precise hierarchy, and plenty of air.", swatch: ["#111827", "#6d93dc", "#eff4fb"] },
  { name: "Tactile editorial", note: "Warm paper, museum-like type, structured crops, and quiet contrast.", swatch: ["#211c18", "#b78352", "#f1e3cf"] },
  { name: "Signal room", note: "A dark system language with ultraviolet signal and deliberate diagrams.", swatch: ["#151722", "#8c7cff", "#edf0ff"] },
];

const emptyDraft = () => ({
  name: "Untitled direction",
  description: "A clear visual language for a deck with a point of view.",
  styleGuide: "Describe the light, type, visual rhythm, and what this direction should avoid.",
  swatch: PALETTES[0],
  density: "balanced" as Density,
});

export function VibesView({ vibes, onCompose }: { vibes: VibeStore; onCompose: (vibe: Vibe) => void }) {
  const [selectedId, setSelectedId] = useState<string | "new">("new");
  const [draft, setDraft] = useState(emptyDraft);
  const [status, setStatus] = useState("");
  const [referenceNote, setReferenceNote] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [generating, setGenerating] = useState(false);
  const referenceInput = useRef<HTMLInputElement>(null);
  const reduce = useReducedMotion();
  const selected = vibes.custom.find((vibe) => vibe.id === selectedId) ?? null;

  const chooseNew = () => {
    setSelectedId("new");
    setDraft(emptyDraft());
    setStatus("");
  };
  const chooseVibe = (vibe: Vibe) => {
    setSelectedId(vibe.builtIn ? "new" : vibe.id);
    setDraft({
      name: vibe.name,
      description: vibe.description,
      styleGuide: vibe.styleGuide,
      swatch: vibe.swatch?.length ? vibe.swatch : PALETTES[0],
      density: "balanced",
    });
    setStatus("");
  };
  const updateColor = (index: number, color: string) => setDraft((current) => ({ ...current, swatch: current.swatch.map((value, item) => item === index ? color : value) }));
  const applyQuickStart = (start: typeof QUICK_STARTS[number]) => {
    setSelectedId("new");
    setReferenceNote(start.note);
    setDraft({ name: start.name, description: start.note, styleGuide: `Use ${start.name.toLowerCase()} as the visual direction. Keep one strong focal subject, a deliberate grid, and calm supporting detail.`, swatch: start.swatch, density: "balanced" });
    setStatus("Starting direction applied. Add references when you want to make it more specific.");
  };
  const generateFromReferences = async () => {
    if (generating || (!referenceNote.trim() && !referenceUrl.trim() && !referenceFiles.length)) return;
    setGenerating(true);
    setStatus("");
    try {
      const result = await generateVibe({ deckId: "vibe-studio", description: referenceNote, url: referenceUrl.trim() || undefined, files: referenceFiles });
      setSelectedId("new");
      setDraft({ ...result, swatch: result.swatch?.length ? result.swatch : PALETTES[0], density: "balanced" });
      setStatus("Direction drafted from your references. Fine-tune it, then save.");
    } catch {
      setStatus("Could not read those references. Try a smaller file or add a note.");
    } finally {
      setGenerating(false);
    }
  };
  const save = () => {
    const input = { name: draft.name.trim() || "Untitled direction", description: draft.description.trim(), styleGuide: draft.styleGuide.trim(), swatch: draft.swatch };
    const result = selected ? vibes.updateVibe(selected.id, input) : vibes.createVibe(input);
    if (result) {
      setSelectedId(result.id);
      setStatus("Saved to your vibe library.");
    }
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
    const input = { name: draft.name.trim() || "Untitled direction", description: draft.description.trim(), styleGuide: draft.styleGuide.trim(), swatch: draft.swatch };
    const result = selected ? vibes.updateVibe(selected.id, input) : vibes.createVibe(input);
    if (result) onCompose(result);
  };

  return <main className="ms-vibes-view">
    <div className="ms-vibes-shell">
      <motion.header className="ms-vibes-head" initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : .22, ease: [0.22, 1, .36, 1] }}>
        <div><span><Palette weight="duotone" /> Vibe studio</span><h1>Give your decks a point of view.</h1><p>Build a reusable visual direction, tune it in real time, then carry it straight into a presentation.</p></div>
        <button type="button" onClick={chooseNew}><Plus /> New direction</button>
      </motion.header>

      <section className="ms-vibes-workspace">
        <article className={`ms-vibe-artboard is-${draft.density}`} style={{ "--vibe-ink": draft.swatch[0], "--vibe-signal": draft.swatch[1], "--vibe-paper": draft.swatch[2] } as CSSProperties}>
          <div className="ms-vibe-artboard-top"><span>Live direction</span><i>{draft.density}</i></div>
          <div className="ms-vibe-artboard-copy"><span>{draft.description || "A visual direction in progress."}</span><h2>{draft.name || "Untitled direction"}</h2><p>{draft.styleGuide || "Start with a visual thought."}</p></div>
          <div className="ms-vibe-artboard-rhythm"><i /><i /><i /><i /></div>
        </article>

        <aside className="ms-vibe-controls">
          <div className="ms-vibe-control-head"><span>Direction settings</span>{selected?.published && <i><ShareNetwork /> Published</i>}</div>
          <section className="ms-vibe-reference">
            <div className="ms-vibe-reference-head"><div><span>Reference engine</span><small>Image, PDF, URL, or a working note</small></div><MagicWand /></div>
            <textarea value={referenceNote} onChange={(event) => setReferenceNote(event.target.value)} placeholder="What should Moonshot notice in these references?" aria-label="Reference note" />
            <label className="ms-vibe-reference-url"><LinkSimple /><input value={referenceUrl} onChange={(event) => setReferenceUrl(event.target.value)} placeholder="Paste a reference link" aria-label="Reference link" /></label>
            <input ref={referenceInput} className="sr-only" type="file" multiple accept="image/*,.pdf,.txt,.md,.doc,.docx,.ppt,.pptx" onChange={(event) => setReferenceFiles(Array.from(event.target.files ?? []))} />
            {referenceFiles.length > 0 && <div className="ms-vibe-reference-files">{referenceFiles.map((file) => <span key={`${file.name}-${file.lastModified}`}><i>{file.name.split(".").pop()?.toUpperCase() ?? "FILE"}</i><b>{file.name}</b><button type="button" onClick={() => setReferenceFiles((current) => current.filter((item) => item !== file))} aria-label={`Remove ${file.name}`}><X /></button></span>)}</div>}
            <div className="ms-vibe-reference-actions"><button type="button" onClick={() => referenceInput.current?.click()}><FileArrowUp /> Add references</button><button type="button" disabled={generating || (!referenceNote.trim() && !referenceUrl.trim() && !referenceFiles.length)} onClick={() => void generateFromReferences()}>{generating ? <CircleNotch className="animate-spin" /> : <MagicWand />}{generating ? "Reading" : "Generate direction"}</button></div>
            <div className="ms-vibe-quickstarts"><span>Start somewhere</span><div>{QUICK_STARTS.map((start) => <button key={start.name} type="button" onClick={() => applyQuickStart(start)}><i style={{ background: `linear-gradient(135deg, ${start.swatch[0]}, ${start.swatch[1]}, ${start.swatch[2]})` }} /><span>{start.name}</span></button>)}</div></div>
          </section>
          <div className="ms-vibe-manual-label"><span>Fine-tune the direction</span><small>Everything below stays editable.</small></div>
          <label>Title<input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Name this direction" /></label>
          <label>One line<p><input value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder="What should it feel like?" /></p></label>
          <label>Style guide<textarea value={draft.styleGuide} onChange={(event) => setDraft((current) => ({ ...current, styleGuide: event.target.value }))} placeholder="Light, type, image treatment, visual rhythm, and what to avoid." /></label>
          <div className="ms-vibe-palette-control"><span>Palette</span><div>{draft.swatch.map((color, index) => <label key={`${color}-${index}`} style={{ backgroundColor: color }}><input type="color" value={color} onChange={(event) => updateColor(index, event.target.value)} aria-label={`Palette color ${index + 1}`} /></label>)}</div><div className="ms-vibe-palette-presets">{PALETTES.map((palette) => <button key={palette.join()} type="button" onClick={() => setDraft((current) => ({ ...current, swatch: palette }))} aria-label="Use palette" style={{ "--one": palette[0], "--two": palette[1], "--three": palette[2] } as CSSProperties} />)}</div></div>
          <div className="ms-vibe-density"><span>Energy</span><div>{(["quiet", "balanced", "charged"] as const).map((density) => <button key={density} type="button" className={draft.density === density ? "is-active" : ""} onClick={() => setDraft((current) => ({ ...current, density }))}>{density}</button>)}</div></div>
          {status && <p className="ms-vibe-status"><Check /> {status}</p>}
          <div className="ms-vibe-control-actions"><button type="button" onClick={save}><FloppyDisk /> Save direction</button><button type="button" onClick={compose}><MagicWand /> Compose with it</button></div>
          {selected && <div className="ms-vibe-secondary-actions"><button type="button" onClick={publish}><ShareNetwork /> {selected.published ? "Unpublish" : "Publish"}</button><button type="button" onClick={remove} aria-label="Delete direction"><Trash /></button></div>}
        </aside>
      </section>

      <section className="ms-vibes-library"><div className="ms-vibes-library-head"><div><span>Your library</span><h2>Directions you can return to.</h2></div><small>{vibes.custom.length} custom</small></div><div className="ms-vibes-library-grid"><button type="button" className={selectedId === "new" ? "ms-vibe-library-new is-active" : "ms-vibe-library-new"} onClick={chooseNew}><Plus /><span>New direction</span></button>{vibes.vibes.map((vibe) => <button type="button" key={vibe.id} className={selectedId === vibe.id ? "ms-vibe-library-card is-active" : "ms-vibe-library-card"} onClick={() => chooseVibe(vibe)}><span style={{ "--one": vibe.swatch?.[0] ?? "#15161e", "--two": vibe.swatch?.[1] ?? "#8c7cff", "--three": vibe.swatch?.[2] ?? "#f5f5f5" } as CSSProperties}><i /><i /><i /></span><strong>{vibe.name}</strong><small>{vibe.builtIn ? "Moonshot base" : vibe.published ? "Published" : "Personal"}</small>{vibe.builtIn && <CopySimple />}</button>)}</div></section>
    </div>
  </main>;
}
