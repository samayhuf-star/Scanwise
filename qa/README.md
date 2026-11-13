# Scanwise iOS simulator QA

Same route as Klenzer's `klenzer/sim-qa`: the generic workflow `.github/workflows/sim-qa.yml`
(manual `workflow_dispatch` only) with `prepare_script=qa/sim-qa/prepare.sh` and `flow_script=qa/sim-qa/flow.sh`.

- `prepare.sh` writes `.env.local` with `EXPO_PUBLIC_SCANWISE_QA=1` (QA deep links on, CI checkout only), then
  `qa/scripts/prepare-xcode-qa.rb` adds the `ScanwiseQATests` UI test target and wires `qa/Scanwise.storekit`
  into the shared scheme (Run and Test).
- `flow.sh` seeds a QR image into the simulator photo library, grants Photos and Camera, installs the Release
  simulator app and runs `ScanwiseQATests/SimQATests/testScanwiseFlow`.

Steps: 1 launch on Scan with no paywall, 2 scan the seeded QR from the photo picker (falls back to
`scanwise://qa/scan?raw=` which runs the same scan handler), 3 Safe-Link Shield flags a risky link,
4 QR generator, 5 Barcode opens the paywall and X closes it, 6 paywall prices $2.99 and $9.99 with the 7-day
trial CTA, X, Restore, Terms and Privacy, 7 StoreKit test purchase (monthly), 8 Pro unlocks barcodes,
9 Restore purchases from Settings. Screenshots, `results.json` and `summary.md` go to `$OUT`.

The `.storekit` file is never an app resource and is not referenced from app.json or eas.json, so EAS and
TestFlight builds are unaffected. QA deep links do nothing unless `EXPO_PUBLIC_SCANWISE_QA=1` was set at build time.
A real-device Sandbox purchase is still needed before App Review.
