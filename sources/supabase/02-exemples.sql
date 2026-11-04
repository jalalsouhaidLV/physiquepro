-- =====================================================================
--  PhysiquePro · contenu d'exemple (facultatif) pour tester l'affichage
--  Ajoute en SNT un thème, deux supports et deux devoirs marqués [exemple].
--  Pour tout retirer : exécuter 03-retirer-exemples.sql
-- =====================================================================

with t as (
  insert into public.themes (classe_id, titre, ordre)
  values ('snt', '[exemple] Internet', 1)
  returning id
), s as (
  insert into public.supports (classe_id, theme_id, titre, description, ressources, publie_le)
  select 'snt', t.id, x.titre, x.descr, x.res::jsonb, now() - x.age
  from t, (values
    ('[exemple] Activité · Adresses IP et paquets', 'Lis le document puis réponds aux questions.',
     '[{"type":"PDF","label":"Activité","url":"https://www.office.com"}]', interval '5 days'),
    ('[exemple] Simuler un réseau avec Filius', 'Installe Filius et suis la fiche d''aide.',
     '[{"type":"Lien","label":"Filius","url":"https://www.lernsoftware-filius.de"},{"type":"PDF","label":"Fiche d''aide","url":"https://www.office.com"}]', interval '2 days')
  ) as x(titre, descr, res, age)
  returning 1
)
insert into public.devoirs (classe_id, theme_id, titre, consigne, date_limite, mode, formats, publie_le)
select 'snt', t.id, x.titre, x.consigne, now() + x.delai, x.mode, x.formats, now() - interval '1 day'
from t, (values
  ('[exemple] Compte rendu Filius', 'Dépose le compte rendu de l''activité Filius avec la capture de ton réseau.', interval '5 days', 'individuel', 'PDF, photos'),
  ('[exemple] Schéma du réseau du lycée', 'Un seul rendu par binôme : schéma annoté du réseau de la salle.', interval '9 days', 'binome', 'PDF, images')
) as x(titre, consigne, delai, mode, formats);

select 'Contenu d''exemple ajouté en SNT ✓' as resultat;
