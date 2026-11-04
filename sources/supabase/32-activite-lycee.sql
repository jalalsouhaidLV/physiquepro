-- =====================================================================
--  PhysiquePro · étape 32 : activité réelle, réseau du lycée, 3 statuts
--  · chaque session mémorise la dernière activité de l'élève (souris, clavier, toucher)
--  · le professeur enregistre l'adresse internet du lycée (bouton dans « Élèves connectés »)
--  · au lycée : déconnexion après 15 min sans activité ; à la maison : pas de limite
-- =====================================================================
alter table public.sessions_ouvertes add column if not exists actif_le timestamptz not null default now();
alter table public.sessions_ouvertes add column if not exists lycee boolean not null default false;

create table if not exists public.reseaux_lycee (ip text primary key, ajoute_le timestamptz not null default now());
alter table public.reseaux_lycee enable row level security;          -- aucun accès direct
revoke all on public.reseaux_lycee from anon, authenticated;

-- adresse internet de la personne qui appelle (transmise par la passerelle Supabase)
create or replace function public.pp_ip() returns text
language sql stable set search_path = public as $$
  select nullif(trim(coalesce(
    nullif(current_setting('request.headers', true), '')::json ->> 'cf-connecting-ip',
    split_part(coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for', ''), ',', 1),
    nullif(current_setting('request.headers', true), '')::json ->> 'x-real-ip')), '')
$$;
create or replace function public.pp_au_lycee() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.reseaux_lycee where ip = public.pp_ip())
$$;

-- présence (version 2) : p_inactif = secondes écoulées depuis la dernière activité
create or replace function public.pp_presence2(p_session uuid, p_appareil text, p_visible boolean, p_inactif int)
returns json language plpgsql security definer set search_path = public as $$
declare lyc boolean := public.pp_au_lycee();
        act timestamptz := now() - make_interval(secs => greatest(0, least(coalesce(p_inactif, 0), 2592000)));
begin
  if auth.uid() is null then return json_build_object('kick', false); end if;
  if exists (select 1 from public.sessions_ouvertes where user_id = auth.uid() and deconnecter
             and (id = p_session or appareil = left(p_appareil, 80))) then
    delete from public.sessions_ouvertes where user_id = auth.uid() and (id = p_session or (deconnecter and appareil = left(p_appareil, 80)));
    return json_build_object('kick', true);
  end if;
  insert into public.sessions_ouvertes (id, user_id, appareil, visible, actif_le, lycee)
    values (p_session, auth.uid(), left(p_appareil, 80), p_visible, act, lyc)
    on conflict (id) do update set vu_le = now(), visible = excluded.visible, appareil = excluded.appareil,
                                   actif_le = excluded.actif_le, lycee = excluded.lycee
    where public.sessions_ouvertes.user_id = auth.uid();
  if p_visible then perform public.pp_visite(); end if;
  delete from public.sessions_ouvertes where vu_le < now() - interval '7 days';
  return json_build_object('kick', false, 'lycee', lyc, 'limite', case when lyc and not public.est_prof() then 900 end);
end $$;
revoke all on function public.pp_presence2(uuid, text, boolean, int) from public, anon;
grant execute on function public.pp_presence2(uuid, text, boolean, int) to authenticated;

-- statut d'une session : actif / inactif / expiree (déconnexion automatique au lycée)
create or replace function public.pp_statut_session(s public.sessions_ouvertes) returns text
language sql stable as $$
  select case when s.deconnecter then 'attente'
              when s.lycee and s.actif_le < now() - interval '15 minutes' then 'expiree'
              when s.vu_le > now() - interval '3 minutes' and s.actif_le > now() - interval '5 minutes' then 'actif'
              else 'inactif' end
$$;

create or replace function public.pp_sessions() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.est_prof() then raise exception 'Réservé au professeur.'; end if;
  return coalesce((select json_agg(x order by x.ordre, x.nom) from (
    select s.id, s.appareil, s.debut, s.vu_le, s.actif_le, s.visible, s.deconnecter, s.lycee, false as moi,
           public.pp_statut_session(s) as statut,
           public.pp_statut_session(s) = 'actif' as en_ligne,
           case public.pp_statut_session(s) when 'actif' then 0 when 'inactif' then 1 when 'attente' then 2 else 3 end as ordre,
           p.role, p.email,
           coalesce((select i.nom from public.inscriptions i where i.email = p.email limit 1), p.nom, p.email) as nom,
           (select string_agg(c.nom, ' · ' order by c.ordre) from public.inscriptions i join public.classes c on c.id = i.classe_id where i.email = p.email) as classes
      from public.sessions_ouvertes s join public.profiles p on p.id = s.user_id
     where s.vu_le > now() - interval '18 hours' and coalesce(p.role, 'eleve') <> 'prof') x), '[]'::json);
end $$;

create or replace function public.pp_stats_visites() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.est_prof() then raise exception 'Réservé au professeur.'; end if;
  return json_build_object(
    'comptes',  (select count(*) from public.profiles where coalesce(role, 'eleve') <> 'prof'),
    'eleves',   (select count(*) from public.profiles where coalesce(role, 'eleve') <> 'prof'),
    'visites',  (select coalesce(sum(visites), 0) from public.profiles where coalesce(role, 'eleve') <> 'prof'),
    'enligne',  (select count(distinct s.user_id) from public.sessions_ouvertes s join public.profiles p on p.id = s.user_id
                  where coalesce(p.role, 'eleve') <> 'prof' and public.pp_statut_session(s) = 'actif'),
    'inactifs', (select count(distinct s.user_id) from public.sessions_ouvertes s join public.profiles p on p.id = s.user_id
                  where coalesce(p.role, 'eleve') <> 'prof' and public.pp_statut_session(s) = 'inactif' and s.vu_le > now() - interval '18 hours'
                    and not exists (select 1 from public.sessions_ouvertes s2 where s2.user_id = s.user_id and public.pp_statut_session(s2) = 'actif')),
    'noms',     '[]'::json,
    'aujourdhui', (select count(*) from public.profiles where coalesce(role, 'eleve') <> 'prof' and derniere_visite >= date_trunc('day', now()))
  );
end $$;

-- réseau du lycée : le professeur enregistre (ou oublie) l'adresse de l'endroit où il se trouve
create or replace function public.pp_reseau_lycee(p_action text) returns json
language plpgsql security definer set search_path = public as $$
declare v_ip text := public.pp_ip();
begin
  if not public.est_prof() then raise exception 'Réservé au professeur.'; end if;
  if p_action = 'ajouter' then
    if v_ip is null then raise exception 'Adresse internet introuvable.'; end if;
    insert into public.reseaux_lycee (ip) values (v_ip) on conflict do nothing;
  elsif p_action = 'oublier' then
    delete from public.reseaux_lycee;
  end if;
  return json_build_object('ici', exists (select 1 from public.reseaux_lycee r where r.ip = v_ip), 'nb', (select count(*) from public.reseaux_lycee), 'detecte', v_ip is not null);
end $$;
revoke all on function public.pp_reseau_lycee(text) from public, anon;
grant execute on function public.pp_reseau_lycee(text) to authenticated;
revoke all on function public.pp_ip() from public, anon;
revoke all on function public.pp_au_lycee() from public, anon;
revoke all on function public.pp_statut_session(public.sessions_ouvertes) from public, anon;
grant execute on function public.pp_ip(), public.pp_au_lycee(), public.pp_statut_session(public.sessions_ouvertes) to authenticated;
select 'PhysiquePro : étape 32 installée ✓' as resultat;
