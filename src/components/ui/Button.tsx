import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Spacing } from '../../theme';

type Variant = 'primary' | 'success' | 'info' | 'outline' | 'soft' | 'ghost' | 'danger';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  size?: 'md' | 'sm';
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  testID?: string;
}

const SOLID: Partial<Record<Variant, [string, string]>> = {
  primary: [Colors.gradientStart, Colors.gradientEnd],
  success: ['#1A9A66', Colors.successDark],
  info: ['#2F7FF0', '#1A5FD0'],
  danger: ['#E04C4C', '#C42F2F'],
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  size = 'md',
  style,
  accessibilityHint,
  testID,
}: Props) {
  const isDisabled = !!(disabled || loading);
  const gradient = SOLID[variant];
  const fg = gradient
    ? Colors.white
    : variant === 'danger'
      ? Colors.danger
      : Colors.primaryDark;

  const content = loading ? (
    <ActivityIndicator color={fg} />
  ) : (
    <View style={styles.row}>
      {icon ? <Ionicons name={icon} size={size === 'sm' ? 16 : 18} color={fg} /> : null}
      <Text style={[styles.text, size === 'sm' && styles.textSm, { color: fg }]} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );

  return (
    <Pressable
      testID={testID}
      onPress={() => {
        if (isDisabled) return;
        Haptics.selectionAsync().catch(() => {});
        onPress?.();
      }}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' && styles.sm,
        !gradient && styles[variant as 'outline' | 'soft' | 'ghost'],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {gradient ? (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, styles.gradient]}
        />
      ) : null}
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    overflow: 'hidden',
  },
  sm: { height: 40, paddingHorizontal: Spacing.md, borderRadius: Radius.sm + 2 },
  gradient: { borderRadius: Radius.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  outline: { borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: Colors.surface },
  soft: { backgroundColor: Colors.goldSoft },
  ghost: { backgroundColor: 'transparent' },
  danger: {},
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  text: { fontSize: 16, fontWeight: '600', letterSpacing: 0.2 },
  textSm: { fontSize: 14 },
});
