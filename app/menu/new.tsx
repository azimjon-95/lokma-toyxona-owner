import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/src/components/ui/Screen';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Chip, PageHeader } from '@/src/components/ui/Misc';
import { PhotoField } from '@/src/components/PhotoField';
import { Colors, HIT_SLOP, Radius, Spacing } from '@/src/theme';
import { errorMessage, useData } from '@/src/context/DataContext';
import { digitsOnly, formatAmountInput, parseAmount } from '@/src/utils/format';
import { notify } from '@/src/utils/dialog';

/** Menyu paketi yaratish / tahrirlash (`?id=` bilan). Taomlar nomi bilan qo'shiladi — katalogda bo'lmasa avtomatik yaratiladi. */
export default function MenuFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { menus, dishes, getMenu, createMenu, updateMenu } = useData();
  const editing = id ? getMenu(id) : undefined;

  const [name, setName] = useState(editing?.name ?? '');
  const [price, setPrice] = useState(editing ? formatAmountInput(String(editing.pricePerPerson)) : '');
  const [minGuests, setMinGuests] = useState(editing?.minGuests ? String(editing.minGuests) : '');
  const [dish, setDish] = useState('');
  const [picked, setPicked] = useState<string[]>(editing?.dishes.map((d) => d.name) ?? []);
  // undefined — rasm o'zgarmagan; null — olib tashlansin; string — yangi Cloudinary public_id
  const [photo, setPhoto] = useState<string | null | undefined>(undefined);
  const [errors, setErrors] = useState<{ name?: string; price?: string; dishes?: string }>({});
  const [saving, setSaving] = useState(false);

  const has = (n: string) => picked.some((x) => x.toLowerCase() === n.trim().toLowerCase());
  const addDish = (raw = dish) => {
    const d = raw.trim();
    if (!d || has(d)) { setDish(''); return; }
    setPicked((p) => [...p, d]);
    setDish('');
    setErrors((e) => ({ ...e, dishes: undefined }));
  };

  const save = async () => {
    const e: typeof errors = {};
    if (name.trim().length < 2) e.name = 'Menyu nomini kiriting';
    else if (menus.some((m) => m.id !== id && m.name.trim().toLowerCase() === name.trim().toLowerCase())) e.name = 'Bunday nomli menyu allaqachon bor';
    if (parseAmount(price) <= 0) e.price = 'Narxni kiriting';
    if (picked.length === 0) e.dishes = "Kamida bitta taom qo'shing";
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      const input = { name: name.trim(), pricePerPerson: parseAmount(price), minGuests: Number.parseInt(minGuests || '0', 10), dishes: picked, photoPublicId: photo };
      if (editing) await updateMenu(editing.id, input);
      else await createMenu(input);
      router.back();
    } catch (err) {
      notify('Menyu saqlanmadi', errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // Katalogdagi, hali tanlanmagan taomlar — bir bosishda qo'shiladi
  const suggestions = dishes.filter((d) => !has(d.name)).slice(0, 14);

  return (
    <Screen scroll keyboard edges={['top', 'left', 'right', 'bottom']} footer={<Button title="Saqlash" icon="checkmark" onPress={save} loading={saving} />}>
      <PageHeader title={editing ? 'Menyuni tahrirlash' : 'Yangi menyu'} back />
      <Input label="Menyu nomi" required placeholder="Masalan: To'y №5" value={name} onChangeText={setName} error={errors.name} />
      <View style={styles.row}>
        <Input label="Narx (1 kishi)" required keyboardType="number-pad" placeholder="150 000" value={price} onChangeText={(t) => setPrice(formatAmountInput(t))} error={errors.price} containerStyle={styles.flex} />
        <Input label="Min. mehmon" keyboardType="number-pad" placeholder="200" maxLength={4} value={minGuests} onChangeText={(t) => setMinGuests(digitsOnly(t))} containerStyle={styles.flex} />
      </View>
      <PhotoField label="Menyu rasmi" purpose="menu_photo" photo={photo === undefined ? editing?.photo : null} onChange={setPhoto} />

      <Text style={styles.label}>Taomlar</Text>
      <View style={styles.row}>
        <Input
          placeholder="Taom nomi"
          value={dish}
          onChangeText={setDish}
          onSubmitEditing={() => addDish()}
          returnKeyType="done"
          submitBehavior="submit"
          containerStyle={styles.flex}
          error={errors.dishes}
        />
        <Button title="Qo'shish" variant="soft" onPress={() => addDish()} style={styles.addBtn} />
      </View>
      {suggestions.length > 0 ? (
        <View style={styles.chips}>
          {suggestions.map((d) => (
            <Chip key={d.id} label={`+ ${d.name}`} active={false} onPress={() => addDish(d.name)} />
          ))}
        </View>
      ) : null}
      {picked.map((d) => (
        <View key={d} style={styles.dish}>
          <Ionicons name="restaurant-outline" size={16} color={Colors.primary} />
          <Text style={styles.dishText}>{d}</Text>
          <Pressable onPress={() => setPicked((p) => p.filter((x) => x !== d))} hitSlop={HIT_SLOP} accessibilityRole="button" accessibilityLabel={`${d} ni o'chirish`}>
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  addBtn: { height: 50, paddingHorizontal: 16 },
  dish: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
  dishText: { flex: 1, fontSize: 15, color: Colors.text },
});
