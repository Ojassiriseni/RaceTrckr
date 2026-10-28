import type { UrlObject } from '../global-state/getRouteInfoFromState';
/** Resolves the route context and current route info to the loader request/store key. */
export declare function resolveLoaderPath(contextKey: string, routeInfo: UrlObject | undefined): string;
