import type { RouteNode } from './Route';
import type { PartialRoute, Route as NavigationRoute } from './react-navigation/routers';
export declare function findRouteNodeByName(node: RouteNode | null | undefined, name: string | undefined): RouteNode | undefined;
export declare function findRouteNodeAndParamsForState(node: RouteNode | null | undefined, state: PartialRoute<NavigationRoute<string>>['state']): {
    routeNode: RouteNode | undefined;
    params: Record<string, unknown>;
};
export declare function getValidInitialRoute(node: RouteNode | null): RouteNode | undefined;
export declare const getValidInitialRouteName: (node: RouteNode | null) => string | undefined;
