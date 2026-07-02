# SaathiPill — Backend Build Prompt (paste into Claude Code)

> Paste everything between the lines below into Claude Code, running it from the
> repo root that contains the two front-ends (`Pill Reminder v2.html` +
> `SaathiPill Pharmacy Portal.html` and their `.jsx` files). Adjust the
> **Decisions** block at the top to your preferences before sending.

---

You are building the backend for **SaathiPill**, a medication-adherence platform for the Indian market. Two front-ends already exist as React prototypes in this repo and currently run entirely on mock data + a `localStorage` shim (`pharmacy-bridge.js`). Your job is to replace that shim with a real backend and wire both clients to it. **Read these files first** to learn the exact data shapes and flows before writing any code:

- `Pill Reminder v2.html` + `screens-1-v2.jsx`, `screens-2-v2.jsx`, `screens-3-v2.jsx`, `screens-quickadd-v2.jsx` — the **patient mobile app**
- `SaathiPill Pharmacy Portal.html` + `portal-data.jsx`, `portal-screens.jsx`, `portal-shared.jsx` — the **pharmacist web portal**
- `pharmacy-bridge.js` — the current fake sync layer. Your API + realtime replaces this. Keep its function names (`read/add/update/subscribe`, `addDispense`, `adjustInventory`, …) as a thin client adapter so the UI changes are minimal.

## Decisions (edit these before running)
- **Runtime/framework:** Node + TypeScript + Fastify (or NestJS). [change if you prefer]
- **DB:** PostgreSQL + Prisma. [change if you prefer]
- **Realtime:** WebSocket (Socket.IO) channels per user + per pharmacy. SSE fallback.
- **Auth:** phone + 4-digit OTP, JWT access/refresh. Two roles: `patient`, `pharmacist`. (OTP delivery is out of scope for now — return/log the code in dev and leave a clean seam to plug a real sender in later.)
- **Deploy target:** Docker Compose for local; note prod options but don't build them.

## What the system does (domain)
Two clients, one shared backend. A patient links to a pharmacy via a **pharmacy code** (`XXXX-XXXXX`, e.g. `SHRM-74219`). Once linked, the pharmacist can push prescriptions and record counter sales that appear in the patient's app in real time; the patient's adherence flows back to the pharmacist.

### Core entities (derive exact fields from the JSX, these are the essentials)
- **Patient**: phone, name, age, gender, conditions[], linked `pharmacyCode`, createdAt.
- **Pharmacy**: name, location, `code` (editable, unique, regex `^[A-Z0-9]{4}-[A-Z0-9]{5}$`), ownerPharmacist.
- **Pharmacist (PortalUser)**: name, role, pharmacyId.
- **Medication** (a patient's scheduled drug): drug, dose, `times[]` (`morning|afternoon|evening|night` + custom `HH:MM AM/PM`), `meal` (`before|after|empty|bedtime`), `schedule` (`daily|weekly|cyclic`), `weeklyDays[]`, `cyclicOn`/`cyclicOff`, `courseType` (`ongoing|fixed`) + `courseDays`/`courseEndDate`, `instructions`, `source` (`self` | `{type:'pharmacy', name, code}`), `groupId` (links doses of one drug).
- **DoseLog** (one per scheduled dose per day): medicationId, date, scheduledTime, `status` (`pending|taken|skipped|missed`), takenAt, `skipReason` + `skipExcluded` (some skip reasons are excluded from the adherence %), snoozeCount, `pendingSync` (was marked offline). Adherence % is computed from these.
- **Caregiver/FamilyLink**: ownerPatient ↔ member, relationship, permissions, invite status (`invited|active`). A caregiver sees a member's doses/adherence and gets escalations.
- **SymptomLog**: symptoms[], mood, note, timestamp.
- **Appointment**: doctor, specialty, date, time, location, reason, reminderLead.
- **RefillOrder**: patientId, items[{med, qty}], amount, `status` (`pending|confirmed|ready|delivered|declined`), `delivery` (`pickup|home`), declineReason, placedAt.
- **InventoryItem**: name, stock, demand7d, mrp, supplier, status (derive `in-stock|order-soon|out-of-stock` from stock vs demand). Stock mutates on dispense.
- **Dispense (counter sale)**: pharmacyId, patientId, items[{name, qty, mrp}], total, offer, at. Decrements inventory and posts a pickup to the patient's app.
- **Offer/Promotion**: label, discount %, reach, expiry, active.
- **PharmacyPush (prescribe-to-app)**: pharmacyId, patientId, meds[] (Medication shape), note, `status` (`pending|accepted|dismissed`), pushedAt. **This is the heart of the bridge** — replace `localStorage` with a DB row + realtime push to the patient.
- **Notification**: targetUser, kind, title, body, read, createdAt.

## Key flows to support end-to-end
1. **Auth:** request OTP → verify OTP → issue JWT. Signup also captures name; patient profile setup saves conditions + optional pharmacy code link.
2. **Patient linking:** patient enters pharmacy code → validates against a real pharmacy → creates the link. Pharmacist can edit their own code (must stay unique).
3. **Prescribe-to-app:** pharmacist builds meds in `PrescribeModal` → `POST /pharmacy/pushes` → realtime event to that patient → patient sees a banner, accepts (creates Medications + DoseLogs) or dismisses → status flows back to the portal.
4. **Dose tracking + adherence:** patient marks taken/skipped/snooze. Snooze caps at 3 then **escalates** (notify caregiver). Offline marks queue locally and **sync on reconnect** (`pendingSync`). Server is source of truth for adherence %; skip reasons flagged `excluded` don't count against it; un-acted doses past their time become `missed`.
5. **Caregiver/family:** invite (creates a pending invite + in-app notification), accept; caregiver reads member adherence + receives escalation notifications.
6. **Refill queue:** patient/app or pharmacist creates orders; pharmacist confirms / marks ready / declines (with reason → patient notified).
7. **Counter sale:** pharmacist records walk-in dispense → decrement inventory (respect available stock incl. prior adjustments) → apply active offer → post pickup to patient app.
8. **Reminders & scheduling:** a scheduler computes each patient's due doses from their Medication schedules (daily/weekly/cyclic, course end dates) and fires reminder notifications; appointment reminders fire by `reminderLead`. Make the schedule-expansion logic a pure, unit-tested function.
9. **Symptoms, appointments, history, analytics, doctor report:** CRUD + read/aggregation endpoints feeding the History / Analytics / Doctor-Report screens (the report is a plain data summary).

## Deliverables
1. **Schema + migrations** (Prisma) for all entities above, with the enums and the pharmacy-code/phone uniqueness constraints.
2. **REST API** grouped by resource (auth, patients, medications, doses, family, symptoms, appointments, refills, inventory, dispenses, offers, pushes, notifications). OpenAPI spec.
3. **Realtime layer**: per-patient and per-pharmacy channels; events for `push.created`, `push.updated`, `dispense.created`, `inventory.changed`, `dose.updated`, `escalation`, `refill.updated`, `notification`.
4. **Scheduler/worker** for reminders, missed-dose marking, appointment reminders.
5. **Auth middleware** with role guards (patient vs pharmacist; patients can only touch their own data; pharmacists scoped to their pharmacy + linked patients).
6. **Seed script** that loads the existing mock data (`portal-data.jsx` PATIENTS/INVENTORY/REFILLS/etc. and the patient `medicines` list) so both front-ends look identical to today on first run.
7. **`pharmacy-bridge.js` rewrite**: same exported surface, but backed by `fetch` + WebSocket instead of `localStorage`, so the React screens need minimal edits. List every UI call site you change.
8. **Tests**: unit tests for adherence calc + schedule expansion; integration tests for the prescribe→accept and counter-sale→inventory flows.
9. **Docker Compose** (api + postgres + worker) and a `README` with env vars and run steps.

## Constraints
- TypeScript everywhere, strict mode. Validate all input (zod). No secrets in code.
- Keep money in integer paise; reuse the Indian-rupee grouping the UI already does for display only.
- Don't redesign the front-end UI — only swap the data layer and add the minimal hooks the flows above require.
- Server is the source of truth for adherence, inventory, and push/refill status; clients reconcile on reconnect.
- Be explicit in the README about what is NOT production-ready (notification/OTP delivery, payments, hosting, data-protection/DPDP compliance).

Start by reading the listed files, then propose the schema + API surface and wait for my OK before generating the full implementation.

---

## Other requirements / decisions you'll need to make (not code)
These are real-world gaps the prototype doesn't cover — decide before or during the build:

1. **Notification & OTP delivery (deferred).** Everything notifies in-app for now. To reach a closed phone you'll later need push (FCM/APNs) — which means the patient "app" must become a real native/PWA client — and an Indian SMS gateway for OTP/caregiver alerts (MSG91/Gupshup/Twilio, with **DLT-registered** templates that take days to approve). Keep the delivery seam clean so this drops in without reworking the flows.
2. **Auth hardening.** OTP rate-limiting, expiry, attempt caps, refresh-token rotation, device sessions.
3. **Data protection / compliance.** This is health data (PII + conditions + prescriptions). India's **DPDP Act** applies; consider consent capture, encryption at rest, audit logs, data-retention/erasure. Pharmacy dispensing may have regulatory record-keeping requirements.
4. **Payments.** Refill orders currently show ₹ totals but take no money. If you want in-app payment, add a gateway (Razorpay/UPI) — otherwise mark orders as pay-on-pickup/delivery.
5. **Pharmacy onboarding & multi-pharmacy.** The portal hardcodes one store ("Sharma Medical Store"). Real use needs pharmacy registration, multiple staff accounts/roles, and the pharmacy-code namespace managed centrally.
6. **Source of truth for inventory & pricing.** MRP, suppliers, stock — does this sync from the pharmacy's existing billing software, or is the portal the master? Affects whether you need integrations.
7. **Offline conflict resolution.** Define what wins when an offline "taken" mark conflicts with a server "missed" — the prototype just replays the queue.
8. **Caregiver permissions model.** What exactly can a caregiver see/do (view-only vs. add meds vs. acknowledge escalations)? Needs a real permissions matrix.
9. **Scale/realtime infra.** Socket.IO is fine to start; at scale you'll want Redis pub/sub (or a managed realtime service) so multiple API instances share channels.
10. **Hosting & environments.** Where does this run (managed Postgres, container host), and how are dev/staging/prod separated?
