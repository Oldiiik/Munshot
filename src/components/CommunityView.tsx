import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  ArrowSquareOut,
  BookmarkSimple,
  ChatCenteredText,
  Check,
  Columns,
  Compass,
  CopySimple,
  DotsNine,
  Eye,
  Heart,
  ImageSquare,
  List,
  Palette,
  PaperPlaneTilt,
  SquaresFour,
  X,
} from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import { deckCover, publishedDecks } from "@/lib/demo";
import type { Deck, GeneratedSlide, OutlineSlide, Vibe } from "@/types";
import type { VibeStore } from "@/lib/vibes";

type CommunityTab = "work" | "vibes";
type CommunityFilter = "all" | "recent" | "saved";
type CommunityLayout = "single" | "pair" | "grid" | "compact";

interface CommunityReference {
  deckTitle: string;
  slideTitle?: string;
  vibe: Vibe | null;
}

interface PublishedDeckRow {
  id: string;
  title: string;
  mode: "moonshot" | "edu";
  slideCount: number;
  outline: OutlineSlide[];
  updatedAt: number;
  vibe: Vibe | null;
  brief: string;
}

interface CommunityComment {
  id: string;
  body: string;
  createdAt: number;
}

interface CommunityFeedback {
  liked: string[];
  saved: string[];
  comments: Record<string, CommunityComment[]>;
}

interface CuratedVibe {
  id: string;
  name: string;
  description: string;
  styleGuide: string;
  swatch: string[];
}

const FEEDBACK_KEY = "moonshot-demo:community-feedback";
const ease = [0.22, 1, 0.36, 1] as const;

const CURATED_VIBES: CuratedVibe[] = [
  {
    id: "curated:signal-room",
    name: "Signal Room",
    description: "Quiet systems, ultraviolet signal, precise visual hierarchy.",
    styleGuide: "Use a restrained dark systems language. Near-black fields, one ultraviolet signal color, fine hairline rules, and sparse diagrams with intentional negative space. Make every slide feel like a clear instrument panel, never a dashboard template.",
    swatch: ["#11121a", "#8c7cff", "#d7d6ff"],
  },
  {
    id: "curated:daylight-index",
    name: "Daylight Index",
    description: "Editorial white space with a warm red editorial mark.",
    styleGuide: "Build on clean white fields with precise black typography and one controlled vermilion accent. Use large editorial crops, fine rules, and generous margins. Each slide should feel collected and confident, like a contemporary design annual.",
    swatch: ["#f5f4f0", "#151515", "#e7472f"],
  },
  {
    id: "curated:after-hours",
    name: "After Hours",
    description: "Soft tungsten light, deep ink, and cinematic restraint.",
    styleGuide: "Use deep ink backgrounds, muted tungsten highlights, and cinematic photography. Keep typography quiet and generous. Let one image, one thought, or one number own each slide; no decorative gradients or dense panels.",
    swatch: ["#0d0d12", "#c6935b", "#ece1d0"],
  },
];

function toRow(deck: Deck): PublishedDeckRow {
  return {
    id: deck.id,
    title: deck.title || "Untitled deck",
    mode: deck.mode,
    slideCount: deck.slideCount,
    outline: deck.outline,
    updatedAt: deck.updatedAt,
    vibe: deck.vibe,
    brief: deck.brief,
  };
}

function initialFeedback(): CommunityFeedback {
  try {
    const parsed = JSON.parse(localStorage.getItem(FEEDBACK_KEY) ?? "{}") as Partial<CommunityFeedback>;
    return { liked: parsed.liked ?? [], saved: parsed.saved ?? [], comments: parsed.comments ?? {} };
  } catch {
    return { liked: [], saved: [], comments: {} };
  }
}

function baseLikes(id: string) {
  return [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 83 + 21;
}

function deckMeta(deck: PublishedDeckRow) {
  const mood = deck.vibe?.name ?? (deck.mode === "edu" ? "Learning direction" : "Presentation study");
  return `${deck.slideCount} slides / ${mood}`;
}

function relativeDate(value: number) {
  const days = Math.max(0, Math.floor((Date.now() - value) / 86_400_000));
  if (!days) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export function CommunityView({ vibes, onUseReference }: { vibes: VibeStore; onUseReference: (reference: CommunityReference) => void }) {
  const [tab, setTab] = useState<CommunityTab>("work");
  const [filter, setFilter] = useState<CommunityFilter>("all");
  const [layout, setLayout] = useState<CommunityLayout>("grid");
  const [query, setQuery] = useState("");
  const [decks, setDecks] = useState<PublishedDeckRow[]>([]);
  const [covers, setCovers] = useState<Record<string, string | undefined>>({});
  const [feedback, setFeedback] = useState<CommunityFeedback>(initialFeedback);
  const [open, setOpen] = useState<PublishedDeckRow | null>(null);
  const scrollRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const load = useCallback(() => {
    const published = publishedDecks();
    setDecks(published.map(toRow));
    setCovers(Object.fromEntries(published.map((deck) => [deck.id, deckCover(deck)])));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { localStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedback)); }, [feedback]);

  const displayed = useMemo(() => {
    const term = query.trim().toLowerCase();
    let list = term ? decks.filter((deck) => `${deck.title} ${deck.brief} ${deck.vibe?.name ?? ""}`.toLowerCase().includes(term)) : decks;
    if (filter === "recent") list = [...list].sort((a, b) => b.updatedAt - a.updatedAt);
    if (filter === "saved") list = list.filter((deck) => feedback.saved.includes(deck.id));
    return list;
  }, [decks, feedback.saved, filter, query]);

  const toggle = (kind: "liked" | "saved", id: string) => {
    setFeedback((current) => ({
      ...current,
      [kind]: current[kind].includes(id) ? current[kind].filter((value) => value !== id) : [...current[kind], id],
    }));
  };
  const addComment = (id: string, body: string) => {
    const comment = { id: crypto.randomUUID(), body, createdAt: Date.now() };
    setFeedback((current) => ({ ...current, comments: { ...current.comments, [id]: [...(current.comments[id] ?? []), comment] } }));
  };
  const changeTab = (next: CommunityTab) => {
    setTab(next);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 0, behavior: "auto" }));
  };
  const entry = (delay = 0) => reduce ? { initial: { opacity: 0 }, animate: { opacity: 1 } } : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.22, delay, ease } };
  const featured = displayed[0] ?? decks[0] ?? null;

  return (
    <main className="ms-community-view" ref={scrollRef}>
      <div className="ms-community-shell">
        <motion.header className="ms-community-hero" {...entry()}>
          <div className="ms-community-hero-copy">
            <span className="ms-community-kicker"><Compass weight="duotone" /> Moonshot community</span>
            <h1>Good decks deserve a room.</h1>
            <p>Publish the work, trade visual directions, and keep the presentations that make you look twice.</p>
          </div>
        </motion.header>

        <motion.nav className="ms-community-nav" aria-label="Community views" {...entry(0.04)}>
          <div role="tablist" aria-label="Community content">
            <button type="button" role="tab" aria-selected={tab === "work"} className={tab === "work" ? "is-active" : ""} onClick={() => changeTab("work")}><Compass /> Work</button>
            <button type="button" role="tab" aria-selected={tab === "vibes"} className={tab === "vibes" ? "is-active" : ""} onClick={() => changeTab("vibes")}><Palette /> Vibe lab</button>
          </div>
          {tab === "work" && <label className="ms-community-search"><span>Find a deck</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search themes, titles, directions" /></label>}
        </motion.nav>

        <AnimatePresence mode="wait" initial={false}>
          {tab === "work" ? (
            <motion.section key="work" className="ms-community-work" {...entry(0.06)}>
              {featured && <FeatureDeck deck={featured} cover={covers[featured.id]} feedback={feedback} onOpen={setOpen} onToggle={toggle} onUseReference={onUseReference} />}
              <CommunityCollections onPick={(term) => { setQuery(term); setFilter("all"); }} />
              <div className="ms-community-toolbar">
                <div><span>Browse the wall</span><h2>{query ? "Matches for your search" : "Public work"}</h2></div>
                <div className="ms-community-toolbar-controls"><div className="ms-community-filters" role="group" aria-label="Filter community work">{(["all", "recent", "saved"] as const).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={filter === item ? "is-active" : ""}>{item}</button>)}</div><div className="ms-community-layout-controls" role="group" aria-label="Change gallery layout"><button type="button" className={layout === "single" ? "is-active" : ""} onClick={() => setLayout("single")} aria-label="Single-column view" title="Single-column view"><List /></button><button type="button" className={layout === "pair" ? "is-active" : ""} onClick={() => setLayout("pair")} aria-label="Two-column view" title="Two-column view"><Columns /></button><button type="button" className={layout === "grid" ? "is-active" : ""} onClick={() => setLayout("grid")} aria-label="Three-column view" title="Three-column view"><SquaresFour /></button><button type="button" className={layout === "compact" ? "is-active" : ""} onClick={() => setLayout("compact")} aria-label="Compact view" title="Compact view"><DotsNine /></button></div></div>
              </div>
              {displayed.length ? <div className={cn("ms-community-gallery", `is-${layout}`)}>{displayed.map((deck, index) => <DeckTile key={deck.id} deck={deck} index={index} cover={covers[deck.id]} feedback={feedback} onOpen={setOpen} onToggle={toggle} />)}</div> : <EmptyWall onClear={() => { setQuery(""); setFilter("all"); }} />}
            </motion.section>
          ) : <motion.section key="vibes" className="ms-community-vibes" {...entry(0.06)}><VibeLab vibes={vibes} decks={decks} covers={covers} /></motion.section>}
        </AnimatePresence>
      </div>
      {open && <DeckViewer deck={open} cover={covers[open.id]} feedback={feedback} onClose={() => setOpen(null)} onToggle={toggle} onComment={addComment} onUseReference={onUseReference} />}
    </main>
  );
}

function CommunityCollections({ onPick }: { onPick: (term: string) => void }) {
  const collections = [
    { title: "Product narratives", detail: "Launches, product stories, and sharp systems thinking.", term: "product" },
    { title: "Future-facing", detail: "AI, emerging interfaces, and strong points of view.", term: "AI" },
    { title: "Teaching clarity", detail: "Lessons that make difficult ideas land quickly.", term: "learn" },
  ];
  return <section className="ms-community-collections"><div><span>Collections</span><p>Start somewhere with a point of view.</p></div><div>{collections.map((collection) => <button type="button" key={collection.title} onClick={() => onPick(collection.term)}><strong>{collection.title}</strong><small>{collection.detail}</small><ArrowRight /></button>)}</div></section>;
}

function FeatureDeck({ deck, cover, feedback, onOpen, onToggle, onUseReference }: { deck: PublishedDeckRow; cover?: string; feedback: CommunityFeedback; onOpen: (deck: PublishedDeckRow) => void; onToggle: (kind: "liked" | "saved", id: string) => void; onUseReference: (reference: CommunityReference) => void }) {
  const liked = feedback.liked.includes(deck.id);
  const saved = feedback.saved.includes(deck.id);
  return <article className="ms-community-feature">
    <button className="ms-community-feature-cover" type="button" onClick={() => onOpen(deck)}>{cover ? <img src={cover} alt={`Open ${deck.title}`} /> : <span>{deck.title.slice(0, 1)}</span>}<i><Eye /> Study deck</i></button>
    <div className="ms-community-feature-copy"><span>Selected from the wall</span><h2>{deck.title}</h2><p>{deck.brief || "A public presentation worth studying slide by slide."}</p><div className="ms-community-feature-meta"><span>{deckMeta(deck)}</span><span>Updated {relativeDate(deck.updatedAt)}</span></div><div className="ms-community-feature-actions"><button type="button" onClick={() => onOpen(deck)}>Open presentation <ArrowSquareOut /></button><button type="button" className="ms-community-reference-button" onClick={() => onUseReference({ deckTitle: deck.title, vibe: deck.vibe })}><CopySimple /> Use as reference</button><ReactionButton icon={Heart} label="Like" count={baseLikes(deck.id) + Number(liked)} active={liked} onClick={() => onToggle("liked", deck.id)} /><ReactionButton icon={BookmarkSimple} label="Save" active={saved} onClick={() => onToggle("saved", deck.id)} /></div></div>
  </article>;
}

function DeckTile({ deck, index, cover, feedback, onOpen, onToggle }: { deck: PublishedDeckRow; index: number; cover?: string; feedback: CommunityFeedback; onOpen: (deck: PublishedDeckRow) => void; onToggle: (kind: "liked" | "saved", id: string) => void }) {
  const liked = feedback.liked.includes(deck.id);
  const saved = feedback.saved.includes(deck.id);
  return <motion.article className="ms-community-deck" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: Math.min(index * 0.025, 0.16), ease }}>
    <button type="button" className="ms-community-deck-cover" onClick={() => onOpen(deck)}>{cover ? <img src={cover} alt={`Open ${deck.title}`} loading="lazy" /> : <ImageSquare />}<span>{deck.vibe?.name ?? (deck.mode === "edu" ? "Learning" : "Story")}</span></button>
    <div className="ms-community-deck-copy"><button type="button" onClick={() => onOpen(deck)}><strong>{deck.title}</strong><small>{deckMeta(deck)}</small></button><div><ReactionButton icon={Heart} label="Like" count={baseLikes(deck.id) + Number(liked)} active={liked} onClick={() => onToggle("liked", deck.id)} /><ReactionButton icon={ChatCenteredText} label="Comments" count={(feedback.comments[deck.id] ?? []).length} onClick={() => onOpen(deck)} /><ReactionButton icon={BookmarkSimple} label="Save" active={saved} onClick={() => onToggle("saved", deck.id)} /></div></div>
  </motion.article>;
}

function ReactionButton({ icon: Icon, label, count, active, onClick }: { icon: typeof Heart; label: string; count?: number; active?: boolean; onClick: () => void }) {
  return <button type="button" className={cn("ms-community-reaction", active && "is-active")} onClick={onClick} aria-label={label} aria-pressed={active}><Icon weight={active ? "fill" : "regular"} />{count !== undefined && <span>{count}</span>}</button>;
}

function EmptyWall({ onClear }: { onClear: () => void }) {
  return <div className="ms-community-empty"><Compass weight="duotone" /><div><strong>Nothing is pinned here yet.</strong><p>Try another search or return to the complete public wall.</p></div><button type="button" onClick={onClear}>Show all work</button></div>;
}

function VibeLab({ vibes, decks, covers }: { vibes: VibeStore; decks: PublishedDeckRow[]; covers: Record<string, string | undefined> }) {
  const [notice, setNotice] = useState("");
  const catalog = [...CURATED_VIBES, ...vibes.vibes.filter((item) => !CURATED_VIBES.some((vibe) => vibe.name === item.name))];
  const addVibe = async (vibe: CuratedVibe | Vibe) => {
    const exists = vibes.vibes.some((item) => item.name === vibe.name);
    if (!exists) await vibes.createVibe({ name: vibe.name, description: vibe.description, styleGuide: vibe.styleGuide, swatch: vibe.swatch });
    setNotice(exists ? `${vibe.name} is already in your composer.` : `${vibe.name} is now ready in your composer.`);
  };
  return <>
    <header className="ms-vibe-lab-head"><div><span>Vibe lab</span><h2>Directions, not templates.</h2><p>Collect a visual language, make it yours, then call it up from the Vibe control while you compose a deck.</p></div></header>
    {notice && <div className="ms-vibe-lab-notice"><Check /> {notice}</div>}
    <div className="ms-vibe-catalog">{catalog.map((vibe, index) => { const example = decks.find((deck) => deck.vibe?.id === vibe.id) ?? decks[index % Math.max(decks.length, 1)]; const exists = vibes.vibes.some((item) => item.name === vibe.name); return <article key={vibe.id} className="ms-vibe-card"><div className="ms-vibe-card-stage" style={{ "--vibe-one": vibe.swatch?.[0] ?? "#15161f", "--vibe-two": vibe.swatch?.[1] ?? "#c7b7ff", "--vibe-three": vibe.swatch?.[2] ?? "#f5f5f5" } as React.CSSProperties}>{example && covers[example.id] ? <img src={covers[example.id]} alt="" loading="lazy" /> : <Palette weight="duotone" />}<span>{exists ? "In your library" : "Community direction"}</span></div><div className="ms-vibe-card-copy"><div className="ms-vibe-swatch">{(vibe.swatch ?? []).slice(0, 4).map((color) => <i key={color} style={{ backgroundColor: color }} />)}</div><h3>{vibe.name}</h3><p>{vibe.description}</p><button type="button" onClick={() => void addVibe(vibe)}>{exists ? "Available in composer" : "Add to my vibes"} <ArrowRight /></button></div></article>; })}</div>
  </>;
}

function DeckViewer({ deck, cover, feedback, onClose, onToggle, onComment, onUseReference }: { deck: PublishedDeckRow; cover?: string; feedback: CommunityFeedback; onClose: () => void; onToggle: (kind: "liked" | "saved", id: string) => void; onComment: (id: string, body: string) => void; onUseReference: (reference: CommunityReference) => void }) {
  const [slides, setSlides] = useState<{ outlineId: string; slide: GeneratedSlide }[]>([]);
  const [comment, setComment] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const liked = feedback.liked.includes(deck.id);
  const saved = feedback.saved.includes(deck.id);
  useEffect(() => { const full = publishedDecks().find((item) => item.id === deck.id); setSlides(full ? full.outline.map((outline) => ({ outlineId: outline.id, slide: full.slides[outline.id] })).filter((item): item is { outlineId: string; slide: GeneratedSlide } => Boolean(item.slide)) : []); }, [deck.id]);
  const submit = (event: FormEvent) => { event.preventDefault(); const body = comment.trim(); if (!body) return; onComment(deck.id, body); setComment(""); };
  return createPortal(<div className="ms-community-viewer" role="dialog" aria-modal="true" aria-label={`View ${deck.title}`}><header><button type="button" onClick={onClose} aria-label="Close presentation"><X /></button><div><span>Public presentation</span><h2>{deck.title}</h2></div><div className="ms-community-viewer-actions"><button type="button" className="ms-community-reference-button" onClick={() => onUseReference({ deckTitle: deck.title, vibe: deck.vibe })}><CopySimple /> Use deck</button><ReactionButton icon={Heart} label="Like" active={liked} count={baseLikes(deck.id) + Number(liked)} onClick={() => onToggle("liked", deck.id)} /><ReactionButton icon={BookmarkSimple} label="Save" active={saved} onClick={() => onToggle("saved", deck.id)} /></div></header><div className="ms-community-viewer-grid"><section className="ms-community-slides">{slides.length ? slides.map(({ outlineId, slide }, index) => <article key={outlineId}><div>{slide.dataUrl ? <button type="button" onClick={() => setLightbox(slide.dataUrl!)}><img src={slide.dataUrl} alt={deck.outline[index]?.title ?? `Slide ${index + 1}`} /></button> : (cover ? <img src={cover} alt="" /> : <ImageSquare />)}<span>{String(index + 1).padStart(2, "0")}</span><button type="button" className="ms-community-slide-reference" onClick={() => onUseReference({ deckTitle: deck.title, slideTitle: deck.outline[index]?.title ?? `Slide ${index + 1}`, vibe: deck.vibe })}><CopySimple /> Use slide</button></div><p>{deck.outline[index]?.title ?? `Slide ${index + 1}`}</p></article>) : <EmptyWall onClear={onClose} />}</section><aside className="ms-community-discussion"><div><span>Discussion</span><strong>Leave a useful note.</strong><p>Call out a decision, a detail, or a slide you would reuse.</p></div><div className="ms-community-comment-list">{(feedback.comments[deck.id] ?? []).length ? feedback.comments[deck.id].map((item) => <article key={item.id}><i>You</i><p>{item.body}</p><small>{relativeDate(item.createdAt)}</small></article>) : <p className="ms-community-no-comments">Start the conversation around this deck.</p>}</div><form onSubmit={submit}><textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Write a thoughtful note..." /><button type="submit" disabled={!comment.trim()} aria-label="Post comment"><PaperPlaneTilt /></button></form></aside></div>{lightbox && <button type="button" className="ms-community-lightbox" onClick={() => setLightbox(null)}><img src={lightbox} alt="" /></button>}</div>, document.body);
}
