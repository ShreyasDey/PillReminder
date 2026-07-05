// Web Push enablement for the pharmacy portal. Registers the service worker,
// asks for notification permission, and stores the browser's push subscription
// on the backend so restock reminders and new-order alerts reach this desktop
// even when the portal tab is closed. Mirrors the patient app's push-client.

(function () {
  function urlB64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    var raw = atob(base64);
    var arr = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
  }

  var supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  var reg = null;

  async function register() {
    if (!supported) return null;
    if (reg) return reg;
    reg = await navigator.serviceWorker.register('sw.js');
    return reg;
  }

  async function isEnabled() {
    if (!supported) return false;
    try {
      var r = await navigator.serviceWorker.getRegistration();
      if (!r) return false;
      var s = await r.pushManager.getSubscription();
      return !!s;
    } catch (e) { return false; }
  }

  async function enable() {
    var api = window.PortalAPI;
    if (!supported) throw new Error('This browser does not support notifications.');
    if (!(api && api.enabled && api.hasSession())) throw new Error('Please sign in first.');
    var perm = await Notification.requestPermission();
    if (perm !== 'granted') throw new Error('Notifications are blocked. Enable them in your browser settings.');
    var r = await register();
    var keyResp = await api.vapidKey();
    if (!keyResp || !keyResp.publicKey) throw new Error('Notifications are not configured on the server.');
    var existing = await r.pushManager.getSubscription();
    var sub = existing || (await r.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(keyResp.publicKey),
    }));
    var json = sub.toJSON();
    await api.subscribePush({ endpoint: sub.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } });
    return true;
  }

  async function disable() {
    try {
      var r = await navigator.serviceWorker.getRegistration();
      if (!r) return;
      var s = await r.pushManager.getSubscription();
      if (s) {
        var ep = s.endpoint;
        await s.unsubscribe();
        if (window.PortalAPI) await window.PortalAPI.unsubscribePush(ep).catch(function () {});
      }
    } catch (e) {}
  }

  // Ask for permission automatically when the portal opens (signed in). Never
  // throws and never nags: a denied/blocked browser is left alone, and the
  // Settings toggle remains the manual path. Also re-subscribes silently when
  // permission is already granted but the subscription was lost.
  async function autoEnable() {
    try {
      var api = window.PortalAPI;
      if (!supported) return false;
      if (!(api && api.enabled && api.hasSession())) return false;
      if (Notification.permission === 'denied') return false;
      if (Notification.permission === 'default') {
        var perm = await Notification.requestPermission();
        if (perm !== 'granted') return false;
      }
      await enable();
      return true;
    } catch (e) { return false; }
  }

  window.PortalPush = {
    supported: supported,
    register: register,
    isEnabled: isEnabled,
    enable: enable,
    autoEnable: autoEnable,
    disable: disable,
    permission: function () { return supported ? Notification.permission : 'unsupported'; },
  };
})();
