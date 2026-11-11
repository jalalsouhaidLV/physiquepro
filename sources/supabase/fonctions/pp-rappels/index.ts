// PhysiquePro · fonction Supabase « pp-rappels » (étape 39, 11/11/2026)
// Lancée chaque jour à 16 h UTC (18 h à Beyrouth l'hiver, 19 h l'été) par la tâche pg_cron « pp-rappels-veille ».
// Envoie une notification push aux élèves qui n'ont pas encore rendu un devoir (ou fait un questionnaire)
// dont la date limite tombe DEMAIN (jour de Beyrouth). Un même rappel n'est jamais envoyé deux fois (pp_rappels_envoyes).
// Sécurité : pas de jeton utilisateur (verify_jwt = false) ; l'appel doit porter l'en-tête x-pp-cle égal à la clé
// rangée dans pp_rappels_cle (créée par le script 39, lisible seulement par le rôle service et par la tâche pg_cron).
// { "essai": true } : calcule sans rien envoyer (pour vérifier).
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.117.2";

const rep = (corps: unknown, statut = 200) => new Response(JSON.stringify(corps), { status: statut, headers: { "Content-Type": "application/json" } });
const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const PROF = "jalal.souhaid@lycee-verdun.edu.lb";

/* début et fin de « demain » à Beyrouth, en UTC */
function demainBeyrouth() {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Beirut", year: "numeric", month: "2-digit", day: "2-digit" });
  const auj = fmt.format(new Date());                                  // AAAA-MM-JJ à Beyrouth
  const [a, m, j] = auj.split("-").map(Number);
  const decalage = (d: Date) => { const p = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Beirut", hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(d);
    const g = (t: string) => Number(p.find(x => x.type === t)!.value); return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute")) - d.getTime(); };
  const debut0 = Date.UTC(a, m - 1, j + 1), fin0 = Date.UTC(a, m - 1, j + 2);
  return { debut: new Date(debut0 - decalage(new Date(debut0))), fin: new Date(fin0 - decalage(new Date(fin0))) };
}
const heure = (iso: string) => new Intl.DateTimeFormat("fr-FR", { timeZone: "Asia/Beirut", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)).replace(":", " h ");

Deno.serve(async (req) => {
  if (req.method !== "POST") return rep({ erreur: "méthode" }, 405);
  const { data: cle } = await service.from("pp_rappels_cle").select("cle").eq("id", 1).maybeSingle();
  if (!cle || !cle.cle || req.headers.get("x-pp-cle") !== cle.cle) return rep({ erreur: "non autorisé" }, 401);
  let corps: any = {}; try { corps = await req.json(); } catch (_) { /* vide */ }
  const essai = corps.essai === true;
  const { debut, fin } = demainBeyrouth(), maintenant = new Date().toISOString();

  const [cl, dv, qz] = await Promise.all([
    service.from("classes").select("id, nom, archive"),
    service.from("devoirs").select("id, classe_id, titre, date_limite, publie_le, brouillon, eleves, accepte").gte("date_limite", debut.toISOString()).lt("date_limite", fin.toISOString()),
    service.from("quiz").select("id, classe_id, titre, date_limite, publie_le, brouillon, eleves, mode").gte("date_limite", debut.toISOString()).lt("date_limite", fin.toISOString()),
  ]);
  const classes = new Map((cl.data || []).map((c: any) => [c.id, c]));
  const visible = (o: any) => !o.brouillon && (!o.publie_le || o.publie_le <= maintenant) && classes.has(o.classe_id) && !classes.get(o.classe_id).archive;
  const devoirs = (dv.data || []).filter((d: any) => visible(d) && d.accepte !== false);
  const quiz = (qz.data || []).filter(visible);
  if (!devoirs.length && !quiz.length) return rep({ demain: debut, travaux: 0, eleves: 0, envoyes: 0 });

  const ids = [...new Set([...devoirs, ...quiz].map((o: any) => o.classe_id))];
  const [ins, rd, rq, pr, deja] = await Promise.all([
    service.from("inscriptions").select("classe_id, email").in("classe_id", ids),
    devoirs.length ? service.from("rendus").select("devoir_id, auteur_email, binome_email").in("devoir_id", devoirs.map((d: any) => d.id)) : Promise.resolve({ data: [] }),
    quiz.length ? service.from("resultats_quiz").select("quiz_id, eleve").in("quiz_id", quiz.map((q: any) => q.id)) : Promise.resolve({ data: [] }),
    service.from("profiles").select("id, email, prefs"),
    service.from("pp_rappels_envoyes").select("type, objet_id, email").gte("envoye_le", new Date(Date.now() - 3 * 864e5).toISOString()),
  ]);
  const emailDe = new Map((pr.data || []).map((p: any) => [p.id, String(p.email || "").toLowerCase()]));
  const sansRappel = new Set((pr.data || []).filter((p: any) => p.prefs && p.prefs.rappels === false).map((p: any) => String(p.email || "").toLowerCase()));
  const dejaEnvoye = new Set((deja.data || []).map((x: any) => x.type + ":" + x.objet_id + ":" + x.email));
  const rendu = new Set<string>(); (rd.data || []).forEach((r: any) => { [r.auteur_email, r.binome_email].filter(Boolean).forEach((e: string) => rendu.add(r.devoir_id + ":" + e.toLowerCase())); });
  const fait = new Set<string>(); (rq.data || []).forEach((r: any) => { const e = emailDe.get(r.eleve); if (e) fait.add(r.quiz_id + ":" + e); });
  const eleves = (cid: string, liste: string[] | null) => (ins.data || []).filter((i: any) => i.classe_id === cid).map((i: any) => String(i.email).toLowerCase())
    .filter((e: string) => e !== PROF && (!liste || liste.map(x => x.toLowerCase()).includes(e)));

  /* par élève : la liste de ses travaux de demain pas encore faits */
  const parEleve = new Map<string, { type: string; o: any }[]>();
  const ajoute = (e: string, type: string, o: any) => { if (sansRappel.has(e) || dejaEnvoye.has(type + ":" + o.id + ":" + e)) return; if (!parEleve.has(e)) parEleve.set(e, []); parEleve.get(e)!.push({ type, o }); };
  devoirs.forEach((d: any) => eleves(d.classe_id, d.eleves).forEach(e => { if (!rendu.has(d.id + ":" + e)) ajoute(e, "devoir", d); }));
  quiz.forEach((q: any) => eleves(q.classe_id, q.eleves).forEach(e => { if (!fait.has(q.id + ":" + e)) ajoute(e, "quiz", q); }));
  if (!parEleve.size) return rep({ demain: debut, travaux: devoirs.length + quiz.length, eleves: 0, envoyes: 0 });

  const { data: abos } = await service.from("pp_push_abonnements").select("id, email, endpoint, p256dh, auth").in("email", [...parEleve.keys()]);
  if (essai) return rep({ essai: true, demain: debut, travaux: devoirs.length + quiz.length, eleves: parEleve.size, appareils: (abos || []).length,
    detail: [...parEleve.entries()].map(([e, L]) => ({ eleve: e.replace(/^(.{3}).*@/, "$1…@"), travaux: L.map(x => x.o.titre) })) });
  if (!abos || !abos.length) return rep({ demain: debut, eleves: parEleve.size, appareils: 0, envoyes: 0 });

  const { data: k } = await service.from("pp_push_cles").select("publique, privee").eq("id", 1).maybeSingle();
  if (!k) return rep({ erreur: "clés push absentes (aucun élève abonné ?)" }, 500);
  webpush.setVapidDetails("mailto:" + PROF, k.publique, k.privee);
  let ok = 0; const perimes: number[] = [], recus = new Set<string>();
  await Promise.all(abos.map(async (a: any) => {
    const L = parEleve.get(a.email) || []; if (!L.length) return;
    const un = L.length === 1 ? L[0] : null;
    const msg = JSON.stringify(un ? {
      titre: "Demain : " + String(un.o.titre).slice(0, 80),
      texte: (un.type === "quiz" ? "Questionnaire à faire" : "À rendre") + " avant " + heure(un.o.date_limite) + " · " + (classes.get(un.o.classe_id)?.nom || "") + ". Pas encore fait.",
      url: "./index.html#/" + (un.type === "quiz" ? "quiz/" : "devoir/") + un.o.id, tag: "rappel-" + un.type + "-" + un.o.id,
    } : { titre: "Demain : " + L.length + " travaux à rendre", texte: L.map(x => "• " + x.o.titre).join("\n").slice(0, 280), url: "./index.html#/todo", tag: "rappel-demain" });
    try { await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, msg, { TTL: 12 * 3600, urgency: "normal" }); ok++; recus.add(a.email); }
    catch (e: any) { if (e && (e.statusCode === 404 || e.statusCode === 410)) perimes.push(a.id); }
  }));
  if (perimes.length) await service.from("pp_push_abonnements").delete().in("id", perimes);
  const lignes = [...recus].flatMap(e => (parEleve.get(e) || []).map(x => ({ type: x.type, objet_id: x.o.id, email: e })));
  if (lignes.length) await service.from("pp_rappels_envoyes").upsert(lignes, { onConflict: "type,objet_id,email", ignoreDuplicates: true });
  return rep({ demain: debut, eleves: parEleve.size, appareils: abos.length, envoyes: ok, perimes: perimes.length });
});
