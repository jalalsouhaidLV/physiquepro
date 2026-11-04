-- PhysiquePro · étape 26 : une ligne de présence par onglet ; la déconnexion à distance
-- s'applique aussi quand le navigateur rouvre le site dans un nouvel onglet
create or replace function public.pp_presence(p_session uuid, p_appareil text, p_visible boolean) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  if exists (select 1 from public.sessions_ouvertes where user_id = auth.uid() and deconnecter
             and (id = p_session or appareil = left(p_appareil, 80))) then
    delete from public.sessions_ouvertes where user_id = auth.uid() and (id = p_session or (deconnecter and appareil = left(p_appareil, 80)));
    return true;
  end if;
  insert into public.sessions_ouvertes (id, user_id, appareil, visible) values (p_session, auth.uid(), left(p_appareil, 80), p_visible)
    on conflict (id) do update set vu_le = now(), visible = excluded.visible, appareil = excluded.appareil
    where public.sessions_ouvertes.user_id = auth.uid();
  if p_visible then perform public.pp_visite(); end if;
  delete from public.sessions_ouvertes where vu_le < now() - interval '7 days';
  return false;
end $$;
select 'PhysiquePro : étape 26 installée ✓' as resultat;
