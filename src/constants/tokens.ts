export const Colors = {
  // Backgrounds
  bg: '#0a0a0a',
  bgCard: '#161616',
  bgCardAlt: '#1c1c1c',
  bgInput: '#222222',

  // Accent
  accent: '#c8f03a',       // lime green — primary CTA, active states
  accentDim: '#8aaa20',    // dimmed accent for secondary
  accentBg: '#1e2a00',     // accent tinted background

  // Danger
  danger: '#e05252',
  dangerBg: '#2a0a0a',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#888888',
  textMuted: '#555555',
  textAccent: '#c8f03a',

  // UI
  border: '#2a2a2a',
  borderAccent: '#c8f03a',
  dot: '#c8f03a',
  dotInactive: '#333333',

  // Chart
  chartLine: '#c8f03a',
  chartGrid: '#222222',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
  xxxl: 36,
  display: 48,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};
