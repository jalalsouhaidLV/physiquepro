/* =====================================================================
   PhysiquePro · 32 · 3e évaluation (11/11/2026), lots I et K
   ---------------------------------------------------------------------
   Lot I : sur téléphone, la touche Retour d'Android (ou le glissement
   « retour » de l'iPhone) ferme d'abord le menu, la cloche, un menu
   déroulant ou une fenêtre ouverte, au lieu de quitter la page.
   Principe : quand une de ces « couches » s'ouvre, une étape est ajoutée
   à l'historique (même adresse, donc pas de changement de page) ; Retour
   la retire et referme la couche. Si la couche a été fermée autrement
   (voile, croix, Échap), Retour saute cette étape devenue inutile.
   Lot K : lien « Aller au contenu » (clavier, lecteurs d'écran).
   ===================================================================== */
const COUCHE = { etat: null };
const coucheOuverte = () => !!((S.drawer && window.innerWidth < 1100) || S.bell || S.dd || S.me || S.menu || S.apps || (S.modal && !S.modal.busy) || S.viewer);
const surCouche = () => !!(history.state && history.state.ppCouche);
APRES_RENDU.push(() => {
  if (coucheOuverte() && !surCouche()) { try { history.pushState({ ...(history.state || {}), ppCouche: true }, "", location.href); } catch (_) {} }
  COUCHE.etat = { c: surCouche(), h: location.href };
});
window.addEventListener("popstate", () => {
  const avant = COUCHE.etat; COUCHE.etat = { c: surCouche(), h: location.href };
  if (coucheOuverte()) {
    if (window.innerWidth < 1100) S.drawer = false;
    fermerMenus(); if (S.modal && !S.modal.busy) S.modal = null; S.viewer = null;
    render(); return;
  }
  /* la couche avait déjà été fermée (voile, croix, Échap) : cette étape ne sert plus, on passe directement à la page d'avant */
  if (avant && avant.c && !COUCHE.etat.c && avant.h === location.href) history.back();
});
/* « Aller au contenu » : place le clavier au début de la page (sans changer l'adresse #/…) */
document.addEventListener("click", e => {
  const a = e.target.closest && e.target.closest("[data-saut]"); if (!a) return;
  e.preventDefault();
  const m = document.querySelector("main.content"); if (!m) return;
  m.setAttribute("tabindex", "-1"); m.focus(); m.scrollIntoView({ block: "start" });
});
