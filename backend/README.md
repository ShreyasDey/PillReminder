# SaathiPill Backend

Node + TypeScript + Fastify + Prisma (PostgreSQL) + Socket.IO. One backend serves
both clients: the patient app and the pharmacy portal.

## Run locally (without Docker)

```bash
cd backend
cp .env.example .env          # edit JWT_SECRET for anything non-local
npm install
npm run prisma:generate
npm run prisma:migrate        # creates the database schema
npm run seed                  # loads demo pharmacy, inventory, patients
npm run dev                   # API + realtime on http://localhost:3000
npm run worker                # (separate terminal) reminders + missed-dose marking
```

## Run with Docker (recommended)

From the repo root:

```bash
docker compose up --build
```

This starts PostgreSQL, runs migrations, seeds demo data, and starts the API
(`:3000`) plus the background worker.

## API surface

- `POST /auth/otp/request`, `POST /auth/otp/verify`, `POST /auth/token/refresh`, `POST /auth/logout`
- Patient (`/api`, role `patient`): `me`, `me/dashboard`, `me/adherence`, `medications`,
  `doses`, `doses/sync`, `symptoms`, `appointments`, `family`, `pharmacy-pushes`,
  `refills`, `notifications`
- Pharmacy portal (`/portal`, role `pharmacist`): `pharmacy`, `patients`, `pushes`,
  `inventory`, `dispenses`, `refills`, `offers`, `analytics/revenue`

## Realtime channels (Socket.IO)

- `patient:<userId>` — `push.created`, `dispense.created`, `dose.updated`, `refill.updated`, `notification`, `escalation`
- `pharmacy:<pharmacyId>` — `push.updated`, `refill.created`, `inventory.changed`

## Tests

```bash
npm test    # adherence calc + schedule expansion (pure unit tests)
```

## What is NOT production-ready (decide before charging real customers)

- **OTP / SMS delivery** — dev mode returns the code in the API response and logs it.
  Plug an Indian SMS gateway (MSG91/Gupshup) with DLT-approved templates in
  `src/lib/notify.ts` → `sendSms`. Set `SMS_PROVIDER=msg91` + auth key.
- **Push to closed phones** — needs FCM/APNs and the patient app shipped as a real
  PWA/native client. Seam is `deliverExternal` in `src/lib/notify.ts`.
- **Payments** — refill totals are shown but no money is taken. Orders are
  effectively pay-on-pickup/delivery. Add Razorpay/UPI to charge in-app.
- **Compliance (DPDP Act)** — this is health data. Add consent capture, encryption
  at rest, audit logs, and a data-retention/erasure policy before going live.
- **Auth hardening** — OTP rate-limiting is basic (5 attempts). Add per-phone request
  throttling and device-session management for production.
- **Realtime at scale** — single-instance Socket.IO. For multiple API instances add a
  Redis adapter (`@socket.io/redis-adapter`); call sites in `src/lib/realtime.ts`
  don't change.
