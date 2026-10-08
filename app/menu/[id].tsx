import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/src/components/ui/Screen';
import { Card } from '@/src/components/ui/Card';
import { EmptyState, PageHeader, SectionTitle } from '@/src/components/ui/Misc';
import { FoodThumb } from '@/src/components/FoodThumb';
import { Colors } from '@/src/theme';
import { useData } from '@/src/context/DataContext';
import { formatMoney, formatNumber } from '@/src/utils/format';

export default function MenuDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMenu, bookings } = useData();
  const menu = getMenu(id);

  if (!menu) {
    return (
      <Screen>
        <PageHeader title="Menyu" back />
        <EmptyState icon="restaurant-outline" title="Menyu topilmadi" />
      </Screen>
    );
  }

  const used = bookings.filter((b) => b.menuId === menu.id && b.status !== 'cancelled').length;

  return (
    <Screen scroll>
      <PageHeader title={menu.name} back />
      <Card style={styles.head}>
        <FoodThumb size={72} />
        <View style={styles.flex}>
          <Text style={styles.price}>{formatMoney(menu.pricePerPerson)}</Text>
          <Text style={styles.sub}>1 kishi uchun</Text>
          <Text style={styles.sub}>
            {formatNumber(menu.minGuests)}+ mehmon · {used} ta bronda tanlangan
          </Text>
        </View>
      </Card>
      <SectionTitle>{`Taomlar (${menu.dishes.length})`}</SectionTitle>
      <Card>
        {menu.dishes.map((d, i) => (
          <View key={d} style={[styles.dish, i > 0 && styles.divider]}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
            <Text style={styles.dishText}>{d}</Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  price: { fontSize: 22, fontWeight: '800', color: Colors.primaryDark },
  sub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  dish: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.borderStrong },
  dishText: { fontSize: 15, color: Colors.text },
});
