// Centralised status palette for order badges across cards, tables and filters.
// Tailwind colour utilities are intentional here (status traffic-light system),
// not theme tokens — they map 1:1 to a real-world delivery status meaning.

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "served"
  | "completed"
  | "cancelled";

export const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Out for delivery",
  served: "Delivered",
  completed: "Delivered",
  cancelled: "Cancelled",
};

// Solid hex used by chart Cells (pie / status legend).
export const STATUS_HEX: Record<string, string> = {
  pending: "#eab308",     // yellow-500
  accepted: "#f59e0b",    // amber-500
  preparing: "#3b82f6",   // blue-500
  ready: "#f97316",       // orange-500 (out for delivery)
  served: "#22c55e",      // green-500 (delivered)
  completed: "#16a34a",   // green-600
  cancelled: "#ef4444",   // red-500
};

// Rounded pill classes — consistent across cards / tables / filter chips.
export const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-300",
  accepted: "bg-amber-100 text-amber-800 ring-1 ring-amber-300",
  preparing: "bg-blue-100 text-blue-800 ring-1 ring-blue-300",
  ready: "bg-orange-100 text-orange-800 ring-1 ring-orange-300",
  served: "bg-green-100 text-green-800 ring-1 ring-green-300",
  completed: "bg-green-100 text-green-800 ring-1 ring-green-300",
  cancelled: "bg-red-100 text-red-700 ring-1 ring-red-300",
};

// Active (selected) state for filter chips.
export const STATUS_BADGE_ACTIVE: Record<string, string> = {
  pending: "bg-yellow-500 text-white ring-1 ring-yellow-500",
  accepted: "bg-amber-500 text-white ring-1 ring-amber-500",
  preparing: "bg-blue-500 text-white ring-1 ring-blue-500",
  ready: "bg-orange-500 text-white ring-1 ring-orange-500",
  served: "bg-green-500 text-white ring-1 ring-green-500",
  completed: "bg-green-600 text-white ring-1 ring-green-600",
  cancelled: "bg-red-500 text-white ring-1 ring-red-500",
};

export function statusBadgeClass(status: string, active = false) {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize";
  const tone = active
    ? STATUS_BADGE_ACTIVE[status] ?? "bg-primary text-primary-foreground"
    : STATUS_BADGE[status] ?? "bg-muted text-muted-foreground ring-1 ring-border";
  return `${base} ${tone}`;
}

export function statusLabel(status: string) {
  return STATUS_LABEL[status] ?? status;
}

export function statusHex(status: string) {
  return STATUS_HEX[status] ?? "#64748b";
}
