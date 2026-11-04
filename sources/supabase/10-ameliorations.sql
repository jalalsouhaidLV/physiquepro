-- =====================================================================
--  PhysiquePro · étape 10 : notation avancée et questionnaires scientifiques
--  Le script peut être relancé sans danger.
-- =====================================================================

-- 1. Catégories de notes avec coefficients (par cours) : [{"nom":"TP","coef":1}, …]
alter table public.classes add column if not exists categories jsonb not null default '[]';
alter table public.devoirs add column if not exists categorie text;
alter table public.quiz    add column if not exists categorie text;

-- 2. Grilles d'évaluation : critères du devoir et points obtenus par critère
alter table public.devoirs     add column if not exists grille jsonb;   -- [{"c":"Rédaction","p":4}, …]
alter table public.corrections add column if not exists grille jsonb;   -- [3, 4, 2.5, …]

-- 3. Rendu en retard autorisé (option par devoir)
alter table public.devoirs add column if not exists retard_ok boolean not null default false;

create or replace function public.devoir_ouvert(did bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select date_limite is null or date_limite > now() or retard_ok from devoirs where id = did), false)
$$;

create or replace function public.peut_rendre(did bigint, partenaire text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  d  devoirs%rowtype;
  moi text := public.mon_email();
  p  text := lower(nullif(trim(partenaire), ''));
begin
  select * into d from devoirs where id = did;
  if not found or d.brouillon or d.publie_le > now() then return false; end if;
  if d.date_limite is not null and d.date_limite <= now() and not d.retard_ok then return false; end if;
  if not exists (select 1 from inscriptions where classe_id = d.classe_id and email = moi) then return false; end if;
  if d.eleves is not null and not (moi = any(d.eleves)) then return false; end if;
  if d.mode = 'individuel' and p is not null then return false; end if;
  if d.mode = 'binome' then
    if p is null or p = moi then return false; end if;
    if not exists (select 1 from inscriptions where classe_id = d.classe_id and email = p) then return false; end if;
    if d.eleves is not null and not (p = any(d.eleves)) then return false; end if;
  end if;
  if exists (select 1 from rendus r where r.devoir_id = did
             and (r.auteur_email in (moi, coalesce(p, moi)) or r.binome_email in (moi, coalesce(p, moi)))) then
    return false;
  end if;
  return true;
end $$;

-- 4. Questionnaires : ordre aléatoire par élève, images, réponse numérique avec tolérance
alter table public.quiz add column if not exists melanger boolean not null default false;

create or replace function public.pp_nombre(t text) returns numeric
language plpgsql immutable as $$
declare s text := lower(coalesce(t, ''));
begin
  s := replace(replace(replace(s, ' ', ''), chr(160), ''), ',', '.');
  s := regexp_replace(s, '(×|x|\*|·)10\^?', 'e');
  s := replace(replace(s, '−', '-'), '–', '-');
  s := regexp_replace(s, '[^0-9e.+-].*$', '');          -- ignore l'unité écrite après le nombre
  if s !~ '^[+-]?([0-9]+\.?[0-9]*|\.[0-9]+)(e[+-]?[0-9]+)?$' then return null; end if;
  return s::numeric;
exception when others then return null;
end $$;

create or replace function public.pp_juste(t text, rep jsonb, bon jsonb) returns boolean
language plpgsql immutable as $$
declare v numeric; r numeric; tol numeric;
begin
  if rep is null or rep = 'null'::jsonb or bon is null then return false; end if;
  if t = 'cases' then
    if jsonb_typeof(rep) <> 'array' or jsonb_typeof(bon) <> 'array' then return false; end if;
    return coalesce((select jsonb_agg(x order by x) from (select distinct x from jsonb_array_elements(rep) x) a), '[]')
         = coalesce((select jsonb_agg(x order by x) from (select distinct x from jsonb_array_elements(bon) x) b), '[]');
  elsif t = 'courte' then
    if jsonb_typeof(bon) <> 'array' or public.pp_norm(rep #>> '{}') = '' then return false; end if;
    return exists (select 1 from jsonb_array_elements_text(bon) a where public.pp_norm(a) = public.pp_norm(rep #>> '{}'));
  elsif t = 'num' then
    if jsonb_typeof(bon) <> 'object' then return false; end if;
    v := public.pp_nombre(bon ->> 'v'); r := public.pp_nombre(rep #>> '{}'); tol := coalesce(public.pp_nombre(bon ->> 'tol'), 0);
    if v is null or r is null then return false; end if;
    if v = 0 then return abs(r) <= tol / 100; end if;
    return abs(r - v) <= abs(v) * tol / 100;
  else
    return (rep #>> '{}') = (bon #>> '{}');
  end if;
end $$;

select 'PhysiquePro : améliorations installées ✓' as resultat;
