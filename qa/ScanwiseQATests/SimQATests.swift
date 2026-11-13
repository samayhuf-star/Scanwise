import XCTest
import StoreKitTest

/// Scanwise iOS simulator flow: launch (free, no paywall), scan from photo, Safe-Link Shield, generator,
/// Pro gate, paywall prices and 7-day trial, StoreKit test purchase, Restore.
/// Screenshots and results.json go to $SIM_QA_OUT (pass TEST_RUNNER_SIM_QA_OUT to xcodebuild).
final class SimQATests: XCTestCase {
    private var session: SKTestSession?
    private var results: [[String: Any]] = []
    private let outDir: URL = {
        let path = ProcessInfo.processInfo.environment["SIM_QA_OUT"] ?? "/tmp/sim-qa"
        let url = URL(fileURLWithPath: path, isDirectory: true)
        try? FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        return url
    }()
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = true
        let candidates: [String] = [
            ProcessInfo.processInfo.environment["STOREKIT_CONFIG"],
            Bundle(for: SimQATests.self).path(forResource: "Scanwise", ofType: "storekit"),
        ].compactMap { $0 }
        for path in candidates where FileManager.default.fileExists(atPath: path) {
            do {
                let s = try SKTestSession(contentsOf: URL(fileURLWithPath: path))
                s.resetToDefaultState()
                s.disableDialogs = true
                s.clearTransactions()
                session = s
                NSLog("[scanwise-qa] SKTestSession from \(path)")
                break
            } catch {
                NSLog("[scanwise-qa] SKTestSession failed for \(path): \(error)")
            }
        }
        addUIInterruptionMonitor(withDescription: "System alerts") { alert in
            for label in ["Allow Full Access", "Allow Access to All Photos", "Allow", "OK", "Continue", "Open"] {
                let b = alert.buttons[label]
                if b.exists { b.tap(); return true }
            }
            return false
        }
    }

    override func tearDownWithError() throws {
        writeResults()
    }

    func testScanwiseFlow() throws {
        app = XCUIApplication()
        app.launchArguments += ["-AppleLanguages", "(en)", "-AppleLocale", "en_US"]
        app.launch()

        // 1. Launch: lands on Scan, no paywall
        sleep(3)
        shot("01-launch")
        let scanUp = containing("Scan from").waitForExistence(timeout: 20) || containing("Point at a QR code").exists
        let paywallAtLaunch = any("paywall-screen").exists
        record(1, "Launch (free, no paywall)", scanUp && !paywallAtLaunch, "scanScreen=\(scanUp) paywallAtLaunch=\(paywallAtLaunch)")

        // 2. Scan a seeded QR image from the photo library (QA deep link fallback when the picker can't be driven)
        var scanOK = false
        var scanDetail = ""
        let pickBtn = containing("Scan from")
        if pickBtn.exists {
            tapEl(pickBtn)
            sleep(3)
            shot("02a-photo-picker")
            let img = app.images.matching(NSPredicate(format: "label CONTAINS[c] %@ OR identifier CONTAINS[c] %@", "Photo", "Photo")).firstMatch
            let anyImg = img.exists ? img : app.scrollViews.images.firstMatch
            if anyImg.waitForExistence(timeout: 8) {
                anyImg.tap()
                sleep(1)
                if let add = hittable("Add") { add.tap() }
                scanOK = containing("No red flags found").waitForExistence(timeout: 12)
                scanDetail = "picker photo tapped; resultSafe=\(scanOK)"
            } else {
                scanDetail = "picker photo not found"
                if let cancel = hittable("Cancel") { cancel.tap() }
            }
        }
        if !scanOK {
            dismissAppAlert()
            openQa("scanwise://qa/scan?raw=https%3A%2F%2Fwww.wikipedia.org")
            scanOK = containing("No red flags found").waitForExistence(timeout: 12)
            scanDetail += "; deep-link fallback resultSafe=\(scanOK)"
        }
        shot("02-scan-result")
        record(2, "Scan QR (photo or camera fallback)", scanOK, scanDetail)
        closeModal()

        // 3. Safe-Link Shield on a risky link
        openQa("scanwise://qa/scan?raw=http%3A%2F%2F192.168.4.20%2Flogin.php%3Fbank%3D1")
        let danger = containing("Do not open this link").waitForExistence(timeout: 12)
        shot("03-safe-link-shield")
        record(3, "Safe-Link Shield flags a risky link", danger, "dangerVerdict=\(danger)")
        closeModal()

        // 4. Generator (free QR)
        tab("Create")
        var genOK = false
        let field = app.textFields.firstMatch
        if field.waitForExistence(timeout: 8) {
            field.tap()
            field.typeText("www.wikipedia.org")
            sleep(1)
            if app.keyboards.count > 0, let done = hittable("Return") { done.tap() }
            genOK = !containing("Fill in the details").exists && (hittable("Share image")?.isEnabled ?? false)
        }
        shot("04-generator")
        record(4, "QR generator (free)", genOK, "preview rendered=\(genOK)")

        // 5. Pro gate: Barcode opens the paywall, X returns to a working Create screen
        tapEl(any("mode-bar"))
        let gate = any("paywall-screen").waitForExistence(timeout: 8)
        shot("05a-pro-gate")
        tapEl(any("paywall-close"))
        let back = waitGone(any("paywall-screen"), timeout: 8) && containing("Create").exists
        shot("05b-after-close")
        record(5, "Pro gate opens paywall, X closes it", gate && back, "paywallOnBarcode=\(gate) closedToCreate=\(back)")

        // 6. Paywall from Settings (Go Pro): store prices and the 7-day trial
        tab("Settings")
        let freePlan = containing("Plan: Free").waitForExistence(timeout: 5)
        shot("06a-settings-free")
        tapEl(any("Go Pro"))
        var payOK = false
        var payDetail = "paywall did not open"
        if any("paywall-screen").waitForExistence(timeout: 10) {
            let y = hasText(["$19.99"])
            let m = hasText(["$2.99"])
            let trial = hasText(["7 days free"])
            let cta = hasText(["Try 7 days free, then $19.99/year"])
            let disclosure = containing("renews automatically").exists
            let restore = any("paywall-restore").exists
            let terms = containing("Terms of Use").exists && containing("Privacy Policy").exists
            let close = any("paywall-close").exists
            payOK = y && m && trial && cta && disclosure && restore && terms && close
            payDetail = "settingsFree=\(freePlan) yearly $19.99=\(y) monthly $2.99=\(m) trial=\(trial) cta=\(cta) disclosure=\(disclosure) restore=\(restore) terms+privacy=\(terms) X=\(close) unavailable=\(any("plans-unavailable").exists)"
            // Prices and the CTA start below the fold on a standard iPhone. Scroll until yearly, monthly and the buy button are all visible, then shoot.
            revealPaywallPlans()
        }
        shot("06-paywall")
        record(6, "Paywall prices, trial, X, Restore, links", payOK, payDetail)

        // 7. StoreKit test purchase (monthly with trial)
        var buyOK = false
        var buyDetail = "session=\(session != nil)"
        if payOK {
            tapEl(any("plan-monthly"))
            sleep(1)
            revealPaywallPlans()
            let ctaM = hasText(["Try 7 days free, then $2.99/month"])
            shot("07a-monthly-selected")
            let buy = any("paywall-cta")
            if !scrollUntilHittable(buy) {
                _ = scrollUntilHittable(containing("Try 7 days free, then $2.99/month"))
            }
            if buy.exists { tapEl(buy) } else { tapEl(containing("Try 7 days free")) }
            confirmStoreSheet()
            let welcome = app.alerts["Welcome to Scanwise Pro"].waitForExistence(timeout: 20)
            shot("07b-purchased")
            dismissAppAlert()
            _ = waitGone(any("paywall-screen"), timeout: 10)
            buyOK = containing("Plan: Pro").waitForExistence(timeout: 10)
            buyDetail += " ctaMonthly=\(ctaM) welcomeAlert=\(welcome) settingsPro=\(buyOK)"
        } else {
            buyDetail += "; skipped, paywall check failed"
        }
        shot("07-purchase-settings")
        record(7, "StoreKit test purchase (monthly, 7-day trial)", buyOK, buyDetail)

        // 8. Pro unlocked: Barcode generator opens without the paywall
        tab("Create")
        tapEl(any("mode-bar"))
        let unlocked = !any("paywall-screen").waitForExistence(timeout: 3) && containing("Code 128").exists
        shot("08-pro-barcodes")
        record(8, "Pro unlocks barcodes", unlocked, "barcodeFormatsShown=\(unlocked)")
        if any("paywall-screen").exists { tapEl(any("paywall-close")) }

        // 9. Restore purchases (Settings)
        tab("Settings")
        var restoreOK = false
        var restoreDetail = "Restore button not found"
        if scrollTo(any("Restore purchases")) {
            tapEl(any("Restore purchases"))
            let alert = app.alerts.firstMatch
            if alert.waitForExistence(timeout: 15) {
                restoreDetail = "alert: \(alert.label)"
                restoreOK = alert.label == "Restored"
                shot("09-restore")
                dismissAppAlert()
            } else {
                restoreDetail = "no restore alert"
                shot("09-restore")
            }
        }
        record(9, "Restore purchases (Settings)", restoreOK, restoreDetail)

        let failed = results.compactMap { row -> String? in
            guard (row["pass"] as? Bool) != true else { return nil }
            return row["name"] as? String
        }
        if !failed.isEmpty {
            XCTFail("Failed steps: \(failed.joined(separator: "; "))")
        }
    }

    // MARK: - Helpers

    private func openQa(_ url: String) {
        guard let u = URL(string: url) else { return }
        XCUIDevice.shared.system.open(u)
        Thread.sleep(forTimeInterval: 1.5)
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        if springboard.buttons["Open"].waitForExistence(timeout: 3) { springboard.buttons["Open"].tap() }
        _ = app.wait(for: .runningForeground, timeout: 10)
        Thread.sleep(forTimeInterval: 1.5)
    }

    private func tab(_ name: String) {
        dismissAppAlert()
        let b = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", name)).allElementsBoundByIndex.last(where: { $0.isHittable })
        if let b = b { b.tap() } else { tapEl(any(name)) }
        Thread.sleep(forTimeInterval: 1.0)
    }

    private func closeModal() {
        dismissAppAlert()
        for label in ["Close", "Done"] {
            if let b = hittable(label) { b.tap(); Thread.sleep(forTimeInterval: 1); return }
        }
        app.swipeDown(velocity: .fast)
        Thread.sleep(forTimeInterval: 1)
    }

    private func any(_ key: String) -> XCUIElement {
        app.descendants(matching: .any).matching(NSPredicate(format: "identifier == %@ OR label == %@", key, key)).firstMatch
    }

    private func containing(_ text: String) -> XCUIElement {
        app.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS %@", text)).firstMatch
    }

    private func hittable(_ key: String) -> XCUIElement? {
        let all = app.descendants(matching: .any).matching(NSPredicate(format: "identifier == %@ OR label == %@", key, key)).allElementsBoundByIndex
        return all.last(where: { $0.exists && $0.isHittable })
    }

    private func tapEl(_ el: XCUIElement) {
        guard el.waitForExistence(timeout: 5) else { NSLog("[scanwise-qa] tap: missing element"); return }
        if el.isHittable { el.tap() } else { el.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap() }
        Thread.sleep(forTimeInterval: 0.8)
    }

    @discardableResult
    private func scrollTo(_ el: XCUIElement) -> Bool {
        return scrollUntilHittable(el)
    }

    @discardableResult
    private func scrollUntilHittable(_ el: XCUIElement, maxSwipes: Int = 8) -> Bool {
        for _ in 0..<maxSwipes {
            if el.exists && el.isHittable { return true }
            app.swipeUp()
            Thread.sleep(forTimeInterval: 0.5)
        }
        return el.exists && el.isHittable
    }

    /// Swipe the paywall just far enough that yearly, monthly and the subscribe button share one frame.
    private func revealPaywallPlans() {
        for _ in 0..<8 {
            let yearly = containing("$19.99").exists && (any("plan-yearly").isHittable || containing("$19.99").isHittable)
            let monthly = containing("$2.99").exists && (any("plan-monthly").isHittable || containing("$2.99").isHittable)
            let cta = any("paywall-cta").isHittable || containing("Try 7 days free").isHittable
            if yearly && monthly && cta { return }
            app.swipeUp()
            Thread.sleep(forTimeInterval: 0.5)
        }
    }

    private func dismissAppAlert() {
        let alert = app.alerts.firstMatch
        guard alert.waitForExistence(timeout: 2) else { return }
        NSLog("[scanwise-qa] app alert: \(alert.label)")
        for label in ["OK", "Cancel"] {
            let b = alert.buttons[label]
            if b.exists { b.tap(); Thread.sleep(forTimeInterval: 0.8); return }
        }
        alert.buttons.firstMatch.tap()
    }

    private func confirmStoreSheet() {
        // With SKTestSession.disableDialogs no sheet appears. If one does, confirm it.
        Thread.sleep(forTimeInterval: 3)
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        for target in [app!, springboard] {
            for label in ["Subscribe", "Start Free Trial", "Purchase", "Confirm", "OK"] {
                let b = target.buttons[label]
                if b.exists && b.isHittable { shot("07-store-sheet"); b.tap(); Thread.sleep(forTimeInterval: 2); return }
            }
        }
    }

    private func hasText(_ candidates: [String]) -> Bool {
        let deadline = Date().addingTimeInterval(12)
        while Date() < deadline {
            for t in candidates where containing(t).exists { return true }
            Thread.sleep(forTimeInterval: 0.5)
        }
        return false
    }

    private func waitGone(_ el: XCUIElement, timeout: TimeInterval) -> Bool {
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            if !el.exists { return true }
            Thread.sleep(forTimeInterval: 0.5)
        }
        return !el.exists
    }

    private func shot(_ name: String) {
        let s = XCUIScreen.main.screenshot()
        try? s.pngRepresentation.write(to: outDir.appendingPathComponent("\(name).png"))
        let a = XCTAttachment(screenshot: s)
        a.name = name
        a.lifetime = .keepAlways
        add(a)
    }

    private func record(_ step: Int, _ name: String, _ pass: Bool, _ detail: String) {
        results.append(["step": step, "name": name, "pass": pass, "detail": detail])
        writeResults()
        NSLog("[scanwise-qa] step \(step) \(pass ? "PASS" : "FAIL") \(name): \(detail)")
    }

    private func writeResults() {
        if let data = try? JSONSerialization.data(withJSONObject: ["steps": results], options: [.prettyPrinted]) {
            try? data.write(to: outDir.appendingPathComponent("results.json"))
        }
    }
}
