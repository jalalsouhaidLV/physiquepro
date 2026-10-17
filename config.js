// =====================================================================
//  PhysiquePro · réglages
//  C'est le seul fichier à modifier pour changer un lien ou un nom.
// =====================================================================
window.PHYSIQUEPRO = {
  supabaseUrl: "https://zycuykixcjgmdbeoflsb.supabase.co",
  supabaseKey: "sb_publishable_o2Km-g2VoDde3e2aYKKKgA_i2EmGdoD",

  domaine: "lycee-verdun.edu.lb",
  prof: {
    nom: "Jalal SOUHAID",
    email: "jalal.souhaid@lycee-verdun.edu.lb",
    titre: "Professeur de Physique-Chimie · Coordinateur du département de Physique-Chimie"
  },

  // Icônes en haut de chaque page (nom affiché sous l'icône)
  liensUtiles: [
    { nom: "Pronote",  url: "https://2050012z.index-education.net/pronote/eleve.html", icone: "pronote", couleur: "#1E8C45", principal: true },
    { nom: "PIX",      url: "https://app.pix.fr/connexion",  icone: "pix",    couleur: "#5B3FD6" },
    { nom: "Lycée",    url: "https://www.lycee-verdun.edu.lb/", icone: "ecole", couleur: "#116482" },
    { nom: "Outlook",  url: "https://outlook.office.com",     icone: "mail",   couleur: "#0F6CBD" },
    { nom: "OneDrive", url: "https://glfl-my.sharepoint.com/_layouts/15/MySite.aspx?MySiteRedirect=AllDocuments", icone: "nuage", couleur: "#0364B8" }
  ],

  outils: [
    { matiere: "Physique-Chimie", couleur: "pc", liens: [
      ["PhET", "Simulations interactives", "https://phet.colorado.edu/fr/"],
      ["GeoGebra", "Graphiques et calculs", "https://www.geogebra.org"] ] },
    { matiere: "SNT · SI", couleur: "snt", liens: [
      ["Thonny", "Éditeur Python", "https://thonny.org"],
      ["Tinkercad", "Modélisation 3D", "https://www.tinkercad.com"],
      ["Filius", "Simulateur de réseau", "https://www.lernsoftware-filius.de"] ] },
    { matiere: "Technologie", couleur: "tech", liens: [
      ["MakeCode", "Programmer la micro:bit", "https://makecode.microbit.org/#lang=fr"] ] },
    { matiere: "PIX", couleur: "pix", liens: [
      ["PIX", "Connexion à la plateforme", "https://app.pix.fr/connexion"] ] }
  ]
};
