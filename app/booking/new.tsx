import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/src/components/ui/Screen';
import { Input, PhoneInput } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Chip, PageHeader } from '@/src/components/ui/Misc';
import { DateTimeField } from '@/src/components/ui/DateTimeField';
import { Colors, Spacing } from '@/src/theme';
import { errorMessage, useAvailability, useData, useQuote } from '@/src/context/DataContext';
import type { EventType, SessionCode } from '@/src/types';
import {
  EVENT_LABEL,
  SESSION_LABEL,
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
import { notify } from '@/src/utils/dialog';

type Errors = Partial<Record<'clientName' | 'phone' | 'date' | 'time' | 'guests' | 'total' | 'slot', string>>;

export default function BookingFormScreen() {
  const params = useLocalSearchParams<{ id?: string; date?: string }>();
  const { venue, menus, getBooking, createBooking, updateBooking } = useData();
  const editing = params.id ? getBooking(params.id) : undefined;
  /** Lokma ilovasi orqali kelgan bron: mijoz tanlovi o'zgarmaydi, faqat izoh tahrirlanadi (server qoidasi) */
  const readonly = editing?.source === 'app';

  const sessions = venue?.sessions ?? [];
  const halls = venue?.halls ?? [];
  const defaultSession = (sessions.find((s) => s.code === 'evening') ?? sessions[0])?.code;

  const [clientName, setClientName] = useState(editing?.clientName ?? '');
  const [phone, setPhone] = useState(editing ? formatLocalPhone(editing.clientPhone) : '');
  const [date, setDate] = useState(editing?.date ?? params.date ?? todayISO());
  // Tanlanmagan bo'lsa — serverdan kelgan standart zal/seans (hosila qiymat, effektsiz)
  const [hallPick, setHallPick] = useState<string | undefined>(editing?.hallId);
  const [sessionPick, setSessionPick] = useState<SessionCode | undefined>(editing?.session);
  const [typePick, setTypePick] = useState<EventType | undefined>(editing?.type);
  // Vaqt: seans shablonidan; egasi faqat "Maxsus tadbir"da (yoki tahrirda) o'zgartiradi
  const [startPick, setStartPick] = useState<string | undefined>(editing?.time);
  const [endPick, setEndPick] = useState<string | undefined>(editing?.endTime);
  const [guests, setGuests] = useState(editing ? String(editing.guestCount) : '');
  const [menuId, setMenuId] = useState<string | undefined>(editing?.menuId);
  const [total, setTotal] = useState(editing ? formatAmountInput(String(editing.totalAmount)) : '');
  const [totalTouched, setTotalTouched] = useState(!!editing);
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const hallId = hallPick ?? halls[0]?.id;
  const session = sessionPick ?? defaultSession;
  const sessionInfo = sessions.find((s) => s.code === session);
  const allowedTypes = (venue?.eventTypes ?? []).filter((e) => !sessionInfo?.eventTypes.length || sessionInfo.eventTypes.includes(e.code));
  // Tanlangan tur seansga mos kelmasa — birinchi mosi
  const preferred: Record<SessionCode, EventType> = { morning: 'nahorgi_osh', day: 'kunduzgi', evening: 'kechki', special: 'tadbir' };
  const fallbackType = allowedTypes.find((e) => e.code === (session && preferred[session]))?.code ?? allowedTypes[0]?.code;
  const type = typePick && allowedTypes.some((e) => e.code === typePick) ? typePick : fallbackType;
  const startTime = startPick ?? sessionInfo?.startTime ?? '';
  const endTime = endPick ?? sessionInfo?.endTime ?? '';
  const chooseSession = (code: SessionCode) => {
    if (readonly) return;
    setSessionPick(code);
    setStartPick(undefined);
    setEndPick(undefined);
  };

  const guestCount = Number.parseInt(digitsOnly(guests) || '0', 10);
  const menu = menus.find((m) => m.id === menuId);
  const { quote } = useQuote({ hallId, date, session, guestCount, menuId });
  const suggested = quote?.total ?? 0;
  const totalValue = totalTouched ? parseAmount(total) : suggested;

  // Bandlik — serverdan (ilova broni, egasi broni, yopiq seanslar hammasi hisobga olinadi)
  const { availability } = useAvailability(date);
  const slot = availability?.halls.find((h) => h.hallId === hallId)?.sessions.find((s) => s.code === session);
  const isOwnSlot = !!editing && editing.hallId === hallId && editing.date === date && editing.session === session;
  const slotBlocked = !!slot && slot.state !== 'free' && !isOwnSlot;
  const slotMessage = !slotBlocked
    ? ''
    : slot!.state === 'past' ? "O'tgan sanaga bron qilib bo'lmaydi"
    : slot!.state === 'closed' ? 'Bu seans yopilgan'
    : `Bu seans band${slot!.who ? `: ${slot!.who}` : ''}`;

  const save = async () => {
    const e: Errors = {};
    if (clientName.trim().length < 2) e.clientName = 'Mijoz ismini kiriting';
    if (!isValidLocalPhone(phone)) e.phone = "Telefon raqamini to'liq kiriting";
    if (!isValidISODate(date)) e.date = "Sana noto'g'ri";
    else if (!editing && date < todayISO()) e.date = "O'tgan sanaga bron qilib bo'lmaydi";
    if (!isValidTime(startTime) || (endTime && !isValidTime(endTime))) e.time = "Vaqt noto'g'ri (HH:mm)";
    else if (endTime && endTime <= startTime) e.time = "Tugash vaqti boshlanishdan keyin bo'lishi kerak";
    if (!guestCount || guestCount > 5000) e.guests = 'Mehmonlar sonini kiriting';
    if (totalValue <= 0) e.total = 'Jami summani kiriting';
    if (slotBlocked) e.slot = slotMessage;
    setErrors(e);
    if (Object.keys(e).length || !hallId || !session || !type) return;

    setSaving(true);
    try {
      if (editing) {
        await updateBooking(
          editing.id,
          readonly
            ? { notes: notes.trim() }
            : { clientName: clientName.trim(), clientPhone: toE164(phone), type, date, session, hallId, startTime, endTime: endTime || undefined, guestCount, menuId, totalAmount: totalValue, notes: notes.trim() }
        );
        router.back();
      } else {
        const created = await createBooking({
          clientName: clientName.trim(), clientPhone: toE164(phone), type, date, session, hallId, startTime, endTime: endTime || undefined,
          guestCount, menuId, totalAmount: totalValue, pricingMode: quote?.pricingMode, pricePerGuest: quote?.pricePerGuest || undefined, notes: notes.trim() || undefined,
        });
        router.dismiss();
        router.push({ pathname: '/booking/[id]', params: { id: created.id } });
      }
    } catch (err) {
      notify('Bron saqlanmadi', errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      scroll
      keyboard
      edges={['top', 'left', 'right', 'bottom']}
      footer={<Button title={editing ? 'Saqlash' : 'Bron yaratish'} icon="checkmark" onPress={save} loading={saving} disabled={!venue} />}
    >
      <PageHeader title={editing ? 'Bronni tahrirlash' : 'Yangi bron'} back />
      {readonly ? (
        <Text style={styles.banner}>
          Bu bron Lokma ilovasi orqali kelgan{editing?.number ? ` (${editing.number})` : ''}. Mijoz tanlovi o&apos;zgarmaydi — faqat izohni tahrirlash mumkin.
        </Text>
      ) : null}

      <Text style={styles.section}>Mijoz</Text>
      <Input label="Mijoz ismi" required icon="person-outline" placeholder="Masalan: Azizbek & Dilshoda" value={clientName} onChangeText={setClientName} error={errors.clientName} autoCapitalize="words" textContentType="name" editable={!readonly} />
      <PhoneInput label="Telefon raqami" required value={phone} onChangeText={setPhone} error={errors.phone} editable={!readonly} />

      <Text style={styles.section}>Tadbir</Text>
      <DateTimeField label="Sana" required mode="date" value={date} onChange={readonly ? () => {} : setDate} minimumDate={editing ? undefined : new Date()} error={errors.date} />

      <Text style={styles.label}>Seans</Text>
      <View style={styles.chips}>
        {sessions.map((s) => (
          <Chip key={s.code} label={`${SESSION_LABEL[s.code]} · ${s.startTime}`} active={session === s.code} onPress={() => chooseSession(s.code)} />
        ))}
      </View>

      <Text style={styles.label}>Tadbir turi</Text>
      <View style={styles.chips}>
        {allowedTypes.map((e) => (
          <Chip key={e.code} label={EVENT_LABEL[e.code]} active={type === e.code} onPress={() => !readonly && setTypePick(e.code)} />
        ))}
      </View>

      {session === 'special' && !readonly ? (
        <View style={styles.row}>
          <DateTimeField label="Boshlanishi" mode="time" value={startTime} onChange={setStartPick} error={errors.time} />
          <DateTimeField label="Tugashi" mode="time" value={endTime} onChange={setEndPick} />
        </View>
      ) : (
        <Text style={styles.hint}>Vaqt: {startTime || '—'}{endTime ? ` – ${endTime}` : ''}</Text>
      )}

      <Text style={styles.label}>Zal</Text>
      <View style={styles.chips}>
        {halls.map((h) => (
          <Chip key={h.id} label={`${h.name} · ${h.capacityMax}`} active={hallId === h.id} onPress={() => !readonly && setHallPick(h.id)} />
        ))}
      </View>
      {slotBlocked ? <Text style={styles.warn}>⚠︎ {slotMessage}</Text> : null}

      <Input label="Mehmonlar soni" required icon="people-outline" keyboardType="number-pad" placeholder="Masalan: 300" maxLength={4} value={guests} onChangeText={(t) => setGuests(digitsOnly(t))} error={errors.guests} editable={!readonly} />
      {quote?.warnings.map((w) => (
        <Text key={w} style={styles.warn}>⚠︎ {w}</Text>
      ))}

      <Text style={styles.section}>Menyu va narx</Text>
      <View style={styles.chips}>
        {menus.map((m) => (
          <Chip key={m.id} label={m.name} active={menuId === m.id} onPress={() => !readonly && setMenuId(menuId === m.id ? undefined : m.id)} />
        ))}
      </View>
      {quote && quote.pricingMode === 'per_guest' && menu && guestCount > 0 && quote.total ? (
        <Text style={styles.hint}>Hisob: {guestCount} × {formatMoney(quote.pricePerGuest)} = {formatMoney(quote.total)}{quote.pricePerGuest !== menu.pricePerPerson ? ` (${menu.name} ${formatMoney(menu.pricePerPerson)} × seans koeffitsienti)` : ''}</Text>
      ) : null}
      {quote?.pricingMode === 'negotiable' ? <Text style={styles.hint}>Bu seans narxi kelishiladi — summani o&apos;zingiz kiriting.</Text> : null}
      <Input
        label="Jami summa (so'm)"
        required
        icon="cash-outline"
        keyboardType="number-pad"
        placeholder="0"
        value={totalTouched ? total : suggested ? formatAmountInput(String(suggested)) : ''}
        onChangeText={(t) => { setTotalTouched(true); setTotal(formatAmountInput(t)); }}
        error={errors.total ?? errors.slot}
        editable={!readonly}
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
  hint: { fontSize: 13, color: Colors.textSecondary, marginTop: -4, marginBottom: Spacing.sm },
  warn: { fontSize: 13, color: Colors.warning, marginTop: -6, marginBottom: Spacing.sm, fontWeight: '600' },
  banner: { fontSize: 13, color: Colors.info, backgroundColor: Colors.infoBg, padding: 12, borderRadius: 10, marginBottom: Spacing.md },
});
