export const Colors = {
  // Backgrounds - Modern Obsidian & Slate Palette
  bg: '#0B0F19',           // Sleek obsidian navy canvas
  bgCard: '#111827',       // Deep rich card surface
  bgElevated: '#1E293B',   // Elevated contrast container
  bgSurface: '#161F30',    // Secondary surface
  bgGlass: 'rgba(255, 255, 255, 0.03)',
  
  // Brand Accents
  primary: '#00F5A0',      // Vibrant emerald neon
  primaryDark: '#10B981',  // Solid emerald
  primaryGlow: 'rgba(0, 245, 160, 0.25)',
  cyan: '#00D2FF',         // Electric cyan
  secondary: '#8B5CF6',    // Modern violet
  accent: '#F59E0B',       // Warm gold / amber
  danger: '#EF4444',       // Crisp crimson
  
  // High-Contrast Typography
  textPrimary: '#F8FAFC',  // Pure crisp white
  textSecondary: '#94A3B8', // Readable clean slate
  textMuted: '#64748B',    // Subtle label slate
  
  // Borders & Dividers
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.14)',
  borderActive: 'rgba(0, 245, 160, 0.45)',
  
  // Navigation States
  navActiveBg: 'rgba(0, 245, 160, 0.14)',
  navHoverBg: 'rgba(255, 255, 255, 0.06)',
  
  // Rich Gradients
  gradientGreen: ['#00F5A0', '#00D2FF'],
  gradientPurple: ['#8B5CF6', '#D946EF'],
  gradientAmber: ['#F59E0B', '#EF4444'],
  gradientDanger: ['#EF4444', '#991B1B'],
  gradientCard: ['#131B2E', '#0F1626'],
  gradientHero: ['#162238', '#0D1322'],
};

export const Typography = {
  // Ultra-crisp typography
  displayXL: { fontSize: 38, fontWeight: '800' as const, letterSpacing: -1.2, color: '#F8FAFC' },
  displayL: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.8, color: '#F8FAFC' },
  displayM: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.4, color: '#F8FAFC' },
  heading: { fontSize: 17, fontWeight: '700' as const, letterSpacing: -0.2, color: '#F8FAFC' },
  subheading: { fontSize: 14, fontWeight: '600' as const, color: '#F8FAFC' },
  label: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 1.1, textTransform: 'uppercase' as const, color: '#94A3B8' },
  body: { fontSize: 13, fontWeight: '400' as const, lineHeight: 19, color: '#94A3B8' },
  bodyBold: { fontSize: 13, fontWeight: '700' as const, color: '#F8FAFC' },
  caption: { fontSize: 11, fontWeight: '500' as const, color: '#64748B' },
};

export const Spacing = { xs: 4, sm: 8, md: 14, lg: 20, xl: 28, xxl: 40 };
export const Radius = { sm: 6, md: 10, lg: 14, xl: 20, full: 999 };

export const Shadows = {
  glow: {
    shadowColor: '#00F5A0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 6,
  },
};
