/* PhysiquePro · faux MSAL (OneDrive) pour les tests : aucune connexion Microsoft n'est tentée. */
(function () {
  "use strict";
  class PublicClientApplication {
    constructor(cfg) { this.cfg = cfg; }
    async initialize() {}
    async handleRedirectPromise() { return null; }
    getAllAccounts() { return []; }
    getActiveAccount() { return null; }
    setActiveAccount() {}
    async acquireTokenSilent() { throw new Error("OneDrive n'est pas disponible pendant les tests"); }
    async acquireTokenPopup() { throw new Error("OneDrive n'est pas disponible pendant les tests"); }
    async loginPopup() { throw new Error("OneDrive n'est pas disponible pendant les tests"); }
    async acquireTokenRedirect() {} async loginRedirect() {} async logoutRedirect() {} async logoutPopup() {}
  }
  class InteractionRequiredAuthError extends Error {}
  window.msal = { PublicClientApplication, InteractionRequiredAuthError, BrowserAuthError: Error };
})();
