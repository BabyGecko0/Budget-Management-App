export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function money(n: number, currency?: string): string {
  const formatted = n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency ? `${formatted} ${currency}` : formatted;
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function prettyDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
  if (iso === todayIso) return "Today";
  if (iso === yesterday) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}

/** Fallback palette when a category has no color set */
const PALETTE = [
  "#16a34a", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ef4444",
  "#14b8a6", "#f97316", "#ec4899", "#6366f1", "#84cc16",
];

export function categoryColor(color: string | null | undefined, seed: number): string {
  return color && color.trim() ? color : PALETTE[Math.abs(seed) % PALETTE.length];
}
