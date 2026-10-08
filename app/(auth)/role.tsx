import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '@/src/components/ui/Screen';
import { Button } from '@/src/components/ui/Button';
import { IconCircle } from '@/src/components/ui/Misc';
import { Colors, HIT_SLOP, Radius, Spacing } from '@/src/theme';
import { useAuth } from '@/src/context/AuthContext';
import type { UserRole } from '@/src/types';

const ROLES: { key: UserRole; title: string; desc: string; icon: 'business-outline' | 'person-outline' }[] = [
  {
    key: 'owner',
    title: "To'yxona egasi",
    desc: "To'yxonani boshqarish, bronlar, moliya, xodimlar va boshqalar.",
    icon: 'business-outline',
  },
  {
    key: 'staff',
    title: 'Xodim',
    desc: "Faqat o'z vazifalaringiz uchun kirish imkoniyati.",
    icon: 'person-outline',
  },
];

export default function RoleScreen() {
  const { chooseRole, cancelRoleSelection, pending } = useAuth();
  const [selected, setSelected] = useState<UserRole>('owner');
  const [loading, setLoading] = useState(false);
  const roles = ROLES.filter((r) => pending?.roles.includes(r.key) ?? true);

  const next = async () => {
    setLoading(true);
    try {
      await chooseRole(selected);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      edges={['top', 'bottom', 'left', 'right']}
      contentStyle={styles.content}
      footer={<Button title="Davom etish" onPress={next} loading={loading} />}
    >
      <Pressable onPress={cancelRoleSelection} hitSlop={HIT_SLOP} accessibilityRole="button" accessibilityLabel="Orqaga">
        <Ionicons name="arrow-back" size={22} color={Colors.text} />
      </Pressable>
      <Text style={styles.title}>Sizning hisobingiz</Text>
      <Text style={styles.subtitle}>Qaysi sifatda davom etasiz?</Text>

      <View accessibilityRole="radiogroup">
        {roles.map((r) => {
          const active = selected === r.key;
          return (
            <Pressable
              key={r.key}
              onPress={() => setSelected(r.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={[styles.card, active && styles.cardActive]}
            >
              <IconCircle name={r.icon} size={48} />
              <View style={styles.body}>
                <Text style={styles.cardTitle}>{r.title}</Text>
                <Text style={styles.cardDesc}>{r.desc}</Text>
              </View>
              <View style={[styles.radio, active && styles.radioOn]}>
                {active ? <Ionicons name="checkmark" size={14} color={Colors.white} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: Spacing.md },
  title: { fontSize: 26, fontWeight: '700', color: Colors.text, textAlign: 'center', marginTop: Spacing.xl },
  subtitle: {
    fontSize: 15,
    color: Colors.primaryDark,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cardActive: { borderColor: Colors.primary, backgroundColor: Colors.goldTint },
  body: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  cardDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, lineHeight: 18 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: Colors.primary, backgroundColor: Colors.primary },
});
