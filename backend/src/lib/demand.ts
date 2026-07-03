// Inventory demand forecasting, learned from REAL patient ordering data:
// counter-sale dispenses AND app-placed refill orders over a trailing window,
// expressed as a 7-day figure. Shared by the portal (alerts/reorder suggestions)
// and the scheduler (restock reminders).

import { prisma } from "./prisma.js";

export const DEMAND_WINDOW_DAYS = 28;
const COVER_DAYS = 14; // reorder suggestion targets ~2 weeks of cover

/** Map of medicine name → estimated 7-day demand, from dispenses + refill orders. */
export async function computeDemand7d(pharmacyId: string): Promise<Map<string, number>> {
  const since = new Date(Date.now() - DEMAND_WINDOW_DAYS * 86_400_000);
  const totals = new Map<string, number>();
  const add = (name?: string, qty?: number) => {
    if (!name) return;
    totals.set(name, (totals.get(name) ?? 0) + (Number(qty) || 0));
  };

  // Counter sales.
  const dispenses = await prisma.dispense.findMany({
    where: { pharmacyId, at: { gte: since } },
    select: { items: true },
  });
  for (const d of dispenses) {
    const items = Array.isArray(d.items) ? (d.items as Array<{ name?: string; qty?: number }>) : [];
    for (const it of items) add(it?.name, it?.qty);
  }

  // App refill orders (actual patient ordering data). Items use { med, qty }.
  const orders = await prisma.refillOrder.findMany({
    where: { pharmacyId, placedAt: { gte: since } },
    select: { items: true },
  });
  for (const o of orders) {
    const items = Array.isArray(o.items) ? (o.items as Array<{ med?: string; qty?: number }>) : [];
    for (const it of items) add(it?.med, it?.qty);
  }

  const demand = new Map<string, number>();
  for (const [name, qty] of totals) demand.set(name, Math.round((qty / DEMAND_WINDOW_DAYS) * 7));
  return demand;
}

/** Units to order so stock covers the next COVER_DAYS at the current demand rate. */
export function suggestedOrderQty(stock: number, demand7d: number): number {
  if (demand7d <= 0) return 0;
  const target = Math.ceil((demand7d * COVER_DAYS) / 7);
  return Math.max(0, target - stock);
}
