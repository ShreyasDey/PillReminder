
// Screens 13-18: Refills, Drug Interaction, Doctor Report, Profile, Offline, Pharmacy Banner

// ── SCREEN 13: REFILLS TAB ──
function RefillsScreen({ onNavigate }) {
  const lowMeds = [
    { name: 'Metformin 500mg', daysLeft: 4, total: 30, pharmacy: '1mg', price: '₹48', icon: '💊', color: C.red },
    { name: 'Vitamin D3 60K IU', daysLeft: 6, total: 30, pharmacy: 'PharmEasy', price: '₹120', icon: '🌟', color: C.amber },
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

        {/* Pharmacy partner banner */}
        <div onClick={() => onNavigate && onNavigate('pharmacy')} style={{
          borderRadius: 18, padding: '14px 18px', marginBottom: 4,
          background: 'linear-gradient(135deg, #1A4B8C, #2563EB)',
          display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
        }}>
          <span style={{ fontSize: 28 }}>🏥</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: '#fff' }}>Sharma Medical Store</div>
            <div style={{ fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Your local pharmacy partner · Tap to order</div>
          </div>
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
                    <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.sage }}>{med.price}</div>
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

// ── SCREEN 15: DOCTOR REPORT ──
function DoctorReportScreen({ onClose, userName }) {
  const [sharing, setSharing] = React.useState(false);

  return (
    <div style={{ flex: 1, background: C.cream, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: 12, background: C.warmGrayLight, border: 'none', fontSize: 18, cursor: 'pointer' }}>←</button>
        <div>
          <div style={{ fontFamily: fonts.heading, fontSize: 20, fontWeight: 700, color: C.text }}>Doctor Report</div>
          <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>Ready to share at your appointment</div>
        </div>
      </div>

      {/* PDF Preview */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 24px' }}>
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {Array(30).fill(null).map((_, i) => {
                const dayNum = i + 1;
                // Only color past days of April (month before current May)
                const isFuture = false; // April is fully past
                const status = dayNum % 11 === 0 ? 'red' : dayNum % 7 === 5 ? 'amber' : 'sage';
                return (
                  <div key={i} style={{
                    width: 18, height: 18, borderRadius: 4,
                    background: C[status],
                    opacity: 0.8,
                  }} />
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
        </div>
      </div>
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
      title: 'Family & Doctors',
      items: [
        { icon: '👨‍👩‍👧', label: 'Caregiver contacts', desc: '3 family members', arrow: true },
        { icon: '📋', label: 'Doctor report', desc: 'Share PDF at appointment', arrow: true, action: () => onNavigate('report') },
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
  const [ordered, setOrdered] = React.useState(false);

  return (
    <div style={{ flex: 1, background: C.cream, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: 12, background: C.warmGrayLight, border: 'none', fontSize: 18, cursor: 'pointer' }}>←</button>
        <div style={{ fontFamily: fonts.heading, fontSize: 18, fontWeight: 700, color: C.text }}>Pharmacy Partner</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Co-brand header */}
        <div style={{
          borderRadius: 24, overflow: 'hidden',
          background: `linear-gradient(135deg, #1A4B8C 0%, #2563EB 100%)`,
          padding: '28px 24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: fonts.body, fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4, fontWeight: 600, letterSpacing: '0.06em' }}>POWERED BY</div>
              <div style={{ fontFamily: fonts.heading, fontSize: 22, fontWeight: 800, color: C.white }}>Sharma Medical<br />Store</div>
              <div style={{ fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Koramangala, Bengaluru</div>
            </div>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🏥</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {['Home delivery', 'Open 8AM–10PM', '5★ rated'].map(tag => (
              <div key={tag} style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.15)', fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>{tag}</div>
            ))}
          </div>
        </div>

        {/* Your medicines available */}
        <Card>
          <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>Your medicines available here</div>
          {medicines.slice(0, 3).map((med, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 2 ? `1px solid ${C.border}` : 'none' }}>
              <span style={{ fontSize: 20 }}>{med.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: C.text }}>{med.name} {med.dose}</div>
              </div>
              <Pill color={C.sage}>In stock</Pill>
            </div>
          ))}
        </Card>

        {/* Order card */}
        <Card style={{ background: C.coralLight, border: `2px solid ${C.coral}33` }}>
          <div style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>Your monthly refill</div>
          <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted, marginBottom: 16 }}>
            All 5 medicines · Est. delivery 2 hrs<br />Based on your current stock levels
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>Estimated total</div>
              <div style={{ fontFamily: fonts.heading, fontSize: 26, fontWeight: 800, color: C.coral }}>₹348</div>
            </div>
            <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.sage }}>Free delivery above ₹299 ✓</div>
          </div>
          {!ordered ? (
            <Btn onClick={() => setOrdered(true)} icon="🛒">Order from Sharma Medical</Btn>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
              <div style={{ fontFamily: fonts.body, fontSize: 16, fontWeight: 700, color: C.sage }}>Order placed!</div>
              <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted, marginTop: 4 }}>Delivery by 4:30 PM today</div>
            </div>
          )}
        </Card>

        {/* Other pharmacy options */}
        <Card>
          <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>Or order from national pharmacies</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { name: '1mg', desc: 'Delivery in 2-4 hours', price: '₹312', icon: '1️⃣', color: C.coral },
              { name: 'PharmEasy', desc: 'Same day delivery', price: '₹328', icon: '🟢', color: C.sage },
              { name: 'Apollo Pharmacy', desc: 'Nearest store 0.8 km', price: '₹356', icon: '🔵', color: '#3498db' },
            ].map((ph, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: C.warmGrayLight, cursor: 'pointer' }}>
                <span style={{ fontSize: 24 }}>{ph.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.text }}>{ph.name}</div>
                  <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>{ph.desc}</div>
                </div>
                <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: ph.color }}>{ph.price}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, {
  RefillsScreen, DrugInteractionCard, DoctorReportScreen,
  ProfileScreen, OfflineScreen, PharmacyBannerScreen
});
