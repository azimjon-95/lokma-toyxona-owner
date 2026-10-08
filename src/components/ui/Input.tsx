import React, { forwardRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, HIT_SLOP, Radius, Spacing } from '../../theme';
import { formatLocalPhone } from '../../utils/format';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export interface InputProps extends TextInputProps {
  label?: string;
  required?: boolean;
  error?: string;
  icon?: IconName;
  prefix?: string;
  containerStyle?: StyleProp<ViewStyle>;
  /** Parol maydoni uchun ko'rsatish/yashirish tugmasi */
  password?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, required, error, icon, prefix, containerStyle, password, style, multiline, onFocus, onBlur, ...rest },
  ref
) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}
      <View
        style={[
          styles.row,
          multiline && styles.rowMultiline,
          focused && styles.rowFocused,
          !!error && styles.rowError,
        ]}
      >
        {icon ? <Ionicons name={icon} size={18} color={Colors.textMuted} style={styles.icon} /> : null}
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={Colors.textMuted}
          selectionColor={Colors.primary}
          cursorColor={Colors.primary}
          secureTextEntry={password ? hidden : rest.secureTextEntry}
          multiline={multiline}
          accessibilityLabel={label}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, multiline && styles.inputMultiline, style]}
          {...rest}
        />
        {password ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Parolni ko'rsatish" : 'Parolni yashirish'}
          >
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={Colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

/** +998 prefiksli telefon maydoni, "90 123 45 67" formatida. */
export const PhoneInput = forwardRef<TextInput, Omit<InputProps, 'prefix' | 'keyboardType'>>(
  function PhoneInput({ value, onChangeText, ...rest }, ref) {
    return (
      <Input
        ref={ref}
        icon="call-outline"
        prefix="+998"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        placeholder="90 123 45 67"
        maxLength={12}
        value={value}
        onChangeText={(t) => onChangeText?.(formatLocalPhone(t))}
        {...rest}
      />
    );
  }
);

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.md },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  required: { color: Colors.danger },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  rowMultiline: { alignItems: 'flex-start', paddingVertical: 10 },
  rowFocused: { borderColor: Colors.primary },
  rowError: { borderColor: Colors.danger },
  icon: { marginRight: 10 },
  prefix: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
    marginRight: 8,
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 12,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  inputMultiline: { minHeight: 84, textAlignVertical: 'top', paddingTop: 2 },
  error: { fontSize: 12, color: Colors.danger, marginTop: 4 },
});
