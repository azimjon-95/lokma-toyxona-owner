import Constants from 'expo-constants';

/** Store talablari: maxfiylik siyosati va yordam havolalari ilova ichida bo'lishi shart. */
export const APP_CONFIG = {
  privacyPolicyUrl: 'https://lokma.uz/privacy',
  termsUrl: 'https://lokma.uz/terms',
  supportPhone: '+998712000000',
  supportTelegram: 'lokma_support',
  version: Constants.expoConfig?.version ?? '1.0.0',
} as const;
