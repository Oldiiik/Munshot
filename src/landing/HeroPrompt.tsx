import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowUp, Paperclip, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "./i18n";

/** Auto-types the example briefs char-by-char, deleting and cycling, until the
 *  user focuses the field — then it hands control over to them. */
function useTypewriter(active: boolean, examples: string[]) {
  const [text, setText] = useState("");
  const idx = useRef(0);
  const pos = useRef(0);
  const phase = useRef<"typing" | "hold" | "deleting">("typing");

  useEffect(() => {
    if (!active) return;
    let timer: number;

    const tick = () => {
      const full = examples[idx.current];
      let delay = 38;

      if (phase.current === "typing") {
        pos.current += 1;
        setText(full.slice(0, pos.current));
        if (pos.current >= full.length) {
          phase.current = "hold";
          delay = 2200;
        }
      } else if (phase.current === "hold") {
        phase.current = "deleting";
        delay = 30;
      } else {
        pos.current -= 2;
        setText(full.slice(0, Math.max(0, pos.current)));
        delay = 18;
        if (pos.current <= 0) {
          phase.current = "typing";
          idx.current = (idx.current + 1) % examples.length;
          delay = 320;
        }
      }
      timer = window.setTimeout(tick, delay);
    };

    timer = window.setTimeout(tick, 600);
    return () => window.clearTimeout(timer);
  }, [active, examples]);

  return text;
}

interface Props {
  onSubmit: (brief: string) => void;
}

export function HeroPrompt({ onSubmit }: Props) {
  const { t } = useI18n();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const auto = useTypewriter(!focused && value.length === 0, t.prompt.examples);
  const shown = value.length > 0 || focused ? value : auto;
  const showCaret = !focused && value.length === 0;

  const submit = () => onSubmit((value || auto).trim());

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="group relative mx-auto w-full max-w-2xl"
    >
      {/* glow ring */}
      <div className="pointer-events-none absolute -inset-px rounded-[1.6rem] bg-gradient-to-b from-white/20 to-white/0 opacity-60 blur-[2px] transition-opacity group-focus-within:opacity-100" />
      <div className="pointer-events-none absolute -inset-8 rounded-full bg-white/5 opacity-0 blur-3xl transition-opacity duration-700 group-focus-within:opacity-100" />

      <div className="relative rounded-[1.5rem] border border-white/12 bg-white/[0.04] p-3 shadow-2xl backdrop-blur-xl">
        <div className="relative min-h-[68px] px-3 pt-2.5">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
            rows={2}
            className="absolute inset-0 size-full resize-none bg-transparent px-3 pt-2.5 text-[15px] leading-relaxed text-white caret-white outline-none placeholder:text-transparent"
          />
          {value.length === 0 && (
            <p className="pointer-events-none select-none text-[15px] leading-relaxed text-white/55">
              {shown}
              {showCaret && (
                <span className="ml-0.5 inline-block h-[1.05em] w-px translate-y-[2px] animate-pulse bg-white/70 align-middle" />
              )}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-1.5 pt-1.5">
          <div className="flex items-center gap-2 text-xs text-white/45">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
              <Paperclip className="size-3.5" /> {t.prompt.assets}
            </span>
            <span className="hidden items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 sm:inline-flex">
              <Sparkles className="size-3.5" /> {t.prompt.autoBrand}
            </span>
          </div>

          <Button
            type="button"
            onClick={submit}
            className="rounded-xl bg-white text-black shadow-lg hover:bg-white"
          >
            {t.prompt.generate}
            <ArrowUp className="size-4 -rotate-45" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
