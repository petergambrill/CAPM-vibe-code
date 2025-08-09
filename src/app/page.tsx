'use client';
import { useMemo, useState } from 'react';
import { EXAMPLES } from '@/lib/examples';

function pct(x?: number) { return (x ?? 0).toLocaleString(undefined, { style: 'percent', maximumFractionDigits: 2 }); }

export default function Home() {
  const [ticker, setTicker] = useState<keyof typeof EXAMPLES>('NG.L');
  const ex = EXAMPLES[ticker];

  const [riskFreeRate, setRf] = useState(ex.riskFreeRate);
  const [tmr, setTmr] = useState(ex.totalMarketReturn);
  const [beta, setBeta] = useState(ex.equityBeta);
  const [gear, setGear] = useState(ex.gearing);
  const [kd, setKd] = useState(ex.costOfDebt);
  const [tax, setTax] = useState(ex.taxRate);

  const [serverResult, setServerResult] = useState<null | { costOfEquity: number; vanillaWACC?: number }>(null);
  const [loading, setLoading] = useState(false);

  const erp = useMemo(() => tmr - riskFreeRate, [tmr, riskFreeRate]);
  const keLocal = useMemo(() => riskFreeRate + beta * (tmr - riskFreeRate), [riskFreeRate, tmr, beta]);
  const waccLocal = useMemo(() => keLocal * (1 - gear) + kd * gear, [keLocal, gear, kd]);

  async function runServer() {
    setLoading(true);
    setServerResult(null);
    const res = await fetch('/api/capm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticker,
        riskFreeRate,
        totalMarketReturn: tmr,
        equityBeta: beta,
        gearing: gear,
        costOfDebt: kd,
        taxRate: tax,
        useNotionalGearing: true
      })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      alert(data.error || 'Server error');
      return;
    }
    setServerResult({ costOfEquity: data.outputs.costOfEquity, vanillaWACC: data.outputs.vanillaWACC });
  }

  return (
    <main className="container">
      <div className="card">
        <h1 style={{marginTop:0}}>UKRN CAPM Calculator</h1>
        <p className="small">Estimate cost of equity via CAPM (Ke = Rf + β × (TMR − Rf)) and optional vanilla WACC. Works offline with hard‑coded UK examples; add a Finnhub key for live betas.</p>

        <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))'}}>
          <div>
            <label>Example company</label>
            <select value={ticker} onChange={(e) => { const t = e.target.value as keyof typeof EXAMPLES; setTicker(t); const ex = EXAMPLES[t]; setRf(ex.riskFreeRate); setTmr(ex.totalMarketReturn); setBeta(ex.equityBeta); setGear(ex.gearing); setKd(ex.costOfDebt); setTax(ex.taxRate); }}>
              {Object.values(EXAMPLES).map((o) => (
                <option key={o.ticker} value={o.ticker}>{o.name} ({o.ticker})</option>
              ))}
            </select>
          </div>
          <div>
            <label>Risk‑free rate (Rf, real)</label>
            <input type="number" step="0.0001" value={riskFreeRate} onChange={(e)=>setRf(parseFloat(e.target.value))} />
            <div className="small">e.g., UK index‑linked gilts (CPIH‑real)</div>
          </div>
          <div>
            <label>Total Market Return (TMR, real)</label>
            <input type="number" step="0.0001" value={tmr} onChange={(e)=>setTmr(parseFloat(e.target.value))} />
            <div className="small">Long‑run equity return (real)</div>
          </div>
          <div>
            <label>Equity beta (β)</label>
            <input type="number" step="0.01" value={beta} onChange={(e)=>setBeta(parseFloat(e.target.value))} />
            <div className="small">Re‑levered to notional gearing (see advanced)</div>
          </div>
          <div>
            <label>Notional gearing (D/(D+E))</label>
            <input type="number" step="0.01" value={gear} onChange={(e)=>setGear(parseFloat(e.target.value))} />
          </div>
          <div>
            <label>Cost of debt (pre‑tax, real)</label>
            <input type="number" step="0.0001" value={kd} onChange={(e)=>setKd(parseFloat(e.target.value))} />
          </div>
          <div>
            <label>Tax rate (notional)</label>
            <input type="number" step="0.01" value={tax} onChange={(e)=>setTax(parseFloat(e.target.value))} />
          </div>
        </div>

        <hr />

        <div className="grid">
          <div className="kpi"><span>Equity risk premium (ERP)</span><strong>{pct(erp)}</strong></div>
          <div className="kpi"><span>Cost of equity (Ke)</span><strong>{pct(keLocal)}</strong></div>
          <div className="kpi"><span>Vanilla WACC</span><strong>{pct(waccLocal)}</strong></div>
        </div>

        <div style={{display:'flex', gap:8, marginTop:16}}>
          <button onClick={runServer} disabled={loading}>{loading ? 'Calculating…' : 'Recalculate via API'}</button>
          <button className="secondary" onClick={()=>navigator.clipboard.writeText(JSON.stringify({ ticker, riskFreeRate, totalMarketReturn: tmr, equityBeta: beta, gearing: gear, costOfDebt: kd, taxRate: tax }, null, 2))}>Copy JSON</button>
        </div>

        <footer>
          <p>Notes: Uses UKRN methodology: CAPM with Rf, TMR and β; beta at notional gearing via de‑/re‑levering; vanilla WACC combines Ke and pre‑tax Kd with gearing. Inputs shown in real terms (e.g., CPIH‑real) for internal consistency.</p>
        </footer>
      </div>
    </main>
  );
}
