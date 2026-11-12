I chose the property, collected the source material, and made the final decisions about what to include. I used Claude to help plan the analysis, review my Zillow and county record screenshots, draft `reconciled.json` and `comps.csv`, and refine the build instructions. Claude Code in Cursor saved the data files as provided and implemented the Next.js app. I reviewed the output, verified the calculator, and directed fixes. I handled every commit and push myself and take responsibility for the final submission.

### How I directed the build

- **Source handling.** I instructed Claude Code to record sources and retrieval dates, mark missing values as unknown, and preserve conflicting values. The fact sheet shows where sources disagree, which value the analysis uses, and why.
- **Comparable listings.** I agreed with Claude’s suggestion to exclude 2522 Alter St after reviewing the listing. It was about 46% larger, its advertised rent included required fees, and it offered free utilities. I accepted Claude’s suggestion to keep 5628 Kingsessing Ave with caveats about its different neighborhood and single bathroom. I asked Claude Code to keep excluded listings visible with their reasons and leave them out of the statistics.
- **Breakeven calculator.** Claude proposed using breakeven math to evaluate a rent cut. The build instructions specified a 12-month lease, the formula, the cut percentages, and a slider for the landlord’s estimate of how much sooner the unit would lease. I adopted Claude’s suggestion to discuss a 2.5% cut in the summary. Under the model, it breaks even at nine days sooner. The listing data cannot establish whether the cut would actually save nine days.

### Where I challenged or revised the output

- **Voucher payment standard.** Claude put ZIP code 19145 in Group 3 and reported a four-bedroom standard of $2,690. I uploaded the Philadelphia Housing Authority PDF, which put the ZIP in Group 4 at $3,120. The data file was corrected, and I told Claude Code to replace only that record.
- **Comparable selection.** Claude initially suggested looking for four-bedroom rentals in specific ZIP codes, then proceeded with mostly three-bedroom listings. I pointed out the inconsistency. The app discloses that only one of the five included comparables has four bedrooms. I also asked it to omit average time on market because two listings were under 10 days old.
- **Voucher claim.** Claude initially ruled out voucher funding as a cause of vacancy. Claude Code flagged that the public data could not establish the cause. I directed a wording change that acknowledged the uncertainty around inspection delays and rent reasonableness review.
- **Screenshot scope.** Claude asked me to save more screenshots for each listing. I pushed back and kept the listing and price-history screenshots I needed to check the comparable figures.

### What I verified

I checked the comparable figures against my Zillow screenshots. On the live calculator, I tested a 5% cut with the lease starting 30 days sooner. It showed the expected $806 modeled gain, based on $2,015 in recovered rent minus $1,209 given up over the lease.

A local browser review surfaced three issues with year formatting, missing-value labels on reference rows, and the owner description. I directed Claude Code to fix them and rerun the build. The build passed.