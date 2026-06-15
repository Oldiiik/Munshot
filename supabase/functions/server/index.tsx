import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
import { runTextTask } from "./gemini.tsx";
import { generateImageViaOpenRouter } from "./openrouter.tsx";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const app = new Hono();

app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

app.get("/make-server-84204692/health", (c) => c.json({ status: "ok" }));

// ---------- Waitlist ----------
app.post("/make-server-84204692/waitlist", async (c) => {
  try {
    const body = await c.req.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const tier = body?.tier === "founder" ? "founder" : "free";
    const referrer = String(body?.referrer || "").slice(0, 200);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ error: "invalid_email" }, 400);
    }
    const key = `waitlist:${email}`;
    const existing = await kv.get(key);
    const now = new Date().toISOString();
    const record = existing
      ? { ...existing, tier: tier === "founder" ? "founder" : existing.tier, updatedAt: now }
      : { email, tier, referrer, createdAt: now, updatedAt: now };
    await kv.set(key, record);
    const countList = await kv.getByPrefix("waitlist:");
    return c.json({ ok: true, position: countList.length, tier: record.tier });
  } catch (e: any) {
    console.log("waitlist error:", e?.message || e);
    return c.json({ error: "server_error" }, 500);
  }
});

app.get("/make-server-84204692/waitlist/count", async (c) => {
  try {
    const list = await kv.getByPrefix("waitlist:");
    return c.json({ count: list.length });
  } catch {
    return c.json({ count: 0 });
  }
});

// ---------- AI: text tasks (plain JSON: { thoughts, result } or { error }) ----

async function runTask(taskPrompt: string, imageDataUrl?: string) {
  const out = await runTextTask(taskPrompt, imageDataUrl);
  if ("error" in out) {
    console.log("Mun Shot AI error:", out.error);
    return new Response(JSON.stringify({ error: out.error }), {
      status: 502,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
  return new Response(JSON.stringify({ thoughts: out.thoughts, result: out.result }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

app.post("/make-server-84204692/ai/analyze", async (c) => {
  const { brief } = await c.req.json();
  return runTask(`TASK: analyze a presentation brief.

BRIEF:
"""${brief}"""

Output schema for RESULT:
{
  "goal": string,
  "audience": string,
  "presentationType": "investor"|"sales"|"internal"|"academic"|"product"|"keynote"|"other",
  "tone": string,
  "missingInfo": string[]
}

THINK lines should describe how you classified the type, who the audience is, and what is missing.`);
});

app.post("/make-server-84204692/ai/clarify", async (c) => {
  const { brief, analysis } = await c.req.json();
  return runTask(`TASK: write 3 to 4 clarification questions for the user, only where missing info would change the story.

BRIEF: """${brief}"""
ANALYSIS: ${JSON.stringify(analysis)}

Output schema for RESULT:
{ "questions": [ { "question": string, "reason": string } ] }

THINK lines should explain what gaps you saw in the brief.`);
});

app.post("/make-server-84204692/ai/plan", async (c) => {
  const { brief, analysis, answers } = await c.req.json();
  return runTask(`TASK: produce a slide-by-slide LOGIC plan for this presentation. 6 to 9 slides.

BRIEF: """${brief}"""
ANALYSIS: ${JSON.stringify(analysis)}
USER ANSWERS: ${JSON.stringify(answers)}

Output schema for RESULT:
{
  "slides": [
    {
      "title": string,
      "purpose": string,
      "mainMessage": string,
      "suggestedContent": string,
      "visualIdea": string,
      "layoutDirection": string,
      "tone": string,
      "roleInStory": string
    }
  ]
}

THINK lines should narrate the architectural choices: why this blueprint, why this order, what each slide is doing for the audience.`);
});

app.post("/make-server-84204692/ai/blueprint", async (c) => {
  const { brief, analysis, answers } = await c.req.json();
  return runTask(`TASK: derive a DECK BLUEPRINT (pre-render checklist) from the brief, analysis, and clarification answers. The user will scan-edit this in 20-40 seconds before any heavy generation runs.

BRIEF: """${brief}"""
ANALYSIS: ${JSON.stringify(analysis)}
USER ANSWERS: ${JSON.stringify(answers)}

Output schema for RESULT:
{
  "presentationType": "pitch"|"sales"|"educational"|"report"|"product"|"portfolio"|"proposal"|"strategy"|"internal_update",
  "audience": string (one short phrase),
  "goal": string (one sentence, action-oriented),
  "tone": string (2-3 adjectives, lowercase),
  "styleDirection": string (one short phrase, e.g. "editorial minimal" or "brutalist + soft pink"),
  "slideCount": number (6-12),
  "narrativeArcSummary": string (one sentence describing the arc),
  "keyClaims": string[] (3-5 short claims the deck must establish),
  "mustInclude": string[] (0-4 specific items pulled from brief/answers),
  "mustAvoid": string[] (0-3 items, only if implied),
  "referenceStrictness": "none"|"loose"|"balanced"|"strict"
}

Rules:
- presentationType maps user's domain to the closest enum.
- slideCount: pick a number that fits the depth implied by the answers. Default 8 if unclear.
- narrativeArcSummary is a single sentence — not a list.
- referenceStrictness: "none" if no reference, otherwise infer from how prescriptive the user was.

THINK lines should justify the choices: why this slideCount, what the arc is, what claims you derived.`);
});

app.post("/make-server-84204692/ai/narrative", async (c) => {
  const { brief, analysis, answers } = await c.req.json();
  return runTask(`TASK: build the NARRATIVE ARCHITECTURE for this presentation. No slides yet — only the story spine.

BRIEF: """${brief}"""
ANALYSIS: ${JSON.stringify(analysis)}
USER ANSWERS: ${JSON.stringify(answers)}

Output schema for RESULT:
{
  "thesis": string,
  "centralPromise": string,
  "emotionalArc": string,
  "logicalArc": string,
  "persuasionStrategy": {
    "sequence": string[],
    "evidenceRatio": number,
    "visionRatio": number,
    "productRatio": number
  },
  "openingHook": string,
  "closingMemory": string,
  "objectionsToPreempt": string[],
  "proofStrategy": string
}

The persuasionStrategy.sequence is the ordered list of beats (e.g. ["pain","why_now","solution","product","traction","ask"] for a pitch). The three ratios must sum to ~1.0.

THINK lines should narrate the story arc decision: thesis, why this sequence, what objections you anticipate.`);
});

app.post("/make-server-84204692/ai/skeletons", async (c) => {
  const { brief, analysis, narrative, slideCount } = await c.req.json();
  const target = typeof slideCount === "number" ? slideCount : 8;
  return runTask(`TASK: produce the SLIDE LOGIC BOARD — one skeleton per slide, derived from the narrative architecture. ${target} slides.

BRIEF: """${brief}"""
ANALYSIS: ${JSON.stringify(analysis)}
NARRATIVE: ${JSON.stringify(narrative)}

Each slide is a "job to be done" — not yet copy or imagery. Map narrative.persuasionStrategy.sequence to slide roles.

Output schema for RESULT:
{
  "slides": [
    {
      "role": "title"|"setup"|"problem"|"argument"|"evidence"|"comparison"|"process"|"transition"|"closer",
      "narrativeBeat": string,
      "keyMessage": string,
      "audienceReactionTarget": string,
      "supportingPoints": string[],
      "evidenceNeeded": string[],
      "visualIntent": string,
      "layoutCandidate": "hero"|"split"|"triptych"|"timeline"|"comparison"|"stat"|"quote"|"process"|"matrix",
      "densityTarget": "low"|"medium"|"high",
      "importanceScore": number,
      "riskScore": number
    }
  ]
}

Rules:
- One message per slide. keyMessage must be a complete sentence.
- supportingPoints: max 3 items.
- importanceScore and riskScore: 0..1.
- densityTarget should be "low" for emotional/title/closer slides, "medium" or "high" only for evidence/comparison.

THINK lines should explain how each beat in the narrative sequence becomes a slide and why each role/layout was chosen.`);
});

app.post("/make-server-84204692/ai/refine", async (c) => {
  const { slide, feedback } = await c.req.json();
  return runTask(`TASK: refine ONE slide based on user feedback. Keep the slide id and index. Update only fields that should change.

SLIDE: ${JSON.stringify(slide)}
USER FEEDBACK: """${feedback}"""

Output schema for RESULT:
{
  "slide": {
    "id": string,
    "index": number,
    "title": string,
    "purpose": string,
    "mainMessage": string,
    "suggestedContent": string,
    "visualIdea": string,
    "layoutDirection": string,
    "tone": string,
    "roleInStory": string
  }
}

THINK lines should explain which fields you changed and why.`);
});

app.post("/make-server-84204692/ai/rebuild", async (c) => {
  const { current, feedback, analysis } = await c.req.json();
  return runTask(`TASK: the user changed the strategy. Re-architect the WHOLE deck — do not patch one slide. Pick the right blueprint for the new direction.

CURRENT SLIDES: ${JSON.stringify(current)}
PRIOR ANALYSIS: ${JSON.stringify(analysis)}
USER FEEDBACK: """${feedback}"""

Output schema for RESULT:
{
  "analysis": {
    "goal": string,
    "audience": string,
    "presentationType": "investor"|"sales"|"internal"|"academic"|"product"|"keynote"|"other",
    "tone": string,
    "missingInfo": string[]
  },
  "slides": [
    {
      "title": string,
      "purpose": string,
      "mainMessage": string,
      "suggestedContent": string,
      "visualIdea": string,
      "layoutDirection": string,
      "tone": string,
      "roleInStory": string
    }
  ]
}

THINK lines should narrate: what changed, what new audience implies, what blueprint you chose, slide order.`);
});

app.post("/make-server-84204692/ai/write", async (c) => {
  const { slide, style } = await c.req.json();
  return runTask(`TASK: write the on-slide copy for ONE slide, in the chosen visual style.

SLIDE LOGIC: ${JSON.stringify(slide)}
STYLE: ${JSON.stringify(style)}

Output schema for RESULT:
{
  "headline": string,
  "body": string,
  "bullets": string[],
  "imagePrompt": string
}

The imagePrompt is for Imagen 4 and must describe a full editorial slide image at 16:9 using the palette from STYLE (bg, fg, accent), Poppins-style typography, the headline rendered on the slide, and the visual idea. No stock-photo phrasing, no clipart, no watermarks.

THINK lines should narrate the writing choices.`);
});

app.post("/make-server-84204692/ai/copy", async (c) => {
  const { skeleton, styleSpec, blueprint, narrative, priorHeadlines } = await c.req.json();
  return runTask(`TASK: write the on-slide copy for ONE slide. You must obey the styleSpec text limits and the blueprint's voice.

SKELETON: ${JSON.stringify(skeleton)}
STYLE SPEC: ${JSON.stringify(styleSpec)}
BLUEPRINT: ${JSON.stringify(blueprint)}
NARRATIVE: ${JSON.stringify(narrative)}
PRIOR HEADLINES (avoid repeating phrasing): ${JSON.stringify(priorHeadlines ?? [])}

Output schema for RESULT:
{
  "slideId": string,
  "headline": string,
  "subheadline": string|null,
  "sections": [ { "label": string, "body": string } ],
  "bullets": string[],
  "captions": string[],
  "speakerNotes": string|null,
  "footer": string|null,
  "mustRenderText": string[],
  "optionalText": string[],
  "removedIdeas": string[],
  "quality": {
    "totalWords": number,
    "readingTimeSeconds": number,
    "clarityScore": number,
    "persuasionScore": number,
    "jargonScore": number,
    "textRenderRisk": "low"|"medium"|"high"
  }
}

Rules:
- Obey styleSpec.textLimits.maxWordsPerSlide. If you can't, drop bullets first, then subheadline.
- One slide = one message. The headline must communicate the point alone.
- mustRenderText = the exact strings that absolutely must appear on the rendered image (usually headline + key stat).
- Compute totalWords accurately across headline + subheadline + sections + bullets + captions.
- textRenderRisk: "high" if totalWords > 0.8 * styleSpec.textLimits.maxWordsPerSlide.
- Echo skeleton.id as slideId.

THINK lines should narrate what you cut, what survived, why this headline.`);
});

app.post("/make-server-84204692/ai/styles", async (c) => {
  const { brief, analysis, slides, referenceImage } = await c.req.json();
  const refPrompt = referenceImage ? `\n\nREFERENCE IMAGE: The user provided a reference image. Analyze its colors, typography style, mood, and visual treatment. Use these as inspiration for the palette choices — extract the dominant background color, foreground/text color, and accent color from the reference.` : "";
  return runTask(`TASK: recommend the THREE visual styles that best fit this presentation. Each must feel distinct (don't return three near-identical palettes). Pick palettes that match the audience, tone, and presentation type — not generic "nice" palettes.${refPrompt}

BRIEF: """${brief}"""
ANALYSIS: ${JSON.stringify(analysis)}
SLIDES: ${JSON.stringify(slides)}

Output schema for RESULT:
{
  "styles": [
    {
      "id": string (kebab-case slug, unique),
      "name": string (2-3 lowercase words),
      "description": string (one short sentence, lowercase),
      "bg": string (hex color),
      "fg": string (hex color, must contrast bg),
      "accent": string (hex color),
      "fontFamily": "Poppins",
      "reason": string (one short sentence explaining why this fits THIS deck)
    }
  ]
}

Return exactly 3 styles. THINK lines should narrate the audience read and the palette choices.`, referenceImage);
});

app.post("/make-server-84204692/ai/style-from-prompt", async (c) => {
  const { description, brief, analysis, referenceImage } = await c.req.json();
  const refPrompt = referenceImage ? `\n\nREFERENCE IMAGE: The user provided a reference image. Use it to inform your palette — extract colors, understand the mood, match the visual treatment.` : "";
  return runTask(`TASK: design ONE visual style from the user's free-form description, tuned to the presentation context.${refPrompt}

USER DESCRIPTION: """${description}"""
BRIEF: """${brief}"""
ANALYSIS: ${JSON.stringify(analysis)}

Output schema for RESULT:
{
  "style": {
    "id": string (kebab-case slug),
    "name": string (2-3 lowercase words),
    "description": string (one short sentence, lowercase),
    "bg": string (hex),
    "fg": string (hex, contrasts bg),
    "accent": string (hex),
    "fontFamily": "Poppins",
    "reason": string (why this matches their description)
  }
}

THINK lines should narrate how you translated their words into a palette.`, referenceImage);
});

app.post("/make-server-84204692/ai/layout", async (c) => {
  const { skeleton, copy, styleSpec } = await c.req.json();
  return runTask(`TASK: produce the LAYOUT PLAN for ONE slide. You pick the archetype and place every element on a 12-column grid; positions and sizes are percentages of the 16:9 canvas (0-100).

SLIDE SKELETON: ${JSON.stringify(skeleton)}
SLIDE COPY: ${JSON.stringify(copy)}
STYLE SPEC: ${JSON.stringify(styleSpec)}

Output schema for RESULT:
{
  "slideId": string,
  "canvas": "16:9",
  "layoutType": "hero"|"split"|"triptych"|"timeline"|"comparison"|"stat"|"quote"|"process"|"matrix",
  "grid": { "columns": 12, "rows": number },
  "safeMarginsPct": { "x": number, "y": number },
  "readingOrder": string[],
  "elements": [
    {
      "id": string,
      "type": "text"|"image"|"chart"|"shape"|"pill"|"diagram"|"mark",
      "content": string,
      "position": { "xPct": number, "yPct": number },
      "size": { "wPct": number, "hPct": number },
      "hierarchy": 1|2|3|4,
      "styleToken": string
    }
  ],
  "whitespaceScoreTarget": number,
  "balanceTarget": number,
  "contrastTarget": number
}

Rules:
- Pick layoutType from skeleton.layoutCandidate unless the copy obviously fits a different one.
- Margins must respect styleSpec.spacing.marginXPct / marginYPct.
- hierarchy 1 = headline, 2 = subhead/key supporting visual, 3 = body, 4 = caption/footer.
- Use typographic marks instead of icons (— · ↳ ●).
- readingOrder lists element ids in the order the eye should track.

THINK lines should narrate why this archetype, where the eye lands first, what whitespace ratio you targeted.`);
});

app.post("/make-server-84204692/ai/visual-qa", async (c) => {
  const { imageDataUrl, copy, styleSpec, skeleton } = await c.req.json();
  if (!imageDataUrl) return c.json({ error: "Missing imageDataUrl" }, 400);
  return runTask(`TASK: act as the VISUAL QA judge for this rendered slide. Compare the image to the contract below and score it.

EXPECTED COPY: ${JSON.stringify(copy)}
STYLE SPEC: ${JSON.stringify(styleSpec)}
SLIDE SKELETON: ${JSON.stringify(skeleton)}

Output schema for RESULT:
{
  "slideId": string,
  "overallScore": number (0-100),
  "styleFidelity": number (0-100),
  "textReadability": number (0-100),
  "contentCompleteness": number (0-100),
  "layoutBalance": number (0-100),
  "brandCompliance": number (0-100),
  "referenceSimilarity": number (0-100),
  "issues": string[],
  "repairInstructions": string,
  "failureType": "text_distortion"|"wrong_style"|"missing_element"|"too_busy"|"weak_composition"|"factual_issue"|null
}

Scoring rules:
- textReadability: penalize garbled text, fake glyphs, misspellings of the expected copy.
- contentCompleteness: every item in copy.mustRenderText must appear, spelled correctly.
- styleFidelity: palette and typography match the styleSpec.
- failureType: pick the dominant single cause if overallScore < 85, else null.
- overallScore is the weighted minimum, not the average — one critical failure caps the score.

THINK lines should narrate what you saw on the slide, what's wrong, what you'd fix first.`, imageDataUrl);
});

app.post("/make-server-84204692/ai/deck-qa", async (c) => {
  const { deckSummary, styleSpec } = await c.req.json();
  return runTask(`TASK: judge the DECK as a single artifact. Look at narrative flow, style consistency, headline repetition, pacing, layout variety.

DECK SUMMARY (one entry per slide with role, headline, layout, qa scores): ${JSON.stringify(deckSummary)}
STYLE SPEC: ${JSON.stringify(styleSpec)}

Output schema for RESULT:
{
  "narrativeFlowScore": number (0-100),
  "styleConsistencyScore": number (0-100),
  "repetitionScore": number (0-100),
  "pacingScore": number (0-100),
  "slideOrderScore": number (0-100),
  "finalReadinessScore": number (0-100),
  "issues": [ { "slideIds": string[], "issue": string, "fix": string } ]
}

Rules:
- repetitionScore: 100 = no repeated phrasing across headlines; lower if the deck feels redundant.
- finalReadinessScore is the weighted minimum, not the average.
- Issues should reference the affected slideIds so the system can repair only those slides.

THINK lines should narrate the deck-level read: where the rhythm breaks, where the story drags, where styles drift.`);
});

// ---------- Trial: compose 3 slides in one shot ----

app.post("/make-server-84204692/ai/trial-compose", async (c) => {
  const { brief, referenceImage } = await c.req.json();
  if (!brief || typeof brief !== "string" || brief.trim().length < 4) {
    return c.json({ error: "Missing brief" }, 400);
  }
  const refNote = referenceImage
    ? `\n\nA reference image is attached. Read its visual mood (palette tone, density, type personality) and let it influence the chart shape and metric you choose.`
    : "";
  const out = await runTextTask(`TASK: compose a 3-slide presentation TRIAL.

USER BRIEF: """${brief}"""${refNote}

Output schema for RESULT:
{
  "slides": [
    {
      "title": string (max 8 words, sentence case, no period),
      "body": string (one sentence, max 18 words, the argument the slide makes),
      "metric": { "k": string (1-2 word KPI label), "v": string (short value with unit, e.g. "138%", "$8.4M", "60d") } | null,
      "chart": number[] (exactly 7 numbers, 0-100, ascending or telling a clear shape)
    }
  ]
}

Rules:
- Exactly 3 slides: cover, the shift / argument, the proposal / outcome.
- Slide 1 (cover): metric = null. body is the deck's one-line thesis.
- Slides 2 and 3: metric is required.
- chart: pick numbers that visually tell the story (growth, dip, plateau).
- Tone matches the brief — investor decks are precise, internal updates are direct, sales pitches are confident.

THINK lines: justify the headline of each slide and the metric you chose.`, referenceImage);

  if ("error" in out) {
    console.log("Trial compose error:", out.error);
    return c.json({ error: out.error }, 502);
  }
  return c.json({ result: out.result, thoughts: out.thoughts });
});

// ---------- Image generation via OpenRouter (Gemini 3.1 Flash Image Preview) ---

app.post("/make-server-84204692/ai/image", async (c) => {
  const { prompt } = await c.req.json();
  if (!prompt || typeof prompt !== "string") {
    return c.json({ error: "Missing prompt" }, 400);
  }
  const result = await generateImageViaOpenRouter(prompt);
  if ("error" in result) {
    console.log("OpenRouter image generation error:", result.error);
    return c.json({ error: result.error }, 502);
  }
  return c.json({ dataUrl: result.dataUrl });
});

// ---------- Auth ----------

app.post("/make-server-84204692/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    if (!email || !password || password.length < 6) {
      return c.json({ error: "Email and a 6+ character password are required." }, 400);
    }
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: name || email.split("@")[0] },
      // Auto-confirm — no email server configured.
      email_confirm: true,
    });
    if (error) {
      console.log("Signup error:", error.message);
      return c.json({ error: error.message }, 400);
    }
    return c.json({ user: { id: data.user?.id, email: data.user?.email } });
  } catch (e) {
    console.log("Signup threw:", e);
    return c.json({ error: "Signup failed unexpectedly." }, 500);
  }
});

// ---------- Decks (user-scoped, kv-backed) ----------

async function requireUser(c: any): Promise<{ id: string } | null> {
  const token = c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    console.log("requireUser: no Authorization header");
    return null;
  }
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) {
    console.log("requireUser: auth.getUser error:", error.message, "tokenPrefix:", token.slice(0, 24));
    return null;
  }
  if (!data?.user) {
    console.log("requireUser: no user in response, tokenPrefix:", token.slice(0, 24));
    return null;
  }
  return { id: data.user.id };
}

const deckKey = (uid: string, id: string) => `deck:${uid}:${id}`;
const deckPrefix = (uid: string) => `deck:${uid}:`;

app.get("/make-server-84204692/decks", async (c) => {
  const u = await requireUser(c);
  if (!u) return c.json({ error: "Unauthorized" }, 401);
  try {
    const rows = await kv.getByPrefix(deckPrefix(u.id));
    return c.json({ decks: rows });
  } catch (e) {
    console.log("Decks list failed:", e);
    return c.json({ error: "Could not load decks." }, 500);
  }
});

app.post("/make-server-84204692/decks", async (c) => {
  const u = await requireUser(c);
  if (!u) return c.json({ error: "Unauthorized" }, 401);
  try {
    const body = await c.req.json();
    const { title, brief, slides, tone } = body;
    if (!title || !Array.isArray(slides)) {
      return c.json({ error: "title and slides[] required" }, 400);
    }
    const id = crypto.randomUUID();
    const now = Date.now();
    const deck = {
      id,
      userId: u.id,
      title: String(title).slice(0, 200),
      brief: String(brief || "").slice(0, 1000),
      slides,
      tone: ["editorial", "modern", "muted"].includes(tone) ? tone : "modern",
      starred: false,
      edits: 1,
      createdAt: now,
      updatedAt: now,
    };
    await kv.set(deckKey(u.id, id), deck);
    return c.json({ deck });
  } catch (e) {
    console.log("Deck create failed:", e);
    return c.json({ error: "Could not save deck." }, 500);
  }
});

app.patch("/make-server-84204692/decks/:id", async (c) => {
  const u = await requireUser(c);
  if (!u) return c.json({ error: "Unauthorized" }, 401);
  const id = c.req.param("id");
  try {
    const existing = await kv.get(deckKey(u.id, id));
    if (!existing) return c.json({ error: "Not found" }, 404);
    const patch = await c.req.json();
    const next = {
      ...existing,
      ...(typeof patch.title === "string" ? { title: patch.title.slice(0, 200) } : {}),
      ...(typeof patch.starred === "boolean" ? { starred: patch.starred } : {}),
      ...(Array.isArray(patch.slides) ? { slides: patch.slides, edits: (existing.edits || 0) + 1 } : {}),
      updatedAt: Date.now(),
    };
    await kv.set(deckKey(u.id, id), next);
    return c.json({ deck: next });
  } catch (e) {
    console.log("Deck patch failed:", e);
    return c.json({ error: "Could not update deck." }, 500);
  }
});

app.delete("/make-server-84204692/decks/:id", async (c) => {
  const u = await requireUser(c);
  if (!u) return c.json({ error: "Unauthorized" }, 401);
  const id = c.req.param("id");
  try {
    await kv.del(deckKey(u.id, id));
    return c.json({ ok: true });
  } catch (e) {
    console.log("Deck delete failed:", e);
    return c.json({ error: "Could not delete deck." }, 500);
  }
});

Deno.serve(app.fetch);
