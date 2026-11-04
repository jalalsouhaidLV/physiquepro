-- =====================================================================
--  PhysiquePro · étape 21 : corbeille (30 jours), sauvegardes
--  automatiques hebdomadaires, flashcards de révision
-- =====================================================================

-- 1. CORBEILLE : chaque ligne supprimée (et tout ce qui part avec elle) est gardée 30 jours
create table if not exists public.corbeille (
  id          bigint generated always as identity primary key,
  lot         bigint not null,                 -- même lot = même suppression (transaction)
  table_nom   text not null,
  ligne       jsonb not null,
  supprime_le timestamptz not null default now(),
  restaure_le timestamptz
);
create index if not exists corbeille_lot on public.corbeille(lot);
alter table public.corbeille enable row level security;
drop policy if exists corbeille_prof on public.corbeille;
create policy corbeille_prof on public.corbeille for select to authenticated using (public.est_prof());
revoke all on public.corbeille from anon;
grant select on public.corbeille to authenticated;

create or replace function public.pp_vers_corbeille() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.corbeille (lot, table_nom, ligne) values (txid_current(), TG_TABLE_NAME, to_jsonb(OLD));
  return OLD;
end $$;

do $$ declare t text; begin
  foreach t in array array['themes','supports','devoirs','quiz','quiz_solutions','annonces','commentaires','rendus','corrections','resultats_quiz'] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists pp_corbeille on public.%I', t);
      execute format('create trigger pp_corbeille before delete on public.%I for each row execute function public.pp_vers_corbeille()', t);
    end if;
  end loop;
end $$;

-- restaurer un lot entier (dans le bon ordre : parents puis enfants)
create or replace function public.pp_restaurer(p_lot bigint) returns int
language plpgsql security definer set search_path = public as $$
declare r record; n int := 0; t text;
  ordre text[] := array['themes','supports','devoirs','quiz','quiz_solutions','annonces','commentaires','rendus','corrections','resultats_quiz','flashcards'];
  cols text;
begin
  if not public.est_prof() then raise exception 'Réservé au professeur.'; end if;
  foreach t in array ordre loop
    for r in select * from public.corbeille where lot = p_lot and table_nom = t and restaure_le is null order by id loop
      select string_agg(quote_ident(c.column_name), ',') into cols
        from information_schema.columns c where c.table_schema = 'public' and c.table_name = t and r.ligne ? c.column_name;
      begin
        execute format('insert into public.%I (%s) overriding system value select %s from jsonb_populate_record(null::public.%I, $1) on conflict do nothing', t, cols, cols, t) using r.ligne;
        n := n + 1;
      exception when foreign_key_violation then null;  -- parent introuvable (ex. cours supprimé) : on ignore cette ligne
      end;
      update public.corbeille set restaure_le = now() where id = r.id;
    end loop;
  end loop;
  return n;
end $$;
revoke all on function public.pp_restaurer(bigint) from public, anon;
grant execute on function public.pp_restaurer(bigint) to authenticated;

-- ménage : plus de 30 jours
create or replace function public.pp_menage_corbeille() returns void
language sql security definer set search_path = public as $$
  delete from public.corbeille where supprime_le < now() - interval '30 days';
$$;
revoke all on function public.pp_menage_corbeille() from public, anon;
grant execute on function public.pp_menage_corbeille() to authenticated;

-- 2. SAUVEGARDES AUTOMATIQUES (une par semaine, les 8 dernières sont gardées)
create table if not exists public.sauvegardes (
  id       bigint generated always as identity primary key,
  cree_le  timestamptz not null default now(),
  taille   int,
  contenu  jsonb not null
);
alter table public.sauvegardes enable row level security;
drop policy if exists sauvegardes_prof on public.sauvegardes;
create policy sauvegardes_prof on public.sauvegardes for select to authenticated using (public.est_prof());
revoke all on public.sauvegardes from anon;
grant select on public.sauvegardes to authenticated;

create or replace function public.pp_sauvegarde(p_forcer boolean default false) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare der timestamptz; t text; j jsonb := '{}'::jsonb; x jsonb;
  tables text[] := array['reglages','classes','themes','supports','devoirs','quiz','quiz_solutions','inscriptions','annonces','commentaires','rendus','corrections','resultats_quiz','profiles','demandes_materiel','rdv_series','rdv_creneaux','rdv_reservations','flashcards'];
begin
  if not public.est_prof() then raise exception 'Réservé au professeur.'; end if;
  select max(cree_le) into der from public.sauvegardes;
  if not p_forcer and der is not null and der > now() - interval '7 days' then return der; end if;
  foreach t in array tables loop
    if to_regclass('public.' || t) is not null then
      execute format('select coalesce(jsonb_agg(to_jsonb(x)), ''[]''::jsonb) from public.%I x', t) into x;
      j := j || jsonb_build_object(t, x);
    end if;
  end loop;
  insert into public.sauvegardes (contenu, taille) values (jsonb_build_object('site', 'PhysiquePro', 'cree_le', now(), 'tables', j), length(j::text));
  delete from public.sauvegardes where id not in (select id from public.sauvegardes order by cree_le desc limit 8);
  perform public.pp_menage_corbeille();
  return now();
end $$;
revoke all on function public.pp_sauvegarde(boolean) from public, anon;
grant execute on function public.pp_sauvegarde(boolean) to authenticated;

-- 3. FLASHCARDS DE RÉVISION (par cours et par thème)
create table if not exists public.flashcards (
  id        bigint generated always as identity primary key,
  classe_id text not null references public.classes(id) on delete cascade,
  theme_id  bigint references public.themes(id) on delete set null,
  recto     text not null,
  verso     text not null,
  ordre     int not null default 0,
  cree_le   timestamptz not null default now()
);
alter table public.flashcards enable row level security;
drop policy if exists fc_lecture on public.flashcards;
drop policy if exists fc_prof on public.flashcards;
create policy fc_lecture on public.flashcards for select to authenticated using (public.est_prof() or public.dans_classe(classe_id));
create policy fc_prof on public.flashcards for all to authenticated using (public.est_prof()) with check (public.est_prof());
revoke all on public.flashcards from anon;
grant select, insert, update, delete on public.flashcards to authenticated;
drop trigger if exists pp_corbeille on public.flashcards;
create trigger pp_corbeille before delete on public.flashcards for each row execute function public.pp_vers_corbeille();

select 'PhysiquePro : étape 21 installée ✓' as resultat;
