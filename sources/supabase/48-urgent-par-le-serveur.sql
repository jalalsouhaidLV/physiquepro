-- =====================================================================
--  PhysiquePro · étape 48 : la notification « message urgent » au prof
--  part du SERVEUR, plus du téléphone de l'élève (12/11/2026).
--
--  Constat du 12/11/2026 : les 6 messages urgents d'élèves venus de
--  physiquepro.netlify.app (copie publiée le dimanche, plus ancienne) n'ont
--  déclenché AUCUNE notification ; ceux venus de github.io, tous. Le site de
--  l'élève demandait lui-même la notification : une copie ancienne du site,
--  un réseau coupé ou un onglet fermé trop vite suffisaient à la perdre.
--
--  Maintenant :
--   1. le déclencheur pp_urgent_signaler appelle la fonction « pp-urgent »
--      dès qu'un message d'élève est enregistré (pg_net, après validation) ;
--   2. la tâche pg_cron « pp-urgent-filet » la rappelle chaque minute tant
--      qu'un message de moins de 15 min n'a été remis à aucun appareil
--      (6 essais au plus) : aucun appel quand tout est remis ;
--   3. pp_push_urgents garde le résultat (appareils, envoyés, erreurs) ;
--      le prof (et lui seul) peut le lire pour voir « notifié sur … ».
--  Même clé d'appel que pp-rappels (pp_rappels_cle, script 39).
-- =====================================================================
begin;

alter table public.pp_push_urgents
  add column if not exists termine   boolean not null default true,
  add column if not exists essais    int     not null default 1,
  add column if not exists envoyes   int,
  add column if not exists appareils int,
  add column if not exists detail    text;

-- lecture par le prof seulement (suivi dans la Messagerie d'urgence) ; aucune écriture depuis le site
revoke all on public.pp_push_urgents from public, anon, authenticated;
grant select on public.pp_push_urgents to authenticated;
alter table public.pp_push_urgents enable row level security;
create policy pp_push_urgents_prof on public.pp_push_urgents for select to authenticated using ((select public.est_prof()));

-- 1. déclencheur : un message d'élève vient d'être enregistré → appel de pp-urgent
create or replace function public.pp_urgent_signaler()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not coalesce(new.de_prof, false) then
    begin
      perform net.http_post(
        url := 'https://zycuykixcjgmdbeoflsb.supabase.co/functions/v1/pp-urgent',
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-pp-cle', (select cle from public.pp_rappels_cle where id = 1)),
        body := jsonb_build_object('id', new.id),
        timeout_milliseconds := 20000);
    exception when others then
      null;   -- l'envoi du message ne doit jamais échouer à cause de la notification (le filet de chaque minute rattrape)
    end;
  end if;
  return new;
end $$;
revoke all on function public.pp_urgent_signaler() from public, anon, authenticated;

create or replace trigger pp_urgent_signaler
  after insert on public.messages_urgents
  for each row execute function public.pp_urgent_signaler();

-- 2. filet de sécurité : chaque minute, seulement s'il reste un message récent non remis
select cron.unschedule(jobid) from cron.job where jobname = 'pp-urgent-filet';
select cron.schedule('pp-urgent-filet', '* * * * *', $job$
  select net.http_post(
    url := 'https://zycuykixcjgmdbeoflsb.supabase.co/functions/v1/pp-urgent',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-pp-cle', (select cle from public.pp_rappels_cle where id = 1)),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000)
  where exists (
    select 1 from public.messages_urgents m
    where not m.de_prof and m.cree_le > now() - interval '15 minutes'
      and not exists (select 1 from public.pp_push_urgents u where u.message_id = m.id and (u.termine or u.essais >= 6)));
$job$);

commit;
