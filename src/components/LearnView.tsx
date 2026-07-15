import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight as ArrowRightIcon,
  BookOpen as BookOpenIcon,
  GraduationCap as GraduationCapIcon,
  ListChecks as ListChecksIcon,
  Plus as PlusIcon,
  Sparkle as SparkleIcon,
  Target as TargetIcon,
} from "@phosphor-icons/react";

import type { Deck } from "@/types";
import { deckTitle } from "@/lib/utils";

interface Props { lessons: Deck[]; onCreate: () => void; onCreateFromTopic: (topic: string) => void; onOpen: (id: string) => void }
const PHASE: Record<Deck["phase"], string> = { brief: "Set the lesson brief", outline: "Review learning arc", slides: "Lesson in production" };
const PROMPTS = ["Explain photosynthesis", "Teach supply and demand", "Intro to neural networks"];
const ease = [0.22, 1, 0.36, 1] as const;
function rendered(lesson: Deck) { return Object.values(lesson.slides).filter((slide) => slide.status === "done").length; }

export function LearnView({ lessons, onCreate, onCreateFromTopic, onOpen }: Props) {
  const [topic, setTopic] = useState("");
  const reduce = useReducedMotion();
  const recent = useMemo(() => [...lessons].sort((a, b) => b.updatedAt - a.updatedAt), [lessons]);
  const primary = recent[0] ?? null;
  const submit = (event: FormEvent) => { event.preventDefault(); if (topic.trim()) onCreateFromTopic(topic.trim()); };
  const entry = (delay = 0) => reduce ? { initial: { opacity: 0 }, animate: { opacity: 1 } } : { initial: { opacity: 0, y: 8, filter: "blur(3px)" }, animate: { opacity: 1, y: 0, filter: "blur(0px)" }, transition: { duration: .22, delay, ease } };

  return <main className="ms-learning-studio h-full overflow-y-auto"><div className="ms-learning-shell">
    <motion.header className="ms-learning-head" {...entry()}><div><h1>Give the idea a place to land.</h1><p>Build a visual lesson around one clear outcome, then let the sequence carry it.</p></div><button type="button" onClick={onCreate}><PlusIcon /> Blank lesson</button></motion.header>

    <motion.form className="ms-learning-brief" onSubmit={submit} {...entry(.04)}><span><GraduationCapIcon /></span><div><label htmlFor="lesson-topic">Start with the learner</label><input id="lesson-topic" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="What should feel clear by the end?" autoComplete="off" /><div>{PROMPTS.map((prompt) => <button key={prompt} type="button" onClick={() => setTopic(prompt)}>{prompt}</button>)}</div></div><motion.button type="submit" disabled={!topic.trim()} whileTap={{ scale: .95 }}>Build lesson <ArrowRightIcon /></motion.button></motion.form>

    <section className="ms-learning-architecture"><div className="ms-learning-architecture-head"><div><h2>Give every idea a route through the learner.</h2></div><p>Moonshot uses this sequence when it plans a lesson, so the deck earns understanding before it asks for recall.</p></div><div className="ms-learning-architecture-grid"><article className="ms-learning-outcome"><span><TargetIcon /> Desired outcome</span><strong>{topic.trim() || primary?.brief || "Name what learners should be able to explain."}</strong><p>Start with a visible change in understanding, not a list of topics to cover.</p></article><ol className="ms-learning-sequence"><ArchitectureStage icon={<BookOpenIcon />} title="Activate" detail="Start from a familiar question, tension, or misconception." /><ArchitectureStage icon={<TargetIcon />} title="Model" detail="Explain one core idea with a concrete visual or analogy." /><ArchitectureStage icon={<ListChecksIcon />} title="Practice" detail="Ask learners to work with the idea before moving on." /><ArchitectureStage icon={<SparkleIcon />} title="Transfer" detail="Close with a new situation that proves the idea can travel." /></ol></div></section>

    <section className="ms-learning-work"><motion.div className="ms-learning-section-head" {...entry(.1)}><div><h2>{primary ? "Return to the lesson" : "Start your first lesson"}</h2></div><span>{recent.length} lesson{recent.length === 1 ? "" : "s"}</span></motion.div>{primary ? <LessonFocus lesson={primary} reduce={!!reduce} onOpen={onOpen} /> : <button type="button" className="ms-learning-empty" onClick={onCreate}><span><SparkleIcon /></span><div><strong>Start with the outcome.</strong><p>Moonshot will help turn it into a clear visual explanation.</p></div><ArrowRightIcon /></button>}
      {recent.length > 1 && <div className="ms-learning-list">{recent.slice(1).map((lesson, index) => <LessonRow key={lesson.id} lesson={lesson} index={index} reduce={!!reduce} onOpen={onOpen} />)}</div>}
    </section>
  </div></main>;
}

function ArchitectureStage({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) { return <li><i>{icon}</i><div><strong>{title}</strong><small>{detail}</small></div></li>; }
function LessonFocus({ lesson, reduce, onOpen }: { lesson: Deck; reduce: boolean; onOpen: (id: string) => void }) { const complete = rendered(lesson); const progress = lesson.slideCount ? Math.round(complete / lesson.slideCount * 100) : 0; return <motion.button type="button" className="ms-lesson-focus" onClick={() => onOpen(lesson.id)} initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .22, ease }} whileTap={{ scale: .994 }}><span className="ms-lesson-focus-symbol"><BookOpenIcon /></span><span className="ms-lesson-focus-copy"><small>{PHASE[lesson.phase]}</small><strong>{deckTitle(lesson)}</strong><em>{lesson.brief || "Your next lesson is ready for an objective."}</em><i><b style={{ transform: `scaleX(${progress / 100})` }} /></i><small>{complete} of {lesson.slideCount} slides rendered</small></span><span className="ms-lesson-focus-open">Continue <ArrowRightIcon /></span></motion.button>; }
function LessonRow({ lesson, index, reduce, onOpen }: { lesson: Deck; index: number; reduce: boolean; onOpen: (id: string) => void }) { return <motion.button type="button" onClick={() => onOpen(lesson.id)} initial={reduce ? { opacity: 0 } : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .18, delay: reduce ? 0 : Math.min(index * .035, .14), ease }}><div><strong>{deckTitle(lesson)}</strong><small>{PHASE[lesson.phase]}</small></div><span>{rendered(lesson)}/{lesson.slideCount}</span><ArrowRightIcon /></motion.button>; }
