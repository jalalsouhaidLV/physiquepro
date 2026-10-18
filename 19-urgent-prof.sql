-- =====================================================================
--  PhysiquePro · étape 19 : le prof peut envoyer un message d'urgence à un élève
-- =====================================================================
alter table public.messages_urgents add column if not exists de_prof boolean not null default false;
-- un élève ne peut envoyer que ses propres messages (jamais « de la part du prof »)
drop policy if exists mu_envoi on public.messages_urgents;
create policy mu_envoi on public.messages_urgents for insert to authenticated
  with check (eleve = auth.uid() and eleve_email = public.mon_email() and public.dans_classe(classe_id)
              and lu = false and reponse is null and de_prof = false);
-- l'élève marque comme lu un message reçu du prof
create or replace function public.pp_urgent_lu(p_classe text) returns void
language sql security definer set search_path = public as $$
  update public.messages_urgents set lu = true where eleve = auth.uid() and de_prof and not lu and classe_id = p_classe;
$$;
revoke all on function public.pp_urgent_lu(text) from public, anon;
grant execute on function public.pp_urgent_lu(text) to authenticated;
select 'PhysiquePro : messages d''urgence du prof installés ✓' as resultat;
