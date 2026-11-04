-- =====================================================================
--  PhysiquePro · étape 33 : pas de déconnexion automatique
--  On garde l'activité réelle (statuts En ligne / Inactif) ; le réseau du lycée est retiré.
-- =====================================================================
create or replace function public.pp_presence2(p_session uuid, p_appareil text, p_visible boolean, p_inactif int)
returns json language plpgsql security definer set search_path = public as $$
declare act timestamptz := now() - make_interval(secs => greatest(0, least(coalesce(p_inactif, 0), 2592000)));
begin
  if auth.uid() is null then return json_build_object('kick', false); end if;
  if exists (select 1 from public.sessions_ouvertes where user_id = auth.uid() and deconnecter
             and (id = p_session or appareil = left(p_appareil, 80))) then
    delete from public.sessions_ouvertes where user_id = auth.uid() and (id = p_session or (deconnecter and appareil = left(p_appareil, 80)));
    return json_build_object('kick', true);
  end if;
  insert into public.sessions_ouvertes (id, user_id, appareil, visible, actif_le)
    values (p_session, auth.uid(), left(p_appareil, 80), p_visible, act)
    on conflict (id) do update set vu_le = now(), visible = excluded.visible, appareil = excluded.appareil, actif_le = excluded.actif_le
    where public.sessions_ouvertes.user_id = auth.uid();
  if p_visible then perform public.pp_visite(); end if;
  delete from public.sessions_ouvertes where vu_le < now() - interval '7 days';
  return json_build_object('kick', false);
end $$;
create or replace function public.pp_statut_session(s public.sessions_ouvertes) returns text
language sql stable as $$
  select case when s.deconnecter then 'attente'
              when s.vu_le > now() - interval '3 minutes' and s.actif_le > now() - interval '5 minutes' then 'actif'
              else 'inactif' end
$$;
drop function if exists public.pp_reseau_lycee(text);
drop function if exists public.pp_au_lycee();
drop function if exists public.pp_ip();
drop table if exists public.reseaux_lycee;
update public.sessions_ouvertes set lycee = false where lycee;
select 'etape 33 OK' as resultat;
