type SuspenseEntry = {
    data: unknown;
} | {
    error: unknown;
} | Promise<unknown>;
/**
 * Stores pending and settled loader reads for React Suspense.
 *
 * Disposal marks an entry reclaimable, teardown confirms its removal, and a replacement written
 * between them cancels reclamation.
 */
export declare class LoaderSuspenseStore {
    private entries;
    private reclaim;
    get<T = unknown>(key: string): {
        data: T;
    } | {
        error: unknown;
    } | Promise<T> | undefined;
    set(key: string, entry: SuspenseEntry): void;
    seed(key: string, data: unknown): void;
    clear(key: string): void;
    dispose(key: string): void;
    teardown(key: string): void;
    retain(livePaths: ReadonlySet<string>): void;
    reset(): void;
}
export {};
