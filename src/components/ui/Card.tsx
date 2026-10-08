import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Colors, Radius, Shadow, Spacing } from '../../theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  onPress?: () => void;
  highlighted?: boolean;
  accessibilityLabel?: string;
}

export function Card({ children, style, padded = true, onPress, highlighted, accessibilityLabel }: Props) {
  const s = [styles.card, padded && styles.padded, highlighted && styles.highlighted, style];
  if (!onPress) return <View style={s}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [s, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow,
  },
  padded: { padding: 14 },
  highlighted: { borderColor: Colors.primary, borderWidth: 1.5, backgroundColor: Colors.goldTint },
  pressed: { opacity: 0.9 },
});

export const cardGap = Spacing.sm + 2;
