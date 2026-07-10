/**
 * Client-side mortgage math — educational, not lending advice.
 */

export interface AmortizationInput {
  principal: number;
  annualRatePercent: number;
  termMonths: number;
  extraMonthly?: number;
}

export interface AmortizationResult {
  monthlyPi: number;
  totalInterestBase: number;
  totalInterestWithExtra: number;
  monthsSaved: number;
  payoffMonthsWithExtra: number;
  schedulePreview: { month: number; interest: number; principal: number; balance: number }[];
}

export function monthlyPayment(
  principal: number,
  annualRatePercent: number,
  termMonths: number
): number {
  if (principal <= 0 || termMonths <= 0) return 0;
  const r = annualRatePercent / 100 / 12;
  if (r === 0) return principal / termMonths;
  return (
    (principal * r * Math.pow(1 + r, termMonths)) /
    (Math.pow(1 + r, termMonths) - 1)
  );
}

export function amortize(input: AmortizationInput): AmortizationResult {
  const pi = monthlyPayment(
    input.principal,
    input.annualRatePercent,
    input.termMonths
  );
  const extra = input.extraMonthly ?? 0;
  const r = input.annualRatePercent / 100 / 12;

  let balance = input.principal;
  let totalInterest = 0;
  let month = 0;
  const schedulePreview: AmortizationResult['schedulePreview'] = [];

  while (balance > 0.01 && month < input.termMonths + 600) {
    month++;
    const interest = r === 0 ? 0 : balance * r;
    let principalPaid = pi - interest + extra;
    if (principalPaid > balance) principalPaid = balance;
    balance -= principalPaid;
    totalInterest += interest;
    if (month <= 12 || balance <= 0.01) {
      schedulePreview.push({
        month,
        interest: round2(interest),
        principal: round2(principalPaid),
        balance: round2(Math.max(0, balance)),
      });
    }
  }

  // Base total interest (no extra)
  let bal2 = input.principal;
  let baseInterest = 0;
  for (let m = 0; m < input.termMonths && bal2 > 0.01; m++) {
    const interest = r === 0 ? 0 : bal2 * r;
    let principalPaid = pi - interest;
    if (principalPaid > bal2) principalPaid = bal2;
    bal2 -= principalPaid;
    baseInterest += interest;
  }

  return {
    monthlyPi: round2(pi),
    totalInterestBase: round2(baseInterest),
    totalInterestWithExtra: round2(totalInterest),
    monthsSaved: Math.max(0, input.termMonths - month),
    payoffMonthsWithExtra: month,
    schedulePreview,
  };
}

export function equityEstimate(
  homeValue: number,
  remainingPrincipal: number
): { equity: number; ltv: number } {
  const equity = homeValue - remainingPrincipal;
  const ltv = homeValue > 0 ? (remainingPrincipal / homeValue) * 100 : 0;
  return { equity: round2(equity), ltv: round2(ltv) };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
