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
    titre: "Professeur de Physique-Chimie au Lycée Franco-Libanais Verdun"
  },

  // Icônes en haut de chaque page (nom affiché sous l'icône)
  liensUtiles: [
    { nom: "Pronote Verdun", url: "https://2050012z.index-education.net/pronote/", icone: "logo-pronote", couleur: "#1E8C45", principal: true },
    { nom: "Lycée Verdun", url: "https://www.lycee-verdun.edu.lb/", icone: "logo-lycee", couleur: "#116482" },
    { nom: "PIX",      url: "https://app.pix.fr/connexion",  icone: "logo-pix",    couleur: "#5B3FD6" },
    { nom: "PIX Orga", url: "https://orga.pix.fr/connexion", icone: "logo-pixorga", couleur: "#3D68FF", prof: true },
    { nom: "WhatsApp Web", url: "https://web.whatsapp.com/", icone: "logo-whatsapp", couleur: "#25D366" },
    { nom: "E-mail Outlook", url: "https://outlook.office.com",     icone: "logo-outlook", couleur: "#0F6CBD" },
    { nom: "OneDrive", url: "https://glfl-my.sharepoint.com/_layouts/15/MySite.aspx?MySiteRedirect=AllDocuments", icone: "logo-onedrive", couleur: "#0364B8" },
    { nom: "Claude", url: "https://claude.ai/login", icone: "logo-claude", couleur: "#D97757", ordi: true },
    { nom: "ChatGPT", url: "https://chatgpt.com/auth/login", icone: "logo-chatgpt", couleur: "#10A37F", ordi: true },
    { nom: "Copilot", url: "https://m365.cloud.microsoft/fr-fr/", icone: "logo-copilot", couleur: "#7B61FF", ordi: true },
    { nom: "Gemini", url: "https://gemini.google.com/app", icone: "logo-gemini", couleur: "#4285F4", ordi: true },
    { nom: "Notebook", url: "https://notebook.google.com/trynow", icone: "logo-notebook", couleur: "#1A73E8", ordi: true },
    { nom: "NumWorks", url: "https://www.numworks.com/fr/emulateur/graphique/", icone: "logo-numworks", couleur: "#FFB531" }
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
