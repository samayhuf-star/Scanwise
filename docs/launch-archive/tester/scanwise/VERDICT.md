# Scanwise 1.0.0 (5) — re-verification verdict

Written 13 November 2026, 7:33 PM Asia/Dhaka (BDT, UTC+6).
Scope: re-check of the 13 November 6:07 PM BDT FAIL fix list, plus a live GET-only App Store Connect readout. No EAS build, no ASC writes, no submission, no messages to other bots.

The earlier FAIL is superseded by this document.

**Overall: PASS, with App Privacy as the only open item. Do not treat this as a submit until App Privacy is confirmed published in the ASC web UI.**

All eight fix-list items were re-checked. Items 1–7 pass. Item 8 (App Privacy) remains UNVERIFIED because the public API cannot read it. The claimed “Data Not Collected” answer is consistent with the 0010405 `package.json` and app source (no analytics or crash SDKs).

---

## What was re-checked

| Item | Value |
|---|---|
| App | Scanwise (ASC `6833134833`, bundle `com.samayhuf.scanwise`) |
| iOS version | **1.0**, version id `05537646-a75a-4269-9b7f-ae09d04a8dd5`, still `PREPARE_FOR_SUBMISSION` |
| Attached build | `ddfd6d4a-720e-4c70-ad47-c159289853b7`, pre-release **1.0.0 (5)**, `VALID`, `usesNonExemptEncryption: false` |
| IPA / app source | **`0010405`** (`0010405380583c16390ace7f88ff3e2eec9e2d31`) |
| QA commit used for the new sim | **`2b0d5f7`** (`2b0d5f770257d5f128fe6c8ede11f0194f3f064c`), tip of `origin/scanwise/pro` |
| New sim run | AI-Samay/sim-qa-runner **43423025379**, workflow `sim-qa.yml`, conclusion **success**. Job: `Simulator QA (samayhuf-star/Scanwise@scanwise/pro)`. Started 13 Nov 2026, 12:11:07Z = **6:11 PM Asia/Dhaka**, finished 13:22:07Z = **7:22 PM Asia/Dhaka**. Local artifacts: `/workspace/scanwise-qa-run3/`. |
| Legal pages | app-legal **`8ff5920`** (`8ff5920bcb1e4ff492794f20567279bdd5a3e147`), “Set the Scanwise privacy and terms effective date to 13 November 2026.” Live Last-Modified 13 Nov 2026, 12:57:35 GMT = **6:57 PM Asia/Dhaka**. |

---

## Fix list re-check

### 1. Legal pages — PASS

Live pages, all HTTP 200:

- https://samayhuf-star.github.io/app-legal/scanwise/privacy.html — visible text **“Effective 13 November 2026”**. No `[EFFECTIVE DATE]`, `LAUNCH DAY`, lorem, TODO or example.com.
- https://samayhuf-star.github.io/app-legal/scanwise/terms.html — same real date. Purchases section still states a **7-day free trial** for eligible new subscribers, plus the 24-hour cancel / auto-renew rule.
- https://samayhuf-star.github.io/app-legal/scanwise/support.html — still 200; no date placeholder.

Commit `8ff5920` only changes the two date lines on privacy and terms. An unused CSS class named `.placeholder` remains in the stylesheet; it is not applied to any visible node.

### 2. New sim run, QA-only diff, and ASC screenshots — PASS

**Diff vs 0010405.** Commit `2b0d5f7` itself touches only QA files:

- `qa/ScanwiseQATests/SimQATests.swift` — deep-link and Create-field input changed from `example.com` to `www.wikipedia.org`
- `qa/scripts/make-qr-fixtures.mjs` — fixture payload changed to `https://www.wikipedia.org`

No application source changed. Between `0010405` and `2b0d5f7` there are also two earlier commits (`6c5ba8d`, `89d022f`) that only edit `eas.json` submit-profile fields (ASC app id, team, API key path). Those are not app source and are not in the binary’s feature code. `0010405` is an ancestor of `2b0d5f7`. `origin/scanwise/pro` is exactly `2b0d5f7`.

**Sim run 43423025379.** Public Actions API: completed, conclusion success, targeting `samayhuf-star/Scanwise@scanwise/pro`. Local `/workspace/scanwise-qa-run3/` matches that run: `seed.txt` is `qr fixture: 01-safe-link.png -> https://www.wikipedia.org`; the test log opens `scanwise://qa/scan?raw=https%3A%2F%2Fwww.wikipedia.org` and types `www.wikipedia.org`; xcodebuild test exit 0, 1 test, 0 failures, 214.87s at 13:20:56 UTC = **7:20 PM Asia/Dhaka**. `results.json` / `summary.md`: **9/9 PASS** (launch without a hard paywall, scan, Safe-Link, generator, Pro gate, paywall $19.99/$2.99 with 7-day trial copy, StoreKit monthly purchase, Pro unlock, Restore). `app.log`: no Fatal Exception, SIGABRT, uncaught exception or panic. Screenshots `02-scan-result.png`, `04-generator.png` and `06-paywall.png` show wikipedia.org and the full (un-cropped) paywall.

**ASC screenshots** (downloaded at native size from the live listing asset URLs this turn). en-US, all `COMPLETE`, 5 main screens with benefit captions, no permission / settings / restore frames:

| Set | Size | Files |
|---|---|---|
| `APP_IPHONE_67` | 5 × 1320×2868 | launch, scan-result, safe-link-shield, paywall, generator |
| `APP_IPHONE_65` | 5 × 1284×2778 | same five, same compositions |

Result and generator now show **www.wikipedia.org** / `https://www.wikipedia.org`. No example.com on any of the ten frames. The paywall frame is scrolled far enough to show Yearly **and** Monthly (“7 days free, then $19.99/year” / “7 days free, then $2.99/month”), the CTA “Try 7 days free, then $19.99/year”, the auto-renew disclosure, Restore, and Terms / Privacy / Apple EULA. Launch and Safe-Link checksums are unchanged from the previous set; result, paywall and generator checksums are new.

Note, not a screenshot fail: the shipping app source at `0010405` still uses `placeholder: 'example.com'` on the Create URL field (`src/app/(tabs)/create.tsx`) and `example.com/menu` on Batch (`src/app/batch.tsx`). That hint is not visible in the listing shots, because the QA run typed wikipedia.org into the field. The attached binary is still 0010405, so the empty-field hint remains in the app.

### 3. Copyright — PASS

Version 1.0 `copyright`: **`2026 Samay Vashsht`**.

### 4. Content rights — PASS

App `contentRightsDeclaration`: **`DOES_NOT_USE_THIRD_PARTY_CONTENT`**.

### 5. Age rating — PASS, with a NOTE (not a fail)

The questionnaire is filled. `appStoreAgeRating` is **`SEVENTEEN_PLUS`**. `unrestrictedWebAccess` is **`true`**; every other content question is NONE or false (including `medicalOrTreatmentInformation: NONE`, `healthOrWellnessTopics: false`, `advertising: false`). Overrides are `NONE`.

**NOTE:** 17+ is the expected Apple rating when unrestricted web access is declared. That fits a scanner that can open a scanned URL in a browser (`expo-web-browser` is a dependency). Brazil is SIXTEEN / SELF_RATED_SIXTEEN; France is EIGHTEEN. This is recorded only as a note, not a fail.

### 6. Review details — PASS

Review detail `77c38027-f2be-4ef6-bb2b-714c3dbcbf6f` is present:

- Contact: **Samay Vashsht**, **[phone redacted]**, **samayhuf@gmail.com**
- Demo account not required
- Notes explain the free scanner, Safe-Link Shield, basic QR creation and recent history; how to reach Pro (Settings → Go Pro, or Barcode / Batch on Create); that Scanwise Pro is a **StoreKit 2** auto-renewable subscription at $2.99/month or $19.99/year with a 7-day trial; and that Restore is on the paywall and in Settings.

### 7. Build attached, release type, no submission — PASS

- Version 1.0 `build` relationship is **`ddfd6d4a-720e-4c70-ad47-c159289853b7`**, 1.0.0 **(5)**, `VALID`, `APP_STORE_ELIGIBLE`, `usesNonExemptEncryption: false`.
- `releaseType`: **`AFTER_APPROVAL`** (automatically release after Apple approves). `earliestReleaseDate` is null.
- Review submissions for this app: **0** (`meta.paging.total: 0` on both `/v1/apps/6833134833/reviewSubmissions` and the `filter[app]` collection). Version state remains `PREPARE_FOR_SUBMISSION`. Nothing has been submitted.

### 8. App Privacy — UNVERIFIED (only open item)

The public ASC API still cannot read nutrition labels / data-usage declarations. This stays **needs a web check**.

The claimed answer is **“Data Not Collected.”** A source sanity check supports that claim, but does not replace a web confirmation that the declaration is **published**:

- `package.json` at `0010405` has no analytics or crash SDKs. Dependencies are Expo/React Native UI and device libraries plus `expo-iap`, `expo-camera`, `expo-image-picker`, `jsbarcode` and `qrcode`. There is no Sentry, Firebase, Crashlytics, Amplitude, Mixpanel, Segment, Bugsnag, AppsFlyer, Adjust, RevenueCat, PostHog or similar in top-level or lockfile package names.
- `git grep` over app source at `0010405` (`*.ts`, `*.tsx`, `*.js`, `*.json`, excluding the lockfile and QA) found no analytics/crash SDK references.
- The live privacy policy still says there is no account, no advertising and no analytics, and that scans stay on the device.

**Confirm in the ASC web UI that App Privacy is published as Data Not Collected before submit.** If it is only saved and not published, Apple will block submission.

---

## Other checklist items still holding

These were already passing and were not re-opened by the fix list, but were re-read or re-used as context:

- Pricing and IAPs: monthly `6834351860` $2.99 and yearly `6834351714` $19.99, both `READY_TO_SUBMIT`, each with a 7-day FREE_TRIAL in 175 territories, no lifetime product. Paywall copy is “7 days free, then &lt;price&gt;”. Non-hard paywall: launch and scanning work without Pro.
- Listing text: no AI mention, no medical claims. Title `Scanwise: QR Code Scanner`, subtitle `Barcode Reader & Generator`, categories Utilities / Productivity. Support and privacy URLs are set and return 200.
- Export compliance on the attached build: `usesNonExemptEncryption: false`.
- `usesIdfa` on the version is still **null**. Not scored as a fail in this re-check; answer it if Apple prompts at submit.

---

## Open item before submit

1. **Confirm and publish App Privacy in the ASC web UI** (intended: Data Not Collected). This is the only remaining gate. Do not submit until that page shows as published.

No EAS, ASC write, or submit was performed this turn.

---

## App Review submission attempt (13 November 2026, 7:42 PM Asia/Dhaka)

Samay chose option A (via COO): submit Scanwise now at 17+. The Safari/4+ change was not made. App Privacy was scored **PASS (COO-confirmed, Data Not Collected)**. A live re-read immediately before the submit confirmed: build **1.0.0 (5)** `ddfd6d4a-720e-4c70-ad47-c159289853b7` attached to version `05537646-a75a-4269-9b7f-ae09d04a8dd5`, `releaseType: AFTER_APPROVAL`, `appStoreAgeRating: SEVENTEEN_PLUS`, review details set, monthly `6834351860` and yearly `6834351714` both `READY_TO_SUBMIT`, and **0** existing review submissions.

**Result: FAIL. The version was not submitted to App Review.**

What ran (and what did not):

1. `POST /v1/reviewSubmissions` for app `6833134833`, platform IOS, returned **201**. Draft id **`faa00109-b2fa-40a5-bed7-d2accfc56b0e`**, state **`READY_FOR_REVIEW`**, `submittedDate: null`.
2. `POST /v1/reviewSubmissionItems` to attach appStoreVersion `05537646-…` returned **409** `STATE_ERROR.ENTITY_STATE_INVALID`. Associated error: **`STATE_ERROR.APP_PRICING_REQUIRED`** — “App is missing required pricing.” / “App is not eligible for submission until pricing has been set.” (`/v2/appPrices/`).
3. Because that item was not added, **`submitted=true` was not patched**. No new build was created. The first-time IAPs were not attached.

Read-back after the failed item add (still GET-only from this point):

| Field | Value |
|---|---|
| reviewSubmission id | `faa00109-b2fa-40a5-bed7-d2accfc56b0e` |
| reviewSubmission state | `READY_FOR_REVIEW` (draft only; not sent to Apple Review) |
| submittedDate | null |
| items | **0**; `appStoreVersionForReview` is null |
| IAPs included | **No** |
| version `05537646-…` state | still **`PREPARE_FOR_SUBMISSION`** |
| attached build | still 1.0.0 (5) `ddfd6d4a-…` |

Pricing evidence: an `appPriceSchedule` exists and the base territory is **USA**, but `manualPrices` and `automaticPrices` both return 404 (“no resource of type 'null'”). No current list price is selected. Scanwise is meant to be free; the $0.00 US price point exists in the catalog but has not been applied to the schedule.

**Fix before retry:** set the app’s list price (Free / $0.00, base territory USA, and availability as intended) in App Store Connect. Then reuse this same draft submission `faa00109-…` — do not create a second one. Add the appStoreVersion item, try to attach subscription versions `10401617-50f6-4bce-abb2-7cbe57b1dabf` (monthly) and `886980a3-2988-47ab-9e1e-75266ee35d75` (yearly) if the API allows first-time IAPs, then `PATCH submitted=true`.

The earlier checklist PASS (items 1–8, App Privacy COO-confirmed) still holds. Submit is blocked only by missing app pricing.

---

## App Review submission retry (13 November 2026, 7:49 PM Asia/Dhaka)

dev 1 reported the list price was set to Free. A live re-read confirmed it before any write:

- `appPriceSchedule` base territory **USA**
- One **manual** current price on the US price point (`customerPrice` / `proceeds` **0.0**, `manual: true`, no start/end date)
- **174** automatic equalizations, also **$0.00**, for a total of **175** territories, all Free

The existing draft **`faa00109-b2fa-40a5-bed7-d2accfc56b0e`** was reused. No second reviewSubmission was created. Before items were added it was `READY_FOR_REVIEW`, `submittedDate: null`, and had **0** items. Build **1.0.0 (5)** `ddfd6d4a-720e-4c70-ad47-c159289853b7` was still attached, and `releaseType` was still **`AFTER_APPROVAL`**.

What ran:

1. `POST` reviewSubmissionItem for appStoreVersion `05537646-…` — **201**, state `READY_FOR_REVIEW`. The version then moved to `READY_FOR_REVIEW`.
2. First-time IAPs were accepted by the API: monthly subscription version `10401617-…` (`6834351860`) and yearly `886980a3-…` (`6834351714`) both **201**.
3. The first `PATCH submitted=true` returned **409** `STATE_ERROR.SUBSCRIPTION_SUBMISSION_REQUIRES_GROUP_VERSION`: a first-time subscription must go in with its subscription group version. The draft was left unsubmitted.
4. The existing Scanwise Pro group version **`1190e161-f1df-44c4-921a-e08e5c769311`** (v1, already `PREPARE_FOR_SUBMISSION`) was then attached — **201**. Build 5 and `AFTER_APPROVAL` were re-confirmed.
5. `PATCH submitted=true` then returned **200**.

**Result: PASS. Scanwise 1.0 (5) is in App Review.**

| Field | Value |
|---|---|
| reviewSubmission id | `faa00109-b2fa-40a5-bed7-d2accfc56b0e` |
| state | **`WAITING_FOR_REVIEW`** |
| submittedDate | 2026-11-13T13:49:08.649Z = **7:49:08 PM Asia/Dhaka (BDT, UTC+6)** |
| platform | IOS |
| version `05537646-…` `appStoreState` / `appVersionState` | **`WAITING_FOR_REVIEW`** / **`WAITING_FOR_REVIEW`** |
| attached build | still 1.0.0 (5) `ddfd6d4a-…`, `releaseType: AFTER_APPROVAL` |
| IAPs included | **Yes.** Monthly `6834351860` (subscription version `10401617-…`) and yearly `6834351714` (subscription version `886980a3-…`), plus the required subscription group version `1190e161-…`. All four items, both subscriptions, both subscription versions, and the group version are `WAITING_FOR_REVIEW`. |

No new build was created.
