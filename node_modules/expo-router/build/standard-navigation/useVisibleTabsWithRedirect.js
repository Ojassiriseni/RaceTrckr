"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useVisibleTabsWithRedirect", {
    enumerable: true,
    get: function() {
        return useVisibleTabsWithRedirect;
    }
});
function _react() {
    const data = require("react");
    _react = function() {
        return data;
    };
    return data;
}
const _Route = require("../Route");
const _constants = require("../constants");
const _useRouterActions = require("../global-state/useRouterActions");
const _GuardContext = require("../layouts/GuardContext");
const _PreviewRouteContext = require("../link/preview/PreviewRouteContext");
const _native = require("../react-navigation/native");
const _routeNode = require("../routeNode");
const _orderRoutesByRouteNames = require("../utils/orderRoutesByRouteNames");
const _useBuildHref = require("./useBuildHref");
function useVisibleTabsWithRedirect({ routes, routeNames, focusedRouteKey, descriptors }) {
    const buildHref = (0, _useBuildHref.useBuildHref)();
    const router = (0, _useRouterActions.useRouterActions)();
    const isPreview = (0, _PreviewRouteContext.useIsPreview)();
    const isFocused = (0, _native.useIsFocused)();
    const routeNode = (0, _Route.useRouteNode)();
    const focusedRoute = routes.find((route)=>route.key === focusedRouteKey);
    const guardRedirect = (0, _GuardContext.useGuardRedirect)(focusedRoute?.name ?? '');
    const visibleRoutes = (0, _react().useMemo)(()=>(0, _orderRoutesByRouteNames.orderRoutesByRouteNames)(routes, routeNames).filter((route)=>{
            // Every filesystem route is registered in state; only routes declared by a non-hidden
            // trigger become tab items.
            const descriptor = descriptors[route.key];
            return isDeclaredInLayout(descriptor) && descriptor?.options?.hidden !== true;
        }), [
        routes,
        routeNames,
        descriptors
    ]);
    const visibleFocusedIndex = (0, _react().useMemo)(()=>visibleRoutes.findIndex((route)=>route.key === focusedRouteKey), [
        focusedRouteKey,
        visibleRoutes
    ]);
    const focusedFallbackRoute = visibleFocusedIndex < 0 && focusedRoute?.name === _constants.NOT_FOUND_ROUTE_NAME ? focusedRoute : undefined;
    // TODO(@ubax): https://github.com/expo/expo/pull/48618#discussion_r3735996409
    const focusedIndex = visibleFocusedIndex;
    const initialRouteName = (0, _routeNode.getValidInitialRouteName)(routeNode);
    const redirectHref = (0, _react().useMemo)(()=>{
        if (guardRedirect !== undefined) {
            return guardRedirect;
        }
        const redirectRoute = visibleRoutes.find((route)=>route.name === initialRouteName) ?? visibleRoutes[0];
        if (redirectRoute) {
            return buildHref(redirectRoute);
        }
        return null;
    }, [
        buildHref,
        guardRedirect,
        initialRouteName,
        visibleRoutes
    ]);
    (0, _react().useEffect)(()=>{
        // TODO(@ubax): Consider throwing in __DEV__ instead of warning.
        // TODO: Skip this during HMR while placeholder descriptors lack `routeSource`.
        if (__DEV__ && visibleRoutes.length === 0 && guardRedirect === undefined) {
            const undeclaredRoutes = routes.filter((route)=>!isDeclaredInLayout(descriptors[route.key])).map((route)=>route.name).join(', ');
            console.warn(`No screens are declared in ${routeNode?.contextKey ?? 'the layout'}, so the navigator renders nothing. ` + 'Only screens declared in the layout become visible. ' + 'Declare each screen you want to show, for example <Tabs.Screen name="index" /> or <NativeTabs.Trigger name="index" />. ' + `Undeclared routes: ${undeclaredRoutes}.`);
        }
    // Route names are diagnostic; only rerun when the warning's eligibility changes.
    }, [
        guardRedirect,
        routeNode?.contextKey,
        visibleRoutes.length
    ]);
    (0, _react().useEffect)(()=>{
        // The focused route can be hidden or have no trigger at all — for example a path pointing at a
        // route without a tab, or a trigger hidden while focused. Redirect to the router's initial tab,
        // falling back to the first visible tab. `replace` keeps the unreachable route out of history.
        // TODO(@ubax): Show a formsheet for hidden tabs which are focused (Tabs + Stack in one).
        if (!isPreview && isFocused && visibleFocusedIndex < 0 && focusedFallbackRoute === undefined && redirectHref != null) {
            router.replace(redirectHref);
        }
    }, [
        focusedFallbackRoute,
        isFocused,
        isPreview,
        redirectHref,
        router,
        visibleFocusedIndex
    ]);
    return {
        visibleRoutes,
        focusedIndex,
        focusedFallbackRoute
    };
}
function isDeclaredInLayout(descriptor) {
    return descriptor?.routeSource === 'layout';
}

//# sourceMappingURL=useVisibleTabsWithRedirect.js.map
