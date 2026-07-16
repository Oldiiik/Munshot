import { type CSSProperties, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, CaretDown, ChartBar, Check, Clock as Clock3, Cpu, File, Image, ListChecks, Sparkle } from "@phosphor-icons/react";

import { cn, deckTitle } from "@/lib/utils";
import type { Deck, TurnRecord } from "@/types";

interface Props { deck: Deck | null; decks: Deck[]; onSelect: (id: string) => void }
const ease = [0.22, 1, 0.36, 1] as const;
const fmtTokens = (value: number) => value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}M` : value >= 1_000 ? `${(value / 1_000).toFixed(1)}k` : value.toLocaleString();
const fmtTime = (value: number) => value < 1000 ? `${value}ms` : value < 60_000 ? `${(value / 1000).toFixed(1)}s` : `${Math.floor(value / 60_000)}m ${Math.round(value % 60_000 / 1000)}s`;

export function InsightsView({ deck, decks, onSelect }: Props) {
  const reduce = useReducedMotion();
  const observedDeck = deck?.stats.length ? deck : decks.find((item) => item.stats.length) ?? deck ?? decks[0] ?? null;
  const stats = observedDeck?.stats ?? [];
  const input = stats.reduce((sum, turn) => sum + turn.usage.inputTokens, 0);
  const output = stats.reduce((sum, turn) => sum + turn.usage.outputTokens, 0);
  const cached = stats.reduce((sum, turn) => sum + turn.usage.cachedInputTokens, 0);
  const duration = stats.reduce((sum, turn) => sum + turn.durationMs, 0);
  const failures = stats.filter((turn) => !turn.ok).length;
  const rendered = stats.filter((turn) => turn.kind === "slide" && turn.ok).length;
  const success = stats.length ? Math.round((stats.length - failures) / stats.length * 100) : 0;
  const cacheRate = input ? Math.round(cached / input * 100) : 0;
  const maxDuration = Math.max(...stats.map((turn) => turn.durationMs), 1);
  const entry = (delay = 0) => reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 }, transition: { duration: .18, delay, ease } };

  if (!stats.length) return <EmptyInsights deck={observedDeck} decks={decks} onSelect={onSelect} entry={entry} />;

  return <main className="ms-intelligence h-full overflow-y-auto"><div className="ms-intelligence-shell">
    <motion.header className="ms-intelligence-head" {...entry()}><div><h1>Production insights</h1><p>{stats.length} recorded steps across planning and rendering.</p><label className="ms-insight-deck-select"><span>Presentation</span><select value={observedDeck?.id ?? ""} onChange={(event) => onSelect(event.target.value)}>{decks.map((item) => <option key={item.id} value={item.id}>{deckTitle(item)}</option>)}</select><CaretDownIcon /></label></div></motion.header>

    <motion.section className="ms-intelligence-instrument" {...entry(.04)}>
      <div className="ms-efficiency-dial" style={{ "--dial": `${Math.max(8, Math.round((success + cacheRate) / 2))}%` } as CSSProperties}><div><small>Run quality</small><strong>{Math.max(0, Math.round((success + cacheRate) / 2))}</strong><span>of 100</span></div></div>
      <div className="ms-instrument-copy"><h2>{success >= 90 ? "Everything held together." : "A good run, with a few places to sharpen."}</h2><p>Planning and rendering stay in one thread, so it is easy to see where the story needed more direction.</p><div className="ms-instrument-facts"><Fact icon={<Clock3 />} label="Time" value={fmtTime(duration)} /><Fact icon={<ImageIcon />} label="Slides" value={String(rendered)} /><Fact icon={<Sparkles />} label="Reuse" value={`${cacheRate}%`} /></div></div>
      <div className="ms-token-portrait"><span>Context profile</span><TokenArc label="Prompt input" value={input} total={input + output} /><TokenArc label="Model output" value={output} total={input + output} /><TokenArc label="Cache reused" value={cached} total={input || 1} subdued /></div>
    </motion.section>

    <section className="ms-execution-log"><motion.div className="ms-intelligence-section-head" {...entry(.09)}><div><h2>Every step, in context.</h2></div><span>{fmtTokens(input + output)} total tokens</span></motion.div><div className="ms-execution-table">{stats.map((turn, index) => <TurnRow key={turn.id} turn={turn} index={index} maxDuration={maxDuration} reduce={!!reduce} />)}</div></section>
  </div></main>;
}

function EmptyInsights({ deck, decks, onSelect, entry }: { deck: Deck | null; decks: Deck[]; onSelect: (id: string) => void; entry: (delay?: number) => Record<string, unknown> }) {
  const readiness = [
    { icon: <ListChecks />, label: "Narrative plan", detail: deck?.brief ? "Brief captured and ready to shape." : "Add a brief to establish the narrative." },
    { icon: <ImageIcon />, label: "Visual direction", detail: deck?.vibe ? `${deck.vibe.name} is attached to this deck.` : "Choose a Vibe or attach references before render." },
    { icon: <ChartBar />, label: "Production trace", detail: "Timing, token use, and cache reuse appear after the first run." },
  ];
  return <main className="ms-intelligence h-full overflow-y-auto"><div className="ms-intelligence-shell ms-insights-ready">
    <motion.header className="ms-intelligence-head" {...entry()}><div><h1>Production insights</h1><p>Generation timing, context reuse, and completed output will appear after the first planning run.</p><label className="ms-insight-deck-select"><span>Presentation</span><select value={deck?.id ?? ""} onChange={(event) => onSelect(event.target.value)}>{decks.map((item) => <option key={item.id} value={item.id}>{deckTitle(item)}</option>)}</select><CaretDownIcon /></label></div></motion.header>
    <motion.section className="ms-insights-ready-grid" {...entry(.05)}><article className="ms-insights-ready-lead"><span><Cpu weight="duotone" /></span><div><small>Next production signal</small><h2>{deck?.brief ? "Plan the narrative when you are ready." : "Start with one clear brief."}</h2><p>{deck?.brief ? "The outline run will record the narrative decisions, time spent, and context used for this deck." : "A good brief gives the planner a real point of view to work from."}</p></div><ArrowRight /></article><div className="ms-insights-ready-checks">{readiness.map((item) => <article key={item.label}><span>{item.icon}</span><div><strong>{item.label}</strong><p>{item.detail}</p></div><Check /></article>)}</div></motion.section>
    <motion.section className="ms-insights-measure" {...entry(.1)}><div><h2>Useful signals, not decorative charts.</h2></div><div><article><strong>Thread continuity</strong><p>How much deck context was reused from the previous turn.</p></article><article><strong>Time by stage</strong><p>Where planning or rendering asked for more attention.</p></article><article><strong>Rendered output</strong><p>Which slides completed cleanly and which need another pass.</p></article></div></motion.section>
  </div></main>;
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div><span>{icon}{label}</span><strong>{value}</strong></div>; }
function TokenArc({ label, value, total, subdued = false }: { label: string; value: number; total: number; subdued?: boolean }) { const amount = total ? Math.round(value / total * 100) : 0; return <div className={subdued ? "is-subdued" : ""}><span>{label}</span><i><b style={{ transform: `scaleX(${Math.max(value ? .04 : 0, amount / 100)})` }} /></i><strong>{fmtTokens(value)}</strong></div>; }
function TurnRow({ turn, index, maxDuration, reduce }: { turn: TurnRecord; index: number; maxDuration: number; reduce: boolean }) {
  const tokenCount = turn.usage.inputTokens + turn.usage.outputTokens;
  const width = Math.max(4, turn.durationMs / maxDuration * 100);
  return <motion.div initial={reduce ? { opacity: 0 } : { opacity: 0, x: -7 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .18, delay: reduce ? 0 : Math.min(index * .03, .16), ease }}>
    <span className="ms-execution-index">{String(index + 1).padStart(2, "0")}</span><span className="ms-execution-icon">{turn.kind === "slide" ? <ImageIcon /> : <FileText />}</span><span className="ms-execution-name"><strong>{turn.label}</strong><small>{turn.kind === "slide" ? "Slide render" : "Narrative plan"}</small></span><span className="ms-execution-duration"><i><b className={!turn.ok ? "is-error" : ""} style={{ transform: `scaleX(${width / 100})` }} /></i><small>{fmtTime(turn.durationMs)}</small></span><span className="ms-execution-tokens">{fmtTokens(tokenCount)} tok</span><span className={cn("ms-execution-result", !turn.ok && "is-error")}>{turn.ok ? "Complete" : "Failed"}</span>
  </motion.div>;
}
const CaretDownIcon = CaretDown;
const FileText = File;
const ImageIcon = Image;
const Sparkles = Sparkle;
