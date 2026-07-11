import { useEffect, useRef, type ReactNode } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "motion/react";
import { useScrollContainer } from "./scroll";

interface Props {
  id: string;
  step: string;
  kicker: string;
  title: ReactNode;
  points: { label: string; body: string }[];
  video: string;
  poster?: string;
  /** Right-align the header (used to alternate the rhythm between chapters). */
  flip?: boolean;
  /** Tailwind gradient classes for the glow behind the video. */
  glow?: string;
}

/**
 * One numbered chapter of the product story: a large headline, then a big
 * looping product video that scales and parallaxes as it travels through the
 * viewport. The video only plays while on screen. Reduced-motion users get the
 * same layout, statically.
 */
export function FeatureScene({
  id,
  step,
  kicker,
  title,
  points,
  video,
  poster,
  flip,
  glow = "from-indigo-500/35 via-violet-500/15",
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
              className={`mb-5 flex items-center gap-4 ${flip ? "justify-end" : ""}`}
            >
              <span className="font-display text-2xl tabular-nums text-white/25">{step}</span>
              <span className="h-px w-10 bg-white/20" />
              <span className="text-sm font-medium tracking-tight text-indigo-300/90">
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
            <div className="relative overflow-hidden rounded-[20px] border border-white/12 bg-black/60 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)]">
              <div className="flex items-center gap-2 border-b border-white/8 bg-gradient-to-b from-white/[0.06] to-transparent px-5 py-3">
                <span className="size-3 rounded-full bg-[#ff5f57]" />
                <span className="size-3 rounded-full bg-[#febc2e]" />
                <span className="size-3 rounded-full bg-[#28c840]" />
                <div className="ml-3 hidden flex-1 rounded-md bg-white/[0.05] px-3 py-1.5 text-xs text-white/40 sm:block">
                  moonshot-ashen.vercel.app
                </div>
              </div>
              <video
                ref={videoRef}
                src={video}
                poster={poster}
                muted
                loop
                playsInline
                preload="metadata"
                className="aspect-video w-full object-cover"
              />
            </div>
          </motion.div>
        </div>

        {/* ---- points ---- */}
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:grid-cols-3">
          {points.map((p, i) => (
            <motion.div
              key={p.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#0a0a0f] p-6 text-left"
            >
              <div className="mb-2 font-display text-sm text-white/30 tabular-nums">
                0{i + 1}
              </div>
              <h3 className="mb-1.5 text-[15px] font-medium text-white">{p.label}</h3>
              <p className="text-sm leading-relaxed text-white/50">{p.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
