// ── QUICK-ADD: Symptoms + Appointment screens (companion to Add Medicine) ──
// Triggered from the home dashboard's + button (speed-dial menu).

const { useState: useStateQA } = React;

// ── SCREEN: LOG SYMPTOMS ──
function LogSymptomsScreen({ onClose, onDone }) {
  const moods = [
    { id: 'great',   icon: '😀', label: 'Great',    color: '#7BB68F' },
    { id: 'ok',      icon: '🙂', label: 'OK',       color: '#A8B47A' },
    { id: 'meh',     icon: '😐', label: 'Meh',      color: '#D9B061' },
    { id: 'off',     icon: '😕', label: 'Off',      color: '#E8A56A' },
    { id: 'rough',   icon: '😣', label: 'Rough',    color: '#E8705A' },
  ];

  const commonSymptoms = [
    { id: 'headache',    icon: '🤕', label: 'Headache' },
    { id: 'nausea',      icon: '🤢', label: 'Nausea' },
    { id: 'dizzy',       icon: '💫', label: 'Dizziness' },
    { id: 'fatigue',     icon: '😴', label: 'Fatigue' },
    { id: 'fever',       icon: '🌡️', label: 'Fever' },
    { id: 'cough',       icon: '🤧', label: 'Cough' },
    { id: 'pain',        icon: '⚡', label: 'Pain' },
    { id: 'stomach',     icon: '🫃', label: 'Stomach' },
    { id: 'rash',        icon: '🔴', label: 'Rash' },
    { id: 'sleep',       icon: '🌙', label: 'Poor sleep' },
    { id: 'appetite',    icon: '🍽️', label: 'Appetite' },
    { id: 'mood',        icon: '🌧️', label: 'Low mood' },
  ];

  const [mood, setMood] = useStateQA(null);
  const [picked, setPicked] = useStateQA([]);
  const [severity, setSeverity] = useStateQA(2); // 1-5
  const [note, setNote] = useStateQA('');
  const [linkedToMed, setLinkedToMed] = useStateQA(true);

  const toggle = (id) => setPicked((p) => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const severityLabel = ['', 'Very mild', 'Mild', 'Moderate', 'Strong', 'Severe'][severity];
  const severityColor  = ['', '#7BB68F', '#A8B47A', '#D9B061', '#E8A56A', '#E8705A'][severity];

  const canSave = mood !== null || picked.length > 0;

  return (
    <div style={{ flex: 1, minHeight: 0, background: C.cream, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${C.border}`, background: C.white, flexShrink: 0 }}>
        <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: 12, background: C.warmGrayLight, border: 'none', fontSize: 18, cursor: 'pointer' }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: fonts.heading, fontSize: 18, fontWeight: 700, color: C.text }}>How are you feeling?</div>
          <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>Logged at {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '20px 20px 24px' }}>

        {/* Mood */}
        <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Overall mood</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {moods.map(m => {
            const active = mood === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMood(m.id)}
                style={{
                  flex: 1, padding: '12px 4px 10px',
                  borderRadius: 16,
                  border: `2px solid ${active ? m.color : C.border}`,
                  background: active ? m.color + '1A' : C.white,
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 26, lineHeight: 1, filter: active ? 'none' : 'grayscale(0.4)' }}>{m.icon}</div>
                <div style={{ fontFamily: fonts.body, fontSize: 10, fontWeight: 700, color: active ? m.color : C.textMuted }}>{m.label}</div>
              </button>
            );
          })}
        </div>

        {/* Symptoms */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Symptoms</div>
          <div style={{ fontFamily: fonts.body, fontSize: 11, color: C.textMuted }}>Tap all that apply</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
          {commonSymptoms.map(s => {
            const on = picked.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 12px', borderRadius: 999,
                  border: `1.5px solid ${on ? C.coral : C.border}`,
                  background: on ? C.coralLight : C.white,
                  color: on ? C.coralDark : C.text,
                  fontFamily: fonts.body, fontSize: 13, fontWeight: on ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 14 }}>{s.icon}</span>
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Severity (only if symptoms picked) */}
        {picked.length > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Severity</div>
              <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: severityColor }}>{severityLabel}</div>
            </div>
            <div style={{
              background: C.white, borderRadius: 16, border: `1px solid ${C.border}`,
              padding: '16px 18px', marginBottom: 22,
            }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    onClick={() => setSeverity(n)}
                    style={{
                      flex: 1, height: 36, borderRadius: 10,
                      border: 'none', cursor: 'pointer',
                      background: n <= severity ? severityColor : C.warmGrayLight,
                      color: n <= severity ? C.white : C.textMuted,
                      fontFamily: fonts.body, fontSize: 14, fontWeight: 700,
                      transition: 'background 0.15s',
                    }}
                  >{n}</button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: fonts.body, fontSize: 11, color: C.textMuted }}>
                <span>Barely noticeable</span>
                <span>Disabling</span>
              </div>
            </div>
          </>
        )}

        {/* Note */}
        <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Notes <span style={{ color: C.textMuted, fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Headache started ~30 min after morning dose. Took water, lying down helped."
          style={{
            width: '100%', minHeight: 90, resize: 'none',
            padding: '14px 16px', borderRadius: 16,
            border: `1px solid ${C.border}`, background: C.white,
            fontFamily: fonts.body, fontSize: 14, color: C.text, lineHeight: 1.5,
            outline: 'none',
          }}
        />

        {/* Link to recent dose */}
        <button
          onClick={() => setLinkedToMed(v => !v)}
          style={{
            marginTop: 18, width: '100%',
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px', borderRadius: 14,
            border: `1.5px solid ${linkedToMed ? C.coral : C.border}`,
            background: linkedToMed ? C.coralLight : C.white,
            cursor: 'pointer', textAlign: 'left',
          }}
        >
          <div style={{
            width: 22, height: 22, borderRadius: 7, flexShrink: 0,
            border: `2px solid ${linkedToMed ? C.coral : C.warmGray}`,
            background: linkedToMed ? C.coral : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: C.white, fontSize: 14, fontWeight: 800,
          }}>{linkedToMed ? '✓' : ''}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.text }}>Link to recent dose</div>
            <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted, marginTop: 2 }}>Metformin · 8:00 AM (1 h ago)</div>
          </div>
        </button>

        <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12, background: C.warmGrayLight, fontFamily: fonts.body, fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
          💡 We'll surface this in your <strong>Doctor Report</strong> so your physician can spot patterns over time.
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px 16px', borderTop: `1px solid ${C.border}`, background: C.white, flexShrink: 0 }}>
        <button
          onClick={() => canSave && onDone({ mood, symptoms: picked, severity, note, linkedToMed })}
          disabled={!canSave}
          style={{
            width: '100%', padding: '15px 0', borderRadius: 16, border: 'none',
            background: canSave ? C.coral : C.warmGrayLight,
            color: canSave ? C.white : C.textMuted,
            fontFamily: fonts.body, fontSize: 16, fontWeight: 700,
            cursor: canSave ? 'pointer' : 'not-allowed',
            boxShadow: canSave ? '0 4px 14px #1D62A640' : 'none',
            transition: 'all 0.15s',
          }}
        >Save log{picked.length > 0 ? ` · ${picked.length} symptom${picked.length > 1 ? 's' : ''}` : ''}</button>
      </div>
    </div>
  );
}

// ── SCREEN: ADD DOCTOR'S APPOINTMENT ──
function AddAppointmentScreen({ onClose, onDone }) {
  const specialties = [
    { id: 'gp',       icon: '🩺', label: 'GP / Family doc' },
    { id: 'cardio',   icon: '❤️', label: 'Cardiologist' },
    { id: 'derm',     icon: '🧴', label: 'Dermatologist' },
    { id: 'endo',     icon: '🍬', label: 'Endocrinologist' },
    { id: 'ent',      icon: '👂', label: 'ENT' },
    { id: 'ortho',    icon: '🦴', label: 'Orthopedist' },
    { id: 'dentist',  icon: '🦷', label: 'Dentist' },
    { id: 'eye',      icon: '👁️', label: 'Ophthalmologist' },
    { id: 'gyn',      icon: '🌸', label: 'Gynecologist' },
    { id: 'other',    icon: '👨‍⚕️', label: 'Other' },
  ];

  const [doctor, setDoctor] = useStateQA('');
  const [specialty, setSpecialty] = useStateQA(null);
  const [dateIdx, setDateIdx] = useStateQA(2); // index into the date strip
  const [time, setTime] = useStateQA(null);
  const [location, setLocation] = useStateQA('');
  const [reason, setReason] = useStateQA('');
  const [reminderLead, setReminderLead] = useStateQA('1d'); // 'none' | '1h' | '1d' | '2d'

  // Build a 7-day strip starting today
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const timeSlots = [
    { id: 'morning', label: 'Morning',   sub: '9 — 12 AM',   icon: '☀️' },
    { id: 'noon',    label: 'Afternoon', sub: '12 — 3 PM',   icon: '🌤️' },
    { id: 'evening', label: 'Evening',   sub: '3 — 7 PM',    icon: '🌆' },
  ];
  const specificTimes = ['9:00 AM','10:30 AM','11:15 AM','2:00 PM','3:30 PM','4:45 PM','6:00 PM'];

  const canSave = doctor.trim().length > 0 && time !== null;

  const chosenDate = days[dateIdx];
  const formattedDate = `${dayNames[chosenDate.getDay()]}, ${monthNames[chosenDate.getMonth()]} ${chosenDate.getDate()}`;

  return (
    <div style={{ flex: 1, minHeight: 0, background: C.cream, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${C.border}`, background: C.white, flexShrink: 0 }}>
        <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: 12, background: C.warmGrayLight, border: 'none', fontSize: 18, cursor: 'pointer' }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: fonts.heading, fontSize: 18, fontWeight: 700, color: C.text }}>Doctor's appointment</div>
          <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>We'll remind you ahead of time</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '20px 20px 24px' }}>

        {/* Doctor name */}
        <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Doctor</div>
        <input
          value={doctor}
          onChange={(e) => setDoctor(e.target.value)}
          placeholder="Dr. Priya Sharma"
          style={{
            width: '100%', padding: '14px 16px', borderRadius: 14,
            border: `1.5px solid ${doctor ? C.coral : C.border}`,
            background: C.white,
            fontFamily: fonts.body, fontSize: 16, color: C.text,
            outline: 'none',
          }}
        />

        {/* Specialty */}
        <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 20, marginBottom: 10 }}>Specialty</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
          {specialties.map(s => {
            const on = specialty === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSpecialty(s.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 12px', borderRadius: 999,
                  border: `1.5px solid ${on ? C.coral : C.border}`,
                  background: on ? C.coralLight : C.white,
                  color: on ? C.coralDark : C.text,
                  fontFamily: fonts.body, fontSize: 13, fontWeight: on ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 14 }}>{s.icon}</span>
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Date strip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date</div>
          <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: C.coral }}>{formattedDate}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 22 }}>
          {days.map((d, i) => {
            const active = i === dateIdx;
            const isToday = i === 0;
            return (
              <button
                key={i}
                onClick={() => setDateIdx(i)}
                style={{
                  flex: 1, padding: '10px 4px',
                  borderRadius: 14,
                  border: `1.5px solid ${active ? C.coral : C.border}`,
                  background: active ? C.coral : C.white,
                  color: active ? C.white : C.text,
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontFamily: fonts.body, fontSize: 10, fontWeight: 700, opacity: active ? 0.85 : 0.6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{isToday ? 'Today' : dayNames[d.getDay()].slice(0,3)}</div>
                <div style={{ fontFamily: fonts.heading, fontSize: 20, fontWeight: 800 }}>{d.getDate()}</div>
              </button>
            );
          })}
        </div>

        {/* Time */}
        <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Time</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 22 }}>
          {specificTimes.map(t => {
            const on = time === t;
            return (
              <button
                key={t}
                onClick={() => setTime(t)}
                style={{
                  padding: '10px 14px', borderRadius: 10,
                  border: `1.5px solid ${on ? C.coral : C.border}`,
                  background: on ? C.coral : C.white,
                  color: on ? C.white : C.text,
                  fontFamily: fonts.body, fontSize: 14, fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >{t}</button>
            );
          })}
        </div>

        {/* Location */}
        <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Location <span style={{ color: C.textMuted, fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></div>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Apollo Clinic, Indiranagar"
          style={{
            width: '100%', padding: '14px 16px', borderRadius: 14,
            border: `1.5px solid ${C.border}`,
            background: C.white,
            fontFamily: fonts.body, fontSize: 15, color: C.text,
            outline: 'none',
          }}
        />

        {/* Reason */}
        <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 20, marginBottom: 10 }}>Reason for visit <span style={{ color: C.textMuted, fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Follow-up on BP medication; ECG results review"
          style={{
            width: '100%', minHeight: 70, resize: 'none',
            padding: '14px 16px', borderRadius: 14,
            border: `1px solid ${C.border}`, background: C.white,
            fontFamily: fonts.body, fontSize: 14, color: C.text, lineHeight: 1.5,
            outline: 'none',
          }}
        />

        {/* Reminder lead */}
        <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 20, marginBottom: 10 }}>Remind me</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { id: 'none', label: 'Off' },
            { id: '1h',   label: '1 h before' },
            { id: '1d',   label: '1 day' },
            { id: '2d',   label: '2 days' },
          ].map(opt => {
            const on = reminderLead === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setReminderLead(opt.id)}
                style={{
                  flex: 1, padding: '10px 6px', borderRadius: 10,
                  border: `1.5px solid ${on ? C.coral : C.border}`,
                  background: on ? C.coralLight : C.white,
                  color: on ? C.coralDark : C.text,
                  fontFamily: fonts.body, fontSize: 12, fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >{opt.label}</button>
            );
          })}
        </div>

        <div style={{ marginTop: 18, padding: '12px 14px', borderRadius: 12, background: C.warmGrayLight, fontFamily: fonts.body, fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
          💡 You'll see this on your <strong>Today</strong> screen on appointment day, and your caregivers will see it too if you've shared with them.
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px 16px', borderTop: `1px solid ${C.border}`, background: C.white, flexShrink: 0 }}>
        <button
          onClick={() => canSave && onDone({ doctor, specialty, date: chosenDate, time, location, reason, reminderLead })}
          disabled={!canSave}
          style={{
            width: '100%', padding: '15px 0', borderRadius: 16, border: 'none',
            background: canSave ? C.coral : C.warmGrayLight,
            color: canSave ? C.white : C.textMuted,
            fontFamily: fonts.body, fontSize: 16, fontWeight: 700,
            cursor: canSave ? 'pointer' : 'not-allowed',
            boxShadow: canSave ? '0 4px 14px #1D62A640' : 'none',
            transition: 'all 0.15s',
          }}
        >{canSave ? `Save appointment · ${formattedDate} at ${time}` : 'Fill doctor & time to save'}</button>
      </div>
    </div>
  );
}

Object.assign(window, { LogSymptomsScreen, AddAppointmentScreen, AppointmentReminderModal, UpcomingAppointmentCard, formatAppointmentDate, sameLocalDay });

// ── Helpers shared with History / Doctor Report ──
function sameLocalDay(a, b) {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}
function formatAppointmentDate(d, opts = {}) {
  const date = new Date(d);
  const today = new Date();
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
  if (sameLocalDay(date, today)) return 'Today';
  if (sameLocalDay(date, tomorrow)) return 'Tomorrow';
  return date.toLocaleDateString('en-IN', { weekday: opts.long ? 'long' : 'short', day: 'numeric', month: 'short' });
}

// ── Specialty meta (icon + label) for reuse ──
const SPECIALTY_META = {
  gp:      { icon: '🩺', label: 'GP / Family doctor' },
  cardio:  { icon: '❤️', label: 'Cardiologist' },
  derm:    { icon: '🧴', label: 'Dermatologist' },
  endo:    { icon: '🍬', label: 'Endocrinologist' },
  ent:     { icon: '👂', label: 'ENT' },
  ortho:   { icon: '🦴', label: 'Orthopedist' },
  dentist: { icon: '🦷', label: 'Dentist' },
  eye:     { icon: '👁️', label: 'Ophthalmologist' },
  gyn:     { icon: '🌸', label: 'Gynecologist' },
  other:   { icon: '👨‍⚕️', label: 'Specialist' },
};

const REMINDER_LEAD_LABEL = { none: 'No reminder', '1h': '1 hour before', '1d': '1 day before', '2d': '2 days before' };

// ── HOME: Upcoming Appointment Card ──
function UpcomingAppointmentCard({ appointment, onOpenReminder, onTap }) {
  if (!appointment) return null;
  const meta = SPECIALTY_META[appointment.specialty] || SPECIALTY_META.other;
  const dateLabel = formatAppointmentDate(appointment.date);
  const isImminent = dateLabel === 'Today' || dateLabel === 'Tomorrow';
  const accent = '#6FA689'; // green accent (matches the speed-dial action color)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onTap}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap && onTap(); } }}
      style={{
        width: '100%', boxSizing: 'border-box',
        background: C.white,
        borderRadius: 18,
        border: `1px solid ${isImminent ? accent + '55' : C.border}`,
        padding: '14px 14px',
        display: 'flex', alignItems: 'center', gap: 12,
        cursor: 'pointer', textAlign: 'left',
        boxShadow: isImminent ? `0 4px 14px ${accent}1A` : 'none',
        position: 'relative',
      }}
    >
      {isImminent && (
        <div style={{
          position: 'absolute', top: -6, left: 14,
          padding: '2px 8px', borderRadius: 6,
          background: accent, color: C.white,
          fontFamily: fonts.body, fontSize: 10, fontWeight: 800, letterSpacing: '0.04em',
        }}>{dateLabel.toUpperCase()}</div>
      )}
      <div style={{
        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
        background: accent + '22',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
      }}>{meta.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{appointment.doctor || 'Doctor visit'}</div>
        <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {!isImminent && <>{dateLabel} · </>}{appointment.time} · {meta.label}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, padding: '2px 8px', borderRadius: 6, background: C.warmGrayLight, fontFamily: fonts.body, fontSize: 10, fontWeight: 700, color: C.textMuted }}>
          <span style={{ fontSize: 11 }}>🔔</span>
          {appointment.reminderLead === 'none' ? 'No reminder' : `Reminds ${REMINDER_LEAD_LABEL[appointment.reminderLead] || '1 day before'}`}
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onOpenReminder && onOpenReminder(appointment); }}
        style={{
          padding: '8px 12px', borderRadius: 10,
          background: accent, color: C.white, border: 'none',
          fontFamily: fonts.body, fontSize: 12, fontWeight: 700,
          cursor: 'pointer', flexShrink: 0,
          boxShadow: `0 2px 8px ${accent}55`,
        }}
        aria-label="Preview reminder"
      >Preview</button>
    </div>
  );
}

// ── APPOINTMENT REMINDER MODAL ──
function AppointmentReminderModal({ appointment, onSnooze, onDismiss, onDirections }) {
  if (!appointment) return null;
  const meta = SPECIALTY_META[appointment.specialty] || SPECIALTY_META.other;
  const dateLabel = formatAppointmentDate(appointment.date, { long: true });
  const accent = '#6FA689';

  return (
    <div style={{ flex: 1, background: accent, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', position: 'relative', overflow: 'hidden' }}>
      {/* Soft halo */}
      <div style={{
        position: 'absolute', width: 380, height: 380, borderRadius: '50%',
        background: 'rgba(255,255,255,0.10)', top: -100, right: -120,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 260, height: 260, borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)', bottom: -80, left: -80,
        pointerEvents: 'none',
      }} />

      {/* Bell + tagline */}
      <div style={{
        width: 92, height: 92, borderRadius: 28,
        background: 'rgba(255,255,255,0.20)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 46, marginBottom: 18,
        animation: 'aptShake 1.6s ease-in-out infinite',
      }}>🔔</div>
      <div style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.16em', marginBottom: 8, textTransform: 'uppercase' }}>Appointment Reminder</div>
      <div style={{ fontFamily: fonts.heading, fontSize: 30, fontWeight: 800, color: C.white, textAlign: 'center', lineHeight: 1.2, marginBottom: 4 }}>{appointment.doctor || 'Doctor visit'}</div>
      <div style={{ fontFamily: fonts.body, fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: 26 }}>
        {meta.icon} {meta.label}
      </div>

      {/* When */}
      <div style={{
        width: '100%', maxWidth: 320,
        background: 'rgba(255,255,255,0.16)',
        borderRadius: 18, padding: '16px 18px',
        marginBottom: 12,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{ fontSize: 28 }}>📅</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: fonts.body, fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>When</div>
          <div style={{ fontFamily: fonts.body, fontSize: 16, fontWeight: 700, color: C.white }}>{dateLabel} · {appointment.time}</div>
        </div>
      </div>

      {/* Where */}
      {appointment.location && (
        <div style={{
          width: '100%', maxWidth: 320,
          background: 'rgba(255,255,255,0.16)',
          borderRadius: 18, padding: '16px 18px',
          marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ fontSize: 28 }}>📍</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: fonts.body, fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Where</div>
            <div style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 600, color: C.white, lineHeight: 1.3 }}>{appointment.location}</div>
          </div>
        </div>
      )}

      {/* Reason */}
      {appointment.reason && (
        <div style={{
          width: '100%', maxWidth: 320,
          background: 'rgba(255,255,255,0.16)',
          borderRadius: 18, padding: '16px 18px',
          marginBottom: 22,
        }}>
          <div style={{ fontFamily: fonts.body, fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Reason</div>
          <div style={{ fontFamily: fonts.body, fontSize: 14, color: C.white, lineHeight: 1.45 }}>{appointment.reason}</div>
        </div>
      )}

      {/* Actions */}
      <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={onDirections}
          style={{
            padding: '15px 0', borderRadius: 16, border: 'none',
            background: C.white, color: accent,
            fontFamily: fonts.body, fontSize: 16, fontWeight: 800,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        ><span>🧭</span> Get directions</button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onSnooze}
            style={{
              flex: 1, padding: '14px 0', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.5)',
              background: 'transparent', color: C.white,
              fontFamily: fonts.body, fontSize: 14, fontWeight: 700,
              cursor: 'pointer',
            }}
          >Remind 1 h again</button>
          <button
            onClick={onDismiss}
            style={{
              flex: 1, padding: '14px 0', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.5)',
              background: 'transparent', color: C.white,
              fontFamily: fonts.body, fontSize: 14, fontWeight: 700,
              cursor: 'pointer',
            }}
          >Dismiss</button>
        </div>
      </div>

      <style>{`
        @keyframes aptShake {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(-12deg); }
          30% { transform: rotate(10deg); }
          45% { transform: rotate(-8deg); }
          60% { transform: rotate(6deg); }
          75% { transform: rotate(-2deg); }
        }
      `}</style>
    </div>
  );
}
