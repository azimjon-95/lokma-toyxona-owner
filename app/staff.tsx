import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '@/src/components/ui/Screen';
import { Card } from '@/src/components/ui/Card';
import { IconCircle, PageHeader } from '@/src/components/ui/Misc';
import { Colors, HIT_SLOP, Spacing } from '@/src/theme';
import { useData } from '@/src/context/DataContext';
import { formatPhone, todayISO } from '@/src/utils/format';
import { callPhone } from '@/src/utils/linking';

export default function StaffScreen() {
  const { staff, bookings } = useData();
  const today = todayISO();

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <PageHeader title="Xodimlar" subtitle="Ishchilar va vazifalar" back />
      <FlatList
        data={staff}
        keyExtractor={(s) => s.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: s }) => {
          const upcoming = bookings.filter(
            (b) => b.staffIds.includes(s.id) && b.date >= today && b.status !== 'cancelled'
          ).length;
          return (
            <Card style={styles.card}>
              <IconCircle name="person-outline" size={44} />
              <View style={styles.flex}>
                <Text style={styles.name}>{s.name}</Text>
                <Text style={styles.role}>{s.role}</Text>
                <Text style={styles.meta}>
                  {formatPhone(s.phone)} · {upcoming} ta tadbir
                </Text>
              </View>
              <Pressable
                onPress={() => callPhone(s.phone)}
                hitSlop={HIT_SLOP}
                accessibilityRole="button"
                accessibilityLabel={`${s.name} ga qo'ng'iroq`}
                style={styles.call}
              >
                <Ionicons name="call" size={16} color={Colors.info} />
              </Pressable>
            </Card>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.sm + 2 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.text },
  role: { fontSize: 13, color: Colors.primaryDark, marginTop: 2, fontWeight: '500' },
  meta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  call: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.infoBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
