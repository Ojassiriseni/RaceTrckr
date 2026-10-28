"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "makeRestoreRouteAction", {
    enumerable: true,
    get: function() {
        return makeRestoreRouteAction;
    }
});
const _native = require("../../native");
function makeRestoreRouteAction(dispatchSync, state) {
    return (route)=>{
        if (!state.routeNames.includes(route.name)) {
            return false;
        }
        const activeRoutes = state.routes.slice(0, state.index + 1).filter((currentRoute)=>currentRoute.key !== route.key);
        const preloadedRoutes = state.routes.slice(state.index + 1).filter((currentRoute)=>currentRoute.key !== route.key);
        const routes = [
            ...activeRoutes,
            route
        ];
        dispatchSync(_native.CommonActions.reset({
            ...state,
            routes: routes.concat(preloadedRoutes),
            index: routes.length - 1
        }));
        return true;
    };
}

//# sourceMappingURL=makeRestoreRouteAction.js.map
