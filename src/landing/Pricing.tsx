import { motion } from "motion/react";
import { Check, Rocket, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "./i18n";

type AuthTab = "signin" | "register";

interface Props {
  onAuth: (tab: AuthTab) => void;
}

export function Pricing({ onAuth }: Props) {
  const { t } = useI18n();
  const p = t.pricing;

  const tiers = [
    { key: "free" as const, icon: Sparkles, data: p.tiers.free, featured: false },
    { key: "pro" as const, icon: Rocket, data: p.tiers.pro, featured: true },
    { key: "ultra" as const, icon: Star, data: p.tiers.ultra, featured: false },
  ];

  return (
    <div className="relative mx-auto max-w-5xl">
      {/* majestic ambient aura pooling behind the podium */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[130%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-[999px] bg-white/[0.05] blur-[110px]" />

      <div className="grid items-center gap-5 md:grid-cols-3">
        {tiers.map((tier, i) => {
          const Icon = tier.icon;
          const featured = tier.featured;
          return (
            <motion.div
              key={tier.key}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{
                y: -8,
                transition: { type: "spring", stiffness: 220, damping: 24 },
              }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.65, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className={`group relative flex flex-col rounded-[28px] p-8 ${
                featured
                  ? "ms-glass-strong ms-shimmer z-10 md:scale-[1.06] md:py-10"
                  : "ms-glass-subtle md:my-2"
              }`}
            >
              {featured && (
                <>
                  {/* halo */}
                  <div className="pointer-events-none absolute -inset-5 -z-10 rounded-[36px] bg-white/[0.08] opacity-80 blur-2xl" />
                  {/* corner badge, kept inside the clipped surface */}
                  <span className="ms-btn absolute right-5 top-5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                    {p.popular}
                  </span>
                </>
              )}

              <div className="mb-7 flex items-center gap-3">
                <div
                  className={`grid size-11 place-items-center rounded-2xl border text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] ${
                    featured
                      ? "border-white/20 bg-white/[0.09]"
                      : "border-white/10 bg-white/[0.05]"
                  }`}
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-white">
                    {tier.data.name}
                  </h3>
                  <p className="text-xs text-white/45">{tier.data.tagline}</p>
                </div>
              </div>

              <div className="flex items-end gap-1.5">
                <span className="font-display font-display-tight text-[3.4rem] leading-none tracking-tight text-white">
                  {tier.data.price}
                </span>
                <span className="mb-2 text-sm text-white/45">{p.perMonth}</span>
              </div>

              <div className="ms-divider my-7" />

              <ul className="mb-8 space-y-3.5">
                {tier.data.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[14.5px] text-white/75">
                    <span
                      className={`mt-px grid size-[18px] shrink-0 place-items-center rounded-full ${
                        featured
                          ? "bg-white text-black"
                          : "border border-white/15 text-white/55"
                      }`}
                    >
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => onAuth("register")}
                className={`mt-auto h-11 w-full rounded-full ${
                  featured
                    ? "ms-btn"
                    : "border border-white/15 bg-white/[0.04] text-white hover:bg-white/10"
                }`}
              >
                {tier.data.cta}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
