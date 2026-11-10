# Scanwise

Scan QR codes and barcodes safely, and create your own. Built with Expo (React Native) and Expo Router.

- **Safe-Link Shield** checks every link on-device before it opens (look-alike domains, shorteners, raw IPs, risky downloads) and gives a Safe / Caution / Danger verdict with reasons.
- **Payment and Wi-Fi aware**: UPI payment codes and Wi-Fi codes are parsed and explained, not blindly opened.
- **Generator**: Link, Text, Wi-Fi, Contact, Email, Phone, SMS, UPI QR codes plus Code 128, EAN-13, EAN-8, UPC-A, Code 39, ITF-14 barcodes. Static codes that never expire.
- **Private**: no account, no ads, no tracking. History stays on the device.

## Develop

```bash
npm install
npx expo start
```

Camera scanning needs a real device: use a development build (`eas build --profile development`) or Expo Go.

## Build and ship

```bash
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios
```

Bundle ID: `com.samayhuf.scanwise`.
