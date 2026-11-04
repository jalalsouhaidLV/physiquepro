-- PhysiquePro · TEST D'INTRUSION sur les FICHIERS (stockage) — tout est annulé à la fin
begin;
create temp table t_res (n serial, groupe text, test text, obtenu text, ok boolean);
create temp table t_ids (k text primary key, v text);
grant all on t_res, t_ids to authenticated; grant usage on sequence t_res_n_seq to authenticated;
do $$
declare a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); d1 bigint; d3 bigint;
begin
  insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at) values
    (a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lv.zz.testa@lycee-verdun.edu.lb', now(), now()),
    (b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lv.zz.testb@lycee-verdun.edu.lb', now(), now());
  insert into profiles (id, email, nom) values (a, 'lv.zz.testa@lycee-verdun.edu.lb', 'A'), (b, 'lv.zz.testb@lycee-verdun.edu.lb', 'B') on conflict (id) do nothing;
  insert into classes (id, nom) values ('zz_x', 'X'), ('zz_y', 'Y');
  insert into inscriptions (classe_id, email, nom) values ('zz_x', 'lv.zz.testa@lycee-verdun.edu.lb', 'A'), ('zz_x', 'lv.zz.testb@lycee-verdun.edu.lb', 'B'), ('zz_y', 'lv.zz.testb@lycee-verdun.edu.lb', 'B');
  insert into devoirs (classe_id, titre, date_limite) values ('zz_x', 'D1', now() + interval '7 days') returning id into d1;
  insert into devoirs (classe_id, titre, date_limite) values ('zz_y', 'D3', now() + interval '7 days') returning id into d3;
  insert into rendus (devoir_id, auteur, auteur_email) values (d1, b, 'lv.zz.testb@lycee-verdun.edu.lb');
  insert into storage.objects (bucket_id, name, owner, metadata) values
    ('rendus', d1 || '/' || b || '/copieB.pdf', b, '{"size":10}'),
    ('documents', 'zz_y/cours-classe-Y.pdf', null, '{"size":10}'),
    ('documents', 'zz_x/cours-classe-X.pdf', null, '{"size":10}');
  insert into t_ids values ('A', a), ('B', b), ('D1', d1), ('D3', d3);
end $$;
create function pg_temp.lire(g text, t text, sql text) returns void language plpgsql as $f$
declare n int; begin execute 'select count(*) from (' || sql || ') s' into n;
  insert into t_res (groupe, test, obtenu, ok) values (g, t, n || ' fichier(s) visible(s)', n = 0);
exception when others then insert into t_res (groupe, test, obtenu, ok) values (g, t, 'refuse (' || sqlstate || ') ' || left(sqlerrm, 80), sqlstate in ('42501', 'P0001')); end $f$;
create function pg_temp.ecrire(g text, t text, sql text) returns void language plpgsql as $f$
declare n int; begin execute sql; get diagnostics n = row_count;
  insert into t_res (groupe, test, obtenu, ok) values (g, t, n || ' fichier(s) touche(s)', n = 0);
exception when others then insert into t_res (groupe, test, obtenu, ok) values (g, t, 'refuse (' || sqlstate || ') ' || left(sqlerrm, 80), sqlstate in ('42501', 'P0001')); end $f$;
grant execute on all functions in schema pg_temp to authenticated;
select set_config('request.jwt.claims', json_build_object('sub', (select v from t_ids where k = 'A'), 'role', 'authenticated', 'email', 'lv.zz.testa@lycee-verdun.edu.lb')::text, true);
set local role authenticated;
select pg_temp.lire('Lire', 'Fichier rendu par B', $$select * from storage.objects where bucket_id = 'rendus' and name like '%' || (select v from t_ids where k = 'B') || '%'$$);
select pg_temp.lire('Lire', 'Fichiers rendus par les vrais eleves', $$select * from storage.objects where bucket_id = 'rendus' and (storage.foldername(name))[2] <> auth.uid()::text$$);
select pg_temp.lire('Lire', 'Documents d''une classe ou A n''est pas', $$select * from storage.objects where bucket_id = 'documents' and name like 'zz_y/%'$$);
select pg_temp.lire('Lire', 'Documents des vraies classes (A inscrit nulle part)', $$select * from storage.objects where bucket_id = 'documents' and name not like 'zz_%'$$);
select pg_temp.lire('Lire', 'Autres espaces de stockage', $$select * from storage.objects where bucket_id not in ('rendus', 'documents')$$);
select pg_temp.ecrire('Modifier', 'Renommer le fichier de B', $$update storage.objects set name = name || '.x' where bucket_id = 'rendus' and name like '%' || (select v from t_ids where k = 'B') || '%'$$);
select pg_temp.ecrire('Modifier', 'Supprimer le fichier de B', $$delete from storage.objects where bucket_id = 'rendus' and name like '%' || (select v from t_ids where k = 'B') || '%'$$);
select pg_temp.ecrire('Modifier', 'Supprimer un document du prof', $$delete from storage.objects where bucket_id = 'documents'$$);
select pg_temp.ecrire('Modifier', 'Remplacer un document du prof', $$update storage.objects set metadata = '{}' where bucket_id = 'documents'$$);
select pg_temp.ecrire('Usurper', 'Deposer un fichier dans le dossier de B', $$insert into storage.objects (bucket_id, name, owner) values ('rendus', (select v from t_ids where k = 'D1') || '/' || (select v from t_ids where k = 'B') || '/faux.pdf', auth.uid())$$);
select pg_temp.ecrire('Usurper', 'Deposer pour un devoir d''une autre classe', $$insert into storage.objects (bucket_id, name, owner) values ('rendus', (select v from t_ids where k = 'D3') || '/' || auth.uid() || '/faux.pdf', auth.uid())$$);
select pg_temp.ecrire('Prof', 'Ajouter un document de cours', $$insert into storage.objects (bucket_id, name, owner) values ('documents', 'zz_x/faux.pdf', auth.uid())$$);
select pg_temp.ecrire('Prof', 'Rendre un espace public', $$update storage.buckets set public = true$$);
insert into t_ids values ('ctrl', (select count(*) from storage.objects where bucket_id = 'documents' and name like 'zz_x/%')::text);
reset role;
do $$ begin raise exception E'RESULTAT\n%', concat_ws(E'\n',
  (select string_agg(case when ok then 'OK ' else 'XX ' end || '[' || groupe || '] ' || test || ' -> ' || obtenu, E'\n' order by n) from t_res),
  'BILAN : ' || (select count(*) filter (where ok) || ' / ' || count(*) from t_res) || ' tentatives bloquees',
  'CONTROLE : A voit le document de SA classe X : ' || (select v from t_ids where k = 'ctrl'),
  'ESPACES : ' || (select string_agg(id || case when public then ' PUBLIC' else ' prive' end, ', ') from storage.buckets),
  'POLITIQUES : ' || (select string_agg(policyname || ' [' || cmd || ']', ', ') from pg_policies where schemaname = 'storage')) || E'\nFIN'; end $$;
