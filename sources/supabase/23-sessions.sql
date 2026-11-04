-- =====================================================================
--  PhysiquePro · étape 23 : sessions ouvertes, liste des personnes en ligne
--  et déconnexion à distance par le professeur (ordinateurs du lycée)
-- =====================================================================
create table if not exists public.sessions_ouvertes (
  id          uuid primary key,                       -- identifiant tiré au hasard par le navigateur
  user_id     uuid not null references auth.users(id) on delete cascade,
  appareil    text,
  debut       timestamptz not null default now(),
  vu_le       timestamptz not null default now(),
  visible     boolean not null default true,
  deconnecter boolean not null default false
);
create index if not exists sessions_ouvertes_vu on public.sessions_ouvertes(vu_le);
alter table public.sessions_ouvertes enable row level security;   -- aucun accès direct : uniquement par les fonctions ci-dessous
revoke all on public.sessions_ouvertes from anon, authenticated;

-- appelée par chaque navigateur connecté (au démarrage puis toutes les 30 s)
-- renvoie true si le professeur a demandé la déconnexion de ce navigateur
create or replace function public.pp_presence(p_session uuid, p_appareil text, p_visible boolean) returns boolean
language plpgsql security definer set search_path = public as $$
declare d boolean;
begin
  if auth.uid() is null then return false; end if;
  select deconnecter into d from public.sessions_ouvertes where id = p_session and user_id = auth.uid();
  if d then delete from public.sessions_ouvertes where id = p_session; return true; end if;
  insert into public.sessions_ouvertes (id, user_id, appareil, visible) values (p_session, auth.uid(), left(p_appareil, 80), p_visible)
    on conflict (id) do update set vu_le = now(), visible = excluded.visible, appareil = excluded.appareil
    where public.sessions_ouvertes.user_id = auth.uid();
  if p_visible then perform public.pp_visite(); end if;
  delete from public.sessions_ouvertes where vu_le < now() - interval '7 days';
  return false;
end $$;
revoke all on function public.pp_presence(uuid, text, boolean) from public, anon;
grant execute on function public.pp_presence(uuid, text, boolean) to authenticated;

-- déconnexion normale : on retire la session de la liste
create or replace function public.pp_fin_session(p_session uuid) returns void
language sql security definer set search_path = public as $$
  delete from public.sessions_ouvertes where id = p_session and user_id = auth.uid();
$$;
revoke all on function public.pp_fin_session(uuid) from public, anon;
grant execute on function public.pp_fin_session(uuid) to authenticated;

-- liste pour le professeur : sessions vues depuis 18 h (en ligne = vue depuis moins de 3 min)
create or replace function public.pp_sessions() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.est_prof() then raise exception 'Réservé au professeur.'; end if;
  return coalesce((select json_agg(x order by x.en_ligne desc, x.nom) from (
    select s.id, s.appareil, s.debut, s.vu_le, s.visible, s.deconnecter, s.user_id = auth.uid() as moi,
           s.vu_le > now() - interval '3 minutes' as en_ligne, p.role, p.email,
           coalesce((select i.nom from public.inscriptions i where i.email = p.email limit 1), p.nom, p.email) as nom,
           (select string_agg(c.nom, ' · ' order by c.ordre) from public.inscriptions i join public.classes c on c.id = i.classe_id where i.email = p.email) as classes
      from public.sessions_ouvertes s join public.profiles p on p.id = s.user_id
     where s.vu_le > now() - interval '18 hours') x), '[]'::json);
end $$;
revoke all on function public.pp_sessions() from public, anon;
grant execute on function public.pp_sessions() to authenticated;

-- déconnecter une session précise, ou toutes les sessions des élèves (p_session null)
create or replace function public.pp_deconnecter(p_session uuid) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.est_prof() then raise exception 'Réservé au professeur.'; end if;
  update public.sessions_ouvertes s set deconnecter = true
   where (p_session is null and exists (select 1 from public.profiles p where p.id = s.user_id and p.role <> 'prof'))
      or (p_session is not null and s.id = p_session and s.user_id <> auth.uid());
  get diagnostics n = row_count; return n;
end $$;
revoke all on function public.pp_deconnecter(uuid) from public, anon;
grant execute on function public.pp_deconnecter(uuid) to authenticated;

select 'PhysiquePro : étape 23 installée ✓' as resultat;
