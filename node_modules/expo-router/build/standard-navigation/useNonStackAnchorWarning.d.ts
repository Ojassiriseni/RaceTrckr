import type { TabRouterOptions } from '../react-navigation/native';
/**
 * Warns once per layout when a non-stack navigator's layout sets an anchor, but its
 * `backBehavior` is not `initialRoute`.
 */
export declare const useNonStackAnchorWarning: (backBehavior?: TabRouterOptions["backBehavior"]) => void;
