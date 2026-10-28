import type { ParamListBase, Route, StackNavigationState } from '../../native';
import { CommonActions } from '../../native';
export declare function makeRestoreRouteAction(dispatchSync: (action: ReturnType<typeof CommonActions.reset>) => void, state: StackNavigationState<ParamListBase>): (route: Route<string>) => boolean;
