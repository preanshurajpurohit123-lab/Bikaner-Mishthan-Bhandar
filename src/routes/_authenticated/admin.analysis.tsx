import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/lib/site";
import { CHART_COLORS, CHART_HEX, compactNum, formatINR, tooltipStyle } from "@/lib/admin-charts";

export const Route = createFileRoute("/_authenticated/admin/analysis")({
  component: Analysis,
});

type Period = "day" | "week" | "month";

type OrderRow = {
  id: string;
  total: number;
  status: string;
  created_at: string;
};

type ItemRow = {
  name_snapshot: string;
  quantity: number;
  line_total: number;
  created_at: string;
};

const PERIOD_LABEL: Record<Period, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
};

function periodStart(p: Period) {
  const d = new Date();
  if (p === "day") d.setHours(0, 0, 0, 0);
  else if (p === "week") {
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
  } else {
    d.setDate(d.getDate() - 29);
    d.setHours(0, 0, 0, 0);
  }
  return d;
}

function Analysis() {
  const [period, setPeriod] = useState<Period>("day");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [monthlyOrders, setMonthlyOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const start = periodStart(period).toISOString();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);
      const [ordersRes, itemsRes, monthlyRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id,total,status,created_at")
          .gte("created_at", start)
          .order("created_at", { ascending: true }),
        supabase
          .from("order_items")
          .select("name_snapshot,quantity,line_total,created_at")
          .gte("created_at", start),
        supabase
          .from("orders")
          .select("id,total,status,created_at")
          .gte("created_at", sixMonthsAgo.toISOString()),
      ]);
      if (cancelled) return;
      setOrders((ordersRes.data as OrderRow[]) || []);
      setItems((itemsRes.data as ItemRow[]) || []);
      setMonthlyOrders((monthlyRes.data as OrderRow[]) || []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [period]);

  const paid = useMemo(() => orders.filter((o) => o.status !== "cancelled"), [orders]);

  const totals = useMemo(() => {
    const revenue = paid.reduce((s, o) => s + Number(o.total), 0);
    const count = paid.length;
    return { revenue, count, avg: count ? revenue / count : 0 };
  }, [paid]);

  const series = useMemo(() => {
    if (period === "day") {
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
    const days = period === "week" ? 7 : 30;
    const start = periodStart(period);
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
  }, [paid, period]);

  const monthlySeries = useMemo(() => {
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      d.setDate(1);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      return {
        key,
        label: d.toLocaleDateString(undefined, { month: "short", year: "numeric" }),
        revenue: 0,
        orders: 0,
      };
    });
    const idx = new Map(buckets.map((b, i) => [b.key, i]));
    for (const o of monthlyOrders) {
      if (o.status === "cancelled") continue;
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      const i = idx.get(key);
      if (i !== undefined) {
        buckets[i].revenue += Number(o.total);
        buckets[i].orders += 1;
      }
    }
    return buckets;
  }, [monthlyOrders]);

  const itemSales = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const it of items) {
      const cur = map.get(it.name_snapshot) || { name: it.name_snapshot, qty: 0, revenue: 0 };
      cur.qty += it.quantity;
      cur.revenue += Number(it.line_total);
      map.set(it.name_snapshot, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [items]);

  const bestBucket = useMemo(() => {
    const best = [...series].sort((a, b) => b.revenue - a.revenue)[0];
    if (!best || best.revenue <= 0) return "—";
    return period === "day" ? `at ${best.label}` : best.label;
  }, [series, period]);

  const tiles = [
    { label: `Sale · ${PERIOD_LABEL[period]}`, value: formatINR(totals.revenue) },
    { label: `Orders · ${PERIOD_LABEL[period]}`, value: totals.count },
    { label: "Avg order value", value: formatINR(totals.avg) },
    { label: "Best time", value: bestBucket },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-primary">Sales analysis</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? "Loading…" : "Day, week & month breakdown · item-wise sale"}
          </p>
        </div>
        <div className="inline-flex rounded-full border border-border bg-card p-1">
          {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-widest transition ${
                period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {PERIOD_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{t.label}</div>
            <div className="mt-2 font-display text-2xl text-primary">{t.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-primary">Sale by {PERIOD_LABEL[period]}</h2>
          <span className="text-xs text-muted-foreground">
            {PERIOD_LABEL[period] === "Day" ? "Hourly revenue & orders" : "Daily revenue & orders"}
          </span>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            {period === "day" ? (
              <BarChart data={series} margin={{ top: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_HEX.border} vertical={false} />
                <XAxis dataKey="label" stroke={CHART_HEX.axis} fontSize={11} interval={1} />
                <YAxis
                  stroke={CHART_HEX.axis}
                  fontSize={11}
                  tickFormatter={(v: number) => compactNum(v)}
                  width={44}
                />
                <Tooltip
                  cursor={{ fill: CHART_HEX.cursor }}
                  contentStyle={tooltipStyle}
                  formatter={(v: number, n) =>
                    n === "revenue" ? [formatINR(v), "Sale"] : [v, "Orders"]
                  }
                />
                <Bar dataKey="revenue" fill={CHART_HEX.primary} radius={[8, 8, 0, 0]} maxBarSize={28} />
              </BarChart>
            ) : (
              <ComposedChart data={series} margin={{ top: 8, right: 8 }}>
                <defs>
                  <linearGradient id="periodRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_HEX.primary} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={CHART_HEX.primary} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_HEX.border} vertical={false} />
                <XAxis dataKey="label" stroke={CHART_HEX.axis} fontSize={11} interval="preserveStartEnd" />
                <YAxis
                  yAxisId="rev"
                  stroke={CHART_HEX.axis}
                  fontSize={11}
                  tickFormatter={(v: number) => compactNum(v)}
                  width={44}
                />
                <YAxis
                  yAxisId="ord"
                  orientation="right"
                  stroke={CHART_HEX.accent}
                  fontSize={11}
                  allowDecimals={false}
                  width={30}
                />
                <Tooltip
                  cursor={{ fill: CHART_HEX.cursor }}
                  contentStyle={tooltipStyle}
                  formatter={(v: number, n) =>
                    n === "revenue" ? [formatINR(v), "Sale"] : [v, "Orders"]
                  }
                />
                <Bar yAxisId="ord" dataKey="orders" fill={CHART_HEX.accent} opacity={0.35} radius={[6, 6, 0, 0]} maxBarSize={22} />
                <Area
                  yAxisId="rev"
                  type="monotone"
                  dataKey="revenue"
                  stroke={CHART_HEX.primary}
                  strokeWidth={2.5}
                  fill="url(#periodRev)"
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-primary">Monthly sale</h2>
          <span className="text-xs text-muted-foreground">Last 6 months</span>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlySeries} margin={{ top: 8, right: 8 }}>
              <defs>
                <linearGradient id="monthRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_HEX.accent} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={CHART_HEX.accent} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_HEX.border} vertical={false} />
              <XAxis dataKey="label" stroke={CHART_HEX.axis} fontSize={11} />
              <YAxis
                yAxisId="rev"
                stroke={CHART_HEX.axis}
                fontSize={11}
                tickFormatter={(v: number) => compactNum(v)}
                width={44}
              />
              <YAxis yAxisId="ord" orientation="right" stroke={CHART_HEX.axis} fontSize={11} allowDecimals={false} width={30} />
              <Tooltip
                cursor={{ fill: CHART_HEX.cursor }}
                contentStyle={tooltipStyle}
                formatter={(v: number, n) =>
                  n === "revenue" ? [formatINR(v), "Sale"] : [v, "Orders"]
                }
              />
              <Bar yAxisId="ord" dataKey="orders" fill={CHART_HEX.axis} opacity={0.3} radius={[6, 6, 0, 0]} maxBarSize={26} />
              <Area
                yAxisId="rev"
                type="monotone"
                dataKey="revenue"
                stroke={CHART_HEX.accent}
                strokeWidth={2.5}
                fill="url(#monthRev)"
                dot={{ r: 4, fill: CHART_HEX.accent }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-primary">Item-wise sale</h2>
          <span className="text-xs text-muted-foreground">Top 10 · {PERIOD_LABEL[period]}</span>
        </div>
        {itemSales.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items sold yet in this period.</p>
        ) : (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={itemSales} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_HEX.border} horizontal={false} />
                <XAxis
                  type="number"
                  stroke={CHART_HEX.axis}
                  fontSize={11}
                  tickFormatter={(v: number) => compactNum(v)}
                />
                <YAxis type="category" dataKey="name" width={170} stroke={CHART_HEX.axis} fontSize={11} />
                <Tooltip
                  cursor={{ fill: CHART_HEX.cursor }}
                  contentStyle={tooltipStyle}
                  formatter={(v: number, _n, p: any) => [
                    `${formatINR(v)} · ${Number(p?.payload?.qty ?? 0)} sold`,
                    p?.payload?.name ?? "Item",
                  ]}
                />
                <Bar dataKey="revenue" radius={[0, 8, 8, 0]} maxBarSize={26}>
                  {itemSales.map((it, i) => (
                    <Cell key={it.name} fill={i === 0 ? CHART_HEX.accent : CHART_COLORS[(i - 1) % CHART_COLORS.length]} />
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
