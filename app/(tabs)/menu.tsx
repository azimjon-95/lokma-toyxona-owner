import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/src/components/ui/Screen';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Tabs } from '@/src/components/ui/Tabs';
import { EmptyState, IconCircle, PageHeader } from '@/src/components/ui/Misc';
import { FoodThumb } from '@/src/components/FoodThumb';
import { DishSheet } from '@/src/components/DishSheet';
import { DataBanner } from '@/src/components/DataBanner';
import { Colors, Spacing } from '@/src/theme';
import { useData } from '@/src/context/DataContext';
import { useIsOwner } from '@/src/context/AuthContext';
import type { Dish } from '@/src/types';
import { formatMoney, formatNumber } from '@/src/utils/format';

type Tab = 'packages' | 'dishes';

export default function MenuScreen() {
  const { menus, dishes, refresh, refreshing } = useData();
  const isOwner = useIsOwner();
  const [tab, setTab] = useState<Tab>('packages');
  const [dishSheet, setDishSheet] = useState<{ open: boolean; dish?: Dish }>({ open: false });

  return (
    <Screen
      footer={
        isOwner ? (
          tab === 'packages' ? (
            <Button title="Yangi menyu" icon="add" onPress={() => router.push('/menu/new')} />
          ) : (
            <Button title="Yangi taom" icon="add" onPress={() => setDishSheet({ open: true })} />
          )
        ) : undefined
      }
    >
      <PageHeader title="Menyu" />
      <DataBanner />
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
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          ListEmptyComponent={<EmptyState icon="restaurant-outline" title="Menyu paketlari yo'q" />}
          renderItem={({ item, index }) => (
            <Card
              style={styles.card}
              highlighted={item.popular}
              onPress={() => router.push({ pathname: '/menu/[id]', params: { id: item.id } })}
              accessibilityLabel={item.name}
            >
              <IconCircle name="restaurant-outline" size={40} />
              <View style={styles.flex}>
                <View style={styles.titleRow}>
                  <Text style={styles.name}>{item.name}</Text>
                  {item.popular ? <Text style={styles.popular}>Ommabop</Text> : null}
                </View>
                <Text style={styles.price}>{formatMoney(item.pricePerPerson)} / 1 kishi</Text>
                <Text style={styles.meta}>
                  {item.minGuests > 0 ? `${formatNumber(item.minGuests)}+ mehmon · ` : ''}
                  {item.dishes.length} ta taom
                </Text>
              </View>
              <FoodThumb size={62} seed={index} photo={item.photo ?? item.dishes.find((d) => d.photo)?.photo} />
            </Card>
          )}
        />
      ) : (
        <FlatList
          data={dishes}
          keyExtractor={(d) => d.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Spacing.md }}
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          ListEmptyComponent={<EmptyState icon="fast-food-outline" title="Taomlar yo'q" />}
          renderItem={({ item, index }) => (
            <Card style={styles.dish} onPress={isOwner ? () => setDishSheet({ open: true, dish: item }) : undefined} accessibilityLabel={item.name}>
              <FoodThumb size={44} seed={index} photo={item.photo} />
              <Text style={styles.dishName}>{item.name}</Text>
              <Text style={styles.meta}>{item.menusCount} paketda</Text>
            </Card>
          )}
        />
      )}
      <DishSheet visible={dishSheet.open} dish={dishSheet.dish} onClose={() => setDishSheet({ open: false })} />
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
