import { useCallback, useEffect, useState } from "react";
import type { Settings } from "./types";
import { DEFAULT_SETTINGS } from "./lib/prompts";
import { MAX_SLIDES } from "./limits";

// Bumped to v4 so the slide directives that vary per-slide composition (and the
// outline directive's new per-slide "layout" field) reach users who had the older
// defaults cached in localStorage.
const STORAGE_KEY = "moonshot.settings.v4";

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    // Merge so newly-added fields fall back to defaults.
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      defaultSlideCount: Math.max(
        1,
        Math.min(MAX_SLIDES, parsed.defaultSlideCount ?? DEFAULT_SETTINGS.defaultSlideCount)
      ),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => load());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* quota — ignore */
    }
  }, [settings]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      next.defaultSlideCount = Math.max(1, Math.min(MAX_SLIDES, next.defaultSlideCount));
      return next;
    });
  }, []);

  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  return { settings, update, reset };
}
