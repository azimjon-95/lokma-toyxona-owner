import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, HIT_SLOP, Radius, Spacing } from '../theme';
import type { Photo, UploadPurpose } from '../types';
import { pickImages, uploadImage } from '../services/upload';
import { errorMessage } from '../context/DataContext';
import { notify } from '../utils/dialog';

interface Props {
  label: string;
  purpose: UploadPurpose;
  /** Serverdagi joriy rasm */
  photo?: Photo | null;
  /** Yangi yuklangan Cloudinary public_id (null — olib tashlash). Saqlash — chaqiruvchi zimmasida. */
  onChange: (publicId: string | null) => void;
  disabled?: boolean;
}

/** Bitta rasm maydoni: tanlash → qurilmada siqish → Cloudinary'ga yuklash (progress bilan) */
export function PhotoField({ label, purpose, photo, onChange, disabled }: Props) {
  const [preview, setPreview] = useState<string | null | undefined>(undefined); // undefined — o'zgarmagan
  const [progress, setProgress] = useState<number | null>(null);
  const shown = preview === undefined ? photo?.cardUrl ?? null : preview;

  const pick = async () => {
    if (progress !== null || disabled) return;
    try {
      const [img] = await pickImages(1);
      if (!img) return;
      setPreview(img.uri);
      setProgress(0);
      const publicId = await uploadImage(purpose, img, setProgress);
      onChange(publicId);
    } catch (e) {
      setPreview(undefined);
      notify('Rasm yuklanmadi', errorMessage(e));
    } finally {
      setProgress(null);
    }
  };

  const clear = () => { setPreview(null); onChange(null); };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={pick}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={shown ? `${label}ni almashtirish` : `${label} qo'shish`}
        style={({ pressed }) => [styles.box, pressed && { opacity: 0.85 }]}
      >
        {shown ? (
          <Image source={shown} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <View style={styles.empty}>
            <Ionicons name="image-outline" size={26} color={Colors.primary} />
            <Text style={styles.emptyText}>Rasm qo&apos;shish</Text>
          </View>
        )}
        {progress !== null ? (
          <View style={styles.progress}>
            <ActivityIndicator color={Colors.white} />
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        ) : null}
      </Pressable>
      {shown && progress === null ? (
        <Pressable onPress={clear} hitSlop={HIT_SLOP} style={styles.remove} accessibilityRole="button" accessibilityLabel="Rasmni olib tashlash">
          <Ionicons name="close-circle" size={24} color={Colors.danger} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.md },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  box: { height: 150, borderRadius: Radius.md, overflow: 'hidden', borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.borderStrong, backgroundColor: Colors.goldTint },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  emptyText: { fontSize: 13, color: Colors.primaryDark, fontWeight: '600' },
  progress: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,14,6,0.55)', alignItems: 'center', justifyContent: 'center', gap: 6 },
  progressText: { color: Colors.white, fontWeight: '700' },
  remove: { position: 'absolute', top: 28, right: 8, backgroundColor: Colors.white, borderRadius: 12 },
});
