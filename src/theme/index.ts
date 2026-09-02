/**
 * AFIL Agro Hub / Irisha Modern Executive Theme
 * Slate 950 Obsidian + Agro Emerald 500 Palette
 */
export const Colors = {
  // Backgrounds - Modern Slate & Obsidian (AFIL Agro Hub / Irisha standard)
  bg: '#020617',           // Slate 950 deep canvas
  bgSidebar: '#0F172A',    // Slate 900 sidebar
  bgCard: '#1E293B',       // Slate 800 executive card
  bgCardHover: '#253349',  // Slate 750 hover
  bgSurface: '#151F32',    // Slate surface
  bgElevated: '#1E293B',   // Elevated card
  bgInput: 'rgba(15, 23, 42, 0.6)', // Glass input
  bgGlass: 'rgba(255, 255, 255, 0.03)',
  
  // Brand Accents - AFIL Agro Emerald & Cyan
  primary: '#22C55E',      // Agro Emerald 500
  primaryDark: '#16A34A',  // Emerald 600
  primaryLight: '#4ADE80', // Emerald 400
  primaryGlow: 'rgba(34, 197, 94, 0.25)',
  cyan: '#06B6D4',         // Cyan 500
  secondary: '#8B5CF6',    // Violet 500
  accent: '#F59E0B',       // Amber 500
  danger: '#EF4444',       // Rose 500
  
  // High-Contrast Slate Typography
  textPrimary: '#F8FAFC',  // Slate 50 pure white
  textSecondary: '#94A3B8', // Slate 400 clean body
  textMuted: '#64748B',    // Slate 500 subtle label
  
  // Clean Borders & Dividers
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.14)',
  borderActive: 'rgba(34, 197, 94, 0.5)',
  
  // Navigation States
  navActiveBg: 'rgba(34, 197, 94, 0.14)',
  navHoverBg: 'rgba(255, 255, 255, 0.06)',
  
  // Gradients
  gradientGreen: ['#22C55E', '#06B6D4'],
  gradientPurple: ['#8B5CF6', '#D946EF'],
  gradientAmber: ['#F59E0B', '#EF4444'],
  gradientDanger: ['#EF4444', '#991B1B'],
  gradientCard: ['#1E293B', '#151F32'],
  gradientHero: ['#1E293B', '#0F172A'],
};

export const Typography = {
  displayXL: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -1.0, color: '#F8FAFC' },
  displayL: { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.6, color: '#F8FAFC' },
  displayM: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3, color: '#F8FAFC' },
  heading: { fontSize: 16, fontWeight: '700' as const, letterSpacing: -0.2, color: '#F8FAFC' },
  subheading: { fontSize: 13, fontWeight: '600' as const, color: '#F8FAFC' },
  label: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 1.0, textTransform: 'uppercase' as const, color: '#94A3B8' },
  body: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18, color: '#94A3B8' },
  bodyBold: { fontSize: 13, fontWeight: '700' as const, color: '#F8FAFC' },
  caption: { fontSize: 11, fontWeight: '500' as const, color: '#64748B' },
};

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const Radius = { sm: 6, md: 10, lg: 12, xl: 16, full: 999 };

export const Shadows = {
  glow: {
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
};
