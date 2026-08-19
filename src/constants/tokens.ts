export const Colors = {
  // Backgrounds
  bg: '#080A09',
  bgElevated: '#0E110F',
  bgCard: '#141714',
  bgCardAlt: '#1A1E1A',
  bgInput: '#202520',

  // Accent
  accent: '#A5FF01',
  accentDim: '#86CF16',
  accentSoft: '#95AE67',
  accentBg: '#A5FF0114',
  accentBorder: '#A5FF0138',

  // Danger
  danger: '#FF716B',
  dangerBg: '#FF716B14',

  // Text
  textPrimary: '#F7F8F3',
  textSecondary: '#B1B6AD',
  textMuted: '#72786F',
  textAccent: '#A5FF01',

  // UI
  border: '#292E29',
  borderStrong: '#3A4139',
  borderAccent: '#A5FF01',
  dot: '#A5FF01',
  dotInactive: '#292E29',

  // Chart
  chartLine: '#A5FF01',
  chartGrid: '#292E29',
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
  lg: 18,
  xl: 22,
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

export const FontFamily = {
  display: 'Georgia',
  data: 'Menlo',
} as const;
