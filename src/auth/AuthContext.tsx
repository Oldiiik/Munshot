import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { SESSION_KEY } from "../lib/demo";

// Demo auth: no backend. Any email/password signs in instantly; the session is
// a plain object persisted to localStorage. The exported surface mirrors the
// real Supabase-backed AuthContext so every consumer compiles unchanged.

export interface Profile {
  id: string;
  email: string | null;
  role: "user" | "admin";
  deck_allowance: number;
  decks_generated: number;
  invite_code: string | null;
}

export interface DemoUser {
  id: string;
  email: string;
}

export interface DemoSession {
  user: DemoUser;
}

interface AuthState {
  /** undefined = still loading the initial session. */
  session: DemoSession | null | undefined;
  user: DemoUser | null;
  profile: Profile | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

function demoProfile(user: DemoUser): Profile {
  return {
    id: user.id,
    email: user.email,
    role: "user",
    deck_allowance: 999,
    decks_generated: 0,
    invite_code: null,
  };
}

function loadSession(): DemoSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoSession;
    return parsed?.user?.id ? parsed : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<DemoSession | null | undefined>(undefined);

  // Restore the persisted demo session on mount.
  useEffect(() => {
    setSession(loadSession());
  }, []);

  const value = useMemo<AuthState>(() => {
    const user = session?.user ?? null;
    return {
      session,
      user,
      profile: user ? demoProfile(user) : null,
      isAdmin: false,
      signIn: async (email) => {
        const next: DemoSession = {
          user: {
            id: "demo-user",
            email: email.trim() || "demo@moonshot.app",
          },
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(next));
        setSession(next);
      },
      signOut: async () => {
        localStorage.removeItem(SESSION_KEY);
        setSession(null);
      },
      refreshProfile: async () => {
        /* profile is static in the demo */
      },
    };
  }, [session]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>.");
  return ctx;
}
