import { type CommonNavigationAction, type ParamListBase, type StackActionType, type StackNavigationState } from '../react-navigation/native';
import type { NativeStackNavigatorProps } from '../react-navigation/native-stack';
/**
 * React Navigation matches a screen by its name or a 'getID' function that uniquely identifies a screen.
 * When a screen has been uniquely identified, the Stack can only have one instance of that screen.
 *
 * Expo Router allows for a screen to be matched by name and path params, a 'getID' function or a singular id.
 *
 * Instead of reimplementing the entire StackRouter, we can override the getStateForAction method to handle the singular screen logic.
 *
 */
export declare const stackRouterOverride: NonNullable<NativeStackNavigatorProps['UNSTABLE_router']>;
export declare const StackRouter: (options: import("..").StackRouterOptions) => import("..").ExtendedRouter<StackNavigationState<ParamListBase>, CommonNavigationAction | StackActionType>;
