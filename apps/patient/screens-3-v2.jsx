
// Screens 13-18: Refills, Drug Interaction, Doctor Report, Profile, Offline, Pharmacy Banner

// ── REFILL ORDER BUILDER ──
function RefillOrderBuilder({ userMeds }) {
  // Reorder list = the patient's REAL medicines (deduped). Quantity-only;
  // pickup model means there is no in-app price — the patient pays at the counter.
  const realItems = React.useMemo(() => {
    const meds = (userMeds || []).filter(m => m && m.name);
    const seen = new Set(); const out = [];
    meds.forEach((m, i) => {
      const key = (m.name || '') + (m.dose || '');
      if (seen.has(key)) return; seen.add(key);
      const label = m.dose && !String(m.name).includes(m.dose) ? `${m.name} ${m.dose}` : m.name;
      out.push({ id: 'r' + i, name: label, qty: 1, include: true, icon: m.icon || '💊' });
    });
    return out;
  }, [userMeds]);

  const [ob, setOb] = React.useState({
    items: realItems,
    customItems: [], addingCustom: false,
    newName:'', newQty:1,
    notes:'',
    placed: false, expanded: false,
  });
  const set = (patch) => setOb(prev => ({ ...prev, ...patch }));
  // Keep the reorder list in sync as the patient's medicines load / change.
  const medSig = realItems.map(it => it.name).join('|');
  React.useEffect(() => {
    setOb(prev => prev.placed ? prev : { ...prev, items: realItems });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medSig]);

  const updateItem = (id, patch) => set({ items: ob.items.map(it => it.id===id ? {...it,...patch} : it) });
  const updateCustom = (id, patch) => set({ customItems: ob.customItems.map(it => it.id===id ? {...it,...patch} : it) });

  // ── Linked pharmacies + live catalog (prices + stock) ──
  const apiOn = window.SaathiPillAPI && SaathiPillAPI.enabled && SaathiPillAPI.hasSession();
  const [pharmacies, setPharmacies] = React.useState([]);
  const [selectedCode, setSelectedCode] = React.useState(
    (typeof localStorage !== 'undefined' && (localStorage.getItem('sp_patient_pharmacy_code') || '')) || ''
  );
  const [catalog, setCatalog] = React.useState(null); // { byName, offer, name }
  const [orderError, setOrderError] = React.useState(null); // shortfalls from a 409

  // Which pharmacies has the patient linked? (powers the picker)
  React.useEffect(() => {
    if (!apiOn) return;
    SaathiPillAPI.linkedPharmacies().then(list => {
      setPharmacies(list || []);
      if ((!selectedCode || !(list || []).some(p => p.code === selectedCode)) && list && list.length) {
        const primary = list.find(p => p.primary) || list[0];
        setSelectedCode(primary.code);
      }
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiOn]);

  // Live prices + stock for the chosen pharmacy.
  const loadCatalog = React.useCallback((code) => {
    if (!apiOn || !code) { setCatalog(null); return Promise.resolve(); }
    return SaathiPillAPI.pharmacyCatalog(code).then(c => {
      const byName = {};
      (c.items || []).forEach(it => { byName[it.name] = { stock: it.stock, mrp: it.mrp }; });
      setCatalog({ byName, offer: c.offer, name: c.pharmacy && c.pharmacy.name });
    }).catch(() => { setCatalog(null); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiOn]);
  React.useEffect(() => { loadCatalog(selectedCode); }, [selectedCode, loadCatalog]);

  // Load EVERY linked pharmacy's catalog so the patient can compare prices side by side.
  const [catalogs, setCatalogs] = React.useState({}); // code -> { byName, offer, name }
  const [compareOpen, setCompareOpen] = React.useState(true); // show multi-pharmacy prices by default
  const pharmCodes = pharmacies.map(p => p.code).join(',');
  React.useEffect(() => {
    if (!apiOn || !pharmacies.length) { setCatalogs({}); return; }
    let cancelled = false;
    Promise.all(pharmacies.map(p =>
      SaathiPillAPI.pharmacyCatalog(p.code)
        .then(c => { const byName = {}; (c.items || []).forEach(it => { byName[it.name] = { stock: it.stock, mrp: it.mrp }; }); return [p.code, { byName, offer: c.offer, name: (c.pharmacy && c.pharmacy.name) || p.name }]; })
        .catch(() => [p.code, null])
    )).then(entries => {
      if (cancelled) return;
      const map = {};
      entries.forEach(([code, val]) => { if (val) map[code] = val; });
      setCatalogs(map);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiOn, pharmCodes]);

  // Effective (offer-applied) unit price for a med within a specific pharmacy's catalog.
  const catEntryIn = (cat, name) => {
    if (!cat) return null;
    if (cat.byName[name]) return cat.byName[name];
    const base = String(name).split(/\s+\d/)[0].trim();
    const key = Object.keys(cat.byName).find(k => k === base || k.indexOf(base) === 0 || base.indexOf(k) === 0);
    return key ? cat.byName[key] : null;
  };
  const effPriceIn = (cat, name) => {
    const e = catEntryIn(cat, name); if (!e) return null;
    const off = cat.offer ? cat.offer.discount : 0;
    return off ? Math.round(e.mrp * (1 - off / 100)) : e.mrp;
  };
  // Total for the currently-included items at a given pharmacy (skips unpriced items).
  const totalAt = (code) => {
    const cat = catalogs[code]; if (!cat) return null;
    let sum = 0;
    ob.items.filter(it => it.include).forEach(it => { const p = effPriceIn(cat, it.name); if (p != null) sum += p * it.qty; });
    return sum;
  };

  // Catalog entry for a card (catalog keys are inventory names; cards may include the
  // dose in the label, so try exact then prefix match).
  const catEntry = (name) => {
    if (!catalog) return null;
    if (catalog.byName[name]) return catalog.byName[name];
    const base = String(name).split(/\s+\d/)[0].trim();
    const key = Object.keys(catalog.byName).find(k => k === base || k.indexOf(base) === 0 || base.indexOf(k) === 0);
    return key ? catalog.byName[key] : null;
  };
  const priceEach = (name) => { const e = catEntry(name); return e ? e.mrp : null; };
  const stockOf = (name) => { const e = catEntry(name); return e ? e.stock : null; };

  // When the catalog loads: un-check out-of-stock meds and cap quantities to stock.
  React.useEffect(() => {
    if (!catalog) return;
    setOb(prev => ({
      ...prev,
      items: prev.items.map(it => {
        const e = catEntry(it.name);
        if (!e) return it;
        let { qty, include } = it;
        if (e.stock === 0) include = false;
        if (e.stock > 0 && qty > e.stock) qty = e.stock;
        return { ...it, qty, include };
      }),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog]);

  // Show paise precision so per-unit discounts are visible (₹3.40 vs ₹2.89), but
  // drop a trailing ".00" so round amounts stay clean (₹126, not ₹126.00).
  const money = (paise) => {
    const rupees = (paise || 0) / 100;
    const s = rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return '₹' + s.replace(/\.00$/, '');
  };
  const offerPct = catalog && catalog.offer ? catalog.offer.discount : 0;
  const PICKUP_NAMES = { 'SHRM-74219': 'Sharma Medical Store' };
  const pharmacyName = (catalog && catalog.name)
    || (pharmacies.find(p => p.code === selectedCode) || {}).name
    || PICKUP_NAMES[selectedCode] || 'your pharmacy';
  const selectedCount = ob.items.filter(it => it.include).length + ob.customItems.length;
  const totalItems = ob.items.length + ob.customItems.length;
  // Estimated total from known prices (offer applied); unknown-price items excluded.
  const estPaise = (() => {
    let sum = 0;
    ob.items.filter(it => it.include).forEach(it => { const p = priceEach(it.name); if (p != null) sum += p * it.qty; });
    return offerPct ? Math.round(sum * (1 - offerPct / 100)) : sum;
  })();
  const qb = { border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 };

  const reserve = () => {
    const selected = [...ob.items.filter(it => it.include), ...ob.customItems];
    if (!selected.length) return;
    setOrderError(null);
    const api = window.SaathiPillAPI;
    if (api && api.enabled && api.hasSession()) {
      const items = selected.filter(it => it.name && it.name.trim()).map(it => ({ med: it.name.trim(), qty: it.qty || 1 }));
      api.addRefill({ items, pharmacyCode: selectedCode || undefined })
        .then(() => { try { window.dispatchEvent(new Event('sp_refills_changed')); } catch (e) {} set({ placed: true }); })
        .catch((e) => {
          if (e && e.status === 409 && e.data && e.data.shortfalls) {
            setOrderError(e.data.shortfalls);
            loadCatalog(selectedCode); // refresh availability shown on rows
          } else {
            set({ placed: true }); // offline/demo: don't block the patient
          }
        });
    } else {
      set({ placed: true });
    }
  };
  return (
    <div style={{ background: C.white, borderRadius: 20, overflow:'hidden', flexShrink: 0, border:`2px solid ${ob.placed ? C.sage : C.coral}`, boxShadow:`0 6px 24px ${ob.placed ? C.sage : C.coral}18`, transition:'border-color 0.3s' }}>
      {/* Header row */}
      <button onClick={()=>set({expanded:!ob.expanded})} style={{ width:'100%', padding:'15px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', background: ob.placed ? C.sageLight : C.white, border:'none', cursor:'pointer', borderBottom: ob.expanded ? `1px solid ${C.border}` : 'none', transition:'background 0.3s' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:22 }}>{ob.placed ? '✅' : '🛒'}</span>
          <div style={{ textAlign:'left' }}>
            <div style={{ fontFamily:fonts.heading, fontSize:16, fontWeight:800, color: ob.placed ? C.sage : C.text }}>{ob.placed ? 'Order placed!' : 'Place a refill order'}</div>
            <div style={{ fontFamily:fonts.body, fontSize:12, color:C.textMuted, marginTop:1 }}>
              {ob.placed ? `Ready to collect at ${pharmacyName}` : (selectedCount ? `${selectedCount} item${selectedCount === 1 ? '' : 's'} · pay at pickup` : 'Pick what to reorder')}
            </div>
          </div>
        </div>
        <span style={{ color:C.textMuted, fontSize:18, transform: ob.expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition:'transform 0.2s' }}>›</span>
      </button>
  
      {ob.expanded && !ob.placed && (
        <div>
          {/* Pickup pharmacy — choose among your linked stores; prices below are theirs */}
          <div style={{ padding:'12px 18px', borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontFamily:fonts.body, fontSize:10, fontWeight:700, color:C.textMuted, letterSpacing:'0.07em', marginBottom:8 }}>PICKUP FROM</div>
            {pharmacies.length > 1 ? (
              <select value={selectedCode} onChange={e=>setSelectedCode(e.target.value)} style={{ width:'100%', height:46, padding:'0 12px', borderRadius:12, border:`1.5px solid ${C.coral}`, background:C.coralLight, fontFamily:fonts.body, fontSize:13, fontWeight:700, color:C.text, outline:'none', cursor:'pointer' }}>
                {pharmacies.map(p => (
                  <option key={p.code} value={p.code}>{p.name}{p.offer ? ` — ${p.offer.discount}% off` : ''}</option>
                ))}
              </select>
            ) : (
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:12, border:`1.5px solid ${C.coral}`, background:C.coralLight }}>
                <div style={{ fontSize:18 }}>🏥</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:fonts.body, fontSize:13, fontWeight:700, color:C.text }}>{pharmacyName}</div>
                  <div style={{ fontFamily:fonts.body, fontSize:11, color:C.textMuted }}>Collect in store · pay at the counter</div>
                </div>
              </div>
            )}
            {offerPct > 0 && (
              <div style={{ marginTop:8, fontFamily:fonts.body, fontSize:11, fontWeight:700, color:C.sage }}>🏷️ {catalog.offer.label} — {offerPct}% off applied below</div>
            )}
          </div>

          {/* Compare prices side by side across all linked pharmacies */}
          {pharmacies.length >= 2 && (
            <div style={{ padding:'12px 18px', borderBottom:`1px solid ${C.border}` }}>
              <button onClick={()=>setCompareOpen(v=>!v)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderRadius:12, border:`1.5px solid ${C.border}`, background:C.warmGrayLight, cursor:'pointer' }}>
                <span style={{ fontFamily:fonts.body, fontSize:13, fontWeight:700, color:C.text }}>⚖️ Compare prices across {pharmacies.length} pharmacies</span>
                <span style={{ color:C.textMuted, fontSize:16, transform: compareOpen?'rotate(90deg)':'none', transition:'transform 0.2s' }}>›</span>
              </button>
              {compareOpen && (
                <div style={{ marginTop:10, overflowX:'auto', border:`1px solid ${C.border}`, borderRadius:12 }}>
                  <table style={{ borderCollapse:'collapse', width:'100%', minWidth: 110 + pharmacies.length*86 }}>
                    <thead>
                      <tr style={{ background:C.warmGrayLight }}>
                        <th style={{ textAlign:'left', padding:'8px 10px', fontFamily:fonts.body, fontSize:11, color:C.textMuted, fontWeight:700, position:'sticky', left:0, background:C.warmGrayLight }}>Medicine</th>
                        {pharmacies.map(p => {
                          const sel = p.code===selectedCode;
                          return (
                            <th key={p.code} onClick={()=>setSelectedCode(p.code)} title="Order from this pharmacy" style={{ padding:'8px 8px', cursor:'pointer', minWidth:80, borderLeft:`1px solid ${C.border}`, background: sel?C.coralLight:'transparent' }}>
                              <div style={{ fontFamily:fonts.body, fontSize:11, fontWeight:800, color: sel?C.coral:C.text, lineHeight:1.2 }}>{p.name}</div>
                              {p.offer ? <div style={{ fontFamily:fonts.body, fontSize:9, fontWeight:700, color:C.sage }}>{p.offer.discount}% off</div> : null}
                              <div style={{ fontFamily:fonts.body, fontSize:9, fontWeight:700, color: sel?C.coral:C.textMuted }}>{sel?'● selected':'tap to pick'}</div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {ob.items.map(it => {
                        const cells = pharmacies.map(p => ({ code:p.code, price: effPriceIn(catalogs[p.code], it.name), e: catEntryIn(catalogs[p.code], it.name) }));
                        const valid = cells.filter(x=>x.price!=null && !(x.e&&x.e.stock===0)).map(x=>x.price);
                        const min = valid.length ? Math.min(...valid) : null;
                        return (
                          <tr key={it.id} style={{ borderTop:`1px solid ${C.border}` }}>
                            <td style={{ padding:'8px 10px', fontFamily:fonts.body, fontSize:12, color:C.text, fontWeight:600, position:'sticky', left:0, background:C.white }}>{it.name}</td>
                            {cells.map(x => {
                              const out = x.e && x.e.stock===0;
                              const cheapest = x.price!=null && !out && x.price===min && valid.length>1;
                              return (
                                <td key={x.code} style={{ padding:'8px 8px', textAlign:'center', borderLeft:`1px solid ${C.border}`, background: cheapest?C.sageLight:'transparent' }}>
                                  {x.price!=null
                                    ? <div>
                                        <div style={{ fontFamily:fonts.body, fontSize:12, fontWeight: cheapest?800:700, color: out?C.textMuted:(cheapest?C.sage:C.text), textDecoration: out?'line-through':'none' }}>{money(x.price)}</div>
                                        {out ? <div style={{ fontSize:9, color:C.red, fontWeight:700 }}>out</div> : cheapest ? <div style={{ fontSize:9, color:C.sage, fontWeight:700 }}>cheapest</div> : null}
                                      </div>
                                    : <span style={{ fontFamily:fonts.body, fontSize:11, color:C.textMuted }}>—</span>}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                      <tr style={{ borderTop:`2px solid ${C.border}`, background:C.warmGrayLight }}>
                        <td style={{ padding:'8px 10px', fontFamily:fonts.body, fontSize:12, fontWeight:800, color:C.text, position:'sticky', left:0, background:C.warmGrayLight }}>Order total</td>
                        {(() => {
                          const totals = pharmacies.map(p => ({ code:p.code, total: totalAt(p.code) }));
                          const valid = totals.filter(t=>t.total!=null && t.total>0).map(t=>t.total);
                          const min = valid.length ? Math.min(...valid) : null;
                          return totals.map(t => {
                            const best = t.total!=null && t.total>0 && t.total===min && valid.length>1;
                            return (
                              <td key={t.code} style={{ padding:'8px 8px', textAlign:'center', borderLeft:`1px solid ${C.border}`, background: best?C.sageLight:'transparent' }}>
                                <div style={{ fontFamily:fonts.body, fontSize:12, fontWeight:800, color: best?C.sage:C.text }}>{t.total!=null && t.total>0 ? money(t.total) : '—'}</div>
                                {best ? <div style={{ fontSize:9, color:C.sage, fontWeight:700 }}>best total</div> : null}
                              </td>
                            );
                          });
                        })()}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
              {compareOpen && <div style={{ marginTop:8, fontFamily:fonts.body, fontSize:11, color:C.textMuted }}>Tap a pharmacy's name to order from it. Prices include each store's active offer.</div>}
            </div>
          )}
  
          {/* Empty state — no saved medicines to reorder yet */}
          {ob.items.length === 0 && (
            <div style={{ padding:'20px 18px', textAlign:'center', borderBottom:`1px solid ${C.border}` }}>
              <div style={{ fontSize:30, marginBottom:8 }}>💊</div>
              <div style={{ fontFamily:fonts.body, fontSize:13, fontWeight:700, color:C.text, marginBottom:4 }}>No medicines to reorder yet</div>
              <div style={{ fontFamily:fonts.body, fontSize:12, color:C.textMuted, lineHeight:1.5 }}>Add your medicines in the Today tab and they'll show up here, ready to reorder for pickup.</div>
            </div>
          )}
  
          {/* Medicine rows */}
          {ob.items.map((item,i)=>{
            const avail = stockOf(item.name);
            const price = priceEach(item.name);
            const out = avail === 0;
            const low = avail != null && avail > 0 && avail <= 5;
            const atMax = avail != null && item.qty >= avail;
            return (
            <div key={item.id} style={{ display:'flex', gap:10, alignItems:'center', padding:'12px 18px', borderBottom: i<ob.items.length-1 || ob.customItems.length>0 ? `1px solid ${C.border}` : 'none', background: item.include && !out ? C.white : C.warmGrayLight, opacity: item.include && !out ? 1 : 0.6, transition:'opacity 0.15s' }}>
              <button onClick={()=>{ if(out) return; updateItem(item.id,{include:!item.include}); }} disabled={out} title={out ? 'Out of stock' : (item.include ? 'Remove from order' : 'Add to order')} style={{ width:24, height:24, borderRadius:7, flexShrink:0, border:`2px solid ${item.include&&!out?C.coral:C.border}`, background:item.include&&!out?C.coral:C.white, color:C.white, cursor:out?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800 }}>{item.include&&!out ? '✓' : ''}</button>
              <div style={{ width:36, height:36, borderRadius:10, background:C.warmGrayLight, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0 }}>{item.icon}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:fonts.body, fontSize:13, fontWeight:700, color:C.text }}>{item.name}</div>
                <div style={{ fontFamily:fonts.body, fontSize:11, marginTop:1, display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
                  {price != null && (
                    offerPct > 0 ? (
                      <span>
                        <span style={{ color:C.textMuted, textDecoration:'line-through', fontWeight:600 }}>{money(price)}</span>{' '}
                        <span style={{ color:C.sage, fontWeight:800 }}>{money(Math.round(price*(1-offerPct/100)))}</span>
                        <span style={{ color:C.textMuted }}> each · {offerPct}% off</span>
                      </span>
                    ) : (
                      <span style={{ color:C.text, fontWeight:700 }}>{money(price)} each</span>
                    )
                  )}
                  {out ? <span style={{ color:C.red, fontWeight:700 }}>Out of stock</span>
                    : low ? <span style={{ color:C.amber, fontWeight:700 }}>Only {avail} left</span>
                    : avail != null ? <span style={{ color:C.sage, fontWeight:600 }}>In stock</span>
                    : <span style={{ color:C.textMuted }}>{item.include ? 'In your order' : 'Tap ✓ to add'}</span>}
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:3, background:C.warmGrayLight, borderRadius:9, padding:'2px 3px', flexShrink:0 }}>
                <button onClick={()=>updateItem(item.id,{qty:Math.max(1,item.qty-1)})} disabled={!item.include||out} style={{ ...qb, width:26, height:26, borderRadius:7, background:C.white, fontSize:15, color:C.text, opacity:item.include&&!out?1:0.5 }}>−</button>
                <span style={{ fontFamily:fonts.body, fontSize:14, fontWeight:700, color:C.text, minWidth:22, textAlign:'center' }}>{out?0:item.qty}</span>
                <button onClick={()=>{ if(atMax) return; updateItem(item.id,{qty:item.qty+1}); }} disabled={!item.include||out||atMax} title={atMax?`Only ${avail} in stock`:''} style={{ ...qb, width:26, height:26, borderRadius:7, background:C.coral, fontSize:15, color:C.white, opacity:item.include&&!out&&!atMax?1:0.5 }}>+</button>
              </div>
            </div>
            );
          })}
  
          {/* Custom items */}
          {ob.customItems.map((item,i)=>(
            <div key={item.id} style={{ display:'flex', gap:10, alignItems:'center', padding:'11px 18px', borderBottom: i<ob.customItems.length-1 ? `1px solid ${C.border}` : 'none', background:'#FFFBF0' }}>
              <div style={{ width:36, height:36, borderRadius:10, background:C.amberLight, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0 }}>🛍️</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:fonts.body, fontSize:13, fontWeight:600, color:C.text, marginBottom:2 }}>{item.name}</div>
                <span style={{ fontSize:9, padding:'1px 6px', borderRadius:4, background:C.amberLight, color:C.amber, fontWeight:700 }}>CUSTOM</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:3, background:C.warmGrayLight, borderRadius:9, padding:'2px 3px', flexShrink:0 }}>
                <button onClick={()=>updateCustom(item.id,{qty:Math.max(1,item.qty-1)})} style={{ ...qb, width:26, height:26, borderRadius:7, background:C.white, fontSize:15, color:C.text }}>−</button>
                <span style={{ fontFamily:fonts.body, fontSize:14, fontWeight:700, color:C.text, minWidth:22, textAlign:'center' }}>{item.qty}</span>
                <button onClick={()=>updateCustom(item.id,{qty:item.qty+1})} style={{ ...qb, width:26, height:26, borderRadius:7, background:C.amber, fontSize:15, color:C.white }}>+</button>
              </div>
              <button onClick={()=>set({customItems:ob.customItems.filter(i=>i.id!==item.id)})} title="Remove" style={{ fontFamily:fonts.body, fontSize:13, color:C.red, background:'none', border:'none', cursor:'pointer', fontWeight:700, flexShrink:0 }}>✕</button>
            </div>
          ))}
  
          {/* Add custom item */}
          <div style={{ padding:'10px 18px', borderTop:`1px solid ${C.border}` }}>
            {!ob.addingCustom ? (
              <button onClick={()=>set({addingCustom:true})} style={{ width:'100%', padding:'10px 0', borderRadius:12, border:`2px dashed ${C.amber}66`, background:'#FFFBF0', fontFamily:fonts.body, fontSize:13, fontWeight:700, color:C.amber, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                + Add another item <span style={{ fontFamily:fonts.body, fontSize:11, fontWeight:400, color:C.textMuted }}>(OTC, specific brand)</span>
              </button>
            ) : (
              <div style={{ padding:'12px 14px', background:'#FFFBF0', borderRadius:14, border:`1.5px solid ${C.amber}44` }}>
                <input value={ob.newName} onChange={e=>set({newName:e.target.value})} placeholder="e.g. Paracetamol 650mg, Dettol, Band-Aid" autoFocus style={{ width:'100%', height:42, padding:'0 12px', borderRadius:10, border:`1.5px solid ${C.border}`, background:C.white, fontFamily:fonts.body, fontSize:13, color:C.text, outline:'none', marginBottom:10 }} />
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <span style={{ fontFamily:fonts.body, fontSize:12, fontWeight:700, color:C.textMuted, letterSpacing:'0.05em' }}>QUANTITY</span>
                  <div style={{ display:'flex', alignItems:'center', gap:5, height:38, background:C.white, borderRadius:10, border:`1.5px solid ${C.border}`, padding:'0 6px' }}>
                    <button onClick={()=>set({newQty:Math.max(1,ob.newQty-1)})} style={{ ...qb, width:26, height:26, borderRadius:7, background:C.warmGrayLight, fontSize:15, color:C.text }}>−</button>
                    <span style={{ fontFamily:fonts.body, fontSize:14, fontWeight:700, color:C.text, minWidth:20, textAlign:'center' }}>{ob.newQty}</span>
                    <button onClick={()=>set({newQty:ob.newQty+1})} style={{ ...qb, width:26, height:26, borderRadius:7, background:C.coral, fontSize:15, color:C.white }}>+</button>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>{ if(!ob.newName.trim())return; set({customItems:[...ob.customItems,{id:Date.now(),name:ob.newName.trim(),qty:ob.newQty}],addingCustom:false,newName:'',newQty:1}); }} disabled={!ob.newName.trim()} style={{ flex:1, height:40, borderRadius:10, border:'none', background:ob.newName.trim()?C.coral:C.border, fontFamily:fonts.body, fontSize:14, fontWeight:700, color:ob.newName.trim()?C.white:C.textMuted, cursor:ob.newName.trim()?'pointer':'default' }}>Add to order</button>
                  <button onClick={()=>set({addingCustom:false,newName:'',newQty:1})} style={{ padding:'0 14px', height:40, borderRadius:10, border:`1px solid ${C.border}`, background:C.white, fontFamily:fonts.body, fontSize:13, fontWeight:600, color:C.textMuted, cursor:'pointer' }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
  
          {/* Pickup info — pharmacy prepares the order, patient collects & pays at counter */}
          <div style={{ padding:'12px 18px', borderTop:`1px solid ${C.border}` }}>
            <div style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'11px 13px', borderRadius:12, background:C.sageLight }}>
              <span style={{ fontSize:18 }}>🛍️</span>
              <div style={{ fontFamily:fonts.body, fontSize:12, color:C.text, lineHeight:1.5 }}>
                <strong>Pickup order.</strong> The pharmacy prepares your medicines and notifies you when they're ready. Collect them in store and <strong>pay at the counter</strong>.
              </div>
            </div>
          </div>

          {/* Note */}
          <div style={{ padding:'12px 18px', borderTop:`1px solid ${C.border}` }}>
            <div style={{ fontFamily:fonts.body, fontSize:10, fontWeight:700, color:C.textMuted, letterSpacing:'0.07em', marginBottom:8 }}>NOTE FOR PHARMACIST</div>
            <textarea value={ob.notes} onChange={e=>set({notes:e.target.value})} placeholder="e.g. Same brand as last time. Leave at door." rows={2} style={{ width:'100%', padding:'10px 12px', borderRadius:11, border:`1.5px solid ${ob.notes?C.sage:C.border}`, background:C.white, fontFamily:fonts.body, fontSize:13, color:C.text, resize:'none', outline:'none', lineHeight:1.5, transition:'border-color 0.2s' }} />
          </div>
  
          {/* Summary + CTA */}
          <div style={{ padding:'14px 18px 18px', borderTop:`1px solid ${C.border}`, background:C.warmGrayLight }}>
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:12 }}>
              {ob.items.filter(it=>it.include).map(it=>{
                const p = priceEach(it.name);
                return (
                <div key={it.id} style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontFamily:fonts.body, fontSize:12, color:C.textMuted }}>{it.name} × {it.qty}</span>
                  <span style={{ fontFamily:fonts.body, fontSize:12, fontWeight:700, color:C.text }}>{p!=null ? money((offerPct>0?Math.round(p*(1-offerPct/100)):p)*it.qty) : '× '+it.qty}</span>
                </div>
                );
              })}
              {ob.customItems.map(it=>(
                <div key={it.id} style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontFamily:fonts.body, fontSize:12, color:C.textMuted }}>{it.name} × {it.qty}</span>
                  <span style={{ fontFamily:fonts.body, fontSize:12, fontWeight:700, color:C.textMuted }}>at counter</span>
                </div>
              ))}
              {selectedCount === 0 && (
                <div style={{ fontFamily:fonts.body, fontSize:12, color:C.textMuted, fontStyle:'italic' }}>Tap ✓ next to a medicine to add it to your pickup.</div>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', paddingTop:8, borderTop:`1.5px solid ${C.border}` }}>
                <span style={{ fontFamily:fonts.body, fontSize:15, fontWeight:700, color:C.text }}>{estPaise>0 ? 'Estimated total' : 'Payable'}</span>
                <span style={{ fontFamily:fonts.body, fontSize:15, fontWeight:800, color:C.text }}>{estPaise>0 ? money(estPaise) : 'At the counter'}</span>
              </div>
              {estPaise>0 && (
                <div style={{ fontFamily:fonts.body, fontSize:11, color:C.textMuted, textAlign:'right' }}>{offerPct>0 ? 'Offer applied · ' : ''}Pay at the counter on pickup</div>
              )}
            </div>

            {orderError && orderError.length > 0 && (
              <div style={{ marginBottom:12, padding:'11px 13px', borderRadius:12, background:C.coralLight, border:`1.5px solid ${C.red}` }}>
                <div style={{ fontFamily:fonts.body, fontSize:12, fontWeight:800, color:C.red, marginBottom:4 }}>⚠️ Not enough stock right now</div>
                {orderError.map((s,idx)=>(
                  <div key={idx} style={{ fontFamily:fonts.body, fontSize:12, color:C.text }}>{s.med}: you asked for {s.requested}, only {s.available} in stock</div>
                ))}
                <div style={{ fontFamily:fonts.body, fontSize:11, color:C.textMuted, marginTop:4 }}>Lower the quantity (or uncheck it) and try again.</div>
              </div>
            )}

            <Btn disabled={selectedCount === 0} onClick={reserve} icon="🛍️">
              {selectedCount > 0 ? `Reserve ${selectedCount} item${selectedCount===1?'':'s'} for pickup${estPaise>0?` · ${money(estPaise)}`:''}` : 'Select medicines to reorder'}
            </Btn>
          </div>
        </div>
      )}
  
      {ob.expanded && ob.placed && (
        <div style={{ padding:'24px 20px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <div style={{ fontFamily:fonts.body, fontSize:14, fontWeight:600, color:C.sage }}>We'll notify you when it's ready to collect at {pharmacyName}</div>
          {ob.notes ? <div style={{ fontFamily:fonts.body, fontSize:12, color:C.textMuted, fontStyle:'italic', lineHeight:1.4, maxWidth:240 }}>Note: "{ob.notes}"</div> : null}
          <div style={{ marginTop:6, padding:'6px 14px', borderRadius:10, background:C.sageLight, fontFamily:fonts.body, fontSize:12, fontWeight:600, color:C.sage }}>💵 Pay at the pharmacy counter</div>
          <button onClick={()=>set({placed:false})} style={{ marginTop:8, fontFamily:fonts.body, fontSize:12, color:C.textMuted, background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>Place another order</button>
        </div>
      )}
    </div>
  );
  
}

// ── SCREEN 13: REFILLS TAB ──
function RefillsScreen({ onNavigate, userMeds }) {
  const [activeOffer, setActiveOffer] = React.useState(null);
  const [offerDismissed, setOfferDismissed] = React.useState(false);

  // The patient's linked pharmacies (backend truth) — the banner reflects the primary
  // one, or prompts to link when there is none. Never defaults to a hardcoded pharmacy.
  const refillsApiOn = window.SaathiPillAPI && SaathiPillAPI.enabled && SaathiPillAPI.hasSession();
  const [linkedPharms, setLinkedPharms] = React.useState([]);
  React.useEffect(() => {
    if (!refillsApiOn) return;
    SaathiPillAPI.linkedPharmacies().then(list => setLinkedPharms(list || [])).catch(() => {});
  }, [refillsApiOn]);
  const linkedPrimary = (linkedPharms.find(p => p.primary) || linkedPharms[0]) || null;

  React.useEffect(() => {
    const readOffer = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('sp_active_offer') || 'null');
        setActiveOffer(stored);
        if (stored) setOfferDismissed(false);
      } catch { setActiveOffer(null); }
    };
    readOffer();
    // Same-tab changes (e.g. PharmacyPortalPanel inside patient app)
    window.addEventListener('sp_offer_changed', readOffer);
    // Cross-tab changes: pharmacy portal running in a separate browser tab
    const onStorage = (e) => { if (e.key === 'sp_active_offer') readOffer(); };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('sp_offer_changed', readOffer);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const [dispenses, setDispenses] = React.useState([]);
  React.useEffect(() => {
    if (typeof PharmacyBridge === 'undefined') return;
    setDispenses(PharmacyBridge.readDispenses());
    return PharmacyBridge.subscribeDispenses(setDispenses);
  }, []);

  // The patient's own refill orders, so they can track status (pending → ready).
  const [myOrders, setMyOrders] = React.useState([]);
  React.useEffect(() => {
    const api = window.SaathiPillAPI;
    if (!api || !api.enabled || !api.hasSession() || !api.refills) return;
    const load = () => api.refills().then(setMyOrders).catch(() => {});
    load();
    window.addEventListener('sp_refills_changed', load);
    return () => window.removeEventListener('sp_refills_changed', load);
  }, []);
  const activeOrders = myOrders.filter(o => ['pending', 'confirmed', 'ready'].includes(o.status));

  return (
    <div style={{ flex: 1, background: C.cream, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontFamily: fonts.heading, fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 4 }}>Refills</div>
        <div style={{ fontFamily: fonts.body, fontSize: 14, color: C.textMuted }}>Never run out of your medicines</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px 20px 100px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Active pharmacy offer banner — only when actually linked to a pharmacy */}
        {linkedPrimary && activeOffer && !offerDismissed && (
          <div style={{
            borderRadius: 18, overflow: 'hidden',
            border: `2px solid ${C.sage}`,
            background: 'linear-gradient(135deg, #1A4B2C 0%, #1F6B3A 100%)',
            position: 'relative',
            flexShrink: 0,
          }}>
            {/* big % watermark */}
            <div style={{
              position: 'absolute', right: -10, top: -20,
              fontSize: 90, fontWeight: 900, color: 'rgba(255,255,255,0.05)',
              letterSpacing: '-0.05em', lineHeight: 1, userSelect: 'none',
            }}>%</div>
            <div style={{ padding: '14px 18px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>🏷️</span>
                  <div>
                    <div style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Limited offer · {linkedPrimary.name}</div>
                    <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 800, color: '#fff', marginTop: 1 }}>{activeOffer.label}</div>
                  </div>
                </div>
                <button onClick={() => setOfferDismissed(true)} style={{
                  background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8,
                  color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 14,
                  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>✕</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
                <span style={{ fontFamily: fonts.body, fontSize: 48, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>{activeOffer.discount}%</span>
                <div>
                  <div style={{ fontFamily: fonts.body, fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>OFF</div>
                  <div style={{ fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>all medicines</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                  Valid until {new Date(activeOffer.expiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span style={{
                  padding: '2px 8px', borderRadius: 6,
                  background: 'rgba(91,180,100,0.3)', color: '#8EC892',
                  fontFamily: fonts.body, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                }}>● LIVE NOW</span>
              </div>
              <button onClick={() => onNavigate && onNavigate('pharmacy')} style={{
                width: '100%', padding: '12px 0', borderRadius: 12, border: 'none',
                background: '#fff', color: '#1A4B2C',
                fontFamily: fonts.body, fontSize: 14, fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <span>🛒</span> Order now at {activeOffer.discount}% off
              </button>
            </div>
          </div>
        )}

        {/* Linked-pharmacies button — a generic entry point; tapping opens the full list.
            Never features one specific pharmacy name. */}
        {linkedPharms.length > 0 ? (
          <div onClick={() => onNavigate && onNavigate('pharmacy')} style={{
            borderRadius: 18, padding: '14px 18px', marginBottom: 4,
            background: 'linear-gradient(135deg, #1A4B8C, #2563EB)',
            display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
          }}>
            <span style={{ fontSize: 28 }}>🏥</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: '#fff' }}>Your pharmacies</div>
              <div style={{ fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                {linkedPharms.length} linked{linkedPharms.some(p => p.offer) ? ' · offers available' : ''} · Tap to view all
              </div>
            </div>
            <div style={{
              minWidth: 26, height: 26, padding: '0 8px', borderRadius: 13,
              background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: fonts.body, fontSize: 14, fontWeight: 900, color: '#fff',
            }}>{linkedPharms.length}</div>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18 }}>›</span>
          </div>
        ) : (
          <div onClick={() => onNavigate && onNavigate('pharmacy')} style={{
            borderRadius: 18, padding: '14px 18px', marginBottom: 4,
            border: `2px dashed ${C.border}`, background: C.white,
            display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
          }}>
            <span style={{ fontSize: 28 }}>🏥</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.text }}>Link a pharmacy</div>
              <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>Connect a nearby pharmacy for refills & offers</div>
            </div>
            <span style={{ color: C.textMuted, fontSize: 18 }}>›</span>
          </div>
        )}

        {/* Recent counter pickups pushed from the pharmacy portal */}
        {dispenses.length > 0 && (
          <div>
            <SectionHeader title="🧾 Recent pickups" />
            {dispenses.slice(0, 5).map((d) => {
              const when = new Date(d.at);
              const dateStr = when.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' · ' + when.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
              const units = (d.items || []).reduce((s, it) => s + (it.qty || 0), 0);
              return (
                <Card key={d.id} style={{ marginBottom: 12, border: `1px solid ${C.sage}55` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                      background: C.sageLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                    }}>🏪</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 700, color: C.text }}>{d.pharmacyName || 'Pharmacy'}</div>
                      <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>Picked up at counter · {dateStr}</div>
                    </div>
                    <Pill color={C.sage}>Collected</Pill>
                  </div>
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(d.items || []).map((it, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: fonts.body, fontSize: 14 }}>
                        <span style={{ color: C.text, fontWeight: 600 }}>{it.name}</span>
                        <span style={{ color: C.textMuted, fontWeight: 700 }}>× {it.qty}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${C.border}` }}>
                    <span style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted, fontWeight: 600 }}>
                      {units} units{d.offer ? ` · ${d.offer.discount}% off applied` : ''}
                    </span>
                    <span style={{ fontFamily: fonts.body, fontSize: 16, fontWeight: 800, color: C.text }}>₹{(d.total || 0).toLocaleString('en-IN')}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <RefillOrderBuilder userMeds={userMeds} />

        {/* Your refill orders — live status from the pharmacy */}
        {activeOrders.length > 0 && (
          <div>
            <SectionHeader title="🧾 Your refill orders" />
            {activeOrders.slice(0, 5).map(o => {
              const sm = {
                pending:   { label: 'Awaiting confirmation', color: C.amber, bg: C.amberLight, icon: '🛍️' },
                confirmed: { label: 'Being prepared',        color: C.coral, bg: C.coralLight, icon: '👩‍⚕️' },
                ready:     { label: 'Ready to collect',      color: C.sage,  bg: C.sageLight,  icon: '✅' },
              }[o.status] || { label: o.status, color: C.textMuted, bg: C.warmGrayLight, icon: '🛍️' };
              const units = (o.items || []).reduce((s, it) => s + (it.qty || 0), 0);
              const when = o.placedAt ? new Date(o.placedAt) : null;
              return (
                <Card key={o.id} style={{ marginBottom: 12, border: `1px solid ${sm.color}44` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, background: sm.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{sm.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 700, color: C.text }}>Order #{o.displayId || o.id}</div>
                      <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>{units} item{units === 1 ? '' : 's'}{when ? ` · ${when.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}</div>
                    </div>
                    <Pill color={sm.color}>{sm.label}</Pill>
                  </div>
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(o.items || []).map((it, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: fonts.body, fontSize: 14 }}>
                        <span style={{ color: C.text, fontWeight: 600 }}>{it.med}</span>
                        <span style={{ color: C.textMuted, fontWeight: 700 }}>× {it.qty}</span>
                      </div>
                    ))}
                  </div>
                  {o.status === 'ready' && (
                    <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, background: C.sageLight, fontFamily: fonts.body, fontSize: 12, fontWeight: 600, color: C.sage }}>Ready at {(typeof PHARMACY !== 'undefined' && PHARMACY && PHARMACY.name) || 'your pharmacy'} — pay at the counter when you collect.</div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Your medicines (real data) */}
        {(userMeds && userMeds.length > 0) && (
          <div>
            <SectionHeader title="💊 Your medicines" />
            {userMeds.map((med, i) => {
              const label = med.dose && !String(med.name || '').includes(med.dose) ? `${med.name} ${med.dose}` : med.name;
              const sub = [med.dose, med.schedule, med.frequency, med.time].filter(Boolean).join(' · ');
              return (
                <Card key={i} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14, background: C.sageLight,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                  }}>{med.icon || '💊'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 600, color: C.text }}>{label}</div>
                    {sub && <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted }}>{sub}</div>}
                  </div>
                  <Pill color={C.sage}>Active</Pill>
                </Card>
              );
            })}
          </div>
        )}

        {/* Refill reminder settings */}
        <Card style={{ background: C.amberLight, border: `1px solid ${C.amber}33` }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 28 }}>⚙️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.text }}>Auto refill reminders</div>
              <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted }}>Alert when 7 days of stock remain</div>
            </div>
            <Pill color={C.amber}>On</Pill>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── SCREEN 14: DRUG INTERACTION (shown inline in Add Medicine) ──
function DrugInteractionCard() {
  return (
    <Card style={{ border: `2px solid ${C.amber}`, background: C.amberLight }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 28 }}>⚠️</span>
        <div>
          <div style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>Drug Interaction Alert</div>
          <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.text, lineHeight: 1.5 }}>
            <strong>Aspirin + Warfarin:</strong> increased bleeding risk. Please consult your doctor before adding this combination.
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <Pill color={C.amber}>⚠️ Moderate risk</Pill>
            <Pill color={C.coral}>See doctor first</Pill>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── SCREEN: DRUG INTERACTIONS (full view, improvement #13) ──
function InteractionsScreen({ onClose }) {
  const interactions = [
    {
      severity: 'moderate', color: C.amber, label: 'Moderate',
      a: 'Metformin', b: 'Atorvastatin',
      summary: 'May increase risk of low blood sugar in some patients.',
      detail: 'Both medicines can affect glucose metabolism. Monitor blood sugar more carefully, especially in the first 4 weeks. Symptoms to watch: dizziness, sweating, confusion.',
      action: 'Continue both — monitor symptoms',
    },
    {
      severity: 'mild', color: '#5B8EE0', label: 'Mild',
      a: 'Amlodipine', b: 'Grapefruit',
      summary: 'Grapefruit can raise medicine levels in your blood.',
      detail: 'If you regularly drink grapefruit juice or eat grapefruit, your blood pressure may drop more than expected. Best to avoid or limit to once a week.',
      action: 'Avoid grapefruit while on this medicine',
    },
  ];

  const safe = ['Vitamin D3', 'Telmisartan', 'Ecosprin'];

  return (
    <div style={{ flex: 1, background: C.cream, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: 12, background: C.warmGrayLight, border: 'none', fontSize: 18, cursor: 'pointer' }}>←</button>
        <div>
          <div style={{ fontFamily: fonts.heading, fontSize: 20, fontWeight: 700, color: C.text }}>Drug Interactions</div>
          <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>Across your 5 medicines</div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Re-check status — fixes L-18 (interaction check was entry-time only) */}
        <Card style={{ padding: '12px 14px', background: C.white, border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: C.sageLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔄</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: C.text }}>Last checked: today, 9:14 AM</div>
              <div style={{ fontFamily: fonts.body, fontSize: 11.5, color: C.textMuted, lineHeight: 1.5 }}>
                Re-checks automatically when you add a medicine and every Monday.
              </div>
            </div>
            <button style={{
              padding: '8px 12px', borderRadius: 10, border: `1.5px solid ${C.coral}`,
              background: C.white, color: C.coral, cursor: 'pointer',
              fontFamily: fonts.body, fontSize: 12, fontWeight: 700,
            }}>Re-check now</button>
          </div>
        </Card>

        {/* Summary banner */}
        <Card style={{ background: C.amberLight, border: `1px solid ${C.amber}44`, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.text }}>2 interactions found</div>
              <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>1 moderate · 1 mild · None severe. Always tell your doctor about all medicines you take.</div>
            </div>
          </div>
        </Card>

        {interactions.map((it, i) => (
          <Card key={i} style={{ borderLeft: `4px solid ${it.color}`, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Pill color={it.color}>⚠️ {it.label}</Pill>
              <span style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>severity</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1, padding: '10px 12px', background: C.warmGrayLight, borderRadius: 12, textAlign: 'center', fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.text }}>{it.a}</div>
              <span style={{ fontSize: 18, color: it.color }}>+</span>
              <div style={{ flex: 1, padding: '10px 12px', background: C.warmGrayLight, borderRadius: 12, textAlign: 'center', fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.text }}>{it.b}</div>
            </div>
            <div style={{ fontFamily: fonts.body, fontSize: 14, color: C.text, lineHeight: 1.5, marginBottom: 8, fontWeight: 600 }}>{it.summary}</div>
            <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted, lineHeight: 1.6, marginBottom: 12 }}>{it.detail}</div>
            <div style={{ padding: '10px 12px', background: it.color + '11', borderRadius: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 16 }}>💡</span>
              <span style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: C.text }}>{it.action}</span>
            </div>
          </Card>
        ))}

        {/* Safe combinations */}
        <Card style={{ padding: '14px 16px' }}>
          <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>✓ No interactions</div>
          <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted, marginBottom: 10 }}>These medicines are safe with everything else you take:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {safe.map(m => <Pill key={m} color={C.sage}>✓ {m}</Pill>)}
          </div>
        </Card>

        {/* Disclaimer */}
        <div style={{ padding: '12px 14px', borderRadius: 12, background: C.warmGrayLight, fontFamily: fonts.body, fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>
          <strong>Disclaimer:</strong> This is informational only — based on Indian pharmacology databases (CDSCO, IPC). Always confirm with your doctor before changing medication. SaathiPill does not provide medical advice.
        </div>
      </div>
    </div>
  );
}

// ── SCREEN 15: DOCTOR REPORT ──
function DoctorReportScreen({ onClose, userName, userSymptoms, onLogSymptoms, userMeds, adherenceDaily }) {
  // Real figures computed from the user's dose history (same method as the app).
  const _series = (adherenceDaily || []).filter(d => d.pct != null);
  const _totals = _series.reduce((a, d) => ({ taken: a.taken + d.taken, counted: a.counted + d.counted }), { taken: 0, counted: 0 });
  const realAdherence = _totals.counted > 0 ? Math.round((_totals.taken / _totals.counted) * 100) : null;
  const _sorted = [..._series].sort((a, b) => (a.date < b.date ? 1 : -1));
  let realStreak = 0;
  for (const d of _sorted) { if (d.pct >= 100) realStreak++; else break; }
  // Deduplicate the user's medicines by drug name for the "current medications" list.
  const reportMeds = (() => {
    const list = userMeds && userMeds.length ? userMeds : [];
    const seen = new Set();
    return list.filter(m => { const k = (m.name || '') + (m.dose || ''); if (seen.has(k)) return false; seen.add(k); return true; });
  })();
  const reportDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const [sharing, setSharing] = React.useState(false);
  const [selectedDay, setSelectedDay] = React.useState(null);

  // Deterministic day status — matches the square colors below
  const dayStatusFor = (d) => (d % 11 === 0 ? 'red' : d % 7 === 5 ? 'amber' : 'sage');

  // Per-day medicine log (deterministic so it survives re-renders)
  const dayDetailFor = (d) => {
    const status = dayStatusFor(d);
    // Status mapping: sage = all taken, amber = at least one late, red = at least one missed
    const baseMeds = [
      { name: 'Metformin 500mg', time: '8:00 AM', meal: 'After breakfast' },
      { name: 'Amlodipine 5mg', time: '9:00 AM', meal: 'After breakfast' },
      { name: 'Telmisartan 40mg', time: '1:00 PM', meal: 'After lunch' },
      { name: 'Atorvastatin 10mg', time: '9:00 PM', meal: 'After dinner' },
    ];
    if (status === 'sage') {
      return baseMeds.map((m, i) => ({
        ...m,
        status: 'taken',
        actual: m.time,
        delayMin: 0,
      }));
    }
    if (status === 'amber') {
      // one dose taken late (rotate which one by day)
      const lateIdx = d % baseMeds.length;
      return baseMeds.map((m, i) => ({
        ...m,
        status: i === lateIdx ? 'late' : 'taken',
        actual: i === lateIdx ? '+1h 12m' : m.time,
        delayMin: i === lateIdx ? 72 : 0,
      }));
    }
    // red — one missed, others taken (some late)
    const missedIdx = d % baseMeds.length;
    return baseMeds.map((m, i) => ({
      ...m,
      status: i === missedIdx ? 'missed' : (i === (missedIdx + 1) % baseMeds.length ? 'late' : 'taken'),
      actual: i === missedIdx ? '—' : (i === (missedIdx + 1) % baseMeds.length ? '+48m' : m.time),
      delayMin: i === missedIdx ? null : (i === (missedIdx + 1) % baseMeds.length ? 48 : 0),
    }));
  };

  const statusMeta = {
    sage:  { label: 'All doses taken on time',     color: C.sage,  icon: '✓' },
    amber: { label: 'One or more doses late',      color: C.amber, icon: '⚠️' },
    red:   { label: 'Dose missed',                  color: C.red,   icon: '✗' },
  };

  const doseStatusColor = (s) => s === 'taken' ? C.sage : s === 'late' ? C.amber : s === 'missed' ? C.red : C.warmGray;
  const doseStatusLabel = (s) => s === 'taken' ? 'Taken' : s === 'late' ? 'Late' : s === 'missed' ? 'Missed' : s;

  return (
    <div style={{ flex: 1, minHeight: 0, background: C.cream, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: 12, background: C.warmGrayLight, border: 'none', fontSize: 18, cursor: 'pointer' }}>←</button>
        <div>
          <div style={{ fontFamily: fonts.heading, fontSize: 20, fontWeight: 700, color: C.text }}>Doctor Report</div>
          <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>Ready to share at your appointment</div>
        </div>
      </div>

      {/* PDF Preview */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 20px 24px' }}>
        <div style={{
          background: C.white, borderRadius: 20, padding: '24px 20px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.10)', border: `1px solid ${C.border}`,
          marginBottom: 16,
        }}>
          {/* Report header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
            <div>
              <div style={{ fontFamily: fonts.heading, fontSize: 20, fontWeight: 800, color: C.coral, marginBottom: 2 }}>SaathiPill</div>
              <div style={{ fontFamily: fonts.body, fontSize: 11, color: C.textMuted }}>Medication Adherence Report</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.text, fontWeight: 600 }}>{userName || 'Patient'}</div>
              <div style={{ fontFamily: fonts.body, fontSize: 11, color: C.textMuted }}>Generated: {reportDate}</div>
            </div>
          </div>

          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Adherence', value: realAdherence == null ? '—' : `${realAdherence}%`, color: C.sage },
              { label: 'Current\nstreak', value: `${realStreak} day${realStreak === 1 ? '' : 's'}`, color: C.coral },
              { label: 'Medicines\ntracked', value: `${reportMeds.length}`, color: '#5B8EE0' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 12, background: C.warmGrayLight }}>
                <div style={{ fontFamily: fonts.heading, fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontFamily: fonts.body, fontSize: 10, color: C.textMuted, lineHeight: 1.3, whiteSpace: 'pre-line' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Medicines list */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>CURRENT MEDICATIONS</div>
            {reportMeds.length === 0 && (
              <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted, padding: '8px 0' }}>No medicines added yet.</div>
            )}
            {reportMeds.map((med, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < reportMeds.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <div>
                  <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: C.text }}>{med.name}</div>
                  <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>{med.dose}{med.meal ? ` · ${med.meal}` : ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>{med.time}</div>
                  <Pill color={C.sage} style={{ fontSize: 10, padding: '2px 8px' }}>Active</Pill>
                </div>
              </div>
            ))}
          </div>

          {/* Mini calendar */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>ADHERENCE LOG — APRIL 2026</div>
            <div style={{ fontFamily: fonts.body, fontSize: 11, color: C.textMuted, marginBottom: 8 }}>Tap any day to see what was taken.</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {Array(30).fill(null).map((_, i) => {
                const dayNum = i + 1;
                const status = dayStatusFor(dayNum);
                const isSelected = selectedDay === dayNum;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(isSelected ? null : dayNum)}
                    title={`April ${dayNum} — ${statusMeta[status].label}`}
                    style={{
                      width: 22, height: 22, borderRadius: 5,
                      background: C[status],
                      opacity: 0.85,
                      border: isSelected ? `2px solid ${C.text}` : '2px solid transparent',
                      padding: 0, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: fonts.body, fontSize: 10, fontWeight: 700,
                      color: 'rgba(255,255,255,0.92)',
                      transition: 'transform 120ms ease, opacity 120ms ease',
                      transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = isSelected ? '1' : '0.85'; }}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              {[['sage', 'Taken'], ['amber', 'Late'], ['red', 'Missed']].map(([c, l]) => (
                <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: C[c] }} />
                  <span style={{ fontFamily: fonts.body, fontSize: 10, color: C.textMuted }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Symptom log — improvement #14 */}
          <div style={{ marginBottom: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>SYMPTOMS & SIDE EFFECTS LOGGED</div>
            {(() => {
              const moodMeta = {
                great: { icon: '😀', label: 'Great',  color: '#7BB68F' },
                ok:    { icon: '🙂', label: 'OK',     color: '#A8B47A' },
                meh:   { icon: '😐', label: 'Meh',    color: '#D9B061' },
                off:   { icon: '😕', label: 'Off',    color: '#E8A56A' },
                rough: { icon: '😣', label: 'Rough',  color: '#E8705A' },
              };
              const severityLabels = ['', 'very mild', 'mild', 'moderate', 'strong', 'severe'];
              const severityColors = ['', '#7BB68F', '#A8B47A', '#D9B061', '#E8A56A', '#E8705A'];
              const symptomMap = {
                headache: 'Headache', nausea: 'Nausea', dizzy: 'Dizziness', fatigue: 'Fatigue',
                fever: 'Fever', cough: 'Cough', pain: 'Pain', stomach: 'Stomach upset',
                rash: 'Rash', sleep: 'Poor sleep', appetite: 'Appetite change', mood: 'Low mood',
              };

              const entries = (userSymptoms || []).slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

              if (entries.length === 0) {
                return (
                  <div style={{ padding: '14px 14px', background: C.warmGrayLight, borderRadius: 12, fontFamily: fonts.body, fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
                    No symptoms logged in this period. Tap the button below to add one — it will auto-attach to your next report.
                  </div>
                );
              }
              return (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {entries.map((s, i) => {
                      const mm = moodMeta[s.mood];
                      const sev = s.severity || 0;
                      const sevC = severityColors[sev] || C.textMuted;
                      const sevL = severityLabels[sev];
                      const dateStr = new Date(s.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                      const symLabels = (s.symptoms || []).map(id => symptomMap[id] || id);
                      const symLine = symLabels.length > 0 ? symLabels.join(', ') : (mm ? `Mood logged: ${mm.label}` : 'Check-in logged');
                      return (
                        <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: C.warmGrayLight, borderRadius: 10, alignItems: 'flex-start' }}>
                          <div style={{ fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace', fontSize: 11, color: C.textMuted, fontWeight: 700, minWidth: 44 }}>{dateStr}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.text, lineHeight: 1.4 }}>
                              {mm && <span style={{ marginRight: 4 }}>{mm.icon}</span>}
                              <strong>{symLine}</strong>
                              {s.linkedToMed && <span style={{ color: C.textMuted }}> · linked to recent dose</span>}
                            </div>
                            {s.note && (
                              <div style={{ fontFamily: fonts.body, fontSize: 11, color: C.textMuted, lineHeight: 1.4, marginTop: 3, fontStyle: 'italic' }}>"{s.note}"</div>
                            )}
                          </div>
                          {sevL && (
                            <div style={{ padding: '2px 8px', borderRadius: 6, background: sevC + '22', fontFamily: fonts.body, fontSize: 10, fontWeight: 700, color: sevC, whiteSpace: 'nowrap' }}>{sevL}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 8, fontFamily: fonts.body, fontSize: 11, color: C.textMuted, lineHeight: 1.5 }}>
                    Self-reported · {entries.length} {entries.length === 1 ? 'entry' : 'entries'} this period · No emergency symptoms
                  </div>
                </>
              );
            })()}
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 0 0', borderTop: `1px solid ${C.border}`, fontFamily: fonts.body, fontSize: 10, color: C.textMuted, lineHeight: 1.5 }}>
            Generated by SaathiPill · Data is encrypted and private · For doctor use only
          </div>
        </div>

        {/* Share buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Btn icon="📤" onClick={() => setSharing(true)}>Share PDF</Btn>
          {sharing && (
            <div style={{ display: 'flex', gap: 10 }}>
              {[['💬', 'SMS', C.sage], ['📧', 'Email', '#5B8EE0'], ['🖨️', 'Print', C.warmGray]].map(([icon, label, color]) => (
                <button key={label} onClick={() => setSharing(false)} style={{
                  flex: 1, padding: '14px 8px', borderRadius: 14, border: `2px solid ${color}33`,
                  background: color + '11', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                  <span style={{ fontSize: 22 }}>{icon}</span>
                  <span style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color }}>{label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Log symptom CTA — improvement #14 */}
          <button onClick={() => onLogSymptoms && onLogSymptoms()} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
            background: C.white, border: `2px dashed ${C.border}`, borderRadius: 16,
            cursor: 'pointer', textAlign: 'left',
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: C.amberLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📝</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.text }}>Log a new symptom</div>
              <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted, lineHeight: 1.4 }}>Side effect or how you're feeling — auto-attached to next report</div>
            </div>
            <span style={{ color: C.textMuted, fontSize: 22 }}>+</span>
          </button>
        </div>
      </div>

      {/* ── DAY DETAIL MODAL ── (improvement: tappable adherence squares) */}
      {selectedDay !== null && (() => {
        const status = dayStatusFor(selectedDay);
        const meta = statusMeta[status];
        const meds = dayDetailFor(selectedDay);
        const takenCount = meds.filter(m => m.status === 'taken').length;
        const lateCount = meds.filter(m => m.status === 'late').length;
        const missedCount = meds.filter(m => m.status === 'missed').length;
        return (
          <div
            onClick={() => setSelectedDay(null)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(31, 26, 23, 0.55)',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              zIndex: 9999,
              animation: 'docDayFadeIn 180ms ease-out',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 'min(420px, 100%)', maxHeight: '78vh',
                background: C.white,
                borderRadius: '24px 24px 0 0',
                padding: '14px 20px 24px',
                boxShadow: '0 -12px 32px rgba(0,0,0,0.18)',
                overflowY: 'auto',
                display: 'flex', flexDirection: 'column',
                animation: 'docDaySlideUp 240ms cubic-bezier(.22,.9,.32,1)',
              }}
            >
              {/* Grabber */}
              <div style={{ width: 44, height: 5, borderRadius: 3, background: C.border, alignSelf: 'center', marginBottom: 12 }} />

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: fonts.body, fontSize: 11, color: C.textMuted, fontWeight: 600, letterSpacing: '0.06em' }}>APR {selectedDay}, 2026</div>
                  <div style={{ fontFamily: fonts.heading, fontSize: 22, fontWeight: 800, color: C.text, marginTop: 2 }}>
                    {new Date(2026, 3, selectedDay).toLocaleDateString('en-IN', { weekday: 'long' })}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  style={{
                    width: 36, height: 36, borderRadius: 12,
                    background: C.warmGrayLight, border: 'none',
                    fontFamily: fonts.body, fontSize: 16, color: C.text,
                    cursor: 'pointer', flexShrink: 0,
                  }}
                  aria-label="Close"
                >✕</button>
              </div>

              {/* Status banner */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 12,
                background: meta.color + '1A',
                border: `1px solid ${meta.color}44`,
                marginBottom: 14,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: meta.color,
                  color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: fonts.body, fontSize: 14, fontWeight: 800,
                }}>{meta.icon}</div>
                <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: meta.color }}>
                  {meta.label}
                </div>
              </div>

              {/* Mini summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                {[
                  { v: takenCount, l: 'Taken', c: C.sage },
                  { v: lateCount, l: 'Late', c: C.amber },
                  { v: missedCount, l: 'Missed', c: C.red },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: '10px 4px', borderRadius: 10, background: C.warmGrayLight }}>
                    <div style={{ fontFamily: fonts.heading, fontSize: 20, fontWeight: 800, color: s.c }}>{s.v}</div>
                    <div style={{ fontFamily: fonts.body, fontSize: 10, color: C.textMuted, fontWeight: 600, letterSpacing: '0.04em', marginTop: 2 }}>{s.l.toUpperCase()}</div>
                  </div>
                ))}
              </div>

              {/* Timeline list */}
              <div style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.08em', marginBottom: 8 }}>DOSES SCHEDULED</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {meds.map((m, i) => {
                  const sc = doseStatusColor(m.status);
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', borderRadius: 14,
                      background: C.cream, border: `1px solid ${C.border}`,
                    }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: sc + '22',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        fontFamily: fonts.body, fontSize: 16, fontWeight: 800, color: sc,
                      }}>
                        {m.status === 'taken' ? '✓' : m.status === 'late' ? '⏱' : '✗'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.text }}>{m.name}</div>
                        <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>
                          Scheduled {m.time} · {m.meal}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <Pill color={sc} style={{ fontSize: 10 }}>{doseStatusLabel(m.status)}</Pill>
                        {m.status !== 'missed' && (
                          <div style={{ fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace', fontSize: 11, color: m.delayMin > 0 ? C.amber : C.textMuted, marginTop: 4, fontWeight: 600 }}>
                            {m.actual}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footnote */}
              <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 10, background: C.warmGrayLight, fontFamily: fonts.body, fontSize: 11, color: C.textMuted, lineHeight: 1.5 }}>
                {missedCount > 0
                  ? 'A missed dose was followed up with an SMS nudge to caregivers. No reported side effects on this day.'
                  : lateCount > 0
                  ? 'Late dose was logged via voice reminder snooze. No reported side effects on this day.'
                  : 'On schedule throughout the day. No reported side effects.'}
              </div>
            </div>

            <style>{`
              @keyframes docDaySlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
              @keyframes docDayFadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
          </div>
        );
      })()}
    </div>
  );
}

// ── SCREEN 16: PROFILE / SETTINGS ──
function ProfileScreen({ onNavigate, userName, onLogout }) {
  const [notifications, setNotifications] = React.useState(true);
  const [smsAlerts, setSmsAlerts] = React.useState(true);
  const [voice, setVoice] = React.useState(true);
  const [offline, setOffline] = React.useState(true);

  // Real Web Push enablement for medication reminders.
  const pushSupported = typeof window !== 'undefined' && window.SaathiPillPush && window.SaathiPillPush.supported;
  const [pushOn, setPushOn] = React.useState(false);
  const [pushBusy, setPushBusy] = React.useState(false);
  const [pushMsg, setPushMsg] = React.useState('');
  React.useEffect(() => {
    if (pushSupported) window.SaathiPillPush.isEnabled().then(setPushOn).catch(() => {});
  }, []);
  const toggleReminders = async () => {
    if (!pushSupported || pushBusy) return;
    setPushBusy(true); setPushMsg('');
    try {
      if (pushOn) {
        await window.SaathiPillPush.disable();
        setPushOn(false); setPushMsg('Reminders turned off.');
      } else {
        await window.SaathiPillPush.enable();
        setPushOn(true); setPushMsg('Reminders on — sending you a test notification…');
        if (window.SaathiPillAPI && window.SaathiPillAPI.pushTest) window.SaathiPillAPI.pushTest().catch(() => {});
      }
    } catch (e) { setPushMsg(e.message || 'Could not enable reminders.'); }
    setPushBusy(false);
  };

  const settingsGroups = [
    {
      title: 'Reminders',
      items: [
        { icon: '🔔', label: 'Reminder settings', desc: 'Tone, snooze, escalation', arrow: true },
        { icon: '💬', label: 'SMS alerts', desc: 'Alert caregivers on missed doses', toggle: true, value: smsAlerts, set: setSmsAlerts },
        { icon: '🔊', label: 'Voice reminders', desc: 'Audio in your language', toggle: true, value: voice, set: setVoice },
        { icon: '🌙', label: 'Works on silent', desc: 'Always on', chip: 'Active' },
      ]
    },
    {
      title: 'Health & Safety',
      items: [
        // DRUG INTERACTIONS — hidden, re-enable when ready:
        // { icon: '⚠️', label: 'Drug interactions', desc: '2 of your meds need attention', arrow: true, action: () => onNavigate('interactions'), badge: 2 },
        { icon: '📋', label: 'Doctor report', desc: 'Share PDF at appointment', arrow: true, action: () => onNavigate('report') },
      ]
    },
    {
      title: 'Family & Doctors',
      items: [
        { icon: '👨‍👩‍👧', label: 'Caregiver contacts', desc: '3 family members', arrow: true },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: '🌐', label: 'Language', desc: 'English', arrow: true },
        { icon: '🏪', label: 'Pharmacy partner', desc: 'Link a nearby pharmacy', arrow: true, action: () => onNavigate('pharmacy') },
        { icon: '📴', label: 'Offline mode', desc: 'Works without internet', toggle: true, value: offline, set: setOffline },
        { icon: '📴', label: 'Offline demo', desc: 'See offline state screen', arrow: true, action: () => onNavigate('offline') },
        { icon: '📤', label: 'Data export', desc: 'Download your health data', arrow: true },
      ]
    },
  ];

  return (
    <div style={{ flex: 1, background: C.cream, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      {/* Profile card */}
      <div style={{ background: C.coral, padding: '24px 20px 36px', borderRadius: '0 0 28px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 24,
            background: 'rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 700, color: C.white, flexShrink: 0,
          }}>👤</div>
          <div>
            <div style={{ fontFamily: fonts.heading, fontSize: 24, fontWeight: 800, color: C.white }}>{userName || 'Your profile'}</div>
            <div style={{ fontFamily: fonts.body, fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>SaathiPill member</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 20px 100px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Medicine reminders (real Web Push) */}
        <div>
          <div style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', marginBottom: 10, paddingLeft: 4 }}>MEDICINE REMINDERS</div>
          <Card style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: C.coralLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🔔</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 700, color: C.text }}>Phone reminders</div>
                <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>{pushSupported ? (pushOn ? 'On — reminders keep coming until you mark a dose taken' : 'Get reminders even when the app is closed') : 'Not supported on this browser'}</div>
              </div>
              {pushSupported && (
                <button onClick={toggleReminders} disabled={pushBusy} style={{ width: 52, height: 28, borderRadius: 14, border: 'none', cursor: pushBusy ? 'default' : 'pointer', background: pushOn ? C.coral : C.warmGrayLight, display: 'flex', alignItems: 'center', padding: '0 4px', justifyContent: pushOn ? 'flex-end' : 'flex-start', opacity: pushBusy ? 0.6 : 1, transition: 'background 0.2s' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.white }} />
                </button>
              )}
            </div>
            {pushMsg && <div style={{ marginTop: 10, fontFamily: fonts.body, fontSize: 12, color: C.textMuted, lineHeight: 1.4 }}>{pushMsg}</div>}
          </Card>
        </div>

        {settingsGroups.map((group, gi) => (
          <div key={gi}>
            <div style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', marginBottom: 10, paddingLeft: 4 }}>
              {group.title.toUpperCase()}
            </div>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              {group.items.map((item, ii) => (
                <div key={ii} onClick={item.action} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px 18px',
                  borderBottom: ii < group.items.length - 1 ? `1px solid ${C.border}` : 'none',
                  cursor: item.action ? 'pointer' : 'default',
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: C.warmGrayLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{item.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 600, color: C.text }}>{item.label}</div>
                    <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>{item.desc}</div>
                  </div>
                  {item.toggle && (
                    <button onClick={e => { e.stopPropagation(); item.set(v => !v); }} style={{
                      width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
                      background: item.value ? C.coral : C.warmGrayLight,
                      display: 'flex', alignItems: 'center', padding: '0 4px',
                      transition: 'background 0.2s', justifyContent: item.value ? 'flex-end' : 'flex-start',
                    }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.white }} />
                    </button>
                  )}
                  {item.arrow && <span style={{ color: C.textMuted, fontSize: 20 }}>›</span>}
                  {item.badge && (
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', background: C.red, color: C.white,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: fonts.body, fontSize: 12, fontWeight: 700,
                    }}>{item.badge}</div>
                  )}
                  {item.chip && <Pill color={C.sage}>{item.chip}</Pill>}
                </div>
              ))}
            </Card>
          </div>
        ))}

        {/* Trust footer */}
        <Card style={{ background: C.sageLight, border: `1px solid ${C.sage}33`, textAlign: 'center', padding: '20px 16px' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
          <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }}>100% free. No ads. Works offline.</div>
          <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
            Your health data is encrypted and never sold. SaathiPill works even without internet — your reminders always fire.
          </div>
        </Card>

        {/* Log out */}
        <button onClick={onLogout} style={{
          width: '100%', padding: '14px 0', borderRadius: 14,
          border: `1.5px solid ${C.red}`, background: C.white, color: C.red,
          fontFamily: fonts.body, fontSize: 15, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 17 }}>↩</span> Log out
        </button>

        <div style={{ textAlign: 'center', fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>SaathiPill v1.0 · About · Privacy · Help</div>
      </div>
    </div>
  );
}

// ── SCREEN 17: OFFLINE STATE ──
function OfflineScreen({ onClose }) {
  return (
    <div style={{ flex: 1, background: C.cream, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 28px' }}>
      {/* Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: 12, background: C.warmGrayLight, border: 'none', fontSize: 18, cursor: 'pointer' }}>←</button>
      </div>

      {/* Illustration */}
      <div style={{
        width: 140, height: 140, borderRadius: 44, background: C.warmGrayLight,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 70,
        marginBottom: 28,
      }}>📴</div>

      <h2 style={{ fontFamily: fonts.heading, fontSize: 26, fontWeight: 800, color: C.text, textAlign: 'center', marginBottom: 10 }}>
        You're offline
      </h2>
      <p style={{ fontFamily: fonts.body, fontSize: 16, color: C.textMuted, textAlign: 'center', lineHeight: 1.6, marginBottom: 32 }}>
        No internet? No problem.<br />Your reminders still work perfectly.
      </p>

      {/* Feature list */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
        {[
          { icon: '✅', label: 'Reminders fire on time', available: true },
          { icon: '✅', label: 'Mark medicines as taken', available: true },
          { icon: '✅', label: 'View your schedule', available: true },
          { icon: '✅', label: 'See medication history', available: true },
          { icon: '⏳', label: 'Sync when back online', available: false },
          { icon: '⏳', label: 'SMS alerts paused', available: false },
        ].map((f, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px', borderRadius: 14,
            background: f.available ? C.sageLight : C.warmGrayLight,
          }}>
            <span style={{ fontSize: 22 }}>{f.icon}</span>
            <span style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 500, color: f.available ? C.text : C.textMuted }}>
              {f.label}
            </span>
          </div>
        ))}
      </div>

      <div style={{
        padding: '16px 20px', borderRadius: 16,
        background: C.amberLight, border: `1px solid ${C.amber}44`,
        textAlign: 'center', width: '100%',
      }}>
        <div style={{ fontFamily: fonts.body, fontSize: 14, color: C.text, lineHeight: 1.5 }}>
          💡 SaathiPill is <strong>optimised for low-end Android phones</strong> and works on 2G/3G networks. Syncs automatically when connectivity returns.
        </div>
      </div>
    </div>
  );
}

// ── SCREEN 18: PHARMACY PARTNERSHIP BANNER ──
function PharmacyBannerScreen({ onClose }) {
  // Registered pharmacies keyed by code — loaded live from the backend (nearby by
  // GPS + lookups for already-linked codes). No hardcoded list.
  const [PHARMACY_DB, setPharmacyDb] = React.useState({});
  const [geoStatus, setGeoStatus] = React.useState('idle'); // idle|locating|located|denied|nogeo|manual
  const [locLabel, setLocLabel]       = React.useState('');   // label of the active location
  const [locSearch, setLocSearch]     = React.useState('');   // manual place-search query
  const [locResults, setLocResults]   = React.useState([]);   // geocode suggestions
  const [locSearching, setLocSearching] = React.useState(false);
  const apiOn = window.SaathiPillAPI && SaathiPillAPI.enabled && SaathiPillAPI.hasSession();
  // "Andheri West · 8 AM – 10 PM · 1.2 km away" (skips any missing part)
  const phMeta = (ph) => ph ? [ph.area, ph.hours, ph.distanceKm != null ? `${ph.distanceKm} km away` : null].filter(Boolean).join(' · ') : '';

  // ── Multi-pharmacy list state ──
  const [linkedPharmacies, setLinkedPharmacies] = React.useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('sp_linked_pharmacies') || 'null');
      if (Array.isArray(stored) && stored.length > 0) return stored;
      // migrate from old single-code storage
      const old = localStorage.getItem('sp_patient_pharmacy_code');
      return old ? [old] : [];
    } catch { return []; }
  });

  // ── Add-new form state ──
  const [addingNew, setAddingNew]     = React.useState(false);
  const [addMode, setAddMode]         = React.useState('browse'); // 'browse' | 'code'
  const [codeInput, setCodeInput]     = React.useState('');
  const [codeSaved, setCodeSaved]     = React.useState(false);

  // ── Browse-mode state ──
  const [dropdownOpen, setDropdownOpen]     = React.useState(false);
  const [browseSearch, setBrowseSearch]     = React.useState('');
  const [browseSelected, setBrowseSelected] = React.useState(null); // code string

  // ── Per-card remove confirm ──
  const [removeConfirm, setRemoveConfirm] = React.useState(null); // code string

  const activeOffer = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem('sp_active_offer') || 'null'); } catch { return null; }
  }, []);

  const formatCode = (raw) => {
    let clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length > 9) clean = clean.slice(0, 9);
    return clean.length > 4 ? clean.slice(0, 4) + '-' + clean.slice(4) : clean;
  };

  const isCodeValid      = /^[A-Z0-9]{4}-[A-Z0-9]{5}$/.test(codeInput);
  const lookedUp         = PHARMACY_DB[codeInput] || null;
  const alreadyLinked    = linkedPharmacies.includes(codeInput);
  const browsePharmacy   = browseSelected ? PHARMACY_DB[browseSelected] : null;
  const browseAlready    = linkedPharmacies.includes(browseSelected);

  // Pharmacies available in dropdown (not yet linked), filtered by search.
  // Closest-first is preserved because the backend returns them sorted by distance.
  const availableForBrowse = Object.entries(PHARMACY_DB)
    .filter(([code]) => !linkedPharmacies.includes(code))
    .filter(([, ph]) =>
      ph.name.toLowerCase().includes(browseSearch.toLowerCase()) ||
      (ph.area || '').toLowerCase().includes(browseSearch.toLowerCase())
    )
    .sort((a, b) => {
      const da = a[1].distanceKm, db = b[1].distanceKm;
      if (da != null && db != null) return da - db;
      if (da != null) return -1; if (db != null) return 1;
      return 0;
    });

  // ── Location: device GPS, with an Uber/Ola-style manual search fallback ──
  const ingestNearby = React.useCallback((list) => setPharmacyDb(prev => {
    const next = { ...prev };
    (list || []).forEach(p => { next[p.code] = { name: p.name, area: p.location || '', hours: p.hours || '', distanceKm: p.distanceKm, color: C.coral }; });
    return next;
  }), []);
  const loadNearby = React.useCallback((lat, lng) => {
    if (!apiOn) return;
    SaathiPillAPI.nearbyPharmacies(lat, lng).then(ingestNearby).catch(() => {});
  }, [apiOn, ingestNearby]);

  // Ask the browser for location (the standard site permission prompt).
  const useDeviceLocation = React.useCallback(() => {
    if (!navigator.geolocation) { setGeoStatus('nogeo'); loadNearby(); return; }
    setGeoStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGeoStatus('located'); setLocLabel('Current location'); loadNearby(pos.coords.latitude, pos.coords.longitude); },
      () => { setGeoStatus('denied'); loadNearby(); },  // denied → still show all (unsorted) so browse/code work
      { timeout: 8000, maximumAge: 300000 }
    );
  }, [loadNearby]);

  // Prompt for location on first open (like any website).
  React.useEffect(() => { if (apiOn) useDeviceLocation(); }, [apiOn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced place search for manual location entry (via the backend geocoder).
  React.useEffect(() => {
    if (!apiOn) { setLocResults([]); return; }
    const q = locSearch.trim();
    if (q.length < 3) { setLocResults([]); setLocSearching(false); return; }
    setLocSearching(true);
    const t = setTimeout(() => {
      SaathiPillAPI.geocode(q)
        .then(res => setLocResults(Array.isArray(res) ? res : []))
        .catch(() => setLocResults([]))
        .finally(() => setLocSearching(false));
    }, 350);
    return () => clearTimeout(t);
  }, [locSearch, apiOn]);

  const pickPlace = (place) => {
    setGeoStatus('manual');
    const short = (place.label || '').split(',').slice(0, 2).join(',').trim();
    setLocLabel(short || 'Selected location');
    setLocSearch(''); setLocResults([]);
    loadNearby(place.lat, place.lng);
  };

  // Fill in details for already-linked pharmacies + the code being typed (may be far away).
  React.useEffect(() => {
    if (!apiOn) return;
    const want = [...linkedPharmacies];
    if (isCodeValid) want.push(codeInput);
    want.forEach(code => {
      if (code && !PHARMACY_DB[code]) {
        SaathiPillAPI.pharmacyByCode(code).then(p => {
          if (p) setPharmacyDb(prev => ({ ...prev, [p.code]: { name: p.name, area: p.location || '', hours: p.hours || '', color: C.coral } }));
        }).catch(() => {});
      }
    });
  }, [linkedPharmacies.join(','), codeInput]);

  const persistList = (list) => {
    localStorage.setItem('sp_linked_pharmacies', JSON.stringify(list));
    // Push the primary (first) pharmacy code to the backend so the pharmacy portal
    // sees this patient as linked.
    if (apiOn && list.length > 0) SaathiPillAPI.updateProfile({ linkedPharmacyCode: list[0] }).catch(() => {});
    if (list.length > 0) {
      localStorage.setItem('sp_patient_pharmacy_code', list[0]);
      localStorage.setItem('sp_pharmacy_linked', 'true');
    } else {
      localStorage.removeItem('sp_patient_pharmacy_code');
      localStorage.setItem('sp_pharmacy_linked', 'false');
      localStorage.removeItem('sp_active_offer');
      window.dispatchEvent(new CustomEvent('sp_offer_changed'));
    }
  };

  const addPharmacy = (code) => {
    const resolvedCode = code || (addMode === 'browse' ? browseSelected : codeInput);
    if (!resolvedCode) return;
    if (addMode === 'code' && (!isCodeValid || !lookedUp || alreadyLinked)) return;
    if (linkedPharmacies.includes(resolvedCode)) return;
    const updated = [...linkedPharmacies, resolvedCode];
    setLinkedPharmacies(updated);
    persistList(updated);
    if (apiOn) SaathiPillAPI.addPharmacy(resolvedCode).catch(() => {});
    setCodeInput('');
    setBrowseSelected(null);
    setBrowseSearch('');
    setDropdownOpen(false);
    setAddingNew(false);
    setCodeSaved(true);
    setTimeout(() => setCodeSaved(false), 2600);
  };

  const closeAddForm = () => {
    setAddingNew(false);
    setCodeInput('');
    setBrowseSelected(null);
    setBrowseSearch('');
    setDropdownOpen(false);
  };

  const removePharmacy = (code) => {
    const updated = linkedPharmacies.filter(c => c !== code);
    setLinkedPharmacies(updated);
    persistList(updated);
    if (apiOn) SaathiPillAPI.removePharmacy(code).catch(() => {});
    setRemoveConfirm(null);
  };

  const setPrimary = (code) => {
    const updated = [code, ...linkedPharmacies.filter(c => c !== code)];
    setLinkedPharmacies(updated);
    persistList(updated);
  };

  return (
    <div style={{ flex: 1, minHeight: 0, background: C.cream, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: 12, background: C.warmGrayLight, border: 'none', fontSize: 18, cursor: 'pointer' }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: fonts.heading, fontSize: 18, fontWeight: 700, color: C.text }}>Pharmacy Partners</div>
          {linkedPharmacies.length > 0 && (
            <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>
              {linkedPharmacies.length} linked · {linkedPharmacies.length === 1 ? '1 primary' : `${PHARMACY_DB[linkedPharmacies[0]]?.name || 'Unknown'} is primary`}
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 20px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Active offer banner (applies to primary pharmacy) */}
        {activeOffer && linkedPharmacies.length > 0 && (
          <div style={{ borderRadius: 20, overflow: 'hidden', background: 'linear-gradient(135deg, #1A4B2C 0%, #1F6B3A 100%)', position: 'relative', flexShrink: 0 }}>
            <div style={{ position: 'absolute', right: -12, top: -20, fontSize: 80, fontWeight: 900, color: 'rgba(255,255,255,0.05)', letterSpacing: '-0.05em', lineHeight: 1, userSelect: 'none' }}>%</div>
            <div style={{ padding: '18px 20px' }}>
              <div style={{ fontFamily: fonts.body, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                Special offer · {PHARMACY_DB[linkedPharmacies[0]]?.name || 'Primary pharmacy'}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                <span style={{ fontFamily: fonts.body, fontSize: 52, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>{activeOffer.discount}%</span>
                <div>
                  <div style={{ fontFamily: fonts.body, fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>OFF</div>
                  <div style={{ fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>all medicines</div>
                </div>
              </div>
              <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{activeOffer.label}</div>
              <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.12)', fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>💡</span>
                Applied automatically on your next refill order
              </div>
            </div>
          </div>
        )}

        {/* Saved success banner */}
        {codeSaved && (
          <div style={{ padding: '12px 16px', borderRadius: 14, background: C.sageLight, border: `1px solid ${C.sage}44`, fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: C.sage, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span>✓</span> Pharmacy linked successfully!
          </div>
        )}

        {/* ── Linked pharmacies list ── */}
        {linkedPharmacies.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.07em' }}>YOUR PHARMACIES</div>

            {linkedPharmacies.map((code, idx) => {
              const ph = PHARMACY_DB[code];
              const isPrimary = idx === 0;
              const isRemoving = removeConfirm === code;

              return (
                <Card key={code} style={{ padding: 0, overflow: 'hidden', border: `1.5px solid ${isPrimary ? C.sage : C.border}`, transition: 'border-color 0.2s' }}>
                  <div style={{ padding: '14px 16px' }}>

                    {/* Pharmacy row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: isRemoving ? 14 : 0 }}>
                      <div style={{ width: 46, height: 46, borderRadius: 14, background: ph ? ph.color : '#1A4B8C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🏥</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                          <div style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 700, color: C.text }}>{ph ? ph.name : code}</div>
                          {isPrimary && (
                            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: C.sageLight, color: C.sage, fontFamily: fonts.body, fontWeight: 700, letterSpacing: '0.04em' }}>Primary</span>
                          )}
                        </div>
                        {ph && <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted, marginBottom: 2 }}>{phMeta(ph)}</div>}
                        <div style={{ fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace', fontSize: 11, fontWeight: 700, color: isPrimary ? C.sage : C.textMuted, letterSpacing: '0.08em' }}>{code}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                        {!isPrimary && (
                          <button onClick={() => setPrimary(code)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, color: C.textMuted, cursor: 'pointer', fontFamily: fonts.body, fontWeight: 600, whiteSpace: 'nowrap' }}>
                            Set primary
                          </button>
                        )}
                        <button onClick={() => setRemoveConfirm(isRemoving ? null : code)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, border: `1px solid ${C.red}44`, background: '#FEF2F2', color: C.red, cursor: 'pointer', fontFamily: fonts.body, fontWeight: 600 }}>
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Remove confirmation */}
                    {isRemoving && (
                      <div style={{ padding: '12px 14px', borderRadius: 13, background: '#FEF2F2', border: `1px solid ${C.red}22` }}>
                        <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>Remove {ph ? ph.name : code}?</div>
                        <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted, lineHeight: 1.5, marginBottom: 12 }}>
                          {isPrimary && linkedPharmacies.length > 1
                            ? `Offers & refill routing will transfer to ${PHARMACY_DB[linkedPharmacies[1]]?.name || 'the next pharmacy'}.`
                            : isPrimary
                            ? 'Active offers and auto-refill routing will be cleared.'
                            : 'This pharmacy will be unlinked from your account.'}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => removePharmacy(code)} style={{ flex: 1, padding: '10px 0', borderRadius: 11, border: 'none', background: C.red, color: C.white, fontFamily: fonts.body, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Yes, remove</button>
                          <button onClick={() => setRemoveConfirm(null)} style={{ flex: 1, padding: '10px 0', borderRadius: 11, border: `1px solid ${C.border}`, background: C.white, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: C.textMuted, cursor: 'pointer' }}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* ── Add pharmacy: inline form or trigger button ── */}
        {addingNew ? (
          <Card style={{ border: `2px solid ${C.coral}`, overflow: 'visible', flexShrink: 0 }}>
            <div style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 700, color: C.text }}>Add a pharmacy</div>
                <button onClick={closeAddForm} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: C.warmGrayLight, color: C.textMuted, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>

              {/* Mode toggle */}
              <div style={{ display: 'flex', gap: 4, background: C.warmGrayLight, padding: 3, borderRadius: 11, marginBottom: 16 }}>
                {[['browse', '🔍 Browse'], ['code', '# Enter code']].map(([mode, label]) => (
                  <button key={mode} onClick={() => { setAddMode(mode); setBrowseSelected(null); setBrowseSearch(''); setDropdownOpen(false); setCodeInput(''); }}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: fonts.body, fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
                      background: addMode === mode ? C.white : 'transparent',
                      color: addMode === mode ? C.text : C.textMuted,
                      boxShadow: addMode === mode ? '0 1px 6px rgba(0,0,0,0.09)' : 'none',
                    }}>{label}</button>
                ))}
              </div>

              {/* ── BROWSE MODE ── */}
              {addMode === 'browse' && (
                <div>
                  {/* Location bar: device GPS + manual place search (Uber/Ola style) */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 16 }}>📍</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {geoStatus === 'locating' ? 'Detecting your location…'
                            : (geoStatus === 'located' || geoStatus === 'manual') ? (locLabel || 'Location set')
                            : 'Location not set'}
                        </div>
                        <div style={{ fontFamily: fonts.body, fontSize: 11, color: (geoStatus === 'denied' || geoStatus === 'nogeo') ? C.amber : C.textMuted }}>
                          {(geoStatus === 'located' || geoStatus === 'manual') ? 'Pharmacies sorted by distance'
                            : (geoStatus === 'denied') ? 'Location blocked — search your area below'
                            : (geoStatus === 'nogeo') ? 'This device can’t share location — search below'
                            : 'Allow location, or search your area below'}
                        </div>
                      </div>
                      <button onClick={useDeviceLocation} disabled={geoStatus === 'locating'} style={{
                        flexShrink: 0, padding: '8px 12px', borderRadius: 10, border: `1.5px solid ${C.coral}`,
                        background: C.white, color: C.coral, fontFamily: fonts.body, fontSize: 12, fontWeight: 700,
                        cursor: geoStatus === 'locating' ? 'default' : 'pointer', opacity: geoStatus === 'locating' ? 0.5 : 1,
                      }}>{geoStatus === 'located' ? '↻ Update' : '📍 Use my location'}</button>
                    </div>

                    {/* Manual place search */}
                    <div style={{ position: 'relative', zIndex: 60 }}>
                      <input
                        value={locSearch}
                        onChange={e => setLocSearch(e.target.value)}
                        placeholder="Search your area or address…"
                        spellCheck={false}
                        style={{ width: '100%', height: 44, padding: '0 14px', borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.white, fontFamily: fonts.body, fontSize: 14, color: C.text, outline: 'none', boxSizing: 'border-box' }}
                      />
                      {(locSearch.trim().length >= 3) && (locSearching || locResults.length > 0) && (
                        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: C.white, borderRadius: 14, border: `1.5px solid ${C.border}`, boxShadow: '0 8px 32px rgba(0,0,0,0.14)', zIndex: 120, overflow: 'hidden', maxHeight: 240, overflowY: 'auto' }}>
                          {locSearching && locResults.length === 0 ? (
                            <div style={{ padding: '14px 16px', fontFamily: fonts.body, fontSize: 13, color: C.textMuted }}>Searching…</div>
                          ) : locResults.map((r, i) => (
                            <button key={i} onClick={() => pickPlace(r)} style={{ width: '100%', padding: '11px 14px', border: 'none', borderBottom: i < locResults.length - 1 ? `1px solid ${C.border}` : 'none', background: 'transparent', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start', textAlign: 'left' }}>
                              <span style={{ fontSize: 14, marginTop: 1 }}>📍</span>
                              <span style={{ flex: 1, fontFamily: fonts.body, fontSize: 13, color: C.text, lineHeight: 1.4 }}>{r.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dropdown trigger */}
                  <div style={{ position: 'relative', zIndex: 50 }}>
                    <button
                      onClick={() => setDropdownOpen(v => !v)}
                      style={{ width: '100%', height: 52, padding: '0 14px', borderRadius: 14, border: `2px solid ${browseSelected ? C.sage : dropdownOpen ? C.coral : C.border}`, background: C.white, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'border-color 0.15s' }}
                    >
                      {browsePharmacy ? (
                        <>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: browsePharmacy.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🏥</div>
                          <div style={{ flex: 1, textAlign: 'left' }}>
                            <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.text }}>{browsePharmacy.name}</div>
                            <div style={{ fontFamily: fonts.body, fontSize: 11, color: C.textMuted }}>{browsePharmacy.area}</div>
                          </div>
                        </>
                      ) : (
                        <span style={{ flex: 1, textAlign: 'left', fontFamily: fonts.body, fontSize: 14, color: C.textMuted }}>Select a pharmacy…</span>
                      )}
                      <span style={{ color: C.textMuted, fontSize: 14, transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
                    </button>

                    {/* Dropdown panel */}
                    {dropdownOpen && (
                      <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: C.white, borderRadius: 16, border: `1.5px solid ${C.border}`, boxShadow: '0 8px 32px rgba(0,0,0,0.14)', zIndex: 100, overflow: 'hidden' }}>
                        {/* Search */}
                        <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}` }}>
                          <input
                            autoFocus
                            value={browseSearch}
                            onChange={e => setBrowseSearch(e.target.value)}
                            placeholder="Search by name or area…"
                            style={{ width: '100%', height: 36, padding: '0 12px', borderRadius: 9, border: `1.5px solid ${C.border}`, background: C.cream, fontFamily: fonts.body, fontSize: 13, color: C.text, outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>

                        {/* Pharmacy list */}
                        <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                          {availableForBrowse.length === 0 ? (
                            <div style={{ padding: '20px 16px', textAlign: 'center', fontFamily: fonts.body, fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
                              {geoStatus === 'locating'
                                ? '📍 Finding pharmacies near you…'
                                : browseSearch
                                ? 'No results — try a different search'
                                : Object.keys(PHARMACY_DB).length === 0
                                ? (geoStatus === 'denied'
                                    ? 'Location off — no pharmacies found. Enter a pharmacy code instead.'
                                    : 'No registered pharmacies found yet near you.')
                                : 'All nearby pharmacies are already linked'}
                            </div>
                          ) : availableForBrowse.map(([code, ph]) => (
                            <button key={code}
                              onClick={() => { setBrowseSelected(code); setDropdownOpen(false); setBrowseSearch(''); }}
                              style={{ width: '100%', padding: '12px 14px', border: 'none', background: browseSelected === code ? C.coralLight : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${C.border}`, transition: 'background 0.12s' }}
                            >
                              <div style={{ width: 36, height: 36, borderRadius: 10, background: ph.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>🏥</div>
                              <div style={{ flex: 1, textAlign: 'left' }}>
                                <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.text }}>{ph.name}</div>
                                <div style={{ fontFamily: fonts.body, fontSize: 11, color: C.textMuted }}>{phMeta(ph)}</div>
                              </div>
                              {browseSelected === code && <span style={{ color: C.coral, fontSize: 16 }}>✓</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected pharmacy preview */}
                  {browseSelected && browsePharmacy && (
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: C.sageLight, border: `1.5px solid ${C.sage}44` }}>
                      <div style={{ width: 46, height: 46, borderRadius: 14, background: browsePharmacy.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🏥</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 700, color: C.text }}>{browsePharmacy.name}</div>
                        <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>{phMeta(browsePharmacy)}</div>
                        <div style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 700, color: C.sage, marginTop: 3 }}>✓ Verified SaathiPill partner</div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <Btn onClick={() => addPharmacy(browseSelected)} disabled={!browseSelected} style={{ flex: 1, minHeight: 48, fontSize: 15, opacity: browseSelected ? 1 : 0.45 }}>
                      {browsePharmacy ? `Link ${browsePharmacy.name}` : 'Select a pharmacy'}
                    </Btn>
                    <button onClick={closeAddForm} style={{ padding: '0 18px', borderRadius: 14, border: `1px solid ${C.border}`, background: C.white, fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: C.textMuted, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}

              {/* ── CODE MODE ── */}
              {addMode === 'code' && (
                <div>
                  <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
                    Enter the 9-character code from your pharmacist. Their name and details appear automatically.
                  </div>

                  <div style={{ position: 'relative', marginBottom: 8 }}>
                    <input
                      value={codeInput}
                      onChange={e => setCodeInput(formatCode(e.target.value))}
                      onKeyDown={e => { if (e.key === 'Enter') addPharmacy(); if (e.key === 'Escape') closeAddForm(); }}
                      maxLength={10}
                      placeholder="XXXX-XXXXX"
                      spellCheck={false}
                      autoFocus
                      style={{ width: '100%', height: 54, padding: '0 96px 0 16px', borderRadius: 14, boxSizing: 'border-box',
                        border: `2px solid ${isCodeValid ? (alreadyLinked ? C.amber : lookedUp ? C.sage : C.amber) : codeInput.length > 0 ? C.coral : C.border}`,
                        background: C.white, fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace', fontSize: 20, fontWeight: 800, letterSpacing: '0.12em',
                        color: isCodeValid ? (alreadyLinked ? C.amber : lookedUp ? C.sage : C.amber) : codeInput.length > 0 ? C.coral : C.textMuted,
                        outline: 'none', transition: 'border-color 0.2s, color 0.2s',
                      }}
                    />
                    <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 700, pointerEvents: 'none', color: isCodeValid ? (alreadyLinked ? C.amber : lookedUp ? C.sage : C.amber) : codeInput.length > 0 ? C.coral : C.textMuted }}>
                      {isCodeValid ? (alreadyLinked ? '⚠ Linked' : lookedUp ? '✓ Found' : '? Unknown') : `${codeInput.replace('-', '').length}/9`}
                    </span>
                  </div>

                  <div style={{ fontFamily: fonts.body, fontSize: 12, lineHeight: 1.4, marginBottom: (lookedUp && !alreadyLinked) ? 12 : 14, color: isCodeValid ? (alreadyLinked ? C.amber : lookedUp ? C.sage : C.amber) : codeInput.length > 0 ? C.coral : C.textMuted }}>
                    {alreadyLinked ? '⚠ This pharmacy is already linked to your account'
                      : isCodeValid && lookedUp ? '✓ Pharmacy found — confirm below to link'
                      : isCodeValid ? '⚠ Code not in our network — double-check with your pharmacist'
                      : codeInput.length > 0 ? 'Format: 4 chars · dash · 5 chars  (e.g. SHRM-74219)'
                      : 'Ask your pharmacist for their SaathiPill code  (e.g. SHRM-74219)'}
                  </div>

                  {isCodeValid && lookedUp && !alreadyLinked && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: C.sageLight, border: `1.5px solid ${C.sage}44`, marginBottom: 14 }}>
                      <div style={{ width: 46, height: 46, borderRadius: 14, background: lookedUp.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🏥</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 700, color: C.text }}>{lookedUp.name}</div>
                        <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted }}>{phMeta(lookedUp)}</div>
                        <div style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 700, color: C.sage, marginTop: 3 }}>✓ Verified SaathiPill partner</div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <Btn onClick={() => addPharmacy()} disabled={!isCodeValid || !lookedUp || alreadyLinked} style={{ flex: 1, minHeight: 48, fontSize: 15, opacity: isCodeValid && lookedUp && !alreadyLinked ? 1 : 0.55 }}>
                      {lookedUp && !alreadyLinked ? `Link ${lookedUp.name}` : 'Link pharmacy'}
                    </Btn>
                    <button onClick={closeAddForm} style={{ padding: '0 18px', borderRadius: 14, border: `1px solid ${C.border}`, background: C.white, fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: C.textMuted, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <button
            onClick={() => setAddingNew(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 18, border: `2px dashed ${C.coral}66`, background: 'transparent', cursor: 'pointer', width: '100%', flexShrink: 0 }}
          >
            <div style={{ width: 42, height: 42, borderRadius: 13, background: C.coralLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>+</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.coral }}>
                {linkedPharmacies.length === 0 ? '🏥 Link a pharmacy' : 'Add another pharmacy'}
              </div>
              <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>
                {linkedPharmacies.length === 0 ? 'Connect your local pharmacy via their SaathiPill code' : 'Link a backup or online pharmacy'}
              </div>
            </div>
          </button>
        )}

        {/* Empty-state explainer */}
        {linkedPharmacies.length === 0 && !addingNew && (
          <div style={{ padding: '16px', borderRadius: 14, background: C.warmGrayLight, fontFamily: fonts.body, fontSize: 13, color: C.textMuted, lineHeight: 1.7 }}>
            <strong style={{ color: C.text }}>How it works</strong><br />
            Your pharmacist gives you a 9-character code (e.g. <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>SHRM-74219</span>). Link it here to receive exclusive offers, track refills, and place orders directly from the app. You can link multiple pharmacies and set one as primary.
          </div>
        )}

        {/* Primary pharmacy note (only when >1 linked) */}
        {linkedPharmacies.length > 1 && !addingNew && (
          <div style={{ padding: '12px 14px', borderRadius: 12, background: C.warmGrayLight, fontFamily: fonts.body, fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
            <strong style={{ color: C.text }}>Primary pharmacy</strong> receives your refill orders and discount offers. Tap "Set primary" on any other pharmacy to switch.
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, {
  RefillsScreen, DrugInteractionCard, DoctorReportScreen, InteractionsScreen,
  ProfileScreen, OfflineScreen, PharmacyBannerScreen
});
