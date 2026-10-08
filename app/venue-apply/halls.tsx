import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/src/components/ui/Screen';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Checkbox, Chip, PageHeader, StepIndicator } from '@/src/components/ui/Misc';
import { Colors, Spacing } from '@/src/theme';
import { useVenueApply } from '@/src/context/VenueApplyContext';

const HALLS = [1, 2, 3, 4];
const CAPACITY = [50, 100, 200, 300, 500];
const SERVICES = ['Oshpaz', 'Ofitsiant', 'Dekor', 'Musiqa', 'Foto/Video', 'Avtoturargoh'];

export default function VenueApplyHalls() {
  const { draft, update } = useVenueApply();

  const toggle = (s: string) =>
    update({
      services: draft.services.includes(s) ? draft.services.filter((x) => x !== s) : [...draft.services, s],
    });

  return (
    <Screen
      scroll
      edges={['top', 'left', 'right', 'bottom']}
      footer={<Button title="Keyingi" onPress={() => router.push('/venue-apply/extra')} />}
    >
      <PageHeader title="Ariza qoldirish" subtitle="2. Zal va imkoniyatlar" back />
      <StepIndicator step={2} />
      <Card>
        <Text style={styles.label}>
          Zallar soni <Text style={styles.req}>*</Text>
        </Text>
        <View style={styles.chips} accessibilityRole="radiogroup">
          {HALLS.map((n) => (
            <Chip
              key={n}
              label={n === 4 ? '4+' : String(n)}
              active={draft.halls === n}
              onPress={() => update({ halls: n })}
            />
          ))}
        </View>

        <Text style={styles.label}>
          Stol sig&apos;imi (kishi) <Text style={styles.req}>*</Text>
        </Text>
        <View style={styles.chips} accessibilityRole="radiogroup">
          {CAPACITY.map((n) => (
            <Chip
              key={n}
              label={n === 500 ? '500+' : String(n)}
              active={draft.capacity === n}
              onPress={() => update({ capacity: n })}
            />
          ))}
        </View>

        <Text style={styles.label}>Qo&apos;shimcha xizmatlar</Text>
        {SERVICES.map((s) => (
          <Checkbox key={s} label={s} checked={draft.services.includes(s)} onToggle={() => toggle(s)} />
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  req: { color: Colors.danger },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.lg },
});
