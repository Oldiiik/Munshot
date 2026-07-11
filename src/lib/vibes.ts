import { useCallback, useEffect, useState } from "react";
import type { Vibe } from "../types";
import { uid } from "../store";
import { delay, VIBES_KEY } from "./demo";

/** Built-in style presets that ship in the client. They are always available in
 *  the picker, even before a user creates their own. */
export const APPLE_VIBE: Vibe = {
  id: "builtin:apple",
  name: "Apple",
  description: "Restrained industrial luxury — product-first, editorial, lots of negative space.",
  swatch: ["#f5f5f7", "#1d1d1f", "#0071e3"],
  builtIn: true,
  styleGuide: `Use Apple's restrained industrial-luxury design language. Bright,
generous negative space; crisp near-black typography on white/soft-gray fields;
subtle finish accents drawn from Apple's product palette (Sky Blue, Starlight,
Silver, Midnight). Every slide should feel product-first and editorial — a single
focal subject (a clean device render, one big number, one tight diagram) with very
little ornamental clutter. Favor sharp grid alignment, high contrast, thin hairline
rules, and polished reflections over decorative effects, gradients or drop shadows.
Typography is the hero: large confident headlines, short punchy sub-lines, plenty of
breathing room. When the brief is about a product, present it like an Apple keynote
slide — calm, premium, and obsessively clean.`,
};

export const BUILTIN_VIBES: Vibe[] = [APPLE_VIBE];

export interface VibeGenInput {
  /** The current deck — kept for API parity with the cloud build. */
  deckId: string;
  description: string;
  url?: string;
  files?: File[];
}

/**
 * Demo vibe generation: returns a canned, plausible style guide after a short
 * delay (the cloud build runs a real AI analysis of the references here).
 */
export async function generateVibe(
  input: VibeGenInput
): Promise<Pick<Vibe, "name" | "description" | "styleGuide" | "swatch">> {
  await delay(1600);
  const hint = input.description.trim().split(/[.\n]/)[0].trim();
  return {
    name: "Midnight Editorial",
    description: hint
      ? hint.length > 48
        ? `${hint.slice(0, 48)}…`
        : hint
      : "Dark, luminous, magazine-grade slides.",
    styleGuide: `Use a dark editorial design language: near-black fields, one luminous
violet-to-cyan accent gradient, and oversized display headlines with tight tracking.
Favor a single strong focal element per slide — one image, one number, or one
diagram — framed by generous negative space and thin hairline rules. Keep body copy
short and confident; avoid clutter, drop shadows and more than two accent colours.
Photography and renders should be moody and softly lit, never flat clip-art.`,
    swatch: ["#0b0b12", "#7c6cff", "#38e1ff"],
  };
}

// ---- localStorage-backed custom vibes ----

function loadCustom(): Vibe[] {
  try {
    const raw = localStorage.getItem(VIBES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Vibe[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCustom(vibes: Vibe[]) {
  try {
    localStorage.setItem(VIBES_KEY, JSON.stringify(vibes));
  } catch {
    /* quota — ignore */
  }
}

/**
 * The user's custom vibes, kept in localStorage. The built-in presets are
 * merged in front of the custom ones for the picker.
 */
export function useVibes() {
  const [custom, setCustom] = useState<Vibe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCustom(loadCustom());
    setLoading(false);
  }, []);

  const mutate = useCallback((fn: (prev: Vibe[]) => Vibe[]) => {
    setCustom((prev) => {
      const next = fn(prev);
      saveCustom(next);
      return next;
    });
  }, []);

  /** Create a custom vibe; returns the saved vibe. */
  const createVibe = useCallback(
    async (input: Pick<Vibe, "name" | "description" | "styleGuide" | "swatch">) => {
      const vibe: Vibe = {
        id: uid(),
        name: input.name,
        description: input.description,
        styleGuide: input.styleGuide,
        swatch: input.swatch ?? [],
        published: false,
      };
      mutate((prev) => [vibe, ...prev]);
      return vibe;
    },
    [mutate]
  );

  const updateVibe = useCallback(
    async (id: string, input: Pick<Vibe, "name" | "description" | "styleGuide" | "swatch">) => {
      let updated: Vibe | null = null;
      mutate((prev) =>
        prev.map((v) => {
          if (v.id !== id) return v;
          updated = { ...v, ...input, swatch: input.swatch ?? [] };
          return updated;
        })
      );
      return updated as Vibe | null;
    },
    [mutate]
  );

  /** Share a vibe to the Community gallery (or unshare it). */
  const setVibePublished = useCallback(
    async (id: string, published: boolean) => {
      mutate((prev) => prev.map((v) => (v.id === id ? { ...v, published } : v)));
    },
    [mutate]
  );

  const deleteVibe = useCallback(
    async (id: string) => {
      mutate((prev) => prev.filter((v) => v.id !== id));
    },
    [mutate]
  );

  /** Built-in presets first, then the user's custom vibes. */
  const all: Vibe[] = [...BUILTIN_VIBES, ...custom];

  return { vibes: all, custom, loading, createVibe, updateVibe, deleteVibe, setVibePublished };
}

export type VibeStore = ReturnType<typeof useVibes>;

/** A community-published vibe, with its author's id so examples can be matched. */
export interface CommunityVibe extends Vibe {
  userId: string;
}

/** Every published vibe (the user's own shared ones in the demo). */
export async function loadCommunityVibes(): Promise<CommunityVibe[]> {
  return loadCustom()
    .filter((v) => v.published)
    .map((v) => ({ ...v, userId: "demo-user" }));
}
