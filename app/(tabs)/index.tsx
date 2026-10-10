import { useMemo } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Screen } from '@/src/components/ui/Screen';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Logo } from '@/src/components/ui/Logo';
import { IconCircle } from '@/src/components/ui/Misc';
import { HallBanner } from '@/src/components/HallBanner';
import { Colors, HIT_SLOP, Radius, Spacing } from '@/src/theme';
import { useAuth } from '@/src/context/AuthContext';
import { DataBanner, SubscriptionBanner } from '@/src/components/DataBanner';
import { useData, useFinance } from '@/src/context/DataContext';
import { EVENT_LABEL, formatDateLong, formatMoneyCompact, pluralGuests, todayISO } from '@/src/utils/format';

export default function HomeScreen() {
  const { user } = useAuth();
  const { bookings, refresh, refreshing } = useData();
  const fin = useFinance();
  const isOwner = user?.role === 'owner';

  const { todayEvent, nextEvent, newCount } = useMemo(() => {
    const today = todayISO();
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const active = bookings.filter((b) => b.status !== 'cancelled');
    const todays = active.filter((b) => b.date === today);
    // Hozir davom etayotgan yoki keyingi tadbir; bo'lmasa — bugungi oxirgisi
    const current =
      todays.find((b) => (b.endTime ?? '23:59') >= hhmm) ?? todays[todays.length - 1];
    return {
      todayEvent: current,
      nextEvent: active.find((b) => b.date > today),
      newCount: bookings.filter((b) => b.status === 'pending').length,
    };
  }, [bookings]);

  const growth = fin.todayGrowthPercent;

  return (
    <Screen scroll refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={Colors.primary} />}>
      <View style={styles.header}>
        <Logo size="sm" layout="row" />
        <View style={styles.headerRight}>
          <View style={styles.user}>
            <IconCircle name="person" size={32} />
            <View>
              <Text style={styles.userName} numberOfLines={1}>{user?.name}</Text>
              <Text style={styles.userRole}>{isOwner ? "To'yxona egasi" : 'Xodim'}</Text>
            </View>
          </View>
          <Pressable
            hitSlop={HIT_SLOP}
            onPress={() => router.push({ pathname: '/bookings', params: { filter: 'pending' } })}
            accessibilityRole="button"
            accessibilityLabel={`Bildirishnomalar: ${newCount} ta yangi bron`}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.text} />
            {newCount > 0 ? <View style={styles.dot} /> : null}
          </Pressable>
        </View>
      </View>

      <SubscriptionBanner />
      <DataBanner />

      <HallBanner style={styles.banner}>
        <View style={styles.bannerBody}>
          <Text style={styles.bannerLabel}>Bugungi tadbir</Text>
          {todayEvent ? (
            <>
              <Text style={styles.bannerTitle}>{EVENT_LABEL[todayEvent.type]}</Text>
              <View style={styles.bannerMetaRow}>
                <Ionicons name="people-outline" size={14} color="#F4E3BE" />
                <Text style={styles.bannerMeta}>{pluralGuests(todayEvent.guestCount)}</Text>
              </View>
              <View style={styles.bannerFooter}>
                <View style={styles.bannerMetaRow}>
                  <Ionicons name="time-outline" size={14} color="#F4E3BE" />
                  <Text style={styles.bannerMeta}>
                    {todayEvent.time}
                    {todayEvent.endTime ? ` – ${todayEvent.endTime}` : ''}
                  </Text>
                </View>
                <Button
                  title="Tafsilotlar"
                  size="sm"
                  onPress={() => router.push({ pathname: '/booking/[id]', params: { id: todayEvent.id } })}
                />
              </View>
            </>
          ) : (
            <Text style={styles.bannerTitleSm}>Bugun tadbir rejalashtirilmagan</Text>
          )}
        </View>
      </HallBanner>

      {isOwner ? (
        <View style={styles.stats}>
          <Card style={styles.stat} onPress={() => router.push('/finance')} accessibilityLabel="Bugungi tushum">
            <View style={styles.statHead}>
              <Text style={styles.statLabel}>Bugungi tushum</Text>
              {growth !== null ? (
                <View style={[styles.pill, { backgroundColor: growth >= 0 ? Colors.successBg : Colors.dangerBg }]}>
                  <Text style={[styles.pillText, { color: growth >= 0 ? Colors.success : Colors.danger }]}>
                    {growth >= 0 ? '↑' : '↓'} {Math.abs(growth)}%
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.statValue} adjustsFontSizeToFit numberOfLines={1}>
              {formatMoneyCompact(fin.todayIncome)}
            </Text>
          </Card>
          <Card style={styles.stat} onPress={() => router.push('/finance')} accessibilityLabel="Kutilayotgan to'lov">
            <View style={styles.statHead}>
              <Text style={styles.statLabel}>Kutilayotgan to&apos;lov</Text>
            </View>
            <Text style={styles.statValue} adjustsFontSizeToFit numberOfLines={1}>
              {formatMoneyCompact(fin.expected)}
            </Text>
            <Text style={styles.statSub}>{fin.expectedClients} ta mijoz</Text>
          </Card>
        </View>
      ) : null}

      {nextEvent ? (
        <Card
          style={styles.next}
          onPress={() => router.push({ pathname: '/booking/[id]', params: { id: nextEvent.id } })}
          accessibilityLabel="Keyingi tadbir"
        >
          <Text style={styles.nextLabel}>Keyingi tadbir</Text>
          <View style={styles.nextRow}>
            <IconCircle name="heart-outline" size={44} color={Colors.purple} bg={Colors.purpleBg} style={{ borderColor: '#DDD5F7' }} />
            <View style={styles.flex}>
              <Text style={styles.nextTitle}>{EVENT_LABEL[nextEvent.type]}</Text>
              <Text style={styles.nextMeta}>
                {formatDateLong(nextEvent.date)} · {pluralGuests(nextEvent.guestCount)}
              </Text>
            </View>
            <View style={styles.viewBtn}>
              <Text style={styles.viewBtnText}>Ko&apos;rish</Text>
            </View>
          </View>
        </Card>
      ) : null}

      <Button
        title="Yangi bron"
        icon="add"
        onPress={() => router.push('/booking/new')}
        style={{ marginTop: Spacing.md }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  user: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: 150 },
  userName: { fontSize: 13, fontWeight: '700', color: Colors.text },
  userRole: { fontSize: 11, color: Colors.textMuted },
  dot: {
    position: 'absolute',
    top: 1,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Colors.danger,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  banner: { minHeight: 178, marginBottom: Spacing.md },
  bannerBody: { flex: 1, padding: Spacing.md, justifyContent: 'flex-end' },
  bannerLabel: { color: '#F4E3BE', fontSize: 13, fontWeight: '600' },
  bannerTitle: { color: Colors.white, fontSize: 26, fontWeight: '700', marginVertical: 2 },
  bannerTitleSm: { color: Colors.white, fontSize: 18, fontWeight: '600', marginTop: 4 },
  bannerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  bannerMeta: { color: '#FBF2DE', fontSize: 13 },
  bannerFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  stats: { flexDirection: 'row', gap: Spacing.sm + 2 },
  stat: { flex: 1 },
  statHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4, minHeight: 22 },
  statLabel: { fontSize: 12, color: Colors.textSecondary, flexShrink: 1 },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.text, marginTop: 6 },
  statSub: { fontSize: 12, color: Colors.danger, marginTop: 2 },
  pill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full },
  pillText: { fontSize: 11, fontWeight: '700' },
  next: { marginTop: Spacing.sm + 2 },
  nextLabel: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nextTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  nextMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  viewBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.sm + 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  viewBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primaryDark },
});
