
DROP POLICY IF EXISTS "anyone read order by id" ON public.orders;
DROP POLICY IF EXISTS "anyone read order items" ON public.order_items;

CREATE OR REPLACE FUNCTION public.enforce_order_item_price()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_price numeric; v_name text;
BEGIN
  IF NEW.menu_item_id IS NULL THEN RAISE EXCEPTION 'menu_item_id required'; END IF;
  IF NEW.quantity IS NULL OR NEW.quantity < 1 THEN RAISE EXCEPTION 'invalid quantity'; END IF;
  SELECT price, name INTO v_price, v_name FROM public.menu_items
    WHERE id = NEW.menu_item_id AND is_available = true;
  IF v_price IS NULL THEN RAISE EXCEPTION 'menu item not available'; END IF;
  NEW.price_snapshot := v_price;
  NEW.name_snapshot := v_name;
  NEW.line_total := v_price * NEW.quantity;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.enforce_order_item_price() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_enforce_order_item_price ON public.order_items;
CREATE TRIGGER trg_enforce_order_item_price
  BEFORE INSERT OR UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.enforce_order_item_price();

CREATE OR REPLACE FUNCTION public.recompute_order_totals()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_order uuid := COALESCE(NEW.order_id, OLD.order_id); v_sum numeric;
BEGIN
  SELECT COALESCE(SUM(line_total),0) INTO v_sum FROM public.order_items WHERE order_id = v_order;
  UPDATE public.orders SET subtotal = v_sum, total = v_sum, updated_at = now() WHERE id = v_order;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.recompute_order_totals() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_recompute_order_totals ON public.order_items;
CREATE TRIGGER trg_recompute_order_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.recompute_order_totals();

CREATE OR REPLACE FUNCTION public.get_order_by_id(_order_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'order', to_jsonb(o.*) - 'customer_phone' - 'notes',
    'items', COALESCE((SELECT jsonb_agg(to_jsonb(i.*) ORDER BY i.created_at)
                       FROM public.order_items i WHERE i.order_id = o.id), '[]'::jsonb)
  ) FROM public.orders o WHERE o.id = _order_id;
$$;
REVOKE ALL ON FUNCTION public.get_order_by_id(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_by_id(uuid) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.auto_grant_owner_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

DROP POLICY IF EXISTS "staff only realtime" ON realtime.messages;
CREATE POLICY "staff only realtime" ON realtime.messages
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'staff'::public.app_role));
