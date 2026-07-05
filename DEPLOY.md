# Deploying SaathiPill as real websites

This guide takes you from nothing to three live, HTTPS websites:

| What | Example address |
|------|-----------------|
| Patient app | `https://app.saathipill.in` |
| Pharmacy portal | `https://portal.saathipill.in` |
| Backend API | `https://api.saathipill.in` |

Everything (database, API, background worker, both websites, and automatic HTTPS
certificates) runs from **one server** with **one command**. You do not need to
edit any code.

---

## What you need

1. **A server** with a public IP address running Linux — any cheap cloud VM works
   (DigitalOcean, AWS Lightsail, Hetzner, Azure…). 2 GB RAM is plenty.
2. **A domain name** (e.g. `saathipill.in`) that you can add DNS records to.
3. **Docker** installed on the server (Docker Engine + the Compose plugin).

---

## Step 1 — Point your domains at the server

In your domain provider's DNS settings, add three **A records**, all pointing to
your server's public IP address:

```
app.saathipill.in      →  <your server IP>
portal.saathipill.in   →  <your server IP>
api.saathipill.in      →  <your server IP>
```

DNS can take a few minutes to an hour to take effect.

---

## Step 2 — Get the code onto the server

```bash
git clone <your repo url> saathipill
cd saathipill
```

---

## Step 3 — Create your settings file

```bash
cp .env.production.example .env
```

Now generate your secret keys:

```bash
node scripts/generate-secrets.mjs
```

(No Node on the server? Run it inside Docker instead:
`docker run --rm -v "$PWD":/app -w /app node:20-alpine node scripts/generate-secrets.mjs`)

Open `.env` in an editor and:

- paste in the four generated lines (`POSTGRES_PASSWORD`, `JWT_SECRET`,
  `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`),
- set `APP_DOMAIN`, `PORTAL_DOMAIN`, `API_DOMAIN` to your three domains,
- set `ACME_EMAIL` to a real email (for HTTPS certificate notices).

Leave `SMS_PROVIDER` blank for now (see “Going fully live” below).

---

## Step 4 — Launch

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

The first run builds the images and can take a few minutes. Caddy then fetches
HTTPS certificates automatically. Within a minute or two, your three websites are
live and secure.

Check they're running:

```bash
docker compose -f docker-compose.prod.yml ps
```

Visit `https://portal.saathipill.in` — you'll be asked to register your pharmacy.
Visit `https://app.saathipill.in` — a patient can sign up with their phone.

---

## Everyday operations

```bash
# See logs
docker compose -f docker-compose.prod.yml logs -f

# Stop everything
docker compose -f docker-compose.prod.yml down

# Update after pulling new code
git pull
docker compose -f docker-compose.prod.yml up -d --build

# Back up the database
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U saathipill saathipill > backup-$(date +%F).sql
```

Your data lives in a Docker volume (`pgdata`) and survives restarts and rebuilds.

---

## Going fully live (before charging real customers)

The app works end-to-end today, but a few things still use development shortcuts.
These are already built as clean "plug-in points":

- **Real SMS for OTP & messages** — right now the login code is shown on screen.
  Sign up with an Indian SMS gateway (MSG91/Gupshup) with DLT-approved templates,
  set `SMS_PROVIDER=msg91` and `MSG91_AUTH_KEY=…` in `.env`, and finish the
  `sendSms` function in `backend/src/lib/notify.ts`. Once set, codes are delivered
  by SMS and no longer revealed in the response.
- **Payments** — refill totals are shown but no money is taken (pay-on-pickup).
  Add Razorpay/UPI to charge in-app.
- **Health-data compliance (India DPDP Act)** — add consent records, encryption
  at rest, audit logs, and a data-retention/erasure policy.
- **Scale** — for more than one API server, add the Redis adapter for Socket.IO
  (noted in `backend/README.md`); no call sites change.

See `backend/README.md` for the full production checklist.

---

## Troubleshooting

- **Site shows a certificate warning** — DNS isn't pointing at the server yet, or
  ports 80/443 are blocked by a firewall. Open them and wait a minute.
- **"set JWT_SECRET in .env" error on start** — a required value is missing from
  `.env`. Re-run `node scripts/generate-secrets.mjs` and fill them in.
- **Notifications don't appear** — the browser must be allowed to show them
  (the app asks on first open) and the site must be HTTPS (it is, via Caddy).
