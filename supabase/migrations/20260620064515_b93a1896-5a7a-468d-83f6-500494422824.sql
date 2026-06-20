
-- 1. Restrict restaurant_tables: drop public SELECT (qr_token leak)
DROP POLICY IF EXISTS "tables public read" ON public.restaurant_tables;

-- Safe RPC: resolve an active table by its QR token, returning only non-sensitive fields
CREATE OR REPLACE FUNCTION public.resolve_table_by_token(_token text)
RETURNS TABLE(id uuid, table_number int, qr_token text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id, t.table_number, t.qr_token
  FROM public.restaurant_tables t
  WHERE t.qr_token = _token AND t.is_active = true
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.resolve_table_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_table_by_token(text) TO anon, authenticated;

-- 2. Replace permissive WITH CHECK (true) policies with sane checks
DROP POLICY IF EXISTS "anyone can create order" ON public.orders;
CREATE POLICY "anyone can create order" ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    customer_name IS NOT NULL
    AND length(btrim(customer_name)) > 0
    AND customer_phone IS NOT NULL
    AND length(btrim(customer_phone)) >= 7
  );

DROP POLICY IF EXISTS "anyone insert order items" ON public.order_items;
CREATE POLICY "anyone insert order items" ON public.order_items
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    order_id IS NOT NULL
    AND menu_item_id IS NOT NULL
    AND quantity IS NOT NULL AND quantity > 0
    AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id)
  );

-- 3. Revoke EXECUTE on has_role from authenticated (RLS still works as table owner runs policies)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
