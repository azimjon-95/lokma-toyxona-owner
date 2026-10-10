import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Screen } from '@/src/components/ui/Screen';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { EmptyState, IconCircle, PageHeader, SectionTitle } from '@/src/components/ui/Misc';
import { StatusBadge } from '@/src/components/ui/Badge';
import { Colors, HIT_SLOP, Spacing } from '@/src/theme';
import { DataBanner } from '@/src/components/DataBanner';
import { useData } from '@/src/context/DataContext';
import type { Booking } from '@/src/types';
import {
  EVENT_LABEL,
  MONTHS,
  WEEKDAYS_SHORT,
  formatDateLong,
  pluralGuests,
  toISODate,
  todayISO,
} from '@/src/utils/format';

type DayKind = 'free' | 'deposit' | 'busy' | 'done';

const KIND_COLOR: Record<DayKind, string> = {
  free: Colors.success,
  deposit: Colors.warning,
  busy: Colors.danger,
  done: Colors.purple,
};

const LEGEND: { kind: DayKind; label: string }[] = [
  { kind: 'free', label: "Bo'sh" },
  { kind: 'deposit', label: 'Zakalat' },
  { kind: 'busy', label: 'Band' },
  { kind: 'done', label: 'Tadbir tugagan' },
];

function dayKind(list: Booking[] | undefined): DayKind {
  if (!list?.length) return 'free';
  if (list.some((b) => b.status === 'confirmed')) return 'busy';
  if (list.some((b) => b.status === 'deposit' || b.status === 'pending')) return 'deposit';
  return 'done';
}

export default function CalendarScreen() {
  const { bookings } = useData();
  const today = todayISO();
  const [selected, setSelected] = useState(today);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const byDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    for (const b of bookings) {
      if (b.status === 'cancelled') continue;
      (map[b.date] ??= []).push(b);
    }
    return map;
  }, [bookings]);

  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const offset = (first.getDay() + 6) % 7; // Dushanba = 0
    const days = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const arr: (string | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= days; d++) arr.push(toISODate(new Date(cursor.y, cursor.m, d)));
    while (arr.length % 7) arr.push(null);
    return arr;
  }, [cursor]);

  const shift = (delta: number) =>
    setCursor(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const goToday = () => {
    const d = new Date();
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
    setSelected(today);
  };

  const dayEvents = byDate[selected] ?? [];

  return (
    <Screen scroll>
      <PageHeader
        title="Kalendar"
        right={
          <Pressable onPress={goToday} hitSlop={HIT_SLOP} accessibilityRole="button">
            <Text style={styles.todayLink}>Bugun</Text>
          </Pressable>
        }
      />
      <DataBanner />

      <Card>
        <View style={styles.monthNav}>
          <Pressable onPress={() => shift(-1)} hitSlop={HIT_SLOP} style={styles.navBtn} accessibilityLabel="Oldingi oy">
            <Ionicons name="chevron-back" size={20} color={Colors.text} />
          </Pressable>
          <Text style={styles.monthTitle}>
            {MONTHS[cursor.m]} {cursor.y}
          </Text>
          <Pressable onPress={() => shift(1)} hitSlop={HIT_SLOP} style={styles.navBtn} accessibilityLabel="Keyingi oy">
            <Ionicons name="chevron-forward" size={20} color={Colors.text} />
          </Pressable>
        </View>

        <View style={styles.row}>
          {WEEKDAYS_SHORT.map((w) => (
            <Text key={w} style={styles.weekday}>
              {w}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((iso, i) => {
            if (!iso) return <View key={`e${i}`} style={styles.cell} />;
            const kind = dayKind(byDate[iso]);
            const isSel = iso === selected;
            const isToday = iso === today;
            const showDot = kind !== 'free' || iso >= today;
            return (
              <Pressable
                key={iso}
                style={styles.cell}
                onPress={() => setSelected(iso)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSel }}
                accessibilityLabel={`${formatDateLong(iso)}, ${LEGEND.find((l) => l.kind === kind)?.label}`}
              >
                <View style={[styles.dayCircle, isToday && styles.todayCircle, isSel && styles.selCircle]}>
                  <Text style={[styles.dayNum, isSel && styles.dayNumSel, iso < today && !isSel && styles.dayPast]}>
                    {Number(iso.slice(8))}
                  </Text>
                </View>
                <View style={[styles.dot, { backgroundColor: showDot ? KIND_COLOR[kind] : 'transparent' }]} />
              </Pressable>
            );
          })}
        </View>

        <View style={styles.legend}>
          {LEGEND.map((l) => (
            <View key={l.kind} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: KIND_COLOR[l.kind] }]} />
              <Text style={styles.legendText}>{l.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <SectionTitle>{selected === today ? 'Bugungi tadbirlar' : formatDateLong(selected)}</SectionTitle>
      {dayEvents.length === 0 ? (
        <>
          <EmptyState icon="calendar-clear-outline" title="Bu kunda tadbir yo'q" hint="Kun bo'sh — yangi bron qo'shishingiz mumkin." />
          {selected >= today ? (
            <Button
              title="Shu kunga bron qo'shish"
              icon="add"
              variant="outline"
              onPress={() => router.push({ pathname: '/booking/new', params: { date: selected } })}
            />
          ) : null}
        </>
      ) : (
        dayEvents.map((b) => (
          <Card
            key={b.id}
            style={styles.event}
            onPress={() => router.push({ pathname: '/booking/[id]', params: { id: b.id } })}
          >
            <IconCircle
              name="time-outline"
              size={40}
              color={KIND_COLOR[dayKind([b])]}
              bg={Colors.surfaceMuted}
            />
            <Text style={styles.eventTime}>{b.time}</Text>
            <View style={styles.flex}>
              <Text style={styles.eventTitle}>{EVENT_LABEL[b.type]}</Text>
              <Text style={styles.eventMeta}>{pluralGuests(b.guestCount)}</Text>
            </View>
            <StatusBadge status={b.status} compact />
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  todayLink: { color: Colors.primaryDark, fontWeight: '600', fontSize: 14 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  navBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  row: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, height: 46, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  todayCircle: { borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: Colors.goldSoft },
  selCircle: { backgroundColor: Colors.text, borderColor: Colors.text },
  dayNum: { fontSize: 14, fontWeight: '600', color: Colors.text },
  dayNumSel: { color: Colors.white },
  dayPast: { color: Colors.textMuted },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 14,
    rowGap: 6,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: Colors.textSecondary },
  event: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.sm },
  eventTime: { fontSize: 15, fontWeight: '700', color: Colors.text, width: 48 },
  eventTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  eventMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});
