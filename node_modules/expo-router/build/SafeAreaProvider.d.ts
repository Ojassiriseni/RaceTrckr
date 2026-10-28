import type { RefAttributes } from 'react';
import { View } from 'react-native';
import { type SafeAreaProviderProps } from 'react-native-safe-area-context';
declare function WebSafeAreaProvider({ children, initialMetrics: _initialMetrics, initialSafeAreaInsets: _initialSafeAreaInsets, style, ...props }: SafeAreaProviderProps & RefAttributes<View>): import("react").JSX.Element;
export declare const SafeAreaProvider: typeof WebSafeAreaProvider;
export {};
