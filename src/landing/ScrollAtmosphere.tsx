import { useMemo, type CSSProperties } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { useScrollContainer } from "./scroll";

/** Pastel palette the day-time bokeh motes are tinted from. */
const DAWN_MOTES = [
  "255,255,255", // white
  "255,224,178", // gold
  "227,201,246", // lilac
  "247,201,216", // blush
  "199,226,241", // sky
];

/**
 * Fixed, full-viewport backdrop that drifts as the page scrolls. At night it's a
 * deep nebula, a banking moon and a twinkling starfield; by day it becomes a
 * luminous dawn — sun-glow, god-rays, pastel blooms and glowing bokeh motes — so
 * the light theme feels every bit as magical as the dark one. Honors
 * prefers-reduced-motion.
 */
export function ScrollAtmosphere({ theme = "dark" }: { theme?: "dark" | "light" }) {
  const container = useScrollContainer();
  const reduce = useReducedMotion();
  const light = theme === "light";
  const fade = light ? "#f4eee6" : "#06060a";
  const { scrollYProgress } = useScroll({ container: container ?? undefined });

  // parallax depths — far layers move least, near layers move most
  const nebulaY = useTransform(scrollYProgress, [0, 1], ["0%", "-22%"]);
  const moonY = useTransform(scrollYProgress, [0, 1], ["-6%", "34%"]);
  const moonX = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);
  const moonScale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);
  // fade the wandering moon out before the CTA so its own centred moon is alone
  const moonOpacity = useTransform(scrollYProgress, [0, 0.8, 0.93], [1, 1, 0]);
  const starsY = useTransform(scrollYProgress, [0, 1], ["0%", "48%"]);
  const veilOpacity = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    light ? [0.05, 0.2, 0.4] : [0.15, 0.42, 0.7]
  );

  const stars = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 1.7 + 0.4,
        delay: Math.random() * 5,
        dur: Math.random() * 3 + 2.4,
        // a third sit "closer" and parallax + glow harder
        near: Math.random() > 0.66,
        tint: DAWN_MOTES[i % DAWN_MOTES.length],
      })),
    []
  );

  const staticStyle = reduce ? {} : undefined;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden transition-colors duration-500"
      style={{
        background: light
          ? "linear-gradient(180deg, #f3f2f6 0%, #f6f0ea 52%, #f1e6db 100%)"
          : "#06060a",
      }}
    >
      {/* ---- day: breathing sun-glow + soft god-rays ---- */}
      {light && (
        <>
          <div
            className="absolute -right-[6%] -top-[10%] size-[48vw] rounded-full bg-[radial-gradient(circle,rgba(255,231,193,0.9),rgba(255,223,203,0.28)_45%,transparent_70%)] blur-[40px]"
            style={reduce ? undefined : ({ "--o": 0.95, animation: "ms-glow-pulse 9s ease-in-out infinite, ms-orb-drift 26s ease-in-out infinite" } as CSSProperties)}
          />
          <div className="absolute inset-0 opacity-[0.55] [mask-image:linear-gradient(to_bottom,#000,transparent_70%)]">
            <div className="absolute -top-[20%] right-[8%] h-[130%] w-[16vw] -rotate-[24deg] bg-[linear-gradient(to_bottom,rgba(255,244,224,0.6),transparent)] blur-[26px]" />
            <div className="absolute -top-[20%] right-[26%] h-[130%] w-[10vw] -rotate-[24deg] bg-[linear-gradient(to_bottom,rgba(255,247,232,0.45),transparent)] blur-[26px]" />
            <div className="absolute -top-[20%] right-[40%] h-[130%] w-[7vw] -rotate-[24deg] bg-[linear-gradient(to_bottom,rgba(255,250,240,0.32),transparent)] blur-[26px]" />
          </div>
        </>
      )}

      {/* ---- nebula / dawn colour wash (parallax) ---- */}
      <motion.div
        style={reduce ? staticStyle : { y: nebulaY, willChange: "transform" }}
        className="absolute inset-0"
      >
        {light ? (
          <>
            <div
              className="absolute -left-[12%] -top-[12%] size-[60vw] rounded-full bg-[rgb(197,190,244)] blur-[100px]"
              style={reduce ? { opacity: 0.5 } : ({ "--o": 0.52, animation: "ms-glow-pulse 12s ease-in-out infinite, ms-orb-drift 30s ease-in-out infinite" } as CSSProperties)}
            />
            <div
              className="absolute -right-[14%] bottom-[-16%] size-[56vw] rounded-full bg-[rgb(249,196,210)] blur-[100px]"
              style={reduce ? { opacity: 0.52 } : ({ "--o": 0.54, animation: "ms-glow-pulse 10s ease-in-out 0.6s infinite" } as CSSProperties)}
            />
            <div
              className="absolute left-[30%] top-[48%] size-[46vw] rounded-full bg-[rgb(188,224,231)] blur-[105px]"
              style={reduce ? { opacity: 0.44 } : ({ "--o": 0.46, animation: "ms-glow-pulse 13s ease-in-out 1s infinite, ms-orb-drift 34s ease-in-out infinite" } as CSSProperties)}
            />
            <div
              className="absolute left-[52%] top-[6%] size-[30vw] rounded-full bg-[rgb(255,226,192)] blur-[95px]"
              style={reduce ? { opacity: 0.5 } : ({ "--o": 0.5, animation: "ms-glow-pulse 8.5s ease-in-out infinite" } as CSSProperties)}
            />
          </>
        ) : (
          <>
            <div className="absolute -left-[18%] top-[8%] size-[42rem] rounded-full bg-[rgb(80,80,120)] opacity-[0.2] blur-[110px]" />
            <div className="absolute -right-[16%] top-[42%] size-[46rem] rounded-full bg-[rgb(120,90,130)] opacity-[0.16] blur-[115px]" />
            <div className="absolute left-[24%] top-[84%] size-[38rem] rounded-full bg-[rgb(60,100,120)] opacity-[0.14] blur-[110px]" />
          </>
        )}
      </motion.div>

      {/* ---- banking moon — a soft warm halo makes the day disc feel magical ---- */}
      <motion.div
        style={
          reduce
            ? staticStyle
            : { y: moonY, x: moonX, scale: moonScale, opacity: moonOpacity, willChange: "transform, opacity" }
        }
        className="absolute right-[8%] top-[12%] hidden lg:block"
      >
        {light && (
          <div className="absolute left-1/2 top-1/2 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,238,214,0.6),transparent_62%)] blur-[10px]" />
        )}
        <img
          src="/moon-orb.webp"
          alt=""
          className={`ms-moon relative w-72 ${
            light ? "" : "opacity-70 drop-shadow-[0_0_80px_rgba(150,170,255,0.28)]"
          }`}
        />
      </motion.div>

      {/* ---- particles: night starfield / day bokeh motes (parallax) ---- */}
      <motion.div style={reduce ? staticStyle : { y: starsY, willChange: "transform" }} className="absolute inset-0">
        {stars.map((s) => {
          const size = s.size * (s.near ? (light ? 2.6 : 1.5) : light ? 1.4 : 1);
          return (
            <span
              key={s.id}
              className="absolute rounded-full"
              style={{
                top: `${s.top}%`,
                left: `${s.left}%`,
                width: size,
                height: size,
                backgroundColor: light ? `rgb(${s.tint})` : "#ffffff",
                opacity: light ? (s.near ? 0.75 : 0.45) : s.near ? 0.9 : 0.5,
                boxShadow: light
                  ? `0 0 ${s.near ? 12 : 6}px ${s.near ? 3 : 1.5}px rgba(${s.tint},0.7)`
                  : undefined,
                animation: reduce ? undefined : `ms-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
              }}
            />
          );
        })}
      </motion.div>

      {/* progressive veil so copy stays readable deeper down */}
      <motion.div
        style={{ opacity: reduce ? (light ? 0.2 : 0.4) : veilOpacity, backgroundColor: fade }}
        className="absolute inset-0"
      />
      {/* top + bottom fades */}
      <div
        className="absolute inset-x-0 top-0 h-40"
        style={{ backgroundImage: `linear-gradient(to bottom, ${fade}, transparent)` }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-48"
        style={{ backgroundImage: `linear-gradient(to top, ${fade}, transparent)` }}
      />
    </div>
  );
}
