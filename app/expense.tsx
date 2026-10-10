import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/src/components/ui/Screen';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Chip, PageHeader } from '@/src/components/ui/Misc';
import { Colors, Spacing } from '@/src/theme';
import { errorMessage, useData } from '@/src/context/DataContext';
import type { PayMethod } from '@/src/types';
import { PAY_METHOD_LABEL, formatAmountInput, parseAmount } from '@/src/utils/format';
import { notify } from '@/src/utils/dialog';

/** Server (owner.models.ts) xarajat kategoriyalari bilan bir xil kodlar */
const CATEGORIES: { code: string; label: string }[] = [
  { code: 'ish_haqi', label: 'Ish haqi' },
  { code: 'oziq_ovqat', label: 'Oziq-ovqat' },
  { code: 'kommunal', label: 'Kommunal' },
  { code: 'soliq', label: 'Soliq' },
  { code: 'kredit', label: 'Kredit' },
  { code: 'ijara_tolov', label: 'Ijara' },
  { code: 'tamir', label: "Ta'mir" },
  { code: 'jihoz', label: 'Jihoz' },
  { code: 'reklama', label: 'Reklama' },
  { code: 'transport', label: 'Transport' },
  { code: 'boshqa', label: 'Boshqa' },
];
const METHODS: PayMethod[] = ['cash', 'card', 'transfer', 'other'];

export default function ExpenseScreen() {
  const { addExpense, staff } = useData();
  const [category, setCategory] = useState('oziq_ovqat');
  const [method, setMethod] = useState<PayMethod>('cash');
  const [employeeId, setEmployeeId] = useState<string | undefined>();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const value = parseAmount(amount);
    if (value <= 0) return setError('Summani kiriting');
    setSaving(true);
    try {
      await addExpense({ category, amount: value, method, note: note.trim() || undefined, employeeId: category === 'ish_haqi' ? employeeId : undefined });
      router.back();
    } catch (e) {
      notify('Xarajat saqlanmadi', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll keyboard edges={['top', 'left', 'right', 'bottom']} footer={<Button title="Saqlash" icon="checkmark" onPress={save} loading={saving} />}>
      <PageHeader title="Xarajat qo'shish" back />
      <Text style={styles.label}>Kategoriya</Text>
      <View style={styles.row}>
        {CATEGORIES.map((c) => (
          <Chip key={c.code} label={c.label} active={category === c.code} onPress={() => setCategory(c.code)} />
        ))}
      </View>
      {category === 'ish_haqi' && staff.length > 0 ? (
        <>
          <Text style={styles.label}>Kimga</Text>
          <View style={styles.row}>
            {staff.filter((s) => s.active).map((s) => (
              <Chip key={s.id} label={s.name} active={employeeId === s.id} onPress={() => setEmployeeId(employeeId === s.id ? undefined : s.id)} />
            ))}
          </View>
        </>
      ) : null}
      <Text style={styles.label}>To&apos;lov usuli</Text>
      <View style={styles.row}>
        {METHODS.map((m) => (
          <Chip key={m} label={PAY_METHOD_LABEL[m]} active={method === m} onPress={() => setMethod(m)} />
        ))}
      </View>
      <Input label="Summa (so'm)" required icon="cash-outline" keyboardType="number-pad" placeholder="0" value={amount} onChangeText={(t) => { setError(''); setAmount(formatAmountInput(t)); }} error={error} autoFocus />
      <Input label="Izoh" placeholder="Masalan: elektr to'lovi" value={note} onChangeText={setNote} maxLength={300} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
});
