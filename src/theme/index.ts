export const Colors = {
  // Backgrounds
  bg: '#080B14',           // Deep space black
  bgCard: '#0F1320',       // Card surface
  bgElevated: '#161C2D',   // Elevated surface
  bgGlass: 'rgba(255,255,255,0.04)',
  
  // Brand
  primary: '#00E5B3',      // Mint/teal — money green
  primaryGlow: 'rgba(0,229,179,0.25)',
  secondary: '#7B6EF6',    // Purple — investments
  accent: '#FFB547',       // Amber — warnings
  danger: '#FF4757',       // Red — overdue
  
  // Text
  textPrimary: '#F0F4FF',
  textSecondary: '#8892A4',
  textMuted: '#4A5568',
  
  // Borders
  border: 'rgba(255,255,255,0.08)',
  borderActive: 'rgba(0,229,179,0.4)',
  
  // Gradients (use expo-linear-gradient)
  gradientGreen: ['#00E5B3', '#00B4D8'],
  gradientPurple: ['#7B6EF6', '#A855F7'],
  gradientAmber: ['#FFB547', '#FF6B35'],
  gradientDanger: ['#FF4757', '#C0392B'],
  gradientCard: ['rgba(15,19,32,0.9)', 'rgba(22,28,45,0.9)'],
};

export const Typography = {
  // Display numbers (balances, amounts)
  displayXL: { fontSize: 42, fontWeight: '700' as const, letterSpacing: -1.5 },
  displayL: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -1 },
  displayM: { fontSize: 24, fontWeight: '600' as const, letterSpacing: -0.5 },
  
  // Labels
  label: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 1.2, textTransform: 'uppercase' as const },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const },
};

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const Radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 };
export const Shadows = {
  glow: {
    shadowColor: '#00E5B3',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 8,
  },
};
