import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import type { FastifyReply, FastifyRequest } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requirePatient: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requirePharmacist: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string; role: "patient" | "pharmacist"; pharmacyId?: string | null };
    user: { sub: string; role: "patient" | "pharmacist"; pharmacyId?: string | null };
  }
}

export default fp(async (app) => {
  app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || "dev-insecure-secret-change-me",
    sign: { expiresIn: process.env.JWT_EXPIRES || "30m" },
  });

  app.decorate("authenticate", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch {
      return reply.code(401).send({ error: "Unauthorized" });
    }
  });

  app.decorate("requirePatient", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
      if (req.user.role !== "patient") return reply.code(403).send({ error: "Patients only" });
    } catch {
      return reply.code(401).send({ error: "Unauthorized" });
    }
  });

  app.decorate("requirePharmacist", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
      if (req.user.role !== "pharmacist") return reply.code(403).send({ error: "Pharmacists only" });
    } catch {
      return reply.code(401).send({ error: "Unauthorized" });
    }
  });
});
