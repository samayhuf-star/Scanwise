# Scanwise pricing decision

Checked 2026-11-16 against US App Store listings (in-app purchase lists). Prices change, so re-check before changing ours.

## Competitor comparison

| App | Model | Weekly | Monthly | Yearly | Trial |
|---|---|---|---|---|---|
| QR Code Scanner: Fast Reader (id6670452249) | Subscription | $6.99 | $14.99 | $29.99 | Yes (weekly) |
| QR Code Scanner and Reader App (id6747435425) | Subscription | $6.99 | - | $29.99 | Yes (weekly) |
| QR Code Generator Pro (id6736859501) | Sub + lifetime | $4.99 | $12.99 | $39.99 | - (lifetime $59.99) |
| Air Apps QR Code Reader (id1226650677) | Subscription | $7.99 | $9.99 | $69.99 | - |
| Qr-Code Scanner & Creator (id1493503204) | Subscription | $7.99 | $9.99 | $19.99 or $39.99 | 3 days |
| QR Code Reader: QR Scanner (id1580877336) | Subscription | - | $5.99 | $24.99 | 3 days |
| QR Code Scanner - QR Reader (id1542555509) | Subscription | $7.99 | $19.99 | $35.99 | 3 days |
| QR Code Reader (TinyLab, id1200318119) | Mixed tiers | - | $7.99 to $14.99 | $29.99 to $51.99 | 3 days |

## Pattern

Weekly plans ($5 to $13) with trials dominate this category. Reviews of these apps repeatedly say users were charged unexpectedly, and some call the apps cash grabs. Yearly prices cluster at $20 to $40.

## Decision

| Item | Choice | Reason |
|---|---|---|
| Model | Free scanner plus Pro subscription | Matches the free-tier promise (scan, Safe-Link Shield, all QR types, Code 128) |
| Monthly | $2.99 | Far below the $6 to $20 competitor monthly range |
| Yearly | $19.99 | Bottom of the $20 to $40 yearly cluster |
| Trial | 7 days, with the price shown before the trial starts | Honest alternative to the 3-day trap trials |
| Weekly plan | None | Weekly plans drive the complaints; this is a positioning choice |
| Experiment | 50/50 on the `default` offering vs a variant with yearly emphasis ($24.99 yearly, $3.99 monthly) | Judge on revenue per install and trial-to-paid after at least 28 days |

Existing App Store Connect products (Scanwise Pro Monthly and Yearly) already use $2.99 and $19.99 with the 7-day trial, so code, legal copy and the dashboard should match them.

Local pricing: after launch, lower prices in low-purchasing-power markets (India, Indonesia, Brazil, Turkey, Mexico, Egypt, Pakistan, Nigeria, Philippines, Vietnam) from RevenueCat chart data, not guesses.
