import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import type {
  Blueprint,
  ClarificationQuestion,
  DeckQA,
  LayoutPlan,
  NarrativeArchitecture,
  ProjectAnalysis,
  SlideCopy,
  SlideContent,
  SlideLogic,
  SlideSkeleton,
  StyleSpec,
  StyleVariant,
  ThoughtPhase,
  VisualQA,
} from "./types";

/**
 * Mun Shot AI service.
 *
 * Models in production:
 *  - Gemini 3.1 Flash Lite → analyzeBrief, generateClarifications, generateSlideLogic,
 *                            rebuildArchitecture, editSlide, generateSlideContent
 *  - Imagen 4              → generateSlideImage (each slide is rendered as a single
 *                            full-bleed image; the deck is a sequence of photos)
 *
 * ChatGPT / gpt-image-1 is currently disabled.
 *
 * All calls go through the Supabase edge function at
 * /functions/v1/make-server-84204692/ai/* so the GEMINI_API_KEY never reaches
 * the browser. Text endpoints are SSE — each frame is either a
 * `{type:"thought", data:string}` (forwarded to onThought) or a
 * `{type:"done", data:any}` carrying the structured JSON result.
 */

export type ThinkOpts = {
  onThought?: (text: string, phase: ThoughtPhase) => void;
};

export interface AIService {
  analyzeBrief(brief: string, opts?: ThinkOpts): Promise<ProjectAnalysis>;
  generateClarifications(
    brief: string,
    analysis: ProjectAnalysis,
    opts?: ThinkOpts,
  ): Promise<ClarificationQuestion[]>;
  generateSlideLogic(
    brief: string,
    analysis: ProjectAnalysis,
    answers: ClarificationQuestion[],
    opts?: ThinkOpts,
  ): Promise<SlideLogic[]>;
  deriveBlueprint(
    brief: string,
    analysis: ProjectAnalysis,
    answers: ClarificationQuestion[],
    opts?: ThinkOpts,
  ): Promise<Blueprint>;
  generateNarrative(
    brief: string,
    analysis: ProjectAnalysis,
    answers: ClarificationQuestion[],
    opts?: ThinkOpts,
  ): Promise<NarrativeArchitecture>;
  generateSkeletons(
    brief: string,
    analysis: ProjectAnalysis,
    narrative: NarrativeArchitecture,
    slideCount: number,
    opts?: ThinkOpts,
  ): Promise<SlideSkeleton[]>;
  editSlide(slide: SlideLogic, feedback: string, opts?: ThinkOpts): Promise<SlideLogic>;
  rebuildArchitecture(
    current: SlideLogic[],
    feedback: string,
    analysis: ProjectAnalysis,
    opts?: ThinkOpts,
  ): Promise<{ slides: SlideLogic[]; analysis: ProjectAnalysis }>;
  recommendStyles(
    brief: string,
    analysis: ProjectAnalysis,
    slides: SlideLogic[],
    referenceImage?: string | null,
    opts?: ThinkOpts,
  ): Promise<StyleVariant[]>;
  designCustomStyle(
    description: string,
    brief: string,
    analysis: ProjectAnalysis,
    referenceImage?: string | null,
    opts?: ThinkOpts,
  ): Promise<StyleVariant>;
  generateSlideContent(
    slide: SlideLogic,
    style: StyleVariant,
    opts?: ThinkOpts,
  ): Promise<SlideContent>;
  generateSlideImage(
    slide: SlideLogic,
    content: SlideContent,
    style: StyleVariant,
    opts?: ThinkOpts,
  ): Promise<string>;
  writeSlideCopy(
    skeleton: SlideSkeleton,
    styleSpec: StyleSpec,
    blueprint: Blueprint,
    narrative: NarrativeArchitecture,
    priorHeadlines: string[],
    opts?: ThinkOpts,
  ): Promise<SlideCopy>;
  planLayout(
    skeleton: SlideSkeleton,
    copy: SlideCopy,
    styleSpec: StyleSpec,
    opts?: ThinkOpts,
  ): Promise<LayoutPlan>;
  renderImage(prompt: string, opts?: ThinkOpts): Promise<string>;
  judgeSlide(
    imageDataUrl: string,
    copy: SlideCopy,
    styleSpec: StyleSpec,
    skeleton: SlideSkeleton,
    opts?: ThinkOpts,
  ): Promise<VisualQA>;
  judgeDeck(
    deckSummary: { id: string; role: string; headline: string; layout: string; qa?: VisualQA }[],
    styleSpec: StyleSpec,
    opts?: ThinkOpts,
  ): Promise<DeckQA>;
}

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-84204692`;
const HEADERS = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${publicAnonKey}`,
};

const id = () => Math.random().toString(36).slice(2, 9);

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function streamTask<T>(
  path: string,
  body: unknown,
  phase: ThoughtPhase,
  opts?: ThinkOpts,
): Promise<T> {
  opts?.onThought?.("gemini · received task, calling model.", phase);

  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(body),
  });

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // fall through to status check
  }

  if (!res.ok) {
    const msg = json?.error ?? `${res.status}`;
    throw new Error(`Mun Shot AI ${path} failed: ${msg}`);
  }
  if (json?.error) throw new Error(json.error);
  if (!json?.result) throw new Error(`Mun Shot AI ${path}: missing result.`);

  const thoughts: string[] = Array.isArray(json.thoughts) ? json.thoughts : [];
  for (const t of thoughts) {
    opts?.onThought?.(t, phase);
    await sleep(140);
  }

  return json.result as T;
}

export const ai: AIService = {
  async analyzeBrief(brief, opts) {
    return streamTask<ProjectAnalysis>("/ai/analyze", { brief }, "analyze", opts);
  },

  async generateClarifications(brief, analysis, opts) {
    const out = await streamTask<{ questions: Omit<ClarificationQuestion, "id">[] }>(
      "/ai/clarify",
      { brief, analysis },
      "clarify",
      opts,
    );
    return out.questions.map((q) => ({ ...q, id: id() }));
  },

  async generateSlideLogic(brief, analysis, answers, opts) {
    const out = await streamTask<{ slides: Omit<SlideLogic, "id" | "index">[] }>(
      "/ai/plan",
      { brief, analysis, answers },
      "plan",
      opts,
    );
    return out.slides.map((s, i) => ({ ...s, id: id(), index: i + 1 }));
  },

  async deriveBlueprint(brief, analysis, answers, opts) {
    return streamTask<Blueprint>("/ai/blueprint", { brief, analysis, answers }, "plan", opts);
  },

  async generateNarrative(brief, analysis, answers, opts) {
    return streamTask<NarrativeArchitecture>(
      "/ai/narrative",
      { brief, analysis, answers },
      "plan",
      opts,
    );
  },

  async generateSkeletons(brief, analysis, narrative, slideCount, opts) {
    const out = await streamTask<{ slides: Omit<SlideSkeleton, "id" | "index">[] }>(
      "/ai/skeletons",
      { brief, analysis, narrative, slideCount },
      "plan",
      opts,
    );
    return out.slides.map((s, i) => ({ ...s, id: id(), index: i + 1 }));
  },

  async editSlide(slide, feedback, opts) {
    const out = await streamTask<{ slide: SlideLogic }>(
      "/ai/refine",
      { slide, feedback },
      "refine",
      opts,
    );
    // preserve id/index from the original in case the model dropped them
    return { ...out.slide, id: slide.id, index: slide.index };
  },

  async rebuildArchitecture(current, feedback, analysis, opts) {
    const out = await streamTask<{
      analysis: ProjectAnalysis;
      slides: Omit<SlideLogic, "id" | "index">[];
    }>("/ai/rebuild", { current, feedback, analysis }, "rebuild", opts);
    return {
      analysis: out.analysis,
      slides: out.slides.map((s, i) => ({ ...s, id: id(), index: i + 1 })),
    };
  },

  async recommendStyles(brief, analysis, slides, referenceImage, opts) {
    const out = await streamTask<{ styles: StyleVariant[] }>(
      "/ai/styles",
      { brief, analysis, slides, referenceImage },
      "style",
      opts,
    );
    return out.styles.map((s) => ({ ...s, fontFamily: "Poppins", origin: "recommended" as const }));
  },

  async designCustomStyle(description, brief, analysis, referenceImage, opts) {
    const out = await streamTask<{ style: StyleVariant }>(
      "/ai/style-from-prompt",
      { description, brief, analysis, referenceImage },
      "style",
      opts,
    );
    return { ...out.style, fontFamily: "Poppins", origin: "custom" as const };
  },

  async generateSlideContent(slide, style, opts) {
    const out = await streamTask<{
      headline: string;
      body: string;
      bullets: string[];
      imagePrompt: string;
    }>("/ai/write", { slide, style }, "write", opts);
    return {
      slideId: slide.id,
      headline: out.headline,
      body: out.body,
      bullets: out.bullets ?? [],
      imagePrompt: out.imagePrompt,
    };
  },

  async writeSlideCopy(skeleton, styleSpec, blueprint, narrative, priorHeadlines, opts) {
    return streamTask<SlideCopy>(
      "/ai/copy",
      { skeleton, styleSpec, blueprint, narrative, priorHeadlines },
      "write",
      opts,
    );
  },

  async planLayout(skeleton, copy, styleSpec, opts) {
    return streamTask<LayoutPlan>(
      "/ai/layout",
      { skeleton, copy, styleSpec },
      "plan",
      opts,
    );
  },

  async renderImage(prompt, opts) {
    opts?.onThought?.("openrouter · gemini 3.1 flash image · composing slide.", "render");
    const res = await fetch(`${BASE}/ai/image`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Image render failed: ${res.status} ${text.slice(0, 200)}`);
    }
    const json = (await res.json()) as { dataUrl?: string; error?: string };
    if (!json.dataUrl) throw new Error(json.error ?? "image model returned no image.");
    opts?.onThought?.("→ slide rendered.", "render");
    return json.dataUrl;
  },

  async judgeSlide(imageDataUrl, copy, styleSpec, skeleton, opts) {
    return streamTask<VisualQA>(
      "/ai/visual-qa",
      { imageDataUrl, copy, styleSpec, skeleton },
      "refine",
      opts,
    );
  },

  async judgeDeck(deckSummary, styleSpec, opts) {
    return streamTask<DeckQA>(
      "/ai/deck-qa",
      { deckSummary, styleSpec },
      "refine",
      opts,
    );
  },

  async generateSlideImage(slide, content, style, opts) {
    const prompt =
      content.imagePrompt ??
      `editorial 16:9 presentation slide, palette ${style.bg}/${style.fg}/${style.accent}, headline "${content.headline}", visual idea: ${slide.visualIdea}`;
    opts?.onThought?.(`imagen 4 · slide ${String(slide.index).padStart(2, "0")} · composing.`, "render");
    const res = await fetch(`${BASE}/ai/image`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Imagen 4 failed: ${res.status} ${text.slice(0, 200)}`);
    }
    const json = (await res.json()) as { dataUrl?: string; error?: string };
    if (!json.dataUrl) throw new Error(json.error ?? "Imagen returned no image.");
    opts?.onThought?.(`→ slide ${String(slide.index).padStart(2, "0")} rendered.`, "render");
    return json.dataUrl;
  },
};
