// ── SaathiPill Pharmacy Portal — Shared primitives + Dashboard ──

const { useState, useMemo, useEffect, useRef } = React;

// ── Avatar ──
function Avatar({ patient, size = 36 }) {
  const c = avatarColors(patient.id);
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      background: c.bg, color: c.fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: fonts.body, fontWeight: 700, fontSize: size * 0.38,
      flexShrink: 0, letterSpacing: '0.02em',
    }}>
      {initials(patient.name)}
    </div>
  );
}

// ── Chip ──
function Chip({ children, bg, color, weight = 600, size = 11, style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 8px', borderRadius: 4,
      background: bg, color,
      fontFamily: fonts.body, fontSize: size, fontWeight: weight,
      letterSpacing: '0.02em', lineHeight: 1.4,
      ...style,
    }}>{children}</span>
  );
}

// ── ConditionChips ──
function ConditionChips({ conditions, size = 11 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
      {conditions.map(c => {
        const col = CONDITION_COLOR[c] || { bg: '#F0ECE2', text: '#4A5468' };
        return <Chip key={c} bg={col.bg} color={col.text} size={size}>{c}</Chip>;
      })}
    </span>
  );
}

// ── Button ──
function Button({ children, variant = 'primary', size = 'md', onClick, icon, full, style, disabled }) {
  const variants = {
    primary: { bg: C.navy, color: '#fff', border: C.navy, hoverBg: C.navyDeep },
    coral: { bg: C.coral, color: '#fff', border: C.coral, hoverBg: '#C6633D' },
    ghost: { bg: 'transparent', color: C.text, border: C.border, hoverBg: C.creamWarm },
    danger: { bg: C.red, color: '#fff', border: C.red, hoverBg: '#A32D20' },
    success: { bg: C.sage, color: '#fff', border: C.sage, hoverBg: '#456348' },
    soft: { bg: C.creamWarm, color: C.text, border: C.borderSoft, hoverBg: '#EBE5D6' },
  };
  const sizes = {
    sm: { padding: '6px 12px', fontSize: 12, height: 30 },
    md: { padding: '8px 14px', fontSize: 13, height: 36 },
    lg: { padding: '10px 18px', fontSize: 14, height: 42 },
  };
  const v = variants[variant];
  const s = sizes[size];
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: s.padding, height: s.height,
        background: disabled ? '#F0ECE2' : (hover ? v.hoverBg : v.bg),
        color: disabled ? C.textMuted : v.color,
        border: `1px solid ${disabled ? C.border : (hover ? v.hoverBg : v.border)}`,
        borderRadius: 6,
        fontFamily: fonts.body, fontSize: s.fontSize, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.12s',
        width: full ? '100%' : 'auto',
        letterSpacing: '0.01em',
        ...style,
      }}
    >
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </button>
  );
}

// ── Card wrapper ──
function Card({ children, style, padding = 0 }) {
  return (
    <div style={{
      background: C.white, border: `1px solid ${C.border}`,
      borderRadius: 8, padding,
      ...style,
    }}>{children}</div>
  );
}

// ── Stat card ──
function StatCard({ label, value, sub, accent, badge, trend, trendDir, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left', background: C.white,
        border: `1px solid ${accent === 'red' ? C.red : C.border}`,
        borderTop: accent === 'red' ? `3px solid ${C.red}` : `3px solid ${accent === 'coral' ? C.coral : accent === 'navy' ? C.navy : accent === 'sage' ? C.sage : C.navy}`,
        borderRadius: 8,
        padding: '16px 18px',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        transition: 'all 0.15s',
        fontFamily: fonts.body,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </span>
        {badge && (
          <span style={{
            padding: '2px 7px', borderRadius: 10, background: C.red, color: '#fff',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
          }}>{badge}</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 36, fontWeight: 800, color: C.navy, letterSpacing: '-0.02em', lineHeight: 1 }}>
          {value}
        </span>
        {trend && (
          <span style={{
            fontSize: 13, fontWeight: 700,
            color: trendDir === 'up' ? C.sage : C.red,
            display: 'inline-flex', alignItems: 'center', gap: 2,
          }}>
            <span style={{ fontSize: 11 }}>{trendDir === 'up' ? '▲' : '▼'}</span>
            {trend}
          </span>
        )}
      </div>
      {sub && (
        <div style={{ marginTop: 8, fontSize: 13, color: C.textMid, fontWeight: 500 }}>{sub}</div>
      )}
    </button>
  );
}

// ── Section header (used inside cards) ──
function SectionHeader({ title, subtitle, right, count }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 18px', borderBottom: `1px solid ${C.borderSoft}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <h3 style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 700, color: C.navy, margin: 0, letterSpacing: '-0.005em' }}>
          {title}
        </h3>
        {count != null && (
          <span style={{
            padding: '1px 7px', borderRadius: 10, background: C.creamWarm,
            color: C.textMid, fontSize: 11, fontWeight: 700, fontFamily: fonts.body,
          }}>{count}</span>
        )}
        {subtitle && (
          <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>{subtitle}</span>
        )}
      </div>
      {right}
    </div>
  );
}

// ── Urgent attention list row ──
function UrgentRow({ item, patient, onView, onAction }) {
  const tagColors = {
    red: { bg: C.redSoft, text: C.red, dot: C.red },
    amber: { bg: C.amberSoft, text: '#7A5816', dot: C.amber },
    navy: { bg: C.navySoft, text: C.navy, dot: C.navy },
  };
  const tc = tagColors[item.tagColor];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 18px',
      borderBottom: `1px solid ${C.borderSoft}`,
      background: item.tagColor === 'red' ? '#FDF7F5' : C.white,
      position: 'relative',
    }}>
      {item.tagColor === 'red' && (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: C.red }} />
      )}
      <Avatar patient={patient} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontFamily: fonts.body, fontWeight: 700, fontSize: 14, color: C.text }}>{patient.name}</span>
          <span style={{ fontSize: 12, color: C.textMuted }}>· {patient.age}</span>
          <ConditionChips conditions={patient.conditions.slice(0, 2)} />
          <Chip bg={tc.bg} color={tc.text} size={10} style={{ letterSpacing: '0.06em' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: tc.dot, marginRight: 5, display: 'inline-block' }} />
            {item.tag}
          </Chip>
        </div>
        <div style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 2 }}>{item.title}</div>
        <div style={{ fontSize: 12, color: C.textMid }}>{item.detail}</div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <Button variant="ghost" size="sm" onClick={() => onView(patient)}>View</Button>
        <Button variant={item.tagColor === 'red' ? 'danger' : 'primary'} size="sm" onClick={() => onAction(item, patient)}>
          {item.action}
        </Button>
      </div>
    </div>
  );
}

// ── Activity feed row ──
function ActivityRow({ event }) {
  const kindMap = {
    confirmed: { bg: C.sageSoft, fg: C.sage },
    'ran-out': { bg: C.redSoft, fg: C.red },
    new: { bg: C.navySoft, fg: C.navy },
    order: { bg: C.amberSoft, fg: '#8A6418' },
    ready: { bg: C.sageSoft, fg: C.sage },
    delivered: { bg: C.sageSoft, fg: C.sage },
    sms: { bg: C.coralSoft, fg: C.coral },
    adherence: { bg: C.redSoft, fg: C.red },
  };
  const km = kindMap[event.kind] || { bg: C.creamWarm, fg: C.textMid };
  return (
    <div style={{ display: 'flex', gap: 10, padding: '12px 18px', borderBottom: `1px solid ${C.divider}`, alignItems: 'flex-start' }}>
      <div style={{
        width: 26, height: 26, borderRadius: 4, background: km.bg, color: km.fg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: 13, fontWeight: 700,
      }}>{event.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.4, fontWeight: 500 }}>{event.text}</div>
        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2, fontWeight: 500 }}>{event.time}</div>
      </div>
    </div>
  );
}

// ── 7-day revenue bar chart (SVG) ──
function RevenueBarChart({ data, height = 140 }) {
  const max = Math.max(...data.map(d => d.amount));
  const total = data.reduce((s, d) => s + d.amount, 0);
  const avg = Math.round(total / data.length);
  return (
    <div style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: C.textMid, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Last 7 days</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.navy, marginTop: 2, letterSpacing: '-0.01em' }}>{inr(total)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: C.textMid, fontWeight: 600 }}>Daily avg</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{inr(avg)}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height }}>
        {data.map((d, i) => {
          const h = (d.amount / max) * (height - 28);
          const isLast = i === data.length - 1;
          return (
            <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: C.text, marginBottom: 4,
                fontFamily: fonts.body,
              }}>{inr(d.amount).replace('₹', '₹')}</div>
              <div style={{
                width: '100%', height: h,
                background: isLast ? C.coral : C.navy,
                borderRadius: '3px 3px 0 0',
                opacity: isLast ? 1 : 0.85,
              }} />
              <div style={{ fontSize: 11, color: C.textMid, marginTop: 6, fontWeight: 600 }}>{d.day}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── DASHBOARD SCREEN ──
function DashboardScreen({ onNavigate, onAction }) {
  const urgentItems = URGENT.map(u => ({ item: u, patient: PATIENTS.find(p => p.id === u.patientId) }));
  const redCount = URGENT.filter(u => u.tagColor === 'red').length;

  return (
    <div>
      {/* Page header */}
      <PageHeader
        title="Good afternoon, Dr. Sharma"
        subtitle="Sunday, 11 May 2026 · 1:42 PM · Sharma Medical Store"
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" size="md" icon={<span style={{ fontSize: 14 }}>⇩</span>}>Export day report</Button>
            <Button variant="coral" size="md" icon={<span style={{ fontSize: 16, lineHeight: 0 }}>+</span>} onClick={() => onAction && onAction('new-refill')}>New refill</Button>
          </div>
        }
      />

      {/* Stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, padding: '0 24px' }}>
        <StatCard
          label="Pending refills"
          value="12"
          sub="3 critical · 9 awaiting confirm"
          accent="red"
          badge="3 URGENT"
          onClick={() => onNavigate('refills')}
        />
        <StatCard
          label="Today's orders"
          value="23"
          sub={inr(18400) + ' · 8 home delivery'}
          accent="navy"
          onClick={() => onNavigate('refills')}
        />
        <StatCard
          label="Active patients"
          value="247"
          sub="+1 this week · 12 inactive"
          accent="sage"
          onClick={() => onNavigate('patients')}
        />
        <StatCard
          label="Revenue this month"
          value={inr(342850)}
          sub="May 1 – May 11"
          accent="coral"
          trend="1.9% vs last mo"
          trendDir="up"
          onClick={() => onNavigate('analytics')}
        />
      </div>

      {/* Middle two-column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, padding: '16px 24px 0' }}>
        {/* Urgent attention */}
        <Card>
          <SectionHeader
            title="Urgent attention needed"
            count={URGENT.length}
            right={
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Chip bg={C.redSoft} color={C.red} size={10}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.red, marginRight: 5 }} />
                  {redCount} CRITICAL
                </Chip>
                <button style={{
                  border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, color: C.navy,
                  fontFamily: fonts.body,
                }} onClick={() => onNavigate('patients')}>View all →</button>
              </div>
            }
          />
          <div>
            {urgentItems.map(({ item, patient }) => (
              <UrgentRow
                key={item.id} item={item} patient={patient}
                onView={(p) => onNavigate('patient-detail', p.id)}
                onAction={(it, p) => onAction(it, p)}
              />
            ))}
          </div>
        </Card>

        {/* Activity feed */}
        <Card>
          <SectionHeader
            title="Today's activity"
            subtitle="Live"
            right={
              <Chip bg={C.sageSoft} color={C.sage} size={10}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', background: C.sage, marginRight: 6,
                  animation: 'pulseDot 1.6s ease-in-out infinite',
                }} />
                LIVE
              </Chip>
            }
          />
          <div style={{ maxHeight: 560, overflowY: 'auto' }}>
            {ACTIVITY.map(e => <ActivityRow key={e.id} event={e} />)}
          </div>
        </Card>
      </div>

      {/* Bottom row: revenue chart + at-a-glance numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, padding: '16px 24px 24px' }}>
        <Card>
          <SectionHeader
            title="Revenue — last 7 days"
            right={
              <div style={{ display: 'flex', gap: 4 }}>
                <button style={tabBtn(true)}>7D</button>
                <button style={tabBtn(false)}>30D</button>
                <button style={tabBtn(false)}>3M</button>
                <button style={tabBtn(false)} onClick={() => onNavigate('analytics')}>12M →</button>
              </div>
            }
          />
          <RevenueBarChart data={REV_7DAYS} />
        </Card>

        <Card>
          <SectionHeader title="At a glance" />
          <div style={{ padding: '4px 0' }}>
            <KpiRow label="Avg order value" value={inr(1640)} trend="+₹120" trendDir="up" />
            <KpiRow label="Home deliveries today" value="8 / 23" trend="35%" />
            <KpiRow label="Adherence avg (this mo)" value="79%" trend="-2.4pt" trendDir="down" />
            <KpiRow label="Refill confirmation time" value="14 min" trend="-3 min" trendDir="up" />
            <KpiRow label="At-risk patients" value="9" trend="3 new" trendDir="down" warn />
            <KpiRow label="New patients this week" value="+1" trend="Aarti Verma" last />
          </div>
        </Card>
      </div>
    </div>
  );
}

function tabBtn(active) {
  return {
    padding: '4px 10px', borderRadius: 4,
    border: `1px solid ${active ? C.navy : C.border}`,
    background: active ? C.navy : 'transparent',
    color: active ? '#fff' : C.textMid,
    fontFamily: fonts.body, fontSize: 11, fontWeight: 700,
    cursor: 'pointer', letterSpacing: '0.02em',
  };
}

function KpiRow({ label, value, trend, trendDir, warn, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 18px',
      borderBottom: last ? 'none' : `1px solid ${C.divider}`,
    }}>
      <div>
        <div style={{ fontSize: 12, color: C.textMid, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: warn ? C.red : C.navy, marginTop: 2, letterSpacing: '-0.01em' }}>{value}</div>
      </div>
      {trend && (
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: trendDir === 'up' ? C.sage : trendDir === 'down' ? C.red : C.textMid,
          padding: '3px 7px', borderRadius: 4,
          background: trendDir === 'up' ? C.sageSoft : trendDir === 'down' ? C.redSoft : C.creamWarm,
        }}>
          {trendDir === 'up' ? '▲ ' : trendDir === 'down' ? '▼ ' : ''}{trend}
        </span>
      )}
    </div>
  );
}

// ── Reusable page header ──
function PageHeader({ title, subtitle, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 24px 18px',
    }}>
      <div>
        <h1 style={{
          fontFamily: fonts.body, fontSize: 22, fontWeight: 800, color: C.navy,
          margin: 0, letterSpacing: '-0.015em',
        }}>{title}</h1>
        {subtitle && (
          <div style={{ fontSize: 13, color: C.textMid, marginTop: 4, fontWeight: 500 }}>{subtitle}</div>
        )}
      </div>
      {right}
    </div>
  );
}

Object.assign(window, {
  Avatar, Chip, ConditionChips, Button, Card, StatCard, SectionHeader,
  UrgentRow, ActivityRow, RevenueBarChart, KpiRow, PageHeader, tabBtn,
  DashboardScreen,
});
