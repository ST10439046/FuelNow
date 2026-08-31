# FuelNow 🚛⛽

**A mobile UI mockup for a South African fuel delivery app — built for a university report.**

> This is a design mockup only. No real backend, no real payments, no GPS routing.
> A mock service layer (`src/services/mockApi.ts`) simulates realistic API responses.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo (~52) |
| Navigation | React Navigation 6 (Stack + Bottom Tabs) |
| Typography | Space Grotesk · Inter · IBM Plex Mono |
| Icons | @expo/vector-icons (Feather) |
| Charts/Gauges | react-native-svg |
| Gradients | expo-linear-gradient |
| State | React Context (DesignModeContext) |

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli` (optional, `npx` works too)
- For Expo Go on phone: install the **Expo Go** app from App Store / Play Store

### 1. Install dependencies

```bash
cd FuelApp
npm install
```

### 2. Run on web (for screenshots)

```bash
npx expo start --web
```

Then open `http://localhost:19006` in your browser and set viewport to **390 × 844** (iPhone 14 Pro size) via DevTools device toolbar.

### 3. Run on Expo Go (phone)

```bash
npx expo start
```

Scan the QR code with the Expo Go app.

### 4. Run on iOS/Android simulator

```bash
npx expo start --ios      # macOS only, requires Xcode
npx expo start --android  # requires Android Studio
```

---

## Design Mode Toggle

A floating button appears at the **bottom-right of every screen**:

| Button | Mode | Description |
|--------|------|-------------|
| 📐 Wireframe | `WIREFRAME` | Grayscale only, system default font, plain bordered boxes, no color/icons/imagery |
| 🎨 Hi-Fi | `HIGH_FIDELITY` | Full FuelNow design system — branded colors, Space Grotesk, IBM Plex Mono dials, icons |

**Toggle does NOT reset navigation.** You can walk through the entire order flow in one mode, then toggle and repeat for screenshots in the other mode.

---

## Design System

### Color Tokens

| Name | Hex | Usage |
|------|-----|-------|
| `petrolDeep` | `#0B3D42` | Nav bars, primary buttons |
| `ignitionAmber` | `#F2994A` | CTAs, prices, gauge needle |
| `dieselGreen` | `#3C8C68` | Success / delivered states |
| `warmAsh` | `#F6F3EE` | Background |
| `charcoalInk` | `#20242A` | Primary text |
| `signalRed` | `#D64545` | SOS and errors ONLY |

### Typography

- **Display / Headings / Prices** → `Space Grotesk`
- **Body / UI / Forms** → `Inter`
- **Numeric readouts** → `IBM Plex Mono` (litres, ZAR, ETA, PIN, timestamps)

### Signature Component — FuelGaugeArc

The `FuelGaugeArc` is a 220° SVG speedometer-style arc reused across:
- Onboarding slides (litres metric)
- Live Tracking ETA countdown
- Rewards loyalty progress
- (Parts 2 & 3) Driver earnings, admin dashboards

```tsx
<FuelGaugeArc
  value={23}       // current value
  max={35}         // maximum (100% fill)
  label="ETA"      // label beneath readout
  unit="min"       // unit suffix
  size={160}       // diameter in pixels
  color="#F2994A"  // override fill color (optional)
/>
```

---

## Project Structure

```
FuelApp/
├── App.tsx                          # Root: fonts, navigation, DesignModeProvider
├── app.json                         # Expo config
├── package.json
├── tsconfig.json
│
└── src/
    ├── context/
    │   └── DesignModeContext.tsx    # Wireframe ↔ Hi-Fi toggle state
    │
    ├── theme/
    │   └── tokens.ts               # All design tokens (colors, type, spacing)
    │
    ├── services/
    │   └── mockApi.ts              # Mock REST-style API with delays
    │
    ├── components/                  # Shared reusable components
    │   ├── Button.tsx
    │   ├── Card.tsx
    │   ├── Input.tsx
    │   ├── FuelGaugeArc.tsx        # ⭐ Signature gauge component
    │   ├── StatusBadge.tsx
    │   ├── TabBar.tsx
    │   └── DesignModeToggle.tsx
    │
    └── screens/
        ├── onboarding/OnboardingScreen.tsx
        ├── auth/
        │   ├── LoginScreen.tsx
        │   ├── SignUpScreen.tsx     # Also contains OTP flow
        │   └── ForgotPasswordScreen.tsx
        ├── home/HomeScreen.tsx
        ├── order/
        │   ├── FuelSelectionScreen.tsx
        │   ├── DeliveryLocationScreen.tsx
        │   ├── DeliveryTimeScreen.tsx
        │   ├── PaymentMethodScreen.tsx
        │   ├── OrderReviewScreen.tsx
        │   ├── OrderPlacedScreen.tsx
        │   ├── LiveTrackingScreen.tsx
        │   ├── DeliveryPinScreen.tsx
        │   ├── RateReviewScreen.tsx
        │   └── DigitalReceiptScreen.tsx
        ├── history/OrderHistoryScreen.tsx
        ├── rewards/RewardsScreen.tsx
        ├── notifications/NotificationsScreen.tsx
        └── profile/ProfileScreen.tsx
```

---

## Mock API

All functions in `src/services/mockApi.ts` are named after real REST endpoints:

| Function | Simulates |
|----------|-----------|
| `signUp(data)` | `POST /auth/signup` |
| `login(data)` | `POST /auth/login` |
| `verifyOtp(data)` | `POST /auth/verify-otp` |
| `forgotPassword(data)` | `POST /auth/forgot-password` |
| `getCurrentRates()` | `GET /rates/current` |
| `createOrder(data)` | `POST /orders` |
| `trackOrder(id)` | `GET /orders/:id/track` |
| `confirmDelivery(id, pin)` | `POST /orders/:id/confirm-delivery` |
| `getOrderHistory()` | `GET /orders` |
| `rateOrder(id, data)` | `POST /orders/:id/rate` |
| `getRewardsBalance()` | `GET /rewards/balance` |
| `getNotifications()` | `GET /notifications` |

All responses include a 400–1400ms artificial delay so loading states render correctly in screenshots.

---

## South African Mock Data

- **Names**: Zanele Mokoena, Sipho Dlamini, Ruan van der Merwe, Priya Naidoo
- **Prices**: ZAR (R) — Petrol 95 at R23.45/L, Diesel 50ppm at R21.63/L
- **Addresses**: Waterkloof Ridge (Pretoria), Sandton (Joburg), Gardens (Cape Town)
- **Phones**: 082 xxx xxxx, 060 xxx xxxx format
- **Stations**: Engen Sandton City, Total Bryanston
- **Payment**: FNB Cheque, Nedbank Credit, SnapScan

---

## Screenshotting for Reports

1. Open `npx expo start --web`
2. Open DevTools → Device toolbar → set to **390 × 844**
3. Navigate to each screen
4. Use browser screenshot or `Ctrl+Shift+P → Capture screenshot`
5. Toggle Design Mode to repeat for wireframe screenshots

---

## Parts Overview

| Part | Status | Contents |
|------|--------|----------|
| Part 1 | ✅ Complete | Design system, shared components, Customer app (19 screens) |
| Part 2 | 🔜 | Driver app (registration, jobs, earnings, navigation) |
| Part 3 | 🔜 | Admin dashboard (web, analytics, fleet management) |
| Part 4 | 🔜 | Final polish, animations, export |
