import { useEffect, useRef, type ReactNode } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "motion/react";
import type { LucideIcon } from "lucide-react";
import { useScrollContainer } from "./scroll";

interface Props {
  id: string;
  kicker: string;
  title: ReactNode;
  points: { label: string; body: string; icon: LucideIcon }[];
  video: string;
  poster?: string;
  /** Right-align the header (used to alternate the rhythm between chapters). */
  flip?: boolean;
  /** Tailwind gradient classes for the glow behind the video. */
  glow?: string;
  variant: "signal" | "handoff";
}

/**
 * One numbered chapter of the product story: a large headline, then a big
 * looping product video that scales and parallaxes as it travels through the
 * viewport. The video only plays while on screen. Reduced-motion users get the
 * same layout, statically.
 */
export function FeatureScene({
  id,
  kicker,
  title,
  points,
  video,
  poster,
  flip,
  glow = "from-white/12 via-white/5",
  variant,
}: Props) {
  const container = useScrollContainer();
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    container: container ?? undefined,
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // keep scroll work to cheap, GPU-composited transforms only (no 3D rotate,
  // no animated filters) so the playing video stays smooth while scrolling
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.94, 1, 0.985]);
  const y = useTransform(scrollYProgress, [0, 1], [70, -70]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.18, 0.7, 0.4]);
  const copyY = useTransform(scrollYProgress, [0, 1], [40, -40]);

  // play only while on screen
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const m = (v: MotionValue) => (reduce ? undefined : v);

  return (
    <section ref={sectionRef} id={id} className="relative px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        {/* ---- header ---- */}
        <motion.div
          style={{ y: m(copyY) }}
          className={`grid items-end gap-x-10 gap-y-6 lg:grid-cols-12 ${
            flip ? "text-right" : ""
          }`}
        >
          <div className={`lg:col-span-8 ${flip ? "lg:order-2 lg:col-start-5" : ""}`}>
            <div
              className={`mb-6 flex items-center gap-3 ${
                flip ? "flex-row-reverse justify-end" : ""
              }`}
            >
              <span className="h-9 w-1 rounded-full bg-gradient-to-b from-white/70 via-white/30 to-transparent" />
              <span className="text-[15px] font-medium text-white/60">
                {kicker}
              </span>
            </div>
            <h2 className="font-display font-display-tight text-[clamp(2.6rem,6vw,5rem)] leading-[0.98] text-white">
              {title}
            </h2>
          </div>
        </motion.div>

        {/* ---- big video ---- */}
        <div className="mt-12 sm:mt-16">
          <motion.div
            style={{ scale: m(scale), y: m(y), willChange: "transform" }}
            className="relative"
          >
            <motion.div
              style={{ opacity: reduce ? 0.5 : glowOpacity, willChange: "opacity" }}
              className={`pointer-events-none absolute -inset-16 rounded-[4rem] bg-gradient-to-br ${glow} to-transparent blur-[80px]`}
            />
            <div className="ms-glass relative overflow-hidden rounded-[24px] p-2 shadow-[0_50px_140px_-30px_rgba(0,0,0,0.85)]">
              <video
                ref={videoRef}
                src={video}
                poster={poster}
                muted
                loop
                playsInline
                preload="metadata"
                className="aspect-video w-full rounded-[18px] object-cover"
              />
            </div>
          </motion.div>
        </div>

        {variant === "signal" ? <GenerationWorkbench points={points} /> : <CanvaWorkbench points={points} />}
      </div>
    </section>
  );
}

function GenerationWorkbench({ points }: Pick<Props, "points">) {
  const SourceIcon = points[0].icon;
  const OutlineIcon = points[1].icon;
  const RenderIcon = points[2].icon;
  return (
    <motion.div
      className="ms-generation-workbench mt-16"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      aria-label="From source material to rendered presentation"
    >
      <header className="ms-generation-bar">
        <div><span><i /> Brand system active</span><strong>Product launch / PS5 Pro</strong></div>
        <div><small>Outline approved</small><b>6 slides</b></div>
      </header>

      <div className="ms-generation-grid">
        <section className="ms-generation-source">
          <header><span><SourceIcon strokeWidth={1.7} /></span><div><small>Source</small><strong>{points[0].label}</strong></div></header>
          <p>{points[0].body}</p>
          <div className="ms-generation-assets">
            <span><i>PS</i><b>brand-system.pdf</b><small>4.8 MB</small></span>
            <span><i>AI</i><b>launch-brief.docx</b><small>2 pages</small></span>
            <span><i>URL</i><b>playstation.com</b><small>Reference</small></span>
          </div>
          <div className="ms-generation-palette" aria-label="Inferred palette"><i /><i /><i /><i /></div>
        </section>

        <section className="ms-generation-outline">
          <header><span><OutlineIcon strokeWidth={1.7} /></span><div><small>Narrative</small><strong>{points[1].label}</strong></div><em>Drag to reorder</em></header>
          <p>{points[1].body}</p>
          <ol>
            {["A generational leap", "Inside the new GPU", "Built for what comes next", "The games define it"].map((item, index) => (
              <li key={item}><i>{String(index + 1).padStart(2, "0")}</i><span><b>{item}</b><small>{["Opening", "Product", "Vision", "Close"][index]}</small></span><em>••</em></li>
            ))}
          </ol>
        </section>

        <figure className="ms-generation-render">
          <div><img src="/samples/ps5/ps51.webp" alt="Rendered PlayStation 5 Pro presentation cover" /></div>
          <figcaption><span><RenderIcon strokeWidth={1.7} /></span><div><small>Rendered slide</small><strong>{points[2].label}</strong><p>{points[2].body}</p></div></figcaption>
        </figure>
      </div>
    </motion.div>
  );
}

function CanvaWorkbench({ points }: Pick<Props, "points">) {
  const BatchIcon = points[0].icon;
  const EditIcon = points[1].icon;
  const OpenIcon = points[2].icon;
  const slides = ["/samples/future/future1.webp", "/samples/future/future2.webp", "/samples/future/future3.webp"];
  return (
    <motion.div
      className="ms-canva-workbench mt-16"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Editable presentation handoff to Canva"
    >
      <header className="ms-canva-bar">
        <div><span><i /> Moonshot deck</span><strong>The future of AI interfaces</strong></div>
        <div><BatchIcon strokeWidth={1.7} /><span>3 slides selected</span></div>
      </header>

      <div className="ms-canva-grid">
        <aside className="ms-canva-filmstrip" aria-label="Selected slides">
          <span>Slides</span>
          {slides.map((slide, index) => <button type="button" key={slide} className={index === 1 ? "is-current" : ""} aria-label={`Select slide ${index + 1}`}><i>{index + 1}</i><img src={slide} alt="" /></button>)}
        </aside>

        <section className="ms-canva-canvas">
          <div className="ms-canva-canvas-head"><span>Slide 02</span><small>1920 × 1080</small></div>
          <div className="ms-canva-artboard">
            <img src="/samples/future/future2.webp" alt="AI interfaces presentation slide ready for editing" />
            <span className="ms-canva-selection" aria-hidden="true"><i /><i /><i /><i /></span>
          </div>
          <p><EditIcon strokeWidth={1.7} /> {points[1].body}</p>
        </section>

        <aside className="ms-canva-layers">
          <header><div><small>Canva handoff</small><strong>{points[1].label}</strong></div><EditIcon strokeWidth={1.7} /></header>
          <div className="ms-canva-layer-list">
            {["Headline", "Editorial image", "Evidence labels", "Footer and folio"].map((layer, index) => <span key={layer}><i>{["T", "IMG", "TAG", "TXT"][index]}</i><b>{layer}</b><small>{index === 1 ? "Image" : "Text"}</small></span>)}
          </div>
          <div className="ms-canva-destination"><span>Opens in</span><strong>aldyarsadirbai's Canva</strong><small>{points[2].body}</small></div>
          <button type="button"><OpenIcon strokeWidth={1.8} /><span><small>{points[2].label}</small><strong>Open editable deck</strong></span></button>
        </aside>
      </div>
    </motion.div>
  );
}
