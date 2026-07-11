import { useMemo } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { useScrollContainer } from "./scroll";

/**
 * Fixed, full-viewport backdrop that drifts as the page scrolls. Three parallax
 * layers (deep nebula, a banking moon, near starfield) read off the landing
 * scroll container so the background feels like it has depth instead of sitting
 * flat behind the content. Honors prefers-reduced-motion.
 */
export function ScrollAtmosphere() {
  const container = useScrollContainer();
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    container: container ?? undefined,
  });

  // parallax depths — far layers move least, near layers move most
  const nebulaY = useTransform(scrollYProgress, [0, 1], ["0%", "-22%"]);
  const moonY = useTransform(scrollYProgress, [0, 1], ["-6%", "34%"]);
  const moonX = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);
  const moonScale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);
  const starsY = useTransform(scrollYProgress, [0, 1], ["0%", "48%"]);
  const veilOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.15, 0.42, 0.7]);

  const stars = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 1.7 + 0.4,
        delay: Math.random() * 5,
        dur: Math.random() * 3 + 2.4,
        // a third of the stars sit "closer" and parallax harder
        near: Math.random() > 0.66,
      })),
    []
  );

  const staticStyle = reduce ? {} : undefined;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#06060a]">
      {/* deep nebula wash */}
      <motion.div
        style={reduce ? staticStyle : { y: nebulaY, willChange: "transform" }}
        className="absolute inset-0"
      >
        <div className="absolute -left-[18%] top-[8%] size-[42rem] rounded-full bg-indigo-600/14 blur-[150px]" />
        <div className="absolute -right-[16%] top-[42%] size-[46rem] rounded-full bg-violet-600/14 blur-[160px]" />
        <div className="absolute left-[24%] top-[84%] size-[38rem] rounded-full bg-sky-500/10 blur-[150px]" />
      </motion.div>

      {/* banking moon */}
      <motion.img
        src="/moon-orb.webp"
        alt=""
        style={reduce ? staticStyle : { y: moonY, x: moonX, scale: moonScale, willChange: "transform" }}
        className="absolute right-[8%] top-[12%] hidden w-72 opacity-70 drop-shadow-[0_0_80px_rgba(150,170,255,0.28)] lg:block"
      />

      {/* near starfield */}
      <motion.div style={reduce ? staticStyle : { y: starsY, willChange: "transform" }} className="absolute inset-0">
        {stars.map((s) => (
          <span
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: s.size * (s.near ? 1.5 : 1),
              height: s.size * (s.near ? 1.5 : 1),
              opacity: s.near ? 0.9 : 0.5,
              animation: reduce ? undefined : `ms-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </motion.div>

      {/* progressive darkening veil so copy stays readable deeper down */}
      <motion.div
        style={reduce ? { opacity: 0.4 } : { opacity: veilOpacity }}
        className="absolute inset-0 bg-[#06060a]"
      />
      {/* top + bottom fades */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#06060a] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#06060a] to-transparent" />
    </div>
  );
}
