# Rent cut decision: 1620 S 22nd St, Philadelphia, PA 19145

Live tool: https://rent-decision-tool.vercel.app
Repo: https://github.com/BryanSJamesDev/rent-decision-tool

## The decision

The unit is a 4-bed rowhouse that has been vacant 70 days at $2,015. The landlord's question is whether to cut the asking rent, and by how much.

The tool does not predict demand, because nothing in the data can. Instead it turns the question into one number the landlord can judge. A cut of c gives up 12 x R x c in rent over a 12-month lease, and a day vacant costs R / 30 ($67.17). So a cut must lease the unit at least 360 x c days sooner to pay for itself:

| Cut | New rent | Days sooner needed |
|---|---|---|
| 2.5% | $1,965 | 9 |
| 5% | $1,914 | 18 |
| 7.5% | $1,864 | 27 |
| 10% | $1,814 | 36 |

The landlord enters how many days sooner they believe a cut would lease the unit, and the tool shows the net gain or loss. The 70 days already vacant (about $4,702) is a sunk cost and is shown as one, so it does not drive the decision.

The comps give context but not an answer. Five comps ask $1,850 to $2,500 (median $2,200), so the subject is 8.4% below the median. Only one comp has 4 bedrooms, and two of the five have already cut their price. The tool states these facts and does not tell the landlord to cut or hold.

My read: a small cut of about 2.5% ($1,965) is the defensible move. It needs the unit to lease only 9 days sooner to pay for itself, while a deeper cut needs a belief the data cannot support, and the asking rent is already below the median of the comps and below the one other 4-bed. This is a judgment, not something the tool proves. If the landlord does not believe a cut would speed up leasing, holding and checking for other causes is the better call.

## How conflicting sources were handled

Every field in data/reconciled.json keeps all source values, the chosen value, a confidence level, and the reason.

- **Bathrooms** (Zillow 2, OPA 1): chose Zillow at low confidence. It may include a renovation that OPA lacks. It does not drive the decision, since comps are filtered on bedrooms.
- **Square feet** (Zillow 1,504, OPA 1,596): chose the listing figure, because OPA counts improvement area and the comps are also listing-based.
- **Last sale date** (Zillow 2020-12-04, OPA 2020-11-13): chose OPA, the official record. The price matches.
- **2019 sale ($415,470):** excluded. It is about 2x the 2020 price and is likely not an arms-length sale.
- **HUD fair market rent** (two aggregators, $2,423 vs $2,120): used neither. Not in the calculation.
- **Days on market:** the data says 70, but the 9/2/2026 listing date gives 71. The page uses 70 and flags the gap.
- **Comps:** excluded 2522 Alter St (46% larger, price includes required fees, free-utilities incentive). Kept 5628 Kingsessing Ave with a caveat, since it is a lower-rent neighborhood with 1 bath.
- **Voucher limits:** the PHA 4BR standard for 19145 is $3,120, well above the asking rent, so it is unlikely to be what holds the unit vacant. Inspection and rent reasonableness review cannot be ruled out.

## What I needed but could not get

- Tenant demand: showings, inquiries, or applications for this unit.
- Actual leased rents. All comps are asking rents, and a removed listing does not confirm a lease.
- Interior condition, renovations, and permit history.
- The landlord's carrying costs, mortgage, and target return.
- Tract-level 4BR rent (the Census API needs a key).

The owner is an out-of-state LLC, not a small landlord, so its behavior is one example and not the rule. The model also ignores seasonality (November is slow), the time value of money, and turnover costs.