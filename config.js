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

  liensUtiles: [
    { nom: "Pronote", detail: "LFL Verdun", eleve: "https://2050012z.index-education.net/pronote/eleve.html", prof: "https://2050012z.index-education.net/pronote/professeur.html" },
    { nom: "PIX", detail: "connexion", url: "https://app.pix.fr/connexion" },
    { nom: "Site du lycée", detail: "LFL Verdun", url: "https://www.lycee-verdun.edu.lb/" },
    { nom: "Outlook", detail: "Microsoft 365", url: "https://outlook.office.com" },
    { nom: "OneDrive / Office", detail: "Microsoft 365", url: "https://www.office.com" }
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
