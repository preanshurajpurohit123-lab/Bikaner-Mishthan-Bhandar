import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const [stats, setStats] = useState({ today: 0, revenue: 0, pending: 0, items: 0 });
  useEffect(() => {
    (async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const [orders, pending, items] = await Promise.all([
        supabase.from("orders").select("total, status, created_at").gte("created_at", start.toISOString()),
        supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["pending", "accepted", "preparing", "ready"]),
        supabase.from("menu_items").select("id", { count: "exact", head: true }),
      ]);
      const todayOrders = orders.data || [];
      setStats({
        today: todayOrders.length,
        revenue: todayOrders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0),
        pending: pending.count || 0,
        items: items.count || 0,
      });
    })();
  }, []);
  const tiles = [
    { label: "Orders today", value: stats.today },
    { label: "Revenue today", value: `${SITE.currency}${stats.revenue.toFixed(0)}` },
    { label: "Active orders", value: stats.pending },
    { label: "Menu items", value: stats.items },
  ];
  return (
    <div>
      <h1 className="font-display text-3xl text-primary">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Live snapshot of today's activity.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-border bg-card p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{t.label}</div>
            <div className="mt-2 font-display text-3xl text-primary">{t.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
