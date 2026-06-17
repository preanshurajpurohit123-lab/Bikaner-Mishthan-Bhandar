import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/lib/site";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/menu")({
  component: MenuAdmin,
});

function MenuAdmin() {
  const [cats, setCats] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [activeCat, setActiveCat] = useState<string>("");
  const [form, setForm] = useState({ name: "", price: "", is_veg: true });

  async function load() {
    const [c, i] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("menu_items").select("*").order("sort_order"),
    ]);
    setCats(c.data || []);
    setItems(i.data || []);
    if (!activeCat && c.data?.[0]) setActiveCat(c.data[0].id);
  }
  useEffect(() => { load(); }, []);

  async function addItem() {
    if (!form.name || !form.price || !activeCat) return;
    const { error } = await supabase.from("menu_items").insert({
      category_id: activeCat, name: form.name, price: Number(form.price), is_veg: form.is_veg,
    });
    if (error) return toast.error(error.message);
    setForm({ name: "", price: "", is_veg: true });
    toast.success("Item added");
    load();
  }
  async function toggle(id: string, field: "is_available" | "is_veg", v: boolean) {
    const { error } = await supabase.from("menu_items").update({ [field]: v }).eq("id", id);
    if (error) toast.error(error.message); else load();
  }
  async function del(id: string) {
    if (!confirm("Delete this item?")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  }

  const filtered = items.filter((i) => i.category_id === activeCat);

  return (
    <div>
      <h1 className="font-display text-3xl text-primary">Menu</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {cats.map((c) => (
          <button key={c.id} onClick={() => setActiveCat(c.id)} className={`rounded-full border px-3 py-1 text-sm ${activeCat === c.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>{c.name}</button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-4">
        <h3 className="font-display text-lg">Add item</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="rounded-md border border-border bg-background px-3 py-2 text-sm sm:col-span-2" />
          <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Price" type="number" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
          <button onClick={addItem} className="inline-flex items-center justify-center gap-1 rounded-md bg-primary py-2 text-sm text-primary-foreground"><Plus className="h-4 w-4" />Add</button>
        </div>
        <label className="mt-3 inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_veg} onChange={(e) => setForm({ ...form, is_veg: e.target.checked })} /> Veg
        </label>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Name</th><th className="p-3">Price</th><th className="p-3">Veg</th><th className="p-3">Available</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-t border-border">
                <td className="p-3 font-medium">{i.name}</td>
                <td className="p-3">{SITE.currency}{Number(i.price).toFixed(0)}</td>
                <td className="p-3"><input type="checkbox" checked={i.is_veg} onChange={(e) => toggle(i.id, "is_veg", e.target.checked)} /></td>
                <td className="p-3"><input type="checkbox" checked={i.is_available} onChange={(e) => toggle(i.id, "is_available", e.target.checked)} /></td>
                <td className="p-3 text-right"><button onClick={() => del(i.id)} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-destructive"><Trash2 className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
