export function formatINR(paise: number, currency = "INR"): string {
  const symbol: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };
  const s = symbol[currency] ?? "";
  const inr = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(paise / 100);
  return `${s}${inr}`;
}

export const MAX_AMOUNT_PAISE = 2_147_483_647;

export function parseAmountToPaise(value: string | number): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  const paise = Math.round(n * 100);
  if (
    n < 0 ||
    paise > MAX_AMOUNT_PAISE ||
    !Number.isSafeInteger(paise) ||
    Math.abs(n - paise / 100) > 1e-8
  ) {
    return null;
  }
  return paise;
}
