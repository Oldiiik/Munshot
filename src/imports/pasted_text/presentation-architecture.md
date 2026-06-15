Да, теперь понял точнее: тебе нужна **универсальная production-архитектура для “perfect first-shot presentation”**, не конкретно под Gemini/Mun Shot/один стиль.

Gamma и похожие продукты делают сильный акцент на editable-first: AI создает черновик, потом пользователь дорабатывает структуру, дизайн и контент. Gamma публично описывает себя как AI design partner для презентаций/документов/сайтов, где можно получить polished draft и затем редактировать через smart templates/blocks. ([Гамма][1]) ([Гамма][2]) У вас другой positioning: **не “AI draft editor”, а “first-shot final deck generator”**. Значит архитектура должна сместить всю редактуру **до рендера**, а после рендера оставить только regenerate/repair.

Ниже — как я бы строил идеальный pipeline.

---

# Core principle

Mun Shot не должен генерировать презентацию сразу после промпта.

Он должен сначала построить **идеальную внутреннюю спецификацию презентации**, а уже потом один раз отрендерить финальный deck.

То есть не:

```text
prompt → slides
```

А:

```text
prompt
→ intent
→ audience
→ story
→ slide plan
→ style system
→ copy
→ layout
→ validation
→ final render
```

Пользователь редактирует не готовые слайды, а **pre-render blueprint**.

Это главный architectural difference.

---

# Universal architecture for perfect presentation generation

## Stage 0 — Session setup

Создается `presentationSession`.

```ts
presentationSession = {
  id,
  userId,
  status: "briefing",
  createdAt,
  mode: "first_shot_final",
  targetOutput: {
    format: "16:9",
    slideCount: null,
    exportTypes: ["png", "pdf", "pptx_optional"]
  }
}
```

Сразу важно определить философию:

```ts
generationPolicy = {
  editableAfterRender: false,
  editableBeforeRender: true,
  renderOnlyAfterApproval: true,
  optimizeFor: "first_shot_quality"
}
```

---

# Stage 1 — Input intake

Пользователь может дать:

```text
1. Topic
2. Goal
3. Audience
4. Number of slides
5. Tone
6. Reference image/deck
7. Brand assets
8. Source files
9. Must-include points
10. Must-avoid points
```

Но UI не должен выглядеть как длинная форма. Лучше сделать **guided brief composer**.

Минимальный input:

```ts
briefInput = {
  rawPrompt,
  audience?,
  goal?,
  slideCount?,
  language?,
  referenceFiles?,
  brandFiles?,
  sourceFiles?
}
```

После этого запускаются parallel-анализаторы.

---

# Stage 2 — Parallel analyzers

Здесь ты не генерируешь слайды. Ты строишь понимание задачи.

## 2.1 Intent Analyzer

Определяет, что это за презентация:

```ts
presentationIntent = {
  deckType: "pitch" | "sales" | "educational" | "report" | "product" | "portfolio" | "proposal" | "strategy" | "internal_update",
  primaryGoal: "raise_money" | "explain" | "sell" | "teach" | "convince" | "summarize" | "launch",
  audienceKnowledge: "low" | "medium" | "expert",
  persuasionLevel: "low" | "medium" | "high",
  requiredDepth: "light" | "standard" | "deep",
  expectedStyle: "minimal" | "premium" | "corporate" | "brutalist" | "playful" | "technical" | "luxury"
}
```

## 2.2 Audience Analyzer

Супер важный этап. Perfect presentation зависит не от темы, а от аудитории.

```ts
audienceModel = {
  audience: "investors",
  caresAbout: ["market", "traction", "defensibility", "team", "return"],
  skepticismPoints: ["too early", "unclear moat", "market crowded"],
  languageLevel: "sharp, strategic, concise",
  forbiddenAssumptions: ["do not overexplain AI basics"]
}
```

## 2.3 Content Extractor

Если есть документы, заметки, сайт, PDF — вытащить:

```ts
sourceKnowledge = {
  facts,
  claims,
  metrics,
  quotes,
  productDetails,
  timeline,
  names,
  constraints,
  uncertainties
}
```

Важно: каждый факт должен иметь `confidence`.

```ts
fact = {
  text,
  source,
  confidence: 0.92,
  usableInDeck: true
}
```

## 2.4 Reference/Brand Analyzer

Если пользователь дал референс, ты не делаешь “style mood”. Ты делаешь **Design DNA**.

```ts
designDNA = {
  referenceMode: "none" | "loose" | "balanced" | "strict",
  palette,
  typographySystem,
  compositionRules,
  layoutArchetypes,
  spacingRules,
  visualDensity,
  imageTreatment,
  illustrationStyle,
  chartStyle,
  motionStyle,
  forbiddenDeviations
}
```

Если есть brand kit:

```ts
brandSystem = {
  logo,
  colors,
  fonts,
  toneOfVoice,
  legalRules,
  forbiddenColors,
  requiredFooter,
  brandStrictness
}
```

---

# Stage 3 — Missing information detector

До генерации нужно определить, чего не хватает.

Модель должна вернуть не просто вопросы, а **risk-based questions**.

```ts
missingInfoReport = {
  canProceed: true,
  qualityRisk: "medium",
  missingCritical: [],
  missingHelpful: [
    "target audience",
    "desired slide count",
    "reference style strictness"
  ],
  questions: [
    {
      id: "audience",
      question: "Who is this presentation for?",
      type: "single_select",
      options: ["Investors", "Customers", "Team", "Students", "General audience"],
      impact: "Changes narrative and evidence."
    }
  ]
}
```

Правило:

```text
Ask only questions that materially improve the final deck.
Do not ask decorative questions.
```

---

# Stage 4 — Pre-generation control panel

Вот здесь вы выигрываете у Gamma.

Gamma дает редактировать после. Вы даете редактировать **до**, но очень быстро.

UI должен показать пользователю не слайды, а **Deck Blueprint**:

```text
Presentation type
Audience
Goal
Tone
Style direction
Slide count
Narrative arc
Key claims
Must include
Must avoid
```

Пользователь может поправить это за 20–40 секунд.

Это не editor. Это **launch checklist**.

---

# Stage 5 — Narrative architecture

Теперь строится story.

Не slides yet. Сначала narrative.

```ts
narrativeArchitecture = {
  thesis,
  centralPromise,
  emotionalArc,
  logicalArc,
  persuasionStrategy,
  openingHook,
  closingMemory,
  objectionsToPreempt,
  proofStrategy
}
```

Пример для startup pitch:

```ts
persuasionStrategy = {
  sequence: [
    "pain",
    "why_now",
    "solution",
    "product",
    "market",
    "traction",
    "business_model",
    "team",
    "ask"
  ],
  evidenceRatio: 0.45,
  visionRatio: 0.25,
  productRatio: 0.30
}
```

Пример для educational deck:

```ts
sequence = [
  "context",
  "definition",
  "core_framework",
  "example",
  "application",
  "summary"
]
```

---

# Stage 6 — Slide logic board

Теперь генерируется массив слайдов.

Каждый слайд — это не текст и не картинка, а **job to be done**.

```ts
slideSkeleton = {
  id,
  role: "title" | "setup" | "problem" | "argument" | "evidence" | "comparison" | "process" | "transition" | "closer",
  narrativeBeat,
  keyMessage,
  audienceReactionTarget,
  supportingPoints,
  evidenceNeeded,
  visualIntent,
  layoutCandidate,
  densityTarget,
  importanceScore,
  riskScore
}
```

Пример:

```ts
{
  id: 3,
  role: "argument",
  narrativeBeat: "Define the product category",
  keyMessage: "Mun Shot is a launch system, not a planner",
  audienceReactionTarget: "They understand the category instantly",
  supportingPoints: [
    "It turns goals into missions",
    "It maps actions before rendering",
    "It creates final-ready output"
  ],
  visualIntent: "Three-part typographic system diagram",
  layoutCandidate: "triptych",
  densityTarget: "low",
  importanceScore: 0.88,
  riskScore: 0.22
}
```

Пользователь на этом этапе может:

```text
reorder
delete
add slide
change key message
change tone
change slide count
approve
```

Это ваша замена editable deck.

---

# Stage 7 — Deck-level style system

Стиль должен быть выбран **после narrative**, потому что дизайн зависит от содержания.

Не “3 random styles”, а 3 стратегических визуальных системы.

```ts
styleProposal = {
  id,
  name,
  bestFor,
  risk,
  palette,
  typography,
  layoutLanguage,
  visualMotifs,
  density,
  sampleSlideDescription,
  referenceFaithfulness
}
```

Если есть reference, варианты должны быть:

```text
1. Reference-faithful
2. Reference + more premium
3. Reference + more technical
```

Если нет reference:

```text
1. Investor premium
2. Product futuristic
3. Editorial minimal
```

После выбора:

```ts
styleSpec = {
  locked: true,
  version,
  palette,
  typography,
  spacing,
  grid,
  layoutArchetypes,
  imageStyle,
  iconStyle,
  chartStyle,
  componentLibrary,
  forbiddenStyles,
  textLimits
}
```

Ключ: `styleSpec` должен быть machine-renderable.

Не:

```text
modern, clean, beautiful
```

А:

```ts
titleFontSize: "72-96px",
bodyFontSize: "22-30px",
maxWordsPerSlide: 45,
marginX: "7%",
grid: "12-column",
background: "#F8FAFC",
accentUsage: "max 15%"
```

---

# Stage 8 — Copy generation

Для каждого слайда пишется copy.

Но не просто “текст”. Нужно возвращать **copy hierarchy**.

```ts
slideCopy = {
  headline,
  subheadline,
  sections,
  labels,
  captions,
  speakerNotes?,
  microcopy?,
  footer?,
  mustRenderText,
  optionalText,
  removedIdeas
}
```

Также обязательно:

```ts
copyQuality = {
  totalWords,
  readingTimeSeconds,
  clarityScore,
  persuasionScore,
  jargonScore,
  textRenderRisk
}
```

Правила для first-shot deck:

```text
One slide = one message.
Headline must communicate the point alone.
Body must support, not explain everything.
No slide should require tiny text.
```

---

# Stage 9 — Layout planning

Это стадия, которой обычно не хватает.

До image generation нужно создать точный layout plan.

```ts
layoutPlan = {
  slideId,
  canvas: "16:9",
  layoutType: "hero" | "split" | "triptych" | "timeline" | "comparison" | "stat" | "quote" | "process" | "matrix",
  grid,
  safeMargins,
  readingOrder,
  elements: [
    {
      id,
      type: "text" | "image" | "chart" | "shape" | "icon" | "pill" | "diagram",
      content,
      position,
      size,
      hierarchy,
      styleToken
    }
  ],
  whitespaceScoreTarget,
  balanceTarget,
  contrastTarget
}
```

Это можно делать LLM-ом, но лучше иметь **layout engine + LLM selector**.

То есть:

```text
LLM chooses layout type.
Code places elements.
LLM reviews composition.
```

Так будет намного стабильнее.

---

# Stage 10 — Pre-render validation

До дорогого image call запускается deck validator.

Он проверяет JSON, не картинку.

```ts
preRenderValidation = {
  deckScore,
  issues: [
    {
      slideId,
      severity: "critical",
      issue: "Too much text for image rendering",
      fix: "Reduce body from 72 words to 38 words"
    }
  ],
  canRender: false
}
```

Проверки:

```text
Slide count matches request
Every slide has one message
No duplicate key messages
No missing required points
Tone consistent
StyleSpec locked
Text within render limits
Layout supports copy
All required elements present
No hallucinated facts
Claims supported by source/confidence
```

Если `canRender: false`, система чинит сама.

---

# Stage 11 — Final render prompt builder

Только теперь создается prompt для image model.

Важно: prompt должен быть собран кодом из структурированных данных, а не написан свободно LLM-ом.

```ts
renderPrompt = buildPrompt({
  styleSpec,
  slideCopy,
  layoutPlan,
  brandRules,
  negativePrompt,
  referenceImages
})
```

Структура prompt:

```text
TASK
STYLE CONTRACT
CANVAS
LAYOUT
TEXT TO RENDER
VISUAL ELEMENTS
BRAND RULES
STRICT CONSTRAINTS
NEGATIVE PROMPT
QUALITY TARGET
```

Главные hard rules:

```text
Render exactly one slide.
Use only the provided text.
Do not add extra words.
Do not create unreadable small text.
Keep layout sparse.
Match the locked styleSpec.
```

---

# Stage 12 — Parallel rendering

Теперь можно рендерить в parallel.

```ts
renderQueue = {
  concurrency: 2-4,
  retryLimit: 2,
  timeout,
  statusPerSlide
}
```

Каждый slide получает:

```ts
renderedSlide = {
  imageUrl,
  promptHash,
  styleSpecVersion,
  copyVersion,
  layoutVersion,
  renderModel,
  seed?,
  status
}
```

---

# Stage 13 — Visual QA judge

Обязательная стадия.

Каждый готовый slide отправляется в vision evaluator.

```ts
visualQA = {
  overallScore,
  styleFidelity,
  textReadability,
  contentCompleteness,
  layoutBalance,
  brandCompliance,
  referenceSimilarity,
  issues,
  repairInstructions
}
```

Критерии:

```text
Is the requested content present?
Is text readable?
Are there spelling errors?
Does it match styleSpec?
Does it match reference if provided?
Is visual density correct?
Does it look like one deck?
Are there random artifacts?
```

Threshold:

```ts
if visualQA.overallScore < 85:
  repairSlide()
```

---

# Stage 14 — Targeted repair

Не просто regenerate.

Repair зависит от проблемы.

```ts
repairStrategy = {
  text_distortion: "reduce text, increase font size, simplify layout",
  wrong_style: "increase referenceWeight, restate style contract",
  missing_element: "force required element placement",
  too_busy: "remove decorative elements, increase whitespace",
  weak_composition: "switch layout archetype",
  factual_issue: "return to copy stage"
}
```

Максимум 1–2 авто-repair, чтобы не сжигать кредиты.

---

# Stage 15 — Deck consistency judge

После того как все slides прошли QA, нужно проверить deck как единое целое.

```ts
deckQA = {
  narrativeFlowScore,
  styleConsistencyScore,
  repetitionScore,
  pacingScore,
  slideOrderScore,
  finalReadinessScore,
  issues
}
```

Проверки:

```text
Does slide 2 logically follow slide 1?
Are headlines too repetitive?
Is style consistent?
Does the deck have rhythm?
Are there too many similar layouts?
Is the final slide memorable?
Does the deck satisfy the original goal?
```

Если проблема deck-level, чинить можно только affected slides.

---

# Stage 16 — Final packaging

Финальный output:

```ts
finalDeck = {
  slides: [
    {
      id,
      imageUrl,
      thumbnailUrl,
      title,
      qaScore
    }
  ],
  export: {
    pdfUrl,
    pptxUrl?,
    zipUrl?
  },
  metadata: {
    brief,
    styleSpec,
    narrativeArc,
    generatedAt
  }
}
```

Даже если слайды не editable, храните все intermediate JSON. Это позволяет делать:

```text
Regenerate slide
Regenerate deck in another style
Change slide count before render
Export later
Debug quality
A/B test models
```

---

# The full algorithm

Вот компактно весь алгоритм:

```text
1. User submits brief + optional files/reference.
2. System creates session.
3. Parallel analyzers extract intent, audience, source facts, brand, and design DNA.
4. System detects missing info and asks only high-impact questions.
5. User confirms pre-generation blueprint.
6. System builds narrative architecture.
7. System creates slide logic board.
8. User edits/approves logic board.
9. System proposes style systems.
10. User locks style.
11. System writes slide copy with strict render-safe limits.
12. System creates exact layout plans.
13. System validates all JSON before rendering.
14. System builds render prompts using code.
15. Image model renders slides in parallel.
16. Vision judge checks each slide.
17. Failed slides get targeted repair.
18. Deck-level judge checks consistency.
19. Final deck is packaged and delivered.
```

---

# Recommended data model

```ts
type PresentationSession = {
  id: string
  userId: string
  status:
    | "briefing"
    | "clarifying"
    | "blueprint_review"
    | "logic_board_review"
    | "style_review"
    | "copywriting"
    | "layout_planning"
    | "pre_render_validation"
    | "rendering"
    | "visual_qa"
    | "repairing"
    | "completed"
    | "failed"

  input: BriefInput
  context: PresentationContext
  narrative: NarrativeArchitecture
  slides: SlideState[]
  styleSpec: StyleSpec
  qa: DeckQA
}
```

```ts
type SlideState = {
  id: number
  skeleton: SlideSkeleton
  copy: SlideCopy
  layoutPlan: LayoutPlan
  renderPrompt: string
  imageUrl?: string
  qa?: VisualQA
  status:
    | "planned"
    | "copy_ready"
    | "layout_ready"
    | "rendered"
    | "qa_passed"
    | "needs_repair"
    | "failed"
}
```

---

# What makes this “first-shot perfect”

Три вещи:

## 1. Pre-render editability

Пользователь редактирует:

```text
brief
questions
logic board
style choice
slide messages
```

Но не двигает блоки после генерации.

## 2. Machine-readable design system

Стиль — это не moodboard. Это renderer contract.

```text
palette
grid
spacing
font scale
density
layout archetypes
negative prompt
reference strictness
```

## 3. Automated QA loop

Нельзя доверять image model. Нужно проверять:

```text
content
style
readability
layout
deck consistency
```

И чинить до показа пользователю.

---

# Самая важная мысль

Gamma может позволить себе “почти хорошо”, потому что пользователь потом редактирует. Вы не можете.

Поэтому у вас генерация должна быть не “creative generation”, а:

```text
specification-driven rendering
```

Меньше свободы image model. Больше структуры перед рендером.

Идеальная формула Mun Shot:

```text
Human edits intent.
AI perfects structure.
Code locks layout.
Image model renders beauty.
Vision model rejects bad output.
```

Вот это и есть архитектура для **perfect presentation from the first shot**.

[1]: https://gamma.app/?utm_source=chatgpt.com "Gamma | Best AI Presentation Maker & Website Builder"
[2]: https://gamma.app/products/presentations?utm_source=chatgpt.com "AI Deck Generator | Build Winning Presentations"
