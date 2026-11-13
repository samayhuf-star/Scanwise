#!/usr/bin/env bash
# Scanwise flow for .github/workflows/sim-qa.yml.
# Env from the workflow: UDID, BUNDLE_ID, SCHEME, WORKSPACE, DERIVED_DATA, OUT.
# Seeds a QR image into the photo library, pre-grants Photos and Camera, installs the app, then runs the
# ScanwiseQATests XCUITest: launch (no paywall), scan from photo (QA deep link fallback), open in Safari, Safe-Link Shield,
# generator, Pro gate, paywall prices and 7-day trial, StoreKit test purchase, Restore. Screenshots land in $OUT.
set -euo pipefail
: "${UDID:?}" "${BUNDLE_ID:?}" "${SCHEME:?}" "${WORKSPACE:?}" "${DERIVED_DATA:?}" "${OUT:?}"
mkdir -p "$OUT"
FIX_DIR="${FIX_DIR:-$PWD/qa/fixtures}"

echo "==> QR image"
node qa/scripts/make-qr-fixtures.mjs "$FIX_DIR" | tee "$OUT/seed.txt"
xcrun simctl addmedia "$UDID" "$FIX_DIR"/*.png
echo "photos seeded: $(ls "$FIX_DIR"/*.png | wc -l | tr -d ' ')" | tee -a "$OUT/seed.txt"

echo "==> Install and grant"
APP=$(find "$DERIVED_DATA/Build/Products" -maxdepth 2 -name "$SCHEME.app" -path '*Release-iphonesimulator*' | head -n1)
echo "app: $APP"
xcrun simctl install "$UDID" "$APP"
for s in photos camera; do xcrun simctl privacy "$UDID" grant "$s" "$BUNDLE_ID" || true; done

echo "==> XCUITest flow"
mkdir -p /tmp/scanwise-sk && cp qa/Scanwise.storekit /tmp/scanwise-sk/Scanwise.storekit
set +e
TEST_RUNNER_SIM_QA_OUT="$OUT" TEST_RUNNER_STOREKIT_CONFIG="/tmp/scanwise-sk/Scanwise.storekit" \
xcodebuild test-without-building -workspace "$WORKSPACE" -scheme "$SCHEME" -configuration Release \
  -destination "platform=iOS Simulator,id=$UDID" -derivedDataPath "$DERIVED_DATA" \
  -resultBundlePath "$OUT/flow.xcresult" -only-testing:ScanwiseQATests/SimQATests/testScanwiseFlow \
  > "$OUT/xcodebuild-test.log" 2>&1
RC=$?
set -e
tail -n 60 "$OUT/xcodebuild-test.log"
grep "\[scanwise-qa\]" "$OUT/xcodebuild-test.log" || true

mkdir -p "$OUT/attachments"
xcrun xcresulttool export attachments --path "$OUT/flow.xcresult" --output-path "$OUT/attachments" >/dev/null 2>&1 || true

python3 - "$OUT" "$RC" <<'PY'
import json, os, sys
out, rc = sys.argv[1], int(sys.argv[2])
p = os.path.join(out, "results.json")
steps = json.load(open(p)).get("steps", []) if os.path.exists(p) else []
lines = ["# Scanwise iOS Simulator QA", "", f"xcodebuild test exit: {rc}", "", "| Step | Result | Detail |", "| --- | --- | --- |"]
for s in steps:
    lines.append(f"| {s['step']}. {s['name']} | {'PASS' if s['pass'] else 'FAIL'} | {str(s['detail']).replace('|', '/')} |")
if not steps:
    lines.append("| none | FAIL | results.json missing |")
open(os.path.join(out, "summary.md"), "w").write("\n".join(lines) + "\n")
print("\n".join(lines))
failed = [s for s in steps if not s.get("pass")]
if not steps or failed or rc != 0:
    raise SystemExit(rc if rc else 1)
PY
exit $?
