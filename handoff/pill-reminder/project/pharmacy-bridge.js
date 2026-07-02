// ── SaathiPill ⇄ Pharmacy Portal bridge ──
// Shared localStorage channel that lets the Pharmacy Portal push prescriptions
// into the patient-facing Pill Reminder app. Both HTML files load this file, so
// they share the same key + helpers. Cross-tab updates arrive via the native
// `storage` event; same-tab updates fire a custom event.

(function () {
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

  // push = { pharmacyName, pharmacyCode, patientName, note, meds: [...] }
  // each med = { drug, dose, times:['morning'..], meal:'after'|'before'|'empty'|'bedtime',
  //              schedule:'daily', courseType:'ongoing'|'fixed', courseDays, instructions }
  function add(push) {
    var arr = read();
    var entry = Object.assign({
      id: Date.now() + Math.floor(Math.random() * 1000),
      pushedAt: new Date().toISOString(),
      status: 'pending',
    }, push);
    arr.unshift(entry);
    write(arr);
    return entry;
  }

  function update(id, patch) {
    write(read().map(function (p) { return p.id === id ? Object.assign({}, p, patch) : p; }));
  }

  // Subscribe to changes from this tab OR another tab. Returns an unsubscribe fn.
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
    KEY: KEY,
    EVENT: EVENT,
    read: read,
    write: write,
    add: add,
    update: update,
    subscribe: subscribe,
  };

  // ── Counter sales (walk-in dispenses) + live inventory adjustments ──
  // When a patient walks into the shop and buys medicine without ordering in
  // the app, the pharmacist records a "dispense". That (a) drops the portal's
  // physical stock and (b) shows up in the patient's app as a recent pickup.
  var DKEY = 'sp_pharmacy_dispenses';     // array of dispense records
  var DEVENT = 'sp_pharmacy_dispenses_changed';
  var IKEY = 'sp_inventory_adjustments';  // { medicineName: deltaUnits }  (negative = sold)
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
  // d = { pharmacyName, pharmacyCode, patientName, items:[{name,qty,mrp}], total, offer }
  function addDispense(d) {
    var arr = readDispenses();
    var entry = Object.assign({
      id: Date.now() + Math.floor(Math.random() * 1000),
      at: new Date().toISOString(),
    }, d);
    arr.unshift(entry);
    writeDispenses(arr);
    // Apply the stock change for each line item
    (d.items || []).forEach(function (it) { adjustInventory(it.name, -Math.abs(it.qty || 0)); });
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
    DKEY: DKEY,
    IKEY: IKEY,
    readDispenses: readDispenses,
    addDispense: addDispense,
    subscribeDispenses: function (cb) { return subscribeKey(DKEY, DEVENT, readDispenses, cb); },
    readInventoryAdjust: readInventoryAdjust,
    adjustInventory: adjustInventory,
    subscribeInventory: function (cb) { return subscribeKey(IKEY, IEVENT, readInventoryAdjust, cb); },
  });
})();
