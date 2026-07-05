
// Screens 1-5: Splash, Onboarding, Profile Setup, Home Dashboard, Add Medicine

const { useState, useEffect, useRef } = React;

// ── Shared Design Tokens ──
// Clinical & Confident theme — Deep Blue + Teal + White.
// `coral`* keys keep their names (referenced everywhere) but now hold the deep-blue
// primary; `sage`* now hold teal. Backgrounds are cool whites.
const C = {
  cream: '#F4F7FB',
  coral: '#1D62A6',       // deep-blue primary (actions, accents)
  coralLight: '#E6EFF8',
  coralDark: '#16487D',
  sage: '#0E9594',        // teal (positive / success)
  sageLight: '#DBF1EF',
  amber: '#E8A838',
  amberLight: '#FEF4E0',
  navy: '#13355C',        // deepest blue (headings)
  warmGray: '#8A93A3',
  warmGrayLight: '#EEF2F7',
  white: '#FFFFFF',
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
  text: '#1A2B45',
  textMuted: '#8A93A3',
  red: '#E05252',
  redLight: '#FDEAEA'
};

const fonts = {
  heading: "'Fraunces', Georgia, serif",
  body: "'Plus Jakarta Sans', 'Nunito', sans-serif"
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
    }}>{children}</span>);

}

function Tag({ children, color = C.warmGray, icon }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '3px 8px', borderRadius: 8,
      background: C.warmGrayLight, color,
      fontFamily: fonts.body, fontSize: 11, fontWeight: 500
    }}>{icon && <span>{icon}</span>}{children}</span>);

}

function Btn({ children, onClick, variant = 'primary', style, icon, disabled }) {
  const base = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    minHeight: 56, padding: '0 24px', borderRadius: 16,
    fontFamily: fonts.body, fontSize: 17, fontWeight: 700,
    border: 'none', cursor: disabled ? 'default' : 'pointer',
    transition: 'all 0.15s', opacity: disabled ? 0.5 : 1,
    letterSpacing: '-0.01em'
  };
  const variants = {
    primary: { background: C.coral, color: C.white, boxShadow: '0 4px 16px #1D62A644' },
    secondary: { background: C.coralLight, color: C.coral },
    ghost: { background: 'transparent', color: C.warmGray },
    sage: { background: C.sage, color: C.white, boxShadow: '0 4px 16px #0E959444' },
    outline: { background: 'transparent', color: C.coral, border: `2px solid ${C.coral}` },
    amber: { background: C.amber, color: C.white, boxShadow: '0 4px 16px #E8A83844' }
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant], ...style }}>
      {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
      {children}
    </button>);

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
    }}>{children}</div>);

}

function SectionHeader({ title, action, actionLabel }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontFamily: fonts.heading, fontSize: 20, fontWeight: 700, color: C.text }}>{title}</span>
      {action && <span onClick={action} style={{ fontFamily: fonts.body, fontSize: 14, color: C.coral, fontWeight: 600, cursor: 'pointer' }}>{actionLabel || 'See all'}</span>}
    </div>);

}

// ── Medicine Data ──
const medicines = [
{ id: 1, name: 'Metformin', dose: '500mg', time: '8:00 AM', meal: 'After breakfast', icon: '💊', taken: true, color: C.sage },
{ id: 2, name: 'Amlodipine', dose: '5mg', time: '9:00 AM', meal: 'After breakfast', icon: '💊', taken: true, color: C.coral },
{ id: 3, name: 'Telmisartan', dose: '40mg', time: '1:00 PM', meal: 'Before lunch', icon: '💊', taken: false, color: C.amber },
{ id: 4, name: 'Atorvastatin', dose: '10mg', time: '9:00 PM', meal: 'After dinner', icon: '💊', taken: false, color: '#A78BFA' },
{ id: 5, name: 'Vitamin D3', dose: '60,000 IU', time: '9:00 PM', meal: 'After dinner', icon: '🌟', taken: false, color: '#F59E0B' }];


// Common Indian medicines — popular brand names + generics with usual strengths.
// Curated offline list (not a live CIMS/MIMS feed — those need a licensed API).
// Each entry is "Name Strength"; the search box matches on any substring, so
// typing either the brand (e.g. "Dolo") or the salt (e.g. "Paracetamol") works.
const drugSuggestions = [
  // Pain / fever (analgesics & antipyretics)
  'Dolo 650', 'Crocin 500', 'Crocin Advance 500mg', 'Calpol 500mg', 'Calpol 650mg',
  'Paracetamol 500mg', 'Paracetamol 650mg', 'Combiflam', 'Brufen 400mg', 'Ibuprofen 400mg',
  'Zerodol 100mg', 'Zerodol-P', 'Aceclofenac 100mg', 'Voveran 50mg', 'Diclofenac 50mg',
  'Nise 100mg', 'Nimesulide 100mg', 'Etoshine 90mg', 'Etoricoxib 90mg', 'Saridon',
  'Disprin', 'Ultracet', 'Tramadol 50mg', 'Hifenac-P', 'Meftal Spas',
  // Antibiotics
  'Augmentin 625', 'Augmentin 1g', 'Clavam 625', 'Amoxicillin 500mg', 'Mox 500',
  'Azithral 500', 'Azee 500', 'Azithromycin 500mg', 'Cifran 500', 'Ciprofloxacin 500mg',
  'Oflox 200', 'Ofloxacin 200mg', 'Norflox 400', 'Metrogyl 400', 'Metronidazole 400mg',
  'Cefixime 200mg', 'Taxim-O 200', 'Cephalexin 500mg', 'Doxycycline 100mg', 'Levoflox 500',
  'Monocef 1g', 'Zifi 200',
  // Acidity / gastro
  'Pan 40', 'Pan-D', 'Pantop 40', 'Pantoprazole 40mg', 'Razo 20', 'Rabeprazole 20mg',
  'Omez 20', 'Omeprazole 20mg', 'Nexpro 40', 'Esomeprazole 40mg', 'Rantac 150',
  'Ranitidine 150mg', 'Aciloc 150', 'Digene', 'Gelusil', 'Cremaffin', 'Dulcoflex 5mg',
  'Domstal 10mg', 'Domperidone 10mg', 'Emeset 4mg', 'Ondansetron 4mg', 'Vomikind 4mg',
  'Sporlac', 'Econorm', 'ORS', 'Electral',
  // Diabetes
  'Metformin 500mg', 'Metformin 850mg', 'Metformin 1000mg', 'Glycomet 500', 'Glycomet GP1',
  'Glycomet GP2', 'Glimepiride 1mg', 'Glimepiride 2mg', 'Amaryl 1mg', 'Zoryl 2mg',
  'Janumet 50/500', 'Galvus Met 50/500', 'Istamet 50/500', 'Sitagliptin 100mg',
  'Vildagliptin 50mg', 'Voglibose 0.2mg', 'Jardiance 10mg', 'Forxiga 10mg',
  'Lantus', 'Mixtard 30/70', 'Huminsulin', 'Novomix 30',
  // Blood pressure / heart
  'Telma 40', 'Telma 20', 'Telma-H', 'Telmisartan 40mg', 'Olmesartan 20mg', 'Olmy 20',
  'Amlong 5', 'Amlodipine 5mg', 'Stamlo 5', 'Cilacar 10', 'Cilnidipine 10mg',
  'Losar 50', 'Losartan 50mg', 'Cardace 5', 'Ramipril 5mg', 'Concor 5', 'Bisoprolol 5mg',
  'Met XL 25', 'Metoprolol 50mg', 'Nebicard 5', 'Nebivolol 5mg', 'Lasix 40mg',
  'Furosemide 40mg', 'Dytor 10', 'Aldactone 25mg', 'Nicardia 10mg',
  // Cholesterol / blood thinners
  'Atorvastatin 10mg', 'Atorvastatin 20mg', 'Atorva 10', 'Storvas 10', 'Rosuvas 10',
  'Rosuvastatin 10mg', 'Ecosprin 75', 'Ecosprin-AV 75', 'Aspirin 75mg', 'Clopilet 75',
  'Clopidogrel 75mg', 'Deplatt 75',
  // Thyroid
  'Thyronorm 25mcg', 'Thyronorm 50mcg', 'Thyronorm 100mcg', 'Eltroxin 50mcg',
  'Levothyroxine 50mcg',
  // Allergy / cold / respiratory
  'Cetzine 10mg', 'Cetirizine 10mg', 'Levocet 5mg', 'Levocetirizine 5mg', 'Allegra 120mg',
  'Allegra 180mg', 'Montair-LC', 'Montelukast 10mg', 'Avil 25mg', 'Sinarest',
  'Cheston Cold', 'D-Cold Total', 'Vicks Action 500', 'Ascoril LS', 'Benadryl',
  'Asthalin Inhaler', 'Foracort Inhaler', 'Budecort Inhaler', 'Levolin Inhaler',
  // Vitamins / supplements
  'Shelcal 500', 'Calcium + Vitamin D3', 'Uprise-D3 60000', 'Calcirol 60000 IU',
  'Vitamin D3 60,000 IU', 'Becosules', 'Zincovit', 'Neurobion Forte', 'Limcee 500mg',
  'Supradyn', 'Revital H', 'Cobadex CZS', 'Folvite 5mg', 'Orofer XT', 'Autrin',
  // Neuro / other common
  'Pregabalin 75mg', 'Pregabid 75', 'Gabapentin 300mg', 'Amitriptyline 10mg',
  'Wysolone 10mg', 'Prednisolone 10mg', 'Defcort 6mg', 'Deflazacort 6mg',
  'Levipil 500', 'Levetiracetam 500mg',
];


// ── SCREEN 1: SPLASH ──
function SplashScreen({ onDone }) {
  useEffect(() => {const t = setTimeout(onDone, 2200);return () => clearTimeout(t);}, []);
  return (
    <div style={{
      flex: 1, background: `linear-gradient(160deg, #2A6FB0 0%, #1D62A6 50%, #163F6E 100%)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden'
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
          margin: '0 auto 20px'
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
        {[0, 1, 2].map((i) =>
        <div key={i} style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'rgba(255,255,255,0.6)',
          animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`
        }} />
        )}
      </div>

      <div style={{ position: 'absolute', bottom: 40, fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
        100% free · Works offline
      </div>

      <style>{`
        @keyframes splashPop { from { opacity:0; transform:scale(0.7); } to { opacity:1; transform:scale(1); } }
        @keyframes dotPulse { 0%,80%,100% { opacity:0.3; transform:scale(0.8); } 40% { opacity:1; transform:scale(1.1); } }
      `}</style>
    </div>);

}

// ── SCREEN 2: ONBOARDING ──
const onboardingSlides = [
{
  icon: '🔔',
  title: 'Never miss a dose',
  desc: 'Persistent reminders with escalating alarms. Works even on silent mode. Get phone call reminders if needed.',
  color: C.coral,
  bg: '#FFF5F2',
  features: ['Works on silent mode', 'Escalating alarms', 'Phone call backup']
},
{
  icon: '👨‍👩‍👧',
  title: 'Family stays connected',
  desc: 'Your family gets notified automatically when you miss a dose — via SMS and in-app alerts.',
  color: '#5B8EE0',
  bg: '#F0F5FF',
  features: ['SMS alerts', 'Real-time status', 'Caregiver dashboard']
},
{
  icon: '🏪',
  title: 'Refills made simple',
  desc: 'Running low? Reserve a refill from your linked pharmacy and pick it up when it\'s ready — pay at the counter.',
  color: C.sage,
  bg: C.sageLight,
  features: ['Reserve in the app', 'Ready-to-collect alerts', 'Auto refill reminders']
}];


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
          transition: 'all 0.3s'
        }}>
          <span style={{ fontSize: 80 }}>{s.icon}</span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{ fontFamily: fonts.heading, fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 12, lineHeight: 1.2 }}>{s.title}</h2>
          <p style={{ fontFamily: fonts.body, fontSize: 16, color: C.textMuted, lineHeight: 1.6, maxWidth: 280 }}>{s.desc}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300 }}>
          {s.features.map((f, i) =>
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 14, background: s.bg }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <span style={{ fontFamily: fonts.body, fontSize: 15, color: C.text, fontWeight: 500 }}>{f}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '24px 0 8px' }}>
        {onboardingSlides.map((_, i) =>
        <div key={i} style={{
          height: 8, borderRadius: 4,
          background: i === slide ? s.color : C.border,
          width: i === slide ? 24 : 8,
          transition: 'all 0.3s'
        }} />
        )}
      </div>

      {/* Buttons */}
      <div style={{ padding: '16px 28px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Btn
          onClick={() => {if (slide < 2) setSlide((s) => s + 1);else onDone();}}
          style={{ background: s.color, boxShadow: `0 4px 16px ${s.color}44` }}>
          
          {slide < 2 ? 'Next' : 'Get Started'}
        </Btn>
        {slide < 2 &&
        <Btn variant="ghost" onClick={onDone}>Skip</Btn>
        }
      </div>
    </div>);

}

// ── Pharmacy code input (patient-side) ──
// Format: XXXX-XXXXX (4 alphanumeric · dash · 5 alphanumeric = 9 chars total)
function PharmacyCodeInputApp({ value, onChange }) {
  const handleChange = (e) => {
    let clean = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length > 9) clean = clean.slice(0, 9);
    onChange(clean.length > 4 ? clean.slice(0, 4) + '-' + clean.slice(4) : clean);
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
            width: '100%', height: 52, padding: '0 72px 0 16px',
            borderRadius: 14,
            border: `2px solid ${isValid ? C.sage : hasContent ? C.coral : C.border}`,
            background: C.white,
            fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
            fontSize: 20, fontWeight: 800, letterSpacing: '0.12em',
            color: isValid ? C.sage : hasContent ? C.coral : C.textMuted,
            outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.2s, color 0.2s',
          }}
        />
        <span style={{
          position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
          fontSize: 11, fontWeight: 700, pointerEvents: 'none',
          color: isValid ? C.sage : hasContent ? C.coral : C.textMuted,
        }}>
          {isValid ? '✓ Valid' : `${charCount}/9`}
        </span>
      </div>
      <div style={{
        marginTop: 6, fontSize: 12, fontFamily: fonts.body, fontWeight: 500,
        color: isValid ? C.sage : hasContent ? C.coral : C.textMuted,
      }}>
        {isValid
          ? '✓ Pharmacy linked — you\'ll get auto refill reminders'
          : hasContent
          ? 'Format: 4 chars · dash · 5 chars  (e.g. SHRM-74219)'
          : 'Ask your pharmacist for their 9-character code'}
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
  const [pharmacyCode, setPharmacyCode] = useState('');

  const conditionList = ['Diabetes', 'Hypertension', 'Thyroid', 'Cardiac', 'Asthma', 'Arthritis'];

  const toggleCondition = (c) => {
    setConditions((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  };

  const handleDone = () => {
    const codeValid = /^[A-Z0-9]{4}-[A-Z0-9]{5}$/.test(pharmacyCode);
    if (codeValid) localStorage.setItem('sp_patient_pharmacy_code', pharmacyCode);
    // Persist the profile + pharmacy link to the backend so the pharmacy portal
    // sees this patient as linked. Best-effort; the UI proceeds regardless.
    const api = window.SaathiPillAPI;
    if (api && api.enabled && api.hasSession()) {
      const ageNum = parseInt((age || '').split('-')[0], 10);
      api.updateProfile({
        name: name || undefined,
        age: isNaN(ageNum) ? undefined : ageNum,
        conditions,
        language: lang,
        linkedPharmacyCode: codeValid ? pharmacyCode : undefined,
      }).catch(function () {});
    }
    onDone();
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
          border: `3px dashed ${C.coral}`
        }}>👤</div>
      </div>

      <div style={{ flex: 1, padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Name */}
        <div>
          <label style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 8 }}>Full name</label>
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rajesh Kumar"
            style={{
              width: '100%', height: 52, padding: '0 16px', borderRadius: 14,
              border: `2px solid ${name ? C.coral : C.border}`, background: C.white,
              fontFamily: fonts.body, fontSize: 16, color: C.text,
              outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.2s'
            }} />
          
        </div>

        {/* Age */}
        <div>
          <label style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 8 }}>Age</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {['0-14', '15-24', '25-34', '35-44', '45-54', '55-64', '65-74', '75+'].map((a) =>
            <button key={a} onClick={() => setAge(a)} style={{
              padding: '10px 18px', borderRadius: 12, border: `2px solid ${age === a ? C.coral : C.border}`,
              background: age === a ? C.coralLight : C.white, color: age === a ? C.coral : C.text,
              fontFamily: fonts.body, fontSize: 15, fontWeight: 600, cursor: 'pointer'
            }}>{a}</button>
            )}
          </div>
        </div>

        {/* Language — device language first (improvement #11) */}
        <div>
          <label style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 8 }}>Preferred language</label>
          <button onClick={() => setLang('English')} style={{
            width: '100%', padding: '14px 16px', borderRadius: 14,
            border: `2px solid ${lang === 'English' ? C.coral : C.border}`,
            background: lang === 'English' ? C.coralLight : C.white,
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 10
          }}>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 700, color: lang === 'English' ? C.coral : C.text }}>English</div>
              <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>Detected from your phone</div>
            </div>
            {lang === 'English' && <span style={{ fontSize: 18, color: C.coral }}>✓</span>}
          </button>
          <details style={{ cursor: 'pointer' }}>
            <summary style={{ fontFamily: fonts.body, fontSize: 14, color: C.coral, fontWeight: 600, listStyle: 'none', padding: '6px 0' }}>
              {lang !== 'English' ? `Selected: ${lang} · ` : ''}More languages ({languages.length - 1}) ▾
            </summary>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {languages.filter((l) => l !== 'English').map((l) =>
              <button key={l} onClick={() => setLang(l)} style={{
                padding: '8px 14px', borderRadius: 10, border: `2px solid ${lang === l ? C.coral : C.border}`,
                background: lang === l ? C.coralLight : C.white, color: lang === l ? C.coral : C.text,
                fontFamily: fonts.body, fontSize: 14, fontWeight: 600, cursor: 'pointer'
              }}>{l}</button>
              )}
            </div>
          </details>
        </div>

        {/* Conditions */}
        <div>
          <label style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 8 }}>Health conditions <span style={{ color: C.textMuted, fontWeight: 400 }}>(optional)</span></label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {conditionList.map((c) =>
            <button key={c} onClick={() => toggleCondition(c)} style={{
              padding: '8px 14px', borderRadius: 10, border: `2px solid ${conditions.includes(c) ? C.sage : C.border}`,
              background: conditions.includes(c) ? C.sageLight : C.white, color: conditions.includes(c) ? C.sage : C.text,
              fontFamily: fonts.body, fontSize: 14, fontWeight: 600, cursor: 'pointer'
            }}>{c}</button>
            )}
          </div>
        </div>

        {/* Pharmacy code */}
        <div>
          <label style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 4 }}>
            Link your pharmacy <span style={{ color: C.textMuted, fontWeight: 400 }}>(optional)</span>
          </label>
          <p style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted, marginBottom: 10, lineHeight: 1.5 }}>
            Your pharmacist has a 9-character code. Enter it here to get auto-refill reminders and easy ordering.
          </p>
          <PharmacyCodeInputApp value={pharmacyCode} onChange={setPharmacyCode} />
          {pharmacyCode.length === 0 && (
            <div style={{
              marginTop: 10, padding: '10px 14px', borderRadius: 12,
              background: C.amberLight, border: `1px solid ${C.amber}33`,
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 16 }}>💡</span>
              <span style={{ fontFamily: fonts.body, fontSize: 12, color: C.text, lineHeight: 1.5 }}>
                Don't have a code? You can add it later in <strong>Profile → Pharmacy partner</strong>.
              </span>
            </div>
          )}
        </div>

        <Btn onClick={handleDone} disabled={!name || !age} style={{ marginTop: 8 }}>
          Continue
        </Btn>
      </div>
    </div>);

}

// ── SCREEN 4: HOME DASHBOARD ──
// ── 7-day rolling adherence visual ──
// history: array of REAL prior-day adherence %s (0-100), oldest→newest, may be empty.
// today: live adherence % for today, or null if there are no doses to measure yet.
// Nothing is fabricated — a brand-new user with no history shows "—".
function RollingAdherence({ history, today }) {
  const prior = (history || []).filter((p) => p != null);
  const bars = [...prior, ...(today != null ? [today] : [])];
  const avg = bars.length ? Math.round(bars.reduce((a, b) => a + b, 0) / bars.length) : null;
  const avgColor = avg == null ? C.textMuted : avg >= 80 ? C.sage : avg >= 60 ? C.amber : C.red;
  const label = prior.length >= 6 ? '7-day average' : prior.length > 0 ? `${bars.length}-day average` : 'Today';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', minWidth: 110 }}>
      <div style={{ fontFamily: fonts.heading, fontSize: 32, fontWeight: 800, color: avgColor, lineHeight: 1 }}>
        {avg == null ? '—' : avg + '%'}
      </div>
      <div style={{ fontFamily: fonts.body, fontSize: 10, color: C.textMuted, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 28 }}>
        {bars.length === 0 ? (
          <div style={{ fontFamily: fonts.body, fontSize: 10, color: C.textMuted }}>No data yet</div>
        ) : bars.map((p, i) =>
        <div key={i} style={{
          width: 7, borderRadius: 2,
          height: Math.max(4, p / 100 * 28),
          background: i === bars.length - 1 && today != null ? C.coral : p >= 80 ? C.sage : p >= 60 ? C.amber : C.red,
          opacity: i === bars.length - 1 && today != null ? 1 : 0.7
        }} />
        )}
      </div>
    </div>);

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
  if (diff < -30) return 'upcoming'; // more than 30 mins in future
  if (diff >= -30 && diff <= 30) return 'due'; // within window
  if (diff > 30) return 'missed'; // window passed
  return 'upcoming';
}

// Today's date in YYYY-MM-DD form — used to scope skip flags to a single day (issue #4)
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function MedicineCard({ med, onToggle, onReminderClick, onEditMed, pendingSync, onRemove }) {
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const isCourseComplete = med.courseEndDate && new Date(med.courseEndDate) < new Date();
  // Real wall-clock check — was previously hard-coded to '8:00 AM' || '9:00 AM' (issue #1)
  const status = getMedStatus(med);
  const isMissed = status === 'missed';
  const isDue = status === 'due';
  // Only treat as skipped if the skip was recorded TODAY (issue #4 — don't carry yesterday's skip)
  const isSkipped = !!med.skipped && med.skipDate === todayKey();
  // Formatted clock time a dose was marked taken, e.g. "8:05 AM".
  const takenTimeLabel = (() => {
    if (!med.taken || !med.takenAt) return null;
    const t = new Date(med.takenAt);
    if (isNaN(t.getTime())) return null;
    return t.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  })();

  const statusColor = isCourseComplete ? C.textMuted : med.taken ? C.sage : isSkipped ? C.navy : isMissed ? C.red : isDue ? C.coral : C.amber;
  const statusLabel = isCourseComplete ? 'Course done' : med.taken ? (takenTimeLabel ? `Taken at ${takenTimeLabel}` : 'Taken') : isSkipped ? 'Skipped' : isMissed ? 'Missed' : isDue ? 'Due now' : 'Upcoming';
  const isPending = !!(pendingSync && pendingSync[med.id]);

  // "Taken late by 1h 20m" — compare when it was marked taken vs its scheduled
  // time (same day). A 5-minute grace keeps on-time marks clean.
  const lateLabel = (() => {
    if (!med.taken || !med.takenAt || !med.time) return null;
    const m = String(med.time).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m) return null;
    let h = parseInt(m[1], 10) % 12;
    if (m[3].toUpperCase() === 'PM') h += 12;
    const taken = new Date(med.takenAt);
    if (isNaN(taken.getTime())) return null;
    const sched = new Date(med.takenAt);
    sched.setHours(h, parseInt(m[2], 10), 0, 0);
    const diffMin = Math.floor((taken.getTime() - sched.getTime()) / 60000);
    if (diffMin < 5) return null;
    const hh = Math.floor(diffMin / 60), mm = diffMin % 60;
    return 'Taken late by ' + (hh > 0 ? hh + 'h ' : '') + (mm > 0 || hh === 0 ? mm + 'm' : '').trim();
  })();

  return (
    // Tapping a due/missed medicine opens the actionable reminder; tapping any
    // other medicine opens the edit screen (change time / reminder behaviour).
    <Card style={{ marginBottom: 10, opacity: isCourseComplete ? 0.65 : isSkipped ? 0.78 : 1 }} onClick={() => {
      if (isCourseComplete) return;
      if (!med.taken && !isSkipped && (isDue || isMissed)) { onReminderClick(med); return; }
      if (onEditMed) onEditMed(med);
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Pill icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 16, flexShrink: 0,
          background: isCourseComplete ? C.warmGrayLight : med.taken ? C.sageLight : isSkipped ? C.warmGrayLight : isMissed ? C.redLight : isDue ? C.coralLight : C.amberLight,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24
        }}>{isSkipped ? (med.skipIcon || '⊘') : med.icon}</div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: fonts.body, fontSize: 16, fontWeight: 700, color: isCourseComplete ? C.textMuted : C.text, textDecoration: isSkipped ? 'line-through' : 'none', textDecorationColor: isSkipped ? C.textMuted : undefined }}>{med.name}</span>
            {med.doseTotal > 1 && (
              <span style={{
                padding: '2px 8px', borderRadius: 8,
                background: C.coralLight, color: C.coral,
                fontFamily: fonts.body, fontSize: 10.5, fontWeight: 700,
                letterSpacing: '0.02em',
              }}>Dose {med.doseIndex}/{med.doseTotal}</span>
            )}
            <Pill color={statusColor}>{statusLabel}</Pill>
            {med.source && med.source.type === 'pharmacy' && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 8px', borderRadius: 8,
                background: C.coralLight, color: C.coral,
                fontFamily: fonts.body, fontSize: 10.5, fontWeight: 700,
              }} title={`Added by ${med.source.name}`}>🏪 Pharmacy</span>
            )}
            {isPending && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 8px', borderRadius: 8,
                background: '#FEF3DC', color: C.amber,
                fontFamily: fonts.body, fontSize: 10.5, fontWeight: 700,
                letterSpacing: '0.02em',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: C.amber,
                  animation: 'syncBlink 1.2s ease-in-out infinite',
                }} />
                Pending sync
              </span>
            )}
          </div>
          <div style={{ fontFamily: fonts.body, fontSize: 14, color: C.textMuted, marginBottom: 6 }}>{med.dose}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Tag icon="🕐">{med.time}</Tag>
            <Tag icon="🍽️">{med.meal}</Tag>
            {med.scheduleLabel && <Tag icon="📆">{med.scheduleLabel}</Tag>}
            {isCourseComplete && <Tag icon="📅">Course ended</Tag>}
            {lateLabel && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 9px', borderRadius: 8,
                background: '#FEF3DC', color: C.amber,
                fontFamily: fonts.body, fontSize: 11.5, fontWeight: 700,
              }}>⏱ {lateLabel}</span>
            )}
          </div>
          {isSkipped && med.skipReason && (
            <div style={{
              marginTop: 10, padding: '8px 10px',
              borderRadius: 10,
              background: C.warmGrayLight,
              border: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 14 }}>{med.skipIcon || '🩺'}</span>
              <span style={{ flex: 1, fontFamily: fonts.body, fontSize: 12, color: C.textMuted, lineHeight: 1.4 }}>
                Skipped — <strong style={{ color: C.text, fontWeight: 700 }}>{med.skipReason}</strong>
                {med.skipExcluded && <span style={{ color: C.sage, fontWeight: 700 }}> · excluded from adherence</span>}
              </span>
            </div>
          )}

          {/* Stopping a medicine now happens from the dose reminder ("Doctor told
              me to stop") instead of a permanent label on every card. */}
        </div>

        {/* Toggle — hidden for completed courses */}
        {!isCourseComplete && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(med.id); }}
            title={isSkipped ? 'Undo skip & mark as taken' : (med.taken ? 'Mark as not taken' : 'Mark as taken')}
            style={{
              width: 40, height: 40, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: med.taken ? C.sage : isSkipped ? 'transparent' : C.warmGrayLight,
              border: isSkipped ? `1.5px dashed ${C.warmGray}` : 'none',
              color: isSkipped ? C.textMuted : 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              flexShrink: 0, transition: 'all 0.2s'
            }}>
            {med.taken ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="5 12.5 10 17.5 19 7" /></svg>
            ) : isSkipped ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 12a8.5 8.5 0 1 0 2.8-6.3" /><polyline points="3 4 3 9 8 9" /></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.warmGray} strokeWidth="2.2" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /></svg>
            )}
          </button>
        )}
      </div>
    </Card>);
}

function CompletedCoursesSection({ meds, onToggle, onReminderClick, pendingSync }) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <div style={{ marginTop: 8 }}>
      <button onClick={() => setExpanded(v => !v)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderRadius: 12,
        border: `1px solid ${C.border}`, background: C.warmGrayLight,
        cursor: 'pointer', fontFamily: fonts.body,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>📅</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.textMuted }}>Completed courses</span>
          <span style={{ padding: '1px 7px', borderRadius: 6, background: C.border, fontSize: 11, fontWeight: 700, color: C.textMuted }}>{meds.length}</span>
        </div>
        <span style={{ color: C.textMuted, fontSize: 14, transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</span>
      </button>
      {expanded && (
        <div style={{ marginTop: 8 }}>
          {meds.map((med) =>
            <MedicineCard key={med.id} med={med} onToggle={onToggle} onReminderClick={onReminderClick} pendingSync={pendingSync} />
          )}
        </div>
      )}
    </div>
  );
}

// ── Prescriptions pushed in from the patient's linked pharmacy ──
function PharmacyInbox({ pushes, onAccept, onDismiss }) {
  const TIME_LABEL = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', night: 'Night' };
  const MEAL_LABEL = { after: 'After meal', before: 'Before meal', empty: 'Empty stomach', bedtime: 'At bedtime' };
  const timeAgo = (iso) => {
    if (!iso) return '';
    const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.round(hrs / 24)}d ago`;
  };

  return (
    <div style={{ marginBottom: 22 }}>
      <SectionHeader title="From your pharmacy" />
      {pushes.map((push) => (
        <div key={push.id} style={{
          background: C.white, borderRadius: 20, marginBottom: 12,
          border: `1px solid ${C.coral}`,
          boxShadow: '0 6px 20px rgba(29,98,166,0.14)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: C.coralLight }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14, flexShrink: 0,
              background: C.coral, color: C.white,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>🏪</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: fonts.heading, fontSize: 16, fontWeight: 700, color: C.text }}>{push.pharmacyName || 'Your pharmacy'}</span>
                <Pill color={C.coral}>New</Pill>
              </div>
              <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted, marginTop: 1 }}>
                {push.note || 'New prescription'} · {timeAgo(push.pushedAt)}
              </div>
            </div>
          </div>

          {/* Medicines */}
          <div style={{ padding: '6px 16px 4px' }}>
            {(push.meds || []).map((m, i) => {
              const times = (m.times || []).map(t => (m.customTimesMap && m.customTimesMap[t]) || TIME_LABEL[t] || t).join(' · ') || 'No time set';
              const duration = m.courseType === 'fixed' && m.courseDays ? `${m.courseDays}-day course` : 'Ongoing';
              return (
                <div key={i} style={{
                  display: 'flex', gap: 12, padding: '10px 0',
                  borderBottom: i < push.meds.length - 1 ? `1px solid ${C.border}` : 'none',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: C.coralLight, color: C.coral,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                  }}>💊</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 700, color: C.text }}>
                      {m.drug} <span style={{ color: C.textMuted, fontWeight: 600 }}>· {m.dose}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                      <Tag icon="🕐">{times}</Tag>
                      <Tag icon="🍽️">{MEAL_LABEL[m.meal] || 'After meal'}</Tag>
                      <Tag icon="📆">{duration}</Tag>
                    </div>
                    {m.instructions && (
                      <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted, marginTop: 6, fontStyle: 'italic' }}>
                        “{m.instructions}”
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, padding: '12px 16px 14px' }}>
            <Btn onClick={() => onAccept(push)} variant="primary" icon="+" style={{ flex: 1, minHeight: 48, fontSize: 15 }}>
              Add to my reminders
            </Btn>
            <Btn onClick={() => onDismiss(push)} variant="ghost" style={{ minHeight: 48, fontSize: 15, paddingLeft: 18, paddingRight: 18 }}>
              Dismiss
            </Btn>
          </div>
        </div>
      ))}
    </div>
  );
}

function HomeScreen({ onNavigate, onAddMed, onLogSymptoms, onAddAppointment, onReminderClick, onEditMed, onAppointmentReminder, userName, isNewUser, userMeds, userAppointments, onToggleMed, onStopMed, pendingSync, isOffline, pendingPushes, onAcceptPush, onDismissPush, adherenceDaily }) {
  const [fabOpen, setFabOpen] = useState(false);
  const closeFab = () => setFabOpen(false);
  const fabActions = [
    { id: 'med', icon: '💊', label: 'Add medicine',   sub: 'Pill, syrup, injection',   bg: C.coral,    onClick: () => { closeFab(); onAddMed && onAddMed(); } },
    { id: 'sym', icon: '🩹', label: 'Log symptoms',   sub: 'How are you feeling?',     bg: '#7BA3C9',  onClick: () => { closeFab(); onLogSymptoms && onLogSymptoms(); } },
    { id: 'apt', icon: '📅', label: "Doctor's visit", sub: 'Schedule an appointment',  bg: '#6FA689',  onClick: () => { closeFab(); onAddAppointment && onAddAppointment(); } },
  ];
  const meds = userMeds || (isNewUser ? [] : medicines);
  const isComplete = (m) => m.courseEndDate && new Date(m.courseEndDate) < new Date();
  const activeMeds = meds.filter(m => !isComplete(m) && m.activeToday !== false);
  const restingMeds = meds.filter(m => !isComplete(m) && m.activeToday === false);
  const completedMeds = meds.filter(m => isComplete(m));
  const taken = activeMeds.filter((m) => m.taken).length;
  // A skip only counts for today — yesterday's "Doctor advised" doesn't carry over (issue #4)
  const todayK = todayKey();
  const skipped = activeMeds.filter((m) => m.skipped && m.skipDate === todayK).length;
  const pending = activeMeds.filter((m) => !m.taken && !(m.skipped && m.skipDate === todayK)).length;
  // Doses excluded from adherence (e.g. doctor-advised skip, PRN) drop out of the denominator
  const adherenceDenom = activeMeds.filter(m => !(m.skipped && m.skipDate === todayK && m.skipExcluded)).length;
  const pct = adherenceDenom === 0 ? 0 : Math.round(taken / adherenceDenom * 100);
  // Real today value for the ring — null (not 0) when there's nothing to measure yet.
  const todayPct = adherenceDenom === 0 ? null : pct;
  // Real prior-day history from the backend (last 6 days), or empty for a new user.
  const priorHistory = (adherenceDaily || [])
    .filter(d => d.date !== todayK && d.pct != null)
    .slice(-6)
    .map(d => d.pct);
  const scrollRef = useRef(null);

  const toggleMed = (id) => onToggleMed ? onToggleMed(id) : null;

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Quick access shortcuts
  const shortcuts = [
  { icon: '📅', label: 'History', screen: 'history' },
  { icon: '📊', label: 'Analytics', screen: 'analytics' },
  { icon: '📋', label: 'Dr Report', screen: 'report' }];


  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minHeight: 0 }}>
    <div ref={scrollRef} onWheel={(e) => {
        const el = scrollRef.current;
        if (!el) return;
        const max = el.scrollHeight - el.clientHeight;
        const next = Math.max(0, Math.min(max, el.scrollTop + e.deltaY));
        if (next !== el.scrollTop) {
          el.scrollTop = next;
          if (next > 0 && next < max) e.preventDefault();
        }
      }} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: C.cream, WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', position: 'relative', touchAction: 'pan-y' }}>
      {/* Header */}
      <div style={{
          padding: '20px 20px 28px',
          background: C.coral,
          borderRadius: '0 0 28px 28px',
          position: 'relative',
          zIndex: 5
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 2 }}>{today}</div>
                <div style={{ fontFamily: fonts.heading, fontSize: 24, fontWeight: 800, color: C.white, lineHeight: 1.2 }}>
                  Good morning,<br />{userName || 'Rajesh'} 👋
                </div>
              </div>
            </div>

            {/* Rolling adherence row (improvement #2) */}
            <Card style={{ marginTop: 20, background: 'rgba(255,255,255,0.95)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <RollingAdherence history={priorHistory} today={todayPct} />
                <div style={{ flex: 1, borderLeft: `1px solid ${C.border}`, paddingLeft: 16 }}>
                  <div style={{ fontFamily: fonts.heading, fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                    {isNewUser ? 'No medicines yet' : `${taken}/${adherenceDenom} taken today`}
                  </div>
                  <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted, marginBottom: 8, lineHeight: 1.4 }}>
                    {isNewUser ? 'Add your first medicine below' : pending === 0 ? (skipped > 0 ? `All caught up ✓ · ${skipped} skipped` : 'All caught up ✓') : `${pending} pending — next at ${activeMeds.find((m) => !m.taken && !(m.skipped && m.skipDate === todayK))?.time || ''}`}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {isNewUser ?
                  <Pill color={C.coral}>🌱 Day 1</Pill> :
                  pending === 0 ?
                  <Pill color={C.sage}>On track today ✓</Pill> :
                  <Pill color={C.amber}>{pending} dose{pending > 1 ? 's' : ''} left today</Pill>
                  }
                  </div>
                </div>
              </div>
            </Card>
      </div>

      {/* Quick shortcuts */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {shortcuts.map((s) =>
            <button key={s.screen} onClick={() => onNavigate(s.screen)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '12px 4px', borderRadius: 16, border: `1px solid ${C.border}`,
              background: C.white, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(44,36,32,0.05)'
            }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <span style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 700, color: C.textMuted }}>{s.label}</span>
            </button>
            )}
        </div>
      </div>

      {/* Medicines list */}
      <div style={{ padding: '20px 20px 100px' }}>
        {/* Upcoming appointment (if any) */}
        {(() => {
          const appts = (userAppointments || [])
            .filter(a => new Date(a.date) >= new Date(new Date().setHours(0,0,0,0)))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
          const nextApt = appts[0];
          if (!nextApt) return null;
          return (
            <div style={{ marginBottom: 20 }}>
              <SectionHeader title="Upcoming" action={appts.length > 1 ? () => onNavigate('history') : undefined} actionLabel={appts.length > 1 ? `View all ${appts.length}` : undefined} />
              <UpcomingAppointmentCard
                appointment={nextApt}
                onTap={() => onAppointmentReminder && onAppointmentReminder(nextApt)}
                onOpenReminder={() => onAppointmentReminder && onAppointmentReminder(nextApt)}
              />
            </div>
          );
        })()}
        {(pendingPushes && pendingPushes.length > 0) && (
          <PharmacyInbox pushes={pendingPushes} onAccept={onAcceptPush} onDismiss={onDismissPush} />
        )}
        <SectionHeader title="Today's medicines" action={() => onNavigate('history')} actionLabel="History" />
        {activeMeds.length === 0 && completedMeds.length === 0 ?
          <div style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 80, height: 80, borderRadius: 28, background: C.coralLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>💊</div>
            <div>
              <div style={{ fontFamily: fonts.heading, fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 6 }}>No medicines yet</div>
              <div style={{ fontFamily: fonts.body, fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>Tap the + button below to add your first medicine and start tracking.</div>
            </div>
            <Btn onClick={onAddMed} icon="+" style={{ paddingLeft: 24, paddingRight: 24 }}>Add first medicine</Btn>
          </div> :
          <>
            {activeMeds.map((med) =>
              <MedicineCard key={med.id} med={med} onToggle={toggleMed} onReminderClick={onReminderClick} onEditMed={onEditMed} pendingSync={pendingSync} onRemove={onStopMed} />
            )}
            {restingMeds.length > 0 && (
              <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 14, background: C.warmGrayLight, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>📆</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: C.text }}>
                    {restingMeds.length} medicine{restingMeds.length > 1 ? 's' : ''} not scheduled today
                  </div>
                  <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted, marginTop: 1 }}>
                    {[...new Set(restingMeds.map(m => m.name))].join(', ')}
                  </div>
                </div>
              </div>
            )}
            {completedMeds.length > 0 && (
              <CompletedCoursesSection meds={completedMeds} onToggle={toggleMed} onReminderClick={onReminderClick} pendingSync={pendingSync} />
            )}
          </>
        }
      </div>
      </div>

      {/* Scrim — tap to dismiss menu */}
      {fabOpen && (
        <button
          onClick={closeFab}
          aria-label="Close menu"
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(28, 16, 8, 0.42)',
            border: 'none', cursor: 'pointer',
            zIndex: 49,
            animation: 'qaFadeIn 0.18s ease-out',
          }}
        />
      )}

      {/* Speed-dial menu items (always rendered so animations work both ways) */}
      {fabActions.map((item, i) => {
        // Stack upward: bottom-most item closest to FAB
        const offset = (fabActions.length - i) * 68; // 68px per slot
        return (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              right: 20,
              bottom: 88 + offset,
              zIndex: 51,
              display: 'flex', alignItems: 'center', gap: 12,
              pointerEvents: fabOpen ? 'auto' : 'none',
              opacity: fabOpen ? 1 : 0,
              transform: fabOpen ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.85)',
              transformOrigin: '100% 100%',
              transition: `opacity 220ms ease ${fabOpen ? (fabActions.length - 1 - i) * 45 : i * 25}ms, transform 340ms cubic-bezier(0.34, 1.56, 0.64, 1) ${fabOpen ? (fabActions.length - 1 - i) * 45 : i * 25}ms`,
            }}
          >
            <div style={{
              background: C.white,
              padding: '9px 14px', borderRadius: 12,
              boxShadow: '0 6px 18px rgba(28,16,8,0.14)',
              textAlign: 'right',
              maxWidth: 200,
            }}>
              <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.2, whiteSpace: 'nowrap' }}>{item.label}</div>
              <div style={{ fontFamily: fonts.body, fontSize: 11, color: C.textMuted, marginTop: 2, whiteSpace: 'nowrap' }}>{item.sub}</div>
            </div>
            <button
              onClick={item.onClick}
              style={{
                width: 48, height: 48, borderRadius: 16,
                background: item.bg, color: C.white,
                border: 'none', cursor: 'pointer',
                fontSize: 22, lineHeight: 1,
                boxShadow: `0 6px 20px ${item.bg}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              aria-label={item.label}
            >{item.icon}</button>
          </div>
        );
      })}

      {/* FAB — toggles the speed-dial menu */}
      <button onClick={() => setFabOpen(v => !v)} style={{
        position: 'absolute', bottom: 88, right: 20,
        width: 60, height: 60, borderRadius: 20, border: 'none',
        background: C.coral, color: C.white, fontSize: 30, fontWeight: 300,
        cursor: 'pointer', boxShadow: '0 6px 24px #1D62A655',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 52,
        lineHeight: 1,
        transform: fabOpen ? 'rotate(45deg)' : 'rotate(0deg)',
        transition: 'transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }} aria-label={fabOpen ? 'Close quick add menu' : 'Open quick add menu'}>+</button>

      <style>{`
        @keyframes qaFadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>);

}

// ── SCREEN 5: ADD MEDICINE FLOW ──
function AddMedicineScreen({ onDone, onClose, forMember }) {
  const [step, setStep] = useState(0);
  const [drug, setDrug] = useState('');
  const [doseUnit, setDoseUnit] = useState('tablet'); // 'tablet' | 'ml'
  const [doseAmount, setDoseAmount] = useState(null); // numeric value (e.g. 0.5, 1, 2.5)
  const [doseCustomOpen, setDoseCustomOpen] = useState(false);
  const [doseCustomInput, setDoseCustomInput] = useState('');
  const [times, setTimes] = useState([]);
  const [meal, setMeal] = useState('');
  const [schedule, setSchedule] = useState('daily');
  const [suggestions, setSuggestions] = useState([]);
  const [criticality, setCriticality] = useState('standard');

  const [courseType, setCourseType] = useState('ongoing'); // 'ongoing' | 'fixed'
  const [courseDays, setCourseDays] = useState(7);
  const [courseDaysInput, setCourseDaysInput] = useState('');
  const [courseCustomOpen, setCourseCustomOpen] = useState(false);

  const COURSE_PRESETS = [3, 5, 7, 10, 14, 21];
  const courseEndDate = courseType === 'fixed'
    ? new Date(Date.now() + courseDays * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  // Custom time picker state
  const [customTimes, setCustomTimes] = useState([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerHour, setPickerHour] = useState(7);
  const [pickerMinute, setPickerMinute] = useState(0);
  const [pickerAmpm, setPickerAmpm] = useState('AM');

  // Custom-frequency state (5+ times daily — generates evenly-spaced reminders)
  const [showFreqCustom, setShowFreqCustom] = useState(false);
  const [freqCustomCount, setFreqCustomCount] = useState(5);

  // Weekly schedule — which weekdays the medicine is taken (0 = Sun ... 6 = Sat)
  const [weeklyDays, setWeeklyDays] = useState([1, 3, 5]); // M, W, F by default
  const toggleWeekday = (d) => {
    setWeeklyDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort());
  };

  // Cyclic schedule — N days on, then M days off (e.g. 21 on / 7 off for contraceptives)
  const [cyclicOn, setCyclicOn]   = useState(21);
  const [cyclicOff, setCyclicOff] = useState(7);

  const formatCustomTime = (h, m, ap) => `${h}:${m.toString().padStart(2, '0')} ${ap}`;

  const addCustomTime = () => {
    const timeStr = formatCustomTime(pickerHour, pickerMinute, pickerAmpm);
    const id = `custom-${Date.now()}`;
    const newSlot = { id, label: 'Custom', time: timeStr, icon: '🕐' };
    setCustomTimes(prev => [...prev, newSlot]);
    setTimes(prev => [...prev, id]);
    setShowTimePicker(false);
  };

  const removeCustomTime = (id) => {
    setCustomTimes(prev => prev.filter(t => t.id !== id));
    setTimes(prev => prev.filter(t => t !== id));
  };

  const timeSlots = [
  { id: 'morning', label: 'Morning', time: '8:00 AM', icon: '🌅' },
  { id: 'afternoon', label: 'Afternoon', time: '1:00 PM', icon: '☀️' },
  { id: 'evening', label: 'Evening', time: '5:00 PM', icon: '🌆' },
  { id: 'night', label: 'Night', time: '9:00 PM', icon: '🌙' }];


  // Dose helpers — `dose` is derived from (doseAmount, doseUnit), not stored.
  const TABLET_PRESETS = [0.5, 1, 1.5, 2, 3];
  const ML_PRESETS     = [2.5, 5, 7.5, 10, 15, 20];
  const formatTabletAmount = (n) => (n === 0.5 ? '½' : n === 1.5 ? '1½' : String(n));
  const formatDose = (amount, unit) => {
    if (amount == null) return '';
    if (unit === 'tablet') {
      const label = amount === 1 ? 'tablet' : 'tablets';
      return `${formatTabletAmount(amount)} ${label}`;
    }
    return `${amount} ml`;
  };
  const dose = formatDose(doseAmount, doseUnit);
  const mealOptions = [
  { id: 'before', label: 'Before meal', icon: '⏱️' },
  { id: 'after', label: 'After meal', icon: '🍽️' },
  { id: 'empty', label: 'Empty stomach', icon: '🌅' },
  { id: 'bedtime', label: 'At bedtime', icon: '🌙' }];


  const handleDrugInput = (val) => {
    setDrug(val);
    if (val.length > 1) {
      setSuggestions(drugSuggestions.filter((d) => d.toLowerCase().includes(val.toLowerCase())).slice(0, 5));
    } else setSuggestions([]);
  };

  const toggleTime = (id) => {
    setTimes((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
  };

  // Frequency quick-picks — auto-select preset slots matching common dosing patterns
  const FREQUENCY_PRESETS = [
    { id: 1, label: 'Once daily',   sub: 'OD',  slots: ['morning'] },
    { id: 2, label: 'Twice daily',  sub: 'BD',  slots: ['morning', 'night'] },
    { id: 3, label: '3× daily',     sub: 'TDS', slots: ['morning', 'afternoon', 'night'] },
    { id: 4, label: '4× daily',     sub: 'QID', slots: ['morning', 'afternoon', 'evening', 'night'] },
  ];

  const applyFrequency = (slots) => {
    // A frequency preset defines the FULL schedule — replace everything (presets + customs).
    // This avoids confusing combined states (e.g. 4 custom + 4 preset = "8× / day" with
    // both the "4× daily" chip and individual custom slots all looking active at once).
    setCustomTimes([]);
    setTimes(slots);
  };

  // Generate N evenly-spaced reminders between 7:00 AM and 11:00 PM (16-hour waking window)
  // Replaces all current preset + custom selections with the generated schedule.
  const applyCustomFrequency = (count) => {
    const startMin = 7 * 60;        // 7:00 AM
    const endMin   = 23 * 60;       // 11:00 PM
    const step     = count === 1 ? 0 : (endMin - startMin) / (count - 1);

    const baseId = Date.now();
    const generated = Array.from({ length: count }, (_, i) => {
      const totalMin = Math.round(startMin + step * i);
      let h24 = Math.floor(totalMin / 60);
      let m   = totalMin % 60;
      // round minutes to nearest 5 for clean times
      m = Math.round(m / 5) * 5;
      if (m === 60) { m = 0; h24 += 1; }
      const ap = h24 >= 12 ? 'PM' : 'AM';
      const h12 = ((h24 + 11) % 12) + 1;
      const timeStr = `${h12}:${m.toString().padStart(2, '0')} ${ap}`;
      return { id: `custom-${baseId}-${i}`, label: 'Custom', time: timeStr, icon: '🕐' };
    });

    setCustomTimes(generated);
    setTimes(generated.map((g) => g.id));
  };

  // Detect which frequency chip matches the current dose count (regardless of preset vs custom origin).
  // This matches user expectation: "4 doses scheduled" → "4× daily" chip highlights, no matter
  // whether those are preset slots, custom times, or a mix.
  const matchingFrequency = FREQUENCY_PRESETS.find((f) => f.id === times.length);

  // Custom-frequency chip is "active" when total doses are 5 or more (the Custom expander's range)
  const customFreqActive = times.length >= 5;

  const steps = ['Medicine', 'Dose', 'Schedule', 'Duration', 'Meal', 'Priority'];

  return (
    <div style={{ flex: 1, minHeight: 0, background: C.cream, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <button onClick={step === 0 ? onClose : () => setStep((s) => s - 1)} style={{ width: 40, height: 40, borderRadius: 12, background: C.warmGrayLight, border: 'none', fontSize: 18, cursor: 'pointer' }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: fonts.heading, fontSize: 18, fontWeight: 700, color: C.text }}>Add Medicine</div>
          <div style={{ fontFamily: fonts.body, fontSize: 12, color: forMember ? C.coral : C.textMuted, fontWeight: forMember ? 600 : 400 }}>{forMember ? `For ${forMember.name}` : `Step ${step + 1} of 6 — ${steps[step]}`}</div>
        </div>
        <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: 12, background: C.warmGrayLight, border: 'none', fontSize: 16, cursor: 'pointer' }}>✕</button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: C.border }}>
        <div style={{ height: 4, background: C.coral, width: `${(step + 1) / 6 * 100}%`, transition: 'width 0.3s', borderRadius: 2 }} />
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', padding: '24px 20px' }}>

        {/* Step 0: Medicine name */}
        {step === 0 &&
        <div>
            <h3 style={{ fontFamily: fonts.heading, fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 6 }}>Which medicine?</h3>
            <p style={{ fontFamily: fonts.body, fontSize: 14, color: C.textMuted, marginBottom: 20 }}>Search from Indian drug database</p>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <input
              value={drug} onChange={(e) => handleDrugInput(e.target.value)}
              placeholder="e.g. Metformin, Amlodipine..."
              style={{
                width: '100%', height: 52, padding: '0 16px 0 44px', borderRadius: 14,
                border: `2px solid ${drug ? C.coral : C.border}`, background: C.white,
                fontFamily: fonts.body, fontSize: 16, outline: 'none', boxSizing: 'border-box'
              }} />
            
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 20 }}>🔍</span>
            </div>
            {suggestions.length > 0 &&
          <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden', marginBottom: 16 }}>
                {suggestions.map((s, i) =>
            <div key={i} onClick={() => {setDrug(s);setSuggestions([]);}}
            style={{ padding: '14px 16px', borderBottom: i < suggestions.length - 1 ? `1px solid ${C.border}` : 'none', cursor: 'pointer', fontFamily: fonts.body, fontSize: 15, color: C.text }}>
                    💊 {s}
                  </div>
            )}
              </div>
          }
            {/* DRUG INTERACTIONS — hidden, re-enable when ready
            {drug.toLowerCase().includes('aspirin') &&
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
          }
            */}

          </div>
        }
        {step === 1 &&
        <div>
            <h3 style={{ fontFamily: fonts.heading, fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 6 }}>What's the dose?</h3>
            <p style={{ fontFamily: fonts.body, fontSize: 14, color: C.textMuted, marginBottom: 20 }}>Pick the form first, then the amount</p>

            {/* Unit selector — tablets or millilitres */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              {[
                { id: 'tablet', icon: '💊', label: 'Tablets',     sub: 'Pills, capsules' },
                { id: 'ml',     icon: '🥄', label: 'Millilitres', sub: 'Syrup, drops' },
              ].map((u) => {
                const active = doseUnit === u.id;
                return (
                  <button key={u.id} onClick={() => { setDoseUnit(u.id); setDoseAmount(null); setDoseCustomOpen(false); setDoseCustomInput(''); }} style={{
                    flex: 1, padding: '14px 12px', borderRadius: 16, cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 12,
                    border: `2px solid ${active ? C.coral : C.border}`,
                    background: active ? C.coralLight : C.white,
                    transition: 'all 0.15s',
                  }}>
                    <span style={{ fontSize: 26, lineHeight: 1 }}>{u.icon}</span>
                    <div>
                      <div style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 700, color: active ? C.coral : C.text }}>{u.label}</div>
                      <div style={{ fontFamily: fonts.body, fontSize: 11, color: C.textMuted, marginTop: 2 }}>{u.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Amount quick-picks */}
            <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: C.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              How much per dose?
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
              {(doseUnit === 'tablet' ? TABLET_PRESETS : ML_PRESETS).map((amt) => {
                const active = doseAmount === amt && !doseCustomOpen;
                const label = doseUnit === 'tablet'
                  ? `${formatTabletAmount(amt)} ${amt === 1 ? 'tablet' : 'tablets'}`
                  : `${amt} ml`;
                return (
                  <button key={amt} onClick={() => { setDoseAmount(amt); setDoseCustomOpen(false); setDoseCustomInput(''); }} style={{
                    padding: '11px 16px', borderRadius: 14,
                    border: `2px solid ${active ? C.coral : C.border}`,
                    background: active ? C.coralLight : C.white,
                    color: active ? C.coral : C.text,
                    fontFamily: fonts.body, fontSize: 15, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.12s',
                  }}>{label}</button>
                );
              })}

              {/* Custom amount — opens a small numeric input */}
              {!doseCustomOpen ? (
                <button onClick={() => { setDoseCustomOpen(true); setDoseCustomInput(doseAmount != null && !((doseUnit === 'tablet' ? TABLET_PRESETS : ML_PRESETS).includes(doseAmount)) ? String(doseAmount) : ''); }} style={{
                  padding: '11px 16px', borderRadius: 14,
                  border: `2px dashed ${doseAmount != null && !((doseUnit === 'tablet' ? TABLET_PRESETS : ML_PRESETS).includes(doseAmount)) ? C.coral : C.border}`,
                  background: doseAmount != null && !((doseUnit === 'tablet' ? TABLET_PRESETS : ML_PRESETS).includes(doseAmount)) ? C.coralLight : 'transparent',
                  color: doseAmount != null && !((doseUnit === 'tablet' ? TABLET_PRESETS : ML_PRESETS).includes(doseAmount)) ? C.coral : C.textMuted,
                  fontFamily: fonts.body, fontSize: 15, fontWeight: 600, cursor: 'pointer',
                }}>
                  {doseAmount != null && !((doseUnit === 'tablet' ? TABLET_PRESETS : ML_PRESETS).includes(doseAmount))
                    ? `${doseUnit === 'tablet' ? formatTabletAmount(doseAmount) : doseAmount} ${doseUnit === 'tablet' ? (doseAmount === 1 ? 'tablet' : 'tablets') : 'ml'} ✎`
                    : '+ custom'}
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 14, border: `2px solid ${C.coral}`, background: C.coralLight }}>
                  <input autoFocus type="number" min={0} step={doseUnit === 'tablet' ? 0.5 : 0.5}
                    value={doseCustomInput}
                    onChange={(e) => setDoseCustomInput(e.target.value.replace(/[^0-9.]/g, ''))}
                    onBlur={() => {
                      const v = parseFloat(doseCustomInput);
                      if (!isNaN(v) && v > 0 && v <= 999) setDoseAmount(v);
                      setDoseCustomOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const v = parseFloat(doseCustomInput);
                        if (!isNaN(v) && v > 0 && v <= 999) setDoseAmount(v);
                        setDoseCustomOpen(false);
                      }
                      if (e.key === 'Escape') setDoseCustomOpen(false);
                    }}
                    placeholder="—"
                    style={{ width: 56, height: 32, padding: 0, border: 'none', outline: 'none', background: 'transparent',
                      fontFamily: fonts.body, fontSize: 15, fontWeight: 800, color: C.coral, textAlign: 'center' }} />
                  <span style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: C.coral }}>
                    {doseUnit === 'tablet' ? 'tab' : 'ml'}
                  </span>
                </div>
              )}
            </div>

            {/* Preview line */}
            {doseAmount != null && (
              <div style={{ marginTop: 4, padding: '10px 14px', borderRadius: 12, background: C.sageLight, border: `1px solid ${C.sage}33`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>{doseUnit === 'tablet' ? '💊' : '🥄'}</span>
                <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.text }}>
                  Each dose: <strong>{formatDose(doseAmount, doseUnit)}</strong>
                </div>
              </div>
            )}

            <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 12, background: C.warmGrayLight, fontFamily: fonts.body, fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
              💡 This is <strong>how much</strong> to take per dose — not the strength. Strength like "500mg" or "5mg" belongs with the medicine name (Step 1).
            </div>
          </div>
        }

        {/* Step 2: Schedule */}
        {step === 2 &&
        <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
              <h3 style={{ fontFamily: fonts.heading, fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>When to take it?</h3>
              {times.length > 0 && (
                <div style={{
                  padding: '6px 12px', borderRadius: 999,
                  background: C.coralLight, border: `1px solid ${C.coral}`,
                  fontFamily: fonts.body, fontSize: 12, fontWeight: 700, color: C.coral,
                  whiteSpace: 'nowrap', flexShrink: 0, marginTop: 2,
                }}>{times.length}× / day</div>
              )}
            </div>
            <p style={{ fontFamily: fonts.body, fontSize: 14, color: C.textMuted, marginBottom: 16 }}>Tap a frequency to auto-fill, or pick slots one by one</p>

            {/* Frequency quick-picks */}
            <div style={{ display: 'flex', gap: 8, marginBottom: showFreqCustom ? 12 : 22, flexWrap: 'wrap' }}>
              {FREQUENCY_PRESETS.map((f) => {
                const active = matchingFrequency?.id === f.id && !showFreqCustom;
                return (
                  <button key={f.id} onClick={() => { setShowFreqCustom(false); applyFrequency(f.slots); }} style={{
                    flex: '1 1 0', minWidth: 60, padding: '10px 6px', borderRadius: 12,
                    border: `2px solid ${active ? C.coral : C.border}`,
                    background: active ? C.coralLight : C.white,
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    transition: 'all 0.15s',
                  }}>
                    <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: active ? C.coral : C.text, lineHeight: 1.15 }}>{f.label}</div>
                    <div style={{ fontFamily: fonts.body, fontSize: 10, fontWeight: 600, color: C.textMuted, letterSpacing: 0.4 }}>{f.sub}</div>
                  </button>
                );
              })}
              {/* Custom (5+) chip */}
              <button onClick={() => setShowFreqCustom((v) => !v)} style={{
                flex: '1 1 0', minWidth: 60, padding: '10px 6px', borderRadius: 12,
                border: `2px solid ${(showFreqCustom || customFreqActive) ? C.coral : C.border}`,
                background: (showFreqCustom || customFreqActive) ? C.coralLight : C.white,
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                transition: 'all 0.15s',
              }}>
                <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: (showFreqCustom || customFreqActive) ? C.coral : C.text, lineHeight: 1.15 }}>Custom</div>
                <div style={{ fontFamily: fonts.body, fontSize: 10, fontWeight: 600, color: C.textMuted, letterSpacing: 0.4 }}>any count</div>
              </button>
            </div>

            {/* Custom-frequency expander */}
            {showFreqCustom && (
              <div style={{
                borderRadius: 16, border: `2px solid ${C.coral}`, background: C.coralLight,
                padding: '14px 16px', marginBottom: 22,
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: C.text }}>How many times per day?</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <button onClick={() => setFreqCustomCount((n) => Math.max(1, n - 1))} disabled={freqCustomCount <= 1} style={{
                    width: 40, height: 40, borderRadius: 12,
                    border: `2px solid ${freqCustomCount <= 1 ? C.border : C.coral}`,
                    background: C.white, fontSize: 20, fontWeight: 700,
                    color: freqCustomCount <= 1 ? C.textMuted : C.coral,
                    cursor: freqCustomCount <= 1 ? 'not-allowed' : 'pointer',
                  }}>−</button>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontFamily: fonts.heading, fontSize: 32, fontWeight: 800, color: C.coral, lineHeight: 1 }}>{freqCustomCount}</span>
                    <span style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: C.textMuted }}>{freqCustomCount === 1 ? 'time / day' : 'times / day'}</span>
                  </div>
                  <button onClick={() => setFreqCustomCount((n) => Math.min(12, n + 1))} disabled={freqCustomCount >= 12} style={{
                    width: 40, height: 40, borderRadius: 12,
                    border: `2px solid ${freqCustomCount >= 12 ? C.border : C.coral}`,
                    background: C.white, fontSize: 20, fontWeight: 700,
                    color: freqCustomCount >= 12 ? C.textMuted : C.coral,
                    cursor: freqCustomCount >= 12 ? 'not-allowed' : 'pointer',
                  }}>+</button>
                </div>
                <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
                  Reminders will be spaced evenly between <strong style={{ color: C.text }}>7:00 AM</strong> and <strong style={{ color: C.text }}>11:00 PM</strong>. You can fine-tune individual times below.
                </div>
                <Btn onClick={() => { applyCustomFrequency(freqCustomCount); setShowFreqCustom(false); }} style={{ minHeight: 42, fontSize: 14 }}>
                  ✓ Generate {freqCustomCount}-time schedule
                </Btn>
              </div>
            )}

            <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: C.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 }}>Times of day · pick any combination</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>

              {/* Preset time slots */}
              {timeSlots.map((t) =>
            <button key={t.id} onClick={() => toggleTime(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px',
              borderRadius: 16, border: `2px solid ${times.includes(t.id) ? C.coral : C.border}`,
              background: times.includes(t.id) ? C.coralLight : C.white, cursor: 'pointer'
            }}>
                  <span style={{ fontSize: 28 }}>{t.icon}</span>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ fontFamily: fonts.body, fontSize: 16, fontWeight: 700, color: times.includes(t.id) ? C.coral : C.text }}>{t.label}</div>
                    <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted }}>{t.time}</div>
                  </div>
                  {times.includes(t.id) && <span style={{ fontSize: 20, color: C.coral }}>✓</span>}
                </button>
            )}

              {/* Added custom time slots */}
              {customTimes.map((t) =>
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px',
              borderRadius: 16,
              border: `2px solid ${times.includes(t.id) ? C.coral : C.border}`,
              background: times.includes(t.id) ? C.coralLight : C.white,
            }}>
                  <button onClick={() => toggleTime(t.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 16, flex: 1,
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left',
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                      background: times.includes(t.id) ? C.coral : C.warmGrayLight,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                      transition: 'background 0.2s',
                    }}>🕐</div>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <div style={{ fontFamily: fonts.body, fontSize: 16, fontWeight: 700, color: times.includes(t.id) ? C.coral : C.text }}>Custom</div>
                      <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted }}>{t.time}</div>
                    </div>
                    {times.includes(t.id) && <span style={{ fontSize: 20, color: C.coral }}>✓</span>}
                  </button>
                  <button onClick={() => removeCustomTime(t.id)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: C.textMuted, fontSize: 18, lineHeight: 1, padding: '4px 2px', flexShrink: 0,
                  }} title="Remove">×</button>
                </div>
            )}

              {/* Add custom time — button or inline picker */}
              {!showTimePicker ? (
                <button onClick={() => { setPickerHour(7); setPickerMinute(0); setPickerAmpm('AM'); setShowTimePicker(true); }} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                  borderRadius: 16, border: `2px dashed ${C.border}`,
                  background: 'transparent', cursor: 'pointer',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: C.warmGrayLight,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
                  }}>🕐</div>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 600, color: C.textMuted }}>Add custom time</div>
                    <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>Set a specific hour &amp; minute</div>
                  </div>
                  <span style={{ fontSize: 24, color: C.coral, fontWeight: 300, lineHeight: 1 }}>+</span>
                </button>
              ) : (
                <div style={{
                  borderRadius: 18, border: `2px solid ${C.coral}`,
                  background: C.coralLight, padding: '18px 18px 14px',
                  display: 'flex', flexDirection: 'column', gap: 16,
                }}>
                  <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.text }}>Set custom time</div>

                  {/* Spinner row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>

                    {/* Hour spinner */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <button onClick={() => setPickerHour(h => h === 12 ? 1 : h + 1)} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, width: 44, height: 32, cursor: 'pointer', fontSize: 16, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▲</button>
                      <div style={{ width: 64, height: 52, background: C.white, borderRadius: 12, border: `2px solid ${C.coral}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.heading, fontSize: 26, fontWeight: 800, color: C.text }}>{pickerHour}</div>
                      <button onClick={() => setPickerHour(h => h === 1 ? 12 : h - 1)} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, width: 44, height: 32, cursor: 'pointer', fontSize: 16, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▼</button>
                    </div>

                    <div style={{ fontFamily: fonts.heading, fontSize: 30, fontWeight: 800, color: C.text, marginBottom: 4, flexShrink: 0 }}>:</div>

                    {/* Minute spinner */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <button onClick={() => setPickerMinute(m => (m + 5) % 60)} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, width: 44, height: 32, cursor: 'pointer', fontSize: 16, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▲</button>
                      <div style={{ width: 64, height: 52, background: C.white, borderRadius: 12, border: `2px solid ${C.coral}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.heading, fontSize: 26, fontWeight: 800, color: C.text }}>{pickerMinute.toString().padStart(2, '0')}</div>
                      <button onClick={() => setPickerMinute(m => (m - 5 + 60) % 60)} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, width: 44, height: 32, cursor: 'pointer', fontSize: 16, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▼</button>
                    </div>

                    {/* AM / PM toggle */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 10 }}>
                      {['AM', 'PM'].map(ap => (
                        <button key={ap} onClick={() => setPickerAmpm(ap)} style={{
                          width: 52, height: 36, borderRadius: 10,
                          border: `2px solid ${pickerAmpm === ap ? C.coral : C.border}`,
                          background: pickerAmpm === ap ? C.coral : C.white,
                          color: pickerAmpm === ap ? C.white : C.textMuted,
                          fontFamily: fonts.body, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}>{ap}</button>
                      ))}
                    </div>
                  </div>

                  {/* Preview label */}
                  <div style={{ textAlign: 'center', fontFamily: fonts.body, fontSize: 13, color: C.textMuted }}>
                    Reminder will fire at <strong style={{ color: C.text }}>{formatCustomTime(pickerHour, pickerMinute, pickerAmpm)}</strong>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setShowTimePicker(false)} style={{
                      flex: 1, height: 46, borderRadius: 12, border: `1px solid ${C.border}`,
                      background: C.white, fontFamily: fonts.body, fontSize: 14, fontWeight: 600,
                      color: C.textMuted, cursor: 'pointer',
                    }}>Cancel</button>
                    <Btn onClick={addCustomTime} style={{ flex: 2, minHeight: 46, fontSize: 15 }}>✓ Set time</Btn>
                  </div>
                </div>
              )}

            </div>

            <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 12 }}>Schedule type</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Daily', 'Weekly', 'Cyclic'].map((s) =>
            <button key={s} onClick={() => setSchedule(s.toLowerCase())} style={{
              flex: 1, padding: '12px 8px', borderRadius: 12,
              border: `2px solid ${schedule === s.toLowerCase() ? C.coral : C.border}`,
              background: schedule === s.toLowerCase() ? C.coralLight : C.white,
              color: schedule === s.toLowerCase() ? C.coral : C.text,
              fontFamily: fonts.body, fontSize: 14, fontWeight: 600, cursor: 'pointer'
            }}>{s}</button>
            )}
            </div>

            {/* Weekly: day-of-week picker */}
            {schedule === 'weekly' && (
              <div style={{ marginTop: 14, padding: '14px 14px 16px', borderRadius: 14, background: C.warmGrayLight, border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: C.text }}>Which days?</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setWeeklyDays([1,2,3,4,5])} style={{
                      padding: '4px 10px', borderRadius: 8, border: `1px solid ${C.border}`,
                      background: C.white, fontFamily: fonts.body, fontSize: 11, fontWeight: 600,
                      color: C.textMuted, cursor: 'pointer',
                    }}>Weekdays</button>
                    <button onClick={() => setWeeklyDays([0,6])} style={{
                      padding: '4px 10px', borderRadius: 8, border: `1px solid ${C.border}`,
                      background: C.white, fontFamily: fonts.body, fontSize: 11, fontWeight: 600,
                      color: C.textMuted, cursor: 'pointer',
                    }}>Weekend</button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((letter, i) => {
                    const active = weeklyDays.includes(i);
                    return (
                      <button key={i} onClick={() => toggleWeekday(i)} style={{
                        flex: 1, aspectRatio: '1 / 1', maxWidth: 44, borderRadius: 12,
                        border: `2px solid ${active ? C.coral : C.border}`,
                        background: active ? C.coral : C.white,
                        color: active ? C.white : C.textMuted,
                        fontFamily: fonts.body, fontSize: 14, fontWeight: 700,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}>{letter}</button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 10, fontFamily: fonts.body, fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
                  {weeklyDays.length === 0
                    ? <span style={{ color: C.red, fontWeight: 600 }}>⚠ Pick at least one day</span>
                    : <>Reminders fire on <strong style={{ color: C.text }}>{weeklyDays.length} day{weeklyDays.length > 1 ? 's' : ''}</strong> a week</>}
                </div>
              </div>
            )}

            {/* Cyclic: on/off day inputs */}
            {schedule === 'cyclic' && (
              <div style={{ marginTop: 14, padding: '14px 14px 16px', borderRadius: 14, background: C.warmGrayLight, border: `1px solid ${C.border}` }}>
                <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Cycle pattern</div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ flex: 1, padding: '10px 12px', borderRadius: 12, background: C.white, border: `2px solid ${C.coral}` }}>
                    <div style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>On</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <input type="number" min={1} max={365} value={cyclicOn}
                        onChange={(e) => setCyclicOn(Math.max(1, Math.min(365, parseInt(e.target.value, 10) || 1)))}
                        style={{ width: 48, padding: 0, border: 'none', outline: 'none', background: 'transparent',
                          fontFamily: fonts.heading, fontSize: 22, fontWeight: 800, color: C.coral }} />
                      <span style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>days</span>
                    </div>
                  </div>
                  <div style={{ fontFamily: fonts.heading, fontSize: 18, fontWeight: 700, color: C.textMuted }}>→</div>
                  <div style={{ flex: 1, padding: '10px 12px', borderRadius: 12, background: C.white, border: `2px solid ${C.border}` }}>
                    <div style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Off</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <input type="number" min={0} max={365} value={cyclicOff}
                        onChange={(e) => setCyclicOff(Math.max(0, Math.min(365, parseInt(e.target.value, 10) || 0)))}
                        style={{ width: 48, padding: 0, border: 'none', outline: 'none', background: 'transparent',
                          fontFamily: fonts.heading, fontSize: 22, fontWeight: 800, color: C.text }} />
                      <span style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>days</span>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { label: '21 / 7',  on: 21, off: 7,  sub: 'Contraceptive' },
                    { label: '5 / 2',   on: 5,  off: 2,  sub: 'Mon–Fri rest' },
                    { label: '14 / 14', on: 14, off: 14, sub: 'Alternating' },
                  ].map((p) => {
                    const active = cyclicOn === p.on && cyclicOff === p.off;
                    return (
                      <button key={p.label} onClick={() => { setCyclicOn(p.on); setCyclicOff(p.off); }} style={{
                        padding: '6px 10px', borderRadius: 10,
                        border: `2px solid ${active ? C.coral : C.border}`,
                        background: active ? C.coralLight : C.white,
                        fontFamily: fonts.body, fontSize: 11, fontWeight: 700,
                        color: active ? C.coral : C.textMuted, cursor: 'pointer',
                      }}>{p.label} <span style={{ fontWeight: 500, opacity: 0.7 }}>· {p.sub}</span></button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 10, fontFamily: fonts.body, fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
                  Take for <strong style={{ color: C.text }}>{cyclicOn}</strong> day{cyclicOn !== 1 ? 's' : ''}, then pause for <strong style={{ color: C.text }}>{cyclicOff}</strong> day{cyclicOff !== 1 ? 's' : ''}. Cycle repeats.
                </div>
              </div>
            )}

          </div>
        }

        {/* Step 3: Duration */}
        {step === 3 &&
        <div>
            <h3 style={{ fontFamily: fonts.heading, fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 6 }}>How long to take it?</h3>
            <p style={{ fontFamily: fonts.body, fontSize: 14, color: C.textMuted, marginBottom: 20 }}>Ongoing for chronic medicines, or a fixed course like antibiotics.</p>
            <div>
              <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 12 }}>Course duration</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { id: 'ongoing', label: 'Ongoing',      sub: 'Chronic / long-term' },
                  { id: 'fixed',   label: 'Fixed course',  sub: 'e.g. antibiotics' },
                ].map(opt => (
                  <button key={opt.id} onClick={() => setCourseType(opt.id)} style={{
                    flex: 1, padding: '12px 10px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                    border: `2px solid ${courseType === opt.id ? C.coral : C.border}`,
                    background: courseType === opt.id ? C.coralLight : C.white,
                  }}>
                    <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: courseType === opt.id ? C.coral : C.text }}>{opt.label}</div>
                    <div style={{ fontFamily: fonts.body, fontSize: 11, color: C.textMuted, marginTop: 2 }}>{opt.sub}</div>
                  </button>
                ))}
              </div>

              {courseType === 'fixed' && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 10 }}>Number of days</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {COURSE_PRESETS.map(d => (
                      <button key={d} onClick={() => { setCourseDays(d); setCourseCustomOpen(false); setCourseDaysInput(''); }} style={{
                        padding: '7px 13px', borderRadius: 10,
                        border: `2px solid ${courseDays === d && !courseCustomOpen ? C.coral : C.border}`,
                        background: courseDays === d && !courseCustomOpen ? C.coralLight : C.white,
                        fontFamily: fonts.body, fontSize: 13, fontWeight: 700,
                        color: courseDays === d && !courseCustomOpen ? C.coral : C.textMuted,
                        cursor: 'pointer', transition: 'all 0.12s',
                      }}>{d}d</button>
                    ))}
                    {!courseCustomOpen ? (
                      <button onClick={() => { setCourseCustomOpen(true); setCourseDaysInput(String(courseDays)); }} style={{
                        padding: '7px 13px', borderRadius: 10,
                        border: `2px dashed ${!COURSE_PRESETS.includes(courseDays) ? C.coral : C.border}`,
                        background: !COURSE_PRESETS.includes(courseDays) ? C.coralLight : 'transparent',
                        fontFamily: fonts.body, fontSize: 13, fontWeight: 700,
                        color: !COURSE_PRESETS.includes(courseDays) ? C.coral : C.textMuted, cursor: 'pointer',
                      }}>
                        {!COURSE_PRESETS.includes(courseDays) ? `${courseDays}d ✎` : '…'}
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input autoFocus value={courseDaysInput}
                          onChange={e => setCourseDaysInput(e.target.value.replace(/[^0-9]/g,''))}
                          onBlur={() => { const v=parseInt(courseDaysInput,10); if(v>=1&&v<=365) setCourseDays(v); setCourseCustomOpen(false); }}
                          onKeyDown={e => { if(e.key==='Enter'){ const v=parseInt(courseDaysInput,10); if(v>=1&&v<=365) setCourseDays(v); setCourseCustomOpen(false); } if(e.key==='Escape') setCourseCustomOpen(false); }}
                          placeholder="—"
                          style={{ width:44, height:30, padding:'0 6px', borderRadius:8, border:`2px solid ${C.coral}`, background:C.coralLight, fontFamily:fonts.body, fontSize:13, fontWeight:800, color:C.coral, outline:'none', textAlign:'center' }}
                        />
                        <span style={{ fontFamily:fonts.body, fontSize:12, color:C.textMuted }}>d</span>
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 12, background: C.amberLight, border: `1px solid ${C.amber}33`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>📅</span>
                    <div>
                      <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: C.text }}>Ends on {courseEndDate}</div>
                      <div style={{ fontFamily: fonts.body, fontSize: 11, color: C.textMuted, marginTop: 1 }}>Reminders stop automatically after this date</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        }

        {/* Step 4: Meal */}
        {step === 4 &&
        <div>
            <h3 style={{ fontFamily: fonts.heading, fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 6 }}>Meal context</h3>
            <p style={{ fontFamily: fonts.body, fontSize: 14, color: C.textMuted, marginBottom: 20 }}>When should this be taken relative to food?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {mealOptions.map((m) =>
            <button key={m.id} onClick={() => setMeal(m.id)} style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px',
              borderRadius: 16, border: `2px solid ${meal === m.id ? C.coral : C.border}`,
              background: meal === m.id ? C.coralLight : C.white, cursor: 'pointer'
            }}>
                  <span style={{ fontSize: 28 }}>{m.icon}</span>
                  <span style={{ fontFamily: fonts.body, fontSize: 16, fontWeight: 600, color: meal === m.id ? C.coral : C.text, flex: 1, textAlign: 'left' }}>{m.label}</span>
                  {meal === m.id && <span style={{ fontSize: 20, color: C.coral }}>✓</span>}
                </button>
            )}
            </div>
          </div>
        }
        {/* Step 5: Criticality — improvement #5 */}
        {step === 5 &&
        <div>
            <h3 style={{ fontFamily: fonts.heading, fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 6 }}>How critical is this medicine?</h3>
            <p style={{ fontFamily: fonts.body, fontSize: 14, color: C.textMuted, marginBottom: 20 }}>This controls how aggressively we'll alert you</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
            { id: 'critical', icon: '🚨', label: 'Critical', desc: 'Push → loud alarm → phone call → family alert', color: C.red, bg: C.redLight },
            { id: 'standard', icon: '🔔', label: 'Standard', desc: 'Push → louder alarm. No phone calls.', color: C.coral, bg: C.coralLight },
            { id: 'gentle', icon: '🌱', label: 'Gentle', desc: 'Single push reminder. No escalation.', color: C.sage, bg: C.sageLight }].
            map((opt) =>
            <button key={opt.id} onClick={() => setCriticality(opt.id)} style={{
              display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 18px',
              borderRadius: 16, border: `2px solid ${criticality === opt.id ? opt.color : C.border}`,
              background: criticality === opt.id ? opt.bg : C.white, cursor: 'pointer', textAlign: 'left'
            }}>
                  <span style={{ fontSize: 28 }}>{opt.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: fonts.body, fontSize: 16, fontWeight: 700, color: criticality === opt.id ? opt.color : C.text, marginBottom: 4 }}>{opt.label}</div>
                    <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted, lineHeight: 1.4 }}>{opt.desc}</div>
                  </div>
                  {criticality === opt.id && <span style={{ fontSize: 20, color: opt.color }}>✓</span>}
                </button>
            )}
            </div>
            <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12, background: C.warmGrayLight, fontFamily: fonts.body, fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
              💡 Vitamins and supplements work best as <strong>Gentle</strong>. Blood thinners and BP meds should usually be <strong>Critical</strong>.
            </div>
          </div>
        }
      </div>

      {/* Next button */}
      <div style={{ padding: '12px 20px 24px', flexShrink: 0 }}>
        <Btn
          onClick={step < 5 ? () => setStep((s) => s + 1) : () => {
            const customTimesMap = Object.fromEntries(customTimes.map(t => [t.id, t.time]));
            onDone({
              drug, dose, times, meal, criticality, customTimesMap, courseType, courseDays,
              schedule,
              weeklyDays: schedule === 'weekly' ? weeklyDays : null,
              cyclicOn:   schedule === 'cyclic' ? cyclicOn   : null,
              cyclicOff:  schedule === 'cyclic' ? cyclicOff  : null,
            });
          }}
          disabled={
            step === 0 && !drug ||
            step === 1 && !dose ||
            step === 2 && (times.length === 0 || (schedule === 'weekly' && weeklyDays.length === 0)) ||
            step === 3 && courseType === 'fixed' && (!courseDays || courseDays < 1) ||
            step === 4 && !meal
          }>
          
          {step < 4 ? 'Next step' : '✓ Add Medicine'}
        </Btn>
      </div>
    </div>);

}

// ── SCREEN: LOGIN / SIGN UP ──
function AuthScreen({ onLogin, onSignUp, showDemoHints = false, invite = null, joinPharmacy = null }) {
  // An invite to a number that already has an account opens LOG IN (phone
  // prefilled); everyone else arriving via a link starts at sign-up.
  const [mode, setMode] = useState(
    (invite && invite.existing) ? 'login' : (invite || joinPharmacy) ? 'signup' : 'welcome'
  ); // 'welcome' | 'login' | 'signup'
  const [phone, setPhone] = useState((invite && invite.existing && invite.phone) || '');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [name, setName] = useState(invite?.name || '');
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

  const [devCode, setDevCode] = useState('');
  const [busy, setBusy] = useState(false);

  const sendOtp = async () => {
    if (phone.length !== 10) {setError('Enter a valid 10-digit number');return;}
    setError('');
    const api = window.SaathiPillAPI;
    if (api && api.enabled) {
      setBusy(true);
      try {
        const res = await api.requestOtp('+91 ' + phone, mode === 'signup' ? name : undefined);
        if (res && res.devCode) setDevCode(res.devCode); // shown only in dev mode
        setOtpSent(true);
      } catch (e) { setError(e.message || 'Could not send code'); }
      finally { setBusy(false); }
      return;
    }
    setOtpSent(true); // demo/offline: any 4 digits work
  };

  const verifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 4) {setError('Enter the 4-digit OTP');return;}
    setError('');
    const api = window.SaathiPillAPI;
    if (api && api.enabled) {
      setBusy(true);
      let data = null;
      try {
        data = await api.verifyOtp('+91 ' + phone, code, 'patient');
      } catch (e) { setError(e.message || 'Incorrect code'); setBusy(false); return; }
      setBusy(false);
      // The backend says whether this phone already had an account. Trust that
      // over which tab the user picked — someone with an account who follows an
      // invite link (which opens sign-up) must land in their existing data,
      // not in onboarding with an empty medicine list.
      if (data && typeof data.isNew === 'boolean') {
        if (data.isNew) onSignUp(name); else onLogin();
        return;
      }
    }
    if (mode === 'login') onLogin();else
    onSignUp(name);
  };

  const inputStyle = {
    width: '100%', height: 52, padding: '0 16px', borderRadius: 14,
    border: `2px solid ${C.border}`, background: C.white,
    fontFamily: fonts.body, fontSize: 16, color: C.text,
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s'
  };

  // Human-readable summary of what the invite grants. `perm` is a comma-separated
  // list of permission IDs (with back-compat for the old "view"/"mark" values).
  const invitePermPhrase = (() => {
    const WORDS = {
      view_schedule: 'view their schedule',
      view_adherence: 'see their adherence',
      view_health: 'view their health info',
      mark_doses: 'mark doses for them',
      add_medicines: 'add medicines for them',
      view: 'view their schedule and adherence',
      mark: 'mark doses for them',
    };
    const parts = (invite?.perm || '')
      .split(',').map((s) => s.trim()).filter(Boolean)
      .map((id) => WORDS[id]).filter(Boolean);
    if (parts.length === 0) return 'help manage their medicines';
    if (parts.length === 1) return parts[0];
    return parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
  })();

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.cream }}>

      {/* ── Welcome screen ── */}
      {mode === 'welcome' &&
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Hero */}
          <div style={{
          flex: 1, background: `linear-gradient(160deg, #2A6FB0 0%, #1D62A6 60%, #163F6E 100%)`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '48px 32px 40px', position: 'relative', overflow: 'hidden'
        }}>
            <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'absolute', bottom: -80, left: -40, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

            <div style={{
            width: 88, height: 88, borderRadius: 26, background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)', marginBottom: 24
          }}>💊</div>

            <div style={{ fontFamily: fonts.heading, fontSize: 34, fontWeight: 800, color: '#fff', textAlign: 'center', marginBottom: 10, letterSpacing: '-0.02em' }}>
              SaathiPill
            </div>
            <div style={{ fontFamily: fonts.body, fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 1.6, maxWidth: 260 }}>
              Your daily medicine companion — free, offline, and made for India
            </div>

            {/* Trust badges */}
            <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
              {['100% Free', 'Works Offline', 'No Ads'].map((b) =>
            <div key={b} style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.18)', fontFamily: fonts.body, fontSize: 12, fontWeight: 600, color: '#fff' }}>{b}</div>
            )}
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
      }

      {/* ── Login / Sign Up shared OTP flow ── */}
      {(mode === 'login' || mode === 'signup') &&
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Back header */}
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => {setMode('welcome');setOtpSent(false);setPhone('');setOtp(['', '', '', '']);setError('');}}
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

            {/* Pharmacy QR banner — shown when arriving via a counter QR scan */}
            {joinPharmacy && !invite && mode === 'signup' && !otpSent &&
          <div style={{ padding: '14px 16px', borderRadius: 14, background: C.sageLight, border: `1px solid ${C.sage}44`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 22 }}>🏥</span>
                <div>
                  <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>
                    Joining {joinPharmacy.name || 'your pharmacy'}
                  </div>
                  <div style={{ fontFamily: fonts.body, fontSize: 12.5, color: C.textMuted, lineHeight: 1.5 }}>
                    Enter your mobile number and we’ll link {joinPharmacy.name ? `${joinPharmacy.name}` : 'the pharmacy'} to your account automatically — refills, offers and prescriptions will flow straight into the app. Already using SaathiPill? The same number simply logs you in.
                  </div>
                </div>
              </div>
          }

            {/* Caregiver invite banner — shown when arriving via a family invite link */}
            {invite && !otpSent &&
          <div style={{ padding: '14px 16px', borderRadius: 14, background: C.sageLight, border: `1px solid ${C.sage}44`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 22 }}>🤝</span>
                <div>
                  <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>
                    {invite.by ? `${invite.by} invited you to SaathiPill` : 'You’ve been invited to SaathiPill'}
                  </div>
                  <div style={{ fontFamily: fonts.body, fontSize: 12.5, color: C.textMuted, lineHeight: 1.5 }}>
                    {mode === 'login'
                      ? <>Welcome back — log in to accept the invite and help manage {invite.by ? `${invite.by}’s` : 'their'} medicines. You’ll be able to {invitePermPhrase}.</>
                      : <>Enter your mobile number to help manage {invite.by ? `${invite.by}’s` : 'their'} medicines — you’ll be able to {invitePermPhrase}. Already using SaathiPill? The same number simply logs you in, nothing is lost.</>}
                  </div>
                </div>
              </div>
          }

            {/* Sign up — name field */}
            {mode === 'signup' && !otpSent &&
          <div>
                <label style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 8 }}>Your name</label>
                <input
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Shreyas Kumar"
              style={{ ...inputStyle, borderColor: name ? C.coral : C.border }} />
            
              </div>
          }

            {/* Phone number */}
            {!otpSent &&
          <div>
                <label style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 8 }}>Mobile number</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{
                height: 52, padding: '0 14px', borderRadius: 14,
                border: `2px solid ${C.border}`, background: C.white,
                display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                fontFamily: fonts.body, fontSize: 15, color: C.text
              }}>🇮🇳 +91</div>
                  <input
                value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="98765 43210" type="tel"
                style={{ ...inputStyle, flex: 1, borderColor: phone.length === 10 ? C.coral : C.border }} />
              
                </div>
                {error && <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.red, marginTop: 6 }}>{error}</div>}
              </div>
          }

            {/* OTP entry */}
            {otpSent &&
          <div>
                <div style={{ fontFamily: fonts.body, fontSize: 15, color: C.textMuted, marginBottom: 20, lineHeight: 1.6 }}>
                  OTP sent to <strong style={{ color: C.text }}>+91 {phone}</strong>.{' '}
                  <span onClick={() => setOtpSent(false)} style={{ color: C.coral, cursor: 'pointer', textDecoration: 'underline' }}>Change</span>
                </div>
                {devCode &&
                <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 12, background: C.amberLight, border: `1px solid ${C.amber}44`, fontFamily: fonts.body, fontSize: 13, color: C.text }}>
                  🔑 Dev mode — your code is <strong style={{ letterSpacing: '0.1em' }}>{devCode}</strong> (a real SMS gateway replaces this in production)
                </div>
                }

                {/* 4-digit OTP boxes */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 8 }}>
                  {otp.map((digit, idx) =>
              <input
                key={idx}
                ref={otpRefs[idx]}
                value={digit}
                onChange={(e) => handleOtpChange(e.target.value, idx)}
                onKeyDown={(e) => {if (e.key === 'Backspace' && !digit && idx > 0) otpRefs[idx - 1].current?.focus();}}
                maxLength={1} type="tel"
                style={{
                  width: 58, height: 64, textAlign: 'center', borderRadius: 16,
                  border: `2px solid ${digit ? C.coral : C.border}`, background: C.white,
                  fontFamily: fonts.heading, fontSize: 28, fontWeight: 700, color: C.text,
                  outline: 'none', transition: 'border-color 0.2s'
                }} />

              )}
                </div>

                {error && <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.red, marginTop: 6, textAlign: 'center' }}>{error}</div>}

                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <span style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted }}>Didn't receive it? </span>
                  <span onClick={() => setOtp(['', '', '', ''])} style={{ fontFamily: fonts.body, fontSize: 13, color: C.coral, cursor: 'pointer', fontWeight: 600 }}>Resend OTP</span>
                </div>

                {/* Demo hint — gated by Tweak (improvement #12) */}
                {showDemoHints &&
            <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, background: C.amberLight, border: `1px solid ${C.amber}33` }}>
                    <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.text }}>
                      💡 <strong>Demo:</strong> Enter any 4 digits to {mode === 'login' ? 'log in' : 'sign up'}
                    </div>
                  </div>
            }
              </div>
          }

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {!otpSent ?
            <Btn onClick={sendOtp} disabled={mode === 'signup' ? !name || phone.length !== 10 : phone.length !== 10}>
                  Send OTP
                </Btn> :

            <Btn onClick={verifyOtp} disabled={otp.join('').length < 4}>
                  {mode === 'login' ? 'Log in →' : 'Create account →'}
                </Btn>
            }

              {mode === 'login' ?
            <div style={{ textAlign: 'center' }}>
                  <span style={{ fontFamily: fonts.body, fontSize: 14, color: C.textMuted }}>New to SaathiPill? </span>
                  <span onClick={() => {setMode('signup');setOtpSent(false);setPhone('');setOtp(['', '', '', '']);setError('');}} style={{ fontFamily: fonts.body, fontSize: 14, color: C.coral, fontWeight: 700, cursor: 'pointer' }}>Sign up free</span>
                </div> :

            <div style={{ textAlign: 'center' }}>
                  <span style={{ fontFamily: fonts.body, fontSize: 14, color: C.textMuted }}>Already have an account? </span>
                  <span onClick={() => {setMode('login');setOtpSent(false);setPhone('');setOtp(['', '', '', '']);setError('');}} style={{ fontFamily: fonts.body, fontSize: 14, color: C.coral, fontWeight: 700, cursor: 'pointer' }}>Log in</span>
                </div>
            }
            </div>
          </div>
        </div>
      }
    </div>);

}

// Export all
// ── Edit a medicine's time + reminder behaviour (tap the medicine in Today) ──
function EditMedicineScreen({ med, onClose, onSave }) {
  const m = med || {};
  const [time, setTime] = React.useState(m.time || '8:00 AM');
  // 'off' | '0' | '10' | '30' — how the reminder should fire for this medicine
  const [remind, setRemind] = React.useState(m.remindersOn === false ? 'off' : String(m.remindBeforeMin || 0));
  const [saving, setSaving] = React.useState(false);

  const to24 = (t) => {
    const x = String(t || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!x) return '08:00';
    let h = parseInt(x[1], 10) % 12;
    if (x[3].toUpperCase() === 'PM') h += 12;
    return String(h).padStart(2, '0') + ':' + x[2];
  };
  const to12 = (v) => {
    const [hh, mm] = String(v || '08:00').split(':');
    let h = parseInt(hh, 10);
    const ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + mm + ' ' + ap;
  };

  const presets = ['8:00 AM', '1:00 PM', '5:00 PM', '9:00 PM'];
  const remindOptions = [
    ['0',   '🔔', 'At the scheduled time'],
    ['10',  '⏳', '10 minutes early'],
    ['30',  '⏳', '30 minutes early'],
    ['off', '🔕', 'No reminders for this medicine'],
  ];

  const save = () => {
    if (saving) return;
    setSaving(true);
    Promise.resolve(onSave && onSave({
      time,
      remindersOn: remind !== 'off',
      remindBeforeMin: remind === 'off' ? (m.remindBeforeMin || 0) : parseInt(remind, 10),
    })).finally(() => setSaving(false));
  };

  return (
    <div style={{ flex: 1, background: C.cream, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: 12, background: C.warmGrayLight, border: 'none', fontSize: 18, cursor: 'pointer' }}>←</button>
        <div>
          <div style={{ fontFamily: fonts.heading, fontSize: 20, fontWeight: 700, color: C.text }}>Edit {m.name || 'medicine'}</div>
          <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>{m.dose}{m.meal ? ` · ${m.meal}` : ''}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '4px 20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Time */}
        <div>
          <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 10 }}>🕐 When should it be taken?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {presets.map(p => (
              <button key={p} onClick={() => setTime(p)} style={{
                padding: '10px 14px', borderRadius: 12,
                border: `2px solid ${time === p ? C.coral : C.border}`,
                background: time === p ? C.coralLight : C.white,
                color: time === p ? C.coral : C.text,
                fontFamily: fonts.body, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>{p}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted }}>Or pick exactly:</span>
            <input type="time" value={to24(time)} onChange={e => e.target.value && setTime(to12(e.target.value))}
              style={{ height: 44, padding: '0 12px', borderRadius: 12, border: `2px solid ${C.border}`, background: C.white, fontFamily: fonts.body, fontSize: 15, color: C.text, outline: 'none' }} />
            <span style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.coral }}>{time}</span>
          </div>
        </div>

        {/* Reminder behaviour */}
        <div>
          <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>🔔 When should we remind you?</div>
          <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted, marginBottom: 10 }}>Reminders repeat every 30 minutes until you act, starting from the moment below.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {remindOptions.map(([id, icon, label]) => (
              <button key={id} onClick={() => setRemind(id)} style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                padding: '13px 15px', borderRadius: 14, textAlign: 'left',
                border: `2px solid ${remind === id ? C.coral : C.border}`,
                background: remind === id ? C.coralLight : C.white, cursor: 'pointer',
              }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <span style={{ flex: 1, fontFamily: fonts.body, fontSize: 14.5, fontWeight: 700, color: remind === id ? C.coral : C.text }}>{label}</span>
                {remind === id && <span style={{ color: C.coral, fontWeight: 800 }}>✓</span>}
              </button>
            ))}
          </div>
          {remind === 'off' && (
            <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 12, background: C.amberLight, fontFamily: fonts.body, fontSize: 12, color: C.text, lineHeight: 1.5 }}>
              ⚠️ You won't get any notifications for {m.name || 'this medicine'} — it stays on your list and still counts in adherence.
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '12px 20px 28px', display: 'flex', gap: 10 }}>
        <Btn variant="outline" onClick={onClose} style={{ flex: 1 }}>Cancel</Btn>
        <Btn onClick={save} style={{ flex: 2 }} icon="✓">{saving ? 'Saving…' : 'Save changes'}</Btn>
      </div>
    </div>
  );
}

Object.assign(window, { SplashScreen, OnboardingScreen, ProfileSetupScreen, HomeScreen, AddMedicineScreen, AuthScreen, EditMedicineScreen, C, fonts, Card, Btn, Pill, Tag, SectionHeader, medicines, CompletedCoursesSection });