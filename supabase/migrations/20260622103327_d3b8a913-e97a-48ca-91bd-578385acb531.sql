
-- 1. Replace public INSERT policies with strict ones (defense in depth alongside the new RPC).
DROP POLICY IF EXISTS "anyone can create order" ON public.orders;
DROP POLICY IF EXISTS "anyone insert order items" ON public.order_items;

-- 2. Atomic order creation RPC. SECURITY DEFINER bypasses RLS so we no longer need
--    public INSERT policies. Status is hardcoded to 'pending' here; price/name snapshots
--    are still enforced by the existing enforce_order_item_price trigger.
CREATE OR REPLACE FUNCTION public.create_order_with_items(
  _customer_name text,
  _customer_phone text,
  _notes text,
  _table_id uuid,
  _table_number int,
  _items jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_order_number int;
  v_item jsonb;
  v_clean_phone text;
BEGIN
  IF _customer_name IS NULL OR length(btrim(_customer_name)) = 0 THEN
    RAISE EXCEPTION 'customer_name required';
  END IF;

  v_clean_phone := NULLIF(btrim(COALESCE(_customer_phone, '')), '');
  IF v_clean_phone IS NOT NULL AND length(v_clean_phone) < 7 THEN
    RAISE EXCEPTION 'customer_phone invalid';
  END IF;

  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'items required';
  END IF;

  IF jsonb_array_length(_items) > 100 THEN
    RAISE EXCEPTION 'too many items';
  END IF;

  INSERT INTO public.orders (
    table_id, table_number, customer_name, customer_phone, notes,
    status, subtotal, total
  ) VALUES (
    _table_id, _table_number, btrim(_customer_name), v_clean_phone,
    NULLIF(btrim(COALESCE(_notes, '')), ''),
    'pending', 0, 0
  )
  RETURNING id, order_number INTO v_order_id, v_order_number;

  FOR v_item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    IF (v_item->>'menu_item_id') IS NULL OR (v_item->>'quantity') IS NULL THEN
      RAISE EXCEPTION 'invalid item entry';
    END IF;
    INSERT INTO public.order_items (order_id, menu_item_id, quantity)
    VALUES (
      v_order_id,
      (v_item->>'menu_item_id')::uuid,
      GREATEST(1, LEAST(99, (v_item->>'quantity')::int))
    );
  END LOOP;

  RETURN jsonb_build_object('id', v_order_id, 'order_number', v_order_number);
END $$;

REVOKE ALL ON FUNCTION public.create_order_with_items(text, text, text, uuid, int, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.create_order_with_items(text, text, text, uuid, int, jsonb) TO anon, authenticated;

-- 3. Ensure Realtime sends full rows so RLS filters orders/order_items correctly per subscriber.
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;
