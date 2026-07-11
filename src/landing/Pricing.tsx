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
    {
      key: "free" as const,
      icon: Sparkles,
      data: p.tiers.free,
      featured: false,
    },
    {
      key: "pro" as const,
      icon: Rocket,
      data: p.tiers.pro,
      featured: true,
    },
    {
      key: "ultra" as const,
      icon: Star,
      data: p.tiers.ultra,
      featured: false,
    },
  ];

  return (
    <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
      {tiers.map((tier, i) => {
        const Icon = tier.icon;
        const featured = tier.featured;
        return (
          <motion.div
            key={tier.key}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
            className={`relative flex flex-col rounded-3xl border p-7 ${
              featured
                ? "border-white/25 bg-white/[0.06]"
                : "border-white/10 bg-white/[0.02]"
            }`}
          >
            {featured && (
              <>
                <div className="pointer-events-none absolute -inset-px -z-10 rounded-3xl bg-gradient-to-b from-indigo-400/30 to-transparent blur-[2px]" />
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-white px-3 py-1 text-xs font-medium text-black">
                  {p.popular}
                </span>
              </>
            )}

            <div className="mb-5 flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/[0.05] text-white/80">
                <Icon className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{tier.data.name}</h3>
                <p className="text-xs text-white/45">{tier.data.tagline}</p>
              </div>
            </div>

            <div className="mb-6 flex items-end gap-1">
              <span className="font-display text-5xl tracking-tight text-white">
                {tier.data.price}
              </span>
              <span className="mb-1.5 text-sm text-white/45">{p.perMonth}</span>
            </div>

            <ul className="mb-7 space-y-3">
              {tier.data.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-white/70">
                  <Check
                    className={`mt-0.5 size-4 shrink-0 ${
                      featured ? "text-indigo-300" : "text-white/40"
                    }`}
                  />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              onClick={() => onAuth("register")}
              className={`mt-auto w-full rounded-xl ${
                featured
                  ? "bg-white text-black hover:bg-white"
                  : "border border-white/15 bg-white/[0.04] text-white hover:bg-white/10"
              }`}
            >
              {tier.data.cta}
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
}
