-- =====================================================================
--  PhysiquePro · étape 44 (11/11/2026) : lot B de l'audit sur 20
--  1. Rejoindre un cours : le nom enregistré est celui du compte Microsoft
--     (table profiles), plus celui envoyé par le navigateur. Le paramètre p_nom
--     est gardé pour que les anciennes versions du site continuent de marcher,
--     mais il n'est plus lu.
--  2. Annonces : un élève ne peut modifier sa propre annonce que dans une classe
--     où il est inscrit et où les élèves ont le droit de publier (il ne peut donc
--     plus la déplacer dans une autre classe).
--  3. Rendus : le lien rendu commence par https:// (contrôle fait aussi par la base).
--  4. Longueurs maximales des textes écrits par les élèves.
--  5. Droits inutiles retirés : TRUNCATE, TRIGGER, REFERENCES pour anon et authenticated.
--  Rien n'est supprimé. Après ce script : relancer 29-test-intrusion.sql et 30-test-fichiers.sql.
-- =====================================================================
begin;

-- ---------- 1. le nom vient du compte, pas du navigateur
create or replace function public.rejoindre_classe(p_code text, p_nom text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  e text := public.mon_email();
  n text;
  c classes%rowtype;
begin
  if auth.uid() is null then raise exception 'Connexion requise.'; end if;
  if e not like '%@' || public.domaine_autorise() then raise exception 'Adresse non autorisée.'; end if;
  select * into c from classes where lower(code) = lower(trim(p_code));
  if not found then raise exception 'Code de cours introuvable. Vérifie le code donné par ton professeur.'; end if;
  if not c.code_actif or c.archive then raise exception 'Ce code de cours est désactivé. Demande à ton professeur.'; end if;
  -- p_nom n'est plus lu : un élève ne choisit pas son nom d'affichage
  select nullif(trim(nom), '') into n from profiles where id = auth.uid();
  insert into inscriptions (classe_id, email, nom)
  values (c.id, e, coalesce(n, e))
  on conflict (classe_id, email) do nothing;
  return jsonb_build_object('id', c.id, 'nom', c.nom);
end $function$;
revoke all on function public.rejoindre_classe(text, text) from public, anon;
grant execute on function public.rejoindre_classe(text, text) to authenticated;

-- ---------- 2. annonces : modification par l'élève seulement dans sa classe
alter policy annonces_modif on public.annonces
  using (public.est_prof() or (auteur = (select auth.uid()) and public.dans_classe(classe_id)))
  with check (public.est_prof() or (auteur = (select auth.uid()) and public.dans_classe(classe_id) and public.flux_mode_de(classe_id) = 'eleves'));

-- ---------- 3 et 4. lien en https et longueurs maximales
do $$
declare r record;
begin
  for r in select * from (values
    ('rendus',              'rendus_lien_https',      $c$lien is null or lien = '' or (lien ~* '^https://' and length(lien) <= 2000)$c$),
    ('rendus',              'rendus_reponse_longueur', $c$reponse is null or length(reponse) <= 100000$c$),
    ('commentaires',        'commentaires_longueur',  $c$length(texte) <= 4000$c$),
    ('commentaires_devoirs','comdevoirs_longueur',    $c$length(texte) <= 4000$c$),
    ('commentaires_prives', 'cprives_longueur',       $c$length(texte) <= 4000$c$),
    ('annonces',            'annonces_longueur',      $c$length(texte) <= 200000$c$),
    ('inscriptions',        'inscriptions_nom_longueur', $c$nom is null or length(nom) <= 200$c$),
    ('profiles',            'profiles_prefs_longueur', $c$prefs is null or length(prefs::text) <= 20000$c$)
  ) as t(tbl, nom, cond)
  loop
    if not exists (select 1 from pg_constraint where conname = r.nom and conrelid = ('public.' || r.tbl)::regclass) then
      execute format('alter table public.%I add constraint %I check (%s)', r.tbl, r.nom, r.cond);
    end if;
  end loop;
end $$;

-- ---------- 5. droits inutiles
revoke truncate, trigger, references on all tables in schema public from anon, authenticated;

commit;
