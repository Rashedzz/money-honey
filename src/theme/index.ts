/**
 * Executive Wealth Management Theme
 * Inspired by world-class financial platforms (Stripe, Mercury, Monarch, Quicken Simplifi)
 * Whole Software: Crisp Neutral Slate Canvas (#F8FAFC) & Pure White Cards (#FFFFFF)
 * Primary Action & Navigation: Deep Obsidian Navy (#0F172A) & Royal Slate (#1E293B)
 * Semantic Financial Colors: Emerald (#16A34A) for Inflow/Gain, Crimson (#DC2626) for Outflow/Debt
 */
export const Colors = {
  // Whole Software Canvas & Surfaces
  bg: '#F8FAFC',           // Crisp Neutral Slate 50 canvas
  bgLight: '#F1F5F9',      // Slate 100 subtle section surface
  bgCard: '#FFFFFF',       // Pure white card surfaces
  bgCardHover: '#F8FAFC',  // Subtle card hover
  bgSurface: '#F8FAFC',    // Elevated neutral surface
  bgElevated: '#FFFFFF',   // White elevated container
  bgInput: '#F8FAFC',      // Crisp input background
  bgGlass: 'rgba(255, 255, 255, 0.96)',

  // Navigation Bar (Deep Executive Navy, Crisp White Text)
  bgSidebar: '#0F172A',       // Deep Slate 900
  sidebarBorder: '#1E293B',   // Slate 800 Divider
  sidebarText: '#FFFFFF',     // Pure Crisp White Font
  sidebarTextMuted: '#94A3B8', // Slate 400 Inactive
  sidebarActiveBg: '#2563EB', // Clean Royal Blue Selected Indicator
  sidebarActiveText: '#FFFFFF',
  sidebarHoverBorder: '#334155',
  sidebarHoverText: '#FFFFFF',
  sidebarHoverBg: 'rgba(255, 255, 255, 0.06)',

  // Brand & Semantic Accents
  primary: '#0F172A',      // Deep Executive Navy primary action
  primaryDark: '#020617',  // Slate 950
  primaryLight: '#2563EB', // Royal Blue 600 interactive highlight
  primaryGlow: 'rgba(15, 23, 42, 0.08)',
  cyan: '#0284C7',         // Informational accent
  secondary: '#334155',    // Neutral Slate 700 secondary
  accent: '#D97706',       // Warm Amber warning/highlight
  gold: '#D97706',
  goldLight: '#F59E0B',
  danger: '#DC2626',       // Financial Outflow / Debt Crimson
  success: '#16A34A',      // Financial Inflow / Profit Emerald

  // Typography
  textPrimary: '#0F172A',  // Slate 900 crisp heading & numbers
  textSecondary: '#334155', // Slate 700 readable body
  textMuted: '#64748B',    // Slate 500 labels & helper text
  textOnDark: '#FFFFFF',   // White text

  // Borders & Dividers
  border: '#E2E8F0',       // Clean Slate 200 border (replaces sky blue)
  borderLight: '#F1F5F9',  // Slate 100 divider
  borderActive: '#0F172A', // Executive focus border

  // Gradients (Subtle, clean, non-rainbow)
  gradientGreen: ['#16A34A', '#15803D'],
  gradientGold: ['#D97706', '#B45309'],
  gradientPurple: ['#1E293B', '#0F172A'],
  gradientDanger: ['#DC2626', '#B91C1C'],
  gradientCard: ['#FFFFFF', '#FFFFFF'],
  gradientHero: ['#F8FAFC', '#F1F5F9'],
};

export const Typography = {
  displayXL: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -0.9, color: '#0F172A' },
  displayL: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.6, color: '#0F172A' },
  displayM: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3, color: '#0F172A' },
  heading: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.2, color: '#0F172A' },
  subheading: { fontSize: 15, fontWeight: '600' as const, color: '#0F172A' },
  label: { fontSize: 11.5, fontWeight: '700' as const, letterSpacing: 0.6, textTransform: 'uppercase' as const, color: '#64748B' },
  body: { fontSize: 14.5, fontWeight: '400' as const, lineHeight: 21, color: '#334155' },
  bodyBold: { fontSize: 14.5, fontWeight: '700' as const, color: '#0F172A' },
  caption: { fontSize: 12.5, fontWeight: '500' as const, color: '#64748B' },
};

export const Spacing = { xs: 4, sm: 8, md: 14, lg: 20, xl: 28, xxl: 36 };
export const Radius = { sm: 8, md: 10, lg: 14, xl: 18, full: 999 };

export const Shadows = {
  glow: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  goldGlow: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
};
