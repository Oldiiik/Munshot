import type { StartTurnArgs } from "./api";
import { startTurn } from "./api";
import type { CodexEvent } from "../types";
import { delay, nextFakeSlideImage } from "./demo";

// Demo replacement for the cloud Codex bridge. Turns resolve locally after a
// short simulated delay: outlines return a canned planner JSON derived from the
// brief, slides "render" one of the bundled sample images.

export interface CloudTurnResult {
  turnId: string;
  /** Concatenated agent_message text (the outline planner JSON lives here). */
  text: string;
  /** Thread id captured from thread.started (null when resuming a thread). */
  threadId: string | null;
  /** Paths of any PNGs rendered during the turn. */
  imagePaths: string[];
  error: string | null;
}

export interface CloudTurnHooks {
  /** Fired once the turn is enqueued — gives the caller its id (for Stop). */
  onStart?: (turnId: string) => void;
  onEvent?: (event: CodexEvent) => void;
  onImage?: (storagePath: string) => void;
  onStatus?: (status: string) => void;
}

/** Pull "Number of slides: N" out of the built outline prompt. */
function slideCountFrom(prompt: string): number {
  const m = prompt.match(/Number of slides:\s*(\d+)/i);
  const n = m ? parseInt(m[1], 10) : 6;
  return Math.max(1, Math.min(12, Number.isFinite(n) ? n : 6));
}

/** Pull the first line of the user's brief out of the built outline prompt. */
function topicFrom(prompt: string): string {
  const m = prompt.match(/Topic \/ brief:\s*\n([^\n]+)/);
  const line = (m?.[1] ?? "").trim();
  if (!line || line === "(no description given)") return "Your big idea";
  return line.length > 60 ? `${line.slice(0, 60)}…` : line;
}

interface CannedSlide {
  title: string;
  brief: string;
  notes: string;
  visual: string;
  layout: string;
}

/** A plausible planner reply shaped from the user's topic text. */
function cannedOutline(prompt: string): string {
  const count = slideCountFrom(prompt);
  const topic = topicFrom(prompt);
  const name = topic.replace(/[.!?]+$/, "").split(/[,—–:]/)[0].trim().slice(0, 40);

  const pool: CannedSlide[] = [
    { title: name, brief: "Title slide — set the stage with one bold statement.", notes: `Hero headline for "${name}" with a one-line promise beneath.`, visual: "Full-bleed hero image with a subtle brand motif", layout: "Centered headline over full-bleed art" },
    { title: "The problem", brief: "Why the status quo fails the audience.", notes: "Three sharp pain points, each one line, grounded in the brief.", visual: "Icon row of the three pain points", layout: "Title top-left, three columns below" },
    { title: "The opportunity", brief: "Size the moment with one big number.", notes: "One headline market stat plus two supporting figures.", visual: "Big-number stat with a rising curve behind it", layout: "Centered big number, supporting stats beneath" },
    { title: "How it works", brief: "The idea in three simple steps.", notes: "Step 1 → 2 → 3 with a short caption each.", visual: "Horizontal three-step flow diagram", layout: "Title band top, flow diagram across the middle" },
    { title: "The product", brief: "Show, don't tell — the product in action.", notes: "A single product visual with two callouts.", visual: "Product mock with labelled callouts", layout: "Product right, copy left" },
    { title: "Why now", brief: "The shift that makes this possible today.", notes: "Timeline of the enabling trend, ending at today.", visual: "Timeline diagram", layout: "Full-width timeline, title centered above" },
    { title: "Proof it works", brief: "Evidence: traction, results, or a worked example.", notes: "Two or three proof points with concrete numbers.", visual: "Comparison chart of before vs after", layout: "Split left/right comparison" },
    { title: "Under the hood", brief: "What powers it — the credible details.", notes: "A simple architecture or method sketch, three labels max.", visual: "Labelled schematic diagram", layout: "Diagram center, caption strip below" },
    { title: "The plan", brief: "Where this goes next.", notes: "Three milestones with dates.", visual: "Roadmap with three milestones", layout: "Title top, roadmap steps stacked" },
    { title: "The team", brief: "Who's behind it.", notes: "Two or three people, one line of credibility each.", visual: "Portrait row with role captions", layout: "Three portrait cards, title centered" },
    { title: "The ask", brief: "What you want from the audience.", notes: "One clear ask plus what it unlocks.", visual: "Quote-style card with the ask", layout: "Quote centered with attribution" },
    { title: "Thank you", brief: "Close with the one line to remember.", notes: "Closing line and contact.", visual: "Minimal closing card with brand mark", layout: "Bottom-anchored title, sparse field above" },
  ];

  const slides = Array.from({ length: count }, (_, i) => pool[i % pool.length]);
  const reply: Record<string, unknown> = {
    brand: {
      name,
      palette: ["#0b0b12", "#7c6cff", "#38e1ff", "#f5f5f7"],
      typography: "Confident geometric sans with generous headline sizes",
      tone: "Bold, optimistic, credible",
      summary: `A dark, luminous identity for "${name}" — near-black fields, a violet-to-cyan accent gradient, oversized display type and one strong focal visual per slide.`,
    },
    slides,
  };
  if (/Clarify mode is ON/i.test(prompt)) {
    reply.questions = [
      "Who exactly is the audience for this deck?",
      "Is there a specific metric or proof point you want highlighted?",
    ];
  }
  return JSON.stringify(reply);
}

/**
 * Run one simulated turn and resolve once it finishes. Streams a couple of
 * status events through the hooks so the UI shows life while it "thinks".
 */
export async function runCloudTurn(
  args: StartTurnArgs,
  hooks: CloudTurnHooks = {}
): Promise<CloudTurnResult> {
  const { turnId } = await startTurn(args);
  hooks.onStart?.(turnId);

  const result: CloudTurnResult = {
    turnId,
    text: "",
    threadId: null,
    imagePaths: [],
    error: null,
  };

  hooks.onEvent?.({ type: "turn.started" });
  hooks.onStatus?.("Reasoning…");
  hooks.onEvent?.({
    type: "item.started",
    item: { id: uidLike(), type: "reasoning" },
  });

  if (args.kind === "outline") {
    await delay(900);
    hooks.onStatus?.("Studying the brief & sketching slides…");
    hooks.onEvent?.({
      type: "item.started",
      item: { id: uidLike(), type: "command_execution", command: "plan deck" },
    });
    await delay(1100);
    result.text = cannedOutline(args.prompt);
    result.threadId = `demo-thread-${args.deckId}`;
    hooks.onEvent?.({
      type: "item.completed",
      item: { id: uidLike(), type: "agent_message", text: result.text },
    });
  } else if (args.kind === "slide") {
    hooks.onStatus?.("Rendering the slide…");
    await delay(1500);
    const image = nextFakeSlideImage(args.deckId);
    result.imagePaths.push(image);
    hooks.onImage?.(image);
  } else {
    // "canva" hand-off — not available in the frontend-only demo.
    await delay(600);
    result.error = "Canva hand-off isn't available in this demo build.";
  }

  hooks.onEvent?.({ type: "turn.completed", usage: { input_tokens: 6200, cached_input_tokens: 3800, output_tokens: 900 } });
  return result;
}

function uidLike(): string {
  return Math.random().toString(36).slice(2);
}

/** Pull the first JSON object out of a reply (tolerates fences/prose). */
export function extractJson<T = unknown>(raw: string): T | null {
  if (!raw) return null;
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
