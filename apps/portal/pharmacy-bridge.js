// ── SaathiPill ⇄ Pharmacy Portal bridge (backend-aware) ──
//
// Keeps the EXACT same synchronous surface the prototypes use
// (read/add/update/subscribe, addDispense, adjustInventory, readInventoryAdjust)
// so no screen code changes. localStorage stays the local cache + offline store.
//
// If `window.SAATHIPILL_CONFIG.apiUrl` is set, the bridge ALSO:
//   • mirrors pushes / dispenses to the real backend (so they cross machines), and
//   • subscribes to backend realtime events and folds them back into localStorage,
//     which transparently fires the existing subscribe() callbacks.
//
// With no config it behaves identically to the original localStorage-only bridge.

(function () {
  var CFG = window.SAATHIPILL_CONFIG || {};
  var API = CFG.apiUrl || null; // e.g. "http://localhost:3000"

  var KEY = 'sp_pharmacy_pushes';
  var EVENT = 'sp_pharmacy_pushes_changed';

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(v) ? v : [];
    } catch (e) {
      return [];
    }
  }

  function write(arr) {
    localStorage.setItem(KEY, JSON.stringify(arr));
    try { window.dispatchEvent(new CustomEvent(EVENT)); } catch (e) {}
  }

  function add(push) {
    var arr = read();
    var entry = Object.assign({
      id: Date.now() + Math.floor(Math.random() * 1000),
      pushedAt: new Date().toISOString(),
      status: 'pending',
    }, push);
    arr.unshift(entry);
    write(arr);
    // Mirror to backend if a portal token is present (pharmacist side).
    backendCreatePush(entry);
    return entry;
  }

  function update(id, patch) {
    write(read().map(function (p) { return p.id === id ? Object.assign({}, p, patch) : p; }));
    if (patch && patch.status) backendUpdatePush(id, patch.status);
  }

  function subscribe(cb) {
    var custom = function () { cb(read()); };
    var storage = function (e) { if (!e || e.key === null || e.key === KEY) cb(read()); };
    window.addEventListener(EVENT, custom);
    window.addEventListener('storage', storage);
    return function () {
      window.removeEventListener(EVENT, custom);
      window.removeEventListener('storage', storage);
    };
  }

  window.PharmacyBridge = {
    KEY: KEY, EVENT: EVENT,
    read: read, write: write, add: add, update: update, subscribe: subscribe,
  };

  // ── Counter sales + inventory adjustments ──
  var DKEY = 'sp_pharmacy_dispenses';
  var DEVENT = 'sp_pharmacy_dispenses_changed';
  var IKEY = 'sp_inventory_adjustments';
  var IEVENT = 'sp_inventory_changed';

  function readJSON(key, fallback) {
    try {
      var v = JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
      return v == null ? fallback : v;
    } catch (e) { return fallback; }
  }

  function readDispenses() { var v = readJSON(DKEY, []); return Array.isArray(v) ? v : []; }
  function writeDispenses(arr) {
    localStorage.setItem(DKEY, JSON.stringify(arr));
    try { window.dispatchEvent(new CustomEvent(DEVENT)); } catch (e) {}
  }
  function addDispense(d) {
    var arr = readDispenses();
    var entry = Object.assign({ id: Date.now() + Math.floor(Math.random() * 1000), at: new Date().toISOString() }, d);
    arr.unshift(entry);
    writeDispenses(arr);
    (d.items || []).forEach(function (it) { adjustInventory(it.name, -Math.abs(it.qty || 0)); });
    backendCreateDispense(entry);
    return entry;
  }

  function readInventoryAdjust() { var v = readJSON(IKEY, {}); return (v && typeof v === 'object') ? v : {}; }
  function writeInventoryAdjust(map) {
    localStorage.setItem(IKEY, JSON.stringify(map));
    try { window.dispatchEvent(new CustomEvent(IEVENT)); } catch (e) {}
  }
  function adjustInventory(name, delta) {
    if (!name || !delta) return;
    var map = readInventoryAdjust();
    map[name] = (map[name] || 0) + delta;
    writeInventoryAdjust(map);
  }

  function subscribeKey(key, evt, getter, cb) {
    var custom = function () { cb(getter()); };
    var storage = function (e) { if (!e || e.key === null || e.key === key) cb(getter()); };
    window.addEventListener(evt, custom);
    window.addEventListener('storage', storage);
    return function () {
      window.removeEventListener(evt, custom);
      window.removeEventListener('storage', storage);
    };
  }

  Object.assign(window.PharmacyBridge, {
    DKEY: DKEY, IKEY: IKEY,
    readDispenses: readDispenses, addDispense: addDispense,
    subscribeDispenses: function (cb) { return subscribeKey(DKEY, DEVENT, readDispenses, cb); },
    readInventoryAdjust: readInventoryAdjust, adjustInventory: adjustInventory,
    subscribeInventory: function (cb) { return subscribeKey(IKEY, IEVENT, readInventoryAdjust, cb); },
  });

  // ── Optional backend mirror ───────────────────────────────────────────────
  // These are best-effort and silently no-op when there's no API configured or
  // no auth token. The localStorage layer above always remains the source the
  // synchronous UI reads from.

  // Read from sessionStorage (non-remembered) or localStorage (remembered).
  function ls(k) { return sessionStorage.getItem(k) || localStorage.getItem(k); }
  function token() { return ls('sp_token') || ls('spp_token'); }

  function apiFetch(path, opts) {
    if (!API) return Promise.resolve(null);
    opts = opts || {};
    opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    var t = token();
    if (t) opts.headers['Authorization'] = 'Bearer ' + t;
    return fetch(API + path, opts).then(function (r) { return r.ok ? r.json().catch(function () { return null; }) : null; }).catch(function () { return null; });
  }

  function backendCreatePush(entry) {
    // Pharmacist side: push to the linked patient via the portal endpoint.
    if (!API || !entry.patientId) return;
    apiFetch('/portal/pushes', {
      method: 'POST',
      body: JSON.stringify({ patientId: entry.patientId, note: entry.note, meds: entry.meds || [] }),
    });
  }

  function backendUpdatePush(id, status) {
    if (!API) return;
    var action = status === 'accepted' ? 'accept' : status === 'dismissed' ? 'dismiss' : null;
    if (!action) return;
    apiFetch('/api/pharmacy-pushes/' + id, { method: 'PATCH', body: JSON.stringify({ action: action }) });
  }

  function backendCreateDispense(entry) {
    if (!API || !entry.patientId) return;
    apiFetch('/portal/dispenses', {
      method: 'POST',
      body: JSON.stringify({
        patientId: entry.patientId,
        items: (entry.items || []).map(function (i) { return { name: i.name, qty: i.qty, mrp: Math.round((i.mrp || 0) * 100) }; }),
        total: Math.round((entry.total || 0) * 100),
        offer: entry.offer || null,
      }),
    });
  }

  // Realtime: fold backend events back into localStorage so existing subscribe()
  // callbacks fire. Reconnectable — call connectRealtime() after login so the
  // socket joins the right room (patient:<userId> and/or pharmacy:<pharmacyId>),
  // since at first page load no one is logged in yet.
  var _socket = null;
  function connectRealtime() {
    if (!API || !CFG.socketUrl) return;
    function connect() {
      try {
        if (_socket) { try { _socket.disconnect(); } catch (e) {} _socket = null; }
        _socket = window.io(CFG.socketUrl, {
          auth: {
            userId: ls('sp_user_id') || undefined,
            pharmacyId: ls('spp_pharmacy_id') || undefined,
          },
        });
        _socket.on('push.created', function (p) {
          var arr = read();
          if (!arr.some(function (x) { return x.id === p.id; })) { arr.unshift(p); write(arr); }
        });
        _socket.on('push.updated', function (p) {
          write(read().map(function (x) { return x.id === p.id ? Object.assign({}, x, p) : x; }));
        });
        _socket.on('dispense.created', function (d) {
          var arr = readDispenses();
          if (!arr.some(function (x) { return x.id === d.id; })) { arr.unshift(d); writeDispenses(arr); }
        });
        // A patient placed or changed a refill order → tell the app to re-pull the queue.
        _socket.on('refill.created', function () {
          try { window.dispatchEvent(new Event('sp_refills_changed')); } catch (e) {}
        });
        _socket.on('refill.updated', function () {
          try { window.dispatchEvent(new Event('sp_refills_changed')); } catch (e) {}
        });
        // Stock moved (counter sale or collected refill) → refresh inventory.
        _socket.on('inventory.changed', function () {
          try { window.dispatchEvent(new Event('sp_inventory_changed')); } catch (e) {}
        });
      } catch (e) {}
    }
    if (window.io) { connect(); return; }
    var sc = document.createElement('script');
    sc.src = CFG.socketUrl.replace(/\/$/, '') + '/socket.io/socket.io.js';
    sc.onload = connect;
    document.head.appendChild(sc);
  }
  window.PharmacyBridge.connectRealtime = connectRealtime;
  connectRealtime();
})();
