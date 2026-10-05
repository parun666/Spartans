export function formatINR(paise: number, currency = "INR"): string {
  const symbol: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };
  const s = symbol[currency] ?? "";
  const inr = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(paise / 100);
  return `${s}${inr}`;
}
export function parseAmountToPaise(value: string | number): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}
