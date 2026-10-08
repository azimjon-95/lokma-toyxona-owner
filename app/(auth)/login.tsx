import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Screen } from '@/src/components/ui/Screen';
import { Input, PhoneInput } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Logo } from '@/src/components/ui/Logo';
import { ApplyCard } from '@/src/components/ApplyCard';
import { Colors, HIT_SLOP, Spacing } from '@/src/theme';
import { useAuth } from '@/src/context/AuthContext';
import { isValidLocalPhone, toE164 } from '@/src/utils/format';
import { ApiError, IS_DEMO } from '@/src/services/api';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ phone?: string; password?: string; form?: string }>({});
  const passwordRef = useRef<TextInput>(null);

  const submit = async () => {
    const e: typeof error = {};
    if (!isValidLocalPhone(phone)) e.phone = "Telefon raqamini to'liq kiriting";
    if (password.length < 4) e.password = "Parol kamida 4 ta belgidan iborat bo'lishi kerak";
    setError(e);
    if (e.phone || e.password) return;

    setLoading(true);
    try {
      await signIn(toE164(phone), password);
      // Navigatsiya Stack.Protected orqali avtomatik: rol tanlash yoki bosh sahifa
    } catch (err) {
      setError({ form: err instanceof ApiError ? err.message : "Kutilmagan xatolik. Qayta urinib ko'ring." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll keyboard edges={['top', 'bottom', 'left', 'right']} contentStyle={styles.content}>
      <LinearGradient
        colors={['#F3E3C3', Colors.background]}
        style={styles.heroBg}
        pointerEvents="none"
      />
      <View style={styles.hero}>
        <Logo />
        <Text style={styles.tagline}>To&apos;yxonangizni oson boshqaring</Text>
        <Text style={styles.subtitle}>
          Bronlar, mijozlar, moliya, xodimlar va boshqa barcha jarayonlar bir ilovada
        </Text>
      </View>

      <View style={styles.form}>
        <PhoneInput
          value={phone}
          onChangeText={setPhone}
          error={error.phone}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          submitBehavior="submit"
          accessibilityLabel="Telefon raqami"
        />
        <Input
          ref={passwordRef}
          icon="lock-closed-outline"
          placeholder="Parol"
          password
          value={password}
          onChangeText={setPassword}
          error={error.password}
          textContentType="password"
          autoComplete="password"
          autoCapitalize="none"
          returnKeyType="go"
          onSubmitEditing={submit}
          accessibilityLabel="Parol"
        />
        {error.form ? <Text style={styles.formError} accessibilityLiveRegion="polite">{error.form}</Text> : null}

        <Button title="Kirish" onPress={submit} loading={loading} testID="login-submit" />

        <Pressable
          style={styles.link}
          hitSlop={HIT_SLOP}
          onPress={() => router.push('/forgot-password')}
          accessibilityRole="link"
        >
          <Text style={styles.linkText}>Parolni unutdingizmi?</Text>
        </Pressable>
        {IS_DEMO ? (
          <Text style={styles.demo}>Demo rejim: istalgan raqam va kamida 4 belgili parol</Text>
        ) : null}
      </View>

      <View style={styles.bottom}>
        <ApplyCard />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: Spacing.xl },
  heroBg: { position: 'absolute', top: -60, left: -Spacing.md, right: -Spacing.md, height: 380 },
  hero: { alignItems: 'center', marginBottom: Spacing.lg },
  tagline: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: Spacing.lg, textAlign: 'center' },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 6,
    paddingHorizontal: Spacing.lg,
  },
  form: { marginTop: Spacing.sm },
  formError: { color: Colors.danger, fontSize: 13, marginBottom: Spacing.sm, textAlign: 'center' },
  link: { alignSelf: 'center', marginTop: Spacing.md, paddingVertical: 4 },
  linkText: { color: Colors.primaryDark, fontSize: 14, fontWeight: '600' },
  demo: { color: Colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: Spacing.sm },
  bottom: { marginTop: 'auto', paddingTop: Spacing.xl },
});
