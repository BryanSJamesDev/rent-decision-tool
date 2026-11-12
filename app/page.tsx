import Calculator from "./Calculator";
import {
  COMPS_AS_OF,
  COMPS_PATH,
  RECONCILED_PATH,
  chosenNumber,
  daysBetween,
  loadComps,
  loadReconciled,
  median,
  type Entry,
  type Json,
} from "@/lib/data";
import { CUT_PERCENTS, breakevenRow, dailyVacancyCost } from "@/lib/breakeven";
import { money, moneyCents, num, pct } from "@/lib/format";

export const dynamic = "force-static";

// Comps listed fewer than this many days ago are too new to say anything about time on market.
const FRESH_DAYS = 10;

// Numeric fields that are counts, not dollars. Every other number is shown as dollars.
const NON_MONEY = new Set(["days_on_market", "bedrooms", "bathrooms", "square_feet", "year_built"]);

// Keys that describe an entry rather than hold a value.
const META_KEYS = new Set(["values", "chosen", "confidence", "conflict", "reason", "note", "source", "retrieved"]);

function show(field: string, v: Json | undefined): string {
  if (v === undefined) return "not recorded";
  if (v === null) return "none chosen";
  if (typeof v === "number" && field === "year_built") return String(v);
  if (typeof v === "number") return NON_MONEY.has(field) ? num(v, Number.isInteger(v) ? 0 : 1) : money(v);
  if (typeof v === "string" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map((x) => show(field, x)).join(", ");
  return Object.entries(v)
    .map(([k, x]) => `${k} ${k === "price" ? money(Number(x)) : show(field, x)}`)
    .join(", ");
}

/** Source values of an entry. Uses `values` when present, otherwise any non-meta keys. */
function sourceValues(entry: Entry): [string, Json][] {
  const vals = entry.values;
  if (vals && typeof vals === "object" && !Array.isArray(vals)) return Object.entries(vals);
  return Object.entries(entry).filter(([k]) => !META_KEYS.has(k));
}

function FactRow({
  name,
  entry,
  retrievedFallback,
  missingLabel = "not recorded",
}: {
  name: string;
  entry: Entry;
  retrievedFallback: string;
  missingLabel?: string;
}) {
  const conflict = entry.conflict === true;
  const retrieved = typeof entry.retrieved === "string" ? entry.retrieved : retrievedFallback;
  return (
    <tr className={conflict ? "conflict" : undefined}>
      <td>
        <strong>{name}</strong>
        {conflict && <span className="badge">Conflict</span>}
        {typeof entry.source === "string" && <div className="small">Source: {entry.source}</div>}
        <div className="small">Retrieved: {retrieved}</div>
      </td>
      <td>
        <ul className="plain">
          {sourceValues(entry).map(([src, v]) => (
            <li key={src}>
              <span className="src">{src}:</span> {show(name, v)}
            </li>
          ))}
        </ul>
      </td>
      <td>{entry.chosen === undefined ? missingLabel : show(name, entry.chosen)}</td>
      <td>{typeof entry.confidence === "string" ? entry.confidence : missingLabel}</td>
      <td>{String(entry.reason ?? entry.note ?? "not recorded")}</td>
    </tr>
  );
}

export default function Page() {
  const rec = loadReconciled();
  const comps = loadComps();

  const R = chosenNumber(rec, "asking_rent");
  const dom = chosenNumber(rec, "days_on_market");
  const beds = chosenNumber(rec, "bedrooms");

  const included = comps.filter((c) => c.include);
  const excluded = comps.filter((c) => !c.include);
  const rents = included.map((c) => c.rent);
  const med = median(rents);
  const minRent = Math.min(...rents);
  const maxRent = Math.max(...rents);
  const vsMedian = ((R - med) / med) * 100;

  const cheaper = included.filter((c) => c.rent < R);
  const sameBeds = included.filter((c) => c.beds === beds);
  const fresh = included.filter((c) => c.daysOnMarket < FRESH_DAYS);
  const cutters = included.filter((c) => c.priceCuts.length > 0);
  const staleNoCut = included.filter((c) => c.daysOnMarket >= FRESH_DAYS && c.priceCuts.length === 0);
  const excludedCutters = excluded.filter((c) => c.priceCuts.length > 0);

  const rows = CUT_PERCENTS.map((c) => breakevenRow(R, c));
  const sunk = dom * dailyVacancyCost(R);

  const limitations = [
    "Comp rents are asking rents, not leased rents.",
    "A removed listing does not confirm a lease.",
    `Small sample: ${included.length} included comps, and ${sameBeds.length} of them ${sameBeds.length === 1 ? "has" : "have"} ${beds} bedrooms like the subject.`,
    "November is a slow leasing season. Seasonality is not modeled.",
    "There is no inquiry or showing data for this unit.",
    "The landlord's costs and targets are unknown.",
    "The model ignores the time value of money and turnover costs.",
  ];

  // Cross-check the subject's days on market against the listing date stated in its reason text.
  const domReason = String(rec.fields.days_on_market?.reason ?? "");
  const listedMatch = domReason.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (listedMatch) {
    const [, m, d, y] = listedMatch;
    const listedIso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    const fromDate = daysBetween(listedIso, COMPS_AS_OF);
    if (fromDate !== dom) {
      const sameDay = comps.filter((c) => c.listed === listedIso);
      limitations.push(
        `Conflict on days on market: ${RECONCILED_PATH} gives ${dom} days, but the listing date in its reason text (${listedMatch[0]}) gives ${fromDate} days as of ${COMPS_AS_OF}.` +
          (sameDay.length > 0
            ? ` ${sameDay.map((c) => `Comp ${c.id}, listed the same day, shows ${c.daysOnMarket} days`).join(". ")}.`
            : "") +
          ` This page uses ${dom}.`,
      );
    }
  }

  return (
    <main>
      <h1>Rent cut decision: {rec.property.address}</h1>
      <p className="small">
        OPA parcel {rec.property.opa_parcel}. Property facts retrieved {rec.property.retrieved} ({RECONCILED_PATH}).
        Comps from Zillow as of {COMPS_AS_OF} ({COMPS_PATH}).
      </p>

      {/* 1. Decision */}
      <section className="box decision">
        <h2>The decision</h2>
        <p className="question">
          This rental has been vacant {dom} days at {money(R)}. Should the landlord cut the rent, and by how much?
        </p>
        <p>
          This tool does not predict demand. It cannot say how much sooner a cut would lease the unit. It only shows
          what each cut costs and how much sooner it would need to lease to pay for itself.
        </p>
      </section>

      {/* 2. Fact sheet */}
      <section>
        <h2>Fact sheet</h2>
        <p className="small">
          One row per entry in {RECONCILED_PATH}. Rows marked Conflict have sources that disagree. All source values
          are shown.
        </p>
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Field</th>
                <th>Value by source</th>
                <th>Chosen</th>
                <th>Confidence</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(rec.fields).map(([name, entry]) => (
                <FactRow key={name} name={name} entry={entry} retrievedFallback={rec.property.retrieved} />
              ))}
              <tr className="group">
                <td colSpan={5}>External references</td>
              </tr>
              {Object.entries(rec.external).map(([name, entry]) => (
                <FactRow key={name} name={name} entry={entry} retrievedFallback="unknown" missingLabel="reference only" />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Comps */}
      <section>
        <h2>Comps</h2>
        <div className="stats">
          <div>
            <span className="label">Included comps</span>
            <span className="value">{included.length}</span>
          </div>
          <div>
            <span className="label">Median rent</span>
            <span className="value">{money(med)}</span>
          </div>
          <div>
            <span className="label">Min rent</span>
            <span className="value">{money(minRent)}</span>
          </div>
          <div>
            <span className="label">Max rent</span>
            <span className="value">{money(maxRent)}</span>
          </div>
          <div>
            <span className="label">Subject vs median</span>
            <span className="value">
              {pct(Math.abs(vsMedian))} {vsMedian < 0 ? "below" : vsMedian > 0 ? "above" : "at"}
            </span>
          </div>
        </div>
        <p className="small">
          Statistics use included comps only. No average time on market is shown because {fresh.length} included
          comps have been listed fewer than {FRESH_DAYS} days.
        </p>
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Address</th>
                <th>Rent</th>
                <th>Beds</th>
                <th>Baths</th>
                <th>Sq ft</th>
                <th>Type</th>
                <th>Listed</th>
                <th>Days on market</th>
                <th>Price cuts</th>
                <th>Status</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {comps.map((c) => (
                <tr key={c.id} className={c.include ? undefined : "excluded"}>
                  <td>{c.id}</td>
                  <td>
                    <a href={`https://${c.url.replace(/^https?:\/\//, "")}`} target="_blank" rel="noreferrer">
                      {c.address}
                    </a>{" "}
                    <span className="small">{c.zip}</span>
                  </td>
                  <td>{money(c.rent)}</td>
                  <td>{c.beds}</td>
                  <td>{c.baths}</td>
                  <td>{num(c.sqft)}</td>
                  <td>{c.type}</td>
                  <td>{c.listed}</td>
                  <td>{c.daysOnMarket}</td>
                  <td>{c.priceCutsRaw}</td>
                  <td>{c.include ? "Included" : "Excluded"}</td>
                  <td>{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Breakeven */}
      <section>
        <h2>Breakeven</h2>
        <p>
          Asking rent R = {money(R)}. One day vacant costs R / 30 = {moneyCents(dailyVacancyCost(R))}. A cut of c gives
          up 12 x R x c over a 12-month lease, so it must lease at least 360 x c days sooner than holding would to
          break even.
        </p>
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Cut</th>
                <th>New rent</th>
                <th>Monthly reduction</th>
                <th>12-month rent given up</th>
                <th>Days sooner needed to break even</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.cutPercent}>
                  <td>{pct(r.cutPercent)}</td>
                  <td>{money(r.newRent)}</td>
                  <td>{money(r.monthlyReduction)}</td>
                  <td>{money(r.rentGivenUp)}</td>
                  <td>{num(r.daysSoonerNeeded, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Calculator rent={R} />
        <p className="note">
          Sunk cost: the {dom} days already vacant cost about {money(sunk)} ({dom} x {moneyCents(dailyVacancyCost(R))}).
          That money is gone whatever the landlord does next, so it should not drive the decision.
        </p>
      </section>

      {/* 5. What the comps suggest */}
      <section>
        <h2>What the comps suggest</h2>
        <p className="small">Facts from {COMPS_PATH} only. This is not a recommendation to cut or hold.</p>
        <ul>
          <li>
            The {included.length} included comps ask {money(minRent)} to {money(maxRent)}, median {money(med)}. The
            subject at {money(R)} is {pct(Math.abs(vsMedian))} {vsMedian < 0 ? "below" : "above"} the median.
          </li>
          <li>
            {cheaper.length} of {included.length} included comps ask less than the subject
            {cheaper.length > 0 && `: ${cheaper.map((c) => `${c.address} (${money(c.rent)})`).join(", ")}`}.
          </li>
          <li>
            {sameBeds.length} of {included.length} included comps {sameBeds.length === 1 ? "has" : "have"} {beds}{" "}
            bedrooms like the subject
            {sameBeds.length > 0 && `: ${sameBeds.map((c) => `${c.address} (${money(c.rent)})`).join(", ")}`}.
          </li>
          <li>
            {cutters.length} of {included.length} included comps cut their price
            {cutters.length > 0 && ":"}
            {cutters.length > 0 && (
              <ul>
                {cutters.map((c) =>
                  c.priceCuts.map((cut) => (
                    <li key={`${c.id}-${cut.date}`}>
                      {c.address} cut {pct(cut.percent)} on {cut.date}, {daysBetween(c.listed, cut.date)} days after
                      listing. Now {money(c.rent)}, {c.daysOnMarket} days on market.
                    </li>
                  )),
                )}
              </ul>
            )}
          </li>
          {staleNoCut.length > 0 && (
            <li>
              Listed {FRESH_DAYS} or more days with no cut:{" "}
              {staleNoCut.map((c) => `${c.address} (${money(c.rent)}, ${c.daysOnMarket} days)`).join(", ")}.
            </li>
          )}
          <li>
            {fresh.length} included comps have been listed fewer than {FRESH_DAYS} days (
            {fresh.map((c) => `${c.address}, ${c.daysOnMarket} days`).join("; ")}), so they say nothing yet about
            time on market.
          </li>
          {excludedCutters.map((c) => (
            <li key={c.id}>
              Excluded comp {c.address} cut{" "}
              {c.priceCuts.map((cut) => `${pct(cut.percent)} on ${cut.date}`).join(", ")}. It is not counted above.
            </li>
          ))}
        </ul>
      </section>

      {/* 6. Limitations */}
      <section className="box limits">
        <h2>Limitations</h2>
        <ul>
          {limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <h3>Information I could not obtain</h3>
        <p className="small">From not_obtainable in {RECONCILED_PATH}.</p>
        <ul>
          {rec.not_obtainable.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
