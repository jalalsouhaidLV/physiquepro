-- =====================================================================
--  PhysiquePro · étape 42 (11/11/2026) : « En ligne » = l'élève travaille sur le site
--  Avant : « En ligne » même si l'onglet était en arrière-plan ou l'application en fond.
--  Maintenant (choix de Jalal) : « En ligne » seulement si
--    · la page est au premier plan (onglet visible ET fenêtre utilisée sur ordinateur,
--      application ouverte à l'écran sur téléphone) : colonne visible (envoyée par app.js) ;
--    · l'appareil a donné signe de vie depuis moins de 90 secondes (envoi toutes les 30 s,
--      et tout de suite à chaque changement de fenêtre / mise en arrière-plan) ;
--    · il y a eu une activité (souris, clavier, toucher, défilement) depuis moins de 5 minutes.
--  Sinon : « Inactif » (rangé dans « Ordinateurs restés connectés » ou « Téléphones fermés »).
-- =====================================================================
create or replace function public.pp_statut_session(s public.sessions_ouvertes) returns text
language sql stable set search_path = '' as $$
  select case when s.deconnecter then 'attente'
              when s.visible and s.vu_le > now() - interval '90 seconds' and s.actif_le > now() - interval '5 minutes' then 'actif'
              else 'inactif' end
$$;
