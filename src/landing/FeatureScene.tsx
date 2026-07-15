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

        {variant === "signal" ? <SignalLedger points={points} /> : <HandoffStoryboard points={points} />}
      </div>
    </section>
  );
}

function SignalLedger({ points }: Pick<Props, "points">) {
  return (
    <div className="ms-signal-ledger mt-16">
      <div className="ms-signal-ledger-grid">
        {points.map((point, index) => {
          const Icon = point.icon;
          return <motion.article key={point.label} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.38, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}>
            <div className="ms-signal-icon"><Icon strokeWidth={1.65} /></div>
            <div><h3>{point.label}</h3><p>{point.body}</p></div>
          </motion.article>;
        })}
      </div>
    </div>
  );
}

function HandoffStoryboard({ points }: Pick<Props, "points">) {
  return (
    <div className="ms-handoff-storyboard mt-16">
      <div className="ms-handoff-orbit" aria-hidden="true"><span /><i /><b /></div>
      <div className="ms-handoff-intro"><p>Not an export. A working file with room to keep directing the idea.</p></div>
      <div className="ms-handoff-steps">
        {points.map((point, index) => {
          const Icon = point.icon;
          return <motion.article key={point.label} initial={{ opacity: 0, y: 16, filter: "blur(3px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.42, delay: index * 0.09, ease: [0.22, 1, 0.36, 1] }}>
            <div className="ms-handoff-icon"><Icon strokeWidth={1.55} /></div>
            <h3>{point.label}</h3>
            <p>{point.body}</p>
          </motion.article>;
        })}
      </div>
    </div>
  );
}
