import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/src/components/ui/Screen';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { PageHeader } from '@/src/components/ui/Misc';
import { Colors, Spacing } from '@/src/theme';
import { errorMessage, useData } from '@/src/context/DataContext';
import { backend } from '@/src/services/api';
import type { VenueInfo } from '@/src/types';
import { digitsOnly, formatDateShort, formatMoney } from '@/src/utils/format';
import { notify } from '@/src/utils/dialog';
import { useQueryClient } from '@tanstack/react-query';

/** To'yxona ma'lumotlari — mijoz ilovasida (Lokma) shu yerdagi matn va qulayliklar ko'rinadi */
export default function VenueInfoScreen() {
  const { venue } = useData();
  if (!venue) {
    return (
      <Screen edges={['top', 'left', 'right', 'bottom']}>
        <PageHeader title="To'yxona ma'lumotlari" back />
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.lg }} />
      </Screen>
    );
  }
  return <VenueForm key={venue.id} venue={venue} />;
}

function VenueForm({ venue }: { venue: VenueInfo }) {
  const { refresh } = useData();
  const qc = useQueryClient();
  const [description, setDescription] = useState(venue.description);
  const [address, setAddress] = useState(venue.address);
  const [phone, setPhone] = useState(venue.phone);
  const [amenities, setAmenities] = useState(venue.amenities.join(', '));
  const [parking, setParking] = useState(venue.parkingSpots ? String(venue.parkingSpots) : '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await backend.patchVenue({
        description: description.trim(), address: address.trim(), phone: phone.trim(),
        amenities: amenities.split(',').map((a) => a.trim()).filter(Boolean), parkingSpots: Number.parseInt(parking || '0', 10),
      });
      await qc.invalidateQueries({ queryKey: ['venue'] });
      await refresh();
      router.back();
    } catch (e) {
      notify('Saqlanmadi', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll keyboard edges={['top', 'left', 'right', 'bottom']} footer={<Button title="Saqlash" icon="checkmark" onPress={save} loading={saving}  />}>
      <PageHeader title="To'yxona ma'lumotlari" subtitle={venue.name} back />
      <Input label="Tavsif" placeholder="To'yxona haqida qisqacha..." multiline maxLength={3000} value={description} onChangeText={setDescription} />
      <Input label="Manzil" icon="location-outline" value={address} onChangeText={setAddress} maxLength={300} />
      <Input label="Telefon" icon="call-outline" keyboardType="phone-pad" value={phone} onChangeText={setPhone} maxLength={40} />
      <Input label="Qulayliklar" placeholder="Konditsioner, Sahna, Kelin xonasi (vergul bilan)" value={amenities} onChangeText={setAmenities} />
      <Input label="Avtoturargoh (joy soni)" icon="car-outline" keyboardType="number-pad" maxLength={4} value={parking} onChangeText={(t) => setParking(digitsOnly(t))} />
      {true ? (
        <Card style={styles.card}>
          <Text style={styles.title}>Zallar va seanslar</Text>
          {venue.halls.map((h) => (
            <Text key={h.id} style={styles.row}>{h.name}: {h.capacityMin}–{h.capacityMax} mehmon</Text>
          ))}
          <View style={styles.sep} />
          {venue.sessions.map((s) => (
            <Text key={s.code} style={styles.row}>{s.label}: {s.startTime}–{s.endTime}</Text>
          ))}
          <View style={styles.sep} />
          <Text style={styles.row}>Avans: {venue.depositPercent}% · dam olish kuni ×{venue.weekendFactor}</Text>
          {venue.subscription.monthlyFee > 0 ? (
            <Text style={styles.row}>Oylik to&apos;lov: {formatMoney(venue.subscription.monthlyFee)}{venue.subscription.paidUntil ? ` · ${formatDateShort(venue.subscription.paidUntil)} gacha to'langan` : ''}</Text>
          ) : null}
          <Text style={styles.note}>Zallar, seanslar va narx koeffitsientlarini administrator sozlaydi.</Text>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.md },
  title: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  row: { fontSize: 13, color: Colors.textSecondary, paddingVertical: 2 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.borderStrong, marginVertical: 8 },
  note: { fontSize: 12, color: Colors.textMuted, marginTop: 8 },
});
