import { motion } from "motion/react";
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  ChevronDown,
  Folder,
  ImageIcon,
  Layers,
  ListTree,
  MessageSquare,
  MousePointer2,
  PanelLeft,
  Play,
  Plus,
  Redo2,
  Search,
  Share2,
  Type,
  Undo2,
} from "lucide-react";
import { Logo } from "./Logo";

const slides = [
  "/samples/ps5/ps51.webp",
  "/samples/ps5/ps52.webp",
  "/samples/ps5/ps53.webp",
  "/samples/ps5/ps54.webp",
];

const tools = [MousePointer2, PanelLeft, ListTree, Type, ImageIcon, Layers, ChartNoAxesCombined, MessageSquare];

const story = [
  ["01", "Opening", "The category is moving"],
  ["02", "Problem", "A fragmented creative process"],
  ["03", "Evidence", "The work is already there"],
  ["04", "Solution", "One project, five stages"],
];

export function WorkspacePreview({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="ms-workspace-preview"
    >
      <div className="ms-workspace-topbar">
        <div className="ms-workspace-crumbs">
          <Logo className="size-[18px]" />
          <span>Moonshot</span><i>/</i><span>Investor Deck</span><i>/</i><strong>Series A</strong>
          <span className="ms-workspace-saved">All changes saved</span>
        </div>
        <div className="ms-workspace-modes" aria-label="Workspace modes">
          <button type="button" className="is-active">Story</button>
          <button type="button">Design</button>
          <button type="button">Review</button>
        </div>
        <div className="ms-workspace-actions">
          <button type="button" aria-label="Undo"><Undo2 /></button>
          <button type="button" aria-label="Redo"><Redo2 /></button>
          <button type="button" className="ms-workspace-avatar">AK</button>
          <button type="button" className="ms-workspace-share"><Share2 /> Share</button>
          <button type="button" className="ms-workspace-present"><Play /> Present</button>
        </div>
      </div>

      <div className="ms-workspace-main">
        <aside className="ms-workspace-rail" aria-label="Workspace tools">
          {tools.map((Icon, index) => <button key={Icon.displayName ?? index} type="button" className={index === 1 ? "is-active" : ""} aria-label={`Tool ${index + 1}`}><Icon /></button>)}
          <span />
          <button type="button" aria-label="More tools"><ChevronDown /></button>
        </aside>

        <aside className="ms-workspace-story-panel">
          <div className="ms-workspace-panel-head"><span>Story</span><button type="button"><Plus /></button></div>
          <div className="ms-workspace-phase"><span>Drafting a narrative</span><strong>4 / 12 slides</strong></div>
          <div className="ms-workspace-story-list">
            {story.map(([number, role, headline], index) => (
              <button key={number} type="button" className={index === 3 ? "is-selected" : ""}>
                <span>{number}</span><div><small>{role}</small><strong>{headline}</strong></div>{index === 2 && <i />}
              </button>
            ))}
          </div>
          <button type="button" className="ms-workspace-new-slide"><Plus /> Add slide</button>
        </aside>

        <main className="ms-workspace-canvas">
          <div className="ms-workspace-canvas-tools"><span>Slide 04</span><span>Product / Solution</span><button type="button"><Search /> 84%</button></div>
          <div className="ms-workspace-slide-frame">
            <img src={slides[0]} alt="Moonshot slide preview" />
            <span className="ms-workspace-selection">One project, five stages</span>
          </div>
          <div className="ms-workspace-annotation"><span>Purpose</span><p>Make the operating model feel inevitable before the product reveal.</p></div>
        </main>

        <aside className="ms-workspace-properties">
          <div className="ms-workspace-panel-head"><span>Slide</span><button type="button"><ArrowUpRight /></button></div>
          <label>Layout <button type="button">Product showcase <ChevronDown /></button></label>
          <label>Visual density <div className="ms-workspace-density"><i /><i className="is-on" /><i className="is-on" /><i /></div></label>
          <label>Brand <button type="button"><span className="ms-workspace-brand-dot" /> Moonshot core <ChevronDown /></button></label>
          <div className="ms-workspace-writing"><span>Writing</span><button type="button">Sharpen headline</button><button type="button">Check evidence</button></div>
        </aside>
      </div>

      <footer className="ms-workspace-filmstrip">
        <button type="button" className="ms-workspace-film-control"><Plus /> Add</button>
        <div className="ms-workspace-thumbnails">
          {slides.map((slide, index) => <button key={slide} type="button" className={index === 0 ? "is-active" : ""}><span>{index + 1}</span><img src={slide} alt="" /></button>)}
        </div>
        <button type="button" className="ms-workspace-film-control"><Folder /> Storyboard</button>
      </footer>

      <button type="button" className="ms-workspace-start" onClick={onStart}><Plus /> Start a project</button>
    </motion.div>
  );
}
