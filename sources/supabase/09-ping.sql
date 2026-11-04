-- Ping public pour garder le projet actif (ne renvoie que 'ok', aucune donnée)
create or replace function public.pp_ping() returns text language sql stable as $$ select 'ok'::text $$;
revoke all on function public.pp_ping() from public;
grant execute on function public.pp_ping() to anon, authenticated;
