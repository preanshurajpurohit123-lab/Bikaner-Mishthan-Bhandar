import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeCanvas } from "qrcode.react";
import { Printer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/tables")({
  component: TablesPage,
});

function TablesPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    supabase.from("restaurant_tables").select("*").order("table_number").then(({ data }) => setTables(data || []));
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-primary">Tables & QR Codes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Print and place these on each table — customers scan to order.</p>
        </div>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"><Printer className="h-4 w-4" /> Print all</button>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 print:grid-cols-3">
        {tables.map((t) => {
          const url = `${origin}/t/${t.qr_token}`;
          return (
            <div key={t.id} className="break-inside-avoid rounded-2xl border border-border bg-card p-4 text-center">
              <div className="font-display text-lg text-primary">Table {t.table_number}</div>
              <div className="mt-3 flex justify-center"><QRCodeCanvas value={url} size={160} fgColor="#5B1A1A" /></div>
              <div className="mt-2 break-all text-[10px] text-muted-foreground">{url}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
