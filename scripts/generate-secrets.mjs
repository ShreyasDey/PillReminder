// Generates the secret values needed for a production .env:
//   • JWT_SECRET      — signs login tokens
//   • POSTGRES_PASSWORD
//   • VAPID keys      — for Web-Push notifications
//
// Usage:  node scripts/generate-secrets.mjs
// Copy the printed lines into your .env (replacing the CHANGE_ME placeholders).

import { randomBytes } from "node:crypto";

function b64url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// JWT + DB password: plain strong random strings.
const jwtSecret = randomBytes(48).toString("base64");
const dbPassword = randomBytes(24).toString("base64").replace(/[^A-Za-z0-9]/g, "").slice(0, 28);

// VAPID keypair (P-256) for Web Push. Uses web-push if available, else Node crypto.
let vapidPublic = "";
let vapidPrivate = "";
try {
  const webpush = await import("web-push");
  const keys = (webpush.default || webpush).generateVAPIDKeys();
  vapidPublic = keys.publicKey;
  vapidPrivate = keys.privateKey;
} catch {
  // Fallback: raw EC P-256 keypair in the URL-safe base64 form web-push expects.
  const { generateKeyPairSync } = await import("node:crypto");
  const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const pubRaw = publicKey.export({ type: "spki", format: "der" }).subarray(-65);
  const privRaw = privateKey.export({ type: "pkcs8", format: "der" }).subarray(36, 68);
  vapidPublic = b64url(pubRaw);
  vapidPrivate = b64url(privRaw);
}

console.log(`
# ── Paste these into your .env (replace the CHANGE_ME placeholders) ──

POSTGRES_PASSWORD=${dbPassword}
JWT_SECRET=${jwtSecret}
VAPID_PUBLIC_KEY=${vapidPublic}
VAPID_PRIVATE_KEY=${vapidPrivate}
`);
