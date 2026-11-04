-- =====================================================================
--  PhysiquePro · étape 20 : « Coin Perso » (bloc-notes personnel, visible seulement par son auteur)
-- =====================================================================
create table if not exists public.notes_perso (
  id         uuid primary key default auth.uid() references public.profiles(id) on delete cascade,
  contenu    text not null default '' check (length(contenu) <= 20000),
  modifie_le timestamptz not null default now()
);
alter table public.notes_perso enable row level security;
drop policy if exists np_moi on public.notes_perso;
create policy np_moi on public.notes_perso for all to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke all on public.notes_perso from anon;
grant select, insert, update, delete on public.notes_perso to authenticated;
select 'PhysiquePro : Coin Perso installé ✓' as resultat;
