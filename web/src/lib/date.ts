// `<input type="date">` values are plain "YYYY-MM-DD" strings with no
// timezone. Round-tripping them through `toISOString()`/`new Date(string)`
// parses/renders in UTC, which silently shifts the displayed or saved date
// by a day for any user not in UTC (e.g. IST is UTC+5:30 — a date-only
// string parses as UTC midnight, and formatting via toISOString() can
// render the previous UTC day for late-night local times). These helpers
// stay in the browser's local calendar throughout instead.
export function toDateInputValue(value: Date | string | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateInputValue(value: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}
