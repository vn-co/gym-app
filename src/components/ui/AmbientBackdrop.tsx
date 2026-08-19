import { StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { Colors } from '../../constants/tokens';

interface AmbientBackdropProps {
  intensity?: 'quiet' | 'hero';
}

export function AmbientBackdrop({
  intensity = 'quiet',
}: AmbientBackdropProps) {
  const topOpacity = intensity === 'hero' ? 0.24 : 0.14;
  const lowerOpacity = intensity === 'hero' ? 0.13 : 0.08;

  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 390 844"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <RadialGradient id="topField" cx="0.08" cy="0.02" r="0.72">
            <Stop
              offset="0"
              stopColor={Colors.accent}
              stopOpacity={topOpacity}
            />
            <Stop offset="0.42" stopColor={Colors.accentDim} stopOpacity={0.07} />
            <Stop offset="1" stopColor={Colors.bg} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="lowerField" cx="0.92" cy="0.76" r="0.7">
            <Stop
              offset="0"
              stopColor={Colors.accentSoft}
              stopOpacity={lowerOpacity}
            />
            <Stop offset="0.5" stopColor={Colors.accentDim} stopOpacity={0.04} />
            <Stop offset="1" stopColor={Colors.bg} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="-90" y="-120" width="470" height="520" fill="url(#topField)" />
        <Rect x="40" y="330" width="440" height="570" fill="url(#lowerField)" />
      </Svg>
    </View>
  );
}
