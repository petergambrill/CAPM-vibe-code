// Lightweight beta fetch/estimate helpers
// Strategy:
// 1) If FINNHUB_API_KEY is present, try Finnhub's stock metrics (includes beta).
// 2) Otherwise, fall back to hard-coded examples in examples.ts.

export async function fetchLiveBeta(ticker: string): Promise<number | null> {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) return null;
    const url = `https://finnhub.io/api/v1/stock/metric?symbol=${encodeURIComponent(ticker)}&metric=all&token=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    const beta = data?.metric?.beta || data?.metric?.beta_2y || data?.metric?.beta_5y || null;
    if (typeof beta === 'number') return beta;
    return null;
  } catch (e) {
    return null;
  }
}
