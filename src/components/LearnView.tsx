import { type FormEvent, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock,
} from "@phosphor-icons/react";

import type { Deck } from "@/types";
import { deckTitle } from "@/lib/utils";
import { deckCover } from "@/lib/demo";

interface Props {
  lessons: Deck[];
  onCreate: () => void;
  onCreateFromTopic: (topic: string) => void;
  onOpen: (id: string) => void;
}

type LessonFilter = "all" | "building" | "ready";

const PHASE: Record<Deck["phase"], string> = {
  brief: "Brief",
  outline: "Learning arc",
  slides: "Slides",
};

const ease = [0.23, 1, 0.32, 1] as const;

function rendered(lesson: Deck) {
  return Object.values(lesson.slides).filter((slide) => slide.status === "done").length;
}

function isReady(lesson: Deck) {
  return lesson.slideCount > 0 && rendered(lesson) >= lesson.slideCount;
}

function relativeDate(timestamp: number) {
  const elapsed = Date.now() - timestamp;
  const hours = Math.floor(elapsed / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

export function LearnView({ lessons, onCreate, onCreateFromTopic, onOpen }: Props) {
  const [topic, setTopic] = useState("");
  const [filter, setFilter] = useState<LessonFilter>("all");
  const reduceMotion = useReducedMotion();
  const recent = useMemo(() => [...lessons].sort((a, b) => b.updatedAt - a.updatedAt), [lessons]);
  const visibleLessons = useMemo(
    () => recent.filter((lesson) => filter === "all" || (filter === "ready" ? isReady(lesson) : !isReady(lesson))),
    [filter, recent],
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const nextTopic = topic.trim();
    if (nextTopic) onCreateFromTopic(nextTopic);
  };

  const enter = reduceMotion
    ? { initial: false as const, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.18, ease },
      };

  return (
    <main className="ms-learn-v8">
      <div className="ms-learn-v8-shell">
        <motion.header className="ms-learn-v8-header" {...enter}>
          <div>
            <h1>Learn</h1>
            <p>Create a visual lesson from one topic or learning outcome.</p>
          </div>
          <div className="ms-learn-v8-header-actions">
            <span>{recent.length} lesson{recent.length === 1 ? "" : "s"}</span>
          </div>
        </motion.header>

        <motion.form className="ms-learn-v8-composer" onSubmit={submit} {...enter}>
          <div className="ms-learn-v8-input-row">
            <textarea value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="What should the learner understand by the end?" aria-label="Lesson topic and outcome" rows={2} />
            <button type="submit" disabled={!topic.trim()}>Build lesson <ArrowRight weight="bold" /></button>
          </div>
        </motion.form>

        <section className="ms-learn-v8-library">
          <header>
            <div><h2>Your lessons</h2></div>
            <div className="ms-learn-v8-filters" role="tablist" aria-label="Filter lessons">
              {(["all", "building", "ready"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={filter === item}
                  className={filter === item ? "is-active" : ""}
                  onClick={() => setFilter(item)}
                >
                  {item === "all" ? "All" : item === "building" ? "In progress" : "Ready"}
                </button>
              ))}
            </div>
          </header>

          <AnimatePresence initial={false} mode="popLayout">
            {visibleLessons.length ? (
              <motion.div key={filter} className="ms-learn-v8-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.14 }}>
                {visibleLessons.map((lesson, index) => (
                  <LessonRow key={lesson.id} lesson={lesson} featured={index === 0 && filter === "all"} onOpen={onOpen} />
                ))}
              </motion.div>
            ) : (
              <motion.button key={`empty-${filter}`} type="button" className="ms-learn-v8-empty" onClick={onCreate} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <span><BookOpen /></span>
                <div><strong>{filter === "ready" ? "No finished lessons yet" : "No lessons here yet"}</strong><p>Start with a topic and Moonshot will prepare the first learning arc.</p></div>
                <ArrowRight />
              </motion.button>
            )}
          </AnimatePresence>
        </section>
      </div>
    </main>
  );
}

function LessonRow({ lesson, featured, onOpen }: { lesson: Deck; featured: boolean; onOpen: (id: string) => void }) {
  const complete = rendered(lesson);
  const progress = lesson.slideCount ? Math.min(100, Math.round((complete / lesson.slideCount) * 100)) : 0;
  const ready = isReady(lesson);
  const cover = deckCover(lesson);

  return (
    <button type="button" className={featured ? "ms-learn-v8-item is-featured" : "ms-learn-v8-item"} onClick={() => onOpen(lesson.id)}>
      <span className="ms-learn-v8-cover">
        {cover ? <img src={cover} alt="" /> : <span><BookOpen /><small>Lesson</small></span>}
      </span>
      <span className="ms-learn-v8-item-copy">
        <span className="ms-learn-v8-item-state">{ready ? <><Check weight="bold" /> Ready</> : PHASE[lesson.phase]}</span>
        <strong>{deckTitle(lesson)}</strong>
        <small>{lesson.brief || "Add a learning outcome"}</small>
        <span className="ms-learn-v8-progress"><i><b style={{ transform: `scaleX(${progress / 100})` }} /></i><small>{complete} of {lesson.slideCount} slides</small></span>
      </span>
      <span className="ms-learn-v8-item-action"><span><Clock /> {relativeDate(lesson.updatedAt)}</span><ArrowRight aria-hidden="true" /></span>
    </button>
  );
}
