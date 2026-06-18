
-- Allow anon (and authenticated) to read an order by id so customer can view their order page,
-- and so the insert .select() returning row works without service role.
CREATE POLICY "anyone read order by id"
  ON public.orders FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "anyone read order items"
  ON public.order_items FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.orders TO anon;
GRANT SELECT ON public.order_items TO anon;
