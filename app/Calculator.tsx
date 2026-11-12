"use client";

import { useState } from "react";
import { CUT_PERCENTS, breakevenRow, dailyVacancyCost, netGain } from "@/lib/breakeven";
import { money, moneyCents, num, pct } from "@/lib/format";

type Props = { rent: number };

export default function Calculator({ rent }: Props) {
  const maxNeeded = Math.max(...CUT_PERCENTS.map((c) => breakevenRow(rent, c).daysSoonerNeeded));
  const sliderMax = Math.ceil(maxNeeded * 2);

  const [cut, setCut] = useState<number>(CUT_PERCENTS[2] ?? 0);
  const [days, setDays] = useState<number>(0);

  const row = breakevenRow(rent, cut);
  const gained = days * dailyVacancyCost(rent);
  const net = netGain(rent, cut, days);

  return (
    <div className="calc">
      <label className="calc-field">
        <span>Cut to test</span>
        <select value={cut} onChange={(e) => setCut(Number(e.target.value))}>
          {CUT_PERCENTS.map((c) => (
            <option key={c} value={c}>
              {pct(c)} (new rent {money(breakevenRow(rent, c).newRent)})
            </option>
          ))}
        </select>
      </label>

      <label className="calc-field">
        <span>
          Days sooner I believe a cut would lease: <strong>{days}</strong>
        </span>
        <input
          type="range"
          min={0}
          max={sliderMax}
          step={1}
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        />
      </label>

      <dl className="calc-out">
        <div>
          <dt>Rent gained by leasing {days} days sooner</dt>
          <dd>
            {money(gained)} ({days} x {moneyCents(dailyVacancyCost(rent))} per day)
          </dd>
        </div>
        <div>
          <dt>Rent given up over 12 months at a {pct(cut)} cut</dt>
          <dd>{money(row.rentGivenUp)}</dd>
        </div>
        <div>
          <dt>Days sooner needed to break even</dt>
          <dd>{num(row.daysSoonerNeeded, 1)}</dd>
        </div>
        <div className={net >= 0 ? "net gain" : "net loss"}>
          <dt>Net {net >= 0 ? "gain" : "loss"}</dt>
          <dd>{money(net)}</dd>
        </div>
      </dl>
      <p className="small">
        The number of days is your own belief. Nothing in the data predicts it.
      </p>
    </div>
  );
}
