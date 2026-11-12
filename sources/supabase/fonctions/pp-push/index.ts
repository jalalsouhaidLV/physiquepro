// PhysiquePro · fonction Supabase « pp-push » (étape 37, 11/11/2026 ; version 2 le 11/11 au soir : jeton lu même si la session a été fermée ailleurs ;
// version 3 le 12/11/2026 : action « urgent », le prof est prévenu sur son téléphone quand un élève envoie un message urgent)
// - { action: "cle" }  : renvoie la clé publique VAPID (tout compte connecté).
//   La paire de clés est créée ici la première fois et rangée dans pp_push_cles
//   (lisible seulement par le rôle service) : personne n'a à la copier.
// - { action: "envoyer", emails: [...], titre, texte, url } : prof seulement.
//   Envoie la notification à tous les appareils abonnés de ces élèves ;
//   supprime les abonnements périmés (réponse 404 ou 410).
// - { action: "urgent", id } : l'élève qui vient d'écrire le message urgent n° id.
//   Le message est relu dans la base (texte, nom, cours : rien n'est pris dans la demande),
//   il doit être à lui, récent (moins de 10 min) et pas encore signalé (pp_push_urgents) :
//   la fonction prévient alors tous les appareils abonnés du prof, une seule fois.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.117.2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const rep = (corps: unknown, statut = 200) =>
  new Response(JSON.stringify(corps), { status: statut, headers: { ...CORS, "Content-Type": "application/json" } });

const URL_SB = Deno.env.get("SUPABASE_URL")!;
const service = createClient(URL_SB, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

async function cles() {
  const { data } = await service.from("pp_push_cles").select("publique, privee").eq("id", 1).maybeSingle();
  if (data) return data;
  const k = webpush.generateVAPIDKeys();
  await service.from("pp_push_cles").insert({ id: 1, publique: k.publicKey, privee: k.privateKey });
  const { data: d2 } = await service.from("pp_push_cles").select("publique, privee").eq("id", 1).single();
  return d2!;
}

// Qui appelle ? La passerelle Supabase (verify_jwt) a déjà vérifié la signature et l'expiration du jeton.
// getUser() refuse en plus un jeton dont la session a été fermée sur un AUTRE appareil (déconnexion « globale ») :
// c'est ce qui bloquait les notifications du prof le 11/11/2026 (401) alors que l'enregistrement du message réussissait.
// On lit donc les informations du jeton vérifié quand getUser() échoue (même règle que la base de données).
async function utilisateur(jeton: string): Promise<{ user: { id: string; email?: string } } | null> {
  const { data } = await service.auth.getUser(jeton);
  if (data && data.user) return { user: { id: data.user.id, email: data.user.email } };
  try {
    const p = JSON.parse(atob(jeton.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (p && p.sub && p.role === "authenticated" && Number(p.exp) * 1000 > Date.now()) return { user: { id: String(p.sub), email: p.email } };
  } catch (_) { /* jeton illisible */ }
  return null;
}

// envoie la notification à une liste d'appareils ; supprime les abonnements périmés (404 ou 410)
async function pousser(abos: any[], corps: any, mail: string | null | undefined) {
  const k = await cles();
  webpush.setVapidDetails("mailto:" + (mail || "physiquepro@lycee-verdun.edu.lb"), k.publique, k.privee);
  const message = JSON.stringify({
    titre: String(corps.titre || "PhysiquePro").slice(0, 120),
    texte: String(corps.texte || "").slice(0, 300),
    url: String(corps.url || "./").slice(0, 300),
    tag: String(corps.tag || "pp").slice(0, 60),
  });
  let ok = 0; const perimes: number[] = []; const personnes = new Set<string>();
  await Promise.all(abos.map(async (a) => {
    try {
      await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, message, { TTL: 7 * 24 * 3600, urgency: "high" });
      ok++; personnes.add(a.email);
    } catch (e: any) {
      if (e && (e.statusCode === 404 || e.statusCode === 410)) perimes.push(a.id);
    }
  }));
  if (perimes.length) await service.from("pp_push_abonnements").delete().in("id", perimes);
  return { ok, personnes: personnes.size, perimes: perimes.length };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return rep({ erreur: "méthode" }, 405);
  const jeton = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const u = await utilisateur(jeton);
  if (!u) return rep({ erreur: "non connecté" }, 401);
  let corps: any = {};
  try { corps = await req.json(); } catch (_) { /* vide */ }

  if (corps.action === "cle") return rep({ cle: (await cles()).publique });

  if (corps.action === "envoyer") {
    const { data: prof } = await service.from("profiles").select("role").eq("id", u.user.id).maybeSingle();
    if (!prof || prof.role !== "prof") return rep({ erreur: "réservé au professeur" }, 403);
    const emails = [...new Set((Array.isArray(corps.emails) ? corps.emails : []).map((e: unknown) => String(e).toLowerCase()))].slice(0, 300);
    if (!emails.length) return rep({ envoyes: 0, appareils: 0 });
    const { data: abos } = await service.from("pp_push_abonnements").select("id, email, endpoint, p256dh, auth").in("email", emails);
    const r = await pousser(abos || [], corps, u.user.email);
    return rep({ envoyes: r.ok, eleves: r.personnes, appareils: (abos || []).length, perimes: r.perimes });
  }

  if (corps.action === "urgent") {
    const id = Number(corps.id);
    if (!Number.isFinite(id) || id <= 0) return rep({ erreur: "message inconnu" }, 400);
    const { data: m } = await service.from("messages_urgents").select("id, classe_id, eleve, eleve_nom, eleve_email, texte, cree_le, de_prof").eq("id", id).maybeSingle();
    if (!m || m.de_prof || m.eleve !== u.user.id) return rep({ erreur: "message inconnu" }, 403);
    if (Date.now() - new Date(m.cree_le).getTime() > 10 * 60 * 1000) return rep({ erreur: "message trop ancien" }, 409);
    // une seule notification par message (la clé primaire refuse un 2e envoi)
    const { error: deja } = await service.from("pp_push_urgents").insert({ message_id: id });
    if (deja) return rep({ envoyes: 0, deja: true });
    const { data: profs } = await service.from("profiles").select("id").eq("role", "prof");
    const ids = (profs || []).map((p: any) => p.id);
    if (!ids.length) return rep({ envoyes: 0, appareils: 0 });
    const { data: abos } = await service.from("pp_push_abonnements").select("id, email, endpoint, p256dh, auth").in("user_id", ids);
    const { data: c } = await service.from("classes").select("nom").eq("id", m.classe_id).maybeSingle();
    const r = await pousser(abos || [], {
      titre: "⚠ Message urgent · " + (m.eleve_nom || m.eleve_email || "un élève"),
      texte: (c && c.nom ? c.nom + " · " : "") + String(m.texte || ""),
      url: "./#/urgences",
      tag: "urgprof-" + id,
    }, null);
    return rep({ envoyes: r.ok, appareils: (abos || []).length, perimes: r.perimes });
  }
  return rep({ erreur: "action inconnue" }, 400);
});
