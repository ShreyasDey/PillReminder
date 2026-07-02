// SaathiPill patient API client.
// Talks to the real backend when window.SAATHIPILL_CONFIG.apiUrl is set. When it
// isn't, `enabled` is false and the app runs on local demo data exactly as before.
// Everything here is best-effort and guarded — a backend hiccup never white-screens
// the app; the UI falls back to its local state.

(function () {
  var CFG = window.SAATHIPILL_CONFIG || {};
  var API = CFG.apiUrl || '';

  // Session is persistent (localStorage) — stays logged in until the user logs out
  // or clears the browser, like a normal website. The token auto-refreshes on 401.
  function getItem(k) { return localStorage.getItem(k); }
  function token() { return getItem('sp_token'); }
  function refreshToken() { return getItem('sp_refresh'); }

  function setSession(data) {
    if (data.accessToken) localStorage.setItem('sp_token', data.accessToken);
    if (data.refreshToken) localStorage.setItem('sp_refresh', data.refreshToken);
    if (data.user) {
      localStorage.setItem('sp_user_id', data.user.id);
      localStorage.setItem('sp_user_name', data.user.name || '');
    }
  }
  function clearSession() {
    ['sp_token', 'sp_refresh', 'sp_user_id', 'sp_user_name'].forEach(function (k) { localStorage.removeItem(k); sessionStorage.removeItem(k); });
  }

  async function req(path, opts, retry) {
    opts = opts || {};
    opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    var t = token();
    if (t) opts.headers['Authorization'] = 'Bearer ' + t;
    var res = await fetch(API + path, opts);
    if (res.status === 401 && !retry && refreshToken()) {
      // Try one refresh, then retry the original request.
      var r = await fetch(API + '/auth/token/refresh', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshToken() }),
      });
      if (r.ok) { setSession(await r.json()); return req(path, opts, true); }
      clearSession();
    }
    if (!res.ok) {
      var err = await res.json().catch(function () { return { error: 'Request failed' }; });
      var e = new Error(err.error || 'Request failed');
      e.status = res.status;       // so callers can branch on e.g. 409 stock conflicts
      e.data = err;               // full error body (e.g. { shortfalls: [...] })
      throw e;
    }
    return res.status === 204 ? null : res.json();
  }

  window.SaathiPillAPI = {
    enabled: !!API,
    hasSession: function () { return !!token(); },
    userId: function () { return getItem('sp_user_id'); },
    userName: function () { return getItem('sp_user_name'); },

    requestOtp: function (phone, name) {
      return req('/auth/otp/request', { method: 'POST', body: JSON.stringify({ phone: phone, name: name }) });
    },
    verifyOtp: async function (phone, code, role) {
      var data = await req('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ phone: phone, code: code, role: role }) });
      setSession(data);
      return data;
    },
    logout: function () {
      var rt = refreshToken();
      clearSession();
      if (rt) return req('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: rt }) }).catch(function () {});
      return Promise.resolve();
    },

    me: function () { return req('/api/me'); },
    updateProfile: function (patch) { return req('/api/me', { method: 'PATCH', body: JSON.stringify(patch) }); },
    nearbyPharmacies: function (lat, lng) {
      var q = (lat != null && lng != null) ? ('?lat=' + lat + '&lng=' + lng) : '';
      return req('/api/pharmacies/nearby' + q);
    },
    pharmacyByCode: function (code) { return req('/api/pharmacies/by-code?code=' + encodeURIComponent(code)); },
    // Multiple linked pharmacies
    linkedPharmacies: function () { return req('/api/me/pharmacies'); },
    addPharmacy: function (code) { return req('/api/me/pharmacies', { method: 'POST', body: JSON.stringify({ code: code }) }); },
    removePharmacy: function (code) { return req('/api/me/pharmacies/' + encodeURIComponent(code), { method: 'DELETE' }); },
    // Live prices + stock for one linked pharmacy
    pharmacyCatalog: function (code) { return req('/api/pharmacies/catalog?code=' + encodeURIComponent(code)); },
    // Web Push (medication reminders)
    vapidKey: function () { return req('/api/push/vapid'); },
    subscribePush: function (sub) { return req('/api/push/subscribe', { method: 'POST', body: JSON.stringify(sub) }); },
    unsubscribePush: function (endpoint) { return req('/api/push/unsubscribe', { method: 'POST', body: JSON.stringify({ endpoint: endpoint }) }); },
    pushTest: function () { return req('/api/push/test', { method: 'POST', body: '{}' }); },
    dashboard: function () { return req('/api/me/dashboard'); },
    dailyAdherence: function (days) { return req('/api/me/adherence/daily?days=' + (days || 90)); },
    medications: function () { return req('/api/medications'); },
    addMedication: function (med) { return req('/api/medications', { method: 'POST', body: JSON.stringify(med) }); },
    deleteMedication: function (groupId) { return req('/api/medications/' + encodeURIComponent(groupId), { method: 'DELETE' }); },
    doses: function (date) { return req('/api/doses' + (date ? '?date=' + date : '')); },
    markDose: function (id, action, extra) {
      return req('/api/doses/' + id, { method: 'PATCH', body: JSON.stringify(Object.assign({ action: action }, extra || {})) });
    },
    symptoms: function () { return req('/api/symptoms'); },
    addSymptom: function (body) { return req('/api/symptoms', { method: 'POST', body: JSON.stringify(body) }); },
    appointments: function () { return req('/api/appointments'); },
    addAppointment: function (body) { return req('/api/appointments', { method: 'POST', body: JSON.stringify(body) }); },
    addRefill: function (body) { return req('/api/refills', { method: 'POST', body: JSON.stringify(body) }); },
    refills: function () { return req('/api/refills'); },
    family: function () { return req('/api/family'); },
    inviteFamily: function (body) { return req('/api/family/invite', { method: 'POST', body: JSON.stringify(body) }); },
    updateFamilyPermissions: function (id, permissions) { return req('/api/family/' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify({ permissions: permissions }) }); },
    revokeFamily: function (id) { return req('/api/family/' + encodeURIComponent(id), { method: 'DELETE' }); },
    // ── Caregiving (acting on someone else's data) ──
    caregivingInvites: function () { return req('/api/caregiving/invites'); },
    acceptCaregiving: function (id) { return req('/api/caregiving/invites/' + encodeURIComponent(id) + '/accept', { method: 'POST', body: '{}' }); },
    declineCaregiving: function (id) { return req('/api/caregiving/invites/' + encodeURIComponent(id) + '/decline', { method: 'POST', body: '{}' }); },
    caregiving: function () { return req('/api/caregiving'); },
    caregivingDashboard: function (linkId) { return req('/api/caregiving/' + encodeURIComponent(linkId) + '/dashboard'); },
    caregivingDailyAdherence: function (linkId, days) { return req('/api/caregiving/' + encodeURIComponent(linkId) + '/adherence/daily?days=' + (days || 90)); },
    caregivingHealth: function (linkId) { return req('/api/caregiving/' + encodeURIComponent(linkId) + '/health'); },
    caregivingDoses: function (linkId, date) { return req('/api/caregiving/' + encodeURIComponent(linkId) + '/doses' + (date ? '?date=' + date : '')); },
    caregivingAddMed: function (linkId, med) { return req('/api/caregiving/' + encodeURIComponent(linkId) + '/medications', { method: 'POST', body: JSON.stringify(med) }); },
    caregivingMarkDose: function (linkId, doseId, action, extra) { return req('/api/caregiving/' + encodeURIComponent(linkId) + '/doses/' + encodeURIComponent(doseId), { method: 'PATCH', body: JSON.stringify(Object.assign({ action: action }, extra || {})) }); },
    pharmacyPushes: function () { return req('/api/pharmacy-pushes'); },
    actOnPush: function (id, action) {
      return req('/api/pharmacy-pushes/' + id, { method: 'PATCH', body: JSON.stringify({ action: action }) });
    },
  };

  // ── Mapping helpers: backend shapes → the UI's medicine-card shape ──
  // Kept here so screen code stays untouched.
  function todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  window.SaathiPillMap = {
    // A backend medication (+ its today doseLogs) → the card shape HomeScreen expects.
    medToCard: function (m) {
      var today = todayKey();
      var log = (m.doseLogs || []).find(function (l) { return l.date === today; });
      return {
        id: m.id,
        groupId: m.groupId,
        name: m.drug,
        dose: m.dose,
        time: m.time,
        meal: m.meal || '',
        icon: '💊',
        taken: log ? log.status === 'taken' : false,
        skipped: log ? log.status === 'skipped' : false,
        skipDate: log && log.status === 'skipped' ? today : null,
        doseLogId: log ? log.id : null,
        color: '#1D62A6',
        source: m.source || null,
        instructions: m.instructions || null,
        schedule: m.schedule || 'daily',
        courseEndDate: m.courseEndDate || null,
        activeToday: true,
      };
    },
  };
})();
