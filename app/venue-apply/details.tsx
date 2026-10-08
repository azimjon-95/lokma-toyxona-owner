import { useState } from 'react';
import { router } from 'expo-router';
import { Screen } from '@/src/components/ui/Screen';
import { Card } from '@/src/components/ui/Card';
import { Input, PhoneInput } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { PageHeader, StepIndicator } from '@/src/components/ui/Misc';
import { useVenueApply } from '@/src/context/VenueApplyContext';
import { isValidLocalPhone } from '@/src/utils/format';

export default function VenueApplyDetails() {
  const { draft, update } = useVenueApply();
  const [errors, setErrors] = useState<{ name?: string; address?: string; phone?: string }>({});

  const next = () => {
    const e: typeof errors = {};
    if (draft.name.trim().length < 2) e.name = "To'yxona nomini kiriting";
    if (draft.address.trim().length < 3) e.address = 'Manzilni kiriting';
    if (!isValidLocalPhone(draft.phone)) e.phone = "Telefon raqamini to'liq kiriting";
    setErrors(e);
    if (!Object.keys(e).length) router.push('/venue-apply/halls');
  };

  return (
    <Screen
      scroll
      keyboard
      edges={['top', 'left', 'right', 'bottom']}
      footer={<Button title="Keyingi" onPress={next} />}
    >
      <PageHeader title="Ariza qoldirish" subtitle="1. Asosiy ma'lumotlar" back />
      <StepIndicator step={1} />
      <Card>
        <Input
          label="To'yxona nomi"
          required
          placeholder="Masalan: Oltin Saroy"
          value={draft.name}
          onChangeText={(name) => update({ name })}
          error={errors.name}
          autoCapitalize="words"
        />
        <Input
          label="Manzil"
          required
          icon="location-outline"
          placeholder="Toshkent, Chilonzor tumani"
          value={draft.address}
          onChangeText={(address) => update({ address })}
          error={errors.address}
          textContentType="fullStreetAddress"
        />
        <PhoneInput
          label="Telefon raqami"
          required
          value={draft.phone}
          onChangeText={(phone) => update({ phone })}
          error={errors.phone}
          containerStyle={{ marginBottom: 0 }}
        />
      </Card>
    </Screen>
  );
}
