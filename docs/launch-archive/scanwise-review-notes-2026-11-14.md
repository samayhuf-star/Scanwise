1. Screen recording
[Screen recording link: TO ADD, file scanwise-review-flow.mp4, 2 min 45 s]
The recording starts on the Home Screen and shows Scanwise launching, then: the Scan tab with no paywall at launch; "Scan from photo" reading a QR code from a photo, with the Safe-Link Shield result (No red flags found); a risky link getting a Danger verdict with its reasons; creating a free QR code on the Create tab; tapping the Pro Barcode control, which opens the paywall, and closing it with the X; the paywall from Settings > Go Pro with both prices (US $2.99 per month, US $19.99 per year), the 7-day free trial line, the renewal terms, Restore Purchases, Terms of Use and Privacy Policy; a sandbox purchase of the monthly plan with its free trial, which unlocks Scanwise Pro and the barcode generator; and Restore purchases in Settings. There is no account registration, login, account deletion or user-generated content in the app.

2. Purpose and target audience
Scanwise is a QR and barcode scanner and generator for everyday iPhone users. It solves a common problem: a printed QR code hides where it leads, and scam QR codes on posters, parking meters and payment stickers are widespread. Scanwise reads the code, shows plainly what it contains (link, Wi-Fi, contact, email, phone, SMS, location, payment, product code or text), and checks links on the device for common warning signs before the user opens them. Users can also create QR codes to share. It is a general consumer utility for adults and teens. The app is free to download (US $0.00), with an optional Scanwise Pro subscription.

3. Setup and how to reach the main and paid features
No account, login, demo credentials or sample files are needed. Any QR code or barcode works for testing, including one shown on another screen or saved as a photo. The app opens on the Scan tab; it is not a hard paywall.

• Scan: allow camera access when asked, then point the camera at a QR code or barcode. Or tap the photo button on the Scan tab ("Scan from photo") and choose an image that contains a code. Supported types: QR, EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, Code 93, ITF-14, Codabar, PDF417, Aztec and Data Matrix.
• Result: Safe-Link Shield gives a Safe, Caution or Danger verdict with the reasons. The user can copy, share or open a link. A Danger link asks for confirmation ("Open anyway") first. HTTP(S) links open in the system in-app browser.
• Create (free): QR codes for links, text, Wi-Fi, contacts, email, phone and SMS, shared as an image or copied as text.
• History: the newest 20 entries plus starred items, with search and filters, stored only on this device.
• Settings: plan status (Free or Pro), Go Pro, Restore purchases, Haptic feedback and Save scans to history switches, Terms and Privacy.

Paid features (Scanwise Pro) are offered only when a Pro control or Go Pro is tapped. The paywall can always be closed with the X, and the free tools stay available.
• To open the paywall: Settings > Go Pro, or tap Barcode or Batch on the Create tab.
• The paywall shows both plans with the App Store's localised price. The "7 days free, then" line appears only when the App Store reports the free trial for that account.
• To start the trial: pick Monthly or Yearly and tap the subscribe button; the standard App Store purchase sheet appears.
• Pro unlocks: barcode generator (Code 128, EAN-13, EAN-8, UPC-A, Code 39, ITF-14); UPI payment QR codes; custom colours (navy, green, purple); unlimited history; batch QR (one per line, up to 30, shared as one image); history CSV export.
• Restore Purchases is on the paywall and in Settings.

Subscriptions, group "Scanwise Pro", sold through Apple In-App Purchase (StoreKit 2), submitted with this version:
• Scanwise Pro Monthly, com.samayhuf.scanwise.pro.monthly (6834351860): US $2.99 per month, 7-day free trial for new subscribers
• Scanwise Pro Yearly, com.samayhuf.scanwise.pro.yearly (6834351714): US $19.99 per year, 7-day free trial for new subscribers
There is no lifetime or one-time product. After a trial the subscription renews unless cancelled at least 24 hours before the trial ends.

4. External services
• Apple In-App Purchase (StoreKit 2, through the open-source expo-iap library) for the two subscriptions. There is no other payment processor.
• No backend: we do not operate a server, and scan data, history and settings never leave the device (stored on the device only).
• No account or authentication service, no analytics, no advertising, no crash reporting and no other third-party SDKs or data providers.
• Safe-Link Shield runs entirely on the device and makes no network request. It checks the address text only: non-web schemes, unencrypted http, a hidden "@" redirect, raw IP addresses, look-alike (punycode or non-English) characters, link shorteners, domain endings often used in scams, excessive sub-domains or hyphens, unusual ports, brand look-alike domains, phishing pressure words, direct installer or script downloads, very long addresses and encoded characters in the domain. It cannot see what a page does after it loads, and the app says so.
• Opening a link uses the system in-app browser (expo-web-browser) only when the user taps Open. Phone, email, SMS and map actions hand off to the system apps (maps.apple.com for locations). The optional "Look up product" and "Search web" actions open a Google search page in the browser. Terms of Use, Privacy Policy and Apple's standard licence agreement open as web pages.
• Camera and the photo library are used only to read codes, on the device.

5. Regional differences
Scanwise works the same way in every region: the same features, content and free and Pro split everywhere. The download is free everywhere. Subscription prices are the App Store's localised prices for each storefront, shown in the app as reported by the App Store. UPI payment QR creation is a Pro tool for payment details the user types in; it is not geo-locked, though UPI is mainly used in India. App language is English.

6. Regulated or third-party material
Not applicable. Scanwise does not operate in a regulated industry: it is not a medical, health, financial, banking, gambling, legal or identity service, it does not move money, and it has no user-generated content, social features or chat. The UPI QR tool only formats a payment link that the user's own payment app handles; Scanwise processes no payment. Safe-Link Shield looks for common warning signs and does not guarantee that a link is safe. The app contains no licensed third-party content, brands or media.
Privacy Policy: https://samayhuf-star.github.io/app-legal/scanwise/privacy.html
Terms of Use: https://samayhuf-star.github.io/app-legal/scanwise/terms.html

Contact: Samay Vashsht, +91 9953710111, samayhuf@gmail.com.
