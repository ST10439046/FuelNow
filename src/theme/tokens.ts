// ─────────────────────────────────────────────
// FuelNow Design Tokens — v2
// Updated palette: warm orange energy brand.
// ─────────────────────────────────────────────

export const Colors = {
  // ── Primary Brand: Fuel Orange ──────────────
  /** Primary CTA, key actions, active nav */
  petrolDeep: '#F97316',
  /** Hover / pressed state */
  petrolMid: '#EA580C',
  /** Orange-100 tint — card highlights, petrol pills */
  petrolLight: '#FFEDD5',
  /** Orange-50 — subtler backgrounds */
  petrolFaint: '#FFF7ED',

  // ── Fuel Type Accents ───────────────────────
  /** Diesel fuel card, map destination pin */
  dieselBlue: '#2563EB',
  /** Diesel blue tint */
  dieselBlueTint: '#DBEAFE',

  // ── Status ──────────────────────────────────
  /** Delivered / Arrived / Success */
  dieselGreen: '#22C55E',
  /** Green tint */
  greenLight: '#DCFCE7',

  // ── Ratings & Loyalty ───────────────────────
  /** Driver star ratings, Gold tier */
  ignitionAmber: '#FACC15',
  /** Amber tint */
  amberLight: '#FFF7ED',
  /** Amber dark text */
  amberDark: '#EA580C',

  // ── Canvas & Surfaces ───────────────────────
  /** App background */
  warmAsh: '#F8FAFC',
  white: '#FFFFFF',
  black: '#000000',
  cardBg: '#FFFFFF',

  // ── Typography ──────────────────────────────
  /** Titles, prices, driver names */
  charcoalInk: '#111827',
  /** Secondary labels, subtitles */
  inkLight: '#4B5563',
  /** Timestamps, placeholders */
  inkFaint: '#9CA3AF',

  // ── Borders & Dividers ──────────────────────
  divider: '#E2E8F0',
  ashDark: '#F3F4F6',

  // ── Feedback ────────────────────────────────
  /** Errors and SOS ONLY — never decorative */
  signalRed: '#EF4444',

  // ── Tier Badge Colors ───────────────────────
  tierBronzeBg: '#FEF3C7',
  tierBronzeText: '#92400E',
  tierSilverBg: '#F1F5F9',
  tierSilverText: '#334155',
  tierGoldBg: '#FEF9C3',
  tierGoldText: '#854D0E',
  tierPlatinumBg: '#F3E8FF',
  tierPlatinumText: '#6B21A8',

  // ── Utility ─────────────────────────────────
  overlay: 'rgba(17, 24, 39, 0.5)',
} as const;

export const Fonts = {
  /** Display / Headings / Prices */
  display: 'Inter_600SemiBold',
  displayBold: 'Inter_700Bold',
  displayMedium: 'Inter_500Medium',
  /** Body / UI / Forms */
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  /** Numeric readouts */
  mono: 'Inter_400Regular',
  monoMedium: 'Inter_500Medium',
  monoBold: 'Inter_600SemiBold',
} as const;

export const FontSizes = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 34,
  '4xl': 42,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 10,
  },
} as const;

// Wireframe (grayscale) overrides
export const WireframeColors = {
  petrolDeep: '#4A4A4A',
  petrolMid: '#5A5A5A',
  petrolLight: '#E8E8E8',
  petrolFaint: '#F0F0F0',
  dieselBlue: '#4A4A4A',
  dieselBlueTint: '#E0E0E0',
  dieselGreen: '#6A6A6A',
  greenLight: '#E8E8E8',
  ignitionAmber: '#8A8A8A',
  amberLight: '#F0F0F0',
  amberDark: '#6A6A6A',
  warmAsh: '#F0F0F0',
  white: '#FFFFFF',
  black: '#000000',
  cardBg: '#FFFFFF',
  charcoalInk: '#1A1A1A',
  inkLight: '#7A7A7A',
  inkFaint: '#AAAAAA',
  divider: '#DDDDDD',
  ashDark: '#D8D8D8',
  signalRed: '#5A5A5A',
  tierBronzeBg: '#E8E8E8',
  tierBronzeText: '#444444',
  tierSilverBg: '#E0E0E0',
  tierSilverText: '#444444',
  tierGoldBg: '#E8E8E8',
  tierGoldText: '#444444',
  tierPlatinumBg: '#E8E8E8',
  tierPlatinumText: '#444444',
  overlay: 'rgba(0,0,0,0.5)',
} as const;
