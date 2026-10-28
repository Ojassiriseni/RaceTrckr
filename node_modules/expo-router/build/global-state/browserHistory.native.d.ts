import type { NavigationState } from '../react-navigation/routers';
import type { BrowserHistory, BrowserHistoryProjection, BrowserHistoryRestore } from './browserHistory.types';
export declare function createBrowserHistory(): BrowserHistoryProjection;
export declare function applyRouterHistoryAction(history: BrowserHistory): BrowserHistoryProjection;
export declare function updateCurrentHistoryEntry(history: BrowserHistory): BrowserHistoryProjection;
export declare function restoreNavigationFromBrowser<Result extends {
    state: NavigationState;
}>(history: BrowserHistory, result: Result): BrowserHistoryRestore<Result>;
