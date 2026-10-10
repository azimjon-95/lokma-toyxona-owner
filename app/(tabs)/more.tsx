import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { Screen } from '@/src/components/ui/Screen';
import { Card } from '@/src/components/ui/Card';
import { IconCircle, PageHeader } from '@/src/components/ui/Misc';
import { Sheet, SheetOption } from '@/src/components/ui/Sheet';
import { SubscriptionBanner } from '@/src/components/DataBanner';
import { Colors, Radius, Spacing } from '@/src/theme';
import { useAuth } from '@/src/context/AuthContext';
import { errorMessage } from '@/src/context/DataContext';
import { APP_CONFIG } from '@/src/config';
import { formatPhone } from '@/src/utils/format';
import { callPhone, openTelegramUser, openUrl } from '@/src/utils/linking';
import { confirm, notify } from '@/src/utils/dialog';

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

  const [supportSheet, setSupportSheet] = useState(false);
  const support = () => setSupportSheet(true);

  const logout = async () => {
    if (await confirm('Chiqish', 'Hisobdan chiqmoqchimisiz?', { ok: 'Chiqish', destructive: true })) await signOut();
  };

  // App Store 5.1.1(v): hisobni ilova ichidan o'chirish imkoniyati majburiy
  const removeAccount = async () => {
    const ok = await confirm(
      "Hisobni o'chirish",
      "Ilovaga kirish hisobingiz o'chiriladi va u orqali kira olmaysiz. To'yxona ma'lumotlari (bronlar, moliya) saqlanib qoladi; qayta yoqish uchun administrator bilan bog'laning. Bu amalni qaytarib bo'lmaydi.",
      { ok: "O'chirish", destructive: true }
    );
    if (!ok) return;
    try {
      await deleteAccount();
    } catch (e) {
      notify('Xatolik', errorMessage(e, "Hisobni o'chirib bo'lmadi. Keyinroq qayta urinib ko'ring."));
    }
  };

  const items: Item[] = [
    { icon: 'wallet-outline', title: 'Moliya', onPress: go('/finance'), ownerOnly: true },
    { icon: 'people-circle-outline', title: 'Xodimlar', onPress: go('/staff') },
    { icon: 'images-outline', title: "To'yxona rasmlari", onPress: go('/venue-photos'), ownerOnly: true },
    { icon: 'storefront-outline', title: "To'yxona ma'lumotlari", onPress: go('/venue-info'), ownerOnly: true },
    { icon: 'business-outline', title: "Yangi to'yxona arizasi", onPress: go('/venue-apply'), ownerOnly: true },
    { icon: 'help-buoy-outline', title: "Yordam va qo'llab-quvvatlash", onPress: support },
    { icon: 'shield-checkmark-outline', title: 'Maxfiylik siyosati', onPress: () => openUrl(APP_CONFIG.privacyPolicyUrl) },
    { icon: 'document-outline', title: 'Foydalanish shartlari', onPress: () => openUrl(APP_CONFIG.termsUrl) },
  ];

  return (
    <Screen scroll>
      <PageHeader title="Boshqa" />
      <SubscriptionBanner />
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

      <Sheet visible={supportSheet} title="Yordam va qo'llab-quvvatlash" subtitle="Biz bilan qanday bog'lanasiz?" onClose={() => setSupportSheet(false)}>
        <SheetOption label="Qo'ng'iroq" onPress={() => { setSupportSheet(false); callPhone(APP_CONFIG.supportPhone); }} />
        <SheetOption label="Telegram" onPress={() => { setSupportSheet(false); openTelegramUser(APP_CONFIG.supportTelegram); }} />
      </Sheet>
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
