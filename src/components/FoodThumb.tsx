import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Photo } from '../types';

/** Taom / menyu rasmi: Cloudinary rasmi bo'lsa shuni, bo'lmasa gradient plitkani ko'rsatadi. */
export function FoodThumb({ size = 64, seed = 0, photo }: { size?: number; seed?: number; photo?: Photo | null }) {
  const palettes: [string, string][] = [
    ['#F2B866', '#C0702A'],
    ['#E9A15A', '#9C4E1E'],
    ['#F5C77E', '#B5652B'],
    ['#E4B07A', '#8E4F25'],
  ];
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      {photo ? (
        <Image source={size > 80 ? photo.cardUrl : photo.thumbUrl} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} accessibilityIgnoresInvertColors />
      ) : (
        <>
          <LinearGradient colors={palettes[seed % palettes.length]} style={StyleSheet.absoluteFill} />
          <Ionicons name="restaurant" size={size * 0.42} color="rgba(255,255,255,0.92)" />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
});
