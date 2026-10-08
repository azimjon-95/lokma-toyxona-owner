import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Radius, Spacing } from '../../theme';
import { formatDateLong, parseISODate, toISODate } from '../../utils/format';
import { Input } from './Input';

interface Props {
  label: string;
  mode: 'date' | 'time';
  /** date: YYYY-MM-DD, time: HH:mm */
  value: string;
  onChange: (v: string) => void;
  minimumDate?: Date;
  required?: boolean;
  error?: string;
}

const toDate = (mode: Props['mode'], v: string) => {
  if (mode === 'date') return v ? parseISODate(v) : new Date();
  const d = new Date();
  const [h, m] = (v || '18:00').split(':').map(Number);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
};

const fromDate = (mode: Props['mode'], d: Date) =>
  mode === 'date'
    ? toISODate(d)
    : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** Native sana/vaqt tanlagich: Android — dialog, iOS — compact picker, web — matn maydoni. */
export function DateTimeField({ label, mode, value, onChange, minimumDate, required, error }: Props) {
  if (Platform.OS === 'web') {
    return (
      <Input
        label={label}
        required={required}
        error={error}
        icon={mode === 'date' ? 'calendar-outline' : 'time-outline'}
        placeholder={mode === 'date' ? 'YYYY-MM-DD' : 'HH:mm'}
        value={value}
        onChangeText={onChange}
        containerStyle={styles.flex}
      />
    );
  }

  const display = value ? (mode === 'date' ? formatDateLong(value) : value) : 'Tanlang';

  return (
    <View style={[styles.wrap, styles.flex]}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={{ color: Colors.danger }}> *</Text> : null}
      </Text>
      {Platform.OS === 'ios' ? (
        <View style={[styles.field, !!error && styles.err]}>
          <Ionicons name={mode === 'date' ? 'calendar-outline' : 'time-outline'} size={18} color={Colors.textMuted} />
          <DateTimePicker
            value={toDate(mode, value)}
            mode={mode}
            display="compact"
            locale="uz-UZ"
            minimumDate={minimumDate}
            minuteInterval={mode === 'time' ? 15 : undefined}
            accentColor={Colors.primary}
            onChange={(_, d) => d && onChange(fromDate(mode, d))}
            style={styles.iosPicker}
          />
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${display}`}
          style={[styles.field, !!error && styles.err]}
          onPress={() =>
            DateTimePickerAndroid.open({
              value: toDate(mode, value),
              mode,
              is24Hour: true,
              minimumDate,
              onChange: (e, d) => {
                if (e.type === 'set' && d) onChange(fromDate(mode, d));
              },
            })
          }
        >
          <Ionicons name={mode === 'date' ? 'calendar-outline' : 'time-outline'} size={18} color={Colors.textMuted} />
          <Text style={[styles.value, !value && { color: Colors.textMuted }]}>{display}</Text>
        </Pressable>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { marginBottom: Spacing.md },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBg,
  },
  err: { borderColor: Colors.danger },
  value: { fontSize: 15, color: Colors.text },
  iosPicker: { marginLeft: -6 },
  error: { fontSize: 12, color: Colors.danger, marginTop: 4 },
});
