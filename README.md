# UKRN CAPM App

A tiny Next.js app that demonstrates a UKRN‑aligned cost of capital workflow:

- **CAPM cost of equity**: \(K_e = R_f + \beta (\text{TMR} - R_f)\)
- **Vanilla WACC**: \(WACC = K_e (1-g) + K_d g\) with **notional gearing** \(g = D/(D+E)\)
- **Beta at notional gearing** using standard de‑/re‑levering with the notional tax rate.

> All default numbers are **illustrative**. For regulatory work, replace with live inputs and document sources.

## Getting started

```bash
pnpm i   # or npm i / yarn
pnpm dev # http://localhost:3000
