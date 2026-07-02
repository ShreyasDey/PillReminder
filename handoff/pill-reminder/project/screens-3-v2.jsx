
// Screens 13-18: Refills, Drug Interaction, Doctor Report, Profile, Offline, Pharmacy Banner

// ── REFILL ORDER BUILDER ──
function RefillOrderBuilder({ activeOffer }) {
  const [ob, setOb] = React.useState({
    items: [
      { id:1, name:'Metformin 500mg',   dose:'500mg',  qty:1, days:30, basePrice:48,  icon:'💊', urgent:true  },
      { id:2, name:'Vitamin D3 60K IU', dose:'60K IU', qty:1, days:30, basePrice:120, icon:'🌟', urgent:true  },
      { id:3, name:'Amlodipine 5mg',    dose:'5mg',    qty:1, days:30, basePrice:65,  icon:'💊', urgent:false },
      { id:4, name:'Telmisartan 40mg',  dose:'40mg',   qty:1, days:30, basePrice:72,  icon:'💊', urgent:false },
      { id:5, name:'Atorvastatin 10mg', dose:'10mg',   qty:1, days:30, basePrice:43,  icon:'💊', urgent:false },
    ],
    customItems: [], addingCustom: false,
    newName:'', newQty:1, newPrice:'',
    pharmacy: 'local', slot:'afternoon', payment:'cod', notes:'',
    placed: false, expanded: false,
    inputMode: 'days', // 'days' or 'qty'
  });
  const set = (patch) => setOb(prev => ({ ...prev, ...patch }));
  const updateItem = (id, patch) => set({ items: ob.items.map(it => it.id===id ? {...it,...patch} : it) });
  const updateCustom = (id, patch) => set({ customItems: ob.customItems.map(it => it.id===id ? {...it,...patch} : it) });
  const itemPrice = (it) => Math.round(it.basePrice * (it.days/30) * it.qty);
  const custPrice = (it) => Math.round((parseFloat(it.price)||0)*it.qty);
  const subtotal = ob.items.reduce((s,it)=>s+itemPrice(it),0) + ob.customItems.reduce((s,it)=>s+custPrice(it),0);
  const discount = activeOffer ? Math.round(subtotal*activeOffer.discount/100) : 0;
  const total = subtotal - discount;
  const pharmacyName = ob.pharmacy==='local' ? 'Local pharmacy' : ob.pharmacy==='pharmeasy' ? 'PharmEasy' : '1mg';
  const slotLabel = {morning:'9AM–12PM',afternoon:'12–5PM',evening:'5–9PM'}[ob.slot];
  const qb = { border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 };
  const formatCode=(raw)=>{ let c=raw.toUpperCase().replace(/[^A-Z0-9]/g,''); if(c.length>9)c=c.slice(0,9); return c.length>4?c.slice(0,4)+'-'+c.slice(4):c; };

  // Custom days edit state: { [itemId]: currentInputString | undefined }
  const [customDaysEdit, setCustomDaysEdit] = React.useState({});
  const PRESET_DAYS = [15, 30, 45, 60];

  const startCustomDays = (id, currentDays) => {
    setCustomDaysEdit(prev => ({ ...prev, [id]: String(currentDays) }));
  };
  const commitCustomDays = (id) => {
    const val = parseInt(customDaysEdit[id], 10);
    if (!isNaN(val) && val >= 1 && val <= 365) updateItem(id, { days: val });
    setCustomDaysEdit(prev => { const n = { ...prev }; delete n[id]; return n; });
  };
  const cancelCustomDays = (id) => {
    setCustomDaysEdit(prev => { const n = { ...prev }; delete n[id]; return n; });
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
              {ob.placed ? `${pharmacyName} · ${slotLabel} delivery` : `${ob.items.length} medicines · ₹${total}${activeOffer ? ` (–${activeOffer.discount}% offer)` : ''}`}
            </div>
          </div>
        </div>
        <span style={{ color:C.textMuted, fontSize:18, transform: ob.expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition:'transform 0.2s' }}>›</span>
      </button>
  
      {ob.expanded && !ob.placed && (
        <div>
          {/* Pharmacy selector */}
          <div style={{ padding:'12px 18px', borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontFamily:fonts.body, fontSize:10, fontWeight:700, color:C.textMuted, letterSpacing:'0.07em', marginBottom:8 }}>ORDER FROM</div>
            <div style={{ display:'flex', gap:8 }}>
              {[
                { id:'local',     label:'Local pharmacy', icon:'🏥', color:'#1A4B8C' },
                { id:'pharmeasy', label:'PharmEasy',       icon:'💚', color:'#5BA85A' },
                { id:'onemg',     label:'1mg',             icon:'🔴', color:'#E8705A' },
              ].map(ph=>(
                <button key={ph.id} onClick={()=>set({pharmacy:ph.id})} style={{ flex:1, padding:'10px 6px', borderRadius:12, border:`1.5px solid ${ob.pharmacy===ph.id ? ph.color : C.border}`, background: ob.pharmacy===ph.id ? ph.color+'15' : C.cream, cursor:'pointer', textAlign:'center', transition:'all 0.12s' }}>
                  <div style={{ fontSize:16, marginBottom:2 }}>{ph.icon}</div>
                  <div style={{ fontFamily:fonts.body, fontSize:11, fontWeight:700, color: ob.pharmacy===ph.id ? ph.color : C.text, lineHeight:1.2 }}>{ph.label}</div>
                </button>
              ))}
            </div>
          </div>
  
          {/* Input mode toggle */}
          <div style={{ padding:'10px 18px 4px', display:'flex', alignItems:'center', gap:8, borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontFamily:fonts.body, fontSize:10, fontWeight:700, color:C.textMuted, letterSpacing:'0.07em', flex:1 }}>ORDER BY</div>
            <div style={{ display:'flex', gap:4, background:C.warmGrayLight, padding:'3px', borderRadius:10 }}>
              {[['days','Days supply'],['qty','Quantity']].map(([mode,label])=>(
                <button key={mode} onClick={()=>set({inputMode:mode})} style={{ padding:'5px 12px', borderRadius:8, border:'none', background: ob.inputMode===mode ? C.coral : 'transparent', fontFamily:fonts.body, fontSize:12, fontWeight:700, color: ob.inputMode===mode ? C.white : C.textMuted, cursor:'pointer', transition:'all 0.15s' }}>{label}</button>
              ))}
            </div>
          </div>
  
          {/* Medicine rows */}
          {ob.items.map((item,i)=>(
            <div key={item.id} style={{ display:'flex', gap:10, alignItems:'center', padding:'12px 18px', borderBottom: i<ob.items.length-1 || ob.customItems.length>0 ? `1px solid ${C.border}` : 'none', background: item.urgent ? '#FFF8F6' : C.white }}>
              <div style={{ width:36, height:36, borderRadius:10, background: item.urgent ? C.coralLight : C.warmGrayLight, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0 }}>{item.icon}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4, flexWrap:'wrap' }}>
                  <span style={{ fontFamily:fonts.body, fontSize:13, fontWeight:700, color:C.text }}>{item.name}</span>
                  {item.urgent && <span style={{ fontSize:9, padding:'1px 5px', borderRadius:4, background:C.coralLight, color:C.coral, fontWeight:700 }}>LOW</span>}
                </div>
                {ob.inputMode==='days' ? (
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap', alignItems:'center' }}>
                    {PRESET_DAYS.map(d=>(
                      <button key={d} onClick={()=>{ updateItem(item.id,{days:d}); cancelCustomDays(item.id); }} style={{ padding:'3px 9px', borderRadius:7, border:`1.5px solid ${item.days===d && !customDaysEdit[item.id] ? C.coral : C.border}`, background: item.days===d && !customDaysEdit[item.id] ? C.coralLight : 'transparent', fontFamily:fonts.body, fontSize:11, fontWeight:700, color: item.days===d && !customDaysEdit[item.id] ? C.coral : C.textMuted, cursor:'pointer', transition:'all 0.12s' }}>{d}d</button>
                    ))}

                    {/* Custom days chip / input */}
                    {customDaysEdit[item.id] !== undefined ? (
                      <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                        <input
                          autoFocus
                          value={customDaysEdit[item.id]}
                          onChange={e => setCustomDaysEdit(prev => ({ ...prev, [item.id]: e.target.value.replace(/[^0-9]/g,'') }))}
                          onBlur={() => commitCustomDays(item.id)}
                          onKeyDown={e => { if (e.key==='Enter') commitCustomDays(item.id); if (e.key==='Escape') cancelCustomDays(item.id); }}
                          placeholder="—"
                          style={{ width:40, height:26, padding:'0 6px', borderRadius:7, border:`1.5px solid ${C.coral}`, background:C.coralLight, fontFamily:fonts.body, fontSize:12, fontWeight:800, color:C.coral, outline:'none', textAlign:'center' }}
                        />
                        <span style={{ fontFamily:fonts.body, fontSize:11, color:C.textMuted, fontWeight:600 }}>d</span>
                        <button onMouseDown={e=>{ e.preventDefault(); commitCustomDays(item.id); }} style={{ width:22, height:22, borderRadius:5, border:'none', background:C.coral, color:C.white, fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✓</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startCustomDays(item.id, item.days)}
                        title="Set custom days"
                        style={{ padding:'3px 9px', borderRadius:7, border:`1.5px dashed ${!PRESET_DAYS.includes(item.days) ? C.coral : C.border}`, background: !PRESET_DAYS.includes(item.days) ? C.coralLight : 'transparent', fontFamily:fonts.body, fontSize:11, fontWeight:700, color: !PRESET_DAYS.includes(item.days) ? C.coral : C.textMuted, cursor:'pointer', transition:'all 0.12s' }}>
                        {!PRESET_DAYS.includes(item.days) ? `${item.days}d ✎` : '…'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ fontFamily:fonts.body, fontSize:12, color:C.textMuted }}>{item.days}-day supply</div>
                )}
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                <div style={{ fontFamily:fonts.heading, fontSize:14, fontWeight:800, color:C.text }}>₹{itemPrice(item)}</div>
                {ob.inputMode==='qty' ? (
                  <div style={{ display:'flex', alignItems:'center', gap:3, background:C.warmGrayLight, borderRadius:9, padding:'2px 3px' }}>
                    <button onClick={()=>updateItem(item.id,{qty:Math.max(1,item.qty-1)})} style={{ ...qb, width:24, height:24, borderRadius:7, background:C.white, fontSize:14, color:C.text }}>−</button>
                    <span style={{ fontFamily:fonts.body, fontSize:13, fontWeight:700, color:C.text, minWidth:16, textAlign:'center' }}>{item.qty}</span>
                    <button onClick={()=>updateItem(item.id,{qty:item.qty+1})} style={{ ...qb, width:24, height:24, borderRadius:7, background:C.coral, fontSize:14, color:C.white }}>+</button>
                  </div>
                ) : (
                  <div style={{ fontFamily:fonts.body, fontSize:11, color:C.textMuted }}>×{item.qty} strip</div>
                )}
              </div>
            </div>
          ))}
  
          {/* Custom items */}
          {ob.customItems.map((item,i)=>(
            <div key={item.id} style={{ display:'flex', gap:10, alignItems:'center', padding:'11px 18px', borderBottom: i<ob.customItems.length-1 ? `1px solid ${C.border}` : 'none', background:'#FFFBF0' }}>
              <div style={{ width:36, height:36, borderRadius:10, background:C.amberLight, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0 }}>🛍️</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:fonts.body, fontSize:13, fontWeight:600, color:C.text, marginBottom:2 }}>{item.name}</div>
                <span style={{ fontSize:9, padding:'1px 6px', borderRadius:4, background:C.amberLight, color:C.amber, fontWeight:700 }}>CUSTOM</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                <div style={{ fontFamily:fonts.heading, fontSize:14, fontWeight:800, color:C.text }}>{parseFloat(item.price)>0 ? `₹${custPrice(item)}` : 'Ask price'}</div>
                <div style={{ display:'flex', alignItems:'center', gap:3, background:C.warmGrayLight, borderRadius:9, padding:'2px 3px' }}>
                  <button onClick={()=>updateCustom(item.id,{qty:Math.max(1,item.qty-1)})} style={{ ...qb, width:24, height:24, borderRadius:7, background:C.white, fontSize:14, color:C.text }}>−</button>
                  <span style={{ fontFamily:fonts.body, fontSize:13, fontWeight:700, color:C.text, minWidth:16, textAlign:'center' }}>{item.qty}</span>
                  <button onClick={()=>updateCustom(item.id,{qty:item.qty+1})} style={{ ...qb, width:24, height:24, borderRadius:7, background:C.amber, fontSize:14, color:C.white }}>+</button>
                </div>
                <button onClick={()=>set({customItems:ob.customItems.filter(i=>i.id!==item.id)})} style={{ fontFamily:fonts.body, fontSize:11, color:C.red, background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Remove</button>
              </div>
            </div>
          ))}
  
          {/* Add custom item */}
          <div style={{ padding:'10px 18px', borderTop:`1px solid ${C.border}` }}>
            {!ob.addingCustom ? (
              <button onClick={()=>set({addingCustom:true})} style={{ width:'100%', padding:'10px 0', borderRadius:12, border:`2px dashed ${C.amber}66`, background:'#FFFBF0', fontFamily:fonts.body, fontSize:13, fontWeight:700, color:C.amber, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                + Add custom item <span style={{ fontFamily:fonts.body, fontSize:11, fontWeight:400, color:C.textMuted }}>(OTC, specific brand)</span>
              </button>
            ) : (
              <div style={{ padding:'12px 14px', background:'#FFFBF0', borderRadius:14, border:`1.5px solid ${C.amber}44` }}>
                <input value={ob.newName} onChange={e=>set({newName:e.target.value})} placeholder="e.g. Paracetamol 650mg, Dettol, Band-Aid" autoFocus style={{ width:'100%', height:42, padding:'0 12px', borderRadius:10, border:`1.5px solid ${C.border}`, background:C.white, fontFamily:fonts.body, fontSize:13, color:C.text, outline:'none', marginBottom:8 }} />
                <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:fonts.body, fontSize:10, color:C.textMuted, fontWeight:700, letterSpacing:'0.05em', marginBottom:4 }}>PRICE (optional)</div>
                    <div style={{ display:'flex', alignItems:'center', height:38, borderRadius:10, border:`1.5px solid ${C.border}`, background:C.white, overflow:'hidden' }}>
                      <span style={{ padding:'0 6px 0 10px', fontFamily:fonts.body, fontSize:14, fontWeight:600, color:C.textMuted }}>₹</span>
                      <input value={ob.newPrice} onChange={e=>set({newPrice:e.target.value.replace(/[^0-9.]/g,'')})} placeholder="0" type="number" style={{ flex:1, height:'100%', padding:'0 8px 0 0', border:'none', fontFamily:fonts.body, fontSize:14, color:C.text, outline:'none', background:'transparent' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily:fonts.body, fontSize:10, color:C.textMuted, fontWeight:700, letterSpacing:'0.05em', marginBottom:4 }}>QTY</div>
                    <div style={{ display:'flex', alignItems:'center', gap:5, height:38, background:C.white, borderRadius:10, border:`1.5px solid ${C.border}`, padding:'0 6px' }}>
                      <button onClick={()=>set({newQty:Math.max(1,ob.newQty-1)})} style={{ ...qb, width:24, height:24, borderRadius:7, background:C.warmGrayLight, fontSize:14, color:C.text }}>−</button>
                      <span style={{ fontFamily:fonts.body, fontSize:14, fontWeight:700, color:C.text, minWidth:18, textAlign:'center' }}>{ob.newQty}</span>
                      <button onClick={()=>set({newQty:ob.newQty+1})} style={{ ...qb, width:24, height:24, borderRadius:7, background:C.coral, fontSize:14, color:C.white }}>+</button>
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>{ if(!ob.newName.trim())return; set({customItems:[...ob.customItems,{id:Date.now(),name:ob.newName.trim(),qty:ob.newQty,price:ob.newPrice||'0'}],addingCustom:false,newName:'',newQty:1,newPrice:''}); }} disabled={!ob.newName.trim()} style={{ flex:1, height:40, borderRadius:10, border:'none', background:ob.newName.trim()?C.coral:C.border, fontFamily:fonts.body, fontSize:14, fontWeight:700, color:ob.newName.trim()?C.white:C.textMuted, cursor:ob.newName.trim()?'pointer':'default' }}>Add to order</button>
                  <button onClick={()=>set({addingCustom:false,newName:'',newPrice:'',newQty:1})} style={{ padding:'0 14px', height:40, borderRadius:10, border:`1px solid ${C.border}`, background:C.white, fontFamily:fonts.body, fontSize:13, fontWeight:600, color:C.textMuted, cursor:'pointer' }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
  
          {/* Delivery slot */}
          <div style={{ padding:'12px 18px', borderTop:`1px solid ${C.border}` }}>
            <div style={{ fontFamily:fonts.body, fontSize:10, fontWeight:700, color:C.textMuted, letterSpacing:'0.07em', marginBottom:8 }}>DELIVERY SLOT</div>
            <div style={{ display:'flex', gap:8 }}>
              {[{id:'morning',label:'Morning',time:'9AM–12PM',icon:'🌅'},{id:'afternoon',label:'Afternoon',time:'12–5PM',icon:'☀️'},{id:'evening',label:'Evening',time:'5–9PM',icon:'🌆'}].map(slot=>(
                <button key={slot.id} onClick={()=>set({slot:slot.id})} style={{ flex:1, padding:'9px 4px', borderRadius:11, border:`1.5px solid ${ob.slot===slot.id?C.coral:C.border}`, background: ob.slot===slot.id?C.coralLight:C.white, cursor:'pointer', textAlign:'center', transition:'all 0.12s' }}>
                  <div style={{ fontSize:16, marginBottom:2 }}>{slot.icon}</div>
                  <div style={{ fontFamily:fonts.body, fontSize:11, fontWeight:700, color: ob.slot===slot.id?C.coral:C.text }}>{slot.label}</div>
                  <div style={{ fontFamily:fonts.body, fontSize:10, color:C.textMuted }}>{slot.time}</div>
                </button>
              ))}
            </div>
          </div>
  
          {/* Payment */}
          <div style={{ padding:'12px 18px', borderTop:`1px solid ${C.border}` }}>
            <div style={{ fontFamily:fonts.body, fontSize:10, fontWeight:700, color:C.textMuted, letterSpacing:'0.07em', marginBottom:8 }}>PAYMENT</div>
            <div style={{ display:'flex', gap:8 }}>
              {[{id:'cod',label:'Cash on delivery',icon:'💵'},{id:'upi',label:'UPI / Online',icon:'📱'}].map(pm=>(
                <button key={pm.id} onClick={()=>set({payment:pm.id})} style={{ flex:1, padding:'10px 8px', borderRadius:11, border:`1.5px solid ${ob.payment===pm.id?C.coral:C.border}`, background: ob.payment===pm.id?C.coralLight:C.white, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.12s' }}>
                  <span style={{ fontSize:16 }}>{pm.icon}</span>
                  <span style={{ fontFamily:fonts.body, fontSize:12, fontWeight:700, color: ob.payment===pm.id?C.coral:C.text }}>{pm.label}</span>
                </button>
              ))}
            </div>
          </div>
  
          {/* Note */}
          <div style={{ padding:'12px 18px', borderTop:`1px solid ${C.border}` }}>
            <div style={{ fontFamily:fonts.body, fontSize:10, fontWeight:700, color:C.textMuted, letterSpacing:'0.07em', marginBottom:8 }}>NOTE FOR PHARMACIST</div>
            <textarea value={ob.notes} onChange={e=>set({notes:e.target.value})} placeholder="e.g. Same brand as last time. Leave at door." rows={2} style={{ width:'100%', padding:'10px 12px', borderRadius:11, border:`1.5px solid ${ob.notes?C.sage:C.border}`, background:C.white, fontFamily:fonts.body, fontSize:13, color:C.text, resize:'none', outline:'none', lineHeight:1.5, transition:'border-color 0.2s' }} />
          </div>
  
          {/* Summary + CTA */}
          <div style={{ padding:'14px 18px 18px', borderTop:`1px solid ${C.border}`, background:C.warmGrayLight }}>
            <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:12 }}>
              {ob.items.map(it=>(
                <div key={it.id} style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontFamily:fonts.body, fontSize:12, color:C.textMuted }}>{it.name} ×{it.qty} ({it.days}d)</span>
                  <span style={{ fontFamily:fonts.body, fontSize:12, fontWeight:600, color:C.text }}>₹{itemPrice(it)}</span>
                </div>
              ))}
              {ob.customItems.map(it=>(
                <div key={it.id} style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontFamily:fonts.body, fontSize:12, color:C.textMuted }}>{it.name} ×{it.qty}</span>
                  <span style={{ fontFamily:fonts.body, fontSize:12, fontWeight:600, color:C.text }}>{parseFloat(it.price)>0?'₹'+custPrice(it):'—'}</span>
                </div>
              ))}
              {discount>0 && (
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontFamily:fonts.body, fontSize:12, color:C.sage, fontWeight:600 }}>Offer (–{activeOffer.discount}%)</span>
                  <span style={{ fontFamily:fonts.body, fontSize:12, fontWeight:700, color:C.sage }}>−₹{discount}</span>
                </div>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', paddingTop:8, borderTop:`1.5px solid ${C.border}` }}>
                <span style={{ fontFamily:fonts.body, fontSize:15, fontWeight:700, color:C.text }}>Total</span>
                <span style={{ fontFamily:fonts.heading, fontSize:20, fontWeight:900, color:C.text }}>₹{total}</span>
              </div>
            </div>
            <Btn onClick={()=>set({placed:true})} icon="🛒">
              Order from {pharmacyName} · ₹{total}
            </Btn>
          </div>
        </div>
      )}
  
      {ob.expanded && ob.placed && (
        <div style={{ padding:'24px 20px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <div style={{ fontFamily:fonts.body, fontSize:14, fontWeight:600, color:C.sage }}>{pharmacyName} · {slotLabel}</div>
          {ob.notes ? <div style={{ fontFamily:fonts.body, fontSize:12, color:C.textMuted, fontStyle:'italic', lineHeight:1.4, maxWidth:240 }}>Note: "{ob.notes}"</div> : null}
          {ob.payment==='upi' ? <div style={{ marginTop:6, padding:'6px 14px', borderRadius:10, background:C.sageLight, fontFamily:fonts.body, fontSize:12, fontWeight:600, color:C.sage }}>📱 UPI link sent</div> : null}
          <button onClick={()=>set({placed:false})} style={{ marginTop:8, fontFamily:fonts.body, fontSize:12, color:C.textMuted, background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>Place another order</button>
        </div>
      )}
    </div>
  );
  
}

// ── SCREEN 13: REFILLS TAB ──
function RefillsScreen({ onNavigate }) {
  const [activeOffer, setActiveOffer] = React.useState(null);
  const [offerDismissed, setOfferDismissed] = React.useState(false);

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

  const lowMeds = [
    { name: 'Metformin 500mg', daysLeft: 4, total: 30, pharmacy: '1mg', price: '₹48', discountedPrice: activeOffer ? '₹' + (48 * (1 - activeOffer.discount / 100)).toFixed(0) : null, icon: '💊', color: C.red },
    { name: 'Vitamin D3 60K IU', daysLeft: 6, total: 30, pharmacy: 'PharmEasy', price: '₹120', discountedPrice: activeOffer ? '₹' + (120 * (1 - activeOffer.discount / 100)).toFixed(0) : null, icon: '🌟', color: C.amber },
  ];
  const stockedMeds = [
    { name: 'Amlodipine 5mg', daysLeft: 22, icon: '💊' },
    { name: 'Telmisartan 40mg', daysLeft: 18, icon: '💊' },
    { name: 'Atorvastatin 10mg', daysLeft: 15, icon: '💊' },
  ];

  const pharmacies = [
    { name: '1mg', logo: '1️⃣', color: '#E8705A' },
    { name: 'PharmEasy', logo: '🟢', color: '#2ecc71' },
    { name: 'Apollo', logo: '🔵', color: '#3498db' },
    { name: 'Tata 1mg', logo: '🔴', color: '#e74c3c' },
  ];

  return (
    <div style={{ flex: 1, background: C.cream, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontFamily: fonts.heading, fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 4 }}>Refills</div>
        <div style={{ fontFamily: fonts.body, fontSize: 14, color: C.textMuted }}>Never run out of your medicines</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px 20px 100px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Active pharmacy offer banner */}
        {activeOffer && !offerDismissed && (
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
                    <div style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Limited offer · Sharma Medical Store</div>
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

        {/* Pharmacy partner banner */}
        <div onClick={() => onNavigate && onNavigate('pharmacy')} style={{
          borderRadius: 18, padding: '14px 18px', marginBottom: 4,
          background: activeOffer
            ? 'linear-gradient(135deg, #1A4B8C, #2563EB)'
            : 'linear-gradient(135deg, #1A4B8C, #2563EB)',
          display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
        }}>
          <span style={{ fontSize: 28 }}>🏥</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: '#fff' }}>Sharma Medical Store</div>
            <div style={{ fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
              {activeOffer ? `${activeOffer.discount}% OFF active — tap to order` : 'Your local pharmacy partner · Tap to order'}
            </div>
          </div>
          {activeOffer && (
            <div style={{
              padding: '4px 10px', borderRadius: 8,
              background: 'rgba(255,255,255,0.15)',
              fontFamily: fonts.body, fontSize: 14, fontWeight: 900, color: '#fff',
            }}>{activeOffer.discount}% OFF</div>
          )}
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18 }}>›</span>
        </div>

        {/* Pharmacy partners row */}
        <div>
          <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: C.textMuted, marginBottom: 10 }}>ORDER FROM</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {pharmacies.map((ph, i) => (
              <div key={i} style={{
                flex: 1, padding: '10px 6px', borderRadius: 12, background: C.white,
                border: `1px solid ${C.border}`, textAlign: 'center', cursor: 'pointer',
              }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{ph.logo}</div>
                <div style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 700, color: C.text }}>{ph.name}</div>
              </div>
            ))}
          </div>
        </div>


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

        <RefillOrderBuilder activeOffer={activeOffer} />

        {/* Running low */}
        <div>
          <SectionHeader title="⚠️ Running low" />
          {lowMeds.map((med, i) => (
            <Card key={i} style={{ marginBottom: 12, border: `2px solid ${med.color}44` }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16, background: med.color + '22',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0,
                }}>{med.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: fonts.body, fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>{med.name}</div>
                  {/* Days remaining bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: C.border }}>
                      <div style={{ height: '100%', borderRadius: 3, background: med.color, width: `${(med.daysLeft / med.total) * 100}%` }} />
                    </div>
                    <span style={{ fontFamily: fonts.body, fontSize: 12, color: med.color, fontWeight: 700 }}>{med.daysLeft} days left</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button style={{
                      flex: 1, padding: '10px 12px', borderRadius: 12, border: 'none',
                      background: C.coral, color: C.white,
                      fontFamily: fonts.body, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                      <span>🛒</span>Order from {med.pharmacy}
                    </button>
                    <div style={{ textAlign: 'right' }}>
                      {med.discountedPrice ? (
                        <>
                          <div style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 600, color: C.textMuted, textDecoration: 'line-through' }}>{med.price}</div>
                          <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 800, color: C.sage }}>{med.discountedPrice}</div>
                        </>
                      ) : (
                        <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.sage }}>{med.price}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* All good */}
        <div>
          <SectionHeader title="✓ All stocked" />
          {stockedMeds.map((med, i) => (
            <Card key={i} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14, background: C.sageLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>{med.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 600, color: C.text }}>{med.name}</div>
                <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted }}>{med.daysLeft} days remaining</div>
              </div>
              <Pill color={C.sage}>Stocked</Pill>
            </Card>
          ))}
        </div>

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
function DoctorReportScreen({ onClose, userName, userSymptoms, onLogSymptoms }) {
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
              <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.text, fontWeight: 600 }}>{userName || 'Rajesh Kumar'}, 62</div>
              <div style={{ fontFamily: fonts.body, fontSize: 11, color: C.textMuted }}>Generated: 3 May 2026</div>
            </div>
          </div>

          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Monthly\nadherence', value: '87%', color: C.sage },
              { label: 'Current\nstreak', value: '12 days', color: C.coral },
              { label: 'Medicines\ntracked', value: '5', color: '#5B8EE0' },
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
            {medicines.map((med, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < medicines.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <div>
                  <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: C.text }}>{med.name}</div>
                  <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>{med.dose} · {med.meal}</div>
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

          {/* Vitals snapshot */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>VITALS LOGGED (HOME READINGS)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'BP (avg)', value: '128/82', trend: '↓ 10 from March', color: C.sage },
                { label: 'Fasting glucose', value: '118 mg/dL', trend: '↓ 6 from March', color: C.sage },
                { label: 'Weight', value: '68.2 kg', trend: '−1.4 kg', color: C.sage },
                { label: 'Resting HR', value: '76 bpm', trend: 'stable', color: C.warmGray },
              ].map((v, i) => (
                <div key={i} style={{ padding: '10px 12px', background: C.warmGrayLight, borderRadius: 10 }}>
                  <div style={{ fontFamily: fonts.body, fontSize: 10, color: C.textMuted, fontWeight: 600, letterSpacing: '0.04em', marginBottom: 2 }}>{v.label.toUpperCase()}</div>
                  <div style={{ fontFamily: fonts.heading, fontSize: 16, fontWeight: 800, color: C.text }}>{v.value}</div>
                  <div style={{ fontFamily: fonts.body, fontSize: 10, color: v.color, fontWeight: 600 }}>{v.trend}</div>
                </div>
              ))}
            </div>
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
function ProfileScreen({ onNavigate, userName }) {
  const [notifications, setNotifications] = React.useState(true);
  const [smsAlerts, setSmsAlerts] = React.useState(true);
  const [voice, setVoice] = React.useState(true);
  const [offline, setOffline] = React.useState(true);

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
        { icon: '🏪', label: 'Pharmacy partner', desc: '1mg + PharmEasy', arrow: true, action: () => onNavigate('pharmacy') },
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
            <div style={{ fontFamily: fonts.heading, fontSize: 24, fontWeight: 800, color: C.white }}>{userName || 'Rajesh Kumar'}</div>
            <div style={{ fontFamily: fonts.body, fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>Age 62 · Diabetes, Hypertension</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ padding: '4px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.2)' }}>
                <span style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 700, color: C.white }}>🔥 12-day streak</span>
              </div>
              <div style={{ padding: '4px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.2)' }}>
                <span style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 700, color: C.white }}>87% adherence</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 20px 100px', display: 'flex', flexDirection: 'column', gap: 20 }}>
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
  const PHARMACY_DB = {
    'PHME-10001': { name: 'PharmEasy',           area: 'Online delivery', hours: '24/7',     rating: '4.7★', color: '#5BA85A' },
    'ONEM-10001': { name: '1mg',                 area: 'Online delivery', hours: '24/7',     rating: '4.8★', color: '#E8705A' },
    'SHRM-74219': { name: 'Sharma Medical Store', area: 'Koramangala',   hours: '8AM–10PM', rating: '5★',   color: '#1A4B8C' },
    'APLY-38291': { name: 'Apollo Pharmacy',      area: 'Indiranagar',   hours: '24/7',     rating: '4.8★', color: '#2563EB' },
    'MDPL-52847': { name: 'MedPlus',              area: 'HSR Layout',    hours: '9AM–9PM',  rating: '4.5★', color: '#16a34a' },
    'WLNS-93042': { name: 'Wellness Forever',     area: 'Bellandur',     hours: '8AM–11PM', rating: '4.7★', color: '#ea580c' },
    'JNPH-61038': { name: 'Jan Aushadhi Kendra',  area: 'Whitefield',    hours: '9AM–8PM',  rating: '4.3★', color: '#7c3aed' },
    'NTMD-24891': { name: 'NetMeds Point',         area: 'Jayanagar',     hours: '10AM–9PM', rating: '4.6★', color: '#0891b2' },
  };

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

  // Pharmacies available in dropdown (not yet linked), filtered by search
  const availableForBrowse = Object.entries(PHARMACY_DB)
    .filter(([code]) => !linkedPharmacies.includes(code))
    .filter(([, ph]) =>
      ph.name.toLowerCase().includes(browseSearch.toLowerCase()) ||
      ph.area.toLowerCase().includes(browseSearch.toLowerCase())
    );

  const persistList = (list) => {
    localStorage.setItem('sp_linked_pharmacies', JSON.stringify(list));
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
                        {ph && <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted, marginBottom: 2 }}>{ph.area} · {ph.hours} · {ph.rating}</div>}
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
                            <div style={{ padding: '20px 16px', textAlign: 'center', fontFamily: fonts.body, fontSize: 13, color: C.textMuted }}>
                              {Object.keys(PHARMACY_DB).filter(c => !linkedPharmacies.includes(c)).length === 0
                                ? 'All pharmacies are already linked'
                                : 'No results — try a different search'}
                            </div>
                          ) : availableForBrowse.map(([code, ph]) => (
                            <button key={code}
                              onClick={() => { setBrowseSelected(code); setDropdownOpen(false); setBrowseSearch(''); }}
                              style={{ width: '100%', padding: '12px 14px', border: 'none', background: browseSelected === code ? C.coralLight : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${C.border}`, transition: 'background 0.12s' }}
                            >
                              <div style={{ width: 36, height: 36, borderRadius: 10, background: ph.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>🏥</div>
                              <div style={{ flex: 1, textAlign: 'left' }}>
                                <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.text }}>{ph.name}</div>
                                <div style={{ fontFamily: fonts.body, fontSize: 11, color: C.textMuted }}>{ph.area} · {ph.hours} · {ph.rating}</div>
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
                        <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>{browsePharmacy.area} · {browsePharmacy.hours} · {browsePharmacy.rating}</div>
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
                        <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted }}>{lookedUp.area} · {lookedUp.hours} · {lookedUp.rating}</div>
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
