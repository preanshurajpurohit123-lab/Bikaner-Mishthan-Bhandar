import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { SITE } from "@/lib/site";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: `Sign in · ${SITE.name}` }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
        toast.success("Account created. You can sign in now.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/admin" });
      }
    } catch (e: any) {
      toast.error(e.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/admin" });
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
        <h1 className="mt-6 font-display text-2xl">{mode === "signin" ? "Sign in" : "Create account"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Access the restaurant dashboard.</p>
        <button onClick={google} disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-60">
          Continue with Google
        </button>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />or<div className="h-px flex-1 bg-border" /></div>
        <form onSubmit={submit} className="space-y-3">
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent" />
          <input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 8 chars)" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent" />
          <button disabled={busy} className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-primary">
          {mode === "signin" ? "Don't have an account? Create one" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
