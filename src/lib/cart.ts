import { useEffect, useState, useCallback, useSyncExternalStore } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  is_veg: boolean;
};

const KEY = "bmb_cart_v1";
const TABLE_KEY = "bmb_table_v1";

type Listener = () => void;
const listeners = new Set<Listener>();
function emit() { listeners.forEach((l) => l()); }

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function write(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
  emit();
}

export function useCart() {
  const items = useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => JSON.stringify(read()),
    () => "[]",
  );
  const parsed: CartItem[] = JSON.parse(items);

  const add = useCallback((item: Omit<CartItem, "quantity">, qty = 1) => {
    const cur = read();
    const idx = cur.findIndex((i) => i.id === item.id);
    if (idx >= 0) cur[idx].quantity += qty;
    else cur.push({ ...item, quantity: qty });
    write(cur);
  }, []);
  const setQty = useCallback((id: string, qty: number) => {
    const cur = read().map((i) => (i.id === id ? { ...i, quantity: qty } : i)).filter((i) => i.quantity > 0);
    write(cur);
  }, []);
  const remove = useCallback((id: string) => { write(read().filter((i) => i.id !== id)); }, []);
  const clear = useCallback(() => write([]), []);
  const count = parsed.reduce((s, i) => s + i.quantity, 0);
  const subtotal = parsed.reduce((s, i) => s + i.quantity * i.price, 0);
  return { items: parsed, add, setQty, remove, clear, count, subtotal };
}

export function useActiveTable() {
  const [t, setT] = useState<{ id: string; number: number; token: string } | null>(null);
  useEffect(() => {
    try { setT(JSON.parse(localStorage.getItem(TABLE_KEY) || "null")); } catch { setT(null); }
  }, []);
  const setTable = useCallback((v: { id: string; number: number; token: string } | null) => {
    if (typeof window === "undefined") return;
    if (v) localStorage.setItem(TABLE_KEY, JSON.stringify(v));
    else localStorage.removeItem(TABLE_KEY);
    setT(v);
  }, []);
  return { table: t, setTable };
}

export function setActiveTable(v: { id: string; number: number; token: string }) {
  if (typeof window !== "undefined") localStorage.setItem(TABLE_KEY, JSON.stringify(v));
}
