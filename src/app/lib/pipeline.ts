import type {
  Blueprint,
  LayoutPlan,
  PreRenderValidation,
  SlideCopy,
  SlideLogic,
  SlideSkeleton,
  StyleSpec,
  StyleVariant,
  ValidationIssue,
  VisualQA,
} from "./types";

// ─── StyleSpec derivation ────────────────────────────────────────────────────
// Derive a machine-readable StyleSpec from the user's picked StyleVariant + Blueprint.
// This is the "renderer contract" — concrete numbers, not mood words.

const DENSITY_BY_DIRECTION: Record<string, "low" | "medium" | "high"> = {
  minimal: "low",
  editorial: "low",
  premium: "low",
  brutalist: "medium",
  technical: "high",
  corporate: "medium",
  playful: "medium",
  luxury: "low",
};

function inferDensity(blueprint: Blueprint | undefined): "low" | "medium" | "high" {
  const dir = (blueprint?.styleDirection ?? "").toLowerCase();
  for (const k of Object.keys(DENSITY_BY_DIRECTION)) {
    if (dir.includes(k)) return DENSITY_BY_DIRECTION[k];
  }
  return "medium";
}

export function deriveStyleSpec(variant: StyleVariant, blueprint?: Blueprint): StyleSpec {
  const density = inferDensity(blueprint);
  const maxWords = density === "low" ? 35 : density === "medium" ? 55 : 80;
  return {
    locked: true,
    version: 1,
    name: variant.name,
    palette: { bg: variant.bg, fg: variant.fg, accent: variant.accent },
    typography: {
      fontFamily: variant.fontFamily || "Poppins",
      titleFontSizePx: density === "low" ? [80, 112] : [64, 96],
      bodyFontSizePx: density === "high" ? [18, 24] : [22, 30],
      weightTitle: 300,
      weightBody: 400,
    },
    spacing: { marginXPct: density === "low" ? 8 : 6, marginYPct: 7 },
    grid: { columns: 12, gutterPx: 24 },
    layoutArchetypes: ["hero", "split", "triptych", "stat", "quote", "comparison", "process", "matrix", "timeline"],
    imageStyle: "editorial photographic, soft lighting, no stock-photo cliches, no watermarks",
    chartStyle: "flat, single-accent highlight, generous whitespace",
    density,
    textLimits: { maxWordsPerSlide: maxWords, maxBulletWords: 8 },
    accentUsageMaxPct: 15,
    forbiddenStyles: ["clipart", "drop shadows", "skeuomorphism", "lens flare", "rainbow gradients"],
    referenceFaithfulness: blueprint?.referenceStrictness ?? "none",
  };
}

// ─── Pre-render validator ────────────────────────────────────────────────────

export function validateDeck(
  copies: SlideCopy[],
  styleSpec: StyleSpec,
  blueprint?: Blueprint,
): PreRenderValidation {
  const issues: ValidationIssue[] = [];
  const seenMessages = new Set<string>();

  if (blueprint && copies.length !== blueprint.slideCount) {
    issues.push({
      severity: "warn",
      issue: `slide count drift: have ${copies.length}, blueprint asked for ${blueprint.slideCount}`,
      fix: "regenerate skeletons or accept new count",
    });
  }

  for (const c of copies) {
    const wordCount = c.quality?.totalWords ?? estimateWords(c);
    if (wordCount > styleSpec.textLimits.maxWordsPerSlide) {
      issues.push({
        slideId: c.slideId,
        severity: "critical",
        issue: `slide ${c.slideId} has ${wordCount} words; styleSpec cap is ${styleSpec.textLimits.maxWordsPerSlide}`,
        fix: `trim body and bullets to fit ${styleSpec.textLimits.maxWordsPerSlide} words`,
      });
    }
    if (!c.headline?.trim()) {
      issues.push({
        slideId: c.slideId,
        severity: "critical",
        issue: `slide ${c.slideId} has no headline`,
        fix: "add a one-sentence headline that communicates the point alone",
      });
    }
    const norm = c.headline.trim().toLowerCase();
    if (norm && seenMessages.has(norm)) {
      issues.push({
        slideId: c.slideId,
        severity: "warn",
        issue: `duplicate headline: "${c.headline}"`,
        fix: "rewrite this slide's headline",
      });
    }
    seenMessages.add(norm);
    for (const b of c.bullets ?? []) {
      const w = b.trim().split(/\s+/).filter(Boolean).length;
      if (w > styleSpec.textLimits.maxBulletWords) {
        issues.push({
          slideId: c.slideId,
          severity: "warn",
          issue: `bullet too long (${w} words): "${b}"`,
          fix: `compress to ≤${styleSpec.textLimits.maxBulletWords} words`,
        });
      }
    }
    if (c.quality?.textRenderRisk === "high") {
      issues.push({
        slideId: c.slideId,
        severity: "critical",
        issue: `slide ${c.slideId} flagged high text-render risk`,
        fix: "reduce text or switch to a stat/quote layout",
      });
    }
  }

  const critical = issues.filter((i) => i.severity === "critical").length;
  const warn = issues.filter((i) => i.severity === "warn").length;
  const deckScore = Math.max(0, 100 - critical * 25 - warn * 8);
  return { deckScore, canRender: critical === 0, issues };
}

function estimateWords(c: SlideCopy): number {
  const parts = [c.headline, c.subheadline ?? "", ...(c.bullets ?? []), ...(c.captions ?? []), ...c.sections.map((s) => `${s.label} ${s.body}`)];
  return parts.join(" ").trim().split(/\s+/).filter(Boolean).length;
}

// ─── Code-built render prompt ────────────────────────────────────────────────
// Replaces free-form imagePrompt LLM output with a structured prompt assembled
// from spec + copy + layout. The image model gets the same contract every time.

export function buildRenderPrompt(args: {
  copy: SlideCopy;
  layoutPlan?: LayoutPlan;
  styleSpec: StyleSpec;
  slide: SlideLogic | SlideSkeleton;
  blueprint?: Blueprint;
  repairHint?: string;
}): string {
  const { copy, layoutPlan, styleSpec, slide, blueprint, repairHint } = args;
  const palette = `bg ${styleSpec.palette.bg}, fg ${styleSpec.palette.fg}, accent ${styleSpec.palette.accent}`;
  const layoutType = layoutPlan?.layoutType ?? (slide as any).layoutCandidate ?? (slide as any).layoutDirection ?? "hero";
  const visualIntent = (slide as any).visualIntent ?? (slide as any).visualIdea ?? "";
  const role = (slide as any).role ?? (slide as any).roleInStory ?? "argument";

  const textBlock = [
    `HEADLINE (must render): "${copy.headline}"`,
    copy.subheadline ? `SUBHEADLINE: "${copy.subheadline}"` : "",
    copy.bullets?.length ? `BULLETS:\n${copy.bullets.map((b, i) => `  ${i + 1}. ${b}`).join("\n")}` : "",
    copy.captions?.length ? `CAPTIONS: ${copy.captions.join(" / ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return [
    "TASK",
    "Render exactly ONE 16:9 presentation slide as a single full-bleed image. No frames, no browser chrome, no slide deck UI.",
    "",
    "STYLE CONTRACT",
    `palette ${palette}; max accent usage ${styleSpec.accentUsageMaxPct}%`,
    `typography ${styleSpec.typography.fontFamily}, title ${styleSpec.typography.titleFontSizePx[0]}-${styleSpec.typography.titleFontSizePx[1]}px weight ${styleSpec.typography.weightTitle}, body ${styleSpec.typography.bodyFontSizePx[0]}-${styleSpec.typography.bodyFontSizePx[1]}px weight ${styleSpec.typography.weightBody}`,
    `density ${styleSpec.density}; margins ${styleSpec.spacing.marginXPct}% x ${styleSpec.spacing.marginYPct}%; ${styleSpec.grid.columns}-column grid`,
    `image style: ${styleSpec.imageStyle}`,
    blueprint ? `style direction: ${blueprint.styleDirection}; tone: ${blueprint.tone}` : "",
    "",
    "CANVAS",
    "16:9 aspect ratio, full bleed.",
    "",
    "LAYOUT",
    `archetype: ${layoutType}; slide role: ${role}`,
    visualIntent ? `visual intent: ${visualIntent}` : "",
    "",
    "TEXT TO RENDER",
    textBlock,
    copy.mustRenderText?.length ? `MUST RENDER VERBATIM: ${copy.mustRenderText.map((s) => `"${s}"`).join(", ")}` : "",
    "",
    "STRICT CONSTRAINTS",
    "- Use ONLY the text above. Do not invent words, do not add lorem ipsum.",
    `- Total on-slide words must not exceed ${styleSpec.textLimits.maxWordsPerSlide}.`,
    "- Spelling must be exact. No garbled text, no fake glyphs, no decorative gibberish.",
    "- Keep negative space generous; do not crowd the canvas.",
    "- Use typographic marks (—, ·, ↳, ●) instead of icons.",
    "",
    "NEGATIVE PROMPT",
    `forbidden: ${styleSpec.forbiddenStyles.join(", ")}, watermarks, signatures, page numbers added, presenter notes, UI chrome, multiple slides in one image`,
    repairHint ? `\nREPAIR DIRECTIVE\n${repairHint}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

// ─── Repair strategy mapping ─────────────────────────────────────────────────

export function repairHintFor(qa: VisualQA): string {
  switch (qa.failureType) {
    case "text_distortion":
      return "Reduce text volume by 30%, increase title size, simplify layout. Render fewer words at larger sizes for legibility.";
    case "wrong_style":
      return "Restate the style contract verbatim. Match palette exactly. Avoid stylistic deviation.";
    case "missing_element":
      return `Force placement of: ${qa.repairInstructions ?? "all required elements"}.`;
    case "too_busy":
      return "Remove decorative elements; increase whitespace by 20%; reduce layout to a single hero composition.";
    case "weak_composition":
      return "Switch to a different layout archetype (e.g. stat or quote) better suited to this content.";
    case "factual_issue":
      return "Re-render the slide; the factual content needs revision upstream.";
    default:
      return qa.repairInstructions ?? "Improve overall composition and legibility.";
  }
}
