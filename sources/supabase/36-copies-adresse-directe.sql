-- ============================================================
--  PhysiquePro · étape 36 : adresse directe des copies élèves (11/11/2026)
--  Colonne « fichier » = adresse …/Documents/…/Nom - document.docx de la copie.
--  Sert à ouvrir la copie directement dans l'appli Word / Excel / PowerPoint
--  du téléphone (ms-word:ofe|u|…) et à la télécharger.
--  Droits et règles RLS inchangés (grant de la table copies, script 13).
-- ============================================================
alter table public.copies add column if not exists fichier text;
select 'PhysiquePro : adresse directe des copies ✓' as resultat;
