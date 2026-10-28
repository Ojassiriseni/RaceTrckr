import { LoaderClient } from './LoaderClient';
import { LoaderSuspenseStore } from './LoaderSuspenseStore';
export interface LoaderContextValue {
    client: LoaderClient;
    store: LoaderSuspenseStore;
}
export declare function createLoaderContextValue(client: LoaderClient): LoaderContextValue;
export declare const defaultLoaderContextValue: LoaderContextValue;
export declare const LoaderContext: import("react").Context<LoaderContextValue>;
