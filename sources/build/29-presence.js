/* =====================================================================
   Activité réelle des élèves (pour les statuts En ligne / Inactif du professeur)
   · l'activité (souris, clavier, toucher, défilement) est mémorisée pour tous les onglets
   · aucune déconnexion automatique : c'est le professeur qui déconnecte depuis le panneau
   ===================================================================== */
const ACT = { t: 0, charge: Date.now(), ecrit: 0, rpc2: true };
const cleAct = () => "pp_act_" + (S.user && S.user.id);
function derniereActivite(){
  let t = ACT.t; try { t = Math.max(t, Number(localStorage.getItem(cleAct())) || 0); } catch (_) {}
  const conn = S.user && S.user.last_sign_in_at ? Date.parse(S.user.last_sign_in_at) : 0;
  return Math.max(t, conn || 0) || ACT.charge;
}
function noterActivite(){
  ACT.t = Date.now();
  if (ACT.t - ACT.ecrit > 10000 && S.user) { ACT.ecrit = ACT.t; try { localStorage.setItem(cleAct(), String(ACT.t)); } catch (_) {} }
}
["pointerdown", "keydown", "wheel", "touchstart", "scroll"].forEach(ev => window.addEventListener(ev, noterActivite, { passive: true, capture: true }));
let actMv = 0; window.addEventListener("mousemove", () => { const n = Date.now(); if (n - actMv > 5000) { actMv = n; noterActivite(); } }, { passive: true });

const _signalerPresence = signalerPresence;
signalerPresence = async function(){
  if (!S.user || S.sortie) return;
  const id = idSession();
  if (!ACT.rpc2 || !id) return _signalerPresence();
  const inactif = Math.max(0, Math.round((Date.now() - derniereActivite()) / 1000));
  const { data, error } = await sb.rpc("pp_presence2", { p_session: id, p_appareil: nomAppareil(), p_visible: auPremierPlan(), p_inactif: inactif });
  if (error) { if (/pp_presence2|function/i.test(error.message || "")) { ACT.rpc2 = false; return _signalerPresence(); } return; }
  const r = typeof data === "string" ? JSON.parse(data) : (data || {});
  if (r.kick) deconnexionForcee();          /* seulement si le professeur a demandé la déconnexion */
};
IC.lieu = IC.lieu || '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>';
