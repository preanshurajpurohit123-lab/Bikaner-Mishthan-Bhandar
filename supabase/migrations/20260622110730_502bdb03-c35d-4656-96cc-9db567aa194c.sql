INSERT INTO public.user_roles (user_id, role) VALUES ('44acf81a-139b-46de-984a-a43cef539997','admin') ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.auto_grant_owner_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email = 'bikaner1985@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $function$;