import React, { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/src/components/ui/Screen';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Tabs } from '@/src/components/ui/Tabs';
import { StatusBadge } from '@/src/components/ui/Badge';
import { Sheet, SheetOption } from '@/src/components/ui/Sheet';
import { EmptyState, IconCircle, PageHeader } from '@/src/components/ui/Misc';
import { FoodThumb } from '@/src/components/FoodThumb';
import { Colors, HIT_SLOP, Radius, Spacing } from '@/src/theme';
import { errorMessage, useBooking, useData } from '@/src/context/DataContext';
import { useIsOwner } from '@/src/context/AuthContext';
import type { Booking, BookingStatus } from '@/src/types';
import {
  EVENT_LABEL,
  PAY_KIND_LABEL,
  PAY_METHOD_LABEL,
  STATUS_LABEL,
  formatDateShort,
  formatDateTime,
  formatMoney,
  formatMoneyCompact,
  formatPhone,
  pluralGuests,
} from '@/src/utils/format';
import { callPhone, openTelegramByPhone } from '@/src/utils/linking';
import { confirm, notify } from '@/src/utils/dialog';

type Tab = 'info' | 'menu' | 'payments' | 'staff';

/** Lokma ilovasi bronlari "Yangi"/"Zakalat kutilmoqda"ga qaytmaydi (server qoidasi) */
const statusOptions = (b: Booking): BookingStatus[] =>
  (b.source === 'app' ? ['confirmed', 'completed', 'cancelled'] : ['pending', 'deposit', 'confirmed', 'completed', 'cancelled']).filter((s) => s !== b.status) as BookingStatus[];

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getBooking, getMenu, staff, setStatus, assignStaff } = useData();
  const { booking: fresh } = useBooking(id);
  const isOwner = useIsOwner();
  const [tab, setTab] = useState<Tab>('info');
  const [statusSheet, setStatusSheet] = useState(false);
  const [staffSheet, setStaffSheet] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const booking = fresh ?? getBooking(id);

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
  const menuName = menu?.name ?? b.menuName;
  const paid = b.paidAmount;
  const remaining = b.balance;
  const paidPct = b.totalAmount > 0 ? Math.min(100, Math.round((paid / b.totalAmount) * 100)) : 0;
  const depositPct = b.totalAmount > 0 ? Math.min(100, Math.round((b.depositAmount / b.totalAmount) * 100)) : 0;
  const assigned = staff.filter((s) => b.staffIds.includes(s.id));
  const closed = b.status === 'cancelled' || b.status === 'completed';
  const waitingPayment = b.source === 'app' && b.status === 'pending' && b.holdUntil;

  const applyStatus = async (s: BookingStatus) => {
    setStatusSheet(false);
    if (s === 'cancelled' && !(await confirm('Bronni bekor qilish', `${b.clientName} broni bekor qilinadi va seans bo'shaydi.`, { ok: 'Bekor qilish', destructive: true }))) return;
    setBusy(true);
    try {
      await setStatus(b.id, s);
    } catch (e) {
      notify("Holat o'zgarmadi", errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const openStaffSheet = () => { setPicked(b.staffIds); setStaffSheet(true); };
  const saveStaff = async () => {
    setStaffSheet(false);
    setBusy(true);
    try {
      await assignStaff(b.id, picked);
    } catch (e) {
      notify('Xodimlar saqlanmadi', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const shareReceipt = () => Share.share({ message: receiptText(b, menuName, paid, remaining) }).catch(() => {});

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
            <Button title="Qo'ng'iroq" icon="call" variant="info" style={styles.flex} onPress={() => callPhone(b.clientPhone)} />
          </View>
          <View style={styles.quick}>
            <QuickAction icon="paper-plane-outline" label="Telegram" onPress={() => openTelegramByPhone(b.clientPhone)} />
            {isOwner && !closed ? (
              <QuickAction icon="create-outline" label="Tahrirlash" onPress={() => router.push({ pathname: '/booking/new', params: { id: b.id } })} />
            ) : null}
            {isOwner ? <QuickAction icon="receipt-outline" label="Chek" onPress={shareReceipt} /> : null}
          </View>
        </View>
      }
    >
      <PageHeader
        title="Bron tafsilotlari"
        back
        right={
          isOwner && statusOptions(b).length > 0 && b.status !== 'cancelled' ? (
            <Pressable onPress={() => setStatusSheet(true)} hitSlop={HIT_SLOP} accessibilityRole="button" accessibilityLabel="Holatni o'zgartirish" disabled={busy}>
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
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <StatusBadge status={b.status} />
            {b.source === 'app' ? (
              <View style={styles.source} accessibilityLabel="Lokma ilovasi orqali">
                <Ionicons name="phone-portrait-outline" size={11} color={Colors.info} />
                <Text style={styles.sourceText}>Lokma{b.number ? ` · ${b.number}` : ''}</Text>
              </View>
            ) : null}
          </View>
        </View>
        {waitingPayment ? (
          <Text style={styles.hold}>Mijoz zakalat to&apos;lashini kutmoqda: seans {formatHoldTime(b.holdUntil!)} gacha ushlab turiladi.</Text>
        ) : null}
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
            <InfoRow icon="calendar-outline" label="Seans" value={b.sessionLabel} />
            <InfoRow icon="time-outline" label="Vaqt" value={`${b.time}${b.endTime ? ` – ${b.endTime}` : ''}`} />
            <InfoRow icon="people-outline" label="Mehmonlar" value={pluralGuests(b.guestCount)} />
            {b.notes ? <InfoRow icon="chatbubble-ellipses-outline" label="Izoh" value={b.notes} /> : null}
          </Card>
          {b.extras.length > 0 ? (
            <Card style={styles.mt}>
              <Text style={styles.cardTitle}>Qo&apos;shimcha xizmatlar</Text>
              {b.extras.map((x) => (
                <InfoRow key={x.name} icon={x.type === 'video' ? 'videocam-outline' : 'car-sport-outline'} label={x.type === 'video' ? 'Videochi' : 'Kortej'} value={isOwner ? `${x.name} · ${formatMoney(x.price)}` : x.name} />
              ))}
            </Card>
          ) : null}
          {menuName ? (
            <Card style={[styles.mt, styles.rowGap]} onPress={() => setTab('menu')}>
              <FoodThumb size={48} photo={menu?.photo ?? menu?.dishes.find((d) => d.photo)?.photo} />
              <View style={styles.flex}>
                <Text style={styles.cardTitleInline}>Menyu</Text>
                <Text style={styles.strong}>{menuName}</Text>
                {menu && isOwner ? <Text style={styles.sub}>{formatMoney(menu.pricePerPerson)} / 1 kishi</Text> : null}
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
              <FoodThumb size={56} photo={menu.photo ?? menu.dishes.find((d) => d.photo)?.photo} />
              <View style={styles.flex}>
                <Text style={styles.strong}>{menu.name}</Text>
                {isOwner ? <Text style={styles.sub}>{formatMoney(menu.pricePerPerson)} / 1 kishi</Text> : null}
              </View>
            </View>
            <View style={styles.divider} />
            {menu.dishes.map((d, i) => (
              <View key={d.id} style={styles.dishRow}>
                <FoodThumb size={28} seed={i} photo={d.photo} />
                <Text style={styles.dish}>{d.name}</Text>
              </View>
            ))}
            {isOwner ? (
              <>
                <View style={styles.divider} />
                <View style={styles.between}>
                  <Text style={styles.sub}>
                    {pluralGuests(b.guestCount)} × {formatMoney(b.pricePerGuest || menu.pricePerPerson)}
                  </Text>
                  <Text style={styles.strong}>{formatMoney((b.pricePerGuest || menu.pricePerPerson) * b.guestCount)}</Text>
                </View>
              </>
            ) : null}
          </Card>
        ) : menuName ? (
          <EmptyState icon="restaurant-outline" title={menuName} hint="Bu menyu paketi endi mavjud emas." />
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
              <Text style={[styles.strong, { color: remaining > 0 ? Colors.danger : Colors.success }]}>{formatMoney(remaining)}</Text>
            </View>
          </Card>
          {b.payments.length === 0 ? (
            <EmptyState icon="cash-outline" title="Hali to'lov yo'q" />
          ) : (
            b.payments.map((p) => (
              <Card key={p.id} style={[styles.mt, styles.rowGap]}>
                <IconCircle
                  name={p.kind === 'deposit' ? 'lock-closed-outline' : p.kind === 'refund' ? 'return-down-back-outline' : 'cash-outline'}
                  size={38}
                  color={p.kind === 'deposit' ? Colors.warning : p.kind === 'refund' ? Colors.danger : Colors.success}
                  bg={p.kind === 'deposit' ? Colors.warningBg : p.kind === 'refund' ? Colors.dangerBg : Colors.successBg}
                  style={{ borderWidth: 0 }}
                />
                <View style={styles.flex}>
                  <Text style={styles.strong}>{PAY_KIND_LABEL[p.kind]} · {PAY_METHOD_LABEL[p.method]}</Text>
                  <Text style={styles.sub}>{formatDateTime(p.at)}{p.note ? ` · ${p.note}` : ''}</Text>
                </View>
                <Text style={[styles.strong, { color: p.kind === 'refund' ? Colors.danger : Colors.success }]}>{p.kind === 'refund' ? '−' : '+'}{formatMoney(p.amount)}</Text>
              </Card>
            ))
          )}
        </>
      ) : null}

      {tab === 'staff' ? (
        <>
          {assigned.length === 0 ? (
            <EmptyState icon="people-outline" title="Xodimlar biriktirilmagan" />
          ) : (
            assigned.map((s) => (
              <Card key={s.id} style={[styles.rowGap, { marginBottom: Spacing.sm }]}>
                <IconCircle name="person-outline" size={40} />
                <View style={styles.flex}>
                  <Text style={styles.strong}>{s.name}</Text>
                  <Text style={styles.sub}>{s.position}</Text>
                </View>
                <Pressable onPress={() => callPhone(s.phone)} hitSlop={HIT_SLOP} accessibilityRole="button" accessibilityLabel={`${s.name} ga qo'ng'iroq`}>
                  <Ionicons name="call-outline" size={20} color={Colors.info} />
                </Pressable>
              </Card>
            ))
          )}
          {isOwner && b.status !== 'cancelled' ? <Button title={assigned.length ? "Xodimlarni o'zgartirish" : 'Xodim biriktirish'} icon="person-add-outline" variant="soft" onPress={openStaffSheet} style={styles.mt} /> : null}
        </>
      ) : null}

      <Sheet visible={statusSheet} title="Holatni o'zgartirish" subtitle={`Hozirgi holat: ${STATUS_LABEL[b.status]}`} onClose={() => setStatusSheet(false)}>
        {statusOptions(b).map((s) => (
          <SheetOption key={s} label={STATUS_LABEL[s]} destructive={s === 'cancelled'} onPress={() => applyStatus(s)} />
        ))}
      </Sheet>

      <Sheet
        visible={staffSheet}
        title="Xodim biriktirish"
        subtitle="Shu tadbirda ishlaydigan xodimlarni tanlang"
        onClose={() => setStaffSheet(false)}
        footer={<Button title="Saqlash" icon="checkmark" onPress={saveStaff} />}
      >
        {staff.filter((s) => s.active).map((s) => (
          <SheetOption
            key={s.id}
            label={s.name}
            hint={s.position}
            selected={picked.includes(s.id)}
            onPress={() => setPicked((p) => (p.includes(s.id) ? p.filter((x) => x !== s.id) : [...p, s.id]))}
          />
        ))}
      </Sheet>
    </Screen>
  );
}

const formatHoldTime = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

function receiptText(b: Booking, menuName: string | undefined, paid: number, remaining: number) {
  return [
    "LOKMA TO'YXONALAR — CHEK",
    '------------------------',
    b.number ? `Bron: ${b.number}` : null,
    `Mijoz: ${b.clientName}`,
    `Telefon: ${formatPhone(b.clientPhone)}`,
    `Sana: ${formatDateShort(b.date)}, ${b.time}${b.endTime ? ` – ${b.endTime}` : ''}`,
    `Tadbir: ${EVENT_LABEL[b.type]} · ${pluralGuests(b.guestCount)}`,
    b.hallName ? `Zal: ${b.hallName}` : null,
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
  source: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.infoBg, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  sourceText: { fontSize: 11, fontWeight: '700', color: Colors.info },
  hold: { fontSize: 12, color: Colors.warning, marginTop: 10, fontWeight: '600' },
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
