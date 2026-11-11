-- =====================================================================
--  PhysiquePro · étape 39 (11/11/2026) : le site sur téléphone
--  1. Une photo peut accompagner un commentaire privé (question au professeur).
--     Le fichier est rangé dans le stockage « rendus » (dossier du devoir / de l'élève,
--     nom commençant par « question- ») : les règles de stockage existantes s'appliquent.
--  2. Rappel la veille de la date limite : la tâche pg_cron « pp-rappels-veille » appelle
--     chaque jour à 16 h UTC (18 h à Beyrouth l'hiver, 19 h l'été) la fonction Supabase
--     « pp-rappels », qui prévient par notification push les élèves qui n'ont pas rendu.
--     La clé d'appel est créée ici au hasard et n'est lisible que par le rôle service et pg_cron :
--     personne n'a à la copier. Aucun droit pour anon ni authenticated sur les deux tables.
-- =====================================================================
begin;

-- ---------- 1. photo jointe à un commentaire privé
alter table public.commentaires_prives add column if not exists photo jsonb;
alter table public.commentaires_prives drop constraint if exists cprives_photo_valide;
alter table public.commentaires_prives add constraint cprives_photo_valide check (
  photo is null or (jsonb_typeof(photo) = 'object'
    and (photo->>'chemin') ~ ('^' || devoir_id::text || '/[0-9a-f-]{36}/question-[0-9]+-[A-Za-z0-9._-]+$')
    and length(photo->>'chemin') < 300));
-- (les règles RLS de commentaires_prives ne changent pas : lecture prof ou élève concerné, ajout dans sa classe)

-- ---------- 2. rappels la veille
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

create table if not exists public.pp_rappels_cle (
  id      int primary key default 1 check (id = 1),
  cle     text not null default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  cree_le timestamptz not null default now()
);
alter table public.pp_rappels_cle enable row level security;
revoke all on public.pp_rappels_cle from public, anon, authenticated;
insert into public.pp_rappels_cle (id) values (1) on conflict (id) do nothing;

create table if not exists public.pp_rappels_envoyes (
  type      text not null check (type in ('devoir', 'quiz')),
  objet_id  bigint not null,
  email     text not null,
  envoye_le timestamptz not null default now(),
  primary key (type, objet_id, email)
);
alter table public.pp_rappels_envoyes enable row level security;
revoke all on public.pp_rappels_envoyes from public, anon, authenticated;
-- aucune règle RLS : seule la fonction Supabase (rôle service) lit et écrit ces deux tables

-- la tâche planifiée (remplacée si elle existe déjà)
select cron.unschedule(jobid) from cron.job where jobname = 'pp-rappels-veille';
select cron.schedule('pp-rappels-veille', '0 16 * * *', $job$
  select net.http_post(
    url := 'https://zycuykixcjgmdbeoflsb.supabase.co/functions/v1/pp-rappels',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-pp-cle', (select cle from public.pp_rappels_cle where id = 1)),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000);
$job$);

-- petit ménage : les traces de rappels de plus de 30 jours sont effacées chaque dimanche
select cron.unschedule(jobid) from cron.job where jobname = 'pp-rappels-menage';
select cron.schedule('pp-rappels-menage', '0 3 * * 0', $job$ delete from public.pp_rappels_envoyes where envoye_le < now() - interval '30 days' $job$);

commit;
