import type { TextStyle } from 'react-native';

/**
 * Levik Luxury design system (from the Stitch export, levik_luxury/DESIGN.md).
 * Midnight navy for structure, champagne gold only for rewards/points, emerald only for verification.
 */
export const colors = {
  // Navy
  navy: '#0B1E3D',
  navyRaised: '#0F2952',
  navyInk: '#000516',
  onNavyMuted: '#B6C6EE',
  // Gold (rewards, tiers, points)
  gold: '#C5A059',
  goldBright: '#D4AF37',
  goldLight: '#E5C378',
  goldSoft: '#FED488',
  goldWash: '#FFF4DC',
  goldInk: '#775A19',
  // Emerald (verification, genuine, credited)
  emerald: '#10B981',
  emeraldDeep: '#059669',
  emeraldWash: '#E7F8F1',
  // Slate accents
  slate: '#4A607A',
  // Surfaces
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceLow: '#EFF4FF',
  surfaceMid: '#E5EEFF',
  surfaceHigh: '#DCE9FF',
  border: '#E2E8F0',
  borderSoft: 'rgba(15, 41, 82, 0.07)',
  // Text
  ink: '#1E293B',
  inkStrong: '#0B1C30',
  muted: '#64748B',
  faint: '#94A3B8',
  // States
  error: '#BA1A1A',
  errorWash: '#FFDAD6',
  warning: '#B45309',
  warningWash: '#FEF3C7',
  white: '#FFFFFF',
} as const;

/**
 * Inter Tight (headings, numbers, labels) + Inter (body). Inter Tight is narrower and lighter than the
 * original Plus Jakarta Sans, so headings stay crisp on dense Android screens without dominating.
 */
export const fonts = {
  display: 'InterTight_600SemiBold',
  heading: 'InterTight_600SemiBold',
  label: 'InterTight_500Medium',
  labelBold: 'InterTight_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
} as const;

type Variant = Pick<TextStyle, 'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing' | 'textTransform'>;

/** Compact mobile type scale (about 15–20% below the Stitch web sizes, tuned on 360–400dp Android screens). */
export const type = {
  display: { fontFamily: fonts.display, fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },
  headlineXl: { fontFamily: fonts.display, fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  headlineLg: { fontFamily: fonts.heading, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  headlineMd: { fontFamily: fonts.heading, fontSize: 18, lineHeight: 24, letterSpacing: -0.15 },
  headlineSm: { fontFamily: fonts.heading, fontSize: 15.5, lineHeight: 21, letterSpacing: -0.1 },
  currency: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  bodyXl: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  bodyLg: { fontFamily: fonts.body, fontSize: 14.5, lineHeight: 21 },
  body: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  bodySm: { fontFamily: fonts.body, fontSize: 11.5, lineHeight: 16 },
  labelLg: { fontFamily: fonts.label, fontSize: 13, lineHeight: 18, letterSpacing: 0.1 },
  labelMd: { fontFamily: fonts.label, fontSize: 11.5, lineHeight: 16, letterSpacing: 0.2 },
  labelSm: { fontFamily: fonts.labelBold, fontSize: 9.5, lineHeight: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
} satisfies Record<string, Variant>;

/**
 * Upper bound for the OS "font size" accessibility setting. Text still grows for users who need it,
 * but a 1.3–1.5x Android setting no longer breaks cards, buttons and the tab dock.
 */
export const MAX_FONT_SCALE = 1.2;

export type TypeVariant = keyof typeof type;

export const radius = { sm: 4, md: 8, lg: 12, card: 16, hero: 24, full: 9999 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 40 } as const;

/**
 * Elevation levels from DESIGN.md, tinted with midnight navy rather than black. React Native 0.86+ renders
 * CSS `boxShadow` natively on iOS and Android (New Architecture), so one definition serves every platform.
 */
export const shadows = {
  card: { boxShadow: '0 4px 20px -2px rgba(11, 30, 61, 0.06), 0 2px 6px -1px rgba(11, 30, 61, 0.03)' },
  raised: { boxShadow: '0 12px 32px -4px rgba(11, 30, 61, 0.12), 0 4px 12px -2px rgba(11, 30, 61, 0.05)' },
  overlay: { boxShadow: '0 24px 54px -8px rgba(11, 30, 61, 0.2), 0 8px 20px -4px rgba(11, 30, 61, 0.08)' },
  gold: { boxShadow: '0 6px 20px -2px rgba(197, 160, 89, 0.4)' },
} as const;

export const gradients = {
  gold: [colors.gold, colors.goldBright] as const,
  goldDeep: ['#8A6A2F', colors.gold, colors.goldLight] as const,
  navy: [colors.navy, colors.navyRaised] as const,
  navyHero: ['rgba(11,30,61,0.15)', 'rgba(11,30,61,0.92)'] as const,
};

/** Minimum touch target on mobile (DESIGN.md: 48px for fast field use). */
export const touch = 48;
