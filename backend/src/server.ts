import Fastify from "fastify";
import cors from "@fastify/cors";
import { ZodError } from "zod";
import authPlugin from "./plugins/auth.js";
import authRoutes from "./routes/auth.js";
import patientRoutes from "./routes/patient.js";
import portalRoutes from "./routes/portal.js";
import portalAccountRoutes from "./routes/portal-account.js";
import { initRealtime } from "./lib/realtime.js";

const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((s) => s.trim());

const app = Fastify({ logger: true });

await app.register(cors, { origin: corsOrigins, credentials: true });
await app.register(authPlugin);

app.setErrorHandler((err, _req, reply) => {
  if (err instanceof ZodError) {
    return reply.code(400).send({ error: "Validation failed", details: err.flatten() });
  }
  app.log.error(err);
  return reply.code(err.statusCode || 500).send({ error: err.message || "Internal error" });
});

app.get("/health", async () => ({ ok: true, ts: Date.now() }));

// Place search for manual location entry (Uber/Ola-style) — used as a fallback
// when the browser's geolocation is denied/unavailable, on both front-ends. Proxies
// a free, keyless geocoder so no Maps API key is needed. Any signed-in user may call it.
// (To switch to Google Places later, only this handler changes.)
app.get("/geocode", { preHandler: app.authenticate }, async (req, reply) => {
  const q = String((req.query as { q?: string })?.q ?? "").trim();
  if (q.length < 3) return [];
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=in&q=" +
    encodeURIComponent(q);
  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": "SaathiPill/1.0 (medication adherence app)",
        "Accept-Language": "en",
      },
    });
    if (!r.ok) return reply.code(502).send({ error: "Geocoding unavailable" });
    const data = (await r.json()) as Array<{ display_name: string; lat: string; lon: string }>;
    return data
      .map((d) => ({ label: d.display_name, lat: Number(d.lat), lng: Number(d.lon) }))
      .filter((d) => Number.isFinite(d.lat) && Number.isFinite(d.lng));
  } catch {
    return reply.code(502).send({ error: "Geocoding unavailable" });
  }
});

await app.register(authRoutes, { prefix: "/auth" });
await app.register(patientRoutes, { prefix: "/api" });
await app.register(portalAccountRoutes, { prefix: "/portal" });
await app.register(portalRoutes, { prefix: "/portal" });

const port = Number(process.env.PORT || 3000);
await app.listen({ port, host: "0.0.0.0" });

// Attach Socket.IO to the same HTTP server.
initRealtime(app.server, corsOrigins);
app.log.info(`SaathiPill API + realtime on :${port}`);
