// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'magnifyingglass': 'search',
  'cart.fill': 'shopping-cart',
  'cart': 'shopping-cart',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.left': 'chevron-left',
  'chevron.right': 'chevron-right',
  'calendar': 'event',
  'gearshape.fill': 'settings',
  'person.circle': 'account-circle',
  'person.circle.fill': 'account-circle',
  'lock.shield.fill': 'security',
  'arrow.right.square': 'exit-to-app',
  'paintbrush.fill': 'brush',
  'checkmark': 'check',
  'trash': 'delete',
  'location': 'location-on',
  'location.fill': 'location-on',
  'creditcard': 'credit-card',
  'creditcard.fill': 'credit-card',
  'leaf.fill': 'eco',
  'list.bullet.rectangle': 'receipt-long',
  'arrow.triangle.2.circlepath': 'autorenew',
  'rectangle.portrait.and.arrow.right': 'logout',
  'person.fill': 'person',
  'arrow.clockwise': 'autorenew',
  'checkmark.circle.fill': 'check-circle',
  'circle': 'radio-button-unchecked',
  'xmark': 'close',
  'pencil': 'edit',
  'list.bullet': 'list',
  'leaf': 'eco'
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
