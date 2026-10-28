import { Platform } from 'react-native';

export const theme = {
  colors: {
    background: '#090B0F',
    surface: '#12161D',
    surfaceAlt: '#191F28',
    border: '#262D38',
    primary: '#C7FF35',
    purple: '#A78BFA',
    red: '#E05252',
    orange: '#E99A35',
    green: '#37A66B',
    text: '#F4F6FA',
    muted: '#929BAA',
    shadow: '#000000',
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  radii: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    pill: 999,
  },
  typography: {
    display: 34,
    h1: 28,
    h2: 22,
    body: 15,
    label: 12,
    mono: 13,
  },
};

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: '#C7FF35',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#C7FF35',
  },
  dark: {
    text: '#ECEDEE',
    background: '#090B0F',
    tint: '#C7FF35',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#C7FF35',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
