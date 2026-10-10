import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/src/components/ui/Screen';
import { Input, PhoneInput } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Checkbox, Chip, PageHeader } from '@/src/components/ui/Misc';
import { Colors, Spacing } from '@/src/theme';
import { errorMessage, useData } from '@/src/context/DataContext';
import type { PayType } from '@/src/types';
import { PAY_TYPE_LABEL, formatAmountInput, formatLocalPhone, isValidLocalPhone, parseAmount, toE164 } from '@/src/utils/format';
import { confirm, notify } from '@/src/utils/dialog';

/** Xodim qo'shish / tahrirlash (`?id=`): lavozim, ish haqi turi, va ilovaga kirish (telefon + parol) */
export default function EmployeeFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { staff, createStaff, updateStaff, deleteStaff } = useData();
  const editing = id ? staff.find((s) => s.id === id) : undefined;

  const [name, setName] = useState(editing?.name ?? '');
  const [phone, setPhone] = useState(editing?.phone ? formatLocalPhone(editing.phone) : '');
  const [position, setPosition] = useState(editing?.position ?? '');
  const [payType, setPayType] = useState<PayType>(editing?.payType ?? 'monthly');
  const [rate, setRate] = useState(editing?.rate ? formatAmountInput(String(editing.rate)) : '');
  const [note, setNote] = useState(editing?.note ?? '');
  const [appAccess, setAppAccess] = useState(!!editing?.appAccess);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Partial<Record<'name' | 'phone' | 'password', string>>>({});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const e: typeof errors = {};
    if (name.trim().length < 2) e.name = 'Ismni kiriting';
    if (phone && !isValidLocalPhone(phone)) e.phone = "Telefon raqamini to'liq kiriting";
    if (appAccess && !isValidLocalPhone(phone)) e.phone = 'Ilovaga kirish uchun telefon raqam kerak';
    if (appAccess && (!editing?.appAccess || password) && password.length < 6) e.password = 'Parol kamida 6 ta belgi';
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      const input = {
        name: name.trim(), phone: phone ? toE164(phone) : '', position: position.trim(), payType, rate: parseAmount(rate), note: note.trim(),
        appAccess, appPassword: appAccess && password ? password : undefined,
      };
      if (editing) await updateStaff(editing.id, input);
      else await createStaff(input);
      router.back();
    } catch (err) {
      notify('Xodim saqlanmadi', errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!editing) return;
    if (!(await confirm("Xodimni o'chirish", `${editing.name} ro'yxatdan olib tashlanadi va ilovaga kira olmaydi. Eski bronlar saqlanadi.`, { ok: "O'chirish", destructive: true }))) return;
    try {
      await deleteStaff(editing.id);
      router.back();
    } catch (err) {
      notify("Xodim o'chirilmadi", errorMessage(err));
    }
  };

  return (
    <Screen scroll keyboard edges={['top', 'left', 'right', 'bottom']} footer={<Button title="Saqlash" icon="checkmark" onPress={save} loading={saving} />}>
      <PageHeader title={editing ? 'Xodimni tahrirlash' : "Yangi xodim"} back />
      <Input label="Ism" required icon="person-outline" placeholder="Masalan: Rustam Karimov" value={name} onChangeText={setName} error={errors.name} autoCapitalize="words" />
      <PhoneInput label="Telefon raqami" value={phone} onChangeText={setPhone} error={errors.phone} />
      <Input label="Lavozim" placeholder="Administrator, Oshpaz, Ofitsiant..." value={position} onChangeText={setPosition} />

      <Text style={styles.label}>Ish haqi turi</Text>
      <View style={styles.chips}>
        {(Object.keys(PAY_TYPE_LABEL) as PayType[]).map((t) => (
          <Chip key={t} label={PAY_TYPE_LABEL[t]} active={payType === t} onPress={() => setPayType(t)} />
        ))}
      </View>
      <Input label="Stavka (so'm)" icon="cash-outline" keyboardType="number-pad" placeholder="0" value={rate} onChangeText={(t) => setRate(formatAmountInput(t))} />

      <View style={styles.access}>
        <Checkbox label="Ilovaga kirishga ruxsat (xodim sifatida)" checked={appAccess} onToggle={() => setAppAccess((v) => !v)} />
        <Text style={styles.hint}>Xodim bronlarni ko&apos;radi va yangisini yaratadi. Pul ma&apos;lumotlari, moliya va menyu unga ko&apos;rinmaydi.</Text>
        {appAccess ? (
          <Input
            label={editing?.appAccess ? "Yangi parol (o'zgartirish uchun)" : 'Parol'}
            icon="lock-closed-outline"
            password
            autoCapitalize="none"
            textContentType="newPassword"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            containerStyle={{ marginTop: Spacing.sm }}
          />
        ) : null}
      </View>

      <Input label="Izoh" placeholder="Qo'shimcha ma'lumot..." multiline value={note} onChangeText={setNote} maxLength={500} />
      {editing ? <Button title="Xodimni o'chirish" icon="trash-outline" variant="danger" onPress={remove} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  access: { padding: Spacing.md, backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  hint: { fontSize: 12, color: Colors.textSecondary, marginTop: 6 },
});
