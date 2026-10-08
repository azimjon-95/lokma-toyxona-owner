import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { Screen } from '@/src/components/ui/Screen';
import { Card } from '@/src/components/ui/Card';
import { IconCircle, PageHeader } from '@/src/components/ui/Misc';
import { Colors, Radius, Spacing } from '@/src/theme';
import { useAuth } from '@/src/context/AuthContext';
import { APP_CONFIG } from '@/src/config';
import { formatPhone } from '@/src/utils/format';
import { callPhone, openTelegramUser, openUrl } from '@/src/utils/linking';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface Item {
  icon: IconName;
  title: string;
  onPress: () => void;
  ownerOnly?: boolean;
  danger?: boolean;
}

export default function MoreScreen() {
  const { user, signOut, deleteAccount } = useAuth();
  const isOwner = user?.role === 'owner';

  const go = (href: Href) => () => router.push(href);

  const support = () =>
    Alert.alert("Yordam va qo'llab-quvvatlash", 'Biz bilan qanday bog\'lanasiz?', [
      { text: "Qo'ng'iroq", onPress: () => callPhone(APP_CONFIG.supportPhone) },
      { text: 'Telegram', onPress: () => openTelegramUser(APP_CONFIG.supportTelegram) },
      { text: 'Bekor qilish', style: 'cancel' },
    ]);

  const logout = () =>
    Alert.alert('Chiqish', 'Hisobdan chiqmoqchimisiz?', [
      { text: 'Bekor qilish', style: 'cancel' },
      { text: 'Chiqish', style: 'destructive', onPress: () => signOut() },
    ]);

  // App Store 5.1.1(v): hisobni ilova ichidan o'chirish imkoniyati majburiy
  const removeAccount = () =>
    Alert.alert(
      "Hisobni o'chirish",
      "Hisobingiz va unga bog'liq shaxsiy ma'lumotlar butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi.",
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: "O'chirish",
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
            } catch {
              Alert.alert('Xatolik', "Hisobni o'chirib bo'lmadi. Keyinroq qayta urinib ko'ring.");
            }
          },
        },
      ]
    );

  const items: Item[] = [
    { icon: 'wallet-outline', title: 'Moliya', onPress: go('/finance'), ownerOnly: true },
    { icon: 'people-circle-outline', title: 'Xodimlar', onPress: go('/staff') },
    { icon: 'business-outline', title: "Yangi to'yxona arizasi", onPress: go('/venue-apply'), ownerOnly: true },
    { icon: 'help-buoy-outline', title: "Yordam va qo'llab-quvvatlash", onPress: support },
    { icon: 'shield-checkmark-outline', title: 'Maxfiylik siyosati', onPress: () => openUrl(APP_CONFIG.privacyPolicyUrl) },
    { icon: 'document-outline', title: 'Foydalanish shartlari', onPress: () => openUrl(APP_CONFIG.termsUrl) },
  ];

  return (
    <Screen scroll>
      <PageHeader title="Boshqa" />
      <Card style={styles.profile}>
        <IconCircle name="person" size={56} />
        <View style={styles.flex}>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.phone}>{user ? formatPhone(user.phone) : ''}</Text>
          <Text style={styles.role}>
            {isOwner ? "To'yxona egasi" : 'Xodim'} · {user?.venueName}
          </Text>
        </View>
      </Card>

      <Card padded={false} style={styles.group}>
        {items
          .filter((i) => !i.ownerOnly || isOwner)
          .map((item, idx, arr) => (
            <Pressable
              key={item.title}
              onPress={item.onPress}
              accessibilityRole="button"
              style={({ pressed }) => [styles.item, idx < arr.length - 1 && styles.divider, pressed && styles.pressed]}
            >
              <Ionicons name={item.icon} size={22} color={Colors.primary} />
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </Pressable>
          ))}
      </Card>

      <Card padded={false} style={styles.group}>
        <Pressable onPress={logout} accessibilityRole="button" style={[styles.item, styles.divider]}>
          <Ionicons name="log-out-outline" size={22} color={Colors.danger} />
          <Text style={[styles.itemTitle, { color: Colors.danger }]}>Chiqish</Text>
        </Pressable>
        <Pressable onPress={removeAccount} accessibilityRole="button" style={styles.item}>
          <Ionicons name="trash-outline" size={22} color={Colors.textMuted} />
          <Text style={[styles.itemTitle, { color: Colors.textSecondary }]}>Hisobni o&apos;chirish</Text>
        </Pressable>
      </Card>

      <Text style={styles.version}>Lokma To&apos;yxonalar · v{APP_CONFIG.version}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: Spacing.md },
  name: { fontSize: 18, fontWeight: '700', color: Colors.text },
  phone: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  role: { fontSize: 12, color: Colors.primaryDark, marginTop: 2, fontWeight: '600' },
  group: { marginBottom: Spacing.md, overflow: 'hidden', borderRadius: Radius.lg },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 54 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.borderStrong },
  pressed: { backgroundColor: Colors.surfaceMuted },
  itemTitle: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.text },
  version: { textAlign: 'center', color: Colors.textMuted, fontSize: 12, marginTop: Spacing.sm },
});
