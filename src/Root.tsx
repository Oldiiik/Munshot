import { useEffect } from "react";
import App from "./App";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { AuthGate } from "./auth/AuthGate";
import { Landing } from "./landing/Landing";
import { Legal, type LegalDoc } from "./landing/Legal";
import { navigate, usePathname } from "./lib/router";

/** Key the landing hero uses to hand a typed brief to the app post-signup. */
export const PENDING_BRIEF_KEY = "moonshot:pendingBrief";

/** Standalone legal routes, available signed-in or out (served via the SPA rewrite). */
const LEGAL_ROUTES: Record<string, LegalDoc> = {
  "/terms": "terms",
  "/privacy": "privacy",
  "/refunds": "refunds",
};

/** Decides between the landing page, auth screen, and the app — by pathname. */
function Gate() {
  const { session } = useAuth();
  const pathname = usePathname();

  const legalDoc = LEGAL_ROUTES[pathname];
  const isAuthRoute = pathname === "/signin" || pathname === "/register";
  const isAppRoute = pathname === "/app" || pathname.startsWith("/app/");

  // Route corrections: signed-in users skip landing/auth; signed-out users
  // can't deep-link into the app.
  useEffect(() => {
    if (session === undefined || legalDoc) return;
    if (session && !isAppRoute) navigate("/app", { replace: true });
    if (!session && isAppRoute) navigate("/signin", { replace: true });
  }, [session, isAppRoute, legalDoc, pathname]);

  if (legalDoc) return <Legal doc={legalDoc} />;

  if (session === undefined) {
    // Initial session still loading — avoid flashing the landing/auth screen.
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (session) {
    if (!isAppRoute) return null; // redirecting to /app
    return <App />;
  }

  if (isAppRoute) return null; // redirecting to /signin

  if (isAuthRoute) {
    return (
      <AuthGate
        initialTab={pathname === "/register" ? "register" : "signin"}
        onBack={() => navigate("/")}
      />
    );
  }

  return (
    <Landing
      onAuth={(tab, brief) => {
        if (brief) localStorage.setItem(PENDING_BRIEF_KEY, brief);
        navigate(tab === "register" ? "/register" : "/signin");
      }}
    />
  );
}

export default function Root() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
