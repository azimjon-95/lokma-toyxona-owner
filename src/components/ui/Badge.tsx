import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { BookingStatus } from '../../types';
import { Colors, Radius } from '../../theme';
import { STATUS_LABEL } from '../../utils/format';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export const STATUS_STYLE: Record<BookingStatus, { bg: string; fg: string; icon: IconName }> = {
  pending: { bg: Colors.purpleBg, fg: Colors.purple, icon: 'sparkles' },
  deposit: { bg: Colors.warningBg, fg: Colors.warning, icon: 'time' },
  confirmed: { bg: Colors.successBg, fg: Colors.success, icon: 'checkmark-circle' },
  completed: { bg: Colors.infoBg, fg: Colors.info, icon: 'star' },
  cancelled: { bg: Colors.dangerBg, fg: Colors.danger, icon: 'close-circle' },
};

export function StatusBadge({ status, compact }: { status: BookingStatus; compact?: boolean }) {
  const s = STATUS_STYLE[status];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]} accessibilityLabel={STATUS_LABEL[status]}>
      <Ionicons name={s.icon} size={12} color={s.fg} />
      {!compact && <Text style={[styles.text, { color: s.fg }]}>{STATUS_LABEL[status]}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 11, fontWeight: '700' },
});
