export type FlowStage =
  | "landing"
  | "brief"
  | "analyzing"
  | "questions"
  | "blueprint"
  | "narrative"
  | "planning"
  | "logic"
  | "style"
  | "validating"
  | "generating"
  | "qa"
  | "repairing"
  | "deck";

export type SessionStatus =
  | "briefing"
  | "clarifying"
  | "blueprint_review"
  | "narrative_ready"
  | "logic_board_review"
  | "style_review"
  | "copywriting"
  | "layout_planning"
  | "pre_render_validation"
  | "rendering"
  | "visual_qa"
  | "repairing"
  | "deck_qa"
  | "completed"
  | "failed";

export type SlideStatus =
  | "planned"
  | "copy_ready"
  | "layout_ready"
  | "rendered"
  | "qa_passed"
  | "needs_repair"
  | "failed";

export type PresentationType =
  | "investor"
  | "sales"
  | "internal"
  | "academic"
  | "product"
  | "keynote"
  | "other";

export type ProjectAnalysis = {
  goal: string;
  audience: string;
  presentationType: PresentationType;
  tone: string;
  missingInfo: string[];
};

export type ClarificationQuestion = {
  id: string;
  question: string;
  reason: string;
  answer?: string;
};

export type SlideLogic = {
  id: string;
  index: number;
  title: string;
  purpose: string;
  mainMessage: string;
  suggestedContent: string;
  visualIdea: string;
  layoutDirection: string;
  tone: string;
  roleInStory: string;
};

export type SlideContent = {
  slideId: string;
  headline: string;
  body: string;
  bullets: string[];
  imageUrl?: string;
  imagePrompt?: string;
  qa?: VisualQA;
  repairAttempts?: number;
};

export type StyleVariant = {
  id: string;
  name: string;
  description: string;
  bg: string;
  fg: string;
  accent: string;
  fontFamily: string;
  reason?: string;
  origin?: "recommended" | "custom" | "catalog";
};

export type ThoughtPhase =
  | "analyze"
  | "clarify"
  | "plan"
  | "refine"
  | "rebuild"
  | "write"
  | "render"
  | "style";

export type Thought = {
  id: string;
  phase: ThoughtPhase;
  text: string;
  ts: number;
};

// ─── New pipeline types ──────────────────────────────────────────────────────
// Additive; coexist with the legacy SlideLogic/StyleVariant/SlideContent types
// above while the pipeline is migrated stage by stage.

export type DeckType =
  | "pitch"
  | "sales"
  | "educational"
  | "report"
  | "product"
  | "portfolio"
  | "proposal"
  | "strategy"
  | "internal_update";

export type PrimaryGoal =
  | "raise_money"
  | "explain"
  | "sell"
  | "teach"
  | "convince"
  | "summarize"
  | "launch";

export type ReferenceMode = "none" | "loose" | "balanced" | "strict";

export type PresentationIntent = {
  deckType: DeckType;
  primaryGoal: PrimaryGoal;
  audienceKnowledge: "low" | "medium" | "expert";
  persuasionLevel: "low" | "medium" | "high";
  requiredDepth: "light" | "standard" | "deep";
  expectedStyle:
    | "minimal"
    | "premium"
    | "corporate"
    | "brutalist"
    | "playful"
    | "technical"
    | "luxury";
};

export type AudienceModel = {
  audience: string;
  caresAbout: string[];
  skepticismPoints: string[];
  languageLevel: string;
  forbiddenAssumptions: string[];
};

export type DesignDNA = {
  referenceMode: ReferenceMode;
  palette: string[];
  typographySystem: string;
  compositionRules: string[];
  layoutArchetypes: string[];
  spacingRules: string;
  visualDensity: "low" | "medium" | "high";
  imageTreatment: string;
  illustrationStyle: string;
  forbiddenDeviations: string[];
};

export type PresentationContext = {
  intent: PresentationIntent;
  audienceModel: AudienceModel;
  designDNA?: DesignDNA;
};

export type Blueprint = {
  presentationType: DeckType;
  audience: string;
  goal: string;
  tone: string;
  styleDirection: string;
  slideCount: number;
  narrativeArcSummary: string;
  keyClaims: string[];
  mustInclude: string[];
  mustAvoid: string[];
  referenceStrictness: ReferenceMode;
};

export type NarrativeArchitecture = {
  thesis: string;
  centralPromise: string;
  emotionalArc: string;
  logicalArc: string;
  persuasionStrategy: {
    sequence: string[];
    evidenceRatio: number;
    visionRatio: number;
    productRatio: number;
  };
  openingHook: string;
  closingMemory: string;
  objectionsToPreempt: string[];
  proofStrategy: string;
};

export type SlideRole =
  | "title"
  | "setup"
  | "problem"
  | "argument"
  | "evidence"
  | "comparison"
  | "process"
  | "transition"
  | "closer";

export type LayoutArchetype =
  | "hero"
  | "split"
  | "triptych"
  | "timeline"
  | "comparison"
  | "stat"
  | "quote"
  | "process"
  | "matrix";

export type SlideSkeleton = {
  id: string;
  index: number;
  role: SlideRole;
  narrativeBeat: string;
  keyMessage: string;
  audienceReactionTarget: string;
  supportingPoints: string[];
  evidenceNeeded: string[];
  visualIntent: string;
  layoutCandidate: LayoutArchetype;
  densityTarget: "low" | "medium" | "high";
  importanceScore: number;
  riskScore: number;
};

export type StyleSpec = {
  locked: boolean;
  version: number;
  name: string;
  palette: { bg: string; fg: string; accent: string; muted?: string };
  typography: {
    fontFamily: string;
    titleFontSizePx: [number, number];
    bodyFontSizePx: [number, number];
    weightTitle: number;
    weightBody: number;
  };
  spacing: { marginXPct: number; marginYPct: number };
  grid: { columns: number; gutterPx: number };
  layoutArchetypes: LayoutArchetype[];
  imageStyle: string;
  chartStyle: string;
  density: "low" | "medium" | "high";
  textLimits: { maxWordsPerSlide: number; maxBulletWords: number };
  accentUsageMaxPct: number;
  forbiddenStyles: string[];
  referenceFaithfulness: ReferenceMode;
};

export type StyleProposal = {
  id: string;
  name: string;
  bestFor: string;
  risk: string;
  sampleSlideDescription: string;
  spec: StyleSpec;
};

export type SlideCopy = {
  slideId: string;
  headline: string;
  subheadline?: string;
  sections: { label: string; body: string }[];
  bullets: string[];
  captions: string[];
  speakerNotes?: string;
  footer?: string;
  mustRenderText: string[];
  optionalText: string[];
  removedIdeas: string[];
  quality: {
    totalWords: number;
    readingTimeSeconds: number;
    clarityScore: number;
    persuasionScore: number;
    jargonScore: number;
    textRenderRisk: "low" | "medium" | "high";
  };
};

export type LayoutElement = {
  id: string;
  type: "text" | "image" | "chart" | "shape" | "pill" | "diagram" | "mark";
  content: string;
  position: { xPct: number; yPct: number };
  size: { wPct: number; hPct: number };
  hierarchy: 1 | 2 | 3 | 4;
  styleToken: string;
};

export type LayoutPlan = {
  slideId: string;
  canvas: "16:9";
  layoutType: LayoutArchetype;
  grid: { columns: number; rows: number };
  safeMarginsPct: { x: number; y: number };
  readingOrder: string[];
  elements: LayoutElement[];
  whitespaceScoreTarget: number;
  balanceTarget: number;
  contrastTarget: number;
};

export type ValidationIssue = {
  slideId?: string;
  severity: "info" | "warn" | "critical";
  issue: string;
  fix: string;
};

export type PreRenderValidation = {
  deckScore: number;
  canRender: boolean;
  issues: ValidationIssue[];
};

export type VisualQA = {
  slideId: string;
  overallScore: number;
  styleFidelity: number;
  textReadability: number;
  contentCompleteness: number;
  layoutBalance: number;
  brandCompliance: number;
  referenceSimilarity?: number;
  issues: string[];
  repairInstructions?: string;
  failureType?:
    | "text_distortion"
    | "wrong_style"
    | "missing_element"
    | "too_busy"
    | "weak_composition"
    | "factual_issue";
};

export type DeckQA = {
  narrativeFlowScore: number;
  styleConsistencyScore: number;
  repetitionScore: number;
  pacingScore: number;
  slideOrderScore: number;
  finalReadinessScore: number;
  issues: { slideIds: string[]; issue: string; fix: string }[];
};

export type SlideState = {
  id: string;
  index: number;
  status: SlideStatus;
  skeleton: SlideSkeleton;
  copy?: SlideCopy;
  layoutPlan?: LayoutPlan;
  renderPrompt?: string;
  imageUrl?: string;
  qa?: VisualQA;
  repairAttempts: number;
};

export type PresentationSession = {
  id: string;
  status: SessionStatus;
  brief: string;
  referenceImage?: string | null;
  context?: PresentationContext;
  blueprint?: Blueprint;
  narrative?: NarrativeArchitecture;
  styleSpec?: StyleSpec;
  slides: SlideState[];
  validation?: PreRenderValidation;
  deckQA?: DeckQA;
};

export type Project = {
  brief: string;
  referenceImage?: string | null;
  analysis?: ProjectAnalysis;
  questions: ClarificationQuestion[];
  blueprint?: Blueprint;
  narrative?: NarrativeArchitecture;
  skeletons?: SlideSkeleton[];
  slides: SlideLogic[];
  style?: StyleVariant;
  styleSpec?: StyleSpec;
  validation?: PreRenderValidation;
  deckQA?: DeckQA;
  generatedContent: Record<string, SlideContent>;
};
