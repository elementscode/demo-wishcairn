const UNITS: [number, string][] = [
  [60 * 60 * 24 * 365, "y"],
  [60 * 60 * 24 * 30, "mo"],
  [60 * 60 * 24 * 7, "w"],
  [60 * 60 * 24, "d"],
  [60 * 60, "h"],
  [60, "m"],
];

export function timeAgo(date: Date, now: Date = new Date()): string {
  let seconds = Math.max(0, Math.floor((+now - +date) / 1000));

  for (let [size, unit] of UNITS) {
    if (seconds >= size) {
      return `${Math.floor(seconds / size)}${unit} ago`;
    }
  }

  return "just now";
}

export function longDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function plural(n: number, one: string, many: string = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}
