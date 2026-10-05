export function sipFutureValuePaise(monthlyPaise: number, annualRatePercent: number, years: number): { investedPaise: number; futureValuePaise: number; schedule: { month: number; investedPaise: number; valuePaise: number }[] } {
  const n = years * 12;
  const r = annualRatePercent / 12 / 100;
  const investedPaise = monthlyPaise * n;
  const schedule: { month: number; investedPaise: number; valuePaise: number }[] = [];
  if (r === 0) {
    for (let m = 1; m <= n; m++) schedule.push({ month: m, investedPaise: monthlyPaise * m, valuePaise: monthlyPaise * m });
    return { investedPaise, futureValuePaise: investedPaise, schedule };
  }
  const fv = monthlyPaise * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
  for (let m = 1; m <= n; m++) {
    const v = monthlyPaise * (((Math.pow(1 + r, m) - 1) / r) * (1 + r));
    schedule.push({ month: m, investedPaise: monthlyPaise * m, valuePaise: Math.round(v) });
  }
  return { investedPaise, futureValuePaise: Math.round(fv), schedule };
}

export function investmentPerformance(investedPaise: number, currentPaise: number): { profitLossPaise: number; returnPct: number | null } {
  const profitLossPaise = currentPaise - investedPaise;
  const returnPct = investedPaise === 0 ? null : (profitLossPaise / investedPaise) * 100;
  return { profitLossPaise, returnPct };
}

export function savingsRate(incomePaise: number, expensePaise: number): number | null {
  if (incomePaise === 0) return null;
  return ((incomePaise - expensePaise) / incomePaise) * 100;
}

export function goalProgress(savedPaise: number, targetPaise: number): { remainingPaise: number; pct: number } {
  const remainingPaise = Math.max(0, targetPaise - savedPaise);
  const pct = targetPaise === 0 ? 0 : Math.min(100, (savedPaise / targetPaise) * 100);
  return { remainingPaise, pct };
}
