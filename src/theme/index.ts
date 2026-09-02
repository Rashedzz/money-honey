/**
 * Sky Blue Executive Fintech Theme with Solid Black/White/Green/Gold Sidebar
 * Whole Software: Sky Blue 100 (#E0F2FE) Canvas & Clean White Cards
 * Sidebar/Menubar: Pure Black (#000000), White Text, Vibrant Green Selected Button, Golden Hover
 */
export const Colors = {
  // Whole Software Canvas
  bg: '#E0F2FE',           // Pure Sky Blue 100 canvas (whole software)
  bgLight: '#F0F9FF',      // Sky Blue 50
  bgCard: '#FFFFFF',       // Clean white card surfaces
  bgCardHover: '#F8FAFC',  // Subtle card hover
  bgSurface: '#F0F9FF',    // Elevated sky surface
  bgElevated: '#FFFFFF',   // White elevated container
  bgInput: '#FFFFFF',      // Crisp input background
  bgGlass: 'rgba(255, 255, 255, 0.85)',
  
  // Navigation Bar (Solid Black, White Text, Green Button, Gold Hover)
  bgSidebar: '#000000',       // Pure Sleek Black
  sidebarBorder: '#181C26',   // Deep Charcoal Divider
  sidebarText: '#FFFFFF',     // Pure Crisp White Font
  sidebarTextMuted: '#94A3B8', // Slate 400 Inactive
  sidebarActiveBg: '#16A34A', // Vibrant Green Selected Menu Button
  sidebarActiveText: '#FFFFFF', // White text on Green
  sidebarHoverBorder: '#F59E0B', // Golden Hover Border
  sidebarHoverText: '#FBBF24',   // Golden Hover Text
  sidebarHoverBg: 'rgba(245, 158, 11, 0.12)', // Golden Tint Hover
  
  // Brand Accents
  primary: '#0284C7',      // Sky Blue 600 primary
  primaryDark: '#0369A1',  // Sky Blue 700
  primaryLight: '#38BDF8', // Sky Blue 400
  primaryGlow: 'rgba(2, 132, 199, 0.25)',
  cyan: '#0EA5E9',         // Sky 500
  secondary: '#6366F1',    // Indigo 500
  accent: '#F59E0B',       // Amber 500 Gold
  gold: '#F59E0B',         // Golden Accent
  goldLight: '#FBBF24',    // Bright Gold
  danger: '#EF4444',       // Rose 500
  success: '#16A34A',      // Vibrant Green 600
  
  // Typography
  textPrimary: '#0F172A',  // Slate 900 crisp heading & numbers
  textSecondary: '#334155', // Slate 700 readable body
  textMuted: '#64748B',    // Slate 500 labels
  textOnDark: '#FFFFFF',   // White text
  
  // Borders & Dividers
  border: '#BAE6FD',       // Sky 200 border
  borderLight: '#E2E8F0',  // Slate 200
  borderActive: '#0284C7', // Sky 600
  
  // Gradients
  gradientGreen: ['#16A34A', '#22C55E'],
  gradientGold: ['#F59E0B', '#FBBF24'],
  gradientPurple: ['#6366F1', '#A855F7'],
  gradientDanger: ['#EF4444', '#DC2626'],
  gradientCard: ['#FFFFFF', '#F8FAFC'],
  gradientHero: ['#E0F2FE', '#BAE6FD'],
};

export const Typography = {
  // Sizable readable typography
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
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  goldGlow: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
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
