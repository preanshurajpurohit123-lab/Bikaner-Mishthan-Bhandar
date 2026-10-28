import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/lib/site";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/menu")({
  component: MenuAdmin,
});

const emptyForm = { name: "", price: "", is_veg: true, description: "", category_id: "" };

function slugify(name: string) {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9\u0900-\u097F]+/g, "-").replace(/^-+|-+$/g, "");
  return base || `cat-${Date.now()}`;
}

function MenuAdmin() {
  const [cats, setCats] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [activeCat, setActiveCat] = useState<string>("");
  const [form, setForm] = useState({ name: "", price: "" });
  const [editing, setEditing] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [catEditOpen, setCatEditOpen] = useState(false);

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
      category_id: activeCat, name: form.name, price: Number(form.price),
    });
    if (error) return toast.error(error.message);
    setForm({ name: "", price: "" });
    toast.success("Item added");
    load();
  }

  function openEdit(item: any) {
    setEditing(item);
    setEditForm({
      name: item.name ?? "",
      price: String(item.price ?? ""),
      description: item.description ?? "",
      is_veg: !!item.is_veg,
      is_available: !!item.is_available,
      category_id: item.category_id ?? "",
    });
  }

  async function saveEdit() {
    if (!editing) return;
    if (!editForm.name || !editForm.price || !editForm.category_id) {
      toast.error("Name, price and category are required");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("menu_items")
      .update({
        name: editForm.name,
        price: Number(editForm.price),
        description: editForm.description || null,
        is_veg: editForm.is_veg,
        is_available: editForm.is_available,
        category_id: editForm.category_id,
      })
      .eq("id", editing.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Item updated");
    setEditing(null);
    load();
  }

  async function toggle(id: string, field: "is_available", v: boolean) {
    const patch: any = { [field]: v };
    const { error } = await supabase.from("menu_items").update(patch).eq("id", id);
    if (error) toast.error(error.message); else load();
  }
  async function del(id: string) {
    if (!confirm("Delete this item?")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  }

  async function addCategory() {
    const name = newCatName.trim();
    if (!name) return toast.error("Enter a category name");
    const { data, error } = await supabase
      .from("categories")
      .insert({ name, slug: slugify(name), sort_order: cats.length })
      .select("id, name")
      .single();
    if (error) return toast.error(error.message);
    setNewCatName("");
    toast.success("Category added");
    await load();
    if (data) setActiveCat(data.id);
  }

  async function renameCategory(cat: any) {
    const name = prompt("Rename category", cat.name);
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed === cat.name) return;
    const { error } = await supabase.from("categories").update({ name: trimmed, slug: slugify(trimmed) }).eq("id", cat.id);
    if (error) return toast.error(error.message);
    toast.success("Category updated");
    load();
  }

  async function delCategory(cat: any) {
    const count = items.filter((i) => i.category_id === cat.id).length;
    if (count > 0) {
      toast.error(`Move or delete the ${count} item(s) in this category first`);
      return;
    }
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", cat.id);
    if (error) return toast.error(error.message);
    toast.success("Category deleted");
    if (activeCat === cat.id) setActiveCat("");
    load();
  }

  const filtered = items.filter((i) => i.category_id === activeCat);

  return (
    <div>
      <h1 className="font-display text-3xl text-primary">Menu</h1>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {cats.map((c) => {
          const isActive = activeCat === c.id;
          return (
            <span key={c.id} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm ${isActive ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
              <button onClick={() => { if (isActive) setCatEditOpen((v) => !v); else { setActiveCat(c.id); setCatEditOpen(false); } }}>{c.name}</button>
              {isActive && catEditOpen && (
                <>
                  <button onClick={() => renameCategory(c)} aria-label={`Rename ${c.name}`} title="Rename category" className="rounded p-0.5 opacity-70 hover:opacity-100"><Pencil className="h-3 w-3" /></button>
                  <button onClick={() => delCategory(c)} aria-label={`Delete ${c.name}`} title="Delete category" className="rounded p-0.5 opacity-70 hover:opacity-100"><Trash2 className="h-3 w-3" /></button>
                </>
              )}
            </span>
          );
        })}
      </div>

      <div className="mt-3 rounded-2xl border border-border bg-card p-4">
        <h3 className="font-display text-lg">Add category</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCategory()} placeholder="Category name" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
          <button onClick={addCategory} className="inline-flex items-center justify-center gap-1 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"><Plus className="h-4 w-4" />Add category</button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-4">
        <h3 className="font-display text-lg">Add item</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="rounded-md border border-border bg-background px-3 py-2 text-sm sm:col-span-2" />
          <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Price" type="number" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
          <button onClick={addItem} className="inline-flex items-center justify-center gap-1 rounded-md bg-primary py-2 text-sm text-primary-foreground"><Plus className="h-4 w-4" />Add</button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Name</th><th className="p-3">Price</th><th className="p-3">Available</th><th className="p-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-t border-border">
                <td className="p-3 font-medium">
                  {i.name}
                  {i.description ? <div className="text-xs font-normal text-muted-foreground">{i.description}</div> : null}
                </td>
                <td className="p-3">{SITE.currency}{Number(i.price).toFixed(0)}</td>
                <td className="p-3"><input type="checkbox" checked={i.is_available} onChange={(e) => toggle(i.id, "is_available", e.target.checked)} /></td>
                <td className="p-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button onClick={() => openEdit(i)} aria-label={`Edit ${i.name}`} title="Edit item" className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-primary"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => del(i.id)} aria-label={`Delete ${i.name}`} title="Delete item" className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg text-primary">Edit item</h3>
              <button onClick={() => setEditing(null)} aria-label="Close editor" className="rounded-md p-1 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 grid gap-3">
              <label className="text-sm">
                <span className="mb-1 block text-muted-foreground">Name</span>
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted-foreground">Price ({SITE.currency})</span>
                <input value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} type="number" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted-foreground">Description</span>
                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted-foreground">Category</span>
                <select value={editForm.category_id} onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <div className="flex gap-6 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={editForm.is_available} onChange={(e) => setEditForm({ ...editForm, is_available: e.target.checked })} /> Available
                </label>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-full border border-border px-4 py-2 text-sm hover:bg-muted">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground disabled:opacity-60">{saving ? "Saving…" : "Save changes"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
