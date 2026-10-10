import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Radius, Spacing } from '../theme';
import { useData } from '../context/DataContext';
import { useIsOwner } from '../context/AuthContext';
import { formatDateShort } from '../utils/format';

/** Ma'lumot yuklanmoqda / yuklanmadi (qayta urinish) holati — asosiy ekranlar tepasida */
export function DataBanner() {
  const { loading, error, refresh, bookings } = useData();
  if (error) {
    return (
      <View style={[styles.box, styles.err]} accessibilityRole="alert">
        <Ionicons name="cloud-offline-outline" size={18} color={Colors.danger} />
        <Text style={[styles.text, { color: Colors.danger }]} numberOfLines={2}>{error}</Text>
        <Pressable onPress={() => void refresh()} accessibilityRole="button" accessibilityLabel="Qayta urinish" hitSlop={8}>
          <Text style={styles.retry}>Qayta urinish</Text>
        </Pressable>
      </View>
    );
  }
  if (loading && bookings.length === 0) {
    return (
      <View style={styles.box} accessibilityLiveRegion="polite">
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.text}>Ma&apos;lumotlar yuklanmoqda…</Text>
      </View>
    );
  }
  return null;
}

/** Platformaga oylik to'lov muddati haqida ogohlantirish (faqat egasiga) */
export function SubscriptionBanner() {
  const { venue } = useData();
  const isOwner = useIsOwner();
  const s = venue?.subscription;
  if (!isOwner || !s || (s.state !== 'overdue' && s.state !== 'expiring')) return null;
  const overdue = s.state === 'overdue';
  return (
    <View style={[styles.box, overdue ? styles.err : styles.warn]} accessibilityRole="alert">
      <Ionicons name={overdue ? 'warning' : 'time-outline'} size={18} color={overdue ? Colors.danger : Colors.warning} />
      <Text style={[styles.text, { color: overdue ? Colors.danger : Colors.warning }]}>
        {overdue
          ? `Oylik to'lov muddati o'tgan${s.paidUntil ? ` (${formatDateShort(s.paidUntil)})` : ''}. To'yxona bloklanishi mumkin — administrator bilan bog'laning.`
          : `Oylik to'lov muddati ${formatDateShort(s.paidUntil)} da tugaydi.`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: Radius.md, backgroundColor: Colors.surfaceMuted, marginBottom: Spacing.sm },
  err: { backgroundColor: Colors.dangerBg },
  warn: { backgroundColor: Colors.warningBg },
  text: { flex: 1, fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  retry: { fontSize: 13, fontWeight: '800', color: Colors.primaryDark },
});
