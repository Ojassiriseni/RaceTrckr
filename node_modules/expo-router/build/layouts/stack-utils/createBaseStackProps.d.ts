import type { ParamListBase, StackNavigationState } from '../../react-navigation/native';
import type { StandardNavigatorCreatePropsFactoryDeps } from '../../standard-navigation/types';
/**
 * Creates the shared props for integrating a stack navigator with Expo Router.
 *
 * @param dependencies The navigation state and dispatch functions provided to a `createProps`
 * factory.
 * @returns The shared stack navigator props.
 *
 * @example
 * ```tsx
 * import { createBaseStackProps, StackRouter, integrateWithRouter } from 'expo-router';
 * import { navigator } from './navigator';
 *
 * export const Stack = integrateWithRouter(navigator, StackRouter, {
 *   createProps: createBaseStackProps,
 * });
 * ```
 */
export declare function createBaseStackProps({ dispatchSync, isPreloaded, isRemovalPrevented, navigation, state, }: StandardNavigatorCreatePropsFactoryDeps<StackNavigationState<ParamListBase>>): {
    isPreloaded: (key: string) => boolean;
    isRemovalPrevented: (key: string) => boolean;
    pop: (count: number, sourceRouteKey: string) => void;
    subscribePopToTopOnParentTabPress: () => any;
};
