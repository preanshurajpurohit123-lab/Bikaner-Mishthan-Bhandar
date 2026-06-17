import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { setActiveTable } from "@/lib/cart";

export const Route = createFileRoute("/t/$token")({
  component: TableRedirect,
});

function TableRedirect() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("restaurant_tables")
        .select("id, table_number, qr_token, is_active")
        .eq("qr_token", token)
        .maybeSingle();
      if (error || !data || !data.is_active) {
        navigate({ to: "/menu" });
        return;
      }
      setActiveTable({ id: data.id, number: data.table_number, token: data.qr_token });
      navigate({ to: "/menu" });
    })();
  }, [token, navigate]);
  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      Loading your table…
    </div>
  );
}
