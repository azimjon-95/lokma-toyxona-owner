import { Platform, type ViewStyle } from 'react-native';

/** Design tokens — mockup (Lokma To'yxonalar) asosida. */
export const Colors = {
  primary: '#B8862F',
  primaryDark: '#8E6420',
  primaryLight: '#D9B36A',
  gradientStart: '#CDA35A',
  gradientEnd: '#A9772A',
  goldSoft: '#F6EBD6',
  goldTint: '#FBF3E4',

  background: '#FBF7F0',
  surface: '#FFFFFF',
  surfaceMuted: '#F6F1E8',
  inputBg: '#FFFFFF',
  border: '#ECE3D3',
  borderStrong: '#DCCFB8',

  text: '#1F1B16',
  textSecondary: '#6B645A',
  textMuted: '#A39A8C',
  white: '#FFFFFF',

  success: '#16895A',
  successDark: '#0E7049',
  successBg: '#E5F4EC',
  warning: '#E08A1E',
  warningBg: '#FDF0DD',
  danger: '#D93A3A',
  dangerBg: '#FCE8E8',
  info: '#1E6FE8',
  infoBg: '#E6EFFD',
  purple: '#6E56CF',
  purpleBg: '#EEEAFB',

  overlay: 'rgba(20, 14, 6, 0.45)',
  tabInactive: '#A39A8C',
} as const;

export const Spacing = { xxs: 2, xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const Radius = { sm: 8, md: 12, lg: 16, xl: 22, full: 999 } as const;

export const Font = {
  h1: 26,
  h2: 22,
  h3: 18,
  body: 15,
  small: 13,
  tiny: 11,
} as const;

export const Shadow: ViewStyle = Platform.select<ViewStyle>({
  ios: {
    shadowColor: '#7A5A20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
  },
  android: { elevation: 2 },
  default: { boxShadow: '0 4px 12px rgba(122,90,32,0.08)' },
}) as ViewStyle;

/** Minimal tap target (Apple HIG 44pt / Material 48dp). */
export const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const;
