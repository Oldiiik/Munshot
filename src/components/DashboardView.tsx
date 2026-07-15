import { type FormEvent, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  ArrowSquareOut as ArrowUpRight,
  ChartBar as BarChart3,
  ClockCounterClockwise,
  FolderSimple,
  Funnel,
  List,
  MagnifyingGlass as Search,
  Plus,
  Sparkle as Sparkles,
  SquaresFour as Grid2X2,
} from "@phosphor-icons/react";

import type { Deck } from "@/types";
import { cn, deckTitle } from "@/lib/utils";

interface Props {
  decks: Deck[];
  onCreate: () => void;
  onCreateFromBrief: (brief: string) => void;
  onOpen: (id: string) => void;
  onOpenInsights: (id: string) => void;
}

type Layout = "grid" | "list";
type Filter = "all" | "active" | "ready";
const ease = [0.22, 1, 0.36, 1] as const;

function completed(deck: Deck) {
  return Object.values(deck.slides).filter((slide) => slide.status === "done").length;
}

function cover(deck: Deck) {
  for (const item of deck.outline) {
    const slide = deck.slides[item.id];
    if (slide?.dataUrl && slide.status === "done") return slide.dataUrl;
  }
  return null;
}

function updated(value: number) {
  const days = Math.floor((Date.now() - value) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(value);
}

export function DashboardView({ decks, onCreate, onCreateFromBrief, onOpen, onOpenInsights }: Props) {
  const [brief, setBrief] = useState("");
  const [query, setQuery] = useState("");
  const [layout, setLayout] = useState<Layout>("grid");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const date = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric" }).format(new Date());
  const recent = useMemo(() => [...decks].sort((a, b) => b.updatedAt - a.updatedAt), [decks]);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const matched = term ? recent.filter((deck) => `${deckTitle(deck)} ${deck.brief}`.toLowerCase().includes(term)) : recent;
    if (filter === "active") return matched.filter((deck) => completed(deck) < deck.slideCount);
    if (filter === "ready") return matched.filter((deck) => deck.slideCount > 0 && completed(deck) >= deck.slideCount);
    return matched;
  }, [filter, query, recent]);
  const selected = recent.find((deck) => deck.id === selectedId) ?? filtered[0] ?? recent[0] ?? null;
  const rendered = decks.reduce((sum, deck) => sum + completed(deck), 0);
  const entry = (delay = 0) => reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: .28, delay, ease } };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = brief.trim();
    if (!value) return;
    onCreateFromBrief(value);
    setBrief("");
  };

  return (
    <main className="ms-library h-full overflow-y-auto">
      <div className="ms-library-canvas">
        <motion.header className="ms-library-intro" {...entry()}>
          <div>
            <div className="ms-library-eyebrow">{date}</div>
            <h1>Library</h1>
            <p>A focused place for every deck, working thought, and visual direction in motion.</p>
          </div>
          <div className="ms-library-intro-actions"><label className="ms-library-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your decks" aria-label="Search your decks" /></label><button type="button" onClick={onCreate} className="ms-library-new"><Plus /> New deck</button></div>
        </motion.header>

        <motion.form className="ms-library-compose" onSubmit={submit} {...entry(.04)}>
          <Sparkles weight="duotone" />
          <label>
            <span>Create from a prompt</span>
            <input value={brief} onChange={(event) => setBrief(event.target.value)} placeholder="A decision, a launch, a story worth seeing clearly..." />
          </label>
          <button type="submit" disabled={!brief.trim()} aria-label="Create a deck from this brief"><ArrowRight /></button>
        </motion.form>

        <motion.section className="ms-library-workspace" {...entry(.09)}>
          <div className="ms-library-focus">
            <div className="ms-library-section-label"><span>Selected deck</span><i /> {selected ? updated(selected.updatedAt) : "New workspace"}</div>
            {selected ? <FeaturedDeck deck={selected} onOpen={onOpen} onOpenInsights={onOpenInsights} /> : <button type="button" className="ms-library-empty-focus" onClick={onCreate}><Plus /> Create your first deck</button>}
          </div>
          {selected && <LibraryInspector deck={selected} onOpen={onOpen} onOpenInsights={onOpenInsights} />}
        </motion.section>

        <section className="ms-library-index">
          <motion.div className="ms-library-index-head" {...entry(.14)}>
            <div><span>All decks</span><h2>{query ? "Search results" : "Everything in the library"}</h2></div>
            <div className="ms-library-index-tools"><div className="ms-library-filters" role="group" aria-label="Filter decks"><Funnel /><button type="button" className={filter === "all" ? "is-active" : ""} onClick={() => setFilter("all")}>All</button><button type="button" className={filter === "active" ? "is-active" : ""} onClick={() => setFilter("active")}>Active</button><button type="button" className={filter === "ready" ? "is-active" : ""} onClick={() => setFilter("ready")}>Ready</button></div><p>{rendered} slides rendered / {filtered.length} deck{filtered.length === 1 ? "" : "s"}</p><div role="group" aria-label="Library layout"><button type="button" className={layout === "grid" ? "is-active" : ""} onClick={() => setLayout("grid")} aria-label="Grid layout"><Grid2X2 /></button><button type="button" className={layout === "list" ? "is-active" : ""} onClick={() => setLayout("list")} aria-label="List layout"><List /></button></div></div>
          </motion.div>
          {filtered.length ? (
            <div className={`ms-library-items is-${layout}`}>
              <button type="button" className="ms-library-compose-tile" onClick={onCreate}><Plus /><span>Start with a blank page</span><small>Set the decision, then shape the story.</small></button>
              {filtered.map((deck, index) => <DeckCard key={deck.id} deck={deck} index={index} layout={layout} reduce={!!reduce} selected={deck.id === selected?.id} onPreview={setSelectedId} onOpen={onOpen} />)}
            </div>
          ) : <div className="ms-library-empty-results"><FolderSimple weight="duotone" /><div><strong>No {filter === "all" ? "matching" : filter} decks yet.</strong><p>Try another view, or start a new deck from a blank page.</p></div><button type="button" onClick={() => { setFilter("all"); setQuery(""); }}>Show all decks</button></div>}
        </section>
      </div>
    </main>
  );
}

function FeaturedDeck({ deck, onOpen, onOpenInsights }: { deck: Deck; onOpen: (id: string) => void; onOpenInsights: (id: string) => void }) {
  const image = cover(deck);
  const done = completed(deck);
  const progress = deck.slideCount ? Math.round(done / deck.slideCount * 100) : 0;
  return <article className="ms-library-feature">
    <button type="button" className="ms-library-feature-cover" onClick={() => onOpen(deck.id)}>{image ? <img src={image} alt="" /> : <span>{deckTitle(deck).slice(0, 1)}</span>}</button>
    <div className="ms-library-feature-copy"><span>Updated {updated(deck.updatedAt)}</span><h3>{deckTitle(deck)}</h3><p>{deck.brief || "The story is ready for its first clear decision."}</p><div><i><b style={{ transform: `scaleX(${progress / 100})` }} /></i><small>{done} of {deck.slideCount} slides ready</small></div></div>
    <div className="ms-library-feature-actions"><button type="button" onClick={() => onOpen(deck.id)}>Open deck <ArrowUpRight /></button><button type="button" onClick={() => onOpenInsights(deck.id)} aria-label={`View insights for ${deckTitle(deck)}`}><BarChart3 /> Insights</button></div>
  </article>;
}

function LibraryInspector({ deck, onOpen, onOpenInsights }: { deck: Deck; onOpen: (id: string) => void; onOpenInsights: (id: string) => void }) {
  const done = completed(deck);
  return <aside className="ms-library-inspector"><div><span>Deck details</span><strong>{deck.mode === "edu" ? "Learning deck" : "Presentation"}</strong></div><dl><div><dt>Slides</dt><dd>{done}/{deck.slideCount}</dd></div><div><dt>Updated</dt><dd><ClockCounterClockwise /> {updated(deck.updatedAt)}</dd></div></dl><div className="ms-library-inspector-actions"><button type="button" onClick={() => onOpen(deck.id)}>Open deck <ArrowUpRight /></button><button type="button" onClick={() => onOpenInsights(deck.id)}>Inspect run</button></div></aside>;
}

function DeckCard({ deck, index, layout, reduce, selected, onPreview, onOpen }: { deck: Deck; index: number; layout: Layout; reduce: boolean; selected: boolean; onPreview: (id: string) => void; onOpen: (id: string) => void }) {
  const image = cover(deck);
  const done = completed(deck);
  return <motion.button type="button" className={cn("ms-library-deck", selected && "is-selected")} onClick={() => onOpen(deck.id)} onMouseEnter={() => onPreview(deck.id)} onFocus={() => onPreview(deck.id)} initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .22, delay: reduce ? 0 : Math.min(index * .035, .2), ease }} whileTap={{ scale: .99 }}>
    <span className="ms-library-deck-image">{image ? <img src={image} alt="" /> : <i>{deckTitle(deck).slice(0, 1)}</i>}</span>
    <span className="ms-library-deck-copy"><strong>{deckTitle(deck)}</strong><small>{done}/{deck.slideCount} slides / {updated(deck.updatedAt)}</small></span>
    {layout === "list" && <ArrowUpRight />}
  </motion.button>;
}
