import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowCounterClockwise as RotateCcw,
  BookOpen,
  Check,
  Code as Code2,
  GraduationCap,
  MagicWand as WandSparkles,
  Minus,
  Monitor,
  Moon,
  Palette,
  Plus,
  PresentationChart as Presentation,
  ShieldCheck,
  SignOut as LogOut,
  SlidersHorizontal,
  Sparkle as Sparkles,
  Sun,
  UserCircle as UserRound,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useTheme, type Theme } from "@/lib/theme";
import { useAuth } from "@/auth/AuthContext";
import { MAX_SLIDES } from "@/limits";
import type { Mode, Settings } from "@/types";

interface Props {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onReset: () => void;
}

type Section = "workspace" | "generation" | "learning" | "advanced";

const NAV: { id: Section; label: string; detail: string; icon: typeof SlidersHorizontal }[] = [
  { id: "workspace", label: "Workspace", detail: "Canvas and account", icon: SlidersHorizontal },
  { id: "generation", label: "Generation", detail: "Deck pipeline", icon: WandSparkles },
  { id: "learning", label: "Learn", detail: "Lesson behavior", icon: BookOpen },
  { id: "advanced", label: "Advanced", detail: "System directives", icon: Code2 },
];

const RATIOS = ["16:9", "4:3", "1:1", "9:16"];
const pageEase = [0.22, 1, 0.36, 1] as const;

export function SettingsView({ settings, onChange, onReset }: Props) {
  const [section, setSection] = useState<Section>("workspace");
  const reduce = useReducedMotion();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const panelMotion = reduce
    ? { initial: false as const, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      };
  const selectSection = (next: Section) => setSection(next);

  return (
    <main className="ms-settings-pro h-full overflow-y-auto">
      <div className="ms-settings-shell">
        <header className="ms-settings-overview">
          <div>
            <h1>Settings</h1>
            <p>Shape the workspace around how you present and teach.</p>
          </div>
          <div className="ms-settings-session" aria-label="Signed-in account">
            <span>{(user?.email?.[0] ?? "M").toUpperCase()}</span>
            <div><small>Current account</small><strong>{user?.email ?? "Moonshot account"}</strong></div>
            <Check weight="bold" aria-hidden="true" />
          </div>
        </header>

        <nav className="ms-settings-rail" aria-label="Settings sections">
          <span className="ms-settings-rail-label">Settings index</span>
          {NAV.map(({ id, label, detail, icon: Icon }) => (
            <button key={id} type="button" aria-label={label} aria-current={section === id ? "page" : undefined} className={cn(section === id && "is-active")} onClick={() => selectSection(id)}>
              <span className="ms-settings-rail-icon"><Icon weight={section === id ? "fill" : "regular"} /></span>
              <span><strong>{label}</strong><small>{detail}</small></span>
            </button>
          ))}
          <span className="ms-settings-save-state"><Check weight="bold" /> Saved locally</span>
        </nav>

        <AnimatePresence initial={false} mode="wait">
          <motion.div key={section} className="ms-settings-content" {...panelMotion} transition={{ duration: reduce ? 0 : 0.16, ease: pageEase }}>
            {section === "workspace" && (
              <SettingsPage title="Workspace" description="Defaults for new work and the interface around it.">
                <SettingsGroup title="Presentation defaults">
                  <SettingRow icon={<Presentation />} title="Default slide count" description={`Choose between 1 and ${MAX_SLIDES} slides.`}>
                    <div className="ms-number-control">
                      <button type="button" onClick={() => onChange({ defaultSlideCount: Math.max(1, settings.defaultSlideCount - 1) })} aria-label="Decrease slide count"><Minus /></button>
                      <span>{settings.defaultSlideCount}</span>
                      <button type="button" onClick={() => onChange({ defaultSlideCount: Math.min(MAX_SLIDES, settings.defaultSlideCount + 1) })} aria-label="Increase slide count"><Plus /></button>
                    </div>
                  </SettingRow>
                  <SettingRow icon={<Monitor />} title="Canvas format" description="The frame passed to the rendering engine.">
                    <div className="ms-choice-control">
                      {RATIOS.map((ratio) => <button key={ratio} type="button" className={settings.aspectRatio === ratio ? "is-active" : ""} onClick={() => onChange({ aspectRatio: ratio })}>{ratio}</button>)}
                    </div>
                  </SettingRow>
                </SettingsGroup>

                <SettingsGroup title="Display">
                  <SettingRow icon={<Palette />} title="Interface theme" description="Your choice is saved on this device.">
                    <ThemeControl theme={theme} onChange={setTheme} />
                  </SettingRow>
                </SettingsGroup>

                <SettingsGroup title="Account">
                  <SettingRow icon={<UserRound />} title={user?.email ?? "Signed in"} description="Signed in on this device">
                    <Button variant="outline" size="sm" onClick={() => void signOut()} className="ms-settings-action"><LogOut /> Sign out</Button>
                  </SettingRow>
                </SettingsGroup>
              </SettingsPage>
            )}

            {section === "generation" && (
              <SettingsPage title="Generation" description="The default path from a brief to a finished presentation.">
                <div className="ms-engine-status"><span><ShieldCheck weight="duotone" /></span><div><strong>Generation is ready</strong><p>Planning and rendering directives are active for the next deck.</p></div><em><Check /> Ready</em></div>
                <SettingsGroup title="Active pipeline">
                  <PipelineRow title="Read the brief" description="Uses your request, attachments, brand signals, and research preferences." />
                  <PipelineRow title="Plan the narrative" description="Builds a coherent outline before any slide is rendered." />
                  <PipelineRow title="Render the deck" description="Carries the same visual direction through every slide." />
                </SettingsGroup>
                <div className="ms-settings-note"><Sparkles /><div><strong>Need deeper control?</strong><p>Directives stay out of the everyday workflow until you need them.</p></div><button type="button" onClick={() => selectSection("advanced")}>Open advanced</button></div>
              </SettingsPage>
            )}

            {section === "learning" && (
              <SettingsPage title="Learn" description="Teaching defaults for clear, paced lesson decks.">
                <SettingsGroup title="Lesson behavior">
                  <StatusRow icon={<GraduationCap />} title="Learning-first outlines" description="Objectives, progression, analogies, and knowledge checks are planned before rendering." />
                  <StatusRow icon={<BookOpen />} title="One idea per slide" description="Lesson slides favor clarity and one supporting visual over density." />
                  <StatusRow icon={<Presentation />} title="11-slide starting point" description="New lessons leave room for context, explanation, and review." />
                </SettingsGroup>
                <div className="ms-settings-note"><BookOpen /><div><strong>Change the teaching rules</strong><p>Full Learn planning and slide directives live in Advanced.</p></div><button type="button" onClick={() => selectSection("advanced")}>Edit directives</button></div>
              </SettingsPage>
            )}

            {section === "advanced" && <AdvancedSettings settings={settings} onChange={onChange} onReset={onReset} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

function SettingsPage({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <div className="ms-settings-page"><header><h2>{title}</h2><p>{description}</p></header>{children}</div>;
}

function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return <section className="ms-settings-group"><h3>{title}</h3><div className="ms-settings-rows">{children}</div></section>;
}

function SettingRow({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
  return <div className="ms-setting-row"><span className="ms-setting-icon">{icon}</span><div className="ms-setting-copy"><strong>{title}</strong><p>{description}</p></div><div className="ms-setting-control">{children}</div></div>;
}

function ThemeControl({ theme, onChange }: { theme: Theme; onChange: (theme: Theme) => void }) {
  return <div className="ms-choice-control"><button type="button" className={theme === "light" ? "is-active" : ""} onClick={() => onChange("light")}><Sun /> Light</button><button type="button" className={theme === "dark" ? "is-active" : ""} onClick={() => onChange("dark")}><Moon /> Dark</button></div>;
}

function PipelineRow({ title, description }: { title: string; description: string }) {
  return <div className="ms-pipeline-row"><div><strong>{title}</strong><p>{description}</p></div><Check weight="bold" /></div>;
}

function StatusRow({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return <div className="ms-setting-row"><span className="ms-setting-icon">{icon}</span><div className="ms-setting-copy"><strong>{title}</strong><p>{description}</p></div><span className="ms-enabled-state"><Check weight="bold" /> On</span></div>;
}

function AdvancedSettings({ settings, onChange, onReset }: Props) {
  const [tab, setTab] = useState<Mode>("moonshot");
  const edu = tab === "edu";
  const outlineKey = edu ? "eduOutlineDirective" : "outlineDirective";
  const slideKey = edu ? "eduSlideDirective" : "slideDirective";
  return <SettingsPage title="Advanced" description="Change the generation contract only when the defaults are no longer enough.">
    <div className="ms-advanced-warning"><Code2 /><p><strong>Developer controls</strong> Invalid instructions can prevent outlines from parsing or slides from rendering. Existing projects are not changed.</p><Button variant="outline" size="sm" onClick={onReset}><RotateCcw /> Restore defaults</Button></div>
    <div className="ms-advanced-tabs"><button className={!edu ? "is-active" : ""} onClick={() => setTab("moonshot")}><Sparkles /> Presentations</button><button className={edu ? "is-active" : ""} onClick={() => setTab("edu")}><GraduationCap /> Learn</button></div>
    <section className="ms-directive-section"><div><h3>Outline directive</h3><p>Controls planning, output structure, and required JSON fields.</p></div><Textarea value={settings[outlineKey]} onChange={(event) => onChange({ [outlineKey]: event.target.value })} spellCheck={false} /></section>
    <section className="ms-directive-section"><div><h3>Slide directive</h3><p>Controls rendering behavior and visual consistency.</p></div><Textarea value={settings[slideKey]} onChange={(event) => onChange({ [slideKey]: event.target.value })} spellCheck={false} /></section>
  </SettingsPage>;
}
