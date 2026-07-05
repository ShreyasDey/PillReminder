// SaathiPill — pharmacy portal configuration.
//
// Works the same in local dev and in production without editing this file:
//   • Local dev   → talks to http://localhost:3000, patient app on :5173.
//   • Production  → the container regenerates env.js from API_URL / SOCKET_URL /
//                   PATIENT_APP_URL, so the same static files run on any domain.
(function () {
  var env = window.__SP_ENV__ || {};
  var isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
  var defaultApi = isLocal ? 'http://localhost:3000' : '';
  var defaultPatientApp = isLocal ? 'http://localhost:5173' : '';

  window.SAATHIPILL_CONFIG = {
    apiUrl: env.API_URL != null ? env.API_URL : defaultApi,
    socketUrl: env.SOCKET_URL != null ? env.SOCKET_URL : (env.API_URL != null ? env.API_URL : defaultApi),

    // Where the PATIENT app lives — used to build the join link inside the QR
    // code that pharmacies print for their counter.
    patientAppUrl: env.PATIENT_APP_URL != null ? env.PATIENT_APP_URL : defaultPatientApp,
  };
})();
