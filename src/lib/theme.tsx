import { useSyncExternalStore } from "react";
import { motion } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { runViewTransition } from "@/landing/vt";

export type Theme = "dark" | "light";
const KEY = "moonshot:theme";

function read(): Theme {
  if (typeof localStorage === "undefined") return "dark";
  return localStorage.getItem(KEY) === "light" ? "light" : "dark";
}

/** Toggle the global `.ms-light` class that every surface reads its theme from. */
export function applyThemeClass(t: Theme) {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("ms-light", t === "light");
  }
}

let current: Theme = read();
applyThemeClass(current);

const listeners = new Set<() => void>();
function emit() {
  for (const l of listeners) l();
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function setTheme(t: Theme) {
  if (t === current) return;
  current = t;
  localStorage.setItem(KEY, t);
  applyThemeClass(t);
  emit();
}

/** Shared theme state — every `useTheme()` reflects the same value and updates
 *  in sync, so a toggle anywhere flips the whole product. */
export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    () => current,
    () => "dark" as Theme
  );
  const toggle = () =>
    runViewTransition(() => setTheme(theme === "dark" ? "light" : "dark"));
  return { theme, toggle, setTheme };
}

/** The round sun/moon toggle used across landing, auth and the dashboard. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light" : "Switch to dark"}
      className={`ms-glass-subtle relative grid size-8 place-items-center overflow-hidden rounded-full text-foreground/70 transition-colors hover:text-foreground ${className}`}
    >
      <motion.span
        key={theme}
        initial={{ y: dark ? 12 : -12, opacity: 0, rotate: dark ? -40 : 40 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="absolute"
      >
        {dark ? <Moon className="size-[15px]" /> : <Sun className="size-[15px]" />}
      </motion.span>
    </button>
  );
}
