-- =====================================================================
-- PhysiquePro · ÉTAPE 50 : noter un élève qui n'a rien déposé (25/11/2026)
-- Absent, copie rendue sur papier, membre d'un groupe de TP dont un autre
-- élève a déposé la copie : le professeur crée lui-même une « fiche sans
-- copie » (une ligne de rendus marquée sans_copie, sans fichier), puis la
-- note comme les autres. La note apparaît donc partout : page du devoir,
-- Notes de l'élève, tableau des notes, moyennes, exports.
-- L'élève lit sa fiche et sa correction publiée grâce aux règles déjà en
-- place (auteur = l'élève). Il ne peut ni la créer ni l'annuler.
-- Script sans drop ni delete. À relancer ensuite : 29 et 30.
-- =====================================================================

alter table public.rendus add column if not exists sans_copie boolean not null default false;
comment on column public.rendus.sans_copie is 'Fiche créée par le professeur pour noter un élève sans dépôt (étape 50)';

-- Le professeur crée une fiche sans copie, seulement pour un élève inscrit dans le cours du devoir
create policy rendus_prof_sans_copie on public.rendus for insert to authenticated
  with check (public.est_prof() and sans_copie
              and fichiers = '[]'::jsonb and lien is null and reponse is null and binome_email is null
              and exists (select 1 from public.devoirs d join public.inscriptions i on i.classe_id = d.classe_id
                          where d.id = devoir_id and lower(i.email) = lower(auteur_email))
              and exists (select 1 from public.profiles p where p.id = auteur and lower(p.email) = lower(auteur_email)));

-- L'élève ne peut pas déposer un vrai rendu marqué « sans copie »
alter policy rendus_depot on public.rendus
  with check (not sans_copie and auteur = (select auth.uid()) and auteur_email = public.mon_email()
              and public.peut_rendre(devoir_id, binome_email));

-- L'élève ne peut pas annuler une fiche créée par le professeur
alter policy rendus_annuler on public.rendus
  using (public.est_prof() or (not sans_copie and auteur = (select auth.uid()) and public.devoir_ouvert(devoir_id)
         and public.reponse_modifiable(devoir_id)
         and not exists (select 1 from public.corrections c where c.rendu_id = rendus.id and c.publiee)));

-- Vérification : 3 lignes attendues
select policyname, cmd from pg_policies where tablename = 'rendus' and policyname in ('rendus_prof_sans_copie', 'rendus_depot', 'rendus_annuler') order by 1;
