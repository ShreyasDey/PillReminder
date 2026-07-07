// ── Arogya Pharmacy Portal — Fake Data ──

// Clinical & Confident theme — Deep Blue + Teal + White.
// `coral`* keys now hold the deep-blue primary; `sage`* hold teal. Cool-white surfaces.
const C = {
  coral: '#1D62A6',       // deep-blue primary (actions, accents)
  coralSoft: '#E6EFF8',
  navy: '#1F3864',
  navyDeep: '#13294A',    // sidebar / deepest blue
  navySoft: '#E5EDF7',
  cream: '#F4F7FB',
  creamWarm: '#EAF0F7',
  white: '#FFFFFF',
  sage: '#0E9594',        // teal (positive / success)
  sageSoft: '#DBF1EF',
  red: '#C0392B',
  redSoft: '#FBE6E3',
  amber: '#E8B547',
  amberSoft: '#FBF1D9',
  ink: '#0F1B2D',
  text: '#1B2538',
  textMid: '#4A5468',
  textMuted: '#8590A5',
  border: '#DCE3EC',
  borderSoft: '#E6EBF2',
  divider: '#EEF2F7',
};

const fonts = {
  body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  num: "'Inter', sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};

// Format Indian rupees with comma grouping (12,34,567 style)
function inr(n, opts = {}) {
  const { decimals = 0 } = opts;
  const num = Number(n);
  if (isNaN(num)) return '₹0';
  const fixed = num.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  // Indian numbering: last 3 digits, then groups of 2
  const lastThree = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  const formatted = rest
    ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
    : lastThree;
  return '₹' + formatted + (decPart ? '.' + decPart : '');
}

// `let` (not `const`) so a real backend can replace these with live data at runtime.
let PATIENTS = [
  { id: 1, name: 'Suresh Kumar', age: 62, gender: 'M', conditions: ['Type 2 Diabetes'], medCount: 6, adherence: 92, lastRefill: '2026-05-04', spent: 48720, since: 'Mar 2022', phone: '+91 98201 4XX21', meds: ['Metformin 500mg','Glimepiride 2mg','Atorvastatin 20mg','Aspirin 75mg','Vitamin D3 60K','Pantoprazole 40mg'] },
  { id: 2, name: 'Lakshmi Iyer', age: 58, gender: 'F', conditions: ['Hypertension','Diabetes'], medCount: 4, adherence: 78, lastRefill: '2026-04-29', spent: 32450, since: 'Jan 2023', phone: '+91 98675 2XX08', meds: ['Telmisartan 40mg','Metformin 500mg','Amlodipine 5mg','Atorvastatin 20mg'] },
  { id: 3, name: 'Mohammed Ansari', age: 71, gender: 'M', conditions: ['Cardiac','Diabetes'], medCount: 8, adherence: 45, lastRefill: '2026-03-18', spent: 71280, since: 'Aug 2021', phone: '+91 99204 1XX72', meds: ['Clopidogrel 75mg','Aspirin 75mg','Atorvastatin 20mg','Metformin 500mg','Glimepiride 2mg','Telmisartan 40mg','Pantoprazole 40mg','Amlodipine 5mg'], risk: 'switch-risk' },
  { id: 4, name: 'Priya Deshpande', age: 45, gender: 'F', conditions: ['Thyroid'], medCount: 1, adherence: 95, lastRefill: '2026-05-07', spent: 8940, since: 'Sep 2023', phone: '+91 98330 5XX18', meds: ['Thyronorm 50mcg'] },
  { id: 5, name: 'Vikram Reddy', age: 67, gender: 'M', conditions: ['COPD','Hypertension'], medCount: 5, adherence: 71, lastRefill: '2026-04-22', spent: 41280, since: 'Feb 2022', phone: '+91 97411 8XX44', meds: ['Telmisartan 40mg','Amlodipine 5mg','Aspirin 75mg','Pantoprazole 40mg','Vitamin D3 60K'] },
  { id: 6, name: 'Sunita Joshi', age: 53, gender: 'F', conditions: ['Diabetes'], medCount: 3, adherence: 88, lastRefill: '2026-05-02', spent: 22180, since: 'Jun 2023', phone: '+91 96574 1XX91', meds: ['Metformin 500mg','Glimepiride 2mg','Atorvastatin 20mg'] },
  { id: 7, name: 'Anil Malhotra', age: 69, gender: 'M', conditions: ['Cardiac'], medCount: 4, adherence: 82, lastRefill: '2026-04-30', spent: 36750, since: 'Nov 2022', phone: '+91 99102 7XX36', meds: ['Clopidogrel 75mg','Aspirin 75mg','Atorvastatin 20mg','Telmisartan 40mg'] },
  { id: 8, name: 'Geeta Rao', age: 60, gender: 'F', conditions: ['Diabetes','Cholesterol'], medCount: 5, adherence: 89, lastRefill: '2026-05-05', spent: 38420, since: 'Apr 2023', phone: '+91 98456 3XX19', meds: ['Metformin 500mg','Glimepiride 2mg','Atorvastatin 20mg','Aspirin 75mg','Pantoprazole 40mg'] },
  { id: 9, name: 'Ramesh Yadav', age: 64, gender: 'M', conditions: ['Hypertension'], medCount: 2, adherence: 67, lastRefill: '2026-04-15', spent: 14820, since: 'Jul 2024', phone: '+91 97318 5XX73', meds: ['Telmisartan 40mg','Amlodipine 5mg'], risk: 'adherence-dip' },
  { id: 10, name: 'Kavita Bhatia', age: 49, gender: 'F', conditions: ['Thyroid','PCOS'], medCount: 3, adherence: 91, lastRefill: '2026-05-06', spent: 19280, since: 'Feb 2023', phone: '+91 98212 4XX67', meds: ['Thyronorm 50mcg','Metformin 500mg','Vitamin D3 60K'] },
  { id: 11, name: 'Rajesh Iyengar', age: 56, gender: 'M', conditions: ['Diabetes','Hypertension'], medCount: 4, adherence: 84, lastRefill: '2026-05-01', spent: 28640, since: 'May 2023', phone: '+91 98674 2XX09', meds: ['Metformin 500mg','Telmisartan 40mg','Glimepiride 2mg','Atorvastatin 20mg'] },
  { id: 12, name: 'Meera Pillai', age: 51, gender: 'F', conditions: ['Thyroid'], medCount: 2, adherence: 96, lastRefill: '2026-05-07', spent: 11420, since: 'Aug 2023', phone: '+91 99478 3XX52', meds: ['Thyronorm 50mcg','Vitamin D3 60K'] },
  { id: 13, name: 'Harish Patel', age: 73, gender: 'M', conditions: ['Cardiac','COPD'], medCount: 7, adherence: 58, lastRefill: '2026-04-12', spent: 56340, since: 'Jan 2022', phone: '+91 98453 7XX21', meds: ['Clopidogrel 75mg','Aspirin 75mg','Atorvastatin 20mg','Telmisartan 40mg','Amlodipine 5mg','Pantoprazole 40mg','Vitamin D3 60K'], risk: 'switch-risk' },
  { id: 14, name: 'Anita Nair', age: 46, gender: 'F', conditions: ['Diabetes'], medCount: 2, adherence: 87, lastRefill: '2026-05-03', spent: 17280, since: 'Oct 2023', phone: '+91 97312 5XX84', meds: ['Metformin 500mg','Glimepiride 2mg'] },
  { id: 15, name: 'Sanjay Gupta', age: 59, gender: 'M', conditions: ['Hypertension','Cholesterol'], medCount: 3, adherence: 80, lastRefill: '2026-04-27', spent: 23980, since: 'Mar 2023', phone: '+91 98202 8XX31', meds: ['Telmisartan 40mg','Atorvastatin 20mg','Aspirin 75mg'] },
  { id: 16, name: 'Rukmini Shetty', age: 67, gender: 'F', conditions: ['Diabetes','Hypertension'], medCount: 4, adherence: 76, lastRefill: '2026-04-20', spent: 26410, since: 'Jun 2022', phone: '+91 99456 1XX28', meds: ['Metformin 500mg','Telmisartan 40mg','Atorvastatin 20mg','Glimepiride 2mg'] },
  { id: 17, name: 'Devendra Joshi', age: 64, gender: 'M', conditions: ['Cardiac','Diabetes'], medCount: 6, adherence: 73, lastRefill: '2026-04-24', spent: 44210, since: 'Sep 2022', phone: '+91 97389 4XX17', meds: ['Clopidogrel 75mg','Aspirin 75mg','Metformin 500mg','Atorvastatin 20mg','Telmisartan 40mg','Pantoprazole 40mg'] },
  { id: 18, name: 'Padma Krishnan', age: 70, gender: 'F', conditions: ['Hypertension','Thyroid'], medCount: 3, adherence: 86, lastRefill: '2026-05-04', spent: 21940, since: 'Apr 2023', phone: '+91 98765 1XX09', meds: ['Telmisartan 40mg','Thyronorm 50mcg','Amlodipine 5mg'] },
  { id: 19, name: 'Imran Sheikh', age: 55, gender: 'M', conditions: ['Diabetes'], medCount: 3, adherence: 81, lastRefill: '2026-04-28', spent: 19850, since: 'Dec 2022', phone: '+91 99203 4XX65', meds: ['Metformin 500mg','Glimepiride 2mg','Atorvastatin 20mg'] },
  { id: 20, name: 'Aarti Verma', age: 55, gender: 'F', conditions: ['Diabetes'], medCount: 2, adherence: null, lastRefill: null, spent: 0, since: 'May 2026', phone: '+91 98201 7XX42', meds: ['Metformin 500mg','Glimepiride 2mg'], isNew: true },
];

// Urgent attention items for dashboard
const URGENT = [
  { id: 'u1', patientId: 3, kind: 'out-of-stock', title: '3 meds running out tomorrow', detail: 'Clopidogrel, Aspirin, Atorvastatin — 1 day left', tag: 'CRITICAL', tagColor: 'red', action: 'Prepare refill' },
  { id: 'u2', patientId: 3, kind: 'switch-risk', title: 'Adherence at 45% — switch risk', detail: 'No refill in 56 days. Last seen Mar 18.', tag: 'SWITCH RISK', tagColor: 'red', action: 'Call patient' },
  { id: 'u3', patientId: 8, kind: 'pending-order', title: 'Refill order ₹2,840 awaiting confirmation', detail: 'Atorvastatin × 30, Metformin × 60 — placed 2h ago', tag: 'PENDING 2H', tagColor: 'amber', action: 'Confirm order' },
  { id: 'u4', patientId: 9, kind: 'adherence-dip', title: 'Adherence dropped to 67% (was 84%)', detail: 'Missed 9 of last 30 doses — Telmisartan', tag: 'ADHERENCE', tagColor: 'amber', action: 'Send SMS' },
  { id: 'u5', patientId: 13, kind: 'out-of-stock', title: '2 meds running out in 3 days', detail: 'Clopidogrel, Telmisartan — needs refill by Wed', tag: 'AMBER', tagColor: 'amber', action: 'Prepare refill' },
  { id: 'u6', patientId: 2, kind: 'pending-order', title: 'Refill order ₹1,420 placed', detail: 'Telmisartan × 30, Amlodipine × 30 — placed 4h ago', tag: 'PENDING 4H', tagColor: 'amber', action: 'Confirm order' },
  { id: 'u7', patientId: 20, kind: 'new-patient', title: 'New patient linked — needs first refill', detail: 'Aarti Verma, 55 · Diabetes · just joined', tag: 'NEW', tagColor: 'navy', action: 'Set up' },
];

const ACTIVITY = [
  { id: 'a1', time: '11 min ago', kind: 'confirmed', icon: '✓', text: 'Mrs. Geeta Rao confirmed order #SP-1234 — ₹2,840' },
  { id: 'a2', time: '34 min ago', kind: 'ran-out', icon: '!', text: 'Mr. Mohammed Ansari ran out of Metformin (auto-flagged)' },
  { id: 'a3', time: '1h ago', kind: 'new', icon: '+', text: 'New patient linked: Aarti Verma, 55 — Diabetes' },
  { id: 'a4', time: '2h ago', kind: 'order', icon: '◷', text: 'Refill order placed: Geeta Rao — ₹2,840' },
  { id: 'a5', time: '2h ago', kind: 'ready', icon: '✓', text: 'Order #SP-1228 ready for pickup — Suresh Kumar' },
  { id: 'a6', time: '3h ago', kind: 'delivered', icon: '⇨', text: 'Order collected — Priya Deshpande, ₹890' },
  { id: 'a7', time: '4h ago', kind: 'order', icon: '◷', text: 'Refill order placed: Lakshmi Iyer — ₹1,420' },
  { id: 'a8', time: '5h ago', kind: 'sms', icon: '✉', text: 'Reminder sent via SMS — Ramesh Yadav' },
  { id: 'a9', time: '6h ago', kind: 'ready', icon: '✓', text: 'Order #SP-1225 ready for pickup — Anil Malhotra' },
  { id: 'a10', time: '7h ago', kind: 'confirmed', icon: '✓', text: 'Mr. Vikram Reddy confirmed order #SP-1224 — ₹1,680' },
  { id: 'a11', time: '8h ago', kind: 'adherence', icon: '↓', text: 'Adherence alert: Ramesh Yadav dropped below 70%' },
];

// 7-day revenue (last 7 days)
const REV_7DAYS = [
  { day: 'Mon', date: 'May 5', amount: 14280 },
  { day: 'Tue', date: 'May 6', amount: 16920 },
  { day: 'Wed', date: 'May 7', amount: 12450 },
  { day: 'Thu', date: 'May 8', amount: 19840 },
  { day: 'Fri', date: 'May 9', amount: 21320 },
  { day: 'Sat', date: 'May 10', amount: 24180 },
  { day: 'Sun', date: 'May 11', amount: 18400 },
];

const REV_12MONTHS = [
  { m: 'Jun', amount: 268420 },
  { m: 'Jul', amount: 281340 },
  { m: 'Aug', amount: 294180 },
  { m: 'Sep', amount: 305840 },
  { m: 'Oct', amount: 287920 },
  { m: 'Nov', amount: 318240 },
  { m: 'Dec', amount: 341280 },
  { m: 'Jan', amount: 312480 },
  { m: 'Feb', amount: 298420 },
  { m: 'Mar', amount: 324180 },
  { m: 'Apr', amount: 336420 },
  { m: 'May', amount: 342850 },
];

let REFILLS = [
  { id: 'SP-1235', patientId: 8, name: 'Geeta Rao', placed: '2h ago', placedTime: '11:42 AM', status: 'pending', delivery: 'pickup', amount: 2840, items: [{ med: 'Atorvastatin 20mg', qty: 30 }, { med: 'Metformin 500mg', qty: 60 }] },
  { id: 'SP-1236', patientId: 2, name: 'Lakshmi Iyer', placed: '4h ago', placedTime: '9:18 AM', status: 'pending', delivery: 'pickup', amount: 1420, items: [{ med: 'Telmisartan 40mg', qty: 30 }, { med: 'Amlodipine 5mg', qty: 30 }] },
  { id: 'SP-1237', patientId: 3, name: 'Mohammed Ansari', placed: '5h ago', placedTime: '8:45 AM', status: 'pending', delivery: 'pickup', amount: 4280, items: [{ med: 'Clopidogrel 75mg', qty: 30 }, { med: 'Aspirin 75mg', qty: 30 }, { med: 'Atorvastatin 20mg', qty: 30 }], urgent: true },
  { id: 'SP-1228', patientId: 1, name: 'Suresh Kumar', placed: 'yesterday', placedTime: 'Yesterday 4:20 PM', status: 'ready', delivery: 'pickup', amount: 3260, items: [{ med: 'Metformin 500mg', qty: 60 }, { med: 'Glimepiride 2mg', qty: 30 }, { med: 'Atorvastatin 20mg', qty: 30 }] },
  { id: 'SP-1225', patientId: 7, name: 'Anil Malhotra', placed: 'yesterday', placedTime: 'Yesterday 2:10 PM', status: 'ready', delivery: 'pickup', amount: 2180, items: [{ med: 'Clopidogrel 75mg', qty: 30 }, { med: 'Aspirin 75mg', qty: 30 }] },
  { id: 'SP-1238', patientId: 11, name: 'Rajesh Iyengar', placed: '1h ago', placedTime: '12:38 PM', status: 'confirmed', delivery: 'pickup', amount: 1980, items: [{ med: 'Metformin 500mg', qty: 60 }, { med: 'Telmisartan 40mg', qty: 30 }] },
  { id: 'SP-1239', patientId: 5, name: 'Vikram Reddy', placed: '3h ago', placedTime: '10:42 AM', status: 'confirmed', delivery: 'pickup', amount: 2640, items: [{ med: 'Telmisartan 40mg', qty: 30 }, { med: 'Amlodipine 5mg', qty: 30 }, { med: 'Aspirin 75mg', qty: 30 }] },
  { id: 'SP-1220', patientId: 4, name: 'Priya Deshpande', placed: 'yesterday', placedTime: 'Yesterday 11:30 AM', status: 'delivered', delivery: 'pickup', amount: 890, items: [{ med: 'Thyronorm 50mcg', qty: 30 }] },
  { id: 'SP-1240', patientId: 14, name: 'Anita Nair', placed: '40 min ago', placedTime: '1:02 PM', status: 'pending', delivery: 'pickup', amount: 1240, items: [{ med: 'Metformin 500mg', qty: 60 }, { med: 'Glimepiride 2mg', qty: 30 }] },
  { id: 'SP-1241', patientId: 10, name: 'Kavita Bhatia', placed: '20 min ago', placedTime: '1:22 PM', status: 'pending', delivery: 'pickup', amount: 1680, items: [{ med: 'Thyronorm 50mcg', qty: 30 }, { med: 'Metformin 500mg', qty: 60 }, { med: 'Vitamin D3 60K', qty: 4 }] },
  { id: 'SP-1242', patientId: 6, name: 'Sunita Joshi', placed: '1h ago', placedTime: '12:30 PM', status: 'pending', delivery: 'pickup', amount: 2120, items: [{ med: 'Metformin 500mg', qty: 60 }, { med: 'Glimepiride 2mg', qty: 30 }, { med: 'Atorvastatin 20mg', qty: 30 }] },
  { id: 'SP-1243', patientId: 15, name: 'Sanjay Gupta', placed: '3h ago', placedTime: '10:48 AM', status: 'pending', delivery: 'pickup', amount: 1820, items: [{ med: 'Telmisartan 40mg', qty: 30 }, { med: 'Atorvastatin 20mg', qty: 30 }, { med: 'Aspirin 75mg', qty: 30 }] },
];

let INVENTORY = [
  { name: 'Metformin 500mg', stock: 1240, demand7d: 980, status: 'in-stock', mrp: 4.20, supplier: 'Sun Pharma' },
  { name: 'Telmisartan 40mg', stock: 480, demand7d: 420, status: 'order-soon', mrp: 8.50, supplier: 'Glenmark' },
  { name: 'Atorvastatin 20mg', stock: 920, demand7d: 510, status: 'in-stock', mrp: 6.80, supplier: 'Pfizer' },
  { name: 'Glimepiride 2mg', stock: 280, demand7d: 240, status: 'order-soon', mrp: 5.40, supplier: 'Sanofi' },
  { name: 'Aspirin 75mg', stock: 1680, demand7d: 540, status: 'in-stock', mrp: 1.20, supplier: 'USV' },
  { name: 'Thyronorm 50mcg', stock: 320, demand7d: 180, status: 'in-stock', mrp: 3.80, supplier: 'Abbott' },
  { name: 'Amlodipine 5mg', stock: 140, demand7d: 210, status: 'out-of-stock', mrp: 3.40, supplier: 'Cipla' },
  { name: 'Pantoprazole 40mg', stock: 760, demand7d: 360, status: 'in-stock', mrp: 5.60, supplier: 'Sun Pharma' },
  { name: 'Vitamin D3 60K', stock: 84, demand7d: 38, status: 'in-stock', mrp: 28.00, supplier: 'Mankind' },
  { name: 'Clopidogrel 75mg', stock: 180, demand7d: 240, status: 'out-of-stock', mrp: 9.20, supplier: 'Sanofi' },
  { name: 'Losartan 50mg', stock: 540, demand7d: 180, status: 'in-stock', mrp: 6.40, supplier: 'Torrent' },
  { name: 'Rosuvastatin 10mg', stock: 220, demand7d: 90, status: 'in-stock', mrp: 9.80, supplier: 'Cipla' },
];

// Patient detail data — adherence chart points for last 90 days (sampled weekly)
function adherenceTimeline(patient) {
  // Generate plausible adherence curve based on patient.adherence
  const base = patient.adherence || 75;
  const points = [];
  let val = Math.min(95, base + 8);
  for (let i = 12; i >= 0; i--) {
    const noise = (Math.sin(i * 1.3 + patient.id) * 6);
    const drift = patient.risk === 'switch-risk' ? -(12 - i) * 1.2 : 0;
    val = Math.max(20, Math.min(100, base + noise + drift + (i === 0 ? 0 : (Math.random() - 0.5) * 3)));
    points.push(Math.round(val));
  }
  // Force last value to match
  points[points.length - 1] = base;
  return points;
}

// Refill history for patient detail
function refillHistory(patient) {
  if (!patient.lastRefill) return [];
  return [
    { date: patient.lastRefill, amount: Math.round(patient.spent * 0.18), items: Math.min(patient.medCount, 4), status: 'delivered' },
    { date: '2026-04-08', amount: Math.round(patient.spent * 0.14), items: Math.min(patient.medCount, 3), status: 'delivered' },
    { date: '2026-03-12', amount: Math.round(patient.spent * 0.16), items: Math.min(patient.medCount, 4), status: 'delivered' },
    { date: '2026-02-14', amount: Math.round(patient.spent * 0.13), items: Math.min(patient.medCount, 3), status: 'delivered' },
    { date: '2026-01-18', amount: Math.round(patient.spent * 0.15), items: Math.min(patient.medCount, 4), status: 'delivered' },
    { date: '2025-12-20', amount: Math.round(patient.spent * 0.12), items: Math.min(patient.medCount, 3), status: 'delivered' },
    { date: '2025-11-22', amount: Math.round(patient.spent * 0.14), items: Math.min(patient.medCount, 4), status: 'delivered' },
    { date: '2025-10-25', amount: Math.round(patient.spent * 0.11), items: Math.min(patient.medCount, 3), status: 'delivered' },
    { date: '2025-09-28', amount: Math.round(patient.spent * 0.13), items: Math.min(patient.medCount, 3), status: 'delivered' },
    { date: '2025-08-30', amount: Math.round(patient.spent * 0.10), items: Math.min(patient.medCount, 3), status: 'delivered' },
  ];
}

// Map condition → color chip
const CONDITION_COLOR = {
  'Type 2 Diabetes': { bg: '#E8EDF5', text: '#1F3864' },
  'Diabetes': { bg: '#E8EDF5', text: '#1F3864' },
  'Hypertension': { bg: '#FBE6E3', text: '#8E2A20' },
  'Cardiac': { bg: '#FBEDE5', text: '#9B4D34' },
  'COPD': { bg: '#F4E5DB', text: '#7A4322' },
  'Thyroid': { bg: '#E4ECDF', text: '#3E5942' },
  'Cholesterol': { bg: '#FBF1D9', text: '#7A5816' },
  'PCOS': { bg: '#F0E4ED', text: '#6B3B5E' },
};

function adherenceColor(pct) {
  if (pct == null) return { bg: '#F0ECE2', text: '#8590A5', label: '—' };
  if (pct >= 85) return { bg: '#E4ECDF', text: '#3E5942', label: pct + '%' };
  if (pct >= 60) return { bg: '#FBF1D9', text: '#7A5816', label: pct + '%' };
  return { bg: '#FBE6E3', text: '#8E2A20', label: pct + '%' };
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysAgo(iso) {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return days + ' days ago';
  return Math.floor(days / 30) + ' months ago';
}

function initials(name) {
  return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
}

// Color-shuffle for avatars — stable per patient id
const AVATAR_BG = ['#E8EDF5','#FBEDE5','#E4ECDF','#FBF1D9','#F0E4ED','#F4E5DB'];
const AVATAR_FG = ['#1F3864','#9B4D34','#3E5942','#7A5816','#6B3B5E','#7A4322'];
function avatarColors(id) {
  const i = id % AVATAR_BG.length;
  return { bg: AVATAR_BG[i], fg: AVATAR_FG[i] };
}

// Swap the demo arrays for real backend data at runtime (called by the App after
// it loads /portal/patients, /refills, /inventory). Reassigns the shared bindings
// so every screen renders real data without any screen-code changes.
function __applyPortalData(d) {
  if (d.patients) { PATIENTS = d.patients; window.PATIENTS = d.patients; }
  if (d.refills) { REFILLS = d.refills; window.REFILLS = d.refills; }
  if (d.inventory) { INVENTORY = d.inventory; window.INVENTORY = d.inventory; }
}

Object.assign(window, {
  C, fonts, inr,
  PATIENTS, URGENT, ACTIVITY, REV_7DAYS, REV_12MONTHS, REFILLS, INVENTORY,
  CONDITION_COLOR, adherenceColor, fmtDate, daysAgo, initials, avatarColors,
  adherenceTimeline, refillHistory, __applyPortalData,
});
