// ── SaathiPill Pharmacy Portal — Patients, Refills, Inventory, Analytics ──

// ── Mini sparkline ──
function Sparkline({ points, color = C.navy, width = 100, height = 28 }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const pts = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── PATIENTS LIST ──
function PatientsScreen({ onNavigate }) {
  const [search, setSearch] = useState('');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [adherenceFilter, setAdherenceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [pharmacyCode] = useState(() => localStorage.getItem('sp_pharmacy_code') || 'SHRM-74219');
  const [codeCopied, setCodeCopied] = useState(false);

  const conditions = ['all', 'Diabetes', 'Hypertension', 'Cardiac', 'Thyroid', 'COPD', 'Cholesterol'];

  const filtered = useMemo(() => {
    let list = [...PATIENTS];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.conditions.some(c => c.toLowerCase().includes(q)) || p.meds.some(m => m.toLowerCase().includes(q)));
    }
    if (conditionFilter !== 'all') {
      list = list.filter(p => p.conditions.some(c => c.includes(conditionFilter)));
    }
    if (adherenceFilter === 'high') list = list.filter(p => p.adherence != null && p.adherence >= 85);
    if (adherenceFilter === 'mid') list = list.filter(p => p.adherence != null && p.adherence >= 60 && p.adherence < 85);
    if (adherenceFilter === 'low') list = list.filter(p => p.adherence != null && p.adherence < 60);
    if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'adherence') list.sort((a, b) => (b.adherence || 0) - (a.adherence || 0));
    if (sortBy === 'adherence-low') list.sort((a, b) => (a.adherence || 999) - (b.adherence || 999));
    if (sortBy === 'spent') list.sort((a, b) => b.spent - a.spent);
    if (sortBy === 'recent') list.sort((a, b) => (b.lastRefill || '').localeCompare(a.lastRefill || ''));
    return list;
  }, [search, conditionFilter, adherenceFilter, sortBy]);

  return (
    <div>
      <PageHeader
        title="Patients"
        subtitle={`${PATIENTS.length} active · ${PATIENTS.filter(p => p.adherence != null && p.adherence < 60).length} at risk · ${PATIENTS.filter(p => p.isNew).length} new this week`}
        right={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button variant="ghost" size="md" icon={<span>⇩</span>}>Export CSV</Button>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '6px 14px', height: 36,
              border: `1px solid ${C.coral}`, borderRadius: 6,
              background: C.coralSoft,
            }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#9B4D34', letterSpacing: '0.08em' }}>YOUR PHARMACY CODE</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.coral, fontFamily: fonts.mono, letterSpacing: '0.08em', lineHeight: 1 }}>{pharmacyCode}</div>
              </div>
              <button onClick={() => { navigator.clipboard?.writeText(pharmacyCode); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 1800); }} title="Copy code" style={{
                padding: '4px 8px', border: `1px solid ${C.coral}`, borderRadius: 4,
                background: codeCopied ? C.sage : C.white,
                color: codeCopied ? '#fff' : C.coral,
                cursor: 'pointer',
                fontFamily: fonts.body, fontSize: 11, fontWeight: 700,
                transition: 'all 0.15s',
              }}>{codeCopied ? '✓' : 'Copy'}</button>
            </div>
          </div>
        }
      />

      <div style={{ padding: '0 24px 24px' }}>
        <Card>
          {/* Filter bar */}
          <div style={{
            display: 'flex', gap: 12, padding: '14px 18px',
            borderBottom: `1px solid ${C.borderSoft}`, alignItems: 'center', flexWrap: 'wrap',
          }}>
            <div style={{
              flex: '1 1 280px', display: 'flex', alignItems: 'center', gap: 8,
              padding: '0 12px', border: `1px solid ${C.border}`, borderRadius: 6,
              background: C.cream, height: 36,
            }}>
              <span style={{ color: C.textMuted, fontSize: 14 }}>⌕</span>
              <input
                placeholder="Search by name, condition, medicine…"
                value={search} onChange={e => setSearch(e.target.value)}
                style={{
                  flex: 1, border: 'none', background: 'transparent', outline: 'none',
                  fontFamily: fonts.body, fontSize: 13, color: C.text,
                }}
              />
              {search && <button onClick={() => setSearch('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.textMuted, fontSize: 14 }}>✕</button>}
            </div>

            <FilterDropdown
              label="Condition" value={conditionFilter} onChange={setConditionFilter}
              options={conditions.map(c => ({ value: c, label: c === 'all' ? 'All conditions' : c }))}
            />
            <FilterDropdown
              label="Adherence" value={adherenceFilter} onChange={setAdherenceFilter}
              options={[
                { value: 'all', label: 'All adherence' },
                { value: 'high', label: 'High (≥85%)' },
                { value: 'mid', label: 'Mid (60-85%)' },
                { value: 'low', label: 'Low (<60%)' },
              ]}
            />
            <FilterDropdown
              label="Sort" value={sortBy} onChange={setSortBy}
              options={[
                { value: 'name', label: 'Name A-Z' },
                { value: 'adherence-low', label: 'Lowest adherence first' },
                { value: 'adherence', label: 'Highest adherence first' },
                { value: 'spent', label: 'Highest spend' },
                { value: 'recent', label: 'Most recent refill' },
              ]}
            />
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: fonts.body, minWidth: 980 }}>
              <thead>
                <tr style={{ background: C.cream }}>
                  <Th style={{ width: '24%' }}>Patient</Th>
                  <Th style={{ width: '20%' }}>Conditions</Th>
                  <Th align="center" style={{ width: '8%' }}>Meds</Th>
                  <Th align="center" style={{ width: '12%' }}>Adherence</Th>
                  <Th align="center" style={{ width: '12%' }}>Last refill</Th>
                  <Th align="right" style={{ width: '12%' }}>Lifetime spend</Th>
                  <Th align="right" style={{ width: '12%' }}></Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <PatientRow key={p.id} patient={p} onView={() => onNavigate('patient-detail', p.id)} />
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: '48px 18px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
                    No patients match. Try clearing filters.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 18px', borderTop: `1px solid ${C.borderSoft}`,
            fontSize: 12, color: C.textMid, fontWeight: 500,
          }}>
            <span>Showing {filtered.length} of {PATIENTS.length}</span>
            <span>Page 1 of 1</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Th({ children, align = 'left', style }) {
  return (
    <th style={{
      padding: '10px 14px',
      textAlign: align,
      fontFamily: fonts.body, fontSize: 11, fontWeight: 700, color: C.textMid,
      letterSpacing: '0.05em', textTransform: 'uppercase',
      borderBottom: `1px solid ${C.border}`,
      ...style,
    }}>{children}</th>
  );
}

function Td({ children, align = 'left', style }) {
  return (
    <td style={{
      padding: '12px 14px',
      textAlign: align,
      fontFamily: fonts.body, fontSize: 13, color: C.text,
      borderBottom: `1px solid ${C.divider}`,
      verticalAlign: 'middle',
      ...style,
    }}>{children}</td>
  );
}

function PatientRow({ patient, onView }) {
  const adh = adherenceColor(patient.adherence);
  const [hover, setHover] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: hover ? C.cream : C.white, transition: 'background 0.1s', cursor: 'pointer' }}
      onClick={onView}
    >
      <Td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar patient={patient} size={36} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>
              {patient.name}{patient.isNew && <Chip bg={C.navySoft} color={C.navy} size={9} style={{ marginLeft: 6, letterSpacing: '0.06em' }}>NEW</Chip>}
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1, fontWeight: 500 }}>
              {patient.gender} · {patient.age} yrs · since {patient.since}
            </div>
          </div>
        </div>
      </Td>
      <Td><ConditionChips conditions={patient.conditions} /></Td>
      <Td align="center"><span style={{ fontWeight: 700, fontSize: 14, color: C.navy }}>{patient.medCount}</span></Td>
      <Td align="center">
        {patient.adherence == null ? (
          <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>
        ) : (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 50, height: 6, background: C.creamWarm, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: patient.adherence + '%', height: '100%', background: adh.text }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 13, color: adh.text }}>{adh.label}</span>
          </div>
        )}
      </Td>
      <Td align="center"><span style={{ fontSize: 12, color: C.textMid, fontWeight: 500 }}>{daysAgo(patient.lastRefill)}</span></Td>
      <Td align="right"><span style={{ fontWeight: 700, fontSize: 13, color: C.navy, fontFamily: fonts.body }}>{inr(patient.spent)}</span></Td>
      <Td align="right">
        <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); onView(); }}>View</Button>
      </Td>
    </tr>
  );
}

function FilterDropdown({ label, value, onChange, options }) {
  const current = options.find(o => o.value === value);
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        style={{
          appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
          padding: '0 28px 0 92px', height: 36,
          border: `1px solid ${C.border}`, borderRadius: 6,
          background: C.white, color: C.text,
          fontFamily: fonts.body, fontSize: 13, fontWeight: 600,
          cursor: 'pointer', minWidth: 200,
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span style={{
        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
        fontSize: 10, fontWeight: 700, color: C.textMid, letterSpacing: '0.04em',
        textTransform: 'uppercase', pointerEvents: 'none',
      }}>{label}</span>
      <span style={{
        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
        fontSize: 10, color: C.textMid, pointerEvents: 'none',
      }}>▼</span>
    </div>
  );
}

// ── PATIENT DETAIL ──
function PatientDetailScreen({ patientId, onNavigate, onAction }) {
  const patient = PATIENTS.find(p => p.id === patientId) || PATIENTS[0];
  // Fetch the real per-patient detail (adherence series + refill history) when
  // connected to the backend; fall back to the demo generators otherwise.
  const [detail, setDetail] = React.useState(null);
  React.useEffect(() => {
    if (window.PortalAPI && PortalAPI.enabled && PortalAPI.hasSession()) {
      PortalAPI.patientDetail(patientId).then(setDetail).catch(() => {});
    }
  }, [patientId]);
  const timeline = detail
    ? detail.series.filter(d => d.pct != null).map(d => d.pct)
    : adherenceTimeline(patient);
  const history = detail
    ? detail.refills.map(r => ({ date: r.placedAt, amount: Math.round((r.amount || 0) / 100), items: (r.items || []).length, status: r.status }))
    : refillHistory(patient);
  const adh = adherenceColor(detail && detail.adherence != null ? detail.adherence : patient.adherence);

  return (
    <div>
      {/* Breadcrumb / back */}
      <div style={{ padding: '16px 24px 0' }}>
        <button onClick={() => onNavigate('patients')} style={{
          border: 'none', background: 'none', cursor: 'pointer',
          color: C.textMid, fontFamily: fonts.body, fontSize: 12, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          ← Patients
        </button>
      </div>

      {/* Header card */}
      <div style={{ padding: '12px 24px 0' }}>
        <Card style={{ padding: '20px 22px', display: 'flex', gap: 20, alignItems: 'center' }}>
          <Avatar patient={patient} size={68} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <h1 style={{ fontFamily: fonts.body, fontSize: 26, fontWeight: 800, color: C.navy, margin: 0, letterSpacing: '-0.015em' }}>
                {patient.name}
              </h1>
              <span style={{ fontSize: 14, color: C.textMid, fontWeight: 500 }}>
                · {patient.gender}, {patient.age} yrs
              </span>
              {patient.risk === 'switch-risk' && (
                <Chip bg={C.redSoft} color={C.red} size={11} style={{ letterSpacing: '0.06em' }}>⚠ SWITCH RISK</Chip>
              )}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <ConditionChips conditions={patient.conditions} size={12} />
              <span style={{ fontSize: 12, color: C.textMid, fontWeight: 500 }}>📞 {patient.phone}</span>
              <span style={{ fontSize: 12, color: C.textMid, fontWeight: 500 }}>Member since {patient.since}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, paddingLeft: 20, borderLeft: `1px solid ${C.border}` }}>
            <MiniStat label="Adherence" value={adh.label} color={adh.text} />
            <MiniStat label="Active meds" value={patient.medCount} color={C.navy} />
            <MiniStat label="Lifetime spend" value={inr(patient.spent)} color={C.navy} />
          </div>
        </Card>
      </div>

      {/* Two-col body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, padding: '16px 24px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Current medications */}
          <Card>
            <SectionHeader title="Current medications" count={patient.meds.length} />
            <div>
              {patient.meds.map((m, i) => <MedRow key={m} med={m} idx={i} patient={patient} />)}
            </div>
          </Card>

          {/* Adherence chart */}
          <Card>
            <SectionHeader
              title="Adherence — last 90 days"
              right={<Chip bg={adh.bg} color={adh.text} size={11}>{adh.label} avg</Chip>}
            />
            <AdherenceChart points={timeline} color={adh.text} />
          </Card>

          {/* Refill history */}
          <Card>
            <SectionHeader title="Refill history" count={history.length} right={<button style={{ ...tabBtn(false), fontSize: 11 }}>Export</button>} />
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: C.cream }}>
                <Th>Order</Th><Th>Date</Th><Th align="center">Items</Th><Th align="right">Amount</Th><Th align="right">Status</Th>
              </tr></thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i}>
                    <Td><span style={{ fontFamily: fonts.body, fontWeight: 600, fontSize: 12, color: C.text }}>SP-{1300 - i * 24}</span></Td>
                    <Td>{fmtDate(h.date)}</Td>
                    <Td align="center"><span style={{ fontWeight: 700, color: C.navy }}>{h.items}</span></Td>
                    <Td align="right"><span style={{ fontWeight: 700, color: C.navy }}>{inr(h.amount)}</span></Td>
                    <Td align="right"><Chip bg={C.sageSoft} color={C.sage} size={10}>DELIVERED</Chip></Td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
                    No refill history yet — this is a new patient.
                  </td></tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Quick actions sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <SectionHeader title="Quick actions" />
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Button variant="coral" size="lg" full icon={<span style={{ fontSize: 14 }}>📲</span>} onClick={() => onAction('prescribe', patient)}>
                Add medicine to app
              </Button>
              <Button variant="success" size="lg" full icon={<span style={{ fontSize: 14 }}>✉</span>} onClick={() => onAction('sms', patient)}>
                Send SMS
              </Button>
              <Button variant="primary" size="lg" full icon={<span style={{ fontSize: 14, lineHeight: 0 }}>+</span>} onClick={() => onAction('refill', patient)}>
                Prepare refill
              </Button>
              <Button variant="ghost" size="lg" full icon={<span>📄</span>} onClick={() => onAction('prescription', patient)}>
                View prescription
              </Button>
              <Button variant="ghost" size="lg" full icon={<span>📞</span>} onClick={() => onAction('call', patient)}>
                Call patient
              </Button>
            </div>
          </Card>

          <Card>
            <SectionHeader title="Notes" />
            <div style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: 12, color: C.textMid, lineHeight: 1.6 }}>
                {patient.risk === 'switch-risk' ? (
                  <>
                    <strong style={{ color: C.red }}>Critical:</strong> No refill in 56 days. Adherence dropped from 78% (3mo ago) to 45%. Patient may have switched pharmacies. <strong>Recommend personal call from Dr. Sharma.</strong>
                  </>
                ) : patient.risk === 'adherence-dip' ? (
                  <>Adherence dropping. Last refill on time but missed doses are spiking. Worth an SMS check-in.</>
                ) : patient.isNew ? (
                  <>New patient — first prescription on file. Reach out to confirm setup and prepare their first refill for pickup.</>
                ) : (
                  <>Steady patient. Refills on schedule. No outstanding concerns. Next refill expected {fmtDate('2026-06-04')}.</>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <SectionHeader title="Family linked" />
            <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 16, background: C.creamWarm, color: C.textMid, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                {patient.id % 3 === 0 ? '+2' : patient.id % 3 === 1 ? '+1' : '0'}
              </div>
              <div style={{ fontSize: 12, color: C.textMid, lineHeight: 1.4 }}>
                {patient.id % 3 === 0 ? 'Wife & son receive reminder copies' : patient.id % 3 === 1 ? 'Daughter is co-caregiver' : 'No family members linked'}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.textMid, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color, marginTop: 4, letterSpacing: '-0.01em' }}>{value}</div>
    </div>
  );
}

function MedRow({ med, idx, patient }) {
  const daysLeft = patient.risk === 'switch-risk' ? [1, 1, 2, 4, 5, 7, 10, 12][idx] || 8 : [12, 18, 22, 28, 30, 14][idx] || 20;
  const isCritical = daysLeft <= 3;
  const isWarn = daysLeft <= 7;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16, padding: '12px 18px',
      borderBottom: `1px solid ${C.divider}`,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 4, background: C.creamWarm, color: C.navy,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: fonts.body, fontSize: 12, fontWeight: 800,
      }}>℞{idx + 1}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{med}</div>
        <div style={{ fontSize: 12, color: C.textMid, marginTop: 2 }}>
          {idx === 0 ? '1 tab, twice daily, after meals' : idx === 1 ? '1 tab, once daily, morning' : idx === 2 ? '1 tab at bedtime' : idx === 3 ? '1 tab daily, after breakfast' : '1 tab as prescribed'}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontSize: 14, fontWeight: 800,
          color: isCritical ? C.red : isWarn ? '#8A6418' : C.navy,
        }}>{daysLeft} days left</div>
        <div style={{ fontSize: 11, color: C.textMid, fontWeight: 500 }}>Refill by {fmtDate(new Date(Date.now() + daysLeft * 86400000).toISOString().slice(0, 10))}</div>
      </div>
    </div>
  );
}

// ── Adherence chart (line w/ area, milestones) ──
function AdherenceChart({ points: rawPoints, color }) {
  const points = (rawPoints || []).filter(p => typeof p === 'number' && isFinite(p));
  if (points.length < 2) {
    return <div style={{ padding: '28px 18px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>Not enough adherence history yet.</div>;
  }
  const width = 700, height = 200, pad = { l: 36, r: 16, t: 16, b: 28 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const max = 100, min = 0;
  const xy = (v, i) => [pad.l + (i / (points.length - 1)) * innerW, pad.t + innerH - ((v - min) / (max - min)) * innerH];
  const path = points.map((p, i) => {
    const [x, y] = xy(p, i);
    return (i === 0 ? 'M' : 'L') + x + ',' + y;
  }).join(' ');
  const area = path + ` L ${pad.l + innerW},${pad.t + innerH} L ${pad.l},${pad.t + innerH} Z`;
  return (
    <div style={{ padding: '12px 18px 6px' }}>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block', height: 200 }}>
        {/* Grid */}
        {[0, 25, 50, 60, 75, 85, 100].map(g => {
          const [, y] = xy(g, 0);
          const special = g === 60 || g === 85;
          return (
            <g key={g}>
              <line x1={pad.l} x2={pad.l + innerW} y1={y} y2={y}
                stroke={special ? (g === 85 ? C.sage : C.amber) : C.borderSoft}
                strokeDasharray={special ? '4 4' : '0'}
                strokeWidth={special ? 1 : 1} opacity={special ? 0.5 : 1} />
              <text x={pad.l - 8} y={y + 3} textAnchor="end" fontSize="10" fill={C.textMuted} fontFamily={fonts.body} fontWeight={600}>{g}%</text>
            </g>
          );
        })}
        {/* Area */}
        <path d={area} fill={color} opacity={0.08} />
        {/* Line */}
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {/* Points */}
        {points.map((p, i) => {
          const [x, y] = xy(p, i);
          return <circle key={i} cx={x} cy={y} r={3} fill="#fff" stroke={color} strokeWidth={2} />;
        })}
        {/* X labels */}
        {['90d ago', '60d', '30d', 'Today'].map((lab, i) => {
          const xPct = i / 3;
          const x = pad.l + xPct * innerW;
          return <text key={lab} x={x} y={height - 8} textAnchor={i === 0 ? 'start' : i === 3 ? 'end' : 'middle'} fontSize="10" fill={C.textMid} fontFamily={fonts.body} fontWeight={600}>{lab}</text>;
        })}
      </svg>
      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: C.textMid, fontWeight: 600, marginTop: 4 }}>
        <span><span style={{ display: 'inline-block', width: 14, height: 2, background: C.sage, marginRight: 5, verticalAlign: 'middle' }} /> 85% target</span>
        <span><span style={{ display: 'inline-block', width: 14, height: 2, background: C.amber, marginRight: 5, verticalAlign: 'middle' }} /> 60% threshold</span>
      </div>
    </div>
  );
}

// ── REFILL QUEUE ──
function RefillsScreen({ onAction, dataVersion }) {
  const [filter, setFilter] = useState('all');
  const [confirmedIds, setConfirmedIds] = useState({});

  const filtered = useMemo(() => {
    let list = REFILLS.map(r => ({ ...r, status: confirmedIds[r.id] || r.status }));
    if (filter === 'pending') list = list.filter(r => r.status === 'pending');
    if (filter === 'today') list = list.filter(r => r.placed.includes('ago') || r.placed.includes('min'));
    if (filter === 'ready') list = list.filter(r => r.status === 'ready');
    return list.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0));
  }, [filter, confirmedIds, dataVersion]); // dataVersion busts the memo after a refetch

  const counts = {
    all: REFILLS.length,
    pending: REFILLS.filter(r => r.status === 'pending').length,
    today: REFILLS.filter(r => r.placed.includes('ago') || r.placed.includes('min')).length,
    ready: REFILLS.filter(r => r.status === 'ready').length,
  };

  return (
    <div>
      <PageHeader
        title="Refill queue"
        subtitle={`${counts.pending} pending · ${counts.ready} ready · Total today: ${inr(REFILLS.reduce((s, r) => s + r.amount, 0))}`}
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" size="md" icon={<span>🖨</span>}>Print labels</Button>
            <Button variant="coral" size="md" icon={<span style={{ fontSize: 16, lineHeight: 0 }}>+</span>}>Manual order</Button>
          </div>
        }
      />

      {/* Filter tabs */}
      <div style={{ padding: '0 24px 16px', display: 'flex', gap: 6 }}>
        {[
          { id: 'all', label: 'All' },
          { id: 'pending', label: 'Pending' },
          { id: 'today', label: "Today's orders" },
          { id: 'ready', label: 'Ready for pickup' },
        ].map(t => (
          <button
            key={t.id} onClick={() => setFilter(t.id)}
            style={{
              padding: '8px 14px', borderRadius: 6,
              border: `1px solid ${filter === t.id ? C.navy : C.border}`,
              background: filter === t.id ? C.navy : C.white,
              color: filter === t.id ? '#fff' : C.text,
              fontFamily: fonts.body, fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            {t.label}
            <span style={{
              padding: '1px 7px', borderRadius: 8,
              background: filter === t.id ? 'rgba(255,255,255,0.2)' : C.creamWarm,
              color: filter === t.id ? '#fff' : C.textMid,
              fontSize: 11, fontWeight: 700,
            }}>{counts[t.id]}</span>
          </button>
        ))}
      </div>

      <div style={{ padding: '0 24px 24px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {filtered.map(r => {
          const patient = PATIENTS.find(p => p.id === r.patientId);
          const setStatus = (status) => {
            setConfirmedIds(prev => ({ ...prev, [r.id]: status }));
            // Persist + notify the patient when connected to the backend.
            if (window.PortalAPI && PortalAPI.enabled && r.realId) {
              PortalAPI.updateRefillStatus(r.realId, status).catch(() => {});
            }
          };
          return <RefillCard key={r.id} refill={r} patient={patient}
            onConfirm={() => setStatus('confirmed')}
            onReady={() => setStatus('ready')}
            onCollect={() => setStatus('delivered')}
            onAction={onAction} />;
        })}
      </div>
    </div>
  );
}

function RefillCard({ refill, patient, onConfirm, onReady, onCollect, onAction }) {
  const statusMap = {
    pending: { bg: C.amberSoft, fg: '#8A6418', label: 'PENDING' },
    confirmed: { bg: C.navySoft, fg: C.navy, label: 'CONFIRMED' },
    ready: { bg: C.sageSoft, fg: C.sage, label: 'READY' },
    delivered: { bg: C.creamWarm, fg: C.textMid, label: 'COLLECTED' },
    declined: { bg: C.redSoft, fg: C.red, label: 'DECLINED' },
  };
  const s = statusMap[refill.status] || statusMap.pending;
  // A just-linked patient may not be in the cached PATIENTS list yet — fall back to
  // the name the backend attached to the order so the card never crashes.
  const p = patient || { name: refill.name || 'Patient', age: '', id: refill.patientId };
  return (
    <Card style={{
      borderLeft: refill.urgent ? `3px solid ${C.red}` : `1px solid ${C.border}`,
      paddingLeft: refill.urgent ? 0 : 0,
    }}>
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${C.divider}` }}>
        <Avatar patient={p} size={42} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{p.name}</span>
            {p.age ? <span style={{ fontSize: 12, color: C.textMuted }}>· {p.age}</span> : null}
            {refill.urgent && <Chip bg={C.redSoft} color={C.red} size={10}>URGENT</Chip>}
          </div>
          <div style={{ fontSize: 11, color: C.textMid, marginTop: 2, display: 'flex', gap: 8, fontWeight: 500 }}>
            <span style={{ fontFamily: fonts.body, color: C.navy, fontWeight: 700 }}>#{refill.id}</span>
            <span>·</span>
            <span>{refill.placedTime}</span>
            <span>·</span>
            <span style={{ color: C.text, fontWeight: 600 }}>🏪 Pickup</span>
          </div>
        </div>
        <Chip bg={s.bg} color={s.fg} size={10}>{s.label}</Chip>
      </div>

      <div style={{ padding: '12px 16px' }}>
        {refill.items.map((it, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
            <span style={{ color: C.text }}>{it.med}</span>
            <span style={{ color: C.textMid, fontWeight: 600 }}>× {it.qty}</span>
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderTop: `1px solid ${C.divider}`, background: C.cream,
      }}>
        <div>
          <div style={{ fontSize: 10, color: C.textMid, fontWeight: 700, letterSpacing: '0.05em' }}>TOTAL</div>
          {refill.amount > 0
            ? <div style={{ fontSize: 18, fontWeight: 800, color: C.navy, letterSpacing: '-0.01em' }}>{inr(refill.amount)}</div>
            : <div style={{ fontSize: 14, fontWeight: 700, color: C.textMid }}>Price at counter</div>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {refill.status === 'pending' && (
            <>
              <Button variant="ghost" size="sm" onClick={() => onAction('decline', p, refill)}>Decline</Button>
              <Button variant="success" size="sm" onClick={onConfirm} icon={<span>✓</span>}>Confirm</Button>
            </>
          )}
          {refill.status === 'confirmed' && (
            <>
              <Button variant="ghost" size="sm" onClick={() => onAction('sms', p)}>SMS</Button>
              <Button variant="primary" size="sm" onClick={onReady}>Mark ready</Button>
            </>
          )}
          {refill.status === 'ready' && (
            <>
              <Button variant="ghost" size="sm" onClick={() => onAction('sms', p)}>Notify</Button>
              <Button variant="success" size="sm" icon={<span>✓</span>} onClick={onCollect}>Mark collected</Button>
            </>
          )}
          {refill.status === 'delivered' && (
            <Button variant="ghost" size="sm">View receipt</Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// ── INVENTORY ──
function InventoryScreen() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stockModal, setStockModal] = useState(null); // { mode: 'new'|'add', item }
  const [localStock, setLocalStock] = useState({});
  const [flash, setFlash] = useState(null);
  const [activeOffer] = useState(() => readActiveOffer());
  const [version, setVersion] = useState(0); // bump to re-read refreshed inventory
  const apiOn = window.PortalAPI && PortalAPI.enabled;
  // Demo-mode only: live inventory adjustments from counter sales via the bridge.
  const [adjust, setAdjust] = useState(() => (typeof PharmacyBridge !== 'undefined' ? PharmacyBridge.readInventoryAdjust() : {}));

  useEffect(() => {
    if (apiOn || typeof PharmacyBridge === 'undefined') return;
    setAdjust(PharmacyBridge.readInventoryAdjust());
    return PharmacyBridge.subscribeInventory((m) => { setAdjust(m); });
  }, []);

  // When connected, pull the latest inventory from the backend (reflects counter
  // sales made elsewhere) and after every change, so edits persist across logins.
  const refreshInventory = () => {
    if (!apiOn) return;
    PortalAPI.inventory().then(inv => { window.__applyPortalData({ inventory: inv }); setVersion(v => v + 1); }).catch(() => {});
  };
  useEffect(() => { refreshInventory(); }, []);
  // Live refresh when stock moves elsewhere (counter sale or a collected refill).
  useEffect(() => {
    const h = () => refreshInventory();
    window.addEventListener('sp_inventory_changed', h);
    return () => window.removeEventListener('sp_inventory_changed', h);
  }, []);

  // Effective stock: the backend is the source of truth (already reflects sales);
  // demo mode overlays local top-ups + bridge sales adjustments.
  const effStock = (item) => apiOn ? item.stock : ((localStock[item.name] ?? item.stock) + (adjust[item.name] || 0));
  const effStatus = (item) => {
    const s = effStock(item);
    if (s <= 0) return 'out-of-stock';
    if (s < item.demand7d) return 'order-soon';
    return 'in-stock';
  };

  const filtered = useMemo(() => {
    let list = [...INVENTORY];
    if (search) list = list.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== 'all') list = list.filter(i => effStatus(i) === statusFilter);
    return list;
  }, [search, statusFilter, adjust, localStock, version]);

  const statusCount = (s) => INVENTORY.filter(i => effStatus(i) === s).length;

  return (
    <div>
      <PageHeader
        title="Inventory & stock"
        subtitle={`${INVENTORY.length} SKUs tracked · Demand forecast learned from the last 28 days of sales`}
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" size="md" icon={<span>⇩</span>}>Export stock list</Button>
            <Button variant="coral" size="md" icon={<span style={{ fontSize: 16, lineHeight: 0 }}>+</span>} onClick={() => setStockModal({ mode: 'new' })}>Add medicine</Button>
          </div>
        }
      />

      {/* Status callout cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, padding: '0 24px 16px' }}>
        <StatCard label="Out of stock" value={statusCount('out-of-stock')} sub="Block patient orders" accent="red" badge="ACTION" />
        <StatCard label="Order soon" value={statusCount('order-soon')} sub="Below 7-day demand" accent="navy" />
        <StatCard label="In stock" value={statusCount('in-stock')} sub="Healthy levels" accent="sage" />
        <StatCard label="Inventory value" value={inr(INVENTORY.reduce((s, i) => s + (i.stock || 0) * (i.mrp || 0), 0))} sub="Across all SKUs" accent="navy" />
      </div>

      <div style={{ padding: '0 24px 24px' }}>
        <Card>
          <div style={{
            display: 'flex', gap: 12, padding: '14px 18px',
            borderBottom: `1px solid ${C.borderSoft}`, alignItems: 'center',
          }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 8,
              padding: '0 12px', border: `1px solid ${C.border}`, borderRadius: 6,
              background: C.cream, height: 36, maxWidth: 380,
            }}>
              <span style={{ color: C.textMuted }}>⌕</span>
              <input
                placeholder="Search medicine name…"
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: fonts.body, fontSize: 13 }}
              />
            </div>
            <FilterDropdown
              label="Status" value={statusFilter} onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All status' },
                { value: 'in-stock', label: 'In stock' },
                { value: 'order-soon', label: 'Order soon' },
                { value: 'out-of-stock', label: 'Out of stock' },
              ]}
            />
          </div>

          {activeOffer && (
            <div style={{
              margin: '0 18px 0', padding: '10px 14px',
              background: 'linear-gradient(90deg, #1F3864 0%, #1B3A6B 100%)',
              borderRadius: '0 0 6px 6px',
              display: 'flex', alignItems: 'center', gap: 12,
              borderTop: `3px solid ${C.sage}`,
            }}>
              <span style={{ fontSize: 18 }}>🏷️</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{activeOffer.label} — {activeOffer.discount}% off all medicines</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginLeft: 10 }}>Prices below reflect the active discount · Valid until {fmtDate(activeOffer.expiry)}</span>
              </div>
              <Chip bg="rgba(91,123,95,0.35)" color="#8EC892" size={10}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8EC892', marginRight: 5, animation: 'pulseDot 1.6s infinite', display: 'inline-block' }} />
                LIVE
              </Chip>
            </div>
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: C.cream }}>
              <Th style={{ width: '28%' }}>Medicine</Th>
              <Th align="right">Current stock</Th>
              <Th align="right">Demand · 7d</Th>
              <Th align="right">Days remaining</Th>
              <Th align="right">Suggested order</Th>
              <Th align="right">{activeOffer ? `Price (${activeOffer.discount}% off)` : 'MRP / unit'}</Th>
              <Th>Supplier</Th>
              <Th align="center">Status</Th>
              <Th align="right"></Th>
            </tr></thead>
            <tbody>
              {filtered.map(item => <InventoryRow key={item.name} item={{ ...item, stock: effStock(item), status: effStatus(item) }} onAdd={() => setStockModal({ mode: 'add', item })} onOrder={() => setStockModal({ mode: 'order', item })} flash={flash === item.name} activeOffer={activeOffer} />)}
            </tbody>
          </table>
        </Card>
      </div>
      {stockModal && <StockModal data={stockModal} onClose={() => setStockModal(null)} onSave={(d) => {
        if (apiOn) {
          if (d.mode === 'new') {
            PortalAPI.createInventory({ name: d.name, stock: d.units, demand7d: 0, mrp: Math.round((parseFloat(d.mrp) || 0) * 100), supplier: d.supplier || undefined }).then(refreshInventory).catch(() => {});
          } else {
            const item = INVENTORY.find(i => i.id === d.id || i.name === d.name);
            if (item && item.id) PortalAPI.setInventoryStock(item.id, (item.stock || 0) + d.units).then(refreshInventory).catch(() => {});
          }
        } else {
          setLocalStock(prev => ({ ...prev, [d.name]: (prev[d.name] ?? (INVENTORY.find(i => i.name === d.name)?.stock || 0)) + d.units }));
        }
        setStockModal(null);
        setFlash(d.name);
        setTimeout(() => setFlash(null), 1800);
      }} />}
    </div>
  );
}

function StockModal({ data, onClose, onSave }) {
  const isNew = data.mode === 'new';
  const isOrder = data.mode === 'order';
  const [name, setName] = useState(data.item?.name || '');
  const [units, setUnits] = useState(isOrder ? 500 : isNew ? 100 : 200);
  const [supplier, setSupplier] = useState(data.item?.supplier || '');
  const [mrp, setMrp] = useState(data.item?.mrp || '');

  const title = isNew ? 'Add new medicine to inventory' : isOrder ? `Order stock — ${data.item.name}` : `Add stock — ${data.item.name}`;
  const subtitle = isNew ? 'New SKU will be tracked across all linked patients' : isOrder ? `Currently out of stock · ${data.item.supplier}` : `Currently ${data.item.stock} units in stock · ${data.item.supplier}`;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 110,
      background: 'rgba(15, 27, 45, 0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, animation: 'backdropIn 0.18s ease-out',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 480, maxWidth: '100%', background: C.white, borderRadius: 10,
        border: `1px solid ${C.border}`,
        boxShadow: '0 24px 48px rgba(15,27,45,0.18)',
        animation: 'modalIn 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: C.navy, margin: 0, letterSpacing: '-0.01em' }}>{title}</h2>
            <div style={{ fontSize: 12, color: C.textMid, marginTop: 4, fontWeight: 500 }}>{subtitle}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, fontSize: 18 }}>✕</button>
        </div>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {isNew && (
            <Field label="Medicine name">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Losartan 50mg" style={inputStyle} />
            </Field>
          )}
          <Field label={isOrder ? 'Order quantity (units)' : 'Units to add'}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => setUnits(Math.max(0, units - 50))} style={stepBtn}>−50</button>
              <input type="number" value={units} onChange={e => setUnits(parseInt(e.target.value) || 0)} style={{ ...inputStyle, textAlign: 'center', fontSize: 18, fontWeight: 800, color: C.navy }} />
              <button onClick={() => setUnits(units + 50)} style={stepBtn}>+50</button>
            </div>
          </Field>
          {isNew && (
            <>
              <Field label="Supplier">
                <input value={supplier} onChange={e => setSupplier(e.target.value)} style={inputStyle} />
              </Field>
              <Field label="MRP per unit (₹)">
                <input type="number" step="0.10" value={mrp} onChange={e => setMrp(parseFloat(e.target.value) || 0)} style={inputStyle} />
              </Field>
            </>
          )}
          <div style={{ padding: 12, background: C.cream, borderRadius: 6, fontSize: 12, color: C.textMid, lineHeight: 1.5 }}>
            <strong style={{ color: C.text }}>Total cost:</strong> {inr(units * (data.item?.mrp || mrp))} · estimated invoice from {isNew ? supplier : data.item.supplier}
          </div>
        </div>
        <div style={{ padding: '14px 22px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8, background: C.cream }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="coral" onClick={() => onSave({ name: name || data.item?.name, units, supplier, mrp, mode: data.mode, id: data.item?.id })} icon={<span>✓</span>}>
            {isOrder ? 'Place order' : isNew ? 'Add medicine' : 'Add to stock'}
          </Button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = { flex: 1, height: 38, padding: '0 12px', border: `1px solid ${C.border}`, borderRadius: 6, background: C.white, fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: C.text, outline: 'none', width: '100%' };
const stepBtn = { height: 38, padding: '0 14px', border: `1px solid ${C.border}`, borderRadius: 6, background: C.cream, fontFamily: fonts.body, fontSize: 12, fontWeight: 700, color: C.textMid, cursor: 'pointer' };

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.textMid, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', gap: 8 }}>{children}</div>
    </div>
  );
}

function InventoryRow({ item, onAdd, onOrder, flash, activeOffer }) {
  const statusMap = {
    'in-stock': { bg: C.sageSoft, fg: C.sage, label: 'In stock' },
    'order-soon': { bg: C.amberSoft, fg: '#8A6418', label: 'Order soon' },
    'out-of-stock': { bg: C.redSoft, fg: C.red, label: 'Out of stock' },
  };
  const s = statusMap[item.status];
  const daysLeft = item.demand7d > 0 ? Math.round((item.stock / item.demand7d) * 7) : 99;
  // Suggested reorder qty to reach ~2 weeks of cover. Backend supplies this in API
  // mode; fall back to the same formula client-side so demo mode matches.
  const COVER_DAYS = 14;
  const suggested = item.suggestedOrder != null
    ? item.suggestedOrder
    : (item.demand7d > 0 ? Math.max(0, Math.ceil(item.demand7d * COVER_DAYS / 7) - item.stock) : 0);
  return (
    <tr style={{ background: flash ? C.sageSoft : 'transparent', transition: 'background 0.4s' }}>
      <Td>
        <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{item.name}</div>
      </Td>
      <Td align="right"><span style={{ fontWeight: 800, fontSize: 15, color: item.status === 'out-of-stock' ? C.red : C.navy }}>{item.stock}</span></Td>
      <Td align="right"><span style={{ fontWeight: 600, color: C.textMid }}>{item.demand7d}</span></Td>
      <Td align="right">
        <span style={{
          fontWeight: 700, fontSize: 13,
          color: daysLeft < 7 ? C.red : daysLeft < 14 ? '#8A6418' : C.sage,
        }}>{daysLeft > 30 ? '30+' : daysLeft} days</span>
      </Td>
      <Td align="right">
        {suggested > 0
          ? <span style={{ fontWeight: 800, fontSize: 13, color: item.status === 'out-of-stock' ? C.red : C.coral }}>+{suggested} units</span>
          : <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>}
      </Td>
      <Td align="right">
        {activeOffer ? (
          <div>
            <div style={{ fontWeight: 600, color: C.textMid, textDecoration: 'line-through', fontSize: 11 }}>{inr(item.mrp, { decimals: 2 })}</div>
            <div style={{ fontWeight: 800, color: C.sage, fontSize: 13 }}>{inr(+(item.mrp * (1 - activeOffer.discount / 100)).toFixed(2), { decimals: 2 })}</div>
            <div style={{ fontSize: 10, color: C.sage, fontWeight: 600 }}>−{activeOffer.discount}%</div>
          </div>
        ) : (
          <span style={{ fontWeight: 600, fontFamily: fonts.body, color: C.text }}>{inr(item.mrp, { decimals: 2 })}</span>
        )}
      </Td>
      <Td><span style={{ fontSize: 12, color: C.textMid, fontWeight: 500 }}>{item.supplier}</span></Td>
      <Td align="center"><Chip bg={s.bg} color={s.fg} size={10}>{s.label.toUpperCase()}</Chip></Td>
      <Td align="right">
        <Button variant={item.status === 'out-of-stock' ? 'danger' : 'ghost'} size="sm" onClick={item.status === 'out-of-stock' ? onOrder : onAdd}>
          {item.status === 'out-of-stock' ? 'Order now' : 'Add stock'}
        </Button>
      </Td>
    </tr>
  );
}

// ── ANALYTICS ──
function AnalyticsScreen() {
  // Real analytics (top meds sold, demographics) from the backend; demo data
  // inside each component when the portal runs without a backend.
  const live = window.PortalAPI && PortalAPI.enabled;
  const [analytics, setAnalytics] = useState(null);
  useEffect(() => {
    if (live) PortalAPI.analytics().then(setAnalytics).catch(() => setAnalytics(null));
  }, []);

  const monthLabel = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  return (
    <div>
      <PageHeader
        title="Revenue & analytics"
        subtitle={live ? `${monthLabel} · Live from your sales and patient data` : 'May 2026 · Compared to Apr 2026 and May 2025'}
      />

      {/* Comparison strip — real revenue from the backend's 12-month series */}
      {(() => {
        const r12 = (window.PORTAL_DASHBOARD && window.PORTAL_DASHBOARD.revenue12m) || null;
        const rupees = (p) => Math.round((p || 0) / 100);
        const thisM = r12 ? rupees(r12[11].amount) : 342850;
        const lastM = r12 ? rupees(r12[10].amount) : 336420;
        const yearAgo = r12 ? rupees(r12[0].amount) : 287920;
        const pct = (a, b) => b > 0 ? `${a >= b ? '+' : ''}${Math.round((a - b) / b * 1000) / 10}%` : (a > 0 ? 'new' : '—');
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, padding: '0 24px 16px' }}>
            <ComparisonCard label="This month" value={inr(thisM)} sub={r12 ? r12[11].m : 'This month'} highlight />
            <ComparisonCard label="vs Last month" value={inr(lastM)} sub={r12 ? r12[10].m : 'Last month'} delta={pct(thisM, lastM)} deltaUp={thisM >= lastM} />
            <ComparisonCard label="vs Last year" value={inr(yearAgo)} sub="Same month last year" delta={pct(thisM, yearAgo)} deltaUp={thisM >= yearAgo} />
          </div>
        );
      })()}

      {/* Big chart */}
      <div style={{ padding: '0 24px 16px' }}>
        <Card>
          <SectionHeader
            title="Monthly revenue — last 12 months"
            right={window.PORTAL_DASHBOARD
              ? <Chip bg={C.sageSoft} color={C.sage} size={11}>{inr(window.PORTAL_DASHBOARD.revenue12m.reduce((s, d) => s + Math.round(d.amount / 100), 0))} total</Chip>
              : <Chip bg={C.sageSoft} color={C.sage} size={11}>▲ ₹74,930 vs same period last year</Chip>}
          />
          <Revenue12Chart data={window.PORTAL_DASHBOARD ? window.PORTAL_DASHBOARD.revenue12m.map(d => ({ ...d, amount: Math.round(d.amount / 100) })) : REV_12MONTHS} />
        </Card>
      </div>

      {/* Two-col: top patients + top meds */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '0 24px 16px' }}>
        <Card>
          <SectionHeader title="Top 10 patients by lifetime value" />
          <TopPatientsTable />
        </Card>
        <Card>
          <SectionHeader title="Top 10 medicines sold (this month)" />
          <TopMedsTable live={live} meds={analytics && analytics.topMeds} />
        </Card>
      </div>

      {/* Demographics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '0 24px 24px' }}>
        <Card>
          <SectionHeader title="Patients by age group" />
          <AgeDistribution live={live} ages={analytics && analytics.ageGroups} />
        </Card>
        <Card>
          <SectionHeader title="Condition mix" />
          <ConditionMix live={live} data={analytics} />
        </Card>
      </div>
    </div>
  );
}

function ComparisonCard({ label, value, sub, delta, deltaUp, highlight }) {
  return (
    <Card style={{
      padding: '20px 22px',
      borderTop: highlight ? `3px solid ${C.coral}` : `3px solid ${C.navy}`,
    }}>
      <div style={{ fontSize: 11, color: C.textMid, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: C.navy, letterSpacing: '-0.02em' }}>{value}</span>
        {delta && (
          <span style={{
            fontSize: 14, fontWeight: 700,
            color: deltaUp ? C.sage : C.red,
          }}>{deltaUp ? '▲' : '▼'} {delta}</span>
        )}
      </div>
      <div style={{ fontSize: 12, color: C.textMid, marginTop: 4, fontWeight: 500 }}>{sub}</div>
    </Card>
  );
}

function Revenue12Chart({ data }) {
  const max = Math.max(1, ...data.map(d => d.amount)); // avoid /0 → NaN with no sales
  const min = Math.min(...data.map(d => d.amount));
  return (
    <div style={{ padding: '14px 18px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 200, paddingLeft: 36, position: 'relative' }}>
        {/* Y axis labels */}
        {[max, (max + min) / 2, min].map((v, i) => (
          <div key={i} style={{
            position: 'absolute', left: 0, top: i * 90,
            fontSize: 10, color: C.textMuted, fontWeight: 600,
          }}>{inr(Math.round(v / 1000)) + 'K'}</div>
        ))}
        {data.map((d, i) => {
          const h = ((d.amount - min * 0.6) / (max - min * 0.6)) * 180;
          const isLast = i === data.length - 1;
          return (
            <div key={d.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: 200, justifyContent: 'flex-end' }}>
              <div style={{
                width: '100%', height: h, maxWidth: 50,
                background: isLast ? C.coral : C.navy,
                opacity: isLast ? 1 : 0.85,
                borderRadius: '4px 4px 0 0',
                position: 'relative',
              }}>
                {isLast && (
                  <div style={{
                    position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)',
                    fontSize: 11, fontWeight: 800, color: C.coral, whiteSpace: 'nowrap',
                    fontFamily: fonts.body,
                  }}>{inr(d.amount)}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 14, paddingLeft: 36, marginTop: 6 }}>
        {data.map(d => (
          <div key={d.m} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 600, color: C.textMid }}>{d.m}</div>
        ))}
      </div>
    </div>
  );
}

function TopPatientsTable() {
  const top = [...PATIENTS].sort((a, b) => b.spent - a.spent).slice(0, 10).filter(p => p.spent > 0);
  if (top.length === 0) {
    return <EmptyAnalytics msg="No patient spending yet — delivered refill orders will rank patients here." />;
  }
  const maxSpent = top[0].spent;
  return (
    <div style={{ padding: '4px 0 8px' }}>
      {top.map((p, i) => (
        <div key={p.id} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px',
          borderBottom: i === top.length - 1 ? 'none' : `1px solid ${C.divider}`,
        }}>
          <span style={{ width: 18, fontSize: 11, fontWeight: 700, color: C.textMuted, textAlign: 'right' }}>{i + 1}</span>
          <Avatar patient={p} size={28} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{p.name}</div>
            <div style={{ height: 4, background: C.creamWarm, borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
              <div style={{ width: (p.spent / maxSpent * 100) + '%', height: '100%', background: C.navy }} />
            </div>
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.navy, fontFamily: fonts.body }}>{inr(p.spent)}</span>
        </div>
      ))}
    </div>
  );
}

function TopMedsTable({ live, meds: realMeds }) {
  // Live mode: real dispense data from the backend (revenue arrives in paise).
  const meds = live
    ? (realMeds || []).map(m => ({ ...m, revenue: Math.round((m.revenue || 0) / 100) }))
    : [
        { name: 'Metformin 500mg', units: 4280, revenue: 17976 },
        { name: 'Telmisartan 40mg', units: 2840, revenue: 24140 },
        { name: 'Atorvastatin 20mg', units: 2480, revenue: 16864 },
        { name: 'Glimepiride 2mg', units: 1920, revenue: 10368 },
        { name: 'Aspirin 75mg', units: 3120, revenue: 3744 },
        { name: 'Thyronorm 50mcg', units: 1480, revenue: 5624 },
        { name: 'Amlodipine 5mg', units: 1280, revenue: 4352 },
        { name: 'Pantoprazole 40mg', units: 1820, revenue: 10192 },
        { name: 'Clopidogrel 75mg', units: 1020, revenue: 9384 },
        { name: 'Vitamin D3 60K', units: 220, revenue: 6160 },
      ];
  if (meds.length === 0) {
    return <EmptyAnalytics msg="No sales recorded this month yet — counter sales will show up here." />;
  }
  const maxRev = Math.max(...meds.map(m => m.revenue));
  return (
    <div style={{ padding: '4px 0 8px' }}>
      {meds.map((m, i) => (
        <div key={m.name} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px',
          borderBottom: i === meds.length - 1 ? 'none' : `1px solid ${C.divider}`,
        }}>
          <span style={{ width: 18, fontSize: 11, fontWeight: 700, color: C.textMuted, textAlign: 'right' }}>{i + 1}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{m.name}</span>
              <span style={{ fontSize: 12, color: C.textMid, fontWeight: 600 }}>{m.units.toLocaleString('en-IN')} units</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <div style={{ flex: 1, height: 4, background: C.creamWarm, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: (m.revenue / maxRev * 100) + '%', height: '100%', background: C.coral }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: C.navy, fontFamily: fonts.body, minWidth: 64, textAlign: 'right' }}>{inr(m.revenue)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyAnalytics({ msg }) {
  return (
    <div style={{ padding: '28px 18px', textAlign: 'center', fontSize: 12.5, color: C.textMuted, fontWeight: 600, lineHeight: 1.6 }}>
      {msg}
    </div>
  );
}

function AgeDistribution({ live, ages: realAges }) {
  const ages = live
    ? (realAges || [])
    : [
        { range: '40-49', pct: 14, count: 35 },
        { range: '50-59', pct: 28, count: 69 },
        { range: '60-69', pct: 38, count: 94 },
        { range: '70+', pct: 20, count: 49 },
      ];
  if (ages.length === 0) {
    return <EmptyAnalytics msg="No patient ages on record yet — this fills in as patients complete their profile." />;
  }
  return (
    <div style={{ padding: '16px 18px' }}>
      {ages.map((a, i) => (
        <div key={a.range} style={{ marginBottom: i === ages.length - 1 ? 0 : 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{a.range}</span>
            <span style={{ fontSize: 12, color: C.textMid, fontWeight: 600 }}>{a.count} patients · {a.pct}%</span>
          </div>
          <div style={{ height: 10, background: C.creamWarm, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: a.pct + '%', height: '100%', background: i === 2 ? C.coral : C.navy, opacity: i === 2 ? 1 : 0.85 - i * 0.1 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ConditionMix({ live, data }) {
  const palette = ['#1F3864', '#C0392B', '#D97757', '#5B7B5F', '#8A6418', '#6B3B5E'];
  const conditions = live
    ? ((data && data.conditions) || []).map((c, i) => ({ ...c, color: palette[i % palette.length] }))
    : [
        { name: 'Diabetes (Type 2)', count: 142, color: '#1F3864' },
        { name: 'Hypertension', count: 118, color: '#C0392B' },
        { name: 'Cardiac', count: 64, color: '#D97757' },
        { name: 'Thyroid', count: 48, color: '#5B7B5F' },
        { name: 'COPD', count: 28, color: '#8A6418' },
        { name: 'Cholesterol', count: 38, color: '#6B3B5E' },
      ];
  if (conditions.length === 0) {
    return <EmptyAnalytics msg="No conditions on record yet — this fills in as patients complete their profile." />;
  }
  const total = conditions.reduce((s, c) => s + c.count, 0);
  let acc = 0;
  return (
    <div style={{ padding: '16px 18px' }}>
      {/* Stacked bar */}
      <div style={{ display: 'flex', height: 18, borderRadius: 4, overflow: 'hidden', marginBottom: 14, border: `1px solid ${C.border}` }}>
        {conditions.map(c => (
          <div key={c.name} style={{ width: (c.count / total * 100) + '%', background: c.color }} title={c.name} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {conditions.map(c => (
          <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, background: c.color, borderRadius: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: C.text, fontWeight: 600, flex: 1 }}>{c.name}</span>
            <span style={{ fontSize: 12, color: C.textMid, fontWeight: 600 }}>{c.count}</span>
          </div>
        ))}
      </div>
      {(() => {
        const pct = live ? (data && data.multiConditionPct) : 62;
        const pair = live
          ? (data && data.topConditionPair && `${data.topConditionPair.pair} is the most common pair (${data.topConditionPair.count} patient${data.topConditionPair.count === 1 ? '' : 's'}).`)
          : 'Diabetes + Hypertension is the most common pair (88 patients).';
        if (live && !pct && !pair) return null;
        return (
          <div style={{ marginTop: 14, padding: '10px 12px', background: C.cream, borderRadius: 6, border: `1px solid ${C.borderSoft}` }}>
            <div style={{ fontSize: 11, color: C.textMid, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Insight</div>
            <div style={{ fontSize: 12, color: C.text, marginTop: 4, lineHeight: 1.5 }}>
              <strong style={{ color: C.navy }}>{pct || 0}%</strong> of your patients have multiple conditions.{pair ? ` ${pair}` : ''}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── PHARMACY CODE INPUT ──
// Format: XXXX-XXXXX (4 alphanumeric · dash · 5 alphanumeric = 9 chars)
function PharmacyCodeInput({ value, onChange, style }) {
  const handleChange = (e) => {
    let clean = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length > 9) clean = clean.slice(0, 9);
    const formatted = clean.length > 4 ? clean.slice(0, 4) + '-' + clean.slice(4) : clean;
    onChange(formatted);
  };
  const isValid = /^[A-Z0-9]{4}-[A-Z0-9]{5}$/.test(value);
  const hasContent = value.length > 0;
  const charCount = value.replace('-', '').length;
  return (
    <div>
      <div style={{ position: 'relative' }}>
        <input
          value={value}
          onChange={handleChange}
          maxLength={10}
          placeholder="XXXX-XXXXX"
          spellCheck={false}
          style={{
            ...inputStyle,
            fontFamily: fonts.mono,
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: isValid ? C.navy : (hasContent ? C.red : C.textMuted),
            borderColor: isValid ? C.sage : (hasContent ? C.red : C.border),
            paddingRight: 72,
            ...style,
          }}
        />
        <span style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          fontSize: 11, fontWeight: 700,
          color: isValid ? C.sage : (hasContent ? C.red : C.textMuted),
          pointerEvents: 'none',
        }}>
          {isValid ? '✓ Valid' : `${charCount}/9`}
        </span>
      </div>
      <div style={{ marginTop: 5, fontSize: 11, fontWeight: 500, color: isValid ? C.sage : (hasContent ? C.red : C.textMuted) }}>
        {isValid ? '✓ Code is valid and ready to share with patients'
          : hasContent ? 'Format: 4 chars · dash · 5 chars  (e.g. SHRM-74219)'
          : 'Format: XXXX-XXXXX — letters & numbers only'}
      </div>
    </div>
  );
}

// ── PROFILE SETUP SCREEN ──
function ProfileSetupScreen() {
  // Live mode: prefilled from the real account/pharmacy and saved through the
  // backend. Fields with no backend home (email, licence, GSTIN…) are hidden
  // so nothing pretends to save.
  const live = window.PortalAPI && PortalAPI.enabled;
  const initial = () => {
    const ph = (live && window.PHARMACY) || null;
    return live ? {
      name: (window.PortalAPI && PortalAPI.userName()) || '',
      title: 'Pharmacist',
      pharmacyName: (ph && ph.name) || '',
      address: (ph && ph.location) || '',
      hours: (ph && ph.hours) || '',
    } : {
      name: 'Dr. Rajesh Sharma',
      title: 'Owner · Pharmacist',
      email: 'rajesh@sharmamedical.in',
      phone: '+91 98765 43210',
      pharmacyName: 'Sharma Medical Store',
      address: 'Andheri West, Mumbai – 400053',
      license: 'MH-PHM-2024-00183',
      gstin: '27AAACS1234A1ZN',
    };
  };
  const initialCode = () => (live && window.PHARMACY && window.PHARMACY.code)
    || localStorage.getItem('sp_pharmacy_code') || 'SHRM-74219';
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState(null);
  const [pharmacyCode, setPharmacyCode] = useState(initialCode);
  const [profile, setProfile] = useState(initial);

  const update = (key, val) => setProfile(p => ({ ...p, [key]: val }));
  const isCodeValid = /^[A-Z0-9]{4}-[A-Z0-9]{5}$/.test(pharmacyCode);

  // Restock (inventory refill) reminder settings — when and how eagerly the
  // daily low-stock alert fires. Saved with the main Save button.
  const initialRestock = () => {
    const ph = (live && window.PHARMACY) || {};
    return {
      on: ph.restockRemindersOn !== false,
      hour: (ph.restockRemindHour != null ? ph.restockRemindHour : 9),
      days: ph.restockLeadDays || 7,
    };
  };
  const [restock, setRestock] = useState(initialRestock);

  const discard = () => { setProfile(initial()); setPharmacyCode(initialCode()); setRestock(initialRestock()); setSaveErr(null); };

  // Desktop notifications (Web Push) — restock reminders + new-order alerts
  // arrive as real OS notifications, even when the portal tab is closed.
  const pushSupported = typeof window !== 'undefined' && window.PortalPush && window.PortalPush.supported;
  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMsg, setPushMsg] = useState('');
  useEffect(() => {
    if (pushSupported) window.PortalPush.isEnabled().then(setPushOn).catch(() => {});
  }, []);
  const togglePush = async () => {
    if (!pushSupported || pushBusy) return;
    setPushBusy(true); setPushMsg('');
    try {
      if (pushOn) {
        await window.PortalPush.disable();
        setPushOn(false); setPushMsg('Desktop notifications turned off.');
      } else {
        await window.PortalPush.enable();
        setPushOn(true); setPushMsg('On — sending a test notification…');
        if (window.PortalAPI && PortalAPI.pushTest) PortalAPI.pushTest().catch(() => {});
      }
    } catch (e) { setPushMsg(e.message || 'Could not enable notifications.'); }
    setPushBusy(false);
  };

  const handleSave = () => {
    if (!isCodeValid || saving) return;
    if (live) {
      setSaving(true); setSaveErr(null);
      PortalAPI.updatePharmacy({
        name: profile.pharmacyName, location: profile.address, hours: profile.hours, code: pharmacyCode,
        restockRemindersOn: restock.on, restockRemindHour: restock.hour, restockLeadDays: restock.days,
      })
        .then((ph) => {
          setSaving(false);
          window.PHARMACY = ph;
          localStorage.setItem('sp_pharmacy_code', ph.code);
          setSaved(true);
          setTimeout(() => setSaved(false), 2400);
        })
        .catch((e) => { setSaving(false); setSaveErr(e.message || 'Could not save'); });
    } else {
      localStorage.setItem('sp_pharmacy_code', pharmacyCode);
      setSaved(true);
      setTimeout(() => setSaved(false), 2400);
    }
  };

  return (
    <div>
      <PageHeader
        title="Profile & account"
        subtitle="Your personal details and pharmacy settings"
        right={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {saveErr && <span style={{ fontSize: 12, fontWeight: 600, color: C.red }}>{saveErr}</span>}
            <Button variant="ghost" size="md" onClick={discard}>Discard changes</Button>
            <Button variant="coral" size="md" disabled={!isCodeValid || saving} onClick={handleSave}
              icon={saved ? <span>✓</span> : null}>
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save changes'}
            </Button>
          </div>
        }
      />

      <div style={{ padding: '0 24px 24px', display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 18, alignItems: 'start' }}>
        {/* Left: Personal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <SectionHeader title="Personal details" />
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: live ? 0 : 14, borderBottom: live ? 'none' : `1px solid ${C.borderSoft}` }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 28,
                  background: C.navy, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 800, flexShrink: 0,
                }}>{(profile.name || 'P').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: C.navy }}>{profile.name}</div>
                  <div style={{ fontSize: 12, color: C.textMid, marginTop: 2, fontWeight: 500 }}>{profile.title}</div>
                  {!live && <button style={{
                    marginTop: 5, padding: '3px 9px', borderRadius: 4,
                    border: `1px solid ${C.border}`, background: C.cream,
                    fontSize: 11, fontWeight: 600, color: C.textMid,
                    cursor: 'pointer', fontFamily: fonts.body,
                  }}>Change photo</button>}
                </div>
              </div>
              {live ? (
                <div style={{ fontSize: 12, color: C.textMid, lineHeight: 1.6 }}>
                  Your name and login phone come from your SaathiPill account.
                </div>
              ) : (
                <>
                  <Field label="Full name">
                    <input value={profile.name} onChange={e => update('name', e.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Title / role">
                    <input value={profile.title} onChange={e => update('title', e.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Email">
                    <input value={profile.email} onChange={e => update('email', e.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Mobile">
                    <input value={profile.phone} onChange={e => update('phone', e.target.value)} style={inputStyle} />
                  </Field>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Right: Pharmacy + Code */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <SectionHeader title="Pharmacy details" />
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Pharmacy name">
                <input value={profile.pharmacyName} onChange={e => update('pharmacyName', e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Address">
                <input value={profile.address} onChange={e => update('address', e.target.value)} style={inputStyle} />
              </Field>
              {live ? (
                <Field label="Opening hours">
                  <input value={profile.hours} onChange={e => update('hours', e.target.value)} placeholder="e.g. 8 AM – 10 PM" style={inputStyle} />
                </Field>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Drug licence no.">
                    <input value={profile.license} onChange={e => update('license', e.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="GSTIN">
                    <input value={profile.gstin} onChange={e => update('gstin', e.target.value)} style={inputStyle} />
                  </Field>
                </div>
              )}
            </div>
          </Card>

          {/* Pharmacy code card */}
          <Card style={{ border: `1px solid ${isCodeValid ? C.coral : C.border}`, borderTop: `3px solid ${C.coral}` }}>
            <SectionHeader
              title="Pharmacy code"
              right={<Chip bg={C.coralSoft} color={C.coral} size={10}>PATIENT LINK CODE</Chip>}
            />
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 12, color: C.textMid, marginBottom: 14, lineHeight: 1.6 }}>
                Patients enter this 9-character code in the <strong style={{ color: C.text }}>SaathiPill app → My Pharmacy</strong> to link to your store. All their prescriptions and refills will route to you automatically.
              </div>
              <PharmacyCodeInput value={pharmacyCode} onChange={setPharmacyCode} />
              {isCodeValid && (
                <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                  <Button variant="ghost" size="sm"
                    onClick={() => navigator.clipboard?.writeText(pharmacyCode)}>
                    ⧉ Copy code
                  </Button>
                  {!live && <Button variant="ghost" size="sm">⇩ Download QR card</Button>}
                </div>
              )}
              {live && pharmacyCode !== initialCode() && (
                <div style={{ marginTop: 12, fontSize: 12, color: C.textMid, lineHeight: 1.6 }}>
                  Changing the code is safe — patients already linked move to the new code automatically when you save.
                </div>
              )}

              {/* Counter QR: patients scan → patient app opens → account created/
                  logged in → linked to this pharmacy automatically. */}
              {isCodeValid && <PharmacyJoinQR code={pharmacyCode} pharmacyName={profile.pharmacyName} />}
            </div>
          </Card>

          {/* Restock reminder settings */}
          {live && (
            <Card>
              <SectionHeader title="Restock reminders" right={restock.on ? <Chip bg={C.sageSoft} color={C.sage} size={10}>ON</Chip> : <Chip bg={C.creamWarm} color={C.textMuted} size={10}>OFF</Chip>} />
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: restock.on ? 16 : 0 }}>
                  <div style={{ fontSize: 26 }}>📦</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Daily low-stock alert</div>
                    <div style={{ fontSize: 12, color: C.textMid, marginTop: 2, lineHeight: 1.5 }}>
                      One consolidated reminder per day listing items whose stock won't cover the coming days of demand (learned from your real sales).
                    </div>
                  </div>
                  <button onClick={() => setRestock(r => ({ ...r, on: !r.on }))} style={{
                    width: 52, height: 28, borderRadius: 14, border: 'none', flexShrink: 0, cursor: 'pointer',
                    background: restock.on ? C.sage : C.border,
                    display: 'flex', alignItems: 'center', padding: '0 4px',
                    justifyContent: restock.on ? 'flex-end' : 'flex-start', transition: 'background 0.2s',
                  }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff' }} />
                  </button>
                </div>
                {restock.on && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Send the alert at">
                      <select value={restock.hour} onChange={e => setRestock(r => ({ ...r, hour: parseInt(e.target.value, 10) }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                        {[6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map(h => (
                          <option key={h} value={h}>{(h % 12 || 12)}:00 {h >= 12 ? 'PM' : 'AM'}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Alert when stock won't cover">
                      <select value={restock.days} onChange={e => setRestock(r => ({ ...r, days: parseInt(e.target.value, 10) }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                        {[3,5,7,10,14].map(d => <option key={d} value={d}>{d} days of demand</option>)}
                      </select>
                    </Field>
                  </div>
                )}
                {restock.on && (
                  <div style={{ marginTop: 12, fontSize: 11.5, color: C.textMuted, lineHeight: 1.5 }}>
                    Delivered as a desktop notification + in the notification bell, from {(restock.hour % 12 || 12)}:00 {restock.hour >= 12 ? 'PM' : 'AM'} onwards. Remember to press <strong style={{ color: C.text }}>Save changes</strong>.
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Desktop notifications (Web Push) */}
          {live && (
            <Card>
              <SectionHeader title="Desktop notifications" right={pushOn ? <Chip bg={C.sageSoft} color={C.sage} size={10}>ON</Chip> : null} />
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ fontSize: 26 }}>🔔</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Restock reminders & new-order alerts</div>
                    <div style={{ fontSize: 12, color: C.textMid, marginTop: 2, lineHeight: 1.5 }}>
                      {pushSupported
                        ? (pushOn ? 'Notifications appear on this computer even when the portal tab is closed.' : 'Get notified on this computer even when the portal tab is closed.')
                        : 'Not supported on this browser.'}
                    </div>
                  </div>
                  {pushSupported && (
                    <button onClick={togglePush} disabled={pushBusy} style={{
                      width: 52, height: 28, borderRadius: 14, border: 'none', flexShrink: 0,
                      cursor: pushBusy ? 'default' : 'pointer',
                      background: pushOn ? C.sage : C.border,
                      display: 'flex', alignItems: 'center', padding: '0 4px',
                      justifyContent: pushOn ? 'flex-end' : 'flex-start',
                      opacity: pushBusy ? 0.6 : 1, transition: 'background 0.2s',
                    }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff' }} />
                    </button>
                  )}
                </div>
                {pushMsg && <div style={{ marginTop: 10, fontSize: 12, color: C.textMid, lineHeight: 1.5 }}>{pushMsg}</div>}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Counter QR code: scan → patient app → account auto-linked to this pharmacy ──
function PharmacyJoinQR({ code, pharmacyName }) {
  const boxRef = React.useRef(null);
  const cfg = window.SAATHIPILL_CONFIG || {};
  const joinUrl = (cfg.patientAppUrl || 'http://localhost:5173')
    + '/?join=' + encodeURIComponent(code)
    + '&pharmacy=' + encodeURIComponent(pharmacyName || '');
  const qrAvailable = typeof QRCode !== 'undefined';

  React.useEffect(() => {
    if (!qrAvailable || !boxRef.current) return;
    boxRef.current.innerHTML = '';
    new QRCode(boxRef.current, { text: joinUrl, width: 168, height: 168, correctLevel: QRCode.CorrectLevel.M });
  }, [joinUrl, qrAvailable]);

  const download = () => {
    const canvas = boxRef.current && boxRef.current.querySelector('canvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'saathipill-join-' + code + '.png';
    a.click();
  };

  return (
    <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${C.borderSoft}` }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>📱 Counter QR — patients scan to join</div>
      <div style={{ fontSize: 12, color: C.textMid, lineHeight: 1.6, marginBottom: 12 }}>
        Print this at your counter. Scanning opens the SaathiPill app, sets up the patient's account
        and links them to <strong style={{ color: C.text }}>{pharmacyName || 'your pharmacy'}</strong> automatically — no code typing.
      </div>
      {qrAvailable ? (
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ padding: 10, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, display: 'inline-block' }}>
            <div ref={boxRef} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Button variant="coral" size="md" icon={<span>⇩</span>} onClick={download}>Download QR (PNG)</Button>
            <Button variant="ghost" size="md" onClick={() => { navigator.clipboard && navigator.clipboard.writeText(joinUrl); }}>⧉ Copy join link</Button>
            <div style={{ fontSize: 11, color: C.textMuted, maxWidth: 240, lineHeight: 1.5, wordBreak: 'break-all' }}>{joinUrl}</div>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: C.textMuted }}>QR generator couldn't load (offline?) — share this link instead: <span style={{ wordBreak: 'break-all', color: C.text }}>{joinUrl}</span></div>
      )}
    </div>
  );
}

// ── PHARMACY PARTNER SCREEN ──
function PharmacyPartnerScreen() {
  // Live mode: the code shown is the real one, editing it goes through the
  // backend (which also migrates existing patient links), and demo-only
  // extras (branch codes, made-up link stats) are hidden.
  const live = window.PortalAPI && PortalAPI.enabled;
  const [primaryCode, setPrimaryCode] = useState(
    () => (localStorage.getItem('sp_pharmacy_code') || 'SHRM-74219')
  );
  const [editingPrimary, setEditingPrimary] = useState(false);
  const [draftCode, setDraftCode] = useState('');
  const [saveErr, setSaveErr] = useState(null);
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState(live ? [] : [
    { id: 1, name: 'Borivali Branch', code: 'BORV-90012', patients: 34, active: true },
    { id: 2, name: 'Goregaon Branch', code: 'GORE-45678', patients: 18, active: true },
  ]);
  const [addingBranch, setAddingBranch] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: '', code: '' });
  const [copied, setCopied] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const isDraftValid = /^[A-Z0-9]{4}-[A-Z0-9]{5}$/.test(draftCode);
  const isNewBranchValid = newBranch.name.trim().length > 0 && /^[A-Z0-9]{4}-[A-Z0-9]{5}$/.test(newBranch.code);

  const copyCode = (code, id) => {
    navigator.clipboard?.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  const savePrimary = () => {
    if (!isDraftValid || saving) return;
    const apply = () => {
      setPrimaryCode(draftCode);
      localStorage.setItem('sp_pharmacy_code', draftCode);
      if (window.PHARMACY) window.PHARMACY.code = draftCode;
      setEditingPrimary(false);
      setSuccessMsg('Primary code updated — existing patient links moved over');
      setTimeout(() => setSuccessMsg(null), 2400);
    };
    if (live) {
      setSaving(true); setSaveErr(null);
      PortalAPI.updatePharmacy({ code: draftCode })
        .then(() => { setSaving(false); apply(); })
        .catch((e) => { setSaving(false); setSaveErr(e.message || 'Could not update the code'); });
    } else {
      apply();
    }
  };

  const addBranch = () => {
    if (!isNewBranchValid) return;
    setBranches(b => [...b, { id: Date.now(), name: newBranch.name, code: newBranch.code, patients: 0, active: true }]);
    setNewBranch({ name: '', code: '' });
    setAddingBranch(false);
    setSuccessMsg('Branch code added');
    setTimeout(() => setSuccessMsg(null), 2400);
  };

  const removeBranch = (id) => setBranches(b => b.filter(br => br.id !== id));

  return (
    <div>
      <PageHeader
        title="Pharmacy partner codes"
        subtitle="Manage the codes patients use to link to your pharmacy in the SaathiPill app"
        right={!live && (
          <Button variant="coral" size="md" icon={<span style={{ fontSize: 16 }}>+</span>}
            onClick={() => { setAddingBranch(true); }}>
            Add branch code
          </Button>
        )}
      />

      <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Primary code */}
        <Card style={{ borderTop: `3px solid ${C.coral}` }}>
          <SectionHeader
            title="Primary code"
            subtitle={live
              ? ((window.PHARMACY && (window.PHARMACY.name + (window.PHARMACY.location ? ' — ' + window.PHARMACY.location : ''))) || 'Your pharmacy')
              : 'Main branch — Andheri West'}
            right={<Chip bg={C.coralSoft} color={C.coral} size={10}>PRIMARY</Chip>}
          />
          <div style={{ padding: '24px' }}>
            {editingPrimary ? (
              <div style={{ maxWidth: 520 }}>
                <div style={{ fontSize: 12, color: C.textMid, marginBottom: 14, lineHeight: 1.6 }}>
                  Existing linked patients stay connected — their link moves to the new code automatically.
                </div>
                <PharmacyCodeInput value={draftCode} onChange={setDraftCode} />
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <Button variant="coral" size="md" disabled={!isDraftValid || saving} onClick={savePrimary}>
                    {saving ? 'Saving…' : 'Save new code'}
                  </Button>
                  <Button variant="ghost" size="md" onClick={() => { setEditingPrimary(false); setSaveErr(null); }}>Cancel</Button>
                </div>
                {saveErr && (
                  <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: C.red || '#C0392B' }}>
                    {saveErr}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textMid, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                    Current code
                  </div>
                  <div style={{ fontSize: 44, fontWeight: 800, color: C.coral, fontFamily: fonts.mono, letterSpacing: '0.1em', lineHeight: 1 }}>
                    {primaryCode}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <Button variant="ghost" size="sm" icon={<span>✎</span>}
                      onClick={() => { setDraftCode(primaryCode); setEditingPrimary(true); }}>
                      Change code
                    </Button>
                    <button onClick={() => copyCode(primaryCode, 'primary')} style={{
                      padding: '6px 12px', borderRadius: 4,
                      border: `1px solid ${copied === 'primary' ? C.sage : C.coral}`,
                      background: copied === 'primary' ? C.sageSoft : C.coralSoft,
                      color: copied === 'primary' ? C.sage : C.coral,
                      fontFamily: fonts.body, fontSize: 11, fontWeight: 700,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>{copied === 'primary' ? '✓ Copied!' : '⧉ Copy code'}</button>
                    {!live && <Button variant="ghost" size="sm">⇩ QR card</Button>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 0, borderLeft: `1px solid ${C.border}`, paddingLeft: 32 }}>
                  {live ? (
                    <>
                      <CodeStat label="Patients linked" value={(window.PORTAL_DASHBOARD && window.PORTAL_DASHBOARD.patientCount) || 0} color={C.navy} />
                      <div style={{ width: 1, background: C.border, margin: '0 24px' }} />
                      <CodeStat label="New this week" value={(window.PORTAL_DASHBOARD && window.PORTAL_DASHBOARD.newThisWeek) || 0} color={C.sage} />
                    </>
                  ) : (
                    <>
                      <CodeStat label="Patients linked" value={213} color={C.navy} />
                      <div style={{ width: 1, background: C.border, margin: '0 24px' }} />
                      <CodeStat label="Linked this month" value={4} color={C.sage} />
                      <div style={{ width: 1, background: C.border, margin: '0 24px' }} />
                      <CodeStat label="Pending links" value={2} color={C.amber} />
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* How it works */}
          <div style={{ margin: '0 24px 24px', padding: '14px 18px', background: C.creamWarm, borderRadius: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textMid, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
              How patients link using this code
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { n: '1', label: 'Share the code', detail: 'Hand it out at the counter, print on receipts, or send via SMS' },
                { n: '2', label: 'Patient enters code', detail: 'SaathiPill app → Settings → My Pharmacy → Enter 9-char code' },
                { n: '3', label: 'Instant sync', detail: 'Prescriptions, reminders and refills auto-route to your pharmacy' },
              ].map(s => (
                <div key={s.n} style={{ display: 'flex', gap: 10 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 11, background: C.coral, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 1,
                  }}>{s.n}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: C.textMid, marginTop: 2, lineHeight: 1.5 }}>{s.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Branch codes — demo-only until multi-branch exists in the backend */}
        {!live && <Card>
          <SectionHeader
            title="Branch codes"
            count={branches.length}
            subtitle="Each branch can have its own code to route patients to the right location"
          />

          {branches.length === 0 && !addingBranch && (
            <div style={{ padding: '36px 24px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
              No branch codes yet. Add one to manage patients across multiple locations.
            </div>
          )}

          {branches.map(branch => (
            <BranchCodeRow key={branch.id} branch={branch}
              copied={copied === branch.id}
              onCopy={() => copyCode(branch.code, branch.id)}
              onRemove={() => removeBranch(branch.id)}
            />
          ))}

          {/* Add branch form */}
          {addingBranch ? (
            <div style={{ padding: '20px 24px', borderTop: branches.length > 0 ? `1px solid ${C.borderSoft}` : 'none', background: C.cream }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 16 }}>New branch code</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16, marginBottom: 16 }}>
                <Field label="Branch name">
                  <input
                    value={newBranch.name}
                    onChange={e => setNewBranch(b => ({ ...b, name: e.target.value }))}
                    placeholder="e.g. Bandra Branch"
                    style={inputStyle}
                    autoFocus
                  />
                </Field>
                <Field label="Pharmacy code (9 characters)">
                  <PharmacyCodeInput
                    value={newBranch.code}
                    onChange={code => setNewBranch(b => ({ ...b, code }))}
                  />
                </Field>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="coral" size="md" disabled={!isNewBranchValid} onClick={addBranch}>
                  Add branch
                </Button>
                <Button variant="ghost" size="md" onClick={() => { setAddingBranch(false); setNewBranch({ name: '', code: '' }); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '12px 24px', borderTop: branches.length > 0 ? `1px solid ${C.borderSoft}` : 'none' }}>
              <button onClick={() => setAddingBranch(true)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', border: `1px dashed ${C.border}`, borderRadius: 6,
                background: 'transparent', cursor: 'pointer',
                fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: C.textMid,
              }}>
                <span style={{ fontSize: 16, color: C.coral, lineHeight: 1 }}>+</span>
                Add branch code
              </button>
            </div>
          )}
        </Card>}

        {/* Code format rules */}
        <Card>
          <SectionHeader title="Code format & rules" />
          <div style={{ padding: '16px 24px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {[
              { q: 'Format', a: '9 alphanumeric characters with a dash at position 5 — e.g. SHRM-74219. Letters (A–Z) and digits (0–9) only.' },
              { q: 'Uniqueness', a: 'Codes must be globally unique across all pharmacies. The app will reject a duplicate when a patient tries to link.' },
              { q: 'Changing your code', a: 'Already-linked patients stay connected — their saved link is moved to the new code automatically.' },
              { q: 'Multiple pharmacies', a: 'A patient can link more than one pharmacy and choose where each refill goes. Your code adds you to their list.' },
            ].map(item => (
              <div key={item.q} style={{ padding: '12px 14px', background: C.cream, borderRadius: 6, border: `1px solid ${C.borderSoft}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 4 }}>{item.q}</div>
                <div style={{ fontSize: 12, color: C.textMid, lineHeight: 1.6 }}>{item.a}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {successMsg && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: C.sage, color: '#fff',
          padding: '12px 20px', borderRadius: 8,
          fontFamily: fonts.body, fontSize: 13, fontWeight: 600,
          boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
          zIndex: 200, display: 'flex', alignItems: 'center', gap: 8,
          animation: 'toastIn 0.28s cubic-bezier(0.34,1.56,0.64,1)',
        }}>✓ {successMsg}</div>
      )}
    </div>
  );
}

function BranchCodeRow({ branch, copied, onCopy, onRemove }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '16px 24px', borderBottom: `1px solid ${C.borderSoft}`,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 8,
        background: C.navySoft, color: C.navy,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 800, flexShrink: 0,
      }}>B</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{branch.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
          <span style={{ fontFamily: fonts.mono, fontSize: 15, fontWeight: 800, color: C.navy, letterSpacing: '0.08em' }}>
            {branch.code}
          </span>
          <span style={{ fontSize: 11, color: C.textMuted }}>·</span>
          <span style={{ fontSize: 12, color: C.textMid, fontWeight: 500 }}>{branch.patients} patients linked</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
        <Chip bg={C.sageSoft} color={C.sage} size={10}>ACTIVE</Chip>
        <button onClick={onCopy} style={{
          padding: '5px 10px', borderRadius: 4,
          border: `1px solid ${copied ? C.sage : C.border}`,
          background: copied ? C.sageSoft : C.white,
          color: copied ? C.sage : C.textMid,
          fontFamily: fonts.body, fontSize: 11, fontWeight: 700, cursor: 'pointer',
          transition: 'all 0.15s',
        }}>{copied ? '✓ Copied' : '⧉ Copy'}</button>
        {confirm ? (
          <div style={{ display: 'flex', gap: 5 }}>
            <button onClick={onRemove} style={{
              padding: '5px 10px', borderRadius: 4,
              border: `1px solid ${C.red}`, background: C.redSoft,
              color: C.red, fontFamily: fonts.body, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}>Confirm remove</button>
            <button onClick={() => setConfirm(false)} style={{
              padding: '5px 10px', borderRadius: 4,
              border: `1px solid ${C.border}`, background: C.white,
              color: C.textMid, fontFamily: fonts.body, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}>Cancel</button>
          </div>
        ) : (
          <button onClick={() => setConfirm(true)} style={{
            padding: '5px 10px', borderRadius: 4,
            border: `1px solid ${C.border}`, background: C.white,
            color: C.textMuted, fontFamily: fonts.body, fontSize: 11, fontWeight: 700, cursor: 'pointer',
          }}>Remove</button>
        )}
      </div>
    </div>
  );
}

function CodeStat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 30, fontWeight: 800, color, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.textMid, fontWeight: 600, marginTop: 4, whiteSpace: 'nowrap' }}>{label}</div>
    </div>
  );
}

// ── OFFERS & PROMOTIONS SCREEN ──
const OFFER_STORAGE_KEY = 'sp_active_offer';

function readActiveOffer() {
  try { return JSON.parse(localStorage.getItem(OFFER_STORAGE_KEY) || 'null'); } catch { return null; }
}

function OffersScreen() {
  const [activeOffer, setActiveOffer] = useState(() => readActiveOffer());
  const [discount, setDiscount] = useState(activeOffer?.discount || 15);
  const [label, setLabel] = useState(activeOffer?.label || '');
  const [expiry, setExpiry] = useState(activeOffer?.expiry ? String(activeOffer.expiry).slice(0, 10) : new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  const [toast, setToast] = useState(null);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  const patientCount = PATIENTS.length;
  const pharmacyCode = localStorage.getItem('sp_pharmacy_code') || 'SHRM-74219';
  const pharmacyName = (window.PHARMACY && window.PHARMACY.name) || 'your pharmacy';
  const apiOn = window.PortalAPI && PortalAPI.enabled;
  const [activeOfferId, setActiveOfferId] = useState(activeOffer?.id || null);
  const [OFFER_HISTORY, setHistory] = useState([]);

  // Load offers (active + past) from the backend — no hardcoded history.
  useEffect(() => {
    if (!apiOn) return;
    PortalAPI.offers().then(list => {
      const live = (list || []).find(o => o.active);
      if (live) {
        const cached = { id: live.id, active: true, discount: live.discount, label: live.label, expiry: live.expiry, reach: live.reach, pharmacyCode };
        localStorage.setItem(OFFER_STORAGE_KEY, JSON.stringify(cached));
        setActiveOffer(cached); setActiveOfferId(live.id);
        setDiscount(live.discount); setLabel(live.label); if (live.expiry) setExpiry(String(live.expiry).slice(0, 10));
      }
      setHistory((list || []).filter(o => !o.active).map(o => ({
        label: o.label, discount: o.discount,
        from: o.createdAt ? String(o.createdAt).slice(0, 10) : '', to: o.expiry ? String(o.expiry).slice(0, 10) : '',
        reach: o.reach || 0, orders: 0,
      })));
    }).catch(() => {});
  }, []);

  const showToast = (msg, kind = 'success') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2800);
  };

  const activateOffer = () => {
    if (!label.trim()) { showToast('Please enter an offer label', 'error'); return; }
    if (discount <= 0 || discount > 70) { showToast('Discount must be between 1% and 70%', 'error'); return; }
    const offer = {
      active: true,
      discount,
      label: label.trim(),
      expiry,
      createdAt: new Date().toISOString(),
      pharmacy: pharmacyName,
      pharmacyCode,
      reach: patientCount,
    };
    const commit = (id) => {
      if (id) { offer.id = id; setActiveOfferId(id); }
      localStorage.setItem(OFFER_STORAGE_KEY, JSON.stringify(offer));
      window.dispatchEvent(new CustomEvent('sp_offer_changed'));
      setActiveOffer(offer);
      showToast(`Offer activated — notified ${patientCount} patients!`, 'success');
    };
    if (apiOn) {
      PortalAPI.createOffer({ label: offer.label, discount, reach: patientCount, expiry: expiry || undefined })
        .then(created => commit(created.id)).catch(e => showToast(e.message || 'Could not activate', 'error'));
    } else { commit(null); }
  };

  const deactivateOffer = () => {
    if (apiOn && activeOfferId) PortalAPI.updateOffer(activeOfferId, { active: false }).catch(() => {});
    localStorage.removeItem(OFFER_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('sp_offer_changed'));
    setActiveOffer(null);
    setActiveOfferId(null);
    setShowDeactivateConfirm(false);
    showToast('Offer deactivated', 'info');
  };

  const previewItems = INVENTORY.slice(0, 5);
  const discountedPrice = (mrp) => (mrp * (1 - discount / 100)).toFixed(2);

  return (
    <div>
      <PageHeader
        title="Offers & Promotions"
        subtitle={`Broadcast discounts to all ${patientCount} linked patients · They see it instantly in SaathiPill`}
        right={
          activeOffer ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Chip bg={C.sageSoft} color={C.sage} size={11}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.sage, marginRight: 6, animation: 'pulseDot 1.6s ease-in-out infinite', display: 'inline-block' }} />
                OFFER LIVE
              </Chip>
              <Button variant="danger" size="md" onClick={() => setShowDeactivateConfirm(true)}>Deactivate</Button>
            </div>
          ) : null
        }
      />

      <div style={{ padding: '0 24px 24px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Active offer card */}
          {activeOffer && (
            <div style={{
              borderRadius: 10, overflow: 'hidden',
              border: `2px solid ${C.sage}`,
              background: `linear-gradient(135deg, ${C.navyDeep} 0%, #1B3A6B 100%)`,
            }}>
              <div style={{ padding: '18px 22px 16px', position: 'relative', overflow: 'hidden' }}>
                {/* Big % watermark */}
                <div style={{
                  position: 'absolute', right: -8, top: -16,
                  fontSize: 100, fontWeight: 900, color: 'rgba(255,255,255,0.04)',
                  letterSpacing: '-0.04em', lineHeight: 1, userSelect: 'none',
                }}>%</div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Active Offer</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{activeOffer.label}</div>
                  </div>
                  <Chip bg="rgba(91,123,95,0.3)" color="#8EC892" size={10} style={{ letterSpacing: '0.06em' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8EC892', marginRight: 5, animation: 'pulseDot 1.6s ease-in-out infinite', display: 'inline-block' }} />
                    LIVE NOW
                  </Chip>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 64, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>{activeOffer.discount}%</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>OFF</span>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>on all medicines</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {[
                    { label: 'Patients notified', value: activeOffer.reach },
                    { label: 'Expires', value: fmtDate(activeOffer.expiry) },
                    { label: 'Pharmacy code', value: activeOffer.pharmacyCode },
                  ].map((s, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ padding: '12px 22px', background: 'rgba(0,0,0,0.25)', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
                Created {new Date(activeOffer.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · Visible to all patients in SaathiPill app
              </div>
            </div>
          )}

          {/* Create / Edit offer */}
          <Card>
            <SectionHeader title={activeOffer ? 'Update offer' : 'Create new offer'} subtitle={activeOffer ? 'Changes go live immediately' : 'Goes live to all linked patients instantly'} />
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Discount slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textMid, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Flat discount</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 32, fontWeight: 900, color: C.coral, letterSpacing: '-0.03em' }}>{discount}</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: C.coral }}>%</span>
                    <span style={{ fontSize: 12, color: C.textMid, marginLeft: 4 }}>off all medicines</span>
                  </div>
                </div>
                <input
                  type="range" min={1} max={70} step={1} value={discount}
                  onChange={e => setDiscount(+e.target.value)}
                  style={{ width: '100%', accentColor: C.coral, cursor: 'pointer', height: 6 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.textMuted, fontWeight: 600, marginTop: 4 }}>
                  <span>1%</span><span>35%</span><span>70%</span>
                </div>
                {/* Quick presets */}
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  {[5, 10, 15, 20, 25, 30].map(v => (
                    <button key={v} onClick={() => setDiscount(v)} style={{
                      padding: '5px 12px', borderRadius: 5,
                      border: `1px solid ${discount === v ? C.coral : C.border}`,
                      background: discount === v ? C.coralSoft : C.white,
                      color: discount === v ? C.coral : C.textMid,
                      fontFamily: fonts.body, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}>{v}%</button>
                  ))}
                </div>
              </div>

              {/* Label */}
              <Field label="Offer label">
                <input
                  value={label} onChange={e => setLabel(e.target.value)}
                  placeholder="e.g. Eid Special, Independence Day Sale…"
                  style={{ ...inputStyle, flex: 1 }}
                />
              </Field>

              {/* Expiry */}
              <Field label="Valid until">
                <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }} />
              </Field>

              {/* Reach estimate */}
              <div style={{ padding: '12px 14px', background: C.navySoft, borderRadius: 6, display: 'flex', gap: 16 }}>
                {[
                  { label: 'Patients reached', value: patientCount },
                  { label: 'Avg saving / patient', value: '₹' + Math.round(450 * discount / 100) + '/mo' },
                  { label: 'Estimated extra orders', value: '+' + Math.round(patientCount * 0.18 * (discount / 10)) },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, textAlign: i === 1 ? 'center' : i === 2 ? 'right' : 'left' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.textMid, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{s.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.navy, marginTop: 2 }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <Button
                variant="coral" size="lg" full
                icon={<span style={{ fontSize: 16 }}>📢</span>}
                onClick={activateOffer}
              >
                {activeOffer ? `Update offer — notify ${patientCount} patients` : `Activate offer — notify ${patientCount} patients`}
              </Button>

              {activeOffer && (
                <div style={{ textAlign: 'center', fontSize: 12, color: C.textMid }}>
                  Or{' '}
                  <button onClick={() => setShowDeactivateConfirm(true)} style={{ background: 'none', border: 'none', color: C.red, fontWeight: 700, cursor: 'pointer', fontFamily: fonts.body, fontSize: 12 }}>
                    deactivate the current offer
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Live price preview */}
          <Card>
            <SectionHeader title="Price preview" subtitle={`at ${discount}% off`} />
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: C.cream }}>
                  <Th style={{ width: '55%' }}>Medicine</Th>
                  <Th align="right">MRP</Th>
                  <Th align="right">After offer</Th>
                </tr>
              </thead>
              <tbody>
                {previewItems.map(item => (
                  <tr key={item.name}>
                    <Td>
                      <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>{item.supplier}</div>
                    </Td>
                    <Td align="right">
                      <span style={{ fontWeight: 600, color: C.textMid, textDecoration: 'line-through', fontSize: 12 }}>
                        {inr(item.mrp, { decimals: 2 })}
                      </span>
                    </Td>
                    <Td align="right">
                      <span style={{ fontWeight: 800, color: C.sage, fontSize: 13 }}>
                        {inr(+discountedPrice(item.mrp), { decimals: 2 })}
                      </span>
                      <div style={{ fontSize: 10, color: C.sage, fontWeight: 600 }}>−{discount}%</div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '10px 18px', background: C.cream, borderTop: `1px solid ${C.borderSoft}`, fontSize: 11, color: C.textMuted, fontWeight: 500 }}>
              Showing 5 of {INVENTORY.length} SKUs · All inventory prices update instantly
            </div>
          </Card>

          {/* How it works */}
          <Card>
            <SectionHeader title="How it works" />
            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { step: '1', color: C.coral, title: 'Set & activate', desc: 'Choose your discount %, label and expiry date. Hit Activate.' },
                { step: '2', color: C.navy, title: 'Instant push to patients', desc: 'A notification banner appears on the Refills tab of all linked patients in SaathiPill.' },
                { step: '3', color: C.sage, title: 'Prices update automatically', desc: 'Your inventory view and all refill order totals reflect the discounted pricing.' },
                { step: '4', color: C.amber, title: 'Deactivate any time', desc: 'The banner disappears for patients immediately when you deactivate.' },
              ].map(s => (
                <div key={s.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: s.color,
                    color: '#fff', fontSize: 12, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>{s.step}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: C.textMid, marginTop: 2, lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Offer history */}
          <Card>
            <SectionHeader title="Past offers" count={OFFER_HISTORY.length} />
            <div>
              {OFFER_HISTORY.map((h, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 18px', borderBottom: i < OFFER_HISTORY.length - 1 ? `1px solid ${C.divider}` : 'none',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: C.coralSoft, color: C.coral,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 900, flexShrink: 0,
                  }}>{h.discount}%</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{h.label}</div>
                    <div style={{ fontSize: 11, color: C.textMid, marginTop: 2 }}>{fmtDate(h.from)} → {fmtDate(h.to)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>{h.orders} orders</div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{h.reach} reached</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Deactivate confirm dialog */}
      {showDeactivateConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 110,
          background: 'rgba(15,27,45,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }} onClick={() => setShowDeactivateConfirm(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: 420, background: C.white, borderRadius: 10, border: `1px solid ${C.border}`,
            boxShadow: '0 24px 48px rgba(15,27,45,0.18)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: C.navy, margin: 0 }}>Deactivate offer?</h2>
              <div style={{ fontSize: 13, color: C.textMid, marginTop: 6 }}>
                The banner will disappear for all {patientCount} linked patients immediately. You can re-activate any time.
              </div>
            </div>
            <div style={{ padding: '14px 24px', display: 'flex', justifyContent: 'flex-end', gap: 8, background: C.cream }}>
              <Button variant="ghost" onClick={() => setShowDeactivateConfirm(false)}>Cancel</Button>
              <Button variant="danger" onClick={deactivateOffer}>Yes, deactivate</Button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: toast.kind === 'success' ? C.sage : toast.kind === 'error' ? C.red : C.navy,
          color: '#fff', padding: '12px 20px', borderRadius: 8,
          fontFamily: fonts.body, fontSize: 13, fontWeight: 600,
          boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
          zIndex: 200, display: 'flex', alignItems: 'center', gap: 8,
          animation: 'toastIn 0.28s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <span>{toast.kind === 'success' ? '✓' : toast.kind === 'error' ? '✕' : 'i'}</span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

Object.assign(window, {
  PatientsScreen, PatientDetailScreen, RefillsScreen, InventoryScreen, AnalyticsScreen,
  ProfileSetupScreen, PharmacyPartnerScreen, PharmacyCodeInput,
  OffersScreen, readActiveOffer, OFFER_STORAGE_KEY,
});
