import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

/** Taom fotosurati o'rnidagi plitka (backend rasm bersa expo-image bilan almashtiriladi). */
export function FoodThumb({ size = 64, seed = 0 }: { size?: number; seed?: number }) {
  const palettes: [string, string][] = [
    ['#F2B866', '#C0702A'],
    ['#E9A15A', '#9C4E1E'],
    ['#F5C77E', '#B5652B'],
    ['#E4B07A', '#8E4F25'],
  ];
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      <LinearGradient colors={palettes[seed % palettes.length]} style={StyleSheet.absoluteFill} />
      <Ionicons name="restaurant" size={size * 0.42} color="rgba(255,255,255,0.92)" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
