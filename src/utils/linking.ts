import { Alert, Linking } from 'react-native';
import { digitsOnly } from './format';

async function open(url: string, fallback?: string) {
  try {
    await Linking.openURL(url);
  } catch {
    if (fallback) {
      try {
        await Linking.openURL(fallback);
        return;
      } catch {
        // fallthrough
      }
    }
    Alert.alert('Ochib bo\'lmadi', 'Qurilmada mos ilova topilmadi.');
  }
}

export const callPhone = (e164: string) => open(`tel:+${digitsOnly(e164)}`);

/** Telegram ilovasi bo'lsa — ilovada, bo'lmasa — brauzerda ochadi. */
export const openTelegramByPhone = (e164: string) =>
  open(`tg://resolve?phone=${digitsOnly(e164)}`, `https://t.me/+${digitsOnly(e164)}`);

export const openTelegramUser = (username: string) =>
  open(`tg://resolve?domain=${username}`, `https://t.me/${username}`);

export const openUrl = (url: string) => open(url);
