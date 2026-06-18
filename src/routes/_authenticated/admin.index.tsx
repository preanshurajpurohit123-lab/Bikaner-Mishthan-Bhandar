import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/lib/site";
import { statusHex, statusLabel } from "@/lib/order-status";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

type Range = "today" | "7d" | "30d";

type OrderRow = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  table_number: number | null;
};

type ItemRow = {
  name_snapshot: string;
  quantity: number;
  line_total: number;
  created_at: string;
};

const RANGE_LABEL: Record<Range, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
};



// Modern, balanced palette for the Top Selling chart (one colour per item).
const ITEM_COLORS = [
  "#6366f1", "#06b6d4", "#10b981", "#f59e0b",
  "#ec4899", "#8b5cf6", "#14b8a6", "#f97316",
];
const TOP_ACCENT = "hsl(var(--accent))";

function rangeStart(range: Range) {
  const d = new Date();
  if (range === "today") {
    d.setHours(0, 0, 0, 0);
  } else if (range === "7d") {
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
  } else {
    d.setDate(d.getDate() - 29);
    d.setHours(0, 0, 0, 0);
  }
  return d;
}

function Dashboard() {
  const [range, setRange] = useState<Range>("today");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [menuCount, setMenuCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const start = rangeStart(range).toISOString();
      const [ordersRes, itemsRes, activeRes, menuRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id,total,status,created_at,table_number")
          .gte("created_at", start)
          .order("created_at", { ascending: true }),
        supabase
          .from("order_items")
          .select("name_snapshot,quantity,line_total,created_at")
          .gte("created_at", start),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .in("status", ["pending", "accepted", "preparing", "ready"]),
        supabase.from("menu_items").select("id", { count: "exact", head: true }),
      ]);
      if (cancelled) return;
      setOrders((ordersRes.data as OrderRow[]) || []);
      setItems((itemsRes.data as ItemRow[]) || []);
      setActiveCount(activeRes.count || 0);
      setMenuCount(menuRes.count || 0);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [range]);

  const paid = useMemo(() => orders.filter((o) => o.status !== "cancelled"), [orders]);

  const totals = useMemo(() => {
    const revenue = paid.reduce((s, o) => s + Number(o.total), 0);
    const count = paid.length;
    const avg = count ? revenue / count : 0;
    const cancelled = orders.length - count;
    return { revenue, count, avg, cancelled };
  }, [orders, paid]);

  const series = useMemo(() => {
    if (range === "today") {
      const buckets = Array.from({ length: 24 }, (_, h) => ({
        label: `${h.toString().padStart(2, "0")}h`,
        revenue: 0,
        orders: 0,
      }));
      for (const o of paid) {
        const h = new Date(o.created_at).getHours();
        buckets[h].revenue += Number(o.total);
        buckets[h].orders += 1;
      }
      return buckets;
    }
    const days = range === "7d" ? 7 : 30;
    const start = rangeStart(range);
    const buckets = Array.from({ length: days }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return {
        key: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        revenue: 0,
        orders: 0,
      };
    });
    const idx = new Map(buckets.map((b, i) => [b.key, i]));
    for (const o of paid) {
      const k = o.created_at.slice(0, 10);
      const i = idx.get(k);
      if (i !== undefined) {
        buckets[i].revenue += Number(o.total);
        buckets[i].orders += 1;
      }
    }
    return buckets;
  }, [paid, range]);

  const topItems = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const it of items) {
      const cur = map.get(it.name_snapshot) || { name: it.name_snapshot, qty: 0, revenue: 0 };
      cur.qty += it.quantity;
      cur.revenue += Number(it.line_total);
      map.set(it.name_snapshot, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 8);
  }, [items]);

  const statusBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) map.set(o.status, (map.get(o.status) || 0) + 1);
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const peakHour = useMemo(() => {
    const hours = new Array(24).fill(0);
    for (const o of paid) hours[new Date(o.created_at).getHours()] += 1;
    let best = 0;
    for (let i = 1; i < 24; i++) if (hours[i] > hours[best]) best = i;
    return hours[best] > 0 ? `${best.toString().padStart(2, "0")}:00` : "—";
  }, [paid]);

  const tiles = [
    { label: `Revenue · ${RANGE_LABEL[range]}`, value: `${SITE.currency}${totals.revenue.toFixed(0)}` },
    { label: `Orders · ${RANGE_LABEL[range]}`, value: totals.count },
    { label: "Avg order value", value: `${SITE.currency}${totals.avg.toFixed(0)}` },
    { label: "Peak hour", value: peakHour },
    { label: "Active now", value: activeCount },
    { label: "Menu items", value: menuCount },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-primary">Sales analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? "Loading…" : `Live snapshot · ${RANGE_LABEL[range]}`}
          </p>
        </div>
        <div className="inline-flex rounded-full border border-border bg-card p-1">
          {(Object.keys(RANGE_LABEL) as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-widest transition ${
                range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {RANGE_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-border bg-card p-5">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{t.label}</div>
            <div className="mt-2 font-display text-2xl text-primary">{t.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg text-primary">Revenue trend</h2>
            <span className="text-xs text-muted-foreground">{RANGE_LABEL[range]}</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    color: "hsl(var(--popover-foreground))",
                  }}
                  formatter={(v: number, n) =>
                    n === "revenue" ? [`${SITE.currency}${v.toFixed(0)}`, "Revenue"] : [v, "Orders"]
                  }
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#rev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 font-display text-lg text-primary">Order status</h2>
          {statusBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    isAnimationActive
                    animationDuration={700}
                  >
                    {statusBreakdown.map((s) => (
                      <Cell key={s.name} fill={statusHex(s.name)} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 12,
                    }}
                    formatter={(v: number, _n, p: any) => [v, statusLabel(p?.payload?.name ?? "")]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {statusBreakdown.map((s) => (
                  <span key={s.name} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1">
                    <span className="h-2 w-2 rounded-full" style={{ background: statusHex(s.name) }} />
                    {statusLabel(s.name)} · {s.value}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-primary">Top selling items</h2>
          <span className="text-xs text-muted-foreground">By quantity · {RANGE_LABEL[range]}</span>
        </div>
        {topItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items sold yet in this range.</p>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topItems} layout="vertical" margin={{ left: 16, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={160}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    boxShadow: "0 8px 24px -12px rgba(0,0,0,0.25)",
                  }}
                  formatter={(v: number, _n, p: any) => [
                    `${v} sold · ${SITE.currency}${Number(p?.payload?.revenue ?? 0).toFixed(0)}`,
                    p?.payload?.name ?? "Item",
                  ]}
                />
                <Bar
                  dataKey="qty"
                  radius={[0, 8, 8, 0]}
                  isAnimationActive
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {topItems.map((it, i) => (
                    <Cell key={it.name} fill={i === 0 ? TOP_ACCENT : ITEM_COLORS[i % ITEM_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
