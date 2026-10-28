type LoaderFetcher = (path: string, requestInit: RequestInit) => Promise<unknown>;
export type LoaderResult = {
    data: unknown;
} | {
    error: unknown;
};
type LoaderSubscriber = (result: LoaderResult, isCurrentSource: boolean) => void;
export type LoaderUnsubscribe = (onSourceTeardown?: () => void) => void;
/**
 * Coordinates loader execution, deduplication, and source subscriptions.
 *
 * Suspense state belongs to the React integration layer; this client must not access or mutate
 * `LoaderSuspenseStore`.
 */
export declare class LoaderClient {
    private active;
    private fetchers;
    subscribeLoader(path: string, callback?: LoaderSubscriber, { committed }?: {
        committed?: boolean;
    }): LoaderUnsubscribe;
    registerFetcher(path: string, fetcher: LoaderFetcher): void;
    /** Aborts and detaches a source unless a committed reader still owns it. */
    abort(path: string): boolean;
    execute(path: string, fetcher?: LoaderFetcher): void;
    revalidate(): ReadonlySet<string>;
    clear(): void;
    private getOrCreateSource;
    private scheduleTeardown;
    private abortSourceRequest;
    private settle;
}
export {};
