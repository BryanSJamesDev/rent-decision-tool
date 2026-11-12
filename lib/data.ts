// Loads the two data files at build time. Nothing here fetches at runtime.
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";

export const RECONCILED_PATH = "data/reconciled.json";
export const COMPS_PATH = "data/raw/comps.csv";

// ---------- reconciled.json ----------

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export type Entry = { [key: string]: Json };

export type Reconciled = {
  property: { address: string; opa_parcel: string; retrieved: string };
  fields: { [name: string]: Entry };
  external: { [name: string]: Entry };
  not_obtainable: string[];
};

function readFile(rel: string): string {
  return fs.readFileSync(path.join(process.cwd(), rel), "utf8");
}

export function loadReconciled(): Reconciled {
  return JSON.parse(readFile(RECONCILED_PATH)) as Reconciled;
}

/** Reads a required number from fields.<name>.chosen and fails the build if it is missing. */
export function chosenNumber(rec: Reconciled, name: string): number {
  const v = rec.fields[name]?.chosen;
  if (typeof v !== "number") {
    throw new Error(`${RECONCILED_PATH}: fields.${name}.chosen must be a number`);
  }
  return v;
}

// ---------- comps.csv ----------

/** One row of comps.csv. Keys match the CSV header exactly. */
export type CompRow = {
  id: string;
  address: string;
  zip: string;
  rent: string;
  beds: string;
  baths: string;
  sqft: string;
  type: string;
  listed: string;
  days_on_market_as_of_2026_11_12: string;
  price_cuts: string;
  include: string;
  note: string;
  url: string;
};

const HEADER: (keyof CompRow)[] = [
  "id", "address", "zip", "rent", "beds", "baths", "sqft", "type", "listed",
  "days_on_market_as_of_2026_11_12", "price_cuts", "include", "note", "url",
];

export type PriceCut = { percent: number; date: string };

export type Comp = {
  id: string;
  address: string;
  zip: string;
  rent: number;
  beds: number;
  baths: number;
  sqft: number;
  type: string;
  listed: string;
  daysOnMarket: number;
  priceCutsRaw: string;
  priceCuts: PriceCut[];
  include: boolean;
  note: string;
  url: string;
};

function toNumber(value: string, col: string, id: string): number {
  const n = Number(value);
  if (value.trim() === "" || !Number.isFinite(n)) {
    throw new Error(`${COMPS_PATH}: row id ${id}, column ${col} is not a number: "${value}"`);
  }
  return n;
}

// price_cuts looks like "0" or "1 (4.3% on 2026-11-02)".
function parseCuts(raw: string): PriceCut[] {
  const out: PriceCut[] = [];
  for (const m of raw.matchAll(/([\d.]+)% on (\d{4}-\d{2}-\d{2})/g)) {
    out.push({ percent: Number(m[1]), date: m[2] });
  }
  return out;
}

export function loadComps(): Comp[] {
  const parsed = Papa.parse<CompRow>(readFile(COMPS_PATH), {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length > 0) {
    throw new Error(`${COMPS_PATH}: ${parsed.errors.map((e) => e.message).join("; ")}`);
  }
  const fields = parsed.meta.fields ?? [];
  const missing = HEADER.filter((h) => !fields.includes(h));
  if (missing.length > 0) {
    throw new Error(`${COMPS_PATH}: missing columns ${missing.join(", ")}`);
  }

  return parsed.data.map((r) => {
    const inc = r.include.trim().toLowerCase();
    if (inc !== "true" && inc !== "false") {
      throw new Error(`${COMPS_PATH}: row id ${r.id}, include must be true or false`);
    }
    return {
      id: r.id,
      address: r.address,
      zip: r.zip,
      rent: toNumber(r.rent, "rent", r.id),
      beds: toNumber(r.beds, "beds", r.id),
      baths: toNumber(r.baths, "baths", r.id),
      sqft: toNumber(r.sqft, "sqft", r.id),
      type: r.type,
      listed: r.listed,
      daysOnMarket: toNumber(r.days_on_market_as_of_2026_11_12, "days_on_market_as_of_2026_11_12", r.id),
      priceCutsRaw: r.price_cuts,
      priceCuts: parseCuts(r.price_cuts),
      include: inc === "true",
      note: r.note,
      url: r.url,
    };
  });
}

/** The as-of date is taken from the days on market column name in the CSV header. */
export const COMPS_AS_OF = "days_on_market_as_of_2026_11_12".slice(-10).replace(/_/g, "-");

// ---------- small helpers ----------

export function median(xs: number[]): number {
  if (xs.length === 0) throw new Error("median of empty list");
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function daysBetween(fromIso: string, toIso: string): number {
  const ms = Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}
