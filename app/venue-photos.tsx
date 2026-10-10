import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '@/src/components/ui/Screen';
import { Button } from '@/src/components/ui/Button';
import { Sheet, SheetOption } from '@/src/components/ui/Sheet';
import { EmptyState, PageHeader } from '@/src/components/ui/Misc';
import { Colors, Radius, Spacing } from '@/src/theme';
import { errorMessage, usePhotos } from '@/src/context/DataContext';
import type { Photo } from '@/src/types';
import { pickImages, uploadImage } from '@/src/services/upload';
import { confirm, notify } from '@/src/utils/dialog';

const MAX = 40;
const COLS = 3;
const GAP = 8;

/** To'yxona galereyasi: rasm qo'shish (Cloudinary), muqova tanlash, o'chirish. Birinchi rasm mijozlarga muqova bo'lib ko'rinadi. */
export default function VenuePhotosScreen() {
  const { photos, loading, error, add, remove, reorder } = usePhotos();
  const { width } = useWindowDimensions();
  const size = Math.floor((Math.min(width, 720) - Spacing.md * 2 - GAP * (COLS - 1)) / COLS);
  const [progress, setProgress] = useState<{ i: number; n: number; pct: number } | null>(null);
  const [selected, setSelected] = useState<Photo | null>(null);

  const addPhotos = async () => {
    if (progress) return;
    try {
      const picked = await pickImages(MAX - photos.length);
      if (!picked.length) return;
      const failed: string[] = [];
      for (let i = 0; i < picked.length; i++) {
        setProgress({ i: i + 1, n: picked.length, pct: 0 });
        try {
          const publicId = await uploadImage('venue_photo', picked[i], (pct) => setProgress({ i: i + 1, n: picked.length, pct }));
          await add(publicId);
        } catch (e) {
          failed.push(errorMessage(e));
        }
      }
      if (failed.length) notify(`${failed.length} ta rasm yuklanmadi`, failed[0]);
    } catch (e) {
      notify('Rasm tanlanmadi', errorMessage(e));
    } finally {
      setProgress(null);
    }
  };

  const makeCover = async (p: Photo) => {
    setSelected(null);
    try {
      await reorder([p.id!, ...photos.filter((x) => x.id !== p.id).map((x) => x.id!)]);
    } catch (e) {
      notify("Muqova o'zgarmadi", errorMessage(e));
    }
  };

  const removePhoto = async (p: Photo) => {
    setSelected(null);
    if (!(await confirm("Rasmni o'chirish", "Rasm to'yxona galereyasidan va Cloudinary'dan o'chiriladi.", { ok: "O'chirish", destructive: true }))) return;
    try {
      await remove(p.id!);
    } catch (e) {
      notify("Rasm o'chirilmadi", errorMessage(e));
    }
  };

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']} footer={<Button title={progress ? `Yuklanmoqda ${progress.i}/${progress.n} · ${progress.pct}%` : "Rasm qo'shish"} icon="images-outline" onPress={addPhotos} loading={!!progress} disabled={photos.length >= MAX} />}>
      <PageHeader title="To'yxona rasmlari" subtitle={`${photos.length} / ${MAX} · birinchi rasm — muqova`} back />
      {loading ? <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.lg }} /> : null}
      <FlatList
        data={photos}
        numColumns={COLS}
        key={COLS}
        keyExtractor={(p) => p.id ?? p.url}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{ gap: GAP, paddingBottom: Spacing.md }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={loading ? null : <EmptyState icon="images-outline" title={error ?? "Hali rasm yo'q"} hint="Yaxshi rasmlar mijozlarni jalb qiladi: zal, stollar, sahna, kirish." />}
        renderItem={({ item, index }) => (
          <Pressable onPress={() => setSelected(item)} accessibilityRole="imagebutton" accessibilityLabel={`${index + 1}-rasm${item.isCover ? ' (muqova)' : ''}`}>
            <Image source={item.thumbUrl} style={{ width: size, height: size, borderRadius: Radius.md, backgroundColor: Colors.surfaceMuted }} contentFit="cover" transition={150} />
            {item.isCover ? (
              <View style={styles.cover}>
                <Ionicons name="star" size={11} color={Colors.white} />
                <Text style={styles.coverText}>Muqova</Text>
              </View>
            ) : null}
          </Pressable>
        )}
      />
      <Sheet visible={!!selected} title="Rasm" onClose={() => setSelected(null)}>
        {selected ? (
          <>
            <Image source={selected.cardUrl} style={styles.preview} contentFit="cover" />
            {!selected.isCover ? <SheetOption label="Muqova qilish" hint="Mijozlar ilovasida birinchi bo'lib ko'rinadi" onPress={() => void makeCover(selected)} /> : null}
            <SheetOption label="O'chirish" destructive onPress={() => void removePhoto(selected)} />
          </>
        ) : null}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cover: { position: 'absolute', left: 6, top: 6, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.primary, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3 },
  coverText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  preview: { height: 190, borderRadius: Radius.md, marginBottom: Spacing.md, backgroundColor: Colors.surfaceMuted },
});
