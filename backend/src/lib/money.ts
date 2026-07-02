// Money helpers. Internally everything is integer paise; rupees are for display only.

export const toPaise = (rupees: number): number => Math.round(rupees * 100);
export const toRupees = (paise: number): number => paise / 100;

/** Indian comma grouping: 12,34,567 style. */
export function inr(paise: number): string {
  const num = toRupees(paise);
  const fixed = Math.round(num).toString();
  const lastThree = fixed.slice(-3);
  const rest = fixed.slice(0, -3);
  const grouped = rest
    ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
    : lastThree;
  return "₹" + grouped;
}
