DROP POLICY IF EXISTS "anyone insert order items" ON public.order_items;

CREATE POLICY "anyone insert order items" ON public.order_items
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    order_id IS NOT NULL
    AND menu_item_id IS NOT NULL
    AND quantity IS NOT NULL
    AND quantity > 0
  );