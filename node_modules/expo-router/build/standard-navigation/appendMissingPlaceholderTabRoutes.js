"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    appendMissingPlaceholderTabDescriptors: null,
    appendMissingPlaceholderTabRoutes: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get appendMissingPlaceholderTabDescriptors () {
        return appendMissingPlaceholderTabDescriptors;
    },
    get appendMissingPlaceholderTabRoutes () {
        return appendMissingPlaceholderTabRoutes;
    }
});
function appendMissingPlaceholderTabDescriptors(descriptors, state, describe) {
    const missingRouteNames = state.routeNames.filter((name)=>!state.routes.some((route)=>route.name === name));
    if (missingRouteNames.length === 0) {
        return descriptors;
    }
    const placeholderDescriptors = missingRouteNames.reduce((result, name)=>{
        result[name] = describe({
            key: undefined,
            name
        });
        return result;
    }, {});
    return {
        ...descriptors,
        ...placeholderDescriptors
    };
}
function appendMissingPlaceholderTabRoutes(state, descriptors) {
    const hasMissingRoute = state.routeNames.some((name)=>!state.routes.some((route)=>route.name === name));
    if (!hasMissingRoute) {
        return state;
    }
    const focusedKey = state.routes[state.index]?.key;
    const routes = state.routeNames.map((name)=>{
        const existingRoute = state.routes.find((route)=>route.name === name);
        if (existingRoute) {
            return existingRoute;
        }
        return createPlaceholderRoute(name, descriptors);
    });
    const index = Math.max(0, routes.findIndex((route)=>route.key === focusedKey));
    return {
        ...state,
        index,
        routes
    };
}
function createPlaceholderRoute(name, descriptors) {
    const descriptor = descriptors[name];
    if (!descriptor) {
        throw new Error(`Could not find a descriptor for route "${name}". This is most likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues.`);
    }
    return {
        ...descriptor.route,
        key: name,
        name
    };
}

//# sourceMappingURL=appendMissingPlaceholderTabRoutes.js.map
