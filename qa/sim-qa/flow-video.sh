#!/usr/bin/env bash
# Review-video wrapper for .github/workflows/sim-qa.yml (flow_script input).
# Records the simulator screen with `xcrun simctl io recordVideo` while the normal Scanwise flow runs
# (launch, scan, Safe-Link Shield, Create, Pro gate, paywall prices and trial, StoreKit test purchase, Restore),
# with a short pause on every screen. The video lands in $OUT/scanwise-review-flow.mp4.
set -uo pipefail
: "${UDID:?}" "${OUT:?}"
mkdir -p "$OUT"
VIDEO="$OUT/scanwise-review-flow.mp4"

# Start from the Home Screen so the recording shows the app being launched.
xcrun simctl terminate "$UDID" "${BUNDLE_ID:-com.samayhuf.scanwise}" >/dev/null 2>&1 || true

xcrun simctl io "$UDID" recordVideo --codec=h264 --force "$VIDEO" > "$OUT/record.log" 2>&1 &
REC=$!
sleep 3

stop_rec() {
  if kill -0 "$REC" 2>/dev/null; then
    kill -INT "$REC" 2>/dev/null || true
    for _ in $(seq 1 30); do kill -0 "$REC" 2>/dev/null || break; sleep 1; done
  fi
  ls -la "$VIDEO" 2>/dev/null || echo "no video written"
}
trap stop_rec EXIT

export TEST_RUNNER_SIM_QA_SLOW=1
bash "$(dirname "$0")/flow.sh"
RC=$?
sleep 2
exit $RC
