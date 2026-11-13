#!/usr/bin/env bash
# Scanwise prepare step for .github/workflows/sim-qa.yml (runs after pod install, before the build).
# 1. Turns on QA mode for this simulator build only (.env.local on the CI runner, never committed).
# 2. Adds the ScanwiseQATests UI test target and wires qa/Scanwise.storekit into the shared scheme.
# Only touches the CI checkout and its generated ios/ folder. EAS never runs this.
set -euo pipefail
mkdir -p "$OUT"
echo "EXPO_PUBLIC_SCANWISE_QA=1" > .env.local
echo "qa env: $(cat .env.local)" | tee -a "$OUT/prepare.log"
gem list -i xcodeproj >/dev/null 2>&1 || gem install xcodeproj --no-document
ruby qa/scripts/prepare-xcode-qa.rb | tee -a "$OUT/prepare.log"
grep -n "StoreKitConfigurationFileReference" -A1 ios/*.xcodeproj/xcshareddata/xcschemes/*.xcscheme | tee -a "$OUT/prepare.log"
