import type { NavigationHelpers } from '../react-navigation/core/types';
import type { NavigationState, ParamListBase } from '../react-navigation/native';
/**
 * Saves the tab that Back goes to in the `history` of the navigation state, which
 * `useRootNavigationState` and `navigation.getState()` return. Call it once in the content of a
 * custom navigator that uses `TabRouter`. The built-in tab and drawer navigators already call it.
 *
 * @param navigator The `state` and `navigation` of the navigator. Pass them when the hook runs
 * outside the navigator's `NavigationContent`. Defaults to the closest navigator.
 *
 * @example
 * ```tsx
 * import { unstable_useReconcileTabHistory } from 'expo-router';
 *
 * function MyTabsContent({ state, descriptors }) {
 *   unstable_useReconcileTabHistory();
 *   // ...
 * }
 * ```
 */
export declare function useReconcileTabHistory(navigator?: {
    state: NavigationState;
    navigation: NavigationHelpers<ParamListBase>;
}): void;
