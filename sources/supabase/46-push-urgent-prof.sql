-- =====================================================================
--  PhysiquePro · étape 46 : notification push AU PROF quand un élève envoie
--  un message urgent (12/11/2026).
--  Avant : rien ne prévenait le téléphone du prof site fermé (seule l'alerte
--  du site ouvert existait). La fonction Supabase « pp-push » (version 3) a une
--  action « urgent » : l'élève donne le numéro de SON message, la fonction relit
--  le message dans la base (texte et nom pris dans la base, jamais dans la
--  demande) et prévient les appareils abonnés du prof, UNE seule fois par message.
--
--  pp_push_urgents : les messages déjà signalés (évite les envois en double).
--  Aucun droit pour anon ni authenticated : seul le rôle service y accède.
-- =====================================================================
begin;
create table if not exists public.pp_push_urgents (
  message_id bigint primary key references public.messages_urgents(id) on delete cascade,
  envoye_le  timestamptz not null default now()
);
alter table public.pp_push_urgents enable row level security;
revoke all on public.pp_push_urgents from public, anon, authenticated;
-- aucune règle RLS : seul le rôle service (la fonction Supabase) y accède
commit;
