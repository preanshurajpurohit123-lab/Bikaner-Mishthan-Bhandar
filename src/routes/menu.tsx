import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VegMark } from "@/components/veg-mark";
import { supabase } from "@/integrations/supabase/client";
import { useCart, useActiveTable } from "@/lib/cart";
import { SITE } from "@/lib/site";
import { Plus, Minus, Search } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: `Menu · ${SITE.name}` },
      { name: "description", content: `Full menu — sweets, chaat, dosa, pizza, burger, momos, shakes. Prices in INR.` },
    ],
  }),
  component: MenuPage,
});

type Item = { id: string; category_id: string; name: string; description: string | null; price: number; is_veg: boolean; is_available: boolean; sort_order: number };
type Cat = { id: string; name: string; slug: string; sort_order: number };

function MenuPage() {
  const { data, isError, refetch, isFetching } = useQuery({
    queryKey: ["menu"],
    queryFn: async () => {
      const [cats, items] = await Promise.all([
        supabase.from("categories").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("menu_items").select("*").eq("is_available", true).order("sort_order"),
      ]);
      if (cats.error) throw cats.error;
      if (items.error) throw items.error;
      return { categories: cats.data as Cat[], items: items.data as Item[] };
    },
    retry: 2,
    staleTime: 60_000,
  });
  const { table } = useActiveTable();
  const [q, setQ] = useState("");
  const [activeCat, setActiveCat] = useState<string | "all">("all");

  const grouped = useMemo(() => {
    if (!data) return [];
    const ql = q.trim().toLowerCase();
    return data.categories
      .filter((c) => activeCat === "all" || c.id === activeCat)
      .map((c) => ({
        cat: c,
        items: data.items.filter((i) => i.category_id === c.id && (!ql || i.name.toLowerCase().includes(ql))),
      }))
      .filter((g) => g.items.length > 0);
  }, [data, q, activeCat]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-6">
        {table && (
          <div className="mb-4 rounded-full border border-accent/50 bg-accent/15 px-4 py-2 text-sm text-primary">
            Ordering for <strong>Table {table.number}</strong> — items go straight to the kitchen on checkout.
          </div>
        )}
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Our menu</p>
        <h1 className="mt-2 font-display text-4xl text-primary md:text-5xl">Made fresh, every order</h1>
        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dishes…" className="w-full rounded-full border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-accent" />
          </div>
        </div>
        {data && (
          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
            <Chip active={activeCat === "all"} onClick={() => setActiveCat("all")}>All</Chip>
            {data.categories.map((c) => (
              <Chip key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)}>{c.name}</Chip>
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-32">
        {!data && <div className="py-20 text-center text-muted-foreground">Loading menu…</div>}
        {grouped.map((g) => (
          <section key={g.cat.id} className="mt-10">
            <h2 className="font-display text-2xl text-primary">{g.cat.name}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {g.items.map((i) => <MenuRow key={i.id} item={i} />)}
            </div>
          </section>
        ))}
      </div>

      <CartBar />
      <SiteFooter />
    </div>
  );
}

function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-accent"}`}>{children}</button>
  );
}

function MenuRow({ item }: { item: Item }) {
  const { items, add, setQty } = useCart();
  const existing = items.find((i) => i.id === item.id);
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-accent/60 hover:shadow-sm">
      <div className="flex-1">
        <div className="flex items-center gap-2"><VegMark veg={item.is_veg} /><h3 className="font-medium">{item.name}</h3></div>
        {item.description && <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>}
        <div className="mt-2 font-display text-lg text-primary">{SITE.currency}{Number(item.price).toFixed(0)}</div>
      </div>
      {existing ? (
        <div className="flex items-center gap-1 rounded-full bg-primary text-primary-foreground">
          <button onClick={() => setQty(item.id, existing.quantity - 1)} className="p-2"><Minus className="h-3.5 w-3.5" /></button>
          <span className="min-w-6 text-center text-sm font-semibold">{existing.quantity}</span>
          <button onClick={() => setQty(item.id, existing.quantity + 1)} className="p-2"><Plus className="h-3.5 w-3.5" /></button>
        </div>
      ) : (
        <button onClick={() => add({ id: item.id, name: item.name, price: Number(item.price), is_veg: item.is_veg })} className="inline-flex items-center gap-1 rounded-full border border-accent bg-accent/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-accent hover:text-accent-foreground">
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      )}
    </div>
  );
}

function CartBar() {
  const { count, subtotal } = useCart();
  if (count === 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-4 z-40 px-4">
      <Link to="/cart" className="mx-auto flex max-w-md items-center justify-between rounded-full bg-primary px-5 py-3 text-primary-foreground shadow-2xl shadow-black/30">
        <span className="text-sm">{count} item{count > 1 ? "s" : ""} · {SITE.currency}{subtotal.toFixed(0)}</span>
        <span className="text-sm font-semibold">View cart →</span>
      </Link>
    </div>
  );
}
