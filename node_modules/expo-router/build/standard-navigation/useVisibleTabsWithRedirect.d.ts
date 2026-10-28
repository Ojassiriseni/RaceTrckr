import { type Descriptor, type ParamListBase, type RouteProp } from '../react-navigation/native';
import type { StandardNavigatorDescriptor } from './types';
export type TabRoute = RouteProp<ParamListBase, string>;
export type TabDescriptor<Options extends object> = Partial<Pick<StandardNavigatorDescriptor<Options>, 'routeSource' | 'options' | 'render'> & Pick<Descriptor<Options, never, RouteProp<ParamListBase, string>>, 'route'>>;
/**
 * Returns the visible layout tabs and their focused index. When the navigator is focused, redirects
 * an unavailable focused route to the layout's initial route or the first visible tab.
 */
export declare function useVisibleTabsWithRedirect<Route extends TabRoute, Options extends {
    hidden?: boolean;
}>({ routes, routeNames, focusedRouteKey, descriptors, }: {
    routes: Route[];
    routeNames: string[];
    focusedRouteKey: string | undefined;
    descriptors: Record<string, TabDescriptor<Options>>;
}): {
    visibleRoutes: Route[];
    focusedIndex: number;
    focusedFallbackRoute: Route | undefined;
};
