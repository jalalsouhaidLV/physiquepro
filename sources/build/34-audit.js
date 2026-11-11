/* =====================================================================
   34 · Lots C et D de l'audit sur 20 (11/11/2026)
   C. Page « Tes données » (#/donnees), ouverte aussi aux visiteurs, et demande d'effacement
   D. La touche Tab reste dans la fenêtre ouverte ; images en erreur et bouton « Recharger »
      sans code écrit dans la page (pour la règle de sécurité CSP d'index.html)
   ===================================================================== */

/* ---------------------------------------------------------------- C. Page « Tes données » */
VUES_PRO.donnees = function(){
  const prof = "M. " + esc(nomProfSans()), mail = (CFG.prof && CFG.prof.email) || "";
  const sujet = "Demande d'effacement de mes données PhysiquePro";
  const corps = "Bonjour Monsieur,\n\nJe vous demande d'effacer mon compte et mes données du site PhysiquePro.\n\nNom et classe : \n\nMerci.";
  const lienMail = "mailto:" + mail + "?subject=" + encodeURIComponent(sujet) + "&body=" + encodeURIComponent(corps);
  const bloc = (ic, titre, html) => `<section class="edcard dncarte"><h2>${icon(ic)} ${titre}</h2>${html}</section>`;
  return `<div class="page donnees"><div class="homehead"><h1>Tes données sur PhysiquePro</h1></div>
    <p class="muted dnintro">Cette page explique, simplement, ce que le site garde sur toi, qui peut le voir et comment le faire effacer. Montre-la à tes parents s'ils te posent la question.</p>
    ${bloc("people", "Ce que le site garde", `<ul>
      <li><b>Ton identité</b> : ton nom et ton adresse du lycée, donnés par ton compte Microsoft 365. Le site ne connaît jamais ton mot de passe.</li>
      <li><b>Ton travail</b> : tes cours, les fichiers et les liens que tu rends, tes réponses aux questionnaires, tes notes et les appréciations.</li>
      <li><b>Tes messages</b> : tes commentaires, tes questions privées au professeur, tes messages d'urgence et tes rendez-vous.</li>
      <li><b>Tes notes personnelles</b> (Coin perso) et tes réglages (apparence, police).</li>
      <li><b>Tes visites</b> : le nombre de visites, la date de la dernière, si tu es en ligne, et le type d'appareil (par exemple « iPhone » ou « PC »).</li>
      <li><b>Les notifications</b>, seulement si tu les as acceptées : une adresse technique qui permet d'envoyer une alerte à ton appareil.</li>
    </ul>`)}
    ${bloc("eye", "Qui peut voir quoi", `<ul>
      <li><b>${prof}</b> voit tout ce qui concerne ses cours.</li>
      <li><b>Les élèves de ton cours</b> voient ton nom dans la liste du cours et les commentaires que tu écris pour la classe.</li>
      <li><b>Personne d'autre</b> : un élève ne peut pas lire tes copies, tes notes, tes questions privées ni tes notes personnelles. Un visiteur non connecté ne voit aucune donnée d'élève.</li>
    </ul>`)}
    ${bloc("nuage", "Où sont rangées les données", `<ul>
      <li>La base de données du site est chez <b>Supabase</b>, sur des serveurs situés en Allemagne (Francfort).</li>
      <li>Tes copies Word et tes fichiers rendus sont dans le <b>OneDrive Microsoft 365 du lycée</b> ou dans l'espace de fichiers privé du site.</li>
      <li>Les pages du site sont servies par GitHub Pages et Netlify. Comme tout site, ils voient l'adresse internet de ton appareil, mais ni ton nom ni ton travail.</li>
    </ul>`)}
    ${bloc("links", "Les autres services", `<ul>
      <li>Le site n'a <b>aucune publicité</b> et <b>aucun outil de pistage</b>. Tes données ne sont ni vendues ni partagées.</li>
      <li>La connexion passe par <b>Microsoft</b> (ton compte du lycée).</li>
      <li>Quelques programmes nécessaires au site sont chargés depuis <b>jsDelivr</b> et <b>cdnjs</b>, deux services publics de fichiers. Les polices d'écriture sont rangées dans le site lui-même.</li>
      <li>Quand une <b>vidéo YouTube</b> est jointe à un cours, ton navigateur demande son image et son titre à YouTube. Les portraits de scientifiques viennent de Wikipédia.</li>
      <li>Les logos en haut des pages (Pronote, PIX, WhatsApp…) sont de simples liens : rien n'est envoyé tant que tu ne les touches pas.</li>
    </ul>`)}
    ${bloc("trash", "Faire corriger ou effacer tes données", `<p>Toi ou tes parents pouvez demander à ${prof} de corriger ton nom, ou d'effacer ton compte et tout ce qui s'y rattache. Il le fait depuis ses paramètres.</p>
      ${mail ? `<p class="dnact"><a class="btn" href="${esc(lienMail)}">${icon("mail")} Demander l'effacement</a><span class="muted">ou écris à <b class="dnmail">${esc(mail)}</b></span></p>` : ""}
      <p class="muted">Ce bouton ouvre ta messagerie avec un message déjà préparé. Rien n'est effacé tant que le professeur n'a pas répondu.</p>`)}
    <p class="muted dnmaj">Page mise à jour le 11 novembre 2026.</p>
    ${pageFoot()}</div>`;
};

/* ---------------------------------------------------------------- D. Tab reste dans la fenêtre ouverte (aria-modal) */
document.addEventListener("keydown", e => {
  if (e.key !== "Tab") return;
  const boites = [...document.querySelectorAll('[aria-modal="true"]')].filter(b => b.getClientRects().length);
  const boite = boites[boites.length - 1]; if (!boite) return;
  const els = [...boite.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]')].filter(x => x.getClientRects().length);
  if (!els.length) { e.preventDefault(); return; }
  const premier = els[0], dernier = els[els.length - 1], ici = document.activeElement;
  if (!boite.contains(ici)) { e.preventDefault(); (e.shiftKey ? dernier : premier).focus(); }
  else if (e.shiftKey && ici === premier) { e.preventDefault(); dernier.focus(); }
  else if (!e.shiftKey && ici === dernier) { e.preventDefault(); premier.focus(); }
});

/* ---------------------------------------------------------------- D. Images en erreur, sans « onerror » écrit dans la page */
document.addEventListener("error", e => {
  const im = e.target; if (!im || im.tagName !== "IMG" || !im.dataset || !im.dataset.err) return;
  if (im.dataset.err === "retirer") { if (im.parentNode) im.parentNode.classList.remove("img"); im.remove(); }
  else if (im.dataset.err === "vide") { if (im.parentNode) im.parentNode.classList.add("vide"); im.remove(); }
  else if (im.dataset.err === "initiales") { const s = document.createElement("span"); s.textContent = im.dataset.ini || ""; im.replaceWith(s); }
}, true);
ACTIONS_PLUS.recharger = () => location.reload();
