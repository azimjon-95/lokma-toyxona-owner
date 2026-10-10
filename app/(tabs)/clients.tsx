import { useEffect, useMemo, useState } from 'react';
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
import { useClients } from '@/src/context/DataContext';
import { callPhone } from '@/src/utils/linking';
import { formatDateShort, formatPhone, pluralGuests, todayISO } from '@/src/utils/format';

type Filter = 'all' | 'new' | 'upcoming';

export default function ClientsScreen() {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  // Qidiruv serverda (ism yoki telefon); har harfda so'rov yubormaslik uchun 350 ms kutiladi
  const [q, setQ] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQ(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);
  const { clients, loading, error, refetch } = useClients(q);

  const data = useMemo(() => {
    const today = todayISO();
    let list = clients;
    if (filter === 'new') list = list.filter((c) => c.lastBooking.status === 'pending');
    if (filter === 'upcoming')
      list = list.filter((c) => c.lastBooking.date >= today && c.lastBooking.status !== 'cancelled');
    return list;
  }, [clients, filter]);

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
        refreshing={loading}
        onRefresh={() => void refetch()}
        ListEmptyComponent={<EmptyState icon="people-outline" title={error ?? (loading ? 'Yuklanmoqda…' : 'Mijozlar topilmadi')} />}
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
