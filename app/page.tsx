import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Info, RefreshCw, Calculator, Database } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

function clamp01(x) { return Math.max(0, Math.min(1, x)); }
function pct(x) { return (x * 100).toFixed(2) + "%"; }
function realFromNominal(nominal, inflation) { return (1 + nominal) / (1 + inflation) - 1; }
function capmCostOfEquity({ rfr, tmr, beta }) { const erp = tmr - rfr; return rfr + beta * erp; }
function wacc({ coe, cod, DoverV, taxRate }) { const EoverV = 1 - DoverV; return EoverV * coe + DoverV * cod * (1 - taxRate); }

async function fetchRiskFreeFromBoE(kind) { switch (kind) { case "boe_10y_nominal": return 0.046; case "boe_20y_nominal": return 0.043; case "ilg_20y_real": return 0.016; default: return 0.04; } }

const UKRN_TMR_PRESETS = { ukrn_2024_mid: 0.065, ukrn_2023_mid: 0.062 };

export default function App() {
  const [realMode, setRealMode] = useState("nominal");
  const [inflation, setInflation] = useState(0.03);
  const [rfrCfg, setRfrCfg] = useState({ source: "boe_20y_nominal", value: 0.043, frequency: "spot" });
  const [tmrCfg, setTmrCfg] = useState({ source: "ukrn_2024_mid", value: UKRN_TMR_PRESETS["ukrn_2024_mid"] });
  const [betaInputs, setBetaInputs] = useState({ mode: "direct", directBeta: 0.75, debtBeta: 0.075, taxRate: 0.25, notionalGearing: 0.55 });
  const [debtCfg, setDebtCfg] = useState({ costOfDebt: 0.055 });
  const [history, setHistory] = useState([]);

  const DoverV = betaInputs.notionalGearing;
  const EoverV = 1 - DoverV;
  const effectiveRfr = rfrCfg.value;
  const effectiveTmr = tmrCfg.value;

  const beta = useMemo(() => betaInputs.directBeta, [betaInputs.directBeta]);

  const coe_nominal = capmCostOfEquity({ rfr: effectiveRfr, tmr: effectiveTmr, beta });
  const coe_real = realFromNominal(coe_nominal, inflation);
  const cod_nominal = debtCfg.costOfDebt;
  const cod_real = realFromNominal(cod_nominal, inflation);
  const wacc_nominal = wacc({ coe: coe_nominal, cod: cod_nominal, DoverV, taxRate: betaInputs.taxRate });
  const wacc_real = wacc({ coe: coe_real, cod: cod_real, DoverV, taxRate: betaInputs.taxRate });
  const displayedCoE = realMode === "real" ? coe_real : coe_nominal;
  const displayedWACC = realMode === "real" ? wacc_real : wacc_nominal;

  function parseNum(v, fallback = 0) { const n = parseFloat(v); return Number.isFinite(n) ? n : fallback; }

  function record() { const now = new Date().toISOString(); setHistory((h) => [...h.slice(-49), { ts: now, coe: displayedCoE, wacc: displayedWACC }]); }

  async function refreshRFR() { if (rfrCfg.source === "manual") return; const v = await fetchRiskFreeFromBoE(rfrCfg.source); setRfrCfg({ ...rfrCfg, value: v }); }

  function applyUKRNPreset(key) { if (key === "manual") return; const v = UKRN_TMR_PRESETS[key] ?? tmrCfg.value; setTmrCfg({ source: key, value: v }); }

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">UKRN-aligned CAPM Cost of Capital</h1>
        <div className="flex items-center gap-3 text-sm opacity-80">
          <Database className="h-4 w-4"/>
          <span>Replace mock providers with live APIs (BoE, DMO/Tradeweb, EODHD, Finnhub, etc.)</span>
        </div>
      </header>

      <Card className="shadow-lg border rounded-2xl">
        <CardContent className="p-6 grid md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <Label>Measurement basis</Label>
            <Select value={realMode} onValueChange={(v) => setRealMode(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nominal">Nominal</SelectItem>
                <SelectItem value="real">Real (CPI)</SelectItem>
              </SelectContent>
            </Select>
            <div className="pt-2">
              <Label className="text-sm">CPI inflation (for conversions)</Label>
              <div className="flex gap-3 items-center">
                <Input type="number" step="0.001" value={inflation} onChange={(e)=>setInflation(parseNum(e.target.value, 0))}/>
                <span className="text-muted-foreground">{pct(inflation)}</span>
              </div>
              <p className="text-xs text-muted-foreground pt-1">Used only when converting between nominal and real.</p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Risk-free rate (RFR)</Label>
            <Select value={rfrCfg.source} onValueChange={(v) => setRfrCfg({ ...rfrCfg, source: v })}>
              <SelectTrigger><SelectValue placeholder="Select source"/></SelectTrigger>
              <SelectContent>
                <SelectItem value="boe_20y_nominal">BoE 20y nominal (UK gilts)</SelectItem>
                <SelectItem value="boe_10y_nominal">BoE 10y nominal (UK gilts)</SelectItem>
                <SelectItem value="ilg_20y_real">20y index-linked gilt (real)</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-3">
              <Input type="number" step="0.0001" value={rfrCfg.value} onChange={(e)=>setRfrCfg({ ...rfrCfg, value: parseNum(e.target.value, 0) })}/>
              <Button variant="secondary" onClick={refreshRFR}><RefreshCw className="h-4 w-4 mr-2"/>Fetch</Button>
            </div>
            <p className="text-xs text-muted-foreground">Express as decimal (e.g., 0.043 for 4.3%).</p>
          </div>

          <div className="space-y-3">
            <Label>Total Market Return (TMR)</Label>
            <Select value={tmrCfg.source} onValueChange={(v)=>{ setTmrCfg({ ...tmrCfg, source: v }); applyUKRNPreset(v); }}>
              <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
              <SelectContent>
                <SelectItem value="ukrn_2024_mid">UKRN 2024 (mid)</SelectItem>
                <SelectItem value="ukrn_2023_mid">UKRN 2023 (mid)</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-3">
              <Input type="number" step="0.0001" value={tmrCfg.value} onChange={(e)=>setTmrCfg({ ...tmrCfg, value: parseNum(e.target.value, 0) })}/>
              <span className="text-muted-foreground">{pct(tmrCfg.value)}</span>
            </div>
            <p className="text-xs text-muted-foreground">UKRN frames ERP = TMR − RFR. Ensure consistency of real/nominal.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow border rounded-2xl">
        <CardContent className="p-6 grid md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <Label>Equity beta (β)</Label>
            <Select value={betaInputs.mode} onValueChange={(v)=> setBetaInputs({ ...betaInputs, mode: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="direct">Direct input</SelectItem>
                <SelectItem value="comps">From comparators (server)</SelectItem>
              </SelectContent>
            </Select>
            <div className="space-y-2">
              <Label className="text-sm">β (direct)</Label>
              <Input type="number" step="0.01" value={betaInputs.directBeta} onChange={(e)=>setBetaInputs({ ...betaInputs, directBeta: parseNum(e.target.value, 0) })}/>
              <p className="text-xs text-muted-foreground">If using comparators, calculate β on server with OLS, de-/re-lever per UKRN.</p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Notional gearing (D/V)</Label>
            <Slider value={[Math.round(betaInputs.notionalGearing*100)]} onValueChange={(v)=> setBetaInputs({ ...betaInputs, notionalGearing: clamp01((v?.[0] ?? 0)/100) })} />
            <div className="flex items-center gap-3">
              <Input type="number" step="0.01" value={betaInputs.notionalGearing} onChange={(e)=> setBetaInputs({ ...betaInputs, notionalGearing: clamp01(parseNum(e.target.value, 0)) })}/>
              <span className="text-muted-foreground">E/V ≈ {(EoverV*100).toFixed(0)}%</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Corporate tax rate (t)</Label>
                <Input type="number" step="0.001" value={betaInputs.taxRate} onChange={(e)=> setBetaInputs({ ...betaInputs, taxRate: parseNum(e.target.value, 0) })}/>
              </div>
              <div>
                <Label className="text-sm">Debt beta (β_d)</Label>
                <Input type="number" step="0.001" value={betaInputs.debtBeta} onChange={(e)=> setBetaInputs({ ...betaInputs, debtBeta: parseNum(e.target.value, 0) })}/>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Cost of debt (CoD)</Label>
            <div className="flex items-center gap-3">
              <Input type="number" step="0.0001" value={debtCfg.costOfDebt} onChange={(e)=> setDebtCfg({ costOfDebt: parseNum(e.target.value, 0) })}/>
              <span className="text-muted-foreground">{pct(debtCfg.costOfDebt)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Nominal CoD input; will be converted to real if needed.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border shadow">
        <CardContent className="p-6 grid md:grid-cols-4 gap-6 items-start">
          <div className="md:col-span-2 space-y-3">
            <h2 className="text-xl font-semibold flex items-center gap-2"><Calculator className="h-5 w-5"/> Results</h2>
            <div className="grid grid-cols-2 gap-4">
              <Metric label="Cost of equity (CAPM)" value={pct(displayedCoE)} />
              <Metric label="WACC (optional)" value={pct(displayedWACC)} />
              <Metric label="ERP (TMR − RFR)" value={pct(effectiveTmr - effectiveRfr)} />
              <Metric label="Equity share (E/V)" value={(EoverV*100).toFixed(0) + "%"} />
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed pt-2">
              <p>CAPM uses TMR and RFR to form ERP, then CoE = RFR + β × ERP. Per UKRN, estimate β from comparable listed companies using OLS, de-lever to asset β and re-lever to notional gearing. Use gilts for RFR and consider index-linked gilts for real terms.</p>
            </div>
            <div className="pt-2">
              <Button onClick={record} className="">Record to chart</Button>
            </div>
          </div>

          <div className="md:col-span-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ts" hide={true} />
                <YAxis tickFormatter={(v)=> (v*100).toFixed(1)+"%"} />
                <Tooltip formatter={(v)=> (typeof v === "number" ? pct(v) : v)} />
                <Line type="monotone" dataKey="coe" dot={false} />
                <Line type="monotone" dataKey="wacc" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold">Hooking up live data</h3>
          <ul className="text-sm list-disc pl-6 space-y-2">
            <li><strong>Risk-free rate:</strong> Server-side proxy to the Bank of England yields (nominal and real) or DMO/FTSE-Tradeweb reference prices. Cache daily.</li>
            <li><strong>TMR/ERP:</strong> Maintain a small JSON updated from the latest UKRN Annual Cost of Capital report (midpoint and range). Expose via <code>/api/tmr/latest</code>.</li>
            <li><strong>Equity beta from comparators:</strong> Server endpoint that fetches LSE comparator price series (e.g., EOD Historical Data, Tiingo, Finnhub, Refinitiv). Compute β using rolling OLS vs FTSE All-Share or sector index. De-/re-lever per UKRN and your notional gearing.</li>
          </ul>
          <div className="text-xs text-muted-foreground flex items-start gap-2"><Info className="h-4 w-4 mt-0.5"/>Ensure consistent term (e.g., 20y) and inflation basis (nominal vs real) across RFR, TMR, CoD. UKRN generally prefers using ranges and taking midpoints; you can extend this UI to show ranges and sensitivity.</div>
        </CardContent>
      </Card>

      <footer className="text-xs text-muted-foreground pb-8">
        <p>Demo only. Replace mocks with production data services and add validation, logging, and error handling as needed.</p>
      </footer>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="p-4 rounded-2xl bg-muted/40 border">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
