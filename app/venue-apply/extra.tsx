import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Screen } from '@/src/components/ui/Screen';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { PageHeader, StepIndicator } from '@/src/components/ui/Misc';
import { Colors, HIT_SLOP, Radius, Spacing } from '@/src/theme';
import { useVenueApply } from '@/src/context/VenueApplyContext';
import { formatAmountInput, parseAmount, toE164 } from '@/src/utils/format';
import { ApiError, submitVenueApplication } from '@/src/services/api';

const MAX_PHOTOS = 6;

export default function VenueApplyExtra() {
  const { draft, update } = useVenueApply();
  const [priceFrom, setPriceFrom] = useState(draft.priceFrom ? formatAmountInput(String(draft.priceFrom)) : '');
  const [priceTo, setPriceTo] = useState(draft.priceTo ? formatAmountInput(String(draft.priceTo)) : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Android 13+ — tizim Photo Picker (ruxsat so'ralmaydi, Google Play siyosatiga mos);
  // iOS — PHPicker (to'liq galereya ruxsati shart emas).
  const pickPhotos = async () => {
    const left = MAX_PHOTOS - draft.photos.length;
    if (left <= 0) return;
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: left,
        quality: 0.7,
      });
      if (!res.canceled) {
        update({ photos: [...draft.photos, ...res.assets.map((a) => a.uri)].slice(0, MAX_PHOTOS) });
      }
    } catch {
      Alert.alert('Xatolik', "Galereyani ochib bo'lmadi");
    }
  };

  const submit = async () => {
    const from = parseAmount(priceFrom) || undefined;
    const to = parseAmount(priceTo) || undefined;
    if (from && to && from > to) {
      setError('"dan" narxi "gacha" narxidan katta bo\'lmasin');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await submitVenueApplication({ ...draft, phone: toE164(draft.phone), priceFrom: from, priceTo: to });
      router.replace('/venue-apply/done');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ariza yuborilmadi. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      scroll
      keyboard
      edges={['top', 'left', 'right', 'bottom']}
      footer={<Button title="Ariza yuborish" icon="paper-plane" onPress={submit} loading={loading} />}
    >
      <PageHeader title="Ariza qoldirish" subtitle="3. Qo'shimcha ma'lumot" back />
      <StepIndicator step={3} />
      <Card>
        <Text style={styles.label}>Foto (galereya)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photos}>
          {draft.photos.map((uri) => (
            <View key={uri}>
              <Image source={{ uri }} style={styles.photo} contentFit="cover" transition={150} />
              <Pressable
                style={styles.remove}
                hitSlop={HIT_SLOP}
                onPress={() => update({ photos: draft.photos.filter((p) => p !== uri) })}
                accessibilityRole="button"
                accessibilityLabel="Rasmni o'chirish"
              >
                <Ionicons name="close" size={14} color={Colors.white} />
              </Pressable>
            </View>
          ))}
          {draft.photos.length < MAX_PHOTOS ? (
            <Pressable onPress={pickPhotos} style={styles.add} accessibilityRole="button" accessibilityLabel="Rasm qo'shish">
              <Ionicons name="add" size={26} color={Colors.primary} />
              <Text style={styles.addText}>Qo&apos;shish</Text>
            </Pressable>
          ) : null}
        </ScrollView>

        <Text style={styles.label}>Narxlar (ixtiyoriy, so&apos;m / kishi)</Text>
        <View style={styles.row}>
          <Input
            placeholder="dan: 100 000"
            keyboardType="number-pad"
            value={priceFrom}
            onChangeText={(t) => setPriceFrom(formatAmountInput(t))}
            containerStyle={styles.flex}
          />
          <Input
            placeholder="gacha: 200 000"
            keyboardType="number-pad"
            value={priceTo}
            onChangeText={(t) => setPriceTo(formatAmountInput(t))}
            containerStyle={styles.flex}
          />
        </View>

        <Input
          label="Izoh"
          placeholder="Qo'shimcha ma'lumot..."
          multiline
          maxLength={1000}
          value={draft.notes ?? ''}
          onChangeText={(notes) => update({ notes })}
          containerStyle={{ marginBottom: 0 }}
        />
      </Card>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  photos: { gap: 10, paddingBottom: Spacing.md },
  photo: { width: 84, height: 84, borderRadius: Radius.md, backgroundColor: Colors.surfaceMuted },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: {
    width: 84,
    height: 84,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.primaryLight,
    backgroundColor: Colors.goldTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { fontSize: 12, color: Colors.primaryDark, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 10 },
  error: { color: Colors.danger, fontSize: 13, textAlign: 'center', marginTop: Spacing.md },
});
