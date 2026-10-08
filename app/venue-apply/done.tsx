import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/src/components/ui/Screen';
import { Button } from '@/src/components/ui/Button';
import { IconCircle, StepIndicator } from '@/src/components/ui/Misc';
import { Colors, Spacing } from '@/src/theme';
import { useVenueApply } from '@/src/context/VenueApplyContext';
import { useAuth } from '@/src/context/AuthContext';

export default function VenueApplyDone() {
  const { reset } = useVenueApply();
  const { status } = useAuth();
  return (
    <Screen
      edges={['top', 'left', 'right', 'bottom']}
      contentStyle={styles.center}
      footer={
        <Button
          title="Yopish"
          onPress={() => {
            reset();
            router.dismissTo(status === 'signedIn' ? '/more' : '/login');
          }}
        />
      }
    >
      <StepIndicator step={4} />
      <View style={styles.body}>
        <IconCircle name="checkmark-done" size={88} color={Colors.success} bg={Colors.successBg} style={{ borderColor: '#BFE5D0' }} />
        <Text style={styles.title}>Ariza yuborildi!</Text>
        <Text style={styles.text}>
          Rahmat! Operatorlarimiz 1 ish kuni ichida siz bilan bog&apos;lanib, keyingi qadamlarni tushuntiradi.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center' },
  body: { alignItems: 'center', gap: 12, marginTop: Spacing.lg },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text },
  text: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: Spacing.md },
});
