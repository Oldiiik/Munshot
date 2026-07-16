import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowSquareOut as ArrowUpRight,
  ChartBar as BarChart3,
  ClockCounterClockwise,
  FolderSimple,
  GridFour as Grid2X2,
  List,
  MagnifyingGlass as Search,
  Plus,
} from "@phosphor-icons/react";

import type { Deck } from "@/types";
import { deckTitle } from "@/lib/utils";

interface Props {
  decks: Deck[];
  onCreate: () => void;
  onCreateFromBrief: (brief: string) => void;
  onOpen: (id: string) => void;
  onOpenInsights: (id: string) => void;
}

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

function phase(deck: Deck) {
  if (deck.phase === "brief" || deck.phase === "outline") return "Story";
  return completed(deck) >= deck.slideCount && deck.slideCount > 0 ? "Review" : "Design";
}

const createPaths = [
  { icon: Plus, title: "Blank deck", note: "Start with a clear frame" },
  { icon: List, title: "From brief", note: "Build the narrative first", brief: true },
  { icon: FolderSimple, title: "Import deck", note: "Bring in existing material" },
  { icon: Grid2X2, title: "Templates", note: "Begin from an approved system" },
  { icon: BarChart3, title: "From data", note: "Turn evidence into a story" },
];

export function DashboardView({ decks, onCreate, onCreateFromBrief, onOpen, onOpenInsights }: Props) {
  const [query, setQuery] = useState("");
  const reduce = useReducedMotion();
  const recent = useMemo(() => [...decks].sort((a, b) => b.updatedAt - a.updatedAt), [decks]);
  const projects = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? recent.filter((deck) => `${deckTitle(deck)} ${deck.brief}`.toLowerCase().includes(term)) : recent;
  }, [query, recent]);
  const entry = (delay = 0) => reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.18, delay, ease } };

  return (
    <main className="ms-library ms-home h-full overflow-y-auto">
      <div className="ms-home-canvas">
        <motion.header className="ms-home-head" {...entry()}>
          <div>
            <h1>Presentations</h1>
            <p>Create, continue, and review every deck moving through your workspace.</p>
          </div>
          <div className="ms-home-head-actions">
            <label className="ms-home-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects" aria-label="Search projects" /></label>
            <button type="button" className="ms-home-new" onClick={onCreate}><Plus /> New presentation</button>
          </div>
        </motion.header>

        <motion.section className="ms-home-create" aria-label="Create a presentation" {...entry(.05)}>
          <div className="ms-home-create-head"><span>New presentation</span><p>Choose a starting point.</p></div>
          <div className="ms-home-create-strip">
            {createPaths.map(({ icon: Icon, title, note, brief }) => (
              <button key={title} type="button" onClick={() => brief ? onCreateFromBrief("") : onCreate()}>
                <Icon weight="regular" /><strong>{title}</strong><small>{note}</small><ArrowUpRight />
              </button>
            ))}
          </div>
        </motion.section>

        <div className="ms-home-workspace">
          <motion.section className="ms-home-projects" {...entry(.1)}>
            <div className="ms-home-section-head"><div><h2>{query ? "Project results" : "Recent projects"}</h2></div><p>{projects.length} project{projects.length === 1 ? "" : "s"}</p></div>
            {projects.length ? (
              <div className="ms-home-project-grid">
                {projects.map((deck, index) => <ProjectCard key={deck.id} deck={deck} index={index} reduce={!!reduce} onOpen={onOpen} />)}
              </div>
            ) : (
              <button type="button" className="ms-home-empty" onClick={onCreate}><Plus /><span>No matching projects</span><small>Start a new presentation or change your search.</small></button>
            )}

            <div className="ms-home-spaces">
              <div className="ms-home-section-head"><div><span>Project spaces</span><h2>Where the work lives</h2></div></div>
              <div className="ms-home-space-list">
                <Space name="Personal" note="Your active presentations" count={recent.length} />
                <Space name="Client work" note="Shared decks and approvals" count={Math.max(0, recent.length - 1)} />
                <Space name="Archived" note="Finished work, kept close" count={0} />
              </div>
            </div>
          </motion.section>

          <motion.aside className="ms-home-review" {...entry(.15)}>
            <div className="ms-home-section-head"><div><span>Review activity</span><h2>Needs attention</h2></div><button type="button" aria-label="Open insights"><BarChart3 /></button></div>
            <div className="ms-home-review-list">
              {recent.slice(0, 4).map((deck, index) => <ReviewItem key={deck.id} deck={deck} index={index} onOpenInsights={onOpenInsights} />)}
              {!recent.length && <div className="ms-home-review-empty"><ClockCounterClockwise /><p>Review signals appear as projects move from story to delivery.</p></div>}
            </div>
            <button type="button" className="ms-home-review-all" onClick={() => recent[0] && onOpenInsights(recent[0].id)}>Open review queue <ArrowUpRight /></button>
          </motion.aside>
        </div>
      </div>
    </main>
  );
}

function ProjectCard({ deck, index, reduce, onOpen }: { deck: Deck; index: number; reduce: boolean; onOpen: (id: string) => void }) {
  const image = cover(deck);
  const done = completed(deck);
  const state = phase(deck);
  const initial = deckTitle(deck).slice(0, 1).toUpperCase();
  return (
    <motion.button
      type="button"
      onClick={() => onOpen(deck.id)}
      className="ms-home-project"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .26, delay: reduce ? 0 : Math.min(index * .05, .22), ease }}
    >
      <span className="ms-home-project-cover">{image ? <img src={image} alt="" /> : <i>{initial}</i>}<em>{state}</em></span>
      <span className="ms-home-project-copy"><strong>{deckTitle(deck)}</strong><small>{done} of {deck.slideCount} slides <b>·</b> Updated {updated(deck.updatedAt)}</small></span>
      <span className="ms-home-project-meta"><span>{state === "Review" ? "Ready for review" : `${Math.max(deck.slideCount - done, 0)} left`}</span><i>{initial}</i></span>
    </motion.button>
  );
}

function ReviewItem({ deck, index, onOpenInsights }: { deck: Deck; index: number; onOpenInsights: (id: string) => void }) {
  const done = completed(deck);
  const title = deckTitle(deck);
  const messages = [
    `${title} has ${Math.max(deck.slideCount - done, 0)} slides still in progress`,
    `${title} is ready for a narrative check`,
    `Review the visual system in ${title}`,
    `Sources can be checked before delivery`,
  ];
  return <button type="button" onClick={() => onOpenInsights(deck.id)}><span className={`ms-home-review-mark is-${index}`}><ClockCounterClockwise /></span><p><strong>{messages[index]}</strong><small>{phase(deck)} · Updated {updated(deck.updatedAt)}</small></p><ArrowUpRight /></button>;
}

function Space({ name, note, count }: { name: string; note: string; count: number }) {
  return <button type="button"><FolderSimple /><span><strong>{name}</strong><small>{note}</small></span><i>{count}</i><ArrowUpRight /></button>;
}
