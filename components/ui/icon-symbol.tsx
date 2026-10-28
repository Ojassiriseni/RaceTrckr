// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';
import { type OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

const MAPPING: Record<string, ComponentProps<typeof MaterialIcons>['name']> = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chart.bar.fill': 'bar-chart',
  'person.fill': 'person',
  'gauge.badge.plus': 'speed',
  'flag.checkered': 'flag',
  'car.fill': 'directions-car',
  'route': 'route'
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight,
}: {
  name: string;
  size?: number;
  color?: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: string;
}) {
  const mappedName = (MAPPING[name] ?? 'home') as ComponentProps<typeof MaterialIcons>['name'];
  return <MaterialIcons color={color ?? '#F4F6FA'} size={size} name={mappedName} style={style} />;
}
