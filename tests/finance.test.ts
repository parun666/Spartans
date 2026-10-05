import { describe, it, expect } from "vitest";
import { sipFutureValuePaise, investmentPerformance, savingsRate, goalProgress } from "@/lib/finance";
import { formatINR, parseAmountToPaise } from "@/lib/money";

describe("SIP", () => {
  it("₹5,000/mo, 12% annual, 10 years", () => {
    const { investedPaise, futureValuePaise } = sipFutureValuePaise(500000, 12, 10);
    expect(investedPaise).toBe(60000000); // ₹6,00,000
    const r = 0.12 / 12;
    const expected = 500000 * (((Math.pow(1 + r, 120) - 1) / r) * (1 + r));
    expect(futureValuePaise).toBe(Math.round(expected));
    expect(futureValuePaise).toBeGreaterThan(investedPaise);
  });
  it("r = 0 → invested only", () => {
    const { investedPaise, futureValuePaise } = sipFutureValuePaise(100000, 0, 5);
    expect(futureValuePaise).toBe(investedPaise);
  });
  it("schedule has months", () => {
    expect(sipFutureValuePaise(100000, 10, 2).schedule.length).toBe(24);
  });
});

describe("Investment performance", () => {
  it("profit", () => {
    const p = investmentPerformance(10000000, 11200000);
    expect(p.profitLossPaise).toBe(1200000);
    expect(p.returnPct).toBeCloseTo(12, 5);
  });
  it("loss", () => {
    const p = investmentPerformance(10000000, 8000000);
    expect(p.profitLossPaise).toBe(-2000000);
    expect(p.returnPct).toBeCloseTo(-20, 5);
  });
  it("equal", () => {
    expect(investmentPerformance(5000000, 5000000).profitLossPaise).toBe(0);
  });
  it("invested = 0 → return null", () => {
    expect(investmentPerformance(0, 100).returnPct).toBeNull();
  });
});

describe("Savings rate", () => {
  it("normal", () => {
    expect(savingsRate(10000000, 7500000)).toBeCloseTo(25, 5);
  });
  it("income = 0 → null", () => {
    expect(savingsRate(0, 5000)).toBeNull();
  });
});

describe("Goals", () => {
  it("progress", () => {
    expect(goalProgress(3500000, 10000000).pct).toBeCloseTo(35, 5);
    expect(goalProgress(12000000, 10000000).pct).toBe(100);
  });
});

describe("Money", () => {
  it("formats en-IN", () => {
    expect(formatINR(12500000)).toBe("₹1,25,000.00");
  });
  it("parse", () => {
    expect(parseAmountToPaise(1234.56)).toBe(123456);
    expect(parseAmountToPaise("abc")).toBeNull();
  });
});
