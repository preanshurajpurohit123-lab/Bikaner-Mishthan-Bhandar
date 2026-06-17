import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SITE } from "@/lib/site";
import { CheckCircle2, Clock, ChefHat, Bell, PackageCheck } from "lucide-react";

export const Route = createFileRoute("/order/$id")({
  component: OrderPage,
});

const STEPS = [
  { key: "pending", label: "Placed", Icon: Clock },
  { key: "accepted", label: "Accepted", Icon: CheckCircle2 },
  { key: "preparing", label: "Preparing", Icon: ChefHat },
  { key: "ready", label: "Ready", Icon: Bell },
  { key: "served", label: "Served", Icon: PackageCheck },
] as const;

function OrderPage() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const [o, it] = await Promise.all([
        supabase.from("orders").select("*").eq("id", id).maybeSingle(),
        supabase.from("order_items").select("*").eq("order_id", id),
      ]);
      if (!mounted) return;
      setOrder(o.data);
      setItems(it.data || []);
    }
    load();
    const ch = supabase.channel(`order-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `id=eq.${id}` }, (p) => setOrder(p.new))
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [id]);

  const stepIndex = order ? STEPS.findIndex((s) => s.key === order.status) : 0;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 py-10">
        {!order ? (
          <div className="py-20 text-center text-muted-foreground">Loading your order…</div>
        ) : (
          <>
            <div className="rounded-3xl border border-accent/40 bg-gradient-to-br from-accent/15 via-card to-card p-6 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-accent">Order placed</p>
              <h1 className="mt-2 font-display text-4xl text-primary">#{order.order_number}</h1>
              {order.table_number && <p className="mt-1 text-sm text-muted-foreground">Table {order.table_number}</p>}
              {order.status === "cancelled" ? (
                <p className="mt-4 inline-block rounded-full bg-destructive/15 px-4 py-1 text-sm font-medium text-destructive">Cancelled</p>
              ) : (
                <div className="mt-6 grid grid-cols-5 gap-2">
                  {STEPS.map((s, i) => {
                    const Active = i <= stepIndex || order.status === "completed";
                    return (
                      <div key={s.key} className="flex flex-col items-center gap-1">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full border ${Active ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card text-muted-foreground"}`}>
                          <s.Icon className="h-4 w-4" />
                        </div>
                        <div className={`text-[10px] ${Active ? "text-primary" : "text-muted-foreground"}`}>{s.label}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
              {items.map((i) => (
                <li key={i.id} className="flex items-center justify-between p-4 text-sm">
                  <span>{i.quantity} × {i.name_snapshot}</span>
                  <span>{SITE.currency}{Number(i.line_total).toFixed(0)}</span>
                </li>
              ))}
              <li className="flex items-center justify-between bg-muted/40 p-4 font-display text-lg">
                <span>Total</span><span>{SITE.currency}{Number(order.total).toFixed(0)}</span>
              </li>
            </ul>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Need anything? Call <a href={`tel:${SITE.phoneDigits}`} className="font-medium text-primary">{SITE.phone}</a>
            </div>
            <div className="mt-6 text-center">
              <Link to="/menu" className="text-sm font-medium text-primary hover:underline">Add more items →</Link>
            </div>
          </>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
