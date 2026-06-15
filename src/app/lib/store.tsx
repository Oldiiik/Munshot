import { createContext, useCallback, useContext, useMemo, useReducer, useRef } from "react";
import { ai } from "./ai";
import { buildRenderPrompt, deriveStyleSpec, repairHintFor, validateDeck } from "./pipeline";
import type {
  Blueprint,
  ClarificationQuestion,
  DeckQA,
  FlowStage,
  NarrativeArchitecture,
  PreRenderValidation,
  Project,
  ProjectAnalysis,
  SlideContent,
  SlideLogic,
  SlideSkeleton,
  StyleSpec,
  StyleVariant,
  Thought,
  ThoughtPhase,
} from "./types";

type State = {
  stage: FlowStage;
  project: Project;
  selectedSlideId: string | null;
  thoughts: Thought[];
  busy: boolean;
  renderProgress: { done: number; total: number };
  error: string | null;
  recommendedStyles: StyleVariant[];
  stylesLoading: boolean;
  customStyleLoading: boolean;
};

type Action =
  | { type: "SET_STAGE"; stage: FlowStage }
  | { type: "RESET" }
  | { type: "SET_BRIEF"; brief: string; referenceImage?: string | null }
  | { type: "SET_ANALYSIS"; analysis: ProjectAnalysis }
  | { type: "SET_QUESTIONS"; questions: ClarificationQuestion[] }
  | { type: "ANSWER_QUESTION"; id: string; answer: string }
  | { type: "SET_BLUEPRINT"; blueprint: Blueprint }
  | { type: "PATCH_BLUEPRINT"; patch: Partial<Blueprint> }
  | { type: "SET_NARRATIVE"; narrative: NarrativeArchitecture }
  | { type: "SET_SKELETONS"; skeletons: SlideSkeleton[] }
  | { type: "SET_SLIDES"; slides: SlideLogic[] }
  | { type: "REPLACE_SLIDE"; slide: SlideLogic }
  | { type: "REMOVE_SLIDE"; id: string }
  | { type: "SELECT_SLIDE"; id: string | null }
  | { type: "SET_STYLE"; style: StyleVariant }
  | { type: "SET_STYLE_SPEC"; spec: StyleSpec }
  | { type: "SET_VALIDATION"; validation: PreRenderValidation }
  | { type: "SET_DECK_QA"; deckQA: DeckQA }
  | { type: "SET_CONTENT"; content: SlideContent }
  | { type: "ADD_THOUGHT"; thought: Thought }
  | { type: "CLEAR_THOUGHTS"; phase?: ThoughtPhase }
  | { type: "SET_BUSY"; busy: boolean }
  | { type: "SET_RENDER_PROGRESS"; done: number; total: number }
  | { type: "ERROR"; message: string | null }
  | { type: "SET_RECOMMENDED_STYLES"; styles: StyleVariant[] }
  | { type: "ADD_RECOMMENDED_STYLE"; style: StyleVariant }
  | { type: "SET_STYLES_LOADING"; loading: boolean }
  | { type: "SET_CUSTOM_STYLE_LOADING"; loading: boolean };

const empty: Project = {
  brief: "",
  questions: [],
  slides: [],
  generatedContent: {},
};

const initial: State = {
  stage: "landing",
  project: empty,
  selectedSlideId: null,
  thoughts: [],
  busy: false,
  renderProgress: { done: 0, total: 0 },
  error: null,
  recommendedStyles: [],
  stylesLoading: false,
  customStyleLoading: false,
};

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "SET_STAGE":     return { ...s, stage: a.stage };
    case "RESET":         return initial;
    case "SET_BRIEF":     return { ...s, project: { ...s.project, brief: a.brief, referenceImage: a.referenceImage } };
    case "SET_ANALYSIS":  return { ...s, project: { ...s.project, analysis: a.analysis } };
    case "SET_QUESTIONS": return { ...s, project: { ...s.project, questions: a.questions } };
    case "ANSWER_QUESTION":
      return {
        ...s,
        project: {
          ...s.project,
          questions: s.project.questions.map((q) => (q.id === a.id ? { ...q, answer: a.answer } : q)),
        },
      };
    case "SET_BLUEPRINT": return { ...s, project: { ...s.project, blueprint: a.blueprint } };
    case "PATCH_BLUEPRINT":
      return {
        ...s,
        project: {
          ...s.project,
          blueprint: s.project.blueprint
            ? { ...s.project.blueprint, ...a.patch }
            : s.project.blueprint,
        },
      };
    case "SET_NARRATIVE": return { ...s, project: { ...s.project, narrative: a.narrative } };
    case "SET_SKELETONS": return { ...s, project: { ...s.project, skeletons: a.skeletons } };
    case "SET_SLIDES":    return { ...s, project: { ...s.project, slides: a.slides } };
    case "REPLACE_SLIDE":
      return {
        ...s,
        project: {
          ...s.project,
          slides: s.project.slides.map((sl) => (sl.id === a.slide.id ? a.slide : sl)),
        },
      };
    case "REMOVE_SLIDE":
      return {
        ...s,
        project: {
          ...s.project,
          slides: s.project.slides
            .filter((sl) => sl.id !== a.id)
            .map((sl, i) => ({ ...sl, index: i + 1 })),
        },
        selectedSlideId: s.selectedSlideId === a.id ? null : s.selectedSlideId,
      };
    case "SELECT_SLIDE":  return { ...s, selectedSlideId: a.id };
    case "SET_STYLE":     return { ...s, project: { ...s.project, style: a.style } };
    case "SET_STYLE_SPEC": return { ...s, project: { ...s.project, styleSpec: a.spec } };
    case "SET_VALIDATION": return { ...s, project: { ...s.project, validation: a.validation } };
    case "SET_DECK_QA":   return { ...s, project: { ...s.project, deckQA: a.deckQA } };
    case "SET_CONTENT":
      return {
        ...s,
        project: {
          ...s.project,
          generatedContent: { ...s.project.generatedContent, [a.content.slideId]: a.content },
        },
      };
    case "ADD_THOUGHT":   return { ...s, thoughts: [...s.thoughts, a.thought] };
    case "CLEAR_THOUGHTS":
      return { ...s, thoughts: a.phase ? s.thoughts.filter((t) => t.phase !== a.phase) : [] };
    case "SET_BUSY":      return { ...s, busy: a.busy };
    case "SET_RENDER_PROGRESS": return { ...s, renderProgress: { done: a.done, total: a.total } };
    case "ERROR":         return { ...s, error: a.message };
    case "SET_RECOMMENDED_STYLES": return { ...s, recommendedStyles: a.styles };
    case "ADD_RECOMMENDED_STYLE":  return { ...s, recommendedStyles: [...s.recommendedStyles, a.style] };
    case "SET_STYLES_LOADING":     return { ...s, stylesLoading: a.loading };
    case "SET_CUSTOM_STYLE_LOADING": return { ...s, customStyleLoading: a.loading };
    default:              return s;
  }
}

type Ctx = {
  state: State;
  dispatch: React.Dispatch<Action>;
  startFlow: () => void;
  reset: () => void;
  submitBrief: (brief: string, referenceImage?: string | null) => Promise<void>;
  answerQuestion: (id: string, answer: string) => void;
  finishQuestions: () => Promise<void>;
  patchBlueprint: (patch: Partial<Blueprint>) => void;
  confirmBlueprint: () => Promise<void>;
  selectSlide: (id: string | null) => void;
  removeSlide: (id: string) => void;
  refineSlide: (id: string, feedback: string) => Promise<void>;
  rebuildArchitecture: (feedback: string) => Promise<void>;
  approveLogic: () => Promise<void>;
  pickStyle: (style: StyleVariant) => Promise<void>;
  designCustomStyle: (description: string) => Promise<void>;
};

const StoreContext = createContext<Ctx | null>(null);

const tid = () => Math.random().toString(36).slice(2, 9);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const stateRef = useRef(state);
  stateRef.current = state;

  const onThought = useCallback(
    (text: string, phase: ThoughtPhase) =>
      dispatch({ type: "ADD_THOUGHT", thought: { id: tid(), text, phase, ts: Date.now() } }),
    [],
  );

  const startFlow = useCallback(() => {
    dispatch({ type: "CLEAR_THOUGHTS" });
    dispatch({ type: "SET_STAGE", stage: "brief" });
  }, []);

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  const submitBrief = useCallback(
    async (brief: string, referenceImage?: string | null) => {
      dispatch({ type: "SET_BRIEF", brief, referenceImage });
      dispatch({ type: "CLEAR_THOUGHTS", phase: "analyze" });
      dispatch({ type: "CLEAR_THOUGHTS", phase: "clarify" });
      dispatch({ type: "SET_STAGE", stage: "analyzing" });
      dispatch({ type: "SET_BUSY", busy: true });
      try {
        const analysis = await ai.analyzeBrief(brief, { onThought });
        dispatch({ type: "SET_ANALYSIS", analysis });
        const questions = await ai.generateClarifications(brief, analysis, { onThought });
        dispatch({ type: "SET_QUESTIONS", questions });
        dispatch({ type: "SET_STAGE", stage: "questions" });
      } catch (e) {
        dispatch({ type: "ERROR", message: (e as Error).message });
      } finally {
        dispatch({ type: "SET_BUSY", busy: false });
      }
    },
    [onThought],
  );

  const answerQuestion = useCallback(
    (id: string, answer: string) => dispatch({ type: "ANSWER_QUESTION", id, answer }),
    [],
  );

  const finishQuestions = useCallback(async () => {
    const project = stateRef.current.project;
    if (!project.analysis) return;
    dispatch({ type: "CLEAR_THOUGHTS", phase: "plan" });
    dispatch({ type: "SET_STAGE", stage: "planning" });
    dispatch({ type: "SET_BUSY", busy: true });
    try {
      const blueprint = await ai.deriveBlueprint(
        project.brief,
        project.analysis,
        project.questions,
        { onThought },
      );
      dispatch({ type: "SET_BLUEPRINT", blueprint });
      dispatch({ type: "SET_STAGE", stage: "blueprint" });
    } catch (e) {
      dispatch({ type: "ERROR", message: (e as Error).message });
    } finally {
      dispatch({ type: "SET_BUSY", busy: false });
    }
  }, [onThought]);

  const patchBlueprint = useCallback(
    (patch: Partial<Blueprint>) => dispatch({ type: "PATCH_BLUEPRINT", patch }),
    [],
  );

  const confirmBlueprint = useCallback(async () => {
    const project = stateRef.current.project;
    if (!project.analysis || !project.blueprint) return;
    dispatch({ type: "CLEAR_THOUGHTS", phase: "plan" });
    dispatch({ type: "SET_STAGE", stage: "narrative" });
    dispatch({ type: "SET_BUSY", busy: true });
    try {
      const narrative = await ai.generateNarrative(
        project.brief,
        project.analysis,
        project.questions,
        { onThought },
      );
      dispatch({ type: "SET_NARRATIVE", narrative });
      dispatch({ type: "SET_STAGE", stage: "planning" });
      const skeletons = await ai.generateSkeletons(
        project.brief,
        project.analysis,
        narrative,
        project.blueprint.slideCount,
        { onThought },
      );
      dispatch({ type: "SET_SKELETONS", skeletons });
      // Project skeletons into legacy SlideLogic so the existing logic board UI keeps working.
      const slides: SlideLogic[] = skeletons.map((sk) => ({
        id: sk.id,
        index: sk.index,
        title: sk.keyMessage,
        purpose: sk.narrativeBeat,
        mainMessage: sk.keyMessage,
        suggestedContent: sk.supportingPoints.join(" • "),
        visualIdea: sk.visualIntent,
        layoutDirection: sk.layoutCandidate,
        tone: sk.densityTarget,
        roleInStory: sk.role,
      }));
      dispatch({ type: "SET_SLIDES", slides });
      dispatch({ type: "SET_STAGE", stage: "logic" });
    } catch (e) {
      dispatch({ type: "ERROR", message: (e as Error).message });
    } finally {
      dispatch({ type: "SET_BUSY", busy: false });
    }
  }, [onThought]);

  const selectSlide = useCallback((id: string | null) => dispatch({ type: "SELECT_SLIDE", id }), []);
  const removeSlide = useCallback((id: string) => dispatch({ type: "REMOVE_SLIDE", id }), []);

  const refineSlide = useCallback(
    async (id: string, feedback: string) => {
      const slide = stateRef.current.project.slides.find((s) => s.id === id);
      if (!slide) return;
      dispatch({ type: "SET_BUSY", busy: true });
      try {
        const refined = await ai.editSlide(slide, feedback, { onThought });
        dispatch({ type: "REPLACE_SLIDE", slide: refined });
      } finally {
        dispatch({ type: "SET_BUSY", busy: false });
      }
    },
    [onThought],
  );

  const rebuildArchitecture = useCallback(
    async (feedback: string) => {
      const project = stateRef.current.project;
      if (!project.analysis) return;
      dispatch({ type: "CLEAR_THOUGHTS", phase: "rebuild" });
      dispatch({ type: "SET_STAGE", stage: "planning" });
      dispatch({ type: "SET_BUSY", busy: true });
      try {
        const { slides, analysis } = await ai.rebuildArchitecture(project.slides, feedback, project.analysis, { onThought });
        dispatch({ type: "SET_ANALYSIS", analysis });
        dispatch({ type: "SET_SLIDES", slides });
        dispatch({ type: "SET_STAGE", stage: "logic" });
      } finally {
        dispatch({ type: "SET_BUSY", busy: false });
      }
    },
    [onThought],
  );

  const approveLogic = useCallback(async () => {
    const project = stateRef.current.project;
    if (!project.analysis) return;
    dispatch({ type: "CLEAR_THOUGHTS", phase: "style" });
    dispatch({ type: "SET_STAGE", stage: "style" });
    dispatch({ type: "SET_RECOMMENDED_STYLES", styles: [] });
    dispatch({ type: "SET_STYLES_LOADING", loading: true });
    try {
      const styles = await ai.recommendStyles(project.brief, project.analysis, project.slides, project.referenceImage, { onThought });
      dispatch({ type: "SET_RECOMMENDED_STYLES", styles });
    } catch (e) {
      dispatch({ type: "ERROR", message: (e as Error).message });
    } finally {
      dispatch({ type: "SET_STYLES_LOADING", loading: false });
    }
  }, [onThought]);

  const designCustomStyle = useCallback(
    async (description: string) => {
      const project = stateRef.current.project;
      if (!project.analysis) return;
      dispatch({ type: "SET_CUSTOM_STYLE_LOADING", loading: true });
      try {
        const style = await ai.designCustomStyle(description, project.brief, project.analysis, project.referenceImage, { onThought });
        dispatch({ type: "ADD_RECOMMENDED_STYLE", style });
      } catch (e) {
        dispatch({ type: "ERROR", message: (e as Error).message });
      } finally {
        dispatch({ type: "SET_CUSTOM_STYLE_LOADING", loading: false });
      }
    },
    [onThought],
  );

  const pickStyle = useCallback(
    async (style: StyleVariant) => {
      dispatch({ type: "SET_STYLE", style });
      dispatch({ type: "CLEAR_THOUGHTS", phase: "write" });
      dispatch({ type: "CLEAR_THOUGHTS", phase: "render" });
      dispatch({ type: "CLEAR_THOUGHTS", phase: "refine" });
      dispatch({ type: "SET_BUSY", busy: true });

      const project = stateRef.current.project;
      const skeletons = project.skeletons ?? [];
      const blueprint = project.blueprint;
      const narrative = project.narrative;
      const slides = project.slides;

      // Derive machine-readable styleSpec from the picked variant + blueprint.
      const styleSpec = deriveStyleSpec(style, blueprint);
      dispatch({ type: "SET_STYLE_SPEC", spec: styleSpec });

      dispatch({ type: "SET_RENDER_PROGRESS", done: 0, total: slides.length });

      try {
        // Stage A — write copy for every slide (cheap, fully resolved before any image).
        const copies = [] as Awaited<ReturnType<typeof ai.writeSlideCopy>>[];
        const priorHeadlines: string[] = [];
        for (let i = 0; i < skeletons.length; i++) {
          const sk = skeletons[i];
          const copy = blueprint && narrative
            ? await ai.writeSlideCopy(sk, styleSpec, blueprint, narrative, priorHeadlines, { onThought })
            : null;
          if (copy) {
            copies.push({ ...copy, slideId: sk.id });
            priorHeadlines.push(copy.headline);
          }
        }

        // Stage B — pre-render validation (code-side, no LLM).
        if (copies.length) {
          const validation = validateDeck(copies, styleSpec, blueprint);
          dispatch({ type: "SET_VALIDATION", validation });
          dispatch({ type: "SET_STAGE", stage: "validating" });
          if (!validation.canRender) {
            for (const issue of validation.issues.filter((i) => i.severity === "critical")) {
              onThought(`validation · ${issue.issue}`, "refine");
            }
          }
        }

        dispatch({ type: "SET_STAGE", stage: "generating" });

        // Stage C — per-slide layout → render → QA → repair.
        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i];
          const skeleton = skeletons.find((sk) => sk.id === slide.id) ?? skeletons[i];
          const copy = copies[i];

          let content: SlideContent;
          if (copy && skeleton) {
            const layoutPlan = await ai.planLayout(skeleton, copy, styleSpec, { onThought }).catch(() => undefined);
            const prompt = buildRenderPrompt({ copy, layoutPlan, styleSpec, slide: skeleton, blueprint });
            const imageUrl = await ai.renderImage(prompt, { onThought });

            // Visual QA judge (vision call).
            let qa = await ai.judgeSlide(imageUrl, copy, styleSpec, skeleton, { onThought }).catch(() => undefined);
            let finalUrl = imageUrl;
            let attempts = 0;

            // One auto-repair pass if QA score is below threshold.
            if (qa && qa.overallScore < 85 && qa.failureType !== "factual_issue") {
              attempts = 1;
              dispatch({ type: "SET_STAGE", stage: "repairing" });
              onThought(`repair · slide ${i + 1} score ${qa.overallScore}, ${qa.failureType ?? "unknown"}.`, "refine");
              const repairHint = repairHintFor(qa);
              const repairPrompt = buildRenderPrompt({ copy, layoutPlan, styleSpec, slide: skeleton, blueprint, repairHint });
              try {
                finalUrl = await ai.renderImage(repairPrompt, { onThought });
                const qa2 = await ai.judgeSlide(finalUrl, copy, styleSpec, skeleton, { onThought }).catch(() => undefined);
                if (qa2) qa = qa2;
              } catch (e) {
                onThought(`repair failed: ${(e as Error).message}`, "refine");
              }
              dispatch({ type: "SET_STAGE", stage: "generating" });
            }

            content = {
              slideId: slide.id,
              headline: copy.headline,
              body: copy.subheadline ?? copy.sections?.[0]?.body ?? "",
              bullets: copy.bullets ?? [],
              imageUrl: finalUrl,
              imagePrompt: prompt,
              qa,
              repairAttempts: attempts,
            };
          } else {
            // Legacy fallback if the skeleton/blueprint/narrative weren't captured.
            const legacy = await ai.generateSlideContent(slide, style, { onThought });
            const url = await ai.generateSlideImage(slide, legacy, style, { onThought });
            content = { ...legacy, imageUrl: url };
          }

          dispatch({ type: "SET_CONTENT", content });
          dispatch({ type: "SET_RENDER_PROGRESS", done: i + 1, total: slides.length });
        }

        // Stage D — deck-level QA judge.
        try {
          dispatch({ type: "SET_STAGE", stage: "qa" });
          const generated = stateRef.current.project.generatedContent;
          const summary = slides.map((sl, i) => {
            const c = generated[sl.id];
            const sk = skeletons.find((s) => s.id === sl.id);
            return {
              id: sl.id,
              role: sk?.role ?? sl.roleInStory,
              headline: c?.headline ?? sl.title,
              layout: sk?.layoutCandidate ?? sl.layoutDirection,
              qa: c?.qa,
            };
          });
          const deckQA = await ai.judgeDeck(summary, styleSpec, { onThought });
          dispatch({ type: "SET_DECK_QA", deckQA });
        } catch (e) {
          onThought(`deck-qa skipped: ${(e as Error).message}`, "refine");
        }

        dispatch({ type: "SET_STAGE", stage: "deck" });
      } catch (e) {
        dispatch({ type: "ERROR", message: (e as Error).message });
        dispatch({ type: "SET_STAGE", stage: "deck" });
      } finally {
        dispatch({ type: "SET_BUSY", busy: false });
      }
    },
    [onThought],
  );

  const value = useMemo<Ctx>(
    () => ({
      state,
      dispatch,
      startFlow,
      reset,
      submitBrief,
      answerQuestion,
      finishQuestions,
      patchBlueprint,
      confirmBlueprint,
      selectSlide,
      removeSlide,
      refineSlide,
      rebuildArchitecture,
      approveLogic,
      pickStyle,
      designCustomStyle,
    }),
    [state, dispatch, startFlow, reset, submitBrief, answerQuestion, finishQuestions, patchBlueprint, confirmBlueprint, selectSlide, removeSlide, refineSlide, rebuildArchitecture, approveLogic, pickStyle, designCustomStyle],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
