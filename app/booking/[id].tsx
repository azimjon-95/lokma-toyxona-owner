import React, { useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/src/components/ui/Screen';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Tabs } from '@/src/components/ui/Tabs';
import { StatusBadge } from '@/src/components/ui/Badge';
import { EmptyState, IconCircle, PageHeader } from '@/src/components/ui/Misc';
import { FoodThumb } from '@/src/components/FoodThumb';
import { Colors, HIT_SLOP, Radius, Spacing } from '@/src/theme';
import { useData } from '@/src/context/DataContext';
import { useIsOwner } from '@/src/context/AuthContext';
import type { Booking, BookingStatus } from '@/src/types';
import {
  EVENT_LABEL,
  STATUS_LABEL,
  formatDateShort,
  formatDateTime,
  formatMoney,
  formatMoneyCompact,
  formatPhone,
  pluralGuests,
} from '@/src/utils/format';
import { callPhone, openTelegramByPhone } from '@/src/utils/linking';

type Tab = 'info' | 'menu' | 'payments' | 'staff';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getBooking, getMenu, paidFor, transactions, staff, setStatus } = useData();
  const isOwner = useIsOwner();
  const [tab, setTab] = useState<Tab>('info');
  const booking = getBooking(id);

  if (!booking) {
    return (
      <Screen>
        <PageHeader title="Bron tafsilotlari" back />
        <EmptyState icon="alert-circle-outline" title="Bron topilmadi" hint="U o'chirilgan bo'lishi mumkin." />
      </Screen>
    );
  }

  const b = booking;
  const menu = getMenu(b.menuId);
  const paid = paidFor(b.id);
  const remaining = Math.max(0, b.totalAmount - paid);
  const paidPct = b.totalAmount > 0 ? Math.min(100, Math.round((paid / b.totalAmount) * 100)) : 0;
  const depositPct = b.totalAmount > 0 ? Math.min(100, Math.round((b.depositAmount / b.totalAmount) * 100)) : 0;
  const payments = transactions.filter((t) => t.bookingId === b.id);
  const assigned = staff.filter((s) => b.staffIds.includes(s.id));
  const closed = b.status === 'cancelled' || b.status === 'completed';

  const changeStatus = () => {
    const options: BookingStatus[] = (['confirmed', 'completed', 'cancelled'] as BookingStatus[]).filter(
      (s) => s !== b.status
    );
    Alert.alert('Holatni o\'zgartirish', `Hozirgi holat: ${STATUS_LABEL[b.status]}`, [
      ...options.map((s) => ({
        text: STATUS_LABEL[s],
        style: s === 'cancelled' ? ('destructive' as const) : ('default' as const),
        onPress: () => setStatus(b.id, s),
      })),
      { text: 'Yopish', style: 'cancel' as const },
    ]);
  };

  const shareReceipt = () =>
    Share.share({ message: receiptText(b, menu?.name, paid, remaining) }).catch(() => {});

  return (
    <Screen
      scroll
      edges={['top', 'left', 'right', 'bottom']}
      footer={
        <View style={styles.footer}>
          <View style={styles.actions}>
            {isOwner && !closed ? (
              <Button
                title="To'lov qabul qilish"
                icon="cash-outline"
                variant="success"
                style={styles.flex}
                onPress={() => router.push({ pathname: '/booking/payment', params: { id: b.id } })}
              />
            ) : null}
            <Button
              title="Qo'ng'iroq"
              icon="call"
              variant="info"
              style={styles.flex}
              onPress={() => callPhone(b.clientPhone)}
            />
          </View>
          <View style={styles.quick}>
            <QuickAction icon="paper-plane-outline" label="Telegram" onPress={() => openTelegramByPhone(b.clientPhone)} />
            {isOwner && !closed ? (
              <QuickAction
                icon="create-outline"
                label="Tahrirlash"
                onPress={() => router.push({ pathname: '/booking/new', params: { id: b.id } })}
              />
            ) : null}
            <QuickAction icon="receipt-outline" label="Chek" onPress={shareReceipt} />
          </View>
        </View>
      }
    >
      <PageHeader
        title="Bron tafsilotlari"
        back
        right={
          isOwner ? (
            <Pressable onPress={changeStatus} hitSlop={HIT_SLOP} accessibilityRole="button" accessibilityLabel="Holatni o'zgartirish">
              <Ionicons name="ellipsis-horizontal-circle-outline" size={26} color={Colors.text} />
            </Pressable>
          ) : undefined
        }
      />

      <Card style={styles.headCard}>
        <View style={styles.headRow}>
          <View style={styles.flex}>
            <Text style={styles.date}>
              {formatDateShort(b.date)}, {b.time}
            </Text>
            <Text style={styles.sub}>
              {EVENT_LABEL[b.type]} · {pluralGuests(b.guestCount)}
            </Text>
            <View style={styles.clientMini}>
              <Ionicons name="person-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.sub}>{b.clientName}</Text>
            </View>
          </View>
          <StatusBadge status={b.status} />
        </View>
      </Card>

      {isOwner ? (
        <View style={styles.moneyRow}>
          <Card style={styles.flex}>
            <Text style={styles.moneyLabel}>Jami summa</Text>
            <Text style={[styles.moneyValue, { color: Colors.success }]} adjustsFontSizeToFit numberOfLines={1}>
              {formatMoneyCompact(b.totalAmount)}
            </Text>
          </Card>
          <Card style={styles.flex}>
            <View style={styles.between}>
              <Text style={styles.moneyLabel}>Zakalat</Text>
              <Text style={styles.pct}>{depositPct}%</Text>
            </View>
            <Text style={[styles.moneyValue, { color: Colors.warning }]} adjustsFontSizeToFit numberOfLines={1}>
              {formatMoneyCompact(b.depositAmount)}
            </Text>
            <Progress value={depositPct} color={Colors.warning} />
          </Card>
        </View>
      ) : null}

      <Tabs
        variant="underline"
        value={tab}
        onChange={setTab}
        items={[
          { key: 'info', label: "Ma'lumot" },
          { key: 'menu', label: 'Menyu' },
          ...(isOwner ? [{ key: 'payments' as const, label: "To'lovlar" }] : []),
          { key: 'staff', label: 'Xodimlar' },
        ]}
      />

      {tab === 'info' ? (
        <>
          <Card>
            <Text style={styles.cardTitle}>Mijoz ma&apos;lumotlari</Text>
            <View style={styles.rowGap}>
              <IconCircle name="person" size={48} />
              <View style={styles.flex}>
                <Text style={styles.strong}>{b.clientName}</Text>
                <Text style={styles.sub}>{formatPhone(b.clientPhone)}</Text>
                {b.address ? <Text style={styles.sub}>{b.address}</Text> : null}
              </View>
            </View>
          </Card>
          <Card style={styles.mt}>
            <Text style={styles.cardTitle}>Tadbir</Text>
            <InfoRow icon="business-outline" label="Zal" value={b.hallName ?? '—'} />
            <InfoRow icon="time-outline" label="Vaqt" value={`${b.time}${b.endTime ? ` – ${b.endTime}` : ''}`} />
            <InfoRow icon="people-outline" label="Mehmonlar" value={pluralGuests(b.guestCount)} />
            {b.notes ? <InfoRow icon="chatbubble-ellipses-outline" label="Izoh" value={b.notes} /> : null}
          </Card>
          {menu ? (
            <Card style={[styles.mt, styles.rowGap]} onPress={() => setTab('menu')}>
              <FoodThumb size={48} />
              <View style={styles.flex}>
                <Text style={styles.cardTitleInline}>Menyu</Text>
                <Text style={styles.strong}>{menu.name}</Text>
                <Text style={styles.sub}>{formatMoney(menu.pricePerPerson)} / 1 kishi</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </Card>
          ) : null}
        </>
      ) : null}

      {tab === 'menu' ? (
        menu ? (
          <Card>
            <View style={styles.rowGap}>
              <FoodThumb size={56} />
              <View style={styles.flex}>
                <Text style={styles.strong}>{menu.name}</Text>
                <Text style={styles.sub}>{formatMoney(menu.pricePerPerson)} / 1 kishi</Text>
              </View>
            </View>
            <View style={styles.divider} />
            {menu.dishes.map((d) => (
              <View key={d} style={styles.dishRow}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                <Text style={styles.dish}>{d}</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.between}>
              <Text style={styles.sub}>
                {pluralGuests(b.guestCount)} × {formatMoney(menu.pricePerPerson)}
              </Text>
              <Text style={styles.strong}>{formatMoney(menu.pricePerPerson * b.guestCount)}</Text>
            </View>
          </Card>
        ) : (
          <EmptyState icon="restaurant-outline" title="Menyu tanlanmagan" />
        )
      ) : null}

      {tab === 'payments' ? (
        <>
          <Card>
            <View style={styles.between}>
              <Text style={styles.moneyLabel}>To&apos;langan</Text>
              <Text style={styles.strong}>{formatMoney(paid)}</Text>
            </View>
            <Progress value={paidPct} color={Colors.success} />
            <View style={[styles.between, { marginTop: 8 }]}>
              <Text style={styles.moneyLabel}>Qoldiq</Text>
              <Text style={[styles.strong, { color: remaining > 0 ? Colors.danger : Colors.success }]}>
                {formatMoney(remaining)}
              </Text>
            </View>
          </Card>
          {payments.length === 0 ? (
            <EmptyState icon="cash-outline" title="Hali to'lov yo'q" />
          ) : (
            payments.map((p) => (
              <Card key={p.id} style={[styles.mt, styles.rowGap]}>
                <IconCircle
                  name={p.type === 'deposit' ? 'lock-closed-outline' : 'cash-outline'}
                  size={38}
                  color={p.type === 'deposit' ? Colors.warning : Colors.success}
                  bg={p.type === 'deposit' ? Colors.warningBg : Colors.successBg}
                  style={{ borderWidth: 0 }}
                />
                <View style={styles.flex}>
                  <Text style={styles.strong}>{p.title}</Text>
                  <Text style={styles.sub}>{formatDateTime(p.createdAt)}</Text>
                </View>
                <Text style={[styles.strong, { color: Colors.success }]}>+{formatMoney(p.amount)}</Text>
              </Card>
            ))
          )}
        </>
      ) : null}

      {tab === 'staff' ? (
        assigned.length === 0 ? (
          <EmptyState icon="people-outline" title="Xodimlar biriktirilmagan" />
        ) : (
          assigned.map((s) => (
            <Card key={s.id} style={[styles.rowGap, { marginBottom: Spacing.sm }]}>
              <IconCircle name="person-outline" size={40} />
              <View style={styles.flex}>
                <Text style={styles.strong}>{s.name}</Text>
                <Text style={styles.sub}>{s.role}</Text>
              </View>
              <Pressable
                onPress={() => callPhone(s.phone)}
                hitSlop={HIT_SLOP}
                accessibilityRole="button"
                accessibilityLabel={`${s.name} ga qo'ng'iroq`}
              >
                <Ionicons name="call-outline" size={20} color={Colors.info} />
              </Pressable>
            </Card>
          ))
        )
      ) : null}
    </Screen>
  );
}

function receiptText(b: Booking, menuName: string | undefined, paid: number, remaining: number) {
  return [
    "LOKMA TO'YXONALAR — CHEK",
    '------------------------',
    `Mijoz: ${b.clientName}`,
    `Telefon: ${formatPhone(b.clientPhone)}`,
    `Sana: ${formatDateShort(b.date)}, ${b.time}`,
    `Tadbir: ${EVENT_LABEL[b.type]} · ${pluralGuests(b.guestCount)}`,
    menuName ? `Menyu: ${menuName}` : null,
    '------------------------',
    `Jami: ${formatMoney(b.totalAmount)}`,
    `To'langan: ${formatMoney(paid)}`,
    `Qoldiq: ${formatMoney(remaining)}`,
  ]
    .filter(Boolean)
    .join('\n');
}

function Progress({ value, color }: { value: number; color: string }) {
  return (
    <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: value }}>
      <View style={[styles.bar, { width: `${value}%`, backgroundColor: color }]} />
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={Colors.textMuted} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.quickItem} accessibilityRole="button" hitSlop={HIT_SLOP}>
      <Ionicons name={icon} size={18} color={Colors.text} />
      <Text style={styles.quickText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  mt: { marginTop: Spacing.sm + 2 },
  headCard: { marginBottom: Spacing.sm + 2 },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  date: { fontSize: 18, fontWeight: '800', color: Colors.text },
  sub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  clientMini: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  moneyRow: { flexDirection: 'row', gap: Spacing.sm + 2, marginBottom: Spacing.sm },
  moneyLabel: { fontSize: 12, color: Colors.textSecondary },
  moneyValue: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  pct: { fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  track: { height: 6, borderRadius: 3, backgroundColor: Colors.surfaceMuted, marginTop: 8, overflow: 'hidden' },
  bar: { height: 6, borderRadius: 3 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  cardTitleInline: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginBottom: 2 },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  strong: { fontSize: 15, fontWeight: '700', color: Colors.text },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 6 },
  infoLabel: { fontSize: 13, color: Colors.textSecondary, width: 80 },
  infoValue: { flex: 1, fontSize: 14, color: Colors.text, fontWeight: '500' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.borderStrong, marginVertical: 12 },
  dishRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  dish: { fontSize: 14, color: Colors.text },
  footer: { gap: 10 },
  actions: { flexDirection: 'row', gap: 10 },
  quick: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 8 },
  quickText: { fontSize: 13, fontWeight: '600', color: Colors.text },
});
