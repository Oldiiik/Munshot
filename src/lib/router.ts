import { useSyncExternalStore } from "react";

// Lightweight pathname router: history.pushState + a popstate/custom-event
// subscription. No react-router — the app only needs a handful of routes.

const NAV_EVENT = "moonshot:navigate";

/** Push a new path (no-op if already there) and notify subscribers. */
export function navigate(path: string, opts: { replace?: boolean } = {}) {
  if (window.location.pathname === path) return;
  if (opts.replace) window.history.replaceState(null, "", path);
  else window.history.pushState(null, "", path);
  window.dispatchEvent(new Event(NAV_EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener("popstate", cb);
  window.addEventListener(NAV_EVENT, cb);
  return () => {
    window.removeEventListener("popstate", cb);
    window.removeEventListener(NAV_EVENT, cb);
  };
}

/** The current pathname, re-rendering on push/pop navigation. */
export function usePathname(): string {
  return useSyncExternalStore(subscribe, () => window.location.pathname);
}
