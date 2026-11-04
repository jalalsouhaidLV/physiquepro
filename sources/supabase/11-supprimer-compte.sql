-- =====================================================================
--  PhysiquePro · étape 11 : supprimer complètement le compte d'un élève
--  (inscriptions, travaux rendus, résultats, commentaires privés, profil, compte de connexion)
--  Réservé au professeur. S'il se reconnecte plus tard, un nouveau compte vide est créé.
-- =====================================================================
create or replace function public.pp_supprimer_compte(p_email text) returns text
language plpgsql security definer set search_path = public, auth as $$
declare e text := lower(trim(p_email)); n int := 0;
begin
  if not public.est_prof() then raise exception 'Réservé au professeur.'; end if;
  if e = public.email_prof() then raise exception 'Impossible de supprimer le compte du professeur.'; end if;
  delete from public.inscriptions where email = e;
  delete from public.commentaires_prives where eleve_email = e;
  delete from auth.users where lower(email) = e;   -- supprime aussi profil, rendus et résultats (cascade)
  get diagnostics n = row_count;
  return case when n > 0 then 'compte supprimé' else 'aucun compte, inscriptions retirées' end;
end $$;
revoke all on function public.pp_supprimer_compte(text) from public, anon;
grant execute on function public.pp_supprimer_compte(text) to authenticated;

select 'PhysiquePro : suppression de compte installée ✓' as resultat;
