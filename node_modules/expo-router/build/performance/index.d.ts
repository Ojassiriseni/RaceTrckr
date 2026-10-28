import type { RouterPerformanceMarkByName, RouterPerformanceMarkName } from './types';
export type * from './types';
export { isEnabled, unstable_enablePerformanceIntegration } from './enable';
export declare function mark<Name extends RouterPerformanceMarkName>(name: Name, detail: RouterPerformanceMarkByName<Name>['detail']): void;
/**
 * Reads the performance marks that Expo Router records during navigation. It has the
 * mark-related methods of the global
 * [`performance`](https://developer.mozilla.org/en-US/docs/Web/API/Performance) object. On web,
 * it is the global `performance` object, so `getEntries()` also returns entries that Expo Router
 * did not record.
 *
 * On native, Expo Router keeps the latest 250 marks. It also passes each mark to the global
 * `performance.mark()`, so the marks show in the React Native DevTools timeline.
 *
 * @experimental
 */
export declare const unstable_performance: Pick<Performance, 'getEntries' | 'getEntriesByName' | 'getEntriesByType' | 'clearMarks'>;
/**
 * Observes the performance marks that Expo Router records during navigation. On web, it is the
 * global [`PerformanceObserver`](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver).
 * On native, it implements the same API for `mark` entries. Unlike the React Native
 * `PerformanceObserver`, it keeps the `detail` of each mark.
 *
 * Check the `name` of an entry and cast it to the matching mark type, for example
 * `RouterPageFocusedMark`, to read its `detail`.
 *
 * @example
 * ```ts app/_layout.tsx
 * import {
 *   unstable_enablePerformanceIntegration,
 *   unstable_PerformanceObserver,
 *   type RouterPageFocusedMark,
 * } from 'expo-router';
 *
 * unstable_enablePerformanceIntegration();
 *
 * new unstable_PerformanceObserver((list) => {
 *   for (const entry of list.getEntriesByName('expo-router:page-focused')) {
 *     const { detail } = entry as RouterPageFocusedMark;
 *     console.log(entry.startTime, detail.pathname);
 *   }
 * }).observe({ type: 'mark', buffered: true });
 * ```
 *
 * @experimental
 */
export declare class unstable_PerformanceObserver implements PerformanceObserver {
    private readonly callback;
    static readonly supportedEntryTypes: readonly string[];
    constructor(callback: PerformanceObserverCallback);
    /**
     * Starts to observe marks. With `buffered: true`, the callback first receives the marks
     * recorded before this call.
     */
    observe(options?: PerformanceObserverInit): void;
    /**
     * Stops the observer from receiving marks.
     */
    disconnect(): void;
    /**
     * Always returns an empty list, because the callback receives each mark when it is recorded.
     */
    takeRecords(): PerformanceEntryList;
}
