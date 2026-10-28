import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/lib/site";
import { LayoutDashboard, ClipboardList, UtensilsCrossed, BarChart3, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const NAV: { to: "/admin" | "/admin/orders" | "/admin/menu" | "/admin/analysis"; label: string; Icon: any; exact?: boolean }[] = [
  { to: "/admin", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "Orders", Icon: ClipboardList },
  { to: "/admin/menu", label: "Menu", Icon: UtensilsCrossed },
  { to: "/admin/analysis", label: "Analysis", Icon: BarChart3 },
];

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      setIsAdmin(!!data?.some((r) => r.role === "admin" || r.role === "staff"));
    })();
  }, []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { next: "" }, replace: true });
  }

  if (isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Checking access…
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8">
          <h1 className="font-display text-2xl text-primary">No access yet</h1>
          <p className="mt-3 text-sm text-muted-foreground">Your account doesn't have admin or staff access yet. Please sign in with an authorised admin account, or ask an existing admin to grant you access.</p>
          <button onClick={signOut} className="mt-5 rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground">Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/admin" className="flex items-center gap-3">
            <img src={SITE.logoUrl} alt="BMB" className="h-9 w-9 rounded-full ring-2 ring-accent" />
            <div>
              <div className="font-display text-base text-primary">Admin Dashboard</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{SITE.short}</div>
            </div>
          </Link>
          <button onClick={signOut} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-muted"><LogOut className="h-3.5 w-3.5" /> Sign out</button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2">
          {NAV.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-1.5 text-sm ${active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}>
                <n.Icon className="h-4 w-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8"><Outlet /></main>
    </div>
  );
}
