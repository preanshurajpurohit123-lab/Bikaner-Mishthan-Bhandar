import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useCart, useActiveTable } from "@/lib/cart";
import { SITE } from "@/lib/site";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: `Your Cart · ${SITE.name}` }] }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, subtotal, clear } = useCart();
  const { table } = useActiveTable();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function placeOrder() {
    if (items.length === 0) return;
    if (!table && !name.trim()) {
      toast.error("Please enter your name (or scan your table QR).");
      return;
    }
    setSubmitting(true);
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          table_id: table?.id ?? null,
          table_number: table?.number ?? null,
          customer_name: name.trim() || null,
          customer_phone: phone.trim() || null,
          notes: notes.trim() || null,
          subtotal,
          total: subtotal,
          status: "pending",
        })
        .select("id, order_number")
        .single();
      if (error) throw error;
      const { error: itemsErr } = await supabase.from("order_items").insert(
        items.map((i) => ({
          order_id: order.id,
          menu_item_id: i.id,
          name_snapshot: i.name,
          price_snapshot: i.price,
          quantity: i.quantity,
          line_total: i.price * i.quantity,
        })),
      );
      if (itemsErr) throw itemsErr;
      clear();
      toast.success(`Order #${order.order_number} placed!`);
      navigate({ to: "/order/$id", params: { id: order.id } });
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Could not place order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-4xl text-primary">Your cart</h1>
        {table ? (
          <p className="mt-2 text-sm text-muted-foreground">Order will be sent to the kitchen for <strong>Table {table.number}</strong>.</p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Tip: scan the QR on your table for table-side ordering.</p>
        )}

        {items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-muted-foreground">Your cart is empty.</p>
            <Link to="/menu" className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground hover:opacity-90">Browse menu</Link>
          </div>
        ) : (
          <>
            <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
              {items.map((i) => (
                <li key={i.id} className="flex items-center gap-3 p-4">
                  <div className="flex-1">
                    <div className="font-medium">{i.name}</div>
                    <div className="text-sm text-muted-foreground">{SITE.currency}{i.price.toFixed(0)} × {i.quantity}</div>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-primary text-primary-foreground">
                    <button onClick={() => setQty(i.id, i.quantity - 1)} className="p-2"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="min-w-6 text-center text-sm font-semibold">{i.quantity}</span>
                    <button onClick={() => setQty(i.id, i.quantity + 1)} className="p-2"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <button onClick={() => remove(i.id)} className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>

            <div className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display text-lg">Your details</h3>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent" />
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions?" rows={2} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent" />
            </div>

            <div className="mt-6 flex items-center justify-between rounded-2xl bg-primary p-5 text-primary-foreground">
              <div>
                <div className="text-xs uppercase tracking-widest text-accent">Total</div>
                <div className="font-display text-3xl">{SITE.currency}{subtotal.toFixed(0)}</div>
              </div>
              <button disabled={submitting} onClick={placeOrder} className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground disabled:opacity-60">
                {submitting ? "Placing…" : "Place order"}
              </button>
            </div>
          </>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
