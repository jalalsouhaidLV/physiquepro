-- =====================================================================
--  PhysiquePro · étape 37 : notifications push sur téléphone (Web Push)
--  11/11/2026. Quand le prof rend une note, la fonction Supabase « pp-push »
--  envoie une notification aux téléphones (et ordinateurs) que l'élève a activés.
--
--  - pp_push_abonnements : un appareil abonné par ligne (adresse fournie par le
--    navigateur). Aucun droit direct pour anon ni authenticated : on passe par
--    pp_push_abonner / pp_push_desabonner (chacun ne touche que son appareil).
--  - pp_push_cles : la paire de clés VAPID, créée une seule fois par la fonction
--    Supabase elle-même. Lisible seulement par le rôle service (jamais par le site).
-- =====================================================================
begin;

create table if not exists public.pp_push_abonnements (
  id        bigint generated always as identity primary key,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  email     text not null,
  endpoint  text not null unique,
  p256dh    text not null,
  auth      text not null,
  appareil  text not null default '',
  cree_le   timestamptz not null default now()
);
create index if not exists pp_push_abonnements_email_idx on public.pp_push_abonnements(email);
create index if not exists pp_push_abonnements_user_idx  on public.pp_push_abonnements(user_id);
alter table public.pp_push_abonnements enable row level security;
revoke all on public.pp_push_abonnements from public, anon, authenticated;
-- lecture de ses propres appareils (pour afficher « activé sur cet appareil »)
grant select on public.pp_push_abonnements to authenticated;
create policy push_lecture on public.pp_push_abonnements for select to authenticated using (user_id = (select auth.uid()));

create table if not exists public.pp_push_cles (
  id        int primary key default 1 check (id = 1),
  publique  text not null,
  privee    text not null,
  cree_le   timestamptz not null default now()
);
alter table public.pp_push_cles enable row level security;
revoke all on public.pp_push_cles from public, anon, authenticated;
-- aucune règle RLS : seul le rôle service (la fonction Supabase) y accède

-- abonner cet appareil (remplace un ancien abonnement du même appareil, même d'un autre compte)
create or replace function public.pp_push_abonner(p_endpoint text, p_p256dh text, p_auth text, p_appareil text default '')
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  if p_endpoint !~ '^https://' or length(p_endpoint) > 1000 or length(p_p256dh) > 200 or length(p_auth) > 100 then raise exception 'abonnement invalide'; end if;
  delete from public.pp_push_abonnements where endpoint = p_endpoint;
  insert into public.pp_push_abonnements (user_id, email, endpoint, p256dh, auth, appareil)
  values (auth.uid(), public.mon_email(), p_endpoint, p_p256dh, p_auth, left(coalesce(p_appareil, ''), 120));
end $$;

create or replace function public.pp_push_desabonner(p_endpoint text)
returns void language sql security definer set search_path = '' as $$
  delete from public.pp_push_abonnements where endpoint = p_endpoint and user_id = auth.uid();
$$;

revoke all on function public.pp_push_abonner(text, text, text, text) from public, anon;
revoke all on function public.pp_push_desabonner(text) from public, anon;
grant execute on function public.pp_push_abonner(text, text, text, text) to authenticated;
grant execute on function public.pp_push_desabonner(text) to authenticated;

commit;
