/**
 * Drops routes absent from `routeNames` and returns `routes` unchanged when already ordered.
 */
export declare function orderRoutesByRouteNames<Route extends {
    name: string;
}>(routes: Route[], routeNames: string[]): Route[];
