const IST_OFFSET = 330 * 60_000;

/** Start of day in IST, returned as a UTC Date. */
function istStartOfDay(d: Date) {
  const ist = new Date(d.getTime() + IST_OFFSET);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - IST_OFFSET);
}

export function istDayKey(d: Date) {
  return new Date(d.getTime() + IST_OFFSET).toISOString().slice(0, 10);
}

export type RangeKey = "today" | "7d" | "30d" | "month" | "custom";

export function resolveRange(range?: string, from?: string, to?: string) {
  const now = new Date();
  const today = istStartOfDay(now);
  let start: Date;
  let end = new Date(today.getTime() + 86400_000);
  let key: RangeKey = (["today", "7d", "30d", "month", "custom"].includes(range ?? "") ? range : "30d") as RangeKey;
  switch (key) {
    case "today":
      start = today;
      break;
    case "7d":
      start = new Date(today.getTime() - 6 * 86400_000);
      break;
    case "month": {
      const ist = new Date(now.getTime() + IST_OFFSET);
      start = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), 1) - IST_OFFSET);
      break;
    }
    case "custom": {
      const f = from && /^\d{4}-\d{2}-\d{2}$/.test(from) ? new Date(`${from}T00:00:00+05:30`) : null;
      const t = to && /^\d{4}-\d{2}-\d{2}$/.test(to) ? new Date(`${to}T00:00:00+05:30`) : null;
      if (f && t && f <= t) {
        start = f;
        end = new Date(t.getTime() + 86400_000);
      } else {
        key = "30d";
        start = new Date(today.getTime() - 29 * 86400_000);
      }
      break;
    }
    default:
      start = new Date(today.getTime() - 29 * 86400_000);
  }
  return { key, start, end };
}

export function dayBuckets(start: Date, end: Date) {
  const keys: string[] = [];
  for (let t = start.getTime(); t < end.getTime(); t += 86400_000) keys.push(istDayKey(new Date(t)));
  return keys;
}
