import { Alert, Platform } from 'react-native';

/** Alert.alert React Native Web'da ishlamaydi — veb uchun brauzer dialoglari */
export function notify(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    globalThis.alert?.(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

/** Ha/yo'q so'rovi → true/false */
export function confirm(title: string, message: string, o: { ok?: string; destructive?: boolean } = {}): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(globalThis.confirm?.(`${title}\n\n${message}`) ?? false);
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Bekor qilish', style: 'cancel', onPress: () => resolve(false) },
        { text: o.ok ?? 'Ha', style: o.destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
