/**
 * Drops routes absent from `routeNames` and returns `routes` unchanged when already ordered.
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "orderRoutesByRouteNames", {
    enumerable: true,
    get: function() {
        return orderRoutesByRouteNames;
    }
});
function orderRoutesByRouteNames(routes, routeNames) {
    const orderedRoutes = routeNames.flatMap((name)=>{
        const route = routes.find((route)=>route.name === name);
        return route ? [
            route
        ] : [];
    });
    return orderedRoutes.length === routes.length && orderedRoutes.every((route, index)=>route === routes[index]) ? routes : orderedRoutes;
}

//# sourceMappingURL=orderRoutesByRouteNames.js.map
