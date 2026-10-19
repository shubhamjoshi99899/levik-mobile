# Levik Partner (mobile app)

The Expo / React Native app for the **Levik Rewards Programme**, used by plumbers and retailers. It is built from the Stitch "Levik Luxury" designs and talks to the [Levik API](https://github.com/shubhamjoshi99899/levik_-backend).

- **Everyone:** an **Explore** tab to browse products with the points each earns and the live schemes it counts towards, see which dealers have it in stock (dealers in your city first), and open a dealer to see everything they stock.
- **Plumbers:**
  - Scan the QR label on a product. The API checks the label is genuine, then the scan goes to the admin team for approval.
  - Earn points, and track them in the passbook.
  - Redeem rewards, follow schemes, and find dealers.
- **Retailers:**
  - Upload GST invoices (photo or PDF) with their line items, and see the incentive the API calculates.
  - Track the monthly sales target, the incentive ledger and schemes.
  - Redeem rewards.

## Quick start

Requires Node.js 22+ and a running Levik API (default `http://localhost:4100`, seeded with `npm run db:seed`).

The app targets **Expo SDK 57** (React Native 0.86), which matches the Expo Go version on the Play Store. Expo Go must match the project's SDK. If Expo Go says the project is incompatible, install the matching Expo Go from [expo.dev/go](https://expo.dev/go).

```bash
npm install
npx expo start
```

- **Phone:** scan the QR code shown by `expo start` with **Expo Go**. The app reaches the API through your computer's LAN IP, which it reads from the Expo dev server, so the phone and computer must be on the same Wi-Fi. This is the only way to test real QR label scanning.
- **Web:** press `w`, or run `npx expo start --web --port 8081`. Add `http://localhost:8081` to the API's `CORS_ORIGINS`.
- **Simulators:** `npx expo start --ios` or `--android` need Xcode or Android Studio.

Set `EXPO_PUBLIC_API_URL` (for example in `.env`) to point the app at a different API, such as staging.

### Test accounts (local seed)

Sign in with OTP code **`123456`**. It only works for numbers listed in the API's `OTP_TEST_CODES`, and only outside production.

| Mobile | Who |
| ------ | --- |
| `98290 11234` | Ramesh Kumar, plumber (PLM-1001) |
| `98290 41127` | Sharma Sanitary Store, retailer (RTL-2001) |
| `99000 11122` | New number: goes through role selection and registration |

To test scanning, generate a label batch in the admin portal (**Product → QR labels**), print the PDF, and scan a label with Expo Go. On web or a simulator, type the serial instead (Scan → Enter serial number).

## Test APK and updates

A hosted staging API lets testers use an installable Android APK without a local server. The APK is built once with EAS (`eas build --platform android --profile preview`). After that, every push to `main` that passes CI publishes an over-the-air update to the `preview` channel, which installed APKs load on their next launch. Native changes (new native modules, `app.json` plugins, SDK upgrades) need a new APK. See the API repo's [DEPLOYMENT.md](https://github.com/shubhamjoshi99899/levik_backend/blob/main/DEPLOYMENT.md) for the one-time setup.

## What is live and what is mock

| Area | Data |
| ---- | ---- |
| OTP sign-in, registration, session refresh | Live (API) |
| Dashboards, wallet, passbook, tiers | Live. Tiers are derived from points and sales in `src/lib/tier.ts` |
| QR scan → resolve label → submit scan (dealer, invoice no., site, photo) | Live |
| Rewards marketplace, redeem, my redemptions, cancel | Live |
| Invoice upload, line items, incentive projection, resubmit | Live |
| Explore: products × dealer stock (nearby first), dealer pages, schemes | Live (retailer-reported inventory) |
| **UPI / bank cashout** | **Mock UI.** It uses the real balance but sends nothing |
| **Aadhaar OTP KYC** (intro, OTP, success) | **Mock UI.** Nothing leaves the phone, and KYC status is still set by admins |
| GSTR-2B / ITC block on the retailer ledger, territory manager contact | Mock (`src/mocks/index.ts`) |

Every mock is labelled in the app with a **Preview** banner or a "Preview" badge. All mock values live in [`src/mocks/index.ts`](src/mocks/index.ts).

## Project structure

```
src/
  app/                     Expo Router routes (thin: each screen file renders a feature component)
    _layout.tsx            fonts, providers, auth guard (Stack.Protected: signed out / guest / plumber·retailer)
    (auth)/                welcome, sign-in (phone + OTP)
    (onboarding)/          role selection, registration
    (app)/(tabs)/          Home · Explore · [Scan / Invoice] · Rewards · History, role-aware
    (app)/…                profile (from the avatar), product/[id], dealer/[id], scan, invoice-upload, invoice/[id],
                           redemptions, cashout, kyc/*
  features/                screens by area: plumber/, retailer/, explore/, shared/
  components/              tab dock, preview banner, ui/ (Text, Button, Card, Badge, Field, OtpInput, Sheet…)
  api/
    schema.d.ts            generated from the API's OpenAPI document (npm run api:types)
    client.ts              typed openapi-fetch client + TanStack Query hooks ($api), uploads
    session.ts             OTP sign-in, rotating refresh token in SecureStore, guest → plumber/retailer
    config.ts              API URL resolution (env → Expo host IP → localhost)
  theme/tokens.ts          Levik Luxury design system (colours, type, radii, spacing, shadows)
  lib/                     formatting (₹ lakh grouping), tiers, product images, file pickers
  mocks/                   UI-only data for cashout, Aadhaar KYC and GST previews
```

### Conventions

- **API types are generated, not hand-written.** After the API changes, run `npm run api:types` while it is running.
- **Session tokens:**
  - The access token is kept in memory only.
  - The refresh token is kept in SecureStore (Keychain / Keystore), or localStorage on web.
  - A 401 response triggers one refresh and a retry.
- **Refreshing data:** after any mutation (scan, redemption, invoice), `refreshAll()` refetches the queries on screen, because points, balances and targets move together.
- **Product photos** are bundled in `assets/products`. The API stores web paths, which `src/lib/product-image.ts` maps to the bundled files.
- **Styling** uses the tokens in `src/theme/tokens.ts`. Gold is reserved for rewards and points, and emerald for verification, as the design system requires.

## Scripts

| Command | Purpose |
| ------- | ------- |
| `npx expo start` | Dev server (Expo Go, web, simulators) |
| `npm run typecheck` | `tsc --noEmit` |
| `npx expo lint` | ESLint (`eslint-config-expo`) |
| `npm run api:types` | Regenerate `src/api/schema.d.ts` from the API |
| `npx expo-doctor` | Check dependency and config health |
| `npx eas-cli@latest build -p android --profile preview` | Build an installable test APK against the staging API |

## Not done yet

- App icon and splash screen still use Expo's defaults. They need Levik brand assets.
- Hindi and Gujarati language switching (the selector exists, but text is English only).
- Push notifications, and Play Store / App Store builds and submission (the `production` EAS profile exists but is unused).
- Backend endpoints for UPI/bank payouts and Aadhaar (UIDAI) KYC. Their screens are mock UI until then.
