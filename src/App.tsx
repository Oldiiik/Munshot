import { useCallback, useEffect, useRef, useState } from "react";
import { Ticket, Loader2 } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

import { Sidebar } from "./components/Sidebar";
import { BriefForm } from "./components/studio/BriefForm";
import { OutlineEditor } from "./components/studio/OutlineEditor";
import { SlideDeck } from "./components/studio/SlideDeck";
import { DevConsole } from "./components/DevConsole";
import { InsightsView } from "./components/InsightsView";
import { SettingsView } from "./components/SettingsView";
import { CommunityView } from "./components/CommunityView";

import { useDecks, uid } from "./store";
import { useSettings } from "./settings";
import { useVibes } from "./lib/vibes";
import { runCloudTurn, extractJson } from "./lib/codex";
import { stopTurn, redeemDeckCode, uploadAttachment } from "./lib/api";
import {
  buildOutlinePrompt,
  buildSlidePrompt,
  buildCanvaPrompt,
  CANVA_DIRECTIVE,
} from "./lib/prompts";
import { cleanMessage } from "./lib/utils";
import { useAuth } from "./auth/AuthContext";
import { PENDING_BRIEF_KEY } from "./Root";
import { navigate, usePathname } from "./lib/router";
import type {
  Brand,
  CodexEvent,
  Deck,
  DevChannel,
  DevLogEntry,
  Mode,
  OutlineSlide,
  TurnRecord,
  View,
} from "./types";

/** URL for each app view (lightweight pathname routing — no react-router). */
const VIEW_PATHS: Record<View, string> = {
  studio: "/app",
  insights: "/app/insights",
  community: "/app/community",
  admin: "/app/admin",
  dev: "/app/activity",
  settings: "/app/settings",
};

function viewFromPath(path: string): View {
  const hit = (Object.entries(VIEW_PATHS) as [View, string][]).find(([, p]) => p === path);
  return hit ? hit[0] : "studio";
}

interface OutlineReply {
  brand?: Brand;
  slides?: { title?: string; brief?: string; notes?: string; visual?: string; layout?: string }[];
  /** Clarifying questions the planner returns when "Ask questions" is enabled. */
  questions?: string[];
}

const MAX_LOG = 600;

/** Edu lessons go deeper on one topic — default to a fuller slide count. */
const EDU_DEFAULT_SLIDES = 11;

function errMessage(err: unknown): string {
  return cleanMessage(err instanceof Error ? err.message : String(err));
}

export default function App() {
  const decks = useDecks();
  const vibes = useVibes();
  const { settings, update: updateSettings, reset: resetSettings } = useSettings();
  const { isAdmin, profile, refreshProfile } = useAuth();
  const { active } = decks;

  // Deck awaiting a capacity code before its outline can run (null = no prompt).
  const [codePromptDeck, setCodePromptDeck] = useState<Deck | null>(null);

  const pathname = usePathname();
  const view = viewFromPath(pathname);
  const setView = useCallback((v: View) => navigate(VIEW_PATHS[v]), []);
  const [mode, setMode] = useState<Mode>("moonshot");
  const [busy, setBusy] = useState(false);

  // Theme the whole document (body bg + tokens) by mode, with a cross-fade.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("mode-anim");
    root.classList.toggle("theme-edu", mode === "edu");
  }, [mode]);

  // Follow the active deck's mode when switching decks.
  useEffect(() => {
    if (active?.mode) setMode(active.mode);
  }, [active?.id, active?.mode]);

  const [status, setStatus] = useState("");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  /** Outline-slide id currently being converted to an editable Canva design. */
  const [canvaBusyId, setCanvaBusyId] = useState<string | null>(null);
  /** Deck id currently being assembled into one full-deck Canva design. */
  const [deckCanvaBusyId, setDeckCanvaBusyId] = useState<string | null>(null);
  /** Which deck currently owns the single in-flight generation session (or null). */
  const [generatingDeckId, setGeneratingDeckId] = useState<string | null>(null);
  const [log, setLog] = useState<DevLogEntry[]>([]);

  // Always-current settings for use inside async loops.
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Consume a brief typed on the landing hero: once decks finish loading, spin
  // up a fresh deck pre-filled with it and drop the user straight into Studio.
  const consumedBrief = useRef(false);
  useEffect(() => {
    if (consumedBrief.current || decks.loading) return;
    const brief = localStorage.getItem(PENDING_BRIEF_KEY);
    if (!brief) return;
    consumedBrief.current = true;
    localStorage.removeItem(PENDING_BRIEF_KEY);
    const d = decks.createDeck(settingsRef.current.defaultSlideCount, "moonshot");
    decks.updateDeck(d.id, (deck) => ({ ...deck, brief }));
    setView("studio");
  }, [decks, setView]);

  // Set true to abort an in-flight generation loop (user pressed Stop).
  const cancelRef = useRef(false);
  // The worker turn id currently in flight, so Stop can target it.
  const activeTurnRef = useRef<string | null>(null);

  const pushLog = useCallback(
    (channel: DevChannel, title: string, body?: string, deckId?: string) => {
      setLog((prev) =>
        [
          ...prev,
          { id: uid(), ts: Date.now(), channel, title, body, deckId },
        ].slice(-MAX_LOG)
      );
    },
    []
  );

  const logEvent = useCallback(
    (event: CodexEvent, deckId: string) => {
      if (event.type === "item.updated") return; // skip noisy reasoning deltas
      pushLog("event", event.type, JSON.stringify(event, null, 2), deckId);
    },
    [pushLog]
  );

  const patchActive = useCallback(
    (patch: Partial<Deck>) => {
      if (!active) return;
      decks.updateDeck(active.id, (d) => ({ ...d, ...patch }));
    },
    [active, decks]
  );

  // ---- Outline generation (fresh worker thread) ----
  const runOutline = useCallback(
    async (deck: Deck, opts?: { skipGate?: boolean }) => {
      if (busy) return;

      // Capacity gate: a non-admin with no decks left must redeem a code before
      // they can start a presentation. A deck already in 'slides' was charged, so
      // regenerating its outline is free. skipGate is set right after a successful
      // redeem to avoid re-blocking on stale profile state.
      if (!opts?.skipGate && !isAdmin && deck.phase !== "slides") {
        const allowance = profile?.deck_allowance ?? 0;
        const generated = profile?.decks_generated ?? 0;
        if (generated >= allowance) {
          setCodePromptDeck(deck);
          return;
        }
      }

      cancelRef.current = false;
      setBusy(true);
      setGeneratingDeckId(deck.id);
      setStatus("Studying brand & planning the deck…");

      const s = settingsRef.current;
      const directive =
        deck.mode === "edu" ? s.eduOutlineDirective : s.outlineDirective;
      const prompt = buildOutlinePrompt(deck);
      pushLog(
        "prompt",
        "Outline prompt",
        `${directive}\n\n--- USER ---\n\n${prompt}`,
        deck.id
      );

      const startedAt = Date.now();
      let result;
      try {
        result = await runCloudTurn(
          {
            deckId: deck.id,
            prompt,
            directive,
            kind: "outline",
            label: "Outline",
            webSearch: deck.webSearch,
          },
          {
            onStart: (id) => (activeTurnRef.current = id),
            onEvent: (e) => logEvent(e, deck.id),
            onStatus: setStatus,
          }
        );
      } catch (err) {
        pushLog("error", "Couldn't start outline", errMessage(err), deck.id);
        setStatus(errMessage(err));
        setBusy(false);
        setGeneratingDeckId(null);
        activeTurnRef.current = null;
        return;
      }
      activeTurnRef.current = null;

      if (cancelRef.current) {
        setStatus("Stopped.");
        setBusy(false);
        setGeneratingDeckId(null);
        return;
      }

      if (result.text) pushLog("reply", "Outline reply", result.text, deck.id);
      if (result.error) pushLog("error", "Generation error", result.error, deck.id);

      const parsed = extractJson<OutlineReply>(result.text);
      pushLog("done", "Outline turn complete", undefined, deck.id);

      if (!parsed?.slides?.length) {
        pushLog(
          "error",
          "Could not parse outline JSON",
          result.text || result.error || "(empty reply)",
          deck.id
        );
        setStatus("Couldn't parse the outline — check the dev console.");
        setBusy(false);
        setGeneratingDeckId(null);
        return;
      }

      const outline: OutlineSlide[] = parsed.slides.map((sl) => ({
        id: uid(),
        title: sl.title?.trim() || "Untitled slide",
        brief: sl.brief?.trim() || "",
        notes: sl.notes?.trim() || "",
        visual: sl.visual?.trim() || "",
        layout: sl.layout?.trim() || "",
      }));
      const brand = parsed.brand ?? null;
      const questions = Array.isArray(parsed.questions)
        ? parsed.questions.map((q) => String(q).trim()).filter(Boolean)
        : [];
      const title =
        brand?.name?.trim() ||
        deck.brief.trim().split("\n")[0].slice(0, 40) ||
        "Untitled deck";

      const outlineTurn: TurnRecord = {
        id: uid(),
        kind: "outline",
        label: "Outline",
        ts: startedAt,
        durationMs: Date.now() - startedAt,
        usage: { inputTokens: 5400, cachedInputTokens: 1200, outputTokens: 1600 },
        ok: true,
      };
      decks.updateDeck(deck.id, (d) => ({
        ...d,
        threadId: result.threadId ?? d.threadId,
        brand,
        outline,
        slides: {},
        phase: "outline",
        title,
        questions: questions.length ? questions : undefined,
        stats: [...d.stats, outlineTurn],
      }));
      pushLog("info", `Outline ready · ${outline.length} slides`, undefined, deck.id);
      setStatus("");
      setBusy(false);
      setGeneratingDeckId(null);
    },
    [busy, decks, logEvent, pushLog, isAdmin, profile]
  );

  // ---- Render a single slide (the worker resumes the deck's thread) ----
  const renderSlide = useCallback(
    async (deck: Deck, index: number) => {
      const slide = deck.outline[index];
      if (!slide) return;
      setGeneratingId(slide.id);
      // Optimistic — Realtime will confirm/overwrite once the worker starts.
      decks.updateDeck(deck.id, (d) => ({
        ...d,
        slides: { ...d.slides, [slide.id]: { status: "generating" } },
      }));

      const s = settingsRef.current;
      const directive =
        deck.mode === "edu" ? s.eduSlideDirective : s.slideDirective;
      const prompt = buildSlidePrompt(deck, index, s);
      pushLog(
        "prompt",
        `Slide ${index + 1} prompt — ${slide.title}`,
        `${directive}\n\n--- USER ---\n\n${prompt}`,
        deck.id
      );

      const startedAt = Date.now();
      let result;
      try {
        result = await runCloudTurn(
          {
            deckId: deck.id,
            prompt,
            directive,
            kind: "slide",
            outlineId: slide.id,
            label: slide.title || `Slide ${index + 1}`,
          },
          {
            onStart: (id) => (activeTurnRef.current = id),
            onEvent: (e) => logEvent(e, deck.id),
            onImage: () => pushLog("image", `Rendered slide ${index + 1}`, undefined, deck.id),
            onStatus: setStatus,
          }
        );
      } catch (err) {
        decks.updateDeck(deck.id, (d) => ({
          ...d,
          slides: { ...d.slides, [slide.id]: { status: "error", error: errMessage(err) } },
        }));
        pushLog("error", `Slide ${index + 1} failed to start`, errMessage(err), deck.id);
        setGeneratingId(null);
        activeTurnRef.current = null;
        throw err; // let the loop stop
      }
      activeTurnRef.current = null;

      if (cancelRef.current) {
        setGeneratingId(null);
        return;
      }

      // Demo: apply the "rendered" image directly (the cloud build hydrated it
      // from the worker via Realtime instead).
      const image = result.imagePaths[0];
      const slideTurn: TurnRecord = {
        id: uid(),
        kind: "slide",
        label: slide.title || `Slide ${index + 1}`,
        ts: startedAt,
        durationMs: Date.now() - startedAt,
        usage: { inputTokens: 6200, cachedInputTokens: 3900, outputTokens: 520 },
        ok: !!image && !result.error,
      };
      decks.updateDeck(deck.id, (d) => ({
        ...d,
        slides: {
          ...d.slides,
          [slide.id]: image
            ? { status: "done", dataUrl: image, path: image, updatedAt: Date.now() }
            : {
                status: "error",
                error: cleanMessage(result.error) || "No image was produced.",
              },
        },
        stats: [...d.stats, slideTurn],
      }));

      pushLog(
        result.error ? "error" : "done",
        `Slide ${index + 1} turn complete`,
        result.error || undefined,
        deck.id
      );
      setGeneratingId(null);
    },
    [decks, logEvent, pushLog]
  );

  const runSlide = useCallback(
    async (deck: Deck, index: number) => {
      if (busy) return;
      cancelRef.current = false;
      setBusy(true);
      setGeneratingDeckId(deck.id);
      setStatus(`Rendering slide ${index + 1}…`);
      try {
        await renderSlide(deck, index);
      } catch {
        /* surfaced in the slide card */
      }
      setStatus(cancelRef.current ? "Stopped." : "");
      setBusy(false);
      setGeneratingDeckId(null);
    },
    [busy, renderSlide]
  );

  const runAllSlides = useCallback(
    async (deck: Deck) => {
      if (busy) return;
      cancelRef.current = false;
      setBusy(true);
      setGeneratingDeckId(deck.id);
      for (let i = 0; i < deck.outline.length; i++) {
        if (cancelRef.current) break;
        setStatus(`Rendering slide ${i + 1} of ${deck.outline.length}…`);
        try {
          await renderSlide(deck, i);
        } catch {
          break; // a hard failure (e.g. quota) — stop the run
        }
      }
      setStatus(cancelRef.current ? "Stopped." : "");
      setBusy(false);
      setGeneratingDeckId(null);
      // The worker charges a lifetime deck slot on first render — refresh the meter.
      void refreshProfile();
    },
    [busy, renderSlide, refreshProfile]
  );

  // ---- Make a rendered slide editable in Canva ----
  // Re-uploads the slide PNG to the attachments bucket, then runs an un-charged
  // `canva` turn that asks Codex to convert it into an editable Canva design and
  // return a template/remix link. The worker writes `slides.canva_url`, which
  // hydrates back onto the slide via Realtime.
  const makeEditable = useCallback(
    async (deck: Deck, index: number) => {
      const slide = deck.outline[index];
      if (!slide) return;
      const rendered = deck.slides[slide.id];
      if (!rendered?.dataUrl || rendered.status !== "done") return;
      if (canvaBusyId) return;
      setCanvaBusyId(slide.id);
      try {
        const blob = await (await fetch(rendered.dataUrl)).blob();
        const name = `slide-${index + 1}.png`;
        const file = new File([blob], name, { type: "image/png" });
        const { storagePath } = await uploadAttachment(deck.id, file);

        const result = await runCloudTurn(
          {
            deckId: deck.id,
            prompt: buildCanvaPrompt(name, slide.title),
            directive: CANVA_DIRECTIVE,
            kind: "canva",
            outlineId: slide.id,
            label: `Canva — ${slide.title || `Slide ${index + 1}`}`,
            attachments: [{ name, storagePath }],
          },
          {
            onStart: (id) => (activeTurnRef.current = id),
            onEvent: (e) => logEvent(e, deck.id),
            onStatus: setStatus,
          }
        );
        activeTurnRef.current = null;
        pushLog(
          result.error ? "error" : "done",
          `Canva hand-off — ${slide.title || `Slide ${index + 1}`}`,
          result.error || undefined,
          deck.id
        );
      } catch (err) {
        pushLog("error", `Canva hand-off failed — slide ${index + 1}`, errMessage(err), deck.id);
      } finally {
        setCanvaBusyId(null);
        setStatus("");
      }
    },
    [canvaBusyId, logEvent, pushLog]
  );

  // ---- Make the WHOLE deck editable in Canva ----
  // The Canva connector's `canva_image-to-design` (the only tool that decomposes a
  // slide into editable elements) is single-image-per-call and exposes no
  // page-merge primitive, so ONE multi-page editable design is impossible. Instead
  // we convert every rendered slide into its own editable design in one click,
  // reusing the per-slide `canva` turn (outlineId set → worker writes
  // `slides.canva_url`, hydrated via the slides Realtime stream). Each tile then
  // shows its own "Canva" link.
  const makeDeckEditable = useCallback(
    async (deck: Deck) => {
      if (deckCanvaBusyId || canvaBusyId) return;
      const rendered = deck.outline
        .map((o, i) => ({ outline: o, slide: deck.slides[o.id], index: i }))
        .filter((r) => r.slide?.status === "done" && r.slide?.dataUrl);
      if (rendered.length === 0) return;

      setDeckCanvaBusyId(deck.id);
      let failures = 0;
      try {
        for (const { outline, slide, index } of rendered) {
          setCanvaBusyId(outline.id);
          try {
            const blob = await (await fetch(slide!.dataUrl!)).blob();
            const name = `slide-${index + 1}.png`;
            const file = new File([blob], name, { type: "image/png" });
            const { storagePath } = await uploadAttachment(deck.id, file);

            const result = await runCloudTurn(
              {
                deckId: deck.id,
                prompt: buildCanvaPrompt(name, outline.title),
                directive: CANVA_DIRECTIVE,
                kind: "canva",
                outlineId: outline.id,
                label: `Canva — ${outline.title || `Slide ${index + 1}`}`,
                attachments: [{ name, storagePath }],
              },
              {
                onStart: (id) => (activeTurnRef.current = id),
                onEvent: (e) => logEvent(e, deck.id),
                onStatus: setStatus,
              }
            );
            activeTurnRef.current = null;
            if (result.error) failures++;
          } catch (err) {
            failures++;
            pushLog("error", `Canva hand-off failed — slide ${index + 1}`, errMessage(err), deck.id);
          } finally {
            setCanvaBusyId(null);
          }
        }
        pushLog(
          failures ? "error" : "done",
          `Canva deck hand-off — ${deck.title}`,
          failures ? `${failures}/${rendered.length} slides failed` : undefined,
          deck.id
        );
      } finally {
        setDeckCanvaBusyId(null);
        setStatus("");
      }
    },
    [deckCanvaBusyId, canvaBusyId, logEvent, pushLog]
  );

  /** Stop the in-flight generation: kill the worker turn and abort the loop. */
  const stopGeneration = useCallback(() => {
    cancelRef.current = true;
    setStatus("Stopping…");
    const turnId = activeTurnRef.current;
    if (turnId) stopTurn(turnId).catch(() => {});
  }, []);

  const newDeck = useCallback(() => {
    const count =
      mode === "edu" ? EDU_DEFAULT_SLIDES : settingsRef.current.defaultSlideCount;
    decks.createDeck(count, mode);
    setView("studio");
  }, [decks, mode]);

  // Switch product mode: jump to (or start) a deck belonging to that mode.
  const switchMode = useCallback(
    (m: Mode) => {
      if (m === mode) return;
      setMode(m);
      setView("studio");
      const existing = decks.decks.find((d) => d.mode === m);
      if (existing) {
        decks.setActiveId(existing.id);
      } else {
        const count =
          m === "edu" ? EDU_DEFAULT_SLIDES : settingsRef.current.defaultSlideCount;
        decks.createDeck(count, m);
      }
    },
    [mode, decks]
  );

  // ---- Main view ----
  const renderStudio = () => {
    if (!active) return null;
    if (active.phase === "outline") {
      return (
        <OutlineEditor
          deck={active}
          busy={busy}
          status={status}
          onChange={patchActive}
          onBack={() => patchActive({ phase: "brief" })}
          onRegenerate={() => void runOutline(active)}
          onViewSlides={() => patchActive({ phase: "slides" })}
          onGenerateSlides={() => {
            patchActive({ phase: "slides" });
            void runAllSlides(active);
          }}
        />
      );
    }
    if (active.phase === "slides") {
      return (
        <SlideDeck
          deck={active}
          busy={busy}
          generating={generatingDeckId === active.id}
          status={status}
          generatingId={generatingId}
          onStop={stopGeneration}
          onGenerateAll={() => void runAllSlides(active)}
          onGenerateSlide={(i) => void runSlide(active, i)}
          onTogglePublish={() => patchActive({ published: !active.published })}
          onMakeEditable={(i) => void makeEditable(active, i)}
          onMakeDeckEditable={() => void makeDeckEditable(active)}
          canvaBusyId={canvaBusyId}
          deckCanvaBusy={deckCanvaBusyId === active.id}
        />
      );
    }
    return (
      <BriefForm
        deck={active}
        busy={busy}
        status={status}
        onChange={patchActive}
        onGenerate={() => void runOutline(active)}
        onBrowseCommunity={() => setView("community")}
        vibes={vibes}
      />
    );
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid h-screen w-screen grid-cols-[256px_1fr] grid-rows-[minmax(0,1fr)] overflow-hidden bg-background text-foreground">
        <Sidebar
          view={view}
          setView={setView}
          decks={decks}
          mode={mode}
          onModeChange={switchMode}
          busy={busy}
          generatingDeckId={generatingDeckId}
          status={status}
          onNewDeck={newDeck}
          isAdmin={isAdmin}
        />
        <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          {view === "studio" && renderStudio()}
          {view === "insights" && <InsightsView deck={active ?? null} />}
          {view === "community" && <CommunityView />}
          {view === "dev" && isAdmin && (
            <DevConsole entries={log} onClear={() => setLog([])} />
          )}
          {view === "settings" && (
            <SettingsView
              settings={settings}
              onChange={updateSettings}
              onReset={resetSettings}
            />
          )}
        </main>
      </div>

      {codePromptDeck && (
        <CodePromptModal
          onClose={() => setCodePromptDeck(null)}
          onRedeemed={async () => {
            const deck = codePromptDeck;
            setCodePromptDeck(null);
            await refreshProfile();
            if (deck) void runOutline(deck, { skipGate: true });
          }}
        />
      )}
    </TooltipProvider>
  );
}

/** Asks for a capacity code when a user with no decks left tries to generate.
 *  On a successful redeem it hands control back so the outline can proceed. */
function CodePromptModal({
  onClose,
  onRedeemed,
}: {
  onClose: () => void;
  onRedeemed: () => void;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const c = code.trim();
    if (!c || busy) return;
    setBusy(true);
    setError(null);
    try {
      await redeemDeckCode(c);
      onRedeemed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not redeem that code.");
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-xl border border-border bg-muted/40">
            <Ticket className="size-4 text-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Enter a code to generate</h2>
            <p className="text-xs text-muted-foreground">
              You're out of deck capacity. Redeem a code to unlock generation.
            </p>
          </div>
        </div>
        <input
          autoFocus
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
          placeholder="LAUNCH20"
          autoCapitalize="characters"
          className="h-10 w-full rounded-lg border border-border bg-input/40 px-3 text-sm uppercase tracking-wide outline-none placeholder:tracking-normal placeholder:text-muted-foreground/60 focus:border-primary"
          aria-label="Capacity code"
        />
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => void submit()} disabled={!code.trim() || busy} className="gap-1.5">
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Ticket className="size-3.5" />}
            Redeem
          </Button>
        </div>
      </div>
    </div>
  );
}
