import { requireUser } from "@/lib/auth";
import { json, errorResponse } from "@/lib/api";

const INDICES = [
  { symbol: "^NSEI", name: "NIFTY 50" },
  { symbol: "^BSESN", name: "Sensex" }
];

type YahooPoint = { regularMarketTime?: number; regularMarketPrice?: number; chartPreviousClose?: number; timestamp?: number[]; indicators?: { quote?: { close?: Array<number | null> }[] } };

async function fetchIndex(symbol: string, name: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Market source returned ${res.status}`);
  const payload = await res.json() as { chart?: { result?: YahooPoint[]; error?: unknown } };
  const result = payload.chart?.result?.[0];
  if (!result) throw new Error("No market data returned");
  const timestamps = result.timestamp ?? [];
  const closes = result.indicators?.quote?.[0]?.close ?? [];
  const points = timestamps.map((time, index) => ({ date: new Date(time * 1000).toISOString().slice(0, 10), close: closes[index] })).filter((p): p is { date: string; close: number } => typeof p.close === "number");
  const price = result.regularMarketPrice ?? points.at(-1)?.close ?? null;
  const previous = result.chartPreviousClose ?? points.at(-2)?.close ?? null;
  const change = price !== null && previous !== null ? price - previous : null;
  const changePct = change !== null && previous ? (change / previous) * 100 : null;
  return { symbol, name, price, change, changePct, points, source: "Yahoo Finance delayed chart API" };
}

export async function GET(req: Request) {
  try {
    await requireUser(req);
    const indices = await Promise.all(INDICES.map(async (index) => {
      try {
        return await fetchIndex(index.symbol, index.name);
      } catch (e) {
        return { ...index, price: null, change: null, changePct: null, points: [], error: (e as Error).message };
      }
    }));
    return json({ indices, asOf: new Date().toISOString() });
  } catch (e) {
    return errorResponse(e);
  }
}
