import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { SITE } from "@/lib/site";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: `Admin Sign In · ${SITE.name}` },
      { name: "description", content: `Secure staff and admin sign in for ${SITE.name}.` },
      { property: "og:title", content: `Admin Sign In · ${SITE.name}` },
      { property: "og:description", content: `Secure staff and admin sign in for ${SITE.name}.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : "",
  }),
  component: AuthPage,
});

// Only accept same-origin relative paths for post-login redirect.
function safeNext(next: string): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const goAfterAuth = () => {
    const dest = safeNext(next);
    if (dest) window.location.href = dest;
    else navigate({ to: "/admin" });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) goAfterAuth();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      goAfterAuth();
    } catch (e: any) {
      toast.error(e.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    const dest = safeNext(next) ?? "/admin";
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + dest });
    if (r.error) toast.error((r.error as any).message || "Google sign-in failed");
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary to-[oklch(0.28_0.10_25)] px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-2xl">
        <Link to="/" className="flex items-center gap-3">
          <img src={SITE.logoUrl} alt="BMB" className="h-12 w-12 rounded-full ring-2 ring-accent" />
          <div>
            <div className="font-display text-lg text-primary">{SITE.short}</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Staff & admin</div>
          </div>
        </Link>
        <h1 className="mt-6 font-display text-2xl">Admin sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Access the restaurant dashboard.</p>
        <Button type="button" variant="outline" onClick={google} disabled={busy} className="mt-6 w-full">
          Continue with Google
        </Button>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />or<div className="h-px flex-1 bg-border" /></div>
        <form onSubmit={submit} className="space-y-3">
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent" />
          <input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 8 chars)" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent" />
          <Button disabled={busy} className="w-full">
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">Only authorised staff accounts can access the dashboard.</p>
      </div>
    </div>
  );
}
