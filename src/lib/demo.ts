import type { Brand, Deck, GeneratedSlide, Mode, OutlineSlide, TurnRecord } from "../types";

// Demo data layer: everything the cloud backend used to provide now lives in
// localStorage, seeded on first run with eight sample decks built from the
// bundled images under /public/samples.

export const DECKS_KEY = "moonshot-demo:decks";
export const SESSION_KEY = "moonshot-demo:session";
export const VIBES_KEY = "moonshot-demo:vibes";

export function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ---- seed construction ----

interface SeedSlide {
  title: string;
  brief: string;
  notes: string;
  visual: string;
  layout: string;
}

interface SeedSpec {
  key: string;
  title: string;
  mode: Mode;
  brief: string;
  images: string[];
  brand: Brand;
  slides: SeedSlide[];
}

function img(folder: string, base: string, n: number, ext = "webp"): string[] {
  return Array.from({ length: n }, (_, i) => `/samples/${folder}/${base}${i + 1}.${ext}`);
}

const SEEDS: SeedSpec[] = [
  {
    key: "future",
    title: "The Future of AI Interfaces",
    mode: "moonshot",
    brief:
      "A visionary 4-slide keynote on where AI-native interfaces are heading — ambient, multimodal, agentic. Bold, cinematic, optimistic.",
    images: img("future", "future", 4),
    brand: {
      name: "Future of AI",
      palette: ["#0b0b12", "#7c6cff", "#38e1ff", "#f5f5f7"],
      typography: "Geometric sans, oversized display headlines",
      tone: "Visionary, cinematic, confident",
      summary:
        "A dark, luminous look — deep near-black fields lit by violet-to-cyan gradients, oversized display type and glassy interface fragments floating in space.",
    },
    slides: [
      { title: "Beyond the prompt box", brief: "Opening thesis: interfaces dissolve into intent.", notes: "One line thesis, ambient gradient hero.", visual: "Full-bleed gradient hero with floating UI shards", layout: "Centered headline over full-bleed art" },
      { title: "From apps to agents", brief: "Shift from tools you drive to agents that act.", notes: "Contrast columns: apps vs agents.", visual: "Split comparison diagram", layout: "Split left/right comparison" },
      { title: "Multimodal by default", brief: "Voice, vision, canvas — one continuous surface.", notes: "Three modality tiles.", visual: "Icon row of modalities", layout: "Title top-left, three columns below" },
      { title: "The invisible interface", brief: "Closing: the best interface is no interface.", notes: "Closing line + call to build.", visual: "Minimal closing card with orbiting motif", layout: "Bottom-anchored title, sparse field above" },
    ],
  },
  {
    key: "iphone",
    title: "iPhone Launch Keynote",
    mode: "moonshot",
    brief: "A 4-slide Apple-style launch keynote for the new iPhone. Calm, premium, product-first.",
    images: img("iphone", "iphone", 4),
    brand: {
      name: "iPhone",
      palette: ["#f5f5f7", "#1d1d1f", "#0071e3"],
      typography: "Clean humanist sans, large confident headlines",
      tone: "Calm, premium, obsessively clean",
      summary:
        "Restrained industrial luxury — generous negative space, crisp near-black type on soft fields, a single hero product render per slide.",
    },
    slides: [
      { title: "Introducing iPhone", brief: "Hero reveal of the device.", notes: "Device render centered, one-word headline.", visual: "Hero product render", layout: "Centered product, headline beneath" },
      { title: "Designed to disappear", brief: "Materials and design story.", notes: "Macro shots, thin hairline captions.", visual: "Macro material photography", layout: "Full-bleed image, caption strip" },
      { title: "A camera that sees more", brief: "Camera system capabilities.", notes: "Sensor stats, sample frames.", visual: "Camera module diagram + sample photos", layout: "Split image left, stats right" },
      { title: "Available this fall", brief: "Pricing and availability.", notes: "Price, date, finish lineup.", visual: "Finish lineup row", layout: "Title band top, product row below" },
    ],
  },
  {
    key: "iphone18",
    title: "iPhone 18 Pro Launch Keynote",
    mode: "moonshot",
    brief: "A 4-slide launch keynote for iPhone 18 Pro — titanium, on-device AI, all-day battery. Premium and editorial.",
    images: img("iphone18", "iphone18", 4),
    brand: {
      name: "iPhone 18 Pro",
      palette: ["#101014", "#c9c9ce", "#ff9f0a"],
      typography: "SF-style sans, tight tracking, huge numerals",
      tone: "Premium, precise, quietly dramatic",
      summary:
        "Midnight editorial — near-black stages, brushed-titanium tones and one amber accent, with the product lit like jewellery.",
    },
    slides: [
      { title: "iPhone 18 Pro", brief: "Dark hero reveal.", notes: "Device on black, spotlight rim light.", visual: "Spotlit hero render", layout: "Centered product, tiny title below" },
      { title: "Forged in titanium", brief: "Material and finish story.", notes: "Grade-5 titanium, four finishes.", visual: "Macro edge photography", layout: "Full-bleed macro, title bottom-left" },
      { title: "Intelligence, on device", brief: "The on-device AI story.", notes: "Neural engine stats, private by design.", visual: "Big-number stat with chip motif", layout: "Centered big number, supporting stats" },
      { title: "All day. And then some.", brief: "Battery and closing.", notes: "Battery life numbers, pre-order date.", visual: "Battery curve chart", layout: "Chart left, headline right" },
    ],
  },
  {
    key: "mac",
    title: "MacBook Lineup Overview",
    mode: "moonshot",
    brief: "A 6-slide overview of the MacBook lineup — who each model is for, performance, battery, and how to choose.",
    images: img("mac", "mac", 6),
    brand: {
      name: "MacBook",
      palette: ["#f5f5f7", "#1d1d1f", "#2997ff"],
      typography: "Clean humanist sans, editorial hierarchy",
      tone: "Helpful, premium, matter-of-fact",
      summary:
        "Bright product-catalogue clarity — white fields, precise device renders at consistent angles, thin rules and comparison tables.",
    },
    slides: [
      { title: "The MacBook family", brief: "Lineup hero.", notes: "All models in a row.", visual: "Lineup hero render", layout: "Centered headline, product row" },
      { title: "MacBook Air", brief: "The everyday one.", notes: "Weight, fanless, battery.", visual: "Hero render with callouts", layout: "Product left, specs right" },
      { title: "MacBook Pro 14\"", brief: "The pro workhorse.", notes: "Pro chips, display, ports.", visual: "Labelled port diagram", layout: "Title top, diagram center" },
      { title: "MacBook Pro 16\"", brief: "The desktop replacement.", notes: "Sustained performance, speakers.", visual: "Performance bar chart", layout: "Chart right, copy left" },
      { title: "Performance per watt", brief: "Silicon story across the line.", notes: "Perf/watt curve by chip.", visual: "Line chart comparison", layout: "Full-width chart, caption below" },
      { title: "Which one is for you?", brief: "Closing chooser.", notes: "Three personas mapped to models.", visual: "Persona-to-model table", layout: "Three columns, title centered" },
    ],
  },
  {
    key: "mentoria",
    title: "Mentoria Brand Deck",
    mode: "moonshot",
    brief: "A 3-slide brand deck for Mentoria, a mentorship platform connecting students with industry mentors. Warm and human.",
    images: img("mentoria", "men", 3, "png"),
    brand: {
      name: "Mentoria",
      palette: ["#fef7ef", "#f97316", "#312e2b"],
      typography: "Rounded friendly sans with serif accents",
      tone: "Warm, human, encouraging",
      summary:
        "Warm paper tones with a confident orange accent, candid photography of people, soft rounded cards and generous whitespace.",
    },
    slides: [
      { title: "Everyone deserves a mentor", brief: "Mission opener.", notes: "Mission line, warm photo.", visual: "Full-bleed candid photo", layout: "Headline over photo, bottom-left" },
      { title: "How Mentoria works", brief: "The matching model.", notes: "Match, meet, grow — three steps.", visual: "Three-step flow diagram", layout: "Title top, horizontal flow below" },
      { title: "Join the movement", brief: "Closing CTA.", notes: "Traction numbers + CTA.", visual: "Big-number stats with CTA card", layout: "Stats row, centered CTA" },
    ],
  },
  {
    key: "mimir",
    title: "Mimir Product Pitch",
    mode: "moonshot",
    brief: "A 3-slide product pitch for Mimir, an AI knowledge base that answers from your company's own documents.",
    images: img("mimir", "mim", 3, "png"),
    brand: {
      name: "Mimir",
      palette: ["#0d1117", "#22d3ee", "#e6edf3"],
      typography: "Technical grotesque, monospace accents",
      tone: "Sharp, credible, engineer-friendly",
      summary:
        "Developer-dark aesthetic — deep slate fields, cyan signal accents, terminal-style cards and clean schematic diagrams.",
    },
    slides: [
      { title: "Your company already knows the answer", brief: "Problem framing.", notes: "Knowledge is scattered across tools.", visual: "Scattered-docs illustration", layout: "Centered headline, motif behind" },
      { title: "Ask Mimir", brief: "Product demo slide.", notes: "Question in, sourced answer out.", visual: "Product UI screenshot card", layout: "UI card right, copy left" },
      { title: "Grounded, cited, secure", brief: "Trust and closing.", notes: "Citations, permissions, SOC2.", visual: "Icon row of trust pillars", layout: "Three pillars, title top-left" },
    ],
  },
  {
    key: "ps5",
    title: "PS5 Pro Reveal",
    mode: "moonshot",
    brief: "A 4-slide reveal deck for the PS5 Pro — raw power, ray tracing, and the next generation of play. Bold and electric.",
    images: img("ps5", "ps5", 4),
    brand: {
      name: "PS5 Pro",
      palette: ["#050510", "#4c6fff", "#ffffff"],
      typography: "Futuristic condensed sans, italic momentum",
      tone: "Electric, bold, kinetic",
      summary:
        "High-energy console launch language — deep space blues, electric light streaks, dramatic hardware angles and motion-blurred accents.",
    },
    slides: [
      { title: "Play has no limits", brief: "Console hero reveal.", notes: "Hardware on black, light streaks.", visual: "Dramatic hardware hero", layout: "Product center, title bottom" },
      { title: "8K ray-traced worlds", brief: "Graphics leap.", notes: "GPU uplift, RT cores.", visual: "Side-by-side frame comparison", layout: "Split comparison, caption strip" },
      { title: "Zero loading. All game.", brief: "SSD and I/O story.", notes: "Throughput numbers.", visual: "Big-number stat", layout: "Centered big number" },
      { title: "Holiday 2026", brief: "Date and price closer.", notes: "Price, date, pre-order.", visual: "Console lineup shot", layout: "Title band top, hardware below" },
    ],
  },
  {
    key: "solar",
    title: "Solar System Explainer",
    mode: "edu",
    brief: "Teach the solar system to middle-school students: what orbits the Sun, the planet families, and why the planets stay in orbit.",
    images: img("solar", "solar", 3),
    brand: {
      name: "Solar System 101",
      palette: ["#0a1026", "#ffd166", "#4cc9f0"],
      typography: "Friendly rounded sans, clear labels",
      tone: "Curious, friendly, illustrative",
      summary:
        "A night-sky classroom look — deep indigo space, warm golden Sun accents, clearly labelled orbit diagrams and friendly captions.",
    },
    slides: [
      { title: "Our neighbourhood in space", brief: "Learning objective + hook.", notes: "One Sun, eight planets — the map.", visual: "Labelled orbit diagram", layout: "Title top, full-width diagram" },
      { title: "Rocky worlds vs gas giants", brief: "The two planet families.", notes: "Compare size, makeup, distance.", visual: "Split comparison of planet families", layout: "Split left/right comparison" },
      { title: "Why don't planets fly away?", brief: "Gravity + check-your-understanding.", notes: "String-and-ball analogy, quick quiz.", visual: "Analogy illustration with quiz card", layout: "Analogy left, quiz card right" },
    ],
  },
];

function seedDeck(spec: SeedSpec, index: number): Deck {
  const created = Date.now() - (index + 1) * 36e5 * 7; // stagger a few hours apart
  const outline: OutlineSlide[] = spec.slides.map((s, i) => ({
    id: `${spec.key}-s${i + 1}`,
    ...s,
  }));
  const slides: Record<string, GeneratedSlide> = {};
  outline.forEach((o, i) => {
    slides[o.id] = {
      status: "done",
      dataUrl: spec.images[i],
      path: spec.images[i],
      updatedAt: created + (i + 2) * 60_000,
    };
  });
  const stats: TurnRecord[] = [
    {
      id: `${spec.key}-t0`,
      kind: "outline",
      label: "Outline",
      ts: created,
      durationMs: 34_000 + index * 2_500,
      usage: { inputTokens: 5200 + index * 300, cachedInputTokens: 1100, outputTokens: 1650 },
      ok: true,
    },
    ...outline.map((o, i) => ({
      id: `${spec.key}-t${i + 1}`,
      kind: "slide" as const,
      label: o.title,
      ts: created + (i + 1) * 90_000,
      durationMs: 52_000 + ((i * 7919) % 20_000),
      usage: {
        inputTokens: 6100 + i * 240,
        cachedInputTokens: 3900 + i * 180,
        outputTokens: 420 + ((i * 131) % 220),
      },
      ok: true,
    })),
  ];
  return {
    id: `demo-${spec.key}`,
    title: spec.title,
    mode: spec.mode,
    threadId: `thread-${spec.key}`,
    phase: "slides",
    brief: spec.brief,
    attachments: [],
    slideCount: outline.length,
    brand: spec.brand,
    vibe: null,
    outline,
    slides,
    stats,
    published: true,
    webSearch: false,
    askQuestions: false,
    createdAt: created,
    updatedAt: created + outline.length * 90_000,
  };
}

export function seedDecks(): Deck[] {
  return SEEDS.map(seedDeck);
}

// ---- localStorage persistence ----

export function loadDemoDecks(): Deck[] {
  try {
    const raw = localStorage.getItem(DECKS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Deck[];
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {
    /* corrupted — reseed */
  }
  const seeded = seedDecks();
  saveDemoDecks(seeded);
  return seeded;
}

export function saveDemoDecks(decks: Deck[]) {
  try {
    localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
  } catch {
    /* quota — ignore */
  }
}

/** Published decks, read fresh from storage (Community + brief-form strip). */
export function publishedDecks(): Deck[] {
  return loadDemoDecks()
    .filter((d) => d.published && d.phase === "slides")
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/** First rendered slide of a deck, in outline order — its cover thumbnail. */
export function deckCover(deck: Deck): string | undefined {
  for (const o of deck.outline) {
    const s = deck.slides[o.id];
    if (s?.status === "done" && s.dataUrl) return s.dataUrl;
  }
  return undefined;
}

// ---- fake slide renders (the mock "image_gen") ----

const RENDER_POOL = [
  ...img("future", "future", 4),
  ...img("mac", "mac", 6),
  ...img("ps5", "ps5", 4),
  ...img("iphone18", "iphone18", 4),
];

const renderCursor = new Map<string, number>();

/** Cycle through sample images per deck so "generate" visibly produces slides. */
export function nextFakeSlideImage(deckId: string): string {
  const n = renderCursor.get(deckId) ?? 0;
  renderCursor.set(deckId, n + 1);
  return RENDER_POOL[n % RENDER_POOL.length];
}
