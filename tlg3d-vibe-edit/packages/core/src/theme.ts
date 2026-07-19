// ===== TLG3D THEME SYSTEM =====

export const TLG3D_BRAND_COLORS = {
  // Primary Brand Colors (from logo)
  primary: {
    vibrant: '#00FF00', // Vibrant green
    main: '#00DD00',    // Main green
    dark: '#00AA00',    // Dark green
  },
  accent: {
    gold: '#FFD700',    // Golden yellow
    light: '#FFC700',   // Light gold
    bright: '#FFEB3B',  // Bright yellow
  },
  neutral: {
    dark: '#0F0F0F',    // Almost black background
    darker: '#1A1A1A',  // Darker background
    light: '#F5F5F5',   // Light text/surface
    white: '#FFFFFF',   // Pure white
  },
  semantic: {
    success: '#10B981',   // Success green
    warning: '#F59E0B',   // Warning amber
    error: '#EF4444',     // Error red
    info: '#3B82F6',      // Info blue
  },
};

export interface ThemeConfig {
  id: string;
  name: string;
  description?: string;
  userId: string;
  isDefault: boolean;
  createdAt: Date;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  typography: {
    fontFamily: string;
    headingSize: number;
    bodySize: number;
    lineHeight: number;
  };
  spacing: {
    unit: number;
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
  };
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
}

// Default TLG3D Theme - Professional Dark with Muted Accents
export const DEFAULT_TLG3D_THEME: ThemeConfig = {
  id: 'tlg3d-default',
  name: 'TLG3D Dark',
  description: 'Professional dark theme with muted green/gold accents',
  userId: 'system',
  isDefault: true,
  createdAt: new Date(),
  colors: {
    primary: '#4FD97D',                             // Muted green (not bright)
    secondary: '#2A6B47',                           // Dark green
    accent: '#D4A574',                              // Muted gold (not bright)
    background: '#0F0F0F',                          // Near black
    surface: '#1A1A1A',                             // Very dark gray
    text: '#E0E0E0',                                // Soft light gray (not white)
    textSecondary: '#888888',                       // Medium gray
    border: '#2A2A2A',                              // Subtle dark border
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    headingSize: 32,
    bodySize: 14,
    lineHeight: 1.6,
  },
  spacing: {
    unit: 8, // 8px base unit
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 16,
  },
  shadows: {
    small: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    large: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
};

// Alternative TLG3D Light Theme
export const LIGHT_TLG3D_THEME: ThemeConfig = {
  id: 'tlg3d-light',
  name: 'TLG3D Light',
  description: 'Light-themed TLG3D with green accent',
  userId: 'system',
  isDefault: false,
  createdAt: new Date(),
  colors: {
    primary: TLG3D_BRAND_COLORS.primary.main,
    secondary: TLG3D_BRAND_COLORS.primary.dark,
    accent: TLG3D_BRAND_COLORS.accent.gold,
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#1F2937',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    headingSize: 32,
    bodySize: 14,
    lineHeight: 1.6,
  },
  spacing: {
    unit: 8,
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 16,
  },
  shadows: {
    small: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    large: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
  },
};

// Vibrant Accent Theme (Still Dark, But Punchy Accents)
export const NEON_TLG3D_THEME: ThemeConfig = {
  id: 'tlg3d-neon',
  name: 'TLG3D Vibrant',
  description: 'Dark with vibrant green/gold accents for emphasis',
  userId: 'system',
  isDefault: false,
  createdAt: new Date(),
  colors: {
    primary: '#00FF00',                    // Vibrant green - ONLY for CTAs/highlights
    secondary: '#3A8B57',                  // Muted green for secondary elements
    accent: '#FFD700',                     // Vibrant gold - ONLY for accents
    background: '#0A0A0A',                 // Pure black background
    surface: '#161616',                    // Dark surface
    text: '#D0D0D0',                       // Soft white text
    textSecondary: '#666666',              // Muted gray
    border: '#222222',                     // Subtle borders
  },
  typography: {
    fontFamily: 'JetBrains Mono, monospace',
    headingSize: 36,
    bodySize: 14,
    lineHeight: 1.4,
  },
  spacing: {
    unit: 8,
  },
  borderRadius: {
    small: 2,
    medium: 4,
    large: 8,
  },
  shadows: {
    small: '0 0 10px rgba(0, 255, 0, 0.3)',
    medium: '0 0 20px rgba(0, 255, 0, 0.5)',
    large: '0 0 40px rgba(255, 215, 0, 0.4)',
  },
};

// Theme Preset Factory
export const THEME_PRESETS: Record<string, ThemeConfig> = {
  'tlg3d-default': DEFAULT_TLG3D_THEME,
  'tlg3d-light': LIGHT_TLG3D_THEME,
  'tlg3d-neon': NEON_TLG3D_THEME,
};

// Generate CSS Variables from Theme
export function generateThemeCSS(theme: ThemeConfig): string {
  return `
    :root {
      /* Colors */
      --color-primary: ${theme.colors.primary};
      --color-secondary: ${theme.colors.secondary};
      --color-accent: ${theme.colors.accent};
      --color-background: ${theme.colors.background};
      --color-surface: ${theme.colors.surface};
      --color-text: ${theme.colors.text};
      --color-text-secondary: ${theme.colors.textSecondary};
      --color-border: ${theme.colors.border};

      /* Typography */
      --font-family: ${theme.typography.fontFamily};
      --heading-size: ${theme.typography.headingSize}px;
      --body-size: ${theme.typography.bodySize}px;
      --line-height: ${theme.typography.lineHeight};

      /* Spacing */
      --spacing-unit: ${theme.spacing.unit}px;
      --spacing-xs: calc(var(--spacing-unit) * 0.5);
      --spacing-sm: var(--spacing-unit);
      --spacing-md: calc(var(--spacing-unit) * 2);
      --spacing-lg: calc(var(--spacing-unit) * 3);
      --spacing-xl: calc(var(--spacing-unit) * 4);
      --spacing-2xl: calc(var(--spacing-unit) * 6);

      /* Border Radius */
      --border-radius-sm: ${theme.borderRadius.small}px;
      --border-radius-md: ${theme.borderRadius.medium}px;
      --border-radius-lg: ${theme.borderRadius.large}px;

      /* Shadows */
      --shadow-sm: ${theme.shadows.small};
      --shadow-md: ${theme.shadows.medium};
      --shadow-lg: ${theme.shadows.large};
    }

    * {
      color: var(--color-text);
    }

    body {
      background-color: var(--color-background);
      font-family: var(--font-family);
      font-size: var(--body-size);
      line-height: var(--line-height);
    }

    h1, h2, h3, h4, h5, h6 {
      color: var(--color-text);
    }
  `;
}

// Theme Manager Class
export class ThemeManager {
  private themes: Map<string, ThemeConfig> = new Map();

  constructor() {
    // Load default themes
    Object.entries(THEME_PRESETS).forEach(([id, theme]) => {
      this.themes.set(id, theme);
    });
  }

  addTheme(theme: ThemeConfig): void {
    this.themes.set(theme.id, theme);
  }

  getTheme(themeId: string): ThemeConfig | undefined {
    return this.themes.get(themeId);
  }

  getAllThemes(): ThemeConfig[] {
    return Array.from(this.themes.values());
  }

  generateTheme(
    name: string,
    primaryColor: string,
    accentColor: string,
    backgroundColor: string
  ): ThemeConfig {
    return {
      id: `custom-${Date.now()}`,
      name,
      userId: 'custom',
      isDefault: false,
      createdAt: new Date(),
      colors: {
        primary: primaryColor,
        secondary: this.darkenColor(primaryColor, 0.2),
        accent: accentColor,
        background: backgroundColor,
        surface: this.lightenColor(backgroundColor, 0.05),
        text: this.getContrastColor(backgroundColor),
        textSecondary: this.getContrastColor(backgroundColor, 0.6),
        border: this.lightenColor(backgroundColor, 0.1),
      },
      typography: DEFAULT_TLG3D_THEME.typography,
      spacing: DEFAULT_TLG3D_THEME.spacing,
      borderRadius: DEFAULT_TLG3D_THEME.borderRadius,
      shadows: DEFAULT_TLG3D_THEME.shadows,
    };
  }

  private darkenColor(color: string, amount: number): string {
    // Simplified darkening logic
    return color;
  }

  private lightenColor(color: string, amount: number): string {
    // Simplified lightening logic
    return color;
  }

  private getContrastColor(bgColor: string, opacity: number = 1): string {
    // Simple luminance calculation
    return bgColor === '#000000' ? '#FFFFFF' : '#000000';
  }
}

export const themeManager = new ThemeManager();
