import { ThemeType } from '../types';

/**
 * Theme Configuration System
 * Defines colors, fonts, and layout styles for each theme
 */

export interface ThemeConfig {
  name: string;
  displayName: string;
  emoji: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    textSecondary: string;
    border: string;
    codeBackground: string;
    tableBorder: string;
  };
  fonts: {
    heading: string;
    body: string;
    code: string;
  };
  layout: {
    padding: string;
    borderRadius: string;
    shadowIntensity: 'none' | 'light' | 'medium' | 'strong';
  };
}

/**
 * Academic Theme - Professional, scholarly design
 */
const academicTheme: ThemeConfig = {
  name: 'academic',
  displayName: 'Academic',
  emoji: '🎓',
  colors: {
    primary: '#1e3a8a', // Deep blue
    secondary: '#3b82f6', // Sky blue
    accent: '#f59e0b', // Amber
    background: '#ffffff',
    text: '#1f2937',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    codeBackground: '#f3f4f6',
    tableBorder: '#d1d5db',
  },
  fonts: {
    heading: "'Merriweather', 'Georgia', serif",
    body: "'Source Sans Pro', 'Arial', sans-serif",
    code: "'Consolas', 'Monaco', monospace",
  },
  layout: {
    padding: '60px',
    borderRadius: '8px',
    shadowIntensity: 'light',
  },
};

/**
 * Doraemon Theme - Cute, playful, colorful design
 */
const doraemonTheme: ThemeConfig = {
  name: 'doraemon',
  displayName: 'Doraemon',
  emoji: '🤖',
  colors: {
    primary: '#0ea5e9', // Doraemon blue
    secondary: '#fbbf24', // Yellow (bell)
    accent: '#ef4444', // Red (nose)
    background: '#fef3c7', // Light yellow
    text: '#1e3a8a',
    textSecondary: '#3b82f6',
    border: '#93c5fd',
    codeBackground: '#e0f2fe',
    tableBorder: '#7dd3fc',
  },
  fonts: {
    heading: "'Comic Sans MS', 'Arial Rounded MT Bold', cursive",
    body: "'Segoe UI', 'Helvetica Neue', sans-serif",
    code: "'Courier New', monospace",
  },
  layout: {
    padding: '50px',
    borderRadius: '20px',
    shadowIntensity: 'medium',
  },
};

/**
 * Minimalist Theme - Clean, simple, modern design
 */
const minimalistTheme: ThemeConfig = {
  name: 'minimalist',
  displayName: 'Minimalist',
  emoji: '✨',
  colors: {
    primary: '#0f172a', // Dark slate
    secondary: '#64748b', // Slate gray
    accent: '#06b6d4', // Cyan
    background: '#ffffff',
    text: '#334155',
    textSecondary: '#94a3b8',
    border: '#e2e8f0',
    codeBackground: '#f8fafc',
    tableBorder: '#cbd5e1',
  },
  fonts: {
    heading: "'Inter', 'Helvetica Neue', sans-serif",
    body: "'Inter', 'Helvetica Neue', sans-serif",
    code: "'Fira Code', 'Monaco', monospace",
  },
  layout: {
    padding: '70px',
    borderRadius: '0px',
    shadowIntensity: 'none',
  },
};

/**
 * Corporate Theme - Professional, business-appropriate design
 */
const corporateTheme: ThemeConfig = {
  name: 'corporate',
  displayName: 'Corporate',
  emoji: '💼',
  colors: {
    primary: '#1e40af', // Business blue
    secondary: '#475569', // Slate gray
    accent: '#dc2626', // Corporate red
    background: '#f9fafb',
    text: '#111827',
    textSecondary: '#6b7280',
    border: '#d1d5db',
    codeBackground: '#f3f4f6',
    tableBorder: '#9ca3af',
  },
  fonts: {
    heading: "'Roboto', 'Helvetica', sans-serif",
    body: "'Open Sans', 'Arial', sans-serif",
    code: "'Roboto Mono', 'Consolas', monospace",
  },
  layout: {
    padding: '60px',
    borderRadius: '4px',
    shadowIntensity: 'light',
  },
};

/**
 * Creative Theme - Vibrant, artistic, unique design
 */
const creativeTheme: ThemeConfig = {
  name: 'creative',
  displayName: 'Creative',
  emoji: '🎨',
  colors: {
    primary: '#9333ea', // Purple
    secondary: '#ec4899', // Pink
    accent: '#f59e0b', // Orange
    background: '#fdf4ff', // Light purple
    text: '#581c87',
    textSecondary: '#a855f7',
    border: '#e9d5ff',
    codeBackground: '#faf5ff',
    tableBorder: '#d8b4fe',
  },
  fonts: {
    heading: "'Poppins', 'Montserrat', sans-serif",
    body: "'Nunito', 'Lato', sans-serif",
    code: "'JetBrains Mono', 'Fira Code', monospace",
  },
  layout: {
    padding: '55px',
    borderRadius: '16px',
    shadowIntensity: 'strong',
  },
};

/**
 * Theme Registry
 */
export const ThemeConfigs: Record<ThemeType, ThemeConfig> = {
  academic: academicTheme,
  doraemon: doraemonTheme,
  minimalist: minimalistTheme,
  corporate: corporateTheme,
  creative: creativeTheme,
};

/**
 * Get theme configuration by type
 */
export function getThemeConfig(theme: ThemeType): ThemeConfig {
  return ThemeConfigs[theme] || minimalistTheme;
}

/**
 * Generate CSS shadow based on intensity
 */
export function generateShadow(intensity: 'none' | 'light' | 'medium' | 'strong'): string {
  const shadows = {
    none: 'none',
    light: '0 1px 3px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.1)',
    strong: '0 10px 15px rgba(0, 0, 0, 0.15)',
  };
  return shadows[intensity];
}
