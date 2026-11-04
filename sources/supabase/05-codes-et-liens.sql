-- =====================================================================
--  PhysiquePro · codes de cours (rejoindre une classe) et liens par classe
-- =====================================================================

alter table public.classes add column if not exists code text;
alter table public.classes add column if not exists code_actif boolean not null default true;
alter table public.classes add column if not exists liens jsonb not null default '[]';
create unique index if not exists classes_code_idx on public.classes (lower(code));

-- Code de 7 caractères, sans caractères ambigus (0/o, 1/l/i)
create or replace function public.generer_code() returns text
language plpgsql volatile as $$
declare
  alphabet text := 'abcdefghjkmnpqrstuvwxyz23456789';
  c text;
begin
  loop
    c := '';
    for i in 1..7 loop
      c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.classes where lower(code) = c);
  end loop;
  return c;
end $$;

update public.classes set code = public.generer_code() where code is null;
alter table public.classes alter column code set default public.generer_code();

-- Un élève rejoint une classe avec le code donné par le professeur
create or replace function public.rejoindre_classe(p_code text, p_nom text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  e text := public.mon_email();
  c classes%rowtype;
begin
  if auth.uid() is null then raise exception 'Connexion requise.'; end if;
  if e not like '%@' || public.domaine_autorise() then raise exception 'Adresse non autorisée.'; end if;
  select * into c from classes where lower(code) = lower(trim(p_code));
  if not found then raise exception 'Code de cours introuvable. Vérifie le code donné par ton professeur.'; end if;
  if not c.code_actif then raise exception 'Ce code de cours est désactivé. Demande à ton professeur.'; end if;
  insert into inscriptions (classe_id, email, nom)
  values (c.id, e, coalesce(nullif(trim(p_nom), ''), e))
  on conflict (classe_id, email) do nothing;
  return jsonb_build_object('id', c.id, 'nom', c.nom);
end $$;

revoke all on function public.rejoindre_classe(text, text) from anon;

select 'PhysiquePro : codes de cours et liens installés ✓' as resultat;
