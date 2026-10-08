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
import { useData } from '@/src/context/DataContext';
import { formatAmountInput, formatMoney, parseAmount } from '@/src/utils/format';

export default function PaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getBooking, paidFor, addPayment } = useData();
  const booking = getBooking(id);
  const [type, setType] = useState<'deposit' | 'income'>(
    booking && booking.depositAmount === 0 ? 'deposit' : 'income'
  );
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  if (!booking) {
    return (
      <Screen>
        <PageHeader title="To'lov qabul qilish" back />
        <EmptyState icon="alert-circle-outline" title="Bron topilmadi" />
      </Screen>
    );
  }

  const remaining = Math.max(0, booking.totalAmount - paidFor(booking.id));
  const value = parseAmount(amount);

  const submit = () => {
    if (value <= 0) return setError('Summani kiriting');
    if (value > remaining) return setError(`Qoldiqdan oshmasin: ${formatMoney(remaining)}`);
    addPayment(booking.id, value, type);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    router.back();
  };

  return (
    <Screen
      keyboard
      edges={['top', 'left', 'right', 'bottom']}
      footer={<Button title="Tasdiqlash" icon="checkmark" variant="success" onPress={submit} disabled={remaining === 0} />}
    >
      <PageHeader title="To'lov qabul qilish" subtitle={booking.clientName} back />
      <Card style={styles.summary}>
        <View style={styles.between}>
          <Text style={styles.label}>Jami summa</Text>
          <Text style={styles.value}>{formatMoney(booking.totalAmount)}</Text>
        </View>
        <View style={styles.between}>
          <Text style={styles.label}>Qoldiq</Text>
          <Text style={[styles.value, { color: remaining ? Colors.danger : Colors.success }]}>
            {formatMoney(remaining)}
          </Text>
        </View>
      </Card>

      <Text style={styles.fieldLabel}>To&apos;lov turi</Text>
      <View style={styles.chips}>
        <Chip label="Zakalat" active={type === 'deposit'} onPress={() => setType('deposit')} />
        <Chip label="To'lov" active={type === 'income'} onPress={() => setType('income')} />
      </View>

      <Input
        label="Summa (so'm)"
        icon="cash-outline"
        keyboardType="number-pad"
        placeholder="0"
        value={amount}
        onChangeText={(t) => {
          setError('');
          setAmount(formatAmountInput(t));
        }}
        error={error}
        autoFocus
      />
      {remaining > 0 ? (
        <Chip label={`Qoldiqni to'liq: ${formatMoney(remaining)}`} active={false} onPress={() => setAmount(formatAmountInput(String(remaining)))} />
      ) : (
        <Text style={styles.done}>Bron to&apos;liq to&apos;langan ✓</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { gap: 8, marginBottom: Spacing.lg },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, color: Colors.textSecondary },
  value: { fontSize: 16, fontWeight: '700', color: Colors.text },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  chips: { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
  done: { fontSize: 14, color: Colors.success, fontWeight: '600', textAlign: 'center' },
});
