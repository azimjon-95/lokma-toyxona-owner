import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/src/components/ui/Screen';
import { Input, PhoneInput } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Chip, PageHeader } from '@/src/components/ui/Misc';
import { DateTimeField } from '@/src/components/ui/DateTimeField';
import { Colors, Spacing } from '@/src/theme';
import { useData } from '@/src/context/DataContext';
import type { EventType } from '@/src/types';
import {
  EVENT_LABEL,
  digitsOnly,
  formatAmountInput,
  formatLocalPhone,
  formatMoney,
  isValidISODate,
  isValidLocalPhone,
  isValidTime,
  parseAmount,
  toE164,
  todayISO,
} from '@/src/utils/format';

const HALLS = ['Katta zal', 'Kichik zal', 'VIP zal'];

type Errors = Partial<Record<'clientName' | 'phone' | 'date' | 'time' | 'guests' | 'total', string>>;

export default function BookingFormScreen() {
  const params = useLocalSearchParams<{ id?: string; date?: string }>();
  const { getBooking, menus, bookings, addBooking, updateBooking } = useData();
  const editing = params.id ? getBooking(params.id) : undefined;

  const [clientName, setClientName] = useState(editing?.clientName ?? '');
  const [phone, setPhone] = useState(editing ? formatLocalPhone(editing.clientPhone) : '');
  const [type, setType] = useState<EventType>(editing?.type ?? 'toy');
  const [date, setDate] = useState(editing?.date ?? params.date ?? todayISO());
  const [time, setTime] = useState(editing?.time ?? '18:00');
  const [endTime, setEndTime] = useState(editing?.endTime ?? '23:00');
  const [guests, setGuests] = useState(editing ? String(editing.guestCount) : '');
  const [menuId, setMenuId] = useState<string | undefined>(editing?.menuId);
  const [hall, setHall] = useState(editing?.hallName ?? HALLS[0]);
  const [total, setTotal] = useState(editing ? formatAmountInput(String(editing.totalAmount)) : '');
  const [totalTouched, setTotalTouched] = useState(!!editing);
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [errors, setErrors] = useState<Errors>({});

  const guestCount = Number.parseInt(digitsOnly(guests) || '0', 10);
  const menu = menus.find((m) => m.id === menuId);
  const suggested = menu ? menu.pricePerPerson * guestCount : 0;
  const totalValue = totalTouched ? parseAmount(total) : suggested;

  const conflict = useMemo(
    () =>
      bookings.find(
        (b) =>
          b.id !== editing?.id &&
          b.date === date &&
          b.hallName === hall &&
          b.status !== 'cancelled' &&
          // vaqt oraliqlari kesishadi
          b.time < (endTime || '23:59') &&
          (b.endTime ?? '23:59') > time
      ),
    [bookings, editing?.id, date, hall, time, endTime]
  );

  const save = () => {
    const e: Errors = {};
    if (clientName.trim().length < 2) e.clientName = 'Mijoz ismini kiriting';
    if (!isValidLocalPhone(phone)) e.phone = "Telefon raqamini to'liq kiriting";
    if (!isValidISODate(date)) e.date = "Sana noto'g'ri";
    else if (!editing && date < todayISO()) e.date = "O'tgan sanaga bron qilib bo'lmaydi";
    if (!isValidTime(time) || (endTime && !isValidTime(endTime))) e.time = "Vaqt noto'g'ri (HH:mm)";
    else if (endTime && endTime <= time) e.time = 'Tugash vaqti boshlanishdan keyin bo\'lishi kerak';
    if (!guestCount || guestCount > 5000) e.guests = 'Mehmonlar sonini kiriting';
    if (totalValue <= 0) e.total = 'Jami summani kiriting';
    setErrors(e);
    if (Object.keys(e).length) return;

    const persist = () => {
      const data = {
        clientName: clientName.trim(),
        clientPhone: toE164(phone),
        type,
        date,
        time,
        endTime: endTime || undefined,
        guestCount,
        menuId,
        hallName: hall,
        totalAmount: totalValue,
        notes: notes.trim() || undefined,
      };
      if (editing) {
        updateBooking(editing.id, data);
        router.back();
      } else {
        const created = addBooking({ ...data, depositAmount: 0 });
        router.dismiss();
        router.push({ pathname: '/booking/[id]', params: { id: created.id } });
      }
    };

    if (conflict) {
      Alert.alert(
        'Vaqt band',
        `${hall} shu vaqtda ${conflict.clientName} uchun band qilingan (${conflict.time}). Baribir saqlansinmi?`,
        [
          { text: 'Bekor qilish', style: 'cancel' },
          { text: 'Saqlash', onPress: persist },
        ]
      );
    } else {
      persist();
    }
  };

  return (
    <Screen
      scroll
      keyboard
      edges={['top', 'left', 'right', 'bottom']}
      footer={<Button title={editing ? 'Saqlash' : 'Bron yaratish'} icon="checkmark" onPress={save} />}
    >
      <PageHeader title={editing ? 'Bronni tahrirlash' : 'Yangi bron'} back />

      <Text style={styles.section}>Mijoz</Text>
      <Input
        label="Mijoz ismi"
        required
        icon="person-outline"
        placeholder="Masalan: Azizbek & Dilshoda"
        value={clientName}
        onChangeText={setClientName}
        error={errors.clientName}
        autoCapitalize="words"
        textContentType="name"
      />
      <PhoneInput label="Telefon raqami" required value={phone} onChangeText={setPhone} error={errors.phone} />

      <Text style={styles.section}>Tadbir</Text>
      <View style={styles.chips}>
        {(Object.keys(EVENT_LABEL) as EventType[]).map((t) => (
          <Chip key={t} label={EVENT_LABEL[t]} active={type === t} onPress={() => setType(t)} />
        ))}
      </View>
      <DateTimeField
        label="Sana"
        required
        mode="date"
        value={date}
        onChange={setDate}
        minimumDate={editing ? undefined : new Date()}
        error={errors.date}
      />
      <View style={styles.row}>
        <DateTimeField label="Boshlanishi" mode="time" value={time} onChange={setTime} error={errors.time} />
        <DateTimeField label="Tugashi" mode="time" value={endTime} onChange={setEndTime} />
      </View>
      <Text style={styles.label}>Zal</Text>
      <View style={styles.chips}>
        {HALLS.map((h) => (
          <Chip key={h} label={h} active={hall === h} onPress={() => setHall(h)} />
        ))}
      </View>
      {conflict ? (
        <Text style={styles.warn}>
          ⚠︎ {hall} bu vaqtda band: {conflict.clientName}, {conflict.time}
        </Text>
      ) : null}
      <Input
        label="Mehmonlar soni"
        required
        icon="people-outline"
        keyboardType="number-pad"
        placeholder="Masalan: 300"
        maxLength={4}
        value={guests}
        onChangeText={(t) => setGuests(digitsOnly(t))}
        error={errors.guests}
      />

      <Text style={styles.section}>Menyu va narx</Text>
      <View style={styles.chips}>
        {menus.map((m) => (
          <Chip key={m.id} label={m.name} active={menuId === m.id} onPress={() => setMenuId(menuId === m.id ? undefined : m.id)} />
        ))}
      </View>
      {menu && guestCount > 0 ? (
        <Text style={styles.hint}>
          Hisob: {guestCount} × {formatMoney(menu.pricePerPerson)} = {formatMoney(suggested)}
        </Text>
      ) : null}
      <Input
        label="Jami summa (so'm)"
        required
        icon="cash-outline"
        keyboardType="number-pad"
        placeholder="0"
        value={totalTouched ? total : suggested ? formatAmountInput(String(suggested)) : ''}
        onChangeText={(t) => {
          setTotalTouched(true);
          setTotal(formatAmountInput(t));
        }}
        error={errors.total}
      />
      <Input label="Izoh" placeholder="Qo'shimcha ma'lumot..." multiline value={notes} onChangeText={setNotes} maxLength={500} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm, marginTop: Spacing.xs },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  row: { flexDirection: 'row', gap: 12 },
  hint: { fontSize: 13, color: Colors.textSecondary, marginTop: -6, marginBottom: Spacing.sm },
  warn: { fontSize: 13, color: Colors.warning, marginTop: -8, marginBottom: Spacing.md, fontWeight: '600' },
});
