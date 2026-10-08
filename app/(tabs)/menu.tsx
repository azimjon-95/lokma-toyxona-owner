import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/src/components/ui/Screen';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Tabs } from '@/src/components/ui/Tabs';
import { EmptyState, IconCircle, PageHeader } from '@/src/components/ui/Misc';
import { FoodThumb } from '@/src/components/FoodThumb';
import { Colors, Spacing } from '@/src/theme';
import { useData } from '@/src/context/DataContext';
import { useIsOwner } from '@/src/context/AuthContext';
import { formatMoney, formatNumber } from '@/src/utils/format';

type Tab = 'packages' | 'dishes';

export default function MenuScreen() {
  const { menus, bookings } = useData();
  const isOwner = useIsOwner();
  const [tab, setTab] = useState<Tab>('packages');

  // Eng ko'p tanlangan paket ajratib ko'rsatiladi
  const popularId = useMemo(() => {
    const count: Record<string, number> = {};
    for (const b of bookings) if (b.menuId) count[b.menuId] = (count[b.menuId] ?? 0) + 1;
    return Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0];
  }, [bookings]);

  const dishes = useMemo(
    () => [...new Set(menus.flatMap((m) => m.dishes))].sort((a, b) => a.localeCompare(b)),
    [menus]
  );

  return (
    <Screen
      footer={
        isOwner ? <Button title="Yangi menyu" icon="add" onPress={() => router.push('/menu/new')} /> : undefined
      }
    >
      <PageHeader title="Menyu" />
      <Tabs
        items={[
          { key: 'packages', label: 'Menyu paketlari' },
          { key: 'dishes', label: 'Taomlar' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'packages' ? (
        <FlatList
          data={menus}
          keyExtractor={(m) => m.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Spacing.md }}
          ListEmptyComponent={<EmptyState icon="restaurant-outline" title="Menyu paketlari yo'q" />}
          renderItem={({ item, index }) => (
            <Card
              style={styles.card}
              highlighted={item.id === popularId}
              onPress={() => router.push({ pathname: '/menu/[id]', params: { id: item.id } })}
              accessibilityLabel={item.name}
            >
              <IconCircle name="restaurant-outline" size={40} />
              <View style={styles.flex}>
                <View style={styles.titleRow}>
                  <Text style={styles.name}>{item.name}</Text>
                  {item.id === popularId ? <Text style={styles.popular}>Ommabop</Text> : null}
                </View>
                <Text style={styles.price}>{formatMoney(item.pricePerPerson)} / 1 kishi</Text>
                <Text style={styles.meta}>{formatNumber(item.minGuests)}+ mehmon · {item.dishes.length} ta taom</Text>
              </View>
              <FoodThumb size={62} seed={index} />
            </Card>
          )}
        />
      ) : (
        <FlatList
          data={dishes}
          keyExtractor={(d) => d}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Spacing.md }}
          ListEmptyComponent={<EmptyState icon="fast-food-outline" title="Taomlar yo'q" />}
          renderItem={({ item, index }) => (
            <Card style={styles.dish}>
              <FoodThumb size={40} seed={index} />
              <Text style={styles.dishName}>{item}</Text>
              <Text style={styles.meta}>
                {menus.filter((m) => m.dishes.includes(item)).length} paketda
              </Text>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.sm + 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.text },
  popular: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryDark,
    backgroundColor: Colors.goldSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  price: { fontSize: 13, color: Colors.text, marginTop: 3 },
  meta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  dish: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.sm },
  dishName: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
});
