-- =====================================================================
--  PhysiquePro · étape 17 : « Message urgent à M. Souhaid » (élève) / « Messagerie d'urgence » (prof)
--  L'élève écrit au prof depuis un cours ; il voit seulement ses propres messages et la réponse.
--  Le prof voit tous les messages, les marque lus et peut répondre.
-- =====================================================================
create table if not exists public.messages_urgents (
  id          bigint generated always as identity primary key,
  classe_id   text not null references public.classes(id) on delete cascade,
  eleve       uuid not null references public.profiles(id) on delete cascade,
  eleve_email text not null,
  eleve_nom   text not null default '',
  texte       text not null check (length(trim(texte)) between 1 and 2000),
  cree_le     timestamptz not null default now(),
  lu          boolean not null default false,
  reponse     text,
  repondu_le  timestamptz
);
create index if not exists messages_urgents_date_idx on public.messages_urgents(cree_le desc);
alter table public.messages_urgents enable row level security;

drop policy if exists mu_lecture on public.messages_urgents;
drop policy if exists mu_envoi   on public.messages_urgents;
drop policy if exists mu_prof    on public.messages_urgents;
create policy mu_lecture on public.messages_urgents for select to authenticated
  using (public.est_prof() or eleve = auth.uid());
create policy mu_envoi on public.messages_urgents for insert to authenticated
  with check (eleve = auth.uid() and eleve_email = public.mon_email() and public.dans_classe(classe_id)
              and lu = false and reponse is null);
create policy mu_prof on public.messages_urgents for all to authenticated
  using (public.est_prof()) with check (public.est_prof());
revoke all on public.messages_urgents from anon;
grant select, insert on public.messages_urgents to authenticated;
grant update, delete on public.messages_urgents to authenticated;

select 'PhysiquePro : messagerie d''urgence installée ✓' as resultat;
