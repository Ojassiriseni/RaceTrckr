import type { NavigationState } from './types';
export declare const ROOT_CHAIN = "root";
export declare function createNavigatorStateKey(parentChain: string): string;
export declare function getChainFromRouteKey(routeKey: string): string;
export declare function getChainFromStateKey(stateKey: string): string;
export declare function createRouteKeyMinter(state: Pick<NavigationState, 'key' | 'routeKeySeq'>): {
    mint: (name: string) => string;
    readonly routeKeySeq: number;
};
