import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G, Path } from 'react-native-svg';

/**
 * Zal fotosurati o'rnini bosuvchi dekorativ fon (iliq, oltin tonlar, qandil siluetlari).
 * Backend to'yxona rasmlarini bersa — `expo-image` bilan almashtiriladi.
 */
export function HallBanner({ style, children }: { style?: StyleProp<ViewStyle>; children?: React.ReactNode }) {
  return (
    <View style={[styles.wrap, style]}>
      <LinearGradient
        colors={['#3B2A14', '#6B4A1E', '#2A1E10']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice">
        <G opacity={0.55}>
          {[60, 160, 260].map((x) => (
            <G key={x}>
              <Path d={`M${x} 0 L${x} 22`} stroke="#E8C77E" strokeWidth={1} />
              <Path
                d={`M${x - 26} 30 Q${x} 52 ${x + 26} 30 M${x - 18} 40 Q${x} 58 ${x + 18} 40`}
                stroke="#F2D9A0"
                strokeWidth={1.4}
                fill="none"
              />
              {[-26, -13, 0, 13, 26].map((dx) => (
                <Circle key={dx} cx={x + dx} cy={32 + Math.abs(dx) * -0.1 + 8} r={2.2} fill="#FFE7AE" />
              ))}
            </G>
          ))}
        </G>
        {Array.from({ length: 18 }, (_, i) => (
          <Circle
            key={i}
            cx={(i * 53) % 320}
            cy={70 + ((i * 37) % 80)}
            r={1 + (i % 3)}
            fill="#FFE2A0"
            opacity={0.18 + (i % 4) * 0.08}
          />
        ))}
        <Path d="M0 160 Q80 120 160 135 T320 125 L320 160 Z" fill="#000" opacity={0.18} />
      </Svg>
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.55)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0.3 }}
        end={{ x: 0, y: 1 }}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', borderRadius: 18 },
});
