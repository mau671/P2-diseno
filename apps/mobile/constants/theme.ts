/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    tint: '#000000',
    icon: '#666666',
    tabIconDefault: '#666666',
    tabIconSelected: '#000000',
    card: '#ffffff',
    cardBorder: '#cccccc',
    inputBackground: '#ffffff',
    inputBorder: '#cccccc',
    primary: '#000000',
    primaryText: '#ffffff',
    secondary: '#f5f5f5',
    secondaryText: '#333333',
    error: '#ff0000',
    success: '#00aa00',
    warning: '#ffaa00',
    overlay: 'rgba(0, 0, 0, 0.5)',
    divider: '#cccccc',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    tint: '#ffffff',
    icon: '#aaaaaa',
    tabIconDefault: '#aaaaaa',
    tabIconSelected: '#ffffff',
    card: '#1a1a1a',
    cardBorder: '#333333',
    inputBackground: '#1a1a1a',
    inputBorder: '#333333',
    primary: '#ffffff',
    primaryText: '#000000',
    secondary: '#2a2a2a',
    secondaryText: '#cccccc',
    error: '#ff4444',
    success: '#44ff44',
    warning: '#ffbb00',
    overlay: 'rgba(255, 255, 255, 0.5)',
    divider: '#333333',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
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
