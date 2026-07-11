import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Deck } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Display name for a deck. The stored `title` is only set once an outline runs
 *  (from the inferred brand name), so brief-phase decks all keep the default
 *  "Untitled deck". Fall back to the first line of the brief so un-generated
 *  decks (e.g. fresh edu drafts) still show something recognizable. */
export function deckTitle(deck: Pick<Deck, "title" | "brief">): string {
  const title = deck.title?.trim();
  if (title && title !== "Untitled deck") return title;
  const firstLine = deck.brief?.trim().split("\n")[0].trim();
  if (firstLine) return firstLine.length > 48 ? `${firstLine.slice(0, 48)}…` : firstLine;
  return "Untitled deck";
}

/** Scrub the internal engine name out of any message shown to users. Applied at
 *  the display boundary so even errors stored on older rows never leak it. */
export function cleanMessage(message: string | null | undefined): string {
  return (message ?? "").replace(/codex/gi, "the generator");
}
