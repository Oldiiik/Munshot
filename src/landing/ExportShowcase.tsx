import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileImage, FileText, PenLine } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Shared window-chrome frame so the three panels read as one family. */
function PanelFrame({
  file,
  badge,
  badgeTone,
  title,
  caption,
  tilt,
  index,
  children,
}: {
  file: string;
  badge: string;
  badgeTone: string;
  title: string;
  caption: string;
  tilt: number;
  index: number;
  children: ReactNode;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40, rotate: tilt * 2 }}
      whileInView={{ opacity: 1, y: 0, rotate: tilt }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay: index * 0.12, ease: EASE }}
      whileHover={{
        rotate: 0,
        y: -10,
        transition: { type: "spring", stiffness: 200, damping: 22 },
      }}
      className="ms-glass group relative flex h-full flex-col overflow-hidden rounded-[18px] p-3"
    >
      {/* window bar */}
      <div className="flex items-center gap-2 px-2 pb-3 pt-1">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 truncate text-xs text-white/35">{file}</span>
        <span
          className={`ml-auto shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${badgeTone}`}
        >
          {badge}
        </span>
      </div>

      {children}

      {/* caption */}
      <div className="mt-auto px-1 pb-1 pt-4">
        <h3 className="font-display text-2xl text-white">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-white/50">{caption}</p>
      </div>
    </motion.article>
  );
}

/* ----------------------------------------------------------------------- */
/* Reusable deck carousel — auto-advances on a timer, responds to clicks     */
/* ----------------------------------------------------------------------- */

const PITCH_SLIDES = [
  "/samples/iphone/iphone1.webp",
  "/samples/iphone/iphone2.webp",
  "/samples/iphone/iphone3.webp",
  "/samples/iphone/iphone4.webp",
];

const TEACH_SLIDES = [
  "/samples/future/future1.webp",
  "/samples/future/future2.webp",
  "/samples/future/future3.webp",
  "/samples/future/future4.webp",
];

function SlideCarousel({
  slides,
  interval = 3200,
  accent = "indigo",
}: {
  slides: string[];
  interval?: number;
  accent?: "indigo" | "sky";
}) {
  const [active, setActive] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };
  const start = () => {
    stop();
    timer.current = setInterval(
      () => setActive((a) => (a + 1) % slides.length),
      interval
    );
  };
  // auto-advance on mount; clean up on unmount
  useEffect(() => {
    start();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // a click (thumb or hero) selects a slide and restarts the timer
  const select = (i: number) => {
    setActive(i);
    start();
  };

  // accent kept in the signature for API compat, but the ring stays monochrome
  void accent;
  const ring = "border-white/45 ring-1 ring-white/25";

  return (
    <>
      <button
        type="button"
        onClick={() => select((active + 1) % slides.length)}
        className="relative block aspect-video w-full cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-black/40"
        aria-label="Next slide"
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.img
            key={active}
            src={slides[active]}
            alt=""
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="absolute inset-0 size-full object-cover"
          />
        </AnimatePresence>
        {/* progress pips */}
        <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === active ? "w-5 bg-white" : "w-1.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      </button>

      {/* clickable thumbnails */}
      <div className="mt-2.5 grid grid-cols-4 gap-2">
        {slides.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => select(i)}
            className={`relative overflow-hidden rounded-md border bg-black/40 transition-all ${
              i === active ? ring : "border-white/10 hover:border-white/25"
            }`}
            aria-label={`Show slide ${i + 1}`}
          >
            <img
              src={src}
              alt=""
              loading="lazy"
              className={`aspect-video w-full object-cover transition-opacity duration-300 ${
                i === active ? "opacity-100" : "opacity-55 hover:opacity-90"
              }`}
            />
          </button>
        ))}
      </div>
    </>
  );
}

/* ----------------------------------------------------------------------- */
/* 3 · Export — no slide, just the formats                                  */
/* ----------------------------------------------------------------------- */

const FORMATS = [
  {
    icon: FileImage,
    name: "PNG",
    body: "Crisp per-slide images, ready to drop anywhere.",
    tone: "text-white/75",
  },
  {
    icon: FileText,
    name: "PDF",
    body: "Print-ready, one slide per page, sized to the art.",
    tone: "text-white/75",
  },
  {
    icon: PenLine,
    name: "Canva",
    body: "Hand off live, editable elements — never a flat image.",
    tone: "text-white/75",
  },
];

function ExportInfo() {
  return (
    <div className="flex flex-col gap-2.5">
      {FORMATS.map((f, i) => (
        <motion.div
          key={f.name}
          initial={{ opacity: 0, x: 12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.15 + i * 0.1, ease: EASE }}
          className="flex items-start gap-3.5 rounded-xl border border-white/10 bg-white/[0.03] p-3.5"
        >
          <span
            className={`grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 ${f.tone}`}
          >
            <f.icon className="size-[18px]" />
          </span>
          <div>
            <div className="text-[15px] font-medium text-white">{f.name}</div>
            <p className="mt-0.5 text-[13px] leading-snug text-white/50">{f.body}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------------- */

export function ExportShowcase() {
  return (
    <div className="mx-auto grid max-w-6xl items-stretch gap-5 md:grid-cols-3 md:gap-6">
      <PanelFrame
        index={0}
        tilt={1.6}
        file="investor-deck.key"
        badge="Moonshot"
        badgeTone="text-white/80 bg-white/10 border-white/15"
        title="Pitch it"
        caption="Investor-ready decks with a brand the AI infers from your assets. Tap through the deck."
      >
        <SlideCarousel slides={PITCH_SLIDES} accent="indigo" interval={3200} />
      </PanelFrame>

      <PanelFrame
        index={1}
        tilt={0}
        file="future-shock.key"
        badge="Moonshot Edu"
        badgeTone="text-white/80 bg-white/10 border-white/15"
        title="Teach it"
        caption="Edu mode turns any topic into a clear, visual explainer — one idea, beautifully laid out."
      >
        <SlideCarousel slides={TEACH_SLIDES} accent="sky" interval={3800} />
      </PanelFrame>

      <PanelFrame
        index={2}
        tilt={-1.6}
        file="export.pdf"
        badge="PDF · PNG · Canva"
        badgeTone="text-white/80 bg-white/10 border-white/15"
        title="Take it anywhere"
        caption="When the deck is done, it leaves in whatever format the room needs."
      >
        <ExportInfo />
      </PanelFrame>
    </div>
  );
}
