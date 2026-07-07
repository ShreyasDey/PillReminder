// Arogya Pharmacy Portal — API client.
// Active only when window.SAATHIPILL_CONFIG.apiUrl is set. Without it the portal
// runs on local demo data exactly as before (`enabled` is false).
//
// Maps backend shapes → the shapes the existing portal screens already expect, so
// screen code is untouched.

(function () {
  var CFG = window.SAATHIPILL_CONFIG || {};
  var API = CFG.apiUrl || '';

  // Persistent session (localStorage) — stays logged in until logout / cache clear.
  function getItem(k) { return localStorage.getItem(k); }
  function token() { return getItem('spp_token'); }
  function refreshTok() { return getItem('spp_refresh'); }
  function setSession(d) {
    if (d.accessToken) localStorage.setItem('spp_token', d.accessToken);
    if (d.refreshToken) localStorage.setItem('spp_refresh', d.refreshToken);
    if (d.user) localStorage.setItem('spp_user_name', d.user.name || '');
  }
  function clearSession() {
    ['spp_token', 'spp_refresh', 'spp_user_name', 'spp_pharmacy_id'].forEach(function (k) { localStorage.removeItem(k); sessionStorage.removeItem(k); });
  }

  async function req(path, opts, retry) {
    opts = opts || {};
    opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    var t = token();
    if (t) opts.headers['Authorization'] = 'Bearer ' + t;
    var res = await fetch(API + path, opts);
    if (res.status === 401 && !retry && refreshTok()) {
      var r = await fetch(API + '/auth/token/refresh', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshTok() }),
      });
      if (r.ok) { setSession(await r.json()); return req(path, opts, true); }
      clearSession();
    }
    if (!res.ok) {
      var e = await res.json().catch(function () { return { error: 'Request failed' }; });
      throw new Error(e.error || 'Request failed');
    }
    return res.status === 204 ? null : res.json();
  }

  // ── Shape mappers: backend → existing portal screen shape ──
  var paiseToRupees = function (p) { return Math.round((p || 0) / 100); };
  function monthYear(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  }
  function riskFor(adh) {
    if (adh == null) return undefined;
    if (adh < 60) return 'switch-risk';
    if (adh < 75) return 'adherence-dip';
    return undefined;
  }
  function relativeTime(iso) {
    if (!iso) return '';
    var ms = Date.now() - new Date(iso).getTime();
    var h = Math.floor(ms / 3600000);
    if (h < 1) return Math.max(1, Math.floor(ms / 60000)) + ' min ago';
    if (h < 24) return h + 'h ago';
    return 'yesterday';
  }

  function mapPatient(p) {
    return {
      id: p.id, name: p.name, age: p.age, gender: p.gender,
      conditions: p.conditions || [], medCount: p.medCount || 0,
      adherence: p.adherence, lastRefill: p.lastRefill,
      spent: paiseToRupees(p.spent), since: monthYear(p.since),
      phone: p.phone, meds: p.meds || [], risk: riskFor(p.adherence),
      isNew: !!p.isNew,
    };
  }
  function mapRefill(r) {
    return {
      id: r.displayId, realId: r.id, patientId: r.patientId,
      name: (r.patient && r.patient.name) || '',
      placed: relativeTime(r.placedAt),
      placedTime: new Date(r.placedAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }),
      status: r.status, delivery: 'pickup',
      amount: paiseToRupees(r.amount), items: r.items || [],
      urgent: r.status === 'pending',
    };
  }
  function mapInventory(i) {
    var status = i.stock <= 0 ? 'out-of-stock' : i.stock <= i.demand7d ? 'order-soon' : 'in-stock';
    return {
      name: i.name, stock: i.stock, demand7d: i.demand7d,
      suggestedOrder: i.suggestedOrder || 0,
      mrp: paiseToRupees(i.mrp), supplier: i.supplier, status: status, id: i.id,
    };
  }

  window.PortalAPI = {
    enabled: !!API,
    hasSession: function () { return !!token(); },
    userName: function () { return localStorage.getItem('spp_user_name'); },

    requestOtp: function (phone, name) {
      return req('/auth/otp/request', { method: 'POST', body: JSON.stringify({ phone: phone, name: name }) });
    },
    verifyOtp: async function (phone, code) {
      var d = await req('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ phone: phone, code: code, role: 'pharmacist' }) });
      setSession(d);
      return d;
    },
    logout: async function () {
      var rt = refreshTok();
      // Unsubscribe this browser's push + drop the realtime socket BEFORE clearing
      // the session (both need the token / identity), then revoke it server-side.
      try { if (window.PortalPush && PortalPush.disable) await PortalPush.disable(); } catch (e) {}
      try { if (window.PharmacyBridge && PharmacyBridge.disconnectRealtime) PharmacyBridge.disconnectRealtime(); } catch (e) {}
      try { if (rt) await req('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: rt }) }); } catch (e) {}
      clearSession();
    },

    me: function () { return req('/portal/me'); },
    // Place search for manual location entry (used when GPS is denied at registration).
    geocode: function (q) { return req('/geocode?q=' + encodeURIComponent(q)); },
    createPharmacy: async function (body) {
      var d = await req('/portal/pharmacies', { method: 'POST', body: JSON.stringify(body) });
      if (d.accessToken) setSession(d); // token now carries the new pharmacyId
      if (d.pharmacy) localStorage.setItem('spp_pharmacy_id', d.pharmacy.id);
      return d;
    },
    updatePharmacy: function (body) { return req('/portal/pharmacy', { method: 'PATCH', body: JSON.stringify(body) }); },

    createInventory: function (body) { return req('/portal/inventory', { method: 'POST', body: JSON.stringify(body) }); },
    setInventoryStock: function (id, stock) { return req('/portal/inventory/' + id, { method: 'PATCH', body: JSON.stringify({ stock: stock }) }); },
    patients: async function () { return (await req('/portal/patients')).map(mapPatient); },
    patientDetail: function (id) { return req('/portal/patients/' + id); },
    refills: async function () { return (await req('/portal/refills')).map(mapRefill); },
    inventory: async function () { return (await req('/portal/inventory')).map(mapInventory); },
    dashboard: function () { return req('/portal/dashboard'); },
    offers: function () { return req('/portal/offers'); },
    createOffer: function (body) { return req('/portal/offers', { method: 'POST', body: JSON.stringify(body) }); },
    updateOffer: function (id, body) { return req('/portal/offers/' + id, { method: 'PATCH', body: JSON.stringify(body) }); },

    // Web Push (desktop notifications for restock reminders + new orders).
    vapidKey: function () { return req('/portal/push/vapid'); },
    subscribePush: function (sub) { return req('/portal/push/subscribe', { method: 'POST', body: JSON.stringify(sub) }); },
    unsubscribePush: function (endpoint) { return req('/portal/push/unsubscribe', { method: 'POST', body: JSON.stringify({ endpoint: endpoint }) }); },
    pushTest: function () { return req('/portal/push/test', { method: 'POST', body: '{}' }); },

    // Analytics beyond the dashboard: top meds sold + patient demographics.
    analytics: function () { return req('/portal/analytics'); },
    // Message a patient — lands in their app (notification + web push); SMS too
    // once a gateway is configured on the server.
    sendSms: function (patientId, message) { return req('/portal/sms', { method: 'POST', body: JSON.stringify({ patientId: patientId, message: message }) }); },

    // Prescribe-to-app + counter sale → reach the real patient via the backend.
    createPush: function (body) { return req('/portal/pushes', { method: 'POST', body: JSON.stringify(body) }); },
    createDispense: function (body) { return req('/portal/dispenses', { method: 'POST', body: JSON.stringify(body) }); },
    updateRefillStatus: function (id, status, declineReason) {
      return req('/portal/refills/' + id + '/status', { method: 'PATCH', body: JSON.stringify({ status: status, declineReason: declineReason }) });
    },
  };
})();
