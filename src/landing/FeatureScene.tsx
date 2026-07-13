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
              <span className="text-[13px] font-medium uppercase tracking-[0.24em] text-white/55">
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

        {/* ---- capabilities — editorial columns, hairline-ruled, no boxes ---- */}
        <div className="mt-16 grid gap-x-0 gap-y-10 sm:grid-cols-3">
          {points.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.65, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                className={`group relative sm:px-9 ${
                  i > 0 ? "sm:border-l sm:border-white/10" : "sm:pl-0"
                }`}
              >
                <div className="mb-5 grid size-12 place-items-center rounded-full border border-white/15 text-white/80 transition-all duration-500 group-hover:border-white/45 group-hover:text-white group-hover:[transform:translateY(-2px)]">
                  <Icon className="size-5" strokeWidth={1.5} />
                </div>

                <h3 className="text-[18px] font-semibold tracking-tight text-white">
                  {p.label}
                </h3>
                <p className="mt-2 max-w-[30ch] text-[14.5px] leading-relaxed text-white/55">
                  {p.body}
                </p>

                <span className="mt-5 block h-px w-9 bg-white/25 transition-all duration-500 ease-out group-hover:w-16 group-hover:bg-white/55" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
