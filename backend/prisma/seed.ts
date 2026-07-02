// Seeds the demo pharmacy ("Sharma Medical Store"), its inventory, a roster of
// linked patients (from portal-data.jsx), open refill orders, and a demo patient
// login with the prototype's medicine list — so both front-ends look like the
// prototypes on first run.

import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { toPaise } from "../src/lib/money.js";
import { ymd } from "../src/lib/schedule.js";

const prisma = new PrismaClient();

const PHARMACY_CODE = "SHRM-74219";
const SECOND_PHARMACY_CODE = "APLO-55120";

// A second registered pharmacy so patients can link more than one and compare
// prices side by side. Overlapping medicine names, different prices + its own offer.
const SECOND_INVENTORY = [
  { name: "Metformin 500mg", stock: 900, demand7d: 600, mrp: 4.0, supplier: "Sun Pharma" },
  { name: "Telmisartan 40mg", stock: 300, demand7d: 260, mrp: 7.9, supplier: "Cipla" },
  { name: "Atorvastatin 20mg", stock: 400, demand7d: 300, mrp: 7.2, supplier: "Pfizer" },
  { name: "Amlodipine 5mg", stock: 600, demand7d: 220, mrp: 3.9, supplier: "Cipla" },
  { name: "Pantoprazole 40mg", stock: 500, demand7d: 300, mrp: 5.2, supplier: "Alkem" },
  { name: "Vitamin D3 60K", stock: 120, demand7d: 40, mrp: 26.0, supplier: "Mankind" },
  { name: "Glimepiride 2mg", stock: 0, demand7d: 180, mrp: 5.6, supplier: "Sanofi" },
  { name: "Rosuvastatin 10mg", stock: 260, demand7d: 110, mrp: 9.4, supplier: "Sun Pharma" },
];

const INVENTORY = [
  { name: "Metformin 500mg", stock: 1240, demand7d: 980, mrp: 4.2, supplier: "Sun Pharma" },
  { name: "Telmisartan 40mg", stock: 480, demand7d: 420, mrp: 8.5, supplier: "Glenmark" },
  { name: "Atorvastatin 20mg", stock: 920, demand7d: 510, mrp: 6.8, supplier: "Pfizer" },
  { name: "Glimepiride 2mg", stock: 280, demand7d: 240, mrp: 5.4, supplier: "Sanofi" },
  { name: "Aspirin 75mg", stock: 1680, demand7d: 540, mrp: 1.2, supplier: "USV" },
  { name: "Thyronorm 50mcg", stock: 320, demand7d: 180, mrp: 3.8, supplier: "Abbott" },
  { name: "Amlodipine 5mg", stock: 140, demand7d: 210, mrp: 3.4, supplier: "Cipla" },
  { name: "Pantoprazole 40mg", stock: 760, demand7d: 360, mrp: 5.6, supplier: "Sun Pharma" },
  { name: "Vitamin D3 60K", stock: 84, demand7d: 38, mrp: 28.0, supplier: "Mankind" },
  { name: "Clopidogrel 75mg", stock: 180, demand7d: 240, mrp: 9.2, supplier: "Sanofi" },
  { name: "Losartan 50mg", stock: 540, demand7d: 180, mrp: 6.4, supplier: "Torrent" },
  { name: "Rosuvastatin 10mg", stock: 220, demand7d: 90, mrp: 9.8, supplier: "Cipla" },
];

// `adh` is the target adherence we generate realistic history toward; the actual
// number shown in the app/portal is COMPUTED from the dose logs we create, never
// stored directly. `meds` get real Medication + DoseLog rows. Aarti is brand-new
// (adh:null) — she has no history, so her adherence shows as "no data" like any
// real new patient.
const PATIENTS = [
  { name: "Suresh Kumar", age: 62, gender: "M", conditions: ["Type 2 Diabetes"], phone: "+91 98201 40021", adh: 92, meds: [["Metformin", "500mg", "8:00 AM"], ["Glimepiride", "2mg", "8:00 AM"]] },
  { name: "Lakshmi Iyer", age: 58, gender: "F", conditions: ["Hypertension", "Diabetes"], phone: "+91 98675 20008", adh: 78, meds: [["Telmisartan", "40mg", "9:00 AM"], ["Metformin", "500mg", "1:00 PM"]] },
  { name: "Mohammed Ansari", age: 71, gender: "M", conditions: ["Cardiac", "Diabetes"], phone: "+91 99204 10072", adh: 45, meds: [["Clopidogrel", "75mg", "9:00 AM"], ["Atorvastatin", "20mg", "9:00 PM"]] },
  { name: "Priya Deshpande", age: 45, gender: "F", conditions: ["Thyroid"], phone: "+91 98330 50018", adh: 95, meds: [["Thyronorm", "50mcg", "7:00 AM"]] },
  { name: "Vikram Reddy", age: 67, gender: "M", conditions: ["COPD", "Hypertension"], phone: "+91 97411 80044", adh: 71, meds: [["Telmisartan", "40mg", "9:00 AM"], ["Amlodipine", "5mg", "9:00 AM"]] },
  { name: "Sunita Joshi", age: 53, gender: "F", conditions: ["Diabetes"], phone: "+91 96574 10091", adh: 88, meds: [["Metformin", "500mg", "8:00 AM"], ["Glimepiride", "2mg", "8:00 AM"]] },
  { name: "Geeta Rao", age: 60, gender: "F", conditions: ["Diabetes", "Cholesterol"], phone: "+91 98456 30019", adh: 89, meds: [["Metformin", "500mg", "8:00 AM"], ["Atorvastatin", "20mg", "9:00 PM"]] },
  { name: "Aarti Verma", age: 55, gender: "F", conditions: ["Diabetes"], phone: "+91 98201 70042", adh: null, meds: [] },
];

const DEMO_PATIENT_MEDS = [
  { drug: "Metformin", dose: "500mg", time: "8:00 AM", meal: "After meal" },
  { drug: "Amlodipine", dose: "5mg", time: "9:00 AM", meal: "After meal" },
  { drug: "Telmisartan", dose: "40mg", time: "1:00 PM", meal: "Before meal" },
  { drug: "Atorvastatin", dose: "10mg", time: "9:00 PM", meal: "After meal" },
  { drug: "Vitamin D3", dose: "60,000 IU", time: "9:00 PM", meal: "After meal" },
];

/** Pick a realistic dose status biased toward a target adherence %. */
function statusForTarget(target: number): "taken" | "missed" | "skipped" {
  if (Math.random() * 100 < target) return "taken";
  return Math.random() < 0.7 ? "missed" : "skipped";
}

/** Create `days` of past dose logs for the given meds, biased toward `target`%. */
async function seedHistory(meds: { id: string; time: string }[], target: number, days: number) {
  const rows: {
    medicationId: string;
    date: string;
    scheduledTime: string;
    status: "taken" | "missed" | "skipped";
    takenAt: Date | null;
    skipExcluded: boolean;
  }[] = [];
  for (let d = days; d >= 1; d--) {
    const day = new Date(Date.now() - d * 86_400_000);
    const date = ymd(day);
    for (const m of meds) {
      const status = statusForTarget(target);
      rows.push({
        medicationId: m.id,
        date,
        scheduledTime: m.time,
        status,
        takenAt: status === "taken" ? day : null,
        skipExcluded: false,
      });
    }
  }
  if (rows.length) await prisma.doseLog.createMany({ data: rows, skipDuplicates: true });
}

async function main() {
  // When invoked with --if-empty, only seed a brand-new (empty) database, so an
  // existing install's real patient/pharmacy data is never overwritten on restart.
  if (process.argv.includes("--if-empty") || process.env.SEED_IF_EMPTY === "1") {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      // eslint-disable-next-line no-console
      console.log("✓ Existing data found — keeping it (skipped demo seed).");
      return;
    }
  }

  // ── Pharmacy + pharmacist ──
  const pharmacy = await prisma.pharmacy.upsert({
    where: { code: PHARMACY_CODE },
    update: { hours: "8 AM – 10 PM", lat: 19.1364, lng: 72.8296 },
    create: { name: "Sharma Medical Store", location: "Andheri West, Mumbai", hours: "8 AM – 10 PM", lat: 19.1364, lng: 72.8296, code: PHARMACY_CODE },
  });

  await prisma.user.upsert({
    where: { phone: "+91 9000000001" },
    update: { pharmacyId: pharmacy.id },
    create: { phone: "+91 9000000001", name: "Dr. Rajesh Sharma", role: "pharmacist", pharmacyId: pharmacy.id },
  });

  // ── Inventory ──
  for (const item of INVENTORY) {
    await prisma.inventoryItem.upsert({
      where: { pharmacyId_name: { pharmacyId: pharmacy.id, name: item.name } },
      update: { stock: item.stock, demand7d: item.demand7d, mrp: toPaise(item.mrp), supplier: item.supplier },
      create: {
        pharmacyId: pharmacy.id,
        name: item.name,
        stock: item.stock,
        demand7d: item.demand7d,
        mrp: toPaise(item.mrp),
        supplier: item.supplier,
      },
    });
  }

  // ── Second pharmacy (so multi-link + price comparison are demonstrable) ──
  const pharmacy2 = await prisma.pharmacy.upsert({
    where: { code: SECOND_PHARMACY_CODE },
    update: { hours: "9 AM – 11 PM", lat: 19.1190, lng: 72.8470 },
    create: { name: "Apollo Pharmacy", location: "Bandra West, Mumbai", hours: "9 AM – 11 PM", lat: 19.1190, lng: 72.8470, code: SECOND_PHARMACY_CODE },
  });
  await prisma.user.upsert({
    where: { phone: "+91 9000000002" },
    update: { pharmacyId: pharmacy2.id },
    create: { phone: "+91 9000000002", name: "Dr. Anita Nair", role: "pharmacist", pharmacyId: pharmacy2.id },
  });
  for (const item of SECOND_INVENTORY) {
    await prisma.inventoryItem.upsert({
      where: { pharmacyId_name: { pharmacyId: pharmacy2.id, name: item.name } },
      update: { stock: item.stock, demand7d: item.demand7d, mrp: toPaise(item.mrp), supplier: item.supplier },
      create: { pharmacyId: pharmacy2.id, name: item.name, stock: item.stock, demand7d: item.demand7d, mrp: toPaise(item.mrp), supplier: item.supplier },
    });
  }
  const offer2Count = await prisma.offer.count({ where: { pharmacyId: pharmacy2.id } });
  if (offer2Count === 0) {
    await prisma.offer.create({
      data: { pharmacyId: pharmacy2.id, label: "Apollo Wellness Week", discount: 10, reach: 0, active: true, expiry: new Date(Date.now() + 10 * 86_400_000) },
    });
  }

  // ── Patients linked to the pharmacy ──
  const patientIds: Record<string, string> = {};
  for (const p of PATIENTS) {
    const user = await prisma.user.upsert({
      where: { phone: p.phone },
      update: {},
      create: {
        phone: p.phone,
        name: p.name,
        role: "patient",
        profile: {
          create: { age: p.age, gender: p.gender, conditions: p.conditions, linkedPharmacyCode: PHARMACY_CODE },
        },
      },
    });
    patientIds[p.name] = user.id;

    // Real medications + dose history → the portal's adherence is computed, not faked.
    const hasMeds = await prisma.medication.count({ where: { patientId: user.id } });
    if (hasMeds === 0 && p.meds.length > 0) {
      const medRows = [];
      for (const [drug, dose, time] of p.meds) {
        medRows.push(
          await prisma.medication.create({
            data: { patientId: user.id, groupId: crypto.randomUUID(), drug, dose, time },
          }),
        );
      }
      if (p.adh != null) await seedHistory(medRows, p.adh, 60);
    }
  }

  // ── A demo patient you can log in as (phone + any OTP shown in dev) ──
  const demo = await prisma.user.upsert({
    where: { phone: "+91 9876543210" },
    update: {},
    create: {
      phone: "+91 9876543210",
      name: "Shreyas",
      role: "patient",
      profile: { create: { age: 34, conditions: ["Diabetes", "Hypertension"], linkedPharmacyCode: PHARMACY_CODE } },
    },
  });

  // Give the demo patient the prototype medicine list, real past history (so the
  // adherence ring/analytics show genuine computed numbers), plus today's pending doses.
  const existing = await prisma.medication.count({ where: { patientId: demo.id } });
  if (existing === 0) {
    const date = ymd(new Date());
    const demoMedRows = [];
    for (const m of DEMO_PATIENT_MEDS) {
      const med = await prisma.medication.create({
        data: { patientId: demo.id, groupId: crypto.randomUUID(), drug: m.drug, dose: m.dose, time: m.time, meal: m.meal },
      });
      demoMedRows.push(med);
      await prisma.doseLog.create({ data: { medicationId: med.id, date, scheduledTime: m.time } });
    }
    await seedHistory(demoMedRows, 86, 60); // ~86% adherence, computed from these logs

    // ── Caregiver demo: a real caregiver account linked to the demo patient ──
    // Log in as 9000000010 to see "People I care for" (Shreyas) with full access,
    // plus a pending invite from another patient to try the accept flow.
    const last10 = (p: string) => p.replace(/\D/g, "").slice(-10);
    const caregiver = await prisma.user.upsert({
      where: { phone: "+91 9000000010" },
      update: {},
      create: {
        phone: "+91 9000000010",
        name: "Anjali Rao",
        role: "patient",
        profile: { create: {} },
      },
    });

    const ALL_PERMS = ["view_schedule", "view_adherence", "view_health", "mark_doses", "add_medicines"];
    await prisma.familyLink.createMany({
      data: [
        // Anjali actively cares for Shreyas with every permission granted.
        {
          ownerId: demo.id,
          memberId: caregiver.id,
          memberName: caregiver.name,
          memberPhone: last10(caregiver.phone),
          relationship: "Daughter",
          status: "active",
          permissions: ALL_PERMS,
        },
        // Sunita can view Shreyas's schedule + adherence (not yet an app account).
        {
          ownerId: demo.id,
          memberName: "Sunita",
          memberPhone: "9820011111",
          relationship: "Wife",
          status: "invited",
          permissions: ["view_schedule", "view_adherence"],
        },
      ],
    });

    // A pending invite addressed to Anjali from another seeded patient, so the
    // "Caregiver invites" section has something to accept.
    const suresh = patientIds["Suresh Kumar"];
    if (suresh) {
      await prisma.familyLink.create({
        data: {
          ownerId: suresh,
          memberName: caregiver.name,
          memberPhone: last10(caregiver.phone),
          relationship: "Daughter",
          status: "invited",
          permissions: ["view_schedule", "view_adherence", "view_health"],
        },
      });
    }
  }

  // ── Open refill orders (subset of REFILLS from portal-data.jsx) ──
  const refillSeed = [
    { displayId: "SP-1235", patient: "Geeta Rao", amount: 2840, status: "pending" as const, items: [{ med: "Atorvastatin 20mg", qty: 30 }, { med: "Metformin 500mg", qty: 60 }] },
    { displayId: "SP-1236", patient: "Lakshmi Iyer", amount: 1420, status: "pending" as const, items: [{ med: "Telmisartan 40mg", qty: 30 }, { med: "Amlodipine 5mg", qty: 30 }] },
    { displayId: "SP-1237", patient: "Mohammed Ansari", amount: 4280, status: "pending" as const, items: [{ med: "Clopidogrel 75mg", qty: 30 }, { med: "Aspirin 75mg", qty: 30 }, { med: "Atorvastatin 20mg", qty: 30 }] },
    { displayId: "SP-1228", patient: "Suresh Kumar", amount: 3260, status: "ready" as const, items: [{ med: "Metformin 500mg", qty: 60 }, { med: "Glimepiride 2mg", qty: 30 }] },
  ];
  for (const r of refillSeed) {
    const pid = patientIds[r.patient];
    if (!pid) continue;
    await prisma.refillOrder.upsert({
      where: { displayId: r.displayId },
      update: {},
      create: {
        displayId: r.displayId,
        patientId: pid,
        pharmacyId: pharmacy.id,
        items: r.items,
        amount: toPaise(r.amount),
        status: r.status,
      },
    });
  }

  // ── An active offer (only seed once) ──
  const offerCount = await prisma.offer.count({ where: { pharmacyId: pharmacy.id } });
  if (offerCount === 0) {
    await prisma.offer.create({
      data: { pharmacyId: pharmacy.id, label: "Monsoon Diabetes Care", discount: 15, reach: 184, active: true, expiry: new Date(Date.now() + 14 * 86_400_000) },
    });
  }

  // eslint-disable-next-line no-console
  console.log("✓ Seeded. Demo patient login: 9876543210 · Demo pharmacist login: 9000000001");
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
