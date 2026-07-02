// Canonical caregiver permission IDs. A FamilyLink stores a subset of these in
// `permissions`; each caregiving endpoint requires one specific permission.

export const PERMISSIONS = {
  VIEW_SCHEDULE: "view_schedule", // see the patient's medicine list + daily schedule
  VIEW_ADHERENCE: "view_adherence", // see adherence %, history, missed doses
  VIEW_HEALTH: "view_health", // see appointments, logged symptoms, doctor report
  MARK_DOSES: "mark_doses", // mark a dose taken/skipped on the patient's behalf
  ADD_MEDICINES: "add_medicines", // add new medicines to the patient's list
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

// Back-compat: earlier links stored coarse values ("view", "mark"). Expand any
// legacy value into the granular set so old links keep working after the upgrade.
const LEGACY_MAP: Record<string, Permission[]> = {
  view: [PERMISSIONS.VIEW_SCHEDULE, PERMISSIONS.VIEW_ADHERENCE],
  mark: [PERMISSIONS.MARK_DOSES],
};

/** Normalize a stored permissions array to canonical IDs (expanding legacy values). */
export function normalizePermissions(perms: string[] | null | undefined): Permission[] {
  const out = new Set<Permission>();
  for (const p of perms ?? []) {
    if ((ALL_PERMISSIONS as string[]).includes(p)) {
      out.add(p as Permission);
    } else if (LEGACY_MAP[p]) {
      LEGACY_MAP[p].forEach((x) => out.add(x));
    }
  }
  return [...out];
}

/** Keep only recognized permission IDs from client input (drops anything unknown). */
export function sanitizePermissions(perms: string[] | null | undefined): Permission[] {
  return normalizePermissions(perms);
}

export function hasPermission(perms: string[] | null | undefined, required: Permission): boolean {
  return normalizePermissions(perms).includes(required);
}
