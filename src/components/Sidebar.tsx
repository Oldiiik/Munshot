import {
  ChartBar as BarChart3,
  BookOpen,
  CaretRight,
  CaretLeft,
  CircleNotch as Loader2,
  GearSix as Settings2,
  GlobeHemisphereWest as Globe,
  Plus,
  Palette,
  SignOut as LogOut,
  Sparkle as Sparkles,
  SquaresFour as LayoutTemplate,
  TerminalWindow as Terminal,
  Trash as Trash2,
} from "@phosphor-icons/react";

import { cn, deckTitle } from "@/lib/utils";
import { ThemeToggle } from "@/lib/theme";
import { MoonLogo } from "./MoonLogo";
import type { DeckStore } from "@/store";
import type { Deck, View } from "@/types";
import { useAuth } from "@/auth/AuthContext";

interface Props {
  view: View;
  setView: (v: View) => void;
  decks: DeckStore;
  busy: boolean;
  /** Deck that currently owns the in-flight generation session, if any. */
  generatingDeckId: string | null;
  status: string;
  studioOpen: boolean;
  onNewDeck: () => void;
  onOpenDashboard: () => void;
  onOpenDeck: (id: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  isAdmin: boolean;
}

const NAV: { id: View; label: string; icon: typeof LayoutTemplate; adminOnly?: boolean }[] = [
  { id: "studio", label: "Library", icon: LayoutTemplate },
  { id: "learn", label: "Learn", icon: BookOpen },
  { id: "insights", label: "Insights", icon: BarChart3 },
  { id: "community", label: "Community", icon: Globe },
  { id: "vibes", label: "Vibes", icon: Palette },
  { id: "dev", label: "Activity", icon: Terminal, adminOnly: true },
  { id: "settings", label: "Settings", icon: Settings2 },
];

const PHASE_LABEL: Record<Deck["phase"], string> = {
  brief: "Brief",
  outline: "Outline",
  slides: "Slides",
};

export function Sidebar({
  view,
  setView,
  decks,
  busy,
  generatingDeckId,
  status,
  studioOpen,
  onNewDeck,
  onOpenDashboard,
  onOpenDeck,
  collapsed,
  onToggleCollapsed,
  isAdmin,
}: Props) {
  const { signOut, user } = useAuth();
  const visibleDecks = decks.decks.filter((d) => d.mode === "moonshot");
  const recentDecks = [...visibleDecks].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
  const accountLabel = (user?.email?.split("@")[0] ?? "Moonshot user").replace(/[._-]+/g, " ");
  const initials = accountLabel.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "M";
  return (
    <aside className={`ms-app-sidebar flex h-full flex-col overflow-hidden border-r border-sidebar-border bg-sidebar${collapsed ? " is-collapsed" : ""}`}>
      <div className="drag-region ms-reference-brand">
        <div className="no-drag ms-sidebar-brand flex items-center gap-2.5">
          <MoonLogo className="ms-sidebar-logo size-6" />
          <p className="ms-sidebar-wordmark whitespace-nowrap text-sm font-semibold tracking-tight">Moonshot</p>
          <button type="button" className="ms-sidebar-collapse" onClick={onToggleCollapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <CaretRight /> : <CaretLeft />}</button>
        </div>
      </div>

      <div className="no-drag ms-reference-compose-wrap">
        <button type="button" onClick={onNewDeck} disabled={busy} className="ms-reference-compose" title={collapsed ? "Compose deck" : undefined} aria-label="Compose deck">
          <Sparkles weight="duotone" /><span className="ms-sidebar-compose-label">Compose deck</span>
        </button>
      </div>

      <nav className="no-drag ms-reference-nav">
        <span className="ms-sidebar-section-label">Workspace</span>
        {NAV.filter((n) => !n.adminOnly || isAdmin).map(({ id, label, icon: Icon }) => {
          const activeNav = view === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => id === "studio" ? onOpenDashboard() : setView(id)}
              title={collapsed ? label : undefined}
              aria-label={label}
              aria-current={activeNav ? "page" : undefined}
              className={cn(
                "relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                activeNav && "is-active",
                activeNav
                  ? "text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon weight={activeNav ? "fill" : "regular"} className="relative z-10 size-4" />
              <span className="ms-sidebar-nav-label relative z-10">{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="no-drag ms-reference-decks-head">
        <span className="ms-sidebar-section-label">Recent</span>
        <button
          type="button"
          onClick={onNewDeck}
          disabled={busy}
          title="New deck"
          className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground disabled:opacity-40"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <div className="no-drag ms-reference-decks min-h-0 flex-1 overflow-y-auto">
        {recentDecks.map((d) => {
          const activeDeck = view === "studio" && studioOpen && d.id === decks.activeId;
          const deckBusy = d.id === generatingDeckId;
          return (
            <div
              key={d.id}
              className={cn(
                "group flex items-center gap-2 px-1 py-1.5 text-sm transition-colors",
                activeDeck
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              )}
            >
              <button
                type="button"
                onClick={() => onOpenDeck(d.id)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="flex items-center gap-1.5">
                  {deckBusy && (
                    <Loader2 className="size-3 shrink-0 animate-spin text-emerald-400" />
                  )}
                  <span className="truncate">{deckTitle(d)}</span>
                </span>
                <span className="block truncate text-[10.5px] text-muted-foreground">
                  {deckBusy
                    ? "Generating…"
                    : `${PHASE_LABEL[d.phase]} · ${d.slideCount} slides`}
                </span>
              </button>
              <button
                type="button"
                onClick={() => decks.deleteDeck(d.id)}
                disabled={busy}
                title="Delete deck"
                className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-destructive/15 hover:text-destructive group-hover:opacity-100 disabled:opacity-0"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="no-drag ms-reference-account">
        <button type="button" className="ms-sidebar-profile" onClick={() => setView("settings")}>
          <span className="ms-sidebar-avatar">{initials}<i className={busy ? "is-working" : ""} /></span>
          <span className="ms-sidebar-profile-copy"><strong>{accountLabel}</strong><small>{busy ? status || "Moonshot is working" : user?.email ?? "Personal workspace"}</small></span>
          <CaretRight />
        </button>
        <div className="ms-sidebar-profile-actions">
          <span>{busy ? "Working" : "Personal workspace"}</span>
          <div>
            <ThemeToggle className="size-7" />
            <button
              type="button"
              onClick={() => void signOut()}
              title="Sign out"
              aria-label="Sign out"
              className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
