export type ValuationInput = {
  askingPrice: number;
  areaM2?: number | null;
  estimatedMonthlyRent?: number | null;
  regionalPriceCeilingPerM2?: number | null;
};

export type ValuationResult = {
  modelVersion: string;
  estimatedRentMonthly: number;
  annualRentEstimate: number;
  capRatePct: number;
  irrEstimatePct: number;
  regionalPriceCeiling: number;
  discountVsCeilingPct: number;
  confidence: number;
  inputs: ValuationInput;
};

/**
 * Motor de valuation MVP: formulas explicitas para demo.
 * IRR aqui e um proxy simplificado (nao e TIR de fluxo de caixa completo).
 */
export const computeValuation = (input: ValuationInput): ValuationResult => {
  const price = input.askingPrice;
  const area = input.areaM2 ?? 0;

  const impliedMonthlyRent =
    input.estimatedMonthlyRent ?? Math.round((price * 0.005 + Number.EPSILON) * 100) / 100;

  const annualRent = impliedMonthlyRent * 12;
  const capRate = price > 0 ? (annualRent / price) * 100 : 0;
  const irrEstimate = capRate * 0.92;

  const ceilingPerM2 =
    input.regionalPriceCeilingPerM2 ??
    (area > 0 ? (price * 1.12) / area : (price * 1.12) / Math.max(area, 1));

  const regionalCeiling =
    area > 0 ? ceilingPerM2 * area : price * 1.12;

  const discountVsCeiling =
    regionalCeiling > 0 ? ((regionalCeiling - price) / regionalCeiling) * 100 : 0;

  const confidence = input.estimatedMonthlyRent != null && input.regionalPriceCeilingPerM2 != null
    ? 0.75
    : input.estimatedMonthlyRent != null
      ? 0.6
      : 0.35;

  return {
    modelVersion: "mvp-1",
    estimatedRentMonthly: impliedMonthlyRent,
    annualRentEstimate: annualRent,
    capRatePct: Math.round(capRate * 10000) / 10000,
    irrEstimatePct: Math.round(irrEstimate * 10000) / 10000,
    regionalPriceCeiling: Math.round(regionalCeiling * 100) / 100,
    discountVsCeilingPct: Math.round(discountVsCeiling * 10000) / 10000,
    confidence: Math.round(confidence * 1000) / 1000,
    inputs: input,
  };
};
