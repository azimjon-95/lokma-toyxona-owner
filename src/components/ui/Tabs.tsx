import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing } from '../../theme';

export interface TabItem<K extends string> {
  key: K;
  label: string;
  count?: number;
}

interface Props<K extends string> {
  items: TabItem<K>[];
  value: K;
  onChange: (k: K) => void;
  /** pill: Bronlar/Moliya filtrlari; underline: Bron tafsiloti */
  variant?: 'pill' | 'underline';
  /** true — bir qatorga sig'maydigan filtrlar uchun gorizontal scroll */
  scrollable?: boolean;
}

export function Tabs<K extends string>({ items, value, onChange, variant = 'pill', scrollable }: Props<K>) {
  const content = items.map((it) => {
    const active = it.key === value;
    return (
      <Pressable
        key={it.key}
        onPress={() => onChange(it.key)}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        style={[
          variant === 'pill' ? styles.pill : styles.under,
          !scrollable && styles.flex,
          scrollable && variant === 'pill' && styles.pillLoose,
          active && (variant === 'pill' ? styles.pillActive : styles.underActive),
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.text,
            active && (variant === 'pill' ? styles.textPillActive : styles.textUnderActive),
          ]}
        >
          {it.label}
          {it.count !== undefined ? ` (${it.count})` : ''}
        </Text>
      </Pressable>
    );
  });

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={[styles.row, styles.scrollContent]}
      >
        {content}
      </ScrollView>
    );
  }
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.row, variant === 'pill' ? styles.pillTrack : styles.underTrack]}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flexGrow: 1, flexBasis: 'auto' },
  row: { flexDirection: 'row', gap: 6 },
  scroll: { flexGrow: 0, marginHorizontal: -Spacing.md, marginBottom: Spacing.md },
  scrollContent: { paddingHorizontal: Spacing.md },
  pillTrack: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  pill: {
    paddingHorizontal: 14,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.sm + 2,
    backgroundColor: Colors.surface,
  },
  pillLoose: { borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  underTrack: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.md,
    gap: 0,
  },
  under: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  underActive: { borderBottomColor: Colors.primary },
  text: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  textPillActive: { color: Colors.white },
  textUnderActive: { color: Colors.primaryDark },
});
