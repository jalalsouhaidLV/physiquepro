-- =====================================================================
--  PhysiquePro · étape 28 : durcissement de sécurité
-- =====================================================================
-- 1. Ménage de la corbeille : réservé au professeur
create or replace function public.pp_menage_corbeille() returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.est_prof() then raise exception 'Réservé au professeur.'; end if;
  delete from public.corbeille where supprime_le < now() - interval '30 days';
end $$;
revoke all on function public.pp_menage_corbeille() from public, anon;
grant execute on function public.pp_menage_corbeille() to authenticated;

-- 2. Restauration : on ne compte que les lignes réellement réinsérées
create or replace function public.pp_restaurer(p_lot bigint) returns int
language plpgsql security definer set search_path = public as $$
declare r record; n int := 0; k int; t text;
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
        get diagnostics k = row_count; n := n + k;
      exception when foreign_key_violation then null;
      end;
      update public.corbeille set restaure_le = now() where id = r.id;
    end loop;
  end loop;
  return n;
end $$;
revoke all on function public.pp_restaurer(bigint) from public, anon;
grant execute on function public.pp_restaurer(bigint) to authenticated;

-- 3. Les visiteurs non connectés (anon) n'ont accès qu'à la page d'accueil publique
do $$ declare f record; begin
  for f in select p.oid::regprocedure as sig, p.proname from pg_proc p join pg_namespace s on s.oid = p.pronamespace
           where s.nspname = 'public' and p.proname not in ('pp_accueil_public', 'pp_ping') and p.prokind = 'f' loop
    execute format('revoke execute on function %s from public, anon', f.sig);
    execute format('grant execute on function %s to authenticated', f.sig);
  end loop;
end $$;
revoke all on all tables in schema public from anon;

-- 4. Sauvegardes et corbeille : lecture seule pour le professeur, aucune écriture directe
revoke insert, update, delete, truncate on public.sauvegardes, public.corbeille from authenticated;

select 'PhysiquePro : étape 28 installée ✓' as resultat;
