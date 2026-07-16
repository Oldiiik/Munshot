import { type CSSProperties, type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  BookmarkSimple,
  CaretDown,
  ChatCenteredText,
  Check,
  CopySimple,
  Eye,
  Heart,
  ImageSquare,
  MagnifyingGlass,
  PaperPlaneTilt,
  X,
} from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import { deckCover, publishedDecks } from "@/lib/demo";
import type { Deck, GeneratedSlide, OutlineSlide, Vibe } from "@/types";
import type { VibeStore } from "@/lib/vibes";

type CommunityTab = "presentations" | "directions" | "saved";
type CommunityCategory = "All" | "Product" | "Pitch" | "Education" | "Research" | "Editorial";
type CommunitySort = "trending" | "recent";

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

interface CommunityDirection {
  id: string;
  name: string;
  description: string;
  styleGuide: string;
  swatch: string[];
}

const FEEDBACK_KEY = "moonshot-demo:community-feedback";
const CATEGORIES: CommunityCategory[] = ["All", "Product", "Pitch", "Education", "Research", "Editorial"];
const CREATORS = [
  { name: "Nadia Park", handle: "@nadiapark" },
  { name: "Studio Dense", handle: "@studiodense" },
  { name: "Maks Levin", handle: "@makslevin" },
  { name: "Field Office", handle: "@fieldoffice" },
  { name: "Rin Sato", handle: "@rinsato" },
];

const CURATED_DIRECTIONS: CommunityDirection[] = [
  {
    id: "curated:signal-room",
    name: "Signal Room",
    description: "Near-black fields, one ultraviolet signal, and hard information hierarchy.",
    styleGuide: "Use a restrained dark systems language with one signal color, fine rules, and sparse diagrams. Keep every slide precise and calm.",
    swatch: ["#101114", "#6f62d9", "#e9e8f5"],
  },
  {
    id: "curated:daylight-index",
    name: "Daylight Index",
    description: "White editorial space, carbon typography, and one vermilion mark.",
    styleGuide: "Build on white fields with precise black typography and one controlled vermilion accent. Use large crops, fine rules, and generous margins.",
    swatch: ["#f1f0eb", "#151515", "#e44832"],
  },
  {
    id: "curated:archive-01",
    name: "Archive 01",
    description: "Swiss grid discipline with utilitarian captions and documentary crops.",
    styleGuide: "Use a strict modular grid, documentary images, compact captions, and confident grotesque type. Avoid decorative surfaces and soft gradients.",
    swatch: ["#deddd6", "#111111", "#ff5a45"],
  },
  {
    id: "curated:after-hours",
    name: "After Hours",
    description: "Deep ink, muted tungsten light, and cinematic image pacing.",
    styleGuide: "Use deep ink backgrounds, muted tungsten highlights, quiet typography, and one image or thought per slide.",
    swatch: ["#0d0d10", "#b88957", "#e8dfd2"],
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

function creatorFor(id: string) {
  const index = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % CREATORS.length;
  return CREATORS[index];
}

function categoryFor(deck: PublishedDeckRow): CommunityCategory {
  const signal = `${deck.title} ${deck.brief} ${deck.vibe?.name ?? ""}`.toLowerCase();
  if (deck.mode === "edu" || /learn|lesson|teach|education/.test(signal)) return "Education";
  if (/research|report|data|study|analysis/.test(signal)) return "Research";
  if (/pitch|launch|keynote|sales/.test(signal)) return "Pitch";
  if (/editorial|portfolio|culture|story/.test(signal)) return "Editorial";
  return "Product";
}

function relativeDate(value: number) {
  const days = Math.max(0, Math.floor((Date.now() - value) / 86_400_000));
  if (!days) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(value);
}

export function CommunityView({ vibes, onUseReference }: { vibes: VibeStore; onUseReference: (reference: CommunityReference) => void }) {
  const [tab, setTab] = useState<CommunityTab>("presentations");
  const [category, setCategory] = useState<CommunityCategory>("All");
  const [sort, setSort] = useState<CommunitySort>("trending");
  const [query, setQuery] = useState("");
  const [decks, setDecks] = useState<PublishedDeckRow[]>([]);
  const [covers, setCovers] = useState<Record<string, string | undefined>>({});
  const [feedback, setFeedback] = useState<CommunityFeedback>(initialFeedback);
  const [open, setOpen] = useState<PublishedDeckRow | null>(null);
  const scrollRef = useRef<HTMLElement>(null);

  const load = useCallback(() => {
    const published = publishedDecks();
    setDecks(published.map(toRow));
    setCovers(Object.fromEntries(published.map((deck) => [deck.id, deckCover(deck)])));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { localStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedback)); }, [feedback]);

  const displayed = useMemo(() => {
    const term = query.trim().toLowerCase();
    let list = decks.filter((deck) => {
      const matchesQuery = !term || `${deck.title} ${deck.brief} ${deck.vibe?.name ?? ""} ${creatorFor(deck.id).name}`.toLowerCase().includes(term);
      const matchesCategory = category === "All" || categoryFor(deck) === category;
      const matchesSaved = tab !== "saved" || feedback.saved.includes(deck.id);
      return matchesQuery && matchesCategory && matchesSaved;
    });
    list = [...list].sort((left, right) => sort === "recent" ? right.updatedAt - left.updatedAt : baseLikes(right.id) - baseLikes(left.id));
    return list;
  }, [category, decks, feedback.saved, query, sort, tab]);

  const directions = useMemo(() => {
    const personal: CommunityDirection[] = vibes.vibes
      .filter((item) => !CURATED_DIRECTIONS.some((direction) => direction.name === item.name))
      .map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        styleGuide: item.styleGuide,
        swatch: item.swatch?.length ? item.swatch : ["#101114", "#ff5a45", "#f0f0ed"],
      }));
    const merged: CommunityDirection[] = [...CURATED_DIRECTIONS, ...personal];
    const term = query.trim().toLowerCase();
    return term ? merged.filter((direction) => `${direction.name} ${direction.description}`.toLowerCase().includes(term)) : merged;
  }, [query, vibes.vibes]);

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
    setCategory("All");
    setQuery("");
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 0, behavior: "auto" }));
  };

  const isDirections = tab === "directions";
  const resultCount = isDirections ? directions.length : displayed.length;

  return (
    <main className="ms-community-v3" ref={scrollRef}>
      <header className="ms-community-v3-head">
        <div><h1>Community</h1><p>Explore presentation systems and brand directions made by the Moonshot community.</p></div>
      </header>

      <section className="ms-community-v3-command" aria-label="Community browser controls">
        <div role="tablist" aria-label="Resource type">
          <button type="button" role="tab" aria-selected={tab === "presentations"} className={tab === "presentations" ? "is-active" : ""} onClick={() => changeTab("presentations")}>Presentations</button>
          <button type="button" role="tab" aria-selected={tab === "directions"} className={tab === "directions" ? "is-active" : ""} onClick={() => changeTab("directions")}>Directions</button>
          <button type="button" role="tab" aria-selected={tab === "saved"} className={tab === "saved" ? "is-active" : ""} onClick={() => changeTab("saved")}>Saved <sup>{feedback.saved.length}</sup></button>
        </div>
        <label className="ms-community-v3-search"><MagnifyingGlass /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isDirections ? "Search directions" : "Search community"} aria-label="Search community" /></label>
        {!isDirections && <label className="ms-community-v3-sort">Sort<select value={sort} onChange={(event) => setSort(event.target.value as CommunitySort)}><option value="trending">Trending</option><option value="recent">Most recent</option></select><CaretDown /></label>}
      </section>

      <div className={cn("ms-community-v3-browser", isDirections && "is-directions")}>
        {!isDirections && <nav className="ms-community-v3-filters" aria-label="Community topics">
          <span>Topics</span>
          {CATEGORIES.map((item) => <button type="button" key={item} className={category === item ? "is-active" : ""} onClick={() => setCategory(item)}><span>{item}</span><i>{decks.filter((deck) => item === "All" || categoryFor(deck) === item).length}</i></button>)}
        </nav>}

        <section className="ms-community-v3-results">
          <header><div><h2>{isDirections ? "Brand directions" : tab === "saved" ? "Saved resources" : category === "All" ? "Featured presentations" : `${category} presentations`}</h2><p>{isDirections ? "Reusable visual systems ready for your next deck." : tab === "saved" ? "Everything you bookmarked, in one place." : "Open a deck to inspect its slides, narrative, and visual direction."}</p></div><output>{resultCount} results</output></header>

          {isDirections ? (
            <DirectionGrid directions={directions} vibes={vibes} />
          ) : displayed.length ? (
            <div className="ms-community-v3-grid">{displayed.map((deck) => <PresentationResource key={deck.id} deck={deck} cover={covers[deck.id]} feedback={feedback} onOpen={setOpen} onToggle={toggle} />)}</div>
          ) : (
            <div className="ms-community-v3-empty"><strong>{tab === "saved" ? "Nothing saved yet." : "No resources found."}</strong><p>{tab === "saved" ? "Bookmark a presentation and it will appear here." : "Clear the search or switch topics."}</p><button type="button" onClick={() => { setQuery(""); setCategory("All"); setTab("presentations"); }}>Explore presentations</button></div>
          )}
        </section>
      </div>

      {open && <ResourceDrawer deck={open} cover={covers[open.id]} feedback={feedback} onClose={() => setOpen(null)} onToggle={toggle} onComment={addComment} onUseReference={onUseReference} />}
    </main>
  );
}

function PresentationResource({ deck, cover, feedback, onOpen, onToggle }: { deck: PublishedDeckRow; cover?: string; feedback: CommunityFeedback; onOpen: (deck: PublishedDeckRow) => void; onToggle: (kind: "liked" | "saved", id: string) => void }) {
  const creator = creatorFor(deck.id);
  const saved = feedback.saved.includes(deck.id);
  const initials = creator.name.split(" ").map((part) => part[0]).join("").slice(0, 2);
  return (
    <article className="ms-community-v3-resource">
      <button type="button" className="ms-community-v3-cover" onClick={() => onOpen(deck)}>{cover ? <img src={cover} alt={`Open ${deck.title}`} loading="lazy" /> : <ImageSquare />}<span>{categoryFor(deck)}</span><i><Eye /> Open</i></button>
      <div className="ms-community-v3-resource-copy">
        <span className="ms-community-v3-avatar" aria-hidden="true">{initials}</span>
        <button type="button" onClick={() => onOpen(deck)}><strong>{deck.title}</strong><small>{creator.name} <i>{creator.handle}</i></small></button>
        <button type="button" className={saved ? "is-active" : ""} onClick={() => onToggle("saved", deck.id)} aria-label={saved ? "Remove from saved" : "Save presentation"} aria-pressed={saved}><BookmarkSimple weight={saved ? "fill" : "regular"} /></button>
      </div>
      <footer><span>{deck.slideCount} slides</span><span><Heart /> {baseLikes(deck.id) + Number(feedback.liked.includes(deck.id))}</span><span><ChatCenteredText /> {(feedback.comments[deck.id] ?? []).length}</span></footer>
    </article>
  );
}

function DirectionGrid({ directions, vibes }: { directions: CommunityDirection[]; vibes: VibeStore }) {
  const [notice, setNotice] = useState("");
  const add = (direction: CommunityDirection) => {
    const exists = vibes.vibes.some((item) => item.name === direction.name);
    if (!exists) vibes.createVibe({ name: direction.name, description: direction.description, styleGuide: direction.styleGuide, swatch: direction.swatch });
    setNotice(exists ? `${direction.name} is already in Brand.` : `${direction.name} added to Brand.`);
  };
  return <><div className={cn("ms-community-v3-notice", !notice && "is-empty")}>{notice && <><Check /> {notice}</>}</div><div className="ms-community-v3-direction-grid">{directions.map((direction) => { const exists = vibes.vibes.some((item) => item.name === direction.name); return <article key={direction.id} className="ms-community-v3-direction"><div className="ms-community-v3-direction-stage" style={{ "--one": direction.swatch[0], "--two": direction.swatch[1], "--three": direction.swatch[2] } as CSSProperties}><strong>{direction.name}</strong><i /><i /><i /></div><div><span>{exists ? "In your Brand library" : "Community direction"}</span><h3>{direction.name}</h3><p>{direction.description}</p><button type="button" onClick={() => add(direction)}>{exists ? "Added" : "Add direction"}<ArrowRight /></button></div></article>; })}</div></>;
}

function ResourceDrawer({ deck, cover, feedback, onClose, onToggle, onComment, onUseReference }: { deck: PublishedDeckRow; cover?: string; feedback: CommunityFeedback; onClose: () => void; onToggle: (kind: "liked" | "saved", id: string) => void; onComment: (id: string, body: string) => void; onUseReference: (reference: CommunityReference) => void }) {
  const [slides, setSlides] = useState<{ outlineId: string; slide: GeneratedSlide }[]>([]);
  const [comment, setComment] = useState("");
  const liked = feedback.liked.includes(deck.id);
  const saved = feedback.saved.includes(deck.id);
  const creator = creatorFor(deck.id);

  useEffect(() => {
    const full = publishedDecks().find((item) => item.id === deck.id);
    setSlides(full ? full.outline.map((outline) => ({ outlineId: outline.id, slide: full.slides[outline.id] })).filter((item): item is { outlineId: string; slide: GeneratedSlide } => Boolean(item.slide)) : []);
  }, [deck.id]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const body = comment.trim();
    if (!body) return;
    onComment(deck.id, body);
    setComment("");
  };

  return createPortal(
    <div className="ms-community-v3-drawer-wrap">
      <button type="button" className="ms-community-v3-backdrop" onClick={onClose} aria-label="Close presentation details" />
      <aside className="ms-community-v3-drawer" role="dialog" aria-modal="true" aria-label={`${deck.title} details`}>
        <header><div><span>{categoryFor(deck)} · {deck.slideCount} slides</span><strong>Community resource</strong></div><button type="button" onClick={onClose} aria-label="Close"><X /></button></header>
        <div className="ms-community-v3-drawer-scroll">
          <div className="ms-community-v3-drawer-cover">{cover ? <img src={cover} alt={deck.title} /> : <ImageSquare />}</div>
          <section className="ms-community-v3-drawer-title"><span>{creator.handle} / Updated {relativeDate(deck.updatedAt)}</span><h2>{deck.title}</h2><p>{deck.brief || "A public presentation system ready to inspect, save, and reuse."}</p></section>
          <div className="ms-community-v3-drawer-actions"><button type="button" onClick={() => onUseReference({ deckTitle: deck.title, vibe: deck.vibe })}><CopySimple /> Use presentation</button><button type="button" className={liked ? "is-active" : ""} onClick={() => onToggle("liked", deck.id)}><Heart weight={liked ? "fill" : "regular"} /> {baseLikes(deck.id) + Number(liked)}</button><button type="button" className={saved ? "is-active" : ""} onClick={() => onToggle("saved", deck.id)}><BookmarkSimple weight={saved ? "fill" : "regular"} /> {saved ? "Saved" : "Save"}</button></div>
          <section className="ms-community-v3-slides"><header><h3>Slides</h3><span>{slides.length || deck.slideCount}</span></header><div>{slides.length ? slides.map(({ outlineId, slide }, index) => <article key={outlineId}><div>{slide.dataUrl ? <img src={slide.dataUrl} alt={deck.outline[index]?.title ?? `Slide ${index + 1}`} /> : (cover ? <img src={cover} alt="" /> : <ImageSquare />)}<button type="button" onClick={() => onUseReference({ deckTitle: deck.title, slideTitle: deck.outline[index]?.title ?? `Slide ${index + 1}`, vibe: deck.vibe })}><CopySimple /> Use slide</button></div><p><span>{index + 1}</span>{deck.outline[index]?.title ?? `Slide ${index + 1}`}</p></article>) : <p className="ms-community-v3-no-slides">Slide previews are still being rendered.</p>}</div></section>
          <section className="ms-community-v3-comments"><header><h3>Discussion</h3><span>{(feedback.comments[deck.id] ?? []).length}</span></header><div>{(feedback.comments[deck.id] ?? []).length ? feedback.comments[deck.id].map((item) => <article key={item.id}><strong>You</strong><p>{item.body}</p><small>{relativeDate(item.createdAt)}</small></article>) : <p>No comments yet. Leave a specific note about the narrative or visual system.</p>}</div><form onSubmit={submit}><textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Write a useful note" aria-label="Comment" /><button type="submit" disabled={!comment.trim()} aria-label="Post comment"><PaperPlaneTilt /></button></form></section>
        </div>
      </aside>
    </div>,
    document.body
  );
}
