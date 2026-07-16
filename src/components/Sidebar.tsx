import {
  BookOpen,
  CaretLeft,
  CaretRight,
  ChartBar as BarChart3,
  GearSix as Settings2,
  GlobeHemisphereWest as Globe,
  Palette,
  Plus,
  SignOut as LogOut,
  SquaresFour as LayoutTemplate,
  TerminalWindow as Terminal,
} from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/lib/theme";
import { MoonLogo } from "./MoonLogo";
import type { DeckStore } from "@/store";
import type { View } from "@/types";
import { useAuth } from "@/auth/AuthContext";

interface Props {
  view: View;
  setView: (v: View) => void;
  decks: DeckStore;
  busy: boolean;
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
  { id: "studio", label: "Home", icon: LayoutTemplate },
  { id: "community", label: "Community", icon: Globe },
  { id: "learn", label: "Learn", icon: BookOpen },
  { id: "insights", label: "Insights", icon: BarChart3 },
  { id: "vibes", label: "Brand", icon: Palette },
  { id: "dev", label: "Activity", icon: Terminal, adminOnly: true },
  { id: "settings", label: "Settings", icon: Settings2 },
];

export function Sidebar({
  view,
  setView,
  busy,
  onNewDeck,
  onOpenDashboard,
  collapsed,
  onToggleCollapsed,
  isAdmin,
}: Props) {
  const { signOut, user } = useAuth();
  const accountLabel = (user?.email?.split("@")[0] ?? "Moonshot user").replace(/[._-]+/g, " ");
  const initials = accountLabel
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "M";

  return (
    <aside className={`ms-app-sidebar flex h-full flex-col overflow-hidden${collapsed ? " is-collapsed" : ""}`}>
      <button
        type="button"
        className="no-drag ms-sidebar-rail-toggle"
        onClick={onToggleCollapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <CaretRight weight="bold" /> : <CaretLeft weight="bold" />}
      </button>

      <div className="drag-region ms-reference-brand">
        <div className="no-drag ms-sidebar-brand">
          <MoonLogo className="ms-sidebar-logo" />
          <p className="ms-sidebar-wordmark"><strong>Moonshot</strong></p>
        </div>
      </div>

      <div className="no-drag ms-reference-compose-wrap">
        <button type="button" onClick={onNewDeck} disabled={busy} className="ms-reference-compose" title={collapsed ? "New presentation" : undefined} aria-label="New presentation">
          <Plus weight="bold" /><span className="ms-sidebar-compose-label">New presentation</span>
        </button>
      </div>

      <nav className="no-drag ms-reference-nav">
        <span className="ms-sidebar-section-label">Workspace</span>
        {NAV.filter((item) => !item.adminOnly || isAdmin).map(({ id, label, icon: Icon }) => {
          const active = view === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => id === "studio" ? onOpenDashboard() : setView(id)}
              title={collapsed ? label : undefined}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(active && "is-active")}
            >
              <span className="ms-sidebar-nav-icon"><Icon weight={active ? "fill" : "regular"} /></span>
              <span className="ms-sidebar-nav-label">{label}</span>
              {active && <i className="ms-sidebar-active-mark" aria-hidden="true" />}
            </button>
          );
        })}
      </nav>

      <div className="ms-sidebar-spacer" aria-hidden="true" />

      <div className="no-drag ms-reference-account">
        <button type="button" className="ms-sidebar-profile" onClick={() => setView("settings")}>
          <span className="ms-sidebar-avatar">{initials}<i className={busy ? "is-working" : ""} /></span>
          <span className="ms-sidebar-profile-copy"><strong>{accountLabel}</strong></span>
        </button>
        <div className="ms-sidebar-profile-actions">
          <ThemeToggle className="size-8" />
          <button type="button" onClick={() => void signOut()} title="Sign out" aria-label="Sign out"><LogOut /></button>
        </div>
      </div>
    </aside>
  );
}
