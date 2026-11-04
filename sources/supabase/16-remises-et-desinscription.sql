-- =====================================================================
--  PhysiquePro · étape 16
--  1) « Devoirs non acceptés » : le prof verrouille / déverrouille la remise d'un devoir
--  2) Un élève peut quitter un cours (comme « Se désinscrire » dans Classroom)
-- =====================================================================
alter table public.devoirs add column if not exists accepte boolean not null default true;

-- verrou côté base : un élève ne peut ni rendre ni annuler son envoi quand le devoir n'accepte plus de remises
create or replace function public.pp_verrou_remise() returns trigger
language plpgsql security definer set search_path = public as $$
declare did bigint := coalesce(new.devoir_id, old.devoir_id);
begin
  if public.est_prof() then return coalesce(new, old); end if;
  if exists (select 1 from public.devoirs d where d.id = did and d.accepte = false) then
    raise exception 'Ce devoir n''accepte plus de remises.';
  end if;
  return coalesce(new, old);
end $$;
drop trigger if exists pp_verrou_remise on public.rendus;
create trigger pp_verrou_remise before insert or delete on public.rendus
  for each row execute function public.pp_verrou_remise();

-- l'élève quitte un cours : on retire seulement SON inscription (ses travaux rendus restent pour le prof)
create or replace function public.pp_quitter_cours(p_classe text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.est_prof() then raise exception 'Le professeur ne peut pas quitter son propre cours.'; end if;
  delete from public.inscriptions where classe_id = p_classe and email = public.mon_email();
end $$;
revoke all on function public.pp_quitter_cours(text) from public, anon;
grant execute on function public.pp_quitter_cours(text) to authenticated;

select 'PhysiquePro : verrou des remises et désinscription installés ✓' as resultat;
