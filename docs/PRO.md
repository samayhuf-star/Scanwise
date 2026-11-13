# Scanwise Pro

Auto-renewable subscription, one group: **Scanwise Pro**. StoreKit 2 through `expo-iap`, no RevenueCat, no server.

| Product id | Period | US price (ASC) | Intro offer |
| --- | --- | --- | --- |
| `com.samayhuf.scanwise.pro.monthly` | 1 month | $2.99 | 7-day free trial |
| `com.samayhuf.scanwise.pro.yearly` | 1 year | $19.99 | 7-day free trial |

Ids live in `src/lib/pro.ts` only. The UI shows the store's localized `displayPrice`, never a hard-coded price.
The only file with prices is `qa/Scanwise.storekit` (simulator test config, not shipped).

## Free forever

- Camera scanning of every supported QR and barcode type, and scanning from a photo
- Safe-Link Shield on every scan
- QR generator for Link, Text, Wi-Fi, Contact, Email, Phone and SMS, black on white, share as image or copy
- History: the newest 20 entries plus every starred entry, with search and filters

## Pro

- Barcode generator (Code 128, EAN-13, EAN-8, UPC-A, Code 39, ITF-14)
- UPI payment QR codes
- Custom code colours (navy, green, purple)
- Unlimited history (older entries stay on the device for free users too, hidden until Pro)
- Batch QR codes: one code per line (up to 30), shared as one image sheet
- History export as CSV

No lifetime option (Samay, 13 Nov 2026).

## Not a hard paywall

The app opens on Scan. The paywall opens only when a Pro feature is tapped (PRO badge) or from Go Pro
(Settings, and the note under Create). It has a visible X, Restore purchases, Terms of Use, Privacy Policy,
Apple EULA links and the auto-renew disclosure. The CTA reads `Try 7 days free, then <price>/month` (or `/year`)
only when expo-iap reports a free-trial intro offer and `isEligibleForIntroOfferIOS` is true; otherwise
`Subscribe for <price>/month`. Settings has its own Restore purchases entry and shows Plan: Free or Plan: Pro.

## Review notes (draft for ASC)

Scanwise is fully usable for free: scanning, Safe-Link Shield, QR creation and recent history need no purchase.
Scanwise Pro (monthly or yearly, each with a 7-day free trial for new subscribers) unlocks the barcode generator,
UPI QR codes, custom colours, batch QR codes, unlimited history and CSV export. To see the paywall, tap
Settings > Go Pro, or tap Barcode or Batch on the Create tab. Restore purchases is on the paywall and in Settings.
No account or sign-in is required.

App Review contact: Samay Vashsht, +91 9953710111, samayhuf@gmail.com.

## Legal links

`https://samayhuf-star.github.io/app-legal/scanwise/privacy.html` and `terms.html`. These pages must be
published in `app-legal` before submission (they returned 404 when this branch was written).
