import type { NativeStackNavigatorCreateProps } from '../fork/native-stack/createNativeStackNavigator';
import type { ParamListBase, StackNavigationState } from '../react-navigation/native';
import type { StandardNavigatorCreatePropsFactoryDeps } from '../standard-navigation/types';
/**
 * Creates the props required to integrate Expo Router's native stack navigator.
 *
 * @param args The navigation state and dispatch functions provided to a `createProps`
 * factory.
 * @returns The native stack navigator props.
 *
 * @example
 * ```tsx
 * import {
 *   createNativeStackProps,
 *   StackRouter,
 *   integrateWithRouter,
 * } from 'expo-router';
 * import { navigator } from './navigator';
 *
 * export const Stack = integrateWithRouter(navigator, StackRouter, {
 *   createProps: createNativeStackProps,
 * });
 * ```
 */
export declare function createNativeStackProps(args: StandardNavigatorCreatePropsFactoryDeps<StackNavigationState<ParamListBase>>): NativeStackNavigatorCreateProps;
