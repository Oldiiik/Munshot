import type { CodexUsage } from "../types";
import { delay } from "./demo";
import { uid } from "../store";

// Demo replacements for the worker + Supabase edge-function client. Every call
// resolves locally — there is no backend in this build.

export interface StartTurnArgs {
  deckId: string;
  prompt: string;
  directive: string;
  kind: "outline" | "slide" | "canva";
  outlineId?: string;
  label?: string;
  /** Enable the planner's research mode (no-op in the demo). */
  webSearch?: boolean;
  /** Extra reference attachments for this turn (no-op in the demo). */
  attachments?: { name: string; storagePath: string }[];
}

/** "Enqueue" a turn — returns a fake turn id immediately. */
export async function startTurn(
  _args: StartTurnArgs
): Promise<{ turnId: string; queuePosition: number }> {
  return { turnId: uid(), queuePosition: 0 };
}

/** Stop a running turn (no-op in the demo). */
export async function stopTurn(_turnId: string): Promise<void> {
  /* no-op */
}

/** Static, plausible subscription usage for the (admin-only) usage meter. */
export async function fetchUsage(): Promise<unknown> {
  const now = Date.now() / 1000;
  const usage: CodexUsage = {
    primary: { usedPercent: 34, windowMinutes: 300, resetsAt: now + 2.6 * 3600 },
    secondary: { usedPercent: 58, windowMinutes: 10080, resetsAt: now + 3.2 * 86400 },
    planType: "demo",
    timestamp: new Date().toISOString(),
  };
  return usage;
}

export interface RegisterArgs {
  email: string;
  password: string;
}

/** Demo registration: always succeeds. */
export async function register(_args: RegisterArgs): Promise<{ userId: string }> {
  await delay(300);
  return { userId: "demo-user" };
}

/** Demo code redemption: any code works and grants generous capacity. */
export async function redeemDeckCode(
  _code: string
): Promise<{ allowance: number; used: number; granted: number }> {
  await delay(400);
  return { allowance: 999, used: 0, granted: 999 };
}

/**
 * "Upload" a brand asset. In the demo the file never leaves the browser — for
 * images we return an object URL so previews still work, otherwise a fake path.
 */
export async function uploadAttachment(
  deckId: string,
  file: File
): Promise<{ storagePath: string }> {
  await delay(200);
  if (file.type.startsWith("image/")) {
    return { storagePath: URL.createObjectURL(file) };
  }
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return { storagePath: `demo/${deckId}/${uid()}-${safe}` };
}

/** Signed URLs don't exist in the demo — the path IS the URL. */
export async function signedAttachmentUrl(storagePath: string): Promise<string | null> {
  return storagePath;
}
