/**
 * Swiss Design System - Design Tokens
 * Based on PHI (Golden Ratio 1.618) for harmonious proportions
 */

// PHI constant for calculations
export const PHI = 1.618;

// Spacing scale based on 8px baseline grid and PHI
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px - base unit
  md: '0.809rem',  // 13px ~ 8 * phi
  lg: '1.309rem',  // 21px ~ 13 * phi
  xl: '2.118rem',  // 34px ~ 21 * phi
  '2xl': '3.427rem', // 55px ~ 34 * phi
  '3xl': '5.545rem', // 89px ~ 55 * phi
} as const;

// Typography scale based on PHI
export const typography = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.309rem',   // 21px ~ 16 * 1.3
  '2xl': '1.618rem', // 26px ~ 16 * phi
  '3xl': '2.618rem', // 42px ~ 26 * phi
  '4xl': '4.236rem', // 68px ~ 42 * phi
} as const;

// Border radius scale based on PHI
export const radius = {
  none: '0',
  sm: '0.309rem',   // 5px
  md: '0.5rem',     // 8px - base
  lg: '0.809rem',   // 13px
  xl: '1.309rem',   // 21px
  '2xl': '2.118rem', // 34px
  full: '9999px',
} as const;

// Line heights for Swiss typography
export const lineHeight = {
  tight: '1.1',
  snug: '1.25',
  normal: '1.5',
  relaxed: '1.618', // PHI
  loose: '2',
} as const;

// Letter spacing for Swiss typography
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '-0.01em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const;

// Transition presets
export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  smooth: '300ms cubic-bezier(0.25, 0.1, 0.25, 1)',
} as const;

// Z-index scale
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  overlay: 30,
  modal: 40,
  popover: 50,
  tooltip: 60,
} as const;
