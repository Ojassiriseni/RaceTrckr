import type { MatchedRoute } from 'expo-server/private';
export type MatchedRouteParams = Record<string, string | string[]>;
/** The `pathname`, `params`, and `searchParams` for a route the server matched. */
export declare function getRouteInfoForMatchedRoute(route: Pick<MatchedRoute, 'page' | 'generated'>, params: MatchedRouteParams, location: URL): {
    pathname: string;
    params: import("..").UnknownOutputParams;
    searchParams: URLSearchParams;
};
