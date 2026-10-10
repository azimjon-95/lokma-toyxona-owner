import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Sheet } from './ui/Sheet';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { PhotoField } from './PhotoField';
import { Spacing } from '../theme';
import type { Dish } from '../types';
import { errorMessage, useData } from '../context/DataContext';
import { confirm, notify } from '../utils/dialog';

/** Taom qo'shish / tahrirlash: nom + rasm (Cloudinary). `dish` berilmasa — yangi taom. */
export function DishSheet({ visible, dish, onClose }: { visible: boolean; dish?: Dish; onClose: () => void }) {
  return (
    <Sheet visible={visible} title={dish ? 'Taomni tahrirlash' : 'Yangi taom'} onClose={onClose}>
      {/* Har ochilganda forma yangi holatdan boshlanadi */}
      {visible ? <DishForm key={dish?.id ?? 'new'} dish={dish} onClose={onClose} /> : null}
    </Sheet>
  );
}

function DishForm({ dish, onClose }: { dish?: Dish; onClose: () => void }) {
  const { createDish, updateDish, deleteDish } = useData();
  const [name, setName] = useState(dish?.name ?? '');
  // undefined — rasm o'zgarmagan; null — olib tashlansin; string — yangi Cloudinary public_id
  const [photo, setPhoto] = useState<string | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (name.trim().length < 2) return setError('Taom nomini kiriting');
    setSaving(true);
    try {
      if (dish) await updateDish(dish.id, { name: name.trim() !== dish.name ? name.trim() : undefined, photoPublicId: photo });
      else await createDish(name.trim(), photo ?? undefined);
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!dish) return;
    const ok = await confirm("Taomni o'chirish", `"${dish.name}" barcha menyu paketlaridan ham olib tashlanadi.`, { ok: "O'chirish", destructive: true });
    if (!ok) return;
    try {
      await deleteDish(dish.id);
      onClose();
    } catch (e) {
      notify("Taom o'chirilmadi", errorMessage(e));
    }
  };

  return (
    <>
      <Input label="Taom nomi" required placeholder="Masalan: Palov" value={name} onChangeText={(t) => { setName(t); setError(''); }} error={error} autoCapitalize="sentences" />
      <PhotoField label="Rasm" purpose="dish_photo" photo={photo === undefined ? dish?.photo : null} onChange={setPhoto} />
      <View style={styles.actions}>
        <Button title="Saqlash" icon="checkmark" onPress={save} loading={saving} style={styles.flex} />
        {dish ? <Button title="O'chirish" variant="danger" icon="trash-outline" onPress={remove} style={styles.flex} /> : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: 10, marginBottom: Spacing.md },
});
