export const Colors = {
  // Backgrounds
  bg: '#0B0D0C',
  bgCard: '#171A18',
  bgCardAlt: '#1E221F',
  bgInput: '#232724',

  // Accent
  accent: '#C2E653',
  accentDim: '#AACB43',
  accentBg: '#C2E65314',

  // Danger
  danger: '#FF6B6B',
  dangerBg: '#FF6B6B14',

  // Text
  textPrimary: '#F3F5EF',
  textSecondary: '#A1A69E',
  textMuted: '#71776F',
  textAccent: '#C2E653',

  // UI
  border: '#292E2A',
  borderAccent: '#C2E653',
  dot: '#C2E653',
  dotInactive: '#292E2A',

  // Chart
  chartLine: '#C2E653',
  chartGrid: '#292E2A',
} as const;

export const MotionDuration = {
  fast: 160,
  standard: 220,
} as const;

export const TabBarMetrics = {
  height: 68,
  horizontalInset: 12,
  bottomGap: 8,
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
