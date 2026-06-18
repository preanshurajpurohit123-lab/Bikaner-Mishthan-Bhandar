import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useCart, useActiveTable } from "@/lib/cart";
import { SITE } from "@/lib/site";
import {
  Minus,
  Plus,
  Trash2,
  Wallet,
  Smartphone,
  CreditCard,
  Building2,
  Banknote,
  ArrowLeft,
  Check,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: `Your Cart · ${SITE.name}` }] }),
  component: CartPage,
});

type PayMethod = "cod" | "upi" | "card" | "netbanking" | "wallet";

const PAY_METHODS: { id: PayMethod; label: string; desc: string; Icon: any }[] = [
  { id: "cod", label: "Cash on Delivery", desc: "Pay when your order arrives", Icon: Banknote },
  { id: "upi", label: "UPI", desc: "GPay · PhonePe · Paytm", Icon: Smartphone },
  { id: "card", label: "Credit / Debit Card", desc: "Visa, Mastercard, RuPay", Icon: CreditCard },
  { id: "netbanking", label: "Net Banking", desc: "All major banks", Icon: Building2 },
  { id: "wallet", label: "Wallet", desc: "Paytm, Amazon Pay, more", Icon: Wallet },
];

type Step = "review" | "payment";

function CartPage() {
  const { items, setQty, remove, subtotal, clear } = useCart();
  const { table } = useActiveTable();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<Step>("review");
  const [pay, setPay] = useState<PayMethod>("cod");
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [upi, setUpi] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  function goToPayment() {
    if (items.length === 0) return;
    if (!table && !name.trim()) {
      toast.error("Please enter your name (or scan your table QR).");
      return;
    }
    setStep("payment");
  }

  function paymentValid() {
    if (pay === "card") {
      return card.number.replace(/\s/g, "").length >= 12 && card.expiry.length >= 4 && card.cvv.length >= 3 && card.name.trim().length > 1;
    }
    if (pay === "upi") return /.+@.+/.test(upi.trim());
    return true;
  }

  async function placeOrder() {
    if (!paymentValid()) {
      toast.error("Please complete your payment details.");
      return;
    }
    setSubmitting(true);
    try {
      const payTag = `[Payment: ${PAY_METHODS.find((p) => p.id === pay)?.label}]`;
      const composedNotes = [payTag, notes.trim()].filter(Boolean).join(" ");
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          table_id: table?.id ?? null,
          table_number: table?.number ?? null,
          customer_name: name.trim() || null,
          customer_phone: phone.trim() || null,
          notes: composedNotes || null,
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
      navigate({ to: "/order/$id", params: { id: order.id }, search: { placed: 1 } as any });
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
        {/* Stepper */}
        <div className="mb-6 flex items-center gap-2 text-xs font-medium uppercase tracking-widest">
          <span className={step === "review" ? "text-primary" : "text-muted-foreground"}>1. Review</span>
          <span className="text-muted-foreground">→</span>
          <span className={step === "payment" ? "text-primary" : "text-muted-foreground"}>2. Payment</span>
        </div>

        {step === "review" && (
          <>
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
                        <div className="text-sm text-muted-foreground">{SITE.currency}{i.price.toFixed(0)} × {i.quantity} = {SITE.currency}{(i.price * i.quantity).toFixed(0)}</div>
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
                  <button onClick={goToPayment} className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90">
                    Continue to payment →
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {step === "payment" && (
          <>
            <button
              onClick={() => setStep("review")}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> Back to cart
            </button>
            <h1 className="mt-2 font-display text-4xl text-primary">Choose payment</h1>
            <p className="mt-1 text-sm text-muted-foreground">Total payable <span className="font-semibold text-primary">{SITE.currency}{subtotal.toFixed(0)}</span></p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {PAY_METHODS.map((m) => {
                const active = pay === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setPay(m.id)}
                    className={`group relative flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                      active ? "border-accent bg-accent/10 ring-2 ring-accent" : "border-border bg-card hover:border-accent/60"
                    }`}
                  >
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full ${active ? "bg-accent text-accent-foreground" : "bg-muted text-primary"}`}>
                      <m.Icon className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold text-primary">{m.label}</div>
                      <div className="text-xs text-muted-foreground">{m.desc}</div>
                    </div>
                    {active && (
                      <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {pay === "card" && (
              <div className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-5">
                <h3 className="font-display text-lg">Card details</h3>
                <input
                  value={card.number}
                  onChange={(e) => setCard({ ...card, number: e.target.value.replace(/[^\d ]/g, "").slice(0, 19) })}
                  placeholder="Card number"
                  inputMode="numeric"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={card.expiry}
                    onChange={(e) => setCard({ ...card, expiry: e.target.value.replace(/[^\d/]/g, "").slice(0, 5) })}
                    placeholder="MM/YY"
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                  <input
                    value={card.cvv}
                    onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    placeholder="CVV"
                    inputMode="numeric"
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                </div>
                <input
                  value={card.name}
                  onChange={(e) => setCard({ ...card, name: e.target.value })}
                  placeholder="Name on card"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </div>
            )}

            {pay === "upi" && (
              <div className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-5">
                <h3 className="font-display text-lg">UPI</h3>
                <input
                  value={upi}
                  onChange={(e) => setUpi(e.target.value)}
                  placeholder="yourname@upi"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                />
                <p className="text-xs text-muted-foreground">You'll get a collect request on your UPI app.</p>
              </div>
            )}

            {pay === "cod" && (
              <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
                No payment needed now. Please keep exact change ready.
              </div>
            )}

            {(pay === "netbanking" || pay === "wallet") && (
              <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
                You'll be redirected to complete the payment securely.
              </div>
            )}

            <div className="mt-6 flex items-center justify-between rounded-2xl bg-primary p-5 text-primary-foreground">
              <div>
                <div className="text-xs uppercase tracking-widest text-accent">Total</div>
                <div className="font-display text-3xl">{SITE.currency}{subtotal.toFixed(0)}</div>
              </div>
              <button
                disabled={submitting || !paymentValid()}
                onClick={placeOrder}
                className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground disabled:opacity-60"
              >
                {submitting ? "Placing…" : "Continue"}
              </button>
            </div>
          </>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
