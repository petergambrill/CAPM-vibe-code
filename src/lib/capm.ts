// Core finance utilities aligned to UKRN methodology
export type Basis = "real" | "nominal";

export interface CapmInputs {
  riskFreeRate: number; // Rf (as decimal)
  totalMarketReturn: number; // TMR (as decimal)
  equityBeta: number; // beta for the notional company
}

export interface WaccInputs extends CapmInputs {
  gearing: number; // D / (D + E), 0..1
  costOfDebt: number; // pre-tax, same basis as Ke
  vanilla?: boolean; // default true
}

export function equityRiskPremium({ riskFreeRate, totalMarketReturn }: { riskFreeRate: number; totalMarketReturn: number; }) {
  return totalMarketReturn - riskFreeRate;
}

export function costOfEquity({ riskFreeRate, totalMarketReturn, equityBeta }: CapmInputs) {
  // UKRN uses TMR; equivalently Ke = Rf + beta * (TMR - Rf)
  return riskFreeRate + equityBeta * (totalMarketReturn - riskFreeRate);
}

export function vanillaWACC({ gearing, costOfDebt, ...capm }: WaccInputs) {
  const ke = costOfEquity(capm);
  const g = clamp(gearing, 0, 1);
  // Vanilla WACC (no tax shield): Ke * (1-g) + Kd * g
  return ke * (1 - g) + costOfDebt * g;
}

export function clamp(x: number, min: number, max: number) { return Math.min(max, Math.max(min, x)); }

// Modigliani–Miller de-/re-levering with tax (UKRN: apply notional gearing & tax rate)
export function deleverEquityBeta(equityBeta: number, gearing: number, taxRate: number) {
  const dOverE = gearing / (1 - gearing);
  return equityBeta / (1 + (1 - taxRate) * dOverE);
}

export function releverAssetBeta(assetBeta: number, gearing: number, taxRate: number) {
  const dOverE = gearing / (1 - gearing);
  return assetBeta * (1 + (1 - taxRate) * dOverE);
}
