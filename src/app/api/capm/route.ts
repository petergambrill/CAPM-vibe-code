import { NextRequest, NextResponse } from 'next/server';
import { costOfEquity, vanillaWACC, deleverEquityBeta, releverAssetBeta } from '@/lib/capm';
import { EXAMPLES } from '@/lib/examples';
import { fetchLiveBeta } from '@/lib/beta';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      ticker,
      riskFreeRate,
      totalMarketReturn,
      equityBeta,
      gearing,
      costOfDebt,
      taxRate,
      useNotionalGearing // boolean: if true, (de)re-lever beta to this gearing
    } = body;

    // If equityBeta not provided, try live beta then examples
    let beta: number | undefined = equityBeta;
    if (beta === undefined || beta === null) {
      const live = await fetchLiveBeta(ticker);
      beta = (typeof live === 'number') ? live : (EXAMPLES as any)[ticker]?.equityBeta;
    }
    if (typeof beta !== 'number') {
      return NextResponse.json({ error: 'No beta available for this ticker. Provide equityBeta explicitly or choose an example.' }, { status: 400 });
    }

    let notionalBeta = beta;
    if (useNotionalGearing && typeof taxRate === 'number' && typeof gearing === 'number') {
      // Assume the provided beta is at the company’s actual gearing (unknown here).
      // In absence of actual D/E, we approximate by de-levering using example gearing if present.
      // Better: pass actualGearing in body. For now, use provided gearing both ways => no-op if same.
      const assetBeta = deleverEquityBeta(beta, gearing, taxRate);
      notionalBeta = releverAssetBeta(assetBeta, gearing, taxRate);
    }

    const ke = costOfEquity({ riskFreeRate, totalMarketReturn, equityBeta: notionalBeta });

    let wacc: number | undefined;
    if (typeof gearing === 'number' && typeof costOfDebt === 'number') {
      wacc = vanillaWACC({ riskFreeRate, totalMarketReturn, equityBeta: notionalBeta, gearing, costOfDebt });
    }

    return NextResponse.json({
      inputs: { ticker, riskFreeRate, totalMarketReturn, equityBeta: notionalBeta, gearing, costOfDebt, taxRate },
      outputs: { costOfEquity: ke, vanillaWACC: wacc }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unexpected error' }, { status: 500 });
  }
}
