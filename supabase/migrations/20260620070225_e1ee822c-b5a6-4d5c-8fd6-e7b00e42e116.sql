DROP POLICY IF EXISTS "anyone can create order" ON public.orders;

CREATE POLICY "anyone can create order" ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    customer_name IS NOT NULL
    AND length(btrim(customer_name)) > 0
    AND (
      customer_phone IS NULL
      OR length(btrim(customer_phone)) = 0
      OR length(btrim(customer_phone)) >= 7
    )
  );