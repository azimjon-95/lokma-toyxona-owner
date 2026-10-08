import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Screen } from '@/src/components/ui/Screen';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { IconCircle, PageHeader } from '@/src/components/ui/Misc';
import { LogoMark } from '@/src/components/ui/Logo';
import { Colors, Spacing } from '@/src/theme';

const BENEFITS: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }[] = [
  { icon: 'grid-outline', text: 'Oson boshqaruv' },
  { icon: 'flash-outline', text: 'Tezkor amallar' },
  { icon: 'layers-outline', text: "Barcha ma'lumotlar bir joyda" },
  { icon: 'shield-checkmark-outline', text: 'Ishonchli va xavfsiz' },
];

export default function VenueApplyIntro() {
  return (
    <Screen
      scroll
      edges={['top', 'left', 'right', 'bottom']}
      footer={<Button title="Ariza qoldirish" onPress={() => router.push('/venue-apply/details')} />}
    >
      <PageHeader title="" back />
      <Card style={styles.hero}>
        <IconCircle name="business-outline" size={52} />
        <Text style={styles.title}>Yangi to&apos;yxona uchun ariza qoldirish</Text>
        <Text style={styles.text}>
          To&apos;yxona ochmoqchimisiz? Biz bilan bog&apos;laning, sizga yordam beramiz.
        </Text>
      </Card>

      <View style={styles.brand}>
        <LogoMark size={44} />
        <Text style={styles.slogan}>Sizning to&apos;yxona biznesingiz endi yanada qulay!</Text>
      </View>

      {BENEFITS.map((b) => (
        <View key={b.text} style={styles.benefit}>
          <IconCircle name={b.icon} size={38} />
          <Text style={styles.benefitText}>{b.text}</Text>
        </View>
      ))}

      <Text style={styles.quote}>Har bir to&apos;y — o&apos;ziga xos hikoya</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'flex-start', gap: 10, padding: Spacing.lg },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text },
  text: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: Spacing.lg, marginBottom: Spacing.md },
  slogan: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.text, lineHeight: 22 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  benefitText: { fontSize: 15, color: Colors.text },
  quote: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontStyle: 'italic',
    fontSize: 18,
    color: Colors.primaryDark,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
