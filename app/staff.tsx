import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Screen } from '@/src/components/ui/Screen';
import { Card } from '@/src/components/ui/Card';
import { EmptyState, IconCircle, PageHeader } from '@/src/components/ui/Misc';
import { PageHeaderAction } from '@/src/components/ui/PageHeaderAction';
import { Colors, HIT_SLOP, Spacing } from '@/src/theme';
import { useData } from '@/src/context/DataContext';
import { useIsOwner } from '@/src/context/AuthContext';
import { PAY_TYPE_LABEL, formatMoney, formatPhone } from '@/src/utils/format';
import { callPhone } from '@/src/utils/linking';

export default function StaffScreen() {
  const { staff, refresh, refreshing } = useData();
  const isOwner = useIsOwner();
  const list = staff.filter((s) => s.active);

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <PageHeader
        title="Xodimlar"
        subtitle="Ishchilar va vazifalar"
        back
        right={isOwner ? <PageHeaderAction icon="person-add-outline" label="Xodim qo'shish" onPress={() => router.push('/employee')} /> : undefined}
      />
      <FlatList
        data={list}
        keyExtractor={(s) => s.id}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={() => void refresh()}
        ListEmptyComponent={<EmptyState icon="people-outline" title="Xodimlar yo'q" hint={isOwner ? "Yuqoridagi tugma bilan xodim qo'shing." : undefined} />}
        renderItem={({ item: s }) => (
          <Card style={styles.card} onPress={isOwner ? () => router.push({ pathname: '/employee', params: { id: s.id } }) : undefined} accessibilityLabel={s.name}>
            <IconCircle name="person-outline" size={44} />
            <View style={styles.flex}>
              <Text style={styles.name}>{s.name}</Text>
              <Text style={styles.role}>{s.position || 'Lavozim kiritilmagan'}</Text>
              <Text style={styles.meta}>
                {s.phone ? `${formatPhone(s.phone)} · ` : ''}
                {s.eventsCount} ta tadbir
              </Text>
              {isOwner && s.rate ? (
                <Text style={styles.meta}>
                  {PAY_TYPE_LABEL[s.payType ?? 'monthly']}: {formatMoney(s.rate)}
                  {s.paidThisMonth ? ` · shu oy to'langan ${formatMoney(s.paidThisMonth)}` : ''}
                </Text>
              ) : null}
              {isOwner && s.appAccess ? <Text style={styles.access}>Ilovaga kira oladi</Text> : null}
            </View>
            {s.phone ? (
              <Pressable onPress={() => callPhone(s.phone)} hitSlop={HIT_SLOP} accessibilityRole="button" accessibilityLabel={`${s.name} ga qo'ng'iroq`} style={styles.call}>
                <Ionicons name="call" size={16} color={Colors.info} />
              </Pressable>
            ) : null}
          </Card>
        )}
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
  access: { fontSize: 11, color: Colors.info, fontWeight: '700', marginTop: 3 },
  call: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.infoBg, alignItems: 'center', justifyContent: 'center' },
});
