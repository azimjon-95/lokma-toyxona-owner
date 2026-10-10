import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Screen } from '@/src/components/ui/Screen';
import { Card } from '@/src/components/ui/Card';
import { Tabs } from '@/src/components/ui/Tabs';
import { EmptyState, IconCircle, PageHeader, SectionTitle } from '@/src/components/ui/Misc';
import { PageHeaderAction } from '@/src/components/ui/PageHeaderAction';
import { Colors, Radius, Spacing } from '@/src/theme';
import { errorMessage, useData, useFinance, useOperations } from '@/src/context/DataContext';
import type { TransactionType } from '@/src/types';
import { PAY_METHOD_LABEL, formatDateTime, formatMoney, formatNumber, formatNumberCompact } from '@/src/utils/format';
import { confirm, notify } from '@/src/utils/dialog';

type Tab = 'all' | 'income' | 'expense';

const TX_STYLE: Record<TransactionType, { icon: React.ComponentProps<typeof Ionicons>['name']; fg: string; bg: string }> = {
  income: { icon: 'cash-outline', fg: Colors.success, bg: Colors.successBg },
  deposit: { icon: 'lock-closed-outline', fg: Colors.warning, bg: Colors.warningBg },
  expense: { icon: 'cart-outline', fg: Colors.danger, bg: Colors.dangerBg },
  refund: { icon: 'return-down-back-outline', fg: Colors.danger, bg: Colors.dangerBg },
};

export default function FinanceScreen() {
  const [tab, setTab] = useState<Tab>('all');
  const { deleteTransaction } = useData();
  const f = useFinance();
  const { operations, loading, error, refetch } = useOperations();

  // Qaytarilgan to'lovlar ham "Xarajat" ro'yxatida (daromadni kamaytiradi)
  const list = operations.filter((t) =>
    tab === 'all' ? true : tab === 'expense' ? t.type === 'expense' || t.type === 'refund' : t.type === 'income' || t.type === 'deposit'
  );

  const removeTx = async (id: string, title: string) => {
    if (!(await confirm("Yozuvni o'chirish", `"${title}" o'chiriladi.`, { ok: "O'chirish", destructive: true }))) return;
    try {
      await deleteTransaction(id);
      void refetch();
    } catch (e) {
      notify("O'chirilmadi", errorMessage(e));
    }
  };

  return (
    <Screen scroll edges={['top', 'left', 'right', 'bottom']}>
      <PageHeader title="Moliya" back right={<PageHeaderAction icon="add-circle-outline" label="Xarajat qo'shish" onPress={() => router.push('/expense')} />} />
      <Tabs
        items={[
          { key: 'all', label: 'Barchasi' },
          { key: 'income', label: 'Daromad' },
          { key: 'expense', label: 'Xarajat' },
        ]}
        value={tab}
        onChange={setTab}
      />

      <LinearGradient colors={['#14935F', '#0B7148']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <Text style={styles.heroLabel}>Jami tushum (shu oy)</Text>
        <Text style={styles.heroValue} adjustsFontSizeToFit numberOfLines={1}>
          {formatMoney(f.revenue)}
        </Text>
        {f.growthPercent !== null ? (
          <Text style={styles.heroGrowth}>
            {f.growthPercent >= 0 ? '↑' : '↓'} {Math.abs(f.growthPercent)}% o&apos;tgan oyga nisbatan
          </Text>
        ) : (
          <Text style={styles.heroGrowth}>Xarajatlar: {formatMoney(f.expenses)}</Text>
        )}
      </LinearGradient>

      <View style={styles.split}>
        <Stat label="Zakalat" value={f.deposit} />
        <Stat label="To'langan" value={f.paid} />
        <Stat label="Qoldiq" value={f.remaining} color={Colors.danger} />
      </View>

      <SectionTitle>So&apos;nggi operatsiyalar</SectionTitle>
      {error ? (
        <EmptyState icon="cloud-offline-outline" title={error} />
      ) : list.length === 0 ? (
        <EmptyState icon="receipt-outline" title={loading ? 'Yuklanmoqda…' : "Operatsiyalar yo'q"} />
      ) : (
        list.map((t) => {
          const s = TX_STYLE[t.type];
          const out = t.type === 'expense' || t.type === 'refund';
          const sign = out ? '-' : '+';
          return (
            <Card
              key={t.id}
              style={styles.tx}
              onPress={
                t.bookingId ? () => router.push({ pathname: '/booking/[id]', params: { id: t.bookingId! } }) : t.deletable ? () => void removeTx(t.id, t.title) : undefined
              }
            >
              <IconCircle name={s.icon} size={40} color={s.fg} bg={s.bg} style={{ borderWidth: 0 }} />
              <View style={styles.flex}>
                <Text style={styles.txTitle} numberOfLines={1}>
                  {t.title}
                </Text>
                <Text style={styles.txDate} numberOfLines={1}>
                  {formatDateTime(t.createdAt)} · {PAY_METHOD_LABEL[t.method]}{t.subtitle ? ` · ${t.subtitle}` : ''}
                </Text>
              </View>
              <Text style={[styles.txAmount, { color: out ? Colors.danger : Colors.text }]}>
                {sign}
                {formatNumber(t.amount)} so&apos;m
              </Text>
            </Card>
          );
        })
      )}
    </Screen>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <Card style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color && { color }]} adjustsFontSizeToFit numberOfLines={1}>
        {formatNumberCompact(value)}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { borderRadius: Radius.lg, padding: Spacing.md + 2 },
  heroLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '500' },
  heroValue: { color: Colors.white, fontSize: 30, fontWeight: '800', marginTop: 4 },
  heroGrowth: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4 },
  split: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm + 2 },
  stat: { flex: 1, paddingHorizontal: 10 },
  statLabel: { fontSize: 12, color: Colors.textSecondary },
  statValue: { fontSize: 15, fontWeight: '800', color: Colors.text, marginTop: 4 },
  tx: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.sm },
  txTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  txDate: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  txAmount: { fontSize: 13, fontWeight: '700' },
});
