// Sesi custom per-perangkat (client-side). Mesin skor server memakai jam default.

export interface SessionRange {
  start: string; // "HH:MM" WIB
  end: string;
}

export interface SessionSettings {
  asia: SessionRange;
  london: SessionRange;
  newyork: SessionRange;
  killLondon: SessionRange;
  killNewyork: SessionRange;
}

export const SESSION_DEFAULTS: SessionSettings = {
  asia: { start: "06:00", end: "14:00" },
  london: { start: "14:00", end: "22:00" },
  newyork: { start: "19:30", end: "04:00" },
  killLondon: { start: "14:00", end: "17:00" },
  killNewyork: { start: "19:30", end: "22:30" },
};

export const parseHm = (s: string): number => {
  const [h, m] = s.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** apakah hm (menit) berada dalam rentang; handle rentang yang melewati tengah malam */
export const inRange = (hm: number, r: SessionRange): boolean => {
  const a = parseHm(r.start);
  const b = parseHm(r.end);
  if (a <= b) return hm >= a && hm < b;
  return hm >= a || hm < b;
};

export const sessionLabelCustom = (hm: number, s: SessionSettings): string => {
  if (inRange(hm, s.asia)) return "Asia";
  if (inRange(hm, s.london)) return "London";
  return "New York";
};

export const killZoneCustom = (hm: number, s: SessionSettings): string | null => {
  if (inRange(hm, s.killLondon)) return "London";
  if (inRange(hm, s.killNewyork)) return "New York";
  return null;
};
