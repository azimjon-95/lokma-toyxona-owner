import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/src/components/ui/Screen';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { EmptyState, PageHeader, SectionTitle } from '@/src/components/ui/Misc';
import { FoodThumb } from '@/src/components/FoodThumb';
import { Colors, Spacing } from '@/src/theme';
import { errorMessage, useData } from '@/src/context/DataContext';
import { useIsOwner } from '@/src/context/AuthContext';
import { formatMoney, formatNumber } from '@/src/utils/format';
import { confirm, notify } from '@/src/utils/dialog';

export default function MenuDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMenu, deleteMenu } = useData();
  const isOwner = useIsOwner();
  const [busy, setBusy] = useState(false);
  const menu = getMenu(id);

  if (!menu) {
    return (
      <Screen>
        <PageHeader title="Menyu" back />
        <EmptyState icon="restaurant-outline" title="Menyu topilmadi" />
      </Screen>
    );
  }

  const remove = async () => {
    if (!(await confirm("Menyuni o'chirish", `"${menu.name}" paketi o'chiriladi. Eski bronlar o'zgarmaydi.`, { ok: "O'chirish", destructive: true }))) return;
    setBusy(true);
    try {
      await deleteMenu(menu.id);
      router.back();
    } catch (e) {
      notify("Menyu o'chirilmadi", errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      scroll
      footer={
        isOwner ? (
          <View style={styles.actions}>
            <Button title="Tahrirlash" icon="create-outline" style={styles.flex} onPress={() => router.push({ pathname: '/menu/new', params: { id: menu.id } })} />
            <Button title="O'chirish" icon="trash-outline" variant="danger" style={styles.flex} onPress={remove} loading={busy} />
          </View>
        ) : undefined
      }
    >
      <PageHeader title={menu.name} back />
      <Card style={styles.head}>
        <FoodThumb size={72} photo={menu.photo ?? menu.dishes.find((d) => d.photo)?.photo} />
        <View style={styles.flex}>
          <Text style={styles.price}>{formatMoney(menu.pricePerPerson)}</Text>
          <Text style={styles.sub}>1 kishi uchun</Text>
          <Text style={styles.sub}>
            {menu.minGuests > 0 ? `${formatNumber(menu.minGuests)}+ mehmon · ` : ''}
            {menu.usedCount} ta bronda tanlangan
          </Text>
        </View>
      </Card>
      <SectionTitle>{`Taomlar (${menu.dishes.length})`}</SectionTitle>
      <Card>
        {menu.dishes.map((d, i) => (
          <View key={d.id} style={[styles.dish, i > 0 && styles.divider]}>
            <FoodThumb size={34} seed={i} photo={d.photo} />
            <Text style={styles.dishText}>{d.name}</Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: Spacing.sm },
  price: { fontSize: 22, fontWeight: '800', color: Colors.primaryDark },
  sub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  dish: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.borderStrong },
  dishText: { fontSize: 15, color: Colors.text },
});
