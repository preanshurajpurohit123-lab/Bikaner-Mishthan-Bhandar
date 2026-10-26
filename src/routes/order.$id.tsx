import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SITE } from "@/lib/site";
import { CheckCircle2, Clock, ChefHat, Bell, PackageCheck, Check, ArrowRight, UtensilsCrossed } from "lucide-react";
import { statusBadgeClass, statusLabel } from "@/lib/order-status";

export const Route = createFileRoute("/order/$id")({
  validateSearch: (s: Record<string, unknown>) => ({ placed: s.placed === 1 || s.placed === "1" ? 1 : undefined }),
  component: OrderPage,
});

const STEPS = [
  { key: "pending", label: "Placed", Icon: Clock },
  { key: "accepted", label: "Accepted", Icon: CheckCircle2 },
  { key: "preparing", label: "Preparing", Icon: ChefHat },
  { key: "ready", label: "Out for delivery", Icon: Bell },
  { key: "served", label: "Delivered", Icon: PackageCheck },
] as const;

function OrderPage() {
  const { id } = Route.useParams();
  const { placed } = Route.useSearch();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [showSuccess, setShowSuccess] = useState<boolean>(Boolean(placed));

  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data, error } = await supabase.rpc("get_order_by_id", { _order_id: id });
      if (!mounted) return;
      if (error || !data) {
        setOrder(null);
        setItems([]);
        setNotFound(true);
        return;
      }
      const payload = data as { order: any; items: any[] };
      setOrder(payload.order);
      setItems(payload.items || []);
      setNotFound(false);
    }
    load();
    if (!navigator.onLine) return;
    const interval = setInterval(load, 10000);
    return () => { mounted = false; clearInterval(interval); };
  }, [id]);

  const stepIndex = order ? STEPS.findIndex((s) => s.key === order.status) : 0;

  function scrollToTracker() {
    setShowSuccess(false);
    setTimeout(() => {
      document.getElementById("tracker")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 py-10">
        {notFound && !order ? (
          <div className="py-20 text-center">
            <h1 className="font-display text-3xl text-primary">Order not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">This order link is invalid or the order no longer exists.</p>
            <Link to="/menu" className="mt-6 inline-block rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground hover:opacity-90">Browse menu</Link>
          </div>
        ) : !order ? (
          <div className="py-20 text-center text-muted-foreground">Loading your order…</div>
        ) : (
          <>
            {showSuccess && (
              <div className="mb-6 animate-fade-in rounded-3xl border border-green-200 bg-gradient-to-br from-green-50 via-card to-card p-6 text-center shadow-sm sm:p-8">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white shadow-lg animate-scale-in">
                  <Check className="h-9 w-9" strokeWidth={3} />
                </div>
                <h2 className="mt-4 font-display text-2xl text-primary sm:text-3xl">Thank you for ordering!</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your order has been placed successfully. We'll prepare your food exactly the way you want.
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-background p-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Order ID</div>
                    <div className="mt-1 font-display text-lg text-primary">#{order.order_number}</div>
                  </div>
                  <div className="rounded-2xl border border-border bg-background p-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Estimated time</div>
                    <div className="mt-1 inline-flex items-center gap-1 font-display text-lg text-primary">
                      <Clock className="h-4 w-4" /> 30–40 min
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <button
                    onClick={scrollToTracker}
                    className="inline-flex items-center justify-center gap-1 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                  >
                    Track Order <ArrowRight className="h-4 w-4" />
                  </button>
                  <Link
                    to="/menu"
                    className="inline-flex items-center justify-center gap-1 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-primary hover:bg-muted"
                  >
                    <UtensilsCrossed className="h-4 w-4" /> Back to Menu
                  </Link>
                </div>
              </div>
            )}

            <div id="tracker" className="rounded-3xl border border-accent/40 bg-gradient-to-br from-accent/15 via-card to-card p-6 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-accent">Order placed</p>
              <h1 className="mt-2 font-display text-4xl text-primary">#{order.order_number}</h1>
              {order.table_number && <p className="mt-1 text-sm text-muted-foreground">Table {order.table_number}</p>}
              <div className="mt-3">
                <span className={statusBadgeClass(order.status)}>{statusLabel(order.status)}</span>
              </div>
              {order.status === "cancelled" ? null : (
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
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/menu" className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-primary hover:bg-muted">← Back to menu</Link>
            </div>
          </>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
