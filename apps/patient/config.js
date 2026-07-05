// SaathiPill — patient front-end configuration.
//
// Works the same in local dev and in production without editing this file:
//   • Local dev   → talks to http://localhost:3000 (backend on your machine).
//   • Production  → the container regenerates env.js from API_URL / SOCKET_URL,
//                   so the same static files run on any domain.
// Leaving the API URL empty makes the app run on local demo data (no backend).
(function () {
  var env = window.__SP_ENV__ || {};
  var isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
  var defaultApi = isLocal ? 'http://localhost:3000' : '';

  window.SAATHIPILL_CONFIG = {
    apiUrl: env.API_URL != null ? env.API_URL : defaultApi,
    socketUrl: env.SOCKET_URL != null ? env.SOCKET_URL : (env.API_URL != null ? env.API_URL : defaultApi),

    // Designer/demo tools (screen-navigator + tweaks panel + phone mockup on
    // desktop). Keep false for the real product.
    devTools: env.DEV_TOOLS === true,
  };
})();
