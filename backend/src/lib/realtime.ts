// Thin wrapper around Socket.IO so routes can emit to per-user / per-pharmacy
// channels without knowing about the transport. At scale, swap the adapter for a
// Redis pub/sub adapter (see README) — call sites stay the same.

import { Server as IOServer } from "socket.io";
import type { Server as HttpServer } from "node:http";

let io: IOServer | null = null;

export function initRealtime(httpServer: HttpServer, corsOrigins: string[]) {
  io = new IOServer(httpServer, {
    cors: { origin: corsOrigins, credentials: true },
  });

  io.on("connection", (socket) => {
    const { userId, pharmacyId } = socket.handshake.auth ?? {};
    if (userId) socket.join(`patient:${userId}`);
    if (pharmacyId) socket.join(`pharmacy:${pharmacyId}`);
  });

  return io;
}

export function emitToPatient(userId: string, event: string, payload: unknown) {
  io?.to(`patient:${userId}`).emit(event, payload);
}

export function emitToPharmacy(pharmacyId: string, event: string, payload: unknown) {
  io?.to(`pharmacy:${pharmacyId}`).emit(event, payload);
}
