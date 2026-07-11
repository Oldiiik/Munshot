import { useCallback, useEffect, useRef, useState } from "react";
import type { Deck, Mode } from "./types";
import { loadDemoDecks, saveDemoDecks } from "./lib/demo";

/** Stable id for client-generated rows (outline slides etc.). */
export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function newDeck(slideCount = 6, mode: Mode = "moonshot"): Deck {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: "Untitled deck",
    mode,
    threadId: null,
    phase: "brief",
    brief: "",
    attachments: [],
    slideCount,
    brand: null,
    vibe: null,
    outline: [],
    slides: {},
    stats: [],
    published: false,
    webSearch: false,
    askQuestions: false,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Demo deck store: everything lives in localStorage, seeded on first run with
 * sample decks built from the bundled /samples images. Same exported API as
 * the Supabase-backed store so every consumer compiles unchanged.
 */
export function useDecks() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Initial load: seed on first run, then hydrate from localStorage.
  useEffect(() => {
    const loaded = loadDemoDecks().sort((a, b) => b.updatedAt - a.updatedAt);
    setDecks(loaded);
    setActiveId(loaded[0]?.id ?? "");
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!decks.find((d) => d.id === activeId) && decks.length) {
      setActiveId(decks[0].id);
    }
  }, [decks, activeId]);

  const active = decks.find((d) => d.id === activeId) ?? decks[0];

  // Persist the whole list back to localStorage (debounced).
  const timer = useRef<number | null>(null);
  const persist = useCallback((next: Deck[]) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      saveDemoDecks(next);
      timer.current = null;
    }, 250);
  }, []);

  const updateDeck = useCallback(
    (id: string, fn: (d: Deck) => Deck) => {
      setDecks((prev) => {
        const next = prev.map((d) =>
          d.id === id ? { ...fn(d), updatedAt: Date.now() } : d
        );
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const createDeck = useCallback(
    (slideCount = 6, mode: Mode = "moonshot") => {
      const d = newDeck(slideCount, mode);
      setDecks((prev) => {
        const next = [d, ...prev];
        persist(next);
        return next;
      });
      setActiveId(d.id);
      return d;
    },
    [persist]
  );

  const deleteDeck = useCallback(
    (id: string) => {
      setDecks((prev) => {
        const next = prev.filter((d) => d.id !== id);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  return {
    decks,
    active,
    activeId: active?.id ?? "",
    loading,
    setActiveId,
    createDeck,
    deleteDeck,
    updateDeck,
  };
}

export type DeckStore = ReturnType<typeof useDecks>;
