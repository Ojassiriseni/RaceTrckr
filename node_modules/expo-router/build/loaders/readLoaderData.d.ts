import type { LoaderContextValue } from './LoaderContext';
type LoaderFetcher<T> = (path: string, requestInit: RequestInit) => Promise<T>;
export declare function readLoaderData<T>({ client, store }: LoaderContextValue, resolvedPath: string, fetcher: LoaderFetcher<T>): T | Promise<T>;
export {};
