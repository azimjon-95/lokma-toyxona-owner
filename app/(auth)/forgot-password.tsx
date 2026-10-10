import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/src/components/ui/Screen';
import { Input, PhoneInput } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { IconCircle, PageHeader } from '@/src/components/ui/Misc';
import { ApplyCard } from '@/src/components/ApplyCard';
import { Colors, HIT_SLOP, Spacing } from '@/src/theme';
import { digitsOnly, isValidLocalPhone, toE164 } from '@/src/utils/format';
import { ApiError, backend } from '@/src/services/api';

const RESEND_SECONDS = 60;

export default function ForgotPasswordScreen() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  /** Faqat server SMS provayderisiz (dev/test) ishlaganda keladi */
  const [devCode, setDevCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const send = async () => {
    if (!isValidLocalPhone(phone)) {
      setError("Telefon raqamini to'liq kiriting");
      return;
    }
    setError('');
    setLoading(true);
    try {
      const r = await backend.requestPasswordReset(toE164(phone));
      setDevCode(r.devCode ?? '');
      setStep('code');
      setTimer(RESEND_SECONDS);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'SMS yuborilmadi');
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    if (code.length < 4) return setError('SMS kodni kiriting');
    if (password.length < 6) return setError("Yangi parol kamida 6 ta belgidan iborat bo'lsin");
    setError('');
    setLoading(true);
    try {
      await backend.resetPassword(toE164(phone), code, password);
      Alert.alert('Tayyor', "Parol yangilandi. Endi yangi parol bilan kiring.", [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll keyboard edges={['top', 'bottom', 'left', 'right']}>
      <PageHeader title="" back />
      <View style={styles.hero}>
        <IconCircle name="lock-closed-outline" size={72} />
        <Text style={styles.title}>Parolni tiklash</Text>
        <Text style={styles.subtitle}>
          {step === 'phone'
            ? 'Telefon raqamingizni kiriting, unga SMS orqali kod yuboramiz.'
            : `+998 ${phone} raqamiga yuborilgan kodni va yangi parolni kiriting.`}
        </Text>
      </View>

      {step === 'phone' ? (
        <>
          <PhoneInput value={phone} onChangeText={setPhone} autoFocus returnKeyType="send" onSubmitEditing={send} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="SMS yuborish" onPress={send} loading={loading} />
        </>
      ) : (
        <>
          <Input
            label="SMS kod"
            icon="keypad-outline"
            placeholder="• • • • • •"
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            maxLength={6}
            value={code}
            onChangeText={(t) => setCode(digitsOnly(t))}
            autoFocus
          />
          {devCode ? <Text style={styles.devHint}>Sinov rejimi: SMS yuborilmadi, kod {devCode}</Text> : null}
          <Input
            label="Yangi parol"
            icon="lock-closed-outline"
            password
            textContentType="newPassword"
            autoComplete="new-password"
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Parolni yangilash" onPress={confirm} loading={loading} />
          <Pressable
            disabled={timer > 0 || loading}
            onPress={send}
            hitSlop={HIT_SLOP}
            style={styles.link}
            accessibilityRole="button"
          >
            <Text style={[styles.linkText, timer > 0 && { color: Colors.textMuted }]}>
              {timer > 0 ? `Qayta yuborish (${timer} s)` : 'Kodni qayta yuborish'}
            </Text>
          </Pressable>
        </>
      )}

      <Pressable onPress={() => router.back()} hitSlop={HIT_SLOP} style={styles.link} accessibilityRole="button">
        <Text style={styles.backText}>Orqaga qaytish</Text>
      </Pressable>

      <View style={styles.bottom}>
        <ApplyCard title="Hisobingiz yo'qmi?" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  devHint: { fontSize: 12, color: Colors.warning, marginTop: -6, marginBottom: Spacing.sm },
  hero: { alignItems: 'center', marginBottom: Spacing.lg },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text, marginTop: Spacing.md },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  error: { color: Colors.danger, fontSize: 13, textAlign: 'center', marginBottom: Spacing.sm },
  link: { alignSelf: 'center', marginTop: Spacing.md, paddingVertical: 4 },
  linkText: { color: Colors.primaryDark, fontSize: 14, fontWeight: '600' },
  backText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500' },
  bottom: { marginTop: 'auto', paddingTop: Spacing.xl },
});
