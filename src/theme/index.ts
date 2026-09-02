/**
 * Sky Blue Executive Fintech Theme
 * Vibrant Sky Blue 100 Canvas + Sky 700 Sidebar + Clean White Cards
 * Significantly Increased Font Sizes & Menu Sizing
 */
export const Colors = {
  // Backgrounds - Modern Sky Blue Palette
  bg: '#E0F2FE',           // Pure Sky Blue 100 canvas (whole software)
  bgLight: '#F0F9FF',      // Sky Blue 50
  bgSidebar: '#0369A1',    // Deep Royal Sky 700 sidebar
  bgSidebarActive: '#0284C7', // Sky 600 active menu
  bgCard: '#FFFFFF',       // Clean white card surfaces
  bgCardHover: '#F8FAFC',  // Subtle card hover
  bgSurface: '#F0F9FF',    // Elevated sky surface
  bgElevated: '#FFFFFF',   // White elevated container
  bgInput: '#FFFFFF',      // Crisp input background
  bgGlass: 'rgba(255, 255, 255, 0.85)',
  
  // Brand Accents - Sky Blue & Vibrant Accents
  primary: '#0284C7',      // Sky Blue 600 primary
  primaryDark: '#0369A1',  // Sky Blue 700
  primaryLight: '#38BDF8', // Sky Blue 400
  primaryGlow: 'rgba(2, 132, 199, 0.25)',
  cyan: '#0EA5E9',         // Sky 500
  secondary: '#6366F1',    // Indigo 500
  accent: '#F59E0B',       // Amber 500
  danger: '#EF4444',       // Rose 500
  success: '#10B981',      // Emerald 500
  
  // High-Contrast Dark Slate Typography (maximum readability on light/sky)
  textPrimary: '#0F172A',  // Slate 900 crisp heading & numbers
  textSecondary: '#334155', // Slate 700 readable body
  textMuted: '#64748B',    // Slate 500 labels
  textOnDark: '#FFFFFF',   // White text on sidebar/badges
  
  // Crisp Borders & Dividers
  border: '#BAE6FD',       // Sky 200 border
  borderLight: '#E2E8F0',  // Slate 200
  borderActive: '#0284C7', // Sky 600
  
  // Navigation States
  navActiveBg: 'rgba(255, 255, 255, 0.22)',
  navHoverBg: 'rgba(255, 255, 255, 0.12)',
  
  // Gradients
  gradientGreen: ['#0284C7', '#38BDF8'],
  gradientPurple: ['#6366F1', '#A855F7'],
  gradientAmber: ['#F59E0B', '#EF4444'],
  gradientDanger: ['#EF4444', '#DC2626'],
  gradientCard: ['#FFFFFF', '#F8FAFC'],
  gradientHero: ['#E0F2FE', '#BAE6FD'],
};

export const Typography = {
  // Significantly increased font sizes across the whole software
  displayXL: { fontSize: 38, fontWeight: '800' as const, letterSpacing: -1.0, color: '#0F172A' },
  displayL: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.6, color: '#0F172A' },
  displayM: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3, color: '#0F172A' },
  heading: { fontSize: 19, fontWeight: '700' as const, letterSpacing: -0.2, color: '#0F172A' },
  subheading: { fontSize: 16, fontWeight: '600' as const, color: '#0F172A' },
  label: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 1.0, textTransform: 'uppercase' as const, color: '#64748B' },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22, color: '#334155' },
  bodyBold: { fontSize: 15, fontWeight: '700' as const, color: '#0F172A' },
  caption: { fontSize: 13, fontWeight: '500' as const, color: '#64748B' },
};

export const Spacing = { xs: 4, sm: 8, md: 14, lg: 20, xl: 28, xxl: 36 };
export const Radius = { sm: 8, md: 12, lg: 16, xl: 20, full: 999 };

export const Shadows = {
  glow: {
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
  },
  card: {
    shadowColor: '#0369A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
};
