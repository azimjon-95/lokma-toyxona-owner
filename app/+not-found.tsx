import { router, Stack } from 'expo-router';
import { Screen } from '@/src/components/ui/Screen';
import { Button } from '@/src/components/ui/Button';
import { EmptyState } from '@/src/components/ui/Misc';

export default function NotFoundScreen() {
  return (
    <Screen contentStyle={{ justifyContent: 'center' }} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <EmptyState icon="compass-outline" title="Sahifa topilmadi" hint="Bu havola eskirgan yoki noto'g'ri bo'lishi mumkin." />
      <Button title="Bosh sahifaga qaytish" onPress={() => router.replace('/')} />
    </Screen>
  );
}
