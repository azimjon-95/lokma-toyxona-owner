import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Screen } from '@/src/components/ui/Screen';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { PageHeader } from '@/src/components/ui/Misc';
import { Colors, HIT_SLOP, Radius, Spacing } from '@/src/theme';
import { useData } from '@/src/context/DataContext';
import { digitsOnly, formatAmountInput, parseAmount } from '@/src/utils/format';

export default function NewMenuScreen() {
  const { addMenu } = useData();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [minGuests, setMinGuests] = useState('');
  const [dish, setDish] = useState('');
  const [dishes, setDishes] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ name?: string; price?: string; dishes?: string }>({});

  const addDish = () => {
    const d = dish.trim();
    if (!d || dishes.includes(d)) return;
    setDishes((p) => [...p, d]);
    setDish('');
  };

  const save = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = 'Menyu nomini kiriting';
    if (parseAmount(price) <= 0) e.price = 'Narxni kiriting';
    if (dishes.length === 0) e.dishes = "Kamida bitta taom qo'shing";
    setErrors(e);
    if (Object.keys(e).length) return;
    addMenu({
      name: name.trim(),
      pricePerPerson: parseAmount(price),
      minGuests: Number.parseInt(minGuests || '0', 10),
      dishes,
    });
    router.back();
  };

  return (
    <Screen
      scroll
      keyboard
      edges={['top', 'left', 'right', 'bottom']}
      footer={<Button title="Saqlash" icon="checkmark" onPress={save} />}
    >
      <PageHeader title="Yangi menyu" back />
      <Input label="Menyu nomi" required placeholder="Masalan: To'y №5" value={name} onChangeText={setName} error={errors.name} />
      <View style={styles.row}>
        <Input
          label="Narx (1 kishi)"
          required
          keyboardType="number-pad"
          placeholder="150 000"
          value={price}
          onChangeText={(t) => setPrice(formatAmountInput(t))}
          error={errors.price}
          containerStyle={styles.flex}
        />
        <Input
          label="Min. mehmon"
          keyboardType="number-pad"
          placeholder="200"
          maxLength={4}
          value={minGuests}
          onChangeText={(t) => setMinGuests(digitsOnly(t))}
          containerStyle={styles.flex}
        />
      </View>

      <Text style={styles.label}>Taomlar</Text>
      <View style={styles.row}>
        <Input
          placeholder="Taom nomi"
          value={dish}
          onChangeText={setDish}
          onSubmitEditing={addDish}
          returnKeyType="done"
          submitBehavior="submit"
          containerStyle={styles.flex}
          error={errors.dishes}
        />
        <Button title="Qo'shish" variant="soft" onPress={addDish} style={styles.addBtn} />
      </View>
      {dishes.map((d) => (
        <View key={d} style={styles.dish}>
          <Ionicons name="restaurant-outline" size={16} color={Colors.primary} />
          <Text style={styles.dishText}>{d}</Text>
          <Pressable
            onPress={() => setDishes((p) => p.filter((x) => x !== d))}
            hitSlop={HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel={`${d} ni o'chirish`}
          >
            <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
          </Pressable>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  addBtn: { height: 50, paddingHorizontal: 16 },
  dish: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  dishText: { flex: 1, fontSize: 15, color: Colors.text },
});
