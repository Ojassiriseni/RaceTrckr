import type { NavigationState } from '../routers';
type InitialStateOptions = {
    routeNames: string[];
    initialRouteName?: string;
    parentChain: string;
};
export declare function createInitialState<State extends NavigationState = NavigationState>({ routeNames, initialRouteName, parentChain, }: InitialStateOptions): State;
export {};
