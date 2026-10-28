type Route = {
    key: string;
    name: string;
};
type Descriptor = {
    route?: {
        key?: string;
    };
    options?: object;
};
export declare function usePreloadPlaceholderRoutes({ routes, descriptors, preload, lazyByDefault, }: {
    routes: Route[];
    descriptors: Record<string, Descriptor | undefined>;
    preload: (name: string) => void;
    /** Used when a route does not specify `options.lazy`. */
    lazyByDefault: boolean;
}): void;
export {};
