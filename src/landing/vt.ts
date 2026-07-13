import { flushSync } from "react-dom";

/**
 * Runs a state update inside a native View Transition when supported, giving a
 * single GPU-composited cross-fade of the whole page — far smoother (and far
 * cheaper) than transitioning hundreds of individual elements. Falls back to an
 * instant update where the API or reduced-motion says no.
 */
export function runViewTransition(update: () => void, opts?: { slow?: boolean }) {
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { finished?: Promise<unknown> };
  };
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  if (doc.startViewTransition && !reduce) {
    const root = document.documentElement;
    if (opts?.slow) root.classList.add("ms-vt-slow");
    const t = doc.startViewTransition(() => flushSync(update));
    if (opts?.slow) {
      Promise.resolve(t.finished).finally(() =>
        root.classList.remove("ms-vt-slow")
      );
    }
  } else {
    update();
  }
}
