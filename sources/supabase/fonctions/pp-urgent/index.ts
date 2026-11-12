// PhysiquePro · fonction Supabase « pp-urgent » (étape 48, 12/11/2026)
// Prévient le téléphone (et l'ordinateur) du professeur quand un élève envoie un message urgent.
// POURQUOI côté serveur : jusqu'ici, c'était le site ouvert chez l'ÉLÈVE qui demandait la notification (pp-push « urgent »).
// Un élève sur une copie plus ancienne du site (Netlify, publiée seulement le dimanche) ne la demandait jamais :
// le 12/11/2026, les 6 messages venus de physiquepro.netlify.app n'ont rien déclenché, ceux de github.io si.
// Maintenant la base de données appelle cette fonction elle-même :
//   - tout de suite, par le déclencheur pp_urgent_signaler (script 48) à chaque nouveau message d'élève ;
//   - puis chaque minute (tâche pg_cron « pp-urgent-filet ») tant qu'un message récent n'a pas été remis.
// Chaque appel traite TOUS les messages d'élèves des 15 dernières minutes pas encore remis : rien n'est pris dans la demande.
// Le résultat (appareils, envoyés, erreurs) est rangé dans pp_push_urgents : le prof le voit dans la Messagerie d'urgence.
// Sécurité : pas de jeton utilisateur (verify_jwt = false) ; l'appel doit porter l'en-tête x-pp-cle égal à la clé
// de pp_rappels_cle (script 39, lisible seulement par le rôle service et la base), comme pp-rappels.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.117.2";

const rep = (corps: unknown, statut = 200) => new Response(JSON.stringify(corps), { status: statut, headers: { "Content-Type": "application/json" } });
const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const ESSAIS_MAX = 6;          // un essai tout de suite, puis un par minute
const EN_COURS_MS = 45_000;    // un autre appel s'en occupe déjà

async function traiter(m: any, abos: any[], nomClasse: string) {
  // 1. réserver le message (la clé primaire empêche deux envois en même temps)
  const { error: dejaPris } = await service.from("pp_push_urgents").insert({ message_id: m.id, termine: false, essais: 1 });
  let essai = 1;
  if (dejaPris) {
    const { data: l } = await service.from("pp_push_urgents").select("termine, essais, envoye_le").eq("message_id", m.id).maybeSingle();
    if (!l || l.termine || l.essais >= ESSAIS_MAX || Date.now() - new Date(l.envoye_le).getTime() < EN_COURS_MS) return { id: m.id, saute: true };
    const { data: pris } = await service.from("pp_push_urgents").update({ essais: l.essais + 1, envoye_le: new Date().toISOString() })
      .eq("message_id", m.id).eq("essais", l.essais).eq("termine", false).select("essais");
    if (!pris || !pris.length) return { id: m.id, saute: true };
    essai = l.essais + 1;
  }
  // 2. envoyer à tous les appareils abonnés du prof
  const message = JSON.stringify({
    titre: ("⚠ Message urgent · " + (m.eleve_nom || m.eleve_email || "un élève")).slice(0, 120),
    texte: ((nomClasse ? nomClasse + " · " : "") + String(m.texte || "")).slice(0, 300),
    url: "./#/urgences",
    tag: "urgprof-" + m.id,
    insistant: true,
  });
  let ok = 0; const erreurs: string[] = []; const perimes: number[] = [];
  await Promise.all(abos.map(async (a) => {
    try {
      await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, message, { TTL: 24 * 3600, urgency: "high", topic: ("u" + m.id).slice(0, 32) });
      ok++;
    } catch (e: any) {
      const code = e && e.statusCode ? Number(e.statusCode) : 0;
      erreurs.push((a.appareil || "appareil") + " " + (code || String(e && e.message || e).slice(0, 60)));
      if (code === 404 || code === 410) perimes.push(a.id);
    }
  }));
  if (perimes.length) await service.from("pp_push_abonnements").delete().in("id", perimes);
  // 3. terminé si au moins un appareil a reçu, ou s'il n'y a aucun appareil à prévenir, ou après le dernier essai
  const termine = ok > 0 || abos.length - perimes.length <= 0 || essai >= ESSAIS_MAX;
  await service.from("pp_push_urgents").update({ termine, envoyes: ok, appareils: abos.length, detail: erreurs.join(" ; ").slice(0, 500) || null, envoye_le: new Date().toISOString() }).eq("message_id", m.id);
  return { id: m.id, essai, envoyes: ok, appareils: abos.length, erreurs: erreurs.length, termine };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return rep({ erreur: "méthode" }, 405);
  const { data: cle } = await service.from("pp_rappels_cle").select("cle").eq("id", 1).maybeSingle();
  if (!cle || !cle.cle || req.headers.get("x-pp-cle") !== cle.cle) return rep({ erreur: "non autorisé" }, 401);

  const depuis = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data: msgs } = await service.from("messages_urgents").select("id, classe_id, eleve_nom, eleve_email, texte, cree_le").eq("de_prof", false).gte("cree_le", depuis).order("id");
  if (!msgs || !msgs.length) return rep({ messages: 0 });
  const { data: faits } = await service.from("pp_push_urgents").select("message_id").eq("termine", true).in("message_id", msgs.map((m: any) => m.id));
  const finis = new Set((faits || []).map((f: any) => f.message_id));
  const reste = msgs.filter((m: any) => !finis.has(m.id));
  if (!reste.length) return rep({ messages: 0 });

  const { data: k } = await service.from("pp_push_cles").select("publique, privee").eq("id", 1).single();
  webpush.setVapidDetails("mailto:physiquepro@lycee-verdun.edu.lb", k!.publique, k!.privee);
  const { data: profs } = await service.from("profiles").select("id").eq("role", "prof");
  const ids = (profs || []).map((p: any) => p.id);
  const { data: abos } = ids.length ? await service.from("pp_push_abonnements").select("id, endpoint, p256dh, auth, appareil").in("user_id", ids) : { data: [] };
  const { data: cl } = await service.from("classes").select("id, nom").in("id", [...new Set(reste.map((m: any) => m.classe_id))]);
  const noms = new Map((cl || []).map((c: any) => [c.id, c.nom]));

  const res = [];
  for (const m of reste) res.push(await traiter(m, abos || [], noms.get(m.classe_id) || ""));
  return rep({ messages: res.length, resultats: res });
});
