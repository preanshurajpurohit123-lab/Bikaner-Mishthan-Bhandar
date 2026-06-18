import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/lib/site";
import { toast } from "sonner";
import { statusBadgeClass, statusLabel } from "@/lib/order-status";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: OrdersPage,
});

const STATUSES = ["pending", "accepted", "preparing", "ready", "served", "completed", "cancelled"] as const;
type Status = typeof STATUSES[number];

function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [items, setItems] = useState<Record<string, any[]>>({});
  const [filter, setFilter] = useState<Status | "active">("active");

  async function load() {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100);
    setOrders(data || []);
    if (data && data.length) {
      const { data: it } = await supabase.from("order_items").select("*").in("order_id", data.map((o) => o.id));
      const grouped: Record<string, any[]> = {};
      (it || []).forEach((i) => { (grouped[i.order_id] ||= []).push(i); });
      setItems(grouped);
    }
  }
  useEffect(() => {
    load();
    const ch = supabase.channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  async function setStatus(id: string, s: Status) {
    const { error } = await supabase.from("orders").update({ status: s }).eq("id", id);
    if (error) toast.error(error.message); else toast.success(`Marked ${s}`);
  }

  const filtered = orders.filter((o) =>
    filter === "active" ? !["completed", "cancelled", "served"].includes(o.status) : o.status === filter,
  );

  return (
    <div>
      <h1 className="font-display text-3xl text-primary">Live Orders</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {(["active", ...STATUSES] as const).map((s) => {
          const isActive = filter === s;
          if (s === "active") {
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize transition ${
                  isActive ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"
                }`}
              >
                Active
              </button>
            );
          }
          return (
            <button key={s} onClick={() => setFilter(s)} className={`${statusBadgeClass(s, isActive)} transition`}>
              {statusLabel(s)}
            </button>
          );
        })}
      </div>
      <div className="mt-6 grid gap-4">
        {filtered.length === 0 && <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No orders.</div>}
        {filtered.map((o) => (
          <div key={o.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-display text-xl text-primary">#{o.order_number} {o.table_number && <span className="text-sm font-normal text-muted-foreground">· Table {o.table_number}</span>}</div>
                <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()} {o.customer_name && `· ${o.customer_name}`}{o.customer_phone && ` · ${o.customer_phone}`}</div>
                {o.notes && <div className="mt-1 text-xs italic text-muted-foreground">"{o.notes}"</div>}
              </div>
              <div className="text-right">
                <div className="font-display text-2xl text-primary">{SITE.currency}{Number(o.total).toFixed(0)}</div>
                <div className="mt-1 inline-block rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-medium uppercase text-primary">{o.status}</div>
              </div>
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {(items[o.id] || []).map((i) => (
                <li key={i.id} className="flex justify-between"><span>{i.quantity} × {i.name_snapshot}</span><span>{SITE.currency}{Number(i.line_total).toFixed(0)}</span></li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {STATUSES.filter((s) => s !== o.status).map((s) => (
                <button key={s} onClick={() => setStatus(o.id, s)} className="rounded-full border border-border bg-background px-3 py-1 text-xs capitalize hover:bg-muted">{s}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
