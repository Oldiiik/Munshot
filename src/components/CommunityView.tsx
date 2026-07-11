import { useCallback, useEffect, useState } from "react";
import {
  Globe,
  Loader2,
  ImageOff,
  X,
  RefreshCw,
  ChevronRight,
  Palette,
  LayoutGrid,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deckCover, publishedDecks } from "@/lib/demo";
import { BUILTIN_VIBES, loadCommunityVibes, type CommunityVibe } from "@/lib/vibes";
import type { Brand, Deck, GeneratedSlide, OutlineSlide, Vibe } from "@/types";

/** A published deck, browsable by anyone (kept in the cloud build's row shape). */
interface PublishedDeckRow {
  id: string;
  title: string;
  mode: "moonshot" | "edu";
  slide_count: number;
  brand: Brand | null;
  outline: OutlineSlide[] | null;
  updated_at: string;
}

function toRow(d: Deck): PublishedDeckRow {
  return {
    id: d.id,
    title: d.title,
    mode: d.mode,
    slide_count: d.slideCount,
    brand: d.brand,
    outline: d.outline,
    updated_at: new Date(d.updatedAt).toISOString(),
  };
}

/** Community: every signed-in user can browse and open any deck that its author
 *  published. Cross-user reads (rows + slide PNGs) are permitted by migration 0007. */
export function CommunityView() {
  const [tab, setTab] = useState<"decks" | "vibes">("decks");
  const [loading, setLoading] = useState(true);
  const [decks, setDecks] = useState<PublishedDeckRow[]>([]);
  const [covers, setCovers] = useState<Record<string, string | undefined>>({});
  const [open, setOpen] = useState<PublishedDeckRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const published = publishedDecks();
    setDecks(published.map(toRow));
    const next: Record<string, string | undefined> = {};
    for (const d of published) next[d.id] = deckCover(d);
    setCovers(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
              <Globe className="size-5" /> Community
            </h1>
            <p className="text-sm text-muted-foreground">
              {tab === "decks"
                ? "Decks other people have published. Open one to flip through its slides."
                : "Reusable styles the community shared — with example decks made in each."}
            </p>
          </div>
          {tab === "decks" && (
            <Button variant="ghost" size="sm" onClick={() => void load()} className="gap-1.5">
              <RefreshCw className="size-4" /> Refresh
            </Button>
          )}
        </div>

        <div className="flex w-fit items-center gap-1 rounded-lg border border-border bg-secondary/40 p-0.5">
          {(["decks", "vibes"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "decks" ? <LayoutGrid className="size-3.5" /> : <Palette className="size-3.5" />}
              {t}
            </button>
          ))}
        </div>

        {tab === "vibes" ? (
          <VibesGallery />
        ) : loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : decks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">
            Nothing published yet. Render a deck and hit Publish to share it here.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setOpen(d)}
                className="group overflow-hidden rounded-xl border border-border bg-card/60 text-left transition-colors hover:bg-muted/30"
              >
                <div className="relative aspect-video bg-muted/40">
                  {covers[d.id] ? (
                    <img
                      src={covers[d.id]}
                      alt={d.title}
                      className="size-full object-cover transition-opacity group-hover:opacity-90"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <ImageOff className="size-5" />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{d.title || "Untitled deck"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {d.mode} · {d.slide_count} slides
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {open && <DeckViewer deck={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

/** Community vibe gallery: every shared vibe (built-in presets first) with its
 *  details (style guide) and example decks made with it. */
function VibesGallery() {
  const [loading, setLoading] = useState(true);
  const [vibes, setVibes] = useState<Vibe[]>(BUILTIN_VIBES);
  const [examples, setExamples] = useState<Record<string, PublishedDeckRow[]>>({});
  const [covers, setCovers] = useState<Record<string, string | undefined>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [open, setOpen] = useState<PublishedDeckRow | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      setLoading(true);
      const community: CommunityVibe[] = await loadCommunityVibes();
      // Built-in presets first, then community-shared vibes.
      const list: Vibe[] = [...BUILTIN_VIBES, ...community];
      if (!alive) return;
      setVibes(list);
      setLoading(false);

      // For each vibe, find published decks whose snapshot used it.
      const ex: Record<string, PublishedDeckRow[]> = {};
      const cov: Record<string, string | undefined> = {};
      const published = publishedDecks();
      for (const v of list) {
        const matches = published.filter((d) => d.vibe?.id === v.id).slice(0, 6);
        ex[v.id] = matches.map(toRow);
        for (const d of matches) cov[d.id] = deckCover(d);
      }
      if (!alive) return;
      setExamples(ex);
      setCovers(cov);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {vibes.map((v) => {
          const exs = examples[v.id] ?? [];
          const isOpen = expanded === v.id;
          return (
            <div key={v.id} className="overflow-hidden rounded-xl border border-border bg-card/60">
              <div className="flex items-start gap-3 p-4">
                <span className="mt-0.5 flex shrink-0 items-center -space-x-1">
                  {v.swatch && v.swatch.length > 0 ? (
                    v.swatch.slice(0, 4).map((c, i) => (
                      <span
                        key={i}
                        className="size-5 rounded-full border-2 border-card"
                        style={{ backgroundColor: c }}
                      />
                    ))
                  ) : (
                    <span className="grid size-5 place-items-center rounded-full bg-muted text-muted-foreground">
                      <Palette className="size-3" />
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold">{v.name}</h3>
                    {v.builtIn && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Built-in
                      </span>
                    )}
                  </div>
                  {v.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{v.description}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : v.id)}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ChevronRight
                      className={cn("size-3 transition-transform", isOpen && "rotate-90")}
                    />
                    {isOpen ? "Hide style guide" : "Style guide"}
                  </button>
                  {isOpen && (
                    <p className="mt-2 whitespace-pre-line rounded-lg border border-border bg-background/50 p-3 text-xs leading-relaxed text-muted-foreground">
                      {v.styleGuide}
                    </p>
                  )}
                </div>
              </div>

              {exs.length > 0 && (
                <div className="border-t border-border bg-background/30 px-4 py-3">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                    Example decks
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {exs.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setOpen(d)}
                        className="group w-40 shrink-0 overflow-hidden rounded-lg border border-border bg-card/60 text-left transition-colors hover:border-border/80"
                        title={`${d.title || "Untitled deck"} · ${d.slide_count} slides`}
                      >
                        <div className="aspect-video overflow-hidden bg-muted/40">
                          {covers[d.id] ? (
                            <img
                              src={covers[d.id]}
                              alt={d.title}
                              loading="lazy"
                              className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-muted-foreground">
                              <ImageOff className="size-4" />
                            </div>
                          )}
                        </div>
                        <p className="truncate px-2 py-1.5 text-[11px] font-medium text-muted-foreground">
                          {d.title || "Untitled deck"}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {open && <DeckViewer deck={open} onClose={() => setOpen(null)} />}
    </>
  );
}

/** Full-screen interactive viewer: rendered slides of one published deck + lightbox. */
function DeckViewer({ deck, onClose }: { deck: PublishedDeckRow; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [slides, setSlides] = useState<{ outlineId: string; slide: GeneratedSlide }[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const outline = deck.outline ?? [];
  const titleFor = (outlineId: string, i: number) =>
    outline.find((o) => o.id === outlineId)?.title ?? `Slide ${i + 1}`;

  useEffect(() => {
    setLoading(true);
    const full = publishedDecks().find((d) => d.id === deck.id);
    const hydrated = full
      ? full.outline
          .map((o) => ({ outlineId: o.id, slide: full.slides[o.id] }))
          .filter((s): s is { outlineId: string; slide: GeneratedSlide } => !!s.slide)
      : [];
    setSlides(hydrated);
    setLoading(false);
  }, [deck.id]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur">
      <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold tracking-tight">
            {deck.title || "Untitled deck"}
          </h2>
          <p className="truncate text-xs text-muted-foreground">
            {deck.mode} · {deck.slide_count} slides
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5">
          <X className="size-4" /> Close
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto w-full max-w-5xl">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading deck…
            </div>
          ) : slides.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">
              This deck has no rendered slides.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {slides.map(({ outlineId, slide: s }, i) => (
                <div
                  key={outlineId}
                  className="overflow-hidden rounded-xl border border-border bg-card/70"
                >
                  <div className="relative aspect-video bg-muted/40">
                    {s.dataUrl ? (
                      <button
                        type="button"
                        onClick={() => setLightbox(s.dataUrl!)}
                        className="block size-full"
                      >
                        <img
                          src={s.dataUrl}
                          alt={titleFor(outlineId, i)}
                          className="size-full object-cover"
                        />
                      </button>
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <ImageOff className="size-5" />
                      </div>
                    )}
                    <span className="absolute left-2.5 top-2.5 grid size-6 place-items-center rounded-md bg-background/70 text-[11px] font-medium tabular-nums backdrop-blur">
                      {i + 1}
                    </span>
                  </div>
                  <p className="truncate px-3.5 py-2.5 text-sm font-medium">
                    {titleFor(outlineId, i)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {lightbox && (
        <button
          type="button"
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-8"
        >
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
        </button>
      )}
    </div>
  );
}
