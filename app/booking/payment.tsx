import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen } from '@/src/components/ui/Screen';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Chip, EmptyState, PageHeader } from '@/src/components/ui/Misc';
import { Colors, Spacing } from '@/src/theme';
import { errorMessage, useBooking, useData } from '@/src/context/DataContext';
import type { PayKind, PayMethod } from '@/src/types';
import { PAY_KIND_LABEL, PAY_METHOD_LABEL, formatAmountInput, formatMoney, parseAmount } from '@/src/utils/format';

const METHODS: PayMethod[] = ['cash', 'card', 'transfer', 'click', 'payme', 'other'];

export default function PaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addPayment, getBooking } = useData();
  const { booking: fresh } = useBooking(id);
  const booking = fresh ?? getBooking(id);
  const [kind, setKind] = useState<PayKind | undefined>(undefined);
  const [method, setMethod] = useState<PayMethod>('cash');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!booking) {
    return (
      <Screen>
        <PageHeader title="To'lov qabul qilish" back />
        <EmptyState icon="alert-circle-outline" title="Bron topilmadi" />
      </Screen>
    );
  }

  const remaining = booking.balance;
  // Zakalat to'lanmagan bo'lsa — standart "Zakalat", aks holda "To'lov"
  const activeKind: PayKind = kind ?? (booking.depositAmount === 0 ? 'deposit' : 'payment');
  const maxAmount = activeKind === 'refund' ? booking.paidAmount : remaining;
  const value = parseAmount(amount);
  const kinds: PayKind[] = booking.paidAmount > 0 ? ['deposit', 'payment', 'refund'] : ['deposit', 'payment'];

  const submit = async () => {
    if (value <= 0) return setError('Summani kiriting');
    if (value > maxAmount) return setError(activeKind === 'refund' ? `To'langandan oshmasin: ${formatMoney(booking.paidAmount)}` : `Qoldiqdan oshmasin: ${formatMoney(remaining)}`);
    setError('');
    setSaving(true);
    try {
      await addPayment(booking.id, { kind: activeKind, amount: value, method, note: note.trim() || undefined });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      keyboard
      scroll
      edges={['top', 'left', 'right', 'bottom']}
      footer={<Button title="Tasdiqlash" icon="checkmark" variant="success" onPress={submit} loading={saving} disabled={maxAmount === 0} />}
    >
      <PageHeader title="To'lov qabul qilish" subtitle={booking.clientName} back />
      <Card style={styles.summary}>
        <View style={styles.between}>
          <Text style={styles.label}>Jami summa</Text>
          <Text style={styles.value}>{formatMoney(booking.totalAmount)}</Text>
        </View>
        <View style={styles.between}>
          <Text style={styles.label}>To&apos;langan</Text>
          <Text style={styles.value}>{formatMoney(booking.paidAmount)}</Text>
        </View>
        <View style={styles.between}>
          <Text style={styles.label}>Qoldiq</Text>
          <Text style={[styles.value, { color: remaining ? Colors.danger : Colors.success }]}>{formatMoney(remaining)}</Text>
        </View>
      </Card>

      <Text style={styles.fieldLabel}>To&apos;lov turi</Text>
      <View style={styles.chips}>
        {kinds.map((k) => (
          <Chip key={k} label={PAY_KIND_LABEL[k]} active={activeKind === k} onPress={() => { setKind(k); setError(''); }} />
        ))}
      </View>

      <Text style={styles.fieldLabel}>To&apos;lov usuli</Text>
      <View style={styles.chips}>
        {METHODS.map((m) => (
          <Chip key={m} label={PAY_METHOD_LABEL[m]} active={method === m} onPress={() => setMethod(m)} />
        ))}
      </View>

      <Input
        label="Summa (so'm)"
        icon="cash-outline"
        keyboardType="number-pad"
        placeholder="0"
        value={amount}
        onChangeText={(t) => { setError(''); setAmount(formatAmountInput(t)); }}
        error={error}
        autoFocus
      />
      {maxAmount > 0 ? (
        <Chip label={`${activeKind === 'refund' ? "To'langanning hammasi" : "Qoldiqni to'liq"}: ${formatMoney(maxAmount)}`} active={false} onPress={() => setAmount(formatAmountInput(String(maxAmount)))} />
      ) : (
        <Text style={styles.done}>{activeKind === 'refund' ? "Qaytariladigan to'lov yo'q" : "Bron to'liq to'langan ✓"}</Text>
      )}
      <View style={{ height: Spacing.md }} />
      <Input label="Izoh (ixtiyoriy)" placeholder="Masalan: chek №123" value={note} onChangeText={setNote} maxLength={200} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { gap: 8, marginBottom: Spacing.lg },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, color: Colors.textSecondary },
  value: { fontSize: 16, fontWeight: '700', color: Colors.text },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  done: { fontSize: 14, fontWeight: '600', color: Colors.success, textAlign: 'center', marginTop: Spacing.sm },
});
