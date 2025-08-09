// Hard-coded UK examples (CPIH-real) for illustration if no API key is set.
// Values are indicative and should be replaced by live inputs for decisions.

export type ExampleKey = "NG.L" | "SSE.L" | "SVT.L";

export const EXAMPLES: Record<ExampleKey, {
  name: string;
  ticker: string;
  // Assumptions (illustrative only)
  riskFreeRate: number; // CPIH-real Rf
  totalMarketReturn: number; // CPIH-real TMR
  equityBeta: number; // re-levered to notional gearing below
  gearing: number; // D/(D+E)
  costOfDebt: number; // real pre-tax
  taxRate: number; // notional UK corporation tax
}> = {
  "NG.L": {
    name: "National Grid plc",
    ticker: "NG.L",
    riskFreeRate: 0.012, // 1.2% real
    totalMarketReturn: 0.055, // 5.5% real
    equityBeta: 0.65,
    gearing: 0.60,
    costOfDebt: 0.020,
    taxRate: 0.25
  },
  "SSE.L": {
    name: "SSE plc",
    ticker: "SSE.L",
    riskFreeRate: 0.012,
    totalMarketReturn: 0.055,
    equityBeta: 0.70,
    gearing: 0.55,
    costOfDebt: 0.022,
    taxRate: 0.25
  },
  "SVT.L": {
    name: "Severn Trent plc",
    ticker: "SVT.L",
    riskFreeRate: 0.012,
    totalMarketReturn: 0.055,
    equityBeta: 0.72,
    gearing: 0.60,
    costOfDebt: 0.019,
    taxRate: 0.25
  }
};
