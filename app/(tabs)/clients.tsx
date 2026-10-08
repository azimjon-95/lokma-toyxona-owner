import { useDeferredValue, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Screen } from '@/src/components/ui/Screen';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Tabs } from '@/src/components/ui/Tabs';
import { StatusBadge } from '@/src/components/ui/Badge';
import { EmptyState, IconCircle, PageHeader } from '@/src/components/ui/Misc';
import { Colors, HIT_SLOP, Spacing } from '@/src/theme';
import { useData } from '@/src/context/DataContext';
import { callPhone } from '@/src/utils/linking';
import { digitsOnly, formatDateShort, formatPhone, pluralGuests, todayISO } from '@/src/utils/format';

type Filter = 'all' | 'new' | 'upcoming';

export default function ClientsScreen() {
  const { clients } = useData();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const q = useDeferredValue(query.trim().toLowerCase());

  const data = useMemo(() => {
    const today = todayISO();
    let list = clients;
    if (filter === 'new') list = list.filter((c) => c.lastBooking.status === 'pending');
    if (filter === 'upcoming')
      list = list.filter((c) => c.lastBooking.date >= today && c.lastBooking.status !== 'cancelled');
    if (q) {
      const qd = digitsOnly(q);
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || (qd.length > 0 && digitsOnly(c.phone).includes(qd))
      );
    }
    return list;
  }, [clients, filter, q]);

  return (
    <Screen>
      <PageHeader title="Mijozlar" />
      <Input
        icon="search-outline"
        placeholder="Mijoz qidirish..."
        value={query}
        onChangeText={setQuery}
        returnKeyType="search"
        autoCorrect={false}
        clearButtonMode="while-editing"
        containerStyle={{ marginBottom: Spacing.sm + 4 }}
        accessibilityLabel="Mijoz qidirish"
      />
      <Tabs
        items={[
          { key: 'all', label: 'Barchasi' },
          { key: 'new', label: 'Yangi' },
          { key: 'upcoming', label: "Tadbir bo'yicha" },
        ]}
        value={filter}
        onChange={setFilter}
      />
      <FlatList
        data={data}
        keyExtractor={(c) => c.key}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Spacing.md }}
        ListEmptyComponent={<EmptyState icon="people-outline" title="Mijozlar topilmadi" />}
        renderItem={({ item: c }) => (
          <Card
            style={styles.card}
            onPress={() => router.push({ pathname: '/booking/[id]', params: { id: c.lastBooking.id } })}
            accessibilityLabel={c.name}
          >
            <IconCircle name="person-outline" size={42} />
            <View style={styles.flex}>
              <View style={styles.titleRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {c.name}
                </Text>
                <StatusBadge status={c.lastBooking.status} />
              </View>
              <Text style={styles.meta}>
                {formatDateShort(c.lastBooking.date, false)}, {c.lastBooking.time} ·{' '}
                {pluralGuests(c.lastBooking.guestCount)}
                {c.bookingsCount > 1 ? ` · ${c.bookingsCount} ta bron` : ''}
              </Text>
              <View style={styles.phoneRow}>
                <Text style={styles.phone}>{formatPhone(c.phone)}</Text>
                <Pressable
                  onPress={() => callPhone(c.phone)}
                  hitSlop={HIT_SLOP}
                  accessibilityRole="button"
                  accessibilityLabel={`${c.name} ga qo'ng'iroq`}
                  style={styles.callBtn}
                >
                  <Ionicons name="call" size={14} color={Colors.info} />
                </Pressable>
              </View>
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { flexDirection: 'row', gap: 12, marginBottom: Spacing.sm + 2, alignItems: 'flex-start' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' },
  name: { fontSize: 15, fontWeight: '700', color: Colors.text, flexShrink: 1 },
  meta: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 },
  phone: { fontSize: 12, color: Colors.textMuted },
  callBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.infoBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
