import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { Colors } from '../../theme';

/** Lokma brend belgisi (gumbaz + ravoq). Ilova ikonkasi bilan bir xil geometriya. */
export function LogoMark({ size = 48, color }: { size?: number; color?: string }) {
  const stroke = color ?? 'url(#lokmaGold)';
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="Lokma logotipi">
      <Defs>
        <LinearGradient id="lokmaGold" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#D9AE5A" />
          <Stop offset="1" stopColor="#A8741F" />
        </LinearGradient>
      </Defs>
      <G fill="none" stroke={stroke} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M50 4 L50 13" />
        <Path d="M24 88 L24 50 C24 34 40 27 50 15 C60 27 76 34 76 50 L76 88" />
        <Path d="M37 88 L37 63 C37 54 44 48 50 44 C56 48 63 54 63 63 L63 88" />
        <Path d="M15 88 L85 88" />
      </G>
      <Circle cx={50} cy={4} r={3.2} fill={stroke} />
    </Svg>
  );
}

interface LogoProps {
  size?: 'sm' | 'lg';
  /** row — bosh sahifa sarlavhasi; column — login ekrani */
  layout?: 'row' | 'column';
}

export function Logo({ size = 'lg', layout = 'column' }: LogoProps) {
  const lg = size === 'lg';
  return (
    <View style={[layout === 'row' ? styles.row : styles.col]} accessibilityRole="header">
      <LogoMark size={lg ? 76 : 34} />
      <View style={layout === 'row' ? styles.textRow : styles.textCol}>
        <Text style={[styles.brand, lg ? styles.brandLg : styles.brandSm]}>Lokma</Text>
        <Text style={[styles.sub, lg ? styles.subLg : styles.subSm]}>To&apos;yxonalar</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  col: { alignItems: 'center' },
  textRow: {},
  textCol: { alignItems: 'center', marginTop: 6 },
  brand: { fontFamily: 'PlayfairDisplay_700Bold', color: Colors.primaryDark },
  brandLg: { fontSize: 40, lineHeight: 48 },
  brandSm: { fontSize: 20, lineHeight: 24 },
  sub: { fontFamily: 'PlayfairDisplay_400Regular', color: Colors.text },
  subLg: { fontSize: 20, letterSpacing: 1, marginTop: -4 },
  subSm: { fontSize: 12, marginTop: -2 },
});
