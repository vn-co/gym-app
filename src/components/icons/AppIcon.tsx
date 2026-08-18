import type { ReactNode } from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import type { NavigationIconName } from '../../constants/navigation';

export type AppIconName =
  | NavigationIconName
  | 'add'
  | 'check'
  | 'pause'
  | 'play'
  | 'more'
  | 'dumbbell';

interface AppIconProps {
  name: AppIconName;
  size?: number;
  color: string;
  strokeWidth?: number;
}

function getIcon(name: AppIconName, color: string): ReactNode {
  switch (name) {
    case 'home':
      return (
        <>
          <Path d="M3.5 10.5 12 3.75l8.5 6.75" />
          <Path d="M5.5 9.5v10h13v-10M9.5 19.5v-6h5v6" />
        </>
      );
    case 'workout':
    case 'dumbbell':
      return (
        <>
          <Line x1="7" y1="12" x2="17" y2="12" />
          <Rect x="3.5" y="8.5" width="3.5" height="7" rx="1" />
          <Rect x="17" y="8.5" width="3.5" height="7" rx="1" />
          <Line x1="2" y1="10" x2="2" y2="14" />
          <Line x1="22" y1="10" x2="22" y2="14" />
        </>
      );
    case 'routines':
      return (
        <>
          <Circle cx="5" cy="6" r="1" fill={color} stroke="none" />
          <Circle cx="5" cy="12" r="1" fill={color} stroke="none" />
          <Circle cx="5" cy="18" r="1" fill={color} stroke="none" />
          <Line x1="9" y1="6" x2="20" y2="6" />
          <Line x1="9" y1="12" x2="20" y2="12" />
          <Line x1="9" y1="18" x2="20" y2="18" />
        </>
      );
    case 'progress':
      return (
        <>
          <Path d="M4 19V5" />
          <Path d="M4 19h16" />
          <Path d="m7 15 4-4 3 2 5-6" />
          <Path d="M15.5 7H19v3.5" />
        </>
      );
    case 'library':
      return (
        <>
          <Rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
          <Rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
          <Rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
          <Rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
        </>
      );
    case 'add':
      return (
        <>
          <Line x1="12" y1="5" x2="12" y2="19" />
          <Line x1="5" y1="12" x2="19" y2="12" />
        </>
      );
    case 'check':
      return <Path d="m5 12.5 4.25 4.25L19 7" />;
    case 'pause':
      return (
        <>
          <Rect x="6.5" y="5" width="4" height="14" rx="1" />
          <Rect x="13.5" y="5" width="4" height="14" rx="1" />
        </>
      );
    case 'play':
      return <Path d="m8.5 5.5 10 6.5-10 6.5Z" />;
    case 'more':
      return (
        <>
          <Circle cx="5" cy="12" r="1.25" fill={color} stroke="none" />
          <Circle cx="12" cy="12" r="1.25" fill={color} stroke="none" />
          <Circle cx="19" cy="12" r="1.25" fill={color} stroke="none" />
        </>
      );
  }
}

export function AppIcon({
  name,
  size = 24,
  color,
  strokeWidth = 1.8,
}: AppIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {getIcon(name, color)}
    </Svg>
  );
}
