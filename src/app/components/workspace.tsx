import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "motion/react";
import { LogoMark } from "./logo-mark";
import { projectId } from "../../../utils/supabase/info";

const sIcon = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const Icon = {
  Grid:    ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>),
  List:    ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><path d="M4 6h16M4 12h16M4 18h16"/></svg>),
  Star:    ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><path d="M12 4l2.5 5.5L20 10l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z"/></svg>),
  Trash:   ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><path d="M5 7h14M10 7V5a1 1 0 011-1h2a1 1 0 011 1v2M7 7l1 12a2 2 0 002 2h4a2 2 0 002-2l1-12"/></svg>),
  Sparkle: ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>),
  Plus:    ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><path d="M12 5v14M5 12h14"/></svg>),
  Search:  ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>),
  Logout:  ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><path d="M9 4H5a2 2 0 00-2 2v12a2 2 0 002 2h4M16 17l5-5-5-5M21 12H10"/></svg>),
  Arrow:   ({ className }: { className?: string }) => (<svg viewBox="0 0 24 24" className={className} {...sIcon}><path d="M4 12h15M13 6l6 6-6 6"/></svg>),
};

type Slide = { title: string; body: string; metric?: { k: string; v: string } | null; chart: number[] };
export type Deck = {
  id: string;
  userId: string;
  title: string;
  brief: string;
  slides: Slide[];
  tone: "editorial" | "modern" | "muted";
  starred: boolean;
  edits: number;
  createdAt: number;
  updatedAt: number;
};

type View = "all" | "starred";
type Layout = "grid" | "list";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-84204692`;

export function Workspace({
  user,
  onClose,
  onSignOut,
  onNewDeck,
  onOpenDeck,
}: {
  user: { id: string; email: string; name: string; accessToken: string };
  onClose: () => void;
  onSignOut: () => void;
  onNewDeck: () => void;
  onOpenDeck: (deck: Deck) => void;
}) {
  const [view, setView] = useState<View>("all");
  const [layout, setLayout] = useState<Layout>("grid");
  const [query, setQuery] = useState("");
  const [decks, setDecks] = useState<Deck[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const authHeaders = useMemo(
    () => ({ "Content-Type": "application/json", Authorization: `Bearer ${user.accessToken}` }),
    [user.accessToken],
  );

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!user.accessToken) {
      setError("No access token in session. Please sign in again.");
      setDecks([]);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${API}/decks`, { headers: authHeaders });
        const text = await res.text();
        let data: any = null;
        try { data = JSON.parse(text); } catch { /* non-JSON body */ }
        if (!res.ok) {
          console.error("Decks load failed:", res.status, text);
          if (!cancelled) {
            setError(data?.error || `Server returned ${res.status}. ${text.slice(0, 120)}`);
            setDecks([]);
          }
          return;
        }
        if (!cancelled) setDecks(Array.isArray(data?.decks) ? data.decks : []);
      } catch (e: any) {
        console.error("Decks load threw:", e);
        if (!cancelled) {
          setError(`Network: ${e?.message || "request failed"}`);
          setDecks([]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [authHeaders]);

  const sorted = useMemo(() => (decks ? [...decks].sort((a, b) => b.updatedAt - a.updatedAt) : []), [decks]);

  const filtered = useMemo(() => {
    let list = sorted;
    if (view === "starred") list = list.filter((d) => d.starred);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((d) => d.title.toLowerCase().includes(q) || d.brief.toLowerCase().includes(q));
    }
    return list;
  }, [sorted, view, query]);

  const featured = sorted[0] ?? null;
  const rest = filtered.filter((d) => d.id !== featured?.id);

  const toggleStar = async (d: Deck) => {
    const next = !d.starred;
    setDecks((s) => s ? s.map((x) => (x.id === d.id ? { ...x, starred: next } : x)) : s);
    try {
      const res = await fetch(`${API}/decks/${d.id}`, { method: "PATCH", headers: authHeaders, body: JSON.stringify({ starred: next }) });
      if (!res.ok) throw new Error(await res.text());
    } catch (e) {
      console.error("Star failed:", e);
      setDecks((s) => s ? s.map((x) => (x.id === d.id ? { ...x, starred: !next } : x)) : s);
    }
  };

  const removeDeck = async (d: Deck) => {
    setDecks((s) => s ? s.filter((x) => x.id !== d.id) : s);
    try {
      const res = await fetch(`${API}/decks/${d.id}`, { method: "DELETE", headers: authHeaders });
      if (!res.ok) throw new Error(await res.text());
    } catch (e) {
      console.error("Delete failed:", e);
      setDecks((s) => s ? [...(s || []), d] : s);
    }
  };

  const initials = user.name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  const loading = decks === null;
  const totalCount = decks?.length ?? 0;
  const starredCount = decks?.filter((d) => d.starred).length ?? 0;
  const slideCount = decks?.reduce((s, d) => s + d.slides.length, 0) ?? 0;
  const editsCount = decks?.reduce((s, d) => s + (d.edits || 0), 0) ?? 0;

  const issueNo = String(totalCount + 1).padStart(3, "0");
  const dateStr = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="fixed inset-0 z-[80] bg-[#f5f3ef] dark:bg-[#07070a] text-black dark:text-white overflow-hidden flex moonshot-page">
      <AmbientField />

      {/* Sidebar backdrop (mobile only) */}
      {sidebarOpen && (
        <button
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 z-[15] bg-black/30 backdrop-blur-sm"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed lg:relative z-20 lg:z-10 shrink-0 w-[280px] lg:w-[260px] inset-y-3 left-3 lg:m-3 lg:mr-0 lg:inset-auto rounded-3xl glass flex flex-col overflow-hidden transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          sidebarOpen ? "translate-x-0" : "-translate-x-[110%] lg:translate-x-0"
        }`}
      >
        <button onClick={onClose} className="flex items-center gap-2.5 group px-6 pt-6 pb-7" data-cursor-label="Home">
          <LogoMark className="h-5 w-5 transition group-hover:rotate-12" title="" />
          <span className="text-sm font-semibold tracking-tight">Moonshot</span>
        </button>

        <div className="px-5">
          <button
            onClick={onNewDeck}
            className="relative w-full overflow-hidden inline-flex items-center justify-center gap-2 rounded-full bg-black text-white dark:bg-white dark:text-black px-4 py-2.5 text-[13px] font-medium hover:opacity-90 transition"
            data-cursor-label="Compose"
          >
            <motion.span
              aria-hidden
              animate={{ x: ["-130%", "230%"] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/2 bg-gradient-to-r from-transparent via-white/30 dark:via-black/15 to-transparent"
            />
            <Icon.Sparkle className="h-3.5 w-3.5" />
            <span>Compose deck</span>
          </button>
        </div>

        <nav className="px-3 mt-7 space-y-0.5">
          {[
            { id: "all" as View, label: "Library", count: totalCount },
            { id: "starred" as View, label: "Starred", count: starredCount },
          ].map((it) => {
            const active = view === it.id;
            return (
              <button
                key={it.id}
                onClick={() => setView(it.id)}
                className={`relative w-full flex items-center justify-between rounded-md px-3 py-1.5 text-[13.5px] transition ${
                  active ? "text-black dark:text-white" : "text-neutral-500 hover:text-black dark:hover:text-white"
                }`}
                data-cursor-label={it.label}
              >
                {active && (
                  <motion.span
                    layoutId="ws-nav-pill"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2px] rounded-r bg-black dark:bg-white"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className={active ? "font-medium" : ""}>{it.label}</span>
                <span className="font-mono text-[10px] text-neutral-400">{String(it.count).padStart(2, "0")}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-6 mt-9">
          <div className="text-[9px] font-medium uppercase tracking-[0.32em] text-neutral-400 mb-3">Today</div>
          <div className="text-[12.5px] text-neutral-700 dark:text-neutral-300 leading-snug">{dateStr}</div>
          <div className="mt-1 font-mono text-[11px] text-neutral-400">{timeStr} · Issue №{issueNo}</div>
        </div>

        {sorted.length > 0 && (
          <div className="px-6 mt-9 flex-1 min-h-0 overflow-y-auto">
            <div className="text-[9px] font-medium uppercase tracking-[0.32em] text-neutral-400 mb-3">Recent</div>
            <div className="space-y-2.5">
              {sorted.slice(0, 6).map((d, i) => (
                <button
                  key={d.id}
                  onClick={() => onOpenDeck(d)}
                  className="group flex items-baseline gap-2.5 w-full text-left"
                  data-cursor-label="Open"
                >
                  <span className="font-mono text-[10px] text-neutral-400 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <div className="min-w-0 flex-1">
                    <div className={`text-[12.5px] leading-snug truncate text-neutral-600 dark:text-neutral-400 group-hover:text-black dark:group-hover:text-white transition ${d.tone === "editorial" ? "italic" : ""}`}>
                      {d.title || "Untitled"}
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">{relTime(d.updatedAt)} ago</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto px-5 pb-5">
          <div className="border-t border-black/8 dark:border-white/10 pt-4 flex items-center gap-2.5">
            <div className="relative h-8 w-8 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center text-[11px] font-semibold tracking-wide shrink-0">
              {initials}
              <span className="absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-[#f5f3ef] dark:ring-[#07070a]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-medium truncate">{user.name}</div>
              <div className="text-[10px] text-neutral-500 truncate">{user.email}</div>
            </div>
            <button onClick={onSignOut} className="h-7 w-7 rounded-full hover:bg-black/5 dark:hover:bg-white/8 flex items-center justify-center text-neutral-500 hover:text-black dark:hover:text-white transition" data-cursor-label="Sign out" aria-label="Sign out">
              <Icon.Logout className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="relative z-0 flex-1 overflow-y-auto">
        {/* Sticky masthead */}
        <div className="sticky top-3 mx-3 z-30 rounded-2xl glass-subtle">
          <div className="px-4 sm:px-8 lg:px-16 h-14 flex items-center gap-3 sm:gap-6 text-[10px] font-medium uppercase tracking-[0.32em] text-neutral-500">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="lg:hidden h-8 w-8 -ml-1 rounded-full flex items-center justify-center text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/8 transition"
            >
              <svg viewBox="0 0 24 24" {...sIcon} className="h-4 w-4"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
            <span className="text-black dark:text-white whitespace-nowrap">Moonshot<span className="hidden sm:inline"> Quarterly</span></span>
            <span className="hidden md:inline">№{issueNo}</span>
            <span className="hidden lg:inline">{now.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <label className="flex items-center gap-2 rounded-full border border-black/15 dark:border-white/15 bg-transparent pl-3 pr-3 py-1.5 text-xs w-32 sm:w-48 lg:w-64 max-w-[40vw] focus-within:border-black/40 dark:focus-within:border-white/30 transition normal-case tracking-normal">
                <Icon.Search className="h-3.5 w-3.5 text-neutral-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search the library"
                  className="flex-1 bg-transparent outline-none placeholder:text-neutral-400 text-[13px]"
                />
              </label>
              <div className="flex items-center gap-0.5 rounded-full border border-black/15 dark:border-white/15 p-0.5">
                {(["grid", "list"] as Layout[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLayout(l)}
                    className={`relative h-6 w-6 rounded-full flex items-center justify-center transition ${layout === l ? "text-white dark:text-black" : "text-neutral-500 hover:text-black dark:hover:text-white"}`}
                    data-cursor-label={l}
                    aria-label={l}
                  >
                    {layout === l && <motion.span layoutId="ws-layout-pill" className="absolute inset-0 rounded-full bg-black dark:bg-white" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                    <span className="relative">{l === "grid" ? <Icon.Grid className="h-3 w-3" /> : <Icon.List className="h-3 w-3" />}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 sm:px-8 lg:px-16 pt-8 lg:pt-10 pb-24 max-w-[1500px]">
          {/* Hero */}
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 items-end"
          >
            <div>
              <div className="text-[10px] font-medium uppercase tracking-[0.4em] text-neutral-400 flex items-center gap-3">
                <span className="font-mono text-black dark:text-white">{(loading ? 0 : filtered.length).toString().padStart(2, "0")}</span>
                <span className="h-px w-10 bg-neutral-300 dark:bg-neutral-700" />
                <span>{view === "all" ? "Library" : "Starred"}</span>
              </div>
              <h1 className="mt-5 text-[clamp(2.6rem,5.2vw,4.6rem)] font-semibold tracking-[-0.045em] leading-[0.92]">
                {greeting()},<br />
                <span className="italic font-light text-neutral-400">{user.name.split(" ")[0]}.</span>
              </h1>
              <p className="mt-5 text-[15px] text-neutral-500 dark:text-neutral-400 max-w-md leading-relaxed">
                A quiet room for your decks. Open a draft, or compose a new one — Moonshot writes the first cut for you.
              </p>
            </div>

            <div className="hidden lg:flex flex-col gap-3 items-end">
              <Stat label="Decks"  value={totalCount} />
              <Stat label="Slides" value={slideCount} />
              <Stat label="Edits"  value={editsCount} />
            </div>
          </motion.section>

          {/* Featured */}
          {featured && view === "all" && !query && (
            <FeaturedDeck
              key={featured.id}
              deck={featured}
              onOpen={() => onOpenDeck(featured)}
              onStar={() => toggleStar(featured)}
            />
          )}

          {/* Section header */}
          <div className="mt-16 flex items-baseline gap-4">
            <div className="text-[10px] font-medium uppercase tracking-[0.4em] text-neutral-400">
              {view === "all" ? (featured && !query ? "More from your library" : "Library") : "Starred"}
            </div>
            <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
            <div className="font-mono text-[10px] text-neutral-400">
              {String(rest.length).padStart(2, "0")} {rest.length === 1 ? "deck" : "decks"}
            </div>
          </div>

          {error && <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/[0.04] px-4 py-3 text-xs text-rose-500">{error}</div>}

          <section className="mt-6">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <SkeletonGrid />
              ) : filtered.length === 0 ? (
                <EmptyState query={query} hasAny={totalCount > 0} view={view} onNew={onNewDeck} />
              ) : layout === "grid" ? (
                <motion.div key="grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-10">
                  <NewDeckTile onClick={onNewDeck} />
                  {rest.map((d, i) => (
                    <DeckCard
                      key={d.id}
                      deck={d}
                      delay={i * 0.04}
                      onOpen={() => onOpenDeck(d)}
                      onStar={() => toggleStar(d)}
                      onDelete={() => removeDeck(d)}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div key="list" className="border-t border-black/10 dark:border-white/10">
                  {filtered.map((d, i) => (
                    <DeckRow
                      key={d.id}
                      deck={d}
                      delay={i * 0.025}
                      onOpen={() => onOpenDeck(d)}
                      onStar={() => toggleStar(d)}
                      onDelete={() => removeDeck(d)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </main>
    </div>
  );
}

/* ---------- atmosphere ---------- */

function AmbientField() {
  const motes = useMemo(() => Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    dur: 16 + Math.random() * 14,
    size: 1 + Math.random() * 2.5,
    drift: (Math.random() - 0.5) * 60,
  })), []);
  return (
    <>
      <motion.div
        aria-hidden
        animate={{ x: [0, 28, -10, 0], y: [0, -18, 8, 0] }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -top-[20vh] -right-[15vw] h-[60vh] w-[60vh] rounded-full opacity-40 dark:opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(0,0,0,0.06), transparent 65%)" }}
      />
      <motion.div
        aria-hidden
        animate={{ x: [0, -20, 8, 0], y: [0, 16, -6, 0] }}
        transition={{ duration: 38, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -bottom-[25vh] left-[10vw] h-[55vh] w-[55vh] rounded-full opacity-30 dark:opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(0,0,0,0.05), transparent 65%)" }}
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {motes.map((m) => (
          <motion.span
            key={m.id}
            initial={{ y: "110vh", x: 0, opacity: 0 }}
            animate={{ y: "-15vh", x: m.drift, opacity: [0, 0.6, 0] }}
            transition={{ duration: m.dur, delay: m.delay, repeat: Infinity, ease: "linear" }}
            className="absolute rounded-full bg-black/40 dark:bg-white/40"
            style={{ left: `${m.left}%`, width: m.size, height: m.size, filter: "blur(0.4px)" }}
          />
        ))}
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-right">
      <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-neutral-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-[-0.03em] tabular-nums">
        <CountUp value={value} />
      </div>
    </div>
  );
}

function CountUp({ value }: { value: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 750;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{String(n).padStart(2, "0")}</>;
}

/* ---------- featured ---------- */

function FeaturedDeck({ deck, onOpen, onStar }: { deck: Deck; onOpen: () => void; onStar: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 160, damping: 22 });
  const sy = useSpring(my, { stiffness: 160, damping: 22 });
  const rotateY = useTransform(sx, (v) => v * 6);
  const rotateX = useTransform(sy, (v) => v * -4);
  const glareX = useTransform(sx, (v) => 50 + v * 40);
  const glareY = useTransform(sy, (v) => 50 + v * 40);
  const glareBg = useTransform(
    [glareX, glareY],
    ([x, y]: number[]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.18), transparent 55%)`,
  );

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  const chart = chartFor(deck);
  const max = Math.max(...chart, 1);
  const path = chart.map((v, i) => `${(i / (chart.length - 1)) * 100},${100 - (v / max) * 80}`).join(" ");
  const area = `0,100 ${path} 100,100`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="mt-14"
    >
      <div className="flex items-baseline gap-3 mb-5">
        <div className="text-[10px] font-medium uppercase tracking-[0.4em] text-neutral-400">Cover story</div>
        <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
        <div className="font-mono text-[10px] text-neutral-400">edited {relTime(deck.updatedAt)} ago</div>
      </div>
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ rotateX, rotateY, transformPerspective: 1400 }}
        className="group relative grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-0 rounded-3xl glass-strong overflow-hidden"
      >
        {/* Left: editorial content */}
        <button onClick={onOpen} className="text-left p-10 lg:p-14 flex flex-col min-h-[440px] relative" data-cursor-label="Open deck">
          <div className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.32em] text-neutral-500">
            <span>{deck.tone}</span>
            <span className="h-px w-6 bg-neutral-300 dark:bg-neutral-700" />
            <span className="font-mono">{deck.slides.length} slides</span>
            {deck.starred && <span className="ml-1 text-amber-500"><Icon.Star className="h-3 w-3 fill-current" /></span>}
          </div>
          <h2 className={`mt-6 text-[clamp(1.8rem,3.4vw,2.8rem)] tracking-[-0.035em] leading-[1.02] ${deck.tone === "editorial" ? "italic font-medium" : "font-semibold"}`}>
            {deck.title || "Untitled"}
          </h2>
          {deck.brief && (
            <p className="mt-5 text-[14.5px] text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-3 max-w-md">
              {deck.brief}
            </p>
          )}
          <div className="mt-auto pt-10 flex items-center gap-5">
            <span className="inline-flex items-center gap-2 text-[13px] font-medium group-hover:gap-3 transition-all">
              Continue editing <Icon.Arrow className="h-3.5 w-3.5" />
            </span>
            <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-[0.2em]">
              {deck.edits || 0} edits
            </span>
          </div>
        </button>

        {/* Right: chart canvas */}
        <div className="relative bg-gradient-to-br from-[#1d1d24] via-[#15151a] to-[#0c0c10] text-white overflow-hidden min-h-[280px] lg:min-h-0 lg:rounded-r-3xl lg:rounded-l-none rounded-b-3xl lg:rounded-bl-none">
          <motion.div
            aria-hidden
            style={{ background: glareBg }}
            className="pointer-events-none absolute inset-0"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
          <div className="absolute inset-0 p-10 lg:p-12 flex flex-col">
            <div className="flex items-start justify-between text-[10px] font-medium uppercase tracking-[0.32em] text-white/50">
              <span>Slide 01 — preview</span>
              <button
                onClick={onStar}
                className={`h-7 w-7 rounded-full border border-white/15 flex items-center justify-center transition ${deck.starred ? "text-amber-300" : "text-white/60 hover:text-white"}`}
                aria-label="Star"
                data-cursor-label="Star"
              >
                <Icon.Star className={`h-3.5 w-3.5 ${deck.starred ? "fill-current" : ""}`} />
              </button>
            </div>
            <div className="mt-4 text-[11px] text-white/40 font-mono uppercase tracking-[0.2em]">
              {deck.slides[0]?.metric?.k ?? "Trajectory"}
            </div>
            <div className="text-3xl tracking-[-0.03em] font-semibold mt-1">
              {deck.slides[0]?.metric?.v ?? `+${Math.round((chart[chart.length - 1] / chart[0] - 1) * 100)}%`}
            </div>
            <div className="relative mt-auto h-40">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                <defs>
                  <linearGradient id="ws-feat-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="white" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon points={area} fill="url(#ws-feat-grad)" />
                <motion.polyline
                  points={path}
                  fill="none"
                  stroke="white"
                  strokeWidth="0.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                />
                {chart.map((v, i) => (
                  <circle key={i} cx={(i / (chart.length - 1)) * 100} cy={100 - (v / max) * 80} r="0.6" fill="white" />
                ))}
              </svg>
            </div>
            <div className="mt-3 flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.22em] text-white/40">
              <span>q1</span><span>q2</span><span>q3</span><span>q4</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ---------- helpers ---------- */

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function relTime(ts: number) {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w`;
  return new Date(ts).toLocaleDateString();
}

function chartFor(deck: Deck): number[] {
  const c = deck.slides?.[0]?.chart;
  if (Array.isArray(c) && c.length >= 5) return c;
  return [40, 55, 62, 70, 78, 88, 95];
}

function DeckCard({ deck, delay, onOpen, onStar, onDelete }: { deck: Deck; delay: number; onOpen: () => void; onStar: () => void; onDelete: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 200, damping: 20 });
  const sy = useSpring(my, { stiffness: 200, damping: 20 });
  const rotateY = useTransform(sx, (v) => v * 5);
  const rotateX = useTransform(sy, (v) => v * -4);

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  const chart = chartFor(deck);
  const max = Math.max(...chart, 1);
  const path = chart.map((v, i) => `${(i / (chart.length - 1)) * 100},${100 - (v / max) * 80}`).join(" ");
  const area = `0,100 ${path} 100,100`;

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      style={{ rotateX, rotateY, transformPerspective: 1400 }}
      className="group relative"
    >
      <button onClick={onOpen} className="block w-full text-left" data-cursor-label="Open">
        <div className="relative aspect-[4/5] rounded-2xl glass overflow-hidden transition-all group-hover:[box-shadow:inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_0_rgba(0,0,0,0.06),0_2px_6px_rgba(20,20,40,0.06),0_50px_110px_-24px_rgba(40,40,80,0.32)]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500"
            style={{ background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.6), transparent 55%)" }}
          />
          <div className="absolute inset-0 p-6 flex flex-col">
            <div className="flex items-center justify-between text-[9px] font-medium uppercase tracking-[0.32em] text-neutral-500 dark:text-white/50">
              <span>{deck.tone}</span>
              <span className="font-mono">{String(deck.slides.length).padStart(2, "0")}</span>
            </div>
            <div className={`mt-5 text-[17px] leading-tight tracking-[-0.02em] line-clamp-3 text-black dark:text-white ${deck.tone === "editorial" ? "italic font-medium" : "font-semibold"}`}>
              {deck.title || "Untitled"}
            </div>
            <div className="relative mt-auto h-24 text-black dark:text-white">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                <defs>
                  <linearGradient id={`grad-${deck.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon points={area} fill={`url(#grad-${deck.id})`} />
                <polyline points={path} fill="none" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="mt-3 flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.22em] text-neutral-500 dark:text-white/40">
              <span>{relTime(deck.updatedAt)} ago</span>
              <span>{deck.edits || 0} edits</span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-start justify-between gap-2 px-1">
          <div className="min-w-0 flex-1">
            <div className={`text-[14px] font-medium leading-tight tracking-tight truncate ${deck.tone === "editorial" ? "italic" : ""}`}>
              {deck.title || "Untitled"}
            </div>
            <div className="mt-1 text-[10.5px] text-neutral-500 uppercase tracking-[0.18em]">
              {relTime(deck.updatedAt)} ago · {deck.slides.length} slides
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onStar(); }}
            className={`shrink-0 transition ${deck.starred ? "text-amber-500" : "text-neutral-300 hover:text-black dark:hover:text-white"}`}
            aria-label="Star" data-cursor-label="Star"
          >
            <Icon.Star className={`h-3.5 w-3.5 ${deck.starred ? "fill-current" : ""}`} />
          </button>
        </div>
      </button>
      <button
        onClick={onDelete}
        className="absolute top-3 right-3 h-7 w-7 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur border border-black/10 dark:border-white/10 flex items-center justify-center text-neutral-500 hover:text-rose-500 transition opacity-0 group-hover:opacity-100"
        aria-label="Delete" data-cursor-label="Delete"
      >
        <Icon.Trash className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

function DeckRow({ deck, onOpen, onStar, onDelete, delay }: { deck: Deck; onOpen: () => void; onStar: () => void; onDelete: () => void; delay: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="group grid grid-cols-[1fr_140px_120px_60px] items-center px-2 py-5 border-b border-black/10 dark:border-white/10 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition"
    >
      <button onClick={onOpen} className="flex items-center gap-4 text-left min-w-0" data-cursor-label="Open">
        <span className="font-mono text-[10px] text-neutral-400 w-8 shrink-0">{String(deck.slides.length).padStart(2, "0")}</span>
        <div className="min-w-0">
          <div className={`text-[15px] font-medium leading-tight truncate ${deck.tone === "editorial" ? "italic" : ""}`}>
            {deck.starred && <Icon.Star className="inline h-3 w-3 mr-1.5 fill-current text-amber-500" />}
            {deck.title || "Untitled"}
          </div>
          <div className="mt-1 text-xs text-neutral-500 truncate max-w-md">{deck.brief}</div>
        </div>
      </button>
      <div className="text-[10.5px] uppercase tracking-[0.2em] text-neutral-400">{deck.tone}</div>
      <div className="text-xs text-neutral-500">{relTime(deck.updatedAt)} ago</div>
      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
        <button onClick={onStar} className="h-7 w-7 rounded-full hover:bg-black/5 dark:hover:bg-white/8 flex items-center justify-center text-neutral-500" aria-label="Star">
          <Icon.Star className={`h-3.5 w-3.5 ${deck.starred ? "fill-current text-amber-500" : ""}`} />
        </button>
        <button onClick={onDelete} className="h-7 w-7 rounded-full hover:bg-black/5 dark:hover:bg-white/8 flex items-center justify-center text-neutral-500 hover:text-rose-500" aria-label="Delete">
          <Icon.Trash className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

function NewDeckTile({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      onClick={onClick}
      className="group relative aspect-[4/5] rounded-2xl border border-dashed border-black/15 dark:border-white/15 hover:border-black dark:hover:border-white transition flex flex-col items-center justify-center gap-3 text-neutral-500 hover:text-black dark:hover:text-white"
      data-cursor-label="New deck"
    >
      <div className="h-12 w-12 rounded-full border border-black/15 dark:border-white/15 flex items-center justify-center group-hover:scale-110 group-hover:rotate-90 transition-transform duration-500">
        <Icon.Plus className="h-4 w-4" />
      </div>
      <div className="text-[14px] font-medium">New deck</div>
      <div className="text-[9px] uppercase tracking-[0.32em]">From a brief</div>
    </motion.button>
  );
}

function SkeletonGrid() {
  return (
    <motion.div key="skeleton" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-10">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="aspect-[4/5] rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.03] animate-pulse" />
          <div className="h-3 w-3/4 rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
          <div className="h-2 w-1/2 rounded bg-black/[0.05] dark:bg-white/[0.05] animate-pulse" />
        </div>
      ))}
    </motion.div>
  );
}

function EmptyState({ query, hasAny, view, onNew }: { query: string; hasAny: boolean; view: View; onNew: () => void }) {
  const headline = query
    ? `Nothing matches “${query}”`
    : view === "starred"
      ? "Nothing starred yet"
      : hasAny
        ? "No decks in this view"
        : "An empty room.";
  const sub = query
    ? "Try a different word, or compose a new deck from this brief."
    : view === "starred"
      ? "Star decks you want to find fast."
      : "Compose your first deck — Moonshot drafts it in under a minute.";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="py-24 text-center">
      <LogoMark className="h-9 w-9 mx-auto opacity-30" title="" />
      <h3 className="mt-6 text-3xl font-light italic tracking-[-0.03em] text-neutral-400">{headline}</h3>
      <p className="mt-3 text-sm text-neutral-500 max-w-sm mx-auto">{sub}</p>
      {view !== "starred" && (
        <button
          onClick={onNew}
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-black text-white dark:bg-white dark:text-black px-5 py-2.5 text-sm font-medium hover:opacity-90 transition"
          data-cursor-label="Compose"
        >
          <Icon.Sparkle className="h-3.5 w-3.5" /> Compose a deck
        </button>
      )}
    </motion.div>
  );
}
