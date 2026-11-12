# rent-decision-tool

A breakeven calculator for one decision: whether to cut the asking rent on 1620 S 22nd St, Philadelphia, PA 19145 (vacant 70 days at $2,015), and by how much.

Live tool: https://rent-decision-tool.vercel.app

## Read first

- [SUMMARY.md](SUMMARY.md): the one-page write-up (decision and reasoning, how conflicting sources were handled, what I could not get)
- [AI_LOG.md](AI_LOG.md): how I used AI, including where I challenged or corrected it

## What the tool does

It does not predict demand. It shows how many days sooner a rent cut must lease the unit to pay for itself (360 x cut %), and the landlord enters how many days sooner they believe it would. It also shows the reconciled property facts and the comparable listings it was built on.

## Data

- `data/reconciled.json`: each property field with the value from every source, the chosen value, a confidence level, and the reason
- `data/raw/comps.csv`: the comparable listings
- `data/raw/`: the source screenshots and the PHA payment standard PDF

## Run locally

    npm install
    npm run dev

Then open http://localhost:3000. Data is read at build time.

## Stack

Next.js 15, TypeScript, deployed on Vercel.
