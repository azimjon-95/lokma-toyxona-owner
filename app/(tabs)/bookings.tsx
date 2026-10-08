import { useMemo, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/src/components/ui/Screen';
import { Button } from '@/src/components/ui/Button';
import { Tabs } from '@/src/components/ui/Tabs';
import { EmptyState, PageHeader } from '@/src/components/ui/Misc';
import { BookingCard } from '@/src/components/BookingCard';
import { Spacing } from '@/src/theme';
import { useData } from '@/src/context/DataContext';
import { useIsOwner } from '@/src/context/AuthContext';
import type { BookingStatus } from '@/src/types';

type Filter = BookingStatus | 'all';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Barchasi' },
  { key: 'pending', label: 'Yangi' },
  { key: 'confirmed', label: 'Tasdiqlangan' },
  { key: 'deposit', label: 'Zakalat' },
  { key: 'completed', label: 'Yakunlangan' },
  { key: 'cancelled', label: 'Bekor' },
];

export default function BookingsScreen() {
  const params = useLocalSearchParams<{ filter?: Filter }>();
  const { bookings } = useData();
  const isOwner = useIsOwner();
  const [filter, setFilter] = useState<Filter>(params.filter ?? 'all');

  // Bildirishnoma tugmasidan kelgan filtrni qo'llash (render paytida, effect'siz)
  const [seenParam, setSeenParam] = useState(params.filter);
  if (params.filter !== seenParam) {
    setSeenParam(params.filter);
    if (params.filter) setFilter(params.filter);
  }

  const data = useMemo(
    () => (filter === 'all' ? bookings : bookings.filter((b) => b.status === filter)),
    [bookings, filter]
  );

  return (
    <Screen
      footer={<Button title="Yangi bron" icon="add" onPress={() => router.push('/booking/new')} />}
    >
      <PageHeader title="Bronlar" />
      <Tabs
        items={FILTERS.map((f) => ({
          ...f,
          count: f.key === 'all' ? undefined : bookings.filter((b) => b.status === f.key).length || undefined,
        }))}
        value={filter}
        onChange={setFilter}
        scrollable
      />
      <FlatList
        style={styles.list}
        data={data}
        keyExtractor={(b) => b.id}
        renderItem={({ item }) => <BookingCard booking={item} showAmount={isOwner} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState icon="document-text-outline" title="Bronlar topilmadi" hint="Boshqa filtrni tanlang yoki yangi bron qo'shing." />
        }
        initialNumToRender={8}
        windowSize={7}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { marginHorizontal: -Spacing.md },
  listContent: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
});
