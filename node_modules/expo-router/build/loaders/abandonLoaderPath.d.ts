import type { LoaderContextValue } from './LoaderContext';
/** Abandons an unobserved pending loader without disturbing settled or replacement state. */
export declare function abandonLoaderPath({ client, store }: LoaderContextValue, path: string): void;
/** Defers abandonment so effect cleanup/setup handoffs can retain the loader in the same turn. */
export declare function scheduleAbandonLoaderPath(ctx: LoaderContextValue, path: string): () => void;
