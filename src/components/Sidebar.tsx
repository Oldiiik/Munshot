import { AnimatePresence, motion } from "motion/react";
import {
  Sparkles,
  GraduationCap,
  LayoutTemplate,
  BarChart3,
  Globe,
  Terminal,
  Settings2,
  Shield,
  Plus,
  Trash2,
  LogOut,
  Loader2,
  Send,
  Ticket,
  Check,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { cn, deckTitle } from "@/lib/utils";
import { ThemeToggle } from "@/lib/theme";
import { MoonLogo } from "./MoonLogo";
import type { DeckStore } from "@/store";
import type { Deck, Mode, View } from "@/types";
import { UsageMeter } from "./UsageMeter";
import { useAuth } from "@/auth/AuthContext";
import { redeemDeckCode } from "@/lib/api";
import { DEFAULT_DECK_ALLOWANCE } from "@/limits";

interface Props {
  view: View;
  setView: (v: View) => void;
  decks: DeckStore;
  mode: Mode;
  onModeChange: (m: Mode) => void;
  busy: boolean;
  /** Deck that currently owns the in-flight generation session, if any. */
  generatingDeckId: string | null;
  status: string;
  onNewDeck: () => void;
  isAdmin: boolean;
}

const NAV: { id: View; label: string; icon: typeof LayoutTemplate; adminOnly?: boolean }[] = [
  { id: "studio", label: "Studio", icon: LayoutTemplate },
  { id: "insights", label: "Insights", icon: BarChart3 },
  { id: "community", label: "Community", icon: Globe },
  { id: "admin", label: "Admin", icon: Shield, adminOnly: true },
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
  mode,
  onModeChange,
  busy,
  generatingDeckId,
  status,
  onNewDeck,
  isAdmin,
}: Props) {
  const edu = mode === "edu";
  const { profile, user, signOut, refreshProfile } = useAuth();
  const visibleDecks = decks.decks.filter((d) => d.mode === mode);

  // Total tokens spent across every deck — feeds the usage meter's cost view.
  const tokens = decks.decks.reduce(
    (acc, d) => {
      for (const s of d.stats) {
        acc.input += s.usage.inputTokens;
        acc.output += s.usage.outputTokens;
        acc.cached += s.usage.cachedInputTokens;
      }
      return acc;
    },
    { input: 0, output: 0, cached: 0 }
  );
  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-[22px] border border-sidebar-border bg-sidebar shadow-[0_30px_80px_-40px_rgba(0,0,0,0.6)]">
      {/* Brand + explicit product switch */}
      <div className="drag-region flex flex-col gap-2 px-3 pb-1 pt-3">
        <div className="no-drag flex items-center gap-2.5 px-1">
          <div
            className={cn(
              "relative grid size-7 place-items-center overflow-hidden rounded-lg",
              edu ? "bg-primary text-primary-foreground" : "bg-[#e8edf7]"
            )}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={mode}
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -14, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 34 }}
                className="grid place-items-center"
              >
                {edu ? <GraduationCap className="size-4" /> : <MoonLogo className="size-5" />}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="overflow-hidden leading-tight">
            <p className="whitespace-nowrap text-sm font-semibold tracking-tight">
              {edu ? (
                <>
                  Moonshot
                  <span className="text-primary">.edu</span>
                </>
              ) : (
                "Moonshot"
              )}
            </p>
            <p className="whitespace-nowrap text-[10.5px] text-muted-foreground">
              {edu ? "curriculum → lesson" : "brand → deck"}
            </p>
          </div>
        </div>
        <ModeToggle mode={mode} onChange={onModeChange} busy={busy} />
      </div>

      {/* Nav */}
      <nav className="no-drag space-y-0.5 px-2.5 pt-2">
        {NAV.filter((n) => !n.adminOnly || isAdmin).map(({ id, label, icon: Icon }) => {
          const activeNav = view === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={cn(
                "relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                activeNav
                  ? "text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {activeNav && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-lg bg-sidebar-accent"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className="relative z-10 size-4" />
              <span className="relative z-10">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Decks */}
      <div className="no-drag mt-4 flex items-center justify-between px-4 pb-1">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
          Decks
        </span>
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

      <div className="no-drag min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2.5">
        {visibleDecks.map((d) => {
          const activeDeck = view === "studio" && d.id === decks.activeId;
          const deckBusy = d.id === generatingDeckId;
          return (
            <div
              key={d.id}
              className={cn(
                "group flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors",
                activeDeck
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              )}
            >
              <button
                type="button"
                onClick={() => {
                  decks.setActiveId(d.id);
                  setView("studio");
                }}
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

      <div className="no-drag space-y-2 border-t border-sidebar-border px-3 py-3">
        {isAdmin ? (
          <UsageMeter refreshKey={busy} tokens={tokens} />
        ) : (
          <DeckCapacity
            userId={user?.id ?? null}
            allowance={profile?.deck_allowance ?? DEFAULT_DECK_ALLOWANCE}
            used={profile?.decks_generated ?? 0}
            onSubmitted={() => void refreshProfile()}
          />
        )}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="relative flex size-2 shrink-0">
              {busy && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              )}
              <span
                className={cn(
                  "relative inline-flex size-2 rounded-full",
                  busy ? "bg-emerald-400" : "bg-muted-foreground/50"
                )}
              />
            </span>
            <span className="truncate text-[11px] text-muted-foreground">
              {busy ? status || "Working…" : "Idle"}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle className="size-7" />
            <button
              type="button"
              onClick={() => void signOut()}
              title="Sign out"
              aria-label="Sign out"
              className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
            >
              <LogOut className="size-4" strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

/** Segmented two-option switch between the Moonshot and Edu products. */
function ModeToggle({
  mode,
  onChange,
  busy,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
  busy: boolean;
}) {
  const opts = [
    { id: "moonshot" as const, label: "Moonshot", icon: Sparkles },
    { id: "edu" as const, label: "Edu", icon: GraduationCap },
  ];
  return (
    <div className="no-drag grid grid-cols-2 gap-1 rounded-lg border border-sidebar-border bg-sidebar-accent/30 p-1">
      {opts.map(({ id, label, icon: Icon }) => {
        const active = mode === id;
        return (
          <button
            key={id}
            type="button"
            disabled={busy}
            onClick={() => onChange(id)}
            aria-pressed={active}
            className={cn(
              "relative flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
              active
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId="mode-active"
                className="absolute inset-0 rounded-md bg-primary"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <Icon className="relative z-10 size-3.5" />
            <span className="relative z-10">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function DeckCapacity({
  userId,
  allowance,
  used,
  onSubmitted,
}: {
  userId: string | null;
  allowance: number;
  used: number;
  onSubmitted: () => void;
}) {
  const [requested, setRequested] = useState(2);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [codeMsg, setCodeMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Demo: capacity requests don't go anywhere — track them locally so the UI
  // still responds.
  const loadPending = useCallback(async () => {
    if (!userId) return;
    setPending((p) => p ?? 0);
  }, [userId]);

  useEffect(() => {
    void loadPending();
  }, [loadPending]);

  const remaining = Math.max(0, allowance - used);

  const redeem = async () => {
    const c = code.trim();
    if (!c || redeeming) return;
    setRedeeming(true);
    setCodeMsg(null);
    try {
      const { granted } = await redeemDeckCode(c);
      setCode("");
      setCodeMsg({ ok: true, text: `+${granted} deck${granted === 1 ? "" : "s"} added` });
      onSubmitted();
    } catch (err) {
      setCodeMsg({ ok: false, text: err instanceof Error ? err.message : "Could not redeem." });
    } finally {
      setRedeeming(false);
    }
  };

  const submit = async () => {
    if (!userId || sending) return;
    setSending(true);
    // Demo: pretend the request was filed.
    await new Promise((r) => setTimeout(r, 300));
    setSending(false);
    setReason("");
    setPending((p) => (p ?? 0) + Math.max(1, Math.min(20, requested)));
    onSubmitted();
  };

  return (
    <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/35 p-2.5">
      {/* Redeem a capacity code */}
      <div className="mb-2.5 border-b border-sidebar-border/70 pb-2.5">
        <div className="flex items-center gap-1.5">
          <Ticket className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setCodeMsg(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void redeem();
            }}
            placeholder="Have a code?"
            autoCapitalize="characters"
            className="h-7 min-w-0 flex-1 rounded-md border border-sidebar-border bg-background/70 px-2 text-xs uppercase tracking-wide outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground/60 focus:border-primary"
            aria-label="Redeem a deck capacity code"
          />
          <button
            type="button"
            onClick={() => void redeem()}
            disabled={!code.trim() || redeeming}
            className="grid size-7 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
            title="Redeem code"
            aria-label="Redeem code"
          >
            {redeeming ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
          </button>
        </div>
        {codeMsg && (
          <p className={cn("mt-1.5 text-[10.5px]", codeMsg.ok ? "text-emerald-400" : "text-destructive")}>
            {codeMsg.text}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="font-medium text-sidebar-accent-foreground">Deck capacity</span>
        <span className="tabular-nums text-muted-foreground">
          {used}/{allowance}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background/60">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.min(100, (used / Math.max(allowance, 1)) * 100)}%` }}
        />
      </div>
      <p className="mt-1.5 text-[10.5px] text-muted-foreground">
        {remaining > 0 ? `${remaining} deck${remaining === 1 ? "" : "s"} left` : "Limit reached"}
        {pending ? ` · ${pending} pending` : ""}
      </p>
      <div className="mt-2 flex items-center gap-1.5">
        <input
          type="number"
          min={1}
          max={20}
          value={requested}
          onChange={(e) => setRequested(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
          className="h-7 w-12 rounded-md border border-sidebar-border bg-background/70 px-1.5 text-xs tabular-nums outline-none focus:border-primary"
          aria-label="Decks to request"
        />
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="request more"
          className="h-7 min-w-0 flex-1 rounded-md border border-sidebar-border bg-background/70 px-2 text-xs outline-none placeholder:text-muted-foreground/60 focus:border-primary"
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!userId || sending}
          className="grid size-7 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
          title="Request more decks"
          aria-label="Request more decks"
        >
          <Send className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
