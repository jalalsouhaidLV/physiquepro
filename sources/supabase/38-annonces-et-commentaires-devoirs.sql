-- =====================================================================
--  PhysiquePro · étape 38 : annonces programmées et épinglées,
--  commentaires de classe sous les devoirs (11/11/2026)
--
--  1. annonces.publie_le : date de publication (programmable par le prof).
--     Un élève ne voit une annonce qu'à partir de cette date.
--     annonces.epingle : annonce gardée en haut du flux (prof seulement).
--     Un élève qui publie (flux ouvert aux élèves) ne peut ni épingler ni
--     programmer : le serveur remet epingle = false et publie_le = maintenant
--     (déclencheur annonces_regles, actif seulement pour un élève connecté).
--  2. commentaires_devoirs : commentaires visibles par toute la classe sous un
--     devoir (comme « Commentaires ajoutés au cours » dans Classroom).
--     Lecture : le prof, ou un élève qui voit le devoir (règles de devoirs) et
--     dont le flux n'est pas masqué. Écriture : même chose, flux « prof » ou
--     « eleves ». Suppression : le prof, ou l'auteur. Aucun droit pour anon.
--
--  Aucune instruction drop ni delete : exécutable par le connecteur.
-- =====================================================================
begin;

-- 1. Annonces -----------------------------------------------------------
alter table public.annonces add column if not exists publie_le timestamptz;
update public.annonces set publie_le = cree_le where publie_le is null;
alter table public.annonces alter column publie_le set default now();
alter table public.annonces alter column publie_le set not null;
alter table public.annonces add column if not exists epingle boolean not null default false;
create index if not exists annonces_publie_idx on public.annonces(classe_id, publie_le);

create or replace function public.pp_annonce_regles() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- seulement pour un élève connecté (pas pour le prof, ni pour l'éditeur SQL / le rôle service)
  if auth.uid() is not null and not public.est_prof() then
    new.epingle := false;
    if tg_op = 'INSERT' then new.publie_le := now();
    else new.publie_le := old.publie_le; end if;
  end if;
  if new.publie_le is null then new.publie_le := now(); end if;
  return new;
end $$;
-- fonction de déclencheur seulement : personne ne peut l'appeler directement
revoke execute on function public.pp_annonce_regles() from public, anon, authenticated;

create or replace trigger annonces_regles before insert or update on public.annonces
  for each row execute function public.pp_annonce_regles();

alter policy annonces_lecture on public.annonces
  using (public.est_prof() or (public.dans_classe(classe_id) and public.flux_mode_de(classe_id) <> 'masque' and publie_le <= now()));

-- 2. Commentaires de classe sous un devoir -----------------------------------
create table if not exists public.commentaires_devoirs (
  id         bigint generated always as identity primary key,
  devoir_id  bigint not null references public.devoirs(id) on delete cascade,
  auteur     uuid references public.profiles(id) on delete set null,
  auteur_nom text not null default '',
  texte      text not null check (length(texte) between 1 and 2000),
  cree_le    timestamptz not null default now()
);
create index if not exists commentaires_devoirs_devoir_idx on public.commentaires_devoirs(devoir_id);
create index if not exists commentaires_devoirs_auteur_idx on public.commentaires_devoirs(auteur);

create or replace trigger commentaires_devoirs_auteur before insert on public.commentaires_devoirs
  for each row execute function public.fixer_auteur();

alter table public.commentaires_devoirs enable row level security;
revoke all on public.commentaires_devoirs from public, anon, authenticated;
grant select, insert, delete on public.commentaires_devoirs to authenticated;

-- la sous-requête sur devoirs applique les règles RLS de devoirs (brouillon, date, élèves ciblés)
create policy cdevoirs_lecture on public.commentaires_devoirs for select to authenticated
  using (public.est_prof() or exists (select 1 from public.devoirs d
    where d.id = devoir_id and public.flux_mode_de(d.classe_id) <> 'masque'));
create policy cdevoirs_ajout on public.commentaires_devoirs for insert to authenticated
  with check (public.est_prof() or exists (select 1 from public.devoirs d
    where d.id = devoir_id and public.flux_mode_de(d.classe_id) in ('prof', 'eleves')));
create policy cdevoirs_suppr on public.commentaires_devoirs for delete to authenticated
  using (public.est_prof() or auteur = (select auth.uid()));

commit;

select 'PhysiquePro : étape 38 installée ✓ (annonces programmées/épinglées, commentaires de classe sous les devoirs)' as resultat;
