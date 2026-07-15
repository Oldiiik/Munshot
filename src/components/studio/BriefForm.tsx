import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Sparkle as Sparkles,
  GraduationCap,
  Paperclip,
  Image as ImageIcon,
  FileText,
  X,
  MagicWand as Wand2,
  Minus,
  Plus,
  GlobeHemisphereWest as Globe,
  ChatCircleDots as MessageCircleQuestion,
  ArrowRight,
  Palette,
  PencilSimple as Pencil,
  Trash as Trash2,
  Check,
  CircleNotch as Loader2,
  ShareNetwork as Share2,
  LinkSimple as Link2,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Attachment, Deck, Vibe } from "@/types";
import { uid } from "@/store";
import { uploadAttachment } from "@/lib/api";
import { deckCover, publishedDecks } from "@/lib/demo";
import { MAX_SLIDES } from "@/limits";
import { generateVibe, type VibeStore } from "@/lib/vibes";

interface Props {
  deck: Deck;
  busy: boolean;
  status: string;
  onChange: (patch: Partial<Deck>) => void;
  onGenerate: () => void;
  /** Jump to the Community view (the strip beneath the brief links here). */
  onBrowseCommunity: () => void;
  /** Style presets (built-in + the user's custom vibes) + CRUD. */
  vibes: VibeStore;
}

const IMAGE_EXT = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"];

export function BriefForm({ deck, busy, status, onChange, onGenerate, onBrowseCommunity, vibes }: Props) {
  const [picking, setPicking] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const edu = deck.mode === "edu";

  const onFilesPicked = async (files: FileList | null) => {
    if (!files || !files.length || busy) return;
    setPicking(true);
    try {
      const uploaded: Attachment[] = [];
      for (const file of Array.from(files)) {
        try {
          const { storagePath } = await uploadAttachment(deck.id, file);
          const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
          uploaded.push({
            id: uid(),
            name: file.name,
            path: storagePath,
            kind: IMAGE_EXT.includes(ext) ? "image" : "file",
          });
        } catch {
          /* skip the file that failed to upload */
        }
      }
      if (uploaded.length)
        onChange({ attachments: [...deck.attachments, ...uploaded] });
    } finally {
      setPicking(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const removeAttachment = (id: string) =>
    onChange({ attachments: deck.attachments.filter((a) => a.id !== id) });

  const setCount = (n: number) =>
    onChange({ slideCount: Math.max(1, Math.min(MAX_SLIDES, n)) });

  const canGenerate = !busy && deck.brief.trim().length > 0;

  return (
    <div className="ms-brief-view flex h-full items-center justify-center overflow-y-auto px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="ms-compose-shell w-full max-w-3xl"
      >
        <div className="ms-compose-intro mb-9 text-center">
          <div className="ms-compose-intro-mark mx-auto mb-5 grid size-14 place-items-center rounded-[20px] border border-border bg-gradient-to-b from-primary/15 to-transparent text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
            {edu ? (
              <GraduationCap className="size-6" />
            ) : (
              <Sparkles className="size-6" />
            )}
          </div>
          <h1 className="text-[30px] font-semibold leading-tight tracking-tight">
            {edu ? "Build a lesson from the curriculum" : "Design a deck from a brief"}
          </h1>
          <p className="mx-auto mt-2.5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            {edu
              ? "Name one topic and drop in the source material — it plans a clear, student-friendly lesson you can refine."
              : "Describe your presentation and drop in brand assets — it learns the brand and drafts an outline you can refine."}
          </p>
        </div>

        <div className="ms-compose-workspace relative">
          <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[32px] bg-primary/[0.07] blur-2xl" />
          <div className="ms-brief-composer rounded-[26px] border border-border bg-card/90 p-3 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <Textarea
            value={deck.brief}
            onChange={(e) => onChange({ brief: e.target.value })}
            placeholder={
              edu
                ? "e.g. Teach single-slit diffraction to high-school physics students. Assume they know waves but not interference. Friendly and visual."
                : "e.g. A 6-slide investor pitch for a solar-powered drone delivery startup. Confident, optimistic, data-forward."
            }
            className="min-h-28 px-3.5 py-3 text-[15px] leading-relaxed"
            autoFocus
          />

          {deck.attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-1.5 pb-2 pt-1">
              {deck.attachments.map((a) => (
                <span
                  key={a.id}
                  className="group inline-flex max-w-[220px] items-center gap-1.5 rounded-lg border border-border bg-secondary/60 py-1 pl-2 pr-1 text-xs text-secondary-foreground"
                >
                  {a.kind === "image" ? (
                    <ImageIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="truncate">{a.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(a.id)}
                    className="grid size-4 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
                    aria-label={`Remove ${a.name}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="ms-brief-toolbar flex items-center justify-between gap-3 px-1 pt-1.5">
            <div className="flex items-center gap-2">
              <input
                ref={fileInput}
                type="file"
                multiple
                accept={[...IMAGE_EXT.map((e) => `.${e}`), ".pdf", ".txt", ".md", ".doc", ".docx"].join(",")}
                className="hidden"
                onChange={(e) => void onFilesPicked(e.target.files)}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInput.current?.click()}
                disabled={busy || picking}
                className="gap-1.5 rounded-lg"
              >
                <Paperclip className="size-3.5" />
                {picking ? "Uploading…" : edu ? "Add material" : "Add assets"}
              </Button>

              <div className="flex items-center gap-1 rounded-lg border border-border bg-secondary/40 p-0.5">
                <button
                  type="button"
                  onClick={() => setCount(deck.slideCount - 1)}
                  disabled={busy}
                  className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
                  aria-label="Fewer slides"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="min-w-14 text-center text-xs tabular-nums text-foreground">
                  {deck.slideCount} slides
                </span>
                <button
                  type="button"
                  onClick={() => setCount(deck.slideCount + 1)}
                  disabled={busy || deck.slideCount >= MAX_SLIDES}
                  className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
                  aria-label="More slides"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-1">
                <ToggleChip
                  active={deck.webSearch}
                  disabled={busy}
                  onClick={() => onChange({ webSearch: !deck.webSearch })}
                  icon={Globe}
                  label="Web search"
                  title="Let the planner research the topic on the web before drafting"
                />
                <ToggleChip
                  active={deck.askQuestions}
                  disabled={busy}
                  onClick={() => onChange({ askQuestions: !deck.askQuestions })}
                  icon={MessageCircleQuestion}
                  label="Ask questions"
                  title="Let the planner surface clarifying questions about the brief"
                />
                <VibePicker
                  vibes={vibes}
                  deckId={deck.id}
                  selected={deck.vibe}
                  disabled={busy}
                  onSelect={(vibe) => onChange({ vibe })}
                />
              </div>
            </div>

            <Button
              type="button"
              onClick={onGenerate}
              disabled={!canGenerate}
              className="gap-1.5 rounded-lg"
            >
              <Wand2 className="size-4" />
              {edu ? "Plan lesson" : "Create outline"}
            </Button>
          </div>
          </div>
        </div>

        {(deck.webSearch || deck.askQuestions) && (
          <p className="mt-2 px-1 text-[11px] text-muted-foreground">
            {deck.webSearch && deck.askQuestions
              ? "The planner will research the topic on the web and may ask you clarifying questions."
              : deck.webSearch
                ? "The planner will research the topic on the web before drafting."
                : "The planner may surface clarifying questions about your brief."}
          </p>
        )}

        {busy && status && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span className="flex gap-1">
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.2s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.1s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
            </span>
            {status}
          </div>
        )}

        {!busy && <CommunityStrip onBrowseCommunity={onBrowseCommunity} />}
      </motion.div>
    </div>
  );
}

interface CommunityDeck {
  id: string;
  title: string;
  mode: "moonshot" | "edu";
  slide_count: number;
  cover?: string;
}

/** A peek at a few community-published decks, shown beneath the brief input as
 *  inspiration. Clicking the strip jumps to the full Community view. */
function CommunityStrip({ onBrowseCommunity }: { onBrowseCommunity: () => void }) {
  const [decks, setDecks] = useState<CommunityDeck[]>([]);

  useEffect(() => {
    setDecks(
      publishedDecks()
        .slice(0, 8)
        .map((d) => ({
          id: d.id,
          title: d.title,
          mode: d.mode,
          slide_count: d.slideCount,
          cover: deckCover(d),
        }))
    );
  }, []);

  const withCovers = decks.filter((d) => d.cover);
  if (withCovers.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="ms-compose-community-strip mt-10"
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Globe className="size-3.5" />
          From the community
        </div>
        <button
          type="button"
          onClick={onBrowseCommunity}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Browse all
          <ArrowRight className="size-3" />
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {withCovers.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={onBrowseCommunity}
            className="group w-44 shrink-0 overflow-hidden rounded-xl border border-border bg-card/60 text-left transition-colors hover:border-border/80 hover:bg-muted/30"
            title={`${d.title || "Untitled deck"} · ${d.slide_count} slides`}
          >
            <div className="aspect-video overflow-hidden bg-muted/40">
              <img
                src={d.cover}
                alt={d.title}
                loading="lazy"
                className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
            </div>
            <p className="truncate px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground">
              {d.title || "Untitled deck"}
            </p>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

/** The Vibe chip + popover: pick a style preset (or none), and create / edit /
 *  delete custom vibes. The selected vibe is snapshotted onto the deck. */
function VibePicker({
  vibes,
  deckId,
  selected,
  disabled,
  onSelect,
}: {
  vibes: VibeStore;
  deckId: string;
  selected: Vibe | null;
  disabled: boolean;
  onSelect: (vibe: Vibe | null) => void;
}) {
  const [open, setOpen] = useState(false);
  /** null = closed; "new" = create; a Vibe = edit that one. */
  const [editing, setEditing] = useState<Vibe | "new" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close the popover on outside-click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-pressed={!!selected}
        title="Pick a presentation style (vibe)"
        className={cn(
          "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-40",
          selected
            ? "border-primary/40 bg-primary/15 text-primary"
            : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
        )}
      >
        <Palette className="size-3.5" />
        <span className="hidden max-w-28 truncate sm:inline">
          {selected ? selected.name : "Vibe"}
        </span>
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.14, ease: "easeOut" }}
          className="absolute bottom-full left-0 z-30 mb-2 w-72 origin-bottom-left rounded-xl border border-border bg-popover p-1.5 shadow-xl"
        >
          <div className="px-2 pb-1.5 pt-1 text-[11.5px] font-medium text-muted-foreground/75">
            Presentation vibe
          </div>
          <div className="max-h-72 space-y-0.5 overflow-y-auto">
            {/* No vibe */}
            <VibeRow
              active={!selected}
              title="No vibe"
              subtitle="Plain — just the brief and brand"
              onClick={() => {
                onSelect(null);
                setOpen(false);
              }}
            />
            {vibes.vibes.map((v) => (
              <VibeRow
                key={v.id}
                active={selected?.id === v.id}
                title={v.name}
                subtitle={v.description}
                swatch={v.swatch}
                onClick={() => {
                  onSelect(v);
                  setOpen(false);
                }}
                onEdit={v.builtIn ? undefined : () => setEditing(v)}
                onDelete={
                  v.builtIn
                    ? undefined
                    : () => {
                        if (selected?.id === v.id) onSelect(null);
                        void vibes.deleteVibe(v.id);
                      }
                }
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="mt-1 flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-2.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          >
            <Plus className="size-3.5" />
            New vibe
          </button>
        </motion.div>
      )}

      {editing && (
        <VibeEditorModal
          vibe={editing === "new" ? null : editing}
          deckId={deckId}
          onClose={() => setEditing(null)}
          onSave={async (input, share) => {
            const saved =
              editing === "new"
                ? await vibes.createVibe(input)
                : await vibes.updateVibe(editing.id, input);
            if (saved) {
              if (share !== undefined && share !== !!saved.published)
                await vibes.setVibePublished(saved.id, share);
              onSelect({ ...saved, published: share ?? saved.published });
              setEditing(null);
              setOpen(false);
            }
          }}
        />
      )}
    </div>
  );
}

/** One row in the vibe popover. */
function VibeRow({
  active,
  title,
  subtitle,
  swatch,
  onClick,
  onEdit,
  onDelete,
}: {
  active: boolean;
  title: string;
  subtitle?: string;
  swatch?: string[];
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
        active ? "bg-primary/15" : "hover:bg-muted/40"
      )}
    >
      <button type="button" onClick={onClick} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
        <span className="flex shrink-0 items-center -space-x-1">
          {swatch && swatch.length > 0 ? (
            swatch.slice(0, 3).map((c, i) => (
              <span
                key={i}
                className="size-3.5 rounded-full border border-background"
                style={{ backgroundColor: c }}
              />
            ))
          ) : (
            <span className="grid size-3.5 place-items-center text-muted-foreground">
              <Palette className="size-3" />
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className={cn("truncate text-xs font-medium", active ? "text-primary" : "text-foreground")}>
              {title}
            </span>
            {active && <Check className="size-3 shrink-0 text-primary" />}
          </span>
          {subtitle && (
            <span className="block truncate text-[10.5px] text-muted-foreground">{subtitle}</span>
          )}
        </span>
      </button>
      {(onEdit || onDelete) && (
        <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              title="Edit vibe"
              className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Pencil className="size-3" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              title="Delete vibe"
              className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
            >
              <Trash2 className="size-3" />
            </button>
          )}
        </span>
      )}
    </div>
  );
}

/** Create / edit a custom vibe. New vibes are generated by AI from references
 *  (images + a description + an optional reference URL); the AI's result is then
 *  shown in an editable review form. Editing an existing vibe opens the review
 *  form directly. A "Share to community" toggle publishes it to the gallery. */
function VibeEditorModal({
  vibe,
  deckId,
  onClose,
  onSave,
}: {
  vibe: Vibe | null;
  deckId: string;
  onClose: () => void;
  onSave: (
    input: Pick<Vibe, "name" | "description" | "styleGuide" | "swatch">,
    share?: boolean
  ) => void | Promise<void>;
}) {
  // "input" = AI reference form (new vibes); "review" = editable result.
  const [step, setStep] = useState<"input" | "review">(vibe ? "review" : "input");

  // AI input state.
  const [refDesc, setRefDesc] = useState("");
  const [refUrl, setRefUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const refInput = useRef<HTMLInputElement>(null);

  // Editable review state (prefilled when editing).
  const [name, setName] = useState(vibe?.name ?? "");
  const [description, setDescription] = useState(vibe?.description ?? "");
  const [styleGuide, setStyleGuide] = useState(vibe?.styleGuide ?? "");
  const [swatch, setSwatch] = useState<string[]>(vibe?.swatch ?? []);
  const [share, setShare] = useState(!!vibe?.published);
  const [saving, setSaving] = useState(false);

  const canGenerate =
    !generating && (refDesc.trim().length > 0 || files.length > 0 || refUrl.trim().length > 0);
  const canSave = name.trim().length > 0 && styleGuide.trim().length > 0 && !saving;

  const runGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setGenError(null);
    try {
      const result = await generateVibe({
        deckId,
        description: refDesc,
        url: refUrl.trim() || undefined,
        files,
      });
      setName(result.name);
      setDescription(result.description);
      setStyleGuide(result.styleGuide);
      setSwatch(result.swatch ?? []);
      setStep("review");
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Couldn't generate that vibe. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  const submit = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave(
        {
          name: name.trim(),
          description: description.trim(),
          styleGuide: styleGuide.trim(),
          swatch,
        },
        share
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-xl border border-border bg-muted/40">
            <Palette className="size-4 text-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">
              {vibe ? "Edit vibe" : step === "input" ? "Generate a vibe" : "Review your vibe"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {step === "input"
                ? "Drop in references and let AI distil a reusable style."
                : "A reusable style layered on top of your brief — tweak anything."}
            </p>
          </div>
        </div>

        {step === "input" ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Describe the style
              </label>
              <Textarea
                autoFocus
                value={refDesc}
                onChange={(e) => setRefDesc(e.target.value)}
                placeholder="e.g. Like an Apple keynote — calm, premium, lots of negative space, crisp type, product-first."
                className="min-h-24 text-sm leading-relaxed"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Reference URL <span className="text-muted-foreground/60">(optional)</span>
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background/70 px-3 focus-within:border-primary">
                <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
                <input
                  value={refUrl}
                  onChange={(e) => setRefUrl(e.target.value)}
                  placeholder="https://example.com/style-page"
                  className="h-9 w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Reference images <span className="text-muted-foreground/60">(optional)</span>
              </label>
              <input
                ref={refInput}
                type="file"
                multiple
                accept={IMAGE_EXT.map((e) => `.${e}`).join(",")}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                  if (refInput.current) refInput.current.value = "";
                }}
              />
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => refInput.current?.click()}
                  className="gap-1.5 rounded-lg"
                >
                  <ImageIcon className="size-3.5" /> Add images
                </Button>
                {files.map((f, i) => (
                  <span
                    key={i}
                    className="group inline-flex max-w-[160px] items-center gap-1.5 rounded-lg border border-border bg-secondary/60 py-1 pl-2 pr-1 text-xs text-secondary-foreground"
                  >
                    <span className="truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="grid size-4 shrink-0 place-items-center rounded text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                      aria-label={`Remove ${f.name}`}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {genError && <p className="text-xs text-destructive">{genError}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void runGenerate()}
                disabled={!canGenerate}
                className="gap-1.5"
              >
                {generating ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> Generating…
                  </>
                ) : (
                  <>
                    <Wand2 className="size-3.5" /> Generate vibe
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bold Editorial"
                className="h-9 w-full rounded-lg border border-border bg-background/70 px-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Tagline <span className="text-muted-foreground/60">(optional)</span>
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="One line describing the look"
                className="h-9 w-full rounded-lg border border-border bg-background/70 px-3 text-sm outline-none focus:border-primary"
              />
            </div>
            {swatch.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Palette</span>
                <span className="flex items-center gap-1">
                  {swatch.map((c, i) => (
                    <span
                      key={i}
                      className="size-5 rounded-md border border-border"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </span>
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Style guide</label>
              <Textarea
                value={styleGuide}
                onChange={(e) => setStyleGuide(e.target.value)}
                placeholder="The aesthetic to layer onto the brief."
                className="min-h-36 text-sm leading-relaxed"
              />
            </div>

            <button
              type="button"
              onClick={() => setShare((v) => !v)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors",
                share ? "border-primary/40 bg-primary/10" : "border-border bg-background/40 hover:bg-muted/40"
              )}
            >
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-lg",
                  share ? "bg-primary/20 text-primary" : "bg-muted/60 text-muted-foreground"
                )}
              >
                <Share2 className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium text-foreground">Share to community</span>
                <span className="block text-[11px] text-muted-foreground">
                  Anyone can browse and use this vibe in the Community gallery.
                </span>
              </span>
              <span
                className={cn(
                  "grid size-4 shrink-0 place-items-center rounded border",
                  share ? "border-primary bg-primary text-primary-foreground" : "border-border"
                )}
              >
                {share && <Check className="size-3" />}
              </span>
            </button>

            <div className="mt-5 flex items-center justify-between gap-2">
              {!vibe ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("input")}
                  className="gap-1.5 text-muted-foreground"
                >
                  <Wand2 className="size-3.5" /> Regenerate
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void submit()}
                  disabled={!canSave}
                  className="gap-1.5"
                >
                  {saving ? "Saving…" : vibe ? "Save changes" : "Save vibe"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Compact pill toggle for a generation option (web search / ask questions). */
function ToggleChip({
  active,
  disabled,
  onClick,
  icon: Icon,
  label,
  title,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  icon: typeof Globe;
  label: string;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      title={title}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-40",
        active
          ? "border-primary/40 bg-primary/15 text-primary"
          : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="size-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
