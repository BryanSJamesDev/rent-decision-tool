// Breakeven model. R is the asking rent from reconciled.json.
// Daily cost of vacancy is R / 30. A cut of c (as a fraction) gives up 12 * R * c
// over a 12-month lease, so the cut must lease at least 360 * c days sooner to break even.

export const DAYS_PER_MONTH = 30;
export const LEASE_MONTHS = 12;
export const CUT_PERCENTS = [0, 2.5, 5, 7.5, 10];

export type BreakevenRow = {
  cutPercent: number;
  newRent: number;
  monthlyReduction: number;
  rentGivenUp: number;
  daysSoonerNeeded: number;
};

export function dailyVacancyCost(rent: number): number {
  return rent / DAYS_PER_MONTH;
}

export function breakevenRow(rent: number, cutPercent: number): BreakevenRow {
  const c = cutPercent / 100;
  return {
    cutPercent,
    newRent: rent * (1 - c),
    monthlyReduction: rent * c,
    rentGivenUp: LEASE_MONTHS * rent * c,
    daysSoonerNeeded: LEASE_MONTHS * DAYS_PER_MONTH * c,
  };
}

/** Rent gained by leasing `daysSooner` days earlier, minus rent given up by the cut. */
export function netGain(rent: number, cutPercent: number, daysSooner: number): number {
  return daysSooner * dailyVacancyCost(rent) - breakevenRow(rent, cutPercent).rentGivenUp;
}
