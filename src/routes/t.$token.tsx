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
        .rpc("resolve_table_by_token", { _token: token });
      const row = Array.isArray(data) ? data[0] : null;
      if (error || !row) {
        navigate({ to: "/menu" });
        return;
      }
      setActiveTable({ id: row.id, number: row.table_number, token: row.qr_token });
      navigate({ to: "/menu" });
    })();
  }, [token, navigate]);
  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      Loading your table…
    </div>
  );
}
