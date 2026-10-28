import type { NavigationState, RouterBrowserHistoryAction } from './types';
type StateWithHistory = Omit<NavigationState, 'history'> & {
    history?: readonly {
        type: string;
        key?: string;
    }[];
};
/** Maps entries added or removed by a tab or drawer router to browser navigation. */
export declare function getBrowserHistoryForHistoryChange(previous: StateWithHistory, next: StateWithHistory): RouterBrowserHistoryAction | undefined;
export {};
