
// Screens 1-5: Splash, Onboarding, Profile Setup, Home Dashboard, Add Medicine

const { useState, useEffect, useRef } = React;

// ── Shared Design Tokens ──
const C = {
  cream: '#FAF7F2',
  coral: '#E8705A',
  coralLight: '#FDEEE9',
  coralDark: '#C9543D',
  sage: '#6BAE8C',
  sageLight: '#E8F5EE',
  amber: '#E8A838',
  amberLight: '#FEF4E0',
  navy: '#2C3E50',
  warmGray: '#8B7E74',
  warmGrayLight: '#F5F0EB',
  white: '#FFFFFF',
  cardBg: '#FFFFFF',
  border: '#EDE8E1',
  text: '#2C2420',
  textMuted: '#8B7E74',
  red: '#E05252',
  redLight: '#FDEAEA',
};

const fonts = {
  heading: "'Fraunces', Georgia, serif",
  body: "'Plus Jakarta Sans', 'Nunito', sans-serif",
};

// ── Reusable Components ──
function Pill({ children, color = C.coral, bg, style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 10px', borderRadius: 20,
      background: bg || color + '22',
      color: color,
      fontFamily: fonts.body, fontSize: 12, fontWeight: 600,
      ...style
    }}>{children}</span>
  );
}

function Tag({ children, color = C.warmGray, icon }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '3px 8px', borderRadius: 8,
      background: C.warmGrayLight, color,
      fontFamily: fonts.body, fontSize: 11, fontWeight: 500,
    }}>{icon && <span>{icon}</span>}{children}</span>
  );
}

function Btn({ children, onClick, variant = 'primary', style, icon, disabled }) {
  const base = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    minHeight: 56, padding: '0 24px', borderRadius: 16,
    fontFamily: fonts.body, fontSize: 17, fontWeight: 700,
    border: 'none', cursor: disabled ? 'default' : 'pointer',
    transition: 'all 0.15s', opacity: disabled ? 0.5 : 1,
    letterSpacing: '-0.01em',
  };
  const variants = {
    primary: { background: C.coral, color: C.white, boxShadow: '0 4px 16px #E8705A44' },
    secondary: { background: C.coralLight, color: C.coral },
    ghost: { background: 'transparent', color: C.warmGray },
    sage: { background: C.sage, color: C.white, boxShadow: '0 4px 16px #6BAE8C44' },
    outline: { background: 'transparent', color: C.coral, border: `2px solid ${C.coral}` },
    amber: { background: C.amber, color: C.white, boxShadow: '0 4px 16px #E8A83844' },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant], ...style }}>
      {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
      {children}
    </button>
  );
}

function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: C.cardBg, borderRadius: 20, padding: '16px 18px',
      boxShadow: '0 2px 12px rgba(44,36,32,0.07)',
      border: `1px solid ${C.border}`,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.15s, box-shadow 0.15s',
      ...style
    }}>{children}</div>
  );
}

function SectionHeader({ title, action, actionLabel }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontFamily: fonts.heading, fontSize: 20, fontWeight: 700, color: C.text }}>{title}</span>
      {action && <span onClick={action} style={{ fontFamily: fonts.body, fontSize: 14, color: C.coral, fontWeight: 600, cursor: 'pointer' }}>{actionLabel || 'See all'}</span>}
    </div>
  );
}

// ── Medicine Data ──
const medicines = [
  { id: 1, name: 'Metformin', dose: '500mg', time: '8:00 AM', meal: 'After breakfast', icon: '💊', taken: true, color: C.sage },
  { id: 2, name: 'Amlodipine', dose: '5mg', time: '9:00 AM', meal: 'After breakfast', icon: '💊', taken: true, color: C.coral },
  { id: 3, name: 'Telmisartan', dose: '40mg', time: '1:00 PM', meal: 'Before lunch', icon: '💊', taken: false, color: C.amber },
  { id: 4, name: 'Atorvastatin', dose: '10mg', time: '9:00 PM', meal: 'After dinner', icon: '💊', taken: false, color: '#A78BFA' },
  { id: 5, name: 'Vitamin D3', dose: '60,000 IU', time: '9:00 PM', meal: 'After dinner', icon: '🌟', taken: false, color: '#F59E0B' },
];

const drugSuggestions = [
  'Metformin 500mg', 'Metformin 850mg', 'Metformin 1000mg',
  'Amlodipine 2.5mg', 'Amlodipine 5mg', 'Amlodipine 10mg',
  'Telmisartan 20mg', 'Telmisartan 40mg', 'Telmisartan 80mg',
  'Atorvastatin 5mg', 'Atorvastatin 10mg', 'Atorvastatin 20mg',
  'Vitamin D3', 'Lisinopril', 'Losartan', 'Ramipril',
  'Aspirin', 'Warfarin', 'Clopidogrel', 'Thyroxine',
  'Levothyroxine', 'Glimepiride', 'Voglibose', 'Sitagliptin',
];

// ── SCREEN 1: SPLASH ──
function SplashScreen({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      flex: 1, background: `linear-gradient(160deg, #E8705A 0%, #C9543D 50%, #B84530 100%)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
      <div style={{ position: 'absolute', bottom: -80, left: -40, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
      <div style={{ position: 'absolute', top: '30%', left: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

      {/* Logo */}
      <div style={{ marginBottom: 28, animation: 'splashPop 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
        <div style={{
          width: 96, height: 96, borderRadius: 28, background: 'rgba(255,255,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          margin: '0 auto 20px',
        }}>
          <span style={{ fontSize: 48 }}>💊</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: fonts.heading, fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 4 }}>
            SaathiPill
          </div>
          <div style={{ fontFamily: fonts.body, fontSize: 16, color: 'rgba(255,255,255,0.85)', fontWeight: 400, letterSpacing: '0.02em' }}>
            साथी · Your daily medicine companion
          </div>
        </div>
      </div>

      {/* Loading dots */}
      <div style={{ display: 'flex', gap: 8, marginTop: 48 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'rgba(255,255,255,0.6)',
            animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>

      <div style={{ position: 'absolute', bottom: 40, fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
        100% free · Works offline
      </div>

      <style>{`
        @keyframes splashPop { from { opacity:0; transform:scale(0.7); } to { opacity:1; transform:scale(1); } }
        @keyframes dotPulse { 0%,80%,100% { opacity:0.3; transform:scale(0.8); } 40% { opacity:1; transform:scale(1.1); } }
      `}</style>
    </div>
  );
}

// ── SCREEN 2: ONBOARDING ──
const onboardingSlides = [
  {
    icon: '🔔',
    title: 'Never miss a dose',
    desc: 'Persistent reminders with escalating alarms. Works even on silent mode. Get phone call reminders if needed.',
    color: C.coral,
    bg: '#FFF5F2',
    features: ['Works on silent mode', 'Escalating alarms', 'Phone call backup'],
  },
  {
    icon: '👨‍👩‍👧',
    title: 'Family stays connected',
    desc: 'Your family gets notified automatically when you miss a dose — via WhatsApp or in-app alerts.',
    color: '#5B8EE0',
    bg: '#F0F5FF',
    features: ['WhatsApp alerts', 'Real-time status', 'Caregiver dashboard'],
  },
  {
    icon: '🏪',
    title: 'Refills made simple',
    desc: 'Running low? Order from 1mg, PharmEasy, Apollo, or your local pharmacy — directly from the app.',
    color: C.sage,
    bg: C.sageLight,
    features: ['1mg · PharmEasy · Apollo', 'Local pharmacy orders', 'Auto refill reminders'],
  },
];

function OnboardingScreen({ onDone }) {
  const [slide, setSlide] = useState(0);
  const s = onboardingSlides[slide];

  return (
    <div style={{ flex: 1, background: C.cream, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 28px 0' }}>
        {/* Illustration area */}
        <div style={{
          width: 180, height: 180, borderRadius: 48,
          background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 36, boxShadow: `0 8px 32px ${s.color}22`,
          transition: 'all 0.3s',
        }}>
          <span style={{ fontSize: 80 }}>{s.icon}</span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{ fontFamily: fonts.heading, fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 12, lineHeight: 1.2 }}>{s.title}</h2>
          <p style={{ fontFamily: fonts.body, fontSize: 16, color: C.textMuted, lineHeight: 1.6, maxWidth: 280 }}>{s.desc}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300 }}>
          {s.features.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 14, background: s.bg }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <span style={{ fontFamily: fonts.body, fontSize: 15, color: C.text, fontWeight: 500 }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '24px 0 8px' }}>
        {onboardingSlides.map((_, i) => (
          <div key={i} style={{
            height: 8, borderRadius: 4,
            background: i === slide ? s.color : C.border,
            width: i === slide ? 24 : 8,
            transition: 'all 0.3s',
          }} />
        ))}
      </div>

      {/* Buttons */}
      <div style={{ padding: '16px 28px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Btn
          onClick={() => { if (slide < 2) setSlide(s => s + 1); else onDone(); }}
          style={{ background: s.color, boxShadow: `0 4px 16px ${s.color}44` }}
        >
          {slide < 2 ? 'Next' : 'Get Started'}
        </Btn>
        {slide < 2 && (
          <Btn variant="ghost" onClick={onDone}>Skip</Btn>
        )}
      </div>
    </div>
  );
}

// ── SCREEN 3: PROFILE SETUP ──
const languages = ['English', 'हिंदी', 'मराठी', 'தமிழ்', 'తెలుగు', 'বাংলা', 'ગુજરાતી', 'ಕನ್ನಡ', 'മലയാളം'];

function ProfileSetupScreen({ onDone }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [lang, setLang] = useState('English');
  const [conditions, setConditions] = useState([]);

  const conditionList = ['Diabetes', 'Hypertension', 'Thyroid', 'Cardiac', 'Asthma', 'Arthritis'];

  const toggleCondition = c => {
    setConditions(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  return (
    <div style={{ flex: 1, background: C.cream, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '24px 24px 0', textAlign: 'center' }}>
        <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.warmGray, marginBottom: 4, fontWeight: 500 }}>Step 1 of 2</div>
        <h2 style={{ fontFamily: fonts.heading, fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 6 }}>Tell us about you</h2>
        <p style={{ fontFamily: fonts.body, fontSize: 15, color: C.textMuted }}>We'll personalise SaathiPill for you</p>
      </div>

      {/* Avatar */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', background: C.coralLight,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
          border: `3px dashed ${C.coral}`,
        }}>👤</div>
      </div>

      <div style={{ flex: 1, padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Name */}
        <div>
          <label style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 8 }}>Full name</label>
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Rajesh Kumar"
            style={{
              width: '100%', height: 52, padding: '0 16px', borderRadius: 14,
              border: `2px solid ${name ? C.coral : C.border}`, background: C.white,
              fontFamily: fonts.body, fontSize: 16, color: C.text,
              outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
          />
        </div>

        {/* Age */}
        <div>
          <label style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 8 }}>Age</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {['0-14', '15-24', '25-34', '35-44', '45-54', '55-64', '65-74', '75+'].map(a => (
              <button key={a} onClick={() => setAge(a)} style={{
                padding: '10px 18px', borderRadius: 12, border: `2px solid ${age === a ? C.coral : C.border}`,
                background: age === a ? C.coralLight : C.white, color: age === a ? C.coral : C.text,
                fontFamily: fonts.body, fontSize: 15, fontWeight: 600, cursor: 'pointer',
              }}>{a}</button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div>
          <label style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 8 }}>Preferred language</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {languages.map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                padding: '8px 14px', borderRadius: 10, border: `2px solid ${lang === l ? C.coral : C.border}`,
                background: lang === l ? C.coralLight : C.white, color: lang === l ? C.coral : C.text,
                fontFamily: fonts.body, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Conditions */}
        <div>
          <label style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 8 }}>Health conditions <span style={{ color: C.textMuted, fontWeight: 400 }}>(optional)</span></label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {conditionList.map(c => (
              <button key={c} onClick={() => toggleCondition(c)} style={{
                padding: '8px 14px', borderRadius: 10, border: `2px solid ${conditions.includes(c) ? C.sage : C.border}`,
                background: conditions.includes(c) ? C.sageLight : C.white, color: conditions.includes(c) ? C.sage : C.text,
                fontFamily: fonts.body, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>{c}</button>
            ))}
          </div>
        </div>

        <Btn onClick={onDone} disabled={!name || !age} style={{ marginTop: 8 }}>
          Continue
        </Btn>
      </div>
    </div>
  );
}

// ── SCREEN 4: HOME DASHBOARD ──
function AdherenceRing({ pct }) {
  const r = 52, cx = 60, cy = 60;
  const circ = 2 * Math.PI * r;
  const progress = circ * (1 - pct / 100);
  return (
    <svg width={120} height={120} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth={10} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.sage} strokeWidth={10}
        strokeDasharray={circ} strokeDashoffset={progress}
        strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px', transition: 'stroke-dashoffset 1s ease' }}
      />
      <text x={cx} y={cy - 4} textAnchor="middle" style={{ fontFamily: fonts.heading, fontSize: 22, fontWeight: 800, fill: C.text }}>{pct}%</text>
      <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontFamily: fonts.body, fontSize: 10, fill: C.textMuted }}>taken today</text>
    </svg>
  );
}

// Parse time string like "8:00 AM" → minutes since midnight
function parseTime(timeStr) {
  const [time, period] = timeStr.split(' ');
  let [hours, mins] = time.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + mins;
}

// Check if a medicine is within its take window (±30 mins)
function getMedStatus(med) {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const scheduledMins = parseTime(med.time);
  const diff = nowMins - scheduledMins;
  if (med.taken) return 'taken';
  if (diff < -30) return 'upcoming';   // more than 30 mins in future
  if (diff >= -30 && diff <= 30) return 'due';  // within window
  if (diff > 30) return 'missed';  // window passed
  return 'upcoming';
}

function MedicineCard({ med, onToggle, onReminderClick }) {
  const isPast = med.time === '8:00 AM' || med.time === '9:00 AM';
  const statusColor = med.taken ? C.sage : (isPast ? C.red : C.amber);
  const statusLabel = med.taken ? 'Taken' : (isPast ? 'Missed' : 'Pending');

  return (
    <Card style={{ marginBottom: 10 }} onClick={() => med.taken || onReminderClick(med)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Pill icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 16, flexShrink: 0,
          background: med.taken ? C.sageLight : (isPast ? C.redLight : C.amberLight),
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
        }}>{med.icon}</div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: fonts.body, fontSize: 16, fontWeight: 700, color: C.text }}>{med.name}</span>
            <Pill color={statusColor}>{statusLabel}</Pill>
          </div>
          <div style={{ fontFamily: fonts.body, fontSize: 14, color: C.textMuted, marginBottom: 6 }}>{med.dose}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Tag icon="🕐">{med.time}</Tag>
            <Tag icon="🍽️">{med.meal}</Tag>
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={e => { e.stopPropagation(); onToggle(med.id); }}
          style={{
            width: 40, height: 40, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: med.taken ? C.sage : C.warmGrayLight,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            flexShrink: 0, transition: 'all 0.2s',
          }}
        >{med.taken ? '✓' : '○'}</button>
      </div>
    </Card>
  );
}

function HomeScreen({ onNavigate, onAddMed, onReminderClick, userName, isNewUser, userMeds, onToggleMed }) {
  const meds = userMeds || (isNewUser ? [] : medicines);
  const taken = meds.filter(m => m.taken).length;
  const pct = meds.length === 0 ? 0 : Math.round((taken / meds.length) * 100);

  const toggleMed = id => onToggleMed ? onToggleMed(id) : null;

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Quick access shortcuts
  const shortcuts = [
    { icon: '📅', label: 'History', screen: 'history' },
    { icon: '📊', label: 'Analytics', screen: 'analytics' },
    { icon: '🤖', label: 'AI Tips', screen: 'insights' },
    { icon: '📋', label: 'Dr Report', screen: 'report' },
  ];

  return (
    <div style={{ flex: 1, overflow: 'auto', background: C.cream, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0', background: C.coral, borderRadius: '0 0 28px 28px', paddingBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 2 }}>{today}</div>
            <div style={{ fontFamily: fonts.heading, fontSize: 24, fontWeight: 800, color: C.white, lineHeight: 1.2 }}>
              Good morning,<br />{userName || 'Rajesh'} 👋
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.2)', borderRadius: 14, padding: '8px 12px' }}>
              <div style={{ fontFamily: fonts.heading, fontSize: 22, fontWeight: 800, color: C.white }}>{isNewUser ? '🌱' : '🔥'} {isNewUser ? 'New' : '12'}</div>
              <div style={{ fontFamily: fonts.body, fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>{isNewUser ? 'just started' : 'day streak'}</div>
            </div>
          </div>
        </div>

        {/* Adherence row */}
        <Card style={{ marginTop: 20, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <AdherenceRing pct={pct} />
            <div>
              <div style={{ fontFamily: fonts.heading, fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                {isNewUser ? 'No medicines yet' : `${taken}/${meds.length} medicines taken`}
              </div>
              <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted, marginBottom: 10 }}>
                {isNewUser ? 'Add your first medicine below' : `${meds.length - taken} pending today`}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {isNewUser
                  ? <Pill color={C.coral}>🌱 Day 1 — Welcome!</Pill>
                  : <Pill color={C.sage}>🏆 12-day streak</Pill>
                }
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick shortcuts */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {shortcuts.map(s => (
            <button key={s.screen} onClick={() => onNavigate(s.screen)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '12px 4px', borderRadius: 16, border: `1px solid ${C.border}`,
              background: C.white, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(44,36,32,0.05)',
            }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <span style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 700, color: C.textMuted }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Medicines list */}
      <div style={{ padding: '20px 20px 100px' }}>
        <SectionHeader title="Today's medicines" action={() => onNavigate('history')} actionLabel="History" />
        {meds.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 80, height: 80, borderRadius: 28, background: C.coralLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>💊</div>
            <div>
              <div style={{ fontFamily: fonts.heading, fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 6 }}>No medicines yet</div>
              <div style={{ fontFamily: fonts.body, fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>Tap the + button below to add your first medicine and start tracking.</div>
            </div>
            <Btn onClick={onAddMed} icon="+" style={{ paddingLeft: 24, paddingRight: 24 }}>Add first medicine</Btn>
          </div>
        ) : (
          meds.map(med => (
            <MedicineCard key={med.id} med={med} onToggle={toggleMed} onReminderClick={onReminderClick} />
          ))
        )}
      </div>

      {/* FAB */}
      <button onClick={onAddMed} style={{
        position: 'absolute', bottom: 88, right: 20,
        width: 60, height: 60, borderRadius: 20, border: 'none',
        background: C.coral, color: C.white, fontSize: 28, fontWeight: 300,
        cursor: 'pointer', boxShadow: '0 6px 24px #E8705A55',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>+</button>
    </div>
  );
}

// ── SCREEN 5: ADD MEDICINE FLOW ──
function AddMedicineScreen({ onDone, onClose }) {
  const [step, setStep] = useState(0);
  const [drug, setDrug] = useState('');
  const [dose, setDose] = useState('');
  const [times, setTimes] = useState([]);
  const [meal, setMeal] = useState('');
  const [schedule, setSchedule] = useState('daily');
  const [suggestions, setSuggestions] = useState([]);

  const timeSlots = [
    { id: 'morning', label: 'Morning', time: '8:00 AM', icon: '🌅' },
    { id: 'afternoon', label: 'Afternoon', time: '1:00 PM', icon: '☀️' },
    { id: 'evening', label: 'Evening', time: '5:00 PM', icon: '🌆' },
    { id: 'night', label: 'Night', time: '9:00 PM', icon: '🌙' },
  ];

  const doseChips = ['½ tablet', '1 tablet', '2 tablets', '250mg', '500mg', '5ml', '10ml'];
  const mealOptions = [
    { id: 'before', label: 'Before meal', icon: '⏱️' },
    { id: 'after', label: 'After meal', icon: '🍽️' },
    { id: 'empty', label: 'Empty stomach', icon: '🌅' },
    { id: 'bedtime', label: 'At bedtime', icon: '🌙' },
  ];

  const handleDrugInput = val => {
    setDrug(val);
    if (val.length > 1) {
      setSuggestions(drugSuggestions.filter(d => d.toLowerCase().includes(val.toLowerCase())).slice(0, 5));
    } else setSuggestions([]);
  };

  const toggleTime = id => {
    setTimes(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const steps = ['Medicine', 'Dose', 'Schedule', 'Meal'];

  return (
    <div style={{ flex: 1, background: C.cream, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: `1px solid ${C.border}` }}>
        <button onClick={step === 0 ? onClose : () => setStep(s => s - 1)} style={{ width: 40, height: 40, borderRadius: 12, background: C.warmGrayLight, border: 'none', fontSize: 18, cursor: 'pointer' }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: fonts.heading, fontSize: 18, fontWeight: 700, color: C.text }}>Add Medicine</div>
          <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>Step {step + 1} of 4 — {steps[step]}</div>
        </div>
        <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: 12, background: C.warmGrayLight, border: 'none', fontSize: 16, cursor: 'pointer' }}>✕</button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: C.border }}>
        <div style={{ height: 4, background: C.coral, width: `${((step + 1) / 4) * 100}%`, transition: 'width 0.3s', borderRadius: 2 }} />
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '24px 20px' }}>

        {/* Step 0: Medicine name */}
        {step === 0 && (
          <div>
            <h3 style={{ fontFamily: fonts.heading, fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 6 }}>Which medicine?</h3>
            <p style={{ fontFamily: fonts.body, fontSize: 14, color: C.textMuted, marginBottom: 20 }}>Search from Indian drug database</p>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <input
                value={drug} onChange={e => handleDrugInput(e.target.value)}
                placeholder="e.g. Metformin, Amlodipine..."
                style={{
                  width: '100%', height: 52, padding: '0 16px 0 44px', borderRadius: 14,
                  border: `2px solid ${drug ? C.coral : C.border}`, background: C.white,
                  fontFamily: fonts.body, fontSize: 16, outline: 'none', boxSizing: 'border-box',
                }}
              />
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 20 }}>🔍</span>
            </div>
            {suggestions.length > 0 && (
              <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden', marginBottom: 16 }}>
                {suggestions.map((s, i) => (
                  <div key={i} onClick={() => { setDrug(s); setSuggestions([]); }}
                    style={{ padding: '14px 16px', borderBottom: i < suggestions.length - 1 ? `1px solid ${C.border}` : 'none', cursor: 'pointer', fontFamily: fonts.body, fontSize: 15, color: C.text }}>
                    💊 {s}
                  </div>
                ))}
              </div>
            )}
            {/* Drug interaction warning */}
            {drug.toLowerCase().includes('aspirin') && (
              <Card style={{ border: `2px solid ${C.amber}`, background: C.amberLight, marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 24 }}>⚠️</span>
                  <div>
                    <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>Drug Interaction Alert</div>
                    <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.text, lineHeight: 1.5 }}>
                      Aspirin + Warfarin: increased bleeding risk. Please consult your doctor before adding.
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Step 1: Dose */}
        {step === 1 && (
          <div>
            <h3 style={{ fontFamily: fonts.heading, fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 6 }}>What's the dose?</h3>
            <p style={{ fontFamily: fonts.body, fontSize: 14, color: C.textMuted, marginBottom: 20 }}>Quick pick or type your own</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
              {doseChips.map(d => (
                <button key={d} onClick={() => setDose(d)} style={{
                  padding: '12px 18px', borderRadius: 14, border: `2px solid ${dose === d ? C.coral : C.border}`,
                  background: dose === d ? C.coralLight : C.white, color: dose === d ? C.coral : C.text,
                  fontFamily: fonts.body, fontSize: 15, fontWeight: 600, cursor: 'pointer',
                }}>{d}</button>
              ))}
            </div>
            <input value={dose} onChange={e => setDose(e.target.value)} placeholder="Or type custom dose..."
              style={{
                width: '100%', height: 52, padding: '0 16px', borderRadius: 14,
                border: `2px solid ${C.border}`, background: C.white,
                fontFamily: fonts.body, fontSize: 16, outline: 'none', boxSizing: 'border-box',
              }} />
          </div>
        )}

        {/* Step 2: Schedule */}
        {step === 2 && (
          <div>
            <h3 style={{ fontFamily: fonts.heading, fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 6 }}>When to take it?</h3>
            <p style={{ fontFamily: fonts.body, fontSize: 14, color: C.textMuted, marginBottom: 20 }}>Select all that apply</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {timeSlots.map(t => (
                <button key={t.id} onClick={() => toggleTime(t.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px',
                  borderRadius: 16, border: `2px solid ${times.includes(t.id) ? C.coral : C.border}`,
                  background: times.includes(t.id) ? C.coralLight : C.white, cursor: 'pointer',
                }}>
                  <span style={{ fontSize: 28 }}>{t.icon}</span>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ fontFamily: fonts.body, fontSize: 16, fontWeight: 700, color: times.includes(t.id) ? C.coral : C.text }}>{t.label}</div>
                    <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted }}>{t.time}</div>
                  </div>
                  {times.includes(t.id) && <span style={{ fontSize: 20, color: C.coral }}>✓</span>}
                </button>
              ))}
            </div>

            <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 12 }}>Schedule type</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Daily', 'Weekly', 'Cyclic'].map(s => (
                <button key={s} onClick={() => setSchedule(s.toLowerCase())} style={{
                  flex: 1, padding: '12px 8px', borderRadius: 12,
                  border: `2px solid ${schedule === s.toLowerCase() ? C.coral : C.border}`,
                  background: schedule === s.toLowerCase() ? C.coralLight : C.white,
                  color: schedule === s.toLowerCase() ? C.coral : C.text,
                  fontFamily: fonts.body, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Meal */}
        {step === 3 && (
          <div>
            <h3 style={{ fontFamily: fonts.heading, fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 6 }}>Meal context</h3>
            <p style={{ fontFamily: fonts.body, fontSize: 14, color: C.textMuted, marginBottom: 20 }}>When should this be taken relative to food?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {mealOptions.map(m => (
                <button key={m.id} onClick={() => setMeal(m.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px',
                  borderRadius: 16, border: `2px solid ${meal === m.id ? C.coral : C.border}`,
                  background: meal === m.id ? C.coralLight : C.white, cursor: 'pointer',
                }}>
                  <span style={{ fontSize: 28 }}>{m.icon}</span>
                  <span style={{ fontFamily: fonts.body, fontSize: 16, fontWeight: 600, color: meal === m.id ? C.coral : C.text, flex: 1, textAlign: 'left' }}>{m.label}</span>
                  {meal === m.id && <span style={{ fontSize: 20, color: C.coral }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Next button */}
      <div style={{ padding: '12px 20px 24px' }}>
        <Btn
          onClick={step < 3 ? () => setStep(s => s + 1) : () => onDone({ drug, dose, times, meal })}
          disabled={step === 0 && !drug || step === 1 && !dose || step === 2 && times.length === 0 || step === 3 && !meal}
        >
          {step < 3 ? 'Next step' : '✓ Add Medicine'}
        </Btn>
      </div>
    </div>
  );
}

// ── SCREEN: LOGIN / SIGN UP ──
function AuthScreen({ onLogin, onSignUp }) {
  const [mode, setMode] = useState('welcome'); // 'welcome' | 'login' | 'signup'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];

  const handleOtpChange = (val, idx) => {
    const digits = val.replace(/\D/g, '').slice(0, 1);
    const next = [...otp];
    next[idx] = digits;
    setOtp(next);
    if (digits && idx < 3) otpRefs[idx + 1].current?.focus();
    if (!digits && idx > 0) otpRefs[idx - 1].current?.focus();
  };

  const sendOtp = () => {
    if (phone.length !== 10) { setError('Enter a valid 10-digit number'); return; }
    setError('');
    setOtpSent(true);
  };

  const verifyOtp = () => {
    const code = otp.join('');
    if (code.length < 4) { setError('Enter the 4-digit OTP'); return; }
    setError('');
    if (mode === 'login') onLogin();
    else onSignUp(name);
  };

  const inputStyle = {
    width: '100%', height: 52, padding: '0 16px', borderRadius: 14,
    border: `2px solid ${C.border}`, background: C.white,
    fontFamily: fonts.body, fontSize: 16, color: C.text,
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.cream }}>

      {/* ── Welcome screen ── */}
      {mode === 'welcome' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Hero */}
          <div style={{
            flex: 1, background: `linear-gradient(160deg, #E8705A 0%, #C9543D 60%, #B84530 100%)`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '48px 32px 40px', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'absolute', bottom: -80, left: -40, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

            <div style={{
              width: 88, height: 88, borderRadius: 26, background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44,
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)', marginBottom: 24,
            }}>💊</div>

            <div style={{ fontFamily: fonts.heading, fontSize: 34, fontWeight: 800, color: '#fff', textAlign: 'center', marginBottom: 10, letterSpacing: '-0.02em' }}>
              SaathiPill
            </div>
            <div style={{ fontFamily: fonts.body, fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 1.6, maxWidth: 260 }}>
              Your daily medicine companion — free, offline, and made for India
            </div>

            {/* Trust badges */}
            <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
              {['100% Free', 'Works Offline', 'No Ads'].map(b => (
                <div key={b} style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.18)', fontFamily: fonts.body, fontSize: 12, fontWeight: 600, color: '#fff' }}>{b}</div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div style={{ padding: '32px 24px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Btn onClick={() => setMode('signup')} icon="✨">Create account</Btn>
            <Btn variant="outline" onClick={() => setMode('login')} icon="→">Log in</Btn>
            <div style={{ textAlign: 'center', marginTop: 4 }}>
              <span style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>
                By continuing, you agree to our{' '}
                <span style={{ color: C.coral, textDecoration: 'underline', cursor: 'pointer' }}>Terms</span>
                {' & '}
                <span style={{ color: C.coral, textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Login / Sign Up shared OTP flow ── */}
      {(mode === 'login' || mode === 'signup') && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Back header */}
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => { setMode('welcome'); setOtpSent(false); setPhone(''); setOtp(['','','','']); setError(''); }}
              style={{ width: 40, height: 40, borderRadius: 12, background: C.warmGrayLight, border: 'none', fontSize: 18, cursor: 'pointer' }}>←</button>
            <div>
              <div style={{ fontFamily: fonts.heading, fontSize: 18, fontWeight: 700, color: C.text }}>
                {mode === 'login' ? 'Welcome back' : 'Create account'}
              </div>
              <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>
                {mode === 'login' ? 'Log in with your phone number' : 'Sign up with your phone number'}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, padding: '8px 24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Sign up — name field */}
            {mode === 'signup' && !otpSent && (
              <div>
                <label style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 8 }}>Your name</label>
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Shreyas Kumar"
                  style={{ ...inputStyle, borderColor: name ? C.coral : C.border }}
                />
              </div>
            )}

            {/* Phone number */}
            {!otpSent && (
              <div>
                <label style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 8 }}>Mobile number</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{
                    height: 52, padding: '0 14px', borderRadius: 14,
                    border: `2px solid ${C.border}`, background: C.white,
                    display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                    fontFamily: fonts.body, fontSize: 15, color: C.text,
                  }}>🇮🇳 +91</div>
                  <input
                    value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
                    placeholder="98765 43210" type="tel"
                    style={{ ...inputStyle, flex: 1, borderColor: phone.length === 10 ? C.coral : C.border }}
                  />
                </div>
                {error && <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.red, marginTop: 6 }}>{error}</div>}
              </div>
            )}

            {/* OTP entry */}
            {otpSent && (
              <div>
                <div style={{ fontFamily: fonts.body, fontSize: 15, color: C.textMuted, marginBottom: 20, lineHeight: 1.6 }}>
                  OTP sent to <strong style={{ color: C.text }}>+91 {phone}</strong>.{' '}
                  <span onClick={() => setOtpSent(false)} style={{ color: C.coral, cursor: 'pointer', textDecoration: 'underline' }}>Change</span>
                </div>

                {/* 4-digit OTP boxes */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 8 }}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={otpRefs[idx]}
                      value={digit}
                      onChange={e => handleOtpChange(e.target.value, idx)}
                      onKeyDown={e => { if (e.key === 'Backspace' && !digit && idx > 0) otpRefs[idx-1].current?.focus(); }}
                      maxLength={1} type="tel"
                      style={{
                        width: 58, height: 64, textAlign: 'center', borderRadius: 16,
                        border: `2px solid ${digit ? C.coral : C.border}`, background: C.white,
                        fontFamily: fonts.heading, fontSize: 28, fontWeight: 700, color: C.text,
                        outline: 'none', transition: 'border-color 0.2s',
                      }}
                    />
                  ))}
                </div>

                {error && <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.red, marginTop: 6, textAlign: 'center' }}>{error}</div>}

                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <span style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted }}>Didn't receive it? </span>
                  <span onClick={() => setOtp(['','','',''])} style={{ fontFamily: fonts.body, fontSize: 13, color: C.coral, cursor: 'pointer', fontWeight: 600 }}>Resend OTP</span>
                </div>

                {/* Demo hint */}
                <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, background: C.amberLight, border: `1px solid ${C.amber}33` }}>
                  <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.text }}>
                    💡 <strong>Demo:</strong> Enter any 4 digits to {mode === 'login' ? 'log in' : 'sign up'}
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {!otpSent ? (
                <Btn onClick={sendOtp} disabled={mode === 'signup' ? (!name || phone.length !== 10) : phone.length !== 10}>
                  Send OTP
                </Btn>
              ) : (
                <Btn onClick={verifyOtp} disabled={otp.join('').length < 4}>
                  {mode === 'login' ? 'Log in →' : 'Create account →'}
                </Btn>
              )}

              {mode === 'login' ? (
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontFamily: fonts.body, fontSize: 14, color: C.textMuted }}>New to SaathiPill? </span>
                  <span onClick={() => { setMode('signup'); setOtpSent(false); setPhone(''); setOtp(['','','','']); setError(''); }} style={{ fontFamily: fonts.body, fontSize: 14, color: C.coral, fontWeight: 700, cursor: 'pointer' }}>Sign up free</span>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontFamily: fonts.body, fontSize: 14, color: C.textMuted }}>Already have an account? </span>
                  <span onClick={() => { setMode('login'); setOtpSent(false); setPhone(''); setOtp(['','','','']); setError(''); }} style={{ fontFamily: fonts.body, fontSize: 14, color: C.coral, fontWeight: 700, cursor: 'pointer' }}>Log in</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export all
Object.assign(window, { SplashScreen, OnboardingScreen, ProfileSetupScreen, HomeScreen, AddMedicineScreen, AuthScreen, C, fonts, Card, Btn, Pill, Tag, SectionHeader, medicines });
