
// Screens 6-12: Reminder Modal, Escalation, AI Insights, History, Analytics, Family, Caregiver

const { useState: useState2, useEffect: useEffect2, useRef: useRef2 } = React;

// ── SCREEN 6: REMINDER MODAL ──
function ReminderModal({ med, onTaken, onSnooze, onSkip, onEscalation }) {
  const [snoozed, setSnoozed] = useState2(false);
  const [pulse, setPulse] = useState2(true);

  useEffect2(() => {
    const t = setInterval(() => setPulse(p => !p), 900);
    return () => clearInterval(t);
  }, []);

  const m = med || { name: 'Telmisartan', dose: '40mg', time: '1:00 PM', meal: 'Before lunch', icon: '💊' };

  return (
    <div style={{
      flex: 1,
      background: `linear-gradient(180deg, #1A1210 0%, #2C1810 40%, #3A1F14 100%)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '0 24px',
    }}>
      {/* Status bar area */}
      <div style={{ width: '100%', padding: '16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>1:00 PM</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.sage, animation: 'silentBlink 1.5s infinite' }} />
          <span style={{ fontFamily: fonts.body, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Works on silent</span>
        </div>
      </div>

      {/* Escalation indicators */}
      <div style={{ width: '100%', display: 'flex', gap: 8, marginTop: 16, marginBottom: 8 }}>
        {['1st reminder', '2nd (louder)', 'Phone call'].map((label, i) => (
          <div key={i} style={{
            flex: 1, padding: '6px 0', borderRadius: 8, textAlign: 'center',
            background: i === 0 ? C.coral : 'rgba(255,255,255,0.1)',
            fontFamily: fonts.body, fontSize: 10, fontWeight: 600,
            color: i === 0 ? C.white : 'rgba(255,255,255,0.4)',
          }}>{label}</div>
        ))}
      </div>

      {/* Pulsing pill icon */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 140, height: 140, borderRadius: 44,
          background: pulse ? 'rgba(232,112,90,0.25)' : 'rgba(232,112,90,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.4s',
          marginBottom: 12,
        }}>
          <div style={{
            width: 100, height: 100, borderRadius: 32,
            background: C.coral, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 52, boxShadow: `0 0 ${pulse ? '40px' : '20px'} #E8705A88`,
            transition: 'box-shadow 0.4s',
          }}>{m.icon}</div>
        </div>

        {/* Medicine info */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontFamily: fonts.heading, fontSize: 32, fontWeight: 800, color: C.white, marginBottom: 6 }}>{m.name}</div>
          <div style={{ fontFamily: fonts.body, fontSize: 20, color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>{m.dose}</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: 14 }}>🕐</span>
              <span style={{ fontFamily: fonts.body, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>{m.time}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: 14 }}>🍽️</span>
              <span style={{ fontFamily: fonts.body, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>{m.meal}</span>
            </div>
          </div>
        </div>

        {/* Voice listen button */}
        <button style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
          borderRadius: 12, background: 'rgba(255,255,255,0.12)', border: 'none',
          cursor: 'pointer', marginTop: 12,
        }}>
          <span style={{ fontSize: 18 }}>🔊</span>
          <span style={{ fontFamily: fonts.body, fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Listen in Hindi</span>
        </button>
      </div>

      {/* Action buttons */}
      <div style={{ width: '100%', paddingBottom: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Btn onClick={onTaken} variant="sage" style={{ fontSize: 19, letterSpacing: '-0.01em' }} icon="✓">
          I've taken it
        </Btn>
        <Btn onClick={() => { setSnoozed(true); onSnooze(); }} variant="outline" style={{ color: C.white, borderColor: 'rgba(255,255,255,0.3)' }} icon="⏰">
          Snooze 10 minutes
        </Btn>
        <button onClick={onSkip} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: fonts.body, fontSize: 15, color: 'rgba(255,255,255,0.4)',
          padding: '8px 0', textDecoration: 'underline',
        }}>Skip this dose</button>
        {onEscalation && (
          <button onClick={onEscalation} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.3)',
            padding: '4px 0',
          }}>What happens if I don't respond? →</button>
        )}
      </div>

      <style>{`
        @keyframes silentBlink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  );
}

// ── SCREEN 7: ESCALATION FLOW ──
function EscalationScreen({ onClose }) {
  const [step, setStep2] = useState2(0);

  const steps = [
    {
      icon: '🔔', color: C.coral, bg: C.coralLight,
      title: '1st Notification',
      time: '1:00 PM',
      desc: 'Standard push notification sent. Works on silent mode.',
      detail: 'Telmisartan 40mg — Before lunch',
      tag: 'Push notification',
    },
    {
      icon: '🔊', color: C.amber, bg: C.amberLight,
      title: '2nd Alarm (Louder)',
      time: '1:10 PM',
      desc: 'No response after 10 minutes. Full-screen alarm with sound, even on silent.',
      detail: 'Escalated to full-screen alarm',
      tag: 'Full-screen alarm',
    },
    {
      icon: '📞', color: '#5B8EE0', bg: '#EEF3FF',
      title: 'Phone Call Reminder',
      time: '1:20 PM',
      desc: 'Still no response. Automated voice call in your preferred language.',
      detail: 'Call from SaathiPill (Hindi)',
      tag: 'Voice call',
    },
    {
      icon: '💚', color: C.sage, bg: C.sageLight,
      title: 'SMS Alert Sent',
      time: '1:25 PM',
      desc: 'Caregiver notified automatically. Family can check in.',
      detail: 'Priya (daughter) notified',
      tag: 'SMS alert',
    },
  ];

  const s = steps[step];

  return (
    <div style={{ flex: 1, background: C.cream, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: 12, background: C.warmGrayLight, border: 'none', fontSize: 18, cursor: 'pointer' }}>←</button>
        <div>
          <div style={{ fontFamily: fonts.heading, fontSize: 18, fontWeight: 700, color: C.text }}>Escalation Flow</div>
          <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>What happens when a dose is missed</div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ padding: '8px 20px', flex: 1, overflow: 'auto' }}>
        <div style={{ position: 'relative' }}>
          {/* Vertical line */}
          <div style={{ position: 'absolute', left: 28, top: 48, bottom: 48, width: 2, background: C.border }} />

          {steps.map((st, i) => (
            <div key={i} onClick={() => setStep2(i)}
              style={{ display: 'flex', gap: 16, marginBottom: 16, cursor: 'pointer', position: 'relative' }}>
              {/* Circle */}
              <div style={{
                width: 56, height: 56, borderRadius: 18, flexShrink: 0, zIndex: 1,
                background: i <= step ? st.bg : C.warmGrayLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                border: `2px solid ${i === step ? st.color : C.border}`,
                transition: 'all 0.3s',
              }}>{st.icon}</div>

              {/* Content */}
              <Card style={{
                flex: 1, border: `2px solid ${i === step ? s.color : C.border}`,
                background: i === step ? s.bg : C.white,
                transition: 'all 0.3s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 700, color: i === step ? s.color : C.text }}>{st.title}</div>
                  <span style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>{st.time}</span>
                </div>
                <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted, lineHeight: 1.5, marginBottom: 8 }}>{st.desc}</div>
                <Pill color={st.color}>{st.tag}</Pill>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: '12px 20px 24px', display: 'flex', gap: 12 }}>
        <Btn variant="outline" onClick={() => setStep2(s => Math.max(0, s - 1))} style={{ flex: 1 }} disabled={step === 0}>← Previous</Btn>
        <Btn onClick={() => { if (step < steps.length - 1) setStep2(s => s + 1); else onClose(); }} style={{ flex: 1 }}>
          {step < steps.length - 1 ? 'Next step →' : 'Done'}
        </Btn>
      </div>
    </div>
  );
}

// ── SCREEN 8: AI INSIGHTS ──
function AIInsightsScreen({ onClose }) {
  const insights = [
    {
      icon: '🤖', color: C.coral,
      title: 'Smart timing suggestion',
      body: 'We noticed you usually take your morning Metformin around 8:20 AM instead of 8:00 AM. Want us to shift the reminder to 7:50 AM?',
      action: 'Update reminder time',
      actionIcon: '🔔',
      dismissed: false,
    },
    {
      icon: '📅', color: C.amber,
      title: 'Pattern detected',
      body: 'You tend to miss Friday evening doses of Amlodipine. Could be related to weekly routine changes — consider a different alert tone for Fridays.',
      action: 'Set special Friday reminder',
      actionIcon: '📅',
      dismissed: false,
    },
    {
      icon: '📈', color: '#5B8EE0',
      title: 'Adherence improving!',
      body: 'Your adherence this month is 87%, up from 74% last month. Your BP readings have also stabilised at 128/82.',
      action: 'See health correlation',
      actionIcon: '📊',
      dismissed: false,
    },
    {
      icon: '⏰', color: C.sage,
      title: 'Best time to refill',
      body: 'Based on your usage, Vitamin D3 will run out in ~6 days. Order by Sunday to avoid a gap.',
      action: 'Order refill now',
      actionIcon: '🏪',
      dismissed: false,
    },
  ];

  const [dismissed, setDismissed] = useState2([]);
  const [accepted, setAccepted] = useState2([]);

  return (
    <div style={{ flex: 1, background: C.cream, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: 12, background: C.warmGrayLight, border: 'none', fontSize: 18, cursor: 'pointer' }}>←</button>
        <div>
          <div style={{ fontFamily: fonts.heading, fontSize: 20, fontWeight: 700, color: C.text }}>AI Insights</div>
          <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>Personalised just for you</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: C.coralLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🤖</div>
        </div>
      </div>

      {/* AI intro card */}
      <div style={{ margin: '16px 20px 0' }}>
        <Card style={{ background: `linear-gradient(135deg, ${C.coral}22, ${C.amber}11)`, border: `1px solid ${C.coral}33` }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 28 }}>✨</span>
            <div>
              <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>SaathiPill learns your habits</div>
              <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
                Based on 3 weeks of data, here are personalised suggestions to help you stay consistent.
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {insights.map((ins, i) => (
          !dismissed.includes(i) && (
            <Card key={i} style={{ border: `1px solid ${ins.color}33`, position: 'relative', overflow: 'hidden' }}>
              {/* Accent strip */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: ins.color, borderRadius: '20px 0 0 20px' }} />
              <div style={{ paddingLeft: 12 }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: ins.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{ins.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{ins.title}</div>
                    <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>{ins.body}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {accepted.includes(i) ? (
                    <Pill color={C.sage} style={{ padding: '8px 14px' }}>✓ Applied</Pill>
                  ) : (
                    <>
                      <button onClick={() => setAccepted(a => [...a, i])} style={{
                        flex: 1, padding: '10px 12px', borderRadius: 12, border: 'none',
                        background: ins.color, color: C.white,
                        fontFamily: fonts.body, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}><span>{ins.actionIcon}</span>{ins.action}</button>
                      <button onClick={() => setDismissed(d => [...d, i])} style={{
                        padding: '10px 14px', borderRadius: 12, border: `1px solid ${C.border}`,
                        background: C.white, color: C.textMuted,
                        fontFamily: fonts.body, fontSize: 13, cursor: 'pointer',
                      }}>Dismiss</button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          )
        ))}

        {dismissed.length === insights.length && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: C.textMuted, fontFamily: fonts.body }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>All caught up!</div>
            <div style={{ fontSize: 14, marginTop: 4 }}>New insights will appear as we learn more about your habits.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SCREEN 9: MEDICATION HISTORY ──
function HistoryScreen({ onClose }) {
  const [selectedDay, setSelectedDay] = useState2(null);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  // Mock data — deterministic so it doesn't re-randomise on every render
  const dayData = {};
  const todayNum = today.getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    if (d > todayNum) {
      dayData[d] = 'future'; // never show status for future days
    } else if (d === todayNum) {
      dayData[d] = 'partial';
    } else {
      // deterministic pattern based on day number
      if (d % 11 === 0) dayData[d] = 'missed';
      else if (d % 7 === 5) dayData[d] = 'late';
      else dayData[d] = 'taken';
    }
  }

  const dayColors = { taken: C.sage, missed: C.red, late: C.amber, partial: C.coral, future: 'transparent' };
  const dayLabels = { taken: 'All taken ✓', missed: 'Missed doses ✗', late: 'Taken late ⚠️', partial: 'In progress', future: '' };

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const selectedMeds = selectedDay ? [
    { name: 'Metformin 500mg', time: '8:00 AM', status: dayData[selectedDay] === 'missed' ? 'missed' : 'taken' },
    { name: 'Amlodipine 5mg', time: '9:00 AM', status: dayData[selectedDay] === 'missed' ? 'missed' : 'taken' },
    { name: 'Telmisartan 40mg', time: '1:00 PM', status: dayData[selectedDay] === 'missed' || dayData[selectedDay] === 'late' ? 'late' : 'taken' },
    { name: 'Atorvastatin 10mg', time: '9:00 PM', status: selectedDay === today.getDate() ? 'pending' : 'taken' },
  ] : [];

  return (
    <div style={{ flex: 1, background: C.cream, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: 12, background: C.warmGrayLight, border: 'none', fontSize: 18, cursor: 'pointer' }}>←</button>
        <div>
          <div style={{ fontFamily: fonts.heading, fontSize: 20, fontWeight: 700, color: C.text }}>Medication History</div>
          <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>
            {today.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 24px' }}>
        {/* Calendar */}
        <Card style={{ marginBottom: 16 }}>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {[['taken', 'Taken'], ['late', 'Late'], ['missed', 'Missed']].map(([k, l]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: dayColors[k] }} />
                <span style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>{l}</span>
              </div>
            ))}
          </div>

          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
            {weekDays.map(d => (
              <div key={d} style={{ textAlign: 'center', fontFamily: fonts.body, fontSize: 12, color: C.textMuted, fontWeight: 600, padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {/* Empty cells for first day offset */}
            {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
            {Array(daysInMonth).fill(null).map((_, i) => {
              const d = i + 1;
              const status = dayData[d];
              const isSelected = selectedDay === d;
              const isToday = d === today.getDate();
              return (
                <button key={d} onClick={() => status !== 'future' && setSelectedDay(isSelected ? null : d)}
                  style={{
                    aspectRatio: '1', borderRadius: 10, border: isSelected ? `2px solid ${C.coral}` : isToday ? `2px solid ${C.text}` : '2px solid transparent',
                    background: status === 'future' ? 'transparent' : dayColors[status] + '22',
                    cursor: status === 'future' ? 'default' : 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                    opacity: status === 'future' ? 0.3 : 1,
                  }}>
                  <span style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: isToday ? 800 : 500, color: status === 'future' ? C.textMuted : C.text }}>{d}</span>
                  {status && status !== 'future' && (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: dayColors[status] }} />
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Selected day detail */}
        {selectedDay && (
          <div>
            <SectionHeader title={`${selectedDay} ${today.toLocaleDateString('en-IN', { month: 'long' })}`} />
            <Card style={{ marginBottom: 8, padding: '10px 14px', background: dayColors[dayData[selectedDay]] + '22', border: `1px solid ${dayColors[dayData[selectedDay]] + '44'}` }}>
              <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: dayColors[dayData[selectedDay]] }}>
                {dayLabels[dayData[selectedDay]]}
              </div>
            </Card>
            {selectedMeds.map((m, i) => {
              const sc = m.status === 'taken' ? C.sage : m.status === 'missed' ? C.red : m.status === 'late' ? C.amber : C.warmGray;
              return (
                <Card key={i} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: sc, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 600, color: C.text }}>{m.name}</div>
                    <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted }}>{m.time}</div>
                  </div>
                  <Pill color={sc}>{m.status}</Pill>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── SCREEN 10: ADHERENCE ANALYTICS ──
function AnalyticsScreen({ onClose }) {
  const [period, setPeriod] = useState2('weekly');
  const [weekOffset, setWeekOffset] = useState2(0); // 0 = this week, -1 = last week, etc.
  const [monthOffset, setMonthOffset] = useState2(0); // 0 = this month, -1 = last month, etc.

  const today = new Date();

  // ── Weekly data ──
  const weekRefDate = new Date(today);
  weekRefDate.setDate(today.getDate() + weekOffset * 7);
  const weekTodayIdx = weekRefDate.getDay();
  const isCurrentWeek = weekOffset === 0;

  // Get Mon of the ref week
  const weekMon = new Date(weekRefDate);
  const daysSinceMon = (weekTodayIdx + 6) % 7;
  weekMon.setDate(weekRefDate.getDate() - daysSinceMon);
  const weekSun = new Date(weekMon);
  weekSun.setDate(weekMon.getDate() + 6);
  const weekLabel = weekMon.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' – ' + weekSun.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  const weeklyData = [
    { day: 'Mon', pct: 100, dayIdx: 1 },
    { day: 'Tue', pct: 80,  dayIdx: 2 },
    { day: 'Wed', pct: 100, dayIdx: 3 },
    { day: 'Thu', pct: 60,  dayIdx: 4 },
    { day: 'Fri', pct: 40,  dayIdx: 5 },
    { day: 'Sat', pct: 100, dayIdx: 6 },
    { day: 'Sun', pct: 80,  dayIdx: 0 },
  ].map(d => {
    const norm = idx => idx === 0 ? 7 : idx;
    const normalToday = norm(weekTodayIdx);
    const normalThis = norm(d.dayIdx);
    const isFuture = isCurrentWeek ? normalThis > normalToday : false;
    const isToday = isCurrentWeek && normalThis === normalToday;
    return { ...d, isFuture, isToday };
  });

  // ── Monthly data ──
  const monthRefDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthYear = monthRefDate.getFullYear();
  const monthIdx = monthRefDate.getMonth();
  const daysInMonth = new Date(monthYear, monthIdx + 1, 0).getDate();
  const firstDayOfMonth = new Date(monthYear, monthIdx, 1).getDay();
  const isCurrentMonth = monthOffset === 0;
  const todayDate = today.getDate();
  const monthName = monthRefDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const monthlyData = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const isFutureDay = isCurrentMonth && d > todayDate;
    if (isFutureDay) { monthlyData[d] = 'future'; }
    else if (isCurrentMonth && d === todayDate) { monthlyData[d] = 'partial'; }
    else if (d % 11 === 0) { monthlyData[d] = 'missed'; }
    else if (d % 7 === 5) { monthlyData[d] = 'late'; }
    else { monthlyData[d] = 'taken'; }
  }

  const dayColors = { taken: C.sage, missed: C.red, late: C.amber, partial: C.coral, future: C.border };
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const effectiveDays = isCurrentMonth ? todayDate : daysInMonth;
  const pastDays = Array.from({ length: effectiveDays }, (_, i) => i + 1);
  const takenDays = pastDays.filter(d => monthlyData[d] === 'taken' || monthlyData[d] === 'partial').length;
  const missedDays = pastDays.filter(d => monthlyData[d] === 'missed').length;
  const lateDays = pastDays.filter(d => monthlyData[d] === 'late').length;
  const monthPct = pastDays.length > 0 ? Math.round((takenDays / pastDays.length) * 100) : 0;

  const completedDays = weeklyData.filter(d => !d.isFuture);
  const weekAvg = completedDays.length > 0 ? Math.round(completedDays.reduce((s, d) => s + d.pct, 0) / completedDays.length) : 0;

  // Nav label
  const navLabel = period === 'weekly' ? weekLabel : monthName;
  const canGoForward = period === 'weekly' ? weekOffset < 0 : monthOffset < 0;
  const goBack = () => period === 'weekly' ? setWeekOffset(o => o - 1) : setMonthOffset(o => o - 1);
  const goForward = () => period === 'weekly' ? setWeekOffset(o => o + 1) : setMonthOffset(o => o + 1);

  const badges = [
    { days: 3, icon: '🌱', label: '3-day streak', earned: true },
    { days: 7, icon: '⭐', label: '1 week', earned: true },
    { days: 14, icon: '🔥', label: '2 weeks', earned: true },
    { days: 30, icon: '🏆', label: '1 month', earned: false },
    { days: 60, icon: '💎', label: '2 months', earned: false },
    { days: 90, icon: '👑', label: '90 days', earned: false },
  ];

  const maxPct = Math.max(...weeklyData.map(d => d.pct));

  return (
    <div style={{ flex: 1, background: C.cream, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: 12, background: C.warmGrayLight, border: 'none', fontSize: 18, cursor: 'pointer' }}>←</button>
        <div style={{ fontFamily: fonts.heading, fontSize: 20, fontWeight: 700, color: C.text }}>Adherence Analytics</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Period toggle */}
        <div style={{ display: 'flex', gap: 8, background: C.warmGrayLight, padding: 4, borderRadius: 14 }}>
          {['weekly', 'monthly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: period === p ? C.white : 'transparent',
              fontFamily: fonts.body, fontSize: 14, fontWeight: 700,
              color: period === p ? C.text : C.textMuted,
              boxShadow: period === p ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s',
              textTransform: 'capitalize',
            }}>{p}</button>
          ))}
        </div>

        {/* Summary stats */}
        {(() => {
          const completedDays = weeklyData.filter(d => !d.isFuture);
          const weekAvg = completedDays.length > 0 ? Math.round(completedDays.reduce((s, d) => s + d.pct, 0) / completedDays.length) : 0;
          return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: period === 'weekly' ? 'This week' : 'This month', value: period === 'weekly' ? `${weekAvg}%` : `${monthPct}%`, icon: '📊', color: C.coral },
                { label: period === 'weekly' ? 'Days tracked' : 'Days taken', value: period === 'weekly' ? `${completedDays.length}/7` : `${takenDays}/${todayDate}`, icon: '📈', color: C.sage },
                { label: 'Best streak', value: '14 days', icon: '🔥', color: C.amber },
                { label: 'Current streak', value: '12 days', icon: '⚡', color: '#5B8EE0' },
              ].map((stat, i) => (
                <Card key={i}>
                  <div style={{ fontFamily: fonts.body, fontSize: 24, marginBottom: 4 }}>{stat.icon}</div>
                  <div style={{ fontFamily: fonts.heading, fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted }}>{stat.label}</div>
                </Card>
              ))}
            </div>
          );
        })()}

        {/* Bar chart (weekly) or Calendar heatmap (monthly) */}
        <Card>
          {/* Period navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button onClick={goBack} style={{
              width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`,
              background: C.white, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>←</button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.text }}>{navLabel}</div>
              {(period === 'weekly' ? isCurrentWeek : isCurrentMonth) && (
                <div style={{ fontFamily: fonts.body, fontSize: 11, color: C.coral, fontWeight: 600 }}>This {period === 'weekly' ? 'week' : 'month'}</div>
              )}
            </div>
            <button onClick={goForward} disabled={!canGoForward} style={{
              width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`,
              background: C.white, cursor: canGoForward ? 'pointer' : 'default',
              fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: canGoForward ? 1 : 0.3,
            }}>→</button>
          </div>

          {period === 'weekly' ? (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
                {weeklyData.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    {!d.isFuture && (
                      <div style={{ fontFamily: fonts.body, fontSize: 11, color: d.pct < 60 ? C.red : C.sage, fontWeight: 600 }}>{d.pct}%</div>
                    )}
                    {d.isFuture && <div style={{ fontSize: 11, color: 'transparent' }}>–</div>}
                    <div style={{
                      width: '100%', borderRadius: '6px 6px 0 0',
                      height: d.isFuture ? '4px' : `${(d.pct / 100) * 80}px`,
                      background: d.isFuture ? C.border : d.isToday ? C.coral : d.pct < 60 ? C.red : d.pct < 80 ? C.amber : C.sage,
                      transition: 'height 0.5s ease',
                      opacity: d.isFuture ? 0.4 : 1,
                      minHeight: 4,
                      alignSelf: 'flex-end',
                    }} />
                    <div style={{ fontFamily: fonts.body, fontSize: 11, color: d.isToday ? C.coral : C.textMuted, fontWeight: d.isToday ? 700 : 400 }}>{d.day}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Legend */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                {[['taken', 'Taken'], ['late', 'Late'], ['missed', 'Missed'], ['partial', 'Today']].map(([k, l]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: dayColors[k] }} />
                    <span style={{ fontFamily: fonts.body, fontSize: 11, color: C.textMuted }}>{l}</span>
                  </div>
                ))}
              </div>
              {/* Weekday headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 3 }}>
                {weekDays.map(d => (
                  <div key={d} style={{ textAlign: 'center', fontFamily: fonts.body, fontSize: 10, color: C.textMuted, fontWeight: 600 }}>{d}</div>
                ))}
              </div>
              {/* Days grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
                {Array(firstDayOfMonth).fill(null).map((_, i) => <div key={`e-${i}`} />)}
                {Array(daysInMonth).fill(null).map((_, i) => {
                  const d = i + 1;
                  const status = monthlyData[d];
                  const isToday = d === todayDate;
                  return (
                    <div key={d} style={{
                      aspectRatio: '1', borderRadius: 6,
                      background: status === 'future' ? C.warmGrayLight : dayColors[status] + '33',
                      border: isToday ? `2px solid ${C.coral}` : '2px solid transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: status === 'future' ? 0.35 : 1,
                      position: 'relative',
                    }}>
                      <span style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: isToday ? 800 : 500, color: status === 'future' ? C.textMuted : C.text }}>{d}</span>
                      {status && status !== 'future' && (
                        <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: dayColors[status] }} />
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Monthly summary row */}
              <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'space-between' }}>
                {[
                  { label: 'Taken', value: takenDays, color: C.sage },
                  { label: 'Late', value: lateDays, color: C.amber },
                  { label: 'Missed', value: missedDays, color: C.red },
                  { label: 'Adherence', value: `${monthPct}%`, color: C.coral },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', padding: '10px 4px', borderRadius: 10, background: C.warmGrayLight }}>
                    <div style={{ fontFamily: fonts.heading, fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontFamily: fonts.body, fontSize: 10, color: C.textMuted }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Badges */}
        <Card>
          <SectionHeader title="Streak badges" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {badges.map((b, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: '14px 8px', borderRadius: 14,
                background: b.earned ? C.coralLight : C.warmGrayLight,
                opacity: b.earned ? 1 : 0.5,
              }}>
                <span style={{ fontSize: 28, filter: b.earned ? 'none' : 'grayscale(1)' }}>{b.icon}</span>
                <div style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 700, color: b.earned ? C.coral : C.textMuted, textAlign: 'center' }}>{b.label}</div>
                {b.earned && <div style={{ fontFamily: fonts.body, fontSize: 10, color: C.sage, fontWeight: 600 }}>✓ Earned</div>}
              </div>
            ))}
          </div>
        </Card>

        {/* Health correlation */}
        <Card style={{ background: `linear-gradient(135deg, ${C.sageLight}, ${C.coralLight})` }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 32 }}>❤️</span>
            <div>
              <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>Health correlation</div>
              <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted, lineHeight: 1.5, marginBottom: 10 }}>
                Your BP readings have stabilised since you hit 80%+ adherence. Average BP: 128/82 mmHg (↓ from 145/90)
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Pill color={C.sage}>BP improved</Pill>
                <Pill color={C.coral}>87% adherence</Pill>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── SCREEN 11: FAMILY/CAREGIVER TAB ──
function FamilyScreen({ onNavigate, isNewUser }) {
  const [alertsOn, setAlertsOn] = useState2(true);
  const family = [
    { name: 'Sunita (Wife)', initials: 'SW', pct: 100, status: 'All caught up ✓', color: C.sage, bg: C.sageLight, meds: 3 },
    { name: 'Mohan (Father)', initials: 'MK', pct: 60, status: '1 dose missed', color: C.red, bg: C.redLight, meds: 5 },
    { name: 'Priya (Daughter)', initials: 'PK', pct: 100, status: 'All caught up ✓', color: C.sage, bg: C.sageLight, meds: 1 },
  ];

  return (
    <div style={{ flex: 1, background: C.cream, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ background: '#5B8EE0', padding: '20px 20px 28px', borderRadius: '0 0 28px 28px' }}>
        <div style={{ fontFamily: fonts.heading, fontSize: 22, fontWeight: 800, color: C.white, marginBottom: 4 }}>Family Dashboard</div>
        <div style={{ fontFamily: fonts.body, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>Real-time adherence for your loved ones</div>

        {/* SMS toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, padding: '12px 16px', background: 'rgba(255,255,255,0.15)', borderRadius: 14 }}>
          <span style={{ fontSize: 22 }}>💬</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.white }}>SMS alerts</div>
            <div style={{ fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Notify when dose is missed</div>
          </div>
          <button onClick={() => setAlertsOn(v => !v)} style={{
            width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
            background: alertsOn ? C.sage : 'rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', padding: '0 4px',
            transition: 'background 0.2s', justifyContent: alertsOn ? 'flex-end' : 'flex-start',
          }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.white }} />
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 20px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <SectionHeader title="Family members" />

        {isNewUser ? (
          /* Empty state for new users */
          <div style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 80, height: 80, borderRadius: 28, background: '#EEF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>👨‍👩‍👧</div>
            <div>
              <div style={{ fontFamily: fonts.heading, fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 6 }}>No family members yet</div>
              <div style={{ fontFamily: fonts.body, fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>Add a family member to let them view your adherence and get notified when you miss a dose.</div>
            </div>
            <Btn onClick={() => onNavigate('addFamily')} icon="+" style={{ paddingLeft: 24, paddingRight: 24 }}>Add family member</Btn>
          </div>
        ) : (
          /* Populated state for existing users */
          <>
            {family.map((f, i) => (
              <Card key={i} onClick={() => onNavigate('caregiver', { member: f })} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 18, background: f.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: fonts.body, fontSize: 16, fontWeight: 700, color: f.color, flexShrink: 0,
                  }}>{f.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: fonts.body, fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>{f.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ height: 6, flex: 1, borderRadius: 3, background: C.border, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: f.color, width: `${f.pct}%`, borderRadius: 3, transition: 'width 0.5s' }} />
                      </div>
                      <span style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: f.color, flexShrink: 0 }}>{f.pct}%</span>
                    </div>
                    <div style={{ fontFamily: fonts.body, fontSize: 13, color: f.color, fontWeight: 600 }}>{f.status}</div>
                  </div>
                  <span style={{ color: C.textMuted, fontSize: 18 }}>›</span>
                </div>
              </Card>
            ))}
            {/* Add family member */}
            <button onClick={() => onNavigate('addFamily')} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '18px', borderRadius: 20,
              border: `2px dashed ${C.border}`, background: 'transparent', cursor: 'pointer', width: '100%',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 18, background: C.warmGrayLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              }}>+</div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: fonts.body, fontSize: 16, fontWeight: 700, color: C.text }}>Add family member</div>
                <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted }}>Via QR code or phone number</div>
              </div>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── SCREEN 12: CAREGIVER VIEW ──
function CaregiverScreen({ member, onClose }) {
  const m = member || { name: 'Mohan (Father)', initials: 'MK', pct: 60, status: '1 dose missed', color: C.red, bg: C.redLight };
  const [waShown, setWaShown] = useState2(false);

  return (
    <div style={{ flex: 1, background: C.cream, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: 12, background: C.warmGrayLight, border: 'none', fontSize: 18, cursor: 'pointer' }}>←</button>
        <div style={{ fontFamily: fonts.heading, fontSize: 18, fontWeight: 700, color: C.text }}>Caregiver View</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Member card */}
        <Card style={{ background: m.bg, border: `2px solid ${m.color}33` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20, background: C.white,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: fonts.body, fontSize: 20, fontWeight: 700, color: m.color,
            }}>{m.initials}</div>
            <div>
              <div style={{ fontFamily: fonts.body, fontSize: 18, fontWeight: 700, color: C.text }}>{m.name}</div>
              <div style={{ fontFamily: fonts.body, fontSize: 14, color: m.color, fontWeight: 600 }}>{m.status}</div>
              <Pill color={m.color} style={{ marginTop: 6 }}>{m.pct}% taken today</Pill>
            </div>
          </div>
        </Card>

        {/* Missed dose alert */}
        <Card style={{ border: `2px solid ${C.red}44`, background: C.redLight }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <span style={{ fontSize: 32 }}>⚠️</span>
            <div>
              <div style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>Missed dose alert</div>
              <div style={{ fontFamily: fonts.body, fontSize: 14, color: C.text, lineHeight: 1.5, marginBottom: 12 }}>
                Mohan missed his <strong>Telmisartan 40mg</strong> at 1:00 PM today (Before lunch).
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Btn style={{ flex: 1, minHeight: 44, fontSize: 14 }} icon="📞">Call now</Btn>
                <Btn variant="secondary" style={{ flex: 1, minHeight: 44, fontSize: 14 }} icon="💬">SMS</Btn>
              </div>
            </div>
          </div>
        </Card>

        {/* SMS preview */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 24 }}>💬</span>
            <div style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 700, color: C.text }}>SMS alert preview</div>
            <button onClick={() => setWaShown(v => !v)} style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, fontFamily: fonts.body, fontSize: 12, cursor: 'pointer', color: C.textMuted }}>
              {waShown ? 'Hide' : 'Preview'}
            </button>
          </div>
          {waShown && (
            <div style={{ background: '#ECE5DD', borderRadius: 14, padding: 12 }}>
              <div style={{ background: C.white, borderRadius: '4px 14px 14px 14px', padding: '12px 14px', maxWidth: '85%', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
                <div style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 700, color: '#25D366', marginBottom: 4 }}>💊 SaathiPill</div>
                <div style={{ fontFamily: fonts.body, fontSize: 14, color: '#111', lineHeight: 1.5 }}>
                  ⚠️ <strong>Mohan Kumar</strong> missed his Telmisartan 40mg dose (1:00 PM). <br /><br />
                  He has not responded to 2 reminders. Please check in. 🙏<br /><br />
                  <span style={{ color: '#5B8EE0' }}>👉 Open SaathiPill</span>
                </div>
                <div style={{ fontFamily: fonts.body, fontSize: 11, color: '#aaa', textAlign: 'right', marginTop: 6 }}>1:28 PM ✓✓</div>
              </div>
            </div>
          )}
        </Card>

        {/* Today's meds for this member */}
        <SectionHeader title="Mohan's medicines today" />
        {[
          { name: 'Metformin 500mg', time: '8:00 AM', taken: true },
          { name: 'Amlodipine 5mg', time: '9:00 AM', taken: true },
          { name: 'Telmisartan 40mg', time: '1:00 PM', taken: false },
          { name: 'Losartan 50mg', time: '9:00 PM', taken: false },
        ].map((med, i) => (
          <Card key={i} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: med.taken ? C.sage : C.red, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 600, color: C.text }}>{med.name}</div>
              <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted }}>{med.time}</div>
            </div>
            <Pill color={med.taken ? C.sage : C.red}>{med.taken ? 'Taken' : 'Missed'}</Pill>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── SCREEN: ADD FAMILY MEMBER ──
function AddFamilyMemberScreen({ onClose, onAdded, userName }) {
  const [mode, setMode] = React.useState('choice'); // 'choice' | 'qr' | 'phone'
  const [phone, setPhone] = React.useState('');
  const [name, setName] = React.useState('');
  const [relation, setRelation] = React.useState('');
  const [sent, setSent] = React.useState(false);

  const relations = ['Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Sibling', 'Other'];

  // Fake QR code as SVG grid
  function QRCode() {
    const size = 9;
    // deterministic pattern
    const cells = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const isCorner = (r < 3 && c < 3) || (r < 3 && c >= size - 3) || (r >= size - 3 && c < 3);
        const isFilled = isCorner || ((r * 3 + c * 7 + r * c) % 3 === 0);
        cells.push({ r, c, filled: isFilled });
      }
    }
    const cell = 20;
    const padding = 16;
    const total = size * cell + padding * 2;
    return (
      <svg width={total} height={total} viewBox={`0 0 ${total} ${total}`} style={{ borderRadius: 16 }}>
        <rect width={total} height={total} fill="#fff" rx="16" />
        {cells.map(({ r, c, filled }) => filled && (
          <rect key={`${r}-${c}`}
            x={padding + c * cell + 1} y={padding + r * cell + 1}
            width={cell - 2} height={cell - 2}
            rx={2} fill="#1a1a1a"
          />
        ))}
        {/* Corner markers */}
        {[[0,0],[0,6],[6,0]].map(([row, col], i) => (
          <g key={i}>
            <rect x={padding + col * cell} y={padding + row * cell} width={cell * 3} height={cell * 3} rx={4} fill="#1a1a1a" />
            <rect x={padding + col * cell + 3} y={padding + row * cell + 3} width={cell * 3 - 6} height={cell * 3 - 6} rx={2} fill="#fff" />
            <rect x={padding + col * cell + 6} y={padding + row * cell + 6} width={cell * 3 - 12} height={cell * 3 - 12} rx={2} fill="#1a1a1a" />
          </g>
        ))}
      </svg>
    );
  }

  return (
    <div style={{ flex: 1, background: C.cream, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${C.border}` }}>
        <button
          onClick={mode === 'choice' ? onClose : () => { setMode('choice'); setSent(false); }}
          style={{ width: 40, height: 40, borderRadius: 12, background: C.warmGrayLight, border: 'none', fontSize: 18, cursor: 'pointer' }}>
          {mode === 'choice' ? '✕' : '←'}
        </button>
        <div>
          <div style={{ fontFamily: fonts.heading, fontSize: 18, fontWeight: 700, color: C.text }}>Add family member</div>
          <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>
            {mode === 'choice' ? 'Choose how to connect' : mode === 'qr' ? 'Scan QR code' : 'Send invite via phone'}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '24px 20px 32px' }}>

        {/* ── Choice screen ── */}
        {mode === 'choice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontFamily: fonts.body, fontSize: 15, color: C.textMuted, lineHeight: 1.6, marginBottom: 4 }}>
              Invite a family member to view your medicines and get notified when you miss a dose.
            </p>

            {/* QR option */}
            <button onClick={() => setMode('qr')} style={{
              display: 'flex', alignItems: 'center', gap: 18,
              padding: '22px 20px', borderRadius: 20,
              background: C.white, border: `2px solid ${C.border}`,
              cursor: 'pointer', textAlign: 'left', width: '100%',
              boxShadow: '0 2px 12px rgba(44,36,32,0.06)',
              transition: 'border-color 0.2s',
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: 18, background: C.coralLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0,
              }}>⬛</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: fonts.body, fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>Scan QR code</div>
                <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
                  Show this QR to your family member. They scan it to connect instantly.
                </div>
                <div style={{ marginTop: 8 }}>
                  <Pill color={C.coral}>Fastest · No app needed to connect</Pill>
                </div>
              </div>
              <span style={{ color: C.textMuted, fontSize: 22 }}>›</span>
            </button>

            {/* Phone option */}
            <button onClick={() => setMode('phone')} style={{
              display: 'flex', alignItems: 'center', gap: 18,
              padding: '22px 20px', borderRadius: 20,
              background: C.white, border: `2px solid ${C.border}`,
              cursor: 'pointer', textAlign: 'left', width: '100%',
              boxShadow: '0 2px 12px rgba(44,36,32,0.06)',
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: 18, background: '#E8F5EE',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0,
              }}>📱</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: fonts.body, fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>Phone number</div>
                <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
                  Send an invite link via SMS to their number.
                </div>
                <div style={{ marginTop: 8 }}>
                  <Pill color={C.sage}>SMS · In-app · Works remotely</Pill>
                </div>
              </div>
              <span style={{ color: C.textMuted, fontSize: 22 }}>›</span>
            </button>

            {/* Privacy note */}
            <div style={{ padding: '14px 16px', borderRadius: 14, background: C.amberLight, border: `1px solid ${C.amber}33` }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 18 }}>🔒</span>
                <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.text, lineHeight: 1.5 }}>
                  Family members can only <strong>view</strong> your medicine schedule and adherence. They cannot edit your medicines. You can remove them anytime.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── QR Code screen ── */}
        {mode === 'qr' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            <div style={{ textAlign: 'center', maxWidth: 280 }}>
              <p style={{ fontFamily: fonts.body, fontSize: 15, color: C.textMuted, lineHeight: 1.6 }}>
                Ask your family member to open SaathiPill and tap <strong>"Scan family QR"</strong> — or scan with their phone camera.
              </p>
            </div>

            {/* QR card */}
            <div style={{
              background: C.white, borderRadius: 24, padding: 24,
              boxShadow: '0 4px 32px rgba(44,36,32,0.12)', border: `1px solid ${C.border}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            }}>
              <QRCode />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: fonts.heading, fontSize: 16, fontWeight: 700, color: C.text }}>{userName || 'Shreyas Kumar'}</div>
                <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted }}>SaathiPill · saathipill.app/join/sk2026</div>
              </div>
            </div>

            {/* Share QR */}
            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <button style={{
                flex: 1, padding: '14px 0', borderRadius: 14,
                background: '#25D366', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 20 }}>💬</span>
                <span style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.white }}>Share via SMS</span>
              </button>
              <button style={{
                width: 52, height: 52, borderRadius: 14, border: `2px solid ${C.border}`,
                background: C.white, cursor: 'pointer', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>📋</button>
            </div>

            {/* Expiry note */}
            <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.textMuted, textAlign: 'center' }}>
              This QR code expires in 24 hours · Refresh to generate a new one
            </div>

            <div style={{ width: '100%', height: 1, background: C.border }} />

            <div style={{ width: '100%', textAlign: 'center' }}>
              <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted, marginBottom: 12 }}>Waiting for family member to scan…</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: '50%', background: C.coral,
                    animation: `dotPulse 1.2s ease-in-out ${i * 0.3}s infinite`,
                  }} />
                ))}
              </div>
            </div>
            <style>{`@keyframes dotPulse { 0%,80%,100%{opacity:0.3;transform:scale(0.8)} 40%{opacity:1;transform:scale(1.1)} }`}</style>
          </div>
        )}

        {/* ── Phone number screen ── */}
        {mode === 'phone' && !sent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Name */}
            <div>
              <label style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 8 }}>Their name</label>
              <input
                value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Priya"
                style={{
                  width: '100%', height: 52, padding: '0 16px', borderRadius: 14,
                  border: `2px solid ${name ? C.coral : C.border}`, background: C.white,
                  fontFamily: fonts.body, fontSize: 16, color: C.text,
                  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
                }}
              />
            </div>

            {/* Relation */}
            <div>
              <label style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 8 }}>Relationship</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {relations.map(r => (
                  <button key={r} onClick={() => setRelation(r)} style={{
                    padding: '10px 16px', borderRadius: 12,
                    border: `2px solid ${relation === r ? C.coral : C.border}`,
                    background: relation === r ? C.coralLight : C.white,
                    color: relation === r ? C.coral : C.text,
                    fontFamily: fonts.body, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}>{r}</button>
                ))}
              </div>
            </div>

            {/* Phone number */}
            <div>
              <label style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 8 }}>Phone number</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{
                  height: 52, padding: '0 14px', borderRadius: 14,
                  border: `2px solid ${C.border}`, background: C.white,
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontFamily: fonts.body, fontSize: 15, color: C.text, flexShrink: 0,
                }}>
                  🇮🇳 +91
                </div>
                <input
                  value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
                  placeholder="98765 43210"
                  type="tel"
                  style={{
                    flex: 1, height: 52, padding: '0 16px', borderRadius: 14,
                    border: `2px solid ${phone.length === 10 ? C.coral : C.border}`, background: C.white,
                    fontFamily: fonts.body, fontSize: 16, color: C.text,
                    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
                  }}
                />
              </div>
              {phone.length > 0 && phone.length < 10 && (
                <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.amber, marginTop: 6 }}>Enter 10-digit number</div>
              )}
            </div>

            {/* Send via */}
            <div>
              <label style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 8 }}>Send invite via</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[['💬', 'SMS', C.sage], ['🔗', 'Copy link', C.warmGray]].map(([icon, label, color]) => (
                  <div key={label} style={{
                    flex: 1, padding: '14px 12px', borderRadius: 14,
                    border: `2px solid ${C.border}`, background: C.white,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    cursor: 'pointer',
                  }}>
                    <span style={{ fontSize: 24 }}>{icon}</span>
                    <span style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <Btn
              onClick={() => setSent(true)}
              disabled={!name || !relation || phone.length !== 10}
              icon="📤"
            >Send invite</Btn>
          </div>
        )}

        {/* ── Sent confirmation ── */}
        {mode === 'phone' && sent && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, paddingTop: 20 }}>
            <div style={{
              width: 100, height: 100, borderRadius: 32, background: C.sageLight,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52,
            }}>✅</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: fonts.heading, fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 8 }}>Invite sent!</div>
              <div style={{ fontFamily: fonts.body, fontSize: 15, color: C.textMuted, lineHeight: 1.6 }}>
                {name} will receive an SMS with a link to join SaathiPill as your caregiver.
              </div>
            </div>
            <Card style={{ width: '100%', background: C.sageLight, border: `1px solid ${C.sage}33` }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.body, fontSize: 16, fontWeight: 700, color: C.sage }}>
                  {name[0]}
                </div>
                <div>
                  <div style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 700, color: C.text }}>{name}</div>
                  <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted }}>{relation} · +91 {phone}</div>
                  <Pill color={C.amber} style={{ marginTop: 6 }}>Pending · Invite sent</Pill>
                </div>
              </div>
            </Card>
            <Btn onClick={() => { onAdded && onAdded({ name, relation, phone }); onClose(); }} variant="sage" icon="✓">
              Done
            </Btn>
            <button onClick={() => { setMode('phone'); setSent(false); setName(''); setPhone(''); setRelation(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: fonts.body, fontSize: 14, color: C.textMuted, textDecoration: 'underline' }}>
              Add another family member
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, {
  ReminderModal, EscalationScreen, AIInsightsScreen,
  HistoryScreen, AnalyticsScreen, FamilyScreen, CaregiverScreen,
  AddFamilyMemberScreen
});
