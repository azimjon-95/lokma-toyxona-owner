import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Colors, HIT_SLOP, Radius, Spacing } from '../../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Oltin ramkali yumaloq ikonka (dizayndagi ro'yxat avatarlari). */
export function IconCircle({
  name,
  size = 40,
  color = Colors.primary,
  bg = Colors.goldTint,
  style,
}: {
  name: IconName;
  size?: number;
  color?: string;
  bg?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        styles.iconCircle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
        style,
      ]}
    >
      <Ionicons name={name} size={Math.round(size * 0.5)} color={color} />
    </View>
  );
}

/** Ekran sarlavhasi; `back` — orqaga tugmasi, `right` — o'ng tomondagi amal. */
export function PageHeader({
  title,
  subtitle,
  back,
  right,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      {back ? (
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          hitSlop={HIT_SLOP}
          accessibilityRole="button"
          accessibilityLabel="Orqaga"
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
      ) : null}
      <View style={styles.flex}>
        <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function SectionTitle({ children, action }: { children: string; action?: React.ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.section}>{children}</Text>
      {action}
    </View>
  );
}

export function EmptyState({ icon, title, hint }: { icon: IconName; title: string; hint?: string }) {
  return (
    <View style={styles.empty}>
      <IconCircle name={icon} size={64} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {hint ? <Text style={styles.emptyHint}>{hint}</Text> : null}
    </View>
  );
}

/** Ariza qadamlari: 1 — 2 — 3 — 4 */
export function StepIndicator({ step, total = 4 }: { step: number; total?: number }) {
  return (
    <View style={styles.steps} accessibilityLabel={`${step}-qadam, jami ${total}`}>
      {Array.from({ length: total }, (_, i) => i + 1).map((n, i) => (
        <React.Fragment key={n}>
          {i > 0 ? <View style={[styles.stepLine, n <= step && styles.stepLineOn]} /> : null}
          <View style={[styles.stepDot, n <= step && styles.stepDotOn]}>
            {n < step ? (
              <Ionicons name="checkmark" size={14} color={Colors.white} />
            ) : (
              <Text style={[styles.stepNum, n <= step && styles.stepNumOn]}>{n}</Text>
            )}
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

export function Checkbox({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <Pressable
      onPress={onToggle}
      style={styles.check}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
    >
      <View style={[styles.checkBox, checked && styles.checkBoxOn]}>
        {checked ? <Ionicons name="checkmark" size={14} color={Colors.white} /> : null}
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.chipOn]}
    >
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEDDBB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    minHeight: 52,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: -6 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  section: { fontSize: 17, fontWeight: '700', color: Colors.text },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 8 },
  emptyHint: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 24 },
  steps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: Spacing.md },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepNum: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  stepNumOn: { color: Colors.white },
  stepLine: { width: 36, height: 2, backgroundColor: Colors.border },
  stepLineOn: { backgroundColor: Colors.primary },
  check: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40 },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  checkBoxOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkLabel: { fontSize: 15, color: Colors.text },
  chip: {
    minWidth: 52,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: Radius.sm + 2,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: Colors.goldSoft, borderColor: Colors.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  chipTextOn: { color: Colors.primaryDark },
});
