insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role from auth.users where email in ('preanshurajpurohit123@gmail.com')
on conflict (user_id, role) do nothing;

delete from public.user_roles ur using auth.users u where ur.user_id = u.id and u.email in ('owner@newbikaner.local','brocodeme313@gmail.com');