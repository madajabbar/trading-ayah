export const fmtNum = (n: number, dec = 2): string =>
  n === 0 || !isFinite(n) ? "0" : n.toLocaleString("id-ID", { minimumFractionDigits: dec, maximumFractionDigits: dec });

export const fmtPct = (n: number): string => `${n > 0 ? "+" : ""}${fmtNum(n, 2)}%`;

export const fmtPrice = (n: number): string => {
  if (!isFinite(n)) return "—";
  const abs = Math.abs(n);
  return n.toLocaleString("id-ID", {
    minimumFractionDigits: abs >= 1000 ? 2 : 4,
    maximumFractionDigits: abs >= 1000 ? 2 : 4,
  });
};

export const fmtTime = (iso: string): string => {
  try { return new Date(iso).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }); }
  catch { return iso; }
};

/** waktu WIB sbg jam:menit utk tampilan */
export const wibClock = (): string => {
  const d = new Date(Date.now() + 7 * 3600 * 1000);
  const h = String(d.getUTCHours()).padStart(2, "0");
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  const s = String(d.getUTCSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

export const sessionLabel = (hm: number): string => {
  if (hm >= 6 * 60 && hm < 14 * 60) return "Asia";
  if (hm >= 14 * 60 && hm < 22 * 60) return "London";
  return "New York";
};

export const killZoneLabel = (hm: number): string | null => {
  if (hm >= 14 * 60 && hm < 17 * 60) return "London";
  if (hm >= 19 * 60 + 30 && hm < 22 * 60 + 30) return "New York";
  return null;
};

export const wibHm = (): number => {
  const d = new Date(Date.now() + 7 * 3600 * 1000);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
};
