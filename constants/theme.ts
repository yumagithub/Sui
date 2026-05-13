/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Brand = {
  deepSea: '#1A3A3A',
  turquoise: '#4ABFBF',
  offWhite: '#F5F0E8',
  ryukyu: '#C8A882',
  card: '#FFFFFF',
};

export const Colors = {
  light: {
    text: Brand.deepSea,
    background: Brand.offWhite,
    tint: Brand.turquoise,
    icon: '#687076',
    tabIconDefault: '#A0ABA6',
    tabIconSelected: Brand.turquoise,
    card: Brand.card,
    subText: '#7A8B88',
  },
  dark: {
    text: '#ECEDEE',
    background: '#0F2222',
    tint: Brand.turquoise,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: Brand.turquoise,
    card: '#1E3535',
    subText: '#8FA5A5',
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
