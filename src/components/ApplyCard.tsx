import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Colors, Radius } from '../theme';
import { IconCircle } from './ui/Misc';

/** "Yangi to'yxona uchun ariza qoldiring" kartasi (Login va Parolni tiklash ekranlarida). */
export function ApplyCard({ title }: { title?: string }) {
  return (
    <Pressable
      onPress={() => router.push('/venue-apply')}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
    >
      <IconCircle name="business-outline" size={42} />
      <View style={styles.flex}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        <Text style={styles.text}>Yangi to&apos;yxona ochish uchun ariza qoldiring</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: '#EEDDBB',
  },
  flex: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  text: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
});
