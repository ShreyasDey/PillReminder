// Runtime environment overrides — injected at deploy time.
// In local dev this file is empty and config.js falls back to localhost.
// In production the frontend container regenerates it from environment variables
// (API_URL, SOCKET_URL, PATIENT_APP_URL) so the SAME static files work anywhere.
window.__SP_ENV__ = window.__SP_ENV__ || {};
