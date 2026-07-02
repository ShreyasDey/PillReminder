// SaathiPill — front-end configuration.
// Leave apiUrl empty to run the app fully on local demo data (no backend needed).
// To connect the real backend, set apiUrl (and socketUrl) to where it runs.
window.SAATHIPILL_CONFIG = {
  apiUrl: "http://localhost:3000",
  socketUrl: "http://localhost:3000",

  // Designer/demo tools (screen-navigator sidebar + tweaks panel + phone mockup
  // on desktop). Keep false for the real product. Set true while demoing on a
  // big screen if you want to jump between screens.
  devTools: false,
};
