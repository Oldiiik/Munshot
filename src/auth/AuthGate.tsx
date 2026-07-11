import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "./AuthContext";
import { register } from "../lib/api";
import { navigate } from "../lib/router";

type Tab = "signin" | "register";

interface Props {
  initialTab?: Tab;
  onBack?: () => void;
}

/** Full-screen auth screen shown until a session exists. Demo build: any
 *  email/password signs in instantly — nothing leaves the browser. */
export function AuthGate({ initialTab = "signin", onBack }: Props = {}) {
  const { signIn } = useAuth();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (tab === "register") {
        await register({ email: email.trim(), password });
        // Account exists now — sign in immediately so they land in the studio.
        await signIn(email.trim(), password);
      } else {
        await signIn(email.trim(), password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Faux app dashboard behind the card, blurred + dimmed so the auth card
          appears to float over the live product. */}
      <AppBackdrop />
      <div className="absolute inset-0 z-[1] bg-background/70 backdrop-blur-xl" />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-border/80 bg-card/95 p-8 shadow-2xl shadow-black/40 ring-1 ring-white/5 backdrop-blur-sm"
      >
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Back
          </button>
        )}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Moonshot</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Turn a brief into an AI-generated deck.
          </p>
          <p className="mt-2 text-xs text-muted-foreground/80">
            Demo mode — any email/password works.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm">
          {(["signin", "register"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                setError(null);
                setNotice(null);
                navigate(t === "register" ? "/register" : "/signin", { replace: true });
              }}
              className={`rounded-md py-1.5 font-medium transition-colors ${
                tab === t ? "bg-background shadow-sm" : "text-muted-foreground"
              }`}
            >
              {t === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {tab === "register" && (
            <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              This is a demo build — any email and password creates an account
              instantly, right in your browser.
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={8}
              required
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {notice && <p className="text-sm text-emerald-500">{notice}</p>}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy
              ? "Please wait…"
              : tab === "register"
                ? "Create account"
                : "Sign in"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

/** A static, non-interactive mock of the Moonshot dashboard rendered behind the
 *  auth card (blurred + dimmed) so signing in feels like stepping into the app. */
function AppBackdrop() {
  const covers = [
    "/samples/iphone/iphone1.webp",
    "/samples/future/future1.webp",
    "/samples/solar/solar1.webp",
    "/samples/iphone/iphone3.webp",
    "/samples/future/future3.webp",
    "/samples/solar/solar2.webp",
  ];
  return (
    <div aria-hidden className="absolute inset-0 z-0 flex select-none bg-background">
      <aside className="hidden w-60 shrink-0 flex-col gap-4 border-r border-border bg-card/70 p-5 lg:flex">
        <div className="text-lg font-semibold tracking-tight">Moonshot</div>
        <div className="h-9 rounded-lg bg-primary/25" />
        <div className="space-y-2 pt-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-8 rounded-md bg-muted/60" />
          ))}
        </div>
        <div className="mt-auto h-24 rounded-xl bg-muted/40" />
      </aside>
      <main className="flex-1 p-7">
        <div className="mb-6 h-7 w-44 rounded-md bg-muted/60" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {covers.map((c, i) => (
            <div
              key={i}
              className="aspect-video overflow-hidden rounded-xl border border-border bg-card"
            >
              <img src={c} alt="" className="size-full object-cover" loading="eager" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
