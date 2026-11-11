-- =====================================================================
--  PhysiquePro · étape 40 (11/11/2026) : « Se déconnecter » efface bien la présence
--  Avant : la déconnexion n'effaçait que la ligne de l'onglet en cours (identifiant gardé
--  dans sessionStorage). L'application Android/iPhone et chaque nouvel onglet créent un
--  nouvel identifiant : les anciennes lignes du même appareil restaient affichées
--  « Inactif » chez le professeur, même après la déconnexion de l'élève.
--  Maintenant : pp_fin_appareil efface la ligne de l'onglet ET toutes les lignes de
--  l'élève sur ce même appareil (même nom « Android · Chrome (application) », etc.).
--  Les autres appareils de l'élève ne sont pas touchés (déconnexion de cet appareil seulement).
-- =====================================================================
begin;

create or replace function public.pp_fin_appareil(p_session uuid, p_appareil text) returns void
language sql security definer set search_path = public as $$
  delete from public.sessions_ouvertes
   where user_id = auth.uid()
     and (id = p_session or (p_appareil is not null and appareil = left(p_appareil, 80)));
$$;
revoke all on function public.pp_fin_appareil(uuid, text) from public, anon;
grant execute on function public.pp_fin_appareil(uuid, text) to authenticated;

commit;
