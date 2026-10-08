import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { Booking } from '../types';
import { Card } from './ui/Card';
import { StatusBadge } from './ui/Badge';
import { IconCircle } from './ui/Misc';
import { Colors, Spacing } from '../theme';
import { EVENT_LABEL, formatDateShort, formatMoney, formatPhone, pluralGuests } from '../utils/format';

export function BookingCard({ booking, showAmount = true }: { booking: Booking; showAmount?: boolean }) {
  const b = booking;
  return (
    <Card
      style={styles.card}
      onPress={() => router.push({ pathname: '/booking/[id]', params: { id: b.id } })}
      accessibilityLabel={`${formatDateShort(b.date)} ${b.time}, ${b.clientName}`}
    >
      <View style={styles.top}>
        <View style={styles.flex}>
          <Text style={styles.date}>
            {formatDateShort(b.date)}, {b.time}
          </Text>
          <Text style={styles.type}>
            {EVENT_LABEL[b.type]} · {pluralGuests(b.guestCount)}
          </Text>
        </View>
        <StatusBadge status={b.status} />
      </View>
      <View style={styles.bottom}>
        <IconCircle name="person-outline" size={36} />
        <View style={styles.flex}>
          <Text style={styles.client} numberOfLines={1}>
            {b.clientName}
          </Text>
          <Text style={styles.phone}>{formatPhone(b.clientPhone)}</Text>
        </View>
        {showAmount ? <Text style={styles.amount}>{formatMoney(b.totalAmount)}</Text> : null}
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.sm + 2 },
  flex: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  date: { fontSize: 15, fontWeight: '700', color: Colors.text },
  type: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  client: { fontSize: 14, fontWeight: '600', color: Colors.text },
  phone: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  amount: { fontSize: 13, fontWeight: '700', color: Colors.text },
});
