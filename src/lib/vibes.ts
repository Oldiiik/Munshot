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

function toHex(value: number) {
  return value.toString(16).padStart(2, "0");
}

function colourDistance(left: string, right: string) {
  const values = (value: string) => [1, 3, 5].map((index) => Number.parseInt(value.slice(index, index + 2), 16));
  const [lr, lg, lb] = values(left);
  const [rr, rg, rb] = values(right);
  return Math.hypot(lr - rr, lg - rg, lb - rb);
}

async function sampledImagePalette(file: File): Promise<string[]> {
  if (!file.type.startsWith("image/")) return [];
  const source = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = source;
    await image.decode();
    const canvas = document.createElement("canvas");
    const size = 40;
    canvas.width = size;
    canvas.height = Math.max(1, Math.round(size * (image.naturalHeight / image.naturalWidth)));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return [];
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const buckets = new Map<string, number>();
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let index = 0; index < data.length; index += 16) {
      if (data[index + 3] < 180) continue;
      const r = Math.round(data[index] / 32) * 32;
      const g = Math.round(data[index + 1] / 32) * 32;
      const b = Math.round(data[index + 2] / 32) * 32;
      const key = `#${toHex(Math.min(r, 255))}${toHex(Math.min(g, 255))}${toHex(Math.min(b, 255))}`;
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    const palette: string[] = [];
    for (const [colour] of [...buckets.entries()].sort((left, right) => right[1] - left[1])) {
      if (palette.every((picked) => colourDistance(picked, colour) > 78)) palette.push(colour);
      if (palette.length === 3) break;
    }
    return palette;
  } catch {
    return [];
  } finally {
    URL.revokeObjectURL(source);
  }
}

function fallbackPalette(signal: string) {
  if (/warm|paper|heritage|editorial|earth|craft/.test(signal)) return ["#211c18", "#b78352", "#f1e3cf"];
  if (/blue|product|tech|clean|apple|minimal/.test(signal)) return ["#111827", "#6d93dc", "#eff4fb"];
  if (/nature|green|organic|calm|wellness/.test(signal)) return ["#12211d", "#7ba88e", "#edf4ec"];
  if (/bold|red|sport|energy|music/.test(signal)) return ["#1a1418", "#dc5d61", "#fff2ef"];
  return ["#151722", "#8c7cff", "#edf0ff"];
}

function directionName(signal: string) {
  if (/warm|paper|heritage|editorial|earth|craft/.test(signal)) return "Tactile editorial";
  if (/blue|product|tech|clean|apple|minimal/.test(signal)) return "Product clarity";
  if (/nature|green|organic|calm|wellness/.test(signal)) return "Grounded calm";
  if (/bold|red|sport|energy|music/.test(signal)) return "Kinetic contrast";
  return "Reference study";
}

/**
 * Reference-aware demo generation. Image files contribute sampled colour
 * signals; PDF/doc names, URLs, and the user's note inform the written guide.
 * A production worker can replace this one function without changing the UI.
 */
export async function generateVibe(
  input: VibeGenInput
): Promise<Pick<Vibe, "name" | "description" | "styleGuide" | "swatch">> {
  await delay(720);
  const files = input.files ?? [];
  const fileSignal = files.map((file) => file.name.replace(/[-_]/g, " ")).join(" ");
  const signal = `${input.description} ${input.url ?? ""} ${fileSignal}`.toLowerCase();
  const sampled = (await Promise.all(files.map(sampledImagePalette))).flat();
  const palette = sampled.length >= 2 ? [...sampled, ...fallbackPalette(signal)].slice(0, 3) : fallbackPalette(signal);
  const hint = input.description.trim().split(/[.\n]/)[0].trim();
  const sources = [
    input.url ? "linked reference" : "",
    files.length ? `${files.length} uploaded ${files.length === 1 ? "reference" : "references"}` : "",
    hint ? "creative note" : "",
  ].filter(Boolean).join(", ");
  return {
    name: directionName(signal),
    description: hint
      ? hint.length > 48
        ? `${hint.slice(0, 48)}…`
        : hint
      : `A reusable direction distilled from ${sources || "your references"}.`,
    styleGuide: `Build from the visual signals in ${sources || "the supplied references"}. Use ${palette[0]} as the anchoring field, ${palette[1]} for emphasis, and ${palette[2]} for light or contrast. Keep the composition deliberate: establish one focal subject, use a visible grid, and give captions and data a quieter supporting role. Carry the reference's material, crop rhythm, and type scale forward without copying its exact layout or branding. Avoid generic gradients, decorative UI fragments, and unrelated stock imagery.`,
    swatch: palette,
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
    (input: Pick<Vibe, "name" | "description" | "styleGuide" | "swatch">) => {
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
    (id: string, input: Pick<Vibe, "name" | "description" | "styleGuide" | "swatch">) => {
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
    (id: string, published: boolean) => {
      mutate((prev) => prev.map((v) => (v.id === id ? { ...v, published } : v)));
    },
    [mutate]
  );

  const deleteVibe = useCallback(
    (id: string) => {
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
