// Shared helpers for admin charts & number formatting (Indian locale).

export const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  boxShadow: "0 8px 24px -12px rgba(0,0,0,0.25)",
  color: "hsl(var(--popover-foreground))",
  fontSize: 12,
} as const;

export const CHART_COLORS = [
  "#6366f1", "#06b6d4", "#10b981", "#f59e0b",
  "#ec4899", "#8b5cf6", "#14b8a6", "#f97316",
];

/**
 * Literal hex colours for SVG chart attributes (stroke/fill/stopColor):
 * CSS variables fall back to grey inside recharts' inline SVG in some builds.
 * Mirrors the theme: --primary #5B1A1A, --accent #C9A227, --border, --muted-foreground.
 */
export const CHART_HEX = {
  primary: "#5B1A1A",
  accent: "#C9A227",
  border: "#E3D9C2",
  axis: "#8A7A70",
  cursor: "rgba(226, 216, 196, 0.45)",
} as const;

/** ₹ with Indian digit grouping, e.g. ₹1,23,450 */
export function formatINR(v: number): string {
  return `₹${Math.round(v).toLocaleString("en-IN")}`;
}

/** Compact axis ticks: 1,23,450 → 1.2L / 4,500 → 4.5k */
export function compactNum(n: number): string {
  const a = Math.abs(n);
  if (a >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (a >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (a >= 1000) return `${(n / 1000).toFixed(a >= 10000 ? 0 : 1)}k`;
  return `${Math.round(n)}`;
}
