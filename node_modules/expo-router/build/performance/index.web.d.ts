import type { RouterPerformanceMarkByName, RouterPerformanceMarkName } from './types';
export type * from './types';
export { isEnabled, unstable_enablePerformanceIntegration } from './enable';
export declare function mark<Name extends RouterPerformanceMarkName>(name: Name, detail: RouterPerformanceMarkByName<Name>['detail']): void;
export declare const unstable_performance: Performance;
export declare const unstable_PerformanceObserver: {
    new (callback: PerformanceObserverCallback): PerformanceObserver;
    prototype: PerformanceObserver;
    readonly supportedEntryTypes: ReadonlyArray<string>;
};
